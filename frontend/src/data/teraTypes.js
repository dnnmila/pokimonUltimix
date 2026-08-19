// Catálogo de Orbes Tera.
//
// 19 orbes: los 18 tipos más Stellar. Imágenes en `src/images/Tera Type /` —
// OJO: la carpeta tiene un espacio al final, tal cual llegó, igual que
// `ZCrystals `. Las miniaturas ya se generaron en `TeraTypes_thumb` (sin
// espacio) para no arrastrar el fallo.
//
// Igual que en MTs y cristales, el match imagen↔dato se hace indexando la
// carpeta con require.context y buscando por clave normalizada.
//
// Cómo funciona el orbe en este juego:
//   - Es un item adjunto y ocupa el hueco de `attach`: un Pokémon lleva orbe o
//     lleva MT/Cristal Z/Mega, no las dos cosas.
//   - Al subir a la batalla el jugador ELIGE: sube con sus tipos de siempre, o
//     teracristalizado. Teracristalizado pasa a tener UN SOLO tipo, el del
//     orbe: un Togekiss (Hada/Volador) con orbe Siniestro sube como Siniestro
//     a secas, y con orbe Hada sube como Hada a secas.
//   - Solo si sube teracristalizado, sus ataques del tipo del orbe suman +1.
//     Ese +1 entra por el Extra del total (ver computeExtra en SimPlayer).
//   - Stellar no está en la tabla de efectividades: un Pokémon Stellar no
//     recibe ni más ni menos daño de nada, y como ningún ataque es de tipo
//     Stellar, tampoco da el +1. Es defensa pura.

const ctx = require.context("../images/Tera Type ", false, /\.png$/);
const ctxThumb = require.context("../images/TeraTypes_thumb", false, /\.png$/);

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_']/g, " ")
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

/** Datos crudos, tal cual el JSON de origen. */
const RAW = [
  { nombre: "Tera Type - Bug", tipo: "Bug" },
  { nombre: "Tera Type - Dark", tipo: "Dark" },
  { nombre: "Tera Type - Dragon", tipo: "Dragon" },
  { nombre: "Tera Type - Electric", tipo: "Electric" },
  { nombre: "Tera Type - Fairy", tipo: "Fairy" },
  { nombre: "Tera Type - Fighting", tipo: "Fighting" },
  { nombre: "Tera Type - Fire", tipo: "Fire" },
  { nombre: "Tera Type - Flying", tipo: "Flying" },
  { nombre: "Tera Type - Ghost", tipo: "Ghost" },
  { nombre: "Tera Type - Grass", tipo: "Grass" },
  { nombre: "Tera Type - Ground", tipo: "Ground" },
  { nombre: "Tera Type - Ice", tipo: "Ice" },
  { nombre: "Tera Type - Normal", tipo: "Normal" },
  { nombre: "Tera Type - Poison", tipo: "Poison" },
  { nombre: "Tera Type - Psychic", tipo: "Psychic" },
  { nombre: "Tera Type - Rock", tipo: "Rock" },
  { nombre: "Tera Type - Steel", tipo: "Steel" },
  { nombre: "Tera Type - Stellar", tipo: "Stellar" },
  { nombre: "Tera Type - Water", tipo: "Water" },
];

/** Catálogo listo para usar: cada orbe con su carta y su miniatura. */
export const TERA_TYPES = RAW.map((t) => {
  const key = norm(t.nombre);
  const img = IMAGES[key] || null;
  if (!img && process.env.NODE_ENV === "development") {
    console.warn(`[teraTypes] sin imagen: ${t.nombre}`);
  }
  return {
    ...t,
    // El id ES el tipo en mayúsculas, que es como llegan los tipos de la DB y
    // como se guarda en `pokemon.teraType`. Así no hace falta traducir entre
    // el catálogo y lo que se compara en batalla.
    id: t.tipo.toUpperCase(),
    img,
    thumb: THUMBS[key] || img,
  };
});

/** Índice por tipo en mayúsculas ("DARK", "STELLAR"). */
export const TERA_BY_ID = TERA_TYPES.reduce((acc, t) => {
  acc[t.id] = t;
  return acc;
}, {});

/** ¿Este Pokémon lleva un Orbe Tera adjunto? */
export const hasTeraOrb = (pkm) => Boolean(pkm && pkm.attach === 'Tera' && pkm.teraType);

/**
 * El Pokémon tal y como sube a la batalla teracristalizado.
 *
 * Devuelve una COPIA con un solo tipo, el del orbe. Se hace así —y no con una
 * bandera que lea cada cálculo— porque la batalla ya lee `type1`/`type2` en
 * media docena de sitios (los seis bonos de `calculateBonus`, las etiquetas de
 * tipo, las cartas de campo): pasándole el objeto ya transformado, todo eso
 * funciona sin tocarse, igual que pasa con las megas.
 *
 * `id` y `pokedex` no cambian a propósito: subir de nivel, marcar debilitado y
 * el historial siguen apuntando al Pokémon real.
 */
export const applyTera = (pkm) => {
  if (!hasTeraOrb(pkm)) return pkm;
  return {
    ...pkm,
    type1: pkm.teraType,
    type2: 'NONE',
    // Lo consume computeExtra para el +1: el bono es de teracristalizar, no de
    // llevar el orbe, así que solo lo lleva esta copia.
    teraActive: true,
  };
};

/**
 * El +1 de teracristalizar: los ataques del tipo del orbe pegan más fuerte.
 *
 * Solo cuenta si el Pokémon subió teracristalizado (`teraActive`). Con Stellar
 * no salta nunca, porque ningún ataque es de ese tipo.
 */
export const getTeraBonus = (pkm, attack) => {
  if (!pkm || !pkm.teraActive || !attack || !attack.type) return 0;
  return attack.type.toUpperCase() === pkm.teraType ? 1 : 0;
};

/**
 * Sorteo del evento «Take Terra Orb»: n orbes distintos.
 *
 * Entran los 19, Stellar incluido: es una carta rara pero legítima —defensa
 * total a cambio de no dar el +1— y esconderla del sorteo la volvería inútil.
 *
 * Mismo muestreo por descarte que las MTs y los cristales, para que los tres
 * eventos se comporten idéntico.
 */
export const rollTeraOrbs = (n = 3) => {
  const pool = [...TERA_TYPES];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
};

/** Cuántos de los tres ataques de este Pokémon ganarían el +1 con este orbe. */
export const teraBoostedAttacks = (orb, pkm) => {
  if (!orb || !pkm) return 0;
  return [pkm.attack1, pkm.attack2, pkm.attack3]
    .filter(a => a && a.type && a.type.toUpperCase() === orb.id)
    .length;
};

export default TERA_TYPES;
