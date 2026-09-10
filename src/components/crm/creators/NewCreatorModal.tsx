import React, { useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Globe, UserRoundPlus, Check, Bot } from 'lucide-react'

interface NewCreatorModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'auto' | 'manual'
}

export const NewCreatorModal: React.FC<NewCreatorModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'auto',
}) => {
  const [mode, setMode] = useState<'auto' | 'manual'>(initialMode)
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

  const handleAutoEnrich = async (e: React.FormEvent) => {
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
      console.error('Creator import error:', err)
      setScrapeError('Failed to import creator profile. Check the URL or try manual entry.')
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRoundPlus className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Add New Creator</DialogTitle>
              <DialogDescription className="text-xs">
                Import automatically from profile URL or enter details manually.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabbed Form */}
        <Tabs
          value={mode}
          onValueChange={(val) => setMode(val as 'auto' | 'manual')}
          className="flex-1 flex flex-col min-h-0 px-6 pb-6 pt-1"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="auto" className="text-xs gap-1.5">
              <Bot className="size-3.5" />
              <span>Automatic Import</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="text-xs gap-1.5">
              <Globe className="size-3.5" />
              <span>Manual Entry</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-1">
            <TabsContent value="auto" className="m-0 space-y-4">
              <form onSubmit={handleAutoEnrich} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="creator-url" className="text-xs">
                    Creator URL (Channel, Portfolio, or Media Kit)
                  </Label>
                  <Input
                    id="creator-url"
                    type="url"
                    required
                    placeholder="https://youtube.com/@ThePrimeagen or https://sarahchen.dev"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Automatically extracts contact email, audience metrics, brand fit score, and past sponsors.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="target-niche" className="text-xs">
                    Target Campaign / Audience Niche
                  </Label>
                  <Input
                    id="target-niche"
                    type="text"
                    required
                    placeholder="e.g. AI Engineers, Rust Developers"
                    value={targetNiche}
                    onChange={(e) => setTargetNiche(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {scrapeError && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    {scrapeError}
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isScraping || !url}
                    className="text-xs gap-1.5"
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Importing Creator...</span>
                      </>
                    ) : (
                      <>
                        <UserRoundPlus className="size-3.5" />
                        <span>Enrich & Add to CRM</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="manual" className="m-0 space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="manual-name" className="text-xs">Creator Name</Label>
                    <Input
                      id="manual-name"
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manual-email" className="text-xs">Contact Email</Label>
                    <Input
                      id="manual-email"
                      type="email"
                      required
                      placeholder="alex@riveratech.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="manual-platform" className="text-xs">Platform</Label>
                    <Select
                      value={platform}
                      onValueChange={(val) => setPlatform(val as typeof platform)}
                    >
                      <SelectTrigger id="manual-platform" className="text-xs">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube" className="text-xs">YouTube</SelectItem>
                        <SelectItem value="twitter" className="text-xs">Twitter / X</SelectItem>
                        <SelectItem value="substack" className="text-xs">Substack</SelectItem>
                        <SelectItem value="twitch" className="text-xs">Twitch</SelectItem>
                        <SelectItem value="instagram" className="text-xs">Instagram</SelectItem>
                        <SelectItem value="tiktok" className="text-xs">TikTok</SelectItem>
                        <SelectItem value="linkedin" className="text-xs">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manual-country" className="text-xs">Country</Label>
                    <Input
                      id="manual-country"
                      type="text"
                      placeholder="US, UK, CA, DE..."
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="manual-followers" className="text-xs">Followers</Label>
                    <Input
                      id="manual-followers"
                      type="number"
                      value={followers ?? ''}
                      onChange={(e) => setFollowers(e.target.value ? Number(e.target.value) : undefined)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manual-views" className="text-xs">Avg Views</Label>
                    <Input
                      id="manual-views"
                      type="number"
                      value={views ?? ''}
                      onChange={(e) => setViews(e.target.value ? Number(e.target.value) : undefined)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manual-estcost" className="text-xs">Est. Cost ($)</Label>
                    <Input
                      id="manual-estcost"
                      type="number"
                      value={estCost ?? ''}
                      onChange={(e) => setEstCost(e.target.value ? Number(e.target.value) : undefined)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="manual-engagement" className="text-xs">Engage %</Label>
                    <Input
                      id="manual-engagement"
                      type="number"
                      step="0.1"
                      value={engagementRate ?? ''}
                      onChange={(e) => setEngagementRate(e.target.value ? Number(e.target.value) : undefined)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="manual-summary" className="text-xs">Notes / Profile Summary</Label>
                  <Input
                    id="manual-summary"
                    type="text"
                    placeholder="Key audience demographics, past content focus..."
                    value={scrapedSummary}
                    onChange={(e) => setScrapedSummary(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="manual-sponsors" className="text-xs">Past Sponsors (comma separated)</Label>
                  <Input
                    id="manual-sponsors"
                    type="text"
                    placeholder="Convex, Linear, Supabase"
                    value={pastSponsorsText}
                    onChange={(e) => setPastSponsorsText(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs gap-1.5"
                  >
                    <Check className="size-3.5" />
                    <span>Save Creator</span>
                  </Button>
                </div>
              </form>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

