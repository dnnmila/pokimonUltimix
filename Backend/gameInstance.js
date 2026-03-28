import Game from "./models/Game.js";
import Player from "./models/Player.js";
import Rival from "./models/Rival.js";

import { getIo } from "./socketIo.js"



let game = new Game("xxx1");



export const initializeGame = () =>{
    

 
    const rivals = [
    new Rival("Gym1","Brook"),
    new Rival("Gym2","Misty"),
    new Rival("Gym3","Surge"),
    new Rival("Gym4","Erika"),
    new Rival("Gym5","Koga"),
    new Rival("Gym6","Sabrina"),
    new Rival("Gym7","Blaine"),
    new Rival("Gym8","Giovani"),
    new Rival("Rival","Wild Pokemon"),
    new Rival("Gary","Gary"),
    //new Rival("Rocket","Team Rocket"),
    new Rival("Elite1","Agatha"),
    new Rival("Elite2","Bruno"),
    new Rival("Elite3","Lorelei"),
    new Rival("Elite4","Lance"),
    new Rival("Red","Red"),
    new Rival("Ariadna","Ariadna"),
    new Rival("Petrel","Petrel"),
    new Rival("Blue1","Blue"),
    new Rival("Blue2","Blue"),
    new Rival("Blue3","Blue"),
    new Rival("Blue4","Blue"),
    new Rival("Blue5","Blue"),


    ];
    rivals.forEach(rival => game.addRival(rival)); 
    
    return game;   
};



export const getGame = () => game;

export const getPlayerById = (playerId) => {
    return game.players.find(player => player.id === playerId);
};

export const getPokemonById = (playerId, pokemonId) => {
    // Primero encontramos el jugador por su ID
    const player = game.players.find(player => player.id === playerId);
    if (!player) {
        return null;  // Regresamos null si no encontramos al jugador
    }
    // Luego buscamos el pokemon por el identificador pokedex dentro del arreglo de pokemons del jugador
    return player.pokemons.find(pokemon => pokemon.pokedex === pokemonId);
};

export const getRivalrById = (rivalId) => {
    return game.rivals.find(rival => rival.id === rivalId);
};
/*export const updateGameAndNotify = (newState) => {
    // Actualiza solo las propiedades del juego
    for (const key in newState) {
        if (newState.hasOwnProperty(key)) {
            game[key] = newState[key];
        }
    }

    const io = getIo();
    io.emit('gameUpdated', game); // Notifica a los clientes
};*/

export const updateGameAndNotify = () => {
    const io = getIo();
    io.emit('gameUpdated', game); // Notifica a los clientes con el estado actualizado
};