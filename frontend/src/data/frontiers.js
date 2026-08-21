// ─────────────────────────────────────────────────────────────────────────────
//  Las 6 fronteras de la Battle Frontier.
//
//  Cada frontera es un reto de color: al lanzarla sale un Pokémon salvaje del
//  color de token que le toca y se pelea con las reglas de siempre. Ganando se
//  cobran FRONTIER_COINS PokéMonedas MÁS la recompensa impresa en la carta
//  (`reward`), que sigue siendo física y por eso aquí solo se enuncia.
//
//  `key` es el nombre del campo en el Player del backend: si alguno llega a
//  guardarse en una partida, ya no se puede renombrar.
//
//  `tokenColor` es el id de la columna TOKEN_COLOR de la DB (ver
//  data/tokenColors.js), que es de donde el backend sortea el rival. La
//  Legendaria no tiene color físico propio, así que usa el morado, el sexto
//  color de token, que ninguna otra frontera reclama.
// ─────────────────────────────────────────────────────────────────────────────

import { tokenColorHex } from './tokenColors';

export const FRONTIER_COINS = 5;

// El color NO se escribe aquí: sale del token del que se sortea el rival, así
// la tarjeta de la frontera y el círculo del selector no pueden desincronizarse.
const frontier = (key, label, tokenColor, reward) => ({
    key,
    label,
    tokenColor,
    color: tokenColorHex(tokenColor),
    reward,
});

export const FRONTIERS = [
    frontier('frontierPink', 'Rosa', 'pink',
        'Si tu Pokémon ganó un nivel en la batalla, gana un nivel adicional.'),
    frontier('frontierGreen', 'Verde', 'green',
        'Roba una carta de objeto.'),
    frontier('frontierBlue', 'Azul', 'blue',
        'Roba 2 cartas de objeto y coloca 1 al fondo del mazo.'),
    frontier('frontierYellow', 'Amarilla', 'yellow',
        'Roba 3 tokens de Pokémon amarillos. Puedes intentar un tiro de captura en uno de tu elección con un bono de +2.'),
    frontier('frontierRed', 'Roja', 'red',
        'Roba 3 cartas de objeto. Quédate 1 y coloca 2 al fondo del mazo. Puedes otorgar un nivel a cualquier Pokémon de nivel 4 o menor.'),
    frontier('frontierGolden', 'Legendaria', 'purple',
        'Toma un objeto a tu elección del mazo de objetos o del descarte. Puedes otorgar un nivel a cualquier Pokémon de nivel 4 o menor.'),
];

export const getFrontier = (key) => FRONTIERS.find(f => f.key === key) || null;

export default FRONTIERS;
