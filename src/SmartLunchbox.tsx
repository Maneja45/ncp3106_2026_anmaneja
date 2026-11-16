
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Info,
  Plus,
  RefreshCcw,
  Scale,
  Search,
  UtensilsCrossed,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type Food = {
  id: string;
  name: string;
  category: string;
  calories: number;
  sugar: number;
  sodium: number;
  emoji: string;
};

type Compartment = {
  id: number;
  food: Food | null;
  weight: number;
};

type Nutrition = {
  calories: number;
  sugar: number;
  sodium: number;
};

type NutritionTotals = Nutrition & {
  weight: number;
};

/* =========================================================
   FOOD CATALOG
   Estimated values per 100 grams
========================================================= */

const foods: Food[] = [
  { id: "rice", name: "White Rice", category: "Rice & Grains", calories: 130, sugar: 0.1, sodium: 1, emoji: "🍚" },
  { id: "brown-rice", name: "Brown Rice", category: "Rice & Grains", calories: 123, sugar: 0.4, sodium: 4, emoji: "🍚" },
  { id: "adobo", name: "Chicken Adobo", category: "Filipino Dishes", calories: 190, sugar: 1.5, sodium: 600, emoji: "🍗" },
  { id: "tinola", name: "Chicken Tinola", category: "Filipino Dishes", calories: 85, sugar: 0.8, sodium: 280, emoji: "🍲" },
  { id: "sinigang", name: "Sinigang", category: "Filipino Dishes", calories: 75, sugar: 1.2, sodium: 350, emoji: "🥣" },
  { id: "egg", name: "Boiled Egg", category: "Protein", calories: 155, sugar: 1.1, sodium: 124, emoji: "🥚" },
  { id: "broccoli", name: "Steamed Broccoli", category: "Vegetables", calories: 35, sugar: 1.4, sodium: 33, emoji: "🥦" },
  { id: "carrots", name: "Steamed Carrots", category: "Vegetables", calories: 35, sugar: 3.5, sodium: 58, emoji: "🥕" },
  { id: "banana", name: "Banana", category: "Fruits", calories: 89, sugar: 12.2, sodium: 1, emoji: "🍌" },
  { id: "apple", name: "Apple", category: "Fruits", calories: 52, sugar: 10.4, sodium: 1, emoji: "🍎" },
];

const emptyCompartments = (): Compartment[] => [
  { id: 1, food: null, weight: 0 },
  { id: 2, food: null, weight: 0 },
  { id: 3, food: null, weight: 0 },
];

function calculateNutrition(
  food: Food,
  weight: number
): Nutrition {
  const multiplier = weight / 100;

  return {
    calories: food.calories * multiplier,
    sugar: food.sugar * multiplier,
    sodium: food.sodium * multiplier,
  };
}

function formatNumber(
  value: number,
  decimals = 0
): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  });
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SmartLunchbox() {
  const [compartments, setCompartments] =
    useState<Compartment[]>(emptyCompartments);

  const [activeCompartment, setActiveCompartment] =
    useState<number | null>(null);

  const [selectedFood, setSelectedFood] =
    useState<Food | null>(null);

  const [search, setSearch] = useState("");
  const [demoWeight, setDemoWeight] = useState(150);
  const [demoConnected, setDemoConnected] = useState(false);
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(false);
  const [notification, setNotification] = useState("");

  const deviceMenuRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const filledCount = compartments.filter(
    (item) => item.food !== null
  ).length;

  const totals: NutritionTotals = compartments.reduce(
    (total, compartment) => {
      if (!compartment.food) return total;

      const nutrition = calculateNutrition(
        compartment.food,
        compartment.weight
      );

      return {
        calories: total.calories + nutrition.calories,
        sugar: total.sugar + nutrition.sugar,
        sodium: total.sodium + nutrition.sodium,
        weight: total.weight + compartment.weight,
      };
    },
    {
      calories: 0,
      sugar: 0,
      sodium: 0,
      weight: 0,
    }
  );

  const filteredFoods = foods.filter((food) =>
    `${food.name} ${food.category}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const selectedNutrition = selectedFood
    ? calculateNutrition(selectedFood, demoWeight)
    : null;

  /* =========================================================
     EFFECTS
  ========================================================= */

  useEffect(() => {
    if (!deviceMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        deviceMenuRef.current &&
        !deviceMenuRef.current.contains(event.target as Node)
      ) {
        setDeviceMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [deviceMenuOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveCompartment(null);
        setSelectedFood(null);
        setDeviceMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timer = window.setTimeout(() => {
      setNotification("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notification]);

  /* =========================================================
     ACTIONS
  ========================================================= */

  const openPicker = (id: number): void => {
    const compartment = compartments.find(
      (item) => item.id === id
    );

    setActiveCompartment(id);
    setSelectedFood(compartment?.food ?? null);
    setDemoWeight(compartment?.weight || 150);
    setSearch("");
  };

  const closePicker = (): void => {
    setActiveCompartment(null);
    setSelectedFood(null);
  };

  const saveFood = (): void => {
    if (activeCompartment === null || !selectedFood) {
      return;
    }

    const id = activeCompartment;
    const food = selectedFood;
    const weight = demoWeight;

    setCompartments((previous) =>
      previous.map((compartment) =>
        compartment.id === id
          ? { ...compartment, food, weight }
          : compartment
      )
    );

    closePicker();
    setNotification(`Food saved to Compartment ${id}.`);
  };

  const clearCompartment = (id: number): void => {
    setCompartments((previous) =>
      previous.map((compartment) =>
        compartment.id === id
          ? { ...compartment, food: null, weight: 0 }
          : compartment
      )
    );

    setNotification(`Compartment ${id} cleared.`);
  };

  const clearAll = (): void => {
    setCompartments(emptyCompartments());
    setNotification("Lunchbox preview cleared.");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <motion.div
      className="smart-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <style>{`
        /* =================================================
           BASE
        ================================================= */

        .smart-page,
        .smart-page * {
          box-sizing: border-box;
        }

        .smart-page {
          --sb-green: #45634d;
          --sb-dark-green: #344f3c;
          --sb-border: var(--border, #e4eae2);
          --sb-surface: var(--surface, #ffffff);
          --sb-background: var(--bg, #f5f7f3);
          --sb-text: var(--text, #243e32);
          --sb-muted: var(--muted, #819086);

          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;
          gap: 12px;

          padding: 0 4px 8px;
          overflow: auto;

          color: var(--sb-text);
          font-family: "DM Sans", sans-serif;
        }

        .smart-page button,
        .smart-page input {
          font-family: inherit;
        }

        .smart-page button {
          cursor: pointer;
        }

        .smart-page button:focus-visible {
          outline: 3px solid #91b69a;
          outline-offset: 2px;
        }

        .smart-card {
          min-width: 0;
          min-height: 0;

          background: var(--sb-surface);
          border: 1px solid var(--sb-border);
          border-radius: 19px;
        }

        .smart-muted {
          margin: 0;
          color: var(--sb-muted);
          font-size: 11px;
          line-height: 1.4;
        }

        .smart-title,
        .smart-panel-title,
        .smart-modal-title {
          font-family: Georgia, "Times New Roman", serif;
          letter-spacing: -0.6px;
        }

        .smart-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          padding: 8px 11px;

          border: 1px solid var(--sb-border);
          border-radius: 9px;

          background: var(--sb-surface);
          color: var(--sb-text);

          font-size: 11px;
          font-weight: 750;

          transition:
            background 0.2s ease,
            transform 0.2s ease;
        }

        .smart-button:hover {
          transform: translateY(-1px);
        }

        .smart-button-primary {
          background: var(--sb-green);
          border-color: var(--sb-green);
          color: #ffffff;
        }

        .smart-button-primary:hover {
          background: var(--sb-dark-green);
        }

        .smart-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* =================================================
           HEADER
        ================================================= */

        .smart-header {
          flex: 0 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;

          padding: 2px 4px 4px;

          position: relative;
          z-index: 20;
        }

        .smart-eyebrow {
          margin: 0 0 4px;
          color: var(--sb-green);

          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.2px;
        }

        .smart-title {
          margin: 0 0 5px;
          font-size: clamp(23px, 2vw, 30px);
          line-height: 1.1;
        }

        /* =================================================
           DEVICE CONNECTION
        ================================================= */

        .smart-device-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .smart-device-trigger {
          display: flex;
          align-items: center;
          gap: 9px;

          min-height: 40px;
          padding: 9px 12px;

          border: 1px solid var(--sb-border);
          border-radius: 12px;

          background: var(--sb-surface);
          color: var(--sb-text);

          font-size: 11px;
          font-weight: 750;
        }

        .smart-device-dropdown {
          position: absolute;
          top: calc(100% + 9px);
          right: 0;

          width: 420px;
          max-width: calc(100vw - 32px);

          padding: 17px;

          background: var(--sb-surface);
          border: 1px solid var(--sb-border);
          border-radius: 18px;

          box-shadow:
            0 20px 55px rgba(20, 38, 26, 0.16);

          z-index: 100;
        }

        .smart-device-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .smart-device-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 7px 10px;
          border-radius: 99px;

          background: var(--sb-background);
          color: var(--sb-muted);

          font-size: 10px;
          font-weight: 750;
        }

        .smart-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #bd5252;
        }

        .smart-status-dot.online {
          background: #5b9b6b;
        }

        .smart-device-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }

        .smart-device-tile {
          min-height: 145px;

          display: flex;
          flex-direction: column;
          gap: 8px;

          padding: 13px;

          border: 1px solid var(--sb-border);
          border-radius: 13px;
          background: var(--sb-background);
        }

        .smart-device-tile-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: var(--sb-green);
        }

        .smart-device-value {
          font-size: 26px;
          font-weight: 850;
        }

        .smart-device-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 14px;
        }

        /* =================================================
           MAIN LAYOUT

           TOP: Taller lunchbox
           BOTTOM: Two equal cards
        ================================================= */

        .smart-layout {
          flex: 1 1 auto;
          min-width: 0;
          width: 100%;

          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          grid-template-rows:
            minmax(460px, 1.5fr)
            minmax(250px, 1fr);

          gap: 13px;
        }

        .smart-panel {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;
          gap: 10px;

          padding: 15px 18px;
          overflow: hidden;
        }

        .smart-panel-heading {
          flex: 0 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .smart-panel-title {
          margin: 0 0 4px;

          font-size: clamp(19px, 1.5vw, 24px);
          line-height: 1.15;
        }

        .smart-panel-subtitle {
          margin: 0;
          color: var(--sb-muted);

          font-size: 11px;
          line-height: 1.4;
        }

        .smart-panel-icon {
          flex-shrink: 0;

          width: 34px;
          height: 34px;

          display: grid;
          place-items: center;

          border-radius: 10px;

          background: var(--sb-background);
          color: var(--sb-green);
        }

        /* =================================================
           TALLER LUNCHBOX SECTION
        ================================================= */

        .smart-lunchbox-panel {
          grid-column: 1 / -1;

          padding: 15px 18px 12px;
          gap: 10px;
        }

        .smart-lunchbox-stage {
          flex: 1 1 auto;

          width: 100%;
          min-width: 0;
          min-height: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px 28px;

          background: #e9ecdf;
          border-radius: 17px;
          overflow: hidden;
        }

        /* =================================================
           ACTUAL LUNCHBOX

           Increased height and balanced width.
        ================================================= */

        .smart-lunchbox-shell {
          width: min(100%, 1080px);
          height: 100%;

          min-width: 0;
          min-height: 0;

          display: grid;

          grid-template-columns:
            minmax(0, 1.08fr)
            minmax(0, 1fr);

          grid-template-rows:
            repeat(2, minmax(0, 1fr));

          gap: 11px;

          padding: 10px;

          border: 6px solid #82977c;
          border-radius: 25px;

          background: #aebfa7;

          box-shadow:
            0 12px 25px rgba(55, 80, 58, 0.12),
            inset 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        /* =================================================
           COMPARTMENTS
        ================================================= */

        .smart-compartment-button {
          position: relative;

          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;

          padding: 15px;

          border: 2px solid #d5dfcf;
          border-radius: 16px;

          background: #faf8f0;
          color: #344e41;

          transition:
            background 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .smart-compartment-button:hover {
          background: #fffdf7;
          border-color: #88a58a;
          box-shadow: inset 0 0 0 1px #88a58a;
        }

        .smart-compartment-number {
          position: absolute;
          top: 14px;
          left: 16px;

          color: #809184;
          font-size: 12px;
          font-weight: 850;
        }

        .smart-compartment-plus {
          width: 40px;
          height: 40px;

          color: #81977d;
          stroke-width: 1.8;
        }

        .smart-compartment-emoji {
          font-size: clamp(35px, 3vw, 52px);
          line-height: 1;
        }

        .smart-compartment-name {
          max-width: 100%;

          font-size: clamp(15px, 1.25vw, 20px);
          font-weight: 800;
          line-height: 1.2;

          text-align: center;
          overflow-wrap: anywhere;
        }

        .smart-compartment-weight {
          color: #7a8d7f;
          font-size: 12px;
          text-align: center;
        }

        .smart-info-line {
          flex: 0 0 auto;

          display: flex;
          align-items: center;
          gap: 7px;

          color: var(--sb-muted);
          font-size: 10px;
          line-height: 1.3;
        }

        /* =================================================
           NUTRITION CARD
        ================================================= */

        .smart-nutrition-content {
          flex: 1 1 auto;
          min-height: 0;

          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .smart-calorie-box {
          flex: 1 1 auto;
          min-height: 80px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;

          padding: 10px;

          border-radius: 13px;
          background: var(--sb-background);

          text-align: center;
        }

        .smart-calorie-label {
          margin: 0;

          color: var(--sb-muted);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.7px;
        }

        .smart-calorie-value {
          color: var(--sb-green);

          font-size: clamp(29px, 2.5vw, 39px);
          font-weight: 850;
          line-height: 1.05;

          font-variant-numeric: tabular-nums;
        }

        .smart-calorie-unit {
          margin-left: 5px;
          font-size: 12px;
          font-weight: 700;
        }

        .smart-nutrition-stats {
          flex: 0 0 auto;

          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .smart-nutrition-stat {
          min-width: 0;

          display: flex;
          flex-direction: column;
          gap: 5px;

          padding: 10px;

          border: 1px solid var(--sb-border);
          border-radius: 11px;
        }

        .smart-nutrition-stat-label {
          display: flex;
          align-items: center;
          gap: 5px;

          color: var(--sb-muted);
          font-size: 10px;
        }

        .smart-nutrition-stat-value {
          font-size: clamp(14px, 1.1vw, 18px);
          font-weight: 800;
        }

        .smart-nutrition-footer {
          flex: 0 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .smart-nutrition-footer .smart-muted {
          max-width: 65%;
          font-size: 9px;
          text-align: right;
        }

        /* =================================================
           COMPARTMENT DETAILS
        ================================================= */

        .smart-details-grid {
          flex: 1 1 auto;
          min-height: 0;

          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 9px;
        }

        .smart-detail-card {
          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;
          gap: 7px;

          padding: 10px;

          border: 1px solid var(--sb-border);
          border-radius: 12px;

          background: var(--sb-background);
        }

        .smart-detail-header {
          flex: 0 0 auto;

          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .smart-detail-name {
          font-size: 11px;
          font-weight: 800;
        }

        .smart-detail-badge {
          padding: 3px 7px;
          border-radius: 99px;

          background: var(--sb-surface);
          color: var(--sb-muted);

          font-size: 9px;
          font-weight: 750;
        }

        .smart-detail-badge.filled {
          color: #45634d;
          background: #e2eee3;
        }

        .smart-detail-food {
          flex: 1 1 auto;
          min-height: 0;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;

          padding: 7px;

          border-radius: 10px;
          background: var(--sb-surface);

          text-align: center;
        }

        .smart-detail-emoji {
          font-size: clamp(22px, 2vw, 29px);
          line-height: 1;
        }

        .smart-detail-food-name {
          font-size: 11px;
          font-weight: 800;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .smart-detail-food-meta {
          color: var(--sb-muted);
          font-size: 10px;
          line-height: 1.2;
        }

        .smart-detail-actions {
          flex: 0 0 auto;

          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .smart-detail-actions .smart-button {
          flex: 1;
          padding: 7px 6px;
          font-size: 10px;
          white-space: nowrap;
        }

        /* =================================================
           MODAL
        ================================================= */

        .smart-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 200;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 16px;
          background: rgba(20, 32, 25, 0.56);
        }

        .smart-modal {
          width: 100%;
          max-width: 560px;
          max-height: 90dvh;

          overflow-y: auto;
          padding: 22px;

          border: 1px solid var(--sb-border);
          border-radius: 22px;

          background: var(--sb-surface);
          color: var(--sb-text);

          box-shadow:
            0 25px 80px rgba(0, 0, 0, 0.2);
        }

        .smart-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .smart-modal-label {
          margin: 0 0 6px;

          color: var(--sb-green);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .smart-modal-title {
          margin: 0 0 6px;
          font-size: 24px;
        }

        .smart-sensor-preview {
          display: flex;
          align-items: center;
          gap: 12px;

          padding: 13px;
          margin-bottom: 13px;

          border-radius: 13px;
          background: var(--sb-background);
        }

        .smart-sensor-icon {
          width: 43px;
          height: 43px;
          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 12px;
          background: var(--sb-surface);
          color: var(--sb-green);
        }

        .smart-simulator {
          padding: 13px;
          margin-bottom: 13px;

          border: 1px dashed var(--sb-border);
          border-radius: 13px;
        }

        .smart-simulator-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .smart-simulator-range {
          width: 100%;
          accent-color: #45634d;
          cursor: pointer;
        }

        .smart-range-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;

          color: var(--sb-muted);
          font-size: 10px;
        }

        .smart-search-box {
          display: flex;
          align-items: center;
          gap: 9px;

          padding: 0 12px;
          margin-bottom: 12px;

          border: 1px solid var(--sb-border);
          border-radius: 12px;

          background: var(--sb-background);
        }

        .smart-search-input {
          flex: 1;
          min-width: 0;

          padding: 12px 0;

          border: 0;
          outline: 0;

          background: transparent;
          color: var(--sb-text);

          font-size: 12px;
        }

        .smart-food-list {
          display: flex;
          flex-direction: column;
          gap: 8px;

          max-height: 185px;
          overflow-y: auto;
          margin-bottom: 13px;
        }

        .smart-food-option {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 11px;

          padding: 10px 12px;
          text-align: left;

          border: 1px solid var(--sb-border);
          border-radius: 12px;

          background: var(--sb-surface);
          color: var(--sb-text);
        }

        .smart-food-option.selected {
          border-color: #81967a;
          box-shadow: inset 0 0 0 1px #81967a;
          background: var(--sb-background);
        }

        .smart-selected-nutrition {
          padding: 13px;
          margin-bottom: 14px;

          border-radius: 13px;
          background: var(--sb-background);
        }

        .smart-selected-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .smart-selected-stat {
          min-width: 0;
          padding: 10px;

          text-align: center;
          border-radius: 10px;

          background: var(--sb-surface);
        }

        .smart-modal-actions {
          display: flex;
          gap: 10px;
        }

        .smart-modal-actions .smart-button {
          flex: 1;
          padding: 11px;
          font-size: 12px;
        }

        /* =================================================
           TOAST
        ================================================= */

        .smart-toast {
          position: fixed;
          right: 22px;
          bottom: 22px;
          z-index: 300;

          display: flex;
          align-items: center;
          gap: 10px;

          max-width: 350px;
          padding: 13px 15px;

          border-radius: 13px;

          background: var(--sb-green);
          color: #ffffff;

          box-shadow:
            0 12px 35px rgba(0, 0, 0, 0.15);

          font-size: 12px;
          font-weight: 650;
        }

        /* =================================================
           SHORTER DESKTOP SCREENS

           Scale the top panel to available space
           while protecting the bottom cards.
        ================================================= */

        @media (min-width: 951px) and (max-height: 900px) {
          .smart-layout {
            grid-template-rows:
              minmax(340px, 1.5fr)
              minmax(220px, 1fr);
          }

          .smart-lunchbox-stage {
            padding: 10px 20px;
          }

          .smart-panel {
            padding: 12px 15px;
          }

          .smart-detail-card {
            padding: 8px;
          }
        }

        @media (min-width: 951px) and (max-height: 700px) {
          .smart-layout {
            grid-template-rows:
              minmax(300px, 1.4fr)
              minmax(200px, 1fr);
          }

          .smart-panel {
            gap: 7px;
          }

          .smart-panel-title {
            font-size: 19px;
          }

          .smart-lunchbox-stage {
            padding: 8px 18px;
          }

          .smart-lunchbox-shell {
            padding: 7px;
            border-width: 5px;
            gap: 8px;
          }

          .smart-compartment-button {
            gap: 4px;
            padding: 8px;
          }
        }

        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 950px) {
          .smart-page {
            height: auto;
            min-height: 100%;
            overflow: visible;
          }

          .smart-layout {
            flex: none;
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            gap: 14px;
          }

          .smart-lunchbox-panel {
            grid-column: 1;
          }

          .smart-lunchbox-stage {
            flex: none;
            height: 440px;
            padding: 16px;
          }

          .smart-lunchbox-shell {
            max-width: 780px;
          }

          .smart-calorie-box {
            min-height: 110px;
          }

          .smart-details-grid {
            min-height: 200px;
          }
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 600px) {
          .smart-page {
            padding: 0 0 20px;
          }

          .smart-header {
            flex-wrap: wrap;
          }

          .smart-device-wrap {
            margin-left: auto;
          }

          .smart-panel {
            padding: 14px;
          }

          .smart-lunchbox-stage {
            height: 360px;
            padding: 10px;
          }

          .smart-lunchbox-shell {
            padding: 6px;
            border-width: 4px;
            border-radius: 17px;
            gap: 6px;
          }

          .smart-compartment-button {
            padding: 6px;
            gap: 5px;
            border-radius: 10px;
          }

          .smart-compartment-number {
            top: 8px;
            left: 9px;
            font-size: 10px;
          }

          .smart-compartment-plus {
            width: 27px;
            height: 27px;
          }

          .smart-compartment-emoji {
            font-size: 27px;
          }

          .smart-compartment-name {
            font-size: 12px;
          }

          .smart-compartment-weight {
            font-size: 10px;
          }

          .smart-details-grid {
            grid-template-columns: 1fr;
          }

          .smart-detail-card {
            min-height: 145px;
          }

          .smart-detail-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }

          .smart-detail-food {
            min-height: 65px;
          }

          .smart-nutrition-stats {
            gap: 6px;
          }

          .smart-nutrition-stat {
            padding: 8px;
          }

          .smart-nutrition-footer {
            flex-direction: column;
            align-items: flex-start;
          }

          .smart-nutrition-footer .smart-muted {
            max-width: 100%;
            text-align: left;
          }

          .smart-modal {
            padding: 16px;
          }
        }
      `}</style>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="smart-header">
        <div>
          <p className="smart-eyebrow">
            YOUR SMART LUNCHBOX
          </p>

          <h2 className="smart-title">
            Your lunch, at a glance.
          </h2>

          <p className="smart-muted">
            Explore your three food compartments
            and preview their nutrition.
          </p>
        </div>

        {/* CONNECTION DROPDOWN */}

        <div
          className="smart-device-wrap"
          ref={deviceMenuRef}
        >
          <button
            type="button"
            className="smart-device-trigger"
            aria-expanded={deviceMenuOpen}
            onClick={() =>
              setDeviceMenuOpen((previous) => !previous)
            }
          >
            {demoConnected ? (
              <CheckCircle2
                size={17}
                color="#59956a"
              />
            ) : (
              <Wifi
                size={17}
                color="#45634d"
              />
            )}

            {demoConnected
              ? "Demo Connected"
              : "Preview Connection"}

            <ChevronDown
              size={15}
              style={{
                transform: deviceMenuOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          <AnimatePresence>
            {deviceMenuOpen && (
              <motion.div
                className="smart-device-dropdown"
                initial={{
                  opacity: 0,
                  y: -10,
                  scale: 0.97,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                  scale: 0.97,
                }}
                transition={{ duration: 0.2 }}
              >
                <div className="smart-device-dropdown-header">
                  <div>
                    <strong
                      style={{
                        display: "block",
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      SustansyaBox Device
                    </strong>

                    <p className="smart-muted">
                      {demoConnected
                        ? "Simulated connection active"
                        : "Preview disconnected"}
                    </p>
                  </div>

                  <span className="smart-device-status">
                    <span
                      className={`smart-status-dot ${
                        demoConnected ? "online" : ""
                      }`}
                    />

                    {demoConnected ? "Demo" : "Offline"}
                  </span>
                </div>

                <div className="smart-device-grid">
                  <div className="smart-device-tile">
                    <div className="smart-device-tile-heading">
                      <UtensilsCrossed size={19} />
                      <span style={{ fontSize: 10 }}>
                        01
                      </span>
                    </div>

                    <span className="smart-muted">
                      Compartments
                    </span>

                    <strong className="smart-device-value">
                      {filledCount}

                      <span
                        style={{
                          fontSize: 15,
                          color: "var(--sb-muted)",
                        }}
                      >
                        {" "}/ 3
                      </span>
                    </strong>

                    <span className="smart-muted">
                      Foods selected
                    </span>

                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        marginTop: "auto",
                      }}
                    >
                      {[1, 2, 3].map((number) => (
                        <span
                          key={number}
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 99,
                            background:
                              number <= filledCount
                                ? "#7eaa84"
                                : "var(--sb-border)",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="smart-device-tile">
                    <div className="smart-device-tile-heading">
                      <Scale size={19} />

                      {demoConnected ? (
                        <CheckCircle2
                          size={15}
                          color="#59956a"
                        />
                      ) : (
                        <WifiOff size={15} />
                      )}
                    </div>

                    <span className="smart-muted">
                      Weight Sensor
                    </span>

                    <strong style={{ fontSize: 19 }}>
                      {demoConnected
                        ? "Ready"
                        : "Unavailable"}
                    </strong>

                    <span className="smart-muted">
                      HX711 + load cell
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: "auto",
                        fontSize: 10,
                        color: demoConnected
                          ? "#59956a"
                          : "var(--sb-muted)",
                      }}
                    >
                      {demoConnected ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <WifiOff size={13} />
                      )}

                      {demoConnected
                        ? "Simulated sensor active"
                        : "Sensor disconnected"}
                    </span>
                  </div>
                </div>

                <div className="smart-device-footer">
                  <span
                    className="smart-muted"
                    style={{ fontSize: 10 }}
                  >
                    Demo only · No physical device
                  </span>

                  <button
                    type="button"
                    className="smart-button"
                    onClick={() =>
                      setDemoConnected(
                        (previous) => !previous
                      )
                    }
                  >
                    {demoConnected ? (
                      <>
                        <WifiOff size={14} />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Wifi size={14} />
                        Connect Demo
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="smart-layout">
        {/* ===============================================
            TOP: TALLER LUNCHBOX
        =============================================== */}

        <section className="smart-card smart-panel smart-lunchbox-panel">
          <div className="smart-panel-heading">
            <div>
              <h3 className="smart-panel-title">
                Lunchbox Compartments
              </h3>

              <p className="smart-panel-subtitle">
                Select a compartment to preview its
                food and weight.
              </p>
            </div>

            <span className="smart-panel-icon">
              <UtensilsCrossed size={18} />
            </span>
          </div>

          <div className="smart-lunchbox-stage">
            <div className="smart-lunchbox-shell">
              {compartments.map((compartment) => (
                <motion.button
                  key={compartment.id}
                  type="button"
                  className="smart-compartment-button"
                  style={{
                    gridRow:
                      compartment.id === 1
                        ? "span 2"
                        : undefined,
                  }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() =>
                    openPicker(compartment.id)
                  }
                  aria-label={`Select food for compartment ${compartment.id}`}
                >
                  <span className="smart-compartment-number">
                    {String(compartment.id).padStart(2, "0")}
                  </span>

                  {compartment.food ? (
                    <>
                      <span className="smart-compartment-emoji">
                        {compartment.food.emoji}
                      </span>

                      <span className="smart-compartment-name">
                        {compartment.food.name}
                      </span>

                      <span className="smart-compartment-weight">
                        {compartment.weight} g
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="smart-compartment-plus" />

                      <span className="smart-compartment-name">
                        Add Food
                      </span>

                      <span className="smart-compartment-weight">
                        Compartment {compartment.id}
                      </span>
                    </>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="smart-info-line">
            <Info size={13} />

            <span>
              Visual preview only. Actual sensor readings
              will be connected later.
            </span>
          </div>
        </section>

        {/* ===============================================
            BOTTOM LEFT: NUTRITION
        =============================================== */}

        <section className="smart-card smart-panel">
          <div className="smart-panel-heading">
            <div>
              <h3 className="smart-panel-title">
                Lunchbox Nutrition
              </h3>

              <p className="smart-panel-subtitle">
                Estimated nutrition for your selected foods.
              </p>
            </div>

            <span className="smart-panel-icon">
              <Droplets size={18} />
            </span>
          </div>

          <div className="smart-nutrition-content">
            <div className="smart-calorie-box">
              <p className="smart-calorie-label">
                TOTAL CALORIES
              </p>

              <div className="smart-calorie-value">
                {formatNumber(totals.calories)}

                <span className="smart-calorie-unit">
                  kcal
                </span>
              </div>

              <p className="smart-muted">
                {formatNumber(totals.weight)} g
                of selected food
              </p>
            </div>

            <div className="smart-nutrition-stats">
              {[
                {
                  label: "Sugar",
                  value: `${formatNumber(totals.sugar, 1)} g`,
                  icon: Droplets,
                },
                {
                  label: "Sodium",
                  value: `${formatNumber(totals.sodium)} mg`,
                  icon: Scale,
                },
                {
                  label: "Compartments",
                  value: `${filledCount} / 3`,
                  icon: UtensilsCrossed,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="smart-nutrition-stat"
                  >
                    <span className="smart-nutrition-stat-label">
                      <Icon size={13} />
                      {item.label}
                    </span>

                    <strong className="smart-nutrition-stat-value">
                      {item.value}
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="smart-nutrition-footer">
            <button
              type="button"
              className="smart-button"
              onClick={clearAll}
            >
              <RefreshCcw size={14} />
              Clear Preview
            </button>

            <p className="smart-muted">
              Illustrative estimates per 100 g.
              Actual values vary by preparation.
            </p>
          </div>
        </section>

        {/* ===============================================
            BOTTOM RIGHT: COMPARTMENT DETAILS
        =============================================== */}

        <section className="smart-card smart-panel">
          <div className="smart-panel-heading">
            <div>
              <h3 className="smart-panel-title">
                Compartment Details
              </h3>

              <p className="smart-panel-subtitle">
                Manage each compartment separately.
              </p>
            </div>

            <span className="smart-panel-icon">
              <UtensilsCrossed size={18} />
            </span>
          </div>

          <div className="smart-details-grid">
            {compartments.map((compartment) => {
              const nutrition = compartment.food
                ? calculateNutrition(
                    compartment.food,
                    compartment.weight
                  )
                : null;

              return (
                <div
                  key={compartment.id}
                  className="smart-detail-card"
                >
                  <div className="smart-detail-header">
                    <strong className="smart-detail-name">
                      Compartment {compartment.id}
                    </strong>

                    <span
                      className={`smart-detail-badge ${
                        compartment.food ? "filled" : ""
                      }`}
                    >
                      {compartment.food ? "Filled" : "Empty"}
                    </span>
                  </div>

                  <div className="smart-detail-food">
                    <span className="smart-detail-emoji">
                      {compartment.food?.emoji ?? "🍱"}
                    </span>

                    <strong className="smart-detail-food-name">
                      {compartment.food?.name ??
                        "No food selected"}
                    </strong>

                    <span className="smart-detail-food-meta">
                      {compartment.food
                        ? `${compartment.weight} g · ${formatNumber(
                            nutrition?.calories ?? 0
                          )} kcal`
                        : "Waiting for food"}
                    </span>
                  </div>

                  <div className="smart-detail-actions">
                    <button
                      type="button"
                      className="smart-button smart-button-primary"
                      onClick={() =>
                        openPicker(compartment.id)
                      }
                    >
                      <Plus size={12} />

                      {compartment.food
                        ? "Change Food"
                        : "Select Food"}
                    </button>

                    {compartment.food && (
                      <button
                        type="button"
                        className="smart-button"
                        onClick={() =>
                          clearCompartment(compartment.id)
                        }
                      >
                        <X size={12} />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* =================================================
          TOAST
      ================================================= */}

      <AnimatePresence>
        {notification && (
          <motion.div
            className="smart-toast"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
          >
            <CheckCircle2 size={17} />

            <span style={{ flex: 1 }}>
              {notification}
            </span>

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotification("")}
              style={{
                background: "transparent",
                border: 0,
                color: "#ffffff",
              }}
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =================================================
          FOOD PICKER MODAL
      ================================================= */}

      <AnimatePresence>
        {activeCompartment !== null && (
          <motion.div
            className="smart-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePicker}
          >
            <motion.div
              className="smart-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Select food"
              initial={{
                opacity: 0,
                y: 20,
                scale: 0.97,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 12,
                scale: 0.97,
              }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* MODAL HEADER */}

              <div className="smart-modal-header">
                <div>
                  <p className="smart-modal-label">
                    COMPARTMENT {activeCompartment}
                  </p>

                  <h3 className="smart-modal-title">
                    Select Your Food
                  </h3>

                  <p className="smart-muted">
                    Choose a food and adjust its estimated weight.
                  </p>
                </div>

                <button
                  type="button"
                  className="smart-button"
                  onClick={closePicker}
                  aria-label="Close food picker"
                  style={{
                    width: 34,
                    height: 34,
                    padding: 0,
                  }}
                >
                  <X size={17} />
                </button>
              </div>

              {/* SENSOR PREVIEW */}

              <div className="smart-sensor-preview">
                <div className="smart-sensor-icon">
                  <Scale size={21} />
                </div>

                <div style={{ flex: 1 }}>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Weight Preview
                  </strong>

                  <p className="smart-muted">
                    Simulated weight for nutrition estimates.
                  </p>
                </div>

                <span
                  style={{
                    color: "var(--sb-green)",
                    fontWeight: 800,
                    fontSize: 18,
                    whiteSpace: "nowrap",
                  }}
                >
                  {demoWeight} g
                </span>
              </div>

              {/* WEIGHT SLIDER */}

              <div className="smart-simulator">
                <div className="smart-simulator-header">
                  <div>
                    <strong style={{ fontSize: 12 }}>
                      Demo Weight Simulator
                    </strong>

                    <p
                      className="smart-muted"
                      style={{ marginTop: 3 }}
                    >
                      Adjust the portion weight.
                    </p>
                  </div>

                  <strong
                    style={{
                      color: "var(--sb-green)",
                      fontSize: 14,
                    }}
                  >
                    {demoWeight} g
                  </strong>
                </div>

                <input
                  type="range"
                  className="smart-simulator-range"
                  min={10}
                  max={500}
                  step={10}
                  value={demoWeight}
                  onChange={(event) =>
                    setDemoWeight(
                      Number(event.target.value)
                    )
                  }
                  aria-label="Food weight in grams"
                />

                <div className="smart-range-labels">
                  <span>10 g</span>
                  <span>250 g</span>
                  <span>500 g</span>
                </div>
              </div>

              {/* SEARCH */}

              <div className="smart-search-box">
                <Search
                  size={17}
                  color="var(--sb-muted)"
                />

                <input
                  className="smart-search-input"
                  type="text"
                  placeholder="Search food or category..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "var(--sb-muted)",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* FOOD CATALOG */}

              <div className="smart-food-list">
                {filteredFoods.length === 0 ? (
                  <div
                    style={{
                      padding: 20,
                      textAlign: "center",
                      color: "var(--sb-muted)",
                      fontSize: 12,
                    }}
                  >
                    No matching foods found.
                  </div>
                ) : (
                  filteredFoods.map((food) => {
                    const isSelected =
                      selectedFood?.id === food.id;

                    return (
                      <button
                        key={food.id}
                        type="button"
                        className={`smart-food-option ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() =>
                          setSelectedFood(food)
                        }
                      >
                        <span
                          style={{
                            width: 39,
                            height: 39,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            background:
                              "var(--sb-background)",
                            borderRadius: 10,
                            fontSize: 23,
                          }}
                        >
                          {food.emoji}
                        </span>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              fontSize: 12,
                              marginBottom: 3,
                            }}
                          >
                            {food.name}
                          </strong>

                          <span className="smart-muted">
                            {food.category}
                          </span>
                        </div>

                        <div
                          style={{
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          <strong
                            style={{
                              display: "block",
                              fontSize: 11,
                            }}
                          >
                            {food.calories} kcal
                          </strong>

                          <span
                            className="smart-muted"
                            style={{ fontSize: 9 }}
                          >
                            per 100 g
                          </span>
                        </div>

                        {isSelected && (
                          <Check
                            size={17}
                            color="#45634d"
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* SELECTED FOOD NUTRITION */}

              {selectedFood && selectedNutrition && (
                <div className="smart-selected-nutrition">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 11,
                    }}
                  >
                    <strong style={{ fontSize: 12 }}>
                      Estimated Nutrition
                    </strong>

                    <span className="smart-muted">
                      {demoWeight} g serving
                    </span>
                  </div>

                  <div className="smart-selected-grid">
                    {[
                      {
                        label: "Calories",
                        value: `${formatNumber(
                          selectedNutrition.calories
                        )} kcal`,
                      },
                      {
                        label: "Sugar",
                        value: `${formatNumber(
                          selectedNutrition.sugar,
                          1
                        )} g`,
                      },
                      {
                        label: "Sodium",
                        value: `${formatNumber(
                          selectedNutrition.sodium
                        )} mg`,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="smart-selected-stat"
                      >
                        <span
                          className="smart-muted"
                          style={{
                            display: "block",
                            fontSize: 10,
                            marginBottom: 6,
                          }}
                        >
                          {item.label}
                        </span>

                        <strong
                          style={{
                            display: "block",
                            fontSize: 13,
                            color: "var(--sb-green)",
                          }}
                        >
                          {item.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL ACTIONS */}

              <div className="smart-modal-actions">
                <button
                  type="button"
                  className="smart-button"
                  onClick={closePicker}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="smart-button smart-button-primary"
                  disabled={!selectedFood}
                  onClick={saveFood}
                >
                  <Check size={15} />
                  Save Food
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
