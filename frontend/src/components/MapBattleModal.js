import { useState, useEffect } from 'react';
import PokemonBattleListed from './PokemonBattleListed';
import Attack from './Attacks';
import Types from './Types';
import PokemonName from './PokemonName';
import { displayName } from '../moteName';
import SERVER_IP from '../config.js';
import { MAX_EXTRA_LEVEL } from '../battleRules';

// ─── Efectividad de tipo ──────────────────────────────────────────────────────
const TYPE_TABLE = {
    FIRE:     { sup: ['GRASS','ICE','BUG','STEEL'],               inf: ['FIRE','WATER','ROCK','DRAGON'] },
    WATER:    { sup: ['FIRE','GROUND','ROCK'],                    inf: ['WATER','GRASS','DRAGON'] },
    GRASS:    { sup: ['WATER','GROUND','ROCK'],                   inf: ['FIRE','GRASS','POISON','FLYING','BUG','DRAGON','STEEL'] },
    ELECTRIC: { sup: ['WATER','FLYING'],                          inf: ['ELECTRIC','GRASS','DRAGON'],                          zero: ['GROUND'] },
    ICE:      { sup: ['GRASS','GROUND','FLYING','DRAGON'],        inf: ['FIRE','WATER','ICE','STEEL'] },
    NORMAL:   {                                                    inf: ['ROCK','STEEL'],                                       zero: ['GHOST'] },
    FIGHTING: { sup: ['NORMAL','ICE','ROCK','STEEL','DARK'],      inf: ['POISON','BUG','PSYCHIC','FLYING','FAIRY'],             zero: ['GHOST'] },
    POISON:   { sup: ['GRASS','FAIRY'],                           inf: ['POISON','GROUND','ROCK','GHOST','STEEL'] },
    GROUND:   { sup: ['FIRE','ELECTRIC','POISON','ROCK','STEEL'], inf: ['GRASS','BUG'],                                        zero: ['FLYING'] },
    FLYING:   { sup: ['GRASS','FIGHTING','BUG'],                  inf: ['ELECTRIC','ROCK','STEEL'] },
    PSYCHIC:  { sup: ['FIGHTING','POISON'],                       inf: ['PSYCHIC','STEEL','DARK'],                             zero: ['DARK'] },
    BUG:      { sup: ['GRASS','PSYCHIC','DARK'],                  inf: ['FIRE','FIGHTING','FLYING','GHOST','STEEL','FAIRY'] },
    ROCK:     { sup: ['FIRE','ICE','FLYING','BUG'],               inf: ['FIGHTING','GROUND','STEEL'] },
    GHOST:    { sup: ['GHOST','PSYCHIC'],                         inf: ['DARK'],                                               zero: ['NORMAL'] },
    DRAGON:   { sup: ['DRAGON'],                                  inf: ['STEEL'],                                              zero: ['FAIRY'] },
    DARK:     { sup: ['GHOST','PSYCHIC'],                         inf: ['FIGHTING','DARK','FAIRY'] },
    STEEL:    { sup: ['ICE','ROCK','FAIRY'],                      inf: ['FIRE','WATER','ELECTRIC','STEEL'] },
    FAIRY:    { sup: ['FIGHTING','DRAGON','DARK'],                inf: ['FIRE','POISON','STEEL'] },
};

function bonusForAttack(atkType, defType) {
    if (!atkType || !defType) return 0;
    const entry = TYPE_TABLE[atkType.toUpperCase()];
    if (!entry) return 0;
    const d = defType.toUpperCase();
    if (entry.zero?.includes(d)) return -2;
    if (entry.sup?.includes(d))  return 2;
    if (entry.inf?.includes(d))  return -2;
    return 0;
}

function calcAttkBonus(atk, rival) {
    const b1 = bonusForAttack(atk.type, rival.type1);
    const b2 = rival.type2 && rival.type2 !== 'NONE' ? bonusForAttack(atk.type, rival.type2) : 0;
    return Math.max(b1 + b2, -2);
}

const calcDiceSum = (rows) => rows.reduce((a, v) => a + (v || 0), 0);

const getPkmImg = (pokedex) => {
    try { return require(`../images/tokens_ultimix/${pokedex}.png`); } catch { return null; }
};

// ─── Componente ──────────────────────────────────────────────────────────────
const MapBattleModal = ({ open, onClose, player, generation, nodeId, onResolved, badgeNum }) => {
    const isLeaderBattle = player?.simRival?.id?.startsWith('SimLeader-') ?? false;

    // Fases: loading | pokemon | attack-my | attack-rival | dice | wild-wins | levelup | capture | replace
    const [phase,      setPhase]      = useState('loading');
    const [myPkm,      setMyPkm]      = useState(null);
    const [rivPkm,     setRivPkm]     = useState(null);

    const [myAtk,      setMyAtk]      = useState(null);
    const [rivAtk,     setRivAtk]     = useState(null);

    const [myBonusArr,  setMyBonusArr]  = useState([0,0,0]);
    const [rivBonusArr, setRivBonusArr] = useState([0,0,0]);

    const [myAtkPow,    setMyAtkPow]    = useState(0);
    const [rivAtkPow,   setRivAtkPow]   = useState(0);
    const [myBonusFin,  setMyBonusFin]  = useState(0);
    const [rivBonusFin, setRivBonusFin] = useState(0);
    const [myTotal,     setMyTotal]     = useState(0);
    const [rivTotal,    setRivTotal]    = useState(0);

    const [myDiceRows,  setMyDiceRows]  = useState([null]);
    const [rivDiceRows, setRivDiceRows] = useState([null]);
    const [myLocked,    setMyLocked]    = useState(false);
    const [rivLocked,   setRivLocked]   = useState(false);
    const [myDiceAnim,  setMyDiceAnim]  = useState(null);
    const [rivDiceAnim, setRivDiceAnim] = useState(null);

    const [myStatus,    setMyStatus]    = useState('Normal');
    const [rivStatus,   setRivStatus]   = useState('Normal');

    const [pendingCapture,  setPendingCapture]  = useState(null);
    const [rivalPkmIdx,    setRivalPkmIdx]    = useState(0);
    const [hasLostPokemon, setHasLostPokemon] = useState(false);

    // ── Reset cuando se abre ─────────────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setPhase('loading');
        setMyPkm(null); setRivPkm(null);
        setMyAtk(null); setRivAtk(null);
        setMyBonusArr([0,0,0]); setRivBonusArr([0,0,0]);
        setMyAtkPow(0); setRivAtkPow(0);
        setMyBonusFin(0); setRivBonusFin(0);
        setMyTotal(0); setRivTotal(0);
        setMyDiceRows([null]); setRivDiceRows([null]);
        setMyLocked(false); setRivLocked(false);
        setMyDiceAnim(null); setRivDiceAnim(null);
        setMyStatus('Normal'); setRivStatus('Normal');
        setPendingCapture(null);
        setRivalPkmIdx(0);
        setHasLostPokemon(false);
    }, [open]);

    // ── Pasar a selección cuando simRival esté listo (wild o líder) ──────────
    useEffect(() => {
        if (!open) return;
        const sr = player?.simRival;
        if (!sr?.pokemons?.length) return;
        if (sr.name === 'Wild Pokemon' || sr.id?.startsWith('SimLeader-')) {
            setPhase(prev => prev === 'loading' ? 'pokemon' : prev);
        }
    }, [open, player?.simRival]); // eslint-disable-line

    if (!open) return null;

    // ── Selección: mi Pokémon → rival auto-selecciona ────────────────────────
    const handleSelectMyPokemon = (pkm) => {
        // Para líder en round 2, rivalPkmIdx ya es 1 — no resetearlo
        const rivPkmStart = player?.simRival?.pokemons?.[rivalPkmIdx] ?? player?.simRival?.pokemons?.[0];
        if (!rivPkmStart) return;
        setMyPkm(pkm);
        setRivPkm(rivPkmStart);
        const myB = [
            calcAttkBonus(pkm.attack1, rivPkmStart),
            pkm.attack2?.name !== 'NONE' ? calcAttkBonus(pkm.attack2, rivPkmStart) : 0,
            pkm.attack3?.name !== 'NONE' ? calcAttkBonus(pkm.attack3, rivPkmStart) : 0,
        ];
        const rivB = [
            calcAttkBonus(rivPkmStart.attack1, pkm),
            rivPkmStart.attack2?.name !== 'NONE' ? calcAttkBonus(rivPkmStart.attack2, pkm) : 0,
            rivPkmStart.attack3?.name !== 'NONE' ? calcAttkBonus(rivPkmStart.attack3, pkm) : 0,
        ];
        setMyBonusArr(myB);
        setRivBonusArr(rivB);
        setPhase('attack-my');
    };

    const handleSelectMyAttack = (atk, bonus) => {
        setMyAtk(atk);
        setMyAtkPow(atk.strength);
        setMyBonusFin(bonus);
        setMyTotal(atk.strength + bonus + myPkm.totalLevel);
        setPhase('attack-rival');
    };

    const handleSelectRivAttack = (atk, bonus) => {
        setRivAtk(atk);
        setRivAtkPow(atk.strength);
        setRivBonusFin(bonus);
        setRivTotal(atk.strength + bonus + rivPkm.totalLevel);
        setPhase('dice');
    };

    // ── Dados ────────────────────────────────────────────────────────────────
    const handleMyDice = (rowIdx, val) => {
        if (myLocked) return;
        setMyDiceAnim(val);
        const rows = [...myDiceRows]; rows[rowIdx] = val;
        setMyDiceRows(rows);
        const d = calcDiceSum(rows);
        setMyTotal(myPkm.totalLevel + myAtkPow + myBonusFin + d);
        if (rowIdx === rows.length - 1) setMyLocked(true);
    };
    const handleRivDice = (rowIdx, val) => {
        if (rivLocked) return;
        setRivDiceAnim(val);
        const rows = [...rivDiceRows]; rows[rowIdx] = val;
        setRivDiceRows(rows);
        const d = calcDiceSum(rows);
        setRivTotal(rivPkm.totalLevel + rivAtkPow + rivBonusFin + d);
        if (rowIdx === rows.length - 1) setRivLocked(true);
    };

    const handleUnlockMyDice = () => {
        const rows = [...myDiceRows]; rows[rows.length - 1] = null;
        setMyDiceRows(rows); setMyLocked(false);
        setMyTotal(myPkm.totalLevel + myAtkPow + myBonusFin + calcDiceSum(rows));
    };
    const handleUnlockRivDice = () => {
        const rows = [...rivDiceRows]; rows[rows.length - 1] = null;
        setRivDiceRows(rows); setRivLocked(false);
        setRivTotal(rivPkm.totalLevel + rivAtkPow + rivBonusFin + calcDiceSum(rows));
    };

    const allDiceDone = myLocked && rivLocked;

    // ── Status ───────────────────────────────────────────────────────────────
    const applyMyStatus = (s) => {
        setMyStatus(s);
        const pow = (s === 'Asleep' || s === 'Paralized' || s === 'Frozen') ? 0 : (s === 'Burned' ? myAtk.strength - 1 : myAtk.strength);
        const bon = (s === 'Asleep' || s === 'Paralized' || s === 'Frozen') ? 0 : myBonusFin;
        setMyAtkPow(pow); setMyBonusFin(bon);
        setMyTotal(myPkm.totalLevel + pow + bon + calcDiceSum(myDiceRows));
    };
    const applyRivStatus = (s) => {
        setRivStatus(s);
        const pow = (s === 'Asleep' || s === 'Paralized' || s === 'Frozen') ? 0 : (s === 'Burned' ? rivAtk.strength - 1 : rivAtk.strength);
        const bon = (s === 'Asleep' || s === 'Paralized' || s === 'Frozen') ? 0 : rivBonusFin;
        setRivAtkPow(pow); setRivBonusFin(bon);
        setRivTotal(rivPkm.totalLevel + pow + bon + calcDiceSum(rivDiceRows));
    };

    const scMy  = (s) => `status_battle ${s}${myStatus  === s ? ' statusActive' : ''}`;
    const scRiv = (s) => `status_battle rotate-x ${s}${rivStatus === s ? ' statusActive' : ''}`;

    // ── Avanzar al siguiente Pokémon del líder ────────────────────────────────
    const handleLeaderAdvance = () => {
        const nextPkm = player?.simRival?.pokemons?.[1];
        if (rivalPkmIdx === 0 && nextPkm) {
            // Avanzar al índice 1 y volver a selección de Pokémon
            setRivalPkmIdx(1);
            setMyPkm(null); setRivPkm(null);
            setMyAtk(null); setRivAtk(null);
            setMyBonusArr([0,0,0]); setRivBonusArr([0,0,0]);
            setMyAtkPow(0); setRivAtkPow(0);
            setMyBonusFin(0); setRivBonusFin(0);
            setMyTotal(0); setRivTotal(0);
            setMyDiceRows([null]); setRivDiceRows([null]);
            setMyLocked(false); setRivLocked(false);
            setMyDiceAnim(null); setRivDiceAnim(null);
            setMyStatus('Normal'); setRivStatus('Normal');
            setPhase('pokemon');
        } else {
            setPhase('badge');
        }
    };

    // ── Badge ─────────────────────────────────────────────────────────────────
    const handleBadge = async (grant) => {
        if (grant && badgeNum) {
            await fetch(`${SERVER_IP}/badge-won`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: player.id, numBadge: badgeNum }),
            });
        }
        onClose();
    };

    // ── Resultado ─────────────────────────────────────────────────────────────
    const handleConfirmResult = async () => {
        if (myTotal >= rivTotal) {
            // Con el extra al tope (+6) no se ofrece subir: el backend cicla a
            // +0 al pasarse, que es lo que usa el "+" manual del máster.
            const canLevelUp = rivPkm.totalLevel >= myPkm.totalLevel
                && (myPkm.extra ?? 0) < MAX_EXTRA_LEVEL;
            if (canLevelUp) {
                setPhase('levelup');
            } else if (isLeaderBattle) {
                handleLeaderAdvance();
            } else {
                setPhase('capture');
            }
        } else {
            // Knock out del pokémon derrotado
            if (myPkm && myPkm.state === 'Alive') {
                await fetch(`${SERVER_IP}/change-state`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId: player.id, pokemonId: myPkm.id, rivalName: 'Wild Pokemon', rivalPokemonName: rivPkm?.name, source: 'map-wild-battle' }),
                });
            }
            setHasLostPokemon(true);
            // Reset parcial para elegir otro Pokémon, sin cerrar modal
            setMyPkm(null); setMyAtk(null); setRivAtk(null);
            setMyBonusArr([0,0,0]); setRivBonusArr([0,0,0]);
            setMyAtkPow(0); setRivAtkPow(0);
            setMyBonusFin(0); setRivBonusFin(0);
            setMyTotal(0); setRivTotal(0);
            setMyDiceRows([null]); setRivDiceRows([null]);
            setMyLocked(false); setRivLocked(false);
            setMyDiceAnim(null); setRivDiceAnim(null);
            setMyStatus('Normal'); setRivStatus('Normal');
            setPhase('pokemon');
        }
    };

    const handleLevelUp = async (yes) => {
        if (yes && myPkm) {
            await fetch(`${SERVER_IP}/increase-level`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId: player.id, pokemonId: myPkm.id, rivalName: player?.simRival?.name, rivalPokemonName: rivPkm?.name, source: 'map-wild-battle' }),
            });
        }
        if (isLeaderBattle) {
            handleLeaderAdvance();
        } else if (yes) {
            if (nodeId) onResolved?.(nodeId);
            onClose();
        } else {
            setPhase('capture');
        }
    };

    const handleCapture = async (yes) => {
        if (!yes || !rivPkm) { onClose(); return; }
        if ((player.pokemons?.length || 0) >= 6) { setPendingCapture(rivPkm.pokedex); setPhase('replace'); return; }
        await fetch(`${SERVER_IP}/add-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: rivPkm.pokedex }),
        });
        if (nodeId) onResolved?.(nodeId);
        onClose();
    };

    const handleReplace = async (removePokemonId) => {
        await fetch(`${SERVER_IP}/remove-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: removePokemonId }),
        });
        await fetch(`${SERVER_IP}/add-pokemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId: player.id, pokemonId: pendingCapture }),
        });
        setPendingCapture(null);
        if (nodeId) onResolved?.(nodeId);
        onClose();
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const myPkmImg  = myPkm  ? getPkmImg(myPkm.pokedex)  : null;
    const rivPkmImg = rivPkm ? getPkmImg(rivPkm.pokedex) : null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mbb-overlay" onClick={e => e.stopPropagation()}>

            {/* Cargando */}
            {phase === 'loading' && (
                <div className="mbb-loading">
                    <div className="mbb-loading-spinner">🎲</div>
                    <div className="mbb-loading-text">Preparando batalla...</div>
                </div>
            )}

            {/* Selección de mi Pokémon */}
            {phase === 'pokemon' && (
                <div className="player-sim-main mbb-pokemon-select">
                    <div className="player-name">{player.name}</div>
                    <div className="player_team">
                        {(player.pokemons || []).map(pkm => (
                            <PokemonBattleListed key={pkm.id} pokemon={pkm} SelectPokemon={handleSelectMyPokemon} generation={generation} />
                        ))}
                    </div>
                    {(player.megas || []).length > 0 && (
                        <div className="player_team">
                            {player.megas.map(pkm => (
                                <PokemonBattleListed key={pkm.id} pokemon={pkm} SelectPokemon={handleSelectMyPokemon} generation={generation} />
                            ))}
                        </div>
                    )}
                    {hasLostPokemon && (
                        <button className="mbb-flee-btn" onClick={onClose}>
                            🏃 Huir de la batalla
                        </button>
                    )}
                </div>
            )}

            {/* Selección de MI ataque — estructura igual a SimPlayer */}
            {(phase === 'attack-my' || phase === 'attack-rival' || phase === 'dice') && myPkm && rivPkm && (
                <div className="attack-select-sim">
                    {/* Mi Pokémon (izquierda) */}
                    <div className="MyPokemon-main">
                        <div className="MyPokemon_img" style={{ backgroundImage: `url(${myPkmImg})` }} />
                        <PokemonName pkm={myPkm} as="div" className="MyPokemon_name" />
                        <div className="MyPokemon_level">Lv: {myPkm.totalLevel}</div>
                        <div className="types_div">
                            <Types Type={myPkm.type1} Clase={`type_${myPkm.type1}`} type_id={`types_my_1`} />
                            {myPkm.type2 && myPkm.type2 !== 'NONE' && <Types Type={myPkm.type2} Clase={`type_${myPkm.type2}`} type_id={`types_my_2`} />}
                        </div>
                        {/* Ataques propios — solo cuando es mi turno de elegir */}
                        {phase === 'attack-my' && (
                            <div className="MyPokemon_attacks">
                                <div className="MyAttack1" onClick={() => handleSelectMyAttack(myPkm.attack1, myBonusArr[0])}>
                                    <Attack attack={myPkm.attack1} bonus={myBonusArr[0]} />
                                </div>
                                {myPkm.attack2?.name !== 'NONE' && (
                                    <div className="MyAttack2" onClick={() => handleSelectMyAttack(myPkm.attack2, myBonusArr[1])}>
                                        <Attack attack={myPkm.attack2} bonus={myBonusArr[1]} />
                                    </div>
                                )}
                                {myPkm.attack3?.name !== 'NONE' && (
                                    <div className="MyAttack3" onClick={() => handleSelectMyAttack(myPkm.attack3, myBonusArr[2])}>
                                        <Attack attack={myPkm.attack3} bonus={myBonusArr[2]} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Rival (derecha) */}
                    <div className="RivalPokemon-main">
                        <div className="RivalPokemon_img" style={{ backgroundImage: `url(${rivPkmImg})` }} />
                        <PokemonName pkm={rivPkm} as="div" className="RivalPokemon_name" />
                        <div className="RivalPokemon_level">Lv: {rivPkm.totalLevel}</div>
                        <div className="types_div">
                            <Types Type={rivPkm.type1} Clase={`type_${rivPkm.type1}`} type_id={`types_riv_1`} />
                            {rivPkm.type2 && rivPkm.type2 !== 'NONE' && <Types Type={rivPkm.type2} Clase={`type_${rivPkm.type2}`} type_id={`types_riv_2`} />}
                        </div>
                        {/* Ataques rival — solo cuando es turno del rival */}
                        {phase === 'attack-rival' && (
                            <div className="RivalPokemon_attacks">
                                <div className="RivalAttack1" onClick={() => handleSelectRivAttack(rivPkm.attack1, rivBonusArr[0])}>
                                    <Attack attack={rivPkm.attack1} bonus={rivBonusArr[0]} />
                                </div>
                                {rivPkm.attack2?.name !== 'NONE' && (
                                    <div className="RivalAttack2" onClick={() => handleSelectRivAttack(rivPkm.attack2, rivBonusArr[1])}>
                                        <Attack attack={rivPkm.attack2} bonus={rivBonusArr[1]} />
                                    </div>
                                )}
                                {rivPkm.attack3?.name !== 'NONE' && (
                                    <div className="RivalAttack3" onClick={() => handleSelectRivAttack(rivPkm.attack3, rivBonusArr[2])}>
                                        <Attack attack={rivPkm.attack3} bonus={rivBonusArr[2]} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dados y totales — dentro de attack-select-sim, igual que SimPlayer */}
                    {phase === 'dice' && myAtk && rivAtk && (
                        <div className="Pokemon-stadium2">
                            <div className={`myTotalFinal${allDiceDone ? (myTotal >= rivTotal ? ' mbb-winner' : ' mbb-loser') : ''}`}>{myTotal}</div>
                            <div className={`rivalTotalFinal${allDiceDone ? (rivTotal >= myTotal ? ' mbb-winner' : ' mbb-loser') : ''}`}>{rivTotal}</div>

                            <div className="MyPokemon_status">
                                {['Paralized','Asleep','Frozen','Burned','Confused','Normal'].map(s => (
                                    <div key={s} className={scMy(s)} onClick={() => applyMyStatus(s)} />
                                ))}
                            </div>

                            <div className="MyPokemon">
                                <div className="Attack-selected-mypoke"><Attack attack={myAtk} bonus={myBonusFin} /></div>
                                <div className="MyTotal_label"><div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Dice</div>=<div>Total</div></div>
                                <div className="MyTotal">
                                    <div>{myPkm.totalLevel}</div>+<div>{myAtkPow}</div>+<div>{myBonusFin}</div>+<div>{calcDiceSum(myDiceRows)}</div>=<div>{myTotal}</div>
                                </div>
                                <div className="MyDices">
                                    {myLocked ? (
                                        <>
                                            <div className="dice-refresh" onClick={handleUnlockMyDice}>↺</div>
                                            {myDiceRows.length < 3 && <div className="mydicePlus" onClick={() => { setMyDiceRows([...myDiceRows, null]); setMyLocked(false); }} />}
                                        </>
                                    ) : myDiceRows.map((val, rowIdx) => {
                                        if (val !== null) return null;
                                        const isLast = rowIdx === myDiceRows.length - 1;
                                        return (
                                            <div key={rowIdx} className="dice-row">
                                                {[1,2,3,4,5,6].map(n => (
                                                    <div key={n} className={`MyDice mydice${n}${myDiceAnim === n && isLast ? ' anim-dice' : ''}`} onClick={() => handleMyDice(rowIdx, n)} />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="RivalPokemon">
                                <div className="Attack-selected-rival"><Attack attack={rivAtk} bonus={rivBonusFin} /></div>
                                <div className="RivalTotal_label"><div>Level</div>+<div>Attack</div>+<div>Bonus</div>+<div>Dice</div>=<div>Total</div></div>
                                <div className="RivalTotal">
                                    <div>{rivPkm.totalLevel}</div>+<div>{rivAtkPow}</div>+<div>{rivBonusFin}</div>+<div>{calcDiceSum(rivDiceRows)}</div>=<div>{rivTotal}</div>
                                </div>
                                <div className="RivalDices">
                                    {rivLocked ? (
                                        <>
                                            <div className="dice-refresh" onClick={handleUnlockRivDice}>↺</div>
                                            {rivDiceRows.length < 3 && <div className="rivalDicePlus" onClick={() => { setRivDiceRows([...rivDiceRows, null]); setRivLocked(false); }} />}
                                        </>
                                    ) : rivDiceRows.map((val, rowIdx) => {
                                        if (val !== null) return null;
                                        const isLast = rowIdx === rivDiceRows.length - 1;
                                        return (
                                            <div key={rowIdx} className="dice-row">
                                                {[1,2,3,4,5,6].map(n => (
                                                    <div key={n} className={`RivalDice mydice${n}${rivDiceAnim === n && isLast ? ' anim-dice' : ''}`} onClick={() => handleRivDice(rowIdx, n)} />
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="RivalPokemon_status">
                                {['Paralized','Asleep','Frozen','Burned','Confused','Normal'].map(s => (
                                    <div key={s} className={scRiv(s)} onClick={() => applyRivStatus(s)} />
                                ))}
                            </div>

                            {allDiceDone && (
                                <button className="mbb-confirm-btn" onClick={handleConfirmResult}>
                                    {myTotal >= rivTotal ? '🏆 ¡Ganaste!' : '💀 Perdiste'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Level up */}
            {phase === 'levelup' && (
                <div className="modal-backdrop" style={{ zIndex: 300 }} onClick={e => e.stopPropagation()}>
                    <div className="levelup-prompt">
                        <div className="levelup-prompt-title">¡Victoria!</div>
                        <div className="levelup-prompt-msg">{displayName(myPkm)} derrotó a {displayName(rivPkm)} (Lv. {rivPkm?.totalLevel}).<br />¿Subir de nivel?</div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={() => handleLevelUp(true)}>Sí</button>
                            <button className="levelup-btn-no"  onClick={() => handleLevelUp(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Captura */}
            {phase === 'capture' && (
                <div className="modal-backdrop" style={{ zIndex: 300 }} onClick={e => e.stopPropagation()}>
                    <div className="levelup-prompt">
                        <div className="levelup-prompt-title">¡Capturar!</div>
                        <div className="levelup-prompt-msg">¿Quieres capturar a <strong>{rivPkm?.name}</strong>?</div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={() => handleCapture(true)}>Sí</button>
                            <button className="levelup-btn-no"  onClick={() => handleCapture(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Badge del líder */}
            {phase === 'badge' && (
                <div className="modal-backdrop" style={{ zIndex: 300 }} onClick={e => e.stopPropagation()}>
                    <div className="levelup-prompt">
                        <div className="levelup-prompt-title">¡Victoria!</div>
                        <div className="levelup-prompt-msg">¡Derrotaste al Líder!<br />¿Otorgar medalla {badgeNum}?</div>
                        <div className="levelup-prompt-buttons">
                            <button className="levelup-btn-yes" onClick={() => handleBadge(true)}>Sí</button>
                            <button className="levelup-btn-no"  onClick={() => handleBadge(false)}>No</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Equipo lleno */}
            {phase === 'replace' && (
                <div className="modal-backdrop" style={{ zIndex: 300 }} onClick={e => e.stopPropagation()}>
                    <div className="sim-replace-modal">
                        <div className="sim-replace-modal-title">Equipo lleno</div>
                        <div className="sim-replace-modal-subtitle">Elige qué Pokémon liberar para capturar a <strong>{pendingCapture}</strong></div>
                        <div className="sim-replace-modal-grid">
                            {player.pokemons?.map(pkm => {
                                const img = getPkmImg(pkm.pokedex);
                                return (
                                    <div key={pkm.id} className="sim-replace-pkm-card" onClick={() => handleReplace(pkm.id)}>
                                        <div className="sim-replace-pkm-img" style={img ? { backgroundImage: `url(${img})` } : {}} />
                                        <PokemonName pkm={pkm} as="div" className="sim-replace-pkm-name" />
                                        <div className="sim-replace-pkm-level">Lv {pkm.level}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="sim-replace-modal-cancel" onClick={() => { setPhase('capture'); setPendingCapture(null); }}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapBattleModal;
