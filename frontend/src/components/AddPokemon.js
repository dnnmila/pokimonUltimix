import React from 'react';
import pokeball from "../images/Poke_Ball.png";
import PokemonNameSearch from './PokemonNameSearch';

const AddPokemon = ({ onAdd ,currentPlayer}) => {

    // Se puede escribir el nombre ("pika") o el número de Pokédex ("25", "A25");
    // el buscador resuelve lo escrito a un POKEDEX antes de agregarlo.
    const handleAddPokemon = (pokedex) => {
        onAdd(currentPlayer.id, pokedex);
    };

    return (
        <div className="add_pokemon pv-slot">
            <img className="Pokeball_image pv-slot-ball" src={pokeball} alt="pokeball" />
            <div className="pv-slot-title">Agregar Pokémon</div>
            <PokemonNameSearch
                layout="column"
                placeholder="Nombre o Pokédex"
                buttonLabel="Agregar"
                inputClassName="pv-slot-input"
                buttonClassName="pv-slot-button"
                clearOnSubmit
                onSubmit={handleAddPokemon}
            />
        </div>
    );
};

export default AddPokemon;
