

import React, { useEffect, useState, useCallback } from 'react';
import { ClassRoom, ClassRoomFormData } from '../types';
import ClassRoomForm from './ClassRoomForm';
import { CloseIcon, BuildingOfficeIcon } from './Icons';

interface ClassRoomFormModalProps {
  isOpen: boolean;
  classRoomToEdit?: ClassRoom | null;
  onSubmit: (classRoomData: ClassRoomFormData) => void;
  onClose: () => void;
  buildingSuggestions: string[];
  allClassRooms: ClassRoom[];
}

const ClassRoomFormModal: React.FC<ClassRoomFormModalProps> = ({
  isOpen,
  classRoomToEdit,
  onSubmit,
  onClose,
  buildingSuggestions,
  allClassRooms,
}) => {
  const [hasFormErrors, setHasFormErrors] = useState(false);
  const [duplicateCombinationErrorMessage, setDuplicateCombinationErrorMessage] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    setHasFormErrors(false); 
    setDuplicateCombinationErrorMessage(null);
    onClose();
  }, [onClose, setHasFormErrors, setDuplicateCombinationErrorMessage]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleClose]); 

  useEffect(() => {
    if (isOpen) {
      setHasFormErrors(false);
      setDuplicateCombinationErrorMessage(null); 
    }
  }, [isOpen, classRoomToEdit]);


  const handleValidationStatusChange = useCallback((errorsExist: boolean) => {
    setHasFormErrors(errorsExist);
  }, [setHasFormErrors]);
  
  const handleSetDuplicateCombinationError = useCallback((message: string | null) => {
    setDuplicateCombinationErrorMessage(message);
  }, [setDuplicateCombinationErrorMessage]);

  const handleFormSubmit = (classRoomData: ClassRoomFormData) => {
    onSubmit(classRoomData); 
    // Do not close modal here, onSubmit in parent (ClassRoomModal) handles closing
    // Resetting local state related to errors is good though
    setHasFormErrors(false);
    setDuplicateCombinationErrorMessage(null);
  };


  if (!isOpen) {
    return null;
  }

  const modalTitle = classRoomToEdit ? 'Edit Class Room' : 'Add New Class Room';

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center p-4 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="classRoomFormModalTitle"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <header className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-gray-50 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <BuildingOfficeIcon className="w-6 h-6 text-sky-600" />
            <h2 id="classRoomFormModalTitle" className="text-xl font-semibold text-gray-800">
              {modalTitle}
            </h2>
            {hasFormErrors && !duplicateCombinationErrorMessage && ( 
              <span className="text-sm text-red-500 ml-2 animate-pulse">
                Please correct the errors highlighted in the form.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close form"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-colors duration-150"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-0">
          <ClassRoomForm
            classRoomToEdit={classRoomToEdit}
            onSubmit={handleFormSubmit} 
            onCancel={handleClose}    
            buildingSuggestions={buildingSuggestions}
            allClassRooms={allClassRooms}
            onValidationStatusChange={handleValidationStatusChange}
            onSetDuplicateCombinationError={handleSetDuplicateCombinationError}
            duplicateCombinationErrorMessage={duplicateCombinationErrorMessage} // Pass message to form for rendering
          />
        </main>
      </div>
    </div>
  );
};

export default ClassRoomFormModal;
