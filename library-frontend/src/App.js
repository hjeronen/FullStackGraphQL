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
import Recommendations from './components/Recommendations'

export const updateCache = (cache, query, addedBook) => {
  cache.updateQuery(query, (data) => {
    const books = data?.allBooks || []

    if (books?.find( book => book.title === addedBook.title)) {
      return { allBooks: books }
    }

    return {
      allBooks: books.concat(addedBook),
    }
  })
}

const App = () => {
  const [notification, setNotification] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('library-user-token'))

  const client = useApolloClient()

  const padding = {
    padding: 5,
  }

  const showNotification = (notification) => {
    setNotification(notification)
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  };

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
            <Link style={padding} to="/recommendations">
              recommend
            </Link>
            <button onClick={logout}>logout</button>
          </>
        )}
      </div>
      <div style={padding}>
        <Notify {...notification} />
      </div>
      <Routes>
        <Route path="/" element={<h2>Library app</h2>} />
        <Route
          path="/authors"
          element={
            <Authors userToken={token} showNotification={showNotification} />
          }
        />
        <Route path="/books" element={<Books showNotification={showNotification} />} />
        <Route
          path="/add"
          element={
            token ? (
              <NewBook showNotification={showNotification} />
            ) : (
              <Navigate replace to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            <LoginForm
              setToken={setToken}
              showNotification={showNotification}
            />
          }
        />
        <Route
          path="/recommendations"
          element={
            token ? <Recommendations /> : <Navigate replace to="/login" />
          }
        />
      </Routes>
    </Router>
  )
}

export default App
