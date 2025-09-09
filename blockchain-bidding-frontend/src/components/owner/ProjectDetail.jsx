import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react'

// Simple workflow stepper component
function WorkflowStepper({ milestones }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0">
      {milestones.map((m, index) => (
        <div key={m.id} className="flex items-center md:flex-1">
          <div className="flex flex-col items-center md:items-start">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-white ${
                m.status === 'approved'
                  ? 'bg-green-600'
                  : m.status === 'submitted'
                  ? 'bg-blue-600'
                  : m.status === 'rejected'
                  ? 'bg-red-600'
                  : 'bg-gray-400'
              }`}
            >
              {index + 1}
            </div>
            <p className="text-sm mt-2 text-center md:text-left">{m.description}</p>
          </div>
          {index < milestones.length - 1 && (
            <div className="hidden md:block flex-1 h-0.5 bg-gray-300 mx-4" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectComment, setRejectComment] = useState('')

  useEffect(() => {
    fetchProjectDetails()
  }, [id])

  const fetchProjectDetails = async () => {
    try {
      const [projectResponse, milestonesResponse] = await Promise.all([
        fetch(`http://127.0.0.1:5000/api/projects/${id}`, { credentials: 'include' }),
        fetch(`http://127.0.0.1:5000/api/projects/${id}/milestones`, { credentials: 'include' })
      ])

      if (projectResponse.ok && milestonesResponse.ok) {
        const projectData = await projectResponse.json()
        const milestonesData = await milestonesResponse.json()
        setProject(projectData)
        setMilestones(milestonesData)
      } else {
        setError('Failed to load project details')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveMilestone = async (milestoneId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/milestones/${milestoneId}/approve`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) fetchProjectDetails()
    } catch {
      setError('Failed to approve milestone')
    }
  }

  const handleRejectMilestone = async (milestoneId) => {
    if (!rejectComment) return alert('Please provide rejection comments.')
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/milestones/${milestoneId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: rejectComment })
      })
      if (response.ok) {
        setRejectingId(null)
        setRejectComment('')
        fetchProjectDetails()
      }
    } catch {
      setError('Failed to reject milestone')
    }
  }

  const handleResubmitMilestone = async (milestoneId) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/milestones/${milestoneId}/resubmit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_hash: 'new_doc_hash_123' }) // placeholder hash
      })
      if (response.ok) fetchProjectDetails()
    } catch {
      setError('Failed to resubmit milestone')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>
  if (error || !project) return (
    <div className="text-center py-12">
      <p className="text-red-600">{error || 'Project not found'}</p>
      <Button onClick={() => navigate('/dashboard/projects')} className="mt-4">Back</Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold">{project.rfq_title}</h2>
            <Badge className={getStatusColor(project.status)}>{project.status?.replace('_', ' ') || 'unknown'}</Badge>
          </div>
          <p className="text-gray-600">Project #{project.id}</p>
        </div>
      </div>

      {milestones.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Workflow Progress</CardTitle></CardHeader>
          <CardContent><WorkflowStepper milestones={milestones} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Milestones ({milestones.length})</CardTitle>
          <CardDescription>Approve, reject, or track submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.map((m) => (
            <div key={m.id} className="border rounded-lg p-6 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium text-lg">{m.description}</h4>
                  <p className="text-sm text-gray-500">Due: {m.due_date ? new Date(m.due_date).toLocaleDateString() : "N/A"}</p>
                  {m.comments && <p className="text-sm text-red-600 mt-2">Owner comments: {m.comments}</p>}
                </div>
                <Badge className={getMilestoneStatusColor(m.status)}>{m.status}</Badge>
              </div>

              {m.status === 'submitted' && (
                <div className="flex space-x-2">
                  <Button onClick={() => handleApproveMilestone(m.id)} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  {rejectingId === m.id ? (
                    <div className="space-y-2 flex-1">
                      <Textarea
                        placeholder="Add rejection comments..."
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button onClick={() => handleRejectMilestone(m.id)} className="bg-red-600 hover:bg-red-700">
                          Confirm Reject
                        </Button>
                        <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setRejectingId(m.id)} className="bg-red-600 hover:bg-red-700">
                      <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  )}
                </div>
              )}

              {m.status === 'rejected' && (
                <Button onClick={() => handleResubmitMilestone(m.id)} className="bg-blue-600 hover:bg-blue-700 mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" /> Resubmit
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
