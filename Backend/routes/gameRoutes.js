import { Router } from 'express';
const router = Router();
import { nextTurn,prevTurn,nextPlayerView,prevPlayerView ,startGame,wildBattle,playerBattle,leaderBattle,scanBattle,addPlayer,setMyBattleTotal,setMyBattlePokemon,setMyBattleAttack,setBattlePhase,simWildBattle,simLeaderBattle,toggleBattlePublic,setBattleDice,setBattleBonuses,setBattleBonusFinal,loadGameController} from '../controllers/gameController.js';
import { addPokemonToPlayer,addPokemonScanned, removePokemonToPlayer, updateCoins,badgeWon,badgeLost,addPoints,changePosition ,increaseLevel,evolvePokemon,attachItem,attachTM,changeState,changeStatus,attachMega,getEvolutionChain,toggleDynamax} from '../controllers/playerController.js';

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
router.post('/attach-item',attachItem);
router.post('/attach-TM',attachTM);
router.post('/change-state',changeState);
router.post('/change-status',changeStatus);
router.post('/wild-battle',wildBattle);
router.post('/player-battle',playerBattle);
router.post('/leader-battle',leaderBattle);
router.post('/attach-mega',attachMega);
router.post('/scan-battle-pokemon',scanBattle);
router.post('/sim-wild-battle',simWildBattle);
router.post('/sim-leader-battle',simLeaderBattle);
router.post('/toggle-battle-public',toggleBattlePublic);
router.post('/set-battle-dice',setBattleDice);
router.post('/set-battle-bonuses',setBattleBonuses);
router.post('/set-battle-bonus-final',setBattleBonusFinal);
router.post('/get-evolution-chain', getEvolutionChain);
router.post('/toggle-dynamax', toggleDynamax);
router.post('/load-game', loadGameController);






export default router;
