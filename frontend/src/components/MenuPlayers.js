import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const MenuPlayers = ({addPlayer}) => {
    // Hook para realizar la navegación programática
    const navigate = useNavigate();
    const [nextPlayerNumber, setNextPlayerNumber] = useState(1);
    const [addedPlayers, setAddedPlayers] = useState([]);

    // Función que se ejecuta al hacer clic en el botón "Start Game"
    const handleStartGame = () => {
        navigate("/game"); // Redirige a la ruta del jugador
    };

    const handleAddPlayer = (playerName) => {
        const idPlayer = `P${nextPlayerNumber}`; // ID en formato "P1", "P2", etc.
        const turn = nextPlayerNumber; 
        console.log("Turn " + turn);
        console.log("idPlayer " + idPlayer);
        
        addPlayer(idPlayer,playerName,turn);
        setAddedPlayers([...addedPlayers, playerName]);
        setNextPlayerNumber(nextPlayerNumber + 1);
    }

    const isPlayerAdded = (playerName) => addedPlayers.includes(playerName);
    return (
        <div className='main-select-Menu'>
          
        <div className= 'all-Trainers-select ' > 
            {!isPlayerAdded("Mila") && <div className='trainer-tag' onClick={() => handleAddPlayer("Mila")}>
                <div className='image-trainer trainer1'> </div>
                <div className='name-trainer'> Mila </div></div>}
            {!isPlayerAdded("Wuicho") && <div className='trainer-tag' onClick={() => handleAddPlayer("Wuicho")}>
                <div className='image-trainer trainer2'> </div>
                <div className='name-trainer'> Wuicho </div></div>}
            {!isPlayerAdded("Kevin") && <div className='trainer-tag' onClick={() => handleAddPlayer("Kevin")}>
            <div className='image-trainer trainer3'> </div>
                <div className='name-trainer'> Kevin </div></div>}
            {!isPlayerAdded("Kampis") && <div className='trainer-tag' onClick={() => handleAddPlayer("Kampis")}>
            <div className='image-trainer trainer4'> </div>
                <div className='name-trainer'> Kampis </div></div>}
            {!isPlayerAdded("Mandito") && <div className='trainer-tag' onClick={() => handleAddPlayer("Mandito")}>
            <div className='image-trainer trainer5'> </div>
                <div className='name-trainer'> Mandito </div></div>}
            {!isPlayerAdded("Doc") && <div className='trainer-tag' onClick={() => handleAddPlayer("Doc")}>
            <div className='image-trainer trainer6'> </div>
                <div className='name-trainer'> Doc </div></div>}
            {!isPlayerAdded("Tacho") && <div className='trainer-tag' onClick={() => handleAddPlayer("Tacho")}>
            <div className='image-trainer trainer7'> </div>
                <div className='name-trainer'> Tacho </div></div>}
            {!isPlayerAdded("Fede") && <div className='trainer-tag' onClick={() => handleAddPlayer("Fede")}>
            <div className='image-trainer trainer8'> </div>
                <div className='name-trainer'> Fede </div></div>}
            {!isPlayerAdded("Perry") && <div className='trainer-tag' onClick={() => handleAddPlayer("Perry")}>
            <div className='image-trainer trainer9'> </div>
                <div className='name-trainer'> Perry </div></div>}
            {!isPlayerAdded("Richi") && <div className='trainer-tag' onClick={() => handleAddPlayer("Richi")}>
            <div className='image-trainer trainer10'> </div>
                <div className='name-trainer'> Richi </div></div>}
            {!isPlayerAdded("Mono") && <div className='trainer-tag' onClick={() => handleAddPlayer("Mono")}>
            <div className='image-trainer trainer11'> </div>
                <div className='name-trainer'> Mono </div></div>}
            {!isPlayerAdded("Foxi") && <div className='trainer-tag' onClick={() => handleAddPlayer("Foxi")}>
            <div className='image-trainer trainer2'> </div>
                <div className='name-trainer'> Foxi </div></div>}
           
            
            </div>
            <div className='button-to-start'> 
            {nextPlayerNumber >= 4 && <div onClick={handleStartGame} className='boton-start-playing'>Start Playing</div>}
            </div>
           
        </div>
    );
};

export default MenuPlayers;
