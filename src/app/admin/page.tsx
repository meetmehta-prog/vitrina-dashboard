'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string | null;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated' && !(session.user as any)?.isAdmin) {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail.trim(), 
          name: newName.trim() || null 
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ User ${newEmail} added successfully`);
        setNewEmail('');
        setNewName('');
        loadUsers();
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error adding user');
    }
  };

  const toggleUserStatus = async (email: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          isActive: !currentStatus 
        })
      });

      if (response.ok) {
        setMessage(`✅ User ${email} ${!currentStatus ? 'activated' : 'deactivated'}`);
        loadUsers();
      } else {
        const data = await response.json();
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error updating user');
    }
  };

  const removeUser = async (email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) return;

    try {
      const response = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage(`✅ User ${email} removed successfully`);
        loadUsers();
      } else {
        const data = await response.json();
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Error removing user');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">👥 User Management</h1>
          
          {message && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm">{message}</p>
            </div>
          )}

          {/* Add New User Form */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">➕ Add New User</h2>
            <form onSubmit={addUser} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add User
              </button>
            </form>
          </div>

          {/* Users List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">📋 Current Users ({users.length})</h2>
            
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users found. Add the first user above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Role</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Last Login</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-mono text-sm">
                          {user.email}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {user.name || <span className="text-gray-400 italic">No name</span>}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isAdmin ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          {user.lastLogin 
                            ? new Date(user.lastLogin).toLocaleString()
                            : <span className="text-gray-400 italic">Never</span>
                          }
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleUserStatus(user.email, user.isActive)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                user.isActive
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => removeUser(user.email)}
                              className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                            >
                              Remove
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

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📝 How to use:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Add new users by entering their Gmail/G-Suite email address</li>
              <li>• Users sign in with their Google account</li>
              <li>• Only active users can sign in to the dashboard</li>
              <li>• Only <strong>mehtameet005@gmail.com</strong> has admin access</li>
              <li>• Admins can manage user access and permissions</li>
              <li>• Deactivate users to revoke access without deleting them</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}