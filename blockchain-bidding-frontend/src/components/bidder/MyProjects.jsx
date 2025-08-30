import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function MyProject() {
  const [projects, setProjects] = useState([])

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
      console.error("Error fetching projects:", err)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Projects</h2>
      {projects.map(project => (
        <Card key={project.id} className="mb-2">
          <CardHeader>
            <CardTitle>{project.rfq_title || "Unnamed Project"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><b>Status:</b> {project.status}</p>
            <Link to={`/dashboard/projects/${project.id}`}>
              <Button className="mt-2">View Details</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
