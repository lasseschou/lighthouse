/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {makeComputedArtifact} from '../computed-artifact.js';
import {LanternMetric} from './lantern-metric.js';
import {LighthouseError} from '../../lib/lh-error.js';
import {LanternFirstContentfulPaint} from './lantern-first-contentful-paint.js';

/** @typedef {import('../../lib/dependency-graph/base-node.js').Node} Node */

class LanternFirstMeaningfulPaint extends LanternMetric {
  /**
   * @return {LH.Gatherer.Simulation.MetricCoefficients}
   */
  static get COEFFICIENTS() {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5,
    };
  }

  /**
   * @param {Node} dependencyGraph
   * @param {LH.Artifacts.ProcessedNavigation} processedNavigation
   * @return {Node}
   */
  static getOptimisticGraph(dependencyGraph, processedNavigation) {
    const fmp = processedNavigation.timestamps.firstMeaningfulPaint;
    if (!fmp) {
      throw new LighthouseError(LighthouseError.errors.NO_FMP);
    }

    return LanternFirstContentfulPaint.getFirstPaintBasedGraph(
      dependencyGraph,
      fmp,
      // See LanternFirstContentfulPaint's getOptimisticGraph implementation for a longer description
      // of why we exclude script initiated resources here.
      node => node.hasRenderBlockingPriority() && node.initiatorType !== 'script'
    );
  }

  /**
   * @param {Node} dependencyGraph
   * @param {LH.Artifacts.ProcessedNavigation} processedNavigation
   * @return {Node}
   */
  static getPessimisticGraph(dependencyGraph, processedNavigation) {
    const fmp = processedNavigation.timestamps.firstMeaningfulPaint;
    if (!fmp) {
      throw new LighthouseError(LighthouseError.errors.NO_FMP);
    }

    return LanternFirstContentfulPaint.getFirstPaintBasedGraph(
      dependencyGraph,
      fmp,
      node => node.hasRenderBlockingPriority(),
      // For pessimistic FMP we'll include *all* layout nodes
      node => node.didPerformLayout()
    );
  }

  /**
   * @param {LH.Artifacts.MetricComputationDataInput} data
   * @param {LH.Artifacts.ComputedContext} context
   * @return {Promise<LH.Artifacts.LanternMetric>}
   */
  static async compute_(data, context) {
    const fcpResult = await LanternFirstContentfulPaint.request(data, context);
    const metricResult = await this.computeMetricWithGraphs(data, context);
    metricResult.timing = Math.max(metricResult.timing, fcpResult.timing);
    return metricResult;
  }
}

const LanternFirstMeaningfulPaintComputed = makeComputedArtifact(
  LanternFirstMeaningfulPaint,
  ['devtoolsLog', 'gatherContext', 'settings', 'simulator', 'trace', 'URL']
);
export {LanternFirstMeaningfulPaintComputed as LanternFirstMeaningfulPaint};
