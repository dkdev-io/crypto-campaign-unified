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
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
          🔄 Loading donor pages...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#2a2a72', marginBottom: '0.5rem' }}>
          🌐 Donor Page Manager
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Manage auto-generated donor pages for all campaigns
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fee',
          color: '#c33',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '2rem',
          border: '1px solid #fcc'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#2a2a72' }}>{pages.length}</div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Pages</div>
        </div>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#28a745' }}>
            {pages.filter(p => p.status === 'active').length}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Active</div>
        </div>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#dc3545' }}>
            {pages.filter(p => p.status === 'error').length}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Errors</div>
        </div>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', color: '#17a2b8' }}>
            {pages.filter(p => 
              new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ).length}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>Last 24h</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ flex: '1', minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
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
          style={{
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
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
          style={{
            background: '#2a2a72',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Pages Table */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {filteredAndSortedPages.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#666'
          }}>
            {pages.length === 0 ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📄</div>
                <h3>No donor pages found</h3>
                <p>Generated donor pages will appear here after campaign setup completion.</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔍</div>
                <h3>No matching pages</h3>
                <p>Try adjusting your search or filter criteria.</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                    Campaign
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                    Committee
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                    Page URL
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e9ecef' }}>
                    Status
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                    Created
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e9ecef' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPages.map((page, index) => (
                  <tr
                    key={page.campaignId}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {page.campaignName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', fontFamily: 'monospace' }}>
                        ID: {page.campaignId}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: '#666' }}>
                      {page.committeeName}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <a
                        href={page.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#2a2a72',
                          textDecoration: 'none',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace'
                        }}
                      >
                        {page.pageUrl} ↗
                      </a>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          ...getStatusBadgeStyle(page.status),
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
                      {formatDate(page.createdAt)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => viewPageDetails(page)}
                          style={{
                            background: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => regeneratePage(page.campaignId)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                          title="Regenerate Page"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => deletePage(page.campaignId, page.campaignName)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto',
            margin: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: '#2a2a72', margin: 0 }}>
                📄 Page Details: {selectedPage.campaignName}
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div>
                <strong>Campaign:</strong><br />
                <span style={{ color: '#666' }}>{selectedPage.campaignName}</span>
              </div>
              <div>
                <strong>Committee:</strong><br />
                <span style={{ color: '#666' }}>{selectedPage.committeeName}</span>
              </div>
              <div>
                <strong>Page URL:</strong><br />
                <a
                  href={selectedPage.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2a2a72' }}
                >
                  {selectedPage.pageUrl} ↗
                </a>
              </div>
              <div>
                <strong>Status:</strong><br />
                <span
                  style={{
                    ...getStatusBadgeStyle(selectedPage.status),
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}
                >
                  {selectedPage.status}
                </span>
              </div>
            </div>

            {selectedPage.seoData && (
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <h5>SEO Information</h5>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  <div><strong>Title:</strong> {selectedPage.seoData.title}</div>
                  <div><strong>Description:</strong> {selectedPage.seoData.description}</div>
                  <div><strong>Keywords:</strong> {selectedPage.seoData.keywords}</div>
                </div>
              </div>
            )}

            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <strong>File Path:</strong><br />
              {selectedPage.filePath}
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '2rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => regeneratePage(selectedPage.campaignId)}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Regenerate Page
              </button>
              <a
                href={selectedPage.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#2a2a72',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
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