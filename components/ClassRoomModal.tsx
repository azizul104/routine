

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ClassRoom, ClassRoomFormData, TimeInterval, Program, RoutineEntry } from '../types'; 
// initialClassRooms import removed as classRoomsData is prop
// initialPrograms import removed as programs is prop
import ClassRoomTable from './ClassRoomTable';
import ClassRoomFormModal from './ClassRoomFormModal';
import ClassRoomDetailsModal from './ClassRoomDetailsModal';
import FilterItem from './FilterItem'; 
import { AddIcon, CloseIcon, SearchIcon, UploadIcon, DownloadIcon } from './Icons';
import { ROOM_OWNER_SEPARATOR } from './ClassRoomForm'; 
import * as XLSX from 'xlsx';
import useDebounce from '../hooks/useDebounce';

interface ClassRoomModalProps {
  onClose: () => void;
  classRoomsData: ClassRoom[]; 
  onClassRoomsChange: (updatedClassRooms: ClassRoom[] | ((prevState: ClassRoom[]) => ClassRoom[])) => void; 
  programs: Program[]; // Added programs prop
  routineEntries: RoutineEntry[]; // Added routineEntries prop
}

const ClassRoomModal: React.FC<ClassRoomModalProps> = ({ 
  onClose, 
  classRoomsData: classRooms, 
  onClassRoomsChange,
  programs,
  routineEntries 
}) => {
  const [searchTerm, setSearchTerm] = useState(''); 
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isClassRoomFormModalOpen, setIsClassRoomFormModalOpen] = useState(false);
  const [currentClassRoomForForm, setCurrentClassRoomForForm] = useState<ClassRoom | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClassRoomForDetails, setSelectedClassRoomForDetails] = useState<ClassRoom | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);
  const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
  const debouncedBuildingSearchTerm = useDebounce(buildingSearchTerm, 300);

  const [selectedFloors, setSelectedFloors] = useState<string[]>([]);
  const [floorSearchTerm, setFloorSearchTerm] = useState('');
  const debouncedFloorSearchTerm = useDebounce(floorSearchTerm, 300);
  
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [roomTypeSearchTerm, setRoomTypeSearchTerm] = useState('');
  const debouncedRoomTypeSearchTerm = useDebounce(roomTypeSearchTerm, 300);

  const [selectedRoomOwners, setSelectedRoomOwners] = useState<string[]>([]);
  const [roomOwnerSearchTerm, setRoomOwnerSearchTerm] = useState('');
  const debouncedRoomOwnerSearchTerm = useDebounce(roomOwnerSearchTerm, 300);

  const allBuildings = useMemo(() => {
    let relevantClassRooms = classRooms;
    if (selectedFloors.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedFloors.includes(cr.floor));
    }
    if (selectedRoomTypes.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedRoomTypes.includes(cr.roomType));
    }
    if (selectedRoomOwners.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedRoomOwners.includes(cr.roomOwner));
    }
    return [...new Set(relevantClassRooms.map(cr => cr.building).filter(Boolean))].sort();
  }, [classRooms, selectedFloors, selectedRoomTypes, selectedRoomOwners]);

  const allFloors = useMemo(() => {
    let relevantClassRooms = classRooms;
    if (selectedBuildings.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedBuildings.includes(cr.building));
    }
    if (selectedRoomTypes.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedRoomTypes.includes(cr.roomType));
    }
    if (selectedRoomOwners.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedRoomOwners.includes(cr.roomOwner));
    }
    return [...new Set(relevantClassRooms.map(cr => cr.floor).filter(Boolean))].sort();
  }, [classRooms, selectedBuildings, selectedRoomTypes, selectedRoomOwners]);

  const allRoomTypes = useMemo(() => {
    let relevantClassRooms = classRooms;
    if (selectedBuildings.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedBuildings.includes(cr.building));
    }
    if (selectedFloors.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedFloors.includes(cr.floor));
    }
    if (selectedRoomOwners.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedRoomOwners.includes(cr.roomOwner));
    }
    return [...new Set(relevantClassRooms.map(cr => cr.roomType).filter(Boolean))].sort();
  }, [classRooms, selectedBuildings, selectedFloors, selectedRoomOwners]);

  const allRoomOwnersForFilter = useMemo(() => { 
    let relevantClassRooms = classRooms;
    if (selectedBuildings.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedBuildings.includes(cr.building));
    }
    if (selectedFloors.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedFloors.includes(cr.floor));
    }
    if (selectedRoomTypes.length > 0) {
      relevantClassRooms = relevantClassRooms.filter(cr => selectedRoomTypes.includes(cr.roomType));
    }
    return [...new Set(relevantClassRooms.map(cr => cr.roomOwner).filter(owner => owner && owner.trim() !== ''))].sort();
  }, [classRooms, selectedBuildings, selectedFloors, selectedRoomTypes]);
  
  const buildingSuggestionsForForm = useMemo(() => {
    // Use all unique buildings from current classRooms data
    const allBuildingsFromCurrent = classRooms.map(cr => cr.building);
    return [...new Set(allBuildingsFromCurrent)]
      .filter(Boolean)
      .sort();
  }, [classRooms]); 

  const roomOwnerSuggestionsForDetailsAndForm = useMemo(() => { 
    // Use current programs from props
    return programs.map(p => `${p.programCode}${ROOM_OWNER_SEPARATOR}${p.programName}`).sort();
  }, [programs]);

  useEffect(() => {
    setSelectedBuildings(prevSelected => prevSelected.filter(item => allBuildings.includes(item)));
  }, [allBuildings]);

  useEffect(() => {
    setSelectedFloors(prevSelected => prevSelected.filter(item => allFloors.includes(item)));
  }, [allFloors]);

  useEffect(() => {
    setSelectedRoomTypes(prevSelected => prevSelected.filter(item => allRoomTypes.includes(item)));
  }, [allRoomTypes]);

  useEffect(() => {
    setSelectedRoomOwners(prevSelected => prevSelected.filter(item => allRoomOwnersForFilter.includes(item)));
  }, [allRoomOwnersForFilter]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isClassRoomFormModalOpen) {
          setIsClassRoomFormModalOpen(false);
          setCurrentClassRoomForForm(null);
        } else if (isDetailsModalOpen) {
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, isClassRoomFormModalOpen, isDetailsModalOpen]);

  const filteredClassRooms = useMemo(() => {
    let tempClassRooms = [...classRooms];
    if (debouncedSearchTerm) {
      tempClassRooms = tempClassRooms.filter(classRoom =>
        Object.values(classRoom).some(value => {
            if (typeof value === 'string') {
                return value.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            } else if (typeof value === 'number') {
                return value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            }
            return false;
        })
      );
    }
    if (selectedBuildings.length > 0) {
      tempClassRooms = tempClassRooms.filter(cr => selectedBuildings.includes(cr.building));
    }
    if (selectedFloors.length > 0) {
      tempClassRooms = tempClassRooms.filter(cr => selectedFloors.includes(cr.floor));
    }
    if (selectedRoomTypes.length > 0) {
      tempClassRooms = tempClassRooms.filter(cr => selectedRoomTypes.includes(cr.roomType));
    }
    if (selectedRoomOwners.length > 0) {
      tempClassRooms = tempClassRooms.filter(cr => selectedRoomOwners.includes(cr.roomOwner));
    }
    return tempClassRooms.sort((a, b) => a.roomId.localeCompare(b.roomId));
  }, [classRooms, debouncedSearchTerm, selectedBuildings, selectedFloors, selectedRoomTypes, selectedRoomOwners]);

  const handleOpenAddForm = () => {
    setCurrentClassRoomForForm(null);
    setIsClassRoomFormModalOpen(true);
  };

  const handleOpenEditForm = (classRoomItem: ClassRoom) => {
    setCurrentClassRoomForForm(classRoomItem);
    setIsClassRoomFormModalOpen(true);
  };

  const handleDeleteClassRoom = (classRoomId: string) => {
    if (window.confirm('Are you sure you want to delete this class room?')) {
      onClassRoomsChange(prevClassRooms => prevClassRooms.filter(cr => cr.id !== classRoomId));
    }
  };

  const handleFormSubmit = (classRoomFormData: ClassRoomFormData) => {
    if (currentClassRoomForForm) { 
      onClassRoomsChange(prevClassRooms =>
        prevClassRooms.map(cr => 
          cr.id === currentClassRoomForForm.id 
          ? { 
              ...cr, 
              ...classRoomFormData, 
              id: currentClassRoomForForm.id, 
              // sharedWith is not part of ClassRoomFormData, so keep existing or default
              sharedWith: cr.sharedWith || [],
            }
          : cr
        )
      );
    } else { 
      if (classRooms.some(cr => cr.roomId === classRoomFormData.roomId)) {
        alert(`Classroom with Room ID ${classRoomFormData.roomId} already exists. Room ID must be unique.`);
        return; 
      }
      const newClassRoom: ClassRoom = {
        ...classRoomFormData, 
        id: classRoomFormData.roomId, 
        roomOwner: '', 
        timeSlots: [],
        sharedWith: [], 
      }; 
      onClassRoomsChange(prevClassRooms => 
        [newClassRoom, ...prevClassRooms].sort((a, b) => a.roomId.localeCompare(b.roomId))
      );
    }
    setIsClassRoomFormModalOpen(false);
    setCurrentClassRoomForForm(null);
  };
  
  const handleFormModalClose = useCallback(() => {
    setIsClassRoomFormModalOpen(false);
    setCurrentClassRoomForForm(null);
  }, []);

  const handleShowDetails = (classRoomItem: ClassRoom) => {
    setSelectedClassRoomForDetails(classRoomItem);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setSelectedClassRoomForDetails(null);
    setIsDetailsModalOpen(false);
  };
  
  const handleUpdateTimeSlots = (classRoomId: string, updatedTimeSlots: TimeInterval[]) => {
    onClassRoomsChange(prevClassRooms =>
      prevClassRooms.map(cr =>
        cr.id === classRoomId ? { ...cr, timeSlots: updatedTimeSlots } : cr
      )
    );
    
    setSelectedClassRoomForDetails(prevDetails => 
      (prevDetails && prevDetails.id === classRoomId) ? { ...prevDetails, timeSlots: updatedTimeSlots } : prevDetails
    );
  };

  const handleUpdateRoomOwner = (classRoomId: string, newRoomOwner: string) => {
    onClassRoomsChange(prevClassRooms =>
      prevClassRooms.map(cr =>
        cr.id === classRoomId ? { ...cr, roomOwner: newRoomOwner } : cr
      )
    );

    setSelectedClassRoomForDetails(prevDetails =>
      (prevDetails && prevDetails.id === classRoomId) ? { ...prevDetails, roomOwner: newRoomOwner } : prevDetails
    );
  };

  const handleUpdateRoomShare = (classRoomId: string, sharedWithProgramCodes: string[]) => {
    onClassRoomsChange(prevClassRooms =>
      prevClassRooms.map(cr =>
        cr.id === classRoomId ? { ...cr, sharedWith: sharedWithProgramCodes } : cr
      )
    );
    setSelectedClassRoomForDetails(prevDetails =>
      (prevDetails && prevDetails.id === classRoomId) ? { ...prevDetails, sharedWith: sharedWithProgramCodes } : prevDetails
    );
  };


  const handleDownloadData = () => {
    if (filteredClassRooms.length === 0) {
      alert("No data to download. Apply different filters or add data.");
      return;
    }
    const headers = ["Room ID", "Building", "Floor", "Room No.", "Room", "Room Type", "Capacity", "Room Owner", "Shared With"];
    const dataToExport = filteredClassRooms.map(cr => ({
      "Room ID": cr.roomId,
      "Building": cr.building,
      "Floor": cr.floor,
      "Room No.": cr.room,
      "Room": `${cr.building}_${cr.room}`, 
      "Room Type": cr.roomType,
      "Capacity": cr.capacity,
      "Room Owner": cr.roomOwner,
      "Shared With": (cr.sharedWith || []).join(', '),
    }));
    
    const workbook = XLSX.utils.book_new(); 
    const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headers }); 
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class Rooms");
    XLSX.writeFile(workbook, "filteredClassRoomData.xlsx");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validMimeTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validMimeTypes.includes(file.type) && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
        alert('Invalid file type. Please upload an Excel file (.xls or .xlsx).');
        if(event.target) event.target.value = ''; 
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) throw new Error('Failed to read file content.');
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {defval:""}); 

        if (!jsonData || jsonData.length === 0) {
            alert('The Excel file is empty or has no data in the first sheet.');
            if(event.target) event.target.value = '';
            return;
        }
        
        const fileHeaders = jsonData.length > 0 ? Object.keys(jsonData[0]).map(h => h.trim().toLowerCase()) : [];
        const headerMapping: {[key: string]: string} = {
            "room id": "roomId", "roomid": "roomId",
            "building": "building",
            "floor": "floor",
            "room no.": "roomNo", "room no": "roomNo", "roomno": "roomNo",
            "room": "roomCombined", 
            "room type": "roomType", "roomtype": "roomType",
            "capacity": "capacity",
            "room owner": "roomOwner", "roomowner": "roomOwner",
            "shared with": "sharedWith", "sharedwith": "sharedWith"
        };
        
        const requiredDbFieldsForUpload: (keyof ClassRoom | 'roomNo')[] = ['roomId', 'building', 'floor', 'roomNo', 'roomType'];
        const presentLogicalHeaders = Object.keys(headerMapping).filter(excelHeader => fileHeaders.includes(excelHeader)).map(excelHeader => headerMapping[excelHeader]);
        
        const missingRequiredLogicalHeaders = requiredDbFieldsForUpload.filter(
            (rh) => !presentLogicalHeaders.includes(rh)
        );

        if (missingRequiredLogicalHeaders.length > 0) {
            const reverseHeaderMapping: { [key: string]: string } = {};
            for (const key in headerMapping) {
                if (Object.prototype.hasOwnProperty.call(headerMapping, key)) {
                     // Prioritize more specific keys or simply take the first one encountered for a logical name
                    if (!reverseHeaderMapping[headerMapping[key]] || key.length > (reverseHeaderMapping[headerMapping[key]] || '').length) {
                        reverseHeaderMapping[headerMapping[key]] = key;
                    }
                }
            }
            const userFriendlyMissing = missingRequiredLogicalHeaders.map(lh => {
                const excelHeaderKey = reverseHeaderMapping[lh];
                return excelHeaderKey ? excelHeaderKey.replace(/\b\w/g, l => l.toUpperCase()) : lh; 
            });
            throw new Error(`Invalid Excel structure. Missing essential columns: ${userFriendlyMissing.join(', ')}. Please ensure your Excel file includes columns like Room ID, Building, Floor, Room No., Room Type.`);
        }

        const newClassRoomsFromFile: ClassRoom[] = jsonData.map((row: any, index: number) => {
          const getRowValue = (logicalHeader: string): string => {
            const excelHeaderKey = Object.keys(headerMapping).find(key => headerMapping[key] === logicalHeader && fileHeaders.includes(key));
            return excelHeaderKey ? String(row[Object.keys(jsonData[0]).find(k => k.trim().toLowerCase() === excelHeaderKey) || ''] ?? '').trim() : '';
          };
          
          const roomId = getRowValue("roomId");
          const buildingFromFile = getRowValue("building");
          const floorFromFile = getRowValue("floor");
          const roomNoFromFile = getRowValue("roomNo");
          const roomCombinedFromFile = getRowValue("roomCombined"); 
          const roomTypeFromFile = getRowValue("roomType");
          const capacityStr = getRowValue("capacity");
          const roomOwnerFromFile = getRowValue("roomOwner");
          const sharedWithStr = getRowValue("sharedWith");

          if (!roomId) throw new Error(`Row ${index + 2}: "Room ID" is missing or empty.`);
          if (!buildingFromFile) throw new Error(`Row ${index + 2} (Room ID: ${roomId}): "Building" is missing or empty.`);
          if (!floorFromFile) throw new Error(`Row ${index + 2} (Room ID: ${roomId}): "Floor" is missing or empty.`);
          if (!roomNoFromFile) throw new Error(`Row ${index + 2} (Room ID: ${roomId}): "Room No." is missing or empty.`);
          if (!roomTypeFromFile) throw new Error(`Row ${index + 2} (Room ID: ${roomId}): "Room Type" is missing or empty.`);
          
          if (roomCombinedFromFile && roomCombinedFromFile !== `${buildingFromFile}_${roomNoFromFile}`) {
            throw new Error(`Row ${index + 2} (Room ID: ${roomId}): "Room" column value ('${roomCombinedFromFile}') does not match combined "Building" ('${buildingFromFile}') and "Room No." ('${roomNoFromFile}'). Expected: '${buildingFromFile}_${roomNoFromFile}'. Please ensure the 'Room' column (if present) is consistent or remove it.`);
          }
          
          const capacity = parseInt(capacityStr, 10);
          if (capacityStr && (isNaN(capacity) || capacity < 0)) { 
            throw new Error(`Row ${index + 2} (Room ID: ${roomId}): "Capacity" (if provided) must be a non-negative number. Found: '${capacityStr}'`);
          }
          
          const sharedWithArray = sharedWithStr ? sharedWithStr.split(',').map(s => s.trim()).filter(Boolean) : [];


          return {
            id: roomId, 
            roomId: roomId,
            building: buildingFromFile,
            floor: floorFromFile,
            room: roomNoFromFile, 
            roomType: roomTypeFromFile,
            capacity: capacityStr ? capacity : 0, 
            roomOwner: roomOwnerFromFile,
            timeSlots: [],
            sharedWith: sharedWithArray,
          };
        });
        
        const roomIdsInFile = newClassRoomsFromFile.map(cr => cr.roomId);
        const duplicateRoomIds = roomIdsInFile.filter((id, idx) => roomIdsInFile.indexOf(id) !== idx);
        if (duplicateRoomIds.length > 0) {
          throw new Error(`Uploaded file contains duplicate Room IDs: ${[...new Set(duplicateRoomIds)].join(', ')}. Room IDs must be unique within the file.`);
        }
        
        onClassRoomsChange(newClassRoomsFromFile.sort((a, b) => a.roomId.localeCompare(b.roomId)));
        alert(`Upload successful. ${newClassRoomsFromFile.length} class rooms loaded. Existing data has been replaced.`);

      } catch (error) {
        console.error('Error processing uploaded file:', error);
        alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        if(event.target) event.target.value = '';
      }
    };
    reader.onerror = () => {
        alert('Error reading file.');
        if(event.target) event.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedBuildings([]);
    setBuildingSearchTerm('');
    setSelectedFloors([]);
    setFloorSearchTerm('');
    setSelectedRoomTypes([]);
    setRoomTypeSearchTerm('');
    setSelectedRoomOwners([]);
    setRoomOwnerSearchTerm('');
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="classRoomModalTitle"
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-screen-xl max-h-[95vh] flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 bg-white p-3.5 border-b border-gray-200 flex items-center justify-between space-x-4">
            <h2 id="classRoomModalTitle" className="text-xl font-semibold text-gray-800 truncate flex-shrink-0 mr-2 sm:mr-4">
              DIU Class Room List
            </h2>
            <div className="flex items-center justify-end flex-1 min-w-0"> 
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden transition-all duration-150 ease-in-out focus-within:border-sky-500 bg-white w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl">
                    <div className="pl-3 pr-1 flex items-center pointer-events-none text-gray-400">
                        <SearchIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search all fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="py-2 px-1 min-w-[80px] xs:min-w-[100px] sm:min-w-[120px] md:min-w-[180px] flex-1 border-none focus:outline-none focus:ring-0 text-sm placeholder-gray-500"
                        aria-label="Search class rooms"
                    />
                    <div className="flex items-center flex-shrink-0">
                        <button
                            type="button"
                            onClick={handleOpenAddForm}
                            className="flex items-center px-2 sm:px-2.5 py-1.5 border-l border-gray-300 text-sky-600 hover:bg-sky-50 focus:outline-none focus:bg-sky-100 transition-colors duration-150"
                            title="Add Room"
                        >
                            <AddIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden sm:inline ml-1 text-sm font-medium whitespace-nowrap">Add Room</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadButtonClick}
                            className="flex items-center px-2 md:px-2.5 py-1.5 border-l border-gray-300 text-sky-600 hover:bg-sky-50 focus:outline-none focus:bg-sky-100 transition-colors duration-150"
                            title="Upload Class Room Data (Excel)"
                        >
                            <UploadIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden md:inline ml-1 text-sm font-medium whitespace-nowrap">Upload</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadData}
                            className="flex items-center px-2 md:px-2.5 py-1.5 border-l border-gray-300 text-sky-600 hover:bg-sky-50 focus:outline-none focus:bg-sky-100 transition-colors duration-150"
                            title="Download Filtered Class Room Data (Excel)"
                        >
                            <DownloadIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="hidden md:inline ml-1 text-sm font-medium whitespace-nowrap">Download</span>
                        </button>
                        <button
                            type="button" 
                            onClick={onClose} 
                            aria-label="Close modal"
                            title="Close"
                            className="flex items-center px-2.5 py-1.5 border-l border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors duration-150"
                        >
                            <CloseIcon className="w-4 h-4 flex-shrink-0" />
                        </button>
                    </div>
                </div>
            </div>
          </header>
          
          <input
            type="file" ref={fileInputRef} onChange={handleFileUpload}
            accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden" aria-hidden="true" id="classRoomFileUpload"
          />

          <div className="flex flex-1 overflow-hidden">
            <aside className="w-60 bg-gray-50 border-r border-gray-200 p-2.5 flex flex-col overflow-y-auto custom-scrollbar flex-shrink-0">
              <div className="mb-2 flex justify-between items-center px-1">
                <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
                <button
                  onClick={resetAllFilters}
                  className="text-xs text-sky-600 hover:text-sky-700 hover:underline focus:outline-none"
                  title="Reset all filters"
                >
                  Reset All
                </button>
              </div>
              <FilterItem
                title="Building"
                items={allBuildings}
                selectedItems={selectedBuildings}
                onSelectionChange={setSelectedBuildings}
                searchTerm={buildingSearchTerm} // Pass immediate term for input value
                onSearchTermChange={setBuildingSearchTerm} // Updates immediate term
                placeholder="Search buildings..."
                // Filtering in FilterItem itself will use its 'searchTerm' prop (which is buildingSearchTerm)
                // Main table filtering will use debouncedBuildingSearchTerm (implicitly handled by filteredClassRooms memo)
              />
              <FilterItem
                title="Floor"
                items={allFloors}
                selectedItems={selectedFloors}
                onSelectionChange={setSelectedFloors}
                searchTerm={floorSearchTerm}
                onSearchTermChange={setFloorSearchTerm} 
                placeholder="Search floors..."
              />
              <FilterItem
                title="Room Type"
                items={allRoomTypes}
                selectedItems={selectedRoomTypes}
                onSelectionChange={setSelectedRoomTypes}
                searchTerm={roomTypeSearchTerm}
                onSearchTermChange={setRoomTypeSearchTerm}
                placeholder="Search room types..."
              />
              <FilterItem
                title="Room Owner"
                items={allRoomOwnersForFilter}
                selectedItems={selectedRoomOwners}
                onSelectionChange={setSelectedRoomOwners}
                searchTerm={roomOwnerSearchTerm}
                onSearchTermChange={setRoomOwnerSearchTerm}
                placeholder="Search room owners..."
              />
            </aside>

            <main className="flex-1 overflow-auto custom-scrollbar"> {/* Removed p-4, added overflow-auto */}
              <ClassRoomTable
                classRooms={filteredClassRooms}
                onEdit={handleOpenEditForm}
                onDelete={handleDeleteClassRoom}
                onRowClick={handleShowDetails}
              />
            </main>
          </div>
        </div>
      </div>

      <ClassRoomFormModal
        isOpen={isClassRoomFormModalOpen}
        classRoomToEdit={currentClassRoomForForm}
        onSubmit={handleFormSubmit}
        onClose={handleFormModalClose}
        buildingSuggestions={buildingSuggestionsForForm}
        allClassRooms={classRooms} 
      />

      {isDetailsModalOpen && selectedClassRoomForDetails && (
        <ClassRoomDetailsModal
          isOpen={isDetailsModalOpen}
          classRoom={selectedClassRoomForDetails}
          onClose={handleCloseDetailsModal}
          onUpdateTimeSlots={handleUpdateTimeSlots} 
          onUpdateRoomOwner={handleUpdateRoomOwner}
          onUpdateRoomShare={handleUpdateRoomShare} // Pass new handler
          roomOwnerSuggestions={roomOwnerSuggestionsForDetailsAndForm}
          allPrograms={programs} // Pass all programs for sharing list
          routineEntries={routineEntries} // Pass routineEntries
        />
      )}
    </>
  );
};

export default ClassRoomModal;
