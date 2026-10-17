// Every object in the sky, and the woman behind its story.
// x / y: position on the wall, 0..1 (0,0 = top-left). Keep away from the edges,
// they're the hardest spots to reach. size: radius as a fraction of the shorter side.
// Edit names, positions and stories here.

export const OBJECTS = [
  {
    id: 'sun',
    type: 'sun',
    x: 0.14, y: 0.3, size: 0.085,
    name: 'The Sun',
    woman: 'Cecilia Payne-Gaposchkin',
    headline: 'Discovered what stars are made of',
    story:
      'In 1925, Cecilia Payne-Gaposchkin showed that stars like our Sun are made mostly of hydrogen and helium. ' +
      'Senior astronomers told her she must be wrong. A few years later they admitted she was right. ' +
      'Her thesis has been called one of the most brilliant in the history of astronomy.',
  },
  {
    id: 'moon',
    type: 'moon',
    x: 0.33, y: 0.72, size: 0.06,
    name: 'The Moon',
    woman: 'Katherine Johnson',
    headline: 'Calculated the paths to space and the Moon',
    story:
      'Katherine Johnson was a NASA mathematician. Before John Glenn orbited Earth in 1962, ' +
      'he asked for her to check the computer\'s numbers by hand. ' +
      'She later worked on the calculations for Apollo 11, the first mission to land people on the Moon.',
  },
  {
    id: 'earth',
    type: 'earth',
    x: 0.13, y: 0.72, size: 0.065,
    name: 'Earth from orbit',
    woman: 'Mae Jemison',
    headline: 'First African American woman in space',
    story:
      'In 1992, Mae Jemison flew aboard the Space Shuttle Endeavour and became the first African American woman in space. ' +
      'She is also a doctor and an engineer, and she spent her time in orbit running science experiments.',
  },
  {
    id: 'pluto',
    type: 'pluto',
    x: 0.88, y: 0.76, size: 0.04,
    name: 'Pluto',
    woman: 'Venetia Burney',
    headline: 'Named Pluto at age 11',
    story:
      'When Pluto was discovered in 1930, an eleven-year-old girl in England named Venetia Burney suggested its name, ' +
      'after the Roman god of the underworld. Her idea was passed on to the astronomers who found it, and they chose it.',
  },
  {
    id: 'comet',
    type: 'comet',
    x: 0.52, y: 0.18, size: 0.045,
    name: 'A comet',
    woman: 'Caroline Herschel',
    headline: 'Comet hunter and the first paid woman scientist',
    story:
      'Caroline Herschel discovered eight comets in the late 1700s, sweeping the night sky with her telescope. ' +
      'The King of England paid her a salary for her work, making her the first woman known to be paid as a scientist.',
  },
  {
    id: 'horsehead',
    type: 'nebula',
    x: 0.7, y: 0.5, size: 0.075,
    name: 'Horsehead Nebula',
    woman: 'Williamina Fleming',
    headline: 'Spotted the Horsehead Nebula',
    story:
      'Williamina Fleming started at Harvard Observatory as a maid, and became one of its leading astronomers. ' +
      'In 1888 she spotted the Horsehead Nebula on a glass photograph of the sky. ' +
      'She also catalogued more than ten thousand stars.',
  },
  {
    id: 'andromeda',
    type: 'andromeda',
    x: 0.86, y: 0.24, size: 0.08,
    name: 'Andromeda Galaxy',
    woman: 'Henrietta Swan Leavitt',
    headline: 'Found a way to measure distances in space',
    story:
      'Henrietta Swan Leavitt discovered that some flickering stars, called Cepheids, reveal how bright they really are. ' +
      'That let astronomers measure how far away they are. ' +
      'Using her discovery, Edwin Hubble showed that Andromeda is a whole separate galaxy, far beyond our own.',
  },
  {
    id: 'pulsar',
    type: 'pulsar',
    x: 0.35, y: 0.42, size: 0.045,
    name: 'A pulsar',
    woman: 'Jocelyn Bell Burnell',
    headline: 'Discovered the first pulsar',
    story:
      'In 1967, graduate student Jocelyn Bell Burnell noticed a strange, regular blip in her radio telescope data. ' +
      'It was the first pulsar ever found: a spinning dead star that flashes like a lighthouse. ' +
      'The Nobel Prize for the discovery went to her supervisor, not to her.',
  },
  {
    id: 'spiral',
    type: 'spiral',
    x: 0.55, y: 0.75, size: 0.08,
    name: 'A spiral galaxy',
    woman: 'Vera Rubin',
    headline: 'Found evidence for dark matter',
    story:
      'Vera Rubin measured how fast stars orbit inside galaxies. The outer stars were moving far too fast, ' +
      'as if held by mass that nobody could see. Her work became key evidence for dark matter, ' +
      'which makes up most of the matter in the universe.',
  },
  {
    id: 'stars',
    type: 'stars',
    x: 0.53, y: 0.46, size: 0.07,
    name: 'Star colors',
    woman: 'Annie Jump Cannon',
    headline: 'Sorted the stars by type',
    story:
      'Annie Jump Cannon classified around three hundred and fifty thousand stars by hand. ' +
      'She created the system astronomers still use today, sorting stars from hottest to coolest: O, B, A, F, G, K, M.',
  },
];
