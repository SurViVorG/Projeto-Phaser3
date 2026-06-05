/**
 * TOWER_DATA — define todas as torres e os seus níveis de melhoria.
 * Cada torre tem 3 níveis (0=base,1=nível2,2=nível3).
 */
export const TOWER_DATA = {
  barracks: {
    key: 'barracks',
    color: 0x8b5e3c,
    icon: '🏠',
    baseCost: 100,
    sellRatio: 0.6,
    levels: [
      { damage: 0,  range: 96,  fireRate: 0,    hp: 80,  soldiers: 2, soldierDmg: 10, upgradeCost: 75,  label: 'I'  },
      { damage: 0,  range: 112, fireRate: 0,    hp: 120, soldiers: 3, soldierDmg: 16, upgradeCost: 125, label: 'II' },
      { damage: 0,  range: 128, fireRate: 0,    hp: 170, soldiers: 4, soldierDmg: 22, upgradeCost: null, label: 'III' }
    ]
  },
  archer: {
    key: 'archer',
    color: 0x4a7c59,
    icon: '🏹',
    baseCost: 125,
    sellRatio: 0.6,
    levels: [
      { damage: 12, range: 160, fireRate: 1100, upgradeCost: 90,  label: 'I'  },
      { damage: 20, range: 185, fireRate: 900,  upgradeCost: 150, label: 'II' },
      { damage: 32, range: 215, fireRate: 700,  upgradeCost: null, label: 'III' }
    ]
  },
  mage: {
    key: 'mage',
    color: 0x6a0dad,
    icon: '🔮',
    baseCost: 175,
    sellRatio: 0.6,
    levels: [
      { damage: 26, range: 155, fireRate: 1800, splashRadius: 0,  upgradeCost: 130, label: 'I'  },
      { damage: 42, range: 170, fireRate: 1600, splashRadius: 0,  upgradeCost: 200, label: 'II' },
      { damage: 65, range: 185, fireRate: 1300, splashRadius: 56, upgradeCost: null, label: 'III' }
    ]
  },
  artillery: {
    key: 'artillery',
    color: 0x8b0000,
    icon: '💣',
    baseCost: 200,
    sellRatio: 0.6,
    levels: [
      { damage: 50, range: 200, fireRate: 2800, splashRadius: 100, upgradeCost: 180, label: 'I'  },
      { damage: 85, range: 225, fireRate: 2400, splashRadius: 128, upgradeCost: 260, label: 'II' },
      { damage: 120, range: 245, fireRate: 2000, splashRadius: 160, upgradeCost: null, label: 'III' }
    ]
  }
};

/** Custo de venda calculado sobre o total investido */
export function sellValue(towerType, level) {
  const td = TOWER_DATA[towerType];
  let total = td.baseCost;
  for (let i = 0; i < level; i++) {
    total += td.levels[i].upgradeCost || 0;
  }
  return Math.floor(total * td.sellRatio);
}
