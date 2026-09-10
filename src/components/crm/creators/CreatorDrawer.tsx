import * as React from 'react'
import {
  ExternalLink,
  Mail,
  Users,
  Eye,
  DollarSign,
  TrendingUp,
  FileText,
  ShieldCheck,
  Send,
  Globe,
  Check,
} from 'lucide-react'
import type { Doc } from '../../../../convex/_generated/dataModel'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface CreatorDrawerProps {
  creator: Doc<'creators'> | null
  isOpen: boolean
  onClose: () => void
  onLaunchOutreach?: (creator: Doc<'creators'>) => void
}

export const CreatorDrawer: React.FC<CreatorDrawerProps> = ({
  creator,
  isOpen,
  onClose,
  onLaunchOutreach,
}) => {
  if (!creator) return null

  const initials = creator.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto flex flex-col justify-between">
        <div className="space-y-6">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <Avatar className="size-11 border border-border">
                <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <SheetTitle className="text-base font-bold">{creator.name}</SheetTitle>
                <SheetDescription className="text-xs">
                  {creator.audienceNiche || 'Content Creator'}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Badges & Match */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="capitalize">
              {creator.status.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {creator.platform}
            </Badge>
            {creator.brandFitScore && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-medium ml-auto">
                <Check className="size-3" />
                Fit: {creator.brandFitScore}%
              </Badge>
            )}
          </div>

          {/* Contact & Links */}
          <Card className="shadow-2xs">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3.5" /> Email
                </span>
                <a
                  href={`mailto:${creator.email}`}
                  className="text-primary hover:underline font-mono"
                >
                  {creator.email}
                </a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ExternalLink className="size-3.5" /> Channel / URL
                </span>
                <a
                  href={creator.bioLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground hover:underline truncate max-w-[200px]"
                >
                  {creator.bioLink}
                </a>
              </div>

              {creator.country && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="size-3.5" /> Country
                  </span>
                  <span className="font-medium">{creator.country}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Users className="size-3.5 text-primary" />
                <span>Followers</span>
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">
                {creator.followers ? creator.followers.toLocaleString() : '—'}
              </div>
            </Card>

            <Card className="p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Eye className="size-3.5 text-primary" />
                <span>Avg. Views</span>
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">
                {creator.views ? creator.views.toLocaleString() : '—'}
              </div>
            </Card>

            <Card className="p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <TrendingUp className="size-3.5 text-emerald-500" />
                <span>Engagement</span>
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">
                {creator.engagementRate ? `${creator.engagementRate}%` : '—'}
              </div>
            </Card>

            <Card className="p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <DollarSign className="size-3.5 text-amber-500" />
                <span>Est. Cost</span>
              </div>
              <div className="text-lg font-bold mt-1 text-foreground">
                {creator.estCost ? `$${creator.estCost.toLocaleString()}` : '—'}
              </div>
            </Card>
          </div>

          {/* Dossier */}
          {creator.scrapedSummary && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Creator Dossier
              </span>
              <p className="p-3 rounded-lg border border-border bg-muted/40 text-muted-foreground leading-relaxed">
                {creator.scrapedSummary}
              </p>
            </div>
          )}

          {/* Past Sponsors */}
          {creator.pastSponsors && creator.pastSponsors.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Verified Brand Collaborations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {creator.pastSponsors.map((sponsor) => (
                  <Badge key={sponsor} variant="outline" className="font-normal text-[11px]">
                    {sponsor}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Outreach Action */}
        <div className="pt-6 border-t border-border mt-6">
          <Button
            type="button"
            className="w-full flex items-center justify-center gap-2 shadow-sm font-medium"
            onClick={() => {
              if (onLaunchOutreach) onLaunchOutreach(creator)
              onClose()
            }}
          >
            <Send className="size-3.5" />
            <span>Launch Outreach with AI Agent</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
export default CreatorDrawer
