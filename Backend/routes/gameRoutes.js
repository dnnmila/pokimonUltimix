import { Router } from 'express';
const router = Router();
import { nextTurn,prevTurn,nextPlayerView,prevPlayerView ,startGame,wildBattle,playerBattle,leaderBattle,scanBattle,addPlayer,setMyBattleTotal,setMyBattlePokemon,setMyBattleAttack,setBattlePhase,setFormsView,simWildBattle,simLeaderBattle,simPlayerBattle,toggleBattlePublic,setBattleDice,setBattleBonuses,setBattleBonusFinal,loadGameController,saveInfoController,setGeneration,getLeadersByGeneration,getPokemonList,getRandomPokemon,getPokemonCard,changeWeather,setFieldMove,requestPurchase,approvePurchase,denyPurchase,startSimMirror,simRematch,pauseGame,endGame,raidStart,raidTeam,raidRound,raidFinish,raidClear,hordeStart,hordeTeam,hordeRound,hordeFinish,hordeClear,trainerBattleStart,trainerBattleRound,trainerBattleClear,royaleStart,royaleRound,royaleClear,frontierBattleStart,frontierBattleFinish,frontierBattleClear,pokeStarStart,pokeStarLevel,pokeStarClear,setStoreDiscount,getMegaForms,getRandomMega,simMegaBattle,undergroundBattle,setEventMirror,getMapCoords,getBoardNodes,saveMapCoords,saveBoardNodes} from '../controllers/gameController.js';
import { addPokemonToPlayer,addPokemonScanned, removePokemonToPlayer, updateCoins,badgeWon,badgeLost,gymChallengeStart,gymChallengeWin,gymDefeat,addPoints,changePosition ,increaseLevel,evolvePokemon,attachItem,attachTM,changeState,changeStatus,setMote,attachMega,attachLegendary,getEvolutionChain,getPossibleEvolutions,toggleDynamax,masterPurchase,decreaseStatusCounter,tradePokemon,toggleFrontier,attachTera,attachEquip,bagAdd,bagRemove,markEventUsed,updateMapPosition,toggleSurf} from '../controllers/playerController.js';

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
router.post('/gym-challenge-start', gymChallengeStart);
router.post('/gym-challenge-win', gymChallengeWin);
router.post('/gym-defeat', gymDefeat);
router.post('/add-points', addPoints);
router.post('/change-position', changePosition);
router.post('/increase-level', increaseLevel);
router.post('/evolve-pokemon',evolvePokemon);
router.post('/trade-pokemon', tradePokemon);
router.post('/toggle-frontier', toggleFrontier);
router.post('/attach-item',attachItem);
router.post('/attach-TM',attachTM);
router.post('/attach-tera',attachTera);
router.post('/attach-equip',attachEquip);
router.post('/change-state',changeState);
router.post('/change-status',changeStatus);
router.post('/set-mote',setMote);
router.post('/decrease-status-counter',decreaseStatusCounter);
router.post('/wild-battle',wildBattle);
router.post('/player-battle',playerBattle);
router.post('/leader-battle',leaderBattle);
router.post('/attach-mega',attachMega);
router.post('/attach-legendary',attachLegendary);
router.post('/bag-add',bagAdd);
router.post('/bag-remove',bagRemove);
router.post('/event-used',markEventUsed);
router.post('/scan-battle-pokemon',scanBattle);
router.post('/sim-wild-battle',simWildBattle);
router.post('/sim-leader-battle',simLeaderBattle);
router.post('/sim-player-battle',simPlayerBattle);
router.post('/toggle-battle-public',toggleBattlePublic);
router.post('/start-sim-mirror',startSimMirror);
router.post('/sim-rematch',simRematch);
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
router.get('/pokemon-card', getPokemonCard);
router.post('/raid-start', raidStart);
router.post('/raid-team', raidTeam);
router.post('/raid-round', raidRound);
router.post('/raid-finish', raidFinish);
router.post('/raid-clear', raidClear);
router.post('/horde-start', hordeStart);
router.post('/horde-team', hordeTeam);
router.post('/horde-round', hordeRound);
router.post('/horde-finish', hordeFinish);
router.post('/horde-clear', hordeClear);
router.post('/trainer-battle-start', trainerBattleStart);
router.post('/trainer-battle-round', trainerBattleRound);
router.post('/trainer-battle-clear', trainerBattleClear);
router.post('/royale-start', royaleStart);
router.post('/royale-round', royaleRound);
router.post('/royale-clear', royaleClear);
router.post('/frontier-battle-start', frontierBattleStart);
router.post('/frontier-battle-finish', frontierBattleFinish);
router.post('/frontier-battle-clear', frontierBattleClear);
router.post('/poke-star-start', pokeStarStart);
router.post('/poke-star-level', pokeStarLevel);
router.post('/poke-star-clear', pokeStarClear);
router.post('/set-store-discount', setStoreDiscount);
router.get('/mega-forms', getMegaForms);
router.get('/random-mega', getRandomMega);
router.post('/sim-mega-battle', simMegaBattle);
router.post('/underground-battle', undergroundBattle);
router.post('/event-mirror', setEventMirror);
router.post('/change-weather', changeWeather);
router.post('/set-field-move', setFieldMove);
router.post('/request-purchase', requestPurchase);
router.post('/approve-purchase', approvePurchase);
router.post('/deny-purchase', denyPurchase);
router.post('/master-purchase', masterPurchase);
router.post('/pause-game', pauseGame);
router.post('/end-game', endGame);

// Mapa interactivo
router.get('/map-coords/:gen', getMapCoords);
router.get('/board-nodes/:gen', getBoardNodes);
router.post('/map-coords/:gen', saveMapCoords);     // /map-editor
router.post('/board-nodes/:gen', saveBoardNodes);   // /map-editor
router.post('/update-map-position', updateMapPosition);
router.post('/toggle-surf', toggleSurf);






export default router;
