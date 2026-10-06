import React, { useState } from "react";
import { Familiar } from "../types";
import { Plus, Trash2, Bird, CheckCircle2, Circle } from "lucide-react";

interface FamiliarsPanelProps {
  familiars: Familiar[];
  onChange: (familiars: Familiar[]) => void;
}

export const FamiliarsPanel: React.FC<FamiliarsPanelProps> = ({
  familiars,
  onChange,
}) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFamiliar: Familiar = {
      id: `fam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: desc.trim(),
      is_equipped: false,
    };
    onChange([...familiars, newFamiliar]);
    setName("");
    setDesc("");
  };

  const handleRemove = (id: string) => {
    onChange(familiars.filter((f) => f.id !== id));
  };

  const handleToggleEquip = (id: string) => {
    // One or none equipped
    onChange(
      familiars.map((f) => {
        if (f.id === id) {
          return { ...f, is_equipped: !f.is_equipped };
        } else {
          return { ...f, is_equipped: false };
        }
      })
    );
  };

  const handleUpdate = (id: string, newName: string, newDesc: string) => {
    onChange(
      familiars.map((f) => (f.id === id ? { ...f, name: newName, description: newDesc } : f))
    );
  };

  const equippedCount = familiars.filter((f) => f.is_equipped).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="card-title">
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bird size={18} style={{ color: "var(--color-heart)" }} /> FAMILIAR COMPANIONS
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {familiars.length} Known ({equippedCount > 0 ? "1 Active" : "None Active"})
        </span>
      </div>

      {/* Add Familiar Form */}
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
            placeholder="Familiar Name (e.g. Bat, Ghost, Faerie, Demon, Sword)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            <Plus size={16} /> Summon Familiar
          </button>
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="Specialty / Behavior (e.g. Heals user when low HP, attacks flying foes)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </form>

      {/* Familiars Grid */}
      {familiars.length === 0 ? (
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
          No familiars summoned yet for this chapter. Form a contract above!
        </div>
      ) : (
        <div className="cards-grid">
          {familiars.map((fam) => (
            <div
              key={fam.id}
              className={`lore-card ${fam.is_equipped ? "equipped" : ""}`}
            >
              <div className="lore-card-header">
                <input
                  type="text"
                  className="slot-input"
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: fam.is_equipped ? "var(--text-gold)" : "var(--color-heart)",
                  }}
                  value={fam.name}
                  onChange={(e) => handleUpdate(fam.id, e.target.value, fam.description)}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ color: "var(--color-danger)", padding: "4px" }}
                  onClick={() => handleRemove(fam.id)}
                  title="Dismiss familiar"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <textarea
                className="form-textarea"
                style={{ minHeight: "50px", fontSize: "0.8rem", padding: "6px" }}
                value={fam.description}
                placeholder="Familiar actions and traits..."
                onChange={(e) => handleUpdate(fam.id, fam.name, e.target.value)}
              />

              <div className="lore-card-footer">
                <button
                  type="button"
                  className={fam.is_equipped ? "btn btn-primary" : "btn btn-secondary"}
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  onClick={() => handleToggleEquip(fam.id)}
                >
                  {fam.is_equipped ? (
                    <>
                      <CheckCircle2 size={14} /> Active Companion
                    </>
                  ) : (
                    <>
                      <Circle size={14} /> Set as Active
                    </>
                  )}
                </button>

                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  {fam.is_equipped ? "Equipped" : "Resting"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
