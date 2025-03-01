
import React, { useEffect, useRef } from "react";
import { useForecast } from "@/context/ForecastContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from "recharts";

const ChartView = () => {
  const { chartData, timeView } = useForecast();
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Format tooltip values
  const formatValue = (value: number) => {
    return value.toLocaleString();
  };
  
  // Animation for chart on timeView change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.classList.remove("animate-fade-in");
      // Trigger reflow
      void chartRef.current.offsetWidth;
      chartRef.current.classList.add("animate-fade-in");
    }
  }, [timeView, chartData]);
  
  return (
    <div ref={chartRef} className="chart-container w-full bg-card rounded-xl p-6 shadow-card border border-border animate-fade-in">
      <div className="h-[300px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#666", fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), ""]}
                contentStyle={{ 
                  borderRadius: "8px", 
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)", 
                  border: "1px solid #eee" 
                }}
              />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              <Bar 
                name="Forecast" 
                dataKey="forecast" 
                fill="hsl(210, 100%, 50%)" 
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                animationEasing="ease-out"
              />
              <Bar 
                name="Actual" 
                dataKey="actual" 
                fill="hsl(160, 100%, 40%)" 
                radius={[4, 4, 0, 0]} 
                animationDuration={500}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-muted-foreground">No data available for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartView;
