// BidderProfile.jsx
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User } from "lucide-react"

export default function BidderProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/bidder/profile", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      } else {
        setError("Failed to fetch profile.")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("http://127.0.0.1:5000/api/bidder/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setSuccess("Profile updated successfully!")
      } else {
        const errData = await res.json()
        setError(errData.error || "Failed to update profile.")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        <Loader2 className="animate-spin h-6 w-6 mr-2" />
        Loading profile...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || "Profile not found."}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={profile.avatar_url} alt={profile.name} />
              <AvatarFallback>
                <User className="w-6 h-6 text-gray-500" />
              </AvatarFallback>
            </Avatar>
            <span>{profile.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={profile.email || ""}
              onChange={handleChange}
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone || ""}
              onChange={handleChange}
            />
          </div>

          {/* Company */}
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              value={profile.company || ""}
              onChange={handleChange}
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={profile.address || ""}
              onChange={handleChange}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Messages */}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
