import { useNavigate } from 'react-router-dom';
import '../styles/_selectGeneration.scss';
import { GENERATIONS } from '../data/generations';

const SelectGeneration = ({ onSetGeneration }) => {
    const navigate = useNavigate();

    const handleSelect = async (gen) => {
        await onSetGeneration(gen);
        navigate('/menuPlayers');
    };

    return (
        <div className='gen-screen'>
            <div className='gen-topbar'>
                <button className='gen-topbar__back' onClick={() => navigate('/')}>←</button>
                <h2 className='gen-topbar__title'>Elige la generación</h2>
                <div className='gen-steps'>
                    <span className='gen-step gen-step--done'><b>1</b> Partida</span>
                    <span className='gen-step gen-step--active'><b>2</b> Generación</span>
                    <span className='gen-step'><b>3</b> Jugadores</span>
                </div>
            </div>

            <div className='gen-grid'>
                {GENERATIONS.map(({ gen, region, gyms, map, color, tint }) => (
                    <div
                        key={gen}
                        className={`gen-card ${map ? '' : 'gen-card--locked'}`}
                        style={{ '--gen-color': color, '--gen-tint': tint }}
                        onClick={() => map && handleSelect(gen)}
                    >
                        <div
                            className='gen-card__map'
                            style={map ? { backgroundImage: `url(${map})` } : {}}
                        >
                            <span className='gen-card__gen'>Gen {gen}</span>
                            {!map && <span className='gen-card__lock'>🔒</span>}
                        </div>
                        <div className='gen-card__info'>
                            <span className='gen-card__region'>{region}</span>
                            <span className='gen-card__gyms'>
                                {map ? `${gyms} gimnasios` : 'Próximamente'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectGeneration;
