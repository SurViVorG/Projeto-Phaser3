import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';
import { TOWER_DATA, sellValue } from '../utils/TowerData.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this._towerPanel  = null;
    this._rangeCircle = null;
    this._powerCooldowns = {};
    this._objects = [];

    // Intercetar scene.add durante o build para registar tudo automaticamente
    const factory = scene.add;
    const methods = ['text', 'image', 'rectangle', 'graphics', 'container', 'circle'];
    const originals = {};
    for (const m of methods) {
      originals[m] = factory[m].bind(factory);
      factory[m] = (...args) => {
        const obj = originals[m](...args);
        this._objects.push(obj);
        return obj;
      };
    }

    this.build();

    // Restaurar os métodos originais
    for (const m of methods) factory[m] = originals[m];
  }

  /** Destrói todos os elementos do HUD (para recriar com nova língua) */
  destroy() {
    this.hideTowerPanel();
    for (const o of this._objects) {
      try { o.destroy(); } catch (e) {}
    }
    this._objects = [];
  }

  build() {
    const scene = this.scene;
    const W = 1280;

    // ── Barra superior ────────────────────────────────────────────────────────
    scene.add.rectangle(640, 30, W, 60, 0x0d0d1a, 0.95).setDepth(10).setScrollFactor(0);
    const topLine = scene.add.graphics().setDepth(10).setScrollFactor(0);
    topLine.lineStyle(1, 0xc8960c, 0.4).lineBetween(0, 60, W, 60);

    // Ouro
    scene.add.image(30, 30, 'icon_coin').setDepth(11).setScrollFactor(0);
    this._goldText = scene.add.text(52, 30, '0', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#fdd835'
    }).setOrigin(0, 0.5).setDepth(11).setScrollFactor(0);

    // Vidas
    scene.add.image(160, 30, 'icon_heart').setDepth(11).setScrollFactor(0);
    this._livesText = scene.add.text(182, 30, '0', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#ef5350'
    }).setOrigin(0, 0.5).setDepth(11).setScrollFactor(0);

    // Vaga
    this._waveText = scene.add.text(W / 2, 30, '', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#d4a56a'
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0);

    // Score
    scene.add.text(W - 230, 30, I18n.t('hud.score') + ':', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#888'
    }).setOrigin(0, 0.5).setDepth(11).setScrollFactor(0);
    this._scoreText = scene.add.text(W - 155, 30, '0', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#a5d6a7'
    }).setOrigin(0, 0.5).setDepth(11).setScrollFactor(0);

    // ── Painel lateral de torres ──────────────────────────────────────────────
    scene.add.rectangle(1215, 420, 130, 620, 0x0d0d1a, 0.93).setDepth(10).setScrollFactor(0);
    const sideLine = scene.add.graphics().setDepth(10).setScrollFactor(0);
    sideLine.lineStyle(1, 0xc8960c, 0.3).strokeRect(1150, 110, 130, 520);

    const towerTypes  = ['barracks', 'archer', 'mage', 'artillery'];
    const towerLabels = [
      I18n.t('towers.barracks'), I18n.t('towers.archer'),
      I18n.t('towers.mage'),     I18n.t('towers.artillery')
    ];
    this._buildBtns = {};
    towerTypes.forEach((type, i) => {
      this._buildBtns[type] = this.createBuildBtn(1215, 185 + i * 115, type, towerLabels[i], i);
    });

    // ── Painel de poderes (drag & drop) ───────────────────────────────────────
    this.buildPowerPanel();

    // ── Botões inferiores ─────────────────────────────────────────────────────
    this._startBtn = this.createStartBtn();
    this._fastBtn  = this.createFastBtn();

    // ── Botão pausa ───────────────────────────────────────────────────────────
    const pauseBtn = scene.add.text(1215, 685, '⏸ ' + (I18n.t('pause.title') || 'Pausa'), {
      fontFamily: 'monospace', fontSize: '14px', color: '#bbb',
      backgroundColor: '#111', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerover', () => pauseBtn.setColor('#fdd835'));
    pauseBtn.on('pointerout',  () => pauseBtn.setColor('#bbb'));
    pauseBtn.on('pointerdown', () => scene.pauseGame());
  }

  createBuildBtn(x, y, type, label, idx) {
    const scene = this.scene;
    const def = TOWER_DATA[type];
    const W = 104, H = 96;
    const container = scene.add.container(x, y).setDepth(11).setScrollFactor(0);

    const bg = scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(-W/2, -H/2, W, H, 6);
    bg.lineStyle(1, 0x444);
    bg.strokeRoundedRect(-W/2, -H/2, W, H, 6);

    const icon  = scene.add.image(0, -20, 'tower_' + type).setScale(0.85);
    const lbl   = scene.add.text(0, 17, label, {
      fontFamily: 'monospace', fontSize: '10px', color: '#bbb'
    }).setOrigin(0.5);
    const cost  = scene.add.text(0, 30, def.baseCost + 'g', {
      fontFamily: 'monospace', fontSize: '12px', color: '#fdd835'
    }).setOrigin(0.5);
    const hkey  = scene.add.text(-40, -42, String(idx + 1), {
      fontFamily: 'monospace', fontSize: '10px', color: '#555',
      backgroundColor: '#111', padding: { x: 2, y: 1 }
    }).setOrigin(0);

    container.add([bg, icon, lbl, cost, hkey]);
    container.setSize(W, H);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2d2d4e, 0.95);
      bg.fillRoundedRect(-W/2, -H/2, W, H, 6);
      bg.lineStyle(1, 0xc8960c);
      bg.strokeRoundedRect(-W/2, -H/2, W, H, 6);
    });
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.9);
      bg.fillRoundedRect(-W/2, -H/2, W, H, 6);
      bg.lineStyle(1, 0x444);
      bg.strokeRoundedRect(-W/2, -H/2, W, H, 6);
    });
    container.on('pointerdown', () => {
      scene.events.emit('selectBuild', type);
      Settings.playSfx(scene, 'sfx_btn');
    });

    container._costText = cost;
    return container;
  }

  // ── PAINEL DE PODERES (drag & drop) ─────────────────────────────────────────
  buildPowerPanel() {
    const scene = this.scene;
    const baseX = 260, y = 682;

    // Fundo
    scene.add.rectangle(baseX, y, 240, 52, 0x0d0d1a, 0.92)
      .setDepth(10).setScrollFactor(0)
      .setStrokeStyle(1, 0x9c27b0, 0.5);

    scene.add.text(baseX, y - 16, I18n.t('powers.title'), {
      fontFamily: 'monospace', fontSize: '11px', color: '#9c27b0'
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0);

    // Legenda arrastar
    scene.add.text(baseX, y + 20, 'arrasta para o campo', {
      fontFamily: 'monospace', fontSize: '9px', color: '#555'
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0);

    this.createDragPowerBtn(baseX - 56, y, 'icon_reinf',
      I18n.t('powers.reinforcements'), 'reinforcements', 30000);
    this.createDragPowerBtn(baseX + 56, y, 'icon_meteor',
      I18n.t('powers.meteor'), 'meteor', 45000);
  }

  createDragPowerBtn(x, y, iconKey, label, powerType, cooldownMs) {
    const scene = this.scene;

    // Fundo do botão
    const bg = scene.add.rectangle(x, y, 52, 52, 0x1a0f00, 0.85)
      .setDepth(10).setScrollFactor(0)
      .setStrokeStyle(1, 0x9c27b0, 0.6);

    const icon = scene.add.image(x, y, iconKey)
      .setDepth(11).setScrollFactor(0)
      .setInteractive({ useHandCursor: true, draggable: false });

    // Overlay de cooldown
    const cdOverlay = scene.add.rectangle(x, y, 52, 52, 0x000000, 0)
      .setDepth(12).setScrollFactor(0);
    const cdText = scene.add.text(x, y, '', {
      fontFamily: 'monospace', fontSize: '15px',
      color: '#fff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(13).setScrollFactor(0);

    // Tooltip
    const tooltip = scene.add.text(x, y - 36, label, {
      fontFamily: 'monospace', fontSize: '10px', color: '#d4a56a',
      backgroundColor: '#0d0d1a', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(14).setScrollFactor(0).setAlpha(0);

    let lastUsed = -cooldownMs; // disponível desde o início

    icon.on('pointerover', () => {
      scene.tweens.add({ targets: tooltip, alpha: 1, duration: 150 });
      bg.setStrokeStyle(2, 0xe040fb);
    });
    icon.on('pointerout', () => {
      scene.tweens.add({ targets: tooltip, alpha: 0, duration: 150 });
      bg.setStrokeStyle(1, 0x9c27b0, 0.6);
    });

    icon.on('pointerdown', () => {
      const now = Date.now();
      if (now - lastUsed < cooldownMs) {
        const rem = Math.ceil((cooldownMs - (now - lastUsed)) / 1000);
        scene.events.emit('floatHUD', x, y - 30, rem + 's', '#ef5350');
        return;
      }
      lastUsed = now;

      // Iniciar drag do poder
      scene.events.emit('dragPower', powerType);

      // Iniciar cooldown visual
      scene.tweens.addCounter({
        from: cooldownMs, to: 0, duration: cooldownMs,
        onUpdate: (tween) => {
          const rem = Math.ceil(tween.getValue() / 1000);
          cdOverlay.setFillStyle(0x000000, 0.6);
          cdText.setText(rem + 's');
        },
        onComplete: () => {
          cdOverlay.setFillStyle(0x000000, 0);
          cdText.setText('');
        }
      });
    });

    this._powerCooldowns[powerType] = { lastUsed, cooldownMs };
  }

  // ── BOTÕES DE CONTROLO ───────────────────────────────────────────────────────
  createStartBtn() {
    const scene = this.scene;
    const btn = scene.add.text(560, 682, '▶ ' + I18n.t('hud.start_wave'), {
      fontFamily: 'Georgia, serif', fontSize: '18px',
      color: '#00e676', backgroundColor: '#0d2b0d',
      padding: { x: 14, y: 8 }, stroke: '#003300', strokeThickness: 1
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#69f0ae'));
    btn.on('pointerout',  () => btn.setColor('#00e676'));
    btn.on('pointerdown', () => {
      scene.events.emit('startWave');
      Settings.playSfx(scene, 'sfx_wave_start');
    });
    return btn;
  }

  createFastBtn() {
    const scene = this.scene;
    let fast = false;
    const btn = scene.add.text(730, 682, '⏩ x1', {
      fontFamily: 'monospace', fontSize: '16px',
      color: '#888', backgroundColor: '#111',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setDepth(11).setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      fast = !fast;
      // GameScene multiplica o delta por 2 quando _fastMode está activo
      scene._fastMode = fast;
      btn.setText(fast ? '⏩ x2' : '⏩ x1');
      btn.setColor(fast ? '#fdd835' : '#888');
    });
    return btn;
  }

  // ── ACTUALIZAÇÕES DE VALORES ─────────────────────────────────────────────────
  setGold(v)  { this._goldText.setText(String(v)); }
  setLives(v) {
    this._livesText.setText(String(v));
    this._livesText.setColor(v > 5 ? '#ef5350' : '#ff1744');
  }
  setWave(cur, total) {
    this._waveText.setText(I18n.t('hud.wave') + ' ' + cur + ' / ' + total);
  }
  setScore(v) { this._scoreText.setText(String(v)); }

  setWaveActive(active) {
    this._startBtn.setVisible(!active);
  }

  updateGoldState(gold) {
    for (const [type, btn] of Object.entries(this._buildBtns)) {
      const affordable = gold >= TOWER_DATA[type].baseCost;
      btn._costText.setColor(affordable ? '#fdd835' : '#ef5350');
      btn.setAlpha(affordable ? 1 : 0.6);
    }
  }

  // ── PAINEL DE TORRE ───────────────────────────────────────────────────────────
  showTowerPanel(tower, onUpgrade, onSell) {
    this.hideTowerPanel();
    const scene = this.scene;
    const def   = TOWER_DATA[tower.towerType];
    const stats = tower.stats;
    const W = 200, H = 220;
    const tx = Math.min(tower.x + 64, 1100);
    const ty = Math.max(tower.y - 100, 70);

    const panel = scene.add.container(tx, ty).setDepth(20);
    const bg = scene.add.graphics();
    bg.fillStyle(0x0d0d1a, 0.97);
    bg.fillRoundedRect(0, 0, W, H, 8);
    bg.lineStyle(2, 0xc8960c, 0.7);
    bg.strokeRoundedRect(0, 0, W, H, 8);
    panel.add(bg);

    // Título
    panel.add(scene.add.text(W / 2, 14,
      tower.towerType.toUpperCase() + ' ' + stats.label, {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#c8960c'
    }).setOrigin(0.5));

    // Stats
    const lines = [
      stats.damage   ? I18n.t('towers.damage')  + ': ' + stats.damage : null,
      I18n.t('towers.range')   + ': ' + stats.range,
      stats.fireRate ? I18n.t('towers.speed')   + ': ' + (1000 / stats.fireRate).toFixed(1) + '/s' : null,
      stats.soldiers ? 'Soldados: ' + stats.soldiers : null,
      stats.splashRadius ? 'Splash: ' + stats.splashRadius : null
    ].filter(Boolean);

    lines.forEach((line, i) => {
      panel.add(scene.add.text(10, 36 + i * 20, line, {
        fontFamily: 'monospace', fontSize: '11px', color: '#aaa'
      }));
    });

    // Upgrade
    if (tower.canUpgrade()) {
      const upCost = tower.upgradeCost();
      const upBtn = scene.add.text(W / 2, H - 58,
        '▲ ' + I18n.t('towers.upgrade') + ' (' + upCost + 'g)', {
        fontFamily: 'monospace', fontSize: '12px',
        color: '#00e676', backgroundColor: '#0d2b0d',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      upBtn.on('pointerdown', () => { onUpgrade(tower); this.hideTowerPanel(); });
      panel.add(upBtn);
    } else {
      panel.add(scene.add.text(W / 2, H - 58, '✓ MAX', {
        fontFamily: 'monospace', fontSize: '12px', color: '#fdd835'
      }).setOrigin(0.5));
    }

    // Vender
    const sv = sellValue(tower.towerType, tower.level);
    const sellBtn = scene.add.text(W / 2, H - 30,
      '✕ ' + I18n.t('towers.sell') + ' (+' + sv + 'g)', {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#ef5350', backgroundColor: '#2b0d0d',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    sellBtn.on('pointerdown', () => { onSell(tower); this.hideTowerPanel(); });
    panel.add(sellBtn);


    // Círculo de range
    this._rangeCircle = scene.add.image(tower.x, tower.y, 'range_circle')
      .setDisplaySize(stats.range * 2, stats.range * 2)
      .setDepth(1).setAlpha(0.28);

    this._towerPanel = panel;
  }

  hideTowerPanel() {
    this._towerPanel?.destroy();  this._towerPanel  = null;
    this._rangeCircle?.destroy(); this._rangeCircle = null;
  }
}
