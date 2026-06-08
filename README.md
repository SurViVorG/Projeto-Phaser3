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
- Começas com **20 vidas** e ouro consoante o nível que te encontras
- Cada inimigo que chega ao castelo retira vidas (1–3 conforme o tipo)
- Ganhas ouro ao eliminar inimigos
- Usas ouro para construir e melhorar torres
- O jogo termina quando as vidas chegam a 0 (Derrota) ou todas as vagas são eliminadas (Vitória)

**Funcionalidades implementadas:**
- 4 tipos de torres (Barracas, Arqueiros, Magos, Artilharia) com 3 níveis cada
- 12 tipos de inimigos (Goblin, Goblin Veloz, Orc, Orc Blindado, Troll, Harpia, Golem, Cavaleiro Negro, Necromante, Wyvern, Demônio, Lich) com comportamentos distintos
- 4 níveis com caminhos únicos, dificuldade crescente e vagas balanceadas (6–9 vagas por nível)
- Ouro inicial ajustado por nível (250g nos níveis 1–2, 300g no 3, 375g no 4)
- Sistema de armadura física e mágica nos inimigos; inimigos voadores ignoram barracas e artilharia
- Barracas com soldados que bloqueiam inimigos (respawn automático após 8s)
- Ponto de rally arrastável para reposicionar soldados na pista
- 2 poderes especiais: Reforços (cooldown 30s) e Meteorito (cooldown 45s)
  - Cooldown pausa entre vagas e escala com o botão ×2
- Suporte multilíngue PT / EN com seletor acessível
- Múltiplas cenas: Boot → Preload → Menu → Opções → Mapa → Jogo → Pausa → GameOver/Vitória
- HUD completo: ouro, vidas, vaga atual, pontuação
- Botão acelerar (×2) e iniciar vaga
- Painel de upgrade/venda de torres com círculo de alcance
- Câmara com shake no meteorito
- Partículas de faíscas, sangue e magia

---

## Jogabilidade / Controlos

| Ação | Controlo |
|------|----------|
| Construir Barracas | Clique no painel lateral → slot no mapa · ou tecla **1** |
| Construir Arqueiros | Clique no painel lateral → slot no mapa · ou tecla **2** |
| Construir Magos | Clique no painel lateral → slot no mapa · ou tecla **3** |
| Construir Artilharia | Clique no painel lateral → slot no mapa · ou tecla **4** |
| Selecionar torre | Clique na torre (mostra painel upgrade/venda) |
| Reposicionar soldados (barracas) | Arrastar a bandeira ⚑ — só fica na pista |
| Cancelar construção | **ESC** |
| Iniciar vaga | Botão **▶ Iniciar Vaga** ou aguardar |
| Acelerar jogo | Botão **⏩ x2** |
| Poder — Reforços | Arrastar ícone para o campo (cooldown 30s) |
| Poder — Meteorito | Arrastar ícone para o alvo (cooldown 45s) |
| **Pausa** | Tecla **P** ou botão ⏸ no HUD |
| Reiniciar | Tecla **R** ou menu de pausa |
| Mudar língua | Seletor PT / EN no menu, mapa e opções da pausa |

---

## Como Executar

### Requisitos
- Node.js v18+ com npm

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Correr em modo desenvolvimento
npm run dev

# 3. Abrir no browser
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
- **Ficheiros PNG reais** em `public/assets/images/` (~35 sprites, ~14 KB no total)
- Torres (4 tipos × 3 níveis), 12 tipos de inimigos, projéteis, tiles de chão/caminho, castelo, portal e soldado
- Resolução proporcional ao uso: torres 48×48, inimigos dimensionados ao seu `size`, tiles 64×64 — sem PNGs sobredimensionados
- Carregados no `PreloadScene.preload()` com `this.load.image()`
- Elementos puramente de UI (círculo de alcance, explosão, partículas, ícones) continuam a ser gerados em runtime no `PreloadScene.generateUITextures()` por serem triviais e não justificarem ficheiro

### Áudio
- **15 efeitos sonoros + 2 músicas** de fundo em `public/assets/audio/`, formato **OGG Vorbis** (~130 KB no total)
- Eventos com som: tiro de flecha/magia/canhão, moeda, explosão, morte de inimigo, perda de vida, início de vaga, clique de botão, vitória, derrota, colocar torre, upgrade, meteorito, reforços
- Música de menu (calma) e música de batalha (tensa), ambas em loop, geridas por `Settings.playMusic()`
- Volume e ligar/desligar configuráveis nas Opções e no menu de Pausa, persistidos em `localStorage`
- Carregados no `PreloadScene.preload()` com `this.load.audio()`

### Formato e justificação
| Asset | Formato | Justificação |
|-------|---------|----|
| Sprites | PNG-32 com transparência | Canal alpha necessário; ficheiros minúsculos |
| Efeitos sonoros | OGG Vorbis q3 | Boa compressão, suporte universal nos browsers |
| Música de fundo | OGG Vorbis q3 | Qualidade aceitável, ficheiro pequeno (~15 KB) |

**Total de assets:** ~145 KB (muito abaixo do limite de 10 MB)

---

## Estrutura do Projeto

```
kingdom-rush-tp2/
├── index.html
├── package.json
├── vite.config.js
├── .gitignore
├── README.md
├── locales/
│   ├── pt.json          ← traduções português
│   └── en.json          ← traduções inglês
├── public/
│   └── assets/
│       ├── images/      ← 32 sprites PNG (torres, inimigos, tiles…)
│       ├── audio/       ← 17 ficheiros OGG (15 SFX + 2 músicas)
│       ├── spritesheets/← (reservado para animações futuras)
│       └── fonts/       ← (reservado para bitmap fonts)
└── src/
    ├── main.js          ← config Phaser + registo de cenas
    ├── scenes/
    │   ├── BootScene.js
    │   ├── PreloadScene.js  ← carrega imagens + áudio reais
    │   ├── MenuScene.js
    │   ├── OptionsScene.js
    │   ├── MapScene.js
    │   ├── GameScene.js
    │   ├── PauseScene.js    ← menu de pausa (continuar/reiniciar/opções/menu)
    │   ├── GameOverScene.js
    │   └── VictoryScene.js
    ├── entities/
    │   ├── Enemy.js     ← inimigos (armadura física/mágica, voadores)
    │   ├── Tower.js     ← torres + projéteis + soldados (combate)
    │   └── HUD.js       ← interface de jogo completa
    └── utils/
        ├── I18n.js      ← gestor de traduções
        ├── Settings.js  ← áudio e preferências persistentes
        ├── TowerData.js ← stats e custos das torres
        ├── EnemyData.js ← stats dos inimigos
        ├── WaveData.js  ← vagas dos 4 níveis (dificuldade crescente)
        └── PathData.js  ← caminhos, tiles e slots dos 4 níveis
```

> Os assets estão em `public/assets/` para o Vite os servir como ficheiros
> estáticos. Em dev (`npm run dev`) ficam acessíveis em `/assets/…`.

---

## Tag de entrega

```bash
git tag 1.0
git push origin 1.0
```

---

## Lacunas conhecidas / Trabalho futuro

- Animações de spritesheet para inimigos e torres (atualmente sprites estáticos)
- Música original (as faixas atuais são geradas proceduralmente)
- Efeitos de câmara adicionais (parallax de fundo)
- Leaderboard local com `localStorage`
