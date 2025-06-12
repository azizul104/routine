

export interface TimeInterval {
  id: string;
  slotName?: string; // Optional: if a slot in a classroom has a specific name
  startTime: string; // HH:mm format e.g., "08:30"
  endTime: string;   // HH:mm format e.g., "10:00"
}

export interface ProgramTimeSlot {
  id: string;
  slotType: string; // e.g., "Theory", "Lab"
  slotName: string; // e.g., "Slot-1 (Theory)"
  startTime: string; // HH:mm format e.g., "08:30"
  endTime: string;   // HH:mm format e.g., "10:00"
}

export interface Program {
  id: string;
  faculty: string;
  pid: string;
  programCode: string;
  programName: string;
  programType: 'Undergraduate' | 'Graduate';
  semesterType: 'Tri-Semester' | 'Bi-Semester';
  programTimeSlots?: ProgramTimeSlot[];
}

export interface ClassRoom {
  id: string; // Unique identifier for the classroom entry
  roomId: string; // User-defined ID, should be unique (e.g., "101", "Lab-A")
  building: string;
  floor: string;
  room: string; // Room number or identifier (e.g., "101", "A")
  roomType: string; // e.g., "Theory", "Lab"
  capacity: number;
  roomOwner: string; // Program code that "owns" or primarily uses this room
  timeSlots?: TimeInterval[]; // Specific available slots for this classroom (can be different from program slots)
  sharedWith?: string[]; // Array of program codes this room is shared with
}

export interface ProgramFormData {
  pid: string;
  faculty: string;
  programCode: string;
  programName: string;
  programType: 'Undergraduate' | 'Graduate';
  semesterType: 'Tri-Semester' | 'Bi-Semester';
}

export interface ClassRoomFormData {
  roomId: string;
  building: string;
  floor: string;
  room: string;
  roomType: string;
  capacity: number;
  // roomOwner is handled in details modal, not directly in the form for new/edit basic details
  // timeSlots are handled in details modal
}


export const PREDEFINED_TIME_SLOTS: readonly string[] = [
  "08:30 AM - 10:00 AM",
  "10:00 AM - 11:30 AM",
  "11:30 AM - 01:00 PM",
  "01:00 PM - 02:30 PM",
  "02:30 PM - 04:00 PM",
  "04:00 PM - 05:30 PM",
];

export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Saturday',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

export interface CourseLoad {
  id: string; // Unique ID for React keys, can be sectionId if unique
  pid: number;
  sectionId: number;
  courseCode: string;
  courseTitle: string;
  section: string;
  credit: number;
  studentCount: number;
  classTaken: number;
  weeklyClass?: number; 
  routineInput?: number; // Added field for routine input count
  teacherId: string;
  teacherName: string;
  designation: string;
}

export interface RoutineEntry {
  id: string; // Unique identifier for the routine entry
  day: DayOfWeek;
  roomId: string;
  startTime: string; 
  endTime: string;   
  slotType: string;  
  courseLoadId: string;
  programId: string; // ID of the program this assignment belongs to (was optional, now required)
  bookingEndDate?: string; // Optional: ISO date string for when the booking expires
}

export type AssignmentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RoutineAssignmentRequest {
  id: string; // Unique request ID
  requestingProgramId: string; // Program making the request
  roomOwnerProgramCode: string; // Program code of the room owner
  slotDetails: {
    day: DayOfWeek;
    roomId: string;
    startTime: string;
    endTime: string;
    slotType: string;
  };
  requestedCourseLoadId: string;
  bookingEndDate: string; // ISO date string for when the requested booking expires (Required for requests)
  status: AssignmentRequestStatus;
  requestDate: string; // ISO date string
  resolutionDate?: string; // ISO date string
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  recipientProgramId: string; // The programId of the program that should see this notification
  message: string;
  type: 'success' | 'error' | 'info'; // 'success' for approval, 'error' for rejection
  timestamp: string; // ISO date string of when the notification was created
  isRead: boolean;
  relatedRequestId?: string; // Link to the original RoutineAssignmentRequest
  relatedSlotDetails?: { // For quick display context in the notification
    day: DayOfWeek;
    roomText: string; 
    timeText: string; 
    courseCodeText: string;
  };
}