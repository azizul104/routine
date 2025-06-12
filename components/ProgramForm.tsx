import React, { useState, useEffect } from 'react';
import { Program, ProgramFormData } from '../types';
import Button from './Button';
import CreatableSearchableDropdown from './CreatableSearchableDropdown'; 

interface ProgramFormProps {
  programToEdit?: Program | null;
  onSubmit: (programData: ProgramFormData) => void;
  onCancel: () => void;
  facultySuggestions: string[];
}

const ProgramForm: React.FC<ProgramFormProps> = ({ 
  programToEdit, 
  onSubmit, 
  onCancel, 
  facultySuggestions 
}) => {
  const initialFormState: ProgramFormData = {
    pid: '',
    faculty: '',
    programCode: '',
    programName: '',
    programType: 'Undergraduate',
    semesterType: 'Tri-Semester',
  };

  const [formData, setFormData] = useState<ProgramFormData>(initialFormState);

  useEffect(() => {
    if (programToEdit) {
      setFormData(programToEdit);
    } else {
      setFormData(initialFormState);
    }
  }, [programToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacultyChange = (newFacultyValue: string) => {
    setFormData(prev => ({ ...prev, faculty: newFacultyValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programToEdit && !formData.pid.trim()) {
        alert("P-ID cannot be empty for a new program.");
        return;
    }
    if (!formData.programName.trim()) {
        alert("Program Name cannot be empty.");
        return;
    }
    if (!formData.faculty.trim()) {
      alert("Faculty cannot be empty.");
      return;
    }
    onSubmit(formData);
  };

  const commonInputStyle = "peer block w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 ease-in-out focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-600/30 focus:shadow-md disabled:opacity-70 disabled:cursor-not-allowed";
  const textInputStyle = `${commonInputStyle} bg-transparent disabled:bg-gray-50`;
  const selectInputStyle = `${commonInputStyle} bg-white`;

  const floatingLabelStyle = "absolute left-2.5 top-0 -translate-y-1/2 scale-75 px-1 bg-white text-sky-600 transition-all duration-200 ease-in-out peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:text-gray-500 peer-focus:top-0 peer-focus:scale-75 peer-focus:text-sky-600 pointer-events-none peer-disabled:text-gray-400 peer-disabled:opacity-70";
  const standardLabelStyle = "block text-sm font-medium text-gray-700 mb-1.5";
  
  const buttonAnimation = "transform hover:scale-105 focus:scale-105 active:scale-100 transition-transform duration-150";

  return (
    <form onSubmit={handleSubmit} className="space-y-7 p-4 md:p-6 bg-white rounded-b-lg">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-7">
        {/* P-ID Field with Floating Label */}
        <div className="relative">
          <input
            type="text"
            name="pid"
            id="pid"
            value={formData.pid}
            onChange={handleChange}
            className={textInputStyle}
            placeholder="P-ID" 
            disabled={!!programToEdit} 
            required
          />
          <label htmlFor="pid" className={floatingLabelStyle}>P-ID</label>
          {!!programToEdit && <p className="text-xs text-gray-500 mt-1.5 absolute -bottom-5 left-0">P-ID cannot be changed.</p>}
        </div>

        {/* Faculty Field using CreatableSearchableDropdown */}
        <CreatableSearchableDropdown
            id="faculty"
            label="Faculty"
            placeholder="Select or type Faculty"
            value={formData.faculty}
            onChange={handleFacultyChange}
            suggestions={facultySuggestions}
            className="md:col-span-1" 
        />

        {/* Program Code Field with Floating Label */}
        <div className="relative">
          <input
            type="text"
            name="programCode"
            id="programCode"
            value={formData.programCode}
            onChange={handleChange}
            className={textInputStyle}
            placeholder="Program Code"
            required
          />
          <label htmlFor="programCode" className={floatingLabelStyle}>Program Code</label>
        </div>
        
        {/* Program Name Field with Floating Label */}
        <div className="relative">
          <input
            type="text"
            name="programName"
            id="programName"
            value={formData.programName}
            onChange={handleChange}
            className={textInputStyle}
            placeholder="Program Name"
            required
          />
          <label htmlFor="programName" className={floatingLabelStyle}>Program Name</label>
        </div>

        {/* Program Type Field (Standard Label) */}
        <div>
          <label htmlFor="programType" className={standardLabelStyle}>Program Type</label>
          <select
            name="programType"
            id="programType"
            value={formData.programType}
            onChange={handleChange}
            className={selectInputStyle}
          >
            <option value="Undergraduate">Undergraduate</option>
            <option value="Graduate">Graduate</option>
          </select>
        </div>

        {/* Semester Type Field (Standard Label) */}
        <div>
          <label htmlFor="semesterType" className={standardLabelStyle}>Semester Type</label>
          <select
            name="semesterType"
            id="semesterType"
            value={formData.semesterType}
            onChange={handleChange}
            className={selectInputStyle}
          >
            <option value="Tri-Semester">Tri-Semester</option>
            <option value="Bi-Semester">Bi-Semester</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-8"> {/* Increased top padding */}
        <Button type="button" variant="secondary" onClick={onCancel} className={buttonAnimation}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className={buttonAnimation}>
          {programToEdit ? 'Save Changes' : 'Add Program'}
        </Button>
      </div>
    </form>
  );
};

export default ProgramForm;