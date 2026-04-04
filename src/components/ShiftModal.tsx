"use client";

import { useState, useEffect } from "react";
import { Shift } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

interface ShiftModalProps {
  date: string;
  existingShifts: Shift[];
  onSave: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const PRESET_SHIFTS = [
  { label: "Day Shift", sub: "07:45 – 20:00", start: "07:45", end: "20:00" },
  { label: "Night Shift", sub: "19:45 – 08:00", start: "19:45", end: "08:00" },
  { label: "Early Shift", sub: "07:45 – 14:00", start: "07:45", end: "14:00" },
  { label: "2nd Early", sub: "08:00 – 14:00", start: "08:00", end: "14:00" },
];

export default function ShiftModal({
  date, existingShifts, onSave, onDelete, onClose,
}: ShiftModalProps) {
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [startTime, setStartTime] = useState("07:45");
  const [endTime, setEndTime] = useState("20:00");
  const [shiftType, setShiftType] = useState<Shift["type"]>("normal");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingShift) {
      setStartTime(editingShift.startTime);
      setEndTime(editingShift.endTime);
      setShiftType(editingShift.type);
      // Check if editing shift matches a preset
      const presetIdx = PRESET_SHIFTS.findIndex(
        (p) => p.start === editingShift.startTime && p.end === editingShift.endTime
      );
      setSelectedPreset(presetIdx >= 0 ? presetIdx : null);
    } else {
      setStartTime("07:45");
      setEndTime("20:00");
      setShiftType("normal");
      setSelectedPreset(0);
    }
    setError("");
  }, [editingShift]);

  function selectPreset(index: number) {
    const preset = PRESET_SHIFTS[index];
    setStartTime(preset.start);
    setEndTime(preset.end);
    setSelectedPreset(index);
  }

  function handleTimeChange(field: "start" | "end", value: string) {
    if (field === "start") setStartTime(value);
    else setEndTime(value);
    setSelectedPreset(null);
  }

  function handleSave() {
    if (!startTime || !endTime) {
      setError("Please set both start and end times.");
      return;
    }
    if (startTime === endTime) {
      setError("Start and end times cannot be the same.");
      return;
    }

    const shift: Shift = {
      id: editingShift?.id || uuidv4(),
      date,
      startTime,
      endTime,
      type: shiftType,
    };

    onSave(shift);
    setEditingShift(null);
  }

  const typeLabels: Record<Shift["type"], string> = {
    normal: "Normal",
    extra: "Extra",
    bankHoliday: "Bank Hol",
  };

  const typeFullLabels: Record<Shift["type"], string> = {
    normal: "Normal",
    extra: "Extra",
    bankHoliday: "Bank Holiday",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-md sm:mx-4 p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">
            {editingShift ? "Edit Shift" : "Add Shift"} — {date}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            &times;
          </button>
        </div>

        {/* Existing shifts for this day */}
        {existingShifts.length > 0 && !editingShift && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Existing shifts:</p>
            <div className="space-y-2">
              {existingShifts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {s.startTime} - {s.endTime}{" "}
                    <span className="text-xs text-gray-500">({typeFullLabels[s.type]})</span>
                  </span>
                  <div className="flex gap-3 sm:gap-2">
                    <button
                      onClick={() => setEditingShift(s)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(s.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-200 dark:border-gray-600" />
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Quick presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_SHIFTS.map((preset, i) => (
                <button
                  key={preset.label}
                  onClick={() => selectPreset(i)}
                  className={`text-left px-3 py-2 sm:py-1.5 rounded-lg border transition-colors ${
                    selectedPreset === i
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400"
                      : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className={`text-xs sm:text-sm font-medium block ${
                    selectedPreset === i
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {preset.label}
                  </span>
                  <span className={`text-[10px] sm:text-xs ${
                    selectedPreset === i
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-400"
                  }`}>
                    {preset.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual time inputs */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange("start", e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 sm:py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleTimeChange("end", e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 sm:py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          {/* Shift type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shift Type
            </label>
            <div className="flex gap-2">
              {(["normal", "extra", "bankHoliday"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setShiftType(t)}
                  className={`flex-1 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    shiftType === t
                      ? t === "normal"
                        ? "bg-blue-500 text-white"
                        : t === "extra"
                        ? "bg-amber-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2 pb-2 sm:pb-0">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 sm:py-2 rounded-lg transition-colors"
            >
              {editingShift ? "Update" : "Add"} Shift
            </button>
            {editingShift && (
              <button
                onClick={() => setEditingShift(null)}
                className="px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2.5 sm:py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
