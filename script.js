const stage = document.getElementById("stage");
const normalPage = document.getElementById("normalPage");
const brand = document.getElementById("brand");
const topNav = document.getElementById("topNav");
const navTrigger = document.getElementById("navTrigger");
const backToTopBtn = document.getElementById("backToTopBtn");

const panels = Array.from(document.querySelectorAll(".panel"));
const n = panels.length;
const texts = panels.map((p) => Array.from(p.querySelectorAll(".text")));

/* ---- Settings ---- */
const TEXT_TO_NEXT = 500;
const TEXT_TO_PIC = 400;
const DELAY = 20;
const TEXT_TIME = 1800;
const PIC_TIME = 1200;
const COOLDOWN = 120;
const NAV_HIDE_DELAY = 2800;
const NAV_TRIGGER_HEIGHT = 24;

document.documentElement.style.setProperty("--text-time", TEXT_TIME + "ms");
document.documentElement.style.setProperty("--pic-time", PIC_TIME + "ms");

panels.forEach((panel, i) => {
  panel.style.zIndex = n - i;
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function setText(el, state) {
  if (!el) return;
  el.classList.remove("show", "up");
  if (state) {
    el.classList.add(state);
  }
}

/* ---- Scroll Scale Effect (Small at bottom -> Grows to middle -> Full size above middle) ---- */
const growItems = Array.from(
  document.querySelectorAll(
    ".highlight-item, .story-block, .menu-card, .reservation-box, .maps-widget, .info-block"
  )
);

growItems.forEach((el) => el.classList.add("scroll-grow"));

function updateScrollGrow() {
  const viewHeight = window.innerHeight;
  const middleY = viewHeight * 0.5;
  const bottomY = viewHeight;

  growItems.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const itemCenter = rect.top + rect.height * 0.35;

    if (itemCenter <= middleY) {
      el.style.transform = "scale(1)";
      el.style.opacity = "1";
    } else if (itemCenter >= bottomY) {
      el.style.transform = "scale(0.84)";
      el.style.opacity = "0.55";
    } else {
      const progress = 1 - (itemCenter - middleY) / (bottomY - middleY);
      const scale = 0.84 + progress * 0.16;
      const opacity = 0.55 + progress * 0.45;
      el.style.transform = `scale(${scale.toFixed(4)})`;
      el.style.opacity = opacity.toFixed(3);
    }
  });
}

/* ---- Dynamic Opening Hours Checker ---- */
function updateOpeningStatus() {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  if (!statusDot || !statusText) return;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;

  let isOpen = false;
  if (day !== 1) {
    if (currentTime >= 690 && currentTime <= 1320) {
      isOpen = true;
    }
  }

  if (isOpen) {
    statusDot.className = "status-dot open";
    statusText.textContent = "Geöffnet • Schließt um 22:00";
    statusText.style.color = "#66bb6a";
  } else {
    statusDot.className = "status-dot closed";
    statusText.textContent =
      day === 1
        ? "Geschlossen • Öffnet Dienstag um 11:30"
        : "Geschlossen • Öffnet um 11:30";
    statusText.style.color = "var(--fire-red)";
  }
}

updateOpeningStatus();
setInterval(updateOpeningStatus, 60000);

/* ---- Navigation Hover & Visibility ---- */
let navTimer;

function showNav() {
  topNav.classList.add("visible");
  document.body.classList.add("nav-is-visible");
  clearTimeout(navTimer);
  navTimer = setTimeout(() => {
    if (!topNav.matches(":hover")) {
      topNav.classList.remove("visible");
      document.body.classList.remove("nav-is-visible");
    }
  }, NAV_HIDE_DELAY);
}

function hideNav() {
  clearTimeout(navTimer);
  topNav.classList.remove("visible");
  document.body.classList.remove("nav-is-visible");
}

navTrigger.addEventListener("pointerenter", showNav);

window.addEventListener("pointermove", (e) => {
  if (e.clientY <= NAV_TRIGGER_HEIGHT) {
    showNav();
  }
});

topNav.addEventListener("pointerenter", showNav);
topNav.addEventListener("pointerleave", () => {
  navTimer = setTimeout(() => {
    topNav.classList.remove("visible");
    document.body.classList.remove("nav-is-visible");
  }, 600);
});
navTrigger.addEventListener("touchstart", showNav, { passive: true });

/* ---- Progress dots setup ---- */
const dotsBox = document.getElementById("dots");
const offsets = [];
let total = 0;

panels.forEach((_, k) => {
  offsets.push(total);
  total += Math.max(1, texts[k].length);
});

for (let i = 0; i < total; i++) {
  dotsBox.appendChild(document.createElement("i"));
}

const dots = Array.from(dotsBox.children);

const lineThumb = document.createElement("i");
lineThumb.className = "line-thumb";
dotsBox.appendChild(lineThumb);

const hint = document.getElementById("hint");

/* ---- State ---- */
let p = 0;
let t = 0;
let busy = false;
let inNormalMode = false;

function updateDots() {
  if (inNormalMode) return;
  dots.forEach((d, i) => {
    d.style.display = "block";
    d.classList.toggle("active", i === offsets[p] + t);
  });
  lineThumb.style.display = "none";
}

function updateScrollLine() {
  if (!inNormalMode) return;
  const maxScroll = normalPage.scrollHeight - normalPage.clientHeight;
  const scrollPercent = maxScroll > 0 ? normalPage.scrollTop / maxScroll : 0;

  const travelRange = 90;
  lineThumb.style.transform = `translateY(${scrollPercent * travelRange}px)`;
}

function isAtStart() {
  return !inNormalMode && p === 0 && t === 0;
}

/* ---- Enter & Exit Normal Scroll Page ---- */
async function enterNormalPage() {
  if (busy || inNormalMode) return;
  busy = true;
  hint.classList.add("hidden");

  const cur = texts[p][t];
  if (cur && cur.classList.contains("show")) {
    setText(cur, "up");
    await wait(TEXT_TO_PIC);
  }

  normalPage.scrollTop = 0;
  creamCurrentScroll = 0;
  creamTargetScroll = 0;
  updateScrollGrow();

  stage.classList.add("above");
  brand.classList.add("dark-ui");
  dotsBox.classList.add("dark-ui");

  hideNav();

  dots.forEach((d) => (d.style.display = "none"));
  lineThumb.style.display = "block";
  dotsBox.classList.add("line-mode");

  await wait(PIC_TIME);

  inNormalMode = true;
  updateScrollLine();
  updateScrollGrow();

  await wait(COOLDOWN);
  busy = false;
}

async function exitNormalPage() {
  if (busy || !inNormalMode) return;
  busy = true;

  stage.classList.remove("above");
  brand.classList.remove("dark-ui");
  dotsBox.classList.remove("dark-ui");

  dotsBox.classList.remove("line-mode");
  lineThumb.style.display = "none";
  inNormalMode = false;
  updateDots();

  await wait(PIC_TIME);

  const cur = texts[p][t];
  if (cur) {
    await wait(DELAY);
    setText(cur, "show");
    await wait(TEXT_TIME);
  }

  await wait(COOLDOWN);
  busy = false;
}

/* ---- Direct navigation ---- */
async function jumpTo(targetP, targetT) {
  if (busy) return;

  if (
    targetP < 0 ||
    targetP >= n ||
    targetT < 0 ||
    targetT >= texts[targetP].length
  ) {
    return;
  }

  if (!inNormalMode && p === targetP && t === targetT) {
    showNav();
    return;
  }

  busy = true;
  hint.classList.add("hidden");
  hideNav();

  if (inNormalMode) {
    stage.classList.remove("above");
    brand.classList.remove("dark-ui");
    dotsBox.classList.remove("dark-ui");
    dotsBox.classList.remove("line-mode");
    lineThumb.style.display = "none";
    inNormalMode = false;
  }

  panels.forEach((panel, i) => {
    panel.classList.toggle("above", i < targetP);
  });

  texts.forEach((list) => {
    list.forEach((el) => setText(el, null));
  });

  p = targetP;
  t = targetT;
  updateDots();

  await wait(PIC_TIME);

  await wait(DELAY);
  setText(texts[p][t], "show");

  await wait(TEXT_TIME);
  await wait(COOLDOWN);

  busy = false;

  if (isAtStart()) {
    showNav();
  }
}

topNav.addEventListener("click", (e) => {
  if (e.target.id === "navNormalBtn") {
    e.preventDefault();
    if (inNormalMode) {
      normalPage.scrollTo({ top: 0, behavior: "smooth" });
      creamTargetScroll = 0;
      return;
    }
    p = n - 1;
    t = Math.max(0, texts[p].length - 1);
    panels.forEach((panel, i) => {
      panel.classList.toggle("above", i < p);
    });
    enterNormalPage();
    return;
  }

  const link = e.target.closest("[data-panel][data-text]");
  if (!link) return;

  e.preventDefault();
  jumpTo(Number(link.dataset.panel), Number(link.dataset.text));
});

if (backToTopBtn) {
  backToTopBtn.addEventListener("click", () => {
    jumpTo(0, 0);
  });
}

/* ---- Slide Navigation ---- */
async function go(direction) {
  if (busy) return;

  const list = texts[p];
  const lastText = Math.max(0, list.length - 1);

  let target;

  if (direction === 1) {
    if (t < lastText) {
      target = "text";
    } else if (p < n - 1) {
      target = "picture";
    } else {
      enterNormalPage();
      return;
    }
  } else {
    if (t > 0) {
      target = "text";
    } else if (p > 0) {
      target = "picture";
    }
  }

  if (!target) return;

  busy = true;
  hint.classList.add("hidden");

  if (direction === 1) {
    hideNav();
  }

  if (target === "text") {
    const nextT = t + direction;

    if (direction === 1) {
      setText(list[t], "up");
    } else {
      setText(list[t], null);
    }

    await wait(TEXT_TO_NEXT);

    setText(list[nextT], "show");
    t = nextT;
    updateDots();

    await wait(TEXT_TIME);
  } else {
    const nextP = p + direction;
    const nextList = texts[nextP];
    const cur = list[t];

    if (cur && cur.classList.contains("show")) {
      setText(cur, direction === 1 ? "up" : null);
      await wait(TEXT_TO_PIC);
    }

    if (direction === 1) {
      panels[p].classList.add("above");
    } else {
      panels[nextP].classList.remove("above");
    }

    await wait(PIC_TIME);

    p = nextP;
    t = direction === 1 ? 0 : Math.max(0, nextList.length - 1);
    updateDots();

    if (nextList[t]) {
      await wait(DELAY);
      setText(nextList[t], "show");
      await wait(TEXT_TIME);
    }
  }

  await wait(COOLDOWN);
  busy = false;

  if (isAtStart()) {
    showNav();
  }
}

/* ---- Inertia Smooth Scrolling for Cream Page ---- */
let creamCurrentScroll = 0;
let creamTargetScroll = 0;
let creamAnimId = null;

function runCreamScrollAnimation() {
  const diff = creamTargetScroll - creamCurrentScroll;
  if (Math.abs(diff) < 0.5) {
    creamCurrentScroll = creamTargetScroll;
    normalPage.scrollTop = creamCurrentScroll;
    updateScrollLine();
    updateScrollGrow();
    cancelAnimationFrame(creamAnimId);
    creamAnimId = null;
    return;
  }
  creamCurrentScroll += diff * 0.08;
  normalPage.scrollTop = creamCurrentScroll;
  updateScrollLine();
  updateScrollGrow();
  creamAnimId = requestAnimationFrame(runCreamScrollAnimation);
}

normalPage.addEventListener("scroll", () => {
  if (inNormalMode) {
    updateScrollLine();
    updateScrollGrow();
  }
});

window.addEventListener("resize", () => {
  if (inNormalMode) {
    updateScrollGrow();
  }
});

/* ---- Wheel Handler ---- */
let scrollAccumulator = 0;
let scrollTimeout = null;
const SCROLL_THRESHOLD = 25;

window.addEventListener(
  "wheel",
  (e) => {
    if (inNormalMode) {
      if (e.deltaY < 0 && normalPage.scrollTop <= 0) {
        e.preventDefault();
        exitNormalPage();
        return;
      }

      e.preventDefault();

      if (!creamAnimId) {
        creamCurrentScroll = normalPage.scrollTop;
        creamTargetScroll = creamCurrentScroll;
      }

      creamTargetScroll += e.deltaY * 1.1;

      const maxScroll = normalPage.scrollHeight - normalPage.clientHeight;
      creamTargetScroll = Math.max(0, Math.min(creamTargetScroll, maxScroll));

      if (!creamAnimId) {
        creamAnimId = requestAnimationFrame(runCreamScrollAnimation);
      }
      return;
    }

    e.preventDefault();

    scrollAccumulator += e.deltaY;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      scrollAccumulator = 0;
    }, 120);

    if (Math.abs(scrollAccumulator) >= SCROLL_THRESHOLD) {
      const dir = scrollAccumulator > 0 ? 1 : -1;
      scrollAccumulator = 0;
      go(dir);
    }
  },
  { passive: false }
);

/* ---- Keyboard ---- */
window.addEventListener("keydown", (e) => {
  if (inNormalMode) {
    if (["ArrowUp", "PageUp"].includes(e.key) && normalPage.scrollTop <= 0) {
      e.preventDefault();
      exitNormalPage();
    }
    return;
  }

  if (["ArrowDown", "PageDown", " "].includes(e.key)) {
    e.preventDefault();
    go(1);
  }

  if (["ArrowUp", "PageUp"].includes(e.key)) {
    e.preventDefault();
    go(-1);
  }
});

/* ---- Touch ---- */
let touchStartY = 0;

window.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
});

window.addEventListener(
  "touchmove",
  (e) => {
    if (!inNormalMode) {
      e.preventDefault();
    }
  },
  { passive: false }
);

window.addEventListener("touchend", (e) => {
  const diff = touchStartY - e.changedTouches[0].clientY;

  if (inNormalMode) {
    if (diff < -15 && normalPage.scrollTop <= 0) {
      exitNormalPage();
    }
    return;
  }

  if (Math.abs(diff) < 15) return;
  go(diff > 0 ? 1 : -1);
});

/* ---- Initial setup ---- */
updateDots();
updateScrollGrow();

setTimeout(() => {
  setText(texts[0][0], "show");
  showNav();
}, 300);
