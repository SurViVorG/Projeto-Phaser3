import { TOWER_DATA } from '../utils/TowerData.js';
import { PATH_TILES } from '../utils/PathData.js';
import Settings from '../utils/Settings.js';

const GAME_W = 1150;
const GAME_H = 640;

function clampToMap(x, y) {
  return {
    x: Phaser.Math.Clamp(x, 32, GAME_W - 32),
    y: Phaser.Math.Clamp(y, 92, GAME_H - 32)
  };
}

// ─── BASE TOWER ──────────────────────────────────────────────────────────────
export class Tower extends Phaser.GameObjects.Container {
  constructor(scene, x, y, towerType) {
    super(scene, x, y);
    this.towerType   = towerType;
    this.level       = 0;
    this.chosenPath  = null;
    this.def         = TOWER_DATA[towerType];
    this.lastFired   = 0;
    this.target      = null;

    this._sprite = scene.add.image(0, 0, 'tower_' + towerType);
    this.add(this._sprite);

    this._levelText = scene.add.text(14, -22, 'I', {
      fontFamily: 'monospace', fontSize: '11px',
      color: '#f0c040', backgroundColor: '#000',
      padding: { x: 2, y: 1 }
    }).setOrigin(0.5);
    this.add(this._levelText);

    scene.add.existing(this);
  }

  get stats() {
    if (this.level === 3 && this.chosenPath) return this.def.paths[this.chosenPath];
    return this.def.levels[Math.min(this.level, 2)];
  }

  /** Sobe nível normal (I→II→III). Não chama para escolha de caminho. */
  upgrade() {
    if (this.level >= 2) return false;
    this.level++;
    this._sprite.setTexture('tower_' + this.towerType + '_' + (this.level + 1));
    this._levelText.setText(this.stats.label);
    Settings.playSfx(this.scene, 'sfx_upgrade');
    this.scene.tweens.add({ targets: this, scaleX: 1.3, scaleY: 1.3, duration: 140, yoyo: true });
    return true;
  }

  /** Escolhe caminho IV (A ou B). Só pode ser chamado em nível III. */
  choosePath(path) {
    if (!this.def.paths || this.level !== 2 || this.chosenPath) return false;
    this.chosenPath = path;
    this.level = 3;

    const texKey = 'tower_' + this.towerType + '_4' + path.toLowerCase();
    if (this.scene.textures.exists(texKey)) this._sprite.setTexture(texKey);

    const pd = this.def.paths[path];
    this._levelText.setText(pd.label.substring(0, 4).toUpperCase());
    this._levelText.setColor(path === 'A' ? '#f0c040' : '#42a5f5');
    Settings.playSfx(this.scene, 'sfx_upgrade');
    this.scene.tweens.add({ targets: this, scaleX: 1.35, scaleY: 1.35, duration: 160, yoyo: true });
    return true;
  }

  canUpgrade()  { return this.level < 2; }
  hasPaths()    { return this.level === 2 && !!this.def.paths && !this.chosenPath; }
  upgradeCost() { return this.stats?.upgradeCost ?? null; }

  inRange(enemy) {
    return Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y) <= this.stats.range;
  }

  findTarget(enemies) {
    let best = null, bestT = -1;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (!this.inRange(e)) continue;
      if (!this.canTarget(e)) continue;
      if (e.pathT > bestT) { bestT = e.pathT; best = e; }
    }
    return best;
  }

  canTarget(enemy) { return true; }
  fire(enemy) {}

  update(time, enemies) {
    if (!enemies || enemies.length === 0) return;
    if (this.target && (!this.target.alive || !this.inRange(this.target))) this.target = null;
    if (!this.target) this.target = this.findTarget(enemies);
    if (!this.target) return;

    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    this._sprite.setRotation(angle + Math.PI / 2);

    if (time - this.lastFired >= this.stats.fireRate) {
      this.fire(this.target);
      this.lastFired = time;
    }
  }
}

// ─── ARCHER ──────────────────────────────────────────────────────────────────
export class ArcherTower extends Tower {
  constructor(scene, x, y) { super(scene, x, y, 'archer'); }

  fire(enemy) {
    Settings.playSfx(this.scene, 'sfx_shoot_arrow');
    const dmg         = this.stats.damage;
    const ignoreArmor = !!this.stats.ignoreArmor;
    const piercing    = !!this.stats.piercing;

    new Projectile(this.scene, this.x, this.y, enemy, {
      texture: 'proj_arrow', speed: 340,
      onHit: (e, all) => {
        if (e.takeDamage(dmg, false, ignoreArmor))
          this.scene.events.emit('enemyKilled', e);
        if (piercing) {
          let hits = 0;
          for (const ae of all) {
            if (!ae.alive || ae === e) continue;
            if (Phaser.Math.Distance.Between(e.x, e.y, ae.x, ae.y) <= 48) {
              if (ae.takeDamage(dmg, false, ignoreArmor))
                this.scene.events.emit('enemyKilled', ae);
              if (++hits >= 2) break;
            }
          }
        }
      }
    });
  }
}

// ─── MAGE ────────────────────────────────────────────────────────────────────
export class MageTower extends Tower {
  constructor(scene, x, y) {
    super(scene, x, y, 'mage');
    this._necroListener = null;
  }

  choosePath(path) {
    const ok = super.choosePath(path);
    if (ok && path === 'B') {
      // Necromante: ao matar inimigo em alcance, 55% chance de spawnar zombie
      this._necroListener = (e) => {
        if (!this.scene || !this.active) return;
        if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) > this.stats.range) return;
        if (Math.random() > 0.55) return;
        const z = new Soldier(
          this.scene, e.x, e.y,
          { hp: 80, soldierDmg: 15 },
          e.x, e.y
        );
        z._tintVal = 0x88ff88;
        z._sprite?.setTint?.(0x88ff88);
        this.scene._reinfSoldiers?.push(z);
        this.scene.time.delayedCall(this.stats.zombieDuration || 8000, () => {
          if (z.alive) z.die();
        });
      };
      this.scene.events.on('enemyKilled', this._necroListener);
    }
    return ok;
  }

  update(time, enemies) {
    if (this.chosenPath === 'A') {
      // Campo de slow contínuo
      for (const e of enemies) {
        if (!e.alive) continue;
        if (this.inRange(e)) e.applySlow(this.stats.slowMs || 2500);
      }
      // Pulso de dano periódico
      const fr = this.stats.fireRate || 2500;
      if (time - this.lastFired >= fr) {
        let hitAny = false;
        for (const e of enemies) {
          if (!e.alive || !this.inRange(e)) continue;
          hitAny = true;
          if (e.takeDamage(this.stats.damage, true, false))
            this.scene.events.emit('enemyKilled', e);
        }
        const ring = this.scene.add.image(this.x, this.y, 'range_circle')
          .setDisplaySize(this.stats.range * 2, this.stats.range * 2)
          .setDepth(5).setTint(0x88ddff).setAlpha(hitAny ? 0.5 : 0.18);
        this.scene.tweens.add({
          targets: ring, alpha: 0, scaleX: 1.15, scaleY: 1.15,
          duration: 600, onComplete: () => ring.destroy()
        });
        if (hitAny) Settings.playSfx(this.scene, 'sfx_shoot_magic');
        this.lastFired = time;
      }
      return;
    }
    super.update(time, enemies);
  }

  fire(enemy) {
    Settings.playSfx(this.scene, 'sfx_shoot_magic');
    const splash = this.stats.splashRadius || 0;
    const dmg    = this.stats.damage;
    new Projectile(this.scene, this.x, this.y, enemy, {
      texture: 'proj_magic', speed: 260,
      onHit: (e, all) => {
        if (splash > 0) {
          for (const ae of all) {
            if (!ae.alive) continue;
            if (Phaser.Math.Distance.Between(e.x, e.y, ae.x, ae.y) <= splash) {
              ae.applySlow(1800);
              if (ae.takeDamage(dmg * 0.6, true, false)) this.scene.events.emit('enemyKilled', ae);
            }
          }
        } else {
          e.applySlow(1800);
          if (e.takeDamage(dmg, true, false)) this.scene.events.emit('enemyKilled', e);
        }
      }
    });
  }

  destroy(fromScene) {
    if (this._necroListener) this.scene?.events.off('enemyKilled', this._necroListener);
    super.destroy(fromScene);
  }
}

// ─── ARTILLERY ───────────────────────────────────────────────────────────────
export class ArtilleryTower extends Tower {
  constructor(scene, x, y) {
    super(scene, x, y, 'artillery');
    this._mines = [];
  }

  canTarget(enemy) {
    if (this.chosenPath === 'A') return true; // Foguete: atinge voadores
    return !enemy.flying;
  }

  update(time, enemies) {
    if (this.chosenPath === 'B') {
      this._mines = this._mines.filter(m => !m._triggered && m.active);
      for (const mine of this._mines) mine.checkTrigger(enemies);

      if ((this.scene.waveActive || this.scene._sandbox) && this._mines.length < (this.stats.maxMines || 10)) {
        if (time - this.lastFired >= (this.stats.mineDelay || 4000)) {
          const tile = this._randomPathTileInRange();
          if (tile) {
            this._placeMine(tile.x, tile.y);
            this.lastFired = time;
          }
        }
      }
      return;
    }
    super.update(time, enemies);
  }

  _randomPathTileInRange() {
    const tiles = PATH_TILES[this.scene.level] ?? [];
    const range = this.stats.range || 245;
    const valid = tiles.filter(t => {
      if (Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y) > range) return false;
      for (const m of this._mines) {
        if (m.active && !m._triggered && Math.abs(m.x - t.x) < 24 && Math.abs(m.y - t.y) < 24) return false;
      }
      return true;
    });
    if (valid.length === 0) return null;
    return Phaser.Utils.Array.GetRandom(valid);
  }

  _placeMine(tx, ty) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const dur  = 300 + dist * 1.2;
    const arc  = this.scene.add.image(this.x, this.y, 'mine')
      .setDepth(10).setDisplaySize(16, 16).setAlpha(0.85);

    const shadow = this.scene.add.ellipse(this.x, this.y + 4, 12, 6, 0x000000, 0.3)
      .setDepth(2);

    this.scene.tweens.add({
      targets: shadow, x: tx, y: ty + 4, duration: dur, ease: 'Linear',
      onComplete: () => shadow.destroy()
    });

    this.scene.tweens.add({
      targets: arc, x: tx, duration: dur, ease: 'Linear'
    });
    this.scene.tweens.add({
      targets: arc, y: ty, duration: dur, ease: 'Sine.easeIn',
      onUpdate: (tw) => {
        const p = tw.progress;
        const peakY = Math.min(this.y, ty) - 40 - dist * 0.15;
        const baseY = this.y + (ty - this.y) * p;
        arc.y = baseY + (peakY - baseY) * 4 * p * (1 - p);
      },
      onComplete: () => {
        arc.destroy();
        const mine = new Mine(this.scene, tx, ty, this);
        this._mines.push(mine);
        this.scene.tweens.add({
          targets: mine, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true
        });
        Settings.playSfx(this.scene, 'sfx_place_tower');
      }
    });
  }

  fire(enemy) {
    const isRocket = this.chosenPath === 'A';
    Settings.playSfx(this.scene, isRocket ? 'sfx_shoot_arrow' : 'sfx_shoot_cannon');
    const splash      = this.stats.splashRadius;
    const dmg         = this.stats.damage;
    const hitsFlying  = !!this.stats.hitsFlying;

    new Projectile(this.scene, this.x, this.y, enemy, {
      texture: isRocket ? 'proj_rocket' : 'proj_cannon',
      speed: isRocket ? 280 : 210,
      rotOffset: isRocket ? Math.PI / 2 : 0,
      onHit: (e, all) => {
        const exp = this.scene.add.image(e.x, e.y, 'explosion').setDepth(5);
        this.scene.tweens.add({ targets: exp, alpha: 0, scale: 1.6, duration: 420, onComplete: () => exp.destroy() });
        Settings.playSfx(this.scene, 'sfx_explosion');
        for (const ae of all) {
          if (!ae.alive) continue;
          if (!hitsFlying && ae.flying) continue;
          const d = Phaser.Math.Distance.Between(e.x, e.y, ae.x, ae.y);
          if (d <= splash) {
            if (ae.takeDamage(dmg * (1 - d / splash), false, false))
              this.scene.events.emit('enemyKilled', ae);
          }
        }
      }
    });
  }

  destroy(fromScene) {
    for (const mine of this._mines) { if (mine.active) mine.destroy(); }
    this._mines = [];
    super.destroy(fromScene);
  }
}

// ─── BARRACKS ────────────────────────────────────────────────────────────────
export class BarracksTower extends Tower {
  constructor(scene, x, y) {
    super(scene, x, y, 'barracks');
    this._soldiers      = [];
    this._respawnTimers = [];
    this._spawnDelay    = 8000;

    let rx = x + 48, ry = y + 32;
    if (scene._snapToPath) {
      const snapped = scene._snapToPath(x, y);
      if (snapped) { rx = snapped.x; ry = snapped.y; }
    }
    this._rallyX = rx;
    this._rallyY = ry;

    this._rallyMarker = scene.add.text(this._rallyX, this._rallyY, '⚑', {
      fontSize: '18px', color: '#42a5f5'
    }).setOrigin(0.5).setDepth(6).setAlpha(0.7);
  }

  choosePath(path) {
    const ok = super.choosePath(path);
    if (ok) {
      this._spawnDelay = this.stats.respawnDelay || 8000;
      this._soldiers.forEach(s => s.die());
      this._soldiers = [];
      this._respawnTimers = [];
    }
    return ok;
  }

  setRally(x, y) {
    this._rallyX = x; this._rallyY = y;
    this._rallyMarker?.setPosition(x, y);
    for (const s of this._soldiers) { s._rallyX = x; s._rallyY = y; }
  }

  update(time, enemies) {
    const maxSoldiers = this.stats.soldiers;

    for (let i = this._soldiers.length - 1; i >= 0; i--) {
      if (!this._soldiers[i].alive) {
        this._soldiers.splice(i, 1);
        this._respawnTimers.push(time + this._spawnDelay);
      }
    }

    this._respawnTimers = this._respawnTimers.filter(t => {
      if (time >= t && this._soldiers.length < maxSoldiers) {
        this.spawnSoldier();
        return false;
      }
      return true;
    });

    if (this._soldiers.length < maxSoldiers && this._respawnTimers.length === 0) {
      const missing = maxSoldiers - this._soldiers.length;
      for (let i = 0; i < missing; i++) this.spawnSoldier();
    }

    for (const sol of this._soldiers) sol.update(time, enemies);
  }

  spawnSoldier() {
    const idx = this._soldiers.length;
    const offsets = [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: -20, y: 0 }, { x: 0, y: 20 }];
    const off = offsets[idx % offsets.length];

    const spriteKey = this.chosenPath === 'A' ? 'soldier_knight'
                   : this.chosenPath === 'B' ? 'soldier_assassin'
                   : 'soldier';
    const sol = new Soldier(
      this.scene,
      this._rallyX + off.x, this._rallyY + off.y,
      this.stats,
      this._rallyX, this._rallyY,
      spriteKey
    );

    if (this.chosenPath === 'B') {
      sol._critChance = this.stats.critChance || 0;
      sol._critMult   = this.stats.critMult   || 3;
      sol._speed      = this.stats.soldierSpeed || 3.5;
    }

    this._soldiers.push(sol);
  }

  upgrade() {
    const ok = super.upgrade();
    if (ok) {
      this._soldiers.forEach(s => s.die());
      this._soldiers = [];
      this._respawnTimers = [];
    }
    return ok;
  }

  destroy(fromScene) {
    this._rallyMarker?.destroy();
    this._soldiers.forEach(s => s.die());
    super.destroy(fromScene);
  }
}

// ─── PROJECTILE ──────────────────────────────────────────────────────────────
class Projectile extends Phaser.GameObjects.Image {
  constructor(scene, x, y, target, opts) {
    super(scene, x, y, opts.texture);
    this._target    = target;
    this._speed     = opts.speed;
    this._onHit     = opts.onHit;
    this._rotOffset = opts.rotOffset || 0;
    this.setDepth(4);
    scene.add.existing(this);
    scene.events.on('update', this._tick, this);
  }

  _tick(time, delta) {
    if (!this._target?.alive) { this.destroy(); return; }
    const tx = this._target.x, ty = this._target.y;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const step = this._speed * delta / 1000;
    if (dist <= step + 4) {
      this._onHit(this._target, this.scene._enemies || []);
      this.destroy(); return;
    }
    const angle = Math.atan2(ty - this.y, tx - this.x);
    this.x += Math.cos(angle) * step;
    this.y += Math.sin(angle) * step;
    this.setRotation(angle + this._rotOffset);
  }

  destroy() {
    this.scene?.events.off('update', this._tick, this);
    super.destroy();
  }
}

// ─── MINE ────────────────────────────────────────────────────────────────────
class Mine extends Phaser.GameObjects.Image {
  constructor(scene, x, y, owner) {
    super(scene, x, y, 'mine');
    this._owner     = owner;
    this._triggered = false;
    this._armTime   = Date.now() + 1500; // 1.5s antes de ativar
    this.setDepth(2).setDisplaySize(18, 18).setAlpha(0.5);
    scene.add.existing(this);
    // Animar de semi-transparente para visível enquanto arma
    scene.tweens.add({ targets: this, alpha: 1, duration: 1400, ease: 'Linear' });
  }

  checkTrigger(enemies) {
    if (this._triggered || !this.active) return;
    if (Date.now() < this._armTime) return; // ainda a armar
    for (const e of enemies) {
      if (!e.alive || e.flying) continue;
      if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) > 20) continue;

      this._triggered = true;
      const dmg    = this._owner.stats.damage;
      const radius = this._owner.stats.splashRadius;

      const exp = this.scene.add.image(this.x, this.y, 'explosion').setDepth(5);
      this.scene.tweens.add({
        targets: exp, alpha: 0, scale: 1.8, duration: 480,
        onComplete: () => exp.destroy()
      });
      Settings.playSfx(this.scene, 'sfx_explosion');
      this.scene.cameras.main.shake(200, 0.008);

      for (const ae of enemies) {
        if (!ae.alive || ae.flying) continue;
        const d = Phaser.Math.Distance.Between(this.x, this.y, ae.x, ae.y);
        if (d <= radius) {
          if (ae.takeDamage(dmg * (1 - d / radius), false, false))
            this.scene.events.emit('enemyKilled', ae);
        }
      }
      this.destroy();
      return;
    }
  }
}

// ─── SOLDIER ─────────────────────────────────────────────────────────────────
export class Soldier extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, stats, rallyX, rallyY, spriteKey = 'soldier') {
    super(scene, x, y, spriteKey, 0);
    this.alive        = true;
    this._hp          = stats.hp;
    this._maxHp       = stats.hp;
    this._dmg         = stats.soldierDmg;
    this._atkRate     = 1100;
    this._atkTimer    = 0;
    this._target      = null;
    this._rallyX      = rallyX;
    this._rallyY      = rallyY;
    this._combatRange = 50;
    this._curAnim     = '';
    this._speed       = 2.5;
    this._critChance  = 0;
    this._critMult    = 3;
    this._spriteKey   = spriteKey;
    this.setDisplaySize(28, 28).setDepth(3);
    scene.add.existing(this);
    this._setAnim(spriteKey + '_idle');

    this._barBg = scene.add.rectangle(x, y - 16, 24, 4, 0x330000).setDepth(4);
    this._barFg = scene.add.rectangle(x - 12, y - 16, 24, 4, 0x00e676).setOrigin(0, 0.5).setDepth(4);
  }

  _setAnim(key) {
    if (key === this._spriteKey + '_attack') {
      this._curAnim = key;
      this.play(key);
      return;
    }
    if (this._curAnim === key) return;
    this._curAnim = key;
    this.play(key, true);
  }

  update(time, enemies) {
    if (!this.alive) return;

    if (this._target && !this._target.alive) {
      this._target._engagedSoldiers = (this._target._engagedSoldiers || 1) - 1;
      this._target = null;
    }

    if (!this._target) {
      let best = Infinity;
      for (const e of enemies) {
        if (!e.alive || e.flying) continue;
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (d < best && d <= this._combatRange) { best = d; this._target = e; }
      }
      if (this._target) {
        if (!this._target._engagedSoldiers) this._target._engagedSoldiers = 0;
        this._target._engagedSoldiers++;
        this._target.addSoldierBlock(this);
      }
    }

    if (this._target) {
      const dx = this._target.x - this.x;
      const dy = this._target.y - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > 28) {
        this.x += (dx / d) * this._speed;
        this.y += (dy / d) * this._speed;
        this._setAnim(this._spriteKey + '_walk');
        this.setFlipX(dx < 0);
      } else {
        if (time - this._atkTimer >= this._atkRate) {
          this._setAnim(this._spriteKey + '_attack');
          const isCrit = this._critChance > 0 && Math.random() < this._critChance;
          const dmg    = isCrit ? this._dmg * this._critMult : this._dmg;
          if (this._target.takeDamage(dmg, false, false)) {
            this.scene.events.emit('enemyKilled', this._target);
            this._target = null;
          }
          this._atkTimer = time;
        } else if (this.anims.currentAnim?.key !== this._spriteKey + '_attack') {
          this._setAnim(this._spriteKey + '_idle');
        }
      }
    } else {
      const dx = this._rallyX - this.x;
      const dy = this._rallyY - this.y;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d > 6) {
        this.x += dx / d * (this._speed * 0.8); this.y += dy / d * (this._speed * 0.8);
        this._setAnim(this._spriteKey + '_walk');
        this.setFlipX(dx < 0);
      } else {
        this._setAnim(this._spriteKey + '_idle');
      }
    }

    this._barBg.setPosition(this.x, this.y - 16);
    this._barFg.setPosition(this.x - 12, this.y - 16);
    this._barFg.setSize(24 * Math.max(0, this._hp / this._maxHp), 4);
  }

  takeDamage(dmg) {
    this._hp -= dmg;
    if (this._hp <= 0) { this.die(); return true; }
    return false;
  }

  die() {
    this.alive = false;
    if (this._target) {
      this._target._engagedSoldiers = Math.max(0, (this._target._engagedSoldiers || 1) - 1);
      this._target = null;
    }
    this._barBg?.destroy(); this._barFg?.destroy();
    if (!this.anims) { this.destroy(); return; }
    this.play('soldier_die');
    this.scene?.tweens.add({
      targets: this, alpha: 0, delay: 450, duration: 250,
      onComplete: () => this.destroy()
    });
  }
}
