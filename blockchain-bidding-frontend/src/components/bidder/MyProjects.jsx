import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, XCircle } from 'lucide-react'

export default function MyProject() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/projects', { credentials: 'include' })
      if (res.ok) {
        setProjects(await res.json())
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your projects...</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        You don’t have any projects yet.
      </Card>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Projects</h2>

      {projects.map((project) => (
        <Card key={project.id} className="mb-4">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{project.rfq_title || 'Unnamed Project'}</CardTitle>
              <p className="text-sm text-gray-500">Project ID: {project.id}</p>
            </div>
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
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Start Date:</strong>{' '}
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString()
                : 'N/A'}
            </p>
            <p>
              <strong>End Date:</strong>{' '}
              {project.end_date
                ? new Date(project.end_date).toLocaleDateString()
                : 'N/A'}
            </p>

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <div className="mt-3">
                <strong className="block mb-2">Milestones:</strong>
                <ul className="space-y-1">
                  {project.milestones.map((ms, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 border rounded p-2 bg-gray-50"
                    >
                      {ms.status === 'completed' ? (
                        <CheckCircle className="text-green-600 h-4 w-4" />
                      ) : ms.status === 'in_progress' ? (
                        <Clock className="text-blue-600 h-4 w-4" />
                      ) : (
                        <XCircle className="text-gray-400 h-4 w-4" />
                      )}
                      <span>
                        <b>{ms.title}</b> – {ms.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* View Details Button */}
            <div className="pt-2">
              <Link to={`/dashboard/projects/${project.id}`}>
                <Button size="sm">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
