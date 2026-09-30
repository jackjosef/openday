/* =========================================================
   OPEN DAY – C.E.P. Nuestra Señora de Fátima
   ---------------------------------------------------------
   ► EDITA SOLO ESTE BLOQUE "CONFIG" ◄
   Pega el enlace de tu Formulario de Google en formUrl y
   todos los botones de inscripción de la página lo usarán.
   ========================================================= */
const OD_CONFIG = {
  formUrl:  "#",   // Ej.: "https://forms.gle/XXXXXXXXXXXX"
  fecha:    "Sábado 10 de octubre",          // Ej.: "Sábado 24 de octubre"
  hora:     "10:00 a.m.",           // Ej.: "8:30 a.m."
  lugar:    "C.E.P. Nuestra Señora de Fátima, Iquitos",
  horario:  "lunes a viernes de 8:00 a.m. a 1:00 p.m.",
  telefono: "(065) 000000",
  whatsapp: "937 423 882",                  // Número peruano de 9 dígitos
  correo:   "admision@nsfatima.edu.pe",
  autoplayMs: 5000,                         // Velocidad del carrusel (ms)

  /* ---- FORMULARIO DE PRE-REGISTRO (sección "Completa tus datos") ----
     Los datos se guardan en una Hoja de cálculo de Google mediante Apps Script.
     Pegue aquí la URL de la "Aplicación web" (termina en /exec).
     Pasos completos en: apps-script/GUIA_REGISTROS.txt */
  scriptUrl: "https://script.google.com/macros/s/AKfycbzmVZkkO0NDW2pW_rNF5RRlyP-nBSrkzcPOQcY9A_w7Wh4_nl2Ue_EnscKqzLbqFpCy_A/exec"
};

(function () {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- 1. Aplicar configuración ---------- */
  $$("[data-cfg]").forEach(el => {
    const v = OD_CONFIG[el.dataset.cfg];
    if (v) el.textContent = v;
  });
  $$("[data-cfg-tel]").forEach(a => a.href = "tel:" + OD_CONFIG.telefono.replace(/[^\d+]/g, ""));
  $$("[data-cfg-mail]").forEach(a => a.href = "mailto:" + OD_CONFIG.correo + "?subject=" + encodeURIComponent("Consulta Open Day – Admisión 2027"));
  $$("[data-cfg-wa]").forEach(a => {
    let n = OD_CONFIG.whatsapp.replace(/\D/g, "");
    if (n.length === 9) n = "51" + n;
    a.href = "https://wa.me/" + n + "?text=" + encodeURIComponent("Hola, deseo información sobre el Open Day – Admisión 2027.");
  });

  /* Botones de formulario */
  $$(".js-form").forEach(a => {
    a.href = OD_CONFIG.formUrl;
    a.addEventListener("click", e => {
      if (!OD_CONFIG.formUrl || OD_CONFIG.formUrl === "#") {
        e.preventDefault();
        console.warn("[OpenDay] Falta pegar el enlace del Formulario de Google en OD_CONFIG.formUrl");
        const t = $("#registro");
        if (t) t.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  /* ---------- 2. Botón flotante ---------- */
  const floatBtn = $(".od-float");
  const onScroll = () => {
    if (!floatBtn) return;
    const reg = $("#registro"), rr = reg ? reg.getBoundingClientRect() : null;
    const regInView = rr && rr.top < window.innerHeight && rr.bottom > 0;
    const hero = $(".od-hero"), hb = hero ? hero.getBoundingClientRect().bottom : 0;
    floatBtn.classList.toggle("is-visible", hb < 0 && !regInView);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3. Carrusel genérico ---------- */
  function carousel({ root, getCount, render, dotsBox, prev, next, interval }) {
    let i = 0, timer = null;
    const dots = [];
    const go = n => {
      const c = getCount();
      i = (n + c) % c;
      render(i);
      dots.forEach((d, k) => { d.classList.toggle("is-active", k === i); d.setAttribute("aria-selected", k === i); });
    };
    const build = () => {
      dotsBox.innerHTML = ""; dots.length = 0;
      for (let k = 0; k < getCount(); k++) {
        const d = document.createElement("button");
        d.className = "od-dot"; d.type = "button"; d.setAttribute("role", "tab");
        d.setAttribute("aria-label", "Ir a la imagen " + (k + 1));
        d.addEventListener("click", () => { go(k); restart(); });
        dotsBox.appendChild(d); dots.push(d);
      }
      go(Math.min(i, getCount() - 1));
    };
    const start = () => { if (interval) timer = setInterval(() => go(i + 1), interval); };
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };
    prev && prev.addEventListener("click", () => { go(i - 1); restart(); });
    next && next.addEventListener("click", () => { go(i + 1); restart(); });
    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    /* Deslizar con el dedo */
    let x0 = null;
    root.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); restart(); }
      x0 = null;
    });
    build(); start();
    return { rebuild: build };
  }

  /* Banner principal */
  const hero = $(".od-hero");
  const slides = $$(".od-hero__slide", hero);
  carousel({
    root: hero,
    getCount: () => slides.length,
    render: i => slides.forEach((s, k) => s.classList.toggle("is-active", k === i)),
    dotsBox: $(".od-hero__dots", hero),
    prev: $(".od-hero__arrow--prev", hero),
    next: $(".od-hero__arrow--next", hero),
    interval: OD_CONFIG.autoplayMs
  });

  /* Galería: 2 fotos en escritorio, 1 en móvil */
  const gal = $(".od-gallery");
  const track = $(".od-gallery__track", gal);
  const items = $$(".od-gallery__item", gal);
  const perView = () => (window.matchMedia("(max-width:700px)").matches ? 1 : 2);
  const galCount = () => items.length - perView() + 1;
  const galCar = carousel({
    root: gal,
    getCount: galCount,
    render: i => { track.style.transform = "translateX(-" + (i * 100 / perView()) + "%)"; },
    dotsBox: $(".od-gallery__dots"),
    prev: $(".od-gallery__arrow--prev", gal),
    next: $(".od-gallery__arrow--next", gal),
    interval: OD_CONFIG.autoplayMs + 1000
  });
  let lastPV = perView();
  window.addEventListener("resize", () => { if (perView() !== lastPV) { lastPV = perView(); galCar.rebuild(); } });

  /* ---------- 4. Formulario de pre-registro ---------- */
  const form = $("#odForm");
  if (form) {
    const msg = $("#odFormMsg");
    const btn = $(".od-form__submit", form);
    const setMsg = (t, ok) => { msg.textContent = t; msg.className = "od-form__msg " + (ok ? "is-ok" : "is-err"); };
    const tel = form.elements.celular;
    tel.addEventListener("input", () => {
      const d = tel.value.replace(/\D/g, "").slice(0, 9);
      tel.value = d.replace(/(\d{3})(\d{0,3})(\d{0,3})/, (m, a, b, c) => [a, b, c].filter(Boolean).join(" "));
    });
    const checks = {
      nombres:   v => v.trim().length >= 2,
      apellidos: v => v.trim().length >= 2,
      email:     v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      celular:   v => /^9\d{8}$/.test(v.replace(/\D/g, "")),
      grado:     v => !!v,
      anio:      v => !!v
    };
    Object.keys(checks).forEach(n => {
      form.elements[n].addEventListener("input", () => form.elements[n].closest(".od-field").classList.remove("is-invalid"));
      form.elements[n].addEventListener("change", () => form.elements[n].closest(".od-field").classList.remove("is-invalid"));
    });

    form.addEventListener("submit", e => {
      e.preventDefault();
      let firstBad = null;
      Object.entries(checks).forEach(([n, fn]) => {
        const el = form.elements[n], bad = !fn(el.value);
        el.closest(".od-field").classList.toggle("is-invalid", bad);
        if (bad && !firstBad) firstBad = el;
      });
      if (firstBad) {
        setMsg("Revise los campos marcados en rojo (el celular debe tener 9 dígitos y empezar con 9).", false);
        firstBad.focus();
        return;
      }

      /* Anti-spam: si el campo oculto viene lleno, es un robot */
      if (form.elements.website && form.elements.website.value) return;

      if (!OD_CONFIG.scriptUrl) {
        console.warn("[OpenDay] Falta OD_CONFIG.scriptUrl (URL /exec de Apps Script).");
        setMsg("El formulario aún no está conectado. Contáctenos por WhatsApp o correo.", false);
        return;
      }

      const data = new URLSearchParams({
        nombres:   form.elements.nombres.value.trim(),
        apellidos: form.elements.apellidos.value.trim(),
        email:     form.elements.email.value.trim().toLowerCase(),
        celular:   "+51 " + form.elements.celular.value.trim(),
        grado:     form.elements.grado.value,
        anio:      form.elements.anio.value,
        origen:    location.href
      });

      btn.disabled = true; btn.textContent = "Enviando…";
      fetch(OD_CONFIG.scriptUrl, { method: "POST", mode: "no-cors", body: data })
        .then(() => {
          form.reset();
          setMsg("¡Gracias! Recibimos sus datos. Pronto nos comunicaremos con usted.", true);
        })
        .catch(() => {
          setMsg("No se pudo enviar. Revise su conexión o escríbanos por WhatsApp.", false);
        })
        .finally(() => { btn.disabled = false; btn.textContent = "Enviar"; });
    });
  }

  /* ---------- 5. Animación al aparecer ---------- */
  const revealEls = $$(".od-title, .od-card, .od-quote, .od-event, .od-gallery, .od-contact__data");
  if ("IntersectionObserver" in window) {
    revealEls.forEach(el => el.classList.add("od-reveal"));
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }
})();
