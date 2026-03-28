import React from 'react';


const Modal = ({ show, onClose,title, children }) => {
    if (!show) {
        return null;
    }
    console.log('Modal');
    console.log(children);

    return (
        <div className="modal-backdrop">
            <div className="modal2">
            <h2>{title}</h2>
                {children}
                <button onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};

export default Modal;
