import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import View1 from './components/View1';
import View2 from './components/View2';
import View3 from './components/View3';
import View4 from './components/View4';
import './App.scss';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Menu />} />
                <Route path="/view-1" element={<View1 />} />
                <Route path="/view-2" element={<View2 />} />
                <Route path="/view-3" element={<View3 />} />
                <Route path="/view-4" element={<View4 />} />
            </Routes>
        </Router>
    );
}

export default App;
