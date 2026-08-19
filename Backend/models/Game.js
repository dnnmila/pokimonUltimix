class Game {
    constructor(id) {
        this.id = id;
        this.round = 0;
        this.players = [];
        this.rivals = [];
        this.time = 0;
        this.currentTurn = 0;
        this.currentView = 0;
        this.battleOn = false;
        this.CurrentRival ={};
        this.weather = 'Normal';
        this.weatherTurns = 0;
        // 2 espacios de carta de campo. Cada slot: { id, owner } | null
        // owner es 'player' o 'rival' en las cartas de equipo, null en las globales.
        this.fieldMoves = [null, null];
        //Battle
        this.myPlayerPkm= [];
        this.myPlayerPkmAtk= [];
        this.myRivalPkm= [];
        this.myRivalPkmAtk= [];
        this.myPlayerTotal=0;
        this.myRivalTotal=0;
        // El "Extra" del desglose: item + cartas de campo + Orbe Tera. Lo calcula
        // la tablet (necesita el estado del Pokémon, que solo vive ahí) y viaja
        // pegado al total para que el espejo enseñe la misma cuenta.
        this.myPlayerExtra=0;
        this.myRivalExtra=0;
        this.myPlayerDice = 0;
        this.myRivalDice = 0;
        this.myPlayerDiceRows = [];
        this.myRivalDiceRows = [];
        this.myBonusFinal = 0;
        this.rivalBonusFinal = 0;
        this.myBonusAtk1 = 0;
        this.myBonusAtk2 = 0;
        this.myBonusAtk3 = 0;
        this.rivalBonusAtk1 = 0;
        this.rivalBonusAtk2 = 0;
        this.rivalBonusAtk3 = 0;
        this.battlePhase = 'PokemonSelection';
        this.battlePublic = false;
        // Qué grupo del equipo está mirando el jugador en la selección: equipo
        // normal o megas / G-Max. Solo lo consume el espejo del marcador, para
        // enseñar lo mismo que la tablet.
        this.simFormsView = false;
        this.generation = 1;
        this.pendingPurchases = [];
        this.purchaseHistory = [];
        this.stateHistory = [];
        this.levelHistory = [];
        this.paused = false;
        this.pausedAt = null;
        this.ended = false;
        this.winner = null;
        this.badgeHistory = [];
        // Incursión Max en curso, o null. La lleva un solo jugador (el host) y
        // guarda el marcador acumulado de los cuatro combates. Vive aquí y no en
        // el SimPlayer para que el espejo del marcador la vea y para que
        // sobreviva a un refresco de la tablet. Ver los raid* de gameController.
        this.raid = null;



    }

    changeWeather(weather) {
        this.weather = weather;
        this.weatherTurns = 0;
    }

    setFieldMove(slot, id, owner) {
        if (slot !== 0 && slot !== 1) return;
        if (!this.fieldMoves) this.fieldMoves = [null, null];
        this.fieldMoves[slot] = id ? { id, owner: owner || null } : null;
    }

    clearFieldMoves() {
        this.fieldMoves = [null, null];
    }

    addPlayer(player) {
        console.log('adding player2 ' );
        this.players.push(player);
        // Lógica adicional para agregar Pokémon
    }
    addRival(rival) {
        this.rivals.push(rival);
        // Lógica adicional para agregar Pokémon
    }

    //Battle new features
    addMyPlayerPkm(pokemon) {
        this.myPlayerPkm.push(pokemon);
    }
    addMyPlayerPkmAtk(attack) {
        this.myPlayerPkmAtk.push(attack);
    }
    addMyRivalPkm(pokemon) {
        this.myRivalPkm.push(pokemon);
    }
    addMyRivalPkmAtk(attack) {
        this.myRivalPkmAtk.push(attack);
    }
    addMyPlayerTotal(total) {
        this.myPlayerTotal = total;
    }
    addMyRivalTotal(total) {
        this.myRivalTotal = total;
    }

    // El Pokémon que sube teracristalizado o dinamaxizado NO es el que está en el
    // equipo: la tablet le cambia los tipos (orbe) o los tres ataques (Max) al
    // vuelo, y de eso aquí solo llega el id. `form` trae justo esa diferencia y
    // se pega encima de la ficha real —id y pokedex mandan los de la ficha, que
    // es lo que apunta al Pokémon de verdad—. Sin esto el espejo pintaba la
    // forma base: tipos viejos, ataques viejos y sin aura.
    applyBattleForm(pkm, form) {
        if (!pkm || !form) return pkm;
        return { ...pkm, ...form, id: pkm.id, pokedex: pkm.pokedex };
    }

    setBattlePokemon(player, pokemon, form) {
        console.log('setting battle pokemon for ' + player);
         console.log('setting battle PokemonId ' + pokemon);
        if (player === 'MyPlayer') {
            const currentPlayer = this.players[this.currentTurn];
            const found = currentPlayer.pokemons.find(p => p.id === pokemon)
                || currentPlayer.megas.find(p => p.id === pokemon)
                || (currentPlayer.gmaxes || []).find(p => p.id === pokemon)
                // En incursión el atacante puede ser de otro jugador o un
                // salvaje de relleno: no está en el equipo del host, pero sí en
                // el equipo de la incursión.
                || (this.raid?.team || []).map(s => s.pokemon).find(p => p?.id === pokemon);
            this.addMyPlayerPkm(this.applyBattleForm(found, form));
        } else if (player === 'Rival') {
            // Igual que el jugador: el rival también puede sacar mega o G-Max
            // (duelo contra otro entrenador). Buscando solo en `pokemons` se
            // metía `undefined` y el espejo se quedaba sin rival.
            const r = this.CurrentRival;
            const found = r?.pokemons?.find(p => p.id === pokemon)
                || r?.megas?.find(p => p.id === pokemon)
                || r?.gmaxes?.find(p => p.id === pokemon);
            this.addMyRivalPkm(this.applyBattleForm(found, form));
        }
    }

    setBattleAttack(player, attack) {
        console.log('setting battle attack for ' + player);
         console.log('setting battle AttackId ' + attack);
        if (player === 'MyPlayer') {
            const currentPkm = this.myPlayerPkm[this.myPlayerPkm.length - 1];
            const found = [currentPkm?.attack1, currentPkm?.attack2, currentPkm?.attack3].find(a => a && a.id === attack);
            this.addMyPlayerPkmAtk(found);
        } else if (player === 'Rival') {
            const currentPkm = this.myRivalPkm[this.myRivalPkm.length - 1];
            const found = [currentPkm?.attack1, currentPkm?.attack2, currentPkm?.attack3].find(a => a && a.id === attack);
            this.addMyRivalPkmAtk(found);
        }
    }
    // `extra` es opcional: la pantalla de batalla del máster no tiene cartas de
    // campo ni items, así que ahí el desglose no lleva esa columna y cuenta 0.
    setBattleTotal(player, total, extra) {
        console.log('setting battle total for ' + player);
         console.log('setting battle Total ' + total);
        if (player === 'MyPlayer') {
            this.addMyPlayerTotal(total);
            this.myPlayerExtra = extra || 0;
        } else if (player === 'Rival') {
            this.addMyRivalTotal(total);
            this.myRivalExtra = extra || 0;
        }
    }

    setBattleDice(player, dice, rows) {
        if (player === 'MyPlayer') {
            this.myPlayerDice = dice;
            if (rows !== undefined) this.myPlayerDiceRows = rows;
        } else if (player === 'Rival') {
            this.myRivalDice = dice;
            if (rows !== undefined) this.myRivalDiceRows = rows;
        }
    }

    setBattleBonusFinal(player, bonus) {
        if (player === 'MyPlayer') this.myBonusFinal = bonus;
        else if (player === 'Rival') this.rivalBonusFinal = bonus;
    }

    setBattleBonuses(player, b1, b2, b3) {
        if (player === 'MyPlayer') {
            this.myBonusAtk1 = b1;
            this.myBonusAtk2 = b2;
            this.myBonusAtk3 = b3;
        } else if (player === 'Rival') {
            this.rivalBonusAtk1 = b1;
            this.rivalBonusAtk2 = b2;
            this.rivalBonusAtk3 = b3;
        }
    }

    toggleBattlePublic() {
        this.battlePublic = !this.battlePublic;
    }

    setBattlePhase(phase) {
        console.log('setting battle phase ' + phase);
        this.battlePhase = phase;
        if (phase === 'AttackSelection') {
            this.myPlayerDice = 0;
            this.myRivalDice = 0;
            this.myPlayerDiceRows = [];
            this.myRivalDiceRows = [];
            this.myPlayerTotal = 0;
            this.myRivalTotal = 0;
            this.myPlayerExtra = 0;
            this.myRivalExtra = 0;
        }
    }

    startSimMirror(playerId) {
        const isCurrentTurn = this.players[this.currentTurn]?.id === playerId;
        if (!isCurrentTurn) return;
        const player = this.players.find(p => p.id === playerId);
        if (!player?.simRival) return;
        this.CurrentRival = player.simRival;
        this.battlePublic = true;
        this.battlePhase = 'PokemonSelection';
        this.simFormsView = false;
        this.myPlayerPkm = [];
        this.myRivalPkm = [];
        this.myPlayerPkmAtk = [];
        this.myRivalPkmAtk = [];
        this.myPlayerTotal = 0;
        this.myRivalTotal = 0;
        this.myPlayerExtra = 0;
        this.myRivalExtra = 0;
        this.myPlayerDice = 0;
        this.myRivalDice = 0;
        this.myPlayerDiceRows = [];
        this.myRivalDiceRows = [];
        this.myBonusFinal = 0;
        this.rivalBonusFinal = 0;
        this.myBonusAtk1 = 0;
        this.myBonusAtk2 = 0;
        this.myBonusAtk3 = 0;
        this.rivalBonusAtk1 = 0;
        this.rivalBonusAtk2 = 0;
        this.rivalBonusAtk3 = 0;
    }

    // Reloj de turnos: mientras el juego está pausado el tiempo queda congelado
    // en el instante de la pausa, así cambiar de jugador con el crono parado no
    // suma ni resta segundos a nadie.
    turnClock() {
        return (this.paused && this.pausedAt) ? this.pausedAt : Date.now();
    }

    nextTurn() {

        const now = this.turnClock();

        if (this.players[this.currentTurn]) {
            this.players[this.currentTurn].endTurn(now);
            this.players[this.currentTurn].isMyTurn = false;
            this.players[this.currentTurn].turnTime(this.players[this.currentTurn].timeSpent);
                }

        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.currentView = this.currentTurn;
        this.players[this.currentTurn].coins +=1;


        if (this.players[this.currentTurn]) {
            this.players[this.currentTurn].startTurn(now);
            this.players[this.currentTurn].isMyTurn = true;
            // Los eventos son una vez por turno: al entrar el jugador vuelven
            // a estar todos disponibles.
            this.players[this.currentTurn].resetTurnEvents();
        }

        if (this.currentTurn === 0) {
            // Todos los jugadores han completado su turno, se terminó la ronda
            this.round +=1;
            console.log('ronda: ' +this.round );
            if (this.weather != "Normal"){
                this.weatherTurns +=1;
            }
        }

        this.battlePublic = false;
        this.battlePhase = 'PokemonSelection';
        // Las cartas de campo se descartan al terminar la batalla
        this.clearFieldMoves();
        this.myPlayerPkm = [];
        this.myRivalPkm = [];
        this.myPlayerPkmAtk = [];
        this.myRivalPkmAtk = [];
        this.myPlayerTotal = 0;
        this.myRivalTotal = 0;
        this.myPlayerExtra = 0;
        this.myRivalExtra = 0;
        this.myPlayerDice = 0;
        this.myRivalDice = 0;
        this.myPlayerDiceRows = [];
        this.myRivalDiceRows = [];
        this.myBonusFinal = 0;
        this.rivalBonusFinal = 0;
        this.myBonusAtk1 = 0;
        this.myBonusAtk2 = 0;
        this.myBonusAtk3 = 0;
        this.rivalBonusAtk1 = 0;
        this.rivalBonusAtk2 = 0;
        this.rivalBonusAtk3 = 0;

    }

    previousTurn() {
        const now = this.turnClock();

        if (this.currentTurn === 0) {
            this.players[this.currentTurn].coins -=1;
            this.players[this.currentTurn].endTurn(now);
            this.players[this.currentTurn].isMyTurn = false;
            this.currentTurn = this.players.length - 1;

        } else {
            // De lo contrario, simplemente retrocede un turno
            this.players[this.currentTurn].coins -=1;
            this.players[this.currentTurn].endTurn(now);
            this.players[this.currentTurn].isMyTurn = false;
            this.currentTurn -= 1;
        }
        this.players[this.currentTurn].endTurn(now);
        if (this.players[this.currentTurn]) {
            this.players[this.currentTurn].startTurn(now);
            this.players[this.currentTurn].isMyTurn = true;
            this.players[this.currentTurn].resetTurnEvents();
        }

        this.battlePublic = false;
        this.battlePhase = 'PokemonSelection';
        // Las cartas de campo se descartan al terminar la batalla
        this.clearFieldMoves();
        this.myPlayerPkm = [];
        this.myRivalPkm = [];
        this.myPlayerPkmAtk = [];
        this.myRivalPkmAtk = [];
        this.myPlayerTotal = 0;
        this.myRivalTotal = 0;
        this.myPlayerExtra = 0;
        this.myRivalExtra = 0;
        this.myPlayerDice = 0;
        this.myRivalDice = 0;
        this.myPlayerDiceRows = [];
        this.myRivalDiceRows = [];
        this.myBonusFinal = 0;
        this.rivalBonusFinal = 0;
        this.myBonusAtk1 = 0;
        this.myBonusAtk2 = 0;
        this.myBonusAtk3 = 0;
        this.rivalBonusAtk1 = 0;
        this.rivalBonusAtk2 = 0;
        this.rivalBonusAtk3 = 0;

        if (this.currentTurn + 1 === this.players.length) {
            // Todos los jugadores han completado su turno, se terminó la ronda
            this.round -=1;
            console.log('ronda: ' +this.round );
            if (this.weather != "Normal"){
                this.weatherTurns -=1;
            }
        }
    }

    nextPlayerView() {
        this.currentView = (this.currentView + 1) % this.players.length;
    }

    prevPlayerView() {
        if (this.currentView === 0) {
            this.currentView = this.players.length - 1;
        } else {
            // De lo contrario, simplemente retrocede un turno
            this.currentView -= 1;
        }
    }

   

    calculatePoints() {
        this.players.forEach(player => {
            player.points = player.coins;
    
            if (player.badge1 === true) {
                player.points += 10;
            }
            if (player.badge2 === true) {
                player.points += 20;
            }
            if (player.badge3 === true) {
                player.points += 30;
            }
            if (player.badge4 === true) {
                player.points += 40;
            }
            if (player.badge5 === true) {
                player.points += 50;
            }
            if (player.badge6 === true) {
                player.points += 60;
            }
            if (player.badge7 === true) {
                player.points += 70;
            }
            if (player.badge8 === true) {
                player.points += 80;
            }
            if (player.badge9 === true) {
                player.points += 100;
            }
            if (player.badge10 === true) {
                player.points += 1000;
            }
    
            player.pokemons.forEach(pokemon => {
                player.points += pokemon.totalLevel * 2;
            });
        });
    }

    updatePlayerPositions() {
        // Crear una copia del arreglo de jugadores y ordenarla por puntos
        const sortedPlayers = [...this.players].sort((a, b) => b.points - a.points);

        // Iterar sobre los jugadores ordenados y actualizar su posición
        sortedPlayers.forEach((player, index) => {
            // El índice comienza en 0, por lo que sumamos 1 para empezar las posiciones en 1
            const position = index + 1;

            // Encuentra al jugador en el arreglo original y actualiza su posición
            const originalPlayer = this.players.find(p => p.id === player.id);
            if (originalPlayer) {
                originalPlayer.position = position;
            }
        });
    }

    wildBattleOn(Rival) {
        console.log('wildBattleON');
        this.CurrentRival =Rival;
        console.log('Rival added');
    }
    endWildBattle(){
        this.WildPokemon={};
       this.WildBattle=false;
    }

    setRival(rival,team){
        this.rival=rival;
        this.rivalPokemons = team;
    }
}



export default Game;