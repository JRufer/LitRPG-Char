use litrpg_codex_lib::db::*;
use litrpg_codex_lib::exp::*;
use litrpg_codex_lib::models::*;
use rusqlite::Connection;

fn setup_test_db() -> Connection {
    let conn = Connection::open_in_memory().expect("open in-memory db");
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
    ).expect("tables created");
    conn
}

#[test]
fn test_sotn_exp_curve() {
    assert_eq!(get_exp_for_level(1), 0);
    assert_eq!(get_exp_for_level(2), 100);
    assert_eq!(get_exp_for_level(3), 250);
    assert_eq!(get_exp_for_level(4), 450);
    assert_eq!(get_exp_for_level(99), 999999);
    assert_eq!(get_exp_for_level(100), 1020499);
    assert_eq!(get_exp_for_level(300), 15170499);

    // Check NEXT calculation
    // Level 1, 0 EXP -> next level (2) requires 100 -> next_exp = 100
    assert_eq!(calculate_next_exp(1, 0), 100);
    // Level 1, 50 EXP -> next level (2) requires 100 -> next_exp = 50
    assert_eq!(calculate_next_exp(1, 50), 50);
    // Level 1, 100 EXP -> next_exp = 0
    assert_eq!(calculate_next_exp(1, 100), 0);
    // Level 300 (Max) -> next_exp = 0
    assert_eq!(calculate_next_exp(300, 15170499), 0);
}

#[test]
fn test_create_book_and_ripple_gold() {
    let mut conn = setup_test_db();

    let payload = CreateBookPayload {
        book_name: "Defiance of the Fall".to_string(),
        character_name: "Zac".to_string(),
        initial_stats: InitialStatsPayload {
          level: 1,
          hp_current: 25,
          hp_max: 25,
          mp_current: 20,
          mp_max: 20,
          heart_current: 10,
          heart_max: 10,
          str: 15,
          con: 14,
          int_stat: 8,
          lck: 12,
          exp: 0,
          gold: 200,
          equipment: Equipment {
              right_hand: "Hatchet".to_string(),
              ..Default::default()
          },
          inventory: vec![
              InventoryItem {
                  id: "1".to_string(),
                  name: "Healing Pill".to_string(),
                  count: 5,
              }
          ],
          spells: vec![],
          relics: vec![],
          familiars: vec![],
        },
    };

    let (_book, char, chap1) = create_book_with_character(&mut conn, payload).expect("create book");
    assert_eq!(chap1.chapter_number, 1);
    assert_eq!(chap1.gold, 200);

    // Create Chapter 2
    let chap2 = add_chapter(&mut conn, char.id).expect("add chapter 2");
    assert_eq!(chap2.chapter_number, 2);
    assert_eq!(chap2.gold, 200);

    // Create Chapter 3
    let chap3 = add_chapter(&mut conn, char.id).expect("add chapter 3");
    assert_eq!(chap3.chapter_number, 3);
    assert_eq!(chap3.gold, 200);

    // Now user goes back to Chapter 1 and changes gold from 200 to 190 (-10 delta)
    let update_payload = UpdateChapterPayload {
        chapter_id: chap1.id,
        title: chap1.title,
        notes: chap1.notes,
        level: chap1.level,
        hp_current: chap1.hp_current,
        hp_max: chap1.hp_max,
        mp_current: chap1.mp_current,
        mp_max: chap1.mp_max,
        heart_current: chap1.heart_current,
        heart_max: chap1.heart_max,
        str: chap1.str,
        con: chap1.con,
        int_stat: chap1.int_stat,
        lck: chap1.lck,
        exp: chap1.exp,
        gold: 190, // changed -10
        equipment: chap1.equipment,
        inventory: chap1.inventory,
        spells: chap1.spells,
        relics: chap1.relics,
        familiars: chap1.familiars,
    };

    let ripple_res = update_chapter_with_ripple(&mut conn, update_payload).expect("ripple update");
    assert_eq!(ripple_res.affected_subsequent_chapters, 2);

    // Check Chapter 2 and 3 gold: must both be 190!
    let chap2_refreshed = get_chapter(&conn, chap2.id).expect("get chap 2");
    assert_eq!(chap2_refreshed.gold, 190);

    let chap3_refreshed = get_chapter(&conn, chap3.id).expect("get chap 3");
    assert_eq!(chap3_refreshed.gold, 190);
}

#[test]
fn test_level_up_and_ripple_stats() {
    let mut conn = setup_test_db();

    let payload = CreateBookPayload {
        book_name: "Primal Hunter".to_string(),
        character_name: "Jake".to_string(),
        initial_stats: InitialStatsPayload {
          level: 1,
          hp_current: 25,
          hp_max: 25,
          mp_current: 20,
          mp_max: 20,
          heart_current: 10,
          heart_max: 10,
          str: 10,
          con: 10,
          int_stat: 10,
          lck: 10,
          exp: 0,
          gold: 50,
          equipment: Equipment::default(),
          inventory: vec![],
          spells: vec![],
          relics: vec![],
          familiars: vec![],
        },
    };

    let (_book, char, chap1) = create_book_with_character(&mut conn, payload).expect("create book");
    let chap2 = add_chapter(&mut conn, char.id).expect("add chapter 2");

    // Level up in Chapter 1: +1 level, +5 STR, +3 CON
    let lvl_up_res = level_up_with_ripple(&mut conn, LevelUpPayload {
        chapter_id: chap1.id,
        add_levels: 1,
        add_str: 5,
        add_con: 3,
        add_int_stat: 0,
        add_lck: 0,
        add_hp_max: 10,
        add_mp_max: 5,
        add_heart_max: 2,
        bonus_exp: None,
    }).expect("level up");

    assert_eq!(lvl_up_res.updated_chapter.level, 2);
    assert_eq!(lvl_up_res.updated_chapter.str, 15);
    assert_eq!(lvl_up_res.updated_chapter.con, 13);
    assert_eq!(lvl_up_res.updated_chapter.hp_max, 35);
    assert_eq!(lvl_up_res.updated_chapter.exp, 100); // Level 2 requires 100 EXP
    assert_eq!(lvl_up_res.updated_chapter.next_exp, 150); // Level 3 requires 250 -> 250 - 100 = 150

    // Verify Chapter 2 was rippled forward!
    let chap2_refreshed = get_chapter(&conn, chap2.id).expect("get chap 2");
    assert_eq!(chap2_refreshed.level, 2);
    assert_eq!(chap2_refreshed.str, 15);
    assert_eq!(chap2_refreshed.con, 13);
    assert_eq!(chap2_refreshed.hp_max, 35);
    assert_eq!(chap2_refreshed.exp, 100);
}

#[test]
fn test_inventory_and_equipment_ripple() {
    let mut conn = setup_test_db();

    let payload = CreateBookPayload {
        book_name: "Dungeon Crawler Carl".to_string(),
        character_name: "Carl".to_string(),
        initial_stats: InitialStatsPayload {
            level: 1,
            hp_current: 30,
            hp_max: 30,
            mp_current: 10,
            mp_max: 10,
            heart_current: 5,
            heart_max: 5,
            str: 16,
            con: 14,
            int_stat: 10,
            lck: 9,
            exp: 0,
            gold: 50,
            equipment: Equipment {
                right_hand: "Spiked Bat".to_string(),
                ..Default::default()
            },
            inventory: vec![
                InventoryItem {
                    id: "1".to_string(),
                    name: "Explosive Arrow".to_string(),
                    count: 10,
                },
            ],
            spells: vec![],
            relics: vec![],
            familiars: vec![],
        },
    };

    let (_book, char, chap1) = create_book_with_character(&mut conn, payload).expect("create book");
    let chap2 = add_chapter(&mut conn, char.id).expect("add chapter 2");

    // In chapter 1, Carl reduces arrows from 10 to 6 (-4) and adds Goblin Bomb x2
    let mut updated_inv = chap1.inventory.clone();
    updated_inv[0].count = 6;
    updated_inv.push(InventoryItem {
        id: "2".to_string(),
        name: "Goblin Bomb".to_string(),
        count: 2,
    });

    let update_res = update_chapter_with_ripple(&mut conn, UpdateChapterPayload {
        chapter_id: chap1.id,
        title: chap1.title,
        notes: chap1.notes,
        level: chap1.level,
        hp_current: chap1.hp_current,
        hp_max: chap1.hp_max,
        mp_current: chap1.mp_current,
        mp_max: chap1.mp_max,
        heart_current: chap1.heart_current,
        heart_max: chap1.heart_max,
        str: chap1.str,
        con: chap1.con,
        int_stat: chap1.int_stat,
        lck: chap1.lck,
        exp: chap1.exp,
        gold: chap1.gold,
        equipment: chap1.equipment,
        inventory: updated_inv,
        spells: vec![Spell { id: "s1".to_string(), name: "Firebolt".to_string(), description: "Burns foes".to_string() }],
        relics: vec![],
        familiars: vec![Familiar { id: "f1".to_string(), name: "Princess Donut".to_string(), description: "Cat".to_string(), is_equipped: true }],
    }).expect("update chapter with ripple");

    assert_eq!(update_res.affected_subsequent_chapters, 1);

    let chap2_refreshed = get_chapter(&conn, chap2.id).expect("get chap 2");
    // Arrow count in chap 2 must now be 6 (reduced by 4)
    let arrows = chap2_refreshed.inventory.iter().find(|i| i.name == "Explosive Arrow").unwrap();
    assert_eq!(arrows.count, 6);

    // Goblin Bomb must have rippled forward into chap 2
    let bombs = chap2_refreshed.inventory.iter().find(|i| i.name == "Goblin Bomb").unwrap();
    assert_eq!(bombs.count, 2);

    // Firebolt spell must have rippled forward
    assert_eq!(chap2_refreshed.spells.len(), 1);
    assert_eq!(chap2_refreshed.spells[0].name, "Firebolt");

    // Familiar must have rippled forward and be equipped
    assert_eq!(chap2_refreshed.familiars.len(), 1);
    assert_eq!(chap2_refreshed.familiars[0].name, "Princess Donut");
    assert!(chap2_refreshed.familiars[0].is_equipped);
}

#[test]
fn test_export_and_import() {
    let mut conn = setup_test_db();

    let payload = CreateBookPayload {
        book_name: "Cradle".to_string(),
        character_name: "Lindon".to_string(),
        initial_stats: InitialStatsPayload {
            level: 1,
            hp_current: 20,
            hp_max: 20,
            mp_current: 30,
            mp_max: 30,
            heart_current: 10,
            heart_max: 10,
            str: 8,
            con: 10,
            int_stat: 12,
            lck: 5,
            exp: 0,
            gold: 0,
            equipment: Equipment::default(),
            inventory: vec![],
            spells: vec![],
            relics: vec![],
            familiars: vec![],
        },
    };

    create_book_with_character(&mut conn, payload).expect("create cradle");

    // Export database
    let export_data = export_database_json(&conn).expect("export json");
    assert_eq!(export_data.books.len(), 1);
    assert_eq!(export_data.books[0].book.name, "Cradle");

    // Import into fresh database
    let mut fresh_conn = setup_test_db();
    let imported_count = import_database_json(&mut fresh_conn, export_data).expect("import json");
    assert_eq!(imported_count, 1);

    let books = list_books(&fresh_conn).expect("list books");
    assert_eq!(books.len(), 1);
    assert_eq!(books[0].name, "Cradle");
}

#[test]
fn test_rename_character_and_book() {
    let mut conn = setup_test_db();
    let payload = CreateBookPayload {
        book_name: "Original Book".to_string(),
        character_name: "Original Character".to_string(),
        initial_stats: InitialStatsPayload {
            level: 1,
            hp_current: 25,
            hp_max: 25,
            mp_current: 20,
            mp_max: 20,
            heart_current: 10,
            heart_max: 10,
            str: 10,
            con: 10,
            int_stat: 10,
            lck: 10,
            exp: 0,
            gold: 0,
            equipment: Equipment::default(),
            inventory: vec![],
            spells: vec![],
            relics: vec![],
            familiars: vec![],
        },
    };

    let (book, character, _) = create_book_with_character(&mut conn, payload).expect("create book");
    assert_eq!(character.name, "Original Character");
    assert_eq!(book.name, "Original Book");

    // Rename character
    let renamed_char = rename_character(&conn, character.id, "Renamed Protagonist".to_string()).expect("rename char");
    assert_eq!(renamed_char.name, "Renamed Protagonist");

    let chars = list_characters(&conn, book.id).expect("list chars");
    assert_eq!(chars[0].name, "Renamed Protagonist");

    // Rename book
    let renamed_book = rename_book(&conn, book.id, "Renamed Chronicle".to_string()).expect("rename book");
    assert_eq!(renamed_book.name, "Renamed Chronicle");

    let books = list_books(&conn).expect("list books");
    assert_eq!(books[0].name, "Renamed Chronicle");
}

#[test]
fn test_familiar_multi_chapter_add_and_remove_ripple() {
    let mut conn = setup_test_db();
    let payload = CreateBookPayload {
        book_name: "LitRPG World".to_string(),
        character_name: "Hero".to_string(),
        initial_stats: InitialStatsPayload {
            level: 1,
            hp_current: 25,
            hp_max: 25,
            mp_current: 20,
            mp_max: 20,
            heart_current: 10,
            heart_max: 10,
            str: 10,
            con: 10,
            int_stat: 10,
            lck: 10,
            exp: 0,
            gold: 0,
            equipment: Equipment::default(),
            inventory: vec![],
            spells: vec![],
            relics: vec![],
            familiars: vec![],
        },
    };

    let (_, character, chap1) = create_book_with_character(&mut conn, payload).expect("create book");
    let chap2 = add_chapter(&mut conn, character.id).expect("add chap 2");
    let chap3 = add_chapter(&mut conn, character.id).expect("add chap 3");
    let chap4 = add_chapter(&mut conn, character.id).expect("add chap 4");

    // All chapters start with empty familiars
    assert_eq!(get_chapter(&conn, chap1.id).unwrap().familiars.len(), 0);
    assert_eq!(get_chapter(&conn, chap2.id).unwrap().familiars.len(), 0);
    assert_eq!(get_chapter(&conn, chap3.id).unwrap().familiars.len(), 0);
    assert_eq!(get_chapter(&conn, chap4.id).unwrap().familiars.len(), 0);

    // 1. Add familiar in Chapter 2
    let bat = Familiar {
        id: "fam_bat".to_string(),
        name: "Vampire Bat".to_string(),
        description: "Scouts dark corridors".to_string(),
        is_equipped: true,
    };

    update_chapter_with_ripple(&mut conn, UpdateChapterPayload {
        chapter_id: chap2.id,
        title: chap2.title,
        notes: chap2.notes,
        level: chap2.level,
        hp_current: chap2.hp_current,
        hp_max: chap2.hp_max,
        mp_current: chap2.mp_current,
        mp_max: chap2.mp_max,
        heart_current: chap2.heart_current,
        heart_max: chap2.heart_max,
        str: chap2.str,
        con: chap2.con,
        int_stat: chap2.int_stat,
        lck: chap2.lck,
        exp: chap2.exp,
        gold: chap2.gold,
        equipment: chap2.equipment,
        inventory: chap2.inventory,
        spells: chap2.spells,
        relics: chap2.relics,
        familiars: vec![bat.clone()],
    }).expect("update chapter 2 with familiar");

    // Chapter 1 must NOT have the familiar
    assert_eq!(get_chapter(&conn, chap1.id).unwrap().familiars.len(), 0);

    // Chapter 2 must have the familiar equipped
    let c2 = get_chapter(&conn, chap2.id).unwrap();
    assert_eq!(c2.familiars.len(), 1);
    assert_eq!(c2.familiars[0].name, "Vampire Bat");
    assert!(c2.familiars[0].is_equipped);

    // Chapter 3 must have carried forward the familiar and equipped status
    let c3 = get_chapter(&conn, chap3.id).unwrap();
    assert_eq!(c3.familiars.len(), 1);
    assert_eq!(c3.familiars[0].name, "Vampire Bat");
    assert!(c3.familiars[0].is_equipped);

    // Chapter 4 must have carried forward the familiar and equipped status
    let c4 = get_chapter(&conn, chap4.id).unwrap();
    assert_eq!(c4.familiars.len(), 1);
    assert_eq!(c4.familiars[0].name, "Vampire Bat");
    assert!(c4.familiars[0].is_equipped);

    // 2. Remove familiar in Chapter 2
    update_chapter_with_ripple(&mut conn, UpdateChapterPayload {
        chapter_id: chap2.id,
        title: c2.title,
        notes: c2.notes,
        level: c2.level,
        hp_current: c2.hp_current,
        hp_max: c2.hp_max,
        mp_current: c2.mp_current,
        mp_max: c2.mp_max,
        heart_current: c2.heart_current,
        heart_max: c2.heart_max,
        str: c2.str,
        con: c2.con,
        int_stat: c2.int_stat,
        lck: c2.lck,
        exp: c2.exp,
        gold: c2.gold,
        equipment: c2.equipment,
        inventory: c2.inventory,
        spells: c2.spells,
        relics: c2.relics,
        familiars: vec![],
    }).expect("update chapter 2 removing familiar");

    // Removal must carry forward to all later chapters (3 and 4)
    assert_eq!(get_chapter(&conn, chap1.id).unwrap().familiars.len(), 0);
    assert_eq!(get_chapter(&conn, chap2.id).unwrap().familiars.len(), 0);
    assert_eq!(get_chapter(&conn, chap3.id).unwrap().familiars.len(), 0);
    assert_eq!(get_chapter(&conn, chap4.id).unwrap().familiars.len(), 0);
}
