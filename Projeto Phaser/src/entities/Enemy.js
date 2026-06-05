import { ENEMY_DATA } from '../utils/EnemyData.js';

export default class Enemy extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} type   — chave de ENEMY_DATA
   * @param {Phaser.Curves.Path} path
   */
  constructor(scene, type, path) {
    const data = ENEMY_DATA[type];
    const pt   = path.getPoint(0);
    super(scene, pt.x, pt.y);

    this.data_ref   = data;
    this.type       = type;
    this.path       = path;
    this.pathT      = 0;
    this.speed      = data.speed;
    this.maxHp      = data.hp;
    this.hp         = data.hp;
    this.armor      = data.armor      || 0;
    this.magicArmor = data.magicArmor || 0;
    this.regen      = data.regen      || 0;
    this.flying     = data.flying     || false;
    this.heavyArmor = data.heavyArmor || false;
    this.reward     = data.reward;
    this.damage     = data.damage;
    this.alive      = true;
    this.slowUntil  = 0;
    this._soldiers  = [];

    // ── Sprite ────────────────────────────────────────────────────────────
    const sprite = scene.add.image(0, 0, type);
    this.add(sprite);

    // ── Ícone de tipo (voador / armadura) ─────────────────────────────────
    if (this.flying) {
      const wing = scene.add.text(0, -data.size - 2, '🦅', {
        fontSize: '10px'
      }).setOrigin(0.5);
      this.add(wing);
    }
    if (this.heavyArmor) {
      const shield = scene.add.text(data.size - 4, -data.size + 2, '🛡', {
        fontSize: '9px'
      }).setOrigin(0.5);
      this.add(shield);
    }
    if (this.magicArmor > 0.3) {
      const mshield = scene.add.text(-data.size + 4, -data.size + 2, '✨', {
        fontSize: '9px'
      }).setOrigin(0.5);
      this.add(mshield);
    }

    // ── Barra de vida ─────────────────────────────────────────────────────
    const barBg = scene.add.rectangle(
      0, -data.size - 8, data.size * 2, 5, 0x330000
    );
    const barFg = scene.add.rectangle(
      -data.size, -data.size - 8, data.size * 2, 5, 0x00e676
    ).setOrigin(0, 0.5);
    this._barFg = barFg;
    this.add([barBg, barFg]);

    scene.add.existing(this);
    this._pathLen = path.getLength();
  }

  update(delta) {
    if (!this.alive) return;

    // Regeneração (troll)
    if (this.regen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * delta / 1000);
      this.updateBar();
    }

    // Velocidade com slow
    const now = Date.now();
    const spd = (now < this.slowUntil) ? this.speed * 0.4 : this.speed;
    const tDelta = (spd / this._pathLen) * (delta / 1000);
    this.pathT += tDelta;

    if (this.pathT >= 1) {
      this.reached = true;
      return;
    }

    const pt = this.path.getPoint(this.pathT);
    this.setPosition(pt.x, pt.y);
  }

  /**
   * Recebe dano.
   * @param {number} amount     dano base
   * @param {boolean} isMagic   true = dano mágico (aplica magicArmor em vez de armor)
   * @param {boolean} ignoreAll true = ignora toda a armadura
   */
  takeDamage(amount, isMagic = false, ignoreAll = false) {
    if (!this.alive) return false;
    let eff;
    if (ignoreAll) {
      eff = amount;
    } else if (isMagic) {
      eff = amount * (1 - this.magicArmor);
    } else {
      eff = amount * (1 - this.armor);
    }
    this.hp -= eff;
    this.updateBar();
    if (this.hp <= 0) { this.die(); return true; }
    return false;
  }

  applySlow(ms) {
    this.slowUntil = Math.max(this.slowUntil, Date.now() + ms);
    this.list[0]?.setTint(0x88ccff);
  }

  die() {
    this.alive = false;
    this.scene.tweens.add({
      targets: this, alpha: 0, scaleX: 1.4, scaleY: 1.4,
      duration: 280,
      onComplete: () => this.destroy()
    });
  }

  updateBar() {
    const pct = Math.max(0, this.hp / this.maxHp);
    const maxW = this.data_ref.size * 2;
    this._barFg.setSize(maxW * pct, 5);
    this._barFg.setX(-this.data_ref.size);
    const color = pct > 0.6 ? 0x00e676 : pct > 0.3 ? 0xffeb3b : 0xef5350;
    this._barFg.setFillStyle(color);
  }

  addSoldierBlock(soldier) { this._soldiers.push(soldier); }

  isBlocked() {
    this._soldiers = this._soldiers.filter(s => s.alive);
    // Voadores nunca são bloqueados
    if (this.flying) return false;
    // Bloqueado se tiver pelo menos 1 soldado vivo a combatê-lo
    return this._soldiers.length > 0;
  }

  /** Inimigo ataca soldados que o bloqueiam */
  attackSoldiers(time) {
    if (!this._lastSoldierAtk) this._lastSoldierAtk = 0;
    if (time - this._lastSoldierAtk < 1200) return;
    this._lastSoldierAtk = time;
    // Ataca o primeiro soldado vivo
    for (const s of this._soldiers) {
      if (s.alive) {
        const dmg = (this.data_ref.damage || 1) * 10;
        s.takeDamage(dmg);
        break;
      }
    }
  }
}
