// Catálogo de Objetos de Equipo (las cartas «Attach Card» de la carpeta
// Equipment).
//
// 18 objetos, uno por tipo. Cada uno da +1 a los ataques de SU tipo del Pokémon
// que lo lleva, y nada más: no cambia tipos como el Orbe Tera ni ocupa el
// ataque 3 como la MT o el cristal Z. Es la proteína, pero en vez de subir el
// total entero sube solo lo que pega de ese tipo.
//
// Lo que dice la carta, literal: «Increase the attack strength of <tipo> type
// moves used by the attached Pokémon by 1, excluding moves with 0 Power». Esa
// excepción es la que hace `getEquipBonus`: los movimientos de estado (poder 0)
// no se refuerzan.
//
// Imágenes:
//   - `card`  → la carta física, en `src/images/Equipment ` (OJO: la carpeta
//     tiene un espacio al final, tal cual llegó, igual que `ZCrystals ` y
//     `Tera Type `).
//   - `img`   → el objeto recortado de esa misma carta, sin el marco ni la foto
//     de fondo, en `src/images/Equipment_items` (sin espacio). Es lo que se
//     dibuja pegado al Pokémon y en la rejilla del catálogo.
//
// Igual que en MTs, cristales y orbes, el match imagen↔dato se hace indexando
// las carpetas con require.context y buscando por clave normalizada, no con
// imports literales.

const ctxCard = require.context("../images/Equipment ", false, /\.png$/);
const ctxItem = require.context("../images/Equipment_items", false, /\.png$/);

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

const CARDS = indexFrom(ctxCard);
const ITEMS = indexFrom(ctxItem);

/** Datos crudos: nombre de la carta, tipo al que refuerza y nombre en español. */
const RAW = [
  { nombre: "Black Belt",     tipo: "Fighting", es: "Cinturón Negro" },
  { nombre: "Black Glasses",  tipo: "Dark",     es: "Gafas de Sol" },
  { nombre: "Charcoal",       tipo: "Fire",     es: "Carbón" },
  { nombre: "Dragon Fang",    tipo: "Dragon",   es: "Colmillo Dragón" },
  { nombre: "Fairy Feather",  tipo: "Fairy",    es: "Pluma Hada" },
  { nombre: "Hard Stone",     tipo: "Rock",     es: "Piedra Dura" },
  { nombre: "Magnet",         tipo: "Electric", es: "Imán" },
  { nombre: "Metal Coat",     tipo: "Steel",    es: "Revestimiento Metálico" },
  { nombre: "Miracle Seed",   tipo: "Grass",    es: "Semilla Milagro" },
  { nombre: "Mystic Water",   tipo: "Water",    es: "Agua Mística" },
  { nombre: "Never-Melt Ice", tipo: "Ice",      es: "Antiderretir" },
  { nombre: "Poison Barb",    tipo: "Poison",   es: "Flecha Venenosa" },
  { nombre: "Sharp Beak",     tipo: "Flying",   es: "Pico Afilado" },
  { nombre: "Silk Scarf",     tipo: "Normal",   es: "Pañuelo Seda" },
  { nombre: "Silver Powder",  tipo: "Bug",      es: "Polvo Plata" },
  { nombre: "Soft Sand",      tipo: "Ground",   es: "Arena Fina" },
  { nombre: "Spell Tag",      tipo: "Ghost",    es: "Hechizo" },
  { nombre: "Twisted Spoon",  tipo: "Psychic",  es: "Cuchara Torcida" },
];

/** Catálogo listo para usar: cada objeto con su sprite y su carta. */
export const EQUIPMENT = RAW.map((e) => {
  const key = norm(e.nombre);
  const img = ITEMS[key] || null;
  if (!img && process.env.NODE_ENV === "development") {
    console.warn(`[equipment] sin sprite: ${e.nombre}`);
  }
  return {
    ...e,
    // El id es el nombre en kebab-case ("black-belt"): es lo que se guarda en
    // pokemon.equipItem y viaja al backend, así que no se puede cambiar sin
    // romper las partidas ya guardadas en Backend/saves/.
    id: key.replace(/ /g, "-"),
    // El tipo en mayúsculas, que es como llegan los tipos de la DB y como
    // vienen en attack.type: así el +1 se decide comparando sin traducir.
    typeId: e.tipo.toUpperCase(),
    img,
    card: CARDS[key] || null,
  };
});

/** Índice por id ("black-belt"). */
export const EQUIP_BY_ID = EQUIPMENT.reduce((acc, e) => {
  acc[e.id] = e;
  return acc;
}, {});

/** Índice por tipo en mayúsculas ("FIGHTING"), que es 1:1 con los objetos. */
export const EQUIP_BY_TYPE = EQUIPMENT.reduce((acc, e) => {
  acc[e.typeId] = e;
  return acc;
}, {});

/** ¿Este Pokémon lleva un objeto de equipo puesto? */
export const hasEquip = (pkm) => Boolean(pkm && pkm.attach === 'Equip' && pkm.equipItem);

/** El objeto que lleva puesto, o null. */
export const equipOf = (pkm) => (hasEquip(pkm) ? EQUIP_BY_ID[pkm.equipItem] || null : null);

/**
 * El +1 del objeto: solo para los ataques de su tipo, y solo si el ataque pega.
 *
 * Los movimientos de poder 0 quedan fuera porque lo dice la carta: el objeto
 * refuerza el golpe, y un movimiento de estado no golpea.
 */
export const getEquipBonus = (pkm, attack) => {
  const item = equipOf(pkm);
  if (!item || !attack || !attack.type) return 0;
  if (!attack.strength) return 0;
  return attack.type.toUpperCase() === item.typeId ? 1 : 0;
};

/** Cuántos de los tres ataques de este Pokémon ganarían el +1 con este objeto. */
export const equipBoostedAttacks = (item, pkm) => {
  if (!item || !pkm) return 0;
  return [pkm.attack1, pkm.attack2, pkm.attack3]
    .filter(a => a && a.type && a.strength && a.type.toUpperCase() === item.typeId)
    .length;
};

/**
 * Sorteo de n objetos distintos, por si algún evento reparte estas cartas.
 * Mismo muestreo por descarte que las MTs, los cristales y los orbes.
 */
export const rollEquipment = (n = 3) => {
  const pool = [...EQUIPMENT];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
};

export default EQUIPMENT;
