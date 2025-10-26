import React, { useState, useRef, useEffect, memo } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  openUpward?: boolean;
}

const CustomDropdownComponent: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  icon,
  className = '',
  ariaLabel,
  openUpward = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm font-semibold shadow-sm transition-all duration-200 hover:border-green-300 hover:shadow-md cursor-pointer h-[46px] sm:h-[50px] flex items-center justify-between relative"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
            {icon}
          </div>
        )}

        {/* Selected Option Display */}
        <span className="flex items-center gap-2 text-left flex-1 min-w-0">
          {selectedOption?.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">{displayLabel}</span>
        </span>

        {/* Chevron Icon */}
        <div className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-5 h-5 text-green-500" strokeWidth={2.5} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop overlay for mobile */}
          <div className="fixed inset-0 z-30 sm:hidden" onClick={() => setIsOpen(false)} />

          {/* Options List */}
          <div
            className={`absolute z-[100] w-full bg-white border-2 border-green-200 rounded-xl shadow-2xl overflow-hidden animate-dropdown-open ${
              openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            role="listbox"
            aria-label={ariaLabel}
          >
            <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
              {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 transition-all duration-200 group
                      ${isSelected
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold'
                        : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-gray-700 font-semibold hover:text-green-700'
                      }
                      ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}
                    `}
                    style={{ animationDelay: `${index * 30}ms` }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="flex items-center gap-2.5 flex-1 min-w-0">
                      {option.icon && (
                        <span className={`text-lg flex-shrink-0 transition-transform duration-200 ${!isSelected && 'group-hover:scale-110'}`}>
                          {option.icon}
                        </span>
                      )}
                      <span className="truncate text-sm sm:text-base">{option.label}</span>
                    </span>

                    {/* Check icon for selected option */}
                    {isSelected && (
                      <div className="flex-shrink-0 animate-check-in">
                        <Check className="w-5 h-5 font-bold" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Wrap with memo for performance optimization
export const CustomDropdown = memo(CustomDropdownComponent);
CustomDropdown.displayName = 'CustomDropdown';
