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

  const StatCard = ({ title, value, icon, color = 'bg-blue-500', change }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={change >= 0 ? 'M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z' : 'M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z'} clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Monitoring</h2>
            <p className="text-gray-600 mt-1">Monitor and analyze all financial transactions</p>
          </div>
          <button
            onClick={exportTransactions}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
        
        <StatCard
          title="Total Transactions"
          value={summaryStats.totalCount.toLocaleString()}
          change={8}
          color="bg-green-500"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>}
        />
        
        <StatCard
          title="Average Amount"
          value={formatCurrency(summaryStats.averageAmount)}
          change={-3}
          color="bg-purple-500"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>}
        />
        
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(summaryStats.todayAmount)}
          change={25}
          color="bg-orange-500"
          icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, email, or transaction hash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Amounts</option>
              <option value="small">Under $100</option>
              <option value="medium">$100 - $999</option>
              <option value="large">$1000+</option>
            </select>
          </div>

          {selectedTransactions.length > 0 && (
            <div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Actions ({selectedTransactions.length})</option>
                <option value="export_selected">Export Selected</option>
                <option value="flag_selected">Flag for Review</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contributor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">#{transaction.id}</div>
                      {transaction.transaction_hash && (
                        <div className="text-xs text-gray-500 font-mono">
                          {transaction.transaction_hash.substring(0, 20)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.first_name} {transaction.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.submitted_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        View
                      </button>
                      <button className="text-purple-600 hover:text-purple-900">
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
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
          <div className="text-sm font-medium text-gray-900">
            Total: {formatCurrency(filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionMonitoring;