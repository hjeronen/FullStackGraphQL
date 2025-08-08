import { useQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'
import BookTable from './BookTable'

const Recommendations = () => {
  const resultUser = useQuery(ME)

  const resultBooks = useQuery(ALL_BOOKS, {
    variables: { genre: resultUser?.data?.me?.favoriteGenre },
    pollInterval: 2000,
  })

  return (
    <div>
      <h2>Recommendations</h2>
      <div>
        books in your favorite genre{' '}
        <strong>{resultUser?.data?.me?.favoriteGenre}</strong>
      </div>
      <BookTable books={resultBooks?.data?.allBooks} />
    </div>
  )
}

export default Recommendations
