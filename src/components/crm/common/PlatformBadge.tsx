import React from 'react'

interface PlatformBadgeProps {
  platform: 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'substack' | 'linkedin' | 'twitch' | string
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform }) => {
  const norm = platform.toLowerCase()

  switch (norm) {
    case 'youtube':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#13281d] text-[#48c78e] border border-[#1f422e]">
          YouTube
        </span>
      )
    case 'twitter':
    case 'x':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#142338] text-[#5cb0ff] border border-[#1e3656]">
          Twitter / X
        </span>
      )
    case 'substack':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#311e14] text-[#ff8f52] border border-[#482b1c]">
          Substack
        </span>
      )
    case 'twitch':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#2a1738] text-[#c97bff] border border-[#43235b]">
          Twitch
        </span>
      )
    case 'instagram':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#36162a] text-[#ff6ea7] border border-[#52203f]">
          Instagram
        </span>
      )
    case 'tiktok':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#16272e] text-[#55e0f5] border border-[#213f4a]">
          TikTok
        </span>
      )
    case 'linkedin':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#122336] text-[#6cb4fc] border border-[#1a3854]">
          LinkedIn
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#1c1f26] text-slate-300 border border-[#282d38]">
          {platform}
        </span>
      )
  }
}
