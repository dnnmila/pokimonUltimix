import React, { useEffect, useState } from 'react';
import { typeColor, typeLabel } from '../../pokemonTypes';
import { tmAppliesStab, tmPowerFor } from '../../data/tms';
import { zMoveFor } from '../../data/zmoves';
import { teraBoostedAttacks } from '../../data/teraTypes';
import { attachLabel } from '../../attachItems';
import PokemonName from '../PokemonName';
import imgTM from '../../images/tm.png';

// Eventos de «toma una carta»: Take TM, Take Z Crystal y Take Tera Orb.
//
// Los tres son el mismo evento con distinta baraja —salen 3, eliges 1, decides
// si la equipas ahora o la guardas— así que comparten componente y estilos. Lo
// único que cambia por baraja está en LABELS y en las dos funciones de abajo.
//
// Dos modos con la misma segunda mitad:
//   'roll' → salen 3 cartas al azar y el jugador elige una.
//   'use'  → viene una carta que ya estaba en la bolsa y solo falta el Pokémon.
//
// El evento se consume al abrirlo, no al decidir: por eso salir a medias pide
// confirmación — es una decisión, no un descuido. En modo bolsa no se pierde
// nada al salir, así que ahí no hay confirmación.

const LABELS = {
    tm: {
        title: 'Take TM',
        titleSaved: 'MT guardada',
        rollSub: 'Salieron 3 MTs al azar. Elige una.',
        targetSub: (n) => `¿A qué Pokémon le doy ${n || 'la MT'}?`,
        none: 'No quiero ninguna',
        confirmTitle: '¿Salir sin quedarte ninguna?',
        confirmText: 'Pierdes las 3 MTs y no puedes volver a lanzar este evento en tu turno.',
    },
    z: {
        title: 'Take Z Crystal',
        titleSaved: 'Cristal Z guardado',
        rollSub: 'Salieron 3 cristales Z al azar. Elige uno.',
        targetSub: (n) => `¿A qué Pokémon le doy ${n || 'el cristal'}?`,
        none: 'No quiero ninguno',
        confirmTitle: '¿Salir sin quedarte ninguno?',
        confirmText: 'Pierdes los 3 cristales y no puedes volver a lanzar este evento en tu turno.',
    },
    tera: {
        title: 'Take Tera Orb',
        titleSaved: 'Orbe Tera guardado',
        rollSub: 'Salieron 3 Orbes Tera al azar. Elige uno.',
        targetSub: (n) => `¿A qué Pokémon le doy ${n || 'el orbe'}?`,
        none: 'No quiero ninguno',
        confirmTitle: '¿Salir sin quedarte ninguno?',
        confirmText: 'Pierdes los 3 orbes y no puedes volver a lanzar este evento en tu turno.',
    },
};

// Lo que se lee en la carta antes de elegir. La MT ya trae impreso su
// movimiento y su poder; el cristal enseña el genérico, que es lo único que se
// puede saber sin mirar a quién se le va a dar.
const cardInfo = (kind, item) => {
    if (kind === 'z') return {
        name: item.cristal,
        subject: item.cristal,
        meta: `${item.generico} · Poder ${item.poder}`,
        tipo: item.tipo,
    };
    // El orbe no tiene nombre propio más allá del tipo, y el tipo ya va en la
    // etiqueta de color de debajo: repetirlo arriba sobraría. Lo que sí conviene
    // decir es qué hace, porque a diferencia de la MT no está impreso en la carta.
    if (kind === 'tera') return {
        name: 'Orbe Tera',
        // En la frase del paso 2 hay que decir CUÁL orbe, que en la tarjeta lo
        // dice la etiqueta de color y aquí no habría nada que lo dijera
        subject: `el Orbe ${typeLabel(item.tipo)}`,
        meta: item.id === 'STELLAR'
            ? 'sin ventajas ni debilidades'
            : 'un solo tipo en batalla',
        tipo: item.tipo,
    };
    return {
        name: item.nombre,
        subject: item.nombre,
        meta: `${item.tm} · Poder ${item.poder > 0 ? item.poder : '—'}`,
        tipo: item.tipo,
    };
};

// Lo que aporta la carta EN ESE Pokémon: es el dato con el que se elige destino.
// En la MT, el poder con el bono de tipo ya aplicado. En el cristal, el
// movimiento que le toca — que puede ser el especial y por eso va resaltado.
const targetInfo = (kind, item, pkm) => {
    if (kind === 'tera') {
        // Stellar no sube ningún ataque —no hay ataques de ese tipo—, así que su
        // razón de ser es la otra: que nadie le hace más daño.
        if (item.id === 'STELLAR') return {
            line1: 'sin ventajas ni debilidades',
            line2: 'sería Astral solo',
            highlight: false,
        };
        const n = teraBoostedAttacks(item, pkm);
        return {
            line1: n > 0 ? `+1 en ${n} ataque${n > 1 ? 's' : ''}` : 'sin ataques de ese tipo',
            line2: `sería ${typeLabel(item.tipo)} solo`,
            highlight: n > 0,
        };
    }
    if (kind === 'z') {
        const mov = zMoveFor(item, pkm);
        return {
            line1: mov.nombre,
            line2: `Poder ${mov.poder}${mov.especial ? ' · especial' : ''}`,
            highlight: mov.especial,
        };
    }
    const stab = tmAppliesStab(item, pkm);
    const poder = tmPowerFor(item, pkm);
    return {
        line1: `Poder ${poder > 0 ? poder : '—'}`,
        line2: stab ? '+1 por tipo' : null,
        highlight: stab,
    };
};

const ModalEventPick = ({
    show,
    onClose,
    kind = 'tm',
    mode = 'roll',
    options = [],
    item = null,
    pokemons = [],
    pokemonImg,
    onAttach,
    onSave,
    onDiscard,
}) => {
    const [selected, setSelected] = useState(null);
    const [step, setStep] = useState('pick');
    const [confirmExit, setConfirmExit] = useState(false);
    const [zoom, setZoom] = useState(null);

    // El modal no se desmonta al cerrarse (el guard va después de los hooks),
    // así que la tirada anterior se limpia aquí, al volver a abrirse.
    useEffect(() => {
        if (!show) return;
        setSelected(mode === 'use' ? item : null);
        setStep(mode === 'use' ? 'target' : 'pick');
        setConfirmExit(false);
        setZoom(null);
    }, [show, mode, item]);

    if (!show) return null;

    const L = LABELS[kind] || LABELS.tm;

    // En modo bolsa no se pierde nada al salir: la carta sigue guardada.
    const handleClose = () => {
        if (mode === 'use') return onClose();
        setConfirmExit(true);
    };

    const handleAttach = (pokemonId) => {
        if (!selected) return;
        onAttach(selected, pokemonId);
    };

    const renderCard = (card, { compact = false } = {}) => {
        const info = cardInfo(kind, card);
        return (
            <div
                key={card.id}
                className={`event-pick-card ${selected?.id === card.id ? 'is-selected' : ''} ${compact ? 'event-pick-card--compact' : ''}`}
                style={{ '--card-type': typeColor(info.tipo) }}
                onClick={() => setSelected(card)}
            >
                <div className="event-pick-card-art">
                    {card.thumb
                        ? <img src={card.thumb} alt={info.name} />
                        : <img className="event-pick-card-art--fallback" src={imgTM} alt="carta" />}
                </div>
                <div className="event-pick-card-name">{info.name}</div>
                <div className="event-pick-card-meta">
                    <span className="event-pick-card-type" style={{ background: typeColor(info.tipo) }}>
                        {typeLabel(info.tipo)}
                    </span>
                    <span className="event-pick-card-power">{info.meta}</span>
                </div>
                {card.img && !compact && (
                    <button
                        className="event-pick-card-zoom"
                        title="Ver la carta"
                        onClick={(e) => { e.stopPropagation(); setZoom(card); }}
                    >🔍</button>
                )}
            </div>
        );
    };

    const selectedName = selected ? cardInfo(kind, selected).subject : '';

    return (
        <div className="modal-backdrop event-pick-backdrop" onClick={handleClose}>
            <div className="event-pick-modal" onClick={e => e.stopPropagation()}>

                <button className="event-pick-close" onClick={handleClose}>✕</button>

                <div className="event-pick-header">
                    <div className="event-pick-title">
                        {mode === 'use' ? L.titleSaved : L.title}
                    </div>
                    <div className="event-pick-sub">
                        {step === 'pick' ? L.rollSub : L.targetSub(selectedName)}
                    </div>
                </div>

                {step === 'pick' && (
                    <>
                        <div className="event-pick-roll">
                            {options.map(card => renderCard(card))}
                        </div>

                        <div className="event-pick-actions">
                            <button
                                className="event-pick-btn event-pick-btn--main"
                                disabled={!selected}
                                onClick={() => setStep('target')}
                            >Adjuntar a un Pokémon</button>
                            <button
                                className="event-pick-btn"
                                disabled={!selected}
                                onClick={() => onSave(selected)}
                            >Guardar para después</button>
                            <button
                                className="event-pick-btn event-pick-btn--ghost"
                                onClick={() => setConfirmExit(true)}
                            >{L.none}</button>
                        </div>
                    </>
                )}

                {step === 'target' && (
                    <>
                        {selected && (
                            <div className="event-pick-chosen">
                                {renderCard(selected, { compact: true })}
                            </div>
                        )}

                        {pokemons.length === 0 ? (
                            <div className="event-pick-empty">No tienes Pokémon en el equipo.</div>
                        ) : (
                            <div className="event-pick-targets">
                                {pokemons.map(pkm => {
                                    const img = pokemonImg ? pokemonImg(pkm) : null;
                                    const info = selected ? targetInfo(kind, selected, pkm) : null;
                                    const ocupado = pkm.attach && pkm.attach !== 'None';
                                    return (
                                        <div
                                            key={pkm.id}
                                            className="event-pick-target"
                                            style={{ '--pkm-type': typeColor(pkm.type1) }}
                                            onClick={() => handleAttach(pkm.id)}
                                        >
                                            <div
                                                className="event-pick-target-art"
                                                style={img ? { backgroundImage: `url(${img})` } : {}}
                                            />
                                            <PokemonName pkm={pkm} as="div" className="event-pick-target-name" />
                                            {info && (
                                                <div className={`event-pick-target-power ${info.highlight ? 'is-highlight' : ''}`}>
                                                    <span>{info.line1}</span>
                                                    {info.line2 && <em>{info.line2}</em>}
                                                </div>
                                            )}
                                            {ocupado && (
                                                <div className="event-pick-target-warn">
                                                    Sustituye {attachLabel(pkm.attach)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {mode === 'roll' && (
                            <div className="event-pick-actions">
                                <button
                                    className="event-pick-btn event-pick-btn--ghost"
                                    onClick={() => setStep('pick')}
                                >← Volver a las 3 cartas</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {zoom && (
                <div className="event-pick-zoom" onClick={(e) => { e.stopPropagation(); setZoom(null); }}>
                    <img src={zoom.img} alt={cardInfo(kind, zoom).name} />
                </div>
            )}

            {confirmExit && (
                <div className="event-pick-confirm" onClick={e => e.stopPropagation()}>
                    <div className="event-pick-confirm-box">
                        <div className="event-pick-confirm-title">{L.confirmTitle}</div>
                        <div className="event-pick-confirm-text">{L.confirmText}</div>
                        <div className="event-pick-confirm-btns">
                            <button
                                className="event-pick-btn event-pick-btn--danger"
                                onClick={() => { setConfirmExit(false); onDiscard(); }}
                            >Sí, salir</button>
                            <button
                                className="event-pick-btn event-pick-btn--main"
                                onClick={() => setConfirmExit(false)}
                            >Seguir eligiendo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModalEventPick;
