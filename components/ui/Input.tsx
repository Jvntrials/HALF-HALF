
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      {...props}
      className={`bg-gray-900 border border-sky-900 text-secondary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 ${className}`}
    />
  );
};

export default Input;
