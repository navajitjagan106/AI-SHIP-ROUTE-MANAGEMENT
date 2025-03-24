import React from 'react'
import ShipMap from './ShipMap'
import "../Styles/Home.css"
import Navbar from './Navbar'
const Home = () => {
  return (
    <div>
        <nav>
            <Navbar/>
        </nav>
        {/* <div className='Map-Container'>
            <ShipMap />
        </div>
        <h1>Hello World..!</h1> */}
    </div>
  )
}

export default Home