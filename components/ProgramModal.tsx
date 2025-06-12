
import React, { useState, useEffect, useMemo } from 'react';
import { Program, ProgramFormData, ProgramTimeSlot } from '../types'; 
import { initialPrograms } from '../data/programData'; // Keep for facultySuggestions if it's static
import ProgramTable from './ProgramTable';
import ProgramFormModal from './ProgramFormModal';
import ProgramDetailsModal from './ProgramDetailsModal';
import { AddIcon, CloseIcon, SearchIcon } from './Icons';
import useDebounce from '../hooks/useDebounce';

interface ProgramModalProps {
  onClose: () => void;
  programs: Program[]; // Receive programs from App.tsx
  onProgramsChange: (updatedPrograms: Program[]) => void; // Handler to update programs in App.tsx
}

const ProgramModal: React.FC<ProgramModalProps> = ({ onClose, programs, onProgramsChange }) => {
  // Local state for UI within this modal
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isProgramFormModalOpen, setIsProgramFormModalOpen] = useState(false);
  const [currentProgramForForm, setCurrentProgramForForm] = useState<Program | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProgramForDetails, setSelectedProgramForDetails] = useState<Program | null>(null);

  // Faculty suggestions can still be derived from initialPrograms if they are static,
  // or from props.programs if they need to reflect current data.
  // Using initialPrograms here for simplicity as it's a common pattern for such suggestions.
  const facultySuggestions = useMemo(() => {
    const allFaculties = initialPrograms.map(p => p.faculty);
    return [...new Set(allFaculties)].filter(Boolean).sort();
  }, []); // Depends only on initialPrograms, so empty dependency array is fine.

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isProgramFormModalOpen) {
          setIsProgramFormModalOpen(false);
          setCurrentProgramForForm(null);
        } else if (isDetailsModalOpen) {
          // ProgramDetailsModal handles its own Esc logic for unsaved changes
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isProgramFormModalOpen, isDetailsModalOpen]);

  const filteredPrograms = useMemo(() => {
    if (!debouncedSearchTerm) return programs; // Use programs prop
    return programs.filter(program => // Use programs prop
      Object.values(program).some(value => {
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value).toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        }
        return false;
      })
    );
  }, [programs, debouncedSearchTerm]); // Depend on programs prop and debouncedSearchTerm

  const handleOpenAddForm = () => {
    setCurrentProgramForForm(null);
    setIsProgramFormModalOpen(true);
  };

  const handleOpenEditForm = (program: Program) => {
    setCurrentProgramForForm(program);
    setIsProgramFormModalOpen(true);
  };

  const handleDeleteProgram = (programId: string) => {
    if (window.confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
      const updatedPrograms = programs.filter(p => p.id !== programId); // Use programs prop
      onProgramsChange(updatedPrograms); // Call prop handler
    }
  };

  const handleFormSubmit = (programData: ProgramFormData) => {
    let updatedPrograms;
    if (currentProgramForForm) { 
      updatedPrograms = programs.map(p => // Use programs prop
        p.id === currentProgramForForm.id 
        ? { ...p, ...programData, id: currentProgramForForm.id, programTimeSlots: p.programTimeSlots || [] } 
        : p
      );
    } else { 
      if (programs.some(p => p.pid === programData.pid)) { // Use programs prop
        alert(`Program with P-ID ${programData.pid} already exists. P-ID must be unique.`);
        return; 
      }
      const newProgram: Program = {
        ...programData,
        id: programData.pid, 
        programTimeSlots: [], 
      }; 
      updatedPrograms = [newProgram, ...programs].sort((a, b) => a.pid.localeCompare(b.pid)); // Use programs prop
    }
    onProgramsChange(updatedPrograms); // Call prop handler
    setIsProgramFormModalOpen(false);
    setCurrentProgramForForm(null);
  };
  
  const handleFormModalClose = () => {
    setIsProgramFormModalOpen(false);
    setCurrentProgramForForm(null);
  };

  const handleShowDetails = (program: Program) => {
    setSelectedProgramForDetails(program);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedProgramForDetails(null);
    setIsDetailsModalOpen(false);
  };

  const handleUpdateProgramTimeSlots = (programId: string, updatedTimeSlots: ProgramTimeSlot[]) => {
    const updatedProgramsList = programs.map(p => // Use programs prop
      p.id === programId ? { ...p, programTimeSlots: updatedTimeSlots } : p
    );
    onProgramsChange(updatedProgramsList); // Call prop handler
    
    // If the currently detailed program is the one being updated, refresh its details view
    if (selectedProgramForDetails && selectedProgramForDetails.id === programId) {
      setSelectedProgramForDetails(prevDetails => prevDetails ? { ...prevDetails, programTimeSlots: updatedTimeSlots } : null);
    }
    // The ProgramDetailsModal itself handles closing via its own onSave -> onClose logic
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="programModalTitle"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 bg-white p-4 border-b border-gray-200 flex items-center justify-between space-x-4">
            <h2 id="programModalTitle" className="text-2xl font-semibold text-gray-800 truncate">
              DIU Program List
            </h2>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden transition-all duration-150 ease-in-out focus-within:border-sky-500 bg-white w-auto sm:w-64 md:w-80">
                  <div className="pl-3 pr-1 flex items-center pointer-events-none text-gray-400">
                      <SearchIcon className="w-5 h-5" />
                  </div>
                  <input
                      type="search"
                      placeholder="Search programs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="py-2 min-w-0 flex-grow border-none focus:outline-none focus:ring-0 text-sm placeholder-gray-500"
                      aria-label="Search programs"
                  />
                  <button
                      type="button"
                      onClick={handleOpenAddForm}
                      className="flex items-center flex-shrink-0 px-2.5 py-1.5 border-l border-gray-300 text-sky-600 hover:bg-sky-50 focus:outline-none focus:bg-sky-100 transition-colors duration-150"
                      aria-label="Add new program"
                      title="Add New Program"
                  >
                      <AddIcon className="w-5 h-5" />
                      <span className="hidden sm:inline ml-1 text-sm font-medium">Add</span>
                  </button>
              </div>
              
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150 flex-shrink-0"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <ProgramTable
              programs={filteredPrograms} // Pass filtered programs from prop
              onEdit={handleOpenEditForm}
              onDelete={handleDeleteProgram}
              onRowClick={handleShowDetails}
            />
          </main>
        </div>
      </div>

      <ProgramFormModal
        isOpen={isProgramFormModalOpen}
        programToEdit={currentProgramForForm}
        onSubmit={handleFormSubmit}
        onClose={handleFormModalClose}
        facultySuggestions={facultySuggestions}
      />

      {isDetailsModalOpen && selectedProgramForDetails && (
        <ProgramDetailsModal
          isOpen={isDetailsModalOpen}
          program={selectedProgramForDetails}
          onClose={handleCloseDetailsModal} // This closes the details modal
          onUpdateProgramTimeSlots={handleUpdateProgramTimeSlots} // This updates App state & triggers details modal close
        />
      )}
    </>
  );
};

export default ProgramModal;