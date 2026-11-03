"use strict";

/* =========================================================
   TODO — script.js
   - Tâches : { id, text, completed, color }
   - Sauvegarde dans localStorage (clé "tasks", compatible
     avec l'ancienne version { text, completed })
   ========================================================= */

// ---------- Couleurs disponibles pour les notes ----------
const COLORS = [
  { id: "lavande",   name: "Lavande",   hex: "#8b5cf6" },
  { id: "ciel",      name: "Ciel",      hex: "#3b82f6" },
  { id: "turquoise", name: "Turquoise", hex: "#06b6d4" },
  { id: "menthe",    name: "Menthe",    hex: "#10b981" },
  { id: "soleil",    name: "Soleil",    hex: "#f59e0b" },
  { id: "corail",    name: "Corail",    hex: "#f97316" },
  { id: "framboise", name: "Framboise", hex: "#f43f5e" },
  { id: "rose",      name: "Rose",      hex: "#ec4899" },
];
const colorById = (id) => COLORS.find((c) => c.id === id) || COLORS[0];

// ---------- Stockage sécurisé (ne plante pas si bloqué) ----------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// ---------- État ----------
let tasks = loadTasks();
let filter = "all";
let newColor = store.get("defaultColor", "lavande");
let justAdded = null;
let lastDeleted = null;

// ---------- Éléments ----------
const root = document.documentElement;
const list = document.getElementById("taskList");
const form = document.getElementById("newTask");
const input = document.getElementById("taskInput");
const newColorBtn = document.getElementById("newColorBtn");
const preview = form.querySelector(".preview");
const nbItem = document.getElementById("nbItem");
const clearBtn = document.getElementById("clear");
const emptyBox = document.getElementById("empty");
const emptyText = document.getElementById("emptyText");
const themeBtn = document.getElementById("themeBtn");
const palette = document.getElementById("palette");
const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
const toastAction = document.getElementById("toastAction");
const hero = document.getElementById("hero");

// ---------- Icônes ----------
const ICON_GRIP = '<svg viewBox="0 0 10 16" aria-hidden="true"><g fill="currentColor"><circle cx="2" cy="2" r="1.6"/><circle cx="8" cy="2" r="1.6"/><circle cx="2" cy="8" r="1.6"/><circle cx="8" cy="8" r="1.6"/><circle cx="2" cy="14" r="1.6"/><circle cx="8" cy="14" r="1.6"/></g></svg>';
const ICON_CROSS = '<svg viewBox="0 0 18 18" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M16.97 0l.708.707L9.546 8.84l8.132 8.132-.707.707-8.132-8.132-8.132 8.132L0 16.97l8.132-8.132L0 .707.707 0 8.84 8.132 16.971 0z"/></svg>';

/* =========================================================
   CHARGEMENT / SAUVEGARDE
   ========================================================= */
function loadTasks() {
  const raw = store.get("tasks", null);
  if (!Array.isArray(raw)) return demoTasks();
  return raw
    .filter((t) => t && typeof t.text === "string")
    .map((t, i) => ({
      id: t.id || uid(),
      text: t.text,
      completed: !!t.completed,
      color: COLORS.some((c) => c.id === t.color) ? t.color : COLORS[i % COLORS.length].id,
    }));
}

function demoTasks() {
  return [
    ["Terminer le challenge Frontend Mentor", true, "lavande"],
    ["Courir 3 km dans le parc", false, "menthe"],
    ["Méditer 10 minutes", false, "turquoise"],
    ["Lire un chapitre de mon livre", false, "soleil"],
    ["Faire les courses", false, "framboise"],
    ["Préparer la réunion de demain", false, "ciel"],
  ].map(([text, completed, color]) => ({ id: uid(), text, completed, color }));
}

function save() { store.set("tasks", tasks); }

/* =========================================================
   AFFICHAGE
   ========================================================= */
function matchesFilter(task) {
  if (filter === "active") return !task.completed;
  if (filter === "completed") return task.completed;
  return true;
}

function render() {
  const visible = tasks.filter(matchesFilter);
  list.replaceChildren(...visible.map(createItem));
  justAdded = null;

  emptyBox.hidden = visible.length > 0;
  emptyText.textContent =
    filter === "completed" ? "Aucune tâche terminée… encore un petit effort !" :
    filter === "active" && tasks.length ? "Tout est fait. Bravo, profite !" :
    "Rien à faire… pour l'instant !";

  document.querySelectorAll(".filters button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.filter === filter))
  );
  updateStats();
}

// Crée un <li> (sans innerHTML pour le texte => pas d'injection HTML)
function createItem(task) {
  const c = colorById(task.color);
  const li = document.createElement("li");
  li.className = "task" + (task.completed ? " completed" : "") + (task.id === justAdded ? " enter" : "");
  li.dataset.id = task.id;
  li.style.setProperty("--c", c.hex);

  const grip = document.createElement("button");
  grip.type = "button";
  grip.className = "grip";
  grip.innerHTML = ICON_GRIP;
  grip.setAttribute("aria-label", "Déplacer (flèches haut/bas)");

  const check = document.createElement("button");
  check.type = "button";
  check.className = "check";
  check.setAttribute("role", "checkbox");
  check.setAttribute("aria-checked", String(task.completed));
  check.setAttribute("aria-label", "Marquer comme terminée");

  const text = document.createElement("p");
  text.className = "text";
  const span = document.createElement("span");
  span.textContent = task.text;
  text.append(span);

  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "dot";
  dot.setAttribute("aria-label", "Couleur : " + c.name);

  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete";
  del.innerHTML = ICON_CROSS;
  del.setAttribute("aria-label", "Supprimer");

  li.append(grip, check, text, dot, del);
  return li;
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const left = total - done;
  const pct = total ? Math.round((done / total) * 100) : 0;

  nbItem.textContent =
    total && !left ? "Tout est terminé !" :
    `${left} tâche${left > 1 ? "s" : ""} restante${left > 1 ? "s" : ""}`;

  clearBtn.disabled = done === 0;

  const circumference = 2 * Math.PI * 19;
  document.getElementById("ringValue").style.strokeDashoffset = circumference * (1 - pct / 100);
  document.getElementById("ringText").textContent = pct + "%";
  document.getElementById("ring").setAttribute("aria-label", `${done} sur ${total} tâches terminées`);
}

/* =========================================================
   ACTIONS
   ========================================================= */
function addTask(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) {
    form.classList.remove("shake");
    void form.offsetWidth; // relance l'animation
    form.classList.add("shake");
    return;
  }
  const task = { id: uid(), text, completed: false, color: newColor };
  tasks.push(task);
  justAdded = task.id;
  input.value = "";
  form.classList.remove("has-text");
  if (filter === "completed") filter = "all";
  save();
  render();
}

function toggleTask(li) {
  const task = tasks.find((t) => t.id === li.dataset.id);
  if (!task) return;
  task.completed = !task.completed;
  save();

  li.classList.toggle("completed", task.completed);
  li.querySelector(".check").setAttribute("aria-checked", String(task.completed));
  updateStats();

  if (task.completed) {
    const r = li.querySelector(".check").getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, colorById(task.color).hex, 16);
    if (tasks.every((t) => t.completed)) celebrate();
  }

  // Si le filtre masque maintenant la tâche, on la fait sortir en douceur
  if (!matchesFilter(task)) leave(li, render);
}

function deleteTask(li) {
  const index = tasks.findIndex((t) => t.id === li.dataset.id);
  if (index < 0) return;
  leave(li, () => {
    lastDeleted = { task: tasks[index], index };
    tasks.splice(index, 1);
    save();
    render();
    showToast("Tâche supprimée", "Annuler", undoDelete);
  });
}

function undoDelete() {
  if (!lastDeleted) return;
  tasks.splice(Math.min(lastDeleted.index, tasks.length), 0, lastDeleted.task);
  justAdded = lastDeleted.task.id;
  lastDeleted = null;
  save();
  render();
}

function clearCompleted() {
  const done = tasks.filter((t) => t.completed);
  if (!done.length) return;
  const items = [...list.querySelectorAll(".task.completed")];
  const finish = () => {
    const before = tasks.slice();
    tasks = tasks.filter((t) => !t.completed);
    save();
    render();
    showToast(`${done.length} tâche${done.length > 1 ? "s" : ""} effacée${done.length > 1 ? "s" : ""}`, "Annuler", () => {
      tasks = before;
      save();
      render();
    });
  };
  if (!items.length || reducedMotion.matches) return finish();
  items.forEach((li, i) => (li.style.animationDelay = i * 40 + "ms", li.classList.add("leave")));
  setTimeout(finish, 320 + items.length * 40);
}

function setColor(id, colorId) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.color = colorId;
  save();
  const li = list.querySelector(`[data-id="${id}"]`);
  if (li) {
    const c = colorById(colorId);
    li.style.setProperty("--c", c.hex);
    li.querySelector(".dot").setAttribute("aria-label", "Couleur : " + c.name);
  }
}

// Animation de sortie puis callback
function leave(li, done) {
  if (reducedMotion.matches) return done();
  li.classList.add("leave");
  li.addEventListener("animationend", done, { once: true });
}

/* ---------- Édition (double-clic) ---------- */
function startEdit(li) {
  const task = tasks.find((t) => t.id === li.dataset.id);
  const textEl = li.querySelector(".text");
  if (!task || !textEl) return;

  const field = document.createElement("input");
  field.className = "edit";
  field.value = task.text;
  field.maxLength = 140;
  field.setAttribute("aria-label", "Modifier la tâche");
  textEl.replaceWith(field);
  field.focus();
  field.select();

  let finished = false;
  const finish = (commit) => {
    if (finished) return;
    finished = true;
    const value = field.value.trim();
    if (commit && !value) return deleteTask(li);
    if (commit) { task.text = value; save(); }
    render();
  };
  field.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  field.addEventListener("blur", () => finish(true));
}

/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */
form.addEventListener("submit", addTask);
input.addEventListener("input", () => form.classList.toggle("has-text", input.value.trim() !== ""));

// Délégation : un seul écouteur pour toute la liste
list.addEventListener("click", (e) => {
  const li = e.target.closest(".task");
  if (!li) return;
  if (e.target.closest(".check")) toggleTask(li);
  else if (e.target.closest(".delete")) deleteTask(li);
  else if (e.target.closest(".dot")) {
    const task = tasks.find((t) => t.id === li.dataset.id);
    openPalette(e.target.closest(".dot"), task.color, (colorId) => setColor(task.id, colorId));
  }
});
list.addEventListener("dblclick", (e) => {
  const li = e.target.closest(".task");
  if (li && e.target.closest(".text")) startEdit(li);
});

document.querySelectorAll(".filters button").forEach((btn) =>
  btn.addEventListener("click", () => { filter = btn.dataset.filter; render(); })
);
clearBtn.addEventListener("click", clearCompleted);

// Raccourci clavier « / » pour écrire
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.target.closest("input, textarea")) {
    e.preventDefault();
    input.focus();
  }
});

/* =========================================================
   COULEUR DE LA NOUVELLE NOTE + PALETTE
   ========================================================= */
function applyNewColor() {
  const c = colorById(newColor);
  newColorBtn.style.setProperty("--c", c.hex);
  preview.style.setProperty("--c", c.hex);
  newColorBtn.setAttribute("aria-label", "Couleur de la note : " + c.name);
}
newColorBtn.addEventListener("click", () =>
  openPalette(newColorBtn, newColor, (colorId) => {
    newColor = colorId;
    store.set("defaultColor", colorId);
    applyNewColor();
    input.focus();
  })
);

let paletteAnchor = null;

function openPalette(anchor, current, onPick) {
  if (paletteAnchor === anchor && !palette.hidden) return closePalette();
  paletteAnchor = anchor;

  palette.replaceChildren();
  const title = document.createElement("p");
  title.className = "palette-title";
  title.textContent = "Couleur";
  palette.append(title);

  COLORS.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.style.setProperty("--c", c.hex);
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(c.id === current));
    b.setAttribute("aria-label", c.name);
    b.title = c.name;
    b.addEventListener("click", () => { onPick(c.id); closePalette(); });
    palette.append(b);
  });

  palette.hidden = false;
  const r = anchor.getBoundingClientRect();
  const w = palette.offsetWidth;
  const h = palette.offsetHeight;
  let left = Math.min(r.right - w + 8, window.innerWidth - w - 12);
  left = Math.max(12, left);
  let top = r.bottom + 10;
  if (top + h > window.innerHeight - 12) top = r.top - h - 10;
  palette.style.left = left + "px";
  palette.style.top = top + "px";
  palette.querySelector('[aria-checked="true"]')?.focus();
}

function closePalette() {
  palette.hidden = true;
  paletteAnchor = null;
}
document.addEventListener("pointerdown", (e) => {
  if (!palette.hidden && !palette.contains(e.target) && !e.target.closest(".dot, .swatch-btn")) closePalette();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePalette(); });
window.addEventListener("resize", closePalette);
window.addEventListener("scroll", closePalette, { passive: true });

/* =========================================================
   THÈME JOUR / NUIT
   ========================================================= */
function applyTheme(theme) {
  root.dataset.theme = theme;
  themeBtn.setAttribute("aria-label", theme === "dark" ? "Activer le mode jour" : "Activer le mode nuit");
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#060a22" : "#6d7cff";
}

themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  store.set("theme", next);

  // Révélation circulaire depuis le bouton (si le navigateur le permet)
  if (!document.startViewTransition || reducedMotion.matches) return applyTheme(next);

  const r = themeBtn.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  const transition = document.startViewTransition(() => applyTheme(next));
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(.4, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
});

// Suit le thème du système tant que l'utilisateur n'a pas choisi
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  if (store.get("theme", null) === null) applyTheme(e.matches ? "dark" : "light");
});

/* =========================================================
   EN-TÊTE : étoiles, salutation, parallaxe
   ========================================================= */
function makeStars() {
  const g = document.getElementById("stars");
  const ns = "http://www.w3.org/2000/svg";
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // aléatoire stable
  for (let i = 0; i < 90; i++) {
    const s = document.createElementNS(ns, "circle");
    s.setAttribute("class", "star");
    s.setAttribute("cx", (rand() * 1440).toFixed(1));
    s.setAttribute("cy", (rand() * 250).toFixed(1));
    s.setAttribute("r", (0.5 + rand() * 1.4).toFixed(2));
    s.style.animationDelay = (rand() * 3).toFixed(2) + "s";
    s.style.animationDuration = (2 + rand() * 3).toFixed(2) + "s";
    g.append(s);
  }
}

function greet() {
  const h = new Date().getHours();
  const hello = h < 5 ? "Bonne nuit" : h < 18 ? "Bonjour" : "Bonsoir";
  const date = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  document.getElementById("greeting").textContent = `${hello} · ${date}`;
}

if (window.matchMedia("(pointer: fine)").matches && !reducedMotion.matches) {
  let frame = 0;
  window.addEventListener("pointermove", (e) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      hero.style.setProperty("--px", ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
      hero.style.setProperty("--py", ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
    });
  });
}

/* =========================================================
   GLISSER-DÉPOSER (souris + tactile) et clavier
   ========================================================= */
list.addEventListener("pointerdown", (e) => {
  const grip = e.target.closest(".grip");
  if (!grip || e.button > 0) return;
  e.preventDefault();

  const li = grip.closest(".task");
  const listTop = () => list.getBoundingClientRect().top;
  const grabOffset = e.clientY - listTop() - li.offsetTop;
  let ty = 0;

  grip.setPointerCapture(e.pointerId);
  li.classList.add("dragging");
  list.classList.add("sorting");
  closePalette();

  const onMove = (ev) => {
    const y = ev.clientY - listTop();
    const siblings = [...list.children].filter((x) => x !== li);
    const before = siblings.find((s) => y < s.offsetTop + s.offsetHeight / 2) || null;

    if (before !== li.nextElementSibling) {
      // Animation FLIP des autres éléments
      const first = new Map(siblings.map((s) => [s, s.offsetTop]));
      list.insertBefore(li, before);
      siblings.forEach((s) => {
        const dy = first.get(s) - s.offsetTop;
        if (dy) s.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 220, easing: "ease-out" });
      });
    }
    ty = y - grabOffset - li.offsetTop;
    li.style.transform = `translateY(${ty}px)`;
  };

  const onUp = () => {
    grip.removeEventListener("pointermove", onMove);
    grip.removeEventListener("pointerup", onUp);
    grip.removeEventListener("pointercancel", onUp);
    li.style.transform = "";
    li.animate([{ transform: `translateY(${ty}px)` }, { transform: "none" }], { duration: 180, easing: "ease-out" });
    li.classList.remove("dragging");
    list.classList.remove("sorting");
    commitOrder();
  };

  grip.addEventListener("pointermove", onMove);
  grip.addEventListener("pointerup", onUp);
  grip.addEventListener("pointercancel", onUp);
});

// Réordonner au clavier : focus sur la poignée + flèches
list.addEventListener("keydown", (e) => {
  const grip = e.target.closest(".grip");
  if (!grip || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
  e.preventDefault();
  const li = grip.closest(".task");
  const target = e.key === "ArrowUp" ? li.previousElementSibling : li.nextElementSibling;
  if (!target) return;
  list.insertBefore(li, e.key === "ArrowUp" ? target : target.nextElementSibling);
  grip.focus();
  commitOrder();
});

// Reporte l'ordre visible dans le tableau (fonctionne aussi avec un filtre actif)
function commitOrder() {
  const visibleIds = [...list.children].map((li) => li.dataset.id);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const slots = [];
  tasks.forEach((t, i) => { if (visibleIds.includes(t.id)) slots.push(i); });
  const next = tasks.slice();
  slots.forEach((slot, k) => (next[slot] = byId.get(visibleIds[k])));
  tasks = next;
  save();
}

/* =========================================================
   TOAST + CONFETTIS
   ========================================================= */
let toastTimer = 0;
function showToast(message, actionLabel, action) {
  toastText.textContent = message;
  toastAction.textContent = actionLabel || "";
  toastAction.onclick = () => { hideToast(); action && action(); };
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 5000);
}
function hideToast() { toast.classList.remove("show"); }

function burst(x, y, color, count, power = 1) {
  if (reducedMotion.matches) return;
  const colors = [color, "#55ddff", "#c058f3", "#ffd166"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "confetti";
    p.style.left = x - 4 + "px";
    p.style.top = y - 4 + "px";
    p.style.background = colors[i % colors.length];
    if (i % 3 === 0) p.style.borderRadius = "50%";
    document.body.append(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = (40 + Math.random() * 60) * power;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const rot = Math.random() * 720 - 360;
    p.animate(
      [
        { transform: "translate(0,0) rotate(0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${dx * 1.1}px, ${dy + 50 * power}px) rotate(${rot}deg) scale(.6)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 500, easing: "cubic-bezier(.2,.8,.3,1)" }
    ).onfinish = () => p.remove();
  }
}

function celebrate() {
  const r = document.getElementById("ring").getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, "#ffffff", 46, 2.4);
  showToast("Toutes les tâches sont terminées. Bravo !");
}

/* =========================================================
   DÉMARRAGE
   ========================================================= */
applyTheme(root.dataset.theme === "dark" ? "dark" : "light");
applyNewColor();
makeStars();
greet();
save();
render();
