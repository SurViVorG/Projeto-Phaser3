/**
 * Settings — gere áudio e preferências, persistindo em localStorage.
 * Agora usa ficheiros OGG reais carregados no PreloadScene.
 */
class Settings {
  constructor() {
    this.musicVolume = parseFloat(localStorage.getItem('kr_music') ?? '0.4');
    this.sfxVolume   = parseFloat(localStorage.getItem('kr_sfx')   ?? '0.7');
    this.musicOn     = (localStorage.getItem('kr_musicOn')    ?? 'true') === 'true';
    this.sfxOn       = (localStorage.getItem('kr_sfxOn')      ?? 'true') === 'true';
    this.dmgNumbers  = (localStorage.getItem('kr_dmgNumbers') ?? 'true') === 'true';
    this._currentMusic = null;
    this._currentKey   = null;
  }

  setMusic(on) {
    this.musicOn = on;
    localStorage.setItem('kr_musicOn', String(on));
    if (!on) this.stopMusic();
  }
  setSfx(on) {
    this.sfxOn = on;
    localStorage.setItem('kr_sfxOn', String(on));
  }
  setDmgNumbers(on) {
    this.dmgNumbers = on;
    localStorage.setItem('kr_dmgNumbers', String(on));
  }
  setMusicVolume(v) {
    this.musicVolume = v;
    localStorage.setItem('kr_music', String(v));
    if (this._currentMusic) this._currentMusic.setVolume(v);
  }
  setSfxVolume(v) {
    this.sfxVolume = v;
    localStorage.setItem('kr_sfx', String(v));
  }

  /** Toca um efeito sonoro, se o som estiver ligado e o ficheiro existir */
  playSfx(scene, key, extra = {}) {
    if (!this.sfxOn || !scene?.sound) return;
    if (!scene.cache.audio.exists(key)) return;
    try {
      scene.sound.play(key, { volume: this.sfxVolume, ...extra });
    } catch (e) { /* ignora erros de áudio */ }
  }

  /** Inicia música de fundo em loop */
  playMusic(scene, key) {
    // Já está a tocar esta música?
    if (this._currentKey === key && this._currentMusic?.isPlaying) return;
    this.stopMusic();
    if (!this.musicOn || !scene?.sound) return;
    if (!scene.cache.audio.exists(key)) return;
    try {
      this._currentMusic = scene.sound.add(key, { loop: true, volume: this.musicVolume });
      this._currentMusic.play();
      this._currentKey = key;
    } catch (e) { /* ignora */ }
  }

  stopMusic() {
    if (this._currentMusic) {
      try { this._currentMusic.stop(); this._currentMusic.destroy(); } catch (e) {}
      this._currentMusic = null;
      this._currentKey = null;
    }
  }
}

export default new Settings();
