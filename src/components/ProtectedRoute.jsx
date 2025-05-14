// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    const { currentUser } = useAuth();

    if (!currentUser) {
        // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
        // 'replace' prop'u, tarayıcı geçmişinde login sayfasının üzerine yazılmasını sağlar
        return <Navigate to="/login" replace />;
    }

    // Kullanıcı giriş yapmışsa, istenen sayfayı (children) göster
    return children;
}

export default ProtectedRoute;