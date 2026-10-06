import React, { useState } from "react";
import { Relic } from "../types";
import { Plus, Trash2, Award, Zap } from "lucide-react";

interface RelicsPanelProps {
  relics: Relic[];
  onChange: (relics: Relic[]) => void;
}

export const RelicsPanel: React.FC<RelicsPanelProps> = ({ relics, onChange }) => {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRelic: Relic = {
      id: `relic_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: desc.trim(),
    };
    onChange([...relics, newRelic]);
    setName("");
    setDesc("");
  };

  const handleRemove = (id: string) => {
    onChange(relics.filter((r) => r.id !== id));
  };

  const handleUpdate = (id: string, newName: string, newDesc: string) => {
    onChange(
      relics.map((r) => (r.id === id ? { ...r, name: newName, description: newDesc } : r))
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="card-title">
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Award size={18} style={{ color: "var(--text-gold)" }} /> ANCIENT RELICS
        </span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {relics.length} Collected
        </span>
      </div>

      {/* Add Relic Form */}
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
            placeholder="Relic Name (e.g. Leap Stone, Cube of Zoe, Holy Glasses)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            <Plus size={16} /> Attune Relic
          </button>
        </div>
        <input
          type="text"
          className="form-input"
          placeholder="Relic Power / Passive Ability (e.g. Allows double jumping in mid-air)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </form>

      {/* Relic Cards Grid */}
      {relics.length === 0 ? (
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
          No relics in possession for this chapter. Attune your first relic above!
        </div>
      ) : (
        <div className="cards-grid">
          {relics.map((relic) => (
            <div key={relic.id} className="lore-card">
              <div className="lore-card-header">
                <input
                  type="text"
                  className="slot-input"
                  style={{
                    fontFamily: "var(--font-title)",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "var(--text-gold)",
                  }}
                  value={relic.name}
                  onChange={(e) => handleUpdate(relic.id, e.target.value, relic.description)}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ color: "var(--color-danger)", padding: "4px" }}
                  onClick={() => handleRemove(relic.id)}
                  title="Discard relic"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <textarea
                className="form-textarea"
                style={{ minHeight: "50px", fontSize: "0.8rem", padding: "6px" }}
                value={relic.description}
                placeholder="Passive power description..."
                onChange={(e) => handleUpdate(relic.id, relic.name, e.target.value)}
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
                  <Zap size={12} style={{ color: "var(--text-gold)" }} /> Passive Artifact
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
