import { app, db } from './firebase-config.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error');
    const tbody = document.getElementById('comments-tbody');
    
    const settingWa = document.getElementById('setting-wa');
    const settingsForm = document.getElementById('settings-form');
    const settingsMsg = document.getElementById('settings-msg');

    // Auth state observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            loadDashboard();
        } else {
            loginSection.classList.remove('hidden');
            dashboardSection.classList.add('hidden');
        }
    });

    // Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            loginError.style.display = 'none';
        } catch (error) {
            loginError.textContent = "Acceso denegado: Credenciales incorrectas o Auth no habilitado en Firebase.";
            loginError.style.display = 'block';
            console.error(error);
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => signOut(auth));

    // Dashboard Data
    let unsubscribeComments = null;

    function loadDashboard() {
        // Load Settings (WhatsApp & Audio)
        const settingsRef = doc(db, "settings", "contact");
        getDoc(settingsRef).then((snap) => {
            if (snap.exists()) {
                if(snap.data().whatsapp) settingWa.value = snap.data().whatsapp;
                else settingWa.value = '50662464128';
                
                if(snap.data().audioUrl) document.getElementById('setting-audio').value = snap.data().audioUrl;
            } else {
                settingWa.value = '50662464128'; // El número solicitado como fallback
            }
        });

        // Load Comments (Realtime)
        const q = query(collection(db, "comments"), orderBy("createdAt", "desc"));
        
        if (unsubscribeComments) unsubscribeComments(); // cleanup old listener if any

        unsubscribeComments = onSnapshot(q, (snapshot) => {
            tbody.innerHTML = '';
            if(snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5">No hay comentarios en la base de datos.</td></tr>';
                return;
            }

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const id = docSnap.id;
                let dateStr = 'N/A';
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    dateStr = data.createdAt.toDate().toLocaleDateString();
                } else if (data.createdAt) {
                    dateStr = new Date(data.createdAt).toLocaleDateString();
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${data.author || 'Anon'}</td>
                    <td>${data.text || ''}</td>
                    <td><span class="status-badge status-${data.status}">${data.status}</span></td>
                    <td>
                        ${data.status === 'pendiente' ? `<button class="action-btn btn-approve" data-id="${id}">Aprobar</button>` : ''}
                        <button class="action-btn btn-delete" data-id="${id}">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Add Event Listeners for action buttons
            document.querySelectorAll('.btn-approve').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    try {
                        await updateDoc(doc(db, "comments", id), { status: "aprobado" });
                    } catch (err) {
                        alert("Error al aprobar: " + err.message);
                    }
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm("¿Seguro que quieres eliminar este comentario permanentemente?")) {
                        const id = e.target.getAttribute('data-id');
                        try {
                            await deleteDoc(doc(db, "comments", id));
                        } catch (err) {
                            alert("Error al eliminar: " + err.message);
                        }
                    }
                });
            });
        }, (error) => {
            console.error("Error fetching comments:", error);
            tbody.innerHTML = '<tr><td colspan="5" style="color:red;">Error de permisos. Asegúrate de que las reglas de Firestore permiten lectura/escritura.</td></tr>';
        });
    }

    // Save Settings
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const wa = settingWa.value.trim();
        const audioUrl = document.getElementById('setting-audio').value.trim();
        try {
            await setDoc(doc(db, "settings", "contact"), { whatsapp: wa, audioUrl: audioUrl }, { merge: true });
            settingsMsg.textContent = "Guardado correctamente.";
            setTimeout(() => settingsMsg.textContent = "", 3000);
        } catch(err) {
            settingsMsg.textContent = "Error al guardar.";
            settingsMsg.style.color = "red";
            console.error(err);
        }
    });
});
