// src/components/ManageProducts.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebaseConfig'; //
import {
    collection, addDoc, serverTimestamp, query, orderBy,
    doc, deleteDoc, updateDoc,
    limit, startAfter, getDocs, onSnapshot, getCountFromServer, endBefore, limitToLast
} from "firebase/firestore"; //
import { toast } from 'react-toastify'; //

const ITEMS_PER_PAGE = 5;

function ManageProducts() {
    // Form State'leri
    const [productName, setProductName] = useState(''); //
    const [description, setDescription] = useState(''); //
    const [price, setPrice] = useState(''); //
    const [selectedCategory, setSelectedCategory] = useState(''); //
    const [imageUrl, setImageUrl] = useState(''); //
    const [selectedSellerId, setSelectedSellerId] = useState(''); //
    const [sellerSearchTerm, setSellerSearchTerm] = useState(''); // YENİ: Satıcı arama metni için state

    // Kategori Listesi State'leri
    const [categories, setCategories] = useState([]); //
    const [categoriesLoading, setCategoriesLoading] = useState(true); //
    const [categoriesError, setCategoriesError] = useState(''); //

    // İşletme (Satıcı) Listesi State'leri
    const [businesses, setBusinesses] = useState([]); //
    const [businessesLoading, setBusinessesLoading] = useState(true); //
    const [businessesError, setBusinessesError] = useState(''); //

    // Ürün Listesi ve İşlem State'leri
    const [products, setProducts] = useState([]); //
    const [productsLoading, setProductsLoading] = useState(true); //
    const [productsError, setProductsError] = useState(''); //
    const [editingProduct, setEditingProduct] = useState(null); //
    const [formLoading, setFormLoading] = useState(false); //
    const [formErrors, setFormErrors] = useState({}); //
    const [searchTerm, setSearchTerm] = useState(''); //

    // Sayfalama State'leri
    const [lastFetchedDoc, setLastFetchedDoc] = useState(null); //
    const [firstFetchedDoc, setFirstFetchedDoc] = useState(null); //
    const [currentPage, setCurrentPage] = useState(1); //
    const [totalProducts, setTotalProducts] = useState(0); //

    // Kategorileri Çekme
    useEffect(() => { //
        setCategoriesLoading(true); //
        const catQuery = query(collection(db, "categories"), orderBy("name", "asc")); //
        const unsubscribeCats = onSnapshot(catQuery, (snapshot) => { //
            const catList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); //
            setCategories(catList); //
            setCategoriesLoading(false); //
        }, (err) => {
            console.error("Kategorileri çekerken hata:", err); //
            setCategoriesError("Kategoriler yüklenemedi."); //
            setCategoriesLoading(false); //
        });
        return () => unsubscribeCats(); //
    }, []);

    // İşletmeleri (Satıcıları) Çekme
    useEffect(() => { //
        setBusinessesLoading(true); //
        const bizQuery = query(collection(db, "businesses"), orderBy("businessName", "asc")); //
        const unsubscribeBiz = onSnapshot(bizQuery, (snapshot) => { //
            const bizList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); //
            setBusinesses(bizList); //
            setBusinessesLoading(false); //
        }, (err) => {
            console.error("İşletmeleri çekerken hata:", err); //
            setBusinessesError("Satıcılar (işletmeler) yüklenemedi."); //
            setBusinessesLoading(false); //
        });
        return () => unsubscribeBiz(); //
    }, []);

    const loadInitialData = useCallback(async () => { //
        setProductsLoading(true); //
        setProductsError(''); //
        try {
            const productsCollectionRef = collection(db, "products"); //
            const countSnapshot = await getCountFromServer(productsCollectionRef); //
            setTotalProducts(countSnapshot.data().count); //

            const firstPageQuery = query(productsCollectionRef, orderBy("createdAt", "desc"), limit(ITEMS_PER_PAGE)); //
            const documentSnapshots = await getDocs(firstPageQuery); //
            const fetchedProducts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() })); //

            setProducts(fetchedProducts); //
            if (documentSnapshots.docs.length > 0) { //
                setFirstFetchedDoc(documentSnapshots.docs[0]); //
                setLastFetchedDoc(documentSnapshots.docs[documentSnapshots.docs.length - 1]); //
            } else {
                setFirstFetchedDoc(null); //
                setLastFetchedDoc(null); //
            }
            setCurrentPage(1); //
        } catch (err) {
            console.error("Başlangıç verileri yüklenirken hata:", err); //
            setProductsError("Ürünler yüklenirken bir hata oluştu."); //
        } finally {
            setProductsLoading(false); //
        }
    }, []);

    useEffect(() => { //
        loadInitialData(); //
    }, [loadInitialData]); //

    const fetchProductsPage = async (direction) => { //
        if (productsLoading) return; //
        setProductsLoading(true); //
        setProductsError(''); //
        let productQuery; //
        const productsCollectionRef = collection(db, "products"); //

        if (direction === 'next' && lastFetchedDoc) { //
            productQuery = query(productsCollectionRef, orderBy("createdAt", "desc"), startAfter(lastFetchedDoc), limit(ITEMS_PER_PAGE)); //
        } else if (direction === 'prev' && firstFetchedDoc) { //
            productQuery = query(productsCollectionRef, orderBy("createdAt", "asc"), endBefore(firstFetchedDoc), limitToLast(ITEMS_PER_PAGE)); //
        } else {
            setProductsLoading(false); //
            return; //
        }

        try {
            const documentSnapshots = await getDocs(productQuery); //
            let fetchedProducts = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() })); //

            if (direction === 'prev') { //
                fetchedProducts.reverse(); //
            }

            if (fetchedProducts.length > 0) { //
                setProducts(fetchedProducts); //
                setFirstFetchedDoc(documentSnapshots.docs[0]); //
                setLastFetchedDoc(documentSnapshots.docs[documentSnapshots.docs.length - 1]); //
                if (direction === 'next') setCurrentPage(prev => prev + 1); //
                if (direction === 'prev') setCurrentPage(prev => prev - 1); //
            } else {
                toast.info(direction === 'next' ? "Son sayfadasınız." : "İlk sayfadasınız."); //
                if (direction === 'next') setLastFetchedDoc(null); //
                if (direction === 'prev') setFirstFetchedDoc(null); //
            }
        } catch (err) {
            console.error(`${direction} sayfası yüklenirken hata:`, err); //
            setProductsError("Ürünler yüklenirken bir sorun oluştu."); //
        } finally {
            setProductsLoading(false); //
        }
    };


    const handleNextPage = () => { //
        if (!lastFetchedDoc || products.length < ITEMS_PER_PAGE) { //
            toast.info("Zaten son sayfadasınız."); //
            return; //
        }
        fetchProductsPage('next'); //
    };

    const handlePreviousPage = () => { //
        if (currentPage <= 1) { //
            toast.info("Zaten ilk sayfadasınız."); //
            return; //
        }
        fetchProductsPage('prev'); //
    };

    const filteredProducts = useMemo(() => { //
        if (!searchTerm.trim()) return products; //
        const lowerSearchTerm = searchTerm.toLowerCase(); //
        return products.filter(p => //
            (p.name && p.name.toLowerCase().includes(lowerSearchTerm)) ||
            (p.sellerName && p.sellerName.toLowerCase().includes(lowerSearchTerm))
        );
    }, [products, searchTerm]); //

    // YENİ: Satıcıları arama metnine göre filtrele
    const filteredBusinesses = useMemo(() => {
        if (!sellerSearchTerm.trim()) {
            return businesses; // Arama metni yoksa tüm işletmeleri döndür
        }
        return businesses.filter(biz => //
            biz.businessName.toLowerCase().includes(sellerSearchTerm.toLowerCase())
        );
    }, [businesses, sellerSearchTerm]); //


    const isValidUrl = (urlString) => { if (!urlString) return true; try { new URL(urlString); return true; } catch (e) { return false; } }; //
    const validateForm = () => { //
        const errors = {}; //
        if (!productName.trim()) errors.productName = "Ürün adı boş bırakılamaz."; //
        else if (productName.trim().length < 3) errors.productName = "Ürün adı en az 3 karakter olmalıdır."; //
        if (!description.trim()) errors.description = "Açıklama boş bırakılamaz."; //
        else if (description.trim().length < 10) errors.description = "Açıklama en az 10 karakter olmalıdır."; //
        if (!price.trim()) errors.price = "Fiyat boş bırakılamaz."; //
        else { const pv = parseFloat(price); if (isNaN(pv) || pv <= 0) errors.price = "Geçerli pozitif bir fiyat girin."; } //
        if (!selectedCategory) errors.selectedCategory = "Kategori seçimi zorunludur."; //
        if (!selectedSellerId) errors.selectedSellerId = "Satıcı seçimi zorunludur."; //
        if (imageUrl.trim() && !isValidUrl(imageUrl.trim())) errors.imageUrl = "Geçerli bir URL formatı girin."; //
        setFormErrors(errors); //
        return Object.keys(errors).length === 0; //
    };

    const resetForm = () => { //
        setProductName(''); setDescription(''); setPrice(''); //
        setSelectedCategory(''); setImageUrl(''); //
        setSelectedSellerId(''); //
        setSellerSearchTerm(''); // YENİ: Satıcı arama metnini de sıfırla
        setFormErrors({}); //
    };
    const handleCancelEdit = () => { setEditingProduct(null); resetForm(); }; //

    const handleSubmitProduct = async (e) => { //
        e.preventDefault(); setFormErrors({}); //
        if (!validateForm()) return; //
        setFormLoading(true); //

        const priceValue = parseFloat(price); //
        const selectedSeller = businesses.find(b => b.id === selectedSellerId); //
        const sellerName = selectedSeller ? selectedSeller.businessName : 'Bilinmeyen Satıcı'; //

        const productData = { //
            name: productName.trim(), //
            description: description.trim(), //
            price: priceValue, //
            categoryId: selectedCategory, //
            imageUrl: imageUrl.trim() || null, //
            sellerId: selectedSellerId, //
            sellerName: sellerName, //
        };

        try {
            if (editingProduct) { //
                const productRef = doc(db, "products", editingProduct.id); //
                productData.updatedAt = serverTimestamp(); //
                await updateDoc(productRef, productData); //
                toast.success(`'${productData.name}' başarıyla güncellendi.`); //
                handleCancelEdit(); //
            } else {
                productData.createdAt = serverTimestamp(); //
                await addDoc(collection(db, "products"), productData); //
                toast.success(`'${productData.name}' başarıyla eklendi.`); //
                resetForm(); //
            }
            loadInitialData(); //
        } catch (err) {
            console.error("Ürün işlemi sırasında hata:", err); //
            toast.error(`Ürün ${editingProduct ? 'güncellenirken' : 'eklenirken'} sorun oluştu: ${err.message}`); //
        } finally {
            setFormLoading(false); //
        }
    };

    const handleStartEdit = (product) => { //
        setEditingProduct(product); setProductName(product.name || ''); //
        setDescription(product.description || ''); setPrice(product.price?.toString() || ''); //
        setSelectedCategory(product.categoryId || ''); setImageUrl(product.imageUrl || ''); //
        setSelectedSellerId(product.sellerId || ''); //
        setSellerSearchTerm(''); // Düzenleme başladığında satıcı arama metnini temizle
        setFormErrors({}); window.scrollTo({ top: 0, behavior: 'smooth' }); //
    };

    const handleDeleteProduct = async (productId, pName) => { //
        if (window.confirm(`'${pName}' ürününü silmek istediğinizden emin misiniz?`)) { //
            try {
                await deleteDoc(doc(db, "products", productId)); //
                toast.success(`'${pName}' başarıyla silindi.`); //
                if (editingProduct && editingProduct.id === productId) handleCancelEdit(); //
                loadInitialData(); //
            } catch (err) {
                console.error("Ürün silinirken hata:", err); //
                toast.error("Ürün silinirken sorun oluştu."); //
            }
        }
    };

    const getCategoryNameById = (catId) => { //
        const cat = categories.find(c => c.id === catId); //
        return cat ? cat.name : 'Bilinmeyen Kategori'; //
    };

    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE); //

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Ürün Yönetimi</h2> {/* */}
            <form onSubmit={handleSubmitProduct} style={styles.form}> {/* */}
                <h3 style={styles.formTitle}>{editingProduct ? `'${editingProduct.name}' Düzenle` : 'Yeni Ürün Ekle'}</h3> {/* */}
                <div style={styles.inputGroup}> {/* */}
                    <label htmlFor="productName" style={styles.label}>Ürün Adı:</label> {/* */}
                    <input type="text" id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} style={formErrors.productName ? {...styles.input, ...styles.inputError} : styles.input} placeholder="örn: Akıllı Telefon"/> {/* */}
                    {formErrors.productName && <p style={styles.inlineErrorMessage}>{formErrors.productName}</p>} {/* */}
                </div>
                <div style={styles.inputGroup}> {/* */}
                    <label htmlFor="description" style={styles.label}>Açıklama:</label> {/* */}
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} style={formErrors.description ? {...styles.input, ...styles.textarea, ...styles.inputError} : {...styles.input, ...styles.textarea}} placeholder="Ürün özellikleri, detayları..." rows={4}/> {/* */}
                    {formErrors.description && <p style={styles.inlineErrorMessage}>{formErrors.description}</p>} {/* */}
                </div>
                <div style={styles.inputRow}> {/* */}
                    <div style={styles.inputGroup}> {/* */}
                        <label htmlFor="price" style={styles.label}>Fiyat (TL):</label> {/* */}
                        <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} style={formErrors.price ? {...styles.input, ...styles.inputError} : styles.input} placeholder="örn: 1500.50" step="0.01" min="0"/> {/* */}
                        {formErrors.price && <p style={styles.inlineErrorMessage}>{formErrors.price}</p>} {/* */}
                    </div>
                    <div style={styles.inputGroup}> {/* */}
                        <label htmlFor="category" style={styles.label}>Kategori:</label> {/* */}
                        {categoriesLoading ? (<p>Kategoriler yükleniyor...</p>) : categoriesError ? (<p style={styles.errorMessage}>{categoriesError}</p>) : ( //
                            <select id="category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={formErrors.selectedCategory ? {...styles.input, ...styles.inputError} : styles.input}> {/* */}
                                <option value="" disabled>-- Kategori Seçin --</option> {/* */}
                                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))} {/* */}
                            </select>
                        )}
                        {formErrors.selectedCategory && <p style={styles.inlineErrorMessage}>{formErrors.selectedCategory}</p>} {/* */}
                    </div>
                </div>

                {/* YENİ: Satıcı Arama ve Seçim Bölümü */}
                <div style={styles.inputGroup}> {/* */}
                    <label htmlFor="sellerSearch" style={styles.label}>Satıcı Ara (İşletme Adına Göre):</label>
                    <input
                        type="text"
                        id="sellerSearch"
                        placeholder="Aramak için işletme adını yazın..."
                        value={sellerSearchTerm}
                        onChange={(e) => setSellerSearchTerm(e.target.value)}
                        style={{...styles.input, marginBottom: '10px'}} // Arama kutusu için stil
                    />
                    <label htmlFor="seller" style={styles.label}>Satıcı (İşletme) Seç:</label> {/* */}
                    {businessesLoading ? (<p>Satıcılar yükleniyor...</p>) : businessesError ? (<p style={styles.errorMessage}>{businessesError}</p>) : ( //
                        <select id="seller" value={selectedSellerId} onChange={(e) => setSelectedSellerId(e.target.value)} style={formErrors.selectedSellerId ? {...styles.input, ...styles.inputError} : styles.input}> {/* */}
                            <option value="" disabled>-- Satıcı Seçin --</option> {/* */}
                            {filteredBusinesses.map(biz => (<option key={biz.id} value={biz.id}>{biz.businessName}</option>))} {/* Artık filteredBusinesses kullanılıyor */}
                        </select>
                    )}
                    {formErrors.selectedSellerId && <p style={styles.inlineErrorMessage}>{formErrors.selectedSellerId}</p>} {/* */}
                    {filteredBusinesses.length === 0 && sellerSearchTerm && !businessesLoading && <p style={{marginTop: '5px', fontSize: '13px', color: '#777'}}>Aramanızla eşleşen satıcı bulunamadı.</p>}
                </div>


                <div style={styles.inputGroup}> {/* */}
                    <label htmlFor="imageUrl" style={styles.label}>Görsel URL (isteğe bağlı):</label> {/* */}
                    <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={formErrors.imageUrl ? {...styles.input, ...styles.inputError} : styles.input} placeholder="https://example.com/image.jpg"/> {/* */}
                    {formErrors.imageUrl && <p style={styles.inlineErrorMessage}>{formErrors.imageUrl}</p>} {/* */}
                    {editingProduct && imageUrl && ( //
                        <div style={styles.imagePreviewContainer}> {/* */}
                            <p style={styles.previewLabel}>Mevcut Görsel:</p> {/* */}
                            <img src={imageUrl} alt="Mevcut Ürün Görseli" style={styles.imagePreview} /> {/* */}
                            <button type="button" onClick={() => setImageUrl('')} style={styles.removeImageButton}>URL'yi Temizle</button> {/* */}
                        </div>
                    )}
                </div>
                <div style={styles.buttonGroup}> {/* */}
                    <button type="submit" disabled={formLoading || categoriesLoading || businessesLoading} style={styles.button}> {/* */}
                        {formLoading ? (editingProduct ? 'Güncelleniyor...' : 'Ekleniyor...') : (editingProduct ? 'Ürünü Güncelle' : 'Ürünü Ekle')} {/* */}
                    </button>
                    {editingProduct && (<button type="button" onClick={handleCancelEdit} style={styles.cancelButton} disabled={formLoading}>Vazgeç</button>)} {/* */}
                </div>
            </form>

            <div style={styles.listContainer}> {/* */}
                <div style={styles.listHeader}> {/* */}
                    <h3 style={styles.listTitle}>Mevcut Ürünler ({totalProducts})</h3> {/* */}
                    <input
                        type="text"
                        placeholder="Ürün Adı veya Satıcı Adı Ara..." /* */
                        value={searchTerm} //
                        onChange={(e) => setSearchTerm(e.target.value)} //
                        style={styles.searchInput} //
                    />
                </div>

                {productsLoading && !products.length && <p>Ürünler yükleniyor...</p>} {/* */}
                {productsError && <p style={styles.errorMessage}>{productsError}</p>} {/* */}
                {!productsLoading && !productsError && filteredProducts.length === 0 && ( //
                    <p>{searchTerm ? 'Aramanızla eşleşen ürün bulunamadı.' : 'Henüz hiç ürün eklenmemiş veya bu sayfada ürün yok.'}</p> //
                )}

                {!productsLoading && !productsError && filteredProducts.length > 0 && ( //
                    <>
                        <table style={styles.productTable}> {/* */}
                            <thead> {/* */}
                            <tr>
                                <th style={styles.th}>Görsel</th> {/* */}
                                <th style={styles.th}>Adı</th> {/* */}
                                <th style={styles.th}>Kategori</th> {/* */}
                                <th style={styles.th}>Satıcı</th> {/* */}
                                <th style={styles.th}>Fiyat</th> {/* */}
                                <th style={styles.th}>İşlemler</th> {/* */}
                            </tr>
                            </thead>
                            <tbody> {/* */}
                            {filteredProducts.map((product) => ( //
                                <tr key={product.id}> {/* */}
                                    <td style={styles.td}>{product.imageUrl ? (<img src={product.imageUrl} alt={product.name} style={styles.productImage}/>) : (<span style={styles.noImageText}>Görsel Yok</span>)}</td> {/* */}
                                    <td style={styles.td}>{product.name}</td> {/* */}
                                    <td style={styles.td}>{getCategoryNameById(product.categoryId)}</td> {/* */}
                                    <td style={styles.td}>{product.sellerName || (product.sellerId ? 'Satıcı Yükleniyor...' : '-')}</td> {/* */}
                                    <td style={styles.td}>{product.price?.toFixed(2)} TL</td> {/* */}
                                    <td style={styles.td}> {/* */}
                                        <div style={styles.actionButtons}> {/* */}
                                            <button onClick={() => handleStartEdit(product)} style={{...styles.actionButton, ...styles.editButton}} disabled={formLoading}>Düzenle</button> {/* */}
                                            <button onClick={() => handleDeleteProduct(product.id, product.name)} style={{...styles.actionButton, ...styles.deleteButton}} disabled={formLoading}>Sil</button> {/* */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div style={styles.paginationControls}> {/* */}
                            <button onClick={handlePreviousPage} disabled={currentPage === 1 || productsLoading} style={styles.paginationButton}> {/* */}
                                « Önceki
                            </button>
                            <span style={styles.pageInfo}>Sayfa {currentPage} / {totalPages > 0 ? totalPages : 1}</span> {/* */}
                            <button onClick={handleNextPage} disabled={currentPage === totalPages || products.length < ITEMS_PER_PAGE || productsLoading || !lastFetchedDoc } style={styles.paginationButton}> {/* */}
                                Sonraki »
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = { //
    container: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '950px', margin: '20px auto', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'},
    title: { textAlign: 'center', color: '#333', marginBottom: '30px'},
    form: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px', paddingTop: '10px', paddingBottom: '20px', borderBottom: '1px solid #eee'},
    formTitle: { margin: '0 0 15px 0', color: '#444', paddingBottom: '5px', fontSize: '1.3em', borderBottom: '1px solid #ddd'},
    inputGroup: { display: 'flex', flexDirection: 'column', flex: 1, marginBottom: '5px'},
    inputRow: { display: 'flex', gap: '20px', marginBottom: '10px'},
    label: { marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: 'bold'},
    input: { padding: '10px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '100%', boxSizing: 'border-box'},
    inputError: { borderColor: '#e74c3c', boxShadow: '0 0 0 0.2rem rgba(231,76,60,.25)' },
    inlineErrorMessage: { color: '#e74c3c', fontSize: '12px', marginTop: '5px' },
    textarea: { resize: 'vertical', minHeight: '90px'},
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '15px', justifyContent:'flex-end'},
    button: { padding: '10px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', cursor: 'pointer' },
    cancelButton: { padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', cursor: 'pointer'},
    errorMessage: { color: '#e74c3c', fontSize: '14px', marginTop: '5px', padding: '10px', backgroundColor: '#fdd', border: '1px solid #e74c3c', borderRadius:'4px'},
    listContainer: { marginTop: '20px'},
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'},
    listTitle: { margin: 0, color: '#444', fontSize: '1.3em' },
    searchInput: { padding: '9px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', width: '300px'},
    productTable: { width: '100%', borderCollapse: 'collapse', marginTop: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'},
    th: { borderBottom: '2px solid #bdc3c7', padding: '12px 10px', textAlign: 'left', backgroundColor: '#ecf0f1', fontSize: '14px', fontWeight: '600', color: '#34495e'},
    td: { borderBottom: '1px solid #ecf0f1', padding: '10px', fontSize: '14px', verticalAlign: 'middle'},
    productImage: { width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd'},
    noImageText: { fontSize: '12px', color: '#7f8c8d', display: 'inline-block', width: '50px', height: '50px', lineHeight: '50px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f8f8'},
    actionButtons: { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-start'},
    actionButton: { padding: '6px 12px', fontSize: '13px', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white'},
    editButton: { backgroundColor: '#f39c12', color: 'white'},
    deleteButton: { backgroundColor: '#e74c3c'},
    imagePreviewContainer: { marginTop: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fdfdfd' },
    previewLabel: { fontSize: '12px', color: '#555', marginBottom: '5px' },
    imagePreview: { maxWidth: '100px', maxHeight: '100px', borderRadius: '4px', border: '1px solid #ddd', objectFit: 'contain', marginBottom: '5px', },
    removeImageButton: { fontSize: '12px', padding: '3px 8px', color: '#e74c3c', backgroundColor: 'transparent', border: '1px solid #e74c3c', borderRadius: '4px', cursor: 'pointer' },
    paginationControls: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '25px', padding: '15px 0', borderTop: '1px solid #eee' },
    paginationButton: { padding: '9px 18px', margin: '0 8px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', opacity: 1, transition: 'opacity 0.2s ease' },
    pageInfo: { margin: '0 15px', fontSize: '15px', color: '#555', fontWeight: '500' }
};

export default ManageProducts;