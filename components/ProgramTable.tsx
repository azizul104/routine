
import React, { useMemo } from 'react';
import { Program, ProgramTimeSlot } from '../types';
import { EditIcon, DeleteIcon } from './Icons';
import Button from './Button';
import { formatToAMPM } from './TimeIntervalManager'; // Re-use formatter

interface ProgramTableProps {
  programs: Program[];
  onEdit: (program: Program) => void;
  onDelete: (programId: string) => void;
  onRowClick: (program: Program) => void;
}

interface SlotDetail {
  name: string;
  type: string;
  number: number;
}

const ProgramTable: React.FC<ProgramTableProps> = ({ programs, onEdit, onDelete, onRowClick }) => {
  const baseHeaderCellClass = "px-4 py-3 whitespace-nowrap text-left sticky top-0 z-10 bg-gray-100";
  const baseDataCellClass = "px-4 py-3";

  // Determine unique slot names and their details for dynamic columns, then sort them
  const allSlotNames = useMemo(() => {
    const slotDetailsMap = new Map<string, SlotDetail>();
    const slotNamePattern = /^Slot-(\d+) \((.+)\)$/i;

    programs.forEach(program => {
      (program.programTimeSlots || []).forEach(slot => {
        if (!slotDetailsMap.has(slot.slotName)) {
          const match = slot.slotName.match(slotNamePattern);
          let type = 'Other'; // Default type if pattern doesn't match
          let number = Infinity; // Default number for sorting if pattern doesn't match

          if (match && match[1] && match[2]) {
            number = parseInt(match[1], 10);
            type = match[2];
          } else {
            // Fallback for names not matching "Slot-X (Type)" - less likely with auto-generation
            // but good for robustness if data could be manually entered differently.
            // Attempt to infer type if it's a known one, otherwise group as 'Other'.
            const knownTypes = ["Theory", "Lab"]; // Add more if needed
            const foundKnownType = knownTypes.find(kt => slot.slotName.toLowerCase().includes(kt.toLowerCase()));
            type = foundKnownType || slot.slotType || 'Other'; // Use slot.slotType if available
            // Try to extract a number if slotName starts with "Slot-X" or similar
            const genericSlotNumberMatch = slot.slotName.match(/^Slot-(\d+)/i);
            if (genericSlotNumberMatch && genericSlotNumberMatch[1]) {
                number = parseInt(genericSlotNumberMatch[1], 10);
            }
          }
          
          slotDetailsMap.set(slot.slotName, { name: slot.slotName, type: type, number: number });
        }
      });
    });

    const slotDetailsArray = Array.from(slotDetailsMap.values());

    slotDetailsArray.sort((a, b) => {
      // Custom type order: Theory, Lab, then others alphabetically
      const typeOrder: { [key: string]: number } = { "Theory": 1, "Lab": 2 };
      const aTypeOrder = typeOrder[a.type] || 3;
      const bTypeOrder = typeOrder[b.type] || 3;

      if (aTypeOrder !== bTypeOrder) {
        return aTypeOrder - bTypeOrder;
      }

      // If both are 'Other' types or same known type, sort by type name alphabetically
      if (aTypeOrder === 3 && a.type.toLowerCase() !== b.type.toLowerCase()) {
        return a.type.toLowerCase().localeCompare(b.type.toLowerCase());
      }
      
      // If types are effectively the same, sort by slot number
      return a.number - b.number;
    });

    return slotDetailsArray.map(detail => detail.name);
  }, [programs]);

  if (programs.length === 0 && allSlotNames.length === 0) { 
    return <p className="text-center text-gray-500 py-4">No programs available.</p>;
  }
   if (programs.length === 0 && allSlotNames.length > 0) {
    return <p className="text-center text-gray-500 py-4">No programs found matching your search, but slot columns are defined.</p>;
  }


  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className={`${baseHeaderCellClass} w-[100px] left-0 z-20`}>Actions</th>
            <th scope="col" className={`${baseHeaderCellClass} left-[100px] z-20 min-w-[150px]`}>Program Name</th>
            <th scope="col" className={`${baseHeaderCellClass} min-w-[100px]`}>Faculty</th>
            <th scope="col" className={`${baseHeaderCellClass} min-w-[80px]`}>P-ID</th>
            <th scope="col" className={`${baseHeaderCellClass} min-w-[120px]`}>Program Code</th>
            <th scope="col" className={`${baseHeaderCellClass} min-w-[120px]`}>Program Type</th>
            <th scope="col" className={`${baseHeaderCellClass} min-w-[120px]`}>Semester Type</th>
            {/* Dynamic Slot Columns - Header still includes type via slotName */}
            {allSlotNames.map(slotName => (
              <th key={slotName} scope="col" className={`${baseHeaderCellClass} min-w-[180px]`}>
                {slotName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {programs.map((program) => {
            const programSlotsMap = new Map<string, ProgramTimeSlot>();
            (program.programTimeSlots || []).forEach(slot => {
              programSlotsMap.set(slot.slotName, slot);
            });

            return (
              <tr 
                key={program.id} 
                className="bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer group"
                onClick={() => onRowClick(program)}
              >
                <td className={`${baseDataCellClass} sticky left-0 z-10 bg-white group-hover:bg-gray-50 w-[100px]`}>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); onEdit(program); }}
                      aria-label={`Edit ${program.programName}`} 
                      className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                    >
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); onDelete(program.id); }}
                      aria-label={`Delete ${program.programName}`} 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <DeleteIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
                <td className={`${baseDataCellClass} sticky left-[100px] z-10 bg-white group-hover:bg-gray-50 min-w-[150px] font-medium text-gray-800`}>{program.programName}</td>
                <td className={`${baseDataCellClass} min-w-[100px]`}>{program.faculty}</td>
                <td className={`${baseDataCellClass} min-w-[80px]`}>{program.pid}</td>
                <td className={`${baseDataCellClass} min-w-[120px]`}>{program.programCode}</td>
                <td className={`${baseDataCellClass} min-w-[120px]`}>{program.programType}</td>
                <td className={`${baseDataCellClass} min-w-[120px]`}>{program.semesterType}</td>
                {/* Dynamic Slot Data Cells - Type removed from here */}
                {allSlotNames.map(slotName => {
                  const slot = programSlotsMap.get(slotName);
                  return (
                    <td key={`${program.id}-${slotName}`} className={`${baseDataCellClass} min-w-[180px]`}>
                      {slot ? (
                        `${formatToAMPM(slot.startTime)} - ${formatToAMPM(slot.endTime)}`
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProgramTable;
