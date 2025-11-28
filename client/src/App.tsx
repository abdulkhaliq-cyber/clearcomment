import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Logs from './pages/Logs';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import Connect from './pages/Connect';
import Moderation from './pages/Moderation';
import Rules from './pages/Rules';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/logs"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/moderation"
          element={
            <ProtectedRoute>
              <Moderation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/rules"
          element={
            <ProtectedRoute>
              <Rules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connect"
          element={
            <ProtectedRoute>
              <Connect />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
