import React, { useState } from 'react';
import PokemonName from '../PokemonName';
import { displayName, nameTitle } from '../../moteName';
import { MAX_EXTRA_LEVEL } from '../../battleRules';
import imgRareCandy from '../../images/Nuevos items/Rare Candy.png';

// ─────────────────────────────────────────────────────────────────────────────
//  Caramelo Raro.
//
//  Sube un nivel, pero solo a quien va por detrás: al que ya es el más alto del
//  equipo no se le puede dar. Con un Blastoise 9, un Charizard 9 y un Venusaur 8
//  el caramelo solo entra en el Venusaur. Es para emparejar el equipo, no para
//  estirar todavía más al que ya iba primero.
//
//  El evento no se gasta por turno: lo que lo limita es que la subida la tiene
//  que aprobar el máster. Se pide desde aquí y el modal se queda esperando —
//  igual que la tienda—, así que no se pueden acumular peticiones.
//
//  La regla se comprueba también en el servidor (checkRareCandy en
//  gameController): esto de aquí es para que se ENTIENDA, no para hacerla valer.
// ─────────────────────────────────────────────────────────────────────────────

// Por qué un Pokémon no puede tomárselo, o null si sí puede.
const blockedReason = (pkm, top) => {
    if ((pkm.extra ?? 0) >= MAX_EXTRA_LEVEL) return `Máximo +${MAX_EXTRA_LEVEL}`;
    if ((pkm.totalLevel ?? 0) >= top) return 'El más alto';
    return null;
};

const ModalRareCandy = ({
    show,
    onClose,
    player,
    pokemonImg,
    pendingRequest = null,
    error = null,
    onRequest,
}) => {
    const [chosenId, setChosenId] = useState(null);

    if (!show) return null;

    const team = player?.pokemons || [];
    const top  = team.reduce((max, p) => Math.max(max, p.totalLevel ?? 0), 0);
    const chosen = team.find(p => p.id === chosenId) || null;

    // Esperando al máster. Mismo trato que la tienda: el modal se queda en este
    // estado hasta que la solicitud se aprueba o se deniega.
    if (pendingRequest) {
        return (
            <div className="modal-backdrop">
                <div className="rare-candy-modal" onClick={e => e.stopPropagation()}>
                    <div className="rare-candy-head">
                        <img className="rare-candy-icon" src={imgRareCandy} alt="" />
                        <div>
                            <div className="rare-candy-title">Caramelo Raro</div>
                            <div className="rare-candy-sub">Solicitud enviada</div>
                        </div>
                    </div>
                    <div className="rare-candy-pending">
                        <div className="rare-candy-pending-item">
                            {pendingRequest.pokemonName || pendingRequest.item}
                            {pendingRequest.toLevel != null && (
                                <em>Nv {pendingRequest.fromLevel} → {pendingRequest.toLevel}</em>
                            )}
                        </div>
                        <div className="rare-candy-pending-wait">Esperando al máster…</div>
                    </div>
                    <div className="rare-candy-actions">
                        <button className="rare-candy-btn rare-candy-btn--ghost" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>
        );
    }

    const anyEligible = team.some(p => !blockedReason(p, top));

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="rare-candy-modal" onClick={e => e.stopPropagation()}>
                <button className="trade-modal-close" onClick={onClose}>✕</button>

                <div className="rare-candy-head">
                    <img className="rare-candy-icon" src={imgRareCandy} alt="" />
                    <div>
                        <div className="rare-candy-title">Caramelo Raro</div>
                        <div className="rare-candy-sub">
                            Sube un nivel al que elijas. No se le puede dar al de nivel
                            más alto del equipo.
                        </div>
                    </div>
                </div>

                {team.length === 0 ? (
                    <div className="rare-candy-empty">Todavía no tienes equipo.</div>
                ) : !anyEligible ? (
                    <div className="rare-candy-empty">
                        Todo tu equipo está al mismo nivel: no hay a quién dárselo.
                    </div>
                ) : null}

                <div className="rare-candy-grid">
                    {team.map(pkm => {
                        const reason = blockedReason(pkm, top);
                        const art = pokemonImg ? pokemonImg(pkm) : null;
                        const isChosen = chosenId === pkm.id;
                        return (
                            <div key={pkm.id}
                                 className={`rare-candy-card ${reason ? 'is-off' : ''} ${isChosen ? 'is-chosen' : ''}`}
                                 title={reason ? `${nameTitle(pkm)} — ${reason}` : nameTitle(pkm)}
                                 onClick={() => { if (!reason) setChosenId(pkm.id); }}>
                                <div className="rare-candy-card-lvl">
                                    Nv {pkm.totalLevel}
                                    {!reason && <b>→ {pkm.totalLevel + 1}</b>}
                                </div>
                                <div className="rare-candy-card-art"
                                     style={art ? { backgroundImage: `url(${art})` } : {}} />
                                <PokemonName pkm={pkm} as="div" className="rare-candy-card-name" />
                                {reason && <div className="rare-candy-card-tag">{reason}</div>}
                            </div>
                        );
                    })}
                </div>

                {error && <div className="rare-candy-error">{error}</div>}

                <div className="rare-candy-actions">
                    <button className="rare-candy-btn"
                            disabled={!chosen}
                            onClick={() => chosen && onRequest(chosen)}>
                        {chosen
                            ? `Pedir para ${displayName(chosen)}`
                            : 'Elige un Pokémon'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalRareCandy;
