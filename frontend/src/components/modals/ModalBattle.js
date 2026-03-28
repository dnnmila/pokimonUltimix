


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
                            <div className="Elite Red" onClick={() => handleLeaderBattle("Red","Red1","Red2")}> </div>
                              
                    </div>

                    <div className='Special-to-battle'>
                            <div className="Elite Rocket1" onClick={() => handleLeaderBattle("Ariadna","Ariadna1","Ariadna2")}> </div>  
                            <div className="Elite Rocket2" onClick={() => handleLeaderBattle("Petrel","Petrel1","Petrel2")}> </div>  
                            <div className="Elite Blue1" onClick={() => handleLeaderBattle("Blue1","BluePink1","BluePink2")}> </div>
                            <div className="Elite Blue2" onClick={() => handleLeaderBattle("Blue2","BlueGreen1","BlueGreen2")}> </div> 
                            <div className="Elite Blue3" onClick={() => handleLeaderBattle("Blue3","BlueBlue1","BlueBlue2")}> </div> 
                            <div className="Elite Blue4" onClick={() => handleLeaderBattle("Blue4","BlueYellow1","BlueYellow2")}> </div> 
                            <div className="Elite Blue5" onClick={() => handleLeaderBattle("Blue5","BlueRed1","BlueRed2")}> </div>   
                    </div>
                    <div className="close-blattle-modal" onClick={onClose}>Close</div>
                </div>


               
           

          
        </div>
    );
};


export default ModalBattle;