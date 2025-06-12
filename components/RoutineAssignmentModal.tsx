
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Program, ClassRoom, DayOfWeek, ProgramTimeSlot, CourseLoad, RoutineEntry, RoutineAssignmentRequest } from '../types';
import Button from './Button';
import { 
    CloseIcon, SearchIcon, ChevronDownIcon, CalendarDaysIcon, 
    BuildingOfficeIcon, ClockIcon, CodeBracketSquareIcon, BookOpenIcon,
    AcademicCapIcon, HashtagIcon, UsersIcon, StarIcon, InformationCircleIcon,
    ClipboardDocumentListIcon 
} from './Icons';
import { formatToAMPM } from './TimeIntervalManager';
import useDebounce from '../hooks/useDebounce';

interface RoutineAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (day: DayOfWeek, roomId: string, timeSlot: ProgramTimeSlot, courseLoadId: string, bookingEndDate?: string) => void;
  context: {
    day: DayOfWeek;
    room: ClassRoom;
    timeSlot: ProgramTimeSlot;
  } | null;
  selectedProgramForAssignment: Program | null;
  courseLoadData: CourseLoad[];
  routineEntries: RoutineEntry[];
  assignmentRequests: RoutineAssignmentRequest[]; 
  allClassRooms: ClassRoom[]; 
}

const generateLevelTerm = (courseId: string): string => {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    const char = courseId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  const pseudoRandom = Math.abs(hash);
  const level = (pseudoRandom % 4) + 1; 
  const term = (pseudoRandom % 2) + 1;  
  return `L${level}, T${term}`;
};

const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string | number | undefined, valueTitle?: string }> = ({ icon, label, value, valueTitle }) => (
    <div className="flex items-center space-x-2 text-gray-700">
        {icon}
        <span className="font-medium text-gray-600 w-20 shrink-0">{label}:</span>
        <span className="truncate text-gray-800" title={valueTitle || String(value)}>{value ?? 'N/A'}</span>
    </div>
);


const RoutineAssignmentModal: React.FC<RoutineAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  context,
  selectedProgramForAssignment,
  courseLoadData,
  routineEntries,
  assignmentRequests, 
  allClassRooms, 
}) => {
  const [selectedCourseLoadId, setSelectedCourseLoadId] = useState<string>('');
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>('');
  const debouncedCourseSearchTerm = useDebounce(courseSearchTerm, 250);
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState<boolean>(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);
  const courseSearchInputRef = useRef<HTMLInputElement>(null); 
  const [bookingEndDate, setBookingEndDate] = useState<string>('');


  const [showModalContent, setShowModalContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowModalContent(true);
    } else {
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

  const existingApprovedEntry = useMemo(() => {
    if (!context || !routineEntries || !selectedProgramForAssignment || selectedProgramForAssignment.id === "__ALL_PROGRAMS__") {
        return null;
    }
    return routineEntries.find(
      e => e.day === context.day &&
           e.roomId === context.room.id &&
           e.startTime === context.timeSlot.startTime &&
           e.endTime === context.timeSlot.endTime &&
           e.slotType === context.timeSlot.slotType &&
           e.programId === selectedProgramForAssignment.id
    ) || null;
  }, [context, routineEntries, selectedProgramForAssignment]);
  
  const existingPendingRequest = useMemo(() => {
    if (!context || !assignmentRequests || !selectedProgramForAssignment || selectedProgramForAssignment.id === "__ALL_PROGRAMS__") {
      return null;
    }
    return assignmentRequests.find(
      req => req.requestingProgramId === selectedProgramForAssignment.id &&
             req.slotDetails.day === context.day &&
             req.slotDetails.roomId === context.room.id &&
             req.slotDetails.startTime === context.timeSlot.startTime &&
             req.slotDetails.endTime === context.timeSlot.endTime &&
             req.slotDetails.slotType === context.timeSlot.slotType &&
             req.status === 'pending'
    ) || null;
  }, [context, assignmentRequests, selectedProgramForAssignment]);

  useEffect(() => {
    if (isOpen && context) { 
      if (existingPendingRequest) {
        setSelectedCourseLoadId(existingPendingRequest.requestedCourseLoadId);
        setBookingEndDate(existingPendingRequest.bookingEndDate || ''); 
      } else if (existingApprovedEntry) {
        setSelectedCourseLoadId(existingApprovedEntry.courseLoadId);
        setBookingEndDate(existingApprovedEntry.bookingEndDate || ''); 
      } else { 
        setSelectedCourseLoadId('');
        setBookingEndDate(''); 
      }
      setCourseSearchTerm('');
      setIsCourseDropdownOpen(false);
    }
  }, [existingApprovedEntry, existingPendingRequest, isOpen, context]);

  const coursesForSelectedProgram = useMemo(() => {
    if (!selectedProgramForAssignment || selectedProgramForAssignment.id === "__ALL_PROGRAMS__" || !courseLoadData) {
      return [];
    }
    const targetPid = parseInt(selectedProgramForAssignment.pid, 10);
    if (isNaN(targetPid)) return [];
    return courseLoadData.filter(cl => cl.pid === targetPid);
  }, [selectedProgramForAssignment, courseLoadData]);

  const courseLevelTermsMap = useMemo(() => {
    const map = new Map<string, string>();
    coursesForSelectedProgram.forEach(course => {
        map.set(course.id, generateLevelTerm(course.id));
    });
    return map;
  }, [coursesForSelectedProgram]);


  const filteredCourses = useMemo(() => {
    return [...coursesForSelectedProgram];
  }, [coursesForSelectedProgram]);

  const searchedCourses = useMemo(() => {
    if (!debouncedCourseSearchTerm.trim()) {
      return filteredCourses;
    }
    const lowerSearchTerm = debouncedCourseSearchTerm.toLowerCase();
    return filteredCourses.filter(cl =>
      cl.courseCode.toLowerCase().includes(lowerSearchTerm) ||
      cl.courseTitle.toLowerCase().includes(lowerSearchTerm) ||
      cl.section.toLowerCase().includes(lowerSearchTerm) ||
      cl.teacherName.toLowerCase().includes(lowerSearchTerm) ||
      cl.designation.toLowerCase().includes(lowerSearchTerm) ||
      cl.teacherId.toLowerCase().includes(lowerSearchTerm)
    );
  }, [filteredCourses, debouncedCourseSearchTerm]);


  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseLoadId(courseId);
    setIsCourseDropdownOpen(false);
  };

  const handleClearOrCancelSelection = () => {
    setSelectedCourseLoadId('');
    setIsCourseDropdownOpen(false); 
  };

  const handleSubmit = () => {
    if (!context || !selectedProgramForAssignment || selectedProgramForAssignment.id === "__ALL_PROGRAMS__") {
        alert("A specific program must be selected for assignment.");
        return;
    }
    
    onSubmit(context.day, context.room.id, context.timeSlot, selectedCourseLoadId, bookingEndDate);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isCourseDropdownOpen && courseSearchInputRef.current) {
      setTimeout(() => { 
        courseSearchInputRef.current?.focus();
      }, 0);
    }
  }, [isCourseDropdownOpen]);


  if (!isOpen && !showModalContent) {
    return null;
  }

  if (!context || !selectedProgramForAssignment) {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center p-4 z-[80]">
        <div className="bg-white rounded-xl shadow-2xl p-6 text-center">
          <p>Error: Modal context or selected program is missing.</p>
          <Button onClick={onClose} variant="secondary" className="mt-4">Close</Button>
        </div>
      </div>
    );
  }

  const { day, room, timeSlot } = context;
  const programCodeForDisplay = selectedProgramForAssignment.programCode === 'ALL' ? 'Selected Program' : selectedProgramForAssignment.programCode;
  
  const currentRoomDetails = allClassRooms.find(cr => cr.id === room.id);
  const isSharedSlotScenario = !!currentRoomDetails && currentRoomDetails.roomOwner !== '' && currentRoomDetails.roomOwner !== selectedProgramForAssignment.programCode;
  
  const modalTitle = (existingApprovedEntry || existingPendingRequest) ? 'Update Routine' : 'Add Routine';
  const selectedCourseDetails = selectedCourseLoadId ? coursesForSelectedProgram.find(cl => cl.id === selectedCourseLoadId) : null;
  
  let submitButtonText = "Select a Course";
  // This flag determines if the date input content (if any) needs to be validated (e.g. not in past for certain actions)
  let isDateContentValidationRequired = false; 
  
  if (existingPendingRequest) {
    if (!selectedCourseLoadId) {
      submitButtonText = "Cancel Pending Request";
    } else {
      submitButtonText = "Update Pending Request";
      isDateContentValidationRequired = true; 
    }
  } else if (existingApprovedEntry) {
    if (!selectedCourseLoadId) {
      submitButtonText = "Clear Assignment";
    } else {
      if (isSharedSlotScenario) {
        const originalApprovedEndDate = existingApprovedEntry.bookingEndDate || '';
        const currentModalEndDate = bookingEndDate || '';
        if (currentModalEndDate !== originalApprovedEndDate) { 
          submitButtonText = "Request Date Change";
          isDateContentValidationRequired = !!currentModalEndDate; 
        } else { 
          submitButtonText = "Update Course";
        }
      } else { 
        submitButtonText = "Update Course";
        isDateContentValidationRequired = !!bookingEndDate; 
      }
    }
  } else { 
    if (selectedCourseLoadId) { 
      if (isSharedSlotScenario) {
        submitButtonText = "Request Assignment";
        isDateContentValidationRequired = true; 
      } else { 
        submitButtonText = "Assign Course";
        isDateContentValidationRequired = !!bookingEndDate; 
      }
    }
  }

  // Determine if the form is valid for submission
  let isFormValidForSubmit = false;
  if (submitButtonText === "Clear Assignment" || submitButtonText === "Cancel Pending Request") {
      isFormValidForSubmit = true;
  } else if (selectedCourseLoadId) { 
      // isDateContentValidationRequired means that IF a date is provided, it must be valid (e.g. not past)
      // The HTML 'required' attribute (isDateHtmlRequiredNonEmpty) handles if the field *must* be filled.
      if (isDateContentValidationRequired && bookingEndDate) { // If date content validation is active AND a date is provided
          const today = new Date(); today.setHours(0,0,0,0);
          const selectedEndDate = new Date(bookingEndDate); selectedEndDate.setHours(0,0,0,0);
          isFormValidForSubmit = selectedEndDate >= today; // Valid if not in past
      } else if (isDateContentValidationRequired && !bookingEndDate && 
                 ((existingPendingRequest && !!selectedCourseLoadId) || (isSharedSlotScenario && !existingApprovedEntry && !!selectedCourseLoadId))
                ) {
          // If date content validation active, date empty, BUT it's a scenario where HTML required is true
          isFormValidForSubmit = false; 
      } else {
          isFormValidForSubmit = true; // Valid if date content validation not active, or if it is but date is empty (and not HTML required)
      }
  }
  
  const isOwnerOfRoom = !!currentRoomDetails && currentRoomDetails.roomOwner === selectedProgramForAssignment.programCode;
  const isUnownedRoom = !!currentRoomDetails && currentRoomDetails.roomOwner === '';

  let showBookingEndDateInput = false;
  if (existingPendingRequest) { 
      showBookingEndDateInput = true; 
  } else if (isSharedSlotScenario) { 
      if (selectedCourseLoadId) { 
          showBookingEndDateInput = true;
      }
  } else if ((isOwnerOfRoom || isUnownedRoom) && selectedCourseLoadId) { 
      showBookingEndDateInput = true;
  }

  // Condition for applying the `min` date attribute (today) to the date input.
  // This applies if the action requires a future-or-present date.
  const conditionForMinDateConstraint = 
    (!!existingPendingRequest && !!selectedCourseLoadId) || 
    (isSharedSlotScenario && !existingApprovedEntry && !!selectedCourseLoadId) ||
    (isSharedSlotScenario && !!existingApprovedEntry && !!selectedCourseLoadId && (bookingEndDate || '') !== (existingApprovedEntry.bookingEndDate || '') && !!bookingEndDate);

  // Condition for the HTML5 `required` attribute on the date input.
  // The field must not be empty if it's a pending request update or a new shared request.
  const isDateHtmlRequiredNonEmpty = 
    (!!existingPendingRequest && !!selectedCourseLoadId) || 
    (isSharedSlotScenario && !existingApprovedEntry && !!selectedCourseLoadId);


  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center p-4 z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="routineAssignmentModalTitle"
    >
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl min-h-[500px] max-h-[calc(100vh-80px)] flex flex-col transform transition-all duration-300 ease-out
        ${showModalContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        <header className="sticky top-0 p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-slate-50 rounded-t-xl z-10">
          <div className="flex-grow">
            <h2 id="routineAssignmentModalTitle" className="text-xl font-semibold text-gray-800 text-center">
              {modalTitle}
            </h2>
            <div className="text-xs text-gray-500 mt-1.5 flex items-center justify-center space-x-2 flex-wrap">
                <span className="font-medium text-sky-700">{programCodeForDisplay} Routine</span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center"><CalendarDaysIcon className="w-3.5 h-3.5 mr-1 text-gray-400"/>{day}</span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="flex items-center truncate"><BuildingOfficeIcon className="w-3.5 h-3.5 mr-1 text-gray-400"/>{room.building}_{room.room} ({room.roomType})</span>
                <span className="text-gray-300 hidden md:inline">|</span>
                <span className="flex items-center"><ClockIcon className="w-3.5 h-3.5 mr-1 text-gray-400"/>{formatToAMPM(timeSlot.startTime)} - {formatToAMPM(timeSlot.endTime)}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-gray-200 ml-4 self-start"
          >
            <CloseIcon className="w-5 h-5 text-gray-600" />
          </Button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-5">

          <section>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Select Course & Section</h3>
            <div className="relative" ref={courseDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                className="w-full flex items-center justify-between text-left px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                aria-haspopup="listbox"
                aria-expanded={isCourseDropdownOpen}
              >
                <span className={`truncate ${selectedCourseLoadId ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {selectedCourseDetails
                    ? `${selectedCourseDetails.courseCode} (${selectedCourseDetails.section}) - ${selectedCourseDetails.courseTitle}`
                    : ((existingApprovedEntry || existingPendingRequest) && !selectedCourseLoadId ? 
                        (existingPendingRequest ? "Cancel Pending Request" : "Clear current assignment") 
                        : "Click to select a course...")}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ml-2 ${isCourseDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCourseDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-72 overflow-y-auto custom-scrollbar p-2.5">
                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      ref={courseSearchInputRef} 
                      type="search"
                      placeholder="Search by code, title, section..."
                      value={courseSearchTerm}
                      onChange={(e) => setCourseSearchTerm(e.target.value)}
                      className="block w-full rounded-md border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  {(existingApprovedEntry || existingPendingRequest) && (
                    <div
                      onClick={handleClearOrCancelSelection}
                      className="px-3 py-2 text-sm text-red-600 hover:bg-red-100 rounded-md cursor-pointer mb-1.5 border-b border-gray-100"
                      role="button"
                    >
                      {existingPendingRequest ? "Cancel Pending Request / Clear Selection" : "Clear Selection"}
                    </div>
                  )}
                  <ul className="space-y-1">
                    {searchedCourses.length > 0 ? (
                      searchedCourses.map(course => (
                        <li
                          key={course.id}
                          onClick={() => handleCourseSelect(course.id)}
                          className={`p-2.5 text-sm rounded-md cursor-pointer truncate transition-colors duration-100 ${
                            selectedCourseLoadId === course.id
                              ? 'bg-sky-100 text-sky-700 font-semibold'
                              : 'text-gray-700 hover:bg-sky-50 hover:text-sky-600'
                          }`}
                          title={`${course.courseCode} (${course.section}) - ${course.courseTitle} | Teacher: ${course.teacherName}`}
                        >
                          <div className="font-medium">{course.courseCode} ({course.section})</div>
                          <div className="text-xs text-gray-600 truncate">{course.courseTitle}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {course.teacherName} | Students: {course.studentCount} | WC: {course.weeklyClass ?? 'N/A'}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2.5 text-sm text-gray-500 text-center">
                        {coursesForSelectedProgram.length === 0 ? "No courses available for this program." : "No courses match your search."}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {showBookingEndDateInput && (
            <section className="mt-4">
              <label htmlFor="bookingEndDate" className="block text-sm font-semibold text-gray-600 mb-2">
                Booking End Date 
                {isDateHtmlRequiredNonEmpty ? <span className="text-red-500">*</span> : ""}
                {!isDateHtmlRequiredNonEmpty && (isSharedSlotScenario && existingApprovedEntry && selectedCourseLoadId) ? " (Optional, for Date Change)" : ""}
                {!isDateHtmlRequiredNonEmpty && !isSharedSlotScenario && !existingPendingRequest && selectedCourseLoadId ? " (Optional)" : ""}
              </label>
              <input
                type="date"
                id="bookingEndDate"
                value={bookingEndDate}
                onChange={(e) => setBookingEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                min={ !!conditionForMinDateConstraint ? new Date().toISOString().split('T')[0] : undefined}
                required={!!isDateHtmlRequiredNonEmpty}
              />
               { bookingEndDate && new Date(bookingEndDate) < new Date(new Date().setHours(0,0,0,0)) && isDateContentValidationRequired && (
                    <p className="text-xs text-red-500 mt-1">Booking end date cannot be in the past.</p>
                )}
                { !bookingEndDate && isDateHtmlRequiredNonEmpty && (
                    <p className="text-xs text-red-500 mt-1">Booking end date is required for this action.</p>
                )}
            </section>
          )}

          {selectedCourseDetails && selectedProgramForAssignment && (
            <section className="mt-5">
              <div className="p-4 border border-sky-200 rounded-lg bg-sky-50 shadow-sm space-y-2.5 text-sm">
                <DetailItem 
                    icon={<ClipboardDocumentListIcon className="w-4 h-4 text-sky-600"/>} 
                    label="Program" 
                    value={`${selectedProgramForAssignment.programCode} - ${selectedProgramForAssignment.programName}`} 
                    valueTitle={`${selectedProgramForAssignment.programCode} - ${selectedProgramForAssignment.programName}`} 
                />
                <DetailItem icon={<CodeBracketSquareIcon className="w-4 h-4 text-sky-600"/>} label="Code" value={selectedCourseDetails.courseCode} />
                <DetailItem icon={<BookOpenIcon className="w-4 h-4 text-sky-600"/>} label="Title" value={selectedCourseDetails.courseTitle} />
                <DetailItem icon={<HashtagIcon className="w-4 h-4 text-sky-600"/>} label="Section" value={selectedCourseDetails.section} />
                <DetailItem icon={<AcademicCapIcon className="w-4 h-4 text-sky-600"/>} label="Teacher" value={`${selectedCourseDetails.teacherName} (${selectedCourseDetails.designation})`} valueTitle={`${selectedCourseDetails.teacherName} (${selectedCourseDetails.designation})`}/>
                <DetailItem icon={<UsersIcon className="w-4 h-4 text-sky-600"/>} label="Students" value={selectedCourseDetails.studentCount} />
                <DetailItem icon={<StarIcon className="w-4 h-4 text-sky-600"/>} label="Credit" value={selectedCourseDetails.credit} />
                <DetailItem icon={<InformationCircleIcon className="w-4 h-4 text-sky-600"/>} label="L-Term" value={courseLevelTermsMap.get(selectedCourseDetails.id) || 'N/A'} />
                 <DetailItem icon={<ClockIcon className="w-4 h-4 text-sky-600"/>} label="Weekly Cls" value={selectedCourseDetails.weeklyClass ?? 'N/A'} />
              </div>
            </section>
          )}
        </main>

        <footer className="sticky bottom-0 p-4 border-t border-gray-200 flex justify-end space-x-3 bg-slate-50 rounded-b-xl z-10">
          <Button variant="secondary" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isFormValidForSubmit}
            className={!isFormValidForSubmit ? 'opacity-60 cursor-not-allowed' : ''}
            size="md"
            title={!isFormValidForSubmit ? (submitButtonText === "Select a Course" ? "Please select a course" : ((isDateHtmlRequiredNonEmpty && !bookingEndDate) ? "Booking end date is required" : (isDateContentValidationRequired && bookingEndDate && new Date(bookingEndDate) < new Date(new Date().setHours(0,0,0,0)) ? "Booking end date cannot be in the past" : "Form is invalid"))) : submitButtonText}
          >
            {submitButtonText}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default RoutineAssignmentModal;
