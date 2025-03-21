import React from "react";
import ShipMap from "./ShipMap";
import { ThemeProvider } from "./ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <ShipMap />
    </ThemeProvider>
  );
}

export default App;
