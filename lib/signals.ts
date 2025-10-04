import type { Signal, SignalCardContent } from '@/types/scanner';

export const SIGNALS: Signal[] = [
  {
    id: 'about',
    freq: 88.1,
    title: 'CASE FILE: SUBJECT PROFILE',
    pages: 3,
    audioUrl: '/audio/about-ambient.mp3',
    broadcastDate: '2025-09-30',
    location: 'REMOTE NODE 07',
    tags: ['DOSSIER', 'GLITCH', 'FIELD NOTES'],
    summary:
      "An identity transmission traced from the subject's archived memories and reconstructed through spectral analysis.",
    accentColor: '#F5F05B',
    background: 'linear-gradient(135deg, #F5F05B 0%, #FF8DA1 38%, #161616 100%)',
    page: {
      type: 'profile',
      hero: {
        eyebrow: 'SELF BROADCAST',
        title: 'MARV · SIGNAL ENGINEER',
        subtitle: 'Designing narrative systems that feel recovered rather than delivered.',
        description:
          'Half designer, half audio tinkerer—currently fusing speculative fiction with responsive web installations.',
      },
      sections: [
        {
          title: 'Trajectory',
          body:
            'Former architectural researcher turned creative technologist. I build experiential tools that bend reality ever so slightly: responsive FM scanners, narrative hardware prototypes, and browser-based club environments.',
        },
        {
          title: 'Now',
          body:
            'Exploring how radio metaphors can structure digital archives. Prototyping multi-frequency storytelling, experimenting with local-first media stacks, and consulting on spatial web experiences for underground art collectives.',
        },
        {
          title: 'Operating Principles',
          body:
            'Design from evidence, even if fabricated. Make the seams visible. Let visitors feel like co-conspirators instead of passive viewers.',
        },
      ],
      contact: [
        {
          label: 'Email',
          value: 'hi@marv1nnnnn.com',
          href: 'mailto:hi@marv1nnnnn.com',
        },
        {
          label: 'GitHub',
          value: '@marv1nnnnn',
          href: 'https://github.com/marv1nnnnn',
        },
        {
          label: 'Are.na',
          value: 'Concrete Club Notebook',
          href: 'https://www.are.na/marv1nnnnn',
        },
        {
          label: 'Signal',
          value: 'marv1nnnnn',
        },
      ],
    },
  },
  {
    id: 'projects',
    freq: 94.5,
    title: 'ANOMALY REPORT: PROJECT ALPHA',
    pages: 4,
    audioUrl: '/audio/project-ambient.mp3',
    broadcastDate: '2025-09-28',
    location: 'SECTOR LAB 3',
    tags: ['SYSTEMS', 'BREAKAGE', 'RESEARCH'],
    summary:
      'Live lab feed documenting stress tests, machine whispers, and operator testimony from the ALPHA corridor.',
    accentColor: '#65E0FF',
    background: 'linear-gradient(145deg, #081C2B 0%, #65E0FF 52%, #111111 100%)',
    page: {
      type: 'cards',
      intro: {
        title: 'Project Archives & Current Progress',
      },
      cards: [
        {
          id: 'concrete-club-rotation',
          title: 'Concrete Club Rotation',
          subtitle: 'Popup broadcast lounge, fall 2025',
          date: '2025-09-18',
          summary:
            'Immersive FM lounge built with the scanner stack. Live VJ feed, reactive audio, and limited ingress tokens.',
          tags: ['installation', 'web audio', 'live'],
          markdown: `## Concrete Club Rotation

**Site**: Concrete Club Residency, Berlin — Satellite Warehouse B

**Status**: Soft-opened on 18 Sept 2025 with a 48hr broadcast cycle.

### Build Notes
- Re-skinned the scanner UI into a wall-sized projection; dial input mapped to a DJ MIDI wheel.
- Split the audio node graph so in-room speakers receive an overdriven mix, while the web stream keeps clarity intact.
- Implemented a token-gated ingress flow using Supabase edge functions; visitors collect a pass via NFC coins.

### Findings
- Attendees instinctively documented the wall output, creating loops of the loop. Works as intended.
- Need to harden the live markdown pipeline—editor latency hit 1.4s during peak traffic.

### Next
- Extend residency with remote takeovers.
- Publish a public dev log once the residency embargo lifts.
`,
        },
        {
          id: 'perimeter-synth',
          title: 'Perimeter Synth Toolkit',
          subtitle: 'Modular audio utilities',
          date: '2025-07-02',
          summary: 'A set of Web Audio primitives for spatial storytelling. Ships as drop-in hooks.',
          tags: ['library', 'open-source'],
          markdown: `## Perimeter Synth Toolkit

**GitHub**: marv1nnnnn/perimeter-synth

An open-source bundle of Web Audio utilities powering the scanner.

### Modules
- useSignalBus — abstracts audio routing between noise, ambient pads, and narration clips.
- SpectralEQ — lightweight multi-band EQ with smooth automation envelopes.
- HissCompressor — combination compressor/gate tuned for noisy inputs.

### Progress
- Released v0.4.0 with TypeScript types and storybook demos.
- Added compatibility tests for Safari 18 (thankfully stable).

### Roadmap
- Package three canonical presets.
- Record guided patching tutorials for collaborators.
`,
        },
        {
          id: 'frequency-journal',
          title: 'Frequency Journal CMS',
          subtitle: 'Local-first zine authoring',
          date: '2025-05-19',
          summary:
            'Desktop companion app that syncs markdown entries directly to the scanner feed through Git-based diffs.',
          tags: ['tooling', 'local-first'],
          markdown: `## Frequency Journal CMS

**Goal**: Author broadcasts offline, push when ready.

### Architecture
- Tauri desktop shell with a local SQLite cache.
- Markdown editor supports custom components (<TransmissionNote> blocks).
- Sync pipeline commits to a mirrored repository, then triggers the production redeploy via GitHub Actions.

### Current Progress
- Implemented diff preview with per-block change badges.
- Running closed beta with two writers; average sync takes 3.2s.

### Issues
- Need better conflict resolution when collaborating asynchronously.
- Investigating CRDT-backed text buffer as an alternative.
`,
        },
        {
          id: 'resurface',
          title: 'Resurface',
          subtitle: 'Speculative research capsule',
          date: '2024-12-11',
          summary:
            'A physical zine printed on heat-reactive paper that reveals annotations when warmed by touch.',
          tags: ['research', 'print'],
          markdown: `## Resurface

Collaboration with artist Mei An. We prototyped a material-driven storytelling device where annotations surface only when the reader is present.

### Highlights
- Embedded thermochromic ink for hidden diagrams.
- Paired with a minimal AR overlay accessible via the scanner frequencies.
- Editions sold out at the Winter Fault Lines fair in 36 hours.

### Reflection
- Reinforced the importance of tactility, even when the final experience lives online.
`,
        },
      ],
    },
  },
  {
    id: 'listening',
    freq: 101.2,
    title: 'RECOVERED TRANSMISSIONS',
    pages: 3,
    audioUrl: '/audio/log-ambient.mp3',
    broadcastDate: '2025-09-26',
    location: 'ORBITAL DOWNLINK',
    tags: ['ARCHIVE', 'NOISE POETRY', 'AFTERSHOCK'],
    summary:
      'Fragments from the deep archive—detuned voices, clipped coordinates, and spectral percussion stitched together.',
    accentColor: '#FF5C8A',
    background: 'linear-gradient(140deg, #2C002E 0%, #FF5C8A 48%, #0C0C0C 100%)',
    page: {
      type: 'list',
      intro: {
        title: 'Recent Listening & Reading Queue',
      },
      items: [
        { title: 'Drift: Art of Subsurface Cities', creator: 'Kate Ling', type: 'text', date: '2025-09-22' },
        { title: 'Porous Sleep', creator: 'Owls Rotation', type: 'album', date: '2025-09-15' },
        { title: 'Signal Commons', creator: 'Crystalline Futures', type: 'text', date: '2025-08-30' },
        { title: 'Scatterbeam', creator: 'Owls Rotation', type: 'album', date: '2025-09-10' },
        { title: 'Everything Everywhere All at Once', creator: 'Daniels', type: 'video', date: '2025-09-08' },
        { title: 'The Poetics of Space', creator: 'Gaston Bachelard', type: 'text', date: '2025-09-05' },
        { title: 'Invisible Cities', creator: 'Italo Calvino', type: 'text', date: '2025-08-28' },
        { title: 'Blade Runner 2049', creator: 'Denis Villeneuve', type: 'video', date: '2025-08-25' },
        { title: 'Music for Airports', creator: 'Brian Eno', type: 'album', date: '2025-08-20' },
        { title: 'In Rainbows', creator: 'Radiohead', type: 'album', date: '2025-08-15' },
        { title: 'The Mushroom at the End of the World', creator: 'Anna Tsing', type: 'text', date: '2025-08-12' },
        { title: 'Entanglements', creator: 'James Bridle', type: 'text', date: '2025-08-08' },
      ],
    },
  },
  {
    id: 'journal',
    freq: 107.8,
    title: 'COMMUNICATION PROTOCOLS',
    pages: 4,
    audioUrl: '/audio/contact-ambient.mp3',
    broadcastDate: '2025-09-24',
    location: 'FIELD RELAY',
    tags: ['SIGNAL', 'EMERGENCY', 'RESPONSE'],
    summary:
      'Encrypted call-and-response primer for initiating secure anomaly uplinks under hostile interference.',
    accentColor: '#9DFF6B',
    background: 'linear-gradient(160deg, #0A1F0D 0%, #9DFF6B 50%, #111111 100%)',
    page: {
      type: 'cards',
      intro: {
        title: 'Operator Diary',
      },
      cards: [
        {
          id: '2025-09-30',
          title: 'Edge Case: Slider Elasticity',
          subtitle: 'Dev Log',
          date: '2025-09-30',
          summary:
            'Tuned the easing on the dial to feel more analog. Documented the feedback loop that surfaced.',
          tags: ['dev', 'ux'],
          markdown: `## 30 Sept 2025 — Edge Case: Slider Elasticity

Spent the evening dialing in the feel of the vertical slider.

### Observations
- Realized the knob *needed* a slight overshoot when snapping onto a locked signal.
- Added a 120ms elastic easing which made the overdrive warning more noticeable.

### Next Steps
- Record a GIF for the changelog.
- Test on a trackpad to confirm the inertia still feels weighty.
`,
        },
        {
          id: '2025-09-21',
          title: 'Archive Import Pipeline',
          subtitle: 'Ops Note',
          date: '2025-09-21',
          summary:
            'Migrated the old Airtable entries into the markdown CMS. Logged what broke and what held.',
          tags: ['ops', 'content'],
          markdown: `## 21 Sept 2025 — Archive Import Pipeline

### Task
Consolidated the original Airtable inventory into the local-first journal app.

### Process
- Exported CSV snapshots, converted to front-matter markdown.
- Scripted a checksum to detect duplicate transmissions before syncing.

### Outcome
- 212 entries migrated.
- Only two checksum collisions (both fixed).
`,
        },
        {
          id: '2025-09-09',
          title: 'Ambient Session Log',
          subtitle: 'Sound Pass',
          date: '2025-09-09',
          summary:
            'Captured new mechanical drone layers for the 94.5 MHz channel using a contact mic rig.',
          tags: ['sound', 'session'],
          markdown: `## 9 Sept 2025 — Ambient Session Log

### Gear
- Teenage Engineering OP-1 Field
- DIY contact mic glued to a defunct radiator

### Result
- Four takes sampled, layered into the Project Alpha ambient track.
- Added a slow phaser sweep keyed to the clarity value.

### Reminder
- Build a reusable template for future capture sessions.
`,
        },
        {
          id: '2025-08-26',
          title: 'Client Handoff Debrief',
          subtitle: 'Reflection',
          date: '2025-08-26',
          summary:
            'Wrapped a bespoke signal console for a client. Documented the final handoff lessons.',
          tags: ['client', 'reflection'],
          markdown: `## 26 Aug 2025 — Client Handoff Debrief

### Context
Delivered a pared-down scanner build for a museum installation.

### Highlights
- Added an “exhibit mode” that cycles frequencies autonomously.
- Wrote a maintenance manual formatted as a radio script—client loved it.

### What to Improve
- Need clearer calibration guidance; the tech team requested a video follow-up.
`,
        },
      ],
    },
  },
];

export const FALLOFF_DISTANCE = 1.5; // MHz - distance for signal clarity falloff

export function getSignalById(id: string): Signal | null {
  return SIGNALS.find((signal) => signal.id === id) ?? null;
}

export function getSignalCard(signalId: string, cardId: string): {
  signal: Signal;
  card: SignalCardContent;
} | null {
  const signal = getSignalById(signalId);

  if (!signal || signal.page.type !== 'cards') {
    return null;
  }

  const card = signal.page.cards.find((entry) => entry.id === cardId);

  if (!card) {
    return null;
  }

  return { signal, card };
}

export function getAllSignalCards(): Array<{
  signalId: string;
  cardId: string;
}> {
  const params: Array<{ signalId: string; cardId: string }> = [];

  SIGNALS.forEach((signal) => {
    if (signal.page.type !== 'cards') {
      return;
    }

    signal.page.cards.forEach((card) => {
      params.push({ signalId: signal.id, cardId: card.id });
    });
  });

  return params;
}

export function findClosestSignal(
  frequency: number
): { signal: Signal | null; distance: number; clarity: number } {
  if (SIGNALS.length === 0) {
    return { signal: null, distance: Infinity, clarity: 0 };
  }

  let closestSignal = SIGNALS[0];
  let minDistance = Math.abs(frequency - SIGNALS[0].freq);

  for (let i = 1; i < SIGNALS.length; i++) {
    const distance = Math.abs(frequency - SIGNALS[i].freq);
    if (distance < minDistance) {
      minDistance = distance;
      closestSignal = SIGNALS[i];
    }
  }

  // Calculate clarity: 1.0 at exact frequency, 0.0 at FALLOFF_DISTANCE or beyond
  const clarity = Math.max(0, 1 - minDistance / FALLOFF_DISTANCE);

  return {
    signal: closestSignal,
    distance: minDistance,
    clarity,
  };
}

export function getSignalState(clarity: number): 'NOISE' | 'APPROACHING' | 'LOCKED_ON' {
  if (clarity >= 0.95) return 'LOCKED_ON';
  if (clarity >= 0.3) return 'APPROACHING';
  return 'NOISE';
}
