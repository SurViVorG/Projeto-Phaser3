import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';

export default class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  init(data) {
    this.finalScore = data.score || 0;
    this.level      = data.level || 1;
    this.lives      = data.lives ?? 20;
  }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.fadeIn(800);
    this.cameras.main.setBackgroundColor('#0d1a0d');

    // ── Desbloquear próximo nível e guardar estrelas ─────────────────────────
    const nextLevel  = this.level + 1;
    if (nextLevel <= 4) {
      localStorage.setItem('kr_level_' + nextLevel, 'true');
    }
    const livesLost  = 20 - this.lives;
    const stars      = livesLost === 0 ? 3 : livesLost <= 5 ? 2 : 1;
    const prevStars  = parseInt(localStorage.getItem('kr_stars_' + this.level) ?? '0');
    localStorage.setItem('kr_stars_' + this.level, String(Math.max(stars, prevStars)));

    Settings.playSfx(this, 'sfx_victory');

    // Confetti
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const colors = [0xfdd835, 0x00e676, 0xffffff, 0xc8960c];
      const c = this.add.rectangle(
        x, Phaser.Math.Between(-20, 0),
        Phaser.Math.Between(4, 10), Phaser.Math.Between(4, 10),
        Phaser.Math.RND.pick(colors)
      );
      this.tweens.add({
        targets: c, y: H + 20,
        x: x + Phaser.Math.Between(-60, 60),
        rotation: Phaser.Math.Between(0, 10),
        duration: Phaser.Math.Between(2000, 5000),
        repeat: -1, delay: Phaser.Math.Between(0, 3000),
        ease: 'Sine.easeIn'
      });
    }

    // Título
    const title = this.add.text(640, 148, I18n.t('victory.title'), {
      fontFamily: 'Georgia, serif', fontSize: '80px',
      color: '#c8960c', stroke: '#3d2000', strokeThickness: 6
    }).setOrigin(0.5).setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 600, ease: 'Back.easeOut' });

    this.add.text(640, 253, I18n.t('victory.message'), {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#a5d6a7'
    }).setOrigin(0.5);

    // Estrelas — critério: ★★★ sem vidas perdidas · ★★ ≤5 · ★ concluído
    for (let i = 0; i < 3; i++) {
      const s = this.add.text(560 + i * 80, 315, i < stars ? '★' : '☆', {
        fontFamily: 'Georgia, serif', fontSize: '52px',
        color: i < stars ? '#fdd835' : '#555'
      }).setOrigin(0.5).setScale(0);
      this.tweens.add({ targets: s, scale: 1, duration: 400,
        delay: 600 + i * 200, ease: 'Back.easeOut' });
    }

    // Critérios (pequeno texto abaixo das estrelas)
    const criteriaColor = livesLost === 0 ? '#fdd835' : livesLost <= 5 ? '#aaa' : '#555';
    const criteriaMsg   = livesLost === 0
      ? '★★★ Sem vidas perdidas!'
      : livesLost <= 5
        ? '★★  ' + livesLost + (livesLost === 1 ? ' vida perdida' : ' vidas perdidas')
        : '★    ' + livesLost + ' vidas perdidas';
    this.add.text(640, 362, criteriaMsg, {
      fontFamily: 'monospace', fontSize: '14px', color: criteriaColor
    }).setOrigin(0.5);

    // Score
    this.add.text(640, 396, I18n.t('victory.score') + ': ' + this.finalScore, {
      fontFamily: 'monospace', fontSize: '26px', color: '#fdd835'
    }).setOrigin(0.5);

    // Vidas restantes
    this.add.text(640, 432, '❤ ' + this.lives + '/20 ' + I18n.t('hud.lives'), {
      fontFamily: 'monospace', fontSize: '16px',
      color: this.lives === 20 ? '#00e676' : this.lives >= 15 ? '#fdd835' : '#ef9a9a'
    }).setOrigin(0.5);

    // Próximo nível desbloqueado / jogo concluído
    if (nextLevel <= 4) {
      this.add.text(640, 468, '🔓 Nível ' + nextLevel + ' desbloqueado!', {
        fontFamily: 'Georgia, serif', fontSize: '20px', color: '#00e676'
      }).setOrigin(0.5);
    } else {
      this.add.text(640, 468, '🏆 Jogo concluído! O reino está salvo!', {
        fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f0c040'
      }).setOrigin(0.5);
    }

    // Botões
    this.createBtn(640, 528, '↺  ' + I18n.t('gameover.retry'), () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('GameScene', { level: this.level }));
    }, '#a5d6a7');

    this.createBtn(640, 608, '⌂  ' + I18n.t('victory.menu'), () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () =>
        this.scene.start('MapScene'));
    }, '#c8960c');

    this.input.keyboard.on('keydown-R', () =>
      this.scene.start('GameScene', { level: this.level }));
  }

  createBtn(x, y, label, cb, color = '#fff') {
    const btn = this.add.text(x, y, label, {
      fontFamily: 'Georgia, serif', fontSize: '24px',
      color, backgroundColor: '#1a0f00',
      padding: { x: 28, y: 12 }, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { btn.setScale(1.06); Settings.playSfx(this, 'sfx_btn'); });
    btn.on('pointerout',  () => btn.setScale(1));
    btn.on('pointerdown', cb);
  }
}
