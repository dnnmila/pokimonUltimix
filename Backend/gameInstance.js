import Game from "./models/Game.js";
import Player from "./models/Player.js";
import Rival from "./models/Rival.js";
import Pokemons from "./models/Pokemons.js";
import Attacks from "./models/Attacks.js";

import { getIo } from "./socketIo.js"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVE_PATH = path.join(__dirname, 'saves', 'autosave.json');



let game = new Game("xxx1");



export const initializeGame = () =>{
    game = new Game("xxx1");
    game.rivals = [new Rival("Rival", "Wild Pokemon")];
    return game;
};

export const setGameRivals = (rivalsFromDb) => {
    // Conserva el rival salvaje permanente y reemplaza el resto
    const wildRival = game.rivals.find(r => r.id === 'Rival') || new Rival("Rival", "Wild Pokemon");
    game.rivals = [wildRival, ...rivalsFromDb.map(r => new Rival(r.id, r.name))];
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

function reconstructAttack(a) {
    if (!a) return a;
    return Object.assign(new Attacks(a.id, a.name, a.type, a.strength, a.effect, a.dice), a);
}

function reconstructPokemon(pkm) {
    if (!pkm) return pkm;
    const p = new Pokemons(
        pkm.id, pkm.pokedex, pkm.name, pkm.type1, pkm.type2, pkm.level,
        reconstructAttack(pkm.attack1), reconstructAttack(pkm.attack2), reconstructAttack(pkm.attack3),
        pkm.nextLevel, pkm.evolution, pkm.mega
    );
    Object.assign(p, pkm);
    return p;
}

export const saveGame = () => {
    try {
        const dir = path.join(__dirname, 'saves');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        fs.writeFileSync(SAVE_PATH, JSON.stringify(game), 'utf8');
        console.log('Partida auto-guardada en ronda ' + game.round);
    } catch (error) {
        console.error('Error al guardar la partida:', error);
    }
};

export const loadGame = () => {
    const saved = JSON.parse(fs.readFileSync(SAVE_PATH, 'utf8'));

    const newGame = new Game(saved.id);
    Object.assign(newGame, saved);

    newGame.players = saved.players.map(p => {
        const player = new Player(p.id, p.name, p.turn);
        Object.assign(player, p);
        player.pokemons = (p.pokemons || []).map(reconstructPokemon);
        player.megas = (p.megas || []).map(reconstructPokemon);
        player.gmaxes = (p.gmaxes || []).map(reconstructPokemon);
        return player;
    });

    // Los rivales se restauran vacíos — loadGameController los recarga desde DB
    newGame.rivals = [new Rival("Rival", "Wild Pokemon")];

    if (saved.CurrentRival && saved.CurrentRival.id) {
        const restoredRival = newGame.rivals.find(r => r.id === saved.CurrentRival.id);
        if (restoredRival) {
            restoredRival.pokemons = (saved.CurrentRival.pokemons || []).map(reconstructPokemon);
            newGame.CurrentRival = restoredRival;
        }
    }

    newGame.myPlayerPkm = (saved.myPlayerPkm || []).map(reconstructPokemon);
    newGame.myRivalPkm = (saved.myRivalPkm || []).map(reconstructPokemon);
    newGame.myPlayerPkmAtk = (saved.myPlayerPkmAtk || []).map(reconstructAttack);
    newGame.myRivalPkmAtk = (saved.myRivalPkmAtk || []).map(reconstructAttack);

    game = newGame;
    return game;
};