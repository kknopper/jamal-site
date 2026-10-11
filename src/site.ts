// Site-wide copy and links. Replace the placeholders as Jamal sends real assets.
export const site = {
  name: 'Jamal Amer',
  title: 'Jamal Amer — Video editor, Las Vegas',
  description:
    'Jamal Amer is a Las Vegas video editor with over 10 years of experience cutting YouTube and social media content for clients including Newegg, Ranker and REACT.',
  eyebrow: 'YouTube · Shorts · Las Vegas',
  email: 'hello@jamalamer.com',
  /**
   * Where the contact form POSTs (JSON: name, email, message), e.g. a Formspree
   * URL. Empty = the form opens the visitor's email app with the message filled in.
   */
  contactEndpoint: '',

  about: {
    heading: 'About',
    // The big line, then the body and closing line beside it.
    lead: 'My name is Jamal! I’m a Las Vegas–based video editor who spent my life living and working in Los Angeles before making the move to Nevada.',
    body: 'I have over 10 years of experience creating YouTube and social media content for clients including Newegg, Ranker, and the REACT channel. I work in Adobe Premiere Pro, Photoshop, and After Effects, shaping footage into polished videos that fit each client’s style and goals.',
    closing: 'Have a project in mind? I’m available for editing work, fill out the contact form, and let’s chat!',
    cta: 'Let’s chat',
    stats: [
      { label: 'EXPERIENCE', value: '10+ years' },
      // One line per specialty.
      { label: 'SPECIALTIES', value: ['YouTube', 'Social media', 'Footage sourcing'] },
      {
        label: 'TOOLS',
        // Icons: CoreUI Brands via Iconify (CC0), saved white in /public/icons.
        value: [
          { name: 'Premiere Pro', icon: '/icons/premiere-pro.svg' },
          { name: 'After Effects', icon: '/icons/after-effects.svg' },
          { name: 'Photoshop', icon: '/icons/photoshop.svg' },
        ],
      },
    ],
    clientsLabel: 'WORKED WITH',
    /**
     * Client strip. Add `logo: '/logos/newegg.svg'` (SVG or transparent PNG in
     * /public/logos) to show a logo, which is forced to white. Without one the
     * name is shown as a plain wordmark. `height` (px, desktop) tunes a logo's
     * size so they look the same weight: wide logos need less, compact ones more.
     */
    clients: [
      { name: 'Newegg', logo: '/logos/newegg.png', height: 46 },
      { name: 'Ranker', logo: '/logos/ranker.png', height: 26 },
      { name: 'REACT', logo: '/logos/react.png', height: 36 },
    ] as { name: string; logo?: string; height?: number }[],
  },

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
    { label: 'About', href: '#about' },
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
