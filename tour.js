/* =========================================
   PORTFOLIO — VISITE GUIDÉE (PREMIÈRE VISITE)
   Fichier indépendant : script.js n'est pas modifié.
========================================= */

(() => {
    "use strict";

    const STORAGE_KEY = "portfolio-tour-done";
    const START_DELAY = 3500; // laisse finir les animations de l'accueil

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /*
     * Étape 0 : invitation (le visiteur choisit).
     * Étapes suivantes : une bulle par endroit du site.
     *   highlight : élément entouré
     *   scroll    : élément vers lequel on défile ("top" = haut de page)
     */
    const STEPS = [
        {
            intro: true,
            title: "Bienvenue !",
            text: "Veux-tu une visite guidée de 30 secondes ? Elle te montre comment explorer ce portfolio.",
            next: "Commencer la visite",
            skip: "Non merci"
        },
        {
            title: "Le saladier de compétences",
            text: "Clique sur un mot, ou sur « Tirer un mot » : chaque compétence est reliée à un projet réel.",
            highlight: "#saladier",
            scroll: "#saladier"
        },
        {
            title: "Le menu",
            text: "Passe d'une section à l'autre ici : la page se tourne comme un livre.",
            highlight: ".nav",
            scroll: "top"
        },
        {
            title: "Mes projets",
            text: "Chaque carte mène au code source sur GitHub. Sénégal Challenge est jouable en ligne.",
            highlight: "#projets h2",
            scroll: "#projets h2"
        },
        {
            title: "Mon parcours",
            text: "Ma formation, mon stage et ma photo : c'est ici qu'on fait connaissance.",
            highlight: "#a-propos h2",
            scroll: "#a-propos h2"
        },
        {
            title: "Contact",
            text: "Je cherche un stage à Dakar à partir de mai 2027. Écris-moi par e-mail ou sur LinkedIn.",
            highlight: "#contact .contact-links",
            scroll: "#contact .contact-links"
        }
    ];

    /* ---------- Mémorisation (première visite) ---------- */

    function isDone() {
        try {
            return localStorage.getItem(STORAGE_KEY) === "1";
        } catch (error) {
            return false;
        }
    }

    function setDone() {
        try {
            localStorage.setItem(STORAGE_KEY, "1");
        } catch (error) {
            /* Stockage indisponible : la visite sera reproposée. */
        }
    }

    /* ---------- Création de la bulle ---------- */

    const bubble = document.createElement("section");
    bubble.className = "tour-bubble";
    bubble.hidden = true;
    bubble.setAttribute("role", "dialog");
    bubble.setAttribute("aria-live", "polite");
    bubble.setAttribute("aria-label", "Visite guidée");

    const progress = document.createElement("p");
    progress.className = "tour-progress";

    const title = document.createElement("p");
    title.className = "tour-title";

    const text = document.createElement("p");
    text.className = "tour-text";

    const actions = document.createElement("div");
    actions.className = "tour-actions";

    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "tour-prev";
    prevButton.textContent = "Précédent";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "tour-next";

    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.className = "tour-skip";

    actions.append(prevButton, nextButton, skipButton);
    bubble.append(progress, title, text, actions);
    document.body.appendChild(bubble);

    /* ---------- État ---------- */

    let isOpen = false;
    let index = 0;
    let highlighted = null;

    /* ---------- Affichage ---------- */

    function clearHighlight() {
        if (highlighted) {
            highlighted.classList.remove("tour-highlight");
            highlighted = null;
        }
    }

    function highlight(selector) {
        const element = document.querySelector(selector);

        if (!element) return;

        element.classList.add("tour-highlight");
        highlighted = element;
    }

    function scrollToStep(step) {
        const behavior = reduceMotion ? "auto" : "smooth";

        if (step.scroll === "top") {
            window.scrollTo({ top: 0, behavior });
            return;
        }

        if (step.scroll) {
            const element = document.querySelector(step.scroll);

            if (element) {
                element.scrollIntoView({ behavior, block: "start" });
            }
        }
    }

    function render(i) {
        const step = STEPS[i];
        const isLast = i === STEPS.length - 1;

        index = i;

        progress.hidden = Boolean(step.intro);
        progress.textContent = `Étape ${i} sur ${STEPS.length - 1}`;
        title.textContent = step.title;
        text.textContent = step.text;

        prevButton.hidden = i <= 1;
        nextButton.textContent = step.next || (isLast ? "Terminer" : "Suivant");
        skipButton.textContent = step.skip || "Passer la visite";

        bubble.hidden = false;

        bubble.classList.remove("tour-enter");
        void bubble.offsetWidth;
        bubble.classList.add("tour-enter");

        /* Laisse de la place pour que la bulle ne cache pas le bas de la page. */
        document.body.style.paddingBottom = `${bubble.offsetHeight + 24}px`;

        clearHighlight();

        if (step.highlight) highlight(step.highlight);

        scrollToStep(step);
    }

    function closeTour() {
        setDone();
        isOpen = false;
        bubble.hidden = true;
        clearHighlight();
        document.body.style.paddingBottom = "";
    }

    function openTour() {
        isOpen = true;
        render(0);
    }

    /* ---------- Boutons ---------- */

    nextButton.addEventListener("click", () => {
        if (index >= STEPS.length - 1) {
            closeTour();
        } else {
            render(index + 1);
        }
    });

    prevButton.addEventListener("click", () => {
        if (index > 1) render(index - 1);
    });

    skipButton.addEventListener("click", closeTour);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen) closeTour();
    });

    /* ---------- Lien « Revoir la visite » dans le pied de page ---------- */

    const footer = document.querySelector(".footer");

    if (footer) {
        const replayButton = document.createElement("button");

        replayButton.type = "button";
        replayButton.className = "tour-replay";
        replayButton.textContent = "Revoir la visite guidée";

        replayButton.addEventListener("click", openTour);

        footer.appendChild(replayButton);
    }

    /* ---------- Démarrage : première visite uniquement ---------- */

    function start() {
        if (isDone()) return;

        setTimeout(() => {
            if (!isDone()) openTour();
        }, START_DELAY);
    }

    if (document.readyState === "complete") {
        start();
    } else {
        window.addEventListener("load", start);
    }
})();