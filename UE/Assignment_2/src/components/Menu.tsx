import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/menu.scss';

const Menu: React.FC = () => {
    return (
        <div className="menu-container">
            <h1 className="menu-title">IV Assignment 2</h1>
            <div className="menu-buttons">
                <Link to="/geo-1">
                    <button className="menu-button view1">Geographical View 1</button>
                </Link>
                <Link to="/geo-2">
                    <button className="menu-button view2">Geographical View 2</button>
                </Link>
                <Link to="/geo-3">
                    <button className="menu-button view3">Geographical View 3</button>
                </Link>
                <Link to="/graph">
                    <button className="menu-button view4">Graph View</button>
                </Link>
            </div>
        </div>
    );
};

export default Menu;
