/**
 * Admin Dashboard for Managing Generated Donor Pages
 * Provides comprehensive management interface for all auto-generated donor pages
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const DonorPageManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPage, setSelectedPage] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load generated pages on component mount
  useEffect(() => {
    loadGeneratedPages();
  }, []);

  /**
   * Load all generated donor pages
   */
  const loadGeneratedPages = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/donor-pages');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load pages');
      }

      setPages(data.pages || []);
      
    } catch (err) {
      console.error('Failed to load pages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Regenerate a donor page
   */
  const regeneratePage = async (campaignId) => {
    try {
      setError('');
      
      const response = await fetch(`/api/admin/donor-pages/${campaignId}/regenerate`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate page');
      }

      // Refresh the list
      await loadGeneratedPages();
      
      alert('Page regenerated successfully!');

    } catch (err) {
      console.error('Failed to regenerate page:', err);
      setError(err.message);
    }
  };

  /**
   * Delete a donor page
   */
  const deletePage = async (campaignId, campaignName) => {
    if (!confirm(`Are you sure you want to delete the donor page for "${campaignName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      
      const response = await fetch(`/api/admin/donor-pages/${campaignId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete page');
      }

      // Refresh the list
      await loadGeneratedPages();
      
      alert('Page deleted successfully!');

    } catch (err) {
      console.error('Failed to delete page:', err);
      setError(err.message);
    }
  };

  /**
   * View page details
   */
  const viewPageDetails = (page) => {
    setSelectedPage(page);
    setShowDetails(true);
  };

  /**
   * Filter and sort pages
   */
  const filteredAndSortedPages = pages
    .filter(page => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          page.campaignName.toLowerCase().includes(searchLower) ||
          page.committeeName.toLowerCase().includes(searchLower) ||
          page.pageUrl.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && page.status !== 'active') return false;
        if (statusFilter === 'inactive' && page.status !== 'inactive') return false;
        if (statusFilter === 'error' && page.status !== 'error') return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'lastSyncAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  /**
   * Get status badge color
   */
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#28a745', color: 'white' };
      case 'inactive':
        return { backgroundColor: '#6c757d', color: 'white' };
      case 'error':
        return { backgroundColor: '#dc3545', color: 'white' };
      default:
        return { backgroundColor: '#17a2b8', color: 'white' };
    }
  };

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
      <div className="crypto-card text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          🌐 Donor Page Manager
        </h1>
        <p className="text-muted-foreground">
          Manage auto-generated donor pages for all campaigns
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="crypto-card bg-destructive/10 border-destructive/20 text-destructive">
          ❌ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="crypto-card text-center">
          <div className="text-2xl font-bold text-foreground">{pages.length}</div>
          <div className="text-sm text-muted-foreground">Total Pages</div>
        </div>
        <div className="crypto-card text-center">
          <div className="text-2xl font-bold text-green-600">
            {pages.filter(p => p.status === 'active').length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="crypto-card text-center">
          <div className="text-2xl font-bold text-destructive">
            {pages.filter(p => p.status === 'error').length}
          </div>
          <div className="text-sm text-muted-foreground">Errors</div>
        </div>
        <div className="crypto-card text-center">
          <div className="text-2xl font-bold text-primary">
            {pages.filter(p => 
              new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length}
          </div>
          <div className="text-sm text-muted-foreground">Last 24h</div>
        </div>
      </div>

      {/* Controls */}
      <div className="crypto-card flex flex-wrap gap-4 items-center">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-input"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="error">Error</option>
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split('-');
            setSortBy(field);
            setSortOrder(order);
          }}
          className="form-input"
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
          <option value="campaignName-asc">Name A-Z</option>
          <option value="campaignName-desc">Name Z-A</option>
          <option value="lastSyncAt-desc">Recently Updated</option>
        </select>

        {/* Refresh Button */}
        <button
          onClick={loadGeneratedPages}
          className="btn-primary"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Pages Table */}
      <div className="crypto-card overflow-hidden">
        {filteredAndSortedPages.length === 0 ? (
          <div className="py-12 px-8 text-center text-muted-foreground">
            {pages.length === 0 ? (
              <>
                <div className="text-5xl mb-4">📄</div>
                <h3 className="text-lg font-semibold text-foreground">No donor pages found</h3>
                <p className="text-muted-foreground">Generated donor pages will appear here after campaign setup completion.</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-foreground">No matching pages</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-secondary">
                  <th className="p-4 text-left border-b border-border text-muted-foreground font-medium">
                    Campaign
                  </th>
                  <th className="p-4 text-left border-b border-border text-muted-foreground font-medium">
                    Committee
                  </th>
                  <th className="p-4 text-left border-b border-border text-muted-foreground font-medium">
                    Page URL
                  </th>
                  <th className="p-4 text-center border-b border-border text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="p-4 text-left border-b border-border text-muted-foreground font-medium">
                    Created
                  </th>
                  <th className="p-4 text-center border-b border-border text-muted-foreground font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPages.map((page, index) => (
                  <tr
                    key={page.campaignId}
                    className={`border-b border-border ${index % 2 === 0 ? 'bg-card' : 'bg-secondary/30'}`}
                  >
                    <td className="p-4">
                      <div className="font-medium text-foreground mb-1">
                        {page.campaignName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        ID: {page.campaignId}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {page.committeeName}
                    </td>
                    <td className="p-4">
                      <a
                        href={page.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/90 text-sm font-mono"
                      >
                        {page.pageUrl} ↗
                      </a>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                        page.status === 'active' ? 'bg-green-100 text-green-700' :
                        page.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        page.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {formatDate(page.createdAt)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => viewPageDetails(page)}
                          className="bg-primary text-primary-foreground border-none px-2 py-1 rounded text-xs cursor-pointer"
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => regeneratePage(page.campaignId)}
                          className="bg-green-600 text-white border-none px-2 py-1 rounded text-xs cursor-pointer"
                          title="Regenerate Page"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => deletePage(page.campaignId, page.campaignName)}
                          className="bg-destructive text-destructive-foreground border-none px-2 py-1 rounded text-xs cursor-pointer"
                          title="Delete Page"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Page Details Modal */}
      {showDetails && selectedPage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card p-8 rounded-lg max-w-3xl max-h-[80vh] overflow-auto m-4 shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-foreground">
                📄 Page Details: {selectedPage.campaignName}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="bg-destructive text-destructive-foreground px-4 py-2 rounded cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                <strong className="text-foreground">Campaign:</strong><br />
                <span className="text-muted-foreground">{selectedPage.campaignName}</span>
              </div>
              <div>
                <strong className="text-foreground">Committee:</strong><br />
                <span className="text-muted-foreground">{selectedPage.committeeName}</span>
              </div>
              <div>
                <strong className="text-foreground">Page URL:</strong><br />
                <a
                  href={selectedPage.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/90"
                >
                  {selectedPage.pageUrl} ↗
                </a>
              </div>
              <div>
                <strong className="text-foreground">Status:</strong><br />
                <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                  selectedPage.status === 'active' ? 'bg-green-100 text-green-700' :
                  selectedPage.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                  selectedPage.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedPage.status}
                </span>
              </div>
            </div>

            {selectedPage.seoData && (
              <div className="bg-secondary p-4 rounded mb-4">
                <h5 className="font-medium text-foreground mb-2">SEO Information</h5>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div><strong>Title:</strong> {selectedPage.seoData.title}</div>
                  <div><strong>Description:</strong> {selectedPage.seoData.description}</div>
                  <div><strong>Keywords:</strong> {selectedPage.seoData.keywords}</div>
                </div>
              </div>
            )}

            <div className="bg-secondary p-4 rounded font-mono text-sm max-h-48 overflow-auto">
              <strong className="text-foreground">File Path:</strong><br />
              <span className="text-muted-foreground">{selectedPage.filePath}</span>
            </div>

            <div className="flex gap-4 mt-8 justify-center">
              <button
                onClick={() => regeneratePage(selectedPage.campaignId)}
                className="btn-secondary"
              >
                🔄 Regenerate Page
              </button>
              <a
                href={selectedPage.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                🌐 View Page
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorPageManager;