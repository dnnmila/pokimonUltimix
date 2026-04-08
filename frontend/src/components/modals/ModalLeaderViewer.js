import { useState } from 'react';

const LEADERS = [
    { name: 'Brock',    imgs: ['gym1_1', 'gym1_2'],   badge: 'badge1'  },
    { name: 'Misty',    imgs: ['gym2_1', 'gym2_2'],   badge: 'badge2'  },
    { name: 'Surge',    imgs: ['gym3_1', 'gym3_2'],   badge: 'badge3'  },
    { name: 'Erika',    imgs: ['gym4_1', 'gym4_2'],   badge: 'badge4'  },
    { name: 'Koga',     imgs: ['gym5_1', 'gym5_2'],   badge: 'badge5'  },
    { name: 'Sabrina',  imgs: ['gym6_1', 'gym6_2'],   badge: 'badge6'  },
    { name: 'Blaine',   imgs: ['gym7_1', 'gym7_2'],   badge: 'badge7'  },
    { name: 'Giovanni', imgs: ['gym8_1', 'gym8_2'],   badge: 'badge8'  },
    { name: 'Agatha',   imgs: ['gymE1_1', 'gymE1_2'], badge: 'elite'   },
    { name: 'Bruno',    imgs: ['gymE2_1', 'gymE2_2'], badge: 'elite'   },
    { name: 'Lorelei',  imgs: ['gymE3_1', 'gymE3_2'], badge: 'elite'   },
    { name: 'Lance',    imgs: ['gymE4_1', 'gymE4_2'], badge: 'elite'   },
    { name: 'Blue',     imgs: ['gymC1_1', 'gymC1_2'], badge: 'campion' },
    { name: 'Blue 2',   imgs: ['gymC2_1', 'gymC2_2'], badge: 'campion' },
    { name: 'Blue 3',   imgs: ['gymC3_1', 'gymC3_2'], badge: 'campion' },
    { name: 'Rocket',   imgs: ['gymR1_1', 'gymR1_2'], badge: 'masterball' },
];

const getImg = (name) => require(`../../images/Leaders1/${name}.png`);
const getBadge = (name) => require(`../../images/badges/${name}.png`);

const ModalLeaderViewer = ({ show, onClose }) => {
    const [current, setCurrent] = useState(0);

    if (!show) return null;

    const leader = LEADERS[current];

    const prev = () => setCurrent((c) => (c - 1 + LEADERS.length) % LEADERS.length);
    const next = () => setCurrent((c) => (c + 1) % LEADERS.length);

    return (
        <div className="leader-viewer-overlay" onClick={onClose}>
            <div className="leader-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="leader-viewer-close" onClick={onClose}>✕</div>

                <div className="leader-viewer-name">{leader.name}</div>

                <div className="leader-viewer-content">
                    <div className="leader-viewer-arrow" onClick={prev}>‹</div>

                    <div className="leader-viewer-images">
                        {leader.imgs.map((img) => (
                            <img
                                key={img}
                                src={getImg(img)}
                                alt={img}
                                className="leader-viewer-img"
                            />
                        ))}
                    </div>

                    <div className="leader-viewer-arrow" onClick={next}>›</div>
                </div>

                <div className="leader-viewer-dots">
                    {LEADERS.map((leader, i) => (
                        <img
                            key={i}
                            src={getBadge(leader.badge)}
                            alt={leader.name}
                            className={`leader-viewer-dot ${i === current ? 'leader-viewer-dot--active' : ''}`}
                            onClick={() => setCurrent(i)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModalLeaderViewer;
