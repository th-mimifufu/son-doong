/* =============================================================
   SƠN ĐOÒNG: tương tác trang
   ============================================================= */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Menu ---------- */
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $$("#navLinks a");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Đóng" : "Mục lục";
  }
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  /* Đánh dấu mục đang xem */
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) =>
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Cuộn: nav, thanh tiến trình, làm tối ảnh nền chương ---------- */
  const progressBar = $("#progressBar");
  const chapters = $$(".chapter").map((el) => ({
    el,
    media: $(".chapter__media", el),
    max: parseFloat(el.dataset.dim) || 0.5,
  }));
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    nav.classList.toggle("is-scrolled", y > 40);
    progressBar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    // Ảnh nền rõ ở trang mở chương, tối dần khi nội dung cuộn lên
    chapters.forEach((ch) => {
      const top = ch.el.getBoundingClientRect().top;
      const p = Math.min(Math.max(-top / (vh * 0.7), 0), 1);
      ch.media.style.setProperty("--dim", (p * ch.max).toFixed(3));
    });
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Xuất hiện khi cuộn ---------- */
  if (reduceMotion) {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
    );
    $$(".reveal").forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Biểu đồ cột ---------- */
  const chart = $("#vertebrateChart");
  if (chart) {
    const bars = $$(".bar", chart);
    const values = bars.map((b) => +b.dataset.value);
    const maxValue = Math.max(...values);
    const total = values.reduce((a, b) => a + b, 0); // 813
    const tip = $("#chartTip");

    new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        bars.forEach((b, i) => {
          const fill = $(".bar__fill", b);
          fill.style.transitionDelay = i * 0.08 + "s";
          fill.style.width = (values[i] / maxValue) * 100 + "%";
        });
        obs.disconnect();
      },
      { threshold: 0.3 }
    ).observe(chart);

    function showTip(bar) {
      const v = +bar.dataset.value;
      const pct = ((v / total) * 100).toLocaleString("vi-VN", { maximumFractionDigits: 1 });
      tip.innerHTML = "<b>" + bar.dataset.label + "</b>: " + v + " loài, chiếm " + pct + "% trong tổng " + total;
      const chartRect = chart.getBoundingClientRect();
      const fillRect = $(".bar__fill", bar).getBoundingClientRect();
      tip.style.left = fillRect.left - chartRect.left + Math.max(fillRect.width, 60) / 2 + "px";
      tip.style.top = fillRect.top - chartRect.top + "px";
      tip.classList.add("is-on");
    }
    const hideTip = () => tip.classList.remove("is-on");
    bars.forEach((bar) => {
      bar.setAttribute("aria-label", bar.dataset.label + ": " + bar.dataset.value + " loài");
      bar.addEventListener("mouseenter", () => showTip(bar));
      bar.addEventListener("focus", () => showTip(bar));
      bar.addEventListener("mouseleave", hideTip);
      bar.addEventListener("blur", hideTip);
    });
  }
})();
