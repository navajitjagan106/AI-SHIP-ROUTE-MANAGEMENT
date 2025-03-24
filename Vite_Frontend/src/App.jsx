import Home from './assets/Components/Home';
import ShipMap from './assets/Components/ShipMap'
import Routess from './assets/Components/RoutesOptimization';
import {BrowserRouter,Routes,Route} from "react-router-dom";
import Dashboard from './assets/Components/Dashboard';
import Weather from './assets/Components/Weather';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/map' element={<ShipMap />}></Route>
        <Route path='/routes' element={<Routess />}></Route>
        <Route path='/dashboard' element={<Dashboard />}></Route>
        <Route path='/weather' element={<Weather />}></Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
