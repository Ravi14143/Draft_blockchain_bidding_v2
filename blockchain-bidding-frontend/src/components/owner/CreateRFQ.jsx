import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

export default function CreateRFQ() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    scope: '',
    deadline: '',
    evaluation_criteria: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:5000/api/rfqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const rfq = await response.json()
        navigate(`/dashboard/rfqs/${rfq.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to create RFQ')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/rfqs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQs
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Create New RFQ</h2>
          <p className="text-gray-600">Create a new Request for Quotation to invite bids</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RFQ Details</CardTitle>
          <CardDescription>
            Provide comprehensive information about your project requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter a clear and descriptive project title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Project Scope *</Label>
              <Textarea
                id="scope"
                name="scope"
                value={formData.scope}
                onChange={handleChange}
                placeholder="Describe the project requirements, deliverables, and specifications in detail..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Submission Deadline *</Label>
              <Input
                id="deadline"
                name="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evaluation_criteria">Evaluation Criteria *</Label>
              <Textarea
                id="evaluation_criteria"
                name="evaluation_criteria"
                value={formData.evaluation_criteria}
                onChange={handleChange}
                placeholder="Describe how bids will be evaluated (e.g., price, timeline, experience, technical approach)..."
                rows={4}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard/rfqs')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create RFQ'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

