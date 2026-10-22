// Faint animated dot grid background (wrapped so its names don't clash with page scripts)
(() => {
  const canvas = document.getElementById("grid");
  const ctx = canvas.getContext("2d");
  let width, height;
  const spacing = 34;
  // People who turn on "reduce motion" get a still grid (WCAG 2.3.3)
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Dot color comes from the --dot-rgb CSS variable, so it follows the theme
  let dotRgb;
  function readColor() {
    dotRgb = getComputedStyle(document.documentElement).getPropertyValue("--dot-rgb").trim() || "201, 151, 0";
  }
  readColor();
  document.addEventListener("theme-change", () => {
    readColor();
    if (reduceMotion) draw();
  });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) draw();
  });
  resize();

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing;
        const y = j * spacing;
        const wave = Math.sin((i + j) * 0.4 + t) * 0.5 + 0.5;
        const alpha = 0.03 + wave * 0.05;
        ctx.fillStyle = `rgba(${dotRgb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (reduceMotion) return;
    t += 0.006;
    requestAnimationFrame(draw);
  }
  draw();
})();
