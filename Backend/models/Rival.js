
class Rival {
    constructor(id,name) {
        this.id = id;
        this.name = name;
        this.pokemons = [];
        this.megas = [];
        this.gmaxes = [];
        this.dynamax = false;
        this.award= '';
    }

    addPokemon(pokemon) {
        this.pokemons = [];
        this.pokemons[0]=pokemon;
    }
    add2Pokemon(pokemon1,pokemon2) {
        console.log("Adding 2Pokemon");
        console.log("pokemon1:" + pokemon1.name);
        console.log("pokemon2:" + pokemon2.name);
       
        this.pokemons = [];
        this.pokemons.push(pokemon1);
        this.pokemons.push(pokemon2);
        console.log("this Pokemons");
        console.log( this.pokemons);
        
    }
}

export default Rival;