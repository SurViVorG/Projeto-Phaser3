import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';

export default class OptionsScene extends Phaser.Scene {
  constructor() { super({ key: 'OptionsScene' }); }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.cameras.main.fadeIn(400);

    // Fundo semitransparente
    this.add.rectangle(640, 360, 1280, 720, 0x0d0d1a);

    // Estrelas de fundo
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 1.5), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.7));
    }

    // Painel central
    const panel = this.add.graphics();
    panel.fillStyle(0x1a0f00, 0.95);
    panel.fillRoundedRect(340, 100, 600, 500, 12);
    panel.lineStyle(2, 0xc8960c, 0.8);
    panel.strokeRoundedRect(340, 100, 600, 500, 12);

    // Título
    this.add.text(640, 150, I18n.t('options.title'), {
      fontFamily: 'Georgia, serif', fontSize: '40px',
      color: '#c8960c', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // Linha decorativa
    const g = this.add.graphics();
    g.lineStyle(1, 0xc8960c, 0.4);
    g.lineBetween(360, 185, 920, 185);

    let rowY = 240;

    // ─── MÚSICA ───────────────────────────────────────────────────────────────
    this.addToggleRow(rowY, I18n.t('options.music'), Settings.musicOn, (val) => {
      Settings.setMusic(val);
      if (!val) Settings.stopMusic(); else Settings.playMusic(this, 'sfx_wave_start');
    });
    rowY += 80;

    // ─── SFX ──────────────────────────────────────────────────────────────────
    this.addToggleRow(rowY, I18n.t('options.sfx'), Settings.sfxOn, (val) => {
      Settings.setSfx(val);
    });
    rowY += 80;

    // ─── VOLUME MÚSICA ────────────────────────────────────────────────────────
    this.addSliderRow(rowY, I18n.t('options.music') + ' Vol', Settings.musicVolume, (val) => {
      Settings.setMusicVolume(val);
    });
    rowY += 80;

    // ─── VOLUME SFX ───────────────────────────────────────────────────────────
    this.addSliderRow(rowY, I18n.t('options.sfx') + ' Vol', Settings.sfxVolume, (val) => {
      Settings.setSfxVolume(val);
    });
    rowY += 80;

    // ─── LÍNGUA ───────────────────────────────────────────────────────────────
    this.add.text(400, rowY, I18n.t('options.language'), {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#d4a56a'
    }).setOrigin(0, 0.5);

    const langs = I18n.availableLangs();
    langs.forEach((lang, i) => {
      const isActive = I18n.getLang() === lang;
      const btn = this.add.text(700 + i * 90, rowY, lang.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '18px',
        color: isActive ? '#f0c040' : '#888',
        backgroundColor: isActive ? '#3d2000' : '#1a1a2e',
        padding: { x: 12, y: 6 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        I18n.setLang(lang);
        Settings.playSfx(this, 'sfx_btn');
        this.scene.restart();
      });
    });
    rowY += 80;

    // ─── BOTÃO VOLTAR ─────────────────────────────────────────────────────────
    this.createBackBtn(640, rowY);
  }

  addToggleRow(y, label, initialValue, onChange) {
    this.add.text(400, y, label, {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#d4a56a'
    }).setOrigin(0, 0.5);

    let state = initialValue;

    const btn = this.add.text(750, y, state ? I18n.t('options.on') : I18n.t('options.off'), {
      fontFamily: 'monospace', fontSize: '18px',
      color: state ? '#00e676' : '#ef5350',
      backgroundColor: '#111',
      padding: { x: 14, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      state = !state;
      btn.setText(state ? I18n.t('options.on') : I18n.t('options.off'));
      btn.setColor(state ? '#00e676' : '#ef5350');
      Settings.playSfx(this, 'sfx_btn');
      onChange(state);
    });
  }

  addSliderRow(y, label, initialValue, onChange) {
    this.add.text(400, y, label, {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#d4a56a'
    }).setOrigin(0, 0.5);

    const TRACK_X = 650, TRACK_W = 200;
    const track = this.add.graphics();
    track.lineStyle(2, 0x555);
    track.lineBetween(TRACK_X, y, TRACK_X + TRACK_W, y);

    let val = initialValue;
    const thumb = this.add.circle(TRACK_X + val * TRACK_W, y, 10, 0xc8960c)
      .setInteractive({ useHandCursor: true });

    const valText = this.add.text(TRACK_X + TRACK_W + 20, y,
      Math.round(val * 100) + '%', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888'
    }).setOrigin(0, 0.5);

    thumb.on('pointerdown', (ptr) => {
      this._dragging = { thumb, TRACK_X, TRACK_W, onChange, valText };
    });

    this.input.on('pointermove', (ptr) => {
      if (!this._dragging) return;
      const { thumb, TRACK_X, TRACK_W, onChange, valText } = this._dragging;
      const nx = Phaser.Math.Clamp(ptr.x, TRACK_X, TRACK_X + TRACK_W);
      thumb.setX(nx);
      const newVal = (nx - TRACK_X) / TRACK_W;
      valText.setText(Math.round(newVal * 100) + '%');
      onChange(newVal);
    });

    this.input.on('pointerup', () => { this._dragging = null; });
  }

  createBackBtn(x, y) {
    const W = 200, H = 50;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f00, 0.9);
    bg.fillRoundedRect(-W/2, -H/2, W, H, 8);
    bg.lineStyle(2, 0xc8960c, 0.8);
    bg.strokeRoundedRect(-W/2, -H/2, W, H, 8);

    const txt = this.add.text(0, 0, I18n.t('options.back'), {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#e8d5a3'
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
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a0f00, 0.9);
      bg.fillRoundedRect(-W/2, -H/2, W, H, 8);
      bg.lineStyle(2, 0xc8960c, 0.8);
      bg.strokeRoundedRect(-W/2, -H/2, W, H, 8);
      txt.setColor('#e8d5a3');
    });

    container.on('pointerdown', () => {
      Settings.playSfx(this, 'sfx_btn');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }
}
