import React from 'react';
import Types from '../Types';

const ModalEvolveChoice = ({ show, options, onSelect, onClose }) => {
    if (!show || !options) return null;

    const getImageUrl = (pokedex) => {
        try {
            return require(`../../images/POKEMON/${pokedex}.png`);
        } catch {
            try { return require(`../../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-evolve-choice" onClick={e => e.stopPropagation()}>
                <div className="modal-evolve-choice__title">Elegir Evolución</div>
                <div className="modal-evolve-choice__options">
                    {options.map(opt => (
                        <div
                            key={opt.POKEDEX}
                            className="modal-evolve-choice__card"
                            onClick={() => onSelect(opt.POKEDEX)}
                        >
                            <div
                                className="modal-evolve-choice__img"
                                style={{ backgroundImage: `url(${getImageUrl(opt.POKEDEX)})` }}
                            />
                            <div className="modal-evolve-choice__name">{opt.NAME}</div>
                            <div className="modal-evolve-choice__types">
                                <Types Type={opt.TYPE1} Clase={`type_${opt.TYPE1}`} type_id={`${opt.POKEDEX}_t1`} />
                                {opt.TYPE2 && opt.TYPE2 !== 'NONE' && (
                                    <Types Type={opt.TYPE2} Clase={`type_${opt.TYPE2}`} type_id={`${opt.POKEDEX}_t2`} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button className="close-modal" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalEvolveChoice;
