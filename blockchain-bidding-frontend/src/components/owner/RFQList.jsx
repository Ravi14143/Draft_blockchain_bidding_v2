import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Users, Eye, DollarSign, Tag } from 'lucide-react'

export default function RFQList() {
  const [rfqs, setRFQs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/rfqs', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setRFQs(data)
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (rfq) => {
    const now = new Date()
    const deadline = new Date(rfq.deadline)

    if (deadline < now) {
      return { label: "Closed - Submission Not Allowed", color: "bg-red-200 text-red-800" }
    }
    return { label: "Open", color: "bg-green-200 text-green-800" }
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline set'
    try {
      return new Date(deadline).toLocaleString()
    } catch {
      return deadline
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading RFQs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Request for Quotations</h2>
          <p className="text-gray-600">Manage your project RFQs and review bids</p>
        </div>
        <Link to="/dashboard/rfqs/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New RFQ
          </Button>
        </Link>
      </div>

      {rfqs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first Request for Quotation</p>
            <Link to="/dashboard/rfqs/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First RFQ
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {rfqs.map((rfq) => {
            const status = getStatus(rfq)

            return (
              <Card key={rfq.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{rfq.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {rfq.scope.length > 150 
                          ? `${rfq.scope.substring(0, 150)}...` 
                          : rfq.scope
                        }
                      </CardDescription>
                    </div>
                    <Badge className={`${status.color} p-2`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Deadline: {formatDeadline(rfq.deadline)}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {rfq.bids_count ?? 0} bids
                    </div>
                    {rfq.category && (
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        Category: {rfq.category}
                      </div>
                    )}
                    {(rfq.budget_min || rfq.budget_max) && (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Budget: {rfq.budget_min ? `$${rfq.budget_min.toLocaleString()}` : 'N/A'} - {rfq.budget_max ? `$${rfq.budget_max.toLocaleString()}` : 'N/A'}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    <Link to={`/dashboard/rfqs/${rfq.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
