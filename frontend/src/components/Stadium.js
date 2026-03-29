import { useState } from "react";
import Types from "./Types";
import Attack from "./Attacks";
import PokemonBattleListed from "./PokemonBattleListed";


const Stadium = ({player,rival, onHandleBattlePokemon, onHandleBattleAttack, onHandleTotales, onChangeBattlePhase}) => {
    
  
    const [myPokemon, setMyPokemon] = useState();
    const [myPokemonSelected, setMyPokemonSelected] = useState('false');
    const [rivalPokemonSelected, setRivalPokemonSelected] = useState('false');
    const [rivalPokemon, setRivalPokemon] = useState();
   

    //Attack Section
    const [myAttack, setMyAttack] = useState();
    const [myBonus, setMyBonus] = useState();
    const [rivalAttack, setRivalAttack] = useState(0);
    const [rivalBonus, setRivalBonus] = useState(0);
    const [myAttackSelected, setMyAttackSelected]=useState('false')
    const [rivalAttackSelected, setRivalAttackSelected]=useState('false')

    //varibables para componente Type 
    const [myPokemonImg, setMyPokemonImg] = useState();
    const [rivalPokemonImg, setRivalPokemonImg] = useState();
    const [MyPokemonType1_class, setMyPokemonType1_class] = useState();
    const [MyPokemonType2_class, setMyPokemonType2_class] = useState();
    const [MyPkm_type_id1, setMyPkm_type_id1] = useState();
    const [MyPkm_type_id2, setMyPkm_type_id2] = useState();
    const [RivalPokemonType1_class, setRivalPokemonType1_class] = useState();
    const [RivalPokemonType2_class, setRivalPokemonType2_class] = useState();
    const [RivalPkm_type_id1, setRivalPkm_type_id1] = useState();
    const [RivalPkm_type_id2, setRivalPkm_type_id2] = useState();

    const [MyBonusAttack1,setMyBonusAttack1] = useState();
    const [MyBonusAttack2,setMyBonusAttack2] = useState();
    const [MyBonusAttack3,setMyBonusAttack3] = useState();
    const [RivalBonusAttack1,setRivalBonusAttack1] = useState();
    const [RivalBonusAttack2,setRivalBonusAttack2] = useState();
    const [RivalBonusAttack3,setRivalBonusAttack3] = useState();


    //Battle
    const [myDice, setMyDice] = useState(0);
    const [myTotal, setMyTotal] = useState(0);
    const [rivalDice, setRivalDice] = useState(0);
    const [rivalTotal, setRivalTotal] = useState(0);
    const [addMyDice, setAddMyDice] = useState(false);
    const [addRivalDice, setAddRivalDice] = useState(false);
    const [myAttackPower, setMyAttackPower] = useState();
    const [rivalAttackPower, setRivalAttackPower] = useState();
    const [myBonusFinal, setMyBonusFinal] = useState();
    const [rivalBonusFinal, setRivalBonusFinal] = useState();
    const [myStatus, setMyStatus] = useState();
    const [rivalStatus, setRivalStatus] = useState();

    
    const onAddBattlePokemon = (player, id) => {
    onHandleBattlePokemon(player, id)
    }
      const onAddBattleAttack = (player, id) => {
    onHandleBattleAttack(player, id)
    }
      const onTotales = (player, newTotal) => {
    onHandleTotales(player, newTotal)
   // console.log('running onTotales');
    }

    const onBattlePhase = (newPhase) => {
        onChangeBattlePhase(newPhase);
    }   



  

    async function checkBonusType(Attack_type, PkmRival_type) {
        console.log("Attack-Type: " + Attack_type);
        console.log("Rival-pkm-Type: " + PkmRival_type);
        if (Attack_type.includes("NORMAL") && (PkmRival_type.includes("STEEL") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("ROCK")))
            return -2;
        else if (Attack_type.includes("GRASS")) {
            if (PkmRival_type.includes("GROUND") || PkmRival_type.includes("WATER") || PkmRival_type.includes("ROCK"))
                return 2;
            else if(PkmRival_type.includes("POISON") || PkmRival_type.includes("BUG") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("DRAGON") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("FIRE")) {
            if (PkmRival_type.includes("ICE") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("BUG") || PkmRival_type.includes("STEEL"))
                return 2;
            else if (PkmRival_type.includes("ROCK") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("WATER") || PkmRival_type.includes("DRAGON"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("WATER")) {
            if (PkmRival_type.includes("GROUND") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("FIRE"))
                return 2;
            else if (PkmRival_type.includes("WATER") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("DRAGON"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("FIGHTING")) {
            if (PkmRival_type.includes("NORMAL") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("ICE") || PkmRival_type.includes("DARK") || PkmRival_type.includes("STEEL"))
                return 2;
            else if(PkmRival_type.includes("FLYING") || PkmRival_type.includes("POISON") || PkmRival_type.includes("BUG") || PkmRival_type.includes("PSYCHIC") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("FAIRY"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("FLYING")) {
            if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("BUG") || PkmRival_type.includes("GRASS"))
                return 2;
            else if(PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("POISON")) {
            if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("FAIRY"))
                return 2;
            else if (PkmRival_type.includes("POISON") || PkmRival_type.includes("GROUND") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("GROUND")) {
            if (PkmRival_type.includes("POISON") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("STEEL"))
                return 2;
            else if (PkmRival_type.includes("FLYING") || PkmRival_type.includes("BUG") || PkmRival_type.includes("GRASS"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("ROCK")) {
            if (PkmRival_type.includes("FLYING") || PkmRival_type.includes("BUG") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("ICE"))
                return 2;
            else if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("GROUND") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("BUG")) {
            if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("PSYCHIC") || PkmRival_type.includes("DARK"))
                return 2;
            else if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("POISON") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("FAIRY"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("GHOST")) {
            if (PkmRival_type.includes("GHOST") || PkmRival_type.includes("PSYCHIC"))
                return 2;
            else if(PkmRival_type.includes("NORMAL") || PkmRival_type.includes("DARK"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("ELECTRIC")) {
            if (PkmRival_type.includes("FLYING") || PkmRival_type.includes("WATER"))
                return 2;
            else if (PkmRival_type.includes("GROUND") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("DRAGON"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("PSYCHIC")) {
            if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("POISON"))
                return 2;
            else if (PkmRival_type.includes("PSYCHIC") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("DARK"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("ICE")) {
            if (PkmRival_type.includes("FLYING") || PkmRival_type.includes("GROUND") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("DRAGON"))
                return 2;
            else if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("WATER") || PkmRival_type.includes("ICE") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("DRAGON")) {
            if (PkmRival_type.includes("DRAGON"))
                return 2;
            else if (PkmRival_type.includes("STEEL") || PkmRival_type.includes("FAIRY"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("DARK")) {
            if (PkmRival_type.includes("GHOST") || PkmRival_type.includes("PSYCHIC"))
                return 2;
            else if(PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("DARK") || PkmRival_type.includes("FAIRY"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("STEEL")) {
            if (PkmRival_type.includes("ROCK") || PkmRival_type.includes("ICE") || PkmRival_type.includes("FAIRY"))
                return 2;
            else if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("WATER") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
        } else if (Attack_type.includes("FAIRY")) {
            if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("DRAGON") || PkmRival_type.includes("DARK"))
                return 2;
            else if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("POSION") || PkmRival_type.includes("STEEL"))
                return -2;
            else 
                    return 0;
                
        } else {
            return 0;
        }
    }
    

    async function calculateBonus(myPokemon,rivalPokemon){
        let aux =0
        let aux2 =0
        console.log("My pokemon BONUS");
        console.log("Rival type: " + rivalPokemon.type1);
        console.log("ATK1 type: " + myPokemon.attack1.type);
        console.log("ATK2 type: " + myPokemon.attack2.type);

        aux= await checkBonusType(myPokemon.attack1.type, rivalPokemon.type1);
        if(rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ){
            aux2= await checkBonusType(myPokemon.attack1.type, rivalPokemon.type2)
        }
        else{
            aux2=0;
        }
        
        console.log ('Atk1 aux1: ' + aux);
        console.log ('Atk1 aux2: ' + aux2);
        setMyBonusAttack1(aux+ aux2);
        console.log (' MyBonusAttack1: ' +  MyBonusAttack1);
        aux= await checkBonusType(myPokemon.attack2.type, rivalPokemon.type1);
        if(rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ){
            aux2= await checkBonusType(myPokemon.attack2.type, rivalPokemon.type2);
        }
        else{
            aux2=0;
        }
        console.log ('Atk2 aux1: ' + aux);
        console.log ('Atk2 aux2: ' + aux2);
        setMyBonusAttack2(aux + aux2);
        console.log (' MyBonusAttack2: ' +  MyBonusAttack2);
        aux=  await checkBonusType(myPokemon.attack3.type, rivalPokemon.type1);
        if(rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ){
        aux2=  await checkBonusType(myPokemon.attack3.type, rivalPokemon.type2);
        }
        else{
        aux2=0;
        }
        console.log ('Atk2 aux1: ' + aux);
        console.log ('Atk2 aux2: ' + aux2);
        setMyBonusAttack3(aux + aux2);
        console.log (' MyBonusAttack3: ' +  MyBonusAttack3);

        console.log("Rival BONUS");
        
        console.log("My pokemon type: " + myPokemon.type1);
        console.log("ATK1 type: " + rivalPokemon.attack1.type);
        console.log("ATK2 type: " + rivalPokemon.attack2.type);

        aux= await checkBonusType(rivalPokemon.attack1.type, myPokemon.type1);
        if(myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ){
            aux2= await checkBonusType(rivalPokemon.attack1.type, myPokemon.type2);
        }
        else{
            aux2=0;
            }
       
        console.log ('Atk3 aux1: ' + aux);
        console.log ('Atk3 aux2: ' + aux2);
        setRivalBonusAttack1(aux+ aux2);
        console.log (' RivalBonusAttack1: ' +  RivalBonusAttack1);
        aux= await checkBonusType(rivalPokemon.attack2.type, myPokemon.type1);
        if(myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ){
        aux2= await checkBonusType(rivalPokemon.attack2.type, myPokemon.type2);
         }
        else{
        aux2=0;
        }
        console.log ('Atk4 aux1: ' + aux);
        console.log ('Atk4 aux2: ' + aux2);
        setRivalBonusAttack2(aux+ aux2);
        console.log (' RivalBonusAttack2: ' +  RivalBonusAttack2);
        aux= await checkBonusType(rivalPokemon.attack3.type, myPokemon.type1);
        if(myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ){
        aux2= await checkBonusType(rivalPokemon.attack3.type, myPokemon.type2);
        }
        else{
        aux2=0;
        }
        console.log ('Atk6 aux1: ' + aux);
        console.log ('Atk6 aux2: ' + aux2);
        setRivalBonusAttack3(aux+ aux2);
        console.log (' RivalBonusAttack2: ' +  RivalBonusAttack3);

    }
    //Select my Pokemon
    const handleSelectMyPokemon = (pokemon) => {
        setMyPokemon(pokemon);
        console.log("Pokémon seleccionado:", pokemon); // Verifica que contiene el id
        console.log(pokemon.name);
        setMyStatus(pokemon.status);
        //ajuste agregando la carpeta de tokens ultimixdnn
        setMyPokemonImg(require(`../images/tokens/${pokemon.pokedex}.png`));
        //Clase Type
        setMyPokemonType1_class(`type_${pokemon.type1}`);
        setMyPokemonType2_class(`type_${pokemon.type2}`);
        setMyPkm_type_id1(`types_${pokemon.id}_1`);
        setMyPkm_type_id2(`types_${pokemon.id}_2`);
        setMyPokemonSelected('true'); 
        //Bablle Pokemon
          console.log('running onAddBattlePokemon Player');
             console.log('pokemon.id): ' + pokemon.id);
        onAddBattlePokemon('MyPlayer',pokemon.id);
    };

    const handleSelectRivalPokemon = async (pokemon) => {
        setRivalPokemon(pokemon);
        console.log(pokemon.name);
        setRivalStatus(pokemon.status);
        //ajuste agregando la carpeta de tokens ultimixdnn
        setRivalPokemonImg(require(`../images/tokens/${pokemon.pokedex}.png`));
        //Clase Type
        setRivalPokemonType1_class(`type_${pokemon.type1}`);
        setRivalPokemonType2_class(`type_${pokemon.type2}`);
        setRivalPkm_type_id1(`types_${pokemon.id}_1`);
        setRivalPkm_type_id2(`types_${pokemon.id}_2`);
        await calculateBonus(myPokemon,pokemon);
        setRivalPokemonSelected('true');
        //Bablle Pokemon
         console.log('running onAddBattlePokemon Rival');
        onAddBattlePokemon('Rival',pokemon.id);
        onBattlePhase('AttackSelection');


      
       
    
    };

   
   
    //Select Attacks
    const handleSelectMyAttack =(attack,bonus) =>{
        setMyAttack(attack);
        setMyAttackPower(attack.strength);
        setMyBonus(bonus);
        setMyBonusFinal(bonus);
        console.log(myAttack);
        setMyTotal(attack.strength + bonus + myPokemon.totalLevel );
        setMyAttackSelected('true')
        //Battle Attack
        onAddBattleAttack('MyPlayer',attack.id);
        onTotales('MyPlayer',attack.strength + bonus + myPokemon.totalLevel );
        
        }

    const handleSelectRivalAttack =(attack,bonus) =>{
        setRivalAttack(attack);
        setRivalAttackPower(attack.strength);
        setRivalBonus(bonus);
        setRivalBonusFinal(bonus);
        console.log(rivalAttack);
        setRivalTotal(attack.strength + bonus + rivalPokemon.totalLevel );
        setRivalAttackSelected('true');
        //Battle Attack
        onAddBattleAttack('Rival',attack.id);
        onTotales('Rival',attack.strength + bonus + rivalPokemon.totalLevel );
        onBattlePhase('RollDice');
    }

     //Battle  functions
    function sumTotal (PokemonLevel,AttackStrenght,Bonus,Dice, player){
        return PokemonLevel + AttackStrenght + Bonus + Dice;
   }
 
     const handleSelectMyDice =(Dice) =>{
       if (addMyDice === true){
           setMyDice(myDice+Dice);
           setMyTotal(myTotal+Dice);
           setAddMyDice(false);
           onTotales('MyPlayer',myTotal+Dice);
        }
        else{
           setMyDice(Dice);
           setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,Dice));
           onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,Dice));
       }

       }

   const handleSelectRivalDice =(Dice) =>{
       if (addRivalDice === true){
           setRivalDice(rivalDice + Dice);
           setRivalTotal(rivalTotal+Dice);
           setAddRivalDice(false);
              onTotales('Rival',rivalTotal+Dice);
        }
        else{
           setRivalDice(Dice);
           setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,Dice));
           onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,Dice));
        }
           
       }

       const handleMyStatus =(myNewStatus) =>{
           
           if(myNewStatus === "Asleep" || myNewStatus === "Paralized" || myNewStatus === "Frozen"){
               setMyStatus(myNewStatus);
               setMyAttackPower(0);
               setMyBonusFinal(0);
               setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,myDice));
               onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,myDice));
               
           }
           else if(myNewStatus === "Burned"){
               setMyStatus(myNewStatus);
               setMyAttackPower(myAttack.strength -1);
               setMyBonusFinal(myBonus);
               setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,myDice));
               onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,myDice));
           }

           else if(myNewStatus === "Confused" || myNewStatus === "Normal"){
               setMyStatus(myNewStatus);
               setMyAttackPower(myAttack.strength);
               setMyBonusFinal(myBonus);
               setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,myDice));
               onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,myDice));
           }
       }

       const handleRivalStatus =(myNewStatus) =>{
           
           if(myNewStatus === "Asleep" || myNewStatus === "Paralized" || myNewStatus === "Frozen"){
               setRivalStatus(myNewStatus);
               setRivalAttackPower(0);
               setRivalBonusFinal(0);
               setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,rivalDice));
               onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,rivalDice));
           }
           else if(myNewStatus === "Burned"){
               setRivalStatus(myNewStatus);
               setRivalAttackPower(rivalAttack.strength -1);
               setRivalBonusFinal(rivalBonus);
               setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,rivalDice));
               onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,rivalDice));
           }

           else if(myNewStatus === "Confused" || myNewStatus === "Normal"){
               setRivalStatus(myNewStatus);
               setRivalAttackPower(rivalAttack.strength);
               setRivalBonusFinal(rivalBonus);
               setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,rivalDice));
               onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,rivalDice));
           }
       }

       const getStatusClass = (status) => {
        return `status_battle ${status} ${myStatus === status ? 'statusActive' : ''}`;
    };

    const getStatusClass2 = (status) => {
        return `status_battle rotate-x ${status} ${rivalStatus === status ? 'statusActive' : ''}`;
    };

    const handleRematch = () => {
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        setMyDice(0);
        setRivalDice(0);
    };

    const ChangePokemon = () => {
        setMyPokemonSelected('false');
        setRivalPokemonSelected('false');
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        setMyDice(0);
        setRivalDice(0);
        onBattlePhase('PokemonSelection');
      
    };
    const EndBattle = () => {
      console.log('EndBattle');
    };

  

    return (
        
        <div className="Stadium"  >
            
            {player && myPokemonSelected === 'false'  && (
            <div className="player-stadium-main">
                <div className="player-name">{player.name}</div>
                <div className="player_team">
                {(player.pokemons || []).map((pokemon) => (
                    <PokemonBattleListed key = {player.name + pokemon.id} pokemon={pokemon}  SelectPokemon={handleSelectMyPokemon}/>

                 ))}
                </div>

                <div className="player_team">
                {(player.megas || []).map((pokemon) => (
                    <PokemonBattleListed key = {player.name + pokemon.id} pokemon={pokemon}  SelectPokemon={handleSelectMyPokemon}/>

                 ))}
                </div>
            </div>
            )}
            <label className="switch">
                <input type="checkbox" />
                <span className="slider round"></span>
            </label>

            {rival && rivalPokemonSelected === 'false'  && (
            <div  className="rival-stadium-main">
                <div className="rival-name">{rival.name}</div>
                <div  className="rival_team">
                {(rival.pokemons || []).map((pokemon) => (
                 <PokemonBattleListed key = {rival.name + rival.id} pokemon={pokemon}  SelectPokemon={handleSelectRivalPokemon}/>
                 ))}
                </div>
            </div>
            )}

            {rivalPokemonSelected === 'true' && myPokemonSelected === 'true' && (
            <div className="attack-select-main">
                    <div className='MyPokemon-main'>
                        <div className='MyPokemon_img' style={{ backgroundImage: `url(${myPokemonImg})`}}></div>
                        <div className='MyPokemon_name'>{myPokemon.name}</div>
                        <div className='MyPokemon_level'>Lv: {myPokemon.totalLevel}</div>
                        <div className="types_div"> 
                            <Types Type={myPokemon.type1}  Clase={MyPokemonType1_class} type_id={MyPkm_type_id1}/>
                            { (myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ) && <Types Type={myPokemon.type2}  Clase={MyPokemonType2_class} type_id={MyPkm_type_id2}/>}
                        </div>
                       { myAttackSelected === 'false' && (<div className='MyPokemon_attacks' >
                            <div className='MyAttack1'  onClick={()=>handleSelectMyAttack (myPokemon.attack1, MyBonusAttack1)}> <Attack attack={myPokemon.attack1} bonus ={MyBonusAttack1}/> </div>
                            {myPokemon.attack2.name !== 'NONE' && <div className='MyAttack2'  onClick={()=>handleSelectMyAttack (myPokemon.attack2 ,MyBonusAttack2)}>  <Attack attack={myPokemon.attack2} bonus ={MyBonusAttack2}/> </div>}
                            {myPokemon.attack3.name !== 'NONE' && <div className='MyAttack3'  onClick={()=>handleSelectMyAttack (myPokemon.attack3 ,MyBonusAttack3)}>  <Attack attack={myPokemon.attack3} bonus ={MyBonusAttack3}/> </div>}
                        </div> ) }                      
                    </div>

                    <div className='RivalPokemon-main'>
                        <div className='RivalPokemon_img' style={{ backgroundImage: `url(${rivalPokemonImg})`}}></div>
                        <div className='RivalPokemon_name'>{rivalPokemon.name}</div>
                        <div className='RivalPokemon_level'>Lv: {rivalPokemon.totalLevel}</div>
                        <div className="types_div"> 
                            <Types Type={rivalPokemon.type1}  Clase={RivalPokemonType1_class} type_id={RivalPkm_type_id1}/>
                            { (rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ) && <Types Type={rivalPokemon.type2}  Clase={RivalPokemonType2_class} type_id={RivalPkm_type_id2}/>}
                        </div>
                        { rivalAttackSelected === 'false' &&( <div className='RivalPokemon_attacks' >
                            <div className='RivalAttack1'  onClick={()=>handleSelectRivalAttack (rivalPokemon.attack1,RivalBonusAttack1)}><Attack attack={rivalPokemon.attack1} bonus ={RivalBonusAttack1}/></div>
                            {rivalPokemon.attack2.name !== 'NONE' && <div className='RivalAttack2'  onClick={()=>handleSelectRivalAttack (rivalPokemon.attack2,RivalBonusAttack2)}><Attack attack={rivalPokemon.attack2} bonus ={RivalBonusAttack2}/></div>}
                            {rivalPokemon.attack3.name !== 'NONE' && <div className='RivalAttack3'  onClick={()=>handleSelectRivalAttack (rivalPokemon.attack3,RivalBonusAttack3)}><Attack attack={rivalPokemon.attack3} bonus ={RivalBonusAttack3}/></div>}
                        </div>)}
                   </div>


            

            </div>
            )}


        {myAttackSelected === 'true' && rivalAttackSelected === 'true' && (
            <div className='Pokemon-stadium2'>
                <div className="myTotalFinal">{myTotal}</div>
                <div className="rivalTotalFinal">{rivalTotal}</div>
            <div className='MyPokemon_status'>
                <div className={getStatusClass('Paralized')} onClick={()=> handleMyStatus('Paralized')}></div>
                <div className={getStatusClass('Asleep')} onClick={()=> handleMyStatus('Asleep')}></div>
                <div className={getStatusClass('Frozen')} onClick={()=> handleMyStatus('Frozen')}></div>
                <div className={getStatusClass('Burned')} onClick={()=> handleMyStatus('Burned')}></div>
                <div className={getStatusClass('Confused')} onClick={()=> handleMyStatus('Confused')}></div>
                <div className={getStatusClass('Normal')} onClick={()=> handleMyStatus('Normal')}></div>
            </div>

            <div className='MyPokemon'>
            <div className='Attack-selected-mypoke'>{myAttack.name} {myAttack.strength}  </div>
                    <div className='MyTotal_label'>
                        <div>Level </div>+
                        <div>Attack  </div>+
                        <div>Bonus  </div>+
                        <div>Dice  </div>=
                        <div> Total </div>
                    </div>

                    <div className='MyTotal'>
                        <div>{myPokemon.totalLevel}  </div>+
                        <div>{myAttackPower}  </div>+
                        <div>{myBonusFinal}  </div>+
                        <div>{myDice}  </div>=
                        <div> {myTotal} </div>
                    </div>

                    <div className='MyDices'>
                        
                        <div className='MyDice mydice1' onClick={()=> handleSelectMyDice(1)}></div>
                        <div className='MyDice mydice2' onClick={()=> handleSelectMyDice(2)}></div>
                        <div className='MyDice mydice3' onClick={()=> handleSelectMyDice(3)}></div>
                        <div className='MyDice mydice4' onClick={()=> handleSelectMyDice(4)}></div>
                        <div className='MyDice mydice5' onClick={()=> handleSelectMyDice(5)}></div>
                        <div className='MyDice mydice6' onClick={()=> handleSelectMyDice(6)}></div>
                        <div className='mydicePlus' onClick={()=> setAddMyDice(true)}></div>
                    </div>

                   
                </div>
              <div className='RivalPokemon'>
                    <div className='Attack-selected-rival'>{rivalAttack.name} {rivalAttack.strength}  </div>
                    <div className='RivalTotal_label'>
                        <div>Level </div>+
                        <div>Attack  </div>+
                        <div>Bonus  </div>+
                        <div>Dice  </div>=
                        <div> Total </div>
                    </div>
                    <div className='RivalTotal'>
                        <div>{rivalPokemon.totalLevel}  </div>+
                        <div>{rivalAttackPower}  </div>+
                        <div>{rivalBonusFinal}  </div>+
                        <div>{rivalDice} </div>=
                        <div> {rivalTotal} </div>
                    </div>
                    <div className='RivalDices'>
                        <div className='rivalDicePlus' onClick={()=> setAddRivalDice(true)} ></div>
                        <div className='RivalDice mydice1' onClick={()=> handleSelectRivalDice(1)}></div>
                        <div className='RivalDice mydice2' onClick={()=> handleSelectRivalDice(2)}></div>
                        <div className='RivalDice mydice3' onClick={()=> handleSelectRivalDice(3)}></div>
                        <div className='RivalDice mydice4' onClick={()=> handleSelectRivalDice(4)}></div>
                        <div className='RivalDice mydice5' onClick={()=> handleSelectRivalDice(5)}></div>
                        <div className='RivalDice mydice6' onClick={()=> handleSelectRivalDice(6)}></div>
                        
                </div>
               
            </div>

            <div className='RivalPokemon_status'>
                <div  className={getStatusClass2('Paralized')} onClick={()=> handleRivalStatus('Paralized')} ></div>
                <div className={getStatusClass2('Asleep')} onClick={()=> handleRivalStatus('Asleep')}></div>
                <div className={getStatusClass2('Frozen')} onClick={()=> handleRivalStatus('Frozen')}></div>
                <div className={getStatusClass2('Burned')} onClick={()=> handleRivalStatus('Burned')}></div>
                <div className={getStatusClass2('Confused')} onClick={()=> handleRivalStatus('Confused')}></div>
                <div className={getStatusClass2('Normal')} onClick={()=> handleRivalStatus('Normal')}></div>
            </div>
            <div className="rematchButton" onClick={()=> handleRematch()}>Re-Match</div>
            <div className="change-pokemon"onClick={()=> ChangePokemon()} >Change-Pokemon</div>
            <div className="End-Battle"onClick={()=> EndBattle()} >Finish</div>
            </div>

            

            

        )}   
          
        </div>
    )
};

export default Stadium;