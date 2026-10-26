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