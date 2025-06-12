
import React from 'react';
import { AddIcon, LockClosedIcon, MailIcon } from './Icons'; 

export interface RoutineSlotButtonProps {
  onClick: () => void;
  'aria-label': string;
  disabled?: boolean;
  slotStyle: {
    baseBg: string;
    hoverBgSuffix: string;
    focusRingColor: string;
    iconTextColor: string;
    iconHoverTextColorSuffix: string;
    borderColorClass: string;
    filledBaseBg: string;
    filledHoverBgSuffix: string;
    filledBorderColorClass: string;
    filledIconTextColor?: string; 
    pendingBaseBg?: string;
    pendingBorderColorClass?: string;
    pendingTextColor?: string;
    lockedExternalPendingBg?: string; 
    lockedExternalPendingBorder?: string;
    lockedExternalPendingTextColor?: string;
    actionableRequestBg?: string;
    actionableRequestBorderColor?: string;
    actionableRequestTextColor?: string;
    actionableRequestIconColor?: string;
  };
  assignedCourseCode?: string;
  assignedSection?: string;
  assignedTeacher?: string; 
  status?: "assigned-by-other" | "pending-by-current" | "locked-external-pending" | "actionable-request" | "default";
  pendingRequestCourseCode?: string;
  actionableRequestDetails?: { courseCode: string, section: string, requestingProgramCode: string };
}

const RoutineSlotButton: React.FC<RoutineSlotButtonProps> = React.memo(({ 
  onClick, 
  'aria-label': ariaLabel, 
  disabled, // External disabled state (e.g., "All Programs" mode)
  slotStyle,
  assignedCourseCode,
  assignedSection,
  assignedTeacher,
  status = "default",
  pendingRequestCourseCode,
  actionableRequestDetails
}) => {
  const commonClasses = "w-full h-full flex items-center justify-center rounded-md transition-all duration-150 ease-in-out focus:outline-none p-0.5 group shadow-sm hover:shadow-md border";
  const iconBaseClasses = "w-5 h-5"; 

  let content: JSX.Element;
  let baseBgClass: string;
  let borderColorClass: string;
  let hoverBgClassFragment: string; // e.g., "hover:bg-sky-200"
  let currentFocusRingColor = slotStyle.focusRingColor;
  let effectiveTextColorClass: string = 'text-gray-700'; // Default text color for content

  const isFilled = !!(assignedCourseCode && assignedSection);

  if (status === "pending-by-current") {
    baseBgClass = slotStyle.pendingBaseBg || 'bg-yellow-100';
    borderColorClass = slotStyle.pendingBorderColorClass || 'border-yellow-300';
    hoverBgClassFragment = `hover:${slotStyle.pendingBaseBg?.replace('100', '200') || 'bg-yellow-200'}`;
    effectiveTextColorClass = slotStyle.pendingTextColor || 'text-yellow-700';
    content = (
      <div className={`text-center p-0.5 leading-tight overflow-hidden ${effectiveTextColorClass}`}>
        <div className="text-xs font-semibold truncate" title={pendingRequestCourseCode || "Requested Course"}>
          {pendingRequestCourseCode || "Course"} Req.
        </div>
        <div className="text-[10px] mt-0.5">Pending</div>
      </div>
    );
  } else if (status === "actionable-request" && actionableRequestDetails) {
    baseBgClass = slotStyle.actionableRequestBg || 'bg-blue-100';
    borderColorClass = slotStyle.actionableRequestBorderColor || 'border-blue-300';
    hoverBgClassFragment = `hover:${slotStyle.actionableRequestBg?.replace('100', '200') || 'bg-blue-200'}`;
    effectiveTextColorClass = slotStyle.actionableRequestTextColor || 'text-blue-700';
    const iconColor = slotStyle.actionableRequestIconColor || 'text-blue-600';
    content = (
      <div className={`text-center p-0.5 leading-tight overflow-hidden ${effectiveTextColorClass}`}>
        <MailIcon className={`${iconBaseClasses} ${iconColor} mx-auto mb-0.5`} />
        <div className="text-[10px] font-semibold truncate" title={`Request: ${actionableRequestDetails.courseCode} (${actionableRequestDetails.section}) From: ${actionableRequestDetails.requestingProgramCode}`}>
            REQ: {actionableRequestDetails.courseCode}
        </div>
        <div className="text-[9px] mt-0.5 truncate">From: {actionableRequestDetails.requestingProgramCode}</div>
      </div>
    );
  } else if (status === "locked-external-pending") {
    baseBgClass = slotStyle.lockedExternalPendingBg || 'bg-orange-100';
    borderColorClass = slotStyle.lockedExternalPendingBorder || 'border-orange-300';
    hoverBgClassFragment = `hover:${slotStyle.lockedExternalPendingBg?.replace('100','200') || 'bg-orange-200'}`;
    effectiveTextColorClass = slotStyle.lockedExternalPendingTextColor || 'text-orange-700';
    const iconColor = slotStyle.lockedExternalPendingTextColor || 'text-orange-700';
    content = (
      <div className={`text-center p-0.5 leading-tight overflow-hidden ${effectiveTextColorClass}`}>
          <LockClosedIcon className={`${iconBaseClasses} ${iconColor} mx-auto mb-0.5`} />
          <div className="text-[10px] font-medium">Under Review</div>
      </div>
    );
  } else if (isFilled || status === "assigned-by-other") {
    baseBgClass = slotStyle.filledBaseBg;
    borderColorClass = slotStyle.filledBorderColorClass;
    hoverBgClassFragment = `hover:${slotStyle.filledHoverBgSuffix || slotStyle.hoverBgSuffix}`;
    // Text color for filled slots will be default gray, handled by internal divs
    content = (
      <div className="text-center p-0.5 leading-tight overflow-hidden">
        <div className="text-xs font-semibold text-gray-700 truncate" title={assignedCourseCode}>{assignedCourseCode}</div>
        <div className="text-[10px] text-gray-600 truncate" title={assignedSection}>{assignedSection}</div>
        {assignedTeacher && <div className="text-[9px] text-indigo-700 mt-0.5 truncate" title={assignedTeacher}>{assignedTeacher}</div>}
      </div>
    );
  } else { // Default (empty, assignable)
    baseBgClass = slotStyle.baseBg;
    borderColorClass = slotStyle.borderColorClass;
    hoverBgClassFragment = `hover:${slotStyle.hoverBgSuffix}`;
    const iconDynamicClasses = `${iconBaseClasses} ${slotStyle.iconTextColor} group-hover:${slotStyle.iconHoverTextColorSuffix} group-focus:${slotStyle.iconHoverTextColorSuffix}`;
    content = <AddIcon className={iconDynamicClasses} />;
  }

  // Determine if the button should be functionally disabled
  // This depends on the external `disabled` prop AND some internal statuses
  const functionallyDisabled = disabled || 
                              status === "locked-external-pending" ||
                              status === "assigned-by-other";

  let finalButtonClasses = `${commonClasses} ${baseBgClass} ${borderColorClass}`;
  if (!functionallyDisabled) {
    finalButtonClasses += ` ${hoverBgClassFragment} focus:ring-2 ${currentFocusRingColor} focus:ring-offset-1`;
  } else {
    finalButtonClasses += ' opacity-70 cursor-not-allowed';
    // If it's an actionable request but externally disabled (e.g., all programs view), keep the actionable content visible but dimmed.
    // Other statuses already handle their appearance when disabled.
  }
  
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={functionallyDisabled}
      className={finalButtonClasses}
      title={ariaLabel}
    >
      {content}
    </button>
  );
});

export default RoutineSlotButton;
