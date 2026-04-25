import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Rival from "../models/Rival.js";
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


import { getGame, initializeGame,updateGameAndNotify,getRivalrById,getPlayerById, saveGame, loadGame, setGameRivals } from "../gameInstance.js";
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

// TODO: Pendiente de pruebas — cuando no es el turno del jugador, asigna el pokemon escaneado
// como simRival personal del jugador (visible en SimPlayer) sin afectar el rival global del game.
export const scanBattle = async (req, res) => {
    console.log('Wild Battle Scaned started');
    try {
        const { pokemonUID, playerButton } = req.body;
        const game = getGame();

        const db = await openDb();
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE UID LIKE ?", ['%' + pokemonUID + '%']);
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const Attack1 = await getAttack(pokemonData.ATK1, db);
        const Attack2 = await getAttack(pokemonData.ATK2, db);
        const Attack3 = await getAttack(pokemonData.ATK3, db);

        const pokemon = new Pokemons(
            pokemonData.UID, pokemonData.POKEDEX, pokemonData.NAME,
            pokemonData.TYPE1, pokemonData.TYPE2, pokemonData.LEVEL,
            Attack1, Attack2, Attack3,
            pokemonData.NEXT_LEVEL, pokemonData.EVOLUTION, pokemonData.MEGA
        );

        // Si es master o es el turno del jugador → actualiza el rival global de game
        if (!playerButton || playerButton === 'master') {
            const rival = getRivalrById('Rival');
            rival.addPokemon(pokemon);
            game.wildBattleOn(rival);
            console.log('Wild Pokemon added (master) ' + pokemon.name);
        } else {
            const playerIndex = parseInt(playerButton.replace('player', ''), 10) - 1;
            const isMyTurn = playerIndex === game.currentTurn;

            if (isMyTurn) {
                // Es su turno → actualiza rival global
                const rival = getRivalrById('Rival');
                rival.addPokemon(pokemon);
                game.wildBattleOn(rival);
                console.log('Wild Pokemon added (turn player) ' + pokemon.name);
            }

            // Siempre actualiza el simRival del jugador (sea o no su turno)
            const player = game.players[playerIndex];
            if (player) {
                const simRival = new Rival('SimRival-' + player.id + '-' + Date.now(), 'Wild Pokemon');
                simRival.addPokemon(pokemon);
                player.setSimRival(simRival);
                console.log('SimRival asignado a ' + player.name + ': ' + pokemon.name);
            }
        }

        updateGameAndNotify();
        res.status(200).json({ message: 'Pokémon salvaje procesado', pokemon: pokemonData.NAME });
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
        rival.add2Pokemon(pokemon1,pokemon2);
        rival.badgeNum = badgeNum;
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

export const loadGameController = async (req, res) => {
    try {
        const game = loadGame();
        const db = await openDb();
        await loadRivalsForGeneration(game.generation || 1, db);
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

export const simPlayerBattle = async (req, res) => {
    console.log('Sim Player Battle started');
    try {
        const { playerId, rivalPlayerId } = req.body;
        const player = getPlayerById(playerId);
        const rivalPlayer = getPlayerById(rivalPlayerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        if (!rivalPlayer) return res.status(404).json({ message: 'Jugador rival no encontrado' });

        const simRival = new Rival('SimPlayer-' + rivalPlayerId, rivalPlayer.name);
        simRival.pokemons = [...rivalPlayer.pokemons];
        simRival.megas = [...(rivalPlayer.megas || [])];
        simRival.gmaxes = [...(rivalPlayer.gmaxes || [])];
        simRival.dynamax = rivalPlayer.dynamax || false;

        player.setSimRival(simRival);
        updateGameAndNotify();
        res.status(200).json({ message: 'SimRival jugador asignado a ' + playerId });
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
        const { player, dice, rows } = req.body;
        const game = getGame();
        game.setBattleDice(player, dice, rows);
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

export const requestPurchase = async (req, res) => {
    try {
        const { playerId, item, price } = req.body;
        const game = getGame();
        const player = game.players.find(p => p.id === playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        if (player.coins < price) return res.status(400).json({ message: 'Monedas insuficientes' });
        const purchaseRequest = {
            id: Date.now().toString(),
            playerId: player.id,
            playerName: player.name,
            item,
            price
        };
        game.pendingPurchases.push(purchaseRequest);
        updateGameAndNotify();
        res.status(200).json({ message: 'Solicitud enviada', purchaseId: purchaseRequest.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approvePurchase = async (req, res) => {
    try {
        const { purchaseId } = req.body;
        const game = getGame();
        const request = game.pendingPurchases.find(r => r.id === purchaseId);
        if (!request) return res.status(404).json({ message: 'Solicitud no encontrada' });
        const player = game.players.find(p => p.id === request.playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        if (player.coins < request.price) return res.status(400).json({ message: 'Monedas insuficientes' });
        const coinsAfter = player.coins - request.price;
        player.updateNewCoins(coinsAfter);
        game.pendingPurchases = game.pendingPurchases.filter(r => r.id !== purchaseId);
        game.purchaseHistory.push({
            playerName: request.playerName,
            item: request.item,
            price: request.price,
            coinsAfter,
            round: game.round
        });
        updateGameAndNotify();
        res.status(200).json({ message: 'Compra aprobada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const denyPurchase = async (req, res) => {
    try {
        const { purchaseId } = req.body;
        const game = getGame();
        game.pendingPurchases = game.pendingPurchases.filter(r => r.id !== purchaseId);
        updateGameAndNotify();
        res.status(200).json({ message: 'Compra denegada' });
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
};

export const startSimMirror = async (req, res) => {
    try {
        const { playerId } = req.body;
        const game = getGame();
        game.startSimMirror(playerId);
        updateGameAndNotify();
        res.status(200).json({ message: 'Mirror de simulación iniciado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Carga rivales únicos desde DB para una generación y los inyecta al juego
async function loadRivalsForGeneration(generation, db) {
    const rows = await db.all(
        "SELECT DISTINCT RIVAL_ID, RIVAL_NAME FROM pokemonsLeaders WHERE GENERATION = ? AND RIVAL_ID IS NOT NULL",
        [generation]
    );
    setGameRivals(rows.map(r => ({ id: r.RIVAL_ID, name: r.RIVAL_NAME })));
}

export const setGeneration = async (req, res) => {
    try {
        const { generation } = req.body;
        const db = await openDb();
        const game = getGame();
        game.generation = generation;
        await loadRivalsForGeneration(generation, db);
        updateGameAndNotify();
        res.status(200).json({ message: 'Generación establecida', generation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeadersByGeneration = async (req, res) => {
    try {
        const generation = parseInt(req.query.generation) || 1;
        const db = await openDb();

        // RIVAL_ID y RIVAL_NAME vienen directo de la DB — sin hardcode
        const rows = await db.all(
            "SELECT UID, POKEDEX, RIVAL_ID, RIVAL_NAME FROM pokemonsLeaders WHERE GENERATION = ? AND RIVAL_ID IS NOT NULL ORDER BY UID",
            [generation]
        );

        const getCategory = (img) => {
            if (!img) return 'other';
            if (img.startsWith('gymE')) return 'elite';
            if (img.startsWith('gymC')) return 'champion';
            if (img.startsWith('gymR')) return 'rocket';
            if (img.startsWith('gym'))  return 'gym';
            if (img.startsWith('Riv'))  return 'rival';
            return 'other';
        };

        // Agrupa por RIVAL_ID (viene de la DB)
        const map = {};
        for (const row of rows) {
            const key = row.RIVAL_ID;
            const num = parseInt(row.UID.match(/\d+$/)[0]);
            if (!map[key]) map[key] = { rivalId: key, rivalName: row.RIVAL_NAME, img: row.POKEDEX, pokemons: [] };
            map[key].pokemons.push({ uid: row.UID, num });
        }

        const CATEGORY_ORDER = ['gym', 'elite', 'champion', 'rocket', 'rival', 'other'];

        const leaders = Object.values(map).map(l => {
            const sorted = l.pokemons.sort((a, b) => a.num - b.num);
            const category = getCategory(l.img);
            const numMatch = l.img?.match(/(\d+)/);
            const sortKey = numMatch ? parseInt(numMatch[1]) : 99;
            return {
                leaderKey: l.rivalId,
                name: l.rivalName,
                uid1: sorted[0]?.uid,
                uid2: sorted[1]?.uid,
                img: l.img,
                category,
                sortKey,
            };
        });

        leaders.sort((a, b) => {
            const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
            if (catDiff !== 0) return catDiff;
            return a.sortKey - b.sortKey;
        });

        res.status(200).json(leaders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};














