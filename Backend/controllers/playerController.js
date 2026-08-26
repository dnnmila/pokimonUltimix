import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import { getGame ,getPlayerById,updateGameAndNotify,getPokemonById } from '../gameInstance.js';
import { isLegendaryBase, isLegendaryFormOf, legendaryFormsOf } from '../data/legendaryEvos.js';

// Niveles extra que puede acumular un Pokémon por encima del nivel de su ficha.
// Es tope de reglas del juego, no de la interfaz.
export const MAX_EXTRA_LEVEL = 6;

// Todo Pokémon que entra en un equipo pasa por aquí: la captura del SimPlayer,
// la del mapa y el alta a mano del máster. No se distingue entre ellas a
// propósito —para la línea de tiempo de /progress lo que importa es CUÁNDO se
// hizo con él y CUÁL es—, y guardar el pokedex es lo que deja pintar su sprite.
function recordCatch(player, pokemon) {
    const game = getGame();
    if (!game) return;
    if (!game.catchHistory) game.catchHistory = [];
    game.catchHistory.push({
        round: game.round,
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        pokedex: pokemon.pokedex,
        pokemonName: pokemon.name,
    });
}

// Función para abrir la base de datos
async function openDb() {
    return open({
        //filename: './db/pokimonDOUBLE.sqlite',
       filename: './db/pokimonULTIMIX.sqlite',
        driver: sqlite3.Database
    });
}


// ── Bono de tipo (STAB) de las MTs ──────────────────────────────────────────
//
// Misma regla que `tmPowerFor` en el frontend (frontend/src/data/tms.js): la
// MT suma +1 de poder si su carta admite el bono Y comparte tipo con quien la
// lleva. Aquí hace falta porque al evolucionar cambian los tipos —hay
// evoluciones que añaden un segundo tipo— y el +1 puede aparecer o
// desaparecer, así que se recalcula sobre el poder impreso en la carta.

const sameType = (a, b) =>
    typeof a === 'string' && typeof b === 'string' &&
    a.trim().toUpperCase() === b.trim().toUpperCase();

// Normaliza nombres de Pokémon para comparar. Hace falta quitar el HTML porque
// la tabla `pokemons` guarda cosas como "<i>Ultra</i> Necrozma".
const normName = (s) =>
    (s || '')
        .replace(/<[^>]+>/g, '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_'’]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

// Qué movimiento Z da el cristal a un Pokémon. El ataque adjuntado guarda en
// `z` la tabla del cristal (genérico + especiales), así que esto se resuelve
// sin necesitar el catálogo completo en el backend.
function zMoveForName(zData, pokemonName) {
    const nombre = normName(pokemonName);
    const hit = (zData.especiales || []).find(e => normName(e.pokemon) === nombre);
    return hit
        ? { nombre: hit.nombre, poder: hit.poder }
        : { nombre: zData.generico, poder: zData.poderGenerico };
}

function tmStrengthFor(tmAttack, type1, type2) {
    // Sin metadatos de carta (MTs puestas a mano, o adjuntadas antes de que
    // existiera el catálogo) no se puede saber qué parte del poder era bono:
    // se respeta el valor que ya tenía.
    if (!tmAttack?.tm) return tmAttack.strength;

    const { base, bono } = tmAttack.tm;
    const aplica = bono && (sameType(type1, tmAttack.type) || sameType(type2, tmAttack.type));
    return base + (aplica ? 1 : 0);
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
    gmax.mote = pokemon.mote || '';
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
        recordCatch(player, pokemon);
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
        recordCatch(player, pokemon);
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
        // Y sus megas, por lo mismo: el Pokémon que evoluciona deja de existir
        // con ese id. Si conserva la piedra se le rehacen más abajo, ya contra
        // su ficha nueva.
        player.removeMegasOf(oldPkm.id);

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
        // El mote es del Pokémon, no de su especie: sobrevive a la evolución.
        newPokemon.mote = oldPkm.mote || '';
        // El objeto legendario se consume al evolucionar una fase 'evo' (Zygarde
        // 10% -> 50% -> Complete): ahí no transforma nada, solo habilita el paso
        // y se gasta al darlo. El resto de items se conservan.
        //
        // Se sigue aceptando la mega piedra, que era la que hacía esto antes: hay
        // partidas guardadas con un Zygarde que ya la lleva puesta y esperando.
        const megaStoneConsumed = oldPkm.mega === 'evo' &&
            (oldPkm.attach === 'LegendEvo' || oldPkm.attach === 'Mega');
        if (oldPkm.attach && !megaStoneConsumed) {
            newPokemon.attach = oldPkm.attach;
            // El orbe y el objeto de equipo no viven solo en `attach`: llevan al
            // lado CUÁL es (el tipo del orbe, el id del objeto). Sin copiarlo, el
            // Pokémon evolucionado salía marcado con el item pero sin saber cuál
            // era, y se quedaba sin su +1 y sin su dibujo.
            newPokemon.teraType  = oldPkm.teraType;
            newPokemon.equipItem = oldPkm.equipItem;
        }

        // La MT o el cristal Z sobreviven a la evolución. Viven en attack3, así
        // que sin esto se perdían: el nuevo Pokémon estrenaba el ATK3 de su
        // ficha pero seguía marcado con attach='MT'/'Z', y quedaban
        // descuadrados. En ambos casos hay que recalcular, por motivos
        // distintos:
        //
        //   MT → el bono de tipo. Hay evoluciones que añaden un segundo tipo:
        //        una MT de Volador en un Togepi (Hada) va sin +1, y lo gana al
        //        llegar a Togekiss (Hada/Volador).
        //   Z  → el movimiento en sí. Un Dartrix con Ghostium Z lleva el
        //        genérico, pero al evolucionar a Decidueye le toca su especial
        //        Sinister Arrow Raid. Y al revés: un Pikachu con Catastropika
        //        que evoluciona a Raichu vuelve al genérico.
        if ((oldPkm.attach === 'MT' || oldPkm.attach === 'Z') && oldPkm.attack3) {
            const oldAtk = oldPkm.attack3;
            let nombre = oldAtk.name;
            let poder  = oldAtk.strength;

            if (oldPkm.attach === 'Z' && oldAtk.z) {
                const mov = zMoveForName(oldAtk.z, newPokemon.name);
                nombre = mov.nombre;
                poder  = mov.poder;
            } else if (oldPkm.attach === 'MT') {
                poder = tmStrengthFor(oldAtk, newPokemon.type1, newPokemon.type2);
            }

            const nuevoAtk = new Attacks(
                oldAtk.id,
                nombre,
                oldAtk.type,
                poder,
                oldAtk.effect,
                oldAtk.dice,
                oldAtk.tm
            );
            if (oldAtk.z) nuevoAtk.z = oldAtk.z;
            newPokemon.attack3 = nuevoAtk;
        }
        console.log(newPokemon);

        // Aquí, necesitarás obtener el jugador (Player) por su ID y agregar el Pokémon
        // Esta parte dependerá de cómo estás almacenando y manejando los datos de los jugadores

        player.addPokemonbyIndex(newPokemon,oldPkmIndex);
        // Agregar gmax del pokemon evolucionado si aplica
        await attachGMaxIfAvailable(player, newPokemon, pokemonData, db);
        // La piedra sobrevive a la evolución, así que sus megas hay que
        // rehacerlas contra la ficha nueva: si no, el Pokémon quedaba marcado
        // con la piedra pero sin ninguna mega a la que subir.
        if (newPokemon.attach === 'Mega') {
            await attachMegaForms(player, newPokemon, db);
        }

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
        gameForHistory.badgeHistory.push({ round: gameForHistory.round, timestamp: Date.now(), playerId: player.id, playerName: player.name, badge: numBadge, action: 'won' });
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
        gameForLostHistory.badgeHistory.push({ round: gameForLostHistory.round, timestamp: Date.now(), playerId: player.id, playerName: player.name, badge: numBadge, action: 'lost' });
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

// Reto de gimnasio fallado: al jugador se le cayó el último Pokémon vivo contra
// un líder. Lo avisa la tablet, que es la única que sabe si quedaba equipo en
// pie cuando el combate se resolvió. No toca nada de la partida —solo apunta—,
// así que repetirlo no rompe nada, pero sí se ignoran los avisos duplicados de
// la misma ronda y el mismo gimnasio: si el jugador vuelve a entrar y a caer en
// la misma ronda es el mismo intento fallido, no dos.
export const gymDefeat = async (req, res) => {
    try {
        const { playerId, badge, gymName } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        const game = getGame();
        if (!game.gymHistory) game.gymHistory = [];
        const numBadge = Number(badge) || null;
        const already = game.gymHistory.some(e =>
            e.playerId === player.id && e.round === game.round && e.badge === numBadge);
        if (!already) {
            game.gymHistory.push({
                round: game.round,
                timestamp: Date.now(),
                playerId: player.id,
                playerName: player.name,
                badge: numBadge,
                gymName: gymName || null,
            });
            updateGameAndNotify();
        }
        res.status(200).json({ message: 'Gym defeat recorded' });
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

        // Tope de nivel extra. `Pokemons.addExtra` CICLA a propósito (+6 vuelve a
        // +0): eso es para el botón "+" del máster, que así puede corregir a mano
        // pasándose de largo. Una subida ganada en combate no puede hacer eso —
        // reiniciaría el Pokémon en vez de premiarlo— así que aquí se corta.
        if (source !== 'manual-master' && (pokemon?.extra ?? 0) >= MAX_EXTRA_LEVEL) {
            return res.status(200).json({
                message: `El Pokémon ya está en el máximo (+${MAX_EXTRA_LEVEL})`,
                maxed: true,
                player,
            });
        }

        player.increasePokemonLevel(pokemonId);

        const updatedPokemon = player.pokemons.find(p => p.id === pokemonId);
        const game = getGame();
        if (game && updatedPokemon) {
            game.levelHistory.push({
                round: game.round,
                timestamp: Date.now(),
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

        // Quitar el item, o cambiarlo por otro, deshace la forma legendaria:
        // esa forma solo existe mientras el objeto esté puesto.
        const db = await openDb();
        await revertLegendaryForm(player.pokemons.find(p => p.id === pokemonId), db);

        player.attachItemToPokemon(pokemonId,itemAttached);
        console.log('Pokemon actualizado');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Orbe Tera. Va aparte de attachItem porque, además del marcador en `attach`,
// hay que guardar QUÉ tipo es — y aparte de attachTM porque no crea ataque.
export const attachTera = async (req, res) => {
    try {
        const { playerId, pokemonId, teraType } = req.body;
        if (!teraType) return res.status(400).json({ message: 'Falta el tipo Tera' });
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        // El orbe ocupa el hueco del objeto legendario, así que lo desplaza y con
        // él la forma (ver revertLegendaryForm).
        const db = await openDb();
        await revertLegendaryForm(player.pokemons.find(p => p.id === pokemonId), db);
        player.attachTeraToPokemon(pokemonId, teraType);
        updateGameAndNotify();
        res.status(200).json({ message: 'Orbe Tera adjuntado', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Objeto de equipo. Mismo caso que el orbe: además del marcador en `attach`
// hay que guardar CUÁL de los 18 es, y no crea ataque.
export const attachEquip = async (req, res) => {
    try {
        const { playerId, pokemonId, equipItem } = req.body;
        if (!equipItem) return res.status(400).json({ message: 'Falta el objeto de equipo' });
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        // También ocupa el hueco del objeto legendario, así que lo desplaza y
        // con él la forma (ver revertLegendaryForm).
        const db = await openDb();
        await revertLegendaryForm(player.pokemons.find(p => p.id === pokemonId), db);
        player.attachEquipToPokemon(pokemonId, equipItem);
        updateGameAndNotify();
        res.status(200).json({ message: 'Objeto de equipo adjuntado', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const attachTM  = async (req, res) => {
    console.log('attach item  ');
    try {
        const { playerId, pokemonId,tmType,tmLevel,tmName,tmBase,tmBono,zData,attachAs} = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }
        // Solo hay dos marcadores válidos; cualquier otra cosa cae a MT para no
        // ensuciar `attach` con valores que las vistas no sepan dibujar.
        const slot = attachAs === 'Z' ? 'Z' : 'MT';
        const IdAtk = slot + "-"+pokemonId +player.totalPokemons ;
        // Solo las MTs del catálogo traen el poder impreso en la carta; hace
        // falta guardarlo para recalcular el bono de tipo si el Pokémon
        // evoluciona. El selector manual no lo manda y se queda en null.
        const tmMeta = Number.isFinite(tmBase)
            ? { base: tmBase, bono: Boolean(tmBono) }
            : null;
        const newAttack = new Attacks(
            IdAtk,
            // Si la MT vino del catálogo de cartas lleva su nombre real; el
            // selector manual de tipo+poder sigue mandando el genérico "TM".
            tmName || "TM",
            tmType,
            tmLevel,
            "NONE",
            "D6",
            tmMeta

        )
        // El cristal Z guarda su tabla (genérico + especiales) en el ataque:
        // así, al evolucionar, se puede volver a resolver el movimiento con el
        // nombre nuevo sin tener el catálogo completo en el backend.
        if (slot === 'Z' && zData) newAttack.z = zData;

        // La MT y el cristal Z desplazan al objeto legendario, así que el
        // Pokémon vuelve a su forma base ANTES de recibirlos. El catálogo del
        // front resolvió la carta contra la forma transformada —los tipos de
        // Crown Sword Zacian, su nombre—, así que hay que rehacer esa cuenta
        // contra la ficha de vuelta, igual que se hace al evolucionar.
        const db = await openDb();
        const pkm = player.pokemons.find(p => p.id === pokemonId);
        if (await revertLegendaryForm(pkm, db)) {
            if (slot === 'Z' && newAttack.z) {
                const mov = zMoveForName(newAttack.z, pkm.name);
                newAttack.name     = mov.nombre;
                newAttack.strength = mov.poder;
            } else {
                newAttack.strength = tmStrengthFor(newAttack, pkm.type1, pkm.type2);
            }
        }

        player.attachTM(pokemonId,newAttack,slot);
        console.log('Pokemon actualizado');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Crea (o recrea) las formas mega de un Pokémon y le pone la piedra.
//
// Empieza SIEMPRE barriendo las megas que ya tuviera ese Pokémon: es lo que
// hace que poner y quitar la piedra varias veces no acumule copias en «Pokémon
// especiales». Antes se creaban a pelo y nadie las borraba nunca.
//
// Va aparte de `attachMega` porque la evolución también lo necesita: un Pokémon
// que evoluciona conservando la piedra estrena id, y sus megas hay que
// rehacerlas contra el id nuevo o se quedan huérfanas.
async function attachMegaForms(player, pokemon, db) {
    player.removeMegasOf(pokemon.id);

    // Kyogre, Groudon, Hoopa y Kyurem traen MEGA='Yes' en la base de datos, pero
    // su forma poderosa la da el objeto legendario, no la piedra: sin este corte
    // habría dos caminos al mismo sitio y con reglas distintas (uno crea carta
    // aparte, el otro transforma). La piedra no les hace nada.
    if (isLegendaryBase(pokemon.pokedex)) return false;

    // 'evo' (Zygarde 10%/50%) tampoco es cosa de la piedra ya. Nunca creó una
    // mega form —solo habilitaba el paso a la fase siguiente, y se gastaba al
    // darlo—, y ese trabajo pasó al objeto legendario. La ficha sigue diciendo
    // 'evo' porque es la marca que usa la cadena de evolución para saber que ese
    // paso no va por niveles; lo que cambió es qué objeto lo dispara.
    // (Zygarde Complete sí tiene mega de verdad, M0718, y viene con MEGA='Yes'.)
    if (pokemon.mega !== 'Yes' && pokemon.mega !== 'doble') return false;

    // Mega principal (almacenada en pokemon.evolution)
    const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokemon.evolution]);
    if (!pokemonData) return false;

    // Las formas que salen de aquí se buscan por id en la pantalla de batalla,
    // así que el id lleva el del Pokémon base: `totalPokemons` es el mismo para
    // los dos Charizard del equipo y sus megas salían con el id repetido.
    const megaId = (data) => player.name + '_' + data.POKEDEX + '_' + pokemon.id;

    const buildMega = async (data) => {
        const mega = new Pokemons(
            megaId(data),
            data.POKEDEX,
            data.NAME,
            data.TYPE1,
            data.TYPE2,
            data.LEVEL,
            await getAttack(data.ATK1, db),
            await getAttack(data.ATK2, db),
            await getAttack(data.ATK3, db),
            data.NEXT_LEVEL,
            data.EVOLUTION,
            data.MEGA
        );
        mega.extra = pokemon.extra;
        mega.totalLevel = mega.level + mega.extra;
        mega.mote = pokemon.mote || '';
        // Varias formas base pueden compartir la misma mega (las dos Meowstic
        // apuntan a M0678), así que la mega recuerda de cuál salió: por pokedex
        // sola no se puede distinguir al revertir ni al subir de nivel.
        mega.basePokemonId = pokemon.id;
        player.addMega(mega);
    };

    await buildMega(pokemonData);

    // Megas alternativas (via PREEVOLUCION), excluyendo la principal ya agregada
    const altMegas = await db.all("SELECT DISTINCT POKEDEX FROM pokemons WHERE PREEVOLUCION = ? AND POKEDEX != ?", [pokemon.pokedex, pokemon.evolution]);
    for (const alt of altMegas) {
        const altData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [alt.POKEDEX]);
        if (!altData) continue;
        await buildMega(altData);
    }

    pokemon.addAttach("Mega");
    return true;
}

export const attachMega  = async (req, res) => {
    console.log('attach Mega  ');
    try {
        const db = await openDb();
        const { playerId, pokemonId} = req.body;
        console.log("playerId: "+playerId + "pokemonId: " + pokemonId );
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'jugador no encontrado' });
        }
        const pokemon = player.pokemons.find(pokemon => pokemon.id === pokemonId);
        if (!pokemon) {
            return res.status(404).json({ message: 'pokemon no encontrado' });
        }

        // La piedra ocupa el mismo hueco que el objeto legendario, así que
        // ponerla deshace la transformación (ver revertLegendaryForm).
        await revertLegendaryForm(pokemon, db);
        await attachMegaForms(player, pokemon, db);

        console.log('Pokemon mega');
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        res.status(200).json({ message: 'Pokemon updated', player });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ── Formas legendarias («Legendary Evo. Item») ──────────────────────────────
//
// Zacian con su objeto ES Crown Sword Zacian, no un Zacian con una carta extra
// al lado. Por eso esto no se parece a `attachMegaForms`: no se añade nada a
// `player.megas`, se reescribe el Pokémon que ya está en el equipo.
//
// El `id` NO cambia. Es lo que hace que la transformación sea reversible sin
// dejar rastro: la batalla en curso, el historial y el hueco del equipo siguen
// apuntando al mismo Pokémon, se llame como se llame ahora. (La evolución
// normal sí estrena id, pero allí la forma vieja no vuelve nunca.)

// Copia sobre `pokemon` la ficha `data` de la base de datos. Lo que describe a
// la especie se reemplaza; lo que es de ESTE Pokémon —niveles extra, estado,
// mote— sobrevive, porque la transformación no lo cura ni lo reinicia.
async function applyFormFromRow(pokemon, data, db) {
    pokemon.pokedex = data.POKEDEX;
    pokemon.name    = data.NAME;
    pokemon.type1   = data.TYPE1;
    pokemon.type2   = data.TYPE2;
    pokemon.level   = data.LEVEL;
    pokemon.attack1 = await getAttack(data.ATK1, db);
    pokemon.attack2 = await getAttack(data.ATK2, db);
    pokemon.attack3 = await getAttack(data.ATK3, db);
    pokemon.nextLevel  = data.NEXT_LEVEL;
    // Los extra se conservan tal cual: un Zacian con +2 sube a Crown Sword con
    // esos +2 encima del nivel de la forma nueva.
    pokemon.totalLevel = pokemon.level + pokemon.extra;
}

// Deshace la transformación si la hay. La llaman los CUATRO adjuntadores, no
// solo el de quitar item: la MT, el cristal Z, el orbe Tera y la piedra mega
// pisan el mismo hueco `attach`, así que cualquiera de ellos le quita el objeto
// legendario al Pokémon — y sin el objeto no hay forma que valga.
//
// Devuelve true si revirtió algo, para que quien llama sepa si tiene que
// notificar aunque no haya hecho nada más.
async function revertLegendaryForm(pokemon, db) {
    if (!pokemon?.legendaryBase) return false;

    const base = await db.get(
        "SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokemon.legendaryBase]);
    if (!base) return false;

    await applyFormFromRow(pokemon, base, db);
    pokemon.evolution = base.EVOLUTION;
    pokemon.mega      = base.MEGA;
    pokemon.legendaryBase = null;
    return true;
}

// Transforma al Pokémon en la forma pedida y le deja el objeto puesto.
async function applyLegendaryForm(player, pokemon, formPokedex, db) {
    // De qué base sale: si ya está transformado es la que guardó el marcador,
    // no su POKEDEX actual. Así se puede pasar de Black a White Kyurem directo.
    const basePokedex = pokemon.legendaryBase || pokemon.pokedex;
    if (!isLegendaryFormOf(basePokedex, formPokedex)) return null;

    const data = await db.get(
        "SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [formPokedex]);
    if (!data) return null;

    // Las megas que tuviera se van con la piedra: el objeto legendario ocupa su
    // hueco. Se barre antes de reescribir el Pokémon porque `removeMegasOf`
    // necesita reconocerlo por su POKEDEX de base.
    player.removeMegasOf(pokemon.id);

    await applyFormFromRow(pokemon, data, db);
    // La forma transformada es terminal, aunque su fila diga otra cosa: C0888 y
    // C0889 se apuntan a sí mismas en EVOLUTION y traen MEGA='Yes', restos de
    // cuando estas formas colgaban de la lógica mega. Se normaliza aquí en vez
    // de tocar la base para no arrastrar el cambio a los respaldos ni al
    // combate mega, que sigue sorteando entre las fichas FORM='Mega'.
    pokemon.evolution = '0000';
    pokemon.mega      = 'No';
    pokemon.attach    = 'LegendEvo';
    pokemon.teraType  = null;
    pokemon.equipItem = null;
    pokemon.legendaryBase = basePokedex;
    return pokemon;
}

export const attachLegendary = async (req, res) => {
    try {
        const db = await openDb();
        const { playerId, pokemonId, formPokedex } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });

        const pokemon = player.pokemons.find(p => p.id === pokemonId);
        if (!pokemon) return res.status(404).json({ message: 'Pokémon no encontrado' });

        if (!formPokedex) return res.status(400).json({ message: 'Falta la forma legendaria' });

        const applied = await applyLegendaryForm(player, pokemon, formPokedex, db);
        if (!applied) {
            return res.status(400).json({ message: 'Esa forma no sale de este Pokémon' });
        }

        updateGameAndNotify();
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
                timestamp: Date.now(),
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


// El mote solo cambia lo que se pinta. No toca `name`, así que no afecta a los
// cristales Z, ni a los sprites que se buscan por nombre, ni al historial.
export const setMote = async (req, res) => {
    try {
        const { playerId, pokemonId, mote } = req.body;
        const player = getPlayerById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Jugador no encontrado' });
        }

        player.setMote(pokemonId, mote);
        updateGameAndNotify();

        res.status(200).json({ message: 'Mote updated', player });
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

        // Formas que da el objeto legendario. Van por su lado y no mezcladas con
        // las megas, porque la flecha que las precede es el objeto que las
        // provoca —igual que la mega lleva el símbolo de mega y el G-Max el de
        // Dinamax—, y decir «mega» de un Crown Sword Zacian sería mentir.
        const getLegendaries = (data) => {
            const forms = legendaryFormsOf(data.POKEDEX);
            if (!forms.length) return [];
            // Necrozma ya enseña sus tres formas como ramas de evolución
            // (EVOLUTION='pre'): además de con el objeto, se llega a ellas
            // subiendo un nivel. Repetirlas aquí las pintaría dos veces.
            if (data.EVOLUTION === 'pre') return [];
            return forms;
        };

        const getMegas = async (data) => {
            // Kyogre, Groudon, Hoopa y Kyurem vienen marcados como mega en la
            // base de datos, pero su forma ya no la da la piedra (ver
            // attachMegaForms). Salen por getLegendaries, con su propia flecha.
            if (isLegendaryBase(data.POKEDEX)) return [];
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
                gmax: bGmax, megas: bMegas, legendaries: getLegendaries(b),
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

            chain.push({ pokedex: data.POKEDEX, name: data.NAME, type1: data.TYPE1, type2: data.TYPE2,
                         gmax, megas, legendaries: getLegendaries(data), branches });

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

// ── Bolsa de eventos ────────────────────────────────────────────────────────
// Lo que el jugador gana en un evento y decide no usar en el momento se queda
// aquí hasta que lo active. La entrada la arma el front (es quien conoce el
// catálogo de cartas); el backend solo la guarda y la borra.

export const bagAdd = async (req, res) => {
    try {
        const { playerId, entry } = req.body;
        if (!entry || !entry.uid) return res.status(400).json({ message: 'Entrada de bolsa no válida' });
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        player.addToBag(entry);
        updateGameAndNotify();
        res.status(200).json({ message: 'Guardado en la bolsa', bag: player.bag });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const bagRemove = async (req, res) => {
    try {
        const { playerId, uid } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        player.removeFromBag(uid);
        updateGameAndNotify();
        res.status(200).json({ message: 'Sacado de la bolsa', bag: player.bag });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Marca el evento como lanzado: se consume al abrirlo, no al decidir, para que
// cerrar sin elegir cueste igual que elegir. Se limpia al empezar el turno.
export const markEventUsed = async (req, res) => {
    try {
        const { playerId, eventId } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });
        player.markEventUsed(eventId);
        updateGameAndNotify();
        res.status(200).json({ message: 'Evento marcado', eventsUsed: player.eventsUsed });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mueve la ficha del jugador en el tablero del mapa. El alcance lo calcula el
// mapa en el front (BFS con el dado), aquí solo se guarda la casilla: es la
// misma confianza que ya se le da al resto de acciones del simulador.
// `nodeId` null deja al jugador fuera del tablero (vuelve a poder colocarse).
export const updateMapPosition = async (req, res) => {
    try {
        const { playerId, nodeId } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });

        player.mapNodeId = nodeId || null;
        updateGameAndNotify();

        res.status(200).json({ message: 'Posición actualizada', mapNodeId: player.mapNodeId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Habilidad Surf: abre las casillas de tipo `surf` del tablero del mapa.
// `value` opcional; sin él alterna. Se llama desde el mapa mientras no exista
// un objeto o evento que la conceda.
export const toggleSurf = async (req, res) => {
    try {
        const { playerId, value } = req.body;
        const player = getPlayerById(playerId);
        if (!player) return res.status(404).json({ message: 'Jugador no encontrado' });

        player.surf = typeof value === 'boolean' ? value : !player.surf;
        updateGameAndNotify();

        res.status(200).json({ message: 'Surf actualizado', surf: player.surf });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
