const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
require('dotenv').config()
const { authors, books } = require('./data')
const { GraphQLError } = require('graphql')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

const jwt = require('jsonwebtoken')

const VALIDATION_ERROR = 'ValidationError'
const AUTHOR_VALIDATION_ERROR = 'Author validation failed'
const BOOK_VALIDATION_ERROR = 'Book validation failed'
const USER_VALIDATION_ERROR = 'User validation failed'
const AUTHENTICATION_ERROR = 'User not authenticated'
const LOGIN_ERROR = 'Wrong username or password'

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

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]!
    allGenres: [String!]!
    allAuthors: [Author!]!
    me: User
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
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
    editUser(
      username: String!
      favoriteGenre: String!
    ): User
  }
`

const getErrorCode = (message) => {
  switch (message) {
    case AUTHOR_VALIDATION_ERROR:
      return 'AUTHOR_VALIDATION_FAILED'
    case BOOK_VALIDATION_ERROR:
      return 'BOOK_VALIDATION_FAILED'
    case USER_VALIDATION_ERROR:
    case AUTHENTICATION_ERROR:
    case LOGIN_ERROR:
      return 'BAD_USER_INPUT'
    default:
      return 'UNKNOWN_ERROR'
  }
}

const handleError = (error) => {
  if (error.name === VALIDATION_ERROR) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: getErrorCode(error._message),
        invalidArgs: Object.keys(error.errors),
        error,
      },
    })
  } else if (error.message === LOGIN_ERROR) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: getErrorCode(error.message),
      },
    })
  } else if (error.message === AUTHENTICATION_ERROR) {
    throw new GraphQLError(error.message, {
      extensions: {
        code: getErrorCode(error.message),
      },
    })
  }
  throw new GraphQLError('An unexpected error occurred', {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      error,
    },
  })
}

const authenticateUser = (currentUser) => {
  if (!currentUser) {
    throw new Error(AUTHENTICATION_ERROR)
  }
}

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (_, args) => {
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
    allGenres: async () => Book.distinct('genres'),
    allAuthors: async () => Author.find({}).populate('bookCount').exec(),
    me: (_root, _args, { currentUser }) => {
      return currentUser
    },
  },
  Mutation: {
    addBook: async (_, args, { currentUser }) => {
      try {
        authenticateUser(currentUser)

        const { title, author, published, genres } = args

        let bookAuthor = await Author.findOne({ name: author })
        if (!bookAuthor) {
          bookAuthor = new Author({
            name: author,
          })
          await bookAuthor.save()
        }

        const book = new Book({
          title,
          author: bookAuthor,
          published,
          genres,
        })

        await book.save()
        return book
      } catch (error) {
        handleError(error)
      }
    },
    editAuthor: async (_, args, { currentUser }) => {
      try {
        authenticateUser(currentUser)

        const author = await Author.findOne({ name: args.name })
        if (!author) return null

        author.born = args.setBornTo
        await author.save()

        return author.populate('bookCount')
      } catch (error) {
        handleError(error)
      }
    },
    createUser: async (_, args) => {
      try {
        const user = new User(({ username, favoriteGenre } = args))
        await user.save()
        return user
      } catch (error) {
        handleError(error)
      }
    },
    login: async (_, args) => {
      try {
        const user = await User.findOne({ username: args.username })

        if (!user || args.password !== 'secret') {
          throw new Error(LOGIN_ERROR)
        }

        const userForToken = {
          username: user.username,
          id: user._id,
        }

        return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
      } catch (error) {
        handleError(error)
      }
    },
    editUser: async (_, args, { currentUser }) => {
      try {
        authenticateUser(currentUser)

        const user = await User.findOne({ username: args.username })
        if (!user) return null

        user.favoriteGenre = args.favoriteGenre
        await user.save()

        return user
      } catch (error) {
        handleError(error)
      }
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
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser }
    }
  },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})
