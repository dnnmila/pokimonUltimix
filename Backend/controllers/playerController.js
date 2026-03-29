import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import { getGame ,getPlayerById,updateGameAndNotify,getPokemonById } from '../gameInstance.js';

// Función para abrir la base de datos
async function openDb() {
    return open({
        filename: './db/pokimonDOUBLE.sqlite',
       // filename: './db/pokimonULTIMIX.sqlite', 
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

        // ajuste Asegurarse de que pokemonId tenga siempre 3 dígitos pokemonId ultimixdnn
        const formattedPokemonId = pokemonId.toString().padStart(3, '0');
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
        console.log(player.name + ' ha agreago al pokemon ' + pokemon.name );
        console.log(pokemon);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon agregado al jugador', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addPokemonScanned = async (req, res) => {
    console.log('addPokemon scanned started');
    try {
        const db = await openDb();
        const {pokemonUID } = req.body;


        // Obtener el jugador por su ID
        const game = getGame();
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
        console.log(player.name + ' ha agreago al pokemon ' + pokemon.name );
        console.log(pokemon);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

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

        // Asegurarse de que pokemonId tenga siempre 3 dígitos
        console.log('newPokemonId' + newPokemonId);
        const formattedPokemonId = newPokemonId.toString().padStart(4, '0');
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
        console.log(newPokemon);

        // Aquí, necesitarás obtener el jugador (Player) por su ID y agregar el Pokémon
        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores
      
        player.addPokemonbyIndex(newPokemon,oldPkmIndex);
       
        console.log(player.name + ' ha agreago al pokemon ' + newPokemon.name );
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

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

        player.removePokemonById(pokemonId); 
        console.log(player.name + ' removido pokemon exitosamente');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokémon removido exitosamente', player });
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

            const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokemon.evolution]);
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
    
            const newLevel = pokemonData.LEVEL + pokemon.extra  ;
            const uniqueId = player.name + '_' + pokemonData.POKEDEX + '_' + player.totalPokemons;
            // Crear una instancia de Pokémon
            const mega = new Pokemons(
                uniqueId,
                pokemonData.POKEDEX,
                pokemonData.NAME,
                pokemonData.TYPE1,
                pokemonData.TYPE2,
                newLevel,
                Attack1,
                Attack2,
                Attack3,
                pokemonData.NEXT_LEVEL,
                pokemonData.EVOLUTION,
                pokemonData.MEGA
            );
    
            player.addMega(mega);
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


export const wildBattle = async (req, res) => {
    console.log('Wild started');
    try {
        const db = await openDb();
        const {pokemonId} = req.body;
        console.log(pokemonId);

        //ajuste  Asegurarse de que pokemonId tenga siempre 3 dígitos pokemonId ultimixdnn
        const formattedPokemonId = pokemonId.toString().padStart(3, '0');
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



