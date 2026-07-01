import { cn, getInitials } from '@utils/cn'

interface AvatarProps {
  user?: {
    id?: string
    avatar_url?: string | null
    full_name?: string
    first_name?: string
    email?: string
  } | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fallbackClassName?: string
  style?: React.CSSProperties
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-7 w-7 text-xs',
  lg: 'h-10 w-10 text-sm',
  xl: 'h-12 w-12 text-base',
  '2xl': 'h-24 w-24 text-3xl',
}

const avatarGradients = [
  'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-600/50',
  'bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-blue-600/50',
  'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-600/50',
  'bg-gradient-to-br from-rose-500 to-pink-600 text-white border-rose-600/50',
  'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-600/50',
  'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white border-violet-600/50',
]

const getAvatarGradient = (user: AvatarProps['user']) => {
  const idToHash = user?.id || user?.email || user?.full_name || 'default';
  let hash = 0;
  for (let i = 0; i < idToHash.length; i++) {
    hash = idToHash.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarGradients.length;
  return avatarGradients[index];
}

export function Avatar({ user, className, size = 'md', fallbackClassName, style }: AvatarProps) {
  const name = user?.full_name || user?.first_name || user?.email || '?'
  const fallbackGradient = getAvatarGradient(user);
  
  return (
    <div 
      className={cn(
        'rounded-full flex items-center justify-center font-semibold overflow-hidden shrink-0 shadow-sm border border-transparent',
        sizeClasses[size],
        !user?.avatar_url && fallbackGradient,
        className
      )}
      style={style}
    >
      {user?.avatar_url ? (
        <img 
          src={user.avatar_url} 
          alt={name} 
          className="h-full w-full object-cover" 
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.parentElement) {
              e.currentTarget.parentElement.innerHTML = getInitials(name);
              // Clean up any old classes and apply the gradient
              e.currentTarget.parentElement.className = cn(
                'rounded-full flex items-center justify-center font-semibold overflow-hidden shrink-0 shadow-sm border border-transparent',
                sizeClasses[size],
                fallbackGradient,
                className
              );
            }
          }}
        />
      ) : (
        <span className={cn('drop-shadow-sm', fallbackClassName)}>{getInitials(name)}</span>
      )}
    </div>
  )
}
