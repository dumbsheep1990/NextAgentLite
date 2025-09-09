// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { imageToDataUrl } from "../image_utils.js";

export class ImageRenderer {
  element: HTMLDivElement;

  constructor(element: HTMLDivElement, props: { value: any }) {
    this.element = element;
    this.update(props);
  }

  update(props: { value: any }) {
    if (props.value == null) {
      this.element.innerText = "(null)";
      return;
    }
    let dataUrl = imageToDataUrl(props.value);
    if (dataUrl != null) {
      let img = document.createElement("img");
      img.src = dataUrl;
      img.style.maxHeight = "100px";
      this.element.replaceChildren(img);
    } else {
      this.element.innerText = `(unknown)`;
    }
  }
}
