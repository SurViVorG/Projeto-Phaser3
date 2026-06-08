import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';
import { PATH_DATA, PATH_TILES, buildPath, snapToPath, isOnPath, TOWER_SLOTS } from '../utils/PathData.js';
import { LEVEL_WAVES, totalWaves, waveClearBonus, waveRewardMultiplier } from '../utils/WaveData.js';
import { TOWER_DATA, sellValue } from '../utils/TowerData.js';
import { ENEMY_DATA } from '../utils/EnemyData.js';
import Enemy from '../entities/Enemy.js';
import { ArcherTower, MageTower, ArtilleryTower, BarracksTower, Soldier } from '../entities/Tower.js';
import HUD from '../entities/HUD.js';

const TILE = 64;

// Slots de torres do nível 1
// Tower slots are loaded per-level from PathData.TOWER_SLOTS

export default class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.level       = data.level || 1;
    this.gold        = [250, 250, 300, 375][this.level - 1] ?? 250;
    this.lives       = 20;
    this.score       = 0;
    this.waveIndex   = 0;
    this.waveActive  = false;
    this._enemies    = [];
    this._towers     = [];
    this._buildMode  = null;
    this._buildGhost = null;
    this._selectedTower = null;
    this._toSpawn    = 0;
    this._aliveCount = 0;
    this._wavePreview = null;
    this._gameEnded   = false;
    // poder de arrastar
    this._dragPower  = null;
    this._dragIcon   = null;
  }

  create() {
    this.cameras.main.fadeIn(500);
    this._reinfSoldiers = [];
    this._fastMode = false;
    this.drawMap();
    this._path = buildPath(this, this.level);
    // Expor snapToPath para as torres poderem usar durante drag
    this._snapToPath = (px, py) => snapToPath(px, py, this.level);

    // Música de batalha
    Settings.playMusic(this, 'music_battle');

    this._hud = new HUD(this);
    this._hud.setGold(this.gold);
    this._hud.setLives(this.lives);
    this._hud.setWave(0, totalWaves(this.level));
    this._hud.setScore(this.score);

    // Eventos
    this.events.on('selectBuild',   (type) => this.enterBuildMode(type));
    this.events.on('startWave',     ()     => this.startNextWave());
    this.events.on('enemyKilled',   (e)    => this.onEnemyKilled(e));
    this.events.on('dragPower',     (type) => this.startDragPower(type));
    this.events.on('setRally',      (tower, px, py) => this.setTowerRally(tower, px, py));

    // Input
    this.input.on('pointermove', (ptr) => this.onPointerMove(ptr));
    this.input.on('pointerdown', (ptr) => this.onPointerDown(ptr));
    this.input.on('pointerup',   (ptr) => this.onPointerUp(ptr));

    this.input.keyboard.on('keydown-ESC', () => {
      this.exitBuildMode();
      this.cancelDragPower();
      this._hud.hideTowerPanel();
      this._selectedTower = null;
    });

    // Tecla P para pausar
    this.input.keyboard.on('keydown-P', () => this.pauseGame());

    ['ONE','TWO','THREE','FOUR'].forEach((key, i) => {
      this.input.keyboard.on('keydown-' + key, () => {
        const types = ['barracks','archer','mage','artillery'];
        this.enterBuildMode(types[i]);
      });
    });

    this.input.keyboard.on('keydown-R', () => {
      this.scene.restart({ level: this.level });
    });

    // Partículas
    this._particles = this.add.particles(0, 0, 'particle_spark', {
      speed: { min: 50, max: 150 }, scale: { start: 0.8, end: 0 },
      lifespan: 400, blendMode: 'ADD', emitting: false
    }).setDepth(8);

    this._bloodParticles = this.add.particles(0, 0, 'particle_blood', {
      speed: { min: 30, max: 80 }, scale: { start: 0.6, end: 0 },
      lifespan: 300, emitting: false
    }).setDepth(8);
  }

  // ── MAPA ────────────────────────────────────────────────────────────────────
  drawMap() {
    const path  = PATH_DATA[this.level];
    const ptiles = PATH_TILES[this.level] ?? [];

    // Chão base — toda a grelha jogável (linhas 0..9)
    for (let row = 0; row < 10; row++)
      for (let col = 0; col < 20; col++)
        this.add.image(col * TILE + 32, row * TILE + 32, 'tile_ground');

    // Caminho — desenhado a partir do PATH_TILES (mesma fonte que os inimigos)
    this._pathTiles = new Set();
    for (const t of ptiles) {
      this.add.image(t.x, t.y, 'tile_path').setDepth(0);
      this._pathTiles.add(t.x + ',' + t.y);
    }

    // Slots de torres — só onde NÃO há caminho
    this._slotObjects = [];
    for (const [col, row] of (TOWER_SLOTS[this.level] ?? [])) {
      const x = col * TILE + 32, y = row * TILE + 32;
      // segurança extra: não criar slot sobre o caminho
      if (this._pathTiles.has(x + ',' + y)) continue;
      const slot = this.add.image(x, y, 'tower_slot').setDepth(1).setAlpha(0.4);
      slot._col = col; slot._row = row;
      slot._x = x; slot._y = y;
      slot._occupied = false;
      this._slotObjects.push(slot);
    }

    // Castelo e portal nas extremidades do caminho
    const last  = path[path.length - 1];
    const first = path[0];
    this.add.image(Math.min(last.x, 1248), last.y, 'castle').setDepth(2);
    this.add.image(Math.max(first.x, 32), first.y, 'entry_portal').setDepth(2);
  }

  // ── BUILD MODE ──────────────────────────────────────────────────────────────
  enterBuildMode(type) {
    const cost = TOWER_DATA[type].baseCost;
    if (this.gold < cost) {
      this.floatText(640, 340, I18n.t('hud.gold') + ' insuficiente!', '#ef5350');
      return;
    }
    this.exitBuildMode();
    this._buildMode = type;

    this._buildGhost = this.add.image(-200, -200, 'tower_' + type)
      .setAlpha(0.55).setDepth(15);
    this._buildRangeGhost = this.add.image(-200, -200, 'range_circle')
      .setAlpha(0.15).setDepth(14)
      .setDisplaySize(
        TOWER_DATA[type].levels[0].range * 2,
        TOWER_DATA[type].levels[0].range * 2
      );

    for (const slot of this._slotObjects)
      if (!slot._occupied) slot.setAlpha(0.85);

    this.input.setDefaultCursor('crosshair');
  }

  exitBuildMode() {
    this._buildMode = null;
    this._buildGhost?.destroy();      this._buildGhost = null;
    this._buildRangeGhost?.destroy(); this._buildRangeGhost = null;
    for (const slot of this._slotObjects)
      slot.setAlpha(slot._occupied ? 0 : 0.4);
    this.input.setDefaultCursor('default');
  }

  // ── PODER ARRASTAR ──────────────────────────────────────────────────────────
  startDragPower(type) {
    this.cancelDragPower();
    this._dragPower = type;
    const iconKey = type === 'meteor' ? 'icon_meteor' : 'icon_reinf';
    this._dragIcon = this.add.image(-200, -200, iconKey)
      .setAlpha(0.8).setDepth(20).setScale(1.2);
    this.input.setDefaultCursor('crosshair');
    this.floatText(640, 340,
      type === 'meteor' ? '☄ Arrasta para o alvo!' : '⚔ Arrasta para o campo!',
      '#fff');
  }

  cancelDragPower() {
    this._dragPower = null;
    this._dragIcon?.destroy(); this._dragIcon = null;
    this.input.setDefaultCursor('default');
  }

  // ── INPUT ───────────────────────────────────────────────────────────────────
  onPointerMove(ptr) {
    if (this._buildGhost) {
      this._buildGhost.setPosition(ptr.x, ptr.y);
      this._buildRangeGhost.setPosition(ptr.x, ptr.y);
    }
    if (this._dragIcon) {
      this._dragIcon.setPosition(ptr.x, ptr.y - 20);
    }
  }

  onPointerDown(ptr) {
    // Ignorar cliques fora da área de jogo
    if (ptr.y > 640 || ptr.x > 1150) return;

    if (this._buildMode) {
      this.tryPlaceTower(ptr.x, ptr.y);
      return;
    }

    // Drag power começa aqui (tracking começa no move, termina no up)
    if (this._dragPower) return;

    // Clicar numa torre
    const tower = this.getTowerAt(ptr.x, ptr.y);
    if (tower) {
      this._selectedTower = tower;
      this._hud.showTowerPanel(tower,
        (t) => this.upgradeTower(t),
        (t) => this.sellTower(t)
      );
      return;
    }

    this._hud.hideTowerPanel();
    this._selectedTower = null;
  }

  onPointerUp(ptr) {
    if (!this._dragPower) return;
    if (ptr.y > 640 || ptr.x > 1150) {
      this.cancelDragPower();
      return;
    }
    // Soltar o poder na posição
    const type = this._dragPower;
    this.cancelDragPower();
    if (type === 'meteor') {
      this.castMeteor(ptr.x, ptr.y);
    } else if (type === 'reinforcements') {
      this.castReinforcements(ptr.x, ptr.y);
    }
  }

  // ── COLOCAR TORRE ───────────────────────────────────────────────────────────
  tryPlaceTower(px, py) {
    let bestSlot = null, bestDist = 48;
    for (const slot of this._slotObjects) {
      if (slot._occupied) continue;
      const d = Phaser.Math.Distance.Between(px, py, slot._x, slot._y);
      if (d < bestDist) { bestDist = d; bestSlot = slot; }
    }

    if (!bestSlot) {
      this.floatText(px, py, '✗ Slot inválido', '#ef5350');
      this.exitBuildMode();
      return;
    }

    const cost = TOWER_DATA[this._buildMode].baseCost;
    if (this.gold < cost) {
      this.floatText(px, py, 'Ouro insuficiente!', '#ef5350');
      this.exitBuildMode();
      return;
    }

    const tower = this.createTower(this._buildMode, bestSlot._x, bestSlot._y);
    this._towers.push(tower);
    bestSlot._occupied = true;
    bestSlot.setAlpha(0);
    bestSlot._tower = tower;

    this.spendGold(cost);
    this._particles.emitParticleAt(bestSlot._x, bestSlot._y, 10);
    Settings.playSfx(this, 'sfx_place_tower');
    this.floatText(bestSlot._x, bestSlot._y - 44, '-' + cost + 'g', '#ef5350');
    this.exitBuildMode();
  }

  createTower(type, x, y) {
    switch (type) {
      case 'barracks':  return new BarracksTower(this, x, y);
      case 'archer':    return new ArcherTower(this, x, y);
      case 'mage':      return new MageTower(this, x, y);
      case 'artillery': return new ArtilleryTower(this, x, y);
    }
  }

  getTowerAt(px, py) {
    for (const t of this._towers)
      if (Phaser.Math.Distance.Between(px, py, t.x, t.y) <= 30) return t;
    return null;
  }

  upgradeTower(tower) {
    const cost = tower.upgradeCost();
    if (!cost || this.gold < cost) {
      this.floatText(tower.x, tower.y, 'Ouro insuficiente!', '#ef5350');
      return;
    }
    this.spendGold(cost);
    tower.upgrade();
    this.floatText(tower.x, tower.y - 44, '▲ UP!', '#fdd835');
  }

  sellTower(tower) {
    const val = sellValue(tower.towerType, tower.level);
    this.addGold(val);
    this.floatText(tower.x, tower.y - 44, '+' + val + 'g', '#00e676');
    const slot = this._slotObjects.find(s => s._tower === tower);
    if (slot) { slot._occupied = false; slot.setAlpha(0.4); slot._tower = null; }
    this._towers = this._towers.filter(t => t !== tower);
    tower.destroy();
    Settings.playSfx(this, 'sfx_coin');
  }

  // ── WAVES ───────────────────────────────────────────────────────────────────
  startNextWave() {
    if (this.waveActive) return;
    const waves = LEVEL_WAVES[this.level];
    if (this.waveIndex >= waves.length) return;
    this._clearNextWavePreview();

    this.waveActive = true;
    this._hud.setWaveActive(true);
    this._hud.resumePowerCooldowns();
    this._hud.setWave(this.waveIndex + 1, waves.length);

    // Construir lista de spawns com delays acumulados
    const waveDef = waves[this.waveIndex];
    const spawnList = [];
    let delay = 0;
    for (const group of waveDef) {
      for (let i = 0; i < group.count; i++) {
        spawnList.push({ type: group.type, delay });
        delay += group.interval;
      }
    }

    // Contadores independentes:
    //   _toSpawn       = inimigos que ainda faltam aparecer
    //   _aliveCount    = inimigos atualmente no campo (vivos, não chegaram)
    this._toSpawn    = spawnList.length;
    this._aliveCount = 0;

    // Agendar cada spawn individualmente
    for (const s of spawnList) {
      this.time.delayedCall(s.delay, () => {
        if (!this.waveActive) return; // vaga cancelada (ex: game over)
        this.spawnEnemy(s.type);
        this._toSpawn--;
        this._aliveCount++;
      });
    }
  }

  spawnEnemy(type) {
    const enemy = new Enemy(this, type, this._path);
    enemy.setDepth(3);
    this._enemies.push(enemy);
  }

  onEnemyKilled(enemy) {
    const mult   = waveRewardMultiplier(this.waveIndex);
    const reward = Math.round(enemy.reward * mult);
    this.addGold(reward);
    this.addScore(reward * 10);
    this.floatText(enemy.x, enemy.y - 20, '+' + reward + 'g', '#fdd835');
    this._bloodParticles.emitParticleAt(enemy.x, enemy.y, 8);
    Settings.playSfx(this, 'sfx_enemy_die');

    this._aliveCount--;
    this._checkWaveEnd();
  }

  _checkWaveEnd() {
    if (!this.waveActive) return;
    // Vaga só termina quando NÃO há nada por spawnar E nenhum inimigo vivo no campo
    if (this._toSpawn > 0) return;
    if (this._aliveCount > 0) return;

    // Confirmação extra: nenhum inimigo vivo no array
    const stillAlive = this._enemies.filter(e => e.alive && !e.reached).length;
    if (stillAlive > 0) return;

    // ── Vaga concluída ──
    this.waveActive = false;
    this._hud.setWaveActive(false);
    this._hud.pausePowerCooldowns();

    const bonus = waveClearBonus(this.waveIndex);
    this.addGold(bonus);
    this.floatText(640, 320, '🌊 Vaga ' + (this.waveIndex + 1) + ' concluída! +' + bonus + 'g', '#fdd835');

    this.waveIndex++;

    // Vitória só quando TODAS as vagas do nível terminaram
    if (this.waveIndex >= totalWaves(this.level)) {
      this.time.delayedCall(1200, () => this.endGame(true));
    } else {
      this._showNextWavePreview(this.waveIndex);
    }
  }

  // ── PODERES ─────────────────────────────────────────────────────────────────
  castReinforcements(x, y) {
    this.events.emit('powerUsed', 'reinforcements');
    Settings.playSfx(this, 'sfx_reinf');
    // Stats dos soldados de reforço (temporários, mais fortes)
    const reinfStats = { hp: 200, soldierDmg: 18 };
    const offsets = [{x:0,y:0},{x:22,y:0},{x:-22,y:0},{x:0,y:22}];

    for (let i = 0; i < 4; i++) {
      const off = offsets[i];
      const sx = x + off.x, sy = y + off.y;
      // Soldado completo — bloqueia e combate como os das barracas
      const sol = new Soldier(this, sx, sy, reinfStats, sx, sy);
      this._reinfSoldiers.push(sol);

      // Auto-destruir após 18 segundos
      this.time.delayedCall(18000, () => {
        if (sol.alive) sol.die();
        this._reinfSoldiers = this._reinfSoldiers.filter(s => s !== sol);
      });
    }
    this.floatText(x, y - 40, '⚔ Reforços!', '#42a5f5');
  }

  castMeteor(x, y) {
    this.events.emit('powerUsed', 'meteor');
    Settings.playSfx(this, 'sfx_meteor');
    const meteor = this.add.image(x, y - 320, 'meteor').setDepth(10).setScale(0.5);
    this.tweens.add({
      targets: meteor, y: y, scaleX: 1.6, scaleY: 1.6,
      duration: 550, ease: 'Cubic.easeIn',
      onComplete: () => {
        meteor.destroy();
        const exp = this.add.image(x, y, 'explosion').setDepth(8).setScale(0.5);
        this.tweens.add({ targets: exp, scale: 2.2, alpha: 0, duration: 500,
          onComplete: () => exp.destroy() });
        Settings.playSfx(this, 'sfx_explosion');
        this.cameras.main.shake(400, 0.014);
        for (const e of this._enemies) {
          if (!e.alive) continue;
          const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
          if (d <= 110) {
            const dmg = Math.round(220 * (1 - d / 110));
            // Meteorito ignora toda a armadura
            const died = e.takeDamage(dmg, false, true);
            if (died) this.events.emit('enemyKilled', e);
          }
        }
      }
    });
    this.floatText(x, y - 50, '☄ METEORO!', '#ff5722');
  }

  // ── OURO / VIDAS / SCORE ────────────────────────────────────────────────────
  addGold(v) {
    this.gold += v;
    this._hud.setGold(this.gold);
    this._hud.updateGoldState(this.gold);
  }
  spendGold(v) { this.addGold(-v); }

  addScore(v) {
    this.score += v;
    this._hud.setScore(this.score);
  }

  loseLife(amount = 1) {
    this.lives -= amount;
    this._hud.setLives(this.lives);
    Settings.playSfx(this, 'sfx_life_lost');
    this.cameras.main.flash(300, 200, 0, 0);
    if (this.lives <= 0) this.endGame(false);
  }

  floatText(x, y, msg, color = '#ffffff') {
    const txt = this.add.text(x, y, msg, {
      fontFamily: 'Georgia, serif', fontSize: '17px',
      color, stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(22);
    this.tweens.add({
      targets: txt, y: y - 52, alpha: 0, duration: 1300,
      onComplete: () => txt.destroy()
    });
  }

  setTowerRally(tower, px, py) {
    // Tentar fazer snap ao tile de pista mais próximo
    const snapped = snapToPath(px, py, this.level);
    if (snapped) {
      tower.setRally(snapped.x, snapped.y);
      this.floatText(snapped.x, snapped.y - 30, '⚑ Rally!', '#42a5f5');
    } else {
      this.floatText(px, py - 30, '✗ Clica na pista!', '#ef5350');
    }
  }

  pauseGame() {
    // Não pausar se já estiver pausado ou em transição
    if (this.scene.isPaused('GameScene')) return;
    // Lançar a cena de pausa por cima e pausar esta
    this.scene.launch('PauseScene', { gameScene: this, level: this.level });
    this.scene.pause();
  }

  /**
   * Recria o HUD com a língua atual.
   * Chamado pela PauseScene quando o jogador troca de idioma na pausa.
   */
  rebuildHUD() {
    if (this._hud && this._hud.destroy) this._hud.destroy();
    this._hud = new HUD(this);
    this._hud.setGold(this.gold);
    this._hud.setLives(this.lives);
    this._hud.setWave(this.waveIndex + (this.waveActive ? 1 : 0), totalWaves(this.level));
    this._hud.setScore(this.score);
    this._hud.setWaveActive(this.waveActive);
    this._hud.updateGoldState(this.gold);
  }

  // ── PRÉVIA DA PRÓXIMA ONDA ────────────────────────────────────────────────────
  _showNextWavePreview(waveIdx) {
    this._clearNextWavePreview();
    const waves = LEVEL_WAVES[this.level];
    if (waveIdx >= waves.length) return;

    const portalY = PATH_DATA[this.level][0].y;
    const ax = 75, ay = portalY;

    const arrow = this.add.text(ax, ay - 6, '▶', {
      fontFamily: 'monospace', fontSize: '28px',
      color: '#ff8800', stroke: '#4a2200', strokeThickness: 2
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });

    const waveLbl = this.add.text(ax, ay + 16, 'vaga ' + (waveIdx + 1), {
      fontFamily: 'monospace', fontSize: '10px',
      color: '#ffd080', stroke: '#000', strokeThickness: 1
    }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [arrow, waveLbl],
      scaleX: 1.18, scaleY: 1.18,
      duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const tooltip = this._buildWaveTooltip(waves[waveIdx], waveIdx, ax, ay);
    tooltip.setVisible(false);

    const show = () => tooltip.setVisible(true);
    const hide = () => tooltip.setVisible(false);
    arrow.on('pointerover', show).on('pointerout', hide);
    waveLbl.on('pointerover', show).on('pointerout', hide);

    this._wavePreview = { arrow, waveLbl, tooltip };
  }

  _clearNextWavePreview() {
    if (!this._wavePreview) return;
    this._wavePreview.arrow?.destroy();
    this._wavePreview.waveLbl?.destroy();
    this._wavePreview.tooltip?.destroy();
    this._wavePreview = null;
  }

  _buildWaveTooltip(wave, waveIdx, ax, ay) {
    const lineH = 20, pad = 10;
    const w = 175;
    const h = pad * 2 + 24 + wave.length * lineH;
    const tx = ax + 18;
    const ty = Math.max(8, Math.min(ay - Math.round(h / 2), 590 - h));

    const container = this.add.container(tx, ty);
    container.setDepth(18);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d0d22, 0.92);
    bg.lineStyle(1.5, 0xc8960c, 0.85);
    bg.fillRect(0, 0, w, h);
    bg.strokeRect(0, 0, w, h);
    container.add(bg);

    const title = this.add.text(Math.round(w / 2), pad, 'Vaga ' + (waveIdx + 1), {
      fontFamily: 'Georgia, serif', fontSize: '13px',
      color: '#f0c040', stroke: '#000', strokeThickness: 1
    }).setOrigin(0.5, 0);
    container.add(title);

    const div = this.add.graphics();
    div.lineStyle(1, 0x666644, 0.6);
    div.lineBetween(pad, pad + 19, w - pad, pad + 19);
    container.add(div);

    wave.forEach((group, i) => {
      const data    = ENEMY_DATA[group.type];
      const col     = data?.color ?? 0xaaaaaa;
      const hexCol  = '#' + col.toString(16).padStart(6, '0');
      const yRow    = pad + 24 + i * lineH;
      const dot     = this.add.text(pad, yRow, '■', {
        fontFamily: 'monospace', fontSize: '10px', color: hexCol
      }).setOrigin(0, 0);
      const nameTxt = this.add.text(pad + 16, yRow,
        (data?.label || group.type) + ' ×' + group.count, {
        fontFamily: 'monospace', fontSize: '11px', color: '#e0e0e0',
        stroke: '#000', strokeThickness: 1
      }).setOrigin(0, 0);
      container.add([dot, nameTxt]);
    });

    return container;
  }

  endGame(victory) {
    if (this._gameEnded) return;
    this._gameEnded = true;
    this._clearNextWavePreview();
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(victory ? 'VictoryScene' : 'GameOverScene',
        { score: this.score, level: this.level });
    });
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────────
  update(time, delta) {
    // Modo rápido — multiplica delta por 2 (afeta movimento e cooldowns via dt)
    const dt = this._fastMode ? delta * 2 : delta;

    // Inimigos
    const toRemove = [];
    for (const e of this._enemies) {
      if (!e.alive) { toRemove.push(e); continue; }
      if (e.reached) {
        this.loseLife(e.damage);
        e.alive = false;
        e.destroy();
        toRemove.push(e);
        this._aliveCount--;
        this._checkWaveEnd();
        continue;
      }
      if (e.isBlocked()) {
        e.attackSoldiers(time);
      } else {
        e.update(dt);
      }
    }
    for (const e of toRemove) {
      const idx = this._enemies.indexOf(e);
      if (idx >= 0) this._enemies.splice(idx, 1);
    }

    // Torres — passam dt para escalar cooldowns no modo rápido
    for (const t of this._towers) t.update(time, this._enemies, this._fastMode ? 2 : 1);

    // Soldados de reforço
    if (this._reinfSoldiers) {
      this._reinfSoldiers = this._reinfSoldiers.filter(s => s.alive);
      for (const s of this._reinfSoldiers) s.update(time, this._enemies);
    }
  }
}
