// firebase-config.js - VERSIÓN COMPATIBLE
try {
    // Configuración de Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyB3_YctQ5MYjI-Sq8DMfK1dl5Hajw6H1Go",
        authDomain: "inventaval-9a9d1.firebaseapp.com",
        projectId: "inventaval-9a9d1",
        storageBucket: "inventaval-9a9d1.firebasestorage.app",
        messagingSenderId: "79111656175",
        appId: "1:79111656175:web:551566ecb1c57a5b47411a"
    };
    
    // Inicializar Firebase (versión compat)
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase v9 configurado correctamente");
    
} catch (error) {
    console.error("❌ Error configurando Firebase:", error);
}
