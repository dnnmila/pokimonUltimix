// ─────────────────────────────────────────────────────────────────────────────
//  AJUSTA AQUÍ LOS VALORES DEL JUEGO
//  Balance de items y cartas de campo. Los textos y números salen de las cartas
//  físicas en frontend/src/images/Field Moves/.
// ─────────────────────────────────────────────────────────────────────────────

// Cuánto suma cada item adjunto al total. Las llaves son los valores que puede
// tomar pokemon.attach (ver ModalAttach). Poner 0 = el item no afecta el total.
export const ITEM_BONUS = {
    Protein: 1,
    Potion:  0,
    Claw:    0,
    MT:      0,   // el TM ya reemplaza el ataque 3
    Mega:    0,   // la mega ya cambia de forma
};

// ─── Cartas de campo ─────────────────────────────────────────────────────────
//
//  scope : 'global' afecta a los dos equipos | 'team' solo al equipo que la jugó
//  kind  : 'attack'      suma/resta a la fuerza del ataque según el TIPO DEL ATAQUE
//          'final'       suma/resta al valor final según el TIPO DEL POKÉMON
//          'stealthrock' regla propia de Stealth Rock (ver getStealthRockBonus)
//          'reminder'    no se calcula: se muestra y lo aplican los jugadores
//
//  Solo se calculan automáticamente las cartas sin condición de tiempo. Spikes
//  depende de "la ronda en que el Pokémon entra", que la app no modela, así que
//  queda como recordatorio.

export const FIELD_MOVES = [
    // ── Clima y terrenos: modifican la fuerza del ataque ─────────────────────
    { id: 'Rain',             es: 'Lluvia', emoji: '🌧️',            scope: 'global', kind: 'attack',
      up: ['WATER'],    down: ['FIRE'] },
    { id: 'Harsh Sunlight',   es: 'Luz Solar Intensa', emoji: '☀️', scope: 'global', kind: 'attack',
      up: ['FIRE'],     down: ['WATER'] },
    { id: 'Electric Terrain', es: 'Terreno Eléctrico', emoji: '⚡', scope: 'global', kind: 'attack',
      up: ['ELECTRIC'], down: [] },
    { id: 'Grassy Terrain',   es: 'Terreno Herboso', emoji: '🌿',   scope: 'global', kind: 'attack',
      up: ['GRASS'],    down: [] },
    { id: 'Misty Terrain',    es: 'Terreno Neblinoso', emoji: '🌸', scope: 'global', kind: 'attack',
      up: ['FAIRY'],    down: ['DRAGON'] },
    { id: 'Psychic Terrain',  es: 'Terreno Psíquico', emoji: '🔮',  scope: 'global', kind: 'attack',
      up: ['PSYCHIC'],  down: [] },

    // ── Clima que castiga al Pokémon según su tipo ───────────────────────────
    { id: 'Hail',      es: 'Granizo', emoji: '🧊',  scope: 'global', kind: 'final',
      exempt: ['ICE'],                    value: -1 },
    { id: 'Sandstorm', es: 'Tormenta', emoji: '🌪️', scope: 'global', kind: 'final',
      exempt: ['GROUND', 'ROCK', 'STEEL'], value: -1 },

    // ── Peligros de entrada ──────────────────────────────────────────────────
    { id: 'Stealth Rock', es: 'Trampa Rocas', emoji: '🪨', scope: 'team', kind: 'stealthrock' },
    { id: 'Spikes',       es: 'Púas', emoji: '🔻',         scope: 'team', kind: 'reminder',
      note: '−1 al valor final, solo la ronda en que el Pokémon entra' },
    { id: 'Toxic Spikes', es: 'Púas Tóxicas', emoji: '☠️', scope: 'team', kind: 'reminder',
      note: 'El equipo recibe Envenenado al entrar' },

    // ── Protecciones y apoyo ─────────────────────────────────────────────────
    { id: 'Mist',      es: 'Niebla', emoji: '🌫️',    scope: 'team', kind: 'reminder',
      note: 'Inmune a los efectos de dado del rival' },
    { id: 'Safeguard', es: 'Velo Sagrado', emoji: '🛡️', scope: 'team', kind: 'reminder',
      note: 'El equipo no puede recibir estados' },
    { id: 'Renewal',   es: 'Renovación', emoji: '🌱', scope: 'team', kind: 'reminder',
      note: 'El equipo agrega el efecto ♡ a su movimiento' },
];

export const FIELD_VALUE = 1;

// Stealth Rock pregunta quién es débil a los MOVIMIENTOS de Roca, así que se usa
// la rama de ataque ROCK de checkBonusType (SimPlayer.js:643-646):
//   +2 contra FIRE / ICE / FLYING / BUG   → son débiles a Roca
//   -2 contra FIGHTING / GROUND / STEEL   → la resisten
const ROCK_WEAK   = ['FIRE', 'ICE', 'FLYING', 'BUG'];
const ROCK_RESIST = ['FIGHTING', 'GROUND', 'STEEL', 'ROCK'];

// ─────────────────────────────────────────────────────────────────────────────

export const getFieldMove = (id) => FIELD_MOVES.find(f => f.id === id) || null;

const typesOf = (pkm) => [pkm?.type1, pkm?.type2].filter(t => t && t !== 'NONE');

// Una carta aplica a un lado si es global, o si es de equipo y ese lado la jugó
const appliesTo = (slot, side) => {
    const card = getFieldMove(slot?.id);
    if (!card) return false;
    return card.scope === 'global' || slot.owner === side;
};

// El item va pegado al Pokémon, así que no depende del ataque
export const getItemBonus = (pkm) => (pkm && ITEM_BONUS[pkm.attach]) || 0;

// Stealth Rock: los exentos ganan sobre los débiles cuando un Pokémon es las dos
// cosas, porque la carta los exime de forma explícita.
export const getStealthRockBonus = (pkm) => {
    const types = typesOf(pkm);
    if (types.some(t => ROCK_RESIST.includes(t))) return 0;
    if (types.some(t => ROCK_WEAK.includes(t)))   return -2;
    return -1;
};

// Bono que depende del ataque. Se anula junto con el ataque (Dormido y compañía).
export const getFieldAttackBonus = (attack, fieldMoves = [], side) => {
    if (!attack || !attack.type) return 0;
    return fieldMoves.reduce((sum, slot) => {
        if (!appliesTo(slot, side)) return sum;
        const card = getFieldMove(slot.id);
        if (card.kind !== 'attack') return sum;
        if (card.up.includes(attack.type))   return sum + FIELD_VALUE;
        if (card.down.includes(attack.type)) return sum - FIELD_VALUE;
        return sum;
    }, 0);
};

// Bono que depende del Pokémon. Aplica siempre, incluso con el ataque anulado.
export const getFieldFinalBonus = (pkm, fieldMoves = [], side) => {
    if (!pkm) return 0;
    const types = typesOf(pkm);
    return fieldMoves.reduce((sum, slot) => {
        if (!appliesTo(slot, side)) return sum;
        const card = getFieldMove(slot.id);
        if (card.kind === 'final') {
            return types.some(t => card.exempt.includes(t)) ? sum : sum + card.value;
        }
        if (card.kind === 'stealthrock') return sum + getStealthRockBonus(pkm);
        return sum;
    }, 0);
};
