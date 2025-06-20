// frontend/src/components/dashboard/CSVUpload.jsx
import React, { useState, useEffect } from 'react';

import { ThemeContext as ThemeProvider } from 'contexts/ThemeContext'
import { useTheme } from 'contexts/ThemeContext';

export const FileUploadStep = ({ onFileUploaded, isProcessing }) => {
  const { isDarkMode } = useTheme();
  const [dragActive, setDragActive] = useState(false);

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
    const data = lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      return Object.fromEntries(headers.map((h, i) => [h, values[i]?.replace(/"/g, '') || '']));
    });

    onFileUploaded(data, file.name);
  };

  const dragHandlers = {
    onDragEnter: (e) => { e.preventDefault(); setDragActive(true); },
    onDragLeave: (e) => { e.preventDefault(); setDragActive(false); },
    onDragOver: (e) => { e.preventDefault(); },
    onDrop: (e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Import Transactions
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Upload a CSV file from your bank to import transactions
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-16">
          <h2 className={`text-2xl font-light mb-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Upload Transaction CSV
          </h2>
          
          <div 
            className={`py-24 border-2 border-dashed text-center transition-all ${
              dragActive ? 'border-blue-400 bg-blue-50/10' : 
              isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
            } ${isProcessing ? 'opacity-50' : ''}`}
            {...dragHandlers}
          >
            <div className="text-6xl mb-8">📄</div>
            <h3 className={`text-2xl font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Drop CSV file here or click to browse
            </h3>
            <p className={`text-base font-light mb-8 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Standard bank export format supported
            </p>
            
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="csv-upload"
            />
            <label 
              htmlFor="csv-upload" 
              className={`inline-block px-8 py-3 text-lg font-light border-b-2 cursor-pointer transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 hover:border-white text-gray-400 hover:text-white' 
                  : 'border-gray-300 hover:border-black text-gray-600 hover:text-black'
              }`}
            >
              Choose File
            </label>
          </div>
        </div>

        {/* Help */}
        <div className={`p-8 border-l-4 ${
          isDarkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-300 bg-gray-100'
        }`}>
          <h3 className={`text-xl font-light mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Supported Formats
          </h3>
          <div className={`space-y-2 text-base font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <p>• Standard CSV export from banks and credit cards</p>
            <p>• Must include columns for Date, Description, and Amount</p>
            <p>• First row should contain column headers</p>
            <p>• All data processed locally on your device</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-16">
          <button
            onClick={() => window.history.back()}
            className={`text-lg font-light transition-colors border-b border-transparent hover:border-current pb-1 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

// Streamlined column mapping - Clean Editorial Style
export const ColumnMappingStep = ({ csvData, onNext, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [mapping, setMapping] = useState({});
  const [profileName, setProfileName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [savedMappings, setSavedMappings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('csvColumnMappings') || '{}'); }
    catch { return {}; }
  });

  const columns = Object.keys(csvData[0] || {});
  const fields = [
    { key: 'date', label: 'Date', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'amount', label: 'Amount', required: true }
  ];

  // Auto-detect on mount
  useEffect(() => {
    const autoMapping = {};
    columns.forEach(col => {
      const lower = col.toLowerCase();
      if (!autoMapping.date && lower.includes('date')) autoMapping.date = col;
      if (!autoMapping.description && (lower.includes('description') || lower.includes('merchant'))) autoMapping.description = col;
      if (!autoMapping.amount && (lower.includes('amount') || lower.includes('value'))) autoMapping.amount = col;
    });
    setMapping(autoMapping);
  }, [columns]);

  const isValid = fields.every(f => mapping[f.key]);
  const preview = isValid ? csvData.slice(0, 3).map(row => ({
    date: row[mapping.date],
    description: row[mapping.description],
    amount: parseFloat(row[mapping.amount]) || 0
  })) : [];

  const saveMapping = () => {
    if (profileName.trim()) {
      const newMappings = { ...savedMappings, [profileName.trim()]: mapping };
      setSavedMappings(newMappings);
      localStorage.setItem('csvColumnMappings', JSON.stringify(newMappings));
      setShowSave(false);
      setProfileName('');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Map CSV Columns
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Found {csvData.length} transactions. Tell us which column contains each piece of data.
          </p>
        </div>

        {/* Saved Mappings */}
        {Object.keys(savedMappings).length > 0 && (
          <div className="mb-16">
            <h2 className={`text-2xl font-light mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Use Saved Mapping
            </h2>
            <select
              value=""
              onChange={(e) => e.target.value && setMapping({ ...savedMappings[e.target.value] })}
              className={`w-full max-w-md px-0 py-3 border-0 border-b-2 bg-transparent text-lg focus:outline-none transition-colors ${
                isDarkMode 
                  ? 'border-gray-700 text-white focus:border-white' 
                  : 'border-gray-300 text-black focus:border-black'
              }`}
            >
              <option value="">Select saved mapping...</option>
              {Object.keys(savedMappings).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Column Mapping */}
        <div className="mb-16">
          <h2 className={`text-2xl font-light mb-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Column Mapping
          </h2>
          
          <div className="space-y-8">
            {fields.map(field => (
              <div key={field.key} className="grid grid-cols-12 gap-6 items-end">
                <div className="col-span-12 lg:col-span-4">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {field.label} *
                  </label>
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent text-lg focus:outline-none transition-colors ${
                      isDarkMode 
                        ? 'border-gray-700 text-white focus:border-white' 
                        : 'border-gray-300 text-black focus:border-black'
                    }`}
                  >
                    <option value="">Select column...</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-12 lg:col-span-8">
                  <div className={`text-base font-light ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {mapping[field.key] && `Sample: "${csvData[0]?.[mapping[field.key]] || 'N/A'}"`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {isValid && (
          <div className="mb-16">
            <h2 className={`text-2xl font-light mb-6 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Preview
            </h2>
            <div className="space-y-3">
              {preview.map((row, i) => (
                <div key={i} className={`flex justify-between py-3 border-b ${
                  isDarkMode ? 'border-gray-800' : 'border-gray-200'
                }`}>
                  <span className="text-base">{row.date}</span>
                  <span className="flex-1 mx-6 text-base truncate">{row.description}</span>
                  <span className={`font-mono text-base ${row.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${Math.abs(row.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={onCancel}
            className={`text-lg font-light transition-colors border-b border-transparent hover:border-current pb-1 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Back
          </button>
          
          <div className="flex items-center gap-8">
            {isValid && (
              <button
                onClick={() => setShowSave(true)}
                className={`text-sm font-light border-b border-transparent hover:border-current pb-1 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-500 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Save this mapping
              </button>
            )}
            
            <button
              onClick={() => onNext(mapping)}
              disabled={!isValid}
              className={`text-xl font-light border-b-2 pb-2 transition-all ${
                isValid
                  ? isDarkMode
                    ? 'text-white border-white hover:border-gray-400'
                    : 'text-black border-black hover:border-gray-600'
                  : isDarkMode
                    ? 'text-gray-600 border-gray-600 cursor-not-allowed'
                    : 'text-gray-400 border-gray-400 cursor-not-allowed'
              }`}
            >
              Import {csvData.length} Transactions
            </button>
          </div>
        </div>

        {/* Save Modal */}
        {showSave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className={`p-8 max-w-md w-full transition-colors ${
              isDarkMode ? 'bg-black text-white' : 'bg-white text-black'
            }`}>
              <h3 className={`text-2xl font-light mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Save Column Mapping
              </h3>
              <p className={`text-base font-light mb-6 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Give this mapping a name to reuse it for future imports.
              </p>
              
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Chase Credit Card, Bank Export, etc."
                className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent text-lg focus:outline-none transition-colors mb-8 ${
                  isDarkMode 
                    ? 'border-gray-700 text-white placeholder-gray-500 focus:border-white' 
                    : 'border-gray-300 text-black placeholder-gray-400 focus:border-black'
                }`}
              />
              
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setShowSave(false)} 
                  className={`text-lg font-light border-b border-transparent hover:border-current pb-1 transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={saveMapping}
                  disabled={!profileName.trim()}
                  className={`text-xl font-light border-b-2 pb-2 transition-all ${
                    profileName.trim()
                      ? isDarkMode
                        ? 'text-white border-white hover:border-gray-400'
                        : 'text-black border-black hover:border-gray-600'
                      : isDarkMode
                        ? 'text-gray-600 border-gray-600 cursor-not-allowed'
                        : 'text-gray-400 border-gray-400 cursor-not-allowed'
                  }`}
                >
                  Save Mapping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
export const CSVUpload = ({ onImportComplete, onCancel }) => {
  const [step, setStep] = useState('upload');
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleFileUploaded = (data, name) => {
    setCsvData(data);
    setFileName(name);
    setStep('mapping');
  };

  const handleImport = (mapping) => {
    const transformedData = csvData.map((row, i) => ({
      id: Date.now() + i,
      date: row[mapping.date] || new Date().toISOString().split('T')[0],
      description: row[mapping.description] || 'Unknown Transaction',
      amount: parseFloat(row[mapping.amount]) || 0,
      category: 'Uncategorized',
      originalData: row
    }));

    onImportComplete(transformedData, mapping);
  };

  if (step === 'upload') {
    return <FileUploadStep onFileUploaded={handleFileUploaded} />;
  }

  return (
    <ColumnMappingStep
      csvData={csvData}
      onNext={handleImport}
      onCancel={() => setStep('upload')}
    />
  );
}
