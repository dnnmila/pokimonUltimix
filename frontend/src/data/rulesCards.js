// Cartas de reglas: las hojas físicas del juego, escaneadas, para consultarlas
// desde la tablet sin levantarse de la mesa.
//
// Las imágenes van en `src/images/rules/`. El índice se arma con require.context
// sobre `images/` filtrando por esa subcarpeta, y NO sobre `images/rules` a
// secas, a propósito: si la carpeta no existiera todavía, un contexto apuntado
// directamente a ella rompería la compilación, mientras que así simplemente no
// encuentra nada y la interfaz avisa de dónde dejar el archivo.
//
// El match es por nombre normalizado, como en los catálogos de MTs y cristales:
// da igual mayúsculas, acentos, guiones o espacios, así que el archivo se puede
// llamar "Max Raid Battle.png", "max-raid-battle.PNG" o "Max_Raid_Battle.jpg".

const ctx = require.context('../images', true, /rules\/.*\.(png|jpe?g|webp)$/i);

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const INDEX = ctx.keys().reduce((acc, key) => {
  const m = key.match(/rules\/(.+)\.(png|jpe?g|webp)$/i);
  if (m) acc[norm(m[1])] = ctx(key);
  return acc;
}, {});

// `aliases` son los nombres de archivo que se aceptan para esa carta. El primero
// es el que se sugiere en pantalla cuando falta.
export const RULES_CARDS = [
  {
    id: 'maxRaid',
    title: 'Reglas de la Incursión Max',
    aliases: ['max raid battle', 'max raid battle rules', 'incursion max'],
  },
];

export const rulesCard = (id) => {
  const card = RULES_CARDS.find(c => c.id === id);
  if (!card) return null;
  const img = card.aliases.map(a => INDEX[norm(a)]).find(Boolean) || null;
  return { ...card, img, expectedPath: `src/images/rules/${card.aliases[0]}.png` };
};

export default RULES_CARDS;
