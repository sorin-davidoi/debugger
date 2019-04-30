/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

// import { isDevelopment } from "devtools-environment";

const workerPath = true
  ? "assets/build"
  : "resource://devtools/client/debugger/new/dist";

export type Message = {
  data: {
    id: string,
    method: string,
    args: Array<any>
  }
};

class WorkerDispatcher {
  msgId: number;
  worker: any;

  constructor() {
    this.msgId = 1;
    this.worker = null;
  }

  start(url: string, win: window) {
    this.worker = new (win || window).Worker(url);
    this.worker.onerror = () => {
      console.error(`Error in worker ${url}`);
    };
  }

  stop() {
    if (!this.worker) {
      return;
    }

    this.worker.terminate();
    this.worker = null;
  }

  task(
    method: string,
    { queue = false }: { queue: boolean } = {}
  ): (...args: any[]) => Promise<any> {
    const calls = [];
    const push = (args: Array<any>) => {
      return new Promise((resolve, reject) => {
        if (queue && calls.length === 0) {
          Promise.resolve().then(flush);
        }

        calls.push([args, resolve, reject]);

        if (!queue) {
          flush();
        }
      });
    };

    const flush = () => {
      const items = calls.slice();
      calls.length = 0;

      if (!this.worker) {
        return;
      }

      const id = this.msgId++;
      this.worker.postMessage({
        id,
        method,
        calls: items.map(item => item[0])
      });

      const listener = ({ data: result }) => {
        if (result.id !== id) {
          return;
        }

        if (!this.worker) {
          return;
        }

        this.worker.removeEventListener("message", listener);

        result.results.forEach((resultData, i) => {
          const [, resolve, reject] = items[i];

          if (resultData.error) {
            reject(resultData.error);
          } else {
            resolve(resultData.response);
          }
        });
      };

      this.worker.addEventListener("message", listener);
    };

    return (...args: any) => push(args);
  }

  invoke(method: string, ...args: any[]): Promise<any> {
    return this.task(method)(...args);
  }
}

function workerHandler(publicInterface: Object) {
  return function(msg: Message) {
    const { id, method, calls } = (msg.data: any);

    Promise.all(
      calls.map(args => {
        try {
          const response = publicInterface[method].apply(undefined, args);
          if (response instanceof Promise) {
            return response.then(
              val => ({ response: val }),
              // Error can't be sent via postMessage, so be sure to
              // convert to string.
              err => ({ error: err.toString() })
            );
          }
          return { response };
        } catch (error) {
          // Error can't be sent via postMessage, so be sure to convert to
          // string.
          return { error: error.toString() };
        }
      })
    ).then(results => {
      self.postMessage({ id, results });
    });
  };
}

class LazyWorker {
  _url: string;
  _enforcedUrl: ?string;
  _tasks: Map<string, (...args: any[]) => Promise<any>>;
  _dispatcher: WorkerDispatcher;

  constructor(url: string) {
    this._url = url;
    this._tasks = new Map();
  }

  get dispatcher(): WorkerDispatcher {
    if (!this._dispatcher) {
      this._dispatcher = new WorkerDispatcher();
      this._dispatcher.start(this._enforcedUrl || `${workerPath}/${this._url}`);
    }

    return this._dispatcher;
  }

  async task(
    name: string,
    { queue = false }: { queue: boolean } = {}
  ): Promise<any> {
    if (!this._tasks.has(name)) {
      this._tasks.set(name, this.dispatcher.task(name, { queue }));
    }

    return this._tasks.get(name);
  }

  async destroy() {
    if (this._dispatcher) {
      this._dispatcher.stop();
    }

    this._tasks.clear();
  }

  _enforceUrl(url: string) {
    this._enforcedUrl = url;
  }
}

function streamingWorkerHandler(
  publicInterface: Object,
  { timeout = 100 }: Object = {},
  worker: Object = self
) {
  async function streamingWorker(id, tasks) {
    let isWorking = true;

    const timeoutId = setTimeout(() => {
      isWorking = false;
    }, timeout);

    const results = [];
    while (tasks.length !== 0 && isWorking) {
      const { callback, context, args } = tasks.shift();
      const result = await callback.call(context, args);
      results.push(result);
    }
    worker.postMessage({ id, status: "pending", data: results });
    clearTimeout(timeoutId);

    if (tasks.length !== 0) {
      await streamingWorker(id, tasks);
    }
  }

  return async function(msg: Message) {
    const { id, method, args } = msg.data;
    const workerMethod = publicInterface[method];
    if (!workerMethod) {
      console.error(`Could not find ${method} defined in worker.`);
    }
    worker.postMessage({ id, status: "start" });

    try {
      const tasks = workerMethod(args);
      await streamingWorker(id, tasks);
      worker.postMessage({ id, status: "done" });
    } catch (error) {
      worker.postMessage({ id, status: "error", error });
    }
  };
}

module.exports = {
  WorkerDispatcher,
  workerHandler,
  LazyWorker,
  streamingWorkerHandler
};
