import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Rival from "../models/Rival.js";
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';


import { getGame, initializeGame,updateGameAndNotify,getRivalrById,getPlayerById, saveGame, loadGame, getSaveInfo, setGameRivals } from "../gameInstance.js";
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

        // Noquear pokemon si el jugador abandonó una batalla oficial a medias
        if (game.battlePublic && game.battlePhase !== 'PokemonSelection') {
            const currentPlayer = game.players[game.currentTurn];
            const battlePkm = game.myPlayerPkm[game.myPlayerPkm.length - 1];
            const playerWon = game.battlePhase === 'RollDice' && game.myPlayerTotal > game.myRivalTotal;
            if (!playerWon && battlePkm) {
                const target = currentPlayer.resolveBasePokemon(battlePkm);
                if (target && target.state === 'Alive') {
                    currentPlayer.changeState(target.id);
                    const rivalPkm = game.myRivalPkm[game.myRivalPkm.length - 1];
                    game.stateHistory.push({
                        round: game.round,
                        playerName: currentPlayer.name,
                        pokemonName: target.name,
                        rivalName: game.CurrentRival?.name || null,
                        rivalPokemonName: rivalPkm?.name || null,
                        source: 'sim-battle',
                    });
                }
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
        // Hay POKEDEX con sufijo en minúscula (0718i, 0492e, P0128ii): se prueba tal cual
        // antes de normalizar, porque toUpperCase() los rompería.
        const rawWildId = pokemonId.toString().trim();
        let pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [rawWildId]);
        if (!pokemonData) {
            const upperWildId = rawWildId.toUpperCase();
            const wildPrefixMatch = upperWildId.match(/^([A-Z]+)(\d+)$/);
            const formattedPokemonId = wildPrefixMatch ? wildPrefixMatch[1] + wildPrefixMatch[2].padStart(4, '0') : upperWildId.padStart(4, '0');
            console.log('formattedPokemonId ' + formattedPokemonId);
            pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? COLLATE NOCASE LIMIT 1", [formattedPokemonId]);
        }
        console.log(pokemonData);

        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const Attack1 = await getAttack(pokemonData.ATK1, db);
        const Attack2 = await getAttack(pokemonData.ATK2, db);
        const Attack3 = await getAttack(pokemonData.ATK3, db);

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

            // Asignar simRival al jugador en turno (igual que si fuera su botón)
            const currentPlayer = game.players[game.currentTurn];
            if (currentPlayer) {
                const simRival = new Rival('SimRival-' + currentPlayer.id + '-' + Date.now(), 'Wild Pokemon');
                simRival.addPokemon(pokemon);
                currentPlayer.setSimRival(simRival);
                console.log('SimRival (master) asignado a ' + currentPlayer.name + ': ' + pokemon.name);
            }
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

export const saveInfoController = async (req, res) => {
    try {
        res.status(200).json(getSaveInfo());
    } catch (error) {
        console.error('Error al leer el auto-guardado:', error);
        res.status(200).json({ exists: false });
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

// Coloca o quita una carta de campo en uno de los 2 espacios.
// slot: 0 | 1 · id: null para vaciar · owner: 'player' | 'rival' (solo cartas de equipo)
export const setFieldMove = async (req, res) => {
    try {
        const { slot, id, owner } = req.body;
        const game = getGame();
        game.setFieldMove(slot, id, owner);
        updateGameAndNotify();
        res.status(200).json({ message: 'Carta de campo actualizada', fieldMoves: game.fieldMoves });
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

// Qué pestaña del equipo mira el jugador (equipo normal / megas y G-Max).
// Es puro reflejo para el espejo del marcador: no cambia nada de la batalla.
export const setFormsView = async (req, res) => {
    try {
        const { showForms } = req.body;
        const game = getGame();
        game.simFormsView = !!showForms;
        updateGameAndNotify();
        res.status(200).json({ message: 'Vista de formas establecida' });
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

export const endGame = async (req, res) => {
    try {
        const game = getGame();
        game.paused = true;
        game.pausedAt = null;
        game.players.forEach(p => { p.turnStartTime = null; });
        await updateGameAndNotify(game);
        res.status(200).json({ ended: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const pauseGame = async (req, res) => {
    try {
        const game = getGame();
        if (!game.paused) {
            game.paused = true;
            game.pausedAt = Date.now();
        } else {
            if (game.pausedAt) {
                const pausedDuration = Date.now() - game.pausedAt;
                const currentPlayer = game.players[game.currentTurn];
                if (currentPlayer?.turnStartTime) {
                    currentPlayer.turnStartTime += pausedDuration;
                }
            }
            game.paused = false;
            game.pausedAt = null;
        }
        await updateGameAndNotify(game);
        res.status(200).json({ paused: game.paused });
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
            `SELECT UID, POKEDEX, NAME, LEVEL, TYPE1, TYPE2, RIVAL_ID, RIVAL_NAME
             FROM pokemonsLeaders
             WHERE GENERATION = ? AND RIVAL_ID IS NOT NULL
             ORDER BY UID`,
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
            map[key].pokemons.push({
                uid: row.UID,
                num,
                // Cada Pokémon del líder tiene su propia imagen (RivPink1 / RivPink2, gym1_1 / gym1_2…)
                img: row.POKEDEX,
                name: (row.NAME || '').replace(/<\/?i>/g, '').trim(),
                level: row.LEVEL,
                type1: row.TYPE1,
                type2: row.TYPE2,
            });
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
                // Equipo completo, para poder mostrarlo antes de retar
                team: sorted,
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

// Lista de pokemon (formas Normal) para el autocompletado del buscador de salvajes.
// Se pide una sola vez al abrir la pantalla y el filtrado se hace en el cliente.
export const getPokemonList = async (req, res) => {
    try {
        const db = await openDb();

        // NAME puede traer markup <i></i> en las formas alternas — se limpia para poder buscarlo
        const rows = await db.all(
            `SELECT POKEDEX, NAME, TYPE1, TYPE2, LEVEL
             FROM pokemons
             WHERE FORM = 'Normal' AND POKEDEX IS NOT NULL AND POKEDEX <> ''
             GROUP BY POKEDEX
             ORDER BY POKEDEX`
        );

        const list = rows.map(r => ({
            pokedex: r.POKEDEX,
            name: (r.NAME || '').replace(/<\/?i>/g, '').trim(),
            type1: r.TYPE1,
            type2: r.TYPE2,
            level: r.LEVEL,
        }));

        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Metrónomo: devuelve un Pokémon al azar para que el master lea su carta física.
// Solo formas normales con POKEDEX de 4 dígitos (sin megas, G-Max ni formas alternas).
export const getRandomPokemon = async (req, res) => {
    try {
        const { color } = req.query;
        const db = await openDb();

        const filters = [
            "FORM = 'Normal'",
            "POKEDEX GLOB '[0-9][0-9][0-9][0-9]'"
        ];
        const params = [];
        if (color) {
            filters.push('TOKEN_COLOR = ?');
            params.push(color);
        }

        const row = await db.get(
            `SELECT POKEDEX, NAME, TYPE1, TYPE2, LEVEL, TOKEN_COLOR
             FROM pokemons
             WHERE ${filters.join(' AND ')}
             ORDER BY RANDOM()
             LIMIT 1`,
            params
        );

        if (!row) return res.status(404).json({ message: 'Sin Pokémon para ese color' });

        res.status(200).json({
            pokedex: row.POKEDEX,
            name: (row.NAME || '').replace(/<\/?i>/g, '').trim(),
            type1: row.TYPE1,
            type2: row.TYPE2,
            level: row.LEVEL,
            tokenColor: row.TOKEN_COLOR,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};














