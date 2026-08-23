import React, { useState, useEffect } from 'react';
import { typeColor, typeLabel } from '../../pokemonTypes';
import PokemonNameSearch, { usePokemonList } from '../PokemonNameSearch';
import SERVER_IP from '../../config.js';
import TOKEN_COLORS, { tokenColorHex, tokenColorLabel } from '../../data/tokenColors.js';
import { mirrorPkm, mirrorView, mirrorClosed } from '../../data/eventMirror';

// Montaje del Combate de Entrenador.
//
// Las dos cartas —«Trainer Battle (1)» y «(2)»— son el mismo evento con distinto
// número de rivales, así que aquí se elige primero cuántos (1 o 2) y luego se
// llenan esos huecos de las dos maneras de siempre: sorteando por el color del
// token de la casilla, o buscando el Pokémon por nombre o número.
//
// El sorteo llena los huecos vacíos de una vez, y nunca repite especie: dos
// tokens del mismo montón no pueden ser el mismo token. Cada hueco se puede
// volver a tirar por su cuenta, por si uno de los dos ya estaba puesto.
//
// A partir de aquí son batallas salvajes normales: se elige combatiente en la
// pantalla de siempre, se sube de nivel y se debilita. Lo único que la tablet
// desactiva es la captura — el Pokémon es de un entrenador — y el premio (1 o 2
// cartas de objeto, y solo ganando todos los combates) sale del mazo físico.

const rollPokemon = async (color) => {
    const res = await fetch(`${SERVER_IP}/random-pokemon${color ? `?color=${color}` : ''}`);
    if (!res.ok) throw new Error('No salió ningún Pokémon de ese color');
    return res.json();
};

const ModalTrainerBattle = ({
    show,
    onClose,
    pokemonImg,
    onStart,          // (pokedexes[]) => void
    loading = false,
    error = null,
    onOpenRules,
    onMirror,         // publica la foto para la tabla de /players
}) => {
    // El catálogo ya está cacheado por el buscador; sirve para completar la ficha
    // cuando se escribe el nombre a pelo y no se toca ninguna sugerencia.
    const list = usePokemonList();
    const [count, setCount] = useState(1);
    const [color, setColor] = useState(null);
    // Un hueco es null o el Pokémon sorteado / buscado
    const [rivals, setRivals] = useState([null, null]);
    const [rolling, setRolling] = useState(false);
    const [rollError, setRollError] = useState(null);

    // Espejo (ver data/eventMirror.js). Los dos rivales van a la FILA de abajo
    // aunque solo haya uno: así el panel no cambia de forma al pasar de la
    // carta (1) a la (2), que es el mismo evento con otro número de huecos.
    useEffect(() => {
        if (!onMirror) return;
        if (!show) { onMirror(mirrorClosed('trainerBattle')); return; }
        const puestos = rivals.slice(0, count);
        const listos = puestos.filter(Boolean);
        onMirror(mirrorView('trainerBattle',
            listos.length === puestos.length
                ? `${count === 1 ? 'Rival listo' : 'Los 2 rivales listos'} · ganándolos todos se lleva ${count === 1 ? 'una carta' : '2 cartas'} de objeto`
                : `Entrenador de ${count} ${count === 1 ? 'Pokémon' : 'Pokémon'} · eligiendo rival${count === 1 ? '' : 'es'}`,
            {
                color,
                list: puestos.map((r, i) => mirrorPkm(r, `Rival ${i + 1}`)).filter(Boolean),
            }));
    }, [show, count, color, rivals, onMirror]);

    if (!show) return null;

    const slots = rivals.slice(0, count);
    const ready = slots.every(Boolean);

    const reset = () => {
        setCount(1);
        setColor(null);
        setRivals([null, null]);
        setRollError(null);
    };

    const handleClose = () => { reset(); onClose(); };

    const setSlot = (i, value) =>
        setRivals(prev => prev.map((r, k) => (k === i ? value : r)));

    // `only` = índice a rellenar; sin él se rellenan todos los huecos del evento.
    // Se reintenta unas cuantas veces para no repetir especie entre los dos.
    const handleRoll = async (only = null) => {
        setRolling(true);
        setRollError(null);
        try {
            const targets = only === null ? slots.map((_, i) => i) : [only];
            const next = [...rivals];
            for (const i of targets) {
                const taken = next.filter((r, k) => k !== i && r).map(r => r.pokedex);
                let chosen = null;
                for (let tries = 0; tries < 8; tries++) {
                    const candidate = await rollPokemon(color);
                    chosen = candidate;
                    if (!taken.includes(candidate.pokedex)) break;
                }
                next[i] = chosen;
            }
            setRivals(next);
        } catch (e) {
            setRollError(e.message);
        } finally {
            setRolling(false);
        }
    };

    return (
        <div className="modal-backdrop trainer-battle-backdrop" onClick={handleClose}>
            <div className="trainer-battle-modal" onClick={e => e.stopPropagation()}>

                <button className="trainer-battle-close" onClick={handleClose}>✕</button>

                <div className="trainer-battle-header">
                    <div className="trainer-battle-title">Combate de Entrenador</div>
                    <div className="raid-help" title="Ver las reglas del evento"
                         onClick={() => onOpenRules(count === 2 ? 'trainerBattle2' : 'trainerBattle')}>?</div>
                    <div className="trainer-battle-sub">
                        {count === 1
                            ? 'Un rival; si le ganas, 1 carta de objeto'
                            : 'Dos rivales seguidos; ganando los dos, 2 cartas de objeto'}
                    </div>
                </div>

                {/* Cuál de las dos cartas se está jugando */}
                <div className="trainer-count">
                    {[1, 2].map(n => (
                        <button key={n}
                                className={`trainer-count-btn ${count === n ? 'is-on' : ''}`}
                                onClick={() => setCount(n)}>
                            {n} {n === 1 ? 'rival' : 'rivales'}
                        </button>
                    ))}
                </div>

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

                <button className="trainer-roll-btn"
                        disabled={loading || rolling}
                        onClick={() => handleRoll()}>
                    {rolling
                        ? 'Sorteando…'
                        : `${slots.some(Boolean) ? 'Sortear otra vez' : 'Sortear'}${color ? ` (${tokenColorLabel(color)})` : ''}`}
                </button>

                <div className="raid-setup-alt">
                    <i /><span>o búscalos</span><i />
                </div>

                <div className="trainer-slots">
                    {slots.map((pkm, i) => (
                        <div className={`trainer-slot ${pkm ? 'is-filled' : ''}`} key={i}
                             style={{ '--token-color': tokenColorHex(pkm?.tokenColor) || '#3fbf6a' }}>
                            <div className="trainer-slot-num">Rival {i + 1}</div>

                            {pkm ? (
                                <>
                                    <div className="trainer-slot-art"
                                         style={pokemonImg(pkm) ? { backgroundImage: `url(${pokemonImg(pkm)})` } : {}} />
                                    <div className="trainer-slot-name">{pkm.name}</div>
                                    <div className="trainer-slot-types">
                                        <span style={{ background: typeColor(pkm.type1) }}>{typeLabel(pkm.type1)}</span>
                                        {pkm.type2 && pkm.type2 !== 'NONE' && (
                                            <span style={{ background: typeColor(pkm.type2) }}>{typeLabel(pkm.type2)}</span>
                                        )}
                                        <span className="trainer-slot-lvl">Nv {pkm.level}</span>
                                    </div>
                                    <div className="trainer-slot-token">
                                        Token {tokenColorLabel(pkm.tokenColor) || 'sin color'} · #{pkm.pokedex}
                                    </div>
                                    <div className="trainer-slot-actions">
                                        <button disabled={rolling} onClick={() => handleRoll(i)}>Tirar otro</button>
                                        <button onClick={() => setSlot(i, null)}>Vaciar</button>
                                    </div>
                                </>
                            ) : (
                                <div className="trainer-slot-empty">
                                    <PokemonNameSearch
                                        className="raid-search raid-search--slot"
                                        placeholder="Nombre o # Pokédex"
                                        buttonLabel="Poner aquí"
                                        onSubmit={(pokedex, picked) => {
                                            const found = picked || list.find(p => p.pokedex === pokedex);
                                            setSlot(i, { ...(found || {}), pokedex, name: found?.name || pokedex });
                                        }}
                                    />
                                    <button className="trainer-slot-roll"
                                            disabled={rolling}
                                            onClick={() => handleRoll(i)}>
                                        o sortear este
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {rollError && <div className="raid-error">{rollError}</div>}
                {error && <div className="raid-error">{error}</div>}

                <div className="raid-search-note">
                    Peleas eligiendo combatiente en la pantalla de siempre. Se sube de
                    nivel y se debilita como en cualquier combate, pero el Pokémon es
                    de un entrenador: no se captura.
                </div>

                <div className="raid-setup-actions">
                    <button className="raid-setup-btn raid-setup-btn--main"
                            disabled={!ready || loading}
                            onClick={() => onStart(slots.map(p => p.pokedex))}>
                        {loading ? 'Preparando…' : count === 1 ? '¡Combatir!' : '¡Combatir con el primero!'}
                    </button>
                    <button className="raid-setup-btn raid-setup-btn--ghost" onClick={handleClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalTrainerBattle;
