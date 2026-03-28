import React,{useState} from 'react';
import SelectPokemonBattle1 from './SelectPokemonBattle1';
import SelectPokemonRival2 from './SelectPokemonRival2';
import ModalStadium from './ModalStadium';

const ModalWildPokemon = ({ show, onClose, game,setShowModalBattle }) => {
   

    if (!show) {
        return null;
    }


    return (
        <div className="modal-backdrop">
            <div>Wild Pokemon</div>
           
                    <button onClick={onClose}>Close</button>
        
        </div>
    );
};


export default ModalWildPokemon;