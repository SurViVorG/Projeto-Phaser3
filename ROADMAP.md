# Roadmap — Incrementações Futuras

Plano de melhorias ordenado por impacto e necessidade para o jogo.  
Cada item concluído é marcado com ✅ e a data de implementação.

---

## Prioridade 1 — Essencial (base do jogo)

| # | Funcionalidade | Estado | Notas |
|---|---------------|--------|-------|
| 1.1 | **Animações de sprite** nos inimigos, torres e soldados via spritesheets procedurais | ✅ Concluído (2026-06-08) | 12 inimigos com walk 4 frames + flip; 12 torres procedurais distintas por tipo/nível; soldados com idle/walk/attack/die animado |
| 1.2 | **Feedback de dano nos inimigos** — números a flutuar ao receber dano (como o `+Xg` de ouro) | ⬜ Pendente | `floatText` já existe na GameScene; reutilizar com cor vermelha |
| 1.3 | **Sistema de estrelas com critérios definidos** — ★★★ sem vidas perdidas · ★★ ≤ 5 vidas · ★ completou | ⬜ Pendente | Sistema de estrelas já existe no MapScene mas nunca é atribuído |
| 1.4 | **Prévia da próxima onda** — seta pulsante no portal de entrada; hover mostra tooltip com inimigos | ✅ Concluído (2026-06-08) | Seta ▶ animada após cada onda concluída; tooltip com cor/nome/contagem de cada grupo; destrói ao iniciar a onda; guarda `_gameEnded` para evitar duplo endGame |

---

## Prioridade 2 — Alto impacto no gameplay

| # | Funcionalidade | Estado | Notas |
|---|---------------|--------|-------|
| 2.1 | **Upgrades bifurcados nível 4** (estilo Kingdom Rush) — 2 caminhos exclusivos ao atingir nível III | ⬜ Pendente | Ver tabela de caminhos abaixo |
| 2.2 | **Inimigo boss** no final de cada nível — HP ×5, habilidade especial, animação de entrada | ⬜ Pendente | Adicionar tipo `boss_X` ao `EnemyData.js` e última wave de cada nível |
| 2.3 | **Modo Infinito / Survival** — waves sem fim com +10% HP/speed por wave, leaderboard local | ⬜ Pendente | Reutiliza o sistema de waves existente; adicionar opção no MapScene |

### Caminhos de upgrade bifurcados (2.1)

| Torre | Caminho A | Caminho B |
|-------|-----------|-----------|
| Barracas | **Cavaleiros** — soldados com HP ×3, respawn 12 s | **Assassinos** — dano crítico 3×, soldados mais rápidos |
| Arqueiros | **Ranger** — alcance +50%, flechas perfurantes | **Sniper** — ignora armadura física, dano ×2.5 |
| Mago | **Mago de Gelo** — slow permanente em área, sem dano direto | **Nigromante** — revive inimigos fracos como aliados temporários |
| Artilharia | **Foguete** — atinge voadores, splash aéreo | **Mina Terrestre** — coloca armadilha; explode ao pisar |

---

## Prioridade 3 — Melhoria da experiência

| # | Funcionalidade | Estado | Notas |
|---|---------------|--------|-------|
| 3.1 | **Tutorial interativo no nível 1** — setas/tooltips que guiam o primeiro jogo | ⬜ Pendente | Essencial para novos jogadores sem contexto |
| 3.2 | **Diferenciação visual dos mapas** — tileset próprio por nível (floresta · pedra · lava · abismo) | ⬜ Pendente | Substituir `tile_ground` e `tile_path` por nível no `PreloadScene` |
| 3.3 | **Estados visuais nos inimigos** — lento = tint azul, em fogo = tint laranja | ⬜ Pendente | `setTint()` no sprite — trivial, melhora muito a leitura |
| 3.4 | **Modo de dificuldade** — Normal / Difícil / Inferno (multiplica HP e ajusta recompensas) | ⬜ Pendente | Passado como parâmetro ao `GameScene`; multiplica stats em `Enemy.js` |

---

## Prioridade 4 — Nice-to-have

| # | Funcionalidade | Estado | Notas |
|---|---------------|--------|-------|
| 4.1 | **Upgrades permanentes entre níveis** — gastar estrelas em buffs globais (HP soldados, custo torres, etc.) | ⬜ Pendente | "Talent tree" simples; dá propósito extra às estrelas |
| 4.2 | **Torre especial por mapa** — uma torre temática única por nível, desbloqueada com 2+ estrelas | ⬜ Pendente | Ex.: Torre de Gelo no nível 2 que congela área |
| 4.3 | **Efeitos de ambiente** — chuva (nível 2), névoa (nível 3), faíscas de lava (nível 4) | ⬜ Pendente | Usa o sistema de partículas Phaser já existente |
| 4.4 | **Leaderboard local** — top 5 pontuações por nível em `localStorage`, visível no ecrã de vitória | ⬜ Pendente | O score já é calculado; é só guardá-lo e apresentá-lo |

---

## Ordem sugerida de implementação

```
1.3 Estrelas com critérios
  → 1.2 Feedback de dano
  → 3.3 Estados visuais
  → 2.2 Boss de nível
  → 2.1 Upgrades bifurcados
  → 1.1 Animações de sprite
  → 2.3 Modo Infinito
  → 3.1 Tutorial
  → 3.4 Modo de dificuldade
  → 4.4 Leaderboard
  → 4.1 / 4.2 / 4.3 (polish final)
```

---

## Legenda

| Símbolo | Significado |
|---------|------------|
| ⬜ Pendente | Ainda não iniciado |
| 🔄 Em progresso | A ser implementado |
| ✅ Concluído | Implementado e integrado |
