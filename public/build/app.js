// node_modules/cockatiel/dist/esm/backoff/ConstantBackoff.js
class ConstantBackoff {
  constructor(interval) {
    this.interval = interval;
  }
  next() {
    return instance(this.interval);
  }
}
var instance = (interval) => ({
  duration: interval,
  next() {
    return this;
  }
});

// node_modules/cockatiel/dist/esm/backoff/ExponentialBackoffGenerators.js
var pFactor = 4;
var rpScalingFactor = 1 / 1.4;
var decorrelatedJitterGenerator = (state, options) => {
  const [attempt, prev] = state || [0, 0];
  const t = attempt + Math.random();
  const next = Math.pow(options.exponent, t) * Math.tanh(Math.sqrt(pFactor * t));
  const formulaIntrinsicValue = isFinite(next) ? Math.max(0, next - prev) : Infinity;
  return [
    Math.min(formulaIntrinsicValue * rpScalingFactor * options.initialDelay, options.maxDelay),
    [attempt + 1, next]
  ];
};

// node_modules/cockatiel/dist/esm/backoff/ExponentialBackoff.js
var defaultOptions = {
  generator: decorrelatedJitterGenerator,
  maxDelay: 30000,
  exponent: 2,
  initialDelay: 128
};

class ExponentialBackoff {
  constructor(options) {
    this.options = options ? { ...defaultOptions, ...options } : defaultOptions;
  }
  next() {
    return instance2(this.options).next(undefined);
  }
}
var instance2 = (options, state, delay = 0, attempt = -1) => ({
  duration: delay,
  next() {
    const [nextDelay, nextState] = options.generator(state, options);
    return instance2(options, nextState, nextDelay, attempt + 1);
  }
});

// node_modules/cockatiel/dist/esm/errors/TaskCancelledError.js
class TaskCancelledError extends Error {
  constructor(message = "Operation cancelled") {
    super(message);
    this.message = message;
    this.isTaskCancelledError = true;
  }
}

// node_modules/cockatiel/dist/esm/common/Event.js
var noopDisposable = { dispose: () => {
  return;
} };
var Event;
(function(Event2) {
  Event2.once = (event, listener) => {
    let syncDispose = false;
    let disposable;
    disposable = event((value) => {
      listener(value);
      if (disposable) {
        disposable.dispose();
      } else {
        syncDispose = true;
      }
    });
    if (syncDispose) {
      disposable.dispose();
      return noopDisposable;
    }
    return disposable;
  };
  Event2.toPromise = (event, signal) => {
    if (!signal) {
      return new Promise((resolve) => Event2.once(event, resolve));
    }
    if (signal.aborted) {
      return Promise.reject(new TaskCancelledError);
    }
    return new Promise((resolve, reject) => {
      const d1 = onAbort(signal)(() => {
        d2.dispose();
        reject(new TaskCancelledError);
      });
      const d2 = Event2.once(event, (data) => {
        d1.dispose();
        resolve(data);
      });
    });
  };
})(Event || (Event = {}));
var onAbort = (signal) => {
  const evt = new OneShotEvent;
  if (signal.aborted) {
    evt.emit();
    return evt.addListener;
  }
  const l = () => {
    evt.emit();
    signal.removeEventListener("abort", l);
  };
  signal.addEventListener("abort", l);
  return evt.addListener;
};

class EventEmitter {
  constructor() {
    this.addListener = (listener) => this.addListenerInner(listener);
  }
  get size() {
    if (!this.listeners) {
      return 0;
    } else if (typeof this.listeners === "function") {
      return 1;
    } else {
      return this.listeners.length;
    }
  }
  emit(value) {
    if (!this.listeners) {
    } else if (typeof this.listeners === "function") {
      this.listeners(value);
    } else {
      for (const listener of this.listeners) {
        listener(value);
      }
    }
  }
  addListenerInner(listener) {
    if (!this.listeners) {
      this.listeners = listener;
    } else if (typeof this.listeners === "function") {
      this.listeners = [this.listeners, listener];
    } else {
      this.listeners.push(listener);
    }
    return { dispose: () => this.removeListener(listener) };
  }
  removeListener(listener) {
    if (!this.listeners) {
      return;
    }
    if (typeof this.listeners === "function") {
      if (this.listeners === listener) {
        this.listeners = undefined;
      }
      return;
    }
    const index = this.listeners.indexOf(listener);
    if (index === -1) {
      return;
    }
    if (this.listeners.length === 2) {
      this.listeners = index === 0 ? this.listeners[1] : this.listeners[0];
    } else {
      this.listeners = this.listeners.slice(0, index).concat(this.listeners.slice(index + 1));
    }
  }
}
class OneShotEvent extends EventEmitter {
  constructor() {
    super(...arguments);
    this.addListener = (listener) => {
      if (this.lastValue) {
        listener(this.lastValue.value);
        return noopDisposable;
      } else {
        return this.addListenerInner(listener);
      }
    };
  }
  emit(value) {
    this.lastValue = { value };
    super.emit(value);
    this.listeners = undefined;
  }
}

// node_modules/cockatiel/dist/esm/common/abort.js
var neverAbortedSignal = new AbortController().signal;
var cancelledSrc = new AbortController;
cancelledSrc.abort();
var abortedSignal = cancelledSrc.signal;

// node_modules/cockatiel/dist/esm/common/Executor.js
var returnOrThrow = (failure) => {
  if ("error" in failure) {
    throw failure.error;
  }
  if ("success" in failure) {
    return failure.success;
  }
  return failure.value;
};
var makeStopwatch = () => {
  if (typeof performance !== "undefined") {
    const start = performance.now();
    return () => performance.now() - start;
  } else {
    const start = process.hrtime.bigint();
    return () => Number(process.hrtime.bigint() - start) / 1e6;
  }
};

class ExecuteWrapper {
  constructor(errorFilter = () => false, resultFilter = () => false) {
    this.errorFilter = errorFilter;
    this.resultFilter = resultFilter;
    this.successEmitter = new EventEmitter;
    this.failureEmitter = new EventEmitter;
    this.onSuccess = this.successEmitter.addListener;
    this.onFailure = this.failureEmitter.addListener;
  }
  clone() {
    return new ExecuteWrapper(this.errorFilter, this.resultFilter);
  }
  async invoke(fn, ...args) {
    const stopwatch = this.successEmitter.size || this.failureEmitter.size ? makeStopwatch() : null;
    try {
      const value = await fn(...args);
      if (!this.resultFilter(value)) {
        if (stopwatch) {
          this.successEmitter.emit({ duration: stopwatch() });
        }
        return { success: value };
      }
      if (stopwatch) {
        this.failureEmitter.emit({ duration: stopwatch(), handled: true, reason: { value } });
      }
      return { value };
    } catch (rawError) {
      const error = rawError;
      const handled = this.errorFilter(error);
      if (stopwatch) {
        this.failureEmitter.emit({ duration: stopwatch(), handled, reason: { error } });
      }
      if (!handled) {
        throw error;
      }
      return { error };
    }
  }
}

// node_modules/cockatiel/dist/esm/NoopPolicy.js
class NoopPolicy {
  constructor() {
    this.executor = new ExecuteWrapper;
    this.onSuccess = this.executor.onSuccess;
    this.onFailure = this.executor.onFailure;
  }
  async execute(fn, signal = neverAbortedSignal) {
    return returnOrThrow(await this.executor.invoke(fn, { signal }));
  }
}

// node_modules/cockatiel/dist/esm/RetryPolicy.js
var delay = (duration, unref) => new Promise((resolve) => {
  const timer = setTimeout(resolve, duration);
  if (unref) {
    timer.unref();
  }
});

class RetryPolicy {
  constructor(options, executor) {
    this.options = options;
    this.executor = executor;
    this.onGiveUpEmitter = new EventEmitter;
    this.onRetryEmitter = new EventEmitter;
    this.onSuccess = this.executor.onSuccess;
    this.onFailure = this.executor.onFailure;
    this.onRetry = this.onRetryEmitter.addListener;
    this.onGiveUp = this.onGiveUpEmitter.addListener;
  }
  dangerouslyUnref() {
    return new RetryPolicy({ ...this.options, unref: true }, this.executor.clone());
  }
  async execute(fn, signal = neverAbortedSignal) {
    const factory = this.options.backoff || new ConstantBackoff(0);
    let backoff;
    for (let retries = 0;; retries++) {
      const result = await this.executor.invoke(fn, { attempt: retries, signal });
      if ("success" in result) {
        return result.success;
      }
      if (!signal.aborted && retries < this.options.maxAttempts) {
        const context = { attempt: retries + 1, signal, result };
        backoff = backoff ? backoff.next(context) : factory.next(context);
        const delayDuration = backoff.duration;
        const delayPromise = delay(delayDuration, !!this.options.unref);
        this.onRetryEmitter.emit({ ...result, delay: delayDuration });
        await delayPromise;
        continue;
      }
      this.onGiveUpEmitter.emit(result);
      if ("error" in result) {
        throw result.error;
      }
      return result.value;
    }
  }
}

// node_modules/cockatiel/dist/esm/Policy.js
function retry(policy, opts) {
  return new RetryPolicy({ backoff: opts.backoff || new ConstantBackoff(0), maxAttempts: opts.maxAttempts ?? Infinity }, new ExecuteWrapper(policy.options.errorFilter, policy.options.resultFilter));
}
var typeFilter = (cls, predicate) => predicate ? (v) => v instanceof cls && predicate(v) : (v) => v instanceof cls;
var always = () => true;
var never = () => false;

class Policy {
  constructor(options) {
    this.options = options;
  }
  orType(cls, predicate) {
    const filter = typeFilter(cls, predicate);
    return new Policy({
      ...this.options,
      errorFilter: (e) => this.options.errorFilter(e) || filter(e)
    });
  }
  orWhen(predicate) {
    return new Policy({
      ...this.options,
      errorFilter: (e) => this.options.errorFilter(e) || predicate(e)
    });
  }
  orWhenResult(predicate) {
    return new Policy({
      ...this.options,
      resultFilter: (r) => this.options.resultFilter(r) || predicate(r)
    });
  }
  orResultType(cls, predicate) {
    const filter = typeFilter(cls, predicate);
    return new Policy({
      ...this.options,
      resultFilter: (r) => this.options.resultFilter(r) || filter(r)
    });
  }
}
var noop = new NoopPolicy;
var handleAll = new Policy({ errorFilter: always, resultFilter: never });

// src/app.js
var STREAM_URL = "http://10.0.0.67:2022/rtc/v1/whep/?app=live&stream=livestream";
var sdk = null;
var initStream = async () => {
  if (sdk) {
    sdk.close();
  }
  sdk = SrsRtcWhipWhepAsync();
  sdk.pc.addEventListener("iceconnectionstatechange", (e) => {
    if (sdk.pc.iceConnectionState === "failed") {
      setTimeout(async () => {
        await initStream();
      }, 2000);
    }
  });
  document.getElementById("rtc_media_player").srcObject = sdk.stream;
  const session = await sdk.play(STREAM_URL);
  console.log(`SRS session established [${session.sessionid}]`);
};
window.addEventListener("online", async () => {
  console.log("Browser back online");
  const retryPolicy = retry(handleAll, {
    maxAttempts: 20,
    backoff: new ExponentialBackoff({
      initialDelay: 500,
      maxDelay: 120000
    })
  });
  retryPolicy.onRetry((reason) => {
    console.error(reason);
  });
  await retryPolicy.execute(async () => {
    if (!sdk || sdk.pc.iceConnectionState !== "connected") {
      console.log("Reconnecting to stream");
      await initStream();
    }
  });
});
window.addEventListener("load", async () => {
  await initStream();
});
