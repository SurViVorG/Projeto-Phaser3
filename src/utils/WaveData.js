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
