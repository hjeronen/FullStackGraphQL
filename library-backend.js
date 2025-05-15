const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
require('dotenv').config()

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

const Book = require('./models/book')
const Author = require('./models/author')

const MONGODB_URL = process.env.MONGODB_URL

console.log('connecting to', MONGODB_URL)

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
 *
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conexión con el libro
 */

const typeDefs = `
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]
    ): Book!
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
  }
`

let authors = []
let books = []

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (_root, args) => {
      const allBooks = args.author
        ? books.filter((book) => book.author === args.author)
        : books
      return args.genre
        ? allBooks.filter((book) => book.genres.includes(args.genre))
        : allBooks
    },
    allAuthors: () => authors,
  },
  Mutation: {
    addBook: async (_, { title, author, published, genres }) => {
      let bookAuthor = await Author.find({ name: author })[0]
      if (!bookAuthor) {
        bookAuthor = new Author({
          name: author,
        })
        await bookAuthor.save()
      }
      const book = new Book({
        id: uuid(),
        title,
        author: bookAuthor,
        published,
        genres,
      })
      await book.save()
      return book
    },
    editAuthor: (_root, args) => {
      const author = authors.find((a) => a.name === args.name)
      if (!author) return null

      author.born = args.setBornTo
      authors = authors.map((a) => (a.id === author.id ? author : a))

      return author
    },
  },
  Author: {
    bookCount: ({ name }) => {
      return books.filter((book) => book.author === name).length
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: process.env.PORT },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
