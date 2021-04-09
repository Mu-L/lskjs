import cookieParser from 'cookie-parser';
import qs from 'querystring';

export default () =>
  function (socket, next) {
    socket.req = socket.request;
    socket.res = {
      getHeader() {
        return null;
      },
      on(event, ...args) {
        if (event === 'close') {
          event = 'disconnect';
        }
        socket.on(event, ...args);
      },
      __noSuchMethod__: () => {
        console.log('__noSuchMethod____noSuchMethod____noSuchMethod____noSuchMethod__');
      },
    };
    const { req, res } = socket;
    req.ws = socket;
    req.header = function (name) {
      return this.headers[name];
    };
    const { query } = socket.handshake;
    req.query = query;
    req.data = req.query; // @TODO: подумать про другие источники данных
    // if (!req.query) req.query = {};
    // socket.data = Object.assign({}, query, req.query);
    return next();
  };
