import { coordinator as PC, MosaicClient as Ji, isSelection as aC } from "@uwdata/mosaic-core";
import * as u from "@uwdata/mosaic-sql";
import { column as BB, sql as Ug, literal as Yi } from "@uwdata/mosaic-sql";
function ZC() {
  return !(navigator.gpu == null || navigator.gpu.requestAdapter == null);
}
function mi(A) {
  return A == 0 && (A = 4), A % 4 != 0 && (A += 4 - A % 4), A;
}
function WI(A, I, g, B) {
  return (A.buffer == null || A.byteSize != g || A.usage != B) && (A.buffer != null && A.buffer.destroy(), A.buffer = I.createBuffer({ size: mi(g), usage: B }), A.byteSize = g, A.destroy = () => {
    A.buffer?.destroy();
  }), A.buffer;
}
function CB(A, I, g, B) {
  if (A.buffer !== g || A.data !== B) {
    if (B != null)
      if (B.byteLength % 4 != 0) {
        let C = B.byteLength - B.byteLength % 4;
        if (I.queue.writeBuffer(g, 0, B, 0, C), B instanceof Uint8Array) {
          let i = new Uint8Array(4);
          for (let e = 0; e < 4; e++)
            C + e < B.length && (i[e] = B[C + e]);
          I.queue.writeBuffer(g, C, i);
        }
      } else
        I.queue.writeBuffer(g, 0, B, 0);
    else
      I.queue.writeBuffer(g, 0, new ArrayBuffer(g.size));
    A.buffer = g, A.data = B;
  }
  return g;
}
function sC(A, I, g, B, C, i) {
  return (A.texture == null || A.width != g || A.height != B || A.format != C || A.usage != i) && (A.texture != null && A.texture.destroy(), A.texture = I.createTexture({ size: [g, B], format: C, usage: i }), A.destroy = () => {
    A.texture?.destroy();
  }), A.texture;
}
const pA = 2, YB = 4, Og = 8, Sg = 16, rI = 32, xI = 64, zC = 128, _A = 256, Lg = 512, FA = 1024, TA = 2048, fI = 4096, VA = 8192, LI = 16384, mB = 32768, KB = 65536, lC = 1 << 17, Ki = 1 << 18, pB = 1 << 19, xB = 1 << 20, uB = 1 << 21, LB = 1 << 22, MI = 1 << 23, UI = Symbol("$state"), jC = Symbol("legacy props"), pi = Symbol(""), vB = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), $C = 3, Dg = 8, Ae = !1;
var HB = Array.isArray, xi = Array.prototype.indexOf, bB = Array.from, vg = Object.defineProperty, VI = Object.getOwnPropertyDescriptor, Ie = Object.getOwnPropertyDescriptors, Li = Object.prototype, vi = Array.prototype, qB = Object.getPrototypeOf, hC = Object.isExtensible;
function ge(A) {
  for (var I = 0; I < A.length; I++)
    A[I]();
}
function Hi() {
  var A, I, g = new Promise((B, C) => {
    A = B, I = C;
  });
  return { promise: g, resolve: A, reject: I };
}
function Be(A) {
  return A === this.v;
}
function Ce(A, I) {
  return A != A ? I == I : A !== I || A !== null && typeof A == "object" || typeof A == "function";
}
function bi(A, I) {
  return A !== I;
}
function ee(A) {
  return !Ce(A, this.v);
}
function qi() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function ie(A) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function _i() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function Ti(A) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Wi() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function Vi(A) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function Oi() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function Xi() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function Pi(A) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function Zi() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function zi() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function ji() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let $i = !1;
const Xg = 1, Pg = 2, Qe = 4, AQ = 8, IQ = 16, gQ = 1, BQ = 4, CQ = 8, eQ = 16, iQ = 1, QQ = 2, Ee = "[", _B = "[!", TB = "]", OI = {}, DA = Symbol(), EQ = "http://www.w3.org/1999/xhtml";
let xA = null;
function Hg(A) {
  xA = A;
}
function wI(A, I = !1, g) {
  xA = {
    p: xA,
    c: null,
    e: null,
    s: A,
    x: null,
    l: null
  };
}
function yI(A) {
  var I = (
    /** @type {ComponentContext} */
    xA
  ), g = I.e;
  if (g !== null) {
    I.e = null;
    for (var B of g)
      Je(B);
  }
  return A !== void 0 && (I.x = A), xA = I.p, A ?? /** @type {T} */
  {};
}
function te() {
  return !0;
}
function Zg(A) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let AA = !1;
function QI(A) {
  AA = A;
}
let j;
function OA(A) {
  if (A === null)
    throw Zg(), OI;
  return j = A;
}
function Gg() {
  return OA(
    /** @type {TemplateNode} */
    /* @__PURE__ */ aI(j)
  );
}
function hA(A) {
  if (AA) {
    if (/* @__PURE__ */ aI(j) !== null)
      throw Zg(), OI;
    j = A;
  }
}
function tQ(A = 1) {
  if (AA) {
    for (var I = A, g = j; I--; )
      g = /** @type {TemplateNode} */
      /* @__PURE__ */ aI(g);
    j = g;
  }
}
function fB() {
  for (var A = 0, I = j; ; ) {
    if (I.nodeType === Dg) {
      var g = (
        /** @type {Comment} */
        I.data
      );
      if (g === TB) {
        if (A === 0) return I;
        A -= 1;
      } else (g === Ee || g === _B) && (A += 1);
    }
    var B = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ aI(I)
    );
    I.remove(), I = B;
  }
}
function oe(A) {
  if (!A || A.nodeType !== Dg)
    throw Zg(), OI;
  return (
    /** @type {Comment} */
    A.data
  );
}
function RI(A) {
  if (typeof A != "object" || A === null || UI in A)
    return A;
  const I = qB(A);
  if (I !== Li && I !== vi)
    return A;
  var g = /* @__PURE__ */ new Map(), B = HB(A), C = /* @__PURE__ */ iA(0), i = JI, e = (E) => {
    if (JI === i)
      return E();
    var Q = V, t = JI;
    AI(null), yC(i);
    var o = E();
    return AI(Q), yC(t), o;
  };
  return B && g.set("length", /* @__PURE__ */ iA(
    /** @type {any[]} */
    A.length
  )), new Proxy(
    /** @type {any} */
    A,
    {
      defineProperty(E, Q, t) {
        (!("value" in t) || t.configurable === !1 || t.enumerable === !1 || t.writable === !1) && Zi();
        var o = g.get(Q);
        return o === void 0 ? o = e(() => {
          var r = /* @__PURE__ */ iA(t.value);
          return g.set(Q, r), r;
        }) : x(o, t.value, !0), !0;
      },
      deleteProperty(E, Q) {
        var t = g.get(Q);
        if (t === void 0) {
          if (Q in E) {
            const o = e(() => /* @__PURE__ */ iA(DA));
            g.set(Q, o), eB(C);
          }
        } else
          x(t, DA), eB(C);
        return !0;
      },
      get(E, Q, t) {
        if (Q === UI)
          return A;
        var o = g.get(Q), r = Q in E;
        if (o === void 0 && (!r || VI(E, Q)?.writable) && (o = e(() => {
          var s = RI(r ? E[Q] : DA), a = /* @__PURE__ */ iA(s);
          return a;
        }), g.set(Q, o)), o !== void 0) {
          var l = n(o);
          return l === DA ? void 0 : l;
        }
        return Reflect.get(E, Q, t);
      },
      getOwnPropertyDescriptor(E, Q) {
        var t = Reflect.getOwnPropertyDescriptor(E, Q);
        if (t && "value" in t) {
          var o = g.get(Q);
          o && (t.value = n(o));
        } else if (t === void 0) {
          var r = g.get(Q), l = r?.v;
          if (r !== void 0 && l !== DA)
            return {
              enumerable: !0,
              configurable: !0,
              value: l,
              writable: !0
            };
        }
        return t;
      },
      has(E, Q) {
        if (Q === UI)
          return !0;
        var t = g.get(Q), o = t !== void 0 && t.v !== DA || Reflect.has(E, Q);
        if (t !== void 0 || T !== null && (!o || VI(E, Q)?.writable)) {
          t === void 0 && (t = e(() => {
            var l = o ? RI(E[Q]) : DA, s = /* @__PURE__ */ iA(l);
            return s;
          }), g.set(Q, t));
          var r = n(t);
          if (r === DA)
            return !1;
        }
        return o;
      },
      set(E, Q, t, o) {
        var r = g.get(Q), l = Q in E;
        if (B && Q === "length")
          for (var s = t; s < /** @type {Source<number>} */
          r.v; s += 1) {
            var a = g.get(s + "");
            a !== void 0 ? x(a, DA) : s in E && (a = e(() => /* @__PURE__ */ iA(DA)), g.set(s + "", a));
          }
        if (r === void 0)
          (!l || VI(E, Q)?.writable) && (r = e(() => /* @__PURE__ */ iA(void 0)), x(r, RI(t)), g.set(Q, r));
        else {
          l = r.v !== DA;
          var h = e(() => RI(t));
          x(r, h);
        }
        var D = Reflect.getOwnPropertyDescriptor(E, Q);
        if (D?.set && D.set.call(o, t), !l) {
          if (B && typeof Q == "string") {
            var f = (
              /** @type {Source<number>} */
              g.get("length")
            ), y = Number(Q);
            Number.isInteger(y) && y >= f.v && x(f, y + 1);
          }
          eB(C);
        }
        return !0;
      },
      ownKeys(E) {
        n(C);
        var Q = Reflect.ownKeys(E).filter((r) => {
          var l = g.get(r);
          return l === void 0 || l.v !== DA;
        });
        for (var [t, o] of g)
          o.v !== DA && !(t in E) && Q.push(t);
        return Q;
      },
      setPrototypeOf() {
        zi();
      }
    }
  );
}
var cC, ne, re, ae;
function wB() {
  if (cC === void 0) {
    cC = window, ne = /Firefox/.test(navigator.userAgent);
    var A = Element.prototype, I = Node.prototype, g = Text.prototype;
    re = VI(I, "firstChild").get, ae = VI(I, "nextSibling").get, hC(A) && (A.__click = void 0, A.__className = void 0, A.__attributes = null, A.__style = void 0, A.__e = void 0), hC(g) && (g.__t = void 0);
  }
}
function tI(A = "") {
  return document.createTextNode(A);
}
// @__NO_SIDE_EFFECTS__
function oI(A) {
  return re.call(A);
}
// @__NO_SIDE_EFFECTS__
function aI(A) {
  return ae.call(A);
}
function uA(A, I) {
  if (!AA)
    return /* @__PURE__ */ oI(A);
  var g = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ oI(j)
  );
  if (g === null)
    g = j.appendChild(tI());
  else if (I && g.nodeType !== $C) {
    var B = tI();
    return g?.before(B), OA(B), B;
  }
  return OA(g), g;
}
function TI(A, I) {
  if (!AA) {
    var g = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ oI(
        /** @type {Node} */
        A
      )
    );
    return g instanceof Comment && g.data === "" ? /* @__PURE__ */ aI(g) : g;
  }
  return j;
}
function tA(A, I = 1, g = !1) {
  let B = AA ? j : A;
  for (var C; I--; )
    C = B, B = /** @type {TemplateNode} */
    /* @__PURE__ */ aI(B);
  if (!AA)
    return B;
  if (g && B?.nodeType !== $C) {
    var i = tI();
    return B === null ? C?.after(i) : B.before(i), OA(i), i;
  }
  return OA(B), /** @type {TemplateNode} */
  B;
}
function se(A) {
  A.textContent = "";
}
function WB() {
  return !1;
}
const oQ = /* @__PURE__ */ new WeakMap();
function nQ(A) {
  var I = T;
  if (I === null)
    return V.f |= MI, A;
  if ((I.f & mB) === 0) {
    if ((I.f & zC) === 0)
      throw !I.parent && A instanceof Error && le(A), A;
    I.b.error(A);
  } else
    VB(A, I);
}
function VB(A, I) {
  for (; I !== null; ) {
    if ((I.f & zC) !== 0)
      try {
        I.b.error(A);
        return;
      } catch (g) {
        A = g;
      }
    I = I.parent;
  }
  throw A instanceof Error && le(A), A;
}
function le(A) {
  const I = oQ.get(A);
  I && (vg(A, "message", {
    value: I.message
  }), vg(A, "stack", {
    value: I.stack
  }));
}
let ug = [], yB = [];
function he() {
  var A = ug;
  ug = [], ge(A);
}
function rQ() {
  var A = yB;
  yB = [], ge(A);
}
function OB(A) {
  ug.length === 0 && queueMicrotask(he), ug.push(A);
}
function aQ() {
  ug.length > 0 && he(), yB.length > 0 && rQ();
}
function sQ() {
  for (var A = (
    /** @type {Effect} */
    T.b
  ); A !== null && !A.has_pending_snippet(); )
    A = A.parent;
  return A === null && qi(), A;
}
// @__NO_SIDE_EFFECTS__
function zg(A) {
  var I = pA | TA, g = V !== null && (V.f & pA) !== 0 ? (
    /** @type {Derived} */
    V
  ) : null;
  return T === null || g !== null && (g.f & _A) !== 0 ? I |= _A : T.f |= pB, {
    ctx: xA,
    deps: null,
    effects: null,
    equals: Be,
    f: I,
    fn: A,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      DA
    ),
    wv: 0,
    parent: g ?? T,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function lQ(A, I) {
  let g = (
    /** @type {Effect | null} */
    T
  );
  g === null && _i();
  var B = (
    /** @type {Boundary} */
    g.b
  ), C = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), i = fg(
    /** @type {V} */
    DA
  ), e = null, E = !V;
  return NQ(() => {
    try {
      var Q = A();
    } catch (s) {
      Q = Promise.reject(s);
    }
    var t = () => Q;
    C = e?.then(t, t) ?? Promise.resolve(Q), e = C;
    var o = (
      /** @type {Batch} */
      rA
    ), r = B.pending;
    E && (B.update_pending_count(1), r || o.increment());
    const l = (s, a = void 0) => {
      e = null, r || o.activate(), a ? a !== vB && (i.f |= MI, wg(i, a)) : ((i.f & MI) !== 0 && (i.f ^= MI), wg(i, s)), E && (B.update_pending_count(-1), r || o.decrement()), fe();
    };
    if (C.then(l, (s) => l(null, s || "unknown")), o)
      return () => {
        queueMicrotask(() => o.neuter());
      };
  }), new Promise((Q) => {
    function t(o) {
      function r() {
        o === C ? Q(i) : t(C);
      }
      o.then(r, r);
    }
    t(C);
  });
}
// @__NO_SIDE_EFFECTS__
function k(A) {
  const I = /* @__PURE__ */ zg(A);
  return Se(I), I;
}
// @__NO_SIDE_EFFECTS__
function ce(A) {
  const I = /* @__PURE__ */ zg(A);
  return I.equals = ee, I;
}
function De(A) {
  var I = A.effects;
  if (I !== null) {
    A.effects = null;
    for (var g = 0; g < I.length; g += 1)
      nI(
        /** @type {Effect} */
        I[g]
      );
  }
}
function hQ(A) {
  for (var I = A.parent; I !== null; ) {
    if ((I.f & pA) === 0)
      return (
        /** @type {Effect} */
        I
      );
    I = I.parent;
  }
  return null;
}
function XB(A) {
  var I, g = T;
  uI(hQ(A));
  try {
    De(A), I = Me(A);
  } finally {
    uI(g);
  }
  return I;
}
function ue(A) {
  var I = XB(A);
  if (A.equals(I) || (A.v = I, A.wv = Re()), !vI)
    if (ZI !== null)
      ZI.set(A, A.v);
    else {
      var g = (lI || (A.f & _A) !== 0) && A.deps !== null ? fI : FA;
      YA(A, g);
    }
}
function cQ(A, I, g) {
  const B = zg;
  if (I.length === 0) {
    g(A.map(B));
    return;
  }
  var C = rA, i = (
    /** @type {Effect} */
    T
  ), e = DQ(), E = sQ();
  Promise.all(I.map((Q) => /* @__PURE__ */ lQ(Q))).then((Q) => {
    C?.activate(), e();
    try {
      g([...A.map(B), ...Q]);
    } catch (t) {
      (i.f & LI) === 0 && VB(t, i);
    }
    C?.deactivate(), fe();
  }).catch((Q) => {
    E.error(Q);
  });
}
function DQ() {
  var A = T, I = V, g = xA;
  return function() {
    uI(A), AI(I), Hg(g);
  };
}
function fe() {
  uI(null), AI(null), Hg(null);
}
const Cg = /* @__PURE__ */ new Set();
let rA = null, ZI = null, DC = /* @__PURE__ */ new Set(), bg = [];
function we() {
  const A = (
    /** @type {() => void} */
    bg.shift()
  );
  bg.length > 0 && queueMicrotask(we), A();
}
let mI = [], jg = null, dB = !1, Kg = !1;
class zI {
  /**
   * The current values of any sources that are updated in this batch
   * They keys of this map are identical to `this.#previous`
   * @type {Map<Source, any>}
   */
  current = /* @__PURE__ */ new Map();
  /**
   * The values of any sources that are updated in this batch _before_ those updates took place.
   * They keys of this map are identical to `this.#current`
   * @type {Map<Source, any>}
   */
  #I = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<() => void>}
   */
  #A = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #g = 0;
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #t = null;
  /**
   * True if an async effect inside this batch resolved and
   * its parent branch was already deleted
   */
  #o = !1;
  /**
   * Async effects (created inside `async_derived`) encountered during processing.
   * These run after the rest of the batch has updated, since they should
   * always have the latest values
   * @type {Effect[]}
   */
  #C = [];
  /**
   * The same as `#async_effects`, but for effects inside a newly-created
   * `<svelte:boundary>` — these do not prevent the batch from committing
   * @type {Effect[]}
   */
  #i = [];
  /**
   * Template effects and `$effect.pre` effects, which run when
   * a batch is committed
   * @type {Effect[]}
   */
  #e = [];
  /**
   * The same as `#render_effects`, but for `$effect` (which runs after)
   * @type {Effect[]}
   */
  #B = [];
  /**
   * Block effects, which may need to re-run on subsequent flushes
   * in order to update internal sources (e.g. each block items)
   * @type {Effect[]}
   */
  #Q = [];
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Effect[]}
   */
  #n = [];
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Effect[]}
   */
  #r = [];
  /**
   * A set of branches that still exist, but will be destroyed when this batch
   * is committed — we skip over these during `process`
   * @type {Set<Effect>}
   */
  skipped_effects = /* @__PURE__ */ new Set();
  /**
   *
   * @param {Effect[]} root_effects
   */
  process(I) {
    mI = [];
    var g = null;
    if (Cg.size > 1) {
      g = /* @__PURE__ */ new Map(), ZI = /* @__PURE__ */ new Map();
      for (const [i, e] of this.current)
        g.set(i, { v: i.v, wv: i.wv }), i.v = e;
      for (const i of Cg)
        if (i !== this)
          for (const [e, E] of i.#I)
            g.has(e) || (g.set(e, { v: e.v, wv: e.wv }), e.v = E);
    }
    for (const i of I)
      this.#s(i);
    if (this.#C.length === 0 && this.#g === 0) {
      this.#a();
      var B = this.#e, C = this.#B;
      this.#e = [], this.#B = [], this.#Q = [], rA = null, uC(B), uC(C), rA === null ? rA = this : Cg.delete(this), this.#t?.resolve();
    } else
      this.#E(this.#e), this.#E(this.#B), this.#E(this.#Q);
    if (g) {
      for (const [i, { v: e, wv: E }] of g)
        i.wv <= E && (i.v = e);
      ZI = null;
    }
    for (const i of this.#C)
      lg(i);
    for (const i of this.#i)
      lg(i);
    this.#C = [], this.#i = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #s(I) {
    I.f ^= FA;
    for (var g = I.first; g !== null; ) {
      var B = g.f, C = (B & (rI | xI)) !== 0, i = C && (B & FA) !== 0, e = i || (B & VA) !== 0 || this.skipped_effects.has(g);
      if (!e && g.fn !== null) {
        if (C)
          g.f ^= FA;
        else if ((B & FA) === 0)
          if ((B & YB) !== 0)
            this.#B.push(g);
          else if ((B & LB) !== 0) {
            var E = g.b?.pending ? this.#i : this.#C;
            E.push(g);
          } else $g(g) && ((g.f & Sg) !== 0 && this.#Q.push(g), lg(g));
        var Q = g.first;
        if (Q !== null) {
          g = Q;
          continue;
        }
      }
      var t = g.parent;
      for (g = g.next; g === null && t !== null; )
        g = t.next, t = t.parent;
    }
  }
  /**
   * @param {Effect[]} effects
   */
  #E(I) {
    for (const g of I)
      ((g.f & TA) !== 0 ? this.#n : this.#r).push(g), YA(g, FA);
    I.length = 0;
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} value
   */
  capture(I, g) {
    this.#I.has(I) || this.#I.set(I, g), this.current.set(I, I.v);
  }
  activate() {
    rA = this;
  }
  deactivate() {
    rA = null;
    for (const I of DC)
      if (DC.delete(I), I(), rA !== null)
        break;
  }
  neuter() {
    this.#o = !0;
  }
  flush() {
    mI.length > 0 ? ye() : this.#a(), rA === this && (this.#g === 0 && Cg.delete(this), this.deactivate());
  }
  /**
   * Append and remove branches to/from the DOM
   */
  #a() {
    if (!this.#o)
      for (const I of this.#A)
        I();
    this.#A.clear();
  }
  increment() {
    this.#g += 1;
  }
  decrement() {
    if (this.#g -= 1, this.#g === 0) {
      for (const I of this.#n)
        YA(I, TA), KI(I);
      for (const I of this.#r)
        YA(I, fI), KI(I);
      this.#e = [], this.#B = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(I) {
    this.#A.add(I);
  }
  settled() {
    return (this.#t ??= Hi()).promise;
  }
  static ensure() {
    if (rA === null) {
      const I = rA = new zI();
      Cg.add(rA), Kg || zI.enqueue(() => {
        rA === I && I.flush();
      });
    }
    return rA;
  }
  /** @param {() => void} task */
  static enqueue(I) {
    bg.length === 0 && queueMicrotask(we), bg.unshift(I);
  }
}
function uQ(A) {
  var I = Kg;
  Kg = !0;
  try {
    for (var g; ; ) {
      if (aQ(), mI.length === 0 && (rA?.flush(), mI.length === 0))
        return jg = null, /** @type {T} */
        g;
      ye();
    }
  } finally {
    Kg = I;
  }
}
function ye() {
  var A = XI;
  dB = !0;
  try {
    var I = 0;
    for (fC(!0); mI.length > 0; ) {
      var g = zI.ensure();
      if (I++ > 1e3) {
        var B, C;
        fQ();
      }
      g.process(mI), kI.clear();
    }
  } finally {
    dB = !1, fC(A), jg = null;
  }
}
function fQ() {
  try {
    Oi();
  } catch (A) {
    VB(A, jg);
  }
}
function uC(A) {
  var I = A.length;
  if (I !== 0) {
    for (var g = 0; g < I; ) {
      var B = A[g++];
      if ((B.f & (LI | VA)) === 0 && $g(B)) {
        var C = rA ? rA.current.size : 0;
        if (lg(B), B.deps === null && B.first === null && B.nodes_start === null && (B.teardown === null && B.ac === null ? xe(B) : B.fn = null), rA !== null && rA.current.size > C && (B.f & xB) !== 0)
          break;
      }
    }
    for (; g < I; )
      KI(A[g++]);
  }
}
function KI(A) {
  for (var I = jg = A; I.parent !== null; ) {
    I = I.parent;
    var g = I.f;
    if (dB && I === T && (g & Sg) !== 0)
      return;
    if ((g & (xI | rI)) !== 0) {
      if ((g & FA) === 0) return;
      I.f ^= FA;
    }
  }
  mI.push(I);
}
const kI = /* @__PURE__ */ new Map();
function fg(A, I) {
  var g = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: A,
    reactions: null,
    equals: Be,
    rv: 0,
    wv: 0
  };
  return g;
}
// @__NO_SIDE_EFFECTS__
function iA(A, I) {
  const g = fg(A);
  return Se(g), g;
}
// @__NO_SIDE_EFFECTS__
function de(A, I = !1, g = !0) {
  const B = fg(A);
  return I || (B.equals = ee), B;
}
function x(A, I, g = !1) {
  V !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!zA || (V.f & lC) !== 0) && te() && (V.f & (pA | Sg | LB | lC)) !== 0 && !EI?.includes(A) && ji();
  let B = g ? RI(I) : I;
  return wg(A, B);
}
function wg(A, I) {
  if (!A.equals(I)) {
    var g = A.v;
    vI ? kI.set(A, I) : kI.set(A, g), A.v = I;
    var B = zI.ensure();
    B.capture(A, g), (A.f & pA) !== 0 && ((A.f & TA) !== 0 && XB(
      /** @type {Derived} */
      A
    ), YA(A, (A.f & _A) === 0 ? FA : fI)), A.wv = Re(), Fe(A, TA), T !== null && (T.f & FA) !== 0 && (T.f & (rI | xI)) === 0 && (qA === null ? wQ([A]) : qA.push(A));
  }
  return I;
}
function eB(A) {
  x(A, A.v + 1);
}
function Fe(A, I) {
  var g = A.reactions;
  if (g !== null)
    for (var B = g.length, C = 0; C < B; C++) {
      var i = g[C], e = i.f, E = (e & TA) === 0;
      E && YA(i, I), (e & pA) !== 0 ? Fe(
        /** @type {Derived} */
        i,
        fI
      ) : E && KI(
        /** @type {Effect} */
        i
      );
    }
}
let XI = !1;
function fC(A) {
  XI = A;
}
let vI = !1;
function wC(A) {
  vI = A;
}
let V = null, zA = !1;
function AI(A) {
  V = A;
}
let T = null;
function uI(A) {
  T = A;
}
let EI = null;
function Se(A) {
  V !== null && (EI === null ? EI = [A] : EI.push(A));
}
let GA = null, mA = 0, qA = null;
function wQ(A) {
  qA = A;
}
let Ge = 1, yg = 0, JI = yg;
function yC(A) {
  JI = A;
}
let lI = !1;
function Re() {
  return ++Ge;
}
function $g(A) {
  var I = A.f;
  if ((I & TA) !== 0)
    return !0;
  if ((I & fI) !== 0) {
    var g = A.deps, B = (I & _A) !== 0;
    if (g !== null) {
      var C, i, e = (I & Lg) !== 0, E = B && T !== null && !lI, Q = g.length;
      if ((e || E) && (T === null || (T.f & LI) === 0)) {
        var t = (
          /** @type {Derived} */
          A
        ), o = t.parent;
        for (C = 0; C < Q; C++)
          i = g[C], (e || !i?.reactions?.includes(t)) && (i.reactions ??= []).push(t);
        e && (t.f ^= Lg), E && o !== null && (o.f & _A) === 0 && (t.f ^= _A);
      }
      for (C = 0; C < Q; C++)
        if (i = g[C], $g(
          /** @type {Derived} */
          i
        ) && ue(
          /** @type {Derived} */
          i
        ), i.wv > A.wv)
          return !0;
    }
    (!B || T !== null && !lI) && YA(A, FA);
  }
  return !1;
}
function Ne(A, I, g = !0) {
  var B = A.reactions;
  if (B !== null && !EI?.includes(A))
    for (var C = 0; C < B.length; C++) {
      var i = B[C];
      (i.f & pA) !== 0 ? Ne(
        /** @type {Derived} */
        i,
        I,
        !1
      ) : I === i && (g ? YA(i, TA) : (i.f & FA) !== 0 && YA(i, fI), KI(
        /** @type {Effect} */
        i
      ));
    }
}
function Me(A) {
  var I = GA, g = mA, B = qA, C = V, i = lI, e = EI, E = xA, Q = zA, t = JI, o = A.f;
  GA = /** @type {null | Value[]} */
  null, mA = 0, qA = null, lI = (o & _A) !== 0 && (zA || !XI || V === null), V = (o & (rI | xI)) === 0 ? A : null, EI = null, Hg(A.ctx), zA = !1, JI = ++yg, A.ac !== null && (A.ac.abort(vB), A.ac = null);
  try {
    A.f |= uB;
    var r = (
      /** @type {Function} */
      (0, A.fn)()
    ), l = A.deps;
    if (GA !== null) {
      var s;
      if (qg(A, mA), l !== null && mA > 0)
        for (l.length = mA + GA.length, s = 0; s < GA.length; s++)
          l[mA + s] = GA[s];
      else
        A.deps = l = GA;
      if (!lI || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (o & pA) !== 0 && /** @type {import('#client').Derived} */
      A.reactions !== null)
        for (s = mA; s < l.length; s++)
          (l[s].reactions ??= []).push(A);
    } else l !== null && mA < l.length && (qg(A, mA), l.length = mA);
    if (te() && qA !== null && !zA && l !== null && (A.f & (pA | fI | TA)) === 0)
      for (s = 0; s < /** @type {Source[]} */
      qA.length; s++)
        Ne(
          qA[s],
          /** @type {Effect} */
          A
        );
    return C !== null && C !== A && (yg++, qA !== null && (B === null ? B = qA : B.push(.../** @type {Source[]} */
    qA))), (A.f & MI) !== 0 && (A.f ^= MI), r;
  } catch (a) {
    return nQ(a);
  } finally {
    A.f ^= uB, GA = I, mA = g, qA = B, V = C, lI = i, EI = e, Hg(E), zA = Q, JI = t;
  }
}
function yQ(A, I) {
  let g = I.reactions;
  if (g !== null) {
    var B = xi.call(g, A);
    if (B !== -1) {
      var C = g.length - 1;
      C === 0 ? g = I.reactions = null : (g[B] = g[C], g.pop());
    }
  }
  g === null && (I.f & pA) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (GA === null || !GA.includes(I)) && (YA(I, fI), (I.f & (_A | Lg)) === 0 && (I.f ^= Lg), De(
    /** @type {Derived} **/
    I
  ), qg(
    /** @type {Derived} **/
    I,
    0
  ));
}
function qg(A, I) {
  var g = A.deps;
  if (g !== null)
    for (var B = I; B < g.length; B++)
      yQ(A, g[B]);
}
function lg(A) {
  var I = A.f;
  if ((I & LI) === 0) {
    YA(A, FA);
    var g = T, B = XI;
    T = A, XI = !0;
    try {
      (I & Sg) !== 0 ? MQ(A) : pe(A), Ke(A);
      var C = Me(A);
      A.teardown = typeof C == "function" ? C : null, A.wv = Ge;
      var i;
      Ae && $i && (A.f & TA) !== 0 && A.deps;
    } finally {
      XI = B, T = g;
    }
  }
}
function n(A) {
  var I = A.f, g = (I & pA) !== 0;
  if (V !== null && !zA) {
    var B = T !== null && (T.f & LI) !== 0;
    if (!B && !EI?.includes(A)) {
      var C = V.deps;
      if ((V.f & uB) !== 0)
        A.rv < yg && (A.rv = yg, GA === null && C !== null && C[mA] === A ? mA++ : GA === null ? GA = [A] : (!lI || !GA.includes(A)) && GA.push(A));
      else {
        (V.deps ??= []).push(A);
        var i = A.reactions;
        i === null ? A.reactions = [V] : i.includes(V) || i.push(V);
      }
    }
  } else if (g && /** @type {Derived} */
  A.deps === null && /** @type {Derived} */
  A.effects === null) {
    var e = (
      /** @type {Derived} */
      A
    ), E = e.parent;
    E !== null && (E.f & _A) === 0 && (e.f ^= _A);
  }
  if (vI) {
    if (kI.has(A))
      return kI.get(A);
    if (g) {
      e = /** @type {Derived} */
      A;
      var Q = e.v;
      return ((e.f & FA) === 0 && e.reactions !== null || Ue(e)) && (Q = XB(e)), kI.set(e, Q), Q;
    }
  } else if (g) {
    if (e = /** @type {Derived} */
    A, ZI?.has(e))
      return ZI.get(e);
    $g(e) && ue(e);
  }
  if ((A.f & MI) !== 0)
    throw A.v;
  return A.v;
}
function Ue(A) {
  if (A.v === DA) return !0;
  if (A.deps === null) return !1;
  for (const I of A.deps)
    if (kI.has(I) || (I.f & pA) !== 0 && Ue(
      /** @type {Derived} */
      I
    ))
      return !0;
  return !1;
}
function $I(A) {
  var I = zA;
  try {
    return zA = !0, A();
  } finally {
    zA = I;
  }
}
const dQ = -7169;
function YA(A, I) {
  A.f = A.f & dQ | I;
}
function FQ(A) {
  if (!(typeof A != "object" || !A || A instanceof EventTarget)) {
    if (UI in A)
      FB(A);
    else if (!Array.isArray(A))
      for (let I in A) {
        const g = A[I];
        typeof g == "object" && g && UI in g && FB(g);
      }
  }
}
function FB(A, I = /* @__PURE__ */ new Set()) {
  if (typeof A == "object" && A !== null && // We don't want to traverse DOM elements
  !(A instanceof EventTarget) && !I.has(A)) {
    I.add(A), A instanceof Date && A.getTime();
    for (let B in A)
      try {
        FB(A[B], I);
      } catch {
      }
    const g = qB(A);
    if (g !== Object.prototype && g !== Array.prototype && g !== Map.prototype && g !== Set.prototype && g !== Date.prototype) {
      const B = Ie(g);
      for (let C in B) {
        const i = B[C].get;
        if (i)
          try {
            i.call(A);
          } catch {
          }
      }
    }
  }
}
function ke(A) {
  T === null && V === null && Vi(), V !== null && (V.f & _A) !== 0 && T === null && Wi(), vI && Ti();
}
function SQ(A, I) {
  var g = I.last;
  g === null ? I.last = I.first = A : (g.next = A, A.prev = g, I.last = A);
}
function gI(A, I, g, B = !0) {
  var C = T;
  C !== null && (C.f & VA) !== 0 && (A |= VA);
  var i = {
    ctx: xA,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: A | TA,
    first: null,
    fn: I,
    last: null,
    next: null,
    parent: C,
    b: C && C.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (g)
    try {
      lg(i), i.f |= mB;
    } catch (Q) {
      throw nI(i), Q;
    }
  else I !== null && KI(i);
  var e = g && i.deps === null && i.first === null && i.nodes_start === null && i.teardown === null && (i.f & pB) === 0;
  if (!e && B && (C !== null && SQ(i, C), V !== null && (V.f & pA) !== 0 && (A & xI) === 0)) {
    var E = (
      /** @type {Derived} */
      V
    );
    (E.effects ??= []).push(i);
  }
  return i;
}
function GQ(A) {
  const I = gI(Og, null, !1);
  return YA(I, FA), I.teardown = A, I;
}
function eI(A) {
  ke();
  var I = (
    /** @type {Effect} */
    T.f
  ), g = !V && (I & rI) !== 0 && (I & mB) === 0;
  if (g) {
    var B = (
      /** @type {ComponentContext} */
      xA
    );
    (B.e ??= []).push(A);
  } else
    return Je(A);
}
function Je(A) {
  return gI(YB | xB, A, !1);
}
function _g(A) {
  return ke(), gI(Og | xB, A, !0);
}
function RQ(A) {
  zI.ensure();
  const I = gI(xI, A, !0);
  return (g = {}) => new Promise((B) => {
    g.outro ? AB(I, () => {
      nI(I), B(void 0);
    }) : (nI(I), B(void 0));
  });
}
function Ye(A) {
  return gI(YB, A, !1);
}
function NQ(A) {
  return gI(LB | pB, A, !0);
}
function me(A, I = 0) {
  return gI(Og | I, A, !0);
}
function KA(A, I = [], g = []) {
  cQ(I, g, (B) => {
    gI(Og, () => A(...B.map(n)), !0);
  });
}
function PB(A, I = 0) {
  var g = gI(Sg | I, A, !0);
  return g;
}
function pI(A, I = !0) {
  return gI(rI, A, !0, I);
}
function Ke(A) {
  var I = A.teardown;
  if (I !== null) {
    const g = vI, B = V;
    wC(!0), AI(null);
    try {
      I.call(null);
    } finally {
      wC(g), AI(B);
    }
  }
}
function pe(A, I = !1) {
  var g = A.first;
  for (A.first = A.last = null; g !== null; ) {
    g.ac?.abort(vB);
    var B = g.next;
    (g.f & xI) !== 0 ? g.parent = null : nI(g, I), g = B;
  }
}
function MQ(A) {
  for (var I = A.first; I !== null; ) {
    var g = I.next;
    (I.f & rI) === 0 && nI(I), I = g;
  }
}
function nI(A, I = !0) {
  var g = !1;
  (I || (A.f & Ki) !== 0) && A.nodes_start !== null && A.nodes_end !== null && (UQ(
    A.nodes_start,
    /** @type {TemplateNode} */
    A.nodes_end
  ), g = !0), pe(A, I && !g), qg(A, 0), YA(A, LI);
  var B = A.transitions;
  if (B !== null)
    for (const i of B)
      i.stop();
  Ke(A);
  var C = A.parent;
  C !== null && C.first !== null && xe(A), A.next = A.prev = A.teardown = A.ctx = A.deps = A.fn = A.nodes_start = A.nodes_end = A.ac = null;
}
function UQ(A, I) {
  for (; A !== null; ) {
    var g = A === I ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ aI(A)
    );
    A.remove(), A = g;
  }
}
function xe(A) {
  var I = A.parent, g = A.prev, B = A.next;
  g !== null && (g.next = B), B !== null && (B.prev = g), I !== null && (I.first === A && (I.first = B), I.last === A && (I.last = g));
}
function AB(A, I) {
  var g = [];
  ZB(A, g, !0), Le(g, () => {
    nI(A), I && I();
  });
}
function Le(A, I) {
  var g = A.length;
  if (g > 0) {
    var B = () => --g || I();
    for (var C of A)
      C.out(B);
  } else
    I();
}
function ZB(A, I, g) {
  if ((A.f & VA) === 0) {
    if (A.f ^= VA, A.transitions !== null)
      for (const e of A.transitions)
        (e.is_global || g) && I.push(e);
    for (var B = A.first; B !== null; ) {
      var C = B.next, i = (B.f & KB) !== 0 || (B.f & rI) !== 0;
      ZB(B, I, i ? g : !1), B = C;
    }
  }
}
function zB(A) {
  ve(A, !0);
}
function ve(A, I) {
  if ((A.f & VA) !== 0) {
    A.f ^= VA, (A.f & FA) === 0 && (YA(A, TA), KI(A));
    for (var g = A.first; g !== null; ) {
      var B = g.next, C = (g.f & KB) !== 0 || (g.f & rI) !== 0;
      ve(g, C ? I : !1), g = B;
    }
    if (A.transitions !== null)
      for (const i of A.transitions)
        (i.is_global || I) && i.in();
  }
}
function kQ(A) {
  var I = V, g = T;
  AI(null), uI(null);
  try {
    return A();
  } finally {
    AI(I), uI(g);
  }
}
const He = /* @__PURE__ */ new Set(), SB = /* @__PURE__ */ new Set();
function JQ(A, I, g, B = {}) {
  function C(i) {
    if (B.capture || tg.call(I, i), !i.cancelBubble)
      return kQ(() => g?.call(this, i));
  }
  return A.startsWith("pointer") || A.startsWith("touch") || A === "wheel" ? OB(() => {
    I.addEventListener(A, C, B);
  }) : I.addEventListener(A, C, B), C;
}
function dC(A, I, g, B, C) {
  var i = { capture: B, passive: C }, e = JQ(A, I, g, i);
  (I === document.body || // @ts-ignore
  I === window || // @ts-ignore
  I === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  I instanceof HTMLMediaElement) && GQ(() => {
    I.removeEventListener(A, e, i);
  });
}
function jB(A) {
  for (var I = 0; I < A.length; I++)
    He.add(A[I]);
  for (var g of SB)
    g(A);
}
let FC = null;
function tg(A) {
  var I = this, g = (
    /** @type {Node} */
    I.ownerDocument
  ), B = A.type, C = A.composedPath?.() || [], i = (
    /** @type {null | Element} */
    C[0] || A.target
  );
  FC = A;
  var e = 0, E = FC === A && A.__root;
  if (E) {
    var Q = C.indexOf(E);
    if (Q !== -1 && (I === document || I === /** @type {any} */
    window)) {
      A.__root = I;
      return;
    }
    var t = C.indexOf(I);
    if (t === -1)
      return;
    Q <= t && (e = Q);
  }
  if (i = /** @type {Element} */
  C[e] || A.target, i !== I) {
    vg(A, "currentTarget", {
      configurable: !0,
      get() {
        return i || g;
      }
    });
    var o = V, r = T;
    AI(null), uI(null);
    try {
      for (var l, s = []; i !== null; ) {
        var a = i.assignedSlot || i.parentNode || /** @type {any} */
        i.host || null;
        try {
          var h = i["__" + B];
          if (h != null && (!/** @type {any} */
          i.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          A.target === i))
            if (HB(h)) {
              var [D, ...f] = h;
              D.apply(i, [A, ...f]);
            } else
              h.call(i, A);
        } catch (y) {
          l ? s.push(y) : l = y;
        }
        if (A.cancelBubble || a === I || a === null)
          break;
        i = a;
      }
      if (l) {
        for (let y of s)
          queueMicrotask(() => {
            throw y;
          });
        throw l;
      }
    } finally {
      A.__root = I, delete A.currentTarget, AI(o), uI(r);
    }
  }
}
function be(A) {
  var I = document.createElement("template");
  return I.innerHTML = A.replaceAll("<!>", "<!---->"), I.content;
}
function DI(A, I) {
  var g = (
    /** @type {Effect} */
    T
  );
  g.nodes_start === null && (g.nodes_start = A, g.nodes_end = I);
}
// @__NO_SIDE_EFFECTS__
function dI(A, I) {
  var g = (I & iQ) !== 0, B = (I & QQ) !== 0, C, i = !A.startsWith("<!>");
  return () => {
    if (AA)
      return DI(j, null), j;
    C === void 0 && (C = be(i ? A : "<!>" + A), g || (C = /** @type {Node} */
    /* @__PURE__ */ oI(C)));
    var e = (
      /** @type {TemplateNode} */
      B || ne ? document.importNode(C, !0) : C.cloneNode(!0)
    );
    if (g) {
      var E = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ oI(e)
      ), Q = (
        /** @type {TemplateNode} */
        e.lastChild
      );
      DI(E, Q);
    } else
      DI(e, e);
    return e;
  };
}
// @__NO_SIDE_EFFECTS__
function YQ(A, I, g = "svg") {
  var B = !A.startsWith("<!>"), C = `<${g}>${B ? A : "<!>" + A}</${g}>`, i;
  return () => {
    if (AA)
      return DI(j, null), j;
    if (!i) {
      var e = (
        /** @type {DocumentFragment} */
        be(C)
      ), E = (
        /** @type {Element} */
        /* @__PURE__ */ oI(e)
      );
      i = /** @type {Element} */
      /* @__PURE__ */ oI(E);
    }
    var Q = (
      /** @type {TemplateNode} */
      i.cloneNode(!0)
    );
    return DI(Q, Q), Q;
  };
}
// @__NO_SIDE_EFFECTS__
function sI(A, I) {
  return /* @__PURE__ */ YQ(A, I, "svg");
}
function eg() {
  if (AA)
    return DI(j, null), j;
  var A = document.createDocumentFragment(), I = document.createComment(""), g = tI();
  return A.append(I, g), DI(I, g), A;
}
function nA(A, I) {
  if (AA) {
    T.nodes_end = j, Gg();
    return;
  }
  A !== null && A.before(
    /** @type {Node} */
    I
  );
}
const mQ = ["touchstart", "touchmove"];
function KQ(A) {
  return mQ.includes(A);
}
function hg(A, I) {
  var g = I == null ? "" : typeof I == "object" ? I + "" : I;
  g !== (A.__t ??= A.nodeValue) && (A.__t = g, A.nodeValue = g + "");
}
function qe(A, I) {
  return _e(A, I);
}
function pQ(A, I) {
  wB(), I.intro = I.intro ?? !1;
  const g = I.target, B = AA, C = j;
  try {
    for (var i = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ oI(g)
    ); i && (i.nodeType !== Dg || /** @type {Comment} */
    i.data !== Ee); )
      i = /** @type {TemplateNode} */
      /* @__PURE__ */ aI(i);
    if (!i)
      throw OI;
    QI(!0), OA(
      /** @type {Comment} */
      i
    ), Gg();
    const e = _e(A, { ...I, anchor: i });
    if (j === null || j.nodeType !== Dg || /** @type {Comment} */
    j.data !== TB)
      throw Zg(), OI;
    return QI(!1), /**  @type {Exports} */
    e;
  } catch (e) {
    if (e === OI)
      return I.recover === !1 && Xi(), wB(), se(g), QI(!1), qe(A, I);
    throw e;
  } finally {
    QI(B), OA(C);
  }
}
const _I = /* @__PURE__ */ new Map();
function _e(A, { target: I, anchor: g, props: B = {}, events: C, context: i, intro: e = !0 }) {
  wB();
  var E = /* @__PURE__ */ new Set(), Q = (r) => {
    for (var l = 0; l < r.length; l++) {
      var s = r[l];
      if (!E.has(s)) {
        E.add(s);
        var a = KQ(s);
        I.addEventListener(s, tg, { passive: a });
        var h = _I.get(s);
        h === void 0 ? (document.addEventListener(s, tg, { passive: a }), _I.set(s, 1)) : _I.set(s, h + 1);
      }
    }
  };
  Q(bB(He)), SB.add(Q);
  var t = void 0, o = RQ(() => {
    var r = g ?? I.appendChild(tI());
    return pI(() => {
      if (i) {
        wI({});
        var l = (
          /** @type {ComponentContext} */
          xA
        );
        l.c = i;
      }
      C && (B.$$events = C), AA && DI(
        /** @type {TemplateNode} */
        r,
        null
      ), t = A(r, B) || {}, AA && (T.nodes_end = j), i && yI();
    }), () => {
      for (var l of E) {
        I.removeEventListener(l, tg);
        var s = (
          /** @type {number} */
          _I.get(l)
        );
        --s === 0 ? (document.removeEventListener(l, tg), _I.delete(l)) : _I.set(l, s);
      }
      SB.delete(Q), r !== g && r.parentNode?.removeChild(r);
    };
  });
  return GB.set(t, o), t;
}
let GB = /* @__PURE__ */ new WeakMap();
function xQ(A, I) {
  const g = GB.get(A);
  return g ? (GB.delete(A), g(I)) : Promise.resolve();
}
function Te(A) {
  return new LQ(A);
}
class LQ {
  /** @type {any} */
  #I;
  /** @type {Record<string, any>} */
  #A;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(I) {
    var g = /* @__PURE__ */ new Map(), B = (i, e) => {
      var E = /* @__PURE__ */ de(e, !1, !1);
      return g.set(i, E), E;
    };
    const C = new Proxy(
      { ...I.props || {}, $$events: {} },
      {
        get(i, e) {
          return n(g.get(e) ?? B(e, Reflect.get(i, e)));
        },
        has(i, e) {
          return e === jC ? !0 : (n(g.get(e) ?? B(e, Reflect.get(i, e))), Reflect.has(i, e));
        },
        set(i, e, E) {
          return x(g.get(e) ?? B(e, E), E), Reflect.set(i, e, E);
        }
      }
    );
    this.#A = (I.hydrate ? pQ : qe)(I.component, {
      target: I.target,
      anchor: I.anchor,
      props: C,
      context: I.context,
      intro: I.intro ?? !1,
      recover: I.recover
    }), (!I?.props?.$$host || I.sync === !1) && uQ(), this.#I = C.$$events;
    for (const i of Object.keys(this.#A))
      i === "$set" || i === "$destroy" || i === "$on" || vg(this, i, {
        get() {
          return this.#A[i];
        },
        /** @param {any} value */
        set(e) {
          this.#A[i] = e;
        },
        enumerable: !0
      });
    this.#A.$set = /** @param {Record<string, any>} next */
    (i) => {
      Object.assign(C, i);
    }, this.#A.$destroy = () => {
      xQ(this.#A);
    };
  }
  /** @param {Record<string, any>} props */
  $set(I) {
    this.#A.$set(I);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(I, g) {
    this.#I[I] = this.#I[I] || [];
    const B = (...C) => g.call(this, ...C);
    return this.#I[I].push(B), () => {
      this.#I[I] = this.#I[I].filter(
        /** @param {any} fn */
        (C) => C !== B
      );
    };
  }
  $destroy() {
    this.#A.$destroy();
  }
}
const vQ = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(vQ);
function $B(A) {
  xA === null && ie(), eI(() => {
    const I = $I(A);
    if (typeof I == "function") return (
      /** @type {() => void} */
      I
    );
  });
}
function HQ(A) {
  xA === null && ie(), $B(() => () => $I(A));
}
function kA(A, I, g = !1) {
  AA && Gg();
  var B = A, C = null, i = null, e = DA, E = g ? KB : 0, Q = !1;
  const t = (s, a = !0) => {
    Q = !0, l(a, s);
  };
  var o = null;
  function r() {
    o !== null && (o.lastChild.remove(), B.before(o), o = null);
    var s = e ? C : i, a = e ? i : C;
    s && zB(s), a && AB(a, () => {
      e ? i = null : C = null;
    });
  }
  const l = (s, a) => {
    if (e === (e = s)) return;
    let h = !1;
    if (AA) {
      const S = oe(B) === _B;
      !!e === S && (B = fB(), OA(B), QI(!1), h = !0);
    }
    var D = WB(), f = B;
    if (D && (o = document.createDocumentFragment(), o.append(f = tI())), e ? C ??= a && pI(() => a(f)) : i ??= a && pI(() => a(f)), D) {
      var y = (
        /** @type {Batch} */
        rA
      ), c = e ? C : i, G = e ? i : C;
      c && y.skipped_effects.delete(c), G && y.skipped_effects.add(G), y.add_callback(r);
    } else
      r();
    h && QI(!0);
  };
  PB(() => {
    Q = !1, I(t), Q || l(null, null);
  }, E), AA && (B = j);
}
function bQ(A, I, g) {
  AA && Gg();
  var B = A, C = DA, i, e, E = null, Q = bi;
  function t() {
    i && AB(i), E !== null && (E.lastChild.remove(), B.before(E), E = null), i = e;
  }
  PB(() => {
    if (Q(C, C = I())) {
      var o = B, r = WB();
      r && (E = document.createDocumentFragment(), E.append(o = tI())), e = pI(() => g(o)), r ? rA.add_callback(t) : t();
    }
  }), AA && (B = j);
}
function iB(A, I) {
  return I;
}
function qQ(A, I, g) {
  for (var B = A.items, C = [], i = I.length, e = 0; e < i; e++)
    ZB(I[e].e, C, !0);
  var E = i > 0 && C.length === 0 && g !== null;
  if (E) {
    var Q = (
      /** @type {Element} */
      /** @type {Element} */
      g.parentNode
    );
    se(Q), Q.append(
      /** @type {Element} */
      g
    ), B.clear(), ZA(A, I[0].prev, I[i - 1].next);
  }
  Le(C, () => {
    for (var t = 0; t < i; t++) {
      var o = I[t];
      E || (B.delete(o.k), ZA(A, o.prev, o.next)), nI(o.e, !E);
    }
  });
}
function QB(A, I, g, B, C, i = null) {
  var e = A, E = { flags: I, items: /* @__PURE__ */ new Map(), first: null }, Q = (I & Qe) !== 0;
  if (Q) {
    var t = (
      /** @type {Element} */
      A
    );
    e = AA ? OA(
      /** @type {Comment | Text} */
      /* @__PURE__ */ oI(t)
    ) : t.appendChild(tI());
  }
  AA && Gg();
  var o = null, r = !1, l = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ ce(() => {
    var f = g();
    return HB(f) ? f : f == null ? [] : bB(f);
  }), a, h;
  function D() {
    _Q(
      h,
      a,
      E,
      l,
      e,
      C,
      I,
      B,
      g
    ), i !== null && (a.length === 0 ? o ? zB(o) : o = pI(() => i(e)) : o !== null && AB(o, () => {
      o = null;
    }));
  }
  PB(() => {
    h ??= /** @type {Effect} */
    T, a = n(s);
    var f = a.length;
    if (r && f === 0)
      return;
    r = f === 0;
    let y = !1;
    if (AA) {
      var c = oe(e) === _B;
      c !== (f === 0) && (e = fB(), OA(e), QI(!1), y = !0);
    }
    if (AA) {
      for (var G = null, S, d = 0; d < f; d++) {
        if (j.nodeType === Dg && /** @type {Comment} */
        j.data === TB) {
          e = /** @type {Comment} */
          j, y = !0, QI(!1);
          break;
        }
        var R = a[d], L = B(R, d);
        S = RB(
          j,
          E,
          G,
          null,
          R,
          L,
          d,
          C,
          I,
          g
        ), E.items.set(L, S), G = S;
      }
      f > 0 && OA(fB());
    }
    if (AA)
      f === 0 && i && (o = pI(() => i(e)));
    else if (WB()) {
      var m = /* @__PURE__ */ new Set(), CA = (
        /** @type {Batch} */
        rA
      );
      for (d = 0; d < f; d += 1) {
        R = a[d], L = B(R, d);
        var IA = E.items.get(L) ?? l.get(L);
        IA ? (I & (Xg | Pg)) !== 0 && We(IA, R, d, I) : (S = RB(
          null,
          E,
          null,
          null,
          R,
          L,
          d,
          C,
          I,
          g,
          !0
        ), l.set(L, S)), m.add(L);
      }
      for (const [b, QA] of E.items)
        m.has(b) || CA.skipped_effects.add(QA.e);
      CA.add_callback(D);
    } else
      D();
    y && QI(!0), n(s);
  }), AA && (e = j);
}
function _Q(A, I, g, B, C, i, e, E, Q) {
  var t = (e & AQ) !== 0, o = (e & (Xg | Pg)) !== 0, r = I.length, l = g.items, s = g.first, a = s, h, D = null, f, y = [], c = [], G, S, d, R;
  if (t)
    for (R = 0; R < r; R += 1)
      G = I[R], S = E(G, R), d = l.get(S), d !== void 0 && (d.a?.measure(), (f ??= /* @__PURE__ */ new Set()).add(d));
  for (R = 0; R < r; R += 1) {
    if (G = I[R], S = E(G, R), d = l.get(S), d === void 0) {
      var L = B.get(S);
      if (L !== void 0) {
        B.delete(S), l.set(S, L);
        var m = D ? D.next : a;
        ZA(g, D, L), ZA(g, L, m), EB(L, m, C), D = L;
      } else {
        var CA = a ? (
          /** @type {TemplateNode} */
          a.e.nodes_start
        ) : C;
        D = RB(
          CA,
          g,
          D,
          D === null ? g.first : D.next,
          G,
          S,
          R,
          i,
          e,
          Q
        );
      }
      l.set(S, D), y = [], c = [], a = D.next;
      continue;
    }
    if (o && We(d, G, R, e), (d.e.f & VA) !== 0 && (zB(d.e), t && (d.a?.unfix(), (f ??= /* @__PURE__ */ new Set()).delete(d))), d !== a) {
      if (h !== void 0 && h.has(d)) {
        if (y.length < c.length) {
          var IA = c[0], b;
          D = IA.prev;
          var QA = y[0], O = y[y.length - 1];
          for (b = 0; b < y.length; b += 1)
            EB(y[b], IA, C);
          for (b = 0; b < c.length; b += 1)
            h.delete(c[b]);
          ZA(g, QA.prev, O.next), ZA(g, D, QA), ZA(g, O, IA), a = IA, D = O, R -= 1, y = [], c = [];
        } else
          h.delete(d), EB(d, a, C), ZA(g, d.prev, d.next), ZA(g, d, D === null ? g.first : D.next), ZA(g, D, d), D = d;
        continue;
      }
      for (y = [], c = []; a !== null && a.k !== S; )
        (a.e.f & VA) === 0 && (h ??= /* @__PURE__ */ new Set()).add(a), c.push(a), a = a.next;
      if (a === null)
        continue;
      d = a;
    }
    y.push(d), D = d, a = d.next;
  }
  if (a !== null || h !== void 0) {
    for (var eA = h === void 0 ? [] : bB(h); a !== null; )
      (a.e.f & VA) === 0 && eA.push(a), a = a.next;
    var Z = eA.length;
    if (Z > 0) {
      var K = (e & Qe) !== 0 && r === 0 ? C : null;
      if (t) {
        for (R = 0; R < Z; R += 1)
          eA[R].a?.measure();
        for (R = 0; R < Z; R += 1)
          eA[R].a?.fix();
      }
      qQ(g, eA, K);
    }
  }
  t && OB(() => {
    if (f !== void 0)
      for (d of f)
        d.a?.apply();
  }), A.first = g.first && g.first.e, A.last = D && D.e;
  for (var aA of B.values())
    nI(aA.e);
  B.clear();
}
function We(A, I, g, B) {
  (B & Xg) !== 0 && wg(A.v, I), (B & Pg) !== 0 ? wg(
    /** @type {Value<number>} */
    A.i,
    g
  ) : A.i = g;
}
function RB(A, I, g, B, C, i, e, E, Q, t, o) {
  var r = (Q & Xg) !== 0, l = (Q & IQ) === 0, s = r ? l ? /* @__PURE__ */ de(C, !1, !1) : fg(C) : C, a = (Q & Pg) === 0 ? e : fg(e), h = {
    i: a,
    v: s,
    k: i,
    a: null,
    // @ts-expect-error
    e: null,
    prev: g,
    next: B
  };
  try {
    if (A === null) {
      var D = document.createDocumentFragment();
      D.append(A = tI());
    }
    return h.e = pI(() => E(
      /** @type {Node} */
      A,
      s,
      a,
      t
    ), AA), h.e.prev = g && g.e, h.e.next = B && B.e, g === null ? o || (I.first = h) : (g.next = h, g.e.next = h.e), B !== null && (B.prev = h, B.e.prev = h.e), h;
  } finally {
  }
}
function EB(A, I, g) {
  for (var B = A.next ? (
    /** @type {TemplateNode} */
    A.next.e.nodes_start
  ) : g, C = I ? (
    /** @type {TemplateNode} */
    I.e.nodes_start
  ) : g, i = (
    /** @type {TemplateNode} */
    A.e.nodes_start
  ); i !== null && i !== B; ) {
    var e = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ aI(i)
    );
    C.before(i), i = e;
  }
}
function ZA(A, I, g) {
  I === null ? A.first = g : (I.next = g, I.e.next = g && g.e), g !== null && (g.prev = I, g.e.prev = I && I.e);
}
function TQ(A, I, g) {
  Ye(() => {
    var B = $I(() => I(A, g?.()) || {});
    if (g && B?.update) {
      var C = !1, i = (
        /** @type {any} */
        {}
      );
      me(() => {
        var e = g();
        FQ(e), C && Ce(i, e) && (i = e, B.update(e));
      }), C = !0;
    }
    if (B?.destroy)
      return () => (
        /** @type {Function} */
        B.destroy()
      );
  });
}
function SC(A, I = !1) {
  var g = I ? " !important;" : ";", B = "";
  for (var C in A) {
    var i = A[C];
    i != null && i !== "" && (B += " " + C + ": " + i + g);
  }
  return B;
}
function WQ(A, I) {
  if (I) {
    var g = "", B, C;
    return Array.isArray(I) ? (B = I[0], C = I[1]) : B = I, B && (g += SC(B)), C && (g += SC(C, !0)), g = g.trim(), g === "" ? null : g;
  }
  return String(A);
}
function tB(A, I = {}, g, B) {
  for (var C in g) {
    var i = g[C];
    I[C] !== i && (g[C] == null ? A.style.removeProperty(C) : A.style.setProperty(C, i, B));
  }
}
function W(A, I, g, B) {
  var C = A.__style;
  if (AA || C !== I) {
    var i = WQ(I, B);
    (!AA || i !== A.getAttribute("style")) && (i == null ? A.removeAttribute("style") : A.style.cssText = i), A.__style = I;
  } else B && (Array.isArray(B) ? (tB(A, g?.[0], B[0]), tB(A, g?.[1], B[1], "important")) : tB(A, g, B));
  return B;
}
const VQ = Symbol("is custom element"), OQ = Symbol("is html");
function U(A, I, g, B) {
  var C = XQ(A);
  AA && (C[I] = A.getAttribute(I), I === "src" || I === "srcset" || I === "href" && A.nodeName === "LINK") || C[I] !== (C[I] = g) && (I === "loading" && (A[pi] = g), g == null ? A.removeAttribute(I) : typeof g != "string" && PQ(A).includes(I) ? A[I] = g : A.setAttribute(I, g));
}
function XQ(A) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    A.__attributes ??= {
      [VQ]: A.nodeName.includes("-"),
      [OQ]: A.namespaceURI === EQ
    }
  );
}
var GC = /* @__PURE__ */ new Map();
function PQ(A) {
  var I = GC.get(A.nodeName);
  if (I) return I;
  GC.set(A.nodeName, I = []);
  for (var g, B = A, C = Element.prototype; C !== B; ) {
    g = Ie(B);
    for (var i in g)
      g[i].set && I.push(i);
    B = qB(B);
  }
  return I;
}
function RC(A, I) {
  return A === I || A?.[UI] === I;
}
function NB(A = {}, I, g, B) {
  return Ye(() => {
    var C, i;
    return me(() => {
      C = i, i = [], $I(() => {
        A !== g(...i) && (I(A, ...i), C && RC(g(...C), A) && I(null, ...C));
      });
    }), () => {
      OB(() => {
        i && RC(g(...i), A) && I(null, ...i);
      });
    };
  }), A;
}
let kg = !1;
function ZQ(A) {
  var I = kg;
  try {
    return kg = !1, [A(), kg];
  } finally {
    kg = I;
  }
}
function F(A, I, g, B) {
  var C = (g & CQ) !== 0, i = (g & eQ) !== 0, e = (
    /** @type {V} */
    B
  ), E = !0, Q = () => (E && (E = !1, e = i ? $I(
    /** @type {() => V} */
    B
  ) : (
    /** @type {V} */
    B
  )), e), t;
  if (C) {
    var o = UI in A || jC in A;
    t = VI(A, I)?.set ?? (o && I in A ? (y) => A[I] = y : void 0);
  }
  var r, l = !1;
  C ? [r, l] = ZQ(() => (
    /** @type {V} */
    A[I]
  )) : r = /** @type {V} */
  A[I], r === void 0 && B !== void 0 && (r = Q(), t && (Pi(), t(r)));
  var s;
  if (s = () => {
    var y = (
      /** @type {V} */
      A[I]
    );
    return y === void 0 ? Q() : (E = !0, y);
  }, (g & BQ) === 0)
    return s;
  if (t) {
    var a = A.$$legacy;
    return function(y, c) {
      return arguments.length > 0 ? ((!c || a || l) && t(c ? s() : y), y) : s();
    };
  }
  var h = !1, D = ((g & gQ) !== 0 ? zg : ce)(() => (h = !1, s()));
  C && n(D);
  var f = (
    /** @type {Effect} */
    T
  );
  return function(y, c) {
    if (arguments.length > 0) {
      const G = c ? n(D) : C ? RI(y) : y;
      return x(D, G), h = !0, e !== void 0 && (e = G), y;
    }
    return vI && h || (f.f & LI) !== 0 ? D.v : n(D);
  };
}
var zQ = /* @__PURE__ */ sI('<g><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect></g>');
function jQ(A, I) {
  wI(I, !0);
  let g = /* @__PURE__ */ k(() => I.pointLocation(I.value.xMin, I.value.yMin)), B = /* @__PURE__ */ k(() => I.pointLocation(I.value.xMax, I.value.yMax));
  const C = 8;
  function i(m) {
    return (CA) => {
      CA.stopPropagation(), CA.preventDefault(), I.preventHover(!0);
      let IA = [n(g).x, n(g).y, n(B).x, n(B).y], b = (O) => {
        O.preventDefault();
        let eA = O.pageX - CA.pageX, Z = O.pageY - CA.pageY, K = [eA, Z, eA, Z].map((EA, H) => IA[H] + EA * m[H]), aA = I.coordinateAtPoint(K[0], K[1]), z = I.coordinateAtPoint(K[2], K[3]);
        I.onChange({
          xMin: Math.min(aA.x, z.x),
          xMax: Math.max(aA.x, z.x),
          yMin: Math.min(aA.y, z.y),
          yMax: Math.max(aA.y, z.y)
        });
      }, QA = () => {
        I.preventHover(!1), window.removeEventListener("mousemove", b), window.removeEventListener("mouseup", QA);
      };
      window.addEventListener("mousemove", b), window.addEventListener("mouseup", QA);
    };
  }
  var e = zQ(), E = uA(e), Q = /* @__PURE__ */ k(() => i([1, 1, 1, 1]));
  E.__mousedown = function(...m) {
    n(Q)?.apply(this, m);
  }, W(E, "", {}, {
    stroke: "#fff",
    fill: "rgba(128,128,128,0.25)",
    cursor: "move"
  });
  var t = tA(E);
  U(t, "width", C);
  var o = /* @__PURE__ */ k(() => i([1, 0, 0, 0]));
  t.__mousedown = function(...m) {
    n(o)?.apply(this, m);
  }, W(t, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var r = tA(t);
  U(r, "width", C);
  var l = /* @__PURE__ */ k(() => i([0, 0, 1, 0]));
  r.__mousedown = function(...m) {
    n(l)?.apply(this, m);
  }, W(r, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var s = tA(r);
  U(s, "height", C);
  var a = /* @__PURE__ */ k(() => i([0, 1, 0, 0]));
  s.__mousedown = function(...m) {
    n(a)?.apply(this, m);
  }, W(s, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var h = tA(s);
  U(h, "height", C);
  var D = /* @__PURE__ */ k(() => i([0, 0, 0, 1]));
  h.__mousedown = function(...m) {
    n(D)?.apply(this, m);
  }, W(h, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var f = tA(h);
  U(f, "width", C), U(f, "height", C);
  var y = /* @__PURE__ */ k(() => i([1, 1, 0, 0]));
  f.__mousedown = function(...m) {
    n(y)?.apply(this, m);
  }, W(f, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var c = tA(f);
  U(c, "width", C), U(c, "height", C);
  var G = /* @__PURE__ */ k(() => i([1, 0, 0, 1]));
  c.__mousedown = function(...m) {
    n(G)?.apply(this, m);
  }, W(c, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var S = tA(c);
  U(S, "width", C), U(S, "height", C);
  var d = /* @__PURE__ */ k(() => i([0, 1, 1, 0]));
  S.__mousedown = function(...m) {
    n(d)?.apply(this, m);
  }, W(S, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var R = tA(S);
  U(R, "width", C), U(R, "height", C);
  var L = /* @__PURE__ */ k(() => i([0, 0, 1, 1]));
  R.__mousedown = function(...m) {
    n(L)?.apply(this, m);
  }, W(R, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  }), hA(e), KA(
    (m, CA, IA, b, QA, O, eA, Z, K, aA, z, EA) => {
      U(E, "x", m), U(E, "width", CA), U(E, "y", IA), U(E, "height", b), U(t, "x", n(g).x - C / 2), U(t, "y", QA), U(t, "height", O), U(r, "x", n(B).x - C / 2), U(r, "y", eA), U(r, "height", Z), U(s, "x", K), U(s, "width", aA), U(s, "y", n(g).y - C / 2), U(h, "x", z), U(h, "width", EA), U(h, "y", n(B).y - C / 2), U(f, "x", n(g).x - C / 2), U(f, "y", n(g).y - C / 2), U(c, "x", n(g).x - C / 2), U(c, "y", n(B).y - C / 2), U(S, "x", n(B).x - C / 2), U(S, "y", n(g).y - C / 2), U(R, "x", n(B).x - C / 2), U(R, "y", n(B).y - C / 2);
    },
    [
      () => Math.min(n(g).x, n(B).x),
      () => Math.abs(n(g).x - n(B).x),
      () => Math.min(n(g).y, n(B).y),
      () => Math.abs(n(g).y - n(B).y),
      () => Math.min(n(g).y, n(B).y),
      () => Math.abs(n(g).y - n(B).y),
      () => Math.min(n(g).y, n(B).y),
      () => Math.abs(n(g).y - n(B).y),
      () => Math.min(n(g).x, n(B).x),
      () => Math.abs(n(g).x - n(B).x),
      () => Math.min(n(g).x, n(B).x),
      () => Math.abs(n(g).x - n(B).x)
    ]
  ), nA(A, e), yI();
}
jB(["mousedown"]);
function $Q(A, I) {
  let g = !1, B, C, i, e = 300, E = 300, Q = async (o) => {
    g = !0;
    try {
      await A(o);
    } catch (r) {
      console.error(r);
    }
    if (g = !1, B !== void 0) {
      let r = B;
      B = void 0, t(r);
    }
  }, t = async (o) => {
    if (g) {
      B = o;
      return;
    }
    let r = (/* @__PURE__ */ new Date()).getTime();
    I() && (C = r);
    let l = !0;
    (C == null || r - C < E) && (l = !1), l ? (i && clearTimeout(i), i = setTimeout(() => Q(o), e)) : Q(o);
  };
  return t;
}
function oB(A) {
  return { shift: A.shiftKey, ctrl: A.ctrlKey, alt: A.altKey, meta: A.metaKey };
}
function AE(A, I) {
  let { zoom: g, click: B, drag: C, hover: i } = I, e = !1, E = !1, Q = null, t = B == null ? 0 : 5;
  return {
    wheel: (o) => {
      if (g == null)
        return;
      o.preventDefault();
      let r = A.getBoundingClientRect(), l = o.clientX - r.left, s = o.clientY - r.top, a = Math.exp(-o.deltaY / 200);
      g(a, { x: l, y: s }, oB(o));
    },
    mousedown: (o) => {
      o.preventDefault();
      let r = A.getBoundingClientRect(), l = o.clientX - r.left, s = o.clientY - r.top, a = !1, h = null;
      e = !0;
      let D = (y) => {
        y.preventDefault();
        let c = A.getBoundingClientRect(), G = y.clientX - c.left, S = y.clientY - c.top;
        a == !1 && C != null && (G - l) * (G - l) + (S - s) * (S - s) > t * t && (a = !0, h = C({ x: l, y: s }, oB(o))), a && h?.move != null && h.move({ x: G, y: S });
      }, f = () => {
        window.removeEventListener("mousemove", D), window.removeEventListener("mouseup", f), e = !1, a && h?.release != null && h.release(), a || B && B({ x: l, y: s }, oB(o));
      };
      window.addEventListener("mousemove", D), window.addEventListener("mouseup", f);
    },
    mousemove: (o) => {
      if (i == null || e || E)
        return;
      let r = A.getBoundingClientRect(), l = o.clientX - r.left, s = o.clientY - r.top;
      Q = { x: l, y: s }, i({ x: l, y: s });
    },
    mouseleave: () => {
      Q != null && i != null && (Q = null, i(null));
    },
    preventHover: (o) => {
      o != E && (o && Q != null && i != null && (Q = null, i(null)), E = o);
    }
  };
}
function IE(A, I) {
  let g = A.x - I.x, B = A.y - I.y;
  return Math.sqrt(g * g + B * B);
}
function gE(A) {
  return "M " + A.map(({ x: g, y: B }) => `${g},${B}`).join(" L ") + " Z";
}
function Ve(A) {
  let I = 1 / 0, g = -1 / 0, B = 1 / 0, C = -1 / 0;
  for (let { x: i, y: e } of A)
    I = Math.min(I, i), B = Math.min(B, e), g = Math.max(g, i), C = Math.max(C, e);
  return { xMin: I, yMin: B, xMax: g, yMax: C };
}
async function BE(A) {
  let I = JSON.stringify(A), g = new TextEncoder().encode(I), B = await crypto.subtle.digest("SHA-1", g);
  return Array.from(new Uint8Array(B)).map((e) => e.toString(16).padStart(2, "0")).join("");
}
function hI(A, I) {
  if (A === I)
    return !0;
  if (A === null || I === null || typeof A != "object" || typeof I != "object" || Object.keys(A).length !== Object.keys(I).length)
    return !1;
  for (let g in A)
    if (I.hasOwnProperty(g)) {
      if (!hI(A[g], I[g]))
        return !1;
    } else
      return !1;
  return !0;
}
var CE = /* @__PURE__ */ sI("<path></path>");
function eE(A, I) {
  wI(I, !0);
  let g = /* @__PURE__ */ k(() => I.value.map(({ x: C, y: i }) => I.pointLocation(C, i)));
  var B = CE();
  W(B, "", {}, { stroke: "#fff", fill: "rgba(128,128,128,0.25)" }), KA((C) => U(B, "d", C), [() => gE(n(g))]), nA(A, B), yI();
}
const iE = {
  marquee: "M7 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m1-.25c0 .414.336.75.75.75h6.5a.75.75 0 0 0 0-1.5h-6.5a.75.75 0 0 0-.75.75M4.75 8a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5A.75.75 0 0 0 4.75 8m14.5 0a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 0-.75-.75M8.75 20a.75.75 0 0 1 0-1.5h6.5a.75.75 0 0 1 0 1.5zM5 21a2 2 0 1 0 0-4a2 2 0 0 0 0 4M21 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-2 16a2 2 0 1 0 0-4a2 2 0 0 0 0 4",
  lasso: "M9.703 2.265A10 10 0 0 1 12 2c.79 0 1.559.092 2.297.265a.75.75 0 1 1-.343 1.46A8.5 8.5 0 0 0 12 3.5a8.6 8.6 0 0 0-1.954.225a.75.75 0 1 1-.343-1.46m-1.93 1.47a.75.75 0 0 1-.242 1.033a8.55 8.55 0 0 0-2.763 2.763a.75.75 0 1 1-1.275-.79a10.05 10.05 0 0 1 3.248-3.248a.75.75 0 0 1 1.032.243m8.454 0a.75.75 0 0 1 1.032-.242a10.05 10.05 0 0 1 3.248 3.248a.75.75 0 1 1-1.275.79a8.55 8.55 0 0 0-2.763-2.763a.75.75 0 0 1-.242-1.032m-13.06 5.41a.75.75 0 0 1 .558.901A8.5 8.5 0 0 0 3.5 12c0 .673.078 1.327.225 1.954a.75.75 0 1 1-1.46.343A10 10 0 0 1 2 12c0-.79.092-1.559.265-2.297a.75.75 0 0 1 .902-.559m17.666 0a.75.75 0 0 1 .902.558a10.1 10.1 0 0 1 0 4.595a.75.75 0 1 1-1.46-.343a8.54 8.54 0 0 0-.001-3.908a.75.75 0 0 1 .559-.902M3.736 16.226a.75.75 0 0 1 1.032.242a8.55 8.55 0 0 0 2.763 2.763a.75.75 0 0 1-.79 1.275a10.05 10.05 0 0 1-3.248-3.248a.75.75 0 0 1 .243-1.032m16.685.858a.75.75 0 1 0-1.342-.67l-.002.004l-.015.029l-.069.123a8 8 0 0 1-.289.466a9.6 9.6 0 0 1-.965 1.219c-1.17-1.073-2.756-2.006-4.74-2.006c-2.347 0-3.99 1.203-3.99 2.875S10.653 22 13 22c1.942 0 3.495-.75 4.658-1.645a11.7 11.7 0 0 1 1.315 2.01q.05.099.073.149l.017.035l.004.009a.75.75 0 0 0 1.368-.615c-.087-.183 0-.001 0-.001v-.002l-.003-.004l-.007-.015l-.024-.052l-.091-.184a13.2 13.2 0 0 0-1.538-2.337a11 11 0 0 0 1.525-2.032l.09-.162l.024-.047l.007-.014l.002-.005zM13 17.75c1.433 0 2.644.652 3.616 1.512c-.95.7-2.155 1.238-3.616 1.238c-1.973 0-2.49-.922-2.49-1.375s.517-1.375 2.49-1.375"
};
var QE = /* @__PURE__ */ sI('<svg width="24" height="24" viewBox="0 0 24 24"><path></path></svg>'), EE = /* @__PURE__ */ dI("<button><!></button>");
function NC(A, I) {
  let g = F(I, "active", 3, !1);
  var B = EE();
  B.__click = function(...E) {
    I.onClick?.apply(this, E);
  };
  let C;
  var i = uA(B);
  {
    var e = (E) => {
      var Q = QE();
      W(Q, "", {}, { width: "14px", height: "14px" });
      var t = uA(Q);
      W(t, "", {}, { fill: "currentColor" }), hA(Q), KA(() => U(t, "d", iE[I.icon])), nA(E, Q);
    };
    kA(i, (E) => {
      I.icon != null && E(e);
    });
  }
  hA(B), KA(
    (E) => {
      U(B, "title", I.title), C = W(B, "", C, E);
    },
    [
      () => ({
        border: "none",
        appearance: "none",
        background: g() ? "color-mix(in srgb, currentColor 20%, transparent)" : "none",
        "border-radius": "2px",
        height: "16px",
        width: "16px",
        padding: "0",
        margin: "0",
        "font-family": "inherit",
        "font-size": "1em",
        color: "currentColor",
        display: "flex",
        "flex-direction": "row",
        "align-items": "center",
        "justify-content": "center"
      })
    ]
  ), nA(A, B);
}
jB(["click"]);
var tE = /* @__PURE__ */ dI('<div><div> </div> <svg height="6px"><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line></svg></div>');
function oE(A, I) {
  function B(s, a) {
    let h = Math.log10(a * s), D = Math.round(h), f = [0.1, 0.2, 0.5, 1, 2, 5, 10], y = 0, c = 1e10;
    for (let G of f) {
      let S = Math.abs(Math.log10(G) + D - h);
      S < c && (y = G, c = S);
    }
    return y * Math.pow(10, D);
  }
  let C = /* @__PURE__ */ k(() => B(I.distancePerPoint, 30)), i = /* @__PURE__ */ k(() => n(C) / I.distancePerPoint);
  var e = tE();
  W(e, "", {}, { display: "flex", "align-items": "center" });
  var E = uA(e);
  W(E, "", {}, { "padding-right": "4px" });
  var Q = uA(E, !0);
  hA(E);
  var t = tA(E, 2), o = uA(t);
  U(o, "x1", 1), U(o, "y1", 3), U(o, "y2", 3), W(o, "", {}, {
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-cap": "butt"
  });
  var r = tA(o);
  U(r, "x1", 1), U(r, "x2", 1), U(r, "y1", 0), U(r, "y2", 6), W(r, "", {}, { stroke: "currentColor" });
  var l = tA(r);
  U(l, "y1", 0), U(l, "y2", 6), W(l, "", {}, { stroke: "currentColor" }), hA(t), hA(e), KA(
    (s) => {
      hg(Q, s), U(t, "width", `${n(i) + 2}px`), U(o, "x2", n(i) + 1), U(l, "x1", n(i) + 1), U(l, "x2", n(i) + 1);
    },
    [() => n(C).toLocaleString()]
  ), nA(A, e);
}
var nE = /* @__PURE__ */ dI("<div> </div>"), rE = /* @__PURE__ */ dI('<a target="_blank"> </a> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div>', 1), aE = /* @__PURE__ */ dI('<div><div><!></div> <div></div> <div><!> <!> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <span> </span></div></div>');
function sE(A, I) {
  wI(I, !0);
  let g = F(I, "statusMessage", 3, null);
  var B = aE();
  let C;
  var i = uA(B);
  let e;
  var E = uA(i);
  {
    var Q = (c) => {
      var G = nE();
      W(G, "", {}, { display: "inline-block" });
      var S = uA(G, !0);
      hA(G), KA(() => hg(S, g())), nA(c, G);
    };
    kA(E, (c) => {
      g() != null && c(Q);
    });
  }
  hA(i);
  var t = tA(i, 2);
  W(t, "", {}, { flex: "1 1 0%" });
  var o = tA(t, 2);
  let r;
  var l = uA(o);
  {
    var s = (c) => {
      var G = rE(), S = TI(G);
      W(S, "", {}, { color: "currentColor", "text-decoration": "underline" });
      var d = uA(S, !0);
      hA(S), tQ(2), KA(() => {
        U(S, "href", I.resolvedTheme.brandingLink.href), hg(d, I.resolvedTheme.brandingLink.text);
      }), nA(c, G);
    };
    kA(l, (c) => {
      I.resolvedTheme.brandingLink != null && c(s);
    });
  }
  var a = tA(l, 2);
  {
    let c = /* @__PURE__ */ k(() => I.selectionMode == "marquee");
    NC(a, {
      icon: "marquee",
      get active() {
        return n(c);
      },
      title: "Toggle rectangle selection mode. In normal mode, use shift + drag for rectangle selection.",
      onClick: () => I.onSelectionMode(I.selectionMode == "marquee" ? "none" : "marquee")
    });
  }
  var h = tA(a, 2);
  {
    let c = /* @__PURE__ */ k(() => I.selectionMode == "lasso");
    NC(h, {
      icon: "lasso",
      get active() {
        return n(c);
      },
      title: "Toggle lasso selection mode. In normal mode, use shift + meta + drag for lasso selection.",
      onClick: () => I.onSelectionMode(I.selectionMode == "lasso" ? "none" : "lasso")
    });
  }
  var D = tA(h, 4);
  oE(D, {
    get distancePerPoint() {
      return I.distancePerPoint;
    }
  });
  var f = tA(D, 4), y = uA(f);
  hA(f), hA(o), hA(B), KA(
    (c, G, S, d) => {
      C = W(B, "", C, c), e = W(i, "", e, G), r = W(o, "", r, S), hg(y, `${d ?? ""} points`);
    },
    [
      () => ({
        "font-size": "12px",
        "line-height": "20px",
        height: "20px",
        color: I.resolvedTheme.statusBarTextColor,
        position: "absolute",
        bottom: "0px",
        left: "0px",
        right: "0px",
        "user-select": "none",
        "font-family": I.resolvedTheme.fontFamily,
        display: "flex",
        "flex-direction": "row"
      }),
      () => ({
        flex: "none",
        display: "flex",
        "flex-direction": "row",
        gap: "4px",
        padding: "0px 4px",
        "border-radius": "2px",
        background: I.resolvedTheme.statusBarBackgroundColor
      }),
      () => ({
        flex: "none",
        display: "flex",
        "flex-direction": "row",
        "align-items": "center",
        gap: "4px",
        padding: "0px 4px",
        "border-radius": "2px",
        background: I.resolvedTheme.statusBarBackgroundColor
      }),
      () => I.pointCount.toLocaleString()
    ]
  ), nA(A, B), yI();
}
function lE(A) {
  return (I, g) => {
    let B = new A(I, g);
    return {
      ...B.update ? { update: B.update.bind(B) } : {},
      ...B.destroy ? { destroy: B.destroy.bind(B) } : {}
    };
  };
}
let nB = /* @__PURE__ */ new WeakMap();
function Oe(A) {
  let I = typeof A == "function" ? A : A.class;
  if (nB.has(I))
    return nB.get(I);
  {
    let g = lE(I);
    return nB.set(I, g), g;
  }
}
function Xe(A, I) {
  return typeof A == "function" ? I : { ...A.props ?? {}, ...I };
}
var hE = /* @__PURE__ */ dI("<div><div></div></div>");
function cE(A, I) {
  wI(I, !0);
  let g = F(I, "margin", 3, 4), B, C, i = /* @__PURE__ */ k(() => Oe(I.customTooltip)), e = /* @__PURE__ */ k(() => Xe(I.customTooltip, { tooltip: I.tooltip }));
  $B(() => {
    _g(() => {
      let t = n(i), o = null;
      return _g(() => {
        C.style.left = "0px", C.style.top = "0px", C.style.pointerEvents = I.allowInteraction ? "all" : "none", o == null ? o = t(C, n(e)) : o.update?.(n(e));
        function r(D, f, y, c) {
          let G = I.location.x, S = I.location.y, d = 2, R = D / 2, L = f + (I.targetHeight + g());
          G - R < y && (R = G - y), G - R > c - D && (R = G - c + D), S - L < d && (L = -(I.targetHeight + g())), C.style.left = G - R + "px", C.style.top = S - L + "px";
        }
        let l = B.getBoundingClientRect(), { width: s, height: a } = C.getBoundingClientRect();
        r(s, a, 2, l.width - 2);
        let h = requestAnimationFrame(() => {
          h = null;
          let D = C.getBoundingClientRect();
          (D.width != s || D.height != a) && r(D.width, D.height, 2, l.width - 2);
        });
        return () => {
          h != null && cancelAnimationFrame(h);
        };
      }), () => {
        o?.destroy?.(), C.replaceChildren();
      };
    });
  });
  var E = hE();
  W(E, "", {}, { position: "absolute", width: "100%" });
  var Q = uA(E);
  W(Q, "", {}, {
    display: "flex",
    position: "absolute",
    width: "fit-content",
    height: "fit-content",
    "z-index": "100"
  }), NB(Q, (t) => C = t, () => C), hA(E), NB(E, (t) => B = t, () => B), nA(A, E), yI();
}
function AC(A, I, g) {
  A.prototype = I.prototype = g, g.constructor = A;
}
function Pe(A, I) {
  var g = Object.create(A.prototype);
  for (var B in I) g[B] = I[B];
  return g;
}
function Rg() {
}
var dg = 0.7, Tg = 1 / dg, PI = "\\s*([+-]?\\d+)\\s*", Fg = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", jA = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", DE = /^#([0-9a-f]{3,8})$/, uE = new RegExp(`^rgb\\(${PI},${PI},${PI}\\)$`), fE = new RegExp(`^rgb\\(${jA},${jA},${jA}\\)$`), wE = new RegExp(`^rgba\\(${PI},${PI},${PI},${Fg}\\)$`), yE = new RegExp(`^rgba\\(${jA},${jA},${jA},${Fg}\\)$`), dE = new RegExp(`^hsl\\(${Fg},${jA},${jA}\\)$`), FE = new RegExp(`^hsla\\(${Fg},${jA},${jA},${Fg}\\)$`), MC = {
  aliceblue: 15792383,
  antiquewhite: 16444375,
  aqua: 65535,
  aquamarine: 8388564,
  azure: 15794175,
  beige: 16119260,
  bisque: 16770244,
  black: 0,
  blanchedalmond: 16772045,
  blue: 255,
  blueviolet: 9055202,
  brown: 10824234,
  burlywood: 14596231,
  cadetblue: 6266528,
  chartreuse: 8388352,
  chocolate: 13789470,
  coral: 16744272,
  cornflowerblue: 6591981,
  cornsilk: 16775388,
  crimson: 14423100,
  cyan: 65535,
  darkblue: 139,
  darkcyan: 35723,
  darkgoldenrod: 12092939,
  darkgray: 11119017,
  darkgreen: 25600,
  darkgrey: 11119017,
  darkkhaki: 12433259,
  darkmagenta: 9109643,
  darkolivegreen: 5597999,
  darkorange: 16747520,
  darkorchid: 10040012,
  darkred: 9109504,
  darksalmon: 15308410,
  darkseagreen: 9419919,
  darkslateblue: 4734347,
  darkslategray: 3100495,
  darkslategrey: 3100495,
  darkturquoise: 52945,
  darkviolet: 9699539,
  deeppink: 16716947,
  deepskyblue: 49151,
  dimgray: 6908265,
  dimgrey: 6908265,
  dodgerblue: 2003199,
  firebrick: 11674146,
  floralwhite: 16775920,
  forestgreen: 2263842,
  fuchsia: 16711935,
  gainsboro: 14474460,
  ghostwhite: 16316671,
  gold: 16766720,
  goldenrod: 14329120,
  gray: 8421504,
  green: 32768,
  greenyellow: 11403055,
  grey: 8421504,
  honeydew: 15794160,
  hotpink: 16738740,
  indianred: 13458524,
  indigo: 4915330,
  ivory: 16777200,
  khaki: 15787660,
  lavender: 15132410,
  lavenderblush: 16773365,
  lawngreen: 8190976,
  lemonchiffon: 16775885,
  lightblue: 11393254,
  lightcoral: 15761536,
  lightcyan: 14745599,
  lightgoldenrodyellow: 16448210,
  lightgray: 13882323,
  lightgreen: 9498256,
  lightgrey: 13882323,
  lightpink: 16758465,
  lightsalmon: 16752762,
  lightseagreen: 2142890,
  lightskyblue: 8900346,
  lightslategray: 7833753,
  lightslategrey: 7833753,
  lightsteelblue: 11584734,
  lightyellow: 16777184,
  lime: 65280,
  limegreen: 3329330,
  linen: 16445670,
  magenta: 16711935,
  maroon: 8388608,
  mediumaquamarine: 6737322,
  mediumblue: 205,
  mediumorchid: 12211667,
  mediumpurple: 9662683,
  mediumseagreen: 3978097,
  mediumslateblue: 8087790,
  mediumspringgreen: 64154,
  mediumturquoise: 4772300,
  mediumvioletred: 13047173,
  midnightblue: 1644912,
  mintcream: 16121850,
  mistyrose: 16770273,
  moccasin: 16770229,
  navajowhite: 16768685,
  navy: 128,
  oldlace: 16643558,
  olive: 8421376,
  olivedrab: 7048739,
  orange: 16753920,
  orangered: 16729344,
  orchid: 14315734,
  palegoldenrod: 15657130,
  palegreen: 10025880,
  paleturquoise: 11529966,
  palevioletred: 14381203,
  papayawhip: 16773077,
  peachpuff: 16767673,
  peru: 13468991,
  pink: 16761035,
  plum: 14524637,
  powderblue: 11591910,
  purple: 8388736,
  rebeccapurple: 6697881,
  red: 16711680,
  rosybrown: 12357519,
  royalblue: 4286945,
  saddlebrown: 9127187,
  salmon: 16416882,
  sandybrown: 16032864,
  seagreen: 3050327,
  seashell: 16774638,
  sienna: 10506797,
  silver: 12632256,
  skyblue: 8900331,
  slateblue: 6970061,
  slategray: 7372944,
  slategrey: 7372944,
  snow: 16775930,
  springgreen: 65407,
  steelblue: 4620980,
  tan: 13808780,
  teal: 32896,
  thistle: 14204888,
  tomato: 16737095,
  turquoise: 4251856,
  violet: 15631086,
  wheat: 16113331,
  white: 16777215,
  whitesmoke: 16119285,
  yellow: 16776960,
  yellowgreen: 10145074
};
AC(Rg, IC, {
  copy(A) {
    return Object.assign(new this.constructor(), this, A);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: UC,
  // Deprecated! Use color.formatHex.
  formatHex: UC,
  formatHex8: SE,
  formatHsl: GE,
  formatRgb: kC,
  toString: kC
});
function UC() {
  return this.rgb().formatHex();
}
function SE() {
  return this.rgb().formatHex8();
}
function GE() {
  return ze(this).formatHsl();
}
function kC() {
  return this.rgb().formatRgb();
}
function IC(A) {
  var I, g;
  return A = (A + "").trim().toLowerCase(), (I = DE.exec(A)) ? (g = I[1].length, I = parseInt(I[1], 16), g === 6 ? JC(I) : g === 3 ? new JA(I >> 8 & 15 | I >> 4 & 240, I >> 4 & 15 | I & 240, (I & 15) << 4 | I & 15, 1) : g === 8 ? Jg(I >> 24 & 255, I >> 16 & 255, I >> 8 & 255, (I & 255) / 255) : g === 4 ? Jg(I >> 12 & 15 | I >> 8 & 240, I >> 8 & 15 | I >> 4 & 240, I >> 4 & 15 | I & 240, ((I & 15) << 4 | I & 15) / 255) : null) : (I = uE.exec(A)) ? new JA(I[1], I[2], I[3], 1) : (I = fE.exec(A)) ? new JA(I[1] * 255 / 100, I[2] * 255 / 100, I[3] * 255 / 100, 1) : (I = wE.exec(A)) ? Jg(I[1], I[2], I[3], I[4]) : (I = yE.exec(A)) ? Jg(I[1] * 255 / 100, I[2] * 255 / 100, I[3] * 255 / 100, I[4]) : (I = dE.exec(A)) ? KC(I[1], I[2] / 100, I[3] / 100, 1) : (I = FE.exec(A)) ? KC(I[1], I[2] / 100, I[3] / 100, I[4]) : MC.hasOwnProperty(A) ? JC(MC[A]) : A === "transparent" ? new JA(NaN, NaN, NaN, 0) : null;
}
function JC(A) {
  return new JA(A >> 16 & 255, A >> 8 & 255, A & 255, 1);
}
function Jg(A, I, g, B) {
  return B <= 0 && (A = I = g = NaN), new JA(A, I, g, B);
}
function RE(A) {
  return A instanceof Rg || (A = IC(A)), A ? (A = A.rgb(), new JA(A.r, A.g, A.b, A.opacity)) : new JA();
}
function Ze(A, I, g, B) {
  return arguments.length === 1 ? RE(A) : new JA(A, I, g, B ?? 1);
}
function JA(A, I, g, B) {
  this.r = +A, this.g = +I, this.b = +g, this.opacity = +B;
}
AC(JA, Ze, Pe(Rg, {
  brighter(A) {
    return A = A == null ? Tg : Math.pow(Tg, A), new JA(this.r * A, this.g * A, this.b * A, this.opacity);
  },
  darker(A) {
    return A = A == null ? dg : Math.pow(dg, A), new JA(this.r * A, this.g * A, this.b * A, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new JA(YI(this.r), YI(this.g), YI(this.b), Wg(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: YC,
  // Deprecated! Use color.formatHex.
  formatHex: YC,
  formatHex8: NE,
  formatRgb: mC,
  toString: mC
}));
function YC() {
  return `#${NI(this.r)}${NI(this.g)}${NI(this.b)}`;
}
function NE() {
  return `#${NI(this.r)}${NI(this.g)}${NI(this.b)}${NI((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function mC() {
  const A = Wg(this.opacity);
  return `${A === 1 ? "rgb(" : "rgba("}${YI(this.r)}, ${YI(this.g)}, ${YI(this.b)}${A === 1 ? ")" : `, ${A})`}`;
}
function Wg(A) {
  return isNaN(A) ? 1 : Math.max(0, Math.min(1, A));
}
function YI(A) {
  return Math.max(0, Math.min(255, Math.round(A) || 0));
}
function NI(A) {
  return A = YI(A), (A < 16 ? "0" : "") + A.toString(16);
}
function KC(A, I, g, B) {
  return B <= 0 ? A = I = g = NaN : g <= 0 || g >= 1 ? A = I = NaN : I <= 0 && (A = NaN), new WA(A, I, g, B);
}
function ze(A) {
  if (A instanceof WA) return new WA(A.h, A.s, A.l, A.opacity);
  if (A instanceof Rg || (A = IC(A)), !A) return new WA();
  if (A instanceof WA) return A;
  A = A.rgb();
  var I = A.r / 255, g = A.g / 255, B = A.b / 255, C = Math.min(I, g, B), i = Math.max(I, g, B), e = NaN, E = i - C, Q = (i + C) / 2;
  return E ? (I === i ? e = (g - B) / E + (g < B) * 6 : g === i ? e = (B - I) / E + 2 : e = (I - g) / E + 4, E /= Q < 0.5 ? i + C : 2 - i - C, e *= 60) : E = Q > 0 && Q < 1 ? 0 : e, new WA(e, E, Q, A.opacity);
}
function ME(A, I, g, B) {
  return arguments.length === 1 ? ze(A) : new WA(A, I, g, B ?? 1);
}
function WA(A, I, g, B) {
  this.h = +A, this.s = +I, this.l = +g, this.opacity = +B;
}
AC(WA, ME, Pe(Rg, {
  brighter(A) {
    return A = A == null ? Tg : Math.pow(Tg, A), new WA(this.h, this.s, this.l * A, this.opacity);
  },
  darker(A) {
    return A = A == null ? dg : Math.pow(dg, A), new WA(this.h, this.s, this.l * A, this.opacity);
  },
  rgb() {
    var A = this.h % 360 + (this.h < 0) * 360, I = isNaN(A) || isNaN(this.s) ? 0 : this.s, g = this.l, B = g + (g < 0.5 ? g : 1 - g) * I, C = 2 * g - B;
    return new JA(
      rB(A >= 240 ? A - 240 : A + 120, C, B),
      rB(A, C, B),
      rB(A < 120 ? A + 240 : A - 120, C, B),
      this.opacity
    );
  },
  clamp() {
    return new WA(pC(this.h), Yg(this.s), Yg(this.l), Wg(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const A = Wg(this.opacity);
    return `${A === 1 ? "hsl(" : "hsla("}${pC(this.h)}, ${Yg(this.s) * 100}%, ${Yg(this.l) * 100}%${A === 1 ? ")" : `, ${A})`}`;
  }
}));
function pC(A) {
  return A = (A || 0) % 360, A < 0 ? A + 360 : A;
}
function Yg(A) {
  return Math.max(0, Math.min(1, A || 0));
}
function rB(A, I, g) {
  return (A < 60 ? I + (g - I) * A / 60 : A < 180 ? g : A < 240 ? I + (g - I) * (240 - A) / 60 : I) * 255;
}
const xC = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf"
], mg = [
  "#1f77b4",
  "#aec7e8",
  "#ff7f0e",
  "#ffbb78",
  "#2ca02c",
  "#98df8a",
  "#d62728",
  "#ff9896",
  "#9467bd",
  "#c5b0d5",
  "#8c564b",
  "#c49c94",
  "#e377c2",
  "#f7b6d2",
  "#7f7f7f",
  "#c7c7c7",
  "#bcbd22",
  "#dbdb8d",
  "#17becf",
  "#9edae5"
];
function IB(A) {
  if (A < 1 && (A = 1), A <= xC.length)
    return xC.slice(0, A);
  if (A <= mg.length)
    return mg.slice(0, A);
  {
    let I = [];
    for (let g = 0; g < A; g++)
      I[g] = mg[g % mg.length];
    return I;
  }
}
function gC(A) {
  let { r: I, g, b: B, opacity: C } = Ze(A);
  return { r: I / 255, g: g / 255, b: B / 255, a: C };
}
let ig;
function UE() {
  return ig == null && (ig = document.createElement("canvas"), ig.width = 1, ig.height = 1), ig.getContext("2d");
}
function kE(A) {
  let I = UE();
  I.font = `${A.fontSize ?? 10}px ${A.fontFamily ?? "system-ui"}`;
  let g = A.text.split(`
`).map((e) => I.measureText(e).width), C = (A.fontSize ?? 10) * (A.lineSpacing ?? 1) * g.length;
  return {
    width: g.reduce((e, E) => Math.max(e, E)),
    height: C
  };
}
function je() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
function BC(A, I) {
  return [
    A[0] * I[0] + A[3] * I[1] + A[6] * I[2],
    A[1] * I[0] + A[4] * I[1] + A[7] * I[2],
    A[2] * I[0] + A[5] * I[1] + A[8] * I[2],
    A[0] * I[3] + A[3] * I[4] + A[6] * I[5],
    A[1] * I[3] + A[4] * I[4] + A[7] * I[5],
    A[2] * I[3] + A[5] * I[4] + A[8] * I[5],
    A[0] * I[6] + A[3] * I[7] + A[6] * I[8],
    A[1] * I[6] + A[4] * I[7] + A[7] * I[8],
    A[2] * I[6] + A[5] * I[7] + A[8] * I[8]
  ];
}
function $e(A, I) {
  return [
    I[0] * A[0] + I[3] * A[1] + I[6] * A[2],
    I[1] * A[0] + I[4] * A[1] + I[7] * A[2],
    I[2] * A[0] + I[5] * A[1] + I[8] * A[2]
  ];
}
function JE(A) {
  return A[0] * A[4] * A[8] - A[0] * A[5] * A[7] - A[1] * A[3] * A[8] + A[1] * A[5] * A[6] + A[2] * A[3] * A[7] - A[2] * A[4] * A[6];
}
function Ai(A) {
  let I = JE(A);
  return [
    (A[4] * A[8] - A[5] * A[7]) / I,
    (A[2] * A[7] - A[1] * A[8]) / I,
    (A[1] * A[5] - A[2] * A[4]) / I,
    (A[5] * A[6] - A[3] * A[8]) / I,
    (A[0] * A[8] - A[2] * A[6]) / I,
    (A[2] * A[3] - A[0] * A[5]) / I,
    (A[3] * A[7] - A[4] * A[6]) / I,
    (A[1] * A[6] - A[0] * A[7]) / I,
    (A[0] * A[4] - A[1] * A[3]) / I
  ];
}
class Vg {
  viewport;
  width;
  height;
  _matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  _pixel_kx = 0;
  _pixel_bx = 0;
  _pixel_ky = 0;
  _pixel_by = 0;
  constructor(I, g, B) {
    this.viewport = I, this.width = g, this.height = B, this.updateCoefficients();
  }
  update(I, g, B) {
    this.viewport = I, this.width = g, this.height = B, this.updateCoefficients();
  }
  updateCoefficients() {
    let { x: I, y: g, scale: B } = this.viewport, C = B, i = B;
    this.width < this.height ? C *= this.height / this.width : i *= this.width / this.height, this._matrix = [C, 0, 0, 0, i, 0, -I * C, -g * i, 1], this._pixel_kx = this._matrix[0] * this.width / 2, this._pixel_bx = (this._matrix[6] + 1) * this.width / 2, this._pixel_ky = -this._matrix[4] * this.height / 2, this._pixel_by = (-this._matrix[7] + 1) * this.height / 2;
  }
  matrix() {
    return this._matrix;
  }
  pixelLocation(I, g) {
    return { x: I * this._pixel_kx + this._pixel_bx, y: g * this._pixel_ky + this._pixel_by };
  }
  coordinateAtPixel(I, g) {
    return { x: (I - this._pixel_bx) / this._pixel_kx, y: (g - this._pixel_by) / this._pixel_ky };
  }
  pixelLocationFunction() {
    let I = this._pixel_kx, g = this._pixel_ky, B = this._pixel_bx, C = this._pixel_by;
    return (i, e) => ({ x: i * I + B, y: e * g + C });
  }
  coordinateAtPixelFunction() {
    let I = this._pixel_kx, g = this._pixel_ky, B = this._pixel_bx, C = this._pixel_by;
    return (i, e) => ({ x: (i - B) / I, y: (e - C) / g });
  }
}
class MB {
  _needsRun = !0;
  _inputs = /* @__PURE__ */ new Set();
  _targets = /* @__PURE__ */ new Set();
  constructor(I = []) {
    this._inputs = new Set(I);
    for (let g of this._inputs)
      g._targets.add(this);
  }
  addInput(I) {
    this._inputs.add(I), I._targets.add(this);
  }
  removeInput(I) {
    I._targets.delete(this), this._inputs.delete(I);
  }
  run() {
    if (this._needsRun) {
      for (let I of this._inputs)
        I.run();
      this.update(), this._needsRun = !1;
    }
  }
  setNeedsRunDownstream() {
    for (let I of this._targets)
      I._needsRun || (I._needsRun = !0, I.setNeedsRunDownstream());
  }
  update() {
  }
  destroy() {
    for (let I of this._inputs)
      I._targets.delete(this);
  }
}
let Ag = class extends MB {
  _value = null;
  setValue(I) {
    this._value !== I && (this._value = I, this.setNeedsRunDownstream());
  }
  get value() {
    return this.run(), this._value;
  }
};
class Ii extends Ag {
  constructor(I) {
    super([]), this.setValue(I);
  }
  get value() {
    return super.value;
  }
  set value(I) {
    this.setValue(I);
  }
}
class YE extends Ag {
  fn;
  constructor(I, g) {
    super(g), this.fn = I;
  }
  update() {
    this.setValue(this.fn());
  }
}
class mE extends Ag {
  fn;
  state;
  constructor(I, g) {
    super(g), this.fn = I, this.state = {};
  }
  update() {
    this.setValue(this.fn(this.state));
  }
  destroy() {
    super.destroy(), this.state.destroy && this.state.destroy(), this.state = {};
  }
}
class KE extends Ag {
  parent;
  condition;
  buildTrue;
  buildFalse;
  context = null;
  currentCondition = null;
  currentNode = null;
  constructor(I, g, B, C) {
    super([g]), this.parent = I, this.condition = g, this.buildTrue = B, this.buildFalse = C;
  }
  update() {
    (this.currentNode == null || this.currentCondition !== this.condition.value) && (this.currentNode && this.removeInput(this.currentNode), this.context?.destroy(), this.context = new HI(this.parent), this.currentCondition = this.condition.value, this.currentCondition ? this.currentNode = this.buildTrue(this.context) : this.currentNode = this.buildFalse(this.context), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.context?.destroy();
  }
}
class pE extends Ag {
  parent;
  input;
  build;
  cache;
  constructor(I, g, B) {
    super([g]), this.parent = I, this.input = g, this.build = B, this.cache = /* @__PURE__ */ new Map();
  }
  update() {
    let I = /* @__PURE__ */ new Set(), g = this.input.value.map((B) => {
      if (I.add(B), this.cache.has(B)) {
        let C = this.cache.get(B);
        return C.input.value = B, C.output.value;
      } else {
        let C = new HI(this.parent), i = new Ii(B), e = this.build(C, i);
        return this.cache.set(B, { context: C, input: i, output: e }), this.addInput(e), e.value;
      }
    });
    for (let [B, C] of this.cache)
      I.has(B) || (this.cache.delete(B), this.removeInput(C.output), C.context.destroy());
    this.setValue(g);
  }
  destroy() {
    super.destroy();
    for (let I of this.cache.values())
      I.context.destroy();
  }
}
class xE extends Ag {
  parent;
  input;
  cases;
  currentCase = null;
  currentNode = null;
  currentContext = null;
  constructor(I, g, B) {
    super([g]), this.parent = I, this.input = g, this.cases = B;
  }
  update() {
    (this.currentNode == null || this.input.value !== this.currentCase) && (this.currentNode && this.removeInput(this.currentNode), this.currentContext?.destroy(), this.currentContext = new HI(this.parent), this.currentCase = this.input.value, this.currentNode = this.cases[this.currentCase](this.currentContext), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.currentContext?.destroy();
  }
}
class HI {
  _children;
  _nodes;
  /** Creates a new dataflow context. */
  constructor(I = null) {
    this._children = /* @__PURE__ */ new Set(), this._nodes = /* @__PURE__ */ new Set(), I?._children.add(this);
  }
  /** Destroy the dataflow and all associated states. */
  destroy() {
    for (let I of this._children)
      I.destroy();
    for (let I of this._nodes)
      I.destroy();
    this._children.clear(), this._nodes.clear();
  }
  /** Creates a value node. */
  value(I) {
    let g = new Ii(I);
    return this._nodes.add(g), g;
  }
  /** Creates a derived value. */
  derive(I, g) {
    let B = I.map((i) => i instanceof MB ? i : this.value(i)), C = new YE(() => g(...B.map((i) => i.value)), B);
    return this._nodes.add(C), C;
  }
  /** Creates a stateful derived value. */
  statefulDerive(I, g) {
    let B = I.map((i) => i instanceof MB ? i : this.value(i)), C = new mE((i) => g(i, ...B.map((e) => e.value)), B);
    return this._nodes.add(C), C;
  }
  /** Creates a true or false dataflow depending on the value of the condition. */
  if(I, g, B) {
    let C = new KE(this, I, g, B);
    return this._nodes.add(C), C;
  }
  switch(I, g) {
    let B = new xE(this, I, g);
    return this._nodes.add(B), B;
  }
  map(I, g) {
    let B = new pE(this, I, g);
    return this._nodes.add(B), B;
  }
  assertNotNull(I) {
    return I;
  }
  subgraph() {
    return new HI(this);
  }
}
function II(A, I, g, B) {
  if (A.program == null || A.vsSource != g || A.fsSource != B) {
    A.destroy && A.destroy();
    let i = LC(I, I.VERTEX_SHADER, g), e = LC(I, I.FRAGMENT_SHADER, B), E = I.createProgram();
    if (I.attachShader(E, i), I.attachShader(E, e), I.linkProgram(E), !I.getProgramParameter(E, I.LINK_STATUS)) {
      var C = I.getProgramInfoLog(E);
      throw new Error(`failed to link program: ${C}, vertex source: ${g}, fragment source: ${B}`);
    }
    A.program = E, A.vsSource = g, A.fsSource = B, A.destroy = () => {
      I.deleteProgram(E), I.deleteShader(i), I.deleteShader(e);
    }, A.uniforms = {};
    for (let t of (g + B).matchAll(/uniform +[0-9a-zA-Z_]+ +([0-9a-zA-Z_]+) *(;|\[)/g)) {
      let o = t[1];
      A.uniforms[o] = I.getUniformLocation(E, o);
    }
  }
  return { program: A.program, uniforms: A.uniforms ?? {} };
}
function LC(A, I, g) {
  let B = A.createShader(I);
  if (A.shaderSource(B, g), A.compileShader(B), !A.getShaderParameter(B, A.COMPILE_STATUS)) {
    var i = A.getShaderInfoLog(B);
    throw new Error(`failed to compile shader: ${i}, source: ${g}`);
  }
  return B;
}
function $A(A, I, g, B) {
  if (A.buffer == null) {
    let C = I.createBuffer();
    A.buffer = C, A.destroy = () => {
      I.deleteBuffer(C);
    };
  }
  if (A.data !== g) {
    if (A.data = g, I.bindBuffer(I.ARRAY_BUFFER, A.buffer), g instanceof Array)
      switch (B ?? "f32") {
        case "f32":
          I.bufferData(I.ARRAY_BUFFER, new Float32Array(g), I.STATIC_DRAW);
          break;
        case "i32":
          I.bufferData(I.ARRAY_BUFFER, new Int32Array(g), I.STATIC_DRAW);
          break;
        case "u32":
          I.bufferData(I.ARRAY_BUFFER, new Uint32Array(g), I.STATIC_DRAW);
          break;
        case "i16":
          I.bufferData(I.ARRAY_BUFFER, new Int16Array(g), I.STATIC_DRAW);
          break;
        case "u16":
          I.bufferData(I.ARRAY_BUFFER, new Uint16Array(g), I.STATIC_DRAW);
          break;
        case "i8":
          I.bufferData(I.ARRAY_BUFFER, new Int8Array(g), I.STATIC_DRAW);
          break;
        case "u8":
          I.bufferData(I.ARRAY_BUFFER, new Uint8Array(g), I.STATIC_DRAW);
          break;
        default:
          throw new Error("invalid type");
      }
    else
      I.bufferData(I.ARRAY_BUFFER, g, I.STATIC_DRAW);
    I.bindBuffer(I.ARRAY_BUFFER, null);
  }
  return A.buffer;
}
function LE(A, I, g, B, C) {
  const i = {
    u8: {
      1: [A.R8, A.RED, A.UNSIGNED_BYTE],
      2: [A.RG8, A.RG, A.UNSIGNED_BYTE],
      3: [A.RGB8, A.RGB, A.UNSIGNED_BYTE],
      4: [A.RGBA8, A.RGBA, A.UNSIGNED_BYTE]
    },
    u16: {
      1: [A.R8, A.RED, A.UNSIGNED_SHORT],
      2: [A.RG8, A.RG, A.UNSIGNED_SHORT],
      3: [A.RGB8, A.RGB, A.UNSIGNED_SHORT],
      4: [A.RGBA8, A.RGBA, A.UNSIGNED_SHORT]
    },
    u32: {
      1: [A.R8, A.RED, A.UNSIGNED_INT],
      2: [A.RG8, A.RG, A.UNSIGNED_INT],
      3: [A.RGB8, A.RGB, A.UNSIGNED_INT],
      4: [A.RGBA8, A.RGBA, A.UNSIGNED_INT]
    },
    f32: {
      1: [A.R32F, A.RED, A.FLOAT],
      2: [A.RG32F, A.RG, A.FLOAT],
      3: [A.RGB32F, A.RGB, A.FLOAT],
      4: [A.RGBA32F, A.RGBA, A.FLOAT]
    }
  };
  let [e, E, Q] = i[C][B];
  A.texImage2D(A.TEXTURE_2D, 0, e, I, g, 0, E, Q, null), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_MIN_FILTER, A.LINEAR), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_MAG_FILTER, A.LINEAR), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_WRAP_S, A.CLAMP_TO_EDGE), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_WRAP_T, A.CLAMP_TO_EDGE);
}
function cI(A, I, g, B, C, i) {
  if (A.framebuffer == null || A.texture == null) {
    let E = I.createFramebuffer(), Q = I.createTexture();
    I.bindFramebuffer(I.FRAMEBUFFER, E), I.bindTexture(I.TEXTURE_2D, Q), I.framebufferTexture2D(I.FRAMEBUFFER, I.COLOR_ATTACHMENT0, I.TEXTURE_2D, Q, 0), I.bindTexture(I.TEXTURE_2D, null), I.bindFramebuffer(I.FRAMEBUFFER, null), A.framebuffer = E, A.texture = Q, A.destroy = () => {
      I.deleteFramebuffer(E), I.deleteTexture(Q);
    };
  }
  let e = `${g},${B},${C},${i}`;
  return A.cacheKey != e && (A.cacheKey = e, I.bindTexture(I.TEXTURE_2D, A.texture), LE(I, g, B, C, i), I.bindTexture(I.TEXTURE_2D, null)), {
    framebuffer: A.framebuffer,
    texture: A.texture,
    width: g,
    height: B
  };
}
function vE(A) {
  let I = A.squareMaxSize, g = A.samples, B = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, C = `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform vec2 resolution;
    uniform vec2 direction;
    in vec2 uv;
    out vec4 outColor;
    void main() {
      vec4 color = vec4(0.0);
      const int count = ${I};
      int i = -count;
      while(i + 1 <= count) {
        color += texture(image, uv + direction * (float(i) + 0.5) / resolution) * 2.0;
        i += 2;
      }
      if (i <= count) {
        color += texture(image, uv + direction * float(count) / resolution);
      }
      outColor = color;
    }
  `, i = `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform sampler2D imageBox;
    uniform vec2 resolution;
    uniform float scaler;
    in vec2 uv;
    out vec4 outColor;

    void main() {
      vec4 color = texture(imageBox, uv);
      if (color != vec4(0.0)) {
        ${g.map(({ x: e, y: E, w: Q }) => `color -= texture(image, uv + vec2(${e.toFixed(8)}, ${E.toFixed(8)}) / resolution) * (${Q.toFixed(8)})`).join(";")};
      }
      outColor = color * scaler;
    }
  `;
  return { vertex: B, fragment1: C, fragment2: i };
}
function HE(A, I, g) {
  let B = A.derive([g], bE), C = A.derive([B], vE), i = A.statefulDerive(
    [I, A.derive([C], (Q) => Q.vertex), A.derive([C], (Q) => Q.fragment1)],
    II
  ), e = A.statefulDerive(
    [I, A.derive([C], (Q) => Q.vertex), A.derive([C], (Q) => Q.fragment2)],
    II
  ), E = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive(
    [I, E, i, e, g, B],
    (Q, t, o, r, l, s) => (a, h, D) => {
      let { width: f, height: y } = h;
      Q.disable(Q.BLEND), Q.enableVertexAttribArray(0), Q.bindBuffer(Q.ARRAY_BUFFER, t), Q.vertexAttribPointer(0, 2, Q.FLOAT, !1, 0, 0), Q.bindBuffer(Q.ARRAY_BUFFER, null), Q.useProgram(o.program), Q.uniform2f(o.uniforms.resolution, f, y), Q.uniform1i(o.uniforms.image, 0), Q.bindFramebuffer(Q.FRAMEBUFFER, h.framebuffer), Q.bindTexture(Q.TEXTURE_2D, a), Q.uniform2f(o.uniforms.direction, 0, 1), Q.drawArrays(Q.TRIANGLE_STRIP, 0, 4), Q.bindFramebuffer(Q.FRAMEBUFFER, D.framebuffer), Q.bindTexture(Q.TEXTURE_2D, h.texture), Q.uniform2f(o.uniforms.direction, 1, 0), Q.drawArrays(Q.TRIANGLE_STRIP, 0, 4), Q.bindFramebuffer(Q.FRAMEBUFFER, h.framebuffer), Q.activeTexture(Q.TEXTURE1), Q.bindTexture(Q.TEXTURE_2D, D.texture), Q.activeTexture(Q.TEXTURE0), Q.bindTexture(Q.TEXTURE_2D, a), Q.useProgram(r.program), Q.uniform2f(r.uniforms.resolution, f, y), Q.uniform1i(r.uniforms.image, 0), Q.uniform1i(r.uniforms.imageBox, 1);
      let c = 1 / s.totalWeight * l * l * Math.PI;
      Q.uniform1f(r.uniforms.scaler, c), Q.drawArrays(Q.TRIANGLE_STRIP, 0, 4), Q.bindFramebuffer(Q.FRAMEBUFFER, null), Q.useProgram(null), Q.activeTexture(Q.TEXTURE1), Q.bindTexture(Q.TEXTURE_2D, null), Q.activeTexture(Q.TEXTURE0), Q.bindTexture(Q.TEXTURE_2D, null), Q.disableVertexAttribArray(0);
    }
  );
}
function vC(A, I, g) {
  let B = Math.sqrt(I * I + g * g);
  if (B < A - Math.sqrt(2) / 2)
    return 1;
  if (B > A + Math.sqrt(2) / 2)
    return 0;
  let C = 2, i = 0;
  for (let e = 0; e < C; e++)
    for (let E = 0; E < C; E++) {
      let Q = I + (e + 0.5) / C - 0.5, t = g + (E + 0.5) / C - 0.5;
      Math.sqrt(Q * Q + t * t) < A && (i += 1);
    }
  return i / C / C;
}
function bE(A) {
  let I = Math.floor(A + 0.5), g = I, B = vC(A, 0, 0), C = [];
  for (let E = -I; E <= I; E++)
    for (let Q = -I; Q <= I; Q++) {
      let t = B - vC(A, E, Q);
      if (!(t <= 0))
        if (C.length > 0 && E == C[C.length - 1].x && Q == C[C.length - 1].y + 1) {
          let o = C[C.length - 1].w, r = t;
          C[C.length - 1].y += 1 - o / (o + r), C[C.length - 1].w = o + r;
        } else
          C.push({ x: E, y: Q, w: t });
    }
  C = C.sort((E, Q) => E.y != Q.y ? E.y - Q.y : E.x - Q.x);
  let i = [];
  for (let { x: E, y: Q, w: t } of C)
    if (i.length > 0 && Q == i[i.length - 1].y && E == i[i.length - 1].x + 1) {
      let o = i[i.length - 1].w, r = t;
      i[i.length - 1].x += 1 - o / (o + r), i[i.length - 1].w = o + r;
    } else
      i.push({ x: E, y: Q, w: t });
  let e = -i.reduce((E, Q) => E + Q.w, 0);
  return e += B * (1 + g * 2) * (1 + g * 2), { squareMaxSize: g, squareWeight: B, samples: i, totalWeight: e };
}
function qE(A) {
  let I;
  return A ? I = `#version 300 es
      precision highp float;
      uniform mat3 matrix;
      layout(location=0) in float x;
      layout(location=1) in float y;
      layout(location=2) in int category;
      out vec4 color;
      void main() {
        gl_Position = vec4(matrix * vec3(x, y, 1), 1);
        if (category == 0) {
          color = vec4(1, 0, 0, 0);
        } else if (category == 1) {
          color = vec4(0, 1, 0, 0);
        } else if (category == 2) {
          color = vec4(0, 0, 1, 0);
        } else if (category == 3) {
          color = vec4(0, 0, 0, 1);
        }
        gl_PointSize = 1.0;
      }
    ` : I = `#version 300 es
      precision highp float;
      uniform mat3 matrix;
      layout(location=0) in float x;
      layout(location=1) in float y;
      out vec4 color;
      void main() {
        gl_Position = vec4(matrix * vec3(x, y, 1), 1);
        color = vec4(1, 0, 0, 0);
        gl_PointSize = 1.0;
      }
    `, { vertex: I, fragment: `#version 300 es
    precision highp float;
    in vec4 color;
    out vec4 outColor;
    void main() {
      outColor = color;
    }
  ` };
}
function UB(A, I, g, B, C, i) {
  let e = C != null, E = qE(e), Q = A.statefulDerive([I, E.vertex, E.fragment], II);
  return A.derive([I, Q, g, B, C, i], (t, o, r, l, s, a) => (h) => {
    t.enable(t.BLEND), t.blendFunc(t.ONE, t.ONE), t.useProgram(o.program), t.enableVertexAttribArray(0), t.bindBuffer(t.ARRAY_BUFFER, r), t.vertexAttribPointer(0, 1, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(1), t.bindBuffer(t.ARRAY_BUFFER, l), t.vertexAttribPointer(1, 1, t.FLOAT, !1, 0, 0), s != null && (t.enableVertexAttribArray(2), t.bindBuffer(t.ARRAY_BUFFER, s), t.vertexAttribIPointer(2, 1, t.BYTE, 0, 0)), t.bindBuffer(t.ARRAY_BUFFER, null), t.uniformMatrix3fv(o.uniforms.matrix, !1, h), t.drawArrays(t.POINTS, 0, a), t.disableVertexAttribArray(0), t.disableVertexAttribArray(1), s != null && t.disableVertexAttribArray(2), t.useProgram(null);
  });
}
function _E() {
  return { vertex: `#version 300 es
    precision highp float;
    uniform vec2 xyScaler;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy * xyScaler, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, fragment: `#version 300 es
    precision highp float;
    uniform sampler2D source;
    uniform float gamma;
    in vec2 uv;
    out vec4 outColor;
    void main() {
      vec4 color = texture(source, uv);
      color.rgb = pow(color.rgb, vec3(1.0 / gamma));
      outColor = color;
    }
  ` };
}
function gi(A, I) {
  let { vertex: g, fragment: B } = _E(), C = A.statefulDerive([I, g, B], II), i = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive([I, C, i], (e, E, Q) => (t, o, r, l) => {
    e.disable(e.BLEND), e.enableVertexAttribArray(0), e.bindBuffer(e.ARRAY_BUFFER, Q), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, null), e.bindTexture(e.TEXTURE_2D, t), e.useProgram(E.program), e.uniform1i(E.uniforms.source, 0), e.uniform2f(E.uniforms.xyScaler, r ?? 1, l ?? 1), e.uniform1f(E.uniforms.gamma, o ?? 2.2), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.useProgram(null), e.bindTexture(e.TEXTURE_2D, null), e.disableVertexAttribArray(0);
  });
}
function Bi(A) {
  return Math.ceil(A * 3);
}
function TE(A) {
  let I = Bi(A), g = [];
  for (let Q = -I; Q <= I; Q++)
    g.push(Math.exp(-Q * Q / A / A / 2));
  let B = g.reduce((Q, t) => Q + t, 0);
  g = g.map((Q) => Q / B);
  let i = VE(g).map(([Q, t]) => [Q - I, t]), e = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, E = `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform vec2 resolution;
    uniform vec2 direction;
    in vec2 uv;
    out vec4 outColor;

    void main() {
      vec4 color = vec4(0.0);
      ${i.map(([Q, t]) => `color += texture(image, uv + direction * vec2(${Q.toFixed(10)}) / resolution) * ${t.toFixed(10)};`).join(`
`)}
      outColor = color;
    }
  `;
  return { vertex: e, fragment: E };
}
function WE(A, I, g) {
  let B = A.derive([g], TE), C = A.statefulDerive(
    [I, A.derive([B], (e) => e.vertex), A.derive([B], (e) => e.fragment)],
    II
  ), i = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive([I, i, C, g], (e, E, Q, t) => (o, r, l) => {
    let { width: s, height: a } = r;
    e.disable(e.BLEND), e.enableVertexAttribArray(0), e.bindBuffer(e.ARRAY_BUFFER, E), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, null), e.useProgram(Q.program), e.uniform2f(Q.uniforms.resolution, s, a), e.uniform1i(Q.uniforms.image, 0), e.bindFramebuffer(e.FRAMEBUFFER, l.framebuffer), e.bindTexture(e.TEXTURE_2D, o), e.uniform2f(Q.uniforms.direction, 0, 1), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.bindFramebuffer(e.FRAMEBUFFER, r.framebuffer), e.bindTexture(e.TEXTURE_2D, l.texture), e.uniform2f(Q.uniforms.direction, 1, 0), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.bindFramebuffer(e.FRAMEBUFFER, null), e.useProgram(null), e.bindTexture(e.TEXTURE_2D, null), e.disableVertexAttribArray(0);
  });
}
function VE(A) {
  let I = [];
  for (let g = 0; g < A.length; g += 2)
    if (g + 1 < A.length) {
      let B = A[g], C = A[g + 1], i = 1 - B / (B + C);
      if (i >= 0 && i <= 1) {
        let e = B + C;
        e != 0 && I.push([g + i, e]);
      } else
        I.push([g, A[g]]), I.push([g + 1, A[g + 1]]);
    } else
      I.push([g, A[g]]);
  return I;
}
function OE(A) {
  return Math.ceil(A * 3);
}
function XE() {
  return { vertex: `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, fragment: `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform vec2 resolution;
    uniform vec2 direction;
    in vec2 uv;
    out vec4 outColor;

    uniform float weight0;
    uniform vec3 distances;
    uniform vec3 weights;

    void main() {
      vec4 color = texture(image, uv) * weight0;
      if (weights.x != 0.0) {
        color += texture(image, uv + direction * vec2(distances.x) / resolution) * weights.x;
        color += texture(image, uv - direction * vec2(distances.x) / resolution) * weights.x;
      }
      if (weights.y != 0.0) {
        color += texture(image, uv + direction * vec2(distances.y) / resolution) * weights.y;
        color += texture(image, uv - direction * vec2(distances.y) / resolution) * weights.y;
      }
      if (weights.z != 0.0) {
        color += texture(image, uv + direction * vec2(distances.z) / resolution) * weights.z;
        color += texture(image, uv - direction * vec2(distances.z) / resolution) * weights.z;
      }
      outColor = color;
    }
  ` };
}
function PE(A, I, g) {
  let { vertex: B, fragment: C } = XE(), i = A.statefulDerive([I, B, C], II), e = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive([I, e, i], (E, Q, t) => (o, r, l) => {
    let { width: s, height: a } = r;
    E.disable(E.BLEND), E.enableVertexAttribArray(0), E.bindBuffer(E.ARRAY_BUFFER, Q), E.vertexAttribPointer(0, 2, E.FLOAT, !1, 0, 0), E.bindBuffer(E.ARRAY_BUFFER, null), E.useProgram(t.program), E.uniform2f(t.uniforms.resolution, s, a), E.uniform1i(t.uniforms.image, 0);
    let h = o, D = l, f = r;
    for (let y = 0; y < 2; y++) {
      E.uniform2f(t.uniforms.direction, y, 1 - y);
      for (let [c, G, S] of ZE) {
        E.bindFramebuffer(E.FRAMEBUFFER, D.framebuffer), E.bindTexture(E.TEXTURE_2D, h), E.uniform1fv(t.uniforms.weight0, G), E.uniform3fv(t.uniforms.distances, c), E.uniform3fv(t.uniforms.weights, S), E.drawArrays(E.TRIANGLE_STRIP, 0, 4), h = D.texture;
        let d = D;
        D = f, f = d;
      }
    }
    E.bindFramebuffer(E.FRAMEBUFFER, null), E.useProgram(null), E.bindTexture(E.TEXTURE_2D, null), E.disableVertexAttribArray(0);
  });
}
const ZE = [
  [[1, 2, 3], [0.2288468365182578], [0.18230006506971572, 0.1356122230111784, 0.06766429365997693]],
  [[2, 6, 10], [0.09116254014100238], [0.23317759354726447, 0.18385867277788717, 0.03738246360434722]],
  [[3, 10, 20], [0.2950645715317288], [0.010918865853671198, 0.23773695670296047, 0.10381189167750389]],
  [[4, 16, 30], [0.20085957073474772], [0.14463019087130788, 0.17934533765938643, 0.07559468610193185]]
];
function zE() {
  return { vertex: `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, fragment: `#version 300 es
    precision highp float;
    uniform sampler2D source;
    uniform vec2 resolution;
    uniform float densityScaler;
    uniform float quantizationStep;
    uniform vec4 channelMask;
    uniform vec4 color;
    uniform float globalAlpha;

    in vec2 uv;
    out vec4 outColor;

    float sample_density(vec2 uv) {
      float d = dot(texture(source, uv), channelMask) * densityScaler;
      d = min(1.0, max(0.0, d));
      d = floor(d / quantizationStep);
      return d;
    }

    void main() {
      // Run the Sobel operator.
      float v = sample_density(uv);
      float v11 = sample_density(uv + vec2(-1, -1) / resolution);
      float v12 = sample_density(uv + vec2(-1,  0) / resolution);
      float v13 = sample_density(uv + vec2(-1, +1) / resolution);
      float v21 = sample_density(uv + vec2( 0, -1) / resolution);
      float v23 = sample_density(uv + vec2( 0, +1) / resolution);
      float v31 = sample_density(uv + vec2(+1, -1) / resolution);
      float v32 = sample_density(uv + vec2(+1,  0) / resolution);
      float v33 = sample_density(uv + vec2(+1, +1) / resolution);
      float gx = v11 + v12 * 2.0 + v13 - v31 - v32 * 2.0 - v33;
      float gy = v11 + v21 * 2.0 + v31 - v13 - v23 * 2.0 - v33;
      // Derive alpha value from the result.
      float alpha = length(vec2(gx, gy)) * 0.2;
      alpha = min(1.0, max(0.0, alpha));
      outColor = color * alpha * globalAlpha;
    }
  ` };
}
function jE(A, I) {
  let { vertex: g, fragment: B } = zE(), C = A.statefulDerive([I, g, B], II), i = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive(
    [I, C, i],
    (e, E, Q) => (t, o, r, l, s, a) => {
      e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), e.enableVertexAttribArray(0), e.bindBuffer(e.ARRAY_BUFFER, Q), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, null), e.bindTexture(e.TEXTURE_2D, t.texture), e.useProgram(E.program), e.uniform1i(E.uniforms.source, 0), e.uniform2f(E.uniforms.resolution, t.width, t.height), e.uniform1f(E.uniforms.densityScaler, o), e.uniform1f(E.uniforms.quantizationStep, r), e.uniform1f(E.uniforms.globalAlpha, l), e.uniform4fv(E.uniforms.channelMask, s), e.uniform4fv(E.uniforms.color, a), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.useProgram(null), e.bindTexture(e.TEXTURE_2D, null), e.disableVertexAttribArray(0);
    }
  );
}
function $E() {
  return { vertex: `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
    `, fragment: `#version 300 es
    precision highp float;
    uniform sampler2D source;
    uniform vec2 resolution;
    uniform float densityScaler;
    uniform float quantizationStep;

    uniform mat4 colorMatrix;
    uniform int isDarkMode;
    uniform float globalAlpha;

    in vec2 uv;
    out vec4 outColor;

    /* Combine alphas with symmetric blending equation f(a, b) = a + b - ab. */
    float combine_alphas(vec4 alphas) {
      float r = alphas.x + alphas.y - alphas.x * alphas.y;
      r = r + alphas.z - r * alphas.z;
      r = r + alphas.w - r * alphas.w;
      return r;
    }

    void main() {
      vec4 density = texture(source, uv) * densityScaler;

      if (density.x > 1.0 || density.y > 1.0 || density.z > 1.0 || density.w > 1.0) {
        density = density / max(max(max(density.x, density.y), density.z), density.w);
      } else {
        density = floor(density / quantizationStep) * quantizationStep;
      }

      if (density.x + density.y + density.z + density.w == 0.0) {
        discard;
      }

      float alpha = combine_alphas(density);

      density *= alpha / (density.x + density.y + density.z + density.w);

      vec3 c1 = colorMatrix[0].rgb * density.x;
      vec3 c2 = colorMatrix[1].rgb * density.y;
      vec3 c3 = colorMatrix[2].rgb * density.z;
      vec3 c4 = colorMatrix[3].rgb * density.w;
      vec3 c;

      if (isDarkMode == 0) {
        c = vec3(1.0) - alpha + c1 + c2 + c3 + c4;
      } else {
        c = c1 + c2 + c3 + c4;
      }

      outColor = vec4(c, 1.0) * alpha * globalAlpha;
    }
  ` };
}
function At(A, I) {
  let { vertex: g, fragment: B } = $E(), C = A.statefulDerive([I, g, B], II), i = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive(
    [I, C, i],
    (e, E, Q) => (t, o, r, l, s, a) => {
      e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), e.enableVertexAttribArray(0), e.bindBuffer(e.ARRAY_BUFFER, Q), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, null), e.bindTexture(e.TEXTURE_2D, t.texture), e.useProgram(E.program), e.uniform1i(E.uniforms.source, 0), e.uniform2f(E.uniforms.resolution, t.width, t.height), e.uniform1f(E.uniforms.densityScaler, o), e.uniform1f(E.uniforms.quantizationStep, r), e.uniform1f(E.uniforms.globalAlpha, l), e.uniform1i(E.uniforms.isDarkMode, a == "dark" ? 1 : 0), e.uniformMatrix4fv(E.uniforms.colorMatrix, !1, s), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.useProgram(null), e.bindTexture(e.TEXTURE_2D, null), e.disableVertexAttribArray(0);
    }
  );
}
function It(A) {
  let I;
  return A ? I = `#version 300 es
      precision highp float;
      uniform mat3 matrix;
      uniform float point_size;
      uniform float alpha;
      uniform vec4 colorScheme[64];

      layout(location=0) in float x;
      layout(location=1) in float y;
      layout(location=2) in int category;

      out vec4 color;

      void main() {
        gl_Position = vec4(matrix * vec3(x, y, 1), 1);
        if (category < 64) {
          color = colorScheme[category];
        } else {
          color = vec4(0.5, 0.5, 0.5, 1);
        }
        color *= alpha;
        gl_PointSize = point_size;
      }
    ` : I = `#version 300 es
      precision highp float;
      uniform mat3 matrix;
      uniform float point_size;
      uniform vec4 colorScheme;
      uniform float alpha;

      layout(location=0) in float x;
      layout(location=1) in float y;

      out vec4 color;

      void main() {
        gl_Position = vec4(matrix * vec3(x, y, 1), 1);
        color = colorScheme;
        color *= alpha;
        gl_PointSize = point_size;
      }
    `, { vertex: I, fragment: `#version 300 es
    precision highp float;
    uniform float point_size;
    in vec4 color;
    out vec4 outColor;
    void main() {
      float r = length(gl_PointCoord.xy - vec2(0.5, 0.5)) * point_size;
      float a = max(0.0, min(1.0, point_size / 2.0 - r));
      outColor = color * a;
    }
  ` };
}
function HC(A, I, g, B, C, i) {
  let e = C != null, E = It(e), Q = A.statefulDerive([I, E.vertex, E.fragment], II);
  return A.derive(
    [I, Q, g, B, C, i],
    (t, o, r, l, s, a) => (h, D, f, y) => {
      t.enable(t.BLEND), t.blendFunc(t.ONE, t.ONE_MINUS_SRC_ALPHA), t.useProgram(o.program), t.enableVertexAttribArray(0), t.bindBuffer(t.ARRAY_BUFFER, r), t.vertexAttribPointer(0, 1, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(1), t.bindBuffer(t.ARRAY_BUFFER, l), t.vertexAttribPointer(1, 1, t.FLOAT, !1, 0, 0), s != null && (t.enableVertexAttribArray(2), t.bindBuffer(t.ARRAY_BUFFER, s), t.vertexAttribIPointer(2, 1, t.BYTE, 0, 0)), t.bindBuffer(t.ARRAY_BUFFER, null), t.uniformMatrix3fv(o.uniforms.matrix, !1, h), t.uniform1f(o.uniforms.point_size, D * 2), t.uniform1f(o.uniforms.alpha, f), e ? t.uniform4fv(o.uniforms.colorScheme, y) : t.uniform4fv(o.uniforms.colorScheme, y.slice(0, 4)), t.drawArrays(t.POINTS, 0, a), t.disableVertexAttribArray(0), t.disableVertexAttribArray(1), s != null && t.disableVertexAttribArray(2), t.useProgram(null);
    }
  );
}
function gt() {
  return { vertex: `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, fragment: `#version 300 es
    precision highp float;
    uniform sampler2D source;
    uniform vec2 resolution;
    uniform mat4 colorMatrix;
    uniform float pointAlpha;
    uniform float globalAlpha;
    uniform int isDarkMode;
    in vec2 uv;
    out vec4 outColor;

    /* Combine alphas with symmetric blending equation f(a, b) = a + b - ab. */
    float combine_alphas(vec4 alphas) {
      float r = alphas.x + alphas.y - alphas.x * alphas.y;
      r = r + alphas.z - r * alphas.z;
      r = r + alphas.w - r * alphas.w;
      return r;
    }

    void main() {
      vec4 count = texture(source, uv);
      vec4 alphas = pointAlpha >= 0.999
        ? vec4(count.x > 0.0 ? 1.0 : 0.0, count.y > 0.0 ? 1.0 : 0.0, count.z > 0.0 ? 1.0 : 0.0, count.w > 0.0 ? 1.0 : 0.0)
        : vec4(1.0) - pow(vec4(1.0 - pointAlpha), count);
      float a = combine_alphas(alphas);
      if (a <= 0.0) { discard; }
      alphas *= a / (alphas.x + alphas.y + alphas.z + alphas.w);

      vec3 c1 = colorMatrix[0].rgb * alphas.x;
      vec3 c2 = colorMatrix[1].rgb * alphas.y;
      vec3 c3 = colorMatrix[2].rgb * alphas.z;
      vec3 c4 = colorMatrix[3].rgb * alphas.w;
      vec3 c;
      if (isDarkMode == 0) {
        c = vec3(1.0) - a + c1 + c2 + c3 + c4;
      } else {
        c = c1 + c2 + c3 + c4;
      }
      outColor = vec4(c, 1.0) * a * globalAlpha;
    }
  ` };
}
function Bt(A, I) {
  let { vertex: g, fragment: B } = gt(), C = A.statefulDerive([I, g, B], II), i = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], $A);
  return A.derive(
    [I, C, i],
    (e, E, Q) => (t, o, r, l, s) => {
      e.enable(e.BLEND), e.blendFunc(e.ONE, e.ONE_MINUS_SRC_ALPHA), e.enableVertexAttribArray(0), e.bindBuffer(e.ARRAY_BUFFER, Q), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, null), e.bindTexture(e.TEXTURE_2D, t.texture), e.useProgram(E.program), e.uniform1i(E.uniforms.source, 0), e.uniform2f(E.uniforms.resolution, t.width, t.height), e.uniform1f(E.uniforms.pointAlpha, o), e.uniform1f(E.uniforms.globalAlpha, r), e.uniform1i(E.uniforms.isDarkMode, s == "dark" ? 1 : 0), e.uniformMatrix4fv(E.uniforms.colorMatrix, !1, l), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.useProgram(null), e.bindTexture(e.TEXTURE_2D, null), e.disableVertexAttribArray(0);
    }
  );
}
class Ct {
  props;
  viewport;
  df;
  gl;
  renderInputs;
  dataBuffers;
  renderer;
  constructor(I, g, B) {
    this.props = {
      mode: "points",
      colorScheme: "light",
      x: new Float32Array(),
      y: new Float32Array(),
      category: null,
      categoryCount: 1,
      categoryColors: null,
      viewportX: 0,
      viewportY: 0,
      viewportScale: 1,
      pointSize: 1,
      pointAlpha: 1,
      pointsAlpha: 1,
      densityScaler: 1,
      densityBandwidth: 1,
      densityQuantizationStep: 0.1,
      contoursAlpha: 1,
      densityAlpha: 1,
      gamma: 2.2,
      width: g,
      height: B
    }, this.viewport = new Vg({ x: 0, y: 0, scale: 1 }, g, B);
    let C = new HI(), i = C.value(I);
    this.df = C, this.gl = i, this.renderInputs = {
      mode: C.value(this.props.mode),
      colorScheme: C.value(this.props.colorScheme),
      xData: C.value(this.props.x),
      yData: C.value(this.props.y),
      categoryData: C.value(this.props.category),
      categoryCount: C.value(this.props.categoryCount),
      matrix: C.value(je()),
      width: C.value(g),
      height: C.value(B),
      pointSize: C.value(this.props.pointSize),
      densityBandwidth: C.value(this.props.densityBandwidth)
    }, this.dataBuffers = et(C, i, this.renderInputs), this.renderer = it(C, i, this.renderInputs, this.dataBuffers);
  }
  setProps(I) {
    let g = !1, B;
    for (B in I)
      I[B] !== this.props[B] && (this.props[B] = I[B], g = !0);
    return this.viewport.update(
      { x: this.props.viewportX, y: this.props.viewportY, scale: this.props.viewportScale },
      this.props.width,
      this.props.height
    ), this.renderInputs.mode.value = this.props.mode, this.renderInputs.colorScheme.value = this.props.colorScheme, this.renderInputs.xData.value = this.props.x, this.renderInputs.yData.value = this.props.y, this.renderInputs.categoryData.value = this.props.category, this.props.category != null ? this.renderInputs.categoryCount.value = this.props.categoryCount : this.renderInputs.categoryCount.value = 1, this.renderInputs.matrix.value = this.viewport.matrix(), this.renderInputs.width.value = this.props.width, this.renderInputs.height.value = this.props.height, this.renderInputs.pointSize.value = this.props.pointSize, this.renderInputs.densityBandwidth.value = this.props.densityBandwidth, g;
  }
  render() {
    this.renderer.value(this.props);
  }
  destroy() {
    this.df.destroy();
  }
  async densityMap(I, g, B, C) {
    let i = this.df.subgraph(), e = tt(i, this.gl, this.dataBuffers, i.value(I), i.value(g), i.value(B)), { x: E, y: Q, scale: t } = C, o = [t, 0, 0, 0, t, 0, -E * t, -Q * t, 1], r = e.value(o), l = Ai(o);
    return i.destroy(), {
      data: r,
      width: I,
      height: g,
      coordinateAtPixel: (s, a) => {
        let h = s / I * 2 - 1, D = a / g * 2 - 1, f = $e([h, D, 1], l);
        return { x: f[0], y: f[1] };
      }
    };
  }
}
function et(A, I, g) {
  const B = A.statefulDerive([I, g.xData, "f32"], $A), C = A.statefulDerive([I, g.yData, "f32"], $A), i = A.if(
    A.derive([g.categoryData], (E) => E != null),
    (E) => E.statefulDerive([I, E.assertNotNull(g.categoryData), "u8"], $A),
    (E) => E.value(null)
  ), e = A.derive([g.xData], (E) => E.length);
  return { x: B, y: C, category: i, count: e };
}
function it(A, I, g, B) {
  return A.switch(g.mode, {
    points: (C) => Qt(C, I, g, B),
    density: (C) => Et(C, I, g, B)
  });
}
function Qt(A, I, g, B) {
  const C = A.derive([g.categoryCount], (Q) => Q > 1), i = A.statefulDerive([I, g.width, g.height, 4, "f32"], cI);
  let e = A.if(
    C,
    (Q) => HC(Q, I, B.x, B.y, Q.assertNotNull(B.category), B.count),
    (Q) => HC(Q, I, B.x, B.y, null, B.count)
  ), E = gi(A, I);
  return A.derive(
    [I, i, e, E, g.colorScheme, g.matrix, g.categoryCount],
    (Q, t, o, r, l, s, a) => (h) => {
      let D = [], f = h.categoryColors ?? IB(h.categoryCount);
      for (let y = 0; y < a; y++)
        if (y < f.length) {
          let { r: c, g: G, b: S } = gC(f[y]);
          c = Math.pow(c, h.gamma), G = Math.pow(G, h.gamma), S = Math.pow(S, h.gamma), D = D.concat([c, G, S, 1]);
        } else
          D = D.concat([0.5, 0.5, 0.5, 1]);
      Q.bindFramebuffer(Q.FRAMEBUFFER, t.framebuffer), Q.viewport(0, 0, t.width, t.height), l == "light" ? Q.clearColor(1, 1, 1, 1) : Q.clearColor(0, 0, 0, 1), Q.clear(Q.COLOR_BUFFER_BIT), o(s, Math.max(3, h.pointSize), h.pointAlpha * h.pointsAlpha, D), Q.bindFramebuffer(Q.FRAMEBUFFER, null), Q.viewport(0, 0, h.width, h.height), r(t.texture, h.gamma);
    }
  );
}
function Et(A, I, g, B) {
  let C = A.derive([g.densityBandwidth], (c) => OE(c) + 1), i = A.derive([g.width, C], (c, G) => c + G * 2), e = A.derive([g.height, C], (c, G) => c + G * 2);
  const E = A.derive([g.categoryCount], (c) => c > 1), Q = A.statefulDerive([I, i, e, 4, "f32"], cI), t = A.statefulDerive([I, i, e, 4, "f32"], cI), o = A.statefulDerive([I, i, e, 4, "f32"], cI), r = A.statefulDerive([I, i, e, 4, "f32"], cI);
  let l = A.if(
    E,
    (c) => UB(c, I, B.x, B.y, c.assertNotNull(B.category), B.count),
    (c) => UB(c, I, B.x, B.y, null, B.count)
  ), s = HE(A, I, g.pointSize), a = PE(A, I, g.densityBandwidth), h = Bt(A, I), D = At(A, I), f = jE(A, I), y = gi(A, I);
  return A.derive(
    [
      I,
      Q,
      t,
      o,
      r,
      g.colorScheme,
      g.matrix,
      l,
      s,
      a,
      h,
      D,
      f,
      y
    ],
    (c, G, S, d, R, L, m, CA, IA, b, QA, O, eA, Z) => (K) => {
      let aA = K.categoryColors ?? IB(K.categoryCount), z = [];
      for (let sA = 0; sA < 4; sA++)
        if (sA < aA.length) {
          let { r: fA, g: vA, b: HA } = gC(aA[sA]);
          fA = Math.pow(fA, K.gamma), vA = Math.pow(vA, K.gamma), HA = Math.pow(HA, K.gamma), z = z.concat([fA, vA, HA, 1]);
        } else
          z = z.concat([0.5, 0.5, 0.5, 1]);
      let EA = K.width / S.width, H = K.height / S.height, LA = BC([EA, 0, 0, 0, H, 0, 0, 0, 1], m);
      if (c.bindFramebuffer(c.FRAMEBUFFER, G.framebuffer), c.viewport(0, 0, G.width, G.height), c.clearColor(0, 0, 0, 0), c.clear(c.COLOR_BUFFER_BIT), CA(LA), c.bindFramebuffer(c.FRAMEBUFFER, S.framebuffer), c.viewport(0, 0, S.width, S.height), L == "light" ? c.clearColor(1, 1, 1, 1) : c.clearColor(0, 0, 0, 1), c.clear(c.COLOR_BUFFER_BIT), K.pointAlpha > 0 && K.pointsAlpha > 0 && (IA(G.texture, d, R), c.bindFramebuffer(c.FRAMEBUFFER, S.framebuffer), QA(d, K.pointAlpha, K.pointsAlpha, z, L)), K.densityScaler > 0 && (K.densityAlpha > 0 || K.contoursAlpha > 0) && (b(G.texture, d, R), c.bindFramebuffer(c.FRAMEBUFFER, S.framebuffer), K.densityAlpha > 0 && O(
        d,
        K.densityScaler,
        K.densityQuantizationStep,
        K.densityAlpha,
        z,
        L
      ), K.contoursAlpha > 0))
        for (let sA = 0; sA < aA.length; sA++) {
          let fA = [0, 0, 0, 0];
          fA[sA] = 1, eA(
            d,
            K.densityScaler,
            K.densityQuantizationStep,
            K.contoursAlpha,
            fA,
            z.slice(sA * 4, sA * 4 + 4)
          );
        }
      c.bindFramebuffer(c.FRAMEBUFFER, null), c.viewport(0, 0, K.width, K.height), Z(S.texture, K.gamma, 1 / EA, 1 / H);
    }
  );
}
function tt(A, I, g, B, C, i) {
  let e = A.derive([i], (a) => Bi(a) + 1), E = A.derive([B, e], (a, h) => a + h * 2), Q = A.derive([C, e], (a, h) => a + h * 2);
  const t = A.statefulDerive([I, E, Q, 1, "f32"], cI), o = A.statefulDerive([I, E, Q, 1, "f32"], cI), r = A.statefulDerive([I, E, Q, 1, "f32"], cI);
  let l = UB(A, I, g.x, g.y, null, g.count), s = WE(A, I, i);
  return A.derive(
    [I, e, B, C, t, o, r, l, s],
    (a, h, D, f, y, c, G, S, d) => (R) => {
      let L = D / y.width, m = f / y.height, IA = BC([L, 0, 0, 0, m, 0, 0, 0, 1], R);
      a.bindFramebuffer(a.FRAMEBUFFER, y.framebuffer), a.viewport(0, 0, y.width, y.height), a.clearColor(0, 0, 0, 0), a.clear(a.COLOR_BUFFER_BIT), S(IA), d(y.texture, c, G), a.bindFramebuffer(a.FRAMEBUFFER, c.framebuffer);
      let b = new Float32Array(D * f);
      return a.readPixels(h, h, D, f, a.RED, a.FLOAT, b), a.bindFramebuffer(a.FRAMEBUFFER, null), b;
    }
  );
}
class ot {
  i32View;
  u32View;
  f32View;
  offset;
  constructor(I) {
    this.i32View = new Int32Array(I), this.u32View = new Uint32Array(I), this.f32View = new Float32Array(I), this.offset = 0;
  }
  align2() {
    this.offset % 2 != 0 && (this.offset += 2 - this.offset % 2);
  }
  align4() {
    this.offset % 4 != 0 && (this.offset += 4 - this.offset % 4);
  }
  f32(I) {
    this.f32View[this.offset++] = I;
  }
  u32(I) {
    this.u32View[this.offset++] = I;
  }
  i32(I) {
    this.i32View[this.offset++] = I;
  }
  vec2f(I, g) {
    this.align2(), this.f32View[this.offset++] = I, this.f32View[this.offset++] = g;
  }
  vec3f(I, g, B) {
    this.align4(), this.f32View[this.offset++] = I, this.f32View[this.offset++] = g, this.f32View[this.offset++] = B;
  }
  vec4f(I, g, B, C) {
    this.align4(), this.f32View[this.offset++] = I, this.f32View[this.offset++] = g, this.f32View[this.offset++] = B, this.f32View[this.offset++] = C;
  }
  mat3x3f(I) {
    this.vec3f(I[0], I[1], I[2]), this.vec3f(I[3], I[4], I[5]), this.vec3f(I[6], I[7], I[8]);
  }
  byteOffset() {
    return this.offset * 4;
  }
}
function nt(A, I) {
  let B = new ArrayBuffer(4288), C = A.statefulDerive(
    [I, 4288, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX],
    WI
  );
  return {
    buffer: C,
    update: A.derive([I, C], (i, e) => (E) => {
      let Q = new ot(B);
      Q.u32(E.count), Q.u32(E.category_count), Q.i32(E.framebuffer_width), Q.i32(E.framebuffer_height), Q.i32(E.density_width), Q.i32(E.density_height), Q.f32(E.gamma), Q.f32(E.point_size), Q.f32(E.point_alpha), Q.f32(E.points_alpha), Q.f32(E.density_scaler), Q.f32(E.quantization_step), Q.f32(E.density_alpha), Q.f32(E.contours_alpha), Q.mat3x3f(E.matrix), Q.vec2f(...E.view_xy_scaler), Q.vec4f(...E.kde_causal), Q.vec4f(...E.kde_anticausal), Q.vec4f(...E.kde_a), Q.vec4f(...E.background_color);
      let t = E.gamma;
      for (let o = 0; o < Math.min(E.category_colors.length, 256); o++) {
        let { r, g: l, b: s, a } = E.category_colors[o];
        r = Math.pow(r, t), l = Math.pow(l, t), s = Math.pow(s, t), Q.vec4f(r, l, s, a);
      }
      i.queue.writeBuffer(e, 0, B, 0, Q.byteOffset());
    })
  };
}
const aB = 64, sB = 64;
function Ci(A, I, g, B, C, i) {
  let e = A.derive(
    [I, g, B.layouts],
    (E, Q, t) => E.createComputePipeline({
      layout: E.createPipelineLayout({ bindGroupLayouts: [t.group0, t.group1, t.group2A] }),
      compute: { module: Q, entryPoint: "accumulate" }
    })
  );
  return A.derive(
    [
      e,
      B.group0,
      B.group1,
      B.group2A,
      i.countBuffer,
      C.count
    ],
    (E, Q, t, o, r, l) => (s) => {
      if (s.clearBuffer(r), l == 0)
        return;
      let a = s.beginComputePass();
      a.setPipeline(E), a.setBindGroup(0, Q), a.setBindGroup(1, t), a.setBindGroup(2, o), l <= aB * sB ? a.dispatchWorkgroups(Math.ceil(l / aB)) : a.dispatchWorkgroups(sB, Math.ceil(l / (aB * sB))), a.end();
    }
  );
}
function rt(A) {
  const { COMPUTE: I, VERTEX: g, FRAGMENT: B } = GPUShaderStage;
  return {
    // Group 0
    group0: A.createBindGroupLayout({
      entries: [{ binding: 0, visibility: I | g | B, buffer: { type: "uniform" } }]
    }),
    // Group 1
    group1: A.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: I | g, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: I | g, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: I | g, buffer: { type: "read-only-storage" } }
      ]
    }),
    // Group 2
    group2A: A.createBindGroupLayout({
      entries: [{ binding: 0, visibility: I | B, buffer: { type: "storage" } }]
    }),
    group2B: A.createBindGroupLayout({
      entries: [
        { binding: 1, visibility: I | B, buffer: { type: "storage" } },
        { binding: 2, visibility: I | B, buffer: { type: "storage" } }
      ]
    }),
    // Group 3
    group3: A.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "non-filtering" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } }
      ]
    })
  };
}
function ei(A, I, g, B, C) {
  let i = A.derive([I], (r) => rt(r)), e = A.derive(
    [I, i, g],
    (r, l, s) => r.createBindGroup({
      layout: l.group0,
      entries: [{ binding: 0, resource: { buffer: s } }]
    })
  ), E = A.derive(
    [I, i, B.x, B.y, B.category],
    (r, l, s, a, h) => r.createBindGroup({
      layout: l.group1,
      entries: [
        { binding: 0, resource: { buffer: s } },
        { binding: 1, resource: { buffer: a } },
        { binding: 2, resource: { buffer: h ?? s } }
      ]
    })
  ), Q = A.derive(
    [I, i, C.countBuffer, C.blurBuffer],
    (r, l, s, a) => r.createBindGroup({
      layout: l.group2A,
      entries: [{ binding: 0, resource: { buffer: s } }]
    })
  ), t = A.derive(
    [I, i, C.countBuffer, C.blurBuffer],
    (r, l, s, a) => r.createBindGroup({
      layout: l.group2B,
      entries: [
        { binding: 1, resource: { buffer: s } },
        { binding: 2, resource: { buffer: a } }
      ]
    })
  ), o = A.derive(
    [I, i, C.colorTexture, C.alphaTexture],
    (r, l, s, a) => r.createBindGroup({
      layout: l.group3,
      entries: [
        { binding: 0, resource: r.createSampler({}) },
        { binding: 1, resource: s.createView() },
        { binding: 2, resource: a.createView() }
      ]
    })
  );
  return {
    layouts: i,
    group0: e,
    group1: E,
    group2A: Q,
    group2B: t,
    group3: o
  };
}
function at(A, I, g, B, C) {
  const i = A.derive(
    [I, g, B.layouts],
    (e, E, Q) => e.createRenderPipeline({
      layout: e.createPipelineLayout({
        bindGroupLayouts: [Q.group0, Q.group1, Q.group2B]
      }),
      vertex: { entryPoint: "draw_density_map_vs", module: E },
      fragment: {
        entryPoint: "draw_density_map_fs",
        module: E,
        targets: [
          {
            format: C.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          },
          {
            format: C.alphaTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          }
        ]
      },
      primitive: { topology: "triangle-strip" }
    })
  );
  return A.derive(
    [
      i,
      B.group0,
      B.group1,
      B.group2B,
      C.colorTexture,
      C.alphaTexture
    ],
    (e, E, Q, t, o, r) => (l) => {
      let s = l.beginRenderPass({
        colorAttachments: [
          { loadOp: "load", storeOp: "store", view: o.createView() },
          { loadOp: "load", storeOp: "store", view: r.createView() }
        ]
      });
      s.setPipeline(e), s.setBindGroup(0, E), s.setBindGroup(1, Q), s.setBindGroup(2, t), s.draw(4), s.end();
    }
  );
}
function st(A, I, g, B, C, i) {
  const e = A.derive(
    [I, g, B.layouts],
    (E, Q, t) => E.createRenderPipeline({
      layout: E.createPipelineLayout({ bindGroupLayouts: [t.group0, t.group1] }),
      vertex: { entryPoint: "points_vs", module: Q },
      fragment: {
        entryPoint: "points_fs",
        module: Q,
        targets: [
          {
            format: i.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          },
          {
            format: i.alphaTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          }
        ]
      },
      primitive: { topology: "triangle-strip" }
    })
  );
  return A.derive(
    [
      e,
      B.group0,
      B.group1,
      C.count,
      i.colorTexture,
      i.alphaTexture
    ],
    (E, Q, t, o, r, l) => (s) => {
      let a = s.beginRenderPass({
        colorAttachments: [
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: r.createView() },
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: l.createView() }
        ]
      });
      a.setPipeline(E), a.setBindGroup(0, Q), a.setBindGroup(1, t), o > 0 && a.draw(4, o), a.end();
    }
  );
}
function lt(A, I, g, B, C) {
  const i = A.derive(
    [I, g, C.layouts],
    (e, E, Q) => e.createRenderPipeline({
      layout: e.createPipelineLayout({
        bindGroupLayouts: [Q.group0, Q.group1, Q.group2B, Q.group3]
      }),
      vertex: { entryPoint: "gamma_correction_vs", module: E },
      fragment: { entryPoint: "gamma_correction_fs", module: E, targets: [{ format: B }] },
      primitive: { topology: "triangle-strip" }
    })
  );
  return A.derive(
    [i, C.group0, C.group1, C.group2B, C.group3],
    (e, E, Q, t, o) => (r, l) => {
      let s = r.beginRenderPass({
        colorAttachments: [{ clearValue: [1, 1, 1, 1], loadOp: "clear", storeOp: "store", view: l }]
      });
      s.setPipeline(e), s.setBindGroup(0, E), s.setBindGroup(1, Q), s.setBindGroup(2, t), s.setBindGroup(3, o), s.draw(4), s.end();
    }
  );
}
const bC = 64;
function ii(A, I, g, B, C, i, e) {
  let E = A.derive(
    [I, g, B.layouts],
    (t, o, r) => t.createComputePipeline({
      layout: t.createPipelineLayout({
        bindGroupLayouts: [r.group0, r.group1, r.group2B, r.group3]
      }),
      compute: { module: o, entryPoint: "gaussian_blur_stage_1" }
    })
  ), Q = A.derive(
    [I, g, B.layouts],
    (t, o, r) => t.createComputePipeline({
      layout: t.createPipelineLayout({
        bindGroupLayouts: [r.group0, r.group1, r.group2B, r.group3]
      }),
      compute: { module: o, entryPoint: "gaussian_blur_stage_2" }
    })
  );
  return A.derive(
    [
      E,
      Q,
      B.group0,
      B.group1,
      B.group2B,
      B.group3,
      C,
      i,
      e
    ],
    (t, o, r, l, s, a, h, D, f) => (y) => {
      let c = y.beginComputePass();
      c.setBindGroup(0, r), c.setBindGroup(1, l), c.setBindGroup(2, s), c.setBindGroup(3, a), c.setPipeline(t), c.dispatchWorkgroups(Math.ceil(h / bC), f), c.setPipeline(o), c.dispatchWorkgroups(Math.ceil(D / bC), f), c.end();
    }
  );
}
function ht(A, I = !1) {
  const g = new Float64Array(5), B = new Float64Array(4);
  ct(g, B, A);
  const C = Float64Array.of(
    0,
    B[1] - g[1] * B[0],
    B[2] - g[2] * B[0],
    B[3] - g[3] * B[0],
    -g[4] * B[0]
  ), i = 1 + g[1] + g[2] + g[3] + g[4], e = (B[0] + B[1] + B[2] + B[3]) / i, E = (C[1] + C[2] + C[3] + C[4]) / i;
  return {
    sigma: A,
    negative: I,
    a: g,
    b_causal: B,
    b_anticausal: C,
    sum_causal: e,
    sum_anticausal: E
  };
}
function ct(A, I, g) {
  const C = Float64Array.of(
    0.84,
    1.8675,
    0.84,
    -1.8675,
    -0.34015,
    -0.1299,
    -0.34015,
    0.1299
  ), i = Math.exp(-1.783 / g), e = Math.exp(-1.723 / g), E = 0.6318 / g, Q = 1.997 / g, t = Float64Array.of(
    -i * Math.cos(E),
    i * Math.sin(E),
    -i * Math.cos(-E),
    i * Math.sin(-E),
    -e * Math.cos(Q),
    e * Math.sin(Q),
    -e * Math.cos(-Q),
    e * Math.sin(-Q)
  ), o = g * 2.5066282746310007, r = Float64Array.of(C[0], C[1], 0, 0, 0, 0, 0, 0), l = Float64Array.of(1, 0, t[0], t[1], 0, 0, 0, 0, 0, 0);
  let s, a;
  for (a = 2; a < 8; a += 2) {
    for (r[a] = t[a] * r[a - 2] - t[a + 1] * r[a - 1], r[a + 1] = t[a] * r[a - 1] + t[a + 1] * r[a - 2], s = a - 2; s > 0; s -= 2)
      r[s] += t[a] * r[s - 2] - t[a + 1] * r[s - 1], r[s + 1] += t[a] * r[s - 1] + t[a + 1] * r[s - 2];
    for (s = 0; s <= a; s += 2)
      r[s] += C[a] * l[s] - C[a + 1] * l[s + 1], r[s + 1] += C[a] * l[s + 1] + C[a + 1] * l[s];
    for (l[a + 2] = t[a] * l[a] - t[a + 1] * l[a + 1], l[a + 3] = t[a] * l[a + 1] + t[a + 1] * l[a], s = a; s > 0; s -= 2)
      l[s] += t[a] * l[s - 2] - t[a + 1] * l[s - 1], l[s + 1] += t[a] * l[s - 1] + t[a + 1] * l[s - 2];
  }
  for (a = 0; a < 4; ++a)
    s = a << 1, I[a] = r[s] / o, A[a + 1] = l[s + 2];
}
function Qi(A) {
  let I = ht(A);
  return {
    kde_causal: [I.b_causal[0], I.b_causal[1], I.b_causal[2], I.b_causal[3]],
    kde_anticausal: [I.b_anticausal[1], I.b_anticausal[2], I.b_anticausal[3], I.b_anticausal[4]],
    kde_a: [I.a[1], I.a[2], I.a[3], I.a[4]]
  };
}
const Dt = `// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

enable f16;

struct Uniforms {
  count: u32,
  category_count: u32,
  framebuffer_width: i32,
  framebuffer_height: i32,
  density_width: i32,
  density_height: i32,
  gamma: f32,
  point_size: f32,
  point_alpha: f32,
  points_alpha: f32,
  density_scaler: f32,
  quantization_step: f32,
  density_alpha: f32,
  contours_alpha: f32,
  matrix: mat3x3<f32>,
  view_xy_scaler: vec2<f32>,
  kde_causal: vec4<f32>,
  kde_anticausal: vec4<f32>,
  kde_a: vec4<f32>,
  background_color: vec4<f32>,
  category_colors: array<vec4<f32>, 256>,
}

struct PointData {
  position: vec3<f32>,
  category: u32,
}

struct FragmentOutput {
  @location(0) color: vec4<f32>,
  @location(1) log1malpha: f32, // log(1 - alpha)
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@group(1) @binding(0) var<storage, read> x_buffer: array<f32>;
@group(1) @binding(1) var<storage, read> y_buffer: array<f32>;
@group(1) @binding(2) var<storage, read> category_buffer: array<u32>;

@group(2) @binding(0) var<storage, read_write> count_buffer: array<atomic<u32>>;
@group(2) @binding(1) var<storage, read_write> blur_buffer: array<f16>;
@group(2) @binding(2) var<storage, read_write> blur_swap_buffer: array<f16>;

@group(3) @binding(0) var framebuffer_sampler: sampler;
@group(3) @binding(1) var color_texture: texture_2d<f32>;
@group(3) @binding(2) var log1malpha_texture: texture_2d<f32>;

fn get_point(index: u32) -> PointData {
  var result: PointData;
  result.position = vec3(x_buffer[index], y_buffer[index], 1.0);
  if (uniforms.category_count > 1) {
    result.category = (category_buffer[index >> 2] >> ((index & 3) << 3)) & 0xff;
  } else {
    result.category = 0;
  }
  return result;
}

const ACCUMULATE_UNIT: u32 = 4096;

fn increment_count(x: i32, y: i32, category: u32, value: u32) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  if (x < 0 || x >= width || y < 0 || y >= height || category >= uniforms.category_count || value == 0) {
    return;
  }
  let offset = (y * width + x) + i32(category) * (width * height);
  atomicAdd(&count_buffer[offset], value);
}

@compute @workgroup_size(64, 1)
fn accumulate(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let index = id.y * 4096 + id.x; // 4096 = 64 * 64
  if (index >= uniforms.count) { return; }
  let point = get_point(index);
  let pos = uniforms.matrix * point.position;
  let x = (pos.x + 1.0) / 2.0 * f32(width) - 0.5;
  let y = (pos.y + 1.0) / 2.0 * f32(height) - 0.5;
  let ix = i32(x);
  let iy = i32(y);
  let tx = x - f32(ix);
  let ty = y - f32(iy);
  let w1: u32 = u32((1 - tx) * (1 - ty) * f32(ACCUMULATE_UNIT));
  let w2: u32 = u32(tx * (1 - ty) * f32(ACCUMULATE_UNIT));
  let w3: u32 = u32((1 - tx) * ty * f32(ACCUMULATE_UNIT));
  let w123 = w1 + w2 + w3;
  var w4: u32 = select(0, ACCUMULATE_UNIT - w123, w123 < ACCUMULATE_UNIT);
  increment_count(ix, iy, point.category, w1);
  increment_count(ix + 1, iy, point.category, w2);
  increment_count(ix, iy + 1, point.category, w3);
  increment_count(ix + 1, iy + 1, point.category, w4);
}

// Draw Discrete Points

struct PointsVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) dp: vec3<f32>,
  @location(1) color: vec4<f32>,
}

@vertex
fn points_vs(
  @builtin(instance_index) index: u32,
  @builtin(vertex_index) part: u32,
) -> PointsVertexOutput {
  let framebuffer_size = vec2(f32(uniforms.framebuffer_width), f32(uniforms.framebuffer_height));
  let alpha = uniforms.point_alpha * uniforms.points_alpha;
  let dp = vec2<f32>(f32(part % 2), f32(part / 2)) * 2.0 - 1.0;
  let point = get_point(index);
  let pos = uniforms.matrix * point.position;

  var out: PointsVertexOutput;
  out.position = vec4<f32>(pos.xy + dp * uniforms.point_size / framebuffer_size * 2.0, 0.0, 1.0);
  out.dp = vec3(dp, uniforms.point_size);
  out.color = uniforms.category_colors[point.category] * alpha;
  return out;
}

@fragment
fn points_fs(in: PointsVertexOutput) -> FragmentOutput {
  let r = length(in.dp.xy) * in.dp.z;
  let a = max(0.0, min(1.0, in.dp.z - r));
  var out: FragmentOutput;
  out.color = in.color * a;
  out.log1malpha = log(1 - out.color.a);
  return out;
}

// Draw Density Map

struct DrawDensityMapVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texture_coord: vec2<f32>,
}

@vertex
fn draw_density_map_vs(
  @builtin(vertex_index) part: u32,
) -> DrawDensityMapVertexOutput {
  let framebuffer_size = vec2(f32(uniforms.framebuffer_width), f32(uniforms.framebuffer_height));
  let dp = vec2<f32>(f32(part % 2), f32(part / 2)) * 2.0 - 1.0;
  var out: DrawDensityMapVertexOutput;
  out.position = vec4(dp, 0.0, 1.0);
  out.texture_coord = (vec2(dp.x, dp.y) + 1.0) / 2.0 * framebuffer_size;
  return out;
}

fn get_density_raw(x: i32, y: i32, category: u32) -> f32 {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let density_scaler = uniforms.density_scaler;
  if (x < 0 || x >= width || y < 0 || y >= height) {
    return 0.0;
  }
  let offset = (y * width + x) + i32(category) * (width * height);
  return max(0.0, f32(blur_buffer[offset]) * density_scaler);
}

fn get_density(x: f32, y: f32, category: u32) -> f32 {
  let px = x / f32(uniforms.framebuffer_width) * f32(uniforms.density_width) - 0.5;
  let py = y / f32(uniforms.framebuffer_height) * f32(uniforms.density_height) - 0.5;
  let ix = i32(px);
  let iy = i32(py);
  let tx = px - f32(ix);
  let ty = py - f32(iy);
  let v00 = get_density_raw(ix, iy, category);
  let v10 = get_density_raw(ix + 1, iy, category);
  let v01 = get_density_raw(ix, iy + 1, category);
  let v11 = get_density_raw(ix + 1, iy + 1, category);
  return mix(mix(v00, v10, tx), mix(v01, v11, tx), ty);
}

fn get_density_quantized(x: f32, y: f32, category: u32) -> f32 {
  let v = get_density(x, y, category);
  return floor(clamp(v, 0, 1) / uniforms.quantization_step);
}

fn get_density_quantized_sobel(x: f32, y: f32, category: u32) -> vec2<f32> {
  let v11 = get_density_quantized(x - 1, y - 1, category);
  let v21 = get_density_quantized(x, y - 1, category);
  let v31 = get_density_quantized(x + 1, y - 1, category);
  let v12 = get_density_quantized(x - 1, y, category);
  let v22 = get_density_quantized(x, y, category);
  let v32 = get_density_quantized(x + 1, y, category);
  let v13 = get_density_quantized(x - 1, y + 1, category);
  let v23 = get_density_quantized(x, y + 1, category);
  let v33 = get_density_quantized(x + 1, y + 1, category);
  let gx = v11 + v12 * 2.0 + v13 - v31 - v32 * 2.0 - v33;
  let gy = v11 + v21 * 2.0 + v31 - v13 - v23 * 2.0 - v33;
  return vec2(gx, gy);
}

@fragment
fn draw_density_map_fs(in: DrawDensityMapVertexOutput) -> FragmentOutput {
  let px = in.texture_coord.x;
  let py = in.texture_coord.y;
  let quantization_step: f32 = uniforms.quantization_step;

  var sum_color: vec4<f32> = vec4(0);
  var sum_log1malpha: f32 = 0.0;

  for (var i: u32 = 0; i < uniforms.category_count; i++) {
    let density = get_density(px, py, i);
    var alpha = min(1.0, floor(density / quantization_step) * quantization_step);
    alpha *= uniforms.density_alpha;
    let color = uniforms.category_colors[i] * alpha;
    sum_color += color;
    sum_log1malpha += log(1 - color.a);
  }

  if (uniforms.contours_alpha > 0.0) {
    for (var i: u32 = 0; i < uniforms.category_count; i++) {
      let sobel = get_density_quantized_sobel(px, py, i);
      let alpha = clamp(length(sobel) * 0.2, 0.0, 1.0) * uniforms.contours_alpha;
      let color = uniforms.category_colors[i] * alpha;
      sum_color += color;
      sum_log1malpha += log(1 - color.a);
    }
  }

  var out: FragmentOutput;
  out.color = sum_color;
  out.log1malpha = sum_log1malpha;
  return out;
}

// Gamma Correction

struct GammaCorrectionVertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texture_coord: vec2<f32>,
}

@vertex
fn gamma_correction_vs(
  @builtin(vertex_index) part: u32,
) -> GammaCorrectionVertexOutput {
  let dp = vec2<f32>(f32(part % 2), f32(part / 2)) * 2.0 - 1.0;
  var out: GammaCorrectionVertexOutput;
  out.position = vec4(dp * uniforms.view_xy_scaler, 0.0, 1.0);
  out.texture_coord = (vec2(dp.x, -dp.y) + 1.0) / 2.0;
  return out;
}

@fragment
fn gamma_correction_fs(in: GammaCorrectionVertexOutput) -> @location(0) vec4<f32> {
  let sum_color = textureSample(color_texture, framebuffer_sampler, in.texture_coord);
  let sum_log_one_minus_alpha = textureSample(log1malpha_texture, framebuffer_sampler, in.texture_coord).r;
  var color: vec4<f32>;
  if (sum_color.a > 0.0) {
    color = sum_color / sum_color.a * (1.0 - exp(sum_log_one_minus_alpha));
    color = color + uniforms.background_color * (1 - color.a);
  } else {
    color = uniforms.background_color;
  }
  let rgb = pow(color.rgb, vec3(1.0 / uniforms.gamma));
  return vec4(rgb, 1.0);
}

// Gaussian Blur

@compute @workgroup_size(64, 1)
fn gaussian_blur_stage_1(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let x = id.x;
  if (x >= u32(width)) { return; }
  let start = x + id.y * u32(width * height);
  let count = u32(height);
  let stride = u32(width);

  deriche_conv_1d(
    &blur_buffer, &blur_swap_buffer, start, stride, count,
    uniforms.kde_causal, uniforms.kde_anticausal, uniforms.kde_a,
    true
  );
}

@compute @workgroup_size(64, 1)
fn gaussian_blur_stage_2(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = uniforms.density_width;
  let height = uniforms.density_height;
  let y = id.x;
  if (y >= u32(height)) { return; }
  let start = y * u32(width) + id.y * u32(width * height);
  let count = u32(width);
  let stride = u32(1);

  deriche_conv_1d(
    &blur_swap_buffer, &blur_buffer, start, stride, count,
    uniforms.kde_causal, uniforms.kde_anticausal, uniforms.kde_a,
    false
  );
}

fn deriche_conv_1d(
    src: ptr<storage, array<f16>, read_write>,
    dst: ptr<storage, array<f16>, read_write>,
    start: u32, stride: u32, count: u32,
    kde_causal: vec4<f32>, kde_anticausal: vec4<f32>, kde_a: vec4<f32>,
    src_is_u32: bool
) {
  var s: vec4<f32> = vec4(0.0);
  var y0: f32 = 0.0;
  var y1234: vec4<f32> = vec4(0.0);

  var first_nonzero: u32 = count;
  var last_nonzero: u32 = 0;

  for (var i: u32 = 0; i < count; i++) {
    let offset = start + i * stride;
    var input: f32;
    if (src_is_u32) {
      input = f32(bitcast<u32>(vec2((*src)[offset * 2], (*src)[offset * 2 + 1]))) / f32(ACCUMULATE_UNIT);
    } else {
      input = f32((*src)[offset]);
    }
    if (input != 0.0) {
      first_nonzero = min(i, first_nonzero);
      last_nonzero = max(i, last_nonzero);
    }
    s = vec4(input, s.xyz);
    y1234 = vec4(y0, y1234.xyz);
    y0 = dot(kde_causal, s) - dot(kde_a, y1234);
    (*dst)[offset] = f16(y0);
  }

  if (first_nonzero > last_nonzero) {
    return;
  }

  s = vec4(0.0);
  y0 = 0.0;
  y1234 = vec4(0.0);

  for (var i: u32 = count - 1 - last_nonzero; i < count; i++) {
    let p = count - 1 - i;
    let offset = start + p * stride;
    var input: f32 = 0.0;
    if (p >= first_nonzero) {
      if (src_is_u32) {
        input = f32(bitcast<u32>(vec2((*src)[offset * 2], (*src)[offset * 2 + 1]))) / f32(ACCUMULATE_UNIT);
      } else {
        input = f32((*src)[offset]);
      }
    }
    y1234 = vec4(y0, y1234.xyz);
    y0 = dot(kde_anticausal, s) - dot(kde_a, y1234);
    s = vec4(input, s.xyz);
    if (y0 != 0.0) {
      (*dst)[offset] = f16(f32((*dst)[offset]) + y0);
    }
  }
}
`;
class ut {
  props;
  viewport;
  df;
  device;
  module;
  uniforms;
  context;
  renderInputs;
  dataBuffers;
  renderer;
  constructor(I, g, B, C, i) {
    this.context = I, this.props = {
      mode: "points",
      colorScheme: "light",
      x: new Float32Array(),
      y: new Float32Array(),
      category: null,
      categoryCount: 1,
      categoryColors: null,
      viewportX: 0,
      viewportY: 0,
      viewportScale: 1,
      pointSize: 1,
      pointAlpha: 1,
      pointsAlpha: 1,
      densityScaler: 1,
      densityBandwidth: 1,
      densityQuantizationStep: 0.1,
      contoursAlpha: 1,
      densityAlpha: 1,
      gamma: 2.2,
      width: C,
      height: i
    }, this.viewport = new Vg({ x: 0, y: 0, scale: 1 }, C, i), this.df = new HI();
    let e = this.df;
    this.renderInputs = {
      mode: e.value(this.props.mode),
      colorScheme: e.value(this.props.colorScheme),
      xData: e.value(this.props.x),
      yData: e.value(this.props.y),
      categoryData: e.value(this.props.category),
      categoryCount: e.value(this.props.categoryCount),
      categoryColors: e.value(this.props.categoryColors),
      matrix: e.value(je()),
      width: e.value(C),
      height: e.value(i),
      pointSize: e.value(this.props.pointSize),
      densityBandwidth: e.value(this.props.densityBandwidth)
    }, this.device = e.value(g), this.dataBuffers = ft(e, this.device, this.renderInputs), this.module = e.derive([this.device], (E) => E.createShaderModule({ code: Dt })), this.uniforms = nt(e, this.device), this.renderer = wt(
      e,
      this.device,
      this.module,
      this.uniforms,
      B,
      this.renderInputs,
      this.dataBuffers
    );
  }
  setProps(I) {
    let g = !1, B;
    for (B in I)
      I[B] !== this.props[B] && (this.props[B] = I[B], g = !0);
    return this.viewport.update(
      { x: this.props.viewportX, y: this.props.viewportY, scale: this.props.viewportScale },
      this.props.width,
      this.props.height
    ), this.renderInputs.mode.value = this.props.mode, this.renderInputs.colorScheme.value = this.props.colorScheme, this.renderInputs.xData.value = this.props.x, this.renderInputs.yData.value = this.props.y, this.renderInputs.categoryData.value = this.props.category, this.renderInputs.categoryColors.value = this.props.categoryColors, this.props.category != null ? this.renderInputs.categoryCount.value = this.props.categoryCount : this.renderInputs.categoryCount.value = 1, this.renderInputs.matrix.value = this.viewport.matrix(), this.renderInputs.width.value = this.props.width, this.renderInputs.height.value = this.props.height, this.renderInputs.pointSize.value = this.props.pointSize, this.renderInputs.densityBandwidth.value = this.props.densityBandwidth, g;
  }
  render() {
    this.renderer.value(this.props, this.context.getCurrentTexture().createView());
  }
  destroy() {
    this.df.destroy();
  }
  async densityMap(I, g, B, C) {
    let i = this.df.subgraph(), { x: e, y: E, scale: Q } = C, t = [Q, 0, 0, 0, Q, 0, -e * Q, -E * Q, 1], o = Ai(t), l = await yt(
      i,
      this.device,
      this.module,
      this.uniforms,
      i.value(I),
      i.value(g),
      i.value(B),
      i.value(t),
      this.dataBuffers
    ).value();
    return i.destroy(), {
      data: l,
      width: I,
      height: g,
      coordinateAtPixel: (s, a) => {
        let h = s / I * 2 - 1, D = a / g * 2 - 1, f = $e([h, D, 1], o);
        return { x: f[0], y: f[1] };
      }
    };
  }
}
function ft(A, I, g) {
  let B = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  const C = A.derive([g.xData], (o) => o.length), i = A.derive([C], (o) => o * 4), e = C, E = A.statefulDerive(
    [I, A.statefulDerive([I, i, B], WI), g.xData],
    CB
  ), Q = A.statefulDerive(
    [I, A.statefulDerive([I, i, B], WI), g.yData],
    CB
  ), t = A.statefulDerive(
    [I, A.statefulDerive([I, e, B], WI), g.categoryData],
    CB
  );
  return { x: E, y: Q, category: t, count: C };
}
function Ei(A, I, g, B, C, i, e) {
  let E = "rgba16float", Q = "r16float", t = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, o = A.statefulDerive(
    [I, g, B, E, t],
    sC
  ), r = A.statefulDerive(
    [I, g, B, Q, t],
    sC
  ), l = A.derive(
    [C, i, e],
    (D, f, y) => D * f * y * 4
    // w * h * categoryCount * sizeof(uint32)
  ), s = A.derive(
    [C, i, e],
    (D, f, y) => D * f * y * 2
    // w * h * categoryCount * sizeof(f16)
  ), a = A.statefulDerive(
    [I, l, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC],
    WI
  ), h = A.statefulDerive([I, s, GPUBufferUsage.STORAGE], WI);
  return {
    colorTexture: o,
    alphaTexture: r,
    colorTextureFormat: E,
    alphaTextureFormat: Q,
    countBuffer: a,
    blurBuffer: h
  };
}
function wt(A, I, g, B, C, i, e) {
  let Q = A.derive([i.densityBandwidth], (d) => Math.ceil(d * 3) + 1), t = A.derive([i.width, Q], (d, R) => d + R * 2), o = A.derive([i.height, Q], (d, R) => d + R * 2), r = A.derive([t], (d) => Math.ceil(d / 4)), l = A.derive([o], (d) => Math.ceil(d / 4)), s = Ei(
    A,
    I,
    t,
    o,
    r,
    l,
    i.categoryCount
  ), a = ei(A, I, B.buffer, e, s), h = Ci(A, I, g, a, e, s), D = st(A, I, g, a, e, s), f = at(A, I, g, a, s), y = lt(A, I, g, C, a), c = ii(A, I, g, a, t, o, i.categoryCount), G = A.derive(
    [i.densityBandwidth, t, r],
    (d, R, L) => Qi(d / R * L)
  ), S = A.derive(
    [i.categoryColors, i.categoryCount],
    (d, R) => (d == null && (d = IB(R)), d.map((L) => gC(L)))
  );
  return A.derive(
    [
      I,
      t,
      o,
      r,
      l,
      B.update,
      e.count,
      i.matrix,
      S,
      D,
      y,
      h,
      c,
      f,
      G
    ],
    (d, R, L, m, CA, IA, b, QA, O, eA, Z, K, aA, z, EA) => (H, RA) => {
      let LA = H.colorScheme == "light" ? [1, 1, 1, 1] : [0, 0, 0, 1], sA = H.width / R, fA = H.height / L, HA = BC([sA, 0, 0, 0, fA, 0, 0, 0, 1], QA);
      IA({
        count: b,
        category_count: H.categoryCount,
        framebuffer_width: R,
        framebuffer_height: L,
        density_width: m,
        density_height: CA,
        gamma: H.gamma,
        point_size: Math.max(H.mode == "points" ? 3 : 1, H.pointSize),
        point_alpha: H.pointAlpha,
        points_alpha: H.pointsAlpha,
        density_scaler: H.densityScaler / 16,
        quantization_step: H.densityQuantizationStep,
        density_alpha: H.densityAlpha,
        contours_alpha: H.contoursAlpha,
        matrix: HA,
        view_xy_scaler: [1 / sA, 1 / fA],
        kde_causal: EA.kde_causal,
        kde_anticausal: EA.kde_anticausal,
        kde_a: EA.kde_a,
        background_color: LA,
        category_colors: O
      });
      let NA = d.createCommandEncoder();
      eA(NA), H.mode == "density" && (H.densityAlpha > 0 || H.contoursAlpha > 0) && (K(NA), aA(NA), z(NA)), Z(NA, RA), d.queue.submit([NA.finish()]);
    }
  );
}
function yt(A, I, g, B, C, i, e, E, Q) {
  let t = Ei(A, I, C, i, C, i, A.value(1)), o = ei(A, I, B.buffer, Q, t), r = Ci(A, I, g, o, Q, t), l = ii(A, I, g, o, C, i, A.value(1));
  return A.derive(
    [
      I,
      C,
      i,
      Q.count,
      B.update,
      e,
      E,
      r,
      l,
      t.countBuffer
    ],
    (s, a, h, D, f, y, c, G, S, d) => () => {
      let R = s.createCommandEncoder(), L = Qi(y);
      f({
        count: D,
        category_count: 1,
        framebuffer_width: a,
        framebuffer_height: h,
        density_width: a,
        density_height: h,
        gamma: 1,
        point_size: 0,
        point_alpha: 0,
        points_alpha: 0,
        density_scaler: 0,
        quantization_step: 0,
        density_alpha: 0,
        contours_alpha: 0,
        matrix: c,
        view_xy_scaler: [1, 1],
        kde_causal: L.kde_causal,
        kde_anticausal: L.kde_anticausal,
        kde_a: L.kde_a,
        background_color: [0, 0, 0, 0],
        category_colors: []
      }), G(R), S(R);
      let m = s.createBuffer({
        size: a * h * 2,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      return R.copyBufferToBuffer(d, 0, m, 0, a * h * 2), s.queue.submit([R.finish()]), m.mapAsync(GPUMapMode.READ, 0, a * h * 2).then(() => dt(m.getMappedRange()));
    }
  );
}
function dt(A) {
  let I = new Uint16Array(A), g = new Uint32Array(I.length);
  for (let B = 0; B < I.length; B++) {
    let C = I[B] & 32767, i = I[B] & 32768, e = I[B] & 31744;
    C <<= 13, i <<= 16, C += 939524096, C = e == 0 ? 0 : C, C |= i, g[B] = C;
  }
  return new Float32Array(g.buffer);
}
function Ft(A) {
  return A && A.__esModule && Object.prototype.hasOwnProperty.call(A, "default") ? A.default : A;
}
var lB = { exports: {} }, qC;
function St() {
  return qC || (qC = 1, function(A) {
    (function() {
      function I(E, Q) {
        var t = E.x - Q.x, o = E.y - Q.y;
        return t * t + o * o;
      }
      function g(E, Q, t) {
        var o = Q.x, r = Q.y, l = t.x - o, s = t.y - r;
        if (l !== 0 || s !== 0) {
          var a = ((E.x - o) * l + (E.y - r) * s) / (l * l + s * s);
          a > 1 ? (o = t.x, r = t.y) : a > 0 && (o += l * a, r += s * a);
        }
        return l = E.x - o, s = E.y - r, l * l + s * s;
      }
      function B(E, Q) {
        for (var t = E[0], o = [t], r, l = 1, s = E.length; l < s; l++)
          r = E[l], I(r, t) > Q && (o.push(r), t = r);
        return t !== r && o.push(r), o;
      }
      function C(E, Q, t, o, r) {
        for (var l = o, s, a = Q + 1; a < t; a++) {
          var h = g(E[a], E[Q], E[t]);
          h > l && (s = a, l = h);
        }
        l > o && (s - Q > 1 && C(E, Q, s, o, r), r.push(E[s]), t - s > 1 && C(E, s, t, o, r));
      }
      function i(E, Q) {
        var t = E.length - 1, o = [E[0]];
        return C(E, 0, t, Q, o), o.push(E[t]), o;
      }
      function e(E, Q, t) {
        if (E.length <= 2) return E;
        var o = Q !== void 0 ? Q * Q : 1;
        return E = t ? E : B(E, o), E = i(E, o), E;
      }
      A.exports = e, A.exports.default = e;
    })();
  }(lB)), lB.exports;
}
var Gt = St();
const _C = /* @__PURE__ */ Ft(Gt);
function Rt(A, I) {
  let g = A.slice();
  for (let B = 0; B < I; B++) {
    const C = [], i = g.length;
    for (let e = 0; e < i; e++) {
      const E = g[e], Q = g[(e + 1) % i], t = {
        x: 0.75 * E.x + 0.25 * Q.x,
        y: 0.75 * E.y + 0.25 * Q.y
      }, o = {
        x: 0.25 * E.x + 0.75 * Q.x,
        y: 0.25 * E.y + 0.75 * Q.y
      };
      C.push(t, o);
    }
    g = C;
  }
  return g;
}
function Nt(A, I) {
  const g = Rt(A, 5), B = Ve(g);
  let C = Math.max(B.xMax - B.xMin, B.yMax - B.yMin) / 100, i = _C(g, C), e = 0;
  for (; i.length > I && e < 20; )
    C *= 1.1, e += 1, i = _C(g, C);
  return i;
}
const TC = {
  light: {
    fontFamily: "system-ui,sans-serif",
    clusterLabelColor: "#000",
    clusterLabelOutlineColor: "rgba(255,255,255,0.8)",
    clusterLabelOpacity: 0.8,
    statusBar: !0,
    statusBarTextColor: "#525252",
    statusBarBackgroundColor: "rgba(255,255,255,0.9)",
    brandingLink: { text: "Embedding Atlas", href: "https://apple.github.io/embedding-atlas" }
  },
  dark: {
    fontFamily: "system-ui,sans-serif",
    clusterLabelColor: "#fff",
    clusterLabelOutlineColor: "rgba(0,0,0,0.8)",
    clusterLabelOpacity: 0.8,
    statusBar: !0,
    statusBarTextColor: "#d9d9d9",
    statusBarBackgroundColor: "rgba(0,0,0,0.9)",
    brandingLink: { text: "Embedding Atlas", href: "https://apple.github.io/embedding-atlas" }
  }
};
function Mt(A, I) {
  return A == null ? TC[I] : { ...TC[I], ...A, ...A[I] != null ? A[I] : {} };
}
let hB = null, kB = /* @__PURE__ */ new Map();
function Ut() {
  return hB == null && (hB = new Promise((A, I) => {
    let g = new Worker(new URL("./clustering.worker.js", import.meta.url), { type: "module" });
    g.onmessage = (B) => {
      if (B.data.ready) {
        A(g);
        return;
      }
      if (B.data.id != null) {
        let C = kB.get(B.data.id);
        C != null && (kB.delete(B.data.id), C(B.data));
      }
    };
  })), hB;
}
function ti(A, I, g = []) {
  return new Promise((B, C) => {
    Ut().then((i) => {
      let e = (/* @__PURE__ */ new Date()).getTime().toString() + "-" + Math.random().toString();
      kB.set(e, (E) => {
        B(E.payload);
      }), i.postMessage({ id: e, name: A, payload: I }, g);
    });
  });
}
let kt = (A, I, g, B) => ti("findClusters", { density_map: A, width: I, height: g, options: B }, [A.buffer]), Jt = (A, I) => ti("dynamicLabelPlacement", { labels: A, options: I });
function Yt(A, I, g, B, C, i) {
  let e = Math.max(B, C) / i, E = A / (g * g) / (e * e), t = 1 / (E / (i * i)) * 0.2, o = Math.sqrt(A / I / (e * e)), r = Math.log(o), l = Math.log(g), s = (Math.min(Math.max((l - r) * 2, -1), 1) + 1) / 2, a = 0.25 / Math.sqrt(E), h = Math.max(0.2, Math.min(5, a)) * i, D = 1 - s, f = 0.5 + s * 0.5;
  return {
    densityScaler: t,
    densityAlpha: D,
    contoursAlpha: D,
    pointSize: h,
    pointAlpha: 0.7,
    pointsAlpha: f,
    densityBandwidth: 20
  };
}
var mt = /* @__PURE__ */ dI("<div></div>"), Kt = /* @__PURE__ */ sI("<circle></circle>"), pt = /* @__PURE__ */ sI("<circle></circle>"), xt = /* @__PURE__ */ sI('<text dominant-baseline="middle"> </text>'), Lt = /* @__PURE__ */ sI("<g></g>"), vt = /* @__PURE__ */ sI("<g><!></g>"), Ht = /* @__PURE__ */ sI("<g></g>"), bt = /* @__PURE__ */ dI('<div><canvas></canvas> <div><!></div> <svg role="none"><!><!><!><!></svg> <!> <!></div>');
function oi(A, I) {
  wI(I, !0);
  let g = F(I, "data", 19, () => ({ x: new Float32Array(), y: new Float32Array(), category: null })), B = F(I, "categoryCount", 3, 1), C = F(I, "categoryColors", 3, null), i = F(I, "width", 3, 800), e = F(I, "height", 3, 800), E = F(I, "pixelRatio", 3, 2), Q = F(I, "colorScheme", 3, "light"), t = F(I, "theme", 3, null), o = F(I, "mode", 3, "density"), r = F(I, "minimumDensity", 3, 1 / 16), l = F(I, "totalCount", 3, null), s = F(I, "maxDensity", 3, null), a = F(I, "automaticLabels", 3, !1), h = F(I, "queryClusterLabels", 3, null), D = F(I, "tooltip", 7, null), f = F(I, "selection", 7, null), y = F(I, "querySelection", 3, null), c = F(I, "rangeSelection", 7, null), G = F(I, "defaultViewportState", 3, null), S = F(I, "viewportState", 7, null), d = F(I, "customTooltip", 3, null), R = F(I, "customOverlay", 3, null), L = F(I, "onViewportState", 3, null), m = F(I, "onTooltip", 3, null), CA = F(I, "onSelection", 3, null), IA = F(I, "onRangeSelection", 3, null), b = /* @__PURE__ */ k(() => Mt(t(), Q())), QA = /* @__PURE__ */ k(() => C() ?? IB(B())), O = /* @__PURE__ */ k(() => S() ?? G() ?? { x: 0, y: 0, scale: 1 }), eA = /* @__PURE__ */ k(() => new Vg(n(O), i(), e())), Z = /* @__PURE__ */ k(() => n(eA).pixelLocationFunction()), K = /* @__PURE__ */ k(() => n(eA).coordinateAtPixelFunction());
  function aA(w, M) {
    return w.x == M.x && w.y == M.y && w.category == M.category && w.text == M.text;
  }
  let z = /* @__PURE__ */ k(() => f()?.length == 1 && D() != null && aA(f()[0], D()));
  function EA(w) {
    hI(S(), w) || (S(w), L()?.(w));
  }
  function H(w) {
    hI(D(), w) || (D(w), m()?.(w));
  }
  function RA(w) {
    hI(f(), w) || (f(w), CA()?.(w));
  }
  function LA(w) {
    hI(c(), w) || (c(w), IA()?.(w));
  }
  let sA = /* @__PURE__ */ iA(RI([])), fA = /* @__PURE__ */ iA(null), vA = /* @__PURE__ */ iA("none"), HA = /* @__PURE__ */ k(() => i() * E()), NA = /* @__PURE__ */ k(() => e() * E()), yA = /* @__PURE__ */ iA(null), $ = /* @__PURE__ */ iA(null), p = /* @__PURE__ */ iA(null), q = /* @__PURE__ */ k(() => Yt(s() ?? (l() ?? g().x.length) / 4, r(), n(O).scale, n(HA), n(NA), E())), lA = /* @__PURE__ */ k(() => n(q).pointSize), dA = !0;
  _g(() => {
    n($)?.setProps({
      mode: o(),
      colorScheme: Q(),
      viewportX: n(O).x,
      viewportY: n(O).y,
      viewportScale: n(O).scale,
      width: n(HA),
      height: n(NA),
      x: g().x,
      y: g().y,
      category: g().category,
      categoryCount: B(),
      categoryColors: n(QA),
      ...n(q)
    }) && (Ig(), a() !== !1 && dA && n($) != null && g().x != null && g().x.length > 0 && G() != null && (dA = !1, iC(G())));
  });
  function wA() {
    bA = null, !(!n(yA) || !n($)) && (n(yA).width = n($).props.width, n(yA).height = n($).props.height, n(yA).style.width = `${n($).props.width / E()}px`, n(yA).style.height = `${n($).props.height / E()}px`, n($).render());
  }
  let bA = null;
  function Ig() {
    bA == null && (bA = requestAnimationFrame(wA));
  }
  function BI(w) {
    let M;
    function N() {
      M = w.getContext("webgl2", { antialias: !1 }), M.getExtension("EXT_color_buffer_float"), M.getExtension("EXT_float_blend"), M.getExtension("OES_texture_float_linear"), x($, new Ct(M, n(HA), n(NA)), !0);
    }
    N(), w.addEventListener("webglcontextlost", () => {
      n($)?.destroy(), x($, null), M = null;
    }), w.addEventListener("webglcontextrestored", () => {
      N();
    });
  }
  function XA(w) {
    async function M() {
      let N = w.getContext("webgpu");
      if (N == null) {
        console.error("Could not get WebGPU canvas context");
        return;
      }
      let J = await navigator.gpu.requestAdapter();
      if (!J) {
        console.error("Could not request WebGPU adapter");
        return;
      }
      let Y = 512 * 1048576, _ = 512 * 1048576;
      Y = Math.min(Y, J.limits.maxBufferSize), _ = Math.min(_, J.limits.maxStorageBufferBindingSize);
      let X = {
        requiredLimits: { maxBufferSize: Y, maxStorageBufferBindingSize: _ },
        requiredFeatures: ["shader-f16"]
      }, gA = await J.requestDevice(X);
      gA.lost.then((P) => {
        console.info(`WebGPU device was lost: ${P.message}`), P.reason != "destroyed" && (n($)?.destroy(), x($, null), M());
      });
      let v = navigator.gpu.getPreferredCanvasFormat();
      N.configure({ device: gA, format: v, alphaMode: "premultiplied" }), x($, new ut(N, gA, v, n(HA), n(NA)), !0);
    }
    M();
  }
  function FI(w) {
    w != null && S() == null && EA(w);
  }
  _g(() => FI(G())), $B(() => {
    n(yA) != null && (ZC() ? XA(n(yA)) : (BI(n(yA)), x(p, "WebGPU is unavailable. If you are using Safari, please enable the WebGPU feature flag.")));
  }), HQ(() => {
    n($)?.destroy(), x($, null);
  });
  function SI(w, M) {
    let { x: N, y: J, scale: Y } = n(O);
    H(null);
    let _ = Math.min(100, Math.max(0.01, Y * w)), X = n(yA).getBoundingClientRect(), gA = Math.max(X.width, X.height), v = (M.x - X.width / 2) / gA * 2, P = (X.height / 2 - M.y) / gA * 2, SA = N + v / Y - v / _, oA = J + P / Y - P / _;
    EA({ x: SA, y: oA, scale: _ });
  }
  function li(w, M) {
    H(null);
    let N = "pan";
    switch (n(vA) != "none" ? M.shift || (N = n(vA)) : M.shift && (N = M.meta ? "lasso" : "marquee"), N) {
      case "marquee":
        return {
          move: (J) => {
            if (H(null), n($) == null)
              return;
            let Y = n(K)(w.x, w.y), _ = n(K)(J.x, J.y);
            LA({
              xMin: Math.min(Y.x, _.x),
              yMin: Math.min(Y.y, _.y),
              xMax: Math.max(Y.x, _.x),
              yMax: Math.max(Y.y, _.y)
            });
          }
        };
      case "lasso": {
        let J = [n(K)(w.x, w.y)];
        return {
          move: (Y) => {
            H(null), n($) != null && (J = [...J, n(K)(Y.x, Y.y)], J.length >= 3 && LA(Nt(J, 24)));
          }
        };
      }
      case "pan": {
        let J = n(K)(0, 0), Y = n(K)(1, 1), _ = J.x - Y.x, X = J.y - Y.y, gA = n(O).x, v = n(O).y;
        return {
          move: (P) => {
            EA({
              x: gA + (P.x - w.x) * _,
              y: v + (P.y - w.y) * X,
              scale: n(O).scale
            });
          }
        };
      }
    }
  }
  async function hi(w, M) {
    if (c() != null)
      LA(null);
    else {
      const N = await CC(w);
      if (N == null)
        RA([]), H(null);
      else if (M.shift || M.ctrl || M.meta) {
        let J = f()?.findIndex((Y) => Y.x == N.x && Y.y == N.y && Y.category == N.category);
        f() == null || J == null || J < 0 ? (RA([...f() ?? [], N]), H(N)) : (RA([
          ...f().slice(0, J),
          ...f().slice(J + 1)
        ]), H(null));
      } else
        RA([N]), H(N);
    }
  }
  async function ci(w) {
    if (f() != null && f().length == 1) {
      let M = n(Z)(f()[0].x, f()[0].y);
      w != null && IE(w, M) < 10 && H(f()[0]);
    } else
      H(await CC(w));
  }
  async function CC(w) {
    if (n($) == null || w == null || y() == null)
      return null;
    let { x: M, y: N } = n(K)(w.x, w.y), J = Math.abs(n(K)(w.x + 1, w.y).x - M);
    return await y()(M, N, J);
  }
  function Di() {
    return D() != null;
  }
  let gg = /* @__PURE__ */ k(() => n(yA) ? AE(n(yA), {
    zoom: SI,
    drag: li,
    hover: $Q(ci, Di),
    click: hi
  }) : null);
  async function eC(w, M, N) {
    let J = await w.densityMap(1e3, 1e3, M, N), Y = await kt(J.data, J.width, J.height, { union_threshold: M }), _ = [];
    for (let v = 0; v < Y.length; v++) {
      let P = Y[v], SA = J.coordinateAtPixel(P.mean_x, P.mean_y), oA = P.boundary_rect_approximation.map(([MA, bI, Bg, CI]) => {
        let GI = J.coordinateAtPixel(MA, bI), qI = J.coordinateAtPixel(Bg, CI);
        return {
          xMin: Math.min(GI.x, qI.x),
          xMax: Math.max(GI.x, qI.x),
          yMin: Math.min(GI.y, qI.y),
          yMax: Math.max(GI.y, qI.y)
        };
      });
      _.push({
        x: SA.x,
        y: SA.y,
        sum_density: P.sum_density,
        rects: oA,
        bandwidth: M
      });
    }
    let gA = _.reduce((v, P) => Math.max(v, P.sum_density), 0) * 5e-3;
    return _.filter((v) => v.sum_density > gA);
  }
  async function ui(w) {
    if (n($) == null)
      return [];
    let M = await BE({ generateLabels: w });
    if (typeof a() == "object" && a().cache) {
      let Y = await a().cache.get(M);
      if (Y != null)
        return Y;
    }
    x(fA, "Generating clusters...");
    let N = await eC(n($), 10, w);
    if (N = N.concat(await eC(n($), 5, w)), x(fA, "Generating labels (initializing)..."), h())
      for (let Y = 0; Y < N.length; Y++) {
        let _ = await h()(N[Y].rects);
        N[Y].label = _, x(fA, `Generating labels (${((Y + 1) / N.length * 100).toFixed(0)}%)...`);
      }
    let J = N.filter((Y) => Y.label != null).map((Y) => ({
      text: Y.label,
      x: Y.x,
      y: Y.y,
      priority: Y.sum_density,
      level: Y.bandwidth == 10 ? 0 : 1
    }));
    return typeof a() == "object" && a().cache && await a().cache.set(M, J), J;
  }
  async function iC(w) {
    if (n($) == null)
      return;
    let M = new Vg(w, i(), e()), N = await ui(w), J = w.scale, Y = w.scale / 2, _ = Y * 4, X = N.map((v) => {
      let P = M.pixelLocation(v.x, v.y), SA = v.level == 0 ? 14 : 12, oA = kE({
        text: v.text,
        fontSize: SA,
        fontFamily: n(b).fontFamily
      });
      oA.width += 4, oA.height += 4;
      let MA = J / _;
      return {
        text: v.text,
        fontSize: SA,
        bounds: {
          xMin: P.x - oA.width / 2,
          xMax: P.x + oA.width / 2,
          yMin: P.y - oA.height / 2,
          yMax: P.y + oA.height / 2
        },
        locationAtZero: P,
        priority: v.priority,
        minScale: v.level == 0 ? MA / 1.2 : null,
        maxScale: v.level == 0 ? null : MA,
        coordinate: { x: v.x, y: v.y },
        placement: null
      };
    }), gA = await Jt(X, { globalMaxScale: J / Y });
    for (let v = 0; v < gA.length; v++) {
      let P = gA[v];
      if (P != null) {
        let SA = J / P.minScale, oA = J / P.maxScale;
        X[v].placement = { minScale: oA, maxScale: SA };
      }
    }
    x(sA, X, !0), x(fA, null);
  }
  class fi {
    content;
    constructor(M, N) {
      let J = document.createElement("div");
      this.content = J, this.update(N), M.appendChild(J);
    }
    update(M) {
      let N = this.content;
      N.style.fontFamily = M.fontFamily, Q() == "light" ? (N.style.color = "#000", N.style.background = "#fff", N.style.border = "1px solid #000") : (N.style.color = "#ccc", N.style.background = "#000", N.style.border = "1px solid #ccc"), N.style.borderRadius = "2px", N.style.padding = "5px", N.style.fontSize = "12px", N.style.maxWidth = "300px", N.innerText = M.tooltip.text ?? JSON.stringify(M.tooltip);
    }
  }
  var Ng = bt();
  let QC;
  var gB = uA(Ng);
  W(gB, "", {}, { position: "absolute", top: "0", left: "0" }), NB(gB, (w) => x(yA, w), () => n(yA));
  var Mg = tA(gB, 2);
  let EC;
  var wi = uA(Mg);
  {
    var yi = (w) => {
      var M = eg();
      const N = /* @__PURE__ */ k(() => Oe(R())), J = /* @__PURE__ */ k(() => ({
        location: n(Z),
        width: i(),
        height: e()
      }));
      var Y = TI(M);
      bQ(Y, () => n(N), (_) => {
        var X = mt();
        TQ(X, (gA, v) => n(N)?.(gA, v), () => Xe(R(), { proxy: n(J) })), nA(_, X);
      }), nA(w, M);
    };
    kA(wi, (w) => {
      R() && w(yi);
    });
  }
  hA(Mg);
  var PA = tA(Mg, 2);
  PA.__mousedown = function(...w) {
    n(gg)?.mousedown?.apply(this, w);
  }, PA.__mousemove = function(...w) {
    n(gg)?.mousemove?.apply(this, w);
  }, W(PA, "", {}, { position: "absolute", left: "0", top: "0" });
  var tC = uA(PA);
  {
    var di = (w) => {
      var M = eg();
      const N = /* @__PURE__ */ k(() => {
        const { x: X, y: gA } = n(Z)(D().x, D().y);
        return { x: X, y: gA };
      }), J = /* @__PURE__ */ k(() => Math.max(3, n(lA) / E()) + 1);
      var Y = TI(M);
      {
        var _ = (X) => {
          var gA = Kt();
          let v;
          KA(
            (P) => {
              U(gA, "cx", n(N).x), U(gA, "cy", n(N).y), U(gA, "r", n(J)), v = W(gA, "", v, P);
            },
            [
              () => ({
                stroke: Q() == "light" ? "#000" : "#fff",
                "stroke-width": 1,
                fill: "none"
              })
            ]
          ), nA(X, gA);
        };
        kA(Y, (X) => {
          isFinite(n(N).x) && isFinite(n(N).y) && isFinite(n(J)) && X(_);
        });
      }
      nA(w, M);
    };
    kA(tC, (w) => {
      D() != null && n($) != null && w(di);
    });
  }
  var oC = tA(tC);
  {
    var Fi = (w) => {
      var M = eg(), N = TI(M);
      QB(N, 17, f, iB, (J, Y) => {
        var _ = eg();
        const X = /* @__PURE__ */ k(() => {
          const { x: oA, y: MA } = n(Z)(n(Y).x, n(Y).y);
          return { x: oA, y: MA };
        }), gA = /* @__PURE__ */ k(() => n(Y).category != null ? n(QA)[n(Y).category] : n(QA)[0]), v = /* @__PURE__ */ k(() => Math.max(3, n(lA) / E()) + 1);
        var P = TI(_);
        {
          var SA = (oA) => {
            var MA = pt();
            let bI;
            KA(
              (Bg) => {
                U(MA, "cx", n(X).x), U(MA, "cy", n(X).y), U(MA, "r", n(v)), bI = W(MA, "", bI, Bg);
              },
              [
                () => ({
                  stroke: Q() == "light" ? "#000" : "#fff",
                  "stroke-width": 2,
                  fill: n(gA)
                })
              ]
            ), nA(oA, MA);
          };
          kA(P, (oA) => {
            isFinite(n(X).x) && isFinite(n(X).y) && isFinite(n(v)) && oA(SA);
          });
        }
        nA(J, _);
      }), nA(w, M);
    };
    kA(oC, (w) => {
      f() != null && n($) != null && w(Fi);
    });
  }
  var nC = tA(oC);
  {
    var Si = (w) => {
      var M = Ht();
      QB(M, 21, () => n(sA), iB, (N, J) => {
        var Y = vt();
        const _ = /* @__PURE__ */ k(() => n(J).text.split(`
`)), X = /* @__PURE__ */ k(() => n(Z)(n(J).coordinate.x, n(J).coordinate.y)), gA = /* @__PURE__ */ k(() => n(J).placement != null && n(J).placement.minScale <= n(O).scale && n(O).scale <= n(J).placement.maxScale);
        var v = uA(Y);
        {
          var P = (SA) => {
            var oA = Lt();
            QB(oA, 21, () => n(_), iB, (MA, bI, Bg) => {
              var CI = xt();
              U(CI, "x", 0);
              let GI;
              var qI = uA(CI, !0);
              hA(CI), KA(
                (ki) => {
                  U(CI, "y", (Bg - (n(_).length - 1) / 2) * n(J).fontSize), U(CI, "font-size", n(J).fontSize), GI = W(CI, "", GI, ki), hg(qI, n(bI));
                },
                [
                  () => ({
                    "paint-order": "stroke",
                    "stroke-width": "4",
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round",
                    "text-anchor": "middle",
                    fill: n(b).clusterLabelColor,
                    stroke: n(b).clusterLabelOutlineColor,
                    opacity: n(b).clusterLabelOpacity,
                    "user-select": "none",
                    "-webkit-user-select": "none",
                    "font-family": n(b).fontFamily
                  })
                ]
              ), nA(MA, CI);
            }), hA(oA), nA(SA, oA);
          };
          kA(v, (SA) => {
            n(gA) && SA(P);
          });
        }
        hA(Y), KA(() => U(Y, "transform", `translate(${n(X).x ?? ""},${n(X).y ?? ""})`)), nA(N, Y);
      }), hA(M), nA(w, M);
    };
    kA(nC, (w) => {
      w(Si);
    });
  }
  var Gi = tA(nC);
  {
    var Ri = (w) => {
      var M = eg(), N = TI(M);
      {
        var J = (_) => {
          eE(_, {
            get value() {
              return c();
            },
            get pointLocation() {
              return n(Z);
            }
          });
        }, Y = (_) => {
          {
            let X = /* @__PURE__ */ k(() => n(gg)?.preventHover ?? (() => {
            }));
            jQ(_, {
              get value() {
                return c();
              },
              onChange: LA,
              get pointLocation() {
                return n(Z);
              },
              get coordinateAtPoint() {
                return n(K);
              },
              get preventHover() {
                return n(X);
              }
            });
          }
        };
        kA(N, (_) => {
          c() instanceof Array ? _(J) : _(Y, !1);
        });
      }
      nA(w, M);
    };
    kA(Gi, (w) => {
      c() != null && n($) != null && w(Ri);
    });
  }
  hA(PA);
  var rC = tA(PA, 2);
  {
    var Ni = (w) => {
      const M = /* @__PURE__ */ k(() => n(Z)(D().x, D().y));
      {
        let N = /* @__PURE__ */ k(() => Math.max(3, n(lA) / E())), J = /* @__PURE__ */ k(() => d() ?? {
          class: fi,
          props: {
            colorScheme: Q(),
            fontFamily: n(b).fontFamily
          }
        });
        cE(w, {
          get location() {
            return n(M);
          },
          get allowInteraction() {
            return n(z);
          },
          get targetHeight() {
            return n(N);
          },
          get customTooltip() {
            return n(J);
          },
          get tooltip() {
            return D();
          }
        });
      }
    };
    kA(rC, (w) => {
      D() != null && n($) != null && w(Ni);
    });
  }
  var Mi = tA(rC, 2);
  {
    var Ui = (w) => {
      {
        let M = /* @__PURE__ */ k(() => n(fA) ?? n(p)), N = /* @__PURE__ */ k(() => 1 / (n(Z)(1, 0).x - n(Z)(0, 0).x));
        sE(w, {
          get resolvedTheme() {
            return n(b);
          },
          get statusMessage() {
            return n(M);
          },
          get distancePerPoint() {
            return n(N);
          },
          get pointCount() {
            return g().x.length;
          },
          get selectionMode() {
            return n(vA);
          },
          onSelectionMode: (J) => x(vA, J, !0)
        });
      }
    };
    kA(Mi, (w) => {
      n(b).statusBar && w(Ui);
    });
  }
  return hA(Ng), KA(
    (w, M) => {
      QC = W(Ng, "", QC, w), EC = W(Mg, "", EC, M), U(PA, "width", i()), U(PA, "height", e());
    },
    [
      () => ({
        width: `${i() ?? ""}px`,
        height: `${e() ?? ""}px`,
        position: "relative"
      }),
      () => ({
        width: `${i() ?? ""}px`,
        height: `${e() ?? ""}px`,
        position: "absolute",
        top: "0",
        left: "0"
      })
    ]
  ), dC("wheel", PA, function(...w) {
    n(gg)?.wheel?.apply(this, w);
  }), dC("mouseleave", PA, function(...w) {
    n(gg)?.mouseleave?.apply(this, w);
  }), nA(A, Ng), yI({ updateLabels: iC });
}
jB(["mousedown", "mousemove"]);
function ni(A, I, g = 0, B = A.length - 1, C = qt) {
  for (; B > g; ) {
    if (B - g > 600) {
      const Q = B - g + 1, t = I - g + 1, o = Math.log(Q), r = 0.5 * Math.exp(2 * o / 3), l = 0.5 * Math.sqrt(o * r * (Q - r) / Q) * (t - Q / 2 < 0 ? -1 : 1), s = Math.max(g, Math.floor(I - t * r / Q + l)), a = Math.min(B, Math.floor(I + (Q - t) * r / Q + l));
      ni(A, I, s, a, C);
    }
    const i = A[I];
    let e = g, E = B;
    for (Qg(A, g, I), C(A[B], i) > 0 && Qg(A, g, B); e < E; ) {
      for (Qg(A, e, E), e++, E--; C(A[e], i) < 0; ) e++;
      for (; C(A[E], i) > 0; ) E--;
    }
    C(A[g], i) === 0 ? Qg(A, g, E) : (E++, Qg(A, E, B)), E <= I && (g = E + 1), I <= E && (B = E - 1);
  }
}
function Qg(A, I, g) {
  const B = A[I];
  A[I] = A[g], A[g] = B;
}
function qt(A, I) {
  return A < I ? -1 : A > I ? 1 : 0;
}
function WC(A) {
  let I = new Float32Array(A), g = Math.floor(A.length / 2);
  return ni(I, g), I[g];
}
function _t(A) {
  return A.length == 0 ? 0 : A.reduce((I, g) => I + g, 0) / A.length;
}
function VC(A) {
  if (A.length == 0)
    return 0;
  let I = _t(A);
  return Math.sqrt(A.reduce((g, B) => g + (B - I) * (B - I)) / A.length);
}
function Tt(A, I, g, B = 0, C = 0) {
  let i = new ArrayBuffer(8), e = new Uint32Array(i), E = new BigUint64Array(i), Q = /* @__PURE__ */ new Map();
  for (let o = 0; o < A.length; o++) {
    e[0] = Math.floor((A[o] - B) / g), e[1] = Math.floor((I[o] - C) / g);
    let r = E[0];
    Q.set(r, (Q.get(r) ?? 0) + 1);
  }
  let t = 0;
  for (let o of Q.values())
    t = Math.max(o, t);
  return t / (g * g);
}
function Wt(A, I) {
  wI(I, !0);
  let g = F(I, "tooltip", 3, null), B = F(I, "selection", 3, null), C = F(I, "rangeSelection", 3, null), i = F(I, "categoryColors", 3, null), e = F(I, "width", 3, null), E = F(I, "height", 3, null), Q = F(I, "pixelRatio", 3, null), t = F(I, "colorScheme", 3, "light"), o = F(I, "theme", 3, null), r = F(I, "viewportState", 3, null), l = F(I, "automaticLabels", 3, !1), s = F(I, "mode", 3, "density"), a = F(I, "minimumDensity", 3, 1 / 16), h = F(I, "customTooltip", 3, null), D = F(I, "customOverlay", 3, null), f = F(I, "querySelection", 3, null), y = F(I, "queryClusterLabels", 3, null), c = F(I, "onViewportState", 3, null), G = F(I, "onTooltip", 3, null), S = F(I, "onSelection", 3, null), d = F(I, "onRangeSelection", 3, null), R = /* @__PURE__ */ k(() => L(I.data));
  function L(m) {
    let CA = 1;
    m.category != null && (CA = m.category.reduce((aA, z) => Math.max(aA, z), 0) + 1);
    let IA = WC(m.x), b = WC(m.y), QA = VC(m.x), O = VC(m.y), eA = 1 / (Math.max(QA, O, 1e-3) * 3), Z = 0.1 / eA, K = Tt(m.x, m.y, Z, IA, b);
    return {
      count: m.x.length,
      categoryCount: CA,
      maxDensity: K,
      defaultViewportState: { x: IA, y: b, scale: eA * 0.95 }
    };
  }
  {
    let m = /* @__PURE__ */ k(() => s() ?? "points"), CA = /* @__PURE__ */ k(() => e() ?? 800), IA = /* @__PURE__ */ k(() => E() ?? 800), b = /* @__PURE__ */ k(() => Q() ?? 2), QA = /* @__PURE__ */ k(() => t() ?? "light"), O = /* @__PURE__ */ k(() => ({
      x: I.data.x,
      y: I.data.y,
      category: I.data.category ?? null
    })), eA = /* @__PURE__ */ k(() => l() ?? !1), Z = /* @__PURE__ */ k(() => a() ?? 1 / 16);
    oi(A, {
      get mode() {
        return n(m);
      },
      get width() {
        return n(CA);
      },
      get height() {
        return n(IA);
      },
      get pixelRatio() {
        return n(b);
      },
      get colorScheme() {
        return n(QA);
      },
      get theme() {
        return o();
      },
      get data() {
        return n(O);
      },
      get totalCount() {
        return n(R).count;
      },
      get maxDensity() {
        return n(R).maxDensity;
      },
      get categoryCount() {
        return n(R).categoryCount;
      },
      get categoryColors() {
        return i();
      },
      get defaultViewportState() {
        return n(R).defaultViewportState;
      },
      get querySelection() {
        return f();
      },
      get queryClusterLabels() {
        return y();
      },
      get automaticLabels() {
        return n(eA);
      },
      get minimumDensity() {
        return n(Z);
      },
      get customTooltip() {
        return h();
      },
      get customOverlay() {
        return D();
      },
      get tooltip() {
        return g();
      },
      get onTooltip() {
        return G();
      },
      get selection() {
        return B();
      },
      get onSelection() {
        return S();
      },
      get viewportState() {
        return r();
      },
      get onViewportState() {
        return c();
      },
      get rangeSelection() {
        return C();
      },
      get onRangeSelection() {
        return d();
      }
    });
  }
  yI();
}
class wo {
  component;
  currentProps;
  constructor(I, g) {
    this.currentProps = { ...g }, this.component = Te({ component: Wt, target: I, props: g });
  }
  update(I) {
    let g = {};
    for (let B in I)
      I[B] !== this.currentProps[B] && (g[B] = I[B], this.currentProps[B] = I[B]);
    this.component.$set(g);
  }
  destroy() {
    this.component.$destroy();
  }
}
let Vt = "a|about|above|after|again|against|ain|all|am|an|and|any|are|aren|aren't|as|at|be|because|been|before|being|below|between|both|but|by|can|couldn|couldn't|d|did|didn|didn't|do|does|doesn|doesn't|doing|don|don't|down|during|each|few|for|from|further|had|hadn|hadn't|has|hasn|hasn't|have|haven|haven't|having|he|he'd|he'll|her|here|hers|herself|he's|him|himself|his|how|i|i'd|if|i'll|i'm|in|into|is|isn|isn't|it|it'd|it'll|it's|its|itself|i've|just|ll|m|ma|me|mightn|mightn't|more|most|mustn|mustn't|my|myself|needn|needn't|no|nor|not|now|o|of|off|on|once|only|or|other|our|ours|ourselves|out|over|own|re|s|same|shan|shan't|she|she'd|she'll|she's|should|shouldn|shouldn't|should've|so|some|such|t|than|that|that'll|the|their|theirs|them|themselves|then|there|these|they|they'd|they'll|they're|they've|this|those|through|to|too|under|until|up|ve|very|was|wasn|wasn't|we|we'd|we'll|we're|were|weren|weren't|we've|what|when|where|which|while|who|whom|why|will|with|won|won't|wouldn|wouldn't|y|you|you'd|you'll|your|you're|yours|yourself|yourselves|you've", Ot = "de|la|que|el|en|y|a|los|del|se|las|por|un|para|con|no|una|su|al|lo|como|más|pero|sus|le|ya|o|este|sí|porque|esta|entre|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros|mi|mis|tú|te|ti|tu|tus|ellas|nosotras|vosotros|vosotras|os|mío|mía|míos|mías|tuyo|tuya|tuyos|tuyas|suyo|suya|suyos|suyas|nuestro|nuestra|nuestros|nuestras|vuestro|vuestra|vuestros|vuestras|esos|esas|estoy|estás|está|estamos|estáis|están|esté|estés|estemos|estéis|estén|estaré|estarás|estará|estaremos|estaréis|estarán|estaría|estarías|estaríamos|estaríais|estarían|estaba|estabas|estábamos|estabais|estaban|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|estuviera|estuvieras|estuviéramos|estuvierais|estuvieran|estuviese|estuvieses|estuviésemos|estuvieseis|estuviesen|estando|estado|estada|estados|estadas|estad|he|has|ha|hemos|habéis|han|haya|hayas|hayamos|hayáis|hayan|habré|habrás|habrá|habremos|habréis|habrán|habría|habrías|habríamos|habríais|habrían|había|habías|habíamos|habíais|habían|hube|hubiste|hubo|hubimos|hubisteis|hubieron|hubiera|hubieras|hubiéramos|hubierais|hubieran|hubiese|hubieses|hubiésemos|hubieseis|hubiesen|habiendo|habido|habida|habidos|habidas|soy|eres|es|somos|sois|son|sea|seas|seamos|seáis|sean|seré|serás|será|seremos|seréis|serán|sería|serías|seríamos|seríais|serían|era|eras|éramos|erais|eran|fui|fuiste|fue|fuimos|fuisteis|fueron|fuera|fueras|fuéramos|fuerais|fueran|fuese|fueses|fuésemos|fueseis|fuesen|sintiendo|sentido|sentida|sentidos|sentidas|siente|sentid|tengo|tienes|tiene|tenemos|tenéis|tienen|tenga|tengas|tengamos|tengáis|tengan|tendré|tendrás|tendrá|tendremos|tendréis|tendrán|tendría|tendrías|tendríamos|tendríais|tendrían|tenía|tenías|teníamos|teníais|tenían|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|tuviera|tuvieras|tuviéramos|tuvierais|tuvieran|tuviese|tuvieses|tuviésemos|tuvieseis|tuviesen|teniendo|tenido|tenida|tenidos|tenidas|tened", Xt = "au|aux|avec|ce|ces|dans|de|des|du|elle|en|et|eux|il|ils|je|la|le|les|leur|lui|ma|mais|me|même|mes|moi|mon|ne|nos|notre|nous|on|ou|par|pas|pour|qu|que|qui|sa|se|ses|son|sur|ta|te|tes|toi|ton|tu|un|une|vos|votre|vous|c|d|j|l|à|m|n|s|t|y|été|étée|étées|étés|étant|étante|étants|étantes|suis|es|est|sommes|êtes|sont|serai|seras|sera|serons|serez|seront|serais|serait|serions|seriez|seraient|étais|était|étions|étiez|étaient|fus|fut|fûmes|fûtes|furent|sois|soit|soyons|soyez|soient|fusse|fusses|fût|fussions|fussiez|fussent|ayant|ayante|ayantes|ayants|eu|eue|eues|eus|ai|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|aurais|aurait|aurions|auriez|auraient|avais|avait|avions|aviez|avaient|eut|eûmes|eûtes|eurent|aie|aies|ait|ayons|ayez|aient|eusse|eusses|eût|eussions|eussiez|eussent", Pt = "aber|alle|allem|allen|aller|alles|als|also|am|an|ander|andere|anderem|anderen|anderer|anderes|anderm|andern|anderr|anders|auch|auf|aus|bei|bin|bis|bist|da|damit|dann|der|den|des|dem|die|das|dass|daß|derselbe|derselben|denselben|desselben|demselben|dieselbe|dieselben|dasselbe|dazu|dein|deine|deinem|deinen|deiner|deines|denn|derer|dessen|dich|dir|du|dies|diese|diesem|diesen|dieser|dieses|doch|dort|durch|ein|eine|einem|einen|einer|eines|einig|einige|einigem|einigen|einiger|einiges|einmal|er|ihn|ihm|es|etwas|euer|eure|eurem|euren|eurer|eures|für|gegen|gewesen|hab|habe|haben|hat|hatte|hatten|hier|hin|hinter|ich|mich|mir|ihr|ihre|ihrem|ihren|ihrer|ihres|euch|im|in|indem|ins|ist|jede|jedem|jeden|jeder|jedes|jene|jenem|jenen|jener|jenes|jetzt|kann|kein|keine|keinem|keinen|keiner|keines|können|könnte|machen|man|manche|manchem|manchen|mancher|manches|mein|meine|meinem|meinen|meiner|meines|mit|muss|musste|nach|nicht|nichts|noch|nun|nur|ob|oder|ohne|sehr|sein|seine|seinem|seinen|seiner|seines|selbst|sich|sie|ihnen|sind|so|solche|solchem|solchen|solcher|solches|soll|sollte|sondern|sonst|über|um|und|uns|unsere|unserem|unseren|unser|unseres|unter|viel|vom|von|vor|während|war|waren|warst|was|weg|weil|weiter|welche|welchem|welchen|welcher|welches|wenn|werde|werden|wie|wieder|will|wir|wird|wirst|wo|wollen|wollte|würde|würden|zu|zum|zur|zwar|zwischen";
function Zt(...A) {
  let I = [];
  for (let g of A) {
    let B = g.split("|");
    I = I.concat(B);
  }
  return I;
}
let zt = Zt(Vt, Ot, Xt, Pt);
class jt {
  coordinator;
  tableName;
  xColumn;
  yColumn;
  textColumn;
  derivedTableDF;
  derivedTableBins;
  initialized;
  xBinSize;
  yBinSize;
  x0;
  y0;
  constructor(I) {
    this.coordinator = I.coordinator, this.tableName = I.table, this.xColumn = I.x, this.yColumn = I.y, this.textColumn = I.text, this.derivedTableDF = this.tableName + "_df", this.derivedTableBins = this.tableName + "_bt", this.initialized = !1, this.xBinSize = 1, this.yBinSize = 1, this.x0 = 0, this.y0 = 0;
  }
  async initialize() {
    if (this.initialized)
      return;
    let I = BB(this.xColumn), g = BB(this.yColumn), B = BB(this.textColumn), C = await this.coordinator.query(Ug`
      SELECT
        MIN(${I}) AS xMin, QUANTILE_CONT(${I}, 0.99) - QUANTILE_CONT(${I}, 0.01) AS xDiff,
        MIN(${g}) AS yMin, QUANTILE_CONT(${g}, 0.99) - QUANTILE_CONT(${g}, 0.01) AS yDiff,
        COUNT(*) AS count
      FROM ${this.tableName}
    `), { xMin: i, yMin: e, xDiff: E, yDiff: Q, count: t } = C.get(0);
    this.x0 = i, this.y0 = e, this.xBinSize = E / 200, this.yBinSize = Q / 200;
    let o = t < 1e4 ? 1 : 5;
    await this.coordinator.exec(Ug`

    `), await this.coordinator.exec(Ug`
      CREATE OR REPLACE TEMP MACRO embedding_view_tokenize(s) AS
        unnest(string_split_regex(regexp_replace(lower(s), '[^a-z0-9'']', ' ', 'g'), '\\s+'));

      CREATE OR REPLACE TABLE ${this.derivedTableBins} AS (
        WITH tokens_all AS (
          SELECT
            floor((${I} - ${this.x0}) / ${this.xBinSize})::INT + 32768 * (floor((${g} - ${this.y0}) / ${this.yBinSize})::INT) as xykey,
            embedding_view_tokenize(${B}) AS token
          FROM ${this.tableName}
        )
        SELECT xykey, token, COUNT(*) AS count
        FROM tokens_all
        WHERE token NOT IN ('',${zt.map((r) => Yi(r)).join(",")}) AND LENGTH(token) >= 3
        GROUP BY xykey, token
        HAVING count >= ${o}
      );
      CREATE OR REPLACE TABLE ${this.derivedTableDF} AS (
        SELECT sum(count) AS count, stem(token, 'english') AS stem_token
        FROM ${this.derivedTableBins} GROUP BY stem_token
      );
    `), this.initialized = !0;
  }
  indices(I) {
    let g = /* @__PURE__ */ new Set();
    for (let { xMin: B, yMin: C, xMax: i, yMax: e } of I) {
      let E = Math.floor((B - this.x0) / this.xBinSize), Q = Math.floor((i - this.x0) / this.xBinSize), t = Math.floor((C - this.y0) / this.yBinSize), o = Math.floor((e - this.y0) / this.yBinSize);
      for (let r = E; r <= Q; r++)
        for (let l = t; l <= o; l++) {
          let s = l * 32768 + r;
          g.add(s);
        }
    }
    return Array.from(g);
  }
  async summarize(I, g = 4) {
    await this.initialize();
    let B = this.indices(I), C = Ug`
      WITH tokens_tf AS (
        SELECT token, sum(count) AS count
        FROM ${this.derivedTableBins}
        WHERE xykey IN (${B.join(",")})
        GROUP BY token
      ),
      tokens_tf_stem AS (
        SELECT sum(count) AS count, stem(token, 'english') AS stem_token, ARG_MAX(token, count) AS token
        FROM tokens_tf
        GROUP BY stem_token
      )
      SELECT
        tokens_tf_stem.count AS tf,
        ${this.derivedTableDF}.count AS df,
        tf * log(1 + (SELECT sum(count) FROM tokens_tf_stem) / df) AS tfidf,
        tokens_tf_stem.token AS token
      FROM ${this.derivedTableDF}, tokens_tf_stem
      WHERE ${this.derivedTableDF}.stem_token == tokens_tf_stem.stem_token
      ORDER BY tfidf DESC limit ${g}
    `;
    return (await this.coordinator.query(C)).getChild("token").toArray();
  }
}
function OC(A, I) {
  if (I.length == 0)
    return u.literal(!1);
  if (A.identifier != null) {
    let g = A.identifier;
    return u.or(...I.map((B) => u.eq(u.column(g), u.literal(B.identifier))));
  } else {
    let g = A.x, B = A.y, C = A.category;
    return C != null ? u.or(
      ...I.map(
        (i) => u.and(
          u.eq(u.cast(u.column(g), "DOUBLE"), u.literal(i.x)),
          u.eq(u.cast(u.column(B), "DOUBLE"), u.literal(i.y)),
          u.eq(u.cast(u.column(C), "INTEGER"), u.literal(i.category))
        )
      )
    ) : u.or(
      ...I.map(
        (i) => u.and(
          u.eq(u.cast(u.column(g), "DOUBLE"), u.literal(i.x)),
          u.eq(u.cast(u.column(B), "DOUBLE"), u.literal(i.y))
        )
      )
    );
  }
}
function $t(A, I, g) {
  let B = [];
  for (let i = 0; i < g.length; i++) {
    let e = (i + 1) % g.length, { x: E, y: Q } = g[i], { x: t, y: o } = g[e], r = Q < o ? u.and(u.lte(u.literal(Q), I), u.lt(I, u.literal(o))) : u.and(u.lte(u.literal(o), I), u.lt(I, u.literal(Q))), l = (Q < o ? u.lt : u.gt)(
      u.sub(u.mul(u.literal(t - E), I), u.mul(u.literal(o - Q), A)),
      u.literal((t - E) * Q - (o - Q) * E)
    );
    B.push(u.cast(u.and(r, l), "INT"));
  }
  let C = B.reduce((i, e) => u.add(i, e));
  return u.eq(u.mod(C, u.literal(2)), u.literal(1));
}
function Ao(A, I) {
  if (I instanceof Array) {
    if (I.length < 3)
      return u.literal(!1);
    let g = Ve(I);
    return u.and(
      u.isBetween(u.column(A.x), [g.xMin, g.xMax]),
      u.isBetween(u.column(A.y), [g.yMin, g.yMax]),
      $t(u.column(A.x), u.column(A.y), I)
    );
  } else
    return u.and(
      u.isBetween(u.column(A.x), [I.xMin, I.xMax]),
      u.isBetween(u.column(A.y), [I.yMin, I.yMax])
    );
}
async function Io(A, I) {
  let { x: g, y: B, table: C } = I, i = await A.query(
    u.Query.from(C).select({
      centerX: u.sql`MEDIAN(${u.column(g)})`,
      centerY: u.sql`MEDIAN(${u.column(B)})`,
      stdX: u.sql`STDDEV(${u.column(g)})`,
      stdY: u.sql`STDDEV(${u.column(B)})`,
      ...I.category != null ? {
        maxCategory: u.sql`MAX(${u.column(I.category)}::UTINYINT)`
      } : {}
    })
  ), { centerX: e, centerY: E, stdX: Q, stdY: t, maxCategory: o } = i.get(0), r = 1 / (Math.max(Q, t, 1e-3) * 3), l = 0.1 / r, s = u.sql`FLOOR((${u.column(g)} - ${e}) / ${l})`, a = u.sql`FLOOR((${u.column(B)} - ${E}) / ${l})`, h = I.category != null ? u.column(I.category) : null, D = h != null ? [s, a, h] : [s, a], f = u.Query.from(
    u.Query.from(C).select({ count: u.sql`COUNT(*)` }).groupby(...D)
  ).select({
    totalCount: u.sql`SUM(count)::INT`,
    maxCount: u.sql`MAX(count)::INT`
  });
  i = await A.query(f);
  let { maxCount: y, totalCount: c } = i.get(0), G = y / (l * l);
  return {
    centerX: e,
    centerY: E,
    scaler: r,
    totalCount: c,
    categoryCount: (o ?? 0) + 1,
    maxDensity: G
  };
}
class go {
  coordinator;
  source;
  lastDistance;
  selectParams;
  constructor(I, g) {
    this.coordinator = I, this.source = g, this.lastDistance = 0;
    let { x: B, y: C, category: i, text: e, identifier: E } = this.source, Q = {}, t = g.additionalFields ?? {};
    for (let o in t) {
      let r = t[o];
      typeof r == "string" ? Q["field_" + o] = u.column(r) : Q["field_" + o] = u.sql`${r.sql}`;
    }
    this.selectParams = {
      x: u.sql`${u.column(B)}::DOUBLE`,
      y: u.sql`${u.column(C)}::DOUBLE`,
      ...i != null ? { category: u.sql`${u.column(i)}::INT` } : {},
      ...e != null ? { text: u.sql`${u.column(e)}` } : {},
      ...E != null ? { identifier: u.sql`${u.column(E)}` } : {},
      ...Q
    };
  }
  _convertToDataPoint(I) {
    let g = {};
    for (let B in I)
      B.startsWith("field_") && (g[B.slice(6)] = I[B]);
    return {
      x: I.x,
      y: I.y,
      category: I.category,
      text: I.text,
      identifier: I.identifier,
      fields: g
    };
  }
  async queryClosestPoint(I, g, B, C) {
    let i = C * 12, { x: e, y: E } = this.source;
    for (let Q of [this.lastDistance, i]) {
      if (Q == 0 || Q > i)
        continue;
      let t = u.Query.from(this.source.table).select(this.selectParams);
      t = t.where(u.sql`${u.column(e)} BETWEEN ${g - Q} AND ${g + Q}`), t = t.where(u.sql`${u.column(E)} BETWEEN ${B - Q} AND ${B + Q}`), I && (t = t.where(I)), t = t.orderby(u.sql`(x - (${g}))**2 + (y - (${B}))**2`).limit(1);
      let r = (await this.coordinator.query(t)).get(0);
      if (r)
        return this.lastDistance = Math.max(Math.abs(r.x - g), Math.abs(r.y - B)) * 4, this._convertToDataPoint(r);
    }
    return null;
  }
  async queryPoints(I) {
    let { table: g, identifier: B } = this.source;
    if (B == null)
      return [];
    let C = u.Query.from(g).select(this.selectParams);
    return C = C.where(
      u.isIn(
        u.column(B),
        I.map((e) => u.literal(e))
      )
    ), Array.from(await this.coordinator.query(C)).map((e) => this._convertToDataPoint(e));
  }
}
function Bo(A) {
  let I = A.coordinator ?? PC(), g = new Co({ ...A, coordinator: I });
  return I.connect(g), g.destroy = () => {
    I.disconnect(g);
  }, g;
}
class Co extends Ji {
  _spec;
  constructor(I) {
    super(I.selection ?? void 0), this._spec = { ...I };
  }
  query(I) {
    return this._spec.query(I);
  }
  queryResult(I) {
    return this._spec.queryResult?.(I), this;
  }
  queryPending() {
    return this._spec.queryPending?.(), this;
  }
  queryError(I) {
    return this._spec.queryError?.(I), this;
  }
}
function eo(A, I) {
  wI(I, !0);
  let g = F(I, "coordinator", 19, PC), B = F(I, "category", 3, null), C = F(I, "text", 3, null), i = F(I, "identifier", 3, null), e = F(I, "filter", 3, null), E = F(I, "categoryColors", 3, null), Q = F(I, "tooltip", 3, null), t = F(I, "additionalFields", 3, null), o = F(I, "selection", 3, null), r = F(I, "rangeSelection", 3, null), l = F(I, "rangeSelectionValue", 3, null), s = F(I, "width", 3, null), a = F(I, "height", 3, null), h = F(I, "pixelRatio", 3, null), D = F(I, "colorScheme", 3, "light"), f = F(I, "theme", 3, null), y = F(I, "viewportState", 3, null), c = F(I, "automaticLabels", 3, !1), G = F(I, "mode", 3, "density"), S = F(I, "minimumDensity", 3, 1 / 16), d = F(I, "customTooltip", 3, null), R = F(I, "customOverlay", 3, null), L = F(I, "onViewportState", 3, null), m = F(I, "onTooltip", 3, null), CA = F(I, "onSelection", 3, null), IA = F(I, "onRangeSelection", 3, null), b = /* @__PURE__ */ iA(new Float32Array()), QA = /* @__PURE__ */ iA(new Float32Array()), O = /* @__PURE__ */ iA(null), eA = /* @__PURE__ */ iA(1), Z = /* @__PURE__ */ iA(1), K = /* @__PURE__ */ iA(1), aA = /* @__PURE__ */ iA(null), z = /* @__PURE__ */ iA(null), EA = /* @__PURE__ */ iA(null), H = /* @__PURE__ */ iA(null), RA = /* @__PURE__ */ iA(null);
  eI(() => {
    let p = {
      coordinator: g(),
      source: {
        table: I.table,
        x: I.x,
        y: I.y,
        category: B()
      }
    }, q = null, lA = !1;
    async function dA() {
      let wA = p.source, bA = await Io(p.coordinator, wA);
      if (lA)
        return;
      let Ig = bA.scaler * 0.95;
      x(aA, {
        x: bA.centerX,
        y: bA.centerY,
        scale: Ig
      }), x(Z, bA.totalCount), x(K, bA.maxDensity), x(eA, bA.categoryCount), q = Bo({
        coordinator: p.coordinator,
        selection: e(),
        query: (BI) => u.Query.from(wA.table).select({
          x: u.sql`${u.column(wA.x)}::FLOAT`,
          y: u.sql`${u.column(wA.y)}::FLOAT`,
          ...wA.category != null ? { c: u.sql`${u.column(wA.category)}::UTINYINT` } : {}
        }).where(BI),
        queryResult: (BI) => {
          let XA = BI.getChild("x").toArray(), FI = BI.getChild("y").toArray(), SI = BI.getChild("c")?.toArray() ?? null;
          XA != null && !(XA instanceof Float32Array) && (XA = new Float32Array(XA)), FI != null && !(FI instanceof Float32Array) && (FI = new Float32Array(FI)), SI != null && !(SI instanceof Uint8Array) && (SI = new Uint8Array(SI)), x(b, XA), x(QA, FI), x(O, SI), LA(null), sA(null);
        }
      }), q.reset = () => {
        fA();
      }, x(RA, q);
    }
    return dA(), () => {
      x(RA, null), lA = !0, q?.destroy();
    };
  }), eI(() => {
    if (aC(Q())) {
      let p = n(RA);
      if (p == null)
        return;
      let q = Q();
      x(z, q.value);
      let lA = () => {
        x(z, q.value);
      };
      return eI(() => {
        let dA = n(z), wA = {
          x: I.x,
          y: I.y,
          category: B(),
          identifier: i()
        };
        q.update({
          source: p,
          clients: (/* @__PURE__ */ new Set()).add(p),
          predicate: dA != null ? OC(wA, [dA]) : null,
          value: dA
        });
      }), q.addEventListener("value", lA), () => {
        q.removeEventListener("value", lA), q.update({
          source: p,
          clients: (/* @__PURE__ */ new Set()).add(p),
          value: null,
          predicate: null
        });
      };
    } else if (Q() == null || typeof Q() == "object")
      x(z, Q());
    else {
      if (n(z)?.identifier == Q())
        return;
      let p = !1;
      return NA([Q()]).then((q) => {
        p || (q.length > 0 ? x(z, q[0]) : x(z, null));
      }), () => {
        p = !0;
      };
    }
  });
  function LA(p) {
    hI(Q(), p) || (x(z, p), m()?.(p));
  }
  eI(() => {
    if (aC(o())) {
      let p = n(RA);
      if (p == null)
        return;
      let q = o();
      x(EA, q.value);
      let lA = () => {
        x(EA, q.value);
      };
      return eI(() => {
        let dA = n(EA), wA = {
          x: I.x,
          y: I.y,
          category: B(),
          identifier: i()
        };
        q.update({
          source: p,
          clients: (/* @__PURE__ */ new Set()).add(p),
          predicate: dA != null ? OC(wA, dA) : null,
          value: dA
        });
      }), q.addEventListener("value", lA), () => {
        q.removeEventListener("value", lA), q.update({
          source: p,
          clients: (/* @__PURE__ */ new Set()).add(p),
          value: null,
          predicate: null
        });
      };
    } else if (o() == null)
      x(EA, null);
    else if (o().length == 0)
      x(EA, []);
    else if (o().every((p) => typeof p == "object"))
      x(EA, o());
    else {
      let p = !1;
      return NA(o()).then((q) => {
        p || x(EA, q);
      }), () => {
        p = !0;
      };
    }
  });
  function sA(p) {
    hI(o(), p) || (x(EA, p), CA()?.(p));
  }
  eI(() => {
    let p = n(RA);
    if (p == null)
      return;
    let q = r();
    if (q != null)
      return eI(() => {
        let lA = n(H), dA = { x: I.x, y: I.y }, wA = {
          source: p,
          clients: (/* @__PURE__ */ new Set()).add(p),
          predicate: lA != null ? Ao(dA, lA) : null,
          value: lA
        };
        q.update(wA), q.activate(wA);
      }), () => {
        q.update({
          source: p,
          clients: (/* @__PURE__ */ new Set()).add(p),
          value: null,
          predicate: null
        });
      };
  }), eI(() => {
    hI($I(() => n(H)), l()) || x(H, l());
  });
  function fA() {
    sA(null), LA(null), IA()?.(null), x(H, null);
  }
  let vA = /* @__PURE__ */ k(() => new go(g(), {
    table: I.table,
    x: I.x,
    y: I.y,
    category: B(),
    text: C(),
    identifier: i(),
    additionalFields: t()
  }));
  async function HA(p, q, lA) {
    return await n(vA).queryClosestPoint(e()?.predicate?.(n(RA)), p, q, lA);
  }
  async function NA(p) {
    return await n(vA).queryPoints(p);
  }
  let yA = /* @__PURE__ */ k(() => C() != null ? new jt({
    coordinator: g(),
    table: I.table,
    x: I.x,
    y: I.y,
    text: C()
  }) : null);
  async function $(p) {
    if (n(yA) == null)
      return null;
    let q = await n(yA).summarize(p, 4);
    return q.length > 0 ? q.slice(0, 2).join("-") + `-
` + q.slice(2).join("-") : null;
  }
  {
    let p = /* @__PURE__ */ k(() => G() ?? "points"), q = /* @__PURE__ */ k(() => s() ?? 800), lA = /* @__PURE__ */ k(() => a() ?? 800), dA = /* @__PURE__ */ k(() => h() ?? 2), wA = /* @__PURE__ */ k(() => D() ?? "light"), bA = /* @__PURE__ */ k(() => ({
      x: n(b),
      y: n(QA),
      category: n(O)
    })), Ig = /* @__PURE__ */ k(() => C() != null ? c() ?? !1 : !1), BI = /* @__PURE__ */ k(() => S() ?? 1 / 16);
    oi(A, {
      get mode() {
        return n(p);
      },
      get width() {
        return n(q);
      },
      get height() {
        return n(lA);
      },
      get pixelRatio() {
        return n(dA);
      },
      get colorScheme() {
        return n(wA);
      },
      get theme() {
        return f();
      },
      get data() {
        return n(bA);
      },
      get totalCount() {
        return n(Z);
      },
      get maxDensity() {
        return n(K);
      },
      get categoryCount() {
        return n(eA);
      },
      get categoryColors() {
        return E();
      },
      get defaultViewportState() {
        return n(aA);
      },
      querySelection: HA,
      queryClusterLabels: $,
      get automaticLabels() {
        return n(Ig);
      },
      get minimumDensity() {
        return n(BI);
      },
      get customTooltip() {
        return d();
      },
      get customOverlay() {
        return R();
      },
      get tooltip() {
        return n(z);
      },
      onTooltip: LA,
      get selection() {
        return n(EA);
      },
      onSelection: sA,
      get viewportState() {
        return y();
      },
      get onViewportState() {
        return L();
      },
      get rangeSelection() {
        return n(H);
      },
      onRangeSelection: (XA) => {
        x(H, XA), IA()?.(XA);
      }
    });
  }
  yI();
}
class yo {
  component;
  currentProps;
  constructor(I, g) {
    this.currentProps = { ...g }, this.component = Te({ component: eo, target: I, props: g });
  }
  update(I) {
    let g = {};
    for (let B in I)
      I[B] !== this.currentProps[B] && (g[B] = I[B], this.currentProps[B] = I[B]);
    this.component.$set(g);
  }
  destroy() {
    this.component.$destroy();
  }
}
function Fo() {
  return ZC() ? 32 : 4;
}
let cA;
const ri = typeof TextDecoder < "u" ? new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
typeof TextDecoder < "u" && ri.decode();
let og = null;
function pg() {
  return (og === null || og.byteLength === 0) && (og = new Uint8Array(cA.memory.buffer)), og;
}
function cB(A, I) {
  return A = A >>> 0, ri.decode(pg().subarray(A, A + I));
}
const iI = new Array(128).fill(void 0);
iI.push(void 0, null, !0, !1);
let cg = iI.length;
function UA(A) {
  cg === iI.length && iI.push(iI.length + 1);
  const I = cg;
  return cg = iI[I], iI[I] = A, I;
}
function BA(A) {
  return iI[A];
}
function io(A) {
  A < 132 || (iI[A] = cg, cg = A);
}
function ng(A) {
  const I = BA(A);
  return io(A), I;
}
function DB(A) {
  return A == null;
}
let rg = null;
function Qo() {
  return (rg === null || rg.byteLength === 0) && (rg = new Float64Array(cA.memory.buffer)), rg;
}
let ag = null;
function Eg() {
  return (ag === null || ag.byteLength === 0) && (ag = new Int32Array(cA.memory.buffer)), ag;
}
let jI = 0;
const xg = typeof TextEncoder < "u" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} }, Eo = typeof xg.encodeInto == "function" ? function(A, I) {
  return xg.encodeInto(A, I);
} : function(A, I) {
  const g = xg.encode(A);
  return I.set(g), {
    read: A.length,
    written: g.length
  };
};
function XC(A, I, g) {
  if (g === void 0) {
    const E = xg.encode(A), Q = I(E.length, 1) >>> 0;
    return pg().subarray(Q, Q + E.length).set(E), jI = E.length, Q;
  }
  let B = A.length, C = I(B, 1) >>> 0;
  const i = pg();
  let e = 0;
  for (; e < B; e++) {
    const E = A.charCodeAt(e);
    if (E > 127) break;
    i[C + e] = E;
  }
  if (e !== B) {
    e !== 0 && (A = A.slice(e)), C = g(C, B, B = e + A.length * 3, 1) >>> 0;
    const E = pg().subarray(C + e, C + B), Q = Eo(A, E);
    e += Q.written, C = g(C, B, e, 1) >>> 0;
  }
  return jI = e, C;
}
function JB(A) {
  const I = typeof A;
  if (I == "number" || I == "boolean" || A == null)
    return `${A}`;
  if (I == "string")
    return `"${A}"`;
  if (I == "symbol") {
    const C = A.description;
    return C == null ? "Symbol" : `Symbol(${C})`;
  }
  if (I == "function") {
    const C = A.name;
    return typeof C == "string" && C.length > 0 ? `Function(${C})` : "Function";
  }
  if (Array.isArray(A)) {
    const C = A.length;
    let i = "[";
    C > 0 && (i += JB(A[0]));
    for (let e = 1; e < C; e++)
      i += ", " + JB(A[e]);
    return i += "]", i;
  }
  const g = /\[object ([^\]]+)\]/.exec(toString.call(A));
  let B;
  if (g.length > 1)
    B = g[1];
  else
    return toString.call(A);
  if (B == "Object")
    try {
      return "Object(" + JSON.stringify(A) + ")";
    } catch {
      return "Object";
    }
  return A instanceof Error ? `${A.name}: ${A.message}
${A.stack}` : B;
}
let sg = null;
function to() {
  return (sg === null || sg.byteLength === 0) && (sg = new Float32Array(cA.memory.buffer)), sg;
}
function oo(A, I) {
  const g = I(A.length * 4, 4) >>> 0;
  return to().set(A, g / 4), jI = A.length, g;
}
function no(A, I) {
  if (!(A instanceof I))
    throw new Error(`expected instance of ${I.name}`);
  return A.ptr;
}
function ro(A, I) {
  no(A, ai);
  const g = cA.find_clusters(A.__wbg_ptr, UA(I));
  return ng(g);
}
const ao = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((A) => cA.__wbg_densitymap_free(A >>> 0));
class ai {
  __destroy_into_raw() {
    const I = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ao.unregister(this), I;
  }
  free() {
    const I = this.__destroy_into_raw();
    cA.__wbg_densitymap_free(I);
  }
  /**
  * @param {number} width
  * @param {number} height
  * @param {Float32Array} data
  */
  constructor(I, g, B) {
    const C = oo(B, cA.__wbindgen_malloc), i = jI, e = cA.densitymap_new(I, g, C, i);
    return this.__wbg_ptr = e >>> 0, this;
  }
  /**
  * @returns {number}
  */
  width() {
    return cA.densitymap_width(this.__wbg_ptr);
  }
  /**
  * @returns {number}
  */
  height() {
    return cA.densitymap_height(this.__wbg_ptr);
  }
}
async function so(A, I) {
  if (typeof Response == "function" && A instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming == "function")
      try {
        return await WebAssembly.instantiateStreaming(A, I);
      } catch (B) {
        if (A.headers.get("Content-Type") != "application/wasm")
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", B);
        else
          throw B;
      }
    const g = await A.arrayBuffer();
    return await WebAssembly.instantiate(g, I);
  } else {
    const g = await WebAssembly.instantiate(A, I);
    return g instanceof WebAssembly.Instance ? { instance: g, module: A } : g;
  }
}
function lo() {
  const A = {};
  return A.wbg = {}, A.wbg.__wbindgen_error_new = function(I, g) {
    const B = new Error(cB(I, g));
    return UA(B);
  }, A.wbg.__wbindgen_boolean_get = function(I) {
    const g = BA(I);
    return typeof g == "boolean" ? g ? 1 : 0 : 2;
  }, A.wbg.__wbindgen_object_drop_ref = function(I) {
    ng(I);
  }, A.wbg.__wbindgen_is_object = function(I) {
    const g = BA(I);
    return typeof g == "object" && g !== null;
  }, A.wbg.__wbindgen_is_undefined = function(I) {
    return BA(I) === void 0;
  }, A.wbg.__wbindgen_in = function(I, g) {
    return BA(I) in BA(g);
  }, A.wbg.__wbindgen_number_get = function(I, g) {
    const B = BA(g), C = typeof B == "number" ? B : void 0;
    Qo()[I / 8 + 1] = DB(C) ? 0 : C, Eg()[I / 4 + 0] = !DB(C);
  }, A.wbg.__wbindgen_is_string = function(I) {
    return typeof BA(I) == "string";
  }, A.wbg.__wbindgen_jsval_loose_eq = function(I, g) {
    return BA(I) == BA(g);
  }, A.wbg.__wbindgen_string_get = function(I, g) {
    const B = BA(g), C = typeof B == "string" ? B : void 0;
    var i = DB(C) ? 0 : XC(C, cA.__wbindgen_malloc, cA.__wbindgen_realloc), e = jI;
    Eg()[I / 4 + 1] = e, Eg()[I / 4 + 0] = i;
  }, A.wbg.__wbindgen_number_new = function(I) {
    return UA(I);
  }, A.wbg.__wbindgen_bigint_from_u64 = function(I) {
    const g = BigInt.asUintN(64, I);
    return UA(g);
  }, A.wbg.__wbindgen_object_clone_ref = function(I) {
    const g = BA(I);
    return UA(g);
  }, A.wbg.__wbindgen_string_new = function(I, g) {
    const B = cB(I, g);
    return UA(B);
  }, A.wbg.__wbg_getwithrefkey_15c62c2b8546208d = function(I, g) {
    const B = BA(I)[BA(g)];
    return UA(B);
  }, A.wbg.__wbg_set_20cbc34131e76824 = function(I, g, B) {
    BA(I)[ng(g)] = ng(B);
  }, A.wbg.__wbg_new_16b304a2cfa7ff4a = function() {
    const I = new Array();
    return UA(I);
  }, A.wbg.__wbg_new_d9bc3a0147634640 = function() {
    return UA(/* @__PURE__ */ new Map());
  }, A.wbg.__wbg_new_72fb9a18b5ae2624 = function() {
    const I = new Object();
    return UA(I);
  }, A.wbg.__wbg_set_d4638f722068f043 = function(I, g, B) {
    BA(I)[g >>> 0] = ng(B);
  }, A.wbg.__wbg_instanceof_ArrayBuffer_836825be07d4c9d2 = function(I) {
    let g;
    try {
      g = BA(I) instanceof ArrayBuffer;
    } catch {
      g = !1;
    }
    return g;
  }, A.wbg.__wbg_set_8417257aaedc936b = function(I, g, B) {
    const C = BA(I).set(BA(g), BA(B));
    return UA(C);
  }, A.wbg.__wbg_buffer_12d079cc21e14bdb = function(I) {
    const g = BA(I).buffer;
    return UA(g);
  }, A.wbg.__wbg_new_63b92bc8671ed464 = function(I) {
    const g = new Uint8Array(BA(I));
    return UA(g);
  }, A.wbg.__wbg_set_a47bac70306a19a7 = function(I, g, B) {
    BA(I).set(BA(g), B >>> 0);
  }, A.wbg.__wbg_length_c20a40f15020d68a = function(I) {
    return BA(I).length;
  }, A.wbg.__wbg_instanceof_Uint8Array_2b3bbecd033d19f6 = function(I) {
    let g;
    try {
      g = BA(I) instanceof Uint8Array;
    } catch {
      g = !1;
    }
    return g;
  }, A.wbg.__wbindgen_debug_string = function(I, g) {
    const B = JB(BA(g)), C = XC(B, cA.__wbindgen_malloc, cA.__wbindgen_realloc), i = jI;
    Eg()[I / 4 + 1] = i, Eg()[I / 4 + 0] = C;
  }, A.wbg.__wbindgen_throw = function(I, g) {
    throw new Error(cB(I, g));
  }, A.wbg.__wbindgen_memory = function() {
    const I = cA.memory;
    return UA(I);
  }, A;
}
function ho(A, I) {
  return cA = A.exports, si.__wbindgen_wasm_module = I, sg = null, rg = null, ag = null, og = null, cA;
}
async function si(A) {
  if (cA !== void 0) return cA;
  typeof A > "u" && (A = new URL("data:application/wasm;base64,AGFzbQEAAAAB7wEjYAJ/fwF/YAN/f38Bf2ACf38AYAN/f38AYAF/AGABfwF/YAR/f39/AGAFf39/f38AYAABf2AEf39/fwF/YAAAYAV/f39/fwF/YAR/fH9/AX9gBn9/f39/fwF/YAJ/fwF+YAR/f35/AGAGf39/f39/AGACfHwBfGABfAF/YAF+AX9gAn98AGAJf39/f39/fn5+AGAHf39/f39/fwF/YAN/f38BfmADfn9/AX9gBX9/fn9/AGAEf35/fwBgBX9/fX9/AGAEf31/fwBgBX9/fH9/AGAEf3x/fwBgA39/fQBgA39/fABgAn19AX1gAXwBfALEBx4Dd2JnFF9fd2JpbmRnZW5fZXJyb3JfbmV3AAADd2JnFl9fd2JpbmRnZW5fYm9vbGVhbl9nZXQABQN3YmcaX193YmluZGdlbl9vYmplY3RfZHJvcF9yZWYABAN3YmcUX193YmluZGdlbl9pc19vYmplY3QABQN3YmcXX193YmluZGdlbl9pc191bmRlZmluZWQABQN3YmcNX193YmluZGdlbl9pbgAAA3diZxVfX3diaW5kZ2VuX251bWJlcl9nZXQAAgN3YmcUX193YmluZGdlbl9pc19zdHJpbmcABQN3YmcZX193YmluZGdlbl9qc3ZhbF9sb29zZV9lcQAAA3diZxVfX3diaW5kZ2VuX3N0cmluZ19nZXQAAgN3YmcVX193YmluZGdlbl9udW1iZXJfbmV3ABIDd2JnGl9fd2JpbmRnZW5fYmlnaW50X2Zyb21fdTY0ABMDd2JnG19fd2JpbmRnZW5fb2JqZWN0X2Nsb25lX3JlZgAFA3diZxVfX3diaW5kZ2VuX3N0cmluZ19uZXcAAAN3YmckX193YmdfZ2V0d2l0aHJlZmtleV8xNWM2MmMyYjg1NDYyMDhkAAADd2JnGl9fd2JnX3NldF8yMGNiYzM0MTMxZTc2ODI0AAMDd2JnGl9fd2JnX25ld18xNmIzMDRhMmNmYTdmZjRhAAgDd2JnGl9fd2JnX25ld19kOWJjM2EwMTQ3NjM0NjQwAAgDd2JnGl9fd2JnX25ld183MmZiOWExOGI1YWUyNjI0AAgDd2JnGl9fd2JnX3NldF9kNDYzOGY3MjIwNjhmMDQzAAMDd2JnLV9fd2JnX2luc3RhbmNlb2ZfQXJyYXlCdWZmZXJf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ACANIAJBCGsgC3FqIAQ6AAAgBSACQX9zQRRsaiECQf8BRg0CIAMtAAEhBCADIAItAAE6AAEgAy0AAiEGIAMgAi0AAjoAAiADLQADIQggAyACLQADOgADIAMtAAAhDCADIAItAAA6AAAgAiAEOgABIAIgBjoAAiACIAg6AAMgAiAMOgAAIAMtAAUhBCADIAItAAU6AAUgAy0ABiEGIAMgAi0ABjoABiADLQAHIQggAyACLQAHOgAHIAMtAAQhDCADIAItAAQ6AAQgAiAEOgAFIAIgBjoABiACIAg6AAcgAiAMOgAEIAMtAAkhBCADIAItAAk6AAkgAy0ACiEGIAMgAi0ACjoACiADLQALIQggAyACLQALOgALIAMtAAghDCADIAItAAg6AAggAiAEOgAJIAIgBjoACiACIAg6AAsgAiAMOgAIIAMtAA0hBCADIAItAA06AA0gAy0ADiEGIAMgAi0ADjoADiADLQAPIQggAyACLQAPOgAPIAMtAAwhDCADIAItAAw6AAwgAiAEOgANIAIgBjoADiACIAg6AA8gAiAMOgAMIAMtABEhBCADIAItABE6ABEgAy0AEiEGIAMgAi0AEjoAEiADLQATIQggAyACLQATOgATIAMtABAhDCADIAItABA6ABAgAiAEOgARIAIgBjoAEiACIAg6ABMgAiAMOgAQDAELCyAKIAhBGXYiAjoAACANIAdBCGsgC3FqIAI6AAAMAQsgCkH/AToAACANIAdBCGsgC3FqQf8BOgAAIAJBEGogA0EQaigAADYAACACQQhqIANBCGopAAA3AAAgAiADKQAANwAACyAHQQFqIQIgByALRw0ACwsgACAJIA9rNgIIDAELIAAgBjYCBCAAIAk2AgAgACAIIA9rNgIIIAtFDQAgCyANQRRsQQdqQXhxIgBqQQlqIgFFDQAgAyAAayABELUBCyAOQSBqJAALoy8DIH8EfAF+IwBBMGsiCiQAAkACQAJAAkACQCABvSImQiCIpyIEQf////8HcSIFQfvUvYAETwRAIAVBvIzxgARPBEAgCkH/////BwJ/AkAgBUH7w+SJBE8EQCAFQf//v/8HSw0FICZC/////////weDQoCAgICAgICwwQCEvyIBRAAAAAAAAODBZiEEIAGZRAAAAAAAAOBBY0UNASABqgwCCwJAIAVBFHYiBSABIAFEg8jJbTBf5D+iRAAAAAAAADhDoEQAAAAAAAA4w6AiI0QAAEBU+yH5v6KgIgEgI0QxY2IaYbTQPaIiJaEiJL1CNIinQf8PcWtBEUgNACAFIAEgI0QAAGAaYbTQPaIiJKEiIiAjRHNwAy6KGaM7oiABICKhICShoSIloSIkvUI0iKdB/w9xa0EySARAICIhAQwBCyAiICNEAAAALooZozuiIiShIgEgI0TBSSAlmoN7OaIgIiABoSAkoaEiJaEhJAsgACAkOQMAIAAgASAkoSAloTkDECAjRAAAAAAAAODBZiEFIABB/////wcCfyAjmUQAAAAAAADgQWMEQCAjqgwBC0GAgICAeAtBgICAgHggBRsgI0QAAMD////fQWQbQQAgIyAjYRs2AggMCAtBgICAgHgLQYCAgIB4IAQbIAFEAADA////30FkG0EAIAEgAWEbtyIiOQMAIAEgIqFEAAAAAAAAcEGiIgFEAAAAAAAA4MFmIQQgCkH/////BwJ/IAGZRAAAAAAAAOBBYwRAIAGqDAELQYCAgIB4C0GAgICAeCAEGyABRAAAwP///99BZBtBACABIAFhGyIEtyIiOQMIIAogASAioUQAAAAAAABwQaIiATkDECAKQgA3AyggCkIANwMgIApCADcDGCAKQRhqIRIjAEGwBGsiAyQAIANCADcDmAEgA0IANwOQASADQgA3A4gBIANCADcDgAEgA0IANwN4IANCADcDcCADQgA3A2ggA0IANwNgIANCADcDWCADQgA3A1AgA0IANwNIIANCADcDQCADQgA3AzggA0IANwMwIANCADcDKCADQgA3AyAgA0IANwMYIANCADcDECADQgA3AwggA0IANwMAIANCADcDuAIgA0IANwOwAiADQgA3A6gCIANCADcDoAIgA0IANwOYAiADQgA3A5ACIANCADcDiAIgA0IANwOAAiADQgA3A/gBIANCADcD8AEgA0IANwPoASADQgA3A+ABIANCADcD2AEgA0IANwPQASADQgA3A8gBIANCADcDwAEgA0IANwO4ASADQgA3A7ABIANCADcDqAEgA0IANwOgASADQgA3A9gDIANCADcD0AMgA0IANwPIAyADQgA3A8ADIANCADcDuAMgA0IANwOwAyADQgA3A6gDIANCADcDoAMgA0IANwOYAyADQgA3A5ADIANCADcDiAMgA0IA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oiIkoSIBICNEwUkgJZqDezmiICIgAaEgJKGhIiWhISQLIAAgJDkDACAAIAEgJKEgJaE5AxAgI0QAAAAAAADgwWYhBSAAQf////8HAn8gI5lEAAAAAAAA4EFjBEAgI6oMAQtBgICAgHgLQYCAgIB4IAUbICNEAADA////30FkG0EAICMgI2EbNgIIDAELAkAgASABRIPIyW0wX+Q/okQAAAAAAAA4Q6BEAAAAAAAAOMOgIiNEAABAVPsh+b+ioCIBICNEMWNiGmG00D2iIiWhIiS9QoCAgICAgID4/wCDQv////////+HP1YNACABICNEAABgGmG00D2iIiShIiIgI0RzcAMuihmjO6IgASAioSAkoaEiJaEiJL1CgICAgICAgID/AINC//////////88VgRAICIhAQwBCyAiICNEAAAALooZozuiIiShIgEgI0TBSSAlmoN7OaIgIiABoSAkoaEiJaEhJAsgACAkOQMAIAAgASAkoSAloTkDECAjRAAAAAAAAODBZiEFIABB/////wcCfyAjmUQAAAAAAADgQWMEQCAjqgwBC0GAgICAeAtBgICAgHggBRsgI0QAAMD////fQWQbQQAgIyAjYRs2AggLIApBMGokAAuGDgIRfwJ+IwBBIGsiDSQAAkACQAJAAkACQAJAAkAgACgCDCIOQQFqIgIgDk8EQCAAKAIEIgogCkEBaiIEQQN2IgVBB2wgCkEISRsiDEEBdiACSQRAIAIgDEEBaiACIAxLGyIFQQhJDQIgBUH/////AUsEQBB7IA0oAhgaDAkLQX8gBUEDdEEHbkEBa2d2IgVB/v///wBLDQYgBUEBaiECDAULQQAhAiAAKAIAIQYCQCAFIARBB3FBAEdqIghFDQAgCEEBRwRAIAhB/v///wNxIQsDQCACIAZqIgUgBSkDACITQn+FQgeIQoGChIiQoMCAAYMgE0L//v379+/fv/8AhHw3AwAgBUEIaiIFIAUpAwAiE0J/hUIHiEKBgoSIkKDAgAGDIBNC//79+/fv37//AIR8NwMAIAJBEGohAiALQQJrIgsNAAsLIAhBAXFFDQAgAiAGaiIFIAUpAwAiE0J/hUIHiEKBgoSIkKDAgAGDIBNC//79+/fv37//AIR8NwMACyAEQQhPBEAgBCAGaiAGKQAANwAADAMLIAZBCGogBiAEEM4BIAQNAkEA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dGoiASARNgIEIAEgEzYCAEEAIBNBAWoiASABIDBGIgEbIRMgASARaiIRIDNIDQALCyASIDM2AtgCIBIgMDYC1AIgEiAzNgLQAiASIDA2AswCIBIgIDYCyAIgEiAfNgLEAiASICA2AsACIDNBAEwEQEEEITgMCQsgLygCBCE1IC8oAgghHANAIBUgMGwgKmoiASAcTw0EICpBAWohHiA1IAFBAnRqKgIAIT4gEkKAgICAEDcCQCASQoCAgIBwNwI4IBJCATcCMCASQv////8PNwIoQQAhEyA8ITsgGSEUIBYhEUEAIQEDQCARIRYgFCEZIDshPANAIAEhGANAIBJBKGogE0EDdGohAQNAIAEhESATQQRGBEAgGARAIBJBIGogEkHAAmoiEyAqIBUQayASKAIgIBIoAiQgEkEYaiATIBYgGRBrIDBsaiIBICBPDQwgEigCGCERIB8gAUEDdGoiASASKAIcNgIEIAEgETYCAAtBACAeIB4gMEYiARshKiABIBVqIhUgM0gNBSASQQA2AjAgEkKAgICAwAA3AihBACETQQAhEQNAIBJBEGogEkHAAmogESATEGsCQCASKAIQIBFHDQAgEigCFCATRw0AIBMgMGwgEWoiASAoTw0MIDQgAUECdGoiASgCAEF/Rw0AIAEgEigCMCIUNgIAIBIoAiggFEYEQCASQShqEFwLIBIoAiwgFEEcbGoiAUIANwIIIAFCfzcCACABQRBqQgA3AgAgAUEYakEANgIAIBIgFEEBajYCMAtBACARQQFqIgEgASAwRiIBGyERIAEgE2oiEyAzSA0AC0EAIRNBACEBDA0LIBFBCGohASATQQFqIRMgEUEEaigCACAVaiIUIDNODQAgESgCACAqaiIRIDBOIBEgFHJBAEhyDQALIBQgMGwgEWoiASAcTw0KIDUgAUECdGoqAgAiOyA+YEUNAAtBASEBIBhFDQEgOyA8XkUNAAsMAAsACwALICYgI0GgkMAAEHYACyAmIChBsJDAABB2AAsgASAgQZyYwAAQdgALIAEgHEHAkcAAEHYACyABIChBsJHAABB2AAsgASAgQbyYwAAQdgALIAEgHEHQkcAAEHYACwJAAkACQAJAA0AgEkEIaiASQcACaiABIBMQayASKAIIIBIoAgwgMGxqIhEgKE8NASATIDBsIAFqIhQgKE8NAiA0IBRBAnQiFmogNCARQQJ0aigCACIZNgIAIBkgEigCMCIRTw0EIBQgHE8NAyATIAFBAWoiFSAwRiIUaiAWIDVqKgIAIjsgEigCLCAZQRxsaiIWKgIYXgRAIBYgEzYCBCAWIAE2AgAgFiA7OAIYCyAWIDsgFioCDJI4AgwgFiAWKAIIQQFqNgIIIBYgOyABspQgFioCEJI4AhAgFiA7IBOylCAWKgIUkjgCFEEAIBUgFBshASITIDNIDQALIBIoAjAhNiASKAIsITggEigCKCE3DAQLIBEgKEHwkMAAEHYACyAUIChBgJHAABB2AAsgFCAcQaCRwAAQdgALIBkgEUGQkcAAEHYACyAgBEAgHyAgQQN0ELUBCyAoITUMAQsgGgRAIAEgGkEDdBC1AQsgEkHAAmogEkHQAWoQNgJAAkACQAJAAkAgEigCwAIEQCAvKAIEIRYgLygCCCEYA0AgEigC0AIhGiASKgLMAiE8IBIoAsgCISAgEigCxAIhHCASQoCAgIDAADcCSCASQoCAgIAQNwJAIBJCgICAgHA3AjggEkIBNwIwIBJC/////w83AihBACETA0ACQCASQShqIBNBA3RqIgEoAgQgIGoiGSAzTg0AIAEoAgAgHGoiFSAwTiAVIBlyQQBIcg0AIBkgMGwgFWoiFCAoTw0HIDQgFEECdCIRaiIBKAIAQX9HDQAgFCAYTw0GIBEgFmoqAgAiOyA8Xg0AIAEgGjYCACASKALYASIBIBIoAtABRgRAIBJB0AFqEF0LIAFBBHQiESASKALUAWoiFCAaNgIMIBQgOzgCCCAUIBk2AgQgFCAVNgIAIBIgAUEBajYC2AEgEigC1AEiHiARaiIRKAIMIRQgESoCCCE7IBEoAgQhHyARKAIAIRkCQCABRQRAQQAhFQwBCwNAAkAgGSAeIAFBAWsiEUEBdiIVQQR0aiIjKAIARw0AIB8gIygCBEcNACABIRUMAgsgOyAjKgIIXkUEQCABIRUMAgsgHiABQQR0aiIBICMpAgA3AgAgAUEIaiAjQQhqKQIANwIAIBUhASARQQFLDQALCyAeIBVBBHRqIgEgFDYCDCABIDs4AgggASAfNgIEIAEgGTYCAAsgE0EBaiITQQRHDQALIBogEigCqAIiAU8NAiASKAKkAiAaQRxsaiIBKgIYIDxdBEAgASAgNgIEIAEgHDYCACABIDw4AhgLIAEgPCABKgIMkjgCDCABIAEoAghBAWo2AgggASA8IByylCABKgIQkjgCECABIDwgILKUIAEqAhSSOAIUIBJBwAJqIBJB0AFqEDYgEigCwAINAAsLIBJBMGoiESASQagCaigCADYCACASIBIpAqACNwMoIBIoAtABIgEEQCASKALUASABQQR0ELUBCyASQcgCaiARKAIANgIAIBIgEikDKDcDwAIgKUH/AXFFIDNBAExyDQQgLygCBCEVIC8oAgghFkEAISBBACEfA0AgICAwbCAfaiIBIChPDQICQAJAIDQgAUECdGooAgBBf0cNACASKALIAiEeIBJCgICAgMAANwIoIBJCADcCMCASQShqEGpBACEqIBIoAiwgEigCMCASKAI0aiIRIBIoAigiAUEAIAEgEU0ba0EDdGoiASAgNgIEIAEgHzYCACASIBIoAjRBAWoiFDYCNAJAIBRFBEBDAAAAACE9QX8hLkF/IRhDAAAAACE/QwAAAAAhPkMAAAAAITwMAQtBfyEYQwAAAAAhPEMAAAAAIT5DAAAAACE/QwAAAAAhPUF/IS4DQCASIBRBAWsiFDYCNCASIBIoAjAiE0EBaiIRIBIoAigiAUEAIAEgEU0bazYCMCASKAIsIBNBA3RqIgEoAgAhIwJAAkACQCABKAIEIhwgM04iEw0AICNBAWsiGSAwTiAZIBxyQQBIcg0AIBwgMGwgGWoiASAoTw0BIDQgAUECdGoiASgCAEF/Rw0AIAEgHjYCACASKAI0IhQgEigCKCIBRgRAIBJBKGoQaiASKAI0IRQgEigCKCEBCyASKAIsIBIoAjAgFGoiESABQQAgASARTRtrQQN0aiIBIBw2AgQgASAZNgIAIBIgEigCNEEBaiIUNgI0CwJAIBMNACAjQQFqIhMgME4gEyAcckEASHINACAcIDBsIBNqIgEgKE8NASA0IAFBAnRqIgEoAgBBf0cNACABIB42AgAgEigCNCIUIBIoAigiAUYEQCASQShqEGogEigCNCEUIBIoAighAQsgEigCLCASKAIwIBRqIhEgAUEAIAEgEU0ba0EDdGoiASAcNgIEIAEgEzYCACASIBIoAjRBAWoiFDYCNAsCQCAcQQFrIhMgI3JBAEggEyAzTnIgIyAwTnINACATIDBsICNqIgEgKE8NASA0IAFBAnRqIgEoAgBBf0cNACABIB42AgAgEigCNCIUIBIoAigiAUYEQCASQShqEGogEigCNCEUIBIoAighAQsgEigCLCASKAIwIBRqIhEgAUEAIAEgEU0ba0EDdGoiASATNgIEIAEgIzYCACASIBIoAjRBAWoiFDYCNAsgHEEBaiITICNyQQBIIBMgM05yICMgME5yDQEgEyAwbCAjaiIBIChPDQAgNCABQQJ0aiIBKAIAQX9HDQEgASAeNgIAIBIoAjQiFCASKAIoIgFGBEAgEkEoahBqIBIoAjQhFCASKAIoIQELIBIoAiwgEigCMCAUaiIRIAFBACABIBFNG2tBA3RqIgEgEzYCBCABICM2AgAgEiASKAI0QQFqIhQ2AjQMAQsgASAoQeCQwAAQdgALIBwgMGwgI2oiASAWTw0DIBUgAUECdGoqAgAiOyA8IDsgPF4iARshPCAcIBggARshGCAjIC4gARshLiAqQQFqISogPSA7kiE9ID4gOyAcspSSIT4gPyA7ICOylJIhPyAUDQALCyASKALIAiIBIBIoAsACRgRAIBJBwAJqEFwLIBIoAsQCIAFBHGxqIhEgPDgCGCARID44AhQgESA/OAIQIBEgPTgCDCARICo2AgggESAYNgIEIBEgLjYCACASIAFBAWo2AsgCIBIoAigiAUUNACASKAIsIAFBA3QQtQELQQAgH0EBaiIBIAEgMEYiARshHyABICBqIiAgM04NBgwBCwsgASAWQdCQwAAQdgALIBogAUHwj8AAEHYACyABIChBwJDAABB2AAsgFCAYQZCQwAAQdgALIBQgKEGAkMAAEHYACyASKALIAiE2IBIoAsQCITggEigCwAIhNwsCfkGY4MAAKQMAUEUEQEGo4MAAKQMAIQNBoODAACkDAAwBC0ICIQNBqODAAEICNwMAQZjgwABCATcDAEIBCyECIBJBuAFqQcCPwAApAwA3AwAgEiACNwPAAUGg4MAAIAJCAXw3AwAgEiADNwPIASASQbiPwAApAwA3A7ABAn4CQCAzQQBKBEAgM0EBayExIDBBAWshLSAvKAIEISQgLygCCCEhQQAhGEEAIRYCQAJAAkACQANAAkAgEiAYNgLEAiASIBhBAWoiHDYCzAIgEiAWNgLIAiASIBZBAWoiGjYCwAIgEkECNgLUAgJAICggGCAwbCAWaiIsSwRAICQgLEECdCIBaiEeIAEgNGohH0EAIRNBAiEVA0AgEkHAAmogE0EDdGohAQNAIBMgFUYNAyABIhFBCGohASATQQFqIRMgESgCACIjIC1ODQAgEUEEaigCACIgIDFODQALIBIgEzYC0AIgICAwbCAjaiI5IChPDQUgNCA5QQJ0IhlqKAIAIiZBf0YNACAfKAIAIilBf0YgJiApRnINACASQShqIBJBsAFqICkgJhBLAkAgEigCKARAIBIoAkAiIigCACIuICIoAgQiGyASKQMwpyIncSIVaikAAEKAgYKEiJCgwIB/gyICUARAQQghEwNAIBMgFWohASATQQhqIRMgLiABIBtxIhVqKQAAQoCBgoSIkKDAgH+DIgJQDQALCyAuIAJ6p0EDdiAVaiAbcSITaiwAACIVQQBOBEAgLiAuKQMAQoCBgoSIkKDAgH+DeqdBA3YiE2otAAAhFQsgEigCPCEUIBIoAjghESATIC5qICdBGXYiAToAACAuIBNBCGsgG3FqQQhqIAE6AAAgIiAiKAIIIBVBAXFrNgIIICIgIigCDEEBajYCDCAuIBNBaGxqIhNBGGsiAUEQakIANwIAIAFBCGpCgICAgMAANwIAIAFBBGogFDYCACABIBE2AgAMAQsgEigCOCETCyAhICxNDQYgE0EQayEnIB4qAgAiOyATQQRrIgEqAgBeBEAgASA7OAIACyATQQhrIgEoAgAiFCAnKAIARgRAICcQWwsgE0EMaygCACAUQQxsaiIRIDs4AgggESAYNgIEIBEgFjYCACABIBRBAWo2AgAgEkEoaiASQbABaiAmICkQSwJAIBIoAigEQCASKAJAIicoAgAiGyAnKAIEIikgEikDMKciFHEiFWopAABCgIGChIiQoMCAf4MiAlAEQEEIIRMDQCATIBVqIQEgE0EIaiETIBsgASApcSIVaikAAEKAgYKEiJCgwIB/gyICUA0ACwsgGyACeqdBA3YgFWogKXEiE2osAAAiFUEATgRAIBsgGykDAEKAgYKEiJCgwIB/g3qnQQN2IhNqLQAAIRULIBIoAjwhIiASKAI4IREgEyAbaiAUQRl2IgE6AAAgGyATQQhrIClxakEIaiABOgAAICcgJygCCCAVQQFxazYCCCAnICcoAgxBAWo2AgwgGyATQWhsaiITQRhrIgFBEGpCADcCACABQQhqQoCAgIDAADcCACABQQRqICI2AgAgASARNgIADAELIBIoAjghEwsgISA5TQ0HIBkgJGoqAgAiOyATQQRrIgEqAgBeBEAgASA7OAIACyATQQhrIhEoAgAiFCATQRBrIgEoAgBGBEAgARBbCyATQQxrKAIAIBRBDGxqIgEgOzgCCCABICA2AgQgASAjNgIAIBEgFEEBajYCACASKALQAiETIBIoAtQCIRUMAAsACyAtIBIoAsACSgRAIBIoAsQCIDFIDQILIBIoAsgCIC1ODQAgEigCzAIgMUgNAQtBACAaIBogMEYiARshFiAzIBwgGCABGyIYSg0BDAULCyAsIChB4JHAABB2AAsgOSAoQfCRwAAQdgALICwgIUGAksAAEHYACyA5ICFBkJLAABB2AAtBmODAACkDAFANAQtBqODAACkDACEDQaDgwAApAwAMAQtCAiEDQajgwABCAjcDAEGY4MAAQgE3AwBCAQshAkEAIRwgEkHYAWpBwI/AACkDADcDACASIAI3A+ABQaDgwAAgAkIBfDcDACASIAM3A+gBIBJBuI/AACkDADcD0AEgEigCsAEhESASKAK8ASEuIBIoArQBIhMEfiATQQFqrUIYfiICpyEBAkAgAkIgiFBFDQAgASABIBNBCWpqIhNLDQBBCCEcIBNB+f///wdJDQBBACEcCyATrSARIAFrrUIghoQFQgALIQcCQCAuRQ0AIBFBCGohASARKQMAQn+FQoCBgoSIkKDAgH+DIQIgEkEsaiEgIBJB9AFqIR4gEkE4aiEZA0AgAlAEQCABIRMDQCARQcABayERIBMpAwAgE0EIaiIBIRNCf4VCgIGChIiQoMCAf4MiAlANAAsLIBEgAnqnQQN2QWhsakEYayIWKAIAIRQgFkEEaigCACEaIBZBCGooAgAhFSASQcgCaiITIBZBFGooAgA2AgAgEiAWQQxqKQIANwPAAiAuQQFrIS4gAkIBfSACgyECIBVBgICAgHhGBEAgLkUNAgNAIAJQBEAgASETA0AgEUHAAWshESATKQMAIBNBCGoiASETQn+FQoCBgoSIkKDAgH+DIgJQDQALCyARIAJ6p0EDdkFobGoiFEEQaygCACITBEAgFEEMaygCACATQQxsELUBCyACQgF9IAKDIQIgLkEBayIuDQALDAILIB4gEikDwAI3AgAgHkEIaiATKAIANgIAIBIgFTYC8AEgEkEoaiAS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IykCADcCACABIBU2AgAMAQsgFEEIaiABQRBrIgFBDGoiESgCADYCACAUIAFBBGoiASkCADcCACABICMpAgA3AgAgESAjQQhqKAIANgIACyAcQRBqJAAgEigCgAIiAUGAgICAeEYgAUVyRQRAIBIoAoQCIAFBAnQQtQELIBJBmAJqIDggFUEcbGoiAUEYaigCADYCACASQZACaiABQRBqKQIANwMAIBJBiAJqIAFBCGopAgA3AwAgEiABKQIANwOAAiASQShqIgEgEkHAAmogFSASQYACahA4IAEgEkHQAWogFRBOIBIoAigEQAJ+QZjgwAApAwBQRQRAQajgwAApAwAhBEGg4MAAKQMADAELQgIhBEGo4MAAQgI3AwBBmODAAEIBNwMAQgELIQMgEigCPCEcIBIoAjghFiASKQMwIQJBoODAACADQgF8NwMAIB5BCGogCDcCACAeIAc3AgAgHCgCACIgIBwoAgQiGSACpyIUcSITaikAAEKAgYKEiJCgwIB/gyICUARAQQghEQNAIBEgE2ohASARQQhqIREgICABIBlxIhNqKQAAQoCBgoSIkKDAgH+DIgJQDQALCyAgIAJ6p0EDdiATaiAZcSIRaiwAACITQQBOBEAgICAgKQMAQoCBgoSIkKDAgH+DeqdBA3YiEWotAAAhEwsgESAgaiAUQRl2IgE6AAAgICARQQhrIBlxakEIaiABOgAAIBwgHCgCCCATQQFxazYCCCAcIBwoAgxBAWo2AgwgICARQVhsakEoayIBIBY2AgAgAUEEaiASKQIoNwIAIAFBDGogEkEwaikCADcCACABQRRqIBJBOGooAgA2AgAgAUEgaiAENwMAIAFBGGogAzcDAAsgFUEBaiIVIDZHDQALQZjgwAApAwAhAwsgEkFAayASQegBaikDADcDACASQThqIBJB4AFqKQMANwMAIBJBMGogEkHYAWopAwA3AwAgEkHQAGogGCkDADcDACASQdgAaiASQbACaikDADcDACASQeAAaiASQbgCaikDADcDACASQfAAaiAfKQMANwMAIBJB+ABqIBJB0AJqKQMANwMAIBJBgAFqIBJB2AJqKQMANwMAIBIgEikD0AE3AyggEiASKQOgAjcDSCASIBIpA8ACNwNoAn4gA1BFBEBBqODAACkDACEDQaDgwAApAwAMAQtCAiEDQajgwABC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IBYQtwELICRBCGoiESAVNgIAIBEgFjYCBCAiQRBqJAAgJCgCCARAICQoAgwhGQwBCyMAQTBrIhokACAjKAIEIR8gIygCACERIBpBJGogJEEwaiIZKAIAEJ0BAn8gGigCJARAIBpBIGogGkEsaigCACIVNgIAIBogGikCJCIDNwMYIBpBEGogA6ciIiAREKEBIBooAhQhEQJAIBooAhBFBEAgGkEYakEEciIWIBUgERC4ASAaIBVBAWoiFTYCICAaQQhqICIgHxChASAaKAIMIREgGigCCEUNAQsgGigCHCIVQYQBTwRAIBUQAgtBAQwCCyAWIBUgERC4ASAaKAIcIREgGUEEakGohcAAQRQQOyARELcBQQAMAQsgGigCKCERQQELIRUgJCARNgIEICQgFTYCACAaQTBqJAAgJCgCAARAICQoAgQhGQwBCyAkKAI0IRlBAAwCCyAkKAI0IhFBhAFJDQAgERACC0EBCyERIBwgGTYCBCAcIBE2AgAgJEFAayQAICUoAhQhEQJAAkAgJSgCEEUEQCAlIBE2AjggJSgCIA0BICAgJUE0aiAlQThqEKYBIhRBhAFPBEAgFBACICUoAjghEQsgEUGEAU8EQCAREAILICUoAjQiEUGEAUkNAiAREAIMAgsgFEGEAUkEQCARIQEMBgsgFBACIBEhAQwFCyAUEAdBAUcNAyAgIBQgERC3AQsgAkIBfSACgyECICdBAWsiJw0ACwsgHiAoKAIANgIAIBggKykDADcDACAlICUpAyA3A0ggJUEIaiAlQcgAahCLASAlKAIMIQEgJSgCCCIRDQUgNUEEakGkicAAQQkQOyABELcBDAULICVBADYCRCAlQoCAgIAQNwI8ICVBAzoAaCAlQSA2AlggJUEANgJkICVBkILAADYCYCAlQQA2AlAgJUEANgJIICUgJUE8ajYCXEHch8AAQTMgJUHIAGoQzAENASAlKAI8IRUgJSgCQCITICUoAkQQACEBIBUEQCATIBUQtQELIBRBhAFPBEAgFBACCyARQYQBSQ0AIBEQAgsgJSgCJCIRQYQBTwRAIBEQAgsgJSgCKEUNAiAlKAIsIhFBhAFJDQIgERACDAILQbiCwABBNyAlQe8AakGogsAAQbyDwAAQcAALICUoAkwhAQtBASERCyApIBE2AgAgKSABNgIEICVB8ABqJAACfyAd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JAAL/QUBBX8gAEEIayIBIABBBGsoAgAiA0F4cSIAaiECAkACQCADQQFxDQAgA0ECcUUNASABKAIAIgMgAGohACABIANrIgFB8N/AACgCAEYEQCACKAIEQQNxQQNHDQFB6N/AACAANgIAIAIgAigCBEF+cTYCBCABIABBAXI2AgQgAiAANgIADwsgASADEEoLAkACQAJAAkACQCACKAIEIgNBAnFFBEAgAkH038AAKAIARg0CIAJB8N/AACgCAEYNAyACIANBeHEiAhBKIAEgACACaiIAQQFyNgIEIAAgAWogADYCACABQfDfwAAoAgBHDQFB6N/AACAANgIADwsgAiADQX5xNgIEIAEgAEEBcjYCBCAAIAFqIAA2AgALIABBgAJJDQIgASAAEFNBACEBQYjgwABBiODAACgCAEEBayIANgIAIAANBEHQ3cAAKAIAIgAEQANAIAFBAWohASAAKAIIIgANAAsLQYjgwABB/x8gASABQf8fTRs2AgAPC0H038AAIAE2AgBB7N/AAEHs38AAKAIAIABqIgA2AgAgASAAQQFyNgIEQfDfwAAoAgAgAUYEQEHo38AAQQA2AgBB8N/AAEEANgIACyAAQYDgwAAoAgAiA00NA0H038AAKAIAIgJFDQNBACEAQezfwAAoAgAiBEEpSQ0CQcjdwAAhAQNAIAIgASgCACIFTwRAIAIgBSABKAIEakkNBAsgASgCCCEBDAALAAtB8N/AACABNgIAQejfwABB6N/AACgCACAAaiIANgIAIAEgAEEBcjYCBCAAIAFqIAA2AgAPCyAAQXhxQdjdwABqIQICf0Hg38AAKAIAIgNBASAAQQN2dCIAcUUEQEHg38AAIAAgA3I2AgAgAgwBCyACKAIICyEAIAIgATYCCCAAIAE2AgwgASACNgIMIAEgADYCCA8LQdDdwAAoAgAiAQRAA0AgAEEBaiEAIAEoAggiAQ0ACwtBiODAAEH/HyAAIABB/x9NGzYCACADIARPDQBBgODAAEF/NgIACwuqBQIEfwV+IwBBgAFrIgQkACABvSEIAn9BAiABIAFiDQAaIAhC/////////weDIgxCgICAgICAgAiEIAhCAYZC/v///////w+DIAhCNIinQf8PcSIFGyIKQgGDIQsgCEKAgICAgICA+P8AgyEJAkACQCAMUARAQQMgCUKAgICAgICA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QRgQyQEACyAGIAQQnwEAC6sBAQR/IwBBQGoiACQAIABBADYCFCAAQoCAgIAQNwIMIABBAzoAOCAAQSA2AiggAEEANgI0IABBkILAADYCMCAAQQA2AiAgAEEANgIYIAAgAEEMajYCLEHch8AAQTMgAEEYahDMAUUEQCAAKAIMIQEgACgCECICIAAoAhQQACABBEAgAiABELUBCyAAQUBrJAAPC0G4gsAAQTcgAEE/akGogsAAQbyDwAAQcAALngEBBX8CQAJAIAEoAgAiBBAZIgJFBEBBASEDDAELQQAhASACQQBIDQFB+dvAAC0AABpBASEBIAJBARCqASIDRQ0BCxAdIgUQFiIGEBchASAGQYQBTwRAIAYQAgsgASAEIAMQGCABQYQBTwRAIAEQAgsgBUGEAU8EQCAFEAILIAAgBBAZNgIIIAAgAzYCBCAAIAI2AgAPCyABIAIQnwEAC4cBAQV/IAAoAgAhASAAEFogACgCCCIFIAEgACgCDCICa0sEQCABIAVrIgMgAiADayICSyAAKAIAIgQgAWsgAk9xRQRAIAAoAgQiASAEIANrIgRBA3RqIAEgBUEDdGogA0EDdBDOASAAIAQ2AggPCyAAKAIEIgAgAUEDdGogACACQQN0ENABGgsLlAEBBH8jAEEQayIFJAAgASgCDCADbCACaiIEIAEoAggiBkkEQCABKAIEIARBA3RqIgQoAgQhBiACIAQoAgAiB0YgAyAGRnFFBEAgBUEIaiABIAcgBhBrIAUoAgghAiAEIAUoAgwiAzYCBCAEIAI2AgALIAAgAzYCBCAAIAI2AgAgBUEQaiQADwsgBCAGQayYwAAQdgALkgEBBH8jAEEQayICJABBASEEAkAgASgCFCIDQScgASgCGCIFKAIQIgERAAANACACQQRqIAAoAgBBgQIQMAJAIAItAARBgAFGBEAgAyACKAIIIAERAABFDQEMAgsgAyACLQAOIgAgAkEEamogAi0ADyAAayAFKAIMEQEADQELIANBJyABEQAAIQQLIAJBEGokACAEC4EBAQJ/IwBBQGoiAiQAIAIgATYCDCACIAA2AgggAkECNgIUIAJB5IPAADYCECACQgE3AhwgAiACQQhqrUKAgICAIIQ3AyggAiACQShqNgIYIAJBNGogAkEQahBIIAIoAjgiACACKAI8EAAgAigCNCIDBEAgACADELUBCyACQUBrJAALiwEBAn8jAEEwayICJAAgAkEAOgAMIAIgATYCCEEBIQMgAkEBNgIUIAJBtJ3AADYCECACQgE3AhwgAiAArUKAgICAoAWENwMoIAIgAkEoajYCGAJAIAJBCGpBmJvAACACQRBqEDcNACACLQAMRQRAIAFBvJ3AAEECEKQBDQELQQAhAwsgAkEwaiQAIAMLdwEBfyMAQSBrIgIkAAJ/IAAoAgBBgICAgHhHBEAgASAAKAIEIAAoAggQpAEMAQsgAkEYaiAAKAIMIgBBEGopAgA3AwAgAkEQaiAAQQhqKQIANwMAIAIgACkCADcDCCABKAIUIAEoAhggAkEIahA3CyACQSBqJAALewEBfyMAQUBqIgUkACAFIAE2AgwgBSAANgIIIAUgAzYCFCAFIAI2AhAgBUECNgIcIAVBkL7AADYCGCAFQgI3AiQgBSAFQRBqrUKAgICA0AiENwM4IAUgBUEIaq1CgICAgOAIhDcDMCAFIAVBMGo2AiAgBUEYaiAEEHwAC8ICAQN/IwBBMGsiAyQAIAMgAjYCBCADIAE2AgAgA0ECNgIMIANB/IrAADYCCCADQgI3AhQgAyADrUKAgICAoAKENwMoIAMgAK1CgICAgLAChDcDICADIANBIGo2AhACf0EAIQAjAEEQayICJAAgA0EIaiIBKAIMIQUCQAJ/AkACQAJAAkACQCABKAIEDgIAAQILIAUNAUEBIQVBASEBDAMLIAVFDQELIAJBBGogARBIIAIoAgwhACACKAIIIQEgAigCBAwCCyABKAIAIgAoAgAhBSAAKAIEIgBFBEBBASEBQQAhAAwBCyAAQQBIDQJB+dvAAC0AABpBASEEIABBARCqASIBRQ0CCyABIAUgABDQARogAAshBCABIAAQACAEBEAgASAEELUBCyACQRBqJAAMAQsgBCAAEJ8BAAsgA0EwaiQAC74SAwd/A34CfSABKAIcQQFxIQUgASgCCARAIAAqAgAhDCABKAIMIQQjAEHwCGsiACQAIAy8IQMCf0EDIAyLIg1DAACAf1sNABpBAiAMIAxcDQAaQQQgDbxFDQAaIANB////A3FBgICABHIgA0EBdEH+//8HcSADQRd2Qf8BcSICGyIGrSIJQgGDIQsgA0GAgID8B3FFBEAgAkGWAWshBkIBIQogC1AMAQtCgICAECAJQgGGIAZBgICABEYiBhshCUICQgEgBhshCkHofkHpfiAGGyACaiEGIAtQCyECIAAgBjsB6AggACAKNwPgCCAAQgE3A9gIIAAgCTcD0AggACACOgDqCAJ/AkACQAJAAkAgAkECayIIBEBBASECQfK6wABB87rAACADQQBIIgcbQfK6wABBASAHGyAFGyEHQQEgA0EfdiAFGyEFQQMgCEH/AXEiAyADQQNPG0ECaw4CAgMBCyAAQQM2ApgIIABB9LrAADYClAggAEECOwGQCEEBIQdBACEFQQEhAiAAQZAIagwECyAAQQM2ApgIIABB97rAADYClAggAEECOwGQCCAAQZAIagwDC0ECIQIgAEECOwGQCCAERQ0BIABBoAhqIAQ2AgAgAEEAOwGcCCAAQQI2ApgIIABBybrAADYClAggAEGQCGoMAgtBdEEFIAbBIgJBAEgbIAJsIgJBwP0ASQRAIABBkAhqIABB0AhqIgMgAEEQaiIGIAJBBHZBFWoiCEGAgH5BACAEayAEQYCAAk8bIgIQKSACwSECAkAgACgCkAhFBEAgAEHACGogAyAGIAggAhAfDAELIABByAhqIABBmAhqKAIANgIAIAAgACkCkAg3A8AICyACIAAuAcgIIgNIBEAgAEEIaiAAKALACCAAKALECCADIAQgAEGQCGoQRiAAKAIMIQIgACgCCAwDC0ECIQIgAEECOwGQCCAERQRAQQEhAiAAQQE2ApgIIABB+rrAADYClAggAEGQCGoMAwsgAEGgCGogBDYCACAAQQA7AZwIIABBAjYCmAggAEHJusAANgKUCCAAQZAIagwCC0GBu8AAQSVBqLvAABCDAQALQQEhAiAAQQE2ApgIIABB+rrAADYClAggAEGQCGoLIQQgACACNgLMCCAAIAQ2AsgIIAAgBTYCxAggACAHNgLACCABIABBwAhqEDkgAEHwCGokAA8LIAAoAgAiAL4hDCAAQf////8Hcb4iDUPKGw5aYCANQwAAAABcIA1DF7fROF1xckUEQCMAQYABayIAJAAgDLwhAgJ/QQMgDIsiDUMAAIB/Ww0AGkECIAwgDFwNABpBBCANvEUNABogAkH///8DcUGAgIAEciACQQF0Qf7//wdxIAJBF3ZB/wFxIgQbIgOtIglCAYMhCyACQYCAgPwHcUUEQCAEQZYBayEEQgEhCiALUAwB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AigCEBEAAAtCAQF/IAIgACgCACAAKAIIIgNrSwRAIAAgAyACEF8gACgCCCEDCyAAKAIEIANqIAEgAhDQARogACACIANqNgIIQQALQgEBfyACIAAoAgAgACgCCCIDa0sEQCAAIAMgAhBhIAAoAgghAwsgACgCBCADaiABIAIQ0AEaIAAgAiADajYCCEEACzgAAkAgAWlBAUdBgICAgHggAWsgAElyDQAgAARAQfnbwAAtAAAaIAAgARCqASIBRQ0BCyABDwsAC0EBAX8jAEEgayIDJAAgA0EANgIQIANBATYCBCADQgQ3AgggAyABNgIcIAMgADYCGCADIANBGGo2AgAgAyACEHwACzkAAkACfyACQYCAxABHBEBBASAAIAIgASgCEBEAAA0BGgsgAw0BQQALDwsgACADIAQgASgCDBEBAAs8AQF/An8gAS0AAUUEQBARIQJBAAwBCxASIQJBAQshAyAAIAE2AhAgAEEANgIIIAAgAjYCBCAAIAM2AgALNwIBfwF8IAEoAhxBAXEhAiAAKwMAIQMgASgCCARAIAEgAyACIAEoAgwQLQ8LIAEgAyACQQAQNQsuAAJAIANpQQFHQYCAgIB4IANrIAFJcg0AIAAgASADIAIQoAEiAEUNACAADwsACzYBAX8jAEEgayIBJAAgAUEANgIYIAFBATYCDCABQbjSwAA2AgggAUIENwIQIAFBCGogABB8AAs5AQF/QQEhAgJAIAAgARBNDQAgASgCFEG5u8AAQQIgASgCGCgCDBEBAA0AIABBBGogARBNIQILIAILmAQCBn8BfiMAQRBrIgUkACAFIAA2AgwgBUEMaiEHIwBBEGsiAiQAIAIgASgCFEGgiMAAQQUgASgCGCgCDBEBADoADCACIAE2AgggAkEAOgANIAJBADYCBCMAQUBqIgAkACACQQRqIgMoAgAhBCADAn9BASADLQAIDQAaIAMoAgQiASgCHCIGQQRxRQRAQQEgASgCFEG8vsAAQcC+wAAgBBtBAkEBIAQbIAEoAhgoAgwRAQANARogByABQZyIwAAoAgARAAAMAQsgBEUEQEEBIAEoAhRBwb7AAEECIAEoAhgoAgwRAQANARogASgCHCEGCyAAQQE6ABsgACABKQIUNwIMIABBoL7AADYCNCAAIABBG2o2AhQgACABKQIINwIkIAEpAgAhCCAAIAY2AjggACABKAIQNgIsIAAgAS0AIDoAPCAAIAg3AhwgACAAQQxqNgIwQQEgByAAQRxqQZyIwAAoAgARAAANABogACgCMEG+vsAAQQIgACgCNCgCDBEBAAs6AAggAyAEQQFqNgIAIABBQGskAAJ/IAItAAwiAEEARyADKAIAIgFFDQAaQQEgAA0AGiACKAIIIQACQCABQQFHDQAgAi0ADUUNACAALQAcQQRxDQBBASAAKAIUQcO+wABBASAAKAIYKAIMEQEADQEaCyAAKAIUQbi7wABBASAAKAIYKAIMEQEACyACQRBqJAAgBUEQaiQACzUBAX8gASgCBCECAkAgASgCCEUNACABKAIMIgFBhAFJDQAgARACCyAAIAI2AgQgAEEANgIACyIAAkAgAARAIAAoAgBBf0YNASAAKAIQDwsQwgEACxDDAQALIgACQCAABEAgACgCAEF/Rg0BIAAoAhQPCxDCAQALEMMBAAslACAARQRAQeCMwABBMhDBAQALIAAgAiADIAQgBSABKAIQEQsACx8BAn4gACkDACICIAJCP4ciA4UgA30gAkIAWSABEFALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARBgALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARCQALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARGgALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARHAALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARHgALLAAgACABQS5GIAAtAARBAEdyOgAEIAAoAgAiACgCFCABIAAoAhgoAhARAAALJgEBfyAAKAIAIgFBgICAgHhyQYCAgIB4RwRAIAAoAgQgARC1AQsLCgBBCCAAEMkBAAshACAARQRAQeCMwABBMhDBAQALIAAgAiADIAEoAhARAwALIgAgAC0AAEUEQCABQZXBwABBBRAxDwsgAUGawcAAQQQQMQsfACAARQRAQeCMwABBMhDBAQALIAAgAiABKAIQEQAACxgBAX8gACgCACIBBEAgACgCBCABELUBCwsbABAQIQIgAEEANgIIIAAgAjYCBCAAIAE2AgALHQEBfxAQIQIgAEEANgIIIAAgAjYCBCAAIAE2AgALFAAgACgCACIA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EABLAAAABgoAAA4AAABFcnJvcmR1cGxpY2F0ZSBmaWVsZCBgYADRARAAEQAAAOIBEAABAAAAYHVud3JhcF90aHJvd2AgZmFpbGVkY2x1c3RlcmluZ19vcHRpb25zc21vb3RoX2JvdW5kYXJpZXNyZXR1cm5fYm91bmRhcnlfcmVjdHMAAAAAAAAA//////////9IAhAAQeCEwAAL8wdDbHVzdGVyU3VtbWFyeW51bV9waXhlbHNzdW1fZGVuc2l0eXN1bV94X2RlbnNpdHlzdW1feV9kZW5zaXR5bWF4X2RlbnNpdHltYXhfZGVuc2l0eV9sb2NhdGlvbnVzZV9kaXNqb2ludF9zZXRhZGRfdW5sYWJlbGVkdHJ1bmNhdGVfdG9fbWF4X2RlbnNpdHlwZXJmb3JtX25laWdoYm9yX21hcF9ncm91cGluZ3VuaW9uX3RocmVzaG9sZHRocmVzaG9sZF9zY2FsZXJkZW5zaXR5X2xvd2VyYm91bmRfc2NhbGVyZGVuc2l0eV91cHBlcmJvdW5kX3NjYWxlcnRpbHRlZF90aHJlc2hvbGRfcGxhbmVncm91cGluZ19kZW5zaXR5X3NjYWxlcgC8AhAAEAAAAMwCEAANAAAA2QIQABcAAADwAhAAHQAAAA0DEAAPAAAAHAMQABAAAAAsAxAAGQAAAEUDEAAZAAAAXgMQABYAAAB0AxAAFwAAAE1hcCBrZXkgaXMgbm90IGEgc3RyaW5nIGFuZCBjYW5ub3QgYmUgYW4gb2JqZWN0IGtleQAAAAAABAAAAAQAAAAMAAAARXJyb3IAAAANAAAADAAAAAQAAAAOAAAADwAAAAoAAABjbHVzdGVyaW5nX29wdGlvbnNzbW9vdGhfYm91bmRhcmllc3JldHVybl9ib3VuZGFyeV9yZWN0c3N0cnVjdCBGaW5kQ2x1c3RlcnNPcHRpb25zRmluZENsdXN0ZXJzUmVzdWx0c3VtbWFyaWVzYm91bmRhcmllc2JvdW5kYXJ5X3JlY3RzRmluZENsdXN0ZXJzT3B0aW9uc0AEEAASAAAAUgQQABEAAABjBBAAFQAAABAAAAAEAAAABAAAABEAAABjYWxsZWQgYFJlc3VsdDo6dW53cmFwKClgIG9uIGFuIGBFcnJgIHZhbHVlZGVuc2l0eV9jbHVzdGVyaW5nX3dhc20vc3Jj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IGBOb25lYCB2YWx1ZWluZGV4IG91dCBvZiBib3VuZHM6IHRoZSBsZW4gaXMgIGJ1dCB0aGUgaW5kZXggaXMgAAAAJx4QACAAAABHHhAAEgAAAAAAAAAEAAAABAAAAEoAAAA9PSE9bWF0Y2hlc2Fzc2VydGlvbiBgbGVmdCAgcmlnaHRgIGZhaWxlZAogIGxlZnQ6IAogcmlnaHQ6IACHHhAAEAAAAJceEAAXAAAArh4QAAkAAAAgcmlnaHRgIGZhaWxlZDogCiAgbGVmdDogAAAAhx4QABAAAADQHhAAEAAAAOAeEAAJAAAArh4QAAkAAAA6IAAAAQAAAAAAAAAMHxAAAgAAAAAAAAAMAAAABAAAAEsAAABMAAAATQAAACAgICAsICwKKCgKLGxpYnJhcnkvY29yZS9zcmMvZm10L251bS5ycwBEHxAAGwAAAGkAAAAXAAAAMHgwMDAxMDIwMzA0MDUwNjA3MDgwOTEwMTExMjEzMTQxNTE2MTcxODE5MjAyMTIyMjMyNDI1MjYyNzI4MjkzMDMxMzIzMzM0MzUzNjM3MzgzOTQwNDE0MjQzNDQ0NTQ2NDc0ODQ5NTA1MTUyNTM1NDU1NTY1NzU4NTk2MDYxNjI2MzY0NjU2NjY3Njg2OTcwNzE3MjczNzQ3NTc2Nzc3ODc5ODA4MTgyODM4NDg1ODY4Nzg4ODk5MDkxOTI5Mzk0OTU5Njk3OTg5OTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBsaWJyYXJ5L2NvcmUvc3JjL2ZtdC9tb2QucnNmYWxzZXRydWUAAHogEAAbAAAAjQkAACYAAAB6IBAAGwAAAJYJAAAaAAAAcmFuZ2Ugc3RhcnQgaW5kZXggIG91dCBvZiByYW5nZSBmb3Igc2xpY2Ugb2YgbGVuZ3RoIMAgEAASAAAA0iAQACIAAAByYW5nZSBlbmQgaW5kZXggBCEQABAAAADSIBAAIgAAAHNsaWNlIGluZGV4IHN0YXJ0cyBhdCAgYnV0IGVuZHMgYXQgACQhEAAWAAAAOiEQAA0AAABbLi4uXWJlZ2luIDw9IGVuZCAoIDw9ICkgd2hlbiBzbGljaW5nIGBgXSEQAA4AAABrIRAABAAAAG8hEAAQAAAAfyEQAAEA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", import.meta.url));
  const I = lo();
  (typeof A == "string" || typeof Request == "function" && A instanceof Request || typeof URL == "function" && A instanceof URL) && (A = fetch(A));
  const { instance: g, module: B } = await so(await A, I);
  return ho(g, B);
}
async function So(A, I, g, B = {}) {
  await si(), (/* @__PURE__ */ new Date()).getTime();
  let C = new ai(I, g, A), i = ro(C, {
    clustering_options: {
      use_disjoint_set: !0,
      truncate_to_max_density: !0,
      perform_neighbor_map_grouping: !1,
      union_threshold: 10,
      density_upperbound_scaler: 0.2,
      density_lowerbound_scaler: 0.2,
      ...B
    },
    return_boundary_rects: !0,
    smooth_boundaries: !0
  });
  C.free();
  let e = [];
  for (let [E, Q] of i.summaries)
    e.push({
      identifier: E,
      sum_density: Q.sum_density,
      mean_x: Q.sum_x_density / Q.sum_density,
      mean_y: Q.sum_y_density / Q.sum_density,
      max_density: Q.max_density,
      max_density_location: Q.max_density_location,
      pixel_count: Q.num_pixels,
      boundary: i.boundaries.get(E),
      boundary_rect_approximation: i.boundary_rects.get(E)
    });
  return e = e.filter((E) => E.boundary != null), (/* @__PURE__ */ new Date()).getTime(), e;
}
export {
  wo as EmbeddingView,
  yo as EmbeddingViewMosaic,
  IB as defaultCategoryColors,
  So as findClusters,
  Fo as maxDensityModeCategories
};
