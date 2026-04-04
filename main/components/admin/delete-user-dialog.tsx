"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { User } from "@/components/admin/user-management"
import { AlertTriangle } from "lucide-react"

interface DeleteUserDialogProps {
  user: User
  open: boolean
  onClose: () => void
  onConfirm: () => void
}



export function DeleteUserDialog({ user, open, onClose, onConfirm }: DeleteUserDialogProps) {
  console.log("Rendering DeleteUserDialog for user:", user)
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background dark:bg-slate-900 border-border dark:border-slate-800">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="bg-destructive/10 dark:bg-red-900/20 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-destructive dark:text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this user? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-muted dark:bg-slate-800/50 p-4 rounded-lg">
            <p className="font-medium text-foreground dark:text-slate-100">{user.name}</p>
            <p className="text-muted-foreground dark:text-slate-400">{user.email}</p>
            {/* <p className="text-muted-foreground dark:text-slate-400 mt-1">Role: {user.role}</p> */}
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-muted dark:hover:bg-slate-800">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
