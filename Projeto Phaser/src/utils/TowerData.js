/**
 * TOWER_DATA — define todas as torres e os seus níveis de melhoria.
 * Cada torre tem 3 níveis (0=base,1=nível2,2=nível3) e 2 caminhos de elite (nível IV).
 */
export const TOWER_DATA = {
  barracks: {
    key: 'barracks',
    color: 0x8b5e3c,
    icon: '🏠',
    baseCost: 100,
    sellRatio: 0.6,
    levels: [
      { damage: 0,  range: 96,  fireRate: 0, hp: 110, soldiers: 2, soldierDmg: 10, upgradeCost: 75,  label: 'I'   },
      { damage: 0,  range: 112, fireRate: 0, hp: 170, soldiers: 3, soldierDmg: 16, upgradeCost: 125, label: 'II'  },
      { damage: 0,  range: 128, fireRate: 0, hp: 250, soldiers: 4, soldierDmg: 22, upgradeCost: null, label: 'III' }
    ],
    paths: {
      A: { label: 'Cavaleiros', labelEN: 'Knights',   cost: 200,
           range: 128, hp: 750, soldiers: 4, soldierDmg: 22, respawnDelay: 12000,
           description: 'HP soldados ×3 · respawn 12 s' },
      B: { label: 'Assassinos', labelEN: 'Assassins', cost: 200,
           range: 128, hp: 250, soldiers: 4, soldierDmg: 22,
           critChance: 0.3, critMult: 3, soldierSpeed: 3.5, respawnDelay: 8000,
           description: 'Crit ×3 · soldados +50% vel' }
    }
  },
  archer: {
    key: 'archer',
    color: 0x4a7c59,
    icon: '🏹',
    baseCost: 125,
    sellRatio: 0.6,
    levels: [
      { damage: 12, range: 160, fireRate: 1100, upgradeCost: 90,  label: 'I'   },
      { damage: 20, range: 185, fireRate: 900,  upgradeCost: 150, label: 'II'  },
      { damage: 32, range: 215, fireRate: 700,  upgradeCost: null, label: 'III' }
    ],
    paths: {
      A: { label: 'Ranger',  labelEN: 'Ranger', cost: 175,
           damage: 32, range: 322, fireRate: 700, piercing: true,
           description: 'Alcance +50% · flechas perfurantes' },
      B: { label: 'Sniper',  labelEN: 'Sniper', cost: 175,
           damage: 80, range: 215, fireRate: 1100, ignoreArmor: true,
           description: 'Dano ×2.5 · ignora armadura física' }
    }
  },
  mage: {
    key: 'mage',
    color: 0x6a0dad,
    icon: '🔮',
    baseCost: 175,
    sellRatio: 0.6,
    levels: [
      { damage: 26, range: 155, fireRate: 1800, splashRadius: 0,  upgradeCost: 130, label: 'I'   },
      { damage: 42, range: 170, fireRate: 1600, splashRadius: 0,  upgradeCost: 200, label: 'II'  },
      { damage: 65, range: 185, fireRate: 1300, splashRadius: 56, upgradeCost: null, label: 'III' }
    ],
    paths: {
      A: { label: 'Gelo',       labelEN: 'Ice Mage',    cost: 225,
           damage: 35, range: 200, fireRate: 2500, slowField: true, slowMs: 2500,
           description: 'Slow permanente · pulso gelo 35dmg/2.5s' },
      B: { label: 'Necromante', labelEN: 'Necromancer', cost: 225,
           damage: 65, range: 185, fireRate: 1300, splashRadius: 56,
           necromancy: true, zombieDuration: 8000,
           description: '55% chance de reviver inimigos mortos' }
    }
  },
  artillery: {
    key: 'artillery',
    color: 0x8b0000,
    icon: '💣',
    baseCost: 200,
    sellRatio: 0.6,
    levels: [
      { damage: 50,  range: 200, fireRate: 2800, splashRadius: 100, upgradeCost: 180, label: 'I'   },
      { damage: 85,  range: 225, fireRate: 2400, splashRadius: 128, upgradeCost: 260, label: 'II'  },
      { damage: 120, range: 245, fireRate: 2000, splashRadius: 160, upgradeCost: null, label: 'III' }
    ],
    paths: {
      A: { label: 'Foguete', labelEN: 'Rocket',     cost: 250,
           damage: 120, range: 265, fireRate: 2000, splashRadius: 160, hitsFlying: true,
           description: 'Atinge voadores · splash aéreo' },
      B: { label: 'Minas',   labelEN: 'Land Mines', cost: 250,
           damage: 200, range: 245, splashRadius: 80, mineDelay: 5000, maxMines: 3,
           description: 'Coloca minas no caminho (máx 3)' }
    }
  }
};

/** Custo de venda calculado sobre o total investido (inclui caminho IV se escolhido) */
export function sellValue(towerType, level, chosenPath = null) {
  const td = TOWER_DATA[towerType];
  let total = td.baseCost;
  const capLvl = Math.min(level, td.levels.length - 1);
  for (let i = 0; i < capLvl; i++) total += td.levels[i].upgradeCost || 0;
  if (level === 3 && chosenPath && td.paths?.[chosenPath]) {
    total += td.paths[chosenPath].cost || 0;
  }
  return Math.floor(total * td.sellRatio);
}
