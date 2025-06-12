
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Program } from '../types';
import { SearchIcon, ChevronDownIcon } from './Icons';
import useDebounce from '../hooks/useDebounce';

interface ProgramRoutineSelectorProps {
  programs: Program[];
  selectedProgram: Program | null; // null represents "All Programs"
  onProgramSelect: (program: Program | null) => void;
  buttonClassName?: string; // Optional: Allows overriding default button classes
}

const ProgramRoutineSelector: React.FC<ProgramRoutineSelectorProps> = ({
  programs,
  selectedProgram,
  onProgramSelect,
  buttonClassName, // Use the passed prop
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm(''); // Reset search term when opening
      setTimeout(() => searchInputRef.current?.focus(), 0); 
    }
  }, [isOpen]);

  const filteredPrograms = useMemo(() => {
    return programs.filter(
      (program) =>
        program.programName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        program.programCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [programs, debouncedSearchTerm]);

  const handleSelect = (program: Program | null) => {
    onProgramSelect(program);
    setIsOpen(false);
  };
  
  const getFullProgramNameForDisplay = () => {
    if (selectedProgram) {
      return `${selectedProgram.programCode} - ${selectedProgram.programName}`;
    }
    return "All Programs Routine";
  }

  const getButtonTitle = () => {
    if (selectedProgram) {
      return `Viewing: ${selectedProgram.programCode} - ${selectedProgram.programName}. Click to change.`;
    }
    return "Viewing routine for All Programs. Click to change.";
  };

  const defaultButtonClasses = "flex items-center justify-between w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white text-gray-800 hover:bg-sky-50 focus:outline-none focus:border-sky-500 transition-all duration-150 ease-in-out";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || defaultButtonClasses} // Use buttonClassName if provided, otherwise default
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={getButtonTitle()}
      >
        <span className="truncate font-medium">{getFullProgramNameForDisplay()}</span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1 w-full sm:w-80 md:w-96 rounded-lg bg-white shadow-xl border border-slate-300 max-h-80 flex flex-col">
          <div className="p-2.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm} // Bind to immediate search term for responsiveness
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search programs by code or name..."
                className="block w-full rounded-md border-slate-300 pl-9 pr-3 py-2.5 text-sm placeholder-gray-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm"
                aria-label="Search for a program"
              />
            </div>
          </div>
          <ul
            tabIndex={-1}
            role="listbox"
            aria-label="Programs"
            className="flex-1 overflow-y-auto custom-scrollbar p-2.5 pt-0"
          >
            <li
              onClick={() => handleSelect(null)} 
              className={`px-3.5 py-2.5 text-sm rounded-md cursor-pointer font-medium mb-1 
                ${selectedProgram === null
                  ? 'bg-sky-100 text-sky-700'
                  : 'text-gray-800 hover:bg-sky-50 hover:text-sky-600'
                }`}
              role="option"
              aria-selected={selectedProgram === null}
            >
              All Programs
            </li>
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => (
                <li
                  key={program.id}
                  onClick={() => handleSelect(program)}
                  className={`px-3.5 py-2 text-sm rounded-md cursor-pointer truncate ${
                    selectedProgram?.id === program.id
                      ? 'bg-sky-100 text-sky-700 font-semibold'
                      : 'text-gray-700 hover:bg-sky-50 hover:text-sky-600'
                  }`}
                  role="option"
                  aria-selected={selectedProgram?.id === program.id}
                  title={`${program.programCode} - ${program.programName}`}
                >
                  {program.programCode} - {program.programName}
                </li>
              ))
            ) : (
              debouncedSearchTerm && <li className="px-3.5 py-2 text-sm text-gray-500 text-center">No programs match "{debouncedSearchTerm}".</li>
            )}
             {!debouncedSearchTerm && programs.length === 0 && (
                <li className="px-3.5 py-2 text-sm text-gray-500 text-center">
                    No programs available.
                </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProgramRoutineSelector;