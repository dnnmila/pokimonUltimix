import React from 'react';


const ModalTienda = ({ show, onClose, currentPlayer, onMasterPurchase }) => {

    if (!show) {
        return null;
    }

    const buyItem = (itemName, precio) => {
        if (currentPlayer.coins >= precio) {
            onMasterPurchase(currentPlayer.id, itemName, precio);
            console.log("item comprado");
            onClose();
        } else {
            console.log("not enough money");
        }
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-store">
               <div className='Title-modal'>Store</div>
               <div className="store_all_options" > 

               <div onClick={() => buyItem('Pokeball', 4)} className='store-option'>
                <div className='store-option-img img-pokeball'></div>
                <div className='store-option-name'>Pokeball</div>
                <div className='store-option-cost'>4</div>
                </div>

                <div onClick={() => buyItem('X Attack(1)', 4)} className='store-option'>
                <div className='store-option-img img-XAttk'></div>
                <div className='store-option-name'>X Attack(1)</div>
                <div className='store-option-cost'>4</div>
                </div>

                <div onClick={() => buyItem('Great Ball', 8)} className='store-option'>
                <div className='store-option-img img-greatBall'></div>
                <div className='store-option-name'>Great Ball</div>
                <div className='store-option-cost'>8</div>
                </div>

                <div onClick={() => buyItem('X Attack(2)', 8)} className='store-option'>
                <div className='store-option-img img-XAttk'></div>
                <div className='store-option-name'>X Attack(2)</div>
                <div className='store-option-cost'>8</div>
                </div>

                <div onClick={() => buyItem('Ultra Ball', 12)} className='store-option'>
                <div className='store-option-img img-ultraBall'></div>
                <div className='store-option-name'>Ultra Ball</div>
                <div className='store-option-cost'>12</div>
                </div>

                <div onClick={() => buyItem('X Attack(3)', 16)} className='store-option'>
                <div className='store-option-img img-XAttk'></div>
                <div className='store-option-name'>X Attack(3)</div>
                <div className='store-option-cost'>16</div>
                </div>

                <div onClick={() => buyItem('Potion', 4)} className='store-option'>
                <div className='store-option-img img-potion'></div>
                <div className='store-option-name'>Potion</div>
                <div className='store-option-cost'>4</div>
                </div>

                <div onClick={() => buyItem('X Defense', 4)} className='store-option'>
                <div className='store-option-img img-XDef'></div>
                <div className='store-option-name'>X Defense</div>
                <div className='store-option-cost'>4</div>
                </div>

                <div onClick={() => buyItem('Revive', 8)} className='store-option'>
                <div className='store-option-img img-Revive'></div>
                <div className='store-option-name'>Revive</div>
                <div className='store-option-cost'>8</div>
                </div>

                <div onClick={() => buyItem('X Accuracy', 4)} className='store-option'>
                <div className='store-option-img img-XAcc'></div>
                <div className='store-option-name'>X Accuracy</div>
                <div className='store-option-cost'>4</div>
                </div>

                <div onClick={() => buyItem('Max Revive', 16)} className='store-option'>
                <div className='store-option-img img-MaxRevive'></div>
                <div className='store-option-name'>Max Revive</div>
                <div className='store-option-cost'>16</div>
                </div>

                <div onClick={() => buyItem('Guard Spec.', 6)} className='store-option'>
                <div className='store-option-img img-GuardSpec'></div>
                <div className='store-option-name'>Guard Spec.</div>
                <div className='store-option-cost'>6</div>
                </div>

                <div onClick={() => buyItem('Full Heal', 6)} className='store-option'>
                <div className='store-option-img img-FullHeal'></div>
                <div className='store-option-name'>Full Heal</div>
                <div className='store-option-cost'>6</div>
                </div>

                <div onClick={() => buyItem('TM', 16)} className='store-option'>
                <div className='store-option-img img-TM'></div>
                <div className='store-option-name'>TM</div>
                <div className='store-option-cost'>16</div>
                </div>

                <div onClick={() => buyItem('Escape Rope', 2)} className='store-option'>
                <div className='store-option-img img-EscapeRope'></div>
                <div className='store-option-name'>Escape Rope</div>
                <div className='store-option-cost'>2</div>
                </div>

                <div onClick={() => buyItem('Mega Bracelet', 16)} className='store-option'>
                <div className='store-option-img img-MegaBracelet'></div>
                <div className='store-option-name'>Mega Bracelet</div>
                <div className='store-option-cost'>16</div>
                </div>

                <div onClick={() => buyItem('Bicycle', 16)} className='store-option'>
                <div className='store-option-img img-Bicycle'></div>
                <div className='store-option-name'>Bicycle</div>
                <div className='store-option-cost'>16</div>
                </div>

                <div onClick={() => buyItem('Mega Stone', 8)} className='store-option'>
                <div className='store-option-img img-MegaStone'></div>
                <div className='store-option-name'>Mega Stone</div>
                <div className='store-option-cost'>8</div>
                </div>

                <div onClick={() => buyItem('Poke Doll', 16)} className='store-option'>
                <div className='store-option-img img-PokeDoll'></div>
                <div className='store-option-name'>Poke Doll</div>
                <div className='store-option-cost'>16</div>
                </div>

                <div onClick={() => buyItem('Dynamax', 16)} className='store-option'>
                <div className='store-option-img img-Dynamax'></div>
                <div className='store-option-name'>Dynamax</div>
                <div className='store-option-cost'>16</div>
                </div>


             

   

               </div>
              
        
                <button onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default ModalTienda;