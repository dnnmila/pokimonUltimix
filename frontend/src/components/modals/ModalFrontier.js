import React from 'react';

const FRONTIERS = [
    {
        key: 'frontierPink',
        label: 'Rosa',
        color: '#f472b6',
        description: 'Si tu Pokémon ganó un nivel en la batalla, gana un nivel adicional.',
    },
    {
        key: 'frontierGreen',
        label: 'Verde',
        color: '#4ade80',
        description: 'Roba una carta de objeto.',
    },
    {
        key: 'frontierBlue',
        label: 'Azul',
        color: '#60a5fa',
        description: 'Roba 2 cartas de objeto y coloca 1 al fondo del mazo.',
    },
    {
        key: 'frontierYellow',
        label: 'Amarilla',
        color: '#facc15',
        description: 'Roba 3 tokens de Pokémon amarillos. Puedes intentar un tiro de captura en uno de tu elección con un bono de +2.',
    },
    {
        key: 'frontierRed',
        label: 'Roja',
        color: '#f87171',
        description: 'Roba 3 cartas de objeto. Quédate 1 y coloca 2 al fondo del mazo. Puedes otorgar un nivel a cualquier Pokémon de nivel 4 o menor.',
    },
    {
        key: 'frontierGolden',
        label: 'Legendaria',
        color: '#c084fc',
        description: 'Toma un objeto a tu elección del mazo de objetos o del descarte. Puedes otorgar un nivel a cualquier Pokémon de nivel 4 o menor.',
    },
];

const ModalFrontier = ({ show, onClose, player, onToggle }) => {
    if (!show || !player) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="frontier-modal" onClick={e => e.stopPropagation()}>
                <button className="trade-modal-close" onClick={onClose}>✕</button>
                <div className="frontier-modal-title">Battle Frontier</div>
                <div className="frontier-modal-subtitle">{player.name}</div>

                <div className="frontier-cards">
                    {FRONTIERS.map(({ key, label, color, description }) => {
                        const used = player[key];
                        return (
                            <div
                                key={key}
                                className={`frontier-card ${used ? 'frontier-card--used' : ''}`}
                                style={{ '--fc': color }}
                            >
                                <div className="frontier-card-header">
                                    <span className="frontier-card-dot" />
                                    <span className="frontier-card-name">{label}</span>
                                    {used && <span className="frontier-card-badge">Usada</span>}
                                </div>
                                <p className="frontier-card-desc">{description}</p>
                                <button
                                    className={`frontier-toggle-btn ${used ? 'frontier-toggle-btn--used' : ''}`}
                                    onClick={() => onToggle(key)}
                                >
                                    {used ? '↩ Marcar disponible' : '✓ Marcar usada'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ModalFrontier;
