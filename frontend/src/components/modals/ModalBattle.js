import { useState, useEffect } from 'react';
import SERVER_IP from '../../config.js';

const LEADER_PREFIXES = ['gym', 'Riv'];
const getLeaderImg = (img, generation) => {
    if (!img) return null;
    if (LEADER_PREFIXES.some(p => img.startsWith(p)))
        return require(`../../images/Leaders${generation}/${img}.png`);
    return null;
};

const ModalBattle = ({ show, onClose, game, playerBattle, LeaderBattle }) => {
    const [leaders, setLeaders] = useState([]);
    const generation = game?.generation || 1;

    useEffect(() => {
        if (!show) return;
        fetch(`${SERVER_IP}/get-leaders?generation=${generation}`)
            .then(r => r.json())
            .then(data => setLeaders(data))
            .catch(console.error);
    }, [show, generation]);

    if (!show) return null;

    const handlePlayerBattle = (idPlayer) => { playerBattle(idPlayer); onClose(); };
    const handleLeaderBattle = (idRival, uid1, uid2) => { LeaderBattle(idRival, uid1, uid2); onClose(); };

    const gyms    = leaders.filter(l => l.category === 'gym');
    const elites  = leaders.filter(l => l.category === 'elite');
    const champs  = leaders.filter(l => l.category === 'champion');
    const rockets = leaders.filter(l => l.category === 'rocket');
    const rivals  = leaders.filter(l => l.category === 'rival');

    const LeaderCard = ({ leader, className }) => {
        const img = getLeaderImg(leader.img, generation);
        return (
            <div
                className={className}
                style={img ? { backgroundImage: `url(${img})` } : {}}
                onClick={() => handleLeaderBattle(leader.leaderKey, leader.uid1, leader.uid2)}
            />
        );
    };

    return (
        <div className="modal-backdrop">
            <div className="Modal-battles">
                <div>Battle — Gen {generation}</div>

                <div className='Players-to-battle'>
                    {game.players.map((player, index) => {
                        if (index !== game.currentTurn)
                            return <button key={player.id} onClick={() => handlePlayerBattle(player.id)}>{player.name}</button>;
                        return null;
                    })}
                </div>

                <div className='Leaders-to-battle'>
                    {gyms.map(l => <LeaderCard key={l.leaderKey} leader={l} className="Leader" />)}
                </div>

                <div className='Elite-to-battle'>
                    {elites.map(l => <LeaderCard key={l.leaderKey} leader={l} className="Elite" />)}
                </div>

                <div className='Special-to-battle'>
                    {[...champs, ...rockets].map(l => <LeaderCard key={l.leaderKey} leader={l} className="Elite" />)}
                </div>

                <div className='Gary-to-battle'>
                    {rivals.map(l => <LeaderCard key={l.leaderKey} leader={l} className="Elite" />)}
                </div>

                <div className="close-blattle-modal" onClick={onClose}>Close</div>
            </div>
        </div>
    );
};

export default ModalBattle;
