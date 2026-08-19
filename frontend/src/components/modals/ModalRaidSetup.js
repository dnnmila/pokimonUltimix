import React, { useState } from 'react';
import { typeColor, typeLabel } from '../../pokemonTypes';
import PokemonName from '../PokemonName';
import PokemonNameSearch from '../PokemonNameSearch';
import SERVER_IP from '../../config.js';
import TOKEN_COLORS, { tokenColorHex, tokenColorLabel } from '../../data/tokenColors.js';
import { applyDynamax, canDynamax } from '../../data/maxMoves';
import { applyTera, hasTeraOrb } from '../../data/teraTypes';

// Montaje de la Incursión Max, en dos pasos.
//
//   1. jefe   → de dos maneras, como en el Combate Mega: se elige el color del
//      token que salió y se sortea uno de ese color, o se busca por nombre o
//      número cuando el token ya está sobre la mesa. La forma se la asigna la
//      app sola: Gigamax si la especie tiene token propio —solo 46 lo tienen—
//      o Dinamax en cualquier otro caso.
//   2. equipo → cuatro huecos. El primero es obligatoriamente un Pokémon del
//      host; los otros tres se llenan con uno de cada jugador o con un salvaje,
//      buscado por nombre o sorteado igual que el jefe.
//
// El sorteo de los salvajes NO deja elegir color: sale del mismo que el jefe,
// que es el color del token con el que se abrió la incursión.
//
// Los Pokémon DEL HOST pueden subir en otra forma —Mega, Gigamax, Dinamax o
// teracristalizados—, y se elige en la propia tarjeta del hueco. Los de otros
// jugadores y los salvajes suben siempre en su forma normal: el host no maneja
// los items ajenos, y los salvajes no tienen.
//
// Los cuatro combates los juega el host en su tablet, así que aquí se elige
// todo de una vez y luego ya no se vuelve a preguntar.

const SLOTS = 4;

// Un Pokémon al azar de la DB, opcionalmente del color de token que se pida.
// Es el mismo sorteo que usa el metrónomo de las funciones especiales.
const rollPokemon = async (color) => {
    const res = await fetch(`${SERVER_IP}/random-pokemon${color ? `?color=${color}` : ''}`);
    if (!res.ok) throw new Error('No salió ningún Pokémon de ese color');
    return res.json();
};

const ModalRaidSetup = ({
    show,
    onClose,
    player,
    allPlayers = [],
    raid,
    pokemonImg,
    onPickBoss,
    onConfirmTeam,
    loading = false,
    error = null,
    onOpenRules,
}) => {
    // Un hueco es null (vacío), {pokedex, name} (salvaje) o {ownerId, pokemonId}
    const [slots, setSlots] = useState(Array(SLOTS).fill(null));
    // Qué hueco se está llenando; null = ninguno
    const [openSlot, setOpenSlot] = useState(null);

    // Sorteo del jefe: color del token elegido (null = cualquiera) y el Pokémon
    // que salió, que todavía no es el jefe hasta que se confirme.
    const [color, setColor] = useState(null);
    const [rolled, setRolled] = useState(null);
    const [rolling, setRolling] = useState(false);
    const [rollError, setRollError] = useState(null);
    // Sorteo del salvaje de un hueco
    const [wildRolling, setWildRolling] = useState(false);
    const [wildError, setWildError] = useState(null);

    if (!show) return null;

    const boss = raid?.boss || null;
    const others = allPlayers.filter(p => p.id !== player.id);

    // El color de la incursión es el del token del jefe, que el backend sella al
    // montarlo. Mientras el jefe no está (o si la partida viene de antes de que
    // se guardara) vale el que se haya elegido aquí para sortear.
    const raidColor = raid?.bossColor || color || null;
    const raidColorHex = tokenColorHex(raidColor);
    const raidColorLabel = tokenColorLabel(raidColor);

    const reset = () => {
        setSlots(Array(SLOTS).fill(null));
        setOpenSlot(null);
        setColor(null);
        setRolled(null);
        setRollError(null);
        setWildError(null);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleRollBoss = async () => {
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

    // El salvaje sale del color del jefe, sin poder elegirlo: es el token que ya
    // se sacó al abrir la incursión.
    const handleRollWild = async (index) => {
        setWildRolling(true);
        setWildError(null);
        try {
            const pkm = await rollPokemon(raidColor);
            setSlot(index, { pokedex: pkm.pokedex, name: pkm.name });
        } catch (e) {
            setWildError(e.message);
        } finally {
            setWildRolling(false);
        }
    };

    // Un mismo Pokémon no puede ocupar dos huecos: si no, el host metería cuatro
    // veces a su mejor bicho y la incursión dejaría de tener gracia.
    const isTaken = (ownerId, pokemonId, exceptIndex) =>
        slots.some((s, i) => i !== exceptIndex && s && s.pokemonId === pokemonId && s.ownerId === ownerId);

    const setSlot = (index, value) => {
        setSlots(prev => prev.map((s, i) => (i === index ? value : s)));
        setOpenSlot(null);
    };

    // ── Formas alternativas de los Pokémon del host ─────────────────────────
    //
    // Mega y Gigamax NO son transformaciones: son objetos aparte que ya viven en
    // el jugador (`megas` / `gmaxes`). Dinamax y Tera sí lo son, y las resuelven
    // las mismas funciones que usa la pantalla de selección de combatientes.
    const megaOf = (pkm) => (player.megas || []).find(m =>
        m.basePokemonId === pkm.id || (!m.basePokemonId && m.pokedex === pkm.evolution));
    const gmaxOf = (pkm) => (player.gmaxes || []).find(g => g.pokedex === pkm.gmaxPokedex);

    // Qué formas puede sacar ESTE Pokémon. Mega y Tera se excluyen entre sí
    // porque comparten el hueco de item, y Gigamax y Dinamax también (el que
    // tiene token G-Max propio sube con él, no con ataques Max).
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

    // El Pokémon base de un hueco del host, para poder ofrecerle sus formas
    const hostPkmOf = (slot) => (slot && slot.ownerId === player.id)
        ? (player.pokemons || []).find(p => p.id === slot.pokemonId)
        : null;

    // Al confirmar, los huecos del host viajan con el Pokémon YA montado en su
    // forma; el resto van por referencia y los arma el servidor.
    const buildSlots = () => slots.map(slot => {
        const base = hostPkmOf(slot);
        if (!base) return slot;
        return { ownerId: player.id, pokemon: resolveForm(base, slot.form) };
    });

    const teamReady = slots[0] && slots.every(Boolean);

    const describeSlot = (slot) => {
        if (!slot) return null;
        if (slot.pokedex) return { name: slot.name || slot.pokedex, sub: 'Salvaje', pkm: { pokedex: slot.pokedex } };
        const owner = allPlayers.find(p => p.id === slot.ownerId);
        const base = owner?.pokemons?.find(p => p.id === slot.pokemonId);
        const pkm = (owner?.id === player.id && base) ? resolveForm(base, slot.form) : base;
        return { name: pkm?.name || '—', sub: owner?.name || '', pkm };
    };

    return (
        <div className="modal-backdrop raid-setup-backdrop" onClick={handleClose}>
            <div className={`raid-setup-modal ${!boss ? 'raid-setup-modal--search' : ''}`}
                 onClick={e => e.stopPropagation()}>

                <button className="raid-setup-close" onClick={handleClose}>✕</button>

                <div className="raid-setup-header">
                    <div className="raid-setup-title">Incursión Max</div>
                    <div className="raid-help" title="Ver las reglas de la incursión"
                         onClick={onOpenRules}>?</div>
                    <div className="raid-setup-sub">
                        {!boss
                            ? 'Sortea el jefe por el color del token, o búscalo por nombre'
                            : 'Arma el equipo de 4 que va a enfrentarlo'}
                    </div>
                </div>

                {/* ── Paso 1: el jefe ────────────────────────────────────── */}
                {!boss && (
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

                        <button className="raid-roll-btn"
                                disabled={loading || rolling}
                                onClick={handleRollBoss}>
                            {rolling
                                ? 'Sorteando…'
                                : rolled
                                    ? 'Sortear otro'
                                    : `Sortear jefe${color ? ` (${tokenColorLabel(color)})` : ''}`}
                        </button>

                        {rolled && (
                            <div className="raid-roll-card"
                                 style={{ '--token-color': tokenColorHex(rolled.tokenColor) || '#f2506e' }}>
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
                                        onClick={() => onPickBoss(rolled.pokedex)}>
                                    {loading ? 'Montando…' : 'Poner de jefe'}
                                </button>
                            </div>
                        )}

                        {rollError && <div className="raid-error">{rollError}</div>}

                        <div className="raid-setup-alt">
                            <i /><span>o búscalo</span><i />
                        </div>

                        <PokemonNameSearch
                            className="raid-search"
                            placeholder="Jefe: nombre o # Pokédex"
                            buttonLabel="Poner de jefe"
                            disabled={loading}
                            onSubmit={(pokedex) => onPickBoss(pokedex)}
                        />
                        <div className="raid-search-note">
                            Si la especie tiene forma Gigamax se le asigna sola; si no,
                            pelea Dinamax con sus ataques convertidos en Movimientos Max.
                            Los salvajes que se metan al equipo saldrán del color del jefe.
                        </div>
                        {loading && <div className="raid-loading">Montando al jefe…</div>}
                        {error && <div className="raid-error">{error}</div>}
                    </div>
                )}

                {/* ── Paso 2: jefe + equipo ──────────────────────────────── */}
                {boss && (
                    <>
                        <div className="raid-boss">
                            <div className="raid-boss-art"
                                 style={pokemonImg(boss) ? { backgroundImage: `url(${pokemonImg(boss)})` } : {}} />
                            <div className="raid-boss-meta">
                                <div className="raid-boss-tag">
                                    {raid.bossMode === 'gmax' ? 'Gigamax' : 'Dinamax'}
                                </div>
                                <div className="raid-boss-name">{boss.name}</div>
                                <div className="raid-boss-types">
                                    <span style={{ background: typeColor(boss.type1) }}>{typeLabel(boss.type1)}</span>
                                    {boss.type2 && boss.type2 !== 'NONE' && (
                                        <span style={{ background: typeColor(boss.type2) }}>{typeLabel(boss.type2)}</span>
                                    )}
                                    <span className="raid-boss-lvl">Nv {boss.totalLevel ?? boss.level}</span>
                                </div>
                                {raid.bossMode === 'dynamax' && (
                                    <div className="raid-boss-note">
                                        Sin forma G-Max propia: pelea Dinamax, con sus ataques
                                        convertidos en Movimientos Max.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="raid-slots">
                            {slots.map((slot, i) => {
                                const info = describeSlot(slot);
                                const art = info?.pkm ? pokemonImg(info.pkm) : null;
                                return (
                                    <div
                                        key={i}
                                        className={`raid-slot ${slot ? 'is-filled' : ''} ${openSlot === i ? 'is-open' : ''}`}
                                        onClick={() => setOpenSlot(openSlot === i ? null : i)}
                                    >
                                        <div className="raid-slot-num">{i + 1}</div>
                                        {info ? (
                                            <>
                                                <div className="raid-slot-art"
                                                     style={art ? { backgroundImage: `url(${art})` } : {}} />
                                                <div className="raid-slot-name">{info.name}</div>
                                                <div className="raid-slot-owner">{info.sub}</div>
                                                {(() => {
                                                    const base = hostPkmOf(slot);
                                                    const forms = formsFor(base);
                                                    if (forms.length < 2) return null;
                                                    const current = slot.form || 'normal';
                                                    return (
                                                        <div className="raid-slot-forms"
                                                             onClick={(e) => e.stopPropagation()}>
                                                            {forms.map(f => (
                                                                <span key={f.id}
                                                                      className={`raid-form ${current === f.id ? 'is-on' : ''}`}
                                                                      onClick={() => setSlots(prev => prev.map((sl, k) =>
                                                                          k === i ? { ...sl, form: f.id } : sl))}>
                                                                    {f.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        ) : (
                                            <div className="raid-slot-empty">
                                                {i === 0 ? 'Tu Pokémon' : 'Toca para elegir'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Elector del hueco abierto. El hueco 1 solo admite
                            Pokémon del host, que es quien lanza la incursión. */}
                        {openSlot !== null && (
                            <div className="raid-picker">
                                <div className="raid-picker-title">
                                    Hueco {openSlot + 1}
                                    {openSlot === 0 && ' — tiene que ser tuyo'}
                                </div>

                                <div className="raid-picker-group">
                                    <div className="raid-picker-group-name">{player.name} (tú)</div>
                                    <div className="raid-picker-row">
                                        {(player.pokemons || []).map(pkm => (
                                            <div
                                                key={pkm.id}
                                                className={`raid-picker-pkm ${isTaken(player.id, pkm.id, openSlot) ? 'is-taken' : ''}`}
                                                style={{ '--pkm-type': typeColor(pkm.type1) }}
                                                onClick={() => !isTaken(player.id, pkm.id, openSlot)
                                                    && setSlot(openSlot, { ownerId: player.id, pokemonId: pkm.id })}
                                            >
                                                <div className="raid-picker-art"
                                                     style={pokemonImg(pkm) ? { backgroundImage: `url(${pokemonImg(pkm)})` } : {}} />
                                                <PokemonName pkm={pkm} as="div" className="raid-picker-name" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {openSlot > 0 && others.map(other => (
                                    <div className="raid-picker-group" key={other.id}>
                                        <div className="raid-picker-group-name">{other.name}</div>
                                        <div className="raid-picker-row">
                                            {(other.pokemons || []).length === 0
                                                ? <div className="raid-picker-none">sin equipo</div>
                                                : other.pokemons.map(pkm => (
                                                    <div
                                                        key={pkm.id}
                                                        className={`raid-picker-pkm ${isTaken(other.id, pkm.id, openSlot) ? 'is-taken' : ''}`}
                                                        style={{ '--pkm-type': typeColor(pkm.type1) }}
                                                        onClick={() => !isTaken(other.id, pkm.id, openSlot)
                                                            && setSlot(openSlot, { ownerId: other.id, pokemonId: pkm.id })}
                                                    >
                                                        <div className="raid-picker-art"
                                                             style={pokemonImg(pkm) ? { backgroundImage: `url(${pokemonImg(pkm)})` } : {}} />
                                                        <PokemonName pkm={pkm} as="div" className="raid-picker-name" />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}

                                {openSlot > 0 && (
                                    <div className="raid-picker-group">
                                        <div className="raid-picker-group-name">
                                            Salvaje
                                            {raidColorHex && (
                                                <span className="raid-color-chip"
                                                      style={{ background: raidColorHex }}
                                                      title={`Token ${raidColorLabel}`} />
                                            )}
                                        </div>
                                        {/* Se sortea del color del jefe, sin elegirlo: es el
                                            token con el que se abrió la incursión. */}
                                        <button className="raid-picker-wild"
                                                disabled={wildRolling}
                                                onClick={() => handleRollWild(openSlot)}>
                                            {wildRolling
                                                ? 'Sorteando…'
                                                : `Sortear salvaje${raidColorLabel ? ` (${raidColorLabel})` : ''}`}
                                        </button>
                                        {wildError && <div className="raid-error">{wildError}</div>}
                                        <PokemonNameSearch
                                            className="raid-search raid-search--slot"
                                            placeholder="Nombre o # Pokédex"
                                            buttonLabel="Poner aquí"
                                            dropUp
                                            onSubmit={(pokedex, pkm) =>
                                                setSlot(openSlot, { pokedex, name: pkm?.name || pokedex })}
                                        />
                                    </div>
                                )}

                                {slots[openSlot] && (
                                    <button className="raid-picker-clear" onClick={() => setSlot(openSlot, null)}>
                                        Vaciar el hueco
                                    </button>
                                )}
                            </div>
                        )}

                        {error && <div className="raid-error">{error}</div>}

                        <div className="raid-setup-actions">
                            <button
                                className="raid-setup-btn raid-setup-btn--main"
                                disabled={!teamReady || loading}
                                onClick={() => onConfirmTeam(buildSlots())}
                            >
                                {loading ? 'Preparando…' : '¡Empezar la incursión!'}
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

export default ModalRaidSetup;
