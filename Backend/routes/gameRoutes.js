import { Router } from 'express';
const router = Router();
import { nextTurn,prevTurn,nextPlayerView,prevPlayerView ,startGame,wildBattle,playerBattle,leaderBattle,scanBattle,addPlayer,setMyBattleTotal,setMyBattlePokemon,setMyBattleAttack,setBattlePhase,simWildBattle,simLeaderBattle,simPlayerBattle,toggleBattlePublic,setBattleDice,setBattleBonuses,setBattleBonusFinal,loadGameController,setGeneration,getLeadersByGeneration,getPokemonList,getRandomPokemon,changeWeather,setFieldMove,requestPurchase,approvePurchase,denyPurchase,startSimMirror,pauseGame,endGame} from '../controllers/gameController.js';
import { addPokemonToPlayer,addPokemonScanned, removePokemonToPlayer, updateCoins,badgeWon,badgeLost,addPoints,changePosition ,increaseLevel,evolvePokemon,attachItem,attachTM,changeState,changeStatus,attachMega,getEvolutionChain,getPossibleEvolutions,toggleDynamax,masterPurchase,decreaseStatusCounter,tradePokemon,toggleFrontier} from '../controllers/playerController.js';

// Ruta para crear un nuevo juego
//router.post('/game', createGame);
router.post('/add-player', addPlayer);
router.post('/set-my-battle-total', setMyBattleTotal);
router.post('/set-my-battle-pokemon', setMyBattlePokemon);
router.post('/set-my-battle-attack', setMyBattleAttack);
router.post('/set-battle-phase', setBattlePhase);
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
router.post('/change-state',changeState);
router.post('/change-status',changeStatus);
router.post('/decrease-status-counter',decreaseStatusCounter);
router.post('/wild-battle',wildBattle);
router.post('/player-battle',playerBattle);
router.post('/leader-battle',leaderBattle);
router.post('/attach-mega',attachMega);
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
router.post('/set-generation', setGeneration);
router.get('/get-leaders', getLeadersByGeneration);
router.get('/pokemon-list', getPokemonList);
router.get('/random-pokemon', getRandomPokemon);
router.post('/change-weather', changeWeather);
router.post('/set-field-move', setFieldMove);
router.post('/request-purchase', requestPurchase);
router.post('/approve-purchase', approvePurchase);
router.post('/deny-purchase', denyPurchase);
router.post('/master-purchase', masterPurchase);
router.post('/pause-game', pauseGame);
router.post('/end-game', endGame);






export default router;
