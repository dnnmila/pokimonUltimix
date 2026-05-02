import React, {useState,useEffect,useCallback} from 'react';
import dinamaxImg from '../images/dinamax.png';
import Pokemon from './Pokemon';
import AddPokemon from './AddPokemon';
import ModalMonedas from './modals/ModalMonedas.js';
import ModalTienda from './modals/ModalTienda.js';
import ModalBattle from './modals/ModalBattle.js';

const getBadgeImg = (gen, num) => {
    try {
        return require(`../images/badges/badges${gen}/badge${num}.webp`);
    } catch (e) {
        try { return require(`../images/badges/badge${num}.png`); } catch { return null; }
    }
};





const getPokedexImg = (pokedex) => {
    try { return require(`../images/POKEMON/${pokedex}.png`); } catch { return null; }
};

const Player = ({ game, currentPlayerTurn, currentPlayerView,AllPlayers, onNextTurn,onPrevTurn,onNextView,onPrevView, onAddPokemon,onEvolvePokemon, onDeletePokemon ,onUpdateCoins ,increaseLevel ,badgeWon,badgeLost, onAttach,onChangeState, onChangeStatus,onDecreaseStatusCounter,wildBattle,playerBattle,LeaderBattle,attachTM,attachMega,toggleDynamax,onApprovePurchase,onDenyPurchase,onMasterPurchase,onTradePokemon}) => {

    const handleKeyDown = useCallback((event) => {
        switch(event.key) {
            case 'ArrowRight':
                onNextView();
                break;
            case 'ArrowLeft':
                onPrevView();
                break;
            default:
                break;
        }
    }, [onNextView, onPrevView]);
    
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]); // Ahora handleKeyDown es una dependencia

  

    const [inputWildPokemon, setInputWildPokemon] = useState('');
    const handleInputChange = (e) => {
        setInputWildPokemon(e.target.value);
      };
      const handleButtonWildPokemon = () => {
        wildBattle(inputWildPokemon);
      };
      
    const [showModalCoins, setShowModalCoins] = useState(false);
    const [showModalStore, setShowModalStore] = useState(false);
    const [showModalBattle, setShowModalBattle] = useState(false);
    const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
    const [historyTab, setHistoryTab] = useState('purchases');
    const [showTradeModal, setShowTradeModal] = useState(false);
    const [tradeTargetPlayer, setTradeTargetPlayer] = useState(null);
    const [tradeMyPkm, setTradeMyPkm] = useState(null);
    const [tradeTargetPkm, setTradeTargetPkm] = useState(null);

    const closeTrade = () => { setShowTradeModal(false); setTradeTargetPlayer(null); setTradeMyPkm(null); setTradeTargetPkm(null); };

    const handleTrade = async () => {
        if (!tradeMyPkm || !tradeTargetPkm || !tradeTargetPlayer) return;
        await onTradePokemon(currentPlayerView.id, tradeMyPkm.id, tradeTargetPlayer.id, tradeTargetPkm.id);
        closeTrade();
    };


    const handleOpenModalCoins = () => {
        setShowModalCoins(true);
    };
    const handleCloseModalCoins = () => {
        setShowModalCoins(false);
    };
    const handleOpenModalStore = () => {
        setShowModalStore(true);
    };
    const handleCloseModalStore = () => {
        setShowModalStore(false);
    };
    const handleOpenModalBattle = () => {
        setShowModalBattle(true);
    };
    const handleCloseModalBattle = () => {
        setShowModalBattle(false);
    };
   

   

   

    const handleBadge = (num) => {
        const badgeNumber = `badge${num}`;
        console.log(badgeNumber);
        console.log(currentPlayerView[badgeNumber]);
    
        if (currentPlayerView[badgeNumber] === false) {
            console.log("Enviar badge WIN");
            badgeWon(currentPlayerView.id, num);
        } else {
            console.log("Enviar badge Lost");
            badgeLost(currentPlayerView.id, num);
        }
    };

    

   

  

    if (!currentPlayerView) return null;

    return (
        <div className="CurrentPlayerView">
            <div className="Title_pokeApp">

            <div className='Position_CurrentPlayer'> #{currentPlayerView.position} </div>
            <div className='Name_CurrentPlayer'> {currentPlayerView.name}</div>
            <div className='Points_CurrentPlayer'> {currentPlayerView.points}pts</div>
           
                
           
            <div className='allBadges'>
                {[1,2,3,4,5,6,7,8].map(num => {
                    const img = getBadgeImg(game.generation, num);
                    return (
                        <div
                            key={num}
                            className={currentPlayerView[`badge${num}`] ? 'Bagde_win' : 'Badge'}
                            style={img ? { backgroundImage: `url(${img})` } : {}}
                            onClick={() => handleBadge(num)}
                        />
                    );
                })}
                <div className={`${currentPlayerView.badge9 ? 'Bagde_win' : 'Badge'}`} id='Elite' onClick={()=> handleBadge(9)}> </div>
                <div className={`${currentPlayerView.badge10 ? 'Bagde_win' : 'Badge'}`} id='BadgeChampion' onClick={()=> handleBadge(10)}> </div>
            </div>
            <div className='Money_CurrentPlayer' onClick={handleOpenModalCoins}> ${currentPlayerView.coins}</div>
            </div>

          
          <div className='MainPokemons_Player'>   
            <div onClick={onPrevView} className='prevPlayerView'></div>
            <div className="All_Pokemons"> 
                    {currentPlayerView.pokemons.map(pokemon => (
                         <Pokemon 
                         key={pokemon.id}
                         id={pokemon.id}
                         name={pokemon.name} 
                         level={pokemon.level} 
                         extra={pokemon.extra}
                         nextLevel = {pokemon.nextLevel}
                         evolution = {pokemon.evolution}
                         attached = {pokemon.attach}
                         type1={pokemon.type1}
                         type2={pokemon.type2}  
                         pokedex={pokemon.pokedex}
                         status={pokemon.status}
                         state={pokemon.state}
                         onDelete={onDeletePokemon}
                         currentPlayer={currentPlayerView} 
                         onIncreaseLevel={increaseLevel}
                         onEvolvePokemon={onEvolvePokemon} 
                         onAttach={onAttach}
                         attachTM={attachTM}
                         attachMega={attachMega}
                         onChangeState={onChangeState}
                         onChangeStatus={onChangeStatus}
                         statusCounter={pokemon.statusCounter}
                         onDecreaseStatusCounter={onDecreaseStatusCounter}/>
                       
                    ))}
            {currentPlayerView.pokemons.length < 6 && <AddPokemon onAdd={onAddPokemon} currentPlayer={currentPlayerView} />}
                </div>  
            <div onClick={onNextView} className='nextPlayerView'></div>
        </div>
           
           

         

     
   
            <ModalMonedas show={showModalCoins} onClose={handleCloseModalCoins} currentPlayer={currentPlayerView} onUpdateCoins={onUpdateCoins}/>
            <ModalTienda show={showModalStore} onClose={handleCloseModalStore} currentPlayer={currentPlayerView} onMasterPurchase={onMasterPurchase}/>

            {showTradeModal && (
                <div className="modal-backdrop" onClick={closeTrade}>
                    <div className="trade-modal" onClick={e => e.stopPropagation()}>
                        <button className="trade-modal-close" onClick={closeTrade}>✕</button>
                        {!tradeTargetPlayer ? (
                            <>
                                <div className="trade-modal-title">Intercambiar Pokémon</div>
                                <div className="trade-modal-subtitle">Selecciona un jugador</div>
                                <div className="trade-players-grid">
                                    {AllPlayers.filter(p => p.id !== currentPlayerView.id).map(p => (
                                        <div key={p.id} className="trade-player-card" onClick={() => setTradeTargetPlayer(p)}>
                                            <div className="trade-player-name">{p.name}</div>
                                            <div className="trade-player-count">{p.pokemons.length} Pokémon</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="trade-modal-title">{currentPlayerView.name} ⇄ {tradeTargetPlayer.name}</div>
                                <div className="trade-teams">
                                    <div className="trade-team-col">
                                        <div className="trade-team-label">{currentPlayerView.name}</div>
                                        {currentPlayerView.pokemons.map(pkm => {
                                            const img = getPokedexImg(pkm.pokedex);
                                            return (
                                                <div key={pkm.id} className={`trade-pkm-card${tradeMyPkm?.id === pkm.id ? ' trade-pkm-selected' : ''}`} onClick={() => setTradeMyPkm(pkm)}>
                                                    {img && <div className="trade-pkm-img" style={{ backgroundImage: `url(${img})` }} />}
                                                    <div className="trade-pkm-name">{pkm.name}</div>
                                                    <div className="trade-pkm-level">Lv.{pkm.level}{pkm.extra > 0 ? ` +${pkm.extra}` : ''}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="trade-divider">⇄</div>
                                    <div className="trade-team-col">
                                        <div className="trade-team-label">{tradeTargetPlayer.name}</div>
                                        {tradeTargetPlayer.pokemons.map(pkm => {
                                            const img = getPokedexImg(pkm.pokedex);
                                            return (
                                                <div key={pkm.id} className={`trade-pkm-card${tradeTargetPkm?.id === pkm.id ? ' trade-pkm-selected' : ''}`} onClick={() => setTradeTargetPkm(pkm)}>
                                                    {img && <div className="trade-pkm-img" style={{ backgroundImage: `url(${img})` }} />}
                                                    <div className="trade-pkm-name">{pkm.name}</div>
                                                    <div className="trade-pkm-level">Lv.{pkm.level}{pkm.extra > 0 ? ` +${pkm.extra}` : ''}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="trade-modal-actions">
                                    <button className="trade-back-btn" onClick={() => { setTradeTargetPlayer(null); setTradeMyPkm(null); setTradeTargetPkm(null); }}>← Volver</button>
                                    <button className="trade-confirm-btn" disabled={!tradeMyPkm || !tradeTargetPkm} onClick={handleTrade}>Intercambiar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showPurchaseHistory && (
                <div className="modal-backdrop" onClick={() => setShowPurchaseHistory(false)}>
                    <div className="purchase-history-modal" onClick={e => e.stopPropagation()}>
                        <div className="purchase-history-title">
                            {historyTab === 'purchases' ? 'Historial de Compras' : historyTab === 'states' ? 'Historial de Estados' : 'Historial de Niveles'}
                            <button className="purchase-history-close" onClick={() => setShowPurchaseHistory(false)}>✕</button>
                        </div>
                        <div className="purchase-history-tabs">
                            <button
                                className={`ph-tab${historyTab === 'purchases' ? ' ph-tab-active' : ''}`}
                                onClick={() => setHistoryTab('purchases')}
                            >Compras</button>
                            <button
                                className={`ph-tab${historyTab === 'states' ? ' ph-tab-active' : ''}`}
                                onClick={() => setHistoryTab('states')}
                            >Estados</button>
                            <button
                                className={`ph-tab${historyTab === 'levels' ? ' ph-tab-active' : ''}`}
                                onClick={() => setHistoryTab('levels')}
                            >Niveles</button>
                        </div>
                        {historyTab === 'purchases' ? (
                            (game.purchaseHistory || []).length === 0 ? (
                                <div className="purchase-history-empty">Sin compras registradas</div>
                            ) : (
                                <div className="purchase-history-list">
                                    {[...(game.purchaseHistory || [])].reverse().map((entry, i) => (
                                        <div key={i} className="purchase-history-item">
                                            <span className="ph-round">R{entry.round}</span>
                                            <span className="ph-player">{entry.playerName}</span>
                                            <span className="ph-item">{entry.item}</span>
                                            <span className="ph-price">-${entry.price}</span>
                                            <span className="ph-coins-after">→ ${entry.coinsAfter}</span>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : historyTab === 'states' ? (
                            (game.stateHistory || []).length === 0 ? (
                                <div className="purchase-history-empty">Sin cambios de estado registrados</div>
                            ) : (
                                <div className="purchase-history-list">
                                    {[...(game.stateHistory || [])].reverse().map((entry, i) => {
                                        const sourceLabel = entry.source === 'manual-master' ? 'Manual (Master)' : entry.source === 'manual-player' ? `Manual (${entry.playerName})` : '';
                                        return (
                                            <div key={i} className="purchase-history-item">
                                                <span className="ph-round">R{entry.round}</span>
                                                <span className="ph-player">{entry.playerName}</span>
                                                <span className="ph-item">{entry.pokemonName}</span>
                                                <span className={`ph-state ph-state-${entry.newState?.toLowerCase()}`}>{entry.newState}</span>
                                                {entry.rivalPokemonName && <span className="ph-rival-pkm">vs {entry.rivalPokemonName}</span>}
                                                {entry.rivalName && <span className="ph-rival">{entry.rivalName}</span>}
                                                {sourceLabel && <span className="ph-source">{sourceLabel}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            (game.levelHistory || []).length === 0 ? (
                                <div className="purchase-history-empty">Sin subidas de nivel registradas</div>
                            ) : (
                                <div className="purchase-history-list">
                                    {[...(game.levelHistory || [])].reverse().map((entry, i) => {
                                        const sourceLabel = entry.source === 'manual-master' ? 'Manual (Master)' : entry.source === 'manual-player' ? `Manual (${entry.playerName})` : '';
                                        return (
                                            <div key={i} className="purchase-history-item">
                                                <span className="ph-round">R{entry.round}</span>
                                                <span className="ph-player">{entry.playerName}</span>
                                                <span className="ph-item">{entry.pokemonName}</span>
                                                <span className="ph-level-change">Lv.{entry.previousLevel}→{entry.newLevel}</span>
                                                {entry.rivalPokemonName && <span className="ph-rival-pkm">vs {entry.rivalPokemonName}</span>}
                                                {entry.rivalName && <span className="ph-rival">{entry.rivalName}</span>}
                                                {sourceLabel && <span className="ph-source">{sourceLabel}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}

            {(game.pendingPurchases || []).length > 0 && (
                <div className="pending-purchases">
                    <div className="pending-purchases-title">Solicitudes de compra</div>
                    {game.pendingPurchases.map(req => (
                        <div key={req.id} className="pending-purchase-item">
                            <span className="pending-purchase-player">{req.playerName}</span>
                            <span className="pending-purchase-item-name">{req.item}</span>
                            <span className="pending-purchase-price">${req.price}</span>
                            <button className="pending-approve" onClick={() => onApprovePurchase(req.id)}>✓</button>
                            <button className="pending-deny" onClick={() => onDenyPurchase(req.id)}>✕</button>
                        </div>
                    ))}
                </div>
            )}
            <ModalBattle show={showModalBattle} onClose={handleCloseModalBattle} game={game} playerBattle={playerBattle} LeaderBattle={LeaderBattle}  />
          
                        

        <div className='players_turns'>
        <div className='PrevTurnButton' onClick={onPrevTurn} > <div className='prevTurnImage'> </div>Prev Turn</div>
            {AllPlayers.map((player) => (
             <div 
             className={currentPlayerTurn.id === player.id ? 'player_ON_turn' : 'player_turn_box'}
             key={player.id}
         >
             <p>{player.name}</p>
         </div>
            ))}

            <div className='NextTurnButton' onClick={onNextTurn} > <div className='nextTurnImage'> </div>Next Turn</div>
            </div>

            <div className='Botom_PlayerView'>

            <div
                className={`dynamax-btn ${currentPlayerView.dynamax ? 'dynamax-on' : 'dynamax-off'}`}
                onClick={() => toggleDynamax(currentPlayerView.id)}
            >
                <img src={dinamaxImg} alt="Dynamax" />
            </div>

            <div className='WildPokemon_imput'>
             <input type="text" value={inputWildPokemon} onChange={handleInputChange} />
             <button onClick={handleButtonWildPokemon}>Wild Pokemon</button>
            </div>

            <button  className='BattleMenu_Button' onClick={handleOpenModalBattle} > Battle </button>
            <div onClick={handleOpenModalStore} className='Button-store'></div>
            <div className='Button-purchase-history' onClick={() => setShowPurchaseHistory(v => !v)}></div>
            <div className='Button-trade' onClick={() => setShowTradeModal(true)}></div>
                <div className='Time_CurrentPlayer'>
                    <h4>R{game.round}</h4>
                    <h4> {currentPlayerView.hours}hrs</h4>
                    <h4> {currentPlayerView.minutes}min</h4>
                    <h4> {currentPlayerView.seconds}sec</h4>
                </div>
            </div>
        </div>


    );
};


export default Player;
