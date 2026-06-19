import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';

// ─── GAME OVER ───────────────────────────────────────────────────────────────
export default class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.finalScore = data.score || 0;
    this.level      = data.level || 1;
  }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.fadeIn(600);
    this.cameras.main.setBackgroundColor('#0d0d1a');

    Settings.playSfx(this, 'sfx_gameover');

    // Fundo escuro com partículas caindo
    this.add.rectangle(640, 360, W, H, 0x0d0d1a);
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const c = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 3), 0xb71c1c,
        Phaser.Math.FloatBetween(0.2, 0.7));
      this.tweens.add({
        targets: c, y: H + 20, duration: Phaser.Math.Between(3000, 8000),
        repeat: -1, delay: Phaser.Math.Between(0, 5000)
      });
    }

    // Título
    this.add.text(640, 180, I18n.t('gameover.title'), {
      fontFamily: 'Georgia, serif', fontSize: '80px',
      color: '#b71c1c', stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(640, 280, I18n.t('gameover.message'), {
      fontFamily: 'Georgia, serif', fontSize: '28px', color: '#d4a56a'
    }).setOrigin(0.5);

    // Score
    this.add.text(640, 350, I18n.t('gameover.score') + ': ' + this.finalScore, {
      fontFamily: 'monospace', fontSize: '32px', color: '#fdd835'
    }).setOrigin(0.5);

    // Botões
    this.createBtn(640, 460, I18n.t('gameover.retry'), () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { level: this.level });
      });
    }, '#00e676');

    this.createBtn(640, 540, I18n.t('gameover.menu'), () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    }, '#d4a56a');

    // Tecla R
    this.input.keyboard.on('keydown-R', () => {
      this.scene.start('GameScene', { level: this.level });
    });
  }

  createBtn(x, y, label, cb, color = '#fff') {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif', fontSize: '26px',
      color, backgroundColor: '#1a0f00',
      padding: { x: 28, y: 12 }, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { btn.setScale(1.06); Settings.playSfx(this, 'sfx_btn'); });
    btn.on('pointerout',  () => btn.setScale(1));
    btn.on('pointerdown', cb);
  }
}

// ─── VICTORY ─────────────────────────────────────────────────────────────────
export class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  init(data) {
    this.finalScore = data.score || 0;
    this.level      = data.level || 1;
  }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.fadeIn(800);
    this.cameras.main.setBackgroundColor('#0d1a0d');

    Settings.playSfx(this, 'sfx_victory');

    // Confetti dourado
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const colors = [0xfdd835, 0x00e676, 0xffffff, 0xc8960c];
      const c = this.add.rectangle(
        x, Phaser.Math.Between(-20, 0),
        Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10),
        Phaser.Math.RND.pick(colors)
      );
      this.tweens.add({
        targets: c,
        y: H + 20,
        x: x + Phaser.Math.Between(-60, 60),
        rotation: Phaser.Math.Between(0, 10),
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        ease: 'Sine.easeIn'
      });
    }

    // Título
    this.add.text(640, 160, I18n.t('victory.title'), {
      fontFamily: 'Georgia, serif', fontSize: '80px',
      color: '#c8960c', stroke: '#3d2000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(640, 260, I18n.t('victory.message'), {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#a5d6a7'
    }).setOrigin(0.5);

    // Estrelas (baseadas no score)
    const stars = this.finalScore > 2000 ? 3 : this.finalScore > 1000 ? 2 : 1;
    for (let i = 0; i < 3; i++) {
      const starTxt = this.add.text(560 + i * 80, 330,
        i < stars ? '★' : '☆', {
        fontFamily: 'Georgia, serif', fontSize: '52px',
        color: i < stars ? '#fdd835' : '#555'
      }).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: starTxt, scale: 1,
        duration: 400, delay: 600 + i * 200,
        ease: 'Back.easeOut'
      });
    }

    // Score
    this.add.text(640, 410, I18n.t('victory.score') + ': ' + this.finalScore, {
      fontFamily: 'monospace', fontSize: '28px', color: '#fdd835'
    }).setOrigin(0.5);

    // Botões
    this.createBtn(640, 500, I18n.t('victory.menu'), () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    }, '#c8960c');

    this.input.keyboard.on('keydown-R', () => {
      this.scene.start('GameScene', { level: this.level });
    });
  }

  createBtn(x, y, label, cb, color = '#fff') {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif', fontSize: '26px',
      color, backgroundColor: '#1a0f00',
      padding: { x: 28, y: 12 }, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => { btn.setScale(1.06); Settings.playSfx(this, 'sfx_btn'); });
    btn.on('pointerout',  () => btn.setScale(1));
    btn.on('pointerdown', cb);
  }
}
