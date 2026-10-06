# LitRPG Character Codex

A native Linux desktop application for **Arch Linux** built with **Rust** and **Tauri 2**, paired with a **React + TypeScript + Vite** frontend styled with a gothic, dark-fantasy Castlevania / LitRPG aesthetic.

---

## Features

### 1. Multi-Book & Character Management
- Create multiple books and switch between them seamlessly.
- Create multiple characters within each book.
- Initialize character sheets with starting attributes, vitals, gold, equipment, and starter inventory.

### 2. Chapter-Based Save Points & Forward "Bubble-Up" (Ripple) System
- Save points are tracked by **Book Chapters**.
- Creating a **New Chapter** snapshots all stats, equipment, inventory stacks, spells, relics, and familiars from the previous chapter.
- **Changes Always Bubble Up**:
  - Modifying numerical stats (STR, CON, INT, LCK, Max HP/MP/Heart, Gold, EXP, Level) in an earlier chapter computes the exact $\Delta$ and ripples that change forward to all subsequent chapters.
  - Modifying inventory stacks: additions, deletions, and quantity adjustments propagate forward to future chapters.
  - Adding or removing Spells and Relics propagates forward.
  - Equipment adjustments propagate forward to keep subsequent chapters in sync.
  - Active Familiar status propagates forward.

### 3. Castlevania: Symphony of the Night (SotN) EXP Progression
- Experience thresholds for levels 1–99 are strictly mapped from the official [Castlevania: SotN Experience Chart](https://www.castlevaniacrypt.com/sotn-exp/).
- Smoothly extrapolated beyond level 99 up to **Level 300**.
- **NEXT** stat automatically computes remaining EXP required to reach the next level in real time.
- Dedicated **Level Up** allocation modal allows incrementing levels, allocating stat points freely (STR, CON, INT, LCK, Max HP, Max MP, Max Heart), and saving with automatic forward ripple.

### 4. Gear, Inventory & Compendiums
- **Equipment Slots**: Right Hand, Left Hand, Head, Armor, Cloak, and Accessory.
- **Inventory System**: Supports up to 255 unique listings with max stack sizes of 255 per item.
- **Grimoire of Spells**: Add, remove, and track spells learned per chapter.
- **Ancient Relics**: Inscribe and manage passive artifacts attuned per chapter.
- **Familiar Companions**: Summon companions with a single active equipped companion toggle.

### 5. JSON Backup & Restore
- One-click export of the entire database or single chronicles to structured `.json` text files.
- Import feature to restore or migrate data across machines.

---

## Project Structure

```
LitRPG-Char/
├── src-tauri/               # Rust Backend (Tauri 2)
│   ├── src/
│   │   ├── main.rs          # App entrypoint
│   │   ├── lib.rs           # Tauri builder & command registrations
│   │   ├── models.rs        # Serde structs for Book, Character, Chapter, Equipment, etc.
│   │   ├── db.rs            # SQLite database layer with full ripple engine
│   │   ├── exp.rs           # Precomputed SotN EXP table (Levels 1-300) and formula
│   │   └── commands.rs      # Tauri invoke command handlers
│   ├── tests/
│   │   └── ripple_tests.rs  # Automated integration test suite
│   ├── Cargo.toml           # Rust dependencies (rusqlite, serde, tauri, dirs)
│   └── tauri.conf.json      # Window and app configuration
├── src/                     # Frontend (React 19 + TypeScript + Vite)
│   ├── components/
│   │   ├── ChapterHeader.tsx    # Book/character selectors & chapter timeline
│   │   ├── CharacterSidebar.tsx # Left sidebar with all core stats & vitals
│   │   ├── EquipmentPanel.tsx   # 6-slot gear layout
│   │   ├── InventoryPanel.tsx   # 255-slot stackable inventory
│   │   ├── SpellsPanel.tsx      # Spellbook list
│   │   ├── RelicsPanel.tsx      # Relic list
│   │   ├── FamiliarsPanel.tsx   # Familiar list with equipped toggle
│   │   ├── LevelUpModal.tsx     # Stat allocation & EXP preview modal
│   │   ├── NewBookModal.tsx     # Book & starting character creation modal
│   │   ├── NewCharacterModal.tsx# Additional character creation modal
│   │   └── ImportExportModal.tsx# JSON backup / restore modal
│   ├── expTable.ts          # Frontend SotN EXP curve lookup & NEXT calculator
│   ├── api.ts               # Type-safe Tauri IPC bridge
│   ├── types.ts             # Shared data definitions
│   ├── index.css            # Dark gothic RPG aesthetic styling
│   └── App.tsx              # Root orchestration component
```

---

## Running the Application on Arch Linux

### Development Mode (with Live Reload)
```bash
npm run tauri dev
```

### Running the Native Executable Directly
```bash
./src-tauri/target/debug/tauri-app
```

### Running the Test Suite
```bash
cargo test --manifest-path src-tauri/Cargo.toml
```

### Building Release Package
```bash
npm run tauri build
```
The compiled binary will be placed in `src-tauri/target/release/tauri-app`.
