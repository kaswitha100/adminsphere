import React from 'react';

const LoadingSpinner = ({ size = 'md', message = 'Loading details...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[180px]">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-slate-200 border-t-indigo-600 animate-spin`}
      />
      {message && (
        <p className="mt-3 text-sm font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
