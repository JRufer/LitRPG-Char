pub mod commands;
pub mod db;
pub mod exp;
pub mod models;

use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = db::init_database().expect("Failed to initialize SQLite database");
    let db_state = db::DbState(Mutex::new(conn));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_books,
            commands::create_book,
            commands::delete_book,
            commands::get_characters,
            commands::create_character,
            commands::delete_character,
            commands::get_chapters,
            commands::get_chapter,
            commands::add_chapter,
            commands::delete_chapter,
            commands::update_chapter,
            commands::level_up,
            commands::get_exp_table,
            commands::export_data,
            commands::import_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
