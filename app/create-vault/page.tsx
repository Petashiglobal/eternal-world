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

  // ... (Keep all the existing JSX for steps 1-4 the same)

  {/* Step 5: Add Memories */}
  {currentStep === 5 && (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Add Memories</h2>
      <p className="text-gray-400">Upload photos, videos, or record new memories for your legacy.</p>
      
      {/* File Upload */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
          >
            📁 Upload Files
          </button>
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all"
          >
            {cameraActive ? '📷 Stop Camera' : '📷 Take Photo'}
          </button>
          <button
            onClick={startRecording}
            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all"
          >
            🎥 Record Video
          </button>
        </div>

        {/* Camera Preview */}
        {cameraActive && (
          <div className="space-y-4">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-64 bg-black rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <button
              onClick={takePicture}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              📸 Capture Photo
            </button>
          </div>
        )}

        {/* File List */}
        {vaultData.files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-white font-semibold">Selected Files:</h3>
            {vaultData.files.map((file, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700/50 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-3">
                  {file.type.startsWith('image/') && <span>🖼️</span>}
                  {file.type.startsWith('video/') && <span>🎥</span>}
                  {file.type.startsWith('audio/') && <span>🎵</span>}
                  <span className="text-gray-300 text-sm">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => handleFileRemove(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
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
  {/* Step 6: Final Message (updated from step 5) */}
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