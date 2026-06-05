/**
 * ENEMY_DATA — define cada tipo de inimigo.
 *
 * Tipos de armadura:
 *   armor        — reduz dano físico (barracas, arqueiros, artilharia)
 *   magicArmor   — reduz dano mágico (magos)
 *   flying       — ignora barracas E artilharia (splash no chão não o atinge)
 *   heavyArmor   — flag visual para indicar armadura alta (armor >= 0.5)
 */
export const ENEMY_DATA = {
  // ── TIER 1 ────────────────────────────────────────────────────────────────
  goblin: {
    key: 'goblin', color: 0x66bb6a,
    hp: 60,   speed: 95,  reward: 8,  damage: 1, size: 16,
    armor: 0, magicArmor: 0,
    label: 'Goblin'
  },
  goblin_fast: {
    key: 'goblin_fast', color: 0xb2ff59,
    hp: 40,   speed: 140, reward: 10, damage: 1, size: 14,
    armor: 0, magicArmor: 0,
    label: 'Goblin Veloz'
  },

  // ── TIER 2 ────────────────────────────────────────────────────────────────
  orc: {
    key: 'orc', color: 0x388e3c,
    hp: 180,  speed: 60,  reward: 18, damage: 1, size: 22,
    armor: 0.15, magicArmor: 0,
    label: 'Orc'
  },
  orc_armored: {
    key: 'orc_armored', color: 0x78909c,
    hp: 190,  speed: 50,  reward: 28, damage: 1, size: 24,
    armor: 0.45, magicArmor: 0,       // Alta armadura física
    heavyArmor: true,
    label: 'Orc Blindado'
  },

  // ── TIER 3 ────────────────────────────────────────────────────────────────
  troll: {
    key: 'troll', color: 0x1b5e20,
    hp: 320,  speed: 45,  reward: 34, damage: 2, size: 28,
    armor: 0.2, magicArmor: 0,
    regen: 8,
    label: 'Troll'
  },
  harpy: {
    key: 'harpy', color: 0xce93d8,
    hp: 160,  speed: 110, reward: 28, damage: 1, size: 18,
    armor: 0, magicArmor: 0,
    flying: true,           // Ignora barracas E artilharia
    label: 'Harpia'
  },
  golem: {
    key: 'golem', color: 0x5d4037,
    hp: 480,  speed: 35,  reward: 55, damage: 2, size: 32,
    armor: 0.5, magicArmor: 0,        // Altíssima armadura física
    heavyArmor: true,
    label: 'Golem'
  },

  // ── TIER 4 ────────────────────────────────────────────────────────────────
  dark_knight: {
    key: 'dark_knight', color: 0x37474f,
    hp: 420,  speed: 55,  reward: 44, damage: 2, size: 26,
    armor: 0.32, magicArmor: 0,
    label: 'Cavaleiro Negro'
  },
  necromancer: {
    key: 'necromancer', color: 0x7b1fa2,
    hp: 300,  speed: 65,  reward: 50, damage: 2, size: 22,
    armor: 0.1, magicArmor: 0.45,     // Alta armadura mágica
    label: 'Necromante'
  },
  wyvern: {
    key: 'wyvern', color: 0xf57f17,
    hp: 320,  speed: 100, reward: 55, damage: 2, size: 26,
    armor: 0.1, magicArmor: 0.2,
    flying: true,
    label: 'Wyvern'
  },

  // ── TIER 5 (boss) ─────────────────────────────────────────────────────────
  demon: {
    key: 'demon', color: 0xb71c1c,
    hp: 700,  speed: 70,  reward: 90, damage: 3, size: 32,
    armor: 0.25, magicArmor: 0.25,
    flying: true,
    label: 'Demônio'
  },
  lich: {
    key: 'lich', color: 0x4a148c,
    hp: 560,  speed: 55,  reward: 100, damage: 3, size: 30,
    armor: 0.1, magicArmor: 0.55,      // Quase imune a magia
    label: 'Lich'
  }
};
