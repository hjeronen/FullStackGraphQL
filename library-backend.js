const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
require('dotenv').config()
const { authors, books } = require('./data')

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

const initializeDatabase = async () => {
  const bookCount = await Book.countDocuments()
  const authorCount = await Author.countDocuments()

  if (bookCount > 0 || authorCount > 0) {
    console.log('Database already contains data, skipping initialization.')
    return
  }

  const authorDocs = await Author.insertMany(authors)

  for (const book of books) {
    const author = authorDocs.find((auth) => auth.name === book.author)
    if (author) {
      const newBook = new Book({
        ...book,
        author: author._id,
      })
      await newBook.save()
    }
  }
}

initializeDatabase().catch((error) => {
  console.error('Error initializing database:', error.message)
})

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

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (_root, args) => {
      const query = {}

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        if (author) {
          query.author = author._id
        } else {
          return []
        }
      }

      if (args.genre) {
        query.genres = args.genre
      }

      return Book.find(query).populate('author').exec()
    },
    allAuthors: () => Author.find({}).populate('bookCount').exec(),
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
    editAuthor: async (_root, args) => {
      const author = await Author.findOne({ name: args.name })
      if (!author) return null

      author.born = args.setBornTo
      await author.save()

      return author
    },
  },
  Author: {
    bookCount: (parent) => parent.bookCount,
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
