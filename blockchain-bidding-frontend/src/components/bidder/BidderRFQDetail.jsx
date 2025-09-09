// BidderRFQDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react'
import WorkflowStepper from './WorkflowStepper'

export default function BidderRFQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfq, setRFQ] = useState(null)
  const [existingBid, setExistingBid] = useState(null)
  const [bidForm, setBidForm] = useState({ price: '', timeline: '', qualifications: '' })
  const [clarificationResponse, setClarificationResponse] = useState('')
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
        fetch(`http://127.0.0.1:5000/api/rfqs/${id}`, { credentials: 'include' }),
        fetch(`http://127.0.0.1:5000/api/rfqs/${id}/bids`, { credentials: 'include' })
      ])

      if (rfqResponse.ok) {
        const rfqData = await rfqResponse.json()
        setRFQ(rfqData)

        if (bidsResponse.ok) {
          const bidsData = await bidsResponse.json()
          if (bidsData.length > 0) {
            setExistingBid(bidsData[0])
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
      const response = await fetch('http://127.0.0.1:5000/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        fetchRFQDetails()
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

  const handleClarificationSubmit = async () => {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/bids/${existingBid.id}/respond-clarification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ response: clarificationResponse }),
      })
      if (response.ok) {
        setSuccess('Clarification submitted successfully!')
        setClarificationResponse('')
        fetchRFQDetails()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit clarification')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setBidForm({ ...bidForm, [e.target.name]: e.target.value })
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

  const workflowSteps = [
    'Draft Created',
    'Blockchain Recorded',
    'Published',
    'Bidding Active',
    'Evaluation',
    'Contract Awarded',
    'Project Execution',
    'Completed',
  ]

  const currentStepIndex = existingBid
    ? (existingBid.status === 'clarification_needed'
        ? 4
        : existingBid.status === 'rejected'
        ? 4
        : existingBid.status === 'selected'
        ? 5
        : 3)
    : 2

  return (
    <div className="space-y-6">
      {/* RFQ HEADER */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/rfqs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQs
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-gray-900">{rfq.title}</h2>
            <Badge className="bg-green-100 text-green-800">{rfq.status}</Badge>
          </div>
          <p className="text-gray-600">RFQ #{rfq.id} by {rfq.owner}</p>
        </div>
      </div>

      {/* Workflow Stepper */}
      <Card>
        <CardHeader><CardTitle>Project Workflow</CardTitle></CardHeader>
        <CardContent>
          <WorkflowStepper steps={workflowSteps} currentStep={currentStepIndex} />
        </CardContent>
      </Card>

      {/* RFQ Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Scope:</strong> {rfq.scope}</p>
          <p><strong>Category:</strong> {rfq.category || 'N/A'}</p>
          <p><strong>Budget:</strong> {rfq.budget_min ? `$${rfq.budget_min}` : '?'} – {rfq.budget_max ? `$${rfq.budget_max}` : '?'}</p>
          <p><strong>Deadline:</strong> {new Date(rfq.deadline).toLocaleString()}</p>
          <p><strong>Publish Date:</strong> {rfq.publish_date ? new Date(rfq.publish_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Clarification Deadline:</strong> {rfq.clarification_deadline ? new Date(rfq.clarification_deadline).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Start Date:</strong> {rfq.start_date ? new Date(rfq.start_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong>End Date:</strong> {rfq.end_date ? new Date(rfq.end_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Eligibility:</strong> {rfq.eligibility_requirements || 'N/A'}</p>
          <p><strong>Evaluation Criteria:</strong> {rfq.evaluation_criteria || 'N/A'}</p>
          {rfq.evaluation_weights && (
            <div>
              <strong>Evaluation Weights:</strong>
              <pre className="bg-gray-100 p-2 rounded text-xs">{rfq.evaluation_weights}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXISTING BID VIEW */}
      {existingBid ? (
        <Card>
          <CardHeader><CardTitle>Your Submitted Bid</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p><strong>Price:</strong> ${existingBid.price}</p>
            <p><strong>Timeline:</strong> {existingBid.timeline}</p>
            <p><strong>Qualifications:</strong> {existingBid.qualifications}</p>

            {/* Bid Status */}
            <Badge className={
              existingBid.status === 'selected'
                ? 'bg-green-100 text-green-800'
                : existingBid.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : existingBid.status === 'clarification_needed'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-blue-100 text-blue-800'
            }>
              {existingBid.status}
            </Badge>

            {/* Phase 1 Evaluation */}
            {existingBid.phase1_status && (
              <div className="p-3 border rounded bg-gray-50 space-y-2">
                <h4 className="font-medium">AI Phase 1 Evaluation</h4>
                <p>Status: <Badge>{existingBid.phase1_status}</Badge></p>
                {existingBid.phase1_report ? (
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(existingBid.phase1_report).map(([key, value]) => (
                      <li key={key}><strong>{key.replace(/_/g, " ")}:</strong> {String(value)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No detailed report available.</p>
                )}
              </div>
            )}

            {/* Phase 2 Evaluation */}
            {existingBid.phase2_status && (
              <div className="p-3 border rounded bg-gray-50 space-y-2">
                <h4 className="font-medium">AI Phase 2 Evaluation</h4>
                <p>Status: <Badge>{existingBid.phase2_status}</Badge></p>
                <p>Score: <span className="font-semibold">{existingBid.phase2_score}</span></p>
                {existingBid.phase2_breakdown ? (
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left px-2 py-1 border">Criterion</th>
                        <th className="text-left px-2 py-1 border">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(existingBid.phase2_breakdown).map(([criterion, score]) => (
                        <tr key={criterion}>
                          <td className="px-2 py-1 border capitalize">{criterion.replace(/_/g, " ")}</td>
                          <td className="px-2 py-1 border">{score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm">No breakdown available.</p>
                )}
                {existingBid.red_flags?.length > 0 && (
                  <div className="mt-2 text-red-600">
                    <strong>⚠️ Red Flags:</strong>
                    <ul className="list-disc list-inside">
                      {existingBid.red_flags.map((flag, idx) => (
                        <li key={idx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Clarification Needed */}
            {existingBid.status === 'clarification_needed' && (
              <div className="space-y-2">
                <Label htmlFor="clarification">Respond to Clarification</Label>
                <Textarea
                  id="clarification"
                  value={clarificationResponse}
                  onChange={(e) => setClarificationResponse(e.target.value)}
                  placeholder="Provide the requested details..."
                  rows={4}
                />
                <Button onClick={handleClarificationSubmit} disabled={submitting || !clarificationResponse}>
                  {submitting ? 'Submitting...' : 'Submit Clarification'}
                </Button>
              </div>
            )}

            {/* Rejected Reason */}
            {existingBid.status === 'rejected' && existingBid.phase1_evaluation?.reason && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>Reason: {existingBid.phase1_evaluation.reason}</span>
              </div>
            )}

            {/* Selected Congrats */}
            {existingBid.status === 'selected' && (
              <p className="text-green-600 font-semibold">🎉 Congratulations! You won this project.</p>
            )}
          </CardContent>
        </Card>
      ) : canSubmitBid ? (
        // New Bid Form
        <Card>
          <CardHeader><CardTitle>Submit Your Bid</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitBid} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Bid Amount (USD)</Label>
                  <Input id="price" name="price" type="number" step="0.01" value={bidForm.price} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input id="timeline" name="timeline" value={bidForm.timeline} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea id="qualifications" name="qualifications" rows={6} value={bidForm.qualifications} onChange={handleChange} required />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p>{isDeadlinePassed ? 'Deadline has passed' : 'RFQ closed'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
