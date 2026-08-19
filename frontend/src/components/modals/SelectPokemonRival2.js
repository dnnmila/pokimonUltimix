import React from 'react';
import PokemonName from '../PokemonName';


const SelectPokemonRival2 = ({ show, onClose,setActiveModal, setRivalPokemon,Rival}) => {



    if (!show) {
        return null;
    }

    const handleSelectRivalPokemon = (pokemon) => {
        setRivalPokemon(pokemon);
        console.log(pokemon.name);
        setActiveModal('battle');
    };


    return (
        <div className="modal-backdrop">
        <div className="modal">
            <div>Battle </div>
            <div>
                {Rival.pokemons.map((pokemon) => {
                    return (
                        <button key={pokemon.id} onClick={() => handleSelectRivalPokemon(pokemon)}>
                            <PokemonName pkm={pokemon} />
                        </button>
                    );
                })}
            </div>
            <button onClick={onClose}>Close</button>
        </div>


    </div>
    );
};

export default SelectPokemonRival2;