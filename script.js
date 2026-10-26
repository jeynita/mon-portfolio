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