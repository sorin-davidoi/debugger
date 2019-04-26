/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { LazyWorker } from "../../../src/workers/utils";

import type {
  OriginalFrame,
  Range,
  SourceLocation,
  Source,
  SourceId
} from "../../../src/types";
import type { SourceMapConsumer } from "source-map";
import type { locationOptions } from "./source-map";

class SourceMapWorker extends LazyWorker {
  constructor() {
    super("source-map-worker.js");
  }

  async setAssetRootURL(assetRoot: string): Promise<void> {
    return (await this.task("setAssetRootURL"))(assetRoot);
  }

  async getOriginalURLs(generatedSource: Source): Promise<SourceMapConsumer> {
    return (await this.task("getOriginalURLs"))(generatedSource);
  }

  async hasOriginalURL(url: string): Promise<boolean> {
    return (await this.task("hasOriginalURL"))(url);
  }

  async getOriginalRanges(
    sourceId: SourceId,
    url: string
  ): Promise<
    Array<{
      line: number,
      columnStart: number,
      columnEnd: number
    }>
  > {
    return (await this.task("getOriginalRanges"))(sourceId, url);
  }
  async getGeneratedRanges(
    location: SourceLocation,
    originalSource: Source
  ): Promise<
    Array<{
      line: number,
      columnStart: number,
      columnEnd: number
    }>
  > {
    return (await this.task("getGeneratedRanges", { queue: true }))(
      location,
      originalSource
    );
  }

  async getGeneratedLocation(
    location: SourceLocation,
    originalSource: Source
  ): Promise<SourceLocation> {
    return (await this.task("getGeneratedLocation", { queue: true }))(
      location,
      originalSource
    );
  }

  async getAllGeneratedLocations(
    location: SourceLocation,
    originalSource: Source
  ): Promise<Array<SourceLocation>> {
    return (await this.task("getAllGeneratedLocations", { queue: true }))(
      location,
      originalSource
    );
  }

  async getOriginalLocation(
    location: SourceLocation,
    options: locationOptions = {}
  ): Promise<SourceLocation> {
    return (await this.task("getOriginalLocation", { queue: true }))(
      location,
      options
    );
  }

  async getOriginalLocations(
    locations: SourceLocation[],
    options: locationOptions = {}
  ): Promise<SourceLocation[]> {
    return (await this.task("getOriginalLocations"))(locations, options);
  }

  async getGeneratedRangesForOriginal(
    sourceId: SourceId,
    url: string,
    mergeUnmappedRegions?: boolean
  ): Promise<Range[]> {
    return (await this.task("getGeneratedRangesForOriginal"))(
      sourceId,
      url,
      mergeUnmappedRegions
    );
  }

  async getFileGeneratedRange(originalSource: Source): Promise<Range> {
    return (await this.task("getFileGeneratedRange"))(originalSource);
  }

  async getLocationScopes() {
    return (await this.task("getLocationScoped"))();
  }

  async getOriginalSourceText(
    originalSource: Source
  ): Promise<?{
    text: string,
    contentType: string
  }> {
    return (await this.task("getOriginalSourceText"))(originalSource);
  }

  async applySourceMap(
    generatedId: string,
    url: string,
    code: string,
    mappings: Object
  ): Promise<void> {
    return (await this.task("applySourceMap"))(
      generatedId,
      url,
      code,
      mappings
    );
  }

  async clearSourceMaps(): Promise<void> {
    return (await this.task("clearSourceMaps"))();
  }

  async hasMappedSource(location: SourceLocation): Promise<boolean> {
    return (await this.task("hasMappedSource"))(location);
  }

  async getOriginalStackFrames(
    generatedLocation: SourceLocation
  ): Promise<?Array<OriginalFrame>> {
    return (await this.task("getOriginalStackFrames"))(generatedLocation);
  }
}

export const worker = new SourceMapWorker();

export {
  originalToGeneratedId,
  generatedToOriginalId,
  isGeneratedId,
  isOriginalId
} from "./utils";

import * as self from "devtools-source-map";
export default self;
