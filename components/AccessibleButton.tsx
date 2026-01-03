import React from 'react';
import { clsx } from 'clsx';
import { speak } from '../services/ttsService';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant: 'green' | 'red' | 'blue' | 'yellow' | 'neutral';
  icon?: React.ReactNode;
  audioHint?: string;
  hintLanguage?: string;
  largeText?: boolean;
  fullWidth?: boolean;
  ttsEnabled?: boolean;
  selected?: boolean;
  onClick: () => void;
}

export const AccessibleButton: React.FC<Props> = ({
  label,
  variant,
  icon,
  audioHint,
  hintLanguage = 'en',
  largeText,
  fullWidth = false,
  ttsEnabled = false,
  selected = false,
  onClick,
  className,
  ...props
}) => {
  const baseStyles = "relative flex flex-col items-center justify-center p-6 rounded-xl transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-offset-2 border-4";
  
  const variants = {
    green: "bg-green-700 hover:bg-green-800 text-white border-green-900 focus:ring-green-500",
    red: "bg-red-700 hover:bg-red-800 text-white border-red-900 focus:ring-red-500",
    blue: "bg-blue-700 hover:bg-blue-800 text-white border-blue-900 focus:ring-blue-500",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-700 focus:ring-yellow-400",
    neutral: "bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-400 focus:ring-gray-400",
  };

  const selectedStyles = selected ? "ring-4 ring-offset-2 ring-black scale-105 z-10 shadow-2xl" : "shadow-md";

  const handleMouseEnter = () => {
    if (ttsEnabled && audioHint) {
      speak(audioHint, hintLanguage);
    }
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        selectedStyles,
        fullWidth ? "w-full" : "w-auto",
        className
      )}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      aria-label={audioHint || label}
      {...props}
    >
      {icon && <div className={clsx("mb-3", largeText ? "scale-150" : "scale-100")}>{icon}</div>}
      <span className={clsx("font-bold text-center", largeText ? "text-3xl" : "text-xl")}>
        {label}
      </span>
      {selected && (
        <span className="absolute top-2 right-2 bg-white text-black rounded-full p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </span>
      )}
    </button>
  );
};