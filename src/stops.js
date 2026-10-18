// The journey, in order from nearest to farthest. Each stop is one woman's discovery.
// pos:      where the object sits in the 3D world (the journey heads toward -z)
// radius:   rough size, used for framing the camera and for pointing at it
// kind:     which builder in bodies.js draws it
// distance: the real distance, shown on screen
// story:    shown in full on the card; the voice reads the first two sentences
// photo:    her portrait (public/portraits), with a short credit shown under it

export const STOPS = [
  {
    id: 'earth',
    kind: 'earth',
    pos: [0, 0, 0],
    radius: 10,
    name: 'Earth',
    distance: 'Low Earth orbit, 400 km up',
    woman: 'Mae Jemison',
    photo: 'portraits/earth.jpg',
    photoCredit: "Photo: NASA",
    headline: 'First African American woman in space',
    story:
      "Mae Jemison is a doctor and engineer who became the first African American woman in space in 1992, flying aboard the Space Shuttle Endeavour. Before NASA, she served as a Peace Corps doctor in Sierra Leone and Liberia. Today she works to make space exploration and science more accessible to everyone.",
  },
  {
    id: 'moon',
    kind: 'moon',
    pos: [45, 8, -80],
    radius: 2.7,
    name: 'The Moon',
    distance: '384,000 km from Earth',
    woman: 'Katherine Johnson',
    photo: 'portraits/moon.jpg',
    photoCredit: "Photo: NASA, 1983",
    headline: 'Calculated the paths to space and the Moon',
    story:
      "Katherine Johnson was a NASA mathematician whose calculations helped send astronauts into orbit and to the Moon. Before John Glenn's 1962 orbital flight, he asked for her to personally check the computer's numbers. Her story was told in the film Hidden Figures, and she received the Presidential Medal of Freedom in 2015.",
  },
  {
    id: 'sun',
    kind: 'sun',
    pos: [-420, 60, 320], // behind and left of Earth, so Earth and the Moon show their day side
    radius: 60,
    name: 'The Sun',
    distance: '150 million km from Earth',
    woman: 'Cecilia Payne-Gaposchkin',
    photo: 'portraits/sun.jpg',
    photoCredit: "Photo: Smithsonian Institution / Science Service",
    headline: 'Discovered what stars are made of',
    story:
      "In 1925, Cecilia Payne-Gaposchkin discovered that stars, including our Sun, are made mostly of hydrogen and helium. A leading astronomer convinced her to downplay the result, but she was proven right a few years later. She went on to become the first woman to be a full professor at Harvard.",
  },
  {
    id: 'pluto',
    kind: 'pluto',
    pos: [200, -25, -1150],
    radius: 2.2,
    name: 'Pluto',
    distance: 'About 6 billion km from Earth',
    woman: 'Venetia Burney',
    photo: 'portraits/pluto.jpg',
    photoCredit: "Photo: J. Weston & Sons, about 1929",
    headline: 'Named Pluto at age 11',
    story:
      "When Pluto was discovered in 1930, 11-year-old Venetia Burney from England suggested naming it after the Roman god of the underworld. Her grandfather passed the idea to astronomers, and it was chosen. NASA's New Horizons spacecraft later carried a science instrument named after her.",
  },
  {
    id: 'comet',
    kind: 'comet',
    pos: [-160, 45, -1750],
    radius: 9,
    name: 'A comet',
    distance: 'Falling in from the icy edge of the Solar System',
    woman: 'Caroline Herschel',
    photo: 'portraits/comet.jpg',
    photoCredit: "Painting: Melchior Gommar Tieleman, 1829",
    headline: 'Comet hunter, first paid woman scientist',
    story:
      "Caroline Herschel discovered eight comets and several nebulae in the late 1700s. She was the first woman known to be paid a salary for scientific work. In 1828, she became the first woman awarded the Gold Medal of the Royal Astronomical Society.",
  },
  {
    id: 'stars',
    kind: 'stars',
    pos: [320, 60, -2700],
    radius: 38,
    name: 'The colors of stars',
    distance: 'The nearest stars: 4 light-years and beyond',
    woman: 'Annie Jump Cannon',
    photo: 'portraits/stars.jpg',
    photoCredit: "Photo: New York World-Telegram, 1922",
    headline: 'Sorted the stars by type',
    story:
      "Annie Jump Cannon developed the star classification system, O B A F G K M, that astronomers still use today. Working at Harvard Observatory, she classified around 350,000 stars, more than anyone in history. She did this while being mostly deaf, which never slowed her work.",
  },
  {
    id: 'horsehead',
    kind: 'nebula',
    pos: [-520, -40, -4200],
    radius: 230,
    name: 'Horsehead Nebula',
    distance: 'About 1,400 light-years away',
    woman: 'Williamina Fleming',
    photo: 'portraits/horsehead.jpg',
    photoCredit: "Photo: about 1890s, Harvard College Observatory",
    headline: 'Spotted the Horsehead Nebula',
    story:
      "Williamina Fleming was first hired at Harvard Observatory as a housekeeper and became one of its most important astronomers. In 1888, she spotted the Horsehead Nebula on a photographic plate. She cataloged over 10,000 stars and discovered dozens of nebulae and hundreds of variable stars.",
  },
  {
    id: 'pulsar',
    kind: 'pulsar',
    pos: [420, 110, -6200],
    radius: 30,
    name: 'A pulsar',
    distance: 'About 2,300 light-years away',
    woman: 'Jocelyn Bell Burnell',
    photo: 'portraits/pulsar.jpg',
    photoCredit: "Photo: Astronomical Institute, Czech Academy of Sciences (CC BY-SA 3.0)",
    headline: 'Discovered the first pulsar',
    story:
      "As a graduate student in 1967, Jocelyn Bell Burnell noticed a strange repeating signal in her telescope data, which turned out to be the first pulsar ever found. The 1974 Nobel Prize for the discovery went to her supervisor, not her. In 2018, she won a $3 million prize and donated all of it to help underrepresented students study physics.",
  },
  {
    id: 'andromeda',
    kind: 'andromeda',
    pos: [-1600, 300, -11500],
    radius: 1400,
    name: 'Andromeda Galaxy',
    distance: '2.5 million light-years away',
    woman: 'Henrietta Swan Leavitt',
    photo: 'portraits/andromeda.jpg',
    photoCredit: "Photo: early 1900s, photographer unknown",
    headline: 'Found a way to measure distances in space',
    story:
      "Henrietta Leavitt discovered that pulsing stars called Cepheids reveal their true brightness through how fast they pulse. This gave astronomers a way to measure huge distances in space. Edwin Hubble later used her discovery to prove that Andromeda is a separate galaxy, far beyond our own Milky Way.",
  },
  {
    id: 'spiral',
    kind: 'spiral',
    pos: [2600, -400, -21000],
    radius: 1800,
    name: 'A spiral galaxy',
    distance: 'Millions of light-years away, and beyond',
    woman: 'Vera Rubin',
    photo: 'portraits/spiral.jpg',
    photoCredit: "Photo: Mark Godfrey, courtesy AIP Emilio Segrè Visual Archives",
    headline: 'Found evidence for dark matter',
    story:
      "Vera Rubin measured how fast stars move around the centers of galaxies and found they move too fast to be explained by visible matter alone. Her work became key evidence for dark matter. In 1965, she became the first woman allowed to officially observe at Palomar Observatory, and a major new telescope observatory is now named after her.",
  },
];

// Where the Sun is, so planets are lit from the right side and the comet's tail points away from it.
export const SUN_POS = STOPS.find((s) => s.id === 'sun').pos;

// Where the closing constellation appears, past the last galaxy.
export const FINALE_POS = [0, 0, -34000];

// What gets read aloud for a stop: the first two sentences of her story (keeps a full run
// near 3 minutes), with her name first unless those sentences already open with it.
// Used by the game and by scripts/make-voice.py, so recordings match.
export function spokenText(stop) {
  const sentences = stop.story.match(/[^.!?]+[.!?]+(\s+|$)/g) ?? [stop.story];
  const spoken = sentences.slice(0, 2).join('').trim();
  const lastName = stop.woman.split(' ').pop();
  return spoken.slice(0, 70).includes(lastName) ? spoken : `${stop.woman}. ${spoken}`;
}
