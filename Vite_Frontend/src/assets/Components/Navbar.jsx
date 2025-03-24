import React, { useState } from "react";
import "../Styles/Navbar.css";
import { Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import ThunderstormIcon from "@mui/icons-material/Thunderstorm";
import HomeIcon from "@mui/icons-material/Home";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const handleShowProfile = () => {
    setShowProfile(!showProfile);
  };

  return (
    <div>
      <header className="navbar-header">
        <div className="menu-toggle" onClick={toggleNavbar}>
          {isOpen ? <CloseIcon style={{ fontSize: "30px" }} /> : <MenuIcon style={{ fontSize: "30px" }} />}
        </div>
        <div className="navbar-title">
          <h1 style={{ color: "white" }}>Shippy</h1>
        </div>
        <div className="navbar-profile" onClick={handleShowProfile}>
          <PersonIcon style={{ fontSize: "30px" }} />
        </div>
      </header>

      <main className={`navbar-main ${isOpen ? "open" : ""}`}>
        <nav>
          <ul>
            <Link to="/dashboard">
              <li>
                <DashboardIcon />
                <span>Captain’s Dashboard</span>
              </li>
            </Link>
            <Link to="/map">
              <li>
                <MapIcon />
                <span>Smart Navigator</span>
              </li>
            </Link>
            <Link to="/routes">
              <li>
                <AltRouteIcon />
                <span>Routes</span>
              </li>
            </Link>
            <Link to="/weather">
              <li>
                <ThunderstormIcon />
                <span>Sea Conditions</span>
              </li>
            </Link>
          </ul>
        </nav>
      </main>

      <div className="profile-container">
        {showProfile && <Profile onClose={() => setShowProfile(false)} />}
      </div>
    </div>
  );
};

export default Navbar;
