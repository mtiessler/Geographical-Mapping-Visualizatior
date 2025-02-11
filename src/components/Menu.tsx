import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/menu.scss';
// @ts-ignore
import tuwienLogo from "../assets/tuwien_logo.png";

const Menu: React.FC = () => {
    return (
        <div className="menu-container">
            <header className="menu-header">
                <img src={tuwienLogo} alt="TU Wien Logo" className="menu-logo"/>
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
            <div className="menu-placeholders mt-5">
                <div className="placeholder-row">
                    <p className="name">Irene</p>
                    <p className="surname">Garcia Villoria</p>
                    <p className="matriculation"><strong>Matriculation Number:</strong> 12404282</p>
                </div>
                <div className="placeholder-row">
                    <p className="name">Max</p>
                    <p className="surname">Tiessler</p>
                    <p className="matriculation"><strong>Matriculation Number:</strong> 12234573</p>
                </div>
                <div className="placeholder-row">
                    <p className="name">Dennis</p>
                    <p className="surname">Toma</p>
                    <p className="matriculation"><strong>Matriculation Number:</strong> 12329504</p>
                </div>
            </div>
        </div>
    );
};

export default Menu;
