

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AddIcon, DeleteIcon, CheckIcon } from './Icons'; 
import Button from './Button';
import { TimeInterval, ProgramTimeSlot, RoutineEntry } from '../types'; // Added ProgramTimeSlot, RoutineEntry

const generateId = () => Math.random().toString(36).substring(2, 11);

export const convertTo24HourFormat = (timeStrAMPM: string): string => {
  if (!timeStrAMPM) return '';
  const timePart = timeStrAMPM.trim().toUpperCase();
  const match = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);

  if (!match) return ''; 

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const modifier = match[3];

  if (modifier) { 
    if (modifier === 'AM') {
      if (hours === 12) { 
        hours = 0;
      }
    } else if (modifier === 'PM') {
      if (hours !== 12) { 
        hours += 12;
      }
    }
  }
  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

export const formatToAMPM = (timeHHmm: string): string => {
    if (!timeHHmm) return 'N/A';
    const [hoursStr, minutesStr] = timeHHmm.split(':');
    if (!hoursStr || !minutesStr) return 'Invalid Time';

    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (isNaN(hours) || isNaN(minutes)) return 'Invalid Time';

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    const hoursFormatted = String(hours).padStart(2, '0');
    const minutesFormatted = String(minutes).padStart(2, '0');
    return `${hoursFormatted}:${minutesFormatted} ${ampm}`;
};

export const formatDuration = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return 'N/A';

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
    return 'N/A';
  }

  const totalStartMinutes = startHours * 60 + startMinutes;
  const totalEndMinutes = endHours * 60 + endMinutes;

  if (totalEndMinutes < totalStartMinutes) {
    return 'Invalid';
  }
  
  const durationMinutes = totalEndMinutes - totalStartMinutes;
  
  if (durationMinutes === 0 && startTime && endTime && totalStartMinutes === totalEndMinutes) return '0 Minutes';

  return `${durationMinutes} Minutes`;
};

const EMPTY_SLOT_ERROR_MESSAGE = 'Start time and end time are required for this slot.';
const SLOT_NAME_ERROR_PREFIX = 'Slot name error: '; 

interface TimeIntervalManagerProps {
  initialIntervals?: TimeInterval[];
  onSave: (intervals: TimeInterval[]) => void; 
  defaultSlotStrings?: readonly string[];
  programOwnerDefaultSlots?: ProgramTimeSlot[]; 
  expectedSlotTypeForDefaults?: string; // e.g., "Theory", "Lab", or the actual roomType
  onCancel?: () => void; 
  hasParentChanges?: boolean; 
  onUnsavedChangesStatusChange?: (hasUnsavedChanges: boolean) => void; 
  routineEntries: RoutineEntry[]; // New prop
  currentClassRoomId: string; // New prop
}

const TimeIntervalManager: React.FC<TimeIntervalManagerProps> = ({
  initialIntervals = [],
  onSave,
  defaultSlotStrings = [],
  programOwnerDefaultSlots, 
  expectedSlotTypeForDefaults,
  hasParentChanges = false, 
  onUnsavedChangesStatusChange, 
  routineEntries,
  currentClassRoomId,
}) => {
  const [internalIntervals, setInternalIntervals] = useState<TimeInterval[]>([]);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});
  const [manualIntervalAdded, setManualIntervalAdded] = useState(false);
  const lastAddedIntervalRef = useRef<HTMLDivElement | null>(null);
  const stableInitialIntervalsRef = useRef<TimeInterval[]>([]);


  useEffect(() => {
    const currentInitialIntervals = initialIntervals || []; 
    const processedInitial = currentInitialIntervals.map((interval, index) => ({
      ...interval,
      id: interval.id || generateId(),
      slotName: interval.slotName || `Slot ${index + 1}`, 
    }));
    stableInitialIntervalsRef.current = JSON.parse(JSON.stringify(processedInitial));
    setInternalIntervals(processedInitial);
    setSlotErrors({});
    setManualIntervalAdded(false); 
    if (onUnsavedChangesStatusChange) { 
      onUnsavedChangesStatusChange(false); 
    }
  }, [initialIntervals, onUnsavedChangesStatusChange]); 

  useEffect(() => {
    if (lastAddedIntervalRef.current) {
      lastAddedIntervalRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      lastAddedIntervalRef.current = null;
    }
  }, [internalIntervals.length]);


  const isSlotUsed = useCallback((startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return false;
    return routineEntries.some(entry => 
      entry.roomId === currentClassRoomId &&
      entry.startTime === startTime &&
      entry.endTime === endTime
    );
  }, [routineEntries, currentClassRoomId]);

  const addInterval = () => {
    const newId = generateId();
    const slotPattern = /^Slot (\d+)$/i;
    let maxSlotNum = 0;
    internalIntervals.forEach(interval => {
        if (interval.slotName) {
            const match = interval.slotName.match(slotPattern);
            if (match && match[1]) {
                const num = parseInt(match[1], 10);
                if (num > maxSlotNum) {
                    maxSlotNum = num;
                }
            }
        }
    });
    const newSlotName = `Slot ${maxSlotNum + 1}`;

    let newStartTime = '';
    if (internalIntervals.length > 0) {
      const lastInterval = internalIntervals[internalIntervals.length - 1];
      if (lastInterval && lastInterval.endTime) {
        const timePattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timePattern.test(lastInterval.endTime)) {
            newStartTime = lastInterval.endTime;
        }
      }
    }

    setInternalIntervals(prev => [...prev, { id: newId, slotName: newSlotName, startTime: newStartTime, endTime: '' }]);
    setSlotErrors({}); 
    setManualIntervalAdded(true);
  };

  const deleteInterval = (id: string) => {
    const intervalToDelete = internalIntervals.find(interval => interval.id === id);
    if (intervalToDelete && isSlotUsed(intervalToDelete.startTime, intervalToDelete.endTime)) {
      alert("This slot is currently in use by a routine and cannot be deleted.");
      return;
    }

    const newIntervals = internalIntervals.filter(interval => interval.id !== id);
    setInternalIntervals(newIntervals);
    if (slotErrors[id]) {
      setSlotErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
    if (newIntervals.length === 0) {
      setManualIntervalAdded(false);
    }
  };

  const updateIntervalValue = (id: string, field: keyof TimeInterval, value: string) => { 
    setInternalIntervals(prev =>
      prev.map(interval =>
        interval.id === id ? { ...interval, [field]: value } : interval
      )
    );
    if (slotErrors[id]) {
      setSlotErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const anySlotInUse = useMemo(() => {
    return internalIntervals.some(interval => isSlotUsed(interval.startTime, interval.endTime));
  }, [internalIntervals, isSlotUsed]);

  const loadDefaultSlots = () => {
    if (anySlotInUse) {
      alert("Cannot load default slots when existing slots are in use by a routine. Please clear routine entries for these slots first.");
      return;
    }
    let slotsToLoad: TimeInterval[] = [];

    // Prioritize programOwnerDefaultSlots if provided (this means context is "load from owner")
    if (programOwnerDefaultSlots !== undefined) { 
      if (programOwnerDefaultSlots.length > 0) {
        slotsToLoad = programOwnerDefaultSlots.map((progSlot) => ({
          id: generateId(),
          slotName: progSlot.slotName, // Use slotName from ProgramTimeSlot
          startTime: progSlot.startTime,
          endTime: progSlot.endTime,
        })).filter(interval => interval.startTime && interval.endTime);
      } else {
        // programOwnerDefaultSlots is an empty array, meaning no matching slots from owner
        // or no owner selected. Load an empty set (clear current).
        slotsToLoad = [];
      }
    } else if (defaultSlotStrings && defaultSlotStrings.length > 0) {
      // Generic context (e.g., used in ProgramDetailsModal for its own generic defaults)
      slotsToLoad = defaultSlotStrings.map((slotStr, index) => {
        const [startStr, endStr] = slotStr.split(' - ');
        return {
          id: generateId(),
          slotName: `Slot ${index + 1}`,
          startTime: convertTo24HourFormat(startStr),
          endTime: convertTo24HourFormat(endStr),
        };
      }).filter(interval => interval.startTime && interval.endTime);
    }

    setInternalIntervals(slotsToLoad); // This will clear if slotsToLoad is empty
    setSlotErrors({});
    setManualIntervalAdded(false);
  };


  const hasUnsavedSlotChanges = useCallback((): boolean => {
    if (internalIntervals.length !== stableInitialIntervalsRef.current.length) return true;

    const initialMap = new Map(stableInitialIntervalsRef.current.map(i => [i.id, i]));

    for (const internal of internalIntervals) {
        const initial = initialMap.get(internal.id);
        if (!initial) return true; 

        const internalSlotUsed = isSlotUsed(internal.startTime, internal.endTime);
        const initialSlotUsed = isSlotUsed(initial.startTime, initial.endTime);

        if (internalSlotUsed || initialSlotUsed) { // If slot is or was used, ignore changes to it for "unsaved" status
          continue;
        }

        if (
            (internal.slotName?.trim() || '') !== (initial.slotName?.trim() || '') ||
            internal.startTime !== initial.startTime ||
            internal.endTime !== initial.endTime
        ) {
            return true;
        }
    }
    return false;
  }, [internalIntervals, isSlotUsed]);

  useEffect(() => {
    if (onUnsavedChangesStatusChange) {
      onUnsavedChangesStatusChange(hasUnsavedSlotChanges());
    }
  }, [internalIntervals, hasUnsavedSlotChanges, onUnsavedChangesStatusChange]);


  const handleSaveChanges = () => {
    const newSlotErrors: Record<string, string> = {};
    let hasAnyError = false;
    const seenSlotNames = new Map<string, string[]>(); 

    for (const interval of internalIntervals) {
      let currentError = '';
      const slotIsUsed = isSlotUsed(interval.startTime, interval.endTime);

      if (!slotIsUsed) { // Only validate if not used
        const slotName = interval.slotName;
        if (!slotName || String(slotName).trim() === '') {
          currentError = SLOT_NAME_ERROR_PREFIX + "Slot name is required.";
          hasAnyError = true;
        } else {
          const trimmedSlotName = String(slotName).trim(); 
          if (!seenSlotNames.has(trimmedSlotName)) {
            seenSlotNames.set(trimmedSlotName, []);
          }
          seenSlotNames.get(trimmedSlotName)!.push(interval.id);
        }

        if (!currentError) {
          if (!interval.startTime || !interval.endTime) {
            currentError = EMPTY_SLOT_ERROR_MESSAGE;
            hasAnyError = true;
          } else if (interval.startTime >= interval.endTime) {
            currentError = `Start time (${formatToAMPM(interval.startTime)}) must be before end time (${formatToAMPM(interval.endTime)}).`;
            hasAnyError = true;
          }
        }
      }
      if (currentError) {
        newSlotErrors[interval.id] = currentError;
      }
    }

    seenSlotNames.forEach((ids, name) => {
      if (ids.length > 1) { // More than one slot has this name
        hasAnyError = true;
        ids.forEach(id => {
          // Add/append duplicate name error only if the slot itself is not locked by routine usage
          const interval = internalIntervals.find(i => i.id === id);
          if (interval && !isSlotUsed(interval.startTime, interval.endTime)) {
            if (!newSlotErrors[id] || !newSlotErrors[id].startsWith(SLOT_NAME_ERROR_PREFIX)) {
               newSlotErrors[id] = (newSlotErrors[id] ? newSlotErrors[id] + ' ' : '') + SLOT_NAME_ERROR_PREFIX + "Duplicate slot name.";
            } else if (!newSlotErrors[id].includes("Duplicate")) {
               newSlotErrors[id] += " Duplicate slot name.";
            }
          }
        });
      }
    });

    setSlotErrors(newSlotErrors);

    if (!hasAnyError) {
      const intervalsToSave = internalIntervals.map(i => ({...i, slotName: i.slotName?.trim() }));
      stableInitialIntervalsRef.current = JSON.parse(JSON.stringify(intervalsToSave)); 
      onSave(intervalsToSave);
      setManualIntervalAdded(false); 
      if (onUnsavedChangesStatusChange) {
        onUnsavedChangesStatusChange(false); 
      }
    }
  };
  
  const currentUnsavedSlotChangesState = hasUnsavedSlotChanges();
  const areSlotErrorsPresent = Object.keys(slotErrors).length > 0;
  
  const isSaveButtonDisabled = areSlotErrorsPresent || (!currentUnsavedSlotChangesState && !hasParentChanges);

  let saveButtonTitle = "";
  if (areSlotErrorsPresent) {
    saveButtonTitle = "Correct time slot errors before saving";
  } else if (!currentUnsavedSlotChangesState && !hasParentChanges) {
    saveButtonTitle = "No changes to save";
  } else {
    saveButtonTitle = "Save changes";
  }

  // Logic for "Load Default Slots" button state and title
  let canLoadSourceDefaults = false;
  let specificLoadButtonTitle = "";
  const expectedTypeNormalized = expectedSlotTypeForDefaults?.toLowerCase();

  if (programOwnerDefaultSlots !== undefined) { // Context: Program Owner (from ClassRoomDetailsModal)
    if (programOwnerDefaultSlots.length > 0) {
        canLoadSourceDefaults = true;
        if (expectedTypeNormalized === 'theory' || expectedTypeNormalized === 'lab') {
            specificLoadButtonTitle = `Load ${expectedSlotTypeForDefaults} slots from Room Owner`;
        } else {
            specificLoadButtonTitle = "Load slots from Room Owner"; // Fallback if type isn't Theory/Lab
        }
    } else { // programOwnerDefaultSlots is empty (no matching slots or no owner)
        canLoadSourceDefaults = false;
        if (expectedTypeNormalized === 'theory' || expectedTypeNormalized === 'lab') {
            specificLoadButtonTitle = `Room Owner has no matching ${expectedSlotTypeForDefaults} slots or is not selected`;
        } else if (expectedSlotTypeForDefaults) {
            specificLoadButtonTitle = `Cannot load defaults for room type: ${expectedSlotTypeForDefaults}`;
        } else {
            specificLoadButtonTitle = "Room Owner not selected or has no slots"; // Generic if type unknown
        }
    }
  } else if (defaultSlotStrings && defaultSlotStrings.length > 0) { // Context: Generic defaults
    canLoadSourceDefaults = true;
    specificLoadButtonTitle = "Load generic predefined time slots";
  } else { // No defaults available at all
    canLoadSourceDefaults = false;
    specificLoadButtonTitle = "No default time slots available";
  }
  
  const isLoadDefaultsDisabled = manualIntervalAdded || !canLoadSourceDefaults || anySlotInUse;
  let loadDefaultsButtonTitle = "";
  if (anySlotInUse) {
    loadDefaultsButtonTitle = "Cannot load defaults: Some current slots are in use by routines.";
  } else if (manualIntervalAdded) {
    loadDefaultsButtonTitle = "Cannot load defaults after adding manual intervals. Clear or save.";
  } else {
    loadDefaultsButtonTitle = specificLoadButtonTitle;
  }


  return (
    <div className="py-3">
      <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
        
        <div className="hidden sm:flex sm:items-baseline sm:space-x-2 px-2.5 pt-1 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="sm:flex-grow-0 sm:flex-shrink-0 min-w-[100px] sm:max-w-[100px] md:max-w-[120px]">
            Slot Name
          </div>
          <div className="flex-1 min-w-0">
            Start Time
          </div>
          <div className="px-1 text-center self-center">
            &nbsp;
          </div>
          <div className="flex-1 min-w-0">
            End Time
          </div>
          <div className="sm:min-w-[90px] text-left whitespace-nowrap px-2">
            Duration
          </div>
          <div className="w-8 flex-shrink-0">
            &nbsp;
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
          {internalIntervals.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">No time intervals defined.</p>
          )}
          {internalIntervals.map((interval, index) => {
            const currentSlotError = slotErrors[interval.id] || '';
            let displayMessage = '';
             if (currentSlotError && currentSlotError !== EMPTY_SLOT_ERROR_MESSAGE) {
                displayMessage = currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX) 
                                 ? currentSlotError.substring(SLOT_NAME_ERROR_PREFIX.length) 
                                 : currentSlotError;
            }
            const slotIsCurrentlyUsed = isSlotUsed(interval.startTime, interval.endTime);
            const inputDisabledTitle = slotIsCurrentlyUsed ? "This slot is in use by a routine and cannot be modified." : "";

            return (
              <div 
                key={interval.id} 
                ref={index === internalIntervals.length - 1 && internalIntervals.length > (initialIntervals?.length || 0) ? lastAddedIntervalRef : null}
                className={`p-2.5 bg-white border rounded-md transition-colors duration-150 ${slotIsCurrentlyUsed ? 'border-yellow-400 bg-yellow-50 opacity-80' : 'border-gray-200 hover:bg-sky-50/50'}`}
                role="group"
                aria-label={`Time slot ${index + 1} configuration ${slotIsCurrentlyUsed ? '(In Use - Locked)' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                  <div className="w-full sm:flex-grow-0 sm:flex-shrink-0 min-w-[100px] sm:max-w-[100px] md:max-w-[120px]">
                    <label htmlFor={`slotName-${interval.id}`} className="sr-only">Slot Name for interval {index + 1}</label>
                    <input
                      type="text"
                      id={`slotName-${interval.id}`}
                      placeholder="e.g., Slot 1"
                      value={interval.slotName || ''}
                      onChange={(e) => updateIntervalValue(interval.id, 'slotName', e.target.value)}
                      disabled={slotIsCurrentlyUsed}
                      title={inputDisabledTitle}
                      className={`form-input block w-full text-sm rounded-md shadow-sm ${slotIsCurrentlyUsed ? 'border-yellow-300 bg-yellow-100 text-gray-500 cursor-not-allowed' : `border-gray-300 focus:ring-sky-500 focus:border-sky-500 ${currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX) ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : ''}`}`}
                      aria-invalid={!!currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX)}
                      aria-describedby={currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX) && displayMessage ? `error-${interval.id}` : undefined}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <label htmlFor={`startTime-${interval.id}`} className="sr-only">Start Time for {interval.slotName || `interval ${index + 1}`}</label>
                    <input
                      id={`startTime-${interval.id}`}
                      type="time"
                      value={interval.startTime}
                      onChange={(e) => updateIntervalValue(interval.id, 'startTime', e.target.value)}
                      disabled={slotIsCurrentlyUsed}
                      title={inputDisabledTitle}
                      className={`form-input block w-full text-sm rounded-md shadow-sm ${slotIsCurrentlyUsed ? 'border-yellow-300 bg-yellow-100 text-gray-500 cursor-not-allowed' : `border-gray-300 focus:ring-sky-500 focus:border-sky-500 ${(currentSlotError && !currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX)) ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : ''}`}`}
                      aria-label={`Start time for ${interval.slotName || `interval ${index + 1}`}`}
                      aria-invalid={!!(currentSlotError && !currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX))}
                      aria-describedby={currentSlotError && !currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX) && displayMessage ? `error-${interval.id}` : undefined}
                    />
                  </div>
                  <span className="text-gray-500 self-center hidden sm:block px-1" aria-hidden="true">–</span>
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`endTime-${interval.id}`} className="sr-only">End Time for {interval.slotName || `interval ${index + 1}`}</label>
                    <input
                      id={`endTime-${interval.id}`}
                      type="time"
                      value={interval.endTime}
                      onChange={(e) => updateIntervalValue(interval.id, 'endTime', e.target.value)}
                      disabled={slotIsCurrentlyUsed}
                      title={inputDisabledTitle}
                      className={`form-input block w-full text-sm rounded-md shadow-sm ${slotIsCurrentlyUsed ? 'border-yellow-300 bg-yellow-100 text-gray-500 cursor-not-allowed' : `border-gray-300 focus:ring-sky-500 focus:border-sky-500 ${(currentSlotError && !currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX)) ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500' : ''}`}`}
                      aria-label={`End time for ${interval.slotName || `interval ${index + 1}`}`}
                      aria-invalid={!!(currentSlotError && !currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX))}
                      aria-describedby={currentSlotError && !currentSlotError.startsWith(SLOT_NAME_ERROR_PREFIX) && displayMessage ? `error-${interval.id}` : undefined}
                    />
                  </div>
                  <div className={`text-xs sm:min-w-[90px] text-center sm:text-left py-1 sm:py-0 whitespace-nowrap px-2 ${slotIsCurrentlyUsed ? 'text-gray-500' : 'text-gray-600'}`} aria-live="polite">
                    {formatDuration(interval.startTime, interval.endTime)}
                  </div>
                  <div className="pt-1 sm:pt-0"> 
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInterval(interval.id)}
                      disabled={slotIsCurrentlyUsed}
                      title={slotIsCurrentlyUsed ? "This slot is in use by a routine and cannot be deleted." : `Delete slot: ${interval.slotName || `interval ${index + 1}`}`}
                      className={`w-full sm:w-auto p-2 flex items-center justify-center ${slotIsCurrentlyUsed ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                      aria-label={`Delete slot: ${interval.slotName || `interval ${index + 1}`}`}
                    >
                      <DeleteIcon className="w-4 h-4" />
                      <span className="sm:hidden ml-2">Delete Slot</span>
                    </Button>
                  </div>
                </div>
                {displayMessage && !slotIsCurrentlyUsed && (
                  <p id={`error-${interval.id}`} className="text-xs text-red-600 mt-1.5 ml-1" role="alert">
                    {displayMessage}
                  </p>
                )}
                 {slotIsCurrentlyUsed && (
                    <p className="text-xs text-yellow-700 mt-1.5 ml-1" role="status">
                        This slot is currently used in a routine and cannot be modified or deleted.
                    </p>
                )}
                 <div className="sm:hidden text-xs text-right pt-1 mt-1 border-t border-gray-100">
                    <span className={`${slotIsCurrentlyUsed ? 'text-gray-500' : 'text-gray-600'}`}>Duration: {formatDuration(interval.startTime, interval.endTime)}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={addInterval}
              className="flex items-center"
            >
              <AddIcon className="w-4 h-4 mr-1.5" /> Add Interval
            </Button>
            {/* "Load Default Slots" button */}
            {( (programOwnerDefaultSlots !== undefined) || (defaultSlotStrings && defaultSlotStrings.length > 0) ) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={loadDefaultSlots}
                disabled={isLoadDefaultsDisabled}
                title={loadDefaultsButtonTitle}
              >
                Load Default Slots
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveChanges}
              className="flex items-center bg-green-500 hover:bg-green-600 focus:ring-green-400"
              disabled={isSaveButtonDisabled}
              title={saveButtonTitle}
            >
              <CheckIcon className="w-4 h-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeIntervalManager;