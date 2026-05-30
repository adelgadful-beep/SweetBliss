// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  projectId: "soda-punto-y-coma",
  appId: "1:889504353305:web:3fd45d4886304cb8b8ae88",
  storageBucket: "soda-punto-y-coma.firebasestorage.app",
  apiKey: "AIzaSyBG4wt-voHOa2-Bv5z8d-jFZP47ouSpwwc",
  authDomain: "soda-punto-y-coma.firebaseapp.com",
  messagingSenderId: "889504353305"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Función para cargar los comentarios aprobados
export async function loadComments() {
    const commentsContainer = document.getElementById('comments-list');
    if (!commentsContainer) return;
    
    try {
        const q = query(collection(db, "comments"), where("status", "==", "aprobado"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            commentsContainer.innerHTML = '<p style="text-align:center; width:100%; color:#666;">No hay reseñas todavía. ¡Sé el primero en dejar una!</p>';
            return;
        }

        commentsContainer.innerHTML = ''; 
        
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
                <p>Hubo un problema al conectar con la base de datos.</p>
            </div>
        `;
    }
}

// Opcional: cargar comentarios al inicio si estamos en index.html
if (document.getElementById('comments-list')) {
    document.addEventListener('DOMContentLoaded', loadComments);
}
