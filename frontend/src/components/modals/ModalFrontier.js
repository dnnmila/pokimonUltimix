import React from 'react';
import { FRONTIERS, FRONTIER_COINS } from '../../data/frontiers';
import { tokenColorLabel } from '../../data/tokenColors';

// Battle Frontier: las seis fronteras del tablero.
//
// Cada tarjeta es un reto: al lanzarlo sale un Pokémon salvaje del color de
// token de esa frontera y se pelea en la pantalla de siempre. La casilla se
// gasta AL LANZAR, no al ganar — de ahí el aviso del botón—, y ganando se
// cobran las PokéMonedas del premio más la recompensa impresa en la carta.
//
// `onToggle` se queda como marcha atrás manual: si el reto se lanzó por error o
// el máster corrige una partida, hace falta poder devolver la casilla.

const ModalFrontier = ({ show, onClose, player, onToggle, onChallenge, busy = false, error = null }) => {
    if (!show || !player) return null;

    const conquered = FRONTIERS.filter(f => player[f.key]).length;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="frontier-modal" onClick={e => e.stopPropagation()}>
                <button className="trade-modal-close" onClick={onClose}>✕</button>
                <div className="frontier-modal-title">Battle Frontier</div>
                <div className="frontier-modal-subtitle">
                    {player.name} · {conquered} de {FRONTIERS.length} retadas
                </div>

                <div className="frontier-modal-note">
                    Retar una frontera saca un Pokémon salvaje de su color. Ganando el
                    combate te llevas <b>{FRONTIER_COINS} PokéMonedas</b> más la recompensa
                    de la frontera. La casilla se gasta al lanzar el reto, ganes o pierdas.
                </div>

                {error && <div className="frontier-modal-error">{error}</div>}

                <div className="frontier-cards">
                    {FRONTIERS.map(({ key, label, color, tokenColor, reward }) => {
                        const used = player[key];
                        return (
                            <div
                                key={key}
                                className={`frontier-card ${used ? 'frontier-card--used' : ''}`}
                                style={{ '--fc': color }}
                            >
                                <div className="frontier-card-header">
                                    <span className="frontier-card-dot" />
                                    <span className="frontier-card-name">Frontera {label}</span>
                                    {used && <span className="frontier-card-badge">Usada</span>}
                                </div>

                                <div className="frontier-card-rival">
                                    Rival: token {tokenColorLabel(tokenColor)?.toLowerCase()} al azar
                                </div>

                                <p className="frontier-card-desc">{reward}</p>

                                <div className="frontier-card-actions">
                                    {!used && (
                                        <button
                                            className="frontier-fight-btn"
                                            disabled={busy}
                                            onClick={() => onChallenge(key)}
                                        >
                                            {busy ? 'Sorteando…' : '⚔ Retar la frontera'}
                                        </button>
                                    )}
                                    <button
                                        className={`frontier-toggle-btn ${used ? 'frontier-toggle-btn--used' : ''}`}
                                        onClick={() => onToggle(key)}
                                    >
                                        {used ? '↩ Marcar disponible' : 'Marcar usada'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ModalFrontier;
