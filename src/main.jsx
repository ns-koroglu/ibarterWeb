// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Veya App.css
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx'; // AuthProvider'ı import et

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider> {/* Uygulamayı AuthProvider ile sar */}
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
)