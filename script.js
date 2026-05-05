document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Canvas and Resize
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }
    window.addEventListener('resize', resize);
    resize();

    // 2. Variables for Parallax and Tree
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    
    // Track scroll
    let scrollY = 0;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
        // Navbar effect
        const navbar = document.querySelector('.navbar');
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        targetTiltX = (mouseX / width) * 2 - 1;
        targetTiltY = (mouseY / height) * 2 - 1;
    });

    // 3. Tree Animation Logic
    class Branch {
        constructor(x, y, length, angle, width, depth, isRoot = false) {
            this.x = x;
            this.y = y;
            this.length = length;
            this.angle = angle;
            this.width = width;
            this.depth = depth;
            this.isRoot = isRoot;
            
            this.hue = Math.random() * 360;
            this.currentLength = 0;
            this.grown = false;
            this.children = [];
            this.maxDepth = this.isRoot ? 4 : 8; // Deeper, more complex tree
            
            this.endX = x;
            this.endY = y;
            this.smoothedEndX = x;
            this.smoothedEndY = y;
        }

        update(mx, my) {
            if (this.currentLength < this.length) {
                this.currentLength += this.length * 0.04; // grow a bit faster
                if (this.currentLength > this.length) {
                    this.currentLength = this.length;
                    this.grown = true;
                    if (this.depth < this.maxDepth && this.children.length === 0) {
                        this.spawnChildren();
                    }
                }
            } else {
                for (let child of this.children) {
                    child.x = this.endX;
                    child.y = this.endY;
                    child.update(mx, my);
                }
            }
            
            // Sway logic
            let sway = 0;
            if (!this.isRoot) {
                sway = Math.sin(Date.now() * 0.001 + this.depth * 0.5) * 0.03 * (this.depth/this.maxDepth);
            } else {
                sway = Math.sin(Date.now() * 0.0005 + this.depth) * 0.01;
            }

            let targetEndX = this.x + Math.cos(this.angle + sway) * this.currentLength;
            let targetEndY = this.y + Math.sin(this.angle + sway) * this.currentLength;

            // Mouse interaction: push branches away
            if (mx !== undefined && my !== undefined) {
                let dx = targetEndX - mx;
                let dy = targetEndY - my;
                let dist = Math.hypot(dx, dy);
                if (dist < 180) {
                    let force = (180 - dist) / 180;
                    // Push away from mouse (spring effect)
                    targetEndX += (dx / dist) * force * 100;
                    targetEndY += (dy / dist) * force * 100;
                }
            }
            
            // Smooth movement
            this.smoothedEndX += (targetEndX - this.smoothedEndX) * 0.1;
            this.smoothedEndY += (targetEndY - this.smoothedEndY) * 0.1;
            
            this.endX = this.smoothedEndX;
            this.endY = this.smoothedEndY;
        }

        spawnChildren() {
            let numChildren = 0;
            if (this.isRoot) {
                numChildren = Math.random() > 0.4 ? 2 : 1;
            } else {
                numChildren = Math.random() > 0.2 ? 3 : 2; // Much denser network
                if (this.depth >= this.maxDepth - 2) numChildren = 2; 
            }
            
            for (let i = 0; i < numChildren; i++) {
                let spread = this.isRoot ? 0.5 : 0.8;
                let newAngle = this.angle + (Math.random() * spread * 2 - spread);
                let newLength = this.length * (0.65 + Math.random() * 0.25);
                let newWidth = this.width * 0.65;
                this.children.push(new Branch(this.endX, this.endY, newLength, newAngle, newWidth, this.depth + 1, this.isRoot));
            }
            
            // Spawn digital fruit/icons
            if (!this.isRoot && this.depth > this.maxDepth - 3 && Math.random() > 0.4) {
                spawnIcon(this);
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.endX, this.endY);
            
            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';
            
            let intensity = this.depth / this.maxDepth;
            
            if (this.isRoot) {
                // Mystic glowing roots (greenish/teal)
                ctx.strokeStyle = `rgba(20, ${150 - intensity * 50}, ${100 + intensity * 150}, 0.8)`;
            } else {
                // Vibrant multi-colored digital tree
                let r = 50 + intensity * 205;
                let g = 50 + intensity * 100;
                let b = 100 + intensity * 155;
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.85)`;
            }
            
            // Glow effect
            if (this.depth > this.maxDepth - 3 || this.isRoot) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = `hsl(${this.hue}, 100%, 65%)`;
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.stroke();

            for (let child of this.children) {
                child.draw(ctx);
            }
        }
    }

    let treeBranches = [];
    function initTree() {
        let startX = width / 2;
        let startY = height - 120;
        
        // Main Trunk
        treeBranches.push(new Branch(startX, startY, height * 0.25, -Math.PI / 2, 22, 0, false));
        
        // Roots
        for(let i=0; i<5; i++) {
            let rootAngle = (Math.PI / 2) + (Math.random() * 1.2 - 0.6);
            treeBranches.push(new Branch(startX, startY + 5, height * 0.15, rootAngle, 16, 0, true));
        }
    }
    initTree();

    // 4. Particles (Mystic glowing spores)
    let particles = [];
    for(let i=0; i<150; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 3 + 1,
            speedY: -Math.random() * 1.5 - 0.5,
            speedX: Math.random() * 1 - 0.5,
            hue: Math.random() * 360,
            opacity: Math.random() * 0.6 + 0.2
        });
    }

    function drawParticles() {
        for(let p of particles) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
            ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            p.y += p.speedY;
            p.x += p.speedX;
            if (p.y < -10) {
                p.y = height + 10;
                p.x = Math.random() * width;
            }
        }
        ctx.shadowBlur = 0;
    }

    // 5. Digital Platform Icons
    const iconClasses = [
        'fa-brands fa-instagram', 'fa-brands fa-facebook', 'fa-brands fa-google', 
        'fa-brands fa-youtube', 'fa-brands fa-whatsapp', 'fa-brands fa-meta', 
        'fa-brands fa-android', 'fa-solid fa-globe', 'fa-brands fa-linkedin'
    ];
    const activeIcons = [];
    const heroSection = document.getElementById('hero');

    function spawnIcon(branch) {
        if (activeIcons.length > 50) return; // Allow more icons
        
        const iconDiv = document.createElement('div');
        
        let isText = Math.random() > 0.85;
        let iconHue = Math.floor(Math.random() * 360);
        let color = `hsl(${iconHue}, 100%, 65%)`;
        
        if (isText) {
            iconDiv.className = `platform-icon text-logo`;
            iconDiv.innerHTML = 'MARZA<span style="color:#fff">ADS</span>';
            Object.assign(iconDiv.style, {
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '800',
                fontSize: '1.2rem',
                letterSpacing: '1px',
                color: color
            });
        } else {
            const rClass = iconClasses[Math.floor(Math.random() * iconClasses.length)];
            iconDiv.className = `platform-icon ${rClass}`;
            iconDiv.style.fontSize = '2rem';
            iconDiv.style.color = color;
        }
        
        Object.assign(iconDiv.style, {
            position: 'absolute',
            left: `${branch.endX}px`,
            top: `${branch.endY}px`,
            transform: 'translate(-50%, -50%)',
            textShadow: `0 0 20px ${color}`,
            opacity: '0',
            transition: 'opacity 1s ease',
            cursor: 'pointer',
            zIndex: '10'
        });

        iconDiv.addEventListener('mouseenter', () => {
            iconDiv.style.textShadow = `0 0 40px #fff, 0 0 60px ${color}`;
            iconDiv.style.transform = 'translate(-50%, -50%) scale(1.6)';
            
            // Add a temporary glow to the branch as well if desired
        });
        iconDiv.addEventListener('mouseleave', () => {
            iconDiv.style.textShadow = `0 0 20px ${color}`;
            iconDiv.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        heroSection.appendChild(iconDiv);
        
        setTimeout(() => iconDiv.style.opacity = '0.9', 100);
        
        activeIcons.push({
            el: iconDiv,
            branch: branch,
            baseX: branch.endX,
            baseY: branch.endY,
            offsetY: 0,
            falling: false,
            fallSpeed: Math.random() * 2 + 1,
            swaySpeed: Math.random() * 0.05 + 0.02,
            swayOffset: Math.random() * Math.PI * 2
        });
    }

    function updateIcons() {
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < activeIcons.length; i++) {
            let icon = activeIcons[i];
            
            if (icon.branch && !icon.falling) {
                // Pin icon base to branch end exactly so it moves with physics
                icon.baseX = icon.branch.endX;
                icon.baseY = icon.branch.endY;
            }
            
            if (scrollY > 100 && !icon.falling) {
                icon.falling = true;
                icon.branch = null; // Detach from branch
            }
            
            if (icon.falling) {
                icon.offsetY += icon.fallSpeed;
                let sway = Math.sin(time * icon.swaySpeed * 10 + icon.swayOffset) * 50;
                
                let px = icon.baseX + sway + (currentTiltX * 50);
                let py = icon.baseY + icon.offsetY + (currentTiltY * 50) - (scrollY * 0.5); 
                
                icon.el.style.left = `${px}px`;
                icon.el.style.top = `${py}px`;
                // Keep scaled normally when falling
                if (!icon.el.matches(':hover')) {
                    icon.el.style.transform = 'translate(-50%, -50%) scale(1)';
                }
                
                if (icon.offsetY > height) {
                    icon.el.remove();
                    activeIcons.splice(i, 1);
                    i--;
                }
            } else {
                let floatY = Math.sin(time * 2 + icon.swayOffset) * 8;
                let px = icon.baseX + (currentTiltX * -20);
                let py = icon.baseY + floatY + (currentTiltY * -20);
                
                // Repel icon visual position slightly
                let dist = Math.hypot(px - mouseX, py - mouseY);
                if (dist < 180) {
                    let force = (180 - dist) / 180;
                    px -= (px - mouseX) / dist * force * 20;
                    py -= (py - mouseY) / dist * force * 20;
                    
                    if (!icon.el.matches(':hover')) {
                        icon.el.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    }
                } else {
                    if (!icon.el.matches(':hover')) {
                        icon.el.style.transform = 'translate(-50%, -50%) scale(1)';
                    }
                }

                icon.el.style.left = `${px}px`;
                icon.el.style.top = `${py}px`;
            }
        }
    }

    // 6. Main Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        currentTiltX += (targetTiltX - currentTiltX) * 0.05;
        currentTiltY += (targetTiltY - currentTiltY) * 0.05;

        // Draw Tree & Roots
        ctx.save();
        ctx.translate(width/2, height/2);
        ctx.rotate(currentTiltX * 0.05);
        ctx.translate(-width/2, -height/2);
        
        ctx.translate(currentTiltX * -50, currentTiltY * -50);

        let adjustedMouseX = mouseX - (currentTiltX * -50);
        let adjustedMouseY = mouseY - (currentTiltY * -50);
        
        for(let branch of treeBranches) {
            branch.update(adjustedMouseX, adjustedMouseY);
            branch.draw(ctx);
        }
        
        ctx.restore();

        drawParticles();
        updateIcons();

        requestAnimationFrame(animate);
    }
    animate();

    // 7. Scroll Animations
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(sec => observer.observe(sec));
});
