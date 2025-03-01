
import React from "react";
import { ForecastProvider } from "@/context/ForecastContext";
import Header from "@/components/Header";
import TimeToggle from "@/components/TimeToggle";
import VersionControl from "@/components/VersionControl";
import ChartView from "@/components/ChartView";
import TableView from "@/components/TableView";
import Filters from "@/components/Filters";

const Index = () => {
  return (
    <ForecastProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container pb-16">
          <div className="space-y-8 animate-slide-up">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-4">
                <TimeToggle />
                <Filters />
              </div>
              <VersionControl />
            </div>
            
            {/* Chart */}
            <ChartView />
            
            {/* Table */}
            <TableView />
          </div>
        </main>
      </div>
    </ForecastProvider>
  );
};

export default Index;
