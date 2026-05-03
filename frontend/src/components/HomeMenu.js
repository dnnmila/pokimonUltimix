import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import SERVER_IP from '../config';

import iconPlayers  from '../images/pokeRecords.png';
import iconControl  from '../images/newHome.png';
import iconBattle   from '../images/pokeStadium.png';
import iconPokedex  from '../images/pokedex.png';

const HomeMenu = () => {
    const navigate = useNavigate();
    const [players, setPlayers] = useState([]);

    useEffect(() => {
        const socket = io(SERVER_IP);
        socket.on('gameUpdated', game => setPlayers(game.players || []));
        return () => { socket.off('gameUpdated'); socket.disconnect(); };
    }, []);

    const playersOrdered = [...players].sort((a, b) => a.position - b.position);

    return (
        <div className="home-menu">
            <div className="home-menu-title">Pokemon Ultimix</div>

            <div className="home-menu-section">
                <div className="home-menu-card" onClick={() => navigate('/players')}>
                    <div className="home-menu-card-icon" style={{ backgroundImage: `url(${iconPlayers})` }} />
                    <span>Jugadores</span>
                </div>
                <div className="home-menu-card" onClick={() => navigate('/game')}>
                    <div className="home-menu-card-icon" style={{ backgroundImage: `url(${iconControl})` }} />
                    <span>Control</span>
                </div>
                <div className="home-menu-card" onClick={() => navigate('/battle')}>
                    <div className="home-menu-card-icon" style={{ backgroundImage: `url(${iconBattle})` }} />
                    <span>Batalla</span>
                </div>
            </div>

            {playersOrdered.length > 0 && (
                <>
                    <div className="home-menu-section-label">SimPlayer</div>
                    <div className="home-menu-section">
                        {playersOrdered.map(p => (
                            <div
                                key={p.id}
                                className="home-menu-card home-menu-card--player"
                                onClick={() => navigate(`/pokedex/${p.id}`)}
                            >
                                <div className="home-menu-card-icon" style={{ backgroundImage: `url(${iconPokedex})` }} />
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HomeMenu;
