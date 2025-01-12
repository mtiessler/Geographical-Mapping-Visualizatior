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
                <h1 className="menu-title">Assignment 2: Creating Interactive Visualizations</h1>
            </header>
            <div className="menu-buttons">
                <Link to="/geo-1">
                    <button className="menu-button view1">Exhibition Heatmap (1902-1915)</button>
                </Link>
                <Link to="/geo-2">
                    <button className="menu-button view2">Cultural Spread Analysis</button>
                </Link>
                <Link to="/geo-3">
                    <button className="menu-button view3">Artist Movement Timeline</button>
                </Link>
                <Link to="/graph">
                    <button className="menu-button view4">Collaboration Network</button>
                </Link>
            </div>
            <div className="mt-5 menu-placeholders">
                <div className="placeholder-row">
                    <p><strong>Name 1:</strong> Enter Name 1</p>
                    <p><strong>Surname 1:</strong> Enter Surname 1</p>
                    <p><strong>Matriculation 1:</strong> Enter Matriculation 1</p>
                </div>
                <div className="placeholder-row">
                    <p><strong>Name 2:</strong> Enter Name 2</p>
                    <p><strong>Surname 2:</strong> Enter Surname 2</p>
                    <p><strong>Matriculation 2:</strong> Enter Matriculation 2</p>
                </div>
                <div className="placeholder-row">
                    <p><strong>Name 3:</strong> Enter Name 3</p>
                    <p><strong>Surname 3:</strong> Enter Surname 3</p>
                    <p><strong>Matriculation 3:</strong> Enter Matriculation 3</p>
                </div>
            </div>
        </div>
    );
};

export default Menu;
