import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import WorkflowStepper from './WorkflowStepper'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export default function BidderProjectDetails() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchMilestones()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/projects/${projectId}`, { credentials: 'include' })
      if (res.ok) {
        setProject(await res.json())
      }
    } catch (err) {
      console.error('Error fetching project:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMilestones = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/projects/${projectId}/milestones`, { credentials: 'include' })
      if (res.ok) {
        setMilestones(await res.json())
      }
    } catch (err) {
      console.error('Error fetching milestones:', err)
    }
  }

  const submitMilestone = async () => {
    if (!description || !dueDate) return
    setSubmitting(true)
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          description,
          due_date: dueDate,
        }),
      })
      if (res.ok) {
        fetchMilestones()
        setDescription('')
        setDueDate('')
      }
    } catch (err) {
      console.error('Error creating milestone:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const markMilestoneComplete = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/milestones/${id}/complete`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) fetchMilestones()
    } catch (err) {
      console.error('Error updating milestone:', err)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Loading project...</div>
  }

  if (!project) {
    return <div className="p-6 text-center text-red-600">Project not found.</div>
  }

  const workflowSteps = [
    'Contract Awarded',
    'Project Execution',
    'Monitoring',
    'Completion',
  ]

  const currentStepIndex =
    project.status === 'awarded'
      ? 0
      : project.status === 'in_progress'
      ? 1
      : project.status === 'monitoring'
      ? 2
      : project.status === 'completed'
      ? 3
      : 0

  return (
    <div className="space-y-6">
      {/* PROJECT HEADER */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{project.rfq_title || 'Project Details'}</h2>
        <p>
          <b>Status:</b>{' '}
          <Badge
            className={
              project.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : project.status === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }
          >
            {project.status}
          </Badge>
        </p>
      </div>

      {/* WORKFLOW STEPPER */}
      <Card>
        <CardHeader>
          <CardTitle>Project Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowStepper steps={workflowSteps} currentStep={currentStepIndex} />
        </CardContent>
      </Card>

      {/* MILESTONES */}
      <div>
        <h3 className="mt-6 text-xl font-bold">Milestones</h3>
        {milestones.length === 0 ? (
          <p className="text-gray-500 mt-2">No milestones yet.</p>
        ) : (
          milestones.map((ms) => (
            <Card key={ms.id} className="mb-2">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-base">{ms.description}</CardTitle>
                {ms.status === 'completed' ? (
                  <CheckCircle className="text-green-600 h-5 w-5" />
                ) : ms.status === 'in_progress' ? (
                  <Clock className="text-blue-600 h-5 w-5" />
                ) : (
                  <XCircle className="text-gray-400 h-5 w-5" />
                )}
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  <b>Due Date:</b>{' '}
                  {ms.due_date ? new Date(ms.due_date).toLocaleDateString() : 'N/A'}
                </p>
                <p>
                  <b>Status:</b> {ms.status}
                </p>
                {ms.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => markMilestoneComplete(ms.id)}
                  >
                    Mark as Complete
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ADD MILESTONE FORM (OPTIONAL: only for owner role) */}
      <div className="mt-6">
        <h3 className="font-bold">Add Milestone</h3>
        <input
          className="border p-2 w-full my-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 w-full my-2"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <Button onClick={submitMilestone} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Milestone'}
        </Button>
      </div>
    </div>
  )
}
