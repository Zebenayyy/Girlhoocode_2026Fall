// The journey, in order from nearest to farthest. Each stop is one woman's discovery.
// pos:      where the object sits in the 3D world (the journey heads toward -z)
// radius:   rough size, used for framing the camera and for pointing at it
// kind:     which builder in bodies.js draws it
// distance: the real distance, shown on screen
// story:    read aloud; keep it to ~30 words so a full run takes about 3 minutes

export const STOPS = [
  {
    id: 'earth',
    kind: 'earth',
    pos: [0, 0, 0],
    radius: 10,
    name: 'Earth',
    distance: 'Low Earth orbit, 400 km up',
    woman: 'Mae Jemison',
    headline: 'First African American woman in space',
    story:
      'In 1992, Mae Jemison saw this view from the Space Shuttle Endeavour. ' +
      'She was the first African American woman in space, and she is a doctor and an engineer too.',
  },
  {
    id: 'moon',
    kind: 'moon',
    pos: [45, 8, -80],
    radius: 2.7,
    name: 'The Moon',
    distance: '384,000 km from Earth',
    woman: 'Katherine Johnson',
    headline: 'Calculated the paths to space and the Moon',
    story:
      'Katherine Johnson\'s math guided astronauts. John Glenn asked her to check the computer\'s numbers before his flight, ' +
      'and she helped calculate the path of Apollo 11, the first Moon landing.',
  },
  {
    id: 'sun',
    kind: 'sun',
    pos: [-420, 60, 320], // behind and left of Earth, so Earth and the Moon show their day side
    radius: 60,
    name: 'The Sun',
    distance: '150 million km from Earth',
    woman: 'Cecilia Payne-Gaposchkin',
    headline: 'Discovered what stars are made of',
    story:
      'What is the Sun made of? In 1925, Cecilia Payne-Gaposchkin found the answer: mostly hydrogen and helium. ' +
      'Experts told her she was wrong. She was right.',
  },
  {
    id: 'pluto',
    kind: 'pluto',
    pos: [200, -25, -1150],
    radius: 2.2,
    name: 'Pluto',
    distance: 'About 6 billion km from Earth',
    woman: 'Venetia Burney',
    headline: 'Named Pluto at age 11',
    story:
      'When Pluto was discovered in 1930, an eleven-year-old girl in England named Venetia Burney suggested its name. ' +
      'The astronomers chose it, and it is still Pluto today.',
  },
  {
    id: 'comet',
    kind: 'comet',
    pos: [-160, 45, -1750],
    radius: 9,
    name: 'A comet',
    distance: 'Falling in from the icy edge of the Solar System',
    woman: 'Caroline Herschel',
    headline: 'Comet hunter, first paid woman scientist',
    story:
      'Caroline Herschel swept the night sky with her telescope and discovered eight comets. ' +
      'She became the first woman known to be paid to do science.',
  },
  {
    id: 'stars',
    kind: 'stars',
    pos: [320, 60, -2700],
    radius: 38,
    name: 'The colors of stars',
    distance: 'The nearest stars: 4 light-years and beyond',
    woman: 'Annie Jump Cannon',
    headline: 'Sorted the stars by type',
    story:
      'Annie Jump Cannon sorted hundreds of thousands of stars by hand, from hottest to coolest: ' +
      'O, B, A, F, G, K, M. Astronomers still use her system today.',
  },
  {
    id: 'horsehead',
    kind: 'nebula',
    pos: [-520, -40, -4200],
    radius: 230,
    name: 'Horsehead Nebula',
    distance: 'About 1,400 light-years away',
    woman: 'Williamina Fleming',
    headline: 'Spotted the Horsehead Nebula',
    story:
      'Williamina Fleming started at Harvard Observatory as a maid and became one of its top astronomers. ' +
      'In 1888 she spotted this dark horse\'s head on a photograph of the sky.',
  },
  {
    id: 'pulsar',
    kind: 'pulsar',
    pos: [420, 110, -6200],
    radius: 30,
    name: 'A pulsar',
    distance: 'About 2,300 light-years away',
    woman: 'Jocelyn Bell Burnell',
    headline: 'Discovered the first pulsar',
    story:
      'In 1967, student Jocelyn Bell Burnell noticed a tiny repeating blip in her data. ' +
      'It was the first pulsar: a dead star spinning like a lighthouse. The Nobel Prize went to her supervisor.',
  },
  {
    id: 'andromeda',
    kind: 'andromeda',
    pos: [-1600, 300, -11500],
    radius: 1400,
    name: 'Andromeda Galaxy',
    distance: '2.5 million light-years away',
    woman: 'Henrietta Swan Leavitt',
    headline: 'Found a way to measure distances in space',
    story:
      'Henrietta Leavitt discovered that some blinking stars reveal their true brightness, a way to measure distance. ' +
      'With it, astronomers proved Andromeda is a whole other galaxy.',
  },
  {
    id: 'spiral',
    kind: 'spiral',
    pos: [2600, -400, -21000],
    radius: 1800,
    name: 'A spiral galaxy',
    distance: 'Millions of light-years away, and beyond',
    woman: 'Vera Rubin',
    headline: 'Found evidence for dark matter',
    story:
      'Vera Rubin measured how fast stars circle their galaxies. They moved too fast, as if pulled by something invisible. ' +
      'Her work became key evidence for dark matter.',
  },
];

// Where the Sun is, so planets are lit from the right side and the comet's tail points away from it.
export const SUN_POS = STOPS.find((s) => s.id === 'sun').pos;

// Where the closing constellation appears, past the last galaxy.
export const FINALE_POS = [0, 0, -34000];
