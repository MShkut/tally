// frontend/src/components/overview/networth/OverviewTab.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from 'contexts/ThemeContext';
import { dataManager } from 'utils/dataManager';
import { finnhub } from 'utils/finnhubService';
import { refreshAllPrices } from 'utils/netWorthCalculations';
import {
  generateFiatTotalChartData,
  generateBTCEquivalentChartData,
  generateBTCHoldingsChartData,
  getDefaultDateRange
} from 'utils/chartDataGenerator';
import { AssetSummary } from './AssetSummary';
import { LiabilitySummary } from './LiabilitySummary';
import { NetWorthChart } from './NetWorthChart';
import { ChartSelector } from './ChartSelector';
import { DateRangePicker } from './DateRangePicker';

export const OverviewTab = () => {
  const { isDarkMode } = useTheme();
  const [netWorthItems, setNetWorthItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Chart configuration state
  const [chartConfig, setChartConfig] = useState({
    leftChart: 'fiat-total',
    rightChart: 'btc-holdings',
    dateRange: { startDate: null, endDate: null }
  });

  useEffect(() => {
    const loadData = () => {
      const items = dataManager.loadNetWorthItems();
      setNetWorthItems(items);

      // Check if API key is configured
      const apiKeyConfigured = finnhub.hasApiKey();
      setHasApiKey(apiKeyConfigured);

      // Load saved chart configuration
      const savedConfig = dataManager.loadNetWorthChartConfig();
      setChartConfig(savedConfig);
    };

    loadData();
  }, []);

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    setRefreshStatus('Refreshing prices...');

    try {
      // Refresh prices for all auto-update items
      const results = await refreshAllPrices(netWorthItems, (ticker, current, total) => {
        setRefreshStatus(`Updating ${ticker} (${current}/${total})...`);
      });

      // Update items in dataManager
      if (results.updatedItems.length > 0) {
        // Create a map of updated items
        const updatedMap = {};
        results.updatedItems.forEach(item => {
          updatedMap[item.id] = item;
        });

        // Merge updated items with existing items
        const allItems = netWorthItems.map(item =>
          updatedMap[item.id] ? updatedMap[item.id] : item
        );

        // Save to dataManager
        await dataManager.saveNetWorthItems(allItems);

        // Update UI
        setNetWorthItems(allItems);
      }

      // Show results
      if (results.errors.length > 0) {
        setRefreshStatus(
          `Updated ${results.updatedItems.length} items. ${results.errors.length} errors. Check console for details.`
        );
      } else {
        setRefreshStatus(`Successfully updated ${results.updatedItems.length} items!`);
      }

      // Clear status after 5 seconds
      setTimeout(() => {
        setRefreshStatus('');
      }, 5000);
    } catch (error) {
      console.error('Failed to refresh prices:', error);
      setRefreshStatus(`Error: ${error.message}`);

      setTimeout(() => {
        setRefreshStatus('');
      }, 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle chart selection changes
  const handleLeftChartChange = (chartType) => {
    const newConfig = { ...chartConfig, leftChart: chartType };
    setChartConfig(newConfig);
    dataManager.saveNetWorthChartConfig(newConfig);
  };

  const handleRightChartChange = (chartType) => {
    const newConfig = { ...chartConfig, rightChart: chartType };
    setChartConfig(newConfig);
    dataManager.saveNetWorthChartConfig(newConfig);
  };

  const handleDateRangeChange = (dateRange) => {
    const newConfig = { ...chartConfig, dateRange };
    setChartConfig(newConfig);
    dataManager.saveNetWorthChartConfig(newConfig);
  };

  // Generate chart data based on configuration
  const getChartData = (chartType) => {
    const { startDate, endDate } = chartConfig.dateRange;

    // Get date range (default to all time if not specified)
    const defaultRange = getDefaultDateRange(netWorthItems);
    const start = startDate ? new Date(startDate) : defaultRange.startDate;
    const end = endDate ? new Date(endDate) : defaultRange.endDate;

    switch (chartType) {
      case 'fiat-total':
        return generateFiatTotalChartData(netWorthItems, start, end);
      case 'btc-equivalent':
        return generateBTCEquivalentChartData(netWorthItems, start, end);
      case 'btc-holdings':
        return generateBTCHoldingsChartData(netWorthItems, start, end);
      default:
        return [];
    }
  };

  const leftChartData = getChartData(chartConfig.leftChart);
  const rightChartData = getChartData(chartConfig.rightChart);

  // Get earliest date for date range picker
  const defaultRange = getDefaultDateRange(netWorthItems);
  const earliestDate = defaultRange.startDate;

  return (
    <div className="space-y-16 transition-all duration-200">
      {!hasApiKey && (
        <div className={`p-4 rounded-lg border-l-4 ${
          isDarkMode
            ? 'bg-yellow-900/20 border-yellow-600 text-yellow-400'
            : 'bg-yellow-100 border-yellow-500 text-yellow-800'
        }`}>
          <p className="font-light">
            Finnhub API key not configured. Automatic price updates are disabled.
            Get a free API key at finnhub.io and add it in Settings.
          </p>
        </div>
      )}

      {/* Chart Configuration */}
      <div className="space-y-6">
        <DateRangePicker
          startDate={chartConfig.dateRange.startDate}
          endDate={chartConfig.dateRange.endDate}
          onChange={handleDateRangeChange}
          earliestDate={earliestDate}
        />

        {/* Two Charts Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Chart */}
          <div className="space-y-4">
            <ChartSelector
              value={chartConfig.leftChart}
              onChange={handleLeftChartChange}
              position="left"
            />
            <NetWorthChart
              data={leftChartData}
              chartType={chartConfig.leftChart}
            />
          </div>

          {/* Right Chart */}
          <div className="space-y-4">
            <ChartSelector
              value={chartConfig.rightChart}
              onChange={handleRightChartChange}
              position="right"
            />
            <NetWorthChart
              data={rightChartData}
              chartType={chartConfig.rightChart}
            />
          </div>
        </div>
      </div>

      {/* Assets and Liabilities Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Assets Section (Left) */}
        <AssetSummary
          items={netWorthItems}
          onRefresh={hasApiKey ? handleRefreshPrices : null}
          isRefreshing={isRefreshing}
          refreshStatus={refreshStatus}
        />

        {/* Liabilities Section (Right) */}
        <LiabilitySummary items={netWorthItems} />
      </div>
    </div>
  );
};
