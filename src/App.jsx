// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// React Toastify için importlar
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // CSS dosyasını import etmeyi unutmayın!

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ManageCategories from './components/ManageCategories';
import ManageProducts from './components/ManageProducts';
import ManageBusinesses from './components/ManageBusinesses';
import DashboardOverview from './pages/DashboardOverview';
import UserProfilePage from './pages/UserProfilePage'; // YENİ: Profil sayfasını import et

function App() {
    const { currentUser } = useAuth();

    return (
        <> {/* Fragment (<> </>) veya bir div ile sarmalayın */}
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<DashboardOverview />} />
                    <Route path="categories" element={<ManageCategories />} />
                    <Route path="products" element={<ManageProducts />} />
                    <Route path="businesses" element={<ManageBusinesses />} />
                    <Route path="profile" element={<UserProfilePage />} /> {/* YENİ: Profil sayfası için rota */}
                </Route>
                <Route
                    path="/"
                    element={
                        currentUser ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* ToastContainer'ı Routes dışına, uygulamanın geneline yerleştirin */}
            <ToastContainer
                position="top-right" // Bildirimlerin konumu
                autoClose={4000} // Otomatik kapanma süresi (ms)
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored" // "light", "dark", "colored" seçenekleri
            />
        </>
    );
}

export default App;