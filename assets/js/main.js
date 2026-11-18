(function () {
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  const modal = document.querySelector("#gate");
  const form = document.querySelector("#gate-form");
  const title = document.querySelector("#gate-title");
  const note = document.querySelector("#gate-note");
  const error = document.querySelector("#gate-error");
  const ADMIN_ID = "admin";
  const ADMIN_PASS = "Nadi@2026";

  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  if (burger && menu) {
    burger.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => menu.classList.remove("open"));
    });
  }

  const links = document.querySelectorAll(".nav-links a");
  const sections = [...links]
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((a) => {
            a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((s) => spy.observe(s));
  }

  function openGate(mode) {
    if (!modal) return;
    if (menu) menu.classList.remove("open");
    modal.classList.add("open");
    modal.dataset.mode = mode;
    const admin = mode === "login";
    title.textContent = admin ? "Log masuk pentadbir" : "Log masuk keluarga";
    note.textContent = admin
      ? "Masukkan ID dan kata laluan pentadbir."
      : "Setiap keluarga ada ID sendiri. Data rumah terbuka selepas log masuk.";
    modal.querySelectorAll("[data-admin]").forEach((el) => {
      el.hidden = false;
      const input = el.querySelector("input");
      if (input) input.required = true;
    });
    modal.querySelectorAll("[data-family]").forEach((el) => {
      el.hidden = true;
      const input = el.querySelector("input");
      if (input) {
        input.required = false;
        input.disabled = true;
      }
    });
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
    const first = modal.querySelector("[name='adminId']");
    if (first) first.focus();
  }

  document.querySelectorAll("[data-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openGate(el.getAttribute("data-open"));
    });
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("[data-close]")) modal.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modal.classList.remove("open");
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const id = String(data.get("adminId") || "").trim().toLowerCase();
      const pass = String(data.get("password") || "");
      const house = (window.NR_HOUSES || []).find((item) => item.id === id && item.password === pass);
      if (id === ADMIN_ID && pass === ADMIN_PASS) {
        sessionStorage.setItem("nr_role", "admin");
        sessionStorage.setItem("nr_name", "Admin");
        sessionStorage.setItem("nr_email", "admin@nadirumah.my");
        sessionStorage.setItem("nr_house", "aminah");
      } else if (house) {
        sessionStorage.setItem("nr_role", "keluarga");
        sessionStorage.setItem("nr_name", house.name);
        sessionStorage.setItem("nr_email", house.id + "@nadirumah.my");
        sessionStorage.setItem("nr_house", house.id);
      } else {
        if (error) {
          error.hidden = false;
          error.textContent = "ID atau kata laluan tidak sepadan.";
        }
        return;
      }
      window.location.href = "dashboard.html";
    });
  }

  const canvas = document.querySelector("#dust");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    const stage = canvas.parentElement;
    let dots = [];
    function size() {
      canvas.width = stage.clientWidth;
      canvas.height = stage.clientHeight;
      const count = Math.min(70, Math.floor(canvas.width / 12));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,
        v: Math.random() * 0.35 + 0.05,
        gold: Math.random() > 0.72
      }));
    }
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots.forEach((d) => {
        d.y -= d.v;
        if (d.y < -4) d.y = canvas.height + 4;
        ctx.beginPath();
        ctx.fillStyle = d.gold ? "rgba(196,160,106,0.75)" : "rgba(62,90,66,0.28)";
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    size();
    frame();
    window.addEventListener("resize", size);
  }

  document.querySelectorAll("[data-bill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-bill]").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      const yearly = btn.dataset.bill === "year";
      document.querySelectorAll("[data-price]").forEach((el) => {
        el.textContent = yearly ? el.dataset.year : el.dataset.month;
      });
      document.querySelectorAll(".save").forEach((el) => {
        el.hidden = !yearly;
      });
    });
  });
})();
