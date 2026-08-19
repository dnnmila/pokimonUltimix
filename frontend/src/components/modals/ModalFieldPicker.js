import React, { useState } from 'react';
import { FIELD_MOVES } from '../../battleRules';

// Selector de cartas de campo (clima, terrenos, trampas).
//
// Vivía dentro de Player.js —la vista del máster—, pero SimPlayer también lo
// necesita desde su menú de funciones especiales. Se saca aquí para que las dos
// pantallas usen el mismo selector: si mañana cambian las reglas de colocación,
// cambian en un sitio y no en dos que se desincronizan.
//
// Se exportan dos piezas:
//   · `FieldPicker`      — solo el cuerpo, para incrustarlo en otro modal (pestaña)
//   · `ModalFieldPicker` — el cuerpo dentro de su propio backdrop (uso de Player)

const getFieldCardImg = (id) => {
    try { return require(`../../images/Field Moves/${id}.png`); } catch { return null; }
};

// El catálogo se parte en dos: las globales afectan a los dos lados, las de
// equipo solo al lado que se marque.
const globalCards = FIELD_MOVES.filter(c => c.scope === 'global');
const teamCards   = FIELD_MOVES.filter(c => c.scope === 'team');

export const FieldPicker = ({ fieldMoves, onSetFieldMove }) => {
    // Carta de un solo lado esperando que se elija a quién afecta
    const [pendingCard, setPendingCard] = useState(null);
    const [fieldWarning, setFieldWarning] = useState(null);

    const slots = fieldMoves || [null, null];

    // Hay 2 espacios; la carta entra en el primero libre
    const placeCard = (cardId, owner) => {
        const free = slots.findIndex(f => !f);
        if (free === -1) {
            setFieldWarning('Los 2 espacios están ocupados. Quita una carta antes de poner otra.');
            return;
        }
        setFieldWarning(null);
        onSetFieldMove(free, cardId, owner);
    };

    const removeCard = (cardId) => {
        const idx = slots.findIndex(f => f && f.id === cardId);
        if (idx !== -1) onSetFieldMove(idx, null, null);
        setFieldWarning(null);
    };

    // Las globales se colocan de una; las de un solo lado preguntan el lado antes
    const handlePickCard = (card) => {
        if (slots.some(f => f && f.id === card.id)) return;   // ya está puesta
        if (slots.every(Boolean)) {
            setFieldWarning('Los 2 espacios están ocupados. Quita una carta antes de poner otra.');
            return;
        }
        setFieldWarning(null);
        if (card.scope === 'global') placeCard(card.id, null);
        else setPendingCard(card);
    };

    const renderFieldOption = (card) => {
        const img = getFieldCardImg(card.id);
        const active = slots.find(f => f && f.id === card.id);
        return (
            <div key={card.id}
                 className={`field-option${active ? ' field-option--in-use' : ''}`}
                 title={card.note || ''}
                 onClick={() => handlePickCard(card)}>
                {img
                    ? <img className="field-option-img" src={img} alt={card.id} />
                    : <div className="field-option-name">{card.es}</div>}
                {active ? (
                    <div className="field-option-active">
                        <span className={`field-option-side field-option-side--${active.owner || 'global'}`}>
                            {card.scope === 'global' ? 'En juego'
                                : active.owner === 'player' ? 'En juego · Jugador'
                                : 'En juego · Rival'}
                        </span>
                        <button className="field-option-remove"
                                onClick={(e) => { e.stopPropagation(); removeCard(card.id); }}>
                            Quitar
                        </button>
                    </div>
                ) : (
                    <div className="field-option-tag">
                        {card.kind === 'reminder'
                            ? <span className="field-tag-manual">manual</span>
                            : <span className="field-tag-auto">automático</span>}
                    </div>
                )}
            </div>
        );
    };

    if (pendingCard) {
        const img = getFieldCardImg(pendingCard.id);
        return (
            <>
                {fieldWarning && <div className="field-warning">{fieldWarning}</div>}
                <div className="field-side-step">
                    <div className="field-side-step-card">
                        {img && <img className="field-side-step-img" src={img} alt={pendingCard.id} />}
                        <div className="field-side-step-name">{pendingCard.es}</div>
                        {pendingCard.note && (
                            <div className="field-side-step-note">{pendingCard.note}</div>
                        )}
                    </div>
                    <div className="field-side-step-ask">
                        ¿A qué lado afecta?
                    </div>
                    <div className="field-side-step-btns">
                        <button className="field-side-btn field-side-btn--player"
                                onClick={() => { placeCard(pendingCard.id, 'player'); setPendingCard(null); }}>
                            Jugador
                        </button>
                        <button className="field-side-btn field-side-btn--rival"
                                onClick={() => { placeCard(pendingCard.id, 'rival'); setPendingCard(null); }}>
                            Rival
                        </button>
                    </div>
                    <button className="field-side-cancel" onClick={() => setPendingCard(null)}>
                        ← Volver
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            {fieldWarning && <div className="field-warning">{fieldWarning}</div>}

            <div className="field-group">
                <div className="field-group-title field-group-title--global">
                    Afectan a los dos lados
                    <span className="field-group-count">{globalCards.length}</span>
                </div>
                <div className="field-picker-grid">{globalCards.map(renderFieldOption)}</div>
            </div>

            <div className="field-group">
                <div className="field-group-title field-group-title--team">
                    Afectan a un solo lado
                    <span className="field-group-count">{teamCards.length}</span>
                </div>
                <div className="field-picker-grid">{teamCards.map(renderFieldOption)}</div>
            </div>
        </>
    );
};

export const FieldPickerNote = () => (
    <div className="field-picker-note">
        Las cartas <strong>automáticas</strong> se suman solas al total de batalla.
        Las <strong>manuales</strong> solo se muestran como recordatorio a los jugadores.
        Todas se descartan al pasar de turno.
        <br />
        En las cartas de un solo lado, el <strong>lado afectado</strong> es quien recibe
        el efecto: en Spikes / Stealth Rock / Toxic Spikes es quien lo sufre,
        en Mist / Safeguard / Renewal es quien se beneficia.
    </div>
);

// Con `show` falso se desmonta entero, no se esconde: así el paso de "¿a qué
// lado afecta?" no reaparece pegado de la vez anterior al volver a abrirlo.
const ModalFieldPicker = ({ show, onClose, fieldMoves, onSetFieldMove }) => {
    if (!show) return null;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="field-picker" onClick={e => e.stopPropagation()}>
                <div className="field-picker-title">
                    Cartas de campo
                    <button className="field-picker-close" onClick={onClose}>✕</button>
                </div>
                <FieldPicker fieldMoves={fieldMoves} onSetFieldMove={onSetFieldMove} />
                <FieldPickerNote />
            </div>
        </div>
    );
};

export default ModalFieldPicker;
