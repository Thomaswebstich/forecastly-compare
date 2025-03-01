
import { Category, Customer, ForecastData, SKU, Version } from "@/types";

// Sample categories
export const categories: Category[] = [
  { id: "cat1", name: "Automotive Parts" },
  { id: "cat2", name: "Electronics" },
  { id: "cat3", name: "Home Appliances" },
];

// Sample customers
export const customers: Customer[] = [
  { id: "cust1", name: "Tesla Inc." },
  { id: "cust2", name: "General Motors" },
  { id: "cust3", name: "Samsung Electronics" },
];

// Sample SKUs
export const skus: SKU[] = [
  { id: "sku1", name: "Engine Control Unit A1", categoryId: "cat1", customerId: "cust1" },
  { id: "sku2", name: "Transmission Assembly B2", categoryId: "cat1", customerId: "cust2" },
  { id: "sku3", name: "LED Display Panel C3", categoryId: "cat2", customerId: "cust3" },
  { id: "sku4", name: "Battery Module D4", categoryId: "cat2", customerId: "cust1" },
  { id: "sku5", name: "Refrigeration Compressor E5", categoryId: "cat3", customerId: "cust3" },
];

// Sample versions
export const versions: Version[] = [
  { id: "v1", name: "Initial Forecast", createdAt: "2024-01-15T12:00:00Z" },
  { id: "v2", name: "Q1 Revision", createdAt: "2024-03-15T14:30:00Z" },
  { id: "v3", name: "Mid-Year Update", createdAt: "2024-06-30T09:45:00Z" },
];

// Helper function to generate sample forecast data
const generateSampleData = (): ForecastData[] => {
  const data: ForecastData[] = [];
  
  // Generate data for each SKU, for each month of 2024 and 2025
  skus.forEach(sku => {
    // For version 1 (initial forecast)
    for (let year of [2024, 2025]) {
      for (let month = 1; month <= 12; month++) {
        const baseValue = Math.floor(Math.random() * 1000) + 500;
        
        data.push({
          id: `${sku.id}-${year}-${month}-v1`,
          skuId: sku.id,
          month,
          year,
          forecastValue: baseValue,
          actualValue: year === 2024 && month <= 6 ? baseValue + (Math.random() * 200 - 100) : null,
          versionId: "v1"
        });
      }
    }
    
    // For version 2 (Q1 revision) - only 2024
    for (let month = 1; month <= 12; month++) {
      const initialForecast = data.find(d => 
        d.skuId === sku.id && d.month === month && d.year === 2024 && d.versionId === "v1"
      );
      
      if (initialForecast) {
        data.push({
          id: `${sku.id}-2024-${month}-v2`,
          skuId: sku.id,
          month,
          year: 2024,
          forecastValue: initialForecast.forecastValue * (1 + (Math.random() * 0.3 - 0.1)),
          actualValue: month <= 6 ? initialForecast.actualValue : null,
          versionId: "v2"
        });
      }
    }
    
    // For version 3 (mid-year update) - only 2024
    for (let month = 1; month <= 12; month++) {
      const v2Forecast = data.find(d => 
        d.skuId === sku.id && d.month === month && d.year === 2024 && d.versionId === "v2"
      );
      
      if (v2Forecast) {
        data.push({
          id: `${sku.id}-2024-${month}-v3`,
          skuId: sku.id,
          month,
          year: 2024,
          forecastValue: v2Forecast.forecastValue * (1 + (Math.random() * 0.4 - 0.2)),
          actualValue: month <= 6 ? v2Forecast.actualValue : null,
          versionId: "v3"
        });
      }
    }
  });
  
  return data;
};

// Generated forecast data
export const forecastData: ForecastData[] = generateSampleData();

// Helper function to get SKU details
export const getSKUDetails = (skuId: string) => {
  const sku = skus.find(s => s.id === skuId);
  if (!sku) return null;
  
  const category = categories.find(c => c.id === sku.categoryId);
  const customer = customers.find(c => c.id === sku.customerId);
  
  return {
    ...sku,
    category,
    customer
  };
};

// Helper function to filter forecast data
export const filterForecastData = (
  categoryId: string | null,
  customerId: string | null,
  year: number,
  versionId: string
) => {
  // Filter SKUs first
  let filteredSKUs = [...skus];
  
  if (categoryId) {
    filteredSKUs = filteredSKUs.filter(sku => sku.categoryId === categoryId);
  }
  
  if (customerId) {
    filteredSKUs = filteredSKUs.filter(sku => sku.customerId === customerId);
  }
  
  // Get relevant forecast data
  return forecastData.filter(item => 
    filteredSKUs.some(sku => sku.id === item.skuId) &&
    item.year === year &&
    item.versionId === versionId
  );
};

// Helper function to get quarters from months
export const getQuarterFromMonth = (month: number): number => {
  return Math.ceil(month / 3);
};

// Helper function to group forecast data by quarter
export const groupByQuarter = (data: ForecastData[]) => {
  const quarterlyData = new Map<string, { forecast: number, actual: number | null, count: number }>();
  
  data.forEach(item => {
    const quarter = getQuarterFromMonth(item.month);
    const key = `Q${quarter}`;
    
    if (!quarterlyData.has(key)) {
      quarterlyData.set(key, { forecast: 0, actual: 0, count: 0 });
    }
    
    const entry = quarterlyData.get(key)!;
    entry.forecast += item.forecastValue;
    
    if (item.actualValue !== null) {
      entry.actual = (entry.actual || 0) + item.actualValue;
    }
    
    entry.count++;
  });
  
  return Array.from(quarterlyData.entries()).map(([label, values]) => ({
    label,
    forecast: values.forecast,
    actual: values.actual !== 0 ? values.actual : null
  }));
};

// Helper function to group forecast data yearly
export const groupByYear = (data: ForecastData[]) => {
  const yearly = {
    label: data[0]?.year.toString() || "N/A",
    forecast: data.reduce((sum, item) => sum + item.forecastValue, 0),
    actual: data.some(item => item.actualValue === null) 
      ? null 
      : data.reduce((sum, item) => sum + (item.actualValue || 0), 0)
  };
  
  return [yearly];
};

// Helper to get month name
export const getMonthName = (month: number): string => {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' });
};
