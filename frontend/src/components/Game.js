import React from 'react';
import { useNavigate } from 'react-router-dom';

const Game = ({ onStartGame, onLoadGame }) => {
    const navigate = useNavigate();

    const handleStartGame = async () => {
        await onStartGame();
        navigate('/menuPlayers');
    };

    const handleLoadGame = async () => {
        await onLoadGame();
        navigate('/game');
    };

    return (
        <div className='game-background'>
            <button onClick={handleStartGame}>Start Game</button>
            <button onClick={handleLoadGame}>Cargar Partida</button>
        </div>
    );
};

export default Game;
