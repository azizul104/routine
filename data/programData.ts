
import { Program, ProgramTimeSlot } from '../types';

const generateDefaultSlots = (programPid: string): ProgramTimeSlot[] => {
  // Simple unique ID generator for these default slots
  let theoryCount = 0;
  let labCount = 0;
  
  const createSlot = (type: string, startTime: string, endTime: string): ProgramTimeSlot => {
    let count;
    if (type === 'Theory') {
      theoryCount++;
      count = theoryCount;
    } else if (type === 'Lab') {
      labCount++;
      count = labCount;
    } else {
      // Fallback for other types if needed in future, though not used here
      count = (theoryCount + labCount) + 1; 
    }
    return {
      id: `${programPid}-${type.toLowerCase()}-${count}`,
      slotType: type,
      slotName: `Slot-${count} (${type})`,
      startTime,
      endTime,
    };
  };

  return [
    createSlot('Theory', '08:30', '10:00'),
    createSlot('Theory', '10:00', '11:30'),
    createSlot('Lab', '13:00', '14:30'),
    createSlot('Theory', '14:30', '16:00'),
  ];
};

const englishProgramSlots: ProgramTimeSlot[] = [
  { id: '10-theory-1', slotType: 'Theory', slotName: 'Slot-1 (Theory)', startTime: '08:30', endTime: '10:00' },
  { id: '10-theory-2', slotType: 'Theory', slotName: 'Slot-2 (Theory)', startTime: '10:00', endTime: '11:30' },
  { id: '10-theory-3', slotType: 'Theory', slotName: 'Slot-3 (Theory)', startTime: '11:30', endTime: '13:00' },
  { id: '10-theory-4', slotType: 'Theory', slotName: 'Slot-4 (Theory)', startTime: '14:00', endTime: '15:30' },
];


export const initialPrograms: Program[] = [
  { id: '10', faculty: 'FHSS', pid: '10', programCode: '10 B.A. in ENG', programName: 'B.A. in English', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: englishProgramSlots },
  { id: '11', faculty: 'FBE', pid: '11', programCode: '11 BBA', programName: 'Bachelor of Business Administration', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: generateDefaultSlots('11') },
  { id: '12', faculty: 'FBE', pid: '12', programCode: '12 MBA (Exe)', programName: 'M.B.A. (Executive)', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '14', faculty: 'FBE', pid: '14', programCode: '14 MBA (Reg)', programName: 'M.B.A. (Regular)', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '15', faculty: 'FSIT', pid: '15', programCode: '15 B.Sc. in CSE', programName: 'B.Sc. in Computer Science and Engineering', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: generateDefaultSlots('15') },
  { id: '16', faculty: 'FSIT', pid: '16', programCode: '16 B.Sc. in CIS', programName: 'B.Sc. in Computing and Information System', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '17', faculty: 'FSIT', pid: '17', programCode: '17 M.S. in MIS', programName: 'M.S. in Management Information Systems', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '19', faculty: 'FE', pid: '19', programCode: '19 B.Sc. in ETE', programName: 'B.Sc. in Electronics and Telecommunication Engineering', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '20', faculty: 'FSIT', pid: '20', programCode: '20 B.Sc. in CS', programName: 'B.Sc. in Computer Science', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '21', faculty: 'FHSS', pid: '21', programCode: '21 M.A. in ENG (Pre)', programName: 'M.A. in English (Preliminary)', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '22', faculty: 'FHSS', pid: '22', programCode: '22 M.A. in ENG (Fin)', programName: 'M.A. in English (Final)', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '23', faculty: 'FE', pid: '23', programCode: '23 B.Sc. in TE', programName: 'B.Sc. in Textile Engineering', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: generateDefaultSlots('23') },
  { id: '24', faculty: 'FHSS', pid: '24', programCode: '24 BSS in JMC', programName: 'BSS in Journalism, Media and Communication', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '25', faculty: 'FSIT', pid: '25', programCode: '25 M.Sc. in CSE', programName: 'M.Sc. in Computer Science and Engineering', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '26', faculty: 'FHSS', pid: '26', programCode: '26 L.L.B. (Hons)', programName: 'L.L.B. (Hons)', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '27', faculty: 'FBE', pid: '27', programCode: '27 BRE', programName: 'Bachelor of Real Estate', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '28', faculty: 'FHSS', pid: '28', programCode: '28 MSS in JMC', programName: 'MSS in Journalism, Media and Communication', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '29', faculty: 'FHLS', pid: '29', programCode: '29 B. Pharma', programName: 'Bachelor of Pharmacy', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: generateDefaultSlots('29') },
  { id: '30', faculty: 'FHLS', pid: '30', programCode: '30 B.Sc. in ESDM', programName: 'B.Sc. (Hons) in Environmental Science and Disaster Management', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '31', faculty: 'FE', pid: '31', programCode: '31 M.Sc. in ETE', programName: 'M.Sc. in Electronics and Telecommunication Engineering', programType: 'Graduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '32', faculty: 'FE', pid: '32', programCode: '32 M.Sc. in TE', programName: 'M.Sc. in Textile Engineering', programType: 'Graduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '33', faculty: 'FE', pid: '33', programCode: '33 B.Sc. in EEE', programName: 'B.Sc. in Electrical and Electronic Engineering', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '34', faculty: 'FHLS', pid: '34', programCode: '34 B.Sc. in NFE', programName: 'B.Sc. in Nutrition and Food Engineering', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '35', faculty: 'FSIT', pid: '35', programCode: '35 B.Sc. in SWE', programName: 'B.Sc. in Software Engineering', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '36', faculty: 'FHSS', pid: '36', programCode: '36 L.L.B. (Pass)', programName: 'L.L.B. (Pass)', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '37', faculty: 'FHSS', pid: '37', programCode: '37 L.L.M. (Pre)', programName: 'L.L.M. (Pre)', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] }, // Original data says Undergraduate, might be Graduate
  { id: '38', faculty: 'FHSS', pid: '38', programCode: '38 L.L.M. (Final)', programName: 'L.L.M. (Final)', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] }, // Original data says Undergraduate, might be Graduate
  { id: '40', faculty: 'FSIT', pid: '40', programCode: '40 B.Sc. in MCT', programName: 'B. Sc. in Multimedia and Creative Technology', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '41', faculty: 'FHLS', pid: '41', programCode: '41 MPH', programName: 'Master of Public Health', programType: 'Graduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '42', faculty: 'FE', pid: '42', programCode: '42 B.Sc. in ARCH', programName: 'B.Sc. in Architecture', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '43', faculty: 'FBE', pid: '43', programCode: '43 BTHM', programName: 'Bachelor of Tourism and Hospitality Management', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '44', faculty: 'FSIT', pid: '44', programCode: '44 M.Sc. in SWE', programName: 'M.Sc. in Software Engineering', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '45', faculty: 'FBE', pid: '45', programCode: '45 BE', programName: 'Bachelor of Entrepreneurship', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '46', faculty: 'FHLS', pid: '46', programCode: '46 M. Pharm', programName: 'M. Pharm', programType: 'Graduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '47', faculty: 'FE', pid: '47', programCode: '47 B.Sc. in CE', programName: 'B.Sc. in Civil Engineering', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '49', faculty: 'FHSS', pid: '49', programCode: '49 MDS', programName: 'Master of Development Studies', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '50', faculty: 'FE', pid: '50', programCode: '50 B.Sc. in ICE', programName: 'B.Sc. in Information and Communication Engineering', programType: 'Undergraduate', semesterType: 'Bi-Semester', programTimeSlots: [] },
  { id: '51', faculty: 'FSIT', pid: '51', programCode: '51 B.Sc. in ITM', programName: 'B. Sc. in Information Technology and Management', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '52', faculty: 'FBE', pid: '52', programCode: '52 Management', programName: 'BBA in Management', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '53', faculty: 'FHLS', pid: '53', programCode: '53 BPH', programName: 'Bachelor of Public Health', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '54', faculty: 'FHLS', pid: '54', programCode: '54 B.Sc. in PESS', programName: 'B.Sc. (Hon\'s) in Physical Education and Sports Science', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '55', faculty: 'FHLS', pid: '55', programCode: '55 B.Sc. in AGS', programName: 'B.Sc in Agricultural Science', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: generateDefaultSlots('55') },
  { id: '56', faculty: 'FSIT', pid: '56', programCode: '56 M.Sc. in Cyber Security', programName: 'M.Sc. in Cyber Security', programType: 'Graduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '58', faculty: 'FBE', pid: '58', programCode: '58 Accounting', programName: 'BBA in Accounting', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '59', faculty: 'FHLS', pid: '59', programCode: '59 B.Sc. in GEB', programName: 'B.Sc. (Hon?s) in Genetic Engineering and Biotechnology', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] }, // Typo Hon?s -> Hon's
  { id: '60', faculty: 'FBE', pid: '60', programCode: '60 Finance and Banking', programName: 'BBA in Finance and Banking', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
  { id: '61', faculty: 'FBE', pid: '61', programCode: '61 Marketing', programName: 'BBA in Marketing', programType: 'Undergraduate', semesterType: 'Tri-Semester', programTimeSlots: [] },
];