import { db } from './firebase-config.js';
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Elements ---
    const video = document.getElementById('bg-video');
    const audio = document.getElementById('bg-audio');
    const volumeBtn = document.getElementById('volume-btn');
    
    // --- Dynamic Settings ---
    let whatsappNumber = '50662464128'; // Default
    // Default upbeat audio track (Royalty free)
    const defaultAudioUrl = 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=good-vibes-127577.mp3'; 
    
    try {
        const settingsRef = doc(db, "settings", "contact");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
            if(settingsSnap.data().whatsapp) whatsappNumber = settingsSnap.data().whatsapp;
            if(settingsSnap.data().audioUrl) {
                audio.src = settingsSnap.data().audioUrl;
            } else {
                audio.src = defaultAudioUrl;
            }
        } else {
            audio.src = defaultAudioUrl;
        }
    } catch (e) {
        console.log("Usando ajustes por defecto.");
        audio.src = defaultAudioUrl;
    }

    // --- Audio Control (Runs after fetching settings) ---
    audio.volume = 0.5;
    let audioPlaying = false;

    const tryPlayAudio = async () => {
        if(audioPlaying) return;
        try {
            await audio.play();
            audioPlaying = true;
            volumeBtn.textContent = '🔊';
            volumeBtn.title = 'Mute Audio';
        } catch (err) {
            // Autoplay prevented by browser
            volumeBtn.textContent = '🔇';
            volumeBtn.title = 'Play Audio';
        }
    };

    tryPlayAudio();
    
    // Fallback: play on first interaction if blocked
    document.body.addEventListener('click', () => {
        if (!audioPlaying) tryPlayAudio();
    }, { once: true });

    volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused || !audioPlaying) {
            audio.play();
            audioPlaying = true;
            volumeBtn.textContent = '🔊';
            volumeBtn.title = 'Mute Audio';
        } else {
            audio.pause();
            audioPlaying = false;
            volumeBtn.textContent = '🔇';
            volumeBtn.title = 'Play Audio';
        }
    });

    // --- Video Scroll Sync ---
    video.addEventListener('loadedmetadata', () => {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollPosition = window.scrollY;
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollPercentage = scrollPosition / maxScroll;
                    
                    if (video.duration && !isNaN(video.duration)) {
                        const targetTime = video.duration * scrollPercentage;
                        video.currentTime = Math.min(Math.max(targetTime, 0), video.duration - 0.1);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    });

    if(video.readyState >= 1) {
        let event = new Event('loadedmetadata');
        video.dispatchEvent(event);
    }

    // --- Intersection Observer for Elastic Animations ---
    const animatedElements = document.querySelectorAll('[data-animate]');
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.2 };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    animatedElements.forEach(el => observer.observe(el));

    // --- Order Modal Logic ---
    const orderModal = document.getElementById('order-modal');
    const closeOrderBtn = document.getElementById('close-order-modal');
    const orderBtns = document.querySelectorAll('.order-btn');
    
    const qtyInput = document.getElementById('quantity');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const totalPriceEl = document.getElementById('total-price');
    const flavorInput = document.getElementById('flavor-input');
    const orderModalTitle = document.getElementById('modal-title');
    const orderForm = document.getElementById('order-form');
    const giftMessage = document.getElementById('gift-message');
    
    const PRICE_PER_ITEM = 2500;
    
    const updatePrice = () => {
        const qty = parseInt(qtyInput.value) || 1;
        totalPriceEl.textContent = `₡${qty * PRICE_PER_ITEM}`;
    };
    
    orderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const flavor = e.target.getAttribute('data-flavor');
            flavorInput.value = flavor;
            orderModalTitle.textContent = `Ordenar Cheesecake de ${flavor}`;
            qtyInput.value = 1;
            giftMessage.value = '';
            updatePrice();
            orderModal.classList.add('active');
        });
    });
    
    closeOrderBtn.addEventListener('click', () => orderModal.classList.remove('active'));
    
    qtyMinus.addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        if (val > 1) { qtyInput.value = val - 1; updatePrice(); }
    });
    
    qtyPlus.addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        qtyInput.value = val + 1; updatePrice();
    });
    
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const flavor = flavorInput.value;
        const qty = qtyInput.value;
        const msg = giftMessage.value.trim();
        const total = qty * PRICE_PER_ITEM;
        
        let text = `¡Hola SweetBliss! Me gustaría ordenar:\n\n🍰 Producto: Cheesecake de ${flavor}\n🔢 Cantidad: ${qty}\n💰 Total: ₡${total}\n`;
        if (msg) text += `\n🎁 Mensaje de Regalo: "${msg}"\n`;
        
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
        orderModal.classList.remove('active');
    });

    // --- Review Modal Logic ---
    const reviewModal = document.getElementById('review-modal');
    const closeReviewBtn = document.getElementById('close-review-modal');
    const leaveReviewBtn = document.getElementById('leave-review-btn');
    const reviewForm = document.getElementById('review-form');
    const reviewFeedback = document.getElementById('review-feedback');
    const submitReviewBtn = document.getElementById('submit-review-btn');

    leaveReviewBtn.addEventListener('click', () => {
        reviewForm.reset();
        reviewFeedback.style.display = 'none';
        submitReviewBtn.disabled = false;
        reviewModal.classList.add('active');
    });

    closeReviewBtn.addEventListener('click', () => reviewModal.classList.remove('active'));

    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitReviewBtn.disabled = true;
        reviewFeedback.style.display = 'block';
        reviewFeedback.textContent = 'Enviando...';
        reviewFeedback.style.color = 'var(--text-color)';

        const name = document.getElementById('review-name').value.trim();
        const text = document.getElementById('review-text').value.trim();

        try {
            await addDoc(collection(db, "comments"), {
                author: name,
                text: text,
                status: "pendiente",
                createdAt: new Date()
            });
            reviewFeedback.textContent = '¡Gracias! Tu reseña ha sido enviada para aprobación.';
            reviewFeedback.style.color = '#25D366'; // Green
            setTimeout(() => {
                reviewModal.classList.remove('active');
            }, 3000);
        } catch (error) {
            console.error(error);
            reviewFeedback.textContent = 'Error: No se pudo enviar. Revisa las reglas de seguridad de Firestore.';
            reviewFeedback.style.color = 'red';
            submitReviewBtn.disabled = false;
        }
    });

    // Close Modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) orderModal.classList.remove('active');
        if (e.target === reviewModal) reviewModal.classList.remove('active');
    });

    // --- Floating Parallax Particles ---
    const overlay = document.getElementById('parallax-overlay');
    // Emojis removidos, solo dejamos brillos/estrellas sutiles
    const particleTypes = ['✨', '✦', '💫'];
    for(let i=0; i<20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.textContent = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        p.style.top = `${Math.random() * 100}vh`;
        p.style.animationDuration = `${15 + Math.random() * 30}s`;
        p.style.animationDelay = `-${Math.random() * 20}s`;
        overlay.appendChild(p);
    }

    // --- 3D Mouse Parallax on Cheesecakes ---
    const parallaxImages = document.querySelectorAll('.parallax-img');
    
    // Optimización: usar requestAnimationFrame para que el evento no bloquee el hilo
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    document.addEventListener('touchmove', (e) => {
        if(e.touches.length > 0) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY;
        }
    });

    const updateParallax = () => {
        parallaxImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            // Comprobar si la imagen está visible en pantalla para evitar cálculos innecesarios
            if (rect.bottom < 0 || rect.top > window.innerHeight) return;

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (mouseX - centerX) / window.innerWidth;
            const deltaY = (mouseY - centerY) / window.innerHeight;

            const rotateX = -deltaY * 20; 
            const rotateY = deltaX * 20;

            img.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${deltaX*30}px, ${deltaY*30}px, 20px)`;
        });
        requestAnimationFrame(updateParallax);
    };
    
    requestAnimationFrame(updateParallax);
});
