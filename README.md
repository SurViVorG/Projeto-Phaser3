# Kingdom Rush — Tower Defense

> Trabalho Prático 2 · Tecnologias Multimédia 2025/2026

---

## Elementos do Grupo

| Nome | Número |
|------|--------|
| Gonçalo Peres Costa | 36701 |


---

## Versão de Phaser e método de inclusão

- **Phaser 3.80** incluído via **npm** (`npm install phaser`)
- Bundler: **Vite 5**

---

## Descrição do Jogo

**Género:** Tower Defense 2D (estilo Kingdom Rush)

**Objetivo:** Impedir que os inimigos atravessem o mapa e alcancem o castelo. Constrói e melhora torres ao longo do caminho para eliminar todas as vagas de inimigos.

**Regras:**
- Começas com **20 vidas** e ouro consoante o nível (250–375g)
- Cada inimigo que chega ao castelo retira vidas (1–15 conforme o tipo)
- Ganhas ouro ao eliminar inimigos (bónus por wave concluída)
- Usas ouro para construir, melhorar e especializar torres
- O jogo termina quando as vidas chegam a 0 (Derrota) ou todas as vagas são eliminadas (Vitória)

**Funcionalidades implementadas:**
- 4 tipos de torres com 3 níveis + **2 caminhos elite nível IV** (8 especializações)
  - Barracas: Cavaleiros (HP×3) / Assassinos (crit×3)
  - Arqueiros: Ranger (perfurante) / Sniper (ignora armadura)
  - Mago: Gelo (slow+AOE) / Necromante (revive mortos)
  - Artilharia: Foguete (anti-aéreo) / Minas (armadilhas automáticas)
- **16 tipos de inimigos** (12 normais + 4 bosses) com comportamentos distintos
  - Armadura física e mágica, voadores, regeneração, armadura pesada
  - Bosses com 👑 coroa, barra de vida especial, dano devastador
- 4 níveis com caminhos únicos, dificuldade crescente (6–9 vagas por nível)
- **Sistema de estrelas** (★★★ sem vidas perdidas · ★★ ≤5 · ★ completou)
- 2 poderes especiais: **Reforços** (drag & drop, cooldown 30s) e **Meteorito** (cooldown 45s)
  - Cooldowns pausam entre vagas; reforços não perdem tempo de vida entre waves
- **Enciclopédia** 📖 com 4 abas (Torres, Inimigos, Bosses, Poderes)
- **Modo Sandbox** — ouro/vidas infinitos, spawner manual de 16 tipos de inimigos
- Prévia da próxima onda com tooltip no portal de entrada
- Suporte multilíngue **PT / EN**
- 9 cenas: Boot → Preload → Menu → Opções → Mapa → Jogo → Pausa → GameOver/Vitória → Enciclopédia
- HUD completo: ouro, vidas, wave, score, poderes, upgrade/sell, caminho IV
- Sprites procedurais animados (inimigos 4 frames walk, soldados 11 frames)
- 16 ficheiros de áudio OGG (SFX + 2 músicas de fundo)
- Partículas (faíscas, sangue, magia), camera shake (meteorito, boss), fade entre cenas

---

## Jogabilidade / Controlos

| Ação | Controlo |
|------|----------|
| Construir Barracas | Painel lateral ou tecla **1** → clique num slot |
| Construir Arqueiros | Painel lateral ou tecla **2** → clique num slot |
| Construir Magos | Painel lateral ou tecla **3** → clique num slot |
| Construir Artilharia | Painel lateral ou tecla **4** → clique num slot |
| Selecionar torre | Clique na torre (mostra painel upgrade/sell/caminho) |
| Escolher caminho IV | Clique no botão A ou B no painel (nível III) |
| Reposicionar soldados | Menu da torre → "⚑ Rally" → clique na pista |
| Cancelar construção | **ESC** |
| Iniciar vaga | Botão **▶ Iniciar Vaga** |
| Acelerar jogo | Botão **⏩ ×2** |
| Poder — Reforços | Arrastar ícone para o campo (cooldown 30s) |
| Poder — Meteorito | Arrastar ícone para o alvo (cooldown 45s) |
| Pausa | Tecla **P** ou botão ⏸ |
| Reiniciar | Tecla **R** ou menu de pausa |
| Mudar língua | Seletor PT / EN no menu, mapa ou pausa |
| **Sandbox** — spawnar inimigos | ◀/▶ para tipo e quantidade → "⚔ Spawnar" |

---

## Como Executar

### Requisitos
- Node.js v18+ com npm

### Passos

```bash
# 1. Entrar na pasta do projeto
cd "Projeto Phaser"

# 2. Instalar dependências
npm install

# 3. Correr em modo desenvolvimento
npm run dev

# 4. Abrir no browser
# → http://localhost:5173
```

### Build de produção
```bash
npm run build
# Ficheiros gerados em dist/
```

> O jogo funciona em Chrome, Firefox e Edge com servidor local (Vite).
> Não funciona via `file://` devido aos módulos ES6.

---

## Aspectos Multimédia

### Imagens / Sprites
- **32 ficheiros PNG** em `public/assets/images/` (~14 KB total)
  - 12 torres (4 tipos × 3 níveis): `tower_barracks.png`, `tower_barracks_2.png`, ...
  - 12 inimigos: `goblin.png`, `orc.png`, `demon.png`, ...
  - 3 projéteis: `proj_arrow.png`, `proj_magic.png`, `proj_cannon.png`
  - 5 utilitários: `tile_ground.png`, `tile_path.png`, `castle.png`, `entry_portal.png`, `soldier.png`
- **Geração procedural em runtime** — `src/scenes/PreloadScene.js` (~1000 linhas):
  - Todos os sprites são **desenhados via Canvas 2D API** e registados como texturas Phaser
  - 16 spritesheets de inimigos (4 frames walk cada) usando 5 funções de desenho reutilizáveis (`humanoid`, `troll`, `harpy`, `golem`, `wyvern`) parametrizadas por cores, tamanhos e flags (orelhas, presas, cornos, asas, manto, armadura, elmo, cajado, esqueleto)
  - 20 texturas de torres (12 base + 8 elite nível IV) de 48×48 px cada
  - 3 spritesheets de soldados (11 frames: idle×2, walk×4, attack×2, die×3) — normal, cavaleiro dourado, assassino encapuzado
  - ~15 texturas de UI: círculo de alcance, explosão, partículas, mina (18×18), foguete (10×20), ícones
  - Os PNGs servem de fallback; as texturas procedurais **substituem-nos** com `textures.remove()` + `textures.addCanvas()`

### Áudio
- **16 ficheiros OGG** em `public/assets/audio/` (~130 KB total)
  - 14 SFX: tiro (flecha/magia/canhão), moeda, explosão, morte de inimigo, vida perdida, início de vaga, clique de botão, colocar torre, upgrade, meteorito, reforços, vitória, derrota
  - 2 músicas de fundo: menu (calma) + batalha (tensa), ambas em loop contínuo
- Reprodução centralizada em `src/utils/Settings.js` via `Settings.playSfx()` e `Settings.playMusic()`
- Volume e on/off configuráveis nas Opções e no menu de Pausa, persistidos em `localStorage`

### Tipografia
- **Sem fontes externas** — usa exclusivamente fontes de sistema:
  - `Georgia, serif` — títulos, botões, nomes de torres, textos narrativos
  - `monospace` — stats numéricos, dados técnicos, HUD, hotkeys
- Definidas inline em cada `scene.add.text()` via propriedade `fontFamily`

### Formato e justificação
| Asset | Formato | Justificação |
|-------|---------|----|
| Sprites | PNG-32 com transparência | Canal alpha necessário; ficheiros minúsculos |
| Efeitos sonoros | OGG Vorbis | Boa compressão, suporte universal nos browsers |
| Música de fundo | OGG Vorbis | Qualidade aceitável, ficheiro pequeno (~15 KB) |
| Fontes | Sistema (Georgia, monospace) | Disponíveis em todos os browsers; sem download |

**Total de assets estáticos:** ~145 KB (muito abaixo do limite de 10 MB)

---

## Estrutura do Projeto

```
Projeto Phaser/
├── index.html                 ← página HTML única (carrega src/main.js)
├── package.json               ← dependências: phaser 3.80, vite 5
├── vite.config.js
├── .gitignore
├── GUIAO.md                   ← guião técnico detalhado com referências ao código
├── ROADMAP.md                 ← plano de features e progresso
│
├── locales/
│   ├── pt.json                ← traduções português (chaves hierárquicas)
│   └── en.json                ← traduções inglês
│
├── public/assets/
│   ├── images/                ← 32 PNGs (torres, inimigos, projéteis, tiles)
│   └── audio/                 ← 16 OGGs (14 SFX + 2 músicas)
│
└── src/
    ├── main.js                ← config Phaser (1280×720, Arcade) + registo de 9 cenas
    │
    ├── scenes/
    │   ├── BootScene.js           ← inicialização, transita para Preload
    │   ├── PreloadScene.js        ← carrega assets + geração procedural (~1000 linhas)
    │   │                            generateEnemySpritesheets() — 16 inimigos animados
    │   │                            generateTowerTextures() — 12 torres base
    │   │                            generateTowerLevel4Textures() — 8 torres elite
    │   │                            generateSoldierSpritesheet() — soldado (11 frames)
    │   │                            generateEliteSoldierSpritesheets() — cavaleiro + assassino
    │   │                            generateUITextures() — ícones, partículas, mina, foguete
    │   ├── MenuScene.js           ← menu principal (Jogar, Opções, Créditos)
    │   ├── OptionsScene.js        ← música, SFX, números de dano, língua
    │   ├── MapScene.js            ← 4 nós de nível + modal (Normal/Sandbox) + Enciclopédia
    │   ├── GameScene.js           ← lógica principal (~890 linhas): mapa, waves, torres,
    │   │                            inimigos, poderes, sandbox, bosses
    │   ├── PauseScene.js          ← overlay de pausa (continuar/reiniciar/opções/menu)
    │   ├── GameOverScene.js       ← ecrã de derrota
    │   ├── VictoryScene.js        ← ecrã de vitória + sistema de estrelas
    │   └── EncyclopediaScene.js   ← 4 abas: Torres, Inimigos, Bosses, Poderes
    │
    ├── entities/
    │   ├── Enemy.js           ← classe Enemy (Container): movimento via Phaser.Curves.Path,
    │   │                        sistema de dano/armadura (física+mágica), slow, regen,
    │   │                        bosses (👑 coroa, barra de vida 3×, dano 3× contra soldados)
    │   ├── Tower.js           ← Tower (base) + ArcherTower, MageTower, ArtilleryTower,
    │   │                        BarracksTower + Projectile, Mine, Soldier (~640 linhas)
    │   └── HUD.js             ← interface in-game completa (~450 linhas): barra superior,
    │                            sidebar de torres, poderes drag & drop, painel torre/upgrade
    │
    └── utils/
        ├── I18n.js            ← singleton de traduções PT/EN com persistência localStorage
        ├── Settings.js        ← gestão de áudio (playSfx/playMusic) e preferências
        ├── TowerData.js       ← stats: 4 torres × 3 níveis + 2 caminhos IV + sellValue()
        ├── EnemyData.js       ← stats: 16 inimigos (12 normais + 4 bosses)
        ├── WaveData.js        ← 4 níveis × 6-9 waves, bosses com preDelay, bónus
        └── PathData.js        ← PATH_DATA (waypoints), PATH_TILES (tiles do caminho),
                                 TOWER_SLOTS (grelha 20×10), snapToPath(), buildPath()
```

---

## Tag de entrega

```bash
git tag 1.0
git push origin 1.0
```

---

## Lacunas conhecidas / Trabalho futuro

- Modo Infinito / Survival (waves sem fim com dificuldade crescente)
- Tutorial interativo no nível 1
- Diferenciação visual dos mapas por nível (tileset próprio)
- Upgrades permanentes entre níveis (talent tree com estrelas)
- Leaderboard local com `localStorage`
- 3ª língua (ex: espanhol)
- Deploy em GitHub Pages
