// MyBids.jsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { AlertTriangle, Eye } from 'lucide-react'

export default function MyBids() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyBids()
  }, [])

  const fetchMyBids = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/my-bids', { credentials: 'include' })
      if (res.ok) {
        setBids(await res.json())
      }
    } catch (err) {
      console.error('Error fetching bids:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your bids...</div>
      </div>
    )
  }

  if (bids.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        You haven’t placed any bids yet.
      </Card>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Bids</h2>

      {bids.map((bid) => (
        <Card key={bid.id} className="mb-4">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{bid.rfq_title || 'Untitled RFQ'}</CardTitle>
              <p className="text-sm text-gray-500">Bid ID: {bid.id}</p>
            </div>
            <Badge
              className={
                bid.status === 'selected'
                  ? 'bg-green-100 text-green-800'
                  : bid.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : bid.status === 'clarification_needed'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-blue-100 text-blue-800'
              }
            >
              {bid.status || 'submitted'}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Price:</strong> ${bid.price?.toLocaleString()}
            </p>
            <p>
              <strong>Timeline:</strong> {bid.timeline || 'N/A'}
            </p>

            {/* Clarification */}
            {bid.status === 'clarification_needed' && (
              <p className="text-yellow-700">
                ⚠️ Awaiting your clarification response.
              </p>
            )}

            {/* Rejected */}
            {bid.status === 'rejected' &&
              (bid.phase1_report?.reason || bid.red_flags?.reason) && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>
                    Reason:{' '}
                    {bid.phase1_report?.reason || bid.red_flags?.reason}
                  </span>
                </div>
              )}

            {/* Selected */}
            {bid.status === 'selected' && (
              <p className="text-green-600 font-medium">
                🎉 Congratulations! You won this project.
              </p>
            )}

            {/* View RFQ Button */}
            <div className="pt-2">
              <Link to={`/dashboard/rfqs/${bid.rfq_id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View RFQ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
