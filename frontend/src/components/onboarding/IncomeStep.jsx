import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import NavigationButtons from '../shared/NavigationButtons';
import IncomeSource from './IncomeSource';

const IncomeStep = ({ onNext, onBack }) => {
  const { isDarkMode } = useTheme();
  const [incomeSources, setIncomeSources] = useState([
    { 
      id: 1, 
      name: 'Primary Job', 
      amount: '75000', 
      frequency: 'Yearly'
    },
    { 
      id: 2, 
      name: 'Side Hustle', 
      amount: '1250', 
      frequency: 'Monthly'
    }
  ]);

  const addIncomeSource = () => {
    const newId = Math.max(...incomeSources.map(s => s.id), 0) + 1;
    setIncomeSources([
      ...incomeSources,
      { id: newId, name: '', amount: '', frequency: 'Yearly' }
    ]);
  };

  const updateIncomeSource = (id, updatedSource) => {
    setIncomeSources(incomeSources.map(source => 
      source.id === id ? updatedSource : source
    ));
  };

  const deleteIncomeSource = (id) => {
    setIncomeSources(incomeSources.filter(source => source.id !== id));
  };

  const convertToYearly = (amount, frequency) => {
    const num = parseFloat(amount) || 0;
    switch (frequency) {
      case 'Weekly': return num * 52;
      case 'Bi-weekly': return num * 26;
      case 'Monthly': return num * 12;
      case 'Yearly': return num;
      default: return num;
    }
  };

  const totalYearlyIncome = incomeSources.reduce((total, source) => {
    return total + convertToYearly(source.amount, source.frequency);
  }, 0);

  const handleNext = () => {
    if (onNext) {
      onNext({ incomeSources, totalYearlyIncome });
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <ProgressBar currentStep={1} />
        
        <div className="mb-24">
          <h1 className={`text-5xl font-light leading-tight mb-4 ${
            isDarkMode ? 'text-white' : 'text-black'
          }`}>
            Let's Start with Your Income
          </h1>
          <p className={`text-xl font-light ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Enter all sources of regular income to build your financial foundation
          </p>
        </div>

        <div className="mb-16">
          <div className="space-y-6 mb-12">
            {incomeSources.map((source) => (
              <IncomeSource
                key={source.id}
                source={source}
                onUpdate={(updatedSource) => updateIncomeSource(source.id, updatedSource)}
                onDelete={() => deleteIncomeSource(source.id)}
              />
            ))}
          </div>

          <button
            onClick={addIncomeSource}
            className={`w-full py-6 border-2 border-dashed transition-colors text-center ${
              isDarkMode 
                ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg font-light">Add another income source</span>
          </button>

          {totalYearlyIncome > 0 && (
            <div className={`mt-16 py-8 border-t border-b ${
              isDarkMode ? 'border-gray-800' : 'border-gray-200'
            }`}>
              <div className="text-center">
                <div className={`text-4xl font-light mb-2 ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  ${totalYearlyIncome.toLocaleString()}
                </div>
                <div className={`text-lg font-light ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total yearly income
                </div>
                <div className={`text-base mt-2 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  ${(totalYearlyIncome/12).toLocaleString()} per month
                </div>
              </div>
            </div>
          )}

          <NavigationButtons
            onBack={onBack}
            onNext={handleNext}
            canGoNext={totalYearlyIncome > 0}
            showBack={true} // Changed from false to true since we now have a Welcome step before this
          />
        </div>
      </div>
    </div>
  );
};


export default IncomeStep;
