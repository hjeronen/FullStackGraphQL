const jwt = require('jsonwebtoken')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')
const { handleError, authenticateUser, LOGIN_ERROR } = require('./utils')

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

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

        pubsub.publish('BOOK_ADDED', { bookAdded: book })

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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
  Author: {
    bookCount: ({ _id }, _params, context) =>
      context.loaders.bookCount.load(_id),
  },
}

module.exports = resolvers
