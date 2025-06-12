

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AddIcon, DeleteIcon, CheckIcon, RefreshIcon } from './Icons'; // Added RefreshIcon for Cancel
import Button from './Button';
import { ProgramTimeSlot } from '../types';
import CreatableSearchableDropdown from './CreatableSearchableDropdown';
import { formatToAMPM, formatDuration } from './TimeIntervalManager'; // Re-use formatters

const generateId = () => Math.random().toString(36).substring(2, 11);

const SLOT_TYPE_SUGGESTIONS = ["Theory", "Lab", "Viva", "Presentation", "Exam"];

const DEFAULT_PROGRAM_SLOTS_CONFIG: Array<{ type: string; startTime: string; endTime: string }> = [
  // Theory Slots (6 slots, 90 minutes each, starting 08:30)
  { type: "Theory", startTime: "08:30", endTime: "10:00" },
  { type: "Theory", startTime: "10:00", endTime: "11:30" },
  { type: "Theory", startTime: "11:30", endTime: "13:00" },
  { type: "Theory", startTime: "13:00", endTime: "14:30" },
  { type: "Theory", startTime: "14:30", endTime: "16:00" },
  { type: "Theory", startTime: "16:00", endTime: "17:30" },
  // Lab Slots (4 slots, 120 minutes each, starting 09:00)
  { type: "Lab",    startTime: "09:00", endTime: "11:00" },
  { type: "Lab",    startTime: "11:00", endTime: "13:00" },
  { type: "Lab",    startTime: "13:00", endTime: "15:00" },
  { type: "Lab",    startTime: "15:00", endTime: "17:00" },
];


// Helper function to generate slot names like "Slot-X (Type)"
const generateSlotNameForType = (
  targetSlotType: string,
  allSlots: ProgramTimeSlot[],
  currentSlotIdToExclude?: string 
): string => {
  const slotsOfTargetType = allSlots.filter(
    s => s.slotType === targetSlotType && (currentSlotIdToExclude ? s.id !== currentSlotIdToExclude : true)
  );

  const slotNamePattern = new RegExp(`^Slot-(\\d+) \\(${targetSlotType}\\)$`, 'i');
  const existingNumbers: number[] = [];

  slotsOfTargetType.forEach(s => {
    const match = s.slotName.match(slotNamePattern);
    if (match && match[1]) {
      existingNumbers.push(parseInt(match[1], 10));
    }
  });

  let newSlotNumber = 1;
  while (existingNumbers.includes(newSlotNumber)) {
    newSlotNumber++;
  }

  return `Slot-${newSlotNumber} (${targetSlotType})`;
};


interface ProgramTimeSlotManagerProps {
  initialProgramTimeSlots?: ProgramTimeSlot[];
  onSave: (slots: ProgramTimeSlot[]) => void;
  programNameForContext: string; 
  onUnsavedChangesStatusChange?: (hasUnsavedChanges: boolean) => void; 
  onManagerCancel?: () => void; // New prop
}

const ProgramTimeSlotManager: React.FC<ProgramTimeSlotManagerProps> = ({
  initialProgramTimeSlots = [],
  onSave,
  programNameForContext,
  onUnsavedChangesStatusChange,
  onManagerCancel, // Destructure new prop
}) => {
  const [internalSlots, setInternalSlots] = useState<ProgramTimeSlot[]>([]);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  const lastAddedSlotRef = useRef<HTMLDivElement | null>(null);
  const stableInitialSlotsRef = useRef<ProgramTimeSlot[]>([]);
  const [manualSlotAddedSinceLoadOrSave, setManualSlotAddedSinceLoadOrSave] = useState(false);


  useEffect(() => {
    const processedInitial = initialProgramTimeSlots.reduce((acc, slot) => {
        const name = slot.slotName || generateSlotNameForType(slot.slotType, acc, slot.id);
        acc.push({
            ...slot,
            id: slot.id || generateId(),
            slotName: name,
        });
        return acc;
    }, [] as ProgramTimeSlot[]);
    
    stableInitialSlotsRef.current = JSON.parse(JSON.stringify(processedInitial)); 
    setInternalSlots(processedInitial);
    setSlotErrors({});
    setManualSlotAddedSinceLoadOrSave(false); 
    if (onUnsavedChangesStatusChange) {
      onUnsavedChangesStatusChange(false); 
    }
  }, [initialProgramTimeSlots]); 

  const hasUnsavedChanges = useCallback((): boolean => {
    if (internalSlots.length !== stableInitialSlotsRef.current.length) return true;
    
    const initialMap = new Map(stableInitialSlotsRef.current.map(s => [s.id, s]));

    for (const current of internalSlots) { 
      const initial = initialMap.get(current.id);
      if (!initial) return true;
      if (
        current.slotType !== initial.slotType || 
        current.slotName !== initial.slotName ||
        current.startTime !== initial.startTime ||
        current.endTime !== initial.endTime
      ) {
        return true;
      }
    }
    return false;
  }, [internalSlots]);

  useEffect(() => {
    if (onUnsavedChangesStatusChange) {
      onUnsavedChangesStatusChange(hasUnsavedChanges());
    }
  }, [internalSlots, hasUnsavedChanges, onUnsavedChangesStatusChange]);


  useEffect(() => {
    if (lastAddedSlotRef.current) {
      lastAddedSlotRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      lastAddedSlotRef.current = null;
    }
  }, [internalSlots.length]);

  const addSlot = () => {
    const newId = generateId();
    const defaultSlotType = SLOT_TYPE_SUGGESTIONS[0] || 'Theory';
    
    const tempSlotsForNameGeneration = [...internalSlots];
    const newSlotName = generateSlotNameForType(defaultSlotType, tempSlotsForNameGeneration);
    
    let newStartTime = '';
    if (internalSlots.length > 0) {
        const lastSlot = internalSlots[internalSlots.length - 1];
        if (lastSlot && lastSlot.endTime) {
            const timePattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (timePattern.test(lastSlot.endTime)) {
                newStartTime = lastSlot.endTime;
            }
        }
    }
    
    setInternalSlots(prev => [...prev, { 
        id: newId, 
        slotType: defaultSlotType, 
        slotName: newSlotName, 
        startTime: newStartTime, 
        endTime: '' 
    }]);
    setSlotErrors({});
    setManualSlotAddedSinceLoadOrSave(true); 
  };

  const deleteSlot = (id: string) => {
    const slotToDelete = internalSlots.find(s => s.id === id);
    if (!slotToDelete) return;

    let remainingSlots = internalSlots.filter(slot => slot.id !== id);
    
    const reNumberedSlots = remainingSlots.reduce((acc, currentSlot) => {
        const name = generateSlotNameForType(currentSlot.slotType, acc, currentSlot.id);
        acc.push({...currentSlot, slotName: name });
        return acc;
    }, [] as ProgramTimeSlot[]);

    setInternalSlots(reNumberedSlots);

    if (slotErrors[id]) {
      setSlotErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const updateSlotValue = (id: string, field: keyof ProgramTimeSlot, value: string) => {
    setInternalSlots(prevSlots => {
      let newSlots = [...prevSlots];
      const slotIndex = newSlots.findIndex(s => s.id === id);
      if (slotIndex === -1) return prevSlots;

      let updatedSlot = { ...newSlots[slotIndex] };

      if (field === 'slotType') {
        const newSlotType = value;
        updatedSlot.slotType = newSlotType;
        const otherSlotsForNameGen = newSlots.filter(s => s.id !== id);
        updatedSlot.slotName = generateSlotNameForType(newSlotType, otherSlotsForNameGen);
      } else {
        (updatedSlot[field] as any) = value;
      }
      
      newSlots[slotIndex] = updatedSlot;

      return newSlots.reduce((acc, currentSlot) => {
          const name = generateSlotNameForType(currentSlot.slotType, acc, currentSlot.id);
          acc.push({...currentSlot, slotName: name });
          return acc;
      }, [] as ProgramTimeSlot[]);
    });

    if (slotErrors[id]) {
      setSlotErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const loadDefaultSlots = () => {
    const defaultSlots: ProgramTimeSlot[] = [];
    DEFAULT_PROGRAM_SLOTS_CONFIG.forEach(config => {
      const newId = generateId();
      const slotName = generateSlotNameForType(config.type, defaultSlots); 
      defaultSlots.push({
        id: newId,
        slotType: config.type,
        slotName: slotName,
        startTime: config.startTime,
        endTime: config.endTime,
      });
    });
    setInternalSlots(defaultSlots);
    setSlotErrors({});
    setManualSlotAddedSinceLoadOrSave(false); 
  };

  const handleCancelChanges = () => {
    setInternalSlots(JSON.parse(JSON.stringify(stableInitialSlotsRef.current)));
    setSlotErrors({});
    setManualSlotAddedSinceLoadOrSave(false); 
    if (onUnsavedChangesStatusChange) {
      onUnsavedChangesStatusChange(false); 
    }
    if (onManagerCancel) { // Call the new prop
      onManagerCancel();
    }
  };

  const handleSaveChanges = () => {
    const newSlotErrors: Record<string, string> = {};
    let hasAnyError = false;
    
    const validatedSlots = internalSlots.reduce((acc, currentSlot) => {
        const name = generateSlotNameForType(currentSlot.slotType, acc, currentSlot.id);
        acc.push({...currentSlot, slotName: name}); 
        return acc;
    }, [] as ProgramTimeSlot[]);
    
    const seenSlotNamesOnSave = new Set<string>();

    for (const slot of validatedSlots) { 
      let currentError = '';
      if (!slot.slotType.trim()) {
        currentError += 'Type is required. ';
      }
      
      const trimmedSlotName = slot.slotName.trim().toLowerCase();
      if (seenSlotNamesOnSave.has(trimmedSlotName)) { 
        currentError += 'Duplicate slot name detected. Slot names must be unique. ';
      } else {
        seenSlotNamesOnSave.add(trimmedSlotName);
      }

      if (!slot.startTime || !slot.endTime) {
        currentError += 'Start & End times required. ';
      } else if (slot.startTime >= slot.endTime) {
        currentError += `Start (${formatToAMPM(slot.startTime)}) must be before End (${formatToAMPM(slot.endTime)}). `;
      }
      
      if (currentError) {
        newSlotErrors[slot.id] = currentError.trim();
        hasAnyError = true;
      }
    }

    setSlotErrors(newSlotErrors);

    if (!hasAnyError) {
      setInternalSlots(validatedSlots); 
      stableInitialSlotsRef.current = JSON.parse(JSON.stringify(validatedSlots)); 
      
      const slotsToSave = validatedSlots.map(s => ({
        ...s,
        slotType: s.slotType.trim(),
      }));
      
      onSave(slotsToSave); 
      setManualSlotAddedSinceLoadOrSave(false); 
      
      if (onUnsavedChangesStatusChange) {
        onUnsavedChangesStatusChange(false); 
      }
    }
  };
  
  const currentUnsavedSlotChanges = hasUnsavedChanges();
  const areSlotErrorsPresent = Object.keys(slotErrors).length > 0;
  const isSaveButtonDisabled = areSlotErrorsPresent || !currentUnsavedSlotChanges;
  const isCancelButtonDisabled = !currentUnsavedSlotChanges && !areSlotErrorsPresent;


  let saveButtonTitle = "";
  if (areSlotErrorsPresent) saveButtonTitle = "Correct errors before saving";
  else if (!currentUnsavedSlotChanges) saveButtonTitle = "No changes to save";
  else saveButtonTitle = "Save changes to program time slots";

  let cancelButtonTitle = "";
  if (isCancelButtonDisabled) cancelButtonTitle = "No changes to cancel";
  else cancelButtonTitle = "Cancel changes and revert to last saved state, then close modal";


  return (
    <div className="py-3">
      <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="hidden md:grid md:grid-cols-[1fr_1.5fr_1fr_1fr_0.5fr_auto] md:gap-x-2 items-baseline px-2.5 pt-1 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Type</span>
          <span>Slot Name</span>
          <span>Start Time</span>
          <span>End Time</span>
          <span className="text-center">Duration</span>
          <span className="sr-only">Actions</span>
        </div>

        <div className="max-h-72 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {internalSlots.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">No time slots defined for this program.</p>
          )}
          {internalSlots.map((slot, index) => {
            const currentError = slotErrors[slot.id] || '';
            return (
              <div
                key={slot.id}
                ref={index === internalSlots.length - 1 && internalSlots.length > initialProgramTimeSlots.length ? lastAddedSlotRef : null}
                className="p-3 bg-white border border-gray-200 rounded-md hover:bg-sky-50/50 transition-colors duration-150"
                role="group"
                aria-label={`Program time slot ${index + 1} configuration`}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_0.5fr_auto] gap-x-2 gap-y-3 items-start">
                  <div className="md:pt-0">
                     <label htmlFor={`slotType-${slot.id}`} className="text-xs font-medium text-gray-700 md:hidden mb-1 block">Slot Type</label>
                    <CreatableSearchableDropdown
                      id={`slotType-${slot.id}`}
                      label="Slot Type"
                      placeholder="e.g., Theory"
                      value={slot.slotType}
                      onChange={(val) => updateSlotValue(slot.id, 'slotType', val)}
                      suggestions={SLOT_TYPE_SUGGESTIONS}
                      className="min-h-[40px] text-sm"
                      error={currentError.includes("Type is required") ? "Type is required" : undefined}
                    />
                  </div>

                   <div className="md:pt-0">
                    <label htmlFor={`slotName-${slot.id}`} className="text-xs font-medium text-gray-700 md:hidden mb-1 block">Slot Name (Auto-generated)</label>
                    <input
                      type="text"
                      id={`slotName-${slot.id}`}
                      value={slot.slotName}
                      readOnly 
                      className={`form-input block w-full text-sm border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-default h-[40px] ${currentError.includes("Name") || currentError.includes("Slot names must be unique") || currentError.includes("Duplicate slot name") ? 'border-red-500' : ''}`}
                      aria-label="Slot Name (auto-generated)"
                      title="Slot name is auto-generated based on type and order, and cannot be edited directly."
                    />
                  </div>

                  <div className="md:pt-0">
                    <label htmlFor={`startTime-${slot.id}`} className="text-xs font-medium text-gray-700 md:hidden mb-1 block">Start Time</label>
                    <input
                      id={`startTime-${slot.id}`}
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlotValue(slot.id, 'startTime', e.target.value)}
                      className={`form-input block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 h-[40px] ${currentError.includes("Start & End times required") || currentError.includes("Start (") ? 'border-red-500' : ''}`}
                    />
                  </div>

                  <div className="md:pt-0">
                    <label htmlFor={`endTime-${slot.id}`} className="text-xs font-medium text-gray-700 md:hidden mb-1 block">End Time</label>
                    <input
                      id={`endTime-${slot.id}`}
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlotValue(slot.id, 'endTime', e.target.value)}
                      className={`form-input block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 h-[40px] ${currentError.includes("Start & End times required") || currentError.includes("Start (") ? 'border-red-500' : ''}`}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600 text-center self-center py-1 md:py-0 whitespace-nowrap h-[40px] flex items-center justify-center" aria-live="polite">
                    {formatDuration(slot.startTime, slot.endTime)}
                  </div>

                  <div className="flex items-center justify-end md:justify-center h-[40px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSlot(slot.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                      aria-label={`Delete slot: ${slot.slotName || `slot ${index + 1}`}`}
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {currentError && (
                  <p className="text-xs text-red-600 mt-1.5 ml-1" role="alert">
                    {currentError}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 pt-3 border-t border-gray-200 mt-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={addSlot}
              className="flex items-center"
            >
              <AddIcon className="w-4 h-4 mr-1.5" /> Add Slot
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={loadDefaultSlots}
                title={manualSlotAddedSinceLoadOrSave ? "Cannot load defaults after adding manual slots. Save or Cancel current changes first." : "Load a predefined set of default time slots. This will replace current slots."}
                disabled={manualSlotAddedSinceLoadOrSave}
              >
                Load Default Slots
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancelChanges}
              className="flex items-center"
              disabled={isCancelButtonDisabled}
              title={cancelButtonTitle}
            >
              <RefreshIcon className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
              className="flex items-center bg-green-500 hover:bg-green-600 focus:ring-green-400"
              disabled={isSaveButtonDisabled}
              title={saveButtonTitle}
            >
              <CheckIcon className="w-4 h-4 mr-1.5" /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramTimeSlotManager;