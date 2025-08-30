import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Calendar, User, Eye, DollarSign } from 'lucide-react'

export default function BidderRFQList() {
  const [rfqs, setRfqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/rfqs', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setRfqs(data.filter(rfq => rfq.status === "open"))
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
        <div className="text-lg">Loading RFQs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Available RFQs</h2>
        <p className="text-gray-600">Browse and bid on open Request for Quotations</p>
      </div>

      {rfqs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs available</h3>
            <p className="text-gray-500">Check back later for new bidding opportunities</p>
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
                      {rfq.scope.length > 200 
                        ? `${rfq.scope.substring(0, 200)}...` 
                        : rfq.scope
                      }
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Open for Bids
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {rfq.owner}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Deadline: {new Date(rfq.deadline).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/dashboard/rfqs/${rfq.id}`}>
                      <Button>
                        <Eye className="h-4 w-4 mr-2" />
                        View & Bid
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

