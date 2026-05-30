import { db } from './firebase-config.js';
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Audio Control ---
    const video = document.getElementById('bg-video');
    const audio = document.getElementById('bg-audio');
    const volumeBtn = document.getElementById('volume-btn');
    
    // Attempt autoplay
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

    // --- Dynamic Settings ---
    let whatsappNumber = '50662464128'; // Default (506 + 62464128)
    try {
        const settingsRef = doc(db, "settings", "contact");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().whatsapp) {
            whatsappNumber = settingsSnap.data().whatsapp;
        }
    } catch (e) {
        console.log("Usando número de WhatsApp por defecto.");
    }

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
            reviewFeedback.textContent = 'Hubo un error al enviar tu reseña. Verifica tu conexión.';
            reviewFeedback.style.color = 'red';
            submitReviewBtn.disabled = false;
        }
    });

    // Close Modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) orderModal.classList.remove('active');
        if (e.target === reviewModal) reviewModal.classList.remove('active');
    });
});
