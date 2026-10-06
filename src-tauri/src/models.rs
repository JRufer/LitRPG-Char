use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: i64,
    pub book_id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InventoryItem {
    pub id: String,
    pub name: String,
    pub count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Spell {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Relic {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Familiar {
    pub id: String,
    pub name: String,
    pub description: String,
    pub is_equipped: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
pub struct Equipment {
    pub right_hand: String,
    pub left_hand: String,
    pub head: String,
    pub armor: String,
    pub cloak: String,
    pub accessory: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: i64,
    pub character_id: i64,
    pub chapter_number: i32,
    pub title: String,
    pub notes: String,
    pub level: u32,
    pub hp_current: i32,
    pub hp_max: i32,
    pub mp_current: i32,
    pub mp_max: i32,
    pub heart_current: i32,
    pub heart_max: i32,
    pub str: i32,
    pub con: i32,
    #[serde(rename = "int")]
    pub int_stat: i32,
    pub lck: i32,
    pub exp: u64,
    pub next_exp: u64,
    pub gold: u64,
    pub equipment: Equipment,
    pub inventory: Vec<InventoryItem>,
    pub spells: Vec<Spell>,
    pub relics: Vec<Relic>,
    pub familiars: Vec<Familiar>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBookPayload {
    pub book_name: String,
    pub character_name: String,
    pub initial_stats: InitialStatsPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitialStatsPayload {
    pub level: u32,
    pub hp_current: i32,
    pub hp_max: i32,
    pub mp_current: i32,
    pub mp_max: i32,
    pub heart_current: i32,
    pub heart_max: i32,
    pub str: i32,
    pub con: i32,
    #[serde(rename = "int")]
    pub int_stat: i32,
    pub lck: i32,
    pub exp: u64,
    pub gold: u64,
    pub equipment: Equipment,
    pub inventory: Vec<InventoryItem>,
    pub spells: Vec<Spell>,
    pub relics: Vec<Relic>,
    pub familiars: Vec<Familiar>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateChapterPayload {
    pub chapter_id: i64,
    pub title: String,
    pub notes: String,
    pub level: u32,
    pub hp_current: i32,
    pub hp_max: i32,
    pub mp_current: i32,
    pub mp_max: i32,
    pub heart_current: i32,
    pub heart_max: i32,
    pub str: i32,
    pub con: i32,
    #[serde(rename = "int")]
    pub int_stat: i32,
    pub lck: i32,
    pub exp: u64,
    pub gold: u64,
    pub equipment: Equipment,
    pub inventory: Vec<InventoryItem>,
    pub spells: Vec<Spell>,
    pub relics: Vec<Relic>,
    pub familiars: Vec<Familiar>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LevelUpPayload {
    pub chapter_id: i64,
    pub add_levels: u32,
    pub add_str: i32,
    pub add_con: i32,
    #[serde(rename = "add_int")]
    pub add_int_stat: i32,
    pub add_lck: i32,
    pub add_hp_max: i32,
    pub add_mp_max: i32,
    pub add_heart_max: i32,
    pub bonus_exp: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RippleResult {
    pub updated_chapter: Chapter,
    pub affected_subsequent_chapters: usize,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportData {
    pub app_version: String,
    pub exported_at: String,
    pub books: Vec<ExportBookEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportBookEntry {
    pub book: Book,
    pub characters: Vec<ExportCharacterEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportCharacterEntry {
    pub character: Character,
    pub chapters: Vec<Chapter>,
}
