'use client'

import { LogOut, User } from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import { useState } from 'react'

interface UserNavProps {
  userEmail: string
}

export function UserNav({ userEmail }: UserNavProps) {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut()
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b">
      <div className="flex items-center gap-2 flex-1">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{userEmail}</span>
          <span className="text-xs text-muted-foreground">Logado</span>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="p-2 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
