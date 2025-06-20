import React, { useState, useEffect } from 'react';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

import useTheme from '../../contexts/ThemeContext';

const QuickColumnMapping = ({ csvData, onMappingComplete, onCancel }) => {
  const { isDarkMode } = useTheme();
  const [columnMapping, setColumnMapping] = useState({
    date: '',
    description: '',
    amount: ''
  });

  const csvColumns = csvData.length > 0 ? Object.keys(csvData[0]) : [];
  
  const autoDetectColumns = () => {
    const mapping = {};
    
    csvColumns.forEach(column => {
      const col = column.toLowerCase().trim();
      if (!mapping.date && (col.includes('date') || col.includes('transaction date'))) {
        mapping.date = column;
      }
      if (!mapping.description && (col.includes('description') || col.includes('merchant') || col.includes('payee'))) {
        mapping.description = column;
      }
      if (!mapping.amount && (col.includes('amount') || col.includes('value'))) {
        mapping.amount = column;
      }
    });
    
    setColumnMapping(mapping);
    
    if (mapping.date && mapping.description && mapping.amount) {
      setTimeout(() => handleConfirm(mapping), 1000);
    }
  };

  useEffect(() => {
    autoDetectColumns();
  }, [csvData]);

  const handleConfirm = (mapping = columnMapping) => {
    if (!mapping.date || !mapping.description || !mapping.amount) return;
    
    const transformedData = csvData.map(row => ({
      date: row[mapping.date],
      description: row[mapping.description],
      amount: parseFloat(row[mapping.amount]) || 0,
      originalData: row
    }));
    
    onMappingComplete(transformedData);
  };

  const isValid = columnMapping.date && columnMapping.description && columnMapping.amount;

  return (
    <div className={`rounded-xl p-6 shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        Map CSV Columns
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {[
          { key: 'date', label: 'Date Column' },
          { key: 'description', label: 'Description Column' },
          { key: 'amount', label: 'Amount Column' }
        ].map(({ key, label }) => (
          <div key={key}>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {label} *
            </label>
            <select
              value={columnMapping[key] || ''}
              onChange={(e) => setColumnMapping(prev => ({ ...prev, [key]: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-100' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="">Select column...</option>
              {csvColumns.map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {isValid && csvData.length > 0 && (
        <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Preview</h4>
          <div className="text-xs space-y-1">
            {csvData.slice(0, 2).map((row, i) => (
              <div key={i} className="flex gap-4">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{row[columnMapping.date]}</span>
                <span className={isDarkMode ? 'text-gray-100' : 'text-gray-900'}>{row[columnMapping.description]}</span>
                <span className="font-medium">${parseFloat(row[columnMapping.amount]).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className={`px-4 py-2 border rounded-lg transition-colors ${
            isDarkMode 
              ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={() => handleConfirm()}
          disabled={!isValid}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            isValid
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : isDarkMode ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


export default QuickColumnMapping;
