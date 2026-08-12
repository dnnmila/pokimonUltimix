import React, { useState, useRef, useEffect } from 'react';
import POKEMON_TYPES from '../../pokemonTypes';
import SERVER_IP from '../../config.js';

// Los mismos 6 colores que usan los nodos de captura del tablero
const TOKEN_COLORS = [
    { id: 'pink',   label: 'Rosa',     hex: '#e91e63' },
    { id: 'green',  label: 'Verde',    hex: '#27ae60' },
    { id: 'yellow', label: 'Amarillo', hex: '#f1c40f' },
    { id: 'blue',   label: 'Azul',     hex: '#3498db' },
    { id: 'red',    label: 'Rojo',     hex: '#e74c3c' },
    { id: 'purple', label: 'Morado',   hex: '#9b59b6' },
];

const getTokenImg = (pokedex) => {
    try { return require(`../../images/tokens_ultimix/${pokedex}.png`); } catch {
        try { return require(`../../images/POKEMON/${pokedex}.png`); } catch { return null; }
    }
};

const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)];

const ModalSpecialAttacks = ({ show, onClose }) => {
    const [tab, setTab] = useState('dice');

    // Dado de tipos
    const [rolledType, setRolledType] = useState(null);
    const [rollingType, setRollingType] = useState(false);

    // Metronomo
    const [metroColor, setMetroColor] = useState(null);
    const [metroPkm, setMetroPkm] = useState(null);
    const [metroLoading, setMetroLoading] = useState(false);
    const [metroError, setMetroError] = useState(null);
    const [zoomed, setZoomed] = useState(false);

    const spinRef = useRef(null);

    // El intervalo de la animacion debe morir si el modal se cierra a media tirada
    useEffect(() => {
        return () => { if (spinRef.current) clearInterval(spinRef.current); };
    }, []);

    if (!show) return null;

    const handleRollType = () => {
        if (rollingType) return;
        setRollingType(true);
        spinRef.current = setInterval(() => setRolledType(randomOf(POKEMON_TYPES)), 70);
        setTimeout(() => {
            clearInterval(spinRef.current);
            spinRef.current = null;
            setRolledType(randomOf(POKEMON_TYPES));
            setRollingType(false);
        }, 800);
    };

    const handleMetronome = async () => {
        if (metroLoading) return;
        setMetroLoading(true);
        setMetroError(null);
        setMetroPkm(null);
        setZoomed(false);
        try {
            const url = metroColor
                ? `${SERVER_IP}/random-pokemon?color=${metroColor}`
                : `${SERVER_IP}/random-pokemon`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Sin resultados para ese color');
            setMetroPkm(await res.json());
        } catch (e) {
            setMetroError(e.message);
        } finally {
            setMetroLoading(false);
        }
    };

    const handleClose = () => {
        if (spinRef.current) { clearInterval(spinRef.current); spinRef.current = null; }
        setRollingType(false);
        setZoomed(false);
        onClose();
    };

    const metroImg = metroPkm ? getTokenImg(metroPkm.pokedex) : null;
    const metroHex = metroPkm ? TOKEN_COLORS.find(c => c.id === metroPkm.tokenColor)?.hex : null;

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="special-attacks-modal" onClick={e => e.stopPropagation()}>
                <div className="sa-title">
                    Ataques especiales
                    <button className="sa-close" onClick={handleClose}>✕</button>
                </div>

                <div className="sa-tabs">
                    <button className={`sa-tab${tab === 'dice' ? ' sa-tab-active' : ''}`}
                            onClick={() => setTab('dice')}>Dado de tipos</button>
                    <button className={`sa-tab${tab === 'metro' ? ' sa-tab-active' : ''}`}
                            onClick={() => setTab('metro')}>Metrónomo</button>
                </div>

                {tab === 'dice' && (
                    <div className="sa-panel">
                        <div className="sa-result-box">
                            {rolledType ? (
                                <>
                                    <div className={`sa-type-icon Attack_${rolledType}`}></div>
                                    <div className={`sa-type-name${rollingType ? ' sa-spinning' : ''}`}>
                                        {rolledType}
                                    </div>
                                </>
                            ) : (
                                <div className="sa-placeholder">Tira el dado para obtener un tipo</div>
                            )}
                        </div>
                        <button className="sa-roll-btn" onClick={handleRollType} disabled={rollingType}>
                            {rollingType ? 'Tirando…' : rolledType ? 'Tirar otra vez' : 'Tirar dado'}
                        </button>
                    </div>
                )}

                {tab === 'metro' && (
                    <div className="sa-panel">
                        <div className="sa-color-label">Color del token</div>
                        <div className="sa-colors">
                            <div className={`sa-color sa-color-any${metroColor === null ? ' sa-color-selected' : ''}`}
                                 onClick={() => setMetroColor(null)}
                                 title="Cualquier color">★</div>
                            {TOKEN_COLORS.map(c => (
                                <div key={c.id}
                                     className={`sa-color${metroColor === c.id ? ' sa-color-selected' : ''}`}
                                     style={{ backgroundColor: c.hex }}
                                     onClick={() => setMetroColor(c.id)}
                                     title={c.label}></div>
                            ))}
                        </div>

                        <div className="sa-result-box sa-result-box--metro">
                            {metroLoading && <div className="sa-placeholder">Buscando…</div>}
                            {!metroLoading && metroError && <div className="sa-error">{metroError}</div>}
                            {!metroLoading && !metroError && !metroPkm && (
                                <div className="sa-placeholder">Usa el metrónomo para obtener un Pokémon</div>
                            )}
                            {!metroLoading && metroPkm && (
                                <>
                                    <div className="sa-token-wrap"
                                         onClick={() => metroImg && setZoomed(true)}
                                         title={metroImg ? 'Ampliar' : undefined}
                                         style={metroHex ? { borderColor: metroHex, boxShadow: `0 0 18px ${metroHex}66` } : {}}>
                                        {metroImg
                                            ? <img className="sa-token-img" src={metroImg} alt={metroPkm.name} />
                                            : <div className="sa-token-missing">{metroPkm.pokedex}</div>}
                                    </div>
                                    <div className="sa-pkm-info">
                                        <div className="sa-pkm-name">{metroPkm.name}</div>
                                        <div className="sa-pkm-types">
                                            <div className={`sa-type-mini Attack_${metroPkm.type1}`}></div>
                                            {metroPkm.type2 && metroPkm.type2 !== 'NONE' && (
                                                <div className={`sa-type-mini Attack_${metroPkm.type2}`}></div>
                                            )}
                                        </div>
                                        <div className="sa-pkm-meta">#{metroPkm.pokedex} · Lv.{metroPkm.level}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button className="sa-roll-btn" onClick={handleMetronome} disabled={metroLoading}>
                            {metroLoading ? 'Buscando…' : metroPkm ? 'Otro Pokémon' : 'Usar metrónomo'}
                        </button>
                    </div>
                )}

                {zoomed && metroImg && (
                    <div className="sa-zoom-overlay" onClick={() => setZoomed(false)}>
                        <img className="sa-zoom-img" src={metroImg} alt={metroPkm.name} />
                        <div className="sa-zoom-hint">{metroPkm.name} — toca para cerrar</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalSpecialAttacks;
