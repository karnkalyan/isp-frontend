"use client"

import { CardContainer } from "@/components/ui/card-container"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const users = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "Customer",
    timeAgo: "2 mins ago",
    avatar: "/placeholder.svg?key=5v6ml",
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "Admin",
    timeAgo: "1 hour ago",
    avatar: "/placeholder.svg?key=r85yv",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@example.com",
    role: "Partner",
    timeAgo: "3 hours ago",
    avatar: "/placeholder.svg?key=kvib3",
  },
]

export function UserActivity() {
  return (
    <CardContainer title="Recent User Activity" description="Latest user registrations and logins">
      <div className="grid gap-4 p-4 md:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="bg-slate-800/20 rounded-lg p-4 hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-slate-700 text-slate-200">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-white">{user.name}</h3>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs bg-slate-800 text-slate-400 rounded-full px-2.5 py-0.5">{user.role}</span>
              <span className="text-xs text-slate-400">{user.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 flex justify-center border-t border-slate-800">
        <Button variant="outline" className="text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white">
          View All Users
        </Button>
      </div>
    </CardContainer>
  )
}
