import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';



const Game = ({ onStartGame, isGameStarted }) => {
    console.log(isGameStarted);
    const navigate = useNavigate();

    useEffect(() => {
        if (isGameStarted) {
            navigate("/menuPlayers"); // Redirige a la ruta del jugador
        }
    }, [isGameStarted, navigate]);

   
    return (
        <div className='game-background'>
            <button onClick={onStartGame}>Start Game</button>

       
            {/* Resto del componente */}
        </div>
    );
};

export default Game;
