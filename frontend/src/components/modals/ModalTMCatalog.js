import React, { useMemo, useState } from 'react';
import { TMS, TM_TYPES, tmAppliesStab, tmPowerFor } from '../../data/tms';
import { typeColor, typeLabel } from '../../pokemonTypes';

// Catálogo de las 291 cartas de MT.
//
// Sirve para dos cosas con el mismo componente:
//   - consulta pura (desde el HUD de setup): sin `onPick`, la ficha solo mira.
//   - selector (desde ModalAttach): con `onPick`, la ficha ofrece "Adjuntar" y
//     devuelve la MT elegida para que el llamador dispare attachTM.
//
// Los png pesan ~590 KB cada uno (762x1068), así que el grid va con
// loading="lazy": el navegador solo descarga las cartas que entran en pantalla.

const norm = (s) =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const ModalTMCatalog = ({ show, onClose, onPick, pickLabel = 'Adjuntar', pokemon }) => {
    const [tipo, setTipo] = useState(null);   // null = todos los tipos
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);

    // Un solo pase sobre el catálogo: filtra por tipo y por texto (nombre o
    // número de MT), y ordena por número dentro de cada tipo.
    const visible = useMemo(() => {
        const q = norm(search);
        return TMS
            .filter(t => !tipo || t.tipo === tipo)
            .filter(t => !q || norm(t.nombre).includes(q) || norm(t.tm).includes(q))
            .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.numero - b.numero);
    }, [tipo, search]);

    if (!show) return null;

    const handleClose = () => {
        setSelected(null);
        onClose();
    };

    const handlePick = (tm) => {
        onPick(tm);
        setSelected(null);
    };

    return (
        <div className="modal-backdrop tm-catalog-backdrop" onClick={handleClose}>
            <div className="tm-catalog-modal" onClick={e => e.stopPropagation()}>

                <button className="tm-catalog-close" onClick={handleClose}>✕</button>

                <div className="tm-catalog-header">
                    <div className="tm-catalog-title">Catálogo de MTs</div>
                    <div className="tm-catalog-count">
                        {visible.length} / {TMS.length}
                    </div>
                </div>

                <input
                    className="tm-catalog-search"
                    type="text"
                    placeholder="Buscar por nombre o número..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <div className="tm-catalog-types">
                    <div
                        className={`tm-catalog-type ${tipo === null ? 'tm-catalog-type--on' : ''}`}
                        onClick={() => setTipo(null)}
                    >
                        Todos
                    </div>
                    {TM_TYPES.map(t => (
                        <div
                            key={t}
                            className={`tm-catalog-type ${tipo === t ? 'tm-catalog-type--on' : ''}`}
                            style={{ '--tm-type-color': typeColor(t) }}
                            onClick={() => setTipo(tipo === t ? null : t)}
                        >
                            {typeLabel(t)}
                        </div>
                    ))}
                </div>

                <div className="tm-catalog-grid">
                    {visible.map(tm => (
                        <div
                            key={tm.id}
                            className="tm-catalog-card"
                            title={`${tm.tm} — ${tm.nombre}`}
                            onClick={() => setSelected(tm)}
                        >
                            {tm.thumb
                                ? <img
                                      className="tm-catalog-card-img"
                                      src={tm.thumb}
                                      alt={tm.nombre}
                                      loading="lazy"
                                  />
                                : <div className="tm-catalog-card-missing">sin imagen</div>
                            }
                            {/* De un vistazo, cuáles suben de poder en este
                                Pokémon concreto. */}
                            {tmAppliesStab(tm, pokemon) && (
                                <span className="tm-catalog-card-stab" title="Bono de tipo: +1 de poder">
                                    +1
                                </span>
                            )}
                            <span className="tm-catalog-card-name">{tm.nombre}</span>
                        </div>
                    ))}
                    {visible.length === 0 && (
                        <div className="tm-catalog-empty">No se encontró ninguna MT.</div>
                    )}
                </div>

                {selected && (
                    <div className="tm-catalog-detail" onClick={() => setSelected(null)}>
                        <div className="tm-catalog-detail-box" onClick={e => e.stopPropagation()}>
                            {selected.img && (
                                <img
                                    className="tm-catalog-detail-img"
                                    src={selected.img}
                                    alt={selected.nombre}
                                />
                            )}
                            <div className="tm-catalog-detail-info">
                                <div className="tm-catalog-detail-name">{selected.nombre}</div>
                                <div className="tm-catalog-detail-tm">{selected.tm}</div>
                                <div
                                    className="tm-catalog-detail-type"
                                    style={{ background: typeColor(selected.tipo) }}
                                >
                                    {typeLabel(selected.tipo)}
                                </div>
                                {/* Con un Pokémon destino se muestra el poder
                                    con el que se va a adjuntar de verdad, no
                                    el de la carta: si le toca el +1 por tipo,
                                    se ve la subida. */}
                                <div className="tm-catalog-detail-row">
                                    Poder:{' '}
                                    <b>
                                        {selected.poder > 0
                                            ? tmPowerFor(selected, pokemon)
                                            : '—'}
                                    </b>
                                    {tmAppliesStab(selected, pokemon) && (
                                        <span className="tm-catalog-stab-tag">
                                            {selected.poder} +1 por tipo
                                        </span>
                                    )}
                                </div>
                                <div className="tm-catalog-detail-row">
                                    Bono STAB: <b>{selected.stab ? 'Sí' : 'No'}</b>
                                </div>
                                {pokemon && selected.stab && !tmAppliesStab(selected, pokemon) && (
                                    <div className="tm-catalog-detail-note">
                                        {pokemon.name} no es de tipo{' '}
                                        {typeLabel(selected.tipo)}: se adjunta
                                        sin el +1.
                                    </div>
                                )}

                                {/* Las MTs de estado (poder 0) también se
                                    adjuntan: en el juego de mesa la carta se
                                    pone igual, solo que no suma al ataque. */}
                                {onPick && (
                                    <button
                                        className="tm-catalog-pick-btn"
                                        onClick={() => handlePick(selected)}
                                    >
                                        {pickLabel}
                                    </button>
                                )}

                                <button
                                    className="tm-catalog-detail-back"
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

export default ModalTMCatalog;
