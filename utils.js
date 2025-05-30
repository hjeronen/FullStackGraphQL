const { GraphQLError } = require('graphql')

const VALIDATION_ERROR = 'ValidationError'
const AUTHOR_VALIDATION_ERROR = 'Author validation failed'
const BOOK_VALIDATION_ERROR = 'Book validation failed'
const USER_VALIDATION_ERROR = 'User validation failed'
const AUTHENTICATION_ERROR = 'User not authenticated'
const LOGIN_ERROR = 'Wrong username or password'

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

module.exports = {
  handleError,
  authenticateUser,
  LOGIN_ERROR,
}
