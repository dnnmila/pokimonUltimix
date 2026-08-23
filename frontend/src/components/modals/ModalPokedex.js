import { useState, useEffect } from 'react';
import SERVER_IP from '../../config';


const getToken = (pokedex) => {
    try {
        return require(`../../images/tokens_ultimix/${pokedex}.png`);
    } catch {
        return null;
    }
};

const TokenImg = ({ pokedex, isMega, isCurrent }) => {
    const img = getToken(pokedex);
    if (!img) return null;
    return (
        <div className="pokedex-token-wrapper">
            <div
                className={`pokedex-token ${isMega ? 'pokedex-token--mega' : ''} ${isCurrent ? 'pokedex-token--current' : ''}`}
                style={{ backgroundImage: `url(${img})` }}
            ></div>
        </div>
    );
};

// Formas que cuelgan de un eslabón en vez de continuar la cadena: megas y
// formas legendarias. Se dibujan igual —una flecha y los tokens al lado— y solo
// cambia el icono de la flecha, que es el objeto que provoca el cambio: el
// símbolo de mega para unas, el objeto legendario para las otras.
const SideForms = ({ forms, kind }) => {
    if (!forms || forms.length === 0) return null;
    return (
        <>
            <div className={`pokedex-arrow pokedex-arrow--${kind}`}></div>
            <div className="pokedex-branches">
                {forms.map(pokedex => (
                    <div key={pokedex} className="pokedex-branch-group">
                        <TokenImg pokedex={pokedex} isMega={true} />
                    </div>
                ))}
            </div>
        </>
    );
};

const ModalPokedex = ({ show, onClose, player }) => {
    const [chains, setChains] = useState({});

    useEffect(() => {
        if (!show || !player.pokemons.length) return;

        const fetchChains = async () => {
            const results = {};
            await Promise.all(
                player.pokemons.map(async (pokemon) => {
                    const res = await fetch(`${SERVER_IP}/get-evolution-chain`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pokedexId: pokemon.pokedex })
                    });
                    const chain = await res.json();
                    results[pokemon.id] = chain;
                })
            );
            setChains(results);
        };

        fetchChains();
    }, [show, player]);

    if (!show) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-pokedex">
                <div className="Title-modal">Pokédex — {player.name}</div>

                <div className="pokedex-list">
                    {player.pokemons.map((pokemon) => {
                        const chain = chains[pokemon.id];

                        return (
                            <div key={pokemon.id} className="pokedex-row">
                                {!chain ? (
                                    <TokenImg pokedex={pokemon.pokedex} isCurrent />
                                ) : Array.isArray(chain) ? (
                                    chain.map((step, index) => (
                                        <div key={step.pokedex} className="pokedex-step">
                                            {index > 0 && <div className="pokedex-arrow">▶</div>}
                                            <TokenImg pokedex={step.pokedex} isCurrent={index === 0} />
                                            {/* GMax — inline */}
                                            {step.gmax && (
                                                <>
                                                    <div className="pokedex-arrow pokedex-arrow--gmax"></div>
                                                    <TokenImg pokedex={step.gmax} />
                                                </>
                                            )}
                                            {/* Megas y formas legendarias — separadas */}
                                            <SideForms forms={step.megas} kind="mega" />
                                            <SideForms forms={step.legendaries} kind="legend" />
                                            {/* Ramas de evolución */}
                                            {step.branches && step.branches.length > 0 && (
                                                <>
                                                    <div className="pokedex-arrow">▶</div>
                                                    <div className="pokedex-branches">
                                                        {step.branches.map(branch => (
                                                            <div key={branch.pokedex} className="pokedex-branch-group">
                                                                <TokenImg pokedex={branch.pokedex} />
                                                                {branch.gmax && (
                                                                    <>
                                                                        <div className="pokedex-arrow pokedex-arrow--gmax"></div>
                                                                        <TokenImg pokedex={branch.gmax} />
                                                                    </>
                                                                )}
                                                                <SideForms forms={branch.megas} kind="mega" />
                                                                <SideForms forms={branch.legendaries} kind="legend" />
                                                                {branch.nextEvolution && (
                                                                    <>
                                                                        <div className="pokedex-arrow">▶</div>
                                                                        <TokenImg pokedex={branch.nextEvolution} />
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                ) : null}
                            </div>
                        );
                    })}
                </div>

                <button className="pokedex-close" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalPokedex;
