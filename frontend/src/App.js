
import React, { useState ,useEffect} from 'react';
import Game from './components/Game.js';
import MenuPlayers from './components/MenuPlayers.js';
import Player from './components/Player.js';
import Stadium from './components/Stadium.js';
import SimPlayer from './components/SimPlayer.js';

import AllPlayers from './components/AllPlayers.js';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import "./styles/app.scss";

import SERVER_IP from './config.js';


function App() {
  const [game, setGame] = useState({ players: [], currentTurn: 0 });
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    // Establecer la conexión con el servidor de Socket.io
    const socket = io(SERVER_IP);

    // Escuchar el evento 'gameUpdated'
    socket.on('gameUpdated', (updatedGameData) => {
        setGame(updatedGameData);
        setIsGameStarted(true); // Asumiendo que quieres empezar el juego cuando recibes datos
    });

    // Limpieza al desmontar el componente
    return () => {
        socket.off('gameUpdated');
        socket.disconnect();
    };
}, []);

  const startGame = async () => {
    try {
      const response = await fetch(`${SERVER_IP}/start-game`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
      });
      const data = await response.json();
      setGame(data);
      setIsGameStarted(true);
  } catch (error) {
      console.error('Error al iniciar el juego:', error);
  }
      
  };

  const loadGame = async () => {
    try {
      const response = await fetch(`${SERVER_IP}/load-game`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
          setIsGameStarted(true);
          console.log('Partida cargada:', data.message);
      } else {
          alert('No hay auto-guardado disponible');
      }
    } catch (error) {
        console.error('Error al cargar la partida:', error);
    }
  };

  const continueGame = async () => {
    try {
      const response = await fetch(`${SERVER_IP}/continue-game`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
      });
      const data = await response.json();
      console.log(data);
      
  } catch (error) {
      console.error('Error al iniciar el juego:', error);
  }
      
  };

  const nextTurn = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/next-turn`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerButton: 'master' }),
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
        }

        // Procesar la respuesta si es necesario
    } catch (error) {
        console.error('Error al avanzar al siguiente jugador:', error);
    }
};


const startBattle = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/start-battle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
        }

        // Procesar la respuesta si es necesario
    } catch (error) {
        console.error('Error al avanzar al siguiente jugador:', error);
    }
};

const prevTurn = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/prev-turn`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
        }

        // Procesar la respuesta si es necesario
    } catch (error) {
        console.error('Error al avanzar al siguiente jugador:', error);
    }
};

const nextView = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/next-view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
        }

        // Procesar la respuesta si es necesario
    } catch (error) {
        console.error('Error al avanzar al siguiente jugador:', error);
    }
};

const prevView = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/prev-view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
        }

        // Procesar la respuesta si es necesario
    } catch (error) {
        console.error('Error al avanzar al siguiente jugador:', error);
    }
};

const addPokemonToPlayer = async (playerId, pokemonId) => {
    try {
        const response = await fetch(`${SERVER_IP}/add-pokemon`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};

const evolvePokemon = async (playerId, pokemonId, newPokemonId) => {
    try {
        const response = await fetch(`${SERVER_IP}/evolve-pokemon`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId,newPokemonId}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};


const removePokemonToPlayer = async (playerId, pokemonId) => {
    try {
        const response = await fetch(`${SERVER_IP}/remove-pokemon`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};

const updateCoins = async (playerId, coins) => {
    try {
        const response = await fetch(`${SERVER_IP}/update-coins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, coins }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar monedas:', error);
    }
};



const increaseLevel = async (playerId ,pokemonId) => {
    try {
        const response = await fetch(`${SERVER_IP}/increase-level`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar monedas:', error);
    }
};

const changeState = async (playerId ,pokemonId) => {
    try {
        const response = await fetch(`${SERVER_IP}/change-state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar monedas:', error);
    }
};

const changeStatus = async (playerId ,pokemonId,status) => {
    try {
        const response = await fetch(`${SERVER_IP}/change-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId,status}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar monedas:', error);
    }
};


const attachItem = async (playerId ,pokemonId,itemAttached) => {
    try {
        const response = await fetch(`${SERVER_IP}/attach-item`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId,itemAttached}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error al agregar item:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar item:', error);
    }
};

const attachMega = async (playerId ,pokemonId) => {
    try {
        console.log("playerId" + playerId);
        console.log("pokemonId"+ pokemonId);
        const response = await fetch(`${SERVER_IP}/attach-mega`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error al agregar item:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar item:', error);
    }
};


const attachTM = async (playerId ,pokemonId,tmType,tmLevel) => {
    try {
        const response = await fetch(`${SERVER_IP}/attach-TM`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId,tmType,tmLevel}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error al agregar item:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar item:', error);
    }
};

const badgeWon = async (playerId ,numBadge) => {
    try {
        const response = await fetch(`${SERVER_IP}/badge-won`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, numBadge}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar monedas:', error);
    }
};

const badgeLost = async (playerId ,numBadge) => {
    try {
        const response = await fetch(`${SERVER_IP}/badge-lost`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, numBadge}),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar monedas:', error);
    }
};

const wildBattle = async (pokemonId) => {
    try {
        console.log(pokemonId);
        const response = await fetch(`${SERVER_IP}/wild-battle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({pokemonId }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};

const playerBattle = async (playerId) => {
    try {
        const response = await fetch(`${SERVER_IP}/player-battle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({playerId }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
      
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};

const toggleDynamax = async (playerId) => {
    try {
        await fetch(`${SERVER_IP}/toggle-dynamax`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId }),
        });
    } catch (error) {
        console.error('Error al toggle dynamax:', error);
    }
};

const LeaderBattle = async (LeaderID,pokemonId1,pokemonId2) => {
    try {
        console.log("Leafer battle request");
        const response = await fetch(`${SERVER_IP}/leader-battle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({LeaderID,pokemonId1,pokemonId2 }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};


const addPlayer = async (id,name,turn) => {
    try {
        console.log("playerrequest");
        const response = await fetch(`${SERVER_IP}/add-player`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({id,name,turn }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};

//new battle feautres

const onHandleBattlePokemon = async (player, idPokemon) => {
    try {
        console.log("onHandleBattlePokemon request");
        console.log("idPokemon: " + idPokemon);
        const response = await fetch(`${SERVER_IP}/set-my-battle-pokemon`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({player, idPokemon }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};


const onHandleBattleAttack = async (player,idAttack) => {
    try {
        console.log("onHandleBattleAttack request");
        const response = await fetch(`${SERVER_IP}/set-my-battle-attack`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({player,idAttack }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al agregar Pokémon:', error);
    }
};

const onHandleTotales = async (player,NewTotal) => {
    try {
        console.log("onHandleTotalesequest");
        const response = await fetch(`${SERVER_IP}/set-my-battle-total`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({player,NewTotal }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al asignar total:', error);
    }
};

const toggleBattlePublic = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/toggle-battle-public`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) console.error('Error en toggle-battle-public:', response.status);
    } catch (error) {
        console.error('Error en toggleBattlePublic:', error);
    }
};

const simWildBattle = async (playerId, pokemonId) => {
    try {
        const response = await fetch(`${SERVER_IP}/sim-wild-battle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, pokemonId }),
        });
        if (!response.ok) console.error('Error en sim-wild-battle:', response.status);
    } catch (error) {
        console.error('Error en simWildBattle:', error);
    }
};

const simLeaderBattle = async (playerId, LeaderID, pokemonId1, pokemonId2) => {
    try {
        const response = await fetch(`${SERVER_IP}/sim-leader-battle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, LeaderID, pokemonId1, pokemonId2 }),
        });
        if (!response.ok) console.error('Error en sim-leader-battle:', response.status);
    } catch (error) {
        console.error('Error en simLeaderBattle:', error);
    }
};

const onHandleBonusFinal = async (player, bonus) => {
    try {
        const response = await fetch(`${SERVER_IP}/set-battle-bonus-final`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, bonus }),
        });
        if (!response.ok) console.error('Error en set-battle-bonus-final:', response.status);
    } catch (error) {
        console.error('Error al asignar bonus final:', error);
    }
};

const onHandleDice = async (player, dice) => {
    try {
        const response = await fetch(`${SERVER_IP}/set-battle-dice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, dice }),
        });
        if (!response.ok) console.error('Error en set-battle-dice:', response.status);
    } catch (error) {
        console.error('Error al asignar dado:', error);
    }
};

const onHandleBonuses = async (player, b1, b2, b3) => {
    try {
        const response = await fetch(`${SERVER_IP}/set-battle-bonuses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, b1, b2, b3 }),
        });
        if (!response.ok) console.error('Error en set-battle-bonuses:', response.status);
    } catch (error) {
        console.error('Error al asignar bonuses:', error);
    }
};

const onChangeBattlePhase = async (newPhase) => {
    try {
        console.log("onChangeBattlePhase request");
        const response = await fetch(`${SERVER_IP}/set-battle-phase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({newPhase }),
        });

        if (response.ok) {
            const updatedPlayer = await response.json();
            console.log(updatedPlayer);
            // Actualiza el estado del juego con el jugador actualizado
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al asignar Fase de batalla:', error);
    }
};










  
return (
    <Router>
        <Routes>
            <Route path="/" element={<Game onStartGame={startGame} isGameStarted={isGameStarted} onContinueGame={continueGame} onLoadGame={loadGame}/>} />
            <Route path="/menuPlayers" element={<MenuPlayers addPlayer={addPlayer} />} />
            <Route path="/game" element={<Player currentPlayerTurn={game.players[game.currentTurn]} currentPlayerView={game.players[game.currentView]} AllPlayers={game.players}onNextTurn={nextTurn} onPrevTurn={prevTurn} onNextView={nextView} onPrevView={prevView} onAddPokemon={addPokemonToPlayer} onEvolvePokemon={evolvePokemon} onDeletePokemon={removePokemonToPlayer} onUpdateCoins={updateCoins} increaseLevel={increaseLevel} badgeWon={badgeWon} badgeLost={badgeLost}
            onAttach={attachItem} game={game} onStartBattle={startBattle} onChangeState={changeState} onChangeStatus={changeStatus} wildBattle={wildBattle} playerBattle={playerBattle} LeaderBattle={LeaderBattle} attachTM={attachTM} attachMega={attachMega} toggleDynamax={toggleDynamax}/>} />
            <Route path="/players" element={<AllPlayers />} />
            <Route path="/battle" element={ <Stadium game={game} player={game.players[game.currentTurn]} rival={game.CurrentRival}  onHandleBattlePokemon={onHandleBattlePokemon} onHandleBattleAttack={onHandleBattleAttack} onHandleTotales={onHandleTotales} onChangeBattlePhase={onChangeBattlePhase} onToggleBattlePublic={toggleBattlePublic} onHandleDice={onHandleDice} onHandleBonuses={onHandleBonuses} onHandleBonusFinal={onHandleBonusFinal}/>} />
            <Route path="/pokedex/:playerId" element={<SimPlayer game={game} onSimWildBattle={simWildBattle} onSimLeaderBattle={simLeaderBattle}/>} />

        </Routes>
    </Router>
);
                }

export default App;
