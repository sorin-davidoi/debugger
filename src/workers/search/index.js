/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { workerUtils } from "devtools-utils";
import type { Source } from "../../types";

const { LazyWorker } = workerUtils;

class SearchWorker extends LazyWorker {
  constructor() {
    super("search-worker.js");
  }

  async getMatches(...args: any[]): Promise<Object[]> {
    return (await this.task("getMatches"))(...args);
  }

  async findSourceMatches(source: Source, queryText: string) {
    return (await this.task("findSourceMatches"))(source, queryText);
  }
}

const searchWorker = new SearchWorker();

export default searchWorker;
