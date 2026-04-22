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
        const { playerId, pokemonId } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        
        player.increasePokemonLevel(pokemonId);
        console.log('Pokemon actualizado ');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

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
        if (pokemon.mega == 'Yes'){

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
        const { playerId, pokemonId } = req.body;
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
                newState: changedPokemon.state
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

        while (currentId && safety < 10) {
            safety++;
            const data = await db.get(
                "SELECT POKEDEX, NAME, TYPE1, TYPE2, NEXT_LEVEL, EVOLUTION, EVOLUTION2, MEGA, GMAX, FORM FROM pokemons WHERE POKEDEX = ? LIMIT 1",
                [currentId]
            );
            if (!data) break;

            const branches = [];

            // G-Max: campo separado, no en branches
            let gmax = null;
            if (data.GMAX && data.GMAX !== 'No' && data.GMAX !== 'NONE') {
                const gmaxEntry = await db.get(
                    "SELECT POKEDEX FROM pokemons WHERE POKEDEX = ? AND FORM = 'GMax' LIMIT 1",
                    [data.GMAX]
                );
                if (gmaxEntry) gmax = gmaxEntry.POKEDEX;
            }

            // Helper para construir un branch con su mega y gmax
            const buildBranch = async (pokedexId) => {
                const b = await db.get(
                    "SELECT POKEDEX, NAME, TYPE1, TYPE2, FORM, MEGA, EVOLUTION, GMAX FROM pokemons WHERE POKEDEX = ? AND FORM != 'Mega' AND FORM != 'GMax' LIMIT 1",
                    [pokedexId]
                );
                if (!b) return null;
                const branchMega = (b.MEGA === 'Yes' && b.EVOLUTION && b.EVOLUTION !== '0000') ? b.EVOLUTION : null;
                const branchGmax = (b.GMAX && b.GMAX !== 'No' && b.GMAX !== 'NONE') ? b.GMAX : null;
                const branchNextEvol = (b.MEGA !== 'Yes' && b.EVOLUTION && b.EVOLUTION !== '0000' && b.EVOLUTION !== 'evee') ? b.EVOLUTION : null;
                return { pokedex: b.POKEDEX, name: b.NAME, type1: b.TYPE1, type2: b.TYPE2, isMega: false, mega: branchMega, gmax: branchGmax, nextEvolution: branchNextEvol };
            };

            // Si hay EVOLUTION2: ambas evoluciones son branches al mismo nivel, parar cadena lineal
            if (data.EVOLUTION2 && data.EVOLUTION2 !== '0000') {
                const branch1 = await buildBranch(data.EVOLUTION);
                const branch2 = await buildBranch(data.EVOLUTION2);
                if (branch1) branches.push(branch1);
                if (branch2) branches.push(branch2);
                chain.push({ pokedex: data.POKEDEX, name: data.NAME, type1: data.TYPE1, type2: data.TYPE2, isMega: data.FORM === 'Mega', gmax, branches });
                break;
            }

            // Si tiene mega principal via EVOLUTION, agregarla a branches
            if (data.MEGA === 'Yes' && data.EVOLUTION && data.EVOLUTION !== '0000') {
                const mainMega = await db.get(
                    "SELECT POKEDEX, NAME, TYPE1, TYPE2 FROM pokemons WHERE POKEDEX = ? AND FORM = 'Mega' LIMIT 1",
                    [data.EVOLUTION]
                );
                if (mainMega && !branches.find(b => b.pokedex === mainMega.POKEDEX)) {
                    branches.unshift({ pokedex: mainMega.POKEDEX, name: mainMega.NAME, type1: mainMega.TYPE1, type2: mainMega.TYPE2, isMega: true, mega: null, gmax: null });
                }
            }

            // Ramas adicionales via PREEVOLUCION — excluir siempre G-Max (ya está en gmax field)
            const excludeFromPreevo = data.MEGA === 'Yes' ? data.EVOLUTION : '___NONE___';
            const preevoBranches = await db.all(
                "SELECT DISTINCT POKEDEX, NAME, TYPE1, TYPE2, FORM, MEGA, EVOLUTION, GMAX FROM pokemons WHERE PREEVOLUCION = ? AND POKEDEX != ? AND FORM != 'GMax'",
                [data.POKEDEX, excludeFromPreevo]
            );
            for (const b of preevoBranches) {
                if (!branches.find(br => br.pokedex === b.POKEDEX)) {
                    const branchMega = (b.MEGA === 'Yes' && b.EVOLUTION && b.EVOLUTION !== '0000') ? b.EVOLUTION : null;
                    const branchGmax = (b.GMAX && b.GMAX !== 'No' && b.GMAX !== 'NONE') ? b.GMAX : null;
                    const branchNextEvol = (b.MEGA !== 'Yes' && b.EVOLUTION && b.EVOLUTION !== '0000' && b.EVOLUTION !== 'evee') ? b.EVOLUTION : null;
                    branches.push({ pokedex: b.POKEDEX, name: b.NAME, type1: b.TYPE1, type2: b.TYPE2, isMega: b.FORM === 'Mega', mega: branchMega, gmax: branchGmax, nextEvolution: branchNextEvol });
                }
            }

            // Si hay ramas via PREEVOLUCION y también hay una evolución principal válida,
            // agregarla como primera rama (ej: Galarian Slowpoke → Slowbro + Slowking, Goomy → Sliggoo + Hisuian Sliggoo)
            if (preevoBranches.length > 0 && data.MEGA !== 'Yes' && data.EVOLUTION && data.EVOLUTION !== '0000' && data.EVOLUTION !== 'evee') {
                const mainEvoBranch = await buildBranch(data.EVOLUTION);
                if (mainEvoBranch && !branches.find(br => br.pokedex === mainEvoBranch.pokedex)) {
                    branches.unshift(mainEvoBranch);
                }
            }

            chain.push({
                pokedex: data.POKEDEX, name: data.NAME,
                type1: data.TYPE1, type2: data.TYPE2,
                isMega: data.FORM === 'Mega',
                gmax,
                branches
            });

            // Condiciones de parada
            if (data.NEXT_LEVEL === 0) break;
            if (data.NEXT_LEVEL === -1) {
                if (data.EVOLUTION && data.EVOLUTION !== '0000') {
                    const formBranch = await buildBranch(data.EVOLUTION);
                    if (formBranch && !branches.find(br => br.pokedex === formBranch.pokedex)) {
                        branches.push(formBranch);
                    }
                }
                break;
            }
            if (!data.EVOLUTION || data.EVOLUTION === '0000' || data.EVOLUTION === 'evee') break;
            if (data.MEGA === 'Yes') break;
            if (preevoBranches.length > 0) break;

            currentId = data.EVOLUTION;
        }

        res.status(200).json(chain);
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
