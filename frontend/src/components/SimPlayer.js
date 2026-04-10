import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Types from "./Types";
import Attack from "./Attacks";
import PokemonBattleListed from "./PokemonBattleListed";
import ModalPokedex from "./modals/ModalPokedex";
import ModalLeaderViewer from "./modals/ModalLeaderViewer";
import ModalTiendaSim from "./modals/ModalTiendaSim";
import SERVER_IP from "../config.js";

const LEADER_PREFIXES = ['gym', 'Riv'];

const getPkmImg = (pokedex, generation = 1) => {
    if (LEADER_PREFIXES.some(p => pokedex.startsWith(p))) return require(`../images/Leaders${generation}/${pokedex}.png`);
    if (pokedex.startsWith('M') || pokedex.startsWith('GM') || pokedex.startsWith('A')) return require(`../images/tokens_ultimix/${pokedex}.png`);
    return require(`../images/tokens_ultimix/${pokedex}.png`);
};

const getSafePkmImg = (pokedex, generation = 1) => {
    try { return getPkmImg(pokedex, generation); } catch { return null; }
};

const SimPlayer = ({ game, onSimWildBattle, onSimLeaderBattle }) => {
    const { playerId } = useParams();
    const player = game.players.find(p => p.id === playerId);
    const rival = player ? player.simRival : null;
    const generation = game?.generation || 1;

    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        fetch(`${SERVER_IP}/get-leaders?generation=${generation}`)
            .then(r => r.json())
            .then(data => setLeaders(data))
            .catch(console.error);
    }, [generation]);

    // Inputs para configurar el rival de simulacion
    const [showSetup, setShowSetup] = useState(false);
    const [wildPokemonId, setWildPokemonId] = useState('');
    const [wildPreviewImg, setWildPreviewImg] = useState(null);
    const [wildChain, setWildChain] = useState(null);
    const [showWildModal, setShowWildModal] = useState(false);
    const [showPokedex, setShowPokedex] = useState(false);
    const [showLeaderViewer, setShowLeaderViewer] = useState(false);
    const [showStore, setShowStore] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [showOtherRivals, setShowOtherRivals] = useState(false);

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

    // Detectar cuando el request pendiente fue resuelto (aprobado o denegado)
    useEffect(() => {
        if (!pendingRequest) return;
        const stillPending = (game.pendingPurchases || []).find(r => r.id === pendingRequest.id);
        if (!stillPending) setPendingRequest(null);
    }, [game.pendingPurchases, pendingRequest]);

    // Detectar pokemon escaneado por RFID → mostrar el mismo modal que búsqueda manual
    const prevSimRivalId = React.useRef(null);
    useEffect(() => {
        if (!player) return;
        const rival = player.simRival;
        if (!rival || !rival.id.startsWith('SimRival-')) return;
        if (rival.id === prevSimRivalId.current) return; // ya procesado
        prevSimRivalId.current = rival.id;

        const scannedPokemon = rival.pokemons?.[0];
        if (!scannedPokemon) return;

        const pokedex = scannedPokemon.pokedex;
        const img = getSafePkmImg(pokedex, generation);
        setWildPokemonId(pokedex);
        setWildPreviewImg(img);
        setShowSetup(true);

        fetch(`${SERVER_IP}/get-evolution-chain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pokedexId: pokedex })
        })
            .then(r => r.json())
            .then(data => { setWildChain(data); setShowWildModal(true); })
            .catch(() => setShowWildModal(false));
    }, [player?.simRival?.id]);

    if (!player) {
        return <div className="sim-player">Jugador no encontrado.</div>;
    }

    const handleSearchWildPokemon = async () => {
        if (!wildPokemonId) return;
        try {
            const padded = wildPokemonId.padStart(4, '0');
            const img = getPkmImg(padded, generation);
            setWildPreviewImg(img);
            setWildPokemonId(padded);
            const res = await fetch(`${SERVER_IP}/get-evolution-chain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pokedexId: padded })
            });
            const data = await res.json();
            setWildChain(data);
        } catch (e) {
            setWildPreviewImg(null);
            setWildChain(null);
        }
    };

    const handleConfirmWildPokemon = () => {
        if (!wildPokemonId) return;
        onSimWildBattle(playerId, wildPokemonId);
        setWildPokemonId('');
        setWildPreviewImg(null);
        setWildChain(null);
        setShowWildModal(false);
        setShowSetup(false);
    };

    const handleSimLeader = (leaderID, pkm1, pkm2) => {
        onSimLeaderBattle(playerId, leaderID, pkm1, pkm2);
        setShowSetup(false);
    };

    const handleRequestPurchase = async (item, price) => {
        try {
            const res = await fetch(`${SERVER_IP}/request-purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, item, price })
            });
            const data = await res.json();
            if (res.ok) setPendingRequest({ id: data.purchaseId, item, price });
        } catch (err) {
            console.error('Error al solicitar compra:', err);
        }
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
            if (PkmRival_type.includes("FIRE") || PkmRival_type.includes("ELECTRIC") || PkmRival_type.includes("POISON") || PkmRival_type.includes("ROCK") || PkmRival_type.includes("STEEL") || PkmRival_type.includes("ICE")) return 2;
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
        setMyPokemonImg(getPkmImg(pokemon.pokedex, generation));
        setMyPokemonType1_class(`type_${pokemon.type1}`);
        setMyPokemonType2_class(`type_${pokemon.type2}`);
        setMyPkm_type_id1(`types_${pokemon.id}_1`);
        setMyPkm_type_id2(`types_${pokemon.id}_2`);
        setMyPokemonSelected('true');
    };

    const handleSelectRivalPokemon = async (pokemon) => {
        setRivalPokemon(pokemon);
        setRivalPokemonImg(getPkmImg(pokemon.pokedex, generation));
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
                {/* Home fijo siempre visible */}
            <div className="sim-home-button" onClick={handleNewSimulation}></div>

            {/* Info nombre/monedas — solo en setup */}
            {(!rival || showSetup) && (
                <div className="sim-player-info">
                    <span className="sim-player-info-name">{player.name}</span>
                    <span className="sim-player-info-coins">${player.coins}</span>
                </div>
            )}

            <ModalPokedex show={showPokedex} onClose={() => setShowPokedex(false)} player={player} />
            <ModalLeaderViewer show={showLeaderViewer} onClose={() => setShowLeaderViewer(false)} generation={generation} />
            <ModalTiendaSim show={showStore} onClose={() => setShowStore(false)} player={player} pendingRequest={pendingRequest} onRequestPurchase={handleRequestPurchase} />

            {/* Modal info pokemon salvaje */}
            {showWildModal && wildChain && (
                <div className="modal-backdrop" onClick={() => setShowWildModal(false)}>
                    <div className="sim-wild-modal" onClick={e => e.stopPropagation()}>
                        <button className="sim-wild-modal-close" onClick={() => setShowWildModal(false)}>✕</button>
                        <div className="sim-wild-modal-chain">
                            {wildChain.map((node, i) => {
                                const nodeImg = getSafePkmImg(node.pokedex, generation);
                                if (!nodeImg) return null;
                                return (
                                    <div key={node.pokedex} className="pokedex-step">
                                        {i > 0 && <div className="pokedex-arrow">▶</div>}
                                        <div className="pokedex-token-wrapper">
                                            <div className={`pokedex-token ${node.isMega ? 'pokedex-token--mega' : ''}`}
                                                style={{ backgroundImage: `url(${nodeImg})` }} />
                                        </div>
                                        {node.gmax && (() => {
                                            const img = getSafePkmImg(node.gmax, generation);
                                            return img ? (<><div className="pokedex-arrow pokedex-arrow--gmax"></div><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null;
                                        })()}
                                        {node.branches && node.branches.length > 0 && (
                                            <>
                                                <div className={`pokedex-arrow ${node.branches[0].isMega ? 'pokedex-arrow--mega' : ''}`}>
                                                    {node.branches[0].isMega ? '' : '▶'}
                                                </div>
                                                <div className="pokedex-branches">
                                                    {node.branches.map(branch => {
                                                        const branchImg = getSafePkmImg(branch.pokedex, generation);
                                                        if (!branchImg) return null;
                                                        return (
                                                            <div key={branch.pokedex} className="pokedex-branch-group">
                                                                <div className="pokedex-token-wrapper">
                                                                    <div className={`pokedex-token ${branch.isMega ? 'pokedex-token--mega' : ''}`}
                                                                        style={{ backgroundImage: `url(${branchImg})` }} />
                                                                </div>
                                                                {branch.mega && (() => {
                                                                    const img = getSafePkmImg(branch.mega, generation);
                                                                    return img ? (<><div className="pokedex-arrow pokedex-arrow--mega"></div><div className="pokedex-token-wrapper"><div className="pokedex-token pokedex-token--mega" style={{ backgroundImage: `url(${img})` }} /></div></>) : null;
                                                                })()}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <button className="sim-wild-modal-fight" onClick={handleConfirmWildPokemon}>⚔</button>
                    </div>
                </div>
            )}

            {/* Modal rivales secundarios */}
            {showOtherRivals && (
                <div className="modal-backdrop" onClick={() => setShowOtherRivals(false)}>
                    <div className="sim-other-rivals-modal" onClick={e => e.stopPropagation()}>
                        <div className="sim-other-rivals-title">
                            Elite 4 / Campeón / Rival
                            <button className="sim-other-rivals-close" onClick={() => setShowOtherRivals(false)}>✕</button>
                        </div>
                        <div className="sim-other-rivals-group">
                            <div className="sim-other-rivals-label">Elite 4</div>
                            <div className="sim-other-rivals-row">
                                {leaders.filter(l => l.category === 'elite').map(l => {
                                    const img = l.img ? getPkmImg(l.img, generation) : null;
                                    return <div key={l.leaderKey} className="Elite"
                                        style={img ? { backgroundImage: `url(${img})` } : {}}
                                        onClick={() => { handleSimLeader(l.leaderKey, l.uid1, l.uid2); setShowOtherRivals(false); }} />;
                                })}
                            </div>
                        </div>
                        <div className="sim-other-rivals-group">
                            <div className="sim-other-rivals-label">Campeón / Especial</div>
                            <div className="sim-other-rivals-row">
                                {leaders.filter(l => l.category === 'champion' || l.category === 'rocket').map(l => {
                                    const img = l.img ? getPkmImg(l.img, generation) : null;
                                    return <div key={l.leaderKey} className="Elite"
                                        style={img ? { backgroundImage: `url(${img})` } : {}}
                                        onClick={() => { handleSimLeader(l.leaderKey, l.uid1, l.uid2); setShowOtherRivals(false); }} />;
                                })}
                            </div>
                        </div>
                        <div className="sim-other-rivals-group">
                            <div className="sim-other-rivals-label">Rival</div>
                            <div className="sim-other-rivals-row">
                                {leaders.filter(l => l.category === 'rival').map(l => {
                                    const img = l.img ? getPkmImg(l.img, generation) : null;
                                    return <div key={l.leaderKey} className="Elite"
                                        style={img ? { backgroundImage: `url(${img})` } : {}}
                                        onClick={() => { handleSimLeader(l.leaderKey, l.uid1, l.uid2); setShowOtherRivals(false); }} />;
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Setup principal */}
            {(!rival || showSetup) && (
                <div className="sim-player__setup">
                    {/* Wild pokemon */}
                    <div className="sim-player__setup-wild">
                        <input
                            type="number"
                            placeholder="# Pokedex"
                            value={wildPokemonId}
                            onChange={(e) => { setWildPokemonId(e.target.value); setWildPreviewImg(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchWildPokemon()}
                        />
                        <button onClick={handleSearchWildPokemon}>Buscar</button>
                        {wildPreviewImg && (
                            <div className="sim-wild-preview" onClick={() => setShowWildModal(true)}>
                                <img src={wildPreviewImg} alt={wildPokemonId} className="sim-wild-preview-img" />
                            </div>
                        )}
                    </div>

                    {/* 8 líderes de gimnasio prominentes */}
                    <div className="sim-gym-leaders">
                        <div className="sim-gym-leaders-title">Líderes de Gimnasio</div>
                        <div className="sim-gym-leaders-grid">
                            {leaders.filter(l => l.category === 'gym').map(l => {
                                const img = l.img ? getPkmImg(l.img, generation) : null;
                                return <div key={l.leaderKey} className="sim-gym-leader-card"
                                    style={img ? { backgroundImage: `url(${img})` } : {}}
                                    onClick={() => handleSimLeader(l.leaderKey, l.uid1, l.uid2)} />;
                            })}
                        </div>
                    </div>

                    {/* Botón para Elite4 / Campeón / Rival */}
                    <div className="sim-other-rivals-btn" onClick={() => setShowOtherRivals(true)}>
                        <div className="sim-other-rivals-btn-icon"></div>
                        <span>Elite 4 / Campeón / Rival</span>
                    </div>

                    {/* Botones inferiores */}
                    <div className="sim-setup-bottom-btns">
                        <div className="sim-setup-btn" onClick={() => setShowPokedex(true)}>
                            <div className="sim-setup-btn-icon sim-topbar-pokedex"></div>
                            <span>Pokedex</span>
                        </div>
                        <div className="sim-setup-btn" onClick={() => setShowLeaderViewer(true)}>
                            <div className="sim-setup-btn-icon sim-topbar-book"></div>
                            <span>Guia</span>
                        </div>
                        <div className={`sim-setup-btn ${pendingRequest ? 'sim-store-button--pending' : ''}`} onClick={() => setShowStore(true)}>
                            <div className="sim-setup-btn-icon sim-topbar-store"></div>
                            <span>Tienda</span>
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
                                generation={generation}
                            />
                        ))}
                    </div>
                    <div className="player_team">
                        {(player.megas || []).map((pokemon) => (
                            <PokemonBattleListed
                                key={player.name + pokemon.id}
                                pokemon={pokemon}
                                SelectPokemon={handleSelectMyPokemon}
                                generation={generation}
                            />
                        ))}
                    </div>
                    {player.dynamax && (
                    <div className="player_team">
                        {(player.gmaxes || []).map((pokemon) => (
                            <PokemonBattleListed
                                key={player.name + pokemon.id}
                                pokemon={pokemon}
                                SelectPokemon={handleSelectMyPokemon}
                                generation={generation}
                            />
                        ))}
                    </div>
                    )}
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
                                generation={generation}
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
                                <div className='Attack-selected-mypoke'><Attack attack={myAttack} bonus={myBonusFinal} /></div>
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
                                <div className='Attack-selected-rival'><Attack attack={rivalAttack} bonus={rivalBonusFinal} /></div>
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
