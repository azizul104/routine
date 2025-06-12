

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ClassRoom, PREDEFINED_TIME_SLOTS, TimeInterval, Program, ProgramTimeSlot, RoutineEntry } from '../types';
import Button from './Button';
import { CloseIcon, SearchIcon, ChevronDownIcon } from './Icons';
import TimeIntervalManager from './TimeIntervalManager';
import CreatableSearchableDropdown from './CreatableSearchableDropdown';
import { ROOM_OWNER_SEPARATOR } from './ClassRoomForm';

interface ClassRoomDetailsModalProps {
  isOpen: boolean;
  classRoom: ClassRoom | null;
  onClose: () => void;
  onUpdateTimeSlots: (classRoomId: string, updatedTimeSlots: TimeInterval[]) => void;
  onUpdateRoomOwner: (classRoomId: string, newRoomOwner: string) => void;
  onUpdateRoomShare: (classRoomId: string, sharedWithProgramCodes: string[]) => void;
  roomOwnerSuggestions: string[];
  allPrograms: Program[];
  routineEntries: RoutineEntry[]; // New prop
}

const DetailDisplayItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
  <div className="text-center sm:text-left">
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}:</span>
    <span className="ml-1 text-gray-800">
      {value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : 'N/A'}
    </span>
  </div>
);

const detailsOrder: Array<{key: keyof Pick<ClassRoom, 'building' | 'floor' | 'roomType' | 'capacity'>; label: string}> = [
    { key: 'building', label: 'Building' },
    { key: 'floor', label: 'Floor' },
    { key: 'roomType', label: 'Room Type' },
    { key: 'capacity', label: 'Capacity' },
];

const arrayEquals = (a: string[] | undefined, b: string[] | undefined) => {
  const arrA = a ? [...a].sort() : [];
  const arrB = b ? [...b].sort() : [];
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i] !== arrB[i]) return false;
  }
  return true;
};

const ClassRoomDetailsModal: React.FC<ClassRoomDetailsModalProps> = ({
  isOpen,
  classRoom,
  onClose,
  onUpdateTimeSlots,
  onUpdateRoomOwner,
  onUpdateRoomShare,
  roomOwnerSuggestions,
  allPrograms,
  routineEntries
}) => {
  const [editedRoomOwner, setEditedRoomOwner] = useState<string>('');
  const [editedSharedWith, setEditedSharedWith] = useState<string[]>([]);
  const [shareSearchTerm, setShareSearchTerm] = useState('');
  const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  const shareSearchInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (classRoom) {
      setEditedRoomOwner(classRoom.roomOwner || '');
      setEditedSharedWith(classRoom.sharedWith || []);
      setShareSearchTerm('');
      setIsShareDropdownOpen(false); 
    }
  }, [classRoom]);

  const hasRoomOwnerChanged = useMemo(() => classRoom ? editedRoomOwner !== (classRoom.roomOwner || '') : false, [classRoom, editedRoomOwner]);
  const hasSharedWithChanged = useMemo(() => classRoom ? !arrayEquals(editedSharedWith, classRoom.sharedWith) : false, [classRoom, editedSharedWith]);

  const handleActualClose = () => {
    if (classRoom) {
      if (hasRoomOwnerChanged) {
        onUpdateRoomOwner(classRoom.id, editedRoomOwner);
      }
      if (hasSharedWithChanged) {
        onUpdateRoomShare(classRoom.id, editedSharedWith);
      }
    }
    onClose();
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isShareDropdownOpen) {
          setIsShareDropdownOpen(false);
        } else {
          handleActualClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleActualClose, isShareDropdownOpen]); // Updated dependencies

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
        setIsShareDropdownOpen(false);
      }
    };
    if (isShareDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isShareDropdownOpen]);

  useEffect(() => {
    if (isShareDropdownOpen && shareSearchInputRef.current) {
      shareSearchInputRef.current.focus();
    }
  }, [isShareDropdownOpen]);

  const filteredShareablePrograms = useMemo(() => {
    // Create the prioritized list first
    const selectedForSharing = allPrograms
      .filter(p => editedSharedWith.includes(p.programCode))
      .sort((a,b) => a.programCode.localeCompare(b.programCode));
      
    const availableForSharing = allPrograms
      .filter(p => !editedSharedWith.includes(p.programCode))
      .sort((a,b) => a.programCode.localeCompare(b.programCode));
      
    const orderedPrograms = [...selectedForSharing, ...availableForSharing];

    if (!shareSearchTerm.trim()) {
      return orderedPrograms;
    }

    const lowerSearchTerm = shareSearchTerm.toLowerCase();
    return orderedPrograms.filter(
      (program) =>
        program.programName.toLowerCase().includes(lowerSearchTerm) ||
        program.programCode.toLowerCase().includes(lowerSearchTerm)
    );
  }, [allPrograms, shareSearchTerm, editedSharedWith]);


  const handleShareCheckboxChange = (programCode: string) => {
    setEditedSharedWith((prev) =>
      prev.includes(programCode)
        ? prev.filter((code) => code !== programCode)
        : [...prev, programCode]
    );
  };

  const selectedOwnerProgramDetails = useMemo(() => {
    if (!editedRoomOwner || !allPrograms) return null;
    const ownerProgramCode = editedRoomOwner.split(ROOM_OWNER_SEPARATOR)[0].trim();
    return allPrograms.find(p => p.programCode === ownerProgramCode);
  }, [editedRoomOwner, allPrograms]);

  const programOwnerDefaultSlotsForManager = useMemo(() => {
    if (!selectedOwnerProgramDetails || !classRoom) return [];

    const ownerSlots = selectedOwnerProgramDetails.programTimeSlots || [];
    const classroomTypeLower = classRoom.roomType.toLowerCase();

    if (classroomTypeLower === 'theory' || classroomTypeLower === 'lab') {
      return ownerSlots.filter(
        (slot) => slot.slotType.toLowerCase() === classroomTypeLower
      );
    }
    
    // For other classroom types, or if no owner, no slots should be suggested from owner
    return [];
  }, [selectedOwnerProgramDetails, classRoom]);


  if (!isOpen || !classRoom) {
    return null;
  }

  const handleTimeIntervalsSave = (updatedIntervals: TimeInterval[]) => {
    if (!classRoom) return;
    onUpdateTimeSlots(classRoom.id, updatedIntervals);
    // TimeIntervalManager's save action should close this modal via its onSave -> onClose chain
    handleActualClose(); 
  };

  const handleRoomOwnerChange = (newOwnerValue: string) => {
    setEditedRoomOwner(newOwnerValue);
  };

  const parentHasChanges = hasRoomOwnerChanged || hasSharedWithChanged;

  const shareDropdownButtonLabel = editedSharedWith.length > 0
    ? `${editedSharedWith.length} program(s) selected`
    : "Select programs to share";

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center p-4 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="classRoomDetailsModalTitle"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="classRoomDetailsModalTitle" className="text-2xl font-bold text-sky-700 break-words text-center flex-grow">
            {classRoom.building}_{classRoom.room}
          </h2>
          <button
            type="button"
            onClick={handleActualClose}
            aria-label="Close details"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150 ml-4 flex-shrink-0"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <main className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-6 py-3 bg-gray-50 rounded-md shadow-sm">
            <div className="flex flex-col items-center space-y-1.5 sm:flex-row sm:flex-wrap sm:justify-center sm:items-baseline px-4 text-sm">
                {detailsOrder.map((detail, index) => (
                    <React.Fragment key={detail.key}>
                        <DetailDisplayItem label={detail.label} value={classRoom[detail.key] as string | number} />
                        {index < detailsOrder.length - 1 && (
                            <span className="text-gray-400 mx-2 hidden sm:inline" aria-hidden="true">|</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Room Owner (Optional)
              </h3>
              <CreatableSearchableDropdown
                id="detailsRoomOwner"
                label="Room Owner"
                placeholder="Select Room Owner"
                value={editedRoomOwner}
                onChange={handleRoomOwnerChange}
                suggestions={roomOwnerSuggestions}
                suggestionValueIsCode={true}
                suggestionSeparator={ROOM_OWNER_SEPARATOR}
                className="min-h-[50px]"
                isCreatable={false}
              />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Share With Programs (Optional)
              </h3>
              <div className="relative" ref={shareDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsShareDropdownOpen(!isShareDropdownOpen)}
                  className="w-full flex items-center justify-between text-left px-3.5 py-2.5 text-sm text-gray-900 bg-transparent border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:border-sky-600"
                  aria-haspopup="listbox"
                  aria-expanded={isShareDropdownOpen}
                >
                  <span className={editedSharedWith.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                    {shareDropdownButtonLabel}
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                      isShareDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isShareDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-2">
                    <div className="relative mb-2">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        ref={shareSearchInputRef}
                        type="search"
                        id="shareSearchProgram"
                        placeholder="Search programs..."
                        value={shareSearchTerm}
                        onChange={(e) => setShareSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm"
                        aria-label="Search programs to share with"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                      {filteredShareablePrograms.length > 0 ? (
                        filteredShareablePrograms.map((program) => (
                          <label
                            key={program.id}
                            className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-sky-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                              checked={editedSharedWith.includes(program.programCode)}
                              onChange={() => handleShareCheckboxChange(program.programCode)}
                              id={`share-program-${program.id}`}
                              aria-labelledby={`share-program-label-${program.id}`}
                            />
                            <span id={`share-program-label-${program.id}`} className="text-sm text-gray-700 truncate" title={`${program.programCode} - ${program.programName}`}>
                              {program.programCode} - {program.programName}
                            </span>
                          </label>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 text-center py-2">
                          {allPrograms.length === 0 ? "No programs available to share." : (shareSearchTerm ? "No programs match your search." : "Type to search programs.")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 text-center mb-2">
              Available Time Slots for this Room
            </h3>
            <TimeIntervalManager
              initialIntervals={classRoom.timeSlots}
              onSave={handleTimeIntervalsSave}
              defaultSlotStrings={PREDEFINED_TIME_SLOTS} // These are generic, might not be used if owner logic takes over
              programOwnerDefaultSlots={programOwnerDefaultSlotsForManager} 
              expectedSlotTypeForDefaults={classRoom.roomType} // Pass classroom's room type
              hasParentChanges={parentHasChanges}
              routineEntries={routineEntries} // Pass routine entries
              currentClassRoomId={classRoom.id} // Pass current classroom ID
            />
          </div>

        </main>
        {/* Footer removed */}
      </div>
    </div>
  );
};

export default ClassRoomDetailsModal;