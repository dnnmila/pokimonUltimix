import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import pokellamada from "../tones/pokellamada.mp3";
import lifepointsSound from "../tones/lifepoints.mp3";
import Types from "./Types";
import Attack from "./Attacks";
import PokemonBattleListed from "./PokemonBattleListed";
import PlayerListed from "./PlayerListed";
import ModalPokedex from "./modals/ModalPokedex";
import ModalLeaderViewer from "./modals/ModalLeaderViewer";
import ModalTiendaSim from "./modals/ModalTiendaSim";
import ModalRulesGuide from "./modals/ModalRulesGuide";
import ModalEvolveChoice from "./modals/ModalEvolveChoice";
import ModalFrontier from "./modals/ModalFrontier";
import MusicPlayer from "./MusicPlayer";
import SERVER_IP from "../config.js";

const LEADER_PREFIXES = ['gym', 'Riv'];

const getBadgeImg = (gen, num) => {
    try {
        return require(`../images/badges/badges${gen}/badge${num}.webp`);
    } catch (e) {
        try { return require(`../images/badges/badge${num}.png`); } catch { return null; }
    }
};

const getPkmImg = (pokedex, generation = 1) => {
    if (LEADER_PREFIXES.some(p => pokedex.startsWith(p))) return require(`../images/Leaders${generation}/${pokedex}.png`);
    if (pokedex.startsWith('M') || pokedex.startsWith('GM') || pokedex.startsWith('A')) return require(`../images/tokens_ultimix/${pokedex}.png`);
    return require(`../images/tokens_ultimix/${pokedex}.png`);
};

const getSafePkmImg = (pokedex, generation = 1) => {
    try { return getPkmImg(pokedex, generation); } catch { return null; }
};

const getPokemonImg = (pokedex) => {
    try { return require(`../images/POKEMON/${pokedex}.png`); } catch { return null; }
};

const TRAINER_CLASS = {
    Mila: 'trainer1', Wuicho: 'trainer2', Kevin: 'trainer3', Kampis: 'trainer4',
    Mandito: 'trainer5', Doc: 'trainer6', Tacho: 'trainer7', Fede: 'trainer8',
    Perry: 'trainer9', Richi: 'trainer10', Mono: 'trainer11', Foxi: 'trainer2',
};

const SimPlayer = ({ game, onSimWildBattle, onSimLeaderBattle, onSimPlayerBattle, onChangeState, onIncreaseLevel, onStartSimMirror, onHandleBattlePokemon, onHandleBattleAttack, onHandleTotales, onChangeBattlePhase, onHandleDice, onHandleBonuses, onHandleBonusFinal, onToggleBattlePublic, onEvolvePokemon, onNextTurn, onAddPokemon, onRemovePokemon }) => {
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
    const [showRulesGuide, setShowRulesGuide] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [showOtherRivals, setShowOtherRivals] = useState(false);
    const [showTurnModal, setShowTurnModal] = useState(false);
    const [showLevelUpPrompt, setShowLevelUpPrompt] = useState(false);
    const [gymLeaderBadgeNum, setGymLeaderBadgeNum] = useState(null);
    const [pendingBadge, setPendingBadge] = useState(false);
    const [showEvolveModal, setShowEvolveModal] = useState(false);
    const [evolveOptions, setEvolveOptions] = useState([]);
    const [evolvingPkm, setEvolvingPkm] = useState(null);
    const [showAllPlayers, setShowAllPlayers] = useState(false);
    const [showFrontierModal, setShowFrontierModal] = useState(false);
    const [showCapturePrompt, setShowCapturePrompt] = useState(false);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [pendingCapturePokedex, setPendingCapturePokedex] = useState(null);

    const handleToggleFrontier = (frontierKey) => {
        fetch(`${SERVER_IP}/toggle-frontier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, frontierKey }),
        });
    };
    const [showBadgePrompt, setShowBadgePrompt] = useState(false);
    const isMyTurn = game.players[game.currentTurn]?.id === playerId;
    const isOfficialBattle = isMyTurn && game.battlePublic;

    const playTurnSound = () => {
        try {
            // eslint-disable-next-line
            const ctx = new (window.AudioContext || window['webkitAudioContext'])();
            const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
            notes.forEach((freq, i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
                gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 0.2);
            });
        } catch (e) {}
    };

    const stopTurnAlert = () => {
        clearTimeout(turnAlertTimer.current);
        if (turnAudio.current) { turnAudio.current.pause(); turnAudio.current = null; }
    };

    useEffect(() => {
        if (isMyTurn) {
            setShowTurnModal(true);
            playTurnSound();

            // Crear y precargar el audio ahora (cercano a interacción del usuario)
            const audio = new Audio(pokellamada);
            audio.loop = true;
            audio.preload = 'auto';
            audio.load();
            turnAudio.current = audio;

            turnAlertTimer.current = setTimeout(() => {
                if (turnAudio.current) turnAudio.current.play().catch(console.warn);
            }, 5000);
        }
        return () => clearTimeout(turnAlertTimer.current);
    }, [game.currentTurn]);

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
    const [myDiceRows, setMyDiceRows] = useState([null]);
    const [rivalDiceRows, setRivalDiceRows] = useState([null]);
    const [myLocked, setMyLocked] = useState(false);
    const [rivalLocked, setRivalLocked] = useState(false);
    const [myDiceAnim, setMyDiceAnim] = useState(0);
    const [rivalDiceAnim, setRivalDiceAnim] = useState(0);

    // Detectar cuando el request pendiente fue resuelto (aprobado o denegado)
    useEffect(() => {
        if (!pendingRequest) return;
        const stillPending = (game.pendingPurchases || []).find(r => r.id === pendingRequest.id);
        if (!stillPending) setPendingRequest(null);
    }, [game.pendingPurchases, pendingRequest]);

    // Activar fase RollDice en el mirror y enviar totales iniciales cuando ambos ataques están seleccionados
    useEffect(() => {
        if (!isMyTurn) return;
        if (myAttackSelected === 'true' && rivalAttackSelected === 'true') {
            onChangeBattlePhase('RollDice');
            onHandleTotales('MyPlayer', myTotal);
            onHandleTotales('Rival', rivalTotal);
        }
    }, [myAttackSelected, rivalAttackSelected]);

    // Prompts al terminar batalla (dados bloqueados)
    useEffect(() => {
        if (!myLocked || !rivalLocked) return;
        if (!myPokemon || !rivalPokemon) return;

        // Batalla contra pokemon salvaje: levelup → captura (secuencial)
        if (rival?.name === 'Wild Pokemon') {
            if (myTotal > rivalTotal) {
                const canLevelUp = rivalPokemon.totalLevel >= myPokemon.totalLevel;
                if (canLevelUp) setShowLevelUpPrompt(true);
                else setShowCapturePrompt(true);
            }
            if (myTotal < rivalTotal && myPokemon.state === 'Alive') {
                new Audio(lifepointsSound).play().catch(() => {});
                onChangeState(player.id, myPokemon.id, { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' });
            }
            return;
        }

        // Batallas oficiales (líderes / jugadores)
        if (!isOfficialBattle) return;
        if (myTotal > rivalTotal) {
            const canLevelUp = rivalPokemon.totalLevel >= myPokemon.totalLevel;
            if (canLevelUp) setShowLevelUpPrompt(true);
            const isLastRivalPkm = rival?.pokemons?.[rival.pokemons.length - 1]?.id === rivalPokemon?.id;
            if (rival?.id?.startsWith('SimLeader-') && gymLeaderBadgeNum !== null && isLastRivalPkm) {
                if (canLevelUp) setPendingBadge(true);
                else setShowBadgePrompt(true);
            }
        }
        if (myTotal < rivalTotal && myPokemon.state === 'Alive') {
            new Audio(lifepointsSound).play().catch(() => {});
            onChangeState(player.id, myPokemon.id, { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' });
        }
    }, [myLocked, rivalLocked]);

    // Detectar pokemon escaneado por RFID → mostrar el mismo modal que búsqueda manual
    const prevSimRivalId  = useRef(null);
    const turnAlertTimer  = useRef(null);
    const turnAudio       = useRef(null);
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

    const handleConfirmWildPokemon = async () => {
        if (!wildPokemonId) return;
        prevSimRivalId.current = `SimRival-${playerId}`;
        await onSimWildBattle(playerId, wildPokemonId);
        if (isMyTurn) onStartSimMirror(playerId);
        setWildPokemonId('');
        setWildPreviewImg(null);
        setWildChain(null);
        setShowWildModal(false);
        setShowSetup(false);
    };

    const handleSimEvolve = async (pkm) => {
        if (pkm.nextLevel === -1) {
            onEvolvePokemon(player.id, pkm.id, pkm.evolution);
            return;
        }
        try {
            const res = await fetch(`${SERVER_IP}/get-possible-evolutions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pokedexId: pkm.pokedex }),
            });
            const options = await res.json();
            if (options.length === 1) {
                onEvolvePokemon(player.id, pkm.id, options[0].POKEDEX);
            } else if (options.length > 1) {
                setEvolveOptions(options);
                setEvolvingPkm(pkm);
                setShowEvolveModal(true);
            } else {
                onEvolvePokemon(player.id, pkm.id, pkm.evolution);
            }
        } catch {
            onEvolvePokemon(player.id, pkm.id, pkm.evolution);
        }
    };

    const handleEvolveSelect = (newPokedex) => {
        setShowEvolveModal(false);
        if (evolvingPkm) onEvolvePokemon(player.id, evolvingPkm.id, newPokedex);
    };

    const handleSimLeader = async (leaderID, pkm1, pkm2, badgeNum = null) => {
        if (badgeNum !== null) {
            setGymLeaderBadgeNum(badgeNum);
            setPendingBadge(false);
        }
        await onSimLeaderBattle(playerId, leaderID, pkm1, pkm2);
        if (isMyTurn) onStartSimMirror(playerId);
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
        const myB1 = aux + aux2;
        setMyBonusAttack1(myB1);

        aux = await checkBonusType(myPkm.attack2.type, rivalPkm.type1);
        aux2 = (rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE") ? await checkBonusType(myPkm.attack2.type, rivalPkm.type2) : 0;
        const myB2 = aux + aux2;
        setMyBonusAttack2(myB2);

        aux = await checkBonusType(myPkm.attack3.type, rivalPkm.type1);
        aux2 = (rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE") ? await checkBonusType(myPkm.attack3.type, rivalPkm.type2) : 0;
        const myB3 = aux + aux2;
        setMyBonusAttack3(myB3);

        aux = await checkBonusType(rivalPkm.attack1.type, myPkm.type1);
        aux2 = (myPkm.type2 !== null && myPkm.type2 !== "NONE") ? await checkBonusType(rivalPkm.attack1.type, myPkm.type2) : 0;
        const rivalB1 = aux + aux2;
        setRivalBonusAttack1(rivalB1);

        aux = await checkBonusType(rivalPkm.attack2.type, myPkm.type1);
        aux2 = (myPkm.type2 !== null && myPkm.type2 !== "NONE") ? await checkBonusType(rivalPkm.attack2.type, myPkm.type2) : 0;
        const rivalB2 = aux + aux2;
        setRivalBonusAttack2(rivalB2);

        aux = await checkBonusType(rivalPkm.attack3.type, myPkm.type1);
        aux2 = (myPkm.type2 !== null && myPkm.type2 !== "NONE") ? await checkBonusType(rivalPkm.attack3.type, myPkm.type2) : 0;
        const rivalB3 = aux + aux2;
        setRivalBonusAttack3(rivalB3);

        return { myB1, myB2, myB3, rivalB1, rivalB2, rivalB3 };
    }

    const handleSelectMyPokemon = async (pokemon) => {
        setMyPokemon(pokemon);
        setMyPokemonImg(getPkmImg(pokemon.pokedex, generation));
        setMyPokemonType1_class(`type_${pokemon.type1}`);
        setMyPokemonType2_class(`type_${pokemon.type2}`);
        setMyPkm_type_id1(`types_${pokemon.id}_1`);
        setMyPkm_type_id2(`types_${pokemon.id}_2`);
        setMyPokemonSelected('true');
        if (isMyTurn) onHandleBattlePokemon('MyPlayer', pokemon.id);
        if (rival?.name === 'Wild Pokemon') {
            const wildPkm = rival.pokemons?.[0];
            if (wildPkm) await handleSelectRivalPokemon(wildPkm, pokemon);
        }
    };

    const handleSelectRivalPokemon = async (pokemon, myPkm = myPokemon) => {
        setRivalPokemon(pokemon);
        setRivalPokemonImg(getPkmImg(pokemon.pokedex, generation));
        setRivalPokemonType1_class(`type_${pokemon.type1}`);
        setRivalPokemonType2_class(`type_${pokemon.type2}`);
        setRivalPkm_type_id1(`types_${pokemon.id}_1`);
        setRivalPkm_type_id2(`types_${pokemon.id}_2`);
        const bonuses = await calculateBonus(myPkm, pokemon);
        setRivalPokemonSelected('true');
        if (isMyTurn) {
            onHandleBattlePokemon('Rival', pokemon.id);
            onChangeBattlePhase('AttackSelection');
            onHandleBonuses('MyPlayer', bonuses.myB1, bonuses.myB2, bonuses.myB3);
            onHandleBonuses('Rival', bonuses.rivalB1, bonuses.rivalB2, bonuses.rivalB3);
        }
    };

    const handleSelectMyAttack = (attack, bonus) => {
        setMyAttack(attack);
        setMyAttackPower(attack.strength);
        setMyBonus(bonus);
        setMyBonusFinal(bonus);
        setMyTotal(attack.strength + bonus + myPokemon.totalLevel);
        setMyAttackSelected('true');
        if (isMyTurn) {
            onHandleBattleAttack('MyPlayer', attack.id);
            onHandleBonusFinal('MyPlayer', bonus);
        }
    };

    const handleSelectRivalAttack = (attack, bonus) => {
        setRivalAttack(attack);
        setRivalAttackPower(attack.strength);
        setRivalBonus(bonus);
        setRivalBonusFinal(bonus);
        setRivalTotal(attack.strength + bonus + rivalPokemon.totalLevel);
        setRivalAttackSelected('true');
        if (isMyTurn) {
            onHandleBattleAttack('Rival', attack.id);
            onHandleBonusFinal('Rival', bonus);
        }
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
        let newBonusFinal, newTotal;
        if (newStatus === "Asleep" || newStatus === "Paralized" || newStatus === "Frozen") {
            newBonusFinal = 0;
            newTotal = sumTotal(myPokemon.totalLevel, 0, 0, myDice);
            setMyStatus(newStatus);
            setMyAttackPower(0);
            setMyBonusFinal(0);
            setMyTotal(newTotal);
        } else if (newStatus === "Burned") {
            newBonusFinal = myBonus;
            newTotal = sumTotal(myPokemon.totalLevel, myAttack.strength - 1, myBonus, myDice);
            setMyStatus(newStatus);
            setMyAttackPower(myAttack.strength - 1);
            setMyBonusFinal(myBonus);
            setMyTotal(newTotal);
        } else {
            newBonusFinal = myBonus;
            newTotal = sumTotal(myPokemon.totalLevel, myAttack.strength, myBonus, myDice);
            setMyStatus(newStatus);
            setMyAttackPower(myAttack.strength);
            setMyBonusFinal(myBonus);
            setMyTotal(newTotal);
        }
        if (isMyTurn) {
            onHandleBonusFinal('MyPlayer', newBonusFinal);
            onHandleTotales('MyPlayer', newTotal);
        }
    };

    const handleRivalStatus = (newStatus) => {
        let newBonusFinal, newTotal;
        if (newStatus === "Asleep" || newStatus === "Paralized" || newStatus === "Frozen") {
            newBonusFinal = 0;
            newTotal = sumTotal(rivalPokemon.totalLevel, 0, 0, rivalDice);
            setRivalStatus(newStatus);
            setRivalAttackPower(0);
            setRivalBonusFinal(0);
            setRivalTotal(newTotal);
        } else if (newStatus === "Burned") {
            newBonusFinal = rivalBonus;
            newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttack.strength - 1, rivalBonus, rivalDice);
            setRivalStatus(newStatus);
            setRivalAttackPower(rivalAttack.strength - 1);
            setRivalBonusFinal(rivalBonus);
            setRivalTotal(newTotal);
        } else {
            newBonusFinal = rivalBonus;
            newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttack.strength, rivalBonus, rivalDice);
            setRivalStatus(newStatus);
            setRivalAttackPower(rivalAttack.strength);
            setRivalBonusFinal(rivalBonus);
            setRivalTotal(newTotal);
        }
        if (isMyTurn) {
            onHandleBonusFinal('Rival', newBonusFinal);
            onHandleTotales('Rival', newTotal);
        }
    };

    const calcDiceSum = (rows) => rows.reduce((acc, v) => acc + (v || 0), 0);

    const handleSelectMyDice = (rowIndex, dice) => {
        if (myLocked) return;
        setMyDiceAnim(dice);
        const newRows = [...myDiceRows];
        newRows[rowIndex] = dice;
        setMyDiceRows(newRows);
        const newDice = calcDiceSum(newRows);
        const newTotal = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, newDice);
        setMyDice(newDice);
        setMyTotal(newTotal);
        if (rowIndex === newRows.length - 1) setMyLocked(true);
        if (isMyTurn) {
            onHandleDice('MyPlayer', newDice, newRows.filter(v => v !== null));
            onHandleTotales('MyPlayer', newTotal);
        }
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
        const newDice = calcDiceSum(newRows);
        const newTotal = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, newDice);
        setMyDice(newDice);
        setMyTotal(newTotal);
        if (isMyTurn) {
            onHandleDice('MyPlayer', newDice, newRows.filter(v => v !== null));
            onHandleTotales('MyPlayer', newTotal);
        }
    };

    const handleSelectRivalDice = (rowIndex, dice) => {
        if (rivalLocked) return;
        setRivalDiceAnim(dice);
        const newRows = [...rivalDiceRows];
        newRows[rowIndex] = dice;
        setRivalDiceRows(newRows);
        const newDice = calcDiceSum(newRows);
        const newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, newDice);
        setRivalDice(newDice);
        setRivalTotal(newTotal);
        if (rowIndex === newRows.length - 1) setRivalLocked(true);
        if (isMyTurn) {
            onHandleDice('Rival', newDice, newRows.filter(v => v !== null));
            onHandleTotales('Rival', newTotal);
        }
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
        const newDice = calcDiceSum(newRows);
        const newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, newDice);
        setRivalDice(newDice);
        setRivalTotal(newTotal);
        if (isMyTurn) {
            onHandleDice('Rival', newDice, newRows.filter(v => v !== null));
            onHandleTotales('Rival', newTotal);
        }
    };

    const handleRematch = () => {
        resetBattleState();
        if (isMyTurn) onStartSimMirror(playerId);
    };

    const getAttachedClass = (attach) => {
        switch (attach) {
            case 'MT':      return 'attached-mt';
            case 'Protein': return 'attached-protein';
            case 'Potion':  return 'attached-potion';
            case 'Claw':    return 'attached-claw';
            case 'Mega':    return 'attached-mega';
            default:        return '';
        }
    };

    const resetBattleState = () => {
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
        setMyDiceRows([null]);
        setRivalDiceRows([null]);
        setMyLocked(false);
        setRivalLocked(false);
        setMyAttack(undefined);
        setRivalAttack(undefined);
        setMyStatus('Normal');
        setRivalStatus('Normal');
        setShowCapturePrompt(false);
    };

    const handleAddToTeam = async (pokedexId) => {
        if (!pokedexId) return;
        if (player.pokemons.length >= 6) {
            setPendingCapturePokedex(pokedexId);
            setShowCapturePrompt(false);
            setShowReplaceModal(true);
            return;
        }
        await onAddPokemon(playerId, pokedexId);
    };

    const handleReplaceConfirm = async (removePokemonId) => {
        setShowReplaceModal(false);
        await onRemovePokemon(playerId, removePokemonId);
        await onAddPokemon(playerId, pendingCapturePokedex);
        setPendingCapturePokedex(null);
    };

    const handleCaptureDirect = async () => {
        await handleAddToTeam(wildPokemonId);
        setShowWildModal(false);
        setWildPokemonId('');
        setWildPreviewImg(null);
        setWildChain(null);
    };

    // Botón home / modal de turno: vuelve al setup para elegir nuevo rival
    const handleNewSimulation = () => {
        resetBattleState();
        setShowSetup(true);
        setGymLeaderBadgeNum(null);
        setPendingBadge(false);
        setShowBadgePrompt(false);
        setShowPokedex(false);
        setShowLeaderViewer(false);
        setShowStore(false);
        setShowRulesGuide(false);
        setShowWildModal(false);
        setShowOtherRivals(false);
        setShowLevelUpPrompt(false);
        setShowEvolveModal(false);
        setShowAllPlayers(false);
        setShowFrontierModal(false);
        setShowCapturePrompt(false);
        setShowReplaceModal(false);
        setPendingCapturePokedex(null);
        if (isMyTurn && game.battlePublic) onToggleBattlePublic();
    };

    // Botón "Nueva Simulacion" durante la batalla: mantiene el rival, vuelve a selección de pokemon
    const handleResetBattle = () => {
        resetBattleState();
        if (isMyTurn) onStartSimMirror(playerId);
    };

    return (
        <div className={`sim-player${isMyTurn ? ' sim-player--my-turn' : ''}`}>
            {showTurnModal && (
                <div className="turn-modal-backdrop">
                    <div className="turn-modal">
                        <div className="turn-modal-icon">⚡</div>
                        <div className="turn-modal-text">¡Es tu turno,<br /><span>{player.name}</span>!</div>
                        <button className="turn-modal-btn" onClick={() => { stopTurnAlert(); setShowTurnModal(false); handleNewSimulation(); }}>OK</button>
                    </div>
                </div>
            )}
                {/* Home fijo siempre visible */}
            <div className="sim-home-button" onClick={handleNewSimulation}></div>

            {/* Botón siguiente turno — solo cuando es el turno del jugador */}
            {isMyTurn && (
                <div className="sim-next-turn-btn" onClick={onNextTurn}>
                    <div className="sim-next-turn-image"></div>
                    Next Turn
                </div>
            )}

            {/* Botón flotante de guía de efectos — visible durante la batalla */}
            {rival && !showSetup && (
                <div className="rules-guide-float-btn" onClick={() => setShowRulesGuide(true)}>?</div>
            )}

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
            <ModalRulesGuide show={showRulesGuide} onClose={() => setShowRulesGuide(false)} />

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
                                            <div className="pokedex-token" style={{ backgroundImage: `url(${nodeImg})` }} />
                                        </div>
                                        {/* GMax — inline */}
                                        {node.gmax && (() => {
                                            const img = getSafePkmImg(node.gmax, generation);
                                            return img ? (<><div className="pokedex-arrow pokedex-arrow--gmax"></div><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null;
                                        })()}
                                        {/* Megas — separadas de evoluciones */}
                                        {node.megas && node.megas.length > 0 && (
                                            <>
                                                <div className="pokedex-arrow pokedex-arrow--mega"></div>
                                                <div className="pokedex-branches">
                                                    {node.megas.map(megaPokedex => {
                                                        const img = getSafePkmImg(megaPokedex, generation);
                                                        return img ? (
                                                            <div key={megaPokedex} className="pokedex-branch-group">
                                                                <div className="pokedex-token-wrapper">
                                                                    <div className="pokedex-token pokedex-token--mega" style={{ backgroundImage: `url(${img})` }} />
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </>
                                        )}
                                        {/* Ramas de evolución */}
                                        {node.branches && node.branches.length > 0 && (
                                            <>
                                                <div className="pokedex-arrow">▶</div>
                                                <div className="pokedex-branches">
                                                    {node.branches.map(branch => {
                                                        const branchImg = getSafePkmImg(branch.pokedex, generation);
                                                        if (!branchImg) return null;
                                                        return (
                                                            <div key={branch.pokedex} className="pokedex-branch-group">
                                                                <div className="pokedex-token-wrapper">
                                                                    <div className="pokedex-token" style={{ backgroundImage: `url(${branchImg})` }} />
                                                                </div>
                                                                {branch.gmax && (() => {
                                                                    const img = getSafePkmImg(branch.gmax, generation);
                                                                    return img ? (<><div className="pokedex-arrow pokedex-arrow--gmax"></div><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null;
                                                                })()}
                                                                {branch.megas && branch.megas.length > 0 && (
                                                                    <>
                                                                        <div className="pokedex-arrow pokedex-arrow--mega"></div>
                                                                        <div className="pokedex-branches">
                                                                            {branch.megas.map(megaPokedex => {
                                                                                const img = getSafePkmImg(megaPokedex, generation);
                                                                                return img ? (
                                                                                    <div key={megaPokedex} className="pokedex-branch-group">
                                                                                        <div className="pokedex-token-wrapper">
                                                                                            <div className="pokedex-token pokedex-token--mega" style={{ backgroundImage: `url(${img})` }} />
                                                                                        </div>
                                                                                    </div>
                                                                                ) : null;
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {branch.nextEvolution && (() => {
                                                                    const img = getSafePkmImg(branch.nextEvolution, generation);
                                                                    return img ? (<><div className="pokedex-arrow">▶</div><div className="pokedex-token-wrapper"><div className="pokedex-token" style={{ backgroundImage: `url(${img})` }} /></div></>) : null;
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
                        <div className="sim-wild-modal-actions">
                            <button className="sim-wild-modal-fight" onClick={handleConfirmWildPokemon}>⚔</button>
                            <div className="sim-wild-modal-capture-wrapper">
                                <button className="sim-wild-modal-capture" onClick={handleCaptureDirect} />
                                <span className="sim-wild-modal-capture-label">Capturar</span>
                            </div>
                        </div>
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

                        {/* Jugadores */}
                        {game.players.filter(p => p.id !== playerId).length > 0 && (
                            <div className="sim-other-rivals-group">
                                <div className="sim-other-rivals-label">Jugadores</div>
                                <div className="sim-other-rivals-row">
                                    {game.players.filter(p => p.id !== playerId).map(p => (
                                        <div key={p.id} className="sim-player-rival-card"
                                            onClick={async () => { await onSimPlayerBattle(playerId, p.id); if (isMyTurn) onStartSimMirror(playerId); setShowSetup(false); setShowOtherRivals(false); }}>
                                            <div className={`sim-player-rival-img image-trainer ${TRAINER_CLASS[p.name] || 'trainer1'}`} />
                                            <div className="sim-player-rival-name">{p.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

                    {/* Fila central: equipo izquierda | líderes | equipo derecha */}
                    <div className="sim-setup-center-row">

                        {/* Pokemon 0-2 */}
                        <div className="sim-team-col">
                            {player.pokemons.slice(0, 3).map(pkm => {
                                const pkmImg = getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation);
                                return (
                                    <div key={pkm.id} className={`sim-mini-pkm ${pkm.state === 'Dead' ? 'sim-mini-pkm--dead' : ''}`}>
                                        <div className="sim-mini-pkm-img"
                                            style={pkmImg ? { backgroundImage: `url(${pkmImg})` } : {}}
                                            onClick={() => onChangeState(player.id, pkm.id, { source: 'manual-player', playerName: player.name })} />
                                        <div className="sim-mini-pkm-name">{pkm.name}</div>
                                        <div className="sim-mini-pkm-level">
                                            {pkm.level}{pkm.extra > 0 && <span className="sim-mini-pkm-extra"> +{pkm.extra}</span>}
                                        </div>
                                        <div className="sim-mini-pkm-icons">
                                            {pkm.attach !== 'None' && (
                                                <div className={`sim-mini-attach attached-item ${getAttachedClass(pkm.attach)}`} />
                                            )}
                                            {pkm.status !== 'Normal' && (
                                                <div className={`status_pokemon ${pkm.status} sim-mini-status`} />
                                            )}
                                            {((pkm.extra >= pkm.nextLevel && pkm.nextLevel > 0) || pkm.nextLevel === -1) && (
                                                <div className="button_evolve" onClick={() => handleSimEvolve(pkm)} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Centro: líderes + rivals btn */}
                        <div className="sim-setup-center">
                            <div className="sim-gym-leaders">
                                <div className="sim-gym-leaders-title">Líderes de Gimnasio</div>
                                <div className="sim-gym-leaders-grid">
                                    {leaders.filter(l => l.category === 'gym').map((l, idx) => {
                                        const img = l.img ? getPkmImg(l.img, generation) : null;
                                        const badgeNum = idx + 1;
                                        const badgeImg = getBadgeImg(generation, badgeNum);
                                        const hasBadge = player[`badge${badgeNum}`];
                                        return (
                                            <div key={l.leaderKey} className="sim-gym-leader-wrapper">
                                                <div className="sim-gym-leader-card"
                                                    style={img ? { backgroundImage: `url(${img})` } : {}}
                                                    onClick={() => handleSimLeader(l.leaderKey, l.uid1, l.uid2, badgeNum)} />
                                                <div
                                                    className={hasBadge ? 'Bagde_win sim-badge' : 'Badge sim-badge'}
                                                    style={badgeImg ? { backgroundImage: `url(${badgeImg})` } : {}}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="sim-other-rivals-btn" onClick={() => setShowOtherRivals(true)}>
                                <div className="sim-other-rivals-btn-icon"></div>
                                <span>Elite 4 / Campeón / Rival</span>
                            </div>
                        </div>

                        {/* Pokemon 3-5 */}
                        <div className="sim-team-col">
                            {player.pokemons.slice(3, 6).map(pkm => {
                                const pkmImg = getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation);
                                return (
                                    <div key={pkm.id} className={`sim-mini-pkm ${pkm.state === 'Dead' ? 'sim-mini-pkm--dead' : ''}`}>
                                        <div className="sim-mini-pkm-img"
                                            style={pkmImg ? { backgroundImage: `url(${pkmImg})` } : {}}
                                            onClick={() => onChangeState(player.id, pkm.id, { source: 'manual-player', playerName: player.name })} />
                                        <div className="sim-mini-pkm-name">{pkm.name}</div>
                                        <div className="sim-mini-pkm-level">
                                            {pkm.level}{pkm.extra > 0 && <span className="sim-mini-pkm-extra"> +{pkm.extra}</span>}
                                        </div>
                                        <div className="sim-mini-pkm-icons">
                                            {pkm.attach !== 'None' && (
                                                <div className={`sim-mini-attach attached-item ${getAttachedClass(pkm.attach)}`} />
                                            )}
                                            {pkm.status !== 'Normal' && (
                                                <div className={`status_pokemon ${pkm.status} sim-mini-status`} />
                                            )}
                                            {((pkm.extra >= pkm.nextLevel && pkm.nextLevel > 0) || pkm.nextLevel === -1) && (
                                                <div className="button_evolve" onClick={() => handleSimEvolve(pkm)} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

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
                        <div className="sim-setup-btn" onClick={() => setShowRulesGuide(true)}>
                            <div className="sim-setup-btn-icon sim-topbar-effects"></div>
                            <span>Efectos</span>
                        </div>
                        <div className={`sim-setup-btn ${pendingRequest ? 'sim-store-button--pending' : ''}`} onClick={() => setShowStore(true)}>
                            <div className="sim-setup-btn-icon sim-topbar-store"></div>
                            <span>Tienda</span>
                        </div>
                        <div className="sim-setup-btn" onClick={() => setShowAllPlayers(true)}>
                            <div className="sim-setup-btn-icon sim-topbar-players"></div>
                            <span>Jugadores</span>
                        </div>
                        {generation === 2 && (
                            <div className="sim-setup-btn" onClick={() => setShowFrontierModal(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-frontier"></div>
                                <span>Frontera</span>
                            </div>
                        )}
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
            {rival && !showSetup && myPokemonSelected === 'true' && rivalPokemonSelected === 'false' && rival.name !== 'Wild Pokemon' && (
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
                    {(rival.megas || []).length > 0 && (
                        <div className="rival_team">
                            {rival.megas.map((pokemon, index) => (
                                <PokemonBattleListed
                                    key={rival.name + 'mega' + index}
                                    pokemon={pokemon}
                                    SelectPokemon={handleSelectRivalPokemon}
                                    generation={generation}
                                />
                            ))}
                        </div>
                    )}
                    {rival.dynamax && (rival.gmaxes || []).length > 0 && (
                        <div className="rival_team">
                            {rival.gmaxes.map((pokemon, index) => (
                                <PokemonBattleListed
                                    key={rival.name + 'gmax' + index}
                                    pokemon={pokemon}
                                    SelectPokemon={handleSelectRivalPokemon}
                                    generation={generation}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Seleccion de ataques */}
            {!showSetup && rivalPokemonSelected === 'true' && myPokemonSelected === 'true' && (
                <div className="attack-select-sim">
                    <div className='MyPokemon-main'>
                        <div className={`MyPokemon_img ${myLocked && rivalLocked ? (myTotal >= rivalTotal ? 'winner-img' : 'loser-img') : ''}`} style={{ backgroundImage: `url(${myPokemonImg})` }}></div>
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
                        <div className={`RivalPokemon_img ${myLocked && rivalLocked ? (rivalTotal >= myTotal ? 'winner-img' : 'loser-img') : ''}`} style={{ backgroundImage: `url(${rivalPokemonImg})` }}></div>
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
                                    <div>{calcDiceSum(myDiceRows)}</div>=
                                    <div>{myTotal}</div>
                                </div>
                                <div className='MyDices'>
                                    {myLocked ? (
                                        <>
                                            <div className='dice-refresh' onClick={handleUnlockMyDice}>↺</div>
                                            {myDiceRows.length < 3 && <div className='mydicePlus' onClick={handleAddMyDiceRow} />}
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
                                <div className='Attack-selected-rival'><Attack attack={rivalAttack} bonus={rivalBonusFinal} /></div>
                                <div className='RivalTotal_label'>
                                    <div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Dice</div>=<div>Total</div>
                                </div>
                                <div className='RivalTotal'>
                                    <div>{rivalPokemon.totalLevel}</div>+
                                    <div>{rivalAttackPower}</div>+
                                    <div>{rivalBonusFinal}</div>+
                                    <div>{calcDiceSum(rivalDiceRows)}</div>=
                                    <div>{rivalTotal}</div>
                                </div>
                                <div className='RivalDices'>
                                    {rivalLocked ? (
                                        <>
                                            <div className='dice-refresh' onClick={handleUnlockRivalDice}>↺</div>
                                            {rivalDiceRows.length < 3 && <div className='rivalDicePlus' onClick={handleAddRivalDiceRow} />}
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
                                <div className={getStatusClass2('Paralized')} onClick={() => handleRivalStatus('Paralized')}></div>
                                <div className={getStatusClass2('Asleep')} onClick={() => handleRivalStatus('Asleep')}></div>
                                <div className={getStatusClass2('Frozen')} onClick={() => handleRivalStatus('Frozen')}></div>
                                <div className={getStatusClass2('Burned')} onClick={() => handleRivalStatus('Burned')}></div>
                                <div className={getStatusClass2('Confused')} onClick={() => handleRivalStatus('Confused')}></div>
                                <div className={getStatusClass2('Normal')} onClick={() => handleRivalStatus('Normal')}></div>
                            </div>

                            <div className="rematchButton" onClick={handleRematch}>Re-Match</div>
                            <div className="change-pokemon" onClick={handleResetBattle}>Change Pokemon</div>
                        </div>
                    )}
                </div>
            )}


            {showCapturePrompt && (
                <div className="modal-backdrop" onClick={() => setShowCapturePrompt(false)}>
                    <div className="levelup-prompt" onClick={e => e.stopPropagation()}>
                        <div className="levelup-prompt-title">¡Capturar!</div>
                        <div className="levelup-prompt-msg">
                            ¿Agregar <strong>{rivalPokemon?.name}</strong> al equipo?
                        </div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={() => { setShowCapturePrompt(false); handleAddToTeam(rivalPokemon?.pokedex); }}>Sí</button>
                            <button className="levelup-btn-no" onClick={() => setShowCapturePrompt(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
            {showReplaceModal && (
                <div className="modal-backdrop">
                    <div className="sim-replace-modal" onClick={e => e.stopPropagation()}>
                        <div className="sim-replace-modal-title">Equipo lleno</div>
                        <div className="sim-replace-modal-subtitle">
                            Selecciona el Pokémon que quieres liberar para agregar a <strong>{pendingCapturePokedex}</strong>
                        </div>
                        <div className="sim-replace-modal-grid">
                            {player.pokemons.map(pkm => {
                                const pkmImg = getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation);
                                return (
                                    <div key={pkm.id} className="sim-replace-pkm-card" onClick={() => handleReplaceConfirm(pkm.id)}>
                                        <div className="sim-replace-pkm-img" style={pkmImg ? { backgroundImage: `url(${pkmImg})` } : {}} />
                                        <div className="sim-replace-pkm-name">{pkm.name}</div>
                                        <div className="sim-replace-pkm-level">Lv {pkm.level}{pkm.extra > 0 && <span>+{pkm.extra}</span>}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="sim-replace-modal-cancel" onClick={() => { setShowReplaceModal(false); setPendingCapturePokedex(null); }}>Cancelar</button>
                    </div>
                </div>
            )}
            {showLevelUpPrompt && (
                <div className="modal-backdrop" onClick={() => setShowLevelUpPrompt(false)}>
                    <div className="levelup-prompt" onClick={e => e.stopPropagation()}>
                        <div className="levelup-prompt-title">¡Victoria!</div>
                        <div className="levelup-prompt-msg">
                            {myPokemon?.name} derrotó a {rivalPokemon?.name} (Lv. {rivalPokemon?.totalLevel}).
                            <br />¿Subir de nivel?
                        </div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={() => { setShowLevelUpPrompt(false); onIncreaseLevel(player.id, myPokemon.id, { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' }); if (pendingBadge) { setPendingBadge(false); setShowBadgePrompt(true); } }}>Sí</button>
                            <button className="levelup-btn-no" onClick={() => { setShowLevelUpPrompt(false); if (rival?.name === 'Wild Pokemon') setShowCapturePrompt(true); }}>No</button>
                        </div>
                    </div>
                </div>
            )}
            {showBadgePrompt && (
                <div className="modal-backdrop" onClick={() => setShowBadgePrompt(false)}>
                    <div className="levelup-prompt" onClick={e => e.stopPropagation()}>
                        <div className="levelup-prompt-title">¡Medalla!</div>
                        <div className="levelup-prompt-msg">
                            ¡Derrotaste a {rival?.name}!<br />¿Otorgar medalla {gymLeaderBadgeNum}?
                        </div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={async () => {
                                setShowBadgePrompt(false);
                                await fetch(`${SERVER_IP}/badge-won`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ playerId, numBadge: gymLeaderBadgeNum }),
                                });
                                setGymLeaderBadgeNum(null);
                            }}>Sí</button>
                            <button className="levelup-btn-no" onClick={() => setShowBadgePrompt(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}
            <ModalEvolveChoice show={showEvolveModal} options={evolveOptions} onSelect={handleEvolveSelect} onClose={() => setShowEvolveModal(false)} />

            {showAllPlayers && (
                <div className="modal-backdrop" onClick={() => setShowAllPlayers(false)}>
                    <div className="sim-allplayers-modal" onClick={e => e.stopPropagation()}>
                        <button className="trade-modal-close" onClick={() => setShowAllPlayers(false)}>✕</button>
                        <div className="trade-modal-title">Jugadores</div>
                        <div className="sim-allplayers-list">
                            {[...game.players].sort((a, b) => a.position - b.position).map(p => (
                                <PlayerListed key={p.id} player={p} totalPLayers={game.players.length} generation={generation} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <ModalFrontier
                show={showFrontierModal}
                onClose={() => setShowFrontierModal(false)}
                player={player}
                onToggle={handleToggleFrontier}
            />
            <MusicPlayer />
        </div>
    );
};

export default SimPlayer;
