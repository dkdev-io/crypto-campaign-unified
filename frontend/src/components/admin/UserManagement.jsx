import React, { useState, useEffect } from 'react'
import { useAdmin } from '../../contexts/AdminContext'
import { supabase } from '../../lib/supabase'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  const { admin, isAdmin, isSuperAdmin } = useAdmin()

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers()
    }
  }, [admin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      // Check if Supabase is configured
      if (!supabase.from) {
        setError('Database not configured. Please set up Supabase to manage users.')
        setUsers([])
        return
      }

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
      if (error.message.includes('Supabase not configured')) {
        setError('Database not configured. Please set up Supabase to manage users.')
      } else {
        setError('Error loading users: ' + error.message)
      }
      setUsers([])
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

      fetchUsers()
    } catch (error) {
      alert('Error updating user role: ' + error.message)
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
      <div className="crypto-card text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">🔒 Access Denied</h2>
        <p className="text-muted-foreground">You don't have permission to view user management.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="crypto-card text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">Error</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button className="btn-primary" onClick={fetchUsers}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crypto-card">
        <h2 className="text-2xl font-bold text-foreground">👥 User Management</h2>
        <p className="text-muted-foreground">Manage all users in the system (Admin Only)</p>
      </div>

      {/* Controls */}
      <div className="crypto-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Search Users</label>
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Filter by Role</label>
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

          <div>
            <label className="form-label">Sort by</label>
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="crypto-card text-center">
          <h3 className="text-2xl font-bold text-foreground">{users.length}</h3>
          <p className="text-muted-foreground">Total Users</p>
        </div>
        <div className="crypto-card text-center">
          <h3 className="text-2xl font-bold text-foreground">{users.filter(u => u.email_confirmed).length}</h3>
          <p className="text-muted-foreground">Verified Users</p>
        </div>
        <div className="crypto-card text-center">
          <h3 className="text-2xl font-bold text-foreground">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</h3>
          <p className="text-muted-foreground">Administrators</p>
        </div>
        <div className="crypto-card text-center">
          <h3 className="text-2xl font-bold text-foreground">{users.filter(u => u.last_login_at && new Date(u.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</h3>
          <p className="text-muted-foreground">Active This Week</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="crypto-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaigns</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                      {user.job_title && <div className="text-sm text-muted-foreground">{user.job_title}</div>}
                      {user.company && <div className="text-sm text-muted-foreground">{user.company}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{user.email}</div>
                    {user.phone && <div className="text-sm text-muted-foreground">{user.phone}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded form-input ${
                        user.role === 'super_admin' ? 'text-primary' : 
                        user.role === 'admin' ? 'text-accent-foreground' : 
                        'text-muted-foreground'
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {userProfile?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.email_confirmed 
                        ? 'bg-accent/20 text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.email_confirmed ? '✅ Verified' : '⏳ Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {user.campaign_members && user.campaign_members.length > 0 ? (
                        <div className="space-y-1">
                          {user.campaign_members.map((membership, index) => (
                            <div key={index} className="text-xs text-foreground bg-secondary/50 px-2 py-1 rounded">
                              {membership.campaigns?.campaign_name || 'Unknown Campaign'}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">No campaigns</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-xs">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      {user.last_login_at && (
                        <div className="text-muted-foreground text-xs">
                          Last: {new Date(user.last_login_at).toLocaleDateString()}
                        </div>
                      )}
                      {user.login_count && (
                        <div className="text-muted-foreground text-xs">
                          {user.login_count} logins
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.id !== userProfile?.id && (
                      <button
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="crypto-card">
        <h4 className="text-lg font-semibold text-foreground mb-4">Admin Capabilities:</h4>
        <ul className="space-y-2 text-muted-foreground">
          <li>👁️ View all user profiles and contact information</li>
          <li>🔧 Manage user roles and permissions</li>
          <li>📊 Monitor user activity and login patterns</li>
          <li>✅ See email verification status</li>
          <li>🏢 View campaign memberships</li>
        </ul>
        
        <div className="mt-4 p-4 bg-muted/20 rounded-lg">
          <strong className="text-foreground">Privacy Notice:</strong>
          <span className="text-muted-foreground"> This information is only visible to administrators and is used for system management and support purposes. User privacy is protected according to our privacy policy.</span>
        </div>
      </div>
    </div>
  )
}

export default UserManagement