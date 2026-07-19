
const $ = (id) => document.getElementById(id);
const state = {
  name: "",
  bays: 6,
  levels: 5,
  mountType: "facade",
  hasAccess: false,
  hasConsole: false,
  materials: []
};

const materialDefinitions = [
  ["Socles à vis", s => 2 * (s.bays + 1), "Deux files de montants"],
  ["Cadres R200 Progress acier", s => (s.bays + 1) * s.levels, "Cadres principaux de niveau"],
  ["Planchers alu/bois 3,00 m", s => s.bays * s.levels, "Hypothèse : 1 plancher principal par travée et niveau"],
  ["Longerons / lisses longitudinales", s => s.bays * (s.levels + 1) * 2, "Deux côtés, estimation de préparation"],
  ["Garde-corps classiques", s => s.bays * Math.max(1, s.levels), "Protection périphérique estimative"],
  ["Plinthes longitudinales 3,00 m", s => s.bays * Math.max(1, s.levels), "Une par travée au niveau de travail"],
  ["Plinthes d’extrémité", s => 2 * Math.max(1, s.levels), "Deux extrémités"],
  ["Diagonales", s => Math.ceil(s.bays / 3) * s.levels, "Une diagonale tous les 3 modules"],
  ["Amarrages", s => Math.ceil((s.bays * s.levels) / 6), "Valeur indicative à vérifier par étude"],
  ["Éléments d’accès", s => s.hasAccess ? s.levels : 0, "Échelle ou accès selon configuration"],
  ["Consoles", s => s.hasConsole ? s.bays * 2 : 0, "Estimation, à valider selon largeur et implantation"],
  ["Éléments retour d’angle", s => s.mountType === "angle" ? s.levels * 2 : 0, "Quantité indicative"]
];

function readForm() {
  state.name = $("name").value.trim() || "Chantier sans nom";
  state.bays = Math.max(1, Number($("bays").value || 1));
  state.levels = Math.max(1, Number($("levels").value || 1));
  state.mountType = $("mountType").value;
  state.hasAccess = $("hasAccess").checked;
  state.hasConsole = $("hasConsole").checked;
  state.materials = materialDefinitions
    .map(([name, calc, note]) => ({ name, qty: calc(state), note }))
    .filter(item => item.qty > 0);
}

function updateSummary() {
  const bays = Math.max(1, Number($("bays").value || 1));
  const levels = Math.max(1, Number($("levels").value || 1));
  const length = bays * 3;
  const height = levels * 2;
  $("lengthSummary").textContent = `${length} m`;
  $("heightSummary").textContent = `${height} m`;
  $("surfaceSummary").textContent = `${length * height} m²`;
}

function renderMaterials() {
  const list = $("materialList");
  list.innerHTML = "";
  $("materialTitle").textContent = `${state.name} — ${state.bays * 3} m × ${state.levels * 2} m`;
  const template = $("materialRowTemplate");
  state.materials.forEach(item => {
    const node = template.content.cloneNode(true);
    node.querySelector(".material-name").textContent = item.name;
    node.querySelector(".material-note").textContent = item.note;
    node.querySelector(".qty").textContent = item.qty;
    list.appendChild(node);
  });
}

function drawPlan() {
  const canvas = $("planCanvas");
  const ctx = canvas.getContext("2d");
  const padding = 70;
  const w = canvas.width - padding * 2;
  const h = canvas.height - padding * 2;
  const bayW = w / state.bays;
  const levelH = h / state.levels;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#1e293b";
  ctx.lineCap = "round";

  for (let i = 0; i <= state.bays; i++) {
    const x = padding + i * bayW;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, padding + h);
    ctx.stroke();
  }
  for (let j = 0; j <= state.levels; j++) {
    const y = padding + j * levelH;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 5;
  for (let i = 0; i < state.bays; i += 3) {
    for (let j = 0; j < state.levels; j++) {
      const x1 = padding + i * bayW;
      const x2 = padding + Math.min(i + 1, state.bays) * bayW;
      const y1 = padding + (j + 1) * levelH;
      const y2 = padding + j * levelH;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#111827";
  ctx.font = "700 28px system-ui";
  ctx.fillText(`${state.bays * 3} m`, canvas.width / 2 - 35, canvas.height - 20);
  ctx.save();
  ctx.translate(25, canvas.height / 2 + 35);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${state.levels * 2} m`, 0, 0);
  ctx.restore();

  $("planDimensions").textContent = `${state.bays} travées • ${state.levels} niveaux`;
}

function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
  document.querySelectorAll(".panel").forEach(panel => panel.classList.toggle("active", panel.id === tabId));
}

function calculate() {
  readForm();
  renderMaterials();
  drawPlan();
}

document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

document.querySelectorAll("[data-step]").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.step);
    const delta = Number(btn.dataset.delta);
    input.value = Math.max(Number(input.min || 1), Number(input.value || 1) + delta);
    updateSummary();
  });
});

["bays", "levels"].forEach(id => $(id).addEventListener("input", updateSummary));

$("projectForm").addEventListener("submit", (e) => {
  e.preventDefault();
  calculate();
  switchTab("materials");
});

$("printBtn").addEventListener("click", () => {
  calculate();
  window.print();
});

function getSaved() {
  try { return JSON.parse(localStorage.getItem("scaffr200-projects") || "[]"); }
  catch { return []; }
}
function setSaved(items) {
  localStorage.setItem("scaffr200-projects", JSON.stringify(items));
}
function renderSaved() {
  const container = $("savedList");
  const items = getSaved();
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = '<div class="empty">Aucun chantier sauvegardé.</div>';
    return;
  }
  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "saved-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${item.bays} travées • ${item.levels} niveaux • ${new Date(item.savedAt).toLocaleDateString("fr-FR")}</small>
      </div>
      <div class="actions">
        <button class="icon-btn" data-load="${index}">Ouvrir</button>
        <button class="icon-btn danger" data-delete="${index}">Supprimer</button>
      </div>`;
    container.appendChild(row);
  });
}
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

$("saveBtn").addEventListener("click", () => {
  calculate();
  const items = getSaved();
  items.unshift({ ...state, savedAt: new Date().toISOString() });
  setSaved(items.slice(0, 50));
  renderSaved();
});

$("savedList").addEventListener("click", (e) => {
  const items = getSaved();
  const load = e.target.dataset.load;
  const del = e.target.dataset.delete;
  if (load !== undefined) {
    const item = items[Number(load)];
    $("name").value = item.name;
    $("bays").value = item.bays;
    $("levels").value = item.levels;
    $("mountType").value = item.mountType;
    $("hasAccess").checked = item.hasAccess;
    $("hasConsole").checked = item.hasConsole;
    updateSummary();
    calculate();
    switchTab("project");
  }
  if (del !== undefined) {
    items.splice(Number(del), 1);
    setSaved(items);
    renderSaved();
  }
});

let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $("installBtn").hidden = false;
});
$("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("installBtn").hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

updateSummary();
calculate();
renderSaved();
