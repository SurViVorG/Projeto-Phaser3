import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.setBackgroundColor('#0d0d1a');

    // ─── FUNDO ────────────────────────────────────────────────────────────────
    // Gradiente de fundo simulado com rectângulos
    for (let i = 0; i < 10; i++) {
      this.add.rectangle(640, i * 72 + 36, 1280, 72,
        Phaser.Display.Color.Interpolate.ColorWithColor(
          { r: 13,  g: 13,  b: 26  },
          { r: 30,  g: 15,  b: 5   },
          10, i
        ).color, 0.8);
    }

    // Estrelas no fundo
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.FloatBetween(0.5, 2);
      const a = Phaser.Math.FloatBetween(0.3, 1);
      this.add.circle(x, y, r, 0xffffff, a);
    }

    // ─── TÍTULO ───────────────────────────────────────────────────────────────
    this.add.text(640, 140, 'KINGDOM RUSH', {
      fontFamily: 'Georgia, serif',
      fontSize: '72px',
      color: '#c8960c',
      stroke: '#3d2000',
      strokeThickness: 8,
      shadow: { color: '#000', blur: 20, fill: true }
    }).setOrigin(0.5);

    this.add.text(640, 215, I18n.t('menu.subtitle'), {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#d4a56a',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Linha decorativa
    const line = this.add.graphics();
    line.lineStyle(2, 0xc8960c, 0.6);
    line.lineBetween(240, 240, 1040, 240);

    // ─── BOTÕES ───────────────────────────────────────────────────────────────
    this.createMenuBtn(640, 330, I18n.t('menu.play'),    () => this.scene.start('MapScene'));
    this.createMenuBtn(640, 410, I18n.t('menu.options'), () => {
      Settings.playSfx(this, 'sfx_btn');
      this.scene.start('OptionsScene');
    });
    this.createMenuBtn(640, 490, I18n.t('menu.credits'), () => this.showCredits());

    // ─── SELETOR DE LÍNGUA ────────────────────────────────────────────────────
    this.createLangSelector(W - 120, 30);

    // ─── VERSÃO ───────────────────────────────────────────────────────────────
    this.add.text(W - 10, H - 10, 'v1.0 — TP2 TM 2025/2026', {
      fontFamily: 'monospace', fontSize: '12px', color: '#444'
    }).setOrigin(1, 1);

    // Animação de entrada
    this.cameras.main.fadeIn(600);

    Settings.playMusic(this, 'sfx_wave_start'); // placeholder até ter música real
  }

  createMenuBtn(x, y, label, callback) {
    const W = 280, H = 54;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f00, 0.85);
    bg.fillRoundedRect(-W/2, -H/2, W, H, 8);
    bg.lineStyle(2, 0xc8960c, 0.8);
    bg.strokeRoundedRect(-W/2, -H/2, W, H, 8);

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#e8d5a3',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(W, H);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3d2000, 0.95);
      bg.fillRoundedRect(-W/2, -H/2, W, H, 8);
      bg.lineStyle(2, 0xf0c040);
      bg.strokeRoundedRect(-W/2, -H/2, W, H, 8);
      txt.setColor('#f0d060');
      this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 80 });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a0f00, 0.85);
      bg.fillRoundedRect(-W/2, -H/2, W, H, 8);
      bg.lineStyle(2, 0xc8960c, 0.8);
      bg.strokeRoundedRect(-W/2, -H/2, W, H, 8);
      txt.setColor('#e8d5a3');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
    });

    container.on('pointerdown', () => {
      Settings.playSfx(this, 'sfx_btn');
      callback();
    });

    return container;
  }

  createLangSelector(x, y) {
    const langs = I18n.availableLangs();
    let cx = x - (langs.length - 1) * 35;

    for (const lang of langs) {
      const isActive = I18n.getLang() === lang;
      const btn = this.add.text(cx, y, lang.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: isActive ? '#f0c040' : '#888',
        backgroundColor: isActive ? '#3d2000' : '#111',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        I18n.setLang(lang);
        Settings.playSfx(this, 'sfx_btn');
        this.scene.restart();
      });

      cx += 70;
    }
  }

  showCredits() {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85).setDepth(10);
    const panel   = this.add.rectangle(640, 360, 560, 300, 0x1a0f00, 0.97).setDepth(11)
      .setStrokeStyle(2, 0xc8960c);

    const title = this.add.text(640, 240, 'Créditos / Credits', {
      fontFamily: 'Georgia, serif', fontSize: '28px', color: '#c8960c'
    }).setOrigin(0.5).setDepth(12);

    const body = this.add.text(640, 350,
      'Trabalho Prático 2\nTecnologias Multimédia 2025/2026\n\nPhaser 3 — phaser.io\n\nClica para fechar / Click to close', {
      fontFamily: 'monospace', fontSize: '16px', color: '#d4a56a',
      align: 'center', lineSpacing: 8
    }).setOrigin(0.5).setDepth(12);

    overlay.setInteractive();
    overlay.once('pointerdown', () => {
      [overlay, panel, title, body].forEach(o => o.destroy());
    });
  }
}
