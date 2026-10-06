import React from "react";
import { Book, Character, Chapter } from "../types";
import {
  BookOpen,
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  FileJson,
  Bookmark,
} from "lucide-react";

interface ChapterHeaderProps {
  books: Book[];
  selectedBookId: number | null;
  onSelectBook: (id: number) => void;
  onOpenNewBook: () => void;

  characters: Character[];
  selectedCharacterId: number | null;
  onSelectCharacter: (id: number) => void;
  onOpenNewCharacter: () => void;

  chapters: Chapter[];
  currentChapter: Chapter | null;
  onSelectChapter: (id: number) => void;
  onAddChapter: () => void;
  onSaveChanges: () => void;
  onOpenImportExport: () => void;
  isSaving: boolean;
  hasUnsavedChanges?: boolean;
}

export const ChapterHeader: React.FC<ChapterHeaderProps> = ({
  books,
  selectedBookId,
  onSelectBook,
  onOpenNewBook,
  characters,
  selectedCharacterId,
  onSelectCharacter,
  onOpenNewCharacter,
  chapters,
  currentChapter,
  onSelectChapter,
  onAddChapter,
  onSaveChanges,
  onOpenImportExport,
  isSaving,
  hasUnsavedChanges = false,
}) => {
  const currentIndex = chapters.findIndex((c) => c.id === currentChapter?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < chapters.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectChapter(chapters[currentIndex - 1].id);
  };

  const handleNext = () => {
    if (hasNext) onSelectChapter(chapters[currentIndex + 1].id);
  };

  return (
    <header className="top-navbar">
      {/* Left: Brand + Book & Character Selectors */}
      <div className="top-nav-left">
        <div className="app-brand">
          <Bookmark className="brand-icon" size={20} />
          <span>LITRPG CODEX</span>
        </div>

        {/* Book Selector */}
        <div className="selector-pill">
          <BookOpen size={15} style={{ color: "var(--text-gold)", flexShrink: 0 }} />
          <select
            className="nav-select"
            value={selectedBookId ?? ""}
            onChange={(e) => onSelectBook(Number(e.target.value))}
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: "2px 4px" }}
            title="Create New Book"
            onClick={onOpenNewBook}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Character Selector */}
        {characters.length > 0 && (
          <div className="selector-pill">
            <User size={15} style={{ color: "var(--color-hp)", flexShrink: 0 }} />
            <select
              className="nav-select"
              value={selectedCharacterId ?? ""}
              onChange={(e) => onSelectCharacter(Number(e.target.value))}
            >
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: "2px 4px" }}
              title="Create New Character"
              onClick={onOpenNewCharacter}
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Center: Chapter Stepper & Navigation */}
      {currentChapter && (
        <div className="top-nav-center">
          <div className="chapter-stepper">
            <button
              type="button"
              className="chapter-stepper-btn"
              disabled={!hasPrev}
              onClick={handlePrev}
              title="Previous Chapter"
            >
              <ChevronLeft size={18} />
            </button>

            <select
              className="chapter-select"
              value={currentChapter.id}
              onChange={(e) => onSelectChapter(Number(e.target.value))}
            >
              {chapters.map((ch) => (
                <option
                  key={ch.id}
                  value={ch.id}
                >
                  Chapter {ch.chapter_number}: {ch.title || `Save Point ${ch.chapter_number}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="chapter-stepper-btn"
              disabled={!hasNext}
              onClick={handleNext}
              title="Next Chapter"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
            title="Create next chapter save point"
            onClick={onAddChapter}
          >
            <Plus size={14} /> New Chapter
          </button>
        </div>
      )}

      {/* Right: Save & Backup Actions */}
      <div className="top-nav-right">
        {currentChapter && (
          <button
            type="button"
            className={hasUnsavedChanges ? "btn btn-primary" : "btn btn-save"}
            style={
              hasUnsavedChanges
                ? {
                    boxShadow: "0 0 12px rgba(244, 196, 83, 0.4)",
                    borderColor: "var(--text-gold)",
                  }
                : undefined
            }
            onClick={onSaveChanges}
            disabled={isSaving}
          >
            <Save size={16} />
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes ●" : "Saved"}
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenImportExport}
          title="Import or Export JSON"
        >
          <FileJson size={16} /> JSON
        </button>
      </div>
    </header>
  );
};
