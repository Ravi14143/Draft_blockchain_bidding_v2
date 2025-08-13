import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, CheckCircle, Clock, Calendar, FileText, Upload } from 'lucide-react'

export default function BidderProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({
    description: '',
    due_date: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProjectDetails()
  }, [id])

  const fetchProjectDetails = async () => {
    try {
      const [projectResponse, milestonesResponse] = await Promise.all([
        fetch(`/api/projects/${id}`, { credentials: 'include' }),
        fetch(`/api/projects/${id}/milestones`, { credentials: 'include' })
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

  const handleSubmitMilestone = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          project_id: parseInt(id),
          description: milestoneForm.description,
          due_date: milestoneForm.due_date
        }),
      })

      if (response.ok) {
        setSuccess('Milestone submitted successfully!')
        setShowMilestoneForm(false)
        setMilestoneForm({ description: '', due_date: '' })
        fetchProjectDetails() // Refresh milestones
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit milestone')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setMilestoneForm({
      ...milestoneForm,
      [e.target.name]: e.target.value
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'submitted':
        return <Upload className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project details...</div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => navigate('/dashboard/my-projects')} className="mt-4">
          Back to My Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/my-projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Projects
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-gray-900">{project.rfq_title}</h2>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-gray-600">Project #{project.id}</p>
        </div>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Source RFQ
              </h4>
              <p className="text-gray-700">RFQ #{project.rfq_id}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Project Status</h4>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Project Milestones ({milestones.length})
              </CardTitle>
              <CardDescription>
                Submit milestones and track their approval status
              </CardDescription>
            </div>
            <Button onClick={() => setShowMilestoneForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Milestone Form */}
          {showMilestoneForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Submit New Milestone</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitMilestone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Milestone Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={milestoneForm.description}
                      onChange={handleChange}
                      placeholder="Describe the milestone deliverable and what has been completed..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={milestoneForm.due_date}
                      onChange={handleChange}
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
                      onClick={() => setShowMilestoneForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      <Upload className="h-4 w-4 mr-2" />
                      {submitting ? 'Submitting...' : 'Submit Milestone'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Milestones List */}
          {milestones.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No milestones submitted yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Add milestones to track your project progress
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3">
                      {getMilestoneIcon(milestone.status)}
                      <div>
                        <h4 className="font-medium text-lg">{milestone.description}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getMilestoneStatusColor(milestone.status)}>
                      {milestone.status}
                    </Badge>
                  </div>

                  {milestone.document_hash && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-1">Evidence Hash</h5>
                      <p className="text-gray-500 text-sm font-mono">{milestone.document_hash}</p>
                    </div>
                  )}

                  {milestone.status === 'approved' && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="font-medium">Milestone approved by project owner</span>
                      </div>
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

