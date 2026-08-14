
import React ,{ useState }from 'react';
import POKEMON_TYPES from '../../pokemonTypes';
import { ATTACH_ITEMS } from '../../attachItems';
import imgRemove from '../../images/delete.png';

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

    // Cada tarjeta despacha según el tipo de item: el TM abre su sub-panel y la
    // mega tiene su propio endpoint; el resto se adjunta por id.
    const handlePick = (item) => {
        if (item.kind === 'tm')   return handleOpenTM();
        if (item.kind === 'mega') return attachMegaHandle(currentPlayer, pokemonId);
        attachItemHandle(currentPlayer, pokemonId, item.id);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-attach">
               <div className='Title-modal'>Items to Attach</div>
               {openTM === 'false' && (<div className="Attach_all_options" >
               {ATTACH_ITEMS.map(item => (
                   <div key={item.id}
                        className={`Attach-item-card Attach-item-card--${item.kind}`}
                        title={item.es}
                        onClick={() => handlePick(item)}>
                       <div className='Attach-item-icon' style={{ backgroundImage: `url(${item.img})` }}></div>
                       <span className='Attach-item-name'>{item.label}</span>
                   </div>
               ))}
               <div className='Attach-item-card Attach-item-card--remove'
                    title='Quitar el item adjunto'
                    onClick={() => attachItemHandle(currentPlayer,pokemonId,"None")}>
                   <div className='Attach-item-icon' style={{ backgroundImage: `url(${imgRemove})` }}></div>
                   <span className='Attach-item-name'>Quitar</span>
               </div>
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