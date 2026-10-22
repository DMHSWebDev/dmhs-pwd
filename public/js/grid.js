// Faint animated dot grid background (wrapped so its names don't clash with page scripts)
(() => {
  const canvas = document.getElementById("grid");
  const ctx = canvas.getContext("2d");
  let width, height;
  const spacing = 34;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
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
        ctx.fillStyle = `rgba(201, 151, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    t += 0.006;
    requestAnimationFrame(draw);
  }
  draw();
})();
