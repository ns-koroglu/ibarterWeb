// src/pages/UserProfilePage.jsx (Web Admin Paneli)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../firebaseConfig';
import {
    updateProfile,
    updateEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

function UserProfilePage() {
    const { currentUser } = useAuth();

    // Temel Auth Bilgileri için State'ler
    const [displayName, setDisplayName] = useState(''); // Kullanıcının asıl adı (map to: name)
    const [email, setEmail] = useState(''); // Formdaki e-posta alanı için (map to: email)
    const [photoURL, setPhotoURL] = useState(''); // Profil/Logo resmi URL (map to: businessLogoURL, profilePictureURL)

    // BusinessDetailScreen benzeri görünüm için ek Firestore alanları
    const [profileTitle, setProfileTitle] = useState(''); // Profil başlığı (map to: businessName)
    const [bio, setBio] = useState(''); // Hakkında/Açıklama (map to: businessDescription)
    const [coverPhotoURL, setCoverPhotoURL] = useState(''); // Kapak fotoğrafı URL (map to: businessCoverImageURL)
    const [phoneNumber, setPhoneNumber] = useState(''); // Telefon (map to: businessPhone)
    const [address, setAddress] = useState(''); // Adres (map to: businessAddress)
    const [contactEmail, setContactEmail] = useState(''); // İletişim E-postası (map to: businessEmail)
    const [website, setWebsite] = useState(''); // Web sitesi (map to: businessWebsite)

    // Şifre Güncelleme State'leri
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState(''); // E-posta/şifre güncellemesi için

    const [loading, setLoading] = useState(false);
    const [loadingProfileData, setLoadingProfileData] = useState(true);

    useEffect(() => {
        if (currentUser) {
            // Auth'dan temel bilgileri al
            setDisplayName(currentUser.displayName || '');
            setEmail(currentUser.email || '');
            setPhotoURL(currentUser.photoURL || '');

            // Firestore'dan ek kullanıcı verilerini yükle
            const userDocRef = doc(db, 'users', currentUser.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    // Firestore'daki 'name' alanı varsa onu displayName state'ine ata
                    setDisplayName(userData.name || currentUser.displayName || '');
                    // Firestore'daki logo/profil resmini photoURL state'ine ata
                    setPhotoURL(userData.businessLogoURL || userData.profilePictureURL || currentUser.photoURL || '');

                    setProfileTitle(userData.businessName || '');
                    setBio(userData.businessDescription || '');
                    setCoverPhotoURL(userData.businessCoverImageURL || '');
                    setPhoneNumber(userData.businessPhone || '');
                    setAddress(userData.businessAddress || '');
                    setContactEmail(userData.businessEmail || '');
                    setWebsite(userData.businessWebsite || '');
                }
            }).catch(error => {
                console.error("Firestore'dan kullanıcı verisi alınırken hata:", error);
                toast.error("Ek profil verileri yüklenirken bir sorun oluştu.");
            }).finally(() => {
                setLoadingProfileData(false);
            });
        } else {
            setLoadingProfileData(false);
        }
    }, [currentUser]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);

        try {
            // 1. Firebase Auth profilini güncelle (sadece displayName ve photoURL)
            await updateProfile(currentUser, {
                displayName: displayName, // Bu, Firebase Auth'daki ana görünen ad olacak.
                photoURL: photoURL,     // Bu, Firebase Auth'daki ana profil resmi olacak.
            });

            // 2. Firestore'da 'users' koleksiyonundaki kullanıcı dokümanını güncelle
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                uid: currentUser.uid,
                name: displayName, // Mobil uygulamada `userData.name` olarak kullanılacak.
                email: currentUser.email, // Auth'dan gelen ana e-posta.

                // Mobil uygulamanın `ProfileScreen` ve `BusinessDetailScreen` benzeri görünümü için alanlar:
                businessName: profileTitle.trim() || displayName, // Profil başlığı, boşsa adı kullan.
                businessDescription: bio.trim(),
                businessCoverImageURL: coverPhotoURL.trim(),
                businessLogoURL: photoURL.trim(), // Auth'daki photoURL'i logo olarak da kullanıyoruz.
                profilePictureURL: photoURL.trim(), // İhtiyaç olursa diye ek bir profil resmi alanı.

                businessAddress: address.trim(),
                businessPhone: phoneNumber.trim(),
                businessEmail: contactEmail.trim() || currentUser.email, // İletişim e-postası, boşsa ana e-postayı kullan.
                businessWebsite: website.trim(),

                updatedAt: new Date()
            }, { merge: true });

            toast.success('Profil başarıyla güncellendi!');
        } catch (error) {
            console.error("Profil güncelleme hatası:", error);
            toast.error(`Profil güncellenirken bir hata oluştu: ${error.message}`);
        }
        setLoading(false);
    };

    const handleEmailUpdate = async (e) => {
        // ... (Bu fonksiyon önceki gibi kalabilir, sadece Firestore'daki ana email'i de güncellemeyi düşünebilirsiniz)
        e.preventDefault();
        if (!currentUser || !currentPassword) {
            toast.error('E-posta güncellemek için mevcut şifrenizi girmeniz gerekmektedir.');
            return;
        }
        if (email === currentUser.email) {
            toast.info('Yeni e-posta adresi mevcut e-posta adresinizle aynı.');
            return;
        }
        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updateEmail(currentUser, email);

            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, { email: email, updatedAt: new Date() }, { merge: true }); // Firestore'da da güncelle

            toast.success('E-posta adresiniz başarıyla güncellendi! Lütfen yeni e-postanızla tekrar giriş yapın.');
            setCurrentPassword('');
        } catch (error) {
            console.error("E-posta güncelleme hatası:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.');
            } else if (error.code === 'auth/invalid-email') {
                toast.error('Geçersiz e-posta formatı.');
            } else if (error.code === 'auth/requires-recent-login' || error.code === 'auth/user-token-expired') {
                toast.error('Bu işlem için yeniden giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar deneyin.');
            } else {
                toast.error(`E-posta güncellenirken bir hata oluştu: ${error.message}`);
            }
        }
        setLoading(false);
    };

    const handlePasswordUpdate = async (e) => {
        // ... (Bu fonksiyon önceki gibi kalabilir)
        e.preventDefault();
        if (!currentUser || !currentPassword || !newPassword) {
            toast.error('Şifre güncellemek için mevcut ve yeni şifrenizi girmeniz gerekmektedir.');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }
        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            toast.success('Şifreniz başarıyla güncellendi!');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            console.error("Şifre güncelleme hatası:", error);
            if (error.code === 'auth/weak-password') {
                toast.error('Yeni şifre yeterince güçlü değil.');
            } else if (error.code === 'auth/requires-recent-login' || error.code === 'auth/user-token-expired') {
                toast.error('Bu işlem için yeniden giriş yapmanız gerekiyor. Lütfen çıkış yapıp tekrar deneyin.');
            } else {
                toast.error(`Şifre güncellenirken bir hata oluştu: ${error.message}`);
            }
        }
        setLoading(false);
    };

    if (loadingProfileData) {
        return <div style={styles.container}><p>Profil bilgileri yükleniyor...</p></div>;
    }

    if (!currentUser) {
        return <div style={styles.container}><p>Lütfen giriş yapınız.</p></div>;
    }

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Kullanıcı Profili (Web Admin)</h2>

            <form onSubmit={handleProfileUpdate} style={{...styles.form, marginBottom: '30px'}}>
                <h3 style={styles.formTitle}>Genel & Mobil Uygulama Profil Bilgileri</h3>
                <div style={styles.inputGroup}>
                    <label htmlFor="displayName" style={styles.label}>Adınız Soyadınız (Auth için Görünen Ad):</label>
                    <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={styles.input} placeholder="Adınız Soyadınız"/>
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="profileTitle" style={styles.label}>Profil Başlığı (Mobilde Görünecek):</label>
                    <input type="text" id="profileTitle" value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} style={styles.input} placeholder="Örn: Benim Mağazam, Kişisel Blogum"/>
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="photoURL" style={styles.label}>Profil/Logo Resmi URL:</label>
                    <input type="url" id="photoURL" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} style={styles.input} placeholder="https://example.com/logo.jpg"/>
                    {photoURL && <img src={photoURL} alt="Profil" style={styles.imagePreview} />}
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="coverPhotoURL" style={styles.label}>Kapak Fotoğrafı URL (Mobilde Görünecek):</label>
                    <input type="url" id="coverPhotoURL" value={coverPhotoURL} onChange={(e) => setCoverPhotoURL(e.target.value)} style={styles.input} placeholder="https://example.com/cover.jpg"/>
                    {coverPhotoURL && <img src={coverPhotoURL} alt="Kapak" style={styles.imagePreview} />}
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="bio" style={styles.label}>Hakkımda / Bio (Mobilde Görünecek):</label>
                    <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} style={{...styles.input, ...styles.textarea}} placeholder="Kendiniz veya profiliniz hakkında kısa bir açıklama" rows={4}/>
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="phoneNumber" style={styles.label}>Telefon Numarası:</label>
                    <input type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={styles.input} placeholder="05XX XXX XX XX"/>
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="address" style={styles.label}>Adres:</label>
                    <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} style={{...styles.input, ...styles.textarea}} placeholder="Tam adresiniz" rows={3}/>
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="contactEmail" style={styles.label}>İletişim E-postası (Mobilde Görünecek, boşsa ana e-posta kullanılır):</label>
                    <input type="email" id="contactEmail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} style={styles.input} placeholder="iletisim@example.com"/>
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="website" style={styles.label}>Web Sitesi (Mobilde Görünecek):</label>
                    <input type="url" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} style={styles.input} placeholder="https://www.siteniz.com"/>
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Güncelleniyor...' : 'Profil Bilgilerini Güncelle'}
                </button>
            </form>

            <form onSubmit={handleEmailUpdate} style={{...styles.form, marginBottom: '30px'}}>
                <h3 style={styles.formTitle}>Giriş E-postasını Güncelle</h3>
                <div style={styles.inputGroup}>
                    <label htmlFor="currentEmail" style={styles.label}>Mevcut Giriş E-postası:</label>
                    <input type="email" id="currentEmail" value={currentUser.email} style={{...styles.input, backgroundColor: '#e9ecef'}} readOnly />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="newEmailForAuth" style={styles.label}>Yeni Giriş E-postası:</label> {/* ID'yi değiştirdim karışmasın diye */}
                    <input type="email" id="newEmailForAuth" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="currentPasswordForEmail" style={styles.label}>Mevcut Şifreniz (E-posta Değişikliği İçin):</label>
                    <input type="password" id="currentPasswordForEmail" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={styles.input} placeholder="E-posta değiştirmek için şifrenizi girin" required />
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Güncelleniyor...' : 'Giriş E-postasını Güncelle'}
                </button>
            </form>

            <form onSubmit={handlePasswordUpdate} style={styles.form}>
                <h3 style={styles.formTitle}>Şifreyi Güncelle</h3>
                {/* Mevcut Şifre ve Yeni Şifre inputları aynı kalır */}
                <div style={styles.inputGroup}>
                    <label htmlFor="currentPasswordForPassword" style={styles.label}>Mevcut Şifreniz (Şifre Değişikliği İçin):</label>
                    <input type="password" id="currentPasswordForPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={styles.input} placeholder="Şifre değiştirmek için şifrenizi girin" required />
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="newPassword" style={styles.label}>Yeni Şifre:</label>
                    <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={styles.input} placeholder="En az 6 karakter" required />
                </div>
                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
            </form>
        </div>
    );
}

// Stiller (Önceki yanıttaki UserProfilePage stilleri kullanılabilir, sadece bazı eklemeler yapılabilir)
const styles = {
    container: { padding: '25px', fontFamily: 'Arial, sans-serif', maxWidth: '750px', margin: '30px auto', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: '#fdfdfd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'},
    title: { textAlign: 'center', color: '#2c3e50', marginBottom: '35px', fontSize: '2em', fontWeight: '600'},
    form: { display: 'flex', flexDirection: 'column', gap: '18px', padding: '25px', border: '1px solid #ecf0f1', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.05)'},
    formTitle: { margin: '0 0 15px 0', color: '#34495e', paddingBottom: '12px', borderBottom: '2px solid #3498db', fontSize: '1.5em'},
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px'},
    label: { color: '#555', fontSize: '14px', fontWeight: 'bold'},
    input: { padding: '12px 15px', border: '1px solid #bdc3c7', borderRadius: '5px', fontSize: '15px', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.3s ease, box-shadow 0.3s ease'},
    textarea: { resize: 'vertical', minHeight: '90px'},
    button: { padding: '12px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.3s ease'},
    imagePreview: {
        maxWidth: '120px',
        maxHeight: '120px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        objectFit: 'cover',
        marginTop: '10px',
    }
};

export default UserProfilePage;