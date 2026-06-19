/**
 * AssetGenerator — gera todas as texturas programaticamente.
 * Chamado no PreloadScene antes de qualquer cena de jogo.
 * Isto elimina a dependência de ficheiros de imagem externos
 * para a versão funcional inicial.
 */
export function generateAllAssets(scene) {
  generateTerrain(scene);
  generateTowers(scene);
  generateEnemies(scene);
  generateProjectiles(scene);
  generateUI(scene);
  generateParticles(scene);
}

function rect(g, x, y, w, h, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, w, h);
}

function circle(g, x, y, r, color, alpha = 1) {
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, r);
}

// ── TERRAIN ──────────────────────────────────────────────────────────────────
function generateTerrain(scene) {
  // Tile de chão
  const ground = scene.make.graphics({ add: false });
  rect(ground, 0, 0, 64, 64, 0x2d5a27);
  rect(ground, 8,  8,  4, 4, 0x3a7a32, 0.4);
  rect(ground, 32, 20, 3, 3, 0x3a7a32, 0.4);
  rect(ground, 50, 45, 4, 4, 0x3a7a32, 0.4);
  ground.generateTexture('tile_ground', 64, 64);
  ground.destroy();

  // Tile de caminho
  const path = scene.make.graphics({ add: false });
  rect(path, 0, 0, 64, 64, 0xc4a35a);
  rect(path, 2, 2, 60, 60, 0xd4b36a);
  // textura de terra
  for (let i = 0; i < 8; i++) {
    rect(path, 5 + i * 7, 10 + (i % 3) * 15, 3, 2, 0xb8963e, 0.5);
  }
  path.generateTexture('tile_path', 64, 64);
  path.destroy();

  // Marcador de saída (castelo)
  const castle = scene.make.graphics({ add: false });
  rect(castle, 4, 20, 56, 44, 0x8d8d8d);
  rect(castle, 0, 12, 16, 20, 0x9d9d9d);
  rect(castle, 48, 12, 16, 20, 0x9d9d9d);
  rect(castle, 20, 0, 24, 28, 0x9d9d9d);
  rect(castle, 4,  8, 6, 8, 0x555);
  rect(castle, 14, 8, 6, 8, 0x555);
  rect(castle, 54, 8, 6, 8, 0x555);
  rect(castle, 22, 4, 6, 8, 0x555);
  rect(castle, 36, 4, 6, 8, 0x555);
  // porta
  rect(castle, 24, 40, 16, 24, 0x3a2a1a);
  castle.generateTexture('castle', 64, 64);
  castle.destroy();

  // Marcador de entrada
  const entry = scene.make.graphics({ add: false });
  rect(entry, 0, 0, 48, 48, 0x8b0000);
  rect(entry, 4, 4, 40, 40, 0xb00000);
  // caveira simples
  circle(entry, 24, 20, 12, 0x111);
  rect(entry, 14, 28, 20, 12, 0x111);
  rect(entry, 16, 28, 6, 8, 0xb00000);
  rect(entry, 26, 28, 6, 8, 0xb00000);
  entry.generateTexture('entry_portal', 48, 48);
  entry.destroy();
}

// ── TOWERS ───────────────────────────────────────────────────────────────────
function generateTowers(scene) {
  const towers = [
    { key: 'tower_barracks',   base: 0x8b5e3c, accent: 0xd4a56a, icon: 'B' },
    { key: 'tower_archer',     base: 0x2e7d32, accent: 0x81c784, icon: 'A' },
    { key: 'tower_mage',       base: 0x4a148c, accent: 0xce93d8, icon: 'M' },
    { key: 'tower_artillery',  base: 0x8b0000, accent: 0xef9a9a, icon: 'C' }
  ];

  for (const t of towers) {
    const g = scene.make.graphics({ add: false });
    const W = 48, H = 48;

    // base
    rect(g, 8, 30, 32, 18, t.base);
    // torre principal
    rect(g, 12, 12, 24, 22, t.base);
    // topo ameado
    rect(g, 10, 4, 8, 10, t.base);
    rect(g, 30, 4, 8, 10, t.base);
    // detalhe de janela
    rect(g, 20, 16, 8, 10, 0x000000, 0.6);
    // bandeira
    rect(g, 22, 0, 3, 14, 0xd4a56a);
    rect(g, 25, 0, 12, 8, t.accent);

    g.generateTexture(t.key, W, H);
    g.destroy();

    // versão nível 2
    const g2 = scene.make.graphics({ add: false });
    rect(g2, 6, 32, 36, 16, t.base);
    rect(g2, 10, 10, 28, 26, t.base);
    rect(g2, 8,  2, 8, 12, t.base);
    rect(g2, 32, 2, 8, 12, t.base);
    rect(g2, 20, 0, 8, 12, t.base);
    rect(g2, 18, 14, 12, 12, 0x000000, 0.6);
    rect(g2, 23, 0, 3, 14, t.accent);
    rect(g2, 26, 0, 14, 8, t.accent);
    g2.generateTexture(t.key + '_2', W, H);
    g2.destroy();

    // versão nível 3
    const g3 = scene.make.graphics({ add: false });
    rect(g3, 4, 34, 40, 14, t.base);
    rect(g3, 8, 8, 32, 30, t.base);
    rect(g3, 6,  0, 8, 12, t.base);
    rect(g3, 34, 0, 8, 12, t.base);
    rect(g3, 20, 0, 8, 12, t.base);
    rect(g3, 17, 12, 14, 14, 0x000000, 0.6);
    // dois estandartes no nível 3
    rect(g3, 8, 0, 3, 12, t.accent);
    rect(g3, 11, 0, 16, 8, t.accent);
    rect(g3, 37, 0, 3, 12, t.accent);
    rect(g3, 22, 0, 16, 8, t.accent);
    g3.generateTexture(t.key + '_3', W, H);
    g3.destroy();
  }

  // Fantasma (slot vazio para colocar torre)
  const slot = scene.make.graphics({ add: false });
  slot.lineStyle(2, 0xffffff, 0.4);
  slot.strokeRect(2, 2, 44, 44);
  slot.fillStyle(0xffffff, 0.06);
  slot.fillRect(2, 2, 44, 44);
  slot.generateTexture('tower_slot', 48, 48);
  slot.destroy();

  // Range circle (para mostrar alcance)
  const range = scene.make.graphics({ add: false });
  range.lineStyle(1, 0xffffff, 0.3);
  range.strokeCircle(128, 128, 126);
  range.fillStyle(0xffffff, 0.04);
  range.fillCircle(128, 128, 126);
  range.generateTexture('range_circle', 256, 256);
  range.destroy();
}

// ── ENEMIES ──────────────────────────────────────────────────────────────────
function generateEnemies(scene) {
  const enemies = [
    { key: 'goblin',      color: 0x66bb6a, size: 18 },
    { key: 'orc',         color: 0x388e3c, size: 24 },
    { key: 'troll',       color: 0x1b5e20, size: 30 },
    { key: 'dark_knight', color: 0x546e7a, size: 28 },
    { key: 'demon',       color: 0xb71c1c, size: 34 }
  ];

  for (const e of enemies) {
    const S = e.size * 2 + 4;
    const g = scene.make.graphics({ add: false });
    const cx = S / 2, cy = S / 2;

    // corpo
    circle(g, cx, cy, e.size, e.color);
    // sombra superior (highlight)
    circle(g, cx - 2, cy - 2, e.size * 0.6, 0xffffff, 0.15);
    // olhos
    circle(g, cx - e.size * 0.3, cy - e.size * 0.15, e.size * 0.15, 0xffeb3b);
    circle(g, cx + e.size * 0.3, cy - e.size * 0.15, e.size * 0.15, 0xffeb3b);
    // pupila
    circle(g, cx - e.size * 0.3, cy - e.size * 0.1, e.size * 0.07, 0x000000);
    circle(g, cx + e.size * 0.3, cy - e.size * 0.1, e.size * 0.07, 0x000000);

    if (e.key === 'demon') {
      // cornos
      g.fillStyle(0x880000);
      g.fillTriangle(cx - e.size * 0.4, cy - e.size * 0.7,
                     cx - e.size * 0.6, cy - e.size * 1.1,
                     cx - e.size * 0.1, cy - e.size * 0.7);
      g.fillTriangle(cx + e.size * 0.4, cy - e.size * 0.7,
                     cx + e.size * 0.6, cy - e.size * 1.1,
                     cx + e.size * 0.1, cy - e.size * 0.7);
    }

    g.generateTexture(e.key, S, S);
    g.destroy();
  }
}

// ── PROJECTILES ──────────────────────────────────────────────────────────────
function generateProjectiles(scene) {
  // Flecha
  const arrow = scene.make.graphics({ add: false });
  rect(arrow, 0, 3, 20, 2, 0x8b5e3c);
  arrow.fillStyle(0x4a7c59);
  arrow.fillTriangle(20, 0, 20, 8, 26, 4);
  arrow.generateTexture('proj_arrow', 26, 8);
  arrow.destroy();

  // Bola de magia
  const magic = scene.make.graphics({ add: false });
  circle(magic, 8, 8, 6, 0x9c27b0);
  circle(magic, 8, 8, 3, 0xce93d8);
  magic.generateTexture('proj_magic', 16, 16);
  magic.destroy();

  // Bola de canhão
  const cannon = scene.make.graphics({ add: false });
  circle(cannon, 10, 10, 8, 0x333);
  circle(cannon, 7, 7, 3, 0x666, 0.5);
  cannon.generateTexture('proj_cannon', 20, 20);
  cannon.destroy();

  // Explosão
  const exp = scene.make.graphics({ add: false });
  for (let r = 48; r > 0; r -= 8) {
    const alpha = (48 - r) / 48;
    const color = r > 32 ? 0xff5722 : r > 16 ? 0xff9800 : 0xffeb3b;
    circle(exp, 48, 48, r, color, alpha * 0.8);
  }
  exp.generateTexture('explosion', 96, 96);
  exp.destroy();

  // Partícula de meteoro
  const meteor = scene.make.graphics({ add: false });
  circle(meteor, 20, 20, 18, 0xff5722);
  circle(meteor, 20, 20, 12, 0xff9800);
  circle(meteor, 20, 20, 6,  0xffeb3b);
  meteor.generateTexture('meteor', 40, 40);
  meteor.destroy();

  // Soldado de reforço
  const soldier = scene.make.graphics({ add: false });
  circle(soldier, 12, 8,  6, 0xf5deb3);   // cabeça
  rect(soldier, 7, 14, 10, 12, 0x1565c0); // corpo
  rect(soldier, 5, 14,  5, 10, 0x1565c0); // braço esq
  rect(soldier, 14, 14, 5, 10, 0x1565c0); // braço dir
  rect(soldier, 7, 26,  4, 10, 0x333);    // perna esq
  rect(soldier, 13, 26, 4, 10, 0x333);    // perna dir
  soldier.generateTexture('soldier', 24, 36);
  soldier.destroy();
}

// ── UI ELEMENTS ──────────────────────────────────────────────────────────────
function generateUI(scene) {
  // Painel HUD
  const hud = scene.make.graphics({ add: false });
  rect(hud, 0, 0, 1280, 60, 0x0d0d1a, 0.92);
  hud.lineStyle(1, 0x00e676, 0.3);
  hud.strokeRect(0, 0, 1280, 60);
  hud.generateTexture('hud_bg', 1280, 60);
  hud.destroy();

  // Botão
  const btn = scene.make.graphics({ add: false });
  rect(btn, 0, 0, 160, 40, 0x1a1a2e);
  rect(btn, 2, 2, 156, 36, 0x16213e);
  btn.lineStyle(1, 0x00e676, 0.7);
  btn.strokeRect(0, 0, 160, 40);
  btn.generateTexture('btn_normal', 160, 40);
  btn.destroy();

  const btnHover = scene.make.graphics({ add: false });
  rect(btnHover, 0, 0, 160, 40, 0x0f3460);
  rect(btnHover, 2, 2, 156, 36, 0x16213e);
  btnHover.lineStyle(1, 0x00e676);
  btnHover.strokeRect(0, 0, 160, 40);
  btnHover.generateTexture('btn_hover', 160, 40);
  btnHover.destroy();

  // Ícone de coração (vida)
  const heart = scene.make.graphics({ add: false });
  heart.fillStyle(0xe53935);
  heart.fillCircle(8, 8, 7);
  heart.fillCircle(20, 8, 7);
  heart.fillTriangle(1, 11, 28, 11, 14, 26);
  heart.generateTexture('icon_heart', 28, 26);
  heart.destroy();

  // Ícone de moeda
  const coin = scene.make.graphics({ add: false });
  circle(coin, 12, 12, 11, 0xfdd835);
  circle(coin, 12, 12, 7,  0xf9a825);
  coin.fillStyle(0xfdd835);
  coin.fillText = undefined;
  coin.generateTexture('icon_coin', 24, 24);
  coin.destroy();

  // Painel de torre (UI flutuante)
  const tpanel = scene.make.graphics({ add: false });
  rect(tpanel, 0, 0, 200, 180, 0x0d0d1a, 0.95);
  tpanel.lineStyle(1, 0x00e676, 0.5);
  tpanel.strokeRect(0, 0, 200, 180);
  tpanel.generateTexture('tower_panel', 200, 180);
  tpanel.destroy();

  // Painel de poderes
  const ppanel = scene.make.graphics({ add: false });
  rect(ppanel, 0, 0, 220, 80, 0x0d0d1a, 0.92);
  ppanel.lineStyle(1, 0xe040fb, 0.5);
  ppanel.strokeRect(0, 0, 220, 80);
  ppanel.generateTexture('powers_panel', 220, 80);
  ppanel.destroy();

  // Ícone poder - reforços
  const reinf = scene.make.graphics({ add: false });
  rect(reinf, 0, 0, 48, 48, 0x1565c0, 0.8);
  rect(reinf, 2, 2, 44, 44, 0x1976d2, 0.5);
  reinf.lineStyle(1, 0x42a5f5);
  reinf.strokeRect(0, 0, 48, 48);
  reinf.generateTexture('icon_reinf', 48, 48);
  reinf.destroy();

  // Ícone poder - meteorito
  const metIcon = scene.make.graphics({ add: false });
  rect(metIcon, 0, 0, 48, 48, 0x8b0000, 0.8);
  rect(metIcon, 2, 2, 44, 44, 0xb00000, 0.5);
  metIcon.lineStyle(1, 0xef5350);
  metIcon.strokeRect(0, 0, 48, 48);
  circle(metIcon, 24, 24, 14, 0xff5722, 0.8);
  circle(metIcon, 24, 24, 8,  0xffeb3b, 0.9);
  metIcon.generateTexture('icon_meteor', 48, 48);
  metIcon.destroy();

  // Overlay de cooldown
  const cdOverlay = scene.make.graphics({ add: false });
  rect(cdOverlay, 0, 0, 48, 48, 0x000000, 0.65);
  cdOverlay.generateTexture('cd_overlay', 48, 48);
  cdOverlay.destroy();
}

// ── PARTICLES ────────────────────────────────────────────────────────────────
function generateParticles(scene) {
  const spark = scene.make.graphics({ add: false });
  circle(spark, 4, 4, 3, 0xffeb3b);
  spark.generateTexture('particle_spark', 8, 8);
  spark.destroy();

  const blood = scene.make.graphics({ add: false });
  circle(blood, 4, 4, 3, 0xb71c1c);
  blood.generateTexture('particle_blood', 8, 8);
  blood.destroy();

  const magic = scene.make.graphics({ add: false });
  circle(magic, 4, 4, 3, 0xce93d8);
  magic.generateTexture('particle_magic', 8, 8);
  magic.destroy();
}

// ── NOVOS INIMIGOS (adicionados à função generateEnemies existente) ──────────
// Esta função substitui a anterior — exportar separadamente para patch
export function generateNewEnemies(scene) {
  const extras = [
    // Goblin veloz — mais claro e pequeno
    { key: 'goblin_fast',  color: 0x9cff57, size: 14 },
    // Orc blindado — cinzento com destaque metálico
    { key: 'orc_armored',  color: 0x607d8b, size: 24 },
    // Harpia — voadora roxa
    { key: 'harpy',        color: 0xba68c8, size: 18 },
    // Golem — castanho enorme
    { key: 'golem',        color: 0x6d4c41, size: 32 },
    // Necromante — roxo escuro
    { key: 'necromancer',  color: 0x6a1b9a, size: 22 },
    // Wyvern — laranja voador
    { key: 'wyvern',       color: 0xfb8c00, size: 26 },
    // Lich — roxo muito escuro
    { key: 'lich',         color: 0x4a148c, size: 30 }
  ];

  for (const e of extras) {
    // Não regenerar se já existe
    if (scene.textures.exists(e.key)) continue;

    const S  = e.size * 2 + 6;
    const cx = S / 2, cy = S / 2;
    const g  = scene.make.graphics({ add: false });

    // Corpo
    g.fillStyle(e.color);
    g.fillCircle(cx, cy, e.size);

    // Highlight
    g.fillStyle(0xffffff, 0.18);
    g.fillCircle(cx - 2, cy - 2, e.size * 0.55);

    // Olhos
    g.fillStyle(0xffeb3b);
    g.fillCircle(cx - e.size * 0.28, cy - e.size * 0.12, e.size * 0.16);
    g.fillCircle(cx + e.size * 0.28, cy - e.size * 0.12, e.size * 0.16);
    g.fillStyle(0x000000);
    g.fillCircle(cx - e.size * 0.28, cy - e.size * 0.08, e.size * 0.08);
    g.fillCircle(cx + e.size * 0.28, cy - e.size * 0.08, e.size * 0.08);

    // Detalhes por tipo
    if (e.key === 'orc_armored' || e.key === 'golem') {
      // Armadura — padrão de placas
      g.lineStyle(2, 0x90a4ae, 0.7);
      g.strokeCircle(cx, cy, e.size);
      g.lineStyle(1, 0xb0bec5, 0.5);
      g.lineBetween(cx - e.size, cy, cx + e.size, cy);
    }
    if (e.key === 'harpy' || e.key === 'wyvern') {
      // Asas simples
      g.fillStyle(e.color, 0.6);
      g.fillEllipse(cx - e.size * 1.2, cy, e.size, e.size * 0.6);
      g.fillEllipse(cx + e.size * 1.2, cy, e.size, e.size * 0.6);
    }
    if (e.key === 'necromancer' || e.key === 'lich') {
      // Aura mágica
      g.lineStyle(2, 0xce93d8, 0.5);
      g.strokeCircle(cx, cy, e.size + 3);
    }

    g.generateTexture(e.key, S, S);
    g.destroy();
  }
}
