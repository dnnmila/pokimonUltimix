// Catálogo de generaciones compartido por la pantalla de inicio, la selección
// de generación y el menú de jugadores. Un único sitio donde añadir una región
// nueva cuando se habilite su mapa.
import mapGen1 from '../images/maps/gen1.jpg';
import mapGen2 from '../images/maps/gen2.png';
import mapGen3 from '../images/maps/gen3.png';
import mapGen4 from '../images/maps/gen4.png';

export const GENERATIONS = [
    { gen: 1, region: 'Kanto',  gyms: 8, map: mapGen1, color: '#6cb865', tint: '#dff0d6' },
    { gen: 2, region: 'Johto',  gyms: 8, map: mapGen2, color: '#d9a63a', tint: '#f6ead0' },
    { gen: 3, region: 'Hoenn',  gyms: 8, map: mapGen3, color: '#4fb3e0', tint: '#d8eef9' },
    { gen: 4, region: 'Sinnoh', gyms: 8, map: mapGen4, color: '#7b8ee0', tint: '#dfe4f9' },
    { gen: 5, region: 'Unova',  gyms: 8, map: null,    color: '#9aa3ad', tint: '#e6e8ea' },
    { gen: 6, region: 'Kalos',  gyms: 8, map: null,    color: '#9aa3ad', tint: '#e6e8ea' },
    { gen: 7, region: 'Alola',  gyms: 8, map: null,    color: '#9aa3ad', tint: '#e6e8ea' },
    { gen: 8, region: 'Galar',  gyms: 8, map: null,    color: '#9aa3ad', tint: '#e6e8ea' },
    { gen: 9, region: 'Paldea', gyms: 8, map: null,    color: '#9aa3ad', tint: '#e6e8ea' },
];

export const getGeneration = (gen) =>
    GENERATIONS.find(g => g.gen === Number(gen)) || GENERATIONS[0];
