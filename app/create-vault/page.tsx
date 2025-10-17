'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type VaultData = {
  title: string
  description: string
  unlockDate: string
  guardians: string[]
  files: File[]
  message: string
}

export default function CreateVault() {
  const [currentStep, setCurrentStep] = useState(1)
  const [vaultData, setVaultData] = useState<VaultData>({
    title: '',
    description: '',
    unlockDate: '',
    guardians: [],
    files: [],
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 6))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleInputChange = (field: keyof VaultData, value: string | File[]) => {
    setVaultData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGuardianAdd = (email: string) => {
    if (email && !vaultData.guardians.includes(email)) {
      setVaultData(prev => ({
        ...prev,
        guardians: [...prev.guardians, email]
      }))
    }
  }

  const handleGuardianRemove = (email: string) => {
    setVaultData(prev => ({
      ...prev,
      guardians: prev.guardians.filter(g => g !== email)
    }))
  }

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setVaultData(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles]
      }))
    }
  }

  const handleFileRemove = (index: number) => {
    setVaultData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
  }

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setCameraActive(false)
    }
  }

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setVaultData(prev => ({
              ...prev,
              files: [...prev.files, file]
            }))
          }
        }, 'image/jpeg', 0.8)
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const file = new File([blob], `video-${Date.now()}.webm`, { type: 'video/webm' })
        setVaultData(prev => ({
          ...prev,
          files: [...prev.files, file]
        }))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      
      // Stop recording after 30 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
        }
      }, 30000)

    } catch (error) {
      console.error('Error recording video:', error)
      alert('Unable to record video. Please check permissions.')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // TODO: Upload files to storage (we'll add Web3.Storage next)
      const fileUrls: string[] = [] // Will store uploaded file URLs

      // Create vault in database
      const { error } = await supabase
        .from('vaults')
        .insert([
          {
            user_id: session.user.id,
            title: vaultData.title,
            description: vaultData.description,
            unlock_date: vaultData.unlockDate,
            guardians: vaultData.guardians,
            files: fileUrls, // Store file URLs
            message: vaultData.message,
            status: 'active'
          }
        ])

      if (error) {
        console.error('Error creating vault:', error)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          EternalVault
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-300 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </nav>

      {/* Wizard Container */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3, 4, 5, 6].map(step => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step === currentStep 
                  ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white' 
                  : step < currentStep 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {step}
              </div>
              <div className="text-xs mt-2 text-gray-400">
                {['Basic Info', 'Description', 'Unlock Date', 'Guardians', 'Memories', 'Message'][step - 1]}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Name Your Legacy</h2>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Vault Title</label>
                <input
                  type="text"
                  value={vaultData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g., My Life Wisdom, Family Memories"
                />
              </div>
              <button
                onClick={handleNext}
                disabled={!vaultData.title}
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Description */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Describe Your Legacy</h2>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Description</label>
                <textarea
                  value={vaultData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-32"
                  placeholder="What does this vault contain? What story does it tell?"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Unlock Date */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Set Unlock Date</h2>
              <div>
                <label className="block text-gray-300 text-sm mb-2">When should this vault unlock?</label>
                <input
                  type="date"
                  value={vaultData.unlockDate}
                  onChange={(e) => handleInputChange('unlockDate', e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!vaultData.unlockDate}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Guardians */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Assign Guardians</h2>
              <p className="text-gray-400">Add trusted people who can help unlock your vault when the time comes.</p>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="email"
                    id="guardianEmail"
                    className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    placeholder="guardian@email.com"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('guardianEmail') as HTMLInputElement
                      if (input.value) {
                        handleGuardianAdd(input.value)
                        input.value = ''
                      }
                    }}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                
                <div className="space-y-2">
                  {vaultData.guardians.map(guardian => (
                    <div key={guardian} className="flex justify-between items-center bg-gray-700/50 rounded-lg px-4 py-2">
                      <span className="text-gray-300">{guardian}</span>
                      <button
                        onClick={() => handleGuardianRemove(guardian)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Add Memories */}
{currentStep === 5 && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">Add Memories</h2>
    <p className="text-gray-400">Upload photos or videos for your legacy vault.</p>
    
    <div className="space-y-4">
      <button 
        onClick={() => document.getElementById('fileInput')?.click()}
        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all"
      >
        📁 Upload Files
      </button>
      
      <input
        id="fileInput"
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            const files = Array.from(e.target.files)
            // We'll handle the files in the next step
            console.log('Files selected:', files)
          }
        }}
      />
    </div>
    
    <div className="flex space-x-4">
      <button
        onClick={handleBack}
        className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
      >
        Back
      </button>
      <button
        onClick={handleNext}
        className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all"
      >
        Continue
      </button>
    </div>
  </div>
)}

          {/* Step 6: Final Message */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Final Message</h2>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Your message to the future</label>
                <textarea
                  value={vaultData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-48"
                  placeholder="Write a heartfelt message that will be revealed when your vault opens..."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating Vault...' : 'Create Eternal Vault'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}