
import { ClassRoom } from '../types';

export const initialClassRooms: ClassRoom[] = [
  { id: 'cr1', roomId: 'AB1_103', building: 'AB-1', floor: 'Ground Floor', room: '103', roomType: 'Theory', capacity: 50, roomOwner: '55 B.Sc. in AGS', timeSlots: [], sharedWith: ['15 B.Sc. in CSE'] },
  { id: 'cr2', roomId: 'AB1_104', building: 'AB-1', floor: '1st Floor', room: '104', roomType: 'Theory', capacity: 50, roomOwner: '29 B. Pharma', timeSlots: [], sharedWith: [] },
  { id: 'cr3', roomId: 'AB1_202', building: 'AB-1', floor: '2nd Floor', room: '202', roomType: 'Theory', capacity: 40, roomOwner: '34 B.Sc. in NFE', timeSlots: [], sharedWith: [] },
  { 
    id: 'cr4', 
    roomId: 'FSIT_301', 
    building: 'FSIT', 
    floor: '3rd Floor', 
    room: '301', 
    roomType: 'Theory', 
    capacity: 60, 
    roomOwner: '15 B.Sc. in CSE', 
    timeSlots: [
      { id: 'cr4-slot1', startTime: '08:30', endTime: '10:00' },
      { id: 'cr4-slot2', startTime: '10:00', endTime: '11:30' },
      { id: 'cr4-slot3', startTime: '14:30', endTime: '16:00' },
    ], 
    sharedWith: [] 
  },
  { 
    id: 'cr5', 
    roomId: 'FSIT_405L', 
    building: 'FSIT', 
    floor: '4th Floor', 
    room: '405L', 
    roomType: 'Lab', 
    capacity: 40, 
    roomOwner: '15 B.Sc. in CSE', 
    timeSlots: [
      { id: 'cr5-slot1', startTime: '13:00', endTime: '14:30' },
    ], 
    sharedWith: [] 
  },
  { 
    id: 'cr6', 
    roomId: 'FHSS_210', 
    building: 'FHSS-Main', 
    floor: '2nd Floor', 
    room: '210', 
    roomType: 'Theory', 
    capacity: 50, 
    roomOwner: '10 B.A. in ENG', 
    timeSlots: [
      { id: 'cr6-slot1', startTime: '08:30', endTime: '10:00' },
      { id: 'cr6-slot2', startTime: '10:00', endTime: '11:30' },
    ], 
    sharedWith: [] 
  },
  { 
    id: 'cr7', 
    roomId: 'ADM_505', 
    building: 'Admin', 
    floor: '5th Floor', 
    room: '505', 
    roomType: 'Theory', 
    capacity: 45, 
    roomOwner: '', // Unassigned
    timeSlots: [
      { id: 'cr7-slot1', startTime: '09:00', endTime: '10:30' },
      { id: 'cr7-slot2', startTime: '11:00', endTime: '12:30' },
    ], 
    sharedWith: ['11 BBA'] 
  },
];