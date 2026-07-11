const imageInput = document.getElementById('imageInput');
const phraseInput = document.getElementById('phraseInput');
const textColor = document.getElementById('textColor');
const textSize = document.getElementById('textSize');
const renderBtn = document.getElementById('renderBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const baseImage = new Image();
let imageLoaded = false;
let currentImageUrl = null;

const state = {
  textX: canvas.width / 2,
  textY: canvas.height * 0.82,
  dragging: false,
  offsetX: 0,
  offsetY: 0,
};

function drawPlaceholder() {
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#111827');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Sube una imagen', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '28px Arial';
  ctx.fillText('y escribe una frase', canvas.width / 2, canvas.height / 2 + 30);
}

function fitImageCover(img, targetWidth, targetHeight) {
  const imageRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight;
  let sx, sy, sw, sh;

  if (imageRatio > targetRatio) {
    sh = img.height;
    sw = sh * targetRatio;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  return { sx, sy, sw, sh };
}

function drawText() {
  const phrase = phraseInput.value.trim() || 'Tu frase aquí';
  const color = textColor.value;
  const size = Number(textSize.value);

  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(4, Math.round(size / 8));
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.fillStyle = color;

  const lines = wrapText(phrase, canvas.width * 0.82, size);
  const lineHeight = size * 1.2;
  const totalHeight = lineHeight * lines.length;
  let startY = state.textY - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    ctx.strokeText(line, state.textX, y);
    ctx.fillText(line, state.textX, y);
  });
}

function wrapText(text, maxWidth, size) {
  ctx.font = `bold ${size}px Arial`;
  const words = text.split(' ');
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 6);
}

function renderCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!imageLoaded) {
    drawPlaceholder();
  } else {
    const { sx, sy, sw, sh } = fitImageCover(baseImage, canvas.width, canvas.height);
    ctx.drawImage(baseImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const fade = ctx.createLinearGradient(0, canvas.height * 0.55, 0, canvas.height);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
  }

  drawText();
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    baseImage.onload = () => {
      imageLoaded = true;
      state.textX = canvas.width / 2;
      state.textY = canvas.height * 0.82;
      renderCanvas();
      downloadBtn.disabled = false;
    };
    baseImage.src = reader.result;
  };
  reader.readAsDataURL(file);
});

[phraseInput, textColor, textSize].forEach((el) => el.addEventListener('input', renderCanvas));
renderBtn.addEventListener('click', renderCanvas);

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'image-phrase-ai.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function getPointerPos(event) {
  const rect = canvas.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function isNearText(x, y) {
  const size = Number(textSize.value);
  return Math.abs(x - state.textX) < 220 && Math.abs(y - state.textY) < 120 + size;
}

canvas.addEventListener('mousedown', (e) => {
  const pos = getPointerPos(e);
  if (isNearText(pos.x, pos.y)) {
    state.dragging = true;
    state.offsetX = pos.x - state.textX;
    state.offsetY = pos.y - state.textY;
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (!state.dragging) return;
  const pos = getPointerPos(e);
  state.textX = pos.x - state.offsetX;
  state.textY = pos.y - state.offsetY;
  renderCanvas();
});
window.addEventListener('mouseup', () => {
  state.dragging = false;
});

canvas.addEventListener('touchstart', (e) => {
  const pos = getPointerPos(e);
  if (isNearText(pos.x, pos.y)) {
    state.dragging = true;
    state.offsetX = pos.x - state.textX;
    state.offsetY = pos.y - state.textY;
  }
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
  if (!state.dragging) return;
  const pos = getPointerPos(e);
  state.textX = pos.x - state.offsetX;
  state.textY = pos.y - state.offsetY;
  renderCanvas();
}, { passive: true });
window.addEventListener('touchend', () => {
  state.dragging = false;
});

drawPlaceholder();
