// frontend/src/components/dashboard/NetWorthDashboard.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
import { BurgerMenu } from 'components/dashboard/BurgerMenu';
import { 
  FormSection,
  SummaryCard,
  SectionBorder,
  EmptyState,
  StandardInput,
  ConfirmationModal
} from 'components/shared/FormComponents';

export const NetWorthDashboard = ({ onNavigate }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [netWorthData, setNetWorthData] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [chartView, setChartView] = useState('all-time'); // 'all-time', 'this-period', 'by-month'
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', value: '' });

  useEffect(() => {
    loadNetWorthData();
  }, []);

  const loadNetWorthData = () => {
    const data = dataManager.loadNetWorthData();
    setNetWorthData(data);
  };

  const handleMenuAction = (actionId) => {
    setMenuOpen(false);
    
    switch (actionId) {
      case 'dashboard':
        onNavigate('dashboard');
        break;
      case 'networth':
        break; // Already here
      case 'import':
        onNavigate('import');
        break;
      case 'gifts':
        onNavigate('gifts');
        break;
      case 'edit-income':
        onNavigate('edit-income');
        break;
      case 'edit-savings':
        onNavigate('edit-savings');
        break;
      case 'edit-expenses':
        onNavigate('edit-expenses');
        break;
      case 'plan-next-period':
        onNavigate('plan-next-period');
        break;
      case 'export':
        const exportData = dataManager.exportData();
        console.log('Export data:', exportData);
        break;
      case 'reset-data':
        dataManager.resetAllData();
        onNavigate('onboarding');
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };

  const handleAddItem = (type) => {
    if (!newItem.name || !newItem.value) return;
    
    const value = parseFloat(newItem.value);
    if (isNaN(value)) return;

    const item = {
      id: `${type}-${Date.now()}`,
      name: newItem.name,
      type: type,
      currentValue: value,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      history: [{
        date: new Date().toISOString(),
        value: value,
        source: 'manual',
        note: 'Initial value'
      }]
    };

    dataManager.addNetWorthItem(item);
    loadNetWorthData();
    setNewItem({ name: '', value: '' });
    
    if (type === 'asset') {
      setShowAddAsset(false);
    } else {
      setShowAddLiability(false);
    }
  };

  const handleDeleteItem = (itemId) => {
    dataManager.deleteNetWorthItem(itemId);
    loadNetWorthData();
    setShowDeleteConfirm(null);
  };

  const handleUpdateValues = () => {
    setShowUpdateModal(true);
  };

  const handleSaveUpdates = (updates) => {
    Object.entries(updates).forEach(([itemId, newValue]) => {
      if (newValue !== null) {
        dataManager.updateNetWorthItemValue(itemId, newValue, 'Manual update');
      }
    });
    loadNetWorthData();
    setShowUpdateModal(false);
  };

  if (!netWorthData) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="text-xl font-light">Loading net worth data...</div>
      </div>
    );
  }

  const { assets, liabilities, totalAssets, totalLiabilities, netWorth, history } = netWorthData;

  return (
    <>
      <BurgerMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuAction}
        currentPage="networth"
      />
      
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        
        {/* Fixed Controls */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`
            fixed top-8 left-8 z-40 p-2 transition-colors duration-200
            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
          `}
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>

        <div className="fixed top-8 right-8 z-40">
          <button
            onClick={toggleTheme}
            className={`
              p-3 transition-colors focus:outline-none
              ${isDarkMode 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            <span className="text-xl">{isDarkMode ? '◐' : '◑'}</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-12">
          
          {/* Header Section */}
          <div className="mb-16 ml-16">
            <h1 className={`text-6xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Net Worth
            </h1>
            <p className={`text-2xl font-light ${
              netWorth >= 0 
                ? isDarkMode ? 'text-white' : 'text-black'
                : 'text-red-500'
            }`}>
              ${netWorth.toLocaleString()}
            </p>
          </div>

          {/* Summary Cards */}
          <FormSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <SummaryCard
                title="Total Assets"
                value={totalAssets}
                subtitle="What you own"
              />
              <SummaryCard
                title="Total Liabilities"
                value={totalLiabilities}
                subtitle="What you owe"
              />
              <SummaryCard
                title="Asset/Debt Ratio"
                value={totalLiabilities > 0 ? `${(totalAssets / totalLiabilities).toFixed(1)}x` : '∞'}
                subtitle={totalLiabilities > 0 ? 'Assets to debt' : 'No debt'}
                accent={true}
              />
            </div>
          </FormSection>

          {/* Update Values Button */}
          <div className="text-center my-8">
            <button
              onClick={handleUpdateValues}
              className={`
                text-lg font-light border-b-2 pb-2 transition-all
                ${isDarkMode
                  ? 'text-white border-white hover:border-gray-400'
                  : 'text-black border-black hover:border-gray-600'
                }
              `}
            >
              Update Values
            </button>
          </div>

          <SectionBorder />

          {/* Charts Section */}
          <FormSection title="Net Worth Trends">
            <ChartControls 
              view={chartView} 
              setView={setChartView}
              isDarkMode={isDarkMode}
            />
            <div className="mt-8">
              <NetWorthCharts 
                history={history}
                assets={assets}
                liabilities={liabilities}
                view={chartView}
                isDarkMode={isDarkMode}
              />
            </div>
          </FormSection>

          <SectionBorder />

          {/* Two Column Layout - Assets & Liabilities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Left Column - Assets */}
            <div>
              <FormSection title="Assets">
                {assets.length > 0 ? (
                  <div className="space-y-4">
                    {assets.map((asset) => (
                      <NetWorthItem 
                        key={asset.id} 
                        item={asset} 
                        type="asset"
                        onDelete={() => setShowDeleteConfirm(asset.id)}
                      />
                    ))}
                    <div className={`pt-4 border-t font-medium ${
                      isDarkMode ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between">
                        <span>Total Assets</span>
                        <span className="font-mono">${totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No assets recorded"
                    description="Add your first asset below"
                  />
                )}
                
                {/* Add Asset Form */}
                {showAddAsset ? (
                  <QuickAddForm
                    type="asset"
                    newItem={newItem}
                    setNewItem={setNewItem}
                    onAdd={() => handleAddItem('asset')}
                    onCancel={() => {
                      setShowAddAsset(false);
                      setNewItem({ name: '', value: '' });
                    }}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <button
                    onClick={() => setShowAddAsset(true)}
                    className={`
                      w-full mt-6 py-4 border-2 border-dashed transition-colors text-center
                      ${isDarkMode 
                        ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                      }
                    `}
                  >
                    <span className="text-lg font-light">Add Asset</span>
                  </button>
                )}
              </FormSection>
            </div>

            {/* Right Column - Liabilities */}
            <div>
              <FormSection title="Liabilities">
                {liabilities.length > 0 ? (
                  <div className="space-y-4">
                    {liabilities.map((liability) => (
                      <NetWorthItem 
                        key={liability.id} 
                        item={liability} 
                        type="liability"
                        onDelete={() => setShowDeleteConfirm(liability.id)}
                      />
                    ))}
                    <div className={`pt-4 border-t font-medium ${
                      isDarkMode ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                      <div className="flex justify-between">
                        <span>Total Liabilities</span>
                        <span className="font-mono text-red-500">${totalLiabilities.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No liabilities recorded"
                    description="Great! You have no debts"
                  />
                )}
                
                {/* Add Liability Form */}
                {showAddLiability ? (
                  <QuickAddForm
                    type="liability"
                    newItem={newItem}
                    setNewItem={setNewItem}
                    onAdd={() => handleAddItem('liability')}
                    onCancel={() => {
                      setShowAddLiability(false);
                      setNewItem({ name: '', value: '' });
                    }}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <button
                    onClick={() => setShowAddLiability(true)}
                    className={`
                      w-full mt-6 py-4 border-2 border-dashed transition-colors text-center
                      ${isDarkMode 
                        ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300' 
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                      }
                    `}
                  >
                    <span className="text-lg font-light">Add Liability</span>
                  </button>
                )}
              </FormSection>
            </div>
          </div>

          <div className="h-24"></div>
        </div>
      </div>

      {/* Update Values Modal */}
      {showUpdateModal && (
        <UpdateValuesModal
          assets={assets}
          liabilities={liabilities}
          onSave={handleSaveUpdates}
          onClose={() => setShowUpdateModal(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm !== null}
        title="Delete Item?"
        description="Are you sure you want to delete this item? All historical data will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => handleDeleteItem(showDeleteConfirm)}
        onCancel={() => setShowDeleteConfirm(null)}
        confirmDanger={true}
      />
    </>
  );
};

// Helper components
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);

const NetWorthItem = ({ item, type, onDelete }) => {
  const { isDarkMode } = useTheme();
  const amount = item.currentValue || 0;
  const lastUpdated = new Date(item.lastUpdated).toLocaleDateString();
  
  return (
    <div className={`flex items-center justify-between py-4 border-b ${
      isDarkMode ? 'border-gray-800' : 'border-gray-200'
    }`}>
      <div>
        <div className={`text-base font-light ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          {item.name}
        </div>
        <div className={`text-xs font-light mt-1 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Updated {lastUpdated}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className={`text-base font-mono ${
          type === 'asset' 
            ? isDarkMode ? 'text-white' : 'text-black'
            : 'text-red-500'
        }`}>
          ${amount.toLocaleString()}
        </div>
        <button
          onClick={onDelete}
          className="text-2xl font-light text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const QuickAddForm = ({ type, newItem, setNewItem, onAdd, onCancel, isDarkMode }) => {
  return (
    <div className={`mt-6 p-4 border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-300'
    }`}>
      <div className="space-y-4">
        <StandardInput
          label={`${type === 'asset' ? 'Asset' : 'Liability'} Name`}
          value={newItem.name}
          onChange={(value) => setNewItem({ ...newItem, name: value })}
          placeholder="e.g., Savings Account, Mortgage"
        />
        <StandardInput
          label="Current Value"
          type="currency"
          value={newItem.value}
          onChange={(value) => setNewItem({ ...newItem, value: value })}
          prefix="$"
          placeholder="0.00"
        />
        <div className="flex gap-4 justify-end">
          <button
            onClick={onCancel}
            className={`
              text-base font-light border-b border-transparent hover:border-current pb-1
              ${isDarkMode 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-600 hover:text-black'
              }
            `}
          >
            Cancel
          </button>
          <button
            onClick={onAdd}
            disabled={!newItem.name || !newItem.value}
            className={`
              text-base font-light border-b-2 pb-1 transition-all
              ${newItem.name && newItem.value
                ? isDarkMode
                  ? 'text-white border-white hover:border-gray-400'
                  : 'text-black border-black hover:border-gray-600'
                : 'text-gray-400 border-gray-400 cursor-not-allowed'
              }
            `}
          >
            Add {type === 'asset' ? 'Asset' : 'Liability'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChartControls = ({ view, setView, isDarkMode }) => {
  const views = [
    { id: 'all-time', label: 'All Time' },
    { id: 'this-period', label: 'This Period' },
    { id: 'by-month', label: 'By Month' }
  ];

  return (
    <div className="flex gap-6 justify-center">
      {views.map(v => (
        <button
          key={v.id}
          onClick={() => setView(v.id)}
          className={`
            text-sm font-light border-b-2 pb-1 transition-all
            ${view === v.id
              ? isDarkMode
                ? 'text-white border-white'
                : 'text-black border-black'
              : isDarkMode
                ? 'text-gray-500 border-transparent hover:text-gray-300'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }
          `}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
};

const NetWorthCharts = ({ history, assets, liabilities, view, isDarkMode }) => {
  // Placeholder for actual chart implementation
  // You would use Chart.js or a similar library here
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Growth Chart */}
      <div className={`p-8 border ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <h3 className={`text-lg font-light mb-6 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Net Worth Over Time
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          [Line chart showing net worth history]
        </div>
      </div>

      {/* Distribution Charts */}
      <div className={`p-8 border ${
        isDarkMode ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <h3 className={`text-lg font-light mb-6 ${
          isDarkMode ? 'text-white' : 'text-black'
        }`}>
          Asset & Liability Distribution
        </h3>
        <div className="h-64 flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full border-4 border-green-500 flex items-center justify-center">
              [Assets]
            </div>
            <p className="mt-2 text-sm">Assets</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-
