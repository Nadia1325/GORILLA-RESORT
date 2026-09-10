export interface Room {
  numeral: string; // I, II, III, IV, V
  volcano: string; // MUHABURA, GAHINGA, SABYINYO, BISOKE, KARISIMBI
  meaning: string; // what the Kinyarwanda name means
  elevation: string; // peak elevation, for flavor
  image: string;
  price: number;
  currency: "USD";
  tier: "VIP" | "Standard";
  description: string;

  badge?: string;
}

export const rooms: Room[] = [
  {
    numeral: "I",
    volcano: "MUHABURA",
    meaning: '"The Guide" — tallest of the five, visible for miles',
    elevation: "4,127 m",
    image: "https://images.pexels.com/photos/9130978/pexels-photo-9130978.jpeg?auto=compress&cs=tinysrgb&w=1200",
    price: 350,
    currency: "USD",
    tier: "VIP",
    description:
      "A garden-facing room named for the peak that has guided travelers toward Musanze for generations.",
    badge: "KINGS ROOM",
  },
  {
    numeral: "II",
    volcano: "GAHINGA",
    meaning: '"A Little Pile of Stones" — the smallest, gentlest peak',
    elevation: "3,474 m",
    image:
      "/vip-room.jpeg",
    price: 200,
    currency: "USD",
    tier: "Standard",
    description:
      "Our coziest room, named after the smallest of the Virunga volcanoes — warm, unhurried, easy to love.",
    
  },
  {
    numeral: "III",
    volcano: "SABYINYO",
    meaning: '"Old Man\'s Teeth" — the oldest, jagged-peaked volcano',
    elevation: "3,669 m",
    image:
      "https://images.pexels.com/photos/30708768/pexels-photo-30708768.jpeg?auto=compress&cs=tinysrgb&w=1200",
    price: 200,
    currency: "USD",
    tier: "Standard",
    description:
      "Named for the range's oldest volcano and the slopes where our gorilla families are most often found.",
   
    badge: "Gorilla Zone View",
  },
  {
    numeral: "IV",
    volcano: "BISOKE",
    meaning: '"Rainy" — home to a crater lake at its summit',
    elevation: "3,711 m",
    image:
      "/vip-room.jpeg",
    price: 200,
    currency: "USD",
    tier: "Standard",
    description:
      "A bright, forest-facing room named for the volcano famous for the crater lake waiting at its summit.",
    
  },
  {
    numeral: "V",
    volcano: "KARISIMBI",
    meaning: '"White Shell" — the tallest peak in the Virunga range',
    elevation: "4,507 m",
    image:
      "https://images.pexels.com/photos/35258541/pexels-photo-35258541.jpeg?auto=compress&cs=tinysrgb&w=1200",
    price: 200,
    currency: "USD",
    tier: "Standard",
    description:
      "Our flagship suite, named for the highest of the eight Virunga volcanoes — the resort's grandest room.",
  
    badge: "Flagship Suite",
  },
];

export interface Experience {
  title: string;
  description: string;
  icon: "gorilla" | "monkey" | "drum" | "trail";
}

export const experiences: Experience[] = [
  {
    title: "Gorilla trekking in Volcanoes National Park",
    description:
      "A guided trek to spend a quiet hour with one of Rwanda's mountain gorilla families.",
    icon: "gorilla",
  },
  {
    title: "Golden monkey tracking",
    description:
      "Follow playful troops of golden monkeys through the bamboo forest on the lower slopes.",
    icon: "monkey",
  },
  {
    title: "Iby'Iwacu Cultural Village",
    description:
      "Drumming, dance and a former poacher's story, told a short drive from the resort.",
    icon: "drum",
  },
  {
    title: "Twin Lakes & Dian Fossey trail",
    description:
      "A gentler morning by Lake Burera and Lake Ruhondo, or a hike toward the Karisoke research site.",
    icon: "trail",
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "We were back from the Sabyinyo trek by early afternoon and the room still smelled like woodsmoke and eucalyptus. Best night's sleep of the whole trip.",
    name: "Diane K.",
    detail: "Stayed in Room III · SABYINYO",
  },
  {
    quote:
      "The team helped us sort our gorilla permits weeks in advance and had a driver waiting at Kigali airport. Nothing left to figure out on arrival.",
    name: "Thomas B.",
    detail: "Stayed in Room V · KARISIMBI",
  },
  {
    quote:
      "Waking up to Muhabura through the window, coffee on the porch, golden monkeys in the bamboo below — that's the whole reason to come to Musanze.",
    name: "Aline U.",
    detail: "Stayed in Room I · MUHABURA",
  },
];
