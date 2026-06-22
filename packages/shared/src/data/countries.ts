import type { Gender } from '../types/enums.js';

/**
 * A supported country with culturally-matched name pools and economic profile.
 * Designed to be extended: add an entry to COUNTRIES and everything else
 * (creation dropdown, family generation, partner generation) picks it up.
 */
export interface CountryData {
  id: string;
  label: string;
  /** Demonym, e.g. "Egyptian". */
  nationality: string;
  flag: string;
  maleNames: string[];
  femaleNames: string[];
  surnames: string[];
  /** Starting cash band for a newborn's household context [min, max]. */
  startingCash: [number, number];
  /** Cost-of-living multiplier applied to expenses (1.0 = baseline). */
  costOfLiving: number;
}

export const COUNTRIES: CountryData[] = [
  {
    id: 'egypt', label: 'Egypt', nationality: 'Egyptian', flag: '🇪🇬',
    maleNames: ['Ahmed', 'Mohamed', 'Omar', 'Youssef', 'Karim', 'Mahmoud', 'Mostafa', 'Khaled', 'Tarek', 'Hassan', 'Amr', 'Ali'],
    femaleNames: ['Fatma', 'Mariam', 'Nour', 'Salma', 'Aya', 'Yasmin', 'Heba', 'Dina', 'Mona', 'Rana', 'Sara', 'Laila'],
    surnames: ['Hassan', 'Ali', 'Mahmoud', 'Ibrahim', 'El-Sayed', 'Abdel-Rahman', 'Farouk', 'Mansour', 'Saleh', 'Fahmy'],
    startingCash: [500, 3000], costOfLiving: 0.5,
  },
  {
    id: 'usa', label: 'United States', nationality: 'American', flag: '🇺🇸',
    maleNames: ['James', 'Michael', 'Ethan', 'William', 'Daniel', 'Noah', 'Liam', 'Benjamin', 'Mason', 'Logan', 'Jacob', 'Henry'],
    femaleNames: ['Emma', 'Olivia', 'Sophia', 'Ava', 'Isabella', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Ella', 'Grace', 'Chloe'],
    surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson'],
    startingCash: [1000, 6000], costOfLiving: 1.2,
  },
  {
    id: 'uk', label: 'United Kingdom', nationality: 'British', flag: '🇬🇧',
    maleNames: ['Oliver', 'Harry', 'George', 'Jack', 'Charlie', 'Thomas', 'Oscar', 'William', 'James', 'Henry', 'Leo', 'Arthur'],
    femaleNames: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Emily', 'Sophie', 'Grace', 'Lily', 'Freya', 'Charlotte', 'Poppy', 'Ella'],
    surnames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Evans', 'Thomas', 'Roberts', 'Walker'],
    startingCash: [1000, 5500], costOfLiving: 1.15,
  },
  {
    id: 'canada', label: 'Canada', nationality: 'Canadian', flag: '🇨🇦',
    maleNames: ['Liam', 'Noah', 'William', 'Benjamin', 'Lucas', 'Logan', 'Ethan', 'Jack', 'Nathan', 'Owen', 'Jacob', 'Hunter'],
    femaleNames: ['Emma', 'Olivia', 'Charlotte', 'Sophia', 'Ava', 'Chloe', 'Emily', 'Hannah', 'Léa', 'Zoey', 'Lily', 'Aria'],
    surnames: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'Macdonald', 'Gagnon', 'Taylor', 'Campbell'],
    startingCash: [1000, 5000], costOfLiving: 1.1,
  },
  {
    id: 'germany', label: 'Germany', nationality: 'German', flag: '🇩🇪',
    maleNames: ['Maximilian', 'Alexander', 'Paul', 'Leon', 'Lukas', 'Felix', 'Jonas', 'Elias', 'Noah', 'Ben', 'Finn', 'Luca'],
    femaleNames: ['Mia', 'Emma', 'Hannah', 'Sofia', 'Lena', 'Lea', 'Marie', 'Lina', 'Clara', 'Anna', 'Laura', 'Johanna'],
    surnames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer'],
    startingCash: [1500, 6000], costOfLiving: 1.1,
  },
  {
    id: 'france', label: 'France', nationality: 'French', flag: '🇫🇷',
    maleNames: ['Gabriel', 'Louis', 'Raphaël', 'Jules', 'Lucas', 'Adam', 'Hugo', 'Arthur', 'Nathan', 'Léo', 'Paul', 'Thomas'],
    femaleNames: ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Lina', 'Léa', 'Manon', 'Camille', 'Sarah', 'Inès', 'Juliette'],
    surnames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Laurent'],
    startingCash: [1200, 5500], costOfLiving: 1.1,
  },
  {
    id: 'italy', label: 'Italy', nationality: 'Italian', flag: '🇮🇹',
    maleNames: ['Leonardo', 'Francesco', 'Lorenzo', 'Alessandro', 'Andrea', 'Matteo', 'Gabriele', 'Tommaso', 'Riccardo', 'Edoardo', 'Marco', 'Giuseppe'],
    femaleNames: ['Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Greta', 'Martina', 'Chiara', 'Sara', 'Beatrice'],
    surnames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'],
    startingCash: [1000, 4500], costOfLiving: 1.0,
  },
  {
    id: 'spain', label: 'Spain', nationality: 'Spanish', flag: '🇪🇸',
    maleNames: ['Hugo', 'Martín', 'Lucas', 'Mateo', 'Leo', 'Daniel', 'Alejandro', 'Pablo', 'Manuel', 'Álvaro', 'Diego', 'Adrián'],
    femaleNames: ['Lucía', 'Sofía', 'Martina', 'María', 'Julia', 'Paula', 'Valeria', 'Daniela', 'Carla', 'Alba', 'Sara', 'Carmen'],
    surnames: ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz'],
    startingCash: [1000, 4500], costOfLiving: 0.95,
  },
  {
    id: 'turkey', label: 'Turkey', nationality: 'Turkish', flag: '🇹🇷',
    maleNames: ['Yusuf', 'Mustafa', 'Mehmet', 'Ahmet', 'Emir', 'Ali', 'Berat', 'Kerem', 'Eymen', 'Omer', 'Burak', 'Can'],
    femaleNames: ['Zeynep', 'Elif', 'Defne', 'Ecrin', 'Asel', 'Azra', 'Nehir', 'Ela', 'Hira', 'Eylül', 'Meryem', 'Yagmur'],
    surnames: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Arslan'],
    startingCash: [600, 3500], costOfLiving: 0.6,
  },
  {
    id: 'saudi', label: 'Saudi Arabia', nationality: 'Saudi', flag: '🇸🇦',
    maleNames: ['Mohammed', 'Abdullah', 'Faisal', 'Khalid', 'Sultan', 'Saud', 'Fahad', 'Nasser', 'Turki', 'Bandar', 'Saad', 'Majed'],
    femaleNames: ['Nora', 'Sara', 'Reem', 'Lujain', 'Haya', 'Aljohara', 'Maha', 'Latifa', 'Hessa', 'Munira', 'Amal', 'Wafa'],
    surnames: ['Al-Saud', 'Al-Rashid', 'Al-Qahtani', 'Al-Otaibi', 'Al-Ghamdi', 'Al-Harbi', 'Al-Dossari', 'Al-Shehri', 'Al-Mutairi', 'Al-Zahrani'],
    startingCash: [3000, 12000], costOfLiving: 0.9,
  },
  {
    id: 'uae', label: 'United Arab Emirates', nationality: 'Emirati', flag: '🇦🇪',
    maleNames: ['Rashid', 'Hamdan', 'Zayed', 'Khalifa', 'Saeed', 'Sultan', 'Majid', 'Mansour', 'Ahmed', 'Hamad', 'Omar', 'Saif'],
    femaleNames: ['Mariam', 'Fatima', 'Aisha', 'Shamma', 'Latifa', 'Hessa', 'Moza', 'Salama', 'Noura', 'Alia', 'Maitha', 'Reem'],
    surnames: ['Al-Maktoum', 'Al-Nahyan', 'Al-Qasimi', 'Al-Falasi', 'Al-Mazrouei', 'Al-Suwaidi', 'Al-Marri', 'Al-Hashimi', 'Al-Shamsi', 'Al-Ali'],
    startingCash: [4000, 15000], costOfLiving: 1.1,
  },
  {
    id: 'india', label: 'India', nationality: 'Indian', flag: '🇮🇳',
    maleNames: ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Reyansh', 'Krishna', 'Ishaan', 'Rohan', 'Kabir', 'Ananya', 'Rahul', 'Aryan'],
    femaleNames: ['Aanya', 'Diya', 'Saanvi', 'Aadhya', 'Ananya', 'Pari', 'Anika', 'Navya', 'Ira', 'Riya', 'Priya', 'Kavya'],
    surnames: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Das', 'Mehta'],
    startingCash: [300, 2500], costOfLiving: 0.4,
  },
  {
    id: 'china', label: 'China', nationality: 'Chinese', flag: '🇨🇳',
    maleNames: ['Wei', 'Hao', 'Jun', 'Lei', 'Ming', 'Yang', 'Bo', 'Chen', 'Feng', 'Jie', 'Tao', 'Kai'],
    femaleNames: ['Mei', 'Li', 'Fang', 'Yan', 'Xia', 'Jing', 'Hui', 'Na', 'Ying', 'Lan', 'Qing', 'Xin'],
    surnames: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou'],
    startingCash: [500, 4000], costOfLiving: 0.6,
  },
  {
    id: 'japan', label: 'Japan', nationality: 'Japanese', flag: '🇯🇵',
    maleNames: ['Haruto', 'Ren', 'Yuki', 'Sota', 'Yuto', 'Haruki', 'Riku', 'Souta', 'Kaito', 'Hinata', 'Yuma', 'Kenji'],
    femaleNames: ['Yui', 'Sakura', 'Hina', 'Aoi', 'Yuna', 'Mei', 'Ichika', 'Akari', 'Tsumugi', 'Rin', 'Hana', 'Mio'],
    surnames: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato'],
    startingCash: [1500, 6000], costOfLiving: 1.05,
  },
  {
    id: 'korea', label: 'South Korea', nationality: 'Korean', flag: '🇰🇷',
    maleNames: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ji-ho', 'Joon-woo', 'Hyun-woo', 'Ji-hoon', 'Eun-woo', 'Min-seok', 'Tae-yang', 'Sung-min', 'Jae-won'],
    femaleNames: ['Seo-yeon', 'Ha-eun', 'Ji-woo', 'Soo-ah', 'Ji-min', 'Ye-eun', 'Yu-na', 'Da-eun', 'Min-seo', 'Chae-won', 'Soo-jin', 'Hye-jin'],
    surnames: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim'],
    startingCash: [1500, 6000], costOfLiving: 1.0,
  },
  {
    id: 'brazil', label: 'Brazil', nationality: 'Brazilian', flag: '🇧🇷',
    maleNames: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi', 'Gabriel', 'Pedro', 'Lucas', 'Matheus', 'Rafael', 'João', 'Felipe'],
    femaleNames: ['Helena', 'Alice', 'Laura', 'Manuela', 'Valentina', 'Sophia', 'Isabella', 'Júlia', 'Heloísa', 'Luiza', 'Beatriz', 'Mariana'],
    surnames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Ferreira', 'Costa', 'Rodrigues', 'Almeida'],
    startingCash: [400, 3000], costOfLiving: 0.55,
  },
  {
    id: 'mexico', label: 'Mexico', nationality: 'Mexican', flag: '🇲🇽',
    maleNames: ['Santiago', 'Mateo', 'Sebastián', 'Leonardo', 'Matías', 'Emiliano', 'Diego', 'Miguel', 'Alejandro', 'José', 'Daniel', 'Carlos'],
    femaleNames: ['Sofía', 'Valentina', 'Regina', 'María', 'Ximena', 'Camila', 'Valeria', 'Renata', 'Victoria', 'Fernanda', 'Lucía', 'Daniela'],
    surnames: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Flores'],
    startingCash: [400, 3000], costOfLiving: 0.55,
  },
  {
    id: 'australia', label: 'Australia', nationality: 'Australian', flag: '🇦🇺',
    maleNames: ['Oliver', 'Noah', 'William', 'Jack', 'Leo', 'Lucas', 'Thomas', 'Henry', 'Charlie', 'Cooper', 'James', 'Mason'],
    femaleNames: ['Charlotte', 'Olivia', 'Amelia', 'Isla', 'Mia', 'Ava', 'Grace', 'Willow', 'Harper', 'Chloe', 'Ruby', 'Zoe'],
    surnames: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Nguyen', 'Walker', 'Harris', 'White'],
    startingCash: [1200, 5500], costOfLiving: 1.15,
  },
];

export const COUNTRY_REGISTRY: Map<string, CountryData> = new Map(COUNTRIES.map((c) => [c.id, c]));

export const DEFAULT_COUNTRY_ID = 'usa';

export function getCountry(id: string | null | undefined): CountryData | undefined {
  return id ? COUNTRY_REGISTRY.get(id) : undefined;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** A culturally-matched first name for a gender in a country. */
export function randomFirstName(countryId: string, gender: Gender): string {
  const c = COUNTRY_REGISTRY.get(countryId) ?? COUNTRY_REGISTRY.get(DEFAULT_COUNTRY_ID)!;
  return gender === 'male' ? pick(c.maleNames) : pick(c.femaleNames);
}

/** A culturally-matched surname for a country. */
export function randomSurname(countryId: string): string {
  const c = COUNTRY_REGISTRY.get(countryId) ?? COUNTRY_REGISTRY.get(DEFAULT_COUNTRY_ID)!;
  return pick(c.surnames);
}

export function nationalityOf(countryId: string | null | undefined): string {
  return getCountry(countryId)?.nationality ?? '';
}
