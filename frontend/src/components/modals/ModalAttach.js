
import React ,{ useState }from 'react';


const ModalAttach = ({ show, onClose,currentPlayer,pokemonId,onAttach,attachTM,attachMega}) => {
    const [openTM, setOpenTM] = useState('false');
    const [tmType, setTmType] = useState();
    const [tmLevel, setTmLevel] = useState(0);
  

    

    if (!show) {
        return null;
    }

    const attachItemHandle = (currentPlayer,pokemonId,item) => {
        console.log('onAttach');
        console.log(currentPlayer.id +  ' pkmID '+  pokemonId + ' Item: ' + item);
        onAttach(currentPlayer.id, pokemonId,item);
        onClose();
        setOpenTM('false');
    }

    const attachTMHandle = (currentPlayer,pokemonId) => {
        console.log('Atttch TM');
        attachTM(currentPlayer.id, pokemonId,tmType,tmLevel);
        setOpenTM('false');
        onClose();
        
    }

    const attachMegaHandle = (currentPlayer,pokemonId) => {
        console.log('Atttch Mega');
        attachMega(currentPlayer.id, pokemonId);
        setOpenTM('false');
        onClose();
        
    }

    const handleTM_type = (type) => {
        setTmType(type);
    }
    const handleTM_Level = (level) => {
        setTmLevel(level);
    }

    const handleOpenTM = () => {
        setOpenTM('true');
    }
    const handleCloseTM = () => {
        setOpenTM('false');
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-attach">
               <div className='Title-modal'>Items to Attach</div>
               {openTM === 'false' && (<div className="Attach_all_options" >
               
               <div onClick={() => handleOpenTM()} className='Attach-item-option attach-MT'></div>
               <div onClick={() => attachItemHandle(currentPlayer,pokemonId,"Protein")} className='Attach-item-option attach-Protein'></div>
               <div onClick={() => attachItemHandle(currentPlayer,pokemonId,"Potion")} className='Attach-item-option attach-Potion'></div>
               <div onClick={() => attachItemHandle(currentPlayer,pokemonId,"Claw")} className='Attach-item-option attach-Claw'></div>
               <div onClick={() => attachMegaHandle(currentPlayer,pokemonId)} className='Attach-item-option attach-Mega'></div>
               <div onClick={() => attachItemHandle(currentPlayer,pokemonId,"None")} className='Attach-item-option attach-Remove'></div>
               </div> )}
               {openTM === 'true' && ( <div className='Attach-TM-options'>
                    <div className='Type-TM' >
                        <div className="TM-attack Attack_NORMAL" onClick={()=>handleTM_type("NORMAL")}></div>
                        <div className="TM-attack Attack_BUG" onClick={()=>handleTM_type("BUG")}></div>
                        <div className="TM-attack Attack_DARK" onClick={()=>handleTM_type("DARK")}></div>
                        <div className="TM-attack Attack_DRAGON" onClick={()=>handleTM_type("DRAGON")}></div>
                        <div className="TM-attack Attack_ELECTRIC" onClick={()=>handleTM_type("ELECTRIC")}></div>
                        <div className="TM-attack Attack_FAIRY" onClick={()=>handleTM_type("FAIRY")}></div>
                        <div className="TM-attack Attack_FIGHTING" onClick={()=>handleTM_type("FIGHTING")}></div>
                        <div className="TM-attack Attack_FIRE" onClick={()=>handleTM_type("FIRE")}></div>
                        <div className="TM-attack Attack_FLYING" onClick={()=>handleTM_type("FLYING")}></div>
                        <div className="TM-attack Attack_GHOST" onClick={()=>handleTM_type("GHOST")}></div>
                        <div className="TM-attack Attack_GRASS" onClick={()=>handleTM_type("GRASS")}></div>
                        <div className="TM-attack Attack_GROUND" onClick={()=>handleTM_type("GROUND")}></div>
                        <div className="TM-attack Attack_ICE" onClick={()=>handleTM_type("ICE")}></div>
                        <div className="TM-attack Attack_POISON" onClick={()=>handleTM_type("POISON")}></div>
                        <div className="TM-attack Attack_PSYCHIC" onClick={()=>handleTM_type("PSYCHIC")}></div>
                        <div className="TM-attack Attack_ROCK" onClick={()=>handleTM_type("ROCK")}></div>
                        <div className="TM-attack Attack_STEEL" onClick={()=>handleTM_type("STEEL")}></div>
                        <div className="TM-attack Attack_WATER" onClick={()=>handleTM_type("WATER")}></div>
                    </div>
                    <div className='Level-TM-options'>
                        <div className="TM-Level" onClick={()=>handleTM_Level(1)}>1</div>
                        <div className="TM-Level" onClick={()=>handleTM_Level(2)}>2</div>
                        <div className="TM-Level" onClick={()=>handleTM_Level(3)}>3</div>
                        <div className="TM-Level" onClick={()=>handleTM_Level(4)}>4</div>
                        <div className="TM-Level" onClick={()=>handleTM_Level(5)}>5</div>
                    </div>
                    <button onClick={() => attachTMHandle(currentPlayer,pokemonId)} className='close-modal'>Add TM</button>
               </div>)}
                <button onClick={onClose} className='close-modal'>close</button>
            </div>
        </div>
    );
};

export default ModalAttach;