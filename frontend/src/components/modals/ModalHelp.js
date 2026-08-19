import React from 'react';
import { SIM_EVENTS } from '../../data/simEvents';
import { RULES_CARDS } from '../../data/rulesCards';

// Concentrador de ayuda: todo lo que se consulta, en un solo sitio.
//
// Antes cada guía tenía su botón en la barra del setup (Guía, Efectos, MTs) y la
// fila se estaba llenando. Aquí dentro caben las cuatro y la barra recupera
// espacio para lo que se USA, que es distinto de lo que se CONSULTA.
//
// No abre nada por su cuenta: devuelve qué se ha pedido por `onOpen` y quien
// tiene los modales es SimPlayer. El concentrador se queda abierto por debajo,
// así que al cerrar lo que sea se vuelve aquí en vez de a la pantalla pelada.

const SECTIONS = [
    { id: 'leaders', title: 'Guía de líderes', desc: 'Equipos y medallas de cada gimnasio.', icon: 'sim-topbar-book' },
    { id: 'effects', title: 'Guía de efectos', desc: 'Qué hace cada símbolo de las cartas de ataque.', icon: 'sim-topbar-effects' },
    { id: 'tms',     title: 'Catálogo de MTs', desc: 'Las 291 cartas, por tipo y por nombre.',        icon: 'sim-topbar-tms' },
];

const ModalHelp = ({ show, onClose, onOpen }) => {
    if (!show) return null;

    // Solo los eventos que tienen hoja de reglas dada de alta
    const eventGuides = SIM_EVENTS
        .filter(ev => ev.rules && RULES_CARDS.some(c => c.id === ev.rules));

    return (
        <div className="modal-backdrop help-backdrop" onClick={onClose}>
            <div className="help-modal" onClick={e => e.stopPropagation()}>

                <button className="help-close" onClick={onClose}>✕</button>

                <div className="help-header">
                    <div className="help-title">Ayuda</div>
                    <div className="help-sub">Todo lo que se consulta, en un sitio</div>
                </div>

                <div className="help-grid">
                    {SECTIONS.map(sec => (
                        <div key={sec.id} className="help-card" onClick={() => onOpen(sec.id)}>
                            <div className={`help-card-icon ${sec.icon}`} />
                            <div className="help-card-text">
                                <div className="help-card-title">{sec.title}</div>
                                <div className="help-card-desc">{sec.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="help-events">
                    <div className="help-events-title">
                        <span>Guía de eventos</span>
                        <i />
                    </div>

                    {eventGuides.length === 0 ? (
                        <div className="help-events-empty">
                            Todavía no hay hojas de reglas de eventos.
                        </div>
                    ) : (
                        <div className="help-events-row">
                            {eventGuides.map(ev => (
                                <div key={ev.id}
                                     className="help-event"
                                     style={{ '--event-accent': ev.accent }}
                                     onClick={() => onOpen(ev.rules)}>
                                    {ev.img && <img src={ev.img} alt={ev.title} />}
                                    <span>{ev.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalHelp;
