import React, { useState } from "react";
import { InitialStatsPayload } from "../types";
import { UserPlus, X, Sparkles, Heart, Shield, Coins } from "lucide-react";

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
  const [str, setStr] = useState(12);
  const [con, setCon] = useState(10);
  const [intStat, setIntStat] = useState(11);
  const [lck, setLck] = useState(8);
  const [exp, setExp] = useState(0);
  const [gold, setGold] = useState(100);

  // Starter Equipment & Items
  const [starterWeapon, setStarterWeapon] = useState("Short Sword");
  const [starterArmor, setStarterArmor] = useState("Traveler's Tunic");
  const [starterPotions, setStarterPotions] = useState(3);

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
          right_hand: starterWeapon.trim(),
          left_hand: "",
          head: "",
          armor: starterArmor.trim(),
          cloak: "",
          accessory: "",
        },
        inventory:
          starterPotions > 0
            ? [
                {
                  id: `inv_init_${Date.now()}`,
                  name: "Health Potion",
                  count: Math.min(255, starterPotions),
                },
              ]
            : [],
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
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "760px", width: "100%" }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <UserPlus size={20} style={{ color: "var(--text-gold)" }} />
            <span>ADD NEW CHARACTER</span>
            <span
              style={{
                fontSize: "0.8rem",
                color: "var(--text-gold)",
                background: "rgba(244, 196, 83, 0.12)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(244, 196, 83, 0.25)",
              }}
            >
              {bookName}
            </span>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Identity */}
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--text-gold)" }}>
                Character Name
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Maria Renard, Richter Belmont, Jason Asano"
                className="form-input"
                style={{ fontSize: "1rem" }}
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
              />
            </div>

            {/* Vitals & Level */}
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-gold)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Heart size={14} style={{ color: "var(--color-hp)" }} /> Vitals & Starting Level
              </div>
              <div className="form-grid-4">
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-hp)" }}>
                    Initial HP
                  </label>
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
                  <label className="form-label" style={{ color: "var(--color-mp)" }}>
                    Initial MP
                  </label>
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
                  <label className="form-label" style={{ color: "var(--color-heart)" }}>
                    Initial Heart
                  </label>
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
                  <label className="form-label" style={{ color: "var(--color-gold)" }}>
                    Level (1-300)
                  </label>
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
            </div>

            {/* Core Attributes */}
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-gold)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Sparkles size={14} /> Primary Attributes (0 - 255)
              </div>
              <div className="form-grid-4">
                <div className="form-group">
                  <label className="form-label">STR (Strength)</label>
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
                  <label className="form-label">CON (Constitution)</label>
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
                  <label className="form-label">INT (Intelligence)</label>
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
                  <label className="form-label">LCK (Luck)</label>
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
            </div>

            {/* Economy & EXP */}
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-gold)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Coins size={14} /> Wealth & Experience
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-exp)" }}>
                    Initial EXP
                  </label>
                  <input
                    type="number"
                    min={0}
                    className="form-input"
                    value={exp}
                    onChange={(e) => setExp(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: "var(--color-gold)" }}>
                    Initial Gold (Max 999,999)
                  </label>
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

            {/* Starter Gear & Inventory */}
            <div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Shield size={14} /> Starter Equipment & Supplies
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
                  <label className="form-label">Health Potions</label>
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Inscribing..." : "Add Character"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
