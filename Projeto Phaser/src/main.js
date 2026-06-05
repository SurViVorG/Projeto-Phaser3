import Phaser from 'phaser';
import BootScene    from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MenuScene    from './scenes/MenuScene.js';
import OptionsScene from './scenes/OptionsScene.js';
import MapScene     from './scenes/MapScene.js';
import GameScene    from './scenes/GameScene.js';
import PauseScene   from './scenes/PauseScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene  from './scenes/VictoryScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [
    BootScene,
    PreloadScene,
    MenuScene,
    OptionsScene,
    MapScene,
    GameScene,
    PauseScene,
    GameOverScene,
    VictoryScene
  ]
};

export default new Phaser.Game(config);
