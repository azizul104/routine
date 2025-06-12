import React, { useEffect, useState } from 'react';
import { Program, ProgramFormData } from '../types';
import ProgramForm from './ProgramForm';
import { CloseIcon } from './Icons';

interface ProgramFormModalProps {
  isOpen: boolean;
  programToEdit?: Program | null;
  onSubmit: (programData: ProgramFormData) => void;
  onClose: () => void;
  facultySuggestions: string[];
}

const ProgramFormModal: React.FC<ProgramFormModalProps> = ({ 
  isOpen, 
  programToEdit, 
  onSubmit, 
  onClose,
  facultySuggestions
}) => {
  const [showModalContent, setShowModalContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModalContent(true); // Trigger entry animation
    } else {
      // For a simple fade-out, you might need to delay `onClose`
      // or manage unmounting. For now, focus on entry.
      setShowModalContent(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen && !showModalContent) { // Ensure modal is not rendered if not open
    return null;
  }

  const modalTitle = programToEdit ? 'Edit Program' : 'Add New Program';

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center p-4 z-[60]" // Slightly increased opacity
      role="dialog"
      aria-modal="true"
      aria-labelledby="programFormModalTitle"
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out 
                    ${showModalContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <header className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 id="programFormModalTitle" className="text-2xl font-semibold text-gray-800"> {/* Enhanced title */}
            {modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-0"> {/* Padding removed, ProgramForm will handle its own */}
          {isOpen && ( // Conditionally render form only when modal is fully open to ensure smooth animation
             <ProgramForm
              programToEdit={programToEdit}
              onSubmit={onSubmit}
              onCancel={onClose}
              facultySuggestions={facultySuggestions}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProgramFormModal;