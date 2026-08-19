import React, { useState, useEffect } from 'react';
import { MOTE_MAX_LENGTH, moteOf } from '../../moteName';

// Poner o quitar el mote de un Pokémon. Se abre desde SimPlayer pulsando el
// nombre en la tarjeta del equipo.
const ModalMote = ({ show, pokemon, onSave, onClose }) => {
    const [value, setValue] = useState('');

    // El modal no se desmonta entre un Pokémon y otro, así que el input hay que
    // recargarlo a mano cada vez que cambia el objetivo.
    //
    // La dependencia es el id, no el objeto: SimPlayer se repinta con cada
    // evento del socket y el Pokémon llega siempre como objeto nuevo, así que
    // depender de él borraría lo que se está escribiendo en mitad de la frase.
    const pkmId = pokemon?.id;
    useEffect(() => {
        if (show) setValue(moteOf(pokemon));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, pkmId]);

    if (!show || !pokemon) return null;

    const getImageUrl = (pokedex) => {
        try {
            return require(`../../images/POKEMON/${pokedex}.png`);
        } catch {
            try { return require(`../../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
        }
    };

    const clean = value.trim();
    const save = () => { onSave(clean); onClose(); };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-mote" onClick={e => e.stopPropagation()}>
                <div className="modal-mote__title">Poner un mote</div>

                <div className="modal-mote__pkm">
                    <div className="modal-mote__img"
                         style={{ backgroundImage: `url(${getImageUrl(pokemon.pokedex)})` }} />
                    <div className="modal-mote__real">{pokemon.name}</div>
                </div>

                <input className="modal-mote__input"
                       type="text"
                       value={value}
                       maxLength={MOTE_MAX_LENGTH}
                       placeholder={pokemon.name}
                       autoFocus
                       onChange={e => setValue(e.target.value)}
                       onKeyDown={e => { if (e.key === 'Enter') save(); }} />

                <div className="modal-mote__hint">
                    {MOTE_MAX_LENGTH - value.length} caracteres restantes.
                    El mote es solo visual: el nombre real no cambia.
                </div>

                <div className="modal-mote__actions">
                    {/* Quitar solo aparece si hay algo que quitar, para no
                        ofrecer un botón que no haría nada */}
                    {moteOf(pokemon) && (
                        <button className="modal-mote__btn modal-mote__btn--clear"
                                onClick={() => { onSave(''); onClose(); }}>
                            Quitar mote
                        </button>
                    )}
                    <button className="modal-mote__btn modal-mote__btn--cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="modal-mote__btn modal-mote__btn--save"
                            disabled={clean === moteOf(pokemon)}
                            onClick={save}>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalMote;
