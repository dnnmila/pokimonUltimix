// ─────────────────────────────────────────────────────────────────────────────
//  Poké Star Studios: la tabla del D6 y los tres finales.
//
//  Los seis Prop Pokémon viven en la DB con FORM = 'Special' y POKEDEX PS1..PS6,
//  así que de ellos aquí solo hace falta lo que se pinta en la tabla de la carta
//  (qué cara del dado saca a cuál). Los tipos y los ataques los trae el servidor
//  al montar la batalla — y el nivel no está en ninguna parte: es el del Pokémon
//  con el que el jugador se mete a rodar, por eso el token lo lleva como '?'.
// ─────────────────────────────────────────────────────────────────────────────

export const PROPS = [
    { die: 1, pokedex: 'PS1', name: 'Brycen-Man', moves: 'Psychic 3 · Ice Beam 2' },
    { die: 2, pokedex: 'PS2', name: 'Humanoid',   moves: 'Self-Destruct 5' },
    { die: 3, pokedex: 'PS3', name: 'Majin',      moves: 'Crunch 3 · Dual Chop 1' },
    { die: 4, pokedex: 'PS4', name: 'MT',         moves: 'Iron Head 3 · Spark 2' },
    { die: 5, pokedex: 'PS5', name: 'Monica',     moves: 'Stomp 3 · Double Kick 1' },
    { die: 6, pokedex: 'PS6', name: 'UFO',        moves: 'Bubble Beam 2 · Signal Beam 2' },
];

export const propForDie = (die) => PROPS.find(p => p.die === die) || null;

/**
 * Qué final salió.
 *
 *   good    → ganaste con un movimiento supereficaz
 *   strange → ganaste sin supereficaz
 *   bad     → perdiste
 *   tie     → empate; la carta no lo contempla, así que se queda sin final
 *
 * Lo de «supereficaz» se sabe del bono del ataque que se usó: el motor ya suma
 * +1 por cada ventaja de tipo, así que bono > 0 es exactamente eso.
 */
export const pokeStarEnding = (myTotal, rivalTotal, attackBonus) => {
    if (myTotal === rivalTotal) return 'tie';
    if (myTotal < rivalTotal) return 'bad';
    return attackBonus > 0 ? 'good' : 'strange';
};

// `coins` es lo que se le suma (o resta) al jugador; el resto son cartas del
// mazo físico y la tablet solo las recuerda.
export const ENDINGS = {
    good: {
        id: 'good',
        title: 'Buen final',
        summary: 'Ganaste el rodaje con un movimiento supereficaz.',
        reward: 'Roba una carta de Objeto y cobra 3 PokéMonedas.',
        coins: 3,
    },
    strange: {
        id: 'strange',
        title: 'Final extraño',
        summary: 'Ganaste el rodaje, pero sin usar un movimiento supereficaz.',
        reward: 'Coge la carta de Objeto de arriba de la pila de descartes y cobra 5 PokéMonedas.',
        coins: 5,
    },
    bad: {
        id: 'bad',
        title: 'Mal final',
        summary: 'Perdiste el rodaje.',
        reward: 'Paga 5 PokéMonedas o descarta una carta de Objeto.',
        coins: -5,
    },
    tie: {
        id: 'tie',
        title: 'Sin final',
        summary: 'Empate: la carta no lo contempla, así que el rodaje se queda sin final.',
        reward: 'Ni premio ni castigo.',
        coins: 0,
    },
};
