/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { workerUtils } from "devtools-utils";
import { isJavaScript } from "../../utils/source";
import assert from "../../utils/assert";

import type { Source } from "../../types";

const { LazyWorker } = workerUtils;

type PrettyPrintOpts = {
  source: Source,
  url: string
};

class PrettyPrintWorker extends LazyWorker {
  constructor() {
    super("pretty-print-worker.js");
  }

  async prettyPrint({ source, url }: PrettyPrintOpts) {
    const indent = 2;

    assert(isJavaScript(source), "Can't prettify non-javascript files.");
    return (await this.task("prettyPrint"))({
      url,
      indent,
      sourceText: source.text
    });
  }
}

const prettyPrintWorker = new PrettyPrintWorker();

export default prettyPrintWorker;
