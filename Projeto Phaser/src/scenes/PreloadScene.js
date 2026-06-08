/**
 * PreloadScene — carrega todos os assets reais (imagens + áudio) da pasta /assets.
 * Mostra barra de progresso enquanto carrega.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    const W = 1280, H = 720;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    const barBg = this.add.rectangle(W/2, H/2 + 40, 400, 20, 0x1a1a2e).setStrokeStyle(1, 0x00e676);
    const bar   = this.add.rectangle(W/2 - 198, H/2 + 40, 4, 16, 0x00e676).setOrigin(0, 0.5);
    this.add.text(W/2, H/2, 'KINGDOM RUSH', {
      fontFamily: 'serif', fontSize: '48px', color: '#c8960c',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);
    this.add.text(W/2, H/2 + 70, 'A preparar o reino...', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888'
    }).setOrigin(0.5);

    this.load.on('progress', (v) => bar.setSize(4 + v * 392, 16));

    // ─── IMAGENS ───────────────────────────────────────────────────────────
    const base = 'assets/images/';
    // Torres (3 níveis cada)
    for (const t of ['barracks','archer','mage','artillery']) {
      this.load.image('tower_' + t,      base + 'tower_' + t + '.png');
      this.load.image('tower_' + t + '_2', base + 'tower_' + t + '_2.png');
      this.load.image('tower_' + t + '_3', base + 'tower_' + t + '_3.png');
    }
    // Inimigos
    for (const e of ['goblin','goblin_fast','orc','orc_armored','troll',
                     'harpy','golem','necromancer','wyvern','dark_knight','demon','lich']) {
      this.load.image(e, base + e + '.png');
    }
    // Projéteis, tiles, estruturas, soldado
    for (const img of ['proj_arrow','proj_magic','proj_cannon',
                       'tile_ground','tile_path','castle','entry_portal','soldier']) {
      this.load.image(img, base + img + '.png');
    }

    // ─── ÁUDIO (OGG comprimido) ──────────────────────────────────────────────
    const a = 'assets/audio/';
    this.load.audio('sfx_shoot_arrow',  a + 'shoot_arrow.ogg');
    this.load.audio('sfx_shoot_magic',  a + 'shoot_magic.ogg');
    this.load.audio('sfx_shoot_cannon', a + 'shoot_cannon.ogg');
    this.load.audio('sfx_coin',         a + 'coin.ogg');
    this.load.audio('sfx_explosion',    a + 'explosion.ogg');
    this.load.audio('sfx_enemy_die',    a + 'enemy_die.ogg');
    this.load.audio('sfx_life_lost',    a + 'life_lost.ogg');
    this.load.audio('sfx_wave_start',   a + 'wave_start.ogg');
    this.load.audio('sfx_btn',          a + 'btn.ogg');
    this.load.audio('sfx_victory',      a + 'victory.ogg');
    this.load.audio('sfx_gameover',     a + 'gameover.ogg');
    this.load.audio('sfx_place_tower',  a + 'place_tower.ogg');
    this.load.audio('sfx_upgrade',      a + 'upgrade.ogg');
    this.load.audio('sfx_meteor',       a + 'meteor.ogg');
    this.load.audio('sfx_reinf',        a + 'reinf.ogg');
    this.load.audio('music_menu',       a + 'music_menu.ogg');
    this.load.audio('music_battle',     a + 'music_battle.ogg');
  }

  create() {
    this.generateEnemySpritesheets();
    this.generateTowerTextures();
    this.generateSoldierSpritesheet();
    this.generateUITextures();
    this.scene.start('MenuScene');
  }

  /**
   * Gera spritesheets animados para cada tipo de inimigo (4 frames de caminhada).
   * Substitui as imagens PNG estáticas por texturas procedurais com formas distintas.
   */
  generateEnemySpritesheets() {
    const FW = 64, FH = 64, NF = 4;

    const BOB  = [0, -2, 0, -2];
    const LEGL = [0,  7, 0, -7];
    const ARMR = [0, -7, 0,  7];

    // ── humanóide ────────────────────────────────────────────────────────────
    const humanoid = (ctx, cfg, f) => {
      const cx = 32;
      const ll = LEGL[f], rl = -LEGL[f];
      const al = ARMR[f], ar = -ARMR[f];
      ctx.save(); ctx.translate(0, BOB[f]);

      // sombra
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.beginPath(); ctx.ellipse(cx, 63, cfg.w * .55, 3, 0, 0, Math.PI*2); ctx.fill();

      // pernas
      const lc = cfg.leg || cfg.body, lw = cfg.slim ? 3 : 4;
      ctx.strokeStyle = lc; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx-4, 46); ctx.lineTo(cx-4+ll*.6, 59); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+4, 46); ctx.lineTo(cx+4+rl*.6, 59); ctx.stroke();
      ctx.fillStyle = lc;
      ctx.beginPath(); ctx.ellipse(cx-4+ll*.6, 60, 4.5, 2.5, -.15, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+4+rl*.6, 60, 4.5, 2.5, .15, 0, Math.PI*2); ctx.fill();

      // corpo
      if (cfg.robes) {
        ctx.fillStyle = cfg.body;
        ctx.beginPath();
        ctx.moveTo(cx-cfg.w*.35, 31); ctx.lineTo(cx+cfg.w*.35, 31);
        ctx.lineTo(cx+cfg.w*.55, 46); ctx.lineTo(cx-cfg.w*.55, 46);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = cfg.accent; ctx.fillRect(cx-cfg.w*.55, 45, cfg.w*1.1, 2);
      } else if (cfg.armor) {
        ctx.fillStyle = cfg.skin;
        ctx.beginPath(); ctx.ellipse(cx, 39, cfg.w*.4, 7, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = cfg.body; ctx.fillRect(cx-cfg.w*.38, 32, cfg.w*.76, 11);
        ctx.fillStyle = cfg.accent; ctx.fillRect(cx-cfg.w*.26, 34, cfg.w*.52, 3);
      } else {
        ctx.fillStyle = cfg.body;
        ctx.beginPath(); ctx.ellipse(cx, 39, cfg.w*.42, 8, 0, 0, Math.PI*2); ctx.fill();
      }

      // braços
      const aw = cfg.slim ? 2 : 3;
      ctx.strokeStyle = cfg.skin; ctx.lineWidth = aw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx-cfg.w*.38, 35); ctx.lineTo(cx-cfg.w*.48+al*.45, 45+al*.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+cfg.w*.38, 35); ctx.lineTo(cx+cfg.w*.48+ar*.45, 45+ar*.2); ctx.stroke();

      // cajado (necromante / lich)
      if (cfg.staff) {
        const sx = cx+cfg.w*.48+ar*.45, sy = 45+ar*.2;
        ctx.strokeStyle = cfg.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx+ar*.2, 18); ctx.stroke();
        ctx.fillStyle = cfg.accent;
        ctx.beginPath(); ctx.arc(sx+ar*.2, 17, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = cfg.accent + '44';
        ctx.beginPath(); ctx.arc(sx+ar*.2, 17, 6, 0, Math.PI*2); ctx.fill();
      }

      // pescoço
      ctx.fillStyle = cfg.skin; ctx.fillRect(cx-3, 27, 6, 5);

      // asas (demônio)
      if (cfg.wings) {
        const ws = 11 + [0,3,0,-2][f];
        ctx.fillStyle = cfg.body + 'bb';
        ctx.beginPath(); ctx.moveTo(cx-cfg.headR, 22); ctx.lineTo(cx-cfg.headR-ws, 13); ctx.lineTo(cx-cfg.headR+2, 31); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+cfg.headR, 22); ctx.lineTo(cx+cfg.headR+ws, 13); ctx.lineTo(cx+cfg.headR-2, 31); ctx.closePath(); ctx.fill();
      }

      // cabeça
      ctx.fillStyle = cfg.skin;
      ctx.beginPath(); ctx.arc(cx, 22, cfg.headR, 0, Math.PI*2); ctx.fill();

      if (cfg.skeleton) {
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = .8;
        ctx.beginPath(); ctx.arc(cx, 22, cfg.headR, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-cfg.headR*.65, 22); ctx.lineTo(cx-cfg.headR*.25, 26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+cfg.headR*.65, 22); ctx.lineTo(cx+cfg.headR*.25, 26); ctx.stroke();
      }

      if (cfg.helmet) {
        ctx.fillStyle = cfg.body;
        ctx.beginPath(); ctx.arc(cx, 22, cfg.headR+1.5, Math.PI, Math.PI*2); ctx.fill();
        ctx.fillRect(cx-cfg.headR-1.5, 20, (cfg.headR+1.5)*2, 4);
        ctx.fillStyle = cfg.accent; ctx.fillRect(cx-cfg.headR*.75, 21, cfg.headR*1.5, 2);
      }

      if (cfg.ears) {
        ctx.fillStyle = cfg.skin;
        ctx.beginPath(); ctx.moveTo(cx-cfg.headR+1,17); ctx.lineTo(cx-cfg.headR-8,10); ctx.lineTo(cx-cfg.headR+3,15); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+cfg.headR-1,17); ctx.lineTo(cx+cfg.headR+8,10); ctx.lineTo(cx+cfg.headR-3,15); ctx.closePath(); ctx.fill();
      }

      if (cfg.horns) {
        ctx.fillStyle = cfg.body;
        ctx.beginPath(); ctx.moveTo(cx-cfg.headR*.45,15); ctx.lineTo(cx-cfg.headR*.8,5); ctx.lineTo(cx-cfg.headR*.05,14); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+cfg.headR*.45,15); ctx.lineTo(cx+cfg.headR*.8,5); ctx.lineTo(cx+cfg.headR*.05,14); ctx.closePath(); ctx.fill();
      }

      if (cfg.tusks) {
        ctx.fillStyle = '#ffffaa';
        ctx.beginPath(); ctx.moveTo(cx-3,28); ctx.lineTo(cx-6,22); ctx.lineTo(cx-1,25); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+3,28); ctx.lineTo(cx+6,22); ctx.lineTo(cx+1,25); ctx.closePath(); ctx.fill();
      }

      if (!cfg.helmet) {
        ctx.fillStyle = cfg.eyes || '#ffeb3b';
        ctx.beginPath(); ctx.arc(cx-3.5, 21, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+3.5, 21, 2, 0, Math.PI*2); ctx.fill();
        if (cfg.skeleton) {
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.arc(cx-3.5, 21, 1, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(cx+3.5, 21, 1, 0, Math.PI*2); ctx.fill();
        }
      }

      ctx.restore();
    };

    // ── troll ────────────────────────────────────────────────────────────────
    const troll = (ctx, cfg, f) => {
      const cx = 32;
      ctx.save(); ctx.translate(0, BOB[f] * 1.5);
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(cx, 63, 14, 4, 0, 0, Math.PI*2); ctx.fill();
      const ls = [0,5,0,-5][f];
      ctx.fillStyle = cfg.skin;
      ctx.fillRect(cx-12+ls*.3, 50, 9, 12); ctx.fillRect(cx+3-ls*.3, 50, 9, 12);
      ctx.fillStyle = cfg.body;
      ctx.beginPath(); ctx.ellipse(cx, 38, 14, 12, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = cfg.skin;
      ctx.fillRect(cx-22, 34, 8, 12); ctx.fillRect(cx+14, 34, 8, 12);
      ctx.fillStyle = cfg.skin;
      ctx.beginPath(); ctx.ellipse(cx-2, 24, 11, 10, .2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#cc2222';
      ctx.beginPath(); ctx.arc(cx-5, 22, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+1, 22, 2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = cfg.accent;
      ctx.beginPath(); ctx.moveTo(cx-2,28); ctx.lineTo(cx-5,22); ctx.lineTo(cx+1,25); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    // ── harpy ────────────────────────────────────────────────────────────────
    const harpy = (ctx, cfg, f) => {
      const cx = 32, wy = [0,-4,0,4][f];
      ctx.save();
      const ws = 16 + [0,4,0,0][f];
      ctx.fillStyle = cfg.body;
      ctx.beginPath(); ctx.moveTo(cx,32); ctx.lineTo(cx-ws,28+wy); ctx.lineTo(cx-ws+5,42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx,32); ctx.lineTo(cx+ws,28+wy); ctx.lineTo(cx+ws-5,42); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = cfg.accent; ctx.lineWidth = 1;
      for (let i=0;i<3;i++){
        ctx.beginPath(); ctx.moveTo(cx-6-i*4,38); ctx.lineTo(cx-8-i*4,43); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+6+i*4,38); ctx.lineTo(cx+8+i*4,43); ctx.stroke();
      }
      ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx-5,44); ctx.lineTo(cx-5,55); ctx.lineTo(cx-10,62); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+5,44); ctx.lineTo(cx+5,55); ctx.lineTo(cx+10,62); ctx.stroke();
      ctx.fillStyle = cfg.skin;
      ctx.beginPath(); ctx.ellipse(cx, 35, 7, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, 24, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#cc2200';
      ctx.beginPath(); ctx.arc(cx-3,23,1.8,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+3,23,1.8,0,Math.PI*2); ctx.fill();
      ctx.restore();
    };

    // ── golem ────────────────────────────────────────────────────────────────
    const golem = (ctx, cfg, f) => {
      const cx = 32;
      ctx.save(); ctx.translate(0, BOB[f] * 1.5);
      ctx.fillStyle = 'rgba(0,0,0,.32)';
      ctx.beginPath(); ctx.ellipse(cx, 63, 16, 4, 0, 0, Math.PI*2); ctx.fill();
      const ls = [0,4,0,-4][f];
      ctx.fillStyle = cfg.body;
      ctx.fillRect(cx-13+ls*.3, 48, 10, 14); ctx.fillRect(cx+3-ls*.3, 48, 10, 14);
      ctx.fillStyle = cfg.skin;
      ctx.fillRect(cx-15, 32, 30, 18);
      ctx.strokeStyle = cfg.accent; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx-5,32); ctx.lineTo(cx-3,44); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+7,35); ctx.lineTo(cx+4,47); ctx.stroke();
      ctx.fillStyle = cfg.body;
      ctx.fillRect(cx-21, 32, 8, 10); ctx.fillRect(cx+13, 32, 8, 10);
      ctx.fillStyle = cfg.skin;
      ctx.fillRect(cx-12, 18, 24, 16);
      ctx.fillStyle = cfg.accent;
      ctx.beginPath(); ctx.arc(cx-5,26,3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+5,26,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx-5,25.5,1.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+5,25.5,1.5,0,Math.PI*2); ctx.fill();
      ctx.restore();
    };

    // ── wyvern ───────────────────────────────────────────────────────────────
    const wyvern = (ctx, cfg, f) => {
      const cx = 32, wy = [0,-5,0,5][f];
      ctx.save();
      ctx.strokeStyle = cfg.body; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx+12,38); ctx.quadraticCurveTo(cx+24,30,cx+22,18); ctx.stroke();
      ctx.fillStyle = cfg.skin + 'aa';
      ctx.beginPath(); ctx.moveTo(cx-4,32); ctx.lineTo(cx-22,28+wy); ctx.lineTo(cx-18,42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx+4,32); ctx.lineTo(cx+22,26+wy); ctx.lineTo(cx+16,40); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cfg.body;
      ctx.beginPath(); ctx.ellipse(cx,38,12,10,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = cfg.body; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx-6,46); ctx.lineTo(cx-8,58); ctx.lineTo(cx-12,63); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+6,46); ctx.lineTo(cx+8,58); ctx.lineTo(cx+12,63); ctx.stroke();
      ctx.fillStyle = cfg.body;
      ctx.beginPath(); ctx.moveTo(cx-5,30); ctx.lineTo(cx+1,30); ctx.lineTo(cx+2,17); ctx.lineTo(cx-6,17); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cfg.skin;
      ctx.beginPath(); ctx.ellipse(cx-1,12,9,6,-.3,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx-10,11); ctx.lineTo(cx-17,10); ctx.lineTo(cx-12,14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = cfg.accent;
      ctx.beginPath(); ctx.arc(cx+2,11,2.5,0,Math.PI*2); ctx.fill();
      ctx.restore();
    };

    // ── definições por tipo ───────────────────────────────────────────────────
    const defs = {
      goblin:      { fn: humanoid, cfg: { body:'#2a7a38', skin:'#4caf64', leg:'#1e6b2e', accent:'#ffeb3b', eyes:'#ffeb3b', headR:8,  w:12, ears:true,  tusks:false, horns:false, wings:false, robes:false, armor:false, helmet:false, staff:false, skeleton:false, slim:false } },
      goblin_fast: { fn: humanoid, cfg: { body:'#1e6b2e', skin:'#3c9e50', leg:'#174f22', accent:'#ffc107', eyes:'#ffc107', headR:7,  w:10, ears:true,  tusks:false, horns:false, wings:false, robes:false, armor:false, helmet:false, staff:false, skeleton:false, slim:true  } },
      orc:         { fn: humanoid, cfg: { body:'#4a5c2a', skin:'#6b8a3a', leg:'#3d4d22', accent:'#8b6914', eyes:'#ff5722', headR:10, w:16, ears:false, tusks:true,  horns:false, wings:false, robes:false, armor:false, helmet:false, staff:false, skeleton:false, slim:false } },
      orc_armored: { fn: humanoid, cfg: { body:'#5a6040', skin:'#6b8a3a', leg:'#3d4d22', accent:'#c0a030', eyes:'#ff5722', headR:10, w:16, ears:false, tusks:true,  horns:false, wings:false, robes:false, armor:true,  helmet:false, staff:false, skeleton:false, slim:false } },
      troll:       { fn: troll,    cfg: { body:'#4a3560', skin:'#7a5a8a', accent:'#e8c44a' } },
      harpy:       { fn: harpy,    cfg: { body:'#7b3a10', skin:'#c87828', accent:'#ffd700' } },
      golem:       { fn: golem,    cfg: { body:'#506070', skin:'#708090', accent:'#60c0e0' } },
      necromancer: { fn: humanoid, cfg: { body:'#2a2a4a', skin:'#c8a882', leg:'#1a1a3a', accent:'#9b59b6', eyes:'#bb77ff', headR:8,  w:12, ears:false, tusks:false, horns:false, wings:false, robes:true,  armor:false, helmet:false, staff:true,  skeleton:false, slim:false } },
      wyvern:      { fn: wyvern,   cfg: { body:'#3d1a6e', skin:'#5c2c9e', accent:'#e74c3c' } },
      dark_knight: { fn: humanoid, cfg: { body:'#1a1a1a', skin:'#3a3a3a', leg:'#111111', accent:'#8b0000', eyes:'#ff0000', headR:10, w:16, ears:false, tusks:false, horns:false, wings:false, robes:false, armor:true,  helmet:true,  staff:false, skeleton:false, slim:false } },
      demon:       { fn: humanoid, cfg: { body:'#8b0000', skin:'#cc2200', leg:'#6b0000', accent:'#ff6600', eyes:'#ffcc00', headR:10, w:16, ears:false, tusks:false, horns:true,  wings:true,  robes:false, armor:false, helmet:false, staff:false, skeleton:false, slim:false } },
      lich:        { fn: humanoid, cfg: { body:'#1a1a2e', skin:'#d0d0d0', leg:'#111122', accent:'#7fff00', eyes:'#7fff00', headR:9,  w:12, ears:false, tusks:false, horns:false, wings:false, robes:true,  armor:false, helmet:false, staff:true,  skeleton:true,  slim:true  } },
    };

    for (const [type, { fn, cfg }] of Object.entries(defs)) {
      const canvas = document.createElement('canvas');
      canvas.width = FW * NF; canvas.height = FH;
      const c2 = canvas.getContext('2d');

      for (let f = 0; f < NF; f++) {
        c2.save(); c2.translate(f * FW, 0);
        fn(c2, cfg, f);
        c2.restore();
      }

      if (this.textures.exists(type)) this.textures.remove(type);
      this.textures.addCanvas(type, canvas);
      const tex = this.textures.get(type);
      for (let f = 0; f < NF; f++) tex.add(f, 0, f * FW, 0, FW, FH);

      this.anims.create({
        key: type + '_walk',
        frames: [
          { key: type, frame: 0 }, { key: type, frame: 1 },
          { key: type, frame: 2 }, { key: type, frame: 3 },
        ],
        frameRate: 6,
        repeat: -1
      });
    }
  }

  /**
   * Gera texturas procedurais para todas as torres (4 tipos × 3 níveis).
   * Substitui as PNGs estáticas por desenhos detalhados com cores e formas distintas.
   */
  generateTowerTextures() {
    const S = 48, cx = 24;
    const mk = (key, fn) => {
      const cv = document.createElement('canvas');
      cv.width = cv.height = S;
      fn(cv.getContext('2d'));
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addCanvas(key, cv);
    };

    // ── BARRACAS (edifício, não roda) ─────────────────────────────────────
    const bkCols = [
      { wall:'#6b4423', det:'#5a3015', roof:'#8b5530', door:'#2d1008' },
      { wall:'#7a7a7a', det:'#555',    roof:'#606060', door:'#333' },
      { wall:'#686868', det:'#444',    roof:'#505050', door:'#222' },
    ];
    ['tower_barracks','tower_barracks_2','tower_barracks_3'].forEach((key, lv) => {
      mk(key, ctx => {
        const c = bkCols[lv];
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.beginPath(); ctx.ellipse(cx,45,15,3,0,0,Math.PI*2); ctx.fill();

        if (lv === 2) {
          // Torres laterais
          ctx.fillStyle = c.wall;
          ctx.fillRect(0,18,10,26); ctx.fillRect(38,18,10,26);
          ctx.fillStyle = c.roof;
          [0,4,8,38,42,46].forEach(x => ctx.fillRect(x,14,3,6));
        }

        const wx = lv === 2 ? 8 : 4;
        const wy = lv === 1 ? 14 : 18;
        ctx.fillStyle = c.wall;
        ctx.fillRect(wx, wy, 48-wx*2, 26);

        // Textura das paredes
        ctx.strokeStyle = c.det; ctx.lineWidth = 1;
        if (lv === 0) {
          for (let y=21; y<44; y+=5) { ctx.beginPath(); ctx.moveTo(wx,y); ctx.lineTo(48-wx,y); ctx.stroke(); }
          for (let x=wx+4; x<44; x+=8) { ctx.beginPath(); ctx.moveTo(x,18); ctx.lineTo(x,44); ctx.stroke(); }
        } else {
          for (let r=0; r<4; r++) {
            const y = wy+3+r*6, off = (r%2)*4;
            for (let x=wx+off; x<44; x+=8) ctx.strokeRect(x,y,7,5);
          }
        }

        // Ameias (lv1+)
        if (lv >= 1) {
          ctx.fillStyle = c.roof;
          for (let x=wx; x<48-wx; x+=5) ctx.fillRect(x, lv===2?10:10, 3, 6);
        }

        // Telhado (lv0)
        if (lv === 0) {
          ctx.fillStyle = c.roof;
          ctx.beginPath(); ctx.moveTo(2,20); ctx.lineTo(cx,6); ctx.lineTo(46,20); ctx.closePath(); ctx.fill();
        }

        // Porta
        ctx.fillStyle = c.door;
        ctx.beginPath(); ctx.arc(cx,37,5,Math.PI,0); ctx.fill();
        ctx.fillRect(cx-5,37,10,7);

        // Bandeira (lv1+)
        if (lv >= 1) {
          ctx.strokeStyle='#909090'; ctx.lineWidth=1.2;
          const fy = lv===2 ? 3 : 9;
          ctx.beginPath(); ctx.moveTo(cx+2,fy); ctx.lineTo(cx+2,fy+10); ctx.stroke();
          ctx.fillStyle = lv===2 ? '#f0c040' : '#c82020';
          ctx.beginPath(); ctx.moveTo(cx+2,fy); ctx.lineTo(cx+12,fy+3); ctx.lineTo(cx+2,fy+6); ctx.closePath(); ctx.fill();
        }
      });
    });

    // ── ARQUEIROS (roda — flecha aponta para cima) ────────────────────────
    const archCols = [
      { base:'#7a5a30', rim:'#5a3a10', body:'#6a4a20', arrow:'#c8a060' },
      { base:'#808080', rim:'#505050', body:'#606060', arrow:'#c0a020' },
      { base:'#607060', rim:'#404040', body:'#505050', arrow:'#f0d040' },
    ];
    ['tower_archer','tower_archer_2','tower_archer_3'].forEach((key, lv) => {
      mk(key, ctx => {
        const c = archCols[lv];
        ctx.fillStyle='rgba(0,0,0,.2)';
        ctx.beginPath(); ctx.ellipse(cx,44,14,3,0,0,Math.PI*2); ctx.fill();

        ctx.fillStyle = c.base;
        ctx.beginPath(); ctx.arc(cx,32,14,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = c.rim; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx,32,14,0,Math.PI*2); ctx.stroke();
        if (lv >= 1) {
          ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1;
          ctx.beginPath(); ctx.arc(cx,32,8,0,Math.PI*2); ctx.stroke();
        }

        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.moveTo(cx-8,32); ctx.lineTo(cx-5,16); ctx.lineTo(cx+5,16); ctx.lineTo(cx+8,32); ctx.closePath(); ctx.fill();
        ctx.strokeStyle=c.rim; ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(cx-8,32); ctx.lineTo(cx-5,16); ctx.lineTo(cx+5,16); ctx.lineTo(cx+8,32); ctx.stroke();

        ctx.strokeStyle=c.arrow; ctx.lineWidth=2.5; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(cx,16); ctx.lineTo(cx,4); ctx.stroke();
        ctx.fillStyle=c.arrow;
        ctx.beginPath(); ctx.moveTo(cx,1); ctx.lineTo(cx-4,7); ctx.lineTo(cx+4,7); ctx.closePath(); ctx.fill();

        if (lv === 2) {
          ctx.fillStyle='#f0d040';
          ctx.beginPath(); ctx.arc(cx,16,3,0,Math.PI*2); ctx.fill();
          for (let a=0;a<Math.PI*2;a+=Math.PI/3) ctx.fillRect(cx+12*Math.cos(a)-1.5,32+12*Math.sin(a)-1.5,3,3);
        }
      });
    });

    // ── MAGOS (roda — orbe aponta para cima) ─────────────────────────────
    const mageCols = [
      { base:'#3a3060', rim:'#7050b0', staff:'#a07840', orb:'#9b59b6', glow:'#cc88ff' },
      { base:'#4a2070', rim:'#9040c0', staff:'#c09050', orb:'#c030e0', glow:'#ee88ff' },
      { base:'#202060', rim:'#5050d0', staff:'#c0c060', orb:'#4444dd', glow:'#8888ff' },
    ];
    ['tower_mage','tower_mage_2','tower_mage_3'].forEach((key, lv) => {
      mk(key, ctx => {
        const c = mageCols[lv];
        ctx.fillStyle='rgba(0,0,0,.2)';
        ctx.beginPath(); ctx.ellipse(cx,44,14,3,0,0,Math.PI*2); ctx.fill();

        ctx.fillStyle=c.base;
        ctx.beginPath(); ctx.arc(cx,30,15,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=c.rim; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(cx,30,15,0,Math.PI*2); ctx.stroke();

        ctx.strokeStyle=c.glow+'44'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.arc(cx,30,9,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx,30,4,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle=c.glow+'88';
        for (let a=0;a<Math.PI*2;a+=Math.PI/2)
          ctx.fillRect(cx+9*Math.cos(a)-1.5,30+9*Math.sin(a)-1.5,3,3);

        ctx.strokeStyle=c.staff; ctx.lineWidth=2.5; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(cx,17); ctx.lineTo(cx,6); ctx.stroke();

        const or = 5+lv*1.5;
        ctx.fillStyle=c.glow+'33';
        ctx.beginPath(); ctx.arc(cx,or+1,or+4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=c.orb;
        ctx.beginPath(); ctx.arc(cx,or+1,or,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=c.glow;
        ctx.beginPath(); ctx.arc(cx-or*.35,or-.2,or*.35,0,Math.PI*2); ctx.fill();
      });
    });

    // ── ARTILHARIA (roda — canhão aponta para cima) ───────────────────────
    const artCols = [
      { base:'#6a4a30', rim:'#4a3020', barrel:'#585858' },
      { base:'#484848', rim:'#303030', barrel:'#404040' },
      { base:'#383838', rim:'#202020', barrel:'#303030' },
    ];
    ['tower_artillery','tower_artillery_2','tower_artillery_3'].forEach((key, lv) => {
      mk(key, ctx => {
        const c = artCols[lv];
        const bw = 5+lv*1.5;
        ctx.fillStyle='rgba(0,0,0,.22)';
        ctx.beginPath(); ctx.ellipse(cx,44,16,4,0,0,Math.PI*2); ctx.fill();

        ctx.fillStyle=c.base;
        ctx.beginPath(); ctx.arc(cx,32,16,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=c.rim; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(cx,32,16,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx,32,10,0,Math.PI*2); ctx.stroke();

        ctx.fillStyle=c.barrel;
        ctx.fillRect(cx-bw/2,9,bw,22);
        ctx.fillStyle=c.rim;
        for (let y=11;y<28;y+=5) ctx.fillRect(cx-bw/2-1,y,bw+2,2);

        ctx.fillStyle='#222';
        ctx.beginPath(); ctx.arc(cx,9,bw*.75,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#444';
        ctx.beginPath(); ctx.arc(cx,9,bw*.38,0,Math.PI*2); ctx.fill();

        if (lv >= 1) {
          ctx.fillStyle='#606060';
          for (let a=0;a<Math.PI*2;a+=Math.PI/3)
            ctx.fillRect(cx+16*Math.cos(a)-1.5,32+16*Math.sin(a)-1.5,3,3);
        }
        if (lv === 2) {
          ctx.fillStyle=c.rim;
          ctx.fillRect(cx-bw/2-3,14,3,12);
          ctx.fillRect(cx+bw/2,14,3,12);
        }
      });
    });
  }

  /**
   * Gera spritesheet do soldado: idle (0-1), walk (2-5), attack (6-7), die (8-10).
   * Substitui a PNG estática 'soldier' por um sprite animado.
   */
  generateSoldierSpritesheet() {
    const FW = 48, FH = 48, TOTAL = 11;
    const canvas = document.createElement('canvas');
    canvas.width = FW * TOTAL; canvas.height = FH;
    const ctx = canvas.getContext('2d');

    const LEGL = [0,7,0,-7];
    const ARMR = [0,-7,0,7];

    const drawSoldier = (ctx, type, variant) => {
      const cx = 24;
      const isWalk = type === 'walk';
      const isAtk  = type === 'attack';
      const isDie  = type === 'die';
      const ll = isWalk ? LEGL[variant] : 0;
      const rl = isWalk ? -LEGL[variant] : 0;
      const bob = (type==='idle' && variant===1) ? -1 : 0;

      if (isDie && variant === 2) {
        // Frame morto: figura deitada
        ctx.save();
        ctx.translate(cx, 38); ctx.rotate(Math.PI/2 - 0.15);
        ctx.fillStyle='rgba(0,0,0,.18)';
        ctx.beginPath(); ctx.ellipse(0,12,12,3,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#8b5e3c'; ctx.fillRect(-10,-5,20,10);
        ctx.fillStyle='#b0b0b0'; ctx.fillRect(-12,-3,8,6);
        ctx.fillStyle='#909090'; ctx.beginPath(); ctx.arc(-14,0,6,0,Math.PI*2); ctx.fill();
        ctx.restore();
        return;
      }

      ctx.save(); ctx.translate(0, bob);

      // Sombra
      ctx.fillStyle='rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(cx,46,10,3,0,0,Math.PI*2); ctx.fill();

      // Pernas
      ctx.strokeStyle='#6b3a10'; ctx.lineWidth=4; ctx.lineCap='round';
      if (!isDie) {
        ctx.beginPath(); ctx.moveTo(cx-3,40); ctx.lineTo(cx-3+ll*.6,47); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+3,40); ctx.lineTo(cx+3+rl*.6,47); ctx.stroke();
        ctx.fillStyle='#4a2808';
        ctx.beginPath(); ctx.ellipse(cx-3+ll*.6,48,4,2.5,-.1,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+3+rl*.6,48,4,2.5,.1,0,Math.PI*2); ctx.fill();
      } else {
        // Die frame 0-1: ajoelhar
        const ky = variant===0 ? 40 : 44;
        ctx.fillStyle='#6b3a10';
        ctx.fillRect(cx-8,ky,7,48-ky); ctx.fillRect(cx+1,variant===0?43:45,7,48-ky);
      }

      // Corpo (couro + peitoral)
      ctx.fillStyle='#8b5e3c';
      ctx.beginPath(); ctx.ellipse(cx,33,8,9,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#b4b4b4';
      ctx.fillRect(cx-7,26,14,12);
      ctx.fillStyle='#c8c8c8';
      ctx.fillRect(cx-5,28,10,5);

      // Escudo (braço esquerdo)
      const shX = cx-13 + (isAtk ? (variant===0 ? -3 : 2) : (isWalk ? ARMR[variant]*.35 : 0));
      const shY = 30   + (isAtk ? (variant===0 ?  2 : 0) : (isWalk ? ARMR[variant]*.12 : 0));
      if (!isDie || variant < 2) {
        ctx.fillStyle='#7a3510';
        ctx.beginPath(); ctx.ellipse(shX,shY,5,6,.1,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#c0a030'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.ellipse(shX,shY,5,6,.1,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(shX-2.5,shY); ctx.lineTo(shX+2.5,shY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(shX,shY-4); ctx.lineTo(shX,shY+4); ctx.stroke();
      }

      // Espada (braço direito)
      const swX = cx+13 + (isAtk ? (variant===0 ? 2 : -2) : (isWalk ? -ARMR[variant]*.35 : 0));
      const swY = 29    + (isAtk ? (variant===0 ? -2 : 2) : (isWalk ? -ARMR[variant]*.12 : 0));
      const swAngle = isAtk ? (variant===0 ? -1.1 : 0.5) : -0.3;
      if (!isDie || variant < 2) {
        ctx.save();
        ctx.translate(swX,swY); ctx.rotate(swAngle);
        ctx.strokeStyle='#c8c8c8'; ctx.lineWidth=2.5; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-15); ctx.stroke();
        ctx.fillStyle='#c8c8c8'; ctx.fillRect(-4,-1,8,2);
        ctx.fillStyle='#d4b820'; ctx.fillRect(-1.5,-3,3,3);
        ctx.restore();
      }

      // Pescoço
      ctx.fillStyle='#c8a882'; ctx.fillRect(cx-2.5,21,5,5);

      // Cabeça — elmo
      ctx.fillStyle='#b0b0b0';
      ctx.beginPath(); ctx.arc(cx,18,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#909090';
      ctx.fillRect(cx-9,15,18,6);
      ctx.fillStyle='#1a1a1a';
      ctx.fillRect(cx-6,16,12,2.5);

      // Penacho
      if (!isDie) {
        ctx.strokeStyle='#cc1010'; ctx.lineWidth=1.8; ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(cx-4,10); ctx.quadraticCurveTo(cx,5,cx+3,9+bob); ctx.stroke();
      }

      ctx.restore();
    };

    const frames = [
      {t:'idle',v:0},{t:'idle',v:1},
      {t:'walk',v:0},{t:'walk',v:1},{t:'walk',v:2},{t:'walk',v:3},
      {t:'attack',v:0},{t:'attack',v:1},
      {t:'die',v:0},{t:'die',v:1},{t:'die',v:2},
    ];
    frames.forEach(({t,v},i) => {
      ctx.save(); ctx.translate(i*FW,0);
      drawSoldier(ctx,t,v);
      ctx.restore();
    });

    if (this.textures.exists('soldier')) this.textures.remove('soldier');
    this.textures.addCanvas('soldier', canvas);
    const tex = this.textures.get('soldier');
    for (let f=0;f<TOTAL;f++) tex.add(f,0,f*FW,0,FW,FH);

    this.anims.create({ key:'soldier_idle',   frames:[{key:'soldier',frame:0},{key:'soldier',frame:1}],               frameRate:3, repeat:-1 });
    this.anims.create({ key:'soldier_walk',   frames:[{key:'soldier',frame:2},{key:'soldier',frame:3},{key:'soldier',frame:4},{key:'soldier',frame:5}], frameRate:8, repeat:-1 });
    this.anims.create({ key:'soldier_attack', frames:[{key:'soldier',frame:6},{key:'soldier',frame:7}],               frameRate:8, repeat:0  });
    this.anims.create({ key:'soldier_die',    frames:[{key:'soldier',frame:8},{key:'soldier',frame:9},{key:'soldier',frame:10}], frameRate:5, repeat:0  });
  }

  /**
   * Gera apenas elementos de UI e partículas que não fazem sentido ter como ficheiro.
   * Sprites de jogo (torres, inimigos) vêm de /assets/images.
   */
  generateUITextures() {
    const mk = () => this.make.graphics({ add: false });

    // Slot de torre
    let g = mk();
    g.lineStyle(2, 0xffffff, 0.4); g.strokeRect(2,2,44,44);
    g.fillStyle(0xffffff, 0.06); g.fillRect(2,2,44,44);
    g.generateTexture('tower_slot', 48, 48); g.destroy();

    // Círculo de alcance
    g = mk();
    g.lineStyle(1, 0xffffff, 0.3); g.strokeCircle(128,128,126);
    g.fillStyle(0xffffff, 0.04); g.fillCircle(128,128,126);
    g.generateTexture('range_circle', 256, 256); g.destroy();

    // Explosão
    g = mk();
    for (let r = 48; r > 0; r -= 8) {
      const alpha = (48 - r) / 48;
      const color = r > 32 ? 0xff5722 : r > 16 ? 0xff9800 : 0xffeb3b;
      g.fillStyle(color, alpha * 0.8); g.fillCircle(48, 48, r);
    }
    g.generateTexture('explosion', 96, 96); g.destroy();

    // Meteoro
    g = mk();
    g.fillStyle(0xff5722); g.fillCircle(20,20,18);
    g.fillStyle(0xff9800); g.fillCircle(20,20,12);
    g.fillStyle(0xffeb3b); g.fillCircle(20,20,6);
    g.generateTexture('meteor', 40, 40); g.destroy();

    // Ícones HUD
    g = mk();
    g.fillStyle(0xe53935); g.fillCircle(8,8,7); g.fillCircle(20,8,7);
    g.fillTriangle(1,11,28,11,14,26);
    g.generateTexture('icon_heart', 28, 26); g.destroy();

    g = mk();
    g.fillStyle(0xfdd835); g.fillCircle(12,12,11);
    g.fillStyle(0xf9a825); g.fillCircle(12,12,7);
    g.generateTexture('icon_coin', 24, 24); g.destroy();

    // Ícones de poderes
    g = mk();
    g.fillStyle(0x1565c0, 0.8); g.fillRect(0,0,48,48);
    g.lineStyle(1, 0x42a5f5); g.strokeRect(0,0,48,48);
    g.generateTexture('icon_reinf', 48, 48); g.destroy();

    g = mk();
    g.fillStyle(0x8b0000, 0.8); g.fillRect(0,0,48,48);
    g.lineStyle(1, 0xef5350); g.strokeRect(0,0,48,48);
    g.fillStyle(0xff5722, 0.8); g.fillCircle(24,24,14);
    g.fillStyle(0xffeb3b, 0.9); g.fillCircle(24,24,8);
    g.generateTexture('icon_meteor', 48, 48); g.destroy();

    // Partículas
    g = mk(); g.fillStyle(0xffeb3b); g.fillCircle(4,4,3);
    g.generateTexture('particle_spark', 8, 8); g.destroy();
    g = mk(); g.fillStyle(0xb71c1c); g.fillCircle(4,4,3);
    g.generateTexture('particle_blood', 8, 8); g.destroy();
  }
}
