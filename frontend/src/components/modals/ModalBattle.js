


const ModalBattle = ({ show, onClose, game,playerBattle,LeaderBattle }) => {
   



    if (!show) {
        return null;
    }

    const handlePlayerBattle = (idPlayer) => {
        playerBattle(idPlayer);
        onClose();
    }
    const handleLeaderBattle = (idRival,IdPkm1,IdPkm2) => {
        LeaderBattle(idRival,IdPkm1,IdPkm2);
        onClose();
    }


    return (
        <div className="modal-backdrop">
                <div className="Modal-battles">
                    <div>Battle</div>
                    <div className='Players-to-battle'>
                        {game.players.map((player, index) => {
                            if (index !== game.currentTurn) {
                                return <button key={player.id} onClick={() => handlePlayerBattle(player.id)}>{player.name}</button>;
                            }
                            return null;
                        })}
                    </div>
                    <div className='Leaders-to-battle'>
                            <div className="Leader leader1" onClick={() => handleLeaderBattle("Gym1","Brock1","Brock2")} > </div>
                            <div className="Leader leader2" onClick={() => handleLeaderBattle("Gym2","Misty1","Misty2")}> </div>
                            <div className="Leader leader3" onClick={() => handleLeaderBattle("Gym3","Surge1","Surge2")}> </div>
                            <div className="Leader leader4" onClick={() => handleLeaderBattle("Gym4","Erika1","Erika2")}> </div>
                            <div className="Leader leader5" onClick={() => handleLeaderBattle("Gym5","Koga1","Koga2")}> </div>
                            <div className="Leader leader6" onClick={() => handleLeaderBattle("Gym6","Sabrina1","Sabrina2")}> </div>
                            <div className="Leader leader7" onClick={() => handleLeaderBattle("Gym7","Blaine1","Blaine2")}>  </div>
                            <div className="Leader leader8" onClick={() => handleLeaderBattle("Gym8","Giovanni1","Giovanni2")}> </div>
                    </div>

                    <div className='Elite-to-battle'>
                            <div className="Elite Elite1" onClick={() => handleLeaderBattle("Elite1","Agatha1","Agatha2")}> </div>
                            <div className="Elite Elite2" onClick={() => handleLeaderBattle("Elite2","Bruno1","Bruno2")}> </div>
                            <div className="Elite Elite3" onClick={() => handleLeaderBattle("Elite3","Lorelei1","Lorelei2")}> </div>
                            <div className="Elite Elite4" onClick={() => handleLeaderBattle("Elite4","Lance1","Lance2")}> </div>
                    </div>

                    <div className='Special-to-battle'>
                            <div className="Elite Rocket1" onClick={() => handleLeaderBattle("Rocket","Rocket1","Rocket2")}> </div>
                            <div className="Elite Blue1" onClick={() => handleLeaderBattle("BlueC1","Blue1","Blue2")}> </div>
                            <div className="Elite Blue2" onClick={() => handleLeaderBattle("BlueC2","Blue3","Blue4")}> </div>
                            <div className="Elite Blue3" onClick={() => handleLeaderBattle("BlueC3","Blue5","Blue6")}> </div>
                    </div>
                    <div className='Gary-to-battle'>
                            <div className="Elite GaryPink"   onClick={() => handleLeaderBattle("GaryPink",  "Gary1",  "Gary2")}> </div>
                            <div className="Elite GaryGreen"  onClick={() => handleLeaderBattle("GaryGreen", "Gary3",  "Gary4")}> </div>
                            <div className="Elite GaryBlue"   onClick={() => handleLeaderBattle("GaryBlue",  "Gary5",  "Gary6")}> </div>
                            <div className="Elite GaryYellow" onClick={() => handleLeaderBattle("GaryYellow","Gary7",  "Gary8")}> </div>
                            <div className="Elite GaryRed"    onClick={() => handleLeaderBattle("GaryRed",   "Gary9",  "Gary10")}> </div>
                    </div>

                    <div className="close-blattle-modal" onClick={onClose}>Close</div>
                </div>


               
           

          
        </div>
    );
};


export default ModalBattle;