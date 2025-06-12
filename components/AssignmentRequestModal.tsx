
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RoutineAssignmentRequest, Program, CourseLoad, ClassRoom } from '../types';
import Button from './Button';
import { CloseIcon, CheckIcon, BuildingOfficeIcon, CalendarDaysIcon, ClockIcon, CodeBracketSquareIcon, InformationCircleIcon } from './Icons';
import { formatToAMPM } from './TimeIntervalManager';

interface AssignmentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: RoutineAssignmentRequest[];
  currentUserProgram: Program; 
  allPrograms: Program[];
  courseLoadData: CourseLoad[];
  classRooms: ClassRoom[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, reason?: string) => void;
  highlightRequestId?: string | null;
}

const AssignmentRequestModal: React.FC<AssignmentRequestModalProps> = ({
  isOpen,
  onClose,
  requests,
  currentUserProgram,
  allPrograms,
  courseLoadData,
  classRooms,
  onApproveRequest,
  onRejectRequest,
  highlightRequestId,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const allPendingRequestsForOwner = useMemo(() => {
    return requests.filter(req => req.status === 'pending' && req.roomOwnerProgramCode === currentUserProgram.programCode);
  }, [requests, currentUserProgram.programCode]);

  const displayedRequests = useMemo(() => {
    if (highlightRequestId) {
      const specificRequest = allPendingRequestsForOwner.find(req => req.id === highlightRequestId);
      // If a specific request is highlighted and found, show only that one.
      // Otherwise, (e.g. highlightRequestId is stale or modal opened generally), show all.
      return specificRequest ? [specificRequest] : allPendingRequestsForOwner;
    }
    return allPendingRequestsForOwner;
  }, [allPendingRequestsForOwner, highlightRequestId]);


  useEffect(() => {
    if (isOpen && highlightRequestId && displayedRequests.length > 0) {
      const requestToHighlight = displayedRequests.find(r => r.id === highlightRequestId);
      if (requestToHighlight) {
        const element = itemRefs.current[highlightRequestId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-sky-500', 'ring-offset-2', 'rounded-lg', 'transition-all', 'duration-300', 'ease-in-out');
          const timer = setTimeout(() => {
            element.classList.remove('ring-2', 'ring-sky-500', 'ring-offset-2');
          }, 3500); 
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isOpen, highlightRequestId, displayedRequests]);


  if (!isOpen) return null;

  const getProgramName = (programId: string) => {
    const program = allPrograms.find(p => p.id === programId);
    return program ? `${program.programCode} - ${program.programName}` : 'Unknown Program';
  };

  const getCourseDetails = (courseLoadId: string) => {
    return courseLoadData.find(cl => cl.id === courseLoadId);
  };

  const getRoomDetails = (roomId: string) => {
    return classRooms.find(cr => cr.id === roomId);
  };

  const handleRejectWithReason = () => {
    if (rejectingRequestId) {
      onRejectRequest(rejectingRequestId, rejectionReason);
      setRejectingRequestId(null);
      setRejectionReason('');
    }
  };
  
  const formatDate = (isoDateString: string | undefined) => {
    if (!isoDateString) return 'N/A';
    try {
      return new Date(isoDateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };


  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center p-4 z-[90]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="sticky top-0 p-4 border-b border-gray-200 flex items-center justify-between bg-slate-50 rounded-t-xl z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {highlightRequestId && displayedRequests.length === 1 ? "Assignment Request Details" : `Pending Assignment Requests for ${currentUserProgram.programCode}`}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <CloseIcon className="w-5 h-5 text-gray-600" />
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {displayedRequests.length === 0 ? (
            <p className="text-gray-600 text-center py-10">
              {allPendingRequestsForOwner.length === 0 ? "No pending assignment requests." : "The specific request is no longer pending or could not be found."}
            </p>
          ) : (
            <ul className="space-y-4">
              {displayedRequests.map((req) => {
                const course = getCourseDetails(req.requestedCourseLoadId);
                const room = getRoomDetails(req.slotDetails.roomId);
                const requestingProgramName = getProgramName(req.requestingProgramId);

                return (
                  <li 
                    key={req.id} 
                    ref={(el: HTMLLIElement | null) => { itemRefs.current[req.id] = el; }}
                    className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-all duration-300 ease-in-out"
                  >
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="flex-grow space-y-2 text-sm">
                        <p className="font-semibold text-sky-700 text-base">
                          Request from: <span className="font-normal text-gray-800">{requestingProgramName}</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                            <span className="flex items-center truncate" title={`Room: ${room ? `${room.building}_${room.room} (${room.roomType})` : 'N/A'}`}>
                                <BuildingOfficeIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"/> 
                                Room: {room ? `${room.building}_${room.room} (${room.roomType})` : 'N/A'}
                            </span>
                             <span className="flex items-center" title={`Day: ${req.slotDetails.day}`}>
                                <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"/>
                                Day: {req.slotDetails.day}
                            </span>
                            <span className="flex items-center" title={`Time: ${formatToAMPM(req.slotDetails.startTime)} - ${formatToAMPM(req.slotDetails.endTime)}`}>
                                <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"/> 
                                Time: {formatToAMPM(req.slotDetails.startTime)} - {formatToAMPM(req.slotDetails.endTime)}
                            </span>
                            <span className="flex items-center" title={`Slot Type: ${req.slotDetails.slotType}`}>
                                <InformationCircleIcon className="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"/> 
                                Type: {req.slotDetails.slotType}
                            </span>
                             <span className="flex items-center text-red-600" title={`Booked Until: ${formatDate(req.bookingEndDate)}`}>
                                <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-red-400 flex-shrink-0"/> 
                                Booked Until: {formatDate(req.bookingEndDate)}
                            </span>
                        </div>
                        {course && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="font-medium text-gray-700">Course Details:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                                <span className="truncate" title={`Code: ${course.courseCode}`}>Code: {course.courseCode}</span>
                                <span className="truncate" title={`Title: ${course.courseTitle}`}>Title: {course.courseTitle}</span>
                                <span className="truncate" title={`Section: ${course.section}`}>Section: {course.section}</span>
                                <span className="truncate" title={`Teacher: ${course.teacherName}`}>Teacher: {course.teacherName}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Requested on: {new Date(req.requestDate).toLocaleString()}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-0 md:space-y-2 flex-shrink-0 mt-2 md:mt-0">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onApproveRequest(req.id)}
                          className="bg-green-500 hover:bg-green-600 w-full sm:w-auto md:w-full"
                        >
                          <CheckIcon className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectingRequestId(req.id)}
                           className="w-full sm:w-auto md:w-full"
                        >
                          <CloseIcon className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>

        {rejectingRequestId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h3 className="text-lg font-semibold mb-3">Reason for Rejection (Optional)</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                placeholder="Enter reason..."
              />
              <div className="mt-4 flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => { setRejectingRequestId(null); setRejectionReason(''); }}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleRejectWithReason}>
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentRequestModal;
