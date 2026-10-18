// Both language entries use the complete shared mix, confirmed 2026-10-18.
// A guided mix should include its own gentle music tail; set fadeOut to 0
// to preserve the final spoken words at their original volume.
export const AUDIO = {
  adventure: 'assets/adventure.mp3',
  meditation: {
    zh: {src: 'assets/meditation-zh-guided-20261018.mp3', duration: 252.525708, fadeIn: 0, fadeOut: 0},
    en: {src: 'assets/meditation-zh-guided-20261018.mp3', duration: 252.525708, fadeIn: 0, fadeOut: 0}
  }
};
