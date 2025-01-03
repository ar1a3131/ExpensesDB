//import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import MyButton from './components/MyButton';
import PatronRequest from './pages/PatronRequest';
import AdminLogin from './pages/AdminLogin';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Login Options:</h1>
          <Link to="/patron">
            <MyButton label='Submit Request - Patrons' />
          </Link>
          <Link to="/admin">
            <MyButton label='Admin Login' />
          </Link>
        </header>

        <Routes>
          <Route path="/patron" element={<PatronRequest />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/" element={<Navigate to="/patron" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
