# Guião Passo a Passo — Kingdom Rush TP2

## Índice
1. Configuração do projeto
2. Arquitetura e ficheiros
3. Sistema de traduções (i18n)
4. Geração de assets
5. Cenas: Boot e Preload
6. Menu principal
7. Menu de opções
8. Mapa de níveis
9. GameScene — o coração do jogo
10. Torres — construção e lógica
11. Inimigos — movimento e comportamento
12. HUD — interface de jogo
13. Poderes especiais
14. GameOver e Vitória
15. Fluxo de vagas (waves)
16. Como adicionar conteúdo futuro
17. Checklist do TP2

---

## 1. Configuração do Projeto

### Pré-requisitos
- Node.js v18+ instalado (node --version deve mostrar v18 ou superior)
- npm incluído com o Node.js

### Passos iniciais

```bash
# Entrar na pasta do projeto (já criada)
cd kingdom-rush-tp2

# Instalar dependências (Phaser 3.80 + Vite 5)
npm install

# Correr em desenvolvimento
npm run dev
# → Abre http://localhost:5173
```

### Estrutura criada
O projeto usa **ES6 modules** com **Vite** como bundler/dev server.
Vite serve ficheiros via HTTP local (necessário para módulos ES6) e
faz hot-reload ao guardar ficheiros.

---

## 2. Arquitetura e Ficheiros

### Princípio geral
Cada responsabilidade está isolada num ficheiro:

```
src/
  main.js           → configuração do Phaser, lista de cenas
  scenes/           → cada ecrã do jogo é uma cena Phaser
  entities/         → objetos do jogo (torres, inimigos, HUD)
  utils/            → dados e utilitários sem lógica de ecrã
locales/            → ficheiros JSON de tradução (PT, EN)
```

### Fluxo de cenas
```
BootScene → PreloadScene → MenuScene
                              ↓
                         OptionsScene (vai e volta)
                              ↓
                          MapScene
                              ↓
                          GameScene
                           ↙     ↘
                    GameOverScene  VictoryScene
                           ↘     ↙
                          MenuScene
```

### Como o Phaser inicia
`main.js` cria uma instância `Phaser.Game` com a config e a lista de cenas.
A primeira cena na lista (BootScene) inicia automaticamente.
Cada cena usa `this.scene.start('NomeDaCena', dados)` para transitar.

---

## 3. Sistema de Traduções (i18n)

**Ficheiros:** `locales/pt.json`, `locales/en.json`, `src/utils/I18n.js`

### Como funciona
```javascript
import I18n from '../utils/I18n.js';

// Obter texto traduzido
I18n.t('hud.gold')      // → "Ouro" (PT) ou "Gold" (EN)
I18n.t('towers.archer') // → "Arqueiros" ou "Archers"

// Mudar língua (persiste em localStorage)
I18n.setLang('en');

// Obter língua atual
I18n.getLang(); // → 'pt' ou 'en'
```

### Adicionar uma nova língua
1. Criar `locales/es.json` com a mesma estrutura
2. Importar em `I18n.js`: `import es from '../../locales/es.json'`
3. Adicionar ao objeto `TRANSLATIONS`: `const TRANSLATIONS = { pt, en, es }`
4. O seletor de língua aparece automaticamente em todas as cenas

### Regras
- **Nunca** colocar strings de UI diretamente no código — usar sempre `I18n.t()`
- Ao mudar língua em qualquer cena, fazer `this.scene.restart()` para redesenhar

---

## 4. Geração de Assets

**Ficheiro:** `src/utils/AssetGenerator.js`

### Porquê gerar programaticamente?
- Não depende de ficheiros externos para a versão funcional
- O repositório fica leve (sem PNGs grandes)
- Fácil de substituir por sprites reais mais tarde

### Como funciona
```javascript
// No PreloadScene.create():
generateAllAssets(scene);

// Internamente cada asset usa:
const g = scene.make.graphics({ add: false });
g.fillStyle(0xff0000);
g.fillRect(0, 0, 48, 48);
g.generateTexture('nome_da_textura', 48, 48);
g.destroy(); // sempre destruir o graphics após gerar
```

### Substituir por sprites reais
No `PreloadScene.preload()`, adicionar:
```javascript
this.load.image('tower_archer', 'assets/images/archer_tower.png');
this.load.spritesheet('goblin', 'assets/spritesheets/goblin.png',
  { frameWidth: 48, frameHeight: 48 });
this.load.audio('music_game', 'assets/audio/battle.ogg');
```
E remover a chamada a `generateAllAssets()` para esse asset.

---

## 5. Cenas: Boot e Preload

### BootScene
- Primeira cena a correr
- Mostra ecrã simples enquanto o Phaser inicializa
- Transita para PreloadScene após 300ms

### PreloadScene
**preload()** — carrega ficheiros externos (quando existirem)
**create()** — gera todos os assets e sons sintéticos, depois inicia MenuScene

#### Sons sintéticos
Usamos `AudioContext.createBuffer()` para criar formas de onda simples:
- `sine` → sons musicais (vitória, moeda)
- `square` → sons electrónicos (disparo)
- `noise` → explosões, impactos
- `click` → sons percussivos (tiros)

Em produção, substituir por:
```javascript
// preload()
this.load.audio('sfx_shoot_arrow', 'assets/audio/arrow.ogg');
// create() — não precisas de generateSyntheticAudio()
```

---

## 6. Menu Principal (MenuScene)

### O que faz
- Fundo com estrelas e gradiente
- Título animado
- Botões: Jogar, Opções, Créditos
- Seletor de língua PT/EN no canto superior direito

### Padrão de botão interativo
Todos os botões do jogo seguem este padrão:
```javascript
container.on('pointerover',  () => { /* mudar cor/escala */ });
container.on('pointerout',   () => { /* restaurar */ });
container.on('pointerdown',  () => { /* ação + som */ });
```

### Transições entre cenas
Sempre usar `fadeOut` antes de mudar de cena:
```javascript
this.cameras.main.fadeOut(400, 0, 0, 0);
this.cameras.main.once('camerafadeoutcomplete', () => {
  this.scene.start('OutraCena');
});
```

---

## 7. Menu de Opções (OptionsScene)

### Controlos disponíveis
- **Toggle** (liga/desliga): Música e SFX
- **Slider** (0–100%): Volume de música e SFX — arrastar com o rato
- **Seletor de língua**: botões PT / EN

### Persistência
Todas as preferências são guardadas em `localStorage` via `Settings.js`:
```javascript
Settings.setMusic(true/false);   // localStorage 'kr_musicOn'
Settings.setMusicVolume(0.7);    // localStorage 'kr_music'
Settings.setSfx(true/false);
Settings.setSfxVolume(0.8);
```
Ao reabrir o jogo, os valores são restaurados automaticamente.

### Usar Settings em qualquer cena
```javascript
import Settings from '../utils/Settings.js';

// Tocar som SFX (respeita volume e on/off)
Settings.playSfx(this, 'sfx_shoot_arrow');

// Iniciar música de fundo
Settings.playMusic(this, 'music_game');

// Parar música
Settings.stopMusic();
```

---

## 8. Mapa de Níveis (MapScene)

### O que faz
- Mostra 4 nós de nível num mapa estilizado
- Nível 1 desbloqueado; os restantes mostram cadeado
- Clique num nível desbloqueado inicia o GameScene com `{ level: id }`

### Adicionar novos níveis
Em `MapScene.js`, editar o array `LEVELS`:
```javascript
const LEVELS = [
  { id: 1, name: 'Floresta Sombria',  x: 280,  y: 340, unlocked: true  },
  { id: 2, name: 'Ruínas Antigas',    x: 520,  y: 260, unlocked: false },
  // adicionar mais...
];
```

### Desbloquear níveis automaticamente
Guardar progresso em localStorage:
```javascript
// Ao vencer o nível 1:
localStorage.setItem('kr_level_2_unlocked', 'true');

// No MapScene:
const lvl2Unlocked = localStorage.getItem('kr_level_2_unlocked') === 'true';
```

---

## 9. GameScene — O Coração do Jogo

**Ficheiro:** `src/scenes/GameScene.js`

### Estado do jogo (init)
```javascript
this.gold       = 160;   // ouro inicial
this.lives      = 20;    // vidas iniciais
this.score      = 0;
this.waveIndex  = 0;     // vaga atual (0-based)
this.waveActive = false;
this._enemies   = [];    // array de Enemy ativos
this._towers    = [];    // array de Tower colocadas
this._buildMode = null;  // tipo de torre a construir (ou null)
```

### create() — sequência de inicialização
1. `drawMap()` — desenha tiles de chão, caminho e slots
2. `buildPath()` — constrói a `Phaser.Curves.Path` para os inimigos
3. `new HUD(this)` — cria toda a interface
4. Registar eventos: `selectBuild`, `startWave`, `enemyKilled`, `activatePower`
5. Registar input: `pointermove`, `pointerdown`, teclas ESC/1-4/R

### update(time, delta) — loop de jogo
A cada frame:
1. Iterar `_enemies`: mover, detetar chegada ao fim, remover mortos
2. Iterar `_towers`: encontrar alvos, disparar projéteis
3. A lógica de projéteis é gerida pelos próprios projéteis via evento `update`

### Sistema de eventos interno
GameScene usa `this.events.emit/on` para comunicação desacoplada:
```javascript
// HUD emite:
this.events.emit('selectBuild', 'archer');
this.events.emit('startWave');
this.events.emit('activatePower', 'meteor');

// GameScene responde:
this.events.on('selectBuild', (type) => this.enterBuildMode(type));

// Torres emitem:
this.scene.events.emit('enemyKilled', enemy);
```

---

## 10. Torres — Construção e Lógica

**Ficheiro:** `src/entities/Tower.js`

### Hierarquia de classes
```
Tower (base)
  ├── ArcherTower    → dispara flechas (proj_arrow), dano direto
  ├── MageTower      → dispara magia (proj_magic), slow + dano ignora armadura
  ├── ArtilleryTower → dispara bolas de canhão (proj_cannon), splash + shake
  └── BarracksTower  → não dispara; gere Soldiers que bloqueiam e atacam
```

### Fluxo de disparo (ArcherTower como exemplo)
```
update(time, enemies)
  → findTarget(enemies)    ← inimigo mais avançado no alcance
  → rodar sprite para o alvo
  → se cooldown passou → fire(target)
       → new Projectile(...)
            → move em direção ao alvo cada frame
            → ao impactar → onHit(enemy) → enemy.takeDamage()
                                         → emit('enemyKilled') se morreu
```

### Stats por nível (TowerData.js)
```javascript
archer: {
  baseCost: 125,
  levels: [
    { damage: 10, range: 160, fireRate: 1200, upgradeCost: 100 },  // nível I
    { damage: 16, range: 180, fireRate: 1000, upgradeCost: 175 },  // nível II
    { damage: 24, range: 210, fireRate: 800,  upgradeCost: null }  // nível III (máx)
  ]
}
```
`fireRate` é em ms entre disparos. `upgradeCost: null` significa nível máximo.

### Barracas — mecânica especial
- Não disparam projéteis
- Geram `Soldier` no ponto de rally (junto da torre)
- Cada `Soldier` procura inimigos próximos (range 40px), bloqueia-os e ataca
- Inimigos bloqueados por soldados param de avançar (exceto `flying: true`)
- Soldados morrem se receberem dano suficiente e respawnam após cooldown

### Construir uma torre
```javascript
// GameScene.tryPlaceTower(px, py)
1. Encontrar slot mais próximo que não esteja ocupado
2. Verificar gold suficiente
3. createTower(type, x, y) → instância da subclasse certa
4. this._towers.push(tower)
5. Marcar slot como ocupado
6. spendGold(cost)
```

### Melhorar / Vender
```javascript
// Upgrade
tower.upgrade(); // muda sprite, aumenta stats, anima
spendGold(tower.upgradeCost());

// Venda
const val = sellValue(towerType, level); // 60% do total investido
addGold(val);
tower.destroy();
```

---

## 11. Inimigos — Movimento e Comportamento

**Ficheiro:** `src/entities/Enemy.js`

### Movimento ao longo do path
O `Enemy` usa `Phaser.Curves.Path`:
```javascript
// pathT vai de 0 (spawn) a 1 (chegada ao castelo)
const tDelta = (speed / pathLength) * (delta / 1000);
this.pathT += tDelta;
const pt = path.getPoint(this.pathT);
this.setPosition(pt.x, pt.y);
```

### Stats especiais por tipo (EnemyData.js)
```
goblin      → rápido, fraco, sem armadura
orc         → moderado, 10% armadura
troll       → lento, forte, 20% armadura, regenera 10hp/s
dark_knight → médio-rápido, 35% armadura
demon       → rápido, voador (ignora barracas), 20% armadura
```

### Armadura
```javascript
const dmgEfetivo = ignoreArmor ? dmg : dmg * (1 - enemy.armor);
```
Magos ignoram armadura (`ignoreArmor = true` no seu `onHit`).

### Slow (magos)
```javascript
enemy.applySlow(1500); // fica a 40% velocidade por 1.5s
// Internamente: this.slowUntil = Date.now() + 1500
```

### Chegada ao castelo
Se `pathT >= 1`, `enemy.reached = true`.
No `GameScene.update()`:
```javascript
if (e.reached) {
  this.loseLife(e.damage); // retira 1-3 vidas
  e.destroy();
}
```

---

## 12. HUD — Interface de Jogo

**Ficheiro:** `src/entities/HUD.js`

### Componentes
| Componente | Posição | Descrição |
|------------|---------|-----------|
| Barra superior | y=0–60 | Ouro, vidas, vaga, score |
| Painel lateral | x=1150–1280 | Botões de construção de torres |
| Painel de poderes | y=660–700, esq. | Reforços + Meteorito com cooldown |
| Botão iniciar vaga | centro baixo | Aparece entre vagas |
| Botão acelerar | centro baixo | Toggle x1/x2 |
| Painel de torre | flutuante | Aparece ao clicar uma torre |

### Comunicação com GameScene
HUD usa `scene.events.emit()` para comunicar ações ao GameScene:
```javascript
// HUD emite → GameScene ouve
scene.events.emit('selectBuild', 'archer');
scene.events.emit('startWave');
scene.events.emit('activatePower', 'meteor');
```
GameScene atualiza o HUD chamando métodos diretos:
```javascript
this._hud.setGold(this.gold);
this._hud.setLives(this.lives);
this._hud.setWave(1, 6);
this._hud.setScore(this.score);
```

### Painel de torre flutuante
Aparece ao clicar em qualquer torre colocada:
- Mostra stats atuais (dano, alcance, cadência)
- Botão Melhorar (com custo) — desativado se nível máximo
- Botão Vender (com valor de retorno)
- Círculo de alcance visual

---

## 13. Poderes Especiais

### Reforços
- Cooldown: 30 segundos
- Efeito: spawna 3 soldados temporários durante 15 segundos
- Os soldados atacam inimigos no raio de 40px com 12 de dano
- Desaparecem automaticamente após 15s com fade out

### Meteorito
- Cooldown: 45 segundos
- Ativação: clica num ponto do mapa
- Animação: meteoro cai do topo do ecrã
- Efeito: 200 dano no centro, diminuindo com a distância (raio 100px)
- Ignora armadura + camera shake

### Adicionar novos poderes
1. Em `WaveData.js` ou `HUD.js`, adicionar botão com `createPowerBtn()`
2. Emitir evento: `scene.events.emit('activatePower', 'nome_do_poder')`
3. Em `GameScene.activatePower(type)`, adicionar case:
```javascript
case 'freeze':
  this.castFreeze();
  break;
```

---

## 14. GameOver e Vitória

### Condição de derrota
```javascript
// GameScene.loseLife()
this.lives -= amount;
if (this.lives <= 0) this.endGame(false);
```

### Condição de vitória
```javascript
// GameScene.checkWaveEnd()
if (waveIndex >= totalWaves && enemies.length === 0) {
  this.endGame(true);
}
```

### endGame()
```javascript
endGame(victory) {
  this.cameras.main.fadeOut(800);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    const key = victory ? 'VictoryScene' : 'GameOverScene';
    this.scene.start(key, { score: this.score, level: this.level });
  });
}
```

### Sistema de estrelas (VictoryScene)
```javascript
const stars = score > 2000 ? 3 : score > 1000 ? 2 : 1;
```
Ajustar os thresholds conforme a dificuldade desejada.

---

## 15. Fluxo de Vagas (Waves)

**Ficheiro:** `src/utils/WaveData.js`

### Estrutura de uma vaga
```javascript
// Vaga 4 de exemplo
[
  { type: 'goblin', count: 6,  interval: 600  }, // 6 goblins, 1 a cada 600ms
  { type: 'troll',  count: 2,  interval: 2000 }, // depois 2 trolls a cada 2s
  { type: 'orc',    count: 4,  interval: 900  }  // depois 4 orcs
]
```

### Como o spawn funciona
1. `startNextWave()` converte a vaga num array de `{ type, delay }` com delays acumulados
2. `_spawnNextInQueue()` usa `this.time.delayedCall()` para spawnar um a um
3. Cada spawn cria um `Enemy` e adiciona ao `_enemies`
4. `_waveEnemiesLeft` conta down; quando chega a 0 → `checkWaveEnd()`

### Adicionar vagas
Editar `WaveData.js`:
```javascript
export const LEVEL_WAVES = {
  1: [ /* vagas existentes */ ],
  2: [
    [{ type: 'orc', count: 10, interval: 700 }],
    [{ type: 'dark_knight', count: 5, interval: 1500 }],
    // ...
  ]
};
```

---

## 16. Como Adicionar Conteúdo Futuro

### Nova torre
1. Adicionar entrada em `TowerData.js`
2. Criar subclasse em `Tower.js` que extende `Tower` e implementa `fire()`
3. Adicionar case em `GameScene.createTower()`
4. Gerar textura em `AssetGenerator.js`
5. Adicionar tradução em `pt.json` e `en.json`

### Novo inimigo
1. Adicionar entrada em `EnemyData.js`
2. A classe `Enemy` é genérica — funciona automaticamente
3. Gerar textura em `AssetGenerator.generateEnemies()`
4. Usar o novo tipo nas vagas em `WaveData.js`

### Novo nível
1. Adicionar waypoints em `PathData.js`:
   `2: [{ x:... }, { x:... }, ...]`
2. Adicionar vagas em `WaveData.js`:
   `2: [[...], [...], ...]`
3. Definir slots de torres para o nível 2 (ou generalizar o sistema de slots)
4. Desbloquear no `MapScene.js`

### Animações de spritesheet
```javascript
// PreloadScene.preload()
this.load.spritesheet('goblin_walk', 'assets/spritesheets/goblin.png',
  { frameWidth: 48, frameHeight: 48 });

// Enemy.js, no constructor
this.anims.create({
  key: 'walk',
  frames: this.scene.anims.generateFrameNumbers('goblin_walk', { start: 0, end: 7 }),
  frameRate: 10, repeat: -1
});
this.play('walk');
```

---

## 17. Checklist do TP2

### Requisitos obrigatórios
- [x] Motor Phaser 3 (v3.80) via npm
- [x] Tema livre — Tower Defense estilo Kingdom Rush
- [x] Cenas: preload, create, update em todas as GameObjects
- [x] Sprites e imagens (geradas programaticamente)
- [x] Física Arcade (grupos, velocidades, detecção de proximidade)
- [x] Input teclado (teclas 1-4, ESC, R) e rato (cliques no mapa)
- [x] Estado de jogo: score, vidas, vaga atual, Game Over, Vitória, reinício (R)
- [x] Pelo menos 1 som integrado (todos os eventos têm som)
- [x] Suporte multilíngue PT + EN com seletor acessível
- [x] Estrutura organizada em cenas, entidades e utilitários
- [x] .gitignore adequado (node_modules excluído)
- [x] README completo com todos os campos obrigatórios
- [x] Tag 1.0 a criar antes da entrega

### Pontos extra possíveis
- [x] Múltiplas cenas (8 cenas: Boot, Preload, Menu, Options, Map, Game, GameOver, Victory)
- [x] Poderes (Reforços + Meteorito)
- [x] Partículas (faíscas, sangue, magia)
- [x] Câmara com shake e fade
- [x] UI cuidada com score, vidas e instruções no jogo
- [ ] Spritesheets com animações (substituir assets sintéticos)
- [ ] Música de fundo completa
- [ ] 3+ línguas
- [ ] Aumento progressivo de dificuldade entre níveis
- [ ] GitHub Pages

### Antes de entregar
```bash
# 1. Testar em Chrome, Firefox e Edge
npm run dev

# 2. Verificar que npm run build não dá erros
npm run build

# 3. Commit final
git add .
git commit -m "versão final 1.0"

# 4. Criar tag
git tag 1.0
git push origin main --tags

# 5. Copiar commit hash
git log --oneline -1
# ex: a1b2c3d

# 6. Preencher ficheiro de entrega
# numeroaluno1_numeroaluno2.txt:
# URL: https://github.com/utilizador/kingdom-rush-tp2
# Commit: a1b2c3d
# Elemento 1: Nome — Número
# Elemento 2: Nome — Número
```
