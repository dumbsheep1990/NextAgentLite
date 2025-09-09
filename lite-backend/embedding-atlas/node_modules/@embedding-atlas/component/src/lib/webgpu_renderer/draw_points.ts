// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import type { Dataflow, Node } from "../dataflow.js";
import type { BindGroups } from "./bind_groups.js";
import type { AuxiliaryResources, DataBuffers } from "./renderer.js";

export function makeDrawPointsCommand(
  df: Dataflow,
  device: Node<GPUDevice>,
  module: Node<GPUShaderModule>,
  bindGroups: BindGroups,
  dataBuffers: DataBuffers,
  auxiliaryResources: AuxiliaryResources,
): Node<(encoder: GPUCommandEncoder) => void> {
  const pipeline = df.derive([device, module, bindGroups.layouts], (device, module, layouts) =>
    device.createRenderPipeline({
      layout: device.createPipelineLayout({ bindGroupLayouts: [layouts.group0, layouts.group1] }),
      vertex: { entryPoint: "points_vs", module: module },
      fragment: {
        entryPoint: "points_fs",
        module: module,
        targets: [
          {
            format: auxiliaryResources.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } },
          },
          {
            format: auxiliaryResources.alphaTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } },
          },
        ],
      },
      primitive: { topology: "triangle-strip" },
    }),
  );

  return df.derive(
    [
      pipeline,
      bindGroups.group0,
      bindGroups.group1,
      dataBuffers.count,
      auxiliaryResources.colorTexture,
      auxiliaryResources.alphaTexture,
    ],
    (pipeline, group0, group1, count, colorTexture, alphaTexture) => (encoder) => {
      let pass = encoder.beginRenderPass({
        colorAttachments: [
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: colorTexture.createView() },
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: alphaTexture.createView() },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, group0);
      pass.setBindGroup(1, group1);
      if (count > 0) {
        pass.draw(4, count);
      }
      pass.end();
    },
  );
}
