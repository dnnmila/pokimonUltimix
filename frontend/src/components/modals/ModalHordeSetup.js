import React, { useState, useEffect } from 'react';
import { typeColor, typeLabel } from '../../pokemonTypes';
import PokemonName from '../PokemonName';
import PokemonNameSearch from '../PokemonNameSearch';
import SERVER_IP from '../../config.js';
import TOKEN_COLORS, { tokenColorHex, tokenColorLabel } from '../../data/tokenColors.js';
import { applyDynamax, canDynamax } from '../../data/maxMoves';
import { applyTera, hasTeraOrb } from '../../data/teraTypes';

// Montaje de la Horda, en dos pasos.
//
//   1. salvaje → igual que el jefe de la incursión: se elige el color del token
//      que salió y se sortea uno de ese color, o se busca por nombre o número.
//      Pelea en su forma normal: aquí no hay Dinamax ni mega que montarle.
//   2. orden   → contra él pelea el EQUIPO ENTERO, de uno en uno. Lo único que
//      se decide aquí es en qué orden salen y con qué forma sube cada uno
//      (Mega, Gigamax, Dinamax o teracristalizado), igual que en la incursión.
//
// La horda no cambia las reglas de la batalla: el que pierde su combate se
// debilita y el que gana sube de nivel, como contra cualquier salvaje. Lo que
// cambia es la cuenta — se anotan VICTORIAS, no totales, y el EMPATE cuenta
// como victoria del jugador — y que la captura se intenta una sola vez, al
// final, con esas victorias de bono.

// Un Pokémon al azar de la DB, del color de token que se pida.
const rollPokemon = async (color) => {
    const res = await fetch(`${SERVER_IP}/random-pokemon${color ? `?color=${color}` : ''}`);
    if (!res.ok) throw new Error('No salió ningún Pokémon de ese color');
    return res.json();
};

const ModalHordeSetup = ({
    show,
    onClose,
    player,
    horde,
    pokemonImg,
    onPickWild,
    onConfirmOrder,
    loading = false,
    error = null,
    onOpenRules,
}) => {
    // El orden de combate: ids del equipo, movibles. Se rellena solo en cuanto
    // hay salvaje, porque pelean todos y el orden por defecto es el del equipo.
    const [order, setOrder] = useState([]);
    // Forma con la que sube cada uno, por id de Pokémon
    const [forms, setForms] = useState({});

    const [color, setColor] = useState(null);
    const [rolled, setRolled] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [rollError, setRollError] = useState(null);

    const wild = horde?.wild || null;
    const team = player?.pokemons || [];

    // En cuanto el salvaje está montado, el equipo entra en fila. Se rehace si
    // el equipo cambia (una captura, una liberación) para no dejar ids muertos.
    useEffect(() => {
        if (!wild) return;
        setOrder(prev => {
            const ids = team.map(p => p.id);
            const kept = prev.filter(id => ids.includes(id));
            const added = ids.filter(id => !kept.includes(id));
            return [...kept, ...added];
        });
    }, [wild, team.map(p => p.id).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!show) return null;

    const reset = () => {
        setOrder([]);
        setForms({});
        setColor(null);
        setRolled(null);
        setRollError(null);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleRoll = async () => {
        setRolling(true);
        setRollError(null);
        setRolled(null);
        try {
            setRolled(await rollPokemon(color));
        } catch (e) {
            setRollError(e.message);
        } finally {
            setRolling(false);
        }
    };

    // ── Formas alternativas, las mismas que en la incursión ──────────────────
    // Mega y Gigamax son objetos aparte que ya viven en el jugador; Dinamax y
    // Tera son transformaciones que resuelven data/maxMoves y data/teraTypes.
    const megaOf = (pkm) => (player.megas || []).find(m =>
        m.basePokemonId === pkm.id || (!m.basePokemonId && m.pokedex === pkm.evolution));
    const gmaxOf = (pkm) => (player.gmaxes || []).find(g => g.pokedex === pkm.gmaxPokedex);

    const formsFor = (pkm) => {
        if (!pkm) return [];
        const out = [{ id: 'normal', label: 'Normal' }];
        if (pkm.attach === 'Mega' && megaOf(pkm)) out.push({ id: 'mega', label: 'Mega' });
        if (player.dynamax) {
            if (gmaxOf(pkm)) out.push({ id: 'gmax', label: 'Gigamax' });
            else if (canDynamax(pkm)) out.push({ id: 'dynamax', label: 'Dinamax' });
        }
        if (hasTeraOrb(pkm)) out.push({ id: 'tera', label: `Tera ${typeLabel(pkm.teraType)}` });
        return out;
    };

    const resolveForm = (pkm, form) => {
        if (form === 'mega')    return megaOf(pkm) || pkm;
        if (form === 'gmax')    return gmaxOf(pkm) || pkm;
        if (form === 'dynamax') return applyDynamax(pkm);
        if (form === 'tera')    return applyTera(pkm);
        return pkm;
    };

    const move = (index, dir) => {
        const to = index + dir;
        if (to < 0 || to >= order.length) return;
        setOrder(prev => {
            const next = [...prev];
            [next[index], next[to]] = [next[to], next[index]];
            return next;
        });
    };

    // Cada hueco viaja con el Pokémon ya montado en su forma y con el id del
    // Pokémon REAL aparte: en la horda sí se sube de nivel y sí se debilita, y
    // eso hay que aplicárselo al del equipo, no a la copia transformada.
    const buildSlots = () => order.map(id => {
        const base = team.find(p => p.id === id);
        return { pokemonId: id, pokemon: resolveForm(base, forms[id]) };
    }).filter(s => s.pokemon);

    const ordered = order.map(id => team.find(p => p.id === id)).filter(Boolean);

    return (
        <div className="modal-backdrop horde-setup-backdrop" onClick={handleClose}>
            <div className={`horde-setup-modal ${!wild ? 'horde-setup-modal--search' : ''}`}
                 onClick={e => e.stopPropagation()}>

                <button className="horde-setup-close" onClick={handleClose}>✕</button>

                <div className="horde-setup-header">
                    <div className="horde-setup-title">Horda</div>
                    <div className="raid-help" title="Ver las reglas de la horda"
                         onClick={onOpenRules}>?</div>
                    <div className="horde-setup-sub">
                        {!wild
                            ? 'Sortea el salvaje por el color del token, o búscalo por nombre'
                            : 'Ordena a tu equipo: pelean todos, uno por uno'}
                    </div>
                </div>

                {/* ── Paso 1: el salvaje ─────────────────────────────────── */}
                {!wild && (
                    <div className="raid-boss-search">
                        <div className="raid-color-label">Color del token</div>
                        <div className="raid-colors">
                            <div className={`raid-color raid-color--any ${color === null ? 'is-on' : ''}`}
                                 onClick={() => setColor(null)}
                                 title="Cualquier color">★</div>
                            {TOKEN_COLORS.map(c => (
                                <div key={c.id}
                                     className={`raid-color ${color === c.id ? 'is-on' : ''}`}
                                     style={{ backgroundColor: c.hex }}
                                     onClick={() => setColor(c.id)}
                                     title={c.label} />
                            ))}
                        </div>

                        <button className="horde-roll-btn"
                                disabled={loading || rolling}
                                onClick={handleRoll}>
                            {rolling
                                ? 'Sorteando…'
                                : rolled
                                    ? 'Sortear otro'
                                    : `Sortear salvaje${color ? ` (${tokenColorLabel(color)})` : ''}`}
                        </button>

                        {rolled && (
                            <div className="raid-roll-card"
                                 style={{ '--token-color': tokenColorHex(rolled.tokenColor) || '#3fbf6a' }}>
                                <div className="raid-roll-art"
                                     style={pokemonImg(rolled) ? { backgroundImage: `url(${pokemonImg(rolled)})` } : {}} />
                                <div className="raid-roll-meta">
                                    <div className="raid-roll-name">{rolled.name}</div>
                                    <div className="raid-roll-types">
                                        <span style={{ background: typeColor(rolled.type1) }}>{typeLabel(rolled.type1)}</span>
                                        {rolled.type2 && rolled.type2 !== 'NONE' && (
                                            <span style={{ background: typeColor(rolled.type2) }}>{typeLabel(rolled.type2)}</span>
                                        )}
                                        <span className="raid-roll-lvl">Nv {rolled.level}</span>
                                    </div>
                                    <div className="raid-roll-token">
                                        Token {tokenColorLabel(rolled.tokenColor) || 'sin color'} · #{rolled.pokedex}
                                    </div>
                                </div>
                                <button className="raid-setup-btn raid-setup-btn--main"
                                        disabled={loading}
                                        onClick={() => onPickWild(rolled.pokedex)}>
                                    {loading ? 'Montando…' : 'Enfrentarlo'}
                                </button>
                            </div>
                        )}

                        {rollError && <div className="raid-error">{rollError}</div>}

                        <div className="raid-setup-alt">
                            <i /><span>o búscalo</span><i />
                        </div>

                        <PokemonNameSearch
                            className="raid-search"
                            placeholder="Salvaje: nombre o # Pokédex"
                            buttonLabel="Enfrentarlo"
                            disabled={loading}
                            onSubmit={(pokedex) => onPickWild(pokedex)}
                        />
                        <div className="raid-search-note">
                            Pelea en su forma normal contra todo tu equipo, de uno en uno.
                            Cada victoria suma +1 a la tirada de captura del final, y los
                            empates cuentan como victoria.
                        </div>
                        {loading && <div className="raid-loading">Montando la horda…</div>}
                        {error && <div className="raid-error">{error}</div>}
                    </div>
                )}

                {/* ── Paso 2: el salvaje y el orden de combate ───────────── */}
                {wild && (
                    <>
                        <div className="horde-wild">
                            <div className="horde-wild-art"
                                 style={pokemonImg(wild) ? { backgroundImage: `url(${pokemonImg(wild)})` } : {}} />
                            <div className="horde-wild-meta">
                                <div className="horde-wild-tag">Salvaje</div>
                                <div className="horde-wild-name">{wild.name}</div>
                                <div className="horde-wild-types">
                                    <span style={{ background: typeColor(wild.type1) }}>{typeLabel(wild.type1)}</span>
                                    {wild.type2 && wild.type2 !== 'NONE' && (
                                        <span style={{ background: typeColor(wild.type2) }}>{typeLabel(wild.type2)}</span>
                                    )}
                                    <span className="horde-wild-lvl">Nv {wild.totalLevel ?? wild.level}</span>
                                </div>
                                <div className="horde-wild-note">
                                    Se pelea con las reglas de siempre: el que pierde se debilita
                                    y el que gana sube de nivel. La captura va una sola vez, al
                                    final, con +1 por cada victoria.
                                </div>
                            </div>
                        </div>

                        <div className="horde-order-title">
                            Orden de combate · {ordered.length} {ordered.length === 1 ? 'Pokémon' : 'Pokémon'}
                        </div>

                        <div className="horde-order">
                            {ordered.map((pkm, i) => {
                                const art = pokemonImg(resolveForm(pkm, forms[pkm.id]));
                                const opts = formsFor(pkm);
                                const current = forms[pkm.id] || 'normal';
                                return (
                                    <div className={`horde-slot ${pkm.state !== 'Alive' ? 'is-ko' : ''}`}
                                         key={pkm.id}>
                                        <div className="horde-slot-num">{i + 1}</div>
                                        <div className="horde-slot-art"
                                             style={art ? { backgroundImage: `url(${art})` } : {}} />
                                        <PokemonName pkm={pkm} as="div" className="horde-slot-name" />
                                        <div className="horde-slot-lvl">
                                            Nv {pkm.totalLevel ?? pkm.level}
                                            {pkm.state !== 'Alive' && <em> · debilitado</em>}
                                        </div>

                                        {opts.length > 1 && (
                                            <div className="raid-slot-forms">
                                                {opts.map(f => (
                                                    <span key={f.id}
                                                          className={`raid-form ${current === f.id ? 'is-on' : ''}`}
                                                          onClick={() => setForms(prev => ({ ...prev, [pkm.id]: f.id }))}>
                                                        {f.label}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="horde-slot-moves">
                                            <button disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                                            <button disabled={i === ordered.length - 1} onClick={() => move(i, 1)}>↓</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {error && <div className="raid-error">{error}</div>}

                        <div className="raid-setup-actions">
                            <button
                                className="raid-setup-btn raid-setup-btn--main"
                                disabled={ordered.length === 0 || loading}
                                onClick={() => onConfirmOrder(buildSlots())}
                            >
                                {loading ? 'Preparando…' : '¡Que empiece la horda!'}
                            </button>
                            <button className="raid-setup-btn raid-setup-btn--ghost" onClick={handleClose}>
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ModalHordeSetup;
