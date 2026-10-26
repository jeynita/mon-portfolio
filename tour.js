(() => {
    "use strict";

    const STORAGE_KEY = "portfolio-tour-done";
    const START_DELAY = 3500; // laisse finir les animations de l'accueil
    const HEADER_OFFSET = 72;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileQuery = window.matchMedia("(max-width: 640px)");

    /*
     * target : élément éclairé
     * pad    : marge autour de l'élément éclairé
     * wait   : étape interactive. La visite attend un clic sur `selector`
     *          avant de proposer « Suivant ».
     */
    const STEPS = [
        {
            intro: true,
            title: "Bienvenue !",
            text: "Cela te dit une visite guidée ? .",
            next: "C'est parti",
            skip: "Non merci"
        },
        {
            title: "Pioche un mot",
            text: "Ce saladier contient mes compétences. Chacune est reliée à un projet sur lequel j'ai travaillé.",
            target: ".saladier-wrap",
            pad: 14,
            wait: {
                selector: "#draw-button",
                hint: "À toi : clique sur « Tirer un mot »",
                done: "Bien joué ! Sous le mot tiré, tu vois la preuve ;c'est a dire le projet où je l'ai utilisé.",
                delay: 500
            }
        },
        {
            title: "Tourne les pages",
            text: "Le menu te fait passer d'une section à l'autre comme dans un livre.",
            target: ".nav",
            pad: 8,
            wait: {
                selector: ".nav a",
                hint: "Essaie : clique sur « Projets »",
                done: "Tu as vu la page se tourner ? Voyons justement mes projets.",
                delay: 1800
            }
        },
        {
            title: "Mes projets",
            text: "Chaque carte mène au code source sur GitHub.  De plus, le Sénégal Challenge se joue est deja en ligne.",
            target: "#projets .card",
            pad: 12
        },
        {
            title: "Mon parcours",
            text: "Ma formation, mon stage chez InTouch et ma photo : c'est ici qu'on fait connaissance.",
            target: "#a-propos .timeline",
            pad: 14
        },
        {
            title: "Parlons-nous",
                        text: "Je cherche un stage à Dakar à partir de mai 2027. Écris-moi, ou télécharge mon CV.", 
            target: "#contact .contact-links",
            pad: 14
        }
    ];

    const TOTAL = STEPS.length - 1; // sans l'invitation

    /*  Mémorisation (première visite)  */

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

    /*  Construction de l'interface  */

    function make(tag, className, content) {
        const node = document.createElement(tag);

        if (className) node.className = className;
        if (content) node.textContent = content;

        return node;
    }

    const root = make("div", "tour");
    root.hidden = true;

    const dim = make("div", "tour-dim");
    const spot = make("div", "tour-spot is-off is-closed");

    const card = make("section", "tour-card is-away is-instant");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Visite guidée");

    const arrow = make("span", "tour-arrow");
    const deco = make("div", "tour-deco");
    deco.appendChild(make("span", "tour-sun"));

    const closeButton = make("button", "tour-close", "\u00D7");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Fermer la visite");

    const badge = make("p", "tour-badge");
    const title = make("h2", "tour-title");
    const text = make("p", "tour-text");
    text.setAttribute("aria-live", "polite");

    const hint = make("p", "tour-hint");
    const hintDot = make("span", "tour-hint__dot");
    const hintText = make("span", "tour-hint__text");
    hint.append(hintDot, hintText);

    const footer = make("div", "tour-footer");
    const dots = make("div", "tour-dots");
    dots.setAttribute("aria-hidden", "true");

    for (let i = 0; i < TOTAL; i++) dots.appendChild(make("span", "tour-dot"));

    const actions = make("div", "tour-actions");

    const prevButton = make("button", "tour-btn tour-btn--ghost", "Précédent");
    prevButton.type = "button";

    const skipButton = make("button", "tour-btn tour-btn--ghost", "Non merci");
    skipButton.type = "button";

    const nextButton = make("button", "tour-btn tour-btn--primary");
    nextButton.type = "button";

    actions.append(prevButton, skipButton, nextButton);
    footer.append(dots, actions);
    card.append(arrow, deco, closeButton, badge, title, text, hint, footer);
    root.append(dim, spot, card);
    document.body.appendChild(root);

    /*  État  */

    let isOpen = false;
    let shown = false;
    let index = 0;
    let runId = 0;
    let target = null;
    let currentPad = 10;
    let waiting = false;
    let gliding = false;
    let lastKey = "";
    let rafId = 0;
    let clickListener = null;
    let doneTimer = 0;
    let glideTimer = 0;

    /*  Outils  */

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function isPinned(node) {
        for (let n = node; n && n !== document.body; n = n.parentElement) {
            const position = getComputedStyle(n).position;

            if (position === "fixed" || position === "sticky") return true;
        }

        return false;
    }

    function rectKey(rect) {
        return [rect.top, rect.left, rect.width, rect.height, window.innerWidth, window.innerHeight]
            .map((n) => Math.round(n))
            .join("|");
    }

    /*  Spotlight et bulle  */

    function closeSpot(animate = true) {
        spot.classList.toggle("is-instant", !animate);
        spot.classList.add("is-closed");
        spot.style.left = `${window.innerWidth / 2}px`;
        spot.style.top = `${window.innerHeight / 2}px`;
        spot.style.width = "0px";
        spot.style.height = "0px";
    }

    function layoutIntro() {
        card.classList.remove("is-docked");
        arrow.dataset.side = "";

        const cw = card.offsetWidth;
        const ch = card.offsetHeight;

        card.style.left = `${Math.max(12, (window.innerWidth - cw) / 2)}px`;
        card.style.top = `${Math.max(12, (window.innerHeight - ch) / 2)}px`;
    }

    function applyLayout(animateSpot, animateCard) {
        spot.classList.toggle("is-instant", !animateSpot);
        card.classList.toggle("is-instant", !animateCard);

        if (!target) {
            layoutIntro();
            return;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = target.getBoundingClientRect();

        const top = Math.max(8, rect.top - currentPad);
        const left = Math.max(8, rect.left - currentPad);
        const right = Math.min(vw - 8, rect.right + currentPad);
        const bottom = Math.min(vh - 8, rect.bottom + currentPad);
        const w = Math.max(0, right - left);
        const h = Math.max(0, bottom - top);

        spot.classList.remove("is-closed");
        spot.style.left = `${left}px`;
        spot.style.top = `${top}px`;
        spot.style.width = `${w}px`;
        spot.style.height = `${h}px`;

        lastKey = rectKey(rect);

        /* Mobile : la bulle se pose en bas de l'écran. */
        if (mobileQuery.matches) {
            card.classList.add("is-docked");
            arrow.dataset.side = "";
            return;
        }

        card.classList.remove("is-docked");

        const cw = card.offsetWidth;
        const ch = card.offsetHeight;
        const gap = 18;
        const margin = 16;
        const spaceBelow = vh - bottom;
        const spaceAbove = top;
        const spaceRight = vw - right;
        const spaceLeft = left;

        let x = clamp(left + w / 2 - cw / 2, margin, vw - cw - margin);
        let y;
        let side = "";

        if (spaceBelow >= ch + gap + 12) {
            y = bottom + gap;
            side = "top";
        } else if (spaceAbove >= ch + gap + 12) {
            y = top - gap - ch;
            side = "bottom";
        } else if (spaceRight >= cw + gap + margin) {
            x = right + gap;
            y = clamp(top + h / 2 - ch / 2, margin, vh - ch - margin);
            side = "left";
        } else if (spaceLeft >= cw + gap + margin) {
            x = left - gap - cw;
            y = clamp(top + h / 2 - ch / 2, margin, vh - ch - margin);
            side = "right";
        } else {
            y = vh - ch - margin;
        }

        card.style.left = `${x}px`;
        card.style.top = `${y}px`;
        arrow.dataset.side = side;

        if (side === "top" || side === "bottom") {
            arrow.style.setProperty("--ax", `${clamp(left + w / 2 - x, 30, cw - 30)}px`);
        } else if (side) {
            arrow.style.setProperty("--ay", `${clamp(top + h / 2 - y, 30, ch - 30)}px`);
        }
    }

    function startGlide() {
        gliding = true;
        clearTimeout(glideTimer);
        glideTimer = setTimeout(() => {
            gliding = false;
        }, 750);
    }

    /* Suit l'élément si la page bouge (animations, redimensionnement). */
    function tick() {
        if (!isOpen) return;

        rafId = requestAnimationFrame(tick);

        if (!target || gliding || card.classList.contains("is-away")) return;

        if (rectKey(target.getBoundingClientRect()) !== lastKey) applyLayout(false, false);
    }

    /*  Défilement  */

    function scrollDelta(element) {
        if (isPinned(element)) return 0;

        const rect = element.getBoundingClientRect();
        const vh = window.innerHeight;
        const mobile = mobileQuery.matches;
        const cardHeight = card.offsetHeight || 220;
        const bottomLimit = mobile ? vh - cardHeight - 24 : vh - 24;
        const available = bottomLimit - HEADER_OFFSET;
        const full = rect.height + currentPad * 2;

        /* Élément plus haut que l'écran : on aligne son haut. */
        if (full > available) {
            const desired = HEADER_OFFSET + currentPad;

            return Math.abs(rect.top - desired) > 80 ? rect.top - desired : 0;
        }

        const fits = rect.top - currentPad >= HEADER_OFFSET - 8 && rect.bottom + currentPad <= bottomLimit;
        const room = mobile
            || vh - (rect.bottom + currentPad) >= cardHeight + 30
            || rect.top - currentPad - HEADER_OFFSET >= cardHeight + 30;

        if (fits && room) return 0;

        const desired = HEADER_OFFSET + (available - full) / 2 + currentPad;

        return rect.top - desired;
    }

    function waitForScrollEnd(id) {
        return new Promise((resolve) => {
            const start = performance.now();
            let last = window.scrollY;
            let still = 0;

            (function step() {
                if (id !== runId) return resolve();

                const y = window.scrollY;
                const elapsed = performance.now() - start;

                still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
                last = y;

                if ((elapsed > 250 && still >= 6) || elapsed > 1600) return resolve();

                requestAnimationFrame(step);
            })();
        });
    }

    /*  Étapes interactives  */

    function disarm() {
        if (clickListener) {
            document.removeEventListener("click", clickListener, true);
            clickListener = null;
        }

        clearTimeout(doneTimer);
        waiting = false;
    }

    function arm(step, id) {
        disarm();

        if (!step.wait) return;

        waiting = true;
        hint.hidden = false;
        hint.classList.remove("is-done");
        hintText.textContent = step.wait.hint;

        clickListener = (event) => {
            if (!event.target.closest || !event.target.closest(step.wait.selector)) return;

            document.removeEventListener("click", clickListener, true);
            clickListener = null;

            doneTimer = setTimeout(() => {
                if (id !== runId || !isOpen) return;

                waiting = false;
                text.textContent = step.wait.done;
                hint.classList.add("is-done");
                hintText.textContent = "Fait !";
                nextButton.textContent = "Suivant";
                nextButton.classList.remove("is-ghost");
                applyLayout(true, true);
                nextButton.focus({ preventScroll: true });
            }, step.wait.delay || 400);
        };

        document.addEventListener("click", clickListener, true);
    }

    /*  Navigation entre les étapes  */

    function fill(step) {
        const last = index === STEPS.length - 1;

        card.classList.toggle("is-intro", Boolean(step.intro));
        badge.textContent = step.intro ? "Visite express · 30 s" : `Étape ${index} sur ${TOTAL}`;
        title.textContent = step.title;
        text.textContent = step.text;
        hint.hidden = true;

        dots.hidden = Boolean(step.intro);
        Array.from(dots.children).forEach((dot, i) => {
            dot.classList.toggle("is-active", i + 1 === index);
            dot.classList.toggle("is-done", i + 1 < index);
        });

        closeButton.hidden = Boolean(step.intro);
        skipButton.hidden = !step.intro;
        prevButton.hidden = index <= 1;

        nextButton.textContent = step.intro ? step.next : step.wait ? "Passer" : last ? "Terminer" : "Suivant";
        nextButton.classList.toggle("is-ghost", Boolean(step.wait));
    }

    function enterIntro() {
        const first = !shown;

        shown = true;
        target = null;
        dim.classList.add("is-on");
        spot.classList.add("is-off");
        applyLayout(!first, !first);
        void card.offsetWidth;
        card.classList.remove("is-away");
        nextButton.focus({ preventScroll: true });
    }

    function reveal(step, id) {
        if (id !== runId || !isOpen) return;

        const wasAway = card.classList.contains("is-away");

        shown = true;
        dim.classList.remove("is-on");
        spot.classList.remove("is-off");
        void spot.offsetWidth;

        applyLayout(true, !wasAway);
        startGlide();
        void card.offsetWidth;
        card.classList.remove("is-away");

        arm(step, id);
        nextButton.focus({ preventScroll: true });
    }

    function go(i) {
        const id = ++runId;
        const step = STEPS[i];

        disarm();
        index = i;
        fill(step);

        if (step.intro) {
            enterIntro();
            return;
        }

        const element = document.querySelector(step.target);

        if (!element) {
            /* Élément introuvable : on passe à l'étape suivante. */
            if (i < STEPS.length - 1) go(i + 1);
            else closeTour(true);
            return;
        }

        target = element;
        currentPad = step.pad === undefined ? 10 : step.pad;

        if (spot.classList.contains("is-off")) closeSpot(false);

        const delta = scrollDelta(element);

        if (Math.abs(delta) > 12) {
            card.classList.add("is-away");
            closeSpot(true);

            window.scrollBy({ top: delta, behavior: reduceMotion ? "auto" : "smooth" });

            waitForScrollEnd(id).then(() => reveal(step, id));
        } else {
            reveal(step, id);
        }
    }

    /*  Fin de la visite  */

    function confetti() {
        if (reduceMotion) return;

        const colors = ["#C0592F", "#E3A33B", "#1F3A5F", "#E8806A", "#FFF3D6"];
        const layer = make("div", "tour-confetti");

        document.body.appendChild(layer);

        const originX = window.innerWidth / 2;
        const originY = window.innerHeight * 0.72;

        for (let i = 0; i < 40; i++) {
            const piece = make("i");

            piece.style.background = colors[i % colors.length];
            piece.style.left = `${originX}px`;
            piece.style.top = `${originY}px`;
            layer.appendChild(piece);

            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.15;
            const distance = 170 + Math.random() * 290;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            piece.animate(
                [
                    { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
                    { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 540}deg)`, opacity: 1, offset: 0.55 },
                    { transform: `translate(${dx * 1.1}px, ${dy + 240}px) rotate(${Math.random() * 760}deg)`, opacity: 0 }
                ],
                { duration: 1400 + Math.random() * 700, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" }
            );
        }

        setTimeout(() => layer.remove(), 2400);
    }

    function closeTour(celebrate) {
        setDone();
        isOpen = false;
        runId++;
        disarm();
        cancelAnimationFrame(rafId);
        clearTimeout(glideTimer);
        target = null;
        root.classList.remove("is-open");

        setTimeout(() => {
            if (!isOpen) root.hidden = true;
        }, 400);

        if (celebrate) confetti();
    }

    function openTour() {
        if (isOpen) return;

        isOpen = true;
        shown = false;
        gliding = false;
        root.hidden = false;
        card.classList.add("is-away", "is-instant");
        dim.classList.remove("is-on");
        spot.classList.add("is-off");
        closeSpot(false);
        void root.offsetWidth;
        root.classList.add("is-open");
        lastKey = "";
        rafId = requestAnimationFrame(tick);
        go(0);
    }

    /*  Boutons et clavier  */

    nextButton.addEventListener("click", () => {
        if (index >= STEPS.length - 1) closeTour(true);
        else go(index + 1);
    });

    prevButton.addEventListener("click", () => {
        if (index > 1) go(index - 1);
    });

    skipButton.addEventListener("click", () => closeTour(false));
    closeButton.addEventListener("click", () => closeTour(false));

    document.addEventListener("keydown", (event) => {
        if (!isOpen) return;

        if (event.key === "Escape") {
            closeTour(false);
        } else if (event.key === "ArrowRight") {
            nextButton.click();
        } else if (event.key === "ArrowLeft" && !prevButton.hidden) {
            prevButton.click();
        }
    });

    window.addEventListener("resize", () => {
        if (isOpen && !card.classList.contains("is-away")) applyLayout(false, false);
    });

    /*  Lien « Revoir la visite » dans le pied de page  */

    const pageFooter = document.querySelector(".footer");

    if (pageFooter) {
        const replayButton = make("button", "tour-replay", "Revoir la visite guidée");

        replayButton.type = "button";
        replayButton.addEventListener("click", openTour);
        pageFooter.appendChild(replayButton);
    }

    /*  Démarrage : première visite uniquement  */

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