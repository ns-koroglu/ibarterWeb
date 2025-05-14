// src/components/ManageCategories.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebaseConfig';
import {
    collection, addDoc, serverTimestamp, query, orderBy, onSnapshot,
    deleteDoc, doc, updateDoc
} from "firebase/firestore";
import { toast } from 'react-toastify'; // toast import edildi

function ManageCategories() {
    const [categoryName, setCategoryName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [color, setColor] = useState('');
    const [loading, setLoading] = useState(false);
    // actionError ve actionSuccess state'leri kaldırıldı
    const [formErrors, setFormErrors] = useState({});

    const [categories, setCategories] = useState([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState(''); // Bu liste yükleme hatası için kalabilir
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // useEffect ve filteredCategories (Öncekiyle aynı)
    useEffect(() => {
        setListLoading(true);
        const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const categoryList = [];
            querySnapshot.forEach((doc) => categoryList.push({ id: doc.id, ...doc.data() }));
            setCategories(categoryList);
            setListLoading(false);
        }, (err) => { setListError("Kategoriler yüklenirken bir hata oluştu."); setListLoading(false);});
        return () => unsubscribe();
    }, []);

    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) return categories;
        return categories.filter(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [categories, searchTerm]);


    const isValidUrl = (urlString) => { try { new URL(urlString); return true; } catch (e) { return false; } };
    const isValidColorCode = (colorString) => { if (!colorString) return true; return colorString.length < 30; };

    const validateForm = () => { /* Öncekiyle aynı */
        const errors = {};
        if (!categoryName.trim()) errors.categoryName = "Kategori adı boş bırakılamaz.";
        else if (categoryName.trim().length < 2) errors.categoryName = "Kategori adı en az 2 karakter olmalıdır.";
        else if (categoryName.trim().length > 50) errors.categoryName = "Kategori adı 50 karakterden fazla olamaz.";
        if (imageUrl.trim() && !isValidUrl(imageUrl.trim())) errors.imageUrl = "Geçerli bir URL formatı girin.";
        if (color.trim() && !isValidColorCode(color.trim())) errors.color = "Geçerli bir renk kodu/adı girin.";
        else if (color.trim().length > 20) errors.color = "Renk kodu/adı çok uzun.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => { setCategoryName(''); setImageUrl(''); setColor(''); setFormErrors({}); };
    const handleCancelEdit = () => { setEditingCategory(null); resetForm(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        if (!validateForm()) return;

        setLoading(true);
        const categoryData = { /* Öncekiyle aynı */
            name: categoryName.trim(), image: imageUrl.trim() || null, color: color.trim() || null,
        };
        try {
            if (editingCategory) {
                const docRef = doc(db, "categories", editingCategory.id);
                categoryData.updatedAt = serverTimestamp();
                await updateDoc(docRef, categoryData);
                toast.success(`'${categoryData.name}' başarıyla güncellendi!`); // Toast Success
                handleCancelEdit();
            } else {
                categoryData.createdAt = serverTimestamp();
                await addDoc(collection(db, "categories"), categoryData);
                toast.success(`'${categoryData.name}' başarıyla eklendi!`); // Toast Success
                resetForm();
            }
        } catch (err) {
            console.error("Kategori işlemi sırasında hata: ", err);
            toast.error(`Kategori ${editingCategory ? 'güncellenirken' : 'eklenirken'} bir sorun oluştu.`); // Toast Error
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId, catName) => {
        if (window.confirm(`'${catName}' kategorisini silmek istediğinizden emin misiniz?`)) {
            try {
                await deleteDoc(doc(db, "categories", categoryId));
                toast.success(`'${catName}' başarıyla silindi.`); // Toast Success
                if (editingCategory && editingCategory.id === categoryId) handleCancelEdit();
            } catch (err) {
                console.error("Kategori silinirken hata: ", err);
                toast.error("Kategori silinirken bir sorun oluştu."); // Toast Error
            }
        }
    };

    const handleStartEdit = (category) => { /* Öncekiyle aynı */
        setEditingCategory(category); setCategoryName(category.name || '');
        setImageUrl(category.image || ''); setColor(category.color || '');
        setFormErrors({}); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Kategori Yönetimi</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h3 style={styles.formTitle}>
                    {editingCategory ? `'${editingCategory.name}' Düzenle` : 'Yeni Kategori Ekle'}
                </h3>
                {/* Input Alanları ve Hata Mesajları (Öncekiyle aynı, actionError/actionSuccess <p> etiketleri kaldırıldı) */}
                <div style={styles.inputGroup}>
                    <label htmlFor="categoryName" style={styles.label}>Kategori Adı:</label>
                    <input type="text" id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} style={formErrors.categoryName ? {...styles.input, ...styles.inputError} : styles.input} placeholder="örn: Elektronik"/>
                    {formErrors.categoryName && <p style={styles.inlineErrorMessage}>{formErrors.categoryName}</p>}
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="imageUrl" style={styles.label}>Görsel URL (isteğe bağlı):</label>
                    <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={formErrors.imageUrl ? {...styles.input, ...styles.inputError} : styles.input} placeholder="örn: https://..."/>
                    {formErrors.imageUrl && <p style={styles.inlineErrorMessage}>{formErrors.imageUrl}</p>}
                </div>
                <div style={styles.inputGroup}>
                    <label htmlFor="color" style={styles.label}>Renk Kodu (isteğe bağlı):</label>
                    <input type="text" id="color" value={color} onChange={(e) => setColor(e.target.value)} style={formErrors.color ? {...styles.input, ...styles.inputError} : styles.input} placeholder="örn: #FFCC00 veya red"/>
                    {formErrors.color && <p style={styles.inlineErrorMessage}>{formErrors.color}</p>}
                </div>

                {/* actionError ve actionSuccess <p> etiketleri kaldırıldı, yerlerine toast kullanılacak */}

                <div style={styles.buttonGroup}>
                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? (editingCategory ? 'Güncelleniyor...' : 'Ekleniyor...') : (editingCategory ? 'Güncelle' : 'Kategoriyi Ekle')}
                    </button>
                    {editingCategory && (
                        <button type="button" onClick={handleCancelEdit} style={styles.cancelButton} disabled={loading}>
                            Vazgeç
                        </button>
                    )}
                </div>
            </form>

            {/* Mevcut Kategorileri Listeleme Bölümü (Öncekiyle aynı) */}
            <div style={styles.listContainer}>
                <div style={styles.listHeader}>
                    <h3 style={styles.listTitle}>Mevcut Kategoriler</h3>
                    <input type="text" placeholder="Kategorilerde Ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput}/>
                </div>
                {listLoading && <p>Kategoriler yükleniyor...</p>}
                {listError && <p style={styles.errorMessage}>{listError}</p>} {/* Liste yükleme hatası burada kalabilir */}
                {!listLoading && !listError && (
                    filteredCategories.length === 0 ? (
                        <p>{searchTerm ? 'Aramanızla eşleşen kategori bulunamadı.' : 'Henüz hiç kategori eklenmemiş.'}</p>
                    ) : (
                        <ul style={styles.categoryList}>
                            {filteredCategories.map((category) => (
                                <li key={category.id} style={styles.categoryListItem}>
                                    <div style={styles.categoryInfo}>
                                        <span style={styles.categoryName}>
                                            {category.name}
                                            {category.color && (<span style={{ ...styles.colorIndicator, backgroundColor: category.color }}></span>)}
                                        </span>
                                        {category.image && (<a href={category.image} target="_blank" rel="noopener noreferrer" style={styles.imageUrl}>Görsel</a>)}
                                    </div>
                                    <div style={styles.actionButtons}>
                                        <button onClick={() => handleStartEdit(category)} style={{...styles.actionButton, ...styles.editButton}} disabled={loading}>Düzenle</button>
                                        <button onClick={() => handleDeleteCategory(category.id, category.name)} style={{...styles.actionButton, ...styles.deleteButton}} disabled={loading}>Sil</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
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
    container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '700px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
    title: { textAlign: 'center', color: '#333', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' },
    formTitle: { margin: '0 0 10px 0', color: '#555', paddingBottom: '5px' },
    inputGroup: { display: 'flex', flexDirection: 'column' },
    label: { marginBottom: '5px', color: '#666', fontSize: '14px' },
    input: { padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
    inputError: { borderColor: '#dc3545' },
    inlineErrorMessage: { color: '#dc3545', fontSize: '12px', marginTop: '4px' },
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '10px' },
    button: { padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', flexGrow: 1 },
    cancelButton: { padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', cursor: 'pointer', flexGrow: 1 },
    errorMessage: { color: '#dc3545', fontSize: '14px', marginTop: '10px' }, // Bu, listError için hala kullanılabilir
    // successMessage kaldırıldı, yerine toast kullanılıyor
    listContainer: { marginTop: '20px' },
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    listTitle: { margin: 0, color: '#555', paddingBottom: '5px' },
    searchInput: { padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '250px' },
    categoryList: { listStyle: 'none', padding: 0, margin: 0 },
    categoryListItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 5px', borderBottom: '1px dashed #eee', fontSize: '15px', gap: '10px' },
    categoryInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexGrow: 1, marginRight: '10px' },
    categoryName: { fontWeight: '500', color: '#333', display: 'flex', alignItems: 'center', marginBottom: '3px' },
    colorIndicator: { display: 'inline-block', width: '15px', height: '15px', marginLeft: '10px', border: '1px solid #ccc', borderRadius: '3px' },
    imageUrl: { fontSize: '12px', color: '#007bff', textDecoration: 'none', wordBreak: 'break-all' },
    actionButtons: { display: 'flex', gap: '8px', alignItems: 'center' },
    actionButton: { padding: '5px 10px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white' },
    editButton: { backgroundColor: '#ffc107', color: '#333' },
    deleteButton: { backgroundColor: '#dc3545' },
});

export default ManageCategories;