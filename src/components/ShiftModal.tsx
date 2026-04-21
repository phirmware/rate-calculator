"use client";

import { useState, useEffect } from "react";
import { Shift, ShiftPreset, PresetIcon } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export const DEFAULT_PRESETS: ShiftPreset[] = [
  { id: "default-day",   label: "Day Shift",   start: "07:45", end: "20:00", icon: "sun"     },
  { id: "default-night", label: "Night Shift",  start: "19:45", end: "08:00", icon: "moon"    },
  { id: "default-early", label: "Early Shift",  start: "07:45", end: "14:00", icon: "sunrise" },
  { id: "default-2nd",   label: "2nd Early",    start: "08:00", end: "14:00", icon: "clock"   },
];

interface ShiftModalProps {
  date: string;
  existingShifts: Shift[];
  presets: ShiftPreset[];
  onSave: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onSavePresets: (presets: ShiftPreset[]) => void;
  onClose: () => void;
}

type ModalView = "shift" | "managePresets" | "editPreset";

const ICON_OPTIONS: PresetIcon[] = ["sun", "moon", "sunrise", "clock", "star", "zap"];

function iconLabel(type: string): string {
  const map: Record<string, string> = {
    sun: "Day", moon: "Night", sunrise: "Early", clock: "Clock", star: "Star", zap: "Zap",
  };
  return map[type] || type;
}

function PresetIconSvg({ type, className }: { type: string; className?: string }) {
  const cn = className || "w-4 h-4";
  switch (type) {
    case "sun":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
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
    case "star":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "zap":
      return (
        <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
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
  date, existingShifts, presets, onSave, onDelete, onSavePresets, onClose,
}: ShiftModalProps) {
  // Shift form state
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [startTime, setStartTime] = useState(presets[0]?.start ?? "07:45");
  const [endTime, setEndTime] = useState(presets[0]?.end ?? "20:00");
  const [shiftType, setShiftType] = useState<Shift["type"]>("normal");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(presets[0]?.id ?? null);
  const [error, setError] = useState("");

  // View state
  const [view, setView] = useState<ModalView>("shift");

  // Preset editing state
  const [editingPreset, setEditingPreset] = useState<ShiftPreset | null>(null);
  const [presetLabel, setPresetLabel] = useState("");
  const [presetStart, setPresetStart] = useState("09:00");
  const [presetEnd, setPresetEnd] = useState("17:00");
  const [presetIcon, setPresetIcon] = useState<PresetIcon>("clock");
  const [presetError, setPresetError] = useState("");

  const dateObj = new Date(date + "T00:00:00");
  const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "long" });
  const dayNum = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString("en-GB", { month: "short" });

  useEffect(() => {
    if (editingShift) {
      setStartTime(editingShift.startTime);
      setEndTime(editingShift.endTime);
      setShiftType(editingShift.type);
      const match = presets.find(
        (p) => p.start === editingShift.startTime && p.end === editingShift.endTime
      );
      setSelectedPresetId(match?.id ?? null);
    } else {
      setStartTime(presets[0]?.start ?? "07:45");
      setEndTime(presets[0]?.end ?? "20:00");
      setShiftType("normal");
      setSelectedPresetId(presets[0]?.id ?? null);
    }
    setError("");
  }, [editingShift]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectPreset(preset: ShiftPreset) {
    setStartTime(preset.start);
    setEndTime(preset.end);
    setSelectedPresetId(preset.id);
  }

  function handleTimeChange(field: "start" | "end", value: string) {
    if (field === "start") setStartTime(value);
    else setEndTime(value);
    setSelectedPresetId(null);
  }

  function handleSave() {
    if (!startTime || !endTime) { setError("Please set both start and end times."); return; }
    if (startTime === endTime) { setError("Start and end times cannot be the same."); return; }
    const shift: Shift = {
      id: editingShift?.id || uuidv4(),
      date, startTime, endTime, type: shiftType,
    };
    onSave(shift);
    setEditingShift(null);
  }

  function openAddPreset() {
    setEditingPreset(null);
    setPresetLabel("");
    setPresetStart("09:00");
    setPresetEnd("17:00");
    setPresetIcon("clock");
    setPresetError("");
    setView("editPreset");
  }

  function openEditPreset(preset: ShiftPreset) {
    setEditingPreset(preset);
    setPresetLabel(preset.label);
    setPresetStart(preset.start);
    setPresetEnd(preset.end);
    setPresetIcon(preset.icon);
    setPresetError("");
    setView("editPreset");
  }

  function handleSavePreset() {
    if (!presetLabel.trim()) { setPresetError("Please enter a name for this preset."); return; }
    const updated: ShiftPreset = {
      id: editingPreset?.id || uuidv4(),
      label: presetLabel.trim(),
      start: presetStart,
      end: presetEnd,
      icon: presetIcon,
    };
    if (editingPreset) {
      onSavePresets(presets.map((p) => (p.id === editingPreset.id ? updated : p)));
    } else {
      onSavePresets([...presets, updated]);
    }
    setView("managePresets");
  }

  function handleDeletePreset(id: string) {
    onSavePresets(presets.filter((p) => p.id !== id));
  }

  function handleBack() {
    if (view === "editPreset") setView("managePresets");
    else setView("shift");
  }

  const typeLabels: Record<Shift["type"], string> = {
    normal: "Normal", extra: "Extra", bankHoliday: "Bank Hol",
  };
  const typeActiveStyles: Record<Shift["type"], string> = {
    normal: "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30",
    extra: "bg-amber-500 text-white shadow-sm shadow-amber-500/30",
    bankHoliday: "bg-rose-500 text-white shadow-sm shadow-rose-500/30",
  };
  const typeFullLabels: Record<Shift["type"], string> = {
    normal: "Normal", extra: "Extra", bankHoliday: "Bank Holiday",
  };

  const headerTitle =
    view === "shift" ? (editingShift ? "Edit Shift" : "Add Shift")
    : view === "managePresets" ? "Quick Presets"
    : (editingPreset ? "Edit Preset" : "New Preset");

  const headerSubtitle =
    view === "shift" ? `${dayName}, ${dayNum} ${monthName}`
    : view === "managePresets" ? "Customise your quick select options"
    : "Set the details for this preset";

  const inputCls =
    "w-full rounded-xl px-3 py-2.5 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors";
  const sectionLabelCls =
    "text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest";

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
            <div className="flex items-center gap-2.5">
              {view !== "shift" && (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{headerTitle}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{headerSubtitle}</p>
              </div>
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

          {/* ─── SHIFT VIEW ─── */}
          {view === "shift" && (
            <div className="space-y-5">
              {/* Existing shifts for this day */}
              {existingShifts.length > 0 && !editingShift && (
                <div className="mb-5">
                  <p className={`${sectionLabelCls} mb-2`}>Scheduled</p>
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
                          <span className="text-xs text-slate-400 ml-2">{typeFullLabels[s.type]}</span>
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

              {/* Quick presets */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className={sectionLabelCls}>Quick Select</p>
                  <button
                    onClick={() => setView("managePresets")}
                    className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Customise
                  </button>
                </div>

                {presets.length === 0 ? (
                  <button
                    onClick={() => setView("managePresets")}
                    className="w-full py-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add your first quick preset
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset)}
                        className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-200 active:scale-[0.98] ${
                          selectedPresetId === preset.id
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400"
                            : "border-transparent bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <PresetIconSvg
                            type={preset.icon}
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              selectedPresetId === preset.id
                                ? "text-indigo-500 dark:text-indigo-400"
                                : "text-slate-400"
                            }`}
                          />
                          <span className={`text-xs sm:text-sm font-semibold truncate ${
                            selectedPresetId === preset.id
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-slate-600 dark:text-slate-300"
                          }`}>
                            {preset.label}
                          </span>
                        </div>
                        <span className={`text-[10px] sm:text-xs mt-0.5 block pl-[22px] ${
                          selectedPresetId === preset.id
                            ? "text-indigo-400 dark:text-indigo-400"
                            : "text-slate-400"
                        }`}>
                          {preset.start} – {preset.end}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual time inputs */}
              <div>
                <p className={`${sectionLabelCls} mb-2.5`}>Custom Time</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleTimeChange("start", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleTimeChange("end", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Shift type */}
              <div>
                <p className={`${sectionLabelCls} mb-2.5`}>Shift Type</p>
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
          )}

          {/* ─── MANAGE PRESETS VIEW ─── */}
          {view === "managePresets" && (
            <div className="space-y-3 pb-3 sm:pb-0">
              {presets.length === 0 && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No presets yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add your first quick-select preset below</p>
                </div>
              )}

              <div className="space-y-2">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3.5 py-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <PresetIconSvg type={preset.icon} className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{preset.label}</p>
                      <p className="text-xs text-slate-400">{preset.start} – {preset.end}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditPreset(preset)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
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

              {/* Add preset button */}
              <button
                onClick={openAddPreset}
                className="w-full py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Preset
              </button>

              {/* Restore defaults */}
              <button
                onClick={() => onSavePresets(DEFAULT_PRESETS)}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Restore defaults
              </button>
            </div>
          )}

          {/* ─── EDIT / ADD PRESET VIEW ─── */}
          {view === "editPreset" && (
            <div className="space-y-5 pb-3 sm:pb-0">
              {/* Label */}
              <div>
                <label className={`${sectionLabelCls} block mb-2`}>Preset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Late Shift"
                  value={presetLabel}
                  maxLength={20}
                  autoFocus
                  onChange={(e) => { setPresetLabel(e.target.value); setPresetError(""); }}
                  className={inputCls}
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">{presetLabel.length}/20</p>
              </div>

              {/* Icon picker */}
              <div>
                <p className={`${sectionLabelCls} mb-2.5`}>Icon</p>
                <div className="flex gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setPresetIcon(icon)}
                      title={iconLabel(icon)}
                      className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 ${
                        presetIcon === icon
                          ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30 scale-105"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      <PresetIconSvg type={icon} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">{iconLabel(presetIcon)}</p>
              </div>

              {/* Times */}
              <div>
                <p className={`${sectionLabelCls} mb-2.5`}>Times</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Start</label>
                    <input
                      type="time"
                      value={presetStart}
                      onChange={(e) => setPresetStart(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">End</label>
                    <input
                      type="time"
                      value={presetEnd}
                      onChange={(e) => setPresetEnd(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <PresetIconSvg type={presetIcon} className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {presetLabel || <span className="text-slate-400 font-normal italic">Preset name</span>}
                  </p>
                  <p className="text-xs text-slate-400">{presetStart} – {presetEnd}</p>
                </div>
                <p className="ml-auto text-[10px] text-slate-400 font-medium uppercase tracking-wide">Preview</p>
              </div>

              {presetError && (
                <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-xl">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                  </svg>
                  {presetError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSavePreset}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 sm:py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-sm shadow-indigo-500/20"
                >
                  {editingPreset ? "Update Preset" : "Add Preset"}
                </button>
                <button
                  onClick={() => setView("managePresets")}
                  className="px-5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-semibold py-3 sm:py-2.5 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
