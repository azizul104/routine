
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SearchIcon } from './Icons';
import useDebounce from '../hooks/useDebounce';

interface FilterItemProps {
  title: string;
  items: string[];
  selectedItems: string[];
  onSelectionChange: (newSelectedItems: string[]) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

const FilterItem: React.FC<FilterItemProps> = ({
  title,
  items,
  selectedItems,
  onSelectionChange,
  searchTerm, // This is the immediate search term for the input value
  onSearchTermChange,
  placeholder = "Search items...",
  isLoading = false,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTermInternal = useDebounce(searchTerm, 250); // Debounce internal search term

  // Ensure we only work with string items from the prop
  const validItems = useMemo(() => items.filter(item => typeof item === 'string'), [items]);

  const filteredDisplayItems = useMemo(() => {
    return validItems.filter(item => 
      item.toLowerCase().includes(debouncedSearchTermInternal.toLowerCase())
    );
  }, [validItems, debouncedSearchTermInternal]);

  const handleCheckboxChange = (item: string) => {
    const newSelectedItems = selectedItems.includes(item)
      ? selectedItems.filter(selected => selected !== item)
      : [...selectedItems, item];
    onSelectionChange(newSelectedItems);
  };

  const handleSelectAllInSearch = () => {
    const allFilteredSelected = filteredDisplayItems.length > 0 && filteredDisplayItems.every(item => selectedItems.includes(item));

    if (allFilteredSelected) {
      const newSelected = selectedItems.filter(item => !filteredDisplayItems.includes(item));
      onSelectionChange(newSelected);
    } else {
      const itemsToSelect = filteredDisplayItems.filter(item => !selectedItems.includes(item));
      onSelectionChange([...new Set([...selectedItems, ...itemsToSelect])]);
    }
  };
  
  const headerId = `filter-header-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const panelId = `filter-panel-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="py-2 border-b border-gray-200 last:border-b-0">
      <div
        id={headerId}
        className="w-full flex items-center justify-between py-1.5 px-1 rounded-md" 
      >
        <span className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
          {title}
          {selectedItems.length > 0 && (
            <span className="ml-1.5 text-sky-600 font-normal">({selectedItems.length})</span>
          )}
        </span>
      </div>

      <div id={panelId} role="region" aria-labelledby={headerId} className="mt-2 space-y-2 px-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
              <SearchIcon className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="search"
              placeholder={placeholder}
              value={searchTerm} // Input value is the immediate term
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white text-xs placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
              aria-label={`Search within ${title}`}
            />
          </div>
          {isLoading ? (
            <div className="text-center py-3">
              <p className="text-xs text-gray-500">Loading options...</p>
            </div>
          ) : (
            <>
              {validItems.length > 3 && filteredDisplayItems.length > 0 && (
                <button
                  onClick={handleSelectAllInSearch}
                  className="mb-1 text-xs text-sky-600 hover:text-sky-700 hover:underline focus:outline-none"
                >
                  {filteredDisplayItems.every(item => selectedItems.includes(item)) && filteredDisplayItems.length > 0 
                    ? 'Deselect All (in search)' 
                    : 'Select All (in search)'}
                </button>
              )}
              <div className="max-h-36 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
                {filteredDisplayItems.length > 0 ? (
                  filteredDisplayItems.map(item => { // item is guaranteed to be a string here
                    const itemElementIdSuffix = item.replace(/\s+/g, '-');
                    return (
                      <label key={item} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 focus:ring-offset-0 shrink-0"
                          checked={selectedItems.includes(item)}
                          onChange={() => handleCheckboxChange(item)}
                          aria-labelledby={`filter-item-label-${title}-${itemElementIdSuffix}`}
                        />
                        <span 
                          id={`filter-item-label-${title}-${itemElementIdSuffix}`} 
                          className="text-xs text-gray-700 group-hover:text-sky-700 truncate" 
                          title={item || '(Blank)'}
                        >
                          {item || '(Blank)'}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 px-0.5 py-1 italic">
                    {searchTerm && validItems.length > 0 ? "No matches found." : (validItems.length === 0 ? "No options available." : "Clear search to see all.")}
                  </p>
                )}
              </div>
              {selectedItems.length > 0 && (
                <button
                  onClick={() => onSelectionChange([])}
                  className="mt-1.5 text-xs text-red-500 hover:text-red-600 hover:underline focus:outline-none"
                >
                  Clear all selected in this filter
                </button>
              )}
            </>
          )}
        </div>
    </div>
  );
};

export default FilterItem;