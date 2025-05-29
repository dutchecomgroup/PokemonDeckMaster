import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, type, visible }) => {
  let iconClass = '';
  let bgClass = '';
  
  switch (type) {
    case 'success':
      iconClass = 'fa-check-circle text-accent';
      bgClass = 'bg-card border-accent/30';
      break;
    case 'error':
      iconClass = 'fa-exclamation-circle text-destructive';
      bgClass = 'bg-card border-destructive/30';
      break;
    case 'info':
    default:
      iconClass = 'fa-info-circle text-primary';
      bgClass = 'bg-card border-primary/30';
      break;
  }
  
  return (
    <div 
      className={`fixed bottom-4 right-4 ${bgClass} text-foreground px-4 py-3 rounded-lg shadow-md border transition-all duration-300 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      } z-50 flex items-center`}
    >
      <i className={`fas ${iconClass} mr-2`}></i>
      <span>{message}</span>
    </div>
  );
};
