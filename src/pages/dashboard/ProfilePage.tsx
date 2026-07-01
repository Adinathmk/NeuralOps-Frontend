import { useState, useRef, ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Camera, Shield, User as UserIcon } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@store/index'
import { authApi } from '@features/auth/api/authApi'
import { updateUser } from '@store/slices/authSlice'
import { Card, CardContent } from '@components/common/Card'
import { Button } from '@components/common/Button'
import { Input } from '@components/common/Input'
import { Badge } from '@components/common/Badge'
import { Modal } from '@components/common/Modal'
import { Avatar } from '@components/common/Avatar'
import { useToast } from '@hooks/useProtectedRoute'
import type { ChangePasswordFormData } from '@/types'

const passwordSchema = z.object({
  current_password:     z.string().min(1, 'Required'),
  new_password:         z.string().min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Uppercase required')
    .regex(/[0-9]/, 'Number required'),
  new_password_confirm: z.string(),
}).refine(d => d.new_password === d.new_password_confirm, {
  message: 'Passwords do not match',
  path: ['new_password_confirm'],
})

type PwFormData = ChangePasswordFormData & { new_password_confirm: string }

export default function ProfilePage() {
  const user = useAppSelector(s => s.auth.user)
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  const [pwLoading, setPwLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    setIsPictureModalOpen(true)
  }

  const handleDeleteAvatar = async () => {
    setIsDeleting(true)
    try {
      const res = await authApi.deleteProfilePicture()
      dispatch(updateUser(res.data))
      toast({ type: 'success', title: 'Profile picture removed' })
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Failed to remove profile picture' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const res = await authApi.getProfilePicturePresignedUrl(file.name, file.type)
      
      if (!res.data || !res.data.url || !res.data.object_key) {
        throw new Error('Failed to generate upload URL')
      }
      
      const { url, object_key } = res.data
      
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      const confirmRes = await authApi.confirmProfilePictureUpload(object_key)
      if (!confirmRes.data) {
        throw new Error('Failed to confirm profile picture upload')
      }
      
      dispatch(updateUser(confirmRes.data))
      toast({ type: 'success', title: 'Profile picture updated' })
      setIsPictureModalOpen(false)
    } catch (err) {
      console.error(err)
      toast({ type: 'error', title: 'Failed to upload profile picture' })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PwFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onChangePassword = async (data: PwFormData) => {
    setPwLoading(true)
    try {
      await authApi.changePassword({
        current_password:     data.current_password,
        new_password:         data.new_password,
        new_password_confirm: data.new_password_confirm,
      })
      toast({ type: 'success', title: 'Password changed', description: 'Please log in again on other devices.' })
      reset()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast({ type: 'error', title: e.response?.data?.message ?? 'Failed to change password' })
    } finally {
      setPwLoading(false)
    }
  }

  const fullName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'No Name Provided'

  return (
    <div className="w-full space-y-10 pb-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your personal information and security settings.</p>
      </div>

      <div className="space-y-12">
        {/* Avatar Section (Top) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-white overflow-hidden relative group-hover:opacity-80 transition-opacity">
              <Avatar user={user} size="2xl" />
            </div>
            <button 
              onClick={handleAvatarClick}
              className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
            >
              <Camera size={24} className="text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
            <p className="text-slate-500 mt-0.5 mb-2">{user?.email}</p>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="px-2.5 py-0.5 text-xs font-semibold">{user?.role}</Badge>
              {user?.is_email_verified
                ? <Badge variant="success" className="px-2.5 py-0.5 flex items-center gap-1"><CheckCircle2 size={12} /> Verified</Badge>
                : <Badge variant="warning" className="px-2.5 py-0.5 flex items-center gap-1"><AlertCircle size={12} /> Unverified</Badge>
              }
            </div>
          </div>
        </motion.div>

        <Modal 
          open={isPictureModalOpen} 
          onClose={() => setIsPictureModalOpen(false)}
          title="Profile Picture"
        >
          <div className="flex flex-col items-center space-y-6 pt-2">
            <div className="h-48 w-48 rounded-full flex items-center justify-center text-white shadow-sm ring-4 ring-slate-100 overflow-hidden">
              <Avatar user={user} size="2xl" className="!h-48 !w-48 !text-6xl" />
            </div>
            
            <div className="flex gap-4 w-full">
              <Button 
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
              >
                Upload New
              </Button>
              {user?.avatar_url && (
                <Button 
                  variant="outline" 
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  onClick={async () => {
                    await handleDeleteAvatar()
                    setIsPictureModalOpen(false)
                  }}
                  isLoading={isDeleting}
                  disabled={isUploading}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </Modal>

        <hr className="border-slate-100" />

        {/* Basic Information Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UserIcon size={16} className="text-slate-400" /> Basic Information
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              This information will be displayed publicly across the NeuralOps workspace.
            </p>
          </div>
          <div className="lg:col-span-2 max-w-2xl">
            <Card className="shadow-sm border-slate-200/60">
              <CardContent className="p-6 space-y-6">
                <Input 
                  label="Full Name" 
                  defaultValue={fullName} 
                  readOnly 
                  className="bg-slate-50/50 text-slate-600 cursor-not-allowed"
                  hint="Contact your workspace administrator to change your name."
                />
                <Input 
                  label="Email Address" 
                  defaultValue={user?.email} 
                  readOnly 
                  className="bg-slate-50/50 text-slate-600 cursor-not-allowed"
                />
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <hr className="border-slate-100" />

        {/* Security / Password Section */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield size={16} className="text-slate-400" /> Password
            </h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>
          <div className="lg:col-span-2 max-w-2xl">
            <Card className="shadow-sm border-slate-200/60">
              <CardContent className="p-0">
                <form onSubmit={handleSubmit(onChangePassword)}>
                  <div className="p-6 space-y-5">
                    <Input
                      label="Current Password"
                      type="password"
                      placeholder="Enter current password"
                      error={errors.current_password?.message}
                      {...register('current_password')}
                    />
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="At least 8 characters"
                      error={errors.new_password?.message}
                      {...register('new_password')}
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="Retype new password"
                      error={errors.new_password_confirm?.message}
                      {...register('new_password_confirm')}
                    />
                  </div>
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end rounded-b-xl">
                    <Button type="submit" isLoading={pwLoading}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
