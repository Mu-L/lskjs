import Promise from 'bluebird';

// Retry `func` until it succeeds.
//
// For each attempt, invokes `func` with `options.args` as arguments and
// `options.context` as `this`.
//
// Waits `options.interval` milliseconds (default 1000) between attempts.
//
// Increases wait by a factor of `options.backoff` each interval, up to
// a limit of `options.max_interval`.
//
// Keeps trying until `options.timeout` milliseconds have elapsed,
// or `options.max_tries` have been attempted, whichever comes first.
//
// If neither is specified, then the default is to make 5 attempts.
//

function retry(func, options) {
  options = options || {};

  let interval = typeof options.interval === 'number' ? options.interval : 1000;

  let max_tries;
  let giveup_time;
  if (typeof options.max_tries !== 'undefined') {
    max_tries = options.max_tries;
  }

  if (options.timeout) {
    giveup_time = new Date().getTime() + options.timeout;
  }

  if (!max_tries && !giveup_time) {
    max_tries = 5;
  }

  let tries = 0;
  const start = new Date().getTime();

  // If the user didn't supply a predicate function then add one that
  // always succeeds.
  //
  // This is used in bluebird's filtered catch to flag the error types
  // that should retry.
  const predicate =
    options.predicate ||
    function (err) {
      return true;
    };
  let stopped = false;

  function try_once() {
    const tryStart = new Date().getTime();
    return Promise.attempt(() => func.apply(options.context, options.args))
      .caught(StopError, (err) => {
        stopped = true;
        if (err.err instanceof Error) {
          return Promise.reject(err.err);
        }
        return Promise.reject(err);
      })
      .caught(predicate, (err) => {
        if (stopped) {
          return Promise.reject(err);
        }
        ++tries;
        if (tries > 1) {
          interval = backoff(interval, options);
        }
        const now = new Date().getTime();

        if ((max_tries && tries === max_tries) || (giveup_time && now + interval >= giveup_time)) {
          if (options.throw_original) {
            return Promise.reject(err);
          }
          if (!(err instanceof Error)) {
            let failure = err;

            if (failure) {
              if (typeof failure !== 'string') {
                failure = JSON.stringify(failure);
              }
            }

            err = new Error(`rejected with non-error: ${failure}`);
            err.failure = failure;
          }

          const timeout = new Error(
            `operation timed out after ${now - start} ms, ${tries} tries with error: ${err.message}`,
          );
          timeout.failure = err;
          timeout.code = 'ETIMEDOUT';
          return Promise.reject(timeout);
        }
        const delay = interval - (now - tryStart);
        if (delay <= 0) {
          return try_once();
        }
        return Promise.delay(delay).then(try_once);
      });
  }
  return try_once();
}

// Subclass of Error that can be thrown to indicate that retry should stop.
//
// If called with an instance of Error subclass, then the retry promise will be
// rejected with the given error.
//
// Otherwise the cancel error object itself is propagated to the caller.
//

class StopError extends Error {
  constructor(err) {
    super(err);
    if (err instanceof Error) {
      this.err = err;
    } else {
      this.message = err || 'cancelled';
    }
  }
}

// function StopError(err) {
//   if (err instanceof Error) {
//     this.err = err;
//   } else {
//     this.message = err || 'cancelled';
//   }
// }
// StopError.prototype = Object.create(Error.prototype);
retry.StopError = (...args) => new StopError(...args);

// Return the updated interval after applying the various backoff options
function backoff(interval, options) {
  if (options.backoff) {
    interval *= options.backoff;
  }

  if (options.max_interval) {
    interval = Math.min(interval, options.max_interval);
  }

  return interval;
}

export default retry;
