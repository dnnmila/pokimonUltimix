import React from 'react';
import { SIM_EVENTS } from '../../data/simEvents';
import { TMS_BY_ID } from '../../data/tms';
import { Z_BY_ID } from '../../data/zmoves';
import { TERA_BY_ID } from '../../data/teraTypes';
import { typeColor, typeLabel } from '../../pokemonTypes';
import imgTM from '../../images/tm.png';
import imgZ from '../../images/Cristal_Z.png';
import imgTeraOrb from '../../images/store/chart/TeraOrb.png';

// Menú de eventos del SimPlayer.
//
// Solo elige: cada tarjeta devuelve su `id` por `onPick` y quien decide qué
// pasa es SimPlayer. Así los eventos se pueden ir programando de uno en uno sin
// tocar este archivo, y el que aún no tiene lógica se marca con `disabled`.
//
// Debajo va la bolsa: lo que se ganó en un evento y se guardó sin usar. Vive
// aquí, y no en un botón aparte, porque se llena desde los eventos y es donde
// el jugador va a buscarlo.

// La bolsa guarda solo el id de la carta; la ficha se resuelve al pintar.
//
// El cristal enseña su movimiento genérico: cuál le tocaría de verdad depende
// del Pokémon, y aquí todavía no hay Pokémon elegido.
const resolveBagItem = (item) => {
    if (item.kind === 'tm') {
        const tm = TMS_BY_ID[item.cardId];
        if (!tm) return null;
        return {
            title: tm.nombre,
            note: `${tm.tm} · Poder ${tm.poder > 0 ? tm.poder : '—'}`,
            tipo: tm.tipo,
            img: tm.thumb || tm.img || imgTM,
        };
    }
    if (item.kind === 'z') {
        const z = Z_BY_ID[item.cardId];
        if (!z) return null;
        return {
            title: z.cristal,
            note: `${z.generico} · Poder ${z.poder}`,
            tipo: z.tipo,
            img: z.thumb || z.img || imgZ,
        };
    }
    if (item.kind === 'tera') {
        const orb = TERA_BY_ID[item.cardId];
        if (!orb) return null;
        return {
            title: `Orbe ${typeLabel(orb.tipo)}`,
            note: orb.id === 'STELLAR' ? 'sin ventajas ni debilidades' : 'un solo tipo en batalla',
            tipo: orb.tipo,
            img: orb.thumb || orb.img || imgTeraOrb,
        };
    }
    return null;
};

const ModalEvents = ({ show, onClose, onPick, disabled = [], usedEvents = [], bag = [], onUseBagItem, onOpenRules }) => {
    if (!show) return null;

    const handlePick = (ev) => {
        if (disabled.includes(ev.id) || usedEvents.includes(ev.id)) return;
        onPick(ev.id);
    };

    return (
        <div className="modal-backdrop sim-events-backdrop" onClick={onClose}>
            <div className="sim-events-modal" onClick={e => e.stopPropagation()}>

                <button className="sim-events-close" onClick={onClose}>✕</button>

                <div className="sim-events-header">
                    <div className="sim-events-title">Eventos</div>
                    <div className="sim-events-sub">Elige el evento que quieres activar</div>
                </div>

                <div className="sim-events-scroll">
                    <div className="sim-events-grid">
                        {SIM_EVENTS.map(ev => {
                            const todo = disabled.includes(ev.id);
                            const used = usedEvents.includes(ev.id);
                            const off = todo || used;
                            return (
                                <div
                                    key={ev.id}
                                    className={`sim-event-card ${off ? 'is-disabled' : ''}`}
                                    style={{ '--event-accent': ev.accent }}
                                    onClick={() => handlePick(ev)}
                                >
                                    <div className="sim-event-card-icon">
                                        {ev.img
                                            ? <img src={ev.img} alt={ev.title} />
                                            : <span className="sim-event-card-icon-fallback">?</span>}
                                    </div>
                                    <div className="sim-event-card-text">
                                        <div className="sim-event-card-title">{ev.title}</div>
                                        <div className="sim-event-card-es">{ev.es}</div>
                                        <div className="sim-event-card-desc">{ev.desc}</div>
                                    </div>
                                    {/* Consultar las reglas no lanza el evento: de ahí el
                                        stopPropagation sobre la tarjeta entera */}
                                    {ev.rules && onOpenRules && (
                                        <div className="sim-event-help"
                                             title={`Ver las reglas de ${ev.title}`}
                                             onClick={(e) => { e.stopPropagation(); onOpenRules(ev.rules); }}>?</div>
                                    )}
                                    {todo && <div className="sim-event-card-tag">Próximamente</div>}
                                    {!todo && used && <div className="sim-event-card-tag">Usado este turno</div>}
                                </div>
                            );
                        })}
                    </div>

                    <div className="sim-events-bag">
                        <div className="sim-events-bag-title">
                            <span>Guardados</span>
                            <i />
                            <span className="sim-events-bag-count">{bag.length}</span>
                        </div>

                        {bag.length === 0 ? (
                            <div className="sim-events-bag-empty">
                                Aquí se quedan los premios de eventos que guardes para después.
                            </div>
                        ) : (
                            <div className="sim-events-bag-grid">
                                {bag.map(item => {
                                    const ficha = resolveBagItem(item);
                                    if (!ficha) return null;
                                    return (
                                        <div
                                            key={item.uid}
                                            className="sim-bag-card"
                                            style={{ '--bag-type': typeColor(ficha.tipo) }}
                                            onClick={() => onUseBagItem(item)}
                                        >
                                            <div className="sim-bag-card-art">
                                                <img src={ficha.img} alt={ficha.title} />
                                            </div>
                                            <div className="sim-bag-card-text">
                                                <div className="sim-bag-card-title">{ficha.title}</div>
                                                <div className="sim-bag-card-note">{ficha.note}</div>
                                            </div>
                                            <span
                                                className="sim-bag-card-type"
                                                style={{ background: typeColor(ficha.tipo) }}
                                            >{typeLabel(ficha.tipo)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalEvents;
