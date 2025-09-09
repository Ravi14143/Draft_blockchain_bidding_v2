// src/components/owner/CreateRFQ.jsx
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
    evaluation_criteria: '',
    category: '',
    budget_min: '',
    budget_max: '',
    publish_date: '',
    clarification_deadline: '',
    start_date: '',
    end_date: '',
    eligibility_requirements: '',
    evaluation_weights: '',
    location: ''
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const fd = new FormData()

      // ✅ Send all fields as JSON string under key "metadata"
      fd.append("metadata", JSON.stringify(formData))

      // ✅ Append files
      files.forEach((f) => fd.append("files", f))

      // Debug log
      console.log("✅ FormData to be sent:")
      for (let pair of fd.entries()) {
        console.log(pair[0], ":", pair[1])
      }

      const response = await fetch("http://127.0.0.1:5000/api/rfqs", {
        method: "POST",
        credentials: "include",
        body: fd
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to create RFQ")
      }

      const rfq = await response.json()
      console.log("✅ RFQ created:", rfq)
      alert(`✅ RFQ created. On-chain ID: ${rfq.onchain_id}, Tx: ${rfq.tx_hash}`)
      navigate(`/dashboard/rfqs/${rfq.id}`)
    } catch (err) {
      setError(err.message || "Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
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
          <CardDescription>Provide comprehensive information about your project requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="budget_min">Budget Min</Label>
                <Input id="budget_min" name="budget_min" type="number" value={formData.budget_min} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="budget_max">Budget Max</Label>
                <Input id="budget_max" name="budget_max" type="number" value={formData.budget_max} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label htmlFor="scope">Project Scope *</Label>
              <Textarea id="scope" name="scope" value={formData.scope} onChange={handleChange} rows={6} required />
            </div>

            <div>
              <Label htmlFor="evaluation_criteria">Evaluation Criteria *</Label>
              <Textarea id="evaluation_criteria" name="evaluation_criteria" value={formData.evaluation_criteria} onChange={handleChange} rows={4} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Submission Deadline *</Label>
                <Input name="deadline" type="date" value={formData.deadline} onChange={handleChange} required />
              </div>
              <div>
                <Label>Clarification Deadline</Label>
                <Input name="clarification_deadline" type="date" value={formData.clarification_deadline} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Start Date</Label>
                <Input name="start_date" type="date" value={formData.start_date} onChange={handleChange} />
              </div>
              <div>
                <Label>Project End Date</Label>
                <Input name="end_date" type="date" value={formData.end_date} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label>Eligibility Requirements</Label>
              <Textarea name="eligibility_requirements" value={formData.eligibility_requirements} onChange={handleChange} rows={3} />
            </div>
            <div>
              <Label>Evaluation Weights</Label>
              <Input name="evaluation_weights" value={formData.evaluation_weights} onChange={handleChange} placeholder="e.g. Price 40%, Technical 40%, Experience 20%" />
            </div>
            <div>
              <Label>Location</Label>
              <Input name="location" value={formData.location} onChange={handleChange} placeholder="Optional short location" />
            </div>

            <div>
              <Label>Attach Supporting Documents</Label>
              <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="cursor-pointer" />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard/rfqs')}>
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
