// Los 18 tipos, en el orden que ya usaba el selector de TM.
//
// Stellar NO entra aquí a propósito: no es un tipo de ataque ni de Pokémon, solo
// existe como Orbe Tera. Sí está en los mapas de color y nombre de abajo, que
// son los que consultan las vistas cuando un Pokémon sube teracristalizado.
const POKEMON_TYPES = ['NORMAL','BUG','DARK','DRAGON','ELECTRIC','FAIRY','FIGHTING','FIRE','FLYING',
                       'GHOST','GRASS','GROUND','ICE','POISON','PSYCHIC','ROCK','STEEL','WATER'];

// Mismos hexes que usa el HUD de SimPlayer, para que el marcador y la vista de
// jugador pinten un Pokémon con el color de tipo idéntico.
export const TYPE_COLORS = {
    NORMAL: '#a8a878', BUG: '#a8b820', DARK: '#705848', DRAGON: '#7038f8',
    ELECTRIC: '#f0c020', FAIRY: '#ee99ac', FIGHTING: '#c03028', FIRE: '#f08030',
    FLYING: '#a890f0', GHOST: '#705898', GRASS: '#78c850', GROUND: '#e0c068',
    ICE: '#98d8d8', POISON: '#a040a0', PSYCHIC: '#f85888', ROCK: '#b8a038',
    STEEL: '#b8b8d0', WATER: '#6890f0',
    // Casi blanco: es el único que no va con texto blanco encima, lo que ya lo
    // distingue de los 18 a simple vista (ver .type_STELLAR en _types.scss).
    STELLAR: '#efe6ff',
};

// Los tipos llegan de la DB en inglés y en mayúsculas; en pantalla van en
// español, que es el idioma de las cartas físicas.
export const TYPE_ES = {
    NORMAL: 'Normal', BUG: 'Bicho', DARK: 'Siniestro', DRAGON: 'Dragón',
    ELECTRIC: 'Eléctrico', FAIRY: 'Hada', FIGHTING: 'Lucha', FIRE: 'Fuego',
    FLYING: 'Volador', GHOST: 'Fantasma', GRASS: 'Planta', GROUND: 'Tierra',
    ICE: 'Hielo', POISON: 'Veneno', PSYCHIC: 'Psíquico', ROCK: 'Roca',
    STEEL: 'Acero', WATER: 'Agua', STELLAR: 'Astral',
};

const typeKey = (t) => (t || '').toString().toUpperCase();

export const typeColor = (t) => TYPE_COLORS[typeKey(t)] || '#7a7a8c';
export const typeLabel = (t) => TYPE_ES[typeKey(t)] || typeKey(t);

export default POKEMON_TYPES;
