import React, { useState } from "react";
import { CreateBookPayload } from "../types";
import { BookOpen, X, Sparkles, Shield } from "lucide-react";

interface NewBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (payload: CreateBookPayload) => Promise<void>;
}

export const NewBookModal: React.FC<NewBookModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [bookName, setBookName] = useState("");
  const [charName, setCharName] = useState("");

  // Initial Stats (0-255, gold 0-999,999)
  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(25);
  const [mp, setMp] = useState(20);
  const [heart, setHeart] = useState(10);
  const [str, setStr] = useState(12);
  const [con, setCon] = useState(10);
  const [intStat, setIntStat] = useState(11);
  const [lck, setLck] = useState(8);
  const [exp, setExp] = useState(0);
  const [gold, setGold] = useState(100);

  // Initial starter items
  const [starterWeapon, setStarterWeapon] = useState("Short Sword");
  const [starterArmor, setStarterArmor] = useState("Traveler's Tunic");
  const [starterPotions, setStarterPotions] = useState(3);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim() || !charName.trim()) {
      alert("Please provide both a Book name and Character name.");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateBookPayload = {
        book_name: bookName.trim(),
        character_name: charName.trim(),
        initial_stats: {
          level: Math.max(1, level),
          hp_current: hp,
          hp_max: hp,
          mp_current: mp,
          mp_max: mp,
          heart_current: heart,
          heart_max: heart,
          str: Math.max(0, Math.min(255, str)),
          con: Math.max(0, Math.min(255, con)),
          int: Math.max(0, Math.min(255, intStat)),
          lck: Math.max(0, Math.min(255, lck)),
          exp: Math.max(0, exp),
          gold: Math.max(0, Math.min(999999, gold)),
          equipment: {
            right_hand: starterWeapon.trim(),
            left_hand: "",
            head: "",
            armor: starterArmor.trim(),
            cloak: "",
            accessory: "",
          },
          inventory: starterPotions > 0
            ? [
                {
                  id: `inv_init_1`,
                  name: "Health Potion",
                  count: Math.min(255, starterPotions),
                },
              ]
            : [],
          spells: [],
          relics: [],
          familiars: [],
        },
      };

      await onCreated(payload);
      onClose();
    } catch (err) {
      alert("Error creating book: " + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "760px", width: "100%" }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <BookOpen size={20} style={{ color: "var(--text-gold)" }} /> NEW BOOK CHRONICLE
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Book & Character Identifiers */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Book Title</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. He Who Fights Monsters"
                    className="form-input"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Character Name</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jason Asano, Alucard"
                    className="form-input"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Initial Stats Header */}
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-gold)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Sparkles size={14} /> INITIAL NUMERICAL STATS (0 - 255)
              </div>

              {/* Vitals row */}
              <div className="form-grid-4" style={{ marginBottom: "12px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-hp)" }}>Initial HP</label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    className="form-input"
                    value={hp}
                    onChange={(e) => setHp(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-mp)" }}>Initial MP</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    className="form-input"
                    value={mp}
                    onChange={(e) => setMp(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-heart)" }}>Initial Heart</label>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    className="form-input"
                    value={heart}
                    onChange={(e) => setHeart(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Level</label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    className="form-input"
                    value={level}
                    onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Core 4 Stats */}
              <div className="form-grid-4" style={{ marginBottom: "12px" }}>
                <div className="form-group">
                  <label className="form-label">STR</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    className="form-input"
                    value={str}
                    onChange={(e) => setStr(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CON</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    className="form-input"
                    value={con}
                    onChange={(e) => setCon(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">INT</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    className="form-input"
                    value={intStat}
                    onChange={(e) => setIntStat(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">LCK</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    className="form-input"
                    value={lck}
                    onChange={(e) => setLck(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* EXP & Gold */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-exp)" }}>Initial EXP</label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={exp}
                    onChange={(e) => setExp(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-gold)" }}>Initial Gold (Max 999k)</label>
                  <input
                    type="number"
                    min={0}
                    max={999999}
                    className="form-input"
                    value={gold}
                    onChange={(e) => setGold(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Starter Equipment & Items */}
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Shield size={14} /> STARTER GEAR & INVENTORY
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Starter Weapon</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Short Sword"
                    value={starterWeapon}
                    onChange={(e) => setStarterWeapon(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Starter Armor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Traveler's Tunic"
                    value={starterArmor}
                    onChange={(e) => setStarterArmor(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Potions</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    className="form-input"
                    value={starterPotions}
                    onChange={(e) => setStarterPotions(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Inscribe Book & Character"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
