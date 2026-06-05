import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';

// Lê desbloqueios do localStorage
function getLevels() {
  return [
    { id: 1, name: 'Floresta Sombria',     nameEN: 'Dark Forest',      x: 220, y: 400, unlocked: true,
      waves: 6, stars: parseInt(localStorage.getItem('kr_stars_1') ?? '0') },
    { id: 2, name: 'Ruínas Antigas',       nameEN: 'Ancient Ruins',    x: 460, y: 280, unlocked: localStorage.getItem('kr_level_2') === 'true',
      waves: 7, stars: parseInt(localStorage.getItem('kr_stars_2') ?? '0') },
    { id: 3, name: 'Fortaleza do Caos',    nameEN: 'Chaos Fortress',   x: 700, y: 430, unlocked: localStorage.getItem('kr_level_3') === 'true',
      waves: 8, stars: parseInt(localStorage.getItem('kr_stars_3') ?? '0') },
    { id: 4, name: 'Covil do Demônio',     nameEN: 'Demon Lair',       x: 960, y: 310, unlocked: localStorage.getItem('kr_level_4') === 'true',
      waves: 8, stars: parseInt(localStorage.getItem('kr_stars_4') ?? '0') }
  ];
}

export default class MapScene extends Phaser.Scene {
  constructor() { super({ key: 'MapScene' }); }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.cameras.main.fadeIn(500);

    // Fundo
    this.add.rectangle(640, 500, 1280, 440, 0x2d5a27);
    this.add.rectangle(640, 200, 1280, 400, 0x0a1628);

    // Montanhas
    const mts = this.add.graphics();
    mts.fillStyle(0x1a3a1a);
    mts.fillTriangle(100, 480, 300, 200, 500, 480);
    mts.fillTriangle(400, 480, 650, 160, 900, 480);
    mts.fillTriangle(800, 480, 1050, 220, 1280, 480);
    mts.fillStyle(0xffffff, 0.5);
    mts.fillTriangle(260, 228, 300, 200, 340, 228);
    mts.fillTriangle(610, 183, 650, 160, 690, 183);

    // Estrelas
    for (let i = 0; i < 100; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, 360),
        Phaser.Math.FloatBetween(0.5, 1.8), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.9)
      );
    }

    // Linha de caminho entre níveis
    const LEVELS = getLevels();
    const pathLine = this.add.graphics();
    pathLine.lineStyle(4, 0xc8960c, 0.4);
    for (let i = 0; i < LEVELS.length - 1; i++)
      pathLine.lineBetween(LEVELS[i].x, LEVELS[i].y, LEVELS[i+1].x, LEVELS[i+1].y);

    // Título
    this.add.text(640, 50, I18n.t('map.title'), {
      fontFamily: 'Georgia, serif', fontSize: '40px',
      color: '#c8960c', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // Nós de nível
    LEVELS.forEach((lvl, idx) => this.createLevelNode(lvl, idx));

    // Botão voltar
    const back = this.add.text(80, 680, '← ' + I18n.t('map.back'), {
      fontFamily: 'Georgia, serif', fontSize: '20px',
      color: '#d4a56a', backgroundColor: '#1a0f00',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#f0c040'));
    back.on('pointerout',  () => back.setColor('#d4a56a'));
    back.on('pointerdown', () => {
      Settings.playSfx(this, 'sfx_btn');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });

    // Seletor de língua
    this.createLangSelector(W - 100, 30);
  }

  createLevelNode(lvl, idx) {
    const container = this.add.container(lvl.x, lvl.y);
    const size = 50;

    const shadow = this.add.circle(3, 3, size + 4, 0x000000, 0.4);
    const circle = this.add.circle(0, 0, size, lvl.unlocked ? 0xc8960c : 0x444444);
    const border = this.add.graphics();
    border.lineStyle(3, lvl.unlocked ? 0xf0c040 : 0x666666);
    border.strokeCircle(0, 0, size);

    const label = this.add.text(0, 0, lvl.unlocked ? String(lvl.id) : '🔒', {
      fontFamily: 'Georgia, serif', fontSize: '28px',
      color: lvl.unlocked ? '#fff' : '#888',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    const displayName = I18n.getLang() === 'en' ? (lvl.nameEN || lvl.name) : lvl.name;
    const name = this.add.text(0, size + 18, displayName, {
      fontFamily: 'Georgia, serif', fontSize: '14px',
      color: lvl.unlocked ? '#d4a56a' : '#666',
      stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    // Estrelas conquistadas
    const starsStr = lvl.unlocked && lvl.stars > 0
      ? '★'.repeat(lvl.stars) + '☆'.repeat(3 - lvl.stars)
      : lvl.unlocked ? '☆☆☆' : '';
    const starsText = this.add.text(0, size + 36, starsStr, {
      fontFamily: 'Georgia, serif', fontSize: '14px',
      color: '#fdd835'
    }).setOrigin(0.5);

    // Vagas
    const wavesText = lvl.unlocked
      ? this.add.text(0, size + 52, lvl.waves + ' vagas', {
          fontFamily: 'monospace', fontSize: '11px', color: '#888'
        }).setOrigin(0.5)
      : this.add.text(0, 0, '', {});

    container.add([shadow, circle, border, label, name, starsText, wavesText]);
    container.setSize(size * 2 + 10, size * 2 + 10);
    container.setInteractive({ useHandCursor: lvl.unlocked });

    if (lvl.unlocked) {
      this.tweens.add({
        targets: container, scaleX: 1.06, scaleY: 1.06,
        duration: 900, yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut', delay: idx * 200
      });

      container.on('pointerover', () => {
        circle.setFillStyle(0xf0c040);
        this.tweens.add({ targets: container, scaleX: 1.12, scaleY: 1.12, duration: 100 });
      });
      container.on('pointerout', () => {
        circle.setFillStyle(0xc8960c);
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
      });
      container.on('pointerdown', () => {
        Settings.playSfx(this, 'sfx_btn');
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene', { level: lvl.id });
        });
      });
    } else {
      container.on('pointerdown', () => this.showLockedTooltip(lvl.x, lvl.y - 80));
    }
  }

  showLockedTooltip(x, y) {
    const tip = this.add.text(x, y, '🔒 ' + I18n.t('map.locked'), {
      fontFamily: 'monospace', fontSize: '16px', color: '#ef5350',
      backgroundColor: '#1a0f00', padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: tip, alpha: 0, y: y - 30, duration: 1200,
      onComplete: () => tip.destroy() });
  }

  createLangSelector(x, y) {
    I18n.availableLangs().forEach((lang, i) => {
      const isActive = I18n.getLang() === lang;
      const btn = this.add.text(x + i * 60 - 30, y, lang.toUpperCase(), {
        fontFamily: 'monospace', fontSize: '15px',
        color: isActive ? '#f0c040' : '#888',
        backgroundColor: isActive ? '#3d2000' : '#111',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => { I18n.setLang(lang); this.scene.restart(); });
    });
  }
}
