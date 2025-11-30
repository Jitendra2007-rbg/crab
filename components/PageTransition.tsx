import React, { useEffect, useState } from 'react';
import { AppMode } from '../types';

interface PageTransitionProps {
  mode: AppMode;
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ mode, children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
        setIsTransitioning(false);
    }, 200); // Quick transition
    
    return () => clearTimeout(timer);
  }, [mode]);

  return (
    <div className="relative h-full w-full bg-gray-50 dark:bg-dark-bg">
      {/* 
         CRITICAL FIX: We render children directly inside the container.
         We control opacity for the transition effect, but we DO NOT buffer the children in state.
         This ensures that when 'messages' update in App.tsx, they immediately update here.
      */}
      <div 
        className={`h-full w-full transition-opacity duration-200 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
         {children}
      </div>
    </div>
  );
};

export default PageTransition;