'use client';

import { useState, useEffect } from 'react';
import { Copy, Link, Trash2, ExternalLink, Plus, LogIn, LogOut, User } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

interface UrlData {
  id: number;
  slug: string;
  originalUrl: string;
  title?: string;
  description?: string;
  shortenedUrl: string;
  createdAt: string;
  clicks?: number;
}

interface UserData {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [authErrors, setAuthErrors] = useState<string[]>([]);
  const [urlErrors, setUrlErrors] = useState<string[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
      fetchUrls();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.data);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const fetchUrls = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(`${API_BASE}/api/urls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUrls(response.data.data.urls);
    } catch (error) {
      console.error('Error fetching URLs:', error);
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const shortenUrl = async () => {
    if (!originalUrl.trim()) {
      setUrlErrors(['Please enter a URL']);
      return;
    }

    if (!validateUrl(originalUrl)) {
      setUrlErrors(['Please enter a valid URL']);
      return;
    }

    setLoading(true);
    setUrlErrors([]); // Clear previous errors
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/api/urls`, {
        originalUrl,
        slug: customSlug || undefined,
        title: `Shortened URL for ${originalUrl}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newUrl = response.data.data;
      setUrls(prev => [newUrl, ...prev]);
      setOriginalUrl('');
      setCustomSlug('');
      setUrlErrors([]);
      toast.success('URL shortened successfully!');
    } catch (error: any) {
      const responseData = error.response?.data;
      
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Store validation errors for display in form
        const errors = responseData.errors.map((err: any) => `${err.field}: ${err.message}`);
        setUrlErrors(errors);
      } else {
        const message = responseData?.message || 'Failed to shorten URL';
        setUrlErrors([message]);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const deleteUrl = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/api/urls/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUrls(prev => prev.filter(url => url.id !== id));
      toast.success('URL deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete URL');
    }
  };

  const handleAuth = async (type: 'login' | 'register') => {
    try {
      setAuthErrors([]); // Clear previous errors
      const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API_BASE}${endpoint}`, {
        email: authData.email,
        password: authData.password,
        ...(type === 'register' && { firstName: authData.firstName, lastName: authData.lastName })
      });

      const { token, user: userData } = response.data.data;
      localStorage.setItem('token', token);
      setUser(userData);
      setShowLogin(false);
      setShowRegister(false);
      setAuthData({ email: '', password: '', firstName: '', lastName: '' });
      setAuthErrors([]);
      toast.success(`${type === 'login' ? 'Logged in' : 'Registered'} successfully!`);
      fetchUrls();
    } catch (error: any) {
      const responseData = error.response?.data;
      
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Store validation errors for display in modal
        const errors = responseData.errors.map((err: any) => `${err.field}: ${err.message}`);
        setAuthErrors(errors);
      } else {
        const message = responseData?.message || `Failed to ${type}`;
        setAuthErrors([message]);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUrls([]);
    toast.success('Logged out successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Link className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">URL Shortener</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  <span>{user.firstName || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
                <button
                  onClick={() => setShowRegister(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* URL Shortener Form */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Shorten Your URL
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Original URL
                </label>
                <input
                  type="url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very/long/url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Slug (optional)
                </label>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="my-custom-slug"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              {/* Error Display */}
              {urlErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    {urlErrors.map((error, index) => (
                      <div key={index} className="mb-1 last:mb-0">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={shortenUrl}
                disabled={loading || !user}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {user ? 'Shorten URL' : 'Please login to shorten URLs'}
              </button>
            </div>
          </div>
        </div>

        {/* URLs List */}
        {user && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Shortened URLs
            </h3>
            
            {urls.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No shortened URLs yet. Create your first one above!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {urls.map((url) => (
                  <div key={url.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {url.title || 'Untitled URL'}
                          </h4>
                          {url.clicks !== undefined && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {url.clicks} clicks
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">
                          {url.originalUrl}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                            {url.shortenedUrl}
                          </span>
                          <button
                            onClick={() => copyToClipboard(url.shortenedUrl)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={url.shortenedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteUrl(url.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auth Modals */}
        {(showLogin || showRegister) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {showLogin ? 'Login' : 'Register'}
              </h3>
              
              <div className="space-y-4">
                {showRegister && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={authData.firstName}
                        onChange={(e) => setAuthData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={authData.lastName}
                        onChange={(e) => setAuthData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={authData.email}
                    onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={authData.password}
                    onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                {/* Error Display */}
                {authErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 dark:bg-red-900/20 dark:border-red-800">
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {authErrors.map((error, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          • {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleAuth(showLogin ? 'login' : 'register')}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                  >
                    {showLogin ? 'Login' : 'Register'}
                  </button>
                  <button
                    onClick={() => {
                      setShowLogin(false);
                      setShowRegister(false);
                      setAuthData({ email: '', password: '', firstName: '', lastName: '' });
                      setAuthErrors([]);
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
