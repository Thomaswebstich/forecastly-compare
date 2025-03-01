
import React from "react";
import { useForecast } from "@/context/ForecastContext";

const Header = () => {
  const { filters, versions } = useForecast();
  
  // Get current version name
  const currentVersion = versions.find(v => v.id === filters.versionId);
  
  return (
    <header className="w-full animate-slide-down">
      <div className="container py-8">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center">
            <div className="px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
              {filters.year}
            </div>
            {currentVersion && (
              <div className="px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full ml-2">
                {currentVersion.name}
              </div>
            )}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Forecast Platform
          </h1>
          <p className="text-muted-foreground max-w-[750px]">
            Manage product forecasts and actual sales data with precision and clarity.
            Compare versions, analyze trends, and ensure optimal production capacity utilization.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
