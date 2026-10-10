const express = require('express');
const { createCanvas } = require('canvas');
const GIFEncoder = require('gifencoder');

const app = express();
const PORT = process.env.PORT || 8000;

function drawDiceBoard(ctx, diceValues, isRolling = false, rollOffset = 0) {
  const width = 640;
  const height = 440;

  ctx.fillStyle = '#e8f0fe';
  ctx.fillRect(0, 0, width, height);

  const startX = 45;
  const startY = 40;
  const boxSize = 85;
  const gap = 20;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = row * 3 + col;
      let x = startX + col * (boxSize + gap);
      let y = startY + row * (boxSize + gap);

      ctx.save();
      if (isRolling) {
        const angle = Math.sin(rollOffset + index) * 0.45;
        const pivotX = x + boxSize / 2;
        const pivotY = y + boxSize / 2;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(angle);
        ctx.translate(-pivotX, -pivotY);
      }

      ctx.fillStyle = '#2db7c9';
      ctx.beginPath();
      ctx.roundRect(x, y, boxSize, boxSize, 12);
      ctx.fill();

      if (!isRolling) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(diceValues[index].toString(), x + boxSize / 2, y + boxSize / 2 + 2);
      }
      ctx.restore();
    }
  }

  const totalBoxX = 390;
  const totalBoxY = 320;
  const totalBoxW = 210;
  const totalBoxH = 65;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(totalBoxX, totalBoxY, totalBoxW, totalBoxH, 16);
  ctx.fill();

  ctx.fillStyle = '#444444';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Total', totalBoxX + 22, totalBoxY + 38);

  const totalScore = isRolling ? 0 : diceValues.reduce((a, b) => a + b, 0);
  ctx.fillStyle = '#111111';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(totalScore.toString(), totalBoxX + totalBoxW - 25, totalBoxY + 44);
}

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/roll.gif', (req, res) => {
  const diceValues = Array.from({ length: 9 }, () => Math.floor(Math.random() * 6) + 1);
  const totalScore = diceValues.reduce((a, b) => a + b, 0);

  const width = 640;
  const height = 440;
  const encoder = new GIFEncoder(width, height);

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('X-Dice-Rolls', JSON.stringify(diceValues));
  res.setHeader('X-Dice-Total', totalScore.toString());
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  encoder.createReadStream().pipe(res);

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(90);
  encoder.setQuality(15);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < 12; i++) {
    drawDiceBoard(ctx, diceValues, true, i * 0.8);
    encoder.addFrame(ctx);
  }

  drawDiceBoard(ctx, diceValues, false);
  for (let i = 0; i < 8; i++) {
    encoder.addFrame(ctx);
  }

  encoder.finish();
});

app.listen(PORT, () => {
  console.log(`Server API Dadu jalan di port ${PORT}`);
});
