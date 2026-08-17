import React from 'react';
import { findTMByAttack } from '../../data/tms';
import { Z_CRYSTALS } from '../../data/zmoves';
import { typeColor, typeLabel } from '../../pokemonTypes';
import imgTM from '../../images/tm.png';

// Visor de la carta que un Pokémon lleva adjuntada durante la batalla: MT o
// cristal Z, que comparten el hueco de `attack3`.
//
// Es solo de consulta: sirve para cotejar la carta física con lo que dice el
// simulador sin tener que salir del combate. No toca el estado de la batalla.
//
// Con MT la carta ya trae impreso todo, así que se enseña sola. Con cristal Z
// el movimiento NO está impreso en la carta —depende del Pokémon— así que ahí
// sí se escribe debajo cuál le ha tocado y si es el especial.

const ModalTMCard = ({ show, onClose, attack, pokemonName, esZ }) => {
    if (!show || !attack) return null;

    const crystal = esZ
        ? Z_CRYSTALS.find(z => z.cristal === attack.z?.cristal) || null
        : null;
    const tm = esZ ? null : findTMByAttack(attack);

    const carta = crystal ? crystal.img : tm?.img;
    const tipo = crystal ? crystal.tipo : (tm ? tm.tipo : attack.type);
    const poder = tm ? tm.poder : attack.strength;
    // El especial se reconoce porque el nombre guardado no es el genérico.
    const especial = crystal && attack.name !== crystal.generico;

    return (
        <div className="modal-backdrop tm-card-backdrop" onClick={onClose}>
            <div className="tm-card-modal" onClick={e => e.stopPropagation()}>

                <button className="tm-card-close" onClick={onClose}>✕</button>

                {pokemonName && (
                    <div className="tm-card-owner">
                        {esZ ? 'Cristal Z de' : 'MT de'} {pokemonName}
                    </div>
                )}

                {carta
                    ? <img className="tm-card-img" src={carta} alt={attack.name} />
                    : <div className="tm-card-noimg">
                          <img src={imgTM} alt="MT" />
                          <span>Esta MT se adjuntó a mano,<br />no tiene carta asociada.</span>
                          <div className="tm-card-badges">
                              <span
                                  className="tm-card-type"
                                  style={{ background: typeColor(tipo) }}
                              >
                                  {typeLabel(tipo)}
                              </span>
                              <span className="tm-card-power">
                                  Poder {poder > 0 ? poder : '—'}
                              </span>
                          </div>
                      </div>
                }

                {/* El cristal no lleva el movimiento impreso: lo decide el
                    Pokémon que lo usa, así que aquí sí hace falta escribirlo. */}
                {crystal && (
                    <div className="tm-card-zmove">
                        <div className="tm-card-zmove-name">{attack.name}</div>
                        <div className="tm-card-badges">
                            <span className="tm-card-power">Poder {attack.strength}</span>
                            {especial && (
                                <span className="tm-card-zspecial">ESPECIAL</span>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ModalTMCard;
