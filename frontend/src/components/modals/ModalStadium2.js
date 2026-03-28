import React,{useState} from 'react';

import Types from '../Types';
import Attack from '../Attacks';


const ModalStadium2 = ({ show, onClose,myPokemon,rivalPokemon,myAttack,rivalAttack,MyBonus,RivalBonus}) => {
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

    const getStatusClass = (status) => {
        return `status_battle ${status} ${myStatus === status ? 'statusActive' : ''}`;
    };
  

    const [myDice, setMyDice] = useState(0);
    const [myTotal, setMyTotal] = useState(0);
    const [rivalDice, setRivalDice] = useState(0);
    const [rivalTotal, setRivalTotal] = useState(0);
    const [addMyDice, setAddMyDice] = useState(false);
    const [addRivalDice, setAddRivalDice] = useState(false);
    const [myAttackPower, setMyAttackPower] = useState(myAttack.strength);
    const [rivalAttackPower, setRivalAttackPower] = useState(rivalAttack.strength);
    const [myBonusFinal, setMyBonusFinal] = useState(MyBonus);
    const [rivalBonusFinal, setRivalBonusFinal] = useState(RivalBonus);
    const [myStatus, setMyStatus] = useState(myPokemon.status);
    const [rivalStatus, setRivalStatus] = useState(rivalPokemon.status);

    if (!show) {
        return null;
    }

    function sumTotal (PokemonLevel,AttackStrenght,Bonus,Dice, player){
         return PokemonLevel + AttackStrenght + Bonus + Dice;
    }
  
      const handleSelectMyDice =(Dice) =>{
        if (addMyDice === true){
            setMyDice(myDice+Dice);
            setMyTotal(myTotal+Dice);
            setAddMyDice(false);
         }
         else{
            setMyDice(Dice);
            setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,Dice));
        }
        }

    const handleSelectRivalDice =(Dice) =>{
        if (addRivalDice === true){
            setRivalDice(rivalDice + Dice);
            setRivalTotal(rivalTotal+Dice);
            setAddRivalDice(false);
         }
         else{
            setRivalDice(Dice);
            setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,Dice));
         }
            
        }

        const handleMyStatus =(myNewStatus) =>{
            
            if(myNewStatus === "Asleep" || myNewStatus === "Paralized" || myNewStatus === "Frozen"){
                setMyStatus(myNewStatus);
                setMyAttackPower(0);
                setMyBonusFinal(0);
                
            }
            else if(myNewStatus === "Burned"){
                setMyStatus(myNewStatus);
                setMyAttackPower(myAttack.strength -1);
                setMyBonusFinal(MyBonus);
            }

            else if(myNewStatus === "Confused" || myNewStatus === "Normal"){
                setMyStatus(myNewStatus);
                setMyAttackPower(myAttack.strength);
                setMyBonusFinal(MyBonus);
            }
        }

        const handleRivalStatus =(myNewStatus) =>{
            
            if(myNewStatus === "Asleep" || myNewStatus === "Paralized" || myNewStatus === "Frozen"){
                setRivalStatus(myNewStatus);
                setRivalAttackPower(0);
                setRivalBonusFinal(0);
            }
            else if(myNewStatus === "Burned"){
                setRivalStatus(myNewStatus);
                setRivalAttackPower(rivalAttack.strength -1);
                setRivalBonusFinal(RivalBonus);
            }

            else if(myNewStatus === "Confused" || myNewStatus === "Normal"){
                setRivalStatus(myNewStatus);
                setRivalAttackPower(rivalAttack.strength);
                setRivalBonusFinal(RivalBonus);
            }
        }

   



  

    return (
        <div className='Pokemon-stadium2'>
            <div className='main-stadium2'>
            <div className='MyPokemon_status'>
                <div className={getStatusClass('Paralized')} onClick={()=> handleMyStatus('Paralized')}></div>
                <div className={getStatusClass('Asleep')} onClick={()=> handleMyStatus('Asleep')}></div>
                <div className={getStatusClass('Frozen')} onClick={()=> handleMyStatus('Frozen')}></div>
                <div className={getStatusClass('Burned')} onClick={()=> handleMyStatus('Burned')}></div>
                <div className={getStatusClass('Confused')} onClick={()=> handleMyStatus('Confused')}></div>
                <div className={getStatusClass('Normal')} onClick={()=> handleMyStatus('Normal')}>Normal</div>
            </div>

            <div className='MyPokemon'>
                    <div className='MyPokemon_img' style={{ backgroundImage: `url(${myPokemonImg})`}}></div>
                    <div className='MyPokemon_name'>{myPokemon.name}</div>
                    <div className='MyPokemon_level'>{myPokemon.totalLevel}</div>
                    <div className="types_div"> 
                        <Types Type={myPokemon.type1}  Clase={MyPkm_type1_class} type_id={MyPkm_type_id1}/>
                        { myPokemon.type2 !== null && <Types Type={myPokemon.type2}  Clase={MyPkm_type2_class} type_id={MyPkm_type_id2}/>}
                    </div>
                    <Attack attack={myAttack} bonus ={MyBonus}/>
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
                        <div className='MyDice mydicePlus' onClick={()=> setAddMyDice(true)}>+</div>
                        <div className='MyDice mydice1' onClick={()=> handleSelectMyDice(1)}></div>
                        <div className='MyDice mydice2' onClick={()=> handleSelectMyDice(2)}></div>
                        <div className='MyDice mydice3' onClick={()=> handleSelectMyDice(3)}></div>
                        <div className='MyDice mydice4' onClick={()=> handleSelectMyDice(4)}></div>
                        <div className='MyDice mydice5' onClick={()=> handleSelectMyDice(5)}></div>
                        <div className='MyDice mydice6' onClick={()=> handleSelectMyDice(6)}></div>
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
                    <Attack attack={rivalAttack} bonus ={RivalBonus}/>
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
                        <div className='RivalDice mydice1' onClick={()=> handleSelectRivalDice(1)}></div>
                        <div className='RivalDice mydice2' onClick={()=> handleSelectRivalDice(2)}></div>
                        <div className='RivalDice mydice3' onClick={()=> handleSelectRivalDice(3)}></div>
                        <div className='RivalDice mydice4' onClick={()=> handleSelectRivalDice(4)}></div>
                        <div className='RivalDice mydice5' onClick={()=> handleSelectRivalDice(5)}></div>
                        <div className='RivalDice mydice6' onClick={()=> handleSelectRivalDice(6)}></div>
                        <div className='RivalDice mydicePlus' onClick={()=> setAddRivalDice(true)} >+</div>
                </div>
               
            </div>

            <div className='RivalPokemon_status'>
                <div className='status_battle Paralized' onClick={()=> handleRivalStatus('Paralized')} ></div>
                <div className='status_battle Asleep' onClick={()=> handleRivalStatus('Asleep')}></div>
                <div className='status_battle Frozen' onClick={()=> handleRivalStatus('Frozen')}></div>
                <div className='status_battle Burned' onClick={()=> handleRivalStatus('Burned')}></div>
                <div className='status_battle Confused' onClick={()=> handleRivalStatus('Confused')}></div>
                <div className='status_battle Normal_status' onClick={()=> handleRivalStatus('Normal')}></div>
            </div>
            </div>
           
        </div>
    );
};

export default ModalStadium2;