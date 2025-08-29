import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut, FileText, Users, Settings, Briefcase, Award, BarChart3 } from 'lucide-react'
import main_login from '@/assets/main_login.png'

// Import role-specific components
import OwnerDashboard from './owner/OwnerDashboard'
import BidderDashboard from './bidder/BidderDashboard'
import AdminDashboard from './admin/AdminDashboard'
import RFQList from './owner/RFQList'
import CreateRFQ from './owner/CreateRFQ'
import RFQDetail from './owner/RFQDetail'
import ProjectList from './owner/ProjectList'
import ProjectDetail from './owner/ProjectDetail'
import BidderRFQList from './bidder/BidderRFQList'
import BidderRFQDetail from './bidder/BidderRFQDetail'
import MyBids from './bidder/MyBids'
import MyProjects from './bidder/MyProjects'
import BidderProjectDetail from './bidder/BidderProjectDetail'
import UserManagement from './admin/UserManagement'
import AuditLog from './admin/AuditLog'

export default function Dashboard({ user, setUser }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await fetch('http://127.0.0.1:5000/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const getNavItems = () => {
    switch (user.role) {
      case 'owner':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { path: '/dashboard/rfqs', label: 'RFQs', icon: FileText },
          { path: '/dashboard/projects', label: 'Projects', icon: Briefcase },
        ]
      case 'bidder':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { path: '/dashboard/rfqs', label: 'Available RFQs', icon: FileText },
          { path: '/dashboard/my-bids', label: 'My Bids', icon: Award },
          { path: '/dashboard/my-projects', label: 'My Projects', icon: Briefcase },
        ]
      case 'admin':
        return [
          { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
          { path: '/dashboard/users', label: 'User Management', icon: Users },
          { path: '/dashboard/audit', label: 'Audit Log', icon: Settings },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br from-blue-400 to-yellow-300">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          
            <div className="flex items-center">
              <img src={main_login} width={50} height={50} alt="Blockchain Loading" />
              <h1 className="text-xl font-semibold text-gray-900 ml-2">
                Blockchain Bidding Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.username} ({user.role})
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.path
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 px-3 py-3 '
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-3 py-3'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Routes>
              {/* Owner Routes */}
              {user.role === 'owner' && (
                <>
                  <Route path="/" element={<OwnerDashboard />} />
                  <Route path="/rfqs" element={<RFQList />} />
                  <Route path="/rfqs/new" element={<CreateRFQ />} />
                  <Route path="/rfqs/:id" element={<RFQDetail />} />
                  <Route path="/projects" element={<ProjectList />} />
                  <Route path="/projects/:id" element={<ProjectDetail />} />
                </>
              )}

              {/* Bidder Routes */}
              {user.role === 'bidder' && (
                <>
                  <Route path="/" element={<BidderDashboard />} />
                  <Route path="/rfqs" element={<BidderRFQList />} />
                  <Route path="/rfqs/:id" element={<BidderRFQDetail />} />
                  <Route path="/my-bids" element={<MyBids />} />
                  <Route path="/my-projects" element={<MyProjects />} />
                  <Route path="/my-projects/:id" element={<BidderProjectDetail />} />
                </>
              )}

              {/* Admin Routes */}
              {user.role === 'admin' && (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/audit" element={<AuditLog />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}