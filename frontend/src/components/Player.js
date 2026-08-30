import React, {useState,useEffect,useCallback,useRef} from 'react';
import dinamaxImg from '../images/dinamax.png';
import Pokemon from './Pokemon';
import AddPokemon from './AddPokemon';
import PokemonNameSearch from './PokemonNameSearch';
import PokemonName from './PokemonName';
import ModalMonedas from './modals/ModalMonedas.js';
import ModalTienda from './modals/ModalTienda.js';
import ModalBattle from './modals/ModalBattle.js';
import ModalSpecialAttacks from './modals/ModalSpecialAttacks.js';
import ModalFieldPicker from './modals/ModalFieldPicker.js';
import { getTrainerAvatar } from '../data/trainers';
// Iconos de la barra de acciones: dado para el sorteo de tipos/metrónomo,
// icono de clima para las cartas de campo, y el de intercambio de siempre
import diceIcon  from '../images/dices/dice6.png';
import fieldIcon from '../images/Effects/Field/Cloudy.png';
import tradeIcon from '../images/changePoke.png';
// pokecoins.png y no PokéCoin.png: el nombre acentuado está en disco como NFD
// y el import quedaría en NFC, que solo resuelve por suerte en macOS
import coinImg from '../images/pokecoins.png';


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

const Player = ({ game, currentPlayerTurn, currentPlayerView,AllPlayers, onNextTurn,onPrevTurn,onNextView,onPrevView, onAddPokemon,onEvolvePokemon, onDeletePokemon ,onUpdateCoins ,increaseLevel ,badgeWon,badgeLost, onAttach,onChangeState, onChangeStatus,onDecreaseStatusCounter,wildBattle,playerBattle,LeaderBattle,attachTM,attachMega,attachTera,attachEquip,attachLegendary,toggleDynamax,onApprovePurchase,onDenyPurchase,onMasterPurchase,onSetStoreDiscount,onTradePokemon,onPauseGame,onSetFieldMove}) => {

    // El buscador ya devuelve el POKEDEX resuelto (se escriba el nombre o el número)
    const handleButtonWildPokemon = (pokedex) => {
        wildBattle(pokedex);
    };


    const [showModalCoins, setShowModalCoins] = useState(false);
    const [showModalStore, setShowModalStore] = useState(false);
    const [showDiscounts, setShowDiscounts] = useState(false);
    // Descuento de la tienda en curso, o null. Vive en la partida para que la
    // tablet del jugador vea los mismos precios que el máster.
    const storeDiscount = game.storeDiscount || null;
    const [showModalBattle, setShowModalBattle] = useState(false);
    const [showSpecialAttacks, setShowSpecialAttacks] = useState(false);
    const [showFieldPicker, setShowFieldPicker] = useState(false);

    const fieldMoves = game.fieldMoves || [null, null];
    const activeFieldCount = fieldMoves.filter(Boolean).length;

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

    // Las solicitudes llegan en cola (push en el backend), así que la primera de
    // la lista es la más antigua: es la que aprueba Enter.
    const pendingPurchases = game.pendingPurchases || [];
    // El estado del juego llega por sondeo, así que la solicitud sigue en la
    // lista un instante después de aprobarla; sin esta marca, dos Enter seguidos
    // la aprobarían (y cobrarían) dos veces.
    const approvedByKeyRef = useRef(new Set());
    const nextPending = pendingPurchases.find(req => !approvedByKeyRef.current.has(req.id)) || null;
    // El listener se registra una vez: lee la cola por referencia en lugar de
    // reengancharse en cada sondeo del estado
    const pendingRef = useRef(pendingPurchases);
    pendingRef.current = pendingPurchases;

    useEffect(() => {
        // Limpieza: en cuanto el backend confirma la baja, el id ya no estorba
        const liveIds = new Set((game.pendingPurchases || []).map(req => req.id));
        approvedByKeyRef.current.forEach(id => {
            if (!liveIds.has(id)) approvedByKeyRef.current.delete(id);
        });
    }, [game.pendingPurchases]);

    const anyModalOpen = showModalCoins || showModalStore || showModalBattle ||
                         showSpecialAttacks || showFieldPicker || showTradeModal ||
                         showPurchaseHistory;

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
            case 'Enter': {
                // Con un botón enfocado el navegador ya dispara su click, y
                // dejar la tecla pulsada no debe aprobar la cola entera
                if (tag === 'BUTTON' || tag === 'A' || event.repeat) return;
                if (anyModalOpen) return;
                // Se busca aquí y no en el render: dos Enter seguidos llegan
                // antes de que el sondeo repinte, y el segundo debe ver ya
                // marcada la solicitud que aprobó el primero
                const target = pendingRef.current.find(req => !approvedByKeyRef.current.has(req.id));
                if (!target) return;
                event.preventDefault();
                approvedByKeyRef.current.add(target.id);
                onApprovePurchase(target.id);
                break;
            }
            default:
                break;
        }
    }, [onNextView, onPrevView, anyModalOpen, onApprovePurchase]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]); // Ahora handleKeyDown es una dependencia


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

    const trainerImg = getTrainerAvatar(currentPlayerView.name);

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
                         mote={pokemon.mote}
                         level={pokemon.level}
                         extra={pokemon.extra}
                         nextLevel = {pokemon.nextLevel}
                         evolution = {pokemon.evolution}
                         attached = {pokemon.attach}
                         teraType = {pokemon.teraType}
                         equipItem = {pokemon.equipItem}
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
                         attachTera={attachTera}
                         attachEquip={attachEquip}
                         attachMega={attachMega}
                         attachLegendary={attachLegendary}
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
            <ModalTienda show={showModalStore} onClose={handleCloseModalStore} currentPlayer={currentPlayerView} onMasterPurchase={onMasterPurchase} discount={storeDiscount}/>

            {/* Descuentos de la tienda: se activan aquí y duran una ronda desde
                ese momento, así que el propio botón lleva la cuenta atrás. */}
            {showDiscounts && (
                <div className='modal-backdrop' onClick={() => setShowDiscounts(false)}>
                    <div className='discount-modal' onClick={e => e.stopPropagation()}>
                        <div className='discount-title'>Descuentos de la tienda</div>
                        <div className='discount-sub'>
                            Duran una ronda entera contada desde ahora: {game.players.length}
                            {game.players.length === 1 ? ' turno' : ' turnos'}, uno por jugador.
                        </div>

                        <div className='discount-options'>
                            {[25, 50].map(pct => (
                                <button key={pct}
                                        className={`discount-opt ${storeDiscount?.percent === pct ? 'is-on' : ''}`}
                                        onClick={() => { onSetStoreDiscount(pct); setShowDiscounts(false); }}>
                                    <span className='discount-opt-pct'>-{pct}%</span>
                                    <span className='discount-opt-note'>
                                        {pct === 25 ? 'Rebaja de temporada' : 'Todo a mitad de precio'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {storeDiscount ? (
                            <div className='discount-active'>
                                Ahora mismo: <strong>-{storeDiscount.percent}%</strong>, quedan{' '}
                                <strong>{storeDiscount.turnsLeft}</strong>
                                {storeDiscount.turnsLeft === 1 ? ' turno' : ' turnos'}.
                                Volver a pulsar reinicia la cuenta.
                            </div>
                        ) : (
                            <div className='discount-active discount-active--off'>
                                Precios normales.
                            </div>
                        )}

                        <div className='discount-actions'>
                            <button className='discount-off'
                                    disabled={!storeDiscount}
                                    onClick={() => { onSetStoreDiscount(0); setShowDiscounts(false); }}>
                                Quitar descuento
                            </button>
                            <button className='discount-close' onClick={() => setShowDiscounts(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                                    <PokemonName pkm={pkm} as="div" className="trade-pkm-name" />
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
                                                    <PokemonName pkm={pkm} as="div" className="trade-pkm-name" />
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
                                            <span className={`ph-price${entry.kind === 'sell' ? ' ph-price--sell' : ''}`}>
                                                {entry.kind === 'sell' ? '+' : '-'}${entry.price}
                                            </span>
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

            {pendingPurchases.length > 0 && (
                <div className="pending-purchases">
                    <div className="pending-purchases-title">Solicitudes</div>
                    {/* El signo y el color separan cobrar de pagar: aprobar una
                        venta le SUMA monedas al jugador, y eso tiene que verse
                        antes de pulsar el ✓, no después.
                        El Caramelo Raro no mueve monedas: en su hueco va el
                        nivel que se está aprobando. */}
                    {pendingPurchases.map(req => {
                        const isNext = nextPending?.id === req.id;
                        const isCandy = req.kind === 'rareCandy';
                        return (
                        <div key={req.id} className={`pending-purchase-item${isNext ? ' pending-purchase-item--next' : ''}`}>
                            <span className="pending-purchase-player">{req.playerName}</span>
                            <span className="pending-purchase-item-name">{req.item}</span>
                            {isCandy ? (
                                <span className="pending-purchase-price pending-purchase-price--level">
                                    Nv {req.fromLevel} → {req.toLevel}
                                </span>
                            ) : (
                                <span className={`pending-purchase-price${req.kind === 'sell' ? ' pending-purchase-price--sell' : ''}`}>
                                    {req.kind === 'sell' ? '+' : '-'}${req.price}
                                </span>
                            )}
                            {/* El ⏎ marca cuál aprueba la tecla: con varias en
                                cola hay que saber a cuál le toca */}
                            <button className="pending-approve" onClick={() => onApprovePurchase(req.id)}>
                                ✓{isNext && !anyModalOpen && <span className="pending-approve-key">⏎</span>}
                            </button>
                            <button className="pending-deny" onClick={() => onDenyPurchase(req.id)}>✕</button>
                        </div>
                        );
                    })}
                </div>
            )}
            <ModalBattle show={showModalBattle} onClose={handleCloseModalBattle} game={game} playerBattle={playerBattle} LeaderBattle={LeaderBattle}  />
            <ModalSpecialAttacks show={showSpecialAttacks} onClose={() => setShowSpecialAttacks(false)} />

            <ModalFieldPicker show={showFieldPicker}
                              onClose={() => setShowFieldPicker(false)}
                              fieldMoves={fieldMoves}
                              onSetFieldMove={onSetFieldMove} />
          
                        

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
                        <div className={`pv-util ${storeDiscount ? 'pv-util--on' : ''}`}
                             title='Descuentos de la tienda'
                             onClick={() => setShowDiscounts(true)}>
                            <div className='pv-util-icon Button-store pv-util-icon--discount' />
                            <span className='pv-util-label'>
                                {storeDiscount ? `-${storeDiscount.percent}%` : 'Descuentos'}
                            </span>
                            {storeDiscount && <span className='pv-util-count'>{storeDiscount.turnsLeft}</span>}
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
