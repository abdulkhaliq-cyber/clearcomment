import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Logs from './pages/Logs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/logs" element={<Logs />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* We will add other routes here later */}
      </Routes>
    </Router>
  );
}

export default App;
