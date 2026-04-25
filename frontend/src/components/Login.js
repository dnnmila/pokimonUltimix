import React, { useState } from 'react';
import SERVER_IP from '../config.js';

function Login({ onLogin }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${SERVER_IP}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (response.ok) {
                onLogin();
            } else {
                setError('Contraseña incorrecta');
            }
        } catch {
            setError('Error de conexión');
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Pokimooon Ultimix Megadeath</h1>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        autoFocus
                    />
                    {error && <p style={styles.error}>{error}</p>}
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#1a1a2e',
    },
    card: {
        background: '#16213e',
        borderRadius: '12px',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        minWidth: '300px',
    },
    title: {
        color: '#e2b714',
        margin: 0,
        fontSize: '1.8rem',
        fontFamily: 'sans-serif',
        letterSpacing: '1px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: '100%',
    },
    input: {
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '1px solid #0f3460',
        background: '#0f3460',
        color: '#fff',
        fontSize: '1rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    button: {
        padding: '0.75rem',
        borderRadius: '8px',
        border: 'none',
        background: '#e2b714',
        color: '#1a1a2e',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: '100%',
    },
    error: {
        color: '#ff6b6b',
        margin: 0,
        fontSize: '0.9rem',
        textAlign: 'center',
    },
};

export default Login;
