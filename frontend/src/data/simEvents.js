// ─────────────────────────────────────────────────────────────────────────────
//  Catálogo de eventos del SimPlayer.
//
//  Un evento es algo que el jugador dispara desde el setup (botón «Eventos»)
//  fuera del flujo normal de batalla: recoger un objeto, montar una incursión,
//  retar a una mega. Aquí solo vive la ficha (nombre, icono, texto); la lógica
//  de cada uno se resuelve en SimPlayer.handleEventPick, ramificando por `id`.
//
//  `id` es lo que viaja al handler: si alguno llega a guardarse en la partida,
//  ya no se puede renombrar.
// ─────────────────────────────────────────────────────────────────────────────

import imgTM   from '../images/tm.png';
import imgZ    from '../images/Cristal_Z.png';
import imgMax  from '../images/dinamax.png';
import imgMega from '../images/Megaevo.webp';
// La horda no tiene icono propio: usa el token de Zubat, que es el de la carta.
import imgHorde from '../images/tokens_ultimix/0041.png';
// El combate de entrenador usa un retrato de entrenador de los que ya hay.
import imgTrainer from '../images/trainers/Trainer1.webp';
// El concurso se premia con una carta Ribbon: su arte hace de icono.
import imgRibbon from '../images/Nuevos items/Map Specific Items/Ribbon.png';
// El rodaje usa el token de Brycen-Man, el primero de la tabla del D6.
import imgPokeStar from '../images/tokens_ultimix/PS1.png';

// El directorio de tipos Tera tiene un espacio al final del nombre. El require
// va en template literal a propósito: webpack arma un contexto y, si el archivo
// falta, falla en runtime (lo atrapa el catch) en vez de romper el build.
const loadTeraImg = () => {
    try { return require(`../images/Tera Type /Tera_Type_-_Stellar.png`); } catch { return null; }
};

// `accent` pinta el borde y el título de la tarjeta: agrupa de un vistazo los
// eventos de «recoger objeto» (los tres primeros) frente a los de combate.
export const SIM_EVENTS = [
    {
        id: 'takeTM',
        title: 'Take TM',
        es: 'Toma una MT',
        desc: 'Salen 3 MTs al azar: quédate una para equiparla o guardarla.',
        img: imgTM,
        accent: '#5ec8f2',
    },
    {
        id: 'takeZ',
        title: 'Take Z Crystal',
        es: 'Toma un Cristal Z',
        desc: 'Salen 3 cristales al azar: quédate uno para equiparlo o guardarlo.',
        img: imgZ,
        accent: '#f2c14e',
    },
    {
        id: 'takeTera',
        title: 'Take Terra Orb',
        es: 'Toma el Orbe Tera',
        desc: 'Salen 3 Orbes Tera al azar: quédate uno para equiparlo o guardarlo.',
        img: loadTeraImg(),
        accent: '#b06ef2',
    },
    {
        id: 'raidMax',
        title: 'Raid Dinamax',
        es: 'Incursión Dinamax',
        desc: '4 Pokémon por turnos contra un jefe Dinamax; los totales se suman.',
        // Hoja de reglas consultable desde el propio menú (ver data/rulesCards.js)
        rules: 'maxRaid',
        img: imgMax,
        accent: '#f2506e',
    },
    {
        id: 'trainerBattle',
        title: 'Trainer Battle',
        es: 'Combate de Entrenador',
        desc: '1 o 2 salvajes del color de tu casilla; ganándolos todos, cartas de objeto.',
        rules: 'trainerBattle',
        img: imgTrainer,
        accent: '#3fbf6a',
    },
    {
        id: 'horde',
        title: 'Horde Encounter',
        es: 'Horda',
        desc: 'Un salvaje contra todo tu equipo, uno por uno; las victorias son bono de captura.',
        rules: 'horde',
        img: imgHorde,
        accent: '#3fbf6a',
    },
    {
        id: 'pokeStar',
        title: 'Poké Star Studios',
        es: 'Rodaje en Poké Star',
        desc: 'Un D6 saca al Prop Pokémon; pelea a tu nivel y nadie se queda debilitado.',
        rules: 'pokeStar',
        img: imgPokeStar,
        accent: '#b06ef2',
    },
    {
        id: 'contest',
        title: 'Pokémon Contest',
        es: 'Concurso Pokémon',
        desc: 'Sin ataques ni niveles: poder de los movimientos más dados, y gana el más alto.',
        rules: 'contest',
        img: imgRibbon,
        accent: '#5ec8f2',
    },
    {
        id: 'megaBattle',
        title: 'Mega Battle',
        es: 'Combate Mega',
        desc: 'Sale una mega al azar y peleas contra ella como si fuera salvaje.',
        img: imgMega,
        accent: '#4ee0a0',
    },
];

export const getSimEvent = (id) => SIM_EVENTS.find(ev => ev.id === id) || null;
