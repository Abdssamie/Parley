import React, { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { X, Sparkles, Loader2, Plus, Globe, Check } from 'lucide-react'

interface NewCreatorModalProps {
  isOpen: boolean
  onClose: () => void
}

export const NewCreatorModal: React.FC<NewCreatorModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'firecrawl' | 'manual'>('firecrawl')
  const [url, setUrl] = useState('')
  const [targetNiche, setTargetNiche] = useState('Developer Tools & AI Workflows')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)

  // Manual Form States
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [platform, setPlatform] = useState<
    'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'substack' | 'linkedin' | 'twitch'
  >('youtube')
  const [country, setCountry] = useState('US')
  const [followers, setFollowers] = useState<number | undefined>(25000)
  const [views, setViews] = useState<number | undefined>(8000)
  const [estCost, setEstCost] = useState<number | undefined>(850)
  const [engagementRate, setEngagementRate] = useState<number | undefined>(4.5)
  const [scrapedSummary, setScrapedSummary] = useState('')
  const [pastSponsorsText, setPastSponsorsText] = useState('Cursor, Convex')

  const scrapeAction = useAction(api.firecrawl.scrapeCreator)
  const createCreatorMutation = useMutation(api.creators.create)

  if (!isOpen) return null

  const handleFirecrawlEnrich = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setIsScraping(true)
    setScrapeError(null)

    try {
      const result = await scrapeAction({
        url,
        targetNiche,
      })

      // Immediately insert enriched creator into CRM
      await createCreatorMutation({
        name: result.name,
        email: result.contactEmail,
        bioLink: result.bioLink,
        platform: 'youtube',
        status: 'collected',
        country: 'US',
        followers: 45000,
        views: 12000,
        engagementRate: 5.2,
        estCost: result.baseRate ?? 1200,
        audienceNiche: result.audienceNiche,
        brandFitScore: result.brandFitScore,
        scrapedSummary: result.scrapedSummary,
        pastSponsors: result.pastSponsors,
      })

      setUrl('')
      onClose()
    } catch (err) {
      console.error('Firecrawl scraping error:', err)
      setScrapeError('Failed to scrape with Firecrawl. Check URL or try manual entry.')
    } finally {
      setIsScraping(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return

    const pastSponsors = pastSponsorsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    await createCreatorMutation({
      name,
      email,
      platform,
      status: 'collected',
      country,
      followers: followers ? Number(followers) : undefined,
      views: views ? Number(views) : undefined,
      estCost: estCost ? Number(estCost) : undefined,
      engagementRate: engagementRate ? Number(engagementRate) : undefined,
      bioLink: url || `https://${platform}.com/@${name.toLowerCase().replace(/\s+/g, '')}`,
      audienceNiche: targetNiche,
      brandFitScore: 85,
      scrapedSummary: scrapedSummary || `Manually collected creator specializing in ${targetNiche}.`,
      pastSponsors,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#14161c] border border-[#262a36] rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#22252f] flex items-center justify-between bg-[#111215]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-pink-500/20 text-pink-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Add New Creator</h3>
              <p className="text-xs text-slate-400">Collect or auto-enrich via Firecrawl</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1c1f26] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#22252f] bg-[#111215] px-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('firecrawl')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              mode === 'firecrawl'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Firecrawl Scrape</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              mode === 'manual'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>
        </div>

        {/* Modal Body */}
        {mode === 'firecrawl' ? (
          <form onSubmit={handleFirecrawlEnrich} className="p-6 space-y-4 text-xs">
            <div className="space-y-1.5">
              <label htmlFor="firecrawl-url" className="text-slate-300 font-medium">
                Creator URL (Portfolio, Media Kit, or YouTube Channel)
              </label>
              <input
                id="firecrawl-url"
                type="url"
                required
                placeholder="https://youtube.com/@ThePrimeagen or https://sarahchen.dev"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 text-xs"
              />
              <p className="text-[11px] text-slate-400">
                Firecrawl will parse the page to extract contact email, audience metrics, brand fit score, and past sponsors.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="firecrawl-niche" className="text-slate-300 font-medium">Target Niche</label>
              <input
                id="firecrawl-niche"
                type="text"
                value={targetNiche}
                onChange={(e) => setTargetNiche(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white focus:outline-none focus:border-pink-500 text-xs"
              />
            </div>

            {scrapeError && (
              <div className="p-3 rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-400 text-xs">
                {scrapeError}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md border border-[#2a2f3d] text-slate-300 hover:bg-[#1b1e26] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isScraping || !url}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-pink-600 hover:bg-pink-500 text-white font-medium disabled:opacity-50 transition-colors shadow"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scraping with Firecrawl...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Enrich & Add to CRM</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleManualSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="manual-name" className="text-slate-300 font-medium">Creator Name</label>
                <input
                  id="manual-name"
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="manual-email" className="text-slate-300 font-medium">Contact Email</label>
                <input
                  id="manual-email"
                  type="email"
                  required
                  placeholder="alex@riveratech.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="manual-platform" className="text-slate-300 font-medium">Platform</label>
                <select
                  id="manual-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as typeof platform)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                >
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="substack">Substack</option>
                  <option value="twitch">Twitch</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="manual-country" className="text-slate-300 font-medium">Country</label>
                <input
                  id="manual-country"
                  type="text"
                  placeholder="US, UK, CA, DE..."
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <label htmlFor="manual-followers" className="text-slate-300 font-medium">Followers</label>
                <input
                  id="manual-followers"
                  type="number"
                  value={followers ?? ''}
                  onChange={(e) => setFollowers(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="manual-views" className="text-slate-300 font-medium">Avg. Views</label>
                <input
                  id="manual-views"
                  type="number"
                  value={views ?? ''}
                  onChange={(e) => setViews(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="manual-estcost" className="text-slate-300 font-medium">Est. Cost ($)</label>
                <input
                  id="manual-estcost"
                  type="number"
                  value={estCost ?? ''}
                  onChange={(e) => setEstCost(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="manual-engagement" className="text-slate-300 font-medium">Engage %</label>
                <input
                  id="manual-engagement"
                  type="number"
                  step="0.1"
                  value={engagementRate ?? ''}
                  onChange={(e) => setEngagementRate(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="manual-summary" className="text-slate-300 font-medium">Notes / Profile Summary</label>
              <input
                id="manual-summary"
                type="text"
                placeholder="Key audience demographics, past content focus..."
                value={scrapedSummary}
                onChange={(e) => setScrapedSummary(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="manual-sponsors" className="text-slate-300 font-medium">Past Sponsors (comma separated)</label>
              <input
                id="manual-sponsors"
                type="text"
                placeholder="Convex, Linear, Supabase"
                value={pastSponsorsText}
                onChange={(e) => setPastSponsorsText(e.target.value)}
                className="w-full px-3 py-2 bg-[#1b1e26] border border-[#2a2f3d] rounded-md text-white text-xs focus:border-pink-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md border border-[#2a2f3d] text-slate-300 hover:bg-[#1b1e26] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-pink-600 hover:bg-pink-500 text-white font-medium transition-colors shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Creator</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
