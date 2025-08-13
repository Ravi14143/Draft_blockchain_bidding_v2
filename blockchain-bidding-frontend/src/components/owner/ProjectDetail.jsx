import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, User, Calendar, FileText } from 'lucide-react'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

      if (response.ok) {
        // Refresh milestones
        fetchProjectDetails()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to approve milestone')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
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
        return <Clock className="h-5 w-5 text-blue-600" />
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

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Project not found'}</p>
        <Button onClick={() => navigate('/dashboard/projects')} className="mt-4">
          Back to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
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
                <User className="h-4 w-4 mr-2" />
                Contractor
              </h4>
              <p className="text-gray-700">{project.winner_bidder}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Source RFQ
              </h4>
              <p className="text-gray-700">RFQ #{project.rfq_id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Project Milestones ({milestones.length})
          </CardTitle>
          <CardDescription>
            Track project progress and approve milestone deliverables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No milestones submitted yet</p>
              <p className="text-sm text-gray-400 mt-2">
                The contractor will submit milestones as work progresses
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
                      <h5 className="font-medium text-gray-900 mb-1">Submitted Evidence</h5>
                      <p className="text-gray-500 text-sm font-mono">{milestone.document_hash}</p>
                    </div>
                  )}

                  {milestone.status === 'submitted' && (
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => handleApproveMilestone(milestone.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Milestone
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

