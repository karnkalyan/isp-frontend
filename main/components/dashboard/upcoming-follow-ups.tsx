// components/dashboard/upcoming-follow-ups.tsx
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, PhoneCall, Mail, Users, Map } from "lucide-react"
import { apiRequest } from "@/lib/api"
import { formatDate } from "@/lib/utils"

interface FollowUp {
  id: string
  title: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'VISIT' | 'OTHER'
  scheduledAt: string
  lead: {
    id: string
    firstName: string
    lastName: string
    phoneNumber?: string
    email?: string
    status: string
  }
}

export function UpcomingFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingFollowUps()
  }, [])

  const fetchUpcomingFollowUps = async () => {
    try {
      setLoading(true)
      const data = await apiRequest("/follow-ups/upcoming?days=7")
      setFollowUps(data)
    } catch (error) {
      console.error("Failed to fetch upcoming follow-ups:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: FollowUp['type']) => {
    switch (type) {
      case 'CALL': return <PhoneCall className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'MEETING': return <Users className="h-4 w-4" />
      case 'VISIT': return <Map className="h-4 w-4" />
      default: return <CalendarDays className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Follow-ups</CardTitle>
        <CardDescription>Follow-ups scheduled for the next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No upcoming follow-ups
          </div>
        ) : (
          <div className="space-y-3">
            {followUps.map((followUp) => (
              <div key={followUp.id} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(followUp.type)}
                    <span className="font-medium">{followUp.title}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {followUp.lead.firstName} {followUp.lead.lastName}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(followUp.scheduledAt)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {followUp.lead.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {followUp.lead.phoneNumber && (
                    <div className="text-xs text-muted-foreground">
                      {followUp.lead.phoneNumber}
                    </div>
                  )}
                  {followUp.lead.email && (
                    <div className="text-xs text-muted-foreground">
                      {followUp.lead.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}