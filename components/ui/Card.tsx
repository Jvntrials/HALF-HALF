
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface border border-sky-900/50 shadow-lg rounded-lg p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
