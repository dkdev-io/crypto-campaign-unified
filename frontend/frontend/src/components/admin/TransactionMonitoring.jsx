import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TransactionMonitoring = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    averageAmount: 0,
    todayAmount: 0,
    pendingCount: 0,
    completedCount: 0
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('form_submissions')
        .select(`
          id,
          first_name,
          last_name,
          email,
          amount,
          payment_method,
          contributor_wallet,
          transaction_hash,
          submitted_at,
          campaign_id,
          campaigns:campaign_id(name)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      
      const transactionData = data || [];
      setTransactions(transactionData);
      calculateSummaryStats(transactionData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryStats = (transactions) => {
    const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const totalCount = transactions.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    
    const today = new Date().toDateString();
    const todayTransactions = transactions.filter(tx => 
      new Date(tx.submitted_at).toDateString() === today
    );
    const todayAmount = todayTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    
    // Mock status counts - you might want to add status field to your table
    const completedCount = transactions.length; // Assuming all are completed for now
    const pendingCount = 0;

    setSummaryStats({
      totalAmount,
      totalCount,
      averageAmount,
      todayAmount,
      pendingCount,
      completedCount
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transaction_hash?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAmount = amountFilter === 'all' ||
      (amountFilter === 'small' && parseFloat(transaction.amount) < 100) ||
      (amountFilter === 'medium' && parseFloat(transaction.amount) >= 100 && parseFloat(transaction.amount) < 1000) ||
      (amountFilter === 'large' && parseFloat(transaction.amount) >= 1000);
    
    return matchesSearch && matchesAmount;
  });

  const exportTransactions = () => {
    const csv = [
      ['ID', 'Name', 'Email', 'Amount', 'Payment Method', 'Transaction Hash', 'Date'].join(','),
      ...filteredTransactions.map(tx => [
        tx.id,
        `"${tx.first_name} ${tx.last_name}"`,
        tx.email,
        tx.amount,
        tx.payment_method,
        tx.transaction_hash || '',
        new Date(tx.submitted_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon, change }) => (
    <div className="crypto-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="text-sm font-medium">{change >= 0 ? '↗' : '↘'} {Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className="bg-primary text-primary-foreground p-3 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crypto-card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Transaction Monitoring</h2>
            <p className="text-muted-foreground mt-1">Monitor and analyze all financial transactions</p>
          </div>
          <button
            onClick={exportTransactions}
            className="btn-secondary flex items-center"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summaryStats.totalAmount)}
          change={15}
          icon={"💰"}
        />
        
        <StatCard
          title="Total Transactions"
          value={summaryStats.totalCount.toLocaleString()}
          change={8}
          icon={"📊"}
        />
        
        <StatCard
          title="Average Amount"
          value={formatCurrency(summaryStats.averageAmount)}
          change={-3}
          icon={"📈"}
        />
        
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(summaryStats.todayAmount)}
          change={25}
          icon={"⏰"}
        />
      </div>

      {/* Filters */}
      <div className="crypto-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, email, or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Amounts</option>
              <option value="small">Under $100</option>
              <option value="medium">$100 - $999</option>
              <option value="large">$1000+</option>
            </select>
          </div>

          {selectedTransactions.length > 0 && (
            <div>
              <select className="form-input">
                <option value="">Actions ({selectedTransactions.length})</option>
                <option value="export_selected">Export Selected</option>
                <option value="flag_selected">Flag for Review</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="crypto-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTransactions(filteredTransactions.map(t => t.id));
                      } else {
                        setSelectedTransactions([]);
                      }
                    }}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contributor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-secondary/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransactions([...selectedTransactions, transaction.id]);
                        } else {
                          setSelectedTransactions(selectedTransactions.filter(id => id !== transaction.id));
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">#{transaction.id}</div>
                      {transaction.transaction_hash && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {transaction.transaction_hash.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {transaction.first_name} {transaction.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">{transaction.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.payment_method === 'crypto' ? 'bg-purple-100 text-purple-800' :
                      transaction.payment_method === 'card' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {transaction.payment_method || 'crypto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(transaction.submitted_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-primary/90">
                        View
                      </button>
                      <button className="text-accent hover:text-accent/90">
                        Verify
                      </button>
                      {transaction.transaction_hash && (
                        <a
                          href={`https://etherscan.io/tx/${transaction.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-900"
                        >
                          Blockchain
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="crypto-card">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
          <div className="text-sm font-medium text-foreground">
            Total: {formatCurrency(filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionMonitoring;