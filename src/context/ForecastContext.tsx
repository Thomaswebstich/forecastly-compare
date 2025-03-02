
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { 
  FilterState, 
  TimeView, 
  ForecastData,
  Version,
  ChartData,
  Currency,
  SKUOverviewData,
  Category,
  Customer,
  SKU
} from "@/types";
import { 
  fetchCategories,
  fetchCustomers,
  fetchSKUs,
  fetchVersions,
  fetchForecastData,
  filterForecastData as filterForecastDataService,
  updateForecastData as updateForecastDataService,
  getMonthName,
  groupByQuarter,
  groupByYear,
  calculateValue,
  formatCurrency
} from "@/lib/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface ForecastContextType {
  filters: FilterState;
  timeView: TimeView;
  categories: Category[];
  customers: Customer[];
  skus: SKU[];
  filteredData: ForecastData[];
  chartData: ChartData[];
  versions: Version[];
  compareMode: boolean;
  compareVersionId: string | null;
  skuOverviewData: SKUOverviewData[];
  loading: boolean;
  updateFilters: (newFilters: Partial<FilterState>) => void;
  setTimeView: (view: TimeView) => void;
  updateForecastData: (updatedItem: ForecastData) => void;
  toggleCompareMode: () => void;
  setCompareVersionId: (versionId: string | null) => void;
  refreshData: () => Promise<void>;
}

const ForecastContext = createContext<ForecastContextType | undefined>(undefined);

export const ForecastProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [allForecastData, setAllForecastData] = useState<ForecastData[]>([]);
  const [filteredData, setFilteredData] = useState<ForecastData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [skuOverviewData, setSkuOverviewData] = useState<SKUOverviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    customerId: null,
    year: 2024,
    versionId: '',
    displayCurrency: 'USD'
  });
  
  const [timeView, setTimeView] = useState<TimeView>("monthly");
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  
  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load categories, customers, SKUs, and versions
        const [categoriesData, customersData, skusData, versionsData] = await Promise.all([
          fetchCategories(),
          fetchCustomers(),
          fetchSKUs(),
          fetchVersions()
        ]);
        
        setCategories(categoriesData);
        setCustomers(customersData);
        setSkus(skusData);
        setVersions(versionsData);
        
        // Set initial version if available
        if (versionsData.length > 0) {
          setFilters(prev => ({
            ...prev,
            versionId: versionsData[versionsData.length - 1].id
          }));
        }
        
        // Load forecast data
        const forecastData = await fetchForecastData();
        setAllForecastData(forecastData);
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load initial data. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [toast]);
  
  // Load filtered data when filters change
  useEffect(() => {
    const loadFilteredData = async () => {
      if (!filters.versionId) return;
      
      try {
        setLoading(true);
        const filtered = await filterForecastDataService(
          filters.categoryId,
          filters.customerId,
          filters.year,
          filters.versionId
        );
        setFilteredData(filtered);
      } catch (error) {
        console.error('Error loading filtered data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFilteredData();
  }, [filters]);
  
  // Generate chart data based on filtered data and time view
  useEffect(() => {
    const generateChartData = async () => {
      if (!filteredData.length) {
        setChartData([]);
        return;
      }
      
      try {
        if (timeView === "monthly") {
          // Group by month and sort chronologically
          const monthlyData = new Map<number, { forecast: number, actual: number | null }>();
          
          for (const item of filteredData) {
            if (!monthlyData.has(item.month)) {
              monthlyData.set(item.month, { forecast: 0, actual: null });
            }
            
            const entry = monthlyData.get(item.month)!;
            const forecastValue = await calculateValue(item.forecastQty, item.skuId, filters.displayCurrency);
            entry.forecast += forecastValue;
            
            if (item.actualQty !== null) {
              const actualValue = await calculateValue(item.actualQty, item.skuId, filters.displayCurrency);
              entry.actual = (entry.actual === null ? actualValue : entry.actual + actualValue);
            }
          }
          
          const chartData = Array.from(monthlyData.entries())
            .sort(([monthA], [monthB]) => monthA - monthB)
            .map(([month, values]) => ({
              label: getMonthName(month),
              forecast: values.forecast,
              actual: values.actual
            }));
          
          setChartData(chartData);
        } else if (timeView === "quarterly") {
          const quarterlyData = await groupByQuarter(filteredData, filters.displayCurrency);
          setChartData(quarterlyData);
        } else {
          // In yearly view, show multiple years side-by-side if data is available
          // Instead of just one year, we'll collect data for multiple years
          // Find all available years in the forecast data
          const availableYears = new Set<number>();
          allForecastData.forEach(item => {
            availableYears.add(item.year);
          });
          
          const yearlyData: ChartData[] = [];
          
          // Sort years chronologically
          const sortedYears = Array.from(availableYears).sort();
          
          // For each year, calculate totals
          for (const year of sortedYears) {
            const yearData = allForecastData.filter(
              item => item.year === year && 
              item.versionId === filters.versionId &&
              (filters.categoryId === null || 
                skus.some(sku => sku.id === item.skuId && sku.categoryId === filters.categoryId)) &&
              (filters.customerId === null || 
                skus.some(sku => sku.id === item.skuId && sku.customerId === filters.customerId))
            );
            
            if (yearData.length === 0) continue;
            
            let totalForecast = 0;
            let totalActual = 0;
            let hasActual = false;
            
            for (const item of yearData) {
              totalForecast += await calculateValue(item.forecastQty, item.skuId, filters.displayCurrency);
              
              if (item.actualQty !== null) {
                totalActual += await calculateValue(item.actualQty, item.skuId, filters.displayCurrency);
                hasActual = true;
              }
            }
            
            yearlyData.push({
              label: year.toString(),
              forecast: totalForecast,
              actual: hasActual ? totalActual : null
            });
          }
          
          setChartData(yearlyData);
        }
      } catch (error) {
        console.error('Error generating chart data:', error);
        setChartData([]);
      }
    };
    
    generateChartData();
  }, [filteredData, timeView, filters.displayCurrency, allForecastData, skus, filters.categoryId, filters.customerId, filters.versionId]);
  
  // Generate SKU overview data
  useEffect(() => {
    const generateSKUOverviewData = async () => {
      // Get all forecast data for the current version
      const allData = allForecastData.filter(item => 
        item.versionId === filters.versionId && 
        item.year === filters.year
      );
      
      if (allData.length === 0) {
        setSkuOverviewData([]);
        return;
      }
      
      try {
        // Group by SKU
        const skuGroups = new Map<string, { 
          forecastTotal: number; 
          actualTotal: number | null; 
          hasActuals: boolean;
        }>();
        
        for (const item of allData) {
          if (!skuGroups.has(item.skuId)) {
            skuGroups.set(item.skuId, { 
              forecastTotal: 0, 
              actualTotal: 0, 
              hasActuals: false 
            });
          }
          
          const group = skuGroups.get(item.skuId)!;
          const forecastValue = await calculateValue(item.forecastQty, item.skuId, filters.displayCurrency);
          group.forecastTotal += forecastValue;
          
          if (item.actualQty !== null) {
            const actualValue = await calculateValue(item.actualQty, item.skuId, filters.displayCurrency);
            group.actualTotal += actualValue;
            group.hasActuals = true;
          }
        }
        
        // Transform to final format
        const overviewData: SKUOverviewData[] = [];
        
        for (const [skuId, data] of skuGroups.entries()) {
          const sku = skus.find(s => s.id === skuId);
          if (!sku) continue;
          
          const category = categories.find(c => c.id === sku.categoryId);
          const customer = customers.find(c => c.id === sku.customerId);
          
          overviewData.push({
            skuId,
            name: sku.name,
            category: category?.name || "Unknown",
            customer: customer?.name || "Unknown",
            forecastTotal: data.forecastTotal,
            actualTotal: data.hasActuals ? data.actualTotal : null,
            variance: data.hasActuals && data.forecastTotal > 0
              ? ((data.actualTotal! - data.forecastTotal) / data.forecastTotal) * 100
              : null
          });
        }
        
        setSkuOverviewData(overviewData);
      } catch (error) {
        console.error('Error generating SKU overview data:', error);
        setSkuOverviewData([]);
      }
    };
    
    generateSKUOverviewData();
  }, [allForecastData, filters.versionId, filters.year, filters.displayCurrency, skus, categories, customers]);
  
  // Update filters
  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Update forecast data
  const updateForecastData = async (updatedItem: ForecastData) => {
    try {
      const success = await updateForecastDataService(updatedItem);
      
      if (success) {
        // Update local state
        setAllForecastData(prev => {
          const existingIndex = prev.findIndex(item => item.id === updatedItem.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = updatedItem;
            return updated;
          }
          return [...prev, updatedItem];
        });
        
        setFilteredData(prev => {
          const existingIndex = prev.findIndex(item => item.id === updatedItem.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = updatedItem;
            return updated;
          }
          return prev;
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update forecast data.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating forecast data:', error);
      toast({
        title: 'Error',
        description: 'Failed to update forecast data.',
        variant: 'destructive'
      });
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
  
  // Refresh all data
  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Load categories, customers, SKUs, and versions
      const [categoriesData, customersData, skusData, versionsData, forecastData] = await Promise.all([
        fetchCategories(),
        fetchCustomers(),
        fetchSKUs(),
        fetchVersions(),
        fetchForecastData()
      ]);
      
      setCategories(categoriesData);
      setCustomers(customersData);
      setSkus(skusData);
      setVersions(versionsData);
      setAllForecastData(forecastData);
      
      // Re-fetch filtered data
      const filtered = await filterForecastDataService(
        filters.categoryId,
        filters.customerId,
        filters.year,
        filters.versionId
      );
      setFilteredData(filtered);
      
      toast({
        title: 'Success',
        description: 'Data refreshed successfully.',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ForecastContext.Provider
      value={{
        filters,
        timeView,
        categories,
        customers,
        skus,
        filteredData,
        chartData,
        versions,
        compareMode,
        compareVersionId,
        skuOverviewData,
        loading,
        updateFilters,
        setTimeView,
        updateForecastData,
        toggleCompareMode,
        setCompareVersionId,
        refreshData
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
