import React from "react";
import { Chapter } from "../types";
import { calculateNextExp } from "../expTable";
import {
  Heart,
  Sparkles,
  Flame,
  Shield,
  Coins,
  ArrowUpCircle,
  Zap,
  Pencil,
} from "lucide-react";

interface CharacterSidebarProps {
  characterName: string;
  chapter: Chapter;
  onUpdateChapterState: (updater: (prev: Chapter) => Chapter) => void;
  onOpenLevelUp: () => void;
  onRenameCharacter: () => void;
}

export const CharacterSidebar: React.FC<CharacterSidebarProps> = ({
  characterName,
  chapter,
  onUpdateChapterState,
  onOpenLevelUp,
  onRenameCharacter,
}) => {
  // Live calculated NEXT exp
  const nextExp = calculateNextExp(chapter.level, chapter.exp);

  const handleStatChange = (
    statKey: "str" | "con" | "int" | "lck",
    newVal: number
  ) => {
    const clamped = Math.max(0, Math.min(255, newVal));
    onUpdateChapterState((prev) => ({
      ...prev,
      [statKey]: clamped,
    }));
  };

  const handleCurrentVitalChange = (
    vitalKey: "hp_current" | "mp_current" | "heart_current",
    maxKey: "hp_max" | "mp_max" | "heart_max",
    val: number
  ) => {
    const maxVal = chapter[maxKey];
    const clamped = Math.max(0, Math.min(maxVal, val));
    onUpdateChapterState((prev) => ({
      ...prev,
      [vitalKey]: clamped,
    }));
  };

  const handleMaxVitalChange = (
    maxKey: "hp_max" | "mp_max" | "heart_max",
    curKey: "hp_current" | "mp_current" | "heart_current",
    val: number
  ) => {
    const clampedMax = Math.max(1, Math.min(999999, val));
    onUpdateChapterState((prev) => ({
      ...prev,
      [maxKey]: clampedMax,
      [curKey]: Math.min(prev[curKey], clampedMax),
    }));
  };

  const handleGoldChange = (val: number) => {
    const clamped = Math.max(0, Math.min(999999, val));
    onUpdateChapterState((prev) => ({
      ...prev,
      gold: clamped,
    }));
  };

  const handleExpChange = (val: number) => {
    const clamped = Math.max(0, val);
    const updatedNext = calculateNextExp(chapter.level, clamped);
    onUpdateChapterState((prev) => ({
      ...prev,
      exp: clamped,
      next_exp: updatedNext,
    }));
  };

  const hpPercent = Math.min(100, Math.max(0, (chapter.hp_current / Math.max(1, chapter.hp_max)) * 100));
  const mpPercent = Math.min(100, Math.max(0, (chapter.mp_current / Math.max(1, chapter.mp_max)) * 100));
  const heartPercent = Math.min(100, Math.max(0, (chapter.heart_current / Math.max(1, chapter.heart_max)) * 100));

  return (
    <aside className="sidebar-panel">
      {/* Hero Badge */}
      <div className="char-hero-card">
        <div className="char-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
            <div className="char-name-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {characterName}
            </div>
            <button
              type="button"
              className="btn-ghost"
              style={{ padding: "3px 4px", color: "var(--text-muted)", flexShrink: 0 }}
              title="Rename Character"
              onClick={onRenameCharacter}
            >
              <Pencil size={13} />
            </button>
          </div>
          <div className="char-level-badge" style={{ flexShrink: 0 }}>
            <Shield size={13} /> LVL {chapter.level}
          </div>
        </div>

        <button className="level-up-btn" onClick={onOpenLevelUp}>
          <ArrowUpCircle size={18} /> LEVEL UP
        </button>
      </div>

      {/* Vitals: HP, MP, HEART */}
      <div className="vitals-group">
        {/* HP */}
        <div className="vital-card">
          <div className="vital-meta">
            <span className="vital-label hp">
              <Heart size={14} /> HP
            </span>
            <div className="vital-values">
              <input
                type="number"
                className="vital-input-tiny"
                value={chapter.hp_current}
                onChange={(e) =>
                  handleCurrentVitalChange("hp_current", "hp_max", parseInt(e.target.value) || 0)
                }
              />
              <span style={{ color: "var(--text-dim)" }}>/</span>
              <input
                type="number"
                className="vital-input-tiny"
                value={chapter.hp_max}
                onChange={(e) =>
                  handleMaxVitalChange("hp_max", "hp_current", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>
          <div className="vital-bar-track">
            <div className="vital-bar-fill hp" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>

        {/* MP */}
        <div className="vital-card">
          <div className="vital-meta">
            <span className="vital-label mp">
              <Sparkles size={14} /> MP
            </span>
            <div className="vital-values">
              <input
                type="number"
                className="vital-input-tiny"
                value={chapter.mp_current}
                onChange={(e) =>
                  handleCurrentVitalChange("mp_current", "mp_max", parseInt(e.target.value) || 0)
                }
              />
              <span style={{ color: "var(--text-dim)" }}>/</span>
              <input
                type="number"
                className="vital-input-tiny"
                value={chapter.mp_max}
                onChange={(e) =>
                  handleMaxVitalChange("mp_max", "mp_current", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>
          <div className="vital-bar-track">
            <div className="vital-bar-fill mp" style={{ width: `${mpPercent}%` }} />
          </div>
        </div>

        {/* HEART */}
        <div className="vital-card">
          <div className="vital-meta">
            <span className="vital-label heart">
              <Flame size={14} /> HEART
            </span>
            <div className="vital-values">
              <input
                type="number"
                className="vital-input-tiny"
                value={chapter.heart_current}
                onChange={(e) =>
                  handleCurrentVitalChange("heart_current", "heart_max", parseInt(e.target.value) || 0)
                }
              />
              <span style={{ color: "var(--text-dim)" }}>/</span>
              <input
                type="number"
                className="vital-input-tiny"
                value={chapter.heart_max}
                onChange={(e) =>
                  handleMaxVitalChange("heart_max", "heart_current", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>
          <div className="vital-bar-track">
            <div className="vital-bar-fill heart" style={{ width: `${heartPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Core Attributes (0-255) */}
      <div className="attributes-card">
        <div className="card-title">
          <span>ATTRIBUTES</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>0 - 255</span>
        </div>

        <div className="stats-grid">
          {/* STR */}
          <div className="stat-box">
            <span className="stat-box-label">STR</span>
            <div className="stat-box-val-controls">
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("str", chapter.str - 1)}
              >
                -
              </button>
              <input
                type="number"
                className="stat-box-input"
                value={chapter.str}
                onChange={(e) => handleStatChange("str", parseInt(e.target.value) || 0)}
              />
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("str", chapter.str + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* CON */}
          <div className="stat-box">
            <span className="stat-box-label">CON</span>
            <div className="stat-box-val-controls">
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("con", chapter.con - 1)}
              >
                -
              </button>
              <input
                type="number"
                className="stat-box-input"
                value={chapter.con}
                onChange={(e) => handleStatChange("con", parseInt(e.target.value) || 0)}
              />
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("con", chapter.con + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* INT */}
          <div className="stat-box">
            <span className="stat-box-label">INT</span>
            <div className="stat-box-val-controls">
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("int", chapter.int - 1)}
              >
                -
              </button>
              <input
                type="number"
                className="stat-box-input"
                value={chapter.int}
                onChange={(e) => handleStatChange("int", parseInt(e.target.value) || 0)}
              />
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("int", chapter.int + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* LCK */}
          <div className="stat-box">
            <span className="stat-box-label">LCK</span>
            <div className="stat-box-val-controls">
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("lck", chapter.lck - 1)}
              >
                -
              </button>
              <input
                type="number"
                className="stat-box-input"
                value={chapter.lck}
                onChange={(e) => handleStatChange("lck", parseInt(e.target.value) || 0)}
              />
              <button
                className="stat-stepper-btn"
                onClick={() => handleStatChange("lck", chapter.lck + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progression & Economy */}
      <div className="attributes-card">
        <div className="card-title">
          <span>PROGRESSION</span>
          <Zap size={14} style={{ color: "var(--color-exp)" }} />
        </div>

        {/* EXP & NEXT */}
        <div className="progression-row">
          <div className="progression-box">
            <span className="vital-label exp">EXP</span>
            <input
              type="number"
              className="vital-input-tiny"
              style={{ width: "100%", textAlign: "left", fontSize: "0.95rem" }}
              value={chapter.exp}
              onChange={(e) => handleExpChange(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="progression-box">
            <span className="vital-label exp">NEXT</span>
            <span className="progression-val" style={{ color: "var(--color-exp)" }}>
              {nextExp.toLocaleString()}
            </span>
          </div>
        </div>

        {/* GOLD */}
        <div className="progression-box" style={{ marginTop: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="vital-label gold">
              <Coins size={14} /> GOLD
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Max 999,999</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <input
              type="number"
              className="vital-input-tiny"
              style={{ width: "100%", textAlign: "left", fontSize: "1rem", color: "var(--text-gold)" }}
              value={chapter.gold}
              max={999999}
              min={0}
              onChange={(e) => handleGoldChange(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};
