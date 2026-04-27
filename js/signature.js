// signature.js — חתימה דיגיטלית על canvas

let signatureData = null;
let isDrawing = false;
let lastX = 0, lastY = 0;

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("signCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // עיצוב
  ctx.strokeStyle = "#1b3f6a";
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = "round";
  ctx.lineJoin    = "round";

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src  = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    lastX = pos.x; lastY = pos.y;
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastX = pos.x; lastY = pos.y;
    signatureData = canvas.toDataURL("image/png");
    toggleHealthBtn();
  }

  function stopDraw() { isDrawing = false; }

  canvas.addEventListener("mousedown",  startDraw);
  canvas.addEventListener("mousemove",  draw);
  canvas.addEventListener("mouseup",    stopDraw);
  canvas.addEventListener("mouseleave", stopDraw);
  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove",  draw,      { passive: false });
  canvas.addEventListener("touchend",   stopDraw);
});

function clearSign() {
  const canvas = document.getElementById("signCanvas");
  if (!canvas) return;
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  signatureData = null;
  toggleHealthBtn();
}

function toggleHealthBtn() {
  const agreed = document.getElementById("healthAgree")?.checked;
  const btn    = document.getElementById("healthNextBtn");
  if (btn) btn.disabled = !(agreed && signatureData);
}
