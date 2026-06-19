import Settings from './Settings.js';

/**
 * UI — funções partilhadas de interface, usadas por todas as cenas.
 * Evita duplicação de código de botões/sliders/toggles entre menus.
 */

/**
 * Cria um botão estilizado e interativo.
 *
 * @param {Phaser.Scene} scene  — a cena onde criar o botão
 * @param {object} opts
 *   @param {number} opts.x          — posição X (centro)
 *   @param {number} opts.y          — posição Y (centro)
 *   @param {string} opts.label      — texto do botão
 *   @param {function} opts.onClick  — callback ao clicar
 *   @param {number} [opts.width=300]
 *   @param {number} [opts.height=56]
 *   @param {string} [opts.color]    — cor do texto
 *   @param {number} [opts.fontSize=22]
 *   @param {boolean} [opts.scrollFactor0] — fixar à câmara (para HUD)
 *   @param {number} [opts.depth]
 * @returns {object} { bg, txt, hit, setLabel(), destroy() }
 */
export function makeButton(scene, opts) {
  const {
    x, y, label, onClick,
    width = 300, height = 56,
    color = '#e8d5a3', fontSize = 22,
    scrollFactor0 = false, depth = 0
  } = opts;

  const W = width, H = height;

  const bg = scene.add.graphics();
  if (scrollFactor0) bg.setScrollFactor(0);
  if (depth) bg.setDepth(depth);

  const draw = (fill, line) => {
    bg.clear();
    bg.fillStyle(fill, 0.92);
    bg.fillRoundedRect(x - W/2, y - H/2, W, H, 8);
    bg.lineStyle(2, line, 0.9);
    bg.strokeRoundedRect(x - W/2, y - H/2, W, H, 8);
  };
  draw(0x1a0f00, 0xc8960c);

  const txt = scene.add.text(x, y, label, {
    fontFamily: 'Georgia, serif', fontSize: fontSize + 'px',
    color, stroke: '#000', strokeThickness: 2
  }).setOrigin(0.5);
  if (scrollFactor0) txt.setScrollFactor(0);
  if (depth) txt.setDepth(depth + 1);

  // Zona clicável transparente por cima
  const hit = scene.add.rectangle(x, y, W, H, 0xffffff, 0)
    .setInteractive({ useHandCursor: true });
  if (scrollFactor0) hit.setScrollFactor(0);
  if (depth) hit.setDepth(depth + 2);

  hit.on('pointerover', () => { draw(0x3d2000, 0xf0c040); txt.setColor('#f0d060').setScale(1.04); });
  hit.on('pointerout',  () => { draw(0x1a0f00, 0xc8960c); txt.setColor(color).setScale(1); });
  hit.on('pointerdown', () => { Settings.playSfx(scene, 'sfx_btn'); onClick(); });

  return {
    bg, txt, hit,
    setLabel: (s) => txt.setText(s),
    destroy: () => { bg.destroy(); txt.destroy(); hit.destroy(); }
  };
}

/**
 * Cria um toggle (ligado/desligado).
 */
export function makeToggle(scene, opts) {
  const { x, y, label, initial, onChange, labelX = x - 180, btnX = x + 140 } = opts;
  const lbl = scene.add.text(labelX, y, label, {
    fontFamily: 'Georgia, serif', fontSize: '20px', color: '#d4a56a'
  }).setOrigin(0, 0.5);

  let state = initial;
  const onTxt  = '✔';
  const btn = scene.add.text(btnX, y, state ? 'ON' : 'OFF', {
    fontFamily: 'monospace', fontSize: '16px',
    color: state ? '#00e676' : '#ef5350',
    backgroundColor: '#111', padding: { x: 14, y: 6 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  btn.on('pointerdown', () => {
    state = !state;
    btn.setText(state ? 'ON' : 'OFF');
    btn.setColor(state ? '#00e676' : '#ef5350');
    Settings.playSfx(scene, 'sfx_btn');
    onChange(state);
  });

  return { lbl, btn, destroy: () => { lbl.destroy(); btn.destroy(); } };
}

/**
 * Cria um slider de volume (0..1) com coordenadas absolutas.
 */
export function makeSlider(scene, opts) {
  const {
    x, y, label, initial, onChange,
    labelX = x - 180, trackX = x + 30, trackW = 130
  } = opts;

  const lbl = scene.add.text(labelX, y, label, {
    fontFamily: 'Georgia, serif', fontSize: '16px', color: '#d4a56a'
  }).setOrigin(0, 0.5);

  const track = scene.add.graphics();
  const redraw = (fillX) => {
    track.clear();
    track.lineStyle(4, 0x555); track.lineBetween(trackX, y, trackX + trackW, y);
    track.lineStyle(4, 0x42a5f5); track.lineBetween(trackX, y, fillX, y);
  };
  let val = initial;
  redraw(trackX + val * trackW);

  const thumb = scene.add.circle(trackX + val * trackW, y, 10, 0x42a5f5)
    .setInteractive({ useHandCursor: true, draggable: true });
  scene.input.setDraggable(thumb);

  const vText = scene.add.text(trackX + trackW + 18, y, Math.round(val*100)+'%', {
    fontFamily: 'monospace', fontSize: '14px', color: '#888'
  }).setOrigin(0, 0.5);

  thumb.on('drag', (ptr, dragX) => {
    const nx = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
    thumb.setX(nx);
    val = (nx - trackX) / trackW;
    vText.setText(Math.round(val*100)+'%');
    redraw(nx);
    onChange(val);
  });

  return {
    lbl, track, thumb, vText,
    destroy: () => { lbl.destroy(); track.destroy(); thumb.destroy(); vText.destroy(); }
  };
}

/**
 * Cria o seletor de língua (botões PT/EN).
 * onChange recebe o código da nova língua.
 */
export function makeLangSelector(scene, opts) {
  const { x, y, langs, current, onChange, spacing = 80 } = opts;
  const objs = [];
  langs.forEach((lang, i) => {
    const active = current === lang;
    const btn = scene.add.text(x + i * spacing, y, lang.toUpperCase(), {
      fontFamily: 'monospace', fontSize: '18px',
      color: active ? '#f0c040' : '#888',
      backgroundColor: active ? '#3d2000' : '#1a1a2e',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => { Settings.playSfx(scene, 'sfx_btn'); onChange(lang); });
    objs.push(btn);
  });
  return { objs, destroy: () => objs.forEach(o => o.destroy()) };
}
