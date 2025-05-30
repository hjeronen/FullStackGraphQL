export const ERROR = 'error'
export const SUCCESS = 'success'

const Notify = ({ message, type }) => {
  const style = {
    [ERROR]: { color: 'red' },
    [SUCCESS]: { color: 'green' },
  }

  if (!message) {
    return <br />
  }

  return <div style={style[type]}>{message}</div>
}

export default Notify
