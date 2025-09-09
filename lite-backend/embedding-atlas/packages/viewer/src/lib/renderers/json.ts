// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

function safeJSONStringify(value: any, space?: number): string {
  try {
    return JSON.stringify(
      value,
      (_, value) => {
        if (value instanceof Object && ArrayBuffer.isView(value)) {
          return Array.from(value as any);
        }
        return value;
      },
      space,
    );
  } catch (e) {
    return "(invalid)";
  }
}

export class JSONRenderer {
  element: HTMLDivElement;

  constructor(element: HTMLDivElement, props: { value: any }) {
    this.element = element;
    this.update(props);
  }

  update(props: { value: any }) {
    let pre = document.createElement("pre");
    pre.innerText = safeJSONStringify(props.value);
    this.element.replaceChildren(pre);
  }
}
