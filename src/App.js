import logo from './logo.png';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Request from './pages/Request';
import Database from './pages/Database';
import Inventory from './pages/Inventory';


function App() {
  return (
    <Router>
      <div className="App">
        {/* Header with Logo and Title */}
        <header className="App-header">
          <img src={logo} alt="Logo" className="App-logo" />
          <h1>Expenses Database</h1>
        </header>

        {/* Navigation Links */}
        <nav className="App-links">
          <Link to="/">
            <button>Home</button>
          </Link>
          <Link to="/submit-request">
            <button>Submit Request</button>
          </Link>
          <Link to="/database">
            <button>Database</button>
          </Link>
          <Link to="/inventory">
            <button>Inventory</button>
          </Link>
        </nav>

        {/* Space between navigation and content */}
        <br />
        <br />

        {/* Routes to render different pages */}
        <Routes>
          <Route path="/" element={<div><br />Use this to submit purchase requests and to search through the database.
          The database should appear empty after the start of the new fiscal year. But all data is saved, in the backend for now.</div>} />
          <Route path="/submit-request" element={<Request />} />
          <Route path="/database" element={<Database />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

