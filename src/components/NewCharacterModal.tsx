import React, { useState } from "react";
import { InitialStatsPayload } from "../types";
import { UserPlus, X, Sparkles } from "lucide-react";

interface NewCharacterModalProps {
  bookName: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (characterName: string, initialStats: InitialStatsPayload) => Promise<void>;
}

export const NewCharacterModal: React.FC<NewCharacterModalProps> = ({
  bookName,
  isOpen,
  onClose,
  onCreated,
}) => {
  const [charName, setCharName] = useState("");

  const [level, setLevel] = useState(1);
  const [hp, setHp] = useState(25);
  const [mp, setMp] = useState(20);
  const [heart, setHeart] = useState(10);
  const [str, setStr] = useState(10);
  const [con, setCon] = useState(10);
  const [intStat, setIntStat] = useState(10);
  const [lck, setLck] = useState(10);
  const [exp, setExp] = useState(0);
  const [gold, setGold] = useState(50);

  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!charName.trim()) return;

    setSaving(true);
    try {
      const initialStats: InitialStatsPayload = {
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
          right_hand: "",
          left_hand: "",
          head: "",
          armor: "",
          cloak: "",
          accessory: "",
        },
        inventory: [],
        spells: [],
        relics: [],
        familiars: [],
      };

      await onCreated(charName.trim(), initialStats);
      onClose();
    } catch (err) {
      alert("Error adding character: " + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px" }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <UserPlus size={20} style={{ color: "var(--text-gold)" }} /> ADD CHARACTER TO {bookName}
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Character Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Maria Renard, Richter Belmont"
                className="form-input"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
              />
            </div>

            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-gold)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={14} /> INITIAL STATS (0 - 255)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-hp)" }}>HP</label>
                <input
                  type="number"
                  min={1}
                  className="form-input"
                  value={hp}
                  onChange={(e) => setHp(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-mp)" }}>MP</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={mp}
                  onChange={(e) => setMp(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-heart)" }}>HEART</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={heart}
                  onChange={(e) => setHeart(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">LEVEL</label>
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">EXP</label>
                <input
                  type="number"
                  min={0}
                  className="form-input"
                  value={exp}
                  onChange={(e) => setExp(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">GOLD</label>
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

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Add Character"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
