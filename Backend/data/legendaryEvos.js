// ─────────────────────────────────────────────────────────────────────────────
//  Formas legendarias del «Legendary Evo. Item» de la tienda.
//
//  NO son megas, aunque la base de datos tenga a algunas marcadas como tales
//  (Kyogre, Groudon, Hoopa y Kyurem traen MEGA='Yes'). La diferencia está en
//  qué produce el objeto:
//
//    Piedra mega  → crea una carta APARTE en `player.megas`; el Pokémon sigue
//                   siendo el de siempre y en batalla eliges con cuál subes.
//    Objeto       → el Pokémon SE TRANSFORMA en sitio: Zacian pasa a ser Crown
//    legendario     Sword Zacian, con su nombre, tipos, nivel y ataques, y
//                   vuelve a Zacian en cuanto se le quita el objeto.
//
//  Por eso estas especies tienen la vía mega cortada (ver attachMegaForms): si
//  no, la piedra y el objeto harían lo mismo por dos caminos distintos.
//
//  Gemela de frontend/src/data/legendaryEvos.js, que es la que decide qué
//  cartas se ofrecen en el modal de adjuntar. Si se toca una, se toca la otra.
// ─────────────────────────────────────────────────────────────────────────────

// POKEDEX de la forma base → POKEDEX de las formas que habilita el objeto.
// Kyurem y Necrozma tienen varias: al adjuntar el objeto hay que elegir una.
//
// Las cuatro últimas son fusiones, y por eso la misma forma sale de dos bases
// distintas: White Kyurem la puede montar Kyurem o Reshiram, y Dusk Mane
// Necrozma la puede montar Necrozma o Solgaleo. No se pisan, porque cada
// Pokémon transformado se acuerda de la suya (ver LEGENDARY_BASE_FIELD): un
// Reshiram convertido en White Kyurem vuelve a ser Reshiram, no Kyurem.
export const LEGENDARY_EVOS = {
    '0382': ['M0382'],                      // Kyogre     → Primal-Blue Kyogre
    '0383': ['M0383'],                      // Groudon    → Primal-Red Groudon
    '0643': ['W0646'],                      // Reshiram   → White Kyurem
    '0644': ['B0646'],                      // Zekrom     → Black Kyurem
    '0646': ['B0646', 'W0646'],             // Kyurem     → Black / White Kyurem
    '0720': ['U0720'],                      // Hoopa      → Hoopa Unbound
    '0791': ['DM0800'],                     // Solgaleo   → Dusk Mane Necrozma
    '0792': ['DW0800'],                     // Lunala     → Dawn Wings Necrozma
    '0800': ['DM0800', 'DW0800', 'U0800'],  // Necrozma   → Dusk Mane / Dawn Wings / Ultra
    '0888': ['C0888'],                      // Zacian     → Crown Sword Zacian
    '0889': ['C0889'],                      // Zamazenta  → Crown Shiled Zamazenta
};

// Marcador que llevan los Pokémon transformados: guarda de qué forma base
// salieron para poder deshacerlo. Va en el propio Pokémon porque el id no lo
// dice —se conserva el de la base, justo para que las referencias de la batalla
// no se rompan al transformar— y el POKEDEX nuevo tampoco: hay formas que no
// comparten raíz numérica con su base.
export const LEGENDARY_BASE_FIELD = 'legendaryBase';

export const isLegendaryBase = (pokedex) =>
    Object.prototype.hasOwnProperty.call(LEGENDARY_EVOS, String(pokedex || ''));

export const legendaryFormsOf = (pokedex) => LEGENDARY_EVOS[String(pokedex || '')] || [];

// Si la forma pedida no sale de esa base, no se transforma: el POKEDEX viaja
// desde el cliente y no hay motivo para montar cualquier ficha de la tabla.
export const isLegendaryFormOf = (basePokedex, formPokedex) =>
    legendaryFormsOf(basePokedex).includes(String(formPokedex || ''));

export default LEGENDARY_EVOS;
