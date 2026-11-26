
const panels = Array.from(document.querySelectorAll(".panel"));
const n = panels.length;
const texts = panels.map((p) => Array.from(p.querySelectorAll(".text")));

/* ---- Settings (milliseconds) ---- */
const TEXT_TO_NEXT = 900;
const TEXT_TO_PIC = 800;
const DELAY = 40;
const TEXT_TIME = 3500;
const PIC_TIME = 2200;
const COOLDOWN = 250;
const MIN_WHEEL = 1;
const WHEEL_GAP = 120;
const MIN_SWIPE = 15;

/* Navigation settings */
const NAV_HIDE_DELAY = 2800;
const NAV_TRIGGER_HEIGHT = 24;
/* -------------------------------- */

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

/* ---- Navigation ---- */
const topNav = document.getElementById("topNav");
const navTrigger = document.getElementById("navTrigger");

let navTimer;

function showNav() {
  topNav.classList.add("visible");

  clearTimeout(navTimer);

  navTimer = setTimeout(() => {
    topNav.classList.remove("visible");
  }, NAV_HIDE_DELAY);
}

function hideNav() {
  clearTimeout(navTimer);
  topNav.classList.remove("visible");
}

// Show the navigation when the mouse enters the top edge.
navTrigger.addEventListener("pointerenter", showNav);

// Also show it when the mouse moves into the top area.
window.addEventListener("pointermove", (e) => {
  if (e.clientY <= NAV_TRIGGER_HEIGHT) {
    showNav();
  }
});

// Keep it visible while the mouse is over the navigation.
topNav.addEventListener("pointerenter", showNav);

// Restart the inactivity timer when leaving the navigation.
topNav.addEventListener("pointerleave", showNav);

// Mobile: tapping the top edge reveals the navigation.
navTrigger.addEventListener("touchstart", showNav, { passive: true });

/* ---- Progress dots ---- */
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

const hint = document.getElementById("hint");

/* ---- State ---- */
let p = 0;
let t = 0;
let busy = false;

function updateDots() {
  dots.forEach((d, i) => {
    d.classList.toggle("active", i === offsets[p] + t);
  });
}

function isAtStart() {
  return p === 0 && t === 0;
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

  if (p === targetP && t === targetT) {
    showNav();
    return;
  }

  busy = true;
  hideNav();
  hint.classList.add("hidden");

  // Position all pictures correctly.
  panels.forEach((panel, i) => {
    if (i < targetP) {
      panel.classList.add("above");
    } else {
      panel.classList.remove("above");
    }
  });

  // Hide all text.
  texts.forEach((list) => {
    list.forEach((el) => setText(el, null));
  });

  await wait(PIC_TIME);

  // Update the current position.
  p = targetP;
  t = targetT;

  updateDots();

  // Show the selected text.
  await wait(DELAY);
  setText(texts[p][t], "show");

  await wait(TEXT_TIME);
  await wait(COOLDOWN);

  busy = false;

  if (isAtStart()) {
    showNav();
  }
}

// Handle navigation clicks.
topNav.addEventListener("click", (e) => {
  const link = e.target.closest("[data-panel][data-text]");

  if (!link) return;

  e.preventDefault();

  const targetP = Number(link.dataset.panel);
  const targetT = Number(link.dataset.text);

  jumpTo(targetP, targetT);
});

/* ---- Normal scrolling ---- */
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

    // Current text leaves.
    const cur = list[t];

    if (cur && cur.classList.contains("show")) {
      setText(cur, direction === 1 ? "up" : null);
      await wait(TEXT_TO_PIC);
    }

    // Picture moves.
    if (direction === 1) {
      panels[p].classList.add("above");
    } else {
      panels[nextP].classList.remove("above");
    }

    await wait(PIC_TIME);

    // Update picture and text position.
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

  // Navigation returns when we reach the beginning.
  if (isAtStart()) {
    showNav();
  }
}

/* ---- Mouse wheel and trackpad ---- */
let lastWheel = 0;

window.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();

    const now = performance.now();
    const isNewScroll = now - lastWheel > WHEEL_GAP;

    lastWheel = now;

    if (!isNewScroll) return;
    if (Math.abs(e.deltaY) < MIN_WHEEL) return;

    go(e.deltaY > 0 ? 1 : -1);
  },
  { passive: false }
);

/* ---- Keyboard ---- */
window.addEventListener("keydown", (e) => {
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
  (e) => e.preventDefault(),
  { passive: false }
);

window.addEventListener("touchend", (e) => {
  const diff = touchStartY - e.changedTouches[0].clientY;

  if (Math.abs(diff) < MIN_SWIPE) return;

  go(diff > 0 ? 1 : -1);
});

/* ---- Initial setup ---- */
updateDots();

setTimeout(() => {
  setText(texts[0][0], "show");
  showNav();
}, 300);
