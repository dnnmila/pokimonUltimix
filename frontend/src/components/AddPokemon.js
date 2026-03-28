import React, { useState } from 'react';
import pokeball from "../images/Poke_Ball.png";

const AddPokemon = ({ onAdd ,currentPlayer}) => {

    const [pokemonId, setPokemonId] = useState('');
    const handleAddPokemon = () => {
        onAdd(currentPlayer.id, pokemonId);
        setPokemonId(''); // Limpia el campo de entrada después de agregar
    };

   

    return (
        <div className="add_pokemon">
            <img className="Pokeball_image" src={pokeball} alt="pokeball" />
            <input
                    type="number"
                    value={pokemonId}
                    onChange={(e) => setPokemonId(e.target.value)}
                    placeholder="Número de Pokédex"
                />
                <button onClick={handleAddPokemon}>Agregar Pokémon</button>
        </div>
    );
};

export default AddPokemon;