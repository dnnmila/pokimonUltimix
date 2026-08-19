// Catálogo de Movimientos Max (Dynamax).
//
// La regla: al dinamaxizarse, CADA movimiento del Pokémon se convierte en el
// Movimiento Max de su mismo tipo, conservando su Fuerza de Ataque. Los
// movimientos con Fuerza 0 o menos se convierten en Max Guard (tipo Normal),
// sea cual sea su tipo. Al cambiar al Pokémon, vuelve a su forma base.
//
// Los Pokémon CON forma G-Max no pasan por aquí: suben con su token G-Max desde
// la pestaña «Especiales», que ya trae sus propios ataques en la DB (un
// movimiento G-Max propio + un Max normal). Ver `canDynamax`.
//
// Cómo se implementa, y por qué así:
//   - Es una TRANSFORMACIÓN, no ataques nuevos. `applyDynamax` devuelve una
//     COPIA del Pokémon con los tres ataques renombrados, igual que hace
//     `applyTera` con los tipos. La batalla ya lee `attack.name`, `.type` y
//     `.strength` en media docena de sitios (los seis bonos de `calculateBonus`,
//     el componente Attack, `computeExtra`): pasándole el objeto ya transformado
//     todo eso funciona sin tocarse.
//   - El `id` del ataque NO cambia a propósito. El espejo del máster resuelve el
//     ataque buscándolo por id dentro del Pokémon guardado en la partida (ver
//     Game.setBattleAttack); si el id cambiara, el espejo se quedaría sin ataque.
//     Misma decisión que en el Orbe Tera, que tampoco toca `id` ni `pokedex`.
//   - La tabla `attacks` de la DB ya tiene los 18 Max con poderes 2–6 más Max
//     Guard (IDATK «Max Flare 4», «Max Guard»...). No se consultan porque el
//     nombre es lo único que cambia y el poder se hereda del ataque base, pero
//     los nombres de aquí son EXACTAMENTE los de esas filas: si algún día hace
//     falta apuntar a la carta física, el id se arma como `Max <X> <fuerza>`.

import { getFieldMove } from '../battleRules';

// Los cuatro efectos que puede tener un Movimiento Max. El texto de las cartas
// de campo se completa con el nombre de la carta (ver `maxEffectText`).
const EFFECT_TEXT = {
    priority: {
        en: 'User gains Priority while Dynamaxed/Gigantamaxed.',
        es: 'El usuario gana Prioridad mientras esté Dynamax/Gigamax.',
    },
    advantage: {
        en: 'User gains Advantage while Dynamaxed/Gigantamaxed.',
        es: 'El usuario gana Ventaja mientras esté Dynamax/Gigamax.',
    },
    disadvantage: {
        en: 'Opponent Pokémon has Disadvantage for the rest of the battle or until switched out.',
        es: 'El Pokémon oponente tiene Desventaja el resto de la batalla o hasta ser cambiado.',
    },
    protection: {
        en: 'User gains Protection — this round the opponent\'s Attack Strength becomes 0 and all move effects targeting the user are ignored.',
        es: 'El usuario gana Protección — esta ronda la Fuerza del oponente es 0 y se ignoran los efectos que le apunten.',
    },
};

/**
 * Tipo del movimiento base → Movimiento Max que le toca.
 *
 * `field` es el id de la carta de campo de `battleRules.FIELD_MOVES`: la carta
 * la juega el jugador a mano en la mesa (la app no la pone sola), así que aquí
 * solo se guarda cuál es para poder cantarla en la interfaz.
 */
export const MAX_MOVES = {
    NORMAL:   { name: 'Max Strike',     kind: 'priority' },
    FIGHTING: { name: 'Max Knuckle',    kind: 'advantage' },
    FLYING:   { name: 'Max Airstream',  kind: 'priority' },
    POISON:   { name: 'Max Ooze',       kind: 'advantage' },
    GROUND:   { name: 'Max Quake',      kind: 'disadvantage' },
    ROCK:     { name: 'Max Rockfall',   kind: 'field', field: 'Sandstorm' },
    BUG:      { name: 'Max Flutterby',  kind: 'disadvantage' },
    GHOST:    { name: 'Max Phantasm',   kind: 'advantage' },
    STEEL:    { name: 'Max Steelspike', kind: 'disadvantage' },
    FIRE:     { name: 'Max Flare',      kind: 'field', field: 'Harsh Sunlight' },
    WATER:    { name: 'Max Geyser',     kind: 'field', field: 'Rain' },
    GRASS:    { name: 'Max Overgrowth', kind: 'field', field: 'Grassy Terrain' },
    ELECTRIC: { name: 'Max Lightning',  kind: 'field', field: 'Electric Terrain' },
    PSYCHIC:  { name: 'Max Mindstorm',  kind: 'field', field: 'Psychic Terrain' },
    ICE:      { name: 'Max Hailstorm',  kind: 'field', field: 'Hail' },
    DRAGON:   { name: 'Max Wyrmwind',   kind: 'disadvantage' },
    DARK:     { name: 'Max Darkness',   kind: 'advantage' },
    FAIRY:    { name: 'Max Starfall',   kind: 'field', field: 'Misty Terrain' },
};

/** Adonde van a parar los movimientos de Fuerza 0 o menos, sea cual sea su tipo. */
export const MAX_GUARD = { name: 'Max Guard', kind: 'protection', type: 'NORMAL' };

/**
 * El texto del efecto de un Movimiento Max, en el idioma pedido.
 * Para los de carta de campo se arma con el nombre y el emoji de la carta, que
 * ya viven en battleRules y así no se escriben dos veces.
 */
export const maxEffectText = (max, lang = 'es') => {
    if (!max) return '';
    if (max.kind === 'field') {
        const card = getFieldMove(max.field);
        const nombre = card ? (lang === 'es' ? card.es : card.id) : max.field;
        const emoji = card?.emoji ? `${card.emoji} ` : '';
        return lang === 'es'
            ? `Juega la carta de campo ${emoji}${nombre}.`
            : `Play the ${emoji}${nombre} Field Move card.`;
    }
    return EFFECT_TEXT[max.kind]?.[lang] || '';
};

// El hueco de attack3 vacío llega como {id:'000', name:'NONE'} y la interfaz lo
// esconde comparando el nombre. Convertirlo en Max Guard le pintaría al Pokémon
// un tercer movimiento que no tiene.
const isEmptySlot = (attack) => !attack || !attack.name || attack.name === 'NONE' || attack.id === '000';

/**
 * Un ataque convertido en su Movimiento Max.
 *
 * Devuelve una copia: mismo `id`, misma `strength`, nombre nuevo. Guarda además
 * `maxMove` (la ficha del efecto, para pintarla) y `baseName`/`baseType` (el
 * movimiento original, que hay que poder decir en voz alta en la mesa).
 *
 * Fuerza ≤ 0 → Max Guard: cambia también el tipo a NORMAL, que es lo que dice la
 * regla y lo que hace falta para que los bonos de efectividad salgan bien.
 */
export const maxMoveFor = (attack) => {
    if (isEmptySlot(attack)) return attack;

    const strength = Number(attack.strength) || 0;
    if (strength <= 0) {
        return {
            ...attack,
            name: MAX_GUARD.name,
            type: 'NORMAL',
            strength: 0,
            maxMove: MAX_GUARD,
            baseName: attack.name,
            baseType: attack.type,
        };
    }

    const max = MAX_MOVES[(attack.type || '').toUpperCase()];
    // Un tipo fuera de los 18 (o vacío) se queda como está en vez de romperse:
    // más vale un ataque sin convertir que un ataque sin nombre.
    if (!max) return attack;

    return {
        ...attack,
        name: max.name,
        maxMove: max,
        baseName: attack.name,
        baseType: attack.type,
    };
};

/**
 * ¿Este Pokémon puede subir en forma Dynamax?
 *
 * No pueden:
 *   - Los tokens G-Max (POKEDEX «GM…»): ya SON la forma dinamaxizada.
 *   - Las megas (POKEDEX «M…»): son la otra transformación, no se acumulan.
 *   - Los Pokémon que TIENEN forma G-Max (`gmaxPokedex`): esos suben con su
 *     token G-Max desde la pestaña «Especiales», no con ataques Max genéricos.
 */
export const canDynamax = (pkm) => {
    if (!pkm) return false;
    const dex = pkm.pokedex || '';
    if (dex.startsWith('GM')) return false;
    if (dex.startsWith('M'))  return false;
    if (pkm.gmaxPokedex)      return false;
    return true;
};

/**
 * El Pokémon tal y como sube a la batalla dinamaxizado.
 *
 * Copia con los tres ataques convertidos y la bandera `dynamaxActive`, que es lo
 * que consume la interfaz para pintar el aura y el rótulo. `id`, `pokedex`,
 * tipos y nivel no cambian: subir de nivel, marcar debilitado y el historial
 * siguen apuntando al Pokémon real, igual que con el Orbe Tera.
 */
export const applyDynamax = (pkm) => {
    if (!canDynamax(pkm)) return pkm;
    return {
        ...pkm,
        attack1: maxMoveFor(pkm.attack1),
        attack2: maxMoveFor(pkm.attack2),
        attack3: maxMoveFor(pkm.attack3),
        dynamaxActive: true,
    };
};

/** Los tres Max que le saldrían a este Pokémon, sin los huecos vacíos. */
export const previewMaxMoves = (pkm) => {
    if (!pkm) return [];
    return [pkm.attack1, pkm.attack2, pkm.attack3]
        .filter(a => !isEmptySlot(a))
        .map(maxMoveFor)
        .filter(a => a.maxMove);
};

/**
 * La tabla entera para la guía de reglas: un renglón por Movimiento Max, en el
 * mismo orden que la carta física (los 18 por tipo y Max Guard al final).
 */
export const MAX_MOVE_LIST = [
    ...Object.entries(MAX_MOVES).map(([type, max]) => ({ ...max, type })),
    { ...MAX_GUARD },
];

export default MAX_MOVES;
