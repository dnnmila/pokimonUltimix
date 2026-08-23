import React, {useState} from 'react';
import Types from './Types';
import ModalAttach from './modals/ModalAttach';
import ModalEvolveChoice from './modals/ModalEvolveChoice';
import SERVER_IP from '../config';
import { attachIconStyle, attachLabel } from '../attachItems';
import PokemonName from './PokemonName';

const Pokemon = ({  id,name,mote,level,extra,nextLevel,evolution,type1,type2,pokedex ,state,status,statusCounter,attached,teraType,equipItem,mega, onDelete , currentPlayer , onIncreaseLevel, onEvolvePokemon,onAttach,attachTM,attachMega,attachTera,attachEquip,attachLegendary,onChangeState,onChangeStatus,onDecreaseStatusCounter}) => {
   
    const img_id = `img_${id}`;
    const level_id = `level_${id}`;
    const name_id = `name_${id}`;
    const type_id1 = `types_${id}_1`;
    const type_id2 = `types_${id}_2`;
    const delete_id = `delete_${id}`;
    const getImageUrl = (id, forceToken = false) => {
        if (forceToken) {
            try { return require(`../images/tokens_ultimix/${id}.png`); } catch { return null; }
        }
        try {
            return require(`../images/POKEMON/${id}.png`);
        } catch {
            try { return require(`../images/tokens_ultimix/${id}.png`); } catch { return null; }
        }
    };
    const imageUrl = getImageUrl(pokedex, nextLevel === -1);
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

    // Fases 'evo' (Zygarde 10%/50%): solo evolucionan si llevan puesto el objeto
    // legendario, que se gasta al hacerlo. Antes lo hacía la mega piedra, y se
    // sigue aceptando por las partidas que ya tuvieran un Zygarde con ella.
    const canEvolveWithStone = mega === 'evo' && (attached === 'LegendEvo' || attached === 'Mega');

    const handleEvolvePokemon = async () => {
        if (nextLevel === -1) {
            onEvolvePokemon(currentPlayer.id, id, evolution);
            return;
        }
        try {
            const res = await fetch(`${SERVER_IP}/get-possible-evolutions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pokedexId: pokedex }),
            });
            const options = await res.json();
            if (options.length === 1) {
                onEvolvePokemon(currentPlayer.id, id, options[0].POKEDEX);
            } else if (options.length > 1) {
                setEvolveOptions(options);
                setShowEvolveModal(true);
            } else {
                onEvolvePokemon(currentPlayer.id, id, evolution);
            }
        } catch (e) {
            onEvolvePokemon(currentPlayer.id, id, evolution);
        }
    };

    const handleEvolveSelect = (newPokedex) => {
        setShowEvolveModal(false);
        onEvolvePokemon(currentPlayer.id, id, newPokedex);
    };

    const handleIncreaseLevel = () => {
        console.log ('Player ID: ' + currentPlayer.id);
        console.log ('pokemon ID :' + id);
        onIncreaseLevel(currentPlayer.id, id, { source: 'manual-master' })
    }


    const [showModalAttach, setShowModalAttach] = useState(false);
    const [showEvolveModal, setShowEvolveModal] = useState(false);
    const [evolveOptions, setEvolveOptions] = useState([]);


    const handleOpenModalAttach = () => {
        setShowModalAttach(true);
    };

    const handleCloseModalAttach = () => {
        setShowModalAttach(false);
    };


    const handleChangeState = () => {
        onChangeState(currentPlayer.id, id, { source: 'manual-master' });
    }
    const handleDecreaseStatusCounter = () => {
        onDecreaseStatusCounter(currentPlayer.id, id);
    };

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


    const isAlive = state === "Alive";
    const canEvolve = (extra >= nextLevel && nextLevel > 0) || nextLevel === -1 || canEvolveWithStone;

    return (
        // El tipo principal tiñe el borde y el fondo de la tarjeta
        <div className={`pokemon pv-card pv-card--${type1}${isAlive ? '' : ' pv-card--fainted'}`} id={box_id} >

            {/* ── Zona de arte: sprite sobre el fondo del tipo ──────────────── */}
            <div className="pv-card-art">
                <div className={`pv-card-sprite ${isAlive ? "img_pokemon" : "img_pokemon_dead"}`}
                     id={img_id}
                     style={{ backgroundImage: `url(${imageUrl})`}}
                     title={isAlive ? 'Debilitar' : 'Revivir'}
                     onClick={()=>handleChangeState()}> </div>

                {/* Esquina sup. izquierda: estado alterado (click = siguiente) */}
                <div className="pv-card-status">
                    <div className={`status_pokemon ${status}`} title={status} onClick={handleChangeStatus} ></div>
                    {statusCounter > 0 && <div className="status_counter" title='Bajar contador' onClick={handleDecreaseStatusCounter}>{statusCounter}</div>}
                </div>

                {/* Esquina sup. derecha: vivo / debilitado */}
                <div className={`pv-card-state ${isAlive ? 'is-alive' : 'is-fainted'}`}
                     title={isAlive ? 'Debilitar' : 'Revivir'}
                     onClick={()=>handleChangeState()} />

                {canEvolve && <div className="pv-card-evolve button_evolve" title='Evolucionar' onClick={handleEvolvePokemon}> </div>}
            </div>

            {/* ── Zona de datos ────────────────────────────────────────────── */}
            <div className="pv-card-info">
                <div className="pv-card-head">
                    {/* La carta recibe los campos sueltos, no el objeto, así que
                        se le rearma lo justo para resolver el mote */}
                    <PokemonName pkm={{ name, mote }} className="pv-card-name" id={name_id} />
                    <div className="pv-card-level level_total" id={level_id} title='Subir nivel' onClick={handleIncreaseLevel}>
                        <span className="pv-card-level-value">{level}</span>
                        {extra > 0 && <span className="pv-card-level-extra">+{extra}</span>}
                        {nextLevel > 0 && <span className="pv-card-level-next">→{nextLevel}</span>}
                    </div>
                </div>

                <div className="pv-card-types types_div">
                    <Types Type={type1}  Clase={type1_class} type_id={type_id1}/>
                    { type2_true === true && <Types Type={type2}  Clase={type2_class} type_id={type_id2}/>}
                </div>

                <div className="pv-card-actions">
                    {attached === "None"
                        ? <div className="pv-card-attach" onClick={handleOpenModalAttach}>Adjuntar</div>
                        : <div className="pv-card-attached attached-item"
                               style={attachIconStyle(attached, { teraType, equipItem })}
                               title={attachLabel(attached, { teraType, equipItem })}
                               onClick={handleOpenModalAttach}></div>}
                    <div className="pv-card-delete delete_pokemon" id={delete_id} title='Quitar del equipo' onClick={handleDeletePokemon} > </div>
                </div>
            </div>

            <ModalAttach show={showModalAttach} onClose={handleCloseModalAttach} currentPlayer={currentPlayer} pokemonId={id} onAttach={onAttach} attachTM={attachTM} attachMega={attachMega} attachTera={attachTera} attachEquip={attachEquip} attachLegendary={attachLegendary}/>
            <ModalEvolveChoice show={showEvolveModal} options={evolveOptions} onSelect={handleEvolveSelect} onClose={() => setShowEvolveModal(false)} />
        </div>
    )
};

export default Pokemon;