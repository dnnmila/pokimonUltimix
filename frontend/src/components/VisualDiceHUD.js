import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import SERVER_IP from '../config.js';
import '../styles/_visualDiceHUD.scss';

const PLAYER_COLORS = ['#e74c3c','#3498db','#27ae60','#f39c12','#9b59b6','#1abc9c','#e67e22','#e91e63'];

const getDiceImg = (n) => {
    try { return require(`../images/dices/dice${n}.png`); } catch { return null; }
};

const VisualDiceHUD = ({ allPlayers, myPlayerId, currentTurnIdx }) => {
    const [diceValues, setDiceValues] = useState({});
    const [rolling,    setRolling]    = useState({});
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = io(SERVER_IP);
        socketRef.current = socket;

        socket.on('visual-dice-updated', ({ playerId, value }) => {
            setDiceValues(prev => ({ ...prev, [playerId]: value }));
            setRolling(prev => ({ ...prev, [playerId]: false }));
        });

        return () => { socket.disconnect(); };
    }, []);

    const handleRoll = () => {
        const value = Math.floor(Math.random() * 6) + 1;
        setRolling(prev => ({ ...prev, [myPlayerId]: true }));
        socketRef.current?.emit('roll-visual-dice', { playerId: myPlayerId, value });
    };

    if (!allPlayers?.length) return null;

    return (
        <div className="vdh-tray">
            {allPlayers.map((p, i) => {
                const isMe         = p.id === myPlayerId;
                const isMyTurn     = i === currentTurnIdx;
                const val          = diceValues[p.id];
                const isRolling    = rolling[p.id];
                const color        = PLAYER_COLORS[i % PLAYER_COLORS.length];
                const diceImg      = val ? getDiceImg(val) : null;

                return (
                    <div
                        key={p.id}
                        className={[
                            'vdh-card',
                            isMe     ? 'vdh-card--me'   : '',
                            isMyTurn ? 'vdh-card--turn'  : '',
                        ].join(' ')}
                        style={{ '--pc': color }}
                    >
                        {isMyTurn && <div className="vdh-turn-tag">▶ Turno</div>}
                        <div className="vdh-name">{p.name}</div>
                        <div className="vdh-dice-area">
                            {isRolling ? (
                                <div className="vdh-spinning">🎲</div>
                            ) : diceImg ? (
                                <img src={diceImg} alt={String(val)} className="vdh-dice-img" />
                            ) : (
                                <div className="vdh-empty">?</div>
                            )}
                        </div>
                        {isMe && (
                            <button className="vdh-roll-btn" onClick={handleRoll}>Tirar</button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default VisualDiceHUD;
