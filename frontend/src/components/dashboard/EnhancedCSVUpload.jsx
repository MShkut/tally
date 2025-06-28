// frontend/src/components/dashboard/EnhancedCSVUpload.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { Currency } from 'utils/currency';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  AddItemButton,
  validation
} from '../shared/FormComponents';

export const EnhancedCSVUpload = ({ onComplete, onBack, onStepChange }) => {
  const { isDarkMode } = useTheme();
  const [step, setStep] = useState('upload'); // 'upload' or 'mapping'
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    description: '',
    amount: ''
  });
  const [savedMappings, setSavedMappings] = useState(() => {
    try { 
      return JSON.parse(localStorage.getItem('csvColumnMappings') || '{}'); 
    } catch { 
      return {}; 
    }
  });
  const [selectedSavedMapping, setSelectedSavedMapping] = useState('');

  const handleFiles = async (files) => {
    if (!files?.[0]) return;
    const file = files[0];
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Better CSV parsing that handles quoted values
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      if (current) {
        result.push(current.trim());
      }
      
      return result;
    };

    const data = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      return Object.fromEntries(
        headers.map((h, i) => [h, values[i]?.replace(/"/g, '') || ''])
      );
    });

    setCsvData(data);
    setFileName(file.name);
    setStep('mapping');
    onStepChange?.('mapping', { count: data.length, fileName: file.name });
    
    // Try to load default mapping first, then auto-detect
    const defaultMapping = localStorage.getItem('defaultColumnMapping');
    if (defaultMapping) {
      try {
        const parsed = JSON.parse(defaultMapping);
        // Check if all required columns exist in the CSV
        if (headers.includes(parsed.date) && headers.includes(parsed.description) && headers.includes(parsed.amount)) {
          setColumnMapping(parsed);
          // Auto-complete if default mapping is valid
          setTimeout(() => handleMappingComplete(), 100);
          return;
        }
      } catch (e) {
        console.log('Invalid default mapping, falling back to auto-detect');
      }
    }
    
    // Fallback to auto-detect columns
    autoDetectColumns(headers);
  };

  const autoDetectColumns = (headers) => {
  const mapping = { date: '', description: '', amount: '' };
  
  headers.forEach(header => {
    const col = header.toLowerCase().trim();
    
    // Enhanced date detection
    if (!mapping.date && (
      col.includes('date') || 
      col.includes('posted') || 
      col.includes('transaction date') ||
      col === 'date' ||
      col.includes('trans date')
    )) {
      mapping.date = header;
    }
    
    // Enhanced description detection
    if (!mapping.description && (
      col.includes('description') || 
      col.includes('merchant') || 
      col.includes('payee') ||
      col.includes('details') ||
      col.includes('name') ||
      col === 'description'
    )) {
      mapping.description = header;
    }
    
    // Enhanced amount detection
    if (!mapping.amount && (
      col.includes('amount') || 
      col.includes('value') || 
      col.includes('debit') ||
      col.includes('charge') ||
      col === 'amount' ||
      col.includes('transaction amount')
    )) {
      mapping.amount = header;
    }
  });
  
  return mapping;
};

  const dragHandlers = {
    onDragEnter: (e) => { 
      e.preventDefault(); 
      setDragActive(true); 
    },
    onDragLeave: (e) => { 
      e.preventDefault(); 
      setDragActive(false); 
    },
    onDragOver: (e) => { 
      e.preventDefault(); 
    },
    onDrop: (e) => { 
      e.preventDefault(); 
      setDragActive(false); 
      handleFiles(e.dataTransfer.files); 
    }
  };

  const handleMappingComplete = () => {
    if (!columnMapping.date || !columnMapping.description || !columnMapping.amount) {
      return;
    }
    
    // Process CSV data using column mapping
    const processedTransactions = csvData.map(row => ({
      date: row[columnMapping.date],
      description: row[columnMapping.description],
      amount: parseFloat(row[columnMapping.amount]?.replace(/[,$]/g, '') || '0')
    }));
    
    onComplete(processedTransactions);
  };

  const saveMapping = (name) => {
    if (!name.trim()) return;
    
    const newMappings = { ...savedMappings, [name]: columnMapping };
    setSavedMappings(newMappings);
    localStorage.setItem('csvColumnMappings', JSON.stringify(newMappings));
  };

  const loadSavedMapping = (name) => {
    if (name && savedMappings[name]) {
      setColumnMapping(savedMappings[name]);
      setSelectedSavedMapping(name);
    } else {
      setSelectedSavedMapping('');
    }
  };

  if (step === 'upload') {
    return (
      <div className={`min-h-screen transition-colors ${
        isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
      }`}>
        <ThemeToggle />
        
        <div className="max-w-6xl mx-auto px-8 py-12">
          
          {/* Upload Area */}
          <FormSection>
            <div
              {...dragHandlers}
              onClick={() => document.getElementById('csv-file-input').click()}
              className={`w-full py-6 border-2 border-dashed transition-colors text-center mb-8 cursor-pointer ${
                dragActive 
                  ? isDarkMode 
                    ? 'border-white bg-gray-900' 
                    : 'border-black bg-gray-100'
                  : isDarkMode 
                    ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="text-lg font-light">
                Drop CSV file here or click to browse
              </span>
              
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="csv-file-input"
              />
            </div>
          </FormSection>

          {/* Format Help */}
          <FormSection title="Supported Formats">
            <div className={`space-y-3 text-xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p>• Standard CSV exports from major banks and credit cards</p>
              <p>• Must include columns for Date, Description, and Amount</p>
              <p>• First row should contain column headers</p>
              <p>• Automatic column detection for common formats</p>
              <p>• All data processed locally on your device</p>
            </div>
          </FormSection>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-16">
            <button
              onClick={onBack}
              className={`text-lg font-light transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
                  : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
              }`}
            >
              Cancel
            </button>
            <div />
          </div>

        </div>
      </div>
    );
  }

  // Mapping step
  const columns = Object.keys(csvData[0] || {});
  const isValid = columnMapping.date && columnMapping.description && columnMapping.amount;
  
  const columnOptions = [
    { value: '', label: 'Select column...' },
    ...columns.map(col => ({ value: col, label: col }))
  ];

  const savedMappingOptions = [
    { value: '', label: 'Load saved mapping...' },
    ...Object.keys(savedMappings).map(name => ({ value: name, label: name }))
  ];

  return (
    <div className={`min-h-screen transition-colors ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
    }`}>
      <ThemeToggle />
      
      <div className="max-w-6xl mx-auto px-8 py-12">
        
        {/* Saved Mappings and Set Default */}
        <FormSection>
          <FormGrid>
            {Object.keys(savedMappings).length > 0 && (
              <div className="col-span-12 lg:col-span-3">
                <StandardSelect
                  label="Use Saved Mapping"
                  value={selectedSavedMapping}
                  onChange={loadSavedMapping}
                  options={savedMappingOptions}
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </div>
            )}
            <div className={Object.keys(savedMappings).length > 0 ? "col-span-12 lg:col-span-9" : "col-span-12"}>
              <div className="flex items-end h-full pb-4">
                <button
                  onClick={() => {
                    localStorage.setItem('defaultColumnMapping', JSON.stringify(columnMapping));
                    alert('Default mapping set! Future CSV uploads with matching columns will skip this step.');
                  }}
                  disabled={!isValid}
                  className={`
                    text-xl font-medium transition-colors pb-1
                    ${isValid
                      ? isDarkMode 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-green-600 hover:text-green-800'
                      : 'text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  Set current mapping as default
                </button>
              </div>
            </div>
          </FormGrid>
        </FormSection>

        {/* Column Mapping */}
        <FormSection>
          <FormGrid>
            {/* Date Column */}
            <FormField span={4} mobileSpan={4}>
              <StandardSelect
                label="Date Column"
                value={columnMapping.date}
                onChange={(value) => setColumnMapping(prev => ({ ...prev, date: value }))}
                options={columnOptions}
                className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
              />
              {columnMapping.date && csvData[0]?.[columnMapping.date] && (
                <div className={`mt-2 text-base font-light ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Sample: "{csvData[0][columnMapping.date]}"
                </div>
              )}
            </FormField>
            
            {/* Description Column */}
            <FormField span={4} mobileSpan={4}>
              <StandardSelect
                label="Description Column"
                value={columnMapping.description}
                onChange={(value) => setColumnMapping(prev => ({ ...prev, description: value }))}
                options={columnOptions}
                className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
              />
              {columnMapping.description && csvData[0]?.[columnMapping.description] && (
                <div className={`mt-2 text-base font-light ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Sample: "{csvData[0][columnMapping.description]}"
                </div>
              )}
            </FormField>
            
            {/* Amount Column */}
            <FormField span={4} mobileSpan={4}>
              <StandardSelect
                label="Amount Column"
                value={columnMapping.amount}
                onChange={(value) => setColumnMapping(prev => ({ ...prev, amount: value }))}
                options={columnOptions}
                className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
              />
              {columnMapping.amount && csvData[0]?.[columnMapping.amount] && (
                <div className={`mt-2 text-base font-light ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Sample: "{csvData[0][columnMapping.amount]}"
                </div>
              )}
            </FormField>
          </FormGrid>
        </FormSection>


        {/* Save Mapping Option */}
        {isValid && (
          <FormSection>
            <SaveMappingOption 
              onSave={saveMapping} 
              currentMapping={columnMapping}
              savedMappings={savedMappings}
              selectedSavedMapping={selectedSavedMapping}
            />
          </FormSection>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-16">
          <button
            onClick={() => {
              setStep('upload');
              onStepChange?.('upload');
            }}
            className={`text-lg font-light transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white border-b border-gray-700 hover:border-white pb-1' 
                : 'text-gray-600 hover:text-black border-b border-gray-300 hover:border-black pb-1'
            }`}
          >
            Choose Different File
          </button>
          
          <button
            onClick={handleMappingComplete}
            disabled={!isValid}
            className={`text-xl font-light transition-all ${
              isValid
                ? isDarkMode
                  ? 'text-white border-b-2 border-white hover:border-gray-400 pb-2'
                  : 'text-black border-b-2 border-black hover:border-gray-600 pb-2'
                : isDarkMode
                  ? 'text-gray-600 cursor-not-allowed pb-2'
                  : 'text-gray-400 cursor-not-allowed pb-2'
            }`}
          >
            Import {csvData.length} Transactions
          </button>
        </div>

      </div>
    </div>
  );
};

// Save mapping component
const SaveMappingOption = ({ onSave, currentMapping, savedMappings, selectedSavedMapping }) => {
  const { isDarkMode } = useTheme();
  const [showSave, setShowSave] = useState(false);
  const [mappingName, setMappingName] = useState('');

  // Check if current mapping is new (not already saved)
  const isNewMapping = !selectedSavedMapping && !Object.values(savedMappings).some(saved => 
    saved.date === currentMapping.date && 
    saved.description === currentMapping.description && 
    saved.amount === currentMapping.amount
  );

  const handleSave = () => {
    onSave(mappingName);
    setShowSave(false);
    setMappingName('');
  };

  // Only show if it's a new mapping format
  if (!isNewMapping) return null;

  if (!showSave) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowSave(true)}
          className={`
            text-xl font-medium transition-colors pb-1
            ${isDarkMode 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-blue-600 hover:text-blue-800'
            }
          `}
        >
          Save this mapping for future imports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FormGrid>
        <FormField span={8}>
          <StandardInput
            label="Save Mapping As"
            value={mappingName}
            onChange={setMappingName}
            placeholder="Chase Credit Card, Bank of America, etc."
            className="[&_label]:text-2xl [&_label]:font-medium [&_input]:text-2xl [&_input]:font-medium [&_input]:pb-4"
          />
        </FormField>
        <FormField span={4}>
          <div className="flex items-end h-full pb-4 gap-4">
            <button
              onClick={handleSave}
              disabled={!mappingName.trim()}
              className={`
                text-xl font-light border-b-2 pb-2 transition-all
                ${mappingName.trim()
                  ? isDarkMode
                    ? 'text-white border-white hover:border-gray-400'
                    : 'text-black border-black hover:border-gray-600'
                  : 'text-gray-400 border-gray-400 cursor-not-allowed'
                }
              `}
            >
              Save
            </button>
            <button
              onClick={() => setShowSave(false)}
              className={`
                text-xl font-light border-b border-transparent hover:border-current pb-1
                ${isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 hover:text-black'
                }
              `}
            >
              Cancel
            </button>
          </div>
        </FormField>
      </FormGrid>
    </div>
  );
};
