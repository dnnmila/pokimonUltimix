import { useState, useEffect } from 'react';
import SERVER_IP from '../../config';

const getToken = (pokedex) => {
    try {
        return require(`../../images/tokens/${pokedex}.png`);
    } catch {
        return null;
    }
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
                                    <div className="pokedex-token" style={{ backgroundImage: `url(${getToken(pokemon.pokedex)})` }}></div>
                                ) : (
                                    chain.map((step, index) => {
                                        const img = getToken(step.pokedex);
                                        if (!img) return null;
                                        return (
                                            <div key={step.pokedex} className="pokedex-step">
                                                {index > 0 && (
                                                    <div className={`pokedex-arrow ${step.isMega ? 'pokedex-arrow--mega' : ''}`}>
                                                        {step.isMega ? '★' : '▶'}
                                                    </div>
                                                )}
                                                <div
                                                    className={`pokedex-token ${step.isMega ? 'pokedex-token--mega' : ''} ${index === 0 ? 'pokedex-token--current' : ''}`}
                                                    style={{ backgroundImage: `url(${img})` }}
                                                ></div>
                                            </div>
                                        );
                                    })
                                )}
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
