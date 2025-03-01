
import React from "react";
import { useForecast } from "@/context/ForecastContext";
import { Currency } from "@/types";
import { cn } from "@/lib/utils";

const CurrencySelector = () => {
  const { filters, updateFilters } = useForecast();
  
  const currencies: { value: Currency; label: string; symbol: string }[] = [
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "THB", label: "Thai Baht", symbol: "฿" },
  ];
  
  return (
    <div className="animate-fade-in">
      <div className="inline-flex items-center rounded-lg p-1 bg-muted">
        {currencies.map((currency) => (
          <button
            key={currency.value}
            onClick={() => updateFilters({ displayCurrency: currency.value })}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              filters.displayCurrency === currency.value
                ? "bg-white text-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {currency.symbol} {currency.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CurrencySelector;
