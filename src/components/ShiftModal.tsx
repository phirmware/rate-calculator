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
  { label: "Day Shift", sub: "07:45 – 20:00", start: "07:45", end: "20:00", icon: "sun" },
  { label: "Night Shift", sub: "19:45 – 08:00", start: "19:45", end: "08:00", icon: "moon" },
  { label: "Early Shift", sub: "07:45 – 14:00", start: "07:45", end: "14:00", icon: "sunrise" },
  { label: "2nd Early", sub: "08:00 – 14:00", start: "08:00", end: "14:00", icon: "clock" },
];

function PresetIcon({ type, className }: { type: string; className?: string }) {
  const cn = className || "w-4 h-4";
  switch (type) {
    case "sun":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    case "moon":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );
    case "sunrise":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M17 18a5 5 0 00-10 0M12 2v7m-4.22.78L6.34 8.34m11.32 1.44l-1.44-1.44M1 18h22" />
        </svg>
      );
    default:
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      );
  }
}

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

  const typeActiveStyles: Record<Shift["type"], string> = {
    normal: "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30",
    extra: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
    bankHoliday: "bg-rose-500 text-white shadow-sm shadow-rose-500/30",
  };

  // Format date for display
  const dateObj = new Date(date + "T00:00:00");
  const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "long" });
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString("en-GB", { month: "short" });

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 max-h-[92vh] overflow-y-auto animate-slide-up sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle on mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {editingShift ? "Edit Shift" : "Add Shift"}
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">
                {dayName}, {dayNum} {monthName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing shifts for this day */}
          {existingShifts.length > 0 && !editingShift && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Scheduled
              </p>
              <div className="space-y-2">
                {existingShifts.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3.5 py-2.5"
                  >
                    <div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {s.startTime} – {s.endTime}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {typeFullLabels[s.type]}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingShift(s)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="my-5 border-t border-slate-100 dark:border-slate-700" />
            </div>
          )}

          {/* Form */}
          <div className="space-y-5">
            {/* Quick presets */}
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                Quick Select
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SHIFTS.map((preset, i) => (
                  <button
                    key={preset.label}
                    onClick={() => selectPreset(i)}
                    className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                      selectedPreset === i
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400"
                        : "border-transparent bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PresetIcon
                        type={preset.icon}
                        className={`w-3.5 h-3.5 ${
                          selectedPreset === i
                            ? "text-indigo-500 dark:text-indigo-400"
                            : "text-slate-400"
                        }`}
                      />
                      <span className={`text-xs sm:text-sm font-semibold ${
                        selectedPreset === i
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-slate-600 dark:text-slate-300"
                      }`}>
                        {preset.label}
                      </span>
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-0.5 block pl-5.5 ${
                      selectedPreset === i
                        ? "text-indigo-400 dark:text-indigo-400"
                        : "text-slate-400"
                    }`}>
                      {preset.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual time inputs */}
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                Custom Time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Start
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleTimeChange("start", e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    End
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleTimeChange("end", e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Shift type */}
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                Shift Type
              </p>
              <div className="flex gap-2">
                {(["normal", "extra", "bankHoliday"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setShiftType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
                      shiftType === t
                        ? typeActiveStyles[t]
                        : "bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                </svg>
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1 pb-3 sm:pb-0">
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 sm:py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm shadow-indigo-500/20"
              >
                {editingShift ? "Update Shift" : "Add Shift"}
              </button>
              {editingShift && (
                <button
                  onClick={() => setEditingShift(null)}
                  className="px-5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold py-3 sm:py-2.5 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
