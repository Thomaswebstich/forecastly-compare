
import React, { useState, useEffect } from "react";
import { useForecast } from "@/context/ForecastContext";
import { 
  getSKUDetails,
  getMonthName,
  calculateValue,
  formatCurrency,
  addSKU,
  updateSKU,
  deleteSKU,
  addCategory,
  updateCategory,
  deleteCategory,
  addCustomer,
  updateCustomer,
  deleteCustomer
} from "@/lib/supabaseService";
import { Currency, SKU } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash, Edit, Save, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MonthlyData {
  forecastQty: number;
  actualQty: number | null;
}

interface TotalsResult {
  forecastQty: number;
  actualQty: number | null;
  forecastValue: number;
  actualValue: number | null;
  hasActual: boolean;
}

const TableView = () => {
  const { 
    filteredData, 
    filters, 
    updateForecastData, 
    categories, 
    customers,
    skus,
    refreshData,
    loading
  } = useForecast();
  
  const [editingSKU, setEditingSKU] = useState<string | null>(null);
  const [newSKU, setNewSKU] = useState<Omit<SKU, 'id'> | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState<string | null>(null);
  const [totals, setTotals] = useState<Map<string, TotalsResult>>(new Map());
  const { toast } = useToast();
  
  // Group data by SKU
  const groupedData = React.useMemo(() => {
    const grouped = new Map<string, {
      sku: any;
      monthlyData: Map<number, { forecastQty: number; actualQty: number | null }>;
    }>();
    
    filteredData.forEach((item) => {
      if (!grouped.has(item.skuId)) {
        const sku = skus.find(s => s.id === item.skuId);
        grouped.set(item.skuId, {
          sku,
          monthlyData: new Map(),
        });
      }
      
      const skuGroup = grouped.get(item.skuId)!;
      skuGroup.monthlyData.set(item.month, {
        forecastQty: item.forecastQty,
        actualQty: item.actualQty,
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
  }, [filteredData, skus]);
  
  // Calculate totals for all SKUs
  useEffect(() => {
    const calculateAllTotals = async () => {
      const newTotals = new Map<string, TotalsResult>();
      
      for (const { skuId, monthlyData } of groupedData) {
        let forecastQty = 0;
        let actualQty = 0;
        let forecastValue = 0;
        let actualValue = 0;
        let hasActual = false;
        
        for (const item of monthlyData) {
          forecastQty += item.forecastQty;
          
          if (item.actualQty !== null) {
            actualQty += item.actualQty;
            hasActual = true;
          }
          
          // Calculate values
          const fValue = await calculateValue(item.forecastQty, skuId, filters.displayCurrency);
          forecastValue += fValue;
          
          if (item.actualQty !== null) {
            const aValue = await calculateValue(item.actualQty, skuId, filters.displayCurrency);
            actualValue += aValue;
          }
        }
        
        newTotals.set(skuId, {
          forecastQty,
          actualQty: hasActual ? actualQty : null,
          forecastValue,
          actualValue: hasActual ? actualValue : null,
          hasActual
        });
      }
      
      setTotals(newTotals);
    };
    
    calculateAllTotals();
  }, [groupedData, filters.displayCurrency]);
  
  // Handle input change for forecast/actual quantities
  const handleInputChange = (
    skuId: string,
    month: number,
    field: "forecastQty" | "actualQty",
    value: string
  ) => {
    // Convert to integer instead of float
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const itemToUpdate = filteredData.find(
      (item) => item.skuId === skuId && item.month === month
    );
    
    if (!itemToUpdate) return;
    
    const updatedItem = {
      ...itemToUpdate,
      [field]: numValue,
    };
    
    updateForecastData(updatedItem);
  };
  
  // Handle adding a new SKU
  const handleAddSKU = () => {
    if (!newSKU) {
      setNewSKU({
        name: "",
        categoryId: categories[0]?.id || "",
        customerId: customers[0]?.id || "",
        price: 0,
        currency: "USD"
      });
    } else {
      if (newSKU.name && newSKU.categoryId && newSKU.customerId && newSKU.price > 0) {
        addSKU(newSKU).then(addedSku => {
          if (addedSku) {
            toast({
              title: "SKU Added",
              description: `${addedSku.name} has been added successfully.`
            });
            setNewSKU(null);
            refreshData();
          } else {
            toast({
              title: "Error Adding SKU",
              description: "There was an error adding the SKU.",
              variant: "destructive"
            });
          }
        });
      }
    }
  };
  
  // Handle editing SKU
  const handleSaveSKU = (id: string, updatedSKU: Partial<Omit<SKU, 'id'>>) => {
    updateSKU(id, updatedSKU).then(result => {
      if (result) {
        toast({
          title: "SKU Updated",
          description: `${result.name} has been updated successfully.`
        });
        setEditingSKU(null);
        refreshData();
      } else {
        toast({
          title: "Update Failed",
          description: "There was an error updating the SKU.",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle deleting SKU
  const handleDeleteSKU = (id: string) => {
    if (window.confirm("Are you sure you want to delete this SKU?")) {
      deleteSKU(id).then(success => {
        if (success) {
          toast({
            title: "SKU Deleted",
            description: "The SKU has been deleted successfully."
          });
          refreshData();
        } else {
          toast({
            title: "Delete Failed",
            description: "There was an error deleting the SKU.",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  // Handle category operations
  const handleAddCategory = () => {
    if (newCategory) {
      addCategory(newCategory).then(result => {
        if (result) {
          toast({
            title: "Category Added",
            description: `${result.name} has been added successfully.`
          });
          setNewCategory(null);
          refreshData();
        } else {
          toast({
            title: "Error Adding Category",
            description: "There was an error adding the category.",
            variant: "destructive"
          });
        }
      });
    } else {
      setNewCategory("");
    }
  };
  
  const handleSaveCategory = (id: string, name: string) => {
    updateCategory(id, name).then(result => {
      if (result) {
        toast({
          title: "Category Updated",
          description: `${result.name} has been updated successfully.`
        });
        setEditingCategory(null);
        refreshData();
      } else {
        toast({
          title: "Update Failed",
          description: "There was an error updating the category.",
          variant: "destructive"
        });
      }
    });
  };
  
  const handleDeleteCategory = (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategory(id).then(success => {
        if (success) {
          toast({
            title: "Category Deleted",
            description: "The category has been deleted successfully."
          });
          refreshData();
        } else {
          toast({
            title: "Delete Failed",
            description: "Category is still in use by SKUs and cannot be deleted.",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  // Handle customer operations
  const handleAddCustomer = () => {
    if (newCustomer) {
      addCustomer(newCustomer).then(result => {
        if (result) {
          toast({
            title: "Customer Added",
            description: `${result.name} has been added successfully.`
          });
          setNewCustomer(null);
          refreshData();
        } else {
          toast({
            title: "Error Adding Customer",
            description: "There was an error adding the customer.",
            variant: "destructive"
          });
        }
      });
    } else {
      setNewCustomer("");
    }
  };
  
  const handleSaveCustomer = (id: string, name: string) => {
    updateCustomer(id, name).then(result => {
      if (result) {
        toast({
          title: "Customer Updated",
          description: `${result.name} has been updated successfully.`
        });
        setEditingCustomer(null);
        refreshData();
      } else {
        toast({
          title: "Update Failed",
          description: "There was an error updating the customer.",
          variant: "destructive"
        });
      }
    });
  };
  
  const handleDeleteCustomer = (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(id).then(success => {
        if (success) {
          toast({
            title: "Customer Deleted",
            description: "The customer has been deleted successfully."
          });
          refreshData();
        } else {
          toast({
            title: "Delete Failed",
            description: "Customer is still in use by SKUs and cannot be deleted.",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  return (
    <div className="space-y-8">
      {/* Data Actions */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={refreshData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      {/* Taxonomy Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-card rounded-xl shadow-card border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Categories</h3>
            <Button variant="outline" size="sm" onClick={handleAddCategory}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
          
          {newCategory !== null && (
            <div className="flex items-center space-x-2 mb-2 p-2 bg-muted/30 rounded-md">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                placeholder="Enter category name"
              />
              <Button variant="ghost" size="sm" onClick={() => setNewCategory(null)}>
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  if (newCategory.trim()) {
                    addCategory(newCategory).then(result => {
                      if (result) {
                        toast({
                          title: "Category Added",
                          description: `${result.name} has been added successfully.`
                        });
                        setNewCategory(null);
                        refreshData();
                      }
                    });
                  }
                }}
                disabled={!newCategory.trim()}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="py-4 text-center text-muted-foreground">Loading categories...</div>
          ) : (
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-md">
                  {editingCategory === category.id ? (
                    <input
                      type="text"
                      defaultValue={category.name}
                      className="flex-1 py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveCategory(category.id, e.currentTarget.value);
                        }
                      }}
                    />
                  ) : (
                    <span>{category.name}</span>
                  )}
                  
                  <div className="flex space-x-1">
                    {editingCategory === category.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCategory(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleSaveCategory(category.id, input.value);
                            }
                          }}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCategory(category.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
              
              {categories.length === 0 && (
                <li className="p-4 text-center text-muted-foreground">No categories available</li>
              )}
            </ul>
          )}
        </div>
        
        {/* Customers */}
        <div className="bg-card rounded-xl shadow-card border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Customers</h3>
            <Button variant="outline" size="sm" onClick={handleAddCustomer}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
          
          {newCustomer !== null && (
            <div className="flex items-center space-x-2 mb-2 p-2 bg-muted/30 rounded-md">
              <input
                type="text"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                className="flex-1 py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                placeholder="Enter customer name"
              />
              <Button variant="ghost" size="sm" onClick={() => setNewCustomer(null)}>
                <X className="h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  if (newCustomer.trim()) {
                    addCustomer(newCustomer).then(result => {
                      if (result) {
                        toast({
                          title: "Customer Added",
                          description: `${result.name} has been added successfully.`
                        });
                        setNewCustomer(null);
                        refreshData();
                      }
                    });
                  }
                }}
                disabled={!newCustomer.trim()}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="py-4 text-center text-muted-foreground">Loading customers...</div>
          ) : (
            <ul className="space-y-2">
              {customers.map((customer) => (
                <li key={customer.id} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-md">
                  {editingCustomer === customer.id ? (
                    <input
                      type="text"
                      defaultValue={customer.name}
                      className="flex-1 py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveCustomer(customer.id, e.currentTarget.value);
                        }
                      }}
                    />
                  ) : (
                    <span>{customer.name}</span>
                  )}
                  
                  <div className="flex space-x-1">
                    {editingCustomer === customer.id ? (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCustomer(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={(e) => {
                            const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleSaveCustomer(customer.id, input.value);
                            }
                          }}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingCustomer(customer.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
              
              {customers.length === 0 && (
                <li className="p-4 text-center text-muted-foreground">No customers available</li>
              )}
            </ul>
          )}
        </div>
      </div>
      
      {/* SKU Management */}
      <div className="bg-card rounded-xl shadow-card border border-border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">SKUs</h3>
          <Button variant="outline" size="sm" onClick={handleAddSKU}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add SKU
          </Button>
        </div>
        
        {newSKU && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 mb-4 bg-muted/30 rounded-lg">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <input
                type="text"
                value={newSKU.name}
                onChange={(e) => setNewSKU({...newSKU, name: e.target.value})}
                className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                placeholder="SKU Name"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                value={newSKU.categoryId}
                onChange={(e) => setNewSKU({...newSKU, categoryId: e.target.value})}
                className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Customer</label>
              <select
                value={newSKU.customerId}
                onChange={(e) => setNewSKU({...newSKU, customerId: e.target.value})}
                className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
              >
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>{cust.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Price</label>
              <input
                type="number"
                value={newSKU.price}
                onChange={(e) => setNewSKU({...newSKU, price: parseFloat(e.target.value) || 0})}
                className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                placeholder="Price"
                min="0"
                step="1" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Currency</label>
              <select
                value={newSKU.currency}
                onChange={(e) => setNewSKU({...newSKU, currency: e.target.value as Currency})}
                className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="THB">THB</option>
              </select>
            </div>
            <div className="col-span-full flex justify-end space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setNewSKU(null)}>
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => {
                  if (newSKU.name && newSKU.price > 0) {
                    addSKU(newSKU).then(addedSku => {
                      if (addedSku) {
                        toast({
                          title: "SKU Added",
                          description: `${addedSku.name} has been added successfully.`
                        });
                        setNewSKU(null);
                        refreshData();
                      }
                    });
                  }
                }}
                disabled={!newSKU.name || newSKU.price <= 0}
              >
                Save
              </Button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="py-4 text-center text-muted-foreground">Loading SKUs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Price</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map(({ skuId, sku }) => (
                  <tr key={skuId} className="border-b border-border hover:bg-muted/20">
                    {editingSKU === skuId ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            defaultValue={sku?.name}
                            className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={sku?.categoryId}
                            className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={sku?.customerId}
                            className="w-full py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                          >
                            {customers.map(cust => (
                              <option key={cust.id} value={cust.id}>{cust.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              defaultValue={sku?.price}
                              className="w-20 py-1 px-2 text-sm text-right bg-background border border-input rounded input-focus"
                              min="0"
                              step="1"
                            />
                            <select
                              defaultValue={sku?.currency}
                              className="py-1 px-2 text-sm bg-background border border-input rounded input-focus"
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="THB">THB</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingSKU(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={(e) => {
                                const row = e.currentTarget.closest('tr');
                                if (row) {
                                  const nameInput = row.cells[0].querySelector('input') as HTMLInputElement;
                                  const categorySelect = row.cells[1].querySelector('select') as HTMLSelectElement;
                                  const customerSelect = row.cells[2].querySelector('select') as HTMLSelectElement;
                                  const priceInput = row.cells[3].querySelector('input') as HTMLInputElement;
                                  const currencySelect = row.cells[3].querySelector('select') as HTMLSelectElement;
                                  
                                  if (nameInput && categorySelect && customerSelect && priceInput && currencySelect) {
                                    handleSaveSKU(skuId, {
                                      name: nameInput.value,
                                      categoryId: categorySelect.value,
                                      customerId: customerSelect.value,
                                      price: parseFloat(priceInput.value) || 0,
                                      currency: currencySelect.value as Currency
                                    });
                                  }
                                }
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm font-medium">{sku?.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {categories.find(c => c.id === sku?.categoryId)?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {customers.find(c => c.id === sku?.customerId)?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {sku ? formatCurrency(sku.price, sku.currency) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingSKU(skuId)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteSKU(skuId)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {groupedData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No SKUs available for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Forecast Table */}
      <div className="w-full overflow-x-auto bg-card rounded-xl shadow-card border border-border animate-slide-up">
        <div className="min-w-[900px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Price</th>
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
              {loading ? (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-muted-foreground">
                    Loading forecast data...
                  </td>
                </tr>
              ) : (
                groupedData.map(({ skuId, sku, monthlyData }) => {
                  if (!sku) return null;
                  
                  const totalValues = totals.get(skuId) || {
                    forecastQty: 0,
                    actualQty: null,
                    forecastValue: 0,
                    actualValue: null,
                    hasActual: false
                  };
                  
                  return (
                    <React.Fragment key={skuId}>
                      {/* Forecast row - Quantity */}
                      <tr className="table-row-animate hover:bg-muted/30">
                        <td 
                          rowSpan={4} 
                          className="px-4 py-3 text-sm font-medium border-t border-border"
                        >
                          {sku.name}
                        </td>
                        <td 
                          rowSpan={4} 
                          className="px-4 py-3 text-sm text-muted-foreground border-t border-border"
                        >
                          {categories.find(c => c.id === sku.categoryId)?.name || "Unknown"}
                        </td>
                        <td 
                          rowSpan={4} 
                          className="px-4 py-3 text-sm text-muted-foreground border-t border-border"
                        >
                          {customers.find(c => c.id === sku.customerId)?.name || "Unknown"}
                        </td>
                        <td 
                          rowSpan={4}
                          className="px-4 py-3 text-sm text-right border-t border-border"
                        >
                          {formatCurrency(sku.price, sku.currency)}
                        </td>
                        <td colSpan={13} className="px-2 py-1 text-xs font-medium text-center bg-muted/10 border-t border-border">
                          Forecast Qty
                        </td>
                      </tr>
                      <tr className="table-row-animate hover:bg-muted/30">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                          const monthData = monthlyData.find(m => m.month === month);
                          return (
                            <td key={month} className="px-2 py-2 text-right">
                              <input
                                type="number"
                                value={monthData ? monthData.forecastQty : ""}
                                onChange={(e) =>
                                  handleInputChange(skuId, month, "forecastQty", e.target.value)
                                }
                                className="w-16 py-1 px-2 text-sm text-right bg-background border border-input rounded input-focus"
                                step="1"
                              />
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {totalValues.forecastQty.toLocaleString()}
                        </td>
                      </tr>
                      
                      {/* Forecast row - Value */}
                      <tr className="table-row-animate bg-muted/10 hover:bg-muted/30">
                        <td colSpan={13} className="px-2 py-1 text-xs font-medium text-center">
                          Forecast Value ({filters.displayCurrency})
                        </td>
                      </tr>
                      <tr className="table-row-animate bg-muted/10 hover:bg-muted/30">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                          const monthData = monthlyData.find(m => m.month === month);
                          const forecastQty = monthData ? monthData.forecastQty : 0;
                          
                          // Pre-calculated values from the grouped data (we don't have individual month values pre-calculated)
                          // Just display a placeholder value for now
                          return (
                            <td key={month} className="px-2 py-2 text-right text-sm">
                              {formatCurrency(forecastQty * sku.price, filters.displayCurrency)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right text-sm font-medium">
                          {formatCurrency(totalValues.forecastValue, filters.displayCurrency)}
                        </td>
                      </tr>
                      
                      {/* Actual row - Quantity */}
                      {totalValues.hasActual && (
                        <>
                          <tr className="table-row-animate bg-muted/20 hover:bg-muted/40">
                            <td 
                              colSpan={4} 
                              className="px-4 py-3 text-sm font-medium border-t border-border"
                            >
                              <span className="text-xs">Actual Qty</span>
                            </td>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                              const monthData = monthlyData.find(m => m.month === month);
                              return (
                                <td key={month} className="px-2 py-2 text-right border-t border-border">
                                  <input
                                    type="number"
                                    value={monthData && monthData.actualQty !== null ? monthData.actualQty : ""}
                                    onChange={(e) =>
                                      handleInputChange(skuId, month, "actualQty", e.target.value)
                                    }
                                    className={cn(
                                      "w-16 py-1 px-2 text-sm text-right bg-muted/50 border rounded input-focus",
                                      monthData && monthData.actualQty !== null && monthData.actualQty > 0 
                                        ? "text-foreground border-input" 
                                        : "text-muted-foreground border-input/50"
                                    )}
                                    placeholder="—"
                                    step="1"
                                  />
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right text-sm font-medium border-t border-border">
                              {totalValues.actualQty !== null 
                                ? totalValues.actualQty.toLocaleString() 
                                : "—"}
                            </td>
                          </tr>
                          
                          {/* Actual row - Value */}
                          <tr className="table-row-animate bg-muted/20 hover:bg-muted/40">
                            <td 
                              colSpan={4} 
                              className="px-4 py-3 text-sm font-medium"
                            >
                              <span className="text-xs">Actual Value ({filters.displayCurrency})</span>
                            </td>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                              const monthData = monthlyData.find(m => m.month === month);
                              const actualQty = monthData && monthData.actualQty !== null ? monthData.actualQty : null;
                              
                              // Pre-calculated values from the grouped data (we don't have individual month values pre-calculated)
                              // Just display a placeholder for now
                              const value = actualQty !== null ? actualQty * sku.price : null;
                              
                              return (
                                <td key={month} className="px-2 py-2 text-right text-sm">
                                  {value !== null 
                                    ? formatCurrency(value, filters.displayCurrency)
                                    : "—"}
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              {totalValues.actualValue !== null 
                                ? formatCurrency(totalValues.actualValue, filters.displayCurrency)
                                : "—"}
                            </td>
                          </tr>
                        </>
                      )}
                    </React.Fragment>
                  );
                })
              )}
              
              {!loading && groupedData.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-muted-foreground">
                    No data available for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableView;
