import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import './App.css'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import blockchain_loading from '@/assets/blockchain_loading.png'

const API_BASE_URL = 'http://127.0.0.1:5000'  // Backend URL

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/me`, {
      credentials: 'include'
    })
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Not authenticated')
      })
      .then(userData => {
        setUser(userData)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])


  const loading_blockchain_ref = useRef()

  useGSAP(() => {
    gsap.to(loading_blockchain_ref.current, {
      rotation: 360,
      duration: 5,
      repeat: -1,
      ease: 'power1.inOut',
    })
  })


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div ref={loading_blockchain_ref} className='flex justify-center items-center mt-8'>
            <img src={blockchain_loading} width={100} height={100} alt="Blockchain Loading" />
          </div>
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />}
          />
          <Route
            path="/dashboard/*"
            element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" />}
          />
          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App