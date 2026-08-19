import React, { useState, useRef, useEffect } from 'react';
import { PROPS, propForDie } from '../../data/pokeStar.js';

// Montaje de Poké Star Studios.
//
// Solo el dado: un D6 decide contra cuál de los seis Prop Pokémon se rueda, y
// se puede marcar la cara que salió en la mesa o dejar que tire la tablet.
//
// Con quién se rueda NO se elige aquí: se elige en la pantalla de selección de
// combatientes, la de siempre, y el Prop se pone a ese nivel en ese momento
// (SimPlayer.handleSelectMyPokemon). Preguntarlo dos veces solo daba pie a que
// no coincidieran.
//
// A partir de ahí es una batalla salvaje corriente, con dos salvedades que pone
// la carta y resuelve SimPlayer: no se captura (es un actor de estudio) y nadie
// se queda debilitado — los Pokémon que caen se reaniman al acabar el rodaje.
// Subir de nivel sí se puede.

const ROLL_MS = 700;

const ModalPokeStar = ({
    show,
    onClose,
    tokenImg,
    onStart,          // (pokedex) => void
    loading = false,
    error = null,
    onOpenRules,
}) => {
    const [die, setDie] = useState(null);
    const [rolling, setRolling] = useState(false);
    const spinRef = useRef(null);

    useEffect(() => () => clearInterval(spinRef.current), []);

    if (!show) return null;

    const reset = () => {
        clearInterval(spinRef.current);
        spinRef.current = null;
        setDie(null); setRolling(false);
    };

    const handleClose = () => { reset(); onClose(); };

    // Tirada de la tablet, para quien no quiera sacar el dado de la caja
    const handleRoll = () => {
        if (rolling) return;
        setRolling(true);
        spinRef.current = setInterval(() => setDie(1 + Math.floor(Math.random() * 6)), 80);
        setTimeout(() => {
            clearInterval(spinRef.current);
            spinRef.current = null;
            setDie(1 + Math.floor(Math.random() * 6));
            setRolling(false);
        }, ROLL_MS);
    };

    const prop = propForDie(die);

    return (
        <div className="modal-backdrop pokestar-backdrop" onClick={handleClose}>
            <div className="pokestar-modal" onClick={e => e.stopPropagation()}>

                <button className="pokestar-close" onClick={handleClose}>✕</button>

                <div className="pokestar-header">
                    <div className="pokestar-title">Poké Star Studios</div>
                    <div className="raid-help" title="Ver las reglas del rodaje"
                         onClick={onOpenRules}>?</div>
                    <div className="pokestar-sub">
                        {!prop
                            ? 'Tira el D6: sale contra qué Prop Pokémon se rueda'
                            : `Ruedas contra ${prop.name}, al nivel del Pokémon que saques`}
                    </div>
                </div>

                <button className="pokestar-roll-btn"
                        disabled={rolling || loading}
                        onClick={handleRoll}>
                    {rolling ? 'Rodando el dado…' : die ? 'Tirar otra vez' : 'Tirar el D6'}
                </button>

                <div className="raid-setup-alt">
                    <i /><span>o marca lo que salió</span><i />
                </div>

                {/* La tabla de la carta: seis caras, seis actores */}
                <div className="pokestar-chart">
                    {PROPS.map(p => (
                        <div key={p.die}
                             className={`pokestar-prop ${die === p.die ? 'is-on' : ''} ${rolling ? 'is-rolling' : ''}`}
                             onClick={() => !rolling && setDie(p.die)}>
                            <div className={`pokestar-prop-die mydice${p.die}`} />
                            <div className="pokestar-prop-art"
                                 style={tokenImg(p.pokedex) ? { backgroundImage: `url(${tokenImg(p.pokedex)})` } : {}} />
                            <div className="pokestar-prop-name">{p.name}</div>
                            <div className="pokestar-prop-moves">{p.moves}</div>
                        </div>
                    ))}
                </div>

                {error && <div className="raid-error">{error}</div>}

                <div className="raid-search-note">
                    El Prop pelea al nivel del Pokémon que elijas en la pantalla de
                    combatientes, y ahí puedes cambiarlo las veces que quieras. Nadie se
                    queda debilitado en el rodaje —los que caigan se reaniman al acabar— y
                    al Prop no se le captura. Subir de nivel sí se puede.
                </div>

                <div className="raid-setup-actions">
                    <button className="raid-setup-btn raid-setup-btn--main"
                            disabled={!prop || rolling || loading}
                            onClick={() => onStart(prop.pokedex)}>
                        {loading ? 'Preparando el set…' : '¡Acción!'}
                    </button>
                    <button className="raid-setup-btn raid-setup-btn--ghost" onClick={handleClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalPokeStar;
