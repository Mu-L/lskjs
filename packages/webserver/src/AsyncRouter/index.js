import { AsyncRouter } from './express-async-router';

export default (params) => {
  const paramsWithDefaultSender = { sender: (req, res, val) => res.ok(val), ...params };

  return AsyncRouter(paramsWithDefaultSender);
};
