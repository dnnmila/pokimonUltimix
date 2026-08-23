import React from 'react';
import { getAttachItem, getAttachCard, attachLabel, attachIconStyle } from '../../attachItems';
import { ITEM_BONUS, ALPHA_BONUS, ALPHA_CAP } from '../../battleRules';
import { EQUIP_BY_ID } from '../../data/equipment';

// Visor de la carta del item que un Pokémon lleva adjuntado durante la batalla.
//
// Es el hermano de ModalTMCard: mismo gesto (tocar la miniatura junto al
// nombre) y misma chapa visual, pero para los items que NO viven en `attack3`.
// La MT y el cristal Z siguen yendo por ModalTMCard, porque su carta se deduce
// del ataque guardado y no del id del item.
//
// Solo de consulta: sirve para cotejar la carta física sin salir del combate.
// No toca el estado de la batalla.

const ModalItemCard = ({ show, onClose, itemId, pokemon, pokemonName }) => {
    if (!show || !itemId) return null;

    const item  = getAttachItem(itemId);
    const carta = getAttachCard(itemId, pokemon);
    const label = attachLabel(itemId, pokemon);
    // Los items de apoyo son marcadores: su efecto lo aplican los jugadores a
    // mano. Solo se anuncia el bono cuando de verdad suma al total.
    const bono  = ITEM_BONUS[itemId] || 0;
    // ...pero el objeto de equipo sí suma, solo que a los ataques de su tipo y
    // no al total, así que se dice tal cual en vez de "no suma".
    const equip = itemId === 'Equip' ? EQUIP_BY_ID[pokemon?.equipItem] : null;

    return (
        <div className="modal-backdrop tm-card-backdrop" onClick={onClose}>
            <div className="tm-card-modal" onClick={e => e.stopPropagation()}>

                <button className="tm-card-close" onClick={onClose}>✕</button>

                {pokemonName && (
                    <div className="tm-card-owner">Objeto de {pokemonName}</div>
                )}

                {carta
                    ? <img className="tm-card-img" src={carta} alt={label} />
                    : <div className="tm-card-noimg">
                          <i className="item-card-sprite" style={attachIconStyle(itemId, pokemon)} />
                          <span>{label}<br />no tiene carta asociada.</span>
                      </div>
                }

                <div className="tm-card-zmove">
                    <div className="tm-card-zmove-name">{equip?.es || item?.es || label}</div>
                    <div className="tm-card-badges">
                        <span className="tm-card-power">
                            {equip
                                ? `+1 a los ataques ${equip.tipo}`
                                : itemId === 'Alpha'
                                    ? `+${ALPHA_BONUS} al ataque, sin pasar de ${ALPHA_CAP}`
                                    : bono > 0 ? `+${bono} al total` : 'No suma al total'}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ModalItemCard;
