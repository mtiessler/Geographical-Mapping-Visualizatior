import React from 'react';
import { Link } from 'react-router-dom';
import './Menu.scss';

const Menu: React.FC = () => {
    return (
        <div className="menu-container">
            <h1 className="menu-title">Welcome to the App</h1>
            <div className="menu-buttons">
                <Link to="/view1">
                    <button className="menu-button view1">View 1</button>
                </Link>
                <Link to="/view2">
                    <button className="menu-button view2">View 2</button>
                </Link>
                <Link to="/view3">
                    <button className="menu-button view3">View 3</button>
                </Link>
                <Link to="/view4">
                    <button className="menu-button view4">View 4</button>
                </Link>
            </div>
        </div>
    );
};

export default Menu;
