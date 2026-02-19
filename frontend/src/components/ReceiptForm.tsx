'use client';

import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import { getGoodsCategories, searchCustomers, createCustomer, createReceipt, addReceiptItem } from '../lib/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GoodsCategory {
  id: number;
  name: string;
  unit_price: number;
}

interface Customer {
  id: number;
  company_name: string;
  customer_code: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  company_registration?: string;
  is_active?: boolean;
}

interface ReceiptItem {
  id?: number;
  category?: GoodsCategory | null;
  description: string;
  cbm: number;
  unit_price: number;
  total_price: number;
}

interface ReceiptFormProps {
  onReceiptCreated?: () => void;
}

export default function ReceiptForm({ onReceiptCreated }: ReceiptFormProps) {
  console.log('=== ReceiptForm component rendered ===');
  const [categories, setCategories] = useState<GoodsCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInput, setCustomerInput] = useState('');
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
    { description: '', cbm: 0, unit_price: 0, total_price: 0 }
  ]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState<any>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [loadingDate, setLoadingDate] = useState('');
  const [eta, setEta] = useState('');
  const [containerNumber, setContainerNumber] = useState('');

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('Loading categories from database...');
        const data = await getGoodsCategories();
        console.log('Categories loaded from DB:', data);
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Search customers when input changes
  useEffect(() => {
    const searchCustomersDebounce = setTimeout(async () => {
      try {
        const data = await searchCustomers(customerInput || '');
        console.log('Customer search response:', data);
        setCustomers(data);
      } catch (error) {
        console.error('Error searching customers:', error);
      }
    }, 300);

    return () => clearTimeout(searchCustomersDebounce);
  }, [customerInput]);

  // Preserve receipt items when customer changes (don't reset form)
  useEffect(() => {
    console.log('Customer changed, preserving receipt items:', receiptItems);
    // Don't reset receipt items when customer changes
  }, [selectedCustomer]);

  // Calculate totals whenever items change
  useEffect(() => {
    const newGrandTotal = receiptItems.reduce((sum, item) => {
      const itemTotal = item.cbm * item.unit_price;
      return sum + itemTotal;
    }, 0);
    setGrandTotal(newGrandTotal);
  }, [receiptItems]);

  // Handle category selection for an item
  const handleCategoryChange = (index: number, selectedOption: any) => {
    const newItems = [...receiptItems];
    const category = selectedOption ? categories.find(c => c.id === selectedOption.value) : null;
    
    newItems[index] = {
      ...newItems[index],
      category: category,
      unit_price: category ? category.unit_price : 0,
      description: category ? category.name : newItems[index].description
    };
    
    setReceiptItems(newItems);
  };

  // Handle CBM change
  const handleCbmChange = (index: number, cbm: number) => {
    const newItems = [...receiptItems];
    newItems[index] = {
      ...newItems[index],
      cbm: cbm || 0
    };
    setReceiptItems(newItems);
  };

  // Handle description change
  const handleDescriptionChange = (index: number, description: string) => {
    const newItems = [...receiptItems];
    newItems[index] = {
      ...newItems[index],
      description
    };
    setReceiptItems(newItems);
  };

  // Generic item change handler
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...receiptItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-populate unit_price and description from category if category is selected
    if (field === 'category' && value && value.unit_price) {
      newItems[index].unit_price = value.unit_price;
      newItems[index].cbm = newItems[index].cbm || 1.000; // Default CBM for category items
      
      // Auto-populate description for specific categories
      if (value.name === 'Normal Goods') {
        newItems[index].description = 'Normal Goods';
      } else if (value.name === 'Special Goods') {
        newItems[index].description = 'Special Goods';
      }
    }
    
    // For ad-hoc items (no category), set default CBM to 1.000
    if (field === 'category' && !value) {
      newItems[index].cbm = 1.000;
      newItems[index].description = ''; // Clear description for manual input
    }
    
    // For ad-hoc items, if unit_price is being set and CBM is 0, set CBM to 1.000
    if (field === 'unit_price' && !newItems[index].category && newItems[index].cbm === 0) {
      newItems[index].cbm = 1.000;
    }
    
    // Recalculate total if cbm or unit_price changed
    if (field === 'cbm' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].cbm * newItems[index].unit_price;
    }
    
    setReceiptItems(newItems);
    
    // Recalculate grand total
    const newGrandTotal = newItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
    setGrandTotal(newGrandTotal);
  };

  // Add new item row
  const addItemRow = () => {
    setReceiptItems([...receiptItems, { description: '', cbm: 0, unit_price: 0, total_price: 0 }]);
  };

  // Remove item row
  const removeItemRow = (index: number) => {
    const newItems = receiptItems.filter((_, i) => i !== index);
    setReceiptItems(newItems);
  };

  // Handle customer creation/selection
  const handleCustomerChange = async (newValue: any, actionMeta: any) => {
    console.log('=== handleCustomerChange called ===');
    console.log('newValue:', newValue);
    console.log('actionMeta:', actionMeta);
    
    if (actionMeta && actionMeta.action === 'create-option') {
      console.log('Creating new customer...');
      // Create new customer
      try {
        const customerData = {
          company_name: newValue.label,
          contact_person: '',
          phone: '',
          email: '',
          address: '',
          company_registration: ''
        };
        console.log('Customer data to create:', customerData);
        const newCustomer = await createCustomer(customerData);
        console.log('New customer created:', newCustomer);
        // Format new customer for CreatableSelect
        const formattedNewCustomer = {
          value: newCustomer.id,
          label: `${newCustomer.company_name} (${newCustomer.customer_code})`,
          __isNew__: true
        };
        setSelectedCustomer(formattedNewCustomer);
        setCustomers(prevCustomers => [...(prevCustomers?.results || prevCustomers || []), formattedNewCustomer]);
        
        // Show success message
        alert(`Customer "${newCustomer.company_name} (${newCustomer.customer_code})" created successfully!`);
      } catch (error) {
        console.error('Error creating customer:', error);
        alert('Error creating customer. Please try again.');
      }
    } else {
      console.log('Selected existing customer:', newValue);
      setSelectedCustomer(newValue);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Please select or create a customer');
      return;
    }

    setLoading(true);
    try {
      // Create receipt with all items at once
      console.log('Selected customer:', selectedCustomer);
      console.log('Receipt items:', receiptItems);
      console.log('Receipt items details:', receiptItems.map((item, index) => ({
        index,
        category: item.category,
        categoryId: item.category?.id,
        description: item.description,
        cbm: item.cbm,
        unit_price: item.unit_price
      })));
      console.log('Grand total:', grandTotal);
      
      const receiptData = {
        customer: selectedCustomer?.value || selectedCustomer?.id || selectedCustomer,
        total_amount: parseFloat(grandTotal.toFixed(2)), // Round to 2 decimal places
        payment_status: 'pending',
        loading_date: loadingDate || null,
        eta: eta || null,
        container_number: containerNumber || '',
        items: receiptItems
          .filter(item => item.description && item.description.trim() !== '') // Only include items with description
          .map(item => {
            const categoryId = typeof item.category === 'object' ? item.category.id : item.category;
            return {
              category: categoryId || null,
              description: item.description.trim(),
              cbm: item.cbm || (categoryId ? item.cbm : 1.000), // Default to 1.000 for manual items
              unit_price: parseFloat(parseFloat(item.unit_price).toFixed(2)) // Parse string to number, then round to 2 decimal places
            };
          })
      };
      console.log('Sending receipt data:', JSON.stringify(receiptData, null, 2));
      const receipt = await createReceipt(receiptData);

      // Store created receipt data for PDF generation
      console.log('Backend response:', receipt);
      console.log('Customer data from backend:', receipt.customer);
      setCreatedReceipt({
        ...receipt,
        customer: receipt.customer, // Use customer data from backend response
        items: receipt.items  // Items are returned from backend
      });
      setShowReceiptPreview(true);
      
      if (onReceiptCreated) {
        onReceiptCreated();
      }
    } catch (error) {
      console.error('Error creating receipt:', error);
      alert('Error creating receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!createdReceipt) return;

    // Exchange rate (can be made dynamic)
    const exchangeRate = 7.3; // 1 USD = 7.3 RMB
    const totalUSD = parseFloat(createdReceipt.total_amount || 0);
    const totalRMB = (totalUSD * exchangeRate).toFixed(2);

    const receiptElement = document.createElement('div');
    receiptElement.style.width = '800px';
    receiptElement.style.margin = '0 auto';
    receiptElement.style.padding = '20px';
    receiptElement.style.fontFamily = 'Arial, sans-serif';
    receiptElement.style.fontSize = '12px';
    receiptElement.style.lineHeight = '1.4';
    receiptElement.innerHTML = `
      <!-- Header & Branding -->
      <div style="border-bottom: 3px solid #2c3e50; padding-bottom: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h1 style="margin: 0; color: #2c3e50; font-size: 20px; font-weight: bold;">ROCKMAN LOGISTICS</h1>
            <p style="margin: 3px 0; color: #555; font-size: 12px;">China (Delivery address)</p>
            <p style="margin: 3px 0; color: #555; font-size: 11px;">广东省佛山市南海区里水镇草场海南州工业区32号L8仓</p>
            <p style="margin: 3px 0; color: #555; font-size: 11px;">Ghana: 10 Dantu Avenue, North Kaneshie, Accra</p>
            <p style="margin: 3px 0; color: #555; font-size: 11px;">Turkey: Katip kasim Mah. Mermerciler Cad. No 5, Kat: 1 Yenikapi/Fatih-Istanbul</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; color: #e74c3c; font-size: 18px;">INVOICE</h2>
            <p style="margin: 5px 0; color: #555; font-size: 12px;"><strong>Invoice #:</strong> ${createdReceipt.receipt_number}</p>
            <p style="margin: 5px 0; color: #555; font-size: 12px;"><strong>Date:</strong> ${new Date(createdReceipt.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <!-- Logistics Metadata Header -->
      <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px; font-weight: bold;">Shipment Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div><p style="margin: 5px 0;"><strong>Container No:</strong> ${createdReceipt.container_number || 'N/A'}</p></div>
          <div><p style="margin: 5px 0;"><strong>Loading Date:</strong> ${createdReceipt.loading_date ? new Date(createdReceipt.loading_date).toLocaleDateString() : 'N/A'}</p></div>
          <div><p style="margin: 5px 0;"><strong>ETA:</strong> ${createdReceipt.eta ? new Date(createdReceipt.eta).toLocaleDateString() : 'N/A'}</p></div>
        </div>
      </div>

      <!-- Customer and Staff Information -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Party Information</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
          <div>
            <h4 style="margin: 0 0 8px 0; color: #555; font-size: 14px; font-weight: bold;">Customer Information</h4>
            <p style="margin: 5px 0;"><strong>Company:</strong> ${createdReceipt.customer_name || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Contact Person:</strong> ${createdReceipt.customer_contact_person || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Code:</strong> ${createdReceipt.customer_code || 'N/A'}</p>
          </div>
          <div>
            <h4 style="margin: 0 0 8px 0; color: #555; font-size: 14px; font-weight: bold;">Staff Information</h4>
            <p style="margin: 5px 0;"><strong>Created By:</strong> ${createdReceipt.created_by_name || 'System'}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(createdReceipt.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <!-- Itemized Table -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Item Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <thead>
            <tr style="background-color: #2c3e50; color: white;">
              <th style="text-align: center; padding: 12px 8px; border: 1px solid #ddd;">Item #</th>
              <th style="text-align: left; padding: 12px 8px; border: 1px solid #ddd;">Product</th>
              <th style="text-align: center; padding: 12px 8px; border: 1px solid #ddd;">CBM/Qty</th>
              <th style="text-align: right; padding: 12px 8px; border: 1px solid #ddd;">Unit Price</th>
              <th style="text-align: right; padding: 12px 8px; border: 1px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${createdReceipt.items?.map((item: any, index: number) => `
              <tr style="border-bottom: 1px solid #ddd; ${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
                <td style="text-align: center; padding: 10px 8px; border: 1px solid #ddd;">${index + 1}</td>
                <td style="padding: 10px 8px; border: 1px solid #ddd;">${item.description}</td>
                <td style="text-align: center; padding: 10px 8px; border: 1px solid #ddd;">${item.cbm}</td>
                <td style="text-align: right; padding: 10px 8px; border: 1px solid #ddd;">$${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                <td style="text-align: right; padding: 10px 8px; border: 1px solid #ddd;">$${(item.cbm * parseFloat(item.unit_price || 0)).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Currency Display -->
      <div style="margin-bottom: 20px;">
        <div style="text-align: right; background-color: #f8f9fa; padding: 15px; border: 2px solid #2c3e50; border-radius: 5px;">
          <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Payment Summary</h3>
          <p style="margin: 5px 0; font-size: 16px; font-weight: bold;">Total: $${totalUSD.toFixed(2)} / ${totalRMB} RMB</p>
          <p style="margin: 5px 0; color: #666;">Exchange Rate: 1 USD = ${exchangeRate} RMB</p>
          <p style="margin: 5px 0; color: #666;">Payment Status: <span style="color: ${createdReceipt.payment_status === 'paid' ? '#27ae60' : '#e74c3c'}; font-weight: bold;">${createdReceipt.payment_status.toUpperCase()}</span></p>
        </div>
      </div>

      <!-- Legal Remarks -->
      <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
        <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 14px; font-weight: bold;">IMPORTANT REMARKS</h3>
        <ol style="margin: 0; padding-left: 20px; color: #856404; font-size: 11px; line-height: 1.6;">
          <li style="margin-bottom: 8px;"><strong>Fragile Goods:</strong> Rockman Logistics is not responsible for damage to fragile items during transit. All fragile goods must be properly packaged and clearly labeled.</li>
          <li style="margin-bottom: 8px;"><strong>Insurance:</strong> Basic insurance coverage is included. Additional insurance coverage for high-value items must be requested and paid for separately before shipment.</li>
          <li style="margin-bottom: 8px;"><strong>Fake Goods:</strong> Illegal items, counterfeit products, or any goods prohibited by customs regulations are strictly forbidden. Violators will face legal consequences.</li>
          <li style="margin-bottom: 0;"><strong>Storage Limit:</strong> All items must be collected within one week (7 days) of arrival. Storage fees of $5 per CBM per day will apply after this period.</li>
        </ol>
      </div>`;

    // Temporarily add to body for html2canvas
    document.body.appendChild(receiptElement);

    try {
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Remove temporary element
      document.body.removeChild(receiptElement);

      // Download PDF
      const fileName = `receipt_${createdReceipt.receipt_number || createdReceipt.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerInput('');
    setReceiptItems([{ description: '', cbm: 0, unit_price: 0, total_price: 0 }]);
    setCreatedReceipt(null);
    setShowReceiptPreview(false);
    setGrandTotal(0);
    setLoadingDate('');
    setEta('');
    setContainerNumber('');
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
    unit_price: cat.unit_price
  }));
  
  console.log('Categories state:', categories);
  console.log('Category options for dropdown:', categoryOptions);

  const customerOptions = Array.isArray(customers) ? customers.map(customer => ({
    value: customer.id,
    label: `${customer.company_name} (${customer.customer_code})`
  })) : (customers?.results || customers || []).map(customer => ({
    value: customer.id,
    label: `${customer.company_name} (${customer.customer_code})`
  }));
  
  console.log('Customer options available:', customerOptions);
  console.log('Current customer input:', customerInput);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Receipt</h2>
      
      {!showReceiptPreview ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logistics Metadata */}
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Shipment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loading Date
            </label>
            <input
              type="date"
              value={loadingDate || ''}
              onChange={(e) => setLoadingDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ETA (Estimated Time of Arrival)
            </label>
            <input
              type="date"
              value={eta || ''}
              onChange={(e) => setEta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Container Number
            </label>
            <input
              type="text"
              value={containerNumber || ''}
              onChange={(e) => setContainerNumber(e.target.value)}
              placeholder="e.g., CONT-123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <CreatableSelect
              value={selectedCustomer}
              onChange={(newValue: any, actionMeta: any) => {
                console.log('CreatableSelect onChange called:', { newValue, actionMeta });
                handleCustomerChange(newValue, actionMeta);
              }}
              onInputChange={(inputValue: string, actionMeta: any) => {
                console.log('CreatableSelect onInputChange called:', { inputValue, actionMeta });
                setCustomerInput(inputValue);
              }}
              options={customerOptions}
              placeholder="Type to search or create customer..."
              isClearable
              formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
              noOptionsMessage={() => "Type to search customers or create new"}
              className="w-full"
            />
          </div>

          {/* Receipt Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Receipt Items</h3>
            <div className="space-y-4">
              {receiptItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={item.category?.id || ''}
                      onChange={(e) => {
                        const categoryId = e.target.value;
                        const selectedCategory = categoryId ? categories.find(cat => cat.id === parseInt(categoryId)) : null;
                        handleItemChange(index, 'category', selectedCategory);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name} (${category.unit_price}/CBM)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder={item.category ? `${item.category.name} - Custom description` : 'e.g., Transport, Surcharges, etc.'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CBM
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.cbm}
                      onChange={(e) => handleItemChange(index, 'cbm', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!item.category} // Disabled for ad-hoc items (defaults to 1.000)
                      readOnly={!item.category}
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price {item.category ? `($/CBM)` : '(Manual)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                      ${parseFloat(item.total_price || 0).toFixed(2)}
                    </div>
                  </div>

                  {receiptItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Item
            </button>
          </div>

          {/* Grand Total */}
          <div className="text-right">
            <div className="text-2xl font-bold">
              Grand Total: ${parseFloat(grandTotal || 0).toFixed(2)}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !selectedCustomer}
              className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Receipt...' : 'Create Receipt'}
            </button>
          </div>
        </form>
      ) : (
        /* Receipt Preview */
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Receipt Preview</h3>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-lg font-bold text-gray-800">Rockman Logistics</h4>
                <p className="text-sm text-gray-600">Guangzhou Office: +86 20 8888 8888</p>
                <p className="text-sm text-gray-600">Ghana Warehouse: +233 30 123 4567</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600"><strong>Receipt #:</strong> {createdReceipt.receipt_number}</p>
                <p className="text-sm text-gray-600"><strong>Date:</strong> {new Date(createdReceipt.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            {/* Customer and Staff Information */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Customer Information</h5>
                <p className="text-sm"><strong>Company:</strong> {createdReceipt.customer_name || 'N/A'}</p>
                <p className="text-sm"><strong>Contact Person:</strong> {createdReceipt.customer_contact_person || 'N/A'}</p>
                <p className="text-sm"><strong>Code:</strong> {createdReceipt.customer_code || 'N/A'}</p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Staff Information</h5>
                <p className="text-sm"><strong>Created By:</strong> {createdReceipt.created_by_name || 'System'}</p>
              </div>
            </div>

            {/* Logistics Metadata */}
            <div className="bg-gray-100 p-4 rounded mb-6">
              <h5 className="font-semibold text-gray-700 mb-2">Shipment Details</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>Container No:</strong> {createdReceipt.container_number || 'N/A'}</div>
                <div><strong>Loading Date:</strong> {createdReceipt.loading_date ? new Date(createdReceipt.loading_date).toLocaleDateString() : 'N/A'}</div>
                <div><strong>ETA:</strong> {createdReceipt.eta ? new Date(createdReceipt.eta).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            {/* Receipt Items */}
            <div className="mb-4">
              <h5 className="font-semibold mb-2">Items:</h5>
              {createdReceipt?.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between py-2 border-b">
                  <span>{item.description} (x{item.cbm})</span>
                  <span>${(item.cbm * parseFloat(item.unit_price || 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="text-right">
              <h4 className="text-xl font-bold">Total: ${parseFloat(createdReceipt?.total_amount || 0).toFixed(2)}</h4>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={generatePDF}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Download PDF
            </button>
            <button
              onClick={resetForm}
              className="flex-1 px-4 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700"
            >
              Create New Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
