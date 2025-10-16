'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading your legacy...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          EternalVault
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-300">Welcome, {profile?.full_name || user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Your Digital Legacy</h1>
        
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-cyan-400 text-2xl mb-2">0</div>
            <div className="text-gray-400">Active Vaults</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-purple-400 text-2xl mb-2">0</div>
            <div className="text-gray-400">Guardians</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-green-400 text-2xl mb-2">0</div>
            <div className="text-gray-400">Memories Saved</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/create-vault')}
              className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all transform hover:scale-105"
            >
              Create New Vault
            </button>
            <button className="bg-gray-700/50 text-white py-4 rounded-xl font-semibold hover:bg-gray-600/50 transition-all border border-gray-600">
              Manage Guardians
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Vaults</h2>
          <div className="text-gray-400 text-center py-8">
            <div className="text-6xl mb-4">🌌</div>
            <p>No vaults created yet</p>
            <button 
              onClick={() => router.push('/create-vault')}
              className="mt-4 text-cyan-400 hover:text-cyan-300"
            >
              Create your first vault →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}