

import React, { useEffect, useState } from 'react';
import { Program, ProgramTimeSlot } from '../types';
import { CloseIcon } from './Icons';
import ProgramTimeSlotManager from './ProgramTimeSlotManager'; 

interface ProgramDetailsModalProps {
  isOpen: boolean;
  program: Program | null;
  onClose: () => void;
  onUpdateProgramTimeSlots: (programId: string, updatedTimeSlots: ProgramTimeSlot[]) => void; 
}

// DetailItem component is no longer used here as details are in the header.
// If it were used for other parts, it would remain.

const ProgramDetailsModal: React.FC<ProgramDetailsModalProps> = ({ 
  isOpen, 
  program, 
  onClose,
  onUpdateProgramTimeSlots 
}) => {
  const [hasUnsavedSlotChanges, setHasUnsavedSlotChanges] = useState(false);
  const [managerKey, setManagerKey] = useState(0); // Used to re-mount ProgramTimeSlotManager

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        let closeConfirmed = true;
        if (hasUnsavedSlotChanges) {
          try {
            closeConfirmed = window.confirm("You have unsaved time slot changes. Are you sure you want to close without saving them?");
          } catch (e) {
            console.error("Error with window.confirm on ESC:", e);
            closeConfirmed = false; 
          }
        }
        if (closeConfirmed) {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, hasUnsavedSlotChanges]);

  useEffect(() => {
    if (isOpen) {
      setHasUnsavedSlotChanges(false);
      setManagerKey(prevKey => prevKey + 1); 
    }
  }, [isOpen, program]); 

  if (!isOpen || !program) {
    return null;
  }

  const handleTimeSlotsSaveAndClose = (updatedSlots: ProgramTimeSlot[]) => {
    if (!program) return;
    onUpdateProgramTimeSlots(program.id, updatedSlots);
    setHasUnsavedSlotChanges(false); 
    onClose(); 
  };
  
  const handleSlotManagerUnsavedChangesStatus = (managerHasChanges: boolean) => {
     setHasUnsavedSlotChanges(managerHasChanges);
  };

  const handleManagerCancel = () => {
    // Directly close the modal when cancel is initiated from the manager
    // Manager itself handles reverting its state & reporting unsaved changes as false.
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center p-4 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="programDetailsModalTitleContent" // Updated ID for accessibility
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-grow">
            <h2 id="programDetailsModalTitleContent" className="text-xl font-bold text-sky-700">
              {program.programName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              <span>{program.faculty}</span>
              <span className="mx-1.5 sm:mx-2 text-gray-300">|</span>
              <span>P-ID: {program.pid}</span>
              <span className="mx-1.5 sm:mx-2 text-gray-300">|</span>
              <span className="truncate">{program.programType}</span>
              <span className="mx-1.5 sm:mx-2 text-gray-300">|</span>
              <span className="truncate">{program.semesterType}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              let closeConfirmed = true;
              if (hasUnsavedSlotChanges) {
                try {
                  closeConfirmed = window.confirm("You have unsaved time slot changes. Are you sure you want to close without saving them?");
                } catch (e) {
                  console.error("Error with window.confirm on X button click:", e);
                  console.warn("window.confirm failed. Closing modal as per user request to ensure it closes. Unsaved changes might be lost if the confirmation dialog itself is broken.");
                  closeConfirmed = true; 
                }
              }
              if (closeConfirmed) {
                onClose();
              }
            }}
            aria-label="Close details"
            className="ml-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150 flex-shrink-0"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Removed the old details section div as info is now in header */}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">Routine Template</h3>
            <ProgramTimeSlotManager
              key={managerKey} 
              initialProgramTimeSlots={program.programTimeSlots || []}
              onSave={handleTimeSlotsSaveAndClose} 
              programNameForContext={program.programName}
              onUnsavedChangesStatusChange={handleSlotManagerUnsavedChangesStatus}
              onManagerCancel={handleManagerCancel} // New prop for manager's cancel button
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProgramDetailsModal;
