// Catálogo de entrenadores seleccionables. El orden de esta lista es el orden
// en que se pintan en el menú de jugadores.
import trainer1  from '../images/trainers/Trainer1.webp';
import trainer1Avatar from '../images/trainers/Trainer1Avatar.webp';
import trainer2  from '../images/trainers/Trainer2.webp';
import trainer2Avatar from '../images/trainers/Trainer2Avatar.webp';
import trainer3  from '../images/trainers/Trainer3.webp';
import trainer4  from '../images/trainers/Trainer4.webp';
import trainer5  from '../images/trainers/Trainer5.webp';
import trainer6  from '../images/trainers/Trainer6.webp';
import trainer6Avatar from '../images/trainers/Trainer6Avatar.webp';
import trainer7  from '../images/trainers/Trainer7.webp';
import trainer8  from '../images/trainers/Trainer8.webp';
import trainer9  from '../images/trainers/Trainer9.webp';
import trainer10 from '../images/trainers/Trainer10.webp';
import trainer11 from '../images/trainers/Trainer11.webp';
import trainer11Avatar from '../images/trainers/Trainer11Avatar.webp';
import trainer12 from '../images/trainers/Trainer12.webp';

export const TRAINERS = [
    { name: 'Mila',    image: trainer1,  avatar: trainer1Avatar },
    { name: 'Wuicho',  image: trainer2, avatar: trainer2Avatar },
    { name: 'Kevin',   image: trainer3  },
    { name: 'Kampis',  image: trainer4  },
    { name: 'Mandito', image: trainer5  },
    { name: 'Doc',     image: trainer6, avatar: trainer6Avatar },
    { name: 'Tacho',   image: trainer7  },
    { name: 'Fede',    image: trainer8  },
    { name: 'Perry',   image: trainer9  },
    { name: 'Richi',   image: trainer10 },
    { name: 'Mono',    image: trainer11, avatar: trainer11Avatar },
    { name: 'Foxi',    image: trainer12 },
];

// Retrato de un jugador por su nombre. Antes cada componente resolvía esto con
// su propio mapa nombre → clase `.trainerN`, y esas clases se cayeron al
// rediseñar el menú de jugadores: los avatares quedaron en blanco.
export const getTrainerImage = (name) =>
    TRAINERS.find(t => t.name === name)?.image || TRAINERS[0].image;

// La misma imagen, pero para los sitios que la recortan en círculo.
//
// Esos sitios pintan con `background-size: cover` y `background-position:
// center top`, así que enseñan el CUADRADO SUPERIOR de la imagen y nada más.
// Con el arte vertical de siempre —figura de cuerpo entero, cabeza arriba y
// centrada— eso cae justo en la cara y por eso nunca hizo falta pensarlo.
//
// Una imagen que no sea así rompe el trato. La de Mono es cuadrada y de escena:
// él va montado a la derecha y el Rayquaza ocupa la izquierda, de modo que el
// cuadrado superior es la escena entera y a 54px su cara se queda en una docena
// de píxeles. `avatar` es la vía de escape: un recorte cerrado solo para los
// círculos, mientras la tarjeta del menú sigue enseñando la escena completa.
//
// Las de Wuicho y Doc fallan por otro lado: son verticales y de cuerpo entero,
// sí, pero muy anchas, porque el Pokémon va al lado (Gengar al hombro, el
// Rapidash entero a la derecha). El cuadrado superior los entra a los dos y
// deja la cara en un puñado de píxeles, así que también llevan su recorte.
//
// Es opcional a propósito. Sin ese campo esto devuelve exactamente lo mismo que
// getTrainerImage, así que los otros once entrenadores no se enteran de nada.
export const getTrainerAvatar = (name) => {
    const t = TRAINERS.find(x => x.name === name);
    return t?.avatar || t?.image || TRAINERS[0].image;
};

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
