import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, AddIcon } from './Icons';

interface CreatableSearchableDropdownProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
  suggestionValueIsCode?: boolean;
  suggestionSeparator?: string;
  error?: string;
  isCreatable?: boolean; // New prop to control creatability
}

const CreatableSearchableDropdown: React.FC<CreatableSearchableDropdownProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  suggestions,
  className = '',
  suggestionValueIsCode = false,
  suggestionSeparator = ' — ',
  error,
  isCreatable = true, // Default to true (creatable)
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayInputValue, setDisplayInputValue] = useState(value);
  const [showAddNewButtonInPanel, setShowAddNewButtonInPanel] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (suggestionValueIsCode) {
      const matchingSuggestion = suggestions.find(s => s.startsWith(value + suggestionSeparator));
      setDisplayInputValue(matchingSuggestion || value || '');
    } else {
      setDisplayInputValue(value || '');
    }
  }, [value, suggestions, suggestionValueIsCode, suggestionSeparator]);

  useEffect(() => {
    const trimmedDisplayInput = displayInputValue.trim();
    if (!trimmedDisplayInput || !isCreatable) { // also check isCreatable
      setShowAddNewButtonInPanel(false);
      return;
    }

    let isNewEntry = true;
    if (suggestionValueIsCode) {
      const currentCode = trimmedDisplayInput.split(suggestionSeparator)[0].trim();
      if (suggestions.some(s => s.startsWith(currentCode + suggestionSeparator) || s === currentCode)) {
        isNewEntry = false;
      }
    } else {
      if (suggestions.some(s => s.toLowerCase() === trimmedDisplayInput.toLowerCase())) {
        isNewEntry = false;
      }
    }
    setShowAddNewButtonInPanel(isCreatable && isNewEntry && !!trimmedDisplayInput);

  }, [displayInputValue, suggestions, suggestionValueIsCode, suggestionSeparator, isCreatable]);


  const filteredSuggestions = suggestions.filter(suggestionFullString =>
    suggestionFullString.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMainInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayValue = e.target.value;
    setDisplayInputValue(newDisplayValue); 
    if (!isOpen) setIsOpen(true);
    setSearchTerm(newDisplayValue); 

    if (isCreatable) { // Only call onChange immediately if creatable
      if (suggestionValueIsCode) {
        onChange(newDisplayValue.includes(suggestionSeparator) ? newDisplayValue.split(suggestionSeparator)[0].trim() : newDisplayValue.trim());
      } else {
        onChange(newDisplayValue); 
      }
    }
  };

  const handleSelectSuggestion = (suggestionFullString: string) => {
    let codeToStore = '';
    if (suggestionValueIsCode) {
      codeToStore = suggestionFullString.split(suggestionSeparator)[0].trim();
      onChange(codeToStore); 
      setDisplayInputValue(suggestionFullString); 
    } else {
      codeToStore = suggestionFullString;
      onChange(suggestionFullString); 
      setDisplayInputValue(suggestionFullString);
    }
    setSearchTerm('');
    setIsOpen(false);
    setShowAddNewButtonInPanel(false);
  };
  
  const handleConfirmNewInPanel = () => {
    if (!isCreatable) return; // Should not be callable if not creatable

    const newEntry = displayInputValue.trim();
    if (suggestionValueIsCode) {
        const codeToStore = newEntry.includes(suggestionSeparator) 
                            ? newEntry.split(suggestionSeparator)[0].trim()
                            : newEntry;
        onChange(codeToStore);
        // Update display to either the full matched suggestion or the code if no full suggestion form exists
        const matchedFullSuggestion = suggestions.find(s=>s.startsWith(codeToStore+suggestionSeparator));
        setDisplayInputValue(matchedFullSuggestion || codeToStore );
    } else {
        onChange(newEntry);
        setDisplayInputValue(newEntry);
    }
    setShowAddNewButtonInPanel(false);
    setSearchTerm('');
    setIsOpen(true); 
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };


  const toggleDropdown = () => {
    const newIsOpenState = !isOpen;
    setIsOpen(newIsOpenState);
    if (newIsOpenState) {
        const trimmedDisplayInput = displayInputValue.trim();
        let isNewEntry = true;
        if (isCreatable) { // Only calculate isNewEntry if creatable
            if (suggestionValueIsCode) {
                const currentCode = trimmedDisplayInput.split(suggestionSeparator)[0].trim();
                isNewEntry = !suggestions.some(s => s.startsWith(currentCode + suggestionSeparator));
            } else {
                isNewEntry = !suggestions.some(s => s.toLowerCase() === trimmedDisplayInput.toLowerCase());
            }
            setShowAddNewButtonInPanel(isNewEntry && !!trimmedDisplayInput);
        } else {
            setShowAddNewButtonInPanel(false);
        }
        
        if (!isCreatable || !isNewEntry || !trimmedDisplayInput) { 
            setSearchTerm(trimmedDisplayInput.includes(suggestionSeparator) ? '' : trimmedDisplayInput); 
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    } else {
        setSearchTerm(''); 
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            if (!isCreatable && isOpen) { // Specific blur handling for non-creatable mode if dropdown was open
                const typedValue = displayInputValue.trim();
                const typedCode = suggestionValueIsCode ? typedValue.split(suggestionSeparator)[0].trim() : typedValue;

                let matchedSuggestionFull = '';
                const foundMatch = suggestions.some(s => {
                    const s_code = suggestionValueIsCode ? s.split(suggestionSeparator)[0].trim() : s;
                    if (s_code === typedCode) {
                        matchedSuggestionFull = s;
                        return true;
                    }
                    return false;
                });

                if (foundMatch) {
                    if (typedCode !== value) { 
                        onChange(typedCode); 
                    }
                    setDisplayInputValue(matchedSuggestionFull); 
                } else {
                    // Revert to display of current 'value'
                    let displayForCurrentValue = '';
                    if (value) { 
                        displayForCurrentValue = suggestionValueIsCode
                            ? (suggestions.find(s => s.startsWith(value + suggestionSeparator)) || value)
                            : (suggestions.find(s => s === value) || value);
                    }
                    setDisplayInputValue(displayForCurrentValue || ''); // Ensure it's not undefined
                }
            }
            setIsOpen(false);
            setSearchTerm('');
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isCreatable, displayInputValue, value, suggestions, suggestionValueIsCode, suggestionSeparator, onChange]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        // For non-creatable, Esc should also revert if input is invalid
        if (!isCreatable) {
            const typedValue = displayInputValue.trim();
            const typedCode = suggestionValueIsCode ? typedValue.split(suggestionSeparator)[0].trim() : typedValue;
            const isMatch = suggestions.some(s => (suggestionValueIsCode ? s.split(suggestionSeparator)[0].trim() : s) === typedCode);
            if (!isMatch) {
                let displayForCurrentValue = '';
                if (value) {
                    displayForCurrentValue = suggestionValueIsCode
                        ? (suggestions.find(s => s.startsWith(value + suggestionSeparator)) || value)
                        : (suggestions.find(s => s === value) || value);
                }
                setDisplayInputValue(displayForCurrentValue || '');
            }
        }
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isCreatable, displayInputValue, value, suggestions, suggestionValueIsCode, suggestionSeparator]); // Added dependencies
  
  const floatingLabelBaseStyle = "absolute left-2.5 px-1 bg-white transition-all duration-200 ease-in-out pointer-events-none text-sm";
  const floatingLabelInactiveStyle = "top-1/2 -translate-y-1/2 scale-100 text-gray-500";
  const floatingLabelActiveStyle = "top-0 -translate-y-1/2 scale-75 text-sky-600";
  
  const mainInputBaseClass = `peer block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:shadow-md bg-transparent`;
  const errorInputClass = 'border-red-500 focus:border-red-500 focus:ring-red-500/30';
  const normalInputClass = 'border-slate-300 focus:border-sky-600 focus:ring-sky-600/30';

  const isLabelFloated = isOpen || !!displayInputValue;


  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          id={id}
          ref={mainInputRef}
          value={displayInputValue}
          onChange={handleMainInputChange}
          onClick={() => { if (!isOpen) toggleDropdown(); }}
          onFocus={() => { if (!isOpen) toggleDropdown(); }}
          placeholder={placeholder || " "}
          className={`${mainInputBaseClass} ${error ? errorInputClass : normalInputClass}`}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label
          htmlFor={id}
          onClick={toggleDropdown}
          className={`${floatingLabelBaseStyle} ${isLabelFloated ? floatingLabelActiveStyle : floatingLabelInactiveStyle} peer-focus:${floatingLabelActiveStyle} cursor-text`}
        >
          {label}
        </label>
        <button
          type="button"
          onClick={toggleDropdown}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label="Toggle dropdown"
        >
          <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>
      </div>
      {error && <p id={`${id}-error`} className="text-xs text-red-500 pt-1">{error}</p>}

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto p-2">
          {isCreatable && showAddNewButtonInPanel && displayInputValue.trim() ? (
            <button
              type="button"
              onClick={handleConfirmNewInPanel}
              className="w-full flex items-center justify-center px-3 py-2 text-sm text-white bg-sky-500 hover:bg-sky-600 rounded-md transition-colors"
            >
              <AddIcon className="w-4 h-4 mr-2" />
              Accept "{displayInputValue.trim()}" as new
            </button>
          ) : (
            <>
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <ul className="space-y-1">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((suggestionFullString, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestionFullString)}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded-md cursor-pointer"
                    >
                      {suggestionFullString}
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-1.5 text-sm text-gray-500 text-center">
                     No suggestions found.
                  </li>
                )}
                 {isCreatable && searchTerm.trim() && 
                    !suggestions.some(s => 
                        suggestionValueIsCode ? 
                        s.split(suggestionSeparator)[0].trim().toLowerCase() === searchTerm.trim().toLowerCase() : 
                        s.toLowerCase() === searchTerm.trim().toLowerCase()
                    ) &&
                    !suggestions.some(s => s.toLowerCase() === searchTerm.trim().toLowerCase()) && 
                    (
                    <li
                        onClick={() => handleSelectSuggestion(searchTerm.trim())} 
                        className="px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-50 rounded-md cursor-pointer border-t border-gray-100 mt-1 pt-1.5"
                    >
                        Use "{searchTerm.trim()}"
                    </li>
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreatableSearchableDropdown;