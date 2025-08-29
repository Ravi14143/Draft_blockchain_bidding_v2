import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Plus, Calendar, Users, Eye } from 'lucide-react'

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline set'
    
    try {
      const date = new Date(deadline)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      
      return `${day}-${month}-${year} ${displayHours}:${minutes} ${ampm}`
    } catch (error) {
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
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
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
          {rfqs.map((rfq) => (
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
                  <Badge className={rfq.status == "open" ? "bg-green-200 text-green-800 p-4" : "bg-red-200 text-red-800 p-4"}>
                    {rfq.status == "open" ? "Open" : "Closed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Deadline: {formatDeadline(rfq.deadline)}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {rfq.bids?.length || 0} bids
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/dashboard/rfqs/${rfq.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}