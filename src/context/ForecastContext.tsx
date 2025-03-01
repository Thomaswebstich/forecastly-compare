
import React, { createContext, useContext, useState, ReactNode } from "react";
import { 
  FilterState, 
  TimeView, 
  ForecastData,
  Version,
  ChartData,
  Currency
} from "@/types";
import { 
  filterForecastData, 
  versions, 
  getMonthName,
  groupByQuarter,
  groupByYear,
  calculateValue
} from "@/lib/data";

interface ForecastContextType {
  filters: FilterState;
  timeView: TimeView;
  filteredData: ForecastData[];
  chartData: ChartData[];
  versions: Version[];
  compareMode: boolean;
  compareVersionId: string | null;
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
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  
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
      return groupByYear(filteredData, filters.displayCurrency);
    }
  };
  
  const chartData = generateChartData();
  
  // Update filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Update forecast data
  const updateForecastData = (updatedItem: ForecastData) => {
    setForecastData(prev => {
      const existingIndex = prev.findIndex(item => item.id === updatedItem.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = updatedItem;
        return updated;
      }
      return [...prev, updatedItem];
    });
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
