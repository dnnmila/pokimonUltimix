import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import ModalUnderground from "./modals/ModalUnderground";
import ModalAttach from "./modals/ModalAttach";
import ModalMote from "./modals/ModalMote";
import PokemonName from "./PokemonName";
import { displayName, nameTitle } from "../moteName";
import ModalSettings from "./modals/ModalSettings";
import { getTrainerImage, getTrainerAvatar } from "../data/trainers";
import SimThemeCurtain, { useSimCurtain } from "./SimThemeCurtain";
import { themeClass, readTheme, writeTheme, getThemeMascot } from "../data/simThemes";
import { getLeaderPortrait, RIVAL_COLORS, getRivalColor } from "../data/leaders";
import { typeColor, typeLabel } from "../pokemonTypes";
import ModalTypeChart from "./modals/ModalTypeChart";
import ModalSpecialAttacks from "./modals/ModalSpecialAttacks";
import ModalTMCatalog from "./modals/ModalTMCatalog";
import ModalTMCard from "./modals/ModalTMCard";
import ModalItemCard from "./modals/ModalItemCard";
import ModalEvents from "./modals/ModalEvents";
import ModalEventPick from "./modals/ModalEventPick";
import ModalRaidSetup from "./modals/ModalRaidSetup";
import ModalHordeSetup from "./modals/ModalHordeSetup";
import ModalTrainerBattle from "./modals/ModalTrainerBattle";
import ModalContest from "./modals/ModalContest";
import ModalPokeStar from "./modals/ModalPokeStar";
import ModalRulesCard from "./modals/ModalRulesCard";
import ModalHelp from "./modals/ModalHelp";
import ModalMegaBattle from "./modals/ModalMegaBattle";
import ModalInteractiveMap from "./modals/ModalInteractiveMap";
import { rollTMs, tmPowerFor, TMS_BY_ID } from "../data/tms";
import { rollZCrystals, zMoveFor, Z_BY_ID } from "../data/zmoves";
import { getTeraBonus, rollTeraOrbs, TERA_BY_ID } from "../data/teraTypes";
import { getEquipBonus } from "../data/equipment";
import { pokeStarEnding, ENDINGS as POKESTAR_ENDINGS } from "../data/pokeStar";
import { getFrontier, FRONTIER_COINS } from "../data/frontiers";
import { applyDynamax } from "../data/maxMoves";
import SERVER_IP from "../config.js";
import { getItemBonus, getAlphaBonus, getFieldAttackBonus, getFieldFinalBonus, getFieldMove, MAX_EXTRA_LEVEL } from "../battleRules";
import { attachIconStyle, attachLabel } from "../attachItems";
import { TMBadge, ItemBadge } from "./PokemonBattleBadges";
import { arenaStyle } from "../data/arenas";

const LEADER_PREFIXES = ['gym', 'Riv'];

// Generaciones con tablero dibujado en Backend/saves/boardNodes/. Solo en
// estas se ofrece el botón Mapa: sin nodos no hay ficha, ni ruta, ni casillas,
// y el mapa se quedaría en una foto de los líderes. Las cuatro regiones están
// mapeadas y validadas (recorrido completable y Liga sellada hasta la 8ª medalla).
const MAP_GENERATIONS = [1, 2, 3, 4];

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

// Formas que cuelgan de un eslabón de la cadena en vez de continuarla: megas y
// formas legendarias. Se dibujan igual —una flecha y los tokens al lado— y solo
// cambia el icono de la flecha, que es el objeto que provoca el cambio: el
// símbolo de mega para unas, el objeto legendario para las otras.
const SideForms = ({ forms, kind, generation }) => {
    if (!forms || forms.length === 0) return null;
    return (
        <>
            <div className={`pokedex-arrow pokedex-arrow--${kind}`}></div>
            <div className="pokedex-branches">
                {forms.map(pokedex => {
                    const img = getSafePkmImg(pokedex, generation);
                    return img ? (
                        <div key={pokedex} className="pokedex-branch-group">
                            <div className="pokedex-token-wrapper">
                                <div className="pokedex-token pokedex-token--mega"
                                     style={{ backgroundImage: `url(${img})` }} />
                            </div>
                        </div>
                    ) : null;
                })}
            </div>
        </>
    );
};

const getFieldCardImg = (id) => {
    try { return require(`../images/Field Moves/${id}.png`); } catch { return null; }
};

const getTypeIcon = (type) => {
    try { return require(`../images/Types/${type}.png`); } catch { return null; }
};

// Lo que cambia al subir teracristalizado o dinamaxizado y NO está en la ficha
// del equipo: applyTera / applyDynamax devuelven una copia con el mismo id, así
// que al backend —que busca por id— hay que decírselo aparte. Es lo que hace que
// el espejo del marcador pinte el mismo Pokémon que la tablet: aura, tipo del
// orbe y ataques Max incluidos.
const battleForm = (pkm) => {
    if (!pkm || (!pkm.teraActive && !pkm.dynamaxActive)) return null;
    return {
        teraActive: Boolean(pkm.teraActive),
        dynamaxActive: Boolean(pkm.dynamaxActive),
        type1: pkm.type1,
        type2: pkm.type2,
        attack1: pkm.attack1,
        attack2: pkm.attack2,
        attack3: pkm.attack3,
    };
};

const SimPlayer = ({ game, onSimWildBattle, onSimLeaderBattle, onSimPlayerBattle, onChangeState, onIncreaseLevel, onStartSimMirror, onHandleBattlePokemon, onHandleBattleAttack, onHandleTotales, onChangeBattlePhase, onSetFormsView, onHandleDice, onHandleBonuses, onHandleBonusFinal, onToggleBattlePublic, onEvolvePokemon, onNextTurn, onAddPokemon, onRemovePokemon, onAttach, attachTM, attachMega, attachTera, attachEquip, attachLegendary, onRaidStart, onRaidTeam, onRaidRound, onRaidFinish, onRaidClear, onHordeStart, onHordeTeam, onHordeRound, onHordeFinish, onHordeClear, onTrainerStart, onTrainerRound, onTrainerClear, onFrontierStart, onFrontierFinish, onFrontierClear, onPokeStarStart, onPokeStarLevel, onPokeStarClear, onMegaForms, onRandomMega, onSimMegaBattle, onUndergroundBattle, onEventMirror, onBagAdd, onBagRemove, onMarkEventUsed, onSetFieldMove, onMovePlayerMap, onToggleSurf }) => {
    const { playerId } = useParams();
    const player = game.players.find(p => p.id === playerId);
    const rival = player ? player.simRival : null;
    const generation = game?.generation || 1;
    // Incursión Max en curso de ESTE jugador. Se deriva aquí arriba porque el
    // efecto de fin de batalla —que está bastante antes que el resto del bloque
    // de incursión— necesita saber si la batalla que acaba de cerrarse es una
    // ronda de incursión.
    const raid = game.raid && game.raid.hostId === playerId ? game.raid : null;
    // Horda en curso de ESTE jugador, por lo mismo: sus combates SÍ pasan por el
    // flujo de batalla salvaje (nivel y debilitado), y el efecto de fin de
    // batalla necesita saberlo para no ofrecer la captura en cada uno — la horda
    // se captura una sola vez, al final.
    const horde = game.horde && game.horde.hostId === playerId ? game.horde : null;
    const hordeActive = Boolean(horde && !horde.result);
    // Combate de entrenador (1 o 2 rivales seguidos). Mismo motivo de estar aquí
    // arriba: sus combates son salvajes de pleno derecho salvo por la captura,
    // que no va — el Pokémon es de un entrenador.
    const trainerBattle = game.trainerBattle && game.trainerBattle.hostId === playerId ? game.trainerBattle : null;
    const trainerActive = Boolean(trainerBattle && !trainerBattle.result);
    // Reto de frontera. Igual que el combate de entrenador: batalla salvaje de
    // pleno derecho salvo por la captura, que no va — el rival es el guardián de
    // la frontera, no un salvaje que se quede uno.
    const frontierBattle = game.frontierBattle && game.frontierBattle.hostId === playerId ? game.frontierBattle : null;
    const frontierActive = Boolean(frontierBattle && !frontierBattle.result);
    // Poké Star Studios no guarda nada en la partida: se reconoce por el id del
    // rival, así que aguanta un refresco sin ayuda de nadie.
    const pokeStarActive = Boolean(rival?.id?.startsWith('SimPokeStar-'));
    // Ningún evento encadenado ofrece capturar combate a combate. En el rodaje
    // tampoco: el Prop es un actor del estudio, no un salvaje.
    const noCaptureEvent = hordeActive || trainerActive || frontierActive || pokeStarActive;
    const fieldMoves = (game?.fieldMoves || []).filter(Boolean);
    // Clave estable para detectar cuándo el master cambió las cartas de campo
    const fieldKey = JSON.stringify(game?.fieldMoves || []);

    // Item + cartas de campo + teracristalización. Con Dormido/Paralizado/Congelado
    // el ataque queda anulado, así que las cartas que dependen del ataque tampoco
    // cuentan; el item y las que pegan al valor final siguen aplicando.
    //
    // Los bonos del Orbe Tera, del objeto de equipo y del Pokémon Alfa van con
    // las que dependen del ataque —miran su tipo o su poder—, así que también
    // se caen si el ataque está anulado: sin ataque no hay nada que reforzar.
    const computeExtra = (pkm, attack, status, side) => {
        const always = getItemBonus(pkm) + getFieldFinalBonus(pkm, fieldMoves, side);
        const nullified = status === 'Asleep' || status === 'Paralized' || status === 'Frozen';
        if (nullified) return always;
        return always + getFieldAttackBonus(attack, fieldMoves, side)
            + getTeraBonus(pkm, attack) + getEquipBonus(pkm, attack)
            + getAlphaBonus(pkm, attack);
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
    // `wildPokemonId` es solo el texto del buscador; el salvaje encontrado vive
    // aparte en `wildFoundId`. Así el hallazgo se queda en pantalla aunque el
    // jugador escriba otra cosa, pelee o capture: solo desaparece cuando otra
    // búsqueda lo reemplaza o cuando termina su turno.
    const [wildPokemonId, setWildPokemonId] = useState('');
    const [wildFoundId, setWildFoundId] = useState('');
    const [wildSuggestions, setWildSuggestions] = useState([]);
    const [wildHighlight, setWildHighlight] = useState(-1);
    const [wildPreviewImg, setWildPreviewImg] = useState(null);
    const [wildChain, setWildChain] = useState(null);
    const [showWildModal, setShowWildModal] = useState(false);
    const [showPokedex, setShowPokedex] = useState(false);
    const [showLeaderViewer, setShowLeaderViewer] = useState(false);
    const [showStore, setShowStore] = useState(false);
    const [showRulesGuide, setShowRulesGuide] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [showOtherRivals, setShowOtherRivals] = useState(false);
    const [attachPkmId, setAttachPkmId] = useState(null);
    // Pokémon al que se le está poniendo mote (se guarda el id, no el objeto:
    // el equipo se repinta con cada gameUpdated y el objeto quedaría viejo)
    const [motePkmId, setMotePkmId] = useState(null);
    // Carta de campo abierta a tamaño completo para leer su efecto
    const [expandedField, setExpandedField] = useState(null);
    const [showTypeChart, setShowTypeChart] = useState(false);
    // Menú de funciones especiales de batalla: dado de tipos, metrónomo y clima
    const [showSpecialFns, setShowSpecialFns] = useState(false);
    const [showTMCatalog, setShowTMCatalog] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    // Eventos de «toma una carta» (Take TM / Take Z Crystal). `kind` dice qué
    // baraja es; `mode` distingue la tirada de 3 (roll) de usar una carta que ya
    // estaba en la bolsa (use), y `bagUid` solo viaja en ese segundo caso, para
    // poder sacarla de la bolsa al adjuntarla.
    const [pickEvent, setPickEvent] = useState(null);
    // Incursión Max. El marcador vive en `game.raid` (backend); aquí solo queda
    // lo de la tablet: si la pantalla de montaje está abierta, si hay una
    // llamada en vuelo, y el resumen del combate recién cerrado que espera
    // confirmación antes de encadenar el siguiente.
    const [raidSetupOpen, setRaidSetupOpen] = useState(false);
    const [raidLoading, setRaidLoading] = useState(false);
    // El cierre de combate NO se guarda como foto: se deriva de que los dos
    // dados estén bloqueados. Así, si el jugador vuelve al combate a corregir un
    // dado, al volver a bloquearlo el cierre reaparece con el total nuevo. Esta
    // bandera solo dice "lo he escondido a propósito", y se limpia sola en
    // cuanto un dado se desbloquea.
    const [raidRoundHidden, setRaidRoundHidden] = useState(false);
    const [raidResultOpen, setRaidResultOpen] = useState(false);
    // Tras el cuarto combate hay que meter el D4 del jefe: lo tira el host con
    // su dado físico, así que la app lo pregunta en vez de sortearlo.
    const [raidDiePick, setRaidDiePick] = useState(false);
    const [raidError, setRaidError] = useState(null);
    const [raidRulesOpen, setRaidRulesOpen] = useState(null);
    // Horda. Mismo reparto que la incursión: el marcador vive en `game.horde` y
    // aquí solo queda lo de la tablet.
    const [hordeSetupOpen, setHordeSetupOpen] = useState(false);
    const [hordeLoading, setHordeLoading] = useState(false);
    const [hordeError, setHordeError] = useState(null);
    const [hordeRoundHidden, setHordeRoundHidden] = useState(false);
    const [hordeResultOpen, setHordeResultOpen] = useState(false);
    // Combate de entrenador
    const [trainerSetupOpen, setTrainerSetupOpen] = useState(false);
    const [trainerLoading, setTrainerLoading] = useState(false);
    const [trainerError, setTrainerError] = useState(null);
    const [trainerRoundHidden, setTrainerRoundHidden] = useState(false);
    const [trainerResultOpen, setTrainerResultOpen] = useState(false);
    // Reto de frontera. No hay pantalla de montaje: el rival lo sortea el
    // backend a partir del color de la frontera, así que la llamada sale del
    // propio modal de fronteras y aquí solo queda su estado en vuelo.
    const [frontierLoading, setFrontierLoading] = useState(false);
    const [frontierError, setFrontierError] = useState(null);
    const [frontierRoundHidden, setFrontierRoundHidden] = useState(false);
    const [frontierResultOpen, setFrontierResultOpen] = useState(false);
    // Concurso Pokémon. No toca el motor de batalla ni deja rastro en la
    // partida: empieza y acaba dentro de su modal, así que basta con abrirlo.
    const [contestOpen, setContestOpen] = useState(false);
    // Poké Star Studios: montaje abierto, llamada en vuelo y el final del rodaje
    const [pokeStarOpen, setPokeStarOpen] = useState(false);
    const [pokeStarLoading, setPokeStarLoading] = useState(false);
    const [pokeStarError, setPokeStarError] = useState(null);
    const [pokeStarDone, setPokeStarDone] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [megaBattleOpen, setMegaBattleOpen] = useState(false);
    const [megaLoading, setMegaLoading] = useState(false);
    const [undergroundOpen, setUndergroundOpen] = useState(false);
    const [undergroundLoading, setUndergroundLoading] = useState(false);
    // ¿Hay alguna guía abierta encima del concentrador de Ayuda?
    const guideOpen = showLeaderViewer || showRulesGuide || showTMCatalog || Boolean(raidRulesOpen);
    // MT abierta a tamaño carta durante la batalla: {attack, pokemonName}
    const [tmCardOpen, setTmCardOpen] = useState(null);
    // Item adjunto abierto a tamaño carta: {itemId, pokemon, pokemonName}
    const [itemCardOpen, setItemCardOpen] = useState(null);
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

    // Único punto que borra el salvaje encontrado. Se declara aquí arriba —antes
    // del `return` de "jugador no encontrado"— porque lo usa el efecto de turno.
    const clearWildFound = () => {
        setWildFoundId('');
        setWildPokemonId('');
        setWildSuggestions([]);
        setWildHighlight(-1);
        setWildPreviewImg(null);
        setWildChain(null);
        setShowWildModal(false);
    };

    // El salvaje encontrado dura todo el turno del jugador: se borra cuando su
    // turno acaba (paso de mio -> de otro), no cuando pelea o captura.
    const prevIsMyTurn = useRef(isMyTurn);
    useEffect(() => {
        if (prevIsMyTurn.current && !isMyTurn) clearWildFound();
        prevIsMyTurn.current = isMyTurn;
    }, [isMyTurn]); // eslint-disable-line react-hooks/exhaustive-deps

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
            onHandleTotales('MyPlayer', myTotal, myExtra);
            onHandleTotales('Rival', rivalTotal, rivalExtra);
        }
    }, [myAttackSelected, rivalAttackSelected]);

    // Prompts al terminar batalla (dados bloqueados)
    useEffect(() => {
        if (!myLocked || !rivalLocked) return;
        if (!myPokemon || !rivalPokemon) return;

        // Incursión: aquí no se gana nivel, no se captura y nadie se debilita
        // (las tres reglas de la carta). Solo se anota el combate y se ofrece
        // encadenar el siguiente, así que este efecto se corta antes de todos
        // los prompts de una batalla normal.
        if (raid && !raid.result) return;

        // Batalla contra pokemon salvaje: levelup → captura (secuencial)
        //
        // En la horda el salvaje es el mismo para todo el equipo, así que la
        // captura NO se ofrece combate a combate: se intenta una sola vez al
        // final, con el bono de las victorias. El nivel y el debilitado sí van,
        // que la horda se pelea con las reglas de siempre.
        if (rival?.name === 'Wild Pokemon') {
            if (myTotal > rivalTotal) {
                const canLevelUp = rivalPokemon.totalLevel >= myPokemon.totalLevel
                    && canGainLevel(myPokemon);
                // Al máximo se salta directo a la captura, que es lo que había
                // después de decir «No» al nivel.
                if (canLevelUp) setShowLevelUpPrompt(true);
                else if (!noCaptureEvent) setShowCapturePrompt(true);
            }
            // En el rodaje nadie se queda debilitado: la carta reanima al final,
            // así que lo más simple es no tumbarlo.
            if (myTotal < rivalTotal && myPokemon.state === 'Alive' && !pokeStarActive) {
                new Audio(lifepointsSound).play().catch(() => {});
                onChangeState(player.id, myPokemon.id, { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' });
            }
            return;
        }

        // Batallas oficiales (líderes / jugadores)
        if (!isOfficialBattle) return;
        if (myTotal > rivalTotal) {
            // Mismo tope que en la salvaje: al máximo no se ofrece subir, y la
            // medalla sale de una vez en lugar de esperar a la respuesta.
            const canLevelUp = rivalPokemon.totalLevel >= myPokemon.totalLevel
                && canGainLevel(myPokemon);
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

    // Volver a tocar los dados reabre el cierre de combate de la incursión: si
    // el jugador salió a corregir uno, el resumen tiene que volver solo con el
    // total actualizado en cuanto ambos vuelvan a estar bloqueados.
    useEffect(() => {
        if (!myLocked || !rivalLocked) {
            setRaidRoundHidden(false);
            setHordeRoundHidden(false);
            setTrainerRoundHidden(false);
            setFrontierRoundHidden(false);
            setPokeStarDone(false);
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
                if (isMyTurn) onHandleTotales('MyPlayer', newTotal, newExtra);
            }
        }
        if (rivalPokemon && rivalAttackSelected === 'true') {
            const newExtra = computeExtra(rivalPokemon, rivalAttack, rivalStatus, 'rival');
            if (newExtra !== rivalExtra) {
                const newTotal = sumTotal(rivalPokemon.totalLevel, rivalAttackPower, rivalBonusFinal, rivalDice, newExtra);
                setRivalExtra(newExtra);
                setRivalTotal(newTotal);
                if (isMyTurn) onHandleTotales('Rival', newTotal, newExtra);
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
        setWildFoundId(pokedex);
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

    // ── Espejo de eventos ───────────────────────────────────────────────────
    // Lo que cada modal de evento va enseñando se publica aquí para que la tabla
    // de /players lo repita. Es solo para mirar: no manda sobre la partida y si
    // se pierde no pasa nada, así que ni se espera la respuesta ni se avisa de
    // los fallos — un espejo que se queda atrás no puede tumbar la jugada.
    //
    // Los tres eventos de «toma una carta» no llaman aquí: se juegan en privado.
    //
    // Esta función TIENE QUE SER ESTABLE entre renders, y con cuidado: los
    // modales la llevan en las dependencias de su useEffect, así que una
    // identidad nueva vuelve a disparar los siete efectos. Y como publicar
    // provoca un `gameUpdated`, que re-renderiza esto, sería un bucle cerrado
    // que ahoga el socket — se cayó en él y dejó lento hasta el sorteo por
    // color.
    //
    // De ahí las dos precauciones:
    //   1. `onEventMirror` NO va en las dependencias. Viene de App, que la
    //      redefine en cada render, así que se guarda en una ref y se lee al
    //      llamar; la función de fuera cambia, esta no.
    //   2. No se manda lo mismo dos veces seguidas. La firma se guarda POR
    //      EVENTO, porque hay siete modales montados a la vez publicando cada
    //      uno lo suyo. Es la red de seguridad: aunque un efecto se dispare de
    //      más, si no hay nada nuevo que contar no sale ninguna petición.
    const mirrorFnRef = useRef(onEventMirror);
    mirrorFnRef.current = onEventMirror;
    const lastMirrorRef = useRef({});

    const publishEventMirror = useCallback((view) => {
        const enviar = mirrorFnRef.current;
        if (!playerId || !enviar || !view?.event) return;
        const firma = JSON.stringify(view);
        if (lastMirrorRef.current[view.event] === firma) return;
        lastMirrorRef.current[view.event] = firma;
        enviar(playerId, view);
    }, [playerId]);

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

    // Escribir NO borra lo ya encontrado: la ficha del salvaje sigue en pantalla
    // hasta que una búsqueda nueva la reemplace.
    const handleWildInputChange = (value) => {
        setWildPokemonId(value);
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
            setWildFoundId(id);
            const res = await fetch(`${SERVER_IP}/get-evolution-chain`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pokedexId: id })
            });
            const data = await res.json();
            setWildChain(data);
        } catch (e) {
            // Búsqueda fallida: se cae también el salvaje anterior, para no
            // dejar en pantalla una ficha que ya no corresponde a lo buscado.
            setWildFoundId('');
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
        if (!wildFoundId) return;
        prevSimRivalId.current = `SimRival-${playerId}`;
        // Todo el cuerpo va dentro de la cortina: el cambio de pantalla tiene
        // que ocurrir con las hojas cerradas, no antes ni después
        await runCurtain(async () => {
            await onSimWildBattle(playerId, wildFoundId);
            if (isMyTurn) onStartSimMirror(playerId);
            // El salvaje NO se limpia aquí: al volver al setup sigue encontrado
            setWildSuggestions([]);
            setShowWildModal(false);
            setShowSetup(false);
        });
    };

    // Fases 'evo' (Zygarde 10%/50%): solo evolucionan si llevan puesto el objeto
    // legendario, que se gasta al hacerlo. Antes lo hacía la mega piedra, y se
    // sigue aceptando por las partidas que ya tuvieran un Zygarde con ella.
    const canEvolveWithStone = (pkm) =>
        pkm.mega === 'evo' && (pkm.attach === 'LegendEvo' || pkm.attach === 'Mega');

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
            // Retar a un líder en oficial significa estar en su ciudad, así que
            // la ficha del mapa se coloca sola en ese gimnasio. Se mueve sin
            // preguntar: una confirmación en mitad del combate estorba, y si el
            // sitio no era ese la ficha se arrastra a mano desde el mapa.
            // Solo donde hay tablero: en el resto sería guardar una casilla
            // que no existe.
            if (MAP_GENERATIONS.includes(generation)) {
                onMovePlayerMap?.(playerId, `gym-${badgeNum}`);
            }
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
                    {/* El nombre es el botón del mote: es el sitio donde el
                        jugador ya está mirando cuando piensa en renombrarlo */}
                    <PokemonName pkm={pkm}
                                 className="sim-pkm-card-name sim-pkm-card-name--editable"
                                 title={`${nameTitle(pkm)} — toca para poner un mote`}
                                 onClick={() => setMotePkmId(pkm.id)} />
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
                         title={pkm.attach !== 'None' ? `${attachLabel(pkm.attach, pkm)} — cambiar item` : 'Adjuntar item'}
                         onClick={() => setAttachPkmId(pkm.id)}>
                        {pkm.attach !== 'None'
                            ? <div className="sim-mini-attach attached-item" style={attachIconStyle(pkm.attach, pkm)} />
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

    // El mote no pasa por App.js como el resto de acciones: no lo necesita nadie
    // más que esta pantalla, y el socket ya devuelve el equipo actualizado.
    const handleSetMote = async (pokemonId, mote) => {
        try {
            await fetch(`${SERVER_IP}/set-mote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, pokemonId, mote })
            });
        } catch (err) {
            console.error('Error al poner el mote:', err);
        }
    };

    // `kind` es 'buy' salvo que sea una venta de carta, que en vez de cobrar
    // paga. La resta o la suma la hace el backend al aprobar, no esto.
    const handleRequestPurchase = async (item, price, kind = 'buy') => {
        try {
            const res = await fetch(`${SERVER_IP}/request-purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, item, price, kind })
            });
            const data = await res.json();
            if (res.ok) setPendingRequest({ id: data.purchaseId, item, price, kind });
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

    // ¿Le queda nivel por subir? El tope son +6 extras, y a partir de ahí la
    // victoria ya no ofrece subir: el backend cicla a +0 al pasarse (es lo que
    // usa el "+" del máster para corregir a mano) y aquí eso sería reiniciar el
    // Pokémon en vez de premiarlo.
    //
    // El extra se lee del Pokémon BASE, que es a quien va el nivel cuando se
    // pelea como mega o G-Max.
    const canGainLevel = (pkm) => {
        if (!pkm) return false;
        const baseId = resolveBasePokemonId(pkm);
        const base = (player.pokemons || []).find(p => p.id === baseId) || pkm;
        return (base.extra ?? 0) < MAX_EXTRA_LEVEL;
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
        if (isMyTurn) onHandleBattlePokemon('MyPlayer', pokemon.id, battleForm(pokemon));
        if (rival?.name === 'Wild Pokemon') {
            // En Poké Star el Prop pelea al nivel del Pokémon que acaba de
            // salir, así que primero se le iguala en el servidor —el espejo lee
            // el rival de ahí— y se pelea contra la ficha ya nivelada.
            if (pokeStarActive) {
                const res = await onPokeStarLevel(player.id, pokemon.totalLevel ?? pokemon.level);
                if (res?.pokemon) return handleSelectRivalPokemon(res.pokemon, pokemon);
            }
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
            onHandleBattlePokemon('Rival', pokemon.id, battleForm(pokemon));
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
            onHandleTotales('MyPlayer', newTotal, newExtra);
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
            onHandleTotales('Rival', newTotal, newExtra);
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
            onHandleTotales('MyPlayer', newTotal, myExtra);
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
            onHandleTotales('MyPlayer', newTotal, myExtra);
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
            onHandleTotales('Rival', newTotal, rivalExtra);
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
            onHandleTotales('Rival', newTotal, rivalExtra);
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
        await handleAddToTeam(wildFoundId);
        // Solo se cierra el modal: la ficha del salvaje se queda en el setup
        setShowWildModal(false);
    };

    const handleNextTurn = () => {
        onNextTurn();
    };

    // Huir del salvaje: se cobra 1 moneda y se cierra el turno. Solo sale en el
    // turno propio —si no, cualquiera podría ir sumando monedas fuera de turno—
    // y el salvaje lo limpia solo el efecto de fin de turno.
    const handleWildFlee = async () => {
        if (!isMyTurn) return;
        try {
            await fetch(`${SERVER_IP}/update-coins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, coins: (player.coins || 0) + 1 }),
            });
        } catch (e) {
            console.error('Error al dar la moneda de huida:', e);
        }
        setShowWildModal(false);
        handleNextTurn();
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
        setShowMap(false);
        setShowHelp(false);
        setShowSpecialFns(false);
        setMegaBattleOpen(false);
        setUndergroundOpen(false);
        setHordeSetupOpen(false);
        setTrainerSetupOpen(false);
        setContestOpen(false);
        setPokeStarOpen(false);
        setShowEvents(false);
        setPickEvent(null);
        setShowWildModal(false);
        setShowOtherRivals(false);
        setShowLevelUpPrompt(false);
        setShowEvolveModal(false);
        setShowAllPlayers(false);
        setShowFrontierModal(false);
        // El reto de frontera es un solo combate y no tiene pantalla de
        // montaje a la que volver: si se abandona, se libera. Si no, su cierre
        // de combate saltaría encima de la siguiente batalla, que no es suya.
        if (frontierBattle && !frontierBattle.result) {
            setFrontierRoundHidden(false);
            onFrontierClear(player.id);
        }
        setShowCapturePrompt(false);
        setShowReplaceModal(false);
        setPendingCapturePokedex(null);
        if (isMyTurn && game.battlePublic) onToggleBattlePublic();
    };

    // ── Eventos ─────────────────────────────────────────────────────────────
    // Los eventos que aún no tienen lógica se listan aquí: el menú los pinta en
    // gris y no deja pulsarlos, en vez de abrir algo que no hace nada.
    const EVENTS_TODO = [];

    // Los que ya se lanzaron en este turno. El backend limpia la marca al
    // empezar el turno del jugador, así que basta con leerla. Sin useMemo: por
    // aquí ya se pasó un early return, y son dos listas de nada.
    const eventsUsed = Object.keys(player?.eventsUsed || {}).filter(k => player.eventsUsed[k]);
    const bag = player?.bag || [];

    // Punto único de entrada de los eventos. Cada rama se va llenando conforme
    // se define qué hace el evento; el menú se cierra siempre al elegir.
    const handleEventPick = async (eventId) => {
        setShowEvents(false);
        switch (eventId) {
            case 'takeTM':
                // El evento se consume al abrirlo: salir sin elegir cuesta lo
                // mismo que elegir, así que la marca se pone ya.
                onMarkEventUsed(player.id, 'takeTM');
                setPickEvent({ kind: 'tm', mode: 'roll', options: rollTMs(3) });
                break;
            case 'takeZ':
                onMarkEventUsed(player.id, 'takeZ');
                setPickEvent({ kind: 'z', mode: 'roll', options: rollZCrystals(3) });
                break;
            case 'takeTera':
                onMarkEventUsed(player.id, 'takeTera');
                setPickEvent({ kind: 'tera', mode: 'roll', options: rollTeraOrbs(3) });
                break;
            case 'raidMax':
                // A diferencia de los eventos de tomar carta, la incursión NO se
                // consume: se puede montar las veces que haga falta. Lo que sí
                // se hace es borrar la anterior, para que la pantalla de montaje
                // abra siempre limpia en el paso del color en vez de saltar al
                // equipo con el jefe viejo.
                if (raid) await onRaidClear(player.id);
                // Los eventos de combate se pelean el mismo hueco de rival, así
                // que montar uno cierra el que hubiera.
                if (horde) await onHordeClear(player.id);
                if (trainerBattle) await onTrainerClear(player.id);
                if (frontierBattle) await onFrontierClear(player.id);
                setRaidSetupOpen(true);
                break;
            case 'horde':
                // Mismo criterio que la incursión: no se consume, y la anterior
                // se borra para que el montaje abra limpio en el color.
                if (horde) await onHordeClear(player.id);
                if (raid) await onRaidClear(player.id);
                if (trainerBattle) await onTrainerClear(player.id);
                if (frontierBattle) await onFrontierClear(player.id);
                setHordeSetupOpen(true);
                break;
            case 'pokeStar':
                // Como el resto de eventos de combate: si había otro rival
                // montado se libera antes de armar el set.
                if (raid) await onRaidClear(player.id);
                if (horde) await onHordeClear(player.id);
                if (trainerBattle) await onTrainerClear(player.id);
                if (frontierBattle) await onFrontierClear(player.id);
                setPokeStarDone(false);
                setPokeStarOpen(true);
                break;
            case 'contest':
                // Ni monta rival ni encadena nada: se resuelve en su modal.
                setContestOpen(true);
                break;
            case 'trainerBattle':
                if (trainerBattle) await onTrainerClear(player.id);
                if (raid) await onRaidClear(player.id);
                if (horde) await onHordeClear(player.id);
                if (frontierBattle) await onFrontierClear(player.id);
                setTrainerSetupOpen(true);
                break;
            case 'megaBattle':
                // No se consume por turno, igual que la incursión: es un combate
                // suelto que se puede montar las veces que haga falta.
                setMegaBattleOpen(true);
                break;
            case 'underground':
                // Mismo criterio que el resto de eventos de combate: el hueco de
                // rival es uno solo, así que montar este cierra el que hubiera.
                if (raid) await onRaidClear(player.id);
                if (horde) await onHordeClear(player.id);
                if (trainerBattle) await onTrainerClear(player.id);
                if (frontierBattle) await onFrontierClear(player.id);
                setUndergroundOpen(true);
                break;
            default:
                break;
        }
    };

    // ── Eventos Take TM / Take Z Crystal ────────────────────────────────────

    // Adjunta la carta elegida, con las mismas llamadas que hace el catálogo
    // desde ModalAttach. Las tres barajas compiten por el mismo hueco (`attach`),
    // así que adjuntar una quita la anterior: un Pokémon lleva MT, cristal u
    // orbe, nunca dos.
    //
    // La MT viaja con el poder ya sumado el bono de tipo para ESTE Pokémon, más
    // el poder impreso aparte para que el backend recalcule el bono si el
    // Pokémon evoluciona. El cristal viaja con el movimiento ya resuelto y con
    // su tabla entera (genérico + especiales) por el mismo motivo: un Dartrix
    // con Ghostium Z lleva el genérico, pero al evolucionar a Decidueye le toca
    // Sinister Arrow Raid.
    const handleEventPickAttach = (card, pokemonId) => {
        const target = (player.pokemons || []).find(p => p.id === pokemonId);

        // El orbe no crea ataque ni resuelve movimiento: solo marca el Pokémon
        // con el tipo, y ya en la selección de combatientes se decide si sube
        // teracristalizado.
        if (pickEvent?.kind === 'tera') {
            attachTera(player.id, pokemonId, card.id);
        } else if (pickEvent?.kind === 'z') {
            const mov = zMoveFor(card, target);
            attachTM(player.id, pokemonId, card.tipo.toUpperCase(), mov.poder, {
                tmName: mov.nombre,
                attachAs: 'Z',
                zData: {
                    cristal: card.cristal,
                    generico: card.generico,
                    poderGenerico: card.poder,
                    especiales: card.especiales
                        .filter(e => e.activo !== false)
                        .map(({ pokemon, nombre, poder }) => ({ pokemon, nombre, poder })),
                },
            });
        } else {
            attachTM(player.id, pokemonId, card.tipo.toUpperCase(), tmPowerFor(card, target), {
                tmName: card.nombre,
                tmBase: card.poder,
                tmBono: card.stab,
            });
        }

        // Venía de la bolsa: al equiparla deja de estar guardada.
        if (pickEvent?.bagUid) onBagRemove(player.id, pickEvent.bagUid);
        setPickEvent(null);
    };

    // A la bolsa. Solo se guarda el id de la carta: la ficha entera se resuelve
    // al pintarla, así una carta guardada no se queda con datos viejos si el
    // catálogo cambia.
    const handleEventPickSave = (card) => {
        const kind = pickEvent?.kind || 'tm';
        onBagAdd(player.id, {
            uid: `${kind}-${card.id}-${Date.now()}`,
            kind,
            cardId: card.id,
        });
        setPickEvent(null);
    };

    // Usar una carta que ya estaba guardada: se salta la tirada y va directo a
    // elegir Pokémon. Cerrar aquí no cuesta nada, sigue en la bolsa.
    const BAG_CATALOGS = { tm: TMS_BY_ID, z: Z_BY_ID, tera: TERA_BY_ID };

    const handleUseBagItem = (entry) => {
        const card = BAG_CATALOGS[entry.kind]?.[entry.cardId];
        if (!card) return;
        setShowEvents(false);
        setPickEvent({ kind: entry.kind, mode: 'use', item: card, bagUid: entry.uid });
    };

    // ── Incursión Max ───────────────────────────────────────────────────────
    //
    // La incursión NO trae motor propio: los cuatro combates son batallas
    // normales contra el mismo rival, encadenadas. Lo único que aporta este
    // bloque es (a) meter al atacante que toca sin pasar por la pantalla de
    // selección —el atacante puede no ser del host, así que no lo elige él— y
    // (b) anotar el total de cada combate en el marcador del backend.
    const raidRoundsDone = raid?.rounds?.length || 0;
    const raidOver = Boolean(raid && raid.result);

    // Quién participó de verdad: los dueños de los huecos que no son salvajes de
    // relleno, sin repetir (un jugador puede prestar dos Pokémon). El premio y
    // el castigo de la carta son para todos ellos, no solo para el host, así que
    // hay que poder decir sus nombres al cerrar.
    const raidParticipants = [...new Set(
        (raid?.team || [])
            .filter(slot => slot && !slot.wild && slot.ownerName)
            .map(slot => slot.ownerName)
    )];

    // El jefe entra transformado. Con forma G-Max propia ya viene con su token y
    // sus ataques desde la DB; sin ella se dinamaxiza aquí, que es lo que
    // convierte sus ataques en Movimientos Max sin tocarle el nivel.
    const raidBossForBattle = () => {
        if (!raid?.boss) return null;
        return raid.bossMode === 'gmax' ? raid.boss : applyDynamax(raid.boss);
    };

    // Monta el combate número `index` (0-based) sin pasar por SimBattleSelect.
    const startRaidRound = async (index) => {
        const slot = raid?.team?.[index];
        const boss = raidBossForBattle();
        if (!slot || !boss) return;
        resetBattleState();
        setShowSetup(false);
        // Sin esto la incursión no se ve en el espejo de /players: el resto de
        // eventos lo llaman y estos dos se quedaron fuera.
        //
        // Y hay que ESPERARLO: `startSimMirror` vacía los Pokémon del combate y
        // vuelve la fase a PokemonSelection en el servidor. Aquí los dos
        // Pokémon se eligen solos justo después, así que si no se espera, el
        // espejo llega tarde y borra la selección que acaba de mandarse.
        if (isMyTurn) await onStartSimMirror(playerId);
        await handleSelectMyPokemon(slot.pokemon);
        await handleSelectRivalPokemon(boss, slot.pokemon);
    };

    const handleRaidBoss = async (pokedex) => {
        setRaidLoading(true);
        setRaidError(null);
        const res = await onRaidStart(player.id, pokedex);
        setRaidLoading(false);
        if (!res?.ok) setRaidError(res?.message || 'No se pudo montar al jefe');
    };

    const handleRaidTeam = async (slots) => {
        setRaidLoading(true);
        setRaidError(null);
        const res = await onRaidTeam(player.id, slots);
        setRaidLoading(false);
        if (!res?.raid) {
            setRaidError(res?.message || 'No se pudo montar el equipo');
            return;
        }
        setRaidSetupOpen(false);
        // El estado de `raid` que hay en esta pasada todavía no trae el equipo
        // (llega por socket), así que el primer combate se monta con lo que
        // acaba de responder el servidor.
        const slot = res.raid.team[0];
        const boss = res.raid.bossMode === 'gmax' ? res.raid.boss : applyDynamax(res.raid.boss);
        resetBattleState();
        setShowSetup(false);
        // Esperado a propósito, igual que en startRaidRound: si no, borra la
        // selección de Pokémon que se manda justo detrás.
        if (isMyTurn) await onStartSimMirror(playerId);
        await handleSelectMyPokemon(slot.pokemon);
        await handleSelectRivalPokemon(boss, slot.pokemon);
    };

    // Cierra el combate en curso: anota los dos totales y encadena.
    const handleRaidNext = async () => {
        setRaidRoundHidden(true);
        const res = await onRaidRound(player.id, myTotal, rivalTotal);
        const done = res?.raid?.rounds?.length || 0;
        if (done >= (res?.raid?.team?.length || 4)) {
            // Cerrados los cuatro, falta el D4 del jefe. La batalla se recoge ya
            // para que el dado se pida sobre la pantalla limpia.
            resetBattleState();
            setShowSetup(true);
            setRaidDiePick(true);
            return;
        }
        await startRaidRound(done);
    };

    // Cerrar la incursión libera el rival y borra el marcador.
    const handleRaidDie = async (value) => {
        setRaidDiePick(false);
        await onRaidFinish(player.id, value);
        setRaidResultOpen(true);
    };

    const handleRaidClose = async () => {
        setRaidResultOpen(false);
        setRaidDiePick(false);
        setRaidRoundHidden(false);
        await onRaidClear(player.id);
        resetBattleState();
        setShowSetup(true);
    };

    // ── Horda ───────────────────────────────────────────────────────────────
    //
    // Se monta igual que la incursión —combates encadenados contra el mismo
    // rival, montados aquí para no pasar por la pantalla de selección— pero por
    // dentro cada uno es una batalla salvaje corriente: sube de nivel, se
    // debilita y suena todo lo de siempre. Lo único que cambia es la cuenta
    // (victorias, no totales) y que la captura va una vez al final.
    const hordeRoundsDone = horde?.rounds?.length || 0;
    const hordeTotalRounds = horde?.team?.length || 0;
    // El empate cuenta como victoria del jugador, como en la incursión
    const hordeWins = horde?.rounds?.filter(r => r.win).length || 0;
    const hordeRoundWon = (mine, theirs) => mine >= theirs;
    const hordeOver = Boolean(horde && horde.result);

    const startHordeRound = async (index, from = horde) => {
        const slot = from?.team?.[index];
        const wild = from?.wild;
        if (!slot || !wild) return;
        resetBattleState();
        setShowSetup(false);
        // Mismo caso que la incursión: sin esto la horda no llega al espejo, y
        // hay que esperarlo para no pisar la selección de Pokémon de abajo.
        if (isMyTurn) await onStartSimMirror(playerId);
        await handleSelectMyPokemon(slot.pokemon);
        await handleSelectRivalPokemon(wild, slot.pokemon);
    };

    const handleHordeWild = async (pokedex) => {
        setHordeLoading(true);
        setHordeError(null);
        const res = await onHordeStart(player.id, pokedex);
        setHordeLoading(false);
        if (!res?.ok) setHordeError(res?.message || 'No se pudo montar el salvaje');
    };

    const handleHordeOrder = async (slots) => {
        setHordeLoading(true);
        setHordeError(null);
        const res = await onHordeTeam(player.id, slots);
        setHordeLoading(false);
        if (!res?.horde) {
            setHordeError(res?.message || 'No se pudo montar el orden de combate');
            return;
        }
        setHordeSetupOpen(false);
        // Igual que en la incursión: el `horde` de esta pasada todavía no trae el
        // equipo (llega por socket), así que el primer combate se monta con lo
        // que acaba de responder el servidor.
        await startHordeRound(0, res.horde);
    };

    // Cierra el combate en curso: anota quién ganó y encadena el siguiente.
    const handleHordeNext = async () => {
        setHordeRoundHidden(true);
        const res = await onHordeRound(player.id, myTotal, rivalTotal);
        const done = res?.horde?.rounds?.length || 0;
        if (done >= (res?.horde?.team?.length || 0)) {
            // Peleó el equipo entero: toca la tirada de captura, que se hace en
            // la mesa. La batalla se recoge para pedirla sobre pantalla limpia.
            resetBattleState();
            setShowSetup(true);
            setHordeResultOpen(true);
            return;
        }
        await startHordeRound(done, res.horde);
    };

    // La tirada se hace con dados físicos: la tablet solo registra si cayó.
    const handleHordeCatch = async (caught) => {
        await onHordeFinish(player.id, caught);
        if (caught) await handleAddToTeam(horde?.wild?.pokedex);
        setHordeResultOpen(false);
        await handleHordeClose();
    };

    const handleHordeClose = async () => {
        setHordeResultOpen(false);
        setHordeRoundHidden(false);
        await onHordeClear(player.id);
        resetBattleState();
        setShowSetup(true);
    };

    // ── Combate de entrenador ───────────────────────────────────────────────
    //
    // El más ligero de los tres eventos encadenados: no hay equipo que montar ni
    // orden que decidir. Se monta el rival y se pasa por la pantalla de
    // selección de siempre; al cerrar el combate, el backend pone al segundo
    // rival en el sitio del primero (si lo hay) y se vuelve a elegir.
    const trainerRoundsDone = trainerBattle?.rounds?.length || 0;
    const trainerCount = trainerBattle?.count || 0;
    const trainerWins = trainerBattle?.rounds?.filter(r => r.win).length || 0;

    const handleTrainerStart = async (pokedexes) => {
        setTrainerLoading(true);
        setTrainerError(null);
        const res = await onTrainerStart(player.id, pokedexes);
        setTrainerLoading(false);
        if (!res?.ok) {
            setTrainerError(res?.message || 'No se pudieron montar los rivales');
            return;
        }
        setTrainerSetupOpen(false);
        resetBattleState();
        setShowSetup(false);
        if (isMyTurn) onStartSimMirror(playerId);
    };

    const handleTrainerNext = async () => {
        setTrainerRoundHidden(true);
        const res = await onTrainerRound(player.id, myTotal, rivalTotal);
        const tb = res?.trainerBattle;
        if (!tb || tb.result) {
            // Se acabó: la pantalla se recoge para enseñar el premio limpio
            resetBattleState();
            setShowSetup(true);
            setTrainerResultOpen(true);
            return;
        }
        // Queda otro rival, y el backend ya lo puso en el hueco: se vuelve a la
        // pantalla de selección para elegir con quién se le planta cara.
        resetBattleState();
        setShowSetup(false);
        if (isMyTurn) onStartSimMirror(playerId);
    };

    const handleTrainerClose = async () => {
        setTrainerResultOpen(false);
        setTrainerRoundHidden(false);
        await onTrainerClear(player.id);
        resetBattleState();
        setShowSetup(true);
    };

    // ── Reto de frontera ────────────────────────────────────────────────────
    //
    // El más corto de los eventos de combate: un solo combate contra un salvaje
    // del color de la frontera. No hay pantalla de montaje porque no hay nada
    // que montar — el rival lo sortea el backend a partir de la frontera— así
    // que se lanza desde el propio modal de fronteras y cae directo en la
    // pantalla de selección de siempre.
    //
    // El backend marca la casilla al lanzar y paga las PokéMonedas al cerrar; la
    // recompensa impresa de la frontera es física y aquí solo se enuncia.
    const frontierCard = frontierBattle ? getFrontier(frontierBattle.frontierKey) : null;

    const handleFrontierChallenge = async (frontierKey) => {
        setFrontierLoading(true);
        setFrontierError(null);
        // Los eventos de combate se pelean el mismo hueco de rival: montar el
        // reto cierra el que hubiera, igual que hace cada uno de los otros.
        if (raid) await onRaidClear(player.id);
        if (horde) await onHordeClear(player.id);
        if (trainerBattle) await onTrainerClear(player.id);
        const res = await onFrontierStart(player.id, frontierKey);
        setFrontierLoading(false);
        if (!res?.ok) {
            setFrontierError(res?.message || 'No se pudo montar el reto de frontera');
            return;
        }
        setShowFrontierModal(false);
        setFrontierRoundHidden(false);
        resetBattleState();
        setShowSetup(false);
        if (isMyTurn) onStartSimMirror(playerId);
    };

    const handleFrontierFinish = async () => {
        setFrontierRoundHidden(true);
        const res = await onFrontierFinish(player.id, myTotal, rivalTotal);
        // Se acabó en un solo combate: la pantalla se recoge para enseñar el
        // premio limpio, igual que en el combate de entrenador.
        resetBattleState();
        setShowSetup(true);
        if (res?.frontierBattle?.result) {
            setFrontierResultOpen(true);
            return;
        }
        // El servidor no pudo cerrar el reto. El premio lo paga él, así que sin
        // su respuesta no hay resultado que enseñar: se libera el evento para no
        // dejarlo colgado y el aviso espera en el modal de fronteras.
        setFrontierError(res?.message || 'No se pudo cerrar el reto de frontera');
        await onFrontierClear(player.id);
    };

    const handleFrontierClose = async () => {
        setFrontierResultOpen(false);
        setFrontierRoundHidden(false);
        await onFrontierClear(player.id);
        resetBattleState();
        setShowSetup(true);
    };

    // ── Poké Star Studios ───────────────────────────────────────────────────
    //
    // El más ligero de todos: monta al Prop y suelta al jugador en la pantalla
    // de selección de siempre. El nivel del Prop se iguala ahí, al elegir
    // combatiente (ver handleSelectMyPokemon), que es cuando se sabe con quién
    // se rueda de verdad. A partir de ahí, batalla salvaje normal. El final se calcula al cerrar
    // los dados —ganar y con qué— y las PokéMonedas se cobran o se pagan aquí,
    // que es lo único del premio que no es una carta física.
    const handlePokeStarStart = async (pokedex) => {
        setPokeStarLoading(true);
        setPokeStarError(null);
        const res = await onPokeStarStart(player.id, pokedex);
        setPokeStarLoading(false);
        if (!res?.ok) {
            setPokeStarError(res?.message || 'No se pudo montar el rodaje');
            return;
        }
        setPokeStarOpen(false);
        setPokeStarDone(false);
        resetBattleState();
        setShowSetup(false);
        if (isMyTurn) onStartSimMirror(playerId);
    };

    // El bono del ataque que se usó es justo lo que dice si fue supereficaz: el
    // motor suma +1 por cada ventaja de tipo.
    const pokeStarOutcome = pokeStarEnding(myTotal, rivalTotal, myBonus);

    const addCoins = async (delta) => {
        if (!delta) return;
        try {
            await fetch(`${SERVER_IP}/update-coins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, coins: Math.max(0, (player.coins || 0) + delta) }),
            });
        } catch (e) {
            console.error('Error al ajustar las monedas:', e);
        }
    };

    const handlePokeStarClose = async (coins = 0) => {
        await addCoins(coins);
        setPokeStarDone(false);
        await onPokeStarClear(player.id);
        resetBattleState();
        setShowSetup(true);
    };

    // Qué especie se mete al equipo al capturar. Contra un salvaje normal es él
    // mismo; contra una mega (evento Combate Mega) es su forma BASE, que el
    // backend deja sellada en `basePokedex`: una mega suelta en el equipo no
    // tendría de dónde revertir ni a qué subir de nivel.
    const capturablePokedex = (pkm) => pkm?.basePokedex || pkm?.pokedex;

    // ── Combate Mega ────────────────────────────────────────────────────────
    // Solo monta el rival; a partir de ahí es una batalla salvaje corriente y el
    // flujo de siempre se encarga del resto.
    const handleMegaRoll = async () => {
        setMegaLoading(true);
        const res = await onRandomMega();
        setMegaLoading(false);
        return res;
    };

    const handleMegaSearch = async (pokedex) => {
        setMegaLoading(true);
        const res = await onMegaForms(pokedex);
        setMegaLoading(false);
        return res;
    };

    const handleMegaStart = async (megaPokedex) => {
        setMegaLoading(true);
        const res = await onSimMegaBattle(player.id, megaPokedex);
        setMegaLoading(false);
        if (!res?.ok) return;
        setMegaBattleOpen(false);
        setShowSetup(false);
        if (isMyTurn) onStartSimMirror(playerId);
    };

    // ── Grand Underground ───────────────────────────────────────────────────
    // El sorteo (color de token + tipo de caverna) lo resuelve el propio modal
    // contra /random-pokemon; aquí solo llega el elegido. A partir de montarlo
    // es una batalla salvaje corriente, igual que el Combate Mega.
    const handleUndergroundStart = async (pokedex) => {
        setUndergroundLoading(true);
        const res = await onUndergroundBattle(player.id, pokedex);
        setUndergroundLoading(false);
        if (!res?.ok) return;
        setUndergroundOpen(false);
        setShowSetup(false);
        if (isMyTurn) onStartSimMirror(playerId);
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

            {/* Funciones especiales de batalla (dado de tipos, metrónomo, clima).
                Abajo a la izquierda, junto a la guía de efectos: en el centro
                chocaba con Re-Match y Change Pokemon. */}
            {rival && !showSetup && !inSelection && (
                <div className="sim-special-fns-btn"
                     title="Funciones especiales"
                     onClick={() => setShowSpecialFns(true)}>
                    {/* Destello, no un dado: el dado solo representaría una de
                        las tres funciones del menú. Va en SVG por lo mismo que
                        las espadas de pelear — el emoji ✨ lo pinta cada
                        sistema a su manera y no sigue el color del botón. */}
                    <svg className="sim-special-fns-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M13.2 2.4 15 8.1a1.4 1.4 0 0 0 .9.9l5.7 1.8-5.7 1.8a1.4 1.4 0 0 0-.9.9l-1.8 5.7-1.8-5.7a1.4 1.4 0 0 0-.9-.9L4.8 10.8 10.5 9a1.4 1.4 0 0 0 .9-.9l1.8-5.7Z" />
                        <path d="M5.6 14.6 6.4 17l2.4.8-2.4.8-.8 2.4-.8-2.4L2.4 17.8l2.4-.8.8-2.4Z" />
                    </svg>
                    Especiales
                </div>
            )}

            <ModalSpecialAttacks show={showSpecialFns}
                                 onClose={() => setShowSpecialFns(false)}
                                 title="Funciones especiales"
                                 fieldMoves={game.fieldMoves || [null, null]}
                                 onSetFieldMove={onSetFieldMove} />


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
            <ModalTiendaSim show={showStore} onClose={() => setShowStore(false)} player={player} pendingRequest={pendingRequest} onRequestPurchase={handleRequestPurchase} discount={game.storeDiscount || null} />
            <ModalRulesGuide show={showRulesGuide} onClose={() => setShowRulesGuide(false)} />
            {/* Mapa de referencia: líderes por ciudad, orden de medallas y
                —solo donde hay tablero— ficha arrastrable y ruta mínima al
                siguiente gimnasio. El dado y los turnos siguen en MapPlayer.js. */}
            <ModalInteractiveMap
                show={showMap && MAP_GENERATIONS.includes(generation)}
                onClose={() => setShowMap(false)}
                generation={generation}
                player={player}
                onMovePlayer={(nodeId) => onMovePlayerMap?.(playerId, nodeId)}
                onToggleSurf={(value) => onToggleSurf?.(playerId, value)}
            />
            <ModalTMCatalog show={showTMCatalog} onClose={() => setShowTMCatalog(false)} />
            <ModalEvents
                show={showEvents}
                onClose={() => setShowEvents(false)}
                onPick={handleEventPick}
                disabled={EVENTS_TODO}
                usedEvents={eventsUsed}
                onOpenRules={(cardId) => setRaidRulesOpen(cardId)}
                bag={bag}
                onUseBagItem={handleUseBagItem}
            />
            <ModalRaidSetup
                show={raidSetupOpen}
                onClose={async () => { setRaidSetupOpen(false); setRaidError(null); if (raid) await onRaidClear(player.id); }}
                player={player}
                allPlayers={game.players || []}
                raid={raid}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                onPickBoss={handleRaidBoss}
                error={raidError}
                onOpenRules={() => setRaidRulesOpen('maxRaid')}
                onMirror={publishEventMirror}
                onConfirmTeam={handleRaidTeam}
                loading={raidLoading}
            />

            <ModalHordeSetup
                show={hordeSetupOpen}
                onClose={async () => { setHordeSetupOpen(false); setHordeError(null); if (horde) await onHordeClear(player.id); }}
                player={player}
                horde={horde}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                onPickWild={handleHordeWild}
                onConfirmOrder={handleHordeOrder}
                error={hordeError}
                onOpenRules={() => setRaidRulesOpen('horde')}
                onMirror={publishEventMirror}
                loading={hordeLoading}
            />

            <ModalPokeStar
                show={pokeStarOpen}
                onClose={() => { setPokeStarOpen(false); setPokeStarError(null); }}
                tokenImg={(pokedex) => getSafePkmImg(pokedex, generation)}
                onStart={handlePokeStarStart}
                error={pokeStarError}
                onOpenRules={() => setRaidRulesOpen('pokeStar')}
                onMirror={publishEventMirror}
                loading={pokeStarLoading}
            />

            {/* Fin del rodaje. Sale cuando se cierran los dos dados, detrás de
                los avisos de nivel: en Poké Star sí se sube. */}
            {pokeStarActive && myLocked && rivalLocked && !pokeStarDone
                && myPokemon && rivalPokemon
                && !showLevelUpPrompt && !showEvolveModal && (() => {
                const ending = POKESTAR_ENDINGS[pokeStarOutcome];
                return (
                    <div className="modal-backdrop raid-round-backdrop">
                        <div className={`raid-result-modal pokestar-result pokestar-result--${ending.id}`}>
                            <div className="raid-result-title">{ending.title}</div>

                            <div className="raid-round-score">
                                <div className="raid-round-side">
                                    <span className="raid-round-label">{displayName(myPokemon)}</span>
                                    <span className="raid-round-num">{myTotal}</span>
                                </div>
                                <i>vs</i>
                                <div className="raid-round-side">
                                    <span className="raid-round-label">{rivalPokemon?.name}</span>
                                    <span className="raid-round-num">{rivalTotal}</span>
                                </div>
                            </div>

                            <div className="pokestar-result-summary">
                                {ending.summary}
                                {pokeStarOutcome === 'good' && myAttack && (
                                    <em> Con {myAttack.name}.</em>
                                )}
                            </div>

                            <div className="pokestar-result-reward">{ending.reward}</div>

                            <div className="raid-round-note">
                                Los Pokémon que cayeron se reaniman: de este rodaje no se sale
                                debilitado.
                            </div>

                            <div className="raid-result-actions">
                                {ending.coins > 0 && (
                                    <button className="raid-setup-btn raid-setup-btn--main"
                                            onClick={() => handlePokeStarClose(ending.coins)}>
                                        Cobrar {ending.coins} PokéMonedas
                                    </button>
                                )}
                                {ending.coins < 0 && (
                                    <>
                                        <button className="raid-setup-btn raid-setup-btn--main"
                                                onClick={() => handlePokeStarClose(ending.coins)}>
                                            Pagar {Math.abs(ending.coins)} PokéMonedas
                                        </button>
                                        <button className="raid-setup-btn raid-setup-btn--ghost"
                                                onClick={() => handlePokeStarClose(0)}>
                                            Descarté un objeto
                                        </button>
                                    </>
                                )}
                                {ending.coins === 0 && (
                                    <button className="raid-setup-btn raid-setup-btn--main"
                                            onClick={() => handlePokeStarClose(0)}>
                                        Cerrar el rodaje
                                    </button>
                                )}
                                <button className="raid-setup-btn raid-setup-btn--ghost"
                                        onClick={() => setPokeStarDone(true)}>
                                    ← Volver al combate
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <ModalContest
                show={contestOpen}
                onClose={() => setContestOpen(false)}
                player={player}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                tokenImg={(pokedex) => getSafePkmImg(pokedex, generation)}
                onCatch={handleAddToTeam}
                onOpenRules={() => setRaidRulesOpen('contest')}
                onMirror={publishEventMirror}
            />

            <ModalTrainerBattle
                show={trainerSetupOpen}
                onClose={async () => { setTrainerSetupOpen(false); setTrainerError(null); if (trainerBattle) await onTrainerClear(player.id); }}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                onStart={handleTrainerStart}
                error={trainerError}
                onOpenRules={(cardId) => setRaidRulesOpen(cardId)}
                onMirror={publishEventMirror}
                loading={trainerLoading}
            />

            {/* Franja del combate de entrenador. Solo tiene sentido con dos
                rivales: con uno no hay nada que llevar la cuenta. */}
            {trainerBattle && !showSetup && !trainerBattle.result && trainerCount > 1 && (
                <div className="raid-strip horde-strip">
                    <div className="raid-strip-round">
                        Rival {Math.min(trainerRoundsDone + 1, trainerCount)} de {trainerCount}
                    </div>
                    <div className="raid-strip-dots">
                        {(trainerBattle.wilds || []).map((w, i) => {
                            const r = trainerBattle.rounds?.[i];
                            const mark = r ? (r.win ? 'is-win' : r.tie ? 'is-tie' : 'is-lose') : '';
                            return (
                                <span key={i}
                                      className={`raid-strip-dot ${i === trainerRoundsDone ? 'is-now' : ''} ${mark}`}
                                      title={w.name} />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cierre de combate del evento de entrenador */}
            {trainerBattle && !trainerBattle.result && myLocked && rivalLocked && !trainerRoundHidden
                && myPokemon && rivalPokemon
                && !showLevelUpPrompt && !showEvolveModal && !showReplaceModal && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className="raid-round-modal horde-round-modal">
                        <div className="raid-round-title">
                            {trainerCount > 1
                                ? `Rival ${trainerRoundsDone + 1} de ${trainerCount}`
                                : 'Combate terminado'}
                        </div>
                        <div className="raid-round-score">
                            <div className="raid-round-side">
                                <span className="raid-round-label">{displayName(myPokemon)}</span>
                                <span className="raid-round-num">{myTotal}</span>
                            </div>
                            <i>vs</i>
                            <div className="raid-round-side">
                                <span className="raid-round-label">{rivalPokemon?.name}</span>
                                <span className="raid-round-num">{rivalTotal}</span>
                            </div>
                        </div>
                        <div className={`horde-round-verdict ${myTotal > rivalTotal ? 'is-win' : myTotal === rivalTotal ? 'is-tie' : 'is-lose'}`}>
                            {myTotal > rivalTotal
                                ? '¡Ganaste el combate!'
                                : myTotal === rivalTotal
                                    ? 'Empate: no cuenta como victoria'
                                    : 'Perdiste el combate'}
                        </div>
                        <div className="raid-round-note">
                            {trainerCount > 1
                                ? 'Hay que ganar los dos combates para llevarse las 2 cartas de objeto.'
                                : 'Ganando el combate te llevas 1 carta de objeto.'}
                        </div>
                        <div className="raid-round-actions">
                            <button className="raid-setup-btn raid-setup-btn--ghost"
                                    onClick={() => setTrainerRoundHidden(true)}>
                                ← Volver al combate
                            </button>
                            <button className="raid-setup-btn raid-setup-btn--main" onClick={handleTrainerNext}>
                                {trainerRoundsDone + 1 >= trainerCount
                                    ? 'Ver el resultado'
                                    : 'Siguiente rival →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resultado del combate de entrenador: el premio son cartas del
                mazo físico, así que aquí solo se dice cuántas tocan. */}
            {trainerResultOpen && trainerBattle && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className={`raid-result-modal horde-result-modal raid-result-modal--${trainerBattle.result}`}>
                        <div className="raid-result-title">
                            {trainerBattle.result === 'win'
                                ? (trainerCount > 1 ? '¡Ganaste los dos combates!' : '¡Ganaste el combate!')
                                : 'Sin premio'}
                        </div>

                        <div className="raid-result-rows">
                            {trainerBattle.rounds.map((r, i) => (
                                <div className={`raid-result-row horde-result-row--${r.win ? 'win' : r.tie ? 'tie' : 'lose'}`} key={i}>
                                    <span className="raid-result-who">{r.rival}</span>
                                    <span className="raid-result-nums">
                                        {r.hostTotal} — {r.rivalTotal}
                                        <em>{r.win ? '✓' : r.tie ? '=' : '✗'}</em>
                                    </span>
                                </div>
                            ))}
                        </div>

                        {trainerBattle.result === 'win' ? (
                            <div className="horde-bonus trainer-prize">
                                <span className="horde-bonus-num">{trainerBattle.prize}</span>
                                <span className="horde-bonus-label">
                                    {trainerBattle.prize === 1 ? 'carta de objeto' : 'cartas de objeto'}<br />
                                    <em>sácalas del mazo</em>
                                </span>
                            </div>
                        ) : (
                            <div className="raid-round-note">
                                {trainerCount > 1
                                    ? `Ganaste ${trainerWins} de ${trainerCount}: las cartas de objeto solo caen ganando los dos.`
                                    : 'Las cartas de objeto solo caen ganando el combate.'}
                            </div>
                        )}

                        <div className="raid-result-actions">
                            <button className="raid-setup-btn raid-setup-btn--main" onClick={handleTrainerClose}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Franja del reto de frontera: con un solo combate no hay rondas
                que contar, pero sí conviene recordar de qué frontera se trata
                mientras se pelea. */}
            {frontierBattle && !showSetup && !frontierBattle.result && frontierCard && (
                <div className="raid-strip horde-strip frontier-strip"
                     style={{ '--fc': frontierCard.color }}>
                    <div className="raid-strip-round">
                        <span className="frontier-strip-dot" />
                        Frontera {frontierCard.label}
                    </div>
                    <div className="raid-strip-score">
                        <span className="raid-strip-host">+{FRONTIER_COINS}</span>
                        <i>si ganas</i>
                    </div>
                </div>
            )}

            {/* Cierre de combate del reto de frontera */}
            {frontierBattle && !frontierBattle.result && myLocked && rivalLocked && !frontierRoundHidden
                && myPokemon && rivalPokemon
                && !showLevelUpPrompt && !showEvolveModal && !showReplaceModal && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className="raid-round-modal horde-round-modal frontier-round-modal">
                        {/* Volver al combate es la marcha atrás (corregir un dado),
                            no una decisión: va de X en la esquina y no compite con
                            el botón del premio. */}
                        <button className="frontier-round-close"
                                title="Volver al combate"
                                onClick={() => setFrontierRoundHidden(true)}>✕</button>
                        <div className="raid-round-title">
                            {frontierCard ? `Frontera ${frontierCard.label}` : 'Reto de frontera'}
                        </div>
                        <div className="raid-round-score">
                            <div className="raid-round-side">
                                <span className="raid-round-label">{displayName(myPokemon)}</span>
                                <span className="raid-round-num">{myTotal}</span>
                            </div>
                            <i>vs</i>
                            <div className="raid-round-side">
                                <span className="raid-round-label">{rivalPokemon?.name}</span>
                                <span className="raid-round-num">{rivalTotal}</span>
                            </div>
                        </div>
                        <div className={`horde-round-verdict ${myTotal > rivalTotal ? 'is-win' : myTotal === rivalTotal ? 'is-tie' : 'is-lose'}`}>
                            {myTotal > rivalTotal
                                ? '¡Conquistaste la frontera!'
                                : myTotal === rivalTotal
                                    ? 'Empate: la frontera no se conquista'
                                    : 'Perdiste el reto'}
                        </div>
                        <div className="raid-round-note">
                            Ganando te llevas {FRONTIER_COINS} PokéMonedas más la recompensa de la frontera.
                        </div>
                        <div className="raid-round-actions">
                            <button className="raid-setup-btn raid-setup-btn--main" onClick={handleFrontierFinish}>
                                {myTotal > rivalTotal ? '🏆 Ver Recompensa' : 'Ver el resultado'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resultado del reto: las PokéMonedas ya las pagó el backend, así
                que aquí solo se enseñan junto a la recompensa de la carta, que
                sigue siendo física. */}
            {frontierResultOpen && frontierBattle && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className={`raid-result-modal horde-result-modal raid-result-modal--${frontierBattle.result === 'win' ? 'win' : 'lose'}`}>
                        <div className="raid-result-title">
                            {frontierBattle.result === 'win'
                                ? `¡Frontera ${frontierCard?.label || ''} conquistada!`
                                : 'Frontera no conquistada'}
                        </div>

                        <div className="raid-result-rows">
                            <div className={`raid-result-row horde-result-row--${frontierBattle.result === 'win' ? 'win' : frontierBattle.result === 'tie' ? 'tie' : 'lose'}`}>
                                <span className="raid-result-who">{frontierBattle.wild?.name}</span>
                                <span className="raid-result-nums">
                                    {frontierBattle.hostTotal} — {frontierBattle.rivalTotal}
                                    <em>{frontierBattle.result === 'win' ? '✓' : frontierBattle.result === 'tie' ? '=' : '✗'}</em>
                                </span>
                            </div>
                        </div>

                        {frontierBattle.result === 'win' ? (
                            <>
                                <div className="horde-bonus trainer-prize">
                                    <span className="horde-bonus-num">+{frontierBattle.coins}</span>
                                    <span className="horde-bonus-label">
                                        PokéMonedas<br />
                                        <em>ya están en tu cuenta</em>
                                    </span>
                                </div>
                                {frontierCard && (
                                    <div className="frontier-prize-card" style={{ '--fc': frontierCard.color }}>
                                        <div className="frontier-prize-card-title">
                                            Recompensa de la Frontera {frontierCard.label}
                                        </div>
                                        <div className="frontier-prize-card-desc">{frontierCard.reward}</div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="raid-round-note">
                                La frontera ya está gastada: se marca al lanzar el reto. Las
                                PokéMonedas y la recompensa solo caen ganando el combate.
                            </div>
                        )}

                        <div className="raid-result-actions">
                            <button className="raid-setup-btn raid-setup-btn--main" onClick={handleFrontierClose}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Marcador de la horda: las victorias son el bono de captura del
                final, así que conviene tenerlas a la vista todo el rato */}
            {horde && !showSetup && !hordeOver && hordeTotalRounds > 0 && (
                <div className="raid-strip horde-strip">
                    <div className="raid-strip-round">
                        Combate {Math.min(hordeRoundsDone + 1, hordeTotalRounds)} de {hordeTotalRounds}
                    </div>
                    <div className="raid-strip-score">
                        <span className="raid-strip-host">{hordeWins}</span>
                        <i>victorias</i>
                    </div>
                    <div className="raid-strip-dots">
                        {(horde.team || []).map((slot, i) => {
                            const r = horde.rounds?.[i];
                            const mark = r ? (r.win ? 'is-win' : 'is-lose') : '';
                            return (
                                <span key={i}
                                      className={`raid-strip-dot ${i < hordeRoundsDone ? 'is-done' : ''} ${i === hordeRoundsDone ? 'is-now' : ''} ${mark}`}
                                      title={slot.pokemon?.name} />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Cierre de combate de la horda. Espera a que no haya ningún otro
                aviso encima: en la horda sí se sube de nivel y sí se evoluciona,
                y esos prompts van antes que encadenar el siguiente combate. */}
            {horde && !horde.result && myLocked && rivalLocked && !hordeRoundHidden
                && myPokemon && rivalPokemon
                && !showLevelUpPrompt && !showEvolveModal && !showReplaceModal && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className="raid-round-modal horde-round-modal">
                        <div className="raid-round-title">
                            Combate {hordeRoundsDone + 1} de {hordeTotalRounds}
                        </div>
                        <div className="raid-round-score">
                            <div className="raid-round-side">
                                <span className="raid-round-label">{displayName(myPokemon)}</span>
                                <span className="raid-round-num">{myTotal}</span>
                            </div>
                            <i>vs</i>
                            <div className="raid-round-side">
                                <span className="raid-round-label">{horde?.wild?.name}</span>
                                <span className="raid-round-num">{rivalTotal}</span>
                            </div>
                        </div>
                        <div className={`horde-round-verdict ${hordeRoundWon(myTotal, rivalTotal) ? 'is-win' : 'is-lose'}`}>
                            {myTotal > rivalTotal
                                ? '¡Victoria! +1 al bono de captura'
                                : myTotal === rivalTotal
                                    ? 'Empate: cuenta como victoria, +1 al bono'
                                    : 'Derrota: no suma victoria'}
                        </div>
                        <div className="raid-round-note">
                            Llevas {hordeWins + (hordeRoundWon(myTotal, rivalTotal) ? 1 : 0)} de {hordeTotalRounds} victorias.
                        </div>
                        <div className="raid-round-actions">
                            <button className="raid-setup-btn raid-setup-btn--ghost"
                                    onClick={() => setHordeRoundHidden(true)}>
                                ← Volver al combate
                            </button>
                            <button className="raid-setup-btn raid-setup-btn--main" onClick={handleHordeNext}>
                                {hordeRoundsDone + 1 >= hordeTotalRounds
                                    ? 'Tirar la captura'
                                    : 'Siguiente combate →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Final de la horda: el detalle de los combates y la tirada de
                captura, que se hace en la mesa con +1 por victoria. */}
            {hordeResultOpen && horde && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className="raid-result-modal horde-result-modal">
                        <div className="raid-result-title">
                            La horda de {horde.wild?.name}
                        </div>

                        <div className="raid-result-rows">
                            {horde.rounds.map((r, i) => (
                                <div className={`raid-result-row horde-result-row--${r.win ? 'win' : 'lose'}`} key={i}>
                                    <span className="raid-result-who">{r.attacker}</span>
                                    <span className="raid-result-nums">
                                        {r.hostTotal} — {r.wildTotal}
                                        <em title={r.tie ? 'Empate: cuenta como victoria' : undefined}>
                                            {r.win ? (r.tie ? '=✓' : '✓') : '✗'}
                                        </em>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="horde-bonus">
                            <span className="horde-bonus-num">+{hordeWins}</span>
                            <span className="horde-bonus-label">
                                bono de captura<br />
                                <em>{hordeWins} {hordeWins === 1 ? 'victoria' : 'victorias'} de {hordeTotalRounds}</em>
                            </span>
                        </div>

                        <div className="raid-round-note">
                            Tira la captura con ese bono y marca cómo te fue.
                        </div>

                        <div className="raid-result-actions">
                            <button className="raid-setup-btn raid-setup-btn--main"
                                    onClick={() => handleHordeCatch(true)}>
                                ¡Capturado! ({horde.wild?.name})
                            </button>
                            <button className="raid-setup-btn raid-setup-btn--ghost"
                                    onClick={() => handleHordeCatch(false)}>
                                Se escapó
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Marcador de la incursión: acompaña a los cuatro combates para que
                nunca haya que recordar de memoria cómo va la suma */}
            {raid && !showSetup && !raidOver && (
                <div className="raid-strip">
                    <div className="raid-strip-round">
                        Combate {Math.min(raidRoundsDone + 1, raid.team?.length || 4)} de {raid.team?.length || 4}
                    </div>
                    <div className="raid-strip-score">
                        <span className="raid-strip-host">{raid.rounds.reduce((a, r) => a + r.hostTotal, 0)}</span>
                        <i>·</i>
                        <span className="raid-strip-boss">{raid.rounds.reduce((a, r) => a + r.bossTotal, 0)}</span>
                    </div>
                    <div className="raid-strip-dots">
                        {(raid.team || []).map((slot, i) => (
                            <span key={i}
                                  className={`raid-strip-dot ${i < raidRoundsDone ? 'is-done' : ''} ${i === raidRoundsDone ? 'is-now' : ''}`}
                                  title={slot.pokemon?.name} />
                        ))}
                    </div>
                </div>
            )}

            {/* Combate cerrado. No se anota hasta confirmar: se puede volver al
                combate a corregir un dado, y al volver a bloquearlo este resumen
                reaparece solo con el total nuevo. */}
            {raid && !raid.result && myLocked && rivalLocked && !raidRoundHidden && myPokemon && rivalPokemon && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className="raid-round-modal">
                        <div className="raid-round-title">
                            Combate {raidRoundsDone + 1} terminado
                        </div>
                        <div className="raid-round-score">
                            <div className="raid-round-side">
                                <span className="raid-round-label">{myPokemon.name}</span>
                                <span className="raid-round-num">{myTotal}</span>
                            </div>
                            <i>vs</i>
                            <div className="raid-round-side">
                                <span className="raid-round-label">{raid?.boss?.name}</span>
                                <span className="raid-round-num">{rivalTotal}</span>
                            </div>
                        </div>
                        <div className="raid-round-note">
                            En la incursión no se sube de nivel ni se debilita nadie:
                            los totales se suman al marcador.
                        </div>
                        <div className="raid-round-actions">
                            <button className="raid-setup-btn raid-setup-btn--ghost"
                                    onClick={() => setRaidRoundHidden(true)}>
                                ← Volver al combate
                            </button>
                            <button className="raid-setup-btn raid-setup-btn--main" onClick={handleRaidNext}>
                                {raidRoundsDone + 1 >= (raid?.team?.length || 4)
                                    ? 'Tirar el D4 del jefe'
                                    : 'Siguiente combate →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* El D4 del jefe lo tira el host en la mesa: aquí solo se registra.
                Se enseña cómo va la suma y qué hace falta, que es lo que se está
                mirando con el dado ya en la mano. */}
            {raidDiePick && raid && (() => {
                const hostSum = raid.rounds.reduce((a, r) => a + r.hostTotal, 0);
                const bossBase = raid.rounds.reduce((a, r) => a + r.bossTotal, 0);
                // El host gana los empates, así que aguanta hasta que el dado
                // IGUALE la diferencia: con margen 3 gana con 1, 2 o 3.
                const margin = hostSum - bossBase;
                return (
                    <div className="modal-backdrop raid-round-backdrop">
                        <div className="raid-round-modal">
                            <div className="raid-round-title">Dado del jefe</div>

                            <div className="raid-round-score">
                                <div className="raid-round-side">
                                    <span className="raid-round-label">Incursión</span>
                                    <span className="raid-round-num raid-round-num--host">{hostSum}</span>
                                </div>
                                <i>vs</i>
                                <div className="raid-round-side">
                                    <span className="raid-round-label">{raid.boss?.name}</span>
                                    <span className="raid-round-num">{bossBase}<em>+D4</em></span>
                                </div>
                            </div>

                            <div className={`raid-die-hint ${margin >= 4 ? 'is-win' : ''} ${margin <= 0 ? 'is-lose' : ''}`}>
                                {margin >= 4
                                    ? 'Ganas salga lo que salga.'
                                    : margin <= 0
                                        ? 'El jefe gana salga lo que salga.'
                                        : `Ganas si sale ${margin} o menos.`}
                            </div>

                            <div className="raid-round-note">
                                Tira tu D4 y marca lo que salió.
                            </div>

                            <div className="raid-die-row">
                                {[1, 2, 3, 4].map(n => (
                                    <button key={n}
                                            className={`raid-die ${n <= margin ? 'is-win' : 'is-lose'}`}
                                            title={n <= margin ? 'Con este resultado ganáis' : 'Con este resultado gana el jefe'}
                                            onClick={() => handleRaidDie(n)}>
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Resultado: las cuatro rondas, el D4 y el veredicto */}
            {raidResultOpen && raid?.result && (
                <div className="modal-backdrop raid-round-backdrop">
                    <div className={`raid-result-modal raid-result-modal--${raid.result}`}>
                        <div className="raid-result-title">
                            {raid.result === 'win' ? '¡Incursión superada!' : 'La incursión os venció'}
                        </div>

                        <div className="raid-result-rows">
                            {raid.rounds.map((r, i) => (
                                <div className="raid-result-row" key={i}>
                                    <span className="raid-result-who">
                                        {r.attacker}{r.ownerName ? ` · ${r.ownerName}` : ''}
                                    </span>
                                    <span className="raid-result-nums">{r.hostTotal} — {r.bossTotal}</span>
                                </div>
                            ))}
                            <div className="raid-result-row raid-result-row--die">
                                <span className="raid-result-who">D4 del jefe</span>
                                <span className="raid-result-nums">+{raid.die}</span>
                            </div>
                        </div>

                        <div className="raid-result-total">
                            <span className={raid.result === 'win' ? 'is-win' : ''}>{raid.hostSum}</span>
                            <i>vs</i>
                            <span className={raid.result === 'lose' ? 'is-win' : ''}>{raid.bossSum}</span>
                        </div>

                        {/* Premio y castigo de la carta. El +3 va ANTES del botón
                            de capturar a propósito: el tiro se hace en la mesa y
                            pulsar el botón es anotar que salió. Las cartas de
                            objeto y el −2 los aplican los jugadores a mano, así
                            que aquí solo se enuncian con los nombres delante para
                            que nadie se quede fuera del reparto. */}
                        {raid.result === 'win' ? (
                            <>
                                <div className="horde-bonus">
                                    <span className="horde-bonus-num">+3</span>
                                    <span className="horde-bonus-label">
                                        al tiro de captura<br />
                                        <em>de {raid.baseName}</em>
                                    </span>
                                </div>
                                <div className="raid-share">
                                    <span className="raid-share-line">
                                        Cada jugador que participó roba <b>1 carta de objeto</b>.
                                    </span>
                                    {raidParticipants.length > 0 && (
                                        <span className="raid-share-who">{raidParticipants.join(' · ')}</span>
                                    )}
                                </div>
                                <div className="raid-round-note">
                                    Tira la captura con el +3 antes de darle al botón.
                                </div>
                            </>
                        ) : (
                            <div className="raid-share raid-share--lose">
                                <span className="raid-share-line">
                                    Cada jugador que participó elige:
                                    descartar <b>1 carta de objeto</b> o <b>−2</b> en su próximo movimiento.
                                </span>
                                {raidParticipants.length > 0 && (
                                    <span className="raid-share-who">{raidParticipants.join(' · ')}</span>
                                )}
                            </div>
                        )}

                        <div className="raid-result-actions">
                            {raid.result === 'win' && (
                                <button className="raid-setup-btn raid-setup-btn--main"
                                        onClick={async () => { await handleAddToTeam(raid.basePokedex); await handleRaidClose(); }}>
                                    Capturar a {raid.baseName}
                                </button>
                            )}
                            <button className="raid-setup-btn raid-setup-btn--ghost" onClick={handleRaidClose}>
                                {raid.result === 'win' ? 'Se escapó' : 'Cerrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* La hoja de reglas se consulta desde el home —el menú de eventos y
                el montaje de la incursión—, nunca a media batalla. `raidRulesOpen`
                guarda QUÉ carta se abrió, para que sirva igual cuando haya más. */}
            {/* Una cosa a la vez. Mientras hay una guía abierta el concentrador
                se RETIRA en vez de quedarse debajo: apilar modales obliga a
                cuadrar z-index entre una docena de ellos y encima deja la guía
                asomando por detrás. Como `showHelp` sigue en true, al cerrar la
                guía el concentrador reaparece solo — su botón de cerrar hace de
                "volver a Ayuda" sin tener que tocar ninguna de las guías, que
                además conservan la pantalla entera (el catálogo de MTs son 291
                cartas con buscador: encajonarlo dentro de otro modal lo
                empeora). */}
            <ModalMegaBattle
                show={megaBattleOpen}
                onClose={() => setMegaBattleOpen(false)}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                onRoll={handleMegaRoll}
                onSearch={handleMegaSearch}
                onStart={handleMegaStart}
                loading={megaLoading}
                onOpenRules={() => setRaidRulesOpen('megaBattle')}
                onMirror={publishEventMirror}
            />

            <ModalUnderground
                show={undergroundOpen}
                onClose={() => setUndergroundOpen(false)}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                onStart={handleUndergroundStart}
                loading={undergroundLoading}
                onOpenRules={() => setRaidRulesOpen('underground')}
                onMirror={publishEventMirror}
            />

            <ModalHelp
                show={showHelp && !guideOpen}
                onClose={() => setShowHelp(false)}
                onOpen={(section) => {
                    if (section === 'leaders') return setShowLeaderViewer(true);
                    if (section === 'effects') return setShowRulesGuide(true);
                    if (section === 'tms')     return setShowTMCatalog(true);
                    setRaidRulesOpen(section);   // el resto son ids de hoja de reglas
                }}
            />

            <ModalRulesCard
                show={Boolean(raidRulesOpen)}
                onClose={() => setRaidRulesOpen(null)}
                cardId={raidRulesOpen === true ? 'maxRaid' : raidRulesOpen}
            />

            <ModalEventPick
                show={pickEvent !== null}
                onClose={() => setPickEvent(null)}
                kind={pickEvent?.kind}
                mode={pickEvent?.mode}
                options={pickEvent?.options || []}
                item={pickEvent?.item || null}
                pokemons={player?.pokemons || []}
                pokemonImg={(pkm) => getPokemonImg(pkm.pokedex) || getSafePkmImg(pkm.pokedex, generation)}
                onAttach={handleEventPickAttach}
                onSave={handleEventPickSave}
                onDiscard={() => setPickEvent(null)}
            />
            <ModalTMCard
                show={tmCardOpen !== null}
                onClose={() => setTmCardOpen(null)}
                attack={tmCardOpen?.attack}
                pokemonName={tmCardOpen?.pokemonName}
                esZ={tmCardOpen?.esZ}
            />
            <ModalItemCard
                show={itemCardOpen !== null}
                onClose={() => setItemCardOpen(null)}
                itemId={itemCardOpen?.itemId}
                pokemon={itemCardOpen?.pokemon}
                pokemonName={itemCardOpen?.pokemonName}
            />
            <ModalAttach
                show={attachPkmId !== null}
                onClose={() => setAttachPkmId(null)}
                currentPlayer={player}
                pokemonId={attachPkmId}
                onAttach={onAttach}
                attachTM={attachTM}
                attachMega={attachMega}
                attachTera={attachTera}
                attachEquip={attachEquip}
                attachLegendary={attachLegendary}
            />
            <ModalMote
                show={motePkmId !== null}
                onClose={() => setMotePkmId(null)}
                pokemon={player?.pokemons?.find(p => p.id === motePkmId)}
                onSave={(mote) => handleSetMote(motePkmId, mote)}
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
                                        {/* Megas y formas legendarias — separadas de evoluciones */}
                                        <SideForms forms={node.megas} kind="mega" generation={generation} />
                                        <SideForms forms={node.legendaries} kind="legend" generation={generation} />
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
                                                                <SideForms forms={branch.megas} kind="mega" generation={generation} />
                                                                <SideForms forms={branch.legendaries} kind="legend" generation={generation} />
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
                            {/* El icono va en SVG y no como carácter ⚔: el emoji lo
                                pinta cada sistema a su manera (y en iPad sale plano
                                y descentrado), el trazo se ve igual en todas. */}
                            <div className="sim-wild-modal-action">
                                <button className="sim-wild-modal-fight" onClick={handleConfirmWildPokemon} title="Pelear">
                                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M4 3h3l9.5 11.2-2.8 2.4L4 6.2V3Z" />
                                        <path d="M20 3h-3L7.5 14.2l2.8 2.4L20 6.2V3Z" />
                                        <path d="m14.6 16.4 2.2-1.9 3.3 3.9a1.6 1.6 0 0 1-2.4 2.1l-3.1-4.1Z" />
                                        <path d="m9.4 16.4-2.2-1.9-3.3 3.9a1.6 1.6 0 0 0 2.4 2.1l3.1-4.1Z" />
                                    </svg>
                                </button>
                                <span className="sim-wild-modal-action-label">Pelear</span>
                            </div>
                            <div className="sim-wild-modal-action">
                                <button className="sim-wild-modal-capture" onClick={handleCaptureDirect} title="Capturar" />
                                <span className="sim-wild-modal-action-label">Capturar</span>
                            </div>
                            {/* Huir por 1 moneda: fuera de turno ni se pinta */}
                            {isMyTurn && (
                                <div className="sim-wild-modal-action">
                                    <button className="sim-wild-modal-flee" onClick={handleWildFlee} title="Huir y cobrar $1">$1</button>
                                    <span className="sim-wild-modal-action-label">Huir · fin de turno</span>
                                </div>
                            )}
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
                                <div className="sim-hud-trainer-img" style={{ backgroundImage: `url(${getTrainerAvatar(player.name)})` }} />
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
                                        <img src={wildPreviewImg} alt={wildFoundId} className="sim-wild-preview-img" />
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
                            {/* Guía de líderes, efectos, MTs y reglas de eventos
                                viven todas dentro de Ayuda: la barra se estaba
                                llenando de botones de consulta y quitaba sitio a
                                los que de verdad se usan. */}
                            <div className="sim-setup-btn" onClick={() => setShowHelp(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-help">?</div>
                                <span>Ayuda</span>
                            </div>
                            <div className="sim-setup-btn" onClick={() => setShowEvents(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-events">✦</div>
                                <span>Eventos</span>
                            </div>
                            <div className={`sim-setup-btn ${pendingRequest ? 'sim-store-button--pending' : ''}`} onClick={() => setShowStore(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-store"></div>
                                <span>Tienda</span>
                            </div>
                            <div className="sim-setup-btn" onClick={() => setShowAllPlayers(true)}>
                                <div className="sim-setup-btn-icon sim-topbar-players"></div>
                                <span>Jugadores</span>
                            </div>
                            {/* Solo Kanto: es la única región con tablero
                                dibujado en Backend/saves/boardNodes/. En las
                                demás el mapa se quedaría en foto de líderes,
                                así que ni se ofrece. Al mapear Johto, añadir
                                su generación aquí. */}
                            {MAP_GENERATIONS.includes(generation) && (
                                <div className="sim-setup-btn" onClick={() => setShowMap(true)}>
                                    <div className="sim-setup-btn-icon sim-topbar-map">🗺</div>
                                    <span>Mapa</span>
                                </div>
                            )}
                            {/* En el setup la tabla de tipos vive aquí, no en el
                                botón flotante: arriba a la derecha tapaba el
                                diseño de la cabecera */}
                            <div className={`sim-setup-btn ${showTypeChart ? 'is-on' : ''}`}
                                 onClick={() => setShowTypeChart(v => !v)}>
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
                    onOpenTypeChart={() => setShowTypeChart(v => !v)}
                    onOpenRules={() => setShowRulesGuide(true)}
                    onNextTurn={handleNextTurn}
                />
            )}

            {/* Seleccion de ataques */}
            {!showSetup && rivalPokemonSelected === 'true' && myPokemonSelected === 'true' && (
                <div className="attack-select-sim" style={arenaStyle(rivalPokemon.pokedex, generation)}>
                    <div className='MyPokemon-main'>
                        {/* Teracristalizado o dinamaxizado: el token va envuelto
                            en un aura. En la mesa el sprite es el mismo que el
                            de siempre, así que el aura es lo único que avisa de
                            que ese Pokémon no sube en su forma normal. Las dos
                            son excluyentes, así que nunca coinciden. */}
                        <div className={`MyPokemon_img ${myPokemon.teraActive ? 'tera-img' : ''} ${myPokemon.dynamaxActive ? 'dyna-img' : ''} ${myLocked && rivalLocked ? (myTotal >= rivalTotal ? 'winner-img' : 'loser-img') : ''}`}
                             style={{
                                 backgroundImage: `url(${myPokemonImg})`,
                                 // El sprite viaja al CSS para poder recortar
                                 // las capas de luz a la SILUETA (mask-image) y
                                 // no a la caja del token.
                                 ...(myPokemon.teraActive ? {
                                     '--tera-type': typeColor(myPokemon.teraType),
                                     '--tera-sprite': `url(${myPokemonImg})`,
                                 } : {}),
                                 ...(myPokemon.dynamaxActive ? {
                                     '--dyna-sprite': `url(${myPokemonImg})`,
                                 } : {}),
                             }}></div>
                        <div className='MyPokemon_name'>
                            <PokemonName pkm={myPokemon} />
                            {myPokemon.dynamaxActive && <span className="dyna-chip">Dynamax</span>}
                            <TMBadge pokemon={myPokemon} onOpen={setTmCardOpen} />
                            <ItemBadge pokemon={myPokemon} onOpen={setItemCardOpen} />
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
                        <div className={`RivalPokemon_img ${rivalPokemon.teraActive ? 'tera-img' : ''} ${rivalPokemon.dynamaxActive ? 'dyna-img' : ''} ${myLocked && rivalLocked ? (rivalTotal >= myTotal ? 'winner-img' : 'loser-img') : ''}`}
                             style={{
                                 backgroundImage: `url(${rivalPokemonImg})`,
                                 ...(rivalPokemon.teraActive ? {
                                     '--tera-type': typeColor(rivalPokemon.teraType),
                                     '--tera-sprite': `url(${rivalPokemonImg})`,
                                 } : {}),
                                 ...(rivalPokemon.dynamaxActive ? {
                                     '--dyna-sprite': `url(${rivalPokemonImg})`,
                                 } : {}),
                             }}></div>
                        <div className='RivalPokemon_name'>
                            <PokemonName pkm={rivalPokemon} />
                            {rivalPokemon.dynamaxActive && <span className="dyna-chip">Dynamax</span>}
                            <TMBadge pokemon={rivalPokemon} onOpen={setTmCardOpen} />
                            <ItemBadge pokemon={rivalPokemon} onOpen={setItemCardOpen} />
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
                                {/* Los dados ya elegidos, en tira de solo lectura:
                                    el selector oculta su fila al elegir, así que
                                    sin esto el dado que salió no se ve en ningún
                                    sitio. Va fuera de .MyDices —que vive arriba,
                                    pegada al borde— para caer en el hueco entre
                                    el Pokémon y la tabla de totales. */}
                                {calcDiceSum(myDiceRows) > 0 && (
                                    <div className='dice-chosen dice-chosen--mine' title='Dados elegidos'>
                                        {myDiceRows.map((val, i) => val === null ? null : (
                                            <div key={i} className={`dice-chosen-die mydice${val}`} />
                                        ))}
                                    </div>
                                )}
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
                                {calcDiceSum(rivalDiceRows) > 0 && (
                                    <div className='dice-chosen dice-chosen--rival' title='Dados elegidos'>
                                        {rivalDiceRows.map((val, i) => val === null ? null : (
                                            <div key={i} className={`dice-chosen-die mydice${val}`} />
                                        ))}
                                    </div>
                                )}
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
                            <button className="levelup-btn-yes" onClick={() => { setShowCapturePrompt(false); handleAddToTeam(capturablePokedex(rivalPokemon)); }}>Sí</button>
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
                                        <PokemonName pkm={pkm} as="div" className="sim-replace-pkm-name" />
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
                            {displayName(myPokemon)} derrotó a {displayName(rivalPokemon)} (Lv. {rivalPokemon?.totalLevel}).
                            <br />¿Subir de nivel?
                        </div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={() => { setShowLevelUpPrompt(false); onIncreaseLevel(player.id, resolveBasePokemonId(myPokemon), { rivalName: rival?.name, rivalPokemonName: rivalPokemon?.name, source: 'sim-battle' }); if (pendingBadge) { setPendingBadge(false); setShowBadgePrompt(true); } }}>Sí</button>
                            <button className="levelup-btn-no" onClick={() => { setShowLevelUpPrompt(false); if (rival?.name === 'Wild Pokemon' && !noCaptureEvent) setShowCapturePrompt(true); }}>No</button>
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
                                <PlayerListed key={p.id} player={p} generation={generation} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <ModalFrontier
                show={showFrontierModal}
                onClose={() => { setShowFrontierModal(false); setFrontierError(null); }}
                player={player}
                onToggle={handleToggleFrontier}
                onChallenge={handleFrontierChallenge}
                busy={frontierLoading}
                error={frontierError}
            />

            {/* Tabla de tipos flotante: solo durante la batalla, que es donde no
                hay barra de herramientas. En el setup el acceso está en esa
                barra, junto a Jugadores, para no tapar la cabecera.
                El icono son 4 tipos reales del juego, para que se lea de golpe.
                La selección de combatientes lo lleva en su barra superior. */}
            {!showingSetup && !inSelection && (
                <div className={`type-chart-fab ${showTypeChart ? 'is-on' : ''}`}
                     title={showTypeChart ? 'Cerrar la tabla de tipos' : 'Tabla de tipos'}
                     onClick={() => setShowTypeChart(v => !v)}>
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
