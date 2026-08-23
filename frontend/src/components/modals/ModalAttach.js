
import React ,{ useState }from 'react';
import POKEMON_TYPES from '../../pokemonTypes';
import { ATTACH_ITEMS } from '../../attachItems';
import imgRemove from '../../images/delete.png';
import ModalTMCatalog from './ModalTMCatalog';
import ModalZCatalog from './ModalZCatalog';
import ModalTeraCatalog from './ModalTeraCatalog';
import ModalEquipCatalog from './ModalEquipCatalog';
import ModalLegendaryChoice from './ModalLegendaryChoice';
import { tmPowerFor } from '../../data/tms';
import { legendaryFormsFor, legendaryUse } from '../../data/legendaryEvos';

const TM_POWERS = [1,2,3,4,5];

const ModalAttach = ({ show, onClose,currentPlayer,pokemonId,onAttach,attachTM,attachMega,attachTera,attachEquip,attachLegendary}) => {
    const [openTM, setOpenTM] = useState('false');
    const [tmType, setTmType] = useState();
    const [tmLevel, setTmLevel] = useState(0);
    const [showCatalog, setShowCatalog] = useState(false);
    const [showZ, setShowZ] = useState(false);
    const [showTera, setShowTera] = useState(false);
    const [showEquip, setShowEquip] = useState(false);
    const [showLegend, setShowLegend] = useState(false);
  

    

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
        setShowTera(false);
        setShowEquip(false);
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

    // El orbe no crea ataque: solo marca el Pokémon con el tipo elegido, y es la
    // batalla la que decide si sube teracristalizado.
    const attachTeraHandle = (orb) => {
        attachTera(currentPlayer.id, pokemonId, orb.id);
        setShowTera(false);
        setOpenTM('false');
        onClose();
    };

    // El objeto de equipo tampoco crea ataque ni cambia al Pokémon: se guarda
    // cuál es y ya la batalla le suma el +1 a los ataques de su tipo.
    const attachEquipHandle = (item) => {
        attachEquip(currentPlayer.id, pokemonId, item.id);
        setShowEquip(false);
        setOpenTM('false');
        onClose();
    };

    const attachMegaHandle = (currentPlayer,pokemonId) => {
        console.log('Atttch Mega');
        attachMega(currentPlayer.id, pokemonId);
        setOpenTM('false');
        onClose();

    }

    // Para qué le sirve el objeto legendario a este Pokémon: 'form' (lo
    // transforma), 'evolve' (le habilita la evolución, Zygarde) o null.
    const legendKind  = legendaryUse(targetPokemon);
    // Formas que admite. Un Pokémon ya transformado sigue devolviendo las de su
    // base, que es lo que deja pasar de Black a White Kyurem sin quitarle antes
    // el objeto. Vacío para Zygarde: ahí el objeto no monta ninguna forma.
    const legendForms = legendaryFormsFor(targetPokemon);

    const attachLegendaryHandle = (formPokedex) => {
        attachLegendary(currentPlayer.id, pokemonId, formPokedex);
        setShowLegend(false);
        setOpenTM('false');
        onClose();
    };

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
        if (item.kind === 'tera') return setShowTera(true);
        if (item.kind === 'equip') return setShowEquip(true);
        if (item.kind === 'mega') return attachMegaHandle(currentPlayer, pokemonId);
        if (item.kind === 'legend') {
            // Zygarde: el objeto no monta ninguna forma, solo se queda puesto
            // para habilitar la evolución. Es un adjuntar normal y corriente.
            if (legendKind === 'evolve') {
                return attachItemHandle(currentPlayer, pokemonId, item.id);
            }
            // Con una sola forma no hay nada que elegir: se pone y ya. El
            // selector solo tiene sentido para Kyurem y Necrozma.
            return legendForms.length === 1
                ? attachLegendaryHandle(legendForms[0].pokedex)
                : setShowLegend(true);
        }
        attachItemHandle(currentPlayer, pokemonId, item.id);
    };

    // Qué cartas ve el jugador. Las dos que se filtran son las que dependen de
    // la especie:
    //
    //   'legend' → solo a quien le sirve de algo (ver legendaryUse).
    //   'mega'   → a esos mismos se les esconde. Kyogre, Groudon, Hoopa, Kyurem
    //              y las fases de Zygarde vienen marcados como mega en la base
    //              de datos, pero lo suyo lo hace ahora el objeto legendario:
    //              dejar la piedra ahí sería ofrecer un camino muerto.
    const items = ATTACH_ITEMS.filter(item => {
        if (item.kind === 'legend') return legendKind !== null;
        if (item.kind === 'mega')   return legendKind === null;
        return true;
    });

    return (
        <div className="modal-backdrop">
            <div className="modal-attach">
               <div className='Title-modal'>Items to Attach</div>
               {openTM === 'false' && (<div className="Attach_all_options" >
               {items.map(item => (
                   <div key={item.id}
                        className={`Attach-item-card Attach-item-card--${item.kind}`}
                        title={item.es}
                        onClick={() => handlePick(item)}>
                       <div className='Attach-item-icon' style={item.img ? { backgroundImage: `url(${item.img})` } : undefined}></div>
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

            <ModalTeraCatalog
                show={showTera}
                onClose={() => setShowTera(false)}
                onPick={attachTeraHandle}
                pokemon={targetPokemon}
            />

            <ModalEquipCatalog
                show={showEquip}
                onClose={() => setShowEquip(false)}
                onPick={attachEquipHandle}
                pokemon={targetPokemon}
            />

            <ModalLegendaryChoice
                show={showLegend}
                options={legendForms}
                onSelect={attachLegendaryHandle}
                onClose={() => setShowLegend(false)}
            />
        </div>
    );
};

export default ModalAttach;