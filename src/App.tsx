import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { LoginForm } from './pages/LoginForm'
import { SignupForm } from './pages/SignupForm'

function App() {
  
  return (
    <>
      <Router >
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
        </Routes>
      </Router>

    </>
  )
}

export default App
