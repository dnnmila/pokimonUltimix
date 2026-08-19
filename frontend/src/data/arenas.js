// Arena de fondo de la pantalla de batalla, según a quién se enfrenta el jugador.
//
//   Líder de gimnasio (gym3_1)  → arena de su tipo
//   Alto Mando       (gymE2_1)  → arena CHAMPION
//   Campeón          (gymC1_1)  → arena CHAMPION
//   Todo lo demás               → el estadio de siempre (pokeStadiumSim)
//
// «Todo lo demás» son los salvajes, los duelos entre jugadores y Team Rocket: no
// se distinguen entre sí por el POKEDEX del rival —los tres traen Pokémon
// normales— y ninguno tiene sede propia, así que los tres pelean en el estadio
// genérico. Ojo: NORMAL.webp es la arena del TIPO Normal (Whitney, Norman), no
// el respaldo de nadie.
//
// Las cinco batallas finales comparten arena a propósito: las ocho medallas se
// pelean cada una en su gimnasio, y a partir del Alto Mando se cambia de sitio
// una sola vez. Eso marca el salto mejor que darle un tipo a cada uno.
//
// El tipo se saca del POKEDEX del Pokémon rival (`gym3_1` → gimnasio 3) y no del
// tipo de ese Pokémon: los equipos de líder están llenos de dobles tipos que
// mienten —el Geodude de Brock es ROCK/GROUND, el Skarmory de Winona es
// WATER/FLYING—, y además así la arena no cambia a media batalla cuando el líder
// saca su segundo Pokémon.

import pokeStadiumSim from '../images/pokeStadiumSim.webp';

// Tipo canónico de cada gimnasio, por generación. NO se deduce de su equipo (ver
// arriba). Las claves son el número que trae el POKEDEX.
const GYM_TYPES = {
    // Kanto
    1: { 1: 'ROCK',    2: 'WATER',    3: 'ELECTRIC', 4: 'GRASS',
         5: 'POISON',  6: 'PSYCHIC',  7: 'FIRE',     8: 'GROUND' },
    // Johto
    2: { 1: 'FLYING',  2: 'BUG',      3: 'NORMAL',   4: 'GHOST',
         5: 'FIGHTING',6: 'STEEL',    7: 'ICE',      8: 'DRAGON' },
    // Hoenn
    3: { 1: 'ROCK',    2: 'FIGHTING', 3: 'ELECTRIC', 4: 'FIRE',
         5: 'NORMAL',  6: 'FLYING',   7: 'PSYCHIC',  8: 'WATER' },
    // Sinnoh
    4: { 1: 'ROCK',    2: 'GRASS',    3: 'FIGHTING', 4: 'WATER',
         5: 'GHOST',   6: 'STEEL',    7: 'ICE',      8: 'ELECTRIC' },
};

// `gym3_1` es el gimnasio 3. `gymE2_1` (Alto Mando) y `gymC1_1` (campeón) van a
// CHAMPION. `gymR1_1` (Rocket) y los POKEDEX numéricos de un salvaje no entran
// en ninguno de los dos.
const GYM_DEX    = /^gym(\d+)_\d+$/;
const FINALS_DEX = /^gym[EC]\d+_\d+$/;

// Arena que le toca a esta batalla, o null si no hay ninguna sede que
// reconocer —ahí manda el estadio genérico, ver arenaStyle.
export const arenaTypeFor = (pokedex, generation = 1) => {
    if (FINALS_DEX.test(pokedex || '')) return 'CHAMPION';

    const match = GYM_DEX.exec(pokedex || '');
    if (!match) return null;
    return GYM_TYPES[generation]?.[Number(match[1])] || null;
};

// El require dinámico lanza cuando el archivo no está y estas pantallas se
// repintan con cada evento del socket, así que el resultado se cachea —el mismo
// motivo por el que lo hace getLeaderPortrait.
const arenaCache = {};

export const getArenaBg = (type) => {
    if (!type) return null;
    const key = type.toString().toUpperCase();
    if (key in arenaCache) return arenaCache[key];

    let img = null;
    try { img = require(`../images/Arenas/${key}.webp`); } catch { /* sin arte */ }

    arenaCache[key] = img;
    return img;
};

// Lo que se le pone al `style` del contenedor de la batalla. La hoja de estilos
// lee `--arena`.
//
// Un tipo al que todavía no le hayas hecho arena cae también al estadio
// genérico: mejor el fondo de siempre que una pantalla sin fondo.
export const arenaStyle = (pokedex, generation) => {
    const img = getArenaBg(arenaTypeFor(pokedex, generation)) || pokeStadiumSim;
    return { '--arena': `url(${img})` };
};
