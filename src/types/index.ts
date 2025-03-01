
export type Category = {
  id: string;
  name: string;
};

export type Customer = {
  id: string;
  name: string;
};

export type SKU = {
  id: string;
  name: string;
  categoryId: string;
  customerId: string;
};

export type ForecastData = {
  id: string;
  skuId: string;
  month: number; // 1-12
  year: number;
  forecastValue: number;
  actualValue: number | null;
  versionId: string;
};

export type Version = {
  id: string;
  name: string;
  createdAt: string;
  notes?: string;
};

export type TimeView = 'monthly' | 'quarterly' | 'yearly';

export type ChartData = {
  label: string;
  forecast: number;
  actual: number | null;
};

export type FilterState = {
  categoryId: string | null;
  customerId: string | null;
  year: number;
  versionId: string;
};
