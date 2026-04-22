import { useState, useEffect } from "react";
import Types from "./Types";
import Attack from "./Attacks";
import PokemonBattleListed from "./PokemonBattleListed";
import ModalRulesGuide from "./modals/ModalRulesGuide";

const LEADER_PREFIXES = ['gym', 'Riv'];

const TYPE_COLORS = {
    FIRE:'#ff6a00', WATER:'#3a9ad9', GRASS:'#4caf50', ELECTRIC:'#f9d71c',
    ICE:'#a8e6f0', FIGHTING:'#c0392b', POISON:'#8e44ad', GROUND:'#d4a017',
    FLYING:'#85c1e9', PSYCHIC:'#f06292', BUG:'#8bc34a', ROCK:'#9e9e9e',
    GHOST:'#5c3566', DRAGON:'#1565c0', DARK:'#263238', STEEL:'#b0bec5',
    FAIRY:'#f8bbd0', NORMAL:'#ffffff',
};

const getPkmImg = (pokedex, generation = 1) => {
    if (LEADER_PREFIXES.some(p => pokedex.startsWith(p))) return require(`../images/Leaders${generation}/${pokedex}.png`);
    if (pokedex.startsWith('M') || pokedex.startsWith('GM') || pokedex.startsWith('A')) return require(`../images/tokens_ultimix/${pokedex}.png`);
    return require(`../images/tokens_ultimix/${pokedex}.png`);
};

const Stadium = ({game, player, rival, onHandleBattlePokemon, onHandleBattleAttack, onHandleTotales, onChangeBattlePhase, onToggleBattlePublic, onHandleDice, onHandleBonuses, onHandleBonusFinal, increaseLevel, changeState}) => {
    const generation = game?.generation || 1;
    
  
    const [myPokemon, setMyPokemon] = useState();
    const [myPokemonSelected, setMyPokemonSelected] = useState('false');
    const [rivalPokemonSelected, setRivalPokemonSelected] = useState('false');
    const [rivalPokemon, setRivalPokemon] = useState();
    const [showRulesGuide, setShowRulesGuide] = useState(false);
   

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
    const [myTotal, setMyTotal] = useState(0);
    const [rivalTotal, setRivalTotal] = useState(0);
    const [myDiceAnim, setMyDiceAnim] = useState(0);
    const [rivalDiceAnim, setRivalDiceAnim] = useState(0);
    const [myDiceRows, setMyDiceRows] = useState([null]);
    const [rivalDiceRows, setRivalDiceRows] = useState([null]);
    const [myLocked, setMyLocked] = useState(false);
    const [rivalLocked, setRivalLocked] = useState(false);

    const [showLevelUpPrompt, setShowLevelUpPrompt] = useState(false);
    const [showKOPrompt, setShowKOPrompt] = useState(false);

    // Efectos visuales avanzados
    const [typeFlashColor, setTypeFlashColor] = useState(null);
    const [screenShake, setScreenShake] = useState(false);
    const [displayMyTotal, setDisplayMyTotal] = useState(0);
    const [displayRivalTotal, setDisplayRivalTotal] = useState(0);

    // Count-up animado cuando cambian los totales reales
    useEffect(() => {
        if (!myTotal) return;
        let start = 0;
        const end = myTotal;
        const duration = 600;
        const step = Math.ceil(duration / end);
        const timer = setInterval(() => {
            start += 1;
            setDisplayMyTotal(start);
            if (start >= end) clearInterval(timer);
        }, step);
        return () => clearInterval(timer);
    }, [myTotal]);

    useEffect(() => {
        if (!rivalTotal) return;
        let start = 0;
        const end = rivalTotal;
        const duration = 600;
        const step = Math.ceil(duration / end);
        const timer = setInterval(() => {
            start += 1;
            setDisplayRivalTotal(start);
            if (start >= end) clearInterval(timer);
        }, step);
        return () => clearInterval(timer);
    }, [rivalTotal]);

    // Screen shake al revelarse ambos totales finales
    useEffect(() => {
        if (myLocked && rivalLocked) {
            setScreenShake(true);
            const t = setTimeout(() => setScreenShake(false), 700);
            return () => clearTimeout(t);
        }
    }, [myLocked, rivalLocked]);

    // Prompt de subir nivel: player ganó y el rival tenía nivel >= al propio
    useEffect(() => {
        if (!myLocked || !rivalLocked) return;
        if (!myPokemon || !rivalPokemon) return;
        if (myTotal > rivalTotal && rivalPokemon.totalLevel >= myPokemon.totalLevel) {
            setShowLevelUpPrompt(true);
        }
    }, [myLocked, rivalLocked]);

    const handleConfirmLevelUp = () => {
        setShowLevelUpPrompt(false);
        increaseLevel(player.id, myPokemon.id);
    };

    // Prompt de noquear: player perdió y su pokemon sigue Alive
    useEffect(() => {
        if (!myLocked || !rivalLocked) return;
        if (!myPokemon || !rivalPokemon) return;
        if (myTotal < rivalTotal && myPokemon.state === 'Alive') {
            setShowKOPrompt(true);
        }
    }, [myLocked, rivalLocked]);

    const handleConfirmKO = () => {
        setShowKOPrompt(false);
        changeState(player.id, myPokemon.id);
    };

    // Flash del tipo al seleccionar ataque — se apaga solo
    useEffect(() => {
        if (!typeFlashColor) return;
        const t = setTimeout(() => setTypeFlashColor(null), 600);
        return () => clearTimeout(t);
    }, [typeFlashColor]);
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
                //Pendiente de ajuster en modal y simPlayer
        } else if (Attack_type.includes("GROUND")) {
            if (PkmRival_type.includes("POISON") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("ICE")   )
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
        const myB1 = aux + aux2;
        setMyBonusAttack1(myB1);
        aux= await checkBonusType(myPokemon.attack2.type, rivalPokemon.type1);
        if(rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ){
            aux2= await checkBonusType(myPokemon.attack2.type, rivalPokemon.type2);
        }
        else{
            aux2=0;
        }
        const myB2 = aux + aux2;
        setMyBonusAttack2(myB2);
        aux=  await checkBonusType(myPokemon.attack3.type, rivalPokemon.type1);
        if(rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ){
        aux2=  await checkBonusType(myPokemon.attack3.type, rivalPokemon.type2);
        }
        else{
        aux2=0;
        }
        const myB3 = aux + aux2;
        setMyBonusAttack3(myB3);

        aux= await checkBonusType(rivalPokemon.attack1.type, myPokemon.type1);
        if(myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ){
            aux2= await checkBonusType(rivalPokemon.attack1.type, myPokemon.type2);
        }
        else{
            aux2=0;
            }
        const rivalB1 = aux + aux2;
        setRivalBonusAttack1(rivalB1);
        aux= await checkBonusType(rivalPokemon.attack2.type, myPokemon.type1);
        if(myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ){
        aux2= await checkBonusType(rivalPokemon.attack2.type, myPokemon.type2);
         }
        else{
        aux2=0;
        }
        const rivalB2 = aux + aux2;
        setRivalBonusAttack2(rivalB2);
        aux= await checkBonusType(rivalPokemon.attack3.type, myPokemon.type1);
        if(myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ){
        aux2= await checkBonusType(rivalPokemon.attack3.type, myPokemon.type2);
        }
        else{
        aux2=0;
        }
        const rivalB3 = aux + aux2;
        setRivalBonusAttack3(rivalB3);

        onHandleBonuses('MyPlayer', myB1, myB2, myB3);
        onHandleBonuses('Rival', rivalB1, rivalB2, rivalB3);
    }
    //Select my Pokemon
    const handleSelectMyPokemon = (pokemon) => {
        setMyPokemon(pokemon);
        console.log("Pokémon seleccionado:", pokemon); // Verifica que contiene el id
        console.log(pokemon.name);
        setMyStatus(pokemon.status);
        //ajuste agregando la carpeta de tokens ultimixdnn
        setMyPokemonImg(getPkmImg(pokemon.pokedex, generation));
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
        setRivalPokemonImg(getPkmImg(pokemon.pokedex, generation));
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
        setTypeFlashColor(TYPE_COLORS[attack.type] || '#ffffff');
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
        onHandleBonusFinal('MyPlayer', bonus);
        }

    const handleSelectRivalAttack =(attack,bonus) =>{
        setTypeFlashColor(TYPE_COLORS[attack.type] || '#ffffff');
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
        onHandleBonusFinal('Rival', bonus);
        onBattlePhase('RollDice');
    }

     //Battle  functions
    function sumTotal (PokemonLevel,AttackStrenght,Bonus,Dice){
        return PokemonLevel + AttackStrenght + Bonus + Dice;
   }
 
    const calcDiceSum = (rows) => rows.reduce((acc, v) => acc + (v || 0), 0);

    const handleSelectMyDice = (rowIndex, dice) => {
        if (myLocked) return;
        setMyDiceAnim(dice);
        const newRows = [...myDiceRows];
        newRows[rowIndex] = dice;
        setMyDiceRows(newRows);
        const diceSum = calcDiceSum(newRows);
        const total = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, diceSum);
        setMyTotal(total);
        onTotales('MyPlayer', total);
        onHandleDice('MyPlayer', diceSum, newRows.filter(v => v !== null));
        // bloquear si se seleccionó el dado de la última fila
        if (rowIndex === newRows.length - 1) setMyLocked(true);
    };

    const handleAddMyDiceRow = () => {
        if (myDiceRows.length >= 3) return;
        setMyDiceRows([...myDiceRows, null]);
        setMyLocked(false);
    };

    const handleUnlockMyDice = () => {
        const newRows = [...myDiceRows];
        newRows[newRows.length - 1] = null;
        setMyDiceRows(newRows);
        setMyLocked(false);
        const diceSum = calcDiceSum(newRows);
        const total = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, diceSum);
        setMyTotal(total);
        onTotales('MyPlayer', total);
        onHandleDice('MyPlayer', diceSum, newRows.filter(v => v !== null));
    };

    const handleSelectRivalDice = (rowIndex, dice) => {
        if (rivalLocked) return;
        setRivalDiceAnim(dice);
        const newRows = [...rivalDiceRows];
        newRows[rowIndex] = dice;
        setRivalDiceRows(newRows);
        const diceSum = calcDiceSum(newRows);
        const total = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, diceSum);
        setRivalTotal(total);
        onTotales('Rival', total);
        onHandleDice('Rival', diceSum, newRows.filter(v => v !== null));
        if (rowIndex === newRows.length - 1) setRivalLocked(true);
    };

    const handleAddRivalDiceRow = () => {
        if (rivalDiceRows.length >= 3) return;
        setRivalDiceRows([...rivalDiceRows, null]);
        setRivalLocked(false);
    };

    const handleUnlockRivalDice = () => {
        const newRows = [...rivalDiceRows];
        newRows[newRows.length - 1] = null;
        setRivalDiceRows(newRows);
        setRivalLocked(false);
        const diceSum = calcDiceSum(newRows);
        const total = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, diceSum);
        setRivalTotal(total);
        onTotales('Rival', total);
        onHandleDice('Rival', diceSum, newRows.filter(v => v !== null));
    };

       const handleMyStatus =(myNewStatus) =>{
           
           if(myNewStatus === "Asleep" || myNewStatus === "Paralized" || myNewStatus === "Frozen"){
               setMyStatus(myNewStatus);
               setMyAttackPower(0);
               setMyBonusFinal(0);
               setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,calcDiceSum(myDiceRows)));
               onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,calcDiceSum(myDiceRows)));
           }
           else if(myNewStatus === "Burned"){
               setMyStatus(myNewStatus);
               setMyAttackPower(myAttack.strength -1);
               setMyBonusFinal(myBonus);
               setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,calcDiceSum(myDiceRows)));
               onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,calcDiceSum(myDiceRows)));
           }
           else if(myNewStatus === "Confused" || myNewStatus === "Normal"){
               setMyStatus(myNewStatus);
               setMyAttackPower(myAttack.strength);
               setMyBonusFinal(myBonus);
               setMyTotal(sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,calcDiceSum(myDiceRows)));
               onTotales('MyPlayer',sumTotal(myPokemon.totalLevel,myAttackPower,myBonusFinal,calcDiceSum(myDiceRows)));
           }
       }

       const handleRivalStatus =(myNewStatus) =>{
           
           if(myNewStatus === "Asleep" || myNewStatus === "Paralized" || myNewStatus === "Frozen"){
               setRivalStatus(myNewStatus);
               setRivalAttackPower(0);
               setRivalBonusFinal(0);
               setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,calcDiceSum(rivalDiceRows)));
               onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,calcDiceSum(rivalDiceRows)));
           }
           else if(myNewStatus === "Burned"){
               setRivalStatus(myNewStatus);
               setRivalAttackPower(rivalAttack.strength -1);
               setRivalBonusFinal(rivalBonus);
               setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,calcDiceSum(rivalDiceRows)));
               onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,calcDiceSum(rivalDiceRows)));
           }
           else if(myNewStatus === "Confused" || myNewStatus === "Normal"){
               setRivalStatus(myNewStatus);
               setRivalAttackPower(rivalAttack.strength);
               setRivalBonusFinal(rivalBonus);
               setRivalTotal(sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,calcDiceSum(rivalDiceRows)));
               onTotales('Rival',sumTotal(rivalPokemon.totalLevel,rivalAttackPower,rivalBonusFinal,calcDiceSum(rivalDiceRows)));
           }
       }

       const getStatusClass = (status) => {
        return `status_battle ${status} ${myStatus === status ? 'statusActive' : ''}`;
    };

    const getStatusClass2 = (status) => {
        return `status_battle rotate-x ${status} ${rivalStatus === status ? 'statusActive' : ''}`;
    };

    const resetDice = () => {
        setMyDiceRows([null]);
        setRivalDiceRows([null]);
        setMyLocked(false);
        setRivalLocked(false);
        onHandleDice('MyPlayer', 0, []);
        onHandleDice('Rival', 0, []);
    };

    const handleRematch = () => {
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        resetDice();
        onBattlePhase('AttackSelection');
    };

    const ChangePokemon = () => {
        setMyPokemonSelected('false');
        setRivalPokemonSelected('false');
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        resetDice();
        onBattlePhase('PokemonSelection');

    };
    const EndBattle = () => {
      console.log('EndBattle');
    };

  

    return (
        
        <div className={`Stadium ${screenShake ? 'anim-screen-shake' : ''}`}>
            {typeFlashColor && (
                <div className="type-flash-overlay" style={{ backgroundColor: typeFlashColor }} />
            )}
            
            {player && myPokemonSelected === 'false'  && (
            <div className="player-stadium-main anim-slide-left">
                <div className="player-name">{player.name}</div>
                <div className="player_team">
                {(player.pokemons || []).map((pokemon) => (
                    <PokemonBattleListed key = {player.name + pokemon.id} pokemon={pokemon}  SelectPokemon={handleSelectMyPokemon} generation={generation}/>

                 ))}
                </div>

                <div className="player_team">
                {(player.megas || []).map((pokemon) => (
                    <PokemonBattleListed key = {player.name + pokemon.id} pokemon={pokemon}  SelectPokemon={handleSelectMyPokemon} generation={generation}/>
                 ))}
                </div>

                {player.dynamax && (
                <div className="player_team">
                {(player.gmaxes || []).map((pokemon) => (
                    <PokemonBattleListed key = {player.name + pokemon.id} pokemon={pokemon}  SelectPokemon={handleSelectMyPokemon} generation={generation}/>
                 ))}
                </div>
                )}
            </div>
            )}
            <label className="switch">
                <input type="checkbox" checked={game.battlePublic} onChange={onToggleBattlePublic} />
                <span className="slider round"></span>
            </label>

            {rival && rivalPokemonSelected === 'false'  && (
            <div  className="rival-stadium-main anim-slide-right">
                <div className="rival-name">{rival.name}</div>
                <div  className="rival_team">
                {(rival.pokemons || []).map((pokemon) => (
                 <PokemonBattleListed key = {rival.name + rival.id} pokemon={pokemon}  SelectPokemon={handleSelectRivalPokemon} generation={generation}/>
                 ))}
                </div>
            </div>
            )}

            {rivalPokemonSelected === 'true' && myPokemonSelected === 'true' && (
            <div className="attack-select-main">
                    <div className='MyPokemon-main anim-slide-left'>
                        <div className={`MyPokemon_img ${myLocked && rivalLocked ? (myTotal >= rivalTotal ? 'winner-img' : 'loser-img') : ''}`} style={{ backgroundImage: `url(${myPokemonImg})`}}></div>
                        <div className='MyPokemon_name'>{myPokemon.name}</div>
                        <div className='MyPokemon_level'>Lv: {myPokemon.totalLevel}</div>
                        <div className="types_div">
                            <Types Type={myPokemon.type1}  Clase={MyPokemonType1_class} type_id={MyPkm_type_id1}/>
                            { (myPokemon.type2 !== null && myPokemon.type2 !== "NONE" ) && <Types Type={myPokemon.type2}  Clase={MyPokemonType2_class} type_id={MyPkm_type_id2}/>}
                        </div>
                        {myAttackSelected === 'true' && myDiceRows.some(v => v !== null) && (
                            <div className='my-dice-panel'>
                                {myDiceRows.filter(v => v !== null).map((val, idx) => (
                                    <div key={idx} className={`MyDice mydice${val} dice-selected`} />
                                ))}
                            </div>
                        )}
                       { myAttackSelected === 'false' && (<div className='MyPokemon_attacks' >
                            <div className='MyAttack1'  onClick={()=>handleSelectMyAttack (myPokemon.attack1, MyBonusAttack1)}> <Attack attack={myPokemon.attack1} bonus ={MyBonusAttack1}/> </div>
                            {myPokemon.attack2.name !== 'NONE' && <div className='MyAttack2'  onClick={()=>handleSelectMyAttack (myPokemon.attack2 ,MyBonusAttack2)}>  <Attack attack={myPokemon.attack2} bonus ={MyBonusAttack2}/> </div>}
                            {myPokemon.attack3.name !== 'NONE' && <div className='MyAttack3'  onClick={()=>handleSelectMyAttack (myPokemon.attack3 ,MyBonusAttack3)}>  <Attack attack={myPokemon.attack3} bonus ={MyBonusAttack3}/> </div>}
                        </div> ) }                      
                    </div>

                    <div className='RivalPokemon-main anim-slide-right'>
                        <div className={`RivalPokemon_img ${myLocked && rivalLocked ? (rivalTotal >= myTotal ? 'winner-img' : 'loser-img') : ''}`} style={{ backgroundImage: `url(${rivalPokemonImg})`}}></div>
                        <div className='RivalPokemon_name'>{rivalPokemon.name}</div>
                        <div className='RivalPokemon_level'>Lv: {rivalPokemon.totalLevel}</div>
                        <div className="types_div">
                            <Types Type={rivalPokemon.type1}  Clase={RivalPokemonType1_class} type_id={RivalPkm_type_id1}/>
                            { (rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE" ) && <Types Type={rivalPokemon.type2}  Clase={RivalPokemonType2_class} type_id={RivalPkm_type_id2}/>}
                        </div>
                        {rivalAttackSelected === 'true' && rivalDiceRows.some(v => v !== null) && (
                            <div className='rival-dice-panel'>
                                {rivalDiceRows.filter(v => v !== null).map((val, idx) => (
                                    <div key={idx} className={`RivalDice mydice${val} dice-selected`} />
                                ))}
                            </div>
                        )}
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
                {myLocked && rivalLocked && <>
                    <div className={`myTotalFinal anim-pop ${myTotal > rivalTotal ? 'total-win' : myTotal < rivalTotal ? 'total-lose' : 'total-tie'}`}>{displayMyTotal}</div>
                    <div className={`rivalTotalFinal anim-pop ${rivalTotal > myTotal ? 'total-win' : rivalTotal < myTotal ? 'total-lose' : 'total-tie'}`}>{displayRivalTotal}</div>
                </>}
            <div className='MyPokemon_status'>
                <div className={getStatusClass('Paralized')} onClick={()=> handleMyStatus('Paralized')}></div>
                <div className={getStatusClass('Asleep')} onClick={()=> handleMyStatus('Asleep')}></div>
                <div className={getStatusClass('Frozen')} onClick={()=> handleMyStatus('Frozen')}></div>
                <div className={getStatusClass('Burned')} onClick={()=> handleMyStatus('Burned')}></div>
                <div className={getStatusClass('Confused')} onClick={()=> handleMyStatus('Confused')}></div>
                <div className={getStatusClass('Normal')} onClick={()=> handleMyStatus('Normal')}></div>
            </div>

            <div className='MyPokemon'>
            <div className='Attack-selected-mypoke anim-fade-up'><Attack attack={myAttack} bonus={myBonusFinal} /></div>
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
                        <div>{calcDiceSum(myDiceRows)}  </div>=
                        <div> {myTotal} </div>
                    </div>


                    {/* Dados de selección — lado izquierdo */}
                    <div className='MyDices'>
                        {myLocked ? (
                            <>
                                <div className='dice-refresh' onClick={handleUnlockMyDice}>↺</div>
                                {myDiceRows.length < 3 &&
                                    <div className='mydicePlus' onClick={handleAddMyDiceRow} />}
                            </>
                        ) : (
                            myDiceRows.map((val, rowIdx) => {
                                const isLastRow = rowIdx === myDiceRows.length - 1;
                                if (val !== null) return null;
                                return (
                                    <div key={rowIdx} className='dice-row'>
                                        {[1,2,3,4,5,6].map(n => (
                                            <div key={n}
                                                className={`MyDice mydice${n} ${myDiceAnim === n && isLastRow ? 'anim-dice' : ''}`}
                                                onClick={() => handleSelectMyDice(rowIdx, n)} />
                                        ))}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
              <div className='RivalPokemon'>
                    <div className='Attack-selected-rival anim-fade-up'><Attack attack={rivalAttack} bonus={rivalBonusFinal} /></div>
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
                        <div>{calcDiceSum(rivalDiceRows)} </div>=
                        <div> {rivalTotal} </div>
                    </div>
                    {/* Dados de selección — lado derecho */}
                    <div className='RivalDices'>
                        {rivalLocked ? (
                            <>
                                <div className='dice-refresh' onClick={handleUnlockRivalDice}>↺</div>
                                {rivalDiceRows.length < 3 &&
                                    <div className='rivalDicePlus' onClick={handleAddRivalDiceRow} />}
                            </>
                        ) : (
                            rivalDiceRows.map((val, rowIdx) => {
                                const isLastRow = rowIdx === rivalDiceRows.length - 1;
                                if (val !== null) return null;
                                return (
                                    <div key={rowIdx} className='dice-row'>
                                        {[1,2,3,4,5,6].map(n => (
                                            <div key={n}
                                                className={`RivalDice mydice${n} ${rivalDiceAnim === n && isLastRow ? 'anim-dice' : ''}`}
                                                onClick={() => handleSelectRivalDice(rowIdx, n)} />
                                        ))}
                                    </div>
                                );
                            })
                        )}
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
          
        <div className="rules-guide-float-btn" onClick={() => setShowRulesGuide(true)}>?</div>
        <ModalRulesGuide show={showRulesGuide} onClose={() => setShowRulesGuide(false)} />

        {showKOPrompt && (
            <div className="modal-backdrop" onClick={() => setShowKOPrompt(false)}>
                <div className="levelup-prompt" onClick={e => e.stopPropagation()}>
                    <div className="levelup-prompt-title" style={{color: '#e74c3c'}}>¡Derrota!</div>
                    <div className="levelup-prompt-msg">
                        {myPokemon?.name} fue noqueado por {rivalPokemon?.name}.
                        <br />¿Marcar como noqueado?
                    </div>
                    <div className="levelup-prompt-buttons">
                        <button className="levelup-btn-yes" onClick={handleConfirmKO}>Sí</button>
                        <button className="levelup-btn-no" onClick={() => setShowKOPrompt(false)}>No</button>
                    </div>
                </div>
            </div>
        )}

        {showLevelUpPrompt && (
            <div className="modal-backdrop" onClick={() => setShowLevelUpPrompt(false)}>
                <div className="levelup-prompt" onClick={e => e.stopPropagation()}>
                    <div className="levelup-prompt-title">¡Victoria!</div>
                    <div className="levelup-prompt-msg">
                        {myPokemon.name} derrotó a {rivalPokemon.name} (Lv. {rivalPokemon.totalLevel}).
                        <br />¿Subir de nivel?
                    </div>
                    <div className="levelup-prompt-buttons">
                        <button className="levelup-btn-yes" onClick={handleConfirmLevelUp}>Sí</button>
                        <button className="levelup-btn-no" onClick={() => setShowLevelUpPrompt(false)}>No</button>
                    </div>
                </div>
            </div>
        )}

        </div>
    )
};

export default Stadium;