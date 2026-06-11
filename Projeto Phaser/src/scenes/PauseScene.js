import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';
import { makeButton, makeToggle, makeSlider, makeLangSelector } from '../utils/UI.js';

/**
 * PauseScene — menu de pausa sobreposto ao jogo.
 * Usa as funções partilhadas de UI.js (makeButton, makeSlider, etc),
 * as mesmas que o menu principal pode usar — sem duplicação de código.
 */
export default class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  init(data) {
    this.gameScene    = data.gameScene;
    this.level        = data.level || 1;
    this._langChanged = false;
  }

  create() {
    const W = 1280, H = 720;
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7).setInteractive();
    this.cx = W/2; this.cy = H/2;
    this._objs = [];
    this.buildMainMenu();

    this.input.keyboard.on('keydown-ESC', () => this.resume());
    this.input.keyboard.on('keydown-P',   () => this.resume());
  }

  clearObjs() {
    this._objs.forEach(o => o.destroy && o.destroy());
    this._objs = [];
  }

  // ── MENU PRINCIPAL DA PAUSA ─────────────────────────────────────────────────
  buildMainMenu() {
    this.clearObjs();
    const cx = this.cx, cy = this.cy;

    this.drawPanel(cx - 200, cy - 230, 400, 460, 0xc8960c);
    this._objs.push(this.add.text(cx, cy - 180, '⏸ ' + I18n.t('pause.title'), {
      fontFamily: 'Georgia, serif', fontSize: '40px',
      color: '#c8960c', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5));

    const items = [
      { label: '▶ ' + I18n.t('pause.resume'),  cb: () => this.resume(),       color: '#00e676' },
      { label: '↺ ' + I18n.t('pause.restart'), cb: () => this.restart(),      color: '#fdd835' },
      { label: '⚙ ' + I18n.t('pause.options'), cb: () => this.buildOptions(), color: '#42a5f5' },
      { label: '⌂ ' + I18n.t('pause.menu'),    cb: () => this.toMenu(),       color: '#ef5350' }
    ];
    // UMA função gera todos os botões, no local indicado
    items.forEach((it, i) => {
      this._objs.push(makeButton(this, {
        x: cx, y: cy - 90 + i * 80,
        label: it.label, onClick: it.cb, color: it.color
      }));
    });
  }

  // ── OPÇÕES (mesma UI partilhada) ────────────────────────────────────────────
  buildOptions() {
    this.clearObjs();
    const cx = this.cx, cy = this.cy;

    this.drawPanel(cx - 240, cy - 268, 480, 556, 0x42a5f5);
    this._objs.push(this.add.text(cx, cy - 222, '⚙ ' + I18n.t('options.title'), {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: '#42a5f5',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5));

    this._objs.push(makeToggle(this, {
      x: cx, y: cy - 165, label: I18n.t('options.music'), initial: Settings.musicOn,
      onChange: (v) => { Settings.setMusic(v); if (v && this.gameScene) Settings.playMusic(this.gameScene, 'music_battle'); }
    }));
    this._objs.push(makeToggle(this, {
      x: cx, y: cy - 110, label: I18n.t('options.sfx'), initial: Settings.sfxOn,
      onChange: (v) => Settings.setSfx(v)
    }));
    this._objs.push(makeToggle(this, {
      x: cx, y: cy - 55, label: I18n.t('options.dmg_numbers'), initial: Settings.dmgNumbers,
      onChange: (v) => Settings.setDmgNumbers(v)
    }));
    this._objs.push(makeSlider(this, {
      x: cx, y: cy + 5, label: I18n.t('options.music') + ' Vol',
      initial: Settings.musicVolume, onChange: (v) => Settings.setMusicVolume(v)
    }));
    this._objs.push(makeSlider(this, {
      x: cx, y: cy + 65, label: I18n.t('options.sfx') + ' Vol',
      initial: Settings.sfxVolume, onChange: (v) => Settings.setSfxVolume(v)
    }));

    this._objs.push(this.add.text(cx - 180, cy + 128, I18n.t('options.language'), {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#d4a56a'
    }).setOrigin(0, 0.5));

    this._objs.push(makeLangSelector(this, {
      x: cx + 20, y: cy + 128, langs: I18n.availableLangs(), current: I18n.getLang(),
      onChange: (lang) => {
        I18n.setLang(lang);
        this._langChanged = true;
        this.buildOptions();
      }
    }));

    this._objs.push(makeButton(this, {
      x: cx, y: cy + 210, label: '← ' + I18n.t('options.back'),
      onClick: () => this.buildMainMenu(), color: '#c8960c'
    }));
  }

  // ── HELPER de painel ────────────────────────────────────────────────────────
  drawPanel(x, y, w, h, lineColor) {
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f00, 0.97);
    bg.fillRoundedRect(x, y, w, h, 14);
    bg.lineStyle(3, lineColor, 0.9);
    bg.strokeRoundedRect(x, y, w, h, 14);
    this._objs.push(bg);
  }

  // ── AÇÕES ─────────────────────────────────────────────────────────────────
  resume() {
    if (this._langChanged && this.gameScene?.rebuildHUD) this.gameScene.rebuildHUD();
    this.scene.resume('GameScene');
    this.scene.stop();
  }
  restart() {
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('GameScene', { level: this.level });
  }
  toMenu() {
    Settings.stopMusic();
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('MenuScene');
  }
}
