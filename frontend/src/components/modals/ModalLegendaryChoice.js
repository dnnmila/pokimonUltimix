import React from 'react';

// Selector de forma legendaria. Solo aparece cuando la especie tiene más de una
// —Kyurem (Black/White) y Necrozma (Dusk Mane/Dawn Wings/Ultra)—; con una sola
// el modal de adjuntar la pone directamente, sin preguntar.
//
// Está calcado de ModalEvolveChoice a propósito: es la misma decisión desde el
// punto de vista del jugador —«en qué se convierte»— y no tiene sentido que se
// vea distinta. La diferencia es que aquí los nombres y los tokens salen de
// data/legendaryEvos.js en vez de la base de datos, porque el objeto no cambia
// tipos hasta que el backend arma la forma.
const ModalLegendaryChoice = ({ show, options, onSelect, onClose }) => {
    if (!show || !options?.length) return null;

    const getImageUrl = (pokedex) => {
        try {
            return require(`../../images/tokens_ultimix/${pokedex}.png`);
        } catch { return null; }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-evolve-choice" onClick={e => e.stopPropagation()}>
                <div className="modal-evolve-choice__title">Forma Legendaria</div>
                <div className="modal-evolve-choice__options">
                    {options.map(opt => (
                        <div
                            key={opt.pokedex}
                            className="modal-evolve-choice__card"
                            onClick={() => onSelect(opt.pokedex)}
                        >
                            <div
                                className="modal-evolve-choice__img"
                                style={{ backgroundImage: `url(${getImageUrl(opt.pokedex)})` }}
                            />
                            <div className="modal-evolve-choice__name">{opt.name}</div>
                        </div>
                    ))}
                </div>
                <button className="close-modal" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalLegendaryChoice;
