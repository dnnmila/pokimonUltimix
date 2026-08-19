import { useEffect, useState } from "react";
import Types from "./Types";
import Attack from "./Attacks";
import SimBattleSelect from "./SimBattleSelect";
import PokemonName from "./PokemonName";
import { TMBadge, ItemBadge } from "./PokemonBattleBadges";
import { getFieldMove } from "../battleRules";
import { arenaStyle } from "../data/arenas";
import { typeColor } from "../pokemonTypes";
import SERVER_IP from "../config.js";

const LEADER_PREFIXES = ['gym', 'Riv'];

const getPkmImg = (pokedex, generation = 1) => {
    if (LEADER_PREFIXES.some(p => pokedex.startsWith(p))) return require(`../images/Leaders${generation}/${pokedex}.png`);
    if (pokedex.startsWith('M') || pokedex.startsWith('GM') || pokedex.startsWith('A')) return require(`../images/tokens_ultimix/${pokedex}.png`);
    return require(`../images/tokens_ultimix/${pokedex}.png`);
};

// Cabecera del combatiente: entrenador, token, nombre, nivel y tipos. Es lo que
// comparten las dos fases (elegir ataque y tirar dados), así que vive aquí y
// cada fase añade debajo lo suyo.
//
// El token repite las clases de aura de SimPlayer (`tera-img` / `dyna-img`) y
// las mismas variables CSS: la luz se recorta a la SILUETA del sprite, así que
// el sprite tiene que viajar al CSS además de al background. Las dos formas son
// excluyentes, nunca coinciden.
const MirrorFighter = ({ pkm, side, trainerName, generation }) => {
    const mine = side === 'mine';
    const img = getPkmImg(pkm.pokedex, generation);

    return (
        <>
            <div className={mine ? 'mirror-player-name' : 'mirror-rival-name'}>{trainerName}</div>

            <div className={`${mine ? 'mirror-mypkm-img' : 'mirror-rivalpkm-img'}`
                    + `${pkm.teraActive ? ' tera-img' : ''}`
                    + `${pkm.dynamaxActive ? ' dyna-img' : ''}`}
                 style={{
                     backgroundImage: `url(${img})`,
                     ...(pkm.teraActive ? {
                         '--tera-type': typeColor(pkm.teraType),
                         '--tera-sprite': `url(${img})`,
                     } : {}),
                     ...(pkm.dynamaxActive ? {
                         '--dyna-sprite': `url(${img})`,
                     } : {}),
                 }} />

            {/* El nombre pasa de ser el elemento a ser la fila: al lado van el
                rótulo Dynamax y las insignias del item, que es lo mismo que ve
                el jugador en su tablet. Sin handler: al espejo nadie lo toca. */}
            <div className={mine ? 'mirror-mypkm-name' : 'mirror-rivalpkm-name'}>
                <PokemonName pkm={pkm} />
                {pkm.dynamaxActive && <span className="dyna-chip">Dynamax</span>}
                <TMBadge pokemon={pkm} />
                <ItemBadge pokemon={pkm} />
            </div>

            <div className={mine ? 'mirror-mypkm-level' : 'mirror-rivalpkm-level'}>Lv: {pkm.totalLevel}</div>

            <div className="types_div">
                <Types Type={pkm.type1} Clase={`type_${pkm.type1}`} type_id={`types_mirror_${mine ? 'p' : 'r'}1`} />
                {pkm.type2 !== null && pkm.type2 !== "NONE" &&
                    <Types Type={pkm.type2} Clase={`type_${pkm.type2}`} type_id={`types_mirror_${mine ? 'p' : 'r'}2`} />}
            </div>
        </>
    );
};

// Cartas de campo activas (clima, terrenos, trampas), en la misma franja de
// arriba que en SimPlayer. Aquí el lado no se dice como "tu lado" —quien mira
// la tabla no es ninguno de los dos—, sino con el nombre del entrenador.
const MirrorFieldHUD = ({ fieldMoves, playerName, rivalName }) => {
    const slots = (fieldMoves || []).filter(Boolean);
    if (slots.length === 0) return null;

    return (
        <div className="mirror-field-hud">
            {slots.map((slot, i) => {
                const card = getFieldMove(slot.id);
                if (!card) return null;
                const tone = card.scope === 'global'
                    ? 'global'
                    : (slot.owner === 'player' ? 'mine' : 'rival');
                return (
                    <div key={i} className={`mirror-field-card mirror-field-card--${tone}`}>
                        <div className="mirror-field-card-emoji">{card.emoji}</div>
                        <div className="mirror-field-card-name">{card.es}</div>
                        <div className="mirror-field-card-side">
                            {tone === 'global' ? 'los dos lados'
                                : tone === 'mine' ? `lado de ${playerName || 'jugador'}`
                                : `lado de ${rivalName || 'rival'}`}
                        </div>
                        {card.kind === 'reminder' && (
                            <div className="mirror-field-card-manual">manual</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const StadiumMirrorModal = ({ game }) => {
    // Los Pokémon de los líderes traen POKEDEX de carta, así que SimBattleSelect
    // resuelve su sprite por nombre contra este catálogo. Se pide una sola vez.
    const [pokemonList, setPokemonList] = useState([]);
    useEffect(() => {
        fetch(`${SERVER_IP}/pokemon-list`)
            .then(r => r.json())
            .then(data => setPokemonList(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    if (!game.battlePublic) return null;

    const player = game.players[game.currentTurn];
    const rival = game.CurrentRival;
    const playerPkm = game.myPlayerPkm?.length > 0 ? game.myPlayerPkm[game.myPlayerPkm.length - 1] : null;
    const rivalPkm = game.myRivalPkm?.length > 0 ? game.myRivalPkm[game.myRivalPkm.length - 1] : null;
    const playerAtk = game.myPlayerPkmAtk?.length > 0 ? game.myPlayerPkmAtk[game.myPlayerPkmAtk.length - 1] : null;
    const rivalAtk = game.myRivalPkmAtk?.length > 0 ? game.myRivalPkmAtk[game.myRivalPkmAtk.length - 1] : null;

    // Las cartas de campo acompañan al combate, no a la selección: mismo criterio
    // que en la tablet, donde aparecen cuando ya hay dos Pokémon en el terreno.
    const inBattle = (game.battlePhase === 'AttackSelection' || game.battlePhase === 'RollDice')
        && playerPkm && rivalPkm;

    return (
        <div className="mirror-modal-backdrop">
            <div className="mirror-modal">

                {/* Fase: selección de Pokémon. Es la misma pantalla que ve el
                    jugador en su tablet, en modo solo lectura: lo que va tocando
                    aparece marcado aquí en cuanto lo toca. */}
                {game.battlePhase === 'PokemonSelection' && player && rival && (
                    <SimBattleSelect
                        readOnly
                        player={player}
                        rival={rival}
                        generation={game.generation}
                        pokemonList={pokemonList}
                        selectedMine={playerPkm}
                        selectedTheirs={rivalPkm}
                        formsView={game.simFormsView}
                    />
                )}

                {/* Fase: ataque y dados - tokens grandes a los lados */}
                {game.battlePhase === 'AttackSelection'  && playerPkm && rivalPkm && (
                     <div className="mirror-attack-select-main"
                          style={arenaStyle(rivalPkm.pokedex, game.generation)}>
                        <div className="mirror-mypkm-main">
                            <MirrorFighter pkm={playerPkm} side="mine"
                                           trainerName={player?.name} generation={game.generation} />
                           <div className='MyPokemon_attacks' >
                            <div className='MyAttack1'  > <Attack attack={playerPkm.attack1} bonus ={game.myBonusAtk1} /> </div>
                            {playerPkm.attack2.name !== 'NONE' && <div className='MyAttack2'  >  <Attack attack={playerPkm.attack2} bonus ={game.myBonusAtk2} /> </div>}
                            {playerPkm.attack3.name !== 'NONE' && <div className='MyAttack3' >  <Attack attack={playerPkm.attack3} bonus ={game.myBonusAtk3} /> </div>}
                            </div>


                        </div>

                        <div className="mirror-rivalpkm-main">
                            <MirrorFighter pkm={rivalPkm} side="theirs"
                                           trainerName={rival?.name} generation={game.generation} />
                           <div className='RivalPokemon_attacks' >
                            <div className='RivalAttack1'  ><Attack attack={rivalPkm.attack1} bonus ={game.rivalBonusAtk1} /></div>
                            {rivalPkm.attack2.name !== 'NONE' && <div className='RivalAttack2' ><Attack attack={rivalPkm.attack2} bonus ={game.rivalBonusAtk2} /></div>}
                            {rivalPkm.attack3.name !== 'NONE' && <div className='RivalAttack3'  ><Attack attack={rivalPkm.attack3} bonus ={game.rivalBonusAtk3} /></div>}

                            </div>
                        </div>
                         </div>
                )}

                {/* Fase: totales superpuestos centrados */}
                {game.battlePhase === 'RollDice' && playerPkm && rivalPkm && (
                    <div className="mirror-attack-select-main"
                         style={arenaStyle(rivalPkm.pokedex, game.generation)}>


                            <div className="mirror-mypkm-main">
                            <MirrorFighter pkm={playerPkm} side="mine"
                                           trainerName={player?.name} generation={game.generation} />
                            {game.myPlayerDiceRows?.length > 0 && (
                                <div className="mirror-dice-row">
                                    {game.myPlayerDiceRows.map((val, idx) => (
                                        <div key={idx} className={`MyDice mydice${val}`} />
                                    ))}
                                </div>
                            )}
                            {playerAtk && (
                                <div className="mirror-attack-selected-mypoke">
                                      <Attack attack={playerAtk} bonus={game.myBonusFinal}  />
                                </div>
                            )}
                        </div>

                        <div className="mirror-rivalpkm-main">
                            <MirrorFighter pkm={rivalPkm} side="theirs"
                                           trainerName={rival?.name} generation={game.generation} />
                            {game.myRivalDiceRows?.length > 0 && (
                                <div className="mirror-dice-row">
                                    {game.myRivalDiceRows.map((val, idx) => (
                                        <div key={idx} className={`MyDice mydice${val}`} />
                                    ))}
                                </div>
                            )}
                            {rivalAtk && (
                                <div className="mirror-attack-selected-rival">
                                    <Attack attack={rivalAtk} bonus={game.rivalBonusFinal} />
                                </div>
                            )}
                        </div>

                        {/* El `key` es el propio total: al cambiar, React remonta
                            el nodo y con eso se vuelve a lanzar la animación del
                            CSS. Sin él la cifra cambiaría sin que nadie lo note. */}
                        <div className="mirror-mytotal-final" key={`p${game.myPlayerTotal}`}>{game.myPlayerTotal}</div>
                        <div className="mirror-rivaltotal-final" key={`r${game.myRivalTotal}`}>{game.myRivalTotal}</div>


                    {/* Mismo desglose que la tablet, columnas incluidas: Extra
                        (item + cartas de campo + Orbe Tera) va entre Bonus y
                        Dice. Se resalta cuando no es 0, que es cuando alguien
                        querrá saber de dónde salió. */}
                     <div className='MyTotal_label'>
                        <div>Level </div>
                        <div>Attack  </div>
                        <div>Bonus  </div>
                        <div>Extra  </div>
                        <div>Dice  </div>

                    </div>

                    <div className='MyTotal'>
                        <div>{playerPkm.totalLevel}  </div>
                        <div>{playerAtk?.strength ?? '-'}  </div>
                        <div>{game.myBonusFinal}  </div>
                        <div className={game.myPlayerExtra ? 'total-extra-on' : ''}>{game.myPlayerExtra || 0}  </div>
                        <div>{game.myPlayerDice}  </div>
                    </div>

                    <div className='RivalTotal_label'>
                        <div>Level </div>
                        <div>Attack  </div>
                        <div>Bonus  </div>
                        <div>Extra  </div>
                        <div>Dice  </div>

                    </div>
                    <div className='RivalTotal'>
                        <div>{rivalPkm.totalLevel}  </div>
                        <div>{rivalAtk?.strength ?? '-'}  </div>
                        <div>{game.rivalBonusFinal}  </div>
                        <div className={game.myRivalExtra ? 'total-extra-on' : ''}>{game.myRivalExtra || 0}  </div>
                        <div>{game.myRivalDice}  </div>
                    </div>
                    </div>
                )}

                {/* Va fuera de las dos fases: se pinta encima de cualquiera de
                    las dos y así no hay que repetirlo en cada una */}
                {inBattle && (
                    <MirrorFieldHUD fieldMoves={game.fieldMoves}
                                    playerName={player?.name}
                                    rivalName={rival?.name} />
                )}

            </div>
        </div>
    );
};

export default StadiumMirrorModal;
