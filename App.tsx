
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Program,
  ClassRoom,
  DayOfWeek,
  ProgramTimeSlot,
  CourseLoad,
  RoutineEntry,
  ProgramFormData,
  ClassRoomFormData,
  TimeInterval,
  RoutineAssignmentRequest,
  Notification,
  AssignmentRequestStatus
} from './types';
import { initialPrograms } from './data/programData';
import { initialClassRooms } from './data/classRoomData';
import { initialCourseLoadData } from './data/courseLoadData';
import { formatToAMPM } from './components/TimeIntervalManager'; // Import formatToAMPM
import useDebounce from './hooks/useDebounce'; // Import useDebounce

import ProgramModal from './components/ProgramModal';
import ClassRoomModal from './components/ClassRoomModal';
import CourseLoadModal from './components/CourseLoadModal';
import RoutineView from './components/RoutineView';
import RoutineAssignmentModal from './components/RoutineAssignmentModal';
import AssignmentRequestModal from './components/AssignmentRequestModal';

const ALL_PROGRAMS_PLACEHOLDER: Program = {
  id: '__ALL_PROGRAMS__',
  pid: '__ALL_PROGRAMS__',
  faculty: 'All Faculties',
  programCode: 'ALL',
  programName: 'All Programs View',
  programType: 'Undergraduate', // Placeholder, not critical for this object
  semesterType: 'Tri-Semester', // Placeholder
  programTimeSlots: [], // Aggregate slots if needed, or keep empty
};

const App: React.FC = () => {
  // --- State Variables ---
  const [programs, setPrograms] = useState<Program[]>([]);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
  const [courseLoadData, setCourseLoadData] = useState<CourseLoad[]>([]);
  const [routineEntries, setRoutineEntries] = useState<RoutineEntry[]>([]);
  const [assignmentRequests, setAssignmentRequests] = useState<RoutineAssignmentRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [selectedProgram, setSelectedProgram] = useState<Program | null>(ALL_PROGRAMS_PLACEHOLDER);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isClassRoomModalOpen, setIsClassRoomModalOpen] = useState(false);
  const [isCourseLoadModalOpen, setIsCourseLoadModalOpen] = useState(false);
  const [isRoutineAssignmentModalOpen, setIsRoutineAssignmentModalOpen] = useState(false);
  const [routineAssignmentContext, setRoutineAssignmentContext] = useState<{
    day: DayOfWeek;
    room: ClassRoom;
    timeSlot: ProgramTimeSlot;
  } | null>(null);
  const [isAssignmentRequestModalOpen, setIsAssignmentRequestModalOpen] = useState(false);
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);


  // --- Debounced State for LocalStorage ---
  const debouncedPrograms = useDebounce(programs, 500);
  const debouncedClassRooms = useDebounce(classRooms, 500);
  const debouncedCourseLoadData = useDebounce(courseLoadData, 500);
  const debouncedRoutineEntries = useDebounce(routineEntries, 500);
  const debouncedAssignmentRequests = useDebounce(assignmentRequests, 500);
  const debouncedNotifications = useDebounce(notifications, 500);

  // --- LocalStorage Effects (Load Initial Data) ---
  useEffect(() => {
    try {
      const storedPrograms = localStorage.getItem('rbrms-programs');
      setPrograms(storedPrograms ? JSON.parse(storedPrograms) : initialPrograms);
    } catch (error) {
      console.error("Failed to load programs from localStorage:", error);
      setPrograms(initialPrograms);
    }

    try {
      const storedClassRooms = localStorage.getItem('rbrms-classrooms');
      setClassRooms(storedClassRooms ? JSON.parse(storedClassRooms) : initialClassRooms);
    } catch (error) {
      console.error("Failed to load classrooms from localStorage:", error);
      setClassRooms(initialClassRooms);
    }

    try {
      const storedCourseLoad = localStorage.getItem('rbrms-courseload');
      setCourseLoadData(storedCourseLoad ? JSON.parse(storedCourseLoad) : initialCourseLoadData);
    } catch (error) {
      console.error("Failed to load course load data from localStorage:", error);
      setCourseLoadData(initialCourseLoadData);
    }
    
    try {
      const storedRoutineEntries = localStorage.getItem('rbrms-routineentries');
      setRoutineEntries(storedRoutineEntries ? JSON.parse(storedRoutineEntries) : []);
    } catch (error) {
      console.error("Failed to load routine entries from localStorage:", error);
      setRoutineEntries([]);
    }

    try {
      const storedAssignmentRequests = localStorage.getItem('rbrms-assignmentrequests');
      setAssignmentRequests(storedAssignmentRequests ? JSON.parse(storedAssignmentRequests) : []);
    } catch (error) {
      console.error("Failed to load assignment requests from localStorage:", error);
      setAssignmentRequests([]);
    }

    try {
      const storedNotifications = localStorage.getItem('rbrms-notifications');
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : []);
    } catch (error) {
      console.error("Failed to load notifications from localStorage:", error);
      setNotifications([]);
    }
  }, []);

  // --- LocalStorage Effects (Save Debounced Data) ---
  useEffect(() => { if (programs.length > 0 || localStorage.getItem('rbrms-programs')) localStorage.setItem('rbrms-programs', JSON.stringify(debouncedPrograms)); }, [debouncedPrograms, programs.length]);
  useEffect(() => { if (classRooms.length > 0 || localStorage.getItem('rbrms-classrooms')) localStorage.setItem('rbrms-classrooms', JSON.stringify(debouncedClassRooms)); }, [debouncedClassRooms, classRooms.length]);
  useEffect(() => { if (courseLoadData.length > 0 || localStorage.getItem('rbrms-courseload')) localStorage.setItem('rbrms-courseload', JSON.stringify(debouncedCourseLoadData)); }, [debouncedCourseLoadData, courseLoadData.length]);
  useEffect(() => { if (routineEntries.length > 0 || localStorage.getItem('rbrms-routineentries')) localStorage.setItem('rbrms-routineentries', JSON.stringify(debouncedRoutineEntries)); }, [debouncedRoutineEntries, routineEntries.length]);
  useEffect(() => { if (assignmentRequests.length > 0 || localStorage.getItem('rbrms-assignmentrequests')) localStorage.setItem('rbrms-assignmentrequests', JSON.stringify(debouncedAssignmentRequests)); }, [debouncedAssignmentRequests, assignmentRequests.length]);
  useEffect(() => { if (notifications.length > 0 || localStorage.getItem('rbrms-notifications')) localStorage.setItem('rbrms-notifications', JSON.stringify(debouncedNotifications)); }, [debouncedNotifications, notifications.length]);


  // --- Helper Functions ---
  const formatDate = (isoDateString: string | undefined): string => {
    if (!isoDateString) return 'N/A';
    try {
      return new Date(isoDateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getProgramName = (programId: string): string => {
    const program = programs.find(p => p.id === programId);
    return program ? program.programCode : 'Unknown Program';
  };

  // --- Event Handlers ---
  const handleSelectProgramForRoutine = (program: Program | null) => {
    setSelectedProgram(program || ALL_PROGRAMS_PLACEHOLDER);
  };

  const handleProgramModalOpen = () => setIsProgramModalOpen(true);
  const handleClassRoomModalOpen = () => setIsClassRoomModalOpen(true);
  const handleCourseLoadModalOpen = () => setIsCourseLoadModalOpen(true);
  
  const handleOpenRoutineAssignmentModal = (day: DayOfWeek, room: ClassRoom, timeSlot: ProgramTimeSlot) => {
    setRoutineAssignmentContext({ day, room, timeSlot });
    setIsRoutineAssignmentModalOpen(true);
  };
  const handleCloseRoutineAssignmentModal = () => setIsRoutineAssignmentModalOpen(false);

  const handleOpenAssignmentRequestModal = (requestIdToHighlight?: string) => {
    if (requestIdToHighlight) {
      setHighlightedRequestId(requestIdToHighlight);
    } else {
      setHighlightedRequestId(null);
    }
    setIsAssignmentRequestModalOpen(true);
  };
  const handleCloseAssignmentRequestModal = () => {
    setHighlightedRequestId(null);
    setIsAssignmentRequestModalOpen(false);
  };
  
  const handleProgramsChange = (updatedPrograms: Program[] | ((prevState: Program[]) => Program[])) => {
    if (typeof updatedPrograms === 'function') {
      setPrograms(updatedPrograms); // Let the function update and then the debounced effect will save
    } else {
      setPrograms(updatedPrograms);
    }
  };

  const handleClassRoomsChange = (updatedClassRooms: ClassRoom[] | ((prevState: ClassRoom[]) => ClassRoom[])) => {
    if (typeof updatedClassRooms === 'function') {
        setClassRooms(updatedClassRooms);
    } else {
        setClassRooms(updatedClassRooms);
    }
  };

  const addNotification = useCallback((
    recipientProgramIdOrCode: string, 
    message: string, 
    type: Notification['type'], 
    relatedRequestId?: string,
    relatedSlotDetails?: Notification['relatedSlotDetails']
    ) => {
        // Find program by code if a code is passed, otherwise assume it's an ID
        const recipientProgram = programs.find(p => p.programCode === recipientProgramIdOrCode || p.id === recipientProgramIdOrCode);
        if (!recipientProgram) {
            console.warn(`Notification recipient program not found: ${recipientProgramIdOrCode}`);
            return;
        }
        setNotifications(prev => [
            { 
                id: `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
                recipientProgramId: recipientProgram.id, // Store by ID
                message, 
                type, 
                timestamp: new Date().toISOString(), 
                isRead: false,
                relatedRequestId,
                relatedSlotDetails
            }, 
            ...prev
        ]);
  }, [programs]); // Depends on programs to find recipient

  const handleSaveRoutineAssignment = (
    day: DayOfWeek, 
    roomId: string, 
    timeSlot: ProgramTimeSlot, 
    courseLoadId: string, // Empty string if clearing/cancelling
    bookingEndDate?: string // ISO string date, could be empty string from modal
  ) => {
    if (!selectedProgram || selectedProgram.id === ALL_PROGRAMS_PLACEHOLDER.id) {
      alert("Please select a specific program to make assignments.");
      return;
    }
  
    const room = classRooms.find(cr => cr.id === roomId);
    if (!room) {
      alert("Room not found.");
      return;
    }
    
    const slotIdentifier = {
      day, 
      roomId, 
      startTime: timeSlot.startTime, 
      endTime: timeSlot.endTime, 
      slotType: timeSlot.slotType
    };

    const existingEntryIndex = routineEntries.findIndex(e =>
        e.day === slotIdentifier.day &&
        e.roomId === slotIdentifier.roomId &&
        e.startTime === slotIdentifier.startTime &&
        e.endTime === slotIdentifier.endTime &&
        e.slotType === slotIdentifier.slotType &&
        e.programId === selectedProgram.id
    );

    const existingPendingRequestIndex = assignmentRequests.findIndex(req =>
        req.requestingProgramId === selectedProgram.id &&
        req.slotDetails.day === slotIdentifier.day &&
        req.slotDetails.roomId === slotIdentifier.roomId &&
        req.slotDetails.startTime === slotIdentifier.startTime &&
        req.slotDetails.endTime === slotIdentifier.endTime &&
        req.slotDetails.slotType === slotIdentifier.slotType &&
        req.status === 'pending'
    );

    const isOwnerOfRoom = room.roomOwner === selectedProgram.programCode;
    const isSharedSlotScenario = room.roomOwner !== '' && room.roomOwner !== selectedProgram.programCode;

    const course = courseLoadData.find(cl => cl.id === courseLoadId);
    const roomText = `${room.building}_${room.room}`;
    const timeText = `${formatToAMPM(timeSlot.startTime)} - ${formatToAMPM(timeSlot.endTime)}`;

    // --- Handle Clearing/Cancelling First ---
    if (!courseLoadId) { 
      if (existingEntryIndex !== -1) { // Clear approved assignment
        setRoutineEntries(prev => prev.filter((_, index) => index !== existingEntryIndex));
        alert(`Assignment cleared for ${selectedProgram.programCode} in ${roomText} on ${day} at ${timeText}.`);
        // Optional: Notify owner if a shared booking was cleared by the assignee
        if (isSharedSlotScenario) {
            const clearedEntry = routineEntries[existingEntryIndex];
            const clearedCourse = courseLoadData.find(cl => cl.id === clearedEntry.courseLoadId);
             addNotification(
                room.roomOwner,
                `Assignment for <i>${clearedCourse?.courseCode || 'N/A'}</i> by <strong>${selectedProgram.programCode}</strong> in ${roomText} (${day}, ${timeText}) has been <strong>cleared</strong>.`,
                'info',
                undefined, // No request ID for direct clearing of approved slot
                { day, roomText, timeText, courseCodeText: clearedCourse?.courseCode || 'N/A' }
            );
        }
      } else if (existingPendingRequestIndex !== -1) { // Cancel pending request
        const cancelledRequest = assignmentRequests[existingPendingRequestIndex];
        setAssignmentRequests(prev => prev.filter((_, index) => index !== existingPendingRequestIndex));
        alert(`Pending request for ${roomText} on ${day} at ${timeText} has been cancelled.`);
        if (room.roomOwner && room.roomOwner !== selectedProgram.programCode) { // Notify owner if it was a shared room request
          const cancelledCourse = courseLoadData.find(cl => cl.id === cancelledRequest.requestedCourseLoadId);
          addNotification(
            room.roomOwner, 
            `Request from <strong>${selectedProgram.programCode}</strong> for <i>${cancelledCourse?.courseCode || 'N/A'}</i> in ${roomText} (${day}, ${timeText}) has been <strong>cancelled</strong>.`,
            'info',
            cancelledRequest.id,
            { day, roomText, timeText, courseCodeText: cancelledCourse?.courseCode || 'N/A' }
          );
        }
      }
      setIsRoutineAssignmentModalOpen(false);
      return;
    }
    
    // --- Date Validation for Scenarios Requiring It ---
    const validateBookingEndDate = (dateStr?: string) => {
        // This validation is for when a date *is provided*. Empty string means "no end date".
        if (!dateStr) { 
            return true; 
        }
        const today = new Date(); today.setHours(0,0,0,0);
        const selectedEndDate = new Date(dateStr); selectedEndDate.setHours(0,0,0,0);
        if (selectedEndDate < today) {
            alert("Booking end date cannot be in the past.");
            return false;
        }
        return true;
    };


    // --- Handle Saving/Updating/Requesting ---
    const modalBookingEndDate = bookingEndDate || '';


    if (isOwnerOfRoom) { // Program owns the room
      const newRoutineEntry: RoutineEntry = { 
        id: existingEntryIndex !== -1 ? routineEntries[existingEntryIndex].id : `re-own-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...slotIdentifier, 
        courseLoadId, 
        programId: selectedProgram.id, 
        bookingEndDate: modalBookingEndDate || undefined 
      };
      if (existingEntryIndex !== -1) {
        setRoutineEntries(prev => prev.map((e, index) => index === existingEntryIndex ? newRoutineEntry : e));
        alert(`Assignment updated for ${selectedProgram.programCode} in ${roomText} on ${day} at ${timeText}.`);
      } else {
        setRoutineEntries(prev => [...prev, newRoutineEntry]);
        alert(`Assignment saved for ${selectedProgram.programCode} in ${roomText} on ${day} at ${timeText}.`);
      }
    } else if (isSharedSlotScenario) {
      const requestDetails = {
        day: slotIdentifier.day,
        roomId: slotIdentifier.roomId,
        startTime: slotIdentifier.startTime,
        endTime: slotIdentifier.endTime,
        slotType: slotIdentifier.slotType,
      };

      if (existingPendingRequestIndex !== -1) { // Updating an existing PENDING request
        if (!modalBookingEndDate) { 
             alert("Booking end date is required for pending requests."); return;
        }
        if (!validateBookingEndDate(modalBookingEndDate)) return;

        const originalRequest = assignmentRequests[existingPendingRequestIndex];
        const updatedRequest: RoutineAssignmentRequest = {
          ...originalRequest,
          requestedCourseLoadId: courseLoadId,
          bookingEndDate: modalBookingEndDate, 
          requestDate: new Date().toISOString(), 
        };
        setAssignmentRequests(prev => prev.map((req, index) => index === existingPendingRequestIndex ? updatedRequest : req));
        
        const newCourseInfo = courseLoadData.find(cl => cl.id === courseLoadId);
        const courseChanged = originalRequest.requestedCourseLoadId !== courseLoadId;
        const dateChanged = originalRequest.bookingEndDate !== modalBookingEndDate;
        let alertMessage = `Pending request for ${roomText} on ${day} at ${timeText} has been updated.`;
        let changesDetail: string[] = [];
        if (courseChanged) {
            changesDetail.push(`Course changed to ${newCourseInfo?.courseCode || 'N/A'}`);
        }
        if (dateChanged) {
            changesDetail.push(`End date changed to ${modalBookingEndDate ? formatDate(modalBookingEndDate) : 'cleared'}`);
        }
        if (changesDetail.length > 0) {
            alertMessage += ` Changes: ${changesDetail.join('; ')}.`;
        }
        alert(alertMessage);

        addNotification(
            room.roomOwner,
            `Pending request from <strong>${selectedProgram.programCode}</strong> for ${roomText} (${day}, ${timeText}) has been <strong>updated</strong>. New Course: <i>${newCourseInfo?.courseCode || 'N/A'}</i>, End Date: ${formatDate(modalBookingEndDate)}.`,
            'info',
            updatedRequest.id,
            { day, roomText, timeText, courseCodeText: newCourseInfo?.courseCode || 'N/A' }
        );

      } else if (existingEntryIndex !== -1) { // Modifying an APPROVED shared booking
        const originalEntry = routineEntries[existingEntryIndex];
        const originalApprovedBookingEndDate = originalEntry.bookingEndDate || '';

        if (modalBookingEndDate !== originalApprovedBookingEndDate) { 
          if (modalBookingEndDate && !validateBookingEndDate(modalBookingEndDate)) return;

          const newRequestId = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const newRequest: RoutineAssignmentRequest = {
            id: newRequestId,
            requestingProgramId: selectedProgram.id,
            roomOwnerProgramCode: room.roomOwner,
            slotDetails: requestDetails,
            requestedCourseLoadId: courseLoadId, 
            bookingEndDate: modalBookingEndDate, 
            status: 'pending',
            requestDate: new Date().toISOString(),
          };
          setAssignmentRequests(prev => [...prev, newRequest]);
          alert(`Booking date change request sent for ${roomText} on ${day} at ${timeText}. Current booking remains active.`);
          addNotification(
            room.roomOwner,
            `<strong>${selectedProgram.programCode}</strong> requested a <strong>booking date change</strong> for <i>${course?.courseCode || 'N/A'}</i> in ${roomText} (${day}, ${timeText}) to end on ${modalBookingEndDate ? formatDate(modalBookingEndDate) : 'N/A (cleared)'}.`,
            'info',
            newRequestId,
            { day, roomText, timeText, courseCodeText: course?.courseCode || 'N/A' }
          );
        } else { 
            const updatedEntry: RoutineEntry = { ...originalEntry, courseLoadId }; 
            setRoutineEntries(prev => prev.map((e, index) => index === existingEntryIndex ? updatedEntry : e));
            alert(`Shared assignment (course/section) updated for ${selectedProgram.programCode} in ${roomText} on ${day} at ${timeText}.`);
             addNotification(
                room.roomOwner,
                `Shared assignment for <strong>${selectedProgram.programCode}</strong> in ${roomText} (${day}, ${timeText}) has been <strong>updated</strong>. New Course: <i>${course?.courseCode || 'N/A'}</i>.`,
                'info',
                undefined,
                { day, roomText, timeText, courseCodeText: course?.courseCode || 'N/A' }
            );
        }
      } else { // New request for a shared slot
        if (!modalBookingEndDate) { 
            alert("Booking end date is required for new shared room requests."); return;
        }
        if (!validateBookingEndDate(modalBookingEndDate)) return;

        const newRequestId = `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const newRequest: RoutineAssignmentRequest = {
          id: newRequestId,
          requestingProgramId: selectedProgram.id,
          roomOwnerProgramCode: room.roomOwner, 
          slotDetails: requestDetails,
          requestedCourseLoadId: courseLoadId,
          bookingEndDate: modalBookingEndDate, 
          status: 'pending',
          requestDate: new Date().toISOString(),
        };
        setAssignmentRequests(prev => [...prev, newRequest]);
        alert(`Request sent for ${roomText} on ${day} at ${timeText}.`);
        addNotification(
            room.roomOwner,
            `New request from <strong>${selectedProgram.programCode}</strong> for <i>${course?.courseCode || 'N/A'}</i> in ${roomText} (${day}, ${timeText}). Book until: ${formatDate(modalBookingEndDate)}.`,
            'info',
            newRequestId,
            { day, roomText, timeText, courseCodeText: course?.courseCode || 'N/A' }
        );
      }
    } else { // Unowned room
       const newRoutineEntry: RoutineEntry = { 
        id: existingEntryIndex !== -1 ? routineEntries[existingEntryIndex].id : `re-unowned-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...slotIdentifier, 
        courseLoadId, 
        programId: selectedProgram.id, 
        bookingEndDate: modalBookingEndDate || undefined 
      };
      if (existingEntryIndex !== -1) {
        setRoutineEntries(prev => prev.map((e, index) => index === existingEntryIndex ? newRoutineEntry : e));
        alert(`Assignment in unowned room updated for ${selectedProgram.programCode} in ${roomText}.`);
      } else {
        setRoutineEntries(prev => [...prev, newRoutineEntry]);
        alert(`Assignment saved in unowned room for ${selectedProgram.programCode} in ${roomText}.`);
      }
    }
    setIsRoutineAssignmentModalOpen(false);
  };
  
  const handleApproveRequest = (requestId: string) => {
    const requestIndex = assignmentRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;

    const request = assignmentRequests[requestIndex];
    if (request.status !== 'pending' || request.roomOwnerProgramCode !== selectedProgram?.programCode) {
      alert("Cannot approve this request. It might not be pending or you are not the room owner for this request.");
      return;
    }

    const conflictingAssignment = routineEntries.find(e =>
        e.day === request.slotDetails.day &&
        e.roomId === request.slotDetails.roomId &&
        e.startTime === request.slotDetails.startTime &&
        e.endTime === request.slotDetails.endTime &&
        e.slotType === request.slotDetails.slotType
    );

    if (conflictingAssignment) {
        if (conflictingAssignment.programId === request.requestingProgramId) {
            // If the conflicting assignment is for the same program that made the request
            // (e.g., they had an older booking that's being superseded by this new approved request), remove the old one.
            setRoutineEntries(prev => prev.filter(e => e.id !== conflictingAssignment.id));
        } else {
             // If the slot is assigned to a *different* program, block approval.
             const conflictingProgram = programs.find(p => p.id === conflictingAssignment.programId);
             alert(`Cannot approve. Slot is already assigned to ${conflictingProgram?.programCode || 'another program'}. Please resolve the conflict first.`);
             return;
        }
    }

    const newRoutineEntry: RoutineEntry = {
      id: `re-appr-${Date.now()}-${request.id.slice(-4)}`,
      day: request.slotDetails.day,
      roomId: request.slotDetails.roomId,
      startTime: request.slotDetails.startTime,
      endTime: request.slotDetails.endTime,
      slotType: request.slotDetails.slotType,
      courseLoadId: request.requestedCourseLoadId,
      programId: request.requestingProgramId,
      bookingEndDate: request.bookingEndDate || undefined, 
    };
    setRoutineEntries(prev => [...prev, newRoutineEntry]);
    
    const updatedRequest: RoutineAssignmentRequest = { 
        ...request, 
        status: 'approved', 
        resolutionDate: new Date().toISOString() 
    };
    setAssignmentRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));

    const requestingProgram = programs.find(p => p.id === request.requestingProgramId);
    alert(`Request approved and routine entry added for ${requestingProgram?.programCode || 'requesting program'}.`);
    
    const course = courseLoadData.find(cl => cl.id === request.requestedCourseLoadId);
    const room = classRooms.find(cr => cr.id === request.slotDetails.roomId);
    const roomText = room ? `${room.building}_${room.room}` : 'N/A';
    const timeText = formatToAMPM(request.slotDetails.startTime);

    addNotification(
        request.requestingProgramId, 
        `Your request for <i>${course?.courseCode || 'course'}</i> in ${roomText} (${request.slotDetails.day}, ${timeText}) has been <strong>approved</strong>.`,
        'success',
        requestId,
        { day: request.slotDetails.day, roomText, timeText, courseCodeText: course?.courseCode || 'N/A' }
    );
  };

  const handleRejectRequest = (requestId: string, reason?: string) => {
    const requestIndex = assignmentRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = assignmentRequests[requestIndex];
    if (request.status !== 'pending' || request.roomOwnerProgramCode !== selectedProgram?.programCode) {
      alert("Cannot reject this request. It might not be pending or you are not the room owner for this request.");
      return;
    }

    const updatedRequest: RoutineAssignmentRequest = { 
        ...request, 
        status: 'rejected', 
        resolutionDate: new Date().toISOString(), 
        rejectionReason: reason 
    };
    setAssignmentRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
    
    const requestingProgram = programs.find(p => p.id === request.requestingProgramId);
    alert(`Request rejected for ${requestingProgram?.programCode || 'requesting program'}.`);

    const course = courseLoadData.find(cl => cl.id === request.requestedCourseLoadId);
    const room = classRooms.find(cr => cr.id === request.slotDetails.roomId);
    const roomText = room ? `${room.building}_${room.room}` : 'N/A';
    const timeText = formatToAMPM(request.slotDetails.startTime);
    
    addNotification(
        request.requestingProgramId, 
        `Your request for <i>${course?.courseCode || 'course'}</i> in ${roomText} (${request.slotDetails.day}, ${timeText}) has been <strong>rejected</strong>. ${reason ? `Reason: ${reason}` : ''}`,
        'error',
        requestId,
        { day: request.slotDetails.day, roomText, timeText, courseCodeText: course?.courseCode || 'N/A' }
    );
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, isRead: true} : n));
  };

  const markAllNotificationsAsRead = (programId: string) => {
    setNotifications(prev => prev.map(n => n.recipientProgramId === programId ? {...n, isRead: true} : n));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = (programId: string) => {
    setNotifications(prev => prev.filter(n => n.recipientProgramId !== programId));
  };

  return (
    <div className="h-screen flex flex-col">
      {selectedProgram && (
        <RoutineView
          selectedProgram={selectedProgram}
          classRooms={classRooms}
          allPrograms={programs}
          appSelectedProgram={selectedProgram}
          onSelectProgramForRoutine={handleSelectProgramForRoutine}
          onProgramModalOpen={handleProgramModalOpen}
          onClassRoomModalOpen={handleClassRoomModalOpen}
          onCourseLoadModalOpen={handleCourseLoadModalOpen}
          onAssignmentRequestModalOpen={handleOpenAssignmentRequestModal}
          courseLoadData={courseLoadData}
          routineEntries={routineEntries}
          assignmentRequests={assignmentRequests}
          onOpenRoutineAssignmentModal={handleOpenRoutineAssignmentModal}
          notifications={notifications}
          onMarkNotificationAsRead={markNotificationAsRead}
          onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
          onDeleteNotification={deleteNotification}
          onClearAllNotifications={clearAllNotifications}
        />
      )}

      {isProgramModalOpen && (
        <ProgramModal
          onClose={() => setIsProgramModalOpen(false)}
          programs={programs}
          onProgramsChange={handleProgramsChange}
        />
      )}
      {isClassRoomModalOpen && (
        <ClassRoomModal
          onClose={() => setIsClassRoomModalOpen(false)}
          classRoomsData={classRooms}
          onClassRoomsChange={handleClassRoomsChange}
          programs={programs}
          routineEntries={routineEntries}
        />
      )}
      {isCourseLoadModalOpen && (
        <CourseLoadModal
          isOpen={isCourseLoadModalOpen}
          onClose={() => setIsCourseLoadModalOpen(false)}
          courseLoadData={courseLoadData}
          allPrograms={programs}
        />
      )}
      {isRoutineAssignmentModalOpen && routineAssignmentContext && selectedProgram &&(
        <RoutineAssignmentModal
          isOpen={isRoutineAssignmentModalOpen}
          onClose={handleCloseRoutineAssignmentModal}
          onSubmit={handleSaveRoutineAssignment}
          context={routineAssignmentContext}
          selectedProgramForAssignment={selectedProgram}
          courseLoadData={courseLoadData}
          routineEntries={routineEntries}
          assignmentRequests={assignmentRequests} 
          allClassRooms={classRooms}
        />
      )}
      {isAssignmentRequestModalOpen && selectedProgram && (
        <AssignmentRequestModal
            isOpen={isAssignmentRequestModalOpen}
            onClose={handleCloseAssignmentRequestModal}
            requests={assignmentRequests}
            currentUserProgram={selectedProgram}
            allPrograms={programs}
            courseLoadData={courseLoadData}
            classRooms={classRooms}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
            highlightRequestId={highlightedRequestId}
        />
      )}
    </div>
  );
};

export default App;
