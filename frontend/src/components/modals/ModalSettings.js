import React from 'react';
import { SIM_THEMES, getThemeMascot } from '../../data/simThemes';

// Ajustes del jugador. De momento solo el tema de color, pero la rejilla de
// secciones está pensada para que quepan más opciones sin rehacer el modal.
//
// El cambio se aplica al tocar, sin botón de guardar: la clase del tema vive en
// .sim-player, que envuelve también a este modal, así que la vista previa es el
// propio modal cambiando de color debajo del dedo.
const ModalSettings = ({ show, theme, onSelectTheme, onClose }) => {
    if (!show) return null;

    return (
        <div className="modal-backdrop sim-settings-backdrop" onClick={onClose}>
            <div className="sim-settings-modal" onClick={e => e.stopPropagation()}>
                <div className="sim-settings-title">
                    Ajustes
                    <button className="sim-settings-close" onClick={onClose}>✕</button>
                </div>

                <div className="sim-settings-section">
                    <div className="sim-settings-section-title">
                        <span>Tema de color</span>
                        <i />
                    </div>
                    <div className="sim-settings-note">
                        Cambia solo la paleta: la distribución de la pantalla, y los
                        colores que significan algo en partida (vida, KO, evolución),
                        se quedan como están.
                    </div>

                    <div className="sim-settings-themes">
                        {SIM_THEMES.map(t => {
                            // Los temas sin mascota enseñan solo la tira de color
                            const mascot = getThemeMascot(t.id);
                            return (
                            <button
                                key={t.id}
                                type="button"
                                className={`sim-theme-card ${t.id === theme ? 'sim-theme-card--on' : ''}`}
                                onClick={() => onSelectTheme(t.id)}>
                                <div className="sim-theme-card-swatch">
                                    {t.swatch.map((c, i) => (
                                        <span key={i} style={{ backgroundColor: c }} />
                                    ))}
                                    {/* El render quieto: en una tira de 2.6rem el
                                        sprite animado no se leería */}
                                    {mascot && (
                                        <img className="sim-theme-card-mascot" src={mascot.still} alt="" />
                                    )}
                                </div>
                                <div className="sim-theme-card-name">{t.name}</div>
                                <div className="sim-theme-card-sub">{t.subtitle}</div>
                                <div className="sim-theme-card-check">✓</div>
                            </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalSettings;
