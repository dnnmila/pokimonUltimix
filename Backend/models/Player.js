
class Player {
    constructor(id,name,turn) {
        this.id = id;
        this.name = name;
        this.turn = turn;
        this.pokemons = [];
        this.megas = [];
        this.gmaxes = [];
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
        this.simRival = null;
        this.dynamax = false;
        // Bolsa: objetos ganados en eventos que el jugador guardó sin usar.
        // Cada entrada es { uid, kind, ...datos }; hoy solo hay kind 'tm', con
        // el id de la carta del catálogo del front (data/tms.js).
        this.bag = [];
        // Eventos ya lanzados en el turno en curso: { [eventId]: true }.
        // Se vacía al empezar el turno del jugador (Game.nextTurn).
        this.eventsUsed = {};
        // Casilla del tablero donde está la ficha. `null` = aún sin colocar:
        // el mapa deja elegir cualquier nodo como salida en ese caso.
        // Es el id del nodo (`node-…` de boardNodes, o `gym-N` de mapCoords).
        this.mapNodeId = null;
        // Habilidad Surf. Las casillas de tipo `surf` del tablero no se pueden
        // pisar hasta tenerla. Hoy se activa a mano desde el mapa; el día que
        // haya un objeto o evento que la conceda, bastará con ponerla a true.
        this.surf = false;


    }

    addPokemon(pokemon) {
        this.pokemons.push(pokemon);
        this.totalPokemons += 1;
        // Lógica adicional para agregar Pokémon
    }
    addMega(pokemon) {
        this.megas.push(pokemon);
    }
    addGMax(pokemon) {
        this.gmaxes.push(pokemon);
    }
    addPokemonbyIndex(pokemon, index){
        this.pokemons[index] = pokemon;
        this.totalPokemons += 1;
      
    }

    removePokemonById(pokemonId) {
        // Antes del filtro: removeMegasOf necesita encontrar todavía la base
        // para el caso de las megas viejas sin `basePokemonId`.
        this.removeMegasOf(pokemonId);
        this.pokemons = this.pokemons.filter(pokemon => pokemon.id !== pokemonId);
    }

    removeMegaById(pokemonId) {
        this.megas = this.megas.filter(pokemon => pokemon.id !== pokemonId);
    }

    // Quita las formas mega que `attachMega` creó PARA este Pokémon (una especie
    // puede tener dos: Charizard X e Y). Es lo que hay que llamar cada vez que
    // el Pokémon deja de llevar la piedra, o desaparece: sin esto la mega se
    // quedaba suelta en «Pokémon especiales» y volver a poner la piedra la
    // duplicaba.
    //
    // El vínculo bueno es `basePokemonId`, que estampa attachMega. Las megas
    // creadas antes de que ese campo existiera se reconocen por el POKEDEX, que
    // es el de la base con una o dos letras delante (M0003, MX0006, MZ0359).
    removeMegasOf(pokemonId) {
        const base = this.pokemons.find(p => p.id === pokemonId);
        this.megas = (this.megas || []).filter(mega => {
            if (mega.basePokemonId) return mega.basePokemonId !== pokemonId;
            if (!base) return true;
            const sinPrefijo = String(mega.pokedex || '').replace(/^[A-Za-z]+/, '');
            return sinPrefijo !== String(base.pokedex) && mega.pokedex !== base.evolution;
        });
    }
    removeGMaxById(pokemonId) {
        this.gmaxes = this.gmaxes.filter(pokemon => pokemon.id !== pokemonId);
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

    resolveBasePokemon(pkm) {
        if (!pkm) return null;
        const direct = this.pokemons.find(p => p.id === pkm.id);
        if (direct) return direct;
        if (pkm.pokedex && pkm.pokedex.startsWith('GM'))
            return this.pokemons.find(p => p.gmaxPokedex === pkm.pokedex) || null;
        if (pkm.pokedex && pkm.pokedex.startsWith('M')) {
            // basePokemonId lo estampa attachMega: es la única forma de saber cuál
            // de dos bases con la misma mega (las Meowstic) hay que devolver.
            if (pkm.basePokemonId) {
                const base = this.pokemons.find(p => p.id === pkm.basePokemonId);
                if (base) return base;
            }
            return this.pokemons.find(p => p.evolution === pkm.pokedex) || null;
        }
        return null;
    }

    increasePokemonLevel(idPokemon){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addExtra();
        // Sincronizar megas y gmaxes vinculados a este pokemon
        if (pokemon.attach === 'Mega') {
            this.megas
                // Sin basePokemonId (megas creadas antes) se mantiene el comportamiento previo
                .filter(mega => !mega.basePokemonId || mega.basePokemonId === pokemon.id)
                .forEach(mega => {
                    mega.extra = pokemon.extra;
                    mega.totalLevel = mega.level + mega.extra;
                });
        }
        if (pokemon.gmaxPokedex) {
            this.gmaxes.forEach(gmax => {
                gmax.extra = pokemon.extra;
                gmax.totalLevel = gmax.level + gmax.extra;
            });
        }
    }

    // Los tres adjuntadores de abajo pisan el mismo hueco (`attach`), así que
    // cualquiera de ellos puede quitarle la mega piedra a un Pokémon: ponerle
    // una MT, un orbe Tera o «Ninguno» son todas formas de dejarlo sin piedra.
    // Por eso los tres tienen que barrer sus megas, no solo el de quitar item.
    attachItemToPokemon(idPokemon, item){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addAttach(item);
        if (item !== 'Mega') this.removeMegasOf(idPokemon);
        console.log(pokemon);
    }

    attachTeraToPokemon(idPokemon, teraType){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addTera(teraType);
        this.removeMegasOf(idPokemon);
    }

    attachEquipToPokemon(idPokemon, equipItem){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addEquip(equipItem);
        this.removeMegasOf(idPokemon);
    }

    // `attachAs` es "MT" o "Z": ambos ocupan el mismo hueco (ver Pokemons.addTM).
    attachTM(idPokemon, Attack, attachAs = "MT"){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.addTM(Attack, attachAs);
        this.removeMegasOf(idPokemon);
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

    setSimRival(rival) {
        this.simRival = rival;
    }

    // ── Bolsa y eventos ─────────────────────────────────────────────────────
    // Las partidas guardadas antes de que existiera la bolsa no traen el campo:
    // Object.assign las restaura sin él, así que todos los métodos lo levantan
    // en vez de darlo por hecho.
    addToBag(entry) {
        if (!entry || !entry.uid) return;
        if (!Array.isArray(this.bag)) this.bag = [];
        this.bag.push(entry);
    }

    removeFromBag(uid) {
        if (!Array.isArray(this.bag)) { this.bag = []; return; }
        this.bag = this.bag.filter(item => item.uid !== uid);
    }

    markEventUsed(eventId) {
        if (!eventId) return;
        if (!this.eventsUsed) this.eventsUsed = {};
        this.eventsUsed[eventId] = true;
    }

    // Un evento se puede lanzar una vez por turno: al empezar el turno se
    // borran las marcas y vuelven a estar todos disponibles.
    resetTurnEvents() {
        this.eventsUsed = {};
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

    setMote(idPokemon, mote){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) {
            console.log('Pokémon no encontrado');
            return;
        }
        pokemon.setMote(mote);

        // Las megas y las formas G-Max son objetos aparte que el jugador elige
        // en la batalla, así que hay que arrastrarles el mote o el mismo
        // Pokémon aparecería con dos nombres distintos según la pantalla.
        (this.megas || [])
            .filter(m => m.basePokemonId === idPokemon)
            .forEach(m => m.setMote(pokemon.mote));
        if (pokemon.gmaxPokedex) {
            (this.gmaxes || [])
                .filter(g => g.pokedex === pokemon.gmaxPokedex)
                .forEach(g => g.setMote(pokemon.mote));
        }

        console.log('Mote de ' + pokemon.name + ': "' + pokemon.mote + '"');
    }

    decreaseStatusCounter(idPokemon){
        const pokemon = this.pokemons.find(pkmn => pkmn.id === idPokemon);
        if (!pokemon) return;
        pokemon.decreaseStatusCounter();
    }

    // `now` permite arrancar/cerrar el turno en el instante de la pausa en vez
    // de en el reloj real, para que el tiempo pausado no se contabilice.
    startTurn(now = Date.now()) {
        this.turnStartTime = now; // Guardar la hora de inicio del turno
    }

    // Método para terminar el turno y actualizar el tiempo total
    endTurn(now = Date.now()) {
        if (this.turnStartTime) {
            const turnDuration = Math.max(0, (now - this.turnStartTime) / 1000); // Duración en segundos
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