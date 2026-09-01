import React, { useEffect } from 'react';
import PokemonName from '../PokemonName';
import { typeColor, typeLabel } from '../../pokemonTypes';
import { tokenColorHex, tokenColorLabel } from '../../data/tokenColors.js';
import { mirrorPkm, mirrorView, mirrorClosed } from '../../data/eventMirror';

// ─────────────────────────────────────────────────────────────────────────────
//  Montaje del Battle Royal.
//
//  Aquí no se elige nada: la carta dice quién pelea y contra qué color. Este
//  modal solo enseña el cuadro de combates —cada Pokémon vivo tuyo de token
//  verde, azul, amarillo o rojo contra un rival sorteado de su mismo color— y
//  arranca el primero.
//
//  Quién entra y contra quién lo decide el servidor (royaleStart en
//  gameController): el color de un Pokémon del jugador no viaja en su ficha, hay
//  que buscarlo en la DB. Por eso el sorteo no se puede hacer desde aquí y este
//  modal se limita a pedirlo y a pintar el resultado.
// ─────────────────────────────────────────────────────────────────────────────

const ModalBattleRoyale = ({
    show,
    onClose,
    royale,
    pokemonImg,
    onRoll,          // pide el sorteo al servidor
    onStart,         // arranca el primer combate
    loading = false,
    error = null,
    onOpenRules,
    onMirror,        // publica la foto para la tabla de /players
}) => {
    const bouts = royale?.bouts || [];

    // Espejo (ver data/eventMirror.js). Lo que la mesa quiere ver es el cuadro:
    // la fila son los rivales sorteados, cada uno con el Pokémon al que le toca.
    useEffect(() => {
        if (!onMirror) return;
        if (!show) { onMirror(mirrorClosed('battleRoyale')); return; }
        onMirror(mirrorView('battleRoyale',
            bouts.length
                ? `${bouts.length} ${bouts.length === 1 ? 'combate' : 'combates'} · una carta por victoria`
                : 'Sorteando los rivales del torneo',
            {
                list: bouts.map(b => ({
                    ...mirrorPkm(b.wild, b.pokemon?.name),
                    tokenColor: b.color,
                })),
            }));
        // `royale` llega por socket con objetos nuevos en cada actualización de
        // la partida: si fuera dependencia, el efecto publicaría sin parar. Lo
        // que identifica al cuadro es la lista de pokedex, que sí es estable.
    }, [show, bouts.map(b => b.wild?.pokedex).join('|'), onMirror]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!show) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="royale-modal" onClick={e => e.stopPropagation()}>
                <button className="trade-modal-close" onClick={onClose}>✕</button>

                <div className="royale-head">
                    <div>
                        <div className="royale-title">Battle Royal</div>
                        <div className="royale-sub">
                            Cada Pokémon tuyo en pie de token <b>verde</b>, <b>azul</b>,{' '}
                            <b>amarillo</b> o <b>rojo</b> pelea contra un rival de su mismo
                            color. Por cada victoria, robas una carta.
                        </div>
                    </div>
                    {onOpenRules && (
                        <div className="royale-help" title="Ver la carta de reglas"
                             onClick={onOpenRules}>?</div>
                    )}
                </div>

                {error && <div className="royale-error">{error}</div>}

                {bouts.length === 0 ? (
                    <div className="royale-empty">
                        Los rivales los saca el sorteo: uno por cada Pokémon tuyo que entre
                        al torneo.
                    </div>
                ) : (
                    <div className="royale-bracket">
                        {bouts.map((b, i) => {
                            const hex = tokenColorHex(b.color);
                            const mineArt  = pokemonImg ? pokemonImg(b.pokemon) : null;
                            const rivalArt = pokemonImg ? pokemonImg(b.wild) : null;
                            return (
                                <div key={`${b.pokemonId}-${i}`} className="royale-bout"
                                     style={{ '--token-color': hex || '#7a7a8c' }}>
                                    <div className="royale-bout-color">
                                        {tokenColorLabel(b.color) || '—'}
                                    </div>

                                    <div className="royale-side">
                                        <div className="royale-side-art"
                                             style={mineArt ? { backgroundImage: `url(${mineArt})` } : {}} />
                                        <PokemonName pkm={b.pokemon} as="div" className="royale-side-name" />
                                        <div className="royale-side-lvl">Nv {b.pokemon?.totalLevel}</div>
                                    </div>

                                    <div className="royale-vs">VS</div>

                                    <div className="royale-side royale-side--rival">
                                        <div className="royale-side-art"
                                             style={rivalArt ? { backgroundImage: `url(${rivalArt})` } : {}} />
                                        <div className="royale-side-name">{b.wild?.name}</div>
                                        <div className="royale-side-lvl">Nv {b.wild?.totalLevel}</div>
                                        <div className="royale-side-types">
                                            <span style={{ backgroundColor: typeColor(b.wild?.type1) }}>
                                                {typeLabel(b.wild?.type1)}
                                            </span>
                                            {b.wild?.type2 && b.wild.type2 !== 'NONE' && (
                                                <span style={{ backgroundColor: typeColor(b.wild.type2) }}>
                                                    {typeLabel(b.wild.type2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="royale-actions">
                    <button className="royale-btn royale-btn--ghost"
                            disabled={loading}
                            onClick={onRoll}>
                        {loading ? 'Sorteando…' : bouts.length ? 'Sortear otra vez' : 'Sortear rivales'}
                    </button>
                    {bouts.length > 0 && (
                        <button className="royale-btn" disabled={loading} onClick={onStart}>
                            ¡Que empiece! ▶
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalBattleRoyale;
