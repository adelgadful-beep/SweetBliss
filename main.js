document.addEventListener('DOMContentLoaded', () => {
    // --- Video Scroll Sync ---
    const video = document.getElementById('bg-video');
    
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
                        // Avoid errors by constraining targetTime
                        video.currentTime = Math.min(Math.max(targetTime, 0), video.duration - 0.1);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    });

    // In case video metadata is already loaded (cached)
    if(video.readyState >= 1) {
        let event = new Event('loadedmetadata');
        video.dispatchEvent(event);
    }

    // --- Intersection Observer for Elastic Animations ---
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Remove this line if you only want the animation to happen once
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);
    
    animatedElements.forEach(el => observer.observe(el));

    // --- Modal Logic ---
    const modal = document.getElementById('order-modal');
    const closeBtn = document.querySelector('.close-btn');
    const orderBtns = document.querySelectorAll('.order-btn');
    
    const qtyInput = document.getElementById('quantity');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const totalPriceEl = document.getElementById('total-price');
    const flavorInput = document.getElementById('flavor-input');
    const modalTitle = document.getElementById('modal-title');
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
            modalTitle.textContent = `Ordenar Cheesecake de ${flavor}`;
            qtyInput.value = 1;
            giftMessage.value = '';
            updatePrice();
            modal.classList.add('active');
        });
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    qtyMinus.addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        if (val > 1) {
            qtyInput.value = val - 1;
            updatePrice();
        }
    });
    
    qtyPlus.addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        qtyInput.value = val + 1;
        updatePrice();
    });
    
    // --- WhatsApp Order Submission ---
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const flavor = flavorInput.value;
        const qty = qtyInput.value;
        const msg = giftMessage.value.trim();
        const total = qty * PRICE_PER_ITEM;
        
        let whatsappText = `¡Hola SweetBliss! Me gustaría ordenar:\n\n`;
        whatsappText += `🍰 Producto: Cheesecake de ${flavor}\n`;
        whatsappText += `🔢 Cantidad: ${qty}\n`;
        whatsappText += `💰 Total: ₡${total}\n`;
        
        if (msg) {
            whatsappText += `\n🎁 Mensaje de Regalo: "${msg}"\n`;
        }
        
        const encodedText = encodeURIComponent(whatsappText);
        // Costa Rica WhatsApp number provided by user: 86099810
        const phoneNumber = '50686099810'; 
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;
        
        window.open(whatsappUrl, '_blank');
        modal.classList.remove('active');
    });
});
