import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MyBid() {
  const [bids, setBids] = useState([])

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
      console.error("Error fetching bids:", err)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Bids</h2>
      {bids.map(bid => (
        <Card key={bid.id} className="mb-2">
          <CardHeader>
            <CardTitle>{bid.rfq_title || "Untitled RFQ"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p><b>Price:</b> {bid.price}</p>
            <p><b>Status:</b> {bid.status}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
