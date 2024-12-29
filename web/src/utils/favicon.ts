export function initFavicon() {
  const faviconCanvas = document.createElement("canvas");

  faviconCanvas.width = 32 * devicePixelRatio;
  faviconCanvas.height = 32 * devicePixelRatio;

  const ctx = faviconCanvas.getContext("2d");
  const centerX = faviconCanvas.width / (2 * devicePixelRatio);
  const centerY = faviconCanvas.height / (2 * devicePixelRatio);

  const radius = 14;

  if (ctx) {
    ctx.scale(devicePixelRatio, devicePixelRatio);
    faviconCanvas.style.width = `${window.innerWidth}px`;
    faviconCanvas.style.height = `${window.innerHeight}px`;

    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.href = faviconCanvas.toDataURL("image/png");
  document.head.appendChild(link);
}
