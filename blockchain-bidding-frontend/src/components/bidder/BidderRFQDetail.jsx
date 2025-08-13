import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, User, Send, DollarSign } from 'lucide-react'

export default function BidderRFQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRFQ] = useState(null)
  const [existingBid, setExistingBid] = useState(null)
  const [bidForm, setBidForm] = useState({
    price: '',
    timeline: '',
    qualifications: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchRFQDetails()
  }, [id])

  const fetchRFQDetails = async () => {
    try {
      const [rfqResponse, bidsResponse] = await Promise.all([
        fetch(`/api/rfqs/${id}`, { credentials: 'include' }),
        fetch(`/api/rfqs/${id}/bids`, { credentials: 'include' })
      ])

      if (rfqResponse.ok) {
        const rfqData = await rfqResponse.json()
        setRFQ(rfqData)
        
        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json()
          if (bidsData.length > 0) {
            setExistingBid(bidsData[0]) // Bidder can only see their own bid
          }
        }
      } else {
        setError('Failed to load RFQ details')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rfq_id: parseInt(id),
          price: parseFloat(bidForm.price),
          timeline: bidForm.timeline,
          qualifications: bidForm.qualifications
        }),
      })

      if (response.ok) {
        setSuccess('Bid submitted successfully!')
        fetchRFQDetails() // Refresh to show the submitted bid
        setBidForm({ price: '', timeline: '', qualifications: '' })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit bid')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setBidForm({
      ...bidForm,
      [e.target.name]: e.target.value
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading RFQ details...</div>
      </div>
    )
  }

  if (error && !rfq) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => navigate('/dashboard/rfqs')} className="mt-4">
          Back to RFQs
        </Button>
      </div>
    )
  }

  const isDeadlinePassed = new Date(rfq.deadline) < new Date()
  const canSubmitBid = rfq.status === 'open' && !isDeadlinePassed && !existingBid

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
            <Badge className="bg-green-100 text-green-800">
              {rfq.status}
            </Badge>
          </div>
          <p className="text-gray-600">RFQ #{rfq.id} by {rfq.owner}</p>
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
              {isDeadlinePassed && (
                <p className="text-red-600 text-sm mt-1">Deadline has passed</p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Project Owner
              </h4>
              <p className="text-gray-700">{rfq.owner}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Evaluation Criteria</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{rfq.evaluation_criteria}</p>
          </div>
        </CardContent>
      </Card>

      {/* Existing Bid or Bid Form */}
      {existingBid ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Your Submitted Bid
            </CardTitle>
            <CardDescription>
              You have already submitted a bid for this RFQ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Bid Amount
                </h4>
                <p className="text-gray-700">${existingBid.price.toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                <p className="text-gray-700">{existingBid.timeline}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Qualifications</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{existingBid.qualifications}</p>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className={existingBid.status === 'selected' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                {existingBid.status}
              </Badge>
              {existingBid.status === 'selected' && (
                <span className="text-green-600 font-medium">Congratulations! You won this bid.</span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : canSubmitBid ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Submit Your Bid
            </CardTitle>
            <CardDescription>
              Provide your proposal for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitBid} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Bid Amount (USD) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={bidForm.price}
                    onChange={handleChange}
                    placeholder="Enter your bid amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline">Project Timeline *</Label>
                  <Input
                    id="timeline"
                    name="timeline"
                    value={bidForm.timeline}
                    onChange={handleChange}
                    placeholder="e.g., 4 weeks, 2 months"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications & Approach *</Label>
                <Textarea
                  id="qualifications"
                  name="qualifications"
                  value={bidForm.qualifications}
                  onChange={handleChange}
                  placeholder="Describe your relevant experience, qualifications, and approach to this project..."
                  rows={6}
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/rfqs')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDeadlinePassed ? 'Bidding Closed' : 'RFQ Closed'}
            </h3>
            <p className="text-gray-500">
              {isDeadlinePassed 
                ? 'The submission deadline has passed for this RFQ'
                : 'This RFQ is no longer accepting bids'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

