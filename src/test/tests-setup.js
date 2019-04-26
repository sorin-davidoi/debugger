/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

// $FlowIgnore
global.Worker = require("workerjs");

import path from "path";
// import getConfig from "../../bin/getConfig";
import { readFileSync } from "fs";
import Enzyme from "enzyme";
// $FlowIgnore
import Adapter from "enzyme-adapter-react-16";
import { setupHelper } from "../utils/dbg";
import { prefs } from "../utils/prefs";

import parser from "../workers/parser";
import search from "../workers/search";
import prettyPrint from "../workers/pretty-print";
import { worker as sourceMapWorker } from "devtools-source-map";
// start as startParserWorker,
// stop as stopParserWorker,
// clearSymbols,
// clearASTs
import { clearDocuments } from "../utils/editor";
import { clearHistory } from "./utils/history";

import env from "devtools-environment/test-flag";
env.testing = true;

const rootPath = path.join(__dirname, "../../");

function getL10nBundle() {
  const read = file => readFileSync(path.join(rootPath, file));

  try {
    return read("./assets/panel/debugger.properties");
  } catch (e) {
    return read("../../locales/en-US/debugger.properties");
  }
}

global.DebuggerConfig = {};
global.L10N = require("devtools-launchpad").L10N;
global.L10N.setBundle(getL10nBundle());
global.jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
global.performance = { now: () => 0 };

const { URL } = require("url");
global.URL = URL;

global.indexedDB = mockIndexeddDB();

Enzyme.configure({ adapter: new Adapter() });

function formatException(reason, p) {
  console && console.log("Unhandled Rejection at:", p, "reason:", reason);
}

beforeAll(() => {
  sourceMapWorker._enforceUrl(
    path.join(rootPath, "node_modules/devtools-source-map/src/worker.js")
    // ""
  );
  prettyPrint._enforceUrl(
    path.join(rootPath, "src/workers/pretty-print/worker.js")
  );
  parser._enforceUrl(path.join(rootPath, "src/workers/parser/worker.js"));
  search._enforceUrl(path.join(rootPath, "src/workers/search/worker.js"));
  process.on("unhandledRejection", formatException);
});

afterAll(() => {
  sourceMapWorker.destroy();
  prettyPrint.destroy();
  parser.destroy();
  search.destroy();
  process.removeListener("unhandledRejection", formatException);
});

afterEach(() => {});

beforeEach(async () => {
  await parser.clearASTs();
  await parser.clearSymbols();
  clearHistory();
  clearDocuments();
  prefs.projectDirectoryRoot = "";

  // Ensures window.dbg is there to track telemetry
  setupHelper({ selectors: {} });
});

function mockIndexeddDB() {
  const store = {};
  return {
    open: () => ({}),
    getItem: async key => store[key],
    setItem: async (key, value) => {
      store[key] = value;
    }
  };
}

// NOTE: We polyfill finally because TRY uses node 8
if (!global.Promise.prototype.finally) {
  global.Promise.prototype.finally = function finallyPolyfill(callback) {
    var constructor = this.constructor;

    return this.then(
      function(value) {
        return constructor.resolve(callback()).then(function() {
          return value;
        });
      },
      function(reason) {
        return constructor.resolve(callback()).then(function() {
          throw reason;
        });
      }
    );
  };
}
