
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Program, CourseLoad } from '../types';
import { SearchIcon, ChevronDownIcon } from './Icons';
import useDebounce from '../hooks/useDebounce';

interface RoutineSidebarProps {
  isOpen: boolean;
  program: Program;
  courseLoad: CourseLoad[];
  onMouseEnterContainer: () => void;
  onMouseLeaveContainer: () => void;
}

type FilterType = 'Done' | 'Partial' | 'Pending';

interface TeacherFilterItem {
  id: string; // teacherId
  display: string; // "Teacher Name, Designation (Teacher ID)"
}

const RoutineSidebar: React.FC<RoutineSidebarProps> = ({
  isOpen,
  program,
  courseLoad,
  onMouseEnterContainer,
  onMouseLeaveContainer,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Partial');
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
  const debouncedSidebarSearchTerm = useDebounce(sidebarSearchTerm, 300);
  const [selectedLevelTerm, setSelectedLevelTerm] = useState<string>('');

  const [selectedTeacherFilterIDs, setSelectedTeacherFilterIDs] = useState<string[]>([]);
  const [teacherDropdownSearchTerm, setTeacherDropdownSearchTerm] = useState('');
  const debouncedTeacherDropdownSearchTerm = useDebounce(teacherDropdownSearchTerm, 250);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const teacherDropdownRef = useRef<HTMLDivElement>(null);


  // Courses filtered by Program and Status (Done/Partial/Pending)
  const coursesAfterProgramAndStatusFilter = useMemo(() => {
    let filtered = program.id === "__ALL_PROGRAMS__"
      ? courseLoad
      : courseLoad.filter(c => String(c.pid) === String(program.pid));

    return filtered.filter(course => {
      const wc = course.weeklyClass ?? 0;
      const ri = course.routineInput ?? 0; // Assuming routineInput is 0 if N/A
      if (activeFilter === 'Done') return wc === ri && wc !== 0; // Ensure wc is not 0 for "Done"
      if (activeFilter === 'Partial') return ri >= 1 && ri < wc;
      if (activeFilter === 'Pending') return ri === 0;
      return true; // Should not happen if activeFilter is always one of the three
    });
  }, [program.id, program.pid, courseLoad, activeFilter]);

  // Available teachers for filter dropdown, based on program and status filters
  const availableTeachersForFilter = useMemo(() => {
    const teachers = new Map<string, TeacherFilterItem>();
    coursesAfterProgramAndStatusFilter.forEach(course => {
      if (course.teacherId && course.teacherName && !teachers.has(course.teacherId)) {
        teachers.set(course.teacherId, {
          id: course.teacherId,
          display: `${course.teacherName}, ${course.designation} (${course.teacherId})`
        });
      }
    });
    return Array.from(teachers.values()).sort((a,b) => a.display.localeCompare(b.display));
  }, [coursesAfterProgramAndStatusFilter]);

  // Teachers displayed in the dropdown (after internal search)
  const filteredTeachersForDropdown = useMemo(() => {
    if (!debouncedTeacherDropdownSearchTerm.trim()) return availableTeachersForFilter;
    const lowerSearch = debouncedTeacherDropdownSearchTerm.toLowerCase();
    return availableTeachersForFilter.filter(teacher => teacher.display.toLowerCase().includes(lowerSearch));
  }, [availableTeachersForFilter, debouncedTeacherDropdownSearchTerm]);
  
  // Courses filtered by Program, Status, and Teacher
  const coursesAfterTeacherFilter = useMemo(() => {
    if (selectedTeacherFilterIDs.length === 0) return coursesAfterProgramAndStatusFilter;
    return coursesAfterProgramAndStatusFilter.filter(course => selectedTeacherFilterIDs.includes(course.teacherId));
  }, [coursesAfterProgramAndStatusFilter, selectedTeacherFilterIDs]);


  // Memoize random level terms for courses relevant to the program
  const courseLevelTermsMap = useMemo(() => {
    const map = new Map<string, string>();
     // Use coursesAfterTeacherFilter to ensure level terms are only for relevant courses
    coursesAfterTeacherFilter.forEach(course => {
      if (!map.has(course.id)) {
        const level = Math.floor(Math.random() * 4) + 1;
        const term = Math.floor(Math.random() * 3) + 1;
        map.set(course.id, `Level ${level} Term ${term}`);
      }
    });
    return map;
  }, [coursesAfterTeacherFilter]); // Depends on courses already filtered by program, status, and teacher

  // Get unique level terms for the dropdown based on courses filtered by program, status, and teacher
  const uniqueLevelTermsForDropdown = useMemo(() => {
    const terms = new Set<string>();
    coursesAfterTeacherFilter.forEach(course => { // Use coursesAfterTeacherFilter
      const lt = courseLevelTermsMap.get(course.id);
      if (lt) {
        terms.add(lt);
      }
    });
    const sortedTerms = Array.from(terms).sort((a, b) => {
        const [aLevel, aTerm] = a.match(/\d+/g)!.map(Number);
        const [bLevel, bTerm] = b.match(/\d+/g)!.map(Number);
        if (aLevel !== bLevel) return aLevel - bLevel;
        return aTerm - bTerm;
    });
    return ["", ...sortedTerms];
  }, [coursesAfterTeacherFilter, courseLevelTermsMap]);


  // Fully filtered courses for display (Program -> Status -> Teacher -> Level Term -> Search Text)
  const fullyFilteredCourses = useMemo(() => {
    let filtered = [...coursesAfterTeacherFilter]; // Start with courses already filtered by P, S, T

    // 1. Level Term Dropdown Filter
    if (selectedLevelTerm) {
      filtered = filtered.filter(course => {
        const lt = courseLevelTermsMap.get(course.id);
        return lt === selectedLevelTerm;
      });
    }

    // 2. Search Text Filter (using debounced term)
    if (debouncedSidebarSearchTerm.trim()) {
      const lowerSearchTerm = debouncedSidebarSearchTerm.toLowerCase();
      filtered = filtered.filter(course => {
        const levelTermString = courseLevelTermsMap.get(course.id)?.toLowerCase() || '';
        return (
          course.courseCode.toLowerCase().includes(lowerSearchTerm) ||
          course.section.toLowerCase().includes(lowerSearchTerm) ||
          course.courseTitle.toLowerCase().includes(lowerSearchTerm) ||
          levelTermString.includes(lowerSearchTerm)
        );
      });
    }
    return filtered;
  }, [
    coursesAfterTeacherFilter, // Base list already filtered by Program, Status, Teacher
    selectedLevelTerm,
    debouncedSidebarSearchTerm, // Use debounced term here
    courseLevelTermsMap
  ]);

  const programCodeForDisplay = useMemo(() => {
    if (!program) return "";
    return program.id === "__ALL_PROGRAMS__" ? "All Programs" : program.programCode;
  }, [program]);

  const getButtonClasses = (filterType: FilterType) => {
    const base = "py-1 px-2 text-xs rounded-md transition-colors duration-150 flex-1";
    if (activeFilter === filterType) {
      return `${base} bg-sky-500 text-white font-semibold`;
    }
    return `${base} bg-slate-700 text-slate-300 hover:bg-slate-600`;
  };

  // Reset child filters when program changes or main status filter changes
  useEffect(() => {
    setSidebarSearchTerm('');
    setSelectedLevelTerm('');
    setSelectedTeacherFilterIDs([]);
    setTeacherDropdownSearchTerm('');
    setIsTeacherDropdownOpen(false);
  }, [program.id, activeFilter]);

  // Handle click outside for teacher dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(event.target as Node)) {
        setIsTeacherDropdownOpen(false);
      }
    };
    if (isTeacherDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTeacherDropdownOpen]);

  const handleTeacherSelection = (teacherId: string) => {
    setSelectedTeacherFilterIDs(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };
  
  const teacherDropdownButtonText = selectedTeacherFilterIDs.length > 0
    ? `${selectedTeacherFilterIDs.length} Teacher(s) Selected`
    : 'All Teachers';

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-72 bg-slate-900 text-slate-200 shadow-xl p-4
                  transform transition-transform duration-300 ease-in-out z-50 custom-scrollbar overflow-y-auto
                  ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      onMouseEnter={onMouseEnterContainer}
      onMouseLeave={onMouseLeaveContainer}
      aria-hidden={!isOpen}
      role="complementary"
      aria-label="Course Load Sidebar"
    >
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-sky-400">
          Course Load
        </h3>
        {programCodeForDisplay && (
          <p className="text-xs text-sky-500 mt-0.5">{programCodeForDisplay}</p>
        )}
        <hr className="border-t-2 border-slate-600 mt-2 mb-2" />
      </div>

      <div className="flex space-x-1.5 mb-2">
        {(['Done', 'Partial', 'Pending'] as FilterType[]).map(ft => (
          <button
            key={ft}
            onClick={() => setActiveFilter(ft)}
            className={getButtonClasses(ft)}
            aria-pressed={activeFilter === ft}
          >
            {ft}
          </button>
        ))}
      </div>

      {/* Teacher Filter Dropdown */}
      <div className="mb-2 relative" ref={teacherDropdownRef}>
        <button
          type="button"
          onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
          className="w-full flex items-center justify-between text-left bg-slate-800 text-slate-300 border border-slate-700 rounded-md py-1.5 px-3 text-xs focus:ring-sky-500 focus:border-sky-500"
          aria-haspopup="listbox"
          aria-expanded={isTeacherDropdownOpen}
        >
          <span className="truncate">{teacherDropdownButtonText}</span>
          <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 transform transition-transform duration-150 ${isTeacherDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {isTeacherDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded-md shadow-lg p-2">
            <div className="relative mb-1.5">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <SearchIcon className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="search"
                placeholder="Search teachers..."
                value={teacherDropdownSearchTerm} // Bind to immediate term
                onChange={(e) => setTeacherDropdownSearchTerm(e.target.value)}
                className="w-full bg-slate-700 text-slate-300 placeholder-slate-500 border border-slate-600 rounded py-1 pl-8 pr-2 text-xs focus:ring-sky-500 focus:border-sky-500"
                aria-label="Search teachers for filter"
              />
            </div>
            <ul className="max-h-32 overflow-y-auto custom-scrollbar space-y-1 pr-0.5">
              {filteredTeachersForDropdown.length > 0 ? (
                filteredTeachersForDropdown.map(teacher => (
                  <li key={teacher.id}>
                    <label className="flex items-center space-x-2 p-1 rounded hover:bg-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-400 focus:ring-offset-slate-800"
                        checked={selectedTeacherFilterIDs.includes(teacher.id)}
                        onChange={() => handleTeacherSelection(teacher.id)}
                        aria-labelledby={`teacher-filter-label-${teacher.id}`}
                      />
                      <span id={`teacher-filter-label-${teacher.id}`} className="text-xs text-slate-300 truncate" title={teacher.display}>
                        {teacher.display}
                      </span>
                    </label>
                  </li>
                ))
              ) : (
                <li className="text-xs text-slate-400 text-center py-1">
                  {availableTeachersForFilter.length === 0 ? "No teachers for current program/status." : "No teachers match search."}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {/* Level Term Filter Dropdown */}
      <div className="mb-2">
        <select
          value={selectedLevelTerm}
          onChange={(e) => setSelectedLevelTerm(e.target.value)}
          className="w-full bg-slate-800 text-slate-300 border border-slate-700 rounded-md py-1.5 px-3 text-xs focus:ring-sky-500 focus:border-sky-500"
          aria-label="Filter by Level Term"
          disabled={uniqueLevelTermsForDropdown.length <= 1}
        >
          {uniqueLevelTermsForDropdown.map(lt => (
            <option key={lt || 'all'} value={lt}>
              {lt || 'All Level Terms'}
            </option>
          ))}
        </select>
      </div>

      {/* Global Search for Sidebar */}
      <div className="mb-3 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="search"
          placeholder="Search courses..."
          value={sidebarSearchTerm} // Bind to immediate term
          onChange={(e) => setSidebarSearchTerm(e.target.value)}
          className="w-full bg-slate-800 text-slate-300 placeholder-slate-500 border border-slate-700 rounded-md py-1.5 pl-9 pr-3 text-xs focus:ring-sky-500 focus:border-sky-500"
          aria-label="Search courses in sidebar"
        />
      </div>
      
      {fullyFilteredCourses.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-2">
          No courses match the current filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {fullyFilteredCourses.map(course => (
            <li key={course.id} className="pb-3 border-b border-slate-700 last:border-b-0">
              <p
                className="font-semibold text-sm text-sky-300 truncate"
                title={`${course.courseCode} (${course.section}) - ${courseLevelTermsMap.get(course.id) || ''}`}
              >
                {course.courseCode} ({course.section})
                <span className="text-sky-400 text-xs"> - {courseLevelTermsMap.get(course.id) || 'N/A'}</span>
              </p>
              <p
                className="text-xs text-slate-400 mt-0.5 truncate"
                title={course.courseTitle}
              >
                {course.courseTitle}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center">
                <span>Credit: <strong className="text-slate-300">{course.credit}</strong></span>
                <span className="mx-1.5 text-slate-600">|</span>
                <span>Student: <strong className="text-slate-300">{course.studentCount}</strong></span>
                <span className="mx-1.5 text-slate-600">|</span>
                <span>WC: <strong className="text-slate-300">{course.weeklyClass ?? 'N/A'}</strong></span>
                <span className="mx-1.5 text-slate-600">|</span>
                <span>RI: <strong className="text-slate-300">{course.routineInput ?? 0}</strong></span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default RoutineSidebar;