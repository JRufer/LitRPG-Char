import React from "react";
import { Equipment } from "../types";
import {
  Sword,
  Shield,
  Crown,
  Shirt,
  Wind,
  Gem,
} from "lucide-react";

interface EquipmentPanelProps {
  equipment: Equipment;
  onChange: (equipment: Equipment) => void;
}

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({
  equipment,
  onChange,
}) => {
  const handleSlotChange = (slot: keyof Equipment, val: string) => {
    onChange({
      ...equipment,
      [slot]: val,
    });
  };

  const slots: { key: keyof Equipment; label: string; icon: React.ReactNode; placeholder: string }[] = [
    { key: "right_hand", label: "Right Hand", icon: <Sword size={20} />, placeholder: "e.g. Vorpal Blade" },
    { key: "left_hand", label: "Left Hand", icon: <Shield size={20} />, placeholder: "e.g. Aegis Shield" },
    { key: "head", label: "Head", icon: <Crown size={20} />, placeholder: "e.g. Circlet of Wisdom" },
    { key: "armor", label: "Armor", icon: <Shirt size={20} />, placeholder: "e.g. Dragonscale Mail" },
    { key: "cloak", label: "Cloak", icon: <Wind size={20} />, placeholder: "e.g. Shadow Mantle" },
    { key: "accessory", label: "Accessory", icon: <Gem size={20} />, placeholder: "e.g. Ring of Regeneration" },
  ];

  return (
    <div className="equipment-section">
      <div className="card-title">
        <span>EQUIPPED GEAR</span>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-main)" }}>
          6 Active Slots
        </span>
      </div>

      <div className="equipment-grid">
        {slots.map((slot) => (
          <div key={slot.key} className="equip-slot-card">
            <div className="slot-icon-box">{slot.icon}</div>
            <div className="slot-info">
              <span className="slot-name">{slot.label}</span>
              <input
                type="text"
                className="slot-input"
                placeholder={slot.placeholder}
                value={equipment[slot.key]}
                onChange={(e) => handleSlotChange(slot.key, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
