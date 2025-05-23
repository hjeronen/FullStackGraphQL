const Notify = ({ errorMessage }) => {
  if (!errorMessage) {
    return <br />
  }
  return <div style={{ color: 'red' }}>{errorMessage}</div>
}

export default Notify
