// frontend/src/components/dashboard/EnhancedCSVUpload.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormGrid, 
  FormField, 
  StandardInput,
  StandardSelect,
  FormSection,
  StandardFormLayout,
  SummaryCard,
  validation
} from '../shared/FormComponents';

export const EnhancedCSVUpload = ({ onComplete, onBack }) => {
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
    
    // Auto-detect columns
    autoDetectColumns(headers);
  };

  const autoDetectColumns = (headers) => {
    const mapping = { date: '', description: '', amount: '' };
    
    headers.forEach(header => {
      const lower = header.toLowerCase();
      
      // Date detection
      if (!mapping.date && (
        lower.includes('date') || 
        lower.includes('posted') || 
        lower.includes('transaction date')
      )) {
        mapping.date = header;
      }
      
      // Description detection
      if (!mapping.description && (
        lower.includes('description') || 
        lower.includes('merchant') || 
        lower.includes('payee') ||
        lower.includes('details')
      )) {
        mapping.description = header;
      }
      
      // Amount detection
      if (!mapping.amount && (
        lower.includes('amount') || 
        lower.includes('value') || 
        lower.includes('debit') ||
        lower.includes('charge')
      )) {
        mapping.amount = header;
      }
    });
    
    setColumnMapping(mapping);
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
    onComplete(csvData, columnMapping);
  };

  const saveMapping = (name) => {
    if (!name.trim()) return;
    
    const newMappings = { ...savedMappings, [name]: columnMapping };
    setSavedMappings(newMappings);
    localStorage.setItem('csvColumnMappings', JSON.stringify(newMappings));
  };

  const loadSavedMapping = (name) => {
    if (savedMappings[name]) {
      setColumnMapping(savedMappings[name]);
    }
  };

  if (step === 'upload') {
    return (
      <>
        <ThemeToggle />
        <StandardFormLayout
          title="Upload Transaction File"
          subtitle="Import transactions from your bank or credit card CSV export"
          onBack={onBack}
          showBack={true}
          backLabel="Cancel"
        >
          
          {/* Upload Area */}
          <FormSection>
            <div 
              className={`
                py-24 border-2 text-center transition-all cursor-pointer
                ${dragActive 
                  ? isDarkMode 
                    ? 'border-white bg-gray-900' 
                    : 'border-black bg-gray-100'
                  : isDarkMode 
                    ? 'border-gray-700 hover:border-gray-500' 
                    : 'border-gray-300 hover:border-gray-400'
                }
              `}
              {...dragHandlers}
              onClick={() => document.getElementById('csv-file-input').click()}
            >
              <h3 className={`text-5xl font-light mb-4 ${
                isDarkMode ? 'text-white' : 'text-black'
              }`}>
                Drop CSV file here
              </h3>
              <p className={`text-2xl font-light mb-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                or click to browse
              </p>
              
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

        </StandardFormLayout>
      </>
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
    <>
      <ThemeToggle />
      <StandardFormLayout
        title="Map CSV Columns"
        subtitle={`Found ${csvData.length} transactions in ${fileName}. Tell us which columns contain your data.`}
        onBack={() => setStep('upload')}
        onNext={handleMappingComplete}
        canGoNext={isValid}
        nextLabel={`Import ${csvData.length} Transactions`}
        backLabel="Choose Different File"
      >
        
        {/* Saved Mappings */}
        {Object.keys(savedMappings).length > 0 && (
          <FormSection title="Quick Load">
            <FormGrid>
              <FormField span={6}>
                <StandardSelect
                  label="Use Saved Mapping"
                  value=""
                  onChange={loadSavedMapping}
                  options={savedMappingOptions}
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </FormField>
            </FormGrid>
          </FormSection>
        )}

        {/* Column Mapping */}
        <FormSection title="Column Mapping">
          <div className="space-y-8">
            <FormGrid>
              <FormField span={4}>
                <StandardSelect
                  label="Date Column"
                  value={columnMapping.date}
                  onChange={(value) => setColumnMapping(prev => ({ ...prev, date: value }))}
                  options={columnOptions}
                  required
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </FormField>
              <FormField span={8}>
                {columnMapping.date && csvData[0]?.[columnMapping.date] && (
                  <div className="flex items-end h-full pb-4">
                    <div className={`text-xl font-light ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Sample: "{csvData[0][columnMapping.date]}"
                    </div>
                  </div>
                )}
              </FormField>
            </FormGrid>

            <FormGrid>
              <FormField span={4}>
                <StandardSelect
                  label="Description Column"
                  value={columnMapping.description}
                  onChange={(value) => setColumnMapping(prev => ({ ...prev, description: value }))}
                  options={columnOptions}
                  required
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </FormField>
              <FormField span={8}>
                {columnMapping.description && csvData[0]?.[columnMapping.description] && (
                  <div className="flex items-end h-full pb-4">
                    <div className={`text-xl font-light ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Sample: "{csvData[0][columnMapping.description]}"
                    </div>
                  </div>
                )}
              </FormField>
            </FormGrid>

            <FormGrid>
              <FormField span={4}>
                <StandardSelect
                  label="Amount Column"
                  value={columnMapping.amount}
                  onChange={(value) => setColumnMapping(prev => ({ ...prev, amount: value }))}
                  options={columnOptions}
                  required
                  className="[&_label]:text-2xl [&_label]:font-medium [&_button]:text-xl [&_button]:font-medium"
                />
              </FormField>
              <FormField span={8}>
                {columnMapping.amount && csvData[0]?.[columnMapping.amount] && (
                  <div className="flex items-end h-full pb-4">
                    <div className={`text-xl font-light ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Sample: "{csvData[0][columnMapping.amount]}"
                    </div>
                  </div>
                )}
              </FormField>
            </FormGrid>
          </div>
        </FormSection>

        {/* Preview */}
        {isValid && (
          <FormSection title="Preview Import">
            <div className="space-y-3">
              {csvData.slice(0, 3).map((row, i) => (
                <div key={i} className={`
                  flex justify-between py-4 border-b
                  ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}
                `}>
                  <div className="flex-1">
                    <div className={`text-xl font-light ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      {row[columnMapping.description]}
                    </div>
                    <div className={`text-base font-light mt-1 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {row[columnMapping.date]}
                    </div>
                  </div>
                  <div className={`
                    text-xl font-mono
                    ${parseFloat(row[columnMapping.amount]) >= 0 
                      ? 'text-green-500' 
                      : 'text-red-500'
                    }
                  `}>
                    ${Math.abs(parseFloat(row[columnMapping.amount]) || 0).toFixed(2)}
                  </div>
                </div>
              ))}
              {csvData.length > 3 && (
                <div className={`text-center py-4 text-base font-light ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  ... and {csvData.length - 3} more transactions
                </div>
              )}
            </div>
          </FormSection>
        )}

        {/* Save Mapping Option */}
        {isValid && (
          <FormSection>
            <SaveMappingOption onSave={saveMapping} />
          </FormSection>
        )}

      </StandardFormLayout>
    </>
  );
};

// Save mapping component
const SaveMappingOption = ({ onSave }) => {
  const { isDarkMode } = useTheme();
  const [showSave, setShowSave] = useState(false);
  const [mappingName, setMappingName] = useState('');

  const handleSave = () => {
    onSave(mappingName);
    setShowSave(false);
    setMappingName('');
  };

  if (!showSave) {
    return (
      <div className="text-center">
        <button
          onClick={() => setShowSave(true)}
          className={`
            text-base font-light border-b border-transparent hover:border-current pb-1
            ${isDarkMode 
              ? 'text-gray-500 hover:text-gray-300' 
              : 'text-gray-500 hover:text-gray-700'
            }
          `}
        >
          Save this column mapping for future imports
        </button>
      </div>
    );
  }

  return (
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
  );
};
