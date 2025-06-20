// frontend/src/components/styled/StyledComponents.jsx (matching IncomeStep.jsx import path)
import React from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { 
  buildClasses, 
  getAccentStyles, 
  createAccentHover,
  formatCurrency 
} from '../../utils/themeUtils';

// Page wrapper with consistent gradient background
export const Page = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  
  const backgroundClass = isDarkMode 
    ? '  via-gray-800 ' 
    : '  via-white ';
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${backgroundClass} ${className}`}>
      {children}
    </div>
  );
};

// Card component with consistent styling and shadow
export const Card = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={buildClasses.card(isDarkMode, className)}>
      {children}
    </div>
  );
};

// Secondary card for nested content
export const CardSecondary = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`p-4  ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${className}`}>
      {children}
    </div>
  );
};

// Heading components with consistent theming
export const Heading = ({ 
  children, 
  level = 2, 
  size = null, 
  className = '' 
}) => {
  const { isDarkMode } = useTheme();
  const sizeClass = size || (level === 1 ? 'text-3xl' : level === 2 ? 'text-2xl' : 'text-xl');
  const Tag = `h${level}`;
  
  return (
    <Tag className={buildClasses.heading(isDarkMode, sizeClass, className)}>
      {children}
    </Tag>
  );
};

// Description/secondary text
export const Description = ({ children, className = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <p className={buildClasses.description(isDarkMode, className)}>
      {children}
    </p>
  );
};

// Input component with full theme integration
export const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  className = '',
  icon: Icon = null,
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  
  if (Icon) {
    return (
      <div className="relative">
        <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={buildClasses.input(isDarkMode, `pl-10 ${className}`)}
          {...props}
        />
      </div>
    );
  }
  
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={buildClasses.input(isDarkMode, className)}
      {...props}
    />
  );
};

// Primary button with accent color theming
export const PrimaryButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  className = '',
  useThemeColor = false,
  ...props 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  
  if (useThemeColor) {
    const accentStyles = getAccentStyles(currentTheme, isDarkMode);
    const hoverHandlers = createAccentHover(currentTheme, disabled || loading);
    
    const baseClasses = `
      flex items-center justify-center gap-2 px-6 py-3  font-medium 
      transition-all duration-200  focus:outline-none focus:ring-2 
      focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
      ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}
      ${className}
    `;

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={baseClasses}
        style={accentStyles.button(disabled || loading)}
        {...hoverHandlers}
        {...props}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent  animate-spin" />
            Processing...
          </>
        ) : (
          children
        )}
      </button>
    );
  }

  // Default blue button for backward compatibility
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 px-6 py-3  font-medium 
        transition-all duration-200  focus:outline-none focus:ring-2 
        focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-white
        ${disabled || loading 
          ? isDarkMode ? 'bg-gray-700' : 'bg-gray-400' 
          : 'bg-blue-600 hover:bg-blue-700'
        }
        ${isDarkMode ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent  animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Secondary button with subtle styling
export const SecondaryButton = ({ 
  children, 
  onClick, 
  disabled = false,
  className = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buildClasses.buttonSecondary(isDarkMode, className)}
      {...props}
    >
      {children}
    </button>
  );
};

// Dashed add button for "Add Another" patterns
export const AddButton = ({ 
  children, 
  onClick, 
  className = '',
  ...props 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  
  const hoverHandlers = {
    onMouseEnter: (e) => {
      e.target.style.borderColor = `rgb(var(--color-${currentTheme.primary}-500))`;
      e.target.style.color = `rgb(var(--color-${currentTheme.primary}-600))`;
    },
    onMouseLeave: (e) => {
      e.target.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db';
      e.target.style.color = isDarkMode ? '#9ca3af' : '#6b7280';
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={buildClasses.buttonDashed(isDarkMode, className)}
      {...hoverHandlers}
      {...props}
    >
      {children}
    </button>
  );
};

// Section header with icon, title, and description
export const SectionHeader = ({ 
  icon: Icon, 
  title, 
  description, 
  className = '' 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  const accentStyles = getAccentStyles(currentTheme, isDarkMode);
  
  return (
    <div className={`flex items-center gap-3 mb-12 ${className}`}>
      {Icon && (
        <div className={`w-12 h-12  flex items-center justify-center ${accentStyles.backgroundLight(currentTheme, isDarkMode)}`}>
          <Icon size={24} className={accentStyles.text(currentTheme)} />
        </div>
      )}
      <div>
        <Heading level={2}>{title}</Heading>
        {description && <Description>{description}</Description>}
      </div>
    </div>
  );
};

// Summary card for displaying financial totals
export const SummaryCard = ({ 
  title, 
  value, 
  subtitle = null,
  icon: Icon = null,
  accent = false,
  className = '' 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  const accentStyles = getAccentStyles(currentTheme, isDarkMode);
  
  return (
    <div className={`p-4  border transition-colors ${
      accent 
        ? accentStyles.backgroundLight(currentTheme, isDarkMode)
        : isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } ${className}`}>
      {Icon && (
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} className={accent ? accentStyles.text(currentTheme) : `${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </div>
        </div>
      )}
      {!Icon && (
        <div className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {title}
        </div>
      )}
      <div className={`text-3xl font-light ${
        accent 
          ? accentStyles.text(currentTheme)
          : isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>
      {subtitle && (
        <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

// Grid layout for summary cards
export const SummaryGrid = ({ children, cols = 2, className = '' }) => {
  const gridClass = cols === 1 ? 'grid-cols-1' : 
                   cols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                   cols === 3 ? 'grid-cols-1 md:grid-cols-3' :
                   'grid-cols-1 md:grid-cols-4';
  
  return (
    <div className={`grid ${gridClass} gap-8 ${className}`}>
      {children}
    </div>
  );
};

// Container for summary sections
export const SummarySection = ({ 
  children, 
  title = null,
  icon: Icon = null,
  className = '' 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  
  return (
    <div className={`mt-8 p-6  ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-8">
          {Icon && (
            <Icon 
              size={20} 
              className={getAccentStyles(currentTheme, isDarkMode).text(currentTheme)}
            />
          )}
          {title && <Heading level={3} size="text-lg">{title}</Heading>}
        </div>
      )}
      {children}
    </div>
  );
};

// Alert/notification component
export const Alert = ({ 
  type = 'info', 
  title = null, 
  children, 
  className = '' 
}) => {
  const { isDarkMode } = useTheme();
  
  const styles = {
    info: isDarkMode ? 'bg-blue-900/20 border-gray-300 text-gray-500' : 'bg-blue-50 border-gray-300 text-gray-500',
    success: isDarkMode ? 'bg-green-900/20 border-green-800 text-gray-500' : 'bg-green-50 border-green-200 text-gray-500',
    warning: isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
  };
  
  return (
    <div className={`p-4  border ${styles[type]} ${className}`}>
      {title && (
        <h4 className="font-semibold mb-2">{title}</h4>
      )}
      {children}
    </div>
  );
};

// Checkbox with accent color theming
export const Checkbox = ({ 
  checked, 
  onChange, 
  label, 
  className = '',
  ...props 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          {...props}
        />
        <div className={`
          w-5 h-5 border-2 rounded transition-colors duration-200
          ${checked 
            ? `bg-${currentTheme.primary}-500 border-${currentTheme.primary}-500`
            : isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'
          }
        `}>
          {checked && (
            <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  );
};
