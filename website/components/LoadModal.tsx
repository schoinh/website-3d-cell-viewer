import { UploadOutlined } from "@ant-design/icons";
import { AutoComplete, Button, Modal } from "antd";
import Fuse from "fuse.js";
import React, { ReactElement, useMemo, useRef, useState } from "react";
import styled from "styled-components";

import { FlexRow } from "./LandingPage/utils";
import { AppDataProps } from "../types";
import { RecentDataUrl, useRecentDataUrls } from "../utils/react_utils";
import TruncatedText from "./TruncatedText";
import { isValidUrl, isValidZarrUrl } from "../utils/url_utils";

const MAX_RECENT_URLS_TO_DISPLAY = 20;

type LoadModalProps = {
  onLoad: (appProps: AppDataProps) => void;
};

const ModalContainer = styled.div`
  // Override styling for the Ant dropdown
  .ant-select-dropdown {
    width: max-content !important;
    max-width: 50vw;

    & .ant-select-item-option-content {
    }
  }
`;

export default function LoadModal(props: LoadModalProps): ReactElement {
  const [showModal, _setShowModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [errorText, setErrorText] = useState<string>("");

  const [recentDataUrls, addRecentDataUrl] = useRecentDataUrls();

  const modalContainerRef = useRef<HTMLDivElement>(null);

  const setShowModal = (show: boolean): void => {
    if (show) {
      setUrlInput("");
      setErrorText("");
    }
    _setShowModal(show);
  };

  const onClickLoad = (): void => {
    // TODO: Handle multiple URLs?
    // TODO: Do any transformation of URLs here? Currently just using the labels directly.
    if (!isValidUrl(urlInput)) {
      setErrorText("Please enter a valid URL.");
      return;
    }
    if (!isValidZarrUrl(urlInput)) {
      setErrorText("Please enter a valid OME-Zarr URL (ending with .zarr).");
      return;
    }

    const appProps: AppDataProps = {
      imageUrl: urlInput,
      imageDownloadHref: urlInput,
      cellId: "1",
      parentImageUrl: "",
      parentImageDownloadHref: "",
    };
    props.onLoad(appProps);
    addRecentDataUrl({ url: urlInput, label: urlInput });
    setShowModal(false);
    // do the fancy thing of only enabling first three channels for JSON?
  };

  // Set up fuse for fuzzy searching
  const fuse = useMemo(() => {
    return new Fuse(recentDataUrls, {
      keys: ["label"],
      isCaseSensitive: false,
      shouldSort: true, // sorts by match score
    });
  }, [recentDataUrls]);

  // This search could be done using a transition if needed, but since there is a max of 100 urls,
  // performance hits should be minimal.
  const autoCompleteOptions: { label: React.ReactNode; value: string }[] = useMemo(() => {
    let filteredItems: RecentDataUrl[] = [];
    if (urlInput === "") {
      // Show first 20 recent data urls
      filteredItems = recentDataUrls.slice(0, MAX_RECENT_URLS_TO_DISPLAY);
    } else {
      // Show first 20 search results
      filteredItems = fuse
        .search(urlInput)
        .slice(0, MAX_RECENT_URLS_TO_DISPLAY)
        .map((option) => option.item);
    }
    return filteredItems.map((item) => {
      return {
        label: <TruncatedText text={item.label} />,
        value: item.url,
      };
    });
  }, [urlInput, fuse]);

  const getAutoCompletePopupContainer = modalContainerRef.current ? () => modalContainerRef.current! : undefined;

  return (
    <ModalContainer ref={modalContainerRef}>
      <Button type="link" onClick={() => setShowModal(!showModal)}>
        <UploadOutlined />
        Load
      </Button>
      <Modal
        open={showModal}
        title={"Load image data"}
        onCancel={() => {
          setShowModal(false);
        }}
        getContainer={modalContainerRef.current || undefined}
        okButtonProps={{}}
        footer={
          <Button type="default" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        }
        destroyOnClose={true}
      >
        <p style={{ fontSize: "16px" }}>Provide the URL to load your OME-Zarr or OME-TIFF* data.</p>
        <p style={{ fontSize: "12px" }}>
          <i>*Note: this tool is intended for OME-Zarr use. Large {"(> 100 MB)"} OME-TIFF files are not supported.</i>
        </p>
        <FlexRow $gap={6}>
          <AutoComplete
            value={urlInput}
            onChange={(value) => setUrlInput(value)}
            onSelect={(value) => {
              console.log(value);
              setUrlInput(value as string);
            }}
            style={{ width: "100%" }}
            allowClear={true}
            options={autoCompleteOptions}
            getPopupContainer={getAutoCompletePopupContainer}
            placeholder="Enter a URL..."
            autoFocus={true}
          ></AutoComplete>
          <Button type="primary" onClick={onClickLoad}>
            Load
          </Button>
        </FlexRow>
        {errorText !== "" && <p style={{ color: "var(--color-text-error)" }}>{errorText}</p>}
      </Modal>
    </ModalContainer>
  );
}
