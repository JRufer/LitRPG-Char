import React, { useState } from "react";
import { ExportData } from "../types";
import { Download, Upload, Copy, Check, X, FileText } from "lucide-react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<ExportData>;
  onImport: (data: ExportData) => Promise<number>;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportedJson, setExportedJson] = useState<string>("");
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  if (!isOpen) return null;

  const handleGenerateExport = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const data = await onExport();
      const formatted = JSON.stringify(data, null, 2);
      setExportedJson(formatted);
    } catch (err) {
      setStatusMsg("Failed to export: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!exportedJson) return;
    const blob = new Blob([exportedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `litrpg_codex_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    if (!exportedJson) return;
    navigator.clipboard.writeText(exportedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importJsonText.trim()) {
      setStatusMsg("Please choose a file or paste JSON text first.");
      return;
    }

    setLoading(true);
    setStatusMsg("");
    try {
      const parsed: ExportData = JSON.parse(importJsonText);
      if (!parsed.books || !Array.isArray(parsed.books)) {
        throw new Error("Invalid structure: missing 'books' array");
      }
      const count = await onImport(parsed);
      setStatusMsg(`Successfully imported ${count} chapters!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMsg("Import Error: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <div className="modal-header">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={20} style={{ color: "var(--text-gold)" }} /> JSON BACKUP & RESTORE
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border-subtle)", padding: "0 20px" }}>
          <button
            type="button"
            className={`tab-btn ${activeTab === "export" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("export");
              if (!exportedJson) handleGenerateExport();
            }}
          >
            <Download size={15} /> Export Codex
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "import" ? "active" : ""}`}
            onClick={() => setActiveTab("import")}
          >
            <Upload size={15} /> Import Codex
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "export" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Export all books, characters, chapters, equipment, and inventories as a single JSON file.
              </p>

              {!exportedJson ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleGenerateExport}
                  disabled={loading}
                  style={{ alignSelf: "flex-start" }}
                >
                  <Download size={16} /> Generate Export JSON
                </button>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="button" className="btn btn-primary" onClick={handleDownloadFile}>
                      <Download size={16} /> Download .json File
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleCopyClipboard}>
                      {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} />}
                      {copied ? "Copied!" : "Copy to Clipboard"}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    className="form-textarea"
                    style={{ minHeight: "220px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                    value={exportedJson}
                  />
                </>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Load a previously saved LitRPG character backup file into the internal database.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                  <Upload size={16} /> Choose .json File
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  or paste the raw JSON text below
                </span>
              </div>

              <textarea
                className="form-textarea"
                placeholder="Paste JSON structure here..."
                style={{ minHeight: "220px", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExecuteImport}
                disabled={loading || !importJsonText.trim()}
                style={{ alignSelf: "flex-start" }}
              >
                {loading ? "Importing..." : "Execute Import"}
              </button>
            </div>
          )}

          {statusMsg && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                background: statusMsg.includes("Error") ? "rgba(230, 57, 70, 0.2)" : "rgba(46, 196, 182, 0.2)",
                color: statusMsg.includes("Error") ? "#ff6b77" : "var(--color-success)",
                fontSize: "0.85rem",
              }}
            >
              {statusMsg}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
