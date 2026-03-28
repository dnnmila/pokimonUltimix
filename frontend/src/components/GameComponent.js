import React, { useState } from 'react';

const GameComponent = () => {
    const [game, setGame] = useState(null);

    const createGame = async () => {
        try {
            const response = await fetch('http://localhost:3001/game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Asegúrate de enviar los datos necesarios para crear el juego
            });
            const data = await response.json();
            setGame(data); // Suponiendo que la respuesta incluye la información del juego
        } catch (error) {
            console.error('Hubo un error al crear el juego:', error);
        }
    };

    return (
        <div>
            <button onClick={createGame}>Iniciar Juego</button>
            {game && Array.isArray(game.players) && (
                <div>
                    <h2>Jugadores:</h2>
                    <ul>
                        {game.players.map(player => (
                            <li key={player.id}>{player.name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GameComponent;
