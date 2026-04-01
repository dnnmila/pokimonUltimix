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
        //Battle
        this.myPlayerPkm= [];
        this.myPlayerPkmAtk= [];
        this.myRivalPkm= [];
        this.myRivalPkmAtk= [];
        this.myPlayerTotal=0;
        this.myRivalTotal=0;
        this.myPlayerDice = 0;
        this.myRivalDice = 0;
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

    

    }

    changeWeather(weather) {
        this.weather = weather;
        this.weatherTurns = 0;
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

    setBattlePokemon(player, pokemon) {
        console.log('setting battle pokemon for ' + player);
         console.log('setting battle PokemonId ' + pokemon);
        if (player === 'MyPlayer') {
            this.addMyPlayerPkm(this.players[this.currentTurn].pokemons.find(p => p.id === pokemon));
        } else if (player === 'Rival') {
            this.addMyRivalPkm(this.CurrentRival?.pokemons?.find(p => p.id === pokemon));
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
    setBattleTotal(player, total) {
        console.log('setting battle total for ' + player);
         console.log('setting battle Total ' + total);
        if (player === 'MyPlayer') {
            this.addMyPlayerTotal(total);
        } else if (player === 'Rival') {
            this.addMyRivalTotal(total);
        }
    }

    setBattleDice(player, dice) {
        if (player === 'MyPlayer') this.myPlayerDice = dice;
        else if (player === 'Rival') this.myRivalDice = dice;
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
    }

    nextTurn() {

        if (this.players[this.currentTurn]) {
            this.players[this.currentTurn].endTurn();
            this.players[this.currentTurn].isMyTurn = false;
            this.players[this.currentTurn].turnTime(this.players[this.currentTurn].timeSpent);
                }

        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.players[this.currentTurn].coins +=1;


        if (this.players[this.currentTurn]) {
            this.players[this.currentTurn].startTurn();
            this.players[this.currentTurn].isMyTurn = true;
        }

        if (this.currentTurn === 0) {
            // Todos los jugadores han completado su turno, se terminó la ronda
            this.round +=1;
            console.log('ronda: ' +this.round );
            if (this.weather != "Normal"){
                this.weatherTurns +=1;
            }
        }
    
    }

    previousTurn() {
        if (this.currentTurn === 0) {
            this.players[this.currentTurn].coins -=1;
            this.players[this.currentTurn].endTurn();
            this.players[this.currentTurn].isMyTurn = false;
            this.currentTurn = this.players.length - 1;
          
        } else {
            // De lo contrario, simplemente retrocede un turno
            this.players[this.currentTurn].coins -=1;
            this.players[this.currentTurn].endTurn();
            this.players[this.currentTurn].isMyTurn = false;
            this.currentTurn -= 1;
        }
        this.players[this.currentTurn].endTurn();
        if (this.players[this.currentTurn]) {
            this.players[this.currentTurn].startTurn();
            this.players[this.currentTurn].isMyTurn = true;
        }

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