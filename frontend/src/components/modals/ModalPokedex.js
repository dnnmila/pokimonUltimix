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
                                            {/* Megas — separadas */}
                                            {step.megas && step.megas.length > 0 && (
                                                <>
                                                    <div className="pokedex-arrow pokedex-arrow--mega"></div>
                                                    <div className="pokedex-branches">
                                                        {step.megas.map(megaPokedex => (
                                                            <div key={megaPokedex} className="pokedex-branch-group">
                                                                <TokenImg pokedex={megaPokedex} isMega={true} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
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
                                                                {branch.megas && branch.megas.length > 0 && (
                                                                    <>
                                                                        <div className="pokedex-arrow pokedex-arrow--mega"></div>
                                                                        <div className="pokedex-branches">
                                                                            {branch.megas.map(megaPokedex => (
                                                                                <div key={megaPokedex} className="pokedex-branch-group">
                                                                                    <TokenImg pokedex={megaPokedex} isMega={true} />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </>
                                                                )}
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
