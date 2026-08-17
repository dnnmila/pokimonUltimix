class Attacks {
    // `tm` solo lo llevan los ataques que vienen de una MT del catálogo:
    // { base, bono } — el poder impreso en la carta y si esa carta admite el
    // bono de tipo. Se guardan para poder recalcular el +1 cuando el Pokémon
    // evoluciona y cambian sus tipos; sin ellos habría que adivinar cuánto del
    // `strength` actual era carta y cuánto bono. Los ataques normales y las
    // MTs puestas a mano (tipo + poder) lo dejan en null.
    constructor(id,name,type,strength,effect,dice,tm = null) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.strength = strength;
        this.effect = effect;
        this.dice = dice;
        this.tm = tm;

    }




    // Otros métodos...
}

export default Attacks;
