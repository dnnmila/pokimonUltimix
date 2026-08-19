import { Router } from 'express';
const router = Router();
import { nextTurn,prevTurn,nextPlayerView,prevPlayerView ,startGame,wildBattle,playerBattle,leaderBattle,scanBattle,addPlayer,setMyBattleTotal,setMyBattlePokemon,setMyBattleAttack,setBattlePhase,setFormsView,simWildBattle,simLeaderBattle,simPlayerBattle,toggleBattlePublic,setBattleDice,setBattleBonuses,setBattleBonusFinal,loadGameController,saveInfoController,setGeneration,getLeadersByGeneration,getPokemonList,getRandomPokemon,changeWeather,setFieldMove,requestPurchase,approvePurchase,denyPurchase,startSimMirror,pauseGame,endGame,raidStart,raidTeam,raidRound,raidFinish,raidClear,getMegaForms,getRandomMega,simMegaBattle} from '../controllers/gameController.js';
import { addPokemonToPlayer,addPokemonScanned, removePokemonToPlayer, updateCoins,badgeWon,badgeLost,addPoints,changePosition ,increaseLevel,evolvePokemon,attachItem,attachTM,changeState,changeStatus,setMote,attachMega,getEvolutionChain,getPossibleEvolutions,toggleDynamax,masterPurchase,decreaseStatusCounter,tradePokemon,toggleFrontier,attachTera,bagAdd,bagRemove,markEventUsed} from '../controllers/playerController.js';

// Ruta para crear un nuevo juego
//router.post('/game', createGame);
router.post('/add-player', addPlayer);
router.post('/set-my-battle-total', setMyBattleTotal);
router.post('/set-my-battle-pokemon', setMyBattlePokemon);
router.post('/set-my-battle-attack', setMyBattleAttack);
router.post('/set-battle-phase', setBattlePhase);
router.post('/set-forms-view', setFormsView);
router.post('/next-turn', nextTurn);
router.post('/prev-turn', prevTurn);
router.post('/next-view', nextPlayerView);
router.post('/prev-view', prevPlayerView);
router.post('/start-game', startGame);
router.post('/add-pokemon', addPokemonToPlayer);
router.post('/scan-pokemon', addPokemonScanned);
router.post('/remove-pokemon', removePokemonToPlayer);
router.post('/update-coins', updateCoins);
router.post('/badge-won', badgeWon);
router.post('/badge-lost', badgeLost);
router.post('/add-points', addPoints);
router.post('/change-position', changePosition);
router.post('/increase-level', increaseLevel);
router.post('/evolve-pokemon',evolvePokemon);
router.post('/trade-pokemon', tradePokemon);
router.post('/toggle-frontier', toggleFrontier);
router.post('/attach-item',attachItem);
router.post('/attach-TM',attachTM);
router.post('/attach-tera',attachTera);
router.post('/change-state',changeState);
router.post('/change-status',changeStatus);
router.post('/set-mote',setMote);
router.post('/decrease-status-counter',decreaseStatusCounter);
router.post('/wild-battle',wildBattle);
router.post('/player-battle',playerBattle);
router.post('/leader-battle',leaderBattle);
router.post('/attach-mega',attachMega);
router.post('/bag-add',bagAdd);
router.post('/bag-remove',bagRemove);
router.post('/event-used',markEventUsed);
router.post('/scan-battle-pokemon',scanBattle);
router.post('/sim-wild-battle',simWildBattle);
router.post('/sim-leader-battle',simLeaderBattle);
router.post('/sim-player-battle',simPlayerBattle);
router.post('/toggle-battle-public',toggleBattlePublic);
router.post('/start-sim-mirror',startSimMirror);
router.post('/set-battle-dice',setBattleDice);
router.post('/set-battle-bonuses',setBattleBonuses);
router.post('/set-battle-bonus-final',setBattleBonusFinal);
router.post('/get-evolution-chain', getEvolutionChain);
router.post('/get-possible-evolutions', getPossibleEvolutions);
router.post('/toggle-dynamax', toggleDynamax);
router.post('/load-game', loadGameController);
router.get('/save-info', saveInfoController);
router.post('/set-generation', setGeneration);
router.get('/get-leaders', getLeadersByGeneration);
router.get('/pokemon-list', getPokemonList);
router.get('/random-pokemon', getRandomPokemon);
router.post('/raid-start', raidStart);
router.post('/raid-team', raidTeam);
router.post('/raid-round', raidRound);
router.post('/raid-finish', raidFinish);
router.post('/raid-clear', raidClear);
router.get('/mega-forms', getMegaForms);
router.get('/random-mega', getRandomMega);
router.post('/sim-mega-battle', simMegaBattle);
router.post('/change-weather', changeWeather);
router.post('/set-field-move', setFieldMove);
router.post('/request-purchase', requestPurchase);
router.post('/approve-purchase', approvePurchase);
router.post('/deny-purchase', denyPurchase);
router.post('/master-purchase', masterPurchase);
router.post('/pause-game', pauseGame);
router.post('/end-game', endGame);






export default router;
