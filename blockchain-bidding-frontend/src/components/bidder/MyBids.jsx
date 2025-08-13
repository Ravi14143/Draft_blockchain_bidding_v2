import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Award, DollarSign, Calendar, FileText, Eye } from 'lucide-react'

export default function MyBids() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBids()
  }, [])

  const fetchMyBids = async () => {
    try {
      const response = await fetch('/api/my-bids', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setBids(data)
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error)
    } finally {
      setLoading(false)
    }
  }

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'selected':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getBidStatusIcon = (status) => {
    switch (status) {
      case 'selected':
        return <Award className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your bids...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">My Bids</h2>
        <p className="text-gray-600">Track the status of your submitted bids</p>
      </div>

      {bids.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Award className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bids submitted yet</h3>
            <p className="text-gray-500 mb-6">Start bidding on available RFQs to see them here</p>
            <Link to="/dashboard/rfqs">
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Browse Available RFQs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bids.map((bid) => (
            <Card key={bid.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center">
                      {getBidStatusIcon(bid.status)}
                      <span className="ml-2">{bid.rfq_title}</span>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Bid #{bid.id} • RFQ #{bid.rfq_id}
                    </CardDescription>
                  </div>
                  <Badge className={getBidStatusColor(bid.status)}>
                    {bid.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Bid Amount
                    </h4>
                    <p className="text-gray-700">${bid.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Timeline
                    </h4>
                    <p className="text-gray-700">{bid.timeline}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                    <div className="flex items-center space-x-2">
                      <Badge className={getBidStatusColor(bid.status)}>
                        {bid.status}
                      </Badge>
                      {bid.status === 'selected' && (
                        <span className="text-green-600 text-sm font-medium">Winner!</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Qualifications Summary</h4>
                  <p className="text-gray-700 text-sm">
                    {bid.qualifications.length > 150 
                      ? `${bid.qualifications.substring(0, 150)}...` 
                      : bid.qualifications
                    }
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Document Hash: <span className="font-mono">{bid.document_hash}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/dashboard/rfqs/${bid.rfq_id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View RFQ
                      </Button>
                    </Link>
                    {bid.status === 'selected' && (
                      <Link to={`/dashboard/my-projects`}>
                        <Button size="sm">
                          View Project
                        </Button>
                      </Link>
                    )}
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

