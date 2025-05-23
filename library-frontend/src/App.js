import { useState } from 'react'
import { useApolloClient } from '@apollo/client'
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  Link,
} from 'react-router-dom'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Notify from './components/Notify'

const App = () => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)

  const client = useApolloClient()

  const padding = {
    padding: 5,
  }

  const showErrorMessage = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  return (
    <Router>
      <div>
        <Link style={padding} to="/authors">
          authors
        </Link>
        <Link style={padding} to="/books">
          books
        </Link>
        {token === null ? (
          <Link style={padding} to="/login">
            login
          </Link>
        ) : (
          <>
            <Link style={padding} to="/add">
              add book
            </Link>
            <button onClick={logout}>logout</button>
          </>
        )}
      </div>
      <div style={padding}>
        <Notify errorMessage={errorMessage} />
      </div>
      <Routes>
        <Route path="/" element={<h2>Library app</h2>} />
        <Route
          path="/authors"
          element={
            <Authors userToken={token} setErrorMessage={showErrorMessage} />
          }
        />
        <Route path="/books" element={<Books />} />
        <Route
          path="/add"
          element={
            token ? (
              <NewBook setErrorMessage={showErrorMessage} />
            ) : (
              <Navigate replace to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            <LoginForm setToken={setToken} setErrorMessage={showErrorMessage} />
          }
        />
      </Routes>
    </Router>
  )
}

export default App
