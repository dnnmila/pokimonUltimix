// Catálogo de entrenadores seleccionables. El orden de esta lista es el orden
// en que se pintan en el menú de jugadores.
import trainer1  from '../images/trainers/Trainer1.webp';
import trainer2  from '../images/trainers/Trainer2.webp';
import trainer3  from '../images/trainers/Trainer3.webp';
import trainer4  from '../images/trainers/Trainer4.webp';
import trainer5  from '../images/trainers/Trainer5.webp';
import trainer6  from '../images/trainers/Trainer6.webp';
import trainer7  from '../images/trainers/Trainer7.webp';
import trainer8  from '../images/trainers/Trainer8.webp';
import trainer9  from '../images/trainers/Trainer9.webp';
import trainer10 from '../images/trainers/Trainer10.webp';
import trainer11 from '../images/trainers/Trainer11.webp';

export const TRAINERS = [
    { name: 'Mila',    image: trainer1  },
    { name: 'Wuicho',  image: trainer2  },
    { name: 'Kevin',   image: trainer3  },
    { name: 'Kampis',  image: trainer4  },
    { name: 'Mandito', image: trainer5  },
    { name: 'Doc',     image: trainer6  },
    { name: 'Tacho',   image: trainer7  },
    { name: 'Fede',    image: trainer8  },
    { name: 'Perry',   image: trainer9  },
    { name: 'Richi',   image: trainer10 },
    { name: 'Mono',    image: trainer11 },
    { name: 'Foxi',    image: trainer2  },
];

// Retrato de un jugador por su nombre. Antes cada componente resolvía esto con
// su propio mapa nombre → clase `.trainerN`, y esas clases se cayeron al
// rediseñar el menú de jugadores: los avatares quedaron en blanco.
export const getTrainerImage = (name) =>
    TRAINERS.find(t => t.name === name)?.image || TRAINERS[0].image;

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 6;
