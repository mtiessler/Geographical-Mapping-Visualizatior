import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import GeoView1 from './components/GeoView1';
import GeoView2 from './components/GeoView2';
import GeoView3 from './components/GeoView3';
import GraphView from './components/GraphView';
import './styles/app.scss';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Menu />} />
                <Route path="/geo-1" element={<GeoView1 />} />
                <Route path="/geo-2" element={<GeoView2 />} />
                <Route path="/geo-3" element={<GeoView3 />} />
                <Route path="/graph" element={<GraphView />} />
            </Routes>
        </Router>
    );
}

export default App;
