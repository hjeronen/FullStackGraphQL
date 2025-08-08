const batchBookCount = async (keys, models) => {
  const books = await models.Book.find({})
  const booksByAuthor = keys?.map((key) =>
    books.filter((book) => book.author.toString() === key.toString()),
  )

  return booksByAuthor.map((books) => books?.length || 0)
}

module.exports = { batchBookCount }
