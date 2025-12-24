import { Home } from "lucide-react"

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Menu Items</h3>
          <p className="text-2xl font-bold mt-2">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Items</h3>
          <p className="text-2xl font-bold mt-2">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
          <p className="text-2xl font-bold mt-2">-</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Revenue</h3>
          <p className="text-2xl font-bold mt-2">-</p>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Overview</h2>
        <p className="text-muted-foreground">Dashboard content will be displayed here.</p>
      </div>
    </div>
  )
}

