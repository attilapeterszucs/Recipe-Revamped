import React from 'react';
import { ChevronDown } from 'lucide-react';
import { BASE_CURRENCIES, getOrderedCurrencies } from '../lib/currencyOptions';
import type { LocationData } from '../types/pricing';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  detectedLocation?: LocationData;
  disabled?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  detectedLocation,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const orderedCurrencies = detectedLocation ? getOrderedCurrencies(detectedLocation) : BASE_CURRENCIES;
  const selectedOption = orderedCurrencies.find(c => c.code === selectedCurrency) || orderedCurrencies[0];

  const handleSelect = (currency: string) => {
    onCurrencyChange(currency);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          inline-flex items-center justify-between gap-2 px-4 py-2 
          bg-white border border-gray-300 rounded-lg shadow-sm 
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
          transition-colors min-w-[120px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <selectedOption.icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            {selectedOption.code}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-1 w-52 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="py-1" role="listbox">
              {orderedCurrencies.map((currency, index) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => handleSelect(currency.code)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-100 
                    transition-colors focus:outline-none focus:bg-gray-100
                    ${currency.code === selectedCurrency ? 'bg-green-50 text-green-600' : 'text-gray-900'}
                  `}
                  role="option"
                  aria-selected={currency.code === selectedCurrency}
                >
                  <currency.icon className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{currency.code}</span>
                      {index === 0 && detectedLocation && detectedLocation.currency === currency.code && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          Your location
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{currency.name}</div>
                  </div>
                  {currency.code === selectedCurrency && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-600 rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};