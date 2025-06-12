
import React, { useEffect, useState, useMemo } from 'react';
import { CourseLoad, Program } from '../types'; 
import { CloseIcon, SearchIcon } from './Icons';
import FilterItem from './FilterItem';
import useDebounce from '../hooks/useDebounce';

interface CourseLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseLoadData: CourseLoad[];
  allPrograms: Program[]; 
}

const getRandomLevelTerm = (): string => {
  const level = Math.floor(Math.random() * 4) + 1; // 1 to 4
  const term = Math.floor(Math.random() * 3) + 1; // 1 to 3
  return `Level ${level} Term ${term}`;
};

const CourseLoadModal: React.FC<CourseLoadModalProps> = ({ isOpen, onClose, courseLoadData, allPrograms }) => {
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const debouncedGlobalSearchTerm = useDebounce(globalSearchTerm, 300);

  const [selectedProgramCodes, setSelectedProgramCodes] = useState<string[]>([]);
  const [programFilterSearchTerm, setProgramFilterSearchTerm] = useState('');
  // Debouncing for individual filter search terms (like programFilterSearchTerm) can be added if FilterItem's items list is very large.
  // For now, FilterItem handles its own internal debouncing for display.
  
  const [selectedTeacherIDs, setSelectedTeacherIDs] = useState<string[]>([]);
  const [teacherFilterSearchTerm, setTeacherFilterSearchTerm] = useState('');

  const [minStudentCountFilter, setMinStudentCountFilter] = useState<string>('');
  const [maxStudentCountFilter, setMaxStudentCountFilter] = useState<string>('');

  const [minClassTakenFilter, setMinClassTakenFilter] = useState<string>('');
  const [maxClassTakenFilter, setMaxClassTakenFilter] = useState<string>('');

  // Store generated level terms with course IDs to ensure stability during filtering and re-renders
  const courseLevelTerms = useMemo(() => {
    const map = new Map<string, string>();
    courseLoadData.forEach(course => {
      map.set(course.id, getRandomLevelTerm());
    });
    return map;
  }, [courseLoadData]);


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

  const pidToProgramCodeMap = useMemo(() => {
    return new Map(allPrograms.map(p => [String(p.pid), p.programCode]));
  }, [allPrograms]);

  const programFilterOptions = useMemo(() => {
    const uniqueProgramCodes = new Set<string>();
    courseLoadData.forEach(item => {
      const programCode = pidToProgramCodeMap.get(String(item.pid));
      if (programCode) {
        uniqueProgramCodes.add(programCode);
      }
    });
    return Array.from(uniqueProgramCodes).sort();
  }, [courseLoadData, pidToProgramCodeMap]);

  const teacherFilterOptions = useMemo(() => {
    const uniqueTeachers = new Map<string, { name: string; designation: string }>();
    courseLoadData.forEach(item => {
      if (item.teacherId && item.teacherName && !uniqueTeachers.has(item.teacherId)) {
        uniqueTeachers.set(item.teacherId, { name: item.teacherName, designation: item.designation });
      }
    });
    return Array.from(uniqueTeachers.entries())
      .map(([id, { name, designation }]) => `${name}, ${designation} (${id})`)
      .sort();
  }, [courseLoadData]);
  
  const filteredCourseLoadData = useMemo(() => {
    let data = [...courseLoadData];

    if (selectedProgramCodes.length > 0) {
      data = data.filter(item => {
        const programCode = pidToProgramCodeMap.get(String(item.pid));
        return programCode ? selectedProgramCodes.includes(programCode) : false;
      });
    }
    if (selectedTeacherIDs.length > 0) {
      const teacherIdSet = new Set(selectedTeacherIDs.map(idWithParens => idWithParens.match(/\(([^)]+)\)$/)?.[1] || ''));
      data = data.filter(item => teacherIdSet.has(item.teacherId));
    }

    const minStudent = parseInt(minStudentCountFilter, 10);
    const maxStudent = parseInt(maxStudentCountFilter, 10);
    if (!isNaN(minStudent) && minStudent >= 0) {
      data = data.filter(item => item.studentCount >= minStudent);
    }
    if (!isNaN(maxStudent) && maxStudent >= 0) {
      data = data.filter(item => item.studentCount <= maxStudent);
    }

    const minClassTaken = parseInt(minClassTakenFilter, 10);
    const maxClassTaken = parseInt(maxClassTakenFilter, 10);
    if (!isNaN(minClassTaken) && minClassTaken >= 0) {
      data = data.filter(item => item.classTaken >= minClassTaken);
    }
    if (!isNaN(maxClassTaken) && maxClassTaken >= 0) {
      data = data.filter(item => item.classTaken <= maxClassTaken);
    }

    if (debouncedGlobalSearchTerm.trim()) {
      const lowerSearchTerm = debouncedGlobalSearchTerm.toLowerCase();
      data = data.filter(item => {
        const levelTermString = courseLevelTerms.get(item.id) || '';
        const itemValues = Object.values(item).map(val => String(val).toLowerCase());
        return itemValues.some(val => val.includes(lowerSearchTerm)) || levelTermString.toLowerCase().includes(lowerSearchTerm);
      });
    }
    return data;
  }, [
    courseLoadData, selectedProgramCodes, selectedTeacherIDs, 
    debouncedGlobalSearchTerm, pidToProgramCodeMap, courseLevelTerms,
    minStudentCountFilter, maxStudentCountFilter,
    minClassTakenFilter, maxClassTakenFilter
  ]);

  
  const resetAllFilters = () => {
    setGlobalSearchTerm('');
    setSelectedProgramCodes([]);
    setProgramFilterSearchTerm('');
    setSelectedTeacherIDs([]);
    setTeacherFilterSearchTerm('');
    setMinStudentCountFilter('');
    setMaxStudentCountFilter('');
    setMinClassTakenFilter('');
    setMaxClassTakenFilter('');
  };

  if (!isOpen) {
    return null;
  }

  const tableHeaders = [
    "P-ID", "Course Code", "Course Title", "Section", "Credit", "Level Term", 
    "Student", "Weekly Class", "Routine Input", "Class Taken",
    "Teacher ID", "Teacher Name", "Designation"
  ];
  
  const inputBaseClass = "block w-full px-2 py-1.5 border border-gray-300 rounded-md leading-5 bg-white text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div
      className="fixed inset-0 bg-gray-700 bg-opacity-75 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="courseLoadModalTitle"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-screen-xl max-h-[95vh] flex flex-col overflow-hidden">
        <header className="sticky top-0 bg-white p-3.5 border-b border-gray-200 flex items-center justify-between space-x-4 z-30">
          <h2 id="courseLoadModalTitle" className="text-xl font-semibold text-gray-800 truncate">
            Course Load Data
          </h2>
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 justify-end">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden transition-all duration-150 ease-in-out focus-within:border-sky-500 bg-white w-auto sm:w-64 md:w-96">
                <div className="pl-3 pr-1 flex items-center pointer-events-none text-gray-400">
                    <SearchIcon className="w-5 h-5" />
                </div>
                <input
                    type="search"
                    placeholder="Search table content..."
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    className="py-2.5 px-1 min-w-0 flex-grow border-none focus:outline-none focus:ring-0 text-sm placeholder-gray-500"
                    aria-label="Search course load data"
                />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close course load modal"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 transition-colors flex-shrink-0"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-60 bg-gray-50 border-r border-gray-200 p-2.5 flex flex-col overflow-y-auto custom-scrollbar flex-shrink-0">
            <div className="mb-2 flex justify-between items-center px-1">
              <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
              <button
                onClick={resetAllFilters}
                className="text-xs text-sky-600 hover:text-sky-700 hover:underline focus:outline-none"
                title="Reset all filters"
              >
                Reset All
              </button>
            </div>
            <FilterItem
              title="Program Code"
              items={programFilterOptions}
              selectedItems={selectedProgramCodes} 
              onSelectionChange={setSelectedProgramCodes} 
              searchTerm={programFilterSearchTerm}
              onSearchTermChange={setProgramFilterSearchTerm}
              placeholder="Search program codes..."
            />
            <FilterItem
              title="Teacher"
              items={teacherFilterOptions}
              selectedItems={selectedTeacherIDs}
              onSelectionChange={setSelectedTeacherIDs}
              searchTerm={teacherFilterSearchTerm}
              onSearchTermChange={setTeacherFilterSearchTerm}
              placeholder="Search teachers..."
            />
            <div className="py-2 border-b border-gray-200">
              <div className="w-full flex items-center justify-between py-1.5 px-1 rounded-md">
                <span className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
                  Student Count
                </span>
              </div>
              <div className="mt-2 space-y-1.5 px-1">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minStudentCountFilter}
                    onChange={(e) => setMinStudentCountFilter(e.target.value)}
                    className={inputBaseClass}
                    min="0"
                    aria-label="Minimum student count"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxStudentCountFilter}
                    onChange={(e) => setMaxStudentCountFilter(e.target.value)}
                    className={inputBaseClass}
                    min="0"
                    aria-label="Maximum student count"
                  />
                </div>
              </div>
            </div>
            <div className="py-2 border-b border-gray-200 last:border-b-0">
              <div className="w-full flex items-center justify-between py-1.5 px-1 rounded-md">
                <span className="text-xs font-semibold text-gray-700 tracking-wide uppercase">
                  Class Taken
                </span>
              </div>
              <div className="mt-2 space-y-1.5 px-1">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minClassTakenFilter}
                    onChange={(e) => setMinClassTakenFilter(e.target.value)}
                    className={inputBaseClass}
                    min="0"
                    aria-label="Minimum class taken count"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxClassTakenFilter}
                    onChange={(e) => setMaxClassTakenFilter(e.target.value)}
                    className={inputBaseClass}
                    min="0"
                    aria-label="Maximum class taken count"
                  />
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 overflow-auto custom-scrollbar">
            {filteredCourseLoadData.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No course load data matches your filters.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="sticky top-0 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap z-10 bg-gray-50 border-b border-gray-200"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourseLoadData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 min-w-[80px]">{item.pid}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.courseCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 min-w-[200px]">{item.courseTitle}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.section}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{item.credit}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{courseLevelTerms.get(item.id) || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{item.studentCount}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                        {item.weeklyClass !== undefined ? item.weeklyClass : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">N/A</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{item.classTaken}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.teacherId}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.teacherName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{item.designation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CourseLoadModal;