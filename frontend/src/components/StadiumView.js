import React, { useState, useEffect } from 'react';
import Types from "./Types";
import Attack from "./Attacks";
import PokemonBattleListed from "./PokemonBattleListed";

import { io } from 'socket.io-client';
import SERVER_IP from '../config';


const StadiumView = () => {



        const [myPlayer,setMyPlayer] = useState([]);
        const [myRival,setMyRival] = useState([]);
        const [myPokemon,setMyPokemon] = useState([]);
        const [rivalPokemon,setRivalPokemon] = useState([]);
        const [myAttack,setMyAttack] = useState([]);
        const [rivalAttack,setRivalAttack] = useState([]);
        const [myTotal,setMyTotal] = useState(0);
        const [rivalTotal,setRivalTotal] = useState(0);
        const [BattlePhase,setBattlePhase] = useState('PokemonSelection');  


     useEffect(() => {
        const socket = io(SERVER_IP);
    
        socket.on('gameUpdated', (updatedGame) => {
            setMyPlayer(updatedGame.players[updatedGame.currentTurn]);
            console.log('myPlayer:', myPlayer);
            setMyRival(updatedGame.CurrentRival);
               console.log('myRival:', myRival);
            setMyPokemon(updatedGame.myPlayerPkm);
             console.log('myPokemon:', myPokemon);
            setRivalPokemon(updatedGame.myRivalPkm);
                console.log('rivalPokemon:', rivalPokemon); 
            setMyAttack(updatedGame.myPlayerPkmAtk);
                console.log('myAttack:', myAttack);
            setRivalAttack(updatedGame.myRivalPkmAtk);
                    console.log('rivalAttack:', rivalAttack);   
            setMyTotal(updatedGame.myPlayerTotal);
                console.log('myTotal:', myTotal);
            setRivalTotal(updatedGame.myRivalTotal);
                console.log('rivalTotal:', rivalTotal);
            setBattlePhase(updatedGame.battlePhase);
                    console.log('BattlePhase:', BattlePhase);
       
        });
    
        // No olvides limpiar al desmontar el componente
        return () => {
            socket.off('gameUpdated');
            socket.disconnect();
        };
    }, []);





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
        

    // Solo cargar imágenes y tipos cuando myPokemon y rivalPokemon tengan datos válidos (evita require('./0undefined.png'))
    useEffect(() => {
        if (!myPokemon?.pokedex || !rivalPokemon?.pokedex) return;

        try {
            setMyPokemonImg(require(`../images/POKEMON/0${myPokemon.pokedex}.png`));
            setMyPokemonType1_class(`type_${myPokemon.type1}`);
            setMyPokemonType2_class(`type_${myPokemon.type2}`);
            setMyPkm_type_id1(`types_${myPokemon.id}_1`);
            setMyPkm_type_id2(`types_${myPokemon.id}_2`);
            setRivalPokemonImg(require(`../images/POKEMON/0${rivalPokemon.pokedex}.png`));
            setRivalPokemonType1_class(`type_${rivalPokemon.type1}`);
            setRivalPokemonType2_class(`type_${rivalPokemon.type2}`);
            setRivalPkm_type_id1(`types_${rivalPokemon.id}_1`);
            setRivalPkm_type_id2(`types_${rivalPokemon.id}_2`);
            calculateBonus(myPokemon, rivalPokemon);
        } catch (err) {
            console.warn('Error cargando imágenes de Pokémon en Stadium:', err);
        }
    }, [myPokemon, rivalPokemon]);

  
    console.log('myPlayer:', myPlayer);
    console.log('myRival:', myRival);


   return (
        
        <div className="Stadium"  >
            
            {BattlePhase === 'PokemonSelection' && myPlayer?.name && (
            <div className="player-stadium-main">
                <div className="player-name">{myPlayer.name}</div>
                <div className="player_team">
                {(myPlayer.pokemons || []).map((pokemon) => (
                    <PokemonBattleListed key = {myPlayer.name + pokemon.id} pokemon={pokemon} />

                 ))}
                </div>

                <div className="player_team">
                {(myPlayer.megas || []).map((pokemon) => (
                    <PokemonBattleListed key = {myPlayer.name + pokemon.id} pokemon={pokemon}  />

                 ))}
                </div>
            </div>
            )}

            {BattlePhase === 'PokemonSelection' && myRival?.name && (
            <div  className="rival-stadium-main">
                <div className="rival-name">{myRival.name}</div>
                <div  className="rival_team">
                {(myRival.pokemons || []).map((pokemon) => (
                 <PokemonBattleListed key = {myRival.name + pokemon.id} pokemon={pokemon}  />
                 ))}
                </div>
            </div>
            )}

            {BattlePhase === 'AttackSelection' &&  (
            <div className="attack-select-main">
                    <div className='MyPokemon-main'>
                        <div className='MyPokemon_img' style={{ backgroundImage: `url(${myPokemonImg})`}}></div>
                        <div className='MyPokemon_name'>{myPokemon.name}</div>
                        <div className='MyPokemon_level'>Lv: {myPokemon.totalLevel}</div>
                        <div className="types_div"> 
                            <Types Type={myPokemon.type1}  Clase={MyPokemonType1_class} type_id={MyPkm_type_id1}/>
                            { (myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ) && <Types Type={myPokemon.type2}  Clase={MyPokemonType2_class} type_id={MyPkm_type_id2}/>}
                        </div>
                       <div className='MyPokemon_attacks' >
                            <div className='MyAttack1'  > <Attack attack={myPokemon.attack1} bonus ={MyBonusAttack1}/> </div>
                            {myPokemon.attack2.name !== 'NONE' && <div className='MyAttack2'  >  <Attack attack={myPokemon.attack2} bonus ={MyBonusAttack2}/> </div>}
                            {myPokemon.attack3.name !== 'NONE' && <div className='MyAttack3'  >  <Attack attack={myPokemon.attack3} bonus ={MyBonusAttack3}/> </div>}
                        </div>                      
                    </div>

                    <div className='RivalPokemon-main'>
                        <div className='RivalPokemon_img' style={{ backgroundImage: `url(${rivalPokemonImg})`}}></div>
                        <div className='RivalPokemon_name'>{rivalPokemon.name}</div>
                        <div className='RivalPokemon_level'>Lv: {rivalPokemon.totalLevel}</div>
                        <div className="types_div"> 
                            <Types Type={rivalPokemon.type1}  Clase={RivalPokemonType1_class} type_id={RivalPkm_type_id1}/>
                            { (rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ) && <Types Type={rivalPokemon.type2}  Clase={RivalPokemonType2_class} type_id={RivalPkm_type_id2}/>}
                        </div>
                         <div className='RivalPokemon_attacks' >
                            <div className='RivalAttack1'  ><Attack attack={rivalPokemon.attack1} bonus ={RivalBonusAttack1}/></div>
                            {rivalPokemon.attack2.name !== 'NONE' && <div className='RivalAttack2' ><Attack attack={rivalPokemon.attack2} bonus ={RivalBonusAttack2}/></div>}
                            {rivalPokemon.attack3.name !== 'NONE' && <div className='RivalAttack3' ><Attack attack={rivalPokemon.attack3} bonus ={RivalBonusAttack3}/></div>}
                        </div>
                   </div>


            

            </div>
            )}


        {BattlePhase === 'RollDice' && (
            <div className='Pokemon-stadium2'>
                <div className="myTotalFinal">{myTotal}</div>
                <div className="rivalTotalFinal">{rivalTotal}</div>
          

            <div className='MyPokemon'>
            <div className='Attack-selected-mypoke'>{myAttack.name} {myAttack.strength}  </div>
           

                 

                   
                </div>
              <div className='RivalPokemon'>
                    <div className='Attack-selected-rival'>{rivalAttack.name} {rivalAttack.strength}  </div>
              
              
               
            </div>

         
           
            </div>
            

        )}   
          
        </div>
    )
};

  

export default StadiumView;
