
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppData, Purchase, Sale } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';

interface ReportProps {
  data: AppData;
}

type Timeframe = 'all' | 'monthly' | 'weekly' | 'daily';

const Report: React.FC<ReportProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute to ensure the report stays current

    return () => {
      clearInterval(timer);
    };
  }, []);

  const { analysis, chartData, chartTitle } = useMemo(() => {
    const now = currentTime;
    
    const getTodayStart = () => new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const getWeekStart = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
        return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
    };

    const getMonthStart = () => new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filterByTimeframe = (transaction: { date?: string }) => {
        if (!transaction.date) {
            return timeframe === 'all';
        }
        const transactionDate = new Date(transaction.date);
        switch (timeframe) {
            case 'daily':
                return transactionDate.getTime() >= getTodayStart();
            case 'weekly':
                return transactionDate.getTime() >= getWeekStart(now);
            case 'monthly':
                return transactionDate.getTime() >= getMonthStart();
            case 'all':
            default:
                return true;
        }
    };

    const filteredPurchases = data.purchases.filter(filterByTimeframe);
    const filteredSales = data.sales.filter(filterByTimeframe);

    let rent = data.rent;
    const totalOtherExpenses = (data.otherExpenses || []).reduce((acc, expense) => acc + expense.amount, 0);
    let otherExpenses = totalOtherExpenses;

    if (timeframe === 'daily') {
        rent /= 30;
        otherExpenses /= 30;
    } else if (timeframe === 'weekly') {
        rent /= 4;
        otherExpenses /= 4;
    }

    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.cost, 0);
    const totalSales = filteredSales.reduce((acc, s) => acc + s.revenue, 0);
    
    const inventoryValue = data.inventory.reduce((acc, item) => {
      const quantity = parseFloat(String(item.quantity)) || 0;
      const costPerUnit = parseFloat(String(item.costPerUnit)) || 0;
      return acc + (quantity * costPerUnit);
    }, 0);
    
    const cogs = totalPurchases;
    const grossProfit = totalSales - cogs;
    const netProfit = grossProfit - rent - otherExpenses;

    const finalAnalysis = { totalPurchases, totalSales, inventoryValue, rent, otherExpenses, cogs, grossProfit, netProfit };

    let finalChartData = [];
    let finalChartTitle = 'Overall Summary';

    if (timeframe === 'weekly' || timeframe === 'monthly') {
        const dailyData: { [key: string]: { Sales: number; Purchases: number } } = {};

        const processTransactions = (transactions: (Purchase[] | Sale[]), type: 'Sales' | 'Purchases') => {
            transactions.forEach(t => {
                if(t.date) {
                    const dateKey = new Date(t.date).toISOString().split('T')[0];
                    if (!dailyData[dateKey]) {
                        dailyData[dateKey] = { Sales: 0, Purchases: 0 };
                    }
                    if (type === 'Sales') {
                        dailyData[dateKey].Sales += (t as Sale).revenue;
                    } else {
                        dailyData[dateKey].Purchases += (t as Purchase).cost;
                    }
                }
            });
        };

        processTransactions(filteredSales, 'Sales');
        processTransactions(filteredPurchases, 'Purchases');

        const sortedDays = Object.keys(dailyData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        
        if (timeframe === 'weekly') {
            finalChartTitle = 'Weekly Progress';
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            finalChartData = sortedDays.map(dateKey => {
                const date = new Date(dateKey);
                const dayData = dailyData[dateKey];
                return {
                    name: weekDays[date.getUTCDay()],
                    Sales: dayData.Sales,
                    Purchases: dayData.Purchases,
                    'Gross Profit': dayData.Sales - dayData.Purchases,
                };
            });
        } else { // monthly
            finalChartTitle = 'Monthly Progress';
            finalChartData = sortedDays.map(dateKey => {
                const date = new Date(dateKey);
                const dayData = dailyData[dateKey];
                return {
                    name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
                    Sales: dayData.Sales,
                    Purchases: dayData.Purchases,
                    'Gross Profit': dayData.Sales - dayData.Purchases,
                };
            });
        }
    } else { // 'all' or 'daily'
        if (timeframe === 'daily') finalChartTitle = "Today's Summary";
        finalChartData = [{
            name: 'Summary',
            Sales: finalAnalysis.totalSales,
            Purchases: finalAnalysis.totalPurchases,
            'Gross Profit': finalAnalysis.grossProfit,
            'Net Profit': finalAnalysis.netProfit
        }];
    }

    return { analysis: finalAnalysis, chartData: finalChartData, chartTitle: finalChartTitle };

  }, [data, timeframe, currentTime]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isGeneratingPdf) return;
  
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#111111', // Match surface color
        useCORS: true,
      });
  
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
      let heightLeft = imgHeight;
      let position = 0;
  
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfPageHeight;
  
      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }
  
      const date = new Date().toISOString().split('T')[0];
      const filename = `Pizza-Kiosk-Report-${timeframe}-${date}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Sorry, there was an error generating the PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  };

  const timeframeLabels: Record<Timeframe, { title: string; rentLabel: string; expenseLabel: string }> = {
    all: { title: 'Operational Analysis Report', rentLabel: 'Monthly Rent', expenseLabel: 'Total Other Monthly Expenses' },
    monthly: { title: "This Month's Report", rentLabel: 'Monthly Rent', expenseLabel: 'Total Other Monthly Expenses' },
    weekly: { title: "This Week's Report", rentLabel: 'Prorated Weekly Rent', expenseLabel: 'Prorated Other Expenses' },
    daily: { title: "Today's Report", rentLabel: 'Prorated Daily Rent', expenseLabel: 'Prorated Other Expenses' }
  };
  const currentLabels = timeframeLabels[timeframe];

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-primary whitespace-nowrap">{currentLabels.title}</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg justify-center">
            {(['all', 'monthly', 'weekly', 'daily'] as Timeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 capitalize ${
                  timeframe === tf ? 'bg-accent text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {tf === 'all' ? 'All Time' : tf}
              </button>
            ))}
          </div>
          {(timeframe === 'daily' || timeframe === 'monthly' || timeframe === 'weekly') && (
            <Button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto"
            >
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </Button>
          )}
        </div>
      </div>
      
      <div ref={reportRef}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-center">
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Total Sales</p>
            <p className="text-2xl font-semibold text-green-400">{formatCurrency(analysis.totalSales)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Total Purchases (COGS)</p>
            <p className="text-2xl font-semibold text-red-400">{formatCurrency(analysis.totalPurchases)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Gross Profit</p>
            <p className="text-2xl font-semibold text-primary">{formatCurrency(analysis.grossProfit)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Inventory Value</p>
            <p className="text-2xl font-semibold text-secondary">{formatCurrency(analysis.inventoryValue)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{currentLabels.rentLabel}</p>
            <p className="text-2xl font-semibold text-red-400">{formatCurrency(analysis.rent)}</p>
          </div>
           <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{currentLabels.expenseLabel}</p>
            <p className="text-2xl font-semibold text-red-400">{formatCurrency(analysis.otherExpenses)}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border-2 border-primary col-span-2 md:col-span-3">
            <p className="text-sm text-gray-400">Net Profit</p>
            <p className={`text-3xl font-bold ${analysis.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(analysis.netProfit)}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-900 p-4 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-primary mb-2">Calculation Breakdown</h3>
          <div className="text-sm space-y-1 text-secondary">
              <p><strong>Gross Profit</strong> = Total Sales - COGS</p>
              <p>({formatCurrency(analysis.totalSales)} - {formatCurrency(analysis.cogs)}) = <span className="font-bold">{formatCurrency(analysis.grossProfit)}</span></p>
              <hr className="border-gray-700 my-2" />
              <p><strong>Net Profit</strong> = Gross Profit - (Rent + Other Expenses)</p>
              <p>({formatCurrency(analysis.grossProfit)} - ({formatCurrency(analysis.rent)} + {formatCurrency(analysis.otherExpenses)})) = <span className="font-bold">{formatCurrency(analysis.netProfit)}</span></p>
          </div>
        </div>

        <div className="h-80 w-full mt-4">
          <h3 className="text-lg font-semibold text-primary mb-2 text-center">{chartTitle}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#d0e6ff" />
              <YAxis stroke="#d0e6ff" tickFormatter={(value) => `₱${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #0ea5e9', color: '#d0e6ff' }} 
                cursor={{fill: 'rgba(14, 165, 233, 0.1)'}}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ color: '#d0e6ff' }} />
              <Bar dataKey="Sales" fill="#22c55e" />
              <Bar dataKey="Purchases" fill="#ef4444" />
              <Bar dataKey="Gross Profit" fill="#66ccff" />
              {(timeframe === 'all' || timeframe === 'daily') && <Bar dataKey="Net Profit" fill="#3b82f6" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </Card>
  );
};

export default Report;
