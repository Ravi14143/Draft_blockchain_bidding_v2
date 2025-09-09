import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, Users, Award, DollarSign, AlertTriangle, Paperclip } from 'lucide-react'

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
        fetch(`http://127.0.0.1:5000/api/rfqs/${id}?include_files=true`, { credentials: 'include' }),
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
        fetchRFQDetails()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to select winner')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const getBidStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'selected': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'clarification_needed': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const renderEvaluationData = (data) => {
    if (!data) return null
    if (Array.isArray(data)) {
      return (
        <ul className="list-disc list-inside text-sm text-gray-700">
          {data.map((item, idx) => (
            <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
          ))}
        </ul>
      )
    }
    if (typeof data === 'object') {
      return (
        <dl className="text-sm space-y-1">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="flex">
              <dt className="font-medium w-40 capitalize text-gray-600">{key}:</dt>
              <dd className="text-gray-800">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )
    }
    return <p className="text-sm text-gray-700">{String(data)}</p>
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

  // Categorize bids
  const selectedBids = bids.filter(b => b.status === 'selected')
  const rejectedBids = bids.filter(b => b.status === 'rejected')
  const clarificationBids = bids.filter(b => b.status === 'clarification_needed')
  const otherBids = bids.filter(b => !['selected', 'rejected', 'clarification_needed'].includes(b.status))

  const renderBid = (bid, allowSelectWinner = false) => (
    <div key={bid.id} className="space-y-4">
      <div className="border rounded-lg p-6 space-y-3 shadow-sm bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-lg">Bid from {bid.bidder || `Bidder #${bid.bidder_id}`}</h4>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" /> ${bid.price.toLocaleString()}
              </span>
              <span>Timeline: {bid.timeline}</span>
            </div>
          </div>
          <Badge className={getBidStatusColor(bid.status)}>{bid.status}</Badge>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 mb-1">Qualifications</h5>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{bid.qualifications}</p>
        </div>

        <div>
          <h5 className="font-medium text-gray-900 mb-1">Document Hash</h5>
          <p className="text-gray-500 text-sm font-mono">{bid.document_hash}</p>
        </div>

        {/* AI Evaluations */}
        {bid.phase1_status && (
          <div className="p-3 border rounded bg-gray-50 space-y-2">
            <h5 className="font-medium">AI Phase 1 Evaluation</h5>
            <p>Status: <Badge>{bid.phase1_status}</Badge></p>
            {renderEvaluationData(bid.phase1_report)}
          </div>
        )}

        {bid.phase2_status && (
          <div className="p-3 border rounded bg-gray-50 space-y-2">
            <h5 className="font-medium">AI Phase 2 Evaluation</h5>
            <p>Status: <Badge>{bid.phase2_status}</Badge></p>
            <p><strong>Score:</strong> {bid.phase2_score}</p>
            {renderEvaluationData(bid.phase2_breakdown)}
          </div>
        )}

        {bid.red_flags?.length > 0 && (
          <div className="mt-2 text-red-600">
            <div className="flex items-center font-medium">
              <AlertTriangle className="h-4 w-4 mr-1" /> Red Flags
            </div>
            <ul className="list-disc list-inside text-sm">
              {bid.red_flags.map((flag, idx) => <li key={idx}>{flag}</li>)}
            </ul>
          </div>
        )}

        {allowSelectWinner && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={() => handleSelectWinner(bid.id)} className="bg-green-600 hover:bg-green-700">
              <Award className="h-4 w-4 mr-2" />
              Confirm as Winner
            </Button>
          </div>
        )}
      </div>

      {/* Divider between bidders */}
      <hr className="border-t border-gray-300" />
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/rfqs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQs
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{rfq.title}</h2>
          <p className="text-gray-600">RFQ #{rfq.id}</p>
        </div>
        <Badge className={rfq.submission_status?.includes("closed") ? "bg-red-200 text-red-800 p-2" : "bg-green-200 text-green-800 p-2"}>
          {rfq.submission_status || 'N/A'}
        </Badge>
      </div>

      {/* RFQ Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="mb-2 text-gray-700 whitespace-pre-wrap">{rfq.scope}</p>
          <p><strong>Category:</strong> {rfq.category || 'N/A'}</p>
          <p><strong>Budget:</strong> {rfq.budget_min} - {rfq.budget_max}</p>
          <p><strong>Eligibility:</strong> {rfq.eligibility_requirements || 'N/A'}</p>
          <p className="text-sm text-gray-500 flex items-center">
            <Calendar className="h-4 w-4 mr-1" /> Deadline: {formatDeadline(rfq.deadline)}
          </p>
          <p className="text-sm text-gray-500 flex items-center">
            <Users className="h-4 w-4 mr-1" /> Total Bids: {rfq.bid_count || 0}
          </p>

          {/* Uploaded Files */}
          {rfq.files?.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 flex items-center mb-2">
              <Paperclip className="h-4 w-4 mr-2" /> Attached Files
            </h4>
            <ul className="space-y-1 text-sm">
              {rfq.files.map(file => (
                <li key={file.id}>
                 <a
                  href={`http://127.0.0.1:5000/rfqs/${rfq.id}/files/${encodeURIComponent(file.filename)}`}
                  download={file.filename}   // forces browser download
                  className="text-blue-600 hover:underline flex items-center"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {file.filename}
                </a>
                </li>
              ))}
            </ul>
          </div>
        )}


        </CardContent>
      </Card>

      {/* Selected Bids */}
      {selectedBids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Bids ({selectedBids.length})</CardTitle>
            <CardDescription>Review AI-approved bids and confirm a final winner</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {selectedBids.map(bid => renderBid(bid, true))}
          </CardContent>
        </Card>
      )}

      {/* Rejected Bids */}
      {rejectedBids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rejected Bids ({rejectedBids.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {rejectedBids.map(bid => renderBid(bid))}
          </CardContent>
        </Card>
      )}

      {/* Clarification Needed */}
      {clarificationBids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bids Requiring Clarification ({clarificationBids.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {clarificationBids.map(bid => renderBid(bid))}
          </CardContent>
        </Card>
      )}

      {/* Other Bids */}
      {otherBids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Bids ({otherBids.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {otherBids.map(bid => renderBid(bid))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
