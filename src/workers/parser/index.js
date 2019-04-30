/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { workerUtils } from "devtools-utils";

import type { AstLocation, AstPosition } from "./types";
import type { SourceLocation, Source, SourceId } from "../../types";
import type { SourceScope } from "./getScopes/visitor";
import type { SymbolDeclarations } from "./getSymbols";

const { LazyWorker } = workerUtils;

class ParserWorker extends LazyWorker {
  constructor() {
    super("parser-worker.js");
  }

  async findOutOfScopeLocations(
    sourceId: string,
    position: AstPosition
  ): Promise<AstLocation[]> {
    return (await this.task("findOutOfScopeLocations"))(sourceId, position);
  }

  async getNextStep(
    sourceId: string,
    pausedPosition: AstPosition
  ): Promise<?SourceLocation> {
    return (await this.task("getNextStep"))(sourceId, pausedPosition);
  }

  async clearASTs(): Promise<void> {
    return (await this.task("clearASTs"))();
  }

  async getScopes(location: SourceLocation): Promise<SourceScope[]> {
    return (await this.task("getScopes"))(location);
  }

  async clearScopes(): Promise<void> {
    return (await this.task("clearScopes"))();
  }

  async clearSymbols(): Promise<void> {
    return (await this.task("clearSymbols"))();
  }

  async getSymbols(sourceId: string): Promise<SymbolDeclarations> {
    return (await this.task("getSymbols"))(sourceId);
  }

  async hasSource(sourceId: SourceId): Promise<Source> {
    return (await this.task("hasSource"))(sourceId);
  }

  async setSource(source: Source): Promise<void> {
    return (await this.task("setSource"))(source);
  }

  async clearSources(): Promise<void> {
    return (await this.task("clearSources"))();
  }

  async hasSyntaxError(input: string): Promise<string | false> {
    return (await this.task("hasSyntaxError"))(input);
  }

  async mapExpression(
    expression: string,
    mappings: {
      [string]: string | null
    } | null,
    bindings: string[],
    shouldMapBindings?: boolean,
    shouldMapAwait?: boolean
  ): Promise<{ expression: string }> {
    return (await this.task("mapExpression"))(
      expression,
      mappings,
      bindings,
      shouldMapBindings,
      shouldMapAwait
    );
  }

  async getFramework(sourceId: SourceId): Promise<?string> {
    return (await this.task("getFramework"))(sourceId);
  }
}

const parserWorker = new ParserWorker();

export default parserWorker;

export type {
  SourceScope,
  BindingData,
  BindingLocation,
  BindingLocationType,
  BindingDeclarationLocation,
  BindingMetaValue,
  BindingType
} from "./getScopes";

export type { AstLocation, AstPosition } from "./types";

export type {
  ClassDeclaration,
  SymbolDeclaration,
  SymbolDeclarations,
  IdentifierDeclaration,
  FunctionDeclaration
} from "./getSymbols";
