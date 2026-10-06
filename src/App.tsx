import { useEffect, useState, useCallback } from "react";
import { Book, Character, Chapter, CreateBookPayload, InitialStatsPayload, LevelUpPayload, ExportData } from "./types";
import { api } from "./api";
import { ChapterHeader } from "./components/ChapterHeader";
import { CharacterSidebar } from "./components/CharacterSidebar";
import { EquipmentPanel } from "./components/EquipmentPanel";
import { InventoryPanel } from "./components/InventoryPanel";
import { SpellsPanel } from "./components/SpellsPanel";
import { RelicsPanel } from "./components/RelicsPanel";
import { FamiliarsPanel } from "./components/FamiliarsPanel";
import { LevelUpModal } from "./components/LevelUpModal";
import { NewBookModal } from "./components/NewBookModal";
import { NewCharacterModal } from "./components/NewCharacterModal";
import { ImportExportModal } from "./components/ImportExportModal";
import { UnsavedChangesModal } from "./components/UnsavedChangesModal";
import { Shield, Wand2, Award, Bird, CheckCircle2, Sparkles, BookOpen } from "lucide-react";

interface ToastNotification {
  id: number;
  message: string;
  type: "success" | "info" | "warning";
}

export function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"equip" | "spells" | "relics" | "familiars">("equip");

  // Modals
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [isNewCharOpen, setIsNewCharOpen] = useState(false);
  const [isLevelUpOpen, setIsLevelUpOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Check if current chapter has unsaved modifications
  const isDirty = Boolean(
    currentChapter &&
    savedSnapshot &&
    JSON.stringify(currentChapter) !== savedSnapshot
  );

  // Guard against browser/app window exit with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const addToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // 1. Initial Load: Books
  const loadBooks = useCallback(async () => {
    try {
      const bList = await api.getBooks();
      setBooks(bList);
      if (bList.length > 0) {
        setSelectedBookId(bList[0].id);
      } else {
        setIsNewBookOpen(true);
      }
    } catch (err) {
      console.error("Failed to load books:", err);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // 2. Load Characters when selectedBookId changes
  const loadCharacters = useCallback(async (bookId: number) => {
    try {
      const cList = await api.getCharacters(bookId);
      setCharacters(cList);
      if (cList.length > 0) {
        setSelectedCharacterId(cList[0].id);
      } else {
        setSelectedCharacterId(null);
        setChapters([]);
        setCurrentChapter(null);
        setSavedSnapshot("");
      }
    } catch (err) {
      console.error("Failed to load characters:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedBookId !== null) {
      loadCharacters(selectedBookId);
    }
  }, [selectedBookId, loadCharacters]);

  // 3. Load Chapters when selectedCharacterId changes
  const loadChapters = useCallback(async (charId: number, keepChapterId?: number) => {
    try {
      const chList = await api.getChapters(charId);
      setChapters(chList);
      if (chList.length > 0) {
        const target = keepChapterId
          ? chList.find((c) => c.id === keepChapterId) ?? chList[0]
          : chList[0];
        setCurrentChapter(target);
        setSavedSnapshot(JSON.stringify(target));
      } else {
        setCurrentChapter(null);
        setSavedSnapshot("");
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedCharacterId !== null) {
      loadChapters(selectedCharacterId);
    }
  }, [selectedCharacterId, loadChapters]);

  // Safe Navigation Interceptor: Checks if dirty before proceeding
  const confirmNavigation = (action: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => action);
      setIsUnsavedModalOpen(true);
    } else {
      action();
    }
  };

  // Handler: Save active chapter & ripple forward
  const handleSaveChanges = async (): Promise<boolean> => {
    if (!currentChapter || selectedCharacterId === null) return false;
    setIsSaving(true);
    try {
      const res = await api.updateChapter({
        chapter_id: currentChapter.id,
        title: currentChapter.title,
        notes: currentChapter.notes,
        level: currentChapter.level,
        hp_current: currentChapter.hp_current,
        hp_max: currentChapter.hp_max,
        mp_current: currentChapter.mp_current,
        mp_max: currentChapter.mp_max,
        heart_current: currentChapter.heart_current,
        heart_max: currentChapter.heart_max,
        str: currentChapter.str,
        con: currentChapter.con,
        int: currentChapter.int,
        lck: currentChapter.lck,
        exp: currentChapter.exp,
        gold: currentChapter.gold,
        equipment: currentChapter.equipment,
        inventory: currentChapter.inventory,
        spells: currentChapter.spells,
        relics: currentChapter.relics,
        familiars: currentChapter.familiars,
      });

      // Update current chapter and snapshot
      setCurrentChapter(res.updated_chapter);
      setSavedSnapshot(JSON.stringify(res.updated_chapter));
      await loadChapters(selectedCharacterId, currentChapter.id);
      addToast(res.message);
      return true;
    } catch (err) {
      alert("Error saving chapter: " + err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Unsaved Modal Actions
  const handleSaveAndProceed = async () => {
    const success = await handleSaveChanges();
    if (success) {
      setIsUnsavedModalOpen(false);
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    }
  };

  const handleDiscardAndProceed = () => {
    if (savedSnapshot) {
      try {
        const reverted = JSON.parse(savedSnapshot);
        setCurrentChapter(reverted);
      } catch (e) {
        console.error("Failed to parse snapshot:", e);
      }
    }
    setIsUnsavedModalOpen(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setPendingNavigation(null);
    setIsUnsavedModalOpen(false);
  };

  // Navigation Handlers guarded by confirmNavigation
  const handleSelectBook = (bookId: number) => {
    confirmNavigation(() => setSelectedBookId(bookId));
  };

  const handleSelectCharacter = (charId: number) => {
    confirmNavigation(() => setSelectedCharacterId(charId));
  };

  const handleSelectChapter = (chapterId: number) => {
    confirmNavigation(() => {
      const found = chapters.find((c) => c.id === chapterId);
      if (found) {
        setCurrentChapter(found);
        setSavedSnapshot(JSON.stringify(found));
      }
    });
  };

  const handleAddChapter = () => {
    confirmNavigation(async () => {
      if (selectedCharacterId === null) return;
      try {
        const newChap = await api.addChapter(selectedCharacterId);
        await loadChapters(selectedCharacterId, newChap.id);
        addToast(`Created Chapter ${newChap.chapter_number} save point!`);
      } catch (err) {
        alert("Error adding chapter: " + err);
      }
    });
  };

  const handleOpenNewBook = () => {
    confirmNavigation(() => setIsNewBookOpen(true));
  };

  const handleOpenNewCharacter = () => {
    confirmNavigation(() => setIsNewCharOpen(true));
  };

  const handleOpenImportExport = () => {
    confirmNavigation(() => setIsImportExportOpen(true));
  };

  // Handler: Create Book & Initial Character
  const handleCreateBook = async (payload: CreateBookPayload) => {
    try {
      const [book, character, chapter] = await api.createBook(payload);
      setBooks((prev) => [book, ...prev]);
      setSelectedBookId(book.id);
      setCharacters([character]);
      setSelectedCharacterId(character.id);
      setChapters([chapter]);
      setCurrentChapter(chapter);
      setSavedSnapshot(JSON.stringify(chapter));
      addToast(`Book "${book.name}" created with character "${character.name}"!`);
    } catch (err) {
      alert("Error creating book: " + err);
    }
  };

  // Handler: Create Character in existing book
  const handleCreateCharacter = async (characterName: string, initialStats: InitialStatsPayload) => {
    if (selectedBookId === null) return;
    try {
      const [char, chap] = await api.createCharacter(selectedBookId, characterName, initialStats);
      setCharacters((prev) => [...prev, char]);
      setSelectedCharacterId(char.id);
      setChapters([chap]);
      setCurrentChapter(chap);
      setSavedSnapshot(JSON.stringify(chap));
      addToast(`Character "${char.name}" added to book!`);
    } catch (err) {
      alert("Error creating character: " + err);
    }
  };

  // Handler: Level Up
  const handleConfirmLevelUp = async (payload: LevelUpPayload) => {
    if (selectedCharacterId === null) return;
    const res = await api.levelUp(payload);
    await loadChapters(selectedCharacterId, payload.chapter_id);
    addToast(res.message);
  };

  // Handler: Export
  const handleExportData = async (): Promise<ExportData> => {
    return await api.exportData();
  };

  // Handler: Import
  const handleImportData = async (data: ExportData): Promise<number> => {
    const count = await api.importData(data);
    await loadBooks();
    return count;
  };

  const currentBook = books.find((b) => b.id === selectedBookId);
  const currentCharacter = characters.find((c) => c.id === selectedCharacterId);

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <ChapterHeader
        books={books}
        selectedBookId={selectedBookId}
        onSelectBook={handleSelectBook}
        onOpenNewBook={handleOpenNewBook}
        characters={characters}
        selectedCharacterId={selectedCharacterId}
        onSelectCharacter={handleSelectCharacter}
        onOpenNewCharacter={handleOpenNewCharacter}
        chapters={chapters}
        currentChapter={currentChapter}
        onSelectChapter={handleSelectChapter}
        onAddChapter={handleAddChapter}
        onSaveChanges={handleSaveChanges}
        onOpenImportExport={handleOpenImportExport}
        isSaving={isSaving}
        hasUnsavedChanges={isDirty}
      />

      {/* Main Workspace */}
      {currentChapter && currentCharacter ? (
        <div className="workspace-layout">
          {/* Left Sidebar: Character Sheet Stats */}
          <CharacterSidebar
            characterName={currentCharacter.name}
            chapter={currentChapter}
            onUpdateChapterState={(updater) =>
              setCurrentChapter((prev) => (prev ? updater(prev) : null))
            }
            onOpenLevelUp={() => setIsLevelUpOpen(true)}
          />

          {/* Center Main Panel */}
          <main className="main-content-panel">
            {/* Chapter Header Info Banner */}
            <div
              style={{
                padding: "16px 24px 0 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                <input
                  type="text"
                  className="slot-input"
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "var(--text-gold)",
                  }}
                  value={currentChapter.title}
                  placeholder={`Chapter ${currentChapter.chapter_number} Title`}
                  onChange={(e) =>
                    setCurrentChapter((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                />
                <input
                  type="text"
                  className="slot-input"
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  value={currentChapter.notes}
                  placeholder="Chapter notes, dungeon status, or quest objectives..."
                  onChange={(e) =>
                    setCurrentChapter((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                  }
                />
              </div>

              <div style={{ textAlign: "right", minWidth: "180px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: isDirty ? "rgba(255, 183, 3, 0.15)" : "rgba(244, 196, 83, 0.1)",
                    border: isDirty ? "1px solid var(--color-gold)" : "1px solid rgba(244, 196, 83, 0.3)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.75rem",
                    color: isDirty ? "var(--color-gold)" : "var(--text-gold)",
                    fontWeight: isDirty ? 700 : 500,
                  }}
                >
                  <Sparkles size={12} /> {isDirty ? "Unsaved Changes" : "Auto Ripple Ready"}
                </span>
                <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "3px" }}>
                  {isDirty ? "Save to bubble up changes" : "Changes bubble up forward"}
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="tab-nav-bar">
              <button
                type="button"
                className={`tab-btn ${activeTab === "equip" ? "active" : ""}`}
                onClick={() => setActiveTab("equip")}
              >
                <Shield size={16} /> Equip & Inventory
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === "spells" ? "active" : ""}`}
                onClick={() => setActiveTab("spells")}
              >
                <Wand2 size={16} /> Spells ({currentChapter.spells.length})
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === "relics" ? "active" : ""}`}
                onClick={() => setActiveTab("relics")}
              >
                <Award size={16} /> Relics ({currentChapter.relics.length})
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === "familiars" ? "active" : ""}`}
                onClick={() => setActiveTab("familiars")}
              >
                <Bird size={16} /> Familiars ({currentChapter.familiars.length})
              </button>
            </nav>

            {/* Tab Content Body */}
            <div className="tab-content-area">
              {activeTab === "equip" && (
                <>
                  <EquipmentPanel
                    equipment={currentChapter.equipment}
                    onChange={(eq) =>
                      setCurrentChapter((prev) => (prev ? { ...prev, equipment: eq } : null))
                    }
                  />

                  <InventoryPanel
                    inventory={currentChapter.inventory}
                    onChange={(inv) =>
                      setCurrentChapter((prev) => (prev ? { ...prev, inventory: inv } : null))
                    }
                  />
                </>
              )}

              {activeTab === "spells" && (
                <SpellsPanel
                  spells={currentChapter.spells}
                  onChange={(spells) =>
                    setCurrentChapter((prev) => (prev ? { ...prev, spells } : null))
                  }
                />
              )}

              {activeTab === "relics" && (
                <RelicsPanel
                  relics={currentChapter.relics}
                  onChange={(relics) =>
                    setCurrentChapter((prev) => (prev ? { ...prev, relics } : null))
                  }
                />
              )}

              {activeTab === "familiars" && (
                <FamiliarsPanel
                  familiars={currentChapter.familiars}
                  onChange={(familiars) =>
                    setCurrentChapter((prev) => (prev ? { ...prev, familiars } : null))
                  }
                />
              )}
            </div>
          </main>
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            color: "var(--text-muted)",
          }}
        >
          <BookOpen size={48} style={{ color: "var(--text-gold)" }} />
          <h2 style={{ fontFamily: "var(--font-title)", color: "#fff" }}>
            {books.length === 0 ? "No LitRPG Chronicles Found" : "No Characters in Book"}
          </h2>
          <p style={{ maxWidth: "400px", textAlign: "center", fontSize: "0.9rem" }}>
            {books.length === 0
              ? "Begin by creating a new book and entering your protagonist's initial stats."
              : "Create a character for this book to begin tracking chapter save points."}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (books.length === 0 ? handleOpenNewBook() : handleOpenNewCharacter())}
          >
            {books.length === 0 ? "Create New Book" : "Create Character"}
          </button>
        </div>
      )}

      {/* Modals */}
      <NewBookModal
        isOpen={isNewBookOpen}
        onClose={() => setIsNewBookOpen(false)}
        onCreated={handleCreateBook}
      />

      {currentBook && (
        <NewCharacterModal
          bookName={currentBook.name}
          isOpen={isNewCharOpen}
          onClose={() => setIsNewCharOpen(false)}
          onCreated={handleCreateCharacter}
        />
      )}

      {currentChapter && (
        <LevelUpModal
          chapter={currentChapter}
          isOpen={isLevelUpOpen}
          onClose={() => setIsLevelUpOpen(false)}
          onConfirmLevelUp={handleConfirmLevelUp}
        />
      )}

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onExport={handleExportData}
        onImport={handleImportData}
      />

      {/* Unsaved Changes Confirmation Modal */}
      {currentChapter && (
        <UnsavedChangesModal
          isOpen={isUnsavedModalOpen}
          chapterTitle={currentChapter.title || `Chapter ${currentChapter.chapter_number}`}
          onSaveAndProceed={handleSaveAndProceed}
          onDiscardAndProceed={handleDiscardAndProceed}
          onCancel={handleCancelNavigation}
          isSaving={isSaving}
        />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <CheckCircle2 size={18} color="var(--color-success)" />
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
