// BidderRFQDetail.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Paperclip } from 'lucide-react'
import WorkflowStepper from './WorkflowStepper'

export default function BidderRFQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [rfq, setRFQ] = useState(null)
  const [existingBid, setExistingBid] = useState(null)
  const [bidForm, setBidForm] = useState({ price: '', timeline_start: '', timeline_end: '', qualifications: '' })
  const [files, setFiles] = useState([])
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
          if (Array.isArray(bidsData) && bidsData.length > 0) {
            setExistingBid(bidsData[0])
          }
        }
      } else {
        setError('Failed to load RFQ details')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleSubmitBid = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append(
        'data',
        JSON.stringify({
          rfq_id: parseInt(id),
          price: parseFloat(bidForm.price) || 0,
          timeline_start: bidForm.timeline_start,
          timeline_end: bidForm.timeline_end,
          qualifications: bidForm.qualifications || '',
        })
      )
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('http://127.0.0.1:5000/api/bids', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (response.ok) {
        setSuccess('Bid submitted successfully!')
        fetchRFQDetails()
        setBidForm({ price: '', timeline_start: '', timeline_end: '', qualifications: '' })
        setFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch {}
        setError(errorData.error || 'Failed to submit bid')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClarificationSubmit = async () => {
    if (!existingBid) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/bids/${existingBid.id}/respond-clarification`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ response: clarificationResponse }),
        }
      )
      if (response.ok) {
        setSuccess('Clarification submitted successfully!')
        setClarificationResponse('')
        fetchRFQDetails()
      } else {
        let errorData = {}
        try {
          errorData = await response.json()
        } catch {}
        setError(errorData.error || 'Failed to submit clarification')
      }
    } catch {
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

  const deadlinePassed = rfq?.deadline ? new Date(rfq.deadline) < new Date() : false
  const rfqOpen = rfq?.status === 'open' || rfq?.status === 'active'
  const canSubmitBid = rfqOpen && !deadlinePassed && !existingBid

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
    ? existingBid.status === 'clarification_needed'
      ? 4
      : existingBid.status === 'rejected'
      ? 4
      : existingBid.status === 'selected'
      ? 5
      : 3
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
          <p className="text-gray-600">RFQ #{rfq.id} by {rfq.owner || 'Unknown'}</p>
        </div>
      </div>

      {/* Workflow Stepper */}
      <Card>
        <CardHeader>
          <CardTitle>Project Workflow</CardTitle>
        </CardHeader>
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
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p><strong>Scope:</strong> {rfq.scope || 'N/A'}</p>
            <p><strong>Category:</strong> {rfq.category || 'N/A'}</p>
            <p><strong>Budget:</strong> 
              {rfq.budget_min ? `$${rfq.budget_min}` : '?'} – 
              {rfq.budget_max ? `$${rfq.budget_max}` : '?'}
            </p>
            <p><strong>Deadline:</strong> {rfq.deadline ? new Date(rfq.deadline).toLocaleString() : 'N/A'}</p>
            <p><strong>Start Date:</strong> {rfq.start_date ? new Date(rfq.start_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>End Date:</strong> {rfq.end_date ? new Date(rfq.end_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Eligibility:</strong> {rfq.eligibility_requirements || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bid Section */}
{existingBid ? (
  <Card>
    <CardHeader>
      <CardTitle>Your Submitted Bid</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p><strong>Price:</strong> ${existingBid.price}</p>
      <p>
        <strong>Timeline:</strong> 
        {existingBid.timeline_start && existingBid.timeline_end 
          ? `${new Date(existingBid.timeline_start).toLocaleDateString()} - ${new Date(existingBid.timeline_end).toLocaleDateString()}`
          : 'N/A'}
      </p>
      <p><strong>Qualifications:</strong> {existingBid.qualifications}</p>

     {/* PHASE 1 & PHASE 2 RESULTS */}
<div className="space-y-4 mt-4">
  {/* Phase 1 */}
  <div>
    <p><strong>Phase 1 Status:</strong> 
      <Badge className={`ml-2 ${existingBid.phase1_status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {existingBid.phase1_status || 'Pending'}
      </Badge>
    </p>
    {existingBid.phase1_report && (
      <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
        <strong>Phase 1 Report:</strong>
        <ul className="list-disc list-inside">
          {Object.entries(existingBid.phase1_report).map(([key, value]) => (
            <li key={key}>
              <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {Array.isArray(value) ? value.join(', ') : value.toString()}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>

  {/* Phase 2 */}
  <div>
    <p><strong>Phase 2 Status:</strong> 
      <Badge className={`ml-2 ${existingBid.phase2_status === 'pass' ? 'bg-green-100 text-green-800' : existingBid.phase2_status === 'fail' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {existingBid.phase2_status || 'Pending'}
      </Badge>
    </p>
    {existingBid.phase2_breakdown && (
      <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
        <strong>Phase 2 Breakdown:</strong>
        <ul className="list-disc list-inside">
          {Object.entries(existingBid.phase2_breakdown).map(([key, value]) => (
            <li key={key}>
              <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {Array.isArray(value) ? value.join(', ') : value.toString()}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
</div>

    </CardContent>
  </Card>
) : canSubmitBid ? (
  <Card>
    <CardHeader>
      <CardTitle>Submit Your Bid</CardTitle>
    </CardHeader>
    <CardContent>
      {submitting && (
        <div className="flex items-center space-x-2 mb-4 text-blue-600">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Evaluating your bid, please wait...</span>
        </div>
      )}
      <form onSubmit={handleSubmitBid} className="space-y-6">
        {/* Form fields remain unchanged */}
      </form>
    </CardContent>
  </Card>
) : (
  <Card>
    <CardContent className="text-center py-8">
      <p>{deadlinePassed ? 'Deadline has passed' : 'RFQ closed'}</p>
    </CardContent>
  </Card>
)}

    </div>
  )
}
