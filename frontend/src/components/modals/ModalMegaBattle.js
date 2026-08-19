import React, { useState } from 'react';
import { typeColor, typeLabel } from '../../pokemonTypes';
import PokemonNameSearch from '../PokemonNameSearch';

// Evento «Mega Battle»: un combate suelto contra la mega evolución de la
// especie que diga el host.
//
// El rival no se elige: se tira y sale una de las 94 megas del juego, como
// sacar una carta del mazo. Se puede volver a tirar antes de empezar.
//
// Debajo queda la vía manual —buscar la especie por nombre y pelear contra SU
// mega— para cuando el rival lo marque la mesa y no el sorteo. Las especies de
// doble mega (Charizard X e Y) tampoco se eligen ahí: sale una de las dos.
//
// Por dentro es una batalla salvaje: se monta el rival con el nombre
// 'Wild Pokemon' y todo el flujo que ya existe (subir nivel, capturar,
// debilitar) funciona sin tocar nada.

const ModalMegaBattle = ({
    show,
    onClose,
    pokemonImg,
    onRoll,          // () => { base, mega } | null
    onSearch,        // (pokedex) => { base, forms } | null
    onStart,         // (megaPokedex) => void
    loading = false,
}) => {
    const [result, setResult] = useState(null);   // { base, forms, mega }
    const [error, setError] = useState(null);

    if (!show) return null;

    const reset = () => { setResult(null); setError(null); };
    const handleClose = () => { reset(); onClose(); };

    const handleRoll = async () => {
        setError(null);
        setResult(null);
        const res = await onRoll();
        if (!res?.mega) {
            setError(res?.message || 'No se pudo sortear la mega');
            return;
        }
        setResult({ base: res.base, forms: [res.mega], mega: res.mega, rolled: true });
    };

    const handleSearch = async (pokedex) => {
        setError(null);
        setResult(null);
        const res = await onSearch(pokedex);
        if (!res?.base) {
            setError(res?.message || 'No se encontró ese Pokémon');
            return;
        }
        if (!res.forms?.length) {
            setError(`${res.base.name} no tiene mega evolución.`);
            return;
        }
        // El sorteo se hace aquí y se guarda: si se resolviera al pintar, cada
        // repintado cambiaría la mega delante del jugador.
        const mega = res.forms[Math.floor(Math.random() * res.forms.length)];
        setResult({ ...res, mega });
    };

    return (
        <div className="modal-backdrop mega-battle-backdrop" onClick={handleClose}>
            <div className={`mega-battle-modal ${!result ? 'mega-battle-modal--search' : ''}`}
                 onClick={e => e.stopPropagation()}>

                <button className="mega-battle-close" onClick={handleClose}>✕</button>

                <div className="mega-battle-header">
                    <div className="mega-battle-title">Combate Mega</div>
                    <div className="mega-battle-sub">
                        {result ? 'Listo para el combate' : 'Busca la especie de la que sale la mega'}
                    </div>
                </div>

                <button className="mega-battle-roll-btn"
                        disabled={loading}
                        onClick={handleRoll}>
                    {loading ? 'Sorteando…' : (result ? 'Tirar otra mega' : 'Sortear mega')}
                </button>

                <div className="mega-battle-alt">
                    <i /><span>o elígela</span><i />
                </div>

                <div className="mega-battle-search">
                    <PokemonNameSearch
                        className="raid-search"
                        placeholder="Especie: nombre o # Pokédex"
                        buttonLabel="Buscar mega"
                        disabled={loading}
                        onSubmit={handleSearch}
                    />
                    {loading && <div className="raid-loading">Buscando…</div>}
                    {error && <div className="raid-error">{error}</div>}
                </div>

                {result && (
                    <>
                        <div className="mega-battle-forms">
                            <div className="mega-battle-form"
                                 style={{ '--mega-type': typeColor(result.mega.type1) }}>
                                <div className="mega-battle-form-art"
                                     style={pokemonImg(result.mega) ? { backgroundImage: `url(${pokemonImg(result.mega)})` } : {}} />
                                <div className="mega-battle-form-name">{result.mega.name}</div>
                                <div className="mega-battle-form-types">
                                    <span style={{ background: typeColor(result.mega.type1) }}>{typeLabel(result.mega.type1)}</span>
                                    {result.mega.type2 && result.mega.type2 !== 'NONE' && (
                                        <span style={{ background: typeColor(result.mega.type2) }}>{typeLabel(result.mega.type2)}</span>
                                    )}
                                    <span className="mega-battle-form-lvl">Nv {result.mega.level}</span>
                                </div>
                            </div>
                        </div>

                        {result.rolled && (
                            <div className="mega-battle-roll">
                                Salió al azar entre las 94 megas del juego.
                            </div>
                        )}
                        {!result.rolled && result.forms.length > 1 && (
                            <div className="mega-battle-roll">
                                Salió al azar entre sus {result.forms.length} megas
                                ({result.forms.map(f => f.name).join(' · ')}).
                            </div>
                        )}

                        <div className="mega-battle-note">
                            Se pelea como contra un salvaje. Si le ganas podrás capturar
                            a <strong>{result.base.name}</strong> — la especie base, no la
                            forma mega.
                        </div>

                        <button className="raid-setup-btn raid-setup-btn--main"
                                disabled={loading}
                                onClick={() => onStart(result.mega.pokedex)}>
                            {loading ? 'Preparando…' : '¡Combatir!'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ModalMegaBattle;
