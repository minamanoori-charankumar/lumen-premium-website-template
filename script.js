/* ==========================================================================
   LUMEN — vanilla JS only. No frameworks, no build step.
   Sections: Loader, Nav, Reveals, Counters, Tilt, Work filters,
   Testimonial slider, FAQ accordion, Forms, Back-to-top, Ripple.
   ========================================================================== */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onIdle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn) : setTimeout(fn, 1));

  /* ------------------------------------------------------------------
     LOADER
  ------------------------------------------------------------------ */
  function hideLoader() {
    const loader = document.getElementById("loader");
    if (!loader) return;
    loader.classList.add("is-hidden");
    setTimeout(() => (loader.style.display = "none"), 850);
    playHeroIntro();
  }
  window.addEventListener("load", hideLoader);
  // Safety fallback if the load event is delayed
  setTimeout(hideLoader, 2500);

  /* ------------------------------------------------------------------
     HERO INTRO (title lines + fade-ins), runs once after loader
  ------------------------------------------------------------------ */
  let heroPlayed = false;
  function playHeroIntro() {
    if (heroPlayed) return;
    heroPlayed = true;
    if (reduceMotion) {
      document.querySelectorAll(".reveal-line > span, .hero [data-reveal]").forEach((el) => {
        el.style.transform = "none";
        el.style.opacity = "1";
      });
      return;
    }
    const words = document.querySelectorAll(".reveal-line > span");
    words.forEach((el, i) => {
      el.style.transition = `transform 0.9s cubic-bezier(.16,1,.3,1) ${0.08 * i}s`;
      requestAnimationFrame(() => (el.style.transform = "translateY(0)"));
    });

    const heroReveals = document.querySelectorAll(".hero [data-reveal]");
    heroReveals.forEach((el, i) => {
      el.style.transition = `opacity 0.9s ease ${0.45 + i * 0.1}s, transform 0.9s cubic-bezier(.16,1,.3,1) ${0.45 + i * 0.1}s`;
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });
  }

  /* ------------------------------------------------------------------
     SCROLL PROGRESS BAR
  ------------------------------------------------------------------ */
  const scrollProgress = document.getElementById("scrollProgress");
  function updateScrollProgress() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop || document.body.scrollTop;
    const max = doc.scrollHeight - doc.clientHeight;
    if (scrollProgress) scrollProgress.style.width = max > 0 ? `${(scrolled / max) * 100}%` : "0%";
  }

  /* ------------------------------------------------------------------
     NAV: scrolled state, mobile toggle, back-to-top — one scroll listener
  ------------------------------------------------------------------ */
  const nav = document.getElementById("nav");
  const toTop = document.getElementById("toTop");
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 30);
      toTop.classList.toggle("is-visible", y > 700);
      updateScrollProgress();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");
  navToggle.addEventListener("click", () => {
    const open = navMobile.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  navMobile.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navMobile.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ------------------------------------------------------------------
     SCROLL-TRIGGERED REVEALS (IntersectionObserver — single instance)
  ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll("[data-reveal]:not(.hero [data-reveal])");
  revealEls.forEach((el, i) => el.style.setProperty("--i", i % 8));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
            if (entry.target.hasAttribute("data-count")) animateCounter(entry.target);
            entry.target.querySelectorAll("[data-count]").forEach(animateCounter);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------
     ANIMATED COUNTERS (stats / metrics)
  ------------------------------------------------------------------ */
  const countedEls = new WeakSet();
  function animateCounter(el) {
    if (countedEls.has(el)) return;
    countedEls.add(el);
    const target = parseInt(el.dataset.count, 10);
    if (Number.isNaN(target)) return;
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     3D TILT ON CARDS (mouse-driven, GPU-accelerated transform)
  ------------------------------------------------------------------ */
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      let raf = null;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg)`;
        });
      });
      card.addEventListener("mouseleave", () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     BUTTON RIPPLE MICRO-INTERACTION
  ------------------------------------------------------------------ */
  if (!reduceMotion) {
    document.querySelectorAll(".btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const r = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(r.width, r.height);
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - r.left - size / 2}px`;
        ripple.style.top = `${e.clientY - r.top - size / 2}px`;
        btn.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
      });
    });
  }

  /* ------------------------------------------------------------------
     WORK / PORTFOLIO FILTERS
  ------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const workCards = document.querySelectorAll(".work-card");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const filter = btn.dataset.filter;
      workCards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !match);
      });
    });
  });

  /* ------------------------------------------------------------------
     TESTIMONIAL SLIDER (autoplay + manual controls + dots)
  ------------------------------------------------------------------ */
  (function testimonialSlider() {
    const slides = document.querySelectorAll(".testimonial-slide");
    const dotsWrap = document.getElementById("testimonialDots");
    const prevBtn = document.getElementById("testimonialPrev");
    const nextBtn = document.getElementById("testimonialNext");
    if (!slides.length) return;

    let index = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll("button");

    function goTo(i) {
      slides[index].classList.remove("is-active");
      dots[index].classList.remove("is-active");
      index = (i + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      dots[index].classList.add("is-active");
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => goTo(index + 1), 6000);
    }

    prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn.addEventListener("click", () => goTo(index + 1));
    restart();
  })();

  /* ------------------------------------------------------------------
     FAQ ACCORDION
  ------------------------------------------------------------------ */
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".faq-question").forEach((other) => {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          other.nextElementSibling.style.maxHeight = null;
        }
      });

      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = isOpen ? null : `${answer.scrollHeight}px`;
    });
  });

  /* ------------------------------------------------------------------
     CONTACT FORM: lightweight client-side validation + demo submit
  ------------------------------------------------------------------ */
  (function contactForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;
    const status = document.getElementById("formStatus");

    const rules = {
      name: (v) => v.trim().length > 1 || "Please enter your name.",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Please enter a valid email.",
      budget: (v) => v !== "" || "Please select a budget range.",
      message: (v) => v.trim().length > 9 || "Tell us a little more about the project.",
    };

    function validateField(name) {
      const el = form.elements[name];
      const errorEl = document.getElementById(`err-${name}`);
      if (!el || !errorEl || !rules[name]) return true;
      const result = rules[name](el.value);
      errorEl.textContent = result === true ? "" : result;
      return result === true;
    }

    ["name", "email", "budget", "message"].forEach((name) => {
      const el = form.elements[name];
      if (el) el.addEventListener("blur", () => validateField(name));
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const validFields = ["name", "email", "budget", "message"].map(validateField);
      if (!validFields.every(Boolean)) {
        status.textContent = "Please fix the highlighted fields.";
        status.style.color = "#b5473f";
        return;
      }

      form.classList.add("is-loading");
      status.textContent = "";

      // Simulated network request — replace with a real endpoint.
      setTimeout(() => {
        form.classList.remove("is-loading");
        status.style.color = "";
        status.textContent = "Demo mode: form validated. Connect your own form endpoint before publishing.";
        form.reset();
        form.querySelectorAll(".field-error").forEach((e) => (e.textContent = ""));
      }, 1100);
    });
  })();

  /* ------------------------------------------------------------------
     FOOTER NEWSLETTER: demo submit
  ------------------------------------------------------------------ */
  (function footerForm() {
    const form = document.getElementById("footerForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      const original = input.placeholder;
      input.value = "";
      input.placeholder = "Subscribed ✓";
      setTimeout(() => (input.placeholder = original), 2600);
    });
  })();

  /* ------------------------------------------------------------------
     SMOOTH ANCHOR SCROLL (native, offset for fixed nav)
  ------------------------------------------------------------------ */
  const navHeight = document.querySelector(".nav").offsetHeight;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - (navHeight - 1);
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });
})();
