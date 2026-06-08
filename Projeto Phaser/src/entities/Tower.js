import { TOWER_DATA } from '../utils/TowerData.js';
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
    this.towerType = towerType;
    this.level     = 0;
    this.def       = TOWER_DATA[towerType];
    this.lastFired = 0;
    this.target    = null;

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

  get stats() { return this.def.levels[this.level]; }

  upgrade() {
    if (this.level >= this.def.levels.length - 1) return false;
    this.level++;
    this._sprite.setTexture('tower_' + this.towerType + '_' + (this.level + 1));
    this._levelText.setText(this.stats.label);
    Settings.playSfx(this.scene, 'sfx_upgrade');
    this.scene.tweens.add({ targets: this, scaleX: 1.3, scaleY: 1.3, duration: 140, yoyo: true });
    return true;
  }

  canUpgrade()  { return this.level < this.def.levels.length - 1; }
  upgradeCost() { return this.stats.upgradeCost; }

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
    const dmg = this.stats.damage;
    new Projectile(this.scene, this.x, this.y, enemy, {
      texture: 'proj_arrow', speed: 340,
      onHit: (e) => { if (e.takeDamage(dmg,false,false)) this.scene.events.emit('enemyKilled',e); }
    });
  }
}

// ─── MAGE ────────────────────────────────────────────────────────────────────
export class MageTower extends Tower {
  constructor(scene, x, y) { super(scene, x, y, 'mage'); }
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
            if (Phaser.Math.Distance.Between(e.x,e.y,ae.x,ae.y) <= splash) {
              ae.applySlow(1800);
              if (ae.takeDamage(dmg*0.6,true,false)) this.scene.events.emit('enemyKilled',ae);
            }
          }
        } else {
          e.applySlow(1800);
          if (e.takeDamage(dmg,true,false)) this.scene.events.emit('enemyKilled',e);
        }
      }
    });
  }
}

// ─── ARTILLERY ───────────────────────────────────────────────────────────────
export class ArtilleryTower extends Tower {
  constructor(scene, x, y) { super(scene, x, y, 'artillery'); }
  canTarget(enemy) { return !enemy.flying; }
  fire(enemy) {
    Settings.playSfx(this.scene, 'sfx_shoot_cannon');
    const splash = this.stats.splashRadius;
    const dmg    = this.stats.damage;
    new Projectile(this.scene, this.x, this.y, enemy, {
      texture: 'proj_cannon', speed: 210,
      onHit: (e, all) => {
        const exp = this.scene.add.image(e.x,e.y,'explosion').setDepth(5);
        this.scene.tweens.add({targets:exp,alpha:0,scale:1.6,duration:420,onComplete:()=>exp.destroy()});
        Settings.playSfx(this.scene,'sfx_explosion');
        for (const ae of all) {
          if (!ae.alive || ae.flying) continue;
          const d = Phaser.Math.Distance.Between(e.x,e.y,ae.x,ae.y);
          if (d <= splash) {
            if (ae.takeDamage(dmg*(1-d/splash),false,false)) this.scene.events.emit('enemyKilled',ae);
          }
        }
      }
    });
  }
}

// ─── BARRACKS ────────────────────────────────────────────────────────────────
export class BarracksTower extends Tower {
  constructor(scene, x, y) {
    super(scene, x, y, 'barracks');
    this._soldiers      = [];
    this._respawnTimers = [];
    this._spawnDelay    = 8000;

    // Rally inicial — fazer snap ao tile de pista mais próximo da torre
    let rx = x + 48, ry = y + 32;
    if (scene._snapToPath) {
      const snapped = scene._snapToPath(x, y);
      if (snapped) { rx = snapped.x; ry = snapped.y; }
    }
    this._rallyX = rx;
    this._rallyY = ry;

    // Marcador de rally — arrastável, só fica em tiles de pista
    this._rallyMarker = scene.add.text(this._rallyX, this._rallyY, '⚑', {
      fontSize: '18px', color: '#42a5f5'
    }).setOrigin(0.5).setDepth(6).setAlpha(0.9)
      .setInteractive({ useHandCursor: true, draggable: true });

    scene.input.setDraggable(this._rallyMarker);

    this._rallyMarker.on('dragstart', () => this._rallyMarker.setAlpha(1));

    this._rallyMarker.on('drag', (ptr, dx, dy) => {
      // Snap ao tile de pista — só aceita posições na pista
      const snapped = scene._snapToPath ? scene._snapToPath(dx, dy) : null;
      if (snapped) {
        this._rallyMarker.setPosition(snapped.x, snapped.y);
        this._rallyX = snapped.x;
        this._rallyY = snapped.y;
      }
    });

    this._rallyMarker.on('dragend', () => {
      this._rallyMarker.setAlpha(0.9);
      for (const s of this._soldiers) {
        s._rallyX = this._rallyX;
        s._rallyY = this._rallyY;
      }
    });
  }

  setRally(x, y) {
    this._rallyX = x; this._rallyY = y;
    this._rallyMarker?.setPosition(x, y);
    for (const s of this._soldiers) { s._rallyX = x; s._rallyY = y; }
  }

  update(time, enemies) {
    const maxSoldiers = this.stats.soldiers;

    // Limpar soldados mortos e agendar respawn (um timer por morte)
    for (let i = this._soldiers.length - 1; i >= 0; i--) {
      if (!this._soldiers[i].alive) {
        this._soldiers.splice(i, 1);
        this._respawnTimers.push(time + this._spawnDelay);
      }
    }

    // Processar timers de respawn vencidos
    this._respawnTimers = this._respawnTimers.filter(t => {
      if (time >= t && this._soldiers.length < maxSoldiers) {
        this.spawnSoldier();
        return false;
      }
      return true;
    });

    // Spawn inicial — criar TODOS os soldados em falta de uma vez
    if (this._soldiers.length < maxSoldiers && this._respawnTimers.length === 0) {
      const missing = maxSoldiers - this._soldiers.length;
      for (let i = 0; i < missing; i++) this.spawnSoldier();
    }

    for (const sol of this._soldiers) sol.update(time, enemies);
  }

  spawnSoldier() {
    const idx = this._soldiers.length;
    // Offset em formação para não empilhar
    const offsets = [{x:0,y:0},{x:20,y:0},{x:-20,y:0},{x:0,y:20}];
    const off = offsets[idx % offsets.length];
    const sol = new Soldier(
      this.scene, this._rallyX + off.x, this._rallyY + off.y,
      this.stats, this._rallyX, this._rallyY
    );
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
    this._target = target;
    this._speed  = opts.speed;
    this._onHit  = opts.onHit;
    this.setDepth(4);
    scene.add.existing(this);
    scene.events.on('update', this._tick, this);
  }

  _tick(time, delta) {
    if (!this._target?.alive) { this.destroy(); return; }
    const tx = this._target.x, ty = this._target.y;
    const dist = Phaser.Math.Distance.Between(this.x,this.y,tx,ty);
    const step = this._speed * delta / 1000;
    if (dist <= step + 4) {
      this._onHit(this._target, this.scene._enemies || []);
      this.destroy(); return;
    }
    const angle = Math.atan2(ty-this.y, tx-this.x);
    this.x += Math.cos(angle)*step;
    this.y += Math.sin(angle)*step;
    this.setRotation(angle);
  }

  destroy() {
    this.scene?.events.off('update', this._tick, this);
    super.destroy();
  }
}

// ─── SOLDIER ─────────────────────────────────────────────────────────────────
export class Soldier extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, stats, rallyX, rallyY) {
    super(scene, x, y, 'soldier', 0);
    this.alive        = true;
    this._hp          = stats.hp;
    this._maxHp       = stats.hp;
    this._dmg         = stats.soldierDmg;
    this._atkRate     = 1100;
    this._atkTimer    = 0;
    this._target      = null;
    // Nota: dano recebido é gerido por Enemy.attackSoldiers (uma vez por 1200ms)
    this._rallyX      = rallyX;
    this._rallyY      = rallyY;
    this._combatRange = 50;
    this._curAnim     = '';
    this.setDisplaySize(28, 28);
    this.setDepth(3);
    scene.add.existing(this);
    this._setAnim('soldier_idle');

    this._barBg = scene.add.rectangle(x, y-16, 24, 4, 0x330000).setDepth(4);
    this._barFg = scene.add.rectangle(x-12, y-16, 24, 4, 0x00e676).setOrigin(0,0.5).setDepth(4);
  }

  _setAnim(key) {
    if (key === 'soldier_attack') {
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

    // Limpar target morto
    if (this._target && !this._target.alive) {
      this._target._engagedSoldiers = (this._target._engagedSoldiers || 1) - 1;
      this._target = null;
    }

    // Procurar inimigo para combater (nunca voadores)
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
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d > 28) {
        this.x += (dx/d) * 2.5;
        this.y += (dy/d) * 2.5;
        this._setAnim('soldier_walk');
        this.setFlipX(dx < 0);
      } else {
        if (time - this._atkTimer >= this._atkRate) {
          this._setAnim('soldier_attack');
          if (this._target.takeDamage(this._dmg, false, false)) {
            this.scene.events.emit('enemyKilled', this._target);
            this._target = null;
          }
          this._atkTimer = time;
        } else if (this.anims.currentAnim?.key !== 'soldier_attack') {
          this._setAnim('soldier_idle');
        }
      }
    } else {
      const dx = this._rallyX - this.x;
      const dy = this._rallyY - this.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d > 6) {
        this.x += dx/d * 2; this.y += dy/d * 2;
        this._setAnim('soldier_walk');
        this.setFlipX(dx < 0);
      } else {
        this._setAnim('soldier_idle');
      }
    }

    this._barBg.setPosition(this.x, this.y-16);
    this._barFg.setPosition(this.x-12, this.y-16);
    this._barFg.setSize(24 * Math.max(0, this._hp/this._maxHp), 4);
  }

  takeDamage(dmg) {
    this._hp -= dmg;
    if (this._hp <= 0) { this.die(); return true; }
    return false;
  }

  die() {
    this.alive = false;
    if (this._target) {
      this._target._engagedSoldiers = Math.max(0, (this._target._engagedSoldiers||1)-1);
      this._target = null;
    }
    this._barBg?.destroy(); this._barFg?.destroy();
    this.play('soldier_die');
    this.scene?.tweens.add({ targets: this, alpha: 0, delay: 450, duration: 250,
      onComplete: () => this.destroy() });
  }
}
