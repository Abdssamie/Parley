import React from 'react'

interface AvatarInitialProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const COLOR_PALETTES = [
  { bg: 'bg-[#40192e]', text: 'text-[#f472b6]' }, // Pink
  { bg: 'bg-[#401818]', text: 'text-[#f87171]' }, // Red
  { bg: 'bg-[#18392b]', text: 'text-[#4ade80]' }, // Emerald
  { bg: 'bg-[#2f1c42]', text: 'text-[#c084fc]' }, // Purple
  { bg: 'bg-[#17333a]', text: 'text-[#38bdf8]' }, // Sky
  { bg: 'bg-[#3b2b13]', text: 'text-[#fbbf24]' }, // Amber
  { bg: 'bg-[#1d2745]', text: 'text-[#818cf8]' }, // Indigo
  { bg: 'bg-[#381e28]', text: 'text-[#fb7185]' }, // Rose
]

export const AvatarInitial: React.FC<AvatarInitialProps> = ({ name, size = 'sm' }) => {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  
  // Deterministic color hash based on string
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % COLOR_PALETTES.length
  const palette = COLOR_PALETTES[colorIndex]

  const sizeClasses =
    size === 'lg'
      ? 'w-10 h-10 text-base rounded-lg'
      : size === 'md'
      ? 'w-7 h-7 text-xs rounded-md'
      : 'w-5 h-5 text-[11px] rounded'

  return (
    <div
      className={`inline-flex items-center justify-center font-bold select-none ${sizeClasses} ${palette.bg} ${palette.text}`}
    >
      {initial}
    </div>
  )
}
