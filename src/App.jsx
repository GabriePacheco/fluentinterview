import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PrivateRoute from './components/PrivateRoute'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Profile from './pages/app/Profile'
import Terms from './pages/Terms'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Dash from './pages/app/Dash'
import Register from './pages/app/Register'

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/terms' element={<Terms />} />
        <Route path='/privacy' element={<PrivacyPolicy />} />
        <Route path='/app' element={<PrivateRoute><Dashboard /> </PrivateRoute>} >
          <Route path='profile' element={<Profile />} />
          <Route path='register' element={<Register />} />
          <Route index element={<Dash />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
