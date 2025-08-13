import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Search, Award, Briefcase, TrendingUp, FileText } from 'lucide-react'

export default function BidderDashboard() {
  const [stats, setStats] = useState({
    availableRFQs: 0,
    myBids: 0,
    wonProjects: 0,
    successRate: 0
  })
  const [recentRFQs, setRecentRFQs] = useState([])
  const [myBids, setMyBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [rfqsResponse, bidsResponse, projectsResponse] = await Promise.all([
        fetch('/api/rfqs', { credentials: 'include' }),
        fetch('/api/my-bids', { credentials: 'include' }),
        fetch('/api/projects', { credentials: 'include' })
      ])

      if (rfqsResponse.ok && bidsResponse.ok && projectsResponse.ok) {
        const rfqs = await rfqsResponse.json()
        const bids = await bidsResponse.json()
        const projects = await projectsResponse.json()

        const wonBids = bids.filter(bid => bid.status === 'selected').length

        setStats({
          availableRFQs: rfqs.filter(rfq => rfq.status === 'open').length,
          myBids: bids.length,
          wonProjects: projects.length,
          successRate: bids.length > 0 ? Math.round((wonBids / bids.length) * 100) : 0
        })

        setRecentRFQs(rfqs.filter(rfq => rfq.status === 'open').slice(0, 5))
        setMyBids(bids.slice(0, 5))
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
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Bidder Dashboard</h2>
        <Link to="/dashboard/rfqs">
          <Button>
            <Search className="h-4 w-4 mr-2" />
            Browse RFQs
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available RFQs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableRFQs}</div>
            <p className="text-xs text-muted-foreground">
              Open for bidding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Bids</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myBids}</div>
            <p className="text-xs text-muted-foreground">
              Total submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wonProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Bids won
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available RFQs */}
        <Card>
          <CardHeader>
            <CardTitle>Available RFQs</CardTitle>
            <CardDescription>
              Latest opportunities to bid on
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRFQs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No RFQs available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Check back later for new opportunities
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRFQs.map((rfq) => (
                  <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{rfq.title}</h4>
                      <p className="text-sm text-gray-500">Deadline: {rfq.deadline}</p>
                    </div>
                    <Link to={`/dashboard/rfqs/${rfq.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
                <Link to="/dashboard/rfqs">
                  <Button variant="outline" className="w-full">View All RFQs</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Recent Bids */}
        <Card>
          <CardHeader>
            <CardTitle>My Recent Bids</CardTitle>
            <CardDescription>
              Your latest bid submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myBids.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No bids submitted yet</p>
                <Link to="/dashboard/rfqs">
                  <Button className="mt-4">
                    <Search className="h-4 w-4 mr-2" />
                    Find RFQs to Bid On
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myBids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{bid.rfq_title}</h4>
                      <p className="text-sm text-gray-500">${bid.price.toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      bid.status === 'selected' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bid.status}
                    </span>
                  </div>
                ))}
                <Link to="/dashboard/my-bids">
                  <Button variant="outline" className="w-full">View All Bids</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

