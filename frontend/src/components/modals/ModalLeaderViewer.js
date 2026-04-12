import { useState, useEffect } from 'react';

const GYM_LEADERS = {
    1: [
        { name: 'Brock',    imgs: ['gym1_1', 'gym1_2'], badge: 'badge1' },
        { name: 'Misty',    imgs: ['gym2_1', 'gym2_2'], badge: 'badge2' },
        { name: 'Lt. Surge',imgs: ['gym3_1', 'gym3_2'], badge: 'badge3' },
        { name: 'Erika',    imgs: ['gym4_1', 'gym4_2'], badge: 'badge4' },
        { name: 'Koga',     imgs: ['gym5_1', 'gym5_2'], badge: 'badge5' },
        { name: 'Sabrina',  imgs: ['gym6_1', 'gym6_2'], badge: 'badge6' },
        { name: 'Blaine',   imgs: ['gym7_1', 'gym7_2'], badge: 'badge7' },
        { name: 'Giovanni', imgs: ['gym8_1', 'gym8_2'], badge: 'badge8' },
    ],
    2: [
        { name: 'Falkner',  imgs: ['gym1_1', 'gym1_2'], badge: 'badge1' },
        { name: 'Bugsy',    imgs: ['gym2_1', 'gym2_2'], badge: 'badge2' },
        { name: 'Whitney',  imgs: ['gym3_1', 'gym3_2'], badge: 'badge3' },
        { name: 'Morty',    imgs: ['gym4_1', 'gym4_2'], badge: 'badge4' },
        { name: 'Chuck',    imgs: ['gym5_1', 'gym5_2'], badge: 'badge5' },
        { name: 'Jasmine',  imgs: ['gym6_1', 'gym6_2'], badge: 'badge6' },
        { name: 'Pryce',    imgs: ['gym7_1', 'gym7_2'], badge: 'badge7' },
        { name: 'Clair',    imgs: ['gym8_1', 'gym8_2'], badge: 'badge8' },
    ],
    3: [
        { name: 'Roxanne',      imgs: ['gym1_1', 'gym1_2'], badge: 'badge1' },
        { name: 'Brawly',       imgs: ['gym2_1', 'gym2_2'], badge: 'badge2' },
        { name: 'Wattson',      imgs: ['gym3_1', 'gym3_2'], badge: 'badge3' },
        { name: 'Flannery',     imgs: ['gym4_1', 'gym4_2'], badge: 'badge4' },
        { name: 'Norman',       imgs: ['gym5_1', 'gym5_2'], badge: 'badge5' },
        { name: 'Winona',       imgs: ['gym6_1', 'gym6_2'], badge: 'badge6' },
        { name: 'Tate & Liza',  imgs: ['gym7_1', 'gym7_2'], badge: 'badge7' },
        { name: 'Wallace',      imgs: ['gym8_1', 'gym8_2'], badge: 'badge8' },
    ],
    4: [
        { name: 'Roark',        imgs: ['gym1_1', 'gym1_2'], badge: 'badge1' },
        { name: 'Gardenia',     imgs: ['gym2_1', 'gym2_2'], badge: 'badge2' },
        { name: 'Maylene',      imgs: ['gym3_1', 'gym3_2'], badge: 'badge3' },
        { name: 'Crasher Wake', imgs: ['gym4_1', 'gym4_2'], badge: 'badge4' },
        { name: 'Fantina',      imgs: ['gym5_1', 'gym5_2'], badge: 'badge5' },
        { name: 'Byron',        imgs: ['gym6_1', 'gym6_2'], badge: 'badge6' },
        { name: 'Candice',      imgs: ['gym7_1', 'gym7_2'], badge: 'badge7' },
        { name: 'Volkner',      imgs: ['gym8_1', 'gym8_2'], badge: 'badge8' },
    ],
};

const ELITE_LEADERS = {
    1: [
        { name: 'Lorelei', imgs: ['gymE1_1', 'gymE1_2'], badge: 'elite' },
        { name: 'Bruno',   imgs: ['gymE2_1', 'gymE2_2'], badge: 'elite' },
        { name: 'Agatha',  imgs: ['gymE3_1', 'gymE3_2'], badge: 'elite' },
        { name: 'Lance',   imgs: ['gymE4_1', 'gymE4_2'], badge: 'elite' },
    ],
    2: [
        { name: 'Will',   imgs: ['gymE1_1', 'gymE1_2'], badge: 'elite' },
        { name: 'Koga',   imgs: ['gymE2_1', 'gymE2_2'], badge: 'elite' },
        { name: 'Bruno',  imgs: ['gymE3_1', 'gymE3_2'], badge: 'elite' },
        { name: 'Karen',  imgs: ['gymE4_1', 'gymE4_2'], badge: 'elite' },
    ],
    3: [
        { name: 'Sidney', imgs: ['gymE1_1', 'gymE1_2'], badge: 'elite' },
        { name: 'Phoebe', imgs: ['gymE2_1', 'gymE2_2'], badge: 'elite' },
        { name: 'Glacia', imgs: ['gymE3_1', 'gymE3_2'], badge: 'elite' },
        { name: 'Drake',  imgs: ['gymE4_1', 'gymE4_2'], badge: 'elite' },
    ],
    4: [
        { name: 'Aaron',  imgs: ['gymE1_1', 'gymE1_2'], badge: 'elite' },
        { name: 'Bertha', imgs: ['gymE2_1', 'gymE2_2'], badge: 'elite' },
        { name: 'Flint',  imgs: ['gymE3_1', 'gymE3_2'], badge: 'elite' },
        { name: 'Lucian', imgs: ['gymE4_1', 'gymE4_2'], badge: 'elite' },
    ],
};

const CHAMPION_LEADERS = {
    1: [
        { name: 'Blue',   imgs: ['gymC1_1', 'gymC1_2'], badge: 'campion' },
        { name: 'Blue 2', imgs: ['gymC2_1', 'gymC2_2'], badge: 'campion' },
        { name: 'Blue 3', imgs: ['gymC3_1', 'gymC3_2'], badge: 'campion' },
    ],
    2: [
        { name: 'Lance',   imgs: ['gymC1_1', 'gymC1_2'], badge: 'campion' },
        { name: 'Lance 2', imgs: ['gymC2_1', 'gymC2_2'], badge: 'campion' },
        { name: 'Lance 3', imgs: ['gymC3_1', 'gymC3_2'], badge: 'campion' },
    ],
    3: [
        { name: 'Steven',   imgs: ['gymC1_1', 'gymC1_2'], badge: 'campion' },
        { name: 'Steven 2', imgs: ['gymC2_1', 'gymC2_2'], badge: 'campion' },
        { name: 'Steven 3', imgs: ['gymC3_1', 'gymC3_2'], badge: 'campion' },
    ],
    4: [
        { name: 'Cynthia',   imgs: ['gymC1_1', 'gymC1_2'], badge: 'campion' },
        { name: 'Cynthia 2', imgs: ['gymC2_1', 'gymC2_2'], badge: 'campion' },
        { name: 'Cynthia 3', imgs: ['gymC3_1', 'gymC3_2'], badge: 'campion' },
    ],
};

const ROCKET_LEADER = { name: 'Rocket', imgs: ['gymR1_1', 'gymR1_2'], badge: 'masterball' };

const getBadge = (name, gen) => {
    try {
        return require(`../../images/badges/badges${gen}/${name}.webp`);
    } catch {
        try { return require(`../../images/badges/badges${gen}/${name}.png`); } catch {}
    }
    try { return require(`../../images/badges/${name}.png`); } catch { return null; }
};

const ModalLeaderViewer = ({ show, onClose, generation = 1 }) => {
    const gen = GYM_LEADERS[generation] ? generation : 1;
    const LEADERS = [
        ...GYM_LEADERS[gen],
        ...ELITE_LEADERS[gen],
        ...CHAMPION_LEADERS[gen],
        ROCKET_LEADER,
    ];

    const getImg = (name) => require(`../../images/Leaders${gen}/${name}.png`);
    const [current, setCurrent] = useState(0);

    useEffect(() => { setCurrent(0); }, [gen]);

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
                    {LEADERS.map((l, i) => {
                        const badgeImg = getBadge(l.badge, gen);
                        return badgeImg ? (
                            <img
                                key={i}
                                src={badgeImg}
                                alt={l.name}
                                className={`leader-viewer-dot ${i === current ? 'leader-viewer-dot--active' : ''}`}
                                onClick={() => setCurrent(i)}
                            />
                        ) : (
                            <div
                                key={i}
                                className={`leader-viewer-dot ${i === current ? 'leader-viewer-dot--active' : ''}`}
                                onClick={() => setCurrent(i)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ModalLeaderViewer;
