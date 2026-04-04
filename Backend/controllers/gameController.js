import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Rival from "../models/Rival.js";
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


import { getGame, initializeGame,updateGameAndNotify,getRivalrById,getPlayerById, saveGame, loadGame } from "../gameInstance.js";
import { getIo } from "../socketIo.js";

async function openDb() {
    return open({
        //filename: './db/pokimonDOUBLE.sqlite',
       filename: './db/pokimonULTIMIX.sqlite',
        driver: sqlite3.Database
    });
}

async function  getAttack(idAttack,db){
    try {
        const AttackData = await db.get("SELECT * FROM attacks WHERE IDATK = ?", [idAttack]);
        if (!AttackData) {
            return res.status(404).json({ message: 'Attack was not found ' });
        }

        const newAttack = new Attacks(
            AttackData.IDATK,
            AttackData.NAME,
            AttackData.TYPE,
            AttackData.POWER,
            AttackData.EFFECT,
            AttackData.DICE

        )
        return newAttack;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }


}



export const startGame = async (req, res) => {
    try {
        // Aquí, inicializa o reinicia el juego
        // Por ejemplo, puedes llamar a una función en gameInstance.js
        const game = initializeGame(); // Esta función prepara el juego

        const io = getIo();
        io.emit('gameUpdated', game); // Emite el estado inicial del juego

        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addPlayer = async (req, res) => {

    try {
        console.log('adding player ' );
    const {id,name,turn} = req.body;
    const game = getGame();
    const player = new Player(id, name, turn);
    game.addPlayer(player);
    console.log('Jugador Agregado ' );
    updateGameAndNotify();
    res.status(200).json({ message: 'Jugador Agregado ' });
    } catch (error) {
    console.error("Error adding player:", error);
    res.status(500).json({ message: error.message });
}
};



export const nextTurn = async (req, res) => {
    try {
        const { playerButton } = req.body || {};
        const game = getGame();

        if (playerButton && playerButton !== 'master') {
            const playerIndex = parseInt(playerButton.replace('player', ''), 10) - 1;
            if (playerIndex !== game.currentTurn) {
                return res.status(200).json({ message: 'No es tu turno' });
            }
        }

        game.nextTurn();
        game.calculatePoints();
        game.updatePlayerPositions();
        if (game.currentTurn === 0) {
            saveGame();
        }
        updateGameAndNotify();

        res.status(200).json({ message: 'Turno avanzado' });
    } catch (error) {
        console.error("Error en nextTurn:", error);
        res.status(500).json({ message: error.message });
    }
};

export const prevTurn = async (req, res) => {
    try {
        const game = getGame();
        game.previousTurn();
        game.calculatePoints(); 
        game.updatePlayerPositions(); 

        updateGameAndNotify(); // Asegúrate de que esta función envíe una respuesta

        res.status(200).json({ message: 'Turno avanzado' });
    } catch (error) {
        console.error("Error en nextTurn:", error);
        res.status(500).json({ message: error.message });
    }
};


export const nextPlayerView = async (req, res) => {
    try {
        const game = getGame();
        game.nextPlayerView();
        game.calculatePoints(); 
        game.updatePlayerPositions(); 

        updateGameAndNotify(); // Asegúrate de que esta función envíe una respuesta

        res.status(200).json({ message: 'Turno avanzado' });
    } catch (error) {
        console.error("Error en nextTurn:", error);
        res.status(500).json({ message: error.message });
    }
};

export const prevPlayerView = async (req, res) => {
    try {
        const game = getGame();
        game.prevPlayerView();
        game.calculatePoints(); 
        game.updatePlayerPositions(); 

        updateGameAndNotify(); // Asegúrate de que esta función envíe una respuesta

        res.status(200).json({ message: 'Turno avanzado' });
    } catch (error) {
        console.error("Error en nextTurn:", error);
        res.status(500).json({ message: error.message });
    }
};

export const startBattle = async (req, res) => {
    try {
        const game = getGame();
        game.calculatePoints(); 
        game.updatePlayerPositions(); 
        updateGameAndNotify(); // Asegúrate de que esta función envíe una respuesta

        res.status(200).json({ message: 'Battle Started ' });
    } catch (error) {
        console.error("Error en Battle:", error);
        res.status(500).json({ message: error.message });
    }
};

export const wildBattle = async (req, res) => {
    console.log('Wild started');
    try {
        const rival = getRivalrById('Rival');
        const db = await openDb();
        const {pokemonId} = req.body;
        console.log(pokemonId);

        //ajuste  Asegurarse de que pokemonId tenga siempre 4 dígitos ultimixdnn
        const rawWildId = pokemonId.toString().trim().toUpperCase();
        const wildPrefixMatch = rawWildId.match(/^([A-Z]+)(\d+)$/);
        const formattedPokemonId = wildPrefixMatch ? wildPrefixMatch[1] + wildPrefixMatch[2].padStart(4, '0') : rawWildId.padStart(4, '0');
        console.log('formattedPokemonId ' + formattedPokemonId);

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [formattedPokemonId]);
        console.log(pokemonData);
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
       
     
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

       
        // Crear una instancia de Pokémon
        const pokemon = new Pokemons(
            pokemonData.UID,
            pokemonData.POKEDEX,
            pokemonData.NAME,
            pokemonData.TYPE1,
            pokemonData.TYPE2,
            pokemonData.LEVEL,
            Attack1,
            Attack2,
            Attack3,
            pokemonData.NEXT_LEVEL,
            pokemonData.EVOLUTION,
            pokemonData.MEGA
        );

        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
        
        
        const game = getGame();
        console.log("game:");
        console.log(game);
        rival.addPokemon(pokemon)
        console.log("Rival");
        console.log(rival);

        game.wildBattleOn(rival);
        
        console.log('Wild Pokemon added ' + pokemon.name );
        console.log(game);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon salvaje Agregado'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const scanBattle = async (req, res) => {
    console.log('Wild Battle Scaned started');
    try {
        const { pokemonUID, playerButton } = req.body;
        const game = getGame();

        if (playerButton && playerButton !== 'master') {
            const playerIndex = parseInt(playerButton.replace('player', ''), 10) - 1;
            if (playerIndex !== game.currentTurn) {
                return res.status(200).json({ message: 'No es tu turno' });
            }
        }

        const rival = getRivalrById('Rival');
        const db = await openDb();
        console.log(pokemonUID);

        // Asegurarse de que pokemonId tenga siempre 3 dígitos
        

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE UID LIKE ?", ['%' + pokemonUID + '%']);
        console.log(pokemonData);
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
       
     
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

       
        // Crear una instancia de Pokémon
        const pokemon = new Pokemons(
            pokemonData.UID,
            pokemonData.POKEDEX,
            pokemonData.NAME,
            pokemonData.TYPE1,
            pokemonData.TYPE2,
            pokemonData.LEVEL,
            Attack1,
            Attack2,
            Attack3,
            pokemonData.NEXT_LEVEL,
            pokemonData.EVOLUTION,
            pokemonData.MEGA
        );

        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores

        rival.addPokemon(pokemon);

        game.wildBattleOn(rival);
        
        console.log('Wild Pokemon added ' + pokemon.name );
      
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon salvaje Agregado'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const playerBattle = async (req, res) => {
    console.log('player battle started');
    try {
        const {playerId} = req.body;
        const player = getPlayerById(playerId);
        
        
        console.log(player);

        if (!player) {
            return res.status(404).json({ message: 'player no encontrado' });
        }
        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
        
        const game = getGame();
        game.wildBattleOn(player);
        console.log('Player added ' + player.name );
  
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon salvaje Agregado'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const leaderBattle = async (req, res) => {
    console.log('Leader Battle started');
    try {
        const {LeaderID,pokemonId1,pokemonId2} = req.body;
        const rival = getRivalrById(LeaderID);
        const db = await openDb();
        
       

      

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemonsLeaders WHERE UID = ? LIMIT 1", [pokemonId1]);
        console.log(pokemonData);
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }
        // Crear una instancia de Pokémon
        const pokemon1 = new Pokemons(
            pokemonData.UID,
            pokemonData.POKEDEX,
            pokemonData.NAME,
            pokemonData.TYPE1,
            pokemonData.TYPE2,
            pokemonData.LEVEL,
            Attack1,
            Attack2,
            Attack3,
            pokemonData.NEXT_LEVEL,
            pokemonData.EVOLUTION,
            pokemonData.MEGA
        );

        const pokemonData2 = await db.get("SELECT * FROM pokemonsLeaders WHERE UID = ? LIMIT 1", [pokemonId2]);
        console.log(pokemonData2);
        const Attack1_2 = await getAttack(pokemonData2.ATK1,db);
        const Attack2_2 = await getAttack(pokemonData2.ATK2,db);
        const Attack3_2 = await getAttack(pokemonData2.ATK3,db);
        if (!pokemonData2) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }
        // Crear una instancia de Pokémon
        const pokemon2 = new Pokemons(
            pokemonData2.UID,
            pokemonData2.POKEDEX,
            pokemonData2.NAME,
            pokemonData2.TYPE1,
            pokemonData2.TYPE2,
            pokemonData2.LEVEL,
            Attack1_2,
            Attack2_2,
            Attack3_2,
            pokemonData2.NEXT_LEVEL,
            pokemonData2.EVOLUTION,
            pokemonData2.MEGA
        );

        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
    
        const game = getGame();
        rival.add2Pokemon(pokemon1,pokemon2)
        console.log("Rival");
        console.log(rival);

        game.wildBattleOn(rival);
        
        console.log('Rival with pokemons added ' + rival.name );
        console.log(game);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon salvaje Agregado'});
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loadGameController = (req, res) => {
    try {
        const game = loadGame();
        updateGameAndNotify();
        res.status(200).json({ message: 'Partida cargada correctamente', round: game.round });
    } catch (error) {
        console.error('Error al cargar la partida:', error);
        res.status(500).json({ message: 'No se encontró ningún auto-guardado' });
    }
};

export const simWildBattle = async (req, res) => {
    console.log('Sim Wild Battle started');
    try {
        const { playerId, pokemonId } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        const db = await openDb();
        //ajuste 4 digitos pokimonId ultimixdnn
        const formattedPokemonId = pokemonId.toString().padStart(4, '0');
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [formattedPokemonId]);
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const Attack1 = await getAttack(pokemonData.ATK1, db);
        const Attack2 = await getAttack(pokemonData.ATK2, db);
        const Attack3 = await getAttack(pokemonData.ATK3, db);

        const pokemon = new Pokemons(
            pokemonData.UID,
            pokemonData.POKEDEX,
            pokemonData.NAME,
            pokemonData.TYPE1,
            pokemonData.TYPE2,
            pokemonData.LEVEL,
            Attack1,
            Attack2,
            Attack3,
            pokemonData.NEXT_LEVEL,
            pokemonData.EVOLUTION,
            pokemonData.MEGA
        );

        const simRival = new Rival('SimRival-' + playerId, 'Wild Pokemon');
        simRival.addPokemon(pokemon);
        player.setSimRival(simRival);

        updateGameAndNotify();
        res.status(200).json({ message: 'SimRival salvaje asignado al jugador ' + playerId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const simLeaderBattle = async (req, res) => {
    console.log('Sim Leader Battle started');
    try {
        const { playerId, LeaderID, pokemonId1, pokemonId2 } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        const rival = getRivalrById(LeaderID);
        const db = await openDb();

        const pokemonData = await db.get("SELECT * FROM pokemonsLeaders WHERE UID = ? LIMIT 1", [pokemonId1]);
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon 1 no encontrado' });
        }
        const Attack1 = await getAttack(pokemonData.ATK1, db);
        const Attack2 = await getAttack(pokemonData.ATK2, db);
        const Attack3 = await getAttack(pokemonData.ATK3, db);
        const pokemon1 = new Pokemons(
            pokemonData.UID, pokemonData.POKEDEX, pokemonData.NAME,
            pokemonData.TYPE1, pokemonData.TYPE2, pokemonData.LEVEL,
            Attack1, Attack2, Attack3,
            pokemonData.NEXT_LEVEL, pokemonData.EVOLUTION, pokemonData.MEGA
        );

        const pokemonData2 = await db.get("SELECT * FROM pokemonsLeaders WHERE UID = ? LIMIT 1", [pokemonId2]);
        if (!pokemonData2) {
            return res.status(404).json({ message: 'Pokémon 2 no encontrado' });
        }
        const Attack1_2 = await getAttack(pokemonData2.ATK1, db);
        const Attack2_2 = await getAttack(pokemonData2.ATK2, db);
        const Attack3_2 = await getAttack(pokemonData2.ATK3, db);
        const pokemon2 = new Pokemons(
            pokemonData2.UID, pokemonData2.POKEDEX, pokemonData2.NAME,
            pokemonData2.TYPE1, pokemonData2.TYPE2, pokemonData2.LEVEL,
            Attack1_2, Attack2_2, Attack3_2,
            pokemonData2.NEXT_LEVEL, pokemonData2.EVOLUTION, pokemonData2.MEGA
        );

        const simRival = new Rival('SimLeader-' + playerId, rival ? rival.name : LeaderID);
        simRival.add2Pokemon(pokemon1, pokemon2);
        player.setSimRival(simRival);

        updateGameAndNotify();
        res.status(200).json({ message: 'SimRival lider asignado al jugador ' + playerId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changeWeather = async (req, res) => {
    console.log('changing weather ');
    try {
        const {newWeather} = req.body;
        const game = getGame();
        game.changeWeather(newWeather);
        updateGameAndNotify();
        res.status(200).json({ message: 'Clima  Cambiado ' });
        

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//New Battle features

export const setMyBattlePokemon = async (req, res) => {
    console.log('setting my battle pokemon ');
    try {
        const {player,idPokemon} = req.body;
        const game = getGame();
        game.setBattlePokemon(player,idPokemon);
        updateGameAndNotify();
        res.status(200).json({ message: 'Pokemon de batalla establecido ' });
        

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const setMyBattleAttack = async (req, res) => {
    console.log('setting my battle attack ');
    try {
        const {player,idAttack} = req.body;
        const game = getGame();
        game.setBattleAttack(player,idAttack);
        updateGameAndNotify();
        res.status(200).json({ message: 'Ataque de batalla establecido ' });
        

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
export const setMyBattleTotal = async (req, res) => {
    console.log('setting my battle total ');
    try {
        const {player,NewTotal} = req.body;
        const game = getGame();
        game.setBattleTotal(player,NewTotal);
        updateGameAndNotify();
        res.status(200).json({ message: 'Total de batalla establecido ' });
        

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const setBattleBonusFinal = async (req, res) => {
    try {
        const { player, bonus } = req.body;
        const game = getGame();
        game.setBattleBonusFinal(player, bonus);
        updateGameAndNotify();
        res.status(200).json({ message: 'Bonus final establecido' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setBattleDice = async (req, res) => {
    try {
        const { player, dice } = req.body;
        const game = getGame();
        game.setBattleDice(player, dice);
        updateGameAndNotify();
        res.status(200).json({ message: 'Dado de batalla establecido' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setBattleBonuses = async (req, res) => {
    try {
        const { player, b1, b2, b3 } = req.body;
        const game = getGame();
        game.setBattleBonuses(player, b1, b2, b3);
        updateGameAndNotify();
        res.status(200).json({ message: 'Bonuses de batalla establecidos' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleBattlePublic = async (_req, res) => {
    try {
        const game = getGame();
        game.toggleBattlePublic();
        updateGameAndNotify();
        res.status(200).json({ message: 'Battle public toggled', battlePublic: game.battlePublic });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const setBattlePhase = async (req, res) => {
    console.log('setting battle phase ');
    try {
        const { newPhase } = req.body;
        const game = getGame();
        game.setBattlePhase(newPhase);
        updateGameAndNotify();
        res.status(200).json({ message: 'Fase de batalla establecida ' });
        

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}














