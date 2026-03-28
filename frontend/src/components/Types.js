import React from 'react';

const Types = ({ type_id ,Type, Clase }) => {
   
    let Classes = `Type_class ${Clase}`;

    return (
        <div className="Types"  >
            <div id={type_id}  className={Classes} >{Type}</div>
        </div>
    )
};

export default Types;