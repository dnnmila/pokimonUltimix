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

// `kind`:
//   'item'   → se adjunta directo, manda el id al backend
//   'tm'     → abre el sub-panel de tipo + power
//   'z'      → abre el selector de cristales Z
//   'mega'   → llama a attachMega, que además crea la forma mega
//   'remove' → limpia el item (se guarda como 'None')
export const ATTACH_ITEMS = [
    { id: 'MT',         label: 'TM',          es: 'MT',              kind: 'tm',     img: imgTM },
    // Ocupa el mismo hueco que la MT (attach + attack3): son excluyentes.
    { id: 'Z',          label: 'Z Crystal',   es: 'Cristal Z',       kind: 'z',      img: imgZ },
    { id: 'Mega',       label: 'Mega Stone',  es: 'Piedra Mega',     kind: 'mega',   img: imgMega },
    { id: 'Protein',    label: 'Protein',     es: 'Proteína',        kind: 'item',   img: imgProtein },
    { id: 'Potion',     label: 'Potion',      es: 'Poción',          kind: 'item',   img: imgPotion },
    { id: 'Claw',       label: 'Razor Claw',  es: 'Garra Afilada',   kind: 'item',   img: imgClaw },
    { id: 'Berry',      label: 'Berry',       es: 'Baya',            kind: 'item',   img: imgBerry },
    { id: 'AmuletCoin', label: 'Amulet Coin', es: 'Moneda Amuleto',  kind: 'item',   img: imgAmuletCoin },
    { id: 'Leftovers',  label: 'Leftovers',   es: 'Restos',          kind: 'item',   img: imgLeftovers },
    { id: 'LuckyEgg',   label: 'Lucky Egg',   es: 'Huevo Suerte',    kind: 'item',   img: imgLuckyEgg },
    { id: 'Eviolite',   label: 'Eviolite',    es: 'Mineral Evolutivo', kind: 'item', img: imgEviolite },
    { id: 'KingsRock',  label: "King's Rock", es: 'Roca del Rey',    kind: 'item',   img: imgKingsRock },
    { id: 'WideLens',   label: 'Wide Lens',   es: 'Lupa',            kind: 'item',   img: imgWideLens },
    { id: 'ZoomLens',   label: 'Zoom Lens',   es: 'Telescopio',      kind: 'item',   img: imgZoomLens },
    { id: 'ExpShare',   label: 'Exp Share',   es: 'Repartir Exp',    kind: 'item',   img: imgExpShare },
];

export const getAttachItem = (id) => ATTACH_ITEMS.find(item => item.id === id) || null;

// Nombre legible para tooltips. Cae al id crudo si es un item viejo que ya no
// está en el catálogo, para no dejar la carta sin título.
export const attachLabel = (id) => getAttachItem(id)?.label || id || '';

// Estilo del icono. Se aplica sobre las clases que ya dan tamaño y encuadre
// (.attached-item, .apl-pkm-attach i, .sim-mini-attach).
export const attachIconStyle = (id) => {
    const item = getAttachItem(id);
    return item ? { backgroundImage: `url(${item.img})` } : undefined;
};

export default ATTACH_ITEMS;
