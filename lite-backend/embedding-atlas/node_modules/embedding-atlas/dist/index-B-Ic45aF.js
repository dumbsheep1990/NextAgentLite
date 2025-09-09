import { coordinator as VC, isSelection as tC, MosaicClient as UE } from "@uwdata/mosaic-core";
import * as c from "@uwdata/mosaic-sql";
import { column as AB, sql as Mg, literal as kE } from "@uwdata/mosaic-sql";
function XC() {
  return !(navigator.gpu == null || navigator.gpu.requestAdapter == null);
}
function pE(A) {
  return A == 0 && (A = 4), A % 4 != 0 && (A += 4 - A % 4), A;
}
function _I(A, I, g, B) {
  return (A.buffer == null || A.byteSize != g || A.usage != B) && (A.buffer != null && A.buffer.destroy(), A.buffer = I.createBuffer({ size: pE(g), usage: B }), A.byteSize = g, A.destroy = () => {
    A.buffer?.destroy();
  }), A.buffer;
}
function IB(A, I, g, B) {
  if (A.buffer !== g || A.data !== B) {
    if (B != null)
      if (B.byteLength % 4 != 0) {
        let Q = B.byteLength - B.byteLength % 4;
        if (I.queue.writeBuffer(g, 0, B, 0, Q), B instanceof Uint8Array) {
          let E = new Uint8Array(4);
          for (let C = 0; C < 4; C++)
            Q + C < B.length && (E[C] = B[Q + C]);
          I.queue.writeBuffer(g, Q, E);
        }
      } else
        I.queue.writeBuffer(g, 0, B, 0);
    else
      I.queue.writeBuffer(g, 0, new ArrayBuffer(g.size));
    A.buffer = g, A.data = B;
  }
  return g;
}
function oC(A, I, g, B, Q, E) {
  return (A.texture == null || A.width != g || A.height != B || A.format != Q || A.usage != E) && (A.texture != null && A.texture.destroy(), A.texture = I.createTexture({ size: [g, B], format: Q, usage: E }), A.destroy = () => {
    A.texture?.destroy();
  }), A.texture;
}
const LA = 2, NB = 4, Vg = 8, dg = 16, tI = 32, KI = 64, ZC = 128, qA = 256, Lg = 512, GA = 1024, TA = 2048, cI = 4096, WA = 8192, LI = 16384, MB = 32768, UB = 65536, rC = 1 << 17, JE = 1 << 18, kB = 1 << 19, pB = 1 << 20, hB = 1 << 21, JB = 1 << 22, NI = 1 << 23, MI = Symbol("$state"), OC = Symbol("legacy props"), YE = Symbol(""), YB = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), PC = 3, Dg = 8, mE = !1;
var mB = Array.isArray, KE = Array.prototype.indexOf, KB = Array.from, vg = Object.defineProperty, WI = Object.getOwnPropertyDescriptor, zC = Object.getOwnPropertyDescriptors, LE = Object.prototype, vE = Array.prototype, LB = Object.getPrototypeOf, nC = Object.isExtensible;
function jC(A) {
  for (var I = 0; I < A.length; I++)
    A[I]();
}
function HE() {
  var A, I, g = new Promise((B, Q) => {
    A = B, I = Q;
  });
  return { promise: g, resolve: A, reject: I };
}
function $C(A) {
  return A === this.v;
}
function AQ(A, I) {
  return A != A ? I == I : A !== I || A !== null && typeof A == "object" || typeof A == "function";
}
function xE(A, I) {
  return A !== I;
}
function IQ(A) {
  return !AQ(A, this.v);
}
function bE() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function gQ(A) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function qE() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function TE(A) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function _E() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function WE(A) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function VE() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function XE() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function ZE(A) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function OE() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function PE() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function zE() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let jE = !1;
const vB = 1, HB = 2, BQ = 4, $E = 8, Ai = 16, Ii = 1, gi = 4, Bi = 8, Ci = 16, Qi = 1, Ei = 2, CQ = "[", xB = "[!", bB = "]", VI = {}, uA = Symbol(), ii = "http://www.w3.org/1999/xhtml";
let vA = null;
function Hg(A) {
  vA = A;
}
function uI(A, I = !1, g) {
  vA = {
    p: vA,
    c: null,
    e: null,
    s: A,
    x: null,
    l: null
  };
}
function wI(A) {
  var I = (
    /** @type {ComponentContext} */
    vA
  ), g = I.e;
  if (g !== null) {
    I.e = null;
    for (var B of g)
      MQ(B);
  }
  return A !== void 0 && (I.x = A), vA = I.p, A ?? /** @type {T} */
  {};
}
function QQ() {
  return !0;
}
function Xg(A) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let AA = !1;
function QI(A) {
  AA = A;
}
let j;
function VA(A) {
  if (A === null)
    throw Xg(), VI;
  return j = A;
}
function Gg() {
  return VA(
    /** @type {TemplateNode} */
    /* @__PURE__ */ oI(j)
  );
}
function lA(A) {
  if (AA) {
    if (/* @__PURE__ */ oI(j) !== null)
      throw Xg(), VI;
    j = A;
  }
}
function ei(A = 1) {
  if (AA) {
    for (var I = A, g = j; I--; )
      g = /** @type {TemplateNode} */
      /* @__PURE__ */ oI(g);
    j = g;
  }
}
function lB() {
  for (var A = 0, I = j; ; ) {
    if (I.nodeType === Dg) {
      var g = (
        /** @type {Comment} */
        I.data
      );
      if (g === bB) {
        if (A === 0) return I;
        A -= 1;
      } else (g === CQ || g === xB) && (A += 1);
    }
    var B = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ oI(I)
    );
    I.remove(), I = B;
  }
}
function EQ(A) {
  if (!A || A.nodeType !== Dg)
    throw Xg(), VI;
  return (
    /** @type {Comment} */
    A.data
  );
}
function SI(A) {
  if (typeof A != "object" || A === null || MI in A)
    return A;
  const I = LB(A);
  if (I !== LE && I !== vE)
    return A;
  var g = /* @__PURE__ */ new Map(), B = mB(A), Q = /* @__PURE__ */ EA(0), E = kI, C = (i) => {
    if (kI === E)
      return i();
    var e = Z, t = kI;
    $A(null), cC(E);
    var o = i();
    return $A(e), cC(t), o;
  };
  return B && g.set("length", /* @__PURE__ */ EA(
    /** @type {any[]} */
    A.length
  )), new Proxy(
    /** @type {any} */
    A,
    {
      defineProperty(i, e, t) {
        (!("value" in t) || t.configurable === !1 || t.enumerable === !1 || t.writable === !1) && OE();
        var o = g.get(e);
        return o === void 0 ? o = C(() => {
          var a = /* @__PURE__ */ EA(t.value);
          return g.set(e, a), a;
        }) : L(o, t.value, !0), !0;
      },
      deleteProperty(i, e) {
        var t = g.get(e);
        if (t === void 0) {
          if (e in i) {
            const o = C(() => /* @__PURE__ */ EA(uA));
            g.set(e, o), gB(Q);
          }
        } else
          L(t, uA), gB(Q);
        return !0;
      },
      get(i, e, t) {
        if (e === MI)
          return A;
        var o = g.get(e), a = e in i;
        if (o === void 0 && (!a || WI(i, e)?.writable) && (o = C(() => {
          var n = SI(a ? i[e] : uA), h = /* @__PURE__ */ EA(n);
          return h;
        }), g.set(e, o)), o !== void 0) {
          var s = r(o);
          return s === uA ? void 0 : s;
        }
        return Reflect.get(i, e, t);
      },
      getOwnPropertyDescriptor(i, e) {
        var t = Reflect.getOwnPropertyDescriptor(i, e);
        if (t && "value" in t) {
          var o = g.get(e);
          o && (t.value = r(o));
        } else if (t === void 0) {
          var a = g.get(e), s = a?.v;
          if (a !== void 0 && s !== uA)
            return {
              enumerable: !0,
              configurable: !0,
              value: s,
              writable: !0
            };
        }
        return t;
      },
      has(i, e) {
        if (e === MI)
          return !0;
        var t = g.get(e), o = t !== void 0 && t.v !== uA || Reflect.has(i, e);
        if (t !== void 0 || q !== null && (!o || WI(i, e)?.writable)) {
          t === void 0 && (t = C(() => {
            var s = o ? SI(i[e]) : uA, n = /* @__PURE__ */ EA(s);
            return n;
          }), g.set(e, t));
          var a = r(t);
          if (a === uA)
            return !1;
        }
        return o;
      },
      set(i, e, t, o) {
        var a = g.get(e), s = e in i;
        if (B && e === "length")
          for (var n = t; n < /** @type {Source<number>} */
          a.v; n += 1) {
            var h = g.get(n + "");
            h !== void 0 ? L(h, uA) : n in i && (h = C(() => /* @__PURE__ */ EA(uA)), g.set(n + "", h));
          }
        if (a === void 0)
          (!s || WI(i, e)?.writable) && (a = C(() => /* @__PURE__ */ EA(void 0)), L(a, SI(t)), g.set(e, a));
        else {
          s = a.v !== uA;
          var l = C(() => SI(t));
          L(a, l);
        }
        var u = Reflect.getOwnPropertyDescriptor(i, e);
        if (u?.set && u.set.call(o, t), !s) {
          if (B && typeof e == "string") {
            var y = (
              /** @type {Source<number>} */
              g.get("length")
            ), f = Number(e);
            Number.isInteger(f) && f >= y.v && L(y, f + 1);
          }
          gB(Q);
        }
        return !0;
      },
      ownKeys(i) {
        r(Q);
        var e = Reflect.ownKeys(i).filter((a) => {
          var s = g.get(a);
          return s === void 0 || s.v !== uA;
        });
        for (var [t, o] of g)
          o.v !== uA && !(t in i) && e.push(t);
        return e;
      },
      setPrototypeOf() {
        PE();
      }
    }
  );
}
var aC, iQ, eQ, tQ;
function DB() {
  if (aC === void 0) {
    aC = window, iQ = /Firefox/.test(navigator.userAgent);
    var A = Element.prototype, I = Node.prototype, g = Text.prototype;
    eQ = WI(I, "firstChild").get, tQ = WI(I, "nextSibling").get, nC(A) && (A.__click = void 0, A.__className = void 0, A.__attributes = null, A.__style = void 0, A.__e = void 0), nC(g) && (g.__t = void 0);
  }
}
function lI(A = "") {
  return document.createTextNode(A);
}
// @__NO_SIDE_EFFECTS__
function iI(A) {
  return eQ.call(A);
}
// @__NO_SIDE_EFFECTS__
function oI(A) {
  return tQ.call(A);
}
function wA(A, I) {
  if (!AA)
    return /* @__PURE__ */ iI(A);
  var g = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ iI(j)
  );
  if (g === null)
    g = j.appendChild(lI());
  else if (I && g.nodeType !== PC) {
    var B = lI();
    return g?.before(B), VA(B), B;
  }
  return VA(g), g;
}
function TI(A, I) {
  if (!AA) {
    var g = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ iI(
        /** @type {Node} */
        A
      )
    );
    return g instanceof Comment && g.data === "" ? /* @__PURE__ */ oI(g) : g;
  }
  return j;
}
function iA(A, I = 1, g = !1) {
  let B = AA ? j : A;
  for (var Q; I--; )
    Q = B, B = /** @type {TemplateNode} */
    /* @__PURE__ */ oI(B);
  if (!AA)
    return B;
  if (g && B?.nodeType !== PC) {
    var E = lI();
    return B === null ? Q?.after(E) : B.before(E), VA(E), E;
  }
  return VA(B), /** @type {TemplateNode} */
  B;
}
function oQ(A) {
  A.textContent = "";
}
function rQ() {
  return !1;
}
const ti = /* @__PURE__ */ new WeakMap();
function oi(A) {
  var I = q;
  if (I === null)
    return Z.f |= NI, A;
  if ((I.f & MB) === 0) {
    if ((I.f & ZC) === 0)
      throw !I.parent && A instanceof Error && nQ(A), A;
    I.b.error(A);
  } else
    qB(A, I);
}
function qB(A, I) {
  for (; I !== null; ) {
    if ((I.f & ZC) !== 0)
      try {
        I.b.error(A);
        return;
      } catch (g) {
        A = g;
      }
    I = I.parent;
  }
  throw A instanceof Error && nQ(A), A;
}
function nQ(A) {
  const I = ti.get(A);
  I && (vg(A, "message", {
    value: I.message
  }), vg(A, "stack", {
    value: I.stack
  }));
}
let cg = [], cB = [];
function aQ() {
  var A = cg;
  cg = [], jC(A);
}
function ri() {
  var A = cB;
  cB = [], jC(A);
}
function TB(A) {
  cg.length === 0 && queueMicrotask(aQ), cg.push(A);
}
function ni() {
  cg.length > 0 && aQ(), cB.length > 0 && ri();
}
function ai() {
  for (var A = (
    /** @type {Effect} */
    q.b
  ); A !== null && !A.has_pending_snippet(); )
    A = A.parent;
  return A === null && bE(), A;
}
// @__NO_SIDE_EFFECTS__
function Zg(A) {
  var I = LA | TA, g = Z !== null && (Z.f & LA) !== 0 ? (
    /** @type {Derived} */
    Z
  ) : null;
  return q === null || g !== null && (g.f & qA) !== 0 ? I |= qA : q.f |= kB, {
    ctx: vA,
    deps: null,
    effects: null,
    equals: $C,
    f: I,
    fn: A,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      uA
    ),
    wv: 0,
    parent: g ?? q,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function si(A, I) {
  let g = (
    /** @type {Effect | null} */
    q
  );
  g === null && qE();
  var B = (
    /** @type {Boundary} */
    g.b
  ), Q = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), E = ug(
    /** @type {V} */
    uA
  ), C = null, i = !Z;
  return Ri(() => {
    try {
      var e = A();
    } catch (n) {
      e = Promise.reject(n);
    }
    var t = () => e;
    Q = C?.then(t, t) ?? Promise.resolve(e), C = Q;
    var o = (
      /** @type {Batch} */
      hA
    ), a = B.pending;
    i && (B.update_pending_count(1), a || o.increment());
    const s = (n, h = void 0) => {
      C = null, a || o.activate(), h ? h !== YB && (E.f |= NI, wg(E, h)) : ((E.f & NI) !== 0 && (E.f ^= NI), wg(E, n)), i && (B.update_pending_count(-1), a || o.decrement()), DQ();
    };
    if (Q.then(s, (n) => s(null, n || "unknown")), o)
      return () => {
        queueMicrotask(() => o.neuter());
      };
  }), new Promise((e) => {
    function t(o) {
      function a() {
        o === Q ? e(E) : t(Q);
      }
      o.then(a, a);
    }
    t(Q);
  });
}
// @__NO_SIDE_EFFECTS__
function k(A) {
  const I = /* @__PURE__ */ Zg(A);
  return fQ(I), I;
}
// @__NO_SIDE_EFFECTS__
function sQ(A) {
  const I = /* @__PURE__ */ Zg(A);
  return I.equals = IQ, I;
}
function hQ(A) {
  var I = A.effects;
  if (I !== null) {
    A.effects = null;
    for (var g = 0; g < I.length; g += 1)
      eI(
        /** @type {Effect} */
        I[g]
      );
  }
}
function hi(A) {
  for (var I = A.parent; I !== null; ) {
    if ((I.f & LA) === 0)
      return (
        /** @type {Effect} */
        I
      );
    I = I.parent;
  }
  return null;
}
function _B(A) {
  var I, g = q;
  DI(hi(A));
  try {
    hQ(A), I = SQ(A);
  } finally {
    DI(g);
  }
  return I;
}
function lQ(A) {
  var I = _B(A);
  if (A.equals(I) || (A.v = I, A.wv = dQ()), !vI)
    if (OI !== null)
      OI.set(A, A.v);
    else {
      var g = (nI || (A.f & qA) !== 0) && A.deps !== null ? cI : GA;
      JA(A, g);
    }
}
function li(A, I, g) {
  const B = Zg;
  if (I.length === 0) {
    g(A.map(B));
    return;
  }
  var Q = hA, E = (
    /** @type {Effect} */
    q
  ), C = Di(), i = ai();
  Promise.all(I.map((e) => /* @__PURE__ */ si(e))).then((e) => {
    Q?.activate(), C();
    try {
      g([...A.map(B), ...e]);
    } catch (t) {
      (E.f & LI) === 0 && qB(t, E);
    }
    Q?.deactivate(), DQ();
  }).catch((e) => {
    i.error(e);
  });
}
function Di() {
  var A = q, I = Z, g = vA;
  return function() {
    DI(A), $A(I), Hg(g);
  };
}
function DQ() {
  DI(null), $A(null), Hg(null);
}
const Bg = /* @__PURE__ */ new Set();
let hA = null, OI = null, sC = /* @__PURE__ */ new Set(), xg = [];
function cQ() {
  const A = (
    /** @type {() => void} */
    xg.shift()
  );
  xg.length > 0 && queueMicrotask(cQ), A();
}
let JI = [], Og = null, uB = !1, Yg = !1;
class PI {
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
  #E = [];
  /**
   * Template effects and `$effect.pre` effects, which run when
   * a batch is committed
   * @type {Effect[]}
   */
  #Q = [];
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
  #i = [];
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Effect[]}
   */
  #r = [];
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Effect[]}
   */
  #n = [];
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
    JI = [];
    var g = null;
    if (Bg.size > 1) {
      g = /* @__PURE__ */ new Map(), OI = /* @__PURE__ */ new Map();
      for (const [E, C] of this.current)
        g.set(E, { v: E.v, wv: E.wv }), E.v = C;
      for (const E of Bg)
        if (E !== this)
          for (const [C, i] of E.#I)
            g.has(C) || (g.set(C, { v: C.v, wv: C.wv }), C.v = i);
    }
    for (const E of I)
      this.#s(E);
    if (this.#C.length === 0 && this.#g === 0) {
      this.#a();
      var B = this.#Q, Q = this.#B;
      this.#Q = [], this.#B = [], this.#i = [], hA = null, hC(B), hC(Q), hA === null ? hA = this : Bg.delete(this), this.#t?.resolve();
    } else
      this.#e(this.#Q), this.#e(this.#B), this.#e(this.#i);
    if (g) {
      for (const [E, { v: C, wv: i }] of g)
        E.wv <= i && (E.v = C);
      OI = null;
    }
    for (const E of this.#C)
      sg(E);
    for (const E of this.#E)
      sg(E);
    this.#C = [], this.#E = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #s(I) {
    I.f ^= GA;
    for (var g = I.first; g !== null; ) {
      var B = g.f, Q = (B & (tI | KI)) !== 0, E = Q && (B & GA) !== 0, C = E || (B & WA) !== 0 || this.skipped_effects.has(g);
      if (!C && g.fn !== null) {
        if (Q)
          g.f ^= GA;
        else if ((B & GA) === 0)
          if ((B & NB) !== 0)
            this.#B.push(g);
          else if ((B & JB) !== 0) {
            var i = g.b?.pending ? this.#E : this.#C;
            i.push(g);
          } else Pg(g) && ((g.f & dg) !== 0 && this.#i.push(g), sg(g));
        var e = g.first;
        if (e !== null) {
          g = e;
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
  #e(I) {
    for (const g of I)
      ((g.f & TA) !== 0 ? this.#r : this.#n).push(g), JA(g, GA);
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
    hA = this;
  }
  deactivate() {
    hA = null;
    for (const I of sC)
      if (sC.delete(I), I(), hA !== null)
        break;
  }
  neuter() {
    this.#o = !0;
  }
  flush() {
    JI.length > 0 ? uQ() : this.#a(), hA === this && (this.#g === 0 && Bg.delete(this), this.deactivate());
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
      for (const I of this.#r)
        JA(I, TA), YI(I);
      for (const I of this.#n)
        JA(I, cI), YI(I);
      this.#Q = [], this.#B = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(I) {
    this.#A.add(I);
  }
  settled() {
    return (this.#t ??= HE()).promise;
  }
  static ensure() {
    if (hA === null) {
      const I = hA = new PI();
      Bg.add(hA), Yg || PI.enqueue(() => {
        hA === I && I.flush();
      });
    }
    return hA;
  }
  /** @param {() => void} task */
  static enqueue(I) {
    xg.length === 0 && queueMicrotask(cQ), xg.unshift(I);
  }
}
function ci(A) {
  var I = Yg;
  Yg = !0;
  try {
    for (var g; ; ) {
      if (ni(), JI.length === 0 && (hA?.flush(), JI.length === 0))
        return Og = null, /** @type {T} */
        g;
      uQ();
    }
  } finally {
    Yg = I;
  }
}
function uQ() {
  var A = XI;
  uB = !0;
  try {
    var I = 0;
    for (lC(!0); JI.length > 0; ) {
      var g = PI.ensure();
      if (I++ > 1e3) {
        var B, Q;
        ui();
      }
      g.process(JI), UI.clear();
    }
  } finally {
    uB = !1, lC(A), Og = null;
  }
}
function ui() {
  try {
    VE();
  } catch (A) {
    qB(A, Og);
  }
}
function hC(A) {
  var I = A.length;
  if (I !== 0) {
    for (var g = 0; g < I; ) {
      var B = A[g++];
      if ((B.f & (LI | WA)) === 0 && Pg(B)) {
        var Q = hA ? hA.current.size : 0;
        if (sg(B), B.deps === null && B.first === null && B.nodes_start === null && (B.teardown === null && B.ac === null ? YQ(B) : B.fn = null), hA !== null && hA.current.size > Q && (B.f & pB) !== 0)
          break;
      }
    }
    for (; g < I; )
      YI(A[g++]);
  }
}
function YI(A) {
  for (var I = Og = A; I.parent !== null; ) {
    I = I.parent;
    var g = I.f;
    if (uB && I === q && (g & dg) !== 0)
      return;
    if ((g & (KI | tI)) !== 0) {
      if ((g & GA) === 0) return;
      I.f ^= GA;
    }
  }
  JI.push(I);
}
const UI = /* @__PURE__ */ new Map();
function ug(A, I) {
  var g = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: A,
    reactions: null,
    equals: $C,
    rv: 0,
    wv: 0
  };
  return g;
}
// @__NO_SIDE_EFFECTS__
function EA(A, I) {
  const g = ug(A);
  return fQ(g), g;
}
// @__NO_SIDE_EFFECTS__
function wQ(A, I = !1, g = !0) {
  const B = ug(A);
  return I || (B.equals = IQ), B;
}
function L(A, I, g = !1) {
  Z !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!PA || (Z.f & rC) !== 0) && QQ() && (Z.f & (LA | dg | JB | rC)) !== 0 && !EI?.includes(A) && zE();
  let B = g ? SI(I) : I;
  return wg(A, B);
}
function wg(A, I) {
  if (!A.equals(I)) {
    var g = A.v;
    vI ? UI.set(A, I) : UI.set(A, g), A.v = I;
    var B = PI.ensure();
    B.capture(A, g), (A.f & LA) !== 0 && ((A.f & TA) !== 0 && _B(
      /** @type {Derived} */
      A
    ), JA(A, (A.f & qA) === 0 ? GA : cI)), A.wv = dQ(), yQ(A, TA), q !== null && (q.f & GA) !== 0 && (q.f & (tI | KI)) === 0 && (bA === null ? wi([A]) : bA.push(A));
  }
  return I;
}
function gB(A) {
  L(A, A.v + 1);
}
function yQ(A, I) {
  var g = A.reactions;
  if (g !== null)
    for (var B = g.length, Q = 0; Q < B; Q++) {
      var E = g[Q], C = E.f, i = (C & TA) === 0;
      i && JA(E, I), (C & LA) !== 0 ? yQ(
        /** @type {Derived} */
        E,
        cI
      ) : i && YI(
        /** @type {Effect} */
        E
      );
    }
}
let XI = !1;
function lC(A) {
  XI = A;
}
let vI = !1;
function DC(A) {
  vI = A;
}
let Z = null, PA = !1;
function $A(A) {
  Z = A;
}
let q = null;
function DI(A) {
  q = A;
}
let EI = null;
function fQ(A) {
  Z !== null && (EI === null ? EI = [A] : EI.push(A));
}
let RA = null, mA = 0, bA = null;
function wi(A) {
  bA = A;
}
let FQ = 1, yg = 0, kI = yg;
function cC(A) {
  kI = A;
}
let nI = !1;
function dQ() {
  return ++FQ;
}
function Pg(A) {
  var I = A.f;
  if ((I & TA) !== 0)
    return !0;
  if ((I & cI) !== 0) {
    var g = A.deps, B = (I & qA) !== 0;
    if (g !== null) {
      var Q, E, C = (I & Lg) !== 0, i = B && q !== null && !nI, e = g.length;
      if ((C || i) && (q === null || (q.f & LI) === 0)) {
        var t = (
          /** @type {Derived} */
          A
        ), o = t.parent;
        for (Q = 0; Q < e; Q++)
          E = g[Q], (C || !E?.reactions?.includes(t)) && (E.reactions ??= []).push(t);
        C && (t.f ^= Lg), i && o !== null && (o.f & qA) === 0 && (t.f ^= qA);
      }
      for (Q = 0; Q < e; Q++)
        if (E = g[Q], Pg(
          /** @type {Derived} */
          E
        ) && lQ(
          /** @type {Derived} */
          E
        ), E.wv > A.wv)
          return !0;
    }
    (!B || q !== null && !nI) && JA(A, GA);
  }
  return !1;
}
function GQ(A, I, g = !0) {
  var B = A.reactions;
  if (B !== null && !EI?.includes(A))
    for (var Q = 0; Q < B.length; Q++) {
      var E = B[Q];
      (E.f & LA) !== 0 ? GQ(
        /** @type {Derived} */
        E,
        I,
        !1
      ) : I === E && (g ? JA(E, TA) : (E.f & GA) !== 0 && JA(E, cI), YI(
        /** @type {Effect} */
        E
      ));
    }
}
function SQ(A) {
  var I = RA, g = mA, B = bA, Q = Z, E = nI, C = EI, i = vA, e = PA, t = kI, o = A.f;
  RA = /** @type {null | Value[]} */
  null, mA = 0, bA = null, nI = (o & qA) !== 0 && (PA || !XI || Z === null), Z = (o & (tI | KI)) === 0 ? A : null, EI = null, Hg(A.ctx), PA = !1, kI = ++yg, A.ac !== null && (A.ac.abort(YB), A.ac = null);
  try {
    A.f |= hB;
    var a = (
      /** @type {Function} */
      (0, A.fn)()
    ), s = A.deps;
    if (RA !== null) {
      var n;
      if (bg(A, mA), s !== null && mA > 0)
        for (s.length = mA + RA.length, n = 0; n < RA.length; n++)
          s[mA + n] = RA[n];
      else
        A.deps = s = RA;
      if (!nI || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (o & LA) !== 0 && /** @type {import('#client').Derived} */
      A.reactions !== null)
        for (n = mA; n < s.length; n++)
          (s[n].reactions ??= []).push(A);
    } else s !== null && mA < s.length && (bg(A, mA), s.length = mA);
    if (QQ() && bA !== null && !PA && s !== null && (A.f & (LA | cI | TA)) === 0)
      for (n = 0; n < /** @type {Source[]} */
      bA.length; n++)
        GQ(
          bA[n],
          /** @type {Effect} */
          A
        );
    return Q !== null && Q !== A && (yg++, bA !== null && (B === null ? B = bA : B.push(.../** @type {Source[]} */
    bA))), (A.f & NI) !== 0 && (A.f ^= NI), a;
  } catch (h) {
    return oi(h);
  } finally {
    A.f ^= hB, RA = I, mA = g, bA = B, Z = Q, nI = E, EI = C, Hg(i), PA = e, kI = t;
  }
}
function yi(A, I) {
  let g = I.reactions;
  if (g !== null) {
    var B = KE.call(g, A);
    if (B !== -1) {
      var Q = g.length - 1;
      Q === 0 ? g = I.reactions = null : (g[B] = g[Q], g.pop());
    }
  }
  g === null && (I.f & LA) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (RA === null || !RA.includes(I)) && (JA(I, cI), (I.f & (qA | Lg)) === 0 && (I.f ^= Lg), hQ(
    /** @type {Derived} **/
    I
  ), bg(
    /** @type {Derived} **/
    I,
    0
  ));
}
function bg(A, I) {
  var g = A.deps;
  if (g !== null)
    for (var B = I; B < g.length; B++)
      yi(A, g[B]);
}
function sg(A) {
  var I = A.f;
  if ((I & LI) === 0) {
    JA(A, GA);
    var g = q, B = XI;
    q = A, XI = !0;
    try {
      (I & dg) !== 0 ? Ni(A) : JQ(A), pQ(A);
      var Q = SQ(A);
      A.teardown = typeof Q == "function" ? Q : null, A.wv = FQ;
      var E;
      mE && jE && (A.f & TA) !== 0 && A.deps;
    } finally {
      XI = B, q = g;
    }
  }
}
function r(A) {
  var I = A.f, g = (I & LA) !== 0;
  if (Z !== null && !PA) {
    var B = q !== null && (q.f & LI) !== 0;
    if (!B && !EI?.includes(A)) {
      var Q = Z.deps;
      if ((Z.f & hB) !== 0)
        A.rv < yg && (A.rv = yg, RA === null && Q !== null && Q[mA] === A ? mA++ : RA === null ? RA = [A] : (!nI || !RA.includes(A)) && RA.push(A));
      else {
        (Z.deps ??= []).push(A);
        var E = A.reactions;
        E === null ? A.reactions = [Z] : E.includes(Z) || E.push(Z);
      }
    }
  } else if (g && /** @type {Derived} */
  A.deps === null && /** @type {Derived} */
  A.effects === null) {
    var C = (
      /** @type {Derived} */
      A
    ), i = C.parent;
    i !== null && (i.f & qA) === 0 && (C.f ^= qA);
  }
  if (vI) {
    if (UI.has(A))
      return UI.get(A);
    if (g) {
      C = /** @type {Derived} */
      A;
      var e = C.v;
      return ((C.f & GA) === 0 && C.reactions !== null || RQ(C)) && (e = _B(C)), UI.set(C, e), e;
    }
  } else if (g) {
    if (C = /** @type {Derived} */
    A, OI?.has(C))
      return OI.get(C);
    Pg(C) && lQ(C);
  }
  if ((A.f & NI) !== 0)
    throw A.v;
  return A.v;
}
function RQ(A) {
  if (A.v === uA) return !0;
  if (A.deps === null) return !1;
  for (const I of A.deps)
    if (UI.has(I) || (I.f & LA) !== 0 && RQ(
      /** @type {Derived} */
      I
    ))
      return !0;
  return !1;
}
function jI(A) {
  var I = PA;
  try {
    return PA = !0, A();
  } finally {
    PA = I;
  }
}
const fi = -7169;
function JA(A, I) {
  A.f = A.f & fi | I;
}
function Fi(A) {
  if (!(typeof A != "object" || !A || A instanceof EventTarget)) {
    if (MI in A)
      wB(A);
    else if (!Array.isArray(A))
      for (let I in A) {
        const g = A[I];
        typeof g == "object" && g && MI in g && wB(g);
      }
  }
}
function wB(A, I = /* @__PURE__ */ new Set()) {
  if (typeof A == "object" && A !== null && // We don't want to traverse DOM elements
  !(A instanceof EventTarget) && !I.has(A)) {
    I.add(A), A instanceof Date && A.getTime();
    for (let B in A)
      try {
        wB(A[B], I);
      } catch {
      }
    const g = LB(A);
    if (g !== Object.prototype && g !== Array.prototype && g !== Map.prototype && g !== Set.prototype && g !== Date.prototype) {
      const B = zC(g);
      for (let Q in B) {
        const E = B[Q].get;
        if (E)
          try {
            E.call(A);
          } catch {
          }
      }
    }
  }
}
function NQ(A) {
  q === null && Z === null && WE(), Z !== null && (Z.f & qA) !== 0 && q === null && _E(), vI && TE();
}
function di(A, I) {
  var g = I.last;
  g === null ? I.last = I.first = A : (g.next = A, A.prev = g, I.last = A);
}
function II(A, I, g, B = !0) {
  var Q = q;
  Q !== null && (Q.f & WA) !== 0 && (A |= WA);
  var E = {
    ctx: vA,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: A | TA,
    first: null,
    fn: I,
    last: null,
    next: null,
    parent: Q,
    b: Q && Q.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (g)
    try {
      sg(E), E.f |= MB;
    } catch (e) {
      throw eI(E), e;
    }
  else I !== null && YI(E);
  var C = g && E.deps === null && E.first === null && E.nodes_start === null && E.teardown === null && (E.f & kB) === 0;
  if (!C && B && (Q !== null && di(E, Q), Z !== null && (Z.f & LA) !== 0 && (A & KI) === 0)) {
    var i = (
      /** @type {Derived} */
      Z
    );
    (i.effects ??= []).push(E);
  }
  return E;
}
function Gi(A) {
  const I = II(Vg, null, !1);
  return JA(I, GA), I.teardown = A, I;
}
function BI(A) {
  NQ();
  var I = (
    /** @type {Effect} */
    q.f
  ), g = !Z && (I & tI) !== 0 && (I & MB) === 0;
  if (g) {
    var B = (
      /** @type {ComponentContext} */
      vA
    );
    (B.e ??= []).push(A);
  } else
    return MQ(A);
}
function MQ(A) {
  return II(NB | pB, A, !1);
}
function qg(A) {
  return NQ(), II(Vg | pB, A, !0);
}
function Si(A) {
  PI.ensure();
  const I = II(KI, A, !0);
  return (g = {}) => new Promise((B) => {
    g.outro ? zg(I, () => {
      eI(I), B(void 0);
    }) : (eI(I), B(void 0));
  });
}
function UQ(A) {
  return II(NB, A, !1);
}
function Ri(A) {
  return II(JB | kB, A, !0);
}
function kQ(A, I = 0) {
  return II(Vg | I, A, !0);
}
function KA(A, I = [], g = []) {
  li(I, g, (B) => {
    II(Vg, () => A(...B.map(r)), !0);
  });
}
function WB(A, I = 0) {
  var g = II(dg | I, A, !0);
  return g;
}
function mI(A, I = !0) {
  return II(tI, A, !0, I);
}
function pQ(A) {
  var I = A.teardown;
  if (I !== null) {
    const g = vI, B = Z;
    DC(!0), $A(null);
    try {
      I.call(null);
    } finally {
      DC(g), $A(B);
    }
  }
}
function JQ(A, I = !1) {
  var g = A.first;
  for (A.first = A.last = null; g !== null; ) {
    g.ac?.abort(YB);
    var B = g.next;
    (g.f & KI) !== 0 ? g.parent = null : eI(g, I), g = B;
  }
}
function Ni(A) {
  for (var I = A.first; I !== null; ) {
    var g = I.next;
    (I.f & tI) === 0 && eI(I), I = g;
  }
}
function eI(A, I = !0) {
  var g = !1;
  (I || (A.f & JE) !== 0) && A.nodes_start !== null && A.nodes_end !== null && (Mi(
    A.nodes_start,
    /** @type {TemplateNode} */
    A.nodes_end
  ), g = !0), JQ(A, I && !g), bg(A, 0), JA(A, LI);
  var B = A.transitions;
  if (B !== null)
    for (const E of B)
      E.stop();
  pQ(A);
  var Q = A.parent;
  Q !== null && Q.first !== null && YQ(A), A.next = A.prev = A.teardown = A.ctx = A.deps = A.fn = A.nodes_start = A.nodes_end = A.ac = null;
}
function Mi(A, I) {
  for (; A !== null; ) {
    var g = A === I ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ oI(A)
    );
    A.remove(), A = g;
  }
}
function YQ(A) {
  var I = A.parent, g = A.prev, B = A.next;
  g !== null && (g.next = B), B !== null && (B.prev = g), I !== null && (I.first === A && (I.first = B), I.last === A && (I.last = g));
}
function zg(A, I) {
  var g = [];
  VB(A, g, !0), mQ(g, () => {
    eI(A), I && I();
  });
}
function mQ(A, I) {
  var g = A.length;
  if (g > 0) {
    var B = () => --g || I();
    for (var Q of A)
      Q.out(B);
  } else
    I();
}
function VB(A, I, g) {
  if ((A.f & WA) === 0) {
    if (A.f ^= WA, A.transitions !== null)
      for (const C of A.transitions)
        (C.is_global || g) && I.push(C);
    for (var B = A.first; B !== null; ) {
      var Q = B.next, E = (B.f & UB) !== 0 || (B.f & tI) !== 0;
      VB(B, I, E ? g : !1), B = Q;
    }
  }
}
function XB(A) {
  KQ(A, !0);
}
function KQ(A, I) {
  if ((A.f & WA) !== 0) {
    A.f ^= WA, (A.f & GA) === 0 && (JA(A, TA), YI(A));
    for (var g = A.first; g !== null; ) {
      var B = g.next, Q = (g.f & UB) !== 0 || (g.f & tI) !== 0;
      KQ(g, Q ? I : !1), g = B;
    }
    if (A.transitions !== null)
      for (const E of A.transitions)
        (E.is_global || I) && E.in();
  }
}
function Ui(A) {
  var I = Z, g = q;
  $A(null), DI(null);
  try {
    return A();
  } finally {
    $A(I), DI(g);
  }
}
const LQ = /* @__PURE__ */ new Set(), yB = /* @__PURE__ */ new Set();
function ki(A, I, g, B = {}) {
  function Q(E) {
    if (B.capture || eg.call(I, E), !E.cancelBubble)
      return Ui(() => g?.call(this, E));
  }
  return A.startsWith("pointer") || A.startsWith("touch") || A === "wheel" ? TB(() => {
    I.addEventListener(A, Q, B);
  }) : I.addEventListener(A, Q, B), Q;
}
function uC(A, I, g, B, Q) {
  var E = { capture: B, passive: Q }, C = ki(A, I, g, E);
  (I === document.body || // @ts-ignore
  I === window || // @ts-ignore
  I === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  I instanceof HTMLMediaElement) && Gi(() => {
    I.removeEventListener(A, C, E);
  });
}
function ZB(A) {
  for (var I = 0; I < A.length; I++)
    LQ.add(A[I]);
  for (var g of yB)
    g(A);
}
let wC = null;
function eg(A) {
  var I = this, g = (
    /** @type {Node} */
    I.ownerDocument
  ), B = A.type, Q = A.composedPath?.() || [], E = (
    /** @type {null | Element} */
    Q[0] || A.target
  );
  wC = A;
  var C = 0, i = wC === A && A.__root;
  if (i) {
    var e = Q.indexOf(i);
    if (e !== -1 && (I === document || I === /** @type {any} */
    window)) {
      A.__root = I;
      return;
    }
    var t = Q.indexOf(I);
    if (t === -1)
      return;
    e <= t && (C = e);
  }
  if (E = /** @type {Element} */
  Q[C] || A.target, E !== I) {
    vg(A, "currentTarget", {
      configurable: !0,
      get() {
        return E || g;
      }
    });
    var o = Z, a = q;
    $A(null), DI(null);
    try {
      for (var s, n = []; E !== null; ) {
        var h = E.assignedSlot || E.parentNode || /** @type {any} */
        E.host || null;
        try {
          var l = E["__" + B];
          if (l != null && (!/** @type {any} */
          E.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          A.target === E))
            if (mB(l)) {
              var [u, ...y] = l;
              u.apply(E, [A, ...y]);
            } else
              l.call(E, A);
        } catch (f) {
          s ? n.push(f) : s = f;
        }
        if (A.cancelBubble || h === I || h === null)
          break;
        E = h;
      }
      if (s) {
        for (let f of n)
          queueMicrotask(() => {
            throw f;
          });
        throw s;
      }
    } finally {
      A.__root = I, delete A.currentTarget, $A(o), DI(a);
    }
  }
}
function vQ(A) {
  var I = document.createElement("template");
  return I.innerHTML = A.replaceAll("<!>", "<!---->"), I.content;
}
function hI(A, I) {
  var g = (
    /** @type {Effect} */
    q
  );
  g.nodes_start === null && (g.nodes_start = A, g.nodes_end = I);
}
// @__NO_SIDE_EFFECTS__
function yI(A, I) {
  var g = (I & Qi) !== 0, B = (I & Ei) !== 0, Q, E = !A.startsWith("<!>");
  return () => {
    if (AA)
      return hI(j, null), j;
    Q === void 0 && (Q = vQ(E ? A : "<!>" + A), g || (Q = /** @type {Node} */
    /* @__PURE__ */ iI(Q)));
    var C = (
      /** @type {TemplateNode} */
      B || iQ ? document.importNode(Q, !0) : Q.cloneNode(!0)
    );
    if (g) {
      var i = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ iI(C)
      ), e = (
        /** @type {TemplateNode} */
        C.lastChild
      );
      hI(i, e);
    } else
      hI(C, C);
    return C;
  };
}
// @__NO_SIDE_EFFECTS__
function pi(A, I, g = "svg") {
  var B = !A.startsWith("<!>"), Q = `<${g}>${B ? A : "<!>" + A}</${g}>`, E;
  return () => {
    if (AA)
      return hI(j, null), j;
    if (!E) {
      var C = (
        /** @type {DocumentFragment} */
        vQ(Q)
      ), i = (
        /** @type {Element} */
        /* @__PURE__ */ iI(C)
      );
      E = /** @type {Element} */
      /* @__PURE__ */ iI(i);
    }
    var e = (
      /** @type {TemplateNode} */
      E.cloneNode(!0)
    );
    return hI(e, e), e;
  };
}
// @__NO_SIDE_EFFECTS__
function rI(A, I) {
  return /* @__PURE__ */ pi(A, I, "svg");
}
function Cg() {
  if (AA)
    return hI(j, null), j;
  var A = document.createDocumentFragment(), I = document.createComment(""), g = lI();
  return A.append(I, g), hI(I, g), A;
}
function nA(A, I) {
  if (AA) {
    q.nodes_end = j, Gg();
    return;
  }
  A !== null && A.before(
    /** @type {Node} */
    I
  );
}
const Ji = ["touchstart", "touchmove"];
function Yi(A) {
  return Ji.includes(A);
}
function hg(A, I) {
  var g = I == null ? "" : typeof I == "object" ? I + "" : I;
  g !== (A.__t ??= A.nodeValue) && (A.__t = g, A.nodeValue = g + "");
}
function HQ(A, I) {
  return xQ(A, I);
}
function mi(A, I) {
  DB(), I.intro = I.intro ?? !1;
  const g = I.target, B = AA, Q = j;
  try {
    for (var E = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ iI(g)
    ); E && (E.nodeType !== Dg || /** @type {Comment} */
    E.data !== CQ); )
      E = /** @type {TemplateNode} */
      /* @__PURE__ */ oI(E);
    if (!E)
      throw VI;
    QI(!0), VA(
      /** @type {Comment} */
      E
    ), Gg();
    const C = xQ(A, { ...I, anchor: E });
    if (j === null || j.nodeType !== Dg || /** @type {Comment} */
    j.data !== bB)
      throw Xg(), VI;
    return QI(!1), /**  @type {Exports} */
    C;
  } catch (C) {
    if (C === VI)
      return I.recover === !1 && XE(), DB(), oQ(g), QI(!1), HQ(A, I);
    throw C;
  } finally {
    QI(B), VA(Q);
  }
}
const qI = /* @__PURE__ */ new Map();
function xQ(A, { target: I, anchor: g, props: B = {}, events: Q, context: E, intro: C = !0 }) {
  DB();
  var i = /* @__PURE__ */ new Set(), e = (a) => {
    for (var s = 0; s < a.length; s++) {
      var n = a[s];
      if (!i.has(n)) {
        i.add(n);
        var h = Yi(n);
        I.addEventListener(n, eg, { passive: h });
        var l = qI.get(n);
        l === void 0 ? (document.addEventListener(n, eg, { passive: h }), qI.set(n, 1)) : qI.set(n, l + 1);
      }
    }
  };
  e(KB(LQ)), yB.add(e);
  var t = void 0, o = Si(() => {
    var a = g ?? I.appendChild(lI());
    return mI(() => {
      if (E) {
        uI({});
        var s = (
          /** @type {ComponentContext} */
          vA
        );
        s.c = E;
      }
      Q && (B.$$events = Q), AA && hI(
        /** @type {TemplateNode} */
        a,
        null
      ), t = A(a, B) || {}, AA && (q.nodes_end = j), E && wI();
    }), () => {
      for (var s of i) {
        I.removeEventListener(s, eg);
        var n = (
          /** @type {number} */
          qI.get(s)
        );
        --n === 0 ? (document.removeEventListener(s, eg), qI.delete(s)) : qI.set(s, n);
      }
      yB.delete(e), a !== g && a.parentNode?.removeChild(a);
    };
  });
  return fB.set(t, o), t;
}
let fB = /* @__PURE__ */ new WeakMap();
function Ki(A, I) {
  const g = fB.get(A);
  return g ? (fB.delete(A), g(I)) : Promise.resolve();
}
function bQ(A) {
  return new Li(A);
}
class Li {
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
    var g = /* @__PURE__ */ new Map(), B = (E, C) => {
      var i = /* @__PURE__ */ wQ(C, !1, !1);
      return g.set(E, i), i;
    };
    const Q = new Proxy(
      { ...I.props || {}, $$events: {} },
      {
        get(E, C) {
          return r(g.get(C) ?? B(C, Reflect.get(E, C)));
        },
        has(E, C) {
          return C === OC ? !0 : (r(g.get(C) ?? B(C, Reflect.get(E, C))), Reflect.has(E, C));
        },
        set(E, C, i) {
          return L(g.get(C) ?? B(C, i), i), Reflect.set(E, C, i);
        }
      }
    );
    this.#A = (I.hydrate ? mi : HQ)(I.component, {
      target: I.target,
      anchor: I.anchor,
      props: Q,
      context: I.context,
      intro: I.intro ?? !1,
      recover: I.recover
    }), (!I?.props?.$$host || I.sync === !1) && ci(), this.#I = Q.$$events;
    for (const E of Object.keys(this.#A))
      E === "$set" || E === "$destroy" || E === "$on" || vg(this, E, {
        get() {
          return this.#A[E];
        },
        /** @param {any} value */
        set(C) {
          this.#A[E] = C;
        },
        enumerable: !0
      });
    this.#A.$set = /** @param {Record<string, any>} next */
    (E) => {
      Object.assign(Q, E);
    }, this.#A.$destroy = () => {
      Ki(this.#A);
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
    const B = (...Q) => g.call(this, ...Q);
    return this.#I[I].push(B), () => {
      this.#I[I] = this.#I[I].filter(
        /** @param {any} fn */
        (Q) => Q !== B
      );
    };
  }
  $destroy() {
    this.#A.$destroy();
  }
}
const vi = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(vi);
function OB(A) {
  vA === null && gQ(), BI(() => {
    const I = jI(A);
    if (typeof I == "function") return (
      /** @type {() => void} */
      I
    );
  });
}
function Hi(A) {
  vA === null && gQ(), OB(() => () => jI(A));
}
function kA(A, I, g = !1) {
  AA && Gg();
  var B = A, Q = null, E = null, C = uA, i = g ? UB : 0, e = !1;
  const t = (s, n = !0) => {
    e = !0, a(n, s);
  };
  function o() {
    var s = C ? Q : E, n = C ? E : Q;
    s && XB(s), n && zg(n, () => {
      C ? E = null : Q = null;
    });
  }
  const a = (s, n) => {
    if (C === (C = s)) return;
    let h = !1;
    if (AA) {
      const y = EQ(B) === xB;
      !!C === y && (B = lB(), VA(B), QI(!1), h = !0);
    }
    var l = rQ(), u = B;
    C ? Q ??= n && mI(() => n(u)) : E ??= n && mI(() => n(u)), l || o(), h && QI(!0);
  };
  WB(() => {
    e = !1, I(t), e || a(null, null);
  }, i), AA && (B = j);
}
function xi(A, I, g) {
  AA && Gg();
  var B = A, Q = uA, E, C, i = null, e = xE;
  function t() {
    E && zg(E), i !== null && (i.lastChild.remove(), B.before(i), i = null), E = C;
  }
  WB(() => {
    if (e(Q, Q = I())) {
      var o = B, a = rQ();
      a && (i = document.createDocumentFragment(), i.append(o = lI())), C = mI(() => g(o)), a ? hA.add_callback(t) : t();
    }
  }), AA && (B = j);
}
function BB(A, I) {
  return I;
}
function bi(A, I, g) {
  for (var B = A.items, Q = [], E = I.length, C = 0; C < E; C++)
    VB(I[C].e, Q, !0);
  var i = E > 0 && Q.length === 0 && g !== null;
  if (i) {
    var e = (
      /** @type {Element} */
      /** @type {Element} */
      g.parentNode
    );
    oQ(e), e.append(
      /** @type {Element} */
      g
    ), B.clear(), OA(A, I[0].prev, I[E - 1].next);
  }
  mQ(Q, () => {
    for (var t = 0; t < E; t++) {
      var o = I[t];
      i || (B.delete(o.k), OA(A, o.prev, o.next)), eI(o.e, !i);
    }
  });
}
function CB(A, I, g, B, Q, E = null) {
  var C = A, i = { flags: I, items: /* @__PURE__ */ new Map(), first: null }, e = (I & BQ) !== 0;
  if (e) {
    var t = (
      /** @type {Element} */
      A
    );
    C = AA ? VA(
      /** @type {Comment | Text} */
      /* @__PURE__ */ iI(t)
    ) : t.appendChild(lI());
  }
  AA && Gg();
  var o = null, a = !1, s = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ sQ(() => {
    var y = g();
    return mB(y) ? y : y == null ? [] : KB(y);
  }), h, l;
  function u() {
    qi(
      l,
      h,
      i,
      s,
      C,
      Q,
      I,
      B,
      g
    ), E !== null && (h.length === 0 ? o ? XB(o) : o = mI(() => E(C)) : o !== null && zg(o, () => {
      o = null;
    }));
  }
  WB(() => {
    l ??= /** @type {Effect} */
    q, h = r(n);
    var y = h.length;
    if (a && y === 0)
      return;
    a = y === 0;
    let f = !1;
    if (AA) {
      var D = EQ(C) === xB;
      D !== (y === 0) && (C = lB(), VA(C), QI(!1), f = !0);
    }
    if (AA) {
      for (var G = null, F, S = 0; S < y; S++) {
        if (j.nodeType === Dg && /** @type {Comment} */
        j.data === bB) {
          C = /** @type {Comment} */
          j, f = !0, QI(!1);
          break;
        }
        var M = h[S], _ = B(M, S);
        F = qQ(
          j,
          i,
          G,
          null,
          M,
          _,
          S,
          Q,
          I,
          g
        ), i.items.set(_, F), G = F;
      }
      y > 0 && VA(lB());
    }
    AA ? y === 0 && E && (o = mI(() => E(C))) : u(), f && QI(!0), r(n);
  }), AA && (C = j);
}
function qi(A, I, g, B, Q, E, C, i, e) {
  var t = (C & $E) !== 0, o = (C & (vB | HB)) !== 0, a = I.length, s = g.items, n = g.first, h = n, l, u = null, y, f = [], D = [], G, F, S, M;
  if (t)
    for (M = 0; M < a; M += 1)
      G = I[M], F = i(G, M), S = s.get(F), S !== void 0 && (S.a?.measure(), (y ??= /* @__PURE__ */ new Set()).add(S));
  for (M = 0; M < a; M += 1) {
    if (G = I[M], F = i(G, M), S = s.get(F), S === void 0) {
      var _ = B.get(F);
      if (_ !== void 0) {
        B.delete(F), s.set(F, _);
        var m = u ? u.next : h;
        OA(g, u, _), OA(g, _, m), QB(_, m, Q), u = _;
      } else {
        var eA = h ? (
          /** @type {TemplateNode} */
          h.e.nodes_start
        ) : Q;
        u = qQ(
          eA,
          g,
          u,
          u === null ? g.first : u.next,
          G,
          F,
          M,
          E,
          C,
          e
        );
      }
      s.set(F, u), f = [], D = [], h = u.next;
      continue;
    }
    if (o && Ti(S, G, M, C), (S.e.f & WA) !== 0 && (XB(S.e), t && (S.a?.unfix(), (y ??= /* @__PURE__ */ new Set()).delete(S))), S !== h) {
      if (l !== void 0 && l.has(S)) {
        if (f.length < D.length) {
          var BA = D[0], T;
          u = BA.prev;
          var tA = f[0], O = f[f.length - 1];
          for (T = 0; T < f.length; T += 1)
            QB(f[T], BA, Q);
          for (T = 0; T < D.length; T += 1)
            l.delete(D[T]);
          OA(g, tA.prev, O.next), OA(g, u, tA), OA(g, O, BA), h = BA, u = O, M -= 1, f = [], D = [];
        } else
          l.delete(S), QB(S, h, Q), OA(g, S.prev, S.next), OA(g, S, u === null ? g.first : u.next), OA(g, u, S), u = S;
        continue;
      }
      for (f = [], D = []; h !== null && h.k !== F; )
        (h.e.f & WA) === 0 && (l ??= /* @__PURE__ */ new Set()).add(h), D.push(h), h = h.next;
      if (h === null)
        continue;
      S = h;
    }
    f.push(S), u = S, h = S.next;
  }
  if (h !== null || l !== void 0) {
    for (var CA = l === void 0 ? [] : KB(l); h !== null; )
      (h.e.f & WA) === 0 && CA.push(h), h = h.next;
    var z = CA.length;
    if (z > 0) {
      var Y = (C & BQ) !== 0 && a === 0 ? Q : null;
      if (t) {
        for (M = 0; M < z; M += 1)
          CA[M].a?.measure();
        for (M = 0; M < z; M += 1)
          CA[M].a?.fix();
      }
      bi(g, CA, Y);
    }
  }
  t && TB(() => {
    if (y !== void 0)
      for (S of y)
        S.a?.apply();
  }), A.first = g.first && g.first.e, A.last = u && u.e;
  for (var aA of B.values())
    eI(aA.e);
  B.clear();
}
function Ti(A, I, g, B) {
  (B & vB) !== 0 && wg(A.v, I), (B & HB) !== 0 ? wg(
    /** @type {Value<number>} */
    A.i,
    g
  ) : A.i = g;
}
function qQ(A, I, g, B, Q, E, C, i, e, t, o) {
  var a = (e & vB) !== 0, s = (e & Ai) === 0, n = a ? s ? /* @__PURE__ */ wQ(Q, !1, !1) : ug(Q) : Q, h = (e & HB) === 0 ? C : ug(C), l = {
    i: h,
    v: n,
    k: E,
    a: null,
    // @ts-expect-error
    e: null,
    prev: g,
    next: B
  };
  try {
    if (A === null) {
      var u = document.createDocumentFragment();
      u.append(A = lI());
    }
    return l.e = mI(() => i(
      /** @type {Node} */
      A,
      n,
      h,
      t
    ), AA), l.e.prev = g && g.e, l.e.next = B && B.e, g === null ? o || (I.first = l) : (g.next = l, g.e.next = l.e), B !== null && (B.prev = l, B.e.prev = l.e), l;
  } finally {
  }
}
function QB(A, I, g) {
  for (var B = A.next ? (
    /** @type {TemplateNode} */
    A.next.e.nodes_start
  ) : g, Q = I ? (
    /** @type {TemplateNode} */
    I.e.nodes_start
  ) : g, E = (
    /** @type {TemplateNode} */
    A.e.nodes_start
  ); E !== null && E !== B; ) {
    var C = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ oI(E)
    );
    Q.before(E), E = C;
  }
}
function OA(A, I, g) {
  I === null ? A.first = g : (I.next = g, I.e.next = g && g.e), g !== null && (g.prev = I, g.e.prev = I && I.e);
}
function _i(A, I, g) {
  UQ(() => {
    var B = jI(() => I(A, g?.()) || {});
    if (g && B?.update) {
      var Q = !1, E = (
        /** @type {any} */
        {}
      );
      kQ(() => {
        var C = g();
        Fi(C), Q && AQ(E, C) && (E = C, B.update(C));
      }), Q = !0;
    }
    if (B?.destroy)
      return () => (
        /** @type {Function} */
        B.destroy()
      );
  });
}
function yC(A, I = !1) {
  var g = I ? " !important;" : ";", B = "";
  for (var Q in A) {
    var E = A[Q];
    E != null && E !== "" && (B += " " + Q + ": " + E + g);
  }
  return B;
}
function Wi(A, I) {
  if (I) {
    var g = "", B, Q;
    return Array.isArray(I) ? (B = I[0], Q = I[1]) : B = I, B && (g += yC(B)), Q && (g += yC(Q, !0)), g = g.trim(), g === "" ? null : g;
  }
  return String(A);
}
function EB(A, I = {}, g, B) {
  for (var Q in g) {
    var E = g[Q];
    I[Q] !== E && (g[Q] == null ? A.style.removeProperty(Q) : A.style.setProperty(Q, E, B));
  }
}
function X(A, I, g, B) {
  var Q = A.__style;
  if (AA || Q !== I) {
    var E = Wi(I, B);
    (!AA || E !== A.getAttribute("style")) && (E == null ? A.removeAttribute("style") : A.style.cssText = E), A.__style = I;
  } else B && (Array.isArray(B) ? (EB(A, g?.[0], B[0]), EB(A, g?.[1], B[1], "important")) : EB(A, g, B));
  return B;
}
const Vi = Symbol("is custom element"), Xi = Symbol("is html");
function U(A, I, g, B) {
  var Q = Zi(A);
  AA && (Q[I] = A.getAttribute(I), I === "src" || I === "srcset" || I === "href" && A.nodeName === "LINK") || Q[I] !== (Q[I] = g) && (I === "loading" && (A[YE] = g), g == null ? A.removeAttribute(I) : typeof g != "string" && Oi(A).includes(I) ? A[I] = g : A.setAttribute(I, g));
}
function Zi(A) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    A.__attributes ??= {
      [Vi]: A.nodeName.includes("-"),
      [Xi]: A.namespaceURI === ii
    }
  );
}
var fC = /* @__PURE__ */ new Map();
function Oi(A) {
  var I = fC.get(A.nodeName);
  if (I) return I;
  fC.set(A.nodeName, I = []);
  for (var g, B = A, Q = Element.prototype; Q !== B; ) {
    g = zC(B);
    for (var E in g)
      g[E].set && I.push(E);
    B = LB(B);
  }
  return I;
}
function FC(A, I) {
  return A === I || A?.[MI] === I;
}
function FB(A = {}, I, g, B) {
  return UQ(() => {
    var Q, E;
    return kQ(() => {
      Q = E, E = [], jI(() => {
        A !== g(...E) && (I(A, ...E), Q && FC(g(...Q), A) && I(null, ...Q));
      });
    }), () => {
      TB(() => {
        E && FC(g(...E), A) && I(null, ...E);
      });
    };
  }), A;
}
let Ug = !1;
function Pi(A) {
  var I = Ug;
  try {
    return Ug = !1, [A(), Ug];
  } finally {
    Ug = I;
  }
}
function d(A, I, g, B) {
  var Q = (g & Bi) !== 0, E = (g & Ci) !== 0, C = (
    /** @type {V} */
    B
  ), i = !0, e = () => (i && (i = !1, C = E ? jI(
    /** @type {() => V} */
    B
  ) : (
    /** @type {V} */
    B
  )), C), t;
  if (Q) {
    var o = MI in A || OC in A;
    t = WI(A, I)?.set ?? (o && I in A ? (f) => A[I] = f : void 0);
  }
  var a, s = !1;
  Q ? [a, s] = Pi(() => (
    /** @type {V} */
    A[I]
  )) : a = /** @type {V} */
  A[I], a === void 0 && B !== void 0 && (a = e(), t && (ZE(), t(a)));
  var n;
  if (n = () => {
    var f = (
      /** @type {V} */
      A[I]
    );
    return f === void 0 ? e() : (i = !0, f);
  }, (g & gi) === 0)
    return n;
  if (t) {
    var h = A.$$legacy;
    return function(f, D) {
      return arguments.length > 0 ? ((!D || h || s) && t(D ? n() : f), f) : n();
    };
  }
  var l = !1, u = ((g & Ii) !== 0 ? Zg : sQ)(() => (l = !1, n()));
  Q && r(u);
  var y = (
    /** @type {Effect} */
    q
  );
  return function(f, D) {
    if (arguments.length > 0) {
      const G = D ? r(u) : Q ? SI(f) : f;
      return L(u, G), l = !0, C !== void 0 && (C = G), f;
    }
    return vI && l || (y.f & LI) !== 0 ? u.v : r(u);
  };
}
var zi = /* @__PURE__ */ rI('<g><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect></g>');
function ji(A, I) {
  uI(I, !0);
  let g = /* @__PURE__ */ k(() => I.pointLocation(I.value.xMin, I.value.yMin)), B = /* @__PURE__ */ k(() => I.pointLocation(I.value.xMax, I.value.yMax));
  const Q = 8;
  function E(m) {
    return (eA) => {
      eA.stopPropagation(), eA.preventDefault(), I.preventHover(!0);
      let BA = [r(g).x, r(g).y, r(B).x, r(B).y], T = (O) => {
        O.preventDefault();
        let CA = O.pageX - eA.pageX, z = O.pageY - eA.pageY, Y = [CA, z, CA, z].map((b, QA) => BA[QA] + b * m[QA]), aA = I.coordinateAtPoint(Y[0], Y[1]), P = I.coordinateAtPoint(Y[2], Y[3]);
        I.onChange({
          xMin: Math.min(aA.x, P.x),
          xMax: Math.max(aA.x, P.x),
          yMin: Math.min(aA.y, P.y),
          yMax: Math.max(aA.y, P.y)
        });
      }, tA = () => {
        I.preventHover(!1), window.removeEventListener("mousemove", T), window.removeEventListener("mouseup", tA);
      };
      window.addEventListener("mousemove", T), window.addEventListener("mouseup", tA);
    };
  }
  var C = zi(), i = wA(C), e = /* @__PURE__ */ k(() => E([1, 1, 1, 1]));
  i.__mousedown = function(...m) {
    r(e)?.apply(this, m);
  }, X(i, "", {}, {
    stroke: "#fff",
    fill: "rgba(128,128,128,0.25)",
    cursor: "move"
  });
  var t = iA(i);
  U(t, "width", Q);
  var o = /* @__PURE__ */ k(() => E([1, 0, 0, 0]));
  t.__mousedown = function(...m) {
    r(o)?.apply(this, m);
  }, X(t, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var a = iA(t);
  U(a, "width", Q);
  var s = /* @__PURE__ */ k(() => E([0, 0, 1, 0]));
  a.__mousedown = function(...m) {
    r(s)?.apply(this, m);
  }, X(a, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var n = iA(a);
  U(n, "height", Q);
  var h = /* @__PURE__ */ k(() => E([0, 1, 0, 0]));
  n.__mousedown = function(...m) {
    r(h)?.apply(this, m);
  }, X(n, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var l = iA(n);
  U(l, "height", Q);
  var u = /* @__PURE__ */ k(() => E([0, 0, 0, 1]));
  l.__mousedown = function(...m) {
    r(u)?.apply(this, m);
  }, X(l, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var y = iA(l);
  U(y, "width", Q), U(y, "height", Q);
  var f = /* @__PURE__ */ k(() => E([1, 1, 0, 0]));
  y.__mousedown = function(...m) {
    r(f)?.apply(this, m);
  }, X(y, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var D = iA(y);
  U(D, "width", Q), U(D, "height", Q);
  var G = /* @__PURE__ */ k(() => E([1, 0, 0, 1]));
  D.__mousedown = function(...m) {
    r(G)?.apply(this, m);
  }, X(D, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var F = iA(D);
  U(F, "width", Q), U(F, "height", Q);
  var S = /* @__PURE__ */ k(() => E([0, 1, 1, 0]));
  F.__mousedown = function(...m) {
    r(S)?.apply(this, m);
  }, X(F, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var M = iA(F);
  U(M, "width", Q), U(M, "height", Q);
  var _ = /* @__PURE__ */ k(() => E([0, 0, 1, 1]));
  M.__mousedown = function(...m) {
    r(_)?.apply(this, m);
  }, X(M, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  }), lA(C), KA(
    (m, eA, BA, T, tA, O, CA, z, Y, aA, P, b) => {
      U(i, "x", m), U(i, "width", eA), U(i, "y", BA), U(i, "height", T), U(t, "x", r(g).x - Q / 2), U(t, "y", tA), U(t, "height", O), U(a, "x", r(B).x - Q / 2), U(a, "y", CA), U(a, "height", z), U(n, "x", Y), U(n, "width", aA), U(n, "y", r(g).y - Q / 2), U(l, "x", P), U(l, "width", b), U(l, "y", r(B).y - Q / 2), U(y, "x", r(g).x - Q / 2), U(y, "y", r(g).y - Q / 2), U(D, "x", r(g).x - Q / 2), U(D, "y", r(B).y - Q / 2), U(F, "x", r(B).x - Q / 2), U(F, "y", r(g).y - Q / 2), U(M, "x", r(B).x - Q / 2), U(M, "y", r(B).y - Q / 2);
    },
    [
      () => Math.min(r(g).x, r(B).x),
      () => Math.abs(r(g).x - r(B).x),
      () => Math.min(r(g).y, r(B).y),
      () => Math.abs(r(g).y - r(B).y),
      () => Math.min(r(g).y, r(B).y),
      () => Math.abs(r(g).y - r(B).y),
      () => Math.min(r(g).y, r(B).y),
      () => Math.abs(r(g).y - r(B).y),
      () => Math.min(r(g).x, r(B).x),
      () => Math.abs(r(g).x - r(B).x),
      () => Math.min(r(g).x, r(B).x),
      () => Math.abs(r(g).x - r(B).x)
    ]
  ), nA(A, C), wI();
}
ZB(["mousedown"]);
function $i(A, I) {
  let g = !1, B, Q, E, C = 300, i = 300, e = async (o) => {
    g = !0;
    try {
      await A(o);
    } catch (a) {
      console.error(a);
    }
    if (g = !1, B !== void 0) {
      let a = B;
      B = void 0, t(a);
    }
  }, t = async (o) => {
    if (g) {
      B = o;
      return;
    }
    let a = (/* @__PURE__ */ new Date()).getTime();
    I() && (Q = a);
    let s = !0;
    (Q == null || a - Q < i) && (s = !1), s ? (E && clearTimeout(E), E = setTimeout(() => e(o), C)) : e(o);
  };
  return t;
}
function iB(A) {
  return { shift: A.shiftKey, ctrl: A.ctrlKey, alt: A.altKey, meta: A.metaKey };
}
function Ae(A, I) {
  let { zoom: g, click: B, drag: Q, hover: E } = I, C = !1, i = !1, e = null, t = B == null ? 0 : 5;
  return {
    wheel: (o) => {
      if (g == null)
        return;
      o.preventDefault();
      let a = A.getBoundingClientRect(), s = o.clientX - a.left, n = o.clientY - a.top, h = Math.exp(-o.deltaY / 200);
      g(h, { x: s, y: n }, iB(o));
    },
    mousedown: (o) => {
      o.preventDefault();
      let a = A.getBoundingClientRect(), s = o.clientX - a.left, n = o.clientY - a.top, h = !1, l = null;
      C = !0;
      let u = (f) => {
        f.preventDefault();
        let D = A.getBoundingClientRect(), G = f.clientX - D.left, F = f.clientY - D.top;
        h == !1 && Q != null && (G - s) * (G - s) + (F - n) * (F - n) > t * t && (h = !0, l = Q({ x: s, y: n }, iB(o))), h && l?.move != null && l.move({ x: G, y: F });
      }, y = () => {
        window.removeEventListener("mousemove", u), window.removeEventListener("mouseup", y), C = !1, h && l?.release != null && l.release(), h || B && B({ x: s, y: n }, iB(o));
      };
      window.addEventListener("mousemove", u), window.addEventListener("mouseup", y);
    },
    mousemove: (o) => {
      if (E == null || C || i)
        return;
      let a = A.getBoundingClientRect(), s = o.clientX - a.left, n = o.clientY - a.top;
      e = { x: s, y: n }, E({ x: s, y: n });
    },
    mouseleave: () => {
      e != null && E != null && (e = null, E(null));
    },
    preventHover: (o) => {
      o != i && (o && e != null && E != null && (e = null, E(null)), i = o);
    }
  };
}
function Ie(A, I) {
  let g = A.x - I.x, B = A.y - I.y;
  return Math.sqrt(g * g + B * B);
}
function ge(A) {
  return "M " + A.map(({ x: I, y: g }) => `${I},${g}`).join(" L ") + " Z";
}
function TQ(A) {
  let I = 1 / 0, g = -1 / 0, B = 1 / 0, Q = -1 / 0;
  for (let { x: E, y: C } of A)
    I = Math.min(I, E), B = Math.min(B, C), g = Math.max(g, E), Q = Math.max(Q, C);
  return { xMin: I, yMin: B, xMax: g, yMax: Q };
}
async function Be(A) {
  let I = JSON.stringify(A), g = new TextEncoder().encode(I), B = await crypto.subtle.digest("SHA-1", g);
  return Array.from(new Uint8Array(B)).map((Q) => Q.toString(16).padStart(2, "0")).join("");
}
function aI(A, I) {
  if (A === I)
    return !0;
  if (A === null || I === null || typeof A != "object" || typeof I != "object" || Object.keys(A).length !== Object.keys(I).length)
    return !1;
  for (let g in A)
    if (I.hasOwnProperty(g)) {
      if (!aI(A[g], I[g]))
        return !1;
    } else
      return !1;
  return !0;
}
var Ce = /* @__PURE__ */ rI("<path></path>");
function Qe(A, I) {
  uI(I, !0);
  let g = /* @__PURE__ */ k(() => I.value.map(({ x: Q, y: E }) => I.pointLocation(Q, E)));
  var B = Ce();
  X(B, "", {}, { stroke: "#fff", fill: "rgba(128,128,128,0.25)" }), KA((Q) => U(B, "d", Q), [() => ge(r(g))]), nA(A, B), wI();
}
const Ee = {
  marquee: "M7 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m1-.25c0 .414.336.75.75.75h6.5a.75.75 0 0 0 0-1.5h-6.5a.75.75 0 0 0-.75.75M4.75 8a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5A.75.75 0 0 0 4.75 8m14.5 0a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 0-.75-.75M8.75 20a.75.75 0 0 1 0-1.5h6.5a.75.75 0 0 1 0 1.5zM5 21a2 2 0 1 0 0-4a2 2 0 0 0 0 4M21 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-2 16a2 2 0 1 0 0-4a2 2 0 0 0 0 4",
  lasso: "M9.703 2.265A10 10 0 0 1 12 2c.79 0 1.559.092 2.297.265a.75.75 0 1 1-.343 1.46A8.5 8.5 0 0 0 12 3.5a8.6 8.6 0 0 0-1.954.225a.75.75 0 1 1-.343-1.46m-1.93 1.47a.75.75 0 0 1-.242 1.033a8.55 8.55 0 0 0-2.763 2.763a.75.75 0 1 1-1.275-.79a10.05 10.05 0 0 1 3.248-3.248a.75.75 0 0 1 1.032.243m8.454 0a.75.75 0 0 1 1.032-.242a10.05 10.05 0 0 1 3.248 3.248a.75.75 0 1 1-1.275.79a8.55 8.55 0 0 0-2.763-2.763a.75.75 0 0 1-.242-1.032m-13.06 5.41a.75.75 0 0 1 .558.901A8.5 8.5 0 0 0 3.5 12c0 .673.078 1.327.225 1.954a.75.75 0 1 1-1.46.343A10 10 0 0 1 2 12c0-.79.092-1.559.265-2.297a.75.75 0 0 1 .902-.559m17.666 0a.75.75 0 0 1 .902.558a10.1 10.1 0 0 1 0 4.595a.75.75 0 1 1-1.46-.343a8.54 8.54 0 0 0-.001-3.908a.75.75 0 0 1 .559-.902M3.736 16.226a.75.75 0 0 1 1.032.242a8.55 8.55 0 0 0 2.763 2.763a.75.75 0 0 1-.79 1.275a10.05 10.05 0 0 1-3.248-3.248a.75.75 0 0 1 .243-1.032m16.685.858a.75.75 0 1 0-1.342-.67l-.002.004l-.015.029l-.069.123a8 8 0 0 1-.289.466a9.6 9.6 0 0 1-.965 1.219c-1.17-1.073-2.756-2.006-4.74-2.006c-2.347 0-3.99 1.203-3.99 2.875S10.653 22 13 22c1.942 0 3.495-.75 4.658-1.645a11.7 11.7 0 0 1 1.315 2.01q.05.099.073.149l.017.035l.004.009a.75.75 0 0 0 1.368-.615c-.087-.183 0-.001 0-.001v-.002l-.003-.004l-.007-.015l-.024-.052l-.091-.184a13.2 13.2 0 0 0-1.538-2.337a11 11 0 0 0 1.525-2.032l.09-.162l.024-.047l.007-.014l.002-.005zM13 17.75c1.433 0 2.644.652 3.616 1.512c-.95.7-2.155 1.238-3.616 1.238c-1.973 0-2.49-.922-2.49-1.375s.517-1.375 2.49-1.375"
};
var ie = /* @__PURE__ */ rI('<svg width="24" height="24" viewBox="0 0 24 24"><path></path></svg>'), ee = /* @__PURE__ */ yI("<button><!></button>");
function dC(A, I) {
  let g = d(I, "active", 3, !1);
  var B = ee();
  B.__click = function(...i) {
    I.onClick?.apply(this, i);
  };
  let Q;
  var E = wA(B);
  {
    var C = (i) => {
      var e = ie();
      X(e, "", {}, { width: "14px", height: "14px" });
      var t = wA(e);
      X(t, "", {}, { fill: "currentColor" }), lA(e), KA(() => U(t, "d", Ee[I.icon])), nA(i, e);
    };
    kA(E, (i) => {
      I.icon != null && i(C);
    });
  }
  lA(B), KA(
    (i) => {
      U(B, "title", I.title), Q = X(B, "", Q, i);
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
ZB(["click"]);
var te = /* @__PURE__ */ yI('<div><div> </div> <svg height="6px"><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line></svg></div>');
function oe(A, I) {
  function g(s, n) {
    let h = Math.log10(n * s), l = Math.round(h), u = [0.1, 0.2, 0.5, 1, 2, 5, 10], y = 0, f = 1e10;
    for (let D of u) {
      let G = Math.abs(Math.log10(D) + l - h);
      G < f && (y = D, f = G);
    }
    return y * Math.pow(10, l);
  }
  let B = /* @__PURE__ */ k(() => g(I.distancePerPoint, 30)), Q = /* @__PURE__ */ k(() => r(B) / I.distancePerPoint);
  var E = te();
  X(E, "", {}, { display: "flex", "align-items": "center" });
  var C = wA(E);
  X(C, "", {}, { "padding-right": "4px" });
  var i = wA(C, !0);
  lA(C);
  var e = iA(C, 2), t = wA(e);
  U(t, "x1", 1), U(t, "y1", 3), U(t, "y2", 3), X(t, "", {}, {
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-cap": "butt"
  });
  var o = iA(t);
  U(o, "x1", 1), U(o, "x2", 1), U(o, "y1", 0), U(o, "y2", 6), X(o, "", {}, { stroke: "currentColor" });
  var a = iA(o);
  U(a, "y1", 0), U(a, "y2", 6), X(a, "", {}, { stroke: "currentColor" }), lA(e), lA(E), KA(
    (s) => {
      hg(i, s), U(e, "width", `${r(Q) + 2}px`), U(t, "x2", r(Q) + 1), U(a, "x1", r(Q) + 1), U(a, "x2", r(Q) + 1);
    },
    [() => r(B).toLocaleString()]
  ), nA(A, E);
}
var re = /* @__PURE__ */ yI("<div> </div>"), ne = /* @__PURE__ */ yI('<a target="_blank"> </a> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div>', 1), ae = /* @__PURE__ */ yI('<div><div><!></div> <div></div> <div><!> <!> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <span> </span></div></div>');
function se(A, I) {
  uI(I, !0);
  let g = d(I, "statusMessage", 3, null);
  var B = ae();
  let Q;
  var E = wA(B);
  let C;
  var i = wA(E);
  {
    var e = (D) => {
      var G = re();
      X(G, "", {}, { display: "inline-block" });
      var F = wA(G, !0);
      lA(G), KA(() => hg(F, g())), nA(D, G);
    };
    kA(i, (D) => {
      g() != null && D(e);
    });
  }
  lA(E);
  var t = iA(E, 2);
  X(t, "", {}, { flex: "1 1 0%" });
  var o = iA(t, 2);
  let a;
  var s = wA(o);
  {
    var n = (D) => {
      var G = ne(), F = TI(G);
      X(F, "", {}, { color: "currentColor", "text-decoration": "underline" });
      var S = wA(F, !0);
      lA(F), ei(2), KA(() => {
        U(F, "href", I.resolvedTheme.brandingLink.href), hg(S, I.resolvedTheme.brandingLink.text);
      }), nA(D, G);
    };
    kA(s, (D) => {
      I.resolvedTheme.brandingLink != null && D(n);
    });
  }
  var h = iA(s, 2);
  {
    let D = /* @__PURE__ */ k(() => I.selectionMode == "marquee");
    dC(h, {
      icon: "marquee",
      get active() {
        return r(D);
      },
      title: "Toggle rectangle selection mode. In normal mode, use shift + drag for rectangle selection.",
      onClick: () => I.onSelectionMode(I.selectionMode == "marquee" ? "none" : "marquee")
    });
  }
  var l = iA(h, 2);
  {
    let D = /* @__PURE__ */ k(() => I.selectionMode == "lasso");
    dC(l, {
      icon: "lasso",
      get active() {
        return r(D);
      },
      title: "Toggle lasso selection mode. In normal mode, use shift + meta + drag for lasso selection.",
      onClick: () => I.onSelectionMode(I.selectionMode == "lasso" ? "none" : "lasso")
    });
  }
  var u = iA(l, 4);
  oe(u, {
    get distancePerPoint() {
      return I.distancePerPoint;
    }
  });
  var y = iA(u, 4), f = wA(y);
  lA(y), lA(o), lA(B), KA(
    (D, G, F, S) => {
      Q = X(B, "", Q, D), C = X(E, "", C, G), a = X(o, "", a, F), hg(f, `${S ?? ""} points`);
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
  ), nA(A, B), wI();
}
function he(A) {
  return (I, g) => {
    let B = new A(I, g);
    return {
      ...B.update ? { update: B.update.bind(B) } : {},
      ...B.destroy ? { destroy: B.destroy.bind(B) } : {}
    };
  };
}
let eB = /* @__PURE__ */ new WeakMap();
function _Q(A) {
  let I = typeof A == "function" ? A : A.class;
  if (eB.has(I))
    return eB.get(I);
  {
    let g = he(I);
    return eB.set(I, g), g;
  }
}
function WQ(A, I) {
  return typeof A == "function" ? I : { ...A.props ?? {}, ...I };
}
var le = /* @__PURE__ */ yI("<div><div></div></div>");
function De(A, I) {
  uI(I, !0);
  let g = d(I, "margin", 3, 4), B, Q, E = /* @__PURE__ */ k(() => _Q(I.customTooltip)), C = /* @__PURE__ */ k(() => WQ(I.customTooltip, { tooltip: I.tooltip }));
  OB(() => {
    qg(() => {
      let t = r(E), o = null;
      return qg(() => {
        Q.style.left = "0px", Q.style.top = "0px", Q.style.pointerEvents = I.allowInteraction ? "all" : "none", o == null ? o = t(Q, r(C)) : o.update?.(r(C));
        function a(u, y, f, D) {
          let G = I.location.x, F = I.location.y, S = 2, M = u / 2, _ = y + (I.targetHeight + g());
          G - M < f && (M = G - f), G - M > D - u && (M = G - D + u), F - _ < S && (_ = -(I.targetHeight + g())), Q.style.left = G - M + "px", Q.style.top = F - _ + "px";
        }
        let s = B.getBoundingClientRect(), { width: n, height: h } = Q.getBoundingClientRect();
        a(n, h, 2, s.width - 2);
        let l = requestAnimationFrame(() => {
          l = null;
          let u = Q.getBoundingClientRect();
          (u.width != n || u.height != h) && a(u.width, u.height, 2, s.width - 2);
        });
        return () => {
          l != null && cancelAnimationFrame(l);
        };
      }), () => {
        o?.destroy?.(), Q.replaceChildren();
      };
    });
  });
  var i = le();
  X(i, "", {}, { position: "absolute", width: "100%" });
  var e = wA(i);
  X(e, "", {}, {
    display: "flex",
    position: "absolute",
    width: "fit-content",
    height: "fit-content",
    "z-index": "100"
  }), FB(e, (t) => Q = t, () => Q), lA(i), FB(i, (t) => B = t, () => B), nA(A, i), wI();
}
function PB(A, I, g) {
  A.prototype = I.prototype = g, g.constructor = A;
}
function VQ(A, I) {
  var g = Object.create(A.prototype);
  for (var B in I) g[B] = I[B];
  return g;
}
function Sg() {
}
var fg = 0.7, Tg = 1 / fg, ZI = "\\s*([+-]?\\d+)\\s*", Fg = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", zA = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", ce = /^#([0-9a-f]{3,8})$/, ue = new RegExp(`^rgb\\(${ZI},${ZI},${ZI}\\)$`), we = new RegExp(`^rgb\\(${zA},${zA},${zA}\\)$`), ye = new RegExp(`^rgba\\(${ZI},${ZI},${ZI},${Fg}\\)$`), fe = new RegExp(`^rgba\\(${zA},${zA},${zA},${Fg}\\)$`), Fe = new RegExp(`^hsl\\(${Fg},${zA},${zA}\\)$`), de = new RegExp(`^hsla\\(${Fg},${zA},${zA},${Fg}\\)$`), GC = {
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
PB(Sg, zB, {
  copy(A) {
    return Object.assign(new this.constructor(), this, A);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: SC,
  // Deprecated! Use color.formatHex.
  formatHex: SC,
  formatHex8: Ge,
  formatHsl: Se,
  formatRgb: RC,
  toString: RC
});
function SC() {
  return this.rgb().formatHex();
}
function Ge() {
  return this.rgb().formatHex8();
}
function Se() {
  return ZQ(this).formatHsl();
}
function RC() {
  return this.rgb().formatRgb();
}
function zB(A) {
  var I, g;
  return A = (A + "").trim().toLowerCase(), (I = ce.exec(A)) ? (g = I[1].length, I = parseInt(I[1], 16), g === 6 ? NC(I) : g === 3 ? new pA(I >> 8 & 15 | I >> 4 & 240, I >> 4 & 15 | I & 240, (I & 15) << 4 | I & 15, 1) : g === 8 ? kg(I >> 24 & 255, I >> 16 & 255, I >> 8 & 255, (I & 255) / 255) : g === 4 ? kg(I >> 12 & 15 | I >> 8 & 240, I >> 8 & 15 | I >> 4 & 240, I >> 4 & 15 | I & 240, ((I & 15) << 4 | I & 15) / 255) : null) : (I = ue.exec(A)) ? new pA(I[1], I[2], I[3], 1) : (I = we.exec(A)) ? new pA(I[1] * 255 / 100, I[2] * 255 / 100, I[3] * 255 / 100, 1) : (I = ye.exec(A)) ? kg(I[1], I[2], I[3], I[4]) : (I = fe.exec(A)) ? kg(I[1] * 255 / 100, I[2] * 255 / 100, I[3] * 255 / 100, I[4]) : (I = Fe.exec(A)) ? kC(I[1], I[2] / 100, I[3] / 100, 1) : (I = de.exec(A)) ? kC(I[1], I[2] / 100, I[3] / 100, I[4]) : GC.hasOwnProperty(A) ? NC(GC[A]) : A === "transparent" ? new pA(NaN, NaN, NaN, 0) : null;
}
function NC(A) {
  return new pA(A >> 16 & 255, A >> 8 & 255, A & 255, 1);
}
function kg(A, I, g, B) {
  return B <= 0 && (A = I = g = NaN), new pA(A, I, g, B);
}
function Re(A) {
  return A instanceof Sg || (A = zB(A)), A ? (A = A.rgb(), new pA(A.r, A.g, A.b, A.opacity)) : new pA();
}
function XQ(A, I, g, B) {
  return arguments.length === 1 ? Re(A) : new pA(A, I, g, B ?? 1);
}
function pA(A, I, g, B) {
  this.r = +A, this.g = +I, this.b = +g, this.opacity = +B;
}
PB(pA, XQ, VQ(Sg, {
  brighter(A) {
    return A = A == null ? Tg : Math.pow(Tg, A), new pA(this.r * A, this.g * A, this.b * A, this.opacity);
  },
  darker(A) {
    return A = A == null ? fg : Math.pow(fg, A), new pA(this.r * A, this.g * A, this.b * A, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new pA(pI(this.r), pI(this.g), pI(this.b), _g(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: MC,
  // Deprecated! Use color.formatHex.
  formatHex: MC,
  formatHex8: Ne,
  formatRgb: UC,
  toString: UC
}));
function MC() {
  return `#${RI(this.r)}${RI(this.g)}${RI(this.b)}`;
}
function Ne() {
  return `#${RI(this.r)}${RI(this.g)}${RI(this.b)}${RI((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function UC() {
  const A = _g(this.opacity);
  return `${A === 1 ? "rgb(" : "rgba("}${pI(this.r)}, ${pI(this.g)}, ${pI(this.b)}${A === 1 ? ")" : `, ${A})`}`;
}
function _g(A) {
  return isNaN(A) ? 1 : Math.max(0, Math.min(1, A));
}
function pI(A) {
  return Math.max(0, Math.min(255, Math.round(A) || 0));
}
function RI(A) {
  return A = pI(A), (A < 16 ? "0" : "") + A.toString(16);
}
function kC(A, I, g, B) {
  return B <= 0 ? A = I = g = NaN : g <= 0 || g >= 1 ? A = I = NaN : I <= 0 && (A = NaN), new _A(A, I, g, B);
}
function ZQ(A) {
  if (A instanceof _A) return new _A(A.h, A.s, A.l, A.opacity);
  if (A instanceof Sg || (A = zB(A)), !A) return new _A();
  if (A instanceof _A) return A;
  A = A.rgb();
  var I = A.r / 255, g = A.g / 255, B = A.b / 255, Q = Math.min(I, g, B), E = Math.max(I, g, B), C = NaN, i = E - Q, e = (E + Q) / 2;
  return i ? (I === E ? C = (g - B) / i + (g < B) * 6 : g === E ? C = (B - I) / i + 2 : C = (I - g) / i + 4, i /= e < 0.5 ? E + Q : 2 - E - Q, C *= 60) : i = e > 0 && e < 1 ? 0 : C, new _A(C, i, e, A.opacity);
}
function Me(A, I, g, B) {
  return arguments.length === 1 ? ZQ(A) : new _A(A, I, g, B ?? 1);
}
function _A(A, I, g, B) {
  this.h = +A, this.s = +I, this.l = +g, this.opacity = +B;
}
PB(_A, Me, VQ(Sg, {
  brighter(A) {
    return A = A == null ? Tg : Math.pow(Tg, A), new _A(this.h, this.s, this.l * A, this.opacity);
  },
  darker(A) {
    return A = A == null ? fg : Math.pow(fg, A), new _A(this.h, this.s, this.l * A, this.opacity);
  },
  rgb() {
    var A = this.h % 360 + (this.h < 0) * 360, I = isNaN(A) || isNaN(this.s) ? 0 : this.s, g = this.l, B = g + (g < 0.5 ? g : 1 - g) * I, Q = 2 * g - B;
    return new pA(
      tB(A >= 240 ? A - 240 : A + 120, Q, B),
      tB(A, Q, B),
      tB(A < 120 ? A + 240 : A - 120, Q, B),
      this.opacity
    );
  },
  clamp() {
    return new _A(pC(this.h), pg(this.s), pg(this.l), _g(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const A = _g(this.opacity);
    return `${A === 1 ? "hsl(" : "hsla("}${pC(this.h)}, ${pg(this.s) * 100}%, ${pg(this.l) * 100}%${A === 1 ? ")" : `, ${A})`}`;
  }
}));
function pC(A) {
  return A = (A || 0) % 360, A < 0 ? A + 360 : A;
}
function pg(A) {
  return Math.max(0, Math.min(1, A || 0));
}
function tB(A, I, g) {
  return (A < 60 ? I + (g - I) * A / 60 : A < 180 ? g : A < 240 ? I + (g - I) * (240 - A) / 60 : I) * 255;
}
const JC = [
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
], Jg = [
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
function jg(A) {
  if (A < 1 && (A = 1), A <= JC.length)
    return JC.slice(0, A);
  if (A <= Jg.length)
    return Jg.slice(0, A);
  {
    let I = [];
    for (let g = 0; g < A; g++)
      I[g] = Jg[g % Jg.length];
    return I;
  }
}
function jB(A) {
  let { r: I, g, b: B, opacity: Q } = XQ(A);
  return { r: I / 255, g: g / 255, b: B / 255, a: Q };
}
let Qg;
function Ue() {
  return Qg == null && (Qg = document.createElement("canvas"), Qg.width = 1, Qg.height = 1), Qg.getContext("2d");
}
function ke(A) {
  let I = Ue();
  I.font = `${A.fontSize ?? 10}px ${A.fontFamily ?? "system-ui"}`;
  let g = A.text.split(`
`).map((Q) => I.measureText(Q).width), B = (A.fontSize ?? 10) * (A.lineSpacing ?? 1) * g.length;
  return {
    width: g.reduce((Q, E) => Math.max(Q, E)),
    height: B
  };
}
function OQ() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
function $B(A, I) {
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
function PQ(A, I) {
  return [
    I[0] * A[0] + I[3] * A[1] + I[6] * A[2],
    I[1] * A[0] + I[4] * A[1] + I[7] * A[2],
    I[2] * A[0] + I[5] * A[1] + I[8] * A[2]
  ];
}
function pe(A) {
  return A[0] * A[4] * A[8] - A[0] * A[5] * A[7] - A[1] * A[3] * A[8] + A[1] * A[5] * A[6] + A[2] * A[3] * A[7] - A[2] * A[4] * A[6];
}
function zQ(A) {
  let I = pe(A);
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
class Wg {
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
    let { x: I, y: g, scale: B } = this.viewport, Q = B, E = B;
    this.width < this.height ? Q *= this.height / this.width : E *= this.width / this.height, this._matrix = [Q, 0, 0, 0, E, 0, -I * Q, -g * E, 1], this._pixel_kx = this._matrix[0] * this.width / 2, this._pixel_bx = (this._matrix[6] + 1) * this.width / 2, this._pixel_ky = -this._matrix[4] * this.height / 2, this._pixel_by = (-this._matrix[7] + 1) * this.height / 2;
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
    let I = this._pixel_kx, g = this._pixel_ky, B = this._pixel_bx, Q = this._pixel_by;
    return (E, C) => ({ x: E * I + B, y: C * g + Q });
  }
  coordinateAtPixelFunction() {
    let I = this._pixel_kx, g = this._pixel_ky, B = this._pixel_bx, Q = this._pixel_by;
    return (E, C) => ({ x: (E - B) / I, y: (C - Q) / g });
  }
}
class dB {
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
let $I = class extends dB {
  _value = null;
  setValue(A) {
    this._value !== A && (this._value = A, this.setNeedsRunDownstream());
  }
  get value() {
    return this.run(), this._value;
  }
};
class jQ extends $I {
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
class Je extends $I {
  fn;
  constructor(I, g) {
    super(g), this.fn = I;
  }
  update() {
    this.setValue(this.fn());
  }
}
class Ye extends $I {
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
class me extends $I {
  parent;
  condition;
  buildTrue;
  buildFalse;
  context = null;
  currentCondition = null;
  currentNode = null;
  constructor(I, g, B, Q) {
    super([g]), this.parent = I, this.condition = g, this.buildTrue = B, this.buildFalse = Q;
  }
  update() {
    (this.currentNode == null || this.currentCondition !== this.condition.value) && (this.currentNode && this.removeInput(this.currentNode), this.context?.destroy(), this.context = new HI(this.parent), this.currentCondition = this.condition.value, this.currentCondition ? this.currentNode = this.buildTrue(this.context) : this.currentNode = this.buildFalse(this.context), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.context?.destroy();
  }
}
class Ke extends $I {
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
        let Q = this.cache.get(B);
        return Q.input.value = B, Q.output.value;
      } else {
        let Q = new HI(this.parent), E = new jQ(B), C = this.build(Q, E);
        return this.cache.set(B, { context: Q, input: E, output: C }), this.addInput(C), C.value;
      }
    });
    for (let [B, Q] of this.cache)
      I.has(B) || (this.cache.delete(B), this.removeInput(Q.output), Q.context.destroy());
    this.setValue(g);
  }
  destroy() {
    super.destroy();
    for (let I of this.cache.values())
      I.context.destroy();
  }
}
class Le extends $I {
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
    let g = new jQ(I);
    return this._nodes.add(g), g;
  }
  /** Creates a derived value. */
  derive(I, g) {
    let B = I.map((E) => E instanceof dB ? E : this.value(E)), Q = new Je(() => g(...B.map((E) => E.value)), B);
    return this._nodes.add(Q), Q;
  }
  /** Creates a stateful derived value. */
  statefulDerive(I, g) {
    let B = I.map((E) => E instanceof dB ? E : this.value(E)), Q = new Ye((E) => g(E, ...B.map((C) => C.value)), B);
    return this._nodes.add(Q), Q;
  }
  /** Creates a true or false dataflow depending on the value of the condition. */
  if(I, g, B) {
    let Q = new me(this, I, g, B);
    return this._nodes.add(Q), Q;
  }
  switch(I, g) {
    let B = new Le(this, I, g);
    return this._nodes.add(B), B;
  }
  map(I, g) {
    let B = new Ke(this, I, g);
    return this._nodes.add(B), B;
  }
  assertNotNull(I) {
    return I;
  }
  subgraph() {
    return new HI(this);
  }
}
function AI(A, I, g, B) {
  if (A.program == null || A.vsSource != g || A.fsSource != B) {
    A.destroy && A.destroy();
    let E = YC(I, I.VERTEX_SHADER, g), C = YC(I, I.FRAGMENT_SHADER, B), i = I.createProgram();
    if (I.attachShader(i, E), I.attachShader(i, C), I.linkProgram(i), !I.getProgramParameter(i, I.LINK_STATUS)) {
      var Q = I.getProgramInfoLog(i);
      throw new Error(`failed to link program: ${Q}, vertex source: ${g}, fragment source: ${B}`);
    }
    A.program = i, A.vsSource = g, A.fsSource = B, A.destroy = () => {
      I.deleteProgram(i), I.deleteShader(E), I.deleteShader(C);
    }, A.uniforms = {};
    for (let e of (g + B).matchAll(/uniform +[0-9a-zA-Z_]+ +([0-9a-zA-Z_]+) *(;|\[)/g)) {
      let t = e[1];
      A.uniforms[t] = I.getUniformLocation(i, t);
    }
  }
  return { program: A.program, uniforms: A.uniforms ?? {} };
}
function YC(A, I, g) {
  let B = A.createShader(I);
  if (A.shaderSource(B, g), A.compileShader(B), !A.getShaderParameter(B, A.COMPILE_STATUS)) {
    var Q = A.getShaderInfoLog(B);
    throw new Error(`failed to compile shader: ${Q}, source: ${g}`);
  }
  return B;
}
function jA(A, I, g, B) {
  if (A.buffer == null) {
    let Q = I.createBuffer();
    A.buffer = Q, A.destroy = () => {
      I.deleteBuffer(Q);
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
function ve(A, I, g, B, Q) {
  const E = {
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
  let [C, i, e] = E[Q][B];
  A.texImage2D(A.TEXTURE_2D, 0, C, I, g, 0, i, e, null), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_MIN_FILTER, A.LINEAR), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_MAG_FILTER, A.LINEAR), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_WRAP_S, A.CLAMP_TO_EDGE), A.texParameteri(A.TEXTURE_2D, A.TEXTURE_WRAP_T, A.CLAMP_TO_EDGE);
}
function sI(A, I, g, B, Q, E) {
  if (A.framebuffer == null || A.texture == null) {
    let i = I.createFramebuffer(), e = I.createTexture();
    I.bindFramebuffer(I.FRAMEBUFFER, i), I.bindTexture(I.TEXTURE_2D, e), I.framebufferTexture2D(I.FRAMEBUFFER, I.COLOR_ATTACHMENT0, I.TEXTURE_2D, e, 0), I.bindTexture(I.TEXTURE_2D, null), I.bindFramebuffer(I.FRAMEBUFFER, null), A.framebuffer = i, A.texture = e, A.destroy = () => {
      I.deleteFramebuffer(i), I.deleteTexture(e);
    };
  }
  let C = `${g},${B},${Q},${E}`;
  return A.cacheKey != C && (A.cacheKey = C, I.bindTexture(I.TEXTURE_2D, A.texture), ve(I, g, B, Q, E), I.bindTexture(I.TEXTURE_2D, null)), {
    framebuffer: A.framebuffer,
    texture: A.texture,
    width: g,
    height: B
  };
}
function He(A) {
  let I = A.squareMaxSize, g = A.samples, B = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, Q = `#version 300 es
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
  `, E = `#version 300 es
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
        ${g.map(({ x: C, y: i, w: e }) => `color -= texture(image, uv + vec2(${C.toFixed(8)}, ${i.toFixed(8)}) / resolution) * (${e.toFixed(8)})`).join(";")};
      }
      outColor = color * scaler;
    }
  `;
  return { vertex: B, fragment1: Q, fragment2: E };
}
function xe(A, I, g) {
  let B = A.derive([g], be), Q = A.derive([B], He), E = A.statefulDerive(
    [I, A.derive([Q], (e) => e.vertex), A.derive([Q], (e) => e.fragment1)],
    AI
  ), C = A.statefulDerive(
    [I, A.derive([Q], (e) => e.vertex), A.derive([Q], (e) => e.fragment2)],
    AI
  ), i = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive(
    [I, i, E, C, g, B],
    (e, t, o, a, s, n) => (h, l, u) => {
      let { width: y, height: f } = l;
      e.disable(e.BLEND), e.enableVertexAttribArray(0), e.bindBuffer(e.ARRAY_BUFFER, t), e.vertexAttribPointer(0, 2, e.FLOAT, !1, 0, 0), e.bindBuffer(e.ARRAY_BUFFER, null), e.useProgram(o.program), e.uniform2f(o.uniforms.resolution, y, f), e.uniform1i(o.uniforms.image, 0), e.bindFramebuffer(e.FRAMEBUFFER, l.framebuffer), e.bindTexture(e.TEXTURE_2D, h), e.uniform2f(o.uniforms.direction, 0, 1), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.bindFramebuffer(e.FRAMEBUFFER, u.framebuffer), e.bindTexture(e.TEXTURE_2D, l.texture), e.uniform2f(o.uniforms.direction, 1, 0), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.bindFramebuffer(e.FRAMEBUFFER, l.framebuffer), e.activeTexture(e.TEXTURE1), e.bindTexture(e.TEXTURE_2D, u.texture), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, h), e.useProgram(a.program), e.uniform2f(a.uniforms.resolution, y, f), e.uniform1i(a.uniforms.image, 0), e.uniform1i(a.uniforms.imageBox, 1);
      let D = 1 / n.totalWeight * s * s * Math.PI;
      e.uniform1f(a.uniforms.scaler, D), e.drawArrays(e.TRIANGLE_STRIP, 0, 4), e.bindFramebuffer(e.FRAMEBUFFER, null), e.useProgram(null), e.activeTexture(e.TEXTURE1), e.bindTexture(e.TEXTURE_2D, null), e.activeTexture(e.TEXTURE0), e.bindTexture(e.TEXTURE_2D, null), e.disableVertexAttribArray(0);
    }
  );
}
function mC(A, I, g) {
  let B = Math.sqrt(I * I + g * g);
  if (B < A - Math.sqrt(2) / 2)
    return 1;
  if (B > A + Math.sqrt(2) / 2)
    return 0;
  let Q = 2, E = 0;
  for (let C = 0; C < Q; C++)
    for (let i = 0; i < Q; i++) {
      let e = I + (C + 0.5) / Q - 0.5, t = g + (i + 0.5) / Q - 0.5;
      Math.sqrt(e * e + t * t) < A && (E += 1);
    }
  return E / Q / Q;
}
function be(A) {
  let I = Math.floor(A + 0.5), g = I, B = mC(A, 0, 0), Q = [];
  for (let i = -I; i <= I; i++)
    for (let e = -I; e <= I; e++) {
      let t = B - mC(A, i, e);
      if (!(t <= 0))
        if (Q.length > 0 && i == Q[Q.length - 1].x && e == Q[Q.length - 1].y + 1) {
          let o = Q[Q.length - 1].w, a = t;
          Q[Q.length - 1].y += 1 - o / (o + a), Q[Q.length - 1].w = o + a;
        } else
          Q.push({ x: i, y: e, w: t });
    }
  Q = Q.sort((i, e) => i.y != e.y ? i.y - e.y : i.x - e.x);
  let E = [];
  for (let { x: i, y: e, w: t } of Q)
    if (E.length > 0 && e == E[E.length - 1].y && i == E[E.length - 1].x + 1) {
      let o = E[E.length - 1].w, a = t;
      E[E.length - 1].x += 1 - o / (o + a), E[E.length - 1].w = o + a;
    } else
      E.push({ x: i, y: e, w: t });
  let C = -E.reduce((i, e) => i + e.w, 0);
  return C += B * (1 + g * 2) * (1 + g * 2), { squareMaxSize: g, squareWeight: B, samples: E, totalWeight: C };
}
function qe(A) {
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
function GB(A, I, g, B, Q, E) {
  let C = Q != null, i = qe(C), e = A.statefulDerive([I, i.vertex, i.fragment], AI);
  return A.derive([I, e, g, B, Q, E], (t, o, a, s, n, h) => (l) => {
    t.enable(t.BLEND), t.blendFunc(t.ONE, t.ONE), t.useProgram(o.program), t.enableVertexAttribArray(0), t.bindBuffer(t.ARRAY_BUFFER, a), t.vertexAttribPointer(0, 1, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(1), t.bindBuffer(t.ARRAY_BUFFER, s), t.vertexAttribPointer(1, 1, t.FLOAT, !1, 0, 0), n != null && (t.enableVertexAttribArray(2), t.bindBuffer(t.ARRAY_BUFFER, n), t.vertexAttribIPointer(2, 1, t.BYTE, 0, 0)), t.bindBuffer(t.ARRAY_BUFFER, null), t.uniformMatrix3fv(o.uniforms.matrix, !1, l), t.drawArrays(t.POINTS, 0, h), t.disableVertexAttribArray(0), t.disableVertexAttribArray(1), n != null && t.disableVertexAttribArray(2), t.useProgram(null);
  });
}
function Te() {
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
function $Q(A, I) {
  let { vertex: g, fragment: B } = Te(), Q = A.statefulDerive([I, g, B], AI), E = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive([I, Q, E], (C, i, e) => (t, o, a, s) => {
    C.disable(C.BLEND), C.enableVertexAttribArray(0), C.bindBuffer(C.ARRAY_BUFFER, e), C.vertexAttribPointer(0, 2, C.FLOAT, !1, 0, 0), C.bindBuffer(C.ARRAY_BUFFER, null), C.bindTexture(C.TEXTURE_2D, t), C.useProgram(i.program), C.uniform1i(i.uniforms.source, 0), C.uniform2f(i.uniforms.xyScaler, a ?? 1, s ?? 1), C.uniform1f(i.uniforms.gamma, o ?? 2.2), C.drawArrays(C.TRIANGLE_STRIP, 0, 4), C.useProgram(null), C.bindTexture(C.TEXTURE_2D, null), C.disableVertexAttribArray(0);
  });
}
function AE(A) {
  return Math.ceil(A * 3);
}
function _e(A) {
  let I = AE(A), g = [];
  for (let i = -I; i <= I; i++)
    g.push(Math.exp(-i * i / A / A / 2));
  let B = g.reduce((i, e) => i + e, 0);
  g = g.map((i) => i / B);
  let Q = Ve(g).map(([i, e]) => [i - I, e]), E = `#version 300 es
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
      ${Q.map(([i, e]) => `color += texture(image, uv + direction * vec2(${i.toFixed(10)}) / resolution) * ${e.toFixed(10)};`).join(`
`)}
      outColor = color;
    }
  `;
  return { vertex: E, fragment: C };
}
function We(A, I, g) {
  let B = A.derive([g], _e), Q = A.statefulDerive(
    [I, A.derive([B], (C) => C.vertex), A.derive([B], (C) => C.fragment)],
    AI
  ), E = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive([I, E, Q, g], (C, i, e, t) => (o, a, s) => {
    let { width: n, height: h } = a;
    C.disable(C.BLEND), C.enableVertexAttribArray(0), C.bindBuffer(C.ARRAY_BUFFER, i), C.vertexAttribPointer(0, 2, C.FLOAT, !1, 0, 0), C.bindBuffer(C.ARRAY_BUFFER, null), C.useProgram(e.program), C.uniform2f(e.uniforms.resolution, n, h), C.uniform1i(e.uniforms.image, 0), C.bindFramebuffer(C.FRAMEBUFFER, s.framebuffer), C.bindTexture(C.TEXTURE_2D, o), C.uniform2f(e.uniforms.direction, 0, 1), C.drawArrays(C.TRIANGLE_STRIP, 0, 4), C.bindFramebuffer(C.FRAMEBUFFER, a.framebuffer), C.bindTexture(C.TEXTURE_2D, s.texture), C.uniform2f(e.uniforms.direction, 1, 0), C.drawArrays(C.TRIANGLE_STRIP, 0, 4), C.bindFramebuffer(C.FRAMEBUFFER, null), C.useProgram(null), C.bindTexture(C.TEXTURE_2D, null), C.disableVertexAttribArray(0);
  });
}
function Ve(A) {
  let I = [];
  for (let g = 0; g < A.length; g += 2)
    if (g + 1 < A.length) {
      let B = A[g], Q = A[g + 1], E = 1 - B / (B + Q);
      if (E >= 0 && E <= 1) {
        let C = B + Q;
        C != 0 && I.push([g + E, C]);
      } else
        I.push([g, A[g]]), I.push([g + 1, A[g + 1]]);
    } else
      I.push([g, A[g]]);
  return I;
}
function Xe(A) {
  return Math.ceil(A * 3);
}
function Ze() {
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
function Oe(A, I, g) {
  let { vertex: B, fragment: Q } = Ze(), E = A.statefulDerive([I, B, Q], AI), C = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive([I, C, E], (i, e, t) => (o, a, s) => {
    let { width: n, height: h } = a;
    i.disable(i.BLEND), i.enableVertexAttribArray(0), i.bindBuffer(i.ARRAY_BUFFER, e), i.vertexAttribPointer(0, 2, i.FLOAT, !1, 0, 0), i.bindBuffer(i.ARRAY_BUFFER, null), i.useProgram(t.program), i.uniform2f(t.uniforms.resolution, n, h), i.uniform1i(t.uniforms.image, 0);
    let l = o, u = s, y = a;
    for (let f = 0; f < 2; f++) {
      i.uniform2f(t.uniforms.direction, f, 1 - f);
      for (let [D, G, F] of Pe) {
        i.bindFramebuffer(i.FRAMEBUFFER, u.framebuffer), i.bindTexture(i.TEXTURE_2D, l), i.uniform1fv(t.uniforms.weight0, G), i.uniform3fv(t.uniforms.distances, D), i.uniform3fv(t.uniforms.weights, F), i.drawArrays(i.TRIANGLE_STRIP, 0, 4), l = u.texture;
        let S = u;
        u = y, y = S;
      }
    }
    i.bindFramebuffer(i.FRAMEBUFFER, null), i.useProgram(null), i.bindTexture(i.TEXTURE_2D, null), i.disableVertexAttribArray(0);
  });
}
const Pe = [
  [[1, 2, 3], [0.2288468365182578], [0.18230006506971572, 0.1356122230111784, 0.06766429365997693]],
  [[2, 6, 10], [0.09116254014100238], [0.23317759354726447, 0.18385867277788717, 0.03738246360434722]],
  [[3, 10, 20], [0.2950645715317288], [0.010918865853671198, 0.23773695670296047, 0.10381189167750389]],
  [[4, 16, 30], [0.20085957073474772], [0.14463019087130788, 0.17934533765938643, 0.07559468610193185]]
];
function ze() {
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
function je(A, I) {
  let { vertex: g, fragment: B } = ze(), Q = A.statefulDerive([I, g, B], AI), E = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive(
    [I, Q, E],
    (C, i, e) => (t, o, a, s, n, h) => {
      C.enable(C.BLEND), C.blendFunc(C.ONE, C.ONE_MINUS_SRC_ALPHA), C.enableVertexAttribArray(0), C.bindBuffer(C.ARRAY_BUFFER, e), C.vertexAttribPointer(0, 2, C.FLOAT, !1, 0, 0), C.bindBuffer(C.ARRAY_BUFFER, null), C.bindTexture(C.TEXTURE_2D, t.texture), C.useProgram(i.program), C.uniform1i(i.uniforms.source, 0), C.uniform2f(i.uniforms.resolution, t.width, t.height), C.uniform1f(i.uniforms.densityScaler, o), C.uniform1f(i.uniforms.quantizationStep, a), C.uniform1f(i.uniforms.globalAlpha, s), C.uniform4fv(i.uniforms.channelMask, n), C.uniform4fv(i.uniforms.color, h), C.drawArrays(C.TRIANGLE_STRIP, 0, 4), C.useProgram(null), C.bindTexture(C.TEXTURE_2D, null), C.disableVertexAttribArray(0);
    }
  );
}
function $e() {
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
  let { vertex: g, fragment: B } = $e(), Q = A.statefulDerive([I, g, B], AI), E = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive(
    [I, Q, E],
    (C, i, e) => (t, o, a, s, n, h) => {
      C.enable(C.BLEND), C.blendFunc(C.ONE, C.ONE_MINUS_SRC_ALPHA), C.enableVertexAttribArray(0), C.bindBuffer(C.ARRAY_BUFFER, e), C.vertexAttribPointer(0, 2, C.FLOAT, !1, 0, 0), C.bindBuffer(C.ARRAY_BUFFER, null), C.bindTexture(C.TEXTURE_2D, t.texture), C.useProgram(i.program), C.uniform1i(i.uniforms.source, 0), C.uniform2f(i.uniforms.resolution, t.width, t.height), C.uniform1f(i.uniforms.densityScaler, o), C.uniform1f(i.uniforms.quantizationStep, a), C.uniform1f(i.uniforms.globalAlpha, s), C.uniform1i(i.uniforms.isDarkMode, h == "dark" ? 1 : 0), C.uniformMatrix4fv(i.uniforms.colorMatrix, !1, n), C.drawArrays(C.TRIANGLE_STRIP, 0, 4), C.useProgram(null), C.bindTexture(C.TEXTURE_2D, null), C.disableVertexAttribArray(0);
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
function KC(A, I, g, B, Q, E) {
  let C = Q != null, i = It(C), e = A.statefulDerive([I, i.vertex, i.fragment], AI);
  return A.derive(
    [I, e, g, B, Q, E],
    (t, o, a, s, n, h) => (l, u, y, f) => {
      t.enable(t.BLEND), t.blendFunc(t.ONE, t.ONE_MINUS_SRC_ALPHA), t.useProgram(o.program), t.enableVertexAttribArray(0), t.bindBuffer(t.ARRAY_BUFFER, a), t.vertexAttribPointer(0, 1, t.FLOAT, !1, 0, 0), t.enableVertexAttribArray(1), t.bindBuffer(t.ARRAY_BUFFER, s), t.vertexAttribPointer(1, 1, t.FLOAT, !1, 0, 0), n != null && (t.enableVertexAttribArray(2), t.bindBuffer(t.ARRAY_BUFFER, n), t.vertexAttribIPointer(2, 1, t.BYTE, 0, 0)), t.bindBuffer(t.ARRAY_BUFFER, null), t.uniformMatrix3fv(o.uniforms.matrix, !1, l), t.uniform1f(o.uniforms.point_size, u * 2), t.uniform1f(o.uniforms.alpha, y), C ? t.uniform4fv(o.uniforms.colorScheme, f) : t.uniform4fv(o.uniforms.colorScheme, f.slice(0, 4)), t.drawArrays(t.POINTS, 0, h), t.disableVertexAttribArray(0), t.disableVertexAttribArray(1), n != null && t.disableVertexAttribArray(2), t.useProgram(null);
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
  let { vertex: g, fragment: B } = gt(), Q = A.statefulDerive([I, g, B], AI), E = A.statefulDerive([I, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], jA);
  return A.derive(
    [I, Q, E],
    (C, i, e) => (t, o, a, s, n) => {
      C.enable(C.BLEND), C.blendFunc(C.ONE, C.ONE_MINUS_SRC_ALPHA), C.enableVertexAttribArray(0), C.bindBuffer(C.ARRAY_BUFFER, e), C.vertexAttribPointer(0, 2, C.FLOAT, !1, 0, 0), C.bindBuffer(C.ARRAY_BUFFER, null), C.bindTexture(C.TEXTURE_2D, t.texture), C.useProgram(i.program), C.uniform1i(i.uniforms.source, 0), C.uniform2f(i.uniforms.resolution, t.width, t.height), C.uniform1f(i.uniforms.pointAlpha, o), C.uniform1f(i.uniforms.globalAlpha, a), C.uniform1i(i.uniforms.isDarkMode, n == "dark" ? 1 : 0), C.uniformMatrix4fv(i.uniforms.colorMatrix, !1, s), C.drawArrays(C.TRIANGLE_STRIP, 0, 4), C.useProgram(null), C.bindTexture(C.TEXTURE_2D, null), C.disableVertexAttribArray(0);
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
    }, this.viewport = new Wg({ x: 0, y: 0, scale: 1 }, g, B);
    let Q = new HI(), E = Q.value(I);
    this.df = Q, this.gl = E, this.renderInputs = {
      mode: Q.value(this.props.mode),
      colorScheme: Q.value(this.props.colorScheme),
      xData: Q.value(this.props.x),
      yData: Q.value(this.props.y),
      categoryData: Q.value(this.props.category),
      categoryCount: Q.value(this.props.categoryCount),
      matrix: Q.value(OQ()),
      width: Q.value(g),
      height: Q.value(B),
      pointSize: Q.value(this.props.pointSize),
      densityBandwidth: Q.value(this.props.densityBandwidth)
    }, this.dataBuffers = Qt(Q, E, this.renderInputs), this.renderer = Et(Q, E, this.renderInputs, this.dataBuffers);
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
  async densityMap(I, g, B, Q) {
    let E = this.df.subgraph(), C = tt(E, this.gl, this.dataBuffers, E.value(I), E.value(g), E.value(B)), { x: i, y: e, scale: t } = Q, o = [t, 0, 0, 0, t, 0, -i * t, -e * t, 1], a = C.value(o), s = zQ(o);
    return E.destroy(), {
      data: a,
      width: I,
      height: g,
      coordinateAtPixel: (n, h) => {
        let l = n / I * 2 - 1, u = h / g * 2 - 1, y = PQ([l, u, 1], s);
        return { x: y[0], y: y[1] };
      }
    };
  }
}
function Qt(A, I, g) {
  const B = A.statefulDerive([I, g.xData, "f32"], jA), Q = A.statefulDerive([I, g.yData, "f32"], jA), E = A.if(
    A.derive([g.categoryData], (i) => i != null),
    (i) => i.statefulDerive([I, i.assertNotNull(g.categoryData), "u8"], jA),
    (i) => i.value(null)
  ), C = A.derive([g.xData], (i) => i.length);
  return { x: B, y: Q, category: E, count: C };
}
function Et(A, I, g, B) {
  return A.switch(g.mode, {
    points: (Q) => it(Q, I, g, B),
    density: (Q) => et(Q, I, g, B)
  });
}
function it(A, I, g, B) {
  const Q = A.derive([g.categoryCount], (e) => e > 1), E = A.statefulDerive([I, g.width, g.height, 4, "f32"], sI);
  let C = A.if(
    Q,
    (e) => KC(e, I, B.x, B.y, e.assertNotNull(B.category), B.count),
    (e) => KC(e, I, B.x, B.y, null, B.count)
  ), i = $Q(A, I);
  return A.derive(
    [I, E, C, i, g.colorScheme, g.matrix, g.categoryCount],
    (e, t, o, a, s, n, h) => (l) => {
      let u = [], y = l.categoryColors ?? jg(l.categoryCount);
      for (let f = 0; f < h; f++)
        if (f < y.length) {
          let { r: D, g: G, b: F } = jB(y[f]);
          D = Math.pow(D, l.gamma), G = Math.pow(G, l.gamma), F = Math.pow(F, l.gamma), u = u.concat([D, G, F, 1]);
        } else
          u = u.concat([0.5, 0.5, 0.5, 1]);
      e.bindFramebuffer(e.FRAMEBUFFER, t.framebuffer), e.viewport(0, 0, t.width, t.height), s == "light" ? e.clearColor(1, 1, 1, 1) : e.clearColor(0, 0, 0, 1), e.clear(e.COLOR_BUFFER_BIT), o(n, Math.max(3, l.pointSize), l.pointAlpha * l.pointsAlpha, u), e.bindFramebuffer(e.FRAMEBUFFER, null), e.viewport(0, 0, l.width, l.height), a(t.texture, l.gamma);
    }
  );
}
function et(A, I, g, B) {
  let Q = A.derive([g.densityBandwidth], (D) => Xe(D) + 1), E = A.derive([g.width, Q], (D, G) => D + G * 2), C = A.derive([g.height, Q], (D, G) => D + G * 2);
  const i = A.derive([g.categoryCount], (D) => D > 1), e = A.statefulDerive([I, E, C, 4, "f32"], sI), t = A.statefulDerive([I, E, C, 4, "f32"], sI), o = A.statefulDerive([I, E, C, 4, "f32"], sI), a = A.statefulDerive([I, E, C, 4, "f32"], sI);
  let s = A.if(
    i,
    (D) => GB(D, I, B.x, B.y, D.assertNotNull(B.category), B.count),
    (D) => GB(D, I, B.x, B.y, null, B.count)
  ), n = xe(A, I, g.pointSize), h = Oe(A, I, g.densityBandwidth), l = Bt(A, I), u = At(A, I), y = je(A, I), f = $Q(A, I);
  return A.derive(
    [
      I,
      e,
      t,
      o,
      a,
      g.colorScheme,
      g.matrix,
      s,
      n,
      h,
      l,
      u,
      y,
      f
    ],
    (D, G, F, S, M, _, m, eA, BA, T, tA, O, CA, z) => (Y) => {
      let aA = Y.categoryColors ?? jg(Y.categoryCount), P = [];
      for (let oA = 0; oA < 4; oA++)
        if (oA < aA.length) {
          let { r: fA, g: YA, b: cA } = jB(aA[oA]);
          fA = Math.pow(fA, Y.gamma), YA = Math.pow(YA, Y.gamma), cA = Math.pow(cA, Y.gamma), P = P.concat([fA, YA, cA, 1]);
        } else
          P = P.concat([0.5, 0.5, 0.5, 1]);
      let b = Y.width / F.width, QA = Y.height / F.height, SA = $B([b, 0, 0, 0, QA, 0, 0, 0, 1], m);
      if (D.bindFramebuffer(D.FRAMEBUFFER, G.framebuffer), D.viewport(0, 0, G.width, G.height), D.clearColor(0, 0, 0, 0), D.clear(D.COLOR_BUFFER_BIT), eA(SA), D.bindFramebuffer(D.FRAMEBUFFER, F.framebuffer), D.viewport(0, 0, F.width, F.height), _ == "light" ? D.clearColor(1, 1, 1, 1) : D.clearColor(0, 0, 0, 1), D.clear(D.COLOR_BUFFER_BIT), Y.pointAlpha > 0 && Y.pointsAlpha > 0 && (BA(G.texture, S, M), D.bindFramebuffer(D.FRAMEBUFFER, F.framebuffer), tA(S, Y.pointAlpha, Y.pointsAlpha, P, _)), Y.densityScaler > 0 && (Y.densityAlpha > 0 || Y.contoursAlpha > 0) && (T(G.texture, S, M), D.bindFramebuffer(D.FRAMEBUFFER, F.framebuffer), Y.densityAlpha > 0 && O(
        S,
        Y.densityScaler,
        Y.densityQuantizationStep,
        Y.densityAlpha,
        P,
        _
      ), Y.contoursAlpha > 0))
        for (let oA = 0; oA < aA.length; oA++) {
          let fA = [0, 0, 0, 0];
          fA[oA] = 1, CA(
            S,
            Y.densityScaler,
            Y.densityQuantizationStep,
            Y.contoursAlpha,
            fA,
            P.slice(oA * 4, oA * 4 + 4)
          );
        }
      D.bindFramebuffer(D.FRAMEBUFFER, null), D.viewport(0, 0, Y.width, Y.height), z(F.texture, Y.gamma, 1 / b, 1 / QA);
    }
  );
}
function tt(A, I, g, B, Q, E) {
  let C = A.derive([E], (h) => AE(h) + 1), i = A.derive([B, C], (h, l) => h + l * 2), e = A.derive([Q, C], (h, l) => h + l * 2);
  const t = A.statefulDerive([I, i, e, 1, "f32"], sI), o = A.statefulDerive([I, i, e, 1, "f32"], sI), a = A.statefulDerive([I, i, e, 1, "f32"], sI);
  let s = GB(A, I, g.x, g.y, null, g.count), n = We(A, I, E);
  return A.derive(
    [I, C, B, Q, t, o, a, s, n],
    (h, l, u, y, f, D, G, F, S) => (M) => {
      let _ = u / f.width, m = y / f.height, eA = $B([_, 0, 0, 0, m, 0, 0, 0, 1], M);
      h.bindFramebuffer(h.FRAMEBUFFER, f.framebuffer), h.viewport(0, 0, f.width, f.height), h.clearColor(0, 0, 0, 0), h.clear(h.COLOR_BUFFER_BIT), F(eA), S(f.texture, D, G), h.bindFramebuffer(h.FRAMEBUFFER, D.framebuffer);
      let BA = new Float32Array(u * y);
      return h.readPixels(l, l, u, y, h.RED, h.FLOAT, BA), h.bindFramebuffer(h.FRAMEBUFFER, null), BA;
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
  vec4f(I, g, B, Q) {
    this.align4(), this.f32View[this.offset++] = I, this.f32View[this.offset++] = g, this.f32View[this.offset++] = B, this.f32View[this.offset++] = Q;
  }
  mat3x3f(I) {
    this.vec3f(I[0], I[1], I[2]), this.vec3f(I[3], I[4], I[5]), this.vec3f(I[6], I[7], I[8]);
  }
  byteOffset() {
    return this.offset * 4;
  }
}
function rt(A, I) {
  let g = new ArrayBuffer(4288), B = A.statefulDerive(
    [I, 4288, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX],
    _I
  );
  return {
    buffer: B,
    update: A.derive([I, B], (Q, E) => (C) => {
      let i = new ot(g);
      i.u32(C.count), i.u32(C.category_count), i.i32(C.framebuffer_width), i.i32(C.framebuffer_height), i.i32(C.density_width), i.i32(C.density_height), i.f32(C.gamma), i.f32(C.point_size), i.f32(C.point_alpha), i.f32(C.points_alpha), i.f32(C.density_scaler), i.f32(C.quantization_step), i.f32(C.density_alpha), i.f32(C.contours_alpha), i.mat3x3f(C.matrix), i.vec2f(...C.view_xy_scaler), i.vec4f(...C.kde_causal), i.vec4f(...C.kde_anticausal), i.vec4f(...C.kde_a), i.vec4f(...C.background_color);
      let e = C.gamma;
      for (let t = 0; t < Math.min(C.category_colors.length, 256); t++) {
        let { r: o, g: a, b: s, a: n } = C.category_colors[t];
        o = Math.pow(o, e), a = Math.pow(a, e), s = Math.pow(s, e), i.vec4f(o, a, s, n);
      }
      Q.queue.writeBuffer(E, 0, g, 0, i.byteOffset());
    })
  };
}
const oB = 64, rB = 64;
function IE(A, I, g, B, Q, E) {
  let C = A.derive(
    [I, g, B.layouts],
    (i, e, t) => i.createComputePipeline({
      layout: i.createPipelineLayout({ bindGroupLayouts: [t.group0, t.group1, t.group2A] }),
      compute: { module: e, entryPoint: "accumulate" }
    })
  );
  return A.derive(
    [
      C,
      B.group0,
      B.group1,
      B.group2A,
      E.countBuffer,
      Q.count
    ],
    (i, e, t, o, a, s) => (n) => {
      if (n.clearBuffer(a), s == 0)
        return;
      let h = n.beginComputePass();
      h.setPipeline(i), h.setBindGroup(0, e), h.setBindGroup(1, t), h.setBindGroup(2, o), s <= oB * rB ? h.dispatchWorkgroups(Math.ceil(s / oB)) : h.dispatchWorkgroups(rB, Math.ceil(s / (oB * rB))), h.end();
    }
  );
}
function nt(A) {
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
function gE(A, I, g, B, Q) {
  let E = A.derive([I], (a) => nt(a)), C = A.derive(
    [I, E, g],
    (a, s, n) => a.createBindGroup({
      layout: s.group0,
      entries: [{ binding: 0, resource: { buffer: n } }]
    })
  ), i = A.derive(
    [I, E, B.x, B.y, B.category],
    (a, s, n, h, l) => a.createBindGroup({
      layout: s.group1,
      entries: [
        { binding: 0, resource: { buffer: n } },
        { binding: 1, resource: { buffer: h } },
        { binding: 2, resource: { buffer: l ?? n } }
      ]
    })
  ), e = A.derive(
    [I, E, Q.countBuffer, Q.blurBuffer],
    (a, s, n, h) => a.createBindGroup({
      layout: s.group2A,
      entries: [{ binding: 0, resource: { buffer: n } }]
    })
  ), t = A.derive(
    [I, E, Q.countBuffer, Q.blurBuffer],
    (a, s, n, h) => a.createBindGroup({
      layout: s.group2B,
      entries: [
        { binding: 1, resource: { buffer: n } },
        { binding: 2, resource: { buffer: h } }
      ]
    })
  ), o = A.derive(
    [I, E, Q.colorTexture, Q.alphaTexture],
    (a, s, n, h) => a.createBindGroup({
      layout: s.group3,
      entries: [
        { binding: 0, resource: a.createSampler({}) },
        { binding: 1, resource: n.createView() },
        { binding: 2, resource: h.createView() }
      ]
    })
  );
  return {
    layouts: E,
    group0: C,
    group1: i,
    group2A: e,
    group2B: t,
    group3: o
  };
}
function at(A, I, g, B, Q) {
  const E = A.derive(
    [I, g, B.layouts],
    (C, i, e) => C.createRenderPipeline({
      layout: C.createPipelineLayout({
        bindGroupLayouts: [e.group0, e.group1, e.group2B]
      }),
      vertex: { entryPoint: "draw_density_map_vs", module: i },
      fragment: {
        entryPoint: "draw_density_map_fs",
        module: i,
        targets: [
          {
            format: Q.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          },
          {
            format: Q.alphaTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          }
        ]
      },
      primitive: { topology: "triangle-strip" }
    })
  );
  return A.derive(
    [
      E,
      B.group0,
      B.group1,
      B.group2B,
      Q.colorTexture,
      Q.alphaTexture
    ],
    (C, i, e, t, o, a) => (s) => {
      let n = s.beginRenderPass({
        colorAttachments: [
          { loadOp: "load", storeOp: "store", view: o.createView() },
          { loadOp: "load", storeOp: "store", view: a.createView() }
        ]
      });
      n.setPipeline(C), n.setBindGroup(0, i), n.setBindGroup(1, e), n.setBindGroup(2, t), n.draw(4), n.end();
    }
  );
}
function st(A, I, g, B, Q, E) {
  const C = A.derive(
    [I, g, B.layouts],
    (i, e, t) => i.createRenderPipeline({
      layout: i.createPipelineLayout({ bindGroupLayouts: [t.group0, t.group1] }),
      vertex: { entryPoint: "points_vs", module: e },
      fragment: {
        entryPoint: "points_fs",
        module: e,
        targets: [
          {
            format: E.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          },
          {
            format: E.alphaTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          }
        ]
      },
      primitive: { topology: "triangle-strip" }
    })
  );
  return A.derive(
    [
      C,
      B.group0,
      B.group1,
      Q.count,
      E.colorTexture,
      E.alphaTexture
    ],
    (i, e, t, o, a, s) => (n) => {
      let h = n.beginRenderPass({
        colorAttachments: [
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: a.createView() },
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: s.createView() }
        ]
      });
      h.setPipeline(i), h.setBindGroup(0, e), h.setBindGroup(1, t), o > 0 && h.draw(4, o), h.end();
    }
  );
}
function ht(A, I, g, B, Q) {
  const E = A.derive(
    [I, g, Q.layouts],
    (C, i, e) => C.createRenderPipeline({
      layout: C.createPipelineLayout({
        bindGroupLayouts: [e.group0, e.group1, e.group2B, e.group3]
      }),
      vertex: { entryPoint: "gamma_correction_vs", module: i },
      fragment: { entryPoint: "gamma_correction_fs", module: i, targets: [{ format: B }] },
      primitive: { topology: "triangle-strip" }
    })
  );
  return A.derive(
    [E, Q.group0, Q.group1, Q.group2B, Q.group3],
    (C, i, e, t, o) => (a, s) => {
      let n = a.beginRenderPass({
        colorAttachments: [{ clearValue: [1, 1, 1, 1], loadOp: "clear", storeOp: "store", view: s }]
      });
      n.setPipeline(C), n.setBindGroup(0, i), n.setBindGroup(1, e), n.setBindGroup(2, t), n.setBindGroup(3, o), n.draw(4), n.end();
    }
  );
}
const LC = 64;
function BE(A, I, g, B, Q, E, C) {
  let i = A.derive(
    [I, g, B.layouts],
    (t, o, a) => t.createComputePipeline({
      layout: t.createPipelineLayout({
        bindGroupLayouts: [a.group0, a.group1, a.group2B, a.group3]
      }),
      compute: { module: o, entryPoint: "gaussian_blur_stage_1" }
    })
  ), e = A.derive(
    [I, g, B.layouts],
    (t, o, a) => t.createComputePipeline({
      layout: t.createPipelineLayout({
        bindGroupLayouts: [a.group0, a.group1, a.group2B, a.group3]
      }),
      compute: { module: o, entryPoint: "gaussian_blur_stage_2" }
    })
  );
  return A.derive(
    [
      i,
      e,
      B.group0,
      B.group1,
      B.group2B,
      B.group3,
      Q,
      E,
      C
    ],
    (t, o, a, s, n, h, l, u, y) => (f) => {
      let D = f.beginComputePass();
      D.setBindGroup(0, a), D.setBindGroup(1, s), D.setBindGroup(2, n), D.setBindGroup(3, h), D.setPipeline(t), D.dispatchWorkgroups(Math.ceil(l / LC), y), D.setPipeline(o), D.dispatchWorkgroups(Math.ceil(u / LC), y), D.end();
    }
  );
}
function lt(A, I = !1) {
  const g = new Float64Array(5), B = new Float64Array(4);
  Dt(g, B, A);
  const Q = Float64Array.of(
    0,
    B[1] - g[1] * B[0],
    B[2] - g[2] * B[0],
    B[3] - g[3] * B[0],
    -g[4] * B[0]
  ), E = 1 + g[1] + g[2] + g[3] + g[4], C = (B[0] + B[1] + B[2] + B[3]) / E, i = (Q[1] + Q[2] + Q[3] + Q[4]) / E;
  return {
    sigma: A,
    negative: I,
    a: g,
    b_causal: B,
    b_anticausal: Q,
    sum_causal: C,
    sum_anticausal: i
  };
}
function Dt(A, I, g) {
  const B = Float64Array.of(
    0.84,
    1.8675,
    0.84,
    -1.8675,
    -0.34015,
    -0.1299,
    -0.34015,
    0.1299
  ), Q = Math.exp(-1.783 / g), E = Math.exp(-1.723 / g), C = 0.6318 / g, i = 1.997 / g, e = Float64Array.of(
    -Q * Math.cos(C),
    Q * Math.sin(C),
    -Q * Math.cos(-C),
    Q * Math.sin(-C),
    -E * Math.cos(i),
    E * Math.sin(i),
    -E * Math.cos(-i),
    E * Math.sin(-i)
  ), t = g * 2.5066282746310007, o = Float64Array.of(B[0], B[1], 0, 0, 0, 0, 0, 0), a = Float64Array.of(1, 0, e[0], e[1], 0, 0, 0, 0, 0, 0);
  let s, n;
  for (n = 2; n < 8; n += 2) {
    for (o[n] = e[n] * o[n - 2] - e[n + 1] * o[n - 1], o[n + 1] = e[n] * o[n - 1] + e[n + 1] * o[n - 2], s = n - 2; s > 0; s -= 2)
      o[s] += e[n] * o[s - 2] - e[n + 1] * o[s - 1], o[s + 1] += e[n] * o[s - 1] + e[n + 1] * o[s - 2];
    for (s = 0; s <= n; s += 2)
      o[s] += B[n] * a[s] - B[n + 1] * a[s + 1], o[s + 1] += B[n] * a[s + 1] + B[n + 1] * a[s];
    for (a[n + 2] = e[n] * a[n] - e[n + 1] * a[n + 1], a[n + 3] = e[n] * a[n + 1] + e[n + 1] * a[n], s = n; s > 0; s -= 2)
      a[s] += e[n] * a[s - 2] - e[n + 1] * a[s - 1], a[s + 1] += e[n] * a[s - 1] + e[n + 1] * a[s - 2];
  }
  for (n = 0; n < 4; ++n)
    s = n << 1, I[n] = o[s] / t, A[n + 1] = a[s + 2];
}
function CE(A) {
  let I = lt(A);
  return {
    kde_causal: [I.b_causal[0], I.b_causal[1], I.b_causal[2], I.b_causal[3]],
    kde_anticausal: [I.b_anticausal[1], I.b_anticausal[2], I.b_anticausal[3], I.b_anticausal[4]],
    kde_a: [I.a[1], I.a[2], I.a[3], I.a[4]]
  };
}
const ct = `// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

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
  constructor(I, g, B, Q, E) {
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
      width: Q,
      height: E
    }, this.viewport = new Wg({ x: 0, y: 0, scale: 1 }, Q, E), this.df = new HI();
    let C = this.df;
    this.renderInputs = {
      mode: C.value(this.props.mode),
      colorScheme: C.value(this.props.colorScheme),
      xData: C.value(this.props.x),
      yData: C.value(this.props.y),
      categoryData: C.value(this.props.category),
      categoryCount: C.value(this.props.categoryCount),
      categoryColors: C.value(this.props.categoryColors),
      matrix: C.value(OQ()),
      width: C.value(Q),
      height: C.value(E),
      pointSize: C.value(this.props.pointSize),
      densityBandwidth: C.value(this.props.densityBandwidth)
    }, this.device = C.value(g), this.dataBuffers = wt(C, this.device, this.renderInputs), this.module = C.derive([this.device], (i) => i.createShaderModule({ code: ct })), this.uniforms = rt(C, this.device), this.renderer = yt(
      C,
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
  async densityMap(I, g, B, Q) {
    let E = this.df.subgraph(), { x: C, y: i, scale: e } = Q, t = [e, 0, 0, 0, e, 0, -C * e, -i * e, 1], o = zQ(t), a = await ft(
      E,
      this.device,
      this.module,
      this.uniforms,
      E.value(I),
      E.value(g),
      E.value(B),
      E.value(t),
      this.dataBuffers
    ).value();
    return E.destroy(), {
      data: a,
      width: I,
      height: g,
      coordinateAtPixel: (s, n) => {
        let h = s / I * 2 - 1, l = n / g * 2 - 1, u = PQ([h, l, 1], o);
        return { x: u[0], y: u[1] };
      }
    };
  }
}
function wt(A, I, g) {
  let B = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  const Q = A.derive([g.xData], (o) => o.length), E = A.derive([Q], (o) => o * 4), C = Q, i = A.statefulDerive(
    [I, A.statefulDerive([I, E, B], _I), g.xData],
    IB
  ), e = A.statefulDerive(
    [I, A.statefulDerive([I, E, B], _I), g.yData],
    IB
  ), t = A.statefulDerive(
    [I, A.statefulDerive([I, C, B], _I), g.categoryData],
    IB
  );
  return { x: i, y: e, category: t, count: Q };
}
function QE(A, I, g, B, Q, E, C) {
  let i = "rgba16float", e = "r16float", t = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, o = A.statefulDerive(
    [I, g, B, i, t],
    oC
  ), a = A.statefulDerive(
    [I, g, B, e, t],
    oC
  ), s = A.derive(
    [Q, E, C],
    (u, y, f) => u * y * f * 4
    // w * h * categoryCount * sizeof(uint32)
  ), n = A.derive(
    [Q, E, C],
    (u, y, f) => u * y * f * 2
    // w * h * categoryCount * sizeof(f16)
  ), h = A.statefulDerive(
    [I, s, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC],
    _I
  ), l = A.statefulDerive([I, n, GPUBufferUsage.STORAGE], _I);
  return {
    colorTexture: o,
    alphaTexture: a,
    colorTextureFormat: i,
    alphaTextureFormat: e,
    countBuffer: h,
    blurBuffer: l
  };
}
function yt(A, I, g, B, Q, E, C) {
  let i = A.derive([E.densityBandwidth], (F) => Math.ceil(F * 3) + 1), e = A.derive([E.width, i], (F, S) => F + S * 2), t = A.derive([E.height, i], (F, S) => F + S * 2), o = A.derive([e], (F) => Math.ceil(F / 4)), a = A.derive([t], (F) => Math.ceil(F / 4)), s = QE(
    A,
    I,
    e,
    t,
    o,
    a,
    E.categoryCount
  ), n = gE(A, I, B.buffer, C, s), h = IE(A, I, g, n, C, s), l = st(A, I, g, n, C, s), u = at(A, I, g, n, s), y = ht(A, I, g, Q, n), f = BE(A, I, g, n, e, t, E.categoryCount), D = A.derive(
    [E.densityBandwidth, e, o],
    (F, S, M) => CE(F / S * M)
  ), G = A.derive(
    [E.categoryColors, E.categoryCount],
    (F, S) => (F == null && (F = jg(S)), F.map((M) => jB(M)))
  );
  return A.derive(
    [
      I,
      e,
      t,
      o,
      a,
      B.update,
      C.count,
      E.matrix,
      G,
      l,
      y,
      h,
      f,
      u,
      D
    ],
    (F, S, M, _, m, eA, BA, T, tA, O, CA, z, Y, aA, P) => (b, QA) => {
      let SA = b.colorScheme == "light" ? [1, 1, 1, 1] : [0, 0, 0, 1], oA = b.width / S, fA = b.height / M, YA = $B([oA, 0, 0, 0, fA, 0, 0, 0, 1], T);
      eA({
        count: BA,
        category_count: b.categoryCount,
        framebuffer_width: S,
        framebuffer_height: M,
        density_width: _,
        density_height: m,
        gamma: b.gamma,
        point_size: Math.max(b.mode == "points" ? 3 : 1, b.pointSize),
        point_alpha: b.pointAlpha,
        points_alpha: b.pointsAlpha,
        density_scaler: b.densityScaler / 16,
        quantization_step: b.densityQuantizationStep,
        density_alpha: b.densityAlpha,
        contours_alpha: b.contoursAlpha,
        matrix: YA,
        view_xy_scaler: [1 / oA, 1 / fA],
        kde_causal: P.kde_causal,
        kde_anticausal: P.kde_anticausal,
        kde_a: P.kde_a,
        background_color: SA,
        category_colors: tA
      });
      let cA = F.createCommandEncoder();
      O(cA), b.mode == "density" && (b.densityAlpha > 0 || b.contoursAlpha > 0) && (z(cA), Y(cA), aA(cA)), CA(cA, QA), F.queue.submit([cA.finish()]);
    }
  );
}
function ft(A, I, g, B, Q, E, C, i, e) {
  let t = QE(A, I, Q, E, Q, E, A.value(1)), o = gE(A, I, B.buffer, e, t), a = IE(A, I, g, o, e, t), s = BE(A, I, g, o, Q, E, A.value(1));
  return A.derive(
    [
      I,
      Q,
      E,
      e.count,
      B.update,
      C,
      i,
      a,
      s,
      t.countBuffer
    ],
    (n, h, l, u, y, f, D, G, F, S) => () => {
      let M = n.createCommandEncoder(), _ = CE(f);
      y({
        count: u,
        category_count: 1,
        framebuffer_width: h,
        framebuffer_height: l,
        density_width: h,
        density_height: l,
        gamma: 1,
        point_size: 0,
        point_alpha: 0,
        points_alpha: 0,
        density_scaler: 0,
        quantization_step: 0,
        density_alpha: 0,
        contours_alpha: 0,
        matrix: D,
        view_xy_scaler: [1, 1],
        kde_causal: _.kde_causal,
        kde_anticausal: _.kde_anticausal,
        kde_a: _.kde_a,
        background_color: [0, 0, 0, 0],
        category_colors: []
      }), G(M), F(M);
      let m = n.createBuffer({
        size: h * l * 2,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      return M.copyBufferToBuffer(S, 0, m, 0, h * l * 2), n.queue.submit([M.finish()]), m.mapAsync(GPUMapMode.READ, 0, h * l * 2).then(() => Ft(m.getMappedRange()));
    }
  );
}
function Ft(A) {
  let I = new Uint16Array(A), g = new Uint32Array(I.length);
  for (let B = 0; B < I.length; B++) {
    let Q = I[B] & 32767, E = I[B] & 32768, C = I[B] & 31744;
    Q <<= 13, E <<= 16, Q += 939524096, Q = C == 0 ? 0 : Q, Q |= E, g[B] = Q;
  }
  return new Float32Array(g.buffer);
}
function dt(A) {
  return A && A.__esModule && Object.prototype.hasOwnProperty.call(A, "default") ? A.default : A;
}
var vC = { exports: {} }, HC;
function Gt() {
  return HC || (HC = 1, function(A) {
    (function() {
      function I(i, e) {
        var t = i.x - e.x, o = i.y - e.y;
        return t * t + o * o;
      }
      function g(i, e, t) {
        var o = e.x, a = e.y, s = t.x - o, n = t.y - a;
        if (s !== 0 || n !== 0) {
          var h = ((i.x - o) * s + (i.y - a) * n) / (s * s + n * n);
          h > 1 ? (o = t.x, a = t.y) : h > 0 && (o += s * h, a += n * h);
        }
        return s = i.x - o, n = i.y - a, s * s + n * n;
      }
      function B(i, e) {
        for (var t = i[0], o = [t], a, s = 1, n = i.length; s < n; s++)
          a = i[s], I(a, t) > e && (o.push(a), t = a);
        return t !== a && o.push(a), o;
      }
      function Q(i, e, t, o, a) {
        for (var s = o, n, h = e + 1; h < t; h++) {
          var l = g(i[h], i[e], i[t]);
          l > s && (n = h, s = l);
        }
        s > o && (n - e > 1 && Q(i, e, n, o, a), a.push(i[n]), t - n > 1 && Q(i, n, t, o, a));
      }
      function E(i, e) {
        var t = i.length - 1, o = [i[0]];
        return Q(i, 0, t, e, o), o.push(i[t]), o;
      }
      function C(i, e, t) {
        if (i.length <= 2) return i;
        var o = e !== void 0 ? e * e : 1;
        return i = t ? i : B(i, o), i = E(i, o), i;
      }
      A.exports = C, A.exports.default = C;
    })();
  }(vC)), vC.exports;
}
var St = Gt();
const xC = /* @__PURE__ */ dt(St);
function Rt(A, I) {
  let g = A.slice();
  for (let B = 0; B < I; B++) {
    const Q = [], E = g.length;
    for (let C = 0; C < E; C++) {
      const i = g[C], e = g[(C + 1) % E], t = {
        x: 0.75 * i.x + 0.25 * e.x,
        y: 0.75 * i.y + 0.25 * e.y
      }, o = {
        x: 0.25 * i.x + 0.75 * e.x,
        y: 0.25 * i.y + 0.75 * e.y
      };
      Q.push(t, o);
    }
    g = Q;
  }
  return g;
}
function Nt(A, I) {
  const g = Rt(A, 5), B = TQ(g);
  let Q = Math.max(B.xMax - B.xMin, B.yMax - B.yMin) / 100, E = xC(g, Q), C = 0;
  for (; E.length > I && C < 20; )
    Q *= 1.1, C += 1, E = xC(g, Q);
  return E;
}
const bC = {
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
  return A == null ? bC[I] : { ...bC[I], ...A, ...A[I] != null ? A[I] : {} };
}
let nB = null, SB = /* @__PURE__ */ new Map();
function Ut() {
  return nB == null && (nB = new Promise((A, I) => {
    let g = new Worker(new URL("./clustering.worker.js", import.meta.url), { type: "module" });
    g.onmessage = (B) => {
      if (B.data.ready) {
        A(g);
        return;
      }
      if (B.data.id != null) {
        let Q = SB.get(B.data.id);
        Q != null && (SB.delete(B.data.id), Q(B.data));
      }
    };
  })), nB;
}
function EE(A, I, g = []) {
  return new Promise((B, Q) => {
    Ut().then((E) => {
      let C = (/* @__PURE__ */ new Date()).getTime().toString() + "-" + Math.random().toString();
      SB.set(C, (i) => {
        B(i.payload);
      }), E.postMessage({ id: C, name: A, payload: I }, g);
    });
  });
}
let kt = (A, I, g, B) => EE("findClusters", { density_map: A, width: I, height: g, options: B }, [A.buffer]), pt = (A, I) => EE("dynamicLabelPlacement", { labels: A, options: I });
function Jt(A, I, g, B, Q, E) {
  let C = Math.max(B, Q) / E, i = A / (g * g) / (C * C), e = 1 / (i / (E * E)) * 0.2, t = Math.sqrt(A / I / (C * C)), o = Math.log(t), a = Math.log(g), s = (Math.min(Math.max((a - o) * 2, -1), 1) + 1) / 2, n = 0.25 / Math.sqrt(i), h = Math.max(0.2, Math.min(5, n)) * E, l = 1 - s, u = 0.5 + s * 0.5;
  return {
    densityScaler: e,
    densityAlpha: l,
    contoursAlpha: l,
    pointSize: h,
    pointAlpha: 0.7,
    pointsAlpha: u,
    densityBandwidth: 20
  };
}
var Yt = /* @__PURE__ */ yI("<div></div>"), mt = /* @__PURE__ */ rI("<circle></circle>"), Kt = /* @__PURE__ */ rI("<circle></circle>"), Lt = /* @__PURE__ */ rI('<text dominant-baseline="middle"> </text>'), vt = /* @__PURE__ */ rI("<g></g>"), Ht = /* @__PURE__ */ rI("<g><!></g>"), xt = /* @__PURE__ */ rI("<g></g>"), bt = /* @__PURE__ */ yI('<div><canvas></canvas> <div><!></div> <svg role="none"><!><!><!><!></svg> <!> <!></div>');
function iE(A, I) {
  uI(I, !0);
  let g = d(I, "data", 19, () => ({ x: new Float32Array(), y: new Float32Array(), category: null })), B = d(I, "categoryCount", 3, 1), Q = d(I, "categoryColors", 3, null), E = d(I, "width", 3, 800), C = d(I, "height", 3, 800), i = d(I, "pixelRatio", 3, 2), e = d(I, "colorScheme", 3, "light"), t = d(I, "theme", 3, null), o = d(I, "mode", 3, "density"), a = d(I, "minimumDensity", 3, 1 / 16), s = d(I, "totalCount", 3, null), n = d(I, "maxDensity", 3, null), h = d(I, "automaticLabels", 3, !1), l = d(I, "queryClusterLabels", 3, null), u = d(I, "tooltip", 7, null), y = d(I, "selection", 7, null), f = d(I, "querySelection", 3, null), D = d(I, "rangeSelection", 7, null), G = d(I, "defaultViewportState", 3, null), F = d(I, "viewportState", 7, null), S = d(I, "customTooltip", 3, null), M = d(I, "customOverlay", 3, null), _ = d(I, "onViewportState", 3, null), m = d(I, "onTooltip", 3, null), eA = d(I, "onSelection", 3, null), BA = d(I, "onRangeSelection", 3, null), T = /* @__PURE__ */ k(() => Mt(t(), e())), tA = /* @__PURE__ */ k(() => Q() ?? jg(B())), O = /* @__PURE__ */ k(() => F() ?? G() ?? { x: 0, y: 0, scale: 1 }), CA = /* @__PURE__ */ k(() => new Wg(r(O), E(), C())), z = /* @__PURE__ */ k(() => r(CA).pixelLocationFunction()), Y = /* @__PURE__ */ k(() => r(CA).coordinateAtPixelFunction());
  function aA(w, N) {
    return w.x == N.x && w.y == N.y && w.category == N.category && w.text == N.text;
  }
  let P = /* @__PURE__ */ k(() => y()?.length == 1 && u() != null && aA(y()[0], u()));
  function b(w) {
    aI(F(), w) || (F(w), _()?.(w));
  }
  function QA(w) {
    aI(u(), w) || (u(w), m()?.(w));
  }
  function SA(w) {
    aI(y(), w) || (y(w), eA()?.(w));
  }
  function oA(w) {
    aI(D(), w) || (D(w), BA()?.(w));
  }
  let fA = /* @__PURE__ */ EA(SI([])), YA = /* @__PURE__ */ EA(null), cA = /* @__PURE__ */ EA("none"), xI = /* @__PURE__ */ k(() => E() * i()), fI = /* @__PURE__ */ k(() => C() * i()), FA = /* @__PURE__ */ EA(null), $ = /* @__PURE__ */ EA(null), K = /* @__PURE__ */ EA(null), H = /* @__PURE__ */ k(() => Jt(n() ?? (s() ?? g().x.length) / 4, a(), r(O).scale, r(xI), r(fI), i())), sA = /* @__PURE__ */ k(() => r(H).pointSize), dA = !0;
  qg(() => {
    r($)?.setProps({
      mode: o(),
      colorScheme: e(),
      viewportX: r(O).x,
      viewportY: r(O).y,
      viewportScale: r(O).scale,
      width: r(xI),
      height: r(fI),
      x: g().x,
      y: g().y,
      category: g().category,
      categoryCount: B(),
      categoryColors: r(tA),
      ...r(H)
    }) && (Ag(), h() !== !1 && dA && r($) != null && g().x != null && g().x.length > 0 && G() != null && (dA = !1, gC(G())));
  });
  function yA() {
    HA = null, !(!r(FA) || !r($)) && (r(FA).width = r($).props.width, r(FA).height = r($).props.height, r(FA).style.width = `${r($).props.width / i()}px`, r(FA).style.height = `${r($).props.height / i()}px`, r($).render());
  }
  let HA = null;
  function Ag() {
    HA == null && (HA = requestAnimationFrame(yA));
  }
  function gI(w) {
    let N;
    function R() {
      N = w.getContext("webgl2", { antialias: !1 }), N.getExtension("EXT_color_buffer_float"), N.getExtension("EXT_float_blend"), N.getExtension("OES_texture_float_linear"), L($, new Ct(N, r(xI), r(fI)), !0);
    }
    R(), w.addEventListener("webglcontextlost", () => {
      r($)?.destroy(), L($, null), N = null;
    }), w.addEventListener("webglcontextrestored", () => {
      R();
    });
  }
  function XA(w) {
    async function N() {
      let R = w.getContext("webgpu");
      if (R == null) {
        console.error("Could not get WebGPU canvas context");
        return;
      }
      let p = await navigator.gpu.requestAdapter();
      if (!p) {
        console.error("Could not request WebGPU adapter");
        return;
      }
      let J = 512 * 1048576, x = 512 * 1048576;
      J = Math.min(J, p.limits.maxBufferSize), x = Math.min(x, p.limits.maxStorageBufferBindingSize);
      let W = {
        requiredLimits: { maxBufferSize: J, maxStorageBufferBindingSize: x },
        requiredFeatures: ["shader-f16"]
      }, V = await p.requestDevice(W);
      V.lost.then((IA) => {
        console.info(`WebGPU device was lost: ${IA.message}`), IA.reason != "destroyed" && (r($)?.destroy(), L($, null), N());
      });
      let v = navigator.gpu.getPreferredCanvasFormat();
      R.configure({ device: V, format: v, alphaMode: "premultiplied" }), L($, new ut(R, V, v, r(xI), r(fI)), !0);
    }
    N();
  }
  function FI(w) {
    w != null && F() == null && b(w);
  }
  qg(() => FI(G())), OB(() => {
    r(FA) != null && (XC() ? XA(r(FA)) : (gI(r(FA)), L(K, "WebGPU is unavailable. If you are using Safari, please enable the WebGPU feature flag.")));
  }), Hi(() => {
    r($)?.destroy(), L($, null);
  });
  function dI(w, N) {
    let { x: R, y: p, scale: J } = r(O);
    QA(null);
    let x = Math.min(100, Math.max(0.01, J * w)), W = r(FA).getBoundingClientRect(), V = Math.max(W.width, W.height), v = (N.x - W.width / 2) / V * 2, IA = (W.height / 2 - N.y) / V * 2, NA = R + v / J - v / x, rA = p + IA / J - IA / x;
    b({ x: NA, y: rA, scale: x });
  }
  function nE(w, N) {
    QA(null);
    let R = "pan";
    switch (r(cA) != "none" ? N.shift || (R = r(cA)) : N.shift && (R = N.meta ? "lasso" : "marquee"), R) {
      case "marquee":
        return {
          move: (p) => {
            if (QA(null), r($) == null)
              return;
            let J = r(Y)(w.x, w.y), x = r(Y)(p.x, p.y);
            oA({
              xMin: Math.min(J.x, x.x),
              yMin: Math.min(J.y, x.y),
              xMax: Math.max(J.x, x.x),
              yMax: Math.max(J.y, x.y)
            });
          }
        };
      case "lasso": {
        let p = [r(Y)(w.x, w.y)];
        return {
          move: (J) => {
            QA(null), r($) != null && (p = [...p, r(Y)(J.x, J.y)], p.length >= 3 && oA(Nt(p, 24)));
          }
        };
      }
      case "pan": {
        let p = r(Y)(0, 0), J = r(Y)(1, 1), x = p.x - J.x, W = p.y - J.y, V = r(O).x, v = r(O).y;
        return {
          move: (IA) => {
            b({
              x: V + (IA.x - w.x) * x,
              y: v + (IA.y - w.y) * W,
              scale: r(O).scale
            });
          }
        };
      }
    }
  }
  async function aE(w, N) {
    if (D() != null)
      oA(null);
    else {
      const R = await AC(w);
      if (R == null)
        SA([]), QA(null);
      else if (N.shift || N.ctrl || N.meta) {
        let p = y()?.findIndex((J) => J.x == R.x && J.y == R.y && J.category == R.category);
        y() == null || p == null || p < 0 ? (SA([...y() ?? [], R]), QA(R)) : (SA([
          ...y().slice(0, p),
          ...y().slice(p + 1)
        ]), QA(null));
      } else
        SA([R]), QA(R);
    }
  }
  async function sE(w) {
    if (y() != null && y().length == 1) {
      let N = r(z)(y()[0].x, y()[0].y);
      w != null && Ie(w, N) < 10 && QA(y()[0]);
    } else
      QA(await AC(w));
  }
  async function AC(w) {
    if (r($) == null || w == null || f() == null)
      return null;
    let { x: N, y: R } = r(Y)(w.x, w.y), p = Math.abs(r(Y)(w.x + 1, w.y).x - N);
    return await f()(N, R, p);
  }
  function hE() {
    return u() != null;
  }
  let Ig = /* @__PURE__ */ k(() => r(FA) ? Ae(r(FA), {
    zoom: dI,
    drag: nE,
    hover: $i(sE, hE),
    click: aE
  }) : null);
  async function IC(w, N, R) {
    let p = await w.densityMap(1e3, 1e3, N, R), J = await kt(p.data, p.width, p.height, { union_threshold: N }), x = [];
    for (let V = 0; V < J.length; V++) {
      let v = J[V], IA = p.coordinateAtPixel(v.mean_x, v.mean_y), NA = v.boundary_rect_approximation.map(([rA, MA, bI, gg]) => {
        let xA = p.coordinateAtPixel(rA, MA), GI = p.coordinateAtPixel(bI, gg);
        return {
          xMin: Math.min(xA.x, GI.x),
          xMax: Math.max(xA.x, GI.x),
          yMin: Math.min(xA.y, GI.y),
          yMax: Math.max(xA.y, GI.y)
        };
      });
      x.push({
        x: IA.x,
        y: IA.y,
        sum_density: v.sum_density,
        rects: NA,
        bandwidth: N
      });
    }
    let W = x.reduce((V, v) => Math.max(V, v.sum_density), 0) * 5e-3;
    return x.filter((V) => V.sum_density > W);
  }
  async function lE(w) {
    if (r($) == null)
      return [];
    let N = await Be({ generateLabels: w });
    if (typeof h() == "object" && h().cache) {
      let J = await h().cache.get(N);
      if (J != null)
        return J;
    }
    L(YA, "Generating clusters...");
    let R = await IC(r($), 10, w);
    if (R = R.concat(await IC(r($), 5, w)), L(YA, "Generating labels (initializing)..."), l())
      for (let J = 0; J < R.length; J++) {
        let x = await l()(R[J].rects);
        R[J].label = x, L(YA, `Generating labels (${((J + 1) / R.length * 100).toFixed(0)}%)...`);
      }
    let p = R.filter((J) => J.label != null).map((J) => ({
      text: J.label,
      x: J.x,
      y: J.y,
      priority: J.sum_density,
      level: J.bandwidth == 10 ? 0 : 1
    }));
    return typeof h() == "object" && h().cache && await h().cache.set(N, p), p;
  }
  async function gC(w) {
    if (r($) == null)
      return;
    let N = new Wg(w, E(), C()), R = await lE(w), p = w.scale, J = w.scale / 2, x = J * 4, W = R.map((v) => {
      let IA = N.pixelLocation(v.x, v.y), NA = v.level == 0 ? 14 : 12, rA = ke({
        text: v.text,
        fontSize: NA,
        fontFamily: r(T).fontFamily
      });
      rA.width += 4, rA.height += 4;
      let MA = p / x;
      return {
        text: v.text,
        fontSize: NA,
        bounds: {
          xMin: IA.x - rA.width / 2,
          xMax: IA.x + rA.width / 2,
          yMin: IA.y - rA.height / 2,
          yMax: IA.y + rA.height / 2
        },
        locationAtZero: IA,
        priority: v.priority,
        minScale: v.level == 0 ? MA / 1.2 : null,
        maxScale: v.level == 0 ? null : MA,
        coordinate: { x: v.x, y: v.y },
        placement: null
      };
    }), V = await pt(W, { globalMaxScale: p / J });
    for (let v = 0; v < V.length; v++) {
      let IA = V[v];
      if (IA != null) {
        let NA = p / IA.minScale, rA = p / IA.maxScale;
        W[v].placement = { minScale: rA, maxScale: NA };
      }
    }
    L(fA, W, !0), L(YA, null);
  }
  class DE {
    content;
    constructor(N, R) {
      let p = document.createElement("div");
      this.content = p, this.update(R), N.appendChild(p);
    }
    update(N) {
      let R = this.content;
      R.style.fontFamily = N.fontFamily, e() == "light" ? (R.style.color = "#000", R.style.background = "#fff", R.style.border = "1px solid #000") : (R.style.color = "#ccc", R.style.background = "#000", R.style.border = "1px solid #ccc"), R.style.borderRadius = "2px", R.style.padding = "5px", R.style.fontSize = "12px", R.style.maxWidth = "300px", R.innerText = N.tooltip.text ?? JSON.stringify(N.tooltip);
    }
  }
  var Rg = bt();
  let BC;
  var $g = wA(Rg);
  X($g, "", {}, { position: "absolute", top: "0", left: "0" }), FB($g, (w) => L(FA, w), () => r(FA));
  var Ng = iA($g, 2);
  let CC;
  var cE = wA(Ng);
  {
    var uE = (w) => {
      var N = Cg();
      const R = /* @__PURE__ */ k(() => _Q(M())), p = /* @__PURE__ */ k(() => ({
        location: r(z),
        width: E(),
        height: C()
      }));
      var J = TI(N);
      xi(J, () => r(R), (x) => {
        var W = Yt();
        _i(W, (V, v) => r(R)?.(V, v), () => WQ(M(), { proxy: r(p) })), nA(x, W);
      }), nA(w, N);
    };
    kA(cE, (w) => {
      M() && w(uE);
    });
  }
  lA(Ng);
  var ZA = iA(Ng, 2);
  ZA.__mousedown = function(...w) {
    r(Ig)?.mousedown?.apply(this, w);
  }, ZA.__mousemove = function(...w) {
    r(Ig)?.mousemove?.apply(this, w);
  }, X(ZA, "", {}, { position: "absolute", left: "0", top: "0" });
  var QC = wA(ZA);
  {
    var wE = (w) => {
      var N = Cg();
      const R = /* @__PURE__ */ k(() => {
        const { x: W, y: V } = r(z)(u().x, u().y);
        return { x: W, y: V };
      }), p = /* @__PURE__ */ k(() => Math.max(3, r(sA) / i()) + 1);
      var J = TI(N);
      {
        var x = (W) => {
          var V = mt();
          let v;
          KA(
            (IA) => {
              U(V, "cx", r(R).x), U(V, "cy", r(R).y), U(V, "r", r(p)), v = X(V, "", v, IA);
            },
            [
              () => ({
                stroke: e() == "light" ? "#000" : "#fff",
                "stroke-width": 1,
                fill: "none"
              })
            ]
          ), nA(W, V);
        };
        kA(J, (W) => {
          isFinite(r(R).x) && isFinite(r(R).y) && isFinite(r(p)) && W(x);
        });
      }
      nA(w, N);
    };
    kA(QC, (w) => {
      u() != null && r($) != null && w(wE);
    });
  }
  var EC = iA(QC);
  {
    var yE = (w) => {
      var N = Cg(), R = TI(N);
      CB(R, 17, y, BB, (p, J) => {
        var x = Cg();
        const W = /* @__PURE__ */ k(() => {
          const { x: rA, y: MA } = r(z)(r(J).x, r(J).y);
          return { x: rA, y: MA };
        }), V = /* @__PURE__ */ k(() => r(J).category != null ? r(tA)[r(J).category] : r(tA)[0]), v = /* @__PURE__ */ k(() => Math.max(3, r(sA) / i()) + 1);
        var IA = TI(x);
        {
          var NA = (rA) => {
            var MA = Kt();
            let bI;
            KA(
              (gg) => {
                U(MA, "cx", r(W).x), U(MA, "cy", r(W).y), U(MA, "r", r(v)), bI = X(MA, "", bI, gg);
              },
              [
                () => ({
                  stroke: e() == "light" ? "#000" : "#fff",
                  "stroke-width": 2,
                  fill: r(V)
                })
              ]
            ), nA(rA, MA);
          };
          kA(IA, (rA) => {
            isFinite(r(W).x) && isFinite(r(W).y) && isFinite(r(v)) && rA(NA);
          });
        }
        nA(p, x);
      }), nA(w, N);
    };
    kA(EC, (w) => {
      y() != null && r($) != null && w(yE);
    });
  }
  var iC = iA(EC);
  {
    var fE = (w) => {
      var N = xt();
      CB(N, 21, () => r(fA), BB, (R, p) => {
        var J = Ht();
        const x = /* @__PURE__ */ k(() => r(p).text.split(`
`)), W = /* @__PURE__ */ k(() => r(z)(r(p).coordinate.x, r(p).coordinate.y)), V = /* @__PURE__ */ k(() => r(p).placement != null && r(p).placement.minScale <= r(O).scale && r(O).scale <= r(p).placement.maxScale);
        var v = wA(J);
        {
          var IA = (NA) => {
            var rA = vt();
            CB(rA, 21, () => r(x), BB, (MA, bI, gg) => {
              var xA = Lt();
              U(xA, "x", 0);
              let GI;
              var NE = wA(xA, !0);
              lA(xA), KA(
                (ME) => {
                  U(xA, "y", (gg - (r(x).length - 1) / 2) * r(p).fontSize), U(xA, "font-size", r(p).fontSize), GI = X(xA, "", GI, ME), hg(NE, r(bI));
                },
                [
                  () => ({
                    "paint-order": "stroke",
                    "stroke-width": "4",
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round",
                    "text-anchor": "middle",
                    fill: r(T).clusterLabelColor,
                    stroke: r(T).clusterLabelOutlineColor,
                    opacity: r(T).clusterLabelOpacity,
                    "user-select": "none",
                    "-webkit-user-select": "none",
                    "font-family": r(T).fontFamily
                  })
                ]
              ), nA(MA, xA);
            }), lA(rA), nA(NA, rA);
          };
          kA(v, (NA) => {
            r(V) && NA(IA);
          });
        }
        lA(J), KA(() => U(J, "transform", `translate(${r(W).x ?? ""},${r(W).y ?? ""})`)), nA(R, J);
      }), lA(N), nA(w, N);
    };
    kA(iC, (w) => {
      w(fE);
    });
  }
  var FE = iA(iC);
  {
    var dE = (w) => {
      var N = Cg(), R = TI(N);
      {
        var p = (x) => {
          Qe(x, {
            get value() {
              return D();
            },
            get pointLocation() {
              return r(z);
            }
          });
        }, J = (x) => {
          {
            let W = /* @__PURE__ */ k(() => r(Ig)?.preventHover ?? (() => {
            }));
            ji(x, {
              get value() {
                return D();
              },
              onChange: oA,
              get pointLocation() {
                return r(z);
              },
              get coordinateAtPoint() {
                return r(Y);
              },
              get preventHover() {
                return r(W);
              }
            });
          }
        };
        kA(R, (x) => {
          D() instanceof Array ? x(p) : x(J, !1);
        });
      }
      nA(w, N);
    };
    kA(FE, (w) => {
      D() != null && r($) != null && w(dE);
    });
  }
  lA(ZA);
  var eC = iA(ZA, 2);
  {
    var GE = (w) => {
      const N = /* @__PURE__ */ k(() => r(z)(u().x, u().y));
      {
        let R = /* @__PURE__ */ k(() => Math.max(3, r(sA) / i())), p = /* @__PURE__ */ k(() => S() ?? {
          class: DE,
          props: {
            colorScheme: e(),
            fontFamily: r(T).fontFamily
          }
        });
        De(w, {
          get location() {
            return r(N);
          },
          get allowInteraction() {
            return r(P);
          },
          get targetHeight() {
            return r(R);
          },
          get customTooltip() {
            return r(p);
          },
          get tooltip() {
            return u();
          }
        });
      }
    };
    kA(eC, (w) => {
      u() != null && r($) != null && w(GE);
    });
  }
  var SE = iA(eC, 2);
  {
    var RE = (w) => {
      {
        let N = /* @__PURE__ */ k(() => r(YA) ?? r(K)), R = /* @__PURE__ */ k(() => 1 / (r(z)(1, 0).x - r(z)(0, 0).x));
        se(w, {
          get resolvedTheme() {
            return r(T);
          },
          get statusMessage() {
            return r(N);
          },
          get distancePerPoint() {
            return r(R);
          },
          get pointCount() {
            return g().x.length;
          },
          get selectionMode() {
            return r(cA);
          },
          onSelectionMode: (p) => L(cA, p, !0)
        });
      }
    };
    kA(SE, (w) => {
      r(T).statusBar && w(RE);
    });
  }
  return lA(Rg), KA(
    (w, N) => {
      BC = X(Rg, "", BC, w), CC = X(Ng, "", CC, N), U(ZA, "width", E()), U(ZA, "height", C());
    },
    [
      () => ({
        width: `${E() ?? ""}px`,
        height: `${C() ?? ""}px`,
        position: "relative"
      }),
      () => ({
        width: `${E() ?? ""}px`,
        height: `${C() ?? ""}px`,
        position: "absolute",
        top: "0",
        left: "0"
      })
    ]
  ), uC("wheel", ZA, function(...w) {
    r(Ig)?.wheel?.apply(this, w);
  }), uC("mouseleave", ZA, function(...w) {
    r(Ig)?.mouseleave?.apply(this, w);
  }), nA(A, Rg), wI({ updateLabels: gC });
}
ZB(["mousedown", "mousemove"]);
function eE(A, I, g = 0, B = A.length - 1, Q = qt) {
  for (; B > g; ) {
    if (B - g > 600) {
      const e = B - g + 1, t = I - g + 1, o = Math.log(e), a = 0.5 * Math.exp(2 * o / 3), s = 0.5 * Math.sqrt(o * a * (e - a) / e) * (t - e / 2 < 0 ? -1 : 1), n = Math.max(g, Math.floor(I - t * a / e + s)), h = Math.min(B, Math.floor(I + (e - t) * a / e + s));
      eE(A, I, n, h, Q);
    }
    const E = A[I];
    let C = g, i = B;
    for (Eg(A, g, I), Q(A[B], E) > 0 && Eg(A, g, B); C < i; ) {
      for (Eg(A, C, i), C++, i--; Q(A[C], E) < 0; ) C++;
      for (; Q(A[i], E) > 0; ) i--;
    }
    Q(A[g], E) === 0 ? Eg(A, g, i) : (i++, Eg(A, i, B)), i <= I && (g = i + 1), I <= i && (B = i - 1);
  }
}
function Eg(A, I, g) {
  const B = A[I];
  A[I] = A[g], A[g] = B;
}
function qt(A, I) {
  return A < I ? -1 : A > I ? 1 : 0;
}
function qC(A) {
  let I = new Float32Array(A), g = Math.floor(A.length / 2);
  return eE(I, g), I[g];
}
function Tt(A) {
  return A.length == 0 ? 0 : A.reduce((I, g) => I + g, 0) / A.length;
}
function TC(A) {
  if (A.length == 0)
    return 0;
  let I = Tt(A);
  return Math.sqrt(A.reduce((g, B) => g + (B - I) * (B - I)) / A.length);
}
function _t(A, I, g, B = 0, Q = 0) {
  let E = new ArrayBuffer(8), C = new Uint32Array(E), i = new BigUint64Array(E), e = /* @__PURE__ */ new Map();
  for (let o = 0; o < A.length; o++) {
    C[0] = Math.floor((A[o] - B) / g), C[1] = Math.floor((I[o] - Q) / g);
    let a = i[0];
    e.set(a, (e.get(a) ?? 0) + 1);
  }
  let t = 0;
  for (let o of e.values())
    t = Math.max(o, t);
  return t / (g * g);
}
function Wt(A, I) {
  uI(I, !0);
  let g = d(I, "tooltip", 3, null), B = d(I, "selection", 3, null), Q = d(I, "rangeSelection", 3, null), E = d(I, "categoryColors", 3, null), C = d(I, "width", 3, null), i = d(I, "height", 3, null), e = d(I, "pixelRatio", 3, null), t = d(I, "colorScheme", 3, "light"), o = d(I, "theme", 3, null), a = d(I, "viewportState", 3, null), s = d(I, "automaticLabels", 3, !1), n = d(I, "mode", 3, "density"), h = d(I, "minimumDensity", 3, 1 / 16), l = d(I, "customTooltip", 3, null), u = d(I, "customOverlay", 3, null), y = d(I, "querySelection", 3, null), f = d(I, "queryClusterLabels", 3, null), D = d(I, "onViewportState", 3, null), G = d(I, "onTooltip", 3, null), F = d(I, "onSelection", 3, null), S = d(I, "onRangeSelection", 3, null), M = /* @__PURE__ */ k(() => _(I.data));
  function _(m) {
    let eA = 1;
    m.category != null && (eA = m.category.reduce((aA, P) => Math.max(aA, P), 0) + 1);
    let BA = qC(m.x), T = qC(m.y), tA = TC(m.x), O = TC(m.y), CA = 1 / (Math.max(tA, O, 1e-3) * 3), z = 0.1 / CA, Y = _t(m.x, m.y, z, BA, T);
    return {
      count: m.x.length,
      categoryCount: eA,
      maxDensity: Y,
      defaultViewportState: { x: BA, y: T, scale: CA * 0.95 }
    };
  }
  {
    let m = /* @__PURE__ */ k(() => n() ?? "points"), eA = /* @__PURE__ */ k(() => C() ?? 800), BA = /* @__PURE__ */ k(() => i() ?? 800), T = /* @__PURE__ */ k(() => e() ?? 2), tA = /* @__PURE__ */ k(() => t() ?? "light"), O = /* @__PURE__ */ k(() => ({
      x: I.data.x,
      y: I.data.y,
      category: I.data.category ?? null
    })), CA = /* @__PURE__ */ k(() => s() ?? !1), z = /* @__PURE__ */ k(() => h() ?? 1 / 16);
    iE(A, {
      get mode() {
        return r(m);
      },
      get width() {
        return r(eA);
      },
      get height() {
        return r(BA);
      },
      get pixelRatio() {
        return r(T);
      },
      get colorScheme() {
        return r(tA);
      },
      get theme() {
        return o();
      },
      get data() {
        return r(O);
      },
      get totalCount() {
        return r(M).count;
      },
      get maxDensity() {
        return r(M).maxDensity;
      },
      get categoryCount() {
        return r(M).categoryCount;
      },
      get categoryColors() {
        return E();
      },
      get defaultViewportState() {
        return r(M).defaultViewportState;
      },
      get querySelection() {
        return y();
      },
      get queryClusterLabels() {
        return f();
      },
      get automaticLabels() {
        return r(CA);
      },
      get minimumDensity() {
        return r(z);
      },
      get customTooltip() {
        return l();
      },
      get customOverlay() {
        return u();
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
        return F();
      },
      get viewportState() {
        return a();
      },
      get onViewportState() {
        return D();
      },
      get rangeSelection() {
        return Q();
      },
      get onRangeSelection() {
        return S();
      }
    });
  }
  wI();
}
class uo {
  component;
  currentProps;
  constructor(I, g) {
    this.currentProps = { ...g }, this.component = bQ({ component: Wt, target: I, props: g });
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
let Vt = "a|about|above|after|again|against|ain|all|am|an|and|any|are|aren|aren't|as|at|be|because|been|before|being|below|between|both|but|by|can|couldn|couldn't|d|did|didn|didn't|do|does|doesn|doesn't|doing|don|don't|down|during|each|few|for|from|further|had|hadn|hadn't|has|hasn|hasn't|have|haven|haven't|having|he|he'd|he'll|her|here|hers|herself|he's|him|himself|his|how|i|i'd|if|i'll|i'm|in|into|is|isn|isn't|it|it'd|it'll|it's|its|itself|i've|just|ll|m|ma|me|mightn|mightn't|more|most|mustn|mustn't|my|myself|needn|needn't|no|nor|not|now|o|of|off|on|once|only|or|other|our|ours|ourselves|out|over|own|re|s|same|shan|shan't|she|she'd|she'll|she's|should|shouldn|shouldn't|should've|so|some|such|t|than|that|that'll|the|their|theirs|them|themselves|then|there|these|they|they'd|they'll|they're|they've|this|those|through|to|too|under|until|up|ve|very|was|wasn|wasn't|we|we'd|we'll|we're|were|weren|weren't|we've|what|when|where|which|while|who|whom|why|will|with|won|won't|wouldn|wouldn't|y|you|you'd|you'll|your|you're|yours|yourself|yourselves|you've", Xt = "de|la|que|el|en|y|a|los|del|se|las|por|un|para|con|no|una|su|al|lo|como|más|pero|sus|le|ya|o|este|sí|porque|esta|entre|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros|mi|mis|tú|te|ti|tu|tus|ellas|nosotras|vosotros|vosotras|os|mío|mía|míos|mías|tuyo|tuya|tuyos|tuyas|suyo|suya|suyos|suyas|nuestro|nuestra|nuestros|nuestras|vuestro|vuestra|vuestros|vuestras|esos|esas|estoy|estás|está|estamos|estáis|están|esté|estés|estemos|estéis|estén|estaré|estarás|estará|estaremos|estaréis|estarán|estaría|estarías|estaríamos|estaríais|estarían|estaba|estabas|estábamos|estabais|estaban|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|estuviera|estuvieras|estuviéramos|estuvierais|estuvieran|estuviese|estuvieses|estuviésemos|estuvieseis|estuviesen|estando|estado|estada|estados|estadas|estad|he|has|ha|hemos|habéis|han|haya|hayas|hayamos|hayáis|hayan|habré|habrás|habrá|habremos|habréis|habrán|habría|habrías|habríamos|habríais|habrían|había|habías|habíamos|habíais|habían|hube|hubiste|hubo|hubimos|hubisteis|hubieron|hubiera|hubieras|hubiéramos|hubierais|hubieran|hubiese|hubieses|hubiésemos|hubieseis|hubiesen|habiendo|habido|habida|habidos|habidas|soy|eres|es|somos|sois|son|sea|seas|seamos|seáis|sean|seré|serás|será|seremos|seréis|serán|sería|serías|seríamos|seríais|serían|era|eras|éramos|erais|eran|fui|fuiste|fue|fuimos|fuisteis|fueron|fuera|fueras|fuéramos|fuerais|fueran|fuese|fueses|fuésemos|fueseis|fuesen|sintiendo|sentido|sentida|sentidos|sentidas|siente|sentid|tengo|tienes|tiene|tenemos|tenéis|tienen|tenga|tengas|tengamos|tengáis|tengan|tendré|tendrás|tendrá|tendremos|tendréis|tendrán|tendría|tendrías|tendríamos|tendríais|tendrían|tenía|tenías|teníamos|teníais|tenían|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|tuviera|tuvieras|tuviéramos|tuvierais|tuvieran|tuviese|tuvieses|tuviésemos|tuvieseis|tuviesen|teniendo|tenido|tenida|tenidos|tenidas|tened", Zt = "au|aux|avec|ce|ces|dans|de|des|du|elle|en|et|eux|il|ils|je|la|le|les|leur|lui|ma|mais|me|même|mes|moi|mon|ne|nos|notre|nous|on|ou|par|pas|pour|qu|que|qui|sa|se|ses|son|sur|ta|te|tes|toi|ton|tu|un|une|vos|votre|vous|c|d|j|l|à|m|n|s|t|y|été|étée|étées|étés|étant|étante|étants|étantes|suis|es|est|sommes|êtes|sont|serai|seras|sera|serons|serez|seront|serais|serait|serions|seriez|seraient|étais|était|étions|étiez|étaient|fus|fut|fûmes|fûtes|furent|sois|soit|soyons|soyez|soient|fusse|fusses|fût|fussions|fussiez|fussent|ayant|ayante|ayantes|ayants|eu|eue|eues|eus|ai|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|aurais|aurait|aurions|auriez|auraient|avais|avait|avions|aviez|avaient|eut|eûmes|eûtes|eurent|aie|aies|ait|ayons|ayez|aient|eusse|eusses|eût|eussions|eussiez|eussent", Ot = "aber|alle|allem|allen|aller|alles|als|also|am|an|ander|andere|anderem|anderen|anderer|anderes|anderm|andern|anderr|anders|auch|auf|aus|bei|bin|bis|bist|da|damit|dann|der|den|des|dem|die|das|dass|daß|derselbe|derselben|denselben|desselben|demselben|dieselbe|dieselben|dasselbe|dazu|dein|deine|deinem|deinen|deiner|deines|denn|derer|dessen|dich|dir|du|dies|diese|diesem|diesen|dieser|dieses|doch|dort|durch|ein|eine|einem|einen|einer|eines|einig|einige|einigem|einigen|einiger|einiges|einmal|er|ihn|ihm|es|etwas|euer|eure|eurem|euren|eurer|eures|für|gegen|gewesen|hab|habe|haben|hat|hatte|hatten|hier|hin|hinter|ich|mich|mir|ihr|ihre|ihrem|ihren|ihrer|ihres|euch|im|in|indem|ins|ist|jede|jedem|jeden|jeder|jedes|jene|jenem|jenen|jener|jenes|jetzt|kann|kein|keine|keinem|keinen|keiner|keines|können|könnte|machen|man|manche|manchem|manchen|mancher|manches|mein|meine|meinem|meinen|meiner|meines|mit|muss|musste|nach|nicht|nichts|noch|nun|nur|ob|oder|ohne|sehr|sein|seine|seinem|seinen|seiner|seines|selbst|sich|sie|ihnen|sind|so|solche|solchem|solchen|solcher|solches|soll|sollte|sondern|sonst|über|um|und|uns|unsere|unserem|unseren|unser|unseres|unter|viel|vom|von|vor|während|war|waren|warst|was|weg|weil|weiter|welche|welchem|welchen|welcher|welches|wenn|werde|werden|wie|wieder|will|wir|wird|wirst|wo|wollen|wollte|würde|würden|zu|zum|zur|zwar|zwischen";
function Pt(...A) {
  let I = [];
  for (let g of A) {
    let B = g.split("|");
    I = I.concat(B);
  }
  return I;
}
let zt = Pt(Vt, Xt, Zt, Ot);
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
    let I = AB(this.xColumn), g = AB(this.yColumn), B = AB(this.textColumn), Q = await this.coordinator.query(Mg`
      SELECT
        MIN(${I}) AS xMin, QUANTILE_CONT(${I}, 0.99) - QUANTILE_CONT(${I}, 0.01) AS xDiff,
        MIN(${g}) AS yMin, QUANTILE_CONT(${g}, 0.99) - QUANTILE_CONT(${g}, 0.01) AS yDiff,
        COUNT(*) AS count
      FROM ${this.tableName}
    `), { xMin: E, yMin: C, xDiff: i, yDiff: e, count: t } = Q.get(0);
    this.x0 = E, this.y0 = C, this.xBinSize = i / 200, this.yBinSize = e / 200;
    let o = t < 1e4 ? 1 : 5;
    await this.coordinator.exec(Mg`

    `), await this.coordinator.exec(Mg`
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
        WHERE token NOT IN ('',${zt.map((a) => kE(a)).join(",")}) AND LENGTH(token) >= 3
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
    for (let { xMin: B, yMin: Q, xMax: E, yMax: C } of I) {
      let i = Math.floor((B - this.x0) / this.xBinSize), e = Math.floor((E - this.x0) / this.xBinSize), t = Math.floor((Q - this.y0) / this.yBinSize), o = Math.floor((C - this.y0) / this.yBinSize);
      for (let a = i; a <= e; a++)
        for (let s = t; s <= o; s++) {
          let n = s * 32768 + a;
          g.add(n);
        }
    }
    return Array.from(g);
  }
  async summarize(I, g = 4) {
    await this.initialize();
    let B = this.indices(I), Q = Mg`
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
    return (await this.coordinator.query(Q)).getChild("token").toArray();
  }
}
function _C(A, I) {
  if (I.length == 0)
    return c.literal(!1);
  if (A.identifier != null) {
    let g = A.identifier;
    return c.or(...I.map((B) => c.eq(c.column(g), c.literal(B.identifier))));
  } else {
    let g = A.x, B = A.y, Q = A.category;
    return Q != null ? c.or(
      ...I.map(
        (E) => c.and(
          c.eq(c.cast(c.column(g), "DOUBLE"), c.literal(E.x)),
          c.eq(c.cast(c.column(B), "DOUBLE"), c.literal(E.y)),
          c.eq(c.cast(c.column(Q), "INTEGER"), c.literal(E.category))
        )
      )
    ) : c.or(
      ...I.map(
        (E) => c.and(
          c.eq(c.cast(c.column(g), "DOUBLE"), c.literal(E.x)),
          c.eq(c.cast(c.column(B), "DOUBLE"), c.literal(E.y))
        )
      )
    );
  }
}
function $t(A, I, g) {
  let B = [];
  for (let E = 0; E < g.length; E++) {
    let C = (E + 1) % g.length, { x: i, y: e } = g[E], { x: t, y: o } = g[C], a = e < o ? c.and(c.lte(c.literal(e), I), c.lt(I, c.literal(o))) : c.and(c.lte(c.literal(o), I), c.lt(I, c.literal(e))), s = (e < o ? c.lt : c.gt)(
      c.sub(c.mul(c.literal(t - i), I), c.mul(c.literal(o - e), A)),
      c.literal((t - i) * e - (o - e) * i)
    );
    B.push(c.cast(c.and(a, s), "INT"));
  }
  let Q = B.reduce((E, C) => c.add(E, C));
  return c.eq(c.mod(Q, c.literal(2)), c.literal(1));
}
function Ao(A, I) {
  if (I instanceof Array) {
    if (I.length < 3)
      return c.literal(!1);
    let g = TQ(I);
    return c.and(
      c.isBetween(c.column(A.x), [g.xMin, g.xMax]),
      c.isBetween(c.column(A.y), [g.yMin, g.yMax]),
      $t(c.column(A.x), c.column(A.y), I)
    );
  } else
    return c.and(
      c.isBetween(c.column(A.x), [I.xMin, I.xMax]),
      c.isBetween(c.column(A.y), [I.yMin, I.yMax])
    );
}
async function Io(A, I) {
  let { x: g, y: B, table: Q } = I, E = await A.query(
    c.Query.from(Q).select({
      centerX: c.sql`MEDIAN(${c.column(g)})`,
      centerY: c.sql`MEDIAN(${c.column(B)})`,
      stdX: c.sql`STDDEV(${c.column(g)})`,
      stdY: c.sql`STDDEV(${c.column(B)})`,
      ...I.category != null ? {
        maxCategory: c.sql`MAX(${c.column(I.category)}::UTINYINT)`
      } : {}
    })
  ), { centerX: C, centerY: i, stdX: e, stdY: t, maxCategory: o } = E.get(0), a = 1 / (Math.max(e, t, 1e-3) * 3), s = 0.1 / a, n = c.sql`FLOOR((${c.column(g)} - ${C}) / ${s})`, h = c.sql`FLOOR((${c.column(B)} - ${i}) / ${s})`, l = I.category != null ? c.column(I.category) : null, u = l != null ? [n, h, l] : [n, h], y = c.Query.from(
    c.Query.from(Q).select({ count: c.sql`COUNT(*)` }).groupby(...u)
  ).select({
    totalCount: c.sql`SUM(count)::INT`,
    maxCount: c.sql`MAX(count)::INT`
  });
  E = await A.query(y);
  let { maxCount: f, totalCount: D } = E.get(0), G = f / (s * s);
  return {
    centerX: C,
    centerY: i,
    scaler: a,
    totalCount: D,
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
    let { x: B, y: Q, category: E, text: C, identifier: i } = this.source, e = {}, t = g.additionalFields ?? {};
    for (let o in t) {
      let a = t[o];
      typeof a == "string" ? e["field_" + o] = c.column(a) : e["field_" + o] = c.sql`${a.sql}`;
    }
    this.selectParams = {
      x: c.sql`${c.column(B)}::DOUBLE`,
      y: c.sql`${c.column(Q)}::DOUBLE`,
      ...E != null ? { category: c.sql`${c.column(E)}::INT` } : {},
      ...C != null ? { text: c.sql`${c.column(C)}` } : {},
      ...i != null ? { identifier: c.sql`${c.column(i)}` } : {},
      ...e
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
  async queryClosestPoint(I, g, B, Q) {
    let E = Q * 12, { x: C, y: i } = this.source;
    for (let e of [this.lastDistance, E]) {
      if (e == 0 || e > E)
        continue;
      let t = c.Query.from(this.source.table).select(this.selectParams);
      t = t.where(c.sql`${c.column(C)} BETWEEN ${g - e} AND ${g + e}`), t = t.where(c.sql`${c.column(i)} BETWEEN ${B - e} AND ${B + e}`), I && (t = t.where(I)), t = t.orderby(c.sql`(x - (${g}))**2 + (y - (${B}))**2`).limit(1);
      let o = (await this.coordinator.query(t)).get(0);
      if (o)
        return this.lastDistance = Math.max(Math.abs(o.x - g), Math.abs(o.y - B)) * 4, this._convertToDataPoint(o);
    }
    return null;
  }
  async queryPoints(I) {
    let { table: g, identifier: B } = this.source;
    if (B == null)
      return [];
    let Q = c.Query.from(g).select(this.selectParams);
    return Q = Q.where(
      c.isIn(
        c.column(B),
        I.map((E) => c.literal(E))
      )
    ), Array.from(await this.coordinator.query(Q)).map((E) => this._convertToDataPoint(E));
  }
}
function Bo(A) {
  let I = A.coordinator ?? VC(), g = new Co({ ...A, coordinator: I });
  return I.connect(g), g.destroy = () => {
    I.disconnect(g);
  }, g;
}
class Co extends UE {
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
function Qo(A, I) {
  uI(I, !0);
  let g = d(I, "coordinator", 19, VC), B = d(I, "category", 3, null), Q = d(I, "text", 3, null), E = d(I, "identifier", 3, null), C = d(I, "filter", 3, null), i = d(I, "categoryColors", 3, null), e = d(I, "tooltip", 3, null), t = d(I, "additionalFields", 3, null), o = d(I, "selection", 3, null), a = d(I, "rangeSelection", 3, null), s = d(I, "rangeSelectionValue", 3, null), n = d(I, "width", 3, null), h = d(I, "height", 3, null), l = d(I, "pixelRatio", 3, null), u = d(I, "colorScheme", 3, "light"), y = d(I, "theme", 3, null), f = d(I, "viewportState", 3, null), D = d(I, "automaticLabels", 3, !1), G = d(I, "mode", 3, "density"), F = d(I, "minimumDensity", 3, 1 / 16), S = d(I, "customTooltip", 3, null), M = d(I, "customOverlay", 3, null), _ = d(I, "onViewportState", 3, null), m = d(I, "onTooltip", 3, null), eA = d(I, "onSelection", 3, null), BA = d(I, "onRangeSelection", 3, null), T = /* @__PURE__ */ EA(new Float32Array()), tA = /* @__PURE__ */ EA(new Float32Array()), O = /* @__PURE__ */ EA(null), CA = /* @__PURE__ */ EA(1), z = /* @__PURE__ */ EA(1), Y = /* @__PURE__ */ EA(1), aA = /* @__PURE__ */ EA(null), P = /* @__PURE__ */ EA(null), b = /* @__PURE__ */ EA(null), QA = /* @__PURE__ */ EA(null), SA = /* @__PURE__ */ EA(null);
  BI(() => {
    let K = {
      coordinator: g(),
      source: {
        table: I.table,
        x: I.x,
        y: I.y,
        category: B()
      }
    }, H = null, sA = !1;
    async function dA() {
      let yA = K.source, HA = await Io(K.coordinator, yA);
      if (sA)
        return;
      let Ag = HA.scaler * 0.95;
      L(aA, {
        x: HA.centerX,
        y: HA.centerY,
        scale: Ag
      }), L(z, HA.totalCount), L(Y, HA.maxDensity), L(CA, HA.categoryCount), H = Bo({
        coordinator: K.coordinator,
        selection: C(),
        query: (gI) => c.Query.from(yA.table).select({
          x: c.sql`${c.column(yA.x)}::FLOAT`,
          y: c.sql`${c.column(yA.y)}::FLOAT`,
          ...yA.category != null ? { c: c.sql`${c.column(yA.category)}::UTINYINT` } : {}
        }).where(gI),
        queryResult: (gI) => {
          let XA = gI.getChild("x").toArray(), FI = gI.getChild("y").toArray(), dI = gI.getChild("c")?.toArray() ?? null;
          XA != null && !(XA instanceof Float32Array) && (XA = new Float32Array(XA)), FI != null && !(FI instanceof Float32Array) && (FI = new Float32Array(FI)), dI != null && !(dI instanceof Uint8Array) && (dI = new Uint8Array(dI)), L(T, XA), L(tA, FI), L(O, dI), oA(null), fA(null);
        }
      }), H.reset = () => {
        YA();
      }, L(SA, H);
    }
    return dA(), () => {
      L(SA, null), sA = !0, H?.destroy();
    };
  }), BI(() => {
    if (tC(e())) {
      let K = r(SA);
      if (K == null)
        return;
      let H = e();
      L(P, H.value);
      let sA = () => {
        L(P, H.value);
      };
      return BI(() => {
        let dA = r(P), yA = {
          x: I.x,
          y: I.y,
          category: B(),
          identifier: E()
        };
        H.update({
          source: K,
          clients: (/* @__PURE__ */ new Set()).add(K),
          predicate: dA != null ? _C(yA, [dA]) : null,
          value: dA
        });
      }), H.addEventListener("value", sA), () => {
        H.removeEventListener("value", sA), H.update({
          source: K,
          clients: (/* @__PURE__ */ new Set()).add(K),
          value: null,
          predicate: null
        });
      };
    } else if (e() == null || typeof e() == "object")
      L(P, e());
    else {
      if (r(P)?.identifier == e())
        return;
      let K = !1;
      return fI([e()]).then((H) => {
        K || (H.length > 0 ? L(P, H[0]) : L(P, null));
      }), () => {
        K = !0;
      };
    }
  });
  function oA(K) {
    aI(e(), K) || (L(P, K), m()?.(K));
  }
  BI(() => {
    if (tC(o())) {
      let K = r(SA);
      if (K == null)
        return;
      let H = o();
      L(b, H.value);
      let sA = () => {
        L(b, H.value);
      };
      return BI(() => {
        let dA = r(b), yA = {
          x: I.x,
          y: I.y,
          category: B(),
          identifier: E()
        };
        H.update({
          source: K,
          clients: (/* @__PURE__ */ new Set()).add(K),
          predicate: dA != null ? _C(yA, dA) : null,
          value: dA
        });
      }), H.addEventListener("value", sA), () => {
        H.removeEventListener("value", sA), H.update({
          source: K,
          clients: (/* @__PURE__ */ new Set()).add(K),
          value: null,
          predicate: null
        });
      };
    } else if (o() == null)
      L(b, null);
    else if (o().length == 0)
      L(b, []);
    else if (o().every((K) => typeof K == "object"))
      L(b, o());
    else {
      let K = !1;
      return fI(o()).then((H) => {
        K || L(b, H);
      }), () => {
        K = !0;
      };
    }
  });
  function fA(K) {
    aI(o(), K) || (L(b, K), eA()?.(K));
  }
  BI(() => {
    let K = r(SA);
    if (K == null)
      return;
    let H = a();
    if (H != null)
      return BI(() => {
        let sA = r(QA), dA = { x: I.x, y: I.y }, yA = {
          source: K,
          clients: (/* @__PURE__ */ new Set()).add(K),
          predicate: sA != null ? Ao(dA, sA) : null,
          value: sA
        };
        H.update(yA), H.activate(yA);
      }), () => {
        H.update({
          source: K,
          clients: (/* @__PURE__ */ new Set()).add(K),
          value: null,
          predicate: null
        });
      };
  }), BI(() => {
    aI(jI(() => r(QA)), s()) || L(QA, s());
  });
  function YA() {
    fA(null), oA(null), BA()?.(null), L(QA, null);
  }
  let cA = /* @__PURE__ */ k(() => new go(g(), {
    table: I.table,
    x: I.x,
    y: I.y,
    category: B(),
    text: Q(),
    identifier: E(),
    additionalFields: t()
  }));
  async function xI(K, H, sA) {
    return await r(cA).queryClosestPoint(C()?.predicate?.(r(SA)), K, H, sA);
  }
  async function fI(K) {
    return await r(cA).queryPoints(K);
  }
  let FA = /* @__PURE__ */ k(() => Q() != null ? new jt({
    coordinator: g(),
    table: I.table,
    x: I.x,
    y: I.y,
    text: Q()
  }) : null);
  async function $(K) {
    if (r(FA) == null)
      return null;
    let H = await r(FA).summarize(K, 4);
    return H.length > 0 ? H.slice(0, 2).join("-") + `-
` + H.slice(2).join("-") : null;
  }
  {
    let K = /* @__PURE__ */ k(() => G() ?? "points"), H = /* @__PURE__ */ k(() => n() ?? 800), sA = /* @__PURE__ */ k(() => h() ?? 800), dA = /* @__PURE__ */ k(() => l() ?? 2), yA = /* @__PURE__ */ k(() => u() ?? "light"), HA = /* @__PURE__ */ k(() => ({
      x: r(T),
      y: r(tA),
      category: r(O)
    })), Ag = /* @__PURE__ */ k(() => Q() != null ? D() ?? !1 : !1), gI = /* @__PURE__ */ k(() => F() ?? 1 / 16);
    iE(A, {
      get mode() {
        return r(K);
      },
      get width() {
        return r(H);
      },
      get height() {
        return r(sA);
      },
      get pixelRatio() {
        return r(dA);
      },
      get colorScheme() {
        return r(yA);
      },
      get theme() {
        return y();
      },
      get data() {
        return r(HA);
      },
      get totalCount() {
        return r(z);
      },
      get maxDensity() {
        return r(Y);
      },
      get categoryCount() {
        return r(CA);
      },
      get categoryColors() {
        return i();
      },
      get defaultViewportState() {
        return r(aA);
      },
      querySelection: xI,
      queryClusterLabels: $,
      get automaticLabels() {
        return r(Ag);
      },
      get minimumDensity() {
        return r(gI);
      },
      get customTooltip() {
        return S();
      },
      get customOverlay() {
        return M();
      },
      get tooltip() {
        return r(P);
      },
      onTooltip: oA,
      get selection() {
        return r(b);
      },
      onSelection: fA,
      get viewportState() {
        return f();
      },
      get onViewportState() {
        return _();
      },
      get rangeSelection() {
        return r(QA);
      },
      onRangeSelection: (XA) => {
        L(QA, XA), BA()?.(XA);
      }
    });
  }
  wI();
}
class wo {
  component;
  currentProps;
  constructor(I, g) {
    this.currentProps = { ...g }, this.component = bQ({ component: Qo, target: I, props: g });
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
function yo() {
  return XC() ? 32 : 4;
}
let DA;
const tE = typeof TextDecoder < "u" ? new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
typeof TextDecoder < "u" && tE.decode();
let tg = null;
function mg() {
  return (tg === null || tg.byteLength === 0) && (tg = new Uint8Array(DA.memory.buffer)), tg;
}
function aB(A, I) {
  return A = A >>> 0, tE.decode(mg().subarray(A, A + I));
}
const CI = new Array(128).fill(void 0);
CI.push(void 0, null, !0, !1);
let lg = CI.length;
function UA(A) {
  lg === CI.length && CI.push(CI.length + 1);
  const I = lg;
  return lg = CI[I], CI[I] = A, I;
}
function gA(A) {
  return CI[A];
}
function Eo(A) {
  A < 132 || (CI[A] = lg, lg = A);
}
function og(A) {
  const I = gA(A);
  return Eo(A), I;
}
function sB(A) {
  return A == null;
}
let rg = null;
function io() {
  return (rg === null || rg.byteLength === 0) && (rg = new Float64Array(DA.memory.buffer)), rg;
}
let ng = null;
function ig() {
  return (ng === null || ng.byteLength === 0) && (ng = new Int32Array(DA.memory.buffer)), ng;
}
let zI = 0;
const Kg = typeof TextEncoder < "u" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} }, eo = typeof Kg.encodeInto == "function" ? function(A, I) {
  return Kg.encodeInto(A, I);
} : function(A, I) {
  const g = Kg.encode(A);
  return I.set(g), {
    read: A.length,
    written: g.length
  };
};
function WC(A, I, g) {
  if (g === void 0) {
    const i = Kg.encode(A), e = I(i.length, 1) >>> 0;
    return mg().subarray(e, e + i.length).set(i), zI = i.length, e;
  }
  let B = A.length, Q = I(B, 1) >>> 0;
  const E = mg();
  let C = 0;
  for (; C < B; C++) {
    const i = A.charCodeAt(C);
    if (i > 127) break;
    E[Q + C] = i;
  }
  if (C !== B) {
    C !== 0 && (A = A.slice(C)), Q = g(Q, B, B = C + A.length * 3, 1) >>> 0;
    const i = mg().subarray(Q + C, Q + B), e = eo(A, i);
    C += e.written, Q = g(Q, B, C, 1) >>> 0;
  }
  return zI = C, Q;
}
function RB(A) {
  const I = typeof A;
  if (I == "number" || I == "boolean" || A == null)
    return `${A}`;
  if (I == "string")
    return `"${A}"`;
  if (I == "symbol") {
    const Q = A.description;
    return Q == null ? "Symbol" : `Symbol(${Q})`;
  }
  if (I == "function") {
    const Q = A.name;
    return typeof Q == "string" && Q.length > 0 ? `Function(${Q})` : "Function";
  }
  if (Array.isArray(A)) {
    const Q = A.length;
    let E = "[";
    Q > 0 && (E += RB(A[0]));
    for (let C = 1; C < Q; C++)
      E += ", " + RB(A[C]);
    return E += "]", E;
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
let ag = null;
function to() {
  return (ag === null || ag.byteLength === 0) && (ag = new Float32Array(DA.memory.buffer)), ag;
}
function oo(A, I) {
  const g = I(A.length * 4, 4) >>> 0;
  return to().set(A, g / 4), zI = A.length, g;
}
function ro(A, I) {
  if (!(A instanceof I))
    throw new Error(`expected instance of ${I.name}`);
  return A.ptr;
}
function no(A, I) {
  ro(A, oE);
  const g = DA.find_clusters(A.__wbg_ptr, UA(I));
  return og(g);
}
const ao = typeof FinalizationRegistry > "u" ? { register: () => {
}, unregister: () => {
} } : new FinalizationRegistry((A) => DA.__wbg_densitymap_free(A >>> 0));
class oE {
  __destroy_into_raw() {
    const I = this.__wbg_ptr;
    return this.__wbg_ptr = 0, ao.unregister(this), I;
  }
  free() {
    const I = this.__destroy_into_raw();
    DA.__wbg_densitymap_free(I);
  }
  /**
  * @param {number} width
  * @param {number} height
  * @param {Float32Array} data
  */
  constructor(I, g, B) {
    const Q = oo(B, DA.__wbindgen_malloc), E = zI, C = DA.densitymap_new(I, g, Q, E);
    return this.__wbg_ptr = C >>> 0, this;
  }
  /**
  * @returns {number}
  */
  width() {
    return DA.densitymap_width(this.__wbg_ptr);
  }
  /**
  * @returns {number}
  */
  height() {
    return DA.densitymap_height(this.__wbg_ptr);
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
function ho() {
  const A = {};
  return A.wbg = {}, A.wbg.__wbindgen_error_new = function(I, g) {
    const B = new Error(aB(I, g));
    return UA(B);
  }, A.wbg.__wbindgen_boolean_get = function(I) {
    const g = gA(I);
    return typeof g == "boolean" ? g ? 1 : 0 : 2;
  }, A.wbg.__wbindgen_object_drop_ref = function(I) {
    og(I);
  }, A.wbg.__wbindgen_is_object = function(I) {
    const g = gA(I);
    return typeof g == "object" && g !== null;
  }, A.wbg.__wbindgen_is_undefined = function(I) {
    return gA(I) === void 0;
  }, A.wbg.__wbindgen_in = function(I, g) {
    return gA(I) in gA(g);
  }, A.wbg.__wbindgen_number_get = function(I, g) {
    const B = gA(g), Q = typeof B == "number" ? B : void 0;
    io()[I / 8 + 1] = sB(Q) ? 0 : Q, ig()[I / 4 + 0] = !sB(Q);
  }, A.wbg.__wbindgen_is_string = function(I) {
    return typeof gA(I) == "string";
  }, A.wbg.__wbindgen_jsval_loose_eq = function(I, g) {
    return gA(I) == gA(g);
  }, A.wbg.__wbindgen_string_get = function(I, g) {
    const B = gA(g), Q = typeof B == "string" ? B : void 0;
    var E = sB(Q) ? 0 : WC(Q, DA.__wbindgen_malloc, DA.__wbindgen_realloc), C = zI;
    ig()[I / 4 + 1] = C, ig()[I / 4 + 0] = E;
  }, A.wbg.__wbindgen_number_new = function(I) {
    return UA(I);
  }, A.wbg.__wbindgen_bigint_from_u64 = function(I) {
    const g = BigInt.asUintN(64, I);
    return UA(g);
  }, A.wbg.__wbindgen_object_clone_ref = function(I) {
    const g = gA(I);
    return UA(g);
  }, A.wbg.__wbindgen_string_new = function(I, g) {
    const B = aB(I, g);
    return UA(B);
  }, A.wbg.__wbg_getwithrefkey_15c62c2b8546208d = function(I, g) {
    const B = gA(I)[gA(g)];
    return UA(B);
  }, A.wbg.__wbg_set_20cbc34131e76824 = function(I, g, B) {
    gA(I)[og(g)] = og(B);
  }, A.wbg.__wbg_new_16b304a2cfa7ff4a = function() {
    const I = new Array();
    return UA(I);
  }, A.wbg.__wbg_new_d9bc3a0147634640 = function() {
    return UA(/* @__PURE__ */ new Map());
  }, A.wbg.__wbg_new_72fb9a18b5ae2624 = function() {
    const I = new Object();
    return UA(I);
  }, A.wbg.__wbg_set_d4638f722068f043 = function(I, g, B) {
    gA(I)[g >>> 0] = og(B);
  }, A.wbg.__wbg_instanceof_ArrayBuffer_836825be07d4c9d2 = function(I) {
    let g;
    try {
      g = gA(I) instanceof ArrayBuffer;
    } catch {
      g = !1;
    }
    return g;
  }, A.wbg.__wbg_set_8417257aaedc936b = function(I, g, B) {
    const Q = gA(I).set(gA(g), gA(B));
    return UA(Q);
  }, A.wbg.__wbg_buffer_12d079cc21e14bdb = function(I) {
    const g = gA(I).buffer;
    return UA(g);
  }, A.wbg.__wbg_new_63b92bc8671ed464 = function(I) {
    const g = new Uint8Array(gA(I));
    return UA(g);
  }, A.wbg.__wbg_set_a47bac70306a19a7 = function(I, g, B) {
    gA(I).set(gA(g), B >>> 0);
  }, A.wbg.__wbg_length_c20a40f15020d68a = function(I) {
    return gA(I).length;
  }, A.wbg.__wbg_instanceof_Uint8Array_2b3bbecd033d19f6 = function(I) {
    let g;
    try {
      g = gA(I) instanceof Uint8Array;
    } catch {
      g = !1;
    }
    return g;
  }, A.wbg.__wbindgen_debug_string = function(I, g) {
    const B = RB(gA(g)), Q = WC(B, DA.__wbindgen_malloc, DA.__wbindgen_realloc), E = zI;
    ig()[I / 4 + 1] = E, ig()[I / 4 + 0] = Q;
  }, A.wbg.__wbindgen_throw = function(I, g) {
    throw new Error(aB(I, g));
  }, A.wbg.__wbindgen_memory = function() {
    const I = DA.memory;
    return UA(I);
  }, A;
}
function lo(A, I) {
  return DA = A.exports, rE.__wbindgen_wasm_module = I, ag = null, rg = null, ng = null, tg = null, DA;
}
async function rE(A) {
  if (DA !== void 0) return DA;
  typeof A > "u" && (A = new URL("data:application/wasm;base64,AGFzbQEAAAAB7wEjYAJ/fwF/YAN/f38Bf2ACf38AYAN/f38AYAF/AGABfwF/YAR/f39/AGAFf39/f38AYAABf2AEf39/fwF/YAAAYAV/f39/fwF/YAR/fH9/AX9gBn9/f39/fwF/YAJ/fwF+YAR/f35/AGAGf39/f39/AGACfHwBfGABfAF/YAF+AX9gAn98AGAJf39/f39/fn5+AGAHf39/f39/fwF/YAN/f38BfmADfn9/AX9gBX9/fn9/AGAEf35/fwBgBX9/fX9/AGAEf31/fwBgBX9/fH9/AGAEf3x/fwBgA39/fQBgA39/fABgAn19AX1gAXwBfALEBx4Dd2JnFF9fd2JpbmRnZW5fZXJyb3JfbmV3AAADd2JnFl9fd2JpbmRnZW5fYm9vbGVhbl9nZXQABQN3YmcaX193YmluZGdlbl9vYmplY3RfZHJvcF9yZWYABAN3YmcUX193YmluZGdlbl9pc19vYmplY3QABQN3YmcXX193YmluZGdlbl9pc191bmRlZmluZWQABQN3YmcNX193YmluZGdlbl9pbgAAA3diZxVfX3diaW5kZ2VuX251bWJlcl9nZXQAAgN3YmcUX193YmluZGdlbl9pc19zdHJpbmcABQN3YmcZX193YmluZGdlbl9qc3ZhbF9sb29zZV9lcQAAA3diZxVfX3diaW5kZ2VuX3N0cmluZ19nZXQAAgN3YmcVX193YmluZGdlbl9udW1iZXJfbmV3ABIDd2JnGl9fd2JpbmRnZW5fYmlnaW50X2Zyb21fdTY0ABMDd2JnG19fd2JpbmRnZW5fb2JqZWN0X2Nsb25lX3JlZgAFA3diZxVfX3diaW5kZ2VuX3N0cmluZ19uZXcAAAN3YmckX193YmdfZ2V0d2l0aHJlZmtleV8xNWM2MmMyYjg1NDYyMDhkAAADd2JnGl9fd2JnX3NldF8yMGNiYzM0MTMxZTc2ODI0AAMDd2JnGl9fd2JnX25ld18xNmIzMDRhMmNmYTdmZjRhAAgDd2JnGl9fd2JnX25ld19kOWJjM2EwMTQ3NjM0NjQwAAgDd2JnGl9fd2JnX25ld183MmZiOWExOGI1YWUyNjI0AAgDd2JnGl9fd2JnX3NldF9kNDYzOGY3MjIwNjhmMDQzAAMDd2JnLV9fd2JnX2luc3RhbmNlb2ZfQXJyYXlCdWZmZXJf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ACANIAJBCGsgC3FqIAQ6AAAgBSACQX9zQRRsaiECQf8BRg0CIAMtAAEhBCADIAItAAE6AAEgAy0AAiEGIAMgAi0AAjoAAiADLQADIQggAyACLQADOgADIAMtAAAhDCADIAItAAA6AAAgAiAEOgABIAIgBjoAAiACIAg6AAMgAiAMOgAAIAMtAAUhBCADIAItAAU6AAUgAy0ABiEGIAMgAi0ABjoABiADLQAHIQggAyACLQAHOgAHIAMtAAQhDCADIAItAAQ6AAQgAiAEOgAFIAIgBjoABiACIAg6AAcgAiAMOgAEIAMtAAkhBCADIAItAAk6AAkgAy0ACiEGIAMgAi0ACjoACiADLQALIQggAyACLQALOgALIAMtAAghDCADIAItAAg6AAggAiAEOgAJIAIgBjoACiACIAg6AAsgAiAMOgAIIAMtAA0hBCADIAItAA06AA0gAy0ADiEGIAMgAi0ADjoADiADLQAPIQggAyACLQAPOgAPIAMtAAwhDCADIAItAAw6AAwgAiAEOgANIAIgBjoADiACIAg6AA8gAiAMOgAMIAMtABEhBCADIAItABE6ABEgAy0AEiEGIAMgAi0AEjoAEiADLQATIQggAyACLQATOgATIAMtABAhDCADIAItABA6ABAgAiAEOgARIAIgBjoAEiACIAg6ABMgAiAMOgAQDAELCyAKIAhBGXYiAjoAACANIAdBCGsgC3FqIAI6AAAMAQsgCkH/AToAACANIAdBCGsgC3FqQf8BOgAAIAJBEGogA0EQaigAADYAACACQQhqIANBCGopAAA3AAAgAiADKQAANwAACyAHQQFqIQIgByALRw0ACwsgACAJIA9rNgIIDAELIAAgBjYCBCAAIAk2AgAgACAIIA9rNgIIIAtFDQAgCyANQRRsQQdqQXhxIgBqQQlqIgFFDQAgAyAAayABELUBCyAOQSBqJAALoy8DIH8EfAF+IwBBMGsiCiQAAkACQAJAAkACQCABvSImQiCIpyIEQf////8HcSIFQfvUvYAETwRAIAVBvIzxgARPBEAgCkH/////BwJ/AkAgBUH7w+SJBE8EQCAFQf//v/8HSw0FICZC/////////weDQoCAgICAgICwwQCEvyIBRAAAAAAAAODBZiEEIAGZRAAAAAAAAOBBY0UNASABqgwCCwJAIAVBFHYiBSABIAFEg8jJbTBf5D+iRAAAAAAAADhDoEQAAAAAAAA4w6AiI0QAAEBU+yH5v6KgIgEgI0QxY2IaYbTQPaIiJaEiJL1CNIinQf8PcWtBEUgNACAFIAEgI0QAAGAaYbTQPaIiJKEiIiAjRHNwAy6KGaM7oiABICKhICShoSIloSIkvUI0iKdB/w9xa0EySARAICIhAQwBCyAiICNEAAAALooZozuiIiShIgEgI0TBSSAlmoN7OaIgIiABoSAkoaEiJaEhJAsgACAkOQMAIAAgASAkoSAloTkDECAjRAAAAAAAAODBZiEFIABB/////wcCfyAjmUQAAAAAAADgQWMEQCAjqgwBC0GAgICAeAtBgICAgHggBRsgI0QAAMD////fQWQbQQAgIyAjYRs2AggMCAtBgICAgHgLQYCAgIB4IAQbIAFEAADA////30FkG0EAIAEgAWEbtyIiOQMAIAEgIqFEAAAAAAAAcEGiIgFEAAAAAAAA4MFmIQQgCkH/////BwJ/IAGZRAAAAAAAAOBBYwRAIAGqDAELQYCAgIB4C0GAgICAeCAEGyABRAAAwP///99BZBtBACABIAFhGyIEtyIiOQMIIAogASAioUQAAAAAAABwQaIiATkDECAKQgA3AyggCkIANwMgIApCADcDGCAKQRhqIRIjAEGwBGsiAyQAIANCADcDmAEgA0IANwOQASADQgA3A4gBIANCADcDgAEgA0IANwN4IANCADcDcCADQgA3A2ggA0IANwNgIANCADcDWCADQgA3A1AgA0IANwNIIANCADcDQCADQgA3AzggA0IANwMwIANCADcDKCADQgA3AyAgA0IANwMYIANCADcDECADQgA3AwggA0IANwMAIANCADcDuAIgA0IANwOwAiADQgA3A6gCIANCADcDoAIgA0IANwOYAiADQgA3A5ACIANCADcDiAIgA0IANwOAAiADQgA3A/gBIANCADcD8AEgA0IANwPoASADQgA3A+ABIANCADcD2AEgA0IANwPQASADQgA3A8gBIANCADcDwAEgA0IANwO4ASADQgA3A7ABIANCADcDqAEgA0IANwOgASADQgA3A9gDIANCADcD0AMgA0IANwPIAyADQgA3A8ADIANCADcDuAMgA0IANwOwAyADQgA3A6gDIANCADcDoAMgA0IANwOYAyADQgA3A5ADIANCADcDiAMgA0IA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oiIkoSIBICNEwUkgJZqDezmiICIgAaEgJKGhIiWhISQLIAAgJDkDACAAIAEgJKEgJaE5AxAgI0QAAAAAAADgwWYhBSAAQf////8HAn8gI5lEAAAAAAAA4EFjBEAgI6oMAQtBgICAgHgLQYCAgIB4IAUbICNEAADA////30FkG0EAICMgI2EbNgIIDAELAkAgASABRIPIyW0wX+Q/okQAAAAAAAA4Q6BEAAAAAAAAOMOgIiNEAABAVPsh+b+ioCIBICNEMWNiGmG00D2iIiWhIiS9QoCAgICAgID4/wCDQv////////+HP1YNACABICNEAABgGmG00D2iIiShIiIgI0RzcAMuihmjO6IgASAioSAkoaEiJaEiJL1CgICAgICAgID/AINC//////////88VgRAICIhAQwBCyAiICNEAAAALooZozuiIiShIgEgI0TBSSAlmoN7OaIgIiABoSAkoaEiJaEhJAsgACAkOQMAIAAgASAkoSAloTkDECAjRAAAAAAAAODBZiEFIABB/////wcCfyAjmUQAAAAAAADgQWMEQCAjqgwBC0GAgICAeAtBgICAgHggBRsgI0QAAMD////fQWQbQQAgIyAjYRs2AggLIApBMGokAAuGDgIRfwJ+IwBBIGsiDSQAAkACQAJAAkACQAJAAkAgACgCDCIOQQFqIgIgDk8EQCAAKAIEIgogCkEBaiIEQQN2IgVBB2wgCkEISRsiDEEBdiACSQRAIAIgDEEBaiACIAxLGyIFQQhJDQIgBUH/////AUsEQBB7IA0oAhgaDAkLQX8gBUEDdEEHbkEBa2d2IgVB/v///wBLDQYgBUEBaiECDAULQQAhAiAAKAIAIQYCQCAFIARBB3FBAEdqIghFDQAgCEEBRwRAIAhB/v///wNxIQsDQCACIAZqIgUgBSkDACITQn+FQgeIQoGChIiQoMCAAYMgE0L//v379+/fv/8AhHw3AwAgBUEIaiIFIAUpAwAiE0J/hUIHiEKBgoSIkKDAgAGDIBNC//79+/fv37//AIR8NwMAIAJBEGohAiALQQJrIgsNAAsLIAhBAXFFDQAgAiAGaiIFIAUpAwAiE0J/hUIHiEKBgoSIkKDAgAGDIBNC//79+/fv37//AIR8NwMACyAEQQhPBEAgBCAGaiAGKQAANwAADAMLIAZBCGogBiAEEM4BIAQNAkEA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dGoiASARNgIEIAEgEzYCAEEAIBNBAWoiASABIDBGIgEbIRMgASARaiIRIDNIDQALCyASIDM2AtgCIBIgMDYC1AIgEiAzNgLQAiASIDA2AswCIBIgIDYCyAIgEiAfNgLEAiASICA2AsACIDNBAEwEQEEEITgMCQsgLygCBCE1IC8oAgghHANAIBUgMGwgKmoiASAcTw0EICpBAWohHiA1IAFBAnRqKgIAIT4gEkKAgICAEDcCQCASQoCAgIBwNwI4IBJCATcCMCASQv////8PNwIoQQAhEyA8ITsgGSEUIBYhEUEAIQEDQCARIRYgFCEZIDshPANAIAEhGANAIBJBKGogE0EDdGohAQNAIAEhESATQQRGBEAgGARAIBJBIGogEkHAAmoiEyAqIBUQayASKAIgIBIoAiQgEkEYaiATIBYgGRBrIDBsaiIBICBPDQwgEigCGCERIB8gAUEDdGoiASASKAIcNgIEIAEgETYCAAtBACAeIB4gMEYiARshKiABIBVqIhUgM0gNBSASQQA2AjAgEkKAgICAwAA3AihBACETQQAhEQNAIBJBEGogEkHAAmogESATEGsCQCASKAIQIBFHDQAgEigCFCATRw0AIBMgMGwgEWoiASAoTw0MIDQgAUECdGoiASgCAEF/Rw0AIAEgEigCMCIUNgIAIBIoAiggFEYEQCASQShqEFwLIBIoAiwgFEEcbGoiAUIANwIIIAFCfzcCACABQRBqQgA3AgAgAUEYakEANgIAIBIgFEEBajYCMAtBACARQQFqIgEgASAwRiIBGyERIAEgE2oiEyAzSA0AC0EAIRNBACEBDA0LIBFBCGohASATQQFqIRMgEUEEaigCACAVaiIUIDNODQAgESgCACAqaiIRIDBOIBEgFHJBAEhyDQALIBQgMGwgEWoiASAcTw0KIDUgAUECdGoqAgAiOyA+YEUNAAtBASEBIBhFDQEgOyA8XkUNAAsMAAsACwALICYgI0GgkMAAEHYACyAmIChBsJDAABB2AAsgASAgQZyYwAAQdgALIAEgHEHAkcAAEHYACyABIChBsJHAABB2AAsgASAgQbyYwAAQdgALIAEgHEHQkcAAEHYACwJAAkACQAJAA0AgEkEIaiASQcACaiABIBMQayASKAIIIBIoAgwgMGxqIhEgKE8NASATIDBsIAFqIhQgKE8NAiA0IBRBAnQiFmogNCARQQJ0aigCACIZNgIAIBkgEigCMCIRTw0EIBQgHE8NAyATIAFBAWoiFSAwRiIUaiAWIDVqKgIAIjsgEigCLCAZQRxsaiIWKgIYXgRAIBYgEzYCBCAWIAE2AgAgFiA7OAIYCyAWIDsgFioCDJI4AgwgFiAWKAIIQQFqNgIIIBYgOyABspQgFioCEJI4AhAgFiA7IBOylCAWKgIUkjgCFEEAIBUgFBshASITIDNIDQALIBIoAjAhNiASKAIsITggEigCKCE3DAQLIBEgKEHwkMAAEHYACyAUIChBgJHAABB2AAsgFCAcQaCRwAAQdgALIBkgEUGQkcAAEHYACyAgBEAgHyAgQQN0ELUBCyAoITUMAQsgGgRAIAEgGkEDdBC1AQsgEkHAAmogEkHQAWoQNgJAAkACQAJAAkAgEigCwAIEQCAvKAIEIRYgLygCCCEYA0AgEigC0AIhGiASKgLMAiE8IBIoAsgCISAgEigCxAIhHCASQoCAgIDAADcCSCASQoCAgIAQNwJAIBJCgICAgHA3AjggEkIBNwIwIBJC/////w83AihBACETA0ACQCASQShqIBNBA3RqIgEoAgQgIGoiGSAzTg0AIAEoAgAgHGoiFSAwTiAVIBlyQQBIcg0AIBkgMGwgFWoiFCAoTw0HIDQgFEECdCIRaiIBKAIAQX9HDQAgFCAYTw0GIBEgFmoqAgAiOyA8Xg0AIAEgGjYCACASKALYASIBIBIoAtABRgRAIBJB0AFqEF0LIAFBBHQiESASKALUAWoiFCAaNgIMIBQgOzgCCCAUIBk2AgQgFCAVNgIAIBIgAUEBajYC2AEgEigC1AEiHiARaiIRKAIMIRQgESoCCCE7IBEoAgQhHyARKAIAIRkCQCABRQRAQQAhFQwBCwNAAkAgGSAeIAFBAWsiEUEBdiIVQQR0aiIjKAIARw0AIB8gIygCBEcNACABIRUMAgsgOyAjKgIIXkUEQCABIRUMAgsgHiABQQR0aiIBICMpAgA3AgAgAUEIaiAjQQhqKQIANwIAIBUhASARQQFLDQALCyAeIBVBBHRqIgEgFDYCDCABIDs4AgggASAfNgIEIAEgGTYCAAsgE0EBaiITQQRHDQALIBogEigCqAIiAU8NAiASKAKkAiAaQRxsaiIBKgIYIDxdBEAgASAgNgIEIAEgHDYCACABIDw4AhgLIAEgPCABKgIMkjgCDCABIAEoAghBAWo2AgggASA8IByylCABKgIQkjgCECABIDwgILKUIAEqAhSSOAIUIBJBwAJqIBJB0AFqEDYgEigCwAINAAsLIBJBMGoiESASQagCaigCADYCACASIBIpAqACNwMoIBIoAtABIgEEQCASKALUASABQQR0ELUBCyASQcgCaiARKAIANgIAIBIgEikDKDcDwAIgKUH/AXFFIDNBAExyDQQgLygCBCEVIC8oAgghFkEAISBBACEfA0AgICAwbCAfaiIBIChPDQICQAJAIDQgAUECdGooAgBBf0cNACASKALIAiEeIBJCgICAgMAANwIoIBJCADcCMCASQShqEGpBACEqIBIoAiwgEigCMCASKAI0aiIRIBIoAigiAUEAIAEgEU0ba0EDdGoiASAgNgIEIAEgHzYCACASIBIoAjRBAWoiFDYCNAJAIBRFBEBDAAAAACE9QX8hLkF/IRhDAAAAACE/QwAAAAAhPkMAAAAAITwMAQtBfyEYQwAAAAAhPEMAAAAAIT5DAAAAACE/QwAAAAAhPUF/IS4DQCASIBRBAWsiFDYCNCASIBIoAjAiE0EBaiIRIBIoAigiAUEAIAEgEU0bazYCMCASKAIsIBNBA3RqIgEoAgAhIwJAAkACQCABKAIEIhwgM04iEw0AICNBAWsiGSAwTiAZIBxyQQBIcg0AIBwgMGwgGWoiASAoTw0BIDQgAUECdGoiASgCAEF/Rw0AIAEgHjYCACASKAI0IhQgEigCKCIBRgRAIBJBKGoQaiASKAI0IRQgEigCKCEBCyASKAIsIBIoAjAgFGoiESABQQAgASARTRtrQQN0aiIBIBw2AgQgASAZNgIAIBIgEigCNEEBaiIUNgI0CwJAIBMNACAjQQFqIhMgME4gEyAcckEASHINACAcIDBsIBNqIgEgKE8NASA0IAFBAnRqIgEoAgBBf0cNACABIB42AgAgEigCNCIUIBIoAigiAUYEQCASQShqEGogEigCNCEUIBIoAighAQsgEigCLCASKAIwIBRqIhEgAUEAIAEgEU0ba0EDdGoiASAcNgIEIAEgEzYCACASIBIoAjRBAWoiFDYCNAsCQCAcQQFrIhMgI3JBAEggEyAzTnIgIyAwTnINACATIDBsICNqIgEgKE8NASA0IAFBAnRqIgEoAgBBf0cNACABIB42AgAgEigCNCIUIBIoAigiAUYEQCASQShqEGogEigCNCEUIBIoAighAQsgEigCLCASKAIwIBRqIhEgAUEAIAEgEU0ba0EDdGoiASATNgIEIAEgIzYCACASIBIoAjRBAWoiFDYCNAsgHEEBaiITICNyQQBIIBMgM05yICMgME5yDQEgEyAwbCAjaiIBIChPDQAgNCABQQJ0aiIBKAIAQX9HDQEgASAeNgIAIBIoAjQiFCASKAIoIgFGBEAgEkEoahBqIBIoAjQhFCASKAIoIQELIBIoAiwgEigCMCAUaiIRIAFBACABIBFNG2tBA3RqIgEgEzYCBCABICM2AgAgEiASKAI0QQFqIhQ2AjQMAQsgASAoQeCQwAAQdgALIBwgMGwgI2oiASAWTw0DIBUgAUECdGoqAgAiOyA8IDsgPF4iARshPCAcIBggARshGCAjIC4gARshLiAqQQFqISogPSA7kiE9ID4gOyAcspSSIT4gPyA7ICOylJIhPyAUDQALCyASKALIAiIBIBIoAsACRgRAIBJBwAJqEFwLIBIoAsQCIAFBHGxqIhEgPDgCGCARID44AhQgESA/OAIQIBEgPTgCDCARICo2AgggESAYNgIEIBEgLjYCACASIAFBAWo2AsgCIBIoAigiAUUNACASKAIsIAFBA3QQtQELQQAgH0EBaiIBIAEgMEYiARshHyABICBqIiAgM04NBgwBCwsgASAWQdCQwAAQdgALIBogAUHwj8AAEHYACyABIChBwJDAABB2AAsgFCAYQZCQwAAQdgALIBQgKEGAkMAAEHYACyASKALIAiE2IBIoAsQCITggEigCwAIhNwsCfkGY4MAAKQMAUEUEQEGo4MAAKQMAIQNBoODAACkDAAwBC0ICIQNBqODAAEICNwMAQZjgwABCATcDAEIBCyECIBJBuAFqQcCPwAApAwA3AwAgEiACNwPAAUGg4MAAIAJCAXw3AwAgEiADNwPIASASQbiPwAApAwA3A7ABAn4CQCAzQQBKBEAgM0EBayExIDBBAWshLSAvKAIEISQgLygCCCEhQQAhGEEAIRYCQAJAAkACQANAAkAgEiAYNgLEAiASIBhBAWoiHDYCzAIgEiAWNgLIAiASIBZBAWoiGjYCwAIgEkECNgLUAgJAICggGCAwbCAWaiIsSwRAICQgLEECdCIBaiEeIAEgNGohH0EAIRNBAiEVA0AgEkHAAmogE0EDdGohAQNAIBMgFUYNAyABIhFBCGohASATQQFqIRMgESgCACIjIC1ODQAgEUEEaigCACIgIDFODQALIBIgEzYC0AIgICAwbCAjaiI5IChPDQUgNCA5QQJ0IhlqKAIAIiZBf0YNACAfKAIAIilBf0YgJiApRnINACASQShqIBJBsAFqICkgJhBLAkAgEigCKARAIBIoAkAiIigCACIuICIoAgQiGyASKQMwpyIncSIVaikAAEKAgYKEiJCgwIB/gyICUARAQQghEwNAIBMgFWohASATQQhqIRMgLiABIBtxIhVqKQAAQoCBgoSIkKDAgH+DIgJQDQALCyAuIAJ6p0EDdiAVaiAbcSITaiwAACIVQQBOBEAgLiAuKQMAQoCBgoSIkKDAgH+DeqdBA3YiE2otAAAhFQsgEigCPCEUIBIoAjghESATIC5qICdBGXYiAToAACAuIBNBCGsgG3FqQQhqIAE6AAAgIiAiKAIIIBVBAXFrNgIIICIgIigCDEEBajYCDCAuIBNBaGxqIhNBGGsiAUEQakIANwIAIAFBCGpCgICAgMAANwIAIAFBBGogFDYCACABIBE2AgAMAQsgEigCOCETCyAhICxNDQYgE0EQayEnIB4qAgAiOyATQQRrIgEqAgBeBEAgASA7OAIACyATQQhrIgEoAgAiFCAnKAIARgRAICcQWwsgE0EMaygCACAUQQxsaiIRIDs4AgggESAYNgIEIBEgFjYCACABIBRBAWo2AgAgEkEoaiASQbABaiAmICkQSwJAIBIoAigEQCASKAJAIicoAgAiGyAnKAIEIikgEikDMKciFHEiFWopAABCgIGChIiQoMCAf4MiAlAEQEEIIRMDQCATIBVqIQEgE0EIaiETIBsgASApcSIVaikAAEKAgYKEiJCgwIB/gyICUA0ACwsgGyACeqdBA3YgFWogKXEiE2osAAAiFUEATgRAIBsgGykDAEKAgYKEiJCgwIB/g3qnQQN2IhNqLQAAIRULIBIoAjwhIiASKAI4IREgEyAbaiAUQRl2IgE6AAAgGyATQQhrIClxakEIaiABOgAAICcgJygCCCAVQQFxazYCCCAnICcoAgxBAWo2AgwgGyATQWhsaiITQRhrIgFBEGpCADcCACABQQhqQoCAgIDAADcCACABQQRqICI2AgAgASARNgIADAELIBIoAjghEwsgISA5TQ0HIBkgJGoqAgAiOyATQQRrIgEqAgBeBEAgASA7OAIACyATQQhrIhEoAgAiFCATQRBrIgEoAgBGBEAgARBbCyATQQxrKAIAIBRBDGxqIgEgOzgCCCABICA2AgQgASAjNgIAIBEgFEEBajYCACASKALQAiETIBIoAtQCIRUMAAsACyAtIBIoAsACSgRAIBIoAsQCIDFIDQILIBIoAsgCIC1ODQAgEigCzAIgMUgNAQtBACAaIBogMEYiARshFiAzIBwgGCABGyIYSg0BDAULCyAsIChB4JHAABB2AAsgOSAoQfCRwAAQdgALICwgIUGAksAAEHYACyA5ICFBkJLAABB2AAtBmODAACkDAFANAQtBqODAACkDACEDQaDgwAApAwAMAQtCAiEDQajgwABCAjcDAEGY4MAAQgE3AwBCAQshAkEAIRwgEkHYAWpBwI/AACkDADcDACASIAI3A+ABQaDgwAAgAkIBfDcDACASIAM3A+gBIBJBuI/AACkDADcD0AEgEigCsAEhESASKAK8ASEuIBIoArQBIhMEfiATQQFqrUIYfiICpyEBAkAgAkIgiFBFDQAgASABIBNBCWpqIhNLDQBBCCEcIBNB+f///wdJDQBBACEcCyATrSARIAFrrUIghoQFQgALIQcCQCAuRQ0AIBFBCGohASARKQMAQn+FQoCBgoSIkKDAgH+DIQIgEkEsaiEgIBJB9AFqIR4gEkE4aiEZA0AgAlAEQCABIRMDQCARQcABayERIBMpAwAgE0EIaiIBIRNCf4VCgIGChIiQoMCAf4MiAlANAAsLIBEgAnqnQQN2QWhsakEYayIWKAIAIRQgFkEEaigCACEaIBZBCGooAgAhFSASQcgCaiITIBZBFGooAgA2AgAgEiAWQQxqKQIANwPAAiAuQQFrIS4gAkIBfSACgyECIBVBgICAgHhGBEAgLkUNAgNAIAJQBEAgASETA0AgEUHAAWshESATKQMAIBNBCGoiASETQn+FQoCBgoSIkKDAgH+DIgJQDQALCyARIAJ6p0EDdkFobGoiFEEQaygCACITBEAgFEEMaygCACATQQxsELUBCyACQgF9IAKDIQIgLkEBayIuDQALDAILIB4gEikDwAI3AgAgHkEIaiATKAIANgIAIBIgFTYC8AEgEkEoaiAS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IykCADcCACABIBU2AgAMAQsgFEEIaiABQRBrIgFBDGoiESgCADYCACAUIAFBBGoiASkCADcCACABICMpAgA3AgAgESAjQQhqKAIANgIACyAcQRBqJAAgEigCgAIiAUGAgICAeEYgAUVyRQRAIBIoAoQCIAFBAnQQtQELIBJBmAJqIDggFUEcbGoiAUEYaigCADYCACASQZACaiABQRBqKQIANwMAIBJBiAJqIAFBCGopAgA3AwAgEiABKQIANwOAAiASQShqIgEgEkHAAmogFSASQYACahA4IAEgEkHQAWogFRBOIBIoAigEQAJ+QZjgwAApAwBQRQRAQajgwAApAwAhBEGg4MAAKQMADAELQgIhBEGo4MAAQgI3AwBBmODAAEIBNwMAQgELIQMgEigCPCEcIBIoAjghFiASKQMwIQJBoODAACADQgF8NwMAIB5BCGogCDcCACAeIAc3AgAgHCgCACIgIBwoAgQiGSACpyIUcSITaikAAEKAgYKEiJCgwIB/gyICUARAQQghEQNAIBEgE2ohASARQQhqIREgICABIBlxIhNqKQAAQoCBgoSIkKDAgH+DIgJQDQALCyAgIAJ6p0EDdiATaiAZcSIRaiwAACITQQBOBEAgICAgKQMAQoCBgoSIkKDAgH+DeqdBA3YiEWotAAAhEwsgESAgaiAUQRl2IgE6AAAgICARQQhrIBlxakEIaiABOgAAIBwgHCgCCCATQQFxazYCCCAcIBwoAgxBAWo2AgwgICARQVhsakEoayIBIBY2AgAgAUEEaiASKQIoNwIAIAFBDGogEkEwaikCADcCACABQRRqIBJBOGooAgA2AgAgAUEgaiAENwMAIAFBGGogAzcDAAsgFUEBaiIVIDZHDQALQZjgwAApAwAhAwsgEkFAayASQegBaikDADcDACASQThqIBJB4AFqKQMANwMAIBJBMGogEkHYAWopAwA3AwAgEkHQAGogGCkDADcDACASQdgAaiASQbACaikDADcDACASQeAAaiASQbgCaikDADcDACASQfAAaiAfKQMANwMAIBJB+ABqIBJB0AJqKQMANwMAIBJBgAFqIBJB2AJqKQMANwMAIBIgEikD0AE3AyggEiASKQOgAjcDSCASIBIpA8ACNwNoAn4gA1BFBEBBqODAACkDACEDQaDgwAApAwAMAQtCAiEDQajgwABC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IBYQtwELICRBCGoiESAVNgIAIBEgFjYCBCAiQRBqJAAgJCgCCARAICQoAgwhGQwBCyMAQTBrIhokACAjKAIEIR8gIygCACERIBpBJGogJEEwaiIZKAIAEJ0BAn8gGigCJARAIBpBIGogGkEsaigCACIVNgIAIBogGikCJCIDNwMYIBpBEGogA6ciIiAREKEBIBooAhQhEQJAIBooAhBFBEAgGkEYakEEciIWIBUgERC4ASAaIBVBAWoiFTYCICAaQQhqICIgHxChASAaKAIMIREgGigCCEUNAQsgGigCHCIVQYQBTwRAIBUQAgtBAQwCCyAWIBUgERC4ASAaKAIcIREgGUEEakGohcAAQRQQOyARELcBQQAMAQsgGigCKCERQQELIRUgJCARNgIEICQgFTYCACAaQTBqJAAgJCgCAARAICQoAgQhGQwBCyAkKAI0IRlBAAwCCyAkKAI0IhFBhAFJDQAgERACC0EBCyERIBwgGTYCBCAcIBE2AgAgJEFAayQAICUoAhQhEQJAAkAgJSgCEEUEQCAlIBE2AjggJSgCIA0BICAgJUE0aiAlQThqEKYBIhRBhAFPBEAgFBACICUoAjghEQsgEUGEAU8EQCAREAILICUoAjQiEUGEAUkNAiAREAIMAgsgFEGEAUkEQCARIQEMBgsgFBACIBEhAQwFCyAUEAdBAUcNAyAgIBQgERC3AQsgAkIBfSACgyECICdBAWsiJw0ACwsgHiAoKAIANgIAIBggKykDADcDACAlICUpAyA3A0ggJUEIaiAlQcgAahCLASAlKAIMIQEgJSgCCCIRDQUgNUEEakGkicAAQQkQOyABELcBDAULICVBADYCRCAlQoCAgIAQNwI8ICVBAzoAaCAlQSA2AlggJUEANgJkICVBkILAADYCYCAlQQA2AlAgJUEANgJIICUgJUE8ajYCXEHch8AAQTMgJUHIAGoQzAENASAlKAI8IRUgJSgCQCITICUoAkQQACEBIBUEQCATIBUQtQELIBRBhAFPBEAgFBACCyARQYQBSQ0AIBEQAgsgJSgCJCIRQYQBTwRAIBEQAgsgJSgCKEUNAiAlKAIsIhFBhAFJDQIgERACDAILQbiCwABBNyAlQe8AakGogsAAQbyDwAAQcAALICUoAkwhAQtBASERCyApIBE2AgAgKSABNgIEICVB8ABqJAACfyAd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JAAL/QUBBX8gAEEIayIBIABBBGsoAgAiA0F4cSIAaiECAkACQCADQQFxDQAgA0ECcUUNASABKAIAIgMgAGohACABIANrIgFB8N/AACgCAEYEQCACKAIEQQNxQQNHDQFB6N/AACAANgIAIAIgAigCBEF+cTYCBCABIABBAXI2AgQgAiAANgIADwsgASADEEoLAkACQAJAAkACQCACKAIEIgNBAnFFBEAgAkH038AAKAIARg0CIAJB8N/AACgCAEYNAyACIANBeHEiAhBKIAEgACACaiIAQQFyNgIEIAAgAWogADYCACABQfDfwAAoAgBHDQFB6N/AACAANgIADwsgAiADQX5xNgIEIAEgAEEBcjYCBCAAIAFqIAA2AgALIABBgAJJDQIgASAAEFNBACEBQYjgwABBiODAACgCAEEBayIANgIAIAANBEHQ3cAAKAIAIgAEQANAIAFBAWohASAAKAIIIgANAAsLQYjgwABB/x8gASABQf8fTRs2AgAPC0H038AAIAE2AgBB7N/AAEHs38AAKAIAIABqIgA2AgAgASAAQQFyNgIEQfDfwAAoAgAgAUYEQEHo38AAQQA2AgBB8N/AAEEANgIACyAAQYDgwAAoAgAiA00NA0H038AAKAIAIgJFDQNBACEAQezfwAAoAgAiBEEpSQ0CQcjdwAAhAQNAIAIgASgCACIFTwRAIAIgBSABKAIEakkNBAsgASgCCCEBDAALAAtB8N/AACABNgIAQejfwABB6N/AACgCACAAaiIANgIAIAEgAEEBcjYCBCAAIAFqIAA2AgAPCyAAQXhxQdjdwABqIQICf0Hg38AAKAIAIgNBASAAQQN2dCIAcUUEQEHg38AAIAAgA3I2AgAgAgwBCyACKAIICyEAIAIgATYCCCAAIAE2AgwgASACNgIMIAEgADYCCA8LQdDdwAAoAgAiAQRAA0AgAEEBaiEAIAEoAggiAQ0ACwtBiODAAEH/HyAAIABB/x9NGzYCACADIARPDQBBgODAAEF/NgIACwuqBQIEfwV+IwBBgAFrIgQkACABvSEIAn9BAiABIAFiDQAaIAhC/////////weDIgxCgICAgICAgAiEIAhCAYZC/v///////w+DIAhCNIinQf8PcSIFGyIKQgGDIQsgCEKAgICAgICA+P8AgyEJAkACQCAMUARAQQMgCUKAgICAgICA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QRgQyQEACyAGIAQQnwEAC6sBAQR/IwBBQGoiACQAIABBADYCFCAAQoCAgIAQNwIMIABBAzoAOCAAQSA2AiggAEEANgI0IABBkILAADYCMCAAQQA2AiAgAEEANgIYIAAgAEEMajYCLEHch8AAQTMgAEEYahDMAUUEQCAAKAIMIQEgACgCECICIAAoAhQQACABBEAgAiABELUBCyAAQUBrJAAPC0G4gsAAQTcgAEE/akGogsAAQbyDwAAQcAALngEBBX8CQAJAIAEoAgAiBBAZIgJFBEBBASEDDAELQQAhASACQQBIDQFB+dvAAC0AABpBASEBIAJBARCqASIDRQ0BCxAdIgUQFiIGEBchASAGQYQBTwRAIAYQAgsgASAEIAMQGCABQYQBTwRAIAEQAgsgBUGEAU8EQCAFEAILIAAgBBAZNgIIIAAgAzYCBCAAIAI2AgAPCyABIAIQnwEAC4cBAQV/IAAoAgAhASAAEFogACgCCCIFIAEgACgCDCICa0sEQCABIAVrIgMgAiADayICSyAAKAIAIgQgAWsgAk9xRQRAIAAoAgQiASAEIANrIgRBA3RqIAEgBUEDdGogA0EDdBDOASAAIAQ2AggPCyAAKAIEIgAgAUEDdGogACACQQN0ENABGgsLlAEBBH8jAEEQayIFJAAgASgCDCADbCACaiIEIAEoAggiBkkEQCABKAIEIARBA3RqIgQoAgQhBiACIAQoAgAiB0YgAyAGRnFFBEAgBUEIaiABIAcgBhBrIAUoAgghAiAEIAUoAgwiAzYCBCAEIAI2AgALIAAgAzYCBCAAIAI2AgAgBUEQaiQADwsgBCAGQayYwAAQdgALkgEBBH8jAEEQayICJABBASEEAkAgASgCFCIDQScgASgCGCIFKAIQIgERAAANACACQQRqIAAoAgBBgQIQMAJAIAItAARBgAFGBEAgAyACKAIIIAERAABFDQEMAgsgAyACLQAOIgAgAkEEamogAi0ADyAAayAFKAIMEQEADQELIANBJyABEQAAIQQLIAJBEGokACAEC4EBAQJ/IwBBQGoiAiQAIAIgATYCDCACIAA2AgggAkECNgIUIAJB5IPAADYCECACQgE3AhwgAiACQQhqrUKAgICAIIQ3AyggAiACQShqNgIYIAJBNGogAkEQahBIIAIoAjgiACACKAI8EAAgAigCNCIDBEAgACADELUBCyACQUBrJAALiwEBAn8jAEEwayICJAAgAkEAOgAMIAIgATYCCEEBIQMgAkEBNgIUIAJBtJ3AADYCECACQgE3AhwgAiAArUKAgICAoAWENwMoIAIgAkEoajYCGAJAIAJBCGpBmJvAACACQRBqEDcNACACLQAMRQRAIAFBvJ3AAEECEKQBDQELQQAhAwsgAkEwaiQAIAMLdwEBfyMAQSBrIgIkAAJ/IAAoAgBBgICAgHhHBEAgASAAKAIEIAAoAggQpAEMAQsgAkEYaiAAKAIMIgBBEGopAgA3AwAgAkEQaiAAQQhqKQIANwMAIAIgACkCADcDCCABKAIUIAEoAhggAkEIahA3CyACQSBqJAALewEBfyMAQUBqIgUkACAFIAE2AgwgBSAANgIIIAUgAzYCFCAFIAI2AhAgBUECNgIcIAVBkL7AADYCGCAFQgI3AiQgBSAFQRBqrUKAgICA0AiENwM4IAUgBUEIaq1CgICAgOAIhDcDMCAFIAVBMGo2AiAgBUEYaiAEEHwAC8ICAQN/IwBBMGsiAyQAIAMgAjYCBCADIAE2AgAgA0ECNgIMIANB/IrAADYCCCADQgI3AhQgAyADrUKAgICAoAKENwMoIAMgAK1CgICAgLAChDcDICADIANBIGo2AhACf0EAIQAjAEEQayICJAAgA0EIaiIBKAIMIQUCQAJ/AkACQAJAAkACQCABKAIEDgIAAQILIAUNAUEBIQVBASEBDAMLIAVFDQELIAJBBGogARBIIAIoAgwhACACKAIIIQEgAigCBAwCCyABKAIAIgAoAgAhBSAAKAIEIgBFBEBBASEBQQAhAAwBCyAAQQBIDQJB+dvAAC0AABpBASEEIABBARCqASIBRQ0CCyABIAUgABDQARogAAshBCABIAAQACAEBEAgASAEELUBCyACQRBqJAAMAQsgBCAAEJ8BAAsgA0EwaiQAC74SAwd/A34CfSABKAIcQQFxIQUgASgCCARAIAAqAgAhDCABKAIMIQQjAEHwCGsiACQAIAy8IQMCf0EDIAyLIg1DAACAf1sNABpBAiAMIAxcDQAaQQQgDbxFDQAaIANB////A3FBgICABHIgA0EBdEH+//8HcSADQRd2Qf8BcSICGyIGrSIJQgGDIQsgA0GAgID8B3FFBEAgAkGWAWshBkIBIQogC1AMAQtCgICAECAJQgGGIAZBgICABEYiBhshCUICQgEgBhshCkHofkHpfiAGGyACaiEGIAtQCyECIAAgBjsB6AggACAKNwPgCCAAQgE3A9gIIAAgCTcD0AggACACOgDqCAJ/AkACQAJAAkAgAkECayIIBEBBASECQfK6wABB87rAACADQQBIIgcbQfK6wABBASAHGyAFGyEHQQEgA0EfdiAFGyEFQQMgCEH/AXEiAyADQQNPG0ECaw4CAgMBCyAAQQM2ApgIIABB9LrAADYClAggAEECOwGQCEEBIQdBACEFQQEhAiAAQZAIagwECyAAQQM2ApgIIABB97rAADYClAggAEECOwGQCCAAQZAIagwDC0ECIQIgAEECOwGQCCAERQ0BIABBoAhqIAQ2AgAgAEEAOwGcCCAAQQI2ApgIIABBybrAADYClAggAEGQCGoMAgtBdEEFIAbBIgJBAEgbIAJsIgJBwP0ASQRAIABBkAhqIABB0AhqIgMgAEEQaiIGIAJBBHZBFWoiCEGAgH5BACAEayAEQYCAAk8bIgIQKSACwSECAkAgACgCkAhFBEAgAEHACGogAyAGIAggAhAfDAELIABByAhqIABBmAhqKAIANgIAIAAgACkCkAg3A8AICyACIAAuAcgIIgNIBEAgAEEIaiAAKALACCAAKALECCADIAQgAEGQCGoQRiAAKAIMIQIgACgCCAwDC0ECIQIgAEECOwGQCCAERQRAQQEhAiAAQQE2ApgIIABB+rrAADYClAggAEGQCGoMAwsgAEGgCGogBDYCACAAQQA7AZwIIABBAjYCmAggAEHJusAANgKUCCAAQZAIagwCC0GBu8AAQSVBqLvAABCDAQALQQEhAiAAQQE2ApgIIABB+rrAADYClAggAEGQCGoLIQQgACACNgLMCCAAIAQ2AsgIIAAgBTYCxAggACAHNgLACCABIABBwAhqEDkgAEHwCGokAA8LIAAoAgAiAL4hDCAAQf////8Hcb4iDUPKGw5aYCANQwAAAABcIA1DF7fROF1xckUEQCMAQYABayIAJAAgDLwhAgJ/QQMgDIsiDUMAAIB/Ww0AGkECIAwgDFwNABpBBCANvEUNABogAkH///8DcUGAgIAEciACQQF0Qf7//wdxIAJBF3ZB/wFxIgQbIgOtIglCAYMhCyACQYCAgPwHcUUEQCAEQZYBayEEQgEhCiALUAwBC0KAgIAQIAlCAYYgA0GAgIAERiIDGyEJQgJCASADGyEKQeh+Qel+IAMbIARqIQQgC1ALIQMgACAEOwF4IAAgCjcDcCAAQgE3A2ggACAJNwNgIAAgAzoAegJ/AkACQAJAIANBAmsiBgRAQQEhA0HyusAAQfO6wAAgAkEASCIEG0HyusAAQQEgBBsgBRshBEEBIAJBH3YgBRshBUEDIAZB/wFxIgIgAkEDTxtBAmsOAgMCAQsgAEEDNgIoIABB9LrAADYCJCAAQQI7ASBBASEEQQAhBUEBIQMgAEEgagwDCyAAQQM2AiggAEH3usAANgIkIABBAjsBICAAQSBqDAILIABBIGogAEHgAGoiAiAAQQ9qIgMQIwJAIAAoAiBFBEAgAEHQAGogAiADEB4MAQsgAEHYAGogAEEoaigCADYCACAAIAApAiA3A1ALIAAgACgCUCAAKAJUIAAvAVhBASAAQSBqEEYgACgCBCEDIAAoAgAMAQtBAiEDIABBAjsBICAAQTBqQQE2AgAgAEEAOwEsIABBAjYCKCAAQcm6wAA2AiQgAEEgagshAiAAIAM2AlwgACACNgJYIAAgBTYCVCAAIAQ2AlAgASAAQdAAahA5IABBgAFqJAAPCwJ/IwBBkAFrIgAkACAMvCEDAn9BAyAMiyINQwAAgH9bDQAaQQIgDCAMXA0AGkEEIA28RQ0AGiADQf///wNxQYCAgARyIANBAXRB/v//B3EgA0EXdkH/AXEiBBsiAq0iCUIBgyELIANBgICA/AdxRQRAIARBlgFrIQJCASEKIAtQDAELQoCAgBAgCUIBhiACQYCAgARGIgIbIQlCAkIBIAIbIQpB6H5B6X4gAhsgBGohAiALUAshBCAAIAI7AYgBIAAgCjcDgAEgAEIBNwN4IAAgCTcDcCAAIAQ6AIoBAkACQAJAAkACQAJAIARBAmsiBwRAQQEhBEHyusAAQfO6wAAgA0EASCICG0HyusAAQQEgAhsgBRshAkEBIANBH3YgBRshBkEDIAdB/wFxIgUgBUEDTxtBAmsOAgIDAQsgAEEDNgIgIABB9LrAADYCHCAAQQI7ARhBASECQQEhBAwDCyAAQQM2AiAgAEH3usAANgIcIABBAjsBGAwCCyAAQQM2AiAgAEECOwEYIABB+7rAADYCHAwBCyAAQRhqIABB8ABqIgUgAEEHaiIEECMCQCAAKAIYRQRAIABB4ABqIAUgBBAeDAELIABB6ABqIABBIGooAgA2AgAgACAAKQIYNwNgCyAAKAJkIgNFDQEgACgCYCIHLQAAQTBNDQIgAC4BaCEFIABBATYCICAAIAc2AhwgAEECOwEYQQEhBCADQQFHBEAgAEE4aiADQQFrNgIAIABBNGogB0EBajYCACAAQSxqQQE2AgAgAEEoakHIusAANgIAIABBAjsBMCAAQQI7ASRBAyEECyAAQRhqIARBDGxqIgMiB0EOagJ/IAVBAEoEQCADQQE2AgggA0HsusAANgIEIANBAjsBACAFQQFrDAELIABBGGogBEEMbGoiA0ECNgIIIANB7rrAADYCBCADQQI7AQBBASAFaws7AQAgB0EMakEBOwEAIARBAmohBAsgACAENgJsIAAgBjYCZCAAIAI2AmAgACAAQRhqNgJoIAEgAEHgAGoQOSAAQZABaiQADAILQbC3wABBIUHMusAAEIMBAAtB5LnAAEEfQdy6wAAQgwEACwvdBwMGfwV+AnwgASgCHEEBcSEDIAEoAggEQCABIAArAwAgAyABKAIMEC0PCyAAKQMAIgi/IQ0gCEL///////////8Ag78iDkQAgOA3ecNBQ2YgDkQAAAAAAAAAAGIgDkQtQxzr4jYaP2NxckUEQCABIA0gA0EBEDUPCwJ/QgAhCCMAQZABayIAJAAgDb0hCQJ/QQIgDSANYg0AGiAJQv////////8HgyIMQoCAgICAgIAIhCAJQgGGQv7///////8PgyAJQjSIp0H/D3EiBBsiCkIBgyELIAlCgICAgICAgPj/AIMhCAJAAkAgDFAEQEEDIAhCgICAgICAgPj/AFENAxogCFBFDQFBBAwDCyAIUA0BC0KAgICAgICAICAKQgGGIApCgICAgICAgAhRIgIbIQpCAkIBIAIbIQhBy3dBzHcgAhsgBGohBCALUAwBCyAEQbMIayEEQgEhCCALUAshAiAAIAQ7AYgBIAAgCDcDgAEgAEIBNwN4IAAgCjcDcCAAIAI6AIoBAkACQAJAAkACQAJAIAJBAmsiBQRAQQEhAkHyusAAQfO6wAAgCUIAUyIEG0HyusAAQQEgBBsgAxshBEEBIAlCP4inIAMbIQdBAyAFQf8BcSIDIANBA08bQQJrDgICAwELIABBAzYCICAAQfS6wAA2AhwgAEECOwEYQQEhBEEBIQIMAwsgAEEDNgIgIABB97rAADYCHCAAQQI7ARgMAgsgAEEDNgIgIABBAjsBGCAAQfu6wAA2AhwMAQsgAEEYaiAAQfAAaiIDIABBB2oiAhAjAkAgACgCGEUEQCAAQeAAaiADIAIQHgwBCyAAQegAaiAAQSBqKAIANgIAIAAgACkCGDcDYAsgACgCZCIFRQ0BIAAoAmAiBi0AAEEwTQ0CIAAuAWghAyAAQQE2AiAgACAGNgIcIABBAjsBGEEBIQIgBUEBRwRAIABBOGogBUEBazYCACAAQTRqIAZBAWo2AgAgAEEsakEBNgIAIABBKGpByLrAADYCACAAQQI7ATAgAEECOwEkQQMhAgsgAEEYaiACQQxsaiIFIgZBDmoCfyADQQBKBEAgBUEBNgIIIAVB7LrAADYCBCAFQQI7AQAgA0EBawwBCyAAQRhqIAJBDGxqIgVBAjYCCCAFQe66wAA2AgQgBUECOwEAQQEgA2sLOwEAIAZBDGpBATsBACACQQJqIQILIAAgAjYCbCAAIAc2AmQgACAENgJgIAAgAEEYajYCaCABIABB4ABqEDkgAEGQAWokAAwCC0Gwt8AAQSFBzLrAABCDAQALQeS5wABBH0HcusAAEIMBAAsLaQIBfwF+IwBBMGsiAyQAIAMgATYCBCADIAA2AgAgA0EDNgIMIANBvKPAADYCCCADQgI3AhQgA0KAgICA4AUiBCADQQRqrYQ3AyggAyAEIAOthDcDICADIANBIGo2AhAgA0EIaiACEHwAC24BAX8jAEEwayIBJAAgASAANgIAIAFBgAE2AgQgAUECNgIMIAFB9MHAADYCCCABQgI3AhQgASABQQRqrUKAgICA4AWENwMoIAEgAa1CgICAgOAFhDcDICABIAFBIGo2AhAgAUEIakHgvsAAEHwAC2kCAX8BfiMAQTBrIgMkACADIAE2AgQgAyAANgIAIANBAjYCDCADQdy8wAA2AgggA0ICNwIUIANCgICAgOAFIgQgA62ENwMoIAMgBCADQQRqrYQ3AyAgAyADQSBqNgIQIANBCGogAhB8AAtpAgF/AX4jAEEwayIDJAAgAyAANgIAIAMgATYCBCADQQI2AgwgA0GUwsAANgIIIANCAjcCFCADQoCAgIDgBSIEIANBBGqthDcDKCADIAQgA62ENwMgIAMgA0EgajYCECADQQhqIAIQfAALaQIBfwF+IwBBMGsiAyQAIAMgADYCACADIAE2AgQgA0ECNgIMIANByMLAADYCCCADQgI3AhQgA0KAgICA4AUiBCADQQRqrYQ3AyggAyAEIAOthDcDICADIANBIGo2AhAgA0EIaiACEHwAC2YAIwBBMGsiACQAQfjbwAAtAAAEQCAAQQI2AgwgAEGon8AANgIIIABCATcCFCAAIAE2AiwgACAAQSxqrUKAgICA4AWENwMgIAAgAEEgajYCECAAQQhqQdCfwAAQfAALIABBMGokAAtdAQF/IwBBMGsiASQAIAFBFjYCDCABQaCSwAA2AgggAUEBNgIUIAFB9LvAADYCECABQgE3AhwgASABQQhqrUKAgICA4AiENwMoIAEgAUEoajYCGCABQRBqIAAQfAALOQEBfyMAQSBrIgAkACAAQQA2AhggAEEBNgIMIABB1KDAADYCCCAAQgQ3AhAgAEEIakGIocAAEHwAC7QCAQN/IwBBIGsiAiQAIAJBEGoiAyAAQRBqKQIANwMAIAJBCGoiBCAAQQhqKQIANwMAIAJBATsBHCACIAE2AhggAiAAKQIANwMAIwBBIGsiACQAIAIoAhghASAAQRBqIAMpAgA3AwAgAEEIaiAEKQIANwMAIAAgAjYCHCAAIAE2AhggACACKQIANwMAQQAhAiMAQRBrIgEkACAAKAIMIQMCQAJAAkACQCAAKAIEDgIAAQILIAMNAUEBIQMMAgsgAw0AIAAoAgAiAygCBCECIAMoAgAhAwwBCyABQYCAgIB4NgIAIAEgADYCDCABQZygwAAgACgCGCAAKAIcIgAtABwgAC0AHRBXAAsgASACNgIEIAEgAzYCACABQYCgwAAgACgCGCAAKAIcIgAtABwgAC0AHRBXAAtAAQJ/AkAgAARAIAAoAgANASAAKAIIIQIgACgCBCEBIABBGBC1ASABBEAgAiABQQJ0ELUBCw8LEMIBAAsQwwEAC08BAn9B+dvAAC0AABogASgCBCECIAEoAgAhA0EIQQQQqgEiAQRAIAEgAjYCBCABIAM2AgAgAEHwn8AANgIEIAAgATYCAA8LQQRBCBDJAQALTwECfyAAKAIEIQIgACgCACEDAkAgACgCCCIALQAARQ0AIANBuL7AAEEEIAIoAgwRAQBFDQBBAQ8LIAAgAUEKRjoAACADIAEgAigCEBEAAAtCAQF/IAIgACgCACAAKAIIIgNrSwRAIAAgAyACEF8gACgCCCEDCyAAKAIEIANqIAEgAhDQARogACACIANqNgIIQQALQgEBfyACIAAoAgAgACgCCCIDa0sEQCAAIAMgAhBhIAAoAgghAwsgACgCBCADaiABIAIQ0AEaIAAgAiADajYCCEEACzgAAkAgAWlBAUdBgICAgHggAWsgAElyDQAgAARAQfnbwAAtAAAaIAAgARCqASIBRQ0BCyABDwsAC0EBAX8jAEEgayIDJAAgA0EANgIQIANBATYCBCADQgQ3AgggAyABNgIcIAMgADYCGCADIANBGGo2AgAgAyACEHwACzkAAkACfyACQYCAxABHBEBBASAAIAIgASgCEBEAAA0BGgsgAw0BQQALDwsgACADIAQgASgCDBEBAAs8AQF/An8gAS0AAUUEQBARIQJBAAwBCxASIQJBAQshAyAAIAE2AhAgAEEANgIIIAAgAjYCBCAAIAM2AgALNwIBfwF8IAEoAhxBAXEhAiAAKwMAIQMgASgCCARAIAEgAyACIAEoAgwQLQ8LIAEgAyACQQAQNQsuAAJAIANpQQFHQYCAgIB4IANrIAFJcg0AIAAgASADIAIQoAEiAEUNACAADwsACzYBAX8jAEEgayIBJAAgAUEANgIYIAFBATYCDCABQbjSwAA2AgggAUIENwIQIAFBCGogABB8AAs5AQF/QQEhAgJAIAAgARBNDQAgASgCFEG5u8AAQQIgASgCGCgCDBEBAA0AIABBBGogARBNIQILIAILmAQCBn8BfiMAQRBrIgUkACAFIAA2AgwgBUEMaiEHIwBBEGsiAiQAIAIgASgCFEGgiMAAQQUgASgCGCgCDBEBADoADCACIAE2AgggAkEAOgANIAJBADYCBCMAQUBqIgAkACACQQRqIgMoAgAhBCADAn9BASADLQAIDQAaIAMoAgQiASgCHCIGQQRxRQRAQQEgASgCFEG8vsAAQcC+wAAgBBtBAkEBIAQbIAEoAhgoAgwRAQANARogByABQZyIwAAoAgARAAAMAQsgBEUEQEEBIAEoAhRBwb7AAEECIAEoAhgoAgwRAQANARogASgCHCEGCyAAQQE6ABsgACABKQIUNwIMIABBoL7AADYCNCAAIABBG2o2AhQgACABKQIINwIkIAEpAgAhCCAAIAY2AjggACABKAIQNgIsIAAgAS0AIDoAPCAAIAg3AhwgACAAQQxqNgIwQQEgByAAQRxqQZyIwAAoAgARAAANABogACgCMEG+vsAAQQIgACgCNCgCDBEBAAs6AAggAyAEQQFqNgIAIABBQGskAAJ/IAItAAwiAEEARyADKAIAIgFFDQAaQQEgAA0AGiACKAIIIQACQCABQQFHDQAgAi0ADUUNACAALQAcQQRxDQBBASAAKAIUQcO+wABBASAAKAIYKAIMEQEADQEaCyAAKAIUQbi7wABBASAAKAIYKAIMEQEACyACQRBqJAAgBUEQaiQACzUBAX8gASgCBCECAkAgASgCCEUNACABKAIMIgFBhAFJDQAgARACCyAAIAI2AgQgAEEANgIACyIAAkAgAARAIAAoAgBBf0YNASAAKAIQDwsQwgEACxDDAQALIgACQCAABEAgACgCAEF/Rg0BIAAoAhQPCxDCAQALEMMBAAslACAARQRAQeCMwABBMhDBAQALIAAgAiADIAQgBSABKAIQEQsACx8BAn4gACkDACICIAJCP4ciA4UgA30gAkIAWSABEFALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARBgALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARCQALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARGgALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARHAALIwAgAEUEQEHgjMAAQTIQwQEACyAAIAIgAyAEIAEoAhARHgALLAAgACABQS5GIAAtAARBAEdyOgAEIAAoAgAiACgCFCABIAAoAhgoAhARAAALJgEBfyAAKAIAIgFBgICAgHhyQYCAgIB4RwRAIAAoAgQgARC1AQsLCgBBCCAAEMkBAAshACAARQRAQeCMwABBMhDBAQALIAAgAiADIAEoAhARAwALIgAgAC0AAEUEQCABQZXBwABBBRAxDwsgAUGawcAAQQQQMQsfACAARQRAQeCMwABBMhDBAQALIAAgAiABKAIQEQAACxgBAX8gACgCACIBBEAgACgCBCABELUBCwsbABAQIQIgAEEANgIIIAAgAjYCBCAAIAE2AgALHQEBfxAQIQIgAEEANgIIIAAgAjYCBCAAIAE2AgALFAAgACgCACIA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EABLAAAABgoAAA4AAABFcnJvcmR1cGxpY2F0ZSBmaWVsZCBgYADRARAAEQAAAOIBEAABAAAAYHVud3JhcF90aHJvd2AgZmFpbGVkY2x1c3RlcmluZ19vcHRpb25zc21vb3RoX2JvdW5kYXJpZXNyZXR1cm5fYm91bmRhcnlfcmVjdHMAAAAAAAAA//////////9IAhAAQeCEwAAL8wdDbHVzdGVyU3VtbWFyeW51bV9waXhlbHNzdW1fZGVuc2l0eXN1bV94X2RlbnNpdHlzdW1feV9kZW5zaXR5bWF4X2RlbnNpdHltYXhfZGVuc2l0eV9sb2NhdGlvbnVzZV9kaXNqb2ludF9zZXRhZGRfdW5sYWJlbGVkdHJ1bmNhdGVfdG9fbWF4X2RlbnNpdHlwZXJmb3JtX25laWdoYm9yX21hcF9ncm91cGluZ3VuaW9uX3RocmVzaG9sZHRocmVzaG9sZF9zY2FsZXJkZW5zaXR5X2xvd2VyYm91bmRfc2NhbGVyZGVuc2l0eV91cHBlcmJvdW5kX3NjYWxlcnRpbHRlZF90aHJlc2hvbGRfcGxhbmVncm91cGluZ19kZW5zaXR5X3NjYWxlcgC8AhAAEAAAAMwCEAANAAAA2QIQABcAAADwAhAAHQAAAA0DEAAPAAAAHAMQABAAAAAsAxAAGQAAAEUDEAAZAAAAXgMQABYAAAB0AxAAFwAAAE1hcCBrZXkgaXMgbm90IGEgc3RyaW5nIGFuZCBjYW5ub3QgYmUgYW4gb2JqZWN0IGtleQAAAAAABAAAAAQAAAAMAAAARXJyb3IAAAANAAAADAAAAAQAAAAOAAAADwAAAAoAAABjbHVzdGVyaW5nX29wdGlvbnNzbW9vdGhfYm91bmRhcmllc3JldHVybl9ib3VuZGFyeV9yZWN0c3N0cnVjdCBGaW5kQ2x1c3RlcnNPcHRpb25zRmluZENsdXN0ZXJzUmVzdWx0c3VtbWFyaWVzYm91bmRhcmllc2JvdW5kYXJ5X3JlY3RzRmluZENsdXN0ZXJzT3B0aW9uc0AEEAASAAAAUgQQABEAAABjBBAAFQAAABAAAAAEAAAABAAAABEAAABjYWxsZWQgYFJlc3VsdDo6dW53cmFwKClgIG9uIGFuIGBFcnJgIHZhbHVlZGVuc2l0eV9jbHVzdGVyaW5nX3dhc20vc3Jj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IGBOb25lYCB2YWx1ZWluZGV4IG91dCBvZiBib3VuZHM6IHRoZSBsZW4gaXMgIGJ1dCB0aGUgaW5kZXggaXMgAAAAJx4QACAAAABHHhAAEgAAAAAAAAAEAAAABAAAAEoAAAA9PSE9bWF0Y2hlc2Fzc2VydGlvbiBgbGVmdCAgcmlnaHRgIGZhaWxlZAogIGxlZnQ6IAogcmlnaHQ6IACHHhAAEAAAAJceEAAXAAAArh4QAAkAAAAgcmlnaHRgIGZhaWxlZDogCiAgbGVmdDogAAAAhx4QABAAAADQHhAAEAAAAOAeEAAJAAAArh4QAAkAAAA6IAAAAQAAAAAAAAAMHxAAAgAAAAAAAAAMAAAABAAAAEsAAABMAAAATQAAACAgICAsICwKKCgKLGxpYnJhcnkvY29yZS9zcmMvZm10L251bS5ycwBEHxAAGwAAAGkAAAAXAAAAMHgwMDAxMDIwMzA0MDUwNjA3MDgwOTEwMTExMjEzMTQxNTE2MTcxODE5MjAyMTIyMjMyNDI1MjYyNzI4MjkzMDMxMzIzMzM0MzUzNjM3MzgzOTQwNDE0MjQzNDQ0NTQ2NDc0ODQ5NTA1MTUyNTM1NDU1NTY1NzU4NTk2MDYxNjI2MzY0NjU2NjY3Njg2OTcwNzE3MjczNzQ3NTc2Nzc3ODc5ODA4MTgyODM4NDg1ODY4Nzg4ODk5MDkxOTI5Mzk0OTU5Njk3OTg5OTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBsaWJyYXJ5L2NvcmUvc3JjL2ZtdC9tb2QucnNmYWxzZXRydWUAAHogEAAbAAAAjQkAACYAAAB6IBAAGwAAAJYJAAAaAAAAcmFuZ2Ugc3RhcnQgaW5kZXggIG91dCBvZiByYW5nZSBmb3Igc2xpY2Ugb2YgbGVuZ3RoIMAgEAASAAAA0iAQACIAAAByYW5nZSBlbmQgaW5kZXggBCEQABAAAADSIBAAIgAAAHNsaWNlIGluZGV4IHN0YXJ0cyBhdCAgYnV0IGVuZHMgYXQgACQhEAAWAAAAOiEQAA0AAABbLi4uXWJlZ2luIDw9IGVuZCAoIDw9ICkgd2hlbiBzbGljaW5nIGBgXSEQAA4AAABrIRAABAAAAG8hEAAQAAAAfyEQAAEA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", import.meta.url));
  const I = ho();
  (typeof A == "string" || typeof Request == "function" && A instanceof Request || typeof URL == "function" && A instanceof URL) && (A = fetch(A));
  const { instance: g, module: B } = await so(await A, I);
  return lo(g, B);
}
async function fo(A, I, g, B = {}) {
  await rE(), (/* @__PURE__ */ new Date()).getTime();
  let Q = new oE(I, g, A), E = no(Q, {
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
  Q.free();
  let C = [];
  for (let [i, e] of E.summaries)
    C.push({
      identifier: i,
      sum_density: e.sum_density,
      mean_x: e.sum_x_density / e.sum_density,
      mean_y: e.sum_y_density / e.sum_density,
      max_density: e.max_density,
      max_density_location: e.max_density_location,
      pixel_count: e.num_pixels,
      boundary: E.boundaries.get(i),
      boundary_rect_approximation: E.boundary_rects.get(i)
    });
  return C = C.filter((i) => i.boundary != null), (/* @__PURE__ */ new Date()).getTime(), C;
}
export {
  yo as F,
  jg as I,
  fo as S,
  uo as w,
  wo as y
};
