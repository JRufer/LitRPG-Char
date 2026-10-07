import { invoke } from "@tauri-apps/api/core";
import {
  Book,
  Character,
  Chapter,
  CreateBookPayload,
  InitialStatsPayload,
  UpdateChapterPayload,
  LevelUpPayload,
  RippleResult,
  ExportData,
} from "./types";

export const api = {
  getBooks: async (): Promise<Book[]> => {
    return await invoke<Book[]>("get_books");
  },

  createBook: async (payload: CreateBookPayload): Promise<[Book, Character, Chapter]> => {
    return await invoke<[Book, Character, Chapter]>("create_book", { payload });
  },

  deleteBook: async (bookId: number): Promise<void> => {
    await invoke("delete_book", { bookId });
  },

  renameBook: async (bookId: number, newName: string): Promise<Book> => {
    return await invoke<Book>("rename_book", { bookId, newName });
  },

  getCharacters: async (bookId: number): Promise<Character[]> => {
    return await invoke<Character[]>("get_characters", { bookId });
  },

  createCharacter: async (
    bookId: number,
    characterName: string,
    initialStats: InitialStatsPayload
  ): Promise<[Character, Chapter]> => {
    return await invoke<[Character, Chapter]>("create_character", {
      bookId,
      characterName,
      initialStats,
    });
  },

  deleteCharacter: async (characterId: number): Promise<void> => {
    await invoke("delete_character", { characterId });
  },

  renameCharacter: async (characterId: number, newName: string): Promise<Character> => {
    return await invoke<Character>("rename_character", { characterId, newName });
  },

  getChapters: async (characterId: number): Promise<Chapter[]> => {
    return await invoke<Chapter[]>("get_chapters", { characterId });
  },

  getChapter: async (chapterId: number): Promise<Chapter> => {
    return await invoke<Chapter>("get_chapter", { chapterId });
  },

  addChapter: async (characterId: number): Promise<Chapter> => {
    return await invoke<Chapter>("add_chapter", { characterId });
  },

  deleteChapter: async (chapterId: number): Promise<void> => {
    await invoke("delete_chapter", { chapterId });
  },

  updateChapter: async (payload: UpdateChapterPayload): Promise<RippleResult> => {
    return await invoke<RippleResult>("update_chapter", { payload });
  },

  levelUp: async (payload: LevelUpPayload): Promise<RippleResult> => {
    return await invoke<RippleResult>("level_up", { payload });
  },

  getExpTable: async (): Promise<number[]> => {
    return await invoke<number[]>("get_exp_table");
  },

  exportData: async (): Promise<ExportData> => {
    return await invoke<ExportData>("export_data");
  },

  importData: async (data: ExportData): Promise<number> => {
    return await invoke<number>("import_data", { data });
  },
};
