import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/menu.scss';
// @ts-ignore
import tuwienLogo from "../assets/tuwien_logo.png";

const Menu: React.FC = () => {
    return (
        <div className="menu-container">
            <header className="menu-header">
                <img src={tuwienLogo} alt="TU Wien Logo" className="menu-logo" />
                <h1 className="menu-title">IV Assignment 2</h1>
            </header>
            <div className="menu-buttons">
                <Link to="/geo-1">
                    <button className="menu-button view1">Geographical Heatmap of Exhibitions</button>
                </Link>
                <Link to="/geo-2">
                    <button className="menu-button view2">Geographical View 2</button>
                </Link>
                <Link to="/geo-3">
                    <button className="menu-button view3">Geographical View 3</button>
                </Link>
                <Link to="/graph">
                    <button className="menu-button view4">Artist Collaboration Network</button>
                </Link>
            </div>
        </div>
    );
};

export default Menu;
