// Tope de caracteres del mote. El mismo límite se repite en el input del modal
// para que el recorte no sorprenda a nadie. A partir de aquí los motes largos
// se recortan con puntos suspensivos en las tarjetas más estrechas (las seis
// miniaturas del equipo en SimPlayer), que ya es como se comportan los nombres
// largos de siempre.
export const MOTE_MAX_LENGTH = 18;

class Pokemons {
    constructor(id,pokedex,name,type1,type2,level,attack1,attack2,attack3,nextLevel,evolution,mega) {
        this.id = id;
        this.pokedex = pokedex;
        this.name = name;
        this.type1 = type1;
        this.type2 = type2
        this.level = level;
        this.attack1 = attack1;
        this.attack2 = attack2;
        this.attack3 = attack3;
        this.extra = 0;
        this.nextLevel = nextLevel;
        this.totalLevel = level;
        this.attach = "None";
        this.status = "Normal";
        this.state = "Alive";
        this.evolution = evolution;
        this.mega= mega;
        this.statusCounter = 0;
        this.mote = '';
        // Tipo del Orbe Tera adjunto ("DARK", "STELLAR"...), en mayúsculas como
        // los tipos de la DB. Solo tiene valor mientras `attach` sea 'Tera'.
        this.teraType = null;
    }

    addAttack1(attack1) {
        this.attack1 = attack1;
    }
    addAttack2(attack2) {
        this.attack2 = attack2;
    }
    addAttack3(attack3) {
        this.attack3 = attack3;
    }
    addAttach(itemAttached) {
        this.attack3.name = "NONE";
        this.attack3.id = "000";
        this.attach = itemAttached;
        this.teraType = null;
    }

    // Las MTs y los cristales Z comparten mecanismo: un ataque que ocupa el
    // hueco de attack3 más un marcador en `attach`. Por eso son excluyentes —
    // adjuntar uno reemplaza al otro. `attachAs` distingue cuál es: "MT" o "Z".
    addTM(TM, attachAs = "MT") {
        this.attack3 = TM;
        this.attach = attachAs
        this.teraType = null;
        console.log(attachAs + " attached");
    }

    // Orbe Tera. Ocupa el mismo hueco que el resto de items —un Pokémon lleva
    // orbe o lleva MT/Z/Mega—, así que al ponerlo se limpia el ataque que
    // hubiera dejado una MT, igual que hace addAttach.
    //
    // El orbe NO cambia los tipos aquí: el Pokémon guardado conserva los suyos
    // y es la batalla la que decide si sube teracristalizado (ver applyTera en
    // frontend/src/data/teraTypes.js). Si se guardara ya transformado, el
    // Pokémon se quedaría con un solo tipo para siempre.
    addTera(teraType) {
        this.attack3.name = "NONE";
        this.attack3.id = "000";
        this.attach = "Tera";
        this.teraType = (teraType || '').toUpperCase() || null;
        console.log("Tera " + this.teraType + " attached");
    }
    addExtra(){
        if(this.extra > 5){
            this.extra =0
            this.totalLevel = this.level +this.extra;
        }
        else{ 
            this.extra += 1;
            this.totalLevel = this.level +this.extra;
        }
    }
    // El mote es puramente visual: la interfaz lo pinta en lugar del nombre,
    // pero `name` nunca cambia porque de él dependen los cristales Z, los
    // sprites por nombre y el historial. Vacío = sin mote.
    setMote(mote){
        this.mote = (mote || '').trim().slice(0, MOTE_MAX_LENGTH);
    }
    setStatus(status){
        this.status = status;
        if (status === 'Poisoned' || status === 'Burned') this.statusCounter = 4;
        else if (status === 'Cursed') this.statusCounter = 2;
        else this.statusCounter = 0;
    }
    decreaseStatusCounter(){
        if (this.statusCounter > 0) {
            this.statusCounter -= 1;
            if (this.statusCounter === 0) this.status = 'Normal';
        }
    }
    setState(){
        if(this.state === "Alive"){
            this.state = "Dead";
            this.status = "Normal";
            this.statusCounter = 0;
        }
        else{
            this.state = "Alive";
            this.status = "Normal";
            this.statusCounter = 0;
        }
    }
   
    




    // Otros métodos...
}

export default Pokemons;