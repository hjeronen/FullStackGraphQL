import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../queries'
import { ERROR } from './Notify'

const Authors = ({ userToken, showNotification }) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
    onError: (error) => {
      showNotification({ message: error.graphQLErrors[0]?.message, type: ERROR })
    },
    update: (cache, response) => {
      const updatedAuthor = response.data.editAuthor

      cache.updateQuery({ query: ALL_AUTHORS }, (data) => {
        const allAuthors = data?.allAuthors || []
        return {
          allAuthors: allAuthors.map(author => author.name !== updatedAuthor.name ? author : updatedAuthor)
        }
      })
    },
  })

  const result = useQuery(ALL_AUTHORS)

  if (result.loading) {
    return <div>loading...</div>
  }

  const submit = async (event) => {
    event.preventDefault()

    const updated = await updateAuthor({
      variables: { name, setBornTo: parseInt(born) },
    })

    if (updated?.data) {
      setName('')
      setBorn('')
    }
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {result.data.allAuthors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {userToken && (
        <>
          <h3>Set birthyear</h3>
          <form onSubmit={submit}>
            <select
              value={name}
              onChange={({ target }) => setName(target.value)}
            >
              {result.data.allAuthors.map((a, i) => (
                <option key={i} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
            <div>
              born
              <input
                value={born}
                onChange={({ target }) => setBorn(target.value)}
              />
            </div>
            <button type="submit">update author</button>
          </form>
        </>
      )}
    </div>
  )
}

export default Authors
