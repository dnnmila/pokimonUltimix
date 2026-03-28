import React from 'react';


const ModalMonedas = ({ show, onClose,currentPlayer,onUpdateCoins}) => {
const coins_3 = currentPlayer.coins - (currentPlayer.coins/3);
  

    

    if (!show) {
        return null;
    }

    const updateMonedas = (monedas) => {
        onUpdateCoins(currentPlayer.id,monedas);
        console.log("updateMonedas" + monedas);
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-coins">
               <div  className='Title-modal' >Coins</div>
               <div className="Coins_all_options" >
                <div>Add Coins</div>
               <div className="add_coins_options" >
               <div onClick={() => updateMonedas(currentPlayer.coins+1)} className='coins-option add-one-coins'>+1</div>
               <div onClick={() => updateMonedas(currentPlayer.coins+5)} className='coins-option add-five-coins'>+5</div>
               </div>
               <div>Remove Coins</div>
               <div className="remove_coins_options" >
               <div onClick={() => updateMonedas(currentPlayer.coins-1)} className='coins-option remove-one-coin'>-1</div>
               <div onClick={() => updateMonedas(currentPlayer.coins-5)} className='coins-option remove-five-coins'>-5</div>
               <div onClick={() => updateMonedas(coins_3)} className='coins-option remove-1_3-coins'>1/3</div>
               <div onClick={() => updateMonedas(currentPlayer.coins/2)} className='coins-option remove-1_2-coins'>1/2</div>
               </div>
               </div>
                <button onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalMonedas;