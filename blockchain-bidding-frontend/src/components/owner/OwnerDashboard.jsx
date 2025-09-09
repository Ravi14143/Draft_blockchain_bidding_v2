import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Plus, FileText, Briefcase, Users, TrendingUp, Calendar, Eye } from 'lucide-react'

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalRFQs: 0,
    activeRFQs: 0,
    totalProjects: 0,
    totalBids: 0
  })
  const [recentRFQs, setRecentRFQs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [rfqsResponse, projectsResponse] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/rfqs`, { credentials: 'include' }),
        fetch(`http://127.0.0.1:5000/api/projects`, { credentials: 'include' })
      ])

      if (!rfqsResponse.ok || !projectsResponse.ok) {
        throw new Error("Failed to fetch data")
      }

      const rfqs = await rfqsResponse.json()
      const projects = await projectsResponse.json()

      setStats({
        totalRFQs: rfqs.length,
        activeRFQs: rfqs.filter(r => r.status === 'open').length,
        totalProjects: projects.length,
        totalBids: rfqs.reduce((acc, r) => acc + (r.bid_count || 0), 0)
      })

      setRecentRFQs(rfqs.slice(0, 2))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline set'
    try {
      const date = new Date(deadline)
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return deadline
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
      <div className="flex items-center justify-center h-64 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Overview</h2>
        <Link to="/dashboard/rfqs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New RFQ
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRFQs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeRFQs} currently active
            </p>
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
              {stats.totalRFQs > 0 ? Math.round((stats.totalProjects / stats.totalRFQs) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">RFQs converted to projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent RFQs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent RFQs</CardTitle>
              <CardDescription>Your latest Request for Quotations</CardDescription>
            </div>
            <Link to="/dashboard/rfqs">
              <Button variant="outline" size="sm">View All RFQs</Button>
            </Link>
          </div>
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
                <Card key={rfq.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{rfq.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {rfq.scope || 'No description available'}
                        </CardDescription>
                        <p className="text-sm text-gray-500 mt-2">
                          <strong>Category:</strong> {rfq.category || 'N/A'} <br />
                          <strong>Budget:</strong> {rfq.budget_min} - {rfq.budget_max} <br />
                          <strong>Eligibility:</strong> {rfq.eligibility_requirements || 'N/A'}
                        </p>
                      </div>
                      <Badge className={rfq.submission_status.includes("closed") ? "bg-red-200 text-red-800 p-2" : "bg-green-200 text-green-800 p-2"}>
                        {rfq.submission_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Deadline: {formatDeadline(rfq.deadline)}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {rfq.bid_count || 0} bids
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/dashboard/rfqs/${rfq.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
