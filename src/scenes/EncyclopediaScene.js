import I18n    from '../utils/I18n.js';
import Settings from '../utils/Settings.js';
import { TOWER_DATA, sellValue } from '../utils/TowerData.js';
import { ENEMY_DATA } from '../utils/EnemyData.js';

// ── Dados estáticos ───────────────────────────────────────────────────────────

const TOWER_KEYS = ['barracks', 'archer', 'mage', 'artillery'];

const ENEMY_KEYS = [
  'goblin', 'goblin_fast', 'orc', 'orc_armored',
  'troll', 'harpy', 'golem', 'dark_knight',
  'necromancer', 'wyvern', 'demon', 'lich'
];

// Cores de destaque por inimigo (legíveis sobre fundo escuro)
const ENEMY_COLORS = {
  goblin:      '#66bb6a', goblin_fast:  '#aed581',
  orc:         '#a1887f', orc_armored:  '#8d6e63',
  troll:       '#26a69a', harpy:        '#f06292',
  golem:       '#78909c', dark_knight:  '#7986cb',
  necromancer: '#ab47bc', wyvern:       '#ec407a',
  demon:       '#ef5350', lich:         '#7e57c2'
};

// ── Cena ─────────────────────────────────────────────────────────────────────

export default class EncyclopediaScene extends Phaser.Scene {
  constructor() { super({ key: 'EncyclopediaScene' }); }

  init(data) {
    this._fromScene   = data?.from ?? 'MapScene';
    this._selectedTwr = 'archer';
  }

  create() {
    const W = 1280, H = 720;
    this.cameras.main.fadeIn(400);
    this.cameras.main.setBackgroundColor('#080814');

    // Fundo
    this.add.rectangle(W/2, H/2, W, H, 0x040410, 1);
    for (let i = 0; i < 55; i++) {
      this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.4, 1.5), 0xffffff,
        Phaser.Math.FloatBetween(0.04, 0.32)
      );
    }

    // Barra de título
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x1a0f00, 0.97);
    titleBg.fillRect(0, 0, W, 66);
    this.add.text(W/2, 33, '📖 ' + I18n.t('encyclopedia.title'), {
      fontFamily: 'Georgia, serif', fontSize: '28px',
      color: '#c8960c', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // Tabs
    this._currentTab = 'towers';
    this._tabObjs    = [];
    this._tabBtns    = {};

    const TABS  = ['towers', 'enemies', 'bosses', 'powers'];
    const ICONS = ['🏰', '👹', '👑', '⚡'];
    const tabW  = 180, tabGap = 12;
    const totalTabW = TABS.length * tabW + (TABS.length - 1) * tabGap;
    const tx0 = (W - totalTabW) / 2;

    TABS.forEach((tab, i) => {
      const btn = this.add.text(
        tx0 + i * (tabW + tabGap) + tabW / 2, 91,
        ICONS[i] + ' ' + I18n.t('encyclopedia.' + tab), {
        fontFamily: 'Georgia, serif', fontSize: '16px',
        color: '#d4a56a', backgroundColor: '#1a0f00',
        padding: { x: 20, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => { if (this._currentTab !== tab) btn.setColor('#f0c040'); });
      btn.on('pointerout',  () => { if (this._currentTab !== tab) btn.setColor('#d4a56a'); });
      btn.on('pointerdown', () => this.showTab(tab));
      this._tabBtns[tab] = btn;
    });

    // Área de conteúdo
    const areaBg = this.add.graphics();
    areaBg.fillStyle(0x08081a, 0.97);
    areaBg.fillRoundedRect(28, 116, W - 56, 560, 10);
    areaBg.lineStyle(1, 0x1e1e3a, 1);
    areaBg.strokeRoundedRect(28, 116, W - 56, 560, 10);

    // Botão voltar
    const back = this.add.text(76, 694, '← ' + I18n.t('map.back'), {
      fontFamily: 'Georgia, serif', fontSize: '19px',
      color: '#d4a56a', backgroundColor: '#1a0f00',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#f0c040'));
    back.on('pointerout',  () => back.setColor('#d4a56a'));
    back.on('pointerdown', () => {
      Settings.playSfx(this, 'sfx_btn');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this._fromScene));
    });

    this.showTab('towers');
  }

  // ── Troca de aba ─────────────────────────────────────────────────────────────

  showTab(tab) {
    this._currentTab = tab;
    Object.entries(this._tabBtns).forEach(([t, btn]) => {
      const active = t === tab;
      btn.setColor(active ? '#c8960c' : '#d4a56a');
      btn.setBackgroundColor(active ? '#3d2000' : '#1a0f00');
    });
    this._tabObjs.forEach(o => { try { o.destroy(); } catch (_) {} });
    this._tabObjs = [];
    Settings.playSfx(this, 'sfx_btn');
    if (tab === 'towers')  this._buildTowers();
    if (tab === 'enemies') this._buildEnemies();
    if (tab === 'bosses')  this._buildBosses();
    if (tab === 'powers')  this._buildPowers();
  }

  // Regista objeto para destruição na próxima troca de aba
  _r(...objs) {
    for (const o of objs) if (o) this._tabObjs.push(o);
  }

  // ── ABA: TORRES ──────────────────────────────────────────────────────────────

  _buildTowers() {
    const lang = I18n.getLang();

    // Painel seletor (esquerda): x=38, y=124, w=220, h=544
    const SX = 38, SY = 124, SW = 220, SH = 544;
    // Painel detalhe (direita): x=270, y=124, w=970, h=544
    const DX = 270, DY = 124, DW = 970, DH = 544;

    // Fundo seletor
    const selBg = this.add.graphics();
    selBg.fillStyle(0x0a0a1e, 1);
    selBg.fillRoundedRect(SX, SY, SW, SH, 8);
    this._r(selBg);

    // Cartões de seleção das torres
    const CARD_H = 104, CARD_GAP = 12;
    const totalCards = 4 * CARD_H + 3 * CARD_GAP;
    const cardY0 = SY + (SH - totalCards) / 2;

    TOWER_KEYS.forEach((key, i) => {
      const cy = cardY0 + i * (CARD_H + CARD_GAP) + CARD_H / 2;
      const isActive = key === this._selectedTwr;
      const def = TOWER_DATA[key];

      const cardBg = this.add.graphics();
      cardBg.fillStyle(isActive ? 0x3d2000 : 0x10101e, 1);
      cardBg.fillRoundedRect(SX + 6, cy - CARD_H/2, SW - 12, CARD_H, 6);
      if (isActive) {
        cardBg.lineStyle(2, 0xc8960c, 1);
        cardBg.strokeRoundedRect(SX + 6, cy - CARD_H/2, SW - 12, CARD_H, 6);
      }
      this._r(cardBg);

      const img = this.add.image(SX + 30, cy - 8, 'tower_' + key).setDisplaySize(36, 36);
      this._r(img);

      const nameColor = isActive ? '#c8960c' : '#d4a56a';
      this._r(
        this.add.text(SX + 58, cy - 22, I18n.t('towers.' + key), {
          fontFamily: 'Georgia, serif', fontSize: '14px', color: nameColor,
          stroke: '#000', strokeThickness: 1
        }).setOrigin(0, 0.5),
        this.add.text(SX + 58, cy - 2, def.baseCost + 'g compra', {
          fontFamily: 'monospace', fontSize: '11px', color: '#fdd835'
        }).setOrigin(0, 0.5),
        this.add.text(SX + 58, cy + 16, 'venda: ' + sellValue(key, 0) + '–' + sellValue(key, 2) + 'g', {
          fontFamily: 'monospace', fontSize: '10px', color: '#777'
        }).setOrigin(0, 0.5)
      );

      // Área clicável
      const hit = this.add.rectangle(SX + 6, cy - CARD_H/2, SW - 12, CARD_H, 0, 0)
        .setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => { this._selectedTwr = key; this.showTab('towers'); });
      this._r(hit);
    });

    // ── Painel de detalhe ─────────────────────────────────────────────────────
    const detBg = this.add.graphics();
    detBg.fillStyle(0x0a0a1e, 1);
    detBg.fillRoundedRect(DX, DY, DW, DH, 8);
    this._r(detBg);

    const key = this._selectedTwr;
    const def = TOWER_DATA[key];
    const lv  = def.levels;

    // Posições X das colunas de nível
    const LABEL_X = DX + 18;
    const COL_X   = [DX + 450, DX + 658, DX + 882];

    // Título
    this._r(this.add.text(DX + 16, DY + 22, I18n.t('towers.' + key), {
      fontFamily: 'Georgia, serif', fontSize: '22px',
      color: '#c8960c', stroke: '#000', strokeThickness: 2
    }).setOrigin(0, 0.5));

    // Imagens dos 3 níveis + rótulos
    ['I', 'II', 'III'].forEach((lvlLabel, i) => {
      const tx   = COL_X[i];
      const iKey = i === 0 ? 'tower_' + key : 'tower_' + key + '_' + (i + 1);
      this._r(
        this.add.image(tx, DY + 32, iKey).setDisplaySize(42, 42),
        this.add.text(tx, DY + 60, 'Nível ' + lvlLabel, {
          fontFamily: 'Georgia, serif', fontSize: '13px', color: '#fdd835'
        }).setOrigin(0.5)
      );
    });

    // Separador
    const divG = this.add.graphics();
    divG.lineStyle(1, 0x2a2a4a, 1);
    divG.lineBetween(DX + 10, DY + 74, DX + DW - 10, DY + 74);
    this._r(divG);

    // Tabela de stats
    const rows   = this._towerRows(key, def);
    const ROW_H  = 37;
    const ROW_Y0 = DY + 82;

    rows.forEach((row, ri) => {
      const ry = ROW_Y0 + ri * ROW_H;

      const rbg = this.add.graphics();
      rbg.fillStyle(ri % 2 === 0 ? 0x10101e : 0x0d0d20, 1);
      rbg.fillRect(DX + 8, ry, DW - 16, ROW_H - 1);
      this._r(rbg);

      this._r(this.add.text(LABEL_X, ry + ROW_H/2, row.label, {
        fontFamily: 'monospace', fontSize: '13px', color: '#888'
      }).setOrigin(0, 0.5));

      row.vals.forEach((v, ci) => {
        this._r(this.add.text(COL_X[ci], ry + ROW_H/2, v ?? '—', {
          fontFamily: 'monospace', fontSize: '13px',
          color: row.hi ? '#fdd835' : '#ddd'
        }).setOrigin(0.5, 0.5));
      });
    });

    // ── Caminhos Nível IV ──────────────────────────────────────────
    if (def.paths) {
      const pathY = ROW_Y0 + rows.length * ROW_H + 6;

      const pdiv = this.add.graphics();
      pdiv.lineStyle(1, 0x2a2a4a, 1);
      pdiv.lineBetween(DX + 10, pathY, DX + DW - 10, pathY);
      this._r(pdiv);

      this._r(this.add.text(DX + DW / 2, pathY + 14, '⚔ Nível IV — Caminhos', {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#c8960c'
      }).setOrigin(0.5));

      const cardW = (DW - 54) / 2;
      const cardY = pathY + 30;
      const cardH = DY + DH - cardY - 8;

      ['A', 'B'].forEach((p, pi) => {
        const pd = def.paths[p];
        const cx = DX + 18 + pi * (cardW + 18);
        const labelColor = p === 'A' ? '#f0c040' : '#42a5f5';
        const bgColor    = p === 'A' ? 0x1a1400 : 0x0a1428;
        const borderColor = p === 'A' ? 0xf0c040 : 0x42a5f5;

        const cbg = this.add.graphics();
        cbg.fillStyle(bgColor, 0.85);
        cbg.fillRoundedRect(cx, cardY, cardW, cardH, 8);
        cbg.lineStyle(1, borderColor, 0.5);
        cbg.strokeRoundedRect(cx, cardY, cardW, cardH, 8);
        this._r(cbg);

        const texKey = 'tower_' + key + '_4' + p.toLowerCase();
        if (this.textures.exists(texKey)) {
          this._r(this.add.image(cx + 28, cardY + 24, texKey).setDisplaySize(38, 38));
        }

        this._r(
          this.add.text(cx + 56, cardY + 14, pd.label, {
            fontFamily: 'Georgia, serif', fontSize: '15px', color: labelColor,
            stroke: '#000', strokeThickness: 1
          }).setOrigin(0, 0.5),
          this.add.text(cx + cardW - 12, cardY + 14, pd.cost + 'g', {
            fontFamily: 'monospace', fontSize: '13px', color: '#fdd835'
          }).setOrigin(1, 0.5),
          this.add.text(cx + 56, cardY + 34, pd.description, {
            fontFamily: 'monospace', fontSize: '10px', color: '#bbb'
          }).setOrigin(0, 0.5)
        );

        const statsY = cardY + 52;
        const pStats = this._pathStats(key, pd);
        pStats.forEach(([lbl, val], si) => {
          this._r(this.add.text(cx + 14, statsY + si * 16, lbl, {
            fontFamily: 'monospace', fontSize: '10px', color: '#777'
          }).setOrigin(0, 0.5));
          this._r(this.add.text(cx + cardW - 12, statsY + si * 16, val, {
            fontFamily: 'monospace', fontSize: '10px', color: '#ddd'
          }).setOrigin(1, 0.5));
        });

        this._r(this.add.text(cx + 14, statsY + pStats.length * 16 + 4,
          'Venda: ' + sellValue(key, 3, p) + 'g', {
          fontFamily: 'monospace', fontSize: '10px', color: '#777'
        }).setOrigin(0, 0.5));
      });
    }
  }

  _towerRows(key, def) {
    const lv    = def.levels;
    const sell  = (lvl) => sellValue(key, lvl) + 'g';
    const toRPS = (fr)  => fr ? (1000/fr).toFixed(1)+'/s' : null;
    const upC   = (i)   => lv[i].upgradeCost ? '+' + lv[i].upgradeCost + 'g' : '—';

    const base = [
      { label: 'Custo / melhoria', vals: [def.baseCost + 'g', upC(0), upC(1)] },
      { label: 'Valor de venda',   vals: [sell(0), sell(1), sell(2)] },
    ];

    if (key === 'barracks') {
      return [...base,
        { label: 'Soldados',      vals: lv.map(l => String(l.soldiers)), hi: true },
        { label: 'HP soldado',    vals: lv.map(l => String(l.hp)) },
        { label: 'Dano/soldado',  vals: lv.map(l => String(l.soldierDmg)), hi: true },
        { label: 'Alcance rally', vals: lv.map(l => l.range + 'px') },
      ];
    }

    const rows = [...base,
      { label: 'Dano',       vals: lv.map(l => String(l.damage)), hi: true },
      { label: 'Alcance',    vals: lv.map(l => l.range + 'px') },
      { label: 'Ataques/s',  vals: lv.map(l => toRPS(l.fireRate)), hi: true },
    ];

    if (key === 'mage') {
      rows.push(
        { label: 'Dano mágico',   vals: ['Sim', 'Sim', 'Sim'] },
        { label: 'Área (splash)', vals: ['—', '—', lv[2].splashRadius + 'px'] }
      );
    }
    if (key === 'artillery') {
      rows.push(
        { label: 'Raio explosão',   vals: lv.map(l => l.splashRadius + 'px') },
        { label: 'Ignora voadores', vals: ['Sim', 'Sim', 'Sim'] }
      );
    }

    return rows;
  }

  _pathStats(key, pd) {
    if (key === 'barracks') {
      const rows = [
        ['HP soldado',  String(pd.hp)],
        ['Dano/sold.',  String(pd.soldierDmg)],
        ['Soldados',    String(pd.soldiers)],
        ['Respawn',     (pd.respawnDelay / 1000) + 's'],
      ];
      if (pd.critChance) rows.push(['Crítico', Math.round(pd.critChance * 100) + '% ×' + pd.critMult]);
      if (pd.soldierSpeed) rows.push(['Velocidade', pd.soldierSpeed + '×']);
      return rows;
    }
    const rows = [];
    if (pd.damage !== undefined) rows.push(['Dano', String(pd.damage)]);
    if (pd.range)      rows.push(['Alcance', pd.range + 'px']);
    if (pd.fireRate)   rows.push(['Ataques/s', (1000 / pd.fireRate).toFixed(1) + '/s']);
    if (pd.splashRadius) rows.push(['Splash', pd.splashRadius + 'px']);
    if (pd.piercing)     rows.push(['Perfurante', 'Sim']);
    if (pd.ignoreArmor)  rows.push(['Ignora armadura', 'Sim']);
    if (pd.hitsFlying)   rows.push(['Atinge voadores', 'Sim']);
    if (pd.slowField)    rows.push(['Slow permanente', (pd.slowMs / 1000) + 's']);
    if (pd.necromancy)   rows.push(['Necromancia', '55% chance']);
    if (pd.maxMines)     rows.push(['Minas máx.', String(pd.maxMines)]);
    if (pd.mineDelay)    rows.push(['Intervalo mina', (pd.mineDelay / 1000) + 's']);
    return rows;
  }

  // ── ABA: INIMIGOS ────────────────────────────────────────────────────────────

  _buildEnemies() {
    const lang = I18n.getLang();
    const COLS = 4, ROWS = 3;
    const PX = 38, PY = 126;
    const CW = (1280 - 2 * PX) / COLS;  // ~301px
    const CH = 548 / ROWS;               // ~182px

    ENEMY_KEYS.forEach((key, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x0 = PX + col * CW + 4;
      const y0 = PY + row * CH + 4;
      const cw = CW - 8, ch = CH - 8;

      const data    = ENEMY_DATA[key];
      const color   = ENEMY_COLORS[key] ?? '#aaa';
      const colHex  = parseInt(color.replace('#', ''), 16);

      // Fundo do cartão
      const bg = this.add.graphics();
      bg.fillStyle(0x0e0e20, 1);
      bg.fillRoundedRect(x0, y0, cw, ch, 8);
      bg.lineStyle(1, colHex, 0.55);
      bg.strokeRoundedRect(x0, y0, cw, ch, 8);
      this._r(bg);

      // Sprite (frame 0 da walk animation)
      try {
        const spr = this.add.sprite(x0 + 28, y0 + ch/2 - 8, key, 0).setDisplaySize(38, 38);
        this._r(spr);
      } catch (_) {}

      // Nome
      this._r(this.add.text(x0 + 62, y0 + 16, I18n.t('enemies.' + key), {
        fontFamily: 'Georgia, serif', fontSize: '13px', color,
        stroke: '#000', strokeThickness: 1
      }).setOrigin(0, 0.5));

      // Stats principais
      const pct = (v) => Math.round((v || 0) * 100) + '%';
      const statLines = [
        ['❤ HP',    String(data.hp),             '#ef5350'],
        ['⚡ Vel.',  String(data.speed),           '#fdd835'],
        ['🛡 Arm.',  pct(data.armor),              '#90caf9'],
        ['✨ Mag.',  pct(data.magicArmor),         '#ce93d8'],
        ['💰 Rec.', data.reward + 'g',             '#00e676'],
      ];
      statLines.forEach(([lbl, val, clr], si) => {
        this._r(this.add.text(x0 + 62, y0 + 34 + si * 20, lbl + ' ' + val, {
          fontFamily: 'monospace', fontSize: '11px', color: clr
        }).setOrigin(0, 0.5));
      });

      // Especiais
      const spec = [];
      if (data.flying)               spec.push('✈ Voador');
      if (data.heavyArmor)           spec.push('🛡 Arm.Pesada');
      if (data.regen)                spec.push('♻ Regen ' + data.regen + '/s');
      if ((data.magicArmor || 0) >= 0.4) spec.push('✨ Resist.Mag.');
      if (spec.length) {
        this._r(this.add.text(x0 + 8, y0 + ch - 16, spec.join(' · '), {
          fontFamily: 'monospace', fontSize: '9px', color: '#ffd080'
        }).setOrigin(0, 0.5));
      }
    });
  }

  // ── ABA: BOSSES ──────────────────────────────────────────────────────────────

  _buildBosses() {
    const BOSS_KEYS = ['boss_forest', 'boss_ruins', 'boss_chaos', 'boss_demon'];
    const LEVEL_NAMES = [
      { pt: 'Floresta Sombria', en: 'Dark Forest' },
      { pt: 'Ruínas Antigas',   en: 'Ancient Ruins' },
      { pt: 'Fortaleza do Caos', en: 'Chaos Fortress' },
      { pt: 'Covil do Demônio', en: 'Demon Lair' }
    ];
    const lang = I18n.getLang();
    const isEN = lang === 'en';

    const PX = 38, PY = 130;
    const CW = (1280 - 2 * PX - 24) / 2;
    const CH = 254;

    BOSS_KEYS.forEach((key, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x0 = PX + col * (CW + 24);
      const y0 = PY + row * (CH + 16);
      const data = ENEMY_DATA[key];
      const color = '#' + data.color.toString(16).padStart(6, '0');
      const colHex = data.color;
      const lvlName = isEN ? LEVEL_NAMES[idx].en : LEVEL_NAMES[idx].pt;

      const bg = this.add.graphics();
      bg.fillStyle(0x0e0e20, 1);
      bg.fillRoundedRect(x0, y0, CW, CH, 10);
      bg.lineStyle(2, colHex, 0.6);
      bg.strokeRoundedRect(x0, y0, CW, CH, 10);
      this._r(bg);

      try {
        const spr = this.add.sprite(x0 + 40, y0 + 55, key, 0).setDisplaySize(52, 52);
        this._r(spr);
      } catch (_) {}

      this._r(this.add.text(x0 + 40, y0 + 88, '👑', {
        fontSize: '14px'
      }).setOrigin(0.5));

      this._r(this.add.text(x0 + 76, y0 + 22, I18n.t('enemies.' + key), {
        fontFamily: 'Georgia, serif', fontSize: '18px', color,
        stroke: '#000', strokeThickness: 2
      }).setOrigin(0, 0.5));

      this._r(this.add.text(x0 + 76, y0 + 44, (isEN ? 'Level ' : 'Nível ') + (idx + 1) + ' — ' + lvlName, {
        fontFamily: 'monospace', fontSize: '11px', color: '#888'
      }).setOrigin(0, 0.5));

      this._r(this.add.text(x0 + 76, y0 + 62, (isEN ? 'Last wave boss' : 'Boss da última vaga'), {
        fontFamily: 'monospace', fontSize: '10px', color: '#666'
      }).setOrigin(0, 0.5));

      const div = this.add.graphics();
      div.lineStyle(1, colHex, 0.25);
      div.lineBetween(x0 + 12, y0 + 78, x0 + CW - 12, y0 + 78);
      this._r(div);

      const pct = (v) => Math.round((v || 0) * 100) + '%';
      const statLines = [
        ['❤ HP',           String(data.hp),       '#ef5350'],
        ['⚡ ' + (isEN ? 'Speed' : 'Vel.'),  String(data.speed), '#fdd835'],
        ['🛡 ' + (isEN ? 'Armor' : 'Arm.'),  pct(data.armor),   '#90caf9'],
        ['✨ ' + (isEN ? 'Magic' : 'Mag.'),  pct(data.magicArmor), '#ce93d8'],
        ['💰 ' + (isEN ? 'Reward' : 'Rec.'), data.reward + 'g', '#00e676'],
        ['💀 ' + (isEN ? 'Damage' : 'Dano'), String(data.damage), '#ff8a80'],
      ];

      statLines.forEach(([lbl, val, clr], si) => {
        const sx = si < 3 ? x0 + 16 : x0 + CW / 2 + 8;
        const sy = y0 + 92 + (si % 3) * 22;
        this._r(this.add.text(sx, sy, lbl + '  ' + val, {
          fontFamily: 'monospace', fontSize: '11px', color: clr
        }).setOrigin(0, 0.5));
      });

      const specY = y0 + 164;
      const spec = [];
      if (data.flying)     spec.push('✈ ' + (isEN ? 'Flying' : 'Voador'));
      if (data.heavyArmor) spec.push('🛡 ' + (isEN ? 'Heavy Armor' : 'Arm. Pesada'));
      if (data.regen)      spec.push('♻ ' + (isEN ? 'Regen' : 'Regen') + ' ' + data.regen + '/s');
      if (data.magicArmor >= 0.5) spec.push('✨ ' + (isEN ? 'Magic Resist' : 'Resist. Mag.'));

      if (spec.length) {
        const specBg = this.add.graphics();
        specBg.fillStyle(colHex, 0.08);
        specBg.fillRoundedRect(x0 + 10, specY - 4, CW - 20, 22, 4);
        this._r(specBg);
        this._r(this.add.text(x0 + CW / 2, specY + 6, spec.join('  ·  '), {
          fontFamily: 'monospace', fontSize: '10px', color
        }).setOrigin(0.5));
      }

      // Size indicator
      this._r(this.add.text(x0 + CW - 16, y0 + 22, '★ BOSS', {
        fontFamily: 'monospace', fontSize: '11px', color: '#ffd700',
        stroke: '#000', strokeThickness: 1
      }).setOrigin(1, 0.5));
    });
  }

  // ── ABA: PODERES ─────────────────────────────────────────────────────────────

  _buildPowers() {
    const lang = I18n.getLang();
    const isEN = lang === 'en';

    // Dois cartões centrados na área de conteúdo (x=38..1242, y=124..676)
    const CY = 130, CH = 544;
    const CW = 558;
    const GAP = 24;
    // Centrar os dois cartões
    const totalW = CW * 2 + GAP;
    const startX = 38 + ((1280 - 56) - totalW) / 2;

    this._powerCard(startX, CY, CW, CH, '⚔', I18n.t('powers.reinforcements'), '#42a5f5', [
      [isEN ? 'Cooldown'           : 'Recarga',            '30s'],
      [isEN ? 'Soldiers deployed'  : 'Soldados',           '4'],
      [isEN ? 'HP per soldier'     : 'HP soldado',         '200'],
      [isEN ? 'Damage per soldier' : 'Dano/soldado',       '18'],
      [isEN ? 'Duration'           : 'Duração',            '18s'],
      [isEN ? 'Blocks enemies'     : 'Bloqueia inimigos',  isEN ? 'Yes (non-flyers)' : 'Sim (não voadores)'],
      [isEN ? 'Armor'              : 'Armadura',           isEN ? 'None' : 'Sem resistência'],
    ]);

    this._powerCard(startX + CW + GAP, CY, CW, CH, '☄', I18n.t('powers.meteor'), '#ff5722', [
      [isEN ? 'Cooldown'       : 'Recarga',           '45s'],
      [isEN ? 'Max damage'     : 'Dano máximo',       '220'],
      [isEN ? 'Blast radius'   : 'Raio',              '110px'],
      [isEN ? 'Edge damage'    : 'Dano na periferia', isEN ? 'Decreases with dist.' : 'Decresce com dist.'],
      [isEN ? 'Armor bypass'   : 'Ignora armadura',   isEN ? 'All armor ignored' : 'Toda (incluindo magia)'],
      [isEN ? 'Affects flyers' : 'Afeta voadores',    isEN ? 'Yes' : 'Sim'],
      [isEN ? 'Stun'           : 'Atordoamento',      isEN ? 'None' : 'Nenhum'],
    ]);
  }

  _powerCard(x, y, w, h, icon, name, color, stats) {
    const colN = parseInt(color.replace('#', ''), 16);
    const cx   = x + w / 2;

    // Fundo
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1e, 1);
    bg.fillRoundedRect(x, y, w, h, 12);
    bg.lineStyle(2, colN, 0.65);
    bg.strokeRoundedRect(x, y, w, h, 12);
    this._r(bg);

    // Ícone + nome
    this._r(
      this.add.text(cx, y + 50, icon, {
        fontFamily: 'monospace', fontSize: '46px', color, stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5),
      this.add.text(cx, y + 102, name, {
        fontFamily: 'Georgia, serif', fontSize: '22px', color, stroke: '#000', strokeThickness: 2
      }).setOrigin(0.5)
    );

    // Separador
    const div = this.add.graphics();
    div.lineStyle(1, colN, 0.3);
    div.lineBetween(x + 20, y + 126, x + w - 20, y + 126);
    this._r(div);

    // Linhas de stats
    const ROW_H  = 40;
    const ROW_Y0 = y + 136;

    stats.forEach(([lbl, val], i) => {
      const ry  = ROW_Y0 + i * ROW_H;
      const rbg = this.add.graphics();
      rbg.fillStyle(i % 2 === 0 ? 0x10101e : 0x0d0d22, 1);
      rbg.fillRect(x + 10, ry, w - 20, ROW_H - 2);
      this._r(rbg);

      this._r(
        this.add.text(x + 22, ry + ROW_H/2, lbl, {
          fontFamily: 'monospace', fontSize: '14px', color: '#888'
        }).setOrigin(0, 0.5),
        this.add.text(x + w - 22, ry + ROW_H/2, String(val), {
          fontFamily: 'monospace', fontSize: '14px', color: '#e0e0e0'
        }).setOrigin(1, 0.5)
      );
    });
  }
}
