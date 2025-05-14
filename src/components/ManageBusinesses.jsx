// src/components/ManageBusinesses.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import {
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot,
    doc, deleteDoc, updateDoc
} from "firebase/firestore";
import { toast } from 'react-toastify'; // toast import edildi

function ManageBusinesses() {
    // Form State'leri (Öncekiyle aynı)
    const [businessName, setBusinessName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');

    // Liste ve İşlem State'leri
    const [businesses, setBusinesses] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(''); // Liste yükleme hataları için
    const [editingBusiness, setEditingBusiness] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    // actionError ve actionSuccess kaldırıldı
    const [formErrors, setFormErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // useEffects ve filteredBusinesses (Öncekiyle aynı)
    useEffect(() => {
        setListLoading(true);
        const q = query(collection(db, "businesses"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const businessList = [];
            querySnapshot.forEach((doc) => businessList.push({ id: doc.id, ...doc.data() }));
            setBusinesses(businessList);
            setListLoading(false);
        }, (err) => { setListError("İşletmeler yüklenirken bir hata oluştu."); setListLoading(false); });
        return () => unsubscribe();
    }, []);

    const filteredBusinesses = useMemo(() => {
        if (!searchTerm.trim()) return businesses;
        return businesses.filter(b => b.businessName && b.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [businesses, searchTerm]);

    // Validasyon ve CRUD Fonksiyonları
    const isValidUrl = (urlString) => { if (!urlString) return true; try { new URL(urlString); return true; } catch (e) { return false; }};
    const isValidEmail = (emailString) => { const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return regex.test(emailString);};
    const isValidPhone = (phoneString) => { if (!phoneString) return true; const regex = /^\+?[0-9\s\-()]{7,20}$/; return regex.test(phoneString);};

    const validateForm = () => { /* Öncekiyle aynı */
        const errors = {};
        if (!businessName.trim()) errors.businessName = "İşletme adı boş bırakılamaz.";
        else if (businessName.trim().length < 2) errors.businessName = "İşletme adı en az 2 karakter olmalıdır.";
        else if (businessName.trim().length > 100) errors.businessName = "İşletme adı 100 karakterden fazla olamaz.";
        if (!email.trim()) errors.email = "E-posta boş bırakılamaz.";
        else if (!isValidEmail(email.trim())) errors.email = "Geçerli bir e-posta adresi girin.";
        if (ownerName.trim() && ownerName.trim().length < 2) errors.ownerName = "Sahip adı en az 2 karakter olmalıdır.";
        if (ownerName.trim().length > 100) errors.ownerName = "Sahip adı 100 karakterden fazla olamaz.";
        if (description.trim().length > 1000) errors.description = "Açıklama 1000 karakterden fazla olamaz.";
        if (address.trim().length > 250) errors.address = "Adres 250 karakterden fazla olamaz.";
        if (phone.trim() && !isValidPhone(phone.trim())) errors.phone = "Geçerli bir telefon numarası girin.";
        if (website.trim() && !isValidUrl(website.trim())) errors.website = "Geçerli bir web sitesi URL'si girin.";
        if (logoUrl.trim() && !isValidUrl(logoUrl.trim())) errors.logoUrl = "Geçerli bir logo URL'si girin.";
        if (coverImageUrl.trim() && !isValidUrl(coverImageUrl.trim())) errors.coverImageUrl = "Geçerli bir kapak görseli URL'si girin.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setBusinessName(''); setOwnerName(''); setDescription('');
        setAddress(''); setPhone(''); setEmail('');
        setWebsite(''); setLogoUrl(''); setCoverImageUrl('');
        setFormErrors({});
    };
    const handleCancelEdit = () => { setEditingBusiness(null); resetForm(); };

    const handleSubmitBusiness = async (e) => {
        e.preventDefault();
        setFormErrors({}); // Önceki form hatalarını temizle
        if (!validateForm()) return;

        setFormLoading(true);
        const businessData = { /* Öncekiyle aynı */
            businessName: businessName.trim(), ownerName: ownerName.trim() || null,
            description: description.trim() || null, address: address.trim() || null,
            phone: phone.trim() || null, email: email.trim(),
            website: website.trim() || null, logoUrl: logoUrl.trim() || null,
            coverImageUrl: coverImageUrl.trim() || null,
        };

        try {
            if (editingBusiness) {
                const businessRef = doc(db, "businesses", editingBusiness.id);
                businessData.updatedAt = serverTimestamp();
                await updateDoc(businessRef, businessData);
                toast.success(`'${businessData.businessName}' başarıyla güncellendi.`); // Toast
                handleCancelEdit();
            } else {
                businessData.createdAt = serverTimestamp();
                await addDoc(collection(db, "businesses"), businessData);
                toast.success(`'${businessData.businessName}' başarıyla eklendi.`); // Toast
                resetForm();
            }
        } catch (err) {
            console.error("İşletme işlemi sırasında hata:", err);
            toast.error(`İşletme ${editingBusiness ? 'güncellenirken' : 'eklenirken'} bir hata oluştu.`); // Toast
        } finally {
            setFormLoading(false);
        }
    };

    const handleStartEdit = (business) => { /* Öncekiyle aynı */
        setEditingBusiness(business);
        setBusinessName(business.businessName || ''); setOwnerName(business.ownerName || '');
        setDescription(business.description || ''); setAddress(business.address || '');
        setPhone(business.phone || ''); setEmail(business.email || '');
        setWebsite(business.website || ''); setLogoUrl(business.logoUrl || '');
        setCoverImageUrl(business.coverImageUrl || '');
        setFormErrors({}); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteBusiness = async (businessId, busName) => {
        if (window.confirm(`'${busName}' adlı işletmeyi silmek istediğinizden emin misiniz?`)) {
            try {
                await deleteDoc(doc(db, "businesses", businessId));
                toast.success(`'${busName}' başarıyla silindi.`); // Toast
                if (editingBusiness && editingBusiness.id === businessId) handleCancelEdit();
            } catch (err) {
                console.error("İşletme silinirken hata:", err);
                toast.error("İşletme silinirken bir hata oluştu."); // Toast
            }
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>İşletme Yönetimi</h2>
            <form onSubmit={handleSubmitBusiness} style={styles.form}>
                <h3 style={styles.formTitle}>
                    {editingBusiness ? `'${editingBusiness.businessName}' Düzenle` : 'Yeni İşletme Ekle'}
                </h3>
                {/* Form Alanları ve Hata Mesajları (Öncekiyle aynı, actionError/actionSuccess <p> etiketleri kaldırıldı) */}
                <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="businessName" style={styles.label}>İşletme Adı:</label>
                        <input type="text" id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={formErrors.businessName ? {...styles.input, ...styles.inputError} : styles.input} />
                        {formErrors.businessName && <p style={styles.inlineErrorMessage}>{formErrors.businessName}</p>}
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="ownerName" style={styles.label}>Sahip/Yetkili Adı:</label>
                        <input type="text" id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} style={formErrors.ownerName ? {...styles.input, ...styles.inputError} : styles.input} />
                        {formErrors.ownerName && <p style={styles.inlineErrorMessage}>{formErrors.ownerName}</p>}
                    </div>
                </div>
                <div style={styles.inputGroupWide}>
                    <label htmlFor="description" style={styles.label}>Açıklama:</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} style={formErrors.description ? {...styles.input, ...styles.textarea, ...styles.inputError} : {...styles.input, ...styles.textarea}} rows={3}/>
                    {formErrors.description && <p style={styles.inlineErrorMessage}>{formErrors.description}</p>}
                </div>
                <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="email" style={styles.label}>E-posta:</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} style={formErrors.email ? {...styles.input, ...styles.inputError} : styles.input} />
                        {formErrors.email && <p style={styles.inlineErrorMessage}>{formErrors.email}</p>}
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="phone" style={styles.label}>Telefon:</label>
                        <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={formErrors.phone ? {...styles.input, ...styles.inputError} : styles.input} />
                        {formErrors.phone && <p style={styles.inlineErrorMessage}>{formErrors.phone}</p>}
                    </div>
                </div>
                <div style={styles.inputGroupWide}>
                    <label htmlFor="address" style={styles.label}>Adres:</label>
                    <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} style={formErrors.address ? {...styles.input, ...styles.inputError} : styles.input} />
                    {formErrors.address && <p style={styles.inlineErrorMessage}>{formErrors.address}</p>}
                </div>
                <div style={styles.inputRow}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="website" style={styles.label}>Web Sitesi URL:</label>
                        <input type="url" id="website" value={website} onChange={(e) => setWebsite(e.target.value)} style={formErrors.website ? {...styles.input, ...styles.inputError} : styles.input} placeholder="https://"/>
                        {formErrors.website && <p style={styles.inlineErrorMessage}>{formErrors.website}</p>}
                    </div>
                    <div style={styles.inputGroup}>
                        <label htmlFor="logoUrl" style={styles.label}>Logo URL:</label>
                        <input type="url" id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={formErrors.logoUrl ? {...styles.input, ...styles.inputError} : styles.input} placeholder="https://"/>
                        {formErrors.logoUrl && <p style={styles.inlineErrorMessage}>{formErrors.logoUrl}</p>}
                    </div>
                </div>
                <div style={styles.inputGroupWide}>
                    <label htmlFor="coverImageUrl" style={styles.label}>Kapak Görseli URL:</label>
                    <input type="url" id="coverImageUrl" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} style={formErrors.coverImageUrl ? {...styles.input, ...styles.inputError} : styles.input} placeholder="https://"/>
                    {formErrors.coverImageUrl && <p style={styles.inlineErrorMessage}>{formErrors.coverImageUrl}</p>}
                </div>

                {/* actionError ve actionSuccess <p> etiketleri kaldırıldı */}

                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={formLoading} style={styles.button}>
                        {formLoading ? (editingBusiness ? 'Güncelleniyor...' : 'Ekleniyor...') : (editingBusiness ? 'İşletmeyi Güncelle' : 'İşletmeyi Ekle')}
                    </button>
                    {editingBusiness && (
                        <button type="button" onClick={handleCancelEdit} style={styles.cancelButton} disabled={formLoading}>Vazgeç</button>
                    )}
                </div>
            </form>

            {/* Mevcut İşletmeleri Listeleme Bölümü (Öncekiyle aynı) */}
            <div style={styles.listContainer}>
                <div style={styles.listHeader}>
                    <h3 style={styles.listTitle}>Mevcut İşletmeler</h3>
                    <input type="text" placeholder="İşletmelerde Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
                </div>
                {listLoading && <p>İşletmeler yükleniyor...</p>}
                {listError && <p style={styles.errorMessage}>{listError}</p>} {/* Liste yükleme hatası burada kalabilir */}
                {!listLoading && !listError && (
                    filteredBusinesses.length === 0 ? (
                        <p>{searchTerm ? 'Aramanızla eşleşen işletme bulunamadı.' : 'Henüz hiç işletme eklenmemiş.'}</p>
                    ) : (
                        <table style={styles.dataTable}>
                            <thead><tr><th style={styles.th}>Logo</th><th style={styles.th}>İşletme Adı</th><th style={styles.th}>Sahip/Yetkili</th><th style={styles.th}>E-posta</th><th style={styles.th}>Telefon</th><th style={styles.th}>İşlemler</th></tr></thead>
                            <tbody>
                            {filteredBusinesses.map((business) => (
                                <tr key={business.id}>
                                    <td style={styles.td}>{business.logoUrl ? (<img src={business.logoUrl} alt={business.businessName} style={styles.logoImage}/>) : (<span style={styles.noImageText}>Logo Yok</span>)}</td>
                                    <td style={styles.td}>{business.businessName}</td><td style={styles.td}>{business.ownerName || '-'}</td>
                                    <td style={styles.td}>{business.email}</td><td style={styles.td}>{business.phone || '-'}</td>
                                    <td style={styles.td}><div style={styles.actionButtons}>
                                        <button onClick={() => handleStartEdit(business)} style={{...styles.actionButton, ...styles.editButton}} disabled={formLoading}>Düzenle</button>
                                        <button onClick={() => handleDeleteBusiness(business.id, business.businessName)} style={{...styles.actionButton, ...styles.deleteButton}} disabled={formLoading}>Sil</button>
                                    </div></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>
        </div>
    );
}

// Stiller (Öncekiyle aynı, sadece actionError/Success <p> mesajları için olanlar gereksizleşti)
const styles = { /* ... Önceki stiller ... */ };
// Stillerin tamamını buraya kopyalıyorum:
Object.assign(styles, {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '950px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'},
    title: { textAlign: 'center', color: '#333', marginBottom: '30px'},
    form: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px', paddingTop: '10px', paddingBottom: '20px', borderBottom: '1px solid #eee'},
    formTitle: { margin: '0 0 10px 0', color: '#555', paddingBottom: '5px'},
    inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '5px' },
    inputGroupWide: { display: 'flex', flexDirection: 'column', marginBottom: '15px'},
    inputRow: { display: 'flex', gap: '15px', marginBottom: '10px'},
    label: { marginBottom: '5px', color: '#666', fontSize: '14px'},
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box'},
    inputError: { borderColor: '#dc3545' },
    inlineErrorMessage: { color: '#dc3545', fontSize: '12px', marginTop: '4px' },
    textarea: { resize: 'vertical', minHeight: '80px'},
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '10px'},
    button: { padding: '10px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', flexGrow: 1},
    cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', flexGrow: 1},
    errorMessage: { color: '#dc3545', fontSize: '14px', marginTop: '5px'}, // Bu, listError için hala kullanılabilir
    // successMessage kaldırıldı
    listContainer: { marginTop: '20px'},
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'},
    listTitle: { margin: 0, color: '#555', paddingBottom: '5px' },
    searchInput: { padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '250px'},
    dataTable: { width: '100%', borderCollapse: 'collapse', marginTop: '10px'},
    th: { borderBottom: '2px solid #ddd', padding: '10px 8px', textAlign: 'left', backgroundColor: '#f0f0f0', fontSize: '14px', fontWeight: '600'},
    td: { borderBottom: '1px solid #eee', padding: '8px', fontSize: '14px', verticalAlign: 'middle'},
    logoImage: { width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ddd' },
    noImageText: { fontSize: '11px', color: '#888', display: 'inline-block', width: '40px', height: '40px', lineHeight: '40px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f8f8' },
    actionButtons: { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start'},
    actionButton: { padding: '5px 10px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white'},
    editButton: { backgroundColor: '#ffc107', color: '#333'},
    deleteButton: { backgroundColor: '#dc3545'},
});

export default ManageBusinesses;