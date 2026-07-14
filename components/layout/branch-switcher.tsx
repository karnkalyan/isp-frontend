"use client";

import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useBranch } from "@/contexts/BranchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Store, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function BranchSwitcher({ className }: { className?: string }) {
  const { branches, selectedBranchId, setSelectedBranchId, loading } = useBranch();
  const { user } = useAuth();

  // Admin / HQ / Global roles see ALL data — no branch switching needed
  const roleName = (user?.role?.name || '').toLowerCase();
  const isGlobalRole = roleName === 'administrator' || 
                       roleName === 'global manager' || 
                       roleName.startsWith('global ');

  // HQ users: they have a branch assigned AND that branch has no parent (root/HQ branch)
  const isHQUser = !!user?.branchId && !user?.branch?.parentId;

  if (loading) return <div className="h-9 w-32 animate-pulse bg-muted rounded-md" />;
  
  // Hide switcher for global/admin roles AND HQ users (they see everything)
  if (isGlobalRole || isHQUser) return null;
  
  // Hide switcher if user has only 1 or fewer branches
  if (branches.length <= 1) return null;

  const currentBranch = branches.find(b => b.id === selectedBranchId);

  const getDepth = (branchId: number, depth = 0): number => {
    const branch = branches.find((b: any) => b.id === branchId);
    if (!branch || !branch.parentId) return depth;
    return getDepth(branch.parentId, depth + 1);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select 
        value={selectedBranchId?.toString()} 
        onValueChange={(val) => setSelectedBranchId(parseInt(val))}
      >
        <SelectTrigger className="h-9 w-[180px] bg-background/50 border-border/50 backdrop-blur-sm hover:border-primary/50 transition-all">
          <div className="flex items-center gap-2 overflow-hidden">
            {currentBranch?.type === 'MAIN' ? (
              <Landmark className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 text-primary shrink-0" />
            )}
            <SelectValue placeholder="Select Branch" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch: any) => {
            const depth = getDepth(branch.id);
            return (
            <SelectItem key={branch.id} value={branch.id.toString()}>
              <div 
                className="flex items-center gap-2"
                style={{ marginLeft: `${depth * 12}px` }}
              >
                {branch.parentId ? (
                  <Store className="h-3 w-3 opacity-50 shrink-0" />
                ) : branch.type === 'MAIN' ? (
                  <Landmark className="h-4 w-4 opacity-70 shrink-0" />
                ) : (
                  <Building2 className="h-4 w-4 opacity-70 shrink-0" />
                )}
                <span className={cn(branch.parentId && "text-sm opacity-90")}>{branch.name}</span>
              </div>
            </SelectItem>
          )})}

        </SelectContent>
      </Select>
    </div>
  );
}
