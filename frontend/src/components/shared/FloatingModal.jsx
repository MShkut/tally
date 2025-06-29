// frontend/src/components/shared/FloatingModal.jsx
import React from 'react';
import { useTheme } from 'contexts/ThemeContext';

export const FloatingModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  input, 
  buttons = [], 
  children,
  maxWidth = "max-w-2xl"
}) => {
  const { isDarkMode } = useTheme();

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isDarkMode ? 'bg-black/80' : 'bg-white/80'
      }`}
      onClick={handleBackdropClick}
    >
      <div className={`
        ${maxWidth} mx-8 p-12 transition-colors
        ${isDarkMode 
          ? 'bg-black text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_0_20px_rgba(255,255,255,0.08)]' 
          : 'bg-white text-black shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_0_20px_rgba(0,0,0,0.15)]'
        }
      `}>
        <div className="text-center space-y-8">
          {title && (
            <h3 className="text-3xl font-light">
              {title}
            </h3>
          )}
          
          {message && (
            <p className={`
              text-xl font-light leading-relaxed
              ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {message}
            </p>
          )}

          {input && (
            <div className="space-y-6">
              <input
                type="text"
                value={input.value}
                onChange={(e) => input.onChange(e.target.value)}
                placeholder={input.placeholder}
                className={`
                  w-full text-xl font-light py-4 px-0 border-0 border-b-2 bg-transparent focus:outline-none transition-colors
                  ${isDarkMode 
                    ? 'border-gray-600 text-white placeholder-gray-500 focus:border-white' 
                    : 'border-gray-300 text-black placeholder-gray-500 focus:border-black'
                  }
                `}
                autoFocus={input.autoFocus}
              />
            </div>
          )}

          {children && (
            <div className="space-y-6">
              {children}
            </div>
          )}

          {buttons.length > 0 && (
            <div className="flex justify-center gap-8">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  disabled={button.disabled}
                  className={`
                    text-xl font-light transition-all
                    ${button.primary 
                      ? `border-b-2 pb-2 ${
                          button.disabled
                            ? 'text-gray-400 border-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'text-white border-white hover:border-gray-400'
                              : 'text-black border-black hover:border-gray-600'
                        }`
                      : `pb-1 ${
                          isDarkMode
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-black'
                        }`
                    }
                  `}
                >
                  {button.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};