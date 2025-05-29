import React from 'react';
import { getTypeClass, getTypeIcon } from '@/lib/utils';

interface EnergyIconProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EnergyIcon: React.FC<EnergyIconProps> = ({ type, size = 'md', className = '' }) => {
  // Size values in pixels
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  // Get the SVG content for this energy type
  const iconSvg = getTypeIcon(type);
  
  // Get the appropriate size CSS class
  const sizeClass = sizeMap[size];
  
  // Get the type's background color class
  const typeClass = getTypeClass(type);
  
  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full ${sizeClass} ${typeClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: iconSvg }}
      aria-label={`${type} energy`}
    />
  );
};

export default EnergyIcon;