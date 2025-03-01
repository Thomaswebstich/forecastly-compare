
import React from "react";
import { useForecast } from "@/context/ForecastContext";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

const VersionControl = () => {
  const { 
    versions, 
    filters, 
    updateFilters, 
    compareMode, 
    compareVersionId, 
    toggleCompareMode, 
    setCompareVersionId 
  } = useForecast();
  
  const [open, setOpen] = React.useState(false);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <div className="relative animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleCompareMode()}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            compareMode 
              ? "bg-secondary text-secondary-foreground"
              : "bg-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers size={14} />
          Compare
        </button>
        
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <span>Version</span>
            <ChevronDown size={14} />
          </button>
          
          {open && (
            <div className="absolute top-full mt-1 right-0 z-10 w-60 bg-card rounded-lg shadow-elevated border border-border animate-scale-in">
              <div className="py-1 max-h-[240px] overflow-y-auto">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => {
                      updateFilters({ versionId: version.id });
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 flex flex-col text-sm hover:bg-muted transition-colors",
                      filters.versionId === version.id && "bg-accent"
                    )}
                  >
                    <span className="font-medium">{version.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(version.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {compareMode && (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Compare with</span>
              <ChevronDown size={14} />
            </button>
            
            {open && (
              <div className="absolute top-full mt-1 right-0 z-10 w-60 bg-card rounded-lg shadow-elevated border border-border animate-scale-in">
                <div className="py-1 max-h-[240px] overflow-y-auto">
                  {versions
                    .filter((v) => v.id !== filters.versionId)
                    .map((version) => (
                      <button
                        key={version.id}
                        onClick={() => {
                          setCompareVersionId(version.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 flex flex-col text-sm hover:bg-muted transition-colors",
                          compareVersionId === version.id && "bg-accent"
                        )}
                      >
                        <span className="font-medium">{version.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(version.createdAt)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionControl;
