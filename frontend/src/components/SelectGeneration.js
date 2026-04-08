import { useNavigate } from 'react-router-dom';
import '../styles/_selectGeneration.scss';

import mapGen1 from '../images/maps/gen1.jpg';
import mapGen2 from '../images/maps/gen2.png';
import mapGen3 from '../images/maps/gen3.png';
import mapGen4 from '../images/maps/gen4.png';

const GENERATIONS = [
    { gen: 1, region: 'Kanto',  map: mapGen1 },
    { gen: 2, region: 'Johto',  map: mapGen2 },
    { gen: 3, region: 'Hoenn',  map: mapGen3 },
    { gen: 4, region: 'Sinnoh', map: mapGen4 },
    { gen: 5, region: 'Unova',  map: null },
    { gen: 6, region: 'Kalos',  map: null },
    { gen: 7, region: 'Alola',  map: null },
    { gen: 8, region: 'Galar',  map: null },
    { gen: 9, region: 'Paldea', map: null },
];

const SelectGeneration = ({ onSetGeneration }) => {
    const navigate = useNavigate();

    const handleSelect = async (gen) => {
        await onSetGeneration(gen);
        navigate('/menuPlayers');
    };

    return (
        <div className='game-background'>
            <div className='gen-select'>
                <h2 className='gen-select__title'>Selecciona una Generación</h2>
                <div className='gen-select__grid'>
                    {GENERATIONS.map(({ gen, region, map }) => (
                        <div
                            key={gen}
                            className={`gen-card ${!map ? 'gen-card--locked' : ''}`}
                            onClick={() => map && handleSelect(gen)}
                        >
                            <div
                                className='gen-card__map'
                                style={map ? { backgroundImage: `url(${map})` } : {}}
                            >
                                {!map && <span className='gen-card__soon'>Próximamente</span>}
                            </div>
                            <div className='gen-card__info'>
                                <span className='gen-card__gen'>Gen {gen}</span>
                                <span className='gen-card__region'>{region}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SelectGeneration;
