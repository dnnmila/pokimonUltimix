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
        const {player,idPokemon,form} = req.body;
        const game = getGame();
        game.setBattlePokemon(player,idPokemon,form);
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
        const {player,NewTotal,extra} = req.body;
        const game = getGame();
        game.setBattleTotal(player,NewTotal,extra);
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
        // `kind` distingue comprar de vender. Llega ausente en las solicitudes
        // de siempre, así que el defecto tiene que ser 'buy': las partidas ya
        // guardadas y cualquier cliente sin actualizar siguen comprando igual.
        const { playerId, item, price, kind = 'buy' } = req.body;
        const isSell = kind === 'sell';
        const game = getGame();
        const player = game.players.find(p => p.id === playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        // Vender paga, no cobra: no hay saldo que comprobar
        if (!isSell && player.coins < price) return res.status(400).json({ message: 'Monedas insuficientes' });
        const purchaseRequest = {
            id: Date.now().toString(),
            playerId: player.id,
            playerName: player.name,
            item,
            price,
            kind: isSell ? 'sell' : 'buy'
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
        // Vender suma en vez de restar. Las solicitudes viejas no traen `kind`,
        // y sin él se comportan como compras, que es lo que eran.
        const isSell = request.kind === 'sell';
        if (!isSell && player.coins < request.price) return res.status(400).json({ message: 'Monedas insuficientes' });
        const coinsAfter = isSell
            ? player.coins + request.price
            : player.coins - request.price;
        player.updateNewCoins(coinsAfter);
        game.pendingPurchases = game.pendingPurchases.filter(r => r.id !== purchaseId);
        game.purchaseHistory.push({
            playerName: request.playerName,
            item: request.item,
            price: request.price,
            kind: isSell ? 'sell' : 'buy',
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
                const resumedAt = Date.now();
                // Se recorre a todos: si se cambió de jugador durante la pausa,
                // el turno nuevo arrancó en `pausedAt` y también hay que moverlo.
                // Nunca se empuja el inicio más allá del momento de reanudar,
                // que es lo que hacía correr el crono en negativo.
                game.players.forEach(p => {
                    if (p.turnStartTime) {
                        const pausedDuration = resumedAt - Math.max(p.turnStartTime, game.pausedAt);
                        if (pausedDuration > 0) p.turnStartTime += pausedDuration;
                    }
                });
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















// ═══════════════════════════════════════════════════════════════════════════
//  INCURSIÓN MAX (evento «Raid Dinamax»)
//
//  Cuatro Pokémon pelean POR TURNOS contra un mismo jefe y los totales se van
//  sumando; al final el jefe suma un D4 y se comparan las dos sumas (el host
//  gana los empates).
//
//  Reparto de responsabilidades: el motor de batalla NO se toca. Cada uno de
//  los cuatro combates es una batalla normal del SimPlayer contra el jefe, que
//  vive en `player.simRival` como cualquier otro rival. Lo único que se guarda
//  aquí es el marcador acumulado, y vive en la partida (no en la tablet) para
//  que el marcador del máster lo vea y para que sobreviva a un refresco.
//
//  El jefe se monta Gigamax si la especie tiene forma G-Max en la DB (son 46) y
//  Dinamax en cualquier otro caso. La transformación Dinamax NO se hace aquí:
//  la resuelve el front con `applyDynamax` (data/maxMoves.js), que ya convierte
//  los ataques a Movimientos Max sin tocar el nivel. Aquí solo se marca cuál de
//  las dos le toca.
// ═══════════════════════════════════════════════════════════════════════════

const RAID_TEAM_SIZE = 4;

// Construye un Pokémon completo (con sus tres ataques) desde su POKEDEX.
// Es lo mismo que hace simWildBattle, extraído para poder reusarlo con el jefe
// y con los salvajes de relleno.
async function buildPokemonFromDex(pokedex, db, idPrefix = 'raid') {
    const data = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokedex]);
    if (!data) return null;
    const pkm = new Pokemons(
        `${idPrefix}-${data.POKEDEX}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        data.POKEDEX,
        (data.NAME || '').replace(/<\/?i>/g, '').trim(),
        data.TYPE1, data.TYPE2, data.LEVEL,
        await getAttack(data.ATK1, db),
        await getAttack(data.ATK2, db),
        await getAttack(data.ATK3, db),
        data.NEXT_LEVEL, data.EVOLUTION, data.MEGA
    );
    pkm.tokenColor = data.TOKEN_COLOR;
    pkm.gmaxRef = (data.GMAX && data.GMAX !== 'NONE' && data.GMAX !== 'No') ? data.GMAX : null;
    return pkm;
}

// Arranca la incursión con el jefe que diga el host y lo deja montado como su
// simRival, en su forma definitiva.
//
// El jefe NO se sortea: los tokens se sacan en físico en la mesa y aquí solo se
// registra cuál salió, igual que con el buscador de salvajes.
export const raidStart = async (req, res) => {
    try {
        const { playerId, pokedex } = req.body;
        const game = getGame();
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        if (!pokedex) return res.status(400).json({ message: 'Falta el Pokémon del jefe' });

        const db = await openDb();
        const base = await buildPokemonFromDex(pokedex, db, 'raidboss');
        if (!base) return res.status(404).json({ message: 'Pokémon no encontrado' });

        // Gigamax si la especie tiene token propio; si no, pelea Dinamax.
        let boss = base;
        let bossMode = 'dynamax';
        if (base.gmaxRef) {
            const gmax = await buildPokemonFromDex(base.gmaxRef, db, 'raidboss');
            if (gmax) {
                boss = gmax;
                bossMode = 'gmax';
            }
        }

        const rival = new Rival('SimRaid-' + playerId, 'Raid Boss');
        rival.addPokemon(boss);
        player.setSimRival(rival);

        game.raid = {
            hostId: playerId,
            hostName: player.name,
            boss,
            bossMode,
            baseName: base.name,
            basePokedex: base.pokedex,
            team: [],
            rounds: [],
            die: null,
            result: null,
        };

        updateGameAndNotify();
        res.status(200).json({ message: 'Incursión iniciada', raid: game.raid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fija los cuatro atacantes. Un hueco llega de una de estas tres formas:
//
//   {ownerId, pokemonId}  Pokémon de otro jugador: se busca en su equipo.
//   {pokedex}             salvaje que el host sacó en físico y buscó por nombre.
//   {ownerId, pokemon}    Pokémon YA RESUELTO, que es como viajan los del host:
//                         puede subir en Mega, Gigamax, Dinamax o teracristalizado,
//                         y esas formas las arma el front (los objetos mega/G-Max
//                         viven en el jugador, y Dinamax y Tera son
//                         transformaciones de data/maxMoves y data/teraTypes).
//
// Se guarda una COPIA de cada Pokémon, no una referencia: en la incursión nadie
// sube de nivel ni se debilita, así que la foto del momento basta y evita
// resolver equipos ajenos en cada pintada.
export const raidTeam = async (req, res) => {
    try {
        const { playerId, slots } = req.body;
        const game = getGame();
        if (!game.raid || game.raid.hostId !== playerId) {
            return res.status(400).json({ message: 'No hay incursión activa para este jugador' });
        }
        if (!Array.isArray(slots) || slots.length !== RAID_TEAM_SIZE) {
            return res.status(400).json({ message: `Hacen falta ${RAID_TEAM_SIZE} Pokémon` });
        }

        const db = await openDb();
        const team = [];

        for (const slot of slots) {
            if (slot && slot.pokedex) {
                const wild = await buildPokemonFromDex(slot.pokedex, db, 'raidwild');
                if (!wild) return res.status(404).json({ message: 'Salvaje no encontrado: ' + slot.pokedex });
                team.push({ ownerId: null, ownerName: 'Salvaje', wild: true, pokemon: wild });
                continue;
            }
            const owner = getPlayerById(slot?.ownerId);
            if (!owner) return res.status(404).json({ message: 'Jugador del hueco no encontrado' });

            // El host manda el Pokémon ya montado en la forma con la que sube.
            const pkm = slot.pokemon || owner.pokemons?.find(p => p.id === slot?.pokemonId);
            if (!pkm) return res.status(404).json({ message: 'Pokémon del equipo no encontrado' });
            team.push({
                ownerId: owner.id,
                ownerName: owner.name,
                wild: false,
                pokemon: JSON.parse(JSON.stringify(pkm)),
            });
        }

        game.raid.team = team;
        game.raid.rounds = [];
        game.raid.die = null;
        game.raid.result = null;

        updateGameAndNotify();
        res.status(200).json({ message: 'Equipo de incursión listo', raid: game.raid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cierra un combate y suma sus dos totales al marcador.
export const raidRound = async (req, res) => {
    try {
        const { playerId, hostTotal, bossTotal } = req.body;
        const game = getGame();
        if (!game.raid || game.raid.hostId !== playerId) {
            return res.status(400).json({ message: 'No hay incursión activa para este jugador' });
        }
        if (game.raid.rounds.length >= RAID_TEAM_SIZE) {
            return res.status(400).json({ message: 'La incursión ya tiene sus cuatro combates' });
        }

        const slot = game.raid.team[game.raid.rounds.length];
        game.raid.rounds.push({
            attacker: slot?.pokemon?.name || '—',
            ownerName: slot?.ownerName || '',
            hostTotal: Number(hostTotal) || 0,
            bossTotal: Number(bossTotal) || 0,
        });

        updateGameAndNotify();
        res.status(200).json({ message: 'Combate registrado', raid: game.raid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Resuelve la incursión. El D4 del jefe llega desde la tablet: lo tira el host
// con su dado físico y aquí solo se registra. El host gana los empates, como
// dice la carta.
export const raidFinish = async (req, res) => {
    try {
        const { playerId, die } = req.body;
        const game = getGame();
        if (!game.raid || game.raid.hostId !== playerId) {
            return res.status(400).json({ message: 'No hay incursión activa para este jugador' });
        }
        if (game.raid.rounds.length < RAID_TEAM_SIZE) {
            return res.status(400).json({ message: 'Faltan combates por jugar' });
        }

        const value = Number(die);
        if (!Number.isInteger(value) || value < 1 || value > 4) {
            return res.status(400).json({ message: 'El dado del jefe tiene que ser de 1 a 4' });
        }

        const hostSum = game.raid.rounds.reduce((a, r) => a + r.hostTotal, 0);
        const bossSum = game.raid.rounds.reduce((a, r) => a + r.bossTotal, 0) + value;

        game.raid.die = value;
        game.raid.hostSum = hostSum;
        game.raid.bossSum = bossSum;
        game.raid.result = hostSum >= bossSum ? 'win' : 'lose';

        updateGameAndNotify();
        res.status(200).json({ message: 'Incursión resuelta', raid: game.raid });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cierra la incursión y libera el rival de simulación del host.
export const raidClear = async (req, res) => {
    try {
        const { playerId } = req.body;
        const game = getGame();
        const player = getPlayerById(playerId);
        if (player) player.setSimRival(null);
        if (game.raid && game.raid.hostId === playerId) game.raid = null;
        updateGameAndNotify();
        res.status(200).json({ message: 'Incursión cerrada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════
//  COMBATE MEGA (evento «Mega Battle»)
//
//  Una batalla suelta contra la mega evolución de la especie que diga el host.
//  Por dentro es una batalla SALVAJE y nada más: el rival se monta con el
//  nombre 'Wild Pokemon', que es la etiqueta de la que cuelga todo el flujo ya
//  hecho en SimPlayer (subida de nivel, captura, debilitado). No hace falta
//  añadir ni una rama nueva al motor de batalla.
//
//  Cómo se localiza la mega, siguiendo la misma regla que attachMega:
//    - la principal vive en la columna EVOLUTION de la forma base;
//    - las alternativas (Charizard X e Y) se buscan por PREEVOLUCION.
//  La columna MEGA no es una referencia: solo dice 'Yes' / 'No' / 'doble' /
//  'evo'. Y 'evo' (Zygarde) NO es una mega, es una piedra que habilita una
//  evolución normal, así que ahí no hay combate que montar.
// ═══════════════════════════════════════════════════════════════════════════

async function findMegaForms(pokedex, db) {
    const base = await db.get(
        "SELECT POKEDEX, NAME, MEGA, EVOLUTION FROM pokemons WHERE POKEDEX = ? LIMIT 1",
        [pokedex]
    );
    if (!base) return { base: null, forms: [] };
    if (base.MEGA !== 'Yes' && base.MEGA !== 'doble') return { base, forms: [] };

    const dexes = [];
    if (base.EVOLUTION && base.EVOLUTION !== '0000') dexes.push(base.EVOLUTION);
    const alts = await db.all(
        "SELECT DISTINCT POKEDEX FROM pokemons WHERE PREEVOLUCION = ? AND POKEDEX != ?",
        [base.POKEDEX, base.EVOLUTION]
    );
    alts.forEach(a => { if (!dexes.includes(a.POKEDEX)) dexes.push(a.POKEDEX); });

    const forms = [];
    for (const dex of dexes) {
        const row = await db.get(
            "SELECT POKEDEX, NAME, TYPE1, TYPE2, LEVEL FROM pokemons WHERE POKEDEX = ? AND FORM = 'Mega' LIMIT 1",
            [dex]
        );
        if (row) forms.push({
            pokedex: row.POKEDEX,
            name: (row.NAME || '').replace(/<\/?i>/g, '').trim(),
            type1: row.TYPE1,
            type2: row.TYPE2,
            level: row.LEVEL,
        });
    }
    return { base, forms };
}

// De qué especie sale una mega.
//
// No se puede depender de PREEVOLUCION: 43 de las 94 megas la traen en '0000'.
// El POKEDEX sí lo dice siempre — es el de la base con una o dos letras delante
// (M0003, MX0006, MZ0359) — así que cuando la columna no sirve se cae a quitarle
// el prefijo.
const baseDexOfMega = (megaDex, preevolucion) => {
    if (preevolucion && !['000', '0000'].includes(preevolucion)) return preevolucion;
    const m = (megaDex || '').match(/^M[A-Z]?(\d{4}.*)$/);
    return m ? m[1] : null;
};

// Una mega al azar de entre TODAS las del juego. Es la vía principal del
// evento: no se elige rival, sale el que sale.
//
// Las variantes cuentan por separado a propósito (Mega Charizard X y Mega
// Charizard Y son dos entradas del sorteo, no una): son dos cartas distintas
// sobre la mesa.
export const getRandomMega = async (req, res) => {
    try {
        const db = await openDb();
        const row = await db.get(
            `SELECT POKEDEX, NAME, TYPE1, TYPE2, LEVEL, PREEVOLUCION
             FROM pokemons WHERE FORM = 'Mega' ORDER BY RANDOM() LIMIT 1`
        );
        if (!row) return res.status(404).json({ message: 'No hay megas en la base' });

        const clean = (n) => (n || '').replace(/<\/?i>/g, '').trim();
        const baseDex = baseDexOfMega(row.POKEDEX, row.PREEVOLUCION);
        const baseRow = baseDex
            ? await db.get("SELECT POKEDEX, NAME FROM pokemons WHERE POKEDEX = ? AND FORM = 'Normal' LIMIT 1", [baseDex])
            : null;

        res.status(200).json({
            base: baseRow
                ? { pokedex: baseRow.POKEDEX, name: clean(baseRow.NAME) }
                : { pokedex: baseDex || '', name: clean(row.NAME).replace(/^Mega\s+/i, '') },
            mega: {
                pokedex: row.POKEDEX,
                name: clean(row.NAME),
                type1: row.TYPE1,
                type2: row.TYPE2,
                level: row.LEVEL,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Qué megas tiene una especie. Queda como vía alterna, para montar el combate
// contra una mega concreta en vez de dejarlo al sorteo.
export const getMegaForms = async (req, res) => {
    try {
        const { pokedex } = req.query;
        if (!pokedex) return res.status(400).json({ message: 'Falta el Pokémon' });
        const db = await openDb();
        const { base, forms } = await findMegaForms(pokedex, db);
        if (!base) return res.status(404).json({ message: 'Pokémon no encontrado' });
        res.status(200).json({
            base: { pokedex: base.POKEDEX, name: (base.NAME || '').replace(/<\/?i>/g, '').trim() },
            forms,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Monta la mega elegida como Pokémon salvaje del jugador.
export const simMegaBattle = async (req, res) => {
    try {
        const { playerId, megaPokedex } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        if (!megaPokedex) return res.status(400).json({ message: 'Falta la mega evolución' });

        const db = await openDb();
        const mega = await buildPokemonFromDex(megaPokedex, db, 'megabattle');
        if (!mega) return res.status(404).json({ message: 'Mega evolución no encontrada' });

        // Al ganarle se captura la ESPECIE BASE, no la forma mega: una mega
        // suelta en el equipo no tendría de dónde revertir. Mismo criterio que
        // con el jefe Gigamax de la incursión.
        const row = await db.get(
            "SELECT PREEVOLUCION FROM pokemons WHERE POKEDEX = ? LIMIT 1", [megaPokedex]);
        mega.basePokedex = baseDexOfMega(megaPokedex, row?.PREEVOLUCION);

        const rival = new Rival('SimMega-' + playerId, 'Wild Pokemon');
        rival.addPokemon(mega);
        player.setSimRival(rival);

        updateGameAndNotify();
        res.status(200).json({ message: 'Combate mega listo', pokemon: mega });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
