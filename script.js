/* =========================================
   PORTFOLIO — SALADIER DE COMPÉTENCES
========================================= */

/*
 * Modifie chaque phrase pour citer un vrai projet
 * (par exemple : "Utilisé dans LigueyConnect pour ...").
 */
const SKILLS = [
    { name: "Java", proof: "Mon langage principal côté backend, travaillé à l'ESP et en projet." },
    { name: "Spring Boot", proof: "Le framework avec lequel je construis des applications Java." },
    { name: "JavaScript", proof: "Toute la logique de Sénégal Challenge : duos, chrono, scores." },
    { name: "HTML / CSS", proof: "L'interface responsive de Sénégal Challenge et de ce portfolio." },
    { name: "Git / GitHub", proof: "Versionnement, branches et déploiement de mes projets sur GitHub Pages." },
    { name: "MySQL", proof: "Modélisation et requêtes pour mes projets avec base de données." },
    { name: "UML / Merise", proof: "Je conçois mes applications sur le papier avant de coder." },
    { name: "Docker", proof: "Conteneurisation pour déployer mes applications." }
];

const COLORS = ["word-yellow", "word-coral", "word-navy", "word-white"];

const saladier = document.getElementById("saladier");
const drawButton = document.getElementById("draw-button");
const drawResult = document.getElementById("draw-result");
const drawSkill = document.getElementById("draw-skill");
const drawProof = document.getElementById("draw-proof");

let currentIndex = -1;

function selectSkill(index) {
    currentIndex = index;

    // Petit saut du mot si la physique est active.
    if (window.kickWord) window.kickWord(index);

    saladier.classList.add("has-active");

    saladier.querySelectorAll(".word").forEach((word, i) => {
        word.classList.toggle("is-active", i === index);
    });

    drawSkill.textContent = SKILLS[index].name;
    drawProof.textContent = SKILLS[index].proof;

    // Relance l'animation à chaque tirage.
    drawResult.hidden = false;
    drawResult.style.animation = "none";
    void drawResult.offsetWidth;
    drawResult.style.animation = "";
}

if (saladier && drawButton) {
    SKILLS.forEach((skill, index) => {
        const word = document.createElement("button");

        word.type = "button";
        word.className = `word ${COLORS[index % COLORS.length]}`;
        word.textContent = skill.name;
        word.style.rotate = `${((index * 37) % 7) - 3}deg`;

        word.addEventListener("click", () => selectSkill(index));

        saladier.appendChild(word);
    });

    drawButton.addEventListener("click", () => {
        let index;

        do {
            index = Math.floor(Math.random() * SKILLS.length);
        } while (index === currentIndex && SKILLS.length > 1);

        selectSkill(index);
    });
}

/* =========================================
   ANIMATION D'ENTRÉE (GSAP)
========================================= */

// Découpe chaque mot d'un élément dans un <span class="w">.
function splitWords(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    const words = [];

    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
        const fragment = document.createDocumentFragment();

        node.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;

            if (/^\s+$/.test(part)) {
                fragment.appendChild(document.createTextNode(" "));
                return;
            }

            const span = document.createElement("span");
            span.className = "w";
            span.setAttribute("aria-hidden", "true");
            span.textContent = part;
            fragment.appendChild(span);
            words.push(span);
        });

        node.replaceWith(fragment);
    });

    return words;
}

function initHeroAnimation() {
    const title = document.getElementById("hero-title");
    const items = document.querySelectorAll(".hero-text > *");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!title) return;

    // Pas d'animation : on affiche simplement le contenu.
    if (reduceMotion || typeof gsap === "undefined") {
        items.forEach((el) => { el.style.visibility = "visible"; });
        return;
    }

    // Le titre reste lisible par les lecteurs d'écran.
    title.setAttribute("aria-label", title.textContent.replace(/\s+/g, " ").trim());

    const words = splitWords(title);
    const highlight = title.querySelector(".hl");

    gsap.set(items, { visibility: "visible" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from(".eyebrow", { y: 14, autoAlpha: 0, duration: 0.5 })
      .from(words, {
          y: 36,
          rotation: 3,
          autoAlpha: 0,
          duration: 0.7,
          ease: "back.out(1.6)",
          stagger: 0.07
      }, "-=0.2");

    if (highlight) {
        tl.fromTo(highlight,
            { "--hl": 0 },
            { "--hl": 1, duration: 0.6, ease: "power2.inOut" },
            "-=0.15"
        );
    }

    tl.from(".hero-description, .status, .hero-actions", {
        y: 16,
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.12
    }, "-=0.3");
}

initHeroAnimation();

/* =========================================
   SALADIER PHYSIQUE (Matter.js)
========================================= */

function initBowlPhysics() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Sans Matter.js ou en mode « réduire les animations » : saladier statique.
    if (!saladier || reduceMotion || typeof Matter === "undefined") return;

    const { Engine, Runner, Bodies, Body, Composite, Events } = Matter;

    const wordEls = Array.from(saladier.querySelectorAll(".word"));
    if (!wordEls.length) return;

    saladier.classList.add("is-physics");

    wordEls.forEach((el) => {
        el.style.rotate = "none"; // la rotation vient maintenant de la physique
        el.style.visibility = "hidden";
    });

    const engine = Engine.create();
    engine.gravity.y = 1;

    const runner = Runner.create();

    const T = 80; // épaisseur des murs
    let W = saladier.clientWidth;
    let H = saladier.clientHeight;
    let walls = [];

    // Mur épais le long du segment (x1,y1) -> (x2,y2)
    function segment(x1, y1, x2, y2) {
        const length = Math.hypot(x2 - x1, y2 - y1);
        return Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, length + 6, T, {
            isStatic: true,
            angle: Math.atan2(y2 - y1, x2 - x1),
            friction: 0.3,
            restitution: 0.2
        });
    }

    function buildWalls() {
        Composite.remove(engine.world, walls);
        walls = [];

        const R = Math.min(110, W / 2, H / 2); // rayon du fond arrondi, comme le CSS
        const steps = 10;
        const r = R + T / 2;

        // Parois verticales et plafond de sécurité
        walls.push(Bodies.rectangle(-T / 2, H / 2 - 300, T, H + 700, { isStatic: true }));
        walls.push(Bodies.rectangle(W + T / 2, H / 2 - 300, T, H + 700, { isStatic: true }));
        walls.push(Bodies.rectangle(W / 2, -600, W + 2 * T, T, { isStatic: true }));

        // Fond plat
        walls.push(Bodies.rectangle(W / 2, H + T / 2, W, T, { isStatic: true, friction: 0.3 }));

        // Coins arrondis : petits segments le long d'un arc de cercle
        [[R, H - R, Math.PI, Math.PI / 2], [W - R, H - R, 0, Math.PI / 2]].forEach(([cx, cy, from, to]) => {
            for (let i = 0; i < steps; i++) {
                const a1 = from + (to - from) * (i / steps);
                const a2 = from + (to - from) * ((i + 1) / steps);
                walls.push(segment(
                    cx + Math.cos(a1) * r, cy + Math.sin(a1) * r,
                    cx + Math.cos(a2) * r, cy + Math.sin(a2) * r
                ));
            }
        });

        Composite.add(engine.world, walls);
    }

    buildWalls();

    const items = wordEls.map((el) => ({
        el,
        w: el.offsetWidth,
        h: el.offsetHeight,
        body: null
    }));

    function dropWord(item) {
        const x = item.w / 2 + Math.random() * Math.max(1, W - item.w);
        const y = -item.h - Math.random() * 60;

        item.body = Bodies.rectangle(x, y, item.w, item.h, {
            chamfer: { radius: 12 },
            restitution: 0.35,
            friction: 0.4,
            frictionAir: 0.01,
            angle: (Math.random() - 0.5) * 0.8
        });

        Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.12);
        Composite.add(engine.world, item.body);
        item.el.style.visibility = "visible";
    }

    // Les mots tombent un par un, après l'animation du titre.
    items.forEach((item, i) => {
        setTimeout(() => dropWord(item), 1500 + i * 220);
    });

    // Affiche chaque mot à la position de son corps physique.
    Events.on(engine, "afterUpdate", () => {
        items.forEach(({ el, w, h, body }) => {
            if (!body) return;
            el.style.transform =
                `translate(${body.position.x - w / 2}px, ${body.position.y - h / 2}px) rotate(${body.angle}rad)`;
        });
    });

    // Un mot sélectionné fait un petit saut.
    window.kickWord = (index) => {
        const item = items[index];
        if (!item || !item.body) return;

        Body.setVelocity(item.body, { x: (Math.random() - 0.5) * 5, y: -9 });
        Body.setAngularVelocity(item.body, (Math.random() - 0.5) * 0.25);
    };

    // Adapte les murs si la fenêtre change de taille.
    window.addEventListener("resize", () => {
        W = saladier.clientWidth;
        H = saladier.clientHeight;
        buildWalls();

        items.forEach(({ w, body }) => {
            if (body && body.position.x > W - w / 2) {
                Body.setPosition(body, { x: W - w / 2, y: body.position.y });
            }
        });
    });

    // La simulation ne tourne que quand le saladier est visible (économise la batterie).
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            Runner.run(runner, engine);
        } else {
            Runner.stop(runner);
        }
    }).observe(saladier);
}

initBowlPhysics();

/* =========================================
   PORTRAIT (GSAP + ScrollTrigger)
========================================= */

function initPortrait() {
    const portrait = document.querySelector(".portrait");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!portrait || reduceMotion) return;
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const frame = portrait.querySelector(".portrait-frame");
    const bg = portrait.querySelector(".portrait-bg");

    // 1. Apparition douce quand la section arrive à l'écran (une seule fois)
    gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: portrait, start: "top 85%", once: true }
    })
        .from(bg, { scale: 0.7, rotation: -10, autoAlpha: 0, duration: 0.8 })
        .from(frame, { y: 28, scale: 0.95, autoAlpha: 0, duration: 0.8 }, "-=0.55");

    // 2. Léger effet d'inclinaison au survol (souris uniquement, pas sur téléphone)
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const moveX = gsap.quickTo(frame, "x", { duration: 0.6, ease: "power3.out" });
        const moveY = gsap.quickTo(frame, "y", { duration: 0.6, ease: "power3.out" });
        const tilt = gsap.quickTo(frame, "rotation", { duration: 0.6, ease: "power3.out" });

        portrait.addEventListener("pointermove", (e) => {
            const rect = portrait.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width - 0.5;
            const py = (e.clientY - rect.top) / rect.height - 0.5;

            moveX(px * 10);
            moveY(py * 10);
            tilt(px * 3);
        });

        portrait.addEventListener("pointerleave", () => {
            moveX(0);
            moveY(0);
            tilt(0);
        });
    }
}

initPortrait();

/* =========================================
   TRANSITION « LIVRE » ENTRE LES SECTIONS (GSAP)
========================================= */

function initPageTurn() {
    const book = document.getElementById("book");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Sans GSAP ou en mode « réduire les animations » : défilement normal.
    if (!book || reduceMotion || typeof gsap === "undefined") return;

    const left = book.querySelector(".book__left");
    const leaf = book.querySelector(".book__leaf");
    const numEl = document.getElementById("book-num");
    const titleEl = document.getElementById("book-title");
    const order = ["accueil", "projets", "a-propos", "competences", "contact"];

    function resetBook() {
        gsap.set(left, { xPercent: -100 });
        gsap.set(leaf, {
            xPercent: 100,
            rotationY: 0,
            transformOrigin: "left center",
            transformPerspective: 2200
        });
    }

    resetBook();

    let busy = false;

    function turnTo(target, hash) {
        busy = true;

        const label = target.querySelector(".section-label");
        const position = Math.max(order.indexOf(target.id), 0) + 1;

        numEl.textContent = String(position).padStart(2, "0");
        titleEl.textContent = label ? label.textContent.toLowerCase() : "accueil";

        book.classList.add("is-on");

        gsap.timeline({
            onComplete: () => {
                book.classList.remove("is-on");
                resetBook();
                busy = false;
            }
        })
            // 1. Le livre se referme sur la page actuelle
            .to(left, { xPercent: 0, duration: 0.3, ease: "power2.out" }, 0)
            .to(leaf, { xPercent: 0, duration: 0.3, ease: "power2.out" }, 0)
            // 2. Sous le livre fermé, on change de section
            .add(() => {
                target.scrollIntoView({ behavior: "instant", block: "start" });
                history.pushState(null, "", hash);
                target.setAttribute("tabindex", "-1");
                target.focus({ preventScroll: true });
            })
            // 3. La page se tourne
            .to(leaf, { rotationY: -180, duration: 0.6, ease: "power2.inOut" })
            // 4. Le livre s'ouvre sur la nouvelle section
            .to([left, leaf], { xPercent: -100, duration: 0.4, ease: "power2.in" }, "+=0.05");
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const hash = link.getAttribute("href");
            if (!hash || hash.length < 2) return;

            const target = document.querySelector(hash);
            if (!target) return;

            event.preventDefault();
            if (!busy) turnTo(target, hash);
        });
    });
}

initPageTurn();

/* =========================================
   « UNE JOURNÉE À DAKAR » : ANIMATIONS AU SCROLL (GSAP)
========================================= */

// Bandeau de compétences (deux copies pour une boucle sans coupure).
function buildMarquee() {
    const track = document.getElementById("marquee-track");
    if (!track) return null;

    const half = SKILLS.map((skill) => `<span>${skill.name}</span><i>✦</i>`).join("").repeat(2);
    track.innerHTML = half + half;

    return track;
}

function initScrollStory() {
    const track = buildMarquee();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) return;
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;
    const sun = document.querySelector(".sun");

    // 1. Le ciel et le soleil suivent la journée : aube, midi, soleil couchant, crépuscule.
    const day = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            invalidateOnRefresh: true
        }
    });

    day.to(root, { "--sky-top": "rgb(247,240,226)", "--sky-bottom": "rgb(240,232,214)", duration: 1 })
       .to(root, { "--sky-top": "rgb(246,222,190)", "--sky-bottom": "rgb(240,213,184)", duration: 1 })
       .to(root, { "--sky-top": "rgb(238,192,160)", "--sky-bottom": "rgb(226,170,148)", duration: 1 })
       .to(root, { "--sky-top": "rgb(214,178,175)", "--sky-bottom": "rgb(196,150,160)", duration: 1 })
       .to(root, { "--sun-a": "rgb(255,196,140)", "--sun-b": "rgb(214,90,64)", duration: 4 }, 0);

    if (sun) {
        day.to(sun, { x: () => -window.innerWidth * 0.66, duration: 4 }, 0)
           .to(sun, { y: () => -window.innerHeight * 0.04, duration: 1.6, ease: "sine.out" }, 0)
           .to(sun, { y: () => window.innerHeight * 0.62, duration: 2.4, ease: "sine.in" }, 1.6);
    }

    // 2. Barre de progression
    gsap.to(".progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
    });

    // 3. Chaque section : titres qui montent, frise qui se dessine
    gsap.utils.toArray(".section").forEach((section) => {
        const head = section.querySelectorAll(".section-label, h2, .lead");

        gsap.from(head, {
            y: 36,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: { trigger: section, start: "top 78%", once: true }
        });

        gsap.fromTo(section, { "--d": 0 }, {
            "--d": 1,
            duration: 1.2,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 85%", once: true }
        });
    });

    // 4. Cartes projets
    gsap.from(".card", {
        y: 70,
        rotation: 1.5,
        autoAlpha: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: { trigger: ".cards", start: "top 80%", once: true }
    });

    // 5. Parcours : le fil se dessine avec le scroll, les étapes arrivent une à une
    const timeline = document.querySelector(".timeline");

    if (timeline) {
        gsap.fromTo(timeline, { "--tl": 0 }, {
            "--tl": 1,
            ease: "none",
            scrollTrigger: { trigger: timeline, start: "top 75%", end: "bottom 60%", scrub: true }
        });

        gsap.from(".timeline li", {
            x: -40,
            autoAlpha: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.18,
            scrollTrigger: { trigger: timeline, start: "top 78%", once: true }
        });
    }

    // 6. Compétences : elles « éclosent » une par une
    gsap.from(".skills li", {
        y: 24,
        scale: 0.7,
        autoAlpha: 0,
        duration: 0.5,
        ease: "back.out(1.8)",
        stagger: 0.045,
        scrollTrigger: { trigger: ".skills", start: "top 82%", once: true }
    });

    // 7. Bandeau : défile en continu, accélère et change de sens avec le scroll
    if (track) {
        const drift = gsap.to(track, { xPercent: -50, duration: 32, ease: "none", repeat: -1 });

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
                const boost = 1 + Math.min(6, Math.abs(self.getVelocity()) / 250);

                gsap.timeline({ overwrite: true })
                    .to(drift, { timeScale: self.direction * boost, duration: 0.2 })
                    .to(drift, { timeScale: self.direction, duration: 1 });
            }
        });
    }

    window.addEventListener("load", () => ScrollTrigger.refresh());
}

initScrollStory();