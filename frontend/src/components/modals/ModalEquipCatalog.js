import React, { useState } from 'react';
import { EQUIPMENT, equipBoostedAttacks } from '../../data/equipment';
import { typeColor, typeLabel } from '../../pokemonTypes';

// Selector de Objetos de Equipo.
//
// Son 18, uno por tipo, así que caben todos en una rejilla sin buscador, igual
// que los cristales Z y los Orbes Tera.
//
// A diferencia de esos dos, aquí la rejilla enseña el objeto recortado y no la
// carta entera: los 18 objetos se distinguen de un vistazo por su dibujo, y así
// se ve exactamente lo mismo que va a quedar pegado al Pokémon. La carta física
// sigue a un clic de distancia desde el item ya adjunto (ModalItemCard).
//
// Bajo cada uno se lee lo único que importa para elegir: cuántos de los tres
// ataques de ESTE Pokémon ganarían el +1. Un objeto que no le sube nada se ve
// igual de claro, para no gastarlo en el Pokémon equivocado.

const ModalEquipCatalog = ({ show, onClose, onPick, pokemon, pickLabel = 'Adjuntar' }) => {
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const handlePick = (item) => {
        onPick(item);
        setSelected(null);
    };

    const boostedBySelected = equipBoostedAttacks(selected, pokemon);

    return (
        <div className="modal-backdrop equip-catalog-backdrop" onClick={handleClose}>
            <div className="equip-catalog-modal" onClick={e => e.stopPropagation()}>

                <button className="equip-catalog-close" onClick={handleClose}>✕</button>

                <div className="equip-catalog-header">
                    <div className="equip-catalog-title">Objetos de Equipo</div>
                    {pokemon && (
                        <div className="equip-catalog-owner">
                            para {pokemon.name} ({typeLabel(pokemon.type1)}
                            {pokemon.type2 && pokemon.type2 !== 'NONE' ? ` / ${typeLabel(pokemon.type2)}` : ''})
                        </div>
                    )}
                </div>

                <div className="equip-catalog-grid">
                    {EQUIPMENT.map(item => {
                        const boosted = equipBoostedAttacks(item, pokemon);
                        return (
                            <div
                                key={item.id}
                                className={`equip-catalog-card ${selected?.id === item.id ? 'is-selected' : ''}`}
                                style={{ '--equip-type': typeColor(item.typeId) }}
                                title={item.es}
                                onClick={() => setSelected(item)}
                            >
                                {item.img
                                    ? <img className="equip-catalog-card-img" src={item.img} alt={item.nombre} />
                                    : <div className="equip-catalog-card-missing">{item.nombre}</div>}

                                <div className="equip-catalog-card-name">{item.nombre}</div>
                                <div className="equip-catalog-card-type">{typeLabel(item.typeId)} +1</div>

                                <div className="equip-catalog-card-note">
                                    {boosted > 0
                                        ? <em>sube {boosted} ataque{boosted > 1 ? 's' : ''}</em>
                                        : 'sin ataques de este tipo'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selected && (
                    <div className="equip-catalog-foot" style={{ '--equip-type': typeColor(selected.typeId) }}>
                        <div className="equip-catalog-foot-text">
                            {pokemon?.name || 'El Pokémon'} pegaría +1 con sus ataques
                            {' '}<strong>{typeLabel(selected.typeId)}</strong>
                            {boostedBySelected > 0
                                ? ` — ahora mismo le sube ${boostedBySelected} de sus tres ataques`
                                : ' — ahora mismo no tiene ninguno de ese tipo'}
                        </div>
                        <button className="equip-catalog-foot-btn" onClick={() => handlePick(selected)}>
                            {pickLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalEquipCatalog;
