
import React from "react";
import { useForecast } from "@/context/ForecastContext";
import { TimeView } from "@/types";
import { cn } from "@/lib/utils";

const TimeToggle = () => {
  const { timeView, setTimeView } = useForecast();
  
  const options: { value: TimeView; label: string }[] = [
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
  ];
  
  return (
    <div className="animate-fade-in">
      <div className="inline-flex items-center rounded-lg p-1 bg-muted">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => setTimeView(option.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              timeView === option.value
                ? "bg-white text-foreground shadow-subtle"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeToggle;
