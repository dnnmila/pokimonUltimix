import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import { getGame ,getPlayerById,updateGameAndNotify,getPokemonById } from '../gameInstance.js';

// Función para abrir la base de datos
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
// Helper: agrega el G-Max automáticamente si el pokemon tiene forma G-Max
async function attachGMaxIfAvailable(player, pokemon, pokemonData, db) {
    if (!pokemonData.GMAX || pokemonData.GMAX === 'No' || pokemonData.GMAX === 'NONE') return;
    const gmaxData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokemonData.GMAX]);
    if (!gmaxData) return;
    // Eliminar gmax duplicado si ya existe (por si el pokemon fue borrado y re-agregado)
    player.gmaxes = player.gmaxes.filter(g => g.pokedex !== gmaxData.POKEDEX);
    const atk1 = await getAttack(gmaxData.ATK1, db);
    const atk2 = await getAttack(gmaxData.ATK2, db);
    const atk3 = await getAttack(gmaxData.ATK3, db);
    const gmax = new Pokemons(
        player.name + '_' + gmaxData.POKEDEX + '_' + player.totalPokemons,
        gmaxData.POKEDEX, gmaxData.NAME, gmaxData.TYPE1, gmaxData.TYPE2,
        gmaxData.LEVEL,
        atk1, atk2, atk3,
        gmaxData.NEXT_LEVEL, gmaxData.EVOLUTION, gmaxData.MEGA
    );
    gmax.extra = pokemon.extra;
    gmax.totalLevel = gmax.level + gmax.extra;
    // Guardar referencia al pokedex del gmax en el pokemon base para poder limpiarlo despues
    pokemon.gmaxPokedex = gmaxData.POKEDEX;
    player.addGMax(gmax);
}

export const addPokemonToPlayer = async (req, res) => {
    console.log('addPokemonToPlayer started');
    try {
        const db = await openDb();
        const { playerId, pokemonId } = req.body;


        // Obtener el jugador por su ID
        const player = getPlayerById(playerId);
        console.log('player ' + player);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        // ajuste Asegurarse de que pokemonId tenga siempre 4 dígitos pokemonId ultimixdnn
        // Soporta prefijos como "A" (Alolan) o "M" (Mega): "A76" → "A0076", "76" → "0076", "0877i" → "0877i"
        const formattedPokemonId = pokemonId.toString().trim().replace(/\d+/, (num) => num.padStart(4, '0'));
        console.log('formattedPokemonId ' + formattedPokemonId);

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [formattedPokemonId]);
        
        console.log("Looking for Attack 1 ");
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        console.log(Attack1);
        console.log("Looking for Attack 1 ");
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        console.log(Attack2);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
        console.log(Attack3);
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const uniqueId = player.name + '_' + pokemonData.POKEDEX + '_' + player.totalPokemons;
        // Crear una instancia de Pokémon
        const pokemon = new Pokemons(
            uniqueId,
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

       
            
          

        

        // Aquí, necesitarás obtener el jugador (Player) por su ID y agregar el Pokémon
        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
      

        player.addPokemon(pokemon);
        await attachGMaxIfAvailable(player, pokemon, pokemonData, db);
        console.log(player.name + ' ha agreago al pokemon ' + pokemon.name );
        console.log(pokemon);
        updateGameAndNotify();

        res.status(200).json({ message: 'Pokémon agregado al jugador', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addPokemonScanned = async (req, res) => {
    console.log('addPokemon scanned started');
    try {
        const db = await openDb();
        const { pokemonUID, playerButton } = req.body;

        // Obtener el jugador por su ID
        const game = getGame();

        if (playerButton && playerButton !== 'master') {
            const playerIndex = parseInt(playerButton.replace('player', ''), 10) - 1;
            if (playerIndex !== game.currentTurn) {
                return res.status(200).json({ message: 'No es tu turno' });
            }
        }

        const player = game.players[game.currentTurn];
        console.log('player ' + player.name);
        console.log(pokemonUID);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        // Asegurarse de que pokemonId tenga siempre 3 dígitos
        if(player.pokemons.length < 6 ){
        console.log('formattedPokemonId ' + pokemonUID);

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE UID LIKE ?", ['%' + pokemonUID + '%']);
        console.log(pokemonData);
        console.log("Looking for Attack 1 ");
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        console.log(Attack1);
        console.log("Looking for Attack 1 ");
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        console.log(Attack2);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
        console.log(Attack3);
     
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const uniqueId = player.name + '_' + pokemonData.POKEDEX + '_' + player.totalPokemons;
        // Crear una instancia de Pokémon
        const pokemon = new Pokemons(
            uniqueId,
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

        // Aquí, necesitarás obtener el jugador (Player) por su ID y agregar el Pokémon
        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
      

        player.addPokemon(pokemon);
        await attachGMaxIfAvailable(player, pokemon, pokemonData, db);
        console.log(player.name + ' ha agreago al pokemon ' + pokemon.name );
        console.log(pokemon);
        updateGameAndNotify();

        res.status(200).json({ message: 'Pokémon agregado al jugador', player });
        }
        else{
            res.status(500).json({ message: 'Player has already 6 pokemons'});
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const evolvePokemon = async (req, res) => {
    console.log('evolve Pokemon started');
    try {
        const db = await openDb();
        const { playerId, pokemonId,newPokemonId } = req.body;


        // Obtener el jugador por su ID
        const player = getPlayerById(playerId);
        console.log('player ' + player.name);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        const oldPkmIndex = player.pokemons.findIndex(pkmn => pkmn.id === pokemonId);
        console.log('index' + oldPkmIndex);
        if (oldPkmIndex === -1) {
            console.log('Pokémon no encontrado');
            return;
        }

        // Limpiar el gmax del pokemon anterior antes de evolucionar
        const oldPkm = player.pokemons[oldPkmIndex];
        if (oldPkm?.gmaxPokedex) {
            player.gmaxes = player.gmaxes.filter(g => g.pokedex !== oldPkm.gmaxPokedex);
        }

        // ajuste Asegurarse de que pokemonId tenga siempre 4 dígitos poemonId ultimixdnn
        console.log('newPokemonId' + newPokemonId);
        const rawStr = newPokemonId.toString().trim();
        // Padding solo en la parte numérica, preservando letras y su capitalización (ej: M0376, G0079, 0877i)
        const formattedPokemonId = rawStr.replace(/\d+/, (num) => num.padStart(4, '0'));
        console.log('pokedex nuevo' + formattedPokemonId);
   

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [formattedPokemonId]);
    
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        console.log(Attack1);
        console.log("Looking for Attack 1 ");
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        console.log(Attack2);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
        console.log(Attack3);

        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const uniqueId = player.name + '_' + pokemonData.POKEDEX + '_' + player.totalPokemons;
        // Crear una instancia de Pokémon
        const newPokemon = new Pokemons(
            uniqueId,
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
        // Cambio de forma (nextLevel=-1): transferir todo el extra sin descuento
        // Evolución normal: solo transfieren los extras que superan el nextLevel requerido
        const transferExtra = oldPkm.nextLevel === -1
            ? oldPkm.extra
            : Math.max(0, oldPkm.extra - oldPkm.nextLevel);
        newPokemon.extra = transferExtra;
        newPokemon.totalLevel = newPokemon.level + newPokemon.extra;
        // La mega piedra se consume al evolucionar una fase 'evo' (Zygarde 10% -> 50% -> Complete).
        // El resto de items se conservan.
        const megaStoneConsumed = oldPkm.mega === 'evo' && oldPkm.attach === 'Mega';
        if (oldPkm.attach && !megaStoneConsumed) {
            newPokemon.attach = oldPkm.attach;
        }
        console.log(newPokemon);

        // Aquí, necesitarás obtener el jugador (Player) por su ID y agregar el Pokémon
        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores

        player.addPokemonbyIndex(newPokemon,oldPkmIndex);
        // Agregar gmax del pokemon evolucionado si aplica
        await attachGMaxIfAvailable(player, newPokemon, pokemonData, db);

        console.log(player.name + ' ha agreago al pokemon ' + newPokemon.name );
        updateGameAndNotify();

        res.status(200).json({ message: 'Pokémon agregado al jugador', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removePokemonToPlayer = async (req, res) => {
    console.log('remove Pokemon started');
    try {
        const { playerId, pokemonId } = req.body;
        const player = getPlayerById(playerId);
        console.log('player:' + player);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        // Limpiar el gmax asociado antes de borrar el pokemon
        const pokemon = player.pokemons.find(p => p.id === pokemonId);
        if (pokemon?.gmaxPokedex) {
            player.gmaxes = player.gmaxes.filter(g => g.pokedex !== pokemon.gmaxPokedex);
        }

        player.removePokemonById(pokemonId);
        console.log(player.name + ' removido pokemon exitosamente');
        updateGameAndNotify();

        res.status(200).json({ message: 'Pokémon removido exitosamente', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const masterPurchase = async (req, res) => {
    try {
        const { playerId, item, price } = req.body;
        const { getGame } = await import('../gameInstance.js');
        const game = getGame();
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        if (player.coins < price) return res.status(400).json({ message: 'Monedas insuficientes' });
        const coinsAfter = player.coins - price;
        player.updateNewCoins(coinsAfter);
        game.purchaseHistory.push({
            playerName: player.name,
            item,
            price,
            coinsAfter,
            round: game.round
        });
        updateGameAndNotify();
        res.status(200).json({ message: 'Compra realizada', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCoins = async (req, res) => {
    console.log('Add Coins started');
    try {
        const { playerId, coins } = req.body;
        const player = getPlayerById(playerId);
        console.log('player:' + player);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        player.updateNewCoins(coins); 
        console.log(player.name + ' total de coins:' + player.coins);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Coins added successfully', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const badgeWon  = async (req, res) => {
    console.log('badge Won started');
    try {
        const { playerId, numBadge } = req.body;
        const player = getPlayerById(playerId);
        console.log('player:' + player.name);
        console.log('badge:' + numBadge);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        player.BadgeWon(numBadge);
        console.log(player.name + ' badge WON: ' + numBadge);
        const gameForHistory = getGame();
        gameForHistory.badgeHistory.push({ round: gameForHistory.round, playerId: player.id, playerName: player.name, badge: numBadge, action: 'won' });
        if (numBadge === 10) {
            const game = getGame();
            game.paused = true;
            game.pausedAt = null;
            game.ended = true;
            game.winner = player.id;
            game.players.forEach(p => { p.turnStartTime = null; });
        }
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Badge added successfully', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const badgeLost = async (req, res) => {
    console.log('badge Won started');
    try {
        const { playerId, numBadge } = req.body;
        const player = getPlayerById(playerId);
        console.log('player:' + player.name);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        player.BadgeLost(numBadge);
        console.log(player.name + ' badge LOST: ' + numBadge);
        const gameForLostHistory = getGame();
        gameForLostHistory.badgeHistory.push({ round: gameForLostHistory.round, playerId: player.id, playerName: player.name, badge: numBadge, action: 'lost' });
        if (numBadge === 10) {
            const game = getGame();
            game.ended = false;
            game.winner = null;
            game.paused = false;
        }
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Badge removed successfully', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addPoints  = async (req, res) => {
    console.log('add Points started');
    try {
        const { playerId, points } = req.body;
        const player = getPlayerById(playerId);
        console.log('player:' + player);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        player.addPoints(points); 
        console.log(player.name + ' total points : ' + player.points);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Points added successfully', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changePosition  = async (req, res) => {
    console.log('New position started');
    try {
        const { playerId, newPosition } = req.body;
        const player = getPlayerById(playerId);
        console.log('player:' + player);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        player.newPosition(newPosition);
        console.log(player.name + ' new position: ' + player.position);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Position updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const increaseLevel  = async (req, res) => {
    console.log('increase Level ');
    try {
        const { playerId, pokemonId, rivalName, rivalPokemonName, source } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        const pokemon = player.pokemons.find(p => p.id === pokemonId);
        const previousLevel = pokemon?.totalLevel ?? 0;

        player.increasePokemonLevel(pokemonId);

        const updatedPokemon = player.pokemons.find(p => p.id === pokemonId);
        const game = getGame();
        if (game && updatedPokemon) {
            game.levelHistory.push({
                round: game.round,
                playerName: player.name,
                pokemonName: updatedPokemon.name,
                previousLevel,
                newLevel: updatedPokemon.totalLevel,
                rivalName: rivalName || null,
                rivalPokemonName: rivalPokemonName || null,
                source: source || null
            });
        }

        console.log('Pokemon actualizado ');
        updateGameAndNotify();
        res.status(200).json({ message: 'Position updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



export const attachItem  = async (req, res) => {
    console.log('attach item  ');
    try {
        const { playerId, pokemonId,itemAttached } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        
        player.attachItemToPokemon(pokemonId,itemAttached);
        console.log('Pokemon actualizado');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const attachTM  = async (req, res) => {
    console.log('attach item  ');
    try {
        const { playerId, pokemonId,tmType,tmLevel} = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        const IdAtk = "TM-"+pokemonId +player.totalPokemons ;
        const newAttack = new Attacks(
            IdAtk,
            "TM",
            tmType,
            tmLevel,
            "NONE",
            "D6"

        )
        
        player.attachTM(pokemonId,newAttack);
        console.log('Pokemon actualizado');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const attachMega  = async (req, res) => {
    console.log('attach Mega  ');
    try {
        const db = await openDb();
        const { playerId, pokemonId} = req.body;
        console.log("playerId: "+playerId + "pokemonId: " + pokemonId );
        const player = getPlayerById(playerId);
        const pokemon = player.pokemons.find(pokemon => pokemon.id === pokemonId);
        if (!player) {
            return res.status(404).json({ message: 'jugador no encontrado' });
        }
        if (!pokemon) {
            return res.status(404).json({ message: 'pokemon no encontrado' });
        }
        // 'evo' (Zygarde 10%/50%): la piedra no crea una mega form, solo habilita
        // la evolución a la siguiente fase. Se consume al evolucionar.
        if (pokemon.mega === 'evo') {
            pokemon.addAttach("Mega");
        } else if (pokemon.mega === 'Yes' || pokemon.mega === 'doble') {

            // Mega principal (almacenada en pokemon.evolution)
            const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokemon.evolution]);
            if (!pokemonData) {
                return res.status(404).json({ message: 'Pokémon no encontrado' });
            }
            const Attack1 = await getAttack(pokemonData.ATK1,db);
            const Attack2 = await getAttack(pokemonData.ATK2,db);
            const Attack3 = await getAttack(pokemonData.ATK3,db);

            const mega = new Pokemons(
                player.name + '_' + pokemonData.POKEDEX + '_' + player.totalPokemons,
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
            mega.extra = pokemon.extra;
            mega.totalLevel = mega.level + mega.extra;
            player.addMega(mega);

            // Megas alternativas (via PREEVOLUCION), excluyendo la principal ya agregada
            const altMegas = await db.all("SELECT DISTINCT POKEDEX FROM pokemons WHERE PREEVOLUCION = ? AND POKEDEX != ?", [pokemon.pokedex, pokemon.evolution]);
            for (const alt of altMegas) {
                const altData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [alt.POKEDEX]);
                if (!altData) continue;
                const altAtk1 = await getAttack(altData.ATK1, db);
                const altAtk2 = await getAttack(altData.ATK2, db);
                const altAtk3 = await getAttack(altData.ATK3, db);
                const altMega = new Pokemons(
                    player.name + '_' + altData.POKEDEX + '_' + player.totalPokemons,
                    altData.POKEDEX,
                    altData.NAME,
                    altData.TYPE1,
                    altData.TYPE2,
                    altData.LEVEL,
                    altAtk1,
                    altAtk2,
                    altAtk3,
                    altData.NEXT_LEVEL,
                    altData.EVOLUTION,
                    altData.MEGA
                );
                altMega.extra = pokemon.extra;
                altMega.totalLevel = altMega.level + altMega.extra;
                player.addMega(altMega);
            }

            pokemon.addAttach("Mega");
        }
        
        console.log('Pokemon mega');
        console.log(player);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changeState  = async (req, res) => {
    console.log('attach item  ');
    try {
        const { playerId, pokemonId, rivalName, rivalPokemonName, source } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        player.changeState(pokemonId);

        const game = getGame();
        const changedPokemon = player.pokemons.find(p => p.id === pokemonId);
        if (game && changedPokemon) {
            game.stateHistory.push({
                round: game.round,
                playerName: player.name,
                pokemonName: changedPokemon.name,
                newState: changedPokemon.state,
                rivalName: rivalName || null,
                rivalPokemonName: rivalPokemonName || null,
                source: source || null
            });
        }

        console.log('Pokemon actualizado');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changeStatus  = async (req, res) => {
    console.log('change Status');
    try {
        const { playerId, pokemonId,status } = req.body;
        const player = getPlayerById(playerId);
        console.log(player.name)
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        
        player.changeStatus(pokemonId,status);
        console.log('Pokemon actualizado');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


export const decreaseStatusCounter = async (req, res) => {
    try {
        const { playerId, pokemonId } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        player.decreaseStatusCounter(pokemonId);
        updateGameAndNotify();
        res.status(200).json({ message: 'Counter updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const wildBattle = async (req, res) => {
    console.log('Wild started');
    try {
        const db = await openDb();
        const {pokemonId} = req.body;
        console.log(pokemonId);

        //ajuste  Asegurarse de que pokemonId tenga siempre 4 dígitos pokemonId ultimixdnn
        const formattedPokemonId = pokemonId.toString().trim().replace(/\d+/, (num) => num.padStart(4, '0'));
        console.log('formattedPokemonId ' + formattedPokemonId);

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [formattedPokemonId]);
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        const Attack2 = await getAttack(pokemonData.ATK2,db);
     
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const uniqueId = WildPokemon + '_' + pokemonData.POKEDEX + '_' ;
        // Crear una instancia de Pokémon
        const pokemon = new Pokemons(
            uniqueId,
            pokemonData.POKEDEX,
            pokemonData.NAME,
            pokemonData.TYPE1,
            pokemonData.TYPE2,
            pokemonData.LEVEL,
            Attack1,
            Attack2,
            pokemonData.NEXT_LEVEL,
            pokemonData.EVOLUTION,
            pokemonData.MEGA
        );

        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
      
        const game = getGame();
        game.WildPokemon(pokemon);
        
        console.log('Pokemon added ha agreago al pokemon ' + pokemon.name );
        console.log(pokemon);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon agregado al jugador', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const wildBattleScanned = async (req, res) => {
    console.log('Wild started');
    try {
        const db = await openDb();
        const {pokemonUID } = req.body;
        

        // Asegurarse de que pokemonId tenga siempre 3 dígitos
        

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE UID = ? LIMIT 1", [pokemonUID]);
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        const Attack2 = await getAttack(pokemonData.ATK2,db);
     
        if (!pokemonData) {
            return res.status(404).json({ message: 'Pokémon no encontrado' });
        }

        const uniqueId = WildPokemon + '_' + pokemonData.POKEDEX + '_' ;
        // Crear una instancia de Pokémon
        const pokemon = new Pokemons(
            uniqueId,
            pokemonData.POKEDEX,
            pokemonData.NAME,
            pokemonData.TYPE1,
            pokemonData.TYPE2,
            pokemonData.LEVEL,
            Attack1,
            Attack2,
            pokemonData.NEXT_LEVEL,
            pokemonData.EVOLUTION,
            pokemonData.MEGA
        );

        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
      
        const game = getGame();
        game.WildPokemon(pokemon);
        
        console.log('Pokemon added ha agreago al pokemon ' + pokemon.name );
        console.log(pokemon);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon agregado al jugador', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getEvolutionChain = async (req, res) => {
    try {
        const db = await openDb();
        const { pokedexId } = req.body;
        const chain = [];
        let currentId = pokedexId;
        let safety = 0;

        const getGmax = async (gmaxId) => {
            if (!gmaxId || gmaxId === 'No' || gmaxId === 'NONE') return null;
            const g = await db.get("SELECT POKEDEX FROM pokemons WHERE POKEDEX = ? AND FORM = 'GMax' LIMIT 1", [gmaxId]);
            return g ? g.POKEDEX : null;
        };

        const getMegas = async (data) => {
            // 'evo': la mega piedra dispara una evolución normal, no una mega form
            if (!data.MEGA || data.MEGA === 'No' || data.MEGA === 'evo') return [];
            if (data.MEGA === 'doble') {
                const rows = await db.all(
                    "SELECT POKEDEX FROM pokemons WHERE PREEVOLUCION = ? AND FORM = 'Mega' GROUP BY POKEDEX ORDER BY POKEDEX",
                    [data.POKEDEX]
                );
                return rows.map(r => r.POKEDEX);
            }
            // Mega única: EVOLUTION apunta a ella
            if (data.EVOLUTION && data.EVOLUTION !== '0000' && data.EVOLUTION !== 'pre') {
                const mega = await db.get("SELECT POKEDEX FROM pokemons WHERE POKEDEX = ? AND FORM = 'Mega' LIMIT 1", [data.EVOLUTION]);
                return mega ? [mega.POKEDEX] : [];
            }
            return [];
        };

        const buildBranch = async (branchPokedex) => {
            const b = await db.get(
                "SELECT POKEDEX, NAME, TYPE1, TYPE2, NEXT_LEVEL, EVOLUTION, EVOLUTION2, MEGA, GMAX FROM pokemons WHERE POKEDEX = ? AND FORM = 'Normal' LIMIT 1",
                [branchPokedex]
            );
            if (!b) return null;
            const bGmax = await getGmax(b.GMAX);
            const bMegas = await getMegas(b);
            const hasSingleLinearEvolution =
                // 'evo' evoluciona con la piedra, no por niveles: NEXT_LEVEL=0 no lo corta
                (b.MEGA === 'evo' || (b.NEXT_LEVEL !== 0 && b.NEXT_LEVEL !== -1)) &&
                b.EVOLUTION && b.EVOLUTION !== '0000' && b.EVOLUTION !== 'pre' &&
                (!b.EVOLUTION2 || b.EVOLUTION2 === '0000') &&
                b.MEGA !== 'Yes' && b.MEGA !== 'doble';
            return {
                pokedex: b.POKEDEX, name: b.NAME, type1: b.TYPE1, type2: b.TYPE2,
                gmax: bGmax, megas: bMegas,
                nextEvolution: hasSingleLinearEvolution ? b.EVOLUTION : null
            };
        };

        while (currentId && safety < 10) {
            safety++;
            const data = await db.get(
                "SELECT POKEDEX, NAME, TYPE1, TYPE2, NEXT_LEVEL, EVOLUTION, EVOLUTION2, MEGA, GMAX FROM pokemons WHERE POKEDEX = ? AND FORM = 'Normal' LIMIT 1",
                [currentId]
            );
            if (!data) break;

            const gmax = await getGmax(data.GMAX);
            const megas = await getMegas(data);
            const branches = [];
            let nextId = null;

            if (data.NEXT_LEVEL === -1) {
                // Cambio de forma (Morpeko): rama visual, no sigue cadena
                if (data.EVOLUTION && data.EVOLUTION !== '0000') {
                    const fb = await buildBranch(data.EVOLUTION);
                    if (fb) branches.push(fb);
                }
            } else if (data.EVOLUTION === 'pre') {
                // Múltiples evoluciones (Eevee, Tyrogue, Rockruff)
                const evos = await db.all(
                    "SELECT POKEDEX FROM pokemons WHERE PREEVOLUCION = ? AND FORM = 'Normal' GROUP BY POKEDEX ORDER BY POKEDEX",
                    [data.POKEDEX]
                );
                for (const evo of evos) {
                    const b = await buildBranch(evo.POKEDEX);
                    if (b) branches.push(b);
                }
            } else if (data.EVOLUTION2 && data.EVOLUTION2 !== '0000') {
                // Dos ramas de evolución (Pikachu → Raichu + Raichu Alola)
                const b1 = await buildBranch(data.EVOLUTION);
                const b2 = await buildBranch(data.EVOLUTION2);
                if (b1) branches.push(b1);
                if (b2) branches.push(b2);
            } else if (
                // 'evo' evoluciona con la piedra, no por niveles: NEXT_LEVEL=0 no lo corta
                (data.MEGA === 'evo' || data.NEXT_LEVEL !== 0) &&
                data.EVOLUTION && data.EVOLUTION !== '0000' &&
                data.MEGA !== 'Yes' && data.MEGA !== 'doble'
            ) {
                // Evolución lineal única — continúa la cadena
                nextId = data.EVOLUTION;
            }

            chain.push({ pokedex: data.POKEDEX, name: data.NAME, type1: data.TYPE1, type2: data.TYPE2, gmax, megas, branches });

            if (!nextId) break;
            currentId = nextId;
        }

        res.status(200).json(chain);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPossibleEvolutions = async (req, res) => {
    try {
        const db = await openDb();
        const { pokedexId } = req.body;

        const current = await db.get(
            "SELECT EVOLUTION, EVOLUTION2 FROM pokemons WHERE POKEDEX = ? AND FORM = 'Normal' LIMIT 1",
            [pokedexId]
        );

        if (!current || !current.EVOLUTION || current.EVOLUTION === '0000') {
            return res.status(200).json([]);
        }

        // Más de 2 evoluciones: buscar por PREEVOLUCION
        if (current.EVOLUTION === 'pre') {
            const rows = await db.all(
                "SELECT POKEDEX, NAME, TYPE1, TYPE2 FROM pokemons WHERE PREEVOLUCION = ? AND FORM = 'Normal' GROUP BY POKEDEX ORDER BY POKEDEX",
                [pokedexId]
            );
            return res.status(200).json(rows);
        }

        // 2 evoluciones: EVOLUTION + EVOLUTION2
        if (current.EVOLUTION2 && current.EVOLUTION2 !== '0000') {
            const rows = await db.all(
                "SELECT POKEDEX, NAME, TYPE1, TYPE2 FROM pokemons WHERE POKEDEX IN (?, ?) AND FORM = 'Normal' GROUP BY POKEDEX ORDER BY POKEDEX",
                [current.EVOLUTION, current.EVOLUTION2]
            );
            return res.status(200).json(rows);
        }

        // 1 evolución: retorna array con solo esa
        const row = await db.get(
            "SELECT POKEDEX, NAME, TYPE1, TYPE2 FROM pokemons WHERE POKEDEX = ? AND FORM = 'Normal' LIMIT 1",
            [current.EVOLUTION]
        );
        return res.status(200).json(row ? [row] : []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const toggleDynamax = async (req, res) => {
    try {
        const { playerId } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        player.dynamax = !player.dynamax;
        updateGameAndNotify();
        res.status(200).json({ message: 'Dynamax toggled', dynamax: player.dynamax });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const tradePokemon = async (req, res) => {
    try {
        const { playerIdA, pokemonIdA, playerIdB, pokemonIdB } = req.body;
        const playerA = getPlayerById(playerIdA);
        const playerB = getPlayerById(playerIdB);
        if (!playerA || !playerB) return res.status(404).json({ message: 'Jugador no encontrado' });

        const indexA = playerA.pokemons.findIndex(p => p.id === pokemonIdA);
        const indexB = playerB.pokemons.findIndex(p => p.id === pokemonIdB);
        if (indexA === -1 || indexB === -1) return res.status(404).json({ message: 'Pokémon no encontrado' });

        const temp = playerA.pokemons[indexA];
        playerA.pokemons[indexA] = playerB.pokemons[indexB];
        playerB.pokemons[indexB] = temp;

        updateGameAndNotify();
        res.status(200).json({ message: 'Intercambio realizado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const VALID_FRONTIERS = ['frontierPink','frontierGreen','frontierBlue','frontierYellow','frontierRed','frontierGolden'];

export const toggleFrontier = async (req, res) => {
    try {
        const { playerId, frontierKey } = req.body;
        if (!VALID_FRONTIERS.includes(frontierKey)) return res.status(400).json({ message: 'Frontera no válida' });
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        player[frontierKey] = !player[frontierKey];
        updateGameAndNotify();
        res.status(200).json({ message: 'Frontera actualizada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
