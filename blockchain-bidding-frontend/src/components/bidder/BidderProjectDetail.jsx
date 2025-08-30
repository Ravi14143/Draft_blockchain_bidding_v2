import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BidderProjectDetails() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")

  useEffect(() => {
    fetchProject()
    fetchMilestones()
  }, [projectId])

  const fetchProject = async () => {
    const res = await fetch(`http://127.0.0.1:5000/api/projects/${projectId}`, { credentials: 'include' })
    if (res.ok) setProject(await res.json())
  }

  const fetchMilestones = async () => {
    const res = await fetch(`http://127.0.0.1:5000/api/projects/${projectId}/milestones`, { credentials: 'include' })
    if (res.ok) setMilestones(await res.json())
  }

  const submitMilestone = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: projectId,
          description,
          due_date: dueDate
        })
      })
      if (res.ok) {
        fetchMilestones()
        setDescription("")
        setDueDate("")
      }
    } catch (err) {
      console.error("Error creating milestone:", err)
    }
  }

  if (!project) return <div>Loading project...</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{project.rfq_title || "Project Details"}</h2>
      <p><b>Status:</b> {project.status}</p>

      <h3 className="mt-6 text-xl font-bold">Milestones</h3>
      {milestones.map(ms => (
        <Card key={ms.id} className="mb-2">
          <CardHeader>
            <CardTitle>{ms.description}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><b>Due Date:</b> {ms.due_date}</p>
            <p><b>Status:</b> {ms.status}</p>
          </CardContent>
        </Card>
      ))}

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
        <Button onClick={submitMilestone}>Submit Milestone</Button>
      </div>
    </div>
  )
}
