// Facts for the solar-system explorer. Plain data (no three.js) so scripts/make-voice.py
// can read it too and record each one with the same voice as the journey.

export const PLANET_FACTS = {
  Mercury: {
    facts: ['A year on Mercury lasts 88 Earth days.', 'Mercury has no moons.'],
    source: 'https://science.nasa.gov/mercury/facts/',
  },
  Venus: {
    facts: ['Venus is the hottest planet in our solar system.', 'It rotates in the opposite direction from most planets.'],
    source: 'https://science.nasa.gov/venus/venus-facts/',
  },
  Earth: {
    facts: ['Earth is the only world known to host life.', 'It is the only planet in our solar system with liquid water on its surface.'],
    source: 'https://science.nasa.gov/earth/facts/',
  },
  Mars: {
    facts: ['Mars gets its red color from iron minerals that have rusted.', 'It has two small moons: Phobos and Deimos.'],
    source: 'https://science.nasa.gov/mars/facts/',
  },
  Jupiter: {
    facts: ['Jupiter is the largest planet in our solar system.', 'Its Great Red Spot is a storm larger than Earth.'],
    source: 'https://science.nasa.gov/jupiter/jupiter-facts/',
  },
  Saturn: {
    facts: ['Saturn’s rings are made mostly of pieces of ice and rock.', 'A day on Saturn lasts about 10.7 hours.'],
    source: 'https://science.nasa.gov/saturn/facts/',
  },
  Uranus: {
    facts: ['Uranus rotates at a tilt of about 98 degrees, appearing to spin on its side.', 'It takes about 84 Earth years to orbit the Sun.'],
    source: 'https://science.nasa.gov/uranus/facts/',
  },
  Neptune: {
    facts: ['Neptune takes about 165 Earth years to orbit the Sun.', 'It has supersonic winds.'],
    source: 'https://science.nasa.gov/neptune/neptune-facts/',
  },
};

export const MISSION_FACTS = {
  Perseverance: {
    facts: ['NASA’s rover landed on Mars on Feb. 18, 2021.', 'It is exploring an ancient lakebed and collecting rock samples.'],
    source: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
  },
  Cassini: {
    facts: ['Cassini studied Saturn and its moons from orbit for 13 years.', 'Its Huygens probe landed on Saturn’s moon Titan in 2005.'],
    source: 'https://science.nasa.gov/mission/cassini/',
  },
  'Voyager 1': {
    facts: ['Voyager 1 entered interstellar space in 2012.', 'It launched in 1977 and is the most distant human-made object.'],
    source: 'https://science.nasa.gov/mission/voyager/',
  },
};

// File name for a planet's or mission's recording: "Voyager 1" -> "voyager-1"
export const audioId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

// What gets read aloud, e.g. "Mars. Mars gets its red color from iron minerals…"
export const narrationFor = (name, details) => `${name}. ${details.facts.join(' ')}`;

// Every line to record: [{ id, text }]
export function solarNarrations() {
  return Object.entries({ ...PLANET_FACTS, ...MISSION_FACTS }).map(([name, details]) => ({
    id: audioId(name),
    text: narrationFor(name, details),
  }));
}
