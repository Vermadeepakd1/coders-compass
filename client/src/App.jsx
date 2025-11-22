import { useState, useEffect } from 'react'
import './App.css'

function App() {

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/test")
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.log("Failed to Fetch: ", err));
  }, [])
  return (
    <div className="App">
      <h1>Coder's Compass</h1>
      <p>Message from server : <strong>{message || "Loading..."}</strong></p>

    </div>
  )
}

export default App
