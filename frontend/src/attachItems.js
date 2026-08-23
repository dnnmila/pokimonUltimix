// ─────────────────────────────────────────────────────────────────────────────
//  Catálogo único de items que se adjuntan a un Pokémon.
//  Lo consumen el modal de adjuntar (ModalAttach) y las tres vistas que dibujan
//  el item pegado a la carta: Pokemon (máster), SimPlayer (jugador) y
//  PokemonListed (tabla de todos los jugadores).
//
//  `id` es lo que se guarda en pokemon.attach y viaja al backend, así que los
//  cinco originales (MT, Protein, Potion, Claw, Mega) NO se pueden renombrar:
//  romperían las partidas ya guardadas en Backend/saves/.
//
//  Los items nuevos son marcadores: se ven en la carta pero no suman al total.
//  Si alguno tiene que sumar, se le pone valor en ITEM_BONUS (battleRules.js).
// ─────────────────────────────────────────────────────────────────────────────

// Todos los iconos son el sprite suelto del objeto con fondo transparente, no
// la carta entera: así se ven igual que los cinco originales a los tamaños a
// los que se dibujan (70px en el modal, menos en la carta del Pokémon).
import imgTM         from './images/tm.png';
import imgZ          from './images/Cristal_Z.png';
import imgProtein    from './images/protein.webp';
import imgPotion     from './images/potion.webp';
import imgClaw       from './images/claw.png';
import imgMega       from './images/Megaevo.webp';
import imgAmuletCoin from './images/AmuletCoin.png';
import imgLeftovers  from './images/leftovers.png';
import imgLuckyEgg   from './images/LuckyEgg.webp';
import imgEviolite   from './images/Eviolite.png';
import imgKingsRock  from './images/KingsRock.png';
import imgWideLens   from './images/WideLens.png';
import imgZoomLens   from './images/ZoomLens.png';
// Estos dos ya estaban recortados en el proyecto: el de la tabla de la tienda
// y el suelto de la raíz de images/
import imgBerry      from './images/store/chart/Berry.png';
import imgExpShare   from './images/expShare.webp';
// El Orbe Tera usa siempre el mismo sprite, sea del tipo que sea: la carta del
// tipo se lee en el modal de adjuntar, pero en la carta del Pokémon lo que hace
// falta es reconocer el objeto de un vistazo, y a ese tamaño las 19 cartas se
// distinguen mal entre sí. El tipo va en el tooltip (ver attachLabel).
import imgTeraOrb   from './images/store/chart/TeraOrb.png';
// Los objetos de equipo sí tienen sprite propio cada uno —se recortaron de sus
// cartas—, así que en la carta del Pokémon se dibuja el que lleve puesto (ver
// attachIconStyle). Esta imagen es solo la de la tarjeta que abre el catálogo:
// tres de ellos juntos, para que se lea "objetos" y no un objeto concreto.
import imgEquipment from './images/EquipmentItems.png';
// El objeto legendario tampoco tiene carta física propia todavía: por ahora se
// dibuja con el icono de la tabla de la tienda, igual que el orbe.
import imgLegendaryEvo from './images/store/chart/LegendaryEvo.png';
import { typeColor } from './pokemonTypes';
import { TERA_BY_ID } from './data/teraTypes';
import { EQUIP_BY_ID } from './data/equipment';

// ── Cartas grandes ───────────────────────────────────────────────────────────
// El sprite de arriba sirve para reconocer el objeto de un vistazo; esto es el
// arte de la carta física (762x1068), para cotejarla en pantalla sin buscarla
// en la mesa. Es lo que ya se hacía con las MTs y los cristales Z.
//
// Ojo con los nombres de fichero: la carpeta trae espacios y un apóstrofo
// escapado ("King_s Rock"), tal cual llegó. No se renombran aquí para no tocar
// assets que puedan estar referenciados en otro sitio.
import cardProtein    from './images/Nuevos items/Protein.jpg';
import cardClaw       from './images/Nuevos items/Razor Claw.png';
import cardAmuletCoin from './images/Nuevos items/Amulet Coin.png';
import cardLeftovers  from './images/Nuevos items/Leftovers.png';
import cardLuckyEgg   from './images/Nuevos items/Lucky Egg.png';
import cardEviolite   from './images/Nuevos items/Eviolite.png';
import cardKingsRock  from './images/Nuevos items/King_s Rock.png';
import cardWideLens   from './images/Nuevos items/Wide Lens.png';
import cardZoomLens   from './images/Nuevos items/Zoom Lens.png';
import cardExpShare   from './images/Nuevos items/ExpShare.png';
// Estos tres solo existen en la tanda de la tienda
import cardPotion     from './images/Nuevos items/itesm shop updated/Shop_-_Potion.png';
import cardBerry      from './images/Nuevos items/itesm shop updated/Shop_-_Berry.png';
import cardMega       from './images/Nuevos items/itesm shop updated/Mega_Stone.png';

// El Pokémon Alfa se dibuja con su emblema. Va por contexto y no por import a
// propósito: si el fichero todavía no está puesto, el item se queda sin icono
// pero la aplicación compila igual, en vez de romper el build entero.
const alphaCtx = require.context('./images', false, /^\.\/AlphaPokemon\.png$/);
const imgAlpha = alphaCtx.keys().length ? alphaCtx(alphaCtx.keys()[0]) : null;

// `kind`:
//   'item'   → se adjunta directo, manda el id al backend
//   'tm'     → abre el sub-panel de tipo + power
//   'z'      → abre el selector de cristales Z
//   'mega'   → llama a attachMega, que además crea la forma mega
//   'tera'   → abre el selector de Orbes Tera
//   'equip'  → abre el selector de Objetos de Equipo
//   'legend' → transforma al Pokémon en su forma legendaria (ver más abajo)
//   'remove' → limpia el item (se guarda como 'None')
export const ATTACH_ITEMS = [
    { id: 'MT',         label: 'TM',          es: 'MT',              kind: 'tm',     img: imgTM },
    // Ocupa el mismo hueco que la MT (attach + attack3): son excluyentes.
    { id: 'Z',          label: 'Z Crystal',   es: 'Cristal Z',       kind: 'z',      img: imgZ },
    { id: 'Mega',       label: 'Mega Stone',  es: 'Piedra Mega',     kind: 'mega',   img: imgMega,       card: cardMega },
    // También ocupa el hueco: un Pokémon lleva orbe o lleva MT/Z/Mega.
    // El orbe no lleva `card`: su carta depende del tipo, la resuelve getAttachCard.
    { id: 'Tera',       label: 'Tera Orb',    es: 'Orbe Tera',       kind: 'tera',   img: imgTeraOrb },
    // Y otro más: 18 objetos, uno por tipo, que dan +1 a los ataques de ese
    // tipo. Como el orbe, ni `img` ni `card` fijas — dependen de cuál se haya
    // elegido, y las resuelven attachIconStyle y getAttachCard.
    { id: 'Equip',      label: 'Attach Item', es: 'Objeto de Equipo', kind: 'equip', img: imgEquipment },
    // Otro que ocupa el hueco, y el único que cambia al Pokémon en sí: mientras
    // esté puesto, Zacian ES Crown Sword Zacian. Solo se ofrece a las especies
    // que tienen forma legendaria (ver data/legendaryEvos.js); al resto ni se
    // les enseña la carta.
    { id: 'LegendEvo',  label: 'Legendary Evo', es: 'Objeto Legendario', kind: 'legend', img: imgLegendaryEvo },
    // Sube el golpe como la proteína, pero con techo: los ataques que ya pegan
    // 4 o más no ganan nada (ver getAlphaBonus en battleRules.js).
    { id: 'Alpha',      label: 'Alpha Pokemon', es: 'Pokémon Alfa',  kind: 'item',   img: imgAlpha },
    { id: 'Protein',    label: 'Protein',     es: 'Proteína',        kind: 'item',   img: imgProtein,    card: cardProtein },
    { id: 'Potion',     label: 'Potion',      es: 'Poción',          kind: 'item',   img: imgPotion,     card: cardPotion },
    { id: 'Claw',       label: 'Razor Claw',  es: 'Garra Afilada',   kind: 'item',   img: imgClaw,       card: cardClaw },
    { id: 'Berry',      label: 'Berry',       es: 'Baya',            kind: 'item',   img: imgBerry,      card: cardBerry },
    { id: 'AmuletCoin', label: 'Amulet Coin', es: 'Moneda Amuleto',  kind: 'item',   img: imgAmuletCoin, card: cardAmuletCoin },
    { id: 'Leftovers',  label: 'Leftovers',   es: 'Restos',          kind: 'item',   img: imgLeftovers,  card: cardLeftovers },
    { id: 'LuckyEgg',   label: 'Lucky Egg',   es: 'Huevo Suerte',    kind: 'item',   img: imgLuckyEgg,   card: cardLuckyEgg },
    { id: 'Eviolite',   label: 'Eviolite',    es: 'Mineral Evolutivo', kind: 'item', img: imgEviolite,   card: cardEviolite },
    { id: 'KingsRock',  label: "King's Rock", es: 'Roca del Rey',    kind: 'item',   img: imgKingsRock,  card: cardKingsRock },
    { id: 'WideLens',   label: 'Wide Lens',   es: 'Lupa',            kind: 'item',   img: imgWideLens,   card: cardWideLens },
    { id: 'ZoomLens',   label: 'Zoom Lens',   es: 'Telescopio',      kind: 'item',   img: imgZoomLens,   card: cardZoomLens },
    { id: 'ExpShare',   label: 'Exp Share',   es: 'Repartir Exp',    kind: 'item',   img: imgExpShare,   card: cardExpShare },
];

export const getAttachItem = (id) => ATTACH_ITEMS.find(item => item.id === id) || null;

// Nombre legible para tooltips. Cae al id crudo si es un item viejo que ya no
// está en el catálogo, para no dejar la carta sin título.
//
// El Orbe Tera dice de qué tipo es, porque es lo único que lo diferencia de
// otro orbe: para eso hace falta el Pokémon, que es quien guarda `teraType`.
export const attachLabel = (id, pkm) => {
    if (id === 'Tera' && pkm?.teraType) {
        return `Tera Orb — ${TERA_BY_ID[pkm.teraType]?.tipo || pkm.teraType}`;
    }
    // El objeto de equipo sí tiene nombre propio, así que ese es el que manda;
    // el tipo va detrás porque es su único efecto.
    if (id === 'Equip' && pkm?.equipItem) {
        const item = EQUIP_BY_ID[pkm.equipItem];
        return item ? `${item.nombre} — ${item.tipo} +1` : pkm.equipItem;
    }
    return getAttachItem(id)?.label || id || '';
};

// Estilo del icono. Se aplica sobre las clases que ya dan tamaño y encuadre
// (.attached-item, .apl-pkm-attach i, .sim-mini-attach).
//
// `pkm` es opcional: hoy solo lo usa el Orbe Tera, que le añade un halo del
// color de su tipo. Es lo único que distingue un orbe de otro en la carta, ya
// que el sprite es el mismo para los 19; el nombre del tipo va en el tooltip.
// El halo se pone aquí y no en el SCSS para que solo lo pague el orbe.
export const attachIconStyle = (id, pkm) => {
    const item = getAttachItem(id);
    if (!item) return undefined;
    // Sin imagen (un item al que todavía no le han puesto el arte) se devuelve
    // el hueco vacío en vez de un `url(null)` que el navegador intenta cargar.
    const style = item.img ? { backgroundImage: `url(${item.img})` } : {};
    if (id === 'Tera' && pkm?.teraType) {
        style.filter = `drop-shadow(0 0 4px ${typeColor(pkm.teraType)})`;
    }
    // Al revés que el orbe: aquí cada objeto tiene su propio sprite, así que se
    // dibuja el que lleve puesto y el halo solo sirve de recordatorio del tipo
    // que refuerza.
    if (id === 'Equip' && pkm?.equipItem) {
        const equip = EQUIP_BY_ID[pkm.equipItem];
        if (equip?.img) {
            style.backgroundImage = `url(${equip.img})`;
            style.filter = `drop-shadow(0 0 4px ${typeColor(equip.typeId)})`;
        }
    }
    return style;
};

// Arte grande de la carta que lleva pegada un Pokémon, o null si ese item no
// tiene carta propia.
//
// Dos dependen del Pokémon: el Orbe Tera —19 cartas, una por tipo, y cuál toca
// lo dice `teraType`— y el objeto de equipo, que son 18 y las dice `equipItem`.
// MT y cristal Z no salen por aquí: su carta la resuelve ModalTMCard a partir
// de `attack3`, no del id del item.
export const getAttachCard = (id, pkm) => {
    if (id === 'Tera')  return TERA_BY_ID[pkm?.teraType]?.img || null;
    if (id === 'Equip') return EQUIP_BY_ID[pkm?.equipItem]?.card || null;
    return getAttachItem(id)?.card || null;
};

export default ATTACH_ITEMS;
