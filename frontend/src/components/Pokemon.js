import React, {useState} from 'react';
import Types from './Types';
import ModalAttach from './modals/ModalAttach';

const Pokemon = ({  id,name,level,extra,nextLevel,evolution,type1,type2,pokedex ,state,status,attached, onDelete , currentPlayer , onIncreaseLevel, onEvolvePokemon,onAttach,attachTM,attachMega,onChangeState,onChangeStatus}) => {
   
    const img_id = `img_${id}`;
    const level_id = `level_${id}`;
    const name_id = `name_${id}`;
    const type_id1 = `types_${id}_1`;
    const type_id2 = `types_${id}_2`;
    const delete_id = `delete_${id}`;
    //Ajuste de pokedes quitando un 0 ultimixdnn
    const imageUrl = require(`../images/POKEMON/${pokedex}.png`);
    const box_id = `div_${id}`;

    const type1_class = `type_${type1}`;
    const type2_class = `type_${type2}`;


    let type2_true=false;
    if(type2 === "NONE"){
        type2_true=false;
    }
    else{
        type2_true=true;
    }

    const handleDeletePokemon = () => {
        onDelete(currentPlayer.id, id);
        // Limpia el campo de entrada después de agregar
    };

    const handleEvolvePokemon = () => {
        console.log(evolution);
        onEvolvePokemon(currentPlayer.id, id , evolution);
        // Limpia el campo de entrada después de agregar
    };

    const handleIncreaseLevel = () => {
        console.log ('Player ID: ' + currentPlayer.id);
        console.log ('pokemon ID :' + id);
        onIncreaseLevel(currentPlayer.id,id)
    }


    const [showModalAttach, setShowModalAttach] = useState(false);


    const handleOpenModalAttach = () => {
        setShowModalAttach(true);
    };

    const handleCloseModalAttach = () => {
        setShowModalAttach(false);
    };

    const getAttachedClass = (attached) => {
        switch (attached) {
            case "MT":
                return "attached-mt";
            case "Protein":
                return "attached-protein";
            case "Potion":
                return "attached-potion";
            case "Claw":
                return "attached-claw";
            case "Mega":
                return "attached-mega";
            default:
                return "attached-none";
        }
    };

    const handleChangeState = ()=> {
         onChangeState(currentPlayer.id, id);
    }
    const handleChangeStatus = ()=> {
        if(status ==="Normal"){
        onChangeStatus(currentPlayer.id, id, "Asleep");
        }
        else if(status ==="Asleep"){
            onChangeStatus(currentPlayer.id, id, "Paralized");
        }
        else if(status ==="Paralized"){
            onChangeStatus(currentPlayer.id, id, "Frozen");
        }
        else if(status ==="Frozen"){
            onChangeStatus(currentPlayer.id, id, "Poisoned");
        }
        else if(status ==="Poisoned"){
            onChangeStatus(currentPlayer.id, id, "Confused");
        }
        else if(status ==="Confused"){
            onChangeStatus(currentPlayer.id, id, "Burned");
        }
        else if(status ==="Burned"){
            onChangeStatus(currentPlayer.id, id, "Normal");
        }
        else {
            onChangeStatus(currentPlayer.id, id, "Normal");
        }
   }


    return (
        <div className="pokemon" id={box_id} >
            <div className={state === "Alive" ? "img_pokemon" : "img_pokemon_dead" }  id={img_id} style={{ backgroundImage: `url(${imageUrl})`}} onClick={()=>handleChangeState()}> </div>
            <div className= "level_total" id={level_id} onClick={handleIncreaseLevel}> 
            <h1 className="level_pokemon" > {level}</h1>
            {extra > 0 && <h1 className="level_extra"> + {extra} </h1>}
            </div>
            {extra >= nextLevel && nextLevel !== 0 && <div className="button_evolve" onClick={handleEvolvePokemon}> </div>}
            <h1 className="name_pokemon" id={name_id}> {name}</h1>
            <div className={`status_pokemon ${status}`} onClick={handleChangeStatus} ></div>
            <div className="types_div"> 
            <Types Type={type1}  Clase={type1_class} type_id={type_id1}/>
            { type2_true === true && <Types Type={type2}  Clase={type2_class} type_id={type_id2}/>}
            </div>
            {attached === "None" && <div className="attath_button" onClick={handleOpenModalAttach}>Attach</div>}
              {attached !== "None" && (
                <div className={`attached-item ${getAttachedClass(attached)}` } onClick={handleOpenModalAttach}></div>
            )}
            <div className="delete_pokemon" id={delete_id} onClick={handleDeletePokemon} > </div>

            <ModalAttach show={showModalAttach} onClose={handleCloseModalAttach} currentPlayer={currentPlayer} pokemonId={id} onAttach={onAttach} attachTM={attachTM} attachMega={attachMega}/>
        </div>
    )
};

export default Pokemon;