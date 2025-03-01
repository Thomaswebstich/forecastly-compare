
import React, { createContext, useContext, useState, ReactNode } from "react";
import { 
  FilterState, 
  TimeView, 
  ForecastData,
  Version,
  ChartData,
  Currency,
  SKUOverviewData
} from "@/types";
import { 
  filterForecastData, 
  versions, 
  getMonthName,
  groupByQuarter,
  groupByYear,
  calculateValue,
  skus,
  categories,
  customers,
  forecastData
} from "@/lib/data";

interface ForecastContextType {
  filters: FilterState;
  timeView: TimeView;
  filteredData: ForecastData[];
  chartData: ChartData[];
  versions: Version[];
  compareMode: boolean;
  compareVersionId: string | null;
  skuOverviewData: SKUOverviewData[];
  updateFilters: (newFilters: Partial<FilterState>) => void;
  setTimeView: (view: TimeView) => void;
  updateForecastData: (updatedItem: ForecastData) => void;
  toggleCompareMode: () => void;
  setCompareVersionId: (versionId: string | null) => void;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    customerId: null,
    year: 2024,
    versionId: versions[versions.length - 1].id,
    displayCurrency: 'USD'
  });
  
  const [timeView, setTimeView] = useState<TimeView>("monthly");
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [forecastDataState, setForecastDataState] = useState<ForecastData[]>([]);
  
  // Get filtered data
  const filteredData = filterForecastData(
    filters.categoryId,
    filters.customerId,
    filters.year,
    filters.versionId
  );
  
  // Generate chart data based on time view
  const generateChartData = (): ChartData[] => {
    if (!filteredData.length) return [];
    
    if (timeView === "monthly") {
      // Group by month and sort chronologically
      const monthlyData = new Map<number, { forecast: number, actual: number | null }>();
      
      filteredData.forEach(item => {
        if (!monthlyData.has(item.month)) {
          monthlyData.set(item.month, { forecast: 0, actual: null });
        }
        
        const entry = monthlyData.get(item.month)!;
        const forecastValue = calculateValue(item.forecastQty, item.skuId, filters.displayCurrency);
        entry.forecast += forecastValue;
        
        if (item.actualQty !== null) {
          const actualValue = calculateValue(item.actualQty, item.skuId, filters.displayCurrency);
          entry.actual = (entry.actual === null ? actualValue : entry.actual + actualValue);
        }
      });
      
      return Array.from(monthlyData.entries())
        .sort(([monthA], [monthB]) => monthA - monthB)
        .map(([month, values]) => ({
          label: getMonthName(month),
          forecast: values.forecast,
          actual: values.actual
        }));
    } else if (timeView === "quarterly") {
      return groupByQuarter(filteredData, filters.displayCurrency);
    } else {
      // In yearly view, show multiple years side-by-side if data is available
      // Instead of just one year, we'll collect data for multiple years
      // Find all available years in the forecast data
      const availableYears = new Set<number>();
      forecastData.forEach(item => {
        availableYears.add(item.year);
      });
      
      const yearlyData: ChartData[] = [];
      
      // Sort years chronologically
      const sortedYears = Array.from(availableYears).sort();
      
      // For each year, calculate totals
      sortedYears.forEach(year => {
        const yearData = forecastData.filter(
          item => item.year === year && 
          item.versionId === filters.versionId &&
          (filters.categoryId === null || 
            skus.some(sku => sku.id === item.skuId && sku.categoryId === filters.categoryId)) &&
          (filters.customerId === null || 
            skus.some(sku => sku.id === item.skuId && sku.customerId === filters.customerId))
        );
        
        if (yearData.length === 0) return;
        
        let totalForecast = 0;
        let totalActual = 0;
        let hasActual = false;
        
        yearData.forEach(item => {
          totalForecast += calculateValue(item.forecastQty, item.skuId, filters.displayCurrency);
          
          if (item.actualQty !== null) {
            totalActual += calculateValue(item.actualQty, item.skuId, filters.displayCurrency);
            hasActual = true;
          }
        });
        
        yearlyData.push({
          label: year.toString(),
          forecast: totalForecast,
          actual: hasActual ? totalActual : null
        });
      });
      
      return yearlyData;
    }
  };
  
  const chartData = generateChartData();
  
  // Generate SKU overview data
  const generateSKUOverviewData = (): SKUOverviewData[] => {
    // Get all forecast data for the current version
    const allData = forecastData.filter(item => 
      item.versionId === filters.versionId && 
      item.year === filters.year
    );
    
    // Group by SKU
    const skuGroups = new Map<string, { 
      forecastTotal: number; 
      actualTotal: number | null; 
      hasActuals: boolean;
    }>();
    
    allData.forEach(item => {
      if (!skuGroups.has(item.skuId)) {
        skuGroups.set(item.skuId, { 
          forecastTotal: 0, 
          actualTotal: 0, 
          hasActuals: false 
        });
      }
      
      const group = skuGroups.get(item.skuId)!;
      const forecastValue = calculateValue(item.forecastQty, item.skuId, filters.displayCurrency);
      group.forecastTotal += forecastValue;
      
      if (item.actualQty !== null) {
        const actualValue = calculateValue(item.actualQty, item.skuId, filters.displayCurrency);
        group.actualTotal += actualValue;
        group.hasActuals = true;
      }
    });
    
    // Transform to final format
    return Array.from(skuGroups.entries())
      .map(([skuId, data]) => {
        const sku = skus.find(s => s.id === skuId);
        if (!sku) return null;
        
        const category = categories.find(c => c.id === sku.categoryId);
        const customer = customers.find(c => c.id === sku.customerId);
        
        return {
          skuId,
          name: sku.name,
          category: category?.name || "Unknown",
          customer: customer?.name || "Unknown",
          forecastTotal: data.forecastTotal,
          actualTotal: data.hasActuals ? data.actualTotal : null,
          variance: data.hasActuals && data.forecastTotal > 0
            ? ((data.actualTotal! - data.forecastTotal) / data.forecastTotal) * 100
            : null
        };
      })
      .filter(item => item !== null) as SKUOverviewData[];
  };
  
  const skuOverviewData = generateSKUOverviewData();
  
  // Update filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Update forecast data
  const updateForecastData = (updatedItem: ForecastData) => {
    setForecastDataState(prev => {
      const existingIndex = prev.findIndex(item => item.id === updatedItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedItem;
        return updated;
      }
      return [...prev, updatedItem];
    });
    
    // Also update the main forecast data array
    const existingIndex = forecastData.findIndex(item => item.id === updatedItem.id);
    if (existingIndex >= 0) {
      forecastData[existingIndex] = updatedItem;
    } else {
      forecastData.push(updatedItem);
    }
  };
  
  // Toggle compare mode
  const toggleCompareMode = () => {
    setCompareMode(prev => !prev);
    if (!compareMode) {
      // When enabling compare mode, default to comparing with previous version
      const currentVersionIndex = versions.findIndex(v => v.id === filters.versionId);
      if (currentVersionIndex > 0) {
        setCompareVersionId(versions[currentVersionIndex - 1].id);
      } else {
        setCompareVersionId(null);
      }
    } else {
      setCompareVersionId(null);
    }
  };
  
  return (
    <ForecastContext.Provider
      value={{
        filters,
        timeView,
        filteredData,
        chartData,
        versions,
        compareMode,
        compareVersionId,
        skuOverviewData,
        updateFilters,
        setTimeView,
        updateForecastData,
        toggleCompareMode,
        setCompareVersionId
      }}
    >
      {children}
    </ForecastContext.Provider>
  );
};

export const useForecast = () => {
  const context = useContext(ForecastContext);
  if (context === undefined) {
    throw new Error("useForecast must be used within a ForecastProvider");
  }
  return context;
};
