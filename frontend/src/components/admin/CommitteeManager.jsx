import React, { useState, useEffect } from 'react';
import { fecAPI } from '../../lib/fec-api.js';

const CommitteeManager = () => {
  const [testCommittees, setTestCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCommittee, setNewCommittee] = useState({
    name: '',
    purpose: '',
    adminEmail: 'admin@example.com',
  });

  useEffect(() => {
    loadTestCommittees();
  }, []);

  const loadTestCommittees = async () => {
    try {
      setLoading(true);
      const committees = await fecAPI.getTestCommittees();
      setTestCommittees(committees);
      setError('');
    } catch (err) {
      setError('Failed to load test committees: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommittee = async (e) => {
    e.preventDefault();

    if (!newCommittee.name.trim()) {
      setError('Committee name is required');
      return;
    }

    try {
      setLoading(true);
      const result = await fecAPI.addTestCommittee(
        newCommittee.name,
        newCommittee.purpose || 'Testing purposes',
        newCommittee.adminEmail
      );

      setSuccess(`Test committee "${result.committee.name}" added successfully`);
      setNewCommittee({ name: '', purpose: '', adminEmail: 'admin@example.com' });
      setShowAddForm(false);
      await loadTestCommittees();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add committee: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="crypto-card text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">FEC Committee Manager</h1>
        <p className="text-muted-foreground">
          Manage test committees for development and testing purposes
        </p>
      </div>

      {/* Navigation */}
      <div className="crypto-card text-center">
        <div className="flex justify-center space-x-4">
          <a href="/" className="btn-primary">
            ← Back to Setup
          </a>
          <a href="/admin" className="btn-secondary">
            Campaign Admin
          </a>
          <a href="/fec-test" className="btn-secondary">
            Test FEC API
          </a>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="crypto-card bg-destructive/10 border-destructive/20 text-destructive">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="crypto-card bg-green-50 border-green-200 text-green-800">✅ {success}</div>
      )}

      {/* Add Committee Section */}
      <div className="crypto-card bg-secondary">
        <div className={`flex justify-between items-center ${showAddForm ? 'mb-4' : ''}`}>
          <h3 className="text-lg font-semibold text-foreground">Add Test Committee</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={
              showAddForm
                ? 'bg-destructive text-destructive-foreground btn-secondary'
                : 'btn-secondary'
            }
          >
            {showAddForm ? '✕ Cancel' : '+ Add Committee'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddCommittee} className="mt-4 space-y-4">
            <div>
              <label className="form-label">Committee Name *</label>
              <input
                type="text"
                value={newCommittee.name}
                onChange={(e) => setNewCommittee({ ...newCommittee, name: e.target.value })}
                placeholder="e.g., Test Campaign Committee 2024"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Test Purpose</label>
              <input
                type="text"
                value={newCommittee.purpose}
                onChange={(e) => setNewCommittee({ ...newCommittee, purpose: e.target.value })}
                placeholder="e.g., UI testing, Development testing"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                value={newCommittee.adminEmail}
                onChange={(e) => setNewCommittee({ ...newCommittee, adminEmail: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? '⏳ Adding...' : '✅ Add Committee'}
            </button>
          </form>
        )}
      </div>

      {/* Test Committees List */}
      <div className="crypto-card">
        <div className="border-b border-border bg-secondary rounded-t-lg p-6">
          <h3 className="text-lg font-semibold text-foreground">
            Test Committees ({testCommittees.length})
          </h3>
          <p className="text-base text-muted-foreground mt-2">
            These committees are available for testing the campaign setup flow
          </p>
        </div>

        <div className="p-6">
          {loading && testCommittees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ⏳ Loading test committees...
            </div>
          ) : testCommittees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-5xl mb-4">🗳️</div>
              <p className="text-base font-medium">No test committees found</p>
              <p className="text-sm mt-2">Add a test committee above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testCommittees.map((committee) => (
                <div
                  key={committee.id}
                  className="border border-border rounded-lg p-4 bg-secondary/50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-foreground mb-2">
                        {committee.name}
                      </h4>

                      <div className="mb-2">
                        <span className="bg-accent/20 text-accent px-2 py-1 rounded text-sm font-medium">
                          TEST COMMITTEE
                        </span>
                      </div>

                      <div className="text-base text-muted-foreground mb-2">
                        <strong>ID:</strong> {committee.id}
                      </div>

                      {committee.testPurpose && (
                        <div className="text-base text-muted-foreground mb-2">
                          <strong>Purpose:</strong> {committee.testPurpose}
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground/70">
                        Added by {committee.addedBy} • {formatDate(committee.createdAt)}
                      </div>
                    </div>

                    <div className="ml-4">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-medium">
                        ✅ ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="crypto-card bg-secondary">
        <h4 className="text-lg font-medium text-foreground mb-4">📋 Usage Instructions</h4>
        <ul className="text-base text-muted-foreground space-y-2 list-disc list-inside">
          <li>Test committees appear in the committee search during campaign setup</li>
          <li>They can be selected just like real FEC committees</li>
          <li>Use descriptive names to identify different test scenarios</li>
          <li>Test committees are prefixed with "TEST_" in their ID</li>
          <li>All test committees are marked as active by default</li>
        </ul>
      </div>

      {/* Development Info */}
      <div className="crypto-card bg-accent/10 border-accent/20 text-accent-foreground">
        <div className="text-base">
          <strong>🔧 Development Note:</strong> These test committees are stored separately from
          real FEC data and are only used for development and testing purposes.
        </div>
      </div>
    </div>
  );
};

export default CommitteeManager;
