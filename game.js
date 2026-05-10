
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const movePad = document.getElementById('movePad');
const fireBtn = document.getElementById('fireBtn');

function resize(){
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}
addEventListener('resize', resize); resize();

let ship, bullets, meteors, hearts, score, lives, running, moveDir, fireHeld, speedScale;

function resetGame(){
  ship = {x: innerWidth/2, y: innerHeight-120, w: 40, h: 60};
  bullets = [];
  meteors = [];
  hearts = [];
  score = 0;
  lives = 3;
  running = true;
  moveDir = 0;
  fireHeld = false;
  speedScale = 1;
  updateHud();
}

function updateHud(){
  scoreEl.textContent = score;
  livesEl.textContent = lives;
}

function beep(freq=440, dur=0.08, type='sine', vol=0.03){
  try{
    const ac = beep.ac || (beep.ac = new (window.AudioContext||window.webkitAudioContext)());
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  }catch(e){}
}

function spawnMeteor(){
  const r = Math.random() < 0.3 ? 30 : 18;
  meteors.push({
    x: Math.random()*(innerWidth-r*2)+r,
    y: -r,
    r,
    vy: (2 + Math.random()*2) * speedScale
  });
}

function spawnHeart(){
  hearts.push({
    x: Math.random()*(innerWidth-30)+15,
    y: -20,
    r: 14,
    vy: 2
  });
}

function shoot(){
  bullets.push({x: ship.x, y: ship.y-ship.h/2, vy: -10});
  beep(880,0.05,'square');
}

function drawShip(){
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.moveTo(0,-ship.h/2);
  ctx.lineTo(ship.w/2, ship.h/2);
  ctx.lineTo(0, ship.h/4);
  ctx.lineTo(-ship.w/2, ship.h/2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff7043';
  ctx.fillRect(-6, ship.h/2-4, 12, 14);
  ctx.restore();
}

function loop(){
  if(!running) return;
  requestAnimationFrame(loop);

  // background
  ctx.fillStyle = '#020814';
  ctx.fillRect(0,0,innerWidth,innerHeight);
  for(let i=0;i<50;i++){
    ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.fillRect((i*97)%innerWidth, (i*53 + performance.now()*0.05)%innerHeight, 2, 2);
  }

  // controls
  ship.x += moveDir * 6;
  ship.x = Math.max(ship.w/2, Math.min(innerWidth-ship.w/2, ship.x));

  if(fireHeld && Math.random() < 0.2) shoot();

  // spawn
  if(Math.random() < 0.03) spawnMeteor();
  if(Math.random() < 0.002) spawnHeart();
  speedScale += 0.0002;

  // bullets
  bullets.forEach(b => b.y += b.vy);
  bullets = bullets.filter(b => b.y > -20);

  // meteors
  meteors.forEach(m => m.y += m.vy);
  meteors = meteors.filter(m => m.y < innerHeight + 50);

  // hearts
  hearts.forEach(h => h.y += h.vy);
  hearts = hearts.filter(h => h.y < innerHeight + 50);

  // collisions bullets-meteors
  bullets.forEach((b, bi) => {
    meteors.forEach((m, mi) => {
      const dx = b.x - m.x, dy = b.y - m.y;
      if(Math.hypot(dx,dy) < m.r){
        bullets.splice(bi,1);
        meteors.splice(mi,1);
        score += 10;
        updateHud();
        beep(120,0.12,'sawtooth');
      }
    });
  });

  // ship-meteors
  meteors.forEach((m, mi) => {
    if(Math.abs(ship.x - m.x) < m.r + ship.w/2 &&
       Math.abs(ship.y - m.y) < m.r + ship.h/2){
      meteors.splice(mi,1);
      lives--;
      updateHud();
      beep(180,0.25,'triangle');
      if(lives <= 0){
        running = false;
        overlay.style.display = 'flex';
        overlay.querySelector('h1').textContent = '☠️ Oyun Bitti';
        overlay.querySelector('p').textContent = 'Skorun: ' + score;
        startBtn.textContent = 'Tekrar Oyna';
      }
    }
  });

  // ship-hearts
  hearts.forEach((h, hi) => {
    if(Math.abs(ship.x - h.x) < h.r + ship.w/2 &&
       Math.abs(ship.y - h.y) < h.r + ship.h/2){
      hearts.splice(hi,1);
      if(lives < 3) lives++;
      updateHud();
      beep(660,0.15,'sine');
    }
  });

  // draw
  drawShip();

  ctx.fillStyle = '#ffeb3b';
  bullets.forEach(b => ctx.fillRect(b.x-2,b.y-10,4,10));

  meteors.forEach(m => {
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
    ctx.fill();
  });

  hearts.forEach(h => {
    ctx.font = '24px Arial';
    ctx.fillText('💚', h.x-12, h.y+8);
  });
}

startBtn.onclick = () => {
  overlay.style.display = 'none';
  beep(523,0.08);
  resetGame();
  loop();
};

// touch controls
movePad.addEventListener('touchstart', e => {
  const rect = movePad.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  moveDir = x < rect.width/2 ? -1 : 1;
});
movePad.addEventListener('touchmove', e => {
  const rect = movePad.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  moveDir = x < rect.width/2 ? -1 : 1;
});
movePad.addEventListener('touchend', () => moveDir = 0);

fireBtn.addEventListener('touchstart', e => { e.preventDefault(); fireHeld = true; shoot(); });
fireBtn.addEventListener('touchend', () => fireHeld = false);

// keyboard
addEventListener('keydown', e => {
  if(e.key === 'ArrowLeft') moveDir = -1;
  if(e.key === 'ArrowRight') moveDir = 1;
  if(e.key === ' ') shoot();
});
addEventListener('keyup', e => {
  if(e.key === 'ArrowLeft' && moveDir === -1) moveDir = 0;
  if(e.key === 'ArrowRight' && moveDir === 1) moveDir = 0;
});
