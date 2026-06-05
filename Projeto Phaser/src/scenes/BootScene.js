import I18n from '../utils/I18n.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    // Ecrã de boot simples
    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.add.text(640, 340, 'KINGDOM RUSH', {
      fontFamily: 'serif',
      fontSize: '48px',
      color: '#c8960c',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(640, 400, 'A carregar...', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // Pequeno delay para o ecrã aparecer
    this.time.delayedCall(300, () => {
      this.scene.start('PreloadScene');
    });
  }
}
