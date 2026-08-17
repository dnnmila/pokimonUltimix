// Catálogo de Movimientos Z (cristales Z).
//
// 18 cristales, uno por tipo. Cada uno da un movimiento genérico, y algunos
// Pokémon concretos tienen en su lugar un movimiento especial más fuerte.
//
// Imágenes en `src/images/ZCrystals /<Cristal con _>.png` — OJO: la carpeta
// tiene un espacio al final, tal cual llegó. Funciona, pero conviene
// renombrarla; las miniaturas ya se generaron en `ZCrystals_thumb` (sin
// espacio) para no arrastrar el fallo.
//
// Igual que en las MTs, el match imagen↔dato se hace indexando la carpeta con
// require.context y buscando por clave normalizada, no con imports literales.
//
// Diferencias de diseño con las MTs, decididas para este juego:
//   - Poder FIJO: el genérico es 4 y el especial 5 (o lo que diga la carta).
//     No llevan el +1 por tipo; si lo llevaran, un genérico del mismo tipo
//     empataría con el especial y el especial dejaría de significar nada.
//   - El cristal ocupa el mismo hueco que la MT (`attach` + `attack3`): un
//     Pokémon lleva una cosa o la otra, no ambas.
//   - El especial se activa por nombre EXACTO del Pokémon. Las formas
//     alternativas no lo heredan: Necrozma sí, Ultra Necrozma no.

const ctx = require.context("../images/ZCrystals ", false, /\.png$/);
const ctxThumb = require.context("../images/ZCrystals_thumb", false, /\.png$/);

const norm = (s) =>
  (s || "")
    .replace(/<[^>]+>/g, "") // la tabla `pokemons` trae "<i>Ultra</i> Necrozma"
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const indexFrom = (context) =>
  context.keys().reduce((acc, key) => {
    const m = key.match(/^\.\/(.+)\.png$/);
    if (m) acc[norm(m[1])] = context(key);
    return acc;
  }, {});

const IMAGES = indexFrom(ctx);
const THUMBS = indexFrom(ctxThumb);

/**
 * Datos crudos. Un objeto por cristal, con sus especiales agrupados dentro.
 *
 * El JSON de origen venía con una fila por (cristal, especial), repitiendo el
 * movimiento genérico en cada una — Electrium Z aparecía tres veces con el
 * mismo "Gigavolt Havoc / 4". Aquí el genérico se escribe una sola vez.
 *
 * `activo: false` marca los especiales cuyo Pokémon no existe (todavía) en la
 * tabla `pokemons`. Se conservan a propósito: el día que se den de alta, el
 * especial empieza a funcionar solo, sin tocar código.
 */
const RAW = [
  { cristal: "Buginium Z",   tipo: "Bug",      generico: "Savage Spin-Out",        poder: 4, especiales: [] },
  { cristal: "Darkinium Z",  tipo: "Dark",     generico: "Black Hole Eclipse",     poder: 4, especiales: [
      { pokemon: "Incineroar", nombre: "Malicious Moonsault", poder: 5 },
  ] },
  { cristal: "Dragonium Z",  tipo: "Dragon",   generico: "Devastating Drake",      poder: 4, especiales: [
      { pokemon: "Kommo-o", nombre: "Clangorous Soulblaze", poder: 5 },
  ] },
  { cristal: "Electrium Z",  tipo: "Electric", generico: "Gigavolt Havoc",         poder: 4, especiales: [
      { pokemon: "Pikachu", nombre: "Catastropika", poder: 5 },
      { pokemon: "Alolan Raichu", nombre: "Stoked Sparksurfer", poder: 4 },
      // No existe en la tabla `pokemons`: solo están "Pikachu" y "G-Max Pikachu".
      { pokemon: "Ash's Pikachu", nombre: "10,000,000 Volt Thunderbolt", poder: 5, activo: false },
  ] },
  { cristal: "Fairium Z",    tipo: "Fairy",    generico: "Twinkle Tackle",         poder: 4, especiales: [
      { pokemon: "Mimikyu", nombre: "Let's Snuggle Forever", poder: 5 },
      // Ningún Tapu está dado de alta (ni Koko, ni Lele, ni Bulu, ni Fini), y el
      // poder llegó como 0, que parece un pendiente más que un valor real.
      { pokemon: "Tapu Koko", nombre: "Guardian of Alola", poder: 0, activo: false },
      { pokemon: "Tapu Lele", nombre: "Guardian of Alola", poder: 0, activo: false },
      { pokemon: "Tapu Bulu", nombre: "Guardian of Alola", poder: 0, activo: false },
      { pokemon: "Tapu Fini", nombre: "Guardian of Alola", poder: 0, activo: false },
  ] },
  { cristal: "Fightinium Z", tipo: "Fighting", generico: "All-Out Pummeling",      poder: 4, especiales: [] },
  { cristal: "Firium Z",     tipo: "Fire",     generico: "Inferno Overdrive",      poder: 4, especiales: [] },
  { cristal: "Flyinium Z",   tipo: "Flying",   generico: "Supersonic Skystrike",   poder: 4, especiales: [] },
  { cristal: "Ghostium Z",   tipo: "Ghost",    generico: "Never-Ending Nightmare", poder: 4, especiales: [
      { pokemon: "Decidueye", nombre: "Sinister Arrow Raid", poder: 5 },
      { pokemon: "Marshadow", nombre: "Soul-Stealing 7-Star Strike", poder: 5 },
      { pokemon: "Lunala", nombre: "Menacing Moonraze Maelstrom", poder: 4 },
  ] },
  { cristal: "Grassium Z",   tipo: "Grass",    generico: "Bloom Doom",             poder: 4, especiales: [] },
  { cristal: "Groundium Z",  tipo: "Ground",   generico: "Tectonic Rage",          poder: 4, especiales: [] },
  { cristal: "Icium Z",      tipo: "Ice",      generico: "Subzero Slammer",        poder: 4, especiales: [] },
  { cristal: "Normalium Z",  tipo: "Normal",   generico: "Breakneck Blitz",        poder: 4, especiales: [
      { pokemon: "Snorlax", nombre: "Pulverizing Pancake", poder: 5 },
  ] },
  { cristal: "Poisonium Z",  tipo: "Poison",   generico: "Acid Downpour",          poder: 4, especiales: [] },
  { cristal: "Psychium Z",   tipo: "Psychic",  generico: "Shattered Psyche",       poder: 4, especiales: [
      { pokemon: "Mew", nombre: "Genesis Supernova", poder: 5 },
      { pokemon: "Necrozma", nombre: "Light That Burns the Sky", poder: 4 },
  ] },
  { cristal: "Rockium Z",    tipo: "Rock",     generico: "Continental Crush",      poder: 4, especiales: [
      { pokemon: "Lycanroc", nombre: "Splintered Stormshards", poder: 5 },
  ] },
  { cristal: "Steelium Z",   tipo: "Steel",    generico: "Corkscrew Crash",        poder: 4, especiales: [
      { pokemon: "Solgaleo", nombre: "Searing Sunraze Smash", poder: 4 },
  ] },
  { cristal: "Waterium Z",   tipo: "Water",    generico: "Hydro Vortex",           poder: 4, especiales: [] },
];

/** Catálogo listo para usar: cada cristal con su carta y su miniatura. */
export const Z_CRYSTALS = RAW.map((z) => {
  const key = norm(z.cristal);
  const img = IMAGES[key] || null;
  if (!img && process.env.NODE_ENV === "development") {
    console.warn(`[zmoves] sin imagen: ${z.cristal}`);
  }
  return {
    ...z,
    id: norm(z.cristal).replace(/ /g, "-"),
    img,
    thumb: THUMBS[key] || img,
  };
});

/** Índice por id de cristal, para lookups desde el attach y la batalla. */
export const Z_BY_ID = Z_CRYSTALS.reduce((acc, z) => {
  acc[z.id] = z;
  return acc;
}, {});

/**
 * Qué movimiento Z le da este cristal a este Pokémon.
 *
 * Devuelve siempre algo: el especial si el nombre coincide exactamente con uno
 * de los de la lista (y ese especial está activo), y el genérico en cualquier
 * otro caso. Comparación normalizada, que hace falta porque la tabla
 * `pokemons` guarda algunos nombres con HTML dentro.
 *
 * @returns {{nombre: string, poder: number, especial: boolean, tipo: string}}
 */
export const zMoveFor = (crystal, pokemon) => {
  const generico = {
    nombre: crystal.generico,
    poder: crystal.poder,
    especial: false,
    tipo: crystal.tipo,
  };
  if (!pokemon || !pokemon.name) return generico;

  const nombre = norm(pokemon.name);
  const hit = crystal.especiales.find(
    (e) => e.activo !== false && norm(e.pokemon) === nombre
  );
  return hit
    ? { nombre: hit.nombre, poder: hit.poder, especial: true, tipo: crystal.tipo }
    : generico;
};

export default Z_CRYSTALS;
