import React, { useState } from "react";
import { Chapter, LevelUpPayload } from "../types";
import { calculateNextExp, getExpForLevel, MAX_LEVEL } from "../expTable";
import {
  ArrowUpCircle,
  X,
  Heart,
  Sparkles,
  Flame,
  Zap,
} from "lucide-react";

interface LevelUpModalProps {
  chapter: Chapter;
  isOpen: boolean;
  onClose: () => void;
  onConfirmLevelUp: (payload: LevelUpPayload) => Promise<void>;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  chapter,
  isOpen,
  onClose,
  onConfirmLevelUp,
}) => {
  const [addLevels, setAddLevels] = useState<number>(1);
  const [addStr, setAddStr] = useState<number>(0);
  const [addCon, setAddCon] = useState<number>(0);
  const [addInt, setAddInt] = useState<number>(0);
  const [addLck, setAddLck] = useState<number>(0);
  const [addHpMax, setAddHpMax] = useState<number>(5);
  const [addMpMax, setAddMpMax] = useState<number>(5);
  const [addHeartMax, setAddHeartMax] = useState<number>(2);
  const [bonusExp, setBonusExp] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetLevel = Math.min(MAX_LEVEL, chapter.level + addLevels);
  const chartReqForTarget = getExpForLevel(targetLevel);
  const projectedExp = Math.max(chapter.exp, chartReqForTarget) + bonusExp;
  const projectedNext = calculateNextExp(targetLevel, projectedExp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirmLevelUp({
        chapter_id: chapter.id,
        add_levels: addLevels,
        add_str: addStr,
        add_con: addCon,
        add_int: addInt,
        add_lck: addLck,
        add_hp_max: addHpMax,
        add_mp_max: addMpMax,
        add_heart_max: addHeartMax,
        bonus_exp: bonusExp > 0 ? bonusExp : undefined,
      });
      onClose();
    } catch (err) {
      alert("Error leveling up: " + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ArrowUpCircle size={20} style={{ color: "#a855f7" }} /> LEVEL UP ALLOCATION
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Level Transition Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(138, 43, 226, 0.25) 0%, rgba(93, 21, 163, 0.35) 100%)",
                border: "1px solid #a855f7",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Current Level
                </span>
                <div style={{ fontFamily: "var(--font-title)", fontSize: "1.4rem", fontWeight: "bold", color: "#fff" }}>
                  Level {chapter.level}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>+ Levels:</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_LEVEL - chapter.level}
                  className="vital-input-tiny"
                  style={{ width: "55px", fontSize: "1rem", fontWeight: "bold" }}
                  value={addLevels}
                  onChange={(e) => setAddLevels(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-gold)", textTransform: "uppercase" }}>
                  New Level
                </span>
                <div style={{ fontFamily: "var(--font-title)", fontSize: "1.4rem", fontWeight: "bold", color: "var(--text-gold)" }}>
                  Level {targetLevel}
                </div>
              </div>
            </div>

            {/* EXP / NEXT Calculation Preview */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <span className="vital-label exp" style={{ fontSize: "0.75rem" }}>
                  <Zap size={13} /> PROJECTED EXP
                </span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: "bold", color: "#fff" }}>
                  {projectedExp.toLocaleString()}
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                  SotN Chart Min: {chartReqForTarget.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="vital-label exp" style={{ fontSize: "0.75rem" }}>
                  NEXT LEVEL REMAINING
                </span>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: "bold", color: "var(--color-exp)" }}>
                  {projectedNext.toLocaleString()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Bonus EXP:</span>
                  <input
                    type="number"
                    min={0}
                    className="vital-input-tiny"
                    style={{ width: "70px", fontSize: "0.75rem" }}
                    value={bonusExp}
                    onChange={(e) => setBonusExp(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>
              </div>
            </div>

            {/* Stat Points Allocation */}
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-gold)",
                  marginBottom: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>ASSIGN STAT POINTS</span>
                <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: "0.75rem" }}>
                  Add as many points as desired
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {/* STR */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "6px" }}>
                  <span className="stat-box-label">STR (+{addStr})</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddStr(Math.max(0, addStr - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      className="stat-box-input"
                      value={addStr}
                      onChange={(e) => setAddStr(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddStr(addStr + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {Math.min(255, chapter.str + addStr)}
                  </span>
                </div>

                {/* CON */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "6px" }}>
                  <span className="stat-box-label">CON (+{addCon})</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddCon(Math.max(0, addCon - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      className="stat-box-input"
                      value={addCon}
                      onChange={(e) => setAddCon(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddCon(addCon + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {Math.min(255, chapter.con + addCon)}
                  </span>
                </div>

                {/* INT */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "6px" }}>
                  <span className="stat-box-label">INT (+{addInt})</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddInt(Math.max(0, addInt - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      className="stat-box-input"
                      value={addInt}
                      onChange={(e) => setAddInt(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddInt(addInt + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {Math.min(255, chapter.int + addInt)}
                  </span>
                </div>

                {/* LCK */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "6px" }}>
                  <span className="stat-box-label">LCK (+{addLck})</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddLck(Math.max(0, addLck - 1))}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      className="stat-box-input"
                      value={addLck}
                      onChange={(e) => setAddLck(Math.max(0, parseInt(e.target.value) || 0))}
                    />
                    <button
                      type="button"
                      className="stat-stepper-btn"
                      onClick={() => setAddLck(addLck + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {Math.min(255, chapter.lck + addLck)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vital Max Growth */}
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                }}
              >
                VITAL MAX GROWTH
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {/* Max HP */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "4px" }}>
                  <span className="vital-label hp" style={{ fontSize: "0.75rem" }}>
                    <Heart size={12} /> MAX HP (+{addHpMax})
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="stat-box-input"
                    style={{ textAlign: "center", width: "60px" }}
                    value={addHpMax}
                    onChange={(e) => setAddHpMax(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {chapter.hp_max + addHpMax}
                  </span>
                </div>

                {/* Max MP */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "4px" }}>
                  <span className="vital-label mp" style={{ fontSize: "0.75rem" }}>
                    <Sparkles size={12} /> MAX MP (+{addMpMax})
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="stat-box-input"
                    style={{ textAlign: "center", width: "60px" }}
                    value={addMpMax}
                    onChange={(e) => setAddMpMax(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {chapter.mp_max + addMpMax}
                  </span>
                </div>

                {/* Max Heart */}
                <div className="stat-box" style={{ flexDirection: "column", gap: "4px" }}>
                  <span className="vital-label heart" style={{ fontSize: "0.75rem" }}>
                    <Flame size={12} /> MAX HEART (+{addHeartMax})
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="stat-box-input"
                    style={{ textAlign: "center", width: "60px" }}
                    value={addHeartMax}
                    onChange={(e) => setAddHeartMax(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                    New: {chapter.heart_max + addHeartMax}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontStyle: "italic" }}>
              * Changes to Level and Max Vitals/Stats will automatically ripple forward to all subsequent chapters.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: "linear-gradient(135deg, #8a2be2 0%, #5d15a3 100%)", borderColor: "#a855f7", color: "#fff" }}
              disabled={saving}
            >
              {saving ? "Applying..." : "Confirm & Level Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
