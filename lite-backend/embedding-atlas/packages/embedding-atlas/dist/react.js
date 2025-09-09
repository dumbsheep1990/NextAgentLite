import { useRef as n, useEffect as a, createElement as d } from "react";
import { w as f, y as l } from "./index-B-Ic45aF.js";
import { I as v, S as A, F as N } from "./index-B-Ic45aF.js";
import { Z as u } from "./index-BP6zCNeS.js";
import { K as p } from "./index-8RdhbBWG.js";
import { J as R } from "./index-8RdhbBWG.js";
import { createKNN as Z, createUMAP as j } from "./umap.js";
function e(s, i = "div", c = { display: "flex" }) {
  return (t) => {
    const o = n(null), r = n(null);
    return a(() => {
      let m = new s(o.current, t);
      return r.current = m, () => {
        r.current?.destroy();
      };
    }, []), a(() => {
      r.current?.update(t);
    }, [t]), d(i, { ref: o, style: c });
  };
}
const E = e(p, "div", {
  display: "flex",
  width: "100%",
  height: "100%"
}), b = e(f), C = e(l), h = e(u);
export {
  E as EmbeddingAtlas,
  b as EmbeddingView,
  C as EmbeddingViewMosaic,
  h as Table,
  Z as createKNN,
  j as createUMAP,
  v as defaultCategoryColors,
  R as defaultPlots,
  A as findClusters,
  N as maxDensityModeCategories
};
