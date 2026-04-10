import React, {useState,useEffect,useCallback} from 'react';
import dinamaxImg from '../images/dinamax.png';
import Pokemon from './Pokemon';
import AddPokemon from './AddPokemon';
import ModalMonedas from './modals/ModalMonedas.js';
import ModalTienda from './modals/ModalTienda.js';
import ModalBattle from './modals/ModalBattle.js';





const Player = ({ game, currentPlayerTurn, currentPlayerView,AllPlayers, onNextTurn,onPrevTurn,onNextView,onPrevView, onAddPokemon,onEvolvePokemon, onDeletePokemon ,onUpdateCoins ,increaseLevel ,badgeWon,badgeLost, onAttach,onChangeState, onChangeStatus,wildBattle,playerBattle,LeaderBattle,attachTM,attachMega,toggleDynamax,onApprovePurchase,onDenyPurchase,onMasterPurchase}) => {

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

    

   

  

    return (
        <div className="CurrentPlayerView">
            <div className="Title_pokeApp">
            
            <div className='Position_CurrentPlayer'> #{currentPlayerView.position} </div>
            <div className='Name_CurrentPlayer'> {currentPlayerView.name}</div>
            <div className='Points_CurrentPlayer'> {currentPlayerView.points}pts</div>
           
                
           
            <div className='allBadges'>
                <div className={`${currentPlayerView.badge1 ? 'Bagde_win' : 'Badge'}`} id='Badge1' onClick={()=> handleBadge(1)}> </div>
                <div className={`${currentPlayerView.badge2 ? 'Bagde_win' : 'Badge'}`} id='Badge2' onClick={()=> handleBadge(2)}> </div>
                <div className={`${currentPlayerView.badge3 ? 'Bagde_win' : 'Badge'}`} id='Badge3' onClick={()=> handleBadge(3)}> </div>
                <div className={`${currentPlayerView.badge4 ? 'Bagde_win' : 'Badge'}`} id='Badge4' onClick={()=> handleBadge(4)}> </div>
                <div className={`${currentPlayerView.badge5 ? 'Bagde_win' : 'Badge'}`} id='Badge5' onClick={()=> handleBadge(5)}> </div>
                <div className={`${currentPlayerView.badge6 ? 'Bagde_win' : 'Badge'}`} id='Badge6' onClick={()=> handleBadge(6)}> </div>
                <div className={`${currentPlayerView.badge7 ? 'Bagde_win' : 'Badge'}`} id='Badge7' onClick={()=> handleBadge(7)}> </div>
                <div className={`${currentPlayerView.badge8 ? 'Bagde_win' : 'Badge'}`} id='Badge8' onClick={()=> handleBadge(8)}> </div>
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
                         onChangeStatus={onChangeStatus}/>
                       
                    ))}
            {currentPlayerView.pokemons.length < 6 && <AddPokemon onAdd={onAddPokemon} currentPlayer={currentPlayerView} />}
                </div>  
            <div onClick={onNextView} className='nextPlayerView'></div>
        </div>
           
           

         

     
   
            <ModalMonedas show={showModalCoins} onClose={handleCloseModalCoins} currentPlayer={currentPlayerView} onUpdateCoins={onUpdateCoins}/>
            <ModalTienda show={showModalStore} onClose={handleCloseModalStore} currentPlayer={currentPlayerView} onMasterPurchase={onMasterPurchase}/>

            {showPurchaseHistory && (
                <div className="modal-backdrop" onClick={() => setShowPurchaseHistory(false)}>
                    <div className="purchase-history-modal" onClick={e => e.stopPropagation()}>
                        <div className="purchase-history-title">
                            Historial de Compras
                            <button className="purchase-history-close" onClick={() => setShowPurchaseHistory(false)}>✕</button>
                        </div>
                        {(game.purchaseHistory || []).length === 0 ? (
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
