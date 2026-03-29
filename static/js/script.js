document.addEventListener('DOMContentLoaded', () => {
    /* 1. Master Particle Context */
    const canvas = document.getElementById('particle-canvas');
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
    window.addEventListener('scroll', () => {
        const top = document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = (top / height) * 100;
        document.getElementById('progress').style.width = pct + '%';
    }, { passive: true });

    /* Nav Active Link Sync (Robust Area-Based Observation) */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    const sectionVisiblePixels = {};

    const navObserver = new IntersectionObserver((entries) => {
        // Update visible pixel count for sections that changed
        entries.forEach(entry => {
            sectionVisiblePixels[entry.target.id] = entry.boundingClientRect.height * entry.intersectionRatio;
        });

        // Find which section occupies the most space on screen
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

        // Fallback: If scrolled to the absolute bottom of the page, force last section active
        if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
            current = sections[sections.length - 1].getAttribute('id');
        }

        // Apply active class
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
        rootMargin: '-80px 0px 0px 0px', // ignore the navbar area slightly
        threshold: Array.from({length: 21}, (_, i) => i * 0.05) // check visibility every 5% 
    });

    sections.forEach(s => {
        sectionVisiblePixels[s.getAttribute('id')] = 0;
        navObserver.observe(s);
    });

    /* 6. Form Transmission Intelligence */
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', () => {
            const b = form.querySelector('button');
            const t = b.textContent;
            b.textContent = 'Transmitting Data...';
            b.disabled = true;
            setTimeout(() => {
                alert('Success: Transmission received by Secure Management.');
                b.textContent = t;
                b.disabled = false;
                form.reset();
            }, 1500);
        });
    }
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
            r.style.left = `${x - 3}px`; /* Center on 2px line */
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
            }, 2500); // Wait 2.5 seconds to show each slide properly considering the fade effect
        }
    });

    /* 9. Project Details Accordion & Layout Expansion */
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.currentTarget.closest('.work-card');
            const details = card.querySelector('.work-details');
            
            btn.classList.toggle('expanded');
            details.classList.toggle('expanded');
            card.classList.toggle('expanded-card'); // Triggers horizontal layout
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
                alert('Please enter a valid email address.');
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
                    alert('OTP has been sent to your email. Please check your inbox (and spam folder).');
                    sendOtpBtn.textContent = 'Resend OTP';
                } else {
                    alert('Error: ' + data.message);
                    sendOtpBtn.textContent = originalText;
                }
            })
            .catch(err => {
                console.error(err);
                alert('Connection error. Is the server running?');
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
                alert('Please enter the 6-digit OTP.');
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
                    // Success state
                    emailBadge.style.display = 'inline-flex';
                    otpGroup.style.display = 'none';
                    sendOtpBtn.style.display = 'none';
                    emailInput.readOnly = true;
                    emailInput.style.opacity = '0.7';
                    isEmailVerified = true;
                    contactSubmitBtn.title = 'Dispatch your message';
                    alert('Email verified successfully!');
                } else {
                    alert('Verification failed: ' + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('Connection error during verification.');
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
                alert('Please verify your email address first before sending the message!');
                return;
            }
            
            // Show loading state
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Transmitting...</span> <i class="fas fa-satellite-dish fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            resultElement.style.display = 'block';
            resultElement.textContent = "Please wait...";
            resultElement.classList.remove('success', 'error');

            fetch('/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let jsonResponse = await response.json();
                if (jsonResponse.success) {
                    resultElement.classList.add('success');
                    resultElement.textContent = "Transmission successful! Email sent.";
                    contactForm.reset();
                    
                    // Reset verification system
                    isEmailVerified = false;
                    emailBadge.style.display = 'none';
                    sendOtpBtn.style.display = 'inline-flex';
                    emailInput.readOnly = false;
                    emailInput.style.opacity = '1';
                    otpGroup.style.display = 'none';
                    if (otpInput) otpInput.value = '';
                } else {
                    console.log(response);
                    resultElement.classList.add('error');
                    resultElement.textContent = jsonResponse.message || "Transmission failed. Systems error.";
                }
            })
            .catch(error => {
                console.log(error);
                resultElement.classList.add('error');
                resultElement.textContent = "Unable to connect to transmission relays. Please check your connection.";
            })
            .then(function() {
                // Restore button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                
                // Hide result after 8 seconds
                setTimeout(() => {
                    resultElement.style.display = 'none';
                }, 8000);
            });
        });
    }
});
