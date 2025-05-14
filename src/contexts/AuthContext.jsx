// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Firebase auth instance'ımız

// Context'i oluştur
const AuthContext = createContext();

// Bu hook'u kullanarak context'e kolayca erişeceğiz
export function useAuth() {
    return useContext(AuthContext);
}

// Bu Provider, uygulama ağacımızın tamamını saracak
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Başlangıçta kimlik doğrulama durumu yükleniyor

    useEffect(() => {
        // Firebase'in kimlik doğrulama durumu değişikliklerini dinle
        // Kullanıcı giriş yaptığında veya çıkış yaptığında bu fonksiyon çalışır
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user); // Kullanıcı varsa user objesini, yoksa null'ı ayarla
            setLoading(false);    // Yükleme tamamlandı
        });

        // Component unmount olduğunda (kaldırıldığında) dinleyiciyi temizle
        return unsubscribe;
    }, []); // Sadece component ilk yüklendiğinde çalışır

    const value = {
        currentUser,
        // Gelecekte buraya login, logout, signup gibi fonksiyonları ekleyebiliriz
    };

    // Yükleme tamamlanana kadar hiçbir şey gösterme (veya bir yükleme ekranı göster)
    // Provider, sarmaladığı children'lara (alt bileşenlere) 'value' prop'unu iletir
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}