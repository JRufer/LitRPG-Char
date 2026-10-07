import React, { useState, useEffect, useRef } from "react";
import { Edit3, X } from "lucide-react";

interface RenameModalProps {
  isOpen: boolean;
  title: string;
  itemType: "Character" | "Book";
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  title,
  itemType,
  currentName,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      // Select input content on open
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || clean === currentName) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onConfirm(clean);
      onClose();
    } catch (err) {
      alert(`Failed to rename ${itemType.toLowerCase()}: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 250 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", width: "100%" }}
      >
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Edit3 size={18} style={{ color: "var(--text-gold)" }} />
            <span>{title}</span>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ gap: "14px" }}>
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--text-gold)" }}>
                New {itemType} Name
              </label>
              <input
                ref={inputRef}
                type="text"
                required
                className="form-input"
                style={{ fontSize: "1.05rem" }}
                value={name}
                placeholder={`Enter new ${itemType.toLowerCase()} name`}
                onChange={(e) => setName(e.target.value)}
              />
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
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving..." : "Save Name"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
