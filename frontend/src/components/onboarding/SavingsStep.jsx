import React, { useState } from 'react';
import { Calculator, ArrowRight, ArrowLeft, TrendingUp } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import ProgressBar from '../shared/ProgressBar';
import { Page, Card, Heading, Description, PrimaryButton, SecondaryButton } from '../styled/StyledComponents';

// Compound Chart Component (kept exactly the same)
const CompoundChart = ({ monthlySavings, returnRate, isDarkMode, savingsRate }) => {
  const [hoverData, setHoverData] = useState({ show: false, year: 25, x: 0, y: 0 });

  const calculateData = (year) => {
    const months = year * 12;
    const monthlyRate = returnRate / 100 / 12;
    const principal = monthlySavings * months;
    
    if (monthlyRate === 0) {
      const total = principal;
      const interest = 0;
      return { principal, total, interest };
    }
    
    const total = months === 0 ? 0 : monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    const interest = total - principal;
    return { principal, total, interest };
  };

  const displayYear = hoverData.show ? hoverData.year : hoverData.year;
  const displayData = calculateData(displayYear);

  return (
    <div>
      <div className="flex items-center mb-4">
        <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Your Money Over Time
        </h3>
      </div>
      
      <div className="flex gap-4">
        <div className={`flex-1 p-4 rounded-lg border transition-colors ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-700/30' 
            : 'border-gray-200 bg-white'
        }`}>
          <svg 
            width="100%" 
            height="200" 
            viewBox="0 0 400 200" 
            className="overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const chartWidth = 400 - 80;
              const padding = 40;
              const relativeX = (x - padding) / chartWidth;
              const year = Math.max(0, Math.min(25, Math.round(relativeX * 25)));
              setHoverData({ year, show: true, x: x, y: y });
            }}
            onMouseLeave={() => setHoverData(prev => ({ ...prev, show: false }))}
          >
            {(() => {
              const years = Array.from({length: 26}, (_, i) => i);
              const data = years.map(year => calculateData(year));
              
              const maxTotal = Math.max(...data.map(d => d.total));
              const padding = 40;
              const chartWidth = 400 - 2 * padding;
              const chartHeight = 200 - 2 * padding;
              
              const interestPath = data.map((d, i) => {
                const x = padding + (i / 25) * chartWidth;
                const y = padding + chartHeight - (d.total / maxTotal) * chartHeight;
                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              }).join(' ') + ` L ${padding + chartWidth} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;
              
              const principalPath = data.map((d, i) => {
                const x = padding + (i / 25) * chartWidth;
                const y = padding + chartHeight - (d.principal / maxTotal) * chartHeight;
                return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
              }).join(' ') + ` L ${padding + chartWidth} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;
              
              return (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                    <line
                      key={ratio}
                      x1={padding}
                      y1={padding + chartHeight * (1 - ratio)}
                      x2={padding + chartWidth}
                      y2={padding + chartHeight * (1 - ratio)}
                      stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                      strokeWidth="1"
                    />
                  ))}
                  
                  <path
                    d={interestPath}
                    fill="url(#interestGradient)"
                    opacity="0.7"
                  />
                  
                  <path
                    d={principalPath}
                    fill="url(#principalGradient)"
                    opacity="0.8"
                  />
                  
                  {savingsRate > 0 && returnRate > 0 && (() => {
                    const bubbleDisplayYear = hoverData.year;
                    const bubbleDisplayData = calculateData(bubbleDisplayYear);
                    const x = padding + (bubbleDisplayYear / 25) * chartWidth;
                    const y = padding + chartHeight - (bubbleDisplayData.total / maxTotal) * chartHeight;
                    
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill="#3b82f6"
                        opacity="1"
                      />
                    );
                  })()}
                  
                  {[0, 5, 10, 15, 20, 25].map(year => (
                    <text
                      key={year}
                      x={padding + (year / 25) * chartWidth}
                      y={padding + chartHeight + 20}
                      textAnchor="middle"
                      className={`text-xs ${isDarkMode ? 'fill-gray-400' : 'fill-gray-600'}`}
                    >
                      {year}y
                    </text>
                  ))}
                  
                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                    const value = maxTotal * ratio;
                    return (
                      <text
                        key={ratio}
                        x={padding - 10}
                        y={padding + chartHeight * (1 - ratio) + 4}
                        textAnchor="end"
                        className={`text-xs ${isDarkMode ? 'fill-gray-400' : 'fill-gray-600'}`}
                      >
                        ${value >= 100000000 ? `${(value/1000000000).toFixed(1)}B` : value > 1000000 ? `${(value/1000000).toFixed(1)}M` : `${(value/1000).toFixed(0)}k`}
                      </text>
                    );
                  })}
                  
                  <defs>
                    <linearGradient id="principalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="interestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                </>
              );
            })()}
          </svg>
          
          <div className="flex items-center justify-center space-x-6 mt-3">
            <div className="flex items-center">
              <div className="w-4 h-3 bg-blue-600 rounded-sm mr-2" style={{opacity: 0.8}}></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Principal</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-3 bg-green-500 rounded-sm mr-2 opacity-70"></div>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Interest</span>
            </div>
          </div>
        </div>
        
        <div className={`w-48 p-4 rounded-lg border transition-colors ${
          isDarkMode 
            ? 'border-gray-600 bg-gray-700/30' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="text-center mb-4">
            <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {hoverData.show ? `Year ${displayYear}` : `Year ${displayYear}`}
            </h4>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-2 bg-blue-600 rounded-sm mr-2" style={{opacity: 0.8}}></div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Principal</span>
              </div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {displayData.principal >= 100000000 
                  ? `${(displayData.principal/1000000000).toFixed(4)}B`
                  : displayData.principal >= 10000000 
                  ? `${(displayData.principal/1000000).toFixed(4)}M`
                  : `${Math.round(displayData.principal).toLocaleString()}`}
              </p>
            </div>
            
            <div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-2 bg-green-500 rounded-sm mr-2 opacity-70"></div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Interest</span>
              </div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {displayData.interest >= 100000000 
                  ? `${(displayData.interest/1000000000).toFixed(4)}B`
                  : displayData.interest >= 10000000 
                  ? `${(displayData.interest/1000000).toFixed(4)}M`
                  : `${Math.round(displayData.interest).toLocaleString()}`}
              </p>
            </div>
            
            <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <div className="flex items-center mb-1">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total</span>
              </div>
              <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {displayData.total >= 100000000 
                  ? `${(displayData.total/1000000000).toFixed(4)}B`
                  : displayData.total >= 10000000 
                  ? `${(displayData.total/1000000).toFixed(4)}M`
                  : `${Math.round(displayData.total).toLocaleString()}`}
              </p>
              <div className={`mt-2 p-2 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <p className={`text-sm font-bold text-center whitespace-nowrap overflow-hidden ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  🚀 {displayData.principal > 0 ? Math.round(displayData.interest / displayData.principal * 100) : 0}% Growth
                </p>
                <p className={`text-xs text-center mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {displayYear === 0 ? 'Start of your journey' : `After ${displayYear} year${displayYear !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getReturnRateDescription = (rate) => {
  if (rate === 0) return "💤 Cash under mattress";
  if (rate <= 2) return "🏦 High-yield savings";
  if (rate <= 4) return "📈 Bonds & CDs";
  if (rate <= 7) return "📊 Conservative stocks";
  if (rate <= 10) return "🎯 S&P 500 average";
  if (rate <= 19) return "🚀 Growth stocks";
  if (rate <= 40) return "High Risk - High Reward";
  return "🌙 To the moon!";
};

const SavingsStep = ({ onNext, onBack, incomeData }) => {
  const { isDarkMode, currentTheme } = useTheme();
  const [formData, setFormData] = useState({
    savingsRate: 40,
    returnRate: 7
  });

  const totalIncome = incomeData?.totalYearlyIncome || 90000;
  const monthlySavings = (totalIncome * formData.savingsRate / 100) / 12;

  const handleNext = () => {
    if (onNext) {
      onNext({
        savingsRate: formData.savingsRate,
        returnRate: formData.returnRate,
        monthlySavings,
        yearlySavings: totalIncome * formData.savingsRate / 100
      });
    }
  };

  return (
    <Page>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto p-6">
        <ProgressBar currentStep={2} />
        
        <div className="text-center mb-8">
          <Heading level={1}>The Power of Compound Growth</Heading>
          <Description>See how your savings can grow over time</Description>
        </div>

        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Calculator className={`w-6 h-6 mr-3 text-${currentTheme.primary}-500`} />
                <Heading level={2}>Savings Settings</Heading>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Savings Rate: {formData.savingsRate}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.savingsRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, savingsRate: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className={`flex justify-between text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>0%</span>
                    <span className="font-medium">
                      {(() => {
                        const rate = formData.savingsRate;
                        if (rate < 5) return "😴 Never retiring";
                        if (rate <= 20) return "📊 Normal saver";
                        if (rate <= 40) return "💪 Financial discipline FTW!";
                        if (rate <= 60) return "🔥 FIRE";
                        if (rate <= 80) return "🔥🔥 FIRE master";
                        return "🔥🔥🔥 FIRE legend";
                      })()}
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expected Annual Return: {formData.returnRate}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={formData.returnRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, returnRate: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className={`flex justify-between text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span>0%</span>
                    <span className="font-medium">
                      {getReturnRateDescription(formData.returnRate)}
                    </span>
                    <span>50%</span>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? currentTheme.accentDark
                    : currentTheme.accentLight
                }`}>
                  <p className={`text-lg font-semibold text-${currentTheme.primary}-${isDarkMode ? '400' : '800'}`}>
                    Monthly Savings: ${monthlySavings.toLocaleString()}
                  </p>
                  <p className={`text-sm mt-1 text-${currentTheme.primary}-${isDarkMode ? '300' : '600'}`}>
                    ${(totalIncome * formData.savingsRate / 100).toLocaleString()} per year
                  </p>
                </div>
              </div>
            </div>

            <div>
              <CompoundChart 
                monthlySavings={monthlySavings}
                returnRate={formData.returnRate}
                isDarkMode={isDarkMode}
                savingsRate={formData.savingsRate}
              />
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <SecondaryButton onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </SecondaryButton>
            <PrimaryButton onClick={handleNext}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </PrimaryButton>
          </div>
        </Card>
      </div>
    </Page>
  );
};

export default SavingsStep;
