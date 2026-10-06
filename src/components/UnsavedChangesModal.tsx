import React from "react";
import { AlertTriangle, Save, Trash2, X } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  chapterTitle: string;
  onSaveAndProceed: () => Promise<void>;
  onDiscardAndProceed: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  chapterTitle,
  onSaveAndProceed,
  onDiscardAndProceed,
  onCancel,
  isSaving,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 300 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", border: "1px solid rgba(255, 183, 3, 0.4)" }}
      >
        <div className="modal-header" style={{ background: "rgba(255, 183, 3, 0.1)" }}>
          <div
            className="modal-title"
            style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-gold)" }}
          >
            <AlertTriangle size={22} color="var(--color-gold)" />
            <span>UNSAVED CHANGES</span>
          </div>
          <button className="btn-ghost" onClick={onCancel} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: "12px", padding: "20px" }}>
          <p style={{ fontSize: "0.95rem", color: "#fff", fontWeight: 600 }}>
            You have unsaved changes in <span style={{ color: "var(--text-gold)" }}>{chapterTitle}</span>.
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            If you navigate away now without saving, any modifications to stats, equipment, or inventory will be lost.
          </p>
        </div>

        <div className="modal-footer" style={{ gap: "10px", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onDiscardAndProceed}
            disabled={isSaving}
          >
            <Trash2 size={15} /> Discard Changes
          </button>
          <button
            type="button"
            className="btn btn-save"
            onClick={onSaveAndProceed}
            disabled={isSaving}
          >
            <Save size={15} /> {isSaving ? "Saving..." : "Save & Proceed"}
          </button>
        </div>
      </div>
    </div>
  );
};
