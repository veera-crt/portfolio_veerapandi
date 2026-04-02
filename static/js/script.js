/* 0. Global UX Transmitters (Toast & Handlers) */
function showToast(message, type = 'warning') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-exclamation-triangle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-times-circle';

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icon}"></i>
        </div>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Fade in
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto-destruct
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    }, 5000);
}


document.addEventListener('DOMContentLoaded', () => {
    /* 0. Preloader Logic & Fail-safe Dismissal */
    const preloader = document.getElementById('preloader');
    
    const dismissPreloader = () => {
        if (preloader && !preloader.classList.contains('loaded')) {
            preloader.classList.add('loaded');
        }
    };

    // Ideal scenario: All assets loaded
    window.addEventListener('load', () => {
        setTimeout(dismissPreloader, 500); // Small grace period for visual smoothness
    });

    // Fail-safe: Force dismiss after 1.5 seconds max (Prevents hanging on slow networks/Brave)
    setTimeout(dismissPreloader, 1500);

    /* 1. Master Particle Context */
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const pCount = 50;

        function init() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        class P {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.s = Math.random() * 2 + 0.5;
                this.vx = Math.random() * 0.4 - 0.2;
                this.vy = Math.random() * 0.4 - 0.2;
            }
            draw() {
                ctx.fillStyle = 'rgba(0, 102, 204, 0.2)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2);
                ctx.fill();
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }
        }

        init();
        for (let i = 0; i < pCount; i++) particles.push(new P());

        function anim() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(anim);
        }
        anim();
        window.addEventListener('resize', init);
    }

    /* 2. Mobile Menu Controller */
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNavLinks = document.querySelector('.nav-links');
    const mobileNavLinksItems = document.querySelectorAll('.nav-links a');

    if (mobileMenuBtn && mobileNavLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            mobileNavLinks.classList.toggle('active');
            // Toggle body scroll to prevent background scrolling when menu is open
            document.body.style.overflow = mobileNavLinks.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        mobileNavLinksItems.forEach(item => {
            item.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileNavLinks.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    /* 3. Magnetic Element Interaction */
    document.querySelectorAll('.magnetic').forEach(m => {
        m.addEventListener('mousemove', (e) => {
            const r = m.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            m.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        m.addEventListener('mouseleave', () => {
            m.style.transform = 'translate(0, 0)';
        });
    });

    /* 4. Global Reveal Engine */
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

    /* 5. Scroll & Progress Tracking */
    const progressEl = document.getElementById('progress');
    if (progressEl) {
        window.addEventListener('scroll', () => {
            const top = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const pct = (top / height) * 100;
            progressEl.style.width = pct + '%';
        }, { passive: true });
    }

    /* Nav Active Link Sync */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sectionVisiblePixels = {};

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            sectionVisiblePixels[entry.target.id] = entry.boundingClientRect.height * entry.intersectionRatio;
        });

        let maxPixels = 0;
        let current = '';

        sections.forEach(s => {
            const id = s.getAttribute('id');
            const pixels = sectionVisiblePixels[id] || 0;
            if (pixels > maxPixels) {
                maxPixels = pixels;
                current = id;
            }
        });

        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
            current = sections[sections.length - 1].getAttribute('id');
        }

        if (current) {
            navLinks.forEach(a => {
                a.classList.remove('active');
                if (a.getAttribute('href') === `#${current}`) {
                    a.classList.add('active');
                }
            });
        }
    }, { 
        root: null, 
        rootMargin: '-80px 0px 0px 0px',
        threshold: Array.from({length: 21}, (_, i) => i * 0.05) 
    });

    sections.forEach(s => {
        sectionVisiblePixels[s.getAttribute('id')] = 0;
        navObserver.observe(s);
    });

    /* 7. Grid Interceptor Rockets */
    function launchRocket(dir) {
        const h = document.getElementById('hero');
        if (!h) return;
        const r = document.createElement('div');
        r.className = `grid-rocket ${dir}`;
        h.appendChild(r);

        const dim = h.getBoundingClientRect();
        const grid = 80;
        const centerX = dim.width / 2;
        const centerY = dim.height / 2;
        
        if (dir === 'up') {
            const x = centerX - (grid * 2);
            r.style.left = `${x - 3}px`;
            r.style.top = `${dim.height}px`;
            setTimeout(() => {
                r.style.transform = `translateY(-${dim.height + 100}px)`;
                r.style.opacity = '0';
            }, 50);
        } else if (dir === 'down') {
            const x = centerX + (grid * 2);
            r.style.left = `${x - 3}px`;
            r.style.top = `-20px`;
            setTimeout(() => {
                r.style.transform = `translateY(${dim.height + 100}px)`;
                r.style.opacity = '0';
            }, 50);
        } else if (dir === 'left') {
            const y = centerY - (grid * 2);
            r.style.top = `${y - 3}px`;
            r.style.left = `${dim.width}px`;
            setTimeout(() => {
                r.style.transform = `translateX(-${dim.width + 100}px)`;
                r.style.opacity = '0';
            }, 50);
        } else if (dir === 'right') {
            const y = centerY + (grid * 2);
            r.style.top = `${y - 3}px`;
            r.style.left = `-20px`;
            setTimeout(() => {
                r.style.transform = `translateX(${dim.width + 100}px)`;
                r.style.opacity = '0';
            }, 50);
        }
        setTimeout(() => r.remove(), 1900);
    }

    setInterval(() => {
        ['up', 'down', 'left', 'right'].forEach(dir => launchRocket(dir));
    }, 3500);

    /* 8. Project Slideshow Logic */
    document.querySelectorAll('.work-slideshow').forEach(slideshow => {
        const slides = slideshow.querySelectorAll('.slide');
        if (slides.length > 1) {
            let current = 0;
            setInterval(() => {
                slides[current].classList.remove('active');
                current = (current + 1) % slides.length;
                slides[current].classList.add('active');
            }, 2500);
        }
    });

    /* 9. Project Details Accordion */
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.currentTarget.closest('.work-card');
            const details = card.querySelector('.work-details');
            btn.classList.toggle('expanded');
            details.classList.toggle('expanded');
            card.classList.toggle('expanded-card');
        });
    });

    /* 10. OTP Verification Intelligence */
    const sendOtpBtn = document.getElementById('send-otp-btn');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');
    const emailInput = document.getElementById('email');
    const otpInput = document.getElementById('otp');
    const otpGroup = document.getElementById('otp-group');
    const emailBadge = document.getElementById('email-verified-badge');
    const contactSubmitBtn = document.getElementById('submit-btn');
    let isEmailVerified = false;

    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', () => {
            const email = emailInput.value.trim();
            if (!email || !email.includes('@')) {
                showToast('Please enter a valid email address.', 'warning');
                return;
            }

            const originalText = sendOtpBtn.textContent;
            sendOtpBtn.textContent = 'Sending...';
            sendOtpBtn.disabled = true;

            fetch('/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    otpGroup.style.display = 'block';
                    showToast('OTP has been sent to your email. Please check your inbox.', 'success');
                    sendOtpBtn.textContent = 'Resend OTP';
                } else {
                    showToast('Error: ' + data.message, 'error');
                    sendOtpBtn.textContent = originalText;
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Connection error. Is the server running?', 'error');
                sendOtpBtn.textContent = originalText;
            })
            .finally(() => {
                sendOtpBtn.disabled = false;
            });
        });
    }

    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', () => {
            const email = emailInput.value.trim();
            const otp = otpInput.value.trim();

            if (!otp || otp.length < 6) {
                showToast('Please enter the 6-digit OTP.', 'warning');
                return;
            }

            verifyOtpBtn.textContent = 'Verifying...';
            verifyOtpBtn.disabled = true;

            fetch('/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    emailBadge.style.display = 'inline-flex';
                    otpGroup.style.display = 'none';
                    sendOtpBtn.style.display = 'none';
                    emailInput.readOnly = true;
                    emailInput.style.opacity = '0.7';
                    isEmailVerified = true;
                    showToast('Email verified successfully!', 'success');
                } else {
                    showToast('Verification failed: ' + data.message, 'error');
                }
            })
            .catch(err => {
                console.error(err);
                showToast('Connection error during verification.', 'error');
            })
            .finally(() => {
                verifyOtpBtn.textContent = 'Verify';
                verifyOtpBtn.disabled = false;
            });
        });
    }

    /* 11. Contact Form Handler */
    const contactForm = document.getElementById('contact-form');
    const resultElement = document.getElementById('form-result');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!isEmailVerified) {
                showToast('Please verify your email address first before sending the message!', 'warning');
                return;
            }
            
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Transmitting...</span> <i class="fas fa-satellite-dish fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: json
            })
            .then(async (response) => {
                let jsonResponse = await response.json();
                if (jsonResponse.success) {
                    showToast('Transmission successful! Email sent.', 'success');
                    contactForm.reset();
                    
                    // Total State Reset
                    isEmailVerified = false;
                    emailBadge.style.display = 'none';
                    sendOtpBtn.style.display = 'inline-flex';
                    sendOtpBtn.textContent = 'Send OTP'; // Fix: Revert text
                    sendOtpBtn.disabled = false;
                    
                    emailInput.readOnly = false;
                    emailInput.style.opacity = '1';
                    otpGroup.style.display = 'none';
                    if (otpInput) otpInput.value = '';
                } else {
                    showToast(jsonResponse.message || 'Transmission failed.', 'error');
                }
            })
            .catch(error => {
                console.error(error);
                showToast('Unable to connect to transmission relays.', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
        });
    }
});
