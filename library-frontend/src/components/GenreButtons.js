import { useQuery } from '@apollo/client'
import { ALL_GENRES } from '../queries'

const GenreButtons = ({ setGenre }) => {
  const result = useQuery(ALL_GENRES, {
    pollInterval: 2000,
  })

  return (
    <div>
      {result?.data?.allGenres
        ?.filter((genre) => genre !== '')
        .map((genre) => (
          <button key={genre} onClick={() => setGenre(genre)}>
            {genre}
          </button>
        ))}
      <button onClick={() => setGenre(null)}>all</button>
    </div>
  )
}

export default GenreButtons
