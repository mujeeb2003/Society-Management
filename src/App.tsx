import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { LoginForm } from './pages/LoginForm'
import { SignupForm } from './pages/SignupForm'
import { Toaster } from "@/components/ui/toaster"
import {Dashboard} from './pages/Dashboard';
import ProtectedLoginRoute from './utils/ProtectedRoute';
import Navbar from './pages/Navbar';
import Payments from './pages/Payments';
import Villas from './pages/Villas';
import Settings from './pages/Settings';
function App() {
  
  return (
    <>
        <Toaster />
        <Router >
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route element={<ProtectedLoginRoute />}>
              <Route path="/home/*" element={<>
                <Navbar />              
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/villas" element={<Villas />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </>} />
            </Route>
          </Routes>
        </Router>
    </>
  )
}

export default App
