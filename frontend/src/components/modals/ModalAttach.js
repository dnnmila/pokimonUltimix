
import React ,{ useState }from 'react';
import POKEMON_TYPES from '../../pokemonTypes';
import { ATTACH_ITEMS } from '../../attachItems';
import imgRemove from '../../images/delete.png';
import ModalTMCatalog from './ModalTMCatalog';
import ModalZCatalog from './ModalZCatalog';
import { tmPowerFor } from '../../data/tms';

const TM_POWERS = [1,2,3,4,5];

const ModalAttach = ({ show, onClose,currentPlayer,pokemonId,onAttach,attachTM,attachMega}) => {
    const [openTM, setOpenTM] = useState('false');
    const [tmType, setTmType] = useState();
    const [tmLevel, setTmLevel] = useState(0);
    const [showCatalog, setShowCatalog] = useState(false);
    const [showZ, setShowZ] = useState(false);
  

    

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

    // El tipo y el poder van explícitos porque los catálogos adjuntan en el
    // mismo clic con el que eligen la carta: si leyeran el estado, aún tendrían
    // los valores previos al setState.
    const doAttachTM = (type, level, extra) => {
        console.log('Atttch TM');
        attachTM(currentPlayer.id, pokemonId, type, level, extra);
        setShowCatalog(false);
        setShowZ(false);
        setOpenTM('false');
        onClose();
    }

    // Selección a mano: el ataque queda con el nombre genérico "TM", como antes,
    // y sin metadatos de carta (el poder lo fija el jugador, no una carta).
    const attachTMHandle = () => doAttachTM(tmType, tmLevel, {});

    // El Pokémon destino hace falta para resolver ambos catálogos: el bono de
    // tipo de las MTs y el movimiento especial de los cristales Z.
    const targetPokemon = currentPlayer?.pokemons?.find(p => p.id === pokemonId);

    // Selección desde el catálogo: viajan el nombre real del movimiento, el
    // poder ya resuelto (carta +1 si le toca el bono) y además el poder impreso
    // y la elegibilidad, que el backend guarda para recalcular el bono cuando
    // el Pokémon evolucione.
    const attachTMFromCatalog = (tm) =>
        doAttachTM(tm.tipo.toUpperCase(), tmPowerFor(tm, targetPokemon), {
            tmName: tm.nombre,
            tmBase: tm.poder,
            tmBono: tm.stab,
        });

    // Cristal Z: se adjunta el movimiento ya resuelto para este Pokémon, y
    // viaja también la tabla del cristal (genérico + especiales) para que la
    // evolución pueda volver a resolverlo — un Dartrix con Ghostium Z lleva el
    // genérico, pero al evolucionar a Decidueye le toca Sinister Arrow Raid.
    const attachZFromCatalog = (crystal, mov) =>
        doAttachTM(crystal.tipo.toUpperCase(), mov.poder, {
            tmName: mov.nombre,
            attachAs: 'Z',
            zData: {
                cristal: crystal.cristal,
                generico: crystal.generico,
                poderGenerico: crystal.poder,
                especiales: crystal.especiales
                    .filter(e => e.activo !== false)
                    .map(({ pokemon, nombre, poder }) => ({ pokemon, nombre, poder })),
            },
        });

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

    // Cada tarjeta despacha según el tipo de item: el TM abre su sub-panel, el
    // cristal Z su selector, y la mega tiene su propio endpoint; el resto se
    // adjunta por id.
    const handlePick = (item) => {
        if (item.kind === 'tm')   return handleOpenTM();
        if (item.kind === 'z')    return setShowZ(true);
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
                    <button onClick={() => setShowCatalog(true)} className='TM-catalog-btn'>
                        Elegir del catálogo
                    </button>
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
                        <button onClick={attachTMHandle}
                                className='TM-add-btn'
                                disabled={!tmReady}>Add TM</button>
                    </div>
               </div>)}
                <button onClick={onClose} className='close-modal'>close</button>
            </div>

            <ModalTMCatalog
                show={showCatalog}
                onClose={() => setShowCatalog(false)}
                onPick={attachTMFromCatalog}
                pokemon={targetPokemon}
            />

            <ModalZCatalog
                show={showZ}
                onClose={() => setShowZ(false)}
                onPick={attachZFromCatalog}
                pokemon={targetPokemon}
            />
        </div>
    );
};

export default ModalAttach;