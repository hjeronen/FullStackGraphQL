import { useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client'
import { ALL_BOOKS, BOOK_ADDED } from '../queries'
import { updateCache } from '../App'
import GenreButtons from './GenreButtons'
import BookTable from './BookTable'

const Books = ({ showNotification }) => {
  const [genre, setGenre] = useState(null)

  useSubscription(BOOK_ADDED, {
    onData: ({ data, client }) => {
      const bookAdded = data.data.bookAdded

      updateCache(client.cache, { query: ALL_BOOKS, variables: { genre: null } }, bookAdded)

      showNotification({
        message: `New book added: ${bookAdded.title} by ${bookAdded.author.name}`,
        type: 'success',
      })
    },
  })

  const result = useQuery(ALL_BOOKS, {
    variables: { genre },
  })

  if (result.loading) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>books</h2>
      <div>
        in genre <strong>{genre || 'all'}</strong>
      </div>
      <BookTable books={result?.data?.allBooks} />
      <GenreButtons setGenre={setGenre} />
    </div>
  )
}

export default Books
