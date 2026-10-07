use tauri::State;

use crate::db::{self, DbState};
use crate::exp::{self, MAX_LEVEL};
use crate::models::*;

#[tauri::command]
pub fn get_books(state: State<'_, DbState>) -> Result<Vec<Book>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::list_books(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_book(
    payload: CreateBookPayload,
    state: State<'_, DbState>,
) -> Result<(Book, Character, Chapter), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::create_book_with_character(&mut conn, payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_book(book_id: i64, state: State<'_, DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_book(&conn, book_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_book(
    book_id: i64,
    new_name: String,
    state: State<'_, DbState>,
) -> Result<Book, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::rename_book(&conn, book_id, new_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_characters(book_id: i64, state: State<'_, DbState>) -> Result<Vec<Character>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::list_characters(&conn, book_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_character(
    book_id: i64,
    character_name: String,
    initial_stats: InitialStatsPayload,
    state: State<'_, DbState>,
) -> Result<(Character, Chapter), String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::create_character(&mut conn, book_id, character_name, initial_stats).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_character(character_id: i64, state: State<'_, DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_character(&conn, character_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_character(
    character_id: i64,
    new_name: String,
    state: State<'_, DbState>,
) -> Result<Character, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::rename_character(&conn, character_id, new_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_chapters(character_id: i64, state: State<'_, DbState>) -> Result<Vec<Chapter>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::list_chapters(&conn, character_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_chapter(chapter_id: i64, state: State<'_, DbState>) -> Result<Chapter, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::get_chapter(&conn, chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_chapter(character_id: i64, state: State<'_, DbState>) -> Result<Chapter, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::add_chapter(&mut conn, character_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_chapter(chapter_id: i64, state: State<'_, DbState>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::delete_chapter(&conn, chapter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_chapter(
    payload: UpdateChapterPayload,
    state: State<'_, DbState>,
) -> Result<RippleResult, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::update_chapter_with_ripple(&mut conn, payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn level_up(
    payload: LevelUpPayload,
    state: State<'_, DbState>,
) -> Result<RippleResult, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::level_up_with_ripple(&mut conn, payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_exp_table() -> Vec<u64> {
    exp::EXP_TABLE[1..=MAX_LEVEL as usize].to_vec()
}

#[tauri::command]
pub fn export_data(state: State<'_, DbState>) -> Result<ExportData, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    db::export_database_json(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_data(data: ExportData, state: State<'_, DbState>) -> Result<usize, String> {
    let mut conn = state.0.lock().map_err(|e| e.to_string())?;
    db::import_database_json(&mut conn, data).map_err(|e| e.to_string())
}
