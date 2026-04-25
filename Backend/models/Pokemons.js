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
    }

    addTM(TM) {
        this.attack3 = TM;
        this.attach = "MT"
        console.log("TM attached");
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