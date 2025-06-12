

import React from 'react';
import { ClassRoom, TimeInterval } from '../types';
import { EditIcon, DeleteIcon } from './Icons'; 
import Button from './Button'; 
import { formatToAMPM } from './TimeIntervalManager';

interface ClassRoomTableProps {
  classRooms: ClassRoom[];
  onEdit: (classRoom: ClassRoom) => void; 
  onDelete: (classRoomId: string) => void; 
  onRowClick: (classRoom: ClassRoom) => void; 
}

const ClassRoomTable: React.FC<ClassRoomTableProps> = ({ classRooms, onEdit, onDelete, onRowClick }) => {
  if (classRooms.length === 0) {
    return <p className="text-center text-gray-500 py-4">No class rooms found matching your search.</p>;
  }

  const baseHeaderCellClass = "px-4 py-3 whitespace-nowrap text-left";
  const stickyHeaderCellClass = `${baseHeaderCellClass} sticky top-0 z-10 bg-gray-100`;
  
  const actionsHeaderClass = `${stickyHeaderCellClass} w-[100px] left-0 z-20`;
  const slotHeaderClass = `${stickyHeaderCellClass} min-w-[90px] text-center left-[100px] z-20`; // After Actions
  const roomHeaderClass = `${stickyHeaderCellClass} min-w-[150px] left-[190px] z-20`; // After Actions (100) + Slot (90)

  const baseDataCellClass = "px-4 py-3 whitespace-nowrap";
  
  const actionsDataCellClass = `${baseDataCellClass} sticky left-0 z-10 bg-white group-hover:bg-gray-50 w-[100px]`;
  const slotDataCellClass = `${baseDataCellClass} sticky left-[100px] z-10 bg-white group-hover:bg-gray-50 min-w-[90px] text-center`;
  const roomDataCellClass = `${baseDataCellClass} sticky left-[190px] z-10 bg-white group-hover:bg-gray-50 min-w-[150px]`;


  // Determine the maximum number of time slots any classroom has
  const maxSlots = Math.max(0, ...classRooms.map(cr => cr.timeSlots?.length || 0));

  return (
    <div className="sm:rounded-lg border border-gray-200"> {/* Removed overflow-x-auto and shadow-md */}
      <table className="min-w-full text-sm text-left text-gray-700">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className={actionsHeaderClass}>Actions</th>
            <th scope="col" className={slotHeaderClass}>Slot</th>
            <th scope="col" className={roomHeaderClass}>
              Room
            </th>
            {/* Dynamically generate Slot headers */}
            {Array.from({ length: maxSlots }).map((_, index) => (
              <th key={`slot-header-${index}`} scope="col" className={`${stickyHeaderCellClass} min-w-[180px]`}>
                Slot-{index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {classRooms.map((classRoom) => (
            <tr 
              key={classRoom.id} 
              className="bg-white hover:bg-gray-50 transition-colors duration-150 cursor-pointer group" // Added group for hover state on sticky cells
              onClick={() => onRowClick(classRoom)}
            >
              <td className={actionsDataCellClass}>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onEdit(classRoom); }}
                    aria-label={`Edit ${classRoom.building}_${classRoom.room}`} 
                    className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                  >
                    <EditIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); onDelete(classRoom.id); }}
                    aria-label={`Delete ${classRoom.building}_${classRoom.room}`} 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <DeleteIcon className="w-4 h-4" />
                  </Button>
                </div>
              </td>
              <td className={slotDataCellClass}>
                {classRoom.timeSlots?.length || 0}
              </td>
              <td className={roomDataCellClass}>
                <div>{`${classRoom.building}_${classRoom.room}`}</div>
                <div className="text-xs text-gray-500 -mt-0.5">{classRoom.roomType}</div>
              </td>
              {/* Dynamically generate Slot data cells */}
              {Array.from({ length: maxSlots }).map((_, index) => {
                const slot = classRoom.timeSlots && classRoom.timeSlots[index];
                return (
                  <td key={`slot-data-${classRoom.id}-${index}`} className={`${baseDataCellClass} min-w-[180px]`}>
                    {slot ? `${formatToAMPM(slot.startTime)} - ${formatToAMPM(slot.endTime)}` : 'N/A'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassRoomTable;