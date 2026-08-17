import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import pokellamada from "../tones/pokellamada.mp3";
import lifepointsSound from "../tones/lifepoints.mp3";
import Types from "./Types";
import Attack from "./Attacks";
import PlayerListed from "./PlayerListed";
import SimBattleSelect from "./SimBattleSelect";
import ModalPokedex from "./modals/ModalPokedex";
import ModalLeaderViewer from "./modals/ModalLeaderViewer";
import ModalTiendaSim from "./modals/ModalTiendaSim";
import ModalRulesGuide from "./modals/ModalRulesGuide";
import ModalEvolveChoice from "./modals/ModalEvolveChoice";
import ModalFrontier from "./modals/ModalFrontier";
import ModalAttach from "./modals/ModalAttach";
import ModalSettings from "./modals/ModalSettings";
import { getTrainerImage } from "../data/trainers";
import SimThemeCurtain, { useSimCurtain } from "./SimThemeCurtain";
import { themeClass, readTheme, writeTheme, getThemeMascot } from "../data/simThemes";
import { getLeaderPortrait, RIVAL_COLORS, getRivalColor } from "../data/leaders";
import { typeColor, typeLabel } from "../pokemonTypes";
import ModalTypeChart from "./modals/ModalTypeChart";
import ModalTMCatalog from "./modals/ModalTMCatalog";
import ModalTMCard from "./modals/ModalTMCard";
import { findTMByAttack } from "../data/tms";
import { Z_CRYSTALS } from "../data/zmoves";
import imgTMIcon from "../images/tm.png";
import SERVER_IP from "../config.js";
import { getItemBonus, getFieldAttackBonus, getFieldFinalBonus, getFieldMove } from "../battleRules";
import { attachIconStyle, attachLabel } from "../attachItems";

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

const getFieldCardImg = (id) => {
    try { return require(`../images/Field Moves/${id}.png`); } catch { return null; }
};

const getTypeIcon = (type) => {
    try { return require(`../images/Types/${type}.png`); } catch { return null; }
};

// Insignia de la carta adjuntada (MT o cristal Z), junto al Pokémon en la
// pantalla de ataques.
//
// El backend marca el hueco con attach === 'MT' o 'Z' y guarda el ataque en
// attack3. Se pinta la miniatura de la carta cuando se puede identificar; si
// no, el icono genérico. En ambos casos al tocarla se abre la carta a tamaño
// grande para cotejarla con la física.
const TMBadge = ({ pokemon, onOpen }) => {
    if (!pokemon || (pokemon.attach !== 'MT' && pokemon.attach !== 'Z')) return null;

    const esZ = pokemon.attach === 'Z';
    // El cristal se identifica por el nombre que guardó el ataque; el genérico
    // "Z" de un adjuntado a mano no casa con ninguno y cae al icono.
    const carta = esZ
        ? Z_CRYSTALS.find(z => z.cristal === pokemon.attack3?.z?.cristal) || null
        : findTMByAttack(pokemon.attack3);

    const titulo = esZ
        ? (carta ? `${carta.cristal} — ${pokemon.attack3.name}` : 'Cristal Z adjuntado')
        : (carta ? `${carta.tm} — ${carta.nombre}` : 'MT adjuntada');

    return (
        <div
            className="sim-tm-badge"
            title={titulo}
            onClick={() => onOpen({ attack: pokemon.attack3, pokemonName: pokemon.name, esZ })}
        >
            <img src={carta?.thumb || imgTMIcon} alt={titulo} />
        </div>
    );
};

const SimPlayer = ({ game, onSimWildBattle, onSimLeaderBattle, onSimPlayerBattle, onChangeState, onIncreaseLevel, onStartSimMirror, onHandleBattlePokemon, onHandleBattleAttack, onHandleTotales, onChangeBattlePhase, onSetFormsView, onHandleDice, onHandleBonuses, onHandleBonusFinal, onToggleBattlePublic, onEvolvePokemon, onNextTurn, onAddPokemon, onRemovePokemon, onAttach, attachTM, attachMega }) => {
    const { playerId } = useParams();
    const player = game.players.find(p => p.id === playerId);
    const rival = player ? player.simRival : null;
    const generation = game?.generation || 1;
    const fieldMoves = (game?.fieldMoves || []).filter(Boolean);
    // Clave estable para detectar cuándo el master cambió las cartas de campo
    const fieldKey = JSON.stringify(game?.fieldMoves || []);

    // Item + cartas de campo. Con Dormido/Paralizado/Congelado el ataque queda
    // anulado, así que las cartas que dependen del ataque tampoco cuentan; el item
    // y las que pegan al valor final siguen aplicando.
    const computeExtra = (pkm, attack, status, side) => {
        const always = getItemBonus(pkm) + getFieldFinalBonus(pkm, fieldMoves, side);
        const nullified = status === 'Asleep' || status === 'Paralized' || status === 'Frozen';
        return always + (nullified ? 0 : getFieldAttackBonus(attack, fieldMoves, side));
    };

    const [leaders, setLeaders] = useState([]);

    useEffect(() => {
        fetch(`${SERVER_IP}/get-leaders?generation=${generation}`)
            .then(r => r.json())
            .then(data => setLeaders(data))
            .catch(console.error);
    }, [generation]);

    // Catalogo para el autocompletado del buscador de salvajes (se pide una sola vez)
    const [pokemonList, setPokemonList] = useState([]);

    useEffect(() => {
        fetch(`${SERVER_IP}/pokemon-list`)
            .then(r => r.json())
            .then(data => setPokemonList(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    // Inputs para configurar el rival de simulacion.
    // Arranca en `true` a propósito: el `simRival` viaja en la partida guardada,
    // así que al abrir /pokedex/<id> de cero el jugador seguía teniendo rival y la
    // pantalla entraba directa a la batalla. El home es el punto de partida; a la
    // batalla se llega eligiendo rival, no recargando.
    const [showSetup, setShowSetup] = useState(true);
    const [wildPokemonId, setWildPokemonId] = useState('');
    const [wildSuggestions, setWildSuggestions] = useState([]);
    const [wildHighlight, setWildHighlight] = useState(-1);
    const [wildPreviewImg, setWildPreviewImg] = useState(null);
    const [wildChain, setWildChain] = useState(null);
    const [showWildModal, setShowWildModal] = useState(false);
    const [showPokedex, setShowPokedex] = useState(false);
    const [showLeaderViewer, setShowLeaderViewer] = useState(false);
    const [showStore, setShowStore] = useState(false);
    const [showRulesGuide, setShowRulesGuide] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [showOtherRivals, setShowOtherRivals] = useState(false);
    const [attachPkmId, setAttachPkmId] = useState(null);
    // Carta de campo abierta a tamaño completo para leer su efecto
    const [expandedField, setExpandedField] = useState(null);
    const [showTypeChart, setShowTypeChart] = useState(false);
    const [showTMCatalog, setShowTMCatalog] = useState(false);
    // MT abierta a tamaño carta durante la batalla: {attack, pokemonName}
    const [tmCardOpen, setTmCardOpen] = useState(null);
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

    // Tema de color. Es preferencia de dispositivo, no estado de partida: vive
    // en localStorage y no viaja al backend, así cada jugador deja su tablet
    // como quiera sin tocar a los demás.
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState(() => readTheme(playerId));

    // La ruta lleva el playerId, así que al cambiar de jugador sin desmontar el
    // componente hay que releer su preferencia
    useEffect(() => { setTheme(readTheme(playerId)); }, [playerId]);

    const handleSelectTheme = (id) => {
        setTheme(id);
        writeTheme(playerId, id);
    };

    // Mascota del tema: null en los temas que no la tienen, y entonces la
    // cortina no se monta y `runCurtain` se limita a ejecutar la función
    const mascot = useMemo(() => getThemeMascot(theme), [theme]);
    const { phase: curtainPhase, run: runCurtain } = useSimCurtain(mascot);

    const handleToggleFrontier = (frontierKey) => {
        fetch(`${SERVER_IP}/toggle-frontier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, frontierKey }),
        });
    };
    const [showBadgePrompt, setShowBadgePrompt] = useState(false);
    const isMyTurn = game.players[game.currentTurn]?.id === playerId;

    // Una sola condición para las dos pantallas: la usan tanto el bloque del
    // setup como el botón flotante de la tabla de tipos, que solo sale cuando
    // el setup NO está. Si estuviera duplicada, un cambio en una se olvidaría
    // en la otra y saldrían los dos botones a la vez.
    const showingSetup = !rival || showSetup;

    // La misma rejilla 2x2 de tipos sirve al botón flotante de la batalla y al
    // de la barra del setup, así que se arma una vez
    const typeChartGrid = (
        <div className="type-chart-fab-grid">
            {['FIRE', 'WATER', 'GRASS', 'ELECTRIC'].map(t => {
                const img = getTypeIcon(t);
                return <div key={t} className="type-chart-fab-type"
                            style={img ? { backgroundImage: `url(${img})` } : {}} />;
            })}
        </div>
    );
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

    // Suma de bonos de item + clima. Se guarda en estado porque el handler del
    // dado no sabe en qué rama de estado quedó el Pokémon.
    const [myExtra, setMyExtra] = useState(0);
    const [rivalExtra, setRivalExtra] = useState(0);

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

    // Si el master pone o quita una carta de campo a media batalla, hay que rehacer
    // el total: el extra se guarda en estado al elegir el ataque y se quedaría viejo.
    useEffect(() => {
        if (myPokemon && myAttackSelected === 'true') {
            const newExtra = computeExtra(myPokemon, myAttack, myStatus, 'player');
            if (newExtra !== myExtra) {
                const newTotal = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, myDice, newExtra);
                setMyExtra(newExtra);
                setMyTotal(newTotal);
                if (isMyTurn) onHandleTotales('MyPlayer', newTotal);
            }
        }
        if (rivalPokemon && rivalAttackSelected === 'true') {
            const newExtra = computeExtra(rivalPokemon, rivalAttack, rivalStatus, 'rival');
            if (newExtra !== rivalExtra) {
                const newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, rivalDice, newExtra);
                setRivalExtra(newExtra);
                setRivalTotal(newTotal);
                if (isMyTurn) onHandleTotales('Rival', newTotal);
            }
        }
    }, [fieldKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setWildSuggestions([]);
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

    // Filtrado local del catalogo: por nombre o por POKEDEX.
    // Prioriza los que empiezan por lo escrito para que "Rai" saque Raichu antes que Darkrai.
    const buildWildSuggestions = (raw) => {
        const q = raw.trim().toLowerCase();
        if (!q) return [];
        const rank = (p) => {
            const n = p.name.toLowerCase();
            const d = p.pokedex.toLowerCase();
            if (n === q || d === q) return 0;
            if (n.startsWith(q)) return 1;
            if (d.startsWith(q)) return 2;
            return 3;
        };
        return pokemonList
            .filter(p => p.name.toLowerCase().includes(q) || p.pokedex.toLowerCase().includes(q))
            .sort((a, b) => rank(a) - rank(b) || a.pokedex.localeCompare(b.pokedex))
            .slice(0, 12);
    };

    const handleWildInputChange = (value) => {
        setWildPokemonId(value);
        setWildPreviewImg(null);
        setWildSuggestions(buildWildSuggestions(value));
        setWildHighlight(-1);
    };

    const handleSelectWildSuggestion = (pkm) => {
        setWildSuggestions([]);
        setWildHighlight(-1);
        setWildPokemonId(pkm.pokedex);
        searchWildPokemon(pkm.pokedex);
    };

    const handleWildInputKeyDown = (e) => {
        if (wildSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setWildHighlight(i => (i + 1) % wildSuggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setWildHighlight(i => (i <= 0 ? wildSuggestions.length - 1 : i - 1));
                return;
            }
            if (e.key === 'Escape') {
                setWildSuggestions([]);
                setWildHighlight(-1);
                return;
            }
            if (e.key === 'Enter' && wildHighlight >= 0) {
                e.preventDefault();
                handleSelectWildSuggestion(wildSuggestions[wildHighlight]);
                return;
            }
        }
        if (e.key === 'Enter') handleSearchWildPokemon();
    };

    // Normaliza lo escrito a un POKEDEX valido: "26" -> "0026", "mx26" -> "MX0026".
    // Ojo: hay POKEDEX con sufijo en minuscula (0718i, 0492e, P0128ii...), por eso
    // primero se busca una coincidencia exacta en el catalogo antes de tocar el texto.
    const normalizeWildId = (raw) => {
        const clean = raw.toString().trim();
        if (!clean) return '';
        const exact = pokemonList.find(p => p.pokedex.toLowerCase() === clean.toLowerCase());
        if (exact) return exact.pokedex;
        // Solo se normaliza el formato "letras + numero"; cualquier otra cosa
        // (p.ej. sufijos como 0718i) se respeta tal cual se escribio.
        const m = clean.toUpperCase().match(/^([A-Z]*)(\d+)$/);
        return m ? m[1] + m[2].padStart(4, '0') : clean;
    };

    const searchWildPokemon = async (rawId) => {
        const id = normalizeWildId(rawId);
        if (!id) return;
        try {
            const img = getPkmImg(id, generation);
            setWildPreviewImg(img);
            setWildPokemonId(id);
            const res = await fetch(`${SERVER_IP}/get-evolution-chain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pokedexId: id })
            });
            const data = await res.json();
            setWildChain(data);
        } catch (e) {
            setWildPreviewImg(null);
            setWildChain(null);
        }
    };

    const handleSearchWildPokemon = async () => {
        if (!wildPokemonId) return;
        // Si lo escrito coincide con un solo pokemon del catalogo, se usa ese
        const matches = buildWildSuggestions(wildPokemonId);
        const target = matches.length === 1 ? matches[0].pokedex : wildPokemonId;
        setWildSuggestions([]);
        setWildHighlight(-1);
        await searchWildPokemon(target);
    };

    const handleConfirmWildPokemon = async () => {
        if (!wildPokemonId) return;
        prevSimRivalId.current = `SimRival-${playerId}`;
        // Todo el cuerpo va dentro de la cortina: el cambio de pantalla tiene
        // que ocurrir con las hojas cerradas, no antes ni después
        await runCurtain(async () => {
            await onSimWildBattle(playerId, wildPokemonId);
            if (isMyTurn) onStartSimMirror(playerId);
            setWildPokemonId('');
            setWildSuggestions([]);
            setWildPreviewImg(null);
            setWildChain(null);
            setShowWildModal(false);
            setShowSetup(false);
        });
    };

    // Fases 'evo' (Zygarde 10%/50%): solo evolucionan si tienen la mega piedra puesta
    const canEvolveWithStone = (pkm) => pkm.mega === 'evo' && pkm.attach === 'Mega';

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
        await runCurtain(async () => {
            await onSimLeaderBattle(playerId, leaderID, pkm1, pkm2);
            if (isMyTurn) onStartSimMirror(playerId);
            setShowSetup(false);
        });
    };

    // Tarjeta del equipo. Las seis van en una sola fila central.
    const renderMiniPkm = (pkm) => {
        const pkmImg = getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation);
        const canEvolve = (pkm.extra >= pkm.nextLevel && pkm.nextLevel > 0) || pkm.nextLevel === -1 || canEvolveWithStone(pkm);
        const isDead = pkm.state === 'Dead';
        // El boceto trae una barra de HP, pero aquí no hay puntos de vida: lo que sí
        // avanza es el progreso hacia la evolución, así que la barra muestra eso.
        const goal = pkm.nextLevel > 0 ? pkm.nextLevel : 0;
        const pct  = goal ? Math.min(100, Math.round((pkm.extra / goal) * 100)) : 0;
        const toggleState = () => onChangeState(player.id, pkm.id, { source: 'manual-player', playerName: player.name });

        return (
            <div key={pkm.id}
                 className={`sim-pkm-card ${isDead ? 'sim-pkm-card--dead' : ''}`}
                 style={{ '--pkm-type': typeColor(pkm.type1) }}>

                <div className="sim-pkm-card-head">
                    <span className="sim-pkm-card-name">{pkm.name}</span>
                    <span className="sim-pkm-card-lvl">
                        Nv {pkm.level}{pkm.extra > 0 && <em>+{pkm.extra}</em>}
                    </span>
                </div>

                {/* La ilustración sigue siendo el toggle de estado, como hasta ahora */}
                <div className="sim-pkm-card-art"
                     title={isDead ? 'Marcar como disponible' : 'Marcar como debilitado'}
                     style={pkmImg ? { backgroundImage: `url(${pkmImg})` } : {}}
                     onClick={toggleState}>
                    <div className="sim-pkm-card-icons">
                        {pkm.status !== 'Normal' && (
                            <div className={`status_pokemon ${pkm.status} sim-pkm-card-status`} />
                        )}
                        {canEvolve && (
                            <div className="button_evolve sim-pkm-card-evolve"
                                 title="Evolucionar"
                                 onClick={(e) => { e.stopPropagation(); handleSimEvolve(pkm); }} />
                        )}
                    </div>
                </div>

                <div className="sim-pkm-card-bar"
                     title={goal ? `${pkm.extra} / ${goal} para evolucionar` : 'Sin evolución pendiente'}>
                    <span style={{ width: `${pct}%` }} />
                </div>

                {/* Attach ancho a propósito: la ilustración de arriba ya es un target
                    grande y los botones chicos se confundían con ella */}
                <div className="sim-pkm-card-foot">
                    <div className={`sim-mini-attach-bar ${pkm.attach !== 'None' ? 'sim-mini-attach-bar--filled' : ''}`}
                         title={pkm.attach !== 'None' ? `${attachLabel(pkm.attach)} — cambiar item` : 'Adjuntar item'}
                         onClick={() => setAttachPkmId(pkm.id)}>
                        {pkm.attach !== 'None'
                            ? <div className="sim-mini-attach attached-item" style={attachIconStyle(pkm.attach)} />
                            : '+ Attach'}
                    </div>
                    <div className={`sim-pkm-card-ko ${isDead ? 'sim-pkm-card-ko--on' : ''}`}
                         title={isDead ? 'Marcar como disponible' : 'Marcar como debilitado'}
                         onClick={toggleState} />
                </div>
            </div>
        );
    };

    // Hueco vacío del equipo, para que la fila de seis no se descuadre
    const renderEmptySlot = (i) => (
        <div key={`empty-${i}`} className="sim-pkm-card sim-pkm-card--empty">
            <div className="sim-pkm-card-empty-mark" />
        </div>
    );

    // Elite 4, Campeón y Rival. Un toque reta directo: la vista previa del equipo
    // sobraba desde que la pantalla de selección enseña los Pokémon del rival.
    //
    // `portraits` decide el arte. Con los entrenadores se lee mejor su retrato,
    // pero los rivales por color van con la carta a propósito: ahí lo que hay
    // que distinguir es justo el color de la casilla, no quién es.
    const renderLeaderGroup = (label, list, portraits = false) => {
        if (list.length === 0) return null;

        // Dos entradas del mismo entrenador (los dos Lance del campeón) saldrían
        // idénticas con solo el retrato; ahí se añade su Pokémon de cabecera.
        const repeated = list.reduce((acc, l) => {
            acc[l.name] = (acc[l.name] || 0) + 1;
            return acc;
        }, {});

        return (
            <div className="sim-other-rivals-group">
                <div className="sim-other-rivals-label">{label}</div>
                <div className="sim-other-rivals-row">
                    {list.map(l => {
                        const color = RIVAL_COLORS[getRivalColor(l.img)];
                        const art = (portraits ? getLeaderPortrait(l.img, l.name, generation) : null)
                            || (l.img ? getSafePkmImg(l.img, generation) : null);
                        const sub = repeated[l.name] > 1 ? l.team?.[0]?.name : null;
                        return (
                            <div key={l.leaderKey}
                                 className="sim-rival-choice"
                                 title={color ? `Retar — ${color.label}` : `Retar a ${l.name}`}
                                 onClick={() => {
                                     setShowOtherRivals(false);
                                     handleSimLeader(l.leaderKey, l.uid1, l.uid2);
                                 }}>
                                <div className={`Elite sim-rival-card ${portraits ? 'sim-rival-card--tall' : ''}`}
                                     style={{
                                         ...(art ? { backgroundImage: `url(${art})` } : {}),
                                         ...(color ? { borderColor: color.hex } : {}),
                                     }} />
                                <div className="sim-rival-choice-name"
                                     style={color ? { color: color.hex } : {}}>
                                    {color ? color.label : l.name}
                                </div>
                                {sub && <div className="sim-rival-choice-sub">{sub}</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
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

    const resolveBasePokemonId = (pkm) => {
        if (!pkm) return null;
        if (pkm.pokedex.startsWith('GM')) {
            const base = (player.pokemons || []).find(p => p.gmaxPokedex === pkm.pokedex);
            return base?.id ?? pkm.id;
        }
        if (pkm.pokedex.startsWith('M')) {
            // Dos bases pueden compartir mega (las Meowstic): basePokemonId manda
            // sobre la búsqueda por pokedex, que devolvería siempre la primera.
            if (pkm.basePokemonId && (player.pokemons || []).some(p => p.id === pkm.basePokemonId))
                return pkm.basePokemonId;
            const base = (player.pokemons || []).find(p => p.evolution === pkm.pokedex);
            return base?.id ?? pkm.id;
        }
        return pkm.id;
    };

    const knockOutIfAbandoned = () => {
        if (!isMyTurn || !game.battlePublic) return;
        if (myPokemonSelected !== 'true') return;
        if (!myPokemon || myPokemon.state !== 'Alive') return;
        if (myLocked && rivalLocked) return;
        onChangeState(player.id, resolveBasePokemonId(myPokemon), { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' });
    };

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
        const extra = computeExtra(myPokemon, attack, myStatus, 'player');
        setMyAttack(attack);
        setMyAttackPower(attack.strength);
        setMyBonus(bonus);
        setMyBonusFinal(bonus);
        setMyExtra(extra);
        setMyTotal(attack.strength + bonus + myPokemon.totalLevel + extra);
        setMyAttackSelected('true');
        if (isMyTurn) {
            onHandleBattleAttack('MyPlayer', attack.id);
            onHandleBonusFinal('MyPlayer', bonus);
        }
    };

    const handleSelectRivalAttack = (attack, bonus) => {
        const extra = computeExtra(rivalPokemon, attack, rivalStatus, 'rival');
        setRivalAttack(attack);
        setRivalAttackPower(attack.strength);
        setRivalBonus(bonus);
        setRivalBonusFinal(bonus);
        setRivalExtra(extra);
        setRivalTotal(attack.strength + bonus + rivalPokemon.totalLevel + extra);
        setRivalAttackSelected('true');
        if (isMyTurn) {
            onHandleBattleAttack('Rival', attack.id);
            onHandleBonusFinal('Rival', bonus);
        }
    };

    function sumTotal(level, attackStrength, bonus, dice, extra = 0) {
        return level + attackStrength + bonus + dice + extra;
    }

    const getStatusClass = (status) => {
        return `status_battle ${status} ${myStatus === status ? 'statusActive' : ''}`;
    };

    const getStatusClass2 = (status) => {
        return `status_battle rotate-x ${status} ${rivalStatus === status ? 'statusActive' : ''}`;
    };

    const handleMyStatus = (newStatus) => {
        let newBonusFinal, newTotal;
        // computeExtra ya descuenta las cartas de ataque si el estado lo anula
        const newExtra = computeExtra(myPokemon, myAttack, newStatus, 'player');
        setMyStatus(newStatus);
        setMyExtra(newExtra);
        if (newStatus === "Asleep" || newStatus === "Paralized" || newStatus === "Frozen") {
            newBonusFinal = 0;
            newTotal = sumTotal(myPokemon.totalLevel, 0, 0, myDice, newExtra);
            setMyAttackPower(0);
            setMyBonusFinal(0);
            setMyTotal(newTotal);
        } else if (newStatus === "Burned") {
            newBonusFinal = myBonus;
            newTotal = sumTotal(myPokemon.totalLevel, myAttack.strength - 1, myBonus, myDice, newExtra);
            setMyAttackPower(myAttack.strength - 1);
            setMyBonusFinal(myBonus);
            setMyTotal(newTotal);
        } else {
            newBonusFinal = myBonus;
            newTotal = sumTotal(myPokemon.totalLevel, myAttack.strength, myBonus, myDice, newExtra);
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
        const newExtra = computeExtra(rivalPokemon, rivalAttack, newStatus, 'rival');
        setRivalStatus(newStatus);
        setRivalExtra(newExtra);
        if (newStatus === "Asleep" || newStatus === "Paralized" || newStatus === "Frozen") {
            newBonusFinal = 0;
            newTotal = sumTotal(rivalPokemon.totalLevel, 0, 0, rivalDice, newExtra);
            setRivalAttackPower(0);
            setRivalBonusFinal(0);
            setRivalTotal(newTotal);
        } else if (newStatus === "Burned") {
            newBonusFinal = rivalBonus;
            newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttack.strength - 1, rivalBonus, rivalDice, newExtra);
            setRivalAttackPower(rivalAttack.strength - 1);
            setRivalBonusFinal(rivalBonus);
            setRivalTotal(newTotal);
        } else {
            newBonusFinal = rivalBonus;
            newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttack.strength, rivalBonus, rivalDice, newExtra);
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
        const newTotal = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, newDice, myExtra);
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
        const newTotal = sumTotal(myPokemon.totalLevel, myAttackPower, myBonusFinal, newDice, myExtra);
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
        const newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, newDice, rivalExtra);
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
        const newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, newDice, rivalExtra);
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

    const resetBattleState = () => {
        setMyPokemon(undefined);
        setRivalPokemon(undefined);
        setMyPokemonSelected('false');
        setRivalPokemonSelected('false');
        setMyAttackSelected('false');
        setRivalAttackSelected('false');
        setMyTotal(0);
        setRivalTotal(0);
        setMyExtra(0);
        setRivalExtra(0);
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
        setExpandedField(null);
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
        setWildSuggestions([]);
        setWildPreviewImg(null);
        setWildChain(null);
    };

    const handleNextTurn = () => {
        onNextTurn();
    };

    // ── Progreso de gimnasios ────────────────────────────────────────────────
    // El número de medalla sigue siendo la posición del líder en la lista, igual
    // que antes; de ahí salen tanto la barra de medallas como el estado de cada
    // tarjeta (ganada / siguiente / pendiente).
    const gymLeaders = leaders.filter(l => l.category === 'gym');
    const badgeWonAt = (idx) => Boolean(player[`badge${idx + 1}`]);
    const badgesWon  = gymLeaders.reduce((n, _, idx) => n + (badgeWonAt(idx) ? 1 : 0), 0);
    const nextGymIdx = gymLeaders.findIndex((_, idx) => !badgeWonAt(idx));
    const teamSlots  = Array.from({ length: 6 }, (_, i) => (player.pokemons || [])[i] || null);

    // Botón home / modal de turno: vuelve al setup para elegir nuevo rival
    const handleNewSimulation = () => {
        knockOutIfAbandoned();
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

    // Pantalla de selección de combatientes. Trae su propia barra superior, así
    // que mientras está en pantalla los botones flotantes (home, turno, guía,
    // tabla de tipos) se retiran para no montarse encima.
    const inSelection = Boolean(rival) && !showSetup
        && (myPokemonSelected === 'false' || rivalPokemonSelected === 'false');

    // Avance de lo que se va tocando, solo para el espejo del marcador: quien
    // mira la tabla ve la elección en cuanto se hace, sin esperar a «¡Combatir!».
    // No toca nada del estado local; la batalla sigue arrancando en la confirmación.
    const handlePreviewSelection = (side, pkm) => {
        if (!isMyTurn || !pkm) return;
        onHandleBattlePokemon(side, pkm.id);
    };

    // Las dos elecciones se confirman juntas. Contra un salvaje el propio
    // handleSelectMyPokemon ya engancha al único rival posible, así que aquí no
    // se vuelve a llamar para no seleccionarlo dos veces.
    const handleConfirmSelection = async (myPkm, rivalPkm) => {
        await handleSelectMyPokemon(myPkm);
        if (rival?.name !== 'Wild Pokemon' && rivalPkm) {
            await handleSelectRivalPokemon(rivalPkm, myPkm);
        }
    };

    return (
        <div className={`sim-player${themeClass(theme) ? ` ${themeClass(theme)}` : ''}`}>
            {showTurnModal && (
                <div className="turn-modal-backdrop">
                    <div className="turn-modal">
                        {/* La mascota del tema toma el sitio del rayo; los temas
                            que no la tienen siguen con el icono de siempre */}
                        {mascot
                            ? <img className={`turn-modal-mascot ${mascot.anim ? 'turn-modal-mascot--pixel' : ''}`}
                                   src={mascot.anim || mascot.still}
                                   alt="" />
                            : <div className="turn-modal-icon">⚡</div>}
                        <div className="turn-modal-text">¡Es tu turno,<br /><span>{player.name}</span>!</div>
                        <button className="turn-modal-btn" onClick={() => { stopTurnAlert(); setShowTurnModal(false); handleNewSimulation(); }}>OK</button>
                    </div>
                </div>
            )}
            {/* Home solo fuera del setup: estando ya en casa no lleva a ningún lado.
                En la selección de combatientes lo hace la flecha de su barra. */}
            {rival && !showSetup && !inSelection && (
                <div className="sim-home-button" onClick={handleNewSimulation}></div>
            )}

            {/* Botón siguiente turno — solo cuando es el turno del jugador.
                En el setup y en la selección no se usa este: esas pantallas ya
                lo traen inline en su propia barra. */}
            {isMyTurn && rival && !showSetup && !inSelection && (
                <div className="sim-next-turn-btn" onClick={handleNextTurn}>
                    <div className="sim-next-turn-image"></div>
                    Next Turn
                </div>
            )}

            {/* Botón flotante de guía de efectos — visible durante la batalla */}
            {rival && !showSetup && !inSelection && (
                <div className="rules-guide-float-btn" onClick={() => setShowRulesGuide(true)}>?</div>
            )}

            {/* Cartas de campo activas. Solo durante la selección de ataque y los
                dados — misma condición que la pantalla de batalla — para no
                estorbar en el home ni al elegir Pokémon. */}
            {fieldMoves.length > 0 && !showSetup
                && myPokemonSelected === 'true' && rivalPokemonSelected === 'true' && (
                <div className="sim-field-hud">
                    {fieldMoves.map((slot, i) => {
                        const card = getFieldMove(slot.id);
                        if (!card) return null;
                        // Tres estados distintos: global, tu lado, el lado del rival
                        const tone = card.scope === 'global'
                            ? 'global'
                            : (slot.owner === 'player' ? 'mine' : 'rival');
                        return (
                            <div key={i}
                                 className={`sim-field-card sim-field-card--${tone}`}
                                 title="Toca para ver el efecto"
                                 onClick={() => setExpandedField(card.id)}>
                                <div className="sim-field-card-emoji">{card.emoji}</div>
                                <div className="sim-field-card-name">{card.es}</div>
                                <div className="sim-field-card-side">
                                    {tone === 'global' ? 'los dos lados'
                                        : tone === 'mine' ? 'tu lado' : 'lado del rival'}
                                </div>
                                {card.kind === 'reminder' && (
                                    <div className="sim-field-card-manual">manual</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* La carta a tamaño completo, para leer su efecto */}
            {expandedField && (
                <div className="sim-field-zoom" onClick={() => setExpandedField(null)}>
                    {getFieldCardImg(expandedField)
                        ? <img className="sim-field-zoom-img"
                               src={getFieldCardImg(expandedField)}
                               alt={expandedField} />
                        : <div className="sim-field-zoom-fallback">{expandedField}</div>}
                    <div className="sim-field-zoom-hint">Toca para cerrar</div>
                </div>
            )}

            {/* El nombre y las monedas viven ahora en la cabecera del setup */}

            <ModalPokedex show={showPokedex} onClose={() => setShowPokedex(false)} player={player} />
            <ModalLeaderViewer show={showLeaderViewer} onClose={() => setShowLeaderViewer(false)} generation={generation} />
            <ModalTiendaSim show={showStore} onClose={() => setShowStore(false)} player={player} pendingRequest={pendingRequest} onRequestPurchase={handleRequestPurchase} />
            <ModalRulesGuide show={showRulesGuide} onClose={() => setShowRulesGuide(false)} />
            <ModalTMCatalog show={showTMCatalog} onClose={() => setShowTMCatalog(false)} />
            <ModalTMCard
                show={tmCardOpen !== null}
                onClose={() => setTmCardOpen(null)}
                attack={tmCardOpen?.attack}
                pokemonName={tmCardOpen?.pokemonName}
                esZ={tmCardOpen?.esZ}
            />
            <ModalAttach
                show={attachPkmId !== null}
                onClose={() => setAttachPkmId(null)}
                currentPlayer={player}
                pokemonId={attachPkmId}
                onAttach={onAttach}
                attachTM={attachTM}
                attachMega={attachMega}
            />

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
                                            onClick={() => runCurtain(async () => {
                                                await onSimPlayerBattle(playerId, p.id);
                                                if (isMyTurn) onStartSimMirror(playerId);
                                                setShowSetup(false);
                                                setShowOtherRivals(false);
                                            })}>
                                            <div className="sim-player-rival-img" style={{ backgroundImage: `url(${getTrainerImage(p.name)})` }} />
                                            <div className="sim-player-rival-name">{p.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {renderLeaderGroup('Elite 4', leaders.filter(l => l.category === 'elite'), true)}
                        {renderLeaderGroup('Campeón / Especial', leaders.filter(l => l.category === 'champion' || l.category === 'rocket'), true)}
                        {renderLeaderGroup('Rival — elige el color de tu casilla', leaders.filter(l => l.category === 'rival'))}
                    </div>
                </div>
            )}

            {/* Setup principal */}
            {showingSetup && (
                <div className="sim-player__setup">

                    {/* ── Cabecera: entrenador + medallas ───────────────────── */}
                    <header className="sim-hud-header">
                        {/* La ficha del entrenador abre los ajustes (tema de color) */}
                        <div className="sim-hud-trainer"
                             role="button"
                             tabIndex={0}
                             title="Ajustes"
                             onClick={() => setShowSettings(true)}
                             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowSettings(true); } }}>
                            <div className="sim-hud-trainer-portrait">
                                <div className="sim-hud-trainer-img" style={{ backgroundImage: `url(${getTrainerImage(player.name)})` }} />
                                <span className="sim-hud-trainer-gear">⚙</span>
                            </div>
                            <div className="sim-hud-trainer-meta">
                                <div className="sim-hud-trainer-name">{player.name}</div>
                                <div className="sim-hud-trainer-coins">${player.coins}</div>
                            </div>
                        </div>

                        <div className="sim-hud-badges">
                            <div className="sim-hud-badges-title">
                                Medallas · {badgesWon} de {gymLeaders.length || 8}
                            </div>
                            <div className="sim-hud-badges-row">
                                {gymLeaders.map((l, idx) => {
                                    const badgeImg = getBadgeImg(generation, idx + 1);
                                    const hasBadge = badgeWonAt(idx);
                                    return (
                                        <div key={l.leaderKey} className="sim-hud-badge-slot">
                                            <div className={`sim-hud-badge ${hasBadge ? 'Bagde_win' : 'Badge'}`}
                                                 style={badgeImg ? { backgroundImage: `url(${badgeImg})` } : {}} />
                                            <span className={`sim-hud-badge-name ${hasBadge ? 'is-won' : ''}`}>{l.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </header>

                    {/* ── Equipo: las seis en una fila ──────────────────────── */}
                    <section className="sim-hud-team">
                        <div className="sim-hud-section-title">
                            <span>Mi equipo</span>
                            <i />
                            <span className="sim-hud-section-count">
                                {(player.pokemons || []).length}/6
                            </span>
                        </div>
                        <div className="sim-hud-team-row">
                            {teamSlots.map((pkm, i) => (pkm ? renderMiniPkm(pkm) : renderEmptySlot(i)))}
                        </div>
                    </section>

                    {/* ── Líderes de gimnasio + desafío final ───────────────── */}
                    <section className="sim-hud-arena">
                        <div className="sim-hud-leaders">
                            <div className="sim-hud-section-title">
                                <span>Líderes de gimnasio</span>
                                <i />
                            </div>
                            <div className="sim-hud-leaders-grid">
                                {gymLeaders.map((l, idx) => {
                                    const badgeNum = idx + 1;
                                    // Retrato si ya lo tenemos; si no, el token de carta de siempre
                                    const portrait = getLeaderPortrait(l.img, l.name, generation);
                                    const art = portrait || (l.img ? getSafePkmImg(l.img, generation) : null);
                                    const type = l.team?.[0]?.type1;
                                    const level = Math.max(...(l.team || []).map(p => Number(p.level) || 0), 0);
                                    const won = badgeWonAt(idx);
                                    const isNext = idx === nextGymIdx;
                                    const status = won ? 'won' : isNext ? 'next' : 'pending';
                                    return (
                                        <div key={l.leaderKey}
                                             className={`sim-leader-card sim-leader-card--${status}`}
                                             title={`Retar a ${l.name}`}
                                             onClick={() => handleSimLeader(l.leaderKey, l.uid1, l.uid2, badgeNum)}>
                                            <div className={`sim-leader-card-art ${portrait ? '' : 'sim-leader-card-art--token'}`}
                                                 style={art ? { backgroundImage: `url(${art})` } : {}} />
                                            <div className="sim-leader-card-body">
                                                <div className="sim-leader-card-name">{l.name}</div>
                                                <div className="sim-leader-card-meta">
                                                    {type && (
                                                        <span className="sim-leader-card-type"
                                                              style={{ backgroundColor: typeColor(type) }}>
                                                            {typeLabel(type)}
                                                        </span>
                                                    )}
                                                    {level > 0 && <span className="sim-leader-card-lvl">Nv {level}</span>}
                                                </div>
                                                <div className="sim-leader-card-status">
                                                    {won ? 'Ganada' : isNext ? 'Siguiente' : 'Pendiente'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Buscador de salvajes. Aquí tiene sitio de sobra, y sobre todo
                            el desplegable cae dentro de su propia columna en vez de
                            abrirse encima de las tarjetas de los líderes. */}
                        <div className="sim-hud-wild">
                            <div className="sim-hud-wild-title">Pokémon salvaje</div>
                            <div className="sim-wild-search">
                                <input
                                    type="text"
                                    placeholder="Nombre o # Pokedex"
                                    value={wildPokemonId}
                                    autoComplete="off"
                                    onChange={(e) => handleWildInputChange(e.target.value)}
                                    onKeyDown={handleWildInputKeyDown}
                                    onBlur={() => setTimeout(() => setWildSuggestions([]), 150)}
                                />
                                {wildSuggestions.length > 0 && (
                                    <ul className="sim-wild-suggestions">
                                        {wildSuggestions.map((pkm, i) => {
                                            const img = getSafePkmImg(pkm.pokedex, generation);
                                            return (
                                                <li
                                                    key={pkm.pokedex}
                                                    className={`sim-wild-suggestion ${i === wildHighlight ? 'is-active' : ''}`}
                                                    // El mousedown solo frena el blur del input. Si además
                                                    // seleccionara aquí, la lista desaparecería antes del click
                                                    // y ese click caería sobre lo que quedó debajo.
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={(e) => { e.stopPropagation(); handleSelectWildSuggestion(pkm); }}
                                                    onMouseEnter={() => setWildHighlight(i)}
                                                >
                                                    <div
                                                        className="sim-wild-suggestion-img"
                                                        style={img ? { backgroundImage: `url(${img})` } : {}}
                                                    />
                                                    <span className="sim-wild-suggestion-name">{pkm.name}</span>
                                                    <span className="sim-wild-suggestion-id">{pkm.pokedex}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                            <button className="sim-hud-search-btn" onClick={handleSearchWildPokemon}>Buscar</button>

                            {wildPreviewImg
                                ? (
                                    <div className="sim-wild-preview" title="Ver al salvaje"
                                         onClick={() => setShowWildModal(true)}>
                                        <img src={wildPreviewImg} alt={wildPokemonId} className="sim-wild-preview-img" />
                                        <span className="sim-wild-preview-hint">Toca para pelear o capturar</span>
                                    </div>
                                )
                                : <div className="sim-hud-wild-empty">Busca un Pokémon para enfrentarlo o capturarlo</div>}
                        </div>
                    </section>

                    {/* ── Barra inferior: desafío final + herramientas + turno ── */}
                    <footer className="sim-hud-actions">
                        {/* El desafío final no se bloquea: la etiqueta solo informa del avance */}
                        <div className="sim-hud-elite-btn" onClick={() => setShowOtherRivals(true)}>
                            <div className="sim-hud-elite-btn-icon" />
                            <div className="sim-hud-elite-btn-text">
                                <span className="sim-hud-elite-btn-title">Elite 4 · Campeón · Rival</span>
                                <span className="sim-hud-elite-btn-note">
                                    {gymLeaders.length && badgesWon >= gymLeaders.length
                                        ? '¡Listo para el desafío final!'
                                        : `${badgesWon} de ${gymLeaders.length || 8} medallas`}
                                </span>
                            </div>
                        </div>

                        <div className="sim-hud-tools">
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
                            <div className="sim-setup-btn" onClick={() => setShowTMCatalog(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-tms"></div>
                                <span>MTs</span>
                            </div>
                            <div className={`sim-setup-btn ${pendingRequest ? 'sim-store-button--pending' : ''}`} onClick={() => setShowStore(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-store"></div>
                                <span>Tienda</span>
                            </div>
                            <div className="sim-setup-btn" onClick={() => setShowAllPlayers(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-players"></div>
                                <span>Jugadores</span>
                            </div>
                            {/* En el setup la tabla de tipos vive aquí, no en el
                                botón flotante: arriba a la derecha tapaba el
                                diseño de la cabecera */}
                            <div className="sim-setup-btn" onClick={() => setShowTypeChart(true)}>
                                <div className="sim-setup-btn-icon sim-setup-btn-icon--types">
                                    {typeChartGrid}
                                </div>
                                <span>Tipos</span>
                            </div>
                            {generation === 2 && (
                                <div className="sim-setup-btn" onClick={() => setShowFrontierModal(true)}>
                                    <div className="sim-setup-btn-icon sim-topbar-frontier"></div>
                                    <span>Frontera</span>
                                </div>
                            )}
                        </div>

                        {isMyTurn && (
                            <div className="sim-hud-next" onClick={handleNextTurn}>
                                Next Turn <span>→</span>
                            </div>
                        )}
                    </footer>
                </div>
            )}

            {/* Selección de combatientes: una sola pantalla con los dos equipos.
                `key` con el id del rival para que al cambiar de rival la pantalla
                se monte limpia (el salvaje viene preelegido en el estado inicial). */}
            {inSelection && (
                <SimBattleSelect
                    key={rival.id}
                    player={player}
                    rival={rival}
                    generation={generation}
                    pokemonList={pokemonList}
                    badgeNum={gymLeaderBadgeNum}
                    isMyTurn={isMyTurn}
                    onConfirm={handleConfirmSelection}
                    onPreview={handlePreviewSelection}
                    onToggleForms={(showForms) => { if (isMyTurn) onSetFormsView(showForms); }}
                    onBack={handleNewSimulation}
                    onOpenTypeChart={() => setShowTypeChart(true)}
                    onOpenRules={() => setShowRulesGuide(true)}
                    onNextTurn={handleNextTurn}
                />
            )}

            {/* Seleccion de ataques */}
            {!showSetup && rivalPokemonSelected === 'true' && myPokemonSelected === 'true' && (
                <div className="attack-select-sim">
                    <div className='MyPokemon-main'>
                        <div className={`MyPokemon_img ${myLocked && rivalLocked ? (myTotal >= rivalTotal ? 'winner-img' : 'loser-img') : ''}`} style={{ backgroundImage: `url(${myPokemonImg})` }}></div>
                        <div className='MyPokemon_name'>
                            {myPokemon.name}
                            <TMBadge pokemon={myPokemon} onOpen={setTmCardOpen} />
                        </div>
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
                        <div className='RivalPokemon_name'>
                            {rivalPokemon.name}
                            <TMBadge pokemon={rivalPokemon} onOpen={setTmCardOpen} />
                        </div>
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
                                    <div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Extra</div>+<div>Dice</div>=<div>Total</div>
                                </div>
                                <div className='MyTotal'>
                                    <div>{myPokemon.totalLevel}</div>+
                                    <div>{myAttackPower}</div>+
                                    <div>{myBonusFinal}</div>+
                                    <div className={myExtra !== 0 ? 'total-extra-on' : ''}>{myExtra}</div>+
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
                                    <div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Extra</div>+<div>Dice</div>=<div>Total</div>
                                </div>
                                <div className='RivalTotal'>
                                    <div>{rivalPokemon.totalLevel}</div>+
                                    <div>{rivalAttackPower}</div>+
                                    <div>{rivalBonusFinal}</div>+
                                    <div className={rivalExtra !== 0 ? 'total-extra-on' : ''}>{rivalExtra}</div>+
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
                            <button className="levelup-btn-yes" onClick={() => { setShowLevelUpPrompt(false); onIncreaseLevel(player.id, resolveBasePokemonId(myPokemon), { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' }); if (pendingBadge) { setPendingBadge(false); setShowBadgePrompt(true); } }}>Sí</button>
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

            {/* Tabla de tipos flotante: solo durante la batalla, que es donde no
                hay barra de herramientas. En el setup el acceso está en esa
                barra, junto a Jugadores, para no tapar la cabecera.
                El icono son 4 tipos reales del juego, para que se lea de golpe.
                La selección de combatientes lo lleva en su barra superior. */}
            {!showingSetup && !inSelection && (
                <div className="type-chart-fab" title="Tabla de tipos" onClick={() => setShowTypeChart(true)}>
                    {typeChartGrid}
                </div>
            )}
            <ModalTypeChart show={showTypeChart} onClose={() => setShowTypeChart(false)} />
            <ModalSettings
                show={showSettings}
                theme={theme}
                onSelectTheme={handleSelectTheme}
                onClose={() => setShowSettings(false)} />
            {/* Dentro de .sim-player para que herede los tokens del tema */}
            <SimThemeCurtain mascot={mascot} phase={curtainPhase} />
        </div>
    );
};

export default SimPlayer;
