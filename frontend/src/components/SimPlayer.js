import { useState } from "react";
import { useParams } from "react-router-dom";
import Types from "./Types";
import Attack from "./Attacks";
import PokemonBattleListed from "./PokemonBattleListed";
import ModalPokedex from "./modals/ModalPokedex";

const SimPlayer = ({ game, onSimWildBattle, onSimLeaderBattle }) => {
    const { playerId } = useParams();
    const player = game.players.find(p => p.id === playerId);
    const rival = player ? player.simRival : null;

    // Inputs para configurar el rival de simulacion
    const [showSetup, setShowSetup] = useState(false);
    const [wildPokemonId, setWildPokemonId] = useState('');
    const [showPokedex, setShowPokedex] = useState(false);

    // Fases de batalla (mismo patron que Stadium)
    const [myPokemon, setMyPokemon] = useState();
    const [myPokemonSelected, setMyPokemonSelected] = useState('false');
    const [rivalPokemonSelected, setRivalPokemonSelected] = useState('false');
    const [rivalPokemon, setRivalPokemon] = useState();

    const [myAttack, setMyAttack] = useState();
    const [myBonus, setMyBonus] = useState(0);
    const [rivalAttack, setRivalAttack] = useState();
    const [rivalBonus, setRivalBonus] = useState(0);
    const [myAttackSelected, setMyAttackSelected] = useState('false');
    const [rivalAttackSelected, setRivalAttackSelected] = useState('false');

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

    const [MyBonusAttack1, setMyBonusAttack1] = useState(0);
    const [MyBonusAttack2, setMyBonusAttack2] = useState(0);
    const [MyBonusAttack3, setMyBonusAttack3] = useState(0);
    const [RivalBonusAttack1, setRivalBonusAttack1] = useState(0);
    const [RivalBonusAttack2, setRivalBonusAttack2] = useState(0);
    const [RivalBonusAttack3, setRivalBonusAttack3] = useState(0);

    const [myTotal, setMyTotal] = useState(0);
    const [rivalTotal, setRivalTotal] = useState(0);
    const [myAttackPower, setMyAttackPower] = useState(0);
    const [rivalAttackPower, setRivalAttackPower] = useState(0);
    const [myBonusFinal, setMyBonusFinal] = useState(0);
    const [rivalBonusFinal, setRivalBonusFinal] = useState(0);
    const [myStatus, setMyStatus] = useState('Normal');
    const [rivalStatus, setRivalStatus] = useState('Normal');
    const [myDice, setMyDice] = useState(0);
    const [rivalDice, setRivalDice] = useState(0);
    const [addMyDice, setAddMyDice] = useState(false);
    const [addRivalDice, setAddRivalDice] = useState(false);

    if (!player) {
        return <div className="sim-player">Jugador no encontrado.</div>;
    }

    const handleSetWildRival = () => {
        if (!wildPokemonId) return;
        onSimWildBattle(playerId, wildPokemonId);
        setWildPokemonId('');
        setShowSetup(false);
    };

    const handleSimLeader = (leaderID, pkm1, pkm2) => {
        onSimLeaderBattle(playerId, leaderID, pkm1, pkm2);
        setShowSetup(false);
    };

    async function checkBonusType(Attack_type, PkmRival_type) {
        if (Attack_type.includes("NORMAL") && (PkmRival_type.includes("STEEL") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("ROCK")))
            return -2;
        else if (Attack_type.includes("GRASS")) {
            if (PkmRival_type.includes("GROUND") || PkmRival_type.includes("WATER") || PkmRival_type.includes("ROCK")) return 2;
            else if (PkmRival_type.includes("POISON") || PkmRival_type.includes("BUG") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("DRAGON") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("STEEL")) return -2;
            else return 0;
        } else if (Attack_type.includes("FIRE")) {
            if (PkmRival_type.includes("ICE") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("BUG") || PkmRival_type.includes("STEEL")) return 2;
            else if (PkmRival_type.includes("ROCK") || PkmRival_type.includes("FIRE") || PkmRival_type.includes("WATER") || PkmRival_type.includes("DRAGON")) return -2;
            else return 0;
        } else if (Attack_type.includes("WATER")) {
            if (PkmRival_type.includes("GROUND") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("FIRE")) return 2;
            else if (PkmRival_type.includes("WATER") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("DRAGON")) return -2;
            else return 0;
        } else if (Attack_type.includes("ELECTRIC")) {
            if (PkmRival_type.includes("WATER") || PkmRival_type.includes("FLYING")) return 2;
            else if (PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("GRASS") || PkmRival_type.includes("DRAGON") || PkmRival_type.includes("GROUND")) return -2;
            else return 0;
        } else if (Attack_type.includes("ICE")) {
            if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("GROUND") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("DRAGON")) return 2;
            else if (PkmRival_type.includes("ICE") || PkmRival_type.includes("WATER") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("FIRE")) return -2;
            else return 0;
        } else if (Attack_type.includes("FIGHTING")) {
            if (PkmRival_type.includes("NORMAL") || PkmRival_type.includes("ICE") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("DARK")) return 2;
            else if (PkmRival_type.includes("POISON") || PkmRival_type.includes("BUG") || PkmRival_type.includes("PSYCHIC") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("FAIRY") || PkmRival_type.includes("GHOST")) return -2;
            else return 0;
        } else if (Attack_type.includes("POISON")) {
            if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("FAIRY")) return 2;
            else if (PkmRival_type.includes("POISON") || PkmRival_type.includes("GROUND") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("STEEL")) return -2;
            else return 0;
        } else if (Attack_type.includes("GROUND")) {
            if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("POISON") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("STEEL")) return 2;
            else if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("BUG") || PkmRival_type.includes("FLYING")) return -2;
            else return 0;
        } else if (Attack_type.includes("FLYING")) {
            if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("BUG")) return 2;
            else if (PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("STEEL")) return -2;
            else return 0;
        } else if (Attack_type.includes("PSYCHIC")) {
            if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("POISON")) return 2;
            else if (PkmRival_type.includes("PSYCHIC") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("DARK")) return -2;
            else return 0;
        } else if (Attack_type.includes("BUG")) {
            if (PkmRival_type.includes("GRASS") || PkmRival_type.includes("PSYCHIC") || PkmRival_type.includes("DARK")) return 2;
            else if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("GHOST") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("FAIRY")) return -2;
            else return 0;
        } else if (Attack_type.includes("ROCK")) {
            if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("ICE") || PkmRival_type.includes("FLYING") || PkmRival_type.includes("BUG")) return 2;
            else if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("GROUND") || PkmRival_type.includes("STEEL")) return -2;
            else return 0;
        } else if (Attack_type.includes("GHOST")) {
            if (PkmRival_type.includes("GHOST") || PkmRival_type.includes("PSYCHIC")) return 2;
            else if (PkmRival_type.includes("NORMAL") || PkmRival_type.includes("DARK")) return -2;
            else return 0;
        } else if (Attack_type.includes("DRAGON")) {
            if (PkmRival_type.includes("DRAGON")) return 2;
            else if (PkmRival_type.includes("STEEL") || PkmRival_type.includes("FAIRY")) return -2;
            else return 0;
        } else if (Attack_type.includes("DARK")) {
            if (PkmRival_type.includes("GHOST") || PkmRival_type.includes("PSYCHIC")) return 2;
            else if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("DARK") || PkmRival_type.includes("FAIRY")) return -2;
            else return 0;
        } else if (Attack_type.includes("STEEL")) {
            if (PkmRival_type.includes("ICE") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("FAIRY")) return 2;
            else if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("WATER") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("STEEL")) return -2;
            else return 0;
        } else if (Attack_type.includes("FAIRY")) {
            if (PkmRival_type.includes("FIGHTING") || PkmRival_type.includes("DRAGON") || PkmRival_type.includes("DARK")) return 2;
            else if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("POISON") || PkmRival_type.includes("STEEL")) return -2;
            else return 0;
        } else {
            return 0;
        }
    }

    async function calculateBonus(myPkm, rivalPkm) {
        let aux = 0;
        let aux2 = 0;

        aux = await checkBonusType(myPkm.attack1.type, rivalPkm.type1);
        aux2 = (rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE") ? await checkBonusType(myPkm.attack1.type, rivalPkm.type2) : 0;
        setMyBonusAttack1(aux + aux2);

        aux = await checkBonusType(myPkm.attack2.type, rivalPkm.type1);
        aux2 = (rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE") ? await checkBonusType(myPkm.attack2.type, rivalPkm.type2) : 0;
        setMyBonusAttack2(aux + aux2);

        aux = await checkBonusType(myPkm.attack3.type, rivalPkm.type1);
        aux2 = (rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE") ? await checkBonusType(myPkm.attack3.type, rivalPkm.type2) : 0;
        setMyBonusAttack3(aux + aux2);

        aux = await checkBonusType(rivalPkm.attack1.type, myPkm.type1);
        aux2 = (myPkm.type2 !== null && myPkm.type2 !== "NONE") ? await checkBonusType(rivalPkm.attack1.type, myPkm.type2) : 0;
        setRivalBonusAttack1(aux + aux2);

        aux = await checkBonusType(rivalPkm.attack2.type, myPkm.type1);
        aux2 = (myPkm.type2 !== null && myPkm.type2 !== "NONE") ? await checkBonusType(rivalPkm.attack2.type, myPkm.type2) : 0;
        setRivalBonusAttack2(aux + aux2);

        aux = await checkBonusType(rivalPkm.attack3.type, myPkm.type1);
        aux2 = (myPkm.type2 !== null && myPkm.type2 !== "NONE") ? await checkBonusType(rivalPkm.attack3.type, myPkm.type2) : 0;
        setRivalBonusAttack3(aux + aux2);
    }

    const handleSelectMyPokemon = (pokemon) => {
        setMyPokemon(pokemon);
        setMyPokemonImg(require(`../images/tokens/${pokemon.pokedex}.png`));
        setMyPokemonType1_class(`type_${pokemon.type1}`);
        setMyPokemonType2_class(`type_${pokemon.type2}`);
        setMyPkm_type_id1(`types_${pokemon.id}_1`);
        setMyPkm_type_id2(`types_${pokemon.id}_2`);
        setMyPokemonSelected('true');
    };

    const handleSelectRivalPokemon = async (pokemon) => {
        setRivalPokemon(pokemon);
        setRivalPokemonImg(require(`../images/tokens/${pokemon.pokedex}.png`));
        setRivalPokemonType1_class(`type_${pokemon.type1}`);
        setRivalPokemonType2_class(`type_${pokemon.type2}`);
        setRivalPkm_type_id1(`types_${pokemon.id}_1`);
        setRivalPkm_type_id2(`types_${pokemon.id}_2`);
        await calculateBonus(myPokemon, pokemon);
        setRivalPokemonSelected('true');
    };

    const handleSelectMyAttack = (attack, bonus) => {
        setMyAttack(attack);
        setMyAttackPower(attack.strength);
        setMyBonus(bonus);
        setMyBonusFinal(bonus);
        setMyTotal(attack.strength + bonus + myPokemon.totalLevel);
        setMyAttackSelected('true');
    };

    const handleSelectRivalAttack = (attack, bonus) => {
        setRivalAttack(attack);
        setRivalAttackPower(attack.strength);
        setRivalBonus(bonus);
        setRivalBonusFinal(bonus);
        setRivalTotal(attack.strength + bonus + rivalPokemon.totalLevel);
        setRivalAttackSelected('true');
    };

    function sumTotal(level, attackStrength, bonus, dice) {
        return level + attackStrength + bonus + dice;
    }

    const getStatusClass = (status) => {
        return `status_battle ${status} ${myStatus === status ? 'statusActive' : ''}`;
    };

    const getStatusClass2 = (status) => {
        return `status_battle rotate-x ${status} ${rivalStatus === status ? 'statusActive' : ''}`;
    };

    const handleMyStatus = (newStatus) => {
        if (newStatus === "Asleep" || newStatus === "Paralized" || newStatus === "Frozen") {
            setMyStatus(newStatus);
            setMyAttackPower(0);
            setMyBonusFinal(0);
            setMyTotal(sumTotal(myPokemon.totalLevel, 0, 0, myDice));
        } else if (newStatus === "Burned") {
            setMyStatus(newStatus);
            setMyAttackPower(myAttack.strength - 1);
            setMyBonusFinal(myBonus);
            setMyTotal(sumTotal(myPokemon.totalLevel, myAttack.strength - 1, myBonus, myDice));
        } else if (newStatus === "Confused" || newStatus === "Normal") {
            setMyStatus(newStatus);
            setMyAttackPower(myAttack.strength);
            setMyBonusFinal(myBonus);
            setMyTotal(sumTotal(myPokemon.totalLevel, myAttack.strength, myBonus, myDice));
        }
    };

    const handleRivalStatus = (newStatus) => {
        if (newStatus === "Asleep" || newStatus === "Paralized" || newStatus === "Frozen") {
            setRivalStatus(newStatus);
            setRivalAttackPower(0);
            setRivalBonusFinal(0);
            setRivalTotal(sumTotal(rivalPokemon.totalLevel, 0, 0, rivalDice));
        } else if (newStatus === "Burned") {
            setRivalStatus(newStatus);
            setRivalAttackPower(rivalAttack.strength - 1);
            setRivalBonusFinal(rivalBonus);
            setRivalTotal(sumTotal(rivalPokemon.totalLevel, rivalAttack.strength - 1, rivalBonus, rivalDice));
        } else if (newStatus === "Confused" || newStatus === "Normal") {
            setRivalStatus(newStatus);
            setRivalAttackPower(rivalAttack.strength);
            setRivalBonusFinal(rivalBonus);
            setRivalTotal(sumTotal(rivalPokemon.totalLevel, rivalAttack.strength, rivalBonus, rivalDice));
        }
    };

    const handleSelectMyDice = (dice) => {
        if (addMyDice === true) {
            setMyDice(myDice + dice);
            setMyTotal(myTotal + dice);
            setAddMyDice(false);
        } else {
            setMyDice(dice);
            setMyTotal(sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, dice));
        }
    };

    const handleSelectRivalDice = (dice) => {
        if (addRivalDice === true) {
            setRivalDice(rivalDice + dice);
            setRivalTotal(rivalTotal + dice);
            setAddRivalDice(false);
        } else {
            setRivalDice(dice);
            setRivalTotal(sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, dice));
        }
    };

    const handleRematch = () => {
        setMyPokemon(undefined);
        setRivalPokemon(undefined);
        setMyPokemonSelected('false');
        setRivalPokemonSelected('false');
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        setMyTotal(0);
        setRivalTotal(0);
        setMyDice(0);
        setRivalDice(0);
        setAddMyDice(false);
        setAddRivalDice(false);
        setMyAttack(undefined);
        setRivalAttack(undefined);
        setMyStatus('Normal');
        setRivalStatus('Normal');
    };

    const handleNewSimulation = () => {
        setMyPokemon(undefined);
        setRivalPokemon(undefined);
        setMyPokemonSelected('false');
        setRivalPokemonSelected('false');
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        setMyTotal(0);
        setRivalTotal(0);
        setMyAttack(undefined);
        setRivalAttack(undefined);
        setShowSetup(true);
    };

    return (
        <div className="sim-player">
            <div className="pokedex-button" onClick={() => setShowPokedex(true)}></div>
            <ModalPokedex show={showPokedex} onClose={() => setShowPokedex(false)} player={player} />
           

            {/* Configurar rival de simulacion */}
            {(!rival || showSetup) && (
                <div className="sim-player__setup">
                    <div className="sim-player__setup-wild">
                        <h3>Pokemon Salvaje</h3>
                        <input
                            type="text"
                            placeholder="# Pokedex"
                            value={wildPokemonId}
                            onChange={(e) => setWildPokemonId(e.target.value)}
                        />
                        <button onClick={handleSetWildRival}>Confirmar</button>
                    </div>

                    <div className="sim-player__setup-leader">
                        <div className='Leaders-to-battle'>
                            <div className="Leader leader1" onClick={() => handleSimLeader("Gym1","Brock1","Brock2")}></div>
                            <div className="Leader leader2" onClick={() => handleSimLeader("Gym2","Misty1","Misty2")}></div>
                            <div className="Leader leader3" onClick={() => handleSimLeader("Gym3","Surge1","Surge2")}></div>
                            <div className="Leader leader4" onClick={() => handleSimLeader("Gym4","Erika1","Erika2")}></div>
                            <div className="Leader leader5" onClick={() => handleSimLeader("Gym5","Koga1","Koga2")}></div>
                            <div className="Leader leader6" onClick={() => handleSimLeader("Gym6","Sabrina1","Sabrina2")}></div>
                            <div className="Leader leader7" onClick={() => handleSimLeader("Gym7","Blaine1","Blaine2")}></div>
                            <div className="Leader leader8" onClick={() => handleSimLeader("Gym8","Giovanni1","Giovanni2")}></div>
                        </div>
                        <div className='Elite-to-battle'>
                            <div className="Elite Elite1" onClick={() => handleSimLeader("Elite1","Agatha1","Agatha2")}></div>
                            <div className="Elite Elite2" onClick={() => handleSimLeader("Elite2","Bruno1","Bruno2")}></div>
                            <div className="Elite Elite3" onClick={() => handleSimLeader("Elite3","Lorelei1","Lorelei2")}></div>
                            <div className="Elite Elite4" onClick={() => handleSimLeader("Elite4","Lance1","Lance2")}></div>
                            <div className="Elite Red" onClick={() => handleSimLeader("Red","Red1","Red2")}></div>
                        </div>
                        <div className='Special-to-battle'>
                            <div className="Elite Rocket1" onClick={() => handleSimLeader("Ariadna","Ariadna1","Ariadna2")}></div>
                            <div className="Elite Rocket2" onClick={() => handleSimLeader("Petrel","Petrel1","Petrel2")}></div>
                            <div className="Elite Blue1" onClick={() => handleSimLeader("Blue1","BluePink1","BluePink2")}></div>
                            <div className="Elite Blue2" onClick={() => handleSimLeader("Blue2","BlueGreen1","BlueGreen2")}></div>
                            <div className="Elite Blue3" onClick={() => handleSimLeader("Blue3","BlueBlue1","BlueBlue2")}></div>
                            <div className="Elite Blue4" onClick={() => handleSimLeader("Blue4","BlueYellow1","BlueYellow2")}></div>
                            <div className="Elite Blue5" onClick={() => handleSimLeader("Blue5","BlueRed1","BlueRed2")}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Seleccion de pokemon del jugador */}
            {rival && !showSetup && myPokemonSelected === 'false' && (
                <div className="player-sim-main">
                    <div className="player-name">{player.name}</div>
                    <div className="player_team">
                        {(player.pokemons || []).map((pokemon) => (
                            <PokemonBattleListed
                                key={player.name + pokemon.id}
                                pokemon={pokemon}
                                SelectPokemon={handleSelectMyPokemon}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Seleccion de pokemon del rival */}
            {rival && !showSetup && myPokemonSelected === 'true' && rivalPokemonSelected === 'false' && (
                <div className="rival-sim-main">
                    <div className="rival-name">{rival.name}</div>
                    <div className="rival_team">
                        {(rival.pokemons || []).map((pokemon, index) => (
                            <PokemonBattleListed
                                key={rival.name + index}
                                pokemon={pokemon}
                                SelectPokemon={handleSelectRivalPokemon}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Seleccion de ataques */}
            {!showSetup && rivalPokemonSelected === 'true' && myPokemonSelected === 'true' && (
                <div className="attack-select-sim">
                    <div className='MyPokemon-main'>
                        <div className='MyPokemon_img' style={{ backgroundImage: `url(${myPokemonImg})` }}></div>
                        <div className='MyPokemon_name'>{myPokemon.name}</div>
                        <div className='MyPokemon_level'>Lv: {myPokemon.totalLevel}</div>
                        <div className="types_div">
                            <Types Type={myPokemon.type1} Clase={MyPokemonType1_class} type_id={MyPkm_type_id1} />
                            {(myPokemon.type2 !== null && myPokemon.type2 !== "NONE") &&
                                <Types Type={myPokemon.type2} Clase={MyPokemonType2_class} type_id={MyPkm_type_id2} />}
                        </div>
                        {myAttackSelected === 'false' && (
                            <div className='MyPokemon_attacks'>
                                <div className='MyAttack1' onClick={() => handleSelectMyAttack(myPokemon.attack1, MyBonusAttack1)}>
                                    <Attack attack={myPokemon.attack1} bonus={MyBonusAttack1} />
                                </div>
                                {myPokemon.attack2.name !== 'NONE' && (
                                    <div className='MyAttack2' onClick={() => handleSelectMyAttack(myPokemon.attack2, MyBonusAttack2)}>
                                        <Attack attack={myPokemon.attack2} bonus={MyBonusAttack2} />
                                    </div>
                                )}
                                {myPokemon.attack3.name !== 'NONE' && (
                                    <div className='MyAttack3' onClick={() => handleSelectMyAttack(myPokemon.attack3, MyBonusAttack3)}>
                                        <Attack attack={myPokemon.attack3} bonus={MyBonusAttack3} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className='RivalPokemon-main'>
                        <div className='RivalPokemon_img' style={{ backgroundImage: `url(${rivalPokemonImg})` }}></div>
                        <div className='RivalPokemon_name'>{rivalPokemon.name}</div>
                        <div className='RivalPokemon_level'>Lv: {rivalPokemon.totalLevel}</div>
                        <div className="types_div">
                            <Types Type={rivalPokemon.type1} Clase={RivalPokemonType1_class} type_id={RivalPkm_type_id1} />
                            {(rivalPokemon.type2 !== null && rivalPokemon.type2 !== "NONE") &&
                                <Types Type={rivalPokemon.type2} Clase={RivalPokemonType2_class} type_id={RivalPkm_type_id2} />}
                        </div>
                        {rivalAttackSelected === 'false' && (
                            <div className='RivalPokemon_attacks'>
                                <div className='RivalAttack1' onClick={() => handleSelectRivalAttack(rivalPokemon.attack1, RivalBonusAttack1)}>
                                    <Attack attack={rivalPokemon.attack1} bonus={RivalBonusAttack1} />
                                </div>
                                {rivalPokemon.attack2.name !== 'NONE' && (
                                    <div className='RivalAttack2' onClick={() => handleSelectRivalAttack(rivalPokemon.attack2, RivalBonusAttack2)}>
                                        <Attack attack={rivalPokemon.attack2} bonus={RivalBonusAttack2} />
                                    </div>
                                )}
                                {rivalPokemon.attack3.name !== 'NONE' && (
                                    <div className='RivalAttack3' onClick={() => handleSelectRivalAttack(rivalPokemon.attack3, RivalBonusAttack3)}>
                                        <Attack attack={rivalPokemon.attack3} bonus={RivalBonusAttack3} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resultado y dados */}
                    {myAttackSelected === 'true' && rivalAttackSelected === 'true' && (
                        <div className='Pokemon-stadium2'>
                            <div className="myTotalFinal">{myTotal}</div>
                            <div className="rivalTotalFinal">{rivalTotal}</div>

                            <div className='MyPokemon_status'>
                                <div className={getStatusClass('Paralized')} onClick={() => handleMyStatus('Paralized')}></div>
                                <div className={getStatusClass('Asleep')} onClick={() => handleMyStatus('Asleep')}></div>
                                <div className={getStatusClass('Frozen')} onClick={() => handleMyStatus('Frozen')}></div>
                                <div className={getStatusClass('Burned')} onClick={() => handleMyStatus('Burned')}></div>
                                <div className={getStatusClass('Confused')} onClick={() => handleMyStatus('Confused')}></div>
                                <div className={getStatusClass('Normal')} onClick={() => handleMyStatus('Normal')}></div>
                            </div>

                            <div className='MyPokemon'>
                                <div className='Attack-selected-mypoke'>{myAttack.name} {myAttack.strength}</div>
                                <div className='MyTotal_label'>
                                    <div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Dice</div>=<div>Total</div>
                                </div>
                                <div className='MyTotal'>
                                    <div>{myPokemon.totalLevel}</div>+
                                    <div>{myAttackPower}</div>+
                                    <div>{myBonusFinal}</div>+
                                    <div>{myDice}</div>=
                                    <div>{myTotal}</div>
                                </div>
                                <div className='MyDices'>
                                    <div className='MyDice mydice1' onClick={() => handleSelectMyDice(1)}></div>
                                    <div className='MyDice mydice2' onClick={() => handleSelectMyDice(2)}></div>
                                    <div className='MyDice mydice3' onClick={() => handleSelectMyDice(3)}></div>
                                    <div className='MyDice mydice4' onClick={() => handleSelectMyDice(4)}></div>
                                    <div className='MyDice mydice5' onClick={() => handleSelectMyDice(5)}></div>
                                    <div className='MyDice mydice6' onClick={() => handleSelectMyDice(6)}></div>
                                    <div className='mydicePlus' onClick={() => setAddMyDice(true)}></div>
                                </div>
                            </div>

                            <div className='RivalPokemon'>
                                <div className='Attack-selected-rival'>{rivalAttack.name} {rivalAttack.strength}</div>
                                <div className='RivalTotal_label'>
                                    <div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Dice</div>=<div>Total</div>
                                </div>
                                <div className='RivalTotal'>
                                    <div>{rivalPokemon.totalLevel}</div>+
                                    <div>{rivalAttackPower}</div>+
                                    <div>{rivalBonusFinal}</div>+
                                    <div>{rivalDice}</div>=
                                    <div>{rivalTotal}</div>
                                </div>
                                <div className='RivalDices'>
                                    <div className='rivalDicePlus' onClick={() => setAddRivalDice(true)}></div>
                                    <div className='RivalDice mydice1' onClick={() => handleSelectRivalDice(1)}></div>
                                    <div className='RivalDice mydice2' onClick={() => handleSelectRivalDice(2)}></div>
                                    <div className='RivalDice mydice3' onClick={() => handleSelectRivalDice(3)}></div>
                                    <div className='RivalDice mydice4' onClick={() => handleSelectRivalDice(4)}></div>
                                    <div className='RivalDice mydice5' onClick={() => handleSelectRivalDice(5)}></div>
                                    <div className='RivalDice mydice6' onClick={() => handleSelectRivalDice(6)}></div>
                                </div>
                            </div>

                            <div className='RivalPokemon_status'>
                                <div className={getStatusClass2('Paralized')} onClick={() => handleRivalStatus('Paralized')}></div>
                                <div className={getStatusClass2('Asleep')} onClick={() => handleRivalStatus('Asleep')}></div>
                                <div className={getStatusClass2('Frozen')} onClick={() => handleRivalStatus('Frozen')}></div>
                                <div className={getStatusClass2('Burned')} onClick={() => handleRivalStatus('Burned')}></div>
                                <div className={getStatusClass2('Confused')} onClick={() => handleRivalStatus('Confused')}></div>
                                <div className={getStatusClass2('Normal')} onClick={() => handleRivalStatus('Normal')}></div>
                            </div>

                            <div className="rematchButton" onClick={handleRematch}>Re-Match</div>
                            <div className="change-pokemon" onClick={handleNewSimulation}>Nueva Simulacion</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SimPlayer;
