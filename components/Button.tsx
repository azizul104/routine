import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg'; // Added size prop
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', // Default size is 'md'
  ...props 
}) => {
  // Base styles common to all sizes and variants (excluding padding and text-size which are size-dependent)
  const baseStyle = "font-semibold rounded-lg focus:outline-none transition-all duration-150 ease-in-out"; // Removed transform, scaling, and focus rings
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = "bg-sky-500 text-white hover:bg-sky-600 focus:bg-sky-600"; // Added focus state for primary
      break;
    case 'secondary':
      variantStyle = "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:bg-gray-300"; // Light theme secondary
      break;
    case 'danger':
      variantStyle = "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600";
      break;
    case 'ghost':
      variantStyle = "bg-transparent text-sky-600 hover:bg-sky-50 focus:bg-sky-100"; // Removed border, adjusted focus
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = "py-1 px-2 text-xs";
      break;
    case 'md':
      sizeStyle = "py-2 px-4 text-sm"; // Default size styling
      break;
    case 'lg':
      sizeStyle = "py-3 px-6 text-lg";
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;