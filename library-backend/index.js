const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const express = require('express')
const cors = require('cors')
const http = require('http')

const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')

const DataLoader = require('dataloader')
const { authorLoader } = require('./loaders')

require('dotenv').config()
const { authors, books } = require('./data')
const typeDefs = require('./schema')
const resolvers = require('./resolvers')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)

const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

const jwt = require('jsonwebtoken')

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

const start = async () => {
  const app = express()
  const httpServer = http.createServer(app)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  })

  const loaders = {
    bookCount: new DataLoader((keys) =>
      authorLoader.batchBookCount(keys, { Book }),
    ),
  }

  const context = async () => {
    return {
      loaders,
    }
  }

  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const serverCleanup = useServer({ schema, context }, wsServer)

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
    context,
  })

  await server.start()

  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.startsWith('Bearer ')) {
          const decodedToken = jwt.verify(
            auth.substring(7),
            process.env.JWT_SECRET,
          )
          const currentUser = await User.findById(decodedToken.id)
          return { currentUser, loaders }
        }
        return { loaders }
      },
    }),
  )

  const PORT = process.env.PORT || 4000
  httpServer.listen(PORT, () =>
    console.log(`Server is now running on http://localhost:${PORT}`),
  )
}
start()
