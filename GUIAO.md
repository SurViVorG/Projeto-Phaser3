# Guião Passo a Passo — Kingdom Rush TP2

## Índice
1. Configuração do projeto
2. Arquitetura e ficheiros
3. Sistema de traduções (i18n)
4. Geração de assets (procedural)
5. Cenas: Boot e Preload
6. Menu principal
7. Menu de opções
8. Mapa de níveis
9. GameScene — o coração do jogo
10. Torres — construção, upgrades e caminhos elite
11. Inimigos — movimento, armadura e bosses
12. HUD — interface de jogo
13. Poderes especiais
14. GameOver, Vitória e estrelas
15. Fluxo de vagas (waves) e bosses
16. Enciclopédia
17. Modo Sandbox
18. Como adicionar conteúdo futuro
19. Checklist do TP2

---

## 1. Configuração do Projeto

### Pré-requisitos
- Node.js v18+ instalado (node --version deve mostrar v18 ou superior)
- npm incluído com o Node.js

### Passos iniciais

```bash
# Entrar na pasta do projeto (já criada)
cd Projeto Phaser

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
  scenes/           → cada ecrã do jogo é uma cena Phaser (9 cenas)
  entities/         → objetos do jogo (torres, inimigos, HUD)
  utils/            → dados e utilitários sem lógica de ecrã
locales/            → ficheiros JSON de tradução (PT, EN)
public/assets/      → PNGs, OGGs (carregados no PreloadScene)
```

### Fluxo de cenas
```
BootScene → PreloadScene → MenuScene
                              ↓
                         OptionsScene (vai e volta)
                              ↓
                          MapScene ←──→ EncyclopediaScene
                              ↓
                     ┌── Modal ──┐
                     ↓           ↓
              GameScene    GameScene (sandbox)
                  │
            ┌─────┼──────┐
            ↓     ↓      ↓
       PauseScene  VictoryScene  GameOverScene
```

### Como o Phaser inicia
`main.js` cria uma instância `Phaser.Game` com a config (1280×720, Arcade physics) e a lista de 9 cenas.
A primeira cena na lista (BootScene) inicia automaticamente.
Cada cena usa `this.scene.start('NomeDaCena', dados)` para transitar.

---

## 3. Sistema de Traduções (i18n)

**Ficheiros:** `locales/pt.json`, `locales/en.json`, `src/utils/I18n.js`

### Como funciona
```javascript
import I18n from '../utils/I18n.js';

// Obter texto traduzido
I18n.t('hud.gold')           // → "Ouro" (PT) ou "Gold" (EN)
I18n.t('towers.archer')      // → "Arqueiros" ou "Archers"
I18n.t('enemies.boss_forest') // → "Rei Troll" ou "Troll King"

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

## 4. Geração de Assets (Procedural)

**Ficheiro principal:** `src/scenes/PreloadScene.js` (~1000 linhas, maior ficheiro do projeto)

Toda a geração é invocada em sequência no método `create()` (linha 64):
```javascript
// PreloadScene.js:64-70
this.generateEnemySpritesheets();       // linha 78  — 16 inimigos animados
this.generateTowerTextures();           // linha 352 — 12 torres base (4 tipos × 3 níveis)
this.generateTowerLevel4Textures();     // linha 973 — 8 torres elite (4 tipos × 2 caminhos)
this.generateSoldierSpritesheet();      // linha 552 — soldado normal (11 frames)
this.generateEliteSoldierSpritesheets(); // linha 681 — cavaleiro + assassino (11 frames cada)
this.generateUITextures();              // linha 877 — ícones, partículas, mina, foguete
```

### 4.1 Geração de inimigos — `generateEnemySpritesheets()` (linha 78)

Cada inimigo é um spritesheet de **4 frames** (256×64 px) desenhado via Canvas 2D API.

**5 funções de desenho reutilizáveis** (todas em `PreloadScene.js`):

| Função | Linha | Inimigos que desenha | Técnica |
|--------|-------|---------------------|---------|
| `humanoid(ctx, cfg, f)` | 86 | Goblin, Goblin Veloz, Orc, Orc Armado, Cavaleiro Negro, Necromante, Demônio, Lich, 2 bosses | Corpo articulado: pernas com balanço `LEGL`, braços com `ARMR`, bob vertical; suporta orelhas, presas, cornos, asas, manto, armadura, elmo, cajado, esqueleto |
| `troll(ctx, cfg, f)` | 202 | Troll, Boss Rei Troll | Corpo largo, braços pendurados, olhos vermelhos, presa decorativa |
| `harpy(ctx, cfg, f)` | 225 | Harpia | Asas articuladas com penas, garras, corpo de ave |
| `golem(ctx, cfg, f)` | 250 | Golem, Boss Golem Ancião | Bloco de pedra maciço, fendas brilhantes, sem pescoço |
| `wyvern(ctx, cfg, f)` | 277 | Wyvern | Dragão com cauda curva, asas membranosas, focinho longo |

**Objeto de configuração** `defs` (linha 301) — mapeia cada tipo de inimigo a uma função e config:
```javascript
// PreloadScene.js:302
goblin: { fn: humanoid, cfg: {
  body:'#2a7a38', skin:'#4caf64', accent:'#ffeb3b', eyes:'#ffeb3b',
  headR:8, w:12, ears:true, tusks:false, horns:false, wings:false,
  robes:false, armor:false, helmet:false, staff:false, skeleton:false, slim:false
}},
```

Os **4 bosses** usam as mesmas funções com cores mais intensas (linhas 315-318):
```javascript
boss_forest: { fn: troll,    cfg: { body:'#8b4513', skin:'#cc8844', accent:'#ffd700' } },
boss_chaos:  { fn: humanoid, cfg: { ..., horns:true, wings:true, headR:12, w:18 } },
```

**Processo completo** (linhas 320-341):
1. Criar canvas `64×4 = 256px` largura × 64px altura
2. Desenhar 4 frames com arrays de animação: `BOB=[0,-2,0,-2]` (oscilação), `LEGL=[0,7,0,-7]` (pernas), `ARMR=[0,-7,0,7]` (braços)
3. Registar como textura: `this.textures.addCanvas(type, canvas)`
4. Cortar em frames: `tex.add(f, 0, f*64, 0, 64, 64)`
5. Criar animação: `this.anims.create({ key: type+'_walk', frameRate:6, repeat:-1 })`

### 4.2 Geração de torres base — `generateTowerTextures()` (linha 352)

Canvas de **48×48 px** por textura. 4 tipos × 3 níveis = 12 texturas.

Cada tipo tem um array de cores por nível (ex: barracas linha 359, arqueiros linha 400). A função `mk(key, fn)` cria o canvas, executa a função de desenho e regista a textura.

Detalhes de desenho por tipo:
- **Barracas** (linha 364): edifício com paredes, ameias, porta em arco, telhado. Nível 3 adiciona torres laterais.
- **Arqueiros** (linha 400): torre cilíndrica com plataforma, seteiras, cúpula. Evolui de madeira para pedra.
- **Mago** (linha 440): torre alta e fina com brilho mágico, janelas, orbe no topo. Aura crescente por nível.
- **Artilharia** (linha 480): base circular com canhão, plataforma de metal, parafusos. Canhão mais imponente por nível.

### 4.3 Geração de torres elite — `generateTowerLevel4Textures()` (linha 973)

8 texturas de 48×48 px (4 tipos × caminho A + B):

| Textura | Linha | Visual |
|---------|-------|--------|
| `tower_barracks_4a` (Cavaleiros) | 786 | Fortaleza com torreões, escudo heráldico dourado com cruz, espada vertical, bandeira |
| `tower_barracks_4b` (Assassinos) | 815 | Covil baixo com telhado angular, adagas cruzadas, janelas verdes de veneno, névoa roxa, caveira |
| `tower_archer_4a` (Ranger) | 840 | Torre alta verde esmeralda com mira telescópica |
| `tower_archer_4b` (Sniper) | 870 | Torre estreita escura com visor vermelho |
| `tower_mage_4a` (Gelo) | 900 | Torre cristalina azul com aura gelada |
| `tower_mage_4b` (Necromante) | 925 | Torre negra com orbe púrpura |
| `tower_artillery_4a` (Foguete) | 940 | Lançador de mísseis cinza com foguete e aletas vermelhas |
| `tower_artillery_4b` (Minas) | 960 | Bunker verde militar compacto |

### 4.4 Geração de soldados — `generateSoldierSpritesheet()` (linha 552)

Spritesheet de **11 frames** (528×48 px) com 4 estados de animação:
- **idle** (2 frames): parado com bob sutil
- **walk** (4 frames): pernas e braços balançam com `LEGL`/`ARMR`
- **attack** (2 frames): espada levantada → golpe
- **die** (3 frames): ajoelha → cai → deitado (rotação com `ctx.rotate`)

A função `drawSoldier(ctx, type, variant)` (linha 556) desenha: sombra, pernas (com botas), corpo (peitoral metálico), escudo (oval com cruz), espada (lâmina + guarda + punho), pescoço, cabeça (elmo com viseira), penacho vermelho.

### 4.5 Geração de soldados elite — `generateEliteSoldierSpritesheets()` (linha 681)

Usa `buildSheet(key, drawFn)` (linha 688) — função genérica que cria canvas 11 frames, regista textura e 4 animações (`_idle`, `_walk`, `_attack`, `_die`).

**Cavaleiro** `soldier_knight` (linha 710):
- Armadura dourada pesada (`#b8860b`, `#daa520`)
- Escudo heráldico grande (forma de pentágono) com cruz branca
- Espada larga com guarda dourada
- Elmo completo com penacho duplo dourado
- Grevas de ouro nas pernas

**Assassino** `soldier_assassin` (linha 770):
- Capuz escuro pontiagudo (`#18182a`, `#111122`)
- Olhos verdes brilhantes (`#33cc33`) com pupilas
- Adagas duplas com ponta verde (veneno) e guarda roxa
- Corpo magro com manto negro e cinto roxo
- Máscara facial escura
- Sem escudo (mais ágil)

### 4.6 Geração de UI — `generateUITextures()` (linha 877)

Usa `scene.make.graphics()` + `generateTexture()` para elementos simples:

| Textura | Tamanho | Linha | Descrição |
|---------|---------|-------|-----------|
| `range_circle` | 200×200 | ~880 | Círculo semi-transparente para alcance das torres |
| `explosion` | 64×64 | ~888 | Círculo com gradiente radial (branco→amarelo→laranja) |
| `particle_spark` | 8×8 | ~894 | Quadrado amarelo brilhante |
| `particle_blood` | 8×8 | ~898 | Círculo vermelho pequeno |
| `icon_coin` | 20×20 | ~902 | Moeda dourada com brilho |
| `icon_heart` | 20×20 | ~908 | Coração vermelho |
| `icon_meteor` | 32×32 | ~914 | Bola de fogo com rasto |
| `icon_reinf` | 32×32 | ~922 | Escudo azul com espada |
| `tower_slot` | 64×64 | ~930 | Quadrado tracejado semi-transparente |
| `meteor` | 24×24 | ~936 | Rocha em chamas (sprite do projétil) |
| `mine` | 18×18 | ~942 | Disco escuro com cruz amarela e borda |
| `proj_rocket` | 10×20 | ~755 | Míssil: corpo cinza, aletas vermelhas, chama laranja |

### 4.7 PNGs estáticos vs procedurais

Os **32 PNGs** em `public/assets/images/` são carregados em `PreloadScene.preload()` (linhas 26-41). Depois, em `create()`, as texturas procedurais **substituem** as PNGs com `textures.remove(key)` + `textures.addCanvas(key, canvas)`. Os PNGs servem de fallback caso a geração falhe.

---

## 5. Cenas: Boot e Preload

### BootScene (`src/scenes/BootScene.js`, linha 3)
- Primeira cena a correr (registada primeiro em `main.js`)
- Mostra ecrã simples enquanto o Phaser inicializa
- Transita para PreloadScene após 300ms com `this.scene.start('PreloadScene')`

### PreloadScene (`src/scenes/PreloadScene.js`, linha 5)
**`preload()`** (linha 8) — carrega ficheiros reais:
- 12 PNGs de torres (linhas 26-30): `tower_barracks`, `tower_barracks_2`, ..., `tower_artillery_3`
- 12 PNGs de inimigos (linhas 31-35): `goblin`, `orc`, `demon`, ...
- 8 PNGs de projéteis/tiles (linhas 38-41): `proj_arrow`, `tile_ground`, `castle`, `soldier`, ...
- 16 OGGs de áudio (linhas 44-61): SFX (`sfx_shoot_arrow`, `sfx_explosion`, ...) + músicas (`music_menu`, `music_battle`)

**`create()`** (linha 64) — gera todas as texturas procedurais (ver secção 4 acima), depois transita: `this.scene.start('MenuScene')`

---

## 6. Menu Principal (MenuScene)

### O que faz
- Fundo com estrelas e gradiente
- Título animado
- Botões: Jogar, Opções, Créditos

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
- **Slider** (0–100%): Volume de música e SFX
- **Toggle**: Números de dano flutuantes
- **Seletor de língua**: botões PT / EN

### Persistência
Todas as preferências são guardadas em `localStorage` via `Settings.js`:
```javascript
Settings.playSfx(this, 'sfx_shoot_arrow');  // SFX one-shot
Settings.playMusic(this, 'music_battle');    // música em loop
```

---

## 8. Mapa de Níveis (MapScene)

### O que faz
- Mostra 4 nós de nível num mapa estilizado com montanhas e estrelas
- Nível 1 desbloqueado por defeito; os restantes desbloqueiam ao vencer o anterior
- Estrelas conquistadas (★★★) visíveis em cada nó
- Botão de Enciclopédia 📖 no canto inferior direito

### Modal de seleção
Ao clicar num nível desbloqueado, aparece um **modal** com duas opções:
- **▶ Iniciar Nível** — inicia o jogo normal
- **⚙ Modo Sandbox** — inicia com ouro/vidas infinitos e spawner manual

### Desbloqueio de níveis
```javascript
// Ao vencer o nível X, em VictoryScene:
localStorage.setItem('kr_level_' + (level+1), 'true');

// No MapScene, getLevels():
{ id: 2, unlocked: localStorage.getItem('kr_level_2') === 'true' }
```

---

## 9. GameScene — O Coração do Jogo

**Ficheiro:** `src/scenes/GameScene.js` (classe `GameScene`, linha 16, ~890 linhas)

### Estado do jogo — `init(data)` (linha 19)
```javascript
this.level       = data.level || 1;
this._sandbox    = data.sandbox || false;           // modo sandbox (ouro/vidas infinitos)
this.gold        = this._sandbox ? 99999 : ([250, 250, 300, 375][this.level - 1]);
this.lives       = this._sandbox ? 99 : 20;
this.score       = 0;
this.waveIndex   = 0;         // índice da wave atual (0-based)
this.waveActive  = false;     // true durante uma wave, false entre waves
this._enemies    = [];        // array de Enemy ativos no campo
this._towers     = [];        // array de Tower colocadas
this._buildMode  = null;      // tipo de torre a construir (ou null)
this._toSpawn    = 0;         // inimigos que ainda faltam spawnar na wave
this._aliveCount = 0;         // inimigos vivos no campo
this._reinfSoldiers = [];     // soldados temporários de reforço
```

### `create()` — sequência de inicialização (linha 44)
1. `drawMap()` (linha 135) — itera grelha 20×10 de 64px: desenha `tile_ground`, `tile_path` (de `PATH_TILES`), e `tower_slot` (de `TOWER_SLOTS`) para cada posição válida
2. `buildPath(this, this.level)` (linha 50) — chama `PathData.buildPath()` que cria um `Phaser.Curves.Path` a partir dos waypoints de `PATH_DATA[level]`
3. `new HUD(this)` (linha 57) — instancia `src/entities/HUD.js` que constrói toda a interface
4. Registar eventos (linhas 63-69): `selectBuild`, `startWave`, `enemyKilled`, `dragPower`, `setRally`, `startRallyMode`, `damageFloat`
5. Registar input (linhas 83-107): `pointermove`, `pointerdown`, `pointerup`, teclas ESC/1-4/R/P
6. `_showNextWavePreview(0)` (linha 122) — mostra seta ▶ pulsante no portal de entrada
7. Se sandbox (linhas 125-130): esconde botão Start Wave, mostra "⚙ SANDBOX", move fast-forward, cria `_buildSandboxPanel()`

### `update(time, delta)` — loop de jogo (linha 840)
A cada frame (~60fps), com `dt = _fastMode ? delta*2 : delta`:
1. **Inimigos** (linhas 846-870): para cada `Enemy` vivo → chamar `e.update(dt)` para mover, ou `e.attackSoldiers(time)` se bloqueado. Se `e.reached` → `loseLife(e.damage)` e remover
2. **Torres** (linha 878): `t.update(time, this._enemies)` — cada torre encontra alvo, dispara, coloca minas
3. **Reforços** (linhas 881-889): filtrar mortos; se `waveActive`, decrementar `_reinfTimeLeft` com `dt`; matar se tempo esgotado

### Métodos principais

| Método | Linha | Responsabilidade |
|--------|-------|-----------------|
| `drawMap()` | 135 | Desenha chão, caminho, slots, castelo, portal |
| `enterBuildMode(type)` | 172 | Ativa modo construção com ghost + range circle |
| `tryPlaceTower(px, py)` | 341 | Valida slot, gasta ouro, cria torre |
| `upgradeTower(tower)` | 390 | Verifica custo, chama `tower.upgrade()` |
| `choosePathForTower(tower, path)` | 401 | Gasta ouro do caminho, chama `tower.choosePath('A'/'B')` |
| `sellTower(tower)` | 414 | Devolve 60% via `sellValue()`, liberta slot |
| `startNextWave()` | 426 | Constrói lista de spawns com delays + `preDelay`, agenda `time.delayedCall` |
| `spawnEnemy(type)` | 466 | Cria `Enemy`, adiciona a `_enemies`; se boss → camera shake + anúncio |
| `onEnemyKilled(enemy)` | 477 | Dá ouro (com multiplicador), score, partículas, decrementa `_aliveCount` |
| `_checkWaveEnd()` | 490 | Verifica se `_toSpawn==0` e `_aliveCount==0`; dá bónus, avança wave ou vitória |
| `castReinforcements(x, y)` | 520 | Spawna 4 `Soldier` com `_reinfTimeLeft=18000` |
| `castMeteor(x, y)` | 537 | Animação de queda + 220 dano AOE (ignora armadura) + shake |
| `loseLife(amount)` | 579 | Reduz vidas; sandbox apenas faz flash; se ≤0 → `endGame(false)` |
| `endGame(victory)` | 836 | Fade out → `VictoryScene` ou `GameOverScene` (ignorado em sandbox) |
| `_buildSandboxPanel()` | 735 | Cria seletor de inimigo + quantidade + botão Spawnar |
| `rebuildHUD()` | 625 | Reconstrói HUD após troca de língua na pausa |

---

## 10. Torres — Construção, Upgrades e Caminhos Elite

**Ficheiros:** `src/entities/Tower.js` (~640 linhas), `src/utils/TowerData.js` (~100 linhas)

### Hierarquia de classes (`src/entities/Tower.js`)
```
Tower (base, linha 16)               → Container com sprite, texto de nível, alcance
  ├── ArcherTower (linha 111)         → projéteis (flechas), Ranger/Sniper no nível IV
  ├── MageTower (linha 142)           → dano mágico; Gelo (slow+AOE) ou Necromante (revive)
  ├── ArtilleryTower (linha 235)      → splash; Foguete (anti-aéreo) ou Minas (armadilhas)
  └── BarracksTower (linha 352)       → soldados; Cavaleiros (HP×3) ou Assassinos (crit×3)

Projectile (linha 458)               → Image com tracking, rotação, rotOffset para foguete
Mine (linha 492)                      → Image com arm delay 1.5s + trigger radius 20px
Soldier (linha 538, exportado)        → Sprite animado (11 frames), aceita spriteKey dinâmico
```

### 3 níveis base (I→II→III)
```javascript
archer: {
  baseCost: 125,
  levels: [
    { damage: 12, range: 160, fireRate: 1100, upgradeCost: 90  },  // I
    { damage: 20, range: 185, fireRate: 900,  upgradeCost: 150 },  // II
    { damage: 32, range: 215, fireRate: 700,  upgradeCost: null }  // III (máx base)
  ]
}
```

### Nível IV bifurcado (estilo Kingdom Rush)
Ao atingir nível III, o jogador escolhe **Caminho A ou B**:
```javascript
paths: {
  A: { label:'Ranger', cost:175, damage:32, range:322, piercing:true,
       description:'Alcance +50% · flechas perfurantes' },
  B: { label:'Sniper', cost:175, damage:80, fireRate:1100, ignoreArmor:true,
       description:'Dano ×2.5 · ignora armadura física' }
}
```

Controlado por `tower.chosenPath` (`null`, `'A'` ou `'B'`). O getter `tower.stats` retorna automaticamente os stats do caminho escolhido.

| Torre | Caminho A | Caminho B |
|-------|-----------|-----------|
| Barracas | **Cavaleiros** — HP×3, escudo heráldico | **Assassinos** — crit×3, adagas duplas |
| Arqueiros | **Ranger** — alcance+50%, perfurante | **Sniper** — ignora armadura, dano×2.5 |
| Mago | **Gelo** — slow permanente + pulso 35dmg | **Necromante** — revive mortos 55% |
| Artilharia | **Foguete** — míssil anti-aéreo | **Minas** — armadilhas automáticas (máx 10) |

### Mecânicas especiais (implementadas nos métodos das subclasses)

**Minas** — `ArtilleryTower.update()` (Tower.js:246) + `_placeMine()` (linha 282) + `_randomPathTileInRange()` (linha 265):
- Importa `PATH_TILES` de `src/utils/PathData.js` (Tower.js:2)
- Escolhe tile aleatório do caminho dentro do alcance (filtra tiles com mina a <24px)
- Lança com animação em arco (tween de posição + shadow) da torre até ao tile
- `Mine` (linha 492): arm delay de 1.5s (`_armTime = Date.now() + 1500`), fade-in visual; `checkTrigger()` explode se inimigo a <20px
- Só lança durante `scene.waveActive || scene._sandbox`

**Foguete** — `ArtilleryTower.fire()` (Tower.js:316):
- Usa textura `proj_rocket` (gerada em PreloadScene.js:755) em vez de `proj_cannon`
- `Projectile` (linha 458) com `rotOffset: Math.PI/2` para compensar textura vertical
- Velocidade 280 (vs 210 do canhão normal), `canTarget()` retorna `true` para voadores

**Necromante** — `MageTower.choosePath('B')` (Tower.js:149):
- Regista listener em `scene.events.on('enemyKilled', ...)` (linha 151)
- Quando inimigo morre dentro do alcance: 55% chance de spawnar `Soldier` zombie (tint verde, 80HP, 15dmg)
- Zombie adicionado a `scene._reinfSoldiers[]` com `time.delayedCall(8000, () => z.die())`

**Gelo** — `MageTower.update()` para `chosenPath==='A'` (Tower.js:173):
- Slow contínuo: `e.applySlow(slowMs)` todo frame a todos os inimigos em alcance
- Pulso de dano: a cada `fireRate` (2500ms), aplica `damage` (35) mágico AOE
- Anel visual: cria `range_circle` image com tint `0x88ddff`, tween de expansão + fade

**Soldados elite** — `BarracksTower.spawnSoldier()` (Tower.js:415):
- Seleciona `spriteKey`: `'soldier_knight'` (caminho A), `'soldier_assassin'` (caminho B), `'soldier'` (base)
- `Soldier` (linha 538) aceita `spriteKey` no constructor; usa `this._spriteKey + '_idle'` etc. para animações
- Assassinos recebem `_critChance` e `_critMult` do stats do caminho (linha 430)

### Venda — `sellValue()` (`src/utils/TowerData.js`, linha 91)
```javascript
// Soma: baseCost + todos os upgradeCost até ao nível + custo do caminho IV
// Retorna Math.floor(total * 0.6)
const val = sellValue(towerType, level, chosenPath);
```

---

## 11. Inimigos — Movimento, Armadura e Bosses

**Ficheiros:** `src/entities/Enemy.js` (classe `Enemy`, linha 4, ~190 linhas), `src/utils/EnemyData.js` (~130 linhas)

### 16 tipos de inimigos
12 normais (Tier 1-5) + 4 bosses (um por nível):

| Tipo | HP | Vel. | Armadura | Especial |
|------|----|------|----------|----------|
| Goblin | 60 | 95 | 0% | — |
| Goblin Veloz | 40 | 140 | 0% | — |
| Orc | 180 | 60 | 15% | — |
| Orc Armado | 190 | 50 | 45% | Armadura pesada |
| Troll | 320 | 45 | 20% | Regen 8/s |
| Harpia | 160 | 110 | 0% | Voador |
| Golem | 480 | 35 | 50% | Armadura pesada |
| Cavaleiro Negro | 420 | 55 | 32% | — |
| Necromante | 300 | 65 | 10% fís / 45% mag | — |
| Wyvern | 320 | 100 | 10% | Voador |
| Demônio | 700 | 70 | 25% fís / 25% mag | Voador |
| Lich | 560 | 55 | 10% fís / 55% mag | — |
| **Rei Troll** (boss nv1) | 1500 | 35 | 25% | Regen 15/s, 8 vidas |
| **Golem Ancião** (boss nv2) | 2500 | 25 | 55% | Arm. pesada, 10 vidas |
| **Senhor Demônio** (boss nv3) | 2200 | 50 | 30%/35% | Voador, 12 vidas |
| **Rei Lich** (boss nv4) | 3500 | 35 | 20%/60% | Regen 8/s, 15 vidas |

### Constructor — `Enemy` (`src/entities/Enemy.js`, linha 10)
Estende `Phaser.GameObjects.Container`. Recebe `(scene, type, path)`:
1. Lê stats de `ENEMY_DATA[type]` (linha 11): HP, speed, armor, magicArmor, flying, regen, boss...
2. Cria sprite animado (linha 34): `scene.add.sprite(0, 0, type, 0)` com `sprite.play(type+'_walk')`
3. Adiciona ícones visuais (linhas 41-67): 🦅 se voador, 🛡 se armadura pesada, ✨ se resist. mágica, 👑 se boss
4. Cria barra de vida (linhas 70-79): bosses têm barra 3× mais larga (`barW = size*3`) e vermelha (`0xff1744`)
5. Posiciona no ponto 0 do path: `path.getPoint(0)`

### Movimento — `update(delta)` (linha 74)
```javascript
// Enemy.js:84-97 — pathT vai de 0 (spawn) a 1 (chegada ao castelo)
const spd = (Date.now() < this.slowUntil) ? this.speed * 0.4 : this.speed;
const tDelta = (spd / this._pathLen) * (delta / 1000);
this.pathT += tDelta;
if (this.pathT >= 1) { this.reached = true; return; }
const pt = this.path.getPoint(this.pathT);
this.setPosition(pt.x, pt.y);
```
Regeneração (linha 78): se `this.regen > 0`, adiciona `regen * delta/1000` ao HP a cada frame.

### Dano e armadura — `takeDamage(amount, isMagic, ignoreAll)` (linha 105)
```javascript
if (ignoreAll) eff = amount;                    // meteorito, Sniper
else if (isMagic) eff = amount * (1 - magicArmor); // magos
else eff = amount * (1 - armor);                // físico (arqueiros, barracas, artilharia)
```
Se `Settings.dmgNumbers` ativo (linha 117): emite `damageFloat` → texto flutuante vermelho/roxo.

### Slow — `applySlow(ms)` (linha 126)
```javascript
this.slowUntil = Math.max(this.slowUntil, Date.now() + ms);
this.list[0]?.setTint(0x88ccff); // tint azul no sprite
```
Enquanto `Date.now() < slowUntil`, velocidade reduzida a 40% (linha 85).

### Combate contra soldados — `attackSoldiers(time)` (linha 173)
- Cooldown: **800ms** para bosses, **1200ms** para normais (linha 175)
- Dano: `(data.damage || 1) * 10`, bosses multiplicam por **3×** extra (linha 179)
- Resultado: boss com damage=15 faz `15 * 10 * 3 = 450` dano por hit contra soldados

### Bosses — `EnemyData.js` (linhas 100-128)
- Flag `boss: true` → ativa visual especial + dano ampliado
- Spawnam com `preDelay` de 4-5s na última wave (`WaveData.js`)
- `GameScene.spawnEnemy()` (GameScene.js:466): se boss → `cameras.main.shake(500, 0.012)` + `floatText('👑 BOSS')`
- Barra de vida: `updateBar()` (Enemy.js:150) usa gradiente vermelho→laranja→amarelo para bosses

---

## 12. HUD — Interface de Jogo

**Ficheiro:** `src/entities/HUD.js` (classe `HUD`, linha 5, ~450 linhas)

O HUD **não é uma cena separada** — é uma classe instanciada pelo GameScene (`new HUD(this)`, GameScene.js:57). Todos os elementos são criados com `scene.add.*` na cena principal.

### Rastreamento de objetos (linhas 13-24)
O constructor intercepta temporariamente `scene.add.text/image/rectangle/...` durante o `build()` para registar automaticamente todos os objetos criados em `this._objects[]`. Isto permite destruí-los todos de uma vez em `destroy()` (linha 33) quando o jogador troca de língua.

### Componentes construídos em `build()` (linha 45)

| Componente | Posição | Método/Linha | Descrição |
|------------|---------|-------------|-----------|
| Barra superior | y=30, width=1280 | build():50 | Fundo escuro + ouro (`_goldText`), vidas (`_livesText`), wave (`_waveText`), score (`_scoreText`) |
| Painel lateral | x=1215, height=620 | build():80 | 4 botões criados por `createBuildBtn()` (linha 111) com ícone da torre, nome i18n, custo, hotkey (1-4) |
| Poderes | y=660, esq. | `buildPowerPanel()` (linha ~160) | 2 ícones arrastáveis (Reforços + Meteorito) com barra de cooldown animada |
| Start Wave | x=560, y=682 | `createStartBtn()` (linha 310) | Emite `'startWave'` ao clicar |
| Fast Forward | x=730, y=682 | `createFastBtn()` (linha 328) | Toggle `scene._fastMode` + reescala cooldowns |
| Pausa | x=1215, y=685 | build():102 | Chama `scene.pauseGame()` |

### Painel de torre — `showTowerPanel(tower, onUpgrade, onSell, onChoosePath)` (linha ~380)
Painel flutuante que aparece ao clicar numa torre. Calcula altura dinâmica baseada no tipo e estado:
- Se `tower.hasPaths()` (nível III com caminhos disponíveis): mostra "— Escolhe caminho IV —" + 2 botões A/B com custo e descrição
- Se nível IV escolhido: mostra "★ NomeCaminho" em dourado (A) ou azul (B)
- Stats: dano, alcance, ataques/s, splash, minas (conforme tipo)
- Botão Rally ⚑ (só barracas, chama `scene.events.emit('startRallyMode', tower)`)
- Venda: `sellValue(type, level, chosenPath)` — 60% do total investido

### Sandbox panel — criado em `GameScene._buildSandboxPanel()` (GameScene.js:735)
Não faz parte do HUD — é criado directamente no GameScene quando `_sandbox=true`. Substitui o botão Start Wave com seletor de inimigo (◀/▶), quantidade (◀/▶ cicla ×1/5/10/20) e botão "⚔ Spawnar".

---

## 13. Poderes Especiais

### Reforços
- Cooldown: 30 segundos (pausa entre waves)
- Ativação: arrastar ícone para o campo
- Efeito: spawna 4 soldados temporários
- Duração: 18 segundos **de tempo de wave** (não conta entre waves)
- Soldados: 200 HP, 18 dano, bloqueiam inimigos

### Meteorito
- Cooldown: 45 segundos (pausa entre waves)
- Ativação: arrastar ícone para o alvo
- Animação: meteoro cai com tween + explosão + camera shake
- Efeito: 220 dano no centro, diminuindo com distância (raio 110px)
- **Ignora toda a armadura** (física e mágica)

---

## 14. GameOver, Vitória e Estrelas

### Condição de derrota
```javascript
loseLife(amount) {
  if (this._sandbox) { flash; return; } // sandbox: não perde vidas
  this.lives -= amount;
  if (this.lives <= 0) this.endGame(false);
}
```

### Condição de vitória
```javascript
// Na última wave, quando todos os inimigos morrem:
if (this.waveIndex >= totalWaves(this.level)) {
  this.time.delayedCall(1200, () => this.endGame(true));
}
```

### Sistema de estrelas
Baseado em **vidas perdidas** (não em score):
- ★★★ — 0 vidas perdidas (20/20)
- ★★ — ≤5 vidas perdidas
- ★ — completou o nível

Guardado em `localStorage` como `kr_stars_X`. Nunca desce (guarda o melhor resultado).
Visível nos nós do MapScene e no ecrã de vitória.

---

## 15. Fluxo de Vagas (Waves) e Bosses

**Ficheiro:** `src/utils/WaveData.js`

### Estrutura de uma vaga
```javascript
[
  { type: 'troll',       count: 2, interval: 1800 },
  { type: 'dark_knight', count: 3, interval: 1600 },
  { type: 'boss_forest', count: 1, interval: 0, preDelay: 4000 }  // boss!
]
```
- `interval` — tempo entre spawns dentro do grupo
- `preDelay` — delay extra antes de spawnar o grupo (usado nos bosses)

### Como o spawn funciona
```javascript
// GameScene.startNextWave()
let delay = 0;
for (const group of waveDef) {
  if (group.preDelay) delay += group.preDelay;  // delay antes do boss
  for (let i = 0; i < group.count; i++) {
    spawnList.push({ type: group.type, delay });
    delay += group.interval;
  }
}
// Cada spawn é agendado com this.time.delayedCall(delay, ...)
```

### Bosses
Cada nível tem um boss na última wave:
- Nível 1: **Rei Troll** (1500 HP, regen 15/s)
- Nível 2: **Golem Ancião** (2500 HP, 55% armadura)
- Nível 3: **Senhor Demônio** (2200 HP, voador)
- Nível 4: **Rei Lich** (3500 HP, 60% resist. mágica)

### Prévia da onda
Entre waves, uma seta ▶ pulsa no portal de entrada. Hover mostra tooltip com os inimigos da próxima wave (tipo, cor, quantidade).

---

## 16. Enciclopédia

**Ficheiro:** `src/scenes/EncyclopediaScene.js`

Acessível via botão 📖 no MapScene. Contém 4 abas:

| Aba | Conteúdo |
|-----|----------|
| 🏰 Torres | Seletor lateral + tabela de stats por nível + cartões de caminho IV |
| 👹 Inimigos | Grelha 4×3 com sprite, HP, vel, armadura, especiais |
| 👑 Bosses | 4 cartões (2×2) com stats completos e nível de aparição |
| ⚡ Poderes | 2 cartões (Reforços + Meteorito) com todos os stats |

---

## 17. Modo Sandbox

### Como aceder
Ao clicar num nível no MapScene, um modal pergunta "Iniciar Nível" ou "Modo Sandbox".

### Diferenças do modo normal
- Ouro: 99999 (nunca gasta)
- Vidas: 99 (nunca perde)
- Sem waves automáticas, sem vitória/derrota
- Botão "Start Wave" substituído por **painel de spawn**:
  - Seletor de inimigo (◀/▶ cicla 16 tipos com cor)
  - Seletor de quantidade (◀/▶ cicla ×1/×5/×10/×20)
  - Botão "⚔ Spawnar"
- Minas funcionam (tratadas como "wave ativa")
- Fast-forward e poderes disponíveis

---

## 18. Como Adicionar Conteúdo Futuro

### Nova torre
1. Adicionar entrada em `TowerData.js` (stats, custos, caminhos)
2. Criar subclasse em `Tower.js` que extende `Tower` e implementa `fire()`
3. Adicionar case em `GameScene.createTower()`
4. Gerar textura em `PreloadScene.generateTowerTextures()`
5. Adicionar tradução em `pt.json` e `en.json`

### Novo inimigo
1. Adicionar entrada em `EnemyData.js` (HP, speed, armor, flags)
2. Adicionar config de desenho no `defs` de `PreloadScene.generateEnemySpritesheets()`
3. Usar o novo tipo nas vagas em `WaveData.js`
4. Adicionar tradução em ambos os locales

### Novo nível
1. Adicionar waypoints em `PathData.js`: `PATH_DATA[5]`, `PATH_TILES[5]`, `TOWER_SLOTS[5]`
2. Adicionar vagas em `WaveData.js`: `5: [[...], [...], ...]`
3. Adicionar nó no `MapScene.js` (função `getLevels()`)
4. Criar boss para o nível em `EnemyData.js`

### Novo poder
1. Em `HUD.js`, adicionar botão com `buildPowerPanel()`
2. Em `GameScene.js`, implementar o método `castNovoPoder(x, y)`
3. Registar evento: `this.events.on('dragPower', ...)`

---

## 19. Checklist do TP2

### Requisitos obrigatórios
- [x] Motor Phaser 3 (v3.80) via npm
- [x] Tema livre — Tower Defense estilo Kingdom Rush
- [x] Cenas: preload, create, update em todas as GameObjects
- [x] Sprites e imagens (PNGs reais + geradas proceduralmente)
- [x] Spritesheets animados (inimigos 4 frames, soldados 11 frames)
- [x] Física Arcade (grupos, velocidades, detecção de proximidade)
- [x] Input teclado (teclas 1-4, ESC, R, P) e rato (cliques, drag & drop)
- [x] Estado de jogo: score, vidas, vaga atual, Game Over, Vitória, reinício
- [x] Sons (16 OGGs: SFX + 2 músicas de fundo)
- [x] Suporte multilíngue PT + EN com seletor acessível
- [x] Estrutura organizada em cenas, entidades e utilitários
- [x] .gitignore adequado (node_modules excluído)
- [x] README completo com todos os campos obrigatórios
- [x] Tag 1.0 a criar antes da entrega

### Pontos extra
- [x] Múltiplas cenas (9 cenas incluindo Enciclopédia)
- [x] Poderes (Reforços + Meteorito com drag & drop)
- [x] Partículas (faíscas, sangue, magia)
- [x] Câmara com shake (meteorito, boss) e fade
- [x] UI cuidada com score, vidas e instruções
- [x] Spritesheets com animações (walk, idle, attack, die)
- [x] Música de fundo (menu + batalha em loop)
- [x] Aumento progressivo de dificuldade entre níveis
- [x] Sistema de estrelas por desempenho
- [x] Upgrades bifurcados nível IV
- [x] Bosses de fim de nível
- [x] Enciclopédia completa
- [x] Modo Sandbox
- [ ] 3+ línguas
- [ ] GitHub Pages

### Antes de entregar
```bash
# 1. Testar em Chrome, Firefox e Edge
npm run dev

# 2. Verificar que npm run build não dá erros
npm run build

# 3. Commit final e criar tag
git tag 1.0
git push origin main --tags
```
