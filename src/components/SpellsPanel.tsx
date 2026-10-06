import React, { useState } from "react";
import { Spell } from "../types";
import { Plus, Trash2, Wand2, Sparkles } from "lucide-react";

interface SpellsPanelProps {
  spells: Spell[];
  onChange: (spells: Spell[]) => void;
}

export const SpellsPanel: React.FC<SpellsPanelProps> = ({ spells, onChange }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSpell: Spell = {
      id: `spell_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: desc.trim(),
    };
    onChange([...spells, newSpell]);
    setName("");
    setDesc("");
  };

  const handleRemove = (id: string) => {
    onChange(spells.filter((s) => s.id !== id));
  };

  const handleUpdate = (id: string, newName: string, newDesc: string) => {
    onChange(
      spells.map((s) => (s.id === id ? { ...s, name: newName, description: newDesc } : s))
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="card-title">
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Wand2 size={18} style={{ color: "var(--color-mp)" }} /> GRIMOIRE OF SPELLS
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {spells.length} Inscribed
        </span>
      </div>

      {/* Add Spell Form */}
      <form
        onSubmit={handleAdd}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          padding: "16px",
          borderRadius: "var(--radius-md)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Spell Name (e.g. Hellfire, Soul Steal, Mana Shield)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            <Plus size={16} /> Learn Spell
          </button>
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="Incantation / Effect Description (e.g. 50 MP: Summons demonic meteors)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </form>

      {/* Spell Cards Grid */}
      {spells.length === 0 ? (
        <div
          style={{
            padding: "50px",
            textAlign: "center",
            color: "var(--text-dim)",
            background: "var(--bg-card)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-subtle)",
          }}
        >
          No spells recorded for this chapter yet. Add one above!
        </div>
      ) : (
        <div className="cards-grid">
          {spells.map((spell) => (
            <div key={spell.id} className="lore-card">
              <div className="lore-card-header">
                <input
                  type="text"
                  className="slot-input"
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "var(--color-mp)",
                  }}
                  value={spell.name}
                  onChange={(e) => handleUpdate(spell.id, e.target.value, spell.description)}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ color: "var(--color-danger)", padding: "4px" }}
                  onClick={() => handleRemove(spell.id)}
                  title="Forget spell"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                className="form-textarea"
                style={{ minHeight: "50px", fontSize: "0.8rem", padding: "6px" }}
                value={spell.description}
                placeholder="Effect details..."
                onChange={(e) => handleUpdate(spell.id, spell.name, e.target.value)}
              />
              <div className="lore-card-footer">
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Sparkles size={12} style={{ color: "var(--color-mp)" }} /> Magic Art
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
