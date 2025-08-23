// src/pages/CreateRFQ.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

// ✅ import blockchain helpers
import { createRFQ as createRFQOnChain } from '@/web3/rfq'

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
    evaluation_weights: ''
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // ✅ First: call smart contract
      const onchainResult = await createRFQOnChain({
        title: formData.title,
        scope: formData.scope,
        deadline: formData.deadline,
        evaluationCriteria: formData.evaluation_criteria,
        budget: formData.budget_max || formData.budget_min || '0',
        category: formData.category,
        location: '' // optional field in contract
      })

      console.log("On-chain RFQ created:", onchainResult)

      // ✅ Build metadata for backend
      const metadata = {
        ...formData,
        onchain_id: onchainResult.rfqId,   // include blockchain ID
        tx_hash: onchainResult.txHash,     // keep tx hash for reference
        budget_min: formData.budget_min || null,
        budget_max: formData.budget_max || null,
        publish_date: formData.publish_date || null,
        clarification_deadline: formData.clarification_deadline || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        evaluation_weights: formData.evaluation_weights
      }

      let response
      if (files.length > 0) {
        const fd = new FormData()
        fd.append('metadata', JSON.stringify(metadata))
        files.forEach(f => fd.append('files', f))
        response = await fetch('http://127.0.0.1:5000/api/rfqs', {
          method: 'POST',
          credentials: 'include',
          body: fd
        })
      } else {
        response = await fetch('http://127.0.0.1:5000/api/rfqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(metadata)
        })
      }

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create RFQ')
      }

      const rfq = await response.json()
      alert(`✅ RFQ created. On-chain ID: ${rfq.onchain_id}, Tx: ${rfq.tx_hash}`)
      navigate(`/dashboard/rfqs/${rfq.id}`)
    } catch (err) {
      console.error("CreateRFQ error:", err)
      setError(err.message || 'Network error. Please try again.')
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
            {/* Title, Category, Budget */}
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

            {/* Scope */}
            <div>
              <Label htmlFor="scope">Project Scope *</Label>
              <Textarea id="scope" name="scope" value={formData.scope} onChange={handleChange} rows={6} required />
            </div>

            {/* Evaluation criteria */}
            <div>
              <Label htmlFor="evaluation_criteria">Evaluation Criteria *</Label>
              <Textarea id="evaluation_criteria" name="evaluation_criteria" value={formData.evaluation_criteria} onChange={handleChange} rows={4} required />
            </div>

            {/* Deadlines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Submission Deadline *</Label>
                <Input name="deadline" type="datetime-local" value={formData.deadline} onChange={handleChange} required />
              </div>
              <div>
                <Label>Clarification Deadline</Label>
                <Input name="clarification_deadline" type="datetime-local" value={formData.clarification_deadline} onChange={handleChange} />
              </div>
            </div>

            {/* Project dates */}
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

            {/* Eligibility + weights */}
            <div>
              <Label>Eligibility Requirements</Label>
              <Textarea name="eligibility_requirements" value={formData.eligibility_requirements} onChange={handleChange} rows={3} />
            </div>
            <div>
              <Label>Evaluation Weights</Label>
              <Input name="evaluation_weights" value={formData.evaluation_weights} onChange={handleChange} placeholder="e.g. Price 40%, Technical 40%, Experience 20%" />
            </div>

            {/* Files */}
            <div>
              <Label>Attach Supporting Documents</Label>
              <Input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="cursor-pointer" />
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
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
