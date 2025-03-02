import { supabase } from "@/integrations/supabase/client";
import { 
  Category, 
  Customer, 
  Currency, 
  ForecastData, 
  SKU, 
  Version, 
  ExchangeRate 
} from "@/types";

// Exchange rates (as of a sample date) - keeping this in memory for simplicity
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

// Convert currency
export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  const rate = exchangeRates.find(r => r.from === from && r.to === to)?.rate || 1;
  return amount * rate;
};

// Categories
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    name: item.name
  }));
};

export const addCategory = async (name: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding category:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name
  };
};

export const updateCategory = async (id: string, name: string): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating category:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name
  };
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  // Check if category is in use by any SKUs
  const { data: skusData, error: skusError } = await supabase
    .from('skus')
    .select('id')
    .eq('category_id', id);
  
  if (skusError) {
    console.error('Error checking category usage:', skusError);
    return false;
  }
  
  if (skusData.length > 0) {
    // Category is in use
    return false;
  }
  
  // Delete the category if not in use
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }
  
  return true;
};

// Customers
export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    name: item.name
  }));
};

export const addCustomer = async (name: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .insert({ name })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding customer:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name
  };
};

export const updateCustomer = async (id: string, name: string): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating customer:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name
  };
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  // Check if customer is in use by any SKUs
  const { data: skusData, error: skusError } = await supabase
    .from('skus')
    .select('id')
    .eq('customer_id', id);
  
  if (skusError) {
    console.error('Error checking customer usage:', skusError);
    return false;
  }
  
  if (skusData.length > 0) {
    // Customer is in use
    return false;
  }
  
  // Delete the customer if not in use
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting customer:', error);
    return false;
  }
  
  return true;
};

// SKUs
export const fetchSKUs = async (): Promise<SKU[]> => {
  const { data, error } = await supabase
    .from('skus')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching SKUs:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    name: item.name,
    categoryId: item.category_id,
    customerId: item.customer_id,
    price: parseFloat(item.price),
    currency: item.currency as Currency
  }));
};

export const fetchSKUDetails = async (skuId: string) => {
  const { data, error } = await supabase
    .from('skus')
    .select(`
      *,
      categories:category_id (id, name),
      customers:customer_id (id, name)
    `)
    .eq('id', skuId)
    .single();
  
  if (error) {
    console.error('Error fetching SKU details:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    categoryId: data.category_id,
    customerId: data.customer_id,
    price: parseFloat(data.price),
    currency: data.currency as Currency,
    category: data.categories,
    customer: data.customers
  };
};

export const addSKU = async (sku: Omit<SKU, 'id'>): Promise<SKU | null> => {
  const { data, error } = await supabase
    .from('skus')
    .insert({
      name: sku.name,
      category_id: sku.categoryId,
      customer_id: sku.customerId,
      price: sku.price,
      currency: sku.currency
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error adding SKU:', error);
    return null;
  }
  
  const newSKU: SKU = {
    id: data.id,
    name: data.name,
    categoryId: data.category_id,
    customerId: data.customer_id,
    price: parseFloat(data.price),
    currency: data.currency as Currency
  };
  
  // Add forecast data for the new SKU
  await addInitialForecastData(newSKU.id);
  
  return newSKU;
};

// Helper function to add initial forecast data for a new SKU
const addInitialForecastData = async (skuId: string) => {
  const { data: versions } = await supabase
    .from('versions')
    .select('id');
  
  if (!versions || versions.length === 0) return;
  
  const forecastEntries = [];
  
  for (const version of versions) {
    for (let year of [2024, 2025]) {
      for (let month = 1; month <= 12; month++) {
        forecastEntries.push({
          sku_id: skuId,
          month,
          year,
          forecast_qty: 0,
          actual_qty: null,
          version_id: version.id
        });
      }
    }
  }
  
  // Insert forecast data in batches
  if (forecastEntries.length > 0) {
    const { error } = await supabase
      .from('forecast_data')
      .insert(forecastEntries);
    
    if (error) {
      console.error('Error adding initial forecast data:', error);
    }
  }
};

export const updateSKU = async (id: string, updates: Partial<Omit<SKU, 'id'>>): Promise<SKU | null> => {
  const updateData: any = {};
  
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
  if (updates.customerId !== undefined) updateData.customer_id = updates.customerId;
  if (updates.price !== undefined) updateData.price = updates.price;
  if (updates.currency !== undefined) updateData.currency = updates.currency;
  
  const { data, error } = await supabase
    .from('skus')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating SKU:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    categoryId: data.category_id,
    customerId: data.customer_id,
    price: parseFloat(data.price),
    currency: data.currency as Currency
  };
};

export const deleteSKU = async (id: string): Promise<boolean> => {
  // Delete the SKU
  const { error } = await supabase
    .from('skus')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting SKU:', error);
    return false;
  }
  
  return true;
};

// Versions
export const fetchVersions = async (): Promise<Version[]> => {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .order('created_at');
  
  if (error) {
    console.error('Error fetching versions:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    name: item.name,
    createdAt: item.created_at,
    notes: item.notes
  }));
};

// Forecast data
export const fetchForecastData = async (): Promise<ForecastData[]> => {
  const { data, error } = await supabase
    .from('forecast_data')
    .select('*');
  
  if (error) {
    console.error('Error fetching forecast data:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    skuId: item.sku_id,
    month: item.month,
    year: item.year,
    forecastQty: item.forecast_qty,
    actualQty: item.actual_qty,
    versionId: item.version_id
  }));
};

export const filterForecastData = async (
  categoryId: string | null,
  customerId: string | null,
  year: number,
  versionId: string
): Promise<ForecastData[]> => {
  // First, get SKUs based on filters
  let skuQuery = supabase.from('skus').select('id');
  
  if (categoryId) {
    skuQuery = skuQuery.eq('category_id', categoryId);
  }
  
  if (customerId) {
    skuQuery = skuQuery.eq('customer_id', customerId);
  }
  
  const { data: skusData, error: skusError } = await skuQuery;
  
  if (skusError) {
    console.error('Error fetching filtered SKUs:', skusError);
    return [];
  }
  
  if (skusData.length === 0) {
    return [];
  }
  
  const skuIds = skusData.map(sku => sku.id);
  
  // Then get forecast data for those SKUs
  const { data, error } = await supabase
    .from('forecast_data')
    .select('*')
    .in('sku_id', skuIds)
    .eq('year', year)
    .eq('version_id', versionId);
  
  if (error) {
    console.error('Error fetching filtered forecast data:', error);
    return [];
  }
  
  return data.map(item => ({
    id: item.id,
    skuId: item.sku_id,
    month: item.month,
    year: item.year,
    forecastQty: item.forecast_qty,
    actualQty: item.actual_qty,
    versionId: item.version_id
  }));
};

export const updateForecastData = async (updatedItem: ForecastData): Promise<boolean> => {
  const { error } = await supabase
    .from('forecast_data')
    .update({
      forecast_qty: updatedItem.forecastQty,
      actual_qty: updatedItem.actualQty
    })
    .eq('id', updatedItem.id);
  
  if (error) {
    console.error('Error updating forecast data:', error);
    return false;
  }
  
  return true;
};

// Helper functions
export const getSKUDetails = async (skuId: string) => {
  const { data, error } = await supabase
    .from('skus')
    .select(`
      *,
      categories:category_id (id, name),
      customers:customer_id (id, name)
    `)
    .eq('id', skuId)
    .single();
  
  if (error) {
    console.error('Error fetching SKU details:', error);
    return null;
  }
  
  return {
    id: data.id,
    name: data.name,
    categoryId: data.category_id,
    customerId: data.customer_id,
    price: parseFloat(data.price),
    currency: data.currency as Currency,
    category: data.categories,
    customer: data.customers
  };
};

// Helper function to get month name
export const getMonthName = (month: number): string => {
  return new Date(2000, month - 1, 1).toLocaleString('default', { month: 'short' });
};

// Helper function to calculate values based on quantity and price
export const calculateValue = async (qty: number, skuId: string, targetCurrency: Currency): Promise<number> => {
  const { data, error } = await supabase
    .from('skus')
    .select('price, currency')
    .eq('id', skuId)
    .single();
  
  if (error) {
    console.error('Error fetching SKU price:', error);
    return 0;
  }
  
  const valueInOriginalCurrency = qty * parseFloat(data.price);
  return convertCurrency(valueInOriginalCurrency, data.currency as Currency, targetCurrency);
};

// Helper function to get quarters from months
export const getQuarterFromMonth = (month: number): number => {
  return Math.ceil(month / 3);
};

// Helper function to group forecast data by quarter
export const groupByQuarter = async (data: ForecastData[], targetCurrency: Currency) => {
  const quarterlyData = new Map<string, { forecast: number, actual: number | null, count: number }>();
  
  for (const item of data) {
    const quarter = getQuarterFromMonth(item.month);
    const key = `Q${quarter}`;
    
    if (!quarterlyData.has(key)) {
      quarterlyData.set(key, { forecast: 0, actual: 0, count: 0 });
    }
    
    const entry = quarterlyData.get(key)!;
    const forecastValue = await calculateValue(item.forecastQty, item.skuId, targetCurrency);
    entry.forecast += forecastValue;
    
    if (item.actualQty !== null) {
      const actualValue = await calculateValue(item.actualQty, item.skuId, targetCurrency);
      entry.actual = (entry.actual === null ? actualValue : entry.actual + actualValue);
    }
    
    entry.count++;
  }
  
  return Array.from(quarterlyData.entries()).map(([label, values]) => ({
    label,
    forecast: values.forecast,
    actual: values.actual !== 0 ? values.actual : null
  }));
};

// Helper function to group forecast data yearly
export const groupByYear = async (data: ForecastData[], targetCurrency: Currency) => {
  let totalForecast = 0;
  let totalActual = 0;
  let hasAllActuals = true;
  
  for (const item of data) {
    totalForecast += await calculateValue(item.forecastQty, item.skuId, targetCurrency);
    
    if (item.actualQty !== null) {
      totalActual += await calculateValue(item.actualQty, item.skuId, targetCurrency);
    } else {
      hasAllActuals = false;
    }
  }
  
  const yearly = {
    label: data[0]?.year.toString() || "N/A",
    forecast: totalForecast,
    actual: hasAllActuals ? totalActual : null
  };
  
  return [yearly];
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
