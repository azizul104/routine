
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Program, ClassRoom, DayOfWeek, DAYS_OF_WEEK, ProgramTimeSlot, TimeInterval, CourseLoad, RoutineEntry, RoutineAssignmentRequest, Notification } from '../types';
import RoutineSlotButton, { RoutineSlotButtonProps } from './RoutineSlotButton';
import ProgramRoutineSelector from './ProgramRoutineSelector';
import Button from './Button';
import { CodeBracketSquareIcon, BuildingOfficeIcon, SearchIcon, ClipboardDocumentListIcon, MailIcon, LockClosedIcon } from './Icons';
import { formatToAMPM } from './TimeIntervalManager';
import RoutineSidebar from './RoutineSidebar'; 
import useDebounce from '../hooks/useDebounce';
import NotificationBell from './NotificationBell'; // Import NotificationBell

interface RoutineViewProps {
  selectedProgram: Program; 
  classRooms: ClassRoom[];
  allPrograms: Program[];
  appSelectedProgram: Program | null; 
  onSelectProgramForRoutine: (program: Program | null) => void;
  onProgramModalOpen: () => void;
  onClassRoomModalOpen: () => void;
  onCourseLoadModalOpen: () => void;
  onAssignmentRequestModalOpen: (requestIdToHighlight?: string) => void; 
  courseLoadData: CourseLoad[];
  routineEntries: RoutineEntry[]; 
  assignmentRequests: RoutineAssignmentRequest[]; 
  onOpenRoutineAssignmentModal: (day: DayOfWeek, room: ClassRoom, timeSlot: ProgramTimeSlot) => void; 
  notifications: Notification[];
  onMarkNotificationAsRead: (notificationId: string) => void;
  onMarkAllNotificationsAsRead: (programId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearAllNotifications: (programId: string) => void;
}

const SHARE_THEORY_FILTER = "Share Theory";
const SHARE_LAB_FILTER = "Share Lab";

interface DayColorStyle {
  sidebar: {
    selectedBg: string;
    selectedText: string;
    text: string;
    hoverBg: string;
  };
  slotButton: {
    baseBg: string;
    hoverBgSuffix: string; 
    focusRingColor: string; 
    iconTextColor: string;
    iconHoverTextColorSuffix: string; 
    borderColorClass: string;
    filledBaseBg: string;
    filledHoverBgSuffix: string;
    filledBorderColorClass: string;
    filledIconTextColor?: string; 
    pendingBaseBg?: string;
    pendingBorderColorClass?: string;
    pendingTextColor?: string;
    lockedExternalPendingBg?: string; 
    lockedExternalPendingBorder?: string;
    lockedExternalPendingTextColor?: string;
    actionableRequestBg?: string; // New style for actionable requests
    actionableRequestBorderColor?: string;
    actionableRequestTextColor?: string;
    actionableRequestIconColor?: string;
  };
}


const DAY_COLOR_CONFIG: Record<DayOfWeek, DayColorStyle> = {
  Saturday: {
    sidebar: { selectedBg: 'bg-purple-600', selectedText: 'text-white', text: 'text-purple-700', hoverBg: 'hover:bg-purple-100' },
    slotButton: { baseBg: 'bg-purple-100', hoverBgSuffix: 'bg-purple-200', focusRingColor: 'ring-purple-400', iconTextColor: 'text-purple-500', iconHoverTextColorSuffix: 'text-purple-700', borderColorClass: 'border-purple-300', filledBaseBg: 'bg-purple-200', filledHoverBgSuffix: 'bg-purple-300', filledBorderColorClass: 'border-purple-400', pendingBaseBg: 'bg-yellow-100', pendingBorderColorClass: 'border-yellow-300', pendingTextColor: 'text-yellow-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' }
  },
  Sunday: {
    sidebar: { selectedBg: 'bg-pink-600', selectedText: 'text-white', text: 'text-pink-700', hoverBg: 'hover:bg-pink-100' },
    slotButton: { baseBg: 'bg-pink-100', hoverBgSuffix: 'bg-pink-200', focusRingColor: 'ring-pink-400', iconTextColor: 'text-pink-500', iconHoverTextColorSuffix: 'text-pink-700', borderColorClass: 'border-pink-300', filledBaseBg: 'bg-pink-200', filledHoverBgSuffix: 'bg-pink-300', filledBorderColorClass: 'border-pink-400', pendingBaseBg: 'bg-yellow-100', pendingBorderColorClass: 'border-yellow-300', pendingTextColor: 'text-yellow-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' }
  },
  Monday: {
    sidebar: { selectedBg: 'bg-sky-600', selectedText: 'text-white', text: 'text-sky-700', hoverBg: 'hover:bg-sky-100' },
    slotButton: { baseBg: 'bg-sky-100', hoverBgSuffix: 'bg-sky-200', focusRingColor: 'ring-sky-400', iconTextColor: 'text-sky-500', iconHoverTextColorSuffix: 'text-sky-700', borderColorClass: 'border-sky-300', filledBaseBg: 'bg-sky-200', filledHoverBgSuffix: 'bg-sky-300', filledBorderColorClass: 'border-sky-400', pendingBaseBg: 'bg-yellow-100', pendingBorderColorClass: 'border-yellow-300', pendingTextColor: 'text-yellow-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' }
  },
  Tuesday: {
    sidebar: { selectedBg: 'bg-green-600', selectedText: 'text-white', text: 'text-green-700', hoverBg: 'hover:bg-green-100' },
    slotButton: { baseBg: 'bg-green-100', hoverBgSuffix: 'bg-green-200', focusRingColor: 'ring-green-400', iconTextColor: 'text-green-500', iconHoverTextColorSuffix: 'text-green-700', borderColorClass: 'border-green-300', filledBaseBg: 'bg-green-200', filledHoverBgSuffix: 'bg-green-300', filledBorderColorClass: 'border-green-400', pendingBaseBg: 'bg-yellow-100', pendingBorderColorClass: 'border-yellow-300', pendingTextColor: 'text-yellow-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' }
  },
  Wednesday: {
    sidebar: { selectedBg: 'bg-yellow-500', selectedText: 'text-yellow-900', text: 'text-yellow-700', hoverBg: 'hover:bg-yellow-100' },
    slotButton: { baseBg: 'bg-yellow-100', hoverBgSuffix: 'bg-yellow-200', focusRingColor: 'ring-yellow-400', iconTextColor: 'text-yellow-600', iconHoverTextColorSuffix: 'text-yellow-700', borderColorClass: 'border-yellow-300', filledBaseBg: 'bg-yellow-200', filledHoverBgSuffix: 'bg-yellow-300', filledBorderColorClass: 'border-yellow-400', pendingBaseBg: 'bg-amber-100', pendingBorderColorClass: 'border-amber-300', pendingTextColor: 'text-amber-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' } 
  },
  Thursday: {
    sidebar: { selectedBg: 'bg-indigo-600', selectedText: 'text-white', text: 'text-indigo-700', hoverBg: 'hover:bg-indigo-100' },
    slotButton: { baseBg: 'bg-indigo-100', hoverBgSuffix: 'bg-indigo-200', focusRingColor: 'ring-indigo-400', iconTextColor: 'text-indigo-500', iconHoverTextColorSuffix: 'text-indigo-700', borderColorClass: 'border-indigo-300', filledBaseBg: 'bg-indigo-200', filledHoverBgSuffix: 'bg-indigo-300', filledBorderColorClass: 'border-indigo-400', pendingBaseBg: 'bg-yellow-100', pendingBorderColorClass: 'border-yellow-300', pendingTextColor: 'text-yellow-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' }
  },
  Friday: {
    sidebar: { selectedBg: 'bg-teal-600', selectedText: 'text-white', text: 'text-teal-700', hoverBg: 'hover:bg-teal-100' },
    slotButton: { baseBg: 'bg-teal-100', hoverBgSuffix: 'bg-teal-200', focusRingColor: 'ring-teal-400', iconTextColor: 'text-teal-500', iconHoverTextColorSuffix: 'text-teal-700', borderColorClass: 'border-teal-300', filledBaseBg: 'bg-teal-200', filledHoverBgSuffix: 'bg-teal-300', filledBorderColorClass: 'border-teal-400', pendingBaseBg: 'bg-yellow-100', pendingBorderColorClass: 'border-yellow-300', pendingTextColor: 'text-yellow-700', lockedExternalPendingBg: 'bg-orange-100', lockedExternalPendingBorder: 'border-orange-300', lockedExternalPendingTextColor: 'text-orange-700', actionableRequestBg: 'bg-blue-100', actionableRequestBorderColor: 'border-blue-300', actionableRequestTextColor: 'text-blue-700', actionableRequestIconColor: 'text-blue-600' }
  },
};


const RoutineView: React.FC<RoutineViewProps> = ({
    selectedProgram, 
    classRooms,
    allPrograms,
    appSelectedProgram, 
    onSelectProgramForRoutine,
    onProgramModalOpen,
    onClassRoomModalOpen,
    onCourseLoadModalOpen,
    onAssignmentRequestModalOpen,
    courseLoadData,
    routineEntries,
    assignmentRequests,
    onOpenRoutineAssignmentModal,
    notifications,
    onMarkNotificationAsRead,
    onMarkAllNotificationsAsRead,
    onDeleteNotification,
    onClearAllNotifications
 }) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DAYS_OF_WEEK[0]);
  const [routineSearchTerm, setRoutineSearchTerm] = useState('');
  const debouncedRoutineSearchTerm = useDebounce(routineSearchTerm, 300);
  const isAllProgramsMode = selectedProgram.id === "__ALL_PROGRAMS__";

  const [isCourseLoadSidebarOpen, setIsCourseLoadSidebarOpen] = useState(false);
  const courseLoadSidebarHideTimeoutRef = useRef<number | null>(null);

  const handleMouseEnterCourseLoadSidebarTrigger = () => {
    if (courseLoadSidebarHideTimeoutRef.current) {
      clearTimeout(courseLoadSidebarHideTimeoutRef.current);
      courseLoadSidebarHideTimeoutRef.current = null;
    }
    setIsCourseLoadSidebarOpen(true);
  };

  const handleMouseLeaveCourseLoadSidebarArea = () => {
    courseLoadSidebarHideTimeoutRef.current = window.setTimeout(() => {
      setIsCourseLoadSidebarOpen(false);
    }, 300);
  };

  const courseLoadMap = useMemo(() => {
    const map = new Map<string, CourseLoad>();
    courseLoadData.forEach(cl => map.set(cl.id, cl));
    return map;
  }, [courseLoadData]);


  const programTimeSlots = useMemo(() => {
    return (selectedProgram.programTimeSlots || []).sort((a,b) => {
        if (a.startTime.localeCompare(b.startTime) !== 0) {
            return a.startTime.localeCompare(b.startTime);
        }
        return a.endTime.localeCompare(b.endTime);
    });
  }, [selectedProgram.programTimeSlots]);

  const programDefinedSlotTypes = useMemo(() => {
    const types = new Set<string>();
    programTimeSlots.forEach(slot => types.add(slot.slotType));
    const availableTypes = Array.from(types);

    return availableTypes.sort((a, b) => {
        const order: Record<string, number> = { "Theory": 1, "Lab": 2 };
        const aOrder = order[a] || Object.keys(order).length + 1;
        const bOrder = order[b] || Object.keys(order).length + 1;

        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }
        return a.localeCompare(b);
    });
  }, [programTimeSlots]);

  const ownRoomProgramTypes = useMemo(() => {
    return programDefinedSlotTypes.filter(type => type !== "Theory" && type !== "Lab")
      .sort((a,b) => a.localeCompare(b));
  }, [programDefinedSlotTypes]);


  const [selectedSlotTypeFilter, setSelectedSlotTypeFilter] = useState<string>("");

  useEffect(() => {
    const isCurrentFilterDisabled = isAllProgramsMode &&
                                   (selectedSlotTypeFilter === SHARE_THEORY_FILTER || selectedSlotTypeFilter === SHARE_LAB_FILTER);

    const currentFilterIsOwnType = programDefinedSlotTypes.includes(selectedSlotTypeFilter);
    const currentFilterIsShareTheory = selectedSlotTypeFilter === SHARE_THEORY_FILTER && programDefinedSlotTypes.includes("Theory");
    const currentFilterIsShareLab = selectedSlotTypeFilter === SHARE_LAB_FILTER && programDefinedSlotTypes.includes("Lab");

    if ( (selectedSlotTypeFilter && !isCurrentFilterDisabled && (currentFilterIsOwnType || currentFilterIsShareTheory || currentFilterIsShareLab) ) || programTimeSlots.length === 0 ) {
      return;
    }

    const hasOwnTheory = programDefinedSlotTypes.includes("Theory");
    const hasOwnLab = programDefinedSlotTypes.includes("Lab");

    if (hasOwnTheory) {
      setSelectedSlotTypeFilter("Theory");
    } else if (hasOwnLab) {
      setSelectedSlotTypeFilter("Lab");
    } else if (!isAllProgramsMode && hasOwnTheory) { 
      setSelectedSlotTypeFilter(SHARE_THEORY_FILTER);
    } else if (!isAllProgramsMode && hasOwnLab) { 
      setSelectedSlotTypeFilter(SHARE_LAB_FILTER);
    } else {
      const firstOtherOwnType = programDefinedSlotTypes.find(type => type !== "Theory" && type !== "Lab");
      if (firstOtherOwnType) {
        setSelectedSlotTypeFilter(firstOtherOwnType);
      } else {
        setSelectedSlotTypeFilter("");
      }
    }
  }, [programTimeSlots, programDefinedSlotTypes, isAllProgramsMode, selectedProgram.id, selectedSlotTypeFilter]);


  const relevantClassRooms = useMemo(() => {
    let filtered = [...classRooms];
    
    if (selectedSlotTypeFilter === SHARE_THEORY_FILTER) {
        if (isAllProgramsMode || !appSelectedProgram) return []; 
        filtered = filtered.filter(cr =>
            cr.roomType.toLowerCase() === 'theory' &&
            cr.sharedWith?.includes(appSelectedProgram.programCode) 
        );
    } else if (selectedSlotTypeFilter === SHARE_LAB_FILTER) {
        if (isAllProgramsMode || !appSelectedProgram) return [];
        filtered = filtered.filter(cr =>
            cr.roomType.toLowerCase() === 'lab' &&
            cr.sharedWith?.includes(appSelectedProgram.programCode) 
        );
    } else if (selectedSlotTypeFilter) { 
        if (isAllProgramsMode) {
             filtered = filtered.filter(cr => cr.roomType.toLowerCase() === selectedSlotTypeFilter.toLowerCase());
        } else if (appSelectedProgram) {
            filtered = filtered.filter(cr =>
                cr.roomType.toLowerCase() === selectedSlotTypeFilter.toLowerCase() &&
                cr.roomOwner === appSelectedProgram.programCode
            );
        } else { 
            return [];
        }
    } else { 
        return [];
    }

    return filtered.sort((a, b) => {
        const buildingCompare = a.building.localeCompare(b.building);
        if (buildingCompare !== 0) return buildingCompare;
        const roomANum = parseInt(a.room, 10);
        const roomBNum = parseInt(b.room, 10);
        if (!isNaN(roomANum) && !isNaN(roomBNum)) {
            if (roomANum !== roomBNum) return roomANum - roomBNum;
        }
        return a.room.localeCompare(b.room);
      });
  }, [classRooms, selectedSlotTypeFilter, isAllProgramsMode, appSelectedProgram]);


  const filteredTimeSlots = useMemo(() => {
    let typeToFilterBy = "";
    if (selectedSlotTypeFilter === SHARE_THEORY_FILTER) {
        typeToFilterBy = "theory";
    } else if (selectedSlotTypeFilter === SHARE_LAB_FILTER) {
        typeToFilterBy = "lab";
    } else if (selectedSlotTypeFilter) {
        typeToFilterBy = selectedSlotTypeFilter.toLowerCase();
    }

    if (typeToFilterBy) {
        return programTimeSlots.filter(slot => slot.slotType.toLowerCase() === typeToFilterBy);
    }
    return [];
  }, [programTimeSlots, selectedSlotTypeFilter]);

  const getFilterDisplayContext = () => {
    if (selectedSlotTypeFilter === SHARE_THEORY_FILTER) return "Shared Theory";
    if (selectedSlotTypeFilter === SHARE_LAB_FILTER) return "Shared Lab";
    return selectedSlotTypeFilter;
  }

  const baseFullWidthButtonClasses = "w-full text-left justify-start px-2.5 py-2 rounded-md text-sm font-medium focus:outline-none transition-colors duration-150 ease-in-out";
  const baseGroupButtonClasses = "flex-1 text-center justify-center px-3 py-2 rounded-md text-sm font-medium focus:outline-none whitespace-nowrap transition-all duration-150 ease-in-out";


  const hasProgramTheorySlots = programDefinedSlotTypes.includes("Theory");
  const hasProgramLabSlots = programDefinedSlotTypes.includes("Lab");
  const currentDayColors = DAY_COLOR_CONFIG[selectedDay];
  
  const getTeacherInitials = (teacherName: string): string => {
    if (!teacherName) return '';
    const nameParts = teacherName.split(' ');
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase();
    return nameParts.map(part => part[0]).join('').toUpperCase();
  };

  const pendingRequestCountForOwner = useMemo(() => {
    if (!appSelectedProgram || appSelectedProgram.id === "__ALL_PROGRAMS__") return 0;
    return assignmentRequests.filter(
      req => req.roomOwnerProgramCode === appSelectedProgram.programCode && req.status === 'pending'
    ).length;
  }, [assignmentRequests, appSelectedProgram]);

  const notificationsForCurrentProgram = useMemo(() => {
    if (!appSelectedProgram || appSelectedProgram.id === "__ALL_PROGRAMS__") return [];
    return notifications.filter(n => n.recipientProgramId === appSelectedProgram.id);
  }, [notifications, appSelectedProgram]);

  const unreadNotificationCount = useMemo(() => {
    return notificationsForCurrentProgram.filter(n => !n.isRead).length;
  }, [notificationsForCurrentProgram]);


  return (
    <div className="flex flex-col h-full bg-gray-100">
      {!isCourseLoadSidebarOpen && (
        <div
          className="fixed left-0 top-0 h-full w-3 bg-transparent z-[51] cursor-pointer"
          onMouseEnter={handleMouseEnterCourseLoadSidebarTrigger}
          title="Open Course Load Sidebar"
          aria-label="Open Course Load Sidebar"
        />
      )}
      <RoutineSidebar
        isOpen={isCourseLoadSidebarOpen}
        program={selectedProgram} 
        courseLoad={courseLoadData}
        onMouseEnterContainer={handleMouseEnterCourseLoadSidebarTrigger}
        onMouseLeaveContainer={handleMouseLeaveCourseLoadSidebarArea}
      />

      <header className="bg-sky-100 shadow-sm p-2 sm:px-3 flex items-center justify-between space-x-4 sticky top-0 z-30">
        <div className="flex items-stretch space-x-3 md:space-x-4 flex-1 min-w-0">
          <div className="flex-shrink-0 bg-sky-600 text-white px-4 py-1.5 rounded-lg shadow-md flex items-center justify-center">
            <h1 className="text-base sm:text-lg font-bold truncate" title="DIU Room Booking & Routine Management System">
              DIU RBRMS
            </h1>
          </div>
          <div className="flex items-stretch flex-grow max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl rounded-lg bg-white border border-gray-200 shadow-inner focus-within:border-transparent focus-within:ring-1 focus-within:ring-offset-0 focus-within:ring-sky-500">
            <div className="flex-shrink-0">
              <ProgramRoutineSelector
                programs={allPrograms}
                selectedProgram={appSelectedProgram} 
                onProgramSelect={onSelectProgramForRoutine}
                buttonClassName="h-full flex items-center justify-between text-left w-auto text-sm px-2 sm:px-2.5 py-1.5 text-gray-800 bg-transparent hover:bg-gray-100 focus:outline-none transition-colors duration-150 !border-none !shadow-none !rounded-none"
              />
            </div>
            <div className="border-l border-gray-200"></div>
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search routine..."
                value={routineSearchTerm}
                onChange={(e) => setRoutineSearchTerm(e.target.value)}
                className="block w-full h-full py-1.5 pl-8 sm:pl-9 pr-1.5 sm:pr-2 bg-transparent border-none !rounded-none focus:outline-none text-sm placeholder-gray-400"
                aria-label="Search routine by room or slot details"
              />
            </div>
          </div>
        </div>
        
        <nav className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
           {appSelectedProgram && appSelectedProgram.id !== "__ALL_PROGRAMS__" && (
            <NotificationBell
                programId={appSelectedProgram.id}
                notifications={notificationsForCurrentProgram}
                unreadCount={unreadNotificationCount}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onDeleteNotification={onDeleteNotification}
                onClearAll={onClearAllNotifications}
            />
          )}
          {appSelectedProgram && appSelectedProgram.id !== "__ALL_PROGRAMS__" && pendingRequestCountForOwner > 0 && (
             <Button
                onClick={() => onAssignmentRequestModalOpen()} // Open modal generally for now
                variant="ghost"
                className="flex items-center p-1.5 sm:px-2.5 sm:py-1.5 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 focus:outline-none focus:bg-yellow-100 relative"
                aria-label={`Review ${pendingRequestCountForOwner} pending assignment requests`}
                title={`Review ${pendingRequestCountForOwner} pending assignment requests`}
            >
                <MailIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Requests</span>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] items-center justify-center">
                        {pendingRequestCountForOwner}
                    </span>
                </span>
            </Button>
          )}
          <Button
            onClick={onProgramModalOpen}
            variant="ghost"
            className="flex items-center p-1.5 sm:px-2.5 sm:py-1.5 text-gray-500 hover:bg-gray-100 hover:text-sky-600 focus:outline-none focus:bg-gray-100"
            aria-label="Open Program Management"
            title="Program Management"
          >
            <CodeBracketSquareIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Program</span>
          </Button>
          <Button
            onClick={onClassRoomModalOpen}
            variant="ghost"
            className="flex items-center p-1.5 sm:px-2.5 sm:py-1.5 text-gray-500 hover:bg-gray-100 hover:text-sky-600 focus:outline-none focus:bg-gray-100"
            aria-label="Open Class Room Management"
            title="Class Room Management"
          >
            <BuildingOfficeIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Class Room</span>
          </Button>
          <Button
            onClick={onCourseLoadModalOpen}
            variant="ghost"
            className="flex items-center p-1.5 sm:px-2.5 sm:py-1.5 text-gray-500 hover:bg-gray-100 hover:text-sky-600 focus:outline-none focus:bg-gray-100"
            aria-label="Open Course Load Data"
            title="Course Load Data"
          >
            <ClipboardDocumentListIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline ml-1 text-xs sm:text-sm">Course Load</span>
          </Button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden"> 
        <aside className="w-full md:w-52 lg:w-60 bg-white shadow-lg p-5 space-y-6 overflow-y-auto custom-scrollbar md:border-r md:border-gray-200 flex flex-col flex-shrink-0">
          <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2 px-1 uppercase tracking-wider">Select Day</h3>
              <div className="flex flex-col space-y-1.5" role="group" aria-label="Select Day of the Week">
              {DAYS_OF_WEEK.map((day) => {
                  const dayConfig = DAY_COLOR_CONFIG[day].sidebar;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`${baseFullWidthButtonClasses}
                          ${selectedDay === day
                          ? `${dayConfig.selectedBg} ${dayConfig.selectedText} font-semibold`
                          : `${dayConfig.text} ${dayConfig.hoverBg}`
                          }`}
                      aria-pressed={selectedDay === day}
                    >
                      {day}
                    </button>
                  );
              })}
              </div>
          </div>

          <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2 px-1 uppercase tracking-wider">Own Room Type</h3>
              <div className="flex space-x-1.5 mb-1.5 bg-gray-100 p-1 rounded-lg" role="group" aria-label="Filter by Own Room Type">
                  <button
                      onClick={() => setSelectedSlotTypeFilter("Theory")}
                      className={`${baseGroupButtonClasses}
                      ${selectedSlotTypeFilter === "Theory"
                          ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700 focus:bg-sky-700'
                          : 'bg-white text-gray-700 hover:bg-gray-200 focus:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-gray-50'
                      }`}
                      aria-pressed={selectedSlotTypeFilter === "Theory"}
                      disabled={!hasProgramTheorySlots || isAllProgramsMode }
                      title={isAllProgramsMode ? "Own room filters require a specific program" : (!hasProgramTheorySlots ? "No 'Theory' slots defined for this program" : "Filter by own Theory rooms")}
                  >
                      Theory
                  </button>
                  <button
                      onClick={() => setSelectedSlotTypeFilter("Lab")}
                      className={`${baseGroupButtonClasses}
                      ${selectedSlotTypeFilter === "Lab"
                          ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700 focus:bg-sky-700'
                          : 'bg-white text-gray-700 hover:bg-gray-200 focus:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-gray-50'
                      }`}
                      aria-pressed={selectedSlotTypeFilter === "Lab"}
                      disabled={!hasProgramLabSlots || isAllProgramsMode}
                      title={isAllProgramsMode ? "Own room filters require a specific program" : (!hasProgramLabSlots ? "No 'Lab' slots defined for this program" : "Filter by own Lab rooms")}
                  >
                      Lab
                  </button>
              </div>
              {ownRoomProgramTypes.length > 0 && (
                  <div className="flex flex-col space-y-1.5" role="group" aria-label="Filter by other Own Room Types">
                      {ownRoomProgramTypes.map(type => {
                        const dayConfigForType = selectedDay ? DAY_COLOR_CONFIG[selectedDay].sidebar : DAY_COLOR_CONFIG[DAYS_OF_WEEK[0]].sidebar; 
                        return (
                          <button
                              key={type}
                              onClick={() => setSelectedSlotTypeFilter(type)}
                              className={`${baseFullWidthButtonClasses}
                              ${selectedSlotTypeFilter === type
                                  ? `${dayConfigForType.selectedBg} ${dayConfigForType.selectedText} font-semibold`
                                  : `text-gray-600 hover:bg-gray-100 hover:text-gray-800 focus:bg-gray-100` 
                              }`}
                              aria-pressed={selectedSlotTypeFilter === type}
                              title={`Filter by own ${type} rooms`}
                              disabled={isAllProgramsMode}
                          >
                              {type}
                          </button>
                        );
                      })}
                  </div>
              )}
          </div>

          <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-2 px-1 uppercase tracking-wider">Share Room Type</h3>
              <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-lg" role="group" aria-label="Filter by Shared Room Type">
                  <button
                      onClick={() => setSelectedSlotTypeFilter(SHARE_THEORY_FILTER)}
                      className={`${baseGroupButtonClasses}
                      ${selectedSlotTypeFilter === SHARE_THEORY_FILTER
                          ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700 focus:bg-sky-700'
                          : 'bg-white text-gray-700 hover:bg-gray-200 focus:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-gray-50'
                      }`}
                      aria-pressed={selectedSlotTypeFilter === SHARE_THEORY_FILTER}
                      disabled={isAllProgramsMode || !hasProgramTheorySlots}
                      title={isAllProgramsMode ? "Shared views require a specific program" : (!hasProgramTheorySlots ? "No 'Theory' slots defined for this program to share" : "Filter by shared Theory rooms")}
                  >
                      Theory
                  </button>
                  <button
                      onClick={() => setSelectedSlotTypeFilter(SHARE_LAB_FILTER)}
                      className={`${baseGroupButtonClasses}
                      ${selectedSlotTypeFilter === SHARE_LAB_FILTER
                          ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700 focus:bg-sky-700'
                          : 'bg-white text-gray-700 hover:bg-gray-200 focus:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-gray-50'
                      }`}
                      aria-pressed={selectedSlotTypeFilter === SHARE_LAB_FILTER}
                      disabled={isAllProgramsMode || !hasProgramLabSlots}
                      title={isAllProgramsMode ? "Shared views require a specific program" : (!hasProgramLabSlots ? "No 'Lab' slots defined for this program to share" : "Filter by shared Lab rooms")}
                  >
                      Lab
                  </button>
              </div>
          </div>
          <div className="mt-auto"></div>
        </aside>

        <main className="flex-1 overflow-auto"> 
          {(!programTimeSlots || programTimeSlots.length === 0) ? (
            <div className="h-full flex items-center justify-center bg-white">
              <p className="text-gray-600 text-center p-4">
                No time slots are defined for {isAllProgramsMode ? "any program" : `${selectedProgram.programCode}`}.
                {isAllProgramsMode ? " Please add time slots to programs to see an aggregated routine template." : " Please add time slots in the program details to view the routine template."}
              </p>
            </div>
          ) : (
            <div> 
              <div className="overflow-x-auto custom-scrollbar">
                  <table className="min-w-full border-collapse border border-slate-200 bg-white shadow">
                  <thead>
                      <tr>
                      <th className="sticky left-0 top-0 z-20 bg-sky-200 p-2 text-xs font-bold text-sky-800 border border-sky-300 w-28 md:w-36 text-center">
                          <span className="font-bold">Room No.</span>
                      </th>
                      {filteredTimeSlots.map(slot => (
                          <th key={slot.id} className="sticky top-0 z-10 bg-sky-100 p-1.5 md:p-2 text-xs font-bold text-sky-700 border border-sky-200 min-w-[120px] md:min-w-[150px] text-center whitespace-nowrap">
                           <span className="font-bold">{formatToAMPM(slot.startTime)} - {formatToAMPM(slot.endTime)}</span>
                          </th>
                      ))}
                      {filteredTimeSlots.length === 0 && selectedSlotTypeFilter && (
                          <th className="sticky top-0 z-10 bg-sky-100 p-1.5 md:p-2 text-xs font-normal text-sky-600 border border-sky-200 text-center">
                              (No '{getFilterDisplayContext()}' type slots found {isAllProgramsMode ? "across all programs" : "for this program"})
                          </th>
                      )}
                      {filteredTimeSlots.length === 0 && !selectedSlotTypeFilter && programTimeSlots.length > 0 && (
                          <th className="sticky top-0 z-10 bg-sky-100 p-1.5 md:p-2 text-xs font-normal text-sky-600 border border-sky-200 text-center">
                              (Select a slot type filter)
                          </th>
                      )}
                      </tr>
                  </thead>
                  {relevantClassRooms.length > 0 && filteredTimeSlots.length > 0 && (
                      <tbody>
                      {relevantClassRooms.map(room => (
                          <tr key={room.id} className="even:bg-slate-50/50 group">
                          <td className="sticky left-0 z-10 bg-sky-100 group-hover:bg-sky-200 p-2 text-xs md:text-sm text-sky-800 border border-sky-300 w-28 md:w-36 text-center">
                              <span className="font-bold">{room.building}_{room.room}</span>
                              {(selectedSlotTypeFilter.startsWith("Share") || (isAllProgramsMode && room.roomOwner)) && room.roomOwner && (
                                  <div className="text-xs text-indigo-600 font-normal mt-0.5 truncate" title={`Owner: ${room.roomOwner}`}>
                                      {allPrograms.find(p=>p.programCode === room.roomOwner)?.programCode || room.roomOwner.split(' — ')[0]}
                                  </div>
                              )}
                              {!selectedSlotTypeFilter.startsWith("Share") && !isAllProgramsMode && appSelectedProgram && room.roomOwner !== appSelectedProgram.programCode && room.sharedWith && room.sharedWith.length > 0 && (
                                  <div className="text-xs text-purple-600 font-normal mt-0.5 truncate" title={`Shared with: ${room.sharedWith.join(', ')}`}>
                                      (Shared)
                                  </div>
                              )}
                          </td>
                          {filteredTimeSlots.map(programTimeSlot => {
                              const entriesInThisCell = routineEntries.filter(
                                e => e.day === selectedDay &&
                                     e.roomId === room.id &&
                                     e.startTime === programTimeSlot.startTime &&
                                     e.endTime === programTimeSlot.endTime &&
                                     e.slotType === programTimeSlot.slotType
                              );
                              
                              let displayedEntry: RoutineEntry | null = null;
                              
                              if (appSelectedProgram && appSelectedProgram.id !== "__ALL_PROGRAMS__") {
                                  const ownEntry = entriesInThisCell.find(e => e.programId === appSelectedProgram.id);
                                  if (ownEntry) {
                                      displayedEntry = ownEntry;
                                  } else {
                                      // In "own room" or "shared room" view, if no own entry, show any other entry.
                                      // This ensures owner sees if their owned/shared room is booked by someone.
                                      displayedEntry = entriesInThisCell.length > 0 ? entriesInThisCell[0] : null;
                                  }
                              } else { // All Programs mode - show any entry
                                  displayedEntry = entriesInThisCell.length > 0 ? entriesInThisCell[0] : null;
                              }
                              
                              const courseLoadItem = displayedEntry ? courseLoadMap.get(displayedEntry.courseLoadId) : null;
                              
                              const pendingRequestByCurrentProgram = appSelectedProgram ? assignmentRequests.find(
                                req => req.requestingProgramId === appSelectedProgram.id &&
                                       req.slotDetails.day === selectedDay &&
                                       req.slotDetails.roomId === room.id &&
                                       req.slotDetails.startTime === programTimeSlot.startTime &&
                                       req.slotDetails.endTime === programTimeSlot.endTime &&
                                       req.slotDetails.slotType === programTimeSlot.slotType &&
                                       req.status === 'pending'
                              ) : null;

                              const pendingRequestByOtherProgramForThisSlot = assignmentRequests.find(
                                req => (!appSelectedProgram || req.requestingProgramId !== appSelectedProgram.id) &&
                                       req.slotDetails.day === selectedDay &&
                                       req.slotDetails.roomId === room.id &&
                                       req.slotDetails.startTime === programTimeSlot.startTime &&
                                       req.slotDetails.endTime === programTimeSlot.endTime &&
                                       req.slotDetails.slotType === programTimeSlot.slotType &&
                                       req.status === 'pending'
                              );

                              let slotButtonStatus: RoutineSlotButtonProps['status'] = "default";
                              let slotButtonActionableRequestDetails: RoutineSlotButtonProps['actionableRequestDetails'] = undefined;
                              let slotButtonOnClick = () => onOpenRoutineAssignmentModal(selectedDay, room, programTimeSlot);
                              let buttonAriaLabel = "";
                              let effectiveDisabled = false;

                              const isOwner = appSelectedProgram && room.roomOwner === appSelectedProgram.programCode;
                              const roomHasSpecificSlots = room.timeSlots && room.timeSlots.length > 0;
                              const isPhysicallyAvailable = roomHasSpecificSlots
                                ? room.timeSlots.some(
                                    (cs: TimeInterval) => cs.startTime === programTimeSlot.startTime && cs.endTime === programTimeSlot.endTime
                                  )
                                : true;

                              if (!appSelectedProgram || appSelectedProgram.id === "__ALL_PROGRAMS__") {
                                effectiveDisabled = true;
                                buttonAriaLabel = `Select a specific program to manage assignments. Currently viewing: ${courseLoadItem ? `${courseLoadItem.courseCode}(${courseLoadItem.section})` : 'Empty'}`;
                                if (courseLoadItem) slotButtonStatus = "assigned-by-other";

                              } else if (pendingRequestByCurrentProgram) {
                                // effectiveDisabled = true; // Button disabled by its own logic for this status -- OLD
                                // effectiveDisabled is false here unless in "All Programs" mode
                                slotButtonStatus = "pending-by-current";
                                const requestedCourse = courseLoadMap.get(pendingRequestByCurrentProgram.requestedCourseLoadId);
                                buttonAriaLabel = `Request sent for ${requestedCourse?.courseCode || 'course'}. Click to edit or cancel pending request for ${room.building}_${room.room} at ${programTimeSlot.slotName} on ${selectedDay}.`;
                              
                              } else if (pendingRequestByOtherProgramForThisSlot && isOwner && !displayedEntry) {
                                // Owner sees a request from another program for their empty slot
                                slotButtonStatus = "actionable-request";
                                const reqCourse = courseLoadMap.get(pendingRequestByOtherProgramForThisSlot.requestedCourseLoadId);
                                const reqProgram = allPrograms.find(p => p.id === pendingRequestByOtherProgramForThisSlot.requestingProgramId);
                                slotButtonActionableRequestDetails = {
                                    courseCode: reqCourse?.courseCode || 'N/A',
                                    section: reqCourse?.section || 'N/A',
                                    requestingProgramCode: reqProgram?.programCode || 'Unknown'
                                };
                                slotButtonOnClick = () => onAssignmentRequestModalOpen(pendingRequestByOtherProgramForThisSlot.id);
                                buttonAriaLabel = `Pending request from ${reqProgram?.programCode || 'another program'} for ${reqCourse?.courseCode || 'course'}. Click to review.`;
                              
                              } else if (pendingRequestByOtherProgramForThisSlot && !isOwner && !displayedEntry) {
                                // Not owner, other has pending, and slot is not taken by anyone
                                effectiveDisabled = true; // Button disabled by its own logic
                                slotButtonStatus = "locked-external-pending";
                                buttonAriaLabel = `Slot is under review for another program. Cannot assign.`;

                              } else if (displayedEntry && displayedEntry.programId !== appSelectedProgram.id) {
                                effectiveDisabled = true; // Button disabled by its own logic
                                slotButtonStatus = "assigned-by-other";
                                const assigningProgram = allPrograms.find(p => p.id === displayedEntry?.programId);
                                const assigningProgramCode = assigningProgram ? assigningProgram.programCode : 'Another program';
                                buttonAriaLabel = `Slot assigned by ${assigningProgramCode}. Assigned: ${courseLoadItem?.courseCode}(${courseLoadItem?.section}). Current program (${appSelectedProgram.programCode}) cannot modify.`;
                              
                              } else if (!isPhysicallyAvailable && !courseLoadItem && !pendingRequestByCurrentProgram && !(pendingRequestByOtherProgramForThisSlot && isOwner)) { 
                                effectiveDisabled = true;
                                buttonAriaLabel = `Slot time not configured for room ${room.building}_${room.room}. Cannot assign.`;
                              
                              } else { // Default case: can be assigned or is already assigned by current
                                buttonAriaLabel = courseLoadItem
                                  ? `Assigned: ${courseLoadItem.courseCode} (${courseLoadItem.section}), Teacher: ${getTeacherInitials(courseLoadItem.teacherName)}. Click to edit for ${room.building}_${room.room} at ${programTimeSlot.slotName} on ${selectedDay}`
                                  : `Add routine for ${room.building}_${room.room} at ${programTimeSlot.slotName} (${formatToAMPM(programTimeSlot.startTime)} - ${formatToAMPM(programTimeSlot.endTime)}) on ${selectedDay}`;
                              }
                              
                              let showButtonContent = true;
                              if (debouncedRoutineSearchTerm.trim()) {
                                const roomIdentifier = `${room.building}_${room.room}`.toLowerCase();
                                const roomTypeIdentifier = room.roomType.toLowerCase();
                                const slotNameIdentifier = programTimeSlot.slotName.toLowerCase();
                                const slotTimeIdentifier = `${formatToAMPM(programTimeSlot.startTime)} - ${formatToAMPM(programTimeSlot.endTime)}`.toLowerCase();
                                const searchTermLower = debouncedRoutineSearchTerm.toLowerCase();

                                let cellContentMatches = false;
                                if (courseLoadItem) {
                                    cellContentMatches = courseLoadItem.courseCode.toLowerCase().includes(searchTermLower) ||
                                                       courseLoadItem.section.toLowerCase().includes(searchTermLower) ||
                                                       (courseLoadItem.teacherName && getTeacherInitials(courseLoadItem.teacherName).toLowerCase().includes(searchTermLower));
                                } else if (pendingRequestByCurrentProgram) {
                                    const requestedCourse = courseLoadMap.get(pendingRequestByCurrentProgram.requestedCourseLoadId);
                                    if(requestedCourse) {
                                        cellContentMatches = requestedCourse.courseCode.toLowerCase().includes(searchTermLower) ||
                                                           requestedCourse.section.toLowerCase().includes(searchTermLower) ||
                                                           (requestedCourse.teacherName && getTeacherInitials(requestedCourse.teacherName).toLowerCase().includes(searchTermLower));
                                    }
                                    cellContentMatches = cellContentMatches || "request sent".includes(searchTermLower);
                                } else if (slotButtonStatus === "actionable-request" && slotButtonActionableRequestDetails) {
                                    cellContentMatches = slotButtonActionableRequestDetails.courseCode.toLowerCase().includes(searchTermLower) ||
                                                         slotButtonActionableRequestDetails.requestingProgramCode.toLowerCase().includes(searchTermLower) ||
                                                         "review request".includes(searchTermLower);
                                } else if (slotButtonStatus === "locked-external-pending") {
                                    cellContentMatches = "slot pending".includes(searchTermLower) || "under review".includes(searchTermLower);
                                }


                                const roomOrSlotStructureMatches = roomIdentifier.includes(searchTermLower) || 
                                                                  roomTypeIdentifier.includes(searchTermLower) ||
                                                                  slotNameIdentifier.includes(searchTermLower) || 
                                                                  slotTimeIdentifier.includes(searchTermLower);
                                
                                if (!cellContentMatches && !roomOrSlotStructureMatches) {
                                    showButtonContent = false;
                                }
                              }

                              return (
                              <td key={programTimeSlot.id} className="border border-slate-200 h-16 md:h-20 p-0.5 md:p-1">
                                  {showButtonContent ? (
                                    <RoutineSlotButton
                                        onClick={slotButtonOnClick}
                                        aria-label={buttonAriaLabel}
                                        disabled={effectiveDisabled}
                                        slotStyle={currentDayColors.slotButton}
                                        assignedCourseCode={courseLoadItem?.courseCode}
                                        assignedSection={courseLoadItem?.section}
                                        assignedTeacher={courseLoadItem ? getTeacherInitials(courseLoadItem.teacherName) : undefined}
                                        status={slotButtonStatus}
                                        actionableRequestDetails={slotButtonActionableRequestDetails}
                                        pendingRequestCourseCode={slotButtonStatus === "pending-by-current" ? courseLoadMap.get(pendingRequestByCurrentProgram!.requestedCourseLoadId)?.courseCode : undefined}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-100 rounded-md flex items-center justify-center" title="Filtered out by search">
                                    </div>
                                  )}
                              </td>
                              );
                          })}
                          </tr>
                      ))}
                      </tbody>
                  )}
                  </table>
              </div>

              {programTimeSlots.length > 0 && relevantClassRooms.length === 0 && selectedSlotTypeFilter && (
                <div className="p-6 text-center text-gray-600 bg-amber-50 border border-amber-300 rounded-md mt-4 shadow">
                  {isAllProgramsMode && (selectedSlotTypeFilter === SHARE_THEORY_FILTER || selectedSlotTypeFilter === SHARE_LAB_FILTER) ? (
                      <>
                          <h3 className="text-lg font-semibold text-amber-700 mb-2">Feature Not Applicable</h3>
                          <p>Shared room views are only available when a specific program is selected, not in "All Programs" mode.</p>
                      </>
                  ) : selectedSlotTypeFilter === SHARE_THEORY_FILTER ? (
                      <>
                          <h3 className="text-lg font-semibold text-amber-700 mb-2">No Shared Theory Classrooms Found</h3>
                          <p>No classrooms of type <strong className="text-amber-800">'Theory'</strong> are shared with <strong className="text-amber-800">{appSelectedProgram?.programCode || 'the selected program'}</strong>.</p>
                          <p className="text-sm mt-2">
                              To see rooms here, go to "Class Room" management and:
                              <ol className="list-decimal list-inside text-left mt-1 max-w-md mx-auto">
                                  <li>Ensure 'Theory' type classrooms exist.</li>
                                  <li>Add <strong className="text-amber-800">{appSelectedProgram?.programCode || 'the selected program'}</strong> to their "Share With Programs" list.</li>
                              </ol>
                          </p>
                      </>
                  ) : selectedSlotTypeFilter === SHARE_LAB_FILTER ? (
                      <>
                          <h3 className="text-lg font-semibold text-amber-700 mb-2">No Shared Lab Classrooms Found</h3>
                          <p>No classrooms of type <strong className="text-amber-800">'Lab'</strong> are shared with <strong className="text-amber-800">{appSelectedProgram?.programCode || 'the selected program'}</strong>.</p>
                          <p className="text-sm mt-2">
                              To see rooms here, go to "Class Room" management and:
                              <ol className="list-decimal list-inside text-left mt-1 max-w-md mx-auto">
                                  <li>Ensure 'Lab' type classrooms exist.</li>
                                  <li>Add <strong className="text-amber-800">{appSelectedProgram?.programCode || 'the selected program'}</strong> to their "Share With Programs" list.</li>
                              </ol>
                          </p>
                      </>
                  ) : isAllProgramsMode ? ( 
                      <>
                          <h3 className="text-lg font-semibold text-amber-700 mb-2">No '{getFilterDisplayContext()}' Classrooms Found</h3>
                          <p className="mb-1">
                              No classrooms of type <strong className="text-amber-800">'{getFilterDisplayContext()}'</strong> are available across all programs.
                          </p>
                           <p className="text-sm mt-2">Please go to "Class Room" management to add classrooms of type '{getFilterDisplayContext()}'.</p>
                      </>
                  ) : ( 
                      <>
                          <h3 className="text-lg font-semibold text-amber-700 mb-2">No '{getFilterDisplayContext()}' Classrooms Assigned</h3>
                          <p>
                          No classrooms matching the type <strong className="text-amber-800">'{getFilterDisplayContext()}'</strong> are currently assigned as "Room Owner" to <strong className="text-amber-800">{appSelectedProgram?.programCode || 'the selected program'}</strong>.
                          </p>
                          <p className="text-sm mt-2">
                          Please go to "Class Room" management to:
                          <ol className="list-decimal list-inside text-left mt-1 max-w-md mx-auto">
                              <li>Ensure classrooms of type '{getFilterDisplayContext()}' exist.</li>
                              <li>Assign them to this program by setting their "Room Owner" to <strong className="text-amber-800">{appSelectedProgram?.programCode || 'the selected program'}</strong>.</li>
                          </ol>
                          </p>
                      </>
                  )}
                </div>
              )}

              {programTimeSlots.length > 0 && filteredTimeSlots.length === 0 && selectedSlotTypeFilter && (
                <div className="p-6 text-center text-gray-500 mt-4">
                  <p>No slots of type '{getFilterDisplayContext().replace(/^Share\s/, '')}' are defined for {isAllProgramsMode ? "any program" : "this program"}.
                  This means columns for this view cannot be generated. Try selecting another slot type filter if available.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RoutineView;
