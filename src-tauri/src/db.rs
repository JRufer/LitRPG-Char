use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use rusqlite::{params, Connection, Result};

use crate::exp::{self, MAX_LEVEL};
use crate::models::*;

pub struct DbState(pub Mutex<Connection>);

fn get_db_path() -> PathBuf {
    if let Some(mut dir) = dirs::data_dir() {
        dir.push("litrpg-char");
        let _ = fs::create_dir_all(&dir);
        dir.push("character_codex.db");
        dir
    } else {
        PathBuf::from("character_codex.db")
    }
}

pub fn init_database() -> Result<Connection> {
    let path = get_db_path();
    let conn = Connection::open(path)?;

    conn.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
            chapter_number INTEGER NOT NULL,
            title TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            level INTEGER NOT NULL DEFAULT 1,
            hp_current INTEGER NOT NULL DEFAULT 25,
            hp_max INTEGER NOT NULL DEFAULT 25,
            mp_current INTEGER NOT NULL DEFAULT 20,
            mp_max INTEGER NOT NULL DEFAULT 20,
            heart_current INTEGER NOT NULL DEFAULT 10,
            heart_max INTEGER NOT NULL DEFAULT 10,
            str INTEGER NOT NULL DEFAULT 10,
            con INTEGER NOT NULL DEFAULT 10,
            int INTEGER NOT NULL DEFAULT 10,
            lck INTEGER NOT NULL DEFAULT 10,
            exp INTEGER NOT NULL DEFAULT 0,
            next_exp INTEGER NOT NULL DEFAULT 100,
            gold INTEGER NOT NULL DEFAULT 0,
            right_hand TEXT NOT NULL DEFAULT '',
            left_hand TEXT NOT NULL DEFAULT '',
            head TEXT NOT NULL DEFAULT '',
            armor TEXT NOT NULL DEFAULT '',
            cloak TEXT NOT NULL DEFAULT '',
            accessory TEXT NOT NULL DEFAULT '',
            inventory_json TEXT NOT NULL DEFAULT '[]',
            spells_json TEXT NOT NULL DEFAULT '[]',
            relics_json TEXT NOT NULL DEFAULT '[]',
            familiars_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            UNIQUE(character_id, chapter_number)
        );
        "#,
    )?;

    Ok(conn)
}

fn now_iso() -> String {
    // Basic ISO timestamp approximation without heavy chrono dependency
    let dur = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", dur.as_secs())
}

pub fn list_books(conn: &Connection) -> Result<Vec<Book>> {
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM books ORDER BY id DESC")?;
    let books = stmt
        .query_map([], |row| {
            Ok(Book {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();
    Ok(books)
}

pub fn list_characters(conn: &Connection, book_id: i64) -> Result<Vec<Character>> {
    let mut stmt = conn.prepare("SELECT id, book_id, name, created_at FROM characters WHERE book_id = ? ORDER BY id ASC")?;
    let chars = stmt
        .query_map([book_id], |row| {
            Ok(Character {
                id: row.get(0)?,
                book_id: row.get(1)?,
                name: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();
    Ok(chars)
}

pub fn get_chapter_from_row(row: &rusqlite::Row) -> Result<Chapter> {
    let inv_str: String = row.get("inventory_json")?;
    let spells_str: String = row.get("spells_json")?;
    let relics_str: String = row.get("relics_json")?;
    let fam_str: String = row.get("familiars_json")?;

    let inventory: Vec<InventoryItem> = serde_json::from_str(&inv_str).unwrap_or_default();
    let spells: Vec<Spell> = serde_json::from_str(&spells_str).unwrap_or_default();
    let relics: Vec<Relic> = serde_json::from_str(&relics_str).unwrap_or_default();
    let familiars: Vec<Familiar> = serde_json::from_str(&fam_str).unwrap_or_default();

    let equipment = Equipment {
        right_hand: row.get("right_hand")?,
        left_hand: row.get("left_hand")?,
        head: row.get("head")?,
        armor: row.get("armor")?,
        cloak: row.get("cloak")?,
        accessory: row.get("accessory")?,
    };

    Ok(Chapter {
        id: row.get("id")?,
        character_id: row.get("character_id")?,
        chapter_number: row.get("chapter_number")?,
        title: row.get("title")?,
        notes: row.get("notes")?,
        level: row.get::<_, i64>("level")? as u32,
        hp_current: row.get("hp_current")?,
        hp_max: row.get("hp_max")?,
        mp_current: row.get("mp_current")?,
        mp_max: row.get("mp_max")?,
        heart_current: row.get("heart_current")?,
        heart_max: row.get("heart_max")?,
        str: row.get("str")?,
        con: row.get("con")?,
        int_stat: row.get("int")?,
        lck: row.get("lck")?,
        exp: row.get::<_, i64>("exp")? as u64,
        next_exp: row.get::<_, i64>("next_exp")? as u64,
        gold: row.get::<_, i64>("gold")? as u64,
        equipment,
        inventory,
        spells,
        relics,
        familiars,
        created_at: row.get("created_at")?,
    })
}

pub fn get_chapter(conn: &Connection, chapter_id: i64) -> Result<Chapter> {
    let mut stmt = conn.prepare("SELECT * FROM chapters WHERE id = ?")?;
    stmt.query_row([chapter_id], |row| get_chapter_from_row(row))
}

pub fn list_chapters(conn: &Connection, character_id: i64) -> Result<Vec<Chapter>> {
    let mut stmt = conn.prepare("SELECT * FROM chapters WHERE character_id = ? ORDER BY chapter_number ASC")?;
    let chaps = stmt
        .query_map([character_id], |row| get_chapter_from_row(row))?
        .filter_map(|r| r.ok())
        .collect();
    Ok(chaps)
}

pub fn create_book_with_character(conn: &mut Connection, payload: CreateBookPayload) -> Result<(Book, Character, Chapter)> {
    let tx = conn.transaction()?;

    let created_at = now_iso();
    tx.execute(
        "INSERT INTO books (name, created_at) VALUES (?, ?)",
        params![payload.book_name, created_at],
    )?;
    let book_id = tx.last_insert_rowid();

    tx.execute(
        "INSERT INTO characters (book_id, name, created_at) VALUES (?, ?, ?)",
        params![book_id, payload.character_name, created_at],
    )?;
    let character_id = tx.last_insert_rowid();

    let init = payload.initial_stats;
    let next_exp = exp::calculate_next_exp(init.level, init.exp);
    let inv_json = serde_json::to_string(&init.inventory).unwrap_or_else(|_| "[]".to_string());
    let spells_json = serde_json::to_string(&init.spells).unwrap_or_else(|_| "[]".to_string());
    let relics_json = serde_json::to_string(&init.relics).unwrap_or_else(|_| "[]".to_string());
    let fam_json = serde_json::to_string(&init.familiars).unwrap_or_else(|_| "[]".to_string());

    tx.execute(
        r#"
        INSERT INTO chapters (
            character_id, chapter_number, title, notes,
            level, hp_current, hp_max, mp_current, mp_max, heart_current, heart_max,
            str, con, int, lck, exp, next_exp, gold,
            right_hand, left_hand, head, armor, cloak, accessory,
            inventory_json, spells_json, relics_json, familiars_json, created_at
        ) VALUES (
            ?, 1, 'Chapter 1: The Beginning', '',
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
        )
        "#,
        params![
            character_id,
            init.level as i64,
            init.hp_current,
            init.hp_max,
            init.mp_current,
            init.mp_max,
            init.heart_current,
            init.heart_max,
            init.str,
            init.con,
            init.int_stat,
            init.lck,
            init.exp as i64,
            next_exp as i64,
            init.gold as i64,
            init.equipment.right_hand,
            init.equipment.left_hand,
            init.equipment.head,
            init.equipment.armor,
            init.equipment.cloak,
            init.equipment.accessory,
            inv_json,
            spells_json,
            relics_json,
            fam_json,
            created_at,
        ],
    )?;
    let chapter_id = tx.last_insert_rowid();

    let chapter = tx.query_row("SELECT * FROM chapters WHERE id = ?", [chapter_id], |row| {
        get_chapter_from_row(row)
    })?;

    tx.commit()?;

    let book = Book {
        id: book_id,
        name: payload.book_name,
        created_at: created_at.clone(),
    };
    let character = Character {
        id: character_id,
        book_id,
        name: payload.character_name,
        created_at,
    };

    Ok((book, character, chapter))
}

pub fn create_character(conn: &mut Connection, book_id: i64, character_name: String, init: InitialStatsPayload) -> Result<(Character, Chapter)> {
    let tx = conn.transaction()?;
    let created_at = now_iso();

    tx.execute(
        "INSERT INTO characters (book_id, name, created_at) VALUES (?, ?, ?)",
        params![book_id, character_name, created_at],
    )?;
    let character_id = tx.last_insert_rowid();

    let next_exp = exp::calculate_next_exp(init.level, init.exp);
    let inv_json = serde_json::to_string(&init.inventory).unwrap_or_else(|_| "[]".to_string());
    let spells_json = serde_json::to_string(&init.spells).unwrap_or_else(|_| "[]".to_string());
    let relics_json = serde_json::to_string(&init.relics).unwrap_or_else(|_| "[]".to_string());
    let fam_json = serde_json::to_string(&init.familiars).unwrap_or_else(|_| "[]".to_string());

    tx.execute(
        r#"
        INSERT INTO chapters (
            character_id, chapter_number, title, notes,
            level, hp_current, hp_max, mp_current, mp_max, heart_current, heart_max,
            str, con, int, lck, exp, next_exp, gold,
            right_hand, left_hand, head, armor, cloak, accessory,
            inventory_json, spells_json, relics_json, familiars_json, created_at
        ) VALUES (
            ?, 1, 'Chapter 1', '',
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
        )
        "#,
        params![
            character_id,
            init.level as i64,
            init.hp_current,
            init.hp_max,
            init.mp_current,
            init.mp_max,
            init.heart_current,
            init.heart_max,
            init.str,
            init.con,
            init.int_stat,
            init.lck,
            init.exp as i64,
            next_exp as i64,
            init.gold as i64,
            init.equipment.right_hand,
            init.equipment.left_hand,
            init.equipment.head,
            init.equipment.armor,
            init.equipment.cloak,
            init.equipment.accessory,
            inv_json,
            spells_json,
            relics_json,
            fam_json,
            created_at,
        ],
    )?;
    let chapter_id = tx.last_insert_rowid();

    let chapter = tx.query_row("SELECT * FROM chapters WHERE id = ?", [chapter_id], |row| {
        get_chapter_from_row(row)
    })?;

    tx.commit()?;

    let character = Character {
        id: character_id,
        book_id,
        name: character_name,
        created_at,
    };

    Ok((character, chapter))
}

pub fn add_chapter(conn: &mut Connection, character_id: i64) -> Result<Chapter> {
    let tx = conn.transaction()?;

    let prev = tx.query_row(
        "SELECT * FROM chapters WHERE character_id = ? ORDER BY chapter_number DESC LIMIT 1",
        [character_id],
        |row| get_chapter_from_row(row),
    )?;

    let new_chap_num = prev.chapter_number + 1;
    let new_title = format!("Chapter {}", new_chap_num);
    let created_at = now_iso();

    let inv_json = serde_json::to_string(&prev.inventory).unwrap_or_else(|_| "[]".to_string());
    let spells_json = serde_json::to_string(&prev.spells).unwrap_or_else(|_| "[]".to_string());
    let relics_json = serde_json::to_string(&prev.relics).unwrap_or_else(|_| "[]".to_string());
    let fam_json = serde_json::to_string(&prev.familiars).unwrap_or_else(|_| "[]".to_string());

    tx.execute(
        r#"
        INSERT INTO chapters (
            character_id, chapter_number, title, notes,
            level, hp_current, hp_max, mp_current, mp_max, heart_current, heart_max,
            str, con, int, lck, exp, next_exp, gold,
            right_hand, left_hand, head, armor, cloak, accessory,
            inventory_json, spells_json, relics_json, familiars_json, created_at
        ) VALUES (
            ?, ?, ?, '',
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
        )
        "#,
        params![
            character_id,
            new_chap_num,
            new_title,
            prev.level as i64,
            prev.hp_current,
            prev.hp_max,
            prev.mp_current,
            prev.mp_max,
            prev.heart_current,
            prev.heart_max,
            prev.str,
            prev.con,
            prev.int_stat,
            prev.lck,
            prev.exp as i64,
            prev.next_exp as i64,
            prev.gold as i64,
            prev.equipment.right_hand,
            prev.equipment.left_hand,
            prev.equipment.head,
            prev.equipment.armor,
            prev.equipment.cloak,
            prev.equipment.accessory,
            inv_json,
            spells_json,
            relics_json,
            fam_json,
            created_at,
        ],
    )?;
    let chapter_id = tx.last_insert_rowid();

    let new_chap = tx.query_row("SELECT * FROM chapters WHERE id = ?", [chapter_id], |row| {
        get_chapter_from_row(row)
    })?;

    tx.commit()?;
    Ok(new_chap)
}

pub fn delete_chapter(conn: &Connection, chapter_id: i64) -> Result<()> {
    conn.execute("DELETE FROM chapters WHERE id = ?", [chapter_id])?;
    Ok(())
}

pub fn delete_book(conn: &Connection, book_id: i64) -> Result<()> {
    conn.execute("DELETE FROM books WHERE id = ?", [book_id])?;
    Ok(())
}

pub fn rename_book(conn: &Connection, book_id: i64, new_name: String) -> Result<Book> {
    let clean_name = new_name.trim();
    conn.execute("UPDATE books SET name = ? WHERE id = ?", params![clean_name, book_id])?;
    let mut stmt = conn.prepare("SELECT id, name, created_at FROM books WHERE id = ?")?;
    let book = stmt.query_row([book_id], |row| {
        Ok(Book {
            id: row.get("id")?,
            name: row.get("name")?,
            created_at: row.get("created_at")?,
        })
    })?;
    Ok(book)
}

pub fn delete_character(conn: &Connection, character_id: i64) -> Result<()> {
    conn.execute("DELETE FROM characters WHERE id = ?", [character_id])?;
    Ok(())
}

pub fn rename_character(conn: &Connection, character_id: i64, new_name: String) -> Result<Character> {
    let clean_name = new_name.trim();
    conn.execute("UPDATE characters SET name = ? WHERE id = ?", params![clean_name, character_id])?;
    let mut stmt = conn.prepare("SELECT id, book_id, name, created_at FROM characters WHERE id = ?")?;
    let character = stmt.query_row([character_id], |row| {
        Ok(Character {
            id: row.get("id")?,
            book_id: row.get("book_id")?,
            name: row.get("name")?,
            created_at: row.get("created_at")?,
        })
    })?;
    Ok(character)
}

fn clamp_i32(val: i32, min: i32, max: i32) -> i32 {
    val.max(min).min(max)
}

fn clamp_u64(val: i64, min: u64, max: u64) -> u64 {
    if val < 0 {
        return min;
    }
    let u = val as u64;
    if u < min {
        min
    } else if u > max {
        max
    } else {
        u
    }
}

pub fn update_chapter_with_ripple(conn: &mut Connection, payload: UpdateChapterPayload) -> Result<RippleResult> {
    let tx = conn.transaction()?;

    let old_chapter = tx.query_row(
        "SELECT * FROM chapters WHERE id = ?",
        [payload.chapter_id],
        |row| get_chapter_from_row(row),
    )?;

    // Calculate deltas
    let delta_gold: i64 = (payload.gold as i64) - (old_chapter.gold as i64);
    let delta_hp_max: i32 = payload.hp_max - old_chapter.hp_max;
    let delta_mp_max: i32 = payload.mp_max - old_chapter.mp_max;
    let delta_heart_max: i32 = payload.heart_max - old_chapter.heart_max;
    let delta_str: i32 = payload.str - old_chapter.str;
    let delta_con: i32 = payload.con - old_chapter.con;
    let delta_int: i32 = payload.int_stat - old_chapter.int_stat;
    let delta_lck: i32 = payload.lck - old_chapter.lck;
    let delta_level: i64 = (payload.level as i64) - (old_chapter.level as i64);
    let delta_exp: i64 = (payload.exp as i64) - (old_chapter.exp as i64);

    let next_exp = exp::calculate_next_exp(payload.level, payload.exp);

    let inv_json = serde_json::to_string(&payload.inventory).unwrap_or_else(|_| "[]".to_string());
    let spells_json = serde_json::to_string(&payload.spells).unwrap_or_else(|_| "[]".to_string());
    let relics_json = serde_json::to_string(&payload.relics).unwrap_or_else(|_| "[]".to_string());
    let fam_json = serde_json::to_string(&payload.familiars).unwrap_or_else(|_| "[]".to_string());

    // Update target chapter
    tx.execute(
        r#"
        UPDATE chapters SET
            title = ?, notes = ?, level = ?,
            hp_current = ?, hp_max = ?, mp_current = ?, mp_max = ?, heart_current = ?, heart_max = ?,
            str = ?, con = ?, int = ?, lck = ?, exp = ?, next_exp = ?, gold = ?,
            right_hand = ?, left_hand = ?, head = ?, armor = ?, cloak = ?, accessory = ?,
            inventory_json = ?, spells_json = ?, relics_json = ?, familiars_json = ?
        WHERE id = ?
        "#,
        params![
            payload.title,
            payload.notes,
            payload.level as i64,
            payload.hp_current,
            payload.hp_max,
            payload.mp_current,
            payload.mp_max,
            payload.heart_current,
            payload.heart_max,
            payload.str,
            payload.con,
            payload.int_stat,
            payload.lck,
            payload.exp as i64,
            next_exp as i64,
            payload.gold as i64,
            payload.equipment.right_hand,
            payload.equipment.left_hand,
            payload.equipment.head,
            payload.equipment.armor,
            payload.equipment.cloak,
            payload.equipment.accessory,
            inv_json,
            spells_json,
            relics_json,
            fam_json,
            payload.chapter_id,
        ],
    )?;

    // Inventory item differences
    // Old items map: name -> count
    let mut old_inv_map = std::collections::HashMap::new();
    for it in &old_chapter.inventory {
        old_inv_map.insert(it.name.clone(), it.count);
    }
    let mut new_inv_map = std::collections::HashMap::new();
    for it in &payload.inventory {
        new_inv_map.insert(it.name.clone(), it.count);
    }

    // Equipment changes
    let eq_changed = payload.equipment != old_chapter.equipment;

    // Spells added/removed
    let old_spell_names: HashSet<String> = old_chapter.spells.iter().map(|s| s.name.trim().to_string()).collect();
    let new_spell_names: HashSet<String> = payload.spells.iter().map(|s| s.name.trim().to_string()).collect();
    let spells_added: Vec<Spell> = payload.spells.iter().filter(|s| !old_spell_names.contains(s.name.trim())).cloned().collect();
    let spells_removed_names: HashSet<String> = old_spell_names.difference(&new_spell_names).cloned().collect();

    // Relics added/removed
    let old_relic_names: HashSet<String> = old_chapter.relics.iter().map(|r| r.name.trim().to_string()).collect();
    let new_relic_names: HashSet<String> = payload.relics.iter().map(|r| r.name.trim().to_string()).collect();
    let relics_added: Vec<Relic> = payload.relics.iter().filter(|r| !old_relic_names.contains(r.name.trim())).cloned().collect();
    let relics_removed_names: HashSet<String> = old_relic_names.difference(&new_relic_names).cloned().collect();

    // Familiars added/removed
    let old_fam_names: HashSet<String> = old_chapter.familiars.iter().map(|f| f.name.trim().to_string()).collect();
    let new_fam_names: HashSet<String> = payload.familiars.iter().map(|f| f.name.trim().to_string()).collect();
    let fams_added: Vec<Familiar> = payload.familiars.iter().filter(|f| !old_fam_names.contains(f.name.trim())).cloned().collect();
    let fams_removed_names: HashSet<String> = old_fam_names.difference(&new_fam_names).cloned().collect();
    let equipped_fam_name = payload.familiars.iter().find(|f| f.is_equipped).map(|f| f.name.trim().to_string());
    let old_had_equipped = old_chapter.familiars.iter().any(|f| f.is_equipped);
    let new_has_equipped = payload.familiars.iter().any(|f| f.is_equipped);

    // Fetch subsequent chapters
    let mut subsequent_chapters = {
        let mut stmt = tx.prepare(
            "SELECT * FROM chapters WHERE character_id = ? AND chapter_number > ? ORDER BY chapter_number ASC",
        )?;
        let rows = stmt.query_map(params![old_chapter.character_id, old_chapter.chapter_number], |row| {
            get_chapter_from_row(row)
        })?;
        rows.filter_map(|r| r.ok()).collect::<Vec<Chapter>>()
    };

    let affected_count = subsequent_chapters.len();

    // Bubble up to all subsequent chapters
    for mut sub in subsequent_chapters.drain(..) {
        // Gold ripple (0..999,999)
        let sub_gold_new = clamp_u64((sub.gold as i64) + delta_gold, 0, 999_999);
        sub.gold = sub_gold_new;

        // Max HP / MP / Heart delta ripple (Current values are chapter-specific per User choice A2)
        sub.hp_max = clamp_i32(sub.hp_max + delta_hp_max, 1, 999_999);
        if sub.hp_current > sub.hp_max {
            sub.hp_current = sub.hp_max;
        }

        sub.mp_max = clamp_i32(sub.mp_max + delta_mp_max, 0, 999_999);
        if sub.mp_current > sub.mp_max {
            sub.mp_current = sub.mp_max;
        }

        sub.heart_max = clamp_i32(sub.heart_max + delta_heart_max, 0, 999_999);
        if sub.heart_current > sub.heart_max {
            sub.heart_current = sub.heart_max;
        }

        // Stats 0..255
        sub.str = clamp_i32(sub.str + delta_str, 0, 255);
        sub.con = clamp_i32(sub.con + delta_con, 0, 255);
        sub.int_stat = clamp_i32(sub.int_stat + delta_int, 0, 255);
        sub.lck = clamp_i32(sub.lck + delta_lck, 0, 255);

        // Level & EXP ripple
        let new_sub_lvl = clamp_u64((sub.level as i64) + delta_level, 1, MAX_LEVEL as u64) as u32;
        sub.level = new_sub_lvl;
        let new_sub_exp = clamp_u64((sub.exp as i64) + delta_exp, 0, u64::MAX);
        sub.exp = new_sub_exp;
        sub.next_exp = exp::calculate_next_exp(sub.level, sub.exp);

        // Equipment ripple
        if eq_changed {
            if payload.equipment.right_hand != old_chapter.equipment.right_hand && sub.equipment.right_hand == old_chapter.equipment.right_hand {
                sub.equipment.right_hand = payload.equipment.right_hand.clone();
            }
            if payload.equipment.left_hand != old_chapter.equipment.left_hand && sub.equipment.left_hand == old_chapter.equipment.left_hand {
                sub.equipment.left_hand = payload.equipment.left_hand.clone();
            }
            if payload.equipment.head != old_chapter.equipment.head && sub.equipment.head == old_chapter.equipment.head {
                sub.equipment.head = payload.equipment.head.clone();
            }
            if payload.equipment.armor != old_chapter.equipment.armor && sub.equipment.armor == old_chapter.equipment.armor {
                sub.equipment.armor = payload.equipment.armor.clone();
            }
            if payload.equipment.cloak != old_chapter.equipment.cloak && sub.equipment.cloak == old_chapter.equipment.cloak {
                sub.equipment.cloak = payload.equipment.cloak.clone();
            }
            if payload.equipment.accessory != old_chapter.equipment.accessory && sub.equipment.accessory == old_chapter.equipment.accessory {
                sub.equipment.accessory = payload.equipment.accessory.clone();
            }
        }

        // Inventory ripple
        // 1. Apply delta to existing items
        for (item_name, old_count) in &old_inv_map {
            if let Some(&new_count) = new_inv_map.get(item_name) {
                let delta = (new_count as i32) - (*old_count as i32);
                if delta != 0 {
                    if let Some(pos) = sub.inventory.iter().position(|it| &it.name == item_name) {
                        let new_sub_count = (sub.inventory[pos].count as i32 + delta).max(0).min(255) as u32;
                        if new_sub_count == 0 {
                            sub.inventory.remove(pos);
                        } else {
                            sub.inventory[pos].count = new_sub_count;
                        }
                    }
                }
            } else {
                // Item was removed in edited chapter
                if let Some(pos) = sub.inventory.iter().position(|it| &it.name == item_name) {
                    let new_sub_count = (sub.inventory[pos].count as i32 - *old_count as i32).max(0).min(255) as u32;
                    if new_sub_count == 0 {
                        sub.inventory.remove(pos);
                    } else {
                        sub.inventory[pos].count = new_sub_count;
                    }
                }
            }
        }
        // 2. Add brand-new items if space permits (max 255 listings)
        for (item_name, &count) in &new_inv_map {
            if !old_inv_map.contains_key(item_name) {
                if !sub.inventory.iter().any(|it| &it.name == item_name) && sub.inventory.len() < 255 {
                    sub.inventory.push(InventoryItem {
                        id: format!("inv_{}", now_iso()),
                        name: item_name.clone(),
                        count: count.min(255),
                    });
                }
            }
        }

        // Spells ripple
        sub.spells.retain(|s| !spells_removed_names.contains(s.name.trim()));
        for sp in &spells_added {
            if !sub.spells.iter().any(|s| s.name.trim() == sp.name.trim()) {
                sub.spells.push(sp.clone());
            }
        }
        for sp in &payload.spells {
            if let Some(sub_sp) = sub.spells.iter_mut().find(|s| s.name.trim() == sp.name.trim()) {
                sub_sp.description = sp.description.clone();
            }
        }

        // Relics ripple
        sub.relics.retain(|r| !relics_removed_names.contains(r.name.trim()));
        for rl in &relics_added {
            if !sub.relics.iter().any(|r| r.name.trim() == rl.name.trim()) {
                sub.relics.push(rl.clone());
            }
        }
        for rl in &payload.relics {
            if let Some(sub_rl) = sub.relics.iter_mut().find(|r| r.name.trim() == rl.name.trim()) {
                sub_rl.description = rl.description.clone();
            }
        }

        // Familiars ripple
        sub.familiars.retain(|f| !fams_removed_names.contains(f.name.trim()));
        for fm in &fams_added {
            if !sub.familiars.iter().any(|f| f.name.trim() == fm.name.trim()) {
                sub.familiars.push(fm.clone());
            }
        }
        for fm in &payload.familiars {
            if let Some(sub_fm) = sub.familiars.iter_mut().find(|f| f.name.trim() == fm.name.trim()) {
                sub_fm.description = fm.description.clone();
            }
        }
        // If an equipped familiar was selected, propagate equipped status; if unequipped, propagate unequipped
        if let Some(ref eq_name) = equipped_fam_name {
            for f in &mut sub.familiars {
                f.is_equipped = f.name.trim() == eq_name;
            }
        } else if old_had_equipped && !new_has_equipped {
            for f in &mut sub.familiars {
                f.is_equipped = false;
            }
        }

        // Serialize and update subsequent chapter
        let sub_inv_json = serde_json::to_string(&sub.inventory).unwrap_or_else(|_| "[]".to_string());
        let sub_spells_json = serde_json::to_string(&sub.spells).unwrap_or_else(|_| "[]".to_string());
        let sub_relics_json = serde_json::to_string(&sub.relics).unwrap_or_else(|_| "[]".to_string());
        let sub_fam_json = serde_json::to_string(&sub.familiars).unwrap_or_else(|_| "[]".to_string());

        tx.execute(
            r#"
            UPDATE chapters SET
                level = ?, hp_current = ?, hp_max = ?, mp_current = ?, mp_max = ?, heart_current = ?, heart_max = ?,
                str = ?, con = ?, int = ?, lck = ?, exp = ?, next_exp = ?, gold = ?,
                right_hand = ?, left_hand = ?, head = ?, armor = ?, cloak = ?, accessory = ?,
                inventory_json = ?, spells_json = ?, relics_json = ?, familiars_json = ?
            WHERE id = ?
            "#,
            params![
                sub.level as i64,
                sub.hp_current,
                sub.hp_max,
                sub.mp_current,
                sub.mp_max,
                sub.heart_current,
                sub.heart_max,
                sub.str,
                sub.con,
                sub.int_stat,
                sub.lck,
                sub.exp as i64,
                sub.next_exp as i64,
                sub.gold as i64,
                sub.equipment.right_hand,
                sub.equipment.left_hand,
                sub.equipment.head,
                sub.equipment.armor,
                sub.equipment.cloak,
                sub.equipment.accessory,
                sub_inv_json,
                sub_spells_json,
                sub_relics_json,
                sub_fam_json,
                sub.id,
            ],
        )?;
    }

    let updated_chapter = tx.query_row(
        "SELECT * FROM chapters WHERE id = ?",
        [payload.chapter_id],
        |row| get_chapter_from_row(row),
    )?;

    tx.commit()?;

    let msg = if affected_count > 0 {
        format!("Saved chapter. Changes bubbled up to {} subsequent chapters.", affected_count)
    } else {
        "Saved chapter successfully.".to_string()
    };

    Ok(RippleResult {
        updated_chapter,
        affected_subsequent_chapters: affected_count,
        message: msg,
    })
}

pub fn level_up_with_ripple(conn: &mut Connection, payload: LevelUpPayload) -> Result<RippleResult> {
    let cur = get_chapter(conn, payload.chapter_id)?;
    let new_level = (cur.level + payload.add_levels).min(MAX_LEVEL);

    // Get chart exp requirement for new level
    let chart_req = exp::get_exp_for_level(new_level);
    let mut new_exp = cur.exp.max(chart_req);
    if let Some(bonus) = payload.bonus_exp {
        new_exp += bonus;
    }

    let update_payload = UpdateChapterPayload {
        chapter_id: cur.id,
        title: cur.title,
        notes: cur.notes,
        level: new_level,
        hp_current: (cur.hp_current + payload.add_hp_max).min(cur.hp_max + payload.add_hp_max),
        hp_max: cur.hp_max + payload.add_hp_max,
        mp_current: (cur.mp_current + payload.add_mp_max).min(cur.mp_max + payload.add_mp_max),
        mp_max: cur.mp_max + payload.add_mp_max,
        heart_current: (cur.heart_current + payload.add_heart_max).min(cur.heart_max + payload.add_heart_max),
        heart_max: cur.heart_max + payload.add_heart_max,
        str: clamp_i32(cur.str + payload.add_str, 0, 255),
        con: clamp_i32(cur.con + payload.add_con, 0, 255),
        int_stat: clamp_i32(cur.int_stat + payload.add_int_stat, 0, 255),
        lck: clamp_i32(cur.lck + payload.add_lck, 0, 255),
        exp: new_exp,
        gold: cur.gold,
        equipment: cur.equipment,
        inventory: cur.inventory,
        spells: cur.spells,
        relics: cur.relics,
        familiars: cur.familiars,
    };

    update_chapter_with_ripple(conn, update_payload)
}

pub fn export_database_json(conn: &Connection) -> Result<ExportData> {
    let books = list_books(conn)?;
    let mut export_books = Vec::new();

    for b in books {
        let chars = list_characters(conn, b.id)?;
        let mut export_chars = Vec::new();
        for c in chars {
            let chaps = list_chapters(conn, c.id)?;
            export_chars.push(ExportCharacterEntry {
                character: c,
                chapters: chaps,
            });
        }
        export_books.push(ExportBookEntry {
            book: b,
            characters: export_chars,
        });
    }

    Ok(ExportData {
        app_version: "1.0.0".to_string(),
        exported_at: now_iso(),
        books: export_books,
    })
}

pub fn import_database_json(conn: &mut Connection, data: ExportData) -> Result<usize> {
    let tx = conn.transaction()?;
    let mut imported_chapters_count = 0;

    for book_entry in data.books {
        // Insert or ignore book
        let b = book_entry.book;
        let mut book_id: Option<i64> = tx
            .query_row("SELECT id FROM books WHERE name = ?", [&b.name], |r| r.get(0))
            .ok();

        if book_id.is_none() {
            tx.execute(
                "INSERT INTO books (name, created_at) VALUES (?, ?)",
                params![b.name, b.created_at],
            )?;
            book_id = Some(tx.last_insert_rowid());
        }

        let actual_book_id = book_id.unwrap();

        for char_entry in book_entry.characters {
            let c = char_entry.character;
            let mut char_id: Option<i64> = tx
                .query_row(
                    "SELECT id FROM characters WHERE book_id = ? AND name = ?",
                    params![actual_book_id, c.name],
                    |r| r.get(0),
                )
                .ok();

            if char_id.is_none() {
                tx.execute(
                    "INSERT INTO characters (book_id, name, created_at) VALUES (?, ?, ?)",
                    params![actual_book_id, c.name, c.created_at],
                )?;
                char_id = Some(tx.last_insert_rowid());
            }

            let actual_char_id = char_id.unwrap();

            for chap in char_entry.chapters {
                let inv_json = serde_json::to_string(&chap.inventory).unwrap_or_else(|_| "[]".to_string());
                let spells_json = serde_json::to_string(&chap.spells).unwrap_or_else(|_| "[]".to_string());
                let relics_json = serde_json::to_string(&chap.relics).unwrap_or_else(|_| "[]".to_string());
                let fam_json = serde_json::to_string(&chap.familiars).unwrap_or_else(|_| "[]".to_string());

                tx.execute(
                    r#"
                    INSERT OR REPLACE INTO chapters (
                        character_id, chapter_number, title, notes,
                        level, hp_current, hp_max, mp_current, mp_max, heart_current, heart_max,
                        str, con, int, lck, exp, next_exp, gold,
                        right_hand, left_hand, head, armor, cloak, accessory,
                        inventory_json, spells_json, relics_json, familiars_json, created_at
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?, ?,
                        ?, ?, ?, ?, ?
                    )
                    "#,
                    params![
                        actual_char_id,
                        chap.chapter_number,
                        chap.title,
                        chap.notes,
                        chap.level as i64,
                        chap.hp_current,
                        chap.hp_max,
                        chap.mp_current,
                        chap.mp_max,
                        chap.heart_current,
                        chap.heart_max,
                        chap.str,
                        chap.con,
                        chap.int_stat,
                        chap.lck,
                        chap.exp as i64,
                        chap.next_exp as i64,
                        chap.gold as i64,
                        chap.equipment.right_hand,
                        chap.equipment.left_hand,
                        chap.equipment.head,
                        chap.equipment.armor,
                        chap.equipment.cloak,
                        chap.equipment.accessory,
                        inv_json,
                        spells_json,
                        relics_json,
                        fam_json,
                        chap.created_at,
                    ],
                )?;
                imported_chapters_count += 1;
            }
        }
    }

    tx.commit()?;
    Ok(imported_chapters_count)
}
