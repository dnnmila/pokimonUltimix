import React, {useState,useEffect,useCallback} from 'react';
import dinamaxImg from '../images/dinamax.png';
import Pokemon from './Pokemon';
import AddPokemon from './AddPokemon';
import PokemonNameSearch from './PokemonNameSearch';
import ModalMonedas from './modals/ModalMonedas.js';
import ModalTienda from './modals/ModalTienda.js';
import ModalBattle from './modals/ModalBattle.js';
import ModalSpecialAttacks from './modals/ModalSpecialAttacks.js';
import { FIELD_MOVES } from '../battleRules';
import { getTrainerImage } from '../data/trainers';
// Iconos de la barra de acciones: dado para el sorteo de tipos/metrónomo,
// icono de clima para las cartas de campo, y el de intercambio de siempre
import diceIcon  from '../images/dices/dice6.png';
import fieldIcon from '../images/Effects/Field/Cloudy.png';
import tradeIcon from '../images/changePoke.png';
// pokecoins.png y no PokéCoin.png: el nombre acentuado está en disco como NFD
// y el import quedaría en NFC, que solo resuelve por suerte en macOS
import coinImg from '../images/pokecoins.png';


const getFieldCardImg = (id) => {
    try { return require(`../images/Field Moves/${id}.png`); } catch { return null; }
};

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

const Player = ({ game, currentPlayerTurn, currentPlayerView,AllPlayers, onNextTurn,onPrevTurn,onNextView,onPrevView, onAddPokemon,onEvolvePokemon, onDeletePokemon ,onUpdateCoins ,increaseLevel ,badgeWon,badgeLost, onAttach,onChangeState, onChangeStatus,onDecreaseStatusCounter,wildBattle,playerBattle,LeaderBattle,attachTM,attachMega,toggleDynamax,onApprovePurchase,onDenyPurchase,onMasterPurchase,onTradePokemon,onPauseGame,onSetFieldMove}) => {

    const handleKeyDown = useCallback((event) => {
        // Si el foco está en un campo de texto, las flechas mueven el cursor;
        // sin esto, escribir en el buscador de salvajes cambiaba de jugador
        const tag = event.target?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target?.isContentEditable) return;

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

  

    // El buscador ya devuelve el POKEDEX resuelto (se escriba el nombre o el número)
    const handleButtonWildPokemon = (pokedex) => {
        wildBattle(pokedex);
    };


    const [showModalCoins, setShowModalCoins] = useState(false);
    const [showModalStore, setShowModalStore] = useState(false);
    const [showModalBattle, setShowModalBattle] = useState(false);
    const [showSpecialAttacks, setShowSpecialAttacks] = useState(false);
    const [showFieldPicker, setShowFieldPicker] = useState(false);
    // Carta de un solo lado esperando que se elija a quién afecta
    const [pendingCard, setPendingCard] = useState(null);
    const [fieldWarning, setFieldWarning] = useState(null);

    const fieldMoves = game.fieldMoves || [null, null];
    const activeFieldCount = fieldMoves.filter(Boolean).length;

    // El catálogo se parte en dos: las globales afectan a los dos lados, las de
    // equipo solo al lado que se marque.
    const globalCards = FIELD_MOVES.filter(c => c.scope === 'global');
    const teamCards   = FIELD_MOVES.filter(c => c.scope === 'team');

    // Hay 2 espacios; la carta entra en el primero libre
    const placeCard = (cardId, owner) => {
        const free = fieldMoves.findIndex(f => !f);
        if (free === -1) {
            setFieldWarning('Los 2 espacios están ocupados. Quita una carta antes de poner otra.');
            return;
        }
        setFieldWarning(null);
        onSetFieldMove(free, cardId, owner);
    };

    const removeCard = (cardId) => {
        const idx = fieldMoves.findIndex(f => f && f.id === cardId);
        if (idx !== -1) onSetFieldMove(idx, null, null);
        setFieldWarning(null);
    };

    // Las globales se colocan de una; las de un solo lado preguntan el lado antes
    const handlePickCard = (card) => {
        if (fieldMoves.some(f => f && f.id === card.id)) return;   // ya está puesta
        if (fieldMoves.every(Boolean)) {
            setFieldWarning('Los 2 espacios están ocupados. Quita una carta antes de poner otra.');
            return;
        }
        setFieldWarning(null);
        if (card.scope === 'global') placeCard(card.id, null);
        else setPendingCard(card);
    };

    const closeFieldPicker = () => {
        setShowFieldPicker(false);
        setPendingCard(null);
        setFieldWarning(null);
    };

    const renderFieldOption = (card) => {
        const img = getFieldCardImg(card.id);
        const active = fieldMoves.find(f => f && f.id === card.id);
        return (
            <div key={card.id}
                 className={`field-option${active ? ' field-option--in-use' : ''}`}
                 title={card.note || ''}
                 onClick={() => handlePickCard(card)}>
                {img
                    ? <img className="field-option-img" src={img} alt={card.id} />
                    : <div className="field-option-name">{card.es}</div>}
                {active ? (
                    <div className="field-option-active">
                        <span className={`field-option-side field-option-side--${active.owner || 'global'}`}>
                            {card.scope === 'global' ? 'En juego'
                                : active.owner === 'player' ? 'En juego · Jugador'
                                : 'En juego · Rival'}
                        </span>
                        <button className="field-option-remove"
                                onClick={(e) => { e.stopPropagation(); removeCard(card.id); }}>
                            Quitar
                        </button>
                    </div>
                ) : (
                    <div className="field-option-tag">
                        {card.kind === 'reminder'
                            ? <span className="field-tag-manual">manual</span>
                            : <span className="field-tag-auto">automático</span>}
                    </div>
                )}
            </div>
        );
    };
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
        if (currentPlayerView[badgeNumber] === false) {
            if (num === 10) {
                const ok = window.confirm(`¿Confirmas que ${currentPlayerView.name} ganó el juego?`);
                if (!ok) return;
            }
            badgeWon(currentPlayerView.id, num);
        } else {
            badgeLost(currentPlayerView.id, num);
        }
    };

    

   

  

    if (!currentPlayerView) return null;

    const trainerImg = getTrainerImage(currentPlayerView.name);

    return (
        <div className="CurrentPlayerView">
            <header className="pv-topbar">

                <div className='pv-trainer'>
                    <div className='pv-trainer-avatar'
                         style={trainerImg ? { backgroundImage: `url(${trainerImg})` } : {}}>
                        {!trainerImg && currentPlayerView.name?.charAt(0)}
                    </div>
                    <div className='pv-trainer-meta'>
                        <div className='pv-trainer-name'>
                            {currentPlayerView.name}
                            <span className='pv-trainer-rank'>#{currentPlayerView.position}</span>
                        </div>
                        <div className='pv-trainer-points'>{currentPlayerView.points} pts</div>
                    </div>
                </div>

                <div className='pv-badges'>
                    {[1,2,3,4,5,6,7,8].map(num => {
                        const img = getBadgeImg(game.generation, num);
                        return (
                            <div
                                key={num}
                                className={`pv-badge ${currentPlayerView[`badge${num}`] ? 'Bagde_win' : 'Badge'}`}
                                style={img ? { backgroundImage: `url(${img})` } : {}}
                                onClick={() => handleBadge(num)}
                            />
                        );
                    })}
                    <div className={`pv-badge pv-badge--elite ${currentPlayerView.badge9 ? 'Bagde_win' : 'Badge'}`}
                         id='Elite' title='Alto Mando' onClick={()=> handleBadge(9)} />
                    <div className={`pv-badge pv-badge--champion ${currentPlayerView.badge10 ? 'Bagde_win' : 'Badge'}`}
                         id='BadgeChampion' title='Campeón' onClick={()=> handleBadge(10)} />
                </div>

                <div className='pv-coins' title='Monedas' onClick={handleOpenModalCoins}>
                    <div className='pv-coins-icon' style={{ backgroundImage: `url(${coinImg})` }} />
                    <span className='pv-coins-value'>{currentPlayerView.coins}</span>
                </div>
            </header>

          
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
                         mega = {pokemon.mega}
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
            <ModalSpecialAttacks show={showSpecialAttacks} onClose={() => setShowSpecialAttacks(false)} />

            {showFieldPicker && (
                <div className="modal-backdrop" onClick={closeFieldPicker}>
                    <div className="field-picker" onClick={e => e.stopPropagation()}>
                        <div className="field-picker-title">
                            Cartas de campo
                            <button className="field-picker-close" onClick={closeFieldPicker}>✕</button>
                        </div>

                        {fieldWarning && <div className="field-warning">{fieldWarning}</div>}

                        {pendingCard ? (
                            <div className="field-side-step">
                                <div className="field-side-step-card">
                                    {getFieldCardImg(pendingCard.id) && (
                                        <img className="field-side-step-img"
                                             src={getFieldCardImg(pendingCard.id)}
                                             alt={pendingCard.id} />
                                    )}
                                    <div className="field-side-step-name">{pendingCard.es}</div>
                                    {pendingCard.note && (
                                        <div className="field-side-step-note">{pendingCard.note}</div>
                                    )}
                                </div>
                                <div className="field-side-step-ask">
                                    ¿A qué lado afecta?
                                </div>
                                <div className="field-side-step-btns">
                                    <button className="field-side-btn field-side-btn--player"
                                            onClick={() => { placeCard(pendingCard.id, 'player'); setPendingCard(null); }}>
                                        Jugador
                                    </button>
                                    <button className="field-side-btn field-side-btn--rival"
                                            onClick={() => { placeCard(pendingCard.id, 'rival'); setPendingCard(null); }}>
                                        Rival
                                    </button>
                                </div>
                                <button className="field-side-cancel" onClick={() => setPendingCard(null)}>
                                    ← Volver
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="field-group">
                                    <div className="field-group-title field-group-title--global">
                                        Afectan a los dos lados
                                        <span className="field-group-count">{globalCards.length}</span>
                                    </div>
                                    <div className="field-picker-grid">{globalCards.map(renderFieldOption)}</div>
                                </div>

                                <div className="field-group">
                                    <div className="field-group-title field-group-title--team">
                                        Afectan a un solo lado
                                        <span className="field-group-count">{teamCards.length}</span>
                                    </div>
                                    <div className="field-picker-grid">{teamCards.map(renderFieldOption)}</div>
                                </div>
                            </>
                        )}

                        <div className="field-picker-note">
                            Las cartas <strong>automáticas</strong> se suman solas al total de batalla.
                            Las <strong>manuales</strong> solo se muestran como recordatorio a los jugadores.
                            Todas se descartan al pasar de turno.
                            <br />
                            En las cartas de un solo lado, el <strong>lado afectado</strong> es quien recibe
                            el efecto: en Spikes / Stealth Rock / Toxic Spikes es quien lo sufre,
                            en Mist / Safeguard / Renewal es quien se beneficia.
                        </div>
                    </div>
                </div>
            )}
          
                        

        <div className='pv-turns'>
            <div className='pv-turn-nav pv-turn-nav--prev' title='Turno anterior' onClick={onPrevTurn}>‹</div>

            <div className='pv-turn-track'>
                {AllPlayers.map((player, i) => {
                    const isTurn = currentPlayerTurn.id === player.id;
                    return (
                        <React.Fragment key={player.id}>
                            {i > 0 && <div className='pv-turn-link' />}
                            <div className={`pv-turn-chip${isTurn ? ' pv-turn-chip--active' : ''}`}>
                                <span className='pv-turn-number'>{i + 1}</span>
                                <span className='pv-turn-name'>{player.name}</span>
                                {isTurn && <span className='pv-turn-flag'>Turno</span>}
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>

            <div className='pv-turn-nav pv-turn-nav--next' title='Siguiente turno' onClick={onNextTurn}>›</div>
        </div>

            {/* Barra inferior: los mismos botones de siempre, pero agrupados por
                para qué sirven en vez de en el orden en que se fueron creando */}
            <div className='Botom_PlayerView pv-bottombar'>

                {/* Encuentros: dynamax + búsqueda de salvajes */}
                <div className='pv-bar-group'>
                    <span className='pv-bar-label'>Encuentro</span>
                    <div className='pv-bar-row'>
                        <div
                            className={`pv-dynamax dynamax-btn ${currentPlayerView.dynamax ? 'dynamax-on' : 'dynamax-off'}`}
                            title={currentPlayerView.dynamax ? 'Dynamax activo' : 'Dynamax gastado'}
                            onClick={() => toggleDynamax(currentPlayerView.id)}
                        >
                            <img src={dinamaxImg} alt="Dynamax" />
                        </div>

                        <PokemonNameSearch
                            className='pv-wild WildPokemon_imput'
                            placeholder='Salvaje: nombre o Pokédex'
                            buttonLabel='Buscar'
                            dropUp
                            onSubmit={handleButtonWildPokemon}
                        />
                    </div>
                </div>

                {/* Acciones de partida */}
                <div className='pv-bar-group'>
                    <span className='pv-bar-label'>Acciones</span>
                    <div className='pv-bar-row'>
                        <div className='pv-action pv-action--battle BattleMenu_Button' onClick={handleOpenModalBattle}>
                            Batalla
                        </div>
                        <div className='pv-action' title='Ataques especiales' onClick={() => setShowSpecialAttacks(true)}>
                            <span className='pv-action-icon' style={{ backgroundImage: `url(${diceIcon})` }} />
                            Especiales
                        </div>
                        <div className={`pv-action ${activeFieldCount > 0 ? 'pv-action--on' : ''}`}
                             title='Cartas de campo (clima, terrenos, trampas)'
                             onClick={() => setShowFieldPicker(true)}>
                            <span className='pv-action-icon' style={{ backgroundImage: `url(${fieldIcon})` }} />
                            Campo
                            {activeFieldCount > 0 && <span className='pv-action-count'>{activeFieldCount}</span>}
                        </div>
                        <div className='pv-action' title='Intercambiar Pokémon' onClick={() => setShowTradeModal(true)}>
                            <span className='pv-action-icon' style={{ backgroundImage: `url(${tradeIcon})` }} />
                            Intercambio
                        </div>
                    </div>
                </div>

                {/* Registro: lo que se consulta, no lo que se juega */}
                <div className='pv-bar-group pv-bar-group--right'>
                    <span className='pv-bar-label'>Registro</span>
                    <div className='pv-bar-row'>
                        <div className='pv-util' title='Tienda' onClick={handleOpenModalStore}>
                            <div className='pv-util-icon Button-store' />
                            <span className='pv-util-label'>Tienda</span>
                        </div>
                        <div className='pv-util' title='Historial' onClick={() => setShowPurchaseHistory(v => !v)}>
                            <div className='pv-util-icon Button-purchase-history' />
                            <span className='pv-util-label'>Historial</span>
                        </div>
                    </div>
                </div>

                {/* Estado de la partida */}
                <div className='pv-bar-status'>
                    <div className='pv-round'>
                        <span className='pv-round-label'>Ronda</span>
                        <span className='pv-round-value'>{game.round}</span>
                    </div>
                    <div className='pv-clock' title={`${currentPlayerView.hours}h ${currentPlayerView.minutes}m ${currentPlayerView.seconds}s`}>
                        {currentPlayerView.hours}h {currentPlayerView.minutes}m
                        <span className='pv-clock-sec'>{currentPlayerView.seconds}s</span>
                    </div>
                    <div className={`pv-pause PauseGameButton ${game?.paused ? 'PauseGameButton--paused' : ''}`}
                         title={game?.paused ? 'Reanudar' : 'Pausar'}
                         onClick={onPauseGame}>
                        {game?.paused ? '▶' : '⏸'}
                    </div>
                </div>
            </div>
        </div>


    );
};


export default Player;
