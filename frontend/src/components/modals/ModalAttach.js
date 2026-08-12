
import React ,{ useState }from 'react';
import POKEMON_TYPES from '../../pokemonTypes';

const TM_POWERS = [1,2,3,4,5];

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
        setTmType(undefined);
        setTmLevel(0);
        setOpenTM('true');
    }
    const handleCloseTM = () => {
        setOpenTM('false');
    }

    const tmReady = tmType !== undefined && tmLevel > 0;

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
                    <div className='TM-preview'>
                        {tmType
                            ? <div className={`TM-preview-icon Attack_${tmType}`}></div>
                            : <div className='TM-preview-icon TM-preview-icon--empty'>?</div>}
                        <div className='TM-preview-text'>
                            <div className={`TM-preview-type ${!tmType ? 'TM-preview--placeholder' : ''}`}>
                                {tmType || 'Elige un tipo'}
                            </div>
                            <div className={`TM-preview-power ${tmLevel === 0 ? 'TM-preview--placeholder' : ''}`}>
                                {tmLevel > 0 ? `Power ${tmLevel}` : 'Elige el power'}
                            </div>
                        </div>
                    </div>
                    <div className='Type-TM' >
                        {POKEMON_TYPES.map(type => (
                            <div key={type}
                                 className={`TM-attack Attack_${type} ${tmType === type ? 'TM-attack--selected' : ''}`}
                                 onClick={()=>handleTM_type(type)}></div>
                        ))}
                    </div>
                    <div className='Level-TM-options'>
                        {TM_POWERS.map(level => (
                            <div key={level}
                                 className={`TM-Level ${tmLevel === level ? 'TM-Level--selected' : ''}`}
                                 onClick={()=>handleTM_Level(level)}>{level}</div>
                        ))}
                    </div>
                    <div className='TM-actions'>
                        <button onClick={handleCloseTM} className='TM-back-btn'>Volver</button>
                        <button onClick={() => attachTMHandle(currentPlayer,pokemonId)}
                                className='TM-add-btn'
                                disabled={!tmReady}>Add TM</button>
                    </div>
               </div>)}
                <button onClick={onClose} className='close-modal'>close</button>
            </div>
        </div>
    );
};

export default ModalAttach;