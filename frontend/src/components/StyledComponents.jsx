// frontend/src/components/styled/StyledComponents.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
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
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
    : 'bg-gradient-to-br from-gray-50 via-white to-gray-50';
  
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
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${className}`}>
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
  ...props 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  const accentStyles = getAccentStyles(currentTheme, isDarkMode);
  const hoverHandlers = createAccentHover(currentTheme, disabled || loading);
  
  const baseClasses = `
    flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium 
    transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 
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
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    <div className={`flex items-center gap-3 mb-6 ${className}`}>
      {Icon && (
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accentStyles.backgroundLight(currentTheme, isDarkMode)}`}>
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
    <div className={`p-4 rounded-lg border transition-colors ${
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
      <div className={`text-2xl font-bold ${
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
    <div className={`grid ${gridClass} gap-4 ${className}`}>
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
    <div className={`mt-8 p-6 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-4">
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

// Form group wrapper with label
export const FormGroup = ({ 
  label, 
  children, 
  required = false,
  error = null,
  className = '' 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
          {required && (
            <span className={getAccentStyles(currentTheme, isDarkMode).text(currentTheme)}> *</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

// Select dropdown with theme integration
export const Select = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select an option',
  className = '',
  ...props 
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <select
      value={value}
      onChange={onChange}
      className={buildClasses.input(isDarkMode, className)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={typeof option === 'string' ? option : option.value} 
          value={typeof option === 'string' ? option : option.value}
        >
          {typeof option === 'string' ? option : option.label}
        </option>
      ))}
    </select>
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

// Simple divider line
export const Divider = ({ className = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <hr className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`} />
  );
};

// Progress indicator
export const ProgressBar = ({ 
  current, 
  total, 
  showLabels = true, 
  className = '' 
}) => {
  const { isDarkMode, currentTheme } = useTheme();
  const percentage = (current / total) * 100;
  
  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div 
          className={`h-2 rounded-full transition-all bg-${currentTheme.primary}-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabels && (
        <div className={`flex justify-between text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>{current}</span>
          <span>{total}</span>
        </div>
      )}
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
    info: isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800',
    success: isDarkMode ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-800',
    warning: isDarkMode ? 'bg-yellow-900/20 border-yellow-800 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
  };
  
  return (
    <div className={`p-4 rounded-lg border ${styles[type]} ${className}`}>
      {title && (
        <h4 className="font-semibold mb-2">{title}</h4>
      )}
      {children}
    </div>
  );
};
