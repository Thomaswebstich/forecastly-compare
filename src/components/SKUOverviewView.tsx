
import React, { useState } from "react";
import { useForecast } from "@/context/ForecastContext";
import { formatCurrency } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SKUOverviewData } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, BarChart2 } from "lucide-react";

const SKUOverviewView = () => {
  const { skuOverviewData, filters } = useForecast();
  const [sortField, setSortField] = useState<keyof SKUOverviewData>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = useState<string | null>(null);
  const [showAsGraph, setShowAsGraph] = useState(false);

  // Get unique categories and customers for filters
  const categories = Array.from(new Set(skuOverviewData.map(sku => sku.category)));
  const customers = Array.from(new Set(skuOverviewData.map(sku => sku.customer)));

  // Handle sorting
  const handleSort = (field: keyof SKUOverviewData) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort data
  const filteredAndSortedData = skuOverviewData
    .filter(sku => 
      (categoryFilter === null || sku.category === categoryFilter) &&
      (customerFilter === null || sku.customer === customerFilter)
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (aValue === null) return sortDirection === "asc" ? -1 : 1;
      if (bValue === null) return sortDirection === "asc" ? 1 : -1;
      
      return sortDirection === "asc" 
        ? (aValue as number) - (bValue as number) 
        : (bValue as number) - (aValue as number);
    });

  // Format data for charts
  const chartData = filteredAndSortedData.map(sku => ({
    name: sku.name,
    forecast: sku.forecastTotal,
    actual: sku.actualTotal || 0,
    variance: sku.variance || 0
  }));

  return (
    <div className="bg-card rounded-xl shadow-card border border-border p-6 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-medium">SKU Overview</h3>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Category filter */}
          <div>
            <select
              value={categoryFilter || ""}
              onChange={(e) => setCategoryFilter(e.target.value || null)}
              className="py-2 px-3 text-sm bg-background border border-input rounded-md input-focus"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Customer filter */}
          <div>
            <select
              value={customerFilter || ""}
              onChange={(e) => setCustomerFilter(e.target.value || null)}
              className="py-2 px-3 text-sm bg-background border border-input rounded-md input-focus"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer} value={customer}>{customer}</option>
              ))}
            </select>
          </div>
          
          {/* View toggle */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAsGraph(!showAsGraph)}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            {showAsGraph ? "Show Table" : "Show Graph"}
          </Button>
        </div>
      </div>
      
      {showAsGraph ? (
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => 
                formatCurrency(value, filters.displayCurrency).replace(/[^\d.-]/g, '')} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(0)}%`} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "variance") return [`${value.toFixed(2)}%`, "Variance"];
                  return [formatCurrency(value as number, filters.displayCurrency), 
                    name.charAt(0).toUpperCase() + name.slice(1)];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="forecast" fill="#8884d8" name="Forecast" />
              <Bar yAxisId="left" dataKey="actual" fill="#82ca9d" name="Actual" />
              <Bar yAxisId="right" dataKey="variance" fill="#ff7300" name="Variance (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    SKU
                    <ArrowUpDown className={`h-4 w-4 ml-1 ${sortField === "name" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center">
                    Category
                    <ArrowUpDown className={`h-4 w-4 ml-1 ${sortField === "category" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center">
                    Customer
                    <ArrowUpDown className={`h-4 w-4 ml-1 ${sortField === "customer" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort("forecastTotal")}
                >
                  <div className="flex items-center justify-end">
                    Forecast ({filters.displayCurrency})
                    <ArrowUpDown className={`h-4 w-4 ml-1 ${sortField === "forecastTotal" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort("actualTotal")}
                >
                  <div className="flex items-center justify-end">
                    Actual ({filters.displayCurrency})
                    <ArrowUpDown className={`h-4 w-4 ml-1 ${sortField === "actualTotal" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right text-sm font-medium text-muted-foreground cursor-pointer"
                  onClick={() => handleSort("variance")}
                >
                  <div className="flex items-center justify-end">
                    Variance
                    <ArrowUpDown className={`h-4 w-4 ml-1 ${sortField === "variance" ? "opacity-100" : "opacity-30"}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.map((sku) => (
                <tr key={sku.skuId} className="border-b border-border hover:bg-muted/20">
                  <td className="px-4 py-3 text-sm font-medium">{sku.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{sku.category}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{sku.customer}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(sku.forecastTotal, filters.displayCurrency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {sku.actualTotal !== null
                      ? formatCurrency(sku.actualTotal, filters.displayCurrency)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {sku.variance !== null
                      ? (
                        <span className={sku.variance >= 0 ? "text-green-500" : "text-red-500"}>
                          {sku.variance > 0 ? "+" : ""}
                          {sku.variance.toFixed(2)}%
                        </span>
                      )
                      : "—"}
                  </td>
                </tr>
              ))}
              
              {filteredAndSortedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No data available for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SKUOverviewView;
