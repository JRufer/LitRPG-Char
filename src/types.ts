export interface Book {
  id: number;
  name: string;
  created_at: string;
}

export interface Character {
  id: number;
  book_id: number;
  name: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  count: number; // 1 - 255
}

export interface Spell {
  id: string;
  name: string;
  description: string;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
}

export interface Familiar {
  id: string;
  name: string;
  description: string;
  is_equipped: boolean;
}

export interface Equipment {
  right_hand: string;
  left_hand: string;
  head: string;
  armor: string;
  cloak: string;
  accessory: string;
}

export interface Chapter {
  id: number;
  character_id: number;
  chapter_number: number;
  title: string;
  notes: string;
  level: number;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  heart_current: number;
  heart_max: number;
  str: number;
  con: number;
  int: number;
  lck: number;
  exp: number;
  next_exp: number;
  gold: number;
  equipment: Equipment;
  inventory: InventoryItem[];
  spells: Spell[];
  relics: Relic[];
  familiars: Familiar[];
  created_at: string;
}

export interface InitialStatsPayload {
  level: number;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  heart_current: number;
  heart_max: number;
  str: number;
  con: number;
  int: number;
  lck: number;
  exp: number;
  gold: number;
  equipment: Equipment;
  inventory: InventoryItem[];
  spells: Spell[];
  relics: Relic[];
  familiars: Familiar[];
}

export interface CreateBookPayload {
  book_name: string;
  character_name: string;
  initial_stats: InitialStatsPayload;
}

export interface UpdateChapterPayload {
  chapter_id: number;
  title: string;
  notes: string;
  level: number;
  hp_current: number;
  hp_max: number;
  mp_current: number;
  mp_max: number;
  heart_current: number;
  heart_max: number;
  str: number;
  con: number;
  int: number;
  lck: number;
  exp: number;
  gold: number;
  equipment: Equipment;
  inventory: InventoryItem[];
  spells: Spell[];
  relics: Relic[];
  familiars: Familiar[];
}

export interface LevelUpPayload {
  chapter_id: number;
  add_levels: number;
  add_str: number;
  add_con: number;
  add_int: number;
  add_lck: number;
  add_hp_max: number;
  add_mp_max: number;
  add_heart_max: number;
  bonus_exp?: number;
}

export interface RippleResult {
  updated_chapter: Chapter;
  affected_subsequent_chapters: number;
  message: string;
}

export interface ExportData {
  app_version: string;
  exported_at: string;
  books: {
    book: Book;
    characters: {
      character: Character;
      chapters: Chapter[];
    }[];
  }[];
}
