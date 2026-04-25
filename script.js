// ── CHATBOT WIDGET ───────────────────────────────────────────────────────────
const chatWidget   = document.getElementById('chat-widget');
const chatToggle   = document.getElementById('chat-toggle');
const chatCloseBtn = document.getElementById('chat-close-btn');
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSend     = document.getElementById('chat-send');

function toggleChat() {
    chatWidget.classList.toggle('open');
    if (chatWidget.classList.contains('open')) chatInput.focus();
}

chatToggle.addEventListener('click', toggleChat);
chatCloseBtn.addEventListener('click', toggleChat);

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `chat-msg ${sender}`;
    msg.innerHTML = `<div class="chat-bubble">${text}</div>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
}

function showTyping() {
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot chat-typing';
    msg.id = 'chat-typing-indicator';
    msg.innerHTML = `<div class="chat-bubble">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
    </div>`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('chat-typing-indicator');
    if (el) el.remove();
}

// ── BOOKING FLOW STATE MACHINE ───────────────────────────────────────────────
let bookingState = null; // null | 'name' | 'email' | 'phone' | 'slots'
let bookingData  = {};

function startBooking() {
    bookingState = 'name';
    bookingData  = {};
    return "Sure! Let's book a consultation. 📅<br><br>First, what's your <strong>full name</strong>?";
}

function handleBookingFlow(text) {
    if (bookingState === 'name') {
        bookingData.name = text;
        bookingState = 'email';
        return `Nice to meet you, <strong>${text}</strong>! 😊<br><br>What's your <strong>email address</strong>?`;
    }
    if (bookingState === 'email') {
        if (!/\S+@\S+\.\S+/.test(text))
            return "That doesn't look like a valid email. Could you check it again? 🤔";
        bookingData.email = text;
        bookingState = 'phone';
        return `Got it! 📧<br><br>What's your <strong>phone number</strong>? (include country code if outside Singapore)`;
    }
    if (bookingState === 'phone') {
        bookingData.phone = text;
        bookingState = 'slots';
        setTimeout(showSlotForm, 400);
        return `Perfect! 📱<br><br>Please pick your <strong>3 preferred time slots</strong> below:`;
    }
    return null;
}

function showSlotForm() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg bot';
    wrap.innerHTML = `
        <div class="chat-bubble chat-form-bubble">
            <div class="slot-form">
                <div class="slot-pricing">
                    <div class="slot-pricing-row">📌 <strong>Deposit:</strong> SGD $20 <span class="slot-pricing-note">(non-refundable)</span></div>
                    <div class="slot-pricing-row">⏱️ <strong>Rate:</strong> SGD $2 / hour</div>
                </div>
                <div class="slot-divider"></div>
                <div class="slot-row">
                    <label>Slot 1 <span class="slot-req">*</span></label>
                    <input type="datetime-local" class="slot-input" id="slot-1">
                </div>
                <div class="slot-row">
                    <label>Slot 2 <span class="slot-req">*</span></label>
                    <input type="datetime-local" class="slot-input" id="slot-2">
                </div>
                <div class="slot-row">
                    <label>Slot 3 <span class="slot-opt">(optional)</span></label>
                    <input type="datetime-local" class="slot-input" id="slot-3">
                </div>
                <button class="slot-submit-btn" onclick="submitBooking()">
                    <i class="fas fa-paper-plane"></i> Submit Booking
                </button>
            </div>
        </div>`;
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function submitBooking() {
    const s1 = document.getElementById('slot-1').value;
    const s2 = document.getElementById('slot-2').value;
    const s3 = document.getElementById('slot-3').value;

    if (!s1 || !s2) {
        addMessage("Please fill in at least the first 2 preferred slots before submitting. 🙏", 'bot');
        return;
    }

    const fmt = v => v
        ? new Date(v).toLocaleString('en-SG', { weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
        : 'Not provided';

    const savedName  = bookingData.name;
    const savedEmail = bookingData.email;
    const savedPhone = bookingData.phone;

    const tgText =
        `📅 Booking Request\n\n` +
        `👤 Name: ${savedName}\n` +
        `📧 Email: ${savedEmail}\n` +
        `📱 Phone: ${savedPhone}\n\n` +
        `🕐 Preferred Slots:\n` +
        `  Slot 1: ${fmt(s1)}\n` +
        `  Slot 2: ${fmt(s2)}\n` +
        `  Slot 3: ${fmt(s3)}\n\n` +
        `💰 Deposit: SGD $20 | Rate: SGD $2/hr`;

    bookingState = null;
    bookingData  = {};

    // Open Telegram with pre-filled message (use anchor to avoid pop-up blocker)
    const tgLink = document.createElement('a');
    tgLink.href = `https://t.me/AlphaPsiSigmaBot?text=${encodeURIComponent(tgText)}`;
    tgLink.target = '_blank';
    tgLink.rel = 'noopener';
    document.body.appendChild(tgLink);
    tgLink.click();
    document.body.removeChild(tgLink);

    addMessage(
        `📲 Telegram is opening with your booking details pre-filled.<br><br>` +
        `Just hit <strong>Send</strong> in Telegram to submit your request!<br><br>` +
        `We'll confirm your slot with <strong>${savedEmail}</strong> within 24 hours. 🎉`,
        'bot'
    );
}
// ────────────────────────────────────────────────────────────────────────────

// ── TODO: Replace this with a real OpenAI API call ──────────────────────────
async function getBotReply(userMessage) {
    // Check booking flow first
    if (bookingState) {
        const flowReply = handleBookingFlow(userMessage);
        if (flowReply !== null) return flowReply;
    }

    const msg = userMessage.toLowerCase();
    if (msg.includes('book') || msg.includes('slot') || msg.includes('appointment') || msg.includes('schedule') || msg.includes('consult'))
        return startBooking();
    if (msg.includes('hello') || msg.includes('hi'))
        return "Hello! 👋 How can I help you and your child today? You can type <strong>book</strong> to schedule a consultation!";
    if (msg.includes('psle'))
        return "We offer practical PSLE preparation strategies tailored to your child's learning style. Type <strong>book</strong> to schedule a consultation!";
    if (msg.includes('price') || msg.includes('cost') || msg.includes('fee') || msg.includes('pricing') || msg.includes('rate') || msg.includes('charge') || msg.includes('pay'))
        return "Here's our consultation pricing 💰<br><br>" +
               "📌 <strong>Deposit:</strong> SGD $20 (non-refundable, required to confirm your slot)<br>" +
               "⏱️ <strong>Rate:</strong> SGD $2 per hour<br><br>" +
               "Type <strong>book</strong> to reserve your slot, or email us at info@alphapsisigma.com for more details!";
    if (msg.includes('contact') || msg.includes('email'))
        return "You can reach us at info@alphapsisigma.com. We'd love to hear from you!";
    if (msg.includes('who') || msg.includes('founder'))
        return "Alpha Psi Sigma was founded by Dr. Jimmy Y. Zhong and Dr. Sim Kuan Goh — both leading experts in neuroscience, AI, and education.";
    return "Thanks for your message! 😊 Type <strong>book</strong> to schedule a consultation, or email us at info@alphapsisigma.com.";
}
// ────────────────────────────────────────────────────────────────────────────

async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    addMessage(text, 'user');
    showTyping();
    const reply = await getBotReply(text);
    setTimeout(() => {
        removeTyping();
        addMessage(reply, 'bot');
    }, 800);
}

chatSend.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
});


// "Book a Slot" CTA → open chat + start booking flow
document.getElementById('book-slot-cta').addEventListener('click', () => {
    if (!chatWidget.classList.contains('open')) chatWidget.classList.add('open');
    chatWidget.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setTimeout(() => {
        addMessage(startBooking(), 'bot');
        chatInput.focus();
    }, 300);
});

// ── TERMS OF SERVICE MODAL ───────────────────────────────────────────────────
const tosModal   = document.getElementById('tos-modal');
const tosOpen    = document.getElementById('tos-open');
const tosClose   = document.getElementById('tos-close');
const tosAccept  = document.getElementById('tos-accept');

function openTos()  { tosModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeTos() { tosModal.classList.remove('active'); document.body.style.overflow = ''; }

if (tosOpen)   tosOpen.addEventListener('click', openTos);
if (tosClose)  tosClose.addEventListener('click', closeTos);
if (tosAccept) tosAccept.addEventListener('click', closeTos);

// Close on backdrop click
if (tosModal) {
    tosModal.addEventListener('click', (e) => {
        if (e.target === tosModal) closeTos();
    });
}

// Close any open modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.tos-overlay.active').forEach(m => {
            m.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
});

// ── BIO MODALS ───────────────────────────────────────────────────────────────
document.querySelectorAll('.bio-read-more').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = document.getElementById(btn.dataset.target);
        if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    });
});

document.querySelectorAll('.bio-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.tos-overlay').classList.remove('active');
        document.body.style.overflow = '';
    });
});

document.querySelectorAll('.tos-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
    });
});

// ── 0. HAMBURGER MENU ────────────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when a link is tapped
    navMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
        });
    });

    // Close menu when tapping outside
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            navMenu.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
        }
    });
}

// ── 1. SCROLL PROGRESS BAR ──────────────────────────────────────────────────
const progressBar = document.getElementById('scroll-progress');
if (progressBar) {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        progressBar.style.width = (scrolled / total * 100) + '%';
    }, { passive: true });
}

// ── 2. SHRINKING STICKY NAV ──────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('nav-scrolled', window.scrollY > 60);
    }, { passive: true });
}

// ── 3. TYPED TEXT EFFECT ─────────────────────────────────────────────────────
const phrases = ['Potential.', 'Confidence.', 'Future.', 'Success.'];
const typedEl = document.getElementById('typed');

if (typedEl) {
    let phraseIndex = 0, charIndex = 0, deleting = false;

    function type() {
        const current = phrases[phraseIndex];
        if (!deleting) {
            charIndex++;
            typedEl.textContent = current.slice(0, charIndex);
            if (charIndex === current.length) {
                setTimeout(() => { deleting = true; type(); }, 2000);
                return;
            }
        } else {
            charIndex--;
            typedEl.textContent = current.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
            }
        }
        setTimeout(type, deleting ? 60 : 100);
    }

    // Start immediately so it's never stuck on empty
    type();
}

// ── 4. SCROLL REVEAL ANIMATIONS ──────────────────────────────────────────────
const revealStyle = document.createElement('style');
revealStyle.textContent = `
    .anim-hidden {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s ease, transform 0.7s ease;
    }
    .anim-visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(revealStyle);

// Staggered reveal for cards
const staggerSelectors = '.card, .team-card, .science-step';
document.querySelectorAll(staggerSelectors).forEach((el, i) => {
    el.classList.add('anim-hidden');
    el.style.transitionDelay = `${(i % 3) * 0.15}s`;
});

// Section fade-in (skip hero so it doesn't fight CSS animations)
document.querySelectorAll('section:not(.hero), .who-section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(16px)';
    section.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
});

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            sectionObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05 });

document.querySelectorAll('section:not(.hero)').forEach(s => sectionObserver.observe(s));

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('anim-visible');
            cardObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll(staggerSelectors).forEach(el => cardObserver.observe(el));

// ── 5. STATS COUNTER ─────────────────────────────────────────────────────────
function animateCounter(el) {
    const target = +el.dataset.target;
    const duration = 1600;
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(ease * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
    }
    requestAnimationFrame(step);
}

const statsSection = document.querySelector('.stats-section');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statsSection.querySelectorAll('.stat-num').forEach(animateCounter);
            } else {
                // Reset to 0 when scrolled out so it re-animates on next scroll in
                statsSection.querySelectorAll('.stat-num').forEach(el => {
                    el.textContent = '0';
                });
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

    statsObserver.observe(statsSection);
}
