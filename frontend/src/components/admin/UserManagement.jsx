import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const { userProfile } = useAuth()

  useEffect(() => {
    if (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') {
      fetchUsers()
    }
  }, [userProfile])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          campaign_members (
            campaign_id,
            campaigns (
              campaign_name
            )
          )
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      setError('Error loading users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Refresh users list
      fetchUsers()
    } catch (error) {
      alert('Error updating user role: ' + error.message)
    }
  }

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      // Note: We don't have a status field in users table, but this is where you'd implement it
      // For now, we'll just show how it would work
      console.log(`Would toggle user ${userId} to ${newStatus}`)
      alert(`User status toggle not yet implemented. Would set to: ${newStatus}`)
    } catch (error) {
      alert('Error updating user status: ' + error.message)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole

    return matchesSearch && matchesRole
  })

  if (userProfile?.role !== 'admin' && userProfile?.role !== 'super_admin') {
    return (
      <div className="admin-access-denied">
        <h2>🔒 Access Denied</h2>
        <p>You don't have permission to view user management.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchUsers}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>👥 User Management</h2>
        <p>Manage all users in the system (Admin Only)</p>
      </div>

      <div className="user-management-controls">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="form-input"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        <div className="sort-controls">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
              fetchUsers()
            }}
            className="form-input"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="full_name-asc">Name A-Z</option>
            <option value="full_name-desc">Name Z-A</option>
            <option value="last_login_at-desc">Last Login</option>
            <option value="email_confirmed-desc">Verified First</option>
          </select>
        </div>
      </div>

      <div className="users-stats">
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.email_confirmed).length}</h3>
          <p>Verified Users</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</h3>
          <p>Administrators</p>
        </div>
        <div className="stat-card">
          <h3>{users.filter(u => u.last_login_at && new Date(u.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</h3>
          <p>Active This Week</p>
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Campaigns</th>
              <th>Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="user-info">
                    <strong>{user.full_name}</strong>
                    {user.job_title && <div className="user-title">{user.job_title}</div>}
                    {user.company && <div className="user-company">{user.company}</div>}
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{user.email}</div>
                    {user.phone && <div className="phone">{user.phone}</div>}
                  </div>
                </td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className={`role-select role-${user.role}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    {userProfile?.role === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </td>
                <td>
                  <div className="user-status">
                    <span className={`status-badge ${user.email_confirmed ? 'verified' : 'unverified'}`}>
                      {user.email_confirmed ? '✅ Verified' : '⏳ Unverified'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="user-campaigns">
                    {user.campaign_members && user.campaign_members.length > 0 ? (
                      <div>
                        {user.campaign_members.map((membership, index) => (
                          <div key={index} className="campaign-membership">
                            {membership.campaigns?.campaign_name || 'Unknown Campaign'}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="no-campaigns">No campaigns</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="activity-info">
                    <div className="created-date">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    {user.last_login_at && (
                      <div className="last-login">
                        Last login: {new Date(user.last_login_at).toLocaleDateString()}
                      </div>
                    )}
                    {user.login_count && (
                      <div className="login-count">
                        {user.login_count} logins
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-actions">
                    {user.id !== userProfile?.id && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          const userDetails = `
                            ID: ${user.id}
                            Name: ${user.full_name}
                            Email: ${user.email}
                            Role: ${user.role}
                            Phone: ${user.phone || 'N/A'}
                            Company: ${user.company || 'N/A'}
                            Created: ${new Date(user.created_at).toLocaleString()}
                            Last Login: ${user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                            Login Count: ${user.login_count || 0}
                            Email Confirmed: ${user.email_confirmed ? 'Yes' : 'No'}
                            Timezone: ${user.timezone || 'N/A'}
                          `
                          alert('User Details:\n' + userDetails)
                        }}
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="user-management-info">
        <h4>Admin Capabilities:</h4>
        <ul>
          <li>👁️ View all user profiles and contact information</li>
          <li>🔧 Manage user roles and permissions</li>
          <li>📊 Monitor user activity and login patterns</li>
          <li>✅ See email verification status</li>
          <li>🏢 View campaign memberships</li>
        </ul>
        
        <div className="privacy-notice">
          <strong>Privacy Notice:</strong> This information is only visible to administrators and is used for system management and support purposes. User privacy is protected according to our privacy policy.
        </div>
      </div>
    </div>
  )
}

export default UserManagement