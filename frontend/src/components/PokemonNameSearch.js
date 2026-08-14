import React, { useEffect, useRef, useState } from 'react';
import SERVER_IP from '../config';

// Buscador de Pokémon por nombre o por POKEDEX, con lista de sugerencias.
// Es el mismo comportamiento que ya tenía el buscador de salvajes de SimPlayer,
// sacado aparte para poder usarlo también en la vista del master (Player):
// buscar salvaje en la barra inferior y agregar Pokémon en el hueco libre.

// El catálogo es igual para todos los buscadores de la pantalla, así que se pide
// una sola vez por sesión y se comparte la promesa entre componentes.
let pokemonListPromise = null;

const fetchPokemonList = () => {
    if (!pokemonListPromise) {
        pokemonListPromise = fetch(`${SERVER_IP}/pokemon-list`)
            .then(r => r.json())
            .then(data => (Array.isArray(data) ? data : []))
            .catch(() => {
                pokemonListPromise = null;   // que el siguiente montaje reintente
                return [];
            });
    }
    return pokemonListPromise;
};

export const usePokemonList = () => {
    const [list, setList] = useState([]);
    useEffect(() => {
        let alive = true;
        fetchPokemonList().then(data => { if (alive) setList(data); });
        return () => { alive = false; };
    }, []);
    return list;
};

// En la vista del master las cartas se ven con la ilustración de POKEMON/;
// las formas que no la tienen (megas, G-Max, alternas) caen al token.
const getSuggestionImg = (pokedex) => {
    try { return require(`../images/POKEMON/${pokedex}.png`); }
    catch {
        try { return require(`../images/tokens_ultimix/${pokedex}.png`); }
        catch { return null; }
    }
};

// Filtrado local: por nombre o por POKEDEX. Prioriza los que empiezan por lo
// escrito para que "Rai" saque Raichu antes que Darkrai.
export const buildSuggestions = (raw, list, limit = 12) => {
    const q = (raw || '').trim().toLowerCase();
    if (!q) return [];
    const rank = (p) => {
        const n = p.name.toLowerCase();
        const d = p.pokedex.toLowerCase();
        if (n === q || d === q) return 0;
        if (n.startsWith(q)) return 1;
        if (d.startsWith(q)) return 2;
        return 3;
    };
    return list
        .filter(p => p.name.toLowerCase().includes(q) || p.pokedex.toLowerCase().includes(q))
        .sort((a, b) => rank(a) - rank(b) || a.pokedex.localeCompare(b.pokedex))
        .slice(0, limit);
};

// Convierte lo escrito en un POKEDEX válido: "26" -> "0026", "mx26" -> "MX0026",
// "Raichu" -> "0026". Ojo: hay POKEDEX con sufijo en minúscula (0718i, 0492e,
// P0128ii...), por eso primero se busca coincidencia exacta en el catálogo antes
// de tocar el texto.
export const resolvePokedex = (raw, list) => {
    const clean = (raw ?? '').toString().trim();
    if (!clean) return '';
    const byId = list.find(p => p.pokedex.toLowerCase() === clean.toLowerCase());
    if (byId) return byId.pokedex;
    const byName = list.find(p => p.name.toLowerCase() === clean.toLowerCase());
    if (byName) return byName.pokedex;
    // Si lo escrito solo deja un candidato, se da por bueno ("pikach" -> Pikachu)
    const matches = buildSuggestions(clean, list, 2);
    if (matches.length === 1) return matches[0].pokedex;
    // Solo se normaliza el formato "letras + número"; cualquier otra cosa
    // (p.ej. sufijos como 0718i) se respeta tal cual se escribió.
    const m = clean.toUpperCase().match(/^([A-Z]*)(\d+)$/);
    return m ? m[1] + m[2].padStart(4, '0') : clean;
};

const PokemonNameSearch = ({
    onSubmit,                       // (pokedex, pkm|null) => void
    placeholder = 'Nombre o # Pokédex',
    buttonLabel = 'Buscar',
    className = '',                 // clases del contenedor (pv-wild, etc.)
    inputClassName = '',
    buttonClassName = '',
    layout = 'row',                 // 'row' (barra) o 'column' (tarjeta)
    dropUp = false,                 // lista hacia arriba: para la barra inferior
    clearOnSubmit = false,
    disabled = false,
}) => {
    const list = usePokemonList();

    const [text, setText] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [highlight, setHighlight] = useState(-1);
    // Pokémon elegido de la lista: se guarda para no volver a resolver el texto
    const [picked, setPicked] = useState(null);
    const blurTimer = useRef(null);

    useEffect(() => () => clearTimeout(blurTimer.current), []);

    const closeList = () => {
        setSuggestions([]);
        setHighlight(-1);
    };

    const handleChange = (value) => {
        setText(value);
        setPicked(null);
        setSuggestions(buildSuggestions(value, list));
        setHighlight(-1);
    };

    // Al elegir solo se rellena el campo; confirmar es el segundo toque, así no
    // se lanza una batalla o se agrega un Pokémon por un roce en la lista.
    const handleSelect = (pkm) => {
        closeList();
        setText(pkm.name);
        setPicked(pkm);
    };

    const handleSubmit = () => {
        if (disabled) return;
        const pokedex = picked ? picked.pokedex : resolvePokedex(text, list);
        if (!pokedex) return;
        closeList();
        onSubmit(pokedex, picked);
        if (clearOnSubmit) {
            setText('');
            setPicked(null);
        }
    };

    const handleKeyDown = (e) => {
        if (suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlight(i => (i + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlight(i => (i <= 0 ? suggestions.length - 1 : i - 1));
                return;
            }
            if (e.key === 'Escape') {
                closeList();
                return;
            }
            if (e.key === 'Enter' && highlight >= 0) {
                e.preventDefault();
                handleSelect(suggestions[highlight]);
                return;
            }
        }
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div className={`pkm-search pkm-search--${layout} ${className}`}>
            <div className="pkm-search-field">
                <input
                    type="text"
                    className={`pkm-search-input ${inputClassName}`}
                    value={text}
                    placeholder={placeholder}
                    autoComplete="off"
                    disabled={disabled}
                    onChange={(e) => handleChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setSuggestions(buildSuggestions(text, list))}
                    onBlur={() => { blurTimer.current = setTimeout(closeList, 150); }}
                />
                {picked && <span className="pkm-search-tag">{picked.pokedex}</span>}

                {suggestions.length > 0 && (
                    <ul className={`pkm-suggestions${dropUp ? ' pkm-suggestions--up' : ''}`}>
                        {suggestions.map((pkm, i) => {
                            const img = getSuggestionImg(pkm.pokedex);
                            return (
                                <li
                                    key={pkm.pokedex}
                                    className={`pkm-suggestion${i === highlight ? ' is-active' : ''}`}
                                    // El mousedown solo frena el blur del input. Si además
                                    // seleccionara aquí, la lista desaparecería antes del
                                    // click y ese click caería sobre lo que quedó debajo.
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => { e.stopPropagation(); handleSelect(pkm); }}
                                    onMouseEnter={() => setHighlight(i)}
                                >
                                    <div className="pkm-suggestion-img"
                                         style={img ? { backgroundImage: `url(${img})` } : {}} />
                                    <span className="pkm-suggestion-name">{pkm.name}</span>
                                    <span className="pkm-suggestion-id">{pkm.pokedex}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <button className={`pkm-search-btn ${buttonClassName}`}
                    disabled={disabled}
                    onClick={handleSubmit}>
                {buttonLabel}
            </button>
        </div>
    );
};

export default PokemonNameSearch;
