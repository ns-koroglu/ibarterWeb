// src/pages/AdminDashboard.jsx
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Outlet, Navigate, useLocation } from 'react-router-dom'; // Link, Outlet, Navigate ve useLocation eklendi

function AdminDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Aktif linki belirlemek için

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Çıkış hatası:", error);
            // Toast ile hata mesajı gösterilebilir
        }
    };

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // Aktif link stilini belirlemek için bir yardımcı fonksiyon
    const getNavLinkStyle = (path) => {
        return location.pathname === path || (path === "/admin" && location.pathname === "/admin") // Genel Bakış için özel durum
            ? {...styles.navLink, ...styles.navLinkActive}
            : styles.navLink;
    };

    return (
        <div style={styles.dashboardLayout}>
            {/* Yan Menü (Sidebar) */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarHeader}>
                    <h2 style={styles.sidebarTitle}>Admin Paneli</h2>
                    {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profil" style={styles.sidebarProfileImage} />
                    )}
                    <span style={styles.userEmailSmall}>{currentUser.displayName || currentUser.email}</span>
                </div>
                <nav style={styles.nav}>
                    <Link to="/admin" style={getNavLinkStyle("/admin")}>Genel Bakış</Link>
                    <Link to="categories" style={getNavLinkStyle("/admin/categories")}>Kategori Yönetimi</Link>
                    <Link to="products" style={getNavLinkStyle("/admin/products")}>Ürün Yönetimi</Link>
                    <Link to="businesses" style={getNavLinkStyle("/admin/businesses")}>İşletme Yönetimi</Link>
                    <Link to="profile" style={getNavLinkStyle("/admin/profile")}>Kullanıcı Profili</Link> {/* YENİ: Profil linki */}
                </nav>
                <button onClick={handleLogout} style={styles.logoutButtonSidebar}>Çıkış Yap</button>
            </aside>

            {/* Ana İçerik Alanı */}
            <main style={styles.mainContent}>
                <header style={styles.contentHeader}>
                    {/* Dinamik başlık eklenebilir */}
                    {/* <span>Hoş geldiniz, {currentUser.displayName || currentUser.email}</span> */}
                </header>
                <div style={styles.contentBody}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

const styles = {
    dashboardLayout: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", // Modern bir font
        backgroundColor: '#f4f7f6', // Biraz daha yumuşak bir arkaplan
    },
    sidebar: {
        width: '260px', // Biraz daha geniş
        backgroundColor: '#2c3e50', // Koyu mavi tonu
        color: '#ecf0f1', // Açık renk yazı
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
    },
    sidebarHeader: {
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '1px solid #34495e', // Daha belirgin border
        textAlign: 'center', // Başlığı ortala
    },
    sidebarTitle: {
        margin: '0 0 10px 0',
        fontSize: '24px', // Daha büyük başlık
        fontWeight: '600',
    },
    sidebarProfileImage: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        marginBottom: '10px',
        border: '3px solid #3498db', // Profil resmine çerçeve
    },
    userEmailSmall: {
        fontSize: '14px', // Biraz daha büyük
        color: '#bdc3c7', // Biraz daha açık renk
        display: 'block',
        wordBreak: 'break-all',
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px', // Linkler arası boşluk
        flexGrow: 1,
    },
    navLink: {
        color: '#ecf0f1',
        textDecoration: 'none',
        padding: '12px 18px', // Daha fazla padding
        borderRadius: '6px', // Daha yuvarlak köşeler
        fontSize: '16px',
        transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.1s ease', // Transform eklendi
        display: 'block', // Tam satır kaplaması için
    },
    navLinkActive: { // Aktif link stili
        backgroundColor: '#3498db', // Mavi arkaplan
        color: '#ffffff',
        fontWeight: '600', // Kalın yazı
        // boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Hafif gölge
    },
    // navLink:hover: { backgroundColor: '#34495e', color: 'white', transform: 'translateX(5px)' }, // CSS ile daha iyi
    logoutButtonSidebar: {
        padding: '12px 18px',
        backgroundColor: '#e74c3c', // Kırmızı tonu
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        textAlign: 'center',
        marginTop: '25px',
        transition: 'background-color 0.2s ease',
    },
    // logoutButtonSidebar:hover: { backgroundColor: '#c0392b'}, // CSS ile daha iyi
    mainContent: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff', // Ana içerik beyaz
    },
    contentHeader: {
        padding: '20px 30px',
        backgroundColor: '#ffffff', // Başlık arkaplanı beyaz
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', // Daha yumuşak gölge
        borderBottom: '1px solid #e9ecef',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        color: '#495057',
        // height: '60px', // Sabit header yüksekliği (isteğe bağlı)
    },
    contentBody: {
        flex: 1,
        padding: '25px', // Daha fazla iç boşluk
        overflowY: 'auto',
        backgroundColor: '#f4f7f6', // İçerik alanı arkaplanı
    }
};
// AdminDashboard.jsx içindeki stillere hover efektleri eklemek için CSS kullanmak daha iyidir.
// Örneğin, App.css veya index.css dosyanıza şunları ekleyebilirsiniz:
/*
.nav-link:hover {
  background-color: #34495e !important;
  color: white !important;
  transform: translateX(5px) !important;
}

.logout-button-sidebar:hover {
  background-color: #c0392b !important;
}
*/
// Ve Link bileşenlerinize className="nav-link" gibi classlar atayabilirsiniz.
// Ancak JavaScript stilleriyle devam etmek isterseniz, mouse event handler'ları ile state kullanarak hover efektleri yapabilirsiniz.
// Mevcut haliyle bıraktım, Link için getNavLinkStyle fonksiyonu aktif stili yönetiyor.

export default AdminDashboard;