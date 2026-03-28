import React,{useState} from 'react';
import Types from '../Types';
import Attack from '../Attacks';
import ModalStadium2 from './ModalStadium2';

//Modal to selec the attacks


const ModalStadium = ({ show, onClose,myPokemon,rivalPokemon}) => {
    const myPokemonImg = require(`../../images/POKEMON/0${myPokemon.pokedex}.png`);
    const rivalPokemonImg = require(`../../images/POKEMON/0${rivalPokemon.pokedex}.png`);
    const MyPkm_type1_class = `type_${myPokemon.type1}`;
    const MyPkm_type2_class = `type_${myPokemon.type2}`;
    const MyPkm_type_id1 = `types_${myPokemon.id}_1`;
    const MyPkm_type_id2 = `types_${myPokemon.id}_2`;
    const RivalPkm_type1_class = `type_${rivalPokemon.type1}`;
    const RivalPkm_type2_class = `type_${rivalPokemon.type2}`;
    const RivalPkm_type_id1 = `types_${rivalPokemon.id}_1`;
    const RivalPkm_type_id2 = `types_${rivalPokemon.id}_2`;


    const [myAttack, setMyAttack] = useState();
    const [myBonus, setMyBonus] = useState();
    const [rivalAttack, setRivalAttack] = useState(0);
    const [rivalBonus, setRivalBonus] = useState(0);
    const [attacksSelected, setAttackSelected] = useState(false);

    const handleSelectMyAttack =(attack,bonus) =>{
        setMyAttack(attack);
        setMyBonus(bonus);
        console.log(myAttack);
        }
    const handleSelectRivalAttack =(attack,bonus) =>{
        setRivalAttack(attack);
        setRivalBonus(bonus);
        setAttackSelected(true)
        console.log(rivalAttack);
    }



    
    
  

    

    if (!show) {
        return null;
    }

    function checkBonusType(Attack_type,PkmRival_type){
        if (Attack_type === "NORMAL" && (PkmRival_type === "STEEL" || PkmRival_type === "GHOST" || PkmRival_type === "ROCK")) 
            return -2;
        if (Attack_type === "GRASS"){
            if (PkmRival_type === "GROUND" || PkmRival_type === "WATER" || PkmRival_type === "ROCK")
                return 2;
            if(PkmRival_type === "POISON" || PkmRival_type === "BUG" || PkmRival_type === "GRASS" || PkmRival_type === "FIRE" || PkmRival_type === "DRAGON" || PkmRival_type === "FLYING" || PkmRival_type === "STEEL")
                return -2;}
        if (Attack_type === "FIRE"){
            if (PkmRival_type === "ICE" || PkmRival_type === "GRASS" || PkmRival_type === "BUG" || PkmRival_type === "STEEL")
                return 2;
            if (PkmRival_type === "ROCK" || PkmRival_type === "FIRE" || PkmRival_type === "WATER" || PkmRival_type === "DRAGON")
                return -2;}
        if (Attack_type === "WATER"){
            if (PkmRival_type === "GROUND" ||  PkmRival_type === "ROCK" ||  PkmRival_type === "FIRE")
                return 2;
            if (PkmRival_type === "WATER"  || PkmRival_type === "GRASS"  || PkmRival_type === "DRAGON")
                return -2;}
        if (Attack_type === "FIGHTING"){
            if (PkmRival_type === "NORMAL"  || PkmRival_type === "ROCK"  || PkmRival_type === "ICE"  || PkmRival_type === "DARK"  || PkmRival_type === "STEEL")
                return 2;
            if (PkmRival_type === "FLYING"  || PkmRival_type === "POISON"  || PkmRival_type === "BUG"  || PkmRival_type === "PSYCHIC"  || PkmRival_type === "GHOST"  || PkmRival_type === "FAIRY")
                return -2;}
        if (Attack_type === "FLYING"){
            if (PkmRival_type === "FIGHTING" || PkmRival_type === "BUG" || PkmRival_type === "GRASS")
                return 2;
            if (PkmRival_type === "ELECTRIC" || PkmRival_type === "ROCK" || PkmRival_type === "STEEL")
                return -2;}
        if (Attack_type === "POISON"){
            if (PkmRival_type === "GRASS" || PkmRival_type === "FAIRY")
                return 2;
            if (PkmRival_type === "POISON" || PkmRival_type === "GROUND" || PkmRival_type === "ROCK" || PkmRival_type === "GHOST" || PkmRival_type === "STEEL")
                return -2;}
        if (Attack_type === "GROUND"){
            if (PkmRival_type === "POISON" || PkmRival_type === "ROCK" || PkmRival_type === "FIRE" || PkmRival_type === "ELECTRIC" || PkmRival_type === "STEEL")
                return 2;
            if (PkmRival_type === "FLYING" || PkmRival_type === "BUG" || PkmRival_type === "GRASS")
                return -2;}
        if (Attack_type === "ROCK"){
            if (PkmRival_type === "FLYING" || PkmRival_type === "BUG" || PkmRival_type === "FIRE" || PkmRival_type === "ICE")
            return 2;
            if (PkmRival_type === "FIGHTING" || PkmRival_type === "GROUND" || PkmRival_type === "STEEL")
            return -2;}
    
        if (Attack_type === "BUG"){
            if (PkmRival_type === "GRASS" || PkmRival_type === "PSYCHIC" || PkmRival_type === "DARK")
                return 2;
            if (PkmRival_type === "FIGHTING" || PkmRival_type === "FLYING" || PkmRival_type === "GHOST" || PkmRival_type === "STEEL" || PkmRival_type === "POISON" || PkmRival_type === "FIRE" || PkmRival_type === "FAIRY")
                return -2;}
        if (Attack_type === "GHOST"){
            if (PkmRival_type === "GHOST" || PkmRival_type === "PSYCHIC")
                return 2;
            if (PkmRival_type === "NORMAL" || PkmRival_type === "DARK")
                return -2;}
    
        if (Attack_type === "ELECTRIC"){
            if (PkmRival_type === "FLYING" || PkmRival_type === "WATER")
                return 2;
            if (PkmRival_type === "GROUND" || PkmRival_type === "GRASS" || PkmRival_type === "ELECTRIC" || PkmRival_type === "DRAGON")
                return -2;}
    
        if (Attack_type === "PSYCHIC"){
            if (PkmRival_type === "FIGHTING" || PkmRival_type === "POISON")
                return 2;
            if (PkmRival_type === "PSYCHIC" || PkmRival_type === "STEEL" || PkmRival_type === "DARK")
                return -2;}
    
        if (Attack_type === "ICE"){
            if (PkmRival_type === "FLYING" || PkmRival_type === "GROUND" || PkmRival_type === "GRASS" || PkmRival_type === "DRAGON")
                return 2;
            if (PkmRival_type === "FIRE" || PkmRival_type === "WATER" || PkmRival_type === "ICE" || PkmRival_type === "STEEL")
                return -2;}
    
        if (Attack_type === "DRAGON"){
            if (PkmRival_type === "DRAGON")
                return 2;
            if (PkmRival_type === "STEEL" || PkmRival_type === "FAIRY")
                return -2;}
    
        if (Attack_type === "DARK"){
            if (PkmRival_type === "GHOST" || PkmRival_type === "PSYCHIC")
                return 2;
            if (PkmRival_type === "FIGHTING" || PkmRival_type === "DARK" || PkmRival_type === "FAIRY")
                return -2;}
    
        if (Attack_type === "STEEL"){
            if (PkmRival_type === "ROCK" || PkmRival_type === "ICE" || PkmRival_type === "FAIRY")
                return 2;
            if (PkmRival_type === "FIRE" || PkmRival_type === "WATER" || PkmRival_type === "ELECTRIC" || PkmRival_type === "STEEL")
                return -2;}
    
        if (Attack_type === "FAIRY"){
            if (PkmRival_type === "FIGHTING" || PkmRival_type === "DRAGON" || PkmRival_type === "DARK")
                return 2;
            if (PkmRival_type === "FIRE" || PkmRival_type === "POSION" || PkmRival_type === "STEEL")
                return -2;}
        else{
            return 0;
        }
    
    }
    let aux =0
    let aux2 =0
    aux= checkBonusType(myPokemon.attack1.type, rivalPokemon.type1);
    aux2= checkBonusType(myPokemon.attack1.type, rivalPokemon.type2)
    console.log ('Atk1 aux1: ' + aux);
    console.log ('Atk1 aux2: ' + aux2);
    const MyBonusAttack1 = aux+ aux2;
    console.log (' MyBonusAttack1: ' +  MyBonusAttack1);
    aux= checkBonusType(myPokemon.attack2.type, rivalPokemon.type1);
    aux2= checkBonusType(myPokemon.attack2.type, rivalPokemon.type2);
    console.log ('Atk2 aux1: ' + aux);
    console.log ('Atk2 aux2: ' + aux2);
    const MyBonusAttack2 = aux + aux2;
    console.log (' MyBonusAttack2: ' +  MyBonusAttack2);
    aux= checkBonusType(rivalPokemon.attack1.type, myPokemon.type1);
    aux2= checkBonusType(rivalPokemon.attack1.type, myPokemon.type2);
    console.log ('Atk3 aux1: ' + aux);
    console.log ('Atk3 aux2: ' + aux2);
    const RivalBonusAttack1 = aux+ aux2;
    console.log (' RivalBonusAttack1: ' +  RivalBonusAttack1);
    aux= checkBonusType(rivalPokemon.attack2.type, myPokemon.type1);
    aux2= checkBonusType(rivalPokemon.attack2.type, myPokemon.type2);
    console.log ('Atk4 aux1: ' + aux);
    console.log ('Atk4 aux2: ' + aux2);
    const RivalBonusAttack2 = aux+ aux2;
    console.log (' RivalBonusAttack2: ' +  RivalBonusAttack2);


    return (
        <div className="modal-backdrop">
            <div className="modal-stadium">
                {attacksSelected === false && <div className='main-stadium'>
                <div className='MyPokemon'>
                    <div className='MyPokemon_img' style={{ backgroundImage: `url(${myPokemonImg})`}}></div>
                    <div className='MyPokemon_name'>{myPokemon.name}</div>
                    <div className='MyPokemon_level'>{myPokemon.totalLevel}</div>
                    <div className="types_div"> 
                        <Types Type={myPokemon.type1}  Clase={MyPkm_type1_class} type_id={MyPkm_type_id1}/>
                        { myPokemon.type2 !== null && <Types Type={myPokemon.type2}  Clase={MyPkm_type2_class} type_id={MyPkm_type_id2}/>}
                    </div>
                    <div className='MyPokemon_attacks' >
                        <div className='MyAttack1'  onClick={()=>handleSelectMyAttack (myPokemon.attack1, MyBonusAttack1)}> <Attack attack={myPokemon.attack1} bonus ={MyBonusAttack1}/> </div>
                        {myPokemon.attack2.name !== 'NONE' && <div className='MyAttack2'  onClick={()=>handleSelectMyAttack (myPokemon.attack2 ,MyBonusAttack2)}>  <Attack attack={myPokemon.attack2} bonus ={MyBonusAttack2}/> </div>}
                        {myPokemon.attack3 !== null &&  <Attack attack={myPokemon.attack3} bonus ={''}/>}
                    </div>
                </div>

                <div className='RivalPokemon'>
                    <div className='RivalPokemon_img' style={{ backgroundImage: `url(${rivalPokemonImg})`}}></div>
                    <div className='RivalPokemon_name'>{rivalPokemon.name}</div>
                    <div className='RivalPokemon_level'>{rivalPokemon.totalLevel}</div>
                    <div className="types_div"> 
                        <Types Type={rivalPokemon.type1}  Clase={RivalPkm_type1_class} type_id={RivalPkm_type_id1}/>
                        { rivalPokemon.type2 !== null && <Types Type={rivalPokemon.type2}  Clase={RivalPkm_type2_class} type_id={RivalPkm_type_id2}/>}
                    </div>
                    <div className='RivalPokemon_attacks' >
                        <div className='RivalAttack1'  onClick={()=>handleSelectRivalAttack (rivalPokemon.attack1,RivalBonusAttack1)}><Attack attack={rivalPokemon.attack1} bonus ={RivalBonusAttack1}/></div>
                        {rivalPokemon.attack2.name !== 'NONE' && <div className='RivalAttack2'  onClick={()=>handleSelectRivalAttack (rivalPokemon.attack2,RivalBonusAttack2)}><Attack attack={rivalPokemon.attack2} bonus ={RivalBonusAttack2}/></div>}
                        {rivalPokemon.attack3 !== null && <Attack attack={rivalPokemon.attack3} bonus ={''}/>}
                    </div>
                </div>
                </div>}

                {attacksSelected === true && <ModalStadium2 show={show} onClose={onClose} myPokemon={myPokemon} rivalPokemon={rivalPokemon} myAttack={myAttack} rivalAttack={rivalAttack} MyBonus={myBonus} RivalBonus={rivalBonus}/>}
         
               
                <button onClick={onClose} className='close-modal'>close</button>
            </div>
        </div>
    );
};

export default ModalStadium;