import { useState } from 'react'
import { useApolloClient, useSubscription } from '@apollo/client'
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  Link,
} from 'react-router-dom'
import { ALL_AUTHORS, ALL_BOOKS, ALL_GENRES, BOOK_ADDED } from './queries'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Notify from './components/Notify'
import Recommendations from './components/Recommendations'

export const updateCache = (cache, query, addedBook, queryName) => {
  cache.updateQuery(query, (data) => {
    if (queryName === 'allBooks' && data?.allBooks) {
      const books = data?.allBooks || []

      if (books?.find((book) => book.title === addedBook.title)) {
        return { allBooks: books }
      }

      return {
        allBooks: books.concat(addedBook),
      }
    } else if (queryName === 'allGenres' && data?.allGenres) {
      const genres = data?.allGenres || []

      return {
        allGenres: genres.concat(
          addedBook.genres.filter((genre) => !genres.includes(genre)),
        ),
      }
    } else if (queryName === 'allAuthors' && data?.allAuthors) {
      const authors = data?.allAuthors || []

      const author = addedBook.author
      const alreadyExists = authors.find((a) => a.name === author.name)
      const allAuthors = alreadyExists
        ? authors.map((a) => (a.name !== author.name ? a : author))
        : authors.concat(author)

      return {
        allAuthors: allAuthors,
      }
    }
  })
}

const App = () => {
  const [notification, setNotification] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('library-user-token'))

  const client = useApolloClient()

  useSubscription(BOOK_ADDED, {
    onData: ({ data, client }) => {
      const bookAdded = data.data.bookAdded
      const genresToUpdate = bookAdded.genres?.concat(null) || [null]

      genresToUpdate.forEach((genre) => {
        updateCache(
          client.cache,
          { query: ALL_BOOKS, variables: { genre } },
          bookAdded,
          'allBooks',
        )
      })
      updateCache(client.cache, { query: ALL_GENRES }, bookAdded, 'allGenres')
      updateCache(client.cache, { query: ALL_AUTHORS }, bookAdded, 'allAuthors')

      showNotification({
        message: `New book added: ${bookAdded.title} by ${bookAdded.author.name}`,
        type: 'success',
      })
    },
  })

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
        <Route path="/books" element={<Books />} />
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
