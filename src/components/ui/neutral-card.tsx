import * as React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NeutralStatCardProps {
  title: string
  value: string | number
  badgeText?: string
  badgeTrend?: 'up' | 'down' | 'neutral'
  trendText?: string
  trendSubtext?: string
  onClick?: () => void
  className?: string
}

export const NeutralStatCard: React.FC<NeutralStatCardProps> = ({
  title,
  value,
  badgeText,
  badgeTrend = 'up',
  trendText,
  trendSubtext,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[1.25rem] border border-white/[0.08] bg-[#1e1e22]/90 hover:bg-[#232327] transition-all duration-200 p-6 flex flex-col justify-between shadow-[0_8px_30px_rgb(0,0,0,0.25)] relative overflow-hidden group",
        onClick && "cursor-pointer hover:border-white/20",
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400 tracking-normal">{title}</span>
        {badgeText && (
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
            {badgeTrend === 'up' ? (
              <ArrowUpRight className="size-3 text-zinc-400" />
            ) : badgeTrend === 'down' ? (
              <ArrowDownRight className="size-3 text-zinc-400" />
            ) : null}
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      {/* Main stat */}
      <div className="text-3xl font-semibold tracking-tight text-white my-3">
        {value}
      </div>

      {/* Bottom text */}
      <div className="space-y-0.5">
        {trendText && (
          <div className="text-sm font-medium text-zinc-200 flex items-center gap-1">
            <span>{trendText}</span>
            {badgeTrend === 'up' && <ArrowUpRight className="size-3.5 text-zinc-400" />}
            {badgeTrend === 'down' && <ArrowDownRight className="size-3.5 text-zinc-400" />}
          </div>
        )}
        {trendSubtext && (
          <div className="text-xs text-zinc-400">
            {trendSubtext}
          </div>
        )}
      </div>
    </div>
  )
}

export interface NeutralWaveChartCardProps {
  title?: string
  subtitle?: string
  activePeriod: '3m' | '30d' | '7d'
  onPeriodChange: (period: '3m' | '30d' | '7d') => void
  className?: string
}

export const NeutralWaveChartCard: React.FC<NeutralWaveChartCardProps> = ({
  title = "Outreach & Engagement Velocity",
  subtitle = "Total activity for the selected timeframe",
  activePeriod,
  onPeriodChange,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-white/[0.08] bg-[#1e1e22]/90 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.25)] overflow-hidden",
        className
      )}
    >
      {/* Header with Title and Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Segmented Pill Selector */}
        <div className="inline-flex p-1 rounded-xl bg-zinc-800/60 border border-white/5 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onPeriodChange('3m')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all",
              activePeriod === '3m'
                ? "bg-white/10 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Last 3 months
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange('30d')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all",
              activePeriod === '30d'
                ? "bg-white/10 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Last 30 days
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange('7d')}
            className={cn(
              "px-3 py-1.5 rounded-lg font-medium transition-all",
              activePeriod === '7d'
                ? "bg-white/10 text-white shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Last 7 days
          </button>
        </div>
      </div>

      {/* Beautiful Dual-Waveform Area Visualization */}
      <div className="w-full h-44 sm:h-52 relative">
        <svg
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="wave1-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#4338ca" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="wave2-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Primary Higher Frequency Wave (Back) */}
          <path
            d="M 0 210 
               C 30 190, 60 110, 100 130 
               C 140 150, 170 80, 210 120 
               C 250 160, 280 60, 320 100 
               C 360 140, 400 90, 440 70 
               C 480 50, 510 140, 550 110 
               C 590 80, 620 150, 660 130 
               C 700 110, 730 40, 770 70 
               C 810 100, 840 150, 880 80 
               C 920 30, 960 120, 1000 140 
               L 1000 240 L 0 240 Z"
            fill="url(#wave1-gradient)"
          />
          <path
            d="M 0 210 
               C 30 190, 60 110, 100 130 
               C 140 150, 170 80, 210 120 
               C 250 160, 280 60, 320 100 
               C 360 140, 400 90, 440 70 
               C 480 50, 510 140, 550 110 
               C 590 80, 620 150, 660 130 
               C 700 110, 730 40, 770 70 
               C 810 100, 840 150, 880 80 
               C 920 30, 960 120, 1000 140"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Secondary Harmonized Wave (Front) */}
          <path
            d="M 0 230 
               C 40 220, 80 180, 120 190 
               C 160 200, 200 150, 240 170 
               C 280 190, 320 130, 360 150 
               C 400 170, 440 140, 480 160 
               C 520 180, 560 120, 600 140 
               C 640 160, 680 110, 720 130 
               C 760 150, 800 120, 840 110 
               C 880 100, 920 160, 960 150 
               C 980 145, 990 170, 1000 180 
               L 1000 240 L 0 240 Z"
            fill="url(#wave2-gradient)"
          />
          <path
            d="M 0 230 
               C 40 220, 80 180, 120 190 
               C 160 200, 200 150, 240 170 
               C 280 190, 320 130, 360 150 
               C 400 170, 440 140, 480 160 
               C 520 180, 560 120, 600 140 
               C 640 160, 680 110, 720 130 
               C 760 150, 800 120, 840 110 
               C 880 100, 920 160, 960 150 
               C 980 145, 990 170, 1000 180"
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
