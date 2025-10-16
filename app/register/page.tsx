'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (authError) {
        setMessage('Error: ' + authError.message)
        setLoading(false)
        return
      }

      // 2. Create profile in database
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              full_name: fullName,
            }
          ])

        if (profileError) {
          setMessage('Profile error: ' + profileError.message)
        } else {
          setMessage('🎉 Registration successful! You can now sign in.')
          // Clear form
          setEmail('')
          setPassword('')
          setFullName('')
        }
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Legacy</h2>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-2">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Begin Eternal Journey'}
          </button>
        </form>
        
        {message && (
          <div className={`mt-4 text-center text-sm ${
            message.includes('Error') ? 'text-red-400' : 'text-green-400'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 text-sm">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}