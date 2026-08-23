import React, { useState, useEffect } from 'react';
import { typeColor, typeLabel } from '../../pokemonTypes';
import PokemonName from '../PokemonName';
import PokemonNameSearch, { usePokemonList } from '../PokemonNameSearch';
import SERVER_IP from '../../config.js';
import TOKEN_COLORS, { tokenColorHex, tokenColorLabel } from '../../data/tokenColors.js';
import { contestRows, contestPower, diceSum, contestVerdict, ZERO_MOVE_VALUE } from '../../data/contest.js';
import { mirrorPkm, mirrorView, mirrorClosed } from '../../data/eventMirror';

// Concurso Pokémon.
//
// No pasa por el motor de batalla: aquí no se elige ataque ni hay tipos, bonos
// o niveles. Se suman los poderes de los movimientos (los de poder 0 valen 2,
// los objetos adjuntos no cuentan — ver data/contest.js), se tiran dados y gana
// el total más alto.
//
// Tres pasos en la misma pantalla, que es corta:
//   1. tu Pokémon  → de tu equipo.
//   2. el rival    → «un token nuevo del mismo color», así que el color de tu
//      Pokémon viene ya elegido; se puede cambiar, o buscarlo por nombre.
//   3. el concurso → el desglose de los dos y los dados.
//
// Los dados funcionan como en una batalla: empieza con uno por lado y se pueden
// añadir hasta tres, o rehacer el último. Se marca lo que salió en la mesa; la
// tablet no tira nada.
//
// El premio y el castigo son de cartas físicas (objeto, Ribbon, descartes), así
// que la tablet solo los recuerda. Lo único que sí puede hacer es meter al
// Pokémon al equipo si se elige la tirada de captura y sale.

const MAX_DICE = 3;

const ModalContest = ({
    show,
    onClose,
    player,
    pokemonImg,
    tokenImg,         // (pokedex) => imagen del token físico, en grande
    onCatch,          // (pokedex) => void
    onOpenRules,
    onMirror,         // publica la foto para la tabla de /players
}) => {
    // Los Pokémon del equipo no guardan su color de token, así que se resuelve
    // del catálogo, que ya está cacheado por el buscador.
    const list = usePokemonList();
    const [mine, setMine] = useState(null);       // Pokémon del equipo
    const [rival, setRival] = useState(null);     // ficha completa, con ataques
    const [color, setColor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [myDice, setMyDice] = useState([null]);
    const [rivalDice, setRivalDice] = useState([null]);
    const [done, setDone] = useState(false);      // concurso cerrado: se ve el veredicto
    // Token abierto a tamaño grande: el Pokémon, o null. Para ir a por él al
    // montón de fichas hay que verlo entero, y en la cabecera mide 4rem.
    const [zoom, setZoom] = useState(null);

    // Ojo con el orden: el `return null` de «modal cerrado» está más abajo, tras
    // los totales. El efecto que publica el espejo los necesita, y un hook no
    // puede quedar por detrás de un return.

    const reset = () => {
        setMine(null); setRival(null); setColor(null);
        setError(null); setMyDice([null]); setRivalDice([null]); setDone(false);
        setZoom(null);
    };

    // La ficha grande enseña el TOKEN físico (tokens_ultimix, 914 px), no el
    // recorte de 215 px de images/POKEMON que basta para la cabecera.
    const bigImg = (pkm) => (tokenImg && tokenImg(pkm.pokedex)) || pokemonImg(pkm);

    const handleClose = () => { reset(); onClose(); };

    const colorOf = (pkm) =>
        pkm?.tokenColor || list.find(p => p.pokedex === pkm?.pokedex)?.tokenColor || null;

    // El rival sale «del mismo color», así que al elegir Pokémon se preselecciona
    // el suyo. Si no tiene color en la DB se queda en «cualquiera».
    const pickMine = (pkm) => {
        setMine(pkm);
        setColor(colorOf(pkm));
    };

    // La ficha completa (con los tres ataques) no viene ni del sorteo ni del
    // buscador: los dos dan el POKEDEX y de ahí se pide la carta entera.
    const loadRival = async (pokedex) => {
        const res = await fetch(`${SERVER_IP}/pokemon-card?pokedex=${encodeURIComponent(pokedex)}`);
        if (!res.ok) throw new Error('No se pudo cargar ese Pokémon');
        return res.json();
    };

    const handleRoll = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${SERVER_IP}/random-pokemon${color ? `?color=${color}` : ''}`);
            if (!res.ok) throw new Error('No salió ningún Pokémon de ese color');
            const head = await res.json();
            setRival(await loadRival(head.pokedex));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (pokedex) => {
        setLoading(true);
        setError(null);
        try {
            setRival(await loadRival(pokedex));
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // ── Dados ───────────────────────────────────────────────────────────────
    const setDie = (side, index, value) => {
        const [rows, set] = side === 'mine' ? [myDice, setMyDice] : [rivalDice, setRivalDice];
        set(rows.map((v, i) => (i === index ? value : v)));
    };
    const addDie = (side) => {
        const [rows, set] = side === 'mine' ? [myDice, setMyDice] : [rivalDice, setRivalDice];
        if (rows.length >= MAX_DICE) return;
        set([...rows, null]);
    };
    const undoDie = (side) => {
        const [rows, set] = side === 'mine' ? [myDice, setMyDice] : [rivalDice, setRivalDice];
        const next = [...rows];
        // Se borra el último tirado; si el último hueco estaba vacío, se quita
        const last = next.length - 1;
        if (next[last] === null && next.length > 1) next.pop();
        else next[last] = null;
        set(next);
    };

    const myPower = contestPower(mine);
    const rivalPower = contestPower(rival);
    const myTotal = myPower + diceSum(myDice);
    const rivalTotal = rivalPower + diceSum(rivalDice);
    const bothRolled = myDice.every(v => v !== null) && rivalDice.every(v => v !== null)
        && diceSum(myDice) > 0 && diceSum(rivalDice) > 0;
    const verdict = contestVerdict(myTotal, rivalTotal);

    // Espejo (ver data/eventMirror.js). Es el único evento con dos lados, así
    // que usa el `vs` del panel y el marcador: poder + dados de cada uno, que es
    // exactamente la cuenta que se sigue desde la mesa mientras se tira.
    useEffect(() => {
        if (!onMirror) return;
        if (!show) { onMirror(mirrorClosed('contest')); return; }
        const estado = !mine
            ? 'Eligiendo con qué Pokémon concursa'
            : !rival
                ? 'Eligiendo el color del token del rival'
                : done
                    ? (verdict === 'win' ? '¡Ganó el concurso!'
                        : verdict === 'lose' ? `Ganó ${rival.name}`
                        : 'Empate: ni premio ni castigo')
                    : 'Marcando los dados';
        onMirror(mirrorView('contest', estado, {
            color,
            vs: mirrorPkm(mine, 'Concursante'),
            main: mirrorPkm(rival, 'Rival'),
            // El marcador solo aparece cuando hay con quién comparar; antes de
            // eso serían dos ceros grandes sin significado.
            score: mine && rival
                ? { mine: myTotal, theirs: rivalTotal,
                    mineLabel: mine.name, theirsLabel: rival.name }
                : null,
        }));
    }, [show, mine, rival, color, myTotal, rivalTotal, done, verdict, onMirror]);

    if (!show) return null;

    // Una columna del concurso: el Pokémon, el desglose de sus movimientos, sus
    // dados y su total.
    const renderSide = (side, pkm, rows, dice, power, total) => {
      // Sin imagen grande no hay nada que ampliar: la cabecera se queda como
      // una cabecera y no promete una lupa que no lleva a ningún sitio.
      const big = bigImg(pkm);
      return (
        <div className={`contest-side contest-side--${side}`}>
            <div className="contest-side-head">
                <div className={`contest-side-art ${big ? 'is-zoomable' : ''}`}
                     title={big ? `Ver el token de ${pkm.name} en grande` : undefined}
                     onClick={big ? () => setZoom(pkm) : undefined}
                     style={pokemonImg(pkm) ? { backgroundImage: `url(${pokemonImg(pkm)})` } : {}}>
                    {big && <span className="contest-side-art-zoom">⤢</span>}
                </div>
                <div className="contest-side-id">
                    {side === 'mine'
                        ? <PokemonName pkm={pkm} as="div" className="contest-side-name" />
                        : <div className="contest-side-name">{pkm.name}</div>}
                    <div className="contest-side-types">
                        <span style={{ background: typeColor(pkm.type1) }}>{typeLabel(pkm.type1)}</span>
                        {pkm.type2 && pkm.type2 !== 'NONE' && (
                            <span style={{ background: typeColor(pkm.type2) }}>{typeLabel(pkm.type2)}</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="contest-moves">
                {rows.map(row => (
                    <div className={`contest-move ${row.skipped ? 'is-off' : ''}`} key={row.slot}>
                        <span className="contest-move-name">
                            {row.skipped === 'attach'
                                ? `${row.attack?.name || 'Objeto'} (objeto)`
                                : row.skipped === 'empty'
                                    ? '— sin movimiento —'
                                    : row.attack.name}
                        </span>
                        <span className="contest-move-val">
                            {row.skipped
                                ? '—'
                                : row.boosted
                                    ? <>{ZERO_MOVE_VALUE}<em>de 0</em></>
                                    : row.value}
                        </span>
                    </div>
                ))}
                <div className="contest-move contest-move--sum">
                    <span className="contest-move-name">Poder</span>
                    <span className="contest-move-val">{power}</span>
                </div>
            </div>

            <div className="contest-dice">
                <div className="contest-dice-chosen">
                    {dice.map((v, i) => v === null ? null : (
                        <div key={i} className={`contest-die-face mydice${v}`} />
                    ))}
                </div>

                {dice.some(v => v === null) ? (
                    <div className="contest-dice-row">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n}
                                 className={`contest-die mydice${n}`}
                                 onClick={() => setDie(side, dice.findIndex(v => v === null), n)} />
                        ))}
                    </div>
                ) : (
                    <div className="contest-dice-actions">
                        <button onClick={() => undoDie(side)} title="Rehacer el último dado">↺</button>
                        {dice.length < MAX_DICE && (
                            <button onClick={() => addDie(side)} title="Añadir otro dado">+ dado</button>
                        )}
                    </div>
                )}
            </div>

            <div className="contest-total">
                <span>{power}</span><i>+</i><span>{diceSum(dice)}</span><i>=</i>
                <strong>{total}</strong>
            </div>
        </div>
      );
    };

    return (
        <div className="modal-backdrop contest-backdrop" onClick={handleClose}>
            <div className={`contest-modal ${!rival ? 'contest-modal--setup' : ''}`}
                 onClick={e => e.stopPropagation()}>

                <button className="contest-close" onClick={handleClose}>✕</button>

                <div className="contest-header">
                    <div className="contest-title">Concurso Pokémon</div>
                    <div className="raid-help" title="Ver las reglas del concurso"
                         onClick={onOpenRules}>?</div>
                    <div className="contest-sub">
                        {!mine
                            ? 'Elige con qué Pokémon concursas'
                            : !rival
                                ? 'Saca un token nuevo del mismo color'
                                : 'Suma de poderes y dados: gana el total más alto'}
                    </div>
                </div>

                {/* ── Paso 1: mi Pokémon ─────────────────────────────────── */}
                {!mine && (
                    <div className="contest-team">
                        {(player.pokemons || []).map(pkm => (
                            <div key={pkm.id}
                                 className="contest-team-pkm"
                                 style={{ '--pkm-type': typeColor(pkm.type1) }}
                                 onClick={() => pickMine(pkm)}>
                                <div className="contest-team-art"
                                     style={pokemonImg(pkm) ? { backgroundImage: `url(${pokemonImg(pkm)})` } : {}} />
                                <PokemonName pkm={pkm} as="div" className="contest-team-name" />
                                <div className="contest-team-power">Poder {contestPower(pkm)}</div>
                            </div>
                        ))}
                        {(player.pokemons || []).length === 0 && (
                            <div className="raid-picker-none">No tienes Pokémon con los que concursar</div>
                        )}
                    </div>
                )}

                {/* ── Paso 2: el rival ───────────────────────────────────── */}
                {mine && !rival && (
                    <div className="raid-boss-search">
                        <div className="contest-mine-strip">
                            <div className="contest-mine-art"
                                 style={pokemonImg(mine) ? { backgroundImage: `url(${pokemonImg(mine)})` } : {}} />
                            <div>
                                <PokemonName pkm={mine} as="div" className="contest-mine-name" />
                                <div className="contest-mine-note">
                                    Poder de concurso {contestPower(mine)}
                                    {colorOf(mine)
                                        ? ` · token ${tokenColorLabel(colorOf(mine))}`
                                        : ' · sin color de token'}
                                </div>
                            </div>
                            <button className="contest-change" onClick={() => { setMine(null); setColor(null); }}>
                                Cambiar
                            </button>
                        </div>

                        <div className="raid-color-label">Color del token del rival</div>
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

                        <button className="contest-roll-btn" disabled={loading} onClick={handleRoll}>
                            {loading
                                ? 'Sorteando…'
                                : `Sortear rival${color ? ` (${tokenColorLabel(color)})` : ''}`}
                        </button>

                        <div className="raid-setup-alt">
                            <i /><span>o búscalo</span><i />
                        </div>

                        <PokemonNameSearch
                            className="raid-search"
                            placeholder="Rival: nombre o # Pokédex"
                            buttonLabel="Al concurso"
                            disabled={loading}
                            onSubmit={handleSearch}
                        />

                        {error && <div className="raid-error">{error}</div>}
                        <div className="raid-search-note">
                            Se suman los poderes de sus movimientos: los de poder 0 valen {ZERO_MOVE_VALUE},
                            y los objetos adjuntos no cuentan. Ni nivel, ni tipos, ni bonos.
                        </div>
                    </div>
                )}

                {/* ── Paso 3: el concurso ────────────────────────────────── */}
                {mine && rival && (
                    <>
                        <div className="contest-arena"
                             style={{ '--token-color': tokenColorHex(rival.tokenColor) || '#5ec8f2' }}>
                            {renderSide('mine', mine, contestRows(mine), myDice, myPower, myTotal)}
                            <div className="contest-vs">VS</div>
                            {renderSide('rival', rival, contestRows(rival), rivalDice, rivalPower, rivalTotal)}
                        </div>

                        {!done && (
                            <div className="contest-actions">
                                <button className="raid-setup-btn raid-setup-btn--main"
                                        disabled={!bothRolled}
                                        onClick={() => setDone(true)}>
                                    {bothRolled ? 'Cerrar el concurso' : 'Tira los dos dados'}
                                </button>
                                <button className="raid-setup-btn raid-setup-btn--ghost"
                                        onClick={() => { setRival(null); setMyDice([null]); setRivalDice([null]); }}>
                                    Otro rival
                                </button>
                            </div>
                        )}

                        {done && (
                            <div className={`contest-result contest-result--${verdict}`}>
                                <div className="contest-result-title">
                                    {verdict === 'win'
                                        ? '¡Ganaste el concurso!'
                                        : verdict === 'lose'
                                            ? `Ganó ${rival.name}`
                                            : 'Empate'}
                                </div>

                                {verdict === 'win' && (
                                    <>
                                        <div className="contest-result-text">
                                            Toma una carta de <strong>Objeto</strong>, o intenta la tirada de
                                            captura con <strong>+2</strong> sobre {rival.name}.
                                            <br />Y llévate una carta <strong>Ribbon</strong>.
                                        </div>
                                        <div className="contest-result-actions">
                                            <button className="raid-setup-btn raid-setup-btn--main"
                                                    onClick={() => { onCatch(rival.pokedex); handleClose(); }}>
                                                Capturé a {rival.name}
                                            </button>
                                            <button className="raid-setup-btn raid-setup-btn--ghost"
                                                    onClick={handleClose}>
                                                Cerrar
                                            </button>
                                        </div>
                                    </>
                                )}

                                {verdict === 'lose' && (
                                    <>
                                        <div className="contest-result-text">
                                            Descarta <strong>2 cartas</strong> o réstale <strong>2</strong> a tu
                                            próxima tirada de ataque.
                                        </div>
                                        <div className="contest-result-actions">
                                            <button className="raid-setup-btn raid-setup-btn--main"
                                                    onClick={handleClose}>Cerrar</button>
                                        </div>
                                    </>
                                )}

                                {verdict === 'tie' && (
                                    <>
                                        <div className="contest-result-text">
                                            Mismo total: ni premio ni castigo. Podéis añadir un dado a cada
                                            uno para desempatar.
                                        </div>
                                        <div className="contest-result-actions">
                                            <button className="raid-setup-btn raid-setup-btn--ghost"
                                                    onClick={() => setDone(false)}>
                                                ← Seguir tirando
                                            </button>
                                            <button className="raid-setup-btn raid-setup-btn--main"
                                                    onClick={handleClose}>Cerrar</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* El token a tamaño de buscarlo en la mesa. Va fuera del modal —no
                dentro— para que no herede su recorte ni su desplazamiento, igual
                que el mapa del Grand Underground. */}
            {zoom && (
                <div className="contest-token-full"
                     onClick={(e) => { e.stopPropagation(); setZoom(null); }}>
                    <img src={bigImg(zoom)} alt={`Token de ${zoom.name}`} />
                    <div className="contest-token-full-name">{zoom.name}</div>
                    <button className="contest-token-full-close">✕</button>
                </div>
            )}
        </div>
    );
};

export default ModalContest;
