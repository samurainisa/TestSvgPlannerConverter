const fileInput = document.getElementById("fileInput");
const dropzone = document.getElementById("dropzone");
const rasterPreview = document.getElementById("rasterPreview");
const fileMeta = document.getElementById("fileMeta");
const statusEl = document.getElementById("status");
const svgMeta = document.getElementById("svgMeta");
const svgOutput = document.getElementById("svgOutput");
const vectorStage = document.getElementById("vectorStage");

const turnPolicy = document.getElementById("turnPolicy");
const turdSize = document.getElementById("turdSize");
const turdSizeVal = document.getElementById("turdSizeVal");
const optCurve = document.getElementById("optCurve");
const alphaMax = document.getElementById("alphaMax");
const alphaMaxVal = document.getElementById("alphaMaxVal");
const optTolerance = document.getElementById("optTolerance");
const optToleranceVal = document.getElementById("optToleranceVal");

const scale = document.getElementById("scale");
const scaleVal = document.getElementById("scaleVal");
const modeButtons = document.querySelectorAll(".mode-btn");
const downloadBtn = document.getElementById("downloadSvg");
const copyBtn = document.getElementById("copySvg");

let currentFile = null;
let currentSvg = "";
let currentMode = "fill";
let processTimer = null;
let processing = false;
let pendingProcess = false;

function setStatus(text) {
  statusEl.textContent = text;
}

function setSvgMeta(text) {
  svgMeta.textContent = text;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function updateValueDisplays() {
  turdSizeVal.textContent = turdSize.value;
  alphaMaxVal.textContent = Number(alphaMax.value).toFixed(2);
  optToleranceVal.textContent = Number(optTolerance.value).toFixed(2);
  scaleVal.textContent = `${Number(scale.value).toFixed(1)}×`;
}

function scheduleProcess() {
  if (!currentFile) return;
  if (processing) {
    pendingProcess = true;
    return;
  }
  if (processTimer) {
    clearTimeout(processTimer);
  }
  processTimer = setTimeout(runPotrace, 180);
}

function runPotrace() {
  if (!currentFile || processing) return;
  processing = true;
  pendingProcess = false;
  setStatus("Векторизуем...");
  setSvgMeta("Обновляется");

  Potrace.setParameter({
    turnpolicy: turnPolicy.value,
    turdsize: Number(turdSize.value),
    optcurve: optCurve.checked,
    alphamax: Number(alphaMax.value),
    opttolerance: Number(optTolerance.value),
  });

  Potrace.process(() => {
    const svg = Potrace.getSVG(Number(scale.value), currentMode === "curve" ? "curve" : undefined);
    renderSvg(svg);
    processing = false;
    setStatus("Готов");
    if (pendingProcess) {
      scheduleProcess();
    }
  });
}

function normalizeSvg(svg) {
  if (!svg) return svg;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "image/svg+xml");
    const svgEl = doc.documentElement;
    if (!svgEl.getAttribute("viewBox")) {
      const w = parseFloat(svgEl.getAttribute("width"));
      const h = parseFloat(svgEl.getAttribute("height"));
      if (Number.isFinite(w) && Number.isFinite(h)) {
        svgEl.setAttribute("viewBox", `0 0 ${w} ${h}`);
      }
    }
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
    return svgEl.outerHTML;
  } catch (err) {
    return svg;
  }
}

function renderSvg(svg) {
  currentSvg = svg || "";
  const previewSvg = normalizeSvg(currentSvg);
  vectorStage.innerHTML = previewSvg ? previewSvg : '<div class="empty">SVG появится здесь</div>';
  vectorStage.classList.toggle("is-empty", !previewSvg);
  svgOutput.value = currentSvg;
  applyModeClass();
  if (previewSvg) {
    setSvgMeta(`SVG ${currentSvg.length} символов`);
  } else {
    setSvgMeta("SVG пока пуст");
  }
}

function applyModeClass() {
  vectorStage.classList.remove("mode-fill", "mode-curve");
  vectorStage.classList.add(`mode-${currentMode}`);
}

function handleFile(file) {
  if (!file) return;
  currentFile = file;
  const previewUrl = URL.createObjectURL(file);
  rasterPreview.src = previewUrl;
  fileMeta.textContent = `${file.name} · ${formatBytes(file.size)}`;
  Potrace.loadImageFromFile(file);
  setStatus("Загружаем изображение...");
  scheduleProcess();
}

function downloadSvg() {
  if (!currentSvg) return;
  const blob = new Blob([currentSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = currentFile ? `${currentFile.name.split(".")[0]}.svg` : "potrace.svg";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copySvg() {
  if (!currentSvg) return;
  try {
    await navigator.clipboard.writeText(currentSvg);
    setStatus("SVG скопирован");
    setTimeout(() => setStatus("Готов"), 1200);
  } catch (err) {
    setStatus("Не удалось скопировать");
  }
}

fileInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  handleFile(file);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("drag");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("drag");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("drag");
  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  handleFile(file);
});

[turnPolicy, turdSize, optCurve, alphaMax, optTolerance].forEach((input) => {
  input.addEventListener("input", () => {
    updateValueDisplays();
    scheduleProcess();
  });
});

scale.addEventListener("input", () => {
  updateValueDisplays();
  scheduleProcess();
});

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    applyModeClass();
    scheduleProcess();
  });
});

downloadBtn.addEventListener("click", downloadSvg);
copyBtn.addEventListener("click", copySvg);

updateValueDisplays();
vectorStage.classList.add("is-empty");
applyModeClass();
renderSvg("");
