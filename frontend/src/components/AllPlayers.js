import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import PlayerListed from './PlayerListed';
import StadiumMirrorModal from './StadiumMirrorModal';

import SERVER_IP from '../config';

const AllPlayers = () => {
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

    const totalPLayers = players.length;

    let playersOrdered = [...players].sort((a, b) => a.position - b.position);
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
            <div className='round-badge'>Ronda {game.round}</div>
            {playersOrdered.map(player => (
                <PlayerListed key={player.id} player={player} totalPLayers={totalPLayers}/>
            ))}
            <StadiumMirrorModal game={game} />
        </div>
    );
};

export default AllPlayers;
