import React, { useState } from 'react';
import { Z_CRYSTALS, zMoveFor } from '../../data/zmoves';
import { typeColor, typeLabel } from '../../pokemonTypes';

// Selector de cristales Z.
//
// Son 18, uno por tipo, así que caben todos en una rejilla: no hace falta ni
// buscador ni filtros como en el catálogo de MTs.
//
// La gracia es que el movimiento que da cada cristal depende del Pokémon: bajo
// cada carta se lee ya el movimiento que le tocaría a ESTE Pokémon, con los
// especiales resaltados. Así se ve de un vistazo cuál le saca más partido sin
// tener que abrir una por una.

const ModalZCatalog = ({ show, onClose, onPick, pokemon, pickLabel = 'Adjuntar' }) => {
    const [selected, setSelected] = useState(null);

    if (!show) return null;

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const handlePick = (crystal) => {
        onPick(crystal, zMoveFor(crystal, pokemon));
        setSelected(null);
    };

    const movSel = selected ? zMoveFor(selected, pokemon) : null;

    return (
        <div className="modal-backdrop z-catalog-backdrop" onClick={handleClose}>
            <div className="z-catalog-modal" onClick={e => e.stopPropagation()}>

                <button className="z-catalog-close" onClick={handleClose}>✕</button>

                <div className="z-catalog-header">
                    <div className="z-catalog-title">Cristales Z</div>
                    {pokemon && (
                        <div className="z-catalog-owner">para {pokemon.name}</div>
                    )}
                </div>

                <div className="z-catalog-grid">
                    {Z_CRYSTALS.map(z => {
                        const mov = zMoveFor(z, pokemon);
                        return (
                            <div
                                key={z.id}
                                className={`z-catalog-card ${mov.especial ? 'z-catalog-card--special' : ''}`}
                                title={`${z.cristal} — ${mov.nombre} (poder ${mov.poder})`}
                                onClick={() => setSelected(z)}
                            >
                                {z.thumb
                                    ? <img
                                          className="z-catalog-card-img"
                                          src={z.thumb}
                                          alt={z.cristal}
                                          loading="lazy"
                                      />
                                    : <div className="z-catalog-card-missing">sin imagen</div>
                                }
                                {mov.especial && (
                                    <span className="z-catalog-card-tag" title="Movimiento Z especial de este Pokémon">
                                        ESPECIAL
                                    </span>
                                )}
                                <span className="z-catalog-card-move">{mov.nombre}</span>
                                <span className="z-catalog-card-power">Poder {mov.poder}</span>
                            </div>
                        );
                    })}
                </div>

                {selected && (
                    <div className="z-catalog-detail" onClick={() => setSelected(null)}>
                        <div className="z-catalog-detail-box" onClick={e => e.stopPropagation()}>
                            {selected.img && (
                                <img
                                    className="z-catalog-detail-img"
                                    src={selected.img}
                                    alt={selected.cristal}
                                />
                            )}
                            <div className="z-catalog-detail-info">
                                <div className="z-catalog-detail-name">{selected.cristal}</div>
                                <div
                                    className="z-catalog-detail-type"
                                    style={{ background: typeColor(selected.tipo) }}
                                >
                                    {typeLabel(selected.tipo)}
                                </div>

                                <div className="z-catalog-detail-move">
                                    <div className="z-catalog-detail-movename">{movSel.nombre}</div>
                                    <div className="z-catalog-detail-row">
                                        Poder: <b>{movSel.poder}</b>
                                    </div>
                                    {movSel.especial
                                        ? <div className="z-catalog-detail-special">
                                              Movimiento Z especial de {pokemon.name}
                                          </div>
                                        : <div className="z-catalog-detail-generic">
                                              Movimiento Z genérico
                                              {selected.especiales.some(e => e.activo !== false) && (
                                                  <>
                                                      {' '}— el especial de este cristal es
                                                      solo para{' '}
                                                      {selected.especiales
                                                          .filter(e => e.activo !== false)
                                                          .map(e => e.pokemon)
                                                          .join(', ')}
                                                  </>
                                              )}
                                          </div>
                                    }
                                </div>

                                {onPick && (
                                    <button
                                        className="z-catalog-pick-btn"
                                        onClick={() => handlePick(selected)}
                                    >
                                        {pickLabel}
                                    </button>
                                )}

                                <button
                                    className="z-catalog-detail-back"
                                    onClick={() => setSelected(null)}
                                >
                                    Volver
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ModalZCatalog;
