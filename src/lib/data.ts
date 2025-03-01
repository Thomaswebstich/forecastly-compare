
import { Category, Customer, Currency, ExchangeRate, ForecastData, SKU, Version } from "@/types";

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

// Exchange rates (as of a sample date)
export const exchangeRates: ExchangeRate[] = [
  { from: 'USD', to: 'USD', rate: 1 },
  { from: 'EUR', to: 'USD', rate: 1.08 },
  { from: 'THB', to: 'USD', rate: 0.028 },
  { from: 'USD', to: 'EUR', rate: 0.93 },
  { from: 'EUR', to: 'EUR', rate: 1 },
  { from: 'THB', to: 'EUR', rate: 0.026 },
  { from: 'USD', to: 'THB', rate: 35.7 },
  { from: 'EUR', to: 'THB', rate: 38.5 },
  { from: 'THB', to: 'THB', rate: 1 },
];

// Sample SKUs
export const skus: SKU[] = [
  { id: "sku1", name: "Engine Control Unit A1", categoryId: "cat1", customerId: "cust1", price: 250, currency: "USD" },
  { id: "sku2", name: "Transmission Assembly B2", categoryId: "cat1", customerId: "cust2", price: 1200, currency: "USD" },
  { id: "sku3", name: "LED Display Panel C3", categoryId: "cat2", customerId: "cust3", price: 550, currency: "EUR" },
  { id: "sku4", name: "Battery Module D4", categoryId: "cat2", customerId: "cust1", price: 320, currency: "USD" },
  { id: "sku5", name: "Refrigeration Compressor E5", categoryId: "cat3", customerId: "cust3", price: 28500, currency: "THB" },
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
        const baseQty = Math.floor(Math.random() * 100) + 20;
        
        data.push({
          id: `${sku.id}-${year}-${month}-v1`,
          skuId: sku.id,
          month,
          year,
          forecastQty: baseQty,
          actualQty: year === 2024 && month <= 6 ? baseQty + (Math.random() * 20 - 10) : null,
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
          forecastQty: initialForecast.forecastQty * (1 + (Math.random() * 0.3 - 0.1)),
          actualQty: month <= 6 ? initialForecast.actualQty : null,
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
          forecastQty: v2Forecast.forecastQty * (1 + (Math.random() * 0.4 - 0.2)),
          actualQty: month <= 6 ? v2Forecast.actualQty : null,
          versionId: "v3"
        });
      }
    }
  });
  
  return data;
};

// Generated forecast data
export const forecastData: ForecastData[] = generateSampleData();

// Convert currency
export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  const rate = exchangeRates.find(r => r.from === from && r.to === to)?.rate || 1;
  return amount * rate;
};

// Format currency
export const formatCurrency = (amount: number, currency: Currency): string => {
  if (currency === 'THB') {
    // For THB, round up for thousand and above
    if (amount >= 1_000_000) {
      return `฿${(Math.ceil(amount / 1_000_000)).toLocaleString()}M`;
    } else if (amount >= 1000) {
      return `฿${(Math.ceil(amount / 1000)).toLocaleString()}K`;
    } else {
      return `฿${Math.ceil(amount).toLocaleString()}`;
    }
  }
  
  // For USD and EUR, use standard formatting
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatter.format(amount);
};

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

// Helper function to calculate values based on quantity and price
export const calculateValue = (qty: number, skuId: string, targetCurrency: Currency): number => {
  const sku = skus.find(s => s.id === skuId);
  if (!sku) return 0;
  
  const valueInOriginalCurrency = qty * sku.price;
  return convertCurrency(valueInOriginalCurrency, sku.currency, targetCurrency);
};

// Helper function to get quarters from months
export const getQuarterFromMonth = (month: number): number => {
  return Math.ceil(month / 3);
};

// Helper function to group forecast data by quarter
export const groupByQuarter = (data: ForecastData[], targetCurrency: Currency) => {
  const quarterlyData = new Map<string, { forecast: number, actual: number | null, count: number }>();
  
  data.forEach(item => {
    const quarter = getQuarterFromMonth(item.month);
    const key = `Q${quarter}`;
    
    if (!quarterlyData.has(key)) {
      quarterlyData.set(key, { forecast: 0, actual: 0, count: 0 });
    }
    
    const entry = quarterlyData.get(key)!;
    const forecastValue = calculateValue(item.forecastQty, item.skuId, targetCurrency);
    entry.forecast += forecastValue;
    
    if (item.actualQty !== null) {
      const actualValue = calculateValue(item.actualQty, item.skuId, targetCurrency);
      entry.actual = (entry.actual || 0) + actualValue;
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
export const groupByYear = (data: ForecastData[], targetCurrency: Currency) => {
  let totalForecast = 0;
  let totalActual = 0;
  let hasAllActuals = true;
  
  data.forEach(item => {
    totalForecast += calculateValue(item.forecastQty, item.skuId, targetCurrency);
    
    if (item.actualQty !== null) {
      totalActual += calculateValue(item.actualQty, item.skuId, targetCurrency);
    } else {
      hasAllActuals = false;
    }
  });
  
  const yearly = {
    label: data[0]?.year.toString() || "N/A",
    forecast: totalForecast,
    actual: hasAllActuals ? totalActual : null
  };
  
  return [yearly];
};

// Helper to get month name
export const getMonthName = (month: number): string => {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' });
};

// CRUD operations for SKUs and categories
export const addSKU = (sku: Omit<SKU, 'id'>): SKU => {
  const newSKU: SKU = {
    ...sku,
    id: `sku${skus.length + 1}`
  };
  skus.push(newSKU);
  return newSKU;
};

export const updateSKU = (id: string, updates: Partial<Omit<SKU, 'id'>>): SKU | null => {
  const index = skus.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  skus[index] = {
    ...skus[index],
    ...updates
  };
  
  return skus[index];
};

export const deleteSKU = (id: string): boolean => {
  const initialLength = skus.length;
  const index = skus.findIndex(s => s.id === id);
  
  if (index !== -1) {
    skus.splice(index, 1);
    
    // Also remove associated forecast data
    const dataToKeep = forecastData.filter(item => item.skuId !== id);
    forecastData.length = 0;
    forecastData.push(...dataToKeep);
    
    return true;
  }
  
  return false;
};

export const addCategory = (name: string): Category => {
  const newCategory: Category = {
    id: `cat${categories.length + 1}`,
    name
  };
  categories.push(newCategory);
  return newCategory;
};

export const updateCategory = (id: string, name: string): Category | null => {
  const category = categories.find(c => c.id === id);
  if (!category) return null;
  
  category.name = name;
  return category;
};

export const deleteCategory = (id: string): boolean => {
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  // Check if category is in use
  const inUse = skus.some(s => s.categoryId === id);
  if (inUse) return false;
  
  categories.splice(index, 1);
  return true;
};

export const addCustomer = (name: string): Customer => {
  const newCustomer: Customer = {
    id: `cust${customers.length + 1}`,
    name
  };
  customers.push(newCustomer);
  return newCustomer;
};

export const updateCustomer = (id: string, name: string): Customer | null => {
  const customer = customers.find(c => c.id === id);
  if (!customer) return null;
  
  customer.name = name;
  return customer;
};

export const deleteCustomer = (id: string): boolean => {
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  // Check if customer is in use
  const inUse = skus.some(s => s.customerId === id);
  if (inUse) return false;
  
  customers.splice(index, 1);
  return true;
};
