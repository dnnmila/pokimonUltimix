import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PlayerListed from './PlayerListed';
import StadiumMirrorModal from './StadiumMirrorModal';
import EventMirrorModal from './EventMirrorModal';
import ModalVictory from './modals/ModalVictory';

import SERVER_IP from '../config';
import { STORE_ITEMS } from './modals/storeItems';

// El catálogo vivo sale del mismo sitio que las dos tiendas (máster y
// SimPlayer), así los iconos del aviso de compra no se separan de los precios.
// Los nombres de abajo ya no se venden: siguen aquí para que el historial de
// partidas viejas no se quede sin icono.
const ITEM_IMG_CLASS = {
    ...Object.fromEntries(STORE_ITEMS.map(({ name, img }) => [name, img])),
    'X Attack(1)': 'img-XAttk',
    'X Attack(2)': 'img-XAttk',
    'X Attack(3)': 'img-XAttk',
    'X Defense': 'img-XDef',
    'X Accuracy': 'img-XAcc',
    'Guard Spec.': 'img-GuardSpec',
    'TM': 'img-TM',
    'Dynamax': 'img-Dynamax',
};

// showOverlays = false deja la tabla limpia: fuera el espejo de la batalla, el
// aviso de compra en la tienda y el modal de victoria, o sea todo lo que tapa el
// marcador. Es lo que usa la ruta /score (ver Score.js). El aviso de pausa se
// queda: es una franja fina arriba y explica por qué se paró el reloj.
const AllPlayers = ({ showOverlays = true }) => {
    const [game, setGame] = useState({ players: [], currentTurn: 0, battlePublic: false, myPlayerPkm: [], myRivalPkm: [], myPlayerPkmAtk: [], myRivalPkmAtk: [], myPlayerTotal: 0, myRivalTotal: 0, battlePhase: 'PokemonSelection' });
    const [players, setPlayers] = useState([]);
    const [myPlayerPkm, setMyPlayerPkm] = useState([]);
    const [myPlayerPkmAtk, setMyPlayerPkmAtk] = useState([]);
    const [myRivalPkm, setMyRivalPkm] = useState([]);
    const [myRivalPkmAtk, setMyRivalPkmAtk] = useState([]);
    const [myPlayerTotal, setMyPlayerTotal] = useState(0);
    const [myRivalTotal, setMyRivalTotal] = useState(0);
    const [battlePhase, setBattlePhase] = useState('PokemonSelection');
    const [battleOn, setBattleOn] = useState('False');
    const [saleNotification, setSaleNotification] = useState(null);
    const purchaseHistoryLenRef = useRef(0);
    const saleTimerRef = useRef(null);

    const [turnElapsed, setTurnElapsed] = useState(0);

    let playersOrdered = [...players].sort((a, b) => a.position - b.position);

    useEffect(() => {
        const interval = setInterval(() => {
            const current = players.find(p => p.isMyTurn);
            if (current?.turnStartTime) {
                // Pausado el reloj se congela en `pausedAt`; si el turno cambió
                // durante la pausa el contador arranca en 0, nunca en negativo.
                const ref = game.pausedAt || Date.now();
                setTurnElapsed(Math.max(0, Math.floor((ref - current.turnStartTime) / 1000)));
            } else {
                setTurnElapsed(0);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [players, game.paused, game.pausedAt]);

    useEffect(() => {
        const socket = io(SERVER_IP);

        socket.on('gameUpdated', updatedGame => {
            setGame(updatedGame);
            setPlayers(updatedGame.players);
            setMyPlayerPkm(updatedGame.myPlayerPkm);
            setMyPlayerPkmAtk(updatedGame.myPlayerPkmAtk);
            setMyRivalPkm(updatedGame.myRivalPkm);
            setMyRivalPkmAtk(updatedGame.myRivalPkmAtk);
            setMyPlayerTotal(updatedGame.myPlayerTotal);
            setMyRivalTotal(updatedGame.myRivalTotal);
            setBattlePhase(updatedGame.battlePhase);
            setBattleOn(updatedGame.battleOn);

            const history = updatedGame.purchaseHistory || [];
            if (history.length > purchaseHistoryLenRef.current) {
                const latest = history[history.length - 1];
                if (saleTimerRef.current) clearTimeout(saleTimerRef.current);
                setSaleNotification({ playerName: latest.playerName, item: latest.item });
                saleTimerRef.current = setTimeout(() => setSaleNotification(null), 3000);
            }
            purchaseHistoryLenRef.current = history.length;
        });

        console.log('Socket conectado en AllPlayers');

        // No olvides limpiar al desmontar el componente
        return () => {
            socket.off('gameUpdated');
            socket.disconnect();
        };
    }, []);

    // Registrar los valores de estado en un efecto separado con dependencias
    // para evitar la advertencia react-hooks/exhaustive-deps cuando se usan
    // variables de estado dentro de console.log.
    useEffect(() => {
        console.log('My Player Pkm en AllPlayers:', myPlayerPkm);
        console.log('My Player Pkm Atk en AllPlayers:', myPlayerPkmAtk);
        console.log('My Rival Pkm en AllPlayers:', myRivalPkm);
        console.log('My Rival Pkm Atk en AllPlayers:', myRivalPkmAtk);
        console.log('My Player Total en AllPlayers:', myPlayerTotal);
        console.log('My Rival Total en AllPlayers:', myRivalTotal);
        console.log('Battle Phase en AllPlayers:', battlePhase);
        console.log('Battle On en AllPlayers:', battleOn);
    }, [myPlayerPkm, myPlayerPkmAtk, myRivalPkm, myRivalPkmAtk, myPlayerTotal, myRivalTotal, battlePhase, battleOn]);

    return (
        <div className='AllPlayers_class'>
            <header className="apl-topbar">
                <h1 className="apl-topbar-title">Tabla de totales</h1>
                <div className="apl-topbar-round">Ronda <b>{game.round}</b></div>
            </header>

            <div className="apl-colheads">
                <span>Entrenador y medallas</span>
                <span>Equipo</span>
                <span>Totales</span>
            </div>

            {showOverlays && game.ended && (
                <ModalVictory player={game.players.find(p => p.id === game.winner)} />
            )}
            {!game.ended && game.paused && (
                <div className="allplayers-paused-banner">⏸ JUEGO PAUSADO</div>
            )}
            {showOverlays && saleNotification && (
                <div className="sale-notification">
                    <div className={`sale-notification-img ${ITEM_IMG_CLASS[saleNotification.item] || ''}`}></div>
                    <div className="sale-notification-text">
                        SALE UN <span className="sale-notification-item">{saleNotification.item}</span> CON TODO
                    </div>
                    <div className="sale-notification-player">{saleNotification.playerName}</div>
                </div>
            )}
            {/* Las filas se reparten el alto sobrante: ya no hace falta calcular
                vh por jugador como antes */}
            <div className="apl-rows">
                {playersOrdered.map(player => (
                    <PlayerListed key={player.id} player={player} generation={game.generation} turnElapsed={player.isMyTurn ? turnElapsed : 0}/>
                ))}
            </div>
            {showOverlays && <StadiumMirrorModal game={game} />}
            {/* El montaje del evento, antes de que haya combate. Se retira solo
                en cuanto arranca la batalla y toma el relevo el espejo de
                arriba, así que los dos nunca se pisan. */}
            {showOverlays && <EventMirrorModal game={game} />}
        </div>
    );
};

export default AllPlayers;
