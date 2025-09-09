import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  Search,
  Award,
  Briefcase,
  TrendingUp,
  FileText,
  Calendar,
  DollarSign,
  User,
} from "lucide-react"

export default function BidderDashboard() {
  const [stats, setStats] = useState({
    availableRFQs: 0,
    myBids: 0,
    wonProjects: 0,
    successRate: 0,
  })
  const [recentRFQs, setRecentRFQs] = useState([])
  const [myBids, setMyBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/dashboard", {
        credentials: "include",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()

      if (data.role === "bidder") {
        const wonBids = data.bids.filter((bid) => bid.status === "selected").length
        setStats({
          availableRFQs: data.available_rfqs,
          myBids: data.bid_count,
          wonProjects: data.project_count,
          successRate: data.bid_count > 0 ? Math.round((wonBids / data.bid_count) * 100) : 0,
        })

        setRecentRFQs(data.recent_rfqs || [])

        // Fetch RFQ titles for each bid
        const bidsWithTitles = await Promise.all(
          (data.bids || []).map(async (bid) => {
            try {
              const rfqRes = await fetch(`http://127.0.0.1:5000/api/rfqs/${bid.rfq_id}`, {
                credentials: "include",
              })
              const rfqData = rfqRes.ok ? await rfqRes.json() : {}
              return { ...bid, rfq_title: rfqData.title || "Untitled RFQ" }
            } catch {
              return { ...bid, rfq_title: "Untitled RFQ" }
            }
          })
        )

        setMyBids(bidsWithTitles)
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-lg">
        Loading dashboard...
      </div>
    )

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A"
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Bidder Dashboard</h2>
        <Link to="/dashboard/rfqs">
          <Button>
            <Search className="h-4 w-4 mr-2" /> Browse RFQs
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Available RFQs", value: stats.availableRFQs, icon: FileText, desc: "Open for bidding" },
          { title: "My Bids", value: stats.myBids, icon: Award, desc: "Total submitted" },
          { title: "Won Projects", value: stats.wonProjects, icon: Briefcase, desc: "Active projects" },
          { title: "Success Rate", value: stats.successRate + "%", icon: TrendingUp, desc: "Bids won" },
        ].map((card, i) => (
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
          <CardHeader>
            <CardTitle>Available RFQs</CardTitle>
            <CardDescription>Latest opportunities to bid on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRFQs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No RFQs available</p>
              </div>
            ) : (
              recentRFQs.map((rfq) => (
                <div
                  key={rfq.id}
                  className="p-4 border rounded-lg hover:shadow-sm transition"
                >
                  <h4 className="font-medium text-lg mb-1">{rfq.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{rfq.scope?.substring(0, 120)}...</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1" /> Owner: {rfq.owner_id}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" /> Deadline: {formatDate(rfq.deadline)}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" /> Budget: ${rfq.budget_min || "?"} – ${rfq.budget_max || "?"}
                    </div>
                    {rfq.category && (
                      <div>
                        <span className="font-medium">Category:</span> {rfq.category}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Link to={`/dashboard/rfqs/${rfq.id}`}>
                      <Button size="sm" variant="outline">
                        View / Bid
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Bids */}
        <Card>
          <CardHeader>
            <CardTitle>My Recent Bids</CardTitle>
            <CardDescription>Your latest bid submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myBids.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No bids submitted yet</p>
              </div>
            ) : (
              myBids.map((bid) => (
                <div
                  key={bid.id}
                  className="p-4 border rounded-lg hover:shadow-sm transition"
                >
                  <h4 className="font-medium text-lg mb-1">{bid.rfq_title || "Untitled RFQ"}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" /> Bid Price: ${bid.price?.toLocaleString() || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {bid.status}
                    </div>
                    {bid.phase1_status && (
                      <div>
                        <span className="font-medium">Phase 1:</span> {bid.phase1_status}
                      </div>
                    )}
                    {bid.phase2_status && (
                      <div>
                        <span className="font-medium">Phase 2:</span> {bid.phase2_status}
                      </div>
                    )}
                    {bid.phase2_score && (
                      <div>
                        <span className="font-medium">Score:</span> {bid.phase2_score}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Link to={`/dashboard/bids/${bid.id}`}>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
