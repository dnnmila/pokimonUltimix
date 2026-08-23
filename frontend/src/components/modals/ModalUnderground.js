import React, { useState, useEffect } from 'react';
import POKEMON_TYPES, { typeColor, typeLabel } from '../../pokemonTypes';
import { mirrorPkm, mirrorView, mirrorClosed } from '../../data/eventMirror';
import SERVER_IP from '../../config.js';
import TOKEN_COLORS, { tokenColorHex, tokenColorLabel } from '../../data/tokenColors.js';
import mapaUnderground from '../../images/underground/sinnoh-underground.jpg';

// Evento «Grand Underground»: el encuentro de una caverna del subsuelo de Sinnoh.
//
// La carta se resuelve con dos cosas que el jugador ya tiene delante en la mesa:
// el COLOR del token que le toca sacar (el de uno de sus Pokémon) y el TIPO que
// pide la caverna que exploró. Aquí se eligen esos dos y sale el salvaje.
//
// Qué tipo pide cada caverna NO se repite aquí: está en el mapa, que se enseña
// a tamaño de leerlo, y duplicarlo en fichas solo daba un paso de más para
// elegir lo mismo que ya eligen el color y la rejilla de tipos.
//
// Por dentro no hay motor nuevo: se monta con el nombre 'Wild Pokemon' y se
// pelea «under wild conditions», que es lo que dice la carta — o sea, la batalla
// salvaje de siempre, con su nivel, su captura y su debilitado.
//
// La regla del «If the listed type is unavailable, draw a random token instead»
// se implementa como un segundo sorteo sin tipo: si el color no tiene ningún
// Pokémon de ese tipo, se avisa en pantalla y sale uno cualquiera del color.

// Un Pokémon al azar de la DB, filtrando por color de token y/o tipo.
const rollPokemon = async (color, type) => {
    const qs = [];
    if (color) qs.push(`color=${encodeURIComponent(color)}`);
    if (type)  qs.push(`type=${encodeURIComponent(type)}`);
    const res = await fetch(`${SERVER_IP}/random-pokemon${qs.length ? `?${qs.join('&')}` : ''}`);
    if (!res.ok) return null;
    return res.json();
};

const ModalUnderground = ({
    show,
    onClose,
    pokemonImg,
    onStart,        // (pokedex) => void
    loading = false,
    onOpenRules,
    onMirror,       // publica la foto para la tabla de /players
}) => {
    const [color, setColor] = useState(null);
    const [type, setType] = useState(null);
    const [rolled, setRolled] = useState(null);
    const [fallback, setFallback] = useState(false);
    const [rolling, setRolling] = useState(false);
    const [error, setError] = useState(null);
    const [mapOpen, setMapOpen] = useState(false);

    // Espejo: se publica al abrir y en cada cambio, y se retira al cerrar. La
    // retirada va en el propio efecto —y no en handleClose— porque el modal se
    // cierra por media docena de sitios (la ✕, el fondo, «¡Combatir!», el botón
    // de inicio de SimPlayer) y aquí se cubren todos de una vez.
    useEffect(() => {
        if (!onMirror) return;
        if (!show) { onMirror(mirrorClosed('underground')); return; }
        onMirror(mirrorView('underground',
            rolled ? `Le salió ${rolled.name}` : 'Eligiendo color de token y tipo de caverna',
            { color, type, main: mirrorPkm(rolled, 'Salvaje') }));
    }, [show, color, type, rolled, onMirror]);

    if (!show) return null;

    const reset = () => {
        setColor(null);
        setType(null);
        setRolled(null);
        setFallback(false);
        setError(null);
        setMapOpen(false);
    };

    const handleClose = () => { reset(); onClose(); };

    const handleRoll = async () => {
        setRolling(true);
        setError(null);
        setRolled(null);
        setFallback(false);
        try {
            let pkm = await rollPokemon(color, type);
            let cayo = false;
            // El tipo no existe en ese color: la carta manda sacar un token al
            // azar. Se avisa, para que se vea que no salió lo que se pidió.
            if (!pkm && type) {
                pkm = await rollPokemon(color, null);
                cayo = Boolean(pkm);
            }
            if (!pkm) {
                setError('No salió ningún Pokémon con esa combinación');
                return;
            }
            setRolled(pkm);
            setFallback(cayo);
        } catch {
            setError('No se pudo contactar con el servidor');
        } finally {
            setRolling(false);
        }
    };

    return (
        <div className="modal-backdrop ug-backdrop" onClick={handleClose}>
            <div className="ug-modal" onClick={e => e.stopPropagation()}>

                <button className="ug-close" onClick={handleClose}>✕</button>

                <div className="ug-header">
                    <div className="ug-title">Grand Underground</div>
                    {onOpenRules && (
                        <div className="raid-help" title="Ver la carta de reglas"
                             onClick={onOpenRules}>?</div>
                    )}
                    <div className="ug-sub">Explora una caverna y enfréntate a lo que salga</div>
                </div>

                {/* ── Mapa ───────────────────────────────────────────────── */}
                {/* Lo primero del modal y a la mayor altura que quepa: es la
                    referencia que se mira, y bajar a buscarla obligaba a
                    ampliarla para nada. El botón de ampliar se queda como
                    último recurso, no como paso obligado. */}
                <div className="ug-map" onClick={() => setMapOpen(true)} title="Ver el mapa a pantalla completa">
                    <img src={mapaUnderground} alt="Mapa del Grand Underground" />
                    <span className="ug-map-zoom">⤢ Ampliar</span>
                </div>

                {/* ── Reglas ─────────────────────────────────────────────── */}
                <div className="ug-rules">
                    <div className="ug-rules-block">
                        <div className="ug-rules-title">Explorar la caverna</div>
                        <p>
                            Tira un D6 y resuelve la recompensa de la casilla que exploraste:
                        </p>
                        <ul className="ug-rules-list">
                            <li><b>1-2</b> · <i>Cavar por un objeto</i>: tira un D4, roba tantas
                                cartas de objeto como salga y descarta todas menos una.</li>
                            <li><b>3-4</b> · <i>Encuentro</i> del primer tipo de la caverna.</li>
                            <li><b>5-6</b> · <i>Encuentro</i> de cualquiera de los otros dos tipos.</li>
                        </ul>
                    </div>
                    <div className="ug-rules-block">
                        <div className="ug-rules-title">Encuentro</div>
                        <p>
                            Roba tokens del color de uno de tus Pokémon (sin contar
                            legendarios) hasta sacar uno del tipo indicado y pelea contra
                            él <b>en condiciones de salvaje</b>. Si ese tipo no está
                            disponible, saca un token al azar.
                        </p>
                        <p className="ug-rules-note">
                            Eso es justo lo que hace el sorteo de abajo: elige el color y el
                            tipo y la tablet saca el token por ti.
                        </p>
                    </div>
                </div>

                {/* ── Sorteo ─────────────────────────────────────────────── */}
                <div className="ug-picker">
                    <div className="ug-section-label">Color del token</div>
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

                    <div className="ug-section-label">Tipo del Pokémon</div>
                    <div className="ug-types">
                        <button className={`ug-type-chip ug-type-chip--any ${type === null ? 'is-on' : ''}`}
                                onClick={() => setType(null)}>Cualquiera</button>
                        {POKEMON_TYPES.map(t => (
                            <button key={t}
                                    className={`ug-type-chip ${type === t ? 'is-on' : ''}`}
                                    style={{ '--ug-type': typeColor(t) }}
                                    onClick={() => setType(t)}>{typeLabel(t)}</button>
                        ))}
                    </div>

                    <button className="ug-roll-btn"
                            disabled={loading || rolling}
                            onClick={handleRoll}>
                        {rolling
                            ? 'Sacando token…'
                            : rolled
                                ? 'Sacar otro token'
                                : `Sacar token${color ? ` ${tokenColorLabel(color).toLowerCase()}` : ''}${type ? ` de tipo ${typeLabel(type)}` : ''}`}
                    </button>

                    {error && <div className="raid-error">{error}</div>}

                    {rolled && (
                        <div className="raid-roll-card"
                             style={{ '--token-color': tokenColorHex(rolled.tokenColor) || '#5ec8f2' }}>
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
                                    onClick={() => onStart(rolled.pokedex)}>
                                {loading ? 'Montando…' : '¡Combatir!'}
                            </button>
                        </div>
                    )}

                    {fallback && (
                        <div className="ug-fallback">
                            No hay ningún Pokémon de tipo {typeLabel(type)} con ese color de
                            token: salió uno al azar, como manda la carta.
                        </div>
                    )}

                    <div className="ug-note">
                        Se pelea como contra cualquier salvaje: sube de nivel, se puede
                        capturar y el que pierde se debilita.
                    </div>
                </div>
            </div>

            {/* El mapa a pantalla completa: es una hoja para leer, y dentro del
                modal las cajas de las cavernas quedan demasiado pequeñas. */}
            {mapOpen && (
                <div className="ug-map-full" onClick={(e) => { e.stopPropagation(); setMapOpen(false); }}>
                    <img src={mapaUnderground} alt="Mapa del Grand Underground" />
                    <button className="ug-map-full-close">✕</button>
                </div>
            )}
        </div>
    );
};

export default ModalUnderground;
