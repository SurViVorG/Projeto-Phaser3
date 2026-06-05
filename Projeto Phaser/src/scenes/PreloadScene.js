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
    // Gerar texturas auxiliares que não têm ficheiro (UI, partículas, range)
    this.generateUITextures();
    this.scene.start('MenuScene');
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
