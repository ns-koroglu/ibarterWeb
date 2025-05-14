// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom'; // Navigate eklendi
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext'; // Kendi AuthContext hook'umuz

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth(); // Mevcut kullanıcıyı context'ten al

    // Eğer kullanıcı zaten giriş yapmışsa, onu admin paneline yönlendir
    if (currentUser) {
        return <Navigate to="/admin" replace />; // Ana admin sayfasına yönlendir
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin'); // Giriş başarılıysa admin paneline yönlendir
        } catch (err) {
            console.error("Giriş hatası:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('E-posta veya şifre hatalı.');
            } else {
                setError('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.loginContainer}>
            <div style={styles.loginBox}>
                <h2 style={styles.title}>Admin Paneli Girişi</h2>
                <form onSubmit={handleLogin}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>E-posta:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.label}>Şifre:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                            required
                            placeholder="********"
                        />
                    </div>
                    {error && <p style={styles.errorMessage}>{error}</p>}
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Basit stiller (ManageCategories'dekine benzer)
const styles = {
    loginContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh', // Tüm ekran yüksekliğini kapla
        backgroundColor: '#f0f2f5',
        fontFamily: 'Arial, sans-serif',
    },
    loginBox: {
        padding: '40px', // Daha fazla iç boşluk
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px', // Maksimum genişlik
    },
    title: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '30px', // Daha fazla alt boşluk
        fontSize: '24px', // Başlık boyutu
    },
    inputGroup: {
        marginBottom: '20px', // Input grupları arası boşluk
    },
    label: {
        display: 'block', // Etiketi tam satır yap
        marginBottom: '8px', // Etiket ile input arası boşluk
        color: '#555',
        fontSize: '14px',
        fontWeight: '600',
    },
    input: {
        width: '100%',
        padding: '12px', // Daha fazla iç boşluk
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px', // Hata mesajıyla arası için boşluk
    },
    errorMessage: {
        color: '#dc3545',
        fontSize: '14px',
        marginBottom: '15px', // Butonla arası için boşluk
        textAlign: 'center',
    }
};

export default LoginPage;