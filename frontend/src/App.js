
import React, { useState ,useEffect} from 'react';
import Game from './components/Game.js';
import MenuPlayers from './components/MenuPlayers.js';
import SelectGeneration from './components/SelectGeneration.js';
import Player from './components/Player.js';
import Stadium from './components/Stadium.js';
import SimPlayer from './components/SimPlayer.js';

import AllPlayers from './components/AllPlayers.js';
import Score from './components/Score.js';
import HomeMenu from './components/HomeMenu.js';
import ProgressChart from './components/ProgressChart.js';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import "./styles/app.scss";

import SERVER_IP from './config.js';


function App() {
  const [game, setGame] = useState({ players: [], currentTurn: 0, currentView: 0 });
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

const pauseGame = async () => {
    try {
        await fetch(`${SERVER_IP}/pause-game`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error al pausar el juego:', error);
    }
};

const endGame = async () => {
    try {
        await fetch(`${SERVER_IP}/end-game`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('Error al terminar el juego:', error);
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

const tradePokemon = async (playerIdA, pokemonIdA, playerIdB, pokemonIdB) => {
    try {
        const response = await fetch(`${SERVER_IP}/trade-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerIdA, pokemonIdA, playerIdB, pokemonIdB }),
        });
        if (!response.ok) console.error('Error en trade-pokemon:', response.status);
    } catch (error) {
        console.error('Error al intercambiar Pokémon:', error);
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



const approvePurchase = async (purchaseId) => {
    try {
        await fetch(`${SERVER_IP}/approve-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ purchaseId }),
        });
    } catch (error) {
        console.error('Error al aprobar compra:', error);
    }
};

const denyPurchase = async (purchaseId) => {
    try {
        await fetch(`${SERVER_IP}/deny-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ purchaseId }),
        });
    } catch (error) {
        console.error('Error al denegar compra:', error);
    }
};

const masterPurchase = async (playerId, item, price) => {
    try {
        await fetch(`${SERVER_IP}/master-purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, item, price }),
        });
    } catch (error) {
        console.error('Error al realizar compra master:', error);
    }
};

const increaseLevel = async (playerId, pokemonId, ctx = {}) => {
    try {
        const response = await fetch(`${SERVER_IP}/increase-level`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId, ...ctx }),
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

const changeState = async (playerId, pokemonId, ctx = {}) => {
    try {
        const response = await fetch(`${SERVER_IP}/change-state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId, ...ctx }),
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


const decreaseStatusCounter = async (playerId, pokemonId) => {
    try {
        await fetch(`${SERVER_IP}/decrease-status-counter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, pokemonId }),
        });
    } catch (error) {
        console.error('Error al bajar contador de status:', error);
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

const setFieldMove = async (slot, id, owner) => {
    try {
        const response = await fetch(`${SERVER_IP}/set-field-move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ slot, id, owner }),
        });
        if (!response.ok) console.error('Error al cambiar la carta de campo:', response.status);
    } catch (error) {
        console.error('Error al cambiar la carta de campo:', error);
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


// Adjunta un ataque al hueco de attack3. Lo usan tanto las MTs como los
// cristales Z, porque el mecanismo es el mismo y por diseño son excluyentes.
//
// `extra` es opcional y depende de la vía:
//   tmName, tmBase, tmBono → MT elegida del catálogo. `tmLevel` ya trae el bono
//     de tipo aplicado; `tmBase` es el poder impreso en la carta, que el
//     backend necesita para recalcular ese bono si el Pokémon evoluciona.
//   zData                  → cristal Z. Lleva el genérico y los especiales del
//     cristal, para poder re-resolver el movimiento tras evolucionar.
//   attachAs               → 'MT' (por defecto) o 'Z'; es lo que se guarda en
//     pokemon.attach.
// Sin nada de eso, el selector manual de tipo+poder se comporta como siempre.
const attachTM = async (playerId ,pokemonId,tmType,tmLevel, extra = {}) => {
    try {
        const response = await fetch(`${SERVER_IP}/attach-TM`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerId, pokemonId,tmType,tmLevel, ...extra}),
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

// ── Incursión Max ───────────────────────────────────────────────────────────
// El marcador acumulado de los cuatro combates vive en la partida (game.raid),
// no en la tablet: así lo ve el espejo del máster y sobrevive a un refresco.
// Aquí solo van los cinco avisos al servidor.
// Devuelve siempre el cuerpo parseado con un `ok` delante, también cuando el
// servidor rechaza: los errores de la incursión (Pokémon inexistente, dado
// fuera de rango) hay que poder enseñarlos en pantalla y no solo en la consola.
const raidPost = async (path, body) => {
    try {
        const response = await fetch(`${SERVER_IP}/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) console.error(`Error en ${path}:`, response.status, data?.message);
        return { ok: response.ok, ...data };
    } catch (error) {
        console.error(`Error en ${path}:`, error);
        return { ok: false, message: 'No se pudo contactar con el servidor' };
    }
};

const raidStart  = (playerId, pokedex) => raidPost('raid-start',  { playerId, pokedex });
const raidTeam   = (playerId, slots) => raidPost('raid-team',   { playerId, slots });
const raidRound  = (playerId, hostTotal, bossTotal) => raidPost('raid-round', { playerId, hostTotal, bossTotal });
const raidFinish = (playerId, die) => raidPost('raid-finish', { playerId, die });
const raidClear  = (playerId) => raidPost('raid-clear',  { playerId });

// ── Horda ───────────────────────────────────────────────────────────────────
// Mismo reparto que la incursión —el marcador vive en la partida— pero lo que
// se anota es quién ganó cada combate, no los totales. `raidPost` sirve igual:
// es un POST con `ok` delante, no tiene nada de incursión.
const hordeStart  = (playerId, pokedex) => raidPost('horde-start',  { playerId, pokedex });
const hordeTeam   = (playerId, slots) => raidPost('horde-team',   { playerId, slots });
const hordeRound  = (playerId, hostTotal, wildTotal) => raidPost('horde-round', { playerId, hostTotal, wildTotal });
const hordeFinish = (playerId, caught) => raidPost('horde-finish', { playerId, caught });
const hordeClear  = (playerId) => raidPost('horde-clear',  { playerId });

// ── Combate de entrenador ───────────────────────────────────────────────────
// Uno o dos rivales seguidos. El segundo lo pone el propio `-round` al cerrar el
// primero, así que desde aquí solo hacen falta tres avisos.
const trainerBattleStart = (playerId, pokedexes) => raidPost('trainer-battle-start', { playerId, pokedexes });
const trainerBattleRound = (playerId, hostTotal, rivalTotal) => raidPost('trainer-battle-round', { playerId, hostTotal, rivalTotal });
const trainerBattleClear = (playerId) => raidPost('trainer-battle-clear', { playerId });

// ── Reto de frontera ────────────────────────────────────────────────────────
// Un solo combate contra un salvaje del color de la frontera. El rival lo
// sortea el backend a partir de la frontera, así que desde aquí solo viaja su
// clave; las PokéMonedas del premio también las paga él al cerrar.
const frontierBattleStart  = (playerId, frontierKey) => raidPost('frontier-battle-start',  { playerId, frontierKey });
const frontierBattleFinish = (playerId, hostTotal, rivalTotal) => raidPost('frontier-battle-finish', { playerId, hostTotal, rivalTotal });
const frontierBattleClear  = (playerId) => raidPost('frontier-battle-clear',  { playerId });

// ── Poké Star Studios ───────────────────────────────────────────────────────
// Solo hace falta montar al Prop Pokémon con el nivel del Pokémon del jugador;
// el resto del evento lo lleva la tablet.
const pokeStarStart = (playerId, pokedex) => raidPost('poke-star-start', { playerId, pokedex });
// El Prop pelea al nivel del Pokémon que saque el jugador, y eso solo se sabe
// en la pantalla de selección: por eso el nivel va en un aviso aparte.
const pokeStarLevel = (playerId, level) => raidPost('poke-star-level', { playerId, level });
const pokeStarClear = (playerId) => raidPost('poke-star-clear', { playerId });

// Descuento de la tienda: lo pone el máster y dura una ronda (ver Game.js).
const setStoreDiscount = (percent) => raidPost('set-store-discount', { percent });

// Combate Mega: primero se consultan las megas de la especie (pueden ser dos) y
// después se monta la elegida como Pokémon salvaje del jugador.
const megaForms = async (pokedex) => {
    try {
        const response = await fetch(`${SERVER_IP}/mega-forms?pokedex=${encodeURIComponent(pokedex)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) console.error('Error en mega-forms:', response.status, data?.message);
        return { ok: response.ok, ...data };
    } catch (error) {
        console.error('Error en mega-forms:', error);
        return { ok: false, message: 'No se pudo contactar con el servidor' };
    }
};

const simMegaBattle = (playerId, megaPokedex) => raidPost('sim-mega-battle', { playerId, megaPokedex });

// Una mega al azar de entre las 94 del juego: es la vía principal del evento.
const randomMega = async () => {
    try {
        const response = await fetch(`${SERVER_IP}/random-mega`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) console.error('Error en random-mega:', response.status, data?.message);
        return { ok: response.ok, ...data };
    } catch (error) {
        console.error('Error en random-mega:', error);
        return { ok: false, message: 'No se pudo contactar con el servidor' };
    }
};

// Orbe Tera. No crea ataque como la MT ni forma nueva como la mega: solo marca
// el Pokémon con el tipo del orbe. Quien decide si sube teracristalizado es la
// pantalla de selección de combatientes, ya en la batalla.
const attachTera = async (playerId, pokemonId, teraType) => {
    try {
        const response = await fetch(`${SERVER_IP}/attach-tera`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, pokemonId, teraType }),
        });
        if (!response.ok) console.error('Error al adjuntar el Orbe Tera:', response.status);
    } catch (error) {
        console.error('Error al adjuntar el Orbe Tera:', error);
    }
};

// ── Bolsa y eventos ─────────────────────────────────────────────────────────
// La bolsa guarda lo que se gana en un evento y no se usa en el momento. La
// entrada la arma quien la mete (el front es quien conoce el catálogo de
// cartas); el backend solo la almacena, así que sirve igual para MTs, cristales
// Z u orbes cuando toque.
const bagAdd = async (playerId, entry) => {
    try {
        const response = await fetch(`${SERVER_IP}/bag-add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, entry }),
        });
        if (!response.ok) console.error('Error al guardar en la bolsa:', response.status);
    } catch (error) {
        console.error('Error al guardar en la bolsa:', error);
    }
};

const bagRemove = async (playerId, uid) => {
    try {
        const response = await fetch(`${SERVER_IP}/bag-remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, uid }),
        });
        if (!response.ok) console.error('Error al sacar de la bolsa:', response.status);
    } catch (error) {
        console.error('Error al sacar de la bolsa:', error);
    }
};

// Los eventos son una vez por turno. La marca se pone al abrir el evento, no al
// decidir, y el backend la borra sola cuando vuelve a empezar el turno.
const markEventUsed = async (playerId, eventId) => {
    try {
        const response = await fetch(`${SERVER_IP}/event-used`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, eventId }),
        });
        if (!response.ok) console.error('Error al marcar el evento:', response.status);
    } catch (error) {
        console.error('Error al marcar el evento:', error);
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

// `form` es opcional: solo lo mandan las pantallas que dejan subir
// teracristalizado o dinamaxizado, y lleva lo que esa forma cambia respecto a la
// ficha del equipo (tipos, ataques Max, las banderas del aura). Ver
// Game.applyBattleForm en el backend.
const onHandleBattlePokemon = async (player, idPokemon, form = null) => {
    try {
        console.log("onHandleBattlePokemon request");
        console.log("idPokemon: " + idPokemon);
        const response = await fetch(`${SERVER_IP}/set-my-battle-pokemon`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({player, idPokemon, form }),
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

// `extra` (item + cartas de campo + Orbe Tera) acompaña al total porque es una
// de sus columnas en el desglose: si viajaran por separado el espejo enseñaría
// una cuenta que no cuadra. La pantalla del máster no lo manda y cuenta 0.
const onHandleTotales = async (player,NewTotal,extra = 0) => {
    try {
        console.log("onHandleTotalesequest");
        const response = await fetch(`${SERVER_IP}/set-my-battle-total`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({player,NewTotal, extra }),
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

const simPlayerBattle = async (playerId, rivalPlayerId) => {
    try {
        const response = await fetch(`${SERVER_IP}/sim-player-battle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, rivalPlayerId }),
        });
        if (!response.ok) console.error('Error en sim-player-battle:', response.status);
    } catch (error) {
        console.error('Error en simPlayerBattle:', error);
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

const startSimMirror = async (playerId) => {
    try {
        const response = await fetch(`${SERVER_IP}/start-sim-mirror`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId }),
        });
        if (!response.ok) console.error('Error en start-sim-mirror:', response.status);
    } catch (error) {
        console.error('Error en startSimMirror:', error);
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

const onHandleDice = async (player, dice, rows) => {
    try {
        const response = await fetch(`${SERVER_IP}/set-battle-dice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player, dice, rows }),
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

// Qué pestaña del equipo mira el jugador en la selección de combatientes.
// Solo la usa el espejo del marcador, para enseñar lo mismo que su tablet.
const onSetFormsView = async (showForms) => {
    try {
        await fetch(`${SERVER_IP}/set-forms-view`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ showForms }),
        });
    } catch (error) {
        console.error('Error al cambiar la vista de formas:', error);
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
        } else {
            console.error('Error en la respuesta del servidor:', response.status);
        }
    } catch (error) {
        console.error('Error al asignar Fase de batalla:', error);
    }
};

const setGeneration = async (generation) => {
    try {
        const response = await fetch(`${SERVER_IP}/set-generation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ generation }),
        });
        if (!response.ok) console.error('Error al establecer generación:', response.status);
    } catch (error) {
        console.error('Error en setGeneration:', error);
    }
};










  
return (
    <Router>
        <Routes>
            <Route path="/" element={<Game onStartGame={startGame} isGameStarted={isGameStarted} onContinueGame={continueGame} onLoadGame={loadGame}/>} />
            <Route path="/selectGeneration" element={<SelectGeneration onSetGeneration={setGeneration} />} />
            <Route path="/menuPlayers" element={<MenuPlayers addPlayer={addPlayer} generation={game.generation} />} />
            <Route path="/game" element={<Player currentPlayerTurn={game.players[game.currentTurn]} currentPlayerView={game.players[game.currentView]} AllPlayers={game.players}onNextTurn={nextTurn} onPrevTurn={prevTurn} onNextView={nextView} onPrevView={prevView} onAddPokemon={addPokemonToPlayer} onEvolvePokemon={evolvePokemon} onDeletePokemon={removePokemonToPlayer} onUpdateCoins={updateCoins} increaseLevel={increaseLevel} badgeWon={badgeWon} badgeLost={badgeLost}
            onAttach={attachItem} game={game} onStartBattle={startBattle} onChangeState={changeState} onChangeStatus={changeStatus} onDecreaseStatusCounter={decreaseStatusCounter} wildBattle={wildBattle} playerBattle={playerBattle} LeaderBattle={LeaderBattle} attachTM={attachTM} attachMega={attachMega} attachTera={attachTera} toggleDynamax={toggleDynamax} onApprovePurchase={approvePurchase} onDenyPurchase={denyPurchase} onMasterPurchase={masterPurchase} onSetStoreDiscount={setStoreDiscount} onTradePokemon={tradePokemon} onPauseGame={pauseGame} onEndGame={endGame} onSetFieldMove={setFieldMove}/>} />
            <Route path="/home" element={<HomeMenu />} />
            <Route path="/players" element={<AllPlayers />} />
            {/* Marcador limpio para dejar fijo en otra pantalla. React Router
                no distingue mayúsculas, así que /Score entra por aquí igual. */}
            <Route path="/Table" element={<Score />} />
            <Route path="/battle" element={ <Stadium game={game} player={game.players[game.currentTurn]} rival={game.CurrentRival}  onHandleBattlePokemon={onHandleBattlePokemon} onHandleBattleAttack={onHandleBattleAttack} onHandleTotales={onHandleTotales} onChangeBattlePhase={onChangeBattlePhase} onToggleBattlePublic={toggleBattlePublic} onHandleDice={onHandleDice} onHandleBonuses={onHandleBonuses} onHandleBonusFinal={onHandleBonusFinal} increaseLevel={increaseLevel} changeState={changeState}/>} />
            <Route path="/pokedex/:playerId" element={<SimPlayer game={game} onSimWildBattle={simWildBattle} onSimLeaderBattle={simLeaderBattle} onSimPlayerBattle={simPlayerBattle} onChangeState={changeState} onIncreaseLevel={increaseLevel} onStartSimMirror={startSimMirror} onHandleBattlePokemon={onHandleBattlePokemon} onHandleBattleAttack={onHandleBattleAttack} onHandleTotales={onHandleTotales} onChangeBattlePhase={onChangeBattlePhase} onSetFormsView={onSetFormsView} onHandleDice={onHandleDice} onHandleBonuses={onHandleBonuses} onHandleBonusFinal={onHandleBonusFinal} onToggleBattlePublic={toggleBattlePublic} onEvolvePokemon={evolvePokemon} onNextTurn={nextTurn} onAddPokemon={addPokemonToPlayer} onRemovePokemon={removePokemonToPlayer} onAttach={attachItem} attachTM={attachTM} attachMega={attachMega} attachTera={attachTera} onRaidStart={raidStart} onRaidTeam={raidTeam} onRaidRound={raidRound} onRaidFinish={raidFinish} onRaidClear={raidClear} onHordeStart={hordeStart} onHordeTeam={hordeTeam} onHordeRound={hordeRound} onHordeFinish={hordeFinish} onHordeClear={hordeClear} onTrainerStart={trainerBattleStart} onTrainerRound={trainerBattleRound} onTrainerClear={trainerBattleClear} onFrontierStart={frontierBattleStart} onFrontierFinish={frontierBattleFinish} onFrontierClear={frontierBattleClear} onPokeStarStart={pokeStarStart} onPokeStarLevel={pokeStarLevel} onPokeStarClear={pokeStarClear} onMegaForms={megaForms} onRandomMega={randomMega} onSimMegaBattle={simMegaBattle} onBagAdd={bagAdd} onBagRemove={bagRemove} onMarkEventUsed={markEventUsed} onSetFieldMove={setFieldMove}/>} />
            <Route path="/progress" element={<ProgressChart />} />

        </Routes>
    </Router>
);
                }

export default App;
