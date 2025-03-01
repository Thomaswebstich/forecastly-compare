
import React from "react";
import { useForecast } from "@/context/ForecastContext";
import { Filter, Calendar } from "lucide-react";
import { categories, customers } from "@/lib/data";
import { cn } from "@/lib/utils";

const Filters = () => {
  const { filters, updateFilters } = useForecast();
  const [open, setOpen] = React.useState(false);
  
  const years = [2024, 2025, 2026];
  
  return (
    <div className="animate-fade-in">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-secondary/60 transition-colors"
        >
          <Filter size={16} />
          <span>Filters</span>
        </button>
        
        {open && (
          <div className="absolute top-full mt-1 left-0 z-10 w-72 bg-card rounded-lg shadow-elevated border border-border animate-scale-in">
            <div className="p-4 space-y-4">
              {/* Year filter */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Year
                </label>
                <div className="flex flex-wrap gap-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      onClick={() => updateFilters({ year })}
                      className={cn(
                        "inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        filters.year === year 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                      )}
                    >
                      <Calendar size={14} />
                      {year}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Category filter */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Category
                </label>
                <select
                  value={filters.categoryId || ""}
                  onChange={(e) => updateFilters({ 
                    categoryId: e.target.value || null
                  })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm input-focus"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Customer filter */}
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Customer
                </label>
                <select
                  value={filters.customerId || ""}
                  onChange={(e) => updateFilters({ 
                    customerId: e.target.value || null
                  })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm input-focus"
                >
                  <option value="">All Customers</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Clear filters button */}
              <button
                onClick={() => {
                  updateFilters({ 
                    categoryId: null, 
                    customerId: null
                  });
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/70 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Filters;
