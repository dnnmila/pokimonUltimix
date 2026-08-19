import React, { useState } from 'react';
import { TERA_TYPES, teraBoostedAttacks } from '../../data/teraTypes';
import { typeColor, typeLabel } from '../../pokemonTypes';

// Selector de Orbes Tera.
//
// Son 19 (los 18 tipos más Stellar), así que caben todos en una rejilla: no
// hace falta buscador, igual que en el catálogo de cristales Z.
//
// Bajo cada carta se lee ya cómo quedaría ESTE Pokémon si sube teracristalizado
// con ese orbe: el tipo único que tendría, y si sus ataques ganan el +1. Así se
// ve de un vistazo cuál le saca partido sin tener que probarlos uno por uno.
//
// Stellar va aparte: no cambia nada ofensivo (ningún ataque es de ese tipo) y a
// cambio no le entra ni una ventaja ni una desventaja de tipos. Se avisa,
// porque leyendo solo la carta no se adivina.

const ModalTeraCatalog = ({ show, onClose, onPick, pokemon, pickLabel = 'Adjuntar' }) => {
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const handlePick = (orb) => {
        onPick(orb);
        setSelected(null);
    };

    return (
        <div className="modal-backdrop tera-catalog-backdrop" onClick={handleClose}>
            <div className="tera-catalog-modal" onClick={e => e.stopPropagation()}>

                <button className="tera-catalog-close" onClick={handleClose}>✕</button>

                <div className="tera-catalog-header">
                    <div className="tera-catalog-title">Orbes Tera</div>
                    {pokemon && (
                        <div className="tera-catalog-owner">
                            para {pokemon.name} ({typeLabel(pokemon.type1)}
                            {pokemon.type2 && pokemon.type2 !== 'NONE' ? ` / ${typeLabel(pokemon.type2)}` : ''})
                        </div>
                    )}
                </div>

                <div className="tera-catalog-grid">
                    {TERA_TYPES.map(orb => {
                        const boosted = teraBoostedAttacks(orb, pokemon);
                        const isStellar = orb.id === 'STELLAR';
                        return (
                            <div
                                key={orb.id}
                                className={`tera-catalog-card ${selected?.id === orb.id ? 'is-selected' : ''}`}
                                style={{ '--orb-type': typeColor(orb.tipo) }}
                                onClick={() => setSelected(orb)}
                            >
                                {orb.thumb
                                    ? <img className="tera-catalog-card-img" src={orb.thumb} alt={orb.tipo} />
                                    : <div className="tera-catalog-card-missing">{orb.tipo}</div>}

                                <div className="tera-catalog-card-name">{typeLabel(orb.tipo)}</div>

                                <div className="tera-catalog-card-note">
                                    {isStellar
                                        ? 'sin ventajas ni debilidades'
                                        : boosted > 0
                                            ? <em>+1 en {boosted} ataque{boosted > 1 ? 's' : ''}</em>
                                            : 'sin ataques de este tipo'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selected && (
                    <div className="tera-catalog-foot" style={{ '--orb-type': typeColor(selected.tipo) }}>
                        <div className="tera-catalog-foot-text">
                            {pokemon?.name || 'El Pokémon'} subiría como
                            {' '}<strong>{typeLabel(selected.tipo)}</strong> a secas
                            {selected.id === 'STELLAR' && ' — ningún tipo le hace más ni menos daño'}
                        </div>
                        <button className="tera-catalog-foot-btn" onClick={() => handlePick(selected)}>
                            {pickLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalTeraCatalog;
