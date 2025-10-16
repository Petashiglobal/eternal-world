'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if supabase client is available
    if (!supabase) {
      setMessage('Authentication service not available')
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setMessage(error.message)
      } else {
        // Redirect to dashboard on successful login
        window.location.href = '/dashboard'
      }
    } catch {
      setMessage('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        {message && (
          <div className="mt-4 text-center text-sm text-gray-300">
            {message}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 text-sm">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}