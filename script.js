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
        word.style.rotate = `${((index * 37) % 13) - 6}deg`;

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
    wordEls.forEach((el) => { el.style.visibility = "hidden"; });

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