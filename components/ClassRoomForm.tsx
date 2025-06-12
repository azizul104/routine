

import React, { useState, useEffect } from 'react';
import { ClassRoom, ClassRoomFormData } from '../types'; 
import Button from './Button';
import CreatableSearchableDropdown from './CreatableSearchableDropdown';
import { AddIcon, CheckIcon } from './Icons';

interface ClassRoomFormProps {
  classRoomToEdit?: ClassRoom | null;
  onSubmit: (classRoomData: ClassRoomFormData) => void;
  onCancel: () => void;
  buildingSuggestions: string[];
  allClassRooms: ClassRoom[];
  onValidationStatusChange: (hasErrors: boolean) => void;
  onSetDuplicateCombinationError: (message: string | null) => void;
  duplicateCombinationErrorMessage?: string | null; 
}

const ROOM_TYPE_OPTIONS = ["Theory", "Lab", "Office", "Meeting Room", "Common Room", "Library", "Others"];
export const ROOM_OWNER_SEPARATOR = ' — '; 

interface FieldErrors {
  roomId?: string;
  building?: string;
  floor?: string;
  room?: string;
  roomType?: string;
  capacity?: string;
}

const ClassRoomForm: React.FC<ClassRoomFormProps> = ({
  classRoomToEdit,
  onSubmit,
  onCancel,
  buildingSuggestions,
  allClassRooms,
  onValidationStatusChange,
  onSetDuplicateCombinationError,
  duplicateCombinationErrorMessage,
}) => {
  const initialFormState: ClassRoomFormData = {
    roomId: '',
    building: '',
    floor: '',
    room: '',
    roomType: ROOM_TYPE_OPTIONS[0],
    capacity: 0,
  };

  const [formData, setFormData] = useState<ClassRoomFormData>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (classRoomToEdit) {
      // Only set fields that are part of ClassRoomFormData
      setFormData({
        roomId: classRoomToEdit.roomId,
        building: classRoomToEdit.building,
        floor: classRoomToEdit.floor,
        room: classRoomToEdit.room,
        roomType: classRoomToEdit.roomType,
        capacity: classRoomToEdit.capacity,
      });
    } else {
      let maxId = 0;
      allClassRooms.forEach(cr => {
        const idNum = parseInt(cr.roomId, 10);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      });
      const nextId = (maxId + 1).toString();
      setFormData({
        ...initialFormState,
        roomId: nextId,
      });
    }
    setFieldErrors({});
    onSetDuplicateCombinationError(null);
  }, [classRoomToEdit, allClassRooms, onSetDuplicateCombinationError]);

  useEffect(() => {
    const hasErrorMarkersInFields = Object.keys(fieldErrors).length > 0;
    const hasGlobalDuplicateMessage = !!duplicateCombinationErrorMessage;
    onValidationStatusChange(hasErrorMarkersInFields || hasGlobalDuplicateMessage);
  }, [fieldErrors, duplicateCombinationErrorMessage, onValidationStatusChange]);


  const clearErrorOnChange = (fieldName: keyof FieldErrors | 'building' | 'roomType') => {
    const currentFieldNameStr = fieldName as string;

    if (fieldErrors[currentFieldNameStr as keyof FieldErrors]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentFieldNameStr as keyof FieldErrors];
        return newErrors;
      });
    }

    if (['building', 'room', 'roomType'].includes(currentFieldNameStr)) {
      if (duplicateCombinationErrorMessage) { 
        onSetDuplicateCombinationError(null);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? (value === '' ? 0 : parseInt(value, 10)) : value
    }));
    clearErrorOnChange(name as keyof FieldErrors);
  };

  const handleDropdownChange = (fieldName: keyof Pick<ClassRoomFormData, 'building'>, newValue: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: newValue }));
    clearErrorOnChange(fieldName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};
    onSetDuplicateCombinationError(null); 

    if (!formData.building.trim()) {
      newErrors.building = "Building is required.";
    }
    if (!formData.floor.trim()) {
      newErrors.floor = "Floor is required.";
    }
    if (!formData.room.trim()) {
      newErrors.room = "Room No. is required.";
    }
    if (!formData.roomType.trim()) {
      newErrors.roomType = "Room Type is required.";
    }
    if (formData.capacity < 0) {
      newErrors.capacity = "Capacity cannot be negative.";
    }
    
    let isDuplicateCombination = false;
    // Room ID uniqueness is checked by parent.
    // Duplicate Building + Room + RoomType combination check:
    const checkTargetRoomId = classRoomToEdit ? classRoomToEdit.id : null;
    isDuplicateCombination = allClassRooms.some(
      (existingRoom) =>
        (checkTargetRoomId ? existingRoom.id !== checkTargetRoomId : true) && // Exclude self if editing
        existingRoom.building.trim().toLowerCase() === formData.building.trim().toLowerCase() &&
        existingRoom.room.trim().toLowerCase() === formData.room.trim().toLowerCase() &&
        existingRoom.roomType.trim().toLowerCase() === formData.roomType.trim().toLowerCase()
    );

    if (isDuplicateCombination) {
      onSetDuplicateCombinationError("This combination of Building, Room No., and Room Type already exists.");
      if (!newErrors.building) newErrors.building = " "; 
      if (!newErrors.room) newErrors.room = " ";
      if (!newErrors.roomType) newErrors.roomType = " ";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }
    
    setFieldErrors({});
    onSubmit(formData); 
  };

  const commonInputStyle = "peer block w-full rounded-lg border px-3.5 text-sm text-gray-900 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
  const textInputStyle = `${commonInputStyle} bg-transparent py-2.5 disabled:bg-gray-100`;
  const selectInputStyle = `${commonInputStyle} bg-white py-2.5`;
  const numberInputStyle = `${commonInputStyle} bg-transparent py-2.5 disabled:bg-gray-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;

  const getBorderColorClass = (fieldName: keyof FieldErrors | 'building'): string => {
    return fieldErrors[fieldName as keyof FieldErrors] 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' 
      : 'border-slate-300 focus:border-sky-600 focus:ring-sky-600/30';
  };

  const floatingLabelStyle = "absolute left-2.5 top-0 -translate-y-1/2 scale-75 px-1 bg-white text-sky-600 transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:!scale-100 peer-placeholder-shown:!text-gray-500 peer-focus:top-0 peer-focus:scale-75 peer-focus:text-sky-600 pointer-events-none peer-disabled:text-gray-400 peer-disabled:opacity-70";
  const standardLabelStyle = "block text-sm font-medium text-gray-700 mb-1.5";
  const errorTextStyle = "text-xs text-red-500 pt-1";
  
  const buttonAnimation = "transform hover:scale-105 focus:scale-105 active:scale-100 transition-transform duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-7 p-4 md:p-6 bg-white rounded-b-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 sm:gap-y-7">
        
        <div>
          <div className="relative">
            <input
              type="text"
              name="roomId"
              id="classRoomId"
              value={formData.roomId}
              readOnly
              className={`${textInputStyle} ${getBorderColorClass('roomId')}`}
              placeholder="Room ID"
              disabled={true}
              aria-describedby={fieldErrors.roomId ? "roomId-error" : "roomId-helper-text"}
            />
            <label htmlFor="classRoomId" className={floatingLabelStyle}>Room ID</label>
             <p id="roomId-helper-text" className="text-xs text-gray-500 mt-1.5 absolute -bottom-5 left-0">
                {classRoomToEdit ? "Room ID cannot be changed." : "Room ID is auto-generated."}
            </p>
          </div>
          {fieldErrors.roomId && fieldErrors.roomId.trim() !== "" && <p id="roomId-error" className={errorTextStyle}>{fieldErrors.roomId}</p>}
        </div>

        <div>
            <CreatableSearchableDropdown
            id="building"
            label="Building"
            placeholder="Select or type Building"
            value={formData.building}
            onChange={(val) => handleDropdownChange('building', val)}
            suggestions={buildingSuggestions}
            className="min-h-[50px]"
            error={fieldErrors.building} 
            />
        </div>
        
        <div>
            <div className="relative">
            <input
                type="text"
                name="floor"
                id="floor"
                value={formData.floor}
                onChange={handleChange}
                className={`${textInputStyle.replace('disabled:bg-gray-100', 'disabled:bg-gray-50')} ${getBorderColorClass('floor')}`}
                placeholder="Floor"
                aria-describedby={fieldErrors.floor ? "floor-error" : undefined}
            />
            <label htmlFor="floor" className={floatingLabelStyle}>Floor</label>
            </div>
            {fieldErrors.floor && fieldErrors.floor.trim() !== "" && <p id="floor-error" className={errorTextStyle}>{fieldErrors.floor}</p>}
        </div>


        <div>
          <div className="relative">
            <input
              type="text"
              name="room"
              id="roomNo"
              value={formData.room}
              onChange={handleChange}
              className={`${textInputStyle.replace('disabled:bg-gray-100', 'disabled:bg-gray-50')} ${getBorderColorClass('room')}`}
              placeholder="Room No."
              aria-describedby={fieldErrors.room ? "roomNo-error" : undefined}
            />
            <label htmlFor="roomNo" className={floatingLabelStyle}>Room No.</label>
          </div>
          {fieldErrors.room && fieldErrors.room.trim() !== "" && <p id="roomNo-error" className={errorTextStyle}>{fieldErrors.room}</p>}
        </div>
        
        <div>
          <label htmlFor="roomType" className={standardLabelStyle}>Room Type</label>
          <select
            name="roomType"
            id="roomType"
            value={formData.roomType}
            onChange={handleChange}
            className={`${selectInputStyle} ${getBorderColorClass('roomType')}`}
            aria-describedby={fieldErrors.roomType ? "roomType-error" : undefined}
          >
            {ROOM_TYPE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {fieldErrors.roomType && fieldErrors.roomType.trim() !== "" && <p id="roomType-error" className={errorTextStyle}>{fieldErrors.roomType}</p>}
        </div>

         <div>
            <div className="relative">
            <input
                type="number"
                name="capacity"
                id="capacity"
                value={formData.capacity === 0 && (!classRoomToEdit || formData.capacity.toString().trim() === '0') && formData.capacity.toString().trim() !== '0' ? '' : formData.capacity.toString()}
                onChange={handleChange}
                className={`${numberInputStyle} ${getBorderColorClass('capacity')}`}
                placeholder="Capacity (Optional)"
                min="0"
                aria-describedby={fieldErrors.capacity ? "capacity-error" : undefined}
            />
            <label htmlFor="capacity" className={floatingLabelStyle}>Capacity (Optional)</label>
            </div>
            {fieldErrors.capacity && fieldErrors.capacity.trim() !== "" && <p id="capacity-error" className={errorTextStyle}>{fieldErrors.capacity}</p>}
        </div>

      </div>

      <div className="flex flex-col items-end space-y-2 pt-8">
        {((!classRoomToEdit || (classRoomToEdit && (
            formData.building !== classRoomToEdit.building ||
            formData.room !== classRoomToEdit.room ||
            formData.roomType !== classRoomToEdit.roomType
        ))) && duplicateCombinationErrorMessage) && (
             <div className="w-full text-right h-5 mb-1">
                <p className="text-xs text-red-500">{duplicateCombinationErrorMessage}</p>
             </div>
        )}
        <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={onCancel} className={buttonAnimation}>
            Cancel
            </Button>
            <Button type="submit" variant="primary" className={`${buttonAnimation} flex items-center space-x-2`}>
            {classRoomToEdit ? (
                <>
                <CheckIcon className="w-4 h-4" />
                <span>Save Changes</span>
                </>
            ) : (
                <>
                <AddIcon className="w-4 h-4" />
                <span>Add Class Room</span>
                </>
            )}
            </Button>
        </div>
      </div>
    </form>
  );
};

export default ClassRoomForm;
