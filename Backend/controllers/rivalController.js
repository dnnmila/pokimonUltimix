import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Pokemons from '../models/Pokemons.js';
import Attacks from '../models/Attacks.js';
import { getGame ,getPlayerById,updateGameAndNotify,getRivalById } from '../gameInstance.js';

async function openDb() {
    return open({
        filename: './db/pokimonDOUBLE.sqlite',
        //filename: './db/pokimonULTIMIX.sqlite', 
        driver: sqlite3.Database
    });
}

async function  getAttack(idAttack,db){
    try {
        const AttackData = await db.get("SELECT * FROM attacks WHERE IDATK = ?", [idAttack]);
        if (!AttackData) {
            return ( 'Attack was not found ' );
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
        
    }


}
export const addPokemonToRival = async (Rivalid, pokemonId) => {
    try {
        const db = await openDb();


        // Obtener el jugador por su ID
        const rival = await getRivalById(Rivalid);
        console.log('Rival ' + rival.name);
        if (!rival) {
            return ( 'Jugador no encontrado' );
        }

        // Asegurarse de que pokemonId tenga siempre 3 dígitos
  

        // Busca el Pokémon en la base de datos
        const pokemonData = await db.get("SELECT * FROM pokemons WHERE POKEDEX = ? LIMIT 1", [pokemonId]);
        console.log("Looking for Attack 1 ");
        const Attack1 = await getAttack(pokemonData.ATK1,db);
        console.log(Attack1);
        console.log("Looking for Attack 1 ");
        const Attack2 = await getAttack(pokemonData.ATK2,db);
        console.log(Attack2);
        const Attack3 = await getAttack(pokemonData.ATK3,db);
        console.log(Attack3);
        if (!pokemonData) {
            return ('Pokémon no encontrado' );
        }

        const uniqueId =  pokemonData.POKEDEX ;
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
      

        rival.addPokemon(pokemon);
        console.log(rival.name + ' ha agreago al pokemon ' + rival.name );
        console.log(pokemon);
        updateGameAndNotify();
        // Aquí, lógica para actualizar el jugador en la base de datos con el nuevo Pokémon

        
    } catch (error) {
        
    }
};