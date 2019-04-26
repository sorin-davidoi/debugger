/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow
import { workerUtils } from "devtools-utils";
const { WorkerDispatcher } = workerUtils;
import { isDevelopment } from "devtools-environment";

const workerPath = isDevelopment()
  ? "assets/build"
  : "resource://devtools/client/debugger/new/dist";

export class LazyWorker {
  _url: string;
  _enforcedUrl: ?string;
  _tasks: Map<string, Promise<any>>;
  _dispatcher: ?WorkerDispatcher;

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
      this._tasks.set(name, (await this.dispatcher).task(name, { queue }));
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
