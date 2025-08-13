import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, Users, Award, DollarSign } from 'lucide-react'

export default function RFQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRFQ] = useState(null)
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRFQDetails()
  }, [id])

  const fetchRFQDetails = async () => {
    try {
      const [rfqResponse, bidsResponse] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/rfqs/${id}`, { credentials: 'include' }),
        fetch(`http://127.0.0.1:5000/api/rfqs/${id}/bids`, { credentials: 'include' })
      ])

      if (rfqResponse.ok && bidsResponse.ok) {
        const rfqData = await rfqResponse.json()
        const bidsData = await bidsResponse.json()
        setRFQ(rfqData)
        setBids(bidsData)
      } else {
        setError('Failed to load RFQ details')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWinner = async (bidId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/bids/${bidId}/select`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh the data
        fetchRFQDetails()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to select winner')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'selected':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading RFQ details...</div>
      </div>
    )
  }

  if (error || !rfq) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'RFQ not found'}</p>
        <Button onClick={() => navigate('/dashboard/rfqs')} className="mt-4">
          Back to RFQs
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/rfqs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQs
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-gray-900">{rfq.title}</h2>
            <Badge className={getStatusColor(rfq.status)}>
              {rfq.status}
            </Badge>
          </div>
          <p className="text-gray-600">RFQ #{rfq.id}</p>
        </div>
      </div>

      {/* RFQ Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Project Scope</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{rfq.scope}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Submission Deadline
              </h4>
              <p className="text-gray-700">{new Date(rfq.deadline).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Bids
              </h4>
              <p className="text-gray-700">{bids.length} bid(s) received</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Evaluation Criteria</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{rfq.evaluation_criteria}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bids Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Received Bids ({bids.length})
          </CardTitle>
          <CardDescription>
            Review and evaluate submitted bids
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bids.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No bids received yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Bidders will be able to submit their proposals until the deadline
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={bid.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-lg">Bid from {bid.bidder}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${bid.price.toLocaleString()}
                        </span>
                        <span>Timeline: {bid.timeline}</span>
                      </div>
                    </div>
                    <Badge className={getBidStatusColor(bid.status)}>
                      {bid.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Qualifications</h5>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{bid.qualifications}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Document Hash</h5>
                      <p className="text-gray-500 text-sm font-mono">{bid.document_hash}</p>
                    </div>
                  </div>

                  {rfq.status === 'open' && bid.status === 'submitted' && (
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        onClick={() => handleSelectWinner(bid.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Select as Winner
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

