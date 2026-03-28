import React  from 'react';


const SelectPokemonBattle1 = ({ show, onClose, CurrentPlayer,setActiveModal,setMyPokemon}) => {


  

    const handleSelectMyPokemon = (pokemon) => {
        setMyPokemon(pokemon);
        console.log(pokemon.name);
        setActiveModal('selectPokemonRival');
    };

   

    if (!show) {
        return null;
    }


    return (
        <div className="modal-backdrop">
            <div className="modal">
                <div>Battle </div>
                <div>
                    {CurrentPlayer.pokemons.map((pokemon) => {
                        return (
                            <button key={pokemon.id} onClick={() => handleSelectMyPokemon(pokemon)}>
                                {pokemon.name}
                            </button>
                        );
                    })}
                </div>
                <button onClick={onClose}>Close</button>
            </div>
    

        </div>
    );
            }

export default SelectPokemonBattle1;