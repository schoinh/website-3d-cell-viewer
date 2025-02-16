import { Channel, ControlPoint, Lut, Volume } from "@aics/volume-viewer";
import { findFirstChannelMatch, ViewerChannelSettings } from "./viewerChannelSettings";
import { LUT_MAX_PERCENTILE, LUT_MIN_PERCENTILE } from "../constants";
import { TFEDITOR_DEFAULT_COLOR, TFEDITOR_MAX_BIN } from "../../components/TfEditor";

// @param {Object[]} controlPoints - array of {x:number, opacity:number, color:string}
// @return {Uint8Array} array of length 256*4 representing the rgba values of the gradient
export function controlPointsToLut(controlPoints: ControlPoint[]): Lut {
  const lut = new Lut().createFromControlPoints(controlPoints);
  return lut;
}

export function initializeLut(
  aimg: Volume,
  channelIndex: number,
  channelSettings?: ViewerChannelSettings
): ControlPoint[] {
  const histogram = aimg.getHistogram(channelIndex);

  // find channelIndex among viewerChannelSettings.
  const name = aimg.channelNames[channelIndex];
  // default to percentiles
  const hmin = histogram.findBinOfPercentile(LUT_MIN_PERCENTILE);
  const hmax = histogram.findBinOfPercentile(LUT_MAX_PERCENTILE);
  let lutObject = new Lut().createFromMinMax(hmin, hmax);
  // and if init settings dictate, recompute it:
  if (channelSettings) {
    const initSettings = findFirstChannelMatch(name, channelIndex, channelSettings);
    if (initSettings) {
      if (initSettings.lut !== undefined && initSettings.lut.length === 2) {
        let lutmod = "";
        let lvalue = 0;
        let lutvalues = [0, 0];
        for (let i = 0; i < 2; ++i) {
          const lstr = initSettings.lut[i];
          if (lstr === "autoij") {
            lutvalues = histogram.findAutoIJBins();
            break;
          }

          // look at first char of string.
          let firstchar = lstr.charAt(0);
          if (firstchar === "m" || firstchar === "p") {
            lutmod = firstchar;
            lvalue = parseFloat(lstr.substring(1)) / 100.0;
          } else {
            lutmod = "";
            lvalue = parseFloat(lstr);
          }
          if (lutmod === "m") {
            lutvalues[i] = histogram.maxBin * lvalue;
          } else if (lutmod === "p") {
            lutvalues[i] = histogram.findBinOfPercentile(lvalue);
          } else {
            lutvalues[i] = lvalue;
          }
        } // end for

        lutObject = new Lut().createFromMinMax(
          Math.min(lutvalues[0], lutvalues[1]),
          Math.max(lutvalues[0], lutvalues[1])
        );
      }
    }
  }

  const newControlPoints = lutObject.controlPoints.map((controlPoint) => ({
    ...controlPoint,
    color: TFEDITOR_DEFAULT_COLOR,
  }));
  aimg.setLut(channelIndex, lutObject);
  return newControlPoints;
}

export function controlPointsToRamp(controlPoints: ControlPoint[]): [number, number] {
  if (controlPoints.length === 1 || controlPoints.length === 3) {
    return [0, TFEDITOR_MAX_BIN];
  } else if (controlPoints.length === 2) {
    return [controlPoints[0].x, controlPoints[1].x];
  }
  return [controlPoints[1].x, controlPoints[controlPoints.length - 2].x];
}

export function rampToControlPoints([min, max]: [number, number]): ControlPoint[] {
  return [
    { x: Math.min(min - 1, 0), opacity: 0, color: TFEDITOR_DEFAULT_COLOR },
    { x: min, opacity: 0, color: TFEDITOR_DEFAULT_COLOR },
    { x: max, opacity: 1, color: TFEDITOR_DEFAULT_COLOR },
    { x: Math.max(max + 1, TFEDITOR_MAX_BIN), opacity: 1, color: TFEDITOR_DEFAULT_COLOR },
  ];
}

/** Remaps an array of control points from an old range (as a 2-tuple) to a new one (extracted from a `Channel`) */
export function remapControlPointsForChannel(
  controlPoints: ControlPoint[],
  oldRange: [number, number] | undefined,
  { rawMin, rawMax }: Channel
): ControlPoint[] {
  if (oldRange === undefined) {
    return controlPoints;
  }

  // TODO: this creates a redundant Uint8Array and algorithmically fills it twice. Can we avoid this?
  const remapLut = new Lut().createFromControlPoints(controlPoints);
  remapLut.remapDomains(oldRange[0], oldRange[1], rawMin, rawMax);
  return remapLut.controlPoints;
}
