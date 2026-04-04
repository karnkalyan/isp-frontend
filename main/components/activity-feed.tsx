import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

const activities = [
  {
    id: 1,
    title: "New user registered",
    description: "John Smith signed up for a business plan",
    timestamp: "2 minutes ago",
    status: "success",
  },
  {
    id: 2,
    title: "Payment failed",
    description: "Invoice #12345 payment failed",
    timestamp: "1 hour ago",
    status: "error",
  },
  {
    id: 3,
    title: "Bandwidth limit reached",
    description: "User ID 5678 reached 90% of monthly bandwidth",
    timestamp: "3 hours ago",
    status: "warning",
  },
  {
    id: 4,
    title: "System maintenance completed",
    description: "Server upgrades successfully deployed",
    timestamp: "5 hours ago",
    status: "success",
  },
  {
    id: 5,
    title: "New support ticket",
    description: "Ticket #34567 opened by Jane Doe",
    timestamp: "1 day ago",
    status: "pending",
  },
]

export function ActivityFeed() {
  return (
    <Card className="glass-bg border-none shadow-depth">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events from your ISP operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-auto pr-2 scrollbar-thin">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 rounded-lg border p-4 glass-bg">
              <div className="mt-0.5">
                {activity.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                {activity.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                {(activity.status === "warning" || activity.status === "pending") && (
                  <Clock className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground rounded-full bg-muted px-2.5 py-0.5">
                  {activity.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
