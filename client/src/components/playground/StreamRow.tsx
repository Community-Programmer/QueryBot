import React, { useState, useEffect } from 'react';

interface StreamRowProps {
  heading: string;
  information: any; // Allow any type, we'll convert to string
}

export const StreamRow: React.FC<StreamRowProps> = ({ heading, information }) => {
  // Convert information to string safely
  const displayInfo = React.useMemo(() => {
    if (typeof information === 'string') {
      return information;
    }
    if (information === null || information === undefined) {
      return 'null';
    }
    if (typeof information === 'object') {
      return JSON.stringify(information, null, 2);
    }
    return String(information);
  }, [information]);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => {
      clearTimeout(timer);
      setIsVisible(false);
    };
  }, []);

  return (
    <div
      className={`relative w-full bg-white rounded-[10px] p-4 mb-2 border transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${isHovered ? 'scale-105' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-2 left-2 text-sm font-bold text-blue-500">{heading}</div>
      <div className="mt-4 ml-10 text-sm text-left overflow-x-auto max-w-full">
        <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-2 rounded">
          {displayInfo}
        </pre>
      </div>
    </div>
  );
};