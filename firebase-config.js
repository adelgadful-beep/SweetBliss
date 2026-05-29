// firebase-config.js
// Firebase SDK Modular Import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// TODO: Reemplaza esta configuración con la de tu proyecto de Firebase
// Estos datos los obtienes en la consola de Firebase al agregar una web app
const firebaseConfig = {
  projectId: "soda-punto-y-coma",
  appId: "1:889504353305:web:3fd45d4886304cb8b8ae88",
  storageBucket: "soda-punto-y-coma.firebasestorage.app",
  apiKey: "AIzaSyBG4wt-voHOa2-Bv5z8d-jFZP47ouSpwwc",
  authDomain: "soda-punto-y-coma.firebaseapp.com",
  messagingSenderId: "889504353305"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para cargar los comentarios aprobados
async function loadComments() {
    const commentsContainer = document.getElementById('comments-list');
    
    try {
        // Validación temporal: Si no has cambiado las credenciales, mostramos un mensaje de aviso
        if (firebaseConfig.apiKey === "TU_API_KEY") {
            commentsContainer.innerHTML = `
                <div class="comment-card">
                    <h4>¡Aviso de Configuración!</h4>
                    <p>Por favor configura tus credenciales reales de Firebase en el archivo <code>firebase-config.js</code> para que podamos cargar los comentarios de tus clientes.</p>
                </div>
                <div class="comment-card">
                    <h4>María (Ejemplo)</h4>
                    <p>¡El cheesecake de Maracuyá es espectacular! Súper recomendado.</p>
                </div>
            `;
            return;
        }

        // Consultar la colección "comments" donde el status sea "aprobado"
        const q = query(collection(db, "comments"), where("status", "==", "aprobado"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            commentsContainer.innerHTML = '<p>No hay reseñas todavía. ¡Sé el primero en dejar una!</p>';
            return;
        }

        // Limpiar el mensaje de "Cargando reseñas..."
        commentsContainer.innerHTML = ''; 
        
        // Iterar sobre los resultados y crear las tarjetas de comentarios
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const commentHTML = `
                <div class="comment-card">
                    <h4>${data.author || 'Cliente Feliz'}</h4>
                    <p>${data.text || ''}</p>
                </div>
            `;
            commentsContainer.innerHTML += commentHTML;
        });

    } catch (error) {
        console.error("Error al cargar comentarios: ", error);
        commentsContainer.innerHTML = `
            <div class="comment-card" style="border-left-color: #ff4d4d;">
                <h4>Error</h4>
                <p>Hubo un problema al conectar con la base de datos. Verifica tus credenciales de Firebase o intenta de nuevo más tarde.</p>
            </div>
        `;
    }
}

// Ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', loadComments);
