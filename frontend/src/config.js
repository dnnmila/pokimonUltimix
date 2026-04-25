const SERVER_IP = process.env.NODE_ENV === 'production'
  ? ''
  : (process.env.REACT_APP_SERVER_URL || `http://${process.env.REACT_APP_SERVER_IP}:3001`);




export default SERVER_IP;