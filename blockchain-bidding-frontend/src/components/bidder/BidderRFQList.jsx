import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import {
  Calendar,
  User,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react"

export default function BidderRFQList() {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/rfqs", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setRfqs(data)
      }
    } catch (err) {
      console.error("Error fetching RFQs:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mr-2" />
        <div className="text-lg">Loading RFQs...</div>
      </div>
    )
  }

  // Normalize RFQ/bid statuses into readable badges
  const getStatusBadge = (rfq) => {
    const bidStatus = rfq.user_bid_status || rfq.status

    switch (bidStatus) {
      case "submitted":
        if (rfq.phase1_status === "pending") {
          return (
            <Badge className="bg-blue-100 text-blue-800 flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Pending Eval
            </Badge>
          )
        }
        if (rfq.phase1_status === "clarify") {
          return (
            <Badge className="bg-orange-100 text-orange-800 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" /> Clarification Needed
            </Badge>
          )
        }
        if (rfq.phase1_status === "reject") {
          return (
            <Badge className="bg-red-100 text-red-800 flex items-center">
              <XCircle className="h-3 w-3 mr-1" /> Rejected
            </Badge>
          )
        }
        if (rfq.phase2_status === "pass") {
          return <Badge className="bg-purple-100 text-purple-800">Passed Phase 2</Badge>
        }
        return <Badge className="bg-gray-200 text-gray-700">Submitted</Badge>

      case "selected":
        return (
          <Badge className="bg-green-600 text-white flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" /> Winner
          </Badge>
        )

      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        )

      case "open":
        return <Badge className="bg-green-100 text-green-800">Open for Bids</Badge>

      case "closed":
        return <Badge className="bg-gray-300 text-gray-700">Closed</Badge>

      default:
        return <Badge className="bg-gray-200 text-gray-700">{bidStatus}</Badge>
    }
  }

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
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Available RFQs</h2>
        <p className="text-gray-600">
          Browse RFQs, submit bids, and track evaluation status
        </p>
      </div>

      {rfqs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No RFQs available
            </h3>
            <p className="text-gray-500">
              Check back later for new bidding opportunities
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{rfq.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {rfq.scope?.length > 200
                        ? `${rfq.scope.substring(0, 200)}...`
                        : rfq.scope}
                    </CardDescription>
                  </div>
                  {getStatusBadge(rfq)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Owner ID: {rfq.owner_id}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Deadline: {formatDate(rfq.deadline)}
                  </div>

                  {rfq.category && (
                    <div>
                      <span className="font-medium">Category:</span> {rfq.category}
                    </div>
                  )}

                  {(rfq.budget_min || rfq.budget_max) && (
                    <div>
                      <span className="font-medium">Budget:</span>{" "}
                      {rfq.budget_min ? `$${rfq.budget_min}` : "?"} –{" "}
                      {rfq.budget_max ? `$${rfq.budget_max}` : "?"}
                    </div>
                  )}

                  {rfq.publish_date && (
                    <div>
                      <span className="font-medium">Publish Date:</span>{" "}
                      {formatDate(rfq.publish_date)}
                    </div>
                  )}

                  {rfq.clarification_deadline && (
                    <div>
                      <span className="font-medium">Clarification Deadline:</span>{" "}
                      {formatDate(rfq.clarification_deadline)}
                    </div>
                  )}

                  {rfq.start_date && (
                    <div>
                      <span className="font-medium">Start Date:</span>{" "}
                      {formatDate(rfq.start_date)}
                    </div>
                  )}

                  {rfq.end_date && (
                    <div>
                      <span className="font-medium">End Date:</span>{" "}
                      {formatDate(rfq.end_date)}
                    </div>
                  )}
                </div>

                {/* Long text sections */}
                {rfq.eligibility_requirements && (
                  <div>
                    <h4 className="font-medium">Eligibility Requirements</h4>
                    <p className="text-gray-700 text-sm">
                      {rfq.eligibility_requirements}
                    </p>
                  </div>
                )}

                {rfq.evaluation_criteria && (
                  <div>
                    <h4 className="font-medium">Evaluation Criteria</h4>
                    <p className="text-gray-700 text-sm">
                      {rfq.evaluation_criteria}
                    </p>
                  </div>
                )}

                {rfq.evaluation_weights && (
                  <div>
                    <h4 className="font-medium">Evaluation Weights</h4>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {rfq.evaluation_weights}
                    </pre>
                  </div>
                )}

                {/* Action */}
                <div className="flex justify-end">
                  <Link to={`/dashboard/rfqs/${rfq.id}`}>
                    <Button>
                      <Eye className="h-4 w-4 mr-2" />
                      {rfq.user_bid_status ? "View Bid" : "View & Bid"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
