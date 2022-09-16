import React from "react";
import { map, filter, find } from "lodash";

import { Card, Collapse, List } from "antd";

import { getDisplayName } from "../../shared/utils/viewerChannelSettings";
import {
  COLORIZE_ALPHA,
  COLORIZE_ENABLED,
  ISO_SURFACE_ENABLED,
  LUT_CONTROL_POINTS,
  VOLUME_ENABLED,
} from "../../shared/constants";

import colorPalette from "../../shared/colorPalette";
import SharedCheckBox from "../shared/SharedCheckBox";
import ChannelsWidgetRow from "../ChannelsWidgetRow";

import "./styles.css";

const { Panel } = Collapse;

import { ViewerChannelSettings } from "../../shared/utils/viewerChannelSettings";

interface ChannelSettings {
  name: string;
  enabled: boolean;
  volumeEnabled: boolean;
  isosurfaceEnabled: boolean;
  isovalue: number;
  opacity: number;
  color: [number, number, number];
  dataReady: boolean;
  controlPoints: [];
}

type RGBColor = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

export interface ChannelsWidgetProps {
  imageName: string;
  channelSettings: ChannelSettings[];
  channelDataChannels: any[]; // volume-viewer Channel type
  channelGroupedByType: { [key: string]: number[] };
  channelDataReady: { [key: string]: boolean };
  viewerChannelSettings?: ViewerChannelSettings;

  handleChangeToImage: (keyToChange: string, newValue: any, index?: number) => void;
  changeChannelSettings: (indices: number[], keyToChange: string, newValue: any) => void;
  changeOneChannelSetting: (channelName: string, channelIndex: number, keyToChange: string, newValue: any) => void;
  onApplyColorPresets: (presets: [number, number, number, number?][]) => void;
  updateChannelTransferFunction: (index: number, lut: Uint8Array) => void;

  filterFunc?: (key: string) => boolean;
  onColorChangeComplete?: (newRGB: RGBColor, oldRGB: RGBColor, index: number) => void;
}

export default class ChannelsWidget extends React.Component<ChannelsWidgetProps, {}> {
  constructor(props: ChannelsWidgetProps) {
    super(props);
    this.renderVisibilityControls = this.renderVisibilityControls.bind(this);
    this.showVolumes = this.showVolumes.bind(this);
    this.showSurfaces = this.showSurfaces.bind(this);
    this.hideVolumes = this.hideVolumes.bind(this);
    this.hideSurfaces = this.hideSurfaces.bind(this);
  }

  showVolumes(channelArray: number[]) {
    this.props.changeChannelSettings(channelArray, VOLUME_ENABLED, true);
  }

  showSurfaces(channelArray: number[]) {
    this.props.changeChannelSettings(channelArray, ISO_SURFACE_ENABLED, true);
  }

  hideVolumes(channelArray: number[]) {
    this.props.changeChannelSettings(channelArray, VOLUME_ENABLED, false);
  }

  hideSurfaces(channelArray: number[]) {
    this.props.changeChannelSettings(channelArray, ISO_SURFACE_ENABLED, false);
  }

  renderVisibilityControls(channelArray: number[]) {
    const { channelSettings, channelDataChannels } = this.props;

    const arrayOfNames = map(channelArray, (channelIndex: number) => channelDataChannels[channelIndex].name);
    const volChecked = filter(arrayOfNames, (name: string) =>
      find(channelSettings, { name }) ? find(channelSettings, { name })[VOLUME_ENABLED] : false
    );
    const isoChecked = filter(arrayOfNames, (name: string) =>
      find(channelSettings, { name }) ? find(channelSettings, { name })[ISO_SURFACE_ENABLED] : false
    );
    return (
      <div style={STYLES.buttonRow}>
        <SharedCheckBox
          allOptions={channelArray}
          checkedList={volChecked}
          label="All volumes"
          onChecked={this.showVolumes}
          onUnchecekd={this.hideVolumes}
        />
        <SharedCheckBox
          allOptions={channelArray}
          checkedList={isoChecked}
          label="All surfaces"
          onChecked={this.showSurfaces}
          onUnchecekd={this.hideSurfaces}
        />
      </div>
    );
  }

  getRows() {
    const {
      channelGroupedByType,
      channelSettings,
      channelDataReady,
      channelDataChannels,
      filterFunc,
      imageName,
      viewerChannelSettings,
    } = this.props;
    const firstKey = Object.keys(channelGroupedByType)[0];
    return map(channelGroupedByType, (channelArray: number[], key: string) => {
      if (!channelArray.length || (filterFunc && !filterFunc(key))) {
        return null;
      }
      return (
        <Card bordered={false} title={key} extra={this.renderVisibilityControls(channelArray)} type="inner" key={key}>
          <Collapse bordered={false} defaultActiveKey={key === firstKey ? key : ""}>
            <Panel key={key} header={null}>
              <List
                itemLayout="horizontal"
                dataSource={channelArray}
                renderItem={(actualIndex: number) => {
                  const thisChannelSettings = find(
                    channelSettings,
                    (channel: ChannelSettings) => channel.name === channelDataChannels[actualIndex].name
                  );

                  return thisChannelSettings ? (
                    <ChannelsWidgetRow
                      key={`${actualIndex}_${thisChannelSettings.name}_${actualIndex}`}
                      index={actualIndex}
                      imageName={imageName}
                      channelName={thisChannelSettings.name}
                      channelDataForChannel={channelDataChannels[actualIndex]}
                      name={getDisplayName(thisChannelSettings.name, actualIndex, viewerChannelSettings)}
                      volumeChecked={thisChannelSettings[VOLUME_ENABLED]}
                      isosurfaceChecked={thisChannelSettings[ISO_SURFACE_ENABLED]}
                      channelControlPoints={thisChannelSettings[LUT_CONTROL_POINTS]}
                      colorizeEnabled={thisChannelSettings[COLORIZE_ENABLED]}
                      colorizeAlpha={thisChannelSettings[COLORIZE_ALPHA]}
                      isovalue={thisChannelSettings.isovalue}
                      opacity={thisChannelSettings.opacity}
                      color={thisChannelSettings.color}
                      channelDataReady={channelDataReady[actualIndex]}
                      updateChannelTransferFunction={this.props.updateChannelTransferFunction}
                      changeOneChannelSetting={this.props.changeOneChannelSetting}
                      onColorChangeComplete={this.props.onColorChangeComplete}
                      handleChangeToImage={this.props.handleChangeToImage}
                    />
                  ) : (
                    <div></div>
                  );
                }}
              />
            </Panel>
          </Collapse>
        </Card>
      );
    });
  }

  render() {
    return <div>{this.getRows()}</div>;
  }
}

const STYLES = {
  header: {
    textAlign: "left",
    fontWeight: 900,
  },
  buttonRow: {
    display: "flex",
    flexFlow: "row wrap",
    justifyContent: "flex-end",
  },
  button: {
    display: "inline-block",
    minWidth: "initial",
    height: "initial",
    color: colorPalette.primary1Color,
    padding: 0,
    width: 24,
  },
  presetRow: {
    width: "100%",
  },
};
