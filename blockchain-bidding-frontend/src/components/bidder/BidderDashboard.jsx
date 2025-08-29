// BidderDashboard.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Search, Award, Briefcase, TrendingUp, FileText } from 'lucide-react'

export default function BidderDashboard() {
  const [stats, setStats] = useState({ availableRFQs: 0, myBids: 0, wonProjects: 0, successRate: 0 })
  const [recentRFQs, setRecentRFQs] = useState([])
  const [myBids, setMyBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboardData() }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/dashboard', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.role === "bidder") {
        const wonBids = data.bids.filter(bid => bid.status === "selected").length
        setStats({
          availableRFQs: data.available_rfqs,
          myBids: data.bid_count,
          wonProjects: data.project_count,
          successRate: data.bid_count > 0 ? Math.round((wonBids / data.bid_count) * 100) : 0
        })
        setRecentRFQs(data.recent_rfqs || [])
        setMyBids(data.bids || [])
      }
    } catch (err) { console.error("Dashboard fetch failed:", err) }
    finally { setLoading(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-lg">Loading dashboard...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Bidder Dashboard</h2>
        <Link to="/dashboard/rfqs"><Button><Search className="h-4 w-4 mr-2" /> Browse RFQs</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        {[{title:"Available RFQs",value:stats.availableRFQs,icon:FileText,desc:"Open for bidding"},
          {title:"My Bids",value:stats.myBids,icon:Award,desc:"Total submitted"},
          {title:"Won Projects",value:stats.wonProjects,icon:Briefcase,desc:"Active projects"},
          {title:"Success Rate",value:stats.successRate+"%",icon:TrendingUp,desc:"Bids won"}]
        .map((card, i)=>(
          <Card key={i}>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent RFQs */}
        <Card>
          <CardHeader><CardTitle>Available RFQs</CardTitle><CardDescription>Latest opportunities to bid on</CardDescription></CardHeader>
          <CardContent>
            {recentRFQs.length===0 ? 
              <div className="text-center py-8"><FileText className="h-12 w-12 text-gray-400 mx-auto mb-4"/><p className="text-gray-500">No RFQs available</p></div>
              : recentRFQs.map(rfq=>(
                  <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{rfq.title}</h4>
                      <p className="text-sm text-gray-500">Deadline: {rfq.deadline ? new Date(rfq.deadline).toLocaleString() : "N/A"}</p>
                    </div>
                    <Link to={`/dashboard/rfqs/${rfq.id}`}><Button variant="outline" size="sm">View / Bid</Button></Link>
                  </div>
              ))
            }
          </CardContent>
        </Card>

        {/* My Bids */}
        <Card>
          <CardHeader><CardTitle>My Recent Bids</CardTitle><CardDescription>Your latest bid submissions</CardDescription></CardHeader>
          <CardContent>
            {myBids.length===0 ? 
              <div className="text-center py-8"><Award className="h-12 w-12 text-gray-400 mx-auto mb-4"/><p className="text-gray-500">No bids submitted yet</p></div>
              : myBids.map(bid=>(
                  <div key={bid.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div><h4 className="font-medium">{bid.rfq_title || "RFQ title missing"}</h4><p className="text-sm text-gray-500">${bid.price?.toLocaleString()}</p></div>
                    <span className={`px-2 py-1 text-xs rounded-full ${bid.status==='selected'?'bg-green-100 text-green-800':'bg-blue-100 text-blue-800'}`}>{bid.status}</span>
                  </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
