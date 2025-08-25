import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Plus, FileText, Briefcase, Users, TrendingUp } from "lucide-react"

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalRFQs: 0,
    activeRFQs: 0,
    totalProjects: 0,
    totalBids: 0,
  })
  const [recentRFQs, setRecentRFQs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 👇 use full URL if you don’t have a proxy
      const [rfqsResponse, projectsResponse] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/rfqs", { credentials: "include" }),
        fetch("http://127.0.0.1:5000/api/projects", { credentials: "include" })

      ])

      if (!rfqsResponse.ok || !projectsResponse.ok) {
        throw new Error("API request failed")
      }

      const rfqs = await rfqsResponse.json()
      const projects = await projectsResponse.json()

      setStats({
        totalRFQs: rfqs.length,
        activeRFQs: rfqs.filter((rfq) => rfq.status === "open").length,
        totalProjects: projects.length,
        totalBids: rfqs.reduce((acc, rfq) => acc + (rfq.bids?.length || 0), 0),
      })

      setRecentRFQs(rfqs.slice(0, 5))
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
      setError("Failed to load dashboard. Please check API.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Owner Dashboard</h2>
        <Link to="/dashboard/rfqs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New RFQ
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRFQs}</div>
            <p className="text-xs text-muted-foreground">{stats.activeRFQs} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBids}</div>
            <p className="text-xs text-muted-foreground">Received across all RFQs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRFQs > 0
                ? Math.round((stats.totalProjects / stats.totalRFQs) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">RFQs converted to projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent RFQs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent RFQs</CardTitle>
          <CardDescription>Your latest Request for Quotations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRFQs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No RFQs created yet</p>
              <Link to="/dashboard/rfqs/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First RFQ
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRFQs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{rfq.title}</h4>
                    <p className="text-sm text-gray-500">Deadline: {rfq.deadline}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        rfq.status === "open"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {rfq.status}
                    </span>
                    <Link to={`/dashboard/rfqs/${rfq.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
