import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';
import { TOWER_DATA, sellValue } from '../utils/TowerData.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    this._towerPanel  = null;
    this._rangeCircle = null;
    this._powerState  = {};   // estado dos cooldowns dos poderes (keyed by powerType)
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
    for (const state of Object.values(this._powerState)) {
      if (state.onPowerUsed) this.scene.events.off('powerUsed', state.onPowerUsed);
      state.activeTween?.stop();
    }
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
    scene.add.text(W - 270, 30, I18n.t('hud.score') + ':', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#888'
    }).setOrigin(0, 0.5).setDepth(11).setScrollFactor(0);
    this._scoreText = scene.add.text(W - 115, 30, '0', {
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

    const bg = scene.add.rectangle(x, y, 52, 52, 0x1a0f00, 0.85)
      .setDepth(10).setScrollFactor(0)
      .setStrokeStyle(1, 0x9c27b0, 0.6);

    const icon = scene.add.image(x, y, iconKey)
      .setDepth(11).setScrollFactor(0)
      .setInteractive({ useHandCursor: true, draggable: false });

    const cdOverlay = scene.add.rectangle(x, y, 52, 52, 0x000000, 0)
      .setDepth(12).setScrollFactor(0);
    const cdText = scene.add.text(x, y, '', {
      fontFamily: 'monospace', fontSize: '15px',
      color: '#fff', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(13).setScrollFactor(0);

    const tooltip = scene.add.text(x, y - 36, label, {
      fontFamily: 'monospace', fontSize: '10px', color: '#d4a56a',
      backgroundColor: '#0d0d1a', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(14).setScrollFactor(0).setAlpha(0);

    // Estado persistente do poder (acessível externamente para fast mode e pausa)
    const state = {
      cooldownMs,
      cooldownEndTime: 0,    // wall-clock ms em que o cooldown expira (0 = disponível)
      pausedRemaining: null, // ms restantes quando pausado entre waves (null = não pausado)
      activeTween: null,
      cdOverlay,
      cdText
    };
    this._powerState[powerType] = state;

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
      if (now < state.cooldownEndTime) {
        const rem = Math.ceil((state.cooldownEndTime - now) / 1000);
        scene.events.emit('floatHUD', x, y - 30, rem + 's', '#ef5350');
        return;
      }
      // Iniciar o drag — o cooldown só começa quando o poder for de facto lançado
      scene.events.emit('dragPower', powerType);
    });

    // O cooldown só arranca ao receber 'powerUsed' (emitido por castMeteor/castReinforcements)
    const onPowerUsed = (usedType) => {
      if (usedType !== powerType) return;
      const now = Date.now();
      const speedMult = scene._fastMode ? 2 : 1;
      const duration = cooldownMs / speedMult;
      state.cooldownEndTime = now + duration;
      this._startCooldownTween(state, duration, speedMult);
    };
    scene.events.on('powerUsed', onPowerUsed);
    state.onPowerUsed = onPowerUsed; // guardado para limpeza no destroy()
  }

  // Inicia (ou reinicia) o tween visual de cooldown.
  // realDuration = ms reais até expirar; speedMult = fator de velocidade (1 ou 2).
  // O contador visual começa em realDuration*speedMult e desce até 0 em realDuration ms reais,
  // ou seja, em modo x2 desce 2 segundos por cada segundo real.
  _startCooldownTween(state, realDuration, speedMult = 1) {
    state.activeTween?.stop();
    state.activeTween = this.scene.tweens.addCounter({
      from: realDuration * speedMult, to: 0, duration: realDuration,
      onUpdate: (tween) => {
        if (!state.cdText?.active || !state.cdOverlay?.active) return;
        const rem = Math.ceil(tween.getValue() / 1000);
        state.cdOverlay.setFillStyle(0x000000, 0.6);
        state.cdText.setText(rem + 's');
      },
      onComplete: () => {
        if (!state.cdText?.active || !state.cdOverlay?.active) return;
        state.cooldownEndTime = 0;
        state.activeTween = null;
        state.cdOverlay.setFillStyle(0x000000, 0);
        state.cdText.setText('');
      }
    });
  }

  // Pausa o countdown dos poderes (chamado quando a wave termina)
  pausePowerCooldowns() {
    const now = Date.now();
    const speedMult = this.scene._fastMode ? 2 : 1;
    for (const state of Object.values(this._powerState)) {
      const remaining = state.cooldownEndTime - now;
      if (remaining > 0 && state.pausedRemaining === null) {
        state.pausedRemaining = remaining;
        state.activeTween?.stop();
        state.activeTween = null;
        // Mostra o valor congelado no display
        state.cdOverlay.setFillStyle(0x000000, 0.6);
        state.cdText.setText(Math.ceil(remaining * speedMult / 1000) + 's');
      }
    }
  }

  // Retoma o countdown dos poderes (chamado quando a próxima wave começa)
  resumePowerCooldowns() {
    const now = Date.now();
    const speedMult = this.scene._fastMode ? 2 : 1;
    for (const state of Object.values(this._powerState)) {
      if (state.pausedRemaining !== null) {
        const realDuration = state.pausedRemaining;
        state.cooldownEndTime = now + realDuration;
        state.pausedRemaining = null;
        this._startCooldownTween(state, realDuration, speedMult);
      }
    }
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
      scene._fastMode = fast;
      btn.setText(fast ? '⏩ x2' : '⏩ x1');
      btn.setColor(fast ? '#fdd835' : '#888');

      // Reescalar os cooldowns para refletir a nova velocidade
      const now = Date.now();
      for (const state of Object.values(this._powerState)) {
        if (state.pausedRemaining !== null) {
          // Cooldown congelado entre waves: escalar o tempo guardado
          state.pausedRemaining = fast ? state.pausedRemaining / 2 : state.pausedRemaining * 2;
          const displayMs = state.pausedRemaining * (fast ? 2 : 1);
          state.cdText.setText(Math.ceil(displayMs / 1000) + 's');
          continue;
        }
        const remaining = state.cooldownEndTime - now;
        if (remaining <= 0) continue;
        // Recalcular duração real mantendo o valor visual contínuo:
        // from = newRealDuration * newSpeedMult = remaining (sem salto no display)
        const newRealDuration = fast ? remaining / 2 : remaining * 2;
        state.cooldownEndTime = now + newRealDuration;
        this._startCooldownTween(state, newRealDuration, fast ? 2 : 1);
      }
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
  showTowerPanel(tower, onUpgrade, onSell, onChoosePath = null) {
    this.hideTowerPanel();
    const scene      = this.scene;
    const def        = TOWER_DATA[tower.towerType];
    const stats      = tower.stats;
    const isBarracks = tower.towerType === 'barracks';
    const hasPaths   = tower.hasPaths?.() && !!onChoosePath;

    const W = 200;
    const H = isBarracks
      ? (hasPaths ? 336 : 252)
      : (hasPaths ? 304 : 220);

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
    const titleLabel = tower.level === 3 && tower.chosenPath
      ? tower.towerType.toUpperCase() + ' ★ ' + (def.paths[tower.chosenPath]?.label || '')
      : tower.towerType.toUpperCase() + ' ' + stats.label;
    panel.add(scene.add.text(W / 2, 14, titleLabel, {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#c8960c'
    }).setOrigin(0.5));

    // Stats
    const lines = [
      stats.damage    ? I18n.t('towers.damage')  + ': ' + stats.damage : null,
      I18n.t('towers.range')   + ': ' + stats.range,
      stats.fireRate  ? I18n.t('towers.speed')   + ': ' + (1000 / stats.fireRate).toFixed(1) + '/s' : null,
      stats.soldiers  ? 'Soldados: ' + stats.soldiers : null,
      stats.splashRadius ? 'Splash: ' + stats.splashRadius : null,
      stats.slowField ? '❄ Campo de slow em área' : null,
      stats.piercing  ? '↠ Flechas perfurantes'   : null,
      stats.ignoreArmor ? '⚔ Ignora armadura'     : null,
      stats.hitsFlying  ? '🚀 Atinge voadores'    : null,
      stats.necromancy  ? '☠ Revive inimigos'     : null,
      stats.maxMines    ? `💣 Minas: ${tower._mines?.length ?? 0}/${stats.maxMines}` : null
    ].filter(Boolean);

    lines.forEach((line, i) => {
      panel.add(scene.add.text(10, 36 + i * 18, line, {
        fontFamily: 'monospace', fontSize: '10px', color: '#aaa'
      }));
    });

    // Rally (barracks only)
    if (isBarracks) {
      const rallyY = hasPaths ? H - 204 : H - 90;
      const rallyBtn = scene.add.text(W / 2, rallyY,
        '⚑ ' + I18n.t('towers.set_rally'), {
        fontFamily: 'monospace', fontSize: '12px',
        color: '#42a5f5', backgroundColor: '#0d1a2e',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      rallyBtn.on('pointerover', () => rallyBtn.setColor('#90caf9'));
      rallyBtn.on('pointerout',  () => rallyBtn.setColor('#42a5f5'));
      rallyBtn.on('pointerdown', () => {
        this.hideTowerPanel();
        scene.events.emit('startRallyMode', tower);
      });
      panel.add(rallyBtn);
    }

    // ── Caminho IV (paths A e B) ──────────────────────────────────────────────
    if (hasPaths) {
      panel.add(scene.add.text(W / 2, H - 174, '— Escolhe caminho IV —', {
        fontFamily: 'monospace', fontSize: '9px', color: '#888'
      }).setOrigin(0.5));

      ['A', 'B'].forEach((key, i) => {
        const pd    = def.paths[key];
        const color = key === 'A' ? '#f0c040' : '#42a5f5';
        const yBtn  = H - 156 + i * 76;

        const pathBtn = scene.add.text(W / 2, yBtn,
          key + ': ' + pd.label + ' (' + pd.cost + 'g)', {
          fontFamily: 'monospace', fontSize: '11px',
          color, backgroundColor: '#0d0d00',
          padding: { x: 8, y: 5 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const descTxt = scene.add.text(W / 2, yBtn + 22, pd.description || '', {
          fontFamily: 'monospace', fontSize: '9px', color: '#999',
          wordWrap: { width: W - 16 }
        }).setOrigin(0.5);

        pathBtn.on('pointerover', () => pathBtn.setAlpha(0.75));
        pathBtn.on('pointerout',  () => pathBtn.setAlpha(1));
        pathBtn.on('pointerdown', () => {
          onChoosePath(tower, key);
          this.hideTowerPanel();
        });
        panel.add([pathBtn, descTxt]);
      });

    // ── Upgrade normal ────────────────────────────────────────────────────────
    } else if (tower.canUpgrade()) {
      const upCost = tower.upgradeCost();
      const upBtn = scene.add.text(W / 2, H - 58,
        '▲ ' + I18n.t('towers.upgrade') + ' (' + upCost + 'g)', {
        fontFamily: 'monospace', fontSize: '12px',
        color: '#00e676', backgroundColor: '#0d2b0d',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      upBtn.on('pointerdown', () => { onUpgrade(tower); this.hideTowerPanel(); });
      panel.add(upBtn);

    // ── MAX / caminho já escolhido ────────────────────────────────────────────
    } else {
      const maxLabel = tower.chosenPath
        ? '★ ' + (def.paths?.[tower.chosenPath]?.label || 'ELITE')
        : '✓ MAX';
      const maxColor = tower.chosenPath === 'A' ? '#f0c040'
                     : tower.chosenPath === 'B' ? '#42a5f5'
                     : '#fdd835';
      panel.add(scene.add.text(W / 2, H - 58, maxLabel, {
        fontFamily: 'monospace', fontSize: '12px', color: maxColor
      }).setOrigin(0.5));
    }

    // Vender
    const sv = sellValue(tower.towerType, tower.level, tower.chosenPath);
    const sellBtn = scene.add.text(W / 2, H - 28,
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
