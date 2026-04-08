import Types from "./Types";
import PokemonBattleListed from "./PokemonBattleListed";
import Attack from "./Attacks";

const LEADER_PREFIXES = ['gym', 'Riv'];

const getPkmImg = (pokedex, generation = 1) => {
    if (LEADER_PREFIXES.some(p => pokedex.startsWith(p))) return require(`../images/Leaders${generation}/${pokedex}.png`);
    if (pokedex.startsWith('M') || pokedex.startsWith('GM') || pokedex.startsWith('A')) return require(`../images/tokens_ultimix/${pokedex}.png`);
    return require(`../images/POKEMON/${pokedex}.png`);
};

const StadiumMirrorModal = ({ game }) => {
    if (!game.battlePublic) return null;

    const player = game.players[game.currentTurn];
    const rival = game.CurrentRival;
    const playerPkm = game.myPlayerPkm?.length > 0 ? game.myPlayerPkm[game.myPlayerPkm.length - 1] : null;
    const rivalPkm = game.myRivalPkm?.length > 0 ? game.myRivalPkm[game.myRivalPkm.length - 1] : null;
    const playerAtk = game.myPlayerPkmAtk?.length > 0 ? game.myPlayerPkmAtk[game.myPlayerPkmAtk.length - 1] : null;
    const rivalAtk = game.myRivalPkmAtk?.length > 0 ? game.myRivalPkmAtk[game.myRivalPkmAtk.length - 1] : null;

    return (
        <div className="mirror-modal-backdrop">
            <div className="mirror-modal">

                {/* Fase: seleccion de pokemon */}
                {game.battlePhase === 'PokemonSelection' && (
                    <div className="mirror-pkm-selection">
                        {player && (
                            <div className="mirror-player-main">
                                <div className="mirror-player-name">{player.name}</div>
                                <div className="mirror-player-team">
                                    {(player.pokemons || []).map((pokemon) => (
                                        <PokemonBattleListed
                                            key={player.name + pokemon.id}
                                            pokemon={pokemon}
                                            SelectPokemon={() => {}}
                                            generation={game.generation}
                                        />
                                    ))}
                                </div>
                                <div className="mirror-player-team">
                                    {(player.megas || []).map((pokemon) => (
                                        <PokemonBattleListed
                                            key={player.name + pokemon.id}
                                            pokemon={pokemon}
                                            SelectPokemon={() => {}}
                                            generation={game.generation}
                                        />
                                    ))}
                                </div>
                                {player.dynamax && (
                                <div className="mirror-player-team">
                                    {(player.gmaxes || []).map((pokemon) => (
                                        <PokemonBattleListed
                                            key={player.name + pokemon.id}
                                            pokemon={pokemon}
                                            SelectPokemon={() => {}}
                                            generation={game.generation}
                                        />
                                    ))}
                                </div>
                                )}
                            </div>
                        )}
                        {rival && (
                            <div className="mirror-rival-main">
                                <div className="mirror-rival-name">{rival.name}</div>
                                <div className="mirror-rival-team">
                                    {(rival.pokemons || []).map((pokemon, index) => (
                                        <PokemonBattleListed
                                            key={rival.name + index}
                                            pokemon={pokemon}
                                            SelectPokemon={() => {}}
                                            generation={game.generation}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Fase: ataque y dados - tokens grandes a los lados */}
                {game.battlePhase === 'AttackSelection'  && playerPkm && rivalPkm && (
                     <div className="mirror-attack-select-main">
                        <div className="mirror-mypkm-main">
                            <div className="mirror-mypkm-img" style={{ backgroundImage: `url(${getPkmImg(playerPkm.pokedex, game.generation)})` }}></div>
                            <div className="mirror-mypkm-name">{playerPkm.name}</div>
                            <div className="mirror-mypkm-level">Lv: {playerPkm.totalLevel}</div>
                            <div className="types_div">
                                <Types Type={playerPkm.type1} Clase={`type_${playerPkm.type1}`} type_id={`types_mirror_p1`} />
                                {playerPkm.type2 !== null && playerPkm.type2 !== "NONE" &&
                                    <Types Type={playerPkm.type2} Clase={`type_${playerPkm.type2}`} type_id={`types_mirror_p2`} />}
                            </div>
                           <div className='MyPokemon_attacks' >
                            <div className='MyAttack1'  > <Attack attack={playerPkm.attack1} bonus ={game.myBonusAtk1} /> </div>
                            {playerPkm.attack2.name !== 'NONE' && <div className='MyAttack2'  >  <Attack attack={playerPkm.attack2} bonus ={game.myBonusAtk2} /> </div>}
                            {playerPkm.attack3.name !== 'NONE' && <div className='MyAttack3' >  <Attack attack={playerPkm.attack3} bonus ={game.myBonusAtk3} /> </div>}
                            </div> 


                        </div>

                        <div className="mirror-rivalpkm-main">
                            <div className="mirror-rivalpkm-img" style={{ backgroundImage: `url(${getPkmImg(rivalPkm.pokedex, game.generation)})` }}></div>
                            <div className="mirror-rivalpkm-name">{rivalPkm.name}</div>
                            <div className="mirror-rivalpkm-level">Lv: {rivalPkm.totalLevel}</div>
                            <div className="types_div">
                                <Types Type={rivalPkm.type1} Clase={`type_${rivalPkm.type1}`} type_id={`types_mirror_r1`} />
                                {rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE" &&
                                    <Types Type={rivalPkm.type2} Clase={`type_${rivalPkm.type2}`} type_id={`types_mirror_r2`} />}
                            </div>
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
                    <div className="mirror-attack-select-main">


                            <div className="mirror-mypkm-main">
                            <div className="mirror-mypkm-img" style={{ backgroundImage: `url(${getPkmImg(playerPkm.pokedex, game.generation)})` }}></div>
                            <div className="mirror-mypkm-name">{playerPkm.name}</div>
                            <div className="mirror-mypkm-level">Lv: {playerPkm.totalLevel}</div>
                            <div className="types_div">
                                <Types Type={playerPkm.type1} Clase={`type_${playerPkm.type1}`} type_id={`types_mirror_p1`} />
                                {playerPkm.type2 !== null && playerPkm.type2 !== "NONE" &&
                                    <Types Type={playerPkm.type2} Clase={`type_${playerPkm.type2}`} type_id={`types_mirror_p2`} />}
                            </div>
                            {playerAtk && (
                                <div className="mirror-attack-selected-mypoke">
                                      <Attack attack={playerAtk} bonus={game.myBonusFinal}  />
                                </div>
                            )}
                        </div>

                        <div className="mirror-rivalpkm-main">
                            <div className="mirror-rivalpkm-img" style={{ backgroundImage: `url(${getPkmImg(rivalPkm.pokedex, game.generation)})` }}></div>
                            <div className="mirror-rivalpkm-name">{rivalPkm.name}</div>
                            <div className="mirror-rivalpkm-level">Lv: {rivalPkm.totalLevel}</div>
                            <div className="types_div">
                                <Types Type={rivalPkm.type1} Clase={`type_${rivalPkm.type1}`} type_id={`types_mirror_r1`} />
                                {rivalPkm.type2 !== null && rivalPkm.type2 !== "NONE" &&
                                    <Types Type={rivalPkm.type2} Clase={`type_${rivalPkm.type2}`} type_id={`types_mirror_r2`} />}
                            </div>
                            {rivalAtk && (
                                <div className="mirror-attack-selected-rival">
                                    <Attack attack={rivalAtk} bonus={game.rivalBonusFinal} />
                                </div>
                            )}
                        </div>

                        <div className="mirror-mytotal-final">{game.myPlayerTotal}</div>
                        <div className="mirror-rivaltotal-final">{game.myRivalTotal}</div>


                     <div className='MyTotal_label'>
                        <div>Level </div>
                        <div>Attack  </div>
                        <div>Bonus  </div>
                        <div>Dice  </div>
                     
                    </div>

                    <div className='MyTotal'>
                        <div>{playerPkm.totalLevel}  </div>
                        <div>{playerAtk?.strength ?? '-'}  </div>
                        <div>{game.myBonusFinal}  </div>
                        <div>{game.myPlayerDice}  </div>
                    </div>

                    <div className='RivalTotal_label'>
                        <div>Level </div>
                        <div>Attack  </div>
                        <div>Bonus  </div>
                        <div>Dice  </div>
                  
                    </div>
                    <div className='RivalTotal'>
                        <div>{rivalPkm.totalLevel}  </div>
                        <div>{rivalAtk?.strength ?? '-'}  </div>
                        <div>{game.rivalBonusFinal}  </div>
                        <div>{game.myRivalDice}  </div>

                    </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StadiumMirrorModal;
