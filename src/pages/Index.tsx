
import React, { useState } from "react";
import { ForecastProvider } from "@/context/ForecastContext";
import Header from "@/components/Header";
import TimeToggle from "@/components/TimeToggle";
import VersionControl from "@/components/VersionControl";
import ChartView from "@/components/ChartView";
import TableView from "@/components/TableView";
import SKUOverviewView from "@/components/SKUOverviewView";
import Filters from "@/components/Filters";
import CurrencySelector from "@/components/CurrencySelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("forecast");
  
  return (
    <ForecastProvider>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container pb-16">
          <div className="space-y-8 animate-slide-up">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
              <div className="flex flex-wrap items-center gap-4">
                <TimeToggle />
                <CurrencySelector />
                <Filters />
              </div>
              <VersionControl />
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex md:flex-row">
                <TabsTrigger value="forecast">Detailed Forecast</TabsTrigger>
                <TabsTrigger value="overview">SKU Overview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="forecast" className="space-y-8 mt-6">
                {/* Chart */}
                <ChartView />
                
                {/* Table */}
                <TableView />
              </TabsContent>
              
              <TabsContent value="overview" className="space-y-8 mt-6">
                {/* SKU Overview */}
                <SKUOverviewView />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ForecastProvider>
  );
};

export default Index;
