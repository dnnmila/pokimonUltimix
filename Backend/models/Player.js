
class Player {
    constructor(id,name,turn) {
        this.id = id;
        this.name = name;
        this.turn = turn;
        this.pokemons = [];
        this.megas = [];
        this.coins = 3;
        this.isMyTurn = false;
        this.badge1 = false;
        this.badge2 = false;
        this.badge3 = false;
        this.badge4 = false;
        this.badge5 = false;
        this.badge6 = false;
        this.badge7 = false;
        this.badge8 = false;
        this.badge9 = false;
        this.badge10 = false;
        this.frontierPink = false;
        this.frontierGreen = false;
        this.frontierBlue = false;
        this.frontierYellow = false;
        this.frontierRed = false;
        this.frontierGolden = false;
        this.teamRocket = false;
        this.hours = 0;
        this.minutes = 0;
        this.seconds = 0;
        this.points = 0;
        this.position= 1;
        this.timeSpent = 0; // Tiempo total en segundos
        this.turnStartTime = null;
        this.totalPokemons =0;
        


    }

    addPokemon(pokemon) {
        this.pokemons.push(pokemon);
        this.totalPokemons += 1;
        // Lógica adicional para agregar Pokémon
    }
    addMega(pokemon) {
        this.megas.push(pokemon);
       
        // Lógica adicional para agregar Pokémon
    }
    addPokemonbyIndex(pokemon, index){
        this.pokemons[index] = pokemon;
        this.totalPokemons += 1;
      
    }

    removePokemonById(pokemonId) {
        this.pokemons = this.pokemons.filter(pokemon => pokemon.id !== pokemonId);
    }

    removeMegaById(pokemonId) {
        this.megas = this.megas.filter(pokemon => pokemon.id !== pokemonId);
    }

    updateNewCoins(newCoins) {
        this.coins = Math.floor(newCoins);
    }
    
    addPoints(points) {
        this.points += points;
    }

    BadgeWon(numBadge) {
        const badgeKey = `badge${numBadge}`;
        const coinsToAdjust = 5;
            this[badgeKey] = true;
            this.coins += coinsToAdjust;
        
    }

    BadgeLost(numBadge) {
        const badgeKey = `badge${numBadge}`;
        const coinsToAdjust = 5;
        this[badgeKey] = false;
        this.coins -= coinsToAdjust;
       
    }

    battleFrontier (color, win){
        if (color === 'pink'){
            this.frontierPink = true;
        }
        else if (color === 'green'){
            this.frontierGreen = true;
        }
        else if (color === 'blue'){
            this.frontierBlue = true;
        }
        else if (color === 'yellow'){
            this.frontierPink = true;
        }
        else if (color === 'red'){
            this.frontierRed = true;
        }
        else if (color === 'golden'){
            this.frontierGolden= true;
        }
        if(win === true){
            this.coins += 5;
        }
        if (win === false){
            this.coins = Math.floor(this.coins/3);
        }
    }

    newPosition(position){
        this.position = position;
    }

    increasePokemonLevel(idPokemon){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addExtra();
    }

    attachItemToPokemon(idPokemon, item){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addAttach(item);
        console.log(pokemon);
    }

    attachTM(idPokemon, Attack){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addTM(Attack);
        console.log(pokemon);
    }

    changeState(idPokemon){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.setState();
        console.log(pokemon);
    }

    changeStatus(idPokemon,status){
        console.log("Player function");
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.setStatus(status);
        console.log("New status:" + pokemon.status);
    }

    startTurn() {
        this.turnStartTime = Date.now(); // Guardar la hora de inicio del turno
    }

    // Método para terminar el turno y actualizar el tiempo total
    endTurn() {
        if (this.turnStartTime) {
            const turnDuration = (Date.now() - this.turnStartTime) / 1000; // Duración en segundos
            this.timeSpent += turnDuration; // Sumar al tiempo total
            this.turnStartTime = null; // Resetear la hora de inicio del turno
        }
    }

    turnTime(segundosTotales) {
        this.hours = Math.floor(segundosTotales / 3600);
        this.minutes = Math.floor((segundosTotales % 3600) / 60);
        this.seconds = Math.floor((segundosTotales % 60));
    
        
    }


}

export default Player;