/**
 * WAVES — vagas com dificuldade crescente e bem balanceada.
 * Princípio: cada nível começa suave e cresce gradualmente.
 * O nível 1 é o tutorial; os seguintes aumentam o teto, não o piso.
 */
export const LEVEL_WAVES = {
  1: [
    [{type:'goblin',count:6,interval:1000}],
    [{type:'goblin',count:5,interval:800},{type:'goblin_fast',count:3,interval:700}],
    [{type:'goblin',count:4,interval:700},{type:'orc',count:3,interval:1300}],
    [{type:'orc',count:4,interval:1100},{type:'harpy',count:3,interval:1000}],
    [{type:'orc_armored',count:3,interval:1400},{type:'troll',count:2,interval:1800},{type:'goblin_fast',count:5,interval:600}],
    [{type:'troll',count:2,interval:1800},{type:'dark_knight',count:3,interval:1600},{type:'harpy',count:4,interval:900},{type:'boss_forest',count:1,interval:0,preDelay:4000}]
  ],
  2: [
    // Começa suave — semelhante ao início do nível 1
    [{type:'goblin',count:7,interval:900}],
    [{type:'goblin',count:5,interval:700},{type:'goblin_fast',count:4,interval:600}],
    [{type:'orc',count:4,interval:1100},{type:'harpy',count:3,interval:1000}],
    [{type:'orc',count:4,interval:900},{type:'orc_armored',count:3,interval:1400}],
    [{type:'troll',count:3,interval:1600},{type:'harpy',count:4,interval:900},{type:'goblin_fast',count:5,interval:600}],
    [{type:'orc_armored',count:4,interval:1200},{type:'dark_knight',count:3,interval:1500},{type:'wyvern',count:3,interval:1100}],
    [{type:'troll',count:3,interval:1500},{type:'necromancer',count:3,interval:1400},{type:'dark_knight',count:4,interval:1200},{type:'demon',count:2,interval:2500},{type:'boss_ruins',count:1,interval:0,preDelay:4000}]
  ],
  3: [
    [{type:'goblin',count:7,interval:900}],
    [{type:'goblin',count:5,interval:700},{type:'goblin_fast',count:4,interval:600}],
    [{type:'orc',count:5,interval:900},{type:'harpy',count:4,interval:900}],
    [{type:'orc',count:4,interval:800},{type:'orc_armored',count:4,interval:1300},{type:'troll',count:2,interval:1700}],
    [{type:'troll',count:3,interval:1500},{type:'dark_knight',count:4,interval:1300},{type:'harpy',count:5,interval:800}],
    [{type:'orc_armored',count:5,interval:1100},{type:'necromancer',count:4,interval:1300},{type:'wyvern',count:4,interval:1000}],
    [{type:'golem',count:2,interval:2500},{type:'dark_knight',count:5,interval:1200},{type:'wyvern',count:5,interval:900}],
    [{type:'troll',count:4,interval:1400},{type:'necromancer',count:5,interval:1200},{type:'demon',count:3,interval:2200}],
    [{type:'golem',count:3,interval:2200},{type:'demon',count:4,interval:1800},{type:'lich',count:3,interval:2500},{type:'boss_chaos',count:1,interval:0,preDelay:4000}]
  ],
  4: [
    [{type:'goblin',count:8,interval:800}],
    [{type:'orc',count:6,interval:800},{type:'harpy',count:5,interval:800}],
    [{type:'orc_armored',count:5,interval:1100},{type:'troll',count:3,interval:1500},{type:'wyvern',count:4,interval:1000}],
    [{type:'troll',count:4,interval:1300},{type:'dark_knight',count:5,interval:1200},{type:'harpy',count:6,interval:700}],
    [{type:'golem',count:2,interval:2300},{type:'necromancer',count:5,interval:1200},{type:'wyvern',count:5,interval:900}],
    [{type:'golem',count:3,interval:2000},{type:'dark_knight',count:6,interval:1100},{type:'demon',count:3,interval:2000}],
    [{type:'golem',count:3,interval:1800},{type:'necromancer',count:6,interval:1100},{type:'demon',count:4,interval:1700},{type:'lich',count:3,interval:2300}],
    [{type:'golem',count:4,interval:1800},{type:'demon',count:6,interval:1400},{type:'lich',count:4,interval:2000},{type:'boss_demon',count:1,interval:0,preDelay:5000}]
  ]
};

export function totalWaves(level) { return LEVEL_WAVES[level]?.length ?? 0; }
export function waveClearBonus(waveIndex) { return 80 + waveIndex * 25; }
export function waveRewardMultiplier(waveIndex) { return 1.0 + waveIndex * 0.2; }

// ── MODO INFINITO ────────────────────────────────────────────────────────────
// Waves geradas proceduralmente: o pool de inimigos alarga com a wave,
// a contagem cresce e cada inimigo recebe +10% HP/velocidade por wave.
// Boss a cada 10 waves (roda pelos 4 bosses).

const ENDLESS_TIERS = [
  { from: 0,  types: ['goblin', 'goblin_fast'] },
  { from: 2,  types: ['orc', 'harpy'] },
  { from: 4,  types: ['orc_armored', 'troll'] },
  { from: 6,  types: ['dark_knight', 'wyvern'] },
  { from: 8,  types: ['necromancer', 'golem'] },
  { from: 11, types: ['demon', 'lich'] }
];
const ENDLESS_BOSSES = ['boss_forest', 'boss_ruins', 'boss_chaos', 'boss_demon'];
const ENDLESS_SPEED_CAP = 1.8;   // velocidade nunca passa de +80% (jogável)

/** Multiplicadores de stats para a wave `waveIndex` (0-based) do modo infinito. */
export function endlessScale(waveIndex) {
  const m = 1 + waveIndex * 0.1;
  return { hp: m, speed: Math.min(m, ENDLESS_SPEED_CAP) };
}

/** Pseudo-aleatório determinístico — a mesma wave tem sempre a mesma composição. */
function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/** Gera a definição da wave `waveIndex` (0-based) no formato de LEVEL_WAVES. */
export function generateEndlessWave(waveIndex, level = 1) {
  const rnd   = seeded(waveIndex * 31 + level * 7 + 1);
  const pool  = ENDLESS_TIERS.filter(t => waveIndex >= t.from).flatMap(t => t.types);
  // Favorece os tiers mais recentes: escolhe sobretudo da metade superior do pool
  const pick  = () => {
    const lo = rnd() < 0.65 ? Math.floor(pool.length / 2) : 0;
    return pool[lo + Math.floor(rnd() * (pool.length - lo))];
  };

  const groups = Math.min(1 + Math.floor(waveIndex / 3), 4);
  const wave = [];
  for (let g = 0; g < groups; g++) {
    const type  = pick();
    const count = 4 + Math.floor(waveIndex / 2) + Math.floor(rnd() * 3);
    const interval = Math.max(450, 1100 - waveIndex * 25);
    const existing = wave.find(w => w.type === type);
    if (existing) existing.count += count;
    else wave.push({ type, count, interval });
  }

  if ((waveIndex + 1) % 10 === 0) {
    const boss = ENDLESS_BOSSES[Math.floor(waveIndex / 10) % ENDLESS_BOSSES.length];
    wave.push({ type: boss, count: 1, interval: 0, preDelay: 4000 });
  }
  return wave;
}

/** Definição de wave para qualquer modo. */
export function getWaveDef(level, waveIndex, endless = false) {
  return endless ? generateEndlessWave(waveIndex, level) : LEVEL_WAVES[level]?.[waveIndex];
}

// ── LEADERBOARD LOCAL DO MODO INFINITO ───────────────────────────────────────
const LB_SIZE = 5;
const lbKey = (level) => 'kr_endless_' + level;

/** Top 5 do nível, ordenado por wave e depois score. */
export function getEndlessLeaderboard(level) {
  try {
    const list = JSON.parse(localStorage.getItem(lbKey(level)) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch (_) { return []; }
}

/**
 * Regista uma run. Devolve a posição (0-based) no top 5, ou -1 se não entrou.
 */
export function submitEndlessRun(level, wave, score) {
  const entry = { wave, score, date: new Date().toISOString().slice(0, 10) };
  const list  = getEndlessLeaderboard(level);
  list.push(entry);
  list.sort((a, b) => b.wave - a.wave || b.score - a.score);
  const top = list.slice(0, LB_SIZE);
  try { localStorage.setItem(lbKey(level), JSON.stringify(top)); } catch (_) {}
  return top.indexOf(entry);
}
