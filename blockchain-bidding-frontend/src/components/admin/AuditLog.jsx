import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Search, FileText, Users, Briefcase, Award, Calendar } from 'lucide-react'

export default function AuditLog() {
  const [auditEntries, setAuditEntries] = useState([])
  const [filteredEntries, setFilteredEntries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditData()
  }, [])

  useEffect(() => {
    // Filter entries based on search term and type
    let filtered = auditEntries

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType)
    }

    setFilteredEntries(filtered)
  }, [auditEntries, searchTerm, filterType])

  const fetchAuditData = async () => {
    try {
      // Simulate audit log data since we don't have a real audit system
      // In a real application, this would fetch from an audit log API
      const [usersResponse, rfqsResponse, projectsResponse] = await Promise.all([
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/rfqs', { credentials: 'include' }),
        fetch('/api/projects', { credentials: 'include' })
      ])

      if (usersResponse.ok && rfqsResponse.ok && projectsResponse.ok) {
        const users = await usersResponse.json()
        const rfqs = await rfqsResponse.json()
        const projects = await projectsResponse.json()

        // Generate mock audit entries
        const mockAuditEntries = [
          ...users.map((user, index) => ({
            id: `user-${user.id}`,
            type: 'user_registration',
            user: user.username,
            description: `User registered with role: ${user.role}`,
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            severity: 'info'
          })),
          ...rfqs.map((rfq, index) => ({
            id: `rfq-${rfq.id}`,
            type: 'rfq_created',
            user: rfq.owner,
            description: `RFQ created: "${rfq.title}"`,
            timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
            severity: 'info'
          })),
          ...projects.map((project, index) => ({
            id: `project-${project.id}`,
            type: 'project_awarded',
            user: project.winner_bidder,
            description: `Project awarded: "${project.rfq_title}" to ${project.winner_bidder}`,
            timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
            severity: 'success'
          }))
        ]

        // Sort by timestamp (newest first)
        mockAuditEntries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setAuditEntries(mockAuditEntries)
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4" />
      case 'rfq_created':
        return <FileText className="h-4 w-4" />
      case 'project_awarded':
        return <Award className="h-4 w-4" />
      case 'bid_submitted':
        return <Briefcase className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading audit log...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Audit Log</h2>
        <p className="text-gray-600">Monitor platform activities and security events</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Activity Monitor
          </CardTitle>
          <CardDescription>
            Filter and search through platform audit events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search audit entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="user_registration">User Registration</SelectItem>
                <SelectItem value="rfq_created">RFQ Created</SelectItem>
                <SelectItem value="project_awarded">Project Awarded</SelectItem>
                <SelectItem value="bid_submitted">Bid Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>
            Chronological list of platform activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' ? 'No entries found matching your criteria' : 'No audit entries available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(entry.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-sm">{entry.description}</h4>
                      <Badge className={getSeverityColor(entry.severity)}>
                        {entry.severity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {entry.user}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <span className="capitalize">
                        {entry.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>
            Overview of recent platform activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {auditEntries.filter(e => e.type === 'user_registration').length}
              </div>
              <div className="text-sm text-blue-700">User Registrations</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {auditEntries.filter(e => e.type === 'rfq_created').length}
              </div>
              <div className="text-sm text-green-700">RFQs Created</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {auditEntries.filter(e => e.type === 'project_awarded').length}
              </div>
              <div className="text-sm text-purple-700">Projects Awarded</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {auditEntries.length}
              </div>
              <div className="text-sm text-orange-700">Total Events</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

