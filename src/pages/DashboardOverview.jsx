// src/pages/DashboardOverview.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext'; // Opsiyonel: Kullanıcıyı selamlamak için

function DashboardOverview() {
    const { currentUser } = useAuth(); // Opsiyonel
    const [categoryCount, setCategoryCount] = useState(0);
    const [productCount, setProductCount] = useState(0);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        setLoadingStats(true);
        let activeListeners = true;

        // Kategori sayısını dinle
        const categoriesUnsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
            if (activeListeners) setCategoryCount(snapshot.size);
        }, (error) => {
            console.error("Kategori sayısını alırken hata:", error);
            if (activeListeners) setCategoryCount(0); // Hata durumunda 0 göster
        });

        // Ürün sayısını dinle
        const productsUnsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
            if (activeListeners) {
                setProductCount(snapshot.size);
                setLoadingStats(false); // Son veri geldiğinde yüklemeyi bitir
            }
        }, (error) => {
            console.error("Ürün sayısını alırken hata:", error);
            if (activeListeners) {
                setProductCount(0); // Hata durumunda 0 göster
                setLoadingStats(false);
            }
        });

        // Component kaldırıldığında dinleyicileri temizle
        return () => {
            activeListeners = false;
            categoriesUnsubscribe();
            productsUnsubscribe();
        };
    }, []);

    return (
        <div style={styles.overviewContainer}>
            <h2 style={styles.welcomeMessage}>
                Admin Paneline Hoş Geldiniz{currentUser ? `, ${currentUser.email}` : ''}!
            </h2>
            <p style={styles.introText}>
                Bu panel üzerinden uygulamanızın verilerini yönetebilirsiniz. Başlamak için aşağıdaki bağlantıları kullanın veya yan menüden bir bölüm seçin.
            </p>

            <div style={styles.statsContainer}>
                <div style={styles.statBox}>
                    <h3 style={styles.statTitle}>Toplam Kategori</h3>
                    {loadingStats ? <p style={styles.statValue}>Yükleniyor...</p> : <p style={styles.statValue}>{categoryCount}</p>}
                </div>
                <div style={styles.statBox}>
                    <h3 style={styles.statTitle}>Toplam Ürün</h3>
                    {loadingStats ? <p style={styles.statValue}>Yükleniyor...</p> : <p style={styles.statValue}>{productCount}</p>}
                </div>
                {/* Buraya daha fazla istatistik kutusu eklenebilir (örn: Toplam Kullanıcı, Toplam Sipariş) */}
            </div>

            <div style={styles.quickLinksContainer}>
                <h3 style={styles.quickLinksTitle}>Hızlı Bağlantılar</h3>
                <div style={styles.links}>
                    <Link to="/admin/categories" style={styles.quickLinkButton}>
                        Kategorileri Yönet
                    </Link>
                    <Link to="/admin/products" style={styles.quickLinkButton}>
                        Ürünleri Yönet
                    </Link>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overviewContainer: {
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    welcomeMessage: {
        fontSize: '24px',
        color: '#333',
        marginBottom: '10px',
        fontWeight: '600',
    },
    introText: {
        fontSize: '16px',
        color: '#555',
        marginBottom: '30px',
        lineHeight: '1.6',
    },
    statsContainer: {
        display: 'flex',
        gap: '20px', // İstatistik kutuları arası boşluk
        marginBottom: '30px',
        flexWrap: 'wrap', // Küçük ekranlarda alt alta geçsin
    },
    statBox: {
        flex: 1, // Eşit genişlikte dağıl
        minWidth: '200px', // Minimum genişlik
        backgroundColor: '#f9f9f9',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #eee',
        textAlign: 'center',
    },
    statTitle: {
        fontSize: '16px',
        color: '#666',
        margin: '0 0 10px 0',
        fontWeight: '500',
    },
    statValue: {
        fontSize: '28px',
        color: '#333',
        margin: 0,
        fontWeight: 'bold',
    },
    quickLinksContainer: {
        marginTop: '20px',
    },
    quickLinksTitle: {
        fontSize: '18px',
        color: '#333',
        marginBottom: '15px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
        fontWeight: '600',
    },
    links: {
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
    },
    quickLinkButton: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '5px',
        fontSize: '14px',
        textAlign: 'center',
        transition: 'background-color 0.2s ease',
    },
    // quickLinkButton:hover stili CSS ile daha iyi olur
};

export default DashboardOverview;