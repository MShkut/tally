// frontend/src/components/shared/DuplicateWarningModal.jsx
import { useTheme } from 'contexts/ThemeContext';
import { Currency } from 'utils/currency';
import { getDuplicateSummary } from 'utils/duplicateDetection';

export const DuplicateWarningModal = ({ isOpen, duplicates, onSkipDuplicates, onImportAnyway, onCancel }) => {
  const { isDarkMode } = useTheme();

  if (!isOpen || !duplicates || duplicates.length === 0) return null;

  const summary = getDuplicateSummary(duplicates);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 z-[60] flex items-center justify-center p-4"
        onClick={onCancel}
      >
        {/* Modal */}
        <div
          className={`max-w-3xl w-full max-h-[80vh] overflow-hidden rounded-lg ${
            isDarkMode ? 'bg-black border border-gray-800' : 'bg-white border border-gray-200'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-8 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <h2 className={`text-2xl font-light mb-2 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Possible Duplicate Transactions
            </h2>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We found {summary.count} transaction{summary.count !== 1 ? 's' : ''} that may already exist in your records.
            </p>
          </div>

          {/* Duplicate List */}
          <div className="overflow-y-auto max-h-[50vh] p-8">
            <div className="space-y-6">
              {duplicates.map((dup, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border ${
                    isDarkMode
                      ? 'bg-gray-900 border-gray-800'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* New Transaction */}
                  <div className="mb-3">
                    <div className={`text-xs font-medium mb-2 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>
                      New Transaction (Importing)
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {dup.newTransaction.description}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {dup.newTransaction.sub_category} • {formatDate(dup.newTransaction.date)}
                        </div>
                      </div>
                      <div className={`text-lg font-medium whitespace-nowrap ${
                        dup.newTransaction.amount >= 0
                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                          : isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {Currency.format(Math.abs(dup.newTransaction.amount))}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={`border-t my-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />

                  {/* Existing Transaction */}
                  <div>
                    <div className={`text-xs font-medium mb-2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      Existing Transaction
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {dup.existingTransaction.description}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {dup.existingTransaction.sub_category} • {formatDate(dup.existingTransaction.date)}
                        </div>
                      </div>
                      <div className={`text-lg font-medium whitespace-nowrap ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {Currency.format(Math.abs(dup.existingTransaction.amount))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className={`p-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={onCancel}
                className={`px-6 py-3 text-sm font-medium border transition-colors ${
                  isDarkMode
                    ? 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={onSkipDuplicates}
                className={`px-6 py-3 text-sm font-medium border transition-colors ${
                  isDarkMode
                    ? 'border-white text-white hover:bg-white hover:text-black'
                    : 'border-black text-black hover:bg-black hover:text-white'
                }`}
              >
                Skip {summary.count} Duplicate{summary.count !== 1 ? 's' : ''}
              </button>
              <button
                onClick={onImportAnyway}
                className={`px-6 py-3 text-sm font-medium border transition-colors ${
                  isDarkMode
                    ? 'border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white'
                    : 'border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white'
                }`}
              >
                Import All Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
