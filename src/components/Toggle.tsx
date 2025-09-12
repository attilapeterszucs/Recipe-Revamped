import React from 'react';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  label?: string;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ 
  enabled, 
  onChange, 
  size = 'md', 
  disabled = false,
  label,
  description
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-5 w-9',
          switch: 'h-4 w-4',
          translate: enabled ? 'translate-x-4' : 'translate-x-0'
        };
      case 'lg':
        return {
          container: 'h-7 w-12',
          switch: 'h-6 w-6',
          translate: enabled ? 'translate-x-5' : 'translate-x-0'
        };
      case 'md':
      default:
        return {
          container: 'h-6 w-11',
          switch: 'h-5 w-5',
          translate: enabled ? 'translate-x-5' : 'translate-x-0'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const baseContainerClasses = `relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2`;
  const enabledClasses = enabled ? 'bg-green-600 focus:ring-green-500' : 'bg-gray-200 focus:ring-gray-300';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const switchClasses = `pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out`;

  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      onChange(!enabled);
    }
  };

  if (label || description) {
    return (
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {label && (
            <label className="text-sm font-medium text-gray-900 cursor-pointer" onClick={handleClick}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-gray-500 mt-1">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className={`${baseContainerClasses} ${enabledClasses} ${disabledClasses} ${sizeClasses.container} ml-4`}
          role="switch"
          aria-checked={enabled}
          aria-disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        >
          <span className="sr-only">
            {label ? `Toggle ${label}` : 'Toggle setting'}
          </span>
          <span
            aria-hidden="true"
            className={`${switchClasses} ${sizeClasses.switch} ${sizeClasses.translate}`}
          />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${baseContainerClasses} ${enabledClasses} ${disabledClasses} ${sizeClasses.container}`}
      role="switch"
      aria-checked={enabled}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        aria-hidden="true"
        className={`${switchClasses} ${sizeClasses.switch} ${sizeClasses.translate}`}
      />
    </button>
  );
};

export default Toggle;