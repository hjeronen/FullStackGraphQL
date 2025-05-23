import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'
import GenreButtons from './GenreButtons'
import BookTable from './BookTable'

const Books = () => {
  const [genre, setGenre] = useState(null)

  const result = useQuery(ALL_BOOKS, {
    variables: { genre },
    pollInterval: 2000,
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
