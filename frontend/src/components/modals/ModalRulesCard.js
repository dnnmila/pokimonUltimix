import React, { useState } from 'react';
import { rulesCard } from '../../data/rulesCards';

// Visor de una carta de reglas: la hoja física escaneada, para consultarla a
// media partida sin buscar el papel.
//
// Es solo de consulta, como ModalTMCard: no toca nada del estado del juego.
// Arranca ajustada a la pantalla y se amplía al tocarla, porque en la tablet la
// letra pequeña de las reglas no se lee de un vistazo.
//
// Si la imagen todavía no está en el proyecto no se rompe nada: se dice dónde
// hay que dejarla, que es más útil que un hueco en blanco.

const ModalRulesCard = ({ show, onClose, cardId }) => {
    const [zoom, setZoom] = useState(false);

    if (!show) return null;

    const card = rulesCard(cardId);
    if (!card) return null;

    const handleClose = () => { setZoom(false); onClose(); };

    return (
        <div className="modal-backdrop rules-card-backdrop" onClick={handleClose}>
            <div className="rules-card-modal" onClick={e => e.stopPropagation()}>

                <button className="rules-card-close" onClick={handleClose}>✕</button>

                <div className="rules-card-title">{card.title}</div>

                {card.img ? (
                    <>
                        <img
                            className={`rules-card-img ${zoom ? 'is-zoom' : ''}`}
                            src={card.img}
                            alt={card.title}
                            onClick={() => setZoom(!zoom)}
                        />
                        <div className="rules-card-note">
                            {zoom ? 'Toca para ajustar a la pantalla.' : 'Toca la hoja para ampliarla.'}
                        </div>
                    </>
                ) : (
                    <div className="rules-card-missing">
                        Todavía no está la hoja de reglas.
                        <br />
                        Guárdala en <code>{card.expectedPath}</code> y aparecerá aquí.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalRulesCard;
