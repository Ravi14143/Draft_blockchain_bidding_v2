import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Users, FileText, Briefcase, Shield, TrendingUp, Activity } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRFQs: 0,
    totalProjects: 0,
    totalBids: 0,
    owners: 0,
    bidders: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [usersResponse, rfqsResponse, projectsResponse] = await Promise.all([
        fetch('http://127.0.0.1:5000/api/users', { credentials: 'include' }),
        fetch('http://127.0.0.1:5000/api/rfqs', { credentials: 'include' }),
        fetch('http://127.0.0.1:5000/api/projects', { credentials: 'include' })
      ])

      if (usersResponse.ok && rfqsResponse.ok && projectsResponse.ok) {
        const users = await usersResponse.json()
        const rfqs = await rfqsResponse.json()
        const projects = await projectsResponse.json()

        // Get bid count from RFQs
        const totalBids = rfqs.reduce((acc, rfq) => acc + (rfq.bids?.length || 0), 0)

        setStats({
          totalUsers: users.length,
          totalRFQs: rfqs.length,
          totalProjects: projects.length,
          totalBids: totalBids,
          owners: users.filter(user => user.role === 'owner').length,
          bidders: users.filter(user => user.role === 'bidder').length
        })

        // Create recent activity from RFQs and projects
        const activity = [
          ...rfqs.slice(0, 3).map(rfq => ({
            type: 'RFQ Created',
            description: `"${rfq.title}" by ${rfq.owner}`,
            time: 'Recently'
          })),
          ...projects.slice(0, 2).map(project => ({
            type: 'Project Started',
            description: `"${project.rfq_title}" awarded to ${project.winner_bidder}`,
            time: 'Recently'
          }))
        ]
        setRecentActivity(activity.slice(0, 5))
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <div className="flex space-x-2">
          <Link to="/dashboard/users">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link to="/dashboard/audit">
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Audit Log
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.owners} owners, {stats.bidders} bidders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRFQs}</div>
            <p className="text-xs text-muted-foreground">
              Across all project owners
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
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBids}</div>
            <p className="text-xs text-muted-foreground">
              Submitted by bidders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>
              Key metrics and system health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-blue-900">User Distribution</h4>
                <p className="text-sm text-blue-700">
                  {stats.owners} Project Owners, {stats.bidders} Bidders
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium text-green-900">Success Rate</h4>
                <p className="text-sm text-green-700">
                  {stats.totalRFQs > 0 ? Math.round((stats.totalProjects / stats.totalRFQs) * 100) : 0}% RFQs converted to projects
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>

            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <div>
                <h4 className="font-medium text-purple-900">Bid Competition</h4>
                <p className="text-sm text-purple-700">
                  {stats.totalRFQs > 0 ? (stats.totalBids / stats.totalRFQs).toFixed(1) : 0} average bids per RFQ
                </p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
            <CardDescription>
              Latest actions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.type}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/dashboard/users">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link to="/dashboard/audit">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Shield className="h-6 w-6 mb-2" />
                <span>View Audit Log</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex flex-col" disabled>
              <Activity className="h-6 w-6 mb-2" />
              <span>System Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

