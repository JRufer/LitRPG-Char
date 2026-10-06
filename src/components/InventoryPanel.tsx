import React, { useState } from "react";
import { InventoryItem } from "../types";
import { Plus, Trash2, Search, Package } from "lucide-react";

interface InventoryPanelProps {
  inventory: InventoryItem[];
  onChange: (inventory: InventoryItem[]) => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  inventory,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemCount, setNewItemCount] = useState<number>(1);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    if (inventory.length >= 255) {
      alert("Inventory is at maximum capacity (255 listings).");
      return;
    }

    // Check if item already exists: stack it!
    const existingIndex = inventory.findIndex(
      (it) => it.name.trim().toLowerCase() === newItemName.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...inventory];
      const newCount = Math.min(255, updated[existingIndex].count + newItemCount);
      updated[existingIndex] = { ...updated[existingIndex], count: newCount };
      onChange(updated);
    } else {
      const newItem: InventoryItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: newItemName.trim(),
        count: Math.min(255, Math.max(1, newItemCount)),
      };
      onChange([...inventory, newItem]);
    }

    setNewItemName("");
    setNewItemCount(1);
  };

  const handleUpdateCount = (index: number, newCount: number) => {
    if (newCount <= 0) {
      handleRemoveItem(index);
      return;
    }
    const clamped = Math.min(255, Math.max(1, newCount));
    const updated = [...inventory];
    updated[index] = { ...updated[index], count: clamped };
    onChange(updated);
  };

  const handleUpdateName = (index: number, newName: string) => {
    const updated = [...inventory];
    updated[index] = { ...updated[index], name: newName };
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = inventory.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const filteredItems = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inventory-section">
      <div className="inventory-header">
        <div className="card-title" style={{ gap: "10px" }}>
          <span>INVENTORY</span>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-main)",
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              fontWeight: 500,
            }}
          >
            {inventory.length} / 255 Listings
          </span>
        </div>

        <div className="inventory-controls">
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-dim)",
              }}
            />
            <input
              type="text"
              placeholder="Search items..."
              className="search-input"
              style={{ paddingLeft: "32px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Add Item Bar */}
      <form
        onSubmit={handleAddItem}
        style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          alignItems: "center",
        }}
      >
        <Package size={18} style={{ color: "var(--text-gold)", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="New Item Name (e.g. High Potion)"
          className="form-input"
          style={{ flex: 1, padding: "6px 10px" }}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Qty:</span>
          <input
            type="number"
            min={1}
            max={255}
            className="vital-input-tiny"
            value={newItemCount}
            onChange={(e) => setNewItemCount(parseInt(e.target.value) || 1)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: "6px 12px" }}
          disabled={!newItemName.trim() || inventory.length >= 255}
        >
          <Plus size={15} /> Add
        </button>
      </form>

      {/* Inventory Listings Table */}
      <div className="inventory-table-container">
        {filteredItems.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--text-dim)",
              fontSize: "0.9rem",
            }}
          >
            {inventory.length === 0
              ? "Inventory is empty. Add your first item above!"
              : "No items match your search filter."}
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th style={{ width: "60%" }}>Item Name</th>
                <th style={{ width: "25%", textAlign: "center" }}>Stack Count (1-255)</th>
                <th style={{ width: "15%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const originalIndex = inventory.indexOf(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        className="slot-input"
                        value={item.name}
                        onChange={(e) => handleUpdateName(originalIndex, e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div className="item-count-stepper">
                        <button
                          type="button"
                          className="item-count-btn"
                          onClick={() => handleUpdateCount(originalIndex, item.count - 1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={255}
                          className="item-count-input"
                          value={item.count}
                          onChange={(e) =>
                            handleUpdateCount(originalIndex, parseInt(e.target.value) || 1)
                          }
                        />
                        <button
                          type="button"
                          className="item-count-btn"
                          onClick={() => handleUpdateCount(originalIndex, item.count + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: "4px 8px", color: "var(--color-danger)" }}
                        title="Remove item"
                        onClick={() => handleRemoveItem(originalIndex)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
