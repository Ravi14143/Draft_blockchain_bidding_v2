import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import main_login from '@/assets/main_login.png'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'

const API_BASE_URL = 'http://127.0.0.1:5000'

export default function Login({ setUser }) {
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    role: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginData),
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Login failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!registerData.role) {
      setError('Please select a role')
      setLoading(false)
      return
    }

    // Validation for bidder extra fields
    if (registerData.role === 'bidder') {
      const requiredFields = ['name', 'email', 'phone', 'company', 'address']
      for (let field of requiredFields) {
        if (!registerData[field]) {
          setError(`Please fill in your ${field}`)
          setLoading(false)
          return
        }
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(registerData),
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Registration failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loading_blockchain_ref = useRef()

  useGSAP(() => {
    gsap.to(loading_blockchain_ref.current, {
      y: -30,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-yellow-300">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div ref={loading_blockchain_ref} className="flex justify-center items-center mt-8">
            <img src={main_login} width={200} height={200} alt="Blockchain Loading" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Blockchain Bidding Platform
          </CardTitle>
          <CardDescription>
            Secure, transparent, and AI-powered bidding system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2 my-4">
                  <Label htmlFor="login-username">Username</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 my-4">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2 my-4">
                  <Label htmlFor="register-username">Username</Label>
                  <Input
                    id="register-username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 my-4">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 my-4">
                  <Label htmlFor="register-role">Role</Label>
                  <Select
                    onValueChange={(value) => setRegisterData({ ...registerData, role: value })}
                    value={registerData.role}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Project Owner</SelectItem>
                      <SelectItem value="bidder">Bidder / Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Extra fields for bidder */}
                {registerData.role === 'bidder' && (
                  <>
                    <div className="space-y-2 my-4">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2 my-4">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2 my-4">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2 my-4">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        value={registerData.company}
                        onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2 my-4">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        value={registerData.address}
                        onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button type="submit" className="w-full mt-4" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
