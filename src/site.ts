// Site-wide copy and links. Replace the placeholders as Jamal sends real assets.
export const site = {
  name: 'Jamal Amer',
  title: 'Jamal Amer — Video editor, Brooklyn',
  description:
    'Jamal Amer is a Brooklyn video editor cutting short films and long-form YouTube.',
  eyebrow: 'Short film · YouTube · Brooklyn',
  email: 'hello@jamalamer.com',

  reel: {
    /** Muted background loop in /public, e.g. '/media/showreel-loop.mp4'. Empty = striped placeholder. */
    loop: '/media/showreel-loop.mp4', // DEMO: Big Buck Bunny
    /** Poster frame for the loop, e.g. '/media/showreel-poster.jpg'. */
    poster: '/media/showreel-poster.jpg',
    /** Full reel with sound: a YouTube or Vimeo URL, or a self-hosted .mp4. */
    full: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', // DEMO: Big Buck Bunny
  },

  nav: [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' }, // TODO: no About section in the design yet
    { label: 'Contact', href: '#contact' },
  ],

  /**
   * Attribution for the demo footage (Blender open movies, CC BY), shown small
   * in the footer. The licence requires it while the demo clips are in use;
   * set to '' once they're replaced with Jamal's work.
   */
  credits:
    'Demo footage: Big Buck Bunny, Elephants Dream, Sintel and Tears of Steel © Blender Foundation, CC BY',

  social: [
    { label: 'YouTube', href: '#' }, // TODO
    { label: 'Vimeo', href: '#' }, // TODO
    { label: 'Instagram', href: '#' }, // TODO
  ],
} as const;
