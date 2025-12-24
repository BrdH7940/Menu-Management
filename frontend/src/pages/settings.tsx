import { Settings } from "lucide-react"

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Application Settings</h2>
        <p className="text-muted-foreground">Settings configuration will be displayed here.</p>
      </div>
    </div>
  )
}

