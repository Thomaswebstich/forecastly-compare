
import React from "react";
import { useForecast } from "@/context/ForecastContext";
import { 
  getSKUDetails,
  categories,
  customers,
  getMonthName 
} from "@/lib/data";
import { SKU } from "@/types";
import { cn } from "@/lib/utils";

const TableView = () => {
  const { filteredData, filters, updateForecastData } = useForecast();
  
  // Group data by SKU
  const groupedData = React.useMemo(() => {
    const grouped = new Map<string, {
      sku: SKU | null;
      monthlyData: Map<number, { forecast: number; actual: number | null }>;
    }>();
    
    filteredData.forEach((item) => {
      if (!grouped.has(item.skuId)) {
        grouped.set(item.skuId, {
          sku: getSKUDetails(item.skuId),
          monthlyData: new Map(),
        });
      }
      
      const skuGroup = grouped.get(item.skuId)!;
      skuGroup.monthlyData.set(item.month, {
        forecast: item.forecastValue,
        actual: item.actualValue,
      });
    });
    
    return Array.from(grouped.entries()).map(([skuId, data]) => ({
      skuId,
      sku: data.sku,
      monthlyData: Array.from(data.monthlyData.entries())
        .sort(([monthA], [monthB]) => monthA - monthB)
        .map(([month, values]) => ({
          month,
          ...values,
        })),
    }));
  }, [filteredData]);
  
  // Handle input change
  const handleInputChange = (
    skuId: string,
    month: number,
    field: "forecast" | "actual",
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const itemToUpdate = filteredData.find(
      (item) => item.skuId === skuId && item.month === month
    );
    
    if (!itemToUpdate) return;
    
    const updatedItem = {
      ...itemToUpdate,
      [field === "forecast" ? "forecastValue" : "actualValue"]: numValue,
    };
    
    updateForecastData(updatedItem);
  };
  
  // Find the relevant SKU and category/customer details
  const getSkuInfo = (skuId: string) => {
    const sku = getSKUDetails(skuId);
    if (!sku) return { categoryName: "Unknown", customerName: "Unknown" };
    
    const category = categories.find((c) => c.id === sku.categoryId);
    const customer = customers.find((c) => c.id === sku.customerId);
    
    return {
      categoryName: category?.name || "Unknown",
      customerName: customer?.name || "Unknown",
    };
  };
  
  // Calculate yearly totals
  const calculateTotals = (monthlyData: { forecast: number; actual: number | null }[]) => {
    return monthlyData.reduce(
      (acc, curr) => {
        acc.forecast += curr.forecast;
        if (curr.actual !== null) {
          acc.actual = (acc.actual || 0) + curr.actual;
          acc.hasActual = true;
        }
        return acc;
      },
      { forecast: 0, actual: null as number | null, hasActual: false }
    );
  };
  
  return (
    <div className="w-full overflow-x-auto bg-card rounded-xl shadow-card border border-border animate-slide-up">
      <div className="min-w-[900px]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <th 
                  key={month} 
                  className="px-2 py-3 text-right text-sm font-medium text-muted-foreground w-16"
                >
                  {getMonthName(month)}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map(({ skuId, sku, monthlyData }) => {
              const { categoryName, customerName } = getSkuInfo(skuId);
              const totals = calculateTotals(monthlyData);
              
              return (
                <React.Fragment key={skuId}>
                  {/* Forecast row */}
                  <tr className="table-row-animate hover:bg-muted/30">
                    <td 
                      rowSpan={totals.hasActual ? 2 : 1} 
                      className="px-4 py-3 text-sm font-medium border-t border-border"
                    >
                      {sku?.name || "Unknown SKU"}
                    </td>
                    <td 
                      rowSpan={totals.hasActual ? 2 : 1} 
                      className="px-4 py-3 text-sm text-muted-foreground border-t border-border"
                    >
                      {categoryName}
                    </td>
                    <td 
                      rowSpan={totals.hasActual ? 2 : 1} 
                      className="px-4 py-3 text-sm text-muted-foreground border-t border-border"
                    >
                      {customerName}
                    </td>
                    {monthlyData.map(({ month, forecast }) => (
                      <td key={month} className="px-2 py-2 text-right border-t border-border">
                        <input
                          type="number"
                          value={forecast}
                          onChange={(e) =>
                            handleInputChange(skuId, month, "forecast", e.target.value)
                          }
                          className="w-16 py-1 px-2 text-sm text-right bg-background border border-input rounded input-focus"
                        />
                      </td>
                    ))}
                    {/* Fill in missing months */}
                    {Array.from({ length: 12 - monthlyData.length }).map((_, i) => (
                      <td key={i} className="px-2 py-2 text-right border-t border-border">
                        <span className="text-sm text-muted-foreground">—</span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right text-sm font-medium border-t border-border">
                      {totals.forecast.toLocaleString()}
                    </td>
                  </tr>
                  
                  {/* Actual row */}
                  {totals.hasActual && (
                    <tr className="table-row-animate bg-muted/20 hover:bg-muted/40">
                      {monthlyData.map(({ month, actual }) => (
                        <td key={month} className="px-2 py-2 text-right">
                          <input
                            type="number"
                            value={actual === null ? "" : actual}
                            onChange={(e) =>
                              handleInputChange(skuId, month, "actual", e.target.value)
                            }
                            className={cn(
                              "w-16 py-1 px-2 text-sm text-right bg-muted/50 border rounded input-focus",
                              actual !== null && actual > 0 
                                ? "text-foreground border-input" 
                                : "text-muted-foreground border-input/50"
                            )}
                            placeholder="—"
                          />
                        </td>
                      ))}
                      {/* Fill in missing months */}
                      {Array.from({ length: 12 - monthlyData.length }).map((_, i) => (
                        <td key={i} className="px-2 py-2 text-right">
                          <span className="text-sm text-muted-foreground">—</span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        {totals.actual !== null 
                          ? totals.actual.toLocaleString() 
                          : "—"}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            
            {groupedData.length === 0 && (
              <tr>
                <td colSpan={16} className="px-4 py-8 text-center text-muted-foreground">
                  No data available for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
