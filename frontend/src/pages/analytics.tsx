import { BarChart3 } from "lucide-react"

export function Analytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Analytics Overview</h2>
        <p className="text-muted-foreground">Analytics data and charts will be displayed here.</p>
      </div>
    </div>
  )
}

