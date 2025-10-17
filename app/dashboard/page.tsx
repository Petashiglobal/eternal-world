'use client'
import { userDID } from '../../src/lib/didUtils'
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

interface Vault {
  id: string
  title: string
  description: string
  unlock_date: string
  guardians: string[]
  status: string
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [vaults, setVaults] = useState<Vault[]>([])
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      } else {
        setProfile(profileData)
      }

      // Get user's vaults
      const { data: vaultsData, error: vaultsError } = await supabase
        .from('vaults')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (vaultsError) {
        console.error('Error fetching vaults:', vaultsError)
      } else {
        setVaults(vaultsData || [])
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDaysUntilUnlock = (unlockDate: string) => {
    const today = new Date()
    const unlock = new Date(unlockDate)
    const diffTime = unlock.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
  <div className="flex items-center space-x-3">
    <img 
      src={`https://www.gravatar.com/avatar/${user?.id}?s=40&d=identicon&r=pg`}
      alt="Profile"
      className="w-8 h-8 rounded-full"
    />
    <div>
      <div className="text-gray-300">Welcome, {profile?.full_name || user?.email}</div>
      <div className="text-xs text-cyan-400">DID: {userDID.slice(0, 20)}...</div>
    </div>
  </div>
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
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-cyan-400 text-2xl mb-2">{vaults.length}</div>
            <div className="text-gray-400">Active Vaults</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-purple-400 text-2xl mb-2">
              {vaults.reduce((acc, vault) => acc + vault.guardians.length, 0)}
            </div>
            <div className="text-gray-400">Total Guardians</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-green-400 text-2xl mb-2">
              {vaults.filter(vault => new Date(vault.unlock_date) > new Date()).length}
            </div>
            <div className="text-gray-400">Future Vaults</div>
          </div>
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="text-yellow-400 text-2xl mb-2">
              {vaults.filter(vault => new Date(vault.unlock_date) <= new Date()).length}
            </div>
            <div className="text-gray-400">Ready to Open</div>
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

        {/* Vaults List */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Vaults</h2>
            <span className="text-gray-400">{vaults.length} vaults</span>
          </div>

          {vaults.length === 0 ? (
            <div className="text-gray-400 text-center py-12">
              <div className="text-6xl mb-4">🌌</div>
              <p className="text-xl mb-2">No vaults created yet</p>
              <p className="text-sm mb-6">Start preserving your legacy for future generations</p>
              <button 
                onClick={() => router.push('/create-vault')}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all"
              >
                Create Your First Vault
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {vaults.map((vault) => {
                const daysUntilUnlock = getDaysUntilUnlock(vault.unlock_date)
                const isUnlocked = daysUntilUnlock <= 0

                return (
                  <div key={vault.id} className="bg-gray-700/30 border border-gray-600/50 rounded-xl p-6 hover:border-purple-500/50 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-white">{vault.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isUnlocked 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {isUnlocked ? 'Ready to Open' : `${daysUntilUnlock} days`}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{vault.description}</p>
                    
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-500">
                        Unlocks: {formatDate(vault.unlock_date)}
                      </div>
                      <div className="text-gray-500">
                        {vault.guardians.length} guardian{vault.guardians.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {vault.guardians.length > 0 && (
                      <div className="mt-3">
                        <div className="text-gray-500 text-sm mb-2">Guardians:</div>
                        <div className="flex flex-wrap gap-2">
                          {vault.guardians.map((guardian, index) => (
                            <span key={index} className="bg-gray-600/50 text-gray-300 px-2 py-1 rounded text-xs">
                              {guardian}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}