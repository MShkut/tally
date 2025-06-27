// frontend/src/components/shared/PeriodSelector.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { 
  FormGrid,
  FormField,
  StandardSelect,
  FormSection
} from './FormComponents';

export const PeriodSelector = ({ 
  onPeriodChange, 
  initialStartDate = null,
  initialEndDate = null,
  maxMonths = 12,
  minDate = null,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  
  // Initialize with saved dates or defaults
  const getInitialDates = () => {
    if (initialStartDate && initialEndDate) {
      return {
        startMonth: new Date(initialStartDate).getMonth(),
        startYear: new Date(initialStartDate).getFullYear(),
        endMonth: new Date(initialEndDate).getMonth(),
        endYear: new Date(initialEndDate).getFullYear()
      };
    }
    
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 11, 1); // 12 months from start
    return {
      startMonth: now.getMonth(),
      startYear: now.getFullYear(),
      endMonth: endDate.getMonth(),
      endYear: endDate.getFullYear()
    };
  };

  const [dates, setDates] = useState(getInitialDates());

  // Generate month options
  const months = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];

  // Generate year options (current year + next 5 years)
  const currentYear = new Date().getFullYear();
  const startYears = Array.from({ length: 6 }, (_, i) => ({
    value: currentYear + i,
    label: (currentYear + i).toString()
  }));

  // Generate dynamic end year options based on start date
  const getEndYearOptions = () => {
    const startDate = new Date(dates.startYear, dates.startMonth, 1);
    const maxEndDate = new Date(startDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths - 1);
    
    const minYear = dates.startYear;
    const maxYear = maxEndDate.getFullYear();
    
    const endYearOptions = [];
    for (let year = minYear; year <= maxYear; year++) {
      endYearOptions.push({
        value: year,
        label: year.toString()
      });
    }
    return endYearOptions;
  };

  // Generate dynamic end month options based on start date and selected end year
  const getEndMonthOptions = () => {
    const startDate = new Date(dates.startYear, dates.startMonth, 1);
    const selectedEndYear = dates.endYear;
    
    // If end year is same as start year, limit months to start month and later
    if (selectedEndYear === dates.startYear) {
      return months.filter(month => month.value >= dates.startMonth);
    }
    
    // If end year is after start year, check 12-month limit
    const maxEndDate = new Date(startDate);
    maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths - 1);
    
    if (selectedEndYear === maxEndDate.getFullYear()) {
      // Limit to max end month for the max year
      return months.filter(month => month.value <= maxEndDate.getMonth());
    }
    
    // For other years within range, all months available
    return months;
  };

  // Calculate duration in months
  const calculateDuration = () => {
    const start = new Date(dates.startYear, dates.startMonth, 1);
    const end = new Date(dates.endYear, dates.endMonth + 1, 0); // Last day of end month
    
    const monthsDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth()) + 1;
    
    return monthsDiff;
  };

  // Format display dates
  const formatDateRange = () => {
    const startDate = new Date(dates.startYear, dates.startMonth, 1);
    const endDate = new Date(dates.endYear, dates.endMonth + 1, 0);
    
    const formatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    
    return {
      start: startDate.toLocaleDateString('en-US', formatOptions),
      end: endDate.toLocaleDateString('en-US', formatOptions)
    };
  };

  // Validate and adjust end date if needed
  const validateDates = (newDates) => {
    const start = new Date(newDates.startYear, newDates.startMonth, 1);
    const maxEnd = new Date(start);
    maxEnd.setMonth(maxEnd.getMonth() + maxMonths - 1);
    
    const currentEnd = new Date(newDates.endYear, newDates.endMonth, 1);
    
    // If end is before start, set end to start
    if (currentEnd < start) {
      return {
        ...newDates,
        endMonth: newDates.startMonth,
        endYear: newDates.startYear
      };
    }
    
    // If duration exceeds max, adjust end date
    if (currentEnd > maxEnd) {
      return {
        ...newDates,
        endMonth: maxEnd.getMonth(),
        endYear: maxEnd.getFullYear()
      };
    }
    
    return newDates;
  };

  // Handle date changes
  const handleDateChange = (field, value) => {
    let newDates = {
      ...dates,
      [field]: parseInt(value)
    };
    
    // If start date changes, automatically set end date to 12 months later
    if (field === 'startMonth' || field === 'startYear') {
      const startDate = new Date(
        field === 'startYear' ? parseInt(value) : dates.startYear,
        field === 'startMonth' ? parseInt(value) : dates.startMonth,
        1
      );
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 11, 1);
      
      newDates = {
        ...newDates,
        endMonth: endDate.getMonth(),
        endYear: endDate.getFullYear()
      };
    }
    
    // If end year changes, validate that current end month is still valid
    if (field === 'endYear') {
      const startDate = new Date(dates.startYear, dates.startMonth, 1);
      const selectedEndYear = parseInt(value);
      
      // If same year as start, ensure end month >= start month
      if (selectedEndYear === dates.startYear && dates.endMonth < dates.startMonth) {
        newDates.endMonth = dates.startMonth;
      }
      
      // If at max year boundary, ensure end month <= max allowed month
      const maxEndDate = new Date(startDate);
      maxEndDate.setMonth(maxEndDate.getMonth() + maxMonths - 1);
      if (selectedEndYear === maxEndDate.getFullYear() && dates.endMonth > maxEndDate.getMonth()) {
        newDates.endMonth = maxEndDate.getMonth();
      }
    }
    
    const validatedDates = validateDates(newDates);
    setDates(validatedDates);
  };

  // Notify parent of changes
  useEffect(() => {
    if (onPeriodChange) {
      const duration = calculateDuration();
      const { start, end } = formatDateRange();
      
      onPeriodChange({
        startDate: new Date(dates.startYear, dates.startMonth, 1).toISOString(),
        endDate: new Date(dates.endYear, dates.endMonth + 1, 0).toISOString(),
        durationMonths: duration,
        displayStart: start,
        displayEnd: end
      });
    }
  }, [dates]);

  const duration = calculateDuration();
  const { start, end } = formatDateRange();
  const isValid = duration >= 1 && duration <= maxMonths;

  return (
    <div className={className}>
      <FormGrid>
        {/* Start Date Selection */}
        <FormField span={2}>
          <StandardSelect
            label="Start Month"
            value={dates.startMonth}
            onChange={(value) => handleDateChange('startMonth', value)}
            options={months}
            className="[&_label]:text-xl [&_label]:font-medium [&_button]:text-lg [&_button]:font-medium"
          />
        </FormField>
        <FormField span={2}>
          <StandardSelect
            label="Start Year"
            value={dates.startYear}
            onChange={(value) => handleDateChange('startYear', value)}
            options={startYears}
            className="[&_label]:text-xl [&_label]:font-medium [&_button]:text-lg [&_button]:font-medium"
          />
        </FormField>
        
        {/* End Date Selection */}
        <FormField span={2}>
          <StandardSelect
            label="End Month"
            value={dates.endMonth}
            onChange={(value) => handleDateChange('endMonth', value)}
            options={getEndMonthOptions()}
            className="[&_label]:text-xl [&_label]:font-medium [&_button]:text-lg [&_button]:font-medium"
          />
        </FormField>
        <FormField span={2}>
          <StandardSelect
            label="End Year"
            value={dates.endYear}
            onChange={(value) => handleDateChange('endYear', value)}
            options={getEndYearOptions()}
            className="[&_label]:text-xl [&_label]:font-medium [&_button]:text-lg [&_button]:font-medium"
          />
        </FormField>
      </FormGrid>
      
      {/* Period Summary */}
      <div className={`mt-8 p-6 border ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className={`text-center ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          <div className="text-2xl font-light mb-2">
            {start} — {end}
          </div>
          <div className={`text-lg font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {duration} month{duration !== 1 ? 's' : ''} budget period
          </div>
          {!isValid && (
            <div className="text-red-500 mt-2 text-base">
              Period must be between 1 and {maxMonths} months
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
