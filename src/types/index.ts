
export type Category = {
  id: string;
  name: string;
};

export type Customer = {
  id: string;
  name: string;
};

export type Currency = 'USD' | 'EUR' | 'THB';

export type SKU = {
  id: string;
  name: string;
  categoryId: string;
  customerId: string;
  price: number;
  currency: Currency;
};

export type ForecastData = {
  id: string;
  skuId: string;
  month: number; // 1-12
  year: number;
  forecastQty: number;
  actualQty: number | null;
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
  displayCurrency: Currency;
};

export type ExchangeRate = {
  from: Currency;
  to: Currency;
  rate: number;
};

export type SKUOverviewData = {
  skuId: string;
  name: string;
  category: string;
  customer: string;
  forecastTotal: number;
  actualTotal: number | null;
  variance: number | null; // Percentage difference between forecast and actual
};
