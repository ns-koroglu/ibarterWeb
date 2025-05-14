// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDcOh-picpm6bw_Ov8UYx2zOK7g8EwVSFE",
    authDomain: "investbarter-38.firebaseapp.com",
    projectId: "investbarter-38",
    storageBucket: "investbarter-38.firebasestorage.app",
    messagingSenderId: "305704487040",
    appId: "1:305704487040:web:a07e25bcd4e1a8caee7e65",
    measurementId: "G-XD9SC797JS"
};
const app = initializeApp(firebaseConfig);

// İhtiyaç duyulan servisleri export et
const db = getFirestore(app);
const auth = getAuth(app); // Auth kullanacaksanız

export { db, auth }; // Diğer dosyalarda kullanmak için export edin