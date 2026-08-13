// Los 18 tipos, en el orden que ya usaba el selector de TM.
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
};

export const typeColor = (t) => TYPE_COLORS[(t || '').toString().toUpperCase()] || '#7a7a8c';

export default POKEMON_TYPES;
