import { coordinator as Ed, MosaicClient as Td, Param as gu, makeClient as m9, isSelection as m0, queryFieldInfo as y9 } from "@uwdata/mosaic-core";
import * as T from "@uwdata/mosaic-sql";
import { Query as Fs, sql as ms, column as fa, literal as Jx, eq as b9, cast as k1, row_number as x9, desc as w9, count as k9 } from "@uwdata/mosaic-sql";
import * as _9 from "@uwdata/vgplot";
import { createAPIContext as S9 } from "@uwdata/vgplot";
import { parseSpec as dv, astToDOM as M9 } from "@uwdata/mosaic-spec";
const Qn = 2, hv = 4, $d = 8, Ws = 16, ji = 32, Rl = 64, pv = 128, xo = 256, Yf = 512, en = 1024, _o = 2048, Ea = 4096, Po = 8192, Al = 16384, Fd = 32768, El = 65536, _1 = 1 << 17, C9 = 1 << 18, Nd = 1 << 19, vv = 1 << 20, y0 = 1 << 21, gv = 1 << 22, rl = 1 << 23, ii = Symbol("$state"), mv = Symbol("legacy props"), R9 = Symbol(""), yv = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), bv = 3, Ns = 8, A9 = !1;
var zd = Array.isArray, E9 = Array.prototype.indexOf, xv = Array.from, ju = Object.defineProperty, ya = Object.getOwnPropertyDescriptor, ew = Object.getOwnPropertyDescriptors, T9 = Object.prototype, $9 = Array.prototype, wv = Object.getPrototypeOf, S1 = Object.isExtensible;
function vs(t) {
  return typeof t == "function";
}
const Ft = () => {
};
function kv(t) {
  for (var e = 0; e < t.length; e++)
    t[e]();
}
function F9() {
  var t, e, r = new Promise((n, i) => {
    t = n, e = i;
  });
  return { promise: r, resolve: t, reject: e };
}
function M1(t, e) {
  if (Array.isArray(t))
    return t;
  if (!(Symbol.iterator in t))
    return Array.from(t);
  const r = [];
  for (const n of t)
    if (r.push(n), r.length === e) break;
  return r;
}
function tw(t) {
  return t === this.v;
}
function _v(t, e) {
  return t != t ? e == e : t !== e || t !== null && typeof t == "object" || typeof t == "function";
}
function N9(t, e) {
  return t !== e;
}
function rw(t) {
  return !_v(t, this.v);
}
function z9() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function Sv(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function O9() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function B9(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function D9() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function P9(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function L9() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function q9() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function I9(t) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function j9() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function U9() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function W9() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
function H9() {
  throw new Error("https://svelte.dev/e/svelte_boundary_reset_onerror");
}
let V9 = !1;
const Mv = 1, Cv = 2, nw = 4, G9 = 8, X9 = 16, Y9 = 1, K9 = 4, Z9 = 8, Q9 = 16, J9 = 1, eM = 2, tM = 4, ow = 1, rM = 2, iw = "[", Rv = "[!", Av = "]", nl = {}, qr = Symbol(), nM = "http://www.w3.org/1999/xhtml", oM = "@attach";
let Zr = null;
function zs(t) {
  Zr = t;
}
function C1(t) {
  return (
    /** @type {T} */
    lw().get(t)
  );
}
function R1(t, e) {
  return lw().set(t, e), e;
}
function gt(t, e = !1, r) {
  Zr = {
    p: Zr,
    c: null,
    e: null,
    s: t,
    x: null,
    l: null
  };
}
function mt(t) {
  var e = (
    /** @type {ComponentContext} */
    Zr
  ), r = e.e;
  if (r !== null) {
    e.e = null;
    for (var n of r)
      Fw(n);
  }
  return t !== void 0 && (e.x = t), Zr = e.p, t ?? /** @type {T} */
  {};
}
function aw() {
  return !0;
}
function lw(t) {
  return Zr === null && Sv(), Zr.c ??= new Map(iM(Zr) || void 0);
}
function iM(t) {
  let e = t.p;
  for (; e !== null; ) {
    const r = e.c;
    if (r !== null)
      return r;
    e = e.p;
  }
  return null;
}
function mc(t) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
function aM() {
  console.warn("https://svelte.dev/e/select_multiple_invalid_value");
}
function lM() {
  console.warn("https://svelte.dev/e/svelte_boundary_reset_noop");
}
let lt = !1;
function Do(t) {
  lt = t;
}
let Mt;
function mn(t) {
  if (t === null)
    throw mc(), nl;
  return Mt = t;
}
function Pi() {
  return mn(
    /** @type {TemplateNode} */
    /* @__PURE__ */ Vo(Mt)
  );
}
function ee(t) {
  if (lt) {
    if (/* @__PURE__ */ Vo(Mt) !== null)
      throw mc(), nl;
    Mt = t;
  }
}
function Ev(t = 1) {
  if (lt) {
    for (var e = t, r = Mt; e--; )
      r = /** @type {TemplateNode} */
      /* @__PURE__ */ Vo(r);
    Mt = r;
  }
}
function Kf() {
  for (var t = 0, e = Mt; ; ) {
    if (e.nodeType === Ns) {
      var r = (
        /** @type {Comment} */
        e.data
      );
      if (r === Av) {
        if (t === 0) return e;
        t -= 1;
      } else (r === iw || r === Rv) && (t += 1);
    }
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Vo(e)
    );
    e.remove(), e = n;
  }
}
function sw(t) {
  if (!t || t.nodeType !== Ns)
    throw mc(), nl;
  return (
    /** @type {Comment} */
    t.data
  );
}
function mo(t) {
  if (typeof t != "object" || t === null || ii in t)
    return t;
  const e = wv(t);
  if (e !== T9 && e !== $9)
    return t;
  var r = /* @__PURE__ */ new Map(), n = zd(t), i = /* @__PURE__ */ ge(0), a = il, l = (u) => {
    if (il === a)
      return u();
    var c = At, f = il;
    Fn(null), F1(a);
    var d = u();
    return Fn(c), F1(f), d;
  };
  return n && r.set("length", /* @__PURE__ */ ge(
    /** @type {any[]} */
    t.length
  )), new Proxy(
    /** @type {any} */
    t,
    {
      defineProperty(u, c, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && j9();
        var d = r.get(c);
        return d === void 0 ? d = l(() => {
          var p = /* @__PURE__ */ ge(f.value);
          return r.set(c, p), p;
        }) : W(d, f.value, !0), !0;
      },
      deleteProperty(u, c) {
        var f = r.get(c);
        if (f === void 0) {
          if (c in u) {
            const d = l(() => /* @__PURE__ */ ge(qr));
            r.set(c, d), Ou(i);
          }
        } else
          W(f, qr), Ou(i);
        return !0;
      },
      get(u, c, f) {
        if (c === ii)
          return t;
        var d = r.get(c), p = c in u;
        if (d === void 0 && (!p || ya(u, c)?.writable) && (d = l(() => {
          var m = mo(p ? u[c] : qr), y = /* @__PURE__ */ ge(m);
          return y;
        }), r.set(c, d)), d !== void 0) {
          var g = h(d);
          return g === qr ? void 0 : g;
        }
        return Reflect.get(u, c, f);
      },
      getOwnPropertyDescriptor(u, c) {
        var f = Reflect.getOwnPropertyDescriptor(u, c);
        if (f && "value" in f) {
          var d = r.get(c);
          d && (f.value = h(d));
        } else if (f === void 0) {
          var p = r.get(c), g = p?.v;
          if (p !== void 0 && g !== qr)
            return {
              enumerable: !0,
              configurable: !0,
              value: g,
              writable: !0
            };
        }
        return f;
      },
      has(u, c) {
        if (c === ii)
          return !0;
        var f = r.get(c), d = f !== void 0 && f.v !== qr || Reflect.has(u, c);
        if (f !== void 0 || vt !== null && (!d || ya(u, c)?.writable)) {
          f === void 0 && (f = l(() => {
            var g = d ? mo(u[c]) : qr, m = /* @__PURE__ */ ge(g);
            return m;
          }), r.set(c, f));
          var p = h(f);
          if (p === qr)
            return !1;
        }
        return d;
      },
      set(u, c, f, d) {
        var p = r.get(c), g = c in u;
        if (n && c === "length")
          for (var m = f; m < /** @type {Source<number>} */
          p.v; m += 1) {
            var y = r.get(m + "");
            y !== void 0 ? W(y, qr) : m in u && (y = l(() => /* @__PURE__ */ ge(qr)), r.set(m + "", y));
          }
        if (p === void 0)
          (!g || ya(u, c)?.writable) && (p = l(() => /* @__PURE__ */ ge(void 0)), W(p, mo(f)), r.set(c, p));
        else {
          g = p.v !== qr;
          var w = l(() => mo(f));
          W(p, w);
        }
        var x = Reflect.getOwnPropertyDescriptor(u, c);
        if (x?.set && x.set.call(d, f), !g) {
          if (n && typeof c == "string") {
            var k = (
              /** @type {Source<number>} */
              r.get("length")
            ), S = Number(c);
            Number.isInteger(S) && S >= k.v && W(k, S + 1);
          }
          Ou(i);
        }
        return !0;
      },
      ownKeys(u) {
        h(i);
        var c = Reflect.ownKeys(u).filter((p) => {
          var g = r.get(p);
          return g === void 0 || g.v !== qr;
        });
        for (var [f, d] of r)
          d.v !== qr && !(f in u) && c.push(f);
        return c;
      },
      setPrototypeOf() {
        U9();
      }
    }
  );
}
function A1(t) {
  try {
    if (t !== null && typeof t == "object" && ii in t)
      return t[ii];
  } catch {
  }
  return t;
}
function sM(t, e) {
  return Object.is(A1(t), A1(e));
}
var b0, uw, cw, fw;
function x0() {
  if (b0 === void 0) {
    b0 = window, uw = /Firefox/.test(navigator.userAgent);
    var t = Element.prototype, e = Node.prototype, r = Text.prototype;
    cw = ya(e, "firstChild").get, fw = ya(e, "nextSibling").get, S1(t) && (t.__click = void 0, t.__className = void 0, t.__attributes = null, t.__style = void 0, t.__e = void 0), S1(r) && (r.__t = void 0);
  }
}
function Uo(t = "") {
  return document.createTextNode(t);
}
// @__NO_SIDE_EFFECTS__
function tn(t) {
  return cw.call(t);
}
// @__NO_SIDE_EFFECTS__
function Vo(t) {
  return fw.call(t);
}
function ne(t, e) {
  if (!lt)
    return /* @__PURE__ */ tn(t);
  var r = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ tn(Mt)
  );
  if (r === null)
    r = Mt.appendChild(Uo());
  else if (e && r.nodeType !== bv) {
    var n = Uo();
    return r?.before(n), mn(n), n;
  }
  return mn(r), r;
}
function We(t, e) {
  if (!lt) {
    var r = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ tn(
        /** @type {Node} */
        t
      )
    );
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ Vo(r) : r;
  }
  return Mt;
}
function le(t, e = 1, r = !1) {
  let n = lt ? Mt : t;
  for (var i; e--; )
    i = n, n = /** @type {TemplateNode} */
    /* @__PURE__ */ Vo(n);
  if (!lt)
    return n;
  if (r && n?.nodeType !== bv) {
    var a = Uo();
    return n === null ? i?.after(a) : n.before(a), mn(a), a;
  }
  return mn(n), /** @type {TemplateNode} */
  n;
}
function dw(t) {
  t.textContent = "";
}
function Tv() {
  return !1;
}
const uM = /* @__PURE__ */ new WeakMap();
function hw(t) {
  var e = vt;
  if (e === null)
    return At.f |= rl, t;
  if ((e.f & Fd) === 0) {
    if ((e.f & pv) === 0)
      throw !e.parent && t instanceof Error && pw(t), t;
    e.b.error(t);
  } else
    Uu(t, e);
}
function Uu(t, e) {
  for (; e !== null; ) {
    if ((e.f & pv) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (r) {
        t = r;
      }
    e = e.parent;
  }
  throw t instanceof Error && pw(t), t;
}
function pw(t) {
  const e = uM.get(t);
  e && (ju(t, "message", {
    value: e.message
  }), ju(t, "stack", {
    value: e.stack
  }));
}
const cM = typeof requestIdleCallback > "u" ? (t) => setTimeout(t, 1) : requestIdleCallback;
let Wu = [], Hu = [];
function vw() {
  var t = Wu;
  Wu = [], kv(t);
}
function gw() {
  var t = Hu;
  Hu = [], kv(t);
}
function Tl(t) {
  Wu.length === 0 && queueMicrotask(vw), Wu.push(t);
}
function fM(t) {
  Hu.length === 0 && cM(gw), Hu.push(t);
}
function dM() {
  Wu.length > 0 && vw(), Hu.length > 0 && gw();
}
function hM(t) {
  let e = 0, r = yl(0), n;
  return () => {
    EM() && (h(r), yc(() => (e === 0 && (n = Go(() => t(() => Ou(r)))), e += 1, () => {
      Tl(() => {
        e -= 1, e === 0 && (n?.(), n = void 0, Ou(r));
      });
    })));
  };
}
var pM = El | Nd | pv;
function vM(t, e, r) {
  new gM(t, e, r);
}
class gM {
  pending = !1;
  /** @type {Boundary | null} */
  parent;
  /** @type {TemplateNode} */
  #e;
  /** @type {TemplateNode} */
  #t;
  /** @type {BoundaryProps} */
  #r;
  /** @type {((anchor: Node) => void)} */
  #n;
  /** @type {Effect} */
  #u;
  /** @type {Effect | null} */
  #o = null;
  /** @type {Effect | null} */
  #i = null;
  /** @type {Effect | null} */
  #l = null;
  /** @type {DocumentFragment | null} */
  #a = null;
  #s = 0;
  #f = !1;
  /**
   * A source containing the number of pending async deriveds/expressions.
   * Only created if `$effect.pending()` is used inside the boundary,
   * otherwise updating the source results in needless `Batch.ensure()`
   * calls followed by no-op flushes
   * @type {Source<number> | null}
   */
  #c = null;
  #p = () => {
    this.#c && Bs(this.#c, this.#s);
  };
  #d = hM(() => (this.#c = yl(this.#s), () => {
    this.#c = null;
  }));
  /**
   * @param {TemplateNode} node
   * @param {BoundaryProps} props
   * @param {((anchor: Node) => void)} children
   */
  constructor(e, r, n) {
    this.#e = e, this.#r = r, this.#n = n, this.#t = Mt, this.parent = /** @type {Effect} */
    vt.b, this.pending = !!this.#r.pending, this.#u = Ta(() => {
      vt.b = this, lt && Pi();
      const i = this.#r.pending;
      if (lt && i)
        this.#i = Kr(() => i(this.#e)), wa.enqueue(() => {
          this.#o = this.#h(() => (wa.ensure(), Kr(() => this.#n(this.#e)))), this.#s > 0 ? this.#v() : (ba(
            /** @type {Effect} */
            this.#i,
            () => {
              this.#i = null;
            }
          ), this.pending = !1);
        });
      else {
        try {
          this.#o = Kr(() => n(this.#e));
        } catch (a) {
          this.error(a);
        }
        this.#s > 0 ? this.#v() : this.pending = !1;
      }
    }, pM), lt && (this.#e = Mt);
  }
  has_pending_snippet() {
    return !!this.#r.pending;
  }
  /**
   * @param {() => Effect | null} fn
   */
  #h(e) {
    var r = vt, n = At, i = Zr;
    ci(this.#u), Fn(this.#u), zs(this.#u.ctx);
    try {
      return e();
    } catch (a) {
      return hw(a), null;
    } finally {
      ci(r), Fn(n), zs(i);
    }
  }
  #v() {
    const e = (
      /** @type {(anchor: Node) => void} */
      this.#r.pending
    );
    this.#o !== null && (this.#a = document.createDocumentFragment(), mM(this.#o, this.#a)), this.#i === null && (this.#i = Kr(() => e(this.#e)));
  }
  /** @param {1 | -1} d */
  #g(e) {
    this.#s += e, this.#s === 0 && (this.pending = !1, this.#i && ba(this.#i, () => {
      this.#i = null;
    }), this.#a && (this.#e.before(this.#a), this.#a = null));
  }
  /** @param {1 | -1} d */
  update_pending_count(e) {
    this.has_pending_snippet() ? this.#g(e) : this.parent && this.parent.#g(e), w0.add(this.#p);
  }
  get_effect_pending() {
    return this.#d(), h(
      /** @type {Source<number>} */
      this.#c
    );
  }
  /** @param {unknown} error */
  error(e) {
    var r = this.#r.onerror;
    let n = this.#r.failed;
    this.#o && (ln(this.#o), this.#o = null), this.#i && (ln(this.#i), this.#i = null), this.#l && (ln(this.#l), this.#l = null), lt && (mn(this.#t), Ev(), mn(Kf()));
    var i = !1, a = !1;
    const l = () => {
      if (i) {
        lM();
        return;
      }
      i = !0, a && H9(), this.#s = 0, this.#l !== null && ba(this.#l, () => {
        this.#l = null;
      }), this.pending = !0, this.#o = this.#h(() => (this.#f = !1, Kr(() => this.#n(this.#e)))), this.#s > 0 ? this.#v() : this.pending = !1;
    };
    if (this.#f || !r && !n)
      throw e;
    var u = At;
    try {
      Fn(null), a = !0, r?.(e, l), a = !1;
    } catch (c) {
      Uu(c, this.#u && this.#u.parent);
    } finally {
      Fn(u);
    }
    n && Tl(() => {
      this.#l = this.#h(() => {
        this.#f = !0;
        try {
          return Kr(() => {
            n(
              this.#e,
              () => e,
              () => l
            );
          });
        } catch (c) {
          return Uu(
            c,
            /** @type {Effect} */
            this.#u.parent
          ), null;
        } finally {
          this.#f = !1;
        }
      });
    });
  }
}
function mM(t, e) {
  for (var r = t.nodes_start, n = t.nodes_end; r !== null; ) {
    var i = r === n ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Vo(r)
    );
    e.append(r), r = i;
  }
}
function yM() {
  for (var t = (
    /** @type {Effect} */
    vt.b
  ); t !== null && !t.has_pending_snippet(); )
    t = t.parent;
  return t === null && z9(), t;
}
// @__NO_SIDE_EFFECTS__
function Od(t) {
  var e = Qn | _o, r = At !== null && (At.f & Qn) !== 0 ? (
    /** @type {Derived} */
    At
  ) : null;
  return vt === null || r !== null && (r.f & xo) !== 0 ? e |= xo : vt.f |= Nd, {
    ctx: Zr,
    deps: null,
    effects: null,
    equals: tw,
    f: e,
    fn: t,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      qr
    ),
    wv: 0,
    parent: r ?? vt,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function bM(t, e) {
  let r = (
    /** @type {Effect | null} */
    vt
  );
  r === null && O9();
  var n = (
    /** @type {Boundary} */
    r.b
  ), i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), a = yl(
    /** @type {V} */
    qr
  ), l = null, u = !At;
  return $M(() => {
    try {
      var c = t();
    } catch (m) {
      c = Promise.reject(m);
    }
    var f = () => c;
    i = l?.then(f, f) ?? Promise.resolve(c), l = i;
    var d = (
      /** @type {Batch} */
      ar
    ), p = n.pending;
    u && (n.update_pending_count(1), p || d.increment());
    const g = (m, y = void 0) => {
      l = null, p || d.activate(), y ? y !== yv && (a.f |= rl, Bs(a, y)) : ((a.f & rl) !== 0 && (a.f ^= rl), Bs(a, m)), u && (n.update_pending_count(-1), p || d.decrement()), ww();
    };
    if (i.then(g, (m) => g(null, m || "unknown")), d)
      return () => {
        queueMicrotask(() => d.neuter());
      };
  }), new Promise((c) => {
    function f(d) {
      function p() {
        d === i ? c(a) : f(i);
      }
      d.then(p, p);
    }
    f(i);
  });
}
// @__NO_SIDE_EFFECTS__
function oe(t) {
  const e = /* @__PURE__ */ Od(t);
  return Mw(e), e;
}
// @__NO_SIDE_EFFECTS__
function mw(t) {
  const e = /* @__PURE__ */ Od(t);
  return e.equals = rw, e;
}
function yw(t) {
  var e = t.effects;
  if (e !== null) {
    t.effects = null;
    for (var r = 0; r < e.length; r += 1)
      ln(
        /** @type {Effect} */
        e[r]
      );
  }
}
function xM(t) {
  for (var e = t.parent; e !== null; ) {
    if ((e.f & Qn) === 0)
      return (
        /** @type {Effect} */
        e
      );
    e = e.parent;
  }
  return null;
}
function $v(t) {
  var e, r = vt;
  ci(xM(t));
  try {
    yw(t), e = Ew(t);
  } finally {
    ci(r);
  }
  return e;
}
function bw(t) {
  var e = $v(t);
  if (t.equals(e) || (t.v = e, t.wv = Rw()), !$l)
    if (Os !== null)
      Os.set(t, t.v);
    else {
      var r = (da || (t.f & xo) !== 0) && t.deps !== null ? Ea : en;
      zn(t, r);
    }
}
function xw(t, e, r) {
  const n = Od;
  if (e.length === 0) {
    r(t.map(n));
    return;
  }
  var i = ar, a = (
    /** @type {Effect} */
    vt
  ), l = wM(), u = yM();
  Promise.all(e.map((c) => /* @__PURE__ */ bM(c))).then((c) => {
    i?.activate(), l();
    try {
      r([...t.map(n), ...c]);
    } catch (f) {
      (a.f & Al) === 0 && Uu(f, a);
    }
    i?.deactivate(), ww();
  }).catch((c) => {
    u.error(c);
  });
}
function wM() {
  var t = vt, e = At, r = Zr;
  return function() {
    ci(t), Fn(e), zs(r);
  };
}
function ww() {
  ci(null), Fn(null), zs(null);
}
const mu = /* @__PURE__ */ new Set();
let ar = null, Df = null, Os = null, w0 = /* @__PURE__ */ new Set(), Zf = [];
function kw() {
  const t = (
    /** @type {() => void} */
    Zf.shift()
  );
  Zf.length > 0 && queueMicrotask(kw), t();
}
let gl = [], Bd = null, k0 = !1, Pf = !1;
class wa {
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
  #e = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<() => void>}
   */
  #t = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #r = 0;
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #n = null;
  /**
   * True if an async effect inside this batch resolved and
   * its parent branch was already deleted
   */
  #u = !1;
  /**
   * Async effects (created inside `async_derived`) encountered during processing.
   * These run after the rest of the batch has updated, since they should
   * always have the latest values
   * @type {Effect[]}
   */
  #o = [];
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
  #l = [];
  /**
   * The same as `#render_effects`, but for `$effect` (which runs after)
   * @type {Effect[]}
   */
  #a = [];
  /**
   * Block effects, which may need to re-run on subsequent flushes
   * in order to update internal sources (e.g. each block items)
   * @type {Effect[]}
   */
  #s = [];
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Effect[]}
   */
  #f = [];
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Effect[]}
   */
  #c = [];
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
  process(e) {
    gl = [], Df = null;
    var r = null;
    if (mu.size > 1) {
      r = /* @__PURE__ */ new Map(), Os = /* @__PURE__ */ new Map();
      for (const [a, l] of this.current)
        r.set(a, { v: a.v, wv: a.wv }), a.v = l;
      for (const a of mu)
        if (a !== this)
          for (const [l, u] of a.#e)
            r.has(l) || (r.set(l, { v: l.v, wv: l.wv }), l.v = u);
    }
    for (const a of e)
      this.#p(a);
    if (this.#o.length === 0 && this.#r === 0) {
      this.#h();
      var n = this.#l, i = this.#a;
      this.#l = [], this.#a = [], this.#s = [], Df = ar, ar = null, E1(n), E1(i), ar === null ? ar = this : mu.delete(this), this.#n?.resolve();
    } else
      this.#d(this.#l), this.#d(this.#a), this.#d(this.#s);
    if (r) {
      for (const [a, { v: l, wv: u }] of r)
        a.wv <= u && (a.v = l);
      Os = null;
    }
    for (const a of this.#o)
      Bu(a);
    for (const a of this.#i)
      Bu(a);
    this.#o = [], this.#i = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #p(e) {
    e.f ^= en;
    for (var r = e.first; r !== null; ) {
      var n = r.f, i = (n & (ji | Rl)) !== 0, a = i && (n & en) !== 0, l = a || (n & Po) !== 0 || this.skipped_effects.has(r);
      if (!l && r.fn !== null) {
        if (i)
          r.f ^= en;
        else if ((n & en) === 0)
          if ((n & hv) !== 0)
            this.#a.push(r);
          else if ((n & gv) !== 0) {
            var u = r.b?.pending ? this.#i : this.#o;
            u.push(r);
          } else Dd(r) && ((r.f & Ws) !== 0 && this.#s.push(r), Bu(r));
        var c = r.first;
        if (c !== null) {
          r = c;
          continue;
        }
      }
      var f = r.parent;
      for (r = r.next; r === null && f !== null; )
        r = f.next, f = f.parent;
    }
  }
  /**
   * @param {Effect[]} effects
   */
  #d(e) {
    for (const r of e)
      ((r.f & _o) !== 0 ? this.#f : this.#c).push(r), zn(r, en);
    e.length = 0;
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} value
   */
  capture(e, r) {
    this.#e.has(e) || this.#e.set(e, r), this.current.set(e, e.v);
  }
  activate() {
    ar = this;
  }
  deactivate() {
    ar = null, Df = null;
    for (const e of w0)
      if (w0.delete(e), e(), ar !== null)
        break;
  }
  neuter() {
    this.#u = !0;
  }
  flush() {
    gl.length > 0 ? _w() : this.#h(), ar === this && (this.#r === 0 && mu.delete(this), this.deactivate());
  }
  /**
   * Append and remove branches to/from the DOM
   */
  #h() {
    if (!this.#u)
      for (const e of this.#t)
        e();
    this.#t.clear();
  }
  increment() {
    this.#r += 1;
  }
  decrement() {
    if (this.#r -= 1, this.#r === 0) {
      for (const e of this.#f)
        zn(e, _o), ml(e);
      for (const e of this.#c)
        zn(e, Ea), ml(e);
      this.#l = [], this.#a = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#t.add(e);
  }
  settled() {
    return (this.#n ??= F9()).promise;
  }
  static ensure() {
    if (ar === null) {
      const e = ar = new wa();
      mu.add(ar), Pf || wa.enqueue(() => {
        ar === e && e.flush();
      });
    }
    return ar;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    Zf.length === 0 && queueMicrotask(kw), Zf.unshift(e);
  }
}
function kM(t) {
  var e = Pf;
  Pf = !0;
  try {
    for (var r; ; ) {
      if (dM(), gl.length === 0 && (ar?.flush(), gl.length === 0))
        return Bd = null, /** @type {T} */
        r;
      _w();
    }
  } finally {
    Pf = e;
  }
}
function _w() {
  var t = xs;
  k0 = !0;
  try {
    var e = 0;
    for (T1(!0); gl.length > 0; ) {
      var r = wa.ensure();
      if (e++ > 1e3) {
        var n, i;
        _M();
      }
      r.process(gl), ol.clear();
    }
  } finally {
    k0 = !1, T1(t), Bd = null;
  }
}
function _M() {
  try {
    L9();
  } catch (t) {
    Uu(t, Bd);
  }
}
function E1(t) {
  var e = t.length;
  if (e !== 0) {
    for (var r = 0; r < e; ) {
      var n = t[r++];
      if ((n.f & (Al | Po)) === 0 && Dd(n)) {
        var i = ar ? ar.current.size : 0;
        if (Bu(n), n.deps === null && n.first === null && n.nodes_start === null && (n.teardown === null && n.ac === null ? Bw(n) : n.fn = null), ar !== null && ar.current.size > i && (n.f & vv) !== 0)
          break;
      }
    }
    for (; r < e; )
      ml(t[r++]);
  }
}
function ml(t) {
  for (var e = Bd = t; e.parent !== null; ) {
    e = e.parent;
    var r = e.f;
    if (k0 && e === vt && (r & Ws) !== 0)
      return;
    if ((r & (Rl | ji)) !== 0) {
      if ((r & en) === 0) return;
      e.f ^= en;
    }
  }
  gl.push(e);
}
const ol = /* @__PURE__ */ new Map();
function yl(t, e) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: t,
    reactions: null,
    equals: tw,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function ge(t, e) {
  const r = yl(t);
  return Mw(r), r;
}
// @__NO_SIDE_EFFECTS__
function Fv(t, e = !1, r = !0) {
  const n = yl(t);
  return e || (n.equals = rw), n;
}
function W(t, e, r = !1) {
  At !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!No || (At.f & _1) !== 0) && aw() && (At.f & (Qn | Ws | gv | _1)) !== 0 && !Oi?.includes(t) && W9();
  let n = r ? mo(e) : e;
  return Bs(t, n);
}
function Bs(t, e) {
  if (!t.equals(e)) {
    var r = t.v;
    $l ? ol.set(t, e) : ol.set(t, r), t.v = e;
    var n = wa.ensure();
    n.capture(t, r), (t.f & Qn) !== 0 && ((t.f & _o) !== 0 && $v(
      /** @type {Derived} */
      t
    ), zn(t, (t.f & xo) === 0 ? en : Ea)), t.wv = Rw(), Sw(t, _o), vt !== null && (vt.f & en) !== 0 && (vt.f & (ji | Rl)) === 0 && (fo === null ? SM([t]) : fo.push(t));
  }
  return e;
}
function Ou(t) {
  W(t, t.v + 1);
}
function Sw(t, e) {
  var r = t.reactions;
  if (r !== null)
    for (var n = r.length, i = 0; i < n; i++) {
      var a = r[i], l = a.f, u = (l & _o) === 0;
      u && zn(a, e), (l & Qn) !== 0 ? Sw(
        /** @type {Derived} */
        a,
        Ea
      ) : u && ml(
        /** @type {Effect} */
        a
      );
    }
}
let xs = !1;
function T1(t) {
  xs = t;
}
let $l = !1;
function $1(t) {
  $l = t;
}
let At = null, No = !1;
function Fn(t) {
  At = t;
}
let vt = null;
function ci(t) {
  vt = t;
}
let Oi = null;
function Mw(t) {
  At !== null && (Oi === null ? Oi = [t] : Oi.push(t));
}
let hn = null, Vn = 0, fo = null;
function SM(t) {
  fo = t;
}
let Cw = 1, Vu = 0, il = Vu;
function F1(t) {
  il = t;
}
let da = !1;
function Rw() {
  return ++Cw;
}
function Dd(t) {
  var e = t.f;
  if ((e & _o) !== 0)
    return !0;
  if ((e & Ea) !== 0) {
    var r = t.deps, n = (e & xo) !== 0;
    if (r !== null) {
      var i, a, l = (e & Yf) !== 0, u = n && vt !== null && !da, c = r.length;
      if ((l || u) && (vt === null || (vt.f & Al) === 0)) {
        var f = (
          /** @type {Derived} */
          t
        ), d = f.parent;
        for (i = 0; i < c; i++)
          a = r[i], (l || !a?.reactions?.includes(f)) && (a.reactions ??= []).push(f);
        l && (f.f ^= Yf), u && d !== null && (d.f & xo) === 0 && (f.f ^= xo);
      }
      for (i = 0; i < c; i++)
        if (a = r[i], Dd(
          /** @type {Derived} */
          a
        ) && bw(
          /** @type {Derived} */
          a
        ), a.wv > t.wv)
          return !0;
    }
    (!n || vt !== null && !da) && zn(t, en);
  }
  return !1;
}
function Aw(t, e, r = !0) {
  var n = t.reactions;
  if (n !== null && !Oi?.includes(t))
    for (var i = 0; i < n.length; i++) {
      var a = n[i];
      (a.f & Qn) !== 0 ? Aw(
        /** @type {Derived} */
        a,
        e,
        !1
      ) : e === a && (r ? zn(a, _o) : (a.f & en) !== 0 && zn(a, Ea), ml(
        /** @type {Effect} */
        a
      ));
    }
}
function Ew(t) {
  var e = hn, r = Vn, n = fo, i = At, a = da, l = Oi, u = Zr, c = No, f = il, d = t.f;
  hn = /** @type {null | Value[]} */
  null, Vn = 0, fo = null, da = (d & xo) !== 0 && (No || !xs || At === null), At = (d & (ji | Rl)) === 0 ? t : null, Oi = null, zs(t.ctx), No = !1, il = ++Vu, t.ac !== null && (t.ac.abort(yv), t.ac = null);
  try {
    t.f |= y0;
    var p = (
      /** @type {Function} */
      (0, t.fn)()
    ), g = t.deps;
    if (hn !== null) {
      var m;
      if (Qf(t, Vn), g !== null && Vn > 0)
        for (g.length = Vn + hn.length, m = 0; m < hn.length; m++)
          g[Vn + m] = hn[m];
      else
        t.deps = g = hn;
      if (!da || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (d & Qn) !== 0 && /** @type {import('#client').Derived} */
      t.reactions !== null)
        for (m = Vn; m < g.length; m++)
          (g[m].reactions ??= []).push(t);
    } else g !== null && Vn < g.length && (Qf(t, Vn), g.length = Vn);
    if (aw() && fo !== null && !No && g !== null && (t.f & (Qn | Ea | _o)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      fo.length; m++)
        Aw(
          fo[m],
          /** @type {Effect} */
          t
        );
    return i !== null && i !== t && (Vu++, fo !== null && (n === null ? n = fo : n.push(.../** @type {Source[]} */
    fo))), (t.f & rl) !== 0 && (t.f ^= rl), p;
  } catch (y) {
    return hw(y);
  } finally {
    t.f ^= y0, hn = e, Vn = r, fo = n, At = i, da = a, Oi = l, zs(u), No = c, il = f;
  }
}
function MM(t, e) {
  let r = e.reactions;
  if (r !== null) {
    var n = E9.call(r, t);
    if (n !== -1) {
      var i = r.length - 1;
      i === 0 ? r = e.reactions = null : (r[n] = r[i], r.pop());
    }
  }
  r === null && (e.f & Qn) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (hn === null || !hn.includes(e)) && (zn(e, Ea), (e.f & (xo | Yf)) === 0 && (e.f ^= Yf), yw(
    /** @type {Derived} **/
    e
  ), Qf(
    /** @type {Derived} **/
    e,
    0
  ));
}
function Qf(t, e) {
  var r = t.deps;
  if (r !== null)
    for (var n = e; n < r.length; n++)
      MM(t, r[n]);
}
function Bu(t) {
  var e = t.f;
  if ((e & Al) === 0) {
    zn(t, en);
    var r = vt, n = xs;
    vt = t, xs = !0;
    try {
      (e & Ws) !== 0 ? FM(t) : zw(t), Nw(t);
      var i = Ew(t);
      t.teardown = typeof i == "function" ? i : null, t.wv = Cw;
      var a;
      A9 && V9 && (t.f & _o) !== 0 && t.deps;
    } finally {
      xs = n, vt = r;
    }
  }
}
function h(t) {
  var e = t.f, r = (e & Qn) !== 0;
  if (At !== null && !No) {
    var n = vt !== null && (vt.f & Al) !== 0;
    if (!n && !Oi?.includes(t)) {
      var i = At.deps;
      if ((At.f & y0) !== 0)
        t.rv < Vu && (t.rv = Vu, hn === null && i !== null && i[Vn] === t ? Vn++ : hn === null ? hn = [t] : (!da || !hn.includes(t)) && hn.push(t));
      else {
        (At.deps ??= []).push(t);
        var a = t.reactions;
        a === null ? t.reactions = [At] : a.includes(At) || a.push(At);
      }
    }
  } else if (r && /** @type {Derived} */
  t.deps === null && /** @type {Derived} */
  t.effects === null) {
    var l = (
      /** @type {Derived} */
      t
    ), u = l.parent;
    u !== null && (u.f & xo) === 0 && (l.f ^= xo);
  }
  if ($l) {
    if (ol.has(t))
      return ol.get(t);
    if (r) {
      l = /** @type {Derived} */
      t;
      var c = l.v;
      return ((l.f & en) === 0 && l.reactions !== null || Tw(l)) && (c = $v(l)), ol.set(l, c), c;
    }
  } else if (r) {
    if (l = /** @type {Derived} */
    t, Os?.has(l))
      return Os.get(l);
    Dd(l) && bw(l);
  }
  if ((t.f & rl) !== 0)
    throw t.v;
  return t.v;
}
function Tw(t) {
  if (t.v === qr) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps)
    if (ol.has(e) || (e.f & Qn) !== 0 && Tw(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function Go(t) {
  var e = No;
  try {
    return No = !0, t();
  } finally {
    No = e;
  }
}
const CM = -7169;
function zn(t, e) {
  t.f = t.f & CM | e;
}
function RM(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (ii in t)
      _0(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const r = t[e];
        typeof r == "object" && r && ii in r && _0(r);
      }
  }
}
function _0(t, e = /* @__PURE__ */ new Set()) {
  if (typeof t == "object" && t !== null && // We don't want to traverse DOM elements
  !(t instanceof EventTarget) && !e.has(t)) {
    e.add(t), t instanceof Date && t.getTime();
    for (let n in t)
      try {
        _0(t[n], e);
      } catch {
      }
    const r = wv(t);
    if (r !== Object.prototype && r !== Array.prototype && r !== Map.prototype && r !== Set.prototype && r !== Date.prototype) {
      const n = ew(r);
      for (let i in n) {
        const a = n[i].get;
        if (a)
          try {
            a.call(t);
          } catch {
          }
      }
    }
  }
}
function $w(t) {
  vt === null && At === null && P9(), At !== null && (At.f & xo) !== 0 && vt === null && D9(), $l && B9();
}
function AM(t, e) {
  var r = e.last;
  r === null ? e.last = e.first = t : (r.next = t, t.prev = r, e.last = t);
}
function vi(t, e, r, n = !0) {
  var i = vt;
  i !== null && (i.f & Po) !== 0 && (t |= Po);
  var a = {
    ctx: Zr,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | _o,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: i,
    b: i && i.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (r)
    try {
      Bu(a), a.f |= Fd;
    } catch (c) {
      throw ln(a), c;
    }
  else e !== null && ml(a);
  var l = r && a.deps === null && a.first === null && a.nodes_start === null && a.teardown === null && (a.f & Nd) === 0;
  if (!l && n && (i !== null && AM(a, i), At !== null && (At.f & Qn) !== 0 && (t & Rl) === 0)) {
    var u = (
      /** @type {Derived} */
      At
    );
    (u.effects ??= []).push(a);
  }
  return a;
}
function EM() {
  return At !== null && !No;
}
function Nv(t) {
  const e = vi($d, null, !1);
  return zn(e, en), e.teardown = t, e;
}
function yn(t) {
  $w();
  var e = (
    /** @type {Effect} */
    vt.f
  ), r = !At && (e & ji) !== 0 && (e & Fd) === 0;
  if (r) {
    var n = (
      /** @type {ComponentContext} */
      Zr
    );
    (n.e ??= []).push(t);
  } else
    return Fw(t);
}
function Fw(t) {
  return vi(hv | vv, t, !1);
}
function Qe(t) {
  return $w(), vi($d | vv, t, !0);
}
function TM(t) {
  wa.ensure();
  const e = vi(Rl, t, !0);
  return (r = {}) => new Promise((n) => {
    r.outro ? ba(e, () => {
      ln(e), n(void 0);
    }) : (ln(e), n(void 0));
  });
}
function Hs(t) {
  return vi(hv, t, !1);
}
function $M(t) {
  return vi(gv | Nd, t, !0);
}
function yc(t, e = 0) {
  return vi($d | e, t, !0);
}
function Ee(t, e = [], r = []) {
  xw(e, r, (n) => {
    vi($d, () => t(...n.map(h)), !0);
  });
}
function Ta(t, e = 0) {
  var r = vi(Ws | e, t, !0);
  return r;
}
function Kr(t, e = !0) {
  return vi(ji, t, !0, e);
}
function Nw(t) {
  var e = t.teardown;
  if (e !== null) {
    const r = $l, n = At;
    $1(!0), Fn(null);
    try {
      e.call(null);
    } finally {
      $1(r), Fn(n);
    }
  }
}
function zw(t, e = !1) {
  var r = t.first;
  for (t.first = t.last = null; r !== null; ) {
    r.ac?.abort(yv);
    var n = r.next;
    (r.f & Rl) !== 0 ? r.parent = null : ln(r, e), r = n;
  }
}
function FM(t) {
  for (var e = t.first; e !== null; ) {
    var r = e.next;
    (e.f & ji) === 0 && ln(e), e = r;
  }
}
function ln(t, e = !0) {
  var r = !1;
  (e || (t.f & C9) !== 0) && t.nodes_start !== null && t.nodes_end !== null && (Ow(
    t.nodes_start,
    /** @type {TemplateNode} */
    t.nodes_end
  ), r = !0), zw(t, e && !r), Qf(t, 0), zn(t, Al);
  var n = t.transitions;
  if (n !== null)
    for (const a of n)
      a.stop();
  Nw(t);
  var i = t.parent;
  i !== null && i.first !== null && Bw(t), t.next = t.prev = t.teardown = t.ctx = t.deps = t.fn = t.nodes_start = t.nodes_end = t.ac = null;
}
function Ow(t, e) {
  for (; t !== null; ) {
    var r = t === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Vo(t)
    );
    t.remove(), t = r;
  }
}
function Bw(t) {
  var e = t.parent, r = t.prev, n = t.next;
  r !== null && (r.next = n), n !== null && (n.prev = r), e !== null && (e.first === t && (e.first = n), e.last === t && (e.last = r));
}
function ba(t, e) {
  var r = [];
  zv(t, r, !0), Dw(r, () => {
    ln(t), e && e();
  });
}
function Dw(t, e) {
  var r = t.length;
  if (r > 0) {
    var n = () => --r || e();
    for (var i of t)
      i.out(n);
  } else
    e();
}
function zv(t, e, r) {
  if ((t.f & Po) === 0) {
    if (t.f ^= Po, t.transitions !== null)
      for (const l of t.transitions)
        (l.is_global || r) && e.push(l);
    for (var n = t.first; n !== null; ) {
      var i = n.next, a = (n.f & El) !== 0 || (n.f & ji) !== 0;
      zv(n, e, a ? r : !1), n = i;
    }
  }
}
function Ov(t) {
  Pw(t, !0);
}
function Pw(t, e) {
  if ((t.f & Po) !== 0) {
    t.f ^= Po, (t.f & en) === 0 && (zn(t, _o), ml(t));
    for (var r = t.first; r !== null; ) {
      var n = r.next, i = (r.f & El) !== 0 || (r.f & ji) !== 0;
      Pw(r, i ? e : !1), r = n;
    }
    if (t.transitions !== null)
      for (const a of t.transitions)
        (a.is_global || e) && a.in();
  }
}
function NM(t, e) {
  if (e) {
    const r = document.body;
    t.autofocus = !0, Tl(() => {
      document.activeElement === r && t.focus();
    });
  }
}
let N1 = !1;
function Lw() {
  N1 || (N1 = !0, document.addEventListener(
    "reset",
    (t) => {
      Promise.resolve().then(() => {
        if (!t.defaultPrevented)
          for (
            const e of
            /**@type {HTMLFormElement} */
            t.target.elements
          )
            e.__on_r?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possiblity of stopPropagation)
    { capture: !0 }
  ));
}
function Pd(t) {
  var e = At, r = vt;
  Fn(null), ci(null);
  try {
    return t();
  } finally {
    Fn(e), ci(r);
  }
}
function zM(t, e, r, n = r) {
  t.addEventListener(e, () => Pd(r));
  const i = t.__on_r;
  i ? t.__on_r = () => {
    i(), n(!0);
  } : t.__on_r = () => n(!0), Lw();
}
const qw = /* @__PURE__ */ new Set(), S0 = /* @__PURE__ */ new Set();
function Iw(t, e, r, n = {}) {
  function i(a) {
    if (n.capture || $u.call(e, a), !a.cancelBubble)
      return Pd(() => r?.call(this, a));
  }
  return t.startsWith("pointer") || t.startsWith("touch") || t === "wheel" ? Tl(() => {
    e.addEventListener(t, i, n);
  }) : e.addEventListener(t, i, n), i;
}
function OM(t, e, r, n, i) {
  var a = { capture: n, passive: i }, l = Iw(t, e, r, a);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && Nv(() => {
    e.removeEventListener(t, l, a);
  });
}
function Tr(t) {
  for (var e = 0; e < t.length; e++)
    qw.add(t[e]);
  for (var r of S0)
    r(t);
}
let z1 = null;
function $u(t) {
  var e = this, r = (
    /** @type {Node} */
    e.ownerDocument
  ), n = t.type, i = t.composedPath?.() || [], a = (
    /** @type {null | Element} */
    i[0] || t.target
  );
  z1 = t;
  var l = 0, u = z1 === t && t.__root;
  if (u) {
    var c = i.indexOf(u);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      t.__root = e;
      return;
    }
    var f = i.indexOf(e);
    if (f === -1)
      return;
    c <= f && (l = c);
  }
  if (a = /** @type {Element} */
  i[l] || t.target, a !== e) {
    ju(t, "currentTarget", {
      configurable: !0,
      get() {
        return a || r;
      }
    });
    var d = At, p = vt;
    Fn(null), ci(null);
    try {
      for (var g, m = []; a !== null; ) {
        var y = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var w = a["__" + n];
          if (w != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          t.target === a))
            if (zd(w)) {
              var [x, ...k] = w;
              x.apply(a, [t, ...k]);
            } else
              w.call(a, t);
        } catch (S) {
          g ? m.push(S) : g = S;
        }
        if (t.cancelBubble || y === e || y === null)
          break;
        a = y;
      }
      if (g) {
        for (let S of m)
          queueMicrotask(() => {
            throw S;
          });
        throw g;
      }
    } finally {
      t.__root = e, delete t.currentTarget, Fn(d), ci(p);
    }
  }
}
function Bv(t) {
  var e = document.createElement("template");
  return e.innerHTML = t.replaceAll("<!>", "<!---->"), e.content;
}
function Zn(t, e) {
  var r = (
    /** @type {Effect} */
    vt
  );
  r.nodes_start === null && (r.nodes_start = t, r.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function Se(t, e) {
  var r = (e & ow) !== 0, n = (e & rM) !== 0, i, a = !t.startsWith("<!>");
  return () => {
    if (lt)
      return Zn(Mt, null), Mt;
    i === void 0 && (i = Bv(a ? t : "<!>" + t), r || (i = /** @type {Node} */
    /* @__PURE__ */ tn(i)));
    var l = (
      /** @type {TemplateNode} */
      n || uw ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (r) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(l)
      ), c = (
        /** @type {TemplateNode} */
        l.lastChild
      );
      Zn(u, c);
    } else
      Zn(l, l);
    return l;
  };
}
// @__NO_SIDE_EFFECTS__
function BM(t, e, r = "svg") {
  var n = !t.startsWith("<!>"), i = (e & ow) !== 0, a = `<${r}>${n ? t : "<!>" + t}</${r}>`, l;
  return () => {
    if (lt)
      return Zn(Mt, null), Mt;
    if (!l) {
      var u = (
        /** @type {DocumentFragment} */
        Bv(a)
      ), c = (
        /** @type {Element} */
        /* @__PURE__ */ tn(u)
      );
      if (i)
        for (l = document.createDocumentFragment(); /* @__PURE__ */ tn(c); )
          l.appendChild(
            /** @type {Node} */
            /* @__PURE__ */ tn(c)
          );
      else
        l = /** @type {Element} */
        /* @__PURE__ */ tn(c);
    }
    var f = (
      /** @type {TemplateNode} */
      l.cloneNode(!0)
    );
    if (i) {
      var d = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(f)
      ), p = (
        /** @type {TemplateNode} */
        f.lastChild
      );
      Zn(d, p);
    } else
      Zn(f, f);
    return f;
  };
}
// @__NO_SIDE_EFFECTS__
function bt(t, e) {
  return /* @__PURE__ */ BM(t, e, "svg");
}
function $n(t = "") {
  if (!lt) {
    var e = Uo(t + "");
    return Zn(e, e), e;
  }
  var r = Mt;
  return r.nodeType !== bv && (r.before(r = Uo()), mn(r)), Zn(r, r), r;
}
function fr() {
  if (lt)
    return Zn(Mt, null), Mt;
  var t = document.createDocumentFragment(), e = document.createComment(""), r = Uo();
  return t.append(e, r), Zn(e, r), t;
}
function te(t, e) {
  if (lt) {
    vt.nodes_end = Mt, Pi();
    return;
  }
  t !== null && t.before(
    /** @type {Node} */
    e
  );
}
function DM(t) {
  return t.endsWith("capture") && t !== "gotpointercapture" && t !== "lostpointercapture";
}
const PM = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
];
function LM(t) {
  return PM.includes(t);
}
const qM = {
  // no `class: 'className'` because we handle that separately
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly",
  defaultvalue: "defaultValue",
  defaultchecked: "defaultChecked",
  srcobject: "srcObject",
  novalidate: "noValidate",
  allowfullscreen: "allowFullscreen",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback"
};
function IM(t) {
  return t = t.toLowerCase(), qM[t] ?? t;
}
const jM = ["touchstart", "touchmove"];
function UM(t) {
  return jM.includes(t);
}
let M0 = !0;
function rt(t, e) {
  var r = e == null ? "" : typeof e == "object" ? e + "" : e;
  r !== (t.__t ??= t.nodeValue) && (t.__t = r, t.nodeValue = r + "");
}
function jw(t, e) {
  return Uw(t, e);
}
function WM(t, e) {
  x0(), e.intro = e.intro ?? !1;
  const r = e.target, n = lt, i = Mt;
  try {
    for (var a = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ tn(r)
    ); a && (a.nodeType !== Ns || /** @type {Comment} */
    a.data !== iw); )
      a = /** @type {TemplateNode} */
      /* @__PURE__ */ Vo(a);
    if (!a)
      throw nl;
    Do(!0), mn(
      /** @type {Comment} */
      a
    ), Pi();
    const l = Uw(t, { ...e, anchor: a });
    if (Mt === null || Mt.nodeType !== Ns || /** @type {Comment} */
    Mt.data !== Av)
      throw mc(), nl;
    return Do(!1), /**  @type {Exports} */
    l;
  } catch (l) {
    if (l === nl)
      return e.recover === !1 && q9(), x0(), dw(r), Do(!1), jw(t, e);
    throw l;
  } finally {
    Do(n), mn(i);
  }
}
const cs = /* @__PURE__ */ new Map();
function Uw(t, { target: e, anchor: r, props: n = {}, events: i, context: a, intro: l = !0 }) {
  x0();
  var u = /* @__PURE__ */ new Set(), c = (p) => {
    for (var g = 0; g < p.length; g++) {
      var m = p[g];
      if (!u.has(m)) {
        u.add(m);
        var y = UM(m);
        e.addEventListener(m, $u, { passive: y });
        var w = cs.get(m);
        w === void 0 ? (document.addEventListener(m, $u, { passive: y }), cs.set(m, 1)) : cs.set(m, w + 1);
      }
    }
  };
  c(xv(qw)), S0.add(c);
  var f = void 0, d = TM(() => {
    var p = r ?? e.appendChild(Uo());
    return Kr(() => {
      if (a) {
        gt({});
        var g = (
          /** @type {ComponentContext} */
          Zr
        );
        g.c = a;
      }
      i && (n.$$events = i), lt && Zn(
        /** @type {TemplateNode} */
        p,
        null
      ), M0 = l, f = t(p, n) || {}, M0 = !0, lt && (vt.nodes_end = Mt), a && mt();
    }), () => {
      for (var g of u) {
        e.removeEventListener(g, $u);
        var m = (
          /** @type {number} */
          cs.get(g)
        );
        --m === 0 ? (document.removeEventListener(g, $u), cs.delete(g)) : cs.set(g, m);
      }
      S0.delete(c), p !== r && p.parentNode?.removeChild(p);
    };
  });
  return C0.set(f, d), f;
}
let C0 = /* @__PURE__ */ new WeakMap();
function HM(t, e) {
  const r = C0.get(t);
  return r ? (C0.delete(t), r(e)) : Promise.resolve();
}
function Ww(t) {
  return new VM(t);
}
class VM {
  /** @type {any} */
  #e;
  /** @type {Record<string, any>} */
  #t;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(e) {
    var r = /* @__PURE__ */ new Map(), n = (a, l) => {
      var u = /* @__PURE__ */ Fv(l, !1, !1);
      return r.set(a, u), u;
    };
    const i = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(a, l) {
          return h(r.get(l) ?? n(l, Reflect.get(a, l)));
        },
        has(a, l) {
          return l === mv ? !0 : (h(r.get(l) ?? n(l, Reflect.get(a, l))), Reflect.has(a, l));
        },
        set(a, l, u) {
          return W(r.get(l) ?? n(l, u), u), Reflect.set(a, l, u);
        }
      }
    );
    this.#t = (e.hydrate ? WM : jw)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: i,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && kM(), this.#e = i.$$events;
    for (const a of Object.keys(this.#t))
      a === "$set" || a === "$destroy" || a === "$on" || ju(this, a, {
        get() {
          return this.#t[a];
        },
        /** @param {any} value */
        set(l) {
          this.#t[a] = l;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (a) => {
      Object.assign(i, a);
    }, this.#t.$destroy = () => {
      HM(this.#t);
    };
  }
  /** @param {Record<string, any>} props */
  $set(e) {
    this.#t.$set(e);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(e, r) {
    this.#e[e] = this.#e[e] || [];
    const n = (...i) => r.call(this, ...i);
    return this.#e[e].push(n), () => {
      this.#e[e] = this.#e[e].filter(
        /** @param {any} fn */
        (i) => i !== n
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
const GM = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(GM);
function Gu(t, e, ...r) {
  var n = t, i = Ft, a;
  Ta(() => {
    i !== (i = e()) && (a && (ln(a), a = null), a = Kr(() => (
      /** @type {SnippetFn} */
      i(n, ...r)
    )));
  }, El), lt && (n = Mt);
}
function bc(t) {
  Zr === null && Sv(), yn(() => {
    const e = Go(t);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function Hw(t) {
  Zr === null && Sv(), bc(() => () => Go(t));
}
function Te(t, e, r = !1) {
  lt && Pi();
  var n = t, i = null, a = null, l = qr, u = r ? El : 0, c = !1;
  const f = (g, m = !0) => {
    c = !0, p(m, g);
  };
  function d() {
    var g = l ? i : a, m = l ? a : i;
    g && Ov(g), m && ba(m, () => {
      l ? a = null : i = null;
    });
  }
  const p = (g, m) => {
    if (l === (l = g)) return;
    let y = !1;
    if (lt) {
      const k = sw(n) === Rv;
      !!l === k && (n = Kf(), mn(n), Do(!1), y = !0);
    }
    var w = Tv(), x = n;
    l ? i ??= m && Kr(() => m(x)) : a ??= m && Kr(() => m(x)), w || d(), y && Do(!0);
  };
  Ta(() => {
    c = !1, e(f), c || p(null, null);
  }, u), lt && (n = Mt);
}
function Ld(t, e, r) {
  lt && Pi();
  var n = t, i = qr, a, l, u = null, c = N9;
  function f() {
    a && ba(a), u !== null && (u.lastChild.remove(), n.before(u), u = null), a = l;
  }
  Ta(() => {
    if (c(i, i = e())) {
      var d = n, p = Tv();
      p && (u = document.createDocumentFragment(), u.append(d = Uo())), l = Kr(() => r(d)), p ? ar.add_callback(f) : f();
    }
  }), lt && (n = Mt);
}
let Lf = null;
function or(t, e) {
  return e;
}
function XM(t, e, r) {
  for (var n = t.items, i = [], a = e.length, l = 0; l < a; l++)
    zv(e[l].e, i, !0);
  var u = a > 0 && i.length === 0 && r !== null;
  if (u) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      r.parentNode
    );
    dw(c), c.append(
      /** @type {Element} */
      r
    ), n.clear(), Jo(t, e[0].prev, e[a - 1].next);
  }
  Dw(i, () => {
    for (var f = 0; f < a; f++) {
      var d = e[f];
      u || (n.delete(d.k), Jo(t, d.prev, d.next)), ln(d.e, !u);
    }
  });
}
function Gt(t, e, r, n, i, a = null) {
  var l = t, u = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & nw) !== 0;
  if (c) {
    var f = (
      /** @type {Element} */
      t
    );
    l = lt ? mn(
      /** @type {Comment | Text} */
      /* @__PURE__ */ tn(f)
    ) : f.appendChild(Uo());
  }
  lt && Pi();
  var d = null, p = !1, g = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ mw(() => {
    var k = r();
    return zd(k) ? k : k == null ? [] : xv(k);
  }), y, w;
  function x() {
    YM(
      w,
      y,
      u,
      g,
      l,
      i,
      e,
      n,
      r
    ), a !== null && (y.length === 0 ? d ? Ov(d) : d = Kr(() => a(l)) : d !== null && ba(d, () => {
      d = null;
    }));
  }
  Ta(() => {
    w ??= /** @type {Effect} */
    vt, y = h(m);
    var k = y.length;
    if (p && k === 0)
      return;
    p = k === 0;
    let S = !1;
    if (lt) {
      var _ = sw(l) === Rv;
      _ !== (k === 0) && (l = Kf(), mn(l), Do(!1), S = !0);
    }
    if (lt) {
      for (var E = null, C, R = 0; R < k; R++) {
        if (Mt.nodeType === Ns && /** @type {Comment} */
        Mt.data === Av) {
          l = /** @type {Comment} */
          Mt, S = !0, Do(!1);
          break;
        }
        var A = y[R], N = n(A, R);
        C = Vw(
          Mt,
          u,
          E,
          null,
          A,
          N,
          R,
          i,
          e,
          r
        ), u.items.set(N, C), E = C;
      }
      k > 0 && mn(Kf());
    }
    lt ? k === 0 && a && (d = Kr(() => a(l))) : x(), S && Do(!0), h(m);
  }), lt && (l = Mt);
}
function YM(t, e, r, n, i, a, l, u, c) {
  var f = (l & G9) !== 0, d = (l & (Mv | Cv)) !== 0, p = e.length, g = r.items, m = r.first, y = m, w, x = null, k, S = [], _ = [], E, C, R, A;
  if (f)
    for (A = 0; A < p; A += 1)
      E = e[A], C = u(E, A), R = g.get(C), R !== void 0 && (R.a?.measure(), (k ??= /* @__PURE__ */ new Set()).add(R));
  for (A = 0; A < p; A += 1) {
    if (E = e[A], C = u(E, A), R = g.get(C), R === void 0) {
      var N = n.get(C);
      if (N !== void 0) {
        n.delete(C), g.set(C, N);
        var L = x ? x.next : y;
        Jo(r, x, N), Jo(r, N, L), kp(N, L, i), x = N;
      } else {
        var j = y ? (
          /** @type {TemplateNode} */
          y.e.nodes_start
        ) : i;
        x = Vw(
          j,
          r,
          x,
          x === null ? r.first : x.next,
          E,
          C,
          A,
          a,
          l,
          c
        );
      }
      g.set(C, x), S = [], _ = [], y = x.next;
      continue;
    }
    if (d && KM(R, E, A, l), (R.e.f & Po) !== 0 && (Ov(R.e), f && (R.a?.unfix(), (k ??= /* @__PURE__ */ new Set()).delete(R))), R !== y) {
      if (w !== void 0 && w.has(R)) {
        if (S.length < _.length) {
          var B = _[0], P;
          x = B.prev;
          var q = S[0], H = S[S.length - 1];
          for (P = 0; P < S.length; P += 1)
            kp(S[P], B, i);
          for (P = 0; P < _.length; P += 1)
            w.delete(_[P]);
          Jo(r, q.prev, H.next), Jo(r, x, q), Jo(r, H, B), y = B, x = H, A -= 1, S = [], _ = [];
        } else
          w.delete(R), kp(R, y, i), Jo(r, R.prev, R.next), Jo(r, R, x === null ? r.first : x.next), Jo(r, x, R), x = R;
        continue;
      }
      for (S = [], _ = []; y !== null && y.k !== C; )
        (y.e.f & Po) === 0 && (w ??= /* @__PURE__ */ new Set()).add(y), _.push(y), y = y.next;
      if (y === null)
        continue;
      R = y;
    }
    S.push(R), x = R, y = R.next;
  }
  if (y !== null || w !== void 0) {
    for (var X = w === void 0 ? [] : xv(w); y !== null; )
      (y.e.f & Po) === 0 && X.push(y), y = y.next;
    var V = X.length;
    if (V > 0) {
      var G = (l & nw) !== 0 && p === 0 ? i : null;
      if (f) {
        for (A = 0; A < V; A += 1)
          X[A].a?.measure();
        for (A = 0; A < V; A += 1)
          X[A].a?.fix();
      }
      XM(r, X, G);
    }
  }
  f && Tl(() => {
    if (k !== void 0)
      for (R of k)
        R.a?.apply();
  }), t.first = r.first && r.first.e, t.last = x && x.e;
  for (var Z of n.values())
    ln(Z.e);
  n.clear();
}
function KM(t, e, r, n) {
  (n & Mv) !== 0 && Bs(t.v, e), (n & Cv) !== 0 ? Bs(
    /** @type {Value<number>} */
    t.i,
    r
  ) : t.i = r;
}
function Vw(t, e, r, n, i, a, l, u, c, f, d) {
  var p = Lf, g = (c & Mv) !== 0, m = (c & X9) === 0, y = g ? m ? /* @__PURE__ */ Fv(i, !1, !1) : yl(i) : i, w = (c & Cv) === 0 ? l : yl(l), x = {
    i: w,
    v: y,
    k: a,
    a: null,
    // @ts-expect-error
    e: null,
    prev: r,
    next: n
  };
  Lf = x;
  try {
    if (t === null) {
      var k = document.createDocumentFragment();
      k.append(t = Uo());
    }
    return x.e = Kr(() => u(
      /** @type {Node} */
      t,
      y,
      w,
      f
    ), lt), x.e.prev = r && r.e, x.e.next = n && n.e, r === null ? d || (e.first = x) : (r.next = x, r.e.next = x.e), n !== null && (n.prev = x, n.e.prev = x.e), x;
  } finally {
    Lf = p;
  }
}
function kp(t, e, r) {
  for (var n = t.next ? (
    /** @type {TemplateNode} */
    t.next.e.nodes_start
  ) : r, i = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : r, a = (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ); a !== null && a !== n; ) {
    var l = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Vo(a)
    );
    i.before(a), a = l;
  }
}
function Jo(t, e, r) {
  e === null ? t.first = r : (e.next = r, e.e.next = r && r.e), r !== null && (r.prev = e, r.e.prev = e && e.e);
}
function ZM(t, e, r = !1, n = !1, i = !1) {
  var a = t, l = "";
  Ee(() => {
    var u = (
      /** @type {Effect} */
      vt
    );
    if (l === (l = e() ?? "")) {
      lt && Pi();
      return;
    }
    if (u.nodes_start !== null && (Ow(
      u.nodes_start,
      /** @type {TemplateNode} */
      u.nodes_end
    ), u.nodes_start = u.nodes_end = null), l !== "") {
      if (lt) {
        Mt.data;
        for (var c = Pi(), f = c; c !== null && (c.nodeType !== Ns || /** @type {Comment} */
        c.data !== ""); )
          f = c, c = /** @type {TemplateNode} */
          /* @__PURE__ */ Vo(c);
        if (c === null)
          throw mc(), nl;
        Zn(Mt, f), a = mn(c);
        return;
      }
      var d = l + "";
      r ? d = `<svg>${d}</svg>` : n && (d = `<math>${d}</math>`);
      var p = Bv(d);
      if ((r || n) && (p = /** @type {Element} */
      /* @__PURE__ */ tn(p)), Zn(
        /** @type {TemplateNode} */
        /* @__PURE__ */ tn(p),
        /** @type {TemplateNode} */
        p.lastChild
      ), r || n)
        for (; /* @__PURE__ */ tn(p); )
          a.before(
            /** @type {Node} */
            /* @__PURE__ */ tn(p)
          );
      else
        a.before(p);
    }
  });
}
function Dv(t, e, r) {
  lt && Pi();
  var n = t, i, a, l = null, u = null;
  function c() {
    a && (ba(a), a = null), l && (l.lastChild.remove(), n.before(l), l = null), a = u, u = null;
  }
  Ta(() => {
    if (i !== (i = e())) {
      var f = Tv();
      if (i) {
        var d = n;
        f && (l = document.createDocumentFragment(), l.append(d = Uo())), u = Kr(() => r(d, i));
      }
      f ? ar.add_callback(c) : c();
    }
  }, El), lt && (n = Mt);
}
function Gw(t, e, r) {
  Hs(() => {
    var n = Go(() => e(t, r?.()) || {});
    if (r && n?.update) {
      var i = !1, a = (
        /** @type {any} */
        {}
      );
      yc(() => {
        var l = r();
        RM(l), i && _v(a, l) && (a = l, n.update(l));
      }), i = !0;
    }
    if (n?.destroy)
      return () => (
        /** @type {Function} */
        n.destroy()
      );
  });
}
function QM(t, e) {
  var r = void 0, n;
  Ta(() => {
    r !== (r = e()) && (n && (ln(n), n = null), r && (n = Kr(() => {
      Hs(() => (
        /** @type {(node: Element) => void} */
        r(t)
      ));
    })));
  });
}
function Xw(t) {
  var e, r, n = "";
  if (typeof t == "string" || typeof t == "number") n += t;
  else if (typeof t == "object") if (Array.isArray(t)) {
    var i = t.length;
    for (e = 0; e < i; e++) t[e] && (r = Xw(t[e])) && (n && (n += " "), n += r);
  } else for (r in t) t[r] && (n && (n += " "), n += r);
  return n;
}
function JM() {
  for (var t, e, r = 0, n = "", i = arguments.length; r < i; r++) (t = arguments[r]) && (e = Xw(t)) && (n && (n += " "), n += e);
  return n;
}
function eC(t) {
  return typeof t == "object" ? JM(t) : t ?? "";
}
const O1 = [...` 	
\r\f \v\uFEFF`];
function tC(t, e, r) {
  var n = t == null ? "" : "" + t;
  if (e && (n = n ? n + " " + e : e), r) {
    for (var i in r)
      if (r[i])
        n = n ? n + " " + i : i;
      else if (n.length)
        for (var a = i.length, l = 0; (l = n.indexOf(i, l)) >= 0; ) {
          var u = l + a;
          (l === 0 || O1.includes(n[l - 1])) && (u === n.length || O1.includes(n[u])) ? n = (l === 0 ? "" : n.substring(0, l)) + n.substring(u + 1) : l = u;
        }
  }
  return n === "" ? null : n;
}
function B1(t, e = !1) {
  var r = e ? " !important;" : ";", n = "";
  for (var i in t) {
    var a = t[i];
    a != null && a !== "" && (n += " " + i + ": " + a + r);
  }
  return n;
}
function _p(t) {
  return t[0] !== "-" || t[1] !== "-" ? t.toLowerCase() : t;
}
function rC(t, e) {
  if (e) {
    var r = "", n, i;
    if (Array.isArray(e) ? (n = e[0], i = e[1]) : n = e, t) {
      t = String(t).replaceAll(/\s*\/\*.*?\*\/\s*/g, "").trim();
      var a = !1, l = 0, u = !1, c = [];
      n && c.push(...Object.keys(n).map(_p)), i && c.push(...Object.keys(i).map(_p));
      var f = 0, d = -1;
      const w = t.length;
      for (var p = 0; p < w; p++) {
        var g = t[p];
        if (u ? g === "/" && t[p - 1] === "*" && (u = !1) : a ? a === g && (a = !1) : g === "/" && t[p + 1] === "*" ? u = !0 : g === '"' || g === "'" ? a = g : g === "(" ? l++ : g === ")" && l--, !u && a === !1 && l === 0) {
          if (g === ":" && d === -1)
            d = p;
          else if (g === ";" || p === w - 1) {
            if (d !== -1) {
              var m = _p(t.substring(f, d).trim());
              if (!c.includes(m)) {
                g !== ";" && p++;
                var y = t.substring(f, p).trim();
                r += " " + y + ";";
              }
            }
            f = p + 1, d = -1;
          }
        }
      }
    }
    return n && (r += B1(n)), i && (r += B1(i, !0)), r = r.trim(), r === "" ? null : r;
  }
  return t == null ? null : String(t);
}
function _r(t, e, r, n, i, a) {
  var l = t.__className;
  if (lt || l !== r || l === void 0) {
    var u = tC(r, n, a);
    (!lt || u !== t.getAttribute("class")) && (u == null ? t.removeAttribute("class") : e ? t.className = u : t.setAttribute("class", u)), t.__className = r;
  } else if (a && i !== a)
    for (var c in a) {
      var f = !!a[c];
      (i == null || f !== !!i[c]) && t.classList.toggle(c, f);
    }
  return a;
}
function Sp(t, e = {}, r, n) {
  for (var i in r) {
    var a = r[i];
    e[i] !== a && (r[i] == null ? t.style.removeProperty(i) : t.style.setProperty(i, a, n));
  }
}
function tt(t, e, r, n) {
  var i = t.__style;
  if (lt || i !== e) {
    var a = rC(e, n);
    (!lt || a !== t.getAttribute("style")) && (a == null ? t.removeAttribute("style") : t.style.cssText = a), t.__style = e;
  } else n && (Array.isArray(n) ? (Sp(t, r?.[0], n[0]), Sp(t, r?.[1], n[1], "important")) : Sp(t, r, n));
  return n;
}
function Ds(t, e, r = !1) {
  if (t.multiple) {
    if (e == null)
      return;
    if (!zd(e))
      return aM();
    for (var n of t.options)
      n.selected = e.includes(D1(n));
    return;
  }
  for (n of t.options) {
    var i = D1(n);
    if (sM(i, e)) {
      n.selected = !0;
      return;
    }
  }
  (!r || e !== void 0) && (t.selectedIndex = -1);
}
function Jf(t) {
  var e = new MutationObserver(() => {
    Ds(t, t.__value);
  });
  e.observe(t, {
    // Listen to option element changes
    childList: !0,
    subtree: !0,
    // because of <optgroup>
    // Listen to option element value attribute changes
    // (doesn't get notified of select value changes,
    // because that property is not reflected as an attribute)
    attributes: !0,
    attributeFilter: ["value"]
  }), Nv(() => {
    e.disconnect();
  });
}
function D1(t) {
  return "__value" in t ? t.__value : t.value;
}
const yu = Symbol("class"), bu = Symbol("style"), Yw = Symbol("is custom element"), Kw = Symbol("is html");
function nC(t) {
  if (lt) {
    var e = !1, r = () => {
      if (!e) {
        if (e = !0, t.hasAttribute("value")) {
          var n = t.value;
          J(t, "value", null), t.value = n;
        }
        if (t.hasAttribute("checked")) {
          var i = t.checked;
          J(t, "checked", null), t.checked = i;
        }
      }
    };
    t.__on_r = r, fM(r), Lw();
  }
}
function oC(t, e) {
  e ? t.hasAttribute("selected") || t.setAttribute("selected", "") : t.removeAttribute("selected");
}
function J(t, e, r, n) {
  var i = Zw(t);
  lt && (i[e] = t.getAttribute(e), e === "src" || e === "srcset" || e === "href" && t.nodeName === "LINK") || i[e] !== (i[e] = r) && (e === "loading" && (t[R9] = r), r == null ? t.removeAttribute(e) : typeof r != "string" && Qw(t).includes(e) ? t[e] = r : t.setAttribute(e, r));
}
function iC(t, e, r, n, i = !1) {
  var a = Zw(t), l = a[Yw], u = !a[Kw];
  let c = lt && l;
  c && Do(!1);
  var f = e || {}, d = t.tagName === "OPTION";
  for (var p in e)
    p in r || (r[p] = null);
  r.class ? r.class = eC(r.class) : r[yu] && (r.class = null), r[bu] && (r.style ??= null);
  var g = Qw(t);
  for (const _ in r) {
    let E = r[_];
    if (d && _ === "value" && E == null) {
      t.value = t.__value = "", f[_] = E;
      continue;
    }
    if (_ === "class") {
      var m = t.namespaceURI === "http://www.w3.org/1999/xhtml";
      _r(t, m, E, n, e?.[yu], r[yu]), f[_] = E, f[yu] = r[yu];
      continue;
    }
    if (_ === "style") {
      tt(t, E, e?.[bu], r[bu]), f[_] = E, f[bu] = r[bu];
      continue;
    }
    var y = f[_];
    if (!(E === y && !(E === void 0 && t.hasAttribute(_)))) {
      f[_] = E;
      var w = _[0] + _[1];
      if (w !== "$$")
        if (w === "on") {
          const C = {}, R = "$$" + _;
          let A = _.slice(2);
          var x = LM(A);
          if (DM(A) && (A = A.slice(0, -7), C.capture = !0), !x && y) {
            if (E != null) continue;
            t.removeEventListener(A, f[R], C), f[R] = null;
          }
          if (E != null)
            if (x)
              t[`__${A}`] = E, Tr([A]);
            else {
              let N = function(L) {
                f[_].call(this, L);
              };
              f[R] = Iw(A, t, N, C);
            }
          else x && (t[`__${A}`] = void 0);
        } else if (_ === "style")
          J(t, _, E);
        else if (_ === "autofocus")
          NM(
            /** @type {HTMLElement} */
            t,
            !!E
          );
        else if (!l && (_ === "__value" || _ === "value" && E != null))
          t.value = t.__value = E;
        else if (_ === "selected" && d)
          oC(
            /** @type {HTMLOptionElement} */
            t,
            E
          );
        else {
          var k = _;
          u || (k = IM(k));
          var S = k === "defaultValue" || k === "defaultChecked";
          if (E == null && !l && !S)
            if (a[_] = null, k === "value" || k === "checked") {
              let C = (
                /** @type {HTMLInputElement} */
                t
              );
              const R = e === void 0;
              if (k === "value") {
                let A = C.defaultValue;
                C.removeAttribute(k), C.defaultValue = A, C.value = C.__value = R ? A : null;
              } else {
                let A = C.defaultChecked;
                C.removeAttribute(k), C.defaultChecked = A, C.checked = R ? A : !1;
              }
            } else
              t.removeAttribute(_);
          else S || g.includes(k) && (l || typeof E != "string") ? (t[k] = E, k in a && (a[k] = qr)) : typeof E != "function" && J(t, k, E);
        }
    }
  }
  return c && Do(!0), f;
}
function ro(t, e, r = [], n = [], i, a = !1) {
  xw(r, n, (l) => {
    var u = void 0, c = {}, f = t.nodeName === "SELECT", d = !1;
    if (Ta(() => {
      var g = e(...l.map(h)), m = iC(t, u, g, i, a);
      d && f && "value" in g && Ds(
        /** @type {HTMLSelectElement} */
        t,
        g.value
      );
      for (let w of Object.getOwnPropertySymbols(c))
        g[w] || ln(c[w]);
      for (let w of Object.getOwnPropertySymbols(g)) {
        var y = g[w];
        w.description === oM && (!u || y !== u[w]) && (c[w] && ln(c[w]), c[w] = Kr(() => QM(t, () => y))), m[w] = y;
      }
      u = m;
    }), f) {
      var p = (
        /** @type {HTMLSelectElement} */
        t
      );
      Hs(() => {
        Ds(
          p,
          /** @type {Record<string | symbol, any>} */
          u.value,
          !0
        ), Jf(p);
      });
    }
    d = !0;
  });
}
function Zw(t) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    t.__attributes ??= {
      [Yw]: t.nodeName.includes("-"),
      [Kw]: t.namespaceURI === nM
    }
  );
}
var P1 = /* @__PURE__ */ new Map();
function Qw(t) {
  var e = P1.get(t.nodeName);
  if (e) return e;
  P1.set(t.nodeName, e = []);
  for (var r, n = t, i = Element.prototype; i !== n; ) {
    r = ew(n);
    for (var a in r)
      r[a].set && e.push(a);
    n = wv(n);
  }
  return e;
}
const aC = () => performance.now(), ri = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick: (
    /** @param {any} _ */
    (t) => requestAnimationFrame(t)
  ),
  now: () => aC(),
  tasks: /* @__PURE__ */ new Set()
};
function Jw() {
  const t = ri.now();
  ri.tasks.forEach((e) => {
    e.c(t) || (ri.tasks.delete(e), e.f());
  }), ri.tasks.size !== 0 && ri.tick(Jw);
}
function e2(t) {
  let e;
  return ri.tasks.size === 0 && ri.tick(Jw), {
    promise: new Promise((r) => {
      ri.tasks.add(e = { c: t, f: r });
    }),
    abort() {
      ri.tasks.delete(e);
    }
  };
}
function bf(t, e) {
  Pd(() => {
    t.dispatchEvent(new CustomEvent(e));
  });
}
function lC(t) {
  if (t === "float") return "cssFloat";
  if (t === "offset") return "cssOffset";
  if (t.startsWith("--")) return t;
  const e = t.split("-");
  return e.length === 1 ? e[0] : e[0] + e.slice(1).map(
    /** @param {any} word */
    (r) => r[0].toUpperCase() + r.slice(1)
  ).join("");
}
function L1(t) {
  const e = {}, r = t.split(";");
  for (const n of r) {
    const [i, a] = n.split(":");
    if (!i || a === void 0) break;
    const l = lC(i.trim());
    e[l] = a.trim();
  }
  return e;
}
const sC = (t) => t;
function uC(t, e, r) {
  var n = (
    /** @type {EachItem} */
    Lf
  ), i, a, l, u = null;
  n.a ??= {
    element: t,
    measure() {
      i = this.element.getBoundingClientRect();
    },
    apply() {
      if (l?.abort(), a = this.element.getBoundingClientRect(), i.left !== a.left || i.right !== a.right || i.top !== a.top || i.bottom !== a.bottom) {
        const c = e()(this.element, { from: i, to: a }, r?.());
        l = td(this.element, c, void 0, 1, () => {
          l?.abort(), l = void 0;
        });
      }
    },
    fix() {
      if (!t.getAnimations().length) {
        var { position: c, width: f, height: d } = getComputedStyle(t);
        if (c !== "absolute" && c !== "fixed") {
          var p = (
            /** @type {HTMLElement | SVGElement} */
            t.style
          );
          u = {
            position: p.position,
            width: p.width,
            height: p.height,
            transform: p.transform
          }, p.position = "absolute", p.width = f, p.height = d;
          var g = t.getBoundingClientRect();
          if (i.left !== g.left || i.top !== g.top) {
            var m = `translate(${i.left - g.left}px, ${i.top - g.top}px)`;
            p.transform = p.transform ? `${p.transform} ${m}` : m;
          }
        }
      }
    },
    unfix() {
      if (u) {
        var c = (
          /** @type {HTMLElement | SVGElement} */
          t.style
        );
        c.position = u.position, c.width = u.width, c.height = u.height, c.transform = u.transform;
      }
    }
  }, n.a.element = t;
}
function ed(t, e, r, n) {
  var i = (t & J9) !== 0, a = (t & eM) !== 0, l = i && a, u = (t & tM) !== 0, c = l ? "both" : i ? "in" : "out", f, d = e.inert, p = e.style.overflow, g, m;
  function y() {
    return Pd(() => f ??= r()(e, n?.() ?? /** @type {P} */
    {}, {
      direction: c
    }));
  }
  var w = {
    is_global: u,
    in() {
      if (e.inert = d, !i) {
        m?.abort(), m?.reset?.();
        return;
      }
      a || g?.abort(), bf(e, "introstart"), g = td(e, y(), m, 1, () => {
        bf(e, "introend"), g?.abort(), g = f = void 0, e.style.overflow = p;
      });
    },
    out(_) {
      if (!a) {
        _?.(), f = void 0;
        return;
      }
      e.inert = !0, bf(e, "outrostart"), m = td(e, y(), g, 0, () => {
        bf(e, "outroend"), _?.();
      });
    },
    stop: () => {
      g?.abort(), m?.abort();
    }
  }, x = (
    /** @type {Effect} */
    vt
  );
  if ((x.transitions ??= []).push(w), i && M0) {
    var k = u;
    if (!k) {
      for (var S = (
        /** @type {Effect | null} */
        x.parent
      ); S && (S.f & El) !== 0; )
        for (; (S = S.parent) && (S.f & Ws) === 0; )
          ;
      k = !S || (S.f & Fd) !== 0;
    }
    k && Hs(() => {
      Go(() => w.in());
    });
  }
}
function td(t, e, r, n, i) {
  var a = n === 1;
  if (vs(e)) {
    var l, u = !1;
    return Tl(() => {
      if (!u) {
        var x = e({ direction: a ? "in" : "out" });
        l = td(t, x, r, n, i);
      }
    }), {
      abort: () => {
        u = !0, l?.abort();
      },
      deactivate: () => l.deactivate(),
      reset: () => l.reset(),
      t: () => l.t()
    };
  }
  if (r?.deactivate(), !e?.duration)
    return i(), {
      abort: Ft,
      deactivate: Ft,
      reset: Ft,
      t: () => n
    };
  const { delay: c = 0, css: f, tick: d, easing: p = sC } = e;
  var g = [];
  if (a && r === void 0 && (d && d(0, 1), f)) {
    var m = L1(f(0, 1));
    g.push(m, m);
  }
  var y = () => 1 - n, w = t.animate(g, { duration: c, fill: "forwards" });
  return w.onfinish = () => {
    w.cancel();
    var x = r?.t() ?? 1 - n;
    r?.abort();
    var k = n - x, S = (
      /** @type {number} */
      e.duration * Math.abs(k)
    ), _ = [];
    if (S > 0) {
      var E = !1;
      if (f)
        for (var C = Math.ceil(S / 16.666666666666668), R = 0; R <= C; R += 1) {
          var A = x + k * p(R / C), N = L1(f(A, 1 - A));
          _.push(N), E ||= N.overflow === "hidden";
        }
      E && (t.style.overflow = "hidden"), y = () => {
        var L = (
          /** @type {number} */
          /** @type {globalThis.Animation} */
          w.currentTime
        );
        return x + k * p(L / S);
      }, d && e2(() => {
        if (w.playState !== "running") return !1;
        var L = y();
        return d(L, 1 - L), !0;
      });
    }
    w = t.animate(_, { duration: S, fill: "forwards" }), w.onfinish = () => {
      y = () => n, d?.(n, 1 - n), i();
    };
  }, {
    abort: () => {
      w && (w.cancel(), w.effect = null, w.onfinish = Ft);
    },
    deactivate: () => {
      i = Ft;
    },
    reset: () => {
      n === 0 && d?.(1, 0);
    },
    t: () => y()
  };
}
function cC(t, e, r = e) {
  var n = /* @__PURE__ */ new WeakSet();
  zM(t, "input", (i) => {
    var a = i ? t.defaultValue : t.value;
    if (a = Mp(t) ? Cp(a) : a, r(a), ar !== null && n.add(ar), a !== (a = e())) {
      var l = t.selectionStart, u = t.selectionEnd;
      t.value = a ?? "", u !== null && (t.selectionStart = l, t.selectionEnd = Math.min(u, t.value.length));
    }
  }), // If we are hydrating and the value has since changed,
  // then use the updated value from the input instead.
  (lt && t.defaultValue !== t.value || // If defaultValue is set, then value == defaultValue
  // TODO Svelte 6: remove input.value check and set to empty string?
  Go(e) == null && t.value) && (r(Mp(t) ? Cp(t.value) : t.value), ar !== null && n.add(ar)), yc(() => {
    var i = e();
    if (t === document.activeElement) {
      var a = (
        /** @type {Batch} */
        Df ?? ar
      );
      if (n.has(a))
        return;
    }
    Mp(t) && i === Cp(t.value) || t.type === "date" && !i && !t.value || i !== t.value && (t.value = i ?? "");
  });
}
function Mp(t) {
  var e = t.type;
  return e === "number" || e === "range";
}
function Cp(t) {
  return t === "" ? null : +t;
}
class Pv {
  /** */
  #e = /* @__PURE__ */ new WeakMap();
  /** @type {ResizeObserver | undefined} */
  #t;
  /** @type {ResizeObserverOptions} */
  #r;
  /** @static */
  static entries = /* @__PURE__ */ new WeakMap();
  /** @param {ResizeObserverOptions} options */
  constructor(e) {
    this.#r = e;
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(e, r) {
    var n = this.#e.get(e) || /* @__PURE__ */ new Set();
    return n.add(r), this.#e.set(e, n), this.#n().observe(e, this.#r), () => {
      var i = this.#e.get(e);
      i.delete(r), i.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
    };
  }
  #n() {
    return this.#t ?? (this.#t = new ResizeObserver(
      /** @param {any} entries */
      (e) => {
        for (var r of e) {
          Pv.entries.set(r.target, r);
          for (var n of this.#e.get(r.target) || [])
            n(r);
        }
      }
    ));
  }
}
var fC = /* @__PURE__ */ new Pv({
  box: "border-box"
});
function bl(t, e, r) {
  var n = fC.observe(t, () => r(t[e]));
  Hs(() => (Go(() => r(t[e])), n));
}
function q1(t, e) {
  return t === e || t?.[ii] === e;
}
function Wo(t = {}, e, r, n) {
  return Hs(() => {
    var i, a;
    return yc(() => {
      i = a, a = [], Go(() => {
        t !== r(...a) && (e(t, ...a), i && q1(r(...i), t) && e(null, ...i));
      });
    }), () => {
      Tl(() => {
        a && q1(r(...a), t) && e(null, ...a);
      });
    };
  }), t;
}
function Lv(t, e, r) {
  if (t == null)
    return e(void 0), r && r(void 0), Ft;
  const n = Go(
    () => t.subscribe(
      e,
      // @ts-expect-error
      r
    )
  );
  return n.unsubscribe ? () => n.unsubscribe() : n;
}
const fs = [];
function dC(t, e) {
  return {
    subscribe: Xu(t, e).subscribe
  };
}
function Xu(t, e = Ft) {
  let r = null;
  const n = /* @__PURE__ */ new Set();
  function i(u) {
    if (_v(t, u) && (t = u, r)) {
      const c = !fs.length;
      for (const f of n)
        f[1](), fs.push(f, t);
      if (c) {
        for (let f = 0; f < fs.length; f += 2)
          fs[f][0](fs[f + 1]);
        fs.length = 0;
      }
    }
  }
  function a(u) {
    i(u(
      /** @type {T} */
      t
    ));
  }
  function l(u, c = Ft) {
    const f = [u, c];
    return n.add(f), n.size === 1 && (r = e(i, a) || Ft), u(
      /** @type {T} */
      t
    ), () => {
      n.delete(f), n.size === 0 && r && (r(), r = null);
    };
  }
  return { set: i, update: a, subscribe: l };
}
function hC(t, e, r) {
  const n = !Array.isArray(t), i = n ? [t] : t;
  if (!i.every(Boolean))
    throw new Error("derived() expects stores as input, got a falsy value");
  const a = e.length < 2;
  return dC(r, (l, u) => {
    let c = !1;
    const f = [];
    let d = 0, p = Ft;
    const g = () => {
      if (d)
        return;
      p();
      const y = e(n ? f[0] : f, l, u);
      a ? l(y) : p = typeof y == "function" ? y : Ft;
    }, m = i.map(
      (y, w) => Lv(
        y,
        (x) => {
          f[w] = x, d &= ~(1 << w), c && g();
        },
        () => {
          d |= 1 << w;
        }
      )
    );
    return c = !0, g(), function() {
      kv(m), p(), c = !1;
    };
  });
}
function pC(t) {
  let e;
  return Lv(t, (r) => e = r)(), e;
}
let xf = !1, R0 = Symbol();
function On(t, e, r) {
  const n = r[e] ??= {
    store: null,
    source: /* @__PURE__ */ Fv(void 0),
    unsubscribe: Ft
  };
  if (n.store !== t && !(R0 in r))
    if (n.unsubscribe(), n.store = t ?? null, t == null)
      n.source.v = void 0, n.unsubscribe = Ft;
    else {
      var i = !0;
      n.unsubscribe = Lv(t, (a) => {
        i ? n.source.v = a : W(n.source, a);
      }), i = !1;
    }
  return t && R0 in r ? pC(t) : h(n.source);
}
function xu(t, e) {
  return t.set(e), e;
}
function Co() {
  const t = {};
  function e() {
    Nv(() => {
      for (var r in t)
        t[r].unsubscribe();
      ju(t, R0, {
        enumerable: !1,
        value: !0
      });
    });
  }
  return [t, e];
}
function vC(t) {
  var e = xf;
  try {
    return xf = !1, [t(), xf];
  } finally {
    xf = e;
  }
}
const gC = {
  get(t, e) {
    if (!t.exclude.includes(e))
      return t.props[e];
  },
  set(t, e) {
    return !1;
  },
  getOwnPropertyDescriptor(t, e) {
    if (!t.exclude.includes(e) && e in t.props)
      return {
        enumerable: !0,
        configurable: !0,
        value: t.props[e]
      };
  },
  has(t, e) {
    return t.exclude.includes(e) ? !1 : e in t.props;
  },
  ownKeys(t) {
    return Reflect.ownKeys(t.props).filter((e) => !t.exclude.includes(e));
  }
};
// @__NO_SIDE_EFFECTS__
function bn(t, e, r) {
  return new Proxy(
    { props: t, exclude: e },
    gC
  );
}
const mC = {
  get(t, e) {
    let r = t.props.length;
    for (; r--; ) {
      let n = t.props[r];
      if (vs(n) && (n = n()), typeof n == "object" && n !== null && e in n) return n[e];
    }
  },
  set(t, e, r) {
    let n = t.props.length;
    for (; n--; ) {
      let i = t.props[n];
      vs(i) && (i = i());
      const a = ya(i, e);
      if (a && a.set)
        return a.set(r), !0;
    }
    return !1;
  },
  getOwnPropertyDescriptor(t, e) {
    let r = t.props.length;
    for (; r--; ) {
      let n = t.props[r];
      if (vs(n) && (n = n()), typeof n == "object" && n !== null && e in n) {
        const i = ya(n, e);
        return i && !i.configurable && (i.configurable = !0), i;
      }
    }
  },
  has(t, e) {
    if (e === ii || e === mv) return !1;
    for (let r of t.props)
      if (vs(r) && (r = r()), r != null && e in r) return !0;
    return !1;
  },
  ownKeys(t) {
    const e = [];
    for (let r of t.props)
      if (vs(r) && (r = r()), !!r) {
        for (const n in r)
          e.includes(n) || e.push(n);
        for (const n of Object.getOwnPropertySymbols(r))
          e.includes(n) || e.push(n);
      }
    return e;
  }
};
function yC(...t) {
  return new Proxy({ props: t }, mC);
}
function Je(t, e, r, n) {
  var i = (r & Z9) !== 0, a = (r & Q9) !== 0, l = (
    /** @type {V} */
    n
  ), u = !0, c = () => (u && (u = !1, l = a ? Go(
    /** @type {() => V} */
    n
  ) : (
    /** @type {V} */
    n
  )), l), f;
  if (i) {
    var d = ii in t || mv in t;
    f = ya(t, e)?.set ?? (d && e in t ? (S) => t[e] = S : void 0);
  }
  var p, g = !1;
  i ? [p, g] = vC(() => (
    /** @type {V} */
    t[e]
  )) : p = /** @type {V} */
  t[e], p === void 0 && n !== void 0 && (p = c(), f && (I9(), f(p)));
  var m;
  if (m = () => {
    var S = (
      /** @type {V} */
      t[e]
    );
    return S === void 0 ? c() : (u = !0, S);
  }, (r & K9) === 0)
    return m;
  if (f) {
    var y = t.$$legacy;
    return function(S, _) {
      return arguments.length > 0 ? ((!_ || y || g) && f(_ ? m() : S), S) : m();
    };
  }
  var w = !1, x = ((r & Y9) !== 0 ? Od : mw)(() => (w = !1, m()));
  i && h(x);
  var k = (
    /** @type {Effect} */
    vt
  );
  return function(S, _) {
    if (arguments.length > 0) {
      const E = _ ? h(x) : i ? mo(S) : S;
      return W(x, E), w = !0, l !== void 0 && (l = E), S;
    }
    return $l && w || (k.f & Al) !== 0 ? x.v : h(x);
  };
}
function bC(t) {
  return t;
}
function qv(t) {
  const e = t - 1;
  return e * e * e + 1;
}
function I1(t) {
  return Object.prototype.toString.call(t) === "[object Date]";
}
function A0(t, e) {
  if (t === e || t !== t) return () => t;
  const r = typeof t;
  if (r !== typeof e || Array.isArray(t) !== Array.isArray(e))
    throw new Error("Cannot interpolate values of different type");
  if (Array.isArray(t)) {
    const n = (
      /** @type {Array<any>} */
      e.map((i, a) => A0(
        /** @type {Array<any>} */
        t[a],
        i
      ))
    );
    return (i) => n.map((a) => a(i));
  }
  if (r === "object") {
    if (!t || !e)
      throw new Error("Object cannot be null");
    if (I1(t) && I1(e)) {
      const a = t.getTime(), l = e.getTime() - a;
      return (u) => new Date(a + u * l);
    }
    const n = Object.keys(e), i = {};
    return n.forEach((a) => {
      i[a] = A0(t[a], e[a]);
    }), (a) => {
      const l = {};
      return n.forEach((u) => {
        l[u] = i[u](a);
      }), l;
    };
  }
  if (r === "number") {
    const n = (
      /** @type {number} */
      e - /** @type {number} */
      t
    );
    return (i) => t + i * n;
  }
  return () => e;
}
class Iv {
  #e;
  #t;
  /** @type {TweenedOptions<T>} */
  #r;
  /** @type {import('../internal/client/types').Task | null} */
  #n = null;
  /**
   * @param {T} value
   * @param {TweenedOptions<T>} options
   */
  constructor(e, r = {}) {
    this.#e = /* @__PURE__ */ ge(e), this.#t = /* @__PURE__ */ ge(e), this.#r = r;
  }
  /**
   * Create a tween whose value is bound to the return value of `fn`. This must be called
   * inside an effect root (for example, during component initialisation).
   *
   * ```svelte
   * <script>
   * 	import { Tween } from 'svelte/motion';
   *
   * 	let { number } = $props();
   *
   * 	const tween = Tween.of(() => number);
   * <\/script>
   * ```
   * @template U
   * @param {() => U} fn
   * @param {TweenedOptions<U>} [options]
   */
  static of(e, r) {
    const n = new Iv(e(), r);
    return yc(() => {
      n.set(e());
    }), n;
  }
  /**
   * Sets `tween.target` to `value` and returns a `Promise` that resolves if and when `tween.current` catches up to it.
   *
   * If `options` are provided, they will override the tween's defaults.
   * @param {T} value
   * @param {TweenedOptions<T>} [options]
   * @returns
   */
  set(e, r) {
    W(this.#t, e);
    let {
      delay: n = 0,
      duration: i = 400,
      easing: a = bC,
      interpolate: l = A0
    } = { ...this.#r, ...r };
    if (i === 0)
      return this.#n?.abort(), W(this.#e, e), Promise.resolve();
    const u = ri.now() + n;
    let c, f = !1, d = this.#n;
    return this.#n = e2((p) => {
      if (p < u)
        return !0;
      if (!f) {
        f = !0;
        const m = this.#e.v;
        c = l(m, e), typeof i == "function" && (i = i(m, e)), d?.abort();
      }
      const g = p - u;
      return g > /** @type {number} */
      i ? (W(this.#e, e), !1) : (W(this.#e, c(a(g / /** @type {number} */
      i))), !0);
    }), this.#n.promise;
  }
  get current() {
    return h(this.#e);
  }
  get target() {
    return h(this.#t);
  }
  set target(e) {
    this.set(e);
  }
}
function xC(t) {
  const e = t - 1;
  return e * e * e + 1;
}
function rd(t, { delay: e = 0, duration: r = 400, easing: n = xC, axis: i = "y" } = {}) {
  const a = getComputedStyle(t), l = +a.opacity, u = i === "y" ? "height" : "width", c = parseFloat(a[u]), f = i === "y" ? ["top", "bottom"] : ["left", "right"], d = f.map(
    (k) => (
      /** @type {'Left' | 'Right' | 'Top' | 'Bottom'} */
      `${k[0].toUpperCase()}${k.slice(1)}`
    )
  ), p = parseFloat(a[`padding${d[0]}`]), g = parseFloat(a[`padding${d[1]}`]), m = parseFloat(a[`margin${d[0]}`]), y = parseFloat(a[`margin${d[1]}`]), w = parseFloat(
    a[`border${d[0]}Width`]
  ), x = parseFloat(
    a[`border${d[1]}Width`]
  );
  return {
    delay: e,
    duration: r,
    easing: n,
    css: (k) => `overflow: hidden;opacity: ${Math.min(k * 20, 1) * l};${u}: ${k * c}px;padding-${f[0]}: ${k * p}px;padding-${f[1]}: ${k * g}px;margin-${f[0]}: ${k * m}px;margin-${f[1]}: ${k * y}px;border-${f[0]}-width: ${k * w}px;border-${f[1]}-width: ${k * x}px;min-${u}: 0`
  };
}
function t2() {
  return !(navigator.gpu == null || navigator.gpu.requestAdapter == null);
}
function wC(t) {
  return t == 0 && (t = 4), t % 4 != 0 && (t += 4 - t % 4), t;
}
function ws(t, e, r, n) {
  return (t.buffer == null || t.byteSize != r || t.usage != n) && (t.buffer != null && t.buffer.destroy(), t.buffer = e.createBuffer({ size: wC(r), usage: n }), t.byteSize = r, t.destroy = () => {
    t.buffer?.destroy();
  }), t.buffer;
}
function Rp(t, e, r, n) {
  if (t.buffer !== r || t.data !== n) {
    if (n != null)
      if (n.byteLength % 4 != 0) {
        let i = n.byteLength - n.byteLength % 4;
        if (e.queue.writeBuffer(r, 0, n, 0, i), n instanceof Uint8Array) {
          let a = new Uint8Array(4);
          for (let l = 0; l < 4; l++)
            i + l < n.length && (a[l] = n[i + l]);
          e.queue.writeBuffer(r, i, a);
        }
      } else
        e.queue.writeBuffer(r, 0, n, 0);
    else
      e.queue.writeBuffer(r, 0, new ArrayBuffer(r.size));
    t.buffer = r, t.data = n;
  }
  return r;
}
function j1(t, e, r, n, i, a) {
  return (t.texture == null || t.width != r || t.height != n || t.format != i || t.usage != a) && (t.texture != null && t.texture.destroy(), t.texture = e.createTexture({ size: [r, n], format: i, usage: a }), t.destroy = () => {
    t.texture?.destroy();
  }), t.texture;
}
const Jn = 2, jv = 4, qd = 8, xc = 16, Ui = 32, Fl = 64, r2 = 128, wo = 256, nd = 512, rn = 1024, So = 2048, $a = 4096, Lo = 8192, Nl = 16384, Uv = 32768, Wv = 65536, U1 = 1 << 17, kC = 1 << 18, Hv = 1 << 19, Vv = 1 << 20, E0 = 1 << 21, Gv = 1 << 22, al = 1 << 23, ll = Symbol("$state"), n2 = Symbol("legacy props"), _C = Symbol(""), Xv = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), o2 = 3, Yu = 8, SC = !1;
var Yv = Array.isArray, MC = Array.prototype.indexOf, Kv = Array.from, od = Object.defineProperty, ks = Object.getOwnPropertyDescriptor, i2 = Object.getOwnPropertyDescriptors, CC = Object.prototype, RC = Array.prototype, Zv = Object.getPrototypeOf, W1 = Object.isExtensible;
function a2(t) {
  for (var e = 0; e < t.length; e++)
    t[e]();
}
function AC() {
  var t, e, r = new Promise((n, i) => {
    t = n, e = i;
  });
  return { promise: r, resolve: t, reject: e };
}
function l2(t) {
  return t === this.v;
}
function s2(t, e) {
  return t != t ? e == e : t !== e || t !== null && typeof t == "object" || typeof t == "function";
}
function EC(t, e) {
  return t !== e;
}
function u2(t) {
  return !s2(t, this.v);
}
function TC() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function c2(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function $C() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function FC(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function NC() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function zC(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function OC() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function BC() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function DC(t) {
  throw new Error("https://svelte.dev/e/props_invalid_value");
}
function PC() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function LC() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function qC() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let IC = !1;
const Qv = 1, Jv = 2, f2 = 4, jC = 8, UC = 16, WC = 1, HC = 4, VC = 8, GC = 16, XC = 1, YC = 2, d2 = "[", eg = "[!", tg = "]", _s = {}, Wr = Symbol(), KC = "http://www.w3.org/1999/xhtml";
let eo = null;
function id(t) {
  eo = t;
}
function zl(t, e = !1, r) {
  eo = {
    p: eo,
    c: null,
    e: null,
    s: t,
    x: null,
    l: null
  };
}
function Ol(t) {
  var e = (
    /** @type {ComponentContext} */
    eo
  ), r = e.e;
  if (r !== null) {
    e.e = null;
    for (var n of r)
      B2(n);
  }
  return t !== void 0 && (e.x = t), eo = e.p, t ?? /** @type {T} */
  {};
}
function h2() {
  return !0;
}
function Id(t) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let Jt = !1;
function Ti(t) {
  Jt = t;
}
let Yt;
function qo(t) {
  if (t === null)
    throw Id(), _s;
  return Yt = t;
}
function wc() {
  return qo(
    /** @type {TemplateNode} */
    /* @__PURE__ */ Wi(Yt)
  );
}
function Br(t) {
  if (Jt) {
    if (/* @__PURE__ */ Wi(Yt) !== null)
      throw Id(), _s;
    Yt = t;
  }
}
function ZC(t = 1) {
  if (Jt) {
    for (var e = t, r = Yt; e--; )
      r = /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(r);
    Yt = r;
  }
}
function T0() {
  for (var t = 0, e = Yt; ; ) {
    if (e.nodeType === Yu) {
      var r = (
        /** @type {Comment} */
        e.data
      );
      if (r === tg) {
        if (t === 0) return e;
        t -= 1;
      } else (r === d2 || r === eg) && (t += 1);
    }
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(e)
    );
    e.remove(), e = n;
  }
}
function p2(t) {
  if (!t || t.nodeType !== Yu)
    throw Id(), _s;
  return (
    /** @type {Comment} */
    t.data
  );
}
function Ja(t) {
  if (typeof t != "object" || t === null || ll in t)
    return t;
  const e = Zv(t);
  if (e !== CC && e !== RC)
    return t;
  var r = /* @__PURE__ */ new Map(), n = Yv(t), i = /* @__PURE__ */ pr(0), a = ul, l = (u) => {
    if (ul === a)
      return u();
    var c = Pt, f = ul;
    fi(null), K1(a);
    var d = u();
    return fi(c), K1(f), d;
  };
  return n && r.set("length", /* @__PURE__ */ pr(
    /** @type {any[]} */
    t.length
  )), new Proxy(
    /** @type {any} */
    t,
    {
      defineProperty(u, c, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && PC();
        var d = r.get(c);
        return d === void 0 ? d = l(() => {
          var p = /* @__PURE__ */ pr(f.value);
          return r.set(c, p), p;
        }) : ot(d, f.value, !0), !0;
      },
      deleteProperty(u, c) {
        var f = r.get(c);
        if (f === void 0) {
          if (c in u) {
            const d = l(() => /* @__PURE__ */ pr(Wr));
            r.set(c, d), Ap(i);
          }
        } else
          ot(f, Wr), Ap(i);
        return !0;
      },
      get(u, c, f) {
        if (c === ll)
          return t;
        var d = r.get(c), p = c in u;
        if (d === void 0 && (!p || ks(u, c)?.writable) && (d = l(() => {
          var m = Ja(p ? u[c] : Wr), y = /* @__PURE__ */ pr(m);
          return y;
        }), r.set(c, d)), d !== void 0) {
          var g = O(d);
          return g === Wr ? void 0 : g;
        }
        return Reflect.get(u, c, f);
      },
      getOwnPropertyDescriptor(u, c) {
        var f = Reflect.getOwnPropertyDescriptor(u, c);
        if (f && "value" in f) {
          var d = r.get(c);
          d && (f.value = O(d));
        } else if (f === void 0) {
          var p = r.get(c), g = p?.v;
          if (p !== void 0 && g !== Wr)
            return {
              enumerable: !0,
              configurable: !0,
              value: g,
              writable: !0
            };
        }
        return f;
      },
      has(u, c) {
        if (c === ll)
          return !0;
        var f = r.get(c), d = f !== void 0 && f.v !== Wr || Reflect.has(u, c);
        if (f !== void 0 || Nt !== null && (!d || ks(u, c)?.writable)) {
          f === void 0 && (f = l(() => {
            var g = d ? Ja(u[c]) : Wr, m = /* @__PURE__ */ pr(g);
            return m;
          }), r.set(c, f));
          var p = O(f);
          if (p === Wr)
            return !1;
        }
        return d;
      },
      set(u, c, f, d) {
        var p = r.get(c), g = c in u;
        if (n && c === "length")
          for (var m = f; m < /** @type {Source<number>} */
          p.v; m += 1) {
            var y = r.get(m + "");
            y !== void 0 ? ot(y, Wr) : m in u && (y = l(() => /* @__PURE__ */ pr(Wr)), r.set(m + "", y));
          }
        if (p === void 0)
          (!g || ks(u, c)?.writable) && (p = l(() => /* @__PURE__ */ pr(void 0)), ot(p, Ja(f)), r.set(c, p));
        else {
          g = p.v !== Wr;
          var w = l(() => Ja(f));
          ot(p, w);
        }
        var x = Reflect.getOwnPropertyDescriptor(u, c);
        if (x?.set && x.set.call(d, f), !g) {
          if (n && typeof c == "string") {
            var k = (
              /** @type {Source<number>} */
              r.get("length")
            ), S = Number(c);
            Number.isInteger(S) && S >= k.v && ot(k, S + 1);
          }
          Ap(i);
        }
        return !0;
      },
      ownKeys(u) {
        O(i);
        var c = Reflect.ownKeys(u).filter((p) => {
          var g = r.get(p);
          return g === void 0 || g.v !== Wr;
        });
        for (var [f, d] of r)
          d.v !== Wr && !(f in u) && c.push(f);
        return c;
      },
      setPrototypeOf() {
        LC();
      }
    }
  );
}
var H1, v2, g2, m2;
function $0() {
  if (H1 === void 0) {
    H1 = window, v2 = /Firefox/.test(navigator.userAgent);
    var t = Element.prototype, e = Node.prototype, r = Text.prototype;
    g2 = ks(e, "firstChild").get, m2 = ks(e, "nextSibling").get, W1(t) && (t.__click = void 0, t.__className = void 0, t.__attributes = null, t.__style = void 0, t.__e = void 0), W1(r) && (r.__t = void 0);
  }
}
function ka(t = "") {
  return document.createTextNode(t);
}
// @__NO_SIDE_EFFECTS__
function Li(t) {
  return g2.call(t);
}
// @__NO_SIDE_EFFECTS__
function Wi(t) {
  return m2.call(t);
}
function Vr(t, e) {
  if (!Jt)
    return /* @__PURE__ */ Li(t);
  var r = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ Li(Yt)
  );
  if (r === null)
    r = Yt.appendChild(ka());
  else if (e && r.nodeType !== o2) {
    var n = ka();
    return r?.before(n), qo(n), n;
  }
  return qo(r), r;
}
function gs(t, e) {
  if (!Jt) {
    var r = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ Li(
        /** @type {Node} */
        t
      )
    );
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ Wi(r) : r;
  }
  return Yt;
}
function mr(t, e = 1, r = !1) {
  let n = Jt ? Yt : t;
  for (var i; e--; )
    i = n, n = /** @type {TemplateNode} */
    /* @__PURE__ */ Wi(n);
  if (!Jt)
    return n;
  if (r && n?.nodeType !== o2) {
    var a = ka();
    return n === null ? i?.after(a) : n.before(a), qo(a), a;
  }
  return qo(n), /** @type {TemplateNode} */
  n;
}
function y2(t) {
  t.textContent = "";
}
function QC() {
  return !1;
}
const JC = /* @__PURE__ */ new WeakMap();
function eR(t) {
  var e = Nt;
  if (e === null)
    return Pt.f |= al, t;
  if ((e.f & Uv) === 0) {
    if ((e.f & r2) === 0)
      throw !e.parent && t instanceof Error && b2(t), t;
    e.b.error(t);
  } else
    rg(t, e);
}
function rg(t, e) {
  for (; e !== null; ) {
    if ((e.f & r2) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (r) {
        t = r;
      }
    e = e.parent;
  }
  throw t instanceof Error && b2(t), t;
}
function b2(t) {
  const e = JC.get(t);
  e && (od(t, "message", {
    value: e.message
  }), od(t, "stack", {
    value: e.stack
  }));
}
let Ku = [], F0 = [];
function x2() {
  var t = Ku;
  Ku = [], a2(t);
}
function tR() {
  var t = F0;
  F0 = [], a2(t);
}
function ng(t) {
  Ku.length === 0 && queueMicrotask(x2), Ku.push(t);
}
function rR() {
  Ku.length > 0 && x2(), F0.length > 0 && tR();
}
function nR() {
  for (var t = (
    /** @type {Effect} */
    Nt.b
  ); t !== null && !t.has_pending_snippet(); )
    t = t.parent;
  return t === null && TC(), t;
}
// @__NO_SIDE_EFFECTS__
function jd(t) {
  var e = Jn | So, r = Pt !== null && (Pt.f & Jn) !== 0 ? (
    /** @type {Derived} */
    Pt
  ) : null;
  return Nt === null || r !== null && (r.f & wo) !== 0 ? e |= wo : Nt.f |= Hv, {
    ctx: eo,
    deps: null,
    effects: null,
    equals: l2,
    f: e,
    fn: t,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Wr
    ),
    wv: 0,
    parent: r ?? Nt,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function oR(t, e) {
  let r = (
    /** @type {Effect | null} */
    Nt
  );
  r === null && $C();
  var n = (
    /** @type {Boundary} */
    r.b
  ), i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), a = Zu(
    /** @type {V} */
    Wr
  ), l = null, u = !Pt;
  return mR(() => {
    try {
      var c = t();
    } catch (m) {
      c = Promise.reject(m);
    }
    var f = () => c;
    i = l?.then(f, f) ?? Promise.resolve(c), l = i;
    var d = (
      /** @type {Batch} */
      zr
    ), p = n.pending;
    u && (n.update_pending_count(1), p || d.increment());
    const g = (m, y = void 0) => {
      l = null, p || d.activate(), y ? y !== Xv && (a.f |= al, Qu(a, y)) : ((a.f & al) !== 0 && (a.f ^= al), Qu(a, m)), u && (n.update_pending_count(-1), p || d.decrement()), S2();
    };
    if (i.then(g, (m) => g(null, m || "unknown")), d)
      return () => {
        queueMicrotask(() => d.neuter());
      };
  }), new Promise((c) => {
    function f(d) {
      function p() {
        d === i ? c(a) : f(i);
      }
      d.then(p, p);
    }
    f(i);
  });
}
// @__NO_SIDE_EFFECTS__
function He(t) {
  const e = /* @__PURE__ */ jd(t);
  return E2(e), e;
}
// @__NO_SIDE_EFFECTS__
function w2(t) {
  const e = /* @__PURE__ */ jd(t);
  return e.equals = u2, e;
}
function k2(t) {
  var e = t.effects;
  if (e !== null) {
    t.effects = null;
    for (var r = 0; r < e.length; r += 1)
      qi(
        /** @type {Effect} */
        e[r]
      );
  }
}
function iR(t) {
  for (var e = t.parent; e !== null; ) {
    if ((e.f & Jn) === 0)
      return (
        /** @type {Effect} */
        e
      );
    e = e.parent;
  }
  return null;
}
function og(t) {
  var e, r = Nt;
  _a(iR(t));
  try {
    k2(t), e = N2(t);
  } finally {
    _a(r);
  }
  return e;
}
function _2(t) {
  var e = og(t);
  if (t.equals(e) || (t.v = e, t.wv = $2()), !Bl)
    if (Ps !== null)
      Ps.set(t, t.v);
    else {
      var r = (ha || (t.f & wo) !== 0) && t.deps !== null ? $a : rn;
      Bn(t, r);
    }
}
function aR(t, e, r) {
  const n = jd;
  if (e.length === 0) {
    r(t.map(n));
    return;
  }
  var i = zr, a = (
    /** @type {Effect} */
    Nt
  ), l = lR(), u = nR();
  Promise.all(e.map((c) => /* @__PURE__ */ oR(c))).then((c) => {
    i?.activate(), l();
    try {
      r([...t.map(n), ...c]);
    } catch (f) {
      (a.f & Nl) === 0 && rg(f, a);
    }
    i?.deactivate(), S2();
  }).catch((c) => {
    u.error(c);
  });
}
function lR() {
  var t = Nt, e = Pt, r = eo;
  return function() {
    _a(t), fi(e), id(r);
  };
}
function S2() {
  _a(null), fi(null), id(null);
}
const wu = /* @__PURE__ */ new Set();
let zr = null, Ps = null, V1 = /* @__PURE__ */ new Set(), ad = [];
function M2() {
  const t = (
    /** @type {() => void} */
    ad.shift()
  );
  ad.length > 0 && queueMicrotask(M2), t();
}
let xl = [], Ud = null, N0 = !1, qf = !1;
class Ls {
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
  #e = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<() => void>}
   */
  #t = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #r = 0;
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #n = null;
  /**
   * True if an async effect inside this batch resolved and
   * its parent branch was already deleted
   */
  #u = !1;
  /**
   * Async effects (created inside `async_derived`) encountered during processing.
   * These run after the rest of the batch has updated, since they should
   * always have the latest values
   * @type {Effect[]}
   */
  #o = [];
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
  #l = [];
  /**
   * The same as `#render_effects`, but for `$effect` (which runs after)
   * @type {Effect[]}
   */
  #a = [];
  /**
   * Block effects, which may need to re-run on subsequent flushes
   * in order to update internal sources (e.g. each block items)
   * @type {Effect[]}
   */
  #s = [];
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Effect[]}
   */
  #f = [];
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Effect[]}
   */
  #c = [];
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
  process(e) {
    xl = [];
    var r = null;
    if (wu.size > 1) {
      r = /* @__PURE__ */ new Map(), Ps = /* @__PURE__ */ new Map();
      for (const [a, l] of this.current)
        r.set(a, { v: a.v, wv: a.wv }), a.v = l;
      for (const a of wu)
        if (a !== this)
          for (const [l, u] of a.#e)
            r.has(l) || (r.set(l, { v: l.v, wv: l.wv }), l.v = u);
    }
    for (const a of e)
      this.#p(a);
    if (this.#o.length === 0 && this.#r === 0) {
      this.#h();
      var n = this.#l, i = this.#a;
      this.#l = [], this.#a = [], this.#s = [], zr = null, G1(n), G1(i), zr === null ? zr = this : wu.delete(this), this.#n?.resolve();
    } else
      this.#d(this.#l), this.#d(this.#a), this.#d(this.#s);
    if (r) {
      for (const [a, { v: l, wv: u }] of r)
        a.wv <= u && (a.v = l);
      Ps = null;
    }
    for (const a of this.#o)
      Du(a);
    for (const a of this.#i)
      Du(a);
    this.#o = [], this.#i = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #p(e) {
    e.f ^= rn;
    for (var r = e.first; r !== null; ) {
      var n = r.f, i = (n & (Ui | Fl)) !== 0, a = i && (n & rn) !== 0, l = a || (n & Lo) !== 0 || this.skipped_effects.has(r);
      if (!l && r.fn !== null) {
        if (i)
          r.f ^= rn;
        else if ((n & rn) === 0)
          if ((n & jv) !== 0)
            this.#a.push(r);
          else if ((n & Gv) !== 0) {
            var u = r.b?.pending ? this.#i : this.#o;
            u.push(r);
          } else Wd(r) && ((r.f & xc) !== 0 && this.#s.push(r), Du(r));
        var c = r.first;
        if (c !== null) {
          r = c;
          continue;
        }
      }
      var f = r.parent;
      for (r = r.next; r === null && f !== null; )
        r = f.next, f = f.parent;
    }
  }
  /**
   * @param {Effect[]} effects
   */
  #d(e) {
    for (const r of e)
      ((r.f & So) !== 0 ? this.#f : this.#c).push(r), Bn(r, rn);
    e.length = 0;
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} value
   */
  capture(e, r) {
    this.#e.has(e) || this.#e.set(e, r), this.current.set(e, e.v);
  }
  activate() {
    zr = this;
  }
  deactivate() {
    zr = null;
    for (const e of V1)
      if (V1.delete(e), e(), zr !== null)
        break;
  }
  neuter() {
    this.#u = !0;
  }
  flush() {
    xl.length > 0 ? C2() : this.#h(), zr === this && (this.#r === 0 && wu.delete(this), this.deactivate());
  }
  /**
   * Append and remove branches to/from the DOM
   */
  #h() {
    if (!this.#u)
      for (const e of this.#t)
        e();
    this.#t.clear();
  }
  increment() {
    this.#r += 1;
  }
  decrement() {
    if (this.#r -= 1, this.#r === 0) {
      for (const e of this.#f)
        Bn(e, So), wl(e);
      for (const e of this.#c)
        Bn(e, $a), wl(e);
      this.#l = [], this.#a = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#t.add(e);
  }
  settled() {
    return (this.#n ??= AC()).promise;
  }
  static ensure() {
    if (zr === null) {
      const e = zr = new Ls();
      wu.add(zr), qf || Ls.enqueue(() => {
        zr === e && e.flush();
      });
    }
    return zr;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    ad.length === 0 && queueMicrotask(M2), ad.unshift(e);
  }
}
function sR(t) {
  var e = qf;
  qf = !0;
  try {
    for (var r; ; ) {
      if (rR(), xl.length === 0 && (zr?.flush(), xl.length === 0))
        return Ud = null, /** @type {T} */
        r;
      C2();
    }
  } finally {
    qf = e;
  }
}
function C2() {
  var t = Ss;
  N0 = !0;
  try {
    var e = 0;
    for (X1(!0); xl.length > 0; ) {
      var r = Ls.ensure();
      if (e++ > 1e3) {
        var n, i;
        uR();
      }
      r.process(xl), sl.clear();
    }
  } finally {
    N0 = !1, X1(t), Ud = null;
  }
}
function uR() {
  try {
    OC();
  } catch (t) {
    rg(t, Ud);
  }
}
function G1(t) {
  var e = t.length;
  if (e !== 0) {
    for (var r = 0; r < e; ) {
      var n = t[r++];
      if ((n.f & (Nl | Lo)) === 0 && Wd(n)) {
        var i = zr ? zr.current.size : 0;
        if (Du(n), n.deps === null && n.first === null && n.nodes_start === null && (n.teardown === null && n.ac === null ? I2(n) : n.fn = null), zr !== null && zr.current.size > i && (n.f & Vv) !== 0)
          break;
      }
    }
    for (; r < e; )
      wl(t[r++]);
  }
}
function wl(t) {
  for (var e = Ud = t; e.parent !== null; ) {
    e = e.parent;
    var r = e.f;
    if (N0 && e === Nt && (r & xc) !== 0)
      return;
    if ((r & (Fl | Ui)) !== 0) {
      if ((r & rn) === 0) return;
      e.f ^= rn;
    }
  }
  xl.push(e);
}
const sl = /* @__PURE__ */ new Map();
function Zu(t, e) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: t,
    reactions: null,
    equals: l2,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function pr(t, e) {
  const r = Zu(t);
  return E2(r), r;
}
// @__NO_SIDE_EFFECTS__
function R2(t, e = !1, r = !0) {
  const n = Zu(t);
  return e || (n.equals = u2), n;
}
function ot(t, e, r = !1) {
  Pt !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!ni || (Pt.f & U1) !== 0) && h2() && (Pt.f & (Jn | xc | Gv | U1)) !== 0 && !Bi?.includes(t) && qC();
  let n = r ? Ja(e) : e;
  return Qu(t, n);
}
function Qu(t, e) {
  if (!t.equals(e)) {
    var r = t.v;
    Bl ? sl.set(t, e) : sl.set(t, r), t.v = e;
    var n = Ls.ensure();
    n.capture(t, r), (t.f & Jn) !== 0 && ((t.f & So) !== 0 && og(
      /** @type {Derived} */
      t
    ), Bn(t, (t.f & wo) === 0 ? rn : $a)), t.wv = $2(), A2(t, So), Nt !== null && (Nt.f & rn) !== 0 && (Nt.f & (Ui | Fl)) === 0 && (ho === null ? cR([t]) : ho.push(t));
  }
  return e;
}
function Ap(t) {
  ot(t, t.v + 1);
}
function A2(t, e) {
  var r = t.reactions;
  if (r !== null)
    for (var n = r.length, i = 0; i < n; i++) {
      var a = r[i], l = a.f, u = (l & So) === 0;
      u && Bn(a, e), (l & Jn) !== 0 ? A2(
        /** @type {Derived} */
        a,
        $a
      ) : u && wl(
        /** @type {Effect} */
        a
      );
    }
}
let Ss = !1;
function X1(t) {
  Ss = t;
}
let Bl = !1;
function Y1(t) {
  Bl = t;
}
let Pt = null, ni = !1;
function fi(t) {
  Pt = t;
}
let Nt = null;
function _a(t) {
  Nt = t;
}
let Bi = null;
function E2(t) {
  Pt !== null && (Bi === null ? Bi = [t] : Bi.push(t));
}
let pn = null, Gn = 0, ho = null;
function cR(t) {
  ho = t;
}
let T2 = 1, Ju = 0, ul = Ju;
function K1(t) {
  ul = t;
}
let ha = !1;
function $2() {
  return ++T2;
}
function Wd(t) {
  var e = t.f;
  if ((e & So) !== 0)
    return !0;
  if ((e & $a) !== 0) {
    var r = t.deps, n = (e & wo) !== 0;
    if (r !== null) {
      var i, a, l = (e & nd) !== 0, u = n && Nt !== null && !ha, c = r.length;
      if ((l || u) && (Nt === null || (Nt.f & Nl) === 0)) {
        var f = (
          /** @type {Derived} */
          t
        ), d = f.parent;
        for (i = 0; i < c; i++)
          a = r[i], (l || !a?.reactions?.includes(f)) && (a.reactions ??= []).push(f);
        l && (f.f ^= nd), u && d !== null && (d.f & wo) === 0 && (f.f ^= wo);
      }
      for (i = 0; i < c; i++)
        if (a = r[i], Wd(
          /** @type {Derived} */
          a
        ) && _2(
          /** @type {Derived} */
          a
        ), a.wv > t.wv)
          return !0;
    }
    (!n || Nt !== null && !ha) && Bn(t, rn);
  }
  return !1;
}
function F2(t, e, r = !0) {
  var n = t.reactions;
  if (n !== null && !Bi?.includes(t))
    for (var i = 0; i < n.length; i++) {
      var a = n[i];
      (a.f & Jn) !== 0 ? F2(
        /** @type {Derived} */
        a,
        e,
        !1
      ) : e === a && (r ? Bn(a, So) : (a.f & rn) !== 0 && Bn(a, $a), wl(
        /** @type {Effect} */
        a
      ));
    }
}
function N2(t) {
  var e = pn, r = Gn, n = ho, i = Pt, a = ha, l = Bi, u = eo, c = ni, f = ul, d = t.f;
  pn = /** @type {null | Value[]} */
  null, Gn = 0, ho = null, ha = (d & wo) !== 0 && (ni || !Ss || Pt === null), Pt = (d & (Ui | Fl)) === 0 ? t : null, Bi = null, id(t.ctx), ni = !1, ul = ++Ju, t.ac !== null && (t.ac.abort(Xv), t.ac = null);
  try {
    t.f |= E0;
    var p = (
      /** @type {Function} */
      (0, t.fn)()
    ), g = t.deps;
    if (pn !== null) {
      var m;
      if (ld(t, Gn), g !== null && Gn > 0)
        for (g.length = Gn + pn.length, m = 0; m < pn.length; m++)
          g[Gn + m] = pn[m];
      else
        t.deps = g = pn;
      if (!ha || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (d & Jn) !== 0 && /** @type {import('#client').Derived} */
      t.reactions !== null)
        for (m = Gn; m < g.length; m++)
          (g[m].reactions ??= []).push(t);
    } else g !== null && Gn < g.length && (ld(t, Gn), g.length = Gn);
    if (h2() && ho !== null && !ni && g !== null && (t.f & (Jn | $a | So)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      ho.length; m++)
        F2(
          ho[m],
          /** @type {Effect} */
          t
        );
    return i !== null && i !== t && (Ju++, ho !== null && (n === null ? n = ho : n.push(.../** @type {Source[]} */
    ho))), (t.f & al) !== 0 && (t.f ^= al), p;
  } catch (y) {
    return eR(y);
  } finally {
    t.f ^= E0, pn = e, Gn = r, ho = n, Pt = i, ha = a, Bi = l, id(u), ni = c, ul = f;
  }
}
function fR(t, e) {
  let r = e.reactions;
  if (r !== null) {
    var n = MC.call(r, t);
    if (n !== -1) {
      var i = r.length - 1;
      i === 0 ? r = e.reactions = null : (r[n] = r[i], r.pop());
    }
  }
  r === null && (e.f & Jn) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (pn === null || !pn.includes(e)) && (Bn(e, $a), (e.f & (wo | nd)) === 0 && (e.f ^= nd), k2(
    /** @type {Derived} **/
    e
  ), ld(
    /** @type {Derived} **/
    e,
    0
  ));
}
function ld(t, e) {
  var r = t.deps;
  if (r !== null)
    for (var n = e; n < r.length; n++)
      fR(t, r[n]);
}
function Du(t) {
  var e = t.f;
  if ((e & Nl) === 0) {
    Bn(t, rn);
    var r = Nt, n = Ss;
    Nt = t, Ss = !0;
    try {
      (e & xc) !== 0 ? yR(t) : q2(t), L2(t);
      var i = N2(t);
      t.teardown = typeof i == "function" ? i : null, t.wv = T2;
      var a;
      SC && IC && (t.f & So) !== 0 && t.deps;
    } finally {
      Ss = n, Nt = r;
    }
  }
}
function O(t) {
  var e = t.f, r = (e & Jn) !== 0;
  if (Pt !== null && !ni) {
    var n = Nt !== null && (Nt.f & Nl) !== 0;
    if (!n && !Bi?.includes(t)) {
      var i = Pt.deps;
      if ((Pt.f & E0) !== 0)
        t.rv < Ju && (t.rv = Ju, pn === null && i !== null && i[Gn] === t ? Gn++ : pn === null ? pn = [t] : (!ha || !pn.includes(t)) && pn.push(t));
      else {
        (Pt.deps ??= []).push(t);
        var a = t.reactions;
        a === null ? t.reactions = [Pt] : a.includes(Pt) || a.push(Pt);
      }
    }
  } else if (r && /** @type {Derived} */
  t.deps === null && /** @type {Derived} */
  t.effects === null) {
    var l = (
      /** @type {Derived} */
      t
    ), u = l.parent;
    u !== null && (u.f & wo) === 0 && (l.f ^= wo);
  }
  if (Bl) {
    if (sl.has(t))
      return sl.get(t);
    if (r) {
      l = /** @type {Derived} */
      t;
      var c = l.v;
      return ((l.f & rn) === 0 && l.reactions !== null || z2(l)) && (c = og(l)), sl.set(l, c), c;
    }
  } else if (r) {
    if (l = /** @type {Derived} */
    t, Ps?.has(l))
      return Ps.get(l);
    Wd(l) && _2(l);
  }
  if ((t.f & al) !== 0)
    throw t.v;
  return t.v;
}
function z2(t) {
  if (t.v === Wr) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps)
    if (sl.has(e) || (e.f & Jn) !== 0 && z2(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function Vs(t) {
  var e = ni;
  try {
    return ni = !0, t();
  } finally {
    ni = e;
  }
}
const dR = -7169;
function Bn(t, e) {
  t.f = t.f & dR | e;
}
function hR(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (ll in t)
      z0(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const r = t[e];
        typeof r == "object" && r && ll in r && z0(r);
      }
  }
}
function z0(t, e = /* @__PURE__ */ new Set()) {
  if (typeof t == "object" && t !== null && // We don't want to traverse DOM elements
  !(t instanceof EventTarget) && !e.has(t)) {
    e.add(t), t instanceof Date && t.getTime();
    for (let n in t)
      try {
        z0(t[n], e);
      } catch {
      }
    const r = Zv(t);
    if (r !== Object.prototype && r !== Array.prototype && r !== Map.prototype && r !== Set.prototype && r !== Date.prototype) {
      const n = i2(r);
      for (let i in n) {
        const a = n[i].get;
        if (a)
          try {
            a.call(t);
          } catch {
          }
      }
    }
  }
}
function O2(t) {
  Nt === null && Pt === null && zC(), Pt !== null && (Pt.f & wo) !== 0 && Nt === null && NC(), Bl && FC();
}
function pR(t, e) {
  var r = e.last;
  r === null ? e.last = e.first = t : (r.next = t, t.prev = r, e.last = t);
}
function gi(t, e, r, n = !0) {
  var i = Nt;
  i !== null && (i.f & Lo) !== 0 && (t |= Lo);
  var a = {
    ctx: eo,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | So,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: i,
    b: i && i.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (r)
    try {
      Du(a), a.f |= Uv;
    } catch (c) {
      throw qi(a), c;
    }
  else e !== null && wl(a);
  var l = r && a.deps === null && a.first === null && a.nodes_start === null && a.teardown === null && (a.f & Hv) === 0;
  if (!l && n && (i !== null && pR(a, i), Pt !== null && (Pt.f & Jn) !== 0 && (t & Fl) === 0)) {
    var u = (
      /** @type {Derived} */
      Pt
    );
    (u.effects ??= []).push(a);
  }
  return a;
}
function vR(t) {
  const e = gi(qd, null, !1);
  return Bn(e, rn), e.teardown = t, e;
}
function Ai(t) {
  O2();
  var e = (
    /** @type {Effect} */
    Nt.f
  ), r = !Pt && (e & Ui) !== 0 && (e & Uv) === 0;
  if (r) {
    var n = (
      /** @type {ComponentContext} */
      eo
    );
    (n.e ??= []).push(t);
  } else
    return B2(t);
}
function B2(t) {
  return gi(jv | Vv, t, !1);
}
function sd(t) {
  return O2(), gi(qd | Vv, t, !0);
}
function gR(t) {
  Ls.ensure();
  const e = gi(Fl, t, !0);
  return (r = {}) => new Promise((n) => {
    r.outro ? Hd(e, () => {
      qi(e), n(void 0);
    }) : (qi(e), n(void 0));
  });
}
function D2(t) {
  return gi(jv, t, !1);
}
function mR(t) {
  return gi(Gv | Hv, t, !0);
}
function P2(t, e = 0) {
  return gi(qd | e, t, !0);
}
function Kn(t, e = [], r = []) {
  aR(e, r, (n) => {
    gi(qd, () => t(...n.map(O)), !0);
  });
}
function ig(t, e = 0) {
  var r = gi(xc | e, t, !0);
  return r;
}
function kl(t, e = !0) {
  return gi(Ui, t, !0, e);
}
function L2(t) {
  var e = t.teardown;
  if (e !== null) {
    const r = Bl, n = Pt;
    Y1(!0), fi(null);
    try {
      e.call(null);
    } finally {
      Y1(r), fi(n);
    }
  }
}
function q2(t, e = !1) {
  var r = t.first;
  for (t.first = t.last = null; r !== null; ) {
    r.ac?.abort(Xv);
    var n = r.next;
    (r.f & Fl) !== 0 ? r.parent = null : qi(r, e), r = n;
  }
}
function yR(t) {
  for (var e = t.first; e !== null; ) {
    var r = e.next;
    (e.f & Ui) === 0 && qi(e), e = r;
  }
}
function qi(t, e = !0) {
  var r = !1;
  (e || (t.f & kC) !== 0) && t.nodes_start !== null && t.nodes_end !== null && (bR(
    t.nodes_start,
    /** @type {TemplateNode} */
    t.nodes_end
  ), r = !0), q2(t, e && !r), ld(t, 0), Bn(t, Nl);
  var n = t.transitions;
  if (n !== null)
    for (const a of n)
      a.stop();
  L2(t);
  var i = t.parent;
  i !== null && i.first !== null && I2(t), t.next = t.prev = t.teardown = t.ctx = t.deps = t.fn = t.nodes_start = t.nodes_end = t.ac = null;
}
function bR(t, e) {
  for (; t !== null; ) {
    var r = t === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(t)
    );
    t.remove(), t = r;
  }
}
function I2(t) {
  var e = t.parent, r = t.prev, n = t.next;
  r !== null && (r.next = n), n !== null && (n.prev = r), e !== null && (e.first === t && (e.first = n), e.last === t && (e.last = r));
}
function Hd(t, e) {
  var r = [];
  ag(t, r, !0), j2(r, () => {
    qi(t), e && e();
  });
}
function j2(t, e) {
  var r = t.length;
  if (r > 0) {
    var n = () => --r || e();
    for (var i of t)
      i.out(n);
  } else
    e();
}
function ag(t, e, r) {
  if ((t.f & Lo) === 0) {
    if (t.f ^= Lo, t.transitions !== null)
      for (const l of t.transitions)
        (l.is_global || r) && e.push(l);
    for (var n = t.first; n !== null; ) {
      var i = n.next, a = (n.f & Wv) !== 0 || (n.f & Ui) !== 0;
      ag(n, e, a ? r : !1), n = i;
    }
  }
}
function lg(t) {
  U2(t, !0);
}
function U2(t, e) {
  if ((t.f & Lo) !== 0) {
    t.f ^= Lo, (t.f & rn) === 0 && (Bn(t, So), wl(t));
    for (var r = t.first; r !== null; ) {
      var n = r.next, i = (r.f & Wv) !== 0 || (r.f & Ui) !== 0;
      U2(r, i ? e : !1), r = n;
    }
    if (t.transitions !== null)
      for (const a of t.transitions)
        (a.is_global || e) && a.in();
  }
}
function xR(t) {
  var e = Pt, r = Nt;
  fi(null), _a(null);
  try {
    return t();
  } finally {
    fi(e), _a(r);
  }
}
const W2 = /* @__PURE__ */ new Set(), O0 = /* @__PURE__ */ new Set();
function wR(t, e, r, n = {}) {
  function i(a) {
    if (n.capture || Fu.call(e, a), !a.cancelBubble)
      return xR(() => r?.call(this, a));
  }
  return t.startsWith("pointer") || t.startsWith("touch") || t === "wheel" ? ng(() => {
    e.addEventListener(t, i, n);
  }) : e.addEventListener(t, i, n), i;
}
function Z1(t, e, r, n, i) {
  var a = { capture: n, passive: i }, l = wR(t, e, r, a);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && vR(() => {
    e.removeEventListener(t, l, a);
  });
}
function sg(t) {
  for (var e = 0; e < t.length; e++)
    W2.add(t[e]);
  for (var r of O0)
    r(t);
}
let Q1 = null;
function Fu(t) {
  var e = this, r = (
    /** @type {Node} */
    e.ownerDocument
  ), n = t.type, i = t.composedPath?.() || [], a = (
    /** @type {null | Element} */
    i[0] || t.target
  );
  Q1 = t;
  var l = 0, u = Q1 === t && t.__root;
  if (u) {
    var c = i.indexOf(u);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      t.__root = e;
      return;
    }
    var f = i.indexOf(e);
    if (f === -1)
      return;
    c <= f && (l = c);
  }
  if (a = /** @type {Element} */
  i[l] || t.target, a !== e) {
    od(t, "currentTarget", {
      configurable: !0,
      get() {
        return a || r;
      }
    });
    var d = Pt, p = Nt;
    fi(null), _a(null);
    try {
      for (var g, m = []; a !== null; ) {
        var y = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var w = a["__" + n];
          if (w != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          t.target === a))
            if (Yv(w)) {
              var [x, ...k] = w;
              x.apply(a, [t, ...k]);
            } else
              w.call(a, t);
        } catch (S) {
          g ? m.push(S) : g = S;
        }
        if (t.cancelBubble || y === e || y === null)
          break;
        a = y;
      }
      if (g) {
        for (let S of m)
          queueMicrotask(() => {
            throw S;
          });
        throw g;
      }
    } finally {
      t.__root = e, delete t.currentTarget, fi(d), _a(p);
    }
  }
}
function H2(t) {
  var e = document.createElement("template");
  return e.innerHTML = t.replaceAll("<!>", "<!---->"), e.content;
}
function xa(t, e) {
  var r = (
    /** @type {Effect} */
    Nt
  );
  r.nodes_start === null && (r.nodes_start = t, r.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function Fa(t, e) {
  var r = (e & XC) !== 0, n = (e & YC) !== 0, i, a = !t.startsWith("<!>");
  return () => {
    if (Jt)
      return xa(Yt, null), Yt;
    i === void 0 && (i = H2(a ? t : "<!>" + t), r || (i = /** @type {Node} */
    /* @__PURE__ */ Li(i)));
    var l = (
      /** @type {TemplateNode} */
      n || v2 ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (r) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ Li(l)
      ), c = (
        /** @type {TemplateNode} */
        l.lastChild
      );
      xa(u, c);
    } else
      xa(l, l);
    return l;
  };
}
// @__NO_SIDE_EFFECTS__
function kR(t, e, r = "svg") {
  var n = !t.startsWith("<!>"), i = `<${r}>${n ? t : "<!>" + t}</${r}>`, a;
  return () => {
    if (Jt)
      return xa(Yt, null), Yt;
    if (!a) {
      var l = (
        /** @type {DocumentFragment} */
        H2(i)
      ), u = (
        /** @type {Element} */
        /* @__PURE__ */ Li(l)
      );
      a = /** @type {Element} */
      /* @__PURE__ */ Li(u);
    }
    var c = (
      /** @type {TemplateNode} */
      a.cloneNode(!0)
    );
    return xa(c, c), c;
  };
}
// @__NO_SIDE_EFFECTS__
function Hi(t, e) {
  return /* @__PURE__ */ kR(t, e, "svg");
}
function ku() {
  if (Jt)
    return xa(Yt, null), Yt;
  var t = document.createDocumentFragment(), e = document.createComment(""), r = ka();
  return t.append(e, r), xa(e, r), t;
}
function kr(t, e) {
  if (Jt) {
    Nt.nodes_end = Yt, wc();
    return;
  }
  t !== null && t.before(
    /** @type {Node} */
    e
  );
}
const _R = ["touchstart", "touchmove"];
function SR(t) {
  return _R.includes(t);
}
function Pu(t, e) {
  var r = e == null ? "" : typeof e == "object" ? e + "" : e;
  r !== (t.__t ??= t.nodeValue) && (t.__t = r, t.nodeValue = r + "");
}
function V2(t, e) {
  return G2(t, e);
}
function MR(t, e) {
  $0(), e.intro = e.intro ?? !1;
  const r = e.target, n = Jt, i = Yt;
  try {
    for (var a = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Li(r)
    ); a && (a.nodeType !== Yu || /** @type {Comment} */
    a.data !== d2); )
      a = /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(a);
    if (!a)
      throw _s;
    Ti(!0), qo(
      /** @type {Comment} */
      a
    ), wc();
    const l = G2(t, { ...e, anchor: a });
    if (Yt === null || Yt.nodeType !== Yu || /** @type {Comment} */
    Yt.data !== tg)
      throw Id(), _s;
    return Ti(!1), /**  @type {Exports} */
    l;
  } catch (l) {
    if (l === _s)
      return e.recover === !1 && BC(), $0(), y2(r), Ti(!1), V2(t, e);
    throw l;
  } finally {
    Ti(n), qo(i);
  }
}
const ds = /* @__PURE__ */ new Map();
function G2(t, { target: e, anchor: r, props: n = {}, events: i, context: a, intro: l = !0 }) {
  $0();
  var u = /* @__PURE__ */ new Set(), c = (p) => {
    for (var g = 0; g < p.length; g++) {
      var m = p[g];
      if (!u.has(m)) {
        u.add(m);
        var y = SR(m);
        e.addEventListener(m, Fu, { passive: y });
        var w = ds.get(m);
        w === void 0 ? (document.addEventListener(m, Fu, { passive: y }), ds.set(m, 1)) : ds.set(m, w + 1);
      }
    }
  };
  c(Kv(W2)), O0.add(c);
  var f = void 0, d = gR(() => {
    var p = r ?? e.appendChild(ka());
    return kl(() => {
      if (a) {
        zl({});
        var g = (
          /** @type {ComponentContext} */
          eo
        );
        g.c = a;
      }
      i && (n.$$events = i), Jt && xa(
        /** @type {TemplateNode} */
        p,
        null
      ), f = t(p, n) || {}, Jt && (Nt.nodes_end = Yt), a && Ol();
    }), () => {
      for (var g of u) {
        e.removeEventListener(g, Fu);
        var m = (
          /** @type {number} */
          ds.get(g)
        );
        --m === 0 ? (document.removeEventListener(g, Fu), ds.delete(g)) : ds.set(g, m);
      }
      O0.delete(c), p !== r && p.parentNode?.removeChild(p);
    };
  });
  return B0.set(f, d), f;
}
let B0 = /* @__PURE__ */ new WeakMap();
function CR(t, e) {
  const r = B0.get(t);
  return r ? (B0.delete(t), r(e)) : Promise.resolve();
}
function RR(t) {
  return new AR(t);
}
class AR {
  /** @type {any} */
  #e;
  /** @type {Record<string, any>} */
  #t;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(e) {
    var r = /* @__PURE__ */ new Map(), n = (a, l) => {
      var u = /* @__PURE__ */ R2(l, !1, !1);
      return r.set(a, u), u;
    };
    const i = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(a, l) {
          return O(r.get(l) ?? n(l, Reflect.get(a, l)));
        },
        has(a, l) {
          return l === n2 ? !0 : (O(r.get(l) ?? n(l, Reflect.get(a, l))), Reflect.has(a, l));
        },
        set(a, l, u) {
          return ot(r.get(l) ?? n(l, u), u), Reflect.set(a, l, u);
        }
      }
    );
    this.#t = (e.hydrate ? MR : V2)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: i,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && sR(), this.#e = i.$$events;
    for (const a of Object.keys(this.#t))
      a === "$set" || a === "$destroy" || a === "$on" || od(this, a, {
        get() {
          return this.#t[a];
        },
        /** @param {any} value */
        set(l) {
          this.#t[a] = l;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (a) => {
      Object.assign(i, a);
    }, this.#t.$destroy = () => {
      CR(this.#t);
    };
  }
  /** @param {Record<string, any>} props */
  $set(e) {
    this.#t.$set(e);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(e, r) {
    this.#e[e] = this.#e[e] || [];
    const n = (...i) => r.call(this, ...i);
    return this.#e[e].push(n), () => {
      this.#e[e] = this.#e[e].filter(
        /** @param {any} fn */
        (i) => i !== n
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
const ER = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(ER);
function ug(t) {
  eo === null && c2(), Ai(() => {
    const e = Vs(t);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function TR(t) {
  eo === null && c2(), ug(() => () => Vs(t));
}
function Rn(t, e, r = !1) {
  Jt && wc();
  var n = t, i = null, a = null, l = Wr, u = r ? Wv : 0, c = !1;
  const f = (g, m = !0) => {
    c = !0, p(m, g);
  };
  function d() {
    var g = l ? i : a, m = l ? a : i;
    g && lg(g), m && Hd(m, () => {
      l ? a = null : i = null;
    });
  }
  const p = (g, m) => {
    if (l === (l = g)) return;
    let y = !1;
    if (Jt) {
      const x = p2(n) === eg;
      !!l === x && (n = T0(), qo(n), Ti(!1), y = !0);
    }
    var w = n;
    l ? i ??= m && kl(() => m(w)) : a ??= m && kl(() => m(w)), d(), y && Ti(!0);
  };
  ig(() => {
    c = !1, e(f), c || p(null, null);
  }, u), Jt && (n = Yt);
}
function $R(t, e, r) {
  Jt && wc();
  var n = t, i = Wr, a, l, u = null, c = EC;
  function f() {
    a && Hd(a), u !== null && (u.lastChild.remove(), n.before(u), u = null), a = l;
  }
  ig(() => {
    if (c(i, i = e())) {
      var d = n, p = QC();
      p && (u = document.createDocumentFragment(), u.append(d = ka())), l = kl(() => r(d)), p ? zr.add_callback(f) : f();
    }
  }), Jt && (n = Yt);
}
function Ep(t, e) {
  return e;
}
function FR(t, e, r) {
  for (var n = t.items, i = [], a = e.length, l = 0; l < a; l++)
    ag(e[l].e, i, !0);
  var u = a > 0 && i.length === 0 && r !== null;
  if (u) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      r.parentNode
    );
    y2(c), c.append(
      /** @type {Element} */
      r
    ), n.clear(), ei(t, e[0].prev, e[a - 1].next);
  }
  j2(i, () => {
    for (var f = 0; f < a; f++) {
      var d = e[f];
      u || (n.delete(d.k), ei(t, d.prev, d.next)), qi(d.e, !u);
    }
  });
}
function Tp(t, e, r, n, i, a = null) {
  var l = t, u = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & f2) !== 0;
  if (c) {
    var f = (
      /** @type {Element} */
      t
    );
    l = Jt ? qo(
      /** @type {Comment | Text} */
      /* @__PURE__ */ Li(f)
    ) : f.appendChild(ka());
  }
  Jt && wc();
  var d = null, p = !1, g = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ w2(() => {
    var k = r();
    return Yv(k) ? k : k == null ? [] : Kv(k);
  }), y, w;
  function x() {
    NR(
      w,
      y,
      u,
      g,
      l,
      i,
      e,
      n,
      r
    ), a !== null && (y.length === 0 ? d ? lg(d) : d = kl(() => a(l)) : d !== null && Hd(d, () => {
      d = null;
    }));
  }
  ig(() => {
    w ??= /** @type {Effect} */
    Nt, y = O(m);
    var k = y.length;
    if (p && k === 0)
      return;
    p = k === 0;
    let S = !1;
    if (Jt) {
      var _ = p2(l) === eg;
      _ !== (k === 0) && (l = T0(), qo(l), Ti(!1), S = !0);
    }
    if (Jt) {
      for (var E = null, C, R = 0; R < k; R++) {
        if (Yt.nodeType === Yu && /** @type {Comment} */
        Yt.data === tg) {
          l = /** @type {Comment} */
          Yt, S = !0, Ti(!1);
          break;
        }
        var A = y[R], N = n(A, R);
        C = X2(
          Yt,
          u,
          E,
          null,
          A,
          N,
          R,
          i,
          e,
          r
        ), u.items.set(N, C), E = C;
      }
      k > 0 && qo(T0());
    }
    Jt ? k === 0 && a && (d = kl(() => a(l))) : x(), S && Ti(!0), O(m);
  }), Jt && (l = Yt);
}
function NR(t, e, r, n, i, a, l, u, c) {
  var f = (l & jC) !== 0, d = (l & (Qv | Jv)) !== 0, p = e.length, g = r.items, m = r.first, y = m, w, x = null, k, S = [], _ = [], E, C, R, A;
  if (f)
    for (A = 0; A < p; A += 1)
      E = e[A], C = u(E, A), R = g.get(C), R !== void 0 && (R.a?.measure(), (k ??= /* @__PURE__ */ new Set()).add(R));
  for (A = 0; A < p; A += 1) {
    if (E = e[A], C = u(E, A), R = g.get(C), R === void 0) {
      var N = n.get(C);
      if (N !== void 0) {
        n.delete(C), g.set(C, N);
        var L = x ? x.next : y;
        ei(r, x, N), ei(r, N, L), $p(N, L, i), x = N;
      } else {
        var j = y ? (
          /** @type {TemplateNode} */
          y.e.nodes_start
        ) : i;
        x = X2(
          j,
          r,
          x,
          x === null ? r.first : x.next,
          E,
          C,
          A,
          a,
          l,
          c
        );
      }
      g.set(C, x), S = [], _ = [], y = x.next;
      continue;
    }
    if (d && zR(R, E, A, l), (R.e.f & Lo) !== 0 && (lg(R.e), f && (R.a?.unfix(), (k ??= /* @__PURE__ */ new Set()).delete(R))), R !== y) {
      if (w !== void 0 && w.has(R)) {
        if (S.length < _.length) {
          var B = _[0], P;
          x = B.prev;
          var q = S[0], H = S[S.length - 1];
          for (P = 0; P < S.length; P += 1)
            $p(S[P], B, i);
          for (P = 0; P < _.length; P += 1)
            w.delete(_[P]);
          ei(r, q.prev, H.next), ei(r, x, q), ei(r, H, B), y = B, x = H, A -= 1, S = [], _ = [];
        } else
          w.delete(R), $p(R, y, i), ei(r, R.prev, R.next), ei(r, R, x === null ? r.first : x.next), ei(r, x, R), x = R;
        continue;
      }
      for (S = [], _ = []; y !== null && y.k !== C; )
        (y.e.f & Lo) === 0 && (w ??= /* @__PURE__ */ new Set()).add(y), _.push(y), y = y.next;
      if (y === null)
        continue;
      R = y;
    }
    S.push(R), x = R, y = R.next;
  }
  if (y !== null || w !== void 0) {
    for (var X = w === void 0 ? [] : Kv(w); y !== null; )
      (y.e.f & Lo) === 0 && X.push(y), y = y.next;
    var V = X.length;
    if (V > 0) {
      var G = (l & f2) !== 0 && p === 0 ? i : null;
      if (f) {
        for (A = 0; A < V; A += 1)
          X[A].a?.measure();
        for (A = 0; A < V; A += 1)
          X[A].a?.fix();
      }
      FR(r, X, G);
    }
  }
  f && ng(() => {
    if (k !== void 0)
      for (R of k)
        R.a?.apply();
  }), t.first = r.first && r.first.e, t.last = x && x.e;
  for (var Z of n.values())
    qi(Z.e);
  n.clear();
}
function zR(t, e, r, n) {
  (n & Qv) !== 0 && Qu(t.v, e), (n & Jv) !== 0 ? Qu(
    /** @type {Value<number>} */
    t.i,
    r
  ) : t.i = r;
}
function X2(t, e, r, n, i, a, l, u, c, f, d) {
  var p = (c & Qv) !== 0, g = (c & UC) === 0, m = p ? g ? /* @__PURE__ */ R2(i, !1, !1) : Zu(i) : i, y = (c & Jv) === 0 ? l : Zu(l), w = {
    i: y,
    v: m,
    k: a,
    a: null,
    // @ts-expect-error
    e: null,
    prev: r,
    next: n
  };
  try {
    if (t === null) {
      var x = document.createDocumentFragment();
      x.append(t = ka());
    }
    return w.e = kl(() => u(
      /** @type {Node} */
      t,
      m,
      y,
      f
    ), Jt), w.e.prev = r && r.e, w.e.next = n && n.e, r === null ? d || (e.first = w) : (r.next = w, r.e.next = w.e), n !== null && (n.prev = w, n.e.prev = w.e), w;
  } finally {
  }
}
function $p(t, e, r) {
  for (var n = t.next ? (
    /** @type {TemplateNode} */
    t.next.e.nodes_start
  ) : r, i = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : r, a = (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ); a !== null && a !== n; ) {
    var l = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Wi(a)
    );
    i.before(a), a = l;
  }
}
function ei(t, e, r) {
  e === null ? t.first = r : (e.next = r, e.e.next = r && r.e), r !== null && (r.prev = e, r.e.prev = e && e.e);
}
function OR(t, e, r) {
  D2(() => {
    var n = Vs(() => e(t, r?.()) || {});
    if (r && n?.update) {
      var i = !1, a = (
        /** @type {any} */
        {}
      );
      P2(() => {
        var l = r();
        hR(l), i && s2(a, l) && (a = l, n.update(l));
      }), i = !0;
    }
    if (n?.destroy)
      return () => (
        /** @type {Function} */
        n.destroy()
      );
  });
}
function J1(t, e = !1) {
  var r = e ? " !important;" : ";", n = "";
  for (var i in t) {
    var a = t[i];
    a != null && a !== "" && (n += " " + i + ": " + a + r);
  }
  return n;
}
function BR(t, e) {
  if (e) {
    var r = "", n, i;
    return Array.isArray(e) ? (n = e[0], i = e[1]) : n = e, n && (r += J1(n)), i && (r += J1(i, !0)), r = r.trim(), r === "" ? null : r;
  }
  return String(t);
}
function Fp(t, e = {}, r, n) {
  for (var i in r) {
    var a = r[i];
    e[i] !== a && (r[i] == null ? t.style.removeProperty(i) : t.style.setProperty(i, a, n));
  }
}
function Dt(t, e, r, n) {
  var i = t.__style;
  if (Jt || i !== e) {
    var a = BR(e, n);
    (!Jt || a !== t.getAttribute("style")) && (a == null ? t.removeAttribute("style") : t.style.cssText = a), t.__style = e;
  } else n && (Array.isArray(n) ? (Fp(t, r?.[0], n[0]), Fp(t, r?.[1], n[1], "important")) : Fp(t, r, n));
  return n;
}
const DR = Symbol("is custom element"), PR = Symbol("is html");
function Pe(t, e, r, n) {
  var i = LR(t);
  Jt && (i[e] = t.getAttribute(e), e === "src" || e === "srcset" || e === "href" && t.nodeName === "LINK") || i[e] !== (i[e] = r) && (e === "loading" && (t[_C] = r), r == null ? t.removeAttribute(e) : typeof r != "string" && qR(t).includes(e) ? t[e] = r : t.setAttribute(e, r));
}
function LR(t) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    t.__attributes ??= {
      [DR]: t.nodeName.includes("-"),
      [PR]: t.namespaceURI === KC
    }
  );
}
var eb = /* @__PURE__ */ new Map();
function qR(t) {
  var e = eb.get(t.nodeName);
  if (e) return e;
  eb.set(t.nodeName, e = []);
  for (var r, n = t, i = Element.prototype; i !== n; ) {
    r = i2(n);
    for (var a in r)
      r[a].set && e.push(a);
    n = Zv(n);
  }
  return e;
}
function tb(t, e) {
  return t === e || t?.[ll] === e;
}
function D0(t = {}, e, r, n) {
  return D2(() => {
    var i, a;
    return P2(() => {
      i = a, a = [], Vs(() => {
        t !== r(...a) && (e(t, ...a), i && tb(r(...i), t) && e(null, ...i));
      });
    }), () => {
      ng(() => {
        a && tb(r(...a), t) && e(null, ...a);
      });
    };
  }), t;
}
let wf = !1;
function IR(t) {
  var e = wf;
  try {
    return wf = !1, [t(), wf];
  } finally {
    wf = e;
  }
}
function Ge(t, e, r, n) {
  var i = (r & VC) !== 0, a = (r & GC) !== 0, l = (
    /** @type {V} */
    n
  ), u = !0, c = () => (u && (u = !1, l = a ? Vs(
    /** @type {() => V} */
    n
  ) : (
    /** @type {V} */
    n
  )), l), f;
  if (i) {
    var d = ll in t || n2 in t;
    f = ks(t, e)?.set ?? (d && e in t ? (S) => t[e] = S : void 0);
  }
  var p, g = !1;
  i ? [p, g] = IR(() => (
    /** @type {V} */
    t[e]
  )) : p = /** @type {V} */
  t[e], p === void 0 && n !== void 0 && (p = c(), f && (DC(), f(p)));
  var m;
  if (m = () => {
    var S = (
      /** @type {V} */
      t[e]
    );
    return S === void 0 ? c() : (u = !0, S);
  }, (r & HC) === 0)
    return m;
  if (f) {
    var y = t.$$legacy;
    return function(S, _) {
      return arguments.length > 0 ? ((!_ || y || g) && f(_ ? m() : S), S) : m();
    };
  }
  var w = !1, x = ((r & WC) !== 0 ? jd : w2)(() => (w = !1, m()));
  i && O(x);
  var k = (
    /** @type {Effect} */
    Nt
  );
  return function(S, _) {
    if (arguments.length > 0) {
      const E = _ ? O(x) : i ? Ja(S) : S;
      return ot(x, E), w = !0, l !== void 0 && (l = E), S;
    }
    return Bl && w || (k.f & Nl) !== 0 ? x.v : O(x);
  };
}
var jR = /* @__PURE__ */ Hi('<g><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect></g>');
function UR(t, e) {
  zl(e, !0);
  let r = /* @__PURE__ */ He(() => e.pointLocation(e.value.xMin, e.value.yMin)), n = /* @__PURE__ */ He(() => e.pointLocation(e.value.xMax, e.value.yMax));
  const i = 8;
  function a(L) {
    return (j) => {
      j.stopPropagation(), j.preventDefault(), e.preventHover(!0);
      let B = [O(r).x, O(r).y, O(n).x, O(n).y], P = (H) => {
        H.preventDefault();
        let X = H.pageX - j.pageX, V = H.pageY - j.pageY, G = [X, V, X, V].map((I, K) => B[K] + I * L[K]), Z = e.coordinateAtPoint(G[0], G[1]), Y = e.coordinateAtPoint(G[2], G[3]);
        e.onChange({
          xMin: Math.min(Z.x, Y.x),
          xMax: Math.max(Z.x, Y.x),
          yMin: Math.min(Z.y, Y.y),
          yMax: Math.max(Z.y, Y.y)
        });
      }, q = () => {
        e.preventHover(!1), window.removeEventListener("mousemove", P), window.removeEventListener("mouseup", q);
      };
      window.addEventListener("mousemove", P), window.addEventListener("mouseup", q);
    };
  }
  var l = jR(), u = Vr(l), c = /* @__PURE__ */ He(() => a([1, 1, 1, 1]));
  u.__mousedown = function(...L) {
    O(c)?.apply(this, L);
  }, Dt(u, "", {}, {
    stroke: "#fff",
    fill: "rgba(128,128,128,0.25)",
    cursor: "move"
  });
  var f = mr(u);
  Pe(f, "width", i);
  var d = /* @__PURE__ */ He(() => a([1, 0, 0, 0]));
  f.__mousedown = function(...L) {
    O(d)?.apply(this, L);
  }, Dt(f, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var p = mr(f);
  Pe(p, "width", i);
  var g = /* @__PURE__ */ He(() => a([0, 0, 1, 0]));
  p.__mousedown = function(...L) {
    O(g)?.apply(this, L);
  }, Dt(p, "", {}, {
    cursor: "ew-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var m = mr(p);
  Pe(m, "height", i);
  var y = /* @__PURE__ */ He(() => a([0, 1, 0, 0]));
  m.__mousedown = function(...L) {
    O(y)?.apply(this, L);
  }, Dt(m, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var w = mr(m);
  Pe(w, "height", i);
  var x = /* @__PURE__ */ He(() => a([0, 0, 0, 1]));
  w.__mousedown = function(...L) {
    O(x)?.apply(this, L);
  }, Dt(w, "", {}, {
    cursor: "ns-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var k = mr(w);
  Pe(k, "width", i), Pe(k, "height", i);
  var S = /* @__PURE__ */ He(() => a([1, 1, 0, 0]));
  k.__mousedown = function(...L) {
    O(S)?.apply(this, L);
  }, Dt(k, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var _ = mr(k);
  Pe(_, "width", i), Pe(_, "height", i);
  var E = /* @__PURE__ */ He(() => a([1, 0, 0, 1]));
  _.__mousedown = function(...L) {
    O(E)?.apply(this, L);
  }, Dt(_, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var C = mr(_);
  Pe(C, "width", i), Pe(C, "height", i);
  var R = /* @__PURE__ */ He(() => a([0, 1, 1, 0]));
  C.__mousedown = function(...L) {
    O(R)?.apply(this, L);
  }, Dt(C, "", {}, {
    cursor: "nwse-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  });
  var A = mr(C);
  Pe(A, "width", i), Pe(A, "height", i);
  var N = /* @__PURE__ */ He(() => a([0, 0, 1, 1]));
  A.__mousedown = function(...L) {
    O(N)?.apply(this, L);
  }, Dt(A, "", {}, {
    cursor: "nesw-resize",
    stroke: "none",
    fill: "none",
    "pointer-events": "all"
  }), Br(l), Kn(
    (L, j, B, P, q, H, X, V, G, Z, Y, I) => {
      Pe(u, "x", L), Pe(u, "width", j), Pe(u, "y", B), Pe(u, "height", P), Pe(f, "x", O(r).x - i / 2), Pe(f, "y", q), Pe(f, "height", H), Pe(p, "x", O(n).x - i / 2), Pe(p, "y", X), Pe(p, "height", V), Pe(m, "x", G), Pe(m, "width", Z), Pe(m, "y", O(r).y - i / 2), Pe(w, "x", Y), Pe(w, "width", I), Pe(w, "y", O(n).y - i / 2), Pe(k, "x", O(r).x - i / 2), Pe(k, "y", O(r).y - i / 2), Pe(_, "x", O(r).x - i / 2), Pe(_, "y", O(n).y - i / 2), Pe(C, "x", O(n).x - i / 2), Pe(C, "y", O(r).y - i / 2), Pe(A, "x", O(n).x - i / 2), Pe(A, "y", O(n).y - i / 2);
    },
    [
      () => Math.min(O(r).x, O(n).x),
      () => Math.abs(O(r).x - O(n).x),
      () => Math.min(O(r).y, O(n).y),
      () => Math.abs(O(r).y - O(n).y),
      () => Math.min(O(r).y, O(n).y),
      () => Math.abs(O(r).y - O(n).y),
      () => Math.min(O(r).y, O(n).y),
      () => Math.abs(O(r).y - O(n).y),
      () => Math.min(O(r).x, O(n).x),
      () => Math.abs(O(r).x - O(n).x),
      () => Math.min(O(r).x, O(n).x),
      () => Math.abs(O(r).x - O(n).x)
    ]
  ), kr(t, l), Ol();
}
sg(["mousedown"]);
function WR(t, e) {
  let r = !1, n, i, a, l = 300, u = 300, c = async (d) => {
    r = !0;
    try {
      await t(d);
    } catch (p) {
      console.error(p);
    }
    if (r = !1, n !== void 0) {
      let p = n;
      n = void 0, f(p);
    }
  }, f = async (d) => {
    if (r) {
      n = d;
      return;
    }
    let p = (/* @__PURE__ */ new Date()).getTime();
    e() && (i = p);
    let g = !0;
    (i == null || p - i < u) && (g = !1), g ? (a && clearTimeout(a), a = setTimeout(() => c(d), l)) : c(d);
  };
  return f;
}
function Np(t) {
  return { shift: t.shiftKey, ctrl: t.ctrlKey, alt: t.altKey, meta: t.metaKey };
}
function HR(t, e) {
  let { zoom: r, click: n, drag: i, hover: a } = e, l = !1, u = !1, c = null, f = n == null ? 0 : 5;
  return {
    wheel: (d) => {
      if (r == null)
        return;
      d.preventDefault();
      let p = t.getBoundingClientRect(), g = d.clientX - p.left, m = d.clientY - p.top, y = Math.exp(-d.deltaY / 200);
      r(y, { x: g, y: m }, Np(d));
    },
    mousedown: (d) => {
      d.preventDefault();
      let p = t.getBoundingClientRect(), g = d.clientX - p.left, m = d.clientY - p.top, y = !1, w = null;
      l = !0;
      let x = (S) => {
        S.preventDefault();
        let _ = t.getBoundingClientRect(), E = S.clientX - _.left, C = S.clientY - _.top;
        y == !1 && i != null && (E - g) * (E - g) + (C - m) * (C - m) > f * f && (y = !0, w = i({ x: g, y: m }, Np(d))), y && w?.move != null && w.move({ x: E, y: C });
      }, k = () => {
        window.removeEventListener("mousemove", x), window.removeEventListener("mouseup", k), l = !1, y && w?.release != null && w.release(), y || n && n({ x: g, y: m }, Np(d));
      };
      window.addEventListener("mousemove", x), window.addEventListener("mouseup", k);
    },
    mousemove: (d) => {
      if (a == null || l || u)
        return;
      let p = t.getBoundingClientRect(), g = d.clientX - p.left, m = d.clientY - p.top;
      c = { x: g, y: m }, a({ x: g, y: m });
    },
    mouseleave: () => {
      c != null && a != null && (c = null, a(null));
    },
    preventHover: (d) => {
      d != u && (d && c != null && a != null && (c = null, a(null)), u = d);
    }
  };
}
function VR(t, e) {
  let r = t.x - e.x, n = t.y - e.y;
  return Math.sqrt(r * r + n * n);
}
function GR(t) {
  return "M " + t.map(({ x: e, y: r }) => `${e},${r}`).join(" L ") + " Z";
}
function Y2(t) {
  let e = 1 / 0, r = -1 / 0, n = 1 / 0, i = -1 / 0;
  for (let { x: a, y: l } of t)
    e = Math.min(e, a), n = Math.min(n, l), r = Math.max(r, a), i = Math.max(i, l);
  return { xMin: e, yMin: n, xMax: r, yMax: i };
}
async function XR(t) {
  let e = JSON.stringify(t), r = new TextEncoder().encode(e), n = await crypto.subtle.digest("SHA-1", r);
  return Array.from(new Uint8Array(n)).map((i) => i.toString(16).padStart(2, "0")).join("");
}
function pa(t, e) {
  if (t === e)
    return !0;
  if (t === null || e === null || typeof t != "object" || typeof e != "object" || Object.keys(t).length !== Object.keys(e).length)
    return !1;
  for (let r in t)
    if (e.hasOwnProperty(r)) {
      if (!pa(t[r], e[r]))
        return !1;
    } else
      return !1;
  return !0;
}
var YR = /* @__PURE__ */ Hi("<path></path>");
function KR(t, e) {
  zl(e, !0);
  let r = /* @__PURE__ */ He(() => e.value.map(({ x: i, y: a }) => e.pointLocation(i, a)));
  var n = YR();
  Dt(n, "", {}, { stroke: "#fff", fill: "rgba(128,128,128,0.25)" }), Kn((i) => Pe(n, "d", i), [() => GR(O(r))]), kr(t, n), Ol();
}
const ZR = {
  marquee: "M7 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m1-.25c0 .414.336.75.75.75h6.5a.75.75 0 0 0 0-1.5h-6.5a.75.75 0 0 0-.75.75M4.75 8a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5A.75.75 0 0 0 4.75 8m14.5 0a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 1.5 0v-6.5a.75.75 0 0 0-.75-.75M8.75 20a.75.75 0 0 1 0-1.5h6.5a.75.75 0 0 1 0 1.5zM5 21a2 2 0 1 0 0-4a2 2 0 0 0 0 4M21 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0m-2 16a2 2 0 1 0 0-4a2 2 0 0 0 0 4",
  lasso: "M9.703 2.265A10 10 0 0 1 12 2c.79 0 1.559.092 2.297.265a.75.75 0 1 1-.343 1.46A8.5 8.5 0 0 0 12 3.5a8.6 8.6 0 0 0-1.954.225a.75.75 0 1 1-.343-1.46m-1.93 1.47a.75.75 0 0 1-.242 1.033a8.55 8.55 0 0 0-2.763 2.763a.75.75 0 1 1-1.275-.79a10.05 10.05 0 0 1 3.248-3.248a.75.75 0 0 1 1.032.243m8.454 0a.75.75 0 0 1 1.032-.242a10.05 10.05 0 0 1 3.248 3.248a.75.75 0 1 1-1.275.79a8.55 8.55 0 0 0-2.763-2.763a.75.75 0 0 1-.242-1.032m-13.06 5.41a.75.75 0 0 1 .558.901A8.5 8.5 0 0 0 3.5 12c0 .673.078 1.327.225 1.954a.75.75 0 1 1-1.46.343A10 10 0 0 1 2 12c0-.79.092-1.559.265-2.297a.75.75 0 0 1 .902-.559m17.666 0a.75.75 0 0 1 .902.558a10.1 10.1 0 0 1 0 4.595a.75.75 0 1 1-1.46-.343a8.54 8.54 0 0 0-.001-3.908a.75.75 0 0 1 .559-.902M3.736 16.226a.75.75 0 0 1 1.032.242a8.55 8.55 0 0 0 2.763 2.763a.75.75 0 0 1-.79 1.275a10.05 10.05 0 0 1-3.248-3.248a.75.75 0 0 1 .243-1.032m16.685.858a.75.75 0 1 0-1.342-.67l-.002.004l-.015.029l-.069.123a8 8 0 0 1-.289.466a9.6 9.6 0 0 1-.965 1.219c-1.17-1.073-2.756-2.006-4.74-2.006c-2.347 0-3.99 1.203-3.99 2.875S10.653 22 13 22c1.942 0 3.495-.75 4.658-1.645a11.7 11.7 0 0 1 1.315 2.01q.05.099.073.149l.017.035l.004.009a.75.75 0 0 0 1.368-.615c-.087-.183 0-.001 0-.001v-.002l-.003-.004l-.007-.015l-.024-.052l-.091-.184a13.2 13.2 0 0 0-1.538-2.337a11 11 0 0 0 1.525-2.032l.09-.162l.024-.047l.007-.014l.002-.005zM13 17.75c1.433 0 2.644.652 3.616 1.512c-.95.7-2.155 1.238-3.616 1.238c-1.973 0-2.49-.922-2.49-1.375s.517-1.375 2.49-1.375"
};
var QR = /* @__PURE__ */ Hi('<svg width="24" height="24" viewBox="0 0 24 24"><path></path></svg>'), JR = /* @__PURE__ */ Fa("<button><!></button>");
function rb(t, e) {
  let r = Ge(e, "active", 3, !1);
  var n = JR();
  n.__click = function(...u) {
    e.onClick?.apply(this, u);
  };
  let i;
  var a = Vr(n);
  {
    var l = (u) => {
      var c = QR();
      Dt(c, "", {}, { width: "14px", height: "14px" });
      var f = Vr(c);
      Dt(f, "", {}, { fill: "currentColor" }), Br(c), Kn(() => Pe(f, "d", ZR[e.icon])), kr(u, c);
    };
    Rn(a, (u) => {
      e.icon != null && u(l);
    });
  }
  Br(n), Kn(
    (u) => {
      Pe(n, "title", e.title), i = Dt(n, "", i, u);
    },
    [
      () => ({
        border: "none",
        appearance: "none",
        background: r() ? "color-mix(in srgb, currentColor 20%, transparent)" : "none",
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
  ), kr(t, n);
}
sg(["click"]);
var eA = /* @__PURE__ */ Fa('<div><div> </div> <svg height="6px"><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line><line shape-rendering="crispEdges"></line></svg></div>');
function tA(t, e) {
  function r(g, m) {
    let y = Math.log10(m * g), w = Math.round(y), x = [0.1, 0.2, 0.5, 1, 2, 5, 10], k = 0, S = 1e10;
    for (let _ of x) {
      let E = Math.abs(Math.log10(_) + w - y);
      E < S && (k = _, S = E);
    }
    return k * Math.pow(10, w);
  }
  let n = /* @__PURE__ */ He(() => r(e.distancePerPoint, 30)), i = /* @__PURE__ */ He(() => O(n) / e.distancePerPoint);
  var a = eA();
  Dt(a, "", {}, { display: "flex", "align-items": "center" });
  var l = Vr(a);
  Dt(l, "", {}, { "padding-right": "4px" });
  var u = Vr(l, !0);
  Br(l);
  var c = mr(l, 2), f = Vr(c);
  Pe(f, "x1", 1), Pe(f, "y1", 3), Pe(f, "y2", 3), Dt(f, "", {}, {
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-cap": "butt"
  });
  var d = mr(f);
  Pe(d, "x1", 1), Pe(d, "x2", 1), Pe(d, "y1", 0), Pe(d, "y2", 6), Dt(d, "", {}, { stroke: "currentColor" });
  var p = mr(d);
  Pe(p, "y1", 0), Pe(p, "y2", 6), Dt(p, "", {}, { stroke: "currentColor" }), Br(c), Br(a), Kn(
    (g) => {
      Pu(u, g), Pe(c, "width", `${O(i) + 2}px`), Pe(f, "x2", O(i) + 1), Pe(p, "x1", O(i) + 1), Pe(p, "x2", O(i) + 1);
    },
    [() => O(n).toLocaleString()]
  ), kr(t, a);
}
var rA = /* @__PURE__ */ Fa("<div> </div>"), nA = /* @__PURE__ */ Fa('<a target="_blank"> </a> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div>', 1), oA = /* @__PURE__ */ Fa('<div><div><!></div> <div></div> <div><!> <!> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <!> <div style="border-right: 1px solid currentColor; margin: 4px 2px; opacity: 0.3; width: 0; height: 10px"></div> <span> </span></div></div>');
function iA(t, e) {
  zl(e, !0);
  let r = Ge(e, "statusMessage", 3, null);
  var n = oA();
  let i;
  var a = Vr(n);
  let l;
  var u = Vr(a);
  {
    var c = (_) => {
      var E = rA();
      Dt(E, "", {}, { display: "inline-block" });
      var C = Vr(E, !0);
      Br(E), Kn(() => Pu(C, r())), kr(_, E);
    };
    Rn(u, (_) => {
      r() != null && _(c);
    });
  }
  Br(a);
  var f = mr(a, 2);
  Dt(f, "", {}, { flex: "1 1 0%" });
  var d = mr(f, 2);
  let p;
  var g = Vr(d);
  {
    var m = (_) => {
      var E = nA(), C = gs(E);
      Dt(C, "", {}, { color: "currentColor", "text-decoration": "underline" });
      var R = Vr(C, !0);
      Br(C), ZC(2), Kn(() => {
        Pe(C, "href", e.resolvedTheme.brandingLink.href), Pu(R, e.resolvedTheme.brandingLink.text);
      }), kr(_, E);
    };
    Rn(g, (_) => {
      e.resolvedTheme.brandingLink != null && _(m);
    });
  }
  var y = mr(g, 2);
  {
    let _ = /* @__PURE__ */ He(() => e.selectionMode == "marquee");
    rb(y, {
      icon: "marquee",
      get active() {
        return O(_);
      },
      title: "Toggle rectangle selection mode. In normal mode, use shift + drag for rectangle selection.",
      onClick: () => e.onSelectionMode(e.selectionMode == "marquee" ? "none" : "marquee")
    });
  }
  var w = mr(y, 2);
  {
    let _ = /* @__PURE__ */ He(() => e.selectionMode == "lasso");
    rb(w, {
      icon: "lasso",
      get active() {
        return O(_);
      },
      title: "Toggle lasso selection mode. In normal mode, use shift + meta + drag for lasso selection.",
      onClick: () => e.onSelectionMode(e.selectionMode == "lasso" ? "none" : "lasso")
    });
  }
  var x = mr(w, 4);
  tA(x, {
    get distancePerPoint() {
      return e.distancePerPoint;
    }
  });
  var k = mr(x, 4), S = Vr(k);
  Br(k), Br(d), Br(n), Kn(
    (_, E, C, R) => {
      i = Dt(n, "", i, _), l = Dt(a, "", l, E), p = Dt(d, "", p, C), Pu(S, `${R ?? ""} points`);
    },
    [
      () => ({
        "font-size": "12px",
        "line-height": "20px",
        height: "20px",
        color: e.resolvedTheme.statusBarTextColor,
        position: "absolute",
        bottom: "0px",
        left: "0px",
        right: "0px",
        "user-select": "none",
        "font-family": e.resolvedTheme.fontFamily,
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
        background: e.resolvedTheme.statusBarBackgroundColor
      }),
      () => ({
        flex: "none",
        display: "flex",
        "flex-direction": "row",
        "align-items": "center",
        gap: "4px",
        padding: "0px 4px",
        "border-radius": "2px",
        background: e.resolvedTheme.statusBarBackgroundColor
      }),
      () => e.pointCount.toLocaleString()
    ]
  ), kr(t, n), Ol();
}
function aA(t) {
  return (e, r) => {
    let n = new t(e, r);
    return {
      ...n.update ? { update: n.update.bind(n) } : {},
      ...n.destroy ? { destroy: n.destroy.bind(n) } : {}
    };
  };
}
let zp = /* @__PURE__ */ new WeakMap();
function K2(t) {
  let e = typeof t == "function" ? t : t.class;
  if (zp.has(e))
    return zp.get(e);
  {
    let r = aA(e);
    return zp.set(e, r), r;
  }
}
function Z2(t, e) {
  return typeof t == "function" ? e : { ...t.props ?? {}, ...e };
}
var lA = /* @__PURE__ */ Fa("<div><div></div></div>");
function sA(t, e) {
  zl(e, !0);
  let r = Ge(e, "margin", 3, 4), n, i, a = /* @__PURE__ */ He(() => K2(e.customTooltip)), l = /* @__PURE__ */ He(() => Z2(e.customTooltip, { tooltip: e.tooltip }));
  ug(() => {
    sd(() => {
      let f = O(a), d = null;
      return sd(() => {
        i.style.left = "0px", i.style.top = "0px", i.style.pointerEvents = e.allowInteraction ? "all" : "none", d == null ? d = f(i, O(l)) : d.update?.(O(l));
        function p(x, k, S, _) {
          let E = e.location.x, C = e.location.y, R = 2, A = x / 2, N = k + (e.targetHeight + r());
          E - A < S && (A = E - S), E - A > _ - x && (A = E - _ + x), C - N < R && (N = -(e.targetHeight + r())), i.style.left = E - A + "px", i.style.top = C - N + "px";
        }
        let g = n.getBoundingClientRect(), { width: m, height: y } = i.getBoundingClientRect();
        p(m, y, 2, g.width - 2);
        let w = requestAnimationFrame(() => {
          w = null;
          let x = i.getBoundingClientRect();
          (x.width != m || x.height != y) && p(x.width, x.height, 2, g.width - 2);
        });
        return () => {
          w != null && cancelAnimationFrame(w);
        };
      }), () => {
        d?.destroy?.(), i.replaceChildren();
      };
    });
  });
  var u = lA();
  Dt(u, "", {}, { position: "absolute", width: "100%" });
  var c = Vr(u);
  Dt(c, "", {}, {
    display: "flex",
    position: "absolute",
    width: "fit-content",
    height: "fit-content",
    "z-index": "100"
  }), D0(c, (f) => i = f, () => i), Br(u), D0(u, (f) => n = f, () => n), kr(t, u), Ol();
}
function cg(t, e, r) {
  t.prototype = e.prototype = r, r.constructor = t;
}
function Q2(t, e) {
  var r = Object.create(t.prototype);
  for (var n in e) r[n] = e[n];
  return r;
}
function kc() {
}
var ec = 0.7, ud = 1 / ec, Ms = "\\s*([+-]?\\d+)\\s*", tc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", ai = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", uA = /^#([0-9a-f]{3,8})$/, cA = new RegExp(`^rgb\\(${Ms},${Ms},${Ms}\\)$`), fA = new RegExp(`^rgb\\(${ai},${ai},${ai}\\)$`), dA = new RegExp(`^rgba\\(${Ms},${Ms},${Ms},${tc}\\)$`), hA = new RegExp(`^rgba\\(${ai},${ai},${ai},${tc}\\)$`), pA = new RegExp(`^hsl\\(${tc},${ai},${ai}\\)$`), vA = new RegExp(`^hsla\\(${tc},${ai},${ai},${tc}\\)$`), nb = {
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
cg(kc, fg, {
  copy(t) {
    return Object.assign(new this.constructor(), this, t);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: ob,
  // Deprecated! Use color.formatHex.
  formatHex: ob,
  formatHex8: gA,
  formatHsl: mA,
  formatRgb: ib,
  toString: ib
});
function ob() {
  return this.rgb().formatHex();
}
function gA() {
  return this.rgb().formatHex8();
}
function mA() {
  return ek(this).formatHsl();
}
function ib() {
  return this.rgb().formatRgb();
}
function fg(t) {
  var e, r;
  return t = (t + "").trim().toLowerCase(), (e = uA.exec(t)) ? (r = e[1].length, e = parseInt(e[1], 16), r === 6 ? ab(e) : r === 3 ? new Nn(e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, (e & 15) << 4 | e & 15, 1) : r === 8 ? kf(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, (e & 255) / 255) : r === 4 ? kf(e >> 12 & 15 | e >> 8 & 240, e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, ((e & 15) << 4 | e & 15) / 255) : null) : (e = cA.exec(t)) ? new Nn(e[1], e[2], e[3], 1) : (e = fA.exec(t)) ? new Nn(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, 1) : (e = dA.exec(t)) ? kf(e[1], e[2], e[3], e[4]) : (e = hA.exec(t)) ? kf(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, e[4]) : (e = pA.exec(t)) ? ub(e[1], e[2] / 100, e[3] / 100, 1) : (e = vA.exec(t)) ? ub(e[1], e[2] / 100, e[3] / 100, e[4]) : nb.hasOwnProperty(t) ? ab(nb[t]) : t === "transparent" ? new Nn(NaN, NaN, NaN, 0) : null;
}
function ab(t) {
  return new Nn(t >> 16 & 255, t >> 8 & 255, t & 255, 1);
}
function kf(t, e, r, n) {
  return n <= 0 && (t = e = r = NaN), new Nn(t, e, r, n);
}
function yA(t) {
  return t instanceof kc || (t = fg(t)), t ? (t = t.rgb(), new Nn(t.r, t.g, t.b, t.opacity)) : new Nn();
}
function J2(t, e, r, n) {
  return arguments.length === 1 ? yA(t) : new Nn(t, e, r, n ?? 1);
}
function Nn(t, e, r, n) {
  this.r = +t, this.g = +e, this.b = +r, this.opacity = +n;
}
cg(Nn, J2, Q2(kc, {
  brighter(t) {
    return t = t == null ? ud : Math.pow(ud, t), new Nn(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? ec : Math.pow(ec, t), new Nn(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Nn(cl(this.r), cl(this.g), cl(this.b), cd(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: lb,
  // Deprecated! Use color.formatHex.
  formatHex: lb,
  formatHex8: bA,
  formatRgb: sb,
  toString: sb
}));
function lb() {
  return `#${el(this.r)}${el(this.g)}${el(this.b)}`;
}
function bA() {
  return `#${el(this.r)}${el(this.g)}${el(this.b)}${el((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function sb() {
  const t = cd(this.opacity);
  return `${t === 1 ? "rgb(" : "rgba("}${cl(this.r)}, ${cl(this.g)}, ${cl(this.b)}${t === 1 ? ")" : `, ${t})`}`;
}
function cd(t) {
  return isNaN(t) ? 1 : Math.max(0, Math.min(1, t));
}
function cl(t) {
  return Math.max(0, Math.min(255, Math.round(t) || 0));
}
function el(t) {
  return t = cl(t), (t < 16 ? "0" : "") + t.toString(16);
}
function ub(t, e, r, n) {
  return n <= 0 ? t = e = r = NaN : r <= 0 || r >= 1 ? t = e = NaN : e <= 0 && (t = NaN), new zo(t, e, r, n);
}
function ek(t) {
  if (t instanceof zo) return new zo(t.h, t.s, t.l, t.opacity);
  if (t instanceof kc || (t = fg(t)), !t) return new zo();
  if (t instanceof zo) return t;
  t = t.rgb();
  var e = t.r / 255, r = t.g / 255, n = t.b / 255, i = Math.min(e, r, n), a = Math.max(e, r, n), l = NaN, u = a - i, c = (a + i) / 2;
  return u ? (e === a ? l = (r - n) / u + (r < n) * 6 : r === a ? l = (n - e) / u + 2 : l = (e - r) / u + 4, u /= c < 0.5 ? a + i : 2 - a - i, l *= 60) : u = c > 0 && c < 1 ? 0 : l, new zo(l, u, c, t.opacity);
}
function xA(t, e, r, n) {
  return arguments.length === 1 ? ek(t) : new zo(t, e, r, n ?? 1);
}
function zo(t, e, r, n) {
  this.h = +t, this.s = +e, this.l = +r, this.opacity = +n;
}
cg(zo, xA, Q2(kc, {
  brighter(t) {
    return t = t == null ? ud : Math.pow(ud, t), new zo(this.h, this.s, this.l * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? ec : Math.pow(ec, t), new zo(this.h, this.s, this.l * t, this.opacity);
  },
  rgb() {
    var t = this.h % 360 + (this.h < 0) * 360, e = isNaN(t) || isNaN(this.s) ? 0 : this.s, r = this.l, n = r + (r < 0.5 ? r : 1 - r) * e, i = 2 * r - n;
    return new Nn(
      Op(t >= 240 ? t - 240 : t + 120, i, n),
      Op(t, i, n),
      Op(t < 120 ? t + 240 : t - 120, i, n),
      this.opacity
    );
  },
  clamp() {
    return new zo(cb(this.h), _f(this.s), _f(this.l), cd(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const t = cd(this.opacity);
    return `${t === 1 ? "hsl(" : "hsla("}${cb(this.h)}, ${_f(this.s) * 100}%, ${_f(this.l) * 100}%${t === 1 ? ")" : `, ${t})`}`;
  }
}));
function cb(t) {
  return t = (t || 0) % 360, t < 0 ? t + 360 : t;
}
function _f(t) {
  return Math.max(0, Math.min(1, t || 0));
}
function Op(t, e, r) {
  return (t < 60 ? e + (r - e) * t / 60 : t < 180 ? r : t < 240 ? e + (r - e) * (240 - t) / 60 : e) * 255;
}
const fb = [
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
], Sf = [
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
function Gs(t) {
  if (t < 1 && (t = 1), t <= fb.length)
    return fb.slice(0, t);
  if (t <= Sf.length)
    return Sf.slice(0, t);
  {
    let e = [];
    for (let r = 0; r < t; r++)
      e[r] = Sf[r % Sf.length];
    return e;
  }
}
function dg(t) {
  let { r: e, g: r, b: n, opacity: i } = J2(t);
  return { r: e / 255, g: r / 255, b: n / 255, a: i };
}
let _u;
function wA() {
  return _u == null && (_u = document.createElement("canvas"), _u.width = 1, _u.height = 1), _u.getContext("2d");
}
function kA(t) {
  let e = wA();
  e.font = `${t.fontSize ?? 10}px ${t.fontFamily ?? "system-ui"}`;
  let r = t.text.split(`
`).map((i) => e.measureText(i).width), n = (t.fontSize ?? 10) * (t.lineSpacing ?? 1) * r.length;
  return {
    width: r.reduce((i, a) => Math.max(i, a)),
    height: n
  };
}
function tk() {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
function hg(t, e) {
  return [
    t[0] * e[0] + t[3] * e[1] + t[6] * e[2],
    t[1] * e[0] + t[4] * e[1] + t[7] * e[2],
    t[2] * e[0] + t[5] * e[1] + t[8] * e[2],
    t[0] * e[3] + t[3] * e[4] + t[6] * e[5],
    t[1] * e[3] + t[4] * e[4] + t[7] * e[5],
    t[2] * e[3] + t[5] * e[4] + t[8] * e[5],
    t[0] * e[6] + t[3] * e[7] + t[6] * e[8],
    t[1] * e[6] + t[4] * e[7] + t[7] * e[8],
    t[2] * e[6] + t[5] * e[7] + t[8] * e[8]
  ];
}
function rk(t, e) {
  return [
    e[0] * t[0] + e[3] * t[1] + e[6] * t[2],
    e[1] * t[0] + e[4] * t[1] + e[7] * t[2],
    e[2] * t[0] + e[5] * t[1] + e[8] * t[2]
  ];
}
function _A(t) {
  return t[0] * t[4] * t[8] - t[0] * t[5] * t[7] - t[1] * t[3] * t[8] + t[1] * t[5] * t[6] + t[2] * t[3] * t[7] - t[2] * t[4] * t[6];
}
function nk(t) {
  let e = _A(t);
  return [
    (t[4] * t[8] - t[5] * t[7]) / e,
    (t[2] * t[7] - t[1] * t[8]) / e,
    (t[1] * t[5] - t[2] * t[4]) / e,
    (t[5] * t[6] - t[3] * t[8]) / e,
    (t[0] * t[8] - t[2] * t[6]) / e,
    (t[2] * t[3] - t[0] * t[5]) / e,
    (t[3] * t[7] - t[4] * t[6]) / e,
    (t[1] * t[6] - t[0] * t[7]) / e,
    (t[0] * t[4] - t[1] * t[3]) / e
  ];
}
class fd {
  viewport;
  width;
  height;
  _matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  _pixel_kx = 0;
  _pixel_bx = 0;
  _pixel_ky = 0;
  _pixel_by = 0;
  constructor(e, r, n) {
    this.viewport = e, this.width = r, this.height = n, this.updateCoefficients();
  }
  update(e, r, n) {
    this.viewport = e, this.width = r, this.height = n, this.updateCoefficients();
  }
  updateCoefficients() {
    let { x: e, y: r, scale: n } = this.viewport, i = n, a = n;
    this.width < this.height ? i *= this.height / this.width : a *= this.width / this.height, this._matrix = [i, 0, 0, 0, a, 0, -e * i, -r * a, 1], this._pixel_kx = this._matrix[0] * this.width / 2, this._pixel_bx = (this._matrix[6] + 1) * this.width / 2, this._pixel_ky = -this._matrix[4] * this.height / 2, this._pixel_by = (-this._matrix[7] + 1) * this.height / 2;
  }
  matrix() {
    return this._matrix;
  }
  pixelLocation(e, r) {
    return { x: e * this._pixel_kx + this._pixel_bx, y: r * this._pixel_ky + this._pixel_by };
  }
  coordinateAtPixel(e, r) {
    return { x: (e - this._pixel_bx) / this._pixel_kx, y: (r - this._pixel_by) / this._pixel_ky };
  }
  pixelLocationFunction() {
    let e = this._pixel_kx, r = this._pixel_ky, n = this._pixel_bx, i = this._pixel_by;
    return (a, l) => ({ x: a * e + n, y: l * r + i });
  }
  coordinateAtPixelFunction() {
    let e = this._pixel_kx, r = this._pixel_ky, n = this._pixel_bx, i = this._pixel_by;
    return (a, l) => ({ x: (a - n) / e, y: (l - i) / r });
  }
}
class P0 {
  _needsRun = !0;
  _inputs = /* @__PURE__ */ new Set();
  _targets = /* @__PURE__ */ new Set();
  constructor(e = []) {
    this._inputs = new Set(e);
    for (let r of this._inputs)
      r._targets.add(this);
  }
  addInput(e) {
    this._inputs.add(e), e._targets.add(this);
  }
  removeInput(e) {
    e._targets.delete(this), this._inputs.delete(e);
  }
  run() {
    if (this._needsRun) {
      for (let e of this._inputs)
        e.run();
      this.update(), this._needsRun = !1;
    }
  }
  setNeedsRunDownstream() {
    for (let e of this._targets)
      e._needsRun || (e._needsRun = !0, e.setNeedsRunDownstream());
  }
  update() {
  }
  destroy() {
    for (let e of this._inputs)
      e._targets.delete(this);
  }
}
let Xs = class extends P0 {
  _value = null;
  setValue(t) {
    this._value !== t && (this._value = t, this.setNeedsRunDownstream());
  }
  get value() {
    return this.run(), this._value;
  }
};
class ok extends Xs {
  constructor(e) {
    super([]), this.setValue(e);
  }
  get value() {
    return super.value;
  }
  set value(e) {
    this.setValue(e);
  }
}
class SA extends Xs {
  fn;
  constructor(e, r) {
    super(r), this.fn = e;
  }
  update() {
    this.setValue(this.fn());
  }
}
class MA extends Xs {
  fn;
  state;
  constructor(e, r) {
    super(r), this.fn = e, this.state = {};
  }
  update() {
    this.setValue(this.fn(this.state));
  }
  destroy() {
    super.destroy(), this.state.destroy && this.state.destroy(), this.state = {};
  }
}
class CA extends Xs {
  parent;
  condition;
  buildTrue;
  buildFalse;
  context = null;
  currentCondition = null;
  currentNode = null;
  constructor(e, r, n, i) {
    super([r]), this.parent = e, this.condition = r, this.buildTrue = n, this.buildFalse = i;
  }
  update() {
    (this.currentNode == null || this.currentCondition !== this.condition.value) && (this.currentNode && this.removeInput(this.currentNode), this.context?.destroy(), this.context = new Dl(this.parent), this.currentCondition = this.condition.value, this.currentCondition ? this.currentNode = this.buildTrue(this.context) : this.currentNode = this.buildFalse(this.context), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.context?.destroy();
  }
}
class RA extends Xs {
  parent;
  input;
  build;
  cache;
  constructor(e, r, n) {
    super([r]), this.parent = e, this.input = r, this.build = n, this.cache = /* @__PURE__ */ new Map();
  }
  update() {
    let e = /* @__PURE__ */ new Set(), r = this.input.value.map((n) => {
      if (e.add(n), this.cache.has(n)) {
        let i = this.cache.get(n);
        return i.input.value = n, i.output.value;
      } else {
        let i = new Dl(this.parent), a = new ok(n), l = this.build(i, a);
        return this.cache.set(n, { context: i, input: a, output: l }), this.addInput(l), l.value;
      }
    });
    for (let [n, i] of this.cache)
      e.has(n) || (this.cache.delete(n), this.removeInput(i.output), i.context.destroy());
    this.setValue(r);
  }
  destroy() {
    super.destroy();
    for (let e of this.cache.values())
      e.context.destroy();
  }
}
class AA extends Xs {
  parent;
  input;
  cases;
  currentCase = null;
  currentNode = null;
  currentContext = null;
  constructor(e, r, n) {
    super([r]), this.parent = e, this.input = r, this.cases = n;
  }
  update() {
    (this.currentNode == null || this.input.value !== this.currentCase) && (this.currentNode && this.removeInput(this.currentNode), this.currentContext?.destroy(), this.currentContext = new Dl(this.parent), this.currentCase = this.input.value, this.currentNode = this.cases[this.currentCase](this.currentContext), this.addInput(this.currentNode)), this.setValue(this.currentNode.value);
  }
  destroy() {
    super.destroy(), this.currentContext?.destroy();
  }
}
class Dl {
  _children;
  _nodes;
  /** Creates a new dataflow context. */
  constructor(e = null) {
    this._children = /* @__PURE__ */ new Set(), this._nodes = /* @__PURE__ */ new Set(), e?._children.add(this);
  }
  /** Destroy the dataflow and all associated states. */
  destroy() {
    for (let e of this._children)
      e.destroy();
    for (let e of this._nodes)
      e.destroy();
    this._children.clear(), this._nodes.clear();
  }
  /** Creates a value node. */
  value(e) {
    let r = new ok(e);
    return this._nodes.add(r), r;
  }
  /** Creates a derived value. */
  derive(e, r) {
    let n = e.map((a) => a instanceof P0 ? a : this.value(a)), i = new SA(() => r(...n.map((a) => a.value)), n);
    return this._nodes.add(i), i;
  }
  /** Creates a stateful derived value. */
  statefulDerive(e, r) {
    let n = e.map((a) => a instanceof P0 ? a : this.value(a)), i = new MA((a) => r(a, ...n.map((l) => l.value)), n);
    return this._nodes.add(i), i;
  }
  /** Creates a true or false dataflow depending on the value of the condition. */
  if(e, r, n) {
    let i = new CA(this, e, r, n);
    return this._nodes.add(i), i;
  }
  switch(e, r) {
    let n = new AA(this, e, r);
    return this._nodes.add(n), n;
  }
  map(e, r) {
    let n = new RA(this, e, r);
    return this._nodes.add(n), n;
  }
  assertNotNull(e) {
    return e;
  }
  subgraph() {
    return new Dl(this);
  }
}
function di(t, e, r, n) {
  if (t.program == null || t.vsSource != r || t.fsSource != n) {
    t.destroy && t.destroy();
    let a = db(e, e.VERTEX_SHADER, r), l = db(e, e.FRAGMENT_SHADER, n), u = e.createProgram();
    if (e.attachShader(u, a), e.attachShader(u, l), e.linkProgram(u), !e.getProgramParameter(u, e.LINK_STATUS)) {
      var i = e.getProgramInfoLog(u);
      throw new Error(`failed to link program: ${i}, vertex source: ${r}, fragment source: ${n}`);
    }
    t.program = u, t.vsSource = r, t.fsSource = n, t.destroy = () => {
      e.deleteProgram(u), e.deleteShader(a), e.deleteShader(l);
    }, t.uniforms = {};
    for (let c of (r + n).matchAll(/uniform +[0-9a-zA-Z_]+ +([0-9a-zA-Z_]+) *(;|\[)/g)) {
      let f = c[1];
      t.uniforms[f] = e.getUniformLocation(u, f);
    }
  }
  return { program: t.program, uniforms: t.uniforms ?? {} };
}
function db(t, e, r) {
  let n = t.createShader(e);
  if (t.shaderSource(n, r), t.compileShader(n), !t.getShaderParameter(n, t.COMPILE_STATUS)) {
    var i = t.getShaderInfoLog(n);
    throw new Error(`failed to compile shader: ${i}, source: ${r}`);
  }
  return n;
}
function li(t, e, r, n) {
  if (t.buffer == null) {
    let i = e.createBuffer();
    t.buffer = i, t.destroy = () => {
      e.deleteBuffer(i);
    };
  }
  if (t.data !== r) {
    if (t.data = r, e.bindBuffer(e.ARRAY_BUFFER, t.buffer), r instanceof Array)
      switch (n ?? "f32") {
        case "f32":
          e.bufferData(e.ARRAY_BUFFER, new Float32Array(r), e.STATIC_DRAW);
          break;
        case "i32":
          e.bufferData(e.ARRAY_BUFFER, new Int32Array(r), e.STATIC_DRAW);
          break;
        case "u32":
          e.bufferData(e.ARRAY_BUFFER, new Uint32Array(r), e.STATIC_DRAW);
          break;
        case "i16":
          e.bufferData(e.ARRAY_BUFFER, new Int16Array(r), e.STATIC_DRAW);
          break;
        case "u16":
          e.bufferData(e.ARRAY_BUFFER, new Uint16Array(r), e.STATIC_DRAW);
          break;
        case "i8":
          e.bufferData(e.ARRAY_BUFFER, new Int8Array(r), e.STATIC_DRAW);
          break;
        case "u8":
          e.bufferData(e.ARRAY_BUFFER, new Uint8Array(r), e.STATIC_DRAW);
          break;
        default:
          throw new Error("invalid type");
      }
    else
      e.bufferData(e.ARRAY_BUFFER, r, e.STATIC_DRAW);
    e.bindBuffer(e.ARRAY_BUFFER, null);
  }
  return t.buffer;
}
function EA(t, e, r, n, i) {
  const a = {
    u8: {
      1: [t.R8, t.RED, t.UNSIGNED_BYTE],
      2: [t.RG8, t.RG, t.UNSIGNED_BYTE],
      3: [t.RGB8, t.RGB, t.UNSIGNED_BYTE],
      4: [t.RGBA8, t.RGBA, t.UNSIGNED_BYTE]
    },
    u16: {
      1: [t.R8, t.RED, t.UNSIGNED_SHORT],
      2: [t.RG8, t.RG, t.UNSIGNED_SHORT],
      3: [t.RGB8, t.RGB, t.UNSIGNED_SHORT],
      4: [t.RGBA8, t.RGBA, t.UNSIGNED_SHORT]
    },
    u32: {
      1: [t.R8, t.RED, t.UNSIGNED_INT],
      2: [t.RG8, t.RG, t.UNSIGNED_INT],
      3: [t.RGB8, t.RGB, t.UNSIGNED_INT],
      4: [t.RGBA8, t.RGBA, t.UNSIGNED_INT]
    },
    f32: {
      1: [t.R32F, t.RED, t.FLOAT],
      2: [t.RG32F, t.RG, t.FLOAT],
      3: [t.RGB32F, t.RGB, t.FLOAT],
      4: [t.RGBA32F, t.RGBA, t.FLOAT]
    }
  };
  let [l, u, c] = a[i][n];
  t.texImage2D(t.TEXTURE_2D, 0, l, e, r, 0, u, c, null), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MIN_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE), t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE);
}
function va(t, e, r, n, i, a) {
  if (t.framebuffer == null || t.texture == null) {
    let u = e.createFramebuffer(), c = e.createTexture();
    e.bindFramebuffer(e.FRAMEBUFFER, u), e.bindTexture(e.TEXTURE_2D, c), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, c, 0), e.bindTexture(e.TEXTURE_2D, null), e.bindFramebuffer(e.FRAMEBUFFER, null), t.framebuffer = u, t.texture = c, t.destroy = () => {
      e.deleteFramebuffer(u), e.deleteTexture(c);
    };
  }
  let l = `${r},${n},${i},${a}`;
  return t.cacheKey != l && (t.cacheKey = l, e.bindTexture(e.TEXTURE_2D, t.texture), EA(e, r, n, i, a), e.bindTexture(e.TEXTURE_2D, null)), {
    framebuffer: t.framebuffer,
    texture: t.texture,
    width: r,
    height: n
  };
}
function TA(t) {
  let e = t.squareMaxSize, r = t.samples, n = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, i = `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform vec2 resolution;
    uniform vec2 direction;
    in vec2 uv;
    out vec4 outColor;
    void main() {
      vec4 color = vec4(0.0);
      const int count = ${e};
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
  `, a = `#version 300 es
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
        ${r.map(({ x: l, y: u, w: c }) => `color -= texture(image, uv + vec2(${l.toFixed(8)}, ${u.toFixed(8)}) / resolution) * (${c.toFixed(8)})`).join(";")};
      }
      outColor = color * scaler;
    }
  `;
  return { vertex: n, fragment1: i, fragment2: a };
}
function $A(t, e, r) {
  let n = t.derive([r], FA), i = t.derive([n], TA), a = t.statefulDerive(
    [e, t.derive([i], (c) => c.vertex), t.derive([i], (c) => c.fragment1)],
    di
  ), l = t.statefulDerive(
    [e, t.derive([i], (c) => c.vertex), t.derive([i], (c) => c.fragment2)],
    di
  ), u = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive(
    [e, u, a, l, r, n],
    (c, f, d, p, g, m) => (y, w, x) => {
      let { width: k, height: S } = w;
      c.disable(c.BLEND), c.enableVertexAttribArray(0), c.bindBuffer(c.ARRAY_BUFFER, f), c.vertexAttribPointer(0, 2, c.FLOAT, !1, 0, 0), c.bindBuffer(c.ARRAY_BUFFER, null), c.useProgram(d.program), c.uniform2f(d.uniforms.resolution, k, S), c.uniform1i(d.uniforms.image, 0), c.bindFramebuffer(c.FRAMEBUFFER, w.framebuffer), c.bindTexture(c.TEXTURE_2D, y), c.uniform2f(d.uniforms.direction, 0, 1), c.drawArrays(c.TRIANGLE_STRIP, 0, 4), c.bindFramebuffer(c.FRAMEBUFFER, x.framebuffer), c.bindTexture(c.TEXTURE_2D, w.texture), c.uniform2f(d.uniforms.direction, 1, 0), c.drawArrays(c.TRIANGLE_STRIP, 0, 4), c.bindFramebuffer(c.FRAMEBUFFER, w.framebuffer), c.activeTexture(c.TEXTURE1), c.bindTexture(c.TEXTURE_2D, x.texture), c.activeTexture(c.TEXTURE0), c.bindTexture(c.TEXTURE_2D, y), c.useProgram(p.program), c.uniform2f(p.uniforms.resolution, k, S), c.uniform1i(p.uniforms.image, 0), c.uniform1i(p.uniforms.imageBox, 1);
      let _ = 1 / m.totalWeight * g * g * Math.PI;
      c.uniform1f(p.uniforms.scaler, _), c.drawArrays(c.TRIANGLE_STRIP, 0, 4), c.bindFramebuffer(c.FRAMEBUFFER, null), c.useProgram(null), c.activeTexture(c.TEXTURE1), c.bindTexture(c.TEXTURE_2D, null), c.activeTexture(c.TEXTURE0), c.bindTexture(c.TEXTURE_2D, null), c.disableVertexAttribArray(0);
    }
  );
}
function hb(t, e, r) {
  let n = Math.sqrt(e * e + r * r);
  if (n < t - Math.sqrt(2) / 2)
    return 1;
  if (n > t + Math.sqrt(2) / 2)
    return 0;
  let i = 2, a = 0;
  for (let l = 0; l < i; l++)
    for (let u = 0; u < i; u++) {
      let c = e + (l + 0.5) / i - 0.5, f = r + (u + 0.5) / i - 0.5;
      Math.sqrt(c * c + f * f) < t && (a += 1);
    }
  return a / i / i;
}
function FA(t) {
  let e = Math.floor(t + 0.5), r = e, n = hb(t, 0, 0), i = [];
  for (let u = -e; u <= e; u++)
    for (let c = -e; c <= e; c++) {
      let f = n - hb(t, u, c);
      if (!(f <= 0))
        if (i.length > 0 && u == i[i.length - 1].x && c == i[i.length - 1].y + 1) {
          let d = i[i.length - 1].w, p = f;
          i[i.length - 1].y += 1 - d / (d + p), i[i.length - 1].w = d + p;
        } else
          i.push({ x: u, y: c, w: f });
    }
  i = i.sort((u, c) => u.y != c.y ? u.y - c.y : u.x - c.x);
  let a = [];
  for (let { x: u, y: c, w: f } of i)
    if (a.length > 0 && c == a[a.length - 1].y && u == a[a.length - 1].x + 1) {
      let d = a[a.length - 1].w, p = f;
      a[a.length - 1].x += 1 - d / (d + p), a[a.length - 1].w = d + p;
    } else
      a.push({ x: u, y: c, w: f });
  let l = -a.reduce((u, c) => u + c.w, 0);
  return l += n * (1 + r * 2) * (1 + r * 2), { squareMaxSize: r, squareWeight: n, samples: a, totalWeight: l };
}
function NA(t) {
  let e;
  return t ? e = `#version 300 es
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
    ` : e = `#version 300 es
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
    `, { vertex: e, fragment: `#version 300 es
    precision highp float;
    in vec4 color;
    out vec4 outColor;
    void main() {
      outColor = color;
    }
  ` };
}
function L0(t, e, r, n, i, a) {
  let l = i != null, u = NA(l), c = t.statefulDerive([e, u.vertex, u.fragment], di);
  return t.derive([e, c, r, n, i, a], (f, d, p, g, m, y) => (w) => {
    f.enable(f.BLEND), f.blendFunc(f.ONE, f.ONE), f.useProgram(d.program), f.enableVertexAttribArray(0), f.bindBuffer(f.ARRAY_BUFFER, p), f.vertexAttribPointer(0, 1, f.FLOAT, !1, 0, 0), f.enableVertexAttribArray(1), f.bindBuffer(f.ARRAY_BUFFER, g), f.vertexAttribPointer(1, 1, f.FLOAT, !1, 0, 0), m != null && (f.enableVertexAttribArray(2), f.bindBuffer(f.ARRAY_BUFFER, m), f.vertexAttribIPointer(2, 1, f.BYTE, 0, 0)), f.bindBuffer(f.ARRAY_BUFFER, null), f.uniformMatrix3fv(d.uniforms.matrix, !1, w), f.drawArrays(f.POINTS, 0, y), f.disableVertexAttribArray(0), f.disableVertexAttribArray(1), m != null && f.disableVertexAttribArray(2), f.useProgram(null);
  });
}
function zA() {
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
function ik(t, e) {
  let { vertex: r, fragment: n } = zA(), i = t.statefulDerive([e, r, n], di), a = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive([e, i, a], (l, u, c) => (f, d, p, g) => {
    l.disable(l.BLEND), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.xyScaler, p ?? 1, g ?? 1), l.uniform1f(u.uniforms.gamma, d ?? 2.2), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
  });
}
function ak(t) {
  return Math.ceil(t * 3);
}
function OA(t) {
  let e = ak(t), r = [];
  for (let u = -e; u <= e; u++)
    r.push(Math.exp(-u * u / t / t / 2));
  let n = r.reduce((u, c) => u + c, 0);
  r = r.map((u) => u / n);
  let i = DA(r).map(([u, c]) => [u - e, c]), a = `#version 300 es
    precision highp float;
    layout(location=0) in vec2 xy;
    out vec2 uv;
    void main() {
      gl_Position = vec4(xy, 0, 1);
      uv = (xy + 1.0) / 2.0;
    }
  `, l = `#version 300 es
    precision highp float;
    uniform sampler2D image;
    uniform vec2 resolution;
    uniform vec2 direction;
    in vec2 uv;
    out vec4 outColor;

    void main() {
      vec4 color = vec4(0.0);
      ${i.map(([u, c]) => `color += texture(image, uv + direction * vec2(${u.toFixed(10)}) / resolution) * ${c.toFixed(10)};`).join(`
`)}
      outColor = color;
    }
  `;
  return { vertex: a, fragment: l };
}
function BA(t, e, r) {
  let n = t.derive([r], OA), i = t.statefulDerive(
    [e, t.derive([n], (l) => l.vertex), t.derive([n], (l) => l.fragment)],
    di
  ), a = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive([e, a, i, r], (l, u, c, f) => (d, p, g) => {
    let { width: m, height: y } = p;
    l.disable(l.BLEND), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, u), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.useProgram(c.program), l.uniform2f(c.uniforms.resolution, m, y), l.uniform1i(c.uniforms.image, 0), l.bindFramebuffer(l.FRAMEBUFFER, g.framebuffer), l.bindTexture(l.TEXTURE_2D, d), l.uniform2f(c.uniforms.direction, 0, 1), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.bindFramebuffer(l.FRAMEBUFFER, p.framebuffer), l.bindTexture(l.TEXTURE_2D, g.texture), l.uniform2f(c.uniforms.direction, 1, 0), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.bindFramebuffer(l.FRAMEBUFFER, null), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
  });
}
function DA(t) {
  let e = [];
  for (let r = 0; r < t.length; r += 2)
    if (r + 1 < t.length) {
      let n = t[r], i = t[r + 1], a = 1 - n / (n + i);
      if (a >= 0 && a <= 1) {
        let l = n + i;
        l != 0 && e.push([r + a, l]);
      } else
        e.push([r, t[r]]), e.push([r + 1, t[r + 1]]);
    } else
      e.push([r, t[r]]);
  return e;
}
function PA(t) {
  return Math.ceil(t * 3);
}
function LA() {
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
function qA(t, e, r) {
  let { vertex: n, fragment: i } = LA(), a = t.statefulDerive([e, n, i], di), l = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive([e, l, a], (u, c, f) => (d, p, g) => {
    let { width: m, height: y } = p;
    u.disable(u.BLEND), u.enableVertexAttribArray(0), u.bindBuffer(u.ARRAY_BUFFER, c), u.vertexAttribPointer(0, 2, u.FLOAT, !1, 0, 0), u.bindBuffer(u.ARRAY_BUFFER, null), u.useProgram(f.program), u.uniform2f(f.uniforms.resolution, m, y), u.uniform1i(f.uniforms.image, 0);
    let w = d, x = g, k = p;
    for (let S = 0; S < 2; S++) {
      u.uniform2f(f.uniforms.direction, S, 1 - S);
      for (let [_, E, C] of IA) {
        u.bindFramebuffer(u.FRAMEBUFFER, x.framebuffer), u.bindTexture(u.TEXTURE_2D, w), u.uniform1fv(f.uniforms.weight0, E), u.uniform3fv(f.uniforms.distances, _), u.uniform3fv(f.uniforms.weights, C), u.drawArrays(u.TRIANGLE_STRIP, 0, 4), w = x.texture;
        let R = x;
        x = k, k = R;
      }
    }
    u.bindFramebuffer(u.FRAMEBUFFER, null), u.useProgram(null), u.bindTexture(u.TEXTURE_2D, null), u.disableVertexAttribArray(0);
  });
}
const IA = [
  [[1, 2, 3], [0.2288468365182578], [0.18230006506971572, 0.1356122230111784, 0.06766429365997693]],
  [[2, 6, 10], [0.09116254014100238], [0.23317759354726447, 0.18385867277788717, 0.03738246360434722]],
  [[3, 10, 20], [0.2950645715317288], [0.010918865853671198, 0.23773695670296047, 0.10381189167750389]],
  [[4, 16, 30], [0.20085957073474772], [0.14463019087130788, 0.17934533765938643, 0.07559468610193185]]
];
function jA() {
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
function UA(t, e) {
  let { vertex: r, fragment: n } = jA(), i = t.statefulDerive([e, r, n], di), a = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive(
    [e, i, a],
    (l, u, c) => (f, d, p, g, m, y) => {
      l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f.texture), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.resolution, f.width, f.height), l.uniform1f(u.uniforms.densityScaler, d), l.uniform1f(u.uniforms.quantizationStep, p), l.uniform1f(u.uniforms.globalAlpha, g), l.uniform4fv(u.uniforms.channelMask, m), l.uniform4fv(u.uniforms.color, y), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
    }
  );
}
function WA() {
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
function HA(t, e) {
  let { vertex: r, fragment: n } = WA(), i = t.statefulDerive([e, r, n], di), a = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive(
    [e, i, a],
    (l, u, c) => (f, d, p, g, m, y) => {
      l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f.texture), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.resolution, f.width, f.height), l.uniform1f(u.uniforms.densityScaler, d), l.uniform1f(u.uniforms.quantizationStep, p), l.uniform1f(u.uniforms.globalAlpha, g), l.uniform1i(u.uniforms.isDarkMode, y == "dark" ? 1 : 0), l.uniformMatrix4fv(u.uniforms.colorMatrix, !1, m), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
    }
  );
}
function VA(t) {
  let e;
  return t ? e = `#version 300 es
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
    ` : e = `#version 300 es
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
    `, { vertex: e, fragment: `#version 300 es
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
function pb(t, e, r, n, i, a) {
  let l = i != null, u = VA(l), c = t.statefulDerive([e, u.vertex, u.fragment], di);
  return t.derive(
    [e, c, r, n, i, a],
    (f, d, p, g, m, y) => (w, x, k, S) => {
      f.enable(f.BLEND), f.blendFunc(f.ONE, f.ONE_MINUS_SRC_ALPHA), f.useProgram(d.program), f.enableVertexAttribArray(0), f.bindBuffer(f.ARRAY_BUFFER, p), f.vertexAttribPointer(0, 1, f.FLOAT, !1, 0, 0), f.enableVertexAttribArray(1), f.bindBuffer(f.ARRAY_BUFFER, g), f.vertexAttribPointer(1, 1, f.FLOAT, !1, 0, 0), m != null && (f.enableVertexAttribArray(2), f.bindBuffer(f.ARRAY_BUFFER, m), f.vertexAttribIPointer(2, 1, f.BYTE, 0, 0)), f.bindBuffer(f.ARRAY_BUFFER, null), f.uniformMatrix3fv(d.uniforms.matrix, !1, w), f.uniform1f(d.uniforms.point_size, x * 2), f.uniform1f(d.uniforms.alpha, k), l ? f.uniform4fv(d.uniforms.colorScheme, S) : f.uniform4fv(d.uniforms.colorScheme, S.slice(0, 4)), f.drawArrays(f.POINTS, 0, y), f.disableVertexAttribArray(0), f.disableVertexAttribArray(1), m != null && f.disableVertexAttribArray(2), f.useProgram(null);
    }
  );
}
function GA() {
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
function XA(t, e) {
  let { vertex: r, fragment: n } = GA(), i = t.statefulDerive([e, r, n], di), a = t.statefulDerive([e, [-1, -1, -1, 1, 1, -1, 1, 1], "f32"], li);
  return t.derive(
    [e, i, a],
    (l, u, c) => (f, d, p, g, m) => {
      l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA), l.enableVertexAttribArray(0), l.bindBuffer(l.ARRAY_BUFFER, c), l.vertexAttribPointer(0, 2, l.FLOAT, !1, 0, 0), l.bindBuffer(l.ARRAY_BUFFER, null), l.bindTexture(l.TEXTURE_2D, f.texture), l.useProgram(u.program), l.uniform1i(u.uniforms.source, 0), l.uniform2f(u.uniforms.resolution, f.width, f.height), l.uniform1f(u.uniforms.pointAlpha, d), l.uniform1f(u.uniforms.globalAlpha, p), l.uniform1i(u.uniforms.isDarkMode, m == "dark" ? 1 : 0), l.uniformMatrix4fv(u.uniforms.colorMatrix, !1, g), l.drawArrays(l.TRIANGLE_STRIP, 0, 4), l.useProgram(null), l.bindTexture(l.TEXTURE_2D, null), l.disableVertexAttribArray(0);
    }
  );
}
let YA = class {
  props;
  viewport;
  df;
  gl;
  renderInputs;
  dataBuffers;
  renderer;
  constructor(t, e, r) {
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
      width: e,
      height: r
    }, this.viewport = new fd({ x: 0, y: 0, scale: 1 }, e, r);
    let n = new Dl(), i = n.value(t);
    this.df = n, this.gl = i, this.renderInputs = {
      mode: n.value(this.props.mode),
      colorScheme: n.value(this.props.colorScheme),
      xData: n.value(this.props.x),
      yData: n.value(this.props.y),
      categoryData: n.value(this.props.category),
      categoryCount: n.value(this.props.categoryCount),
      matrix: n.value(tk()),
      width: n.value(e),
      height: n.value(r),
      pointSize: n.value(this.props.pointSize),
      densityBandwidth: n.value(this.props.densityBandwidth)
    }, this.dataBuffers = KA(n, i, this.renderInputs), this.renderer = ZA(n, i, this.renderInputs, this.dataBuffers);
  }
  setProps(t) {
    let e = !1, r;
    for (r in t)
      t[r] !== this.props[r] && (this.props[r] = t[r], e = !0);
    return this.viewport.update(
      { x: this.props.viewportX, y: this.props.viewportY, scale: this.props.viewportScale },
      this.props.width,
      this.props.height
    ), this.renderInputs.mode.value = this.props.mode, this.renderInputs.colorScheme.value = this.props.colorScheme, this.renderInputs.xData.value = this.props.x, this.renderInputs.yData.value = this.props.y, this.renderInputs.categoryData.value = this.props.category, this.props.category != null ? this.renderInputs.categoryCount.value = this.props.categoryCount : this.renderInputs.categoryCount.value = 1, this.renderInputs.matrix.value = this.viewport.matrix(), this.renderInputs.width.value = this.props.width, this.renderInputs.height.value = this.props.height, this.renderInputs.pointSize.value = this.props.pointSize, this.renderInputs.densityBandwidth.value = this.props.densityBandwidth, e;
  }
  render() {
    this.renderer.value(this.props);
  }
  destroy() {
    this.df.destroy();
  }
  async densityMap(t, e, r, n) {
    let i = this.df.subgraph(), a = eE(i, this.gl, this.dataBuffers, i.value(t), i.value(e), i.value(r)), { x: l, y: u, scale: c } = n, f = [c, 0, 0, 0, c, 0, -l * c, -u * c, 1], d = a.value(f), p = nk(f);
    return i.destroy(), {
      data: d,
      width: t,
      height: e,
      coordinateAtPixel: (g, m) => {
        let y = g / t * 2 - 1, w = m / e * 2 - 1, x = rk([y, w, 1], p);
        return { x: x[0], y: x[1] };
      }
    };
  }
};
function KA(t, e, r) {
  const n = t.statefulDerive([e, r.xData, "f32"], li), i = t.statefulDerive([e, r.yData, "f32"], li), a = t.if(
    t.derive([r.categoryData], (u) => u != null),
    (u) => u.statefulDerive([e, u.assertNotNull(r.categoryData), "u8"], li),
    (u) => u.value(null)
  ), l = t.derive([r.xData], (u) => u.length);
  return { x: n, y: i, category: a, count: l };
}
function ZA(t, e, r, n) {
  return t.switch(r.mode, {
    points: (i) => QA(i, e, r, n),
    density: (i) => JA(i, e, r, n)
  });
}
function QA(t, e, r, n) {
  const i = t.derive([r.categoryCount], (c) => c > 1), a = t.statefulDerive([e, r.width, r.height, 4, "f32"], va);
  let l = t.if(
    i,
    (c) => pb(c, e, n.x, n.y, c.assertNotNull(n.category), n.count),
    (c) => pb(c, e, n.x, n.y, null, n.count)
  ), u = ik(t, e);
  return t.derive(
    [e, a, l, u, r.colorScheme, r.matrix, r.categoryCount],
    (c, f, d, p, g, m, y) => (w) => {
      let x = [], k = w.categoryColors ?? Gs(w.categoryCount);
      for (let S = 0; S < y; S++)
        if (S < k.length) {
          let { r: _, g: E, b: C } = dg(k[S]);
          _ = Math.pow(_, w.gamma), E = Math.pow(E, w.gamma), C = Math.pow(C, w.gamma), x = x.concat([_, E, C, 1]);
        } else
          x = x.concat([0.5, 0.5, 0.5, 1]);
      c.bindFramebuffer(c.FRAMEBUFFER, f.framebuffer), c.viewport(0, 0, f.width, f.height), g == "light" ? c.clearColor(1, 1, 1, 1) : c.clearColor(0, 0, 0, 1), c.clear(c.COLOR_BUFFER_BIT), d(m, Math.max(3, w.pointSize), w.pointAlpha * w.pointsAlpha, x), c.bindFramebuffer(c.FRAMEBUFFER, null), c.viewport(0, 0, w.width, w.height), p(f.texture, w.gamma);
    }
  );
}
function JA(t, e, r, n) {
  let i = t.derive([r.densityBandwidth], (_) => PA(_) + 1), a = t.derive([r.width, i], (_, E) => _ + E * 2), l = t.derive([r.height, i], (_, E) => _ + E * 2);
  const u = t.derive([r.categoryCount], (_) => _ > 1), c = t.statefulDerive([e, a, l, 4, "f32"], va), f = t.statefulDerive([e, a, l, 4, "f32"], va), d = t.statefulDerive([e, a, l, 4, "f32"], va), p = t.statefulDerive([e, a, l, 4, "f32"], va);
  let g = t.if(
    u,
    (_) => L0(_, e, n.x, n.y, _.assertNotNull(n.category), n.count),
    (_) => L0(_, e, n.x, n.y, null, n.count)
  ), m = $A(t, e, r.pointSize), y = qA(t, e, r.densityBandwidth), w = XA(t, e), x = HA(t, e), k = UA(t, e), S = ik(t, e);
  return t.derive(
    [
      e,
      c,
      f,
      d,
      p,
      r.colorScheme,
      r.matrix,
      g,
      m,
      y,
      w,
      x,
      k,
      S
    ],
    (_, E, C, R, A, N, L, j, B, P, q, H, X, V) => (G) => {
      let Z = G.categoryColors ?? Gs(G.categoryCount), Y = [];
      for (let se = 0; se < 4; se++)
        if (se < Z.length) {
          let { r: ye, g: _e, b: be } = dg(Z[se]);
          ye = Math.pow(ye, G.gamma), _e = Math.pow(_e, G.gamma), be = Math.pow(be, G.gamma), Y = Y.concat([ye, _e, be, 1]);
        } else
          Y = Y.concat([0.5, 0.5, 0.5, 1]);
      let I = G.width / C.width, K = G.height / C.height, ie = hg([I, 0, 0, 0, K, 0, 0, 0, 1], L);
      if (_.bindFramebuffer(_.FRAMEBUFFER, E.framebuffer), _.viewport(0, 0, E.width, E.height), _.clearColor(0, 0, 0, 0), _.clear(_.COLOR_BUFFER_BIT), j(ie), _.bindFramebuffer(_.FRAMEBUFFER, C.framebuffer), _.viewport(0, 0, C.width, C.height), N == "light" ? _.clearColor(1, 1, 1, 1) : _.clearColor(0, 0, 0, 1), _.clear(_.COLOR_BUFFER_BIT), G.pointAlpha > 0 && G.pointsAlpha > 0 && (B(E.texture, R, A), _.bindFramebuffer(_.FRAMEBUFFER, C.framebuffer), q(R, G.pointAlpha, G.pointsAlpha, Y, N)), G.densityScaler > 0 && (G.densityAlpha > 0 || G.contoursAlpha > 0) && (P(E.texture, R, A), _.bindFramebuffer(_.FRAMEBUFFER, C.framebuffer), G.densityAlpha > 0 && H(
        R,
        G.densityScaler,
        G.densityQuantizationStep,
        G.densityAlpha,
        Y,
        N
      ), G.contoursAlpha > 0))
        for (let se = 0; se < Z.length; se++) {
          let ye = [0, 0, 0, 0];
          ye[se] = 1, X(
            R,
            G.densityScaler,
            G.densityQuantizationStep,
            G.contoursAlpha,
            ye,
            Y.slice(se * 4, se * 4 + 4)
          );
        }
      _.bindFramebuffer(_.FRAMEBUFFER, null), _.viewport(0, 0, G.width, G.height), V(C.texture, G.gamma, 1 / I, 1 / K);
    }
  );
}
function eE(t, e, r, n, i, a) {
  let l = t.derive([a], (y) => ak(y) + 1), u = t.derive([n, l], (y, w) => y + w * 2), c = t.derive([i, l], (y, w) => y + w * 2);
  const f = t.statefulDerive([e, u, c, 1, "f32"], va), d = t.statefulDerive([e, u, c, 1, "f32"], va), p = t.statefulDerive([e, u, c, 1, "f32"], va);
  let g = L0(t, e, r.x, r.y, null, r.count), m = BA(t, e, a);
  return t.derive(
    [e, l, n, i, f, d, p, g, m],
    (y, w, x, k, S, _, E, C, R) => (A) => {
      let N = x / S.width, L = k / S.height, j = hg([N, 0, 0, 0, L, 0, 0, 0, 1], A);
      y.bindFramebuffer(y.FRAMEBUFFER, S.framebuffer), y.viewport(0, 0, S.width, S.height), y.clearColor(0, 0, 0, 0), y.clear(y.COLOR_BUFFER_BIT), C(j), R(S.texture, _, E), y.bindFramebuffer(y.FRAMEBUFFER, _.framebuffer);
      let B = new Float32Array(x * k);
      return y.readPixels(w, w, x, k, y.RED, y.FLOAT, B), y.bindFramebuffer(y.FRAMEBUFFER, null), B;
    }
  );
}
class tE {
  i32View;
  u32View;
  f32View;
  offset;
  constructor(e) {
    this.i32View = new Int32Array(e), this.u32View = new Uint32Array(e), this.f32View = new Float32Array(e), this.offset = 0;
  }
  align2() {
    this.offset % 2 != 0 && (this.offset += 2 - this.offset % 2);
  }
  align4() {
    this.offset % 4 != 0 && (this.offset += 4 - this.offset % 4);
  }
  f32(e) {
    this.f32View[this.offset++] = e;
  }
  u32(e) {
    this.u32View[this.offset++] = e;
  }
  i32(e) {
    this.i32View[this.offset++] = e;
  }
  vec2f(e, r) {
    this.align2(), this.f32View[this.offset++] = e, this.f32View[this.offset++] = r;
  }
  vec3f(e, r, n) {
    this.align4(), this.f32View[this.offset++] = e, this.f32View[this.offset++] = r, this.f32View[this.offset++] = n;
  }
  vec4f(e, r, n, i) {
    this.align4(), this.f32View[this.offset++] = e, this.f32View[this.offset++] = r, this.f32View[this.offset++] = n, this.f32View[this.offset++] = i;
  }
  mat3x3f(e) {
    this.vec3f(e[0], e[1], e[2]), this.vec3f(e[3], e[4], e[5]), this.vec3f(e[6], e[7], e[8]);
  }
  byteOffset() {
    return this.offset * 4;
  }
}
function rE(t, e) {
  let r = new ArrayBuffer(4288), n = t.statefulDerive(
    [e, 4288, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX],
    ws
  );
  return {
    buffer: n,
    update: t.derive([e, n], (i, a) => (l) => {
      let u = new tE(r);
      u.u32(l.count), u.u32(l.category_count), u.i32(l.framebuffer_width), u.i32(l.framebuffer_height), u.i32(l.density_width), u.i32(l.density_height), u.f32(l.gamma), u.f32(l.point_size), u.f32(l.point_alpha), u.f32(l.points_alpha), u.f32(l.density_scaler), u.f32(l.quantization_step), u.f32(l.density_alpha), u.f32(l.contours_alpha), u.mat3x3f(l.matrix), u.vec2f(...l.view_xy_scaler), u.vec4f(...l.kde_causal), u.vec4f(...l.kde_anticausal), u.vec4f(...l.kde_a), u.vec4f(...l.background_color);
      let c = l.gamma;
      for (let f = 0; f < Math.min(l.category_colors.length, 256); f++) {
        let { r: d, g: p, b: g, a: m } = l.category_colors[f];
        d = Math.pow(d, c), p = Math.pow(p, c), g = Math.pow(g, c), u.vec4f(d, p, g, m);
      }
      i.queue.writeBuffer(a, 0, r, 0, u.byteOffset());
    })
  };
}
const Bp = 64, Dp = 64;
function lk(t, e, r, n, i, a) {
  let l = t.derive(
    [e, r, n.layouts],
    (u, c, f) => u.createComputePipeline({
      layout: u.createPipelineLayout({ bindGroupLayouts: [f.group0, f.group1, f.group2A] }),
      compute: { module: c, entryPoint: "accumulate" }
    })
  );
  return t.derive(
    [
      l,
      n.group0,
      n.group1,
      n.group2A,
      a.countBuffer,
      i.count
    ],
    (u, c, f, d, p, g) => (m) => {
      if (m.clearBuffer(p), g == 0)
        return;
      let y = m.beginComputePass();
      y.setPipeline(u), y.setBindGroup(0, c), y.setBindGroup(1, f), y.setBindGroup(2, d), g <= Bp * Dp ? y.dispatchWorkgroups(Math.ceil(g / Bp)) : y.dispatchWorkgroups(Dp, Math.ceil(g / (Bp * Dp))), y.end();
    }
  );
}
function nE(t) {
  const { COMPUTE: e, VERTEX: r, FRAGMENT: n } = GPUShaderStage;
  return {
    // Group 0
    group0: t.createBindGroupLayout({
      entries: [{ binding: 0, visibility: e | r | n, buffer: { type: "uniform" } }]
    }),
    // Group 1
    group1: t.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: e | r, buffer: { type: "read-only-storage" } },
        { binding: 1, visibility: e | r, buffer: { type: "read-only-storage" } },
        { binding: 2, visibility: e | r, buffer: { type: "read-only-storage" } }
      ]
    }),
    // Group 2
    group2A: t.createBindGroupLayout({
      entries: [{ binding: 0, visibility: e | n, buffer: { type: "storage" } }]
    }),
    group2B: t.createBindGroupLayout({
      entries: [
        { binding: 1, visibility: e | n, buffer: { type: "storage" } },
        { binding: 2, visibility: e | n, buffer: { type: "storage" } }
      ]
    }),
    // Group 3
    group3: t.createBindGroupLayout({
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: "non-filtering" } },
        { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } },
        { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: "float" } }
      ]
    })
  };
}
function sk(t, e, r, n, i) {
  let a = t.derive([e], (p) => nE(p)), l = t.derive(
    [e, a, r],
    (p, g, m) => p.createBindGroup({
      layout: g.group0,
      entries: [{ binding: 0, resource: { buffer: m } }]
    })
  ), u = t.derive(
    [e, a, n.x, n.y, n.category],
    (p, g, m, y, w) => p.createBindGroup({
      layout: g.group1,
      entries: [
        { binding: 0, resource: { buffer: m } },
        { binding: 1, resource: { buffer: y } },
        { binding: 2, resource: { buffer: w ?? m } }
      ]
    })
  ), c = t.derive(
    [e, a, i.countBuffer, i.blurBuffer],
    (p, g, m, y) => p.createBindGroup({
      layout: g.group2A,
      entries: [{ binding: 0, resource: { buffer: m } }]
    })
  ), f = t.derive(
    [e, a, i.countBuffer, i.blurBuffer],
    (p, g, m, y) => p.createBindGroup({
      layout: g.group2B,
      entries: [
        { binding: 1, resource: { buffer: m } },
        { binding: 2, resource: { buffer: y } }
      ]
    })
  ), d = t.derive(
    [e, a, i.colorTexture, i.alphaTexture],
    (p, g, m, y) => p.createBindGroup({
      layout: g.group3,
      entries: [
        { binding: 0, resource: p.createSampler({}) },
        { binding: 1, resource: m.createView() },
        { binding: 2, resource: y.createView() }
      ]
    })
  );
  return {
    layouts: a,
    group0: l,
    group1: u,
    group2A: c,
    group2B: f,
    group3: d
  };
}
function oE(t, e, r, n, i) {
  const a = t.derive(
    [e, r, n.layouts],
    (l, u, c) => l.createRenderPipeline({
      layout: l.createPipelineLayout({
        bindGroupLayouts: [c.group0, c.group1, c.group2B]
      }),
      vertex: { entryPoint: "draw_density_map_vs", module: u },
      fragment: {
        entryPoint: "draw_density_map_fs",
        module: u,
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
  return t.derive(
    [
      a,
      n.group0,
      n.group1,
      n.group2B,
      i.colorTexture,
      i.alphaTexture
    ],
    (l, u, c, f, d, p) => (g) => {
      let m = g.beginRenderPass({
        colorAttachments: [
          { loadOp: "load", storeOp: "store", view: d.createView() },
          { loadOp: "load", storeOp: "store", view: p.createView() }
        ]
      });
      m.setPipeline(l), m.setBindGroup(0, u), m.setBindGroup(1, c), m.setBindGroup(2, f), m.draw(4), m.end();
    }
  );
}
function iE(t, e, r, n, i, a) {
  const l = t.derive(
    [e, r, n.layouts],
    (u, c, f) => u.createRenderPipeline({
      layout: u.createPipelineLayout({ bindGroupLayouts: [f.group0, f.group1] }),
      vertex: { entryPoint: "points_vs", module: c },
      fragment: {
        entryPoint: "points_fs",
        module: c,
        targets: [
          {
            format: a.colorTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          },
          {
            format: a.alphaTextureFormat,
            blend: { color: { srcFactor: "one", dstFactor: "one" }, alpha: { srcFactor: "one", dstFactor: "one" } }
          }
        ]
      },
      primitive: { topology: "triangle-strip" }
    })
  );
  return t.derive(
    [
      l,
      n.group0,
      n.group1,
      i.count,
      a.colorTexture,
      a.alphaTexture
    ],
    (u, c, f, d, p, g) => (m) => {
      let y = m.beginRenderPass({
        colorAttachments: [
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: p.createView() },
          { clearValue: [0, 0, 0, 0], loadOp: "clear", storeOp: "store", view: g.createView() }
        ]
      });
      y.setPipeline(u), y.setBindGroup(0, c), y.setBindGroup(1, f), d > 0 && y.draw(4, d), y.end();
    }
  );
}
function aE(t, e, r, n, i) {
  const a = t.derive(
    [e, r, i.layouts],
    (l, u, c) => l.createRenderPipeline({
      layout: l.createPipelineLayout({
        bindGroupLayouts: [c.group0, c.group1, c.group2B, c.group3]
      }),
      vertex: { entryPoint: "gamma_correction_vs", module: u },
      fragment: { entryPoint: "gamma_correction_fs", module: u, targets: [{ format: n }] },
      primitive: { topology: "triangle-strip" }
    })
  );
  return t.derive(
    [a, i.group0, i.group1, i.group2B, i.group3],
    (l, u, c, f, d) => (p, g) => {
      let m = p.beginRenderPass({
        colorAttachments: [{ clearValue: [1, 1, 1, 1], loadOp: "clear", storeOp: "store", view: g }]
      });
      m.setPipeline(l), m.setBindGroup(0, u), m.setBindGroup(1, c), m.setBindGroup(2, f), m.setBindGroup(3, d), m.draw(4), m.end();
    }
  );
}
const vb = 64;
function uk(t, e, r, n, i, a, l) {
  let u = t.derive(
    [e, r, n.layouts],
    (f, d, p) => f.createComputePipeline({
      layout: f.createPipelineLayout({
        bindGroupLayouts: [p.group0, p.group1, p.group2B, p.group3]
      }),
      compute: { module: d, entryPoint: "gaussian_blur_stage_1" }
    })
  ), c = t.derive(
    [e, r, n.layouts],
    (f, d, p) => f.createComputePipeline({
      layout: f.createPipelineLayout({
        bindGroupLayouts: [p.group0, p.group1, p.group2B, p.group3]
      }),
      compute: { module: d, entryPoint: "gaussian_blur_stage_2" }
    })
  );
  return t.derive(
    [
      u,
      c,
      n.group0,
      n.group1,
      n.group2B,
      n.group3,
      i,
      a,
      l
    ],
    (f, d, p, g, m, y, w, x, k) => (S) => {
      let _ = S.beginComputePass();
      _.setBindGroup(0, p), _.setBindGroup(1, g), _.setBindGroup(2, m), _.setBindGroup(3, y), _.setPipeline(f), _.dispatchWorkgroups(Math.ceil(w / vb), k), _.setPipeline(d), _.dispatchWorkgroups(Math.ceil(x / vb), k), _.end();
    }
  );
}
function lE(t, e = !1) {
  const r = new Float64Array(5), n = new Float64Array(4);
  sE(r, n, t);
  const i = Float64Array.of(
    0,
    n[1] - r[1] * n[0],
    n[2] - r[2] * n[0],
    n[3] - r[3] * n[0],
    -r[4] * n[0]
  ), a = 1 + r[1] + r[2] + r[3] + r[4], l = (n[0] + n[1] + n[2] + n[3]) / a, u = (i[1] + i[2] + i[3] + i[4]) / a;
  return {
    sigma: t,
    negative: e,
    a: r,
    b_causal: n,
    b_anticausal: i,
    sum_causal: l,
    sum_anticausal: u
  };
}
function sE(t, e, r) {
  const n = Float64Array.of(
    0.84,
    1.8675,
    0.84,
    -1.8675,
    -0.34015,
    -0.1299,
    -0.34015,
    0.1299
  ), i = Math.exp(-1.783 / r), a = Math.exp(-1.723 / r), l = 0.6318 / r, u = 1.997 / r, c = Float64Array.of(
    -i * Math.cos(l),
    i * Math.sin(l),
    -i * Math.cos(-l),
    i * Math.sin(-l),
    -a * Math.cos(u),
    a * Math.sin(u),
    -a * Math.cos(-u),
    a * Math.sin(-u)
  ), f = r * 2.5066282746310007, d = Float64Array.of(n[0], n[1], 0, 0, 0, 0, 0, 0), p = Float64Array.of(1, 0, c[0], c[1], 0, 0, 0, 0, 0, 0);
  let g, m;
  for (m = 2; m < 8; m += 2) {
    for (d[m] = c[m] * d[m - 2] - c[m + 1] * d[m - 1], d[m + 1] = c[m] * d[m - 1] + c[m + 1] * d[m - 2], g = m - 2; g > 0; g -= 2)
      d[g] += c[m] * d[g - 2] - c[m + 1] * d[g - 1], d[g + 1] += c[m] * d[g - 1] + c[m + 1] * d[g - 2];
    for (g = 0; g <= m; g += 2)
      d[g] += n[m] * p[g] - n[m + 1] * p[g + 1], d[g + 1] += n[m] * p[g + 1] + n[m + 1] * p[g];
    for (p[m + 2] = c[m] * p[m] - c[m + 1] * p[m + 1], p[m + 3] = c[m] * p[m + 1] + c[m + 1] * p[m], g = m; g > 0; g -= 2)
      p[g] += c[m] * p[g - 2] - c[m + 1] * p[g - 1], p[g + 1] += c[m] * p[g - 1] + c[m + 1] * p[g - 2];
  }
  for (m = 0; m < 4; ++m)
    g = m << 1, e[m] = d[g] / f, t[m + 1] = p[g + 2];
}
function ck(t) {
  let e = lE(t);
  return {
    kde_causal: [e.b_causal[0], e.b_causal[1], e.b_causal[2], e.b_causal[3]],
    kde_anticausal: [e.b_anticausal[1], e.b_anticausal[2], e.b_anticausal[3], e.b_anticausal[4]],
    kde_a: [e.a[1], e.a[2], e.a[3], e.a[4]]
  };
}
const uE = `// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

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
class cE {
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
  constructor(e, r, n, i, a) {
    this.context = e, this.props = {
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
      width: i,
      height: a
    }, this.viewport = new fd({ x: 0, y: 0, scale: 1 }, i, a), this.df = new Dl();
    let l = this.df;
    this.renderInputs = {
      mode: l.value(this.props.mode),
      colorScheme: l.value(this.props.colorScheme),
      xData: l.value(this.props.x),
      yData: l.value(this.props.y),
      categoryData: l.value(this.props.category),
      categoryCount: l.value(this.props.categoryCount),
      categoryColors: l.value(this.props.categoryColors),
      matrix: l.value(tk()),
      width: l.value(i),
      height: l.value(a),
      pointSize: l.value(this.props.pointSize),
      densityBandwidth: l.value(this.props.densityBandwidth)
    }, this.device = l.value(r), this.dataBuffers = fE(l, this.device, this.renderInputs), this.module = l.derive([this.device], (u) => u.createShaderModule({ code: uE })), this.uniforms = rE(l, this.device), this.renderer = dE(
      l,
      this.device,
      this.module,
      this.uniforms,
      n,
      this.renderInputs,
      this.dataBuffers
    );
  }
  setProps(e) {
    let r = !1, n;
    for (n in e)
      e[n] !== this.props[n] && (this.props[n] = e[n], r = !0);
    return this.viewport.update(
      { x: this.props.viewportX, y: this.props.viewportY, scale: this.props.viewportScale },
      this.props.width,
      this.props.height
    ), this.renderInputs.mode.value = this.props.mode, this.renderInputs.colorScheme.value = this.props.colorScheme, this.renderInputs.xData.value = this.props.x, this.renderInputs.yData.value = this.props.y, this.renderInputs.categoryData.value = this.props.category, this.renderInputs.categoryColors.value = this.props.categoryColors, this.props.category != null ? this.renderInputs.categoryCount.value = this.props.categoryCount : this.renderInputs.categoryCount.value = 1, this.renderInputs.matrix.value = this.viewport.matrix(), this.renderInputs.width.value = this.props.width, this.renderInputs.height.value = this.props.height, this.renderInputs.pointSize.value = this.props.pointSize, this.renderInputs.densityBandwidth.value = this.props.densityBandwidth, r;
  }
  render() {
    this.renderer.value(this.props, this.context.getCurrentTexture().createView());
  }
  destroy() {
    this.df.destroy();
  }
  async densityMap(e, r, n, i) {
    let a = this.df.subgraph(), { x: l, y: u, scale: c } = i, f = [c, 0, 0, 0, c, 0, -l * c, -u * c, 1], d = nk(f), p = await hE(
      a,
      this.device,
      this.module,
      this.uniforms,
      a.value(e),
      a.value(r),
      a.value(n),
      a.value(f),
      this.dataBuffers
    ).value();
    return a.destroy(), {
      data: p,
      width: e,
      height: r,
      coordinateAtPixel: (g, m) => {
        let y = g / e * 2 - 1, w = m / r * 2 - 1, x = rk([y, w, 1], d);
        return { x: x[0], y: x[1] };
      }
    };
  }
}
function fE(t, e, r) {
  let n = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  const i = t.derive([r.xData], (d) => d.length), a = t.derive([i], (d) => d * 4), l = i, u = t.statefulDerive(
    [e, t.statefulDerive([e, a, n], ws), r.xData],
    Rp
  ), c = t.statefulDerive(
    [e, t.statefulDerive([e, a, n], ws), r.yData],
    Rp
  ), f = t.statefulDerive(
    [e, t.statefulDerive([e, l, n], ws), r.categoryData],
    Rp
  );
  return { x: u, y: c, category: f, count: i };
}
function fk(t, e, r, n, i, a, l) {
  let u = "rgba16float", c = "r16float", f = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING, d = t.statefulDerive(
    [e, r, n, u, f],
    j1
  ), p = t.statefulDerive(
    [e, r, n, c, f],
    j1
  ), g = t.derive(
    [i, a, l],
    (x, k, S) => x * k * S * 4
    // w * h * categoryCount * sizeof(uint32)
  ), m = t.derive(
    [i, a, l],
    (x, k, S) => x * k * S * 2
    // w * h * categoryCount * sizeof(f16)
  ), y = t.statefulDerive(
    [e, g, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC],
    ws
  ), w = t.statefulDerive([e, m, GPUBufferUsage.STORAGE], ws);
  return {
    colorTexture: d,
    alphaTexture: p,
    colorTextureFormat: u,
    alphaTextureFormat: c,
    countBuffer: y,
    blurBuffer: w
  };
}
function dE(t, e, r, n, i, a, l) {
  let u = t.derive([a.densityBandwidth], (C) => Math.ceil(C * 3) + 1), c = t.derive([a.width, u], (C, R) => C + R * 2), f = t.derive([a.height, u], (C, R) => C + R * 2), d = t.derive([c], (C) => Math.ceil(C / 4)), p = t.derive([f], (C) => Math.ceil(C / 4)), g = fk(
    t,
    e,
    c,
    f,
    d,
    p,
    a.categoryCount
  ), m = sk(t, e, n.buffer, l, g), y = lk(t, e, r, m, l, g), w = iE(t, e, r, m, l, g), x = oE(t, e, r, m, g), k = aE(t, e, r, i, m), S = uk(t, e, r, m, c, f, a.categoryCount), _ = t.derive(
    [a.densityBandwidth, c, d],
    (C, R, A) => ck(C / R * A)
  ), E = t.derive(
    [a.categoryColors, a.categoryCount],
    (C, R) => (C == null && (C = Gs(R)), C.map((A) => dg(A)))
  );
  return t.derive(
    [
      e,
      c,
      f,
      d,
      p,
      n.update,
      l.count,
      a.matrix,
      E,
      w,
      k,
      y,
      S,
      x,
      _
    ],
    (C, R, A, N, L, j, B, P, q, H, X, V, G, Z, Y) => (I, K) => {
      let ie = I.colorScheme == "light" ? [1, 1, 1, 1] : [0, 0, 0, 1], se = I.width / R, ye = I.height / A, _e = hg([se, 0, 0, 0, ye, 0, 0, 0, 1], P);
      j({
        count: B,
        category_count: I.categoryCount,
        framebuffer_width: R,
        framebuffer_height: A,
        density_width: N,
        density_height: L,
        gamma: I.gamma,
        point_size: Math.max(I.mode == "points" ? 3 : 1, I.pointSize),
        point_alpha: I.pointAlpha,
        points_alpha: I.pointsAlpha,
        density_scaler: I.densityScaler / 16,
        quantization_step: I.densityQuantizationStep,
        density_alpha: I.densityAlpha,
        contours_alpha: I.contoursAlpha,
        matrix: _e,
        view_xy_scaler: [1 / se, 1 / ye],
        kde_causal: Y.kde_causal,
        kde_anticausal: Y.kde_anticausal,
        kde_a: Y.kde_a,
        background_color: ie,
        category_colors: q
      });
      let be = C.createCommandEncoder();
      H(be), I.mode == "density" && (I.densityAlpha > 0 || I.contoursAlpha > 0) && (V(be), G(be), Z(be)), X(be, K), C.queue.submit([be.finish()]);
    }
  );
}
function hE(t, e, r, n, i, a, l, u, c) {
  let f = fk(t, e, i, a, i, a, t.value(1)), d = sk(t, e, n.buffer, c, f), p = lk(t, e, r, d, c, f), g = uk(t, e, r, d, i, a, t.value(1));
  return t.derive(
    [
      e,
      i,
      a,
      c.count,
      n.update,
      l,
      u,
      p,
      g,
      f.countBuffer
    ],
    (m, y, w, x, k, S, _, E, C, R) => () => {
      let A = m.createCommandEncoder(), N = ck(S);
      k({
        count: x,
        category_count: 1,
        framebuffer_width: y,
        framebuffer_height: w,
        density_width: y,
        density_height: w,
        gamma: 1,
        point_size: 0,
        point_alpha: 0,
        points_alpha: 0,
        density_scaler: 0,
        quantization_step: 0,
        density_alpha: 0,
        contours_alpha: 0,
        matrix: _,
        view_xy_scaler: [1, 1],
        kde_causal: N.kde_causal,
        kde_anticausal: N.kde_anticausal,
        kde_a: N.kde_a,
        background_color: [0, 0, 0, 0],
        category_colors: []
      }), E(A), C(A);
      let L = m.createBuffer({
        size: y * w * 2,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
      });
      return A.copyBufferToBuffer(R, 0, L, 0, y * w * 2), m.queue.submit([A.finish()]), L.mapAsync(GPUMapMode.READ, 0, y * w * 2).then(() => pE(L.getMappedRange()));
    }
  );
}
function pE(t) {
  let e = new Uint16Array(t), r = new Uint32Array(e.length);
  for (let n = 0; n < e.length; n++) {
    let i = e[n] & 32767, a = e[n] & 32768, l = e[n] & 31744;
    i <<= 13, a <<= 16, i += 939524096, i = l == 0 ? 0 : i, i |= a, r[n] = i;
  }
  return new Float32Array(r.buffer);
}
function vE(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var gb = { exports: {} }, mb;
function gE() {
  return mb || (mb = 1, function(t) {
    (function() {
      function e(u, c) {
        var f = u.x - c.x, d = u.y - c.y;
        return f * f + d * d;
      }
      function r(u, c, f) {
        var d = c.x, p = c.y, g = f.x - d, m = f.y - p;
        if (g !== 0 || m !== 0) {
          var y = ((u.x - d) * g + (u.y - p) * m) / (g * g + m * m);
          y > 1 ? (d = f.x, p = f.y) : y > 0 && (d += g * y, p += m * y);
        }
        return g = u.x - d, m = u.y - p, g * g + m * m;
      }
      function n(u, c) {
        for (var f = u[0], d = [f], p, g = 1, m = u.length; g < m; g++)
          p = u[g], e(p, f) > c && (d.push(p), f = p);
        return f !== p && d.push(p), d;
      }
      function i(u, c, f, d, p) {
        for (var g = d, m, y = c + 1; y < f; y++) {
          var w = r(u[y], u[c], u[f]);
          w > g && (m = y, g = w);
        }
        g > d && (m - c > 1 && i(u, c, m, d, p), p.push(u[m]), f - m > 1 && i(u, m, f, d, p));
      }
      function a(u, c) {
        var f = u.length - 1, d = [u[0]];
        return i(u, 0, f, c, d), d.push(u[f]), d;
      }
      function l(u, c, f) {
        if (u.length <= 2) return u;
        var d = c !== void 0 ? c * c : 1;
        return u = f ? u : n(u, d), u = a(u, d), u;
      }
      t.exports = l, t.exports.default = l;
    })();
  }(gb)), gb.exports;
}
var mE = gE();
const yb = /* @__PURE__ */ vE(mE);
function yE(t, e) {
  let r = t.slice();
  for (let n = 0; n < e; n++) {
    const i = [], a = r.length;
    for (let l = 0; l < a; l++) {
      const u = r[l], c = r[(l + 1) % a], f = {
        x: 0.75 * u.x + 0.25 * c.x,
        y: 0.75 * u.y + 0.25 * c.y
      }, d = {
        x: 0.25 * u.x + 0.75 * c.x,
        y: 0.25 * u.y + 0.75 * c.y
      };
      i.push(f, d);
    }
    r = i;
  }
  return r;
}
function bE(t, e) {
  const r = yE(t, 5), n = Y2(r);
  let i = Math.max(n.xMax - n.xMin, n.yMax - n.yMin) / 100, a = yb(r, i), l = 0;
  for (; a.length > e && l < 20; )
    i *= 1.1, l += 1, a = yb(r, i);
  return a;
}
const bb = {
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
function xE(t, e) {
  return t == null ? bb[e] : { ...bb[e], ...t, ...t[e] != null ? t[e] : {} };
}
let Pp = null, q0 = /* @__PURE__ */ new Map();
function wE() {
  return Pp == null && (Pp = new Promise((t, e) => {
    let r = new Worker(new URL("./clustering.worker.js", import.meta.url), { type: "module" });
    r.onmessage = (n) => {
      if (n.data.ready) {
        t(r);
        return;
      }
      if (n.data.id != null) {
        let i = q0.get(n.data.id);
        i != null && (q0.delete(n.data.id), i(n.data));
      }
    };
  })), Pp;
}
function dk(t, e, r = []) {
  return new Promise((n, i) => {
    wE().then((a) => {
      let l = (/* @__PURE__ */ new Date()).getTime().toString() + "-" + Math.random().toString();
      q0.set(l, (u) => {
        n(u.payload);
      }), a.postMessage({ id: l, name: t, payload: e }, r);
    });
  });
}
let kE = (t, e, r, n) => dk("findClusters", { density_map: t, width: e, height: r, options: n }, [t.buffer]), _E = (t, e) => dk("dynamicLabelPlacement", { labels: t, options: e });
function SE(t, e, r, n, i, a) {
  let l = Math.max(n, i) / a, u = t / (r * r) / (l * l), c = 1 / (u / (a * a)) * 0.2, f = Math.sqrt(t / e / (l * l)), d = Math.log(f), p = Math.log(r), g = (Math.min(Math.max((p - d) * 2, -1), 1) + 1) / 2, m = 0.25 / Math.sqrt(u), y = Math.max(0.2, Math.min(5, m)) * a, w = 1 - g, x = 0.5 + g * 0.5;
  return {
    densityScaler: c,
    densityAlpha: w,
    contoursAlpha: w,
    pointSize: y,
    pointAlpha: 0.7,
    pointsAlpha: x,
    densityBandwidth: 20
  };
}
var ME = /* @__PURE__ */ Fa("<div></div>"), CE = /* @__PURE__ */ Hi("<circle></circle>"), RE = /* @__PURE__ */ Hi("<circle></circle>"), AE = /* @__PURE__ */ Hi('<text dominant-baseline="middle"> </text>'), EE = /* @__PURE__ */ Hi("<g></g>"), TE = /* @__PURE__ */ Hi("<g><!></g>"), $E = /* @__PURE__ */ Hi("<g></g>"), FE = /* @__PURE__ */ Fa('<div><canvas></canvas> <div><!></div> <svg role="none"><!><!><!><!></svg> <!> <!></div>');
function NE(t, e) {
  zl(e, !0);
  let r = Ge(e, "data", 19, () => ({ x: new Float32Array(), y: new Float32Array(), category: null })), n = Ge(e, "categoryCount", 3, 1), i = Ge(e, "categoryColors", 3, null), a = Ge(e, "width", 3, 800), l = Ge(e, "height", 3, 800), u = Ge(e, "pixelRatio", 3, 2), c = Ge(e, "colorScheme", 3, "light"), f = Ge(e, "theme", 3, null), d = Ge(e, "mode", 3, "density"), p = Ge(e, "minimumDensity", 3, 1 / 16), g = Ge(e, "totalCount", 3, null), m = Ge(e, "maxDensity", 3, null), y = Ge(e, "automaticLabels", 3, !1), w = Ge(e, "queryClusterLabels", 3, null), x = Ge(e, "tooltip", 7, null), k = Ge(e, "selection", 7, null), S = Ge(e, "querySelection", 3, null), _ = Ge(e, "rangeSelection", 7, null), E = Ge(e, "defaultViewportState", 3, null), C = Ge(e, "viewportState", 7, null), R = Ge(e, "customTooltip", 3, null), A = Ge(e, "customOverlay", 3, null), N = Ge(e, "onViewportState", 3, null), L = Ge(e, "onTooltip", 3, null), j = Ge(e, "onSelection", 3, null), B = Ge(e, "onRangeSelection", 3, null), P = /* @__PURE__ */ He(() => xE(f(), c())), q = /* @__PURE__ */ He(() => i() ?? Gs(n())), H = /* @__PURE__ */ He(() => C() ?? E() ?? { x: 0, y: 0, scale: 1 }), X = /* @__PURE__ */ He(() => new fd(O(H), a(), l())), V = /* @__PURE__ */ He(() => O(X).pixelLocationFunction()), G = /* @__PURE__ */ He(() => O(X).coordinateAtPixelFunction());
  function Z(pe, Fe) {
    return pe.x == Fe.x && pe.y == Fe.y && pe.category == Fe.category && pe.text == Fe.text;
  }
  let Y = /* @__PURE__ */ He(() => k()?.length == 1 && x() != null && Z(k()[0], x()));
  function I(pe) {
    pa(C(), pe) || (C(pe), N()?.(pe));
  }
  function K(pe) {
    pa(x(), pe) || (x(pe), L()?.(pe));
  }
  function ie(pe) {
    pa(k(), pe) || (k(pe), j()?.(pe));
  }
  function se(pe) {
    pa(_(), pe) || (_(pe), B()?.(pe));
  }
  let ye = /* @__PURE__ */ pr(Ja([])), _e = /* @__PURE__ */ pr(null), be = /* @__PURE__ */ pr("none"), ue = /* @__PURE__ */ He(() => a() * u()), Ae = /* @__PURE__ */ He(() => l() * u()), ze = /* @__PURE__ */ pr(null), Me = /* @__PURE__ */ pr(null), xe = /* @__PURE__ */ pr(null), ke = /* @__PURE__ */ He(() => SE(m() ?? (g() ?? r().x.length) / 4, p(), O(H).scale, O(ue), O(Ae), u())), Le = /* @__PURE__ */ He(() => O(ke).pointSize), Ie = !0;
  sd(() => {
    O(Me)?.setProps({
      mode: d(),
      colorScheme: c(),
      viewportX: O(H).x,
      viewportY: O(H).y,
      viewportScale: O(H).scale,
      width: O(ue),
      height: O(Ae),
      x: r().x,
      y: r().y,
      category: r().category,
      categoryCount: n(),
      categoryColors: O(q),
      ...O(ke)
    }) && (ht(), y() !== !1 && Ie && O(Me) != null && r().x != null && r().x.length > 0 && E() != null && (Ie = !1, vr(E())));
  });
  function je() {
    et = null, !(!O(ze) || !O(Me)) && (O(ze).width = O(Me).props.width, O(ze).height = O(Me).props.height, O(ze).style.width = `${O(Me).props.width / u()}px`, O(ze).style.height = `${O(Me).props.height / u()}px`, O(Me).render());
  }
  let et = null;
  function ht() {
    et == null && (et = requestAnimationFrame(je));
  }
  function xt(pe) {
    let Fe;
    function Ne() {
      Fe = pe.getContext("webgl2", { antialias: !1 }), Fe.getExtension("EXT_color_buffer_float"), Fe.getExtension("EXT_float_blend"), Fe.getExtension("OES_texture_float_linear"), ot(Me, new YA(Fe, O(ue), O(Ae)), !0);
    }
    Ne(), pe.addEventListener("webglcontextlost", () => {
      O(Me)?.destroy(), ot(Me, null), Fe = null;
    }), pe.addEventListener("webglcontextrestored", () => {
      Ne();
    });
  }
  function wt(pe) {
    async function Fe() {
      let Ne = pe.getContext("webgpu");
      if (Ne == null) {
        console.error("Could not get WebGPU canvas context");
        return;
      }
      let Oe = await navigator.gpu.requestAdapter();
      if (!Oe) {
        console.error("Could not request WebGPU adapter");
        return;
      }
      let De = 512 * 1048576, st = 512 * 1048576;
      De = Math.min(De, Oe.limits.maxBufferSize), st = Math.min(st, Oe.limits.maxStorageBufferBindingSize);
      let kt = {
        requiredLimits: { maxBufferSize: De, maxStorageBufferBindingSize: st },
        requiredFeatures: ["shader-f16"]
      }, fe = await Oe.requestDevice(kt);
      fe.lost.then((Re) => {
        console.info(`WebGPU device was lost: ${Re.message}`), Re.reason != "destroyed" && (O(Me)?.destroy(), ot(Me, null), Fe());
      });
      let me = navigator.gpu.getPreferredCanvasFormat();
      Ne.configure({ device: fe, format: me, alphaMode: "premultiplied" }), ot(Me, new cE(Ne, fe, me, O(ue), O(Ae)), !0);
    }
    Fe();
  }
  function Xe(pe) {
    pe != null && C() == null && I(pe);
  }
  sd(() => Xe(E())), ug(() => {
    O(ze) != null && (t2() ? wt(O(ze)) : (xt(O(ze)), ot(xe, "WebGPU is unavailable. If you are using Safari, please enable the WebGPU feature flag.")));
  }), TR(() => {
    O(Me)?.destroy(), ot(Me, null);
  });
  function it(pe, Fe) {
    let { x: Ne, y: Oe, scale: De } = O(H);
    K(null);
    let st = Math.min(100, Math.max(0.01, De * pe)), kt = O(ze).getBoundingClientRect(), fe = Math.max(kt.width, kt.height), me = (Fe.x - kt.width / 2) / fe * 2, Re = (kt.height / 2 - Fe.y) / fe * 2, ct = Ne + me / De - me / st, ft = Oe + Re / De - Re / st;
    I({ x: ct, y: ft, scale: st });
  }
  function Ht(pe, Fe) {
    K(null);
    let Ne = "pan";
    switch (O(be) != "none" ? Fe.shift || (Ne = O(be)) : Fe.shift && (Ne = Fe.meta ? "lasso" : "marquee"), Ne) {
      case "marquee":
        return {
          move: (Oe) => {
            if (K(null), O(Me) == null)
              return;
            let De = O(G)(pe.x, pe.y), st = O(G)(Oe.x, Oe.y);
            se({
              xMin: Math.min(De.x, st.x),
              yMin: Math.min(De.y, st.y),
              xMax: Math.max(De.x, st.x),
              yMax: Math.max(De.y, st.y)
            });
          }
        };
      case "lasso": {
        let Oe = [O(G)(pe.x, pe.y)];
        return {
          move: (De) => {
            K(null), O(Me) != null && (Oe = [...Oe, O(G)(De.x, De.y)], Oe.length >= 3 && se(bE(Oe, 24)));
          }
        };
      }
      case "pan": {
        let Oe = O(G)(0, 0), De = O(G)(1, 1), st = Oe.x - De.x, kt = Oe.y - De.y, fe = O(H).x, me = O(H).y;
        return {
          move: (Re) => {
            I({
              x: fe + (Re.x - pe.x) * st,
              y: me + (Re.y - pe.y) * kt,
              scale: O(H).scale
            });
          }
        };
      }
    }
  }
  async function nt(pe, Fe) {
    if (_() != null)
      se(null);
    else {
      const Ne = await qt(pe);
      if (Ne == null)
        ie([]), K(null);
      else if (Fe.shift || Fe.ctrl || Fe.meta) {
        let Oe = k()?.findIndex((De) => De.x == Ne.x && De.y == Ne.y && De.category == Ne.category);
        k() == null || Oe == null || Oe < 0 ? (ie([...k() ?? [], Ne]), K(Ne)) : (ie([
          ...k().slice(0, Oe),
          ...k().slice(Oe + 1)
        ]), K(null));
      } else
        ie([Ne]), K(Ne);
    }
  }
  async function dr(pe) {
    if (k() != null && k().length == 1) {
      let Fe = O(V)(k()[0].x, k()[0].y);
      pe != null && VR(pe, Fe) < 10 && K(k()[0]);
    } else
      K(await qt(pe));
  }
  async function qt(pe) {
    if (O(Me) == null || pe == null || S() == null)
      return null;
    let { x: Fe, y: Ne } = O(G)(pe.x, pe.y), Oe = Math.abs(O(G)(pe.x + 1, pe.y).x - Fe);
    return await S()(Fe, Ne, Oe);
  }
  function Cr() {
    return x() != null;
  }
  let sr = /* @__PURE__ */ He(() => O(ze) ? HR(O(ze), {
    zoom: it,
    drag: Ht,
    hover: WR(dr, Cr),
    click: nt
  }) : null);
  async function zt(pe, Fe, Ne) {
    let Oe = await pe.densityMap(1e3, 1e3, Fe, Ne), De = await kE(Oe.data, Oe.width, Oe.height, { union_threshold: Fe }), st = [];
    for (let fe = 0; fe < De.length; fe++) {
      let me = De[fe], Re = Oe.coordinateAtPixel(me.mean_x, me.mean_y), ct = me.boundary_rect_approximation.map(([ft, Bt, Tt, Ve]) => {
        let Ct = Oe.coordinateAtPixel(ft, Bt), ur = Oe.coordinateAtPixel(Tt, Ve);
        return {
          xMin: Math.min(Ct.x, ur.x),
          xMax: Math.max(Ct.x, ur.x),
          yMin: Math.min(Ct.y, ur.y),
          yMax: Math.max(Ct.y, ur.y)
        };
      });
      st.push({
        x: Re.x,
        y: Re.y,
        sum_density: me.sum_density,
        rects: ct,
        bandwidth: Fe
      });
    }
    let kt = st.reduce((fe, me) => Math.max(fe, me.sum_density), 0) * 5e-3;
    return st.filter((fe) => fe.sum_density > kt);
  }
  async function Ot(pe) {
    if (O(Me) == null)
      return [];
    let Fe = await XR({ generateLabels: pe });
    if (typeof y() == "object" && y().cache) {
      let De = await y().cache.get(Fe);
      if (De != null)
        return De;
    }
    ot(_e, "Generating clusters...");
    let Ne = await zt(O(Me), 10, pe);
    if (Ne = Ne.concat(await zt(O(Me), 5, pe)), ot(_e, "Generating labels (initializing)..."), w())
      for (let De = 0; De < Ne.length; De++) {
        let st = await w()(Ne[De].rects);
        Ne[De].label = st, ot(_e, `Generating labels (${((De + 1) / Ne.length * 100).toFixed(0)}%)...`);
      }
    let Oe = Ne.filter((De) => De.label != null).map((De) => ({
      text: De.label,
      x: De.x,
      y: De.y,
      priority: De.sum_density,
      level: De.bandwidth == 10 ? 0 : 1
    }));
    return typeof y() == "object" && y().cache && await y().cache.set(Fe, Oe), Oe;
  }
  async function vr(pe) {
    if (O(Me) == null)
      return;
    let Fe = new fd(pe, a(), l()), Ne = await Ot(pe), Oe = pe.scale, De = pe.scale / 2, st = De * 4, kt = Ne.map((me) => {
      let Re = Fe.pixelLocation(me.x, me.y), ct = me.level == 0 ? 14 : 12, ft = kA({
        text: me.text,
        fontSize: ct,
        fontFamily: O(P).fontFamily
      });
      ft.width += 4, ft.height += 4;
      let Bt = Oe / st;
      return {
        text: me.text,
        fontSize: ct,
        bounds: {
          xMin: Re.x - ft.width / 2,
          xMax: Re.x + ft.width / 2,
          yMin: Re.y - ft.height / 2,
          yMax: Re.y + ft.height / 2
        },
        locationAtZero: Re,
        priority: me.priority,
        minScale: me.level == 0 ? Bt / 1.2 : null,
        maxScale: me.level == 0 ? null : Bt,
        coordinate: { x: me.x, y: me.y },
        placement: null
      };
    }), fe = await _E(kt, { globalMaxScale: Oe / De });
    for (let me = 0; me < fe.length; me++) {
      let Re = fe[me];
      if (Re != null) {
        let ct = Oe / Re.minScale, ft = Oe / Re.maxScale;
        kt[me].placement = { minScale: ft, maxScale: ct };
      }
    }
    ot(ye, kt, !0), ot(_e, null);
  }
  class xn {
    content;
    constructor(Fe, Ne) {
      let Oe = document.createElement("div");
      this.content = Oe, this.update(Ne), Fe.appendChild(Oe);
    }
    update(Fe) {
      let Ne = this.content;
      Ne.style.fontFamily = Fe.fontFamily, c() == "light" ? (Ne.style.color = "#000", Ne.style.background = "#fff", Ne.style.border = "1px solid #000") : (Ne.style.color = "#ccc", Ne.style.background = "#000", Ne.style.border = "1px solid #ccc"), Ne.style.borderRadius = "2px", Ne.style.padding = "5px", Ne.style.fontSize = "12px", Ne.style.maxWidth = "300px", Ne.innerText = Fe.tooltip.text ?? JSON.stringify(Fe.tooltip);
    }
  }
  var wn = FE();
  let Ki;
  var yi = Vr(wn);
  Dt(yi, "", {}, { position: "absolute", top: "0", left: "0" }), D0(yi, (pe) => ot(ze, pe), () => O(ze));
  var Ro = mr(yi, 2);
  let Zi;
  var Oa = Vr(Ro);
  {
    var Qi = (pe) => {
      var Fe = ku();
      const Ne = /* @__PURE__ */ He(() => K2(A())), Oe = /* @__PURE__ */ He(() => ({
        location: O(V),
        width: a(),
        height: l()
      }));
      var De = gs(Fe);
      $R(De, () => O(Ne), (st) => {
        var kt = ME();
        OR(kt, (fe, me) => O(Ne)?.(fe, me), () => Z2(A(), { proxy: O(Oe) })), kr(st, kt);
      }), kr(pe, Fe);
    };
    Rn(Oa, (pe) => {
      A() && pe(Qi);
    });
  }
  Br(Ro);
  var un = mr(Ro, 2);
  un.__mousedown = function(...pe) {
    O(sr)?.mousedown?.apply(this, pe);
  }, un.__mousemove = function(...pe) {
    O(sr)?.mousemove?.apply(this, pe);
  }, Dt(un, "", {}, { position: "absolute", left: "0", top: "0" });
  var Ji = Vr(un);
  {
    var Ba = (pe) => {
      var Fe = ku();
      const Ne = /* @__PURE__ */ He(() => {
        const { x: kt, y: fe } = O(V)(x().x, x().y);
        return { x: kt, y: fe };
      }), Oe = /* @__PURE__ */ He(() => Math.max(3, O(Le) / u()) + 1);
      var De = gs(Fe);
      {
        var st = (kt) => {
          var fe = CE();
          let me;
          Kn(
            (Re) => {
              Pe(fe, "cx", O(Ne).x), Pe(fe, "cy", O(Ne).y), Pe(fe, "r", O(Oe)), me = Dt(fe, "", me, Re);
            },
            [
              () => ({
                stroke: c() == "light" ? "#000" : "#fff",
                "stroke-width": 1,
                fill: "none"
              })
            ]
          ), kr(kt, fe);
        };
        Rn(De, (kt) => {
          isFinite(O(Ne).x) && isFinite(O(Ne).y) && isFinite(O(Oe)) && kt(st);
        });
      }
      kr(pe, Fe);
    };
    Rn(Ji, (pe) => {
      x() != null && O(Me) != null && pe(Ba);
    });
  }
  var ea = mr(Ji);
  {
    var Hl = (pe) => {
      var Fe = ku(), Ne = gs(Fe);
      Tp(Ne, 17, k, Ep, (Oe, De) => {
        var st = ku();
        const kt = /* @__PURE__ */ He(() => {
          const { x: ft, y: Bt } = O(V)(O(De).x, O(De).y);
          return { x: ft, y: Bt };
        }), fe = /* @__PURE__ */ He(() => O(De).category != null ? O(q)[O(De).category] : O(q)[0]), me = /* @__PURE__ */ He(() => Math.max(3, O(Le) / u()) + 1);
        var Re = gs(st);
        {
          var ct = (ft) => {
            var Bt = RE();
            let Tt;
            Kn(
              (Ve) => {
                Pe(Bt, "cx", O(kt).x), Pe(Bt, "cy", O(kt).y), Pe(Bt, "r", O(me)), Tt = Dt(Bt, "", Tt, Ve);
              },
              [
                () => ({
                  stroke: c() == "light" ? "#000" : "#fff",
                  "stroke-width": 2,
                  fill: O(fe)
                })
              ]
            ), kr(ft, Bt);
          };
          Rn(Re, (ft) => {
            isFinite(O(kt).x) && isFinite(O(kt).y) && isFinite(O(me)) && ft(ct);
          });
        }
        kr(Oe, st);
      }), kr(pe, Fe);
    };
    Rn(ea, (pe) => {
      k() != null && O(Me) != null && pe(Hl);
    });
  }
  var Da = mr(ea);
  {
    var Js = (pe) => {
      var Fe = $E();
      Tp(Fe, 21, () => O(ye), Ep, (Ne, Oe) => {
        var De = TE();
        const st = /* @__PURE__ */ He(() => O(Oe).text.split(`
`)), kt = /* @__PURE__ */ He(() => O(V)(O(Oe).coordinate.x, O(Oe).coordinate.y)), fe = /* @__PURE__ */ He(() => O(Oe).placement != null && O(Oe).placement.minScale <= O(H).scale && O(H).scale <= O(Oe).placement.maxScale);
        var me = Vr(De);
        {
          var Re = (ct) => {
            var ft = EE();
            Tp(ft, 21, () => O(st), Ep, (Bt, Tt, Ve) => {
              var Ct = AE();
              Pe(Ct, "x", 0);
              let ur;
              var Nr = Vr(Ct, !0);
              Br(Ct), Kn(
                (Rr) => {
                  Pe(Ct, "y", (Ve - (O(st).length - 1) / 2) * O(Oe).fontSize), Pe(Ct, "font-size", O(Oe).fontSize), ur = Dt(Ct, "", ur, Rr), Pu(Nr, O(Tt));
                },
                [
                  () => ({
                    "paint-order": "stroke",
                    "stroke-width": "4",
                    "stroke-linejoin": "round",
                    "stroke-linecap": "round",
                    "text-anchor": "middle",
                    fill: O(P).clusterLabelColor,
                    stroke: O(P).clusterLabelOutlineColor,
                    opacity: O(P).clusterLabelOpacity,
                    "user-select": "none",
                    "-webkit-user-select": "none",
                    "font-family": O(P).fontFamily
                  })
                ]
              ), kr(Bt, Ct);
            }), Br(ft), kr(ct, ft);
          };
          Rn(me, (ct) => {
            O(fe) && ct(Re);
          });
        }
        Br(De), Kn(() => Pe(De, "transform", `translate(${O(kt).x ?? ""},${O(kt).y ?? ""})`)), kr(Ne, De);
      }), Br(Fe), kr(pe, Fe);
    };
    Rn(Da, (pe) => {
      pe(Js);
    });
  }
  var Vl = mr(Da);
  {
    var Pa = (pe) => {
      var Fe = ku(), Ne = gs(Fe);
      {
        var Oe = (st) => {
          KR(st, {
            get value() {
              return _();
            },
            get pointLocation() {
              return O(V);
            }
          });
        }, De = (st) => {
          {
            let kt = /* @__PURE__ */ He(() => O(sr)?.preventHover ?? (() => {
            }));
            UR(st, {
              get value() {
                return _();
              },
              onChange: se,
              get pointLocation() {
                return O(V);
              },
              get coordinateAtPoint() {
                return O(G);
              },
              get preventHover() {
                return O(kt);
              }
            });
          }
        };
        Rn(Ne, (st) => {
          _() instanceof Array ? st(Oe) : st(De, !1);
        });
      }
      kr(pe, Fe);
    };
    Rn(Vl, (pe) => {
      _() != null && O(Me) != null && pe(Pa);
    });
  }
  Br(un);
  var La = mr(un, 2);
  {
    var eu = (pe) => {
      const Fe = /* @__PURE__ */ He(() => O(V)(x().x, x().y));
      {
        let Ne = /* @__PURE__ */ He(() => Math.max(3, O(Le) / u())), Oe = /* @__PURE__ */ He(() => R() ?? {
          class: xn,
          props: {
            colorScheme: c(),
            fontFamily: O(P).fontFamily
          }
        });
        sA(pe, {
          get location() {
            return O(Fe);
          },
          get allowInteraction() {
            return O(Y);
          },
          get targetHeight() {
            return O(Ne);
          },
          get customTooltip() {
            return O(Oe);
          },
          get tooltip() {
            return x();
          }
        });
      }
    };
    Rn(La, (pe) => {
      x() != null && O(Me) != null && pe(eu);
    });
  }
  var Gl = mr(La, 2);
  {
    var qa = (pe) => {
      {
        let Fe = /* @__PURE__ */ He(() => O(_e) ?? O(xe)), Ne = /* @__PURE__ */ He(() => 1 / (O(V)(1, 0).x - O(V)(0, 0).x));
        iA(pe, {
          get resolvedTheme() {
            return O(P);
          },
          get statusMessage() {
            return O(Fe);
          },
          get distancePerPoint() {
            return O(Ne);
          },
          get pointCount() {
            return r().x.length;
          },
          get selectionMode() {
            return O(be);
          },
          onSelectionMode: (Oe) => ot(be, Oe, !0)
        });
      }
    };
    Rn(Gl, (pe) => {
      O(P).statusBar && pe(qa);
    });
  }
  return Br(wn), Kn(
    (pe, Fe) => {
      Ki = Dt(wn, "", Ki, pe), Zi = Dt(Ro, "", Zi, Fe), Pe(un, "width", a()), Pe(un, "height", l());
    },
    [
      () => ({
        width: `${a() ?? ""}px`,
        height: `${l() ?? ""}px`,
        position: "relative"
      }),
      () => ({
        width: `${a() ?? ""}px`,
        height: `${l() ?? ""}px`,
        position: "absolute",
        top: "0",
        left: "0"
      })
    ]
  ), Z1("wheel", un, function(...pe) {
    O(sr)?.wheel?.apply(this, pe);
  }), Z1("mouseleave", un, function(...pe) {
    O(sr)?.mouseleave?.apply(this, pe);
  }), kr(t, wn), Ol({ updateLabels: vr });
}
sg(["mousedown", "mousemove"]);
let zE = "a|about|above|after|again|against|ain|all|am|an|and|any|are|aren|aren't|as|at|be|because|been|before|being|below|between|both|but|by|can|couldn|couldn't|d|did|didn|didn't|do|does|doesn|doesn't|doing|don|don't|down|during|each|few|for|from|further|had|hadn|hadn't|has|hasn|hasn't|have|haven|haven't|having|he|he'd|he'll|her|here|hers|herself|he's|him|himself|his|how|i|i'd|if|i'll|i'm|in|into|is|isn|isn't|it|it'd|it'll|it's|its|itself|i've|just|ll|m|ma|me|mightn|mightn't|more|most|mustn|mustn't|my|myself|needn|needn't|no|nor|not|now|o|of|off|on|once|only|or|other|our|ours|ourselves|out|over|own|re|s|same|shan|shan't|she|she'd|she'll|she's|should|shouldn|shouldn't|should've|so|some|such|t|than|that|that'll|the|their|theirs|them|themselves|then|there|these|they|they'd|they'll|they're|they've|this|those|through|to|too|under|until|up|ve|very|was|wasn|wasn't|we|we'd|we'll|we're|were|weren|weren't|we've|what|when|where|which|while|who|whom|why|will|with|won|won't|wouldn|wouldn't|y|you|you'd|you'll|your|you're|yours|yourself|yourselves|you've", OE = "de|la|que|el|en|y|a|los|del|se|las|por|un|para|con|no|una|su|al|lo|como|más|pero|sus|le|ya|o|este|sí|porque|esta|entre|cuando|muy|sin|sobre|también|me|hasta|hay|donde|quien|desde|todo|nos|durante|todos|uno|les|ni|contra|otros|ese|eso|ante|ellos|e|esto|mí|antes|algunos|qué|unos|yo|otro|otras|otra|él|tanto|esa|estos|mucho|quienes|nada|muchos|cual|poco|ella|estar|estas|algunas|algo|nosotros|mi|mis|tú|te|ti|tu|tus|ellas|nosotras|vosotros|vosotras|os|mío|mía|míos|mías|tuyo|tuya|tuyos|tuyas|suyo|suya|suyos|suyas|nuestro|nuestra|nuestros|nuestras|vuestro|vuestra|vuestros|vuestras|esos|esas|estoy|estás|está|estamos|estáis|están|esté|estés|estemos|estéis|estén|estaré|estarás|estará|estaremos|estaréis|estarán|estaría|estarías|estaríamos|estaríais|estarían|estaba|estabas|estábamos|estabais|estaban|estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron|estuviera|estuvieras|estuviéramos|estuvierais|estuvieran|estuviese|estuvieses|estuviésemos|estuvieseis|estuviesen|estando|estado|estada|estados|estadas|estad|he|has|ha|hemos|habéis|han|haya|hayas|hayamos|hayáis|hayan|habré|habrás|habrá|habremos|habréis|habrán|habría|habrías|habríamos|habríais|habrían|había|habías|habíamos|habíais|habían|hube|hubiste|hubo|hubimos|hubisteis|hubieron|hubiera|hubieras|hubiéramos|hubierais|hubieran|hubiese|hubieses|hubiésemos|hubieseis|hubiesen|habiendo|habido|habida|habidos|habidas|soy|eres|es|somos|sois|son|sea|seas|seamos|seáis|sean|seré|serás|será|seremos|seréis|serán|sería|serías|seríamos|seríais|serían|era|eras|éramos|erais|eran|fui|fuiste|fue|fuimos|fuisteis|fueron|fuera|fueras|fuéramos|fuerais|fueran|fuese|fueses|fuésemos|fueseis|fuesen|sintiendo|sentido|sentida|sentidos|sentidas|siente|sentid|tengo|tienes|tiene|tenemos|tenéis|tienen|tenga|tengas|tengamos|tengáis|tengan|tendré|tendrás|tendrá|tendremos|tendréis|tendrán|tendría|tendrías|tendríamos|tendríais|tendrían|tenía|tenías|teníamos|teníais|tenían|tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron|tuviera|tuvieras|tuviéramos|tuvierais|tuvieran|tuviese|tuvieses|tuviésemos|tuvieseis|tuviesen|teniendo|tenido|tenida|tenidos|tenidas|tened", BE = "au|aux|avec|ce|ces|dans|de|des|du|elle|en|et|eux|il|ils|je|la|le|les|leur|lui|ma|mais|me|même|mes|moi|mon|ne|nos|notre|nous|on|ou|par|pas|pour|qu|que|qui|sa|se|ses|son|sur|ta|te|tes|toi|ton|tu|un|une|vos|votre|vous|c|d|j|l|à|m|n|s|t|y|été|étée|étées|étés|étant|étante|étants|étantes|suis|es|est|sommes|êtes|sont|serai|seras|sera|serons|serez|seront|serais|serait|serions|seriez|seraient|étais|était|étions|étiez|étaient|fus|fut|fûmes|fûtes|furent|sois|soit|soyons|soyez|soient|fusse|fusses|fût|fussions|fussiez|fussent|ayant|ayante|ayantes|ayants|eu|eue|eues|eus|ai|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|aurais|aurait|aurions|auriez|auraient|avais|avait|avions|aviez|avaient|eut|eûmes|eûtes|eurent|aie|aies|ait|ayons|ayez|aient|eusse|eusses|eût|eussions|eussiez|eussent", DE = "aber|alle|allem|allen|aller|alles|als|also|am|an|ander|andere|anderem|anderen|anderer|anderes|anderm|andern|anderr|anders|auch|auf|aus|bei|bin|bis|bist|da|damit|dann|der|den|des|dem|die|das|dass|daß|derselbe|derselben|denselben|desselben|demselben|dieselbe|dieselben|dasselbe|dazu|dein|deine|deinem|deinen|deiner|deines|denn|derer|dessen|dich|dir|du|dies|diese|diesem|diesen|dieser|dieses|doch|dort|durch|ein|eine|einem|einen|einer|eines|einig|einige|einigem|einigen|einiger|einiges|einmal|er|ihn|ihm|es|etwas|euer|eure|eurem|euren|eurer|eures|für|gegen|gewesen|hab|habe|haben|hat|hatte|hatten|hier|hin|hinter|ich|mich|mir|ihr|ihre|ihrem|ihren|ihrer|ihres|euch|im|in|indem|ins|ist|jede|jedem|jeden|jeder|jedes|jene|jenem|jenen|jener|jenes|jetzt|kann|kein|keine|keinem|keinen|keiner|keines|können|könnte|machen|man|manche|manchem|manchen|mancher|manches|mein|meine|meinem|meinen|meiner|meines|mit|muss|musste|nach|nicht|nichts|noch|nun|nur|ob|oder|ohne|sehr|sein|seine|seinem|seinen|seiner|seines|selbst|sich|sie|ihnen|sind|so|solche|solchem|solchen|solcher|solches|soll|sollte|sondern|sonst|über|um|und|uns|unsere|unserem|unseren|unser|unseres|unter|viel|vom|von|vor|während|war|waren|warst|was|weg|weil|weiter|welche|welchem|welchen|welcher|welches|wenn|werde|werden|wie|wieder|will|wir|wird|wirst|wo|wollen|wollte|würde|würden|zu|zum|zur|zwar|zwischen";
function PE(...t) {
  let e = [];
  for (let r of t) {
    let n = r.split("|");
    e = e.concat(n);
  }
  return e;
}
let LE = PE(zE, OE, BE, DE), qE = class {
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
  constructor(t) {
    this.coordinator = t.coordinator, this.tableName = t.table, this.xColumn = t.x, this.yColumn = t.y, this.textColumn = t.text, this.derivedTableDF = this.tableName + "_df", this.derivedTableBins = this.tableName + "_bt", this.initialized = !1, this.xBinSize = 1, this.yBinSize = 1, this.x0 = 0, this.y0 = 0;
  }
  async initialize() {
    if (this.initialized)
      return;
    let t = fa(this.xColumn), e = fa(this.yColumn), r = fa(this.textColumn), n = await this.coordinator.query(ms`
      SELECT
        MIN(${t}) AS xMin, QUANTILE_CONT(${t}, 0.99) - QUANTILE_CONT(${t}, 0.01) AS xDiff,
        MIN(${e}) AS yMin, QUANTILE_CONT(${e}, 0.99) - QUANTILE_CONT(${e}, 0.01) AS yDiff,
        COUNT(*) AS count
      FROM ${this.tableName}
    `), { xMin: i, yMin: a, xDiff: l, yDiff: u, count: c } = n.get(0);
    this.x0 = i, this.y0 = a, this.xBinSize = l / 200, this.yBinSize = u / 200;
    let f = c < 1e4 ? 1 : 5;
    await this.coordinator.exec(ms`

    `), await this.coordinator.exec(ms`
      CREATE OR REPLACE TEMP MACRO embedding_view_tokenize(s) AS
        unnest(string_split_regex(regexp_replace(lower(s), '[^a-z0-9'']', ' ', 'g'), '\\s+'));

      CREATE OR REPLACE TABLE ${this.derivedTableBins} AS (
        WITH tokens_all AS (
          SELECT
            floor((${t} - ${this.x0}) / ${this.xBinSize})::INT + 32768 * (floor((${e} - ${this.y0}) / ${this.yBinSize})::INT) as xykey,
            embedding_view_tokenize(${r}) AS token
          FROM ${this.tableName}
        )
        SELECT xykey, token, COUNT(*) AS count
        FROM tokens_all
        WHERE token NOT IN ('',${LE.map((d) => Jx(d)).join(",")}) AND LENGTH(token) >= 3
        GROUP BY xykey, token
        HAVING count >= ${f}
      );
      CREATE OR REPLACE TABLE ${this.derivedTableDF} AS (
        SELECT sum(count) AS count, stem(token, 'english') AS stem_token
        FROM ${this.derivedTableBins} GROUP BY stem_token
      );
    `), this.initialized = !0;
  }
  indices(t) {
    let e = /* @__PURE__ */ new Set();
    for (let { xMin: r, yMin: n, xMax: i, yMax: a } of t) {
      let l = Math.floor((r - this.x0) / this.xBinSize), u = Math.floor((i - this.x0) / this.xBinSize), c = Math.floor((n - this.y0) / this.yBinSize), f = Math.floor((a - this.y0) / this.yBinSize);
      for (let d = l; d <= u; d++)
        for (let p = c; p <= f; p++) {
          let g = p * 32768 + d;
          e.add(g);
        }
    }
    return Array.from(e);
  }
  async summarize(t, e = 4) {
    await this.initialize();
    let r = this.indices(t), n = ms`
      WITH tokens_tf AS (
        SELECT token, sum(count) AS count
        FROM ${this.derivedTableBins}
        WHERE xykey IN (${r.join(",")})
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
      ORDER BY tfidf DESC limit ${e}
    `;
    return (await this.coordinator.query(n)).getChild("token").toArray();
  }
};
function xb(t, e) {
  if (e.length == 0)
    return T.literal(!1);
  if (t.identifier != null) {
    let r = t.identifier;
    return T.or(...e.map((n) => T.eq(T.column(r), T.literal(n.identifier))));
  } else {
    let r = t.x, n = t.y, i = t.category;
    return i != null ? T.or(
      ...e.map(
        (a) => T.and(
          T.eq(T.cast(T.column(r), "DOUBLE"), T.literal(a.x)),
          T.eq(T.cast(T.column(n), "DOUBLE"), T.literal(a.y)),
          T.eq(T.cast(T.column(i), "INTEGER"), T.literal(a.category))
        )
      )
    ) : T.or(
      ...e.map(
        (a) => T.and(
          T.eq(T.cast(T.column(r), "DOUBLE"), T.literal(a.x)),
          T.eq(T.cast(T.column(n), "DOUBLE"), T.literal(a.y))
        )
      )
    );
  }
}
function IE(t, e, r) {
  let n = [];
  for (let a = 0; a < r.length; a++) {
    let l = (a + 1) % r.length, { x: u, y: c } = r[a], { x: f, y: d } = r[l], p = c < d ? T.and(T.lte(T.literal(c), e), T.lt(e, T.literal(d))) : T.and(T.lte(T.literal(d), e), T.lt(e, T.literal(c))), g = (c < d ? T.lt : T.gt)(
      T.sub(T.mul(T.literal(f - u), e), T.mul(T.literal(d - c), t)),
      T.literal((f - u) * c - (d - c) * u)
    );
    n.push(T.cast(T.and(p, g), "INT"));
  }
  let i = n.reduce((a, l) => T.add(a, l));
  return T.eq(T.mod(i, T.literal(2)), T.literal(1));
}
function jE(t, e) {
  if (e instanceof Array) {
    if (e.length < 3)
      return T.literal(!1);
    let r = Y2(e);
    return T.and(
      T.isBetween(T.column(t.x), [r.xMin, r.xMax]),
      T.isBetween(T.column(t.y), [r.yMin, r.yMax]),
      IE(T.column(t.x), T.column(t.y), e)
    );
  } else
    return T.and(
      T.isBetween(T.column(t.x), [e.xMin, e.xMax]),
      T.isBetween(T.column(t.y), [e.yMin, e.yMax])
    );
}
async function UE(t, e) {
  let { x: r, y: n, table: i } = e, a = await t.query(
    T.Query.from(i).select({
      centerX: T.sql`MEDIAN(${T.column(r)})`,
      centerY: T.sql`MEDIAN(${T.column(n)})`,
      stdX: T.sql`STDDEV(${T.column(r)})`,
      stdY: T.sql`STDDEV(${T.column(n)})`,
      ...e.category != null ? {
        maxCategory: T.sql`MAX(${T.column(e.category)}::UTINYINT)`
      } : {}
    })
  ), { centerX: l, centerY: u, stdX: c, stdY: f, maxCategory: d } = a.get(0), p = 1 / (Math.max(c, f, 1e-3) * 3), g = 0.1 / p, m = T.sql`FLOOR((${T.column(r)} - ${l}) / ${g})`, y = T.sql`FLOOR((${T.column(n)} - ${u}) / ${g})`, w = e.category != null ? T.column(e.category) : null, x = w != null ? [m, y, w] : [m, y], k = T.Query.from(
    T.Query.from(i).select({ count: T.sql`COUNT(*)` }).groupby(...x)
  ).select({
    totalCount: T.sql`SUM(count)::INT`,
    maxCount: T.sql`MAX(count)::INT`
  });
  a = await t.query(k);
  let { maxCount: S, totalCount: _ } = a.get(0), E = S / (g * g);
  return {
    centerX: l,
    centerY: u,
    scaler: p,
    totalCount: _,
    categoryCount: (d ?? 0) + 1,
    maxDensity: E
  };
}
let WE = class {
  coordinator;
  source;
  lastDistance;
  selectParams;
  constructor(t, e) {
    this.coordinator = t, this.source = e, this.lastDistance = 0;
    let { x: r, y: n, category: i, text: a, identifier: l } = this.source, u = {}, c = e.additionalFields ?? {};
    for (let f in c) {
      let d = c[f];
      typeof d == "string" ? u["field_" + f] = T.column(d) : u["field_" + f] = T.sql`${d.sql}`;
    }
    this.selectParams = {
      x: T.sql`${T.column(r)}::DOUBLE`,
      y: T.sql`${T.column(n)}::DOUBLE`,
      ...i != null ? { category: T.sql`${T.column(i)}::INT` } : {},
      ...a != null ? { text: T.sql`${T.column(a)}` } : {},
      ...l != null ? { identifier: T.sql`${T.column(l)}` } : {},
      ...u
    };
  }
  _convertToDataPoint(t) {
    let e = {};
    for (let r in t)
      r.startsWith("field_") && (e[r.slice(6)] = t[r]);
    return {
      x: t.x,
      y: t.y,
      category: t.category,
      text: t.text,
      identifier: t.identifier,
      fields: e
    };
  }
  async queryClosestPoint(t, e, r, n) {
    let i = n * 12, { x: a, y: l } = this.source;
    for (let u of [this.lastDistance, i]) {
      if (u == 0 || u > i)
        continue;
      let c = T.Query.from(this.source.table).select(this.selectParams);
      c = c.where(T.sql`${T.column(a)} BETWEEN ${e - u} AND ${e + u}`), c = c.where(T.sql`${T.column(l)} BETWEEN ${r - u} AND ${r + u}`), t && (c = c.where(t)), c = c.orderby(T.sql`(x - (${e}))**2 + (y - (${r}))**2`).limit(1);
      let f = (await this.coordinator.query(c)).get(0);
      if (f)
        return this.lastDistance = Math.max(Math.abs(f.x - e), Math.abs(f.y - r)) * 4, this._convertToDataPoint(f);
    }
    return null;
  }
  async queryPoints(t) {
    let { table: e, identifier: r } = this.source;
    if (r == null)
      return [];
    let n = T.Query.from(e).select(this.selectParams);
    return n = n.where(
      T.isIn(
        T.column(r),
        t.map((i) => T.literal(i))
      )
    ), Array.from(await this.coordinator.query(n)).map((i) => this._convertToDataPoint(i));
  }
};
function HE(t) {
  let e = t.coordinator ?? Ed(), r = new VE({ ...t, coordinator: e });
  return e.connect(r), r.destroy = () => {
    e.disconnect(r);
  }, r;
}
let VE = class extends Td {
  _spec;
  constructor(t) {
    super(t.selection ?? void 0), this._spec = { ...t };
  }
  query(t) {
    return this._spec.query(t);
  }
  queryResult(t) {
    return this._spec.queryResult?.(t), this;
  }
  queryPending() {
    return this._spec.queryPending?.(), this;
  }
  queryError(t) {
    return this._spec.queryError?.(t), this;
  }
};
function GE(t, e) {
  zl(e, !0);
  let r = Ge(e, "coordinator", 19, Ed), n = Ge(e, "category", 3, null), i = Ge(e, "text", 3, null), a = Ge(e, "identifier", 3, null), l = Ge(e, "filter", 3, null), u = Ge(e, "categoryColors", 3, null), c = Ge(e, "tooltip", 3, null), f = Ge(e, "additionalFields", 3, null), d = Ge(e, "selection", 3, null), p = Ge(e, "rangeSelection", 3, null), g = Ge(e, "rangeSelectionValue", 3, null), m = Ge(e, "width", 3, null), y = Ge(e, "height", 3, null), w = Ge(e, "pixelRatio", 3, null), x = Ge(e, "colorScheme", 3, "light"), k = Ge(e, "theme", 3, null), S = Ge(e, "viewportState", 3, null), _ = Ge(e, "automaticLabels", 3, !1), E = Ge(e, "mode", 3, "density"), C = Ge(e, "minimumDensity", 3, 1 / 16), R = Ge(e, "customTooltip", 3, null), A = Ge(e, "customOverlay", 3, null), N = Ge(e, "onViewportState", 3, null), L = Ge(e, "onTooltip", 3, null), j = Ge(e, "onSelection", 3, null), B = Ge(e, "onRangeSelection", 3, null), P = /* @__PURE__ */ pr(new Float32Array()), q = /* @__PURE__ */ pr(new Float32Array()), H = /* @__PURE__ */ pr(null), X = /* @__PURE__ */ pr(1), V = /* @__PURE__ */ pr(1), G = /* @__PURE__ */ pr(1), Z = /* @__PURE__ */ pr(null), Y = /* @__PURE__ */ pr(null), I = /* @__PURE__ */ pr(null), K = /* @__PURE__ */ pr(null), ie = /* @__PURE__ */ pr(null);
  Ai(() => {
    let xe = {
      coordinator: r(),
      source: {
        table: e.table,
        x: e.x,
        y: e.y,
        category: n()
      }
    }, ke = null, Le = !1;
    async function Ie() {
      let je = xe.source, et = await UE(xe.coordinator, je);
      if (Le)
        return;
      let ht = et.scaler * 0.95;
      ot(Z, {
        x: et.centerX,
        y: et.centerY,
        scale: ht
      }), ot(V, et.totalCount), ot(G, et.maxDensity), ot(X, et.categoryCount), ke = HE({
        coordinator: xe.coordinator,
        selection: l(),
        query: (xt) => T.Query.from(je.table).select({
          x: T.sql`${T.column(je.x)}::FLOAT`,
          y: T.sql`${T.column(je.y)}::FLOAT`,
          ...je.category != null ? { c: T.sql`${T.column(je.category)}::UTINYINT` } : {}
        }).where(xt),
        queryResult: (xt) => {
          let wt = xt.getChild("x").toArray(), Xe = xt.getChild("y").toArray(), it = xt.getChild("c")?.toArray() ?? null;
          wt != null && !(wt instanceof Float32Array) && (wt = new Float32Array(wt)), Xe != null && !(Xe instanceof Float32Array) && (Xe = new Float32Array(Xe)), it != null && !(it instanceof Uint8Array) && (it = new Uint8Array(it)), ot(P, wt), ot(q, Xe), ot(H, it), se(null), ye(null);
        }
      }), ke.reset = () => {
        _e();
      }, ot(ie, ke);
    }
    return Ie(), () => {
      ot(ie, null), Le = !0, ke?.destroy();
    };
  }), Ai(() => {
    if (m0(c())) {
      let xe = O(ie);
      if (xe == null)
        return;
      let ke = c();
      ot(Y, ke.value);
      let Le = () => {
        ot(Y, ke.value);
      };
      return Ai(() => {
        let Ie = O(Y), je = {
          x: e.x,
          y: e.y,
          category: n(),
          identifier: a()
        };
        ke.update({
          source: xe,
          clients: (/* @__PURE__ */ new Set()).add(xe),
          predicate: Ie != null ? xb(je, [Ie]) : null,
          value: Ie
        });
      }), ke.addEventListener("value", Le), () => {
        ke.removeEventListener("value", Le), ke.update({
          source: xe,
          clients: (/* @__PURE__ */ new Set()).add(xe),
          value: null,
          predicate: null
        });
      };
    } else if (c() == null || typeof c() == "object")
      ot(Y, c());
    else {
      if (O(Y)?.identifier == c())
        return;
      let xe = !1;
      return Ae([c()]).then((ke) => {
        xe || (ke.length > 0 ? ot(Y, ke[0]) : ot(Y, null));
      }), () => {
        xe = !0;
      };
    }
  });
  function se(xe) {
    pa(c(), xe) || (ot(Y, xe), L()?.(xe));
  }
  Ai(() => {
    if (m0(d())) {
      let xe = O(ie);
      if (xe == null)
        return;
      let ke = d();
      ot(I, ke.value);
      let Le = () => {
        ot(I, ke.value);
      };
      return Ai(() => {
        let Ie = O(I), je = {
          x: e.x,
          y: e.y,
          category: n(),
          identifier: a()
        };
        ke.update({
          source: xe,
          clients: (/* @__PURE__ */ new Set()).add(xe),
          predicate: Ie != null ? xb(je, Ie) : null,
          value: Ie
        });
      }), ke.addEventListener("value", Le), () => {
        ke.removeEventListener("value", Le), ke.update({
          source: xe,
          clients: (/* @__PURE__ */ new Set()).add(xe),
          value: null,
          predicate: null
        });
      };
    } else if (d() == null)
      ot(I, null);
    else if (d().length == 0)
      ot(I, []);
    else if (d().every((xe) => typeof xe == "object"))
      ot(I, d());
    else {
      let xe = !1;
      return Ae(d()).then((ke) => {
        xe || ot(I, ke);
      }), () => {
        xe = !0;
      };
    }
  });
  function ye(xe) {
    pa(d(), xe) || (ot(I, xe), j()?.(xe));
  }
  Ai(() => {
    let xe = O(ie);
    if (xe == null)
      return;
    let ke = p();
    if (ke != null)
      return Ai(() => {
        let Le = O(K), Ie = { x: e.x, y: e.y }, je = {
          source: xe,
          clients: (/* @__PURE__ */ new Set()).add(xe),
          predicate: Le != null ? jE(Ie, Le) : null,
          value: Le
        };
        ke.update(je), ke.activate(je);
      }), () => {
        ke.update({
          source: xe,
          clients: (/* @__PURE__ */ new Set()).add(xe),
          value: null,
          predicate: null
        });
      };
  }), Ai(() => {
    pa(Vs(() => O(K)), g()) || ot(K, g());
  });
  function _e() {
    ye(null), se(null), B()?.(null), ot(K, null);
  }
  let be = /* @__PURE__ */ He(() => new WE(r(), {
    table: e.table,
    x: e.x,
    y: e.y,
    category: n(),
    text: i(),
    identifier: a(),
    additionalFields: f()
  }));
  async function ue(xe, ke, Le) {
    return await O(be).queryClosestPoint(l()?.predicate?.(O(ie)), xe, ke, Le);
  }
  async function Ae(xe) {
    return await O(be).queryPoints(xe);
  }
  let ze = /* @__PURE__ */ He(() => i() != null ? new qE({
    coordinator: r(),
    table: e.table,
    x: e.x,
    y: e.y,
    text: i()
  }) : null);
  async function Me(xe) {
    if (O(ze) == null)
      return null;
    let ke = await O(ze).summarize(xe, 4);
    return ke.length > 0 ? ke.slice(0, 2).join("-") + `-
` + ke.slice(2).join("-") : null;
  }
  {
    let xe = /* @__PURE__ */ He(() => E() ?? "points"), ke = /* @__PURE__ */ He(() => m() ?? 800), Le = /* @__PURE__ */ He(() => y() ?? 800), Ie = /* @__PURE__ */ He(() => w() ?? 2), je = /* @__PURE__ */ He(() => x() ?? "light"), et = /* @__PURE__ */ He(() => ({
      x: O(P),
      y: O(q),
      category: O(H)
    })), ht = /* @__PURE__ */ He(() => i() != null ? _() ?? !1 : !1), xt = /* @__PURE__ */ He(() => C() ?? 1 / 16);
    NE(t, {
      get mode() {
        return O(xe);
      },
      get width() {
        return O(ke);
      },
      get height() {
        return O(Le);
      },
      get pixelRatio() {
        return O(Ie);
      },
      get colorScheme() {
        return O(je);
      },
      get theme() {
        return k();
      },
      get data() {
        return O(et);
      },
      get totalCount() {
        return O(V);
      },
      get maxDensity() {
        return O(G);
      },
      get categoryCount() {
        return O(X);
      },
      get categoryColors() {
        return u();
      },
      get defaultViewportState() {
        return O(Z);
      },
      querySelection: ue,
      queryClusterLabels: Me,
      get automaticLabels() {
        return O(ht);
      },
      get minimumDensity() {
        return O(xt);
      },
      get customTooltip() {
        return R();
      },
      get customOverlay() {
        return A();
      },
      get tooltip() {
        return O(Y);
      },
      onTooltip: se,
      get selection() {
        return O(I);
      },
      onSelection: ye,
      get viewportState() {
        return S();
      },
      get onViewportState() {
        return N();
      },
      get rangeSelection() {
        return O(K);
      },
      onRangeSelection: (wt) => {
        ot(K, wt), B()?.(wt);
      }
    });
  }
  Ol();
}
let XE = class {
  component;
  currentProps;
  constructor(t, e) {
    this.currentProps = { ...e }, this.component = RR({ component: GE, target: t, props: e });
  }
  update(t) {
    let e = {};
    for (let r in t)
      t[r] !== this.currentProps[r] && (e[r] = t[r], this.currentProps[r] = t[r]);
    this.component.$set(e);
  }
  destroy() {
    this.component.$destroy();
  }
};
function YE() {
  return t2() ? 32 : 4;
}
let KE;
const ZE = typeof TextDecoder < "u" ? new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
typeof TextDecoder < "u" && ZE.decode();
const hk = new Array(128).fill(void 0);
hk.push(void 0, null, !0, !1);
hk.length;
const QE = typeof TextEncoder < "u" ? new TextEncoder("utf-8") : {};
QE.encodeInto;
typeof FinalizationRegistry > "u" || new FinalizationRegistry((t) => KE.__wbg_densitymap_free(t >>> 0));
const to = 2, pg = 4, vg = 8, _c = 16, Vi = 32, Pl = 64, pk = 128, ko = 256, dd = 512, nn = 1024, Mo = 2048, Na = 4096, Io = 8192, Ll = 16384, gg = 32768, Vd = 65536, wb = 1 << 17, JE = 1 << 18, mg = 1 << 19, vk = 1 << 20, I0 = 1 << 21, yg = 1 << 22, fl = 1 << 23, dl = Symbol("$state"), gk = Symbol("legacy props"), eT = Symbol(""), bg = new class extends Error {
  name = "StaleReactionError";
  message = "The reaction that called `getAbortSignal()` was re-run or destroyed";
}(), mk = 3, rc = 8, tT = !1;
var Gd = Array.isArray, rT = Array.prototype.indexOf, xg = Array.from, hd = Object.defineProperty, Cs = Object.getOwnPropertyDescriptor, yk = Object.getOwnPropertyDescriptors, bk = Object.prototype, nT = Array.prototype, Xd = Object.getPrototypeOf, kb = Object.isExtensible;
const oT = () => {
};
function xk(t) {
  for (var e = 0; e < t.length; e++)
    t[e]();
}
function iT() {
  var t, e, r = new Promise((n, i) => {
    t = n, e = i;
  });
  return { promise: r, resolve: t, reject: e };
}
function wk(t) {
  return t === this.v;
}
function wg(t, e) {
  return t != t ? e == e : t !== e || t !== null && typeof t == "object" || typeof t == "function";
}
function aT(t, e) {
  return t !== e;
}
function kk(t) {
  return !wg(t, this.v);
}
function lT() {
  throw new Error("https://svelte.dev/e/await_outside_boundary");
}
function _k(t) {
  throw new Error("https://svelte.dev/e/lifecycle_outside_component");
}
function sT() {
  throw new Error("https://svelte.dev/e/async_derived_orphan");
}
function uT(t) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function cT() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function fT(t) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function dT() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function hT() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function pT() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function vT() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function gT() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let Sc = !1, mT = !1;
function yT() {
  Sc = !0;
}
const kg = 1, _g = 2, Sk = 4, bT = 8, xT = 16, wT = 1, kT = 2, Mk = "[", Sg = "[!", Mg = "]", Rs = {}, Hr = Symbol(), _T = "http://www.w3.org/1999/xhtml", ST = [];
function Ck(t, e = !1) {
  return If(t, /* @__PURE__ */ new Map(), "", ST);
}
function If(t, e, r, n, i = null) {
  if (typeof t == "object" && t !== null) {
    var a = e.get(t);
    if (a !== void 0) return a;
    if (t instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(t)
    );
    if (t instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(t)
    );
    if (Gd(t)) {
      var l = (
        /** @type {Snapshot<any>} */
        Array(t.length)
      );
      e.set(t, l), i !== null && e.set(i, l);
      for (var u = 0; u < t.length; u += 1) {
        var c = t[u];
        u in t && (l[u] = If(c, e, r, n));
      }
      return l;
    }
    if (Xd(t) === bk) {
      l = {}, e.set(t, l), i !== null && e.set(i, l);
      for (var f in t)
        l[f] = If(t[f], e, r, n);
      return l;
    }
    if (t instanceof Date)
      return (
        /** @type {Snapshot<T>} */
        structuredClone(t)
      );
    if (typeof /** @type {T & { toJSON?: any } } */
    t.toJSON == "function")
      return If(
        /** @type {T & { toJSON(): any } } */
        t.toJSON(),
        e,
        r,
        n,
        // Associate the instance with the toJSON clone
        t
      );
  }
  if (t instanceof EventTarget)
    return (
      /** @type {Snapshot<T>} */
      t
    );
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(t)
    );
  } catch {
    return (
      /** @type {Snapshot<T>} */
      t
    );
  }
}
let Sr = null;
function pd(t) {
  Sr = t;
}
function Tn(t) {
  return (
    /** @type {T} */
    Rk().get(t)
  );
}
function go(t, e) {
  return Rk().set(t, e), e;
}
function $r(t, e = !1, r) {
  Sr = {
    p: Sr,
    c: null,
    e: null,
    s: t,
    x: null,
    l: Sc && !e ? { s: null, u: null, $: [] } : null
  };
}
function Fr(t) {
  var e = (
    /** @type {ComponentContext} */
    Sr
  ), r = e.e;
  if (r !== null) {
    e.e = null;
    for (var n of r)
      Kk(n);
  }
  return Sr = e.p, /** @type {T} */
  {};
}
function Ys() {
  return !Sc || Sr !== null && Sr.l === null;
}
function Rk(t) {
  return Sr === null && _k(), Sr.c ??= new Map(MT(Sr) || void 0);
}
function MT(t) {
  let e = t.p;
  for (; e !== null; ) {
    const r = e.c;
    if (r !== null)
      return r;
    e = e.p;
  }
  return null;
}
function Yd(t) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let Ut = !1;
function $i(t) {
  Ut = t;
}
let lr;
function jo(t) {
  if (t === null)
    throw Yd(), Rs;
  return lr = t;
}
function Mc() {
  return jo(
    /** @type {TemplateNode} */
    /* @__PURE__ */ za(lr)
  );
}
function jt(t) {
  if (Ut) {
    if (/* @__PURE__ */ za(lr) !== null)
      throw Yd(), Rs;
    lr = t;
  }
}
function j0() {
  for (var t = 0, e = lr; ; ) {
    if (e.nodeType === rc) {
      var r = (
        /** @type {Comment} */
        e.data
      );
      if (r === Mg) {
        if (t === 0) return e;
        t -= 1;
      } else (r === Mk || r === Sg) && (t += 1);
    }
    var n = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ za(e)
    );
    e.remove(), e = n;
  }
}
function Ak(t) {
  if (!t || t.nodeType !== rc)
    throw Yd(), Rs;
  return (
    /** @type {Comment} */
    t.data
  );
}
function on(t) {
  if (typeof t != "object" || t === null || dl in t)
    return t;
  const e = Xd(t);
  if (e !== bk && e !== nT)
    return t;
  var r = /* @__PURE__ */ new Map(), n = Gd(t), i = /* @__PURE__ */ qe(0), a = pl, l = (u) => {
    if (pl === a)
      return u();
    var c = Lt, f = pl;
    hi(null), Rb(a);
    var d = u();
    return hi(c), Rb(f), d;
  };
  return n && r.set("length", /* @__PURE__ */ qe(
    /** @type {any[]} */
    t.length
  )), new Proxy(
    /** @type {any} */
    t,
    {
      defineProperty(u, c, f) {
        (!("value" in f) || f.configurable === !1 || f.enumerable === !1 || f.writable === !1) && pT();
        var d = r.get(c);
        return d === void 0 ? d = l(() => {
          var p = /* @__PURE__ */ qe(f.value);
          return r.set(c, p), p;
        }) : ve(d, f.value, !0), !0;
      },
      deleteProperty(u, c) {
        var f = r.get(c);
        if (f === void 0) {
          if (c in u) {
            const d = l(() => /* @__PURE__ */ qe(Hr));
            r.set(c, d), Lp(i);
          }
        } else
          ve(f, Hr), Lp(i);
        return !0;
      },
      get(u, c, f) {
        if (c === dl)
          return t;
        var d = r.get(c), p = c in u;
        if (d === void 0 && (!p || Cs(u, c)?.writable) && (d = l(() => {
          var m = on(p ? u[c] : Hr), y = /* @__PURE__ */ qe(m);
          return y;
        }), r.set(c, d)), d !== void 0) {
          var g = z(d);
          return g === Hr ? void 0 : g;
        }
        return Reflect.get(u, c, f);
      },
      getOwnPropertyDescriptor(u, c) {
        var f = Reflect.getOwnPropertyDescriptor(u, c);
        if (f && "value" in f) {
          var d = r.get(c);
          d && (f.value = z(d));
        } else if (f === void 0) {
          var p = r.get(c), g = p?.v;
          if (p !== void 0 && g !== Hr)
            return {
              enumerable: !0,
              configurable: !0,
              value: g,
              writable: !0
            };
        }
        return f;
      },
      has(u, c) {
        if (c === dl)
          return !0;
        var f = r.get(c), d = f !== void 0 && f.v !== Hr || Reflect.has(u, c);
        if (f !== void 0 || Et !== null && (!d || Cs(u, c)?.writable)) {
          f === void 0 && (f = l(() => {
            var g = d ? on(u[c]) : Hr, m = /* @__PURE__ */ qe(g);
            return m;
          }), r.set(c, f));
          var p = z(f);
          if (p === Hr)
            return !1;
        }
        return d;
      },
      set(u, c, f, d) {
        var p = r.get(c), g = c in u;
        if (n && c === "length")
          for (var m = f; m < /** @type {Source<number>} */
          p.v; m += 1) {
            var y = r.get(m + "");
            y !== void 0 ? ve(y, Hr) : m in u && (y = l(() => /* @__PURE__ */ qe(Hr)), r.set(m + "", y));
          }
        if (p === void 0)
          (!g || Cs(u, c)?.writable) && (p = l(() => /* @__PURE__ */ qe(void 0)), ve(p, on(f)), r.set(c, p));
        else {
          g = p.v !== Hr;
          var w = l(() => on(f));
          ve(p, w);
        }
        var x = Reflect.getOwnPropertyDescriptor(u, c);
        if (x?.set && x.set.call(d, f), !g) {
          if (n && typeof c == "string") {
            var k = (
              /** @type {Source<number>} */
              r.get("length")
            ), S = Number(c);
            Number.isInteger(S) && S >= k.v && ve(k, S + 1);
          }
          Lp(i);
        }
        return !0;
      },
      ownKeys(u) {
        z(i);
        var c = Reflect.ownKeys(u).filter((p) => {
          var g = r.get(p);
          return g === void 0 || g.v !== Hr;
        });
        for (var [f, d] of r)
          d.v !== Hr && !(f in u) && c.push(f);
        return c;
      },
      setPrototypeOf() {
        vT();
      }
    }
  );
}
var U0, Ek, Tk, $k;
function W0() {
  if (U0 === void 0) {
    U0 = window, Ek = /Firefox/.test(navigator.userAgent);
    var t = Element.prototype, e = Node.prototype, r = Text.prototype;
    Tk = Cs(e, "firstChild").get, $k = Cs(e, "nextSibling").get, kb(t) && (t.__click = void 0, t.__className = void 0, t.__attributes = null, t.__style = void 0, t.__e = void 0), kb(r) && (r.__t = void 0);
  }
}
function Sa(t = "") {
  return document.createTextNode(t);
}
// @__NO_SIDE_EFFECTS__
function _l(t) {
  return Tk.call(t);
}
// @__NO_SIDE_EFFECTS__
function za(t) {
  return $k.call(t);
}
function Xt(t, e) {
  if (!Ut)
    return /* @__PURE__ */ _l(t);
  var r = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ _l(lr)
  );
  if (r === null)
    r = lr.appendChild(Sa());
  else if (e && r.nodeType !== mk) {
    var n = Sa();
    return r?.before(n), jo(n), n;
  }
  return jo(r), r;
}
function yo(t, e) {
  if (!Ut) {
    var r = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ _l(
        /** @type {Node} */
        t
      )
    );
    return r instanceof Comment && r.data === "" ? /* @__PURE__ */ za(r) : r;
  }
  return lr;
}
function bo(t, e = 1, r = !1) {
  let n = Ut ? lr : t;
  for (var i; e--; )
    i = n, n = /** @type {TemplateNode} */
    /* @__PURE__ */ za(n);
  if (!Ut)
    return n;
  if (r && n?.nodeType !== mk) {
    var a = Sa();
    return n === null ? i?.after(a) : n.before(a), jo(a), a;
  }
  return jo(n), /** @type {TemplateNode} */
  n;
}
function Fk(t) {
  t.textContent = "";
}
function CT() {
  return !1;
}
const RT = /* @__PURE__ */ new WeakMap();
function AT(t) {
  var e = Et;
  if (e === null)
    return Lt.f |= fl, t;
  if ((e.f & gg) === 0) {
    if ((e.f & pk) === 0)
      throw !e.parent && t instanceof Error && Nk(t), t;
    e.b.error(t);
  } else
    Cg(t, e);
}
function Cg(t, e) {
  for (; e !== null; ) {
    if ((e.f & pk) !== 0)
      try {
        e.b.error(t);
        return;
      } catch (r) {
        t = r;
      }
    e = e.parent;
  }
  throw t instanceof Error && Nk(t), t;
}
function Nk(t) {
  const e = RT.get(t);
  e && (hd(t, "message", {
    value: e.message
  }), hd(t, "stack", {
    value: e.stack
  }));
}
const ET = typeof requestIdleCallback > "u" ? (t) => setTimeout(t, 1) : requestIdleCallback;
let nc = [], oc = [];
function zk() {
  var t = nc;
  nc = [], xk(t);
}
function Ok() {
  var t = oc;
  oc = [], xk(t);
}
function Rg(t) {
  nc.length === 0 && queueMicrotask(zk), nc.push(t);
}
function TT(t) {
  oc.length === 0 && ET(Ok), oc.push(t);
}
function $T() {
  nc.length > 0 && zk(), oc.length > 0 && Ok();
}
function FT() {
  for (var t = (
    /** @type {Effect} */
    Et.b
  ); t !== null && !t.has_pending_snippet(); )
    t = t.parent;
  return t === null && lT(), t;
}
// @__NO_SIDE_EFFECTS__
function Kd(t) {
  var e = to | Mo, r = Lt !== null && (Lt.f & to) !== 0 ? (
    /** @type {Derived} */
    Lt
  ) : null;
  return Et === null || r !== null && (r.f & ko) !== 0 ? e |= ko : Et.f |= mg, {
    ctx: Sr,
    deps: null,
    effects: null,
    equals: wk,
    f: e,
    fn: t,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      Hr
    ),
    wv: 0,
    parent: r ?? Et,
    ac: null
  };
}
// @__NO_SIDE_EFFECTS__
function NT(t, e) {
  let r = (
    /** @type {Effect | null} */
    Et
  );
  r === null && sT();
  var n = (
    /** @type {Boundary} */
    r.b
  ), i = (
    /** @type {Promise<V>} */
    /** @type {unknown} */
    void 0
  ), a = ic(
    /** @type {V} */
    Hr
  ), l = null, u = !Lt;
  return GT(() => {
    try {
      var c = t();
    } catch (m) {
      c = Promise.reject(m);
    }
    var f = () => c;
    i = l?.then(f, f) ?? Promise.resolve(c), l = i;
    var d = (
      /** @type {Batch} */
      Or
    ), p = n.pending;
    u && (n.update_pending_count(1), p || d.increment());
    const g = (m, y = void 0) => {
      l = null, p || d.activate(), y ? y !== bg && (a.f |= fl, ac(a, y)) : ((a.f & fl) !== 0 && (a.f ^= fl), ac(a, m)), u && (n.update_pending_count(-1), p || d.decrement()), Lk();
    };
    if (i.then(g, (m) => g(null, m || "unknown")), d)
      return () => {
        queueMicrotask(() => d.neuter());
      };
  }), new Promise((c) => {
    function f(d) {
      function p() {
        d === i ? c(a) : f(i);
      }
      d.then(p, p);
    }
    f(i);
  });
}
// @__NO_SIDE_EFFECTS__
function Ce(t) {
  const e = /* @__PURE__ */ Kd(t);
  return Wk(e), e;
}
// @__NO_SIDE_EFFECTS__
function Bk(t) {
  const e = /* @__PURE__ */ Kd(t);
  return e.equals = kk, e;
}
function Dk(t) {
  var e = t.effects;
  if (e !== null) {
    t.effects = null;
    for (var r = 0; r < e.length; r += 1)
      pi(
        /** @type {Effect} */
        e[r]
      );
  }
}
function zT(t) {
  for (var e = t.parent; e !== null; ) {
    if ((e.f & to) === 0)
      return (
        /** @type {Effect} */
        e
      );
    e = e.parent;
  }
  return null;
}
function Ag(t) {
  var e, r = Et;
  Ma(zT(t));
  try {
    Dk(t), e = Xk(t);
  } finally {
    Ma(r);
  }
  return e;
}
function Pk(t) {
  var e = Ag(t);
  if (t.equals(e) || (t.v = e, t.wv = Vk()), !ql)
    if (qs !== null)
      qs.set(t, t.v);
    else {
      var r = (ga || (t.f & ko) !== 0) && t.deps !== null ? Na : nn;
      Dn(t, r);
    }
}
function OT(t, e, r) {
  const n = Ys() ? Kd : Bk;
  if (e.length === 0) {
    r(t.map(n));
    return;
  }
  var i = Or, a = (
    /** @type {Effect} */
    Et
  ), l = BT(), u = FT();
  Promise.all(e.map((c) => /* @__PURE__ */ NT(c))).then((c) => {
    i?.activate(), l();
    try {
      r([...t.map(n), ...c]);
    } catch (f) {
      (a.f & Ll) === 0 && Cg(f, a);
    }
    i?.deactivate(), Lk();
  }).catch((c) => {
    u.error(c);
  });
}
function BT() {
  var t = Et, e = Lt, r = Sr;
  return function() {
    Ma(t), hi(e), pd(r);
  };
}
function Lk() {
  Ma(null), hi(null), pd(null);
}
const Su = /* @__PURE__ */ new Set();
let Or = null, qs = null, _b = /* @__PURE__ */ new Set(), vd = [];
function qk() {
  const t = (
    /** @type {() => void} */
    vd.shift()
  );
  vd.length > 0 && queueMicrotask(qk), t();
}
let Sl = [], Zd = null, H0 = !1, jf = !1;
class Is {
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
  #e = /* @__PURE__ */ new Map();
  /**
   * When the batch is committed (and the DOM is updated), we need to remove old branches
   * and append new ones by calling the functions added inside (if/each/key/etc) blocks
   * @type {Set<() => void>}
   */
  #t = /* @__PURE__ */ new Set();
  /**
   * The number of async effects that are currently in flight
   */
  #r = 0;
  /**
   * A deferred that resolves when the batch is committed, used with `settled()`
   * TODO replace with Promise.withResolvers once supported widely enough
   * @type {{ promise: Promise<void>, resolve: (value?: any) => void, reject: (reason: unknown) => void } | null}
   */
  #n = null;
  /**
   * True if an async effect inside this batch resolved and
   * its parent branch was already deleted
   */
  #u = !1;
  /**
   * Async effects (created inside `async_derived`) encountered during processing.
   * These run after the rest of the batch has updated, since they should
   * always have the latest values
   * @type {Effect[]}
   */
  #o = [];
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
  #l = [];
  /**
   * The same as `#render_effects`, but for `$effect` (which runs after)
   * @type {Effect[]}
   */
  #a = [];
  /**
   * Block effects, which may need to re-run on subsequent flushes
   * in order to update internal sources (e.g. each block items)
   * @type {Effect[]}
   */
  #s = [];
  /**
   * Deferred effects (which run after async work has completed) that are DIRTY
   * @type {Effect[]}
   */
  #f = [];
  /**
   * Deferred effects that are MAYBE_DIRTY
   * @type {Effect[]}
   */
  #c = [];
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
  process(e) {
    Sl = [];
    var r = null;
    if (Su.size > 1) {
      r = /* @__PURE__ */ new Map(), qs = /* @__PURE__ */ new Map();
      for (const [a, l] of this.current)
        r.set(a, { v: a.v, wv: a.wv }), a.v = l;
      for (const a of Su)
        if (a !== this)
          for (const [l, u] of a.#e)
            r.has(l) || (r.set(l, { v: l.v, wv: l.wv }), l.v = u);
    }
    for (const a of e)
      this.#p(a);
    if (this.#o.length === 0 && this.#r === 0) {
      this.#h();
      var n = this.#l, i = this.#a;
      this.#l = [], this.#a = [], this.#s = [], Or = null, Sb(n), Sb(i), Or === null ? Or = this : Su.delete(this), this.#n?.resolve();
    } else
      this.#d(this.#l), this.#d(this.#a), this.#d(this.#s);
    if (r) {
      for (const [a, { v: l, wv: u }] of r)
        a.wv <= u && (a.v = l);
      qs = null;
    }
    for (const a of this.#o)
      Lu(a);
    for (const a of this.#i)
      Lu(a);
    this.#o = [], this.#i = [];
  }
  /**
   * Traverse the effect tree, executing effects or stashing
   * them for later execution as appropriate
   * @param {Effect} root
   */
  #p(e) {
    e.f ^= nn;
    for (var r = e.first; r !== null; ) {
      var n = r.f, i = (n & (Vi | Pl)) !== 0, a = i && (n & nn) !== 0, l = a || (n & Io) !== 0 || this.skipped_effects.has(r);
      if (!l && r.fn !== null) {
        if (i)
          r.f ^= nn;
        else if ((n & nn) === 0)
          if ((n & pg) !== 0)
            this.#a.push(r);
          else if ((n & yg) !== 0) {
            var u = r.b?.pending ? this.#i : this.#o;
            u.push(r);
          } else Qd(r) && ((r.f & _c) !== 0 && this.#s.push(r), Lu(r));
        var c = r.first;
        if (c !== null) {
          r = c;
          continue;
        }
      }
      var f = r.parent;
      for (r = r.next; r === null && f !== null; )
        r = f.next, f = f.parent;
    }
  }
  /**
   * @param {Effect[]} effects
   */
  #d(e) {
    for (const r of e)
      ((r.f & Mo) !== 0 ? this.#f : this.#c).push(r), Dn(r, nn);
    e.length = 0;
  }
  /**
   * Associate a change to a given source with the current
   * batch, noting its previous and current values
   * @param {Source} source
   * @param {any} value
   */
  capture(e, r) {
    this.#e.has(e) || this.#e.set(e, r), this.current.set(e, e.v);
  }
  activate() {
    Or = this;
  }
  deactivate() {
    Or = null;
    for (const e of _b)
      if (_b.delete(e), e(), Or !== null)
        break;
  }
  neuter() {
    this.#u = !0;
  }
  flush() {
    Sl.length > 0 ? Ik() : this.#h(), Or === this && (this.#r === 0 && Su.delete(this), this.deactivate());
  }
  /**
   * Append and remove branches to/from the DOM
   */
  #h() {
    if (!this.#u)
      for (const e of this.#t)
        e();
    this.#t.clear();
  }
  increment() {
    this.#r += 1;
  }
  decrement() {
    if (this.#r -= 1, this.#r === 0) {
      for (const e of this.#f)
        Dn(e, Mo), Ml(e);
      for (const e of this.#c)
        Dn(e, Na), Ml(e);
      this.#l = [], this.#a = [], this.flush();
    } else
      this.deactivate();
  }
  /** @param {() => void} fn */
  add_callback(e) {
    this.#t.add(e);
  }
  settled() {
    return (this.#n ??= iT()).promise;
  }
  static ensure() {
    if (Or === null) {
      const e = Or = new Is();
      Su.add(Or), jf || Is.enqueue(() => {
        Or === e && e.flush();
      });
    }
    return Or;
  }
  /** @param {() => void} task */
  static enqueue(e) {
    vd.length === 0 && queueMicrotask(qk), vd.unshift(e);
  }
}
function DT(t) {
  var e = jf;
  jf = !0;
  try {
    for (var r; ; ) {
      if ($T(), Sl.length === 0 && (Or?.flush(), Sl.length === 0))
        return Zd = null, /** @type {T} */
        r;
      Ik();
    }
  } finally {
    jf = e;
  }
}
function Ik() {
  var t = As;
  H0 = !0;
  try {
    var e = 0;
    for (Mb(!0); Sl.length > 0; ) {
      var r = Is.ensure();
      if (e++ > 1e3) {
        var n, i;
        PT();
      }
      r.process(Sl), hl.clear();
    }
  } finally {
    H0 = !1, Mb(t), Zd = null;
  }
}
function PT() {
  try {
    dT();
  } catch (t) {
    Cg(t, Zd);
  }
}
function Sb(t) {
  var e = t.length;
  if (e !== 0) {
    for (var r = 0; r < e; ) {
      var n = t[r++];
      if ((n.f & (Ll | Io)) === 0 && Qd(n)) {
        var i = Or ? Or.current.size : 0;
        if (Lu(n), n.deps === null && n.first === null && n.nodes_start === null && (n.teardown === null && n.ac === null ? e3(n) : n.fn = null), Or !== null && Or.current.size > i && (n.f & vk) !== 0)
          break;
      }
    }
    for (; r < e; )
      Ml(t[r++]);
  }
}
function Ml(t) {
  for (var e = Zd = t; e.parent !== null; ) {
    e = e.parent;
    var r = e.f;
    if (H0 && e === Et && (r & _c) !== 0)
      return;
    if ((r & (Pl | Vi)) !== 0) {
      if ((r & nn) === 0) return;
      e.f ^= nn;
    }
  }
  Sl.push(e);
}
const hl = /* @__PURE__ */ new Map();
function ic(t, e) {
  var r = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: t,
    reactions: null,
    equals: wk,
    rv: 0,
    wv: 0
  };
  return r;
}
// @__NO_SIDE_EFFECTS__
function qe(t, e) {
  const r = ic(t);
  return Wk(r), r;
}
// @__NO_SIDE_EFFECTS__
function jk(t, e = !1, r = !0) {
  const n = ic(t);
  return e || (n.equals = kk), Sc && r && Sr !== null && Sr.l !== null && (Sr.l.s ??= []).push(n), n;
}
function ve(t, e, r = !1) {
  Lt !== null && // since we are untracking the function inside `$inspect.with` we need to add this check
  // to ensure we error if state is set inside an inspect effect
  (!oi || (Lt.f & wb) !== 0) && Ys() && (Lt.f & (to | _c | yg | wb)) !== 0 && !Di?.includes(t) && gT();
  let n = r ? on(e) : e;
  return ac(t, n);
}
function ac(t, e) {
  if (!t.equals(e)) {
    var r = t.v;
    ql ? hl.set(t, e) : hl.set(t, r), t.v = e;
    var n = Is.ensure();
    n.capture(t, r), (t.f & to) !== 0 && ((t.f & Mo) !== 0 && Ag(
      /** @type {Derived} */
      t
    ), Dn(t, (t.f & ko) === 0 ? nn : Na)), t.wv = Vk(), Uk(t, Mo), Ys() && Et !== null && (Et.f & nn) !== 0 && (Et.f & (Vi | Pl)) === 0 && (po === null ? LT([t]) : po.push(t));
  }
  return e;
}
function Lp(t) {
  ve(t, t.v + 1);
}
function Uk(t, e) {
  var r = t.reactions;
  if (r !== null)
    for (var n = Ys(), i = r.length, a = 0; a < i; a++) {
      var l = r[a], u = l.f;
      if (!(!n && l === Et)) {
        var c = (u & Mo) === 0;
        c && Dn(l, e), (u & to) !== 0 ? Uk(
          /** @type {Derived} */
          l,
          Na
        ) : c && Ml(
          /** @type {Effect} */
          l
        );
      }
    }
}
let As = !1;
function Mb(t) {
  As = t;
}
let ql = !1;
function Cb(t) {
  ql = t;
}
let Lt = null, oi = !1;
function hi(t) {
  Lt = t;
}
let Et = null;
function Ma(t) {
  Et = t;
}
let Di = null;
function Wk(t) {
  Lt !== null && (Di === null ? Di = [t] : Di.push(t));
}
let vn = null, Xn = 0, po = null;
function LT(t) {
  po = t;
}
let Hk = 1, lc = 0, pl = lc;
function Rb(t) {
  pl = t;
}
let ga = !1;
function Vk() {
  return ++Hk;
}
function Qd(t) {
  var e = t.f;
  if ((e & Mo) !== 0)
    return !0;
  if ((e & Na) !== 0) {
    var r = t.deps, n = (e & ko) !== 0;
    if (r !== null) {
      var i, a, l = (e & dd) !== 0, u = n && Et !== null && !ga, c = r.length;
      if ((l || u) && (Et === null || (Et.f & Ll) === 0)) {
        var f = (
          /** @type {Derived} */
          t
        ), d = f.parent;
        for (i = 0; i < c; i++)
          a = r[i], (l || !a?.reactions?.includes(f)) && (a.reactions ??= []).push(f);
        l && (f.f ^= dd), u && d !== null && (d.f & ko) === 0 && (f.f ^= ko);
      }
      for (i = 0; i < c; i++)
        if (a = r[i], Qd(
          /** @type {Derived} */
          a
        ) && Pk(
          /** @type {Derived} */
          a
        ), a.wv > t.wv)
          return !0;
    }
    (!n || Et !== null && !ga) && Dn(t, nn);
  }
  return !1;
}
function Gk(t, e, r = !0) {
  var n = t.reactions;
  if (n !== null && !Di?.includes(t))
    for (var i = 0; i < n.length; i++) {
      var a = n[i];
      (a.f & to) !== 0 ? Gk(
        /** @type {Derived} */
        a,
        e,
        !1
      ) : e === a && (r ? Dn(a, Mo) : (a.f & nn) !== 0 && Dn(a, Na), Ml(
        /** @type {Effect} */
        a
      ));
    }
}
function Xk(t) {
  var e = vn, r = Xn, n = po, i = Lt, a = ga, l = Di, u = Sr, c = oi, f = pl, d = t.f;
  vn = /** @type {null | Value[]} */
  null, Xn = 0, po = null, ga = (d & ko) !== 0 && (oi || !As || Lt === null), Lt = (d & (Vi | Pl)) === 0 ? t : null, Di = null, pd(t.ctx), oi = !1, pl = ++lc, t.ac !== null && (t.ac.abort(bg), t.ac = null);
  try {
    t.f |= I0;
    var p = (
      /** @type {Function} */
      (0, t.fn)()
    ), g = t.deps;
    if (vn !== null) {
      var m;
      if (gd(t, Xn), g !== null && Xn > 0)
        for (g.length = Xn + vn.length, m = 0; m < vn.length; m++)
          g[Xn + m] = vn[m];
      else
        t.deps = g = vn;
      if (!ga || // Deriveds that already have reactions can cleanup, so we still add them as reactions
      (d & to) !== 0 && /** @type {import('#client').Derived} */
      t.reactions !== null)
        for (m = Xn; m < g.length; m++)
          (g[m].reactions ??= []).push(t);
    } else g !== null && Xn < g.length && (gd(t, Xn), g.length = Xn);
    if (Ys() && po !== null && !oi && g !== null && (t.f & (to | Na | Mo)) === 0)
      for (m = 0; m < /** @type {Source[]} */
      po.length; m++)
        Gk(
          po[m],
          /** @type {Effect} */
          t
        );
    return i !== null && i !== t && (lc++, po !== null && (n === null ? n = po : n.push(.../** @type {Source[]} */
    po))), (t.f & fl) !== 0 && (t.f ^= fl), p;
  } catch (y) {
    return AT(y);
  } finally {
    t.f ^= I0, vn = e, Xn = r, po = n, Lt = i, ga = a, Di = l, pd(u), oi = c, pl = f;
  }
}
function qT(t, e) {
  let r = e.reactions;
  if (r !== null) {
    var n = rT.call(r, t);
    if (n !== -1) {
      var i = r.length - 1;
      i === 0 ? r = e.reactions = null : (r[n] = r[i], r.pop());
    }
  }
  r === null && (e.f & to) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (vn === null || !vn.includes(e)) && (Dn(e, Na), (e.f & (ko | dd)) === 0 && (e.f ^= dd), Dk(
    /** @type {Derived} **/
    e
  ), gd(
    /** @type {Derived} **/
    e,
    0
  ));
}
function gd(t, e) {
  var r = t.deps;
  if (r !== null)
    for (var n = e; n < r.length; n++)
      qT(t, r[n]);
}
function Lu(t) {
  var e = t.f;
  if ((e & Ll) === 0) {
    Dn(t, nn);
    var r = Et, n = As;
    Et = t, As = !0;
    try {
      (e & _c) !== 0 ? XT(t) : Jk(t), Qk(t);
      var i = Xk(t);
      t.teardown = typeof i == "function" ? i : null, t.wv = Hk;
      var a;
      tT && mT && (t.f & Mo) !== 0 && t.deps;
    } finally {
      As = n, Et = r;
    }
  }
}
function z(t) {
  var e = t.f, r = (e & to) !== 0;
  if (Lt !== null && !oi) {
    var n = Et !== null && (Et.f & Ll) !== 0;
    if (!n && !Di?.includes(t)) {
      var i = Lt.deps;
      if ((Lt.f & I0) !== 0)
        t.rv < lc && (t.rv = lc, vn === null && i !== null && i[Xn] === t ? Xn++ : vn === null ? vn = [t] : (!ga || !vn.includes(t)) && vn.push(t));
      else {
        (Lt.deps ??= []).push(t);
        var a = t.reactions;
        a === null ? t.reactions = [Lt] : a.includes(Lt) || a.push(Lt);
      }
    }
  } else if (r && /** @type {Derived} */
  t.deps === null && /** @type {Derived} */
  t.effects === null) {
    var l = (
      /** @type {Derived} */
      t
    ), u = l.parent;
    u !== null && (u.f & ko) === 0 && (l.f ^= ko);
  }
  if (ql) {
    if (hl.has(t))
      return hl.get(t);
    if (r) {
      l = /** @type {Derived} */
      t;
      var c = l.v;
      return ((l.f & nn) === 0 && l.reactions !== null || Yk(l)) && (c = Ag(l)), hl.set(l, c), c;
    }
  } else if (r) {
    if (l = /** @type {Derived} */
    t, qs?.has(l))
      return qs.get(l);
    Qd(l) && Pk(l);
  }
  if ((t.f & fl) !== 0)
    throw t.v;
  return t.v;
}
function Yk(t) {
  if (t.v === Hr) return !0;
  if (t.deps === null) return !1;
  for (const e of t.deps)
    if (hl.has(e) || (e.f & to) !== 0 && Yk(
      /** @type {Derived} */
      e
    ))
      return !0;
  return !1;
}
function Jd(t) {
  var e = oi;
  try {
    return oi = !0, t();
  } finally {
    oi = e;
  }
}
const IT = -7169;
function Dn(t, e) {
  t.f = t.f & IT | e;
}
function jT(t) {
  if (!(typeof t != "object" || !t || t instanceof EventTarget)) {
    if (dl in t)
      V0(t);
    else if (!Array.isArray(t))
      for (let e in t) {
        const r = t[e];
        typeof r == "object" && r && dl in r && V0(r);
      }
  }
}
function V0(t, e = /* @__PURE__ */ new Set()) {
  if (typeof t == "object" && t !== null && // We don't want to traverse DOM elements
  !(t instanceof EventTarget) && !e.has(t)) {
    e.add(t), t instanceof Date && t.getTime();
    for (let n in t)
      try {
        V0(t[n], e);
      } catch {
      }
    const r = Xd(t);
    if (r !== Object.prototype && r !== Array.prototype && r !== Map.prototype && r !== Set.prototype && r !== Date.prototype) {
      const n = yk(r);
      for (let i in n) {
        const a = n[i].get;
        if (a)
          try {
            a.call(t);
          } catch {
          }
      }
    }
  }
}
function UT(t) {
  Et === null && Lt === null && fT(), Lt !== null && (Lt.f & ko) !== 0 && Et === null && cT(), ql && uT();
}
function WT(t, e) {
  var r = e.last;
  r === null ? e.last = e.first = t : (r.next = t, t.prev = r, e.last = t);
}
function Gi(t, e, r, n = !0) {
  var i = Et;
  i !== null && (i.f & Io) !== 0 && (t |= Io);
  var a = {
    ctx: Sr,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: t | Mo,
    first: null,
    fn: e,
    last: null,
    next: null,
    parent: i,
    b: i && i.b,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0,
    ac: null
  };
  if (r)
    try {
      Lu(a), a.f |= gg;
    } catch (c) {
      throw pi(a), c;
    }
  else e !== null && Ml(a);
  var l = r && a.deps === null && a.first === null && a.nodes_start === null && a.teardown === null && (a.f & mg) === 0;
  if (!l && n && (i !== null && WT(a, i), Lt !== null && (Lt.f & to) !== 0 && (t & Pl) === 0)) {
    var u = (
      /** @type {Derived} */
      Lt
    );
    (u.effects ??= []).push(a);
  }
  return a;
}
function HT(t) {
  const e = Gi(vg, null, !1);
  return Dn(e, nn), e.teardown = t, e;
}
function xr(t) {
  UT();
  var e = (
    /** @type {Effect} */
    Et.f
  ), r = !Lt && (e & Vi) !== 0 && (e & gg) === 0;
  if (r) {
    var n = (
      /** @type {ComponentContext} */
      Sr
    );
    (n.e ??= []).push(t);
  } else
    return Kk(t);
}
function Kk(t) {
  return Gi(pg | vk, t, !1);
}
function VT(t) {
  Is.ensure();
  const e = Gi(Pl, t, !0);
  return (r = {}) => new Promise((n) => {
    r.outro ? th(e, () => {
      pi(e), n(void 0);
    }) : (pi(e), n(void 0));
  });
}
function Cc(t) {
  return Gi(pg, t, !1);
}
function GT(t) {
  return Gi(yg | mg, t, !0);
}
function Zk(t, e = 0) {
  return Gi(vg | e, t, !0);
}
function Dr(t, e = [], r = []) {
  OT(e, r, (n) => {
    Gi(vg, () => t(...n.map(z)), !0);
  });
}
function eh(t, e = 0) {
  var r = Gi(_c | e, t, !0);
  return r;
}
function Ca(t, e = !0) {
  return Gi(Vi, t, !0, e);
}
function Qk(t) {
  var e = t.teardown;
  if (e !== null) {
    const r = ql, n = Lt;
    Cb(!0), hi(null);
    try {
      e.call(null);
    } finally {
      Cb(r), hi(n);
    }
  }
}
function Jk(t, e = !1) {
  var r = t.first;
  for (t.first = t.last = null; r !== null; ) {
    r.ac?.abort(bg);
    var n = r.next;
    (r.f & Pl) !== 0 ? r.parent = null : pi(r, e), r = n;
  }
}
function XT(t) {
  for (var e = t.first; e !== null; ) {
    var r = e.next;
    (e.f & Vi) === 0 && pi(e), e = r;
  }
}
function pi(t, e = !0) {
  var r = !1;
  (e || (t.f & JE) !== 0) && t.nodes_start !== null && t.nodes_end !== null && (YT(
    t.nodes_start,
    /** @type {TemplateNode} */
    t.nodes_end
  ), r = !0), Jk(t, e && !r), gd(t, 0), Dn(t, Ll);
  var n = t.transitions;
  if (n !== null)
    for (const a of n)
      a.stop();
  Qk(t);
  var i = t.parent;
  i !== null && i.first !== null && e3(t), t.next = t.prev = t.teardown = t.ctx = t.deps = t.fn = t.nodes_start = t.nodes_end = t.ac = null;
}
function YT(t, e) {
  for (; t !== null; ) {
    var r = t === e ? null : (
      /** @type {TemplateNode} */
      /* @__PURE__ */ za(t)
    );
    t.remove(), t = r;
  }
}
function e3(t) {
  var e = t.parent, r = t.prev, n = t.next;
  r !== null && (r.next = n), n !== null && (n.prev = r), e !== null && (e.first === t && (e.first = n), e.last === t && (e.last = r));
}
function th(t, e) {
  var r = [];
  Eg(t, r, !0), t3(r, () => {
    pi(t), e && e();
  });
}
function t3(t, e) {
  var r = t.length;
  if (r > 0) {
    var n = () => --r || e();
    for (var i of t)
      i.out(n);
  } else
    e();
}
function Eg(t, e, r) {
  if ((t.f & Io) === 0) {
    if (t.f ^= Io, t.transitions !== null)
      for (const l of t.transitions)
        (l.is_global || r) && e.push(l);
    for (var n = t.first; n !== null; ) {
      var i = n.next, a = (n.f & Vd) !== 0 || (n.f & Vi) !== 0;
      Eg(n, e, a ? r : !1), n = i;
    }
  }
}
function Tg(t) {
  r3(t, !0);
}
function r3(t, e) {
  if ((t.f & Io) !== 0) {
    t.f ^= Io, (t.f & nn) === 0 && (Dn(t, Mo), Ml(t));
    for (var r = t.first; r !== null; ) {
      var n = r.next, i = (r.f & Vd) !== 0 || (r.f & Vi) !== 0;
      r3(r, i ? e : !1), r = n;
    }
    if (t.transitions !== null)
      for (const a of t.transitions)
        (a.is_global || e) && a.in();
  }
}
let Ab = !1;
function KT() {
  Ab || (Ab = !0, document.addEventListener(
    "reset",
    (t) => {
      Promise.resolve().then(() => {
        if (!t.defaultPrevented)
          for (
            const e of
            /**@type {HTMLFormElement} */
            t.target.elements
          )
            e.__on_r?.();
      });
    },
    // In the capture phase to guarantee we get noticed of it (no possiblity of stopPropagation)
    { capture: !0 }
  ));
}
function ZT(t) {
  var e = Lt, r = Et;
  hi(null), Ma(null);
  try {
    return t();
  } finally {
    hi(e), Ma(r);
  }
}
const n3 = /* @__PURE__ */ new Set(), G0 = /* @__PURE__ */ new Set();
function QT(t, e, r, n = {}) {
  function i(a) {
    if (n.capture || Nu.call(e, a), !a.cancelBubble)
      return ZT(() => r?.call(this, a));
  }
  return t.startsWith("pointer") || t.startsWith("touch") || t === "wheel" ? Rg(() => {
    e.addEventListener(t, i, n);
  }) : e.addEventListener(t, i, n), i;
}
function sc(t, e, r, n, i) {
  var a = { capture: n, passive: i }, l = QT(t, e, r, a);
  (e === document.body || // @ts-ignore
  e === window || // @ts-ignore
  e === document || // Firefox has quirky behavior, it can happen that we still get "canplay" events when the element is already removed
  e instanceof HTMLMediaElement) && HT(() => {
    e.removeEventListener(t, l, a);
  });
}
function Xi(t) {
  for (var e = 0; e < t.length; e++)
    n3.add(t[e]);
  for (var r of G0)
    r(t);
}
let Eb = null;
function Nu(t) {
  var e = this, r = (
    /** @type {Node} */
    e.ownerDocument
  ), n = t.type, i = t.composedPath?.() || [], a = (
    /** @type {null | Element} */
    i[0] || t.target
  );
  Eb = t;
  var l = 0, u = Eb === t && t.__root;
  if (u) {
    var c = i.indexOf(u);
    if (c !== -1 && (e === document || e === /** @type {any} */
    window)) {
      t.__root = e;
      return;
    }
    var f = i.indexOf(e);
    if (f === -1)
      return;
    c <= f && (l = c);
  }
  if (a = /** @type {Element} */
  i[l] || t.target, a !== e) {
    hd(t, "currentTarget", {
      configurable: !0,
      get() {
        return a || r;
      }
    });
    var d = Lt, p = Et;
    hi(null), Ma(null);
    try {
      for (var g, m = []; a !== null; ) {
        var y = a.assignedSlot || a.parentNode || /** @type {any} */
        a.host || null;
        try {
          var w = a["__" + n];
          if (w != null && (!/** @type {any} */
          a.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          t.target === a))
            if (Gd(w)) {
              var [x, ...k] = w;
              x.apply(a, [t, ...k]);
            } else
              w.call(a, t);
        } catch (S) {
          g ? m.push(S) : g = S;
        }
        if (t.cancelBubble || y === e || y === null)
          break;
        a = y;
      }
      if (g) {
        for (let S of m)
          queueMicrotask(() => {
            throw S;
          });
        throw g;
      }
    } finally {
      t.__root = e, delete t.currentTarget, hi(d), Ma(p);
    }
  }
}
function JT(t) {
  var e = document.createElement("template");
  return e.innerHTML = t.replaceAll("<!>", "<!---->"), e.content;
}
function Es(t, e) {
  var r = (
    /** @type {Effect} */
    Et
  );
  r.nodes_start === null && (r.nodes_start = t, r.nodes_end = e);
}
// @__NO_SIDE_EFFECTS__
function Wt(t, e) {
  var r = (e & wT) !== 0, n = (e & kT) !== 0, i, a = !t.startsWith("<!>");
  return () => {
    if (Ut)
      return Es(lr, null), lr;
    i === void 0 && (i = JT(a ? t : "<!>" + t), r || (i = /** @type {Node} */
    /* @__PURE__ */ _l(i)));
    var l = (
      /** @type {TemplateNode} */
      n || Ek ? document.importNode(i, !0) : i.cloneNode(!0)
    );
    if (r) {
      var u = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ _l(l)
      ), c = (
        /** @type {TemplateNode} */
        l.lastChild
      );
      Es(u, c);
    } else
      Es(l, l);
    return l;
  };
}
function ys() {
  if (Ut)
    return Es(lr, null), lr;
  var t = document.createDocumentFragment(), e = document.createComment(""), r = Sa();
  return t.append(e, r), Es(e, r), t;
}
function St(t, e) {
  if (Ut) {
    Et.nodes_end = lr, Mc();
    return;
  }
  t !== null && t.before(
    /** @type {Node} */
    e
  );
}
const e$ = ["touchstart", "touchmove"];
function t$(t) {
  return e$.includes(t);
}
function mi(t, e) {
  var r = e == null ? "" : typeof e == "object" ? e + "" : e;
  r !== (t.__t ??= t.nodeValue) && (t.__t = r, t.nodeValue = r + "");
}
function o3(t, e) {
  return i3(t, e);
}
function r$(t, e) {
  W0(), e.intro = e.intro ?? !1;
  const r = e.target, n = Ut, i = lr;
  try {
    for (var a = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ _l(r)
    ); a && (a.nodeType !== rc || /** @type {Comment} */
    a.data !== Mk); )
      a = /** @type {TemplateNode} */
      /* @__PURE__ */ za(a);
    if (!a)
      throw Rs;
    $i(!0), jo(
      /** @type {Comment} */
      a
    ), Mc();
    const l = i3(t, { ...e, anchor: a });
    if (lr === null || lr.nodeType !== rc || /** @type {Comment} */
    lr.data !== Mg)
      throw Yd(), Rs;
    return $i(!1), /**  @type {Exports} */
    l;
  } catch (l) {
    if (l === Rs)
      return e.recover === !1 && hT(), W0(), Fk(r), $i(!1), o3(t, e);
    throw l;
  } finally {
    $i(n), jo(i);
  }
}
const hs = /* @__PURE__ */ new Map();
function i3(t, { target: e, anchor: r, props: n = {}, events: i, context: a, intro: l = !0 }) {
  W0();
  var u = /* @__PURE__ */ new Set(), c = (p) => {
    for (var g = 0; g < p.length; g++) {
      var m = p[g];
      if (!u.has(m)) {
        u.add(m);
        var y = t$(m);
        e.addEventListener(m, Nu, { passive: y });
        var w = hs.get(m);
        w === void 0 ? (document.addEventListener(m, Nu, { passive: y }), hs.set(m, 1)) : hs.set(m, w + 1);
      }
    }
  };
  c(xg(n3)), G0.add(c);
  var f = void 0, d = VT(() => {
    var p = r ?? e.appendChild(Sa());
    return Ca(() => {
      if (a) {
        $r({});
        var g = (
          /** @type {ComponentContext} */
          Sr
        );
        g.c = a;
      }
      i && (n.$$events = i), Ut && Es(
        /** @type {TemplateNode} */
        p,
        null
      ), f = t(p, n) || {}, Ut && (Et.nodes_end = lr), a && Fr();
    }), () => {
      for (var g of u) {
        e.removeEventListener(g, Nu);
        var m = (
          /** @type {number} */
          hs.get(g)
        );
        --m === 0 ? (document.removeEventListener(g, Nu), hs.delete(g)) : hs.set(g, m);
      }
      G0.delete(c), p !== r && p.parentNode?.removeChild(p);
    };
  });
  return X0.set(f, d), f;
}
let X0 = /* @__PURE__ */ new WeakMap();
function n$(t, e) {
  const r = X0.get(t);
  return r ? (X0.delete(t), r(e)) : Promise.resolve();
}
function o$(t) {
  return new i$(t);
}
class i$ {
  /** @type {any} */
  #e;
  /** @type {Record<string, any>} */
  #t;
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(e) {
    var r = /* @__PURE__ */ new Map(), n = (a, l) => {
      var u = /* @__PURE__ */ jk(l, !1, !1);
      return r.set(a, u), u;
    };
    const i = new Proxy(
      { ...e.props || {}, $$events: {} },
      {
        get(a, l) {
          return z(r.get(l) ?? n(l, Reflect.get(a, l)));
        },
        has(a, l) {
          return l === gk ? !0 : (z(r.get(l) ?? n(l, Reflect.get(a, l))), Reflect.has(a, l));
        },
        set(a, l, u) {
          return ve(r.get(l) ?? n(l, u), u), Reflect.set(a, l, u);
        }
      }
    );
    this.#t = (e.hydrate ? r$ : o3)(e.component, {
      target: e.target,
      anchor: e.anchor,
      props: i,
      context: e.context,
      intro: e.intro ?? !1,
      recover: e.recover
    }), (!e?.props?.$$host || e.sync === !1) && DT(), this.#e = i.$$events;
    for (const a of Object.keys(this.#t))
      a === "$set" || a === "$destroy" || a === "$on" || hd(this, a, {
        get() {
          return this.#t[a];
        },
        /** @param {any} value */
        set(l) {
          this.#t[a] = l;
        },
        enumerable: !0
      });
    this.#t.$set = /** @param {Record<string, any>} next */
    (a) => {
      Object.assign(i, a);
    }, this.#t.$destroy = () => {
      n$(this.#t);
    };
  }
  /** @param {Record<string, any>} props */
  $set(e) {
    this.#t.$set(e);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(e, r) {
    this.#e[e] = this.#e[e] || [];
    const n = (...i) => r.call(this, ...i);
    return this.#e[e].push(n), () => {
      this.#e[e] = this.#e[e].filter(
        /** @param {any} fn */
        (i) => i !== n
      );
    };
  }
  $destroy() {
    this.#t.$destroy();
  }
}
const a$ = "5";
typeof window < "u" && ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(a$);
function $g(t, e, ...r) {
  var n = t, i = oT, a;
  eh(() => {
    i !== (i = e()) && (a && (pi(a), a = null), a = Ca(() => (
      /** @type {SnippetFn} */
      i(n, ...r)
    )));
  }, Vd), Ut && (n = lr);
}
function Ks(t) {
  Sr === null && _k(), Sc && Sr.l !== null ? l$(Sr).m.push(t) : xr(() => {
    const e = Jd(t);
    if (typeof e == "function") return (
      /** @type {() => void} */
      e
    );
  });
}
function l$(t) {
  var e = (
    /** @type {ComponentContextLegacy} */
    t.l
  );
  return e.u ??= { a: [], b: [], m: [] };
}
function Yn(t, e, r = !1) {
  Ut && Mc();
  var n = t, i = null, a = null, l = Hr, u = r ? Vd : 0, c = !1;
  const f = (g, m = !0) => {
    c = !0, p(m, g);
  };
  function d() {
    var g = l ? i : a, m = l ? a : i;
    g && Tg(g), m && th(m, () => {
      l ? a = null : i = null;
    });
  }
  const p = (g, m) => {
    if (l === (l = g)) return;
    let y = !1;
    if (Ut) {
      const x = Ak(n) === Sg;
      !!l === x && (n = j0(), jo(n), $i(!1), y = !0);
    }
    var w = n;
    l ? i ??= m && Ca(() => m(w)) : a ??= m && Ca(() => m(w)), d(), y && $i(!0);
  };
  eh(() => {
    c = !1, e(f), c || p(null, null);
  }, u), Ut && (n = lr);
}
function s$(t, e, r) {
  Ut && Mc();
  var n = t, i = Hr, a, l, u = null, c = Ys() ? aT : wg;
  function f() {
    a && th(a), u !== null && (u.lastChild.remove(), n.before(u), u = null), a = l;
  }
  eh(() => {
    if (c(i, i = e())) {
      var d = n, p = CT();
      p && (u = document.createDocumentFragment(), u.append(d = Sa())), l = Ca(() => r(d)), p ? Or.add_callback(f) : f();
    }
  }), Ut && (n = lr);
}
function u$(t, e) {
  return e;
}
function c$(t, e, r) {
  for (var n = t.items, i = [], a = e.length, l = 0; l < a; l++)
    Eg(e[l].e, i, !0);
  var u = a > 0 && i.length === 0 && r !== null;
  if (u) {
    var c = (
      /** @type {Element} */
      /** @type {Element} */
      r.parentNode
    );
    Fk(c), c.append(
      /** @type {Element} */
      r
    ), n.clear(), ti(t, e[0].prev, e[a - 1].next);
  }
  t3(i, () => {
    for (var f = 0; f < a; f++) {
      var d = e[f];
      u || (n.delete(d.k), ti(t, d.prev, d.next)), pi(d.e, !u);
    }
  });
}
function qu(t, e, r, n, i, a = null) {
  var l = t, u = { flags: e, items: /* @__PURE__ */ new Map(), first: null }, c = (e & Sk) !== 0;
  if (c) {
    var f = (
      /** @type {Element} */
      t
    );
    l = Ut ? jo(
      /** @type {Comment | Text} */
      /* @__PURE__ */ _l(f)
    ) : f.appendChild(Sa());
  }
  Ut && Mc();
  var d = null, p = !1, g = /* @__PURE__ */ new Map(), m = /* @__PURE__ */ Bk(() => {
    var k = r();
    return Gd(k) ? k : k == null ? [] : xg(k);
  }), y, w;
  function x() {
    f$(
      w,
      y,
      u,
      g,
      l,
      i,
      e,
      n,
      r
    ), a !== null && (y.length === 0 ? d ? Tg(d) : d = Ca(() => a(l)) : d !== null && th(d, () => {
      d = null;
    }));
  }
  eh(() => {
    w ??= /** @type {Effect} */
    Et, y = z(m);
    var k = y.length;
    if (p && k === 0)
      return;
    p = k === 0;
    let S = !1;
    if (Ut) {
      var _ = Ak(l) === Sg;
      _ !== (k === 0) && (l = j0(), jo(l), $i(!1), S = !0);
    }
    if (Ut) {
      for (var E = null, C, R = 0; R < k; R++) {
        if (lr.nodeType === rc && /** @type {Comment} */
        lr.data === Mg) {
          l = /** @type {Comment} */
          lr, S = !0, $i(!1);
          break;
        }
        var A = y[R], N = n(A, R);
        C = a3(
          lr,
          u,
          E,
          null,
          A,
          N,
          R,
          i,
          e,
          r
        ), u.items.set(N, C), E = C;
      }
      k > 0 && jo(j0());
    }
    Ut ? k === 0 && a && (d = Ca(() => a(l))) : x(), S && $i(!0), z(m);
  }), Ut && (l = lr);
}
function f$(t, e, r, n, i, a, l, u, c) {
  var f = (l & bT) !== 0, d = (l & (kg | _g)) !== 0, p = e.length, g = r.items, m = r.first, y = m, w, x = null, k, S = [], _ = [], E, C, R, A;
  if (f)
    for (A = 0; A < p; A += 1)
      E = e[A], C = u(E, A), R = g.get(C), R !== void 0 && (R.a?.measure(), (k ??= /* @__PURE__ */ new Set()).add(R));
  for (A = 0; A < p; A += 1) {
    if (E = e[A], C = u(E, A), R = g.get(C), R === void 0) {
      var N = n.get(C);
      if (N !== void 0) {
        n.delete(C), g.set(C, N);
        var L = x ? x.next : y;
        ti(r, x, N), ti(r, N, L), qp(N, L, i), x = N;
      } else {
        var j = y ? (
          /** @type {TemplateNode} */
          y.e.nodes_start
        ) : i;
        x = a3(
          j,
          r,
          x,
          x === null ? r.first : x.next,
          E,
          C,
          A,
          a,
          l,
          c
        );
      }
      g.set(C, x), S = [], _ = [], y = x.next;
      continue;
    }
    if (d && d$(R, E, A, l), (R.e.f & Io) !== 0 && (Tg(R.e), f && (R.a?.unfix(), (k ??= /* @__PURE__ */ new Set()).delete(R))), R !== y) {
      if (w !== void 0 && w.has(R)) {
        if (S.length < _.length) {
          var B = _[0], P;
          x = B.prev;
          var q = S[0], H = S[S.length - 1];
          for (P = 0; P < S.length; P += 1)
            qp(S[P], B, i);
          for (P = 0; P < _.length; P += 1)
            w.delete(_[P]);
          ti(r, q.prev, H.next), ti(r, x, q), ti(r, H, B), y = B, x = H, A -= 1, S = [], _ = [];
        } else
          w.delete(R), qp(R, y, i), ti(r, R.prev, R.next), ti(r, R, x === null ? r.first : x.next), ti(r, x, R), x = R;
        continue;
      }
      for (S = [], _ = []; y !== null && y.k !== C; )
        (y.e.f & Io) === 0 && (w ??= /* @__PURE__ */ new Set()).add(y), _.push(y), y = y.next;
      if (y === null)
        continue;
      R = y;
    }
    S.push(R), x = R, y = R.next;
  }
  if (y !== null || w !== void 0) {
    for (var X = w === void 0 ? [] : xg(w); y !== null; )
      (y.e.f & Io) === 0 && X.push(y), y = y.next;
    var V = X.length;
    if (V > 0) {
      var G = (l & Sk) !== 0 && p === 0 ? i : null;
      if (f) {
        for (A = 0; A < V; A += 1)
          X[A].a?.measure();
        for (A = 0; A < V; A += 1)
          X[A].a?.fix();
      }
      c$(r, X, G);
    }
  }
  f && Rg(() => {
    if (k !== void 0)
      for (R of k)
        R.a?.apply();
  }), t.first = r.first && r.first.e, t.last = x && x.e;
  for (var Z of n.values())
    pi(Z.e);
  n.clear();
}
function d$(t, e, r, n) {
  (n & kg) !== 0 && ac(t.v, e), (n & _g) !== 0 ? ac(
    /** @type {Value<number>} */
    t.i,
    r
  ) : t.i = r;
}
function a3(t, e, r, n, i, a, l, u, c, f, d) {
  var p = (c & kg) !== 0, g = (c & xT) === 0, m = p ? g ? /* @__PURE__ */ jk(i, !1, !1) : ic(i) : i, y = (c & _g) === 0 ? l : ic(l), w = {
    i: y,
    v: m,
    k: a,
    a: null,
    // @ts-expect-error
    e: null,
    prev: r,
    next: n
  };
  try {
    if (t === null) {
      var x = document.createDocumentFragment();
      x.append(t = Sa());
    }
    return w.e = Ca(() => u(
      /** @type {Node} */
      t,
      m,
      y,
      f
    ), Ut), w.e.prev = r && r.e, w.e.next = n && n.e, r === null ? d || (e.first = w) : (r.next = w, r.e.next = w.e), n !== null && (n.prev = w, n.e.prev = w.e), w;
  } finally {
  }
}
function qp(t, e, r) {
  for (var n = t.next ? (
    /** @type {TemplateNode} */
    t.next.e.nodes_start
  ) : r, i = e ? (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ) : r, a = (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ); a !== null && a !== n; ) {
    var l = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ za(a)
    );
    i.before(a), a = l;
  }
}
function ti(t, e, r) {
  e === null ? t.first = r : (e.next = r, e.e.next = r && r.e), r !== null && (r.prev = e, r.e.prev = e && e.e);
}
function Mr(t, e) {
  Cc(() => {
    var r = t.getRootNode(), n = (
      /** @type {ShadowRoot} */
      r.host ? (
        /** @type {ShadowRoot} */
        r
      ) : (
        /** @type {Document} */
        r.head ?? /** @type {Document} */
        r.ownerDocument.head
      )
    );
    if (!n.querySelector("#" + e.hash)) {
      const i = document.createElement("style");
      i.id = e.hash, i.textContent = e.code, n.appendChild(i);
    }
  });
}
function Fg(t, e, r) {
  Cc(() => {
    var n = Jd(() => e(t, r?.()) || {});
    if (r && n?.update) {
      var i = !1, a = (
        /** @type {any} */
        {}
      );
      Zk(() => {
        var l = r();
        jT(l), i && wg(a, l) && (a = l, n.update(l));
      }), i = !0;
    }
    if (n?.destroy)
      return () => (
        /** @type {Function} */
        n.destroy()
      );
  });
}
function h$(t, e, r) {
  var n = t == null ? "" : "" + t;
  return e && (n = n ? n + " " + e : e), n === "" ? null : n;
}
function Tb(t, e = !1) {
  var r = e ? " !important;" : ";", n = "";
  for (var i in t) {
    var a = t[i];
    a != null && a !== "" && (n += " " + i + ": " + a + r);
  }
  return n;
}
function p$(t, e) {
  if (e) {
    var r = "", n, i;
    return Array.isArray(e) ? (n = e[0], i = e[1]) : n = e, n && (r += Tb(n)), i && (r += Tb(i, !0)), r = r.trim(), r === "" ? null : r;
  }
  return String(t);
}
function Ra(t, e, r, n, i, a) {
  var l = t.__className;
  if (Ut || l !== r || l === void 0) {
    var u = h$(r, n);
    (!Ut || u !== t.getAttribute("class")) && (u == null ? t.removeAttribute("class") : t.className = u), t.__className = r;
  }
  return a;
}
function Ip(t, e = {}, r, n) {
  for (var i in r) {
    var a = r[i];
    e[i] !== a && (r[i] == null ? t.style.removeProperty(i) : t.style.setProperty(i, a, n));
  }
}
function Ln(t, e, r, n) {
  var i = t.__style;
  if (Ut || i !== e) {
    var a = p$(e, n);
    (!Ut || a !== t.getAttribute("style")) && (a == null ? t.removeAttribute("style") : t.style.cssText = a), t.__style = e;
  } else n && (Array.isArray(n) ? (Ip(t, r?.[0], n[0]), Ip(t, r?.[1], n[1], "important")) : Ip(t, r, n));
  return n;
}
const v$ = Symbol("is custom element"), g$ = Symbol("is html");
function m$(t) {
  if (Ut) {
    var e = !1, r = () => {
      if (!e) {
        if (e = !0, t.hasAttribute("value")) {
          var n = t.value;
          md(t, "value", null), t.value = n;
        }
        if (t.hasAttribute("checked")) {
          var i = t.checked;
          md(t, "checked", null), t.checked = i;
        }
      }
    };
    t.__on_r = r, TT(r), KT();
  }
}
function y$(t, e) {
  var r = l3(t);
  r.checked !== (r.checked = // treat null and undefined the same for the initial value
  e ?? void 0) && (t.checked = e);
}
function md(t, e, r, n) {
  var i = l3(t);
  Ut && (i[e] = t.getAttribute(e), e === "src" || e === "srcset" || e === "href" && t.nodeName === "LINK") || i[e] !== (i[e] = r) && (e === "loading" && (t[eT] = r), r == null ? t.removeAttribute(e) : typeof r != "string" && b$(t).includes(e) ? t[e] = r : t.setAttribute(e, r));
}
function l3(t) {
  return (
    /** @type {Record<string | symbol, unknown>} **/
    // @ts-expect-error
    t.__attributes ??= {
      [v$]: t.nodeName.includes("-"),
      [g$]: t.namespaceURI === _T
    }
  );
}
var $b = /* @__PURE__ */ new Map();
function b$(t) {
  var e = $b.get(t.nodeName);
  if (e) return e;
  $b.set(t.nodeName, e = []);
  for (var r, n = t, i = Element.prototype; i !== n; ) {
    r = yk(n);
    for (var a in r)
      r[a].set && e.push(a);
    n = Xd(n);
  }
  return e;
}
class Ng {
  /** */
  #e = /* @__PURE__ */ new WeakMap();
  /** @type {ResizeObserver | undefined} */
  #t;
  /** @type {ResizeObserverOptions} */
  #r;
  /** @static */
  static entries = /* @__PURE__ */ new WeakMap();
  /** @param {ResizeObserverOptions} options */
  constructor(e) {
    this.#r = e;
  }
  /**
   * @param {Element} element
   * @param {(entry: ResizeObserverEntry) => any} listener
   */
  observe(e, r) {
    var n = this.#e.get(e) || /* @__PURE__ */ new Set();
    return n.add(r), this.#e.set(e, n), this.#n().observe(e, this.#r), () => {
      var i = this.#e.get(e);
      i.delete(r), i.size === 0 && (this.#e.delete(e), this.#t.unobserve(e));
    };
  }
  #n() {
    return this.#t ?? (this.#t = new ResizeObserver(
      /** @param {any} entries */
      (e) => {
        for (var r of e) {
          Ng.entries.set(r.target, r);
          for (var n of this.#e.get(r.target) || [])
            n(r);
        }
      }
    ));
  }
}
var x$ = /* @__PURE__ */ new Ng({
  box: "border-box"
});
function Ho(t, e, r) {
  var n = x$.observe(t, () => r(t[e]));
  Cc(() => (Jd(() => r(t[e])), n));
}
function Fb(t, e) {
  return t === e || t?.[dl] === e;
}
function Pn(t = {}, e, r, n) {
  return Cc(() => {
    var i, a;
    return Zk(() => {
      i = a, a = [], Jd(() => {
        t !== r(...a) && (e(t, ...a), i && Fb(r(...i), t) && e(null, ...i));
      });
    }), () => {
      Rg(() => {
        a && Fb(r(...a), t) && e(null, ...a);
      });
    };
  }), t;
}
let Mf = !1;
function w$(t) {
  var e = Mf;
  try {
    return Mf = !1, [t(), Mf];
  } finally {
    Mf = e;
  }
}
function Rc(t, e, r, n) {
  var i = (
    /** @type {V} */
    n
  ), a = !0, l = () => (a && (a = !1, i = /** @type {V} */
  n), i), u;
  {
    var c = dl in t || gk in t;
    u = Cs(t, e)?.set ?? (c && e in t ? (x) => t[e] = x : void 0);
  }
  var f, d = !1;
  [f, d] = w$(() => (
    /** @type {V} */
    t[e]
  ));
  var p;
  if (p = () => {
    var x = (
      /** @type {V} */
      t[e]
    );
    return x === void 0 ? l() : (a = !0, x);
  }, u) {
    var g = t.$$legacy;
    return function(x, k) {
      return arguments.length > 0 ? ((!k || g || d) && u(k ? p() : x), x) : p();
    };
  }
  var m = !1, y = /* @__PURE__ */ Kd(() => (m = !1, p()));
  z(y);
  var w = (
    /** @type {Effect} */
    Et
  );
  return function(x, k) {
    if (arguments.length > 0) {
      const S = k ? z(y) : on(x);
      return ve(y, S), m = !0, i !== void 0 && (i = S), x;
    }
    return ql && m || (w.f & Ll) !== 0 ? y.v : z(y);
  };
}
var ma = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function zg(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var Uf = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
var k$ = Uf.exports, Nb;
function _$() {
  return Nb || (Nb = 1, function(t, e) {
    (function() {
      var r, n = "4.17.21", i = 200, a = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", l = "Expected a function", u = "Invalid `variable` option passed into `_.template`", c = "__lodash_hash_undefined__", f = 500, d = "__lodash_placeholder__", p = 1, g = 2, m = 4, y = 1, w = 2, x = 1, k = 2, S = 4, _ = 8, E = 16, C = 32, R = 64, A = 128, N = 256, L = 512, j = 30, B = "...", P = 800, q = 16, H = 1, X = 2, V = 3, G = 1 / 0, Z = 9007199254740991, Y = 17976931348623157e292, I = NaN, K = 4294967295, ie = K - 1, se = K >>> 1, ye = [
        ["ary", A],
        ["bind", x],
        ["bindKey", k],
        ["curry", _],
        ["curryRight", E],
        ["flip", L],
        ["partial", C],
        ["partialRight", R],
        ["rearg", N]
      ], _e = "[object Arguments]", be = "[object Array]", ue = "[object AsyncFunction]", Ae = "[object Boolean]", ze = "[object Date]", Me = "[object DOMException]", xe = "[object Error]", ke = "[object Function]", Le = "[object GeneratorFunction]", Ie = "[object Map]", je = "[object Number]", et = "[object Null]", ht = "[object Object]", xt = "[object Promise]", wt = "[object Proxy]", Xe = "[object RegExp]", it = "[object Set]", Ht = "[object String]", nt = "[object Symbol]", dr = "[object Undefined]", qt = "[object WeakMap]", Cr = "[object WeakSet]", sr = "[object ArrayBuffer]", zt = "[object DataView]", Ot = "[object Float32Array]", vr = "[object Float64Array]", xn = "[object Int8Array]", wn = "[object Int16Array]", Ki = "[object Int32Array]", yi = "[object Uint8Array]", Ro = "[object Uint8ClampedArray]", Zi = "[object Uint16Array]", Oa = "[object Uint32Array]", Qi = /\b__p \+= '';/g, un = /\b(__p \+=) '' \+/g, Ji = /(__e\(.*?\)|\b__t\)) \+\n'';/g, Ba = /&(?:amp|lt|gt|quot|#39);/g, ea = /[&<>"']/g, Hl = RegExp(Ba.source), Da = RegExp(ea.source), Js = /<%-([\s\S]+?)%>/g, Vl = /<%([\s\S]+?)%>/g, Pa = /<%=([\s\S]+?)%>/g, La = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, eu = /^\w*$/, Gl = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, qa = /[\\^$.*+?()[\]{}|]/g, pe = RegExp(qa.source), Fe = /^\s+/, Ne = /\s/, Oe = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, De = /\{\n\/\* \[wrapped with (.+)\] \*/, st = /,? & /, kt = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, fe = /[()=,{}\[\]\/\s]/, me = /\\(\\)?/g, Re = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, ct = /\w*$/, ft = /^[-+]0x[0-9a-f]+$/i, Bt = /^0b[01]+$/i, Tt = /^\[object .+?Constructor\]$/, Ve = /^0o[0-7]+$/i, Ct = /^(?:0|[1-9]\d*)$/, ur = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Nr = /($^)/, Rr = /['\n\r\u2028\u2029\\]/g, Zt = "\\ud800-\\udfff", rr = "\\u0300-\\u036f", Gr = "\\ufe20-\\ufe2f", Ir = "\\u20d0-\\u20ff", jr = rr + Gr + Ir, Xo = "\\u2700-\\u27bf", Xl = "a-z\\xdf-\\xf6\\xf8-\\xff", ch = "\\xac\\xb1\\xd7\\xf7", fh = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", Yl = "\\u2000-\\u206f", g_ = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", em = "A-Z\\xc0-\\xd6\\xd8-\\xde", tm = "\\ufe0e\\ufe0f", rm = ch + fh + Yl + g_, dh = "['’]", m_ = "[" + Zt + "]", nm = "[" + rm + "]", Fc = "[" + jr + "]", om = "\\d+", y_ = "[" + Xo + "]", im = "[" + Xl + "]", am = "[^" + Zt + rm + om + Xo + Xl + em + "]", hh = "\\ud83c[\\udffb-\\udfff]", b_ = "(?:" + Fc + "|" + hh + ")", lm = "[^" + Zt + "]", ph = "(?:\\ud83c[\\udde6-\\uddff]){2}", vh = "[\\ud800-\\udbff][\\udc00-\\udfff]", Kl = "[" + em + "]", sm = "\\u200d", um = "(?:" + im + "|" + am + ")", x_ = "(?:" + Kl + "|" + am + ")", cm = "(?:" + dh + "(?:d|ll|m|re|s|t|ve))?", fm = "(?:" + dh + "(?:D|LL|M|RE|S|T|VE))?", dm = b_ + "?", hm = "[" + tm + "]?", w_ = "(?:" + sm + "(?:" + [lm, ph, vh].join("|") + ")" + hm + dm + ")*", k_ = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", __ = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", pm = hm + dm + w_, S_ = "(?:" + [y_, ph, vh].join("|") + ")" + pm, M_ = "(?:" + [lm + Fc + "?", Fc, ph, vh, m_].join("|") + ")", C_ = RegExp(dh, "g"), R_ = RegExp(Fc, "g"), gh = RegExp(hh + "(?=" + hh + ")|" + M_ + pm, "g"), A_ = RegExp([
        Kl + "?" + im + "+" + cm + "(?=" + [nm, Kl, "$"].join("|") + ")",
        x_ + "+" + fm + "(?=" + [nm, Kl + um, "$"].join("|") + ")",
        Kl + "?" + um + "+" + cm,
        Kl + "+" + fm,
        __,
        k_,
        om,
        S_
      ].join("|"), "g"), E_ = RegExp("[" + sm + Zt + jr + tm + "]"), T_ = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, $_ = [
        "Array",
        "Buffer",
        "DataView",
        "Date",
        "Error",
        "Float32Array",
        "Float64Array",
        "Function",
        "Int8Array",
        "Int16Array",
        "Int32Array",
        "Map",
        "Math",
        "Object",
        "Promise",
        "RegExp",
        "Set",
        "String",
        "Symbol",
        "TypeError",
        "Uint8Array",
        "Uint8ClampedArray",
        "Uint16Array",
        "Uint32Array",
        "WeakMap",
        "_",
        "clearTimeout",
        "isFinite",
        "parseInt",
        "setTimeout"
      ], F_ = -1, hr = {};
      hr[Ot] = hr[vr] = hr[xn] = hr[wn] = hr[Ki] = hr[yi] = hr[Ro] = hr[Zi] = hr[Oa] = !0, hr[_e] = hr[be] = hr[sr] = hr[Ae] = hr[zt] = hr[ze] = hr[xe] = hr[ke] = hr[Ie] = hr[je] = hr[ht] = hr[Xe] = hr[it] = hr[Ht] = hr[qt] = !1;
      var cr = {};
      cr[_e] = cr[be] = cr[sr] = cr[zt] = cr[Ae] = cr[ze] = cr[Ot] = cr[vr] = cr[xn] = cr[wn] = cr[Ki] = cr[Ie] = cr[je] = cr[ht] = cr[Xe] = cr[it] = cr[Ht] = cr[nt] = cr[yi] = cr[Ro] = cr[Zi] = cr[Oa] = !0, cr[xe] = cr[ke] = cr[qt] = !1;
      var N_ = {
        // Latin-1 Supplement block.
        À: "A",
        Á: "A",
        Â: "A",
        Ã: "A",
        Ä: "A",
        Å: "A",
        à: "a",
        á: "a",
        â: "a",
        ã: "a",
        ä: "a",
        å: "a",
        Ç: "C",
        ç: "c",
        Ð: "D",
        ð: "d",
        È: "E",
        É: "E",
        Ê: "E",
        Ë: "E",
        è: "e",
        é: "e",
        ê: "e",
        ë: "e",
        Ì: "I",
        Í: "I",
        Î: "I",
        Ï: "I",
        ì: "i",
        í: "i",
        î: "i",
        ï: "i",
        Ñ: "N",
        ñ: "n",
        Ò: "O",
        Ó: "O",
        Ô: "O",
        Õ: "O",
        Ö: "O",
        Ø: "O",
        ò: "o",
        ó: "o",
        ô: "o",
        õ: "o",
        ö: "o",
        ø: "o",
        Ù: "U",
        Ú: "U",
        Û: "U",
        Ü: "U",
        ù: "u",
        ú: "u",
        û: "u",
        ü: "u",
        Ý: "Y",
        ý: "y",
        ÿ: "y",
        Æ: "Ae",
        æ: "ae",
        Þ: "Th",
        þ: "th",
        ß: "ss",
        // Latin Extended-A block.
        Ā: "A",
        Ă: "A",
        Ą: "A",
        ā: "a",
        ă: "a",
        ą: "a",
        Ć: "C",
        Ĉ: "C",
        Ċ: "C",
        Č: "C",
        ć: "c",
        ĉ: "c",
        ċ: "c",
        č: "c",
        Ď: "D",
        Đ: "D",
        ď: "d",
        đ: "d",
        Ē: "E",
        Ĕ: "E",
        Ė: "E",
        Ę: "E",
        Ě: "E",
        ē: "e",
        ĕ: "e",
        ė: "e",
        ę: "e",
        ě: "e",
        Ĝ: "G",
        Ğ: "G",
        Ġ: "G",
        Ģ: "G",
        ĝ: "g",
        ğ: "g",
        ġ: "g",
        ģ: "g",
        Ĥ: "H",
        Ħ: "H",
        ĥ: "h",
        ħ: "h",
        Ĩ: "I",
        Ī: "I",
        Ĭ: "I",
        Į: "I",
        İ: "I",
        ĩ: "i",
        ī: "i",
        ĭ: "i",
        į: "i",
        ı: "i",
        Ĵ: "J",
        ĵ: "j",
        Ķ: "K",
        ķ: "k",
        ĸ: "k",
        Ĺ: "L",
        Ļ: "L",
        Ľ: "L",
        Ŀ: "L",
        Ł: "L",
        ĺ: "l",
        ļ: "l",
        ľ: "l",
        ŀ: "l",
        ł: "l",
        Ń: "N",
        Ņ: "N",
        Ň: "N",
        Ŋ: "N",
        ń: "n",
        ņ: "n",
        ň: "n",
        ŋ: "n",
        Ō: "O",
        Ŏ: "O",
        Ő: "O",
        ō: "o",
        ŏ: "o",
        ő: "o",
        Ŕ: "R",
        Ŗ: "R",
        Ř: "R",
        ŕ: "r",
        ŗ: "r",
        ř: "r",
        Ś: "S",
        Ŝ: "S",
        Ş: "S",
        Š: "S",
        ś: "s",
        ŝ: "s",
        ş: "s",
        š: "s",
        Ţ: "T",
        Ť: "T",
        Ŧ: "T",
        ţ: "t",
        ť: "t",
        ŧ: "t",
        Ũ: "U",
        Ū: "U",
        Ŭ: "U",
        Ů: "U",
        Ű: "U",
        Ų: "U",
        ũ: "u",
        ū: "u",
        ŭ: "u",
        ů: "u",
        ű: "u",
        ų: "u",
        Ŵ: "W",
        ŵ: "w",
        Ŷ: "Y",
        ŷ: "y",
        Ÿ: "Y",
        Ź: "Z",
        Ż: "Z",
        Ž: "Z",
        ź: "z",
        ż: "z",
        ž: "z",
        Ĳ: "IJ",
        ĳ: "ij",
        Œ: "Oe",
        œ: "oe",
        ŉ: "'n",
        ſ: "s"
      }, z_ = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }, O_ = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'"
      }, B_ = {
        "\\": "\\",
        "'": "'",
        "\n": "n",
        "\r": "r",
        "\u2028": "u2028",
        "\u2029": "u2029"
      }, D_ = parseFloat, P_ = parseInt, vm = typeof ma == "object" && ma && ma.Object === Object && ma, L_ = typeof self == "object" && self && self.Object === Object && self, Xr = vm || L_ || Function("return this")(), mh = e && !e.nodeType && e, Ia = mh && !0 && t && !t.nodeType && t, gm = Ia && Ia.exports === mh, yh = gm && vm.process, no = function() {
        try {
          var Q = Ia && Ia.require && Ia.require("util").types;
          return Q || yh && yh.binding && yh.binding("util");
        } catch {
        }
      }(), mm = no && no.isArrayBuffer, ym = no && no.isDate, bm = no && no.isMap, xm = no && no.isRegExp, wm = no && no.isSet, km = no && no.isTypedArray;
      function qn(Q, ce, ae) {
        switch (ae.length) {
          case 0:
            return Q.call(ce);
          case 1:
            return Q.call(ce, ae[0]);
          case 2:
            return Q.call(ce, ae[0], ae[1]);
          case 3:
            return Q.call(ce, ae[0], ae[1], ae[2]);
        }
        return Q.apply(ce, ae);
      }
      function q_(Q, ce, ae, Be) {
        for (var at = -1, It = Q == null ? 0 : Q.length; ++at < It; ) {
          var Pr = Q[at];
          ce(Be, Pr, ae(Pr), Q);
        }
        return Be;
      }
      function oo(Q, ce) {
        for (var ae = -1, Be = Q == null ? 0 : Q.length; ++ae < Be && ce(Q[ae], ae, Q) !== !1; )
          ;
        return Q;
      }
      function I_(Q, ce) {
        for (var ae = Q == null ? 0 : Q.length; ae-- && ce(Q[ae], ae, Q) !== !1; )
          ;
        return Q;
      }
      function _m(Q, ce) {
        for (var ae = -1, Be = Q == null ? 0 : Q.length; ++ae < Be; )
          if (!ce(Q[ae], ae, Q))
            return !1;
        return !0;
      }
      function ta(Q, ce) {
        for (var ae = -1, Be = Q == null ? 0 : Q.length, at = 0, It = []; ++ae < Be; ) {
          var Pr = Q[ae];
          ce(Pr, ae, Q) && (It[at++] = Pr);
        }
        return It;
      }
      function Nc(Q, ce) {
        var ae = Q == null ? 0 : Q.length;
        return !!ae && Zl(Q, ce, 0) > -1;
      }
      function bh(Q, ce, ae) {
        for (var Be = -1, at = Q == null ? 0 : Q.length; ++Be < at; )
          if (ae(ce, Q[Be]))
            return !0;
        return !1;
      }
      function gr(Q, ce) {
        for (var ae = -1, Be = Q == null ? 0 : Q.length, at = Array(Be); ++ae < Be; )
          at[ae] = ce(Q[ae], ae, Q);
        return at;
      }
      function ra(Q, ce) {
        for (var ae = -1, Be = ce.length, at = Q.length; ++ae < Be; )
          Q[at + ae] = ce[ae];
        return Q;
      }
      function xh(Q, ce, ae, Be) {
        var at = -1, It = Q == null ? 0 : Q.length;
        for (Be && It && (ae = Q[++at]); ++at < It; )
          ae = ce(ae, Q[at], at, Q);
        return ae;
      }
      function j_(Q, ce, ae, Be) {
        var at = Q == null ? 0 : Q.length;
        for (Be && at && (ae = Q[--at]); at--; )
          ae = ce(ae, Q[at], at, Q);
        return ae;
      }
      function wh(Q, ce) {
        for (var ae = -1, Be = Q == null ? 0 : Q.length; ++ae < Be; )
          if (ce(Q[ae], ae, Q))
            return !0;
        return !1;
      }
      var U_ = kh("length");
      function W_(Q) {
        return Q.split("");
      }
      function H_(Q) {
        return Q.match(kt) || [];
      }
      function Sm(Q, ce, ae) {
        var Be;
        return ae(Q, function(at, It, Pr) {
          if (ce(at, It, Pr))
            return Be = It, !1;
        }), Be;
      }
      function zc(Q, ce, ae, Be) {
        for (var at = Q.length, It = ae + (Be ? 1 : -1); Be ? It-- : ++It < at; )
          if (ce(Q[It], It, Q))
            return It;
        return -1;
      }
      function Zl(Q, ce, ae) {
        return ce === ce ? n5(Q, ce, ae) : zc(Q, Mm, ae);
      }
      function V_(Q, ce, ae, Be) {
        for (var at = ae - 1, It = Q.length; ++at < It; )
          if (Be(Q[at], ce))
            return at;
        return -1;
      }
      function Mm(Q) {
        return Q !== Q;
      }
      function Cm(Q, ce) {
        var ae = Q == null ? 0 : Q.length;
        return ae ? Sh(Q, ce) / ae : I;
      }
      function kh(Q) {
        return function(ce) {
          return ce == null ? r : ce[Q];
        };
      }
      function _h(Q) {
        return function(ce) {
          return Q == null ? r : Q[ce];
        };
      }
      function Rm(Q, ce, ae, Be, at) {
        return at(Q, function(It, Pr, ir) {
          ae = Be ? (Be = !1, It) : ce(ae, It, Pr, ir);
        }), ae;
      }
      function G_(Q, ce) {
        var ae = Q.length;
        for (Q.sort(ce); ae--; )
          Q[ae] = Q[ae].value;
        return Q;
      }
      function Sh(Q, ce) {
        for (var ae, Be = -1, at = Q.length; ++Be < at; ) {
          var It = ce(Q[Be]);
          It !== r && (ae = ae === r ? It : ae + It);
        }
        return ae;
      }
      function Mh(Q, ce) {
        for (var ae = -1, Be = Array(Q); ++ae < Q; )
          Be[ae] = ce(ae);
        return Be;
      }
      function X_(Q, ce) {
        return gr(ce, function(ae) {
          return [ae, Q[ae]];
        });
      }
      function Am(Q) {
        return Q && Q.slice(0, Fm(Q) + 1).replace(Fe, "");
      }
      function In(Q) {
        return function(ce) {
          return Q(ce);
        };
      }
      function Ch(Q, ce) {
        return gr(ce, function(ae) {
          return Q[ae];
        });
      }
      function tu(Q, ce) {
        return Q.has(ce);
      }
      function Em(Q, ce) {
        for (var ae = -1, Be = Q.length; ++ae < Be && Zl(ce, Q[ae], 0) > -1; )
          ;
        return ae;
      }
      function Tm(Q, ce) {
        for (var ae = Q.length; ae-- && Zl(ce, Q[ae], 0) > -1; )
          ;
        return ae;
      }
      function Y_(Q, ce) {
        for (var ae = Q.length, Be = 0; ae--; )
          Q[ae] === ce && ++Be;
        return Be;
      }
      var K_ = _h(N_), Z_ = _h(z_);
      function Q_(Q) {
        return "\\" + B_[Q];
      }
      function J_(Q, ce) {
        return Q == null ? r : Q[ce];
      }
      function Ql(Q) {
        return E_.test(Q);
      }
      function e5(Q) {
        return T_.test(Q);
      }
      function t5(Q) {
        for (var ce, ae = []; !(ce = Q.next()).done; )
          ae.push(ce.value);
        return ae;
      }
      function Rh(Q) {
        var ce = -1, ae = Array(Q.size);
        return Q.forEach(function(Be, at) {
          ae[++ce] = [at, Be];
        }), ae;
      }
      function $m(Q, ce) {
        return function(ae) {
          return Q(ce(ae));
        };
      }
      function na(Q, ce) {
        for (var ae = -1, Be = Q.length, at = 0, It = []; ++ae < Be; ) {
          var Pr = Q[ae];
          (Pr === ce || Pr === d) && (Q[ae] = d, It[at++] = ae);
        }
        return It;
      }
      function Oc(Q) {
        var ce = -1, ae = Array(Q.size);
        return Q.forEach(function(Be) {
          ae[++ce] = Be;
        }), ae;
      }
      function r5(Q) {
        var ce = -1, ae = Array(Q.size);
        return Q.forEach(function(Be) {
          ae[++ce] = [Be, Be];
        }), ae;
      }
      function n5(Q, ce, ae) {
        for (var Be = ae - 1, at = Q.length; ++Be < at; )
          if (Q[Be] === ce)
            return Be;
        return -1;
      }
      function o5(Q, ce, ae) {
        for (var Be = ae + 1; Be--; )
          if (Q[Be] === ce)
            return Be;
        return Be;
      }
      function Jl(Q) {
        return Ql(Q) ? a5(Q) : U_(Q);
      }
      function Ao(Q) {
        return Ql(Q) ? l5(Q) : W_(Q);
      }
      function Fm(Q) {
        for (var ce = Q.length; ce-- && Ne.test(Q.charAt(ce)); )
          ;
        return ce;
      }
      var i5 = _h(O_);
      function a5(Q) {
        for (var ce = gh.lastIndex = 0; gh.test(Q); )
          ++ce;
        return ce;
      }
      function l5(Q) {
        return Q.match(gh) || [];
      }
      function s5(Q) {
        return Q.match(A_) || [];
      }
      var u5 = function Q(ce) {
        ce = ce == null ? Xr : es.defaults(Xr.Object(), ce, es.pick(Xr, $_));
        var ae = ce.Array, Be = ce.Date, at = ce.Error, It = ce.Function, Pr = ce.Math, ir = ce.Object, Ah = ce.RegExp, c5 = ce.String, io = ce.TypeError, Bc = ae.prototype, f5 = It.prototype, ts = ir.prototype, Dc = ce["__core-js_shared__"], Pc = f5.toString, Qt = ts.hasOwnProperty, d5 = 0, Nm = function() {
          var o = /[^.]+$/.exec(Dc && Dc.keys && Dc.keys.IE_PROTO || "");
          return o ? "Symbol(src)_1." + o : "";
        }(), Lc = ts.toString, h5 = Pc.call(ir), p5 = Xr._, v5 = Ah(
          "^" + Pc.call(Qt).replace(qa, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
        ), qc = gm ? ce.Buffer : r, oa = ce.Symbol, Ic = ce.Uint8Array, zm = qc ? qc.allocUnsafe : r, jc = $m(ir.getPrototypeOf, ir), Om = ir.create, Bm = ts.propertyIsEnumerable, Uc = Bc.splice, Dm = oa ? oa.isConcatSpreadable : r, ru = oa ? oa.iterator : r, ja = oa ? oa.toStringTag : r, Wc = function() {
          try {
            var o = Ga(ir, "defineProperty");
            return o({}, "", {}), o;
          } catch {
          }
        }(), g5 = ce.clearTimeout !== Xr.clearTimeout && ce.clearTimeout, m5 = Be && Be.now !== Xr.Date.now && Be.now, y5 = ce.setTimeout !== Xr.setTimeout && ce.setTimeout, Hc = Pr.ceil, Vc = Pr.floor, Eh = ir.getOwnPropertySymbols, b5 = qc ? qc.isBuffer : r, Pm = ce.isFinite, x5 = Bc.join, w5 = $m(ir.keys, ir), Lr = Pr.max, Qr = Pr.min, k5 = Be.now, _5 = ce.parseInt, Lm = Pr.random, S5 = Bc.reverse, Th = Ga(ce, "DataView"), nu = Ga(ce, "Map"), $h = Ga(ce, "Promise"), rs = Ga(ce, "Set"), ou = Ga(ce, "WeakMap"), iu = Ga(ir, "create"), Gc = ou && new ou(), ns = {}, M5 = Xa(Th), C5 = Xa(nu), R5 = Xa($h), A5 = Xa(rs), E5 = Xa(ou), Xc = oa ? oa.prototype : r, au = Xc ? Xc.valueOf : r, qm = Xc ? Xc.toString : r;
        function $(o) {
          if (wr(o) && !ut(o) && !(o instanceof Rt)) {
            if (o instanceof ao)
              return o;
            if (Qt.call(o, "__wrapped__"))
              return Iy(o);
          }
          return new ao(o);
        }
        var os = /* @__PURE__ */ function() {
          function o() {
          }
          return function(s) {
            if (!br(s))
              return {};
            if (Om)
              return Om(s);
            o.prototype = s;
            var v = new o();
            return o.prototype = r, v;
          };
        }();
        function Yc() {
        }
        function ao(o, s) {
          this.__wrapped__ = o, this.__actions__ = [], this.__chain__ = !!s, this.__index__ = 0, this.__values__ = r;
        }
        $.templateSettings = {
          /**
           * Used to detect `data` property values to be HTML-escaped.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          escape: Js,
          /**
           * Used to detect code to be evaluated.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          evaluate: Vl,
          /**
           * Used to detect `data` property values to inject.
           *
           * @memberOf _.templateSettings
           * @type {RegExp}
           */
          interpolate: Pa,
          /**
           * Used to reference the data object in the template text.
           *
           * @memberOf _.templateSettings
           * @type {string}
           */
          variable: "",
          /**
           * Used to import variables into the compiled template.
           *
           * @memberOf _.templateSettings
           * @type {Object}
           */
          imports: {
            /**
             * A reference to the `lodash` function.
             *
             * @memberOf _.templateSettings.imports
             * @type {Function}
             */
            _: $
          }
        }, $.prototype = Yc.prototype, $.prototype.constructor = $, ao.prototype = os(Yc.prototype), ao.prototype.constructor = ao;
        function Rt(o) {
          this.__wrapped__ = o, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = K, this.__views__ = [];
        }
        function T5() {
          var o = new Rt(this.__wrapped__);
          return o.__actions__ = kn(this.__actions__), o.__dir__ = this.__dir__, o.__filtered__ = this.__filtered__, o.__iteratees__ = kn(this.__iteratees__), o.__takeCount__ = this.__takeCount__, o.__views__ = kn(this.__views__), o;
        }
        function $5() {
          if (this.__filtered__) {
            var o = new Rt(this);
            o.__dir__ = -1, o.__filtered__ = !0;
          } else
            o = this.clone(), o.__dir__ *= -1;
          return o;
        }
        function F5() {
          var o = this.__wrapped__.value(), s = this.__dir__, v = ut(o), b = s < 0, M = v ? o.length : 0, F = W4(0, M, this.__views__), D = F.start, U = F.end, re = U - D, de = b ? U : D - 1, he = this.__iteratees__, we = he.length, $e = 0, Ue = Qr(re, this.__takeCount__);
          if (!v || !b && M == re && Ue == re)
            return cy(o, this.__actions__);
          var Ke = [];
          e:
            for (; re-- && $e < Ue; ) {
              de += s;
              for (var pt = -1, Ze = o[de]; ++pt < we; ) {
                var _t = he[pt], $t = _t.iteratee, Wn = _t.type, dn = $t(Ze);
                if (Wn == X)
                  Ze = dn;
                else if (!dn) {
                  if (Wn == H)
                    continue e;
                  break e;
                }
              }
              Ke[$e++] = Ze;
            }
          return Ke;
        }
        Rt.prototype = os(Yc.prototype), Rt.prototype.constructor = Rt;
        function Ua(o) {
          var s = -1, v = o == null ? 0 : o.length;
          for (this.clear(); ++s < v; ) {
            var b = o[s];
            this.set(b[0], b[1]);
          }
        }
        function N5() {
          this.__data__ = iu ? iu(null) : {}, this.size = 0;
        }
        function z5(o) {
          var s = this.has(o) && delete this.__data__[o];
          return this.size -= s ? 1 : 0, s;
        }
        function O5(o) {
          var s = this.__data__;
          if (iu) {
            var v = s[o];
            return v === c ? r : v;
          }
          return Qt.call(s, o) ? s[o] : r;
        }
        function B5(o) {
          var s = this.__data__;
          return iu ? s[o] !== r : Qt.call(s, o);
        }
        function D5(o, s) {
          var v = this.__data__;
          return this.size += this.has(o) ? 0 : 1, v[o] = iu && s === r ? c : s, this;
        }
        Ua.prototype.clear = N5, Ua.prototype.delete = z5, Ua.prototype.get = O5, Ua.prototype.has = B5, Ua.prototype.set = D5;
        function bi(o) {
          var s = -1, v = o == null ? 0 : o.length;
          for (this.clear(); ++s < v; ) {
            var b = o[s];
            this.set(b[0], b[1]);
          }
        }
        function P5() {
          this.__data__ = [], this.size = 0;
        }
        function L5(o) {
          var s = this.__data__, v = Kc(s, o);
          if (v < 0)
            return !1;
          var b = s.length - 1;
          return v == b ? s.pop() : Uc.call(s, v, 1), --this.size, !0;
        }
        function q5(o) {
          var s = this.__data__, v = Kc(s, o);
          return v < 0 ? r : s[v][1];
        }
        function I5(o) {
          return Kc(this.__data__, o) > -1;
        }
        function j5(o, s) {
          var v = this.__data__, b = Kc(v, o);
          return b < 0 ? (++this.size, v.push([o, s])) : v[b][1] = s, this;
        }
        bi.prototype.clear = P5, bi.prototype.delete = L5, bi.prototype.get = q5, bi.prototype.has = I5, bi.prototype.set = j5;
        function xi(o) {
          var s = -1, v = o == null ? 0 : o.length;
          for (this.clear(); ++s < v; ) {
            var b = o[s];
            this.set(b[0], b[1]);
          }
        }
        function U5() {
          this.size = 0, this.__data__ = {
            hash: new Ua(),
            map: new (nu || bi)(),
            string: new Ua()
          };
        }
        function W5(o) {
          var s = uf(this, o).delete(o);
          return this.size -= s ? 1 : 0, s;
        }
        function H5(o) {
          return uf(this, o).get(o);
        }
        function V5(o) {
          return uf(this, o).has(o);
        }
        function G5(o, s) {
          var v = uf(this, o), b = v.size;
          return v.set(o, s), this.size += v.size == b ? 0 : 1, this;
        }
        xi.prototype.clear = U5, xi.prototype.delete = W5, xi.prototype.get = H5, xi.prototype.has = V5, xi.prototype.set = G5;
        function Wa(o) {
          var s = -1, v = o == null ? 0 : o.length;
          for (this.__data__ = new xi(); ++s < v; )
            this.add(o[s]);
        }
        function X5(o) {
          return this.__data__.set(o, c), this;
        }
        function Y5(o) {
          return this.__data__.has(o);
        }
        Wa.prototype.add = Wa.prototype.push = X5, Wa.prototype.has = Y5;
        function Eo(o) {
          var s = this.__data__ = new bi(o);
          this.size = s.size;
        }
        function K5() {
          this.__data__ = new bi(), this.size = 0;
        }
        function Z5(o) {
          var s = this.__data__, v = s.delete(o);
          return this.size = s.size, v;
        }
        function Q5(o) {
          return this.__data__.get(o);
        }
        function J5(o) {
          return this.__data__.has(o);
        }
        function e4(o, s) {
          var v = this.__data__;
          if (v instanceof bi) {
            var b = v.__data__;
            if (!nu || b.length < i - 1)
              return b.push([o, s]), this.size = ++v.size, this;
            v = this.__data__ = new xi(b);
          }
          return v.set(o, s), this.size = v.size, this;
        }
        Eo.prototype.clear = K5, Eo.prototype.delete = Z5, Eo.prototype.get = Q5, Eo.prototype.has = J5, Eo.prototype.set = e4;
        function Im(o, s) {
          var v = ut(o), b = !v && Ya(o), M = !v && !b && ua(o), F = !v && !b && !M && ss(o), D = v || b || M || F, U = D ? Mh(o.length, c5) : [], re = U.length;
          for (var de in o)
            (s || Qt.call(o, de)) && !(D && // Safari 9 has enumerable `arguments.length` in strict mode.
            (de == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
            M && (de == "offset" || de == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
            F && (de == "buffer" || de == "byteLength" || de == "byteOffset") || // Skip index properties.
            Si(de, re))) && U.push(de);
          return U;
        }
        function jm(o) {
          var s = o.length;
          return s ? o[jh(0, s - 1)] : r;
        }
        function t4(o, s) {
          return cf(kn(o), Ha(s, 0, o.length));
        }
        function r4(o) {
          return cf(kn(o));
        }
        function Fh(o, s, v) {
          (v !== r && !To(o[s], v) || v === r && !(s in o)) && wi(o, s, v);
        }
        function lu(o, s, v) {
          var b = o[s];
          (!(Qt.call(o, s) && To(b, v)) || v === r && !(s in o)) && wi(o, s, v);
        }
        function Kc(o, s) {
          for (var v = o.length; v--; )
            if (To(o[v][0], s))
              return v;
          return -1;
        }
        function n4(o, s, v, b) {
          return ia(o, function(M, F, D) {
            s(b, M, v(M), D);
          }), b;
        }
        function Um(o, s) {
          return o && Ko(s, Ur(s), o);
        }
        function o4(o, s) {
          return o && Ko(s, Sn(s), o);
        }
        function wi(o, s, v) {
          s == "__proto__" && Wc ? Wc(o, s, {
            configurable: !0,
            enumerable: !0,
            value: v,
            writable: !0
          }) : o[s] = v;
        }
        function Nh(o, s) {
          for (var v = -1, b = s.length, M = ae(b), F = o == null; ++v < b; )
            M[v] = F ? r : hp(o, s[v]);
          return M;
        }
        function Ha(o, s, v) {
          return o === o && (v !== r && (o = o <= v ? o : v), s !== r && (o = o >= s ? o : s)), o;
        }
        function lo(o, s, v, b, M, F) {
          var D, U = s & p, re = s & g, de = s & m;
          if (v && (D = M ? v(o, b, M, F) : v(o)), D !== r)
            return D;
          if (!br(o))
            return o;
          var he = ut(o);
          if (he) {
            if (D = V4(o), !U)
              return kn(o, D);
          } else {
            var we = Jr(o), $e = we == ke || we == Le;
            if (ua(o))
              return hy(o, U);
            if (we == ht || we == _e || $e && !M) {
              if (D = re || $e ? {} : Fy(o), !U)
                return re ? O4(o, o4(D, o)) : z4(o, Um(D, o));
            } else {
              if (!cr[we])
                return M ? o : {};
              D = G4(o, we, U);
            }
          }
          F || (F = new Eo());
          var Ue = F.get(o);
          if (Ue)
            return Ue;
          F.set(o, D), l1(o) ? o.forEach(function(Ze) {
            D.add(lo(Ze, s, v, Ze, o, F));
          }) : i1(o) && o.forEach(function(Ze, _t) {
            D.set(_t, lo(Ze, s, v, _t, o, F));
          });
          var Ke = de ? re ? Jh : Qh : re ? Sn : Ur, pt = he ? r : Ke(o);
          return oo(pt || o, function(Ze, _t) {
            pt && (_t = Ze, Ze = o[_t]), lu(D, _t, lo(Ze, s, v, _t, o, F));
          }), D;
        }
        function i4(o) {
          var s = Ur(o);
          return function(v) {
            return Wm(v, o, s);
          };
        }
        function Wm(o, s, v) {
          var b = v.length;
          if (o == null)
            return !b;
          for (o = ir(o); b--; ) {
            var M = v[b], F = s[M], D = o[M];
            if (D === r && !(M in o) || !F(D))
              return !1;
          }
          return !0;
        }
        function Hm(o, s, v) {
          if (typeof o != "function")
            throw new io(l);
          return pu(function() {
            o.apply(r, v);
          }, s);
        }
        function su(o, s, v, b) {
          var M = -1, F = Nc, D = !0, U = o.length, re = [], de = s.length;
          if (!U)
            return re;
          v && (s = gr(s, In(v))), b ? (F = bh, D = !1) : s.length >= i && (F = tu, D = !1, s = new Wa(s));
          e:
            for (; ++M < U; ) {
              var he = o[M], we = v == null ? he : v(he);
              if (he = b || he !== 0 ? he : 0, D && we === we) {
                for (var $e = de; $e--; )
                  if (s[$e] === we)
                    continue e;
                re.push(he);
              } else F(s, we, b) || re.push(he);
            }
          return re;
        }
        var ia = yy(Yo), Vm = yy(Oh, !0);
        function a4(o, s) {
          var v = !0;
          return ia(o, function(b, M, F) {
            return v = !!s(b, M, F), v;
          }), v;
        }
        function Zc(o, s, v) {
          for (var b = -1, M = o.length; ++b < M; ) {
            var F = o[b], D = s(F);
            if (D != null && (U === r ? D === D && !Un(D) : v(D, U)))
              var U = D, re = F;
          }
          return re;
        }
        function l4(o, s, v, b) {
          var M = o.length;
          for (v = dt(v), v < 0 && (v = -v > M ? 0 : M + v), b = b === r || b > M ? M : dt(b), b < 0 && (b += M), b = v > b ? 0 : u1(b); v < b; )
            o[v++] = s;
          return o;
        }
        function Gm(o, s) {
          var v = [];
          return ia(o, function(b, M, F) {
            s(b, M, F) && v.push(b);
          }), v;
        }
        function Yr(o, s, v, b, M) {
          var F = -1, D = o.length;
          for (v || (v = Y4), M || (M = []); ++F < D; ) {
            var U = o[F];
            s > 0 && v(U) ? s > 1 ? Yr(U, s - 1, v, b, M) : ra(M, U) : b || (M[M.length] = U);
          }
          return M;
        }
        var zh = by(), Xm = by(!0);
        function Yo(o, s) {
          return o && zh(o, s, Ur);
        }
        function Oh(o, s) {
          return o && Xm(o, s, Ur);
        }
        function Qc(o, s) {
          return ta(s, function(v) {
            return Mi(o[v]);
          });
        }
        function Va(o, s) {
          s = la(s, o);
          for (var v = 0, b = s.length; o != null && v < b; )
            o = o[Zo(s[v++])];
          return v && v == b ? o : r;
        }
        function Ym(o, s, v) {
          var b = s(o);
          return ut(o) ? b : ra(b, v(o));
        }
        function cn(o) {
          return o == null ? o === r ? dr : et : ja && ja in ir(o) ? U4(o) : r6(o);
        }
        function Bh(o, s) {
          return o > s;
        }
        function s4(o, s) {
          return o != null && Qt.call(o, s);
        }
        function u4(o, s) {
          return o != null && s in ir(o);
        }
        function c4(o, s, v) {
          return o >= Qr(s, v) && o < Lr(s, v);
        }
        function Dh(o, s, v) {
          for (var b = v ? bh : Nc, M = o[0].length, F = o.length, D = F, U = ae(F), re = 1 / 0, de = []; D--; ) {
            var he = o[D];
            D && s && (he = gr(he, In(s))), re = Qr(he.length, re), U[D] = !v && (s || M >= 120 && he.length >= 120) ? new Wa(D && he) : r;
          }
          he = o[0];
          var we = -1, $e = U[0];
          e:
            for (; ++we < M && de.length < re; ) {
              var Ue = he[we], Ke = s ? s(Ue) : Ue;
              if (Ue = v || Ue !== 0 ? Ue : 0, !($e ? tu($e, Ke) : b(de, Ke, v))) {
                for (D = F; --D; ) {
                  var pt = U[D];
                  if (!(pt ? tu(pt, Ke) : b(o[D], Ke, v)))
                    continue e;
                }
                $e && $e.push(Ke), de.push(Ue);
              }
            }
          return de;
        }
        function f4(o, s, v, b) {
          return Yo(o, function(M, F, D) {
            s(b, v(M), F, D);
          }), b;
        }
        function uu(o, s, v) {
          s = la(s, o), o = By(o, s);
          var b = o == null ? o : o[Zo(uo(s))];
          return b == null ? r : qn(b, o, v);
        }
        function Km(o) {
          return wr(o) && cn(o) == _e;
        }
        function d4(o) {
          return wr(o) && cn(o) == sr;
        }
        function h4(o) {
          return wr(o) && cn(o) == ze;
        }
        function cu(o, s, v, b, M) {
          return o === s ? !0 : o == null || s == null || !wr(o) && !wr(s) ? o !== o && s !== s : p4(o, s, v, b, cu, M);
        }
        function p4(o, s, v, b, M, F) {
          var D = ut(o), U = ut(s), re = D ? be : Jr(o), de = U ? be : Jr(s);
          re = re == _e ? ht : re, de = de == _e ? ht : de;
          var he = re == ht, we = de == ht, $e = re == de;
          if ($e && ua(o)) {
            if (!ua(s))
              return !1;
            D = !0, he = !1;
          }
          if ($e && !he)
            return F || (F = new Eo()), D || ss(o) ? Ey(o, s, v, b, M, F) : I4(o, s, re, v, b, M, F);
          if (!(v & y)) {
            var Ue = he && Qt.call(o, "__wrapped__"), Ke = we && Qt.call(s, "__wrapped__");
            if (Ue || Ke) {
              var pt = Ue ? o.value() : o, Ze = Ke ? s.value() : s;
              return F || (F = new Eo()), M(pt, Ze, v, b, F);
            }
          }
          return $e ? (F || (F = new Eo()), j4(o, s, v, b, M, F)) : !1;
        }
        function v4(o) {
          return wr(o) && Jr(o) == Ie;
        }
        function Ph(o, s, v, b) {
          var M = v.length, F = M, D = !b;
          if (o == null)
            return !F;
          for (o = ir(o); M--; ) {
            var U = v[M];
            if (D && U[2] ? U[1] !== o[U[0]] : !(U[0] in o))
              return !1;
          }
          for (; ++M < F; ) {
            U = v[M];
            var re = U[0], de = o[re], he = U[1];
            if (D && U[2]) {
              if (de === r && !(re in o))
                return !1;
            } else {
              var we = new Eo();
              if (b)
                var $e = b(de, he, re, o, s, we);
              if (!($e === r ? cu(he, de, y | w, b, we) : $e))
                return !1;
            }
          }
          return !0;
        }
        function Zm(o) {
          if (!br(o) || Z4(o))
            return !1;
          var s = Mi(o) ? v5 : Tt;
          return s.test(Xa(o));
        }
        function g4(o) {
          return wr(o) && cn(o) == Xe;
        }
        function m4(o) {
          return wr(o) && Jr(o) == it;
        }
        function y4(o) {
          return wr(o) && gf(o.length) && !!hr[cn(o)];
        }
        function Qm(o) {
          return typeof o == "function" ? o : o == null ? Mn : typeof o == "object" ? ut(o) ? ty(o[0], o[1]) : ey(o) : x1(o);
        }
        function Lh(o) {
          if (!hu(o))
            return w5(o);
          var s = [];
          for (var v in ir(o))
            Qt.call(o, v) && v != "constructor" && s.push(v);
          return s;
        }
        function b4(o) {
          if (!br(o))
            return t6(o);
          var s = hu(o), v = [];
          for (var b in o)
            b == "constructor" && (s || !Qt.call(o, b)) || v.push(b);
          return v;
        }
        function qh(o, s) {
          return o < s;
        }
        function Jm(o, s) {
          var v = -1, b = _n(o) ? ae(o.length) : [];
          return ia(o, function(M, F, D) {
            b[++v] = s(M, F, D);
          }), b;
        }
        function ey(o) {
          var s = tp(o);
          return s.length == 1 && s[0][2] ? zy(s[0][0], s[0][1]) : function(v) {
            return v === o || Ph(v, o, s);
          };
        }
        function ty(o, s) {
          return np(o) && Ny(s) ? zy(Zo(o), s) : function(v) {
            var b = hp(v, o);
            return b === r && b === s ? pp(v, o) : cu(s, b, y | w);
          };
        }
        function Jc(o, s, v, b, M) {
          o !== s && zh(s, function(F, D) {
            if (M || (M = new Eo()), br(F))
              x4(o, s, D, v, Jc, b, M);
            else {
              var U = b ? b(ip(o, D), F, D + "", o, s, M) : r;
              U === r && (U = F), Fh(o, D, U);
            }
          }, Sn);
        }
        function x4(o, s, v, b, M, F, D) {
          var U = ip(o, v), re = ip(s, v), de = D.get(re);
          if (de) {
            Fh(o, v, de);
            return;
          }
          var he = F ? F(U, re, v + "", o, s, D) : r, we = he === r;
          if (we) {
            var $e = ut(re), Ue = !$e && ua(re), Ke = !$e && !Ue && ss(re);
            he = re, $e || Ue || Ke ? ut(U) ? he = U : Ar(U) ? he = kn(U) : Ue ? (we = !1, he = hy(re, !0)) : Ke ? (we = !1, he = py(re, !0)) : he = [] : vu(re) || Ya(re) ? (he = U, Ya(U) ? he = c1(U) : (!br(U) || Mi(U)) && (he = Fy(re))) : we = !1;
          }
          we && (D.set(re, he), M(he, re, b, F, D), D.delete(re)), Fh(o, v, he);
        }
        function ry(o, s) {
          var v = o.length;
          if (v)
            return s += s < 0 ? v : 0, Si(s, v) ? o[s] : r;
        }
        function ny(o, s, v) {
          s.length ? s = gr(s, function(F) {
            return ut(F) ? function(D) {
              return Va(D, F.length === 1 ? F[0] : F);
            } : F;
          }) : s = [Mn];
          var b = -1;
          s = gr(s, In(Ye()));
          var M = Jm(o, function(F, D, U) {
            var re = gr(s, function(de) {
              return de(F);
            });
            return { criteria: re, index: ++b, value: F };
          });
          return G_(M, function(F, D) {
            return N4(F, D, v);
          });
        }
        function w4(o, s) {
          return oy(o, s, function(v, b) {
            return pp(o, b);
          });
        }
        function oy(o, s, v) {
          for (var b = -1, M = s.length, F = {}; ++b < M; ) {
            var D = s[b], U = Va(o, D);
            v(U, D) && fu(F, la(D, o), U);
          }
          return F;
        }
        function k4(o) {
          return function(s) {
            return Va(s, o);
          };
        }
        function Ih(o, s, v, b) {
          var M = b ? V_ : Zl, F = -1, D = s.length, U = o;
          for (o === s && (s = kn(s)), v && (U = gr(o, In(v))); ++F < D; )
            for (var re = 0, de = s[F], he = v ? v(de) : de; (re = M(U, he, re, b)) > -1; )
              U !== o && Uc.call(U, re, 1), Uc.call(o, re, 1);
          return o;
        }
        function iy(o, s) {
          for (var v = o ? s.length : 0, b = v - 1; v--; ) {
            var M = s[v];
            if (v == b || M !== F) {
              var F = M;
              Si(M) ? Uc.call(o, M, 1) : Hh(o, M);
            }
          }
          return o;
        }
        function jh(o, s) {
          return o + Vc(Lm() * (s - o + 1));
        }
        function _4(o, s, v, b) {
          for (var M = -1, F = Lr(Hc((s - o) / (v || 1)), 0), D = ae(F); F--; )
            D[b ? F : ++M] = o, o += v;
          return D;
        }
        function Uh(o, s) {
          var v = "";
          if (!o || s < 1 || s > Z)
            return v;
          do
            s % 2 && (v += o), s = Vc(s / 2), s && (o += o);
          while (s);
          return v;
        }
        function yt(o, s) {
          return ap(Oy(o, s, Mn), o + "");
        }
        function S4(o) {
          return jm(us(o));
        }
        function M4(o, s) {
          var v = us(o);
          return cf(v, Ha(s, 0, v.length));
        }
        function fu(o, s, v, b) {
          if (!br(o))
            return o;
          s = la(s, o);
          for (var M = -1, F = s.length, D = F - 1, U = o; U != null && ++M < F; ) {
            var re = Zo(s[M]), de = v;
            if (re === "__proto__" || re === "constructor" || re === "prototype")
              return o;
            if (M != D) {
              var he = U[re];
              de = b ? b(he, re, U) : r, de === r && (de = br(he) ? he : Si(s[M + 1]) ? [] : {});
            }
            lu(U, re, de), U = U[re];
          }
          return o;
        }
        var ay = Gc ? function(o, s) {
          return Gc.set(o, s), o;
        } : Mn, C4 = Wc ? function(o, s) {
          return Wc(o, "toString", {
            configurable: !0,
            enumerable: !1,
            value: gp(s),
            writable: !0
          });
        } : Mn;
        function R4(o) {
          return cf(us(o));
        }
        function so(o, s, v) {
          var b = -1, M = o.length;
          s < 0 && (s = -s > M ? 0 : M + s), v = v > M ? M : v, v < 0 && (v += M), M = s > v ? 0 : v - s >>> 0, s >>>= 0;
          for (var F = ae(M); ++b < M; )
            F[b] = o[b + s];
          return F;
        }
        function A4(o, s) {
          var v;
          return ia(o, function(b, M, F) {
            return v = s(b, M, F), !v;
          }), !!v;
        }
        function ef(o, s, v) {
          var b = 0, M = o == null ? b : o.length;
          if (typeof s == "number" && s === s && M <= se) {
            for (; b < M; ) {
              var F = b + M >>> 1, D = o[F];
              D !== null && !Un(D) && (v ? D <= s : D < s) ? b = F + 1 : M = F;
            }
            return M;
          }
          return Wh(o, s, Mn, v);
        }
        function Wh(o, s, v, b) {
          var M = 0, F = o == null ? 0 : o.length;
          if (F === 0)
            return 0;
          s = v(s);
          for (var D = s !== s, U = s === null, re = Un(s), de = s === r; M < F; ) {
            var he = Vc((M + F) / 2), we = v(o[he]), $e = we !== r, Ue = we === null, Ke = we === we, pt = Un(we);
            if (D)
              var Ze = b || Ke;
            else de ? Ze = Ke && (b || $e) : U ? Ze = Ke && $e && (b || !Ue) : re ? Ze = Ke && $e && !Ue && (b || !pt) : Ue || pt ? Ze = !1 : Ze = b ? we <= s : we < s;
            Ze ? M = he + 1 : F = he;
          }
          return Qr(F, ie);
        }
        function ly(o, s) {
          for (var v = -1, b = o.length, M = 0, F = []; ++v < b; ) {
            var D = o[v], U = s ? s(D) : D;
            if (!v || !To(U, re)) {
              var re = U;
              F[M++] = D === 0 ? 0 : D;
            }
          }
          return F;
        }
        function sy(o) {
          return typeof o == "number" ? o : Un(o) ? I : +o;
        }
        function jn(o) {
          if (typeof o == "string")
            return o;
          if (ut(o))
            return gr(o, jn) + "";
          if (Un(o))
            return qm ? qm.call(o) : "";
          var s = o + "";
          return s == "0" && 1 / o == -G ? "-0" : s;
        }
        function aa(o, s, v) {
          var b = -1, M = Nc, F = o.length, D = !0, U = [], re = U;
          if (v)
            D = !1, M = bh;
          else if (F >= i) {
            var de = s ? null : L4(o);
            if (de)
              return Oc(de);
            D = !1, M = tu, re = new Wa();
          } else
            re = s ? [] : U;
          e:
            for (; ++b < F; ) {
              var he = o[b], we = s ? s(he) : he;
              if (he = v || he !== 0 ? he : 0, D && we === we) {
                for (var $e = re.length; $e--; )
                  if (re[$e] === we)
                    continue e;
                s && re.push(we), U.push(he);
              } else M(re, we, v) || (re !== U && re.push(we), U.push(he));
            }
          return U;
        }
        function Hh(o, s) {
          return s = la(s, o), o = By(o, s), o == null || delete o[Zo(uo(s))];
        }
        function uy(o, s, v, b) {
          return fu(o, s, v(Va(o, s)), b);
        }
        function tf(o, s, v, b) {
          for (var M = o.length, F = b ? M : -1; (b ? F-- : ++F < M) && s(o[F], F, o); )
            ;
          return v ? so(o, b ? 0 : F, b ? F + 1 : M) : so(o, b ? F + 1 : 0, b ? M : F);
        }
        function cy(o, s) {
          var v = o;
          return v instanceof Rt && (v = v.value()), xh(s, function(b, M) {
            return M.func.apply(M.thisArg, ra([b], M.args));
          }, v);
        }
        function Vh(o, s, v) {
          var b = o.length;
          if (b < 2)
            return b ? aa(o[0]) : [];
          for (var M = -1, F = ae(b); ++M < b; )
            for (var D = o[M], U = -1; ++U < b; )
              U != M && (F[M] = su(F[M] || D, o[U], s, v));
          return aa(Yr(F, 1), s, v);
        }
        function fy(o, s, v) {
          for (var b = -1, M = o.length, F = s.length, D = {}; ++b < M; ) {
            var U = b < F ? s[b] : r;
            v(D, o[b], U);
          }
          return D;
        }
        function Gh(o) {
          return Ar(o) ? o : [];
        }
        function Xh(o) {
          return typeof o == "function" ? o : Mn;
        }
        function la(o, s) {
          return ut(o) ? o : np(o, s) ? [o] : qy(Vt(o));
        }
        var E4 = yt;
        function sa(o, s, v) {
          var b = o.length;
          return v = v === r ? b : v, !s && v >= b ? o : so(o, s, v);
        }
        var dy = g5 || function(o) {
          return Xr.clearTimeout(o);
        };
        function hy(o, s) {
          if (s)
            return o.slice();
          var v = o.length, b = zm ? zm(v) : new o.constructor(v);
          return o.copy(b), b;
        }
        function Yh(o) {
          var s = new o.constructor(o.byteLength);
          return new Ic(s).set(new Ic(o)), s;
        }
        function T4(o, s) {
          var v = s ? Yh(o.buffer) : o.buffer;
          return new o.constructor(v, o.byteOffset, o.byteLength);
        }
        function $4(o) {
          var s = new o.constructor(o.source, ct.exec(o));
          return s.lastIndex = o.lastIndex, s;
        }
        function F4(o) {
          return au ? ir(au.call(o)) : {};
        }
        function py(o, s) {
          var v = s ? Yh(o.buffer) : o.buffer;
          return new o.constructor(v, o.byteOffset, o.length);
        }
        function vy(o, s) {
          if (o !== s) {
            var v = o !== r, b = o === null, M = o === o, F = Un(o), D = s !== r, U = s === null, re = s === s, de = Un(s);
            if (!U && !de && !F && o > s || F && D && re && !U && !de || b && D && re || !v && re || !M)
              return 1;
            if (!b && !F && !de && o < s || de && v && M && !b && !F || U && v && M || !D && M || !re)
              return -1;
          }
          return 0;
        }
        function N4(o, s, v) {
          for (var b = -1, M = o.criteria, F = s.criteria, D = M.length, U = v.length; ++b < D; ) {
            var re = vy(M[b], F[b]);
            if (re) {
              if (b >= U)
                return re;
              var de = v[b];
              return re * (de == "desc" ? -1 : 1);
            }
          }
          return o.index - s.index;
        }
        function gy(o, s, v, b) {
          for (var M = -1, F = o.length, D = v.length, U = -1, re = s.length, de = Lr(F - D, 0), he = ae(re + de), we = !b; ++U < re; )
            he[U] = s[U];
          for (; ++M < D; )
            (we || M < F) && (he[v[M]] = o[M]);
          for (; de--; )
            he[U++] = o[M++];
          return he;
        }
        function my(o, s, v, b) {
          for (var M = -1, F = o.length, D = -1, U = v.length, re = -1, de = s.length, he = Lr(F - U, 0), we = ae(he + de), $e = !b; ++M < he; )
            we[M] = o[M];
          for (var Ue = M; ++re < de; )
            we[Ue + re] = s[re];
          for (; ++D < U; )
            ($e || M < F) && (we[Ue + v[D]] = o[M++]);
          return we;
        }
        function kn(o, s) {
          var v = -1, b = o.length;
          for (s || (s = ae(b)); ++v < b; )
            s[v] = o[v];
          return s;
        }
        function Ko(o, s, v, b) {
          var M = !v;
          v || (v = {});
          for (var F = -1, D = s.length; ++F < D; ) {
            var U = s[F], re = b ? b(v[U], o[U], U, v, o) : r;
            re === r && (re = o[U]), M ? wi(v, U, re) : lu(v, U, re);
          }
          return v;
        }
        function z4(o, s) {
          return Ko(o, rp(o), s);
        }
        function O4(o, s) {
          return Ko(o, Ty(o), s);
        }
        function rf(o, s) {
          return function(v, b) {
            var M = ut(v) ? q_ : n4, F = s ? s() : {};
            return M(v, o, Ye(b, 2), F);
          };
        }
        function is(o) {
          return yt(function(s, v) {
            var b = -1, M = v.length, F = M > 1 ? v[M - 1] : r, D = M > 2 ? v[2] : r;
            for (F = o.length > 3 && typeof F == "function" ? (M--, F) : r, D && fn(v[0], v[1], D) && (F = M < 3 ? r : F, M = 1), s = ir(s); ++b < M; ) {
              var U = v[b];
              U && o(s, U, b, F);
            }
            return s;
          });
        }
        function yy(o, s) {
          return function(v, b) {
            if (v == null)
              return v;
            if (!_n(v))
              return o(v, b);
            for (var M = v.length, F = s ? M : -1, D = ir(v); (s ? F-- : ++F < M) && b(D[F], F, D) !== !1; )
              ;
            return v;
          };
        }
        function by(o) {
          return function(s, v, b) {
            for (var M = -1, F = ir(s), D = b(s), U = D.length; U--; ) {
              var re = D[o ? U : ++M];
              if (v(F[re], re, F) === !1)
                break;
            }
            return s;
          };
        }
        function B4(o, s, v) {
          var b = s & x, M = du(o);
          function F() {
            var D = this && this !== Xr && this instanceof F ? M : o;
            return D.apply(b ? v : this, arguments);
          }
          return F;
        }
        function xy(o) {
          return function(s) {
            s = Vt(s);
            var v = Ql(s) ? Ao(s) : r, b = v ? v[0] : s.charAt(0), M = v ? sa(v, 1).join("") : s.slice(1);
            return b[o]() + M;
          };
        }
        function as(o) {
          return function(s) {
            return xh(y1(m1(s).replace(C_, "")), o, "");
          };
        }
        function du(o) {
          return function() {
            var s = arguments;
            switch (s.length) {
              case 0:
                return new o();
              case 1:
                return new o(s[0]);
              case 2:
                return new o(s[0], s[1]);
              case 3:
                return new o(s[0], s[1], s[2]);
              case 4:
                return new o(s[0], s[1], s[2], s[3]);
              case 5:
                return new o(s[0], s[1], s[2], s[3], s[4]);
              case 6:
                return new o(s[0], s[1], s[2], s[3], s[4], s[5]);
              case 7:
                return new o(s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
            }
            var v = os(o.prototype), b = o.apply(v, s);
            return br(b) ? b : v;
          };
        }
        function D4(o, s, v) {
          var b = du(o);
          function M() {
            for (var F = arguments.length, D = ae(F), U = F, re = ls(M); U--; )
              D[U] = arguments[U];
            var de = F < 3 && D[0] !== re && D[F - 1] !== re ? [] : na(D, re);
            if (F -= de.length, F < v)
              return My(
                o,
                s,
                nf,
                M.placeholder,
                r,
                D,
                de,
                r,
                r,
                v - F
              );
            var he = this && this !== Xr && this instanceof M ? b : o;
            return qn(he, this, D);
          }
          return M;
        }
        function wy(o) {
          return function(s, v, b) {
            var M = ir(s);
            if (!_n(s)) {
              var F = Ye(v, 3);
              s = Ur(s), v = function(U) {
                return F(M[U], U, M);
              };
            }
            var D = o(s, v, b);
            return D > -1 ? M[F ? s[D] : D] : r;
          };
        }
        function ky(o) {
          return _i(function(s) {
            var v = s.length, b = v, M = ao.prototype.thru;
            for (o && s.reverse(); b--; ) {
              var F = s[b];
              if (typeof F != "function")
                throw new io(l);
              if (M && !D && sf(F) == "wrapper")
                var D = new ao([], !0);
            }
            for (b = D ? b : v; ++b < v; ) {
              F = s[b];
              var U = sf(F), re = U == "wrapper" ? ep(F) : r;
              re && op(re[0]) && re[1] == (A | _ | C | N) && !re[4].length && re[9] == 1 ? D = D[sf(re[0])].apply(D, re[3]) : D = F.length == 1 && op(F) ? D[U]() : D.thru(F);
            }
            return function() {
              var de = arguments, he = de[0];
              if (D && de.length == 1 && ut(he))
                return D.plant(he).value();
              for (var we = 0, $e = v ? s[we].apply(this, de) : he; ++we < v; )
                $e = s[we].call(this, $e);
              return $e;
            };
          });
        }
        function nf(o, s, v, b, M, F, D, U, re, de) {
          var he = s & A, we = s & x, $e = s & k, Ue = s & (_ | E), Ke = s & L, pt = $e ? r : du(o);
          function Ze() {
            for (var _t = arguments.length, $t = ae(_t), Wn = _t; Wn--; )
              $t[Wn] = arguments[Wn];
            if (Ue)
              var dn = ls(Ze), Hn = Y_($t, dn);
            if (b && ($t = gy($t, b, M, Ue)), F && ($t = my($t, F, D, Ue)), _t -= Hn, Ue && _t < de) {
              var Er = na($t, dn);
              return My(
                o,
                s,
                nf,
                Ze.placeholder,
                v,
                $t,
                Er,
                U,
                re,
                de - _t
              );
            }
            var $o = we ? v : this, Ri = $e ? $o[o] : o;
            return _t = $t.length, U ? $t = n6($t, U) : Ke && _t > 1 && $t.reverse(), he && re < _t && ($t.length = re), this && this !== Xr && this instanceof Ze && (Ri = pt || du(Ri)), Ri.apply($o, $t);
          }
          return Ze;
        }
        function _y(o, s) {
          return function(v, b) {
            return f4(v, o, s(b), {});
          };
        }
        function of(o, s) {
          return function(v, b) {
            var M;
            if (v === r && b === r)
              return s;
            if (v !== r && (M = v), b !== r) {
              if (M === r)
                return b;
              typeof v == "string" || typeof b == "string" ? (v = jn(v), b = jn(b)) : (v = sy(v), b = sy(b)), M = o(v, b);
            }
            return M;
          };
        }
        function Kh(o) {
          return _i(function(s) {
            return s = gr(s, In(Ye())), yt(function(v) {
              var b = this;
              return o(s, function(M) {
                return qn(M, b, v);
              });
            });
          });
        }
        function af(o, s) {
          s = s === r ? " " : jn(s);
          var v = s.length;
          if (v < 2)
            return v ? Uh(s, o) : s;
          var b = Uh(s, Hc(o / Jl(s)));
          return Ql(s) ? sa(Ao(b), 0, o).join("") : b.slice(0, o);
        }
        function P4(o, s, v, b) {
          var M = s & x, F = du(o);
          function D() {
            for (var U = -1, re = arguments.length, de = -1, he = b.length, we = ae(he + re), $e = this && this !== Xr && this instanceof D ? F : o; ++de < he; )
              we[de] = b[de];
            for (; re--; )
              we[de++] = arguments[++U];
            return qn($e, M ? v : this, we);
          }
          return D;
        }
        function Sy(o) {
          return function(s, v, b) {
            return b && typeof b != "number" && fn(s, v, b) && (v = b = r), s = Ci(s), v === r ? (v = s, s = 0) : v = Ci(v), b = b === r ? s < v ? 1 : -1 : Ci(b), _4(s, v, b, o);
          };
        }
        function lf(o) {
          return function(s, v) {
            return typeof s == "string" && typeof v == "string" || (s = co(s), v = co(v)), o(s, v);
          };
        }
        function My(o, s, v, b, M, F, D, U, re, de) {
          var he = s & _, we = he ? D : r, $e = he ? r : D, Ue = he ? F : r, Ke = he ? r : F;
          s |= he ? C : R, s &= ~(he ? R : C), s & S || (s &= -4);
          var pt = [
            o,
            s,
            M,
            Ue,
            we,
            Ke,
            $e,
            U,
            re,
            de
          ], Ze = v.apply(r, pt);
          return op(o) && Dy(Ze, pt), Ze.placeholder = b, Py(Ze, o, s);
        }
        function Zh(o) {
          var s = Pr[o];
          return function(v, b) {
            if (v = co(v), b = b == null ? 0 : Qr(dt(b), 292), b && Pm(v)) {
              var M = (Vt(v) + "e").split("e"), F = s(M[0] + "e" + (+M[1] + b));
              return M = (Vt(F) + "e").split("e"), +(M[0] + "e" + (+M[1] - b));
            }
            return s(v);
          };
        }
        var L4 = rs && 1 / Oc(new rs([, -0]))[1] == G ? function(o) {
          return new rs(o);
        } : bp;
        function Cy(o) {
          return function(s) {
            var v = Jr(s);
            return v == Ie ? Rh(s) : v == it ? r5(s) : X_(s, o(s));
          };
        }
        function ki(o, s, v, b, M, F, D, U) {
          var re = s & k;
          if (!re && typeof o != "function")
            throw new io(l);
          var de = b ? b.length : 0;
          if (de || (s &= -97, b = M = r), D = D === r ? D : Lr(dt(D), 0), U = U === r ? U : dt(U), de -= M ? M.length : 0, s & R) {
            var he = b, we = M;
            b = M = r;
          }
          var $e = re ? r : ep(o), Ue = [
            o,
            s,
            v,
            b,
            M,
            he,
            we,
            F,
            D,
            U
          ];
          if ($e && e6(Ue, $e), o = Ue[0], s = Ue[1], v = Ue[2], b = Ue[3], M = Ue[4], U = Ue[9] = Ue[9] === r ? re ? 0 : o.length : Lr(Ue[9] - de, 0), !U && s & (_ | E) && (s &= -25), !s || s == x)
            var Ke = B4(o, s, v);
          else s == _ || s == E ? Ke = D4(o, s, U) : (s == C || s == (x | C)) && !M.length ? Ke = P4(o, s, v, b) : Ke = nf.apply(r, Ue);
          var pt = $e ? ay : Dy;
          return Py(pt(Ke, Ue), o, s);
        }
        function Ry(o, s, v, b) {
          return o === r || To(o, ts[v]) && !Qt.call(b, v) ? s : o;
        }
        function Ay(o, s, v, b, M, F) {
          return br(o) && br(s) && (F.set(s, o), Jc(o, s, r, Ay, F), F.delete(s)), o;
        }
        function q4(o) {
          return vu(o) ? r : o;
        }
        function Ey(o, s, v, b, M, F) {
          var D = v & y, U = o.length, re = s.length;
          if (U != re && !(D && re > U))
            return !1;
          var de = F.get(o), he = F.get(s);
          if (de && he)
            return de == s && he == o;
          var we = -1, $e = !0, Ue = v & w ? new Wa() : r;
          for (F.set(o, s), F.set(s, o); ++we < U; ) {
            var Ke = o[we], pt = s[we];
            if (b)
              var Ze = D ? b(pt, Ke, we, s, o, F) : b(Ke, pt, we, o, s, F);
            if (Ze !== r) {
              if (Ze)
                continue;
              $e = !1;
              break;
            }
            if (Ue) {
              if (!wh(s, function(_t, $t) {
                if (!tu(Ue, $t) && (Ke === _t || M(Ke, _t, v, b, F)))
                  return Ue.push($t);
              })) {
                $e = !1;
                break;
              }
            } else if (!(Ke === pt || M(Ke, pt, v, b, F))) {
              $e = !1;
              break;
            }
          }
          return F.delete(o), F.delete(s), $e;
        }
        function I4(o, s, v, b, M, F, D) {
          switch (v) {
            case zt:
              if (o.byteLength != s.byteLength || o.byteOffset != s.byteOffset)
                return !1;
              o = o.buffer, s = s.buffer;
            case sr:
              return !(o.byteLength != s.byteLength || !F(new Ic(o), new Ic(s)));
            case Ae:
            case ze:
            case je:
              return To(+o, +s);
            case xe:
              return o.name == s.name && o.message == s.message;
            case Xe:
            case Ht:
              return o == s + "";
            case Ie:
              var U = Rh;
            case it:
              var re = b & y;
              if (U || (U = Oc), o.size != s.size && !re)
                return !1;
              var de = D.get(o);
              if (de)
                return de == s;
              b |= w, D.set(o, s);
              var he = Ey(U(o), U(s), b, M, F, D);
              return D.delete(o), he;
            case nt:
              if (au)
                return au.call(o) == au.call(s);
          }
          return !1;
        }
        function j4(o, s, v, b, M, F) {
          var D = v & y, U = Qh(o), re = U.length, de = Qh(s), he = de.length;
          if (re != he && !D)
            return !1;
          for (var we = re; we--; ) {
            var $e = U[we];
            if (!(D ? $e in s : Qt.call(s, $e)))
              return !1;
          }
          var Ue = F.get(o), Ke = F.get(s);
          if (Ue && Ke)
            return Ue == s && Ke == o;
          var pt = !0;
          F.set(o, s), F.set(s, o);
          for (var Ze = D; ++we < re; ) {
            $e = U[we];
            var _t = o[$e], $t = s[$e];
            if (b)
              var Wn = D ? b($t, _t, $e, s, o, F) : b(_t, $t, $e, o, s, F);
            if (!(Wn === r ? _t === $t || M(_t, $t, v, b, F) : Wn)) {
              pt = !1;
              break;
            }
            Ze || (Ze = $e == "constructor");
          }
          if (pt && !Ze) {
            var dn = o.constructor, Hn = s.constructor;
            dn != Hn && "constructor" in o && "constructor" in s && !(typeof dn == "function" && dn instanceof dn && typeof Hn == "function" && Hn instanceof Hn) && (pt = !1);
          }
          return F.delete(o), F.delete(s), pt;
        }
        function _i(o) {
          return ap(Oy(o, r, Wy), o + "");
        }
        function Qh(o) {
          return Ym(o, Ur, rp);
        }
        function Jh(o) {
          return Ym(o, Sn, Ty);
        }
        var ep = Gc ? function(o) {
          return Gc.get(o);
        } : bp;
        function sf(o) {
          for (var s = o.name + "", v = ns[s], b = Qt.call(ns, s) ? v.length : 0; b--; ) {
            var M = v[b], F = M.func;
            if (F == null || F == o)
              return M.name;
          }
          return s;
        }
        function ls(o) {
          var s = Qt.call($, "placeholder") ? $ : o;
          return s.placeholder;
        }
        function Ye() {
          var o = $.iteratee || mp;
          return o = o === mp ? Qm : o, arguments.length ? o(arguments[0], arguments[1]) : o;
        }
        function uf(o, s) {
          var v = o.__data__;
          return K4(s) ? v[typeof s == "string" ? "string" : "hash"] : v.map;
        }
        function tp(o) {
          for (var s = Ur(o), v = s.length; v--; ) {
            var b = s[v], M = o[b];
            s[v] = [b, M, Ny(M)];
          }
          return s;
        }
        function Ga(o, s) {
          var v = J_(o, s);
          return Zm(v) ? v : r;
        }
        function U4(o) {
          var s = Qt.call(o, ja), v = o[ja];
          try {
            o[ja] = r;
            var b = !0;
          } catch {
          }
          var M = Lc.call(o);
          return b && (s ? o[ja] = v : delete o[ja]), M;
        }
        var rp = Eh ? function(o) {
          return o == null ? [] : (o = ir(o), ta(Eh(o), function(s) {
            return Bm.call(o, s);
          }));
        } : xp, Ty = Eh ? function(o) {
          for (var s = []; o; )
            ra(s, rp(o)), o = jc(o);
          return s;
        } : xp, Jr = cn;
        (Th && Jr(new Th(new ArrayBuffer(1))) != zt || nu && Jr(new nu()) != Ie || $h && Jr($h.resolve()) != xt || rs && Jr(new rs()) != it || ou && Jr(new ou()) != qt) && (Jr = function(o) {
          var s = cn(o), v = s == ht ? o.constructor : r, b = v ? Xa(v) : "";
          if (b)
            switch (b) {
              case M5:
                return zt;
              case C5:
                return Ie;
              case R5:
                return xt;
              case A5:
                return it;
              case E5:
                return qt;
            }
          return s;
        });
        function W4(o, s, v) {
          for (var b = -1, M = v.length; ++b < M; ) {
            var F = v[b], D = F.size;
            switch (F.type) {
              case "drop":
                o += D;
                break;
              case "dropRight":
                s -= D;
                break;
              case "take":
                s = Qr(s, o + D);
                break;
              case "takeRight":
                o = Lr(o, s - D);
                break;
            }
          }
          return { start: o, end: s };
        }
        function H4(o) {
          var s = o.match(De);
          return s ? s[1].split(st) : [];
        }
        function $y(o, s, v) {
          s = la(s, o);
          for (var b = -1, M = s.length, F = !1; ++b < M; ) {
            var D = Zo(s[b]);
            if (!(F = o != null && v(o, D)))
              break;
            o = o[D];
          }
          return F || ++b != M ? F : (M = o == null ? 0 : o.length, !!M && gf(M) && Si(D, M) && (ut(o) || Ya(o)));
        }
        function V4(o) {
          var s = o.length, v = new o.constructor(s);
          return s && typeof o[0] == "string" && Qt.call(o, "index") && (v.index = o.index, v.input = o.input), v;
        }
        function Fy(o) {
          return typeof o.constructor == "function" && !hu(o) ? os(jc(o)) : {};
        }
        function G4(o, s, v) {
          var b = o.constructor;
          switch (s) {
            case sr:
              return Yh(o);
            case Ae:
            case ze:
              return new b(+o);
            case zt:
              return T4(o, v);
            case Ot:
            case vr:
            case xn:
            case wn:
            case Ki:
            case yi:
            case Ro:
            case Zi:
            case Oa:
              return py(o, v);
            case Ie:
              return new b();
            case je:
            case Ht:
              return new b(o);
            case Xe:
              return $4(o);
            case it:
              return new b();
            case nt:
              return F4(o);
          }
        }
        function X4(o, s) {
          var v = s.length;
          if (!v)
            return o;
          var b = v - 1;
          return s[b] = (v > 1 ? "& " : "") + s[b], s = s.join(v > 2 ? ", " : " "), o.replace(Oe, `{
/* [wrapped with ` + s + `] */
`);
        }
        function Y4(o) {
          return ut(o) || Ya(o) || !!(Dm && o && o[Dm]);
        }
        function Si(o, s) {
          var v = typeof o;
          return s = s ?? Z, !!s && (v == "number" || v != "symbol" && Ct.test(o)) && o > -1 && o % 1 == 0 && o < s;
        }
        function fn(o, s, v) {
          if (!br(v))
            return !1;
          var b = typeof s;
          return (b == "number" ? _n(v) && Si(s, v.length) : b == "string" && s in v) ? To(v[s], o) : !1;
        }
        function np(o, s) {
          if (ut(o))
            return !1;
          var v = typeof o;
          return v == "number" || v == "symbol" || v == "boolean" || o == null || Un(o) ? !0 : eu.test(o) || !La.test(o) || s != null && o in ir(s);
        }
        function K4(o) {
          var s = typeof o;
          return s == "string" || s == "number" || s == "symbol" || s == "boolean" ? o !== "__proto__" : o === null;
        }
        function op(o) {
          var s = sf(o), v = $[s];
          if (typeof v != "function" || !(s in Rt.prototype))
            return !1;
          if (o === v)
            return !0;
          var b = ep(v);
          return !!b && o === b[0];
        }
        function Z4(o) {
          return !!Nm && Nm in o;
        }
        var Q4 = Dc ? Mi : wp;
        function hu(o) {
          var s = o && o.constructor, v = typeof s == "function" && s.prototype || ts;
          return o === v;
        }
        function Ny(o) {
          return o === o && !br(o);
        }
        function zy(o, s) {
          return function(v) {
            return v == null ? !1 : v[o] === s && (s !== r || o in ir(v));
          };
        }
        function J4(o) {
          var s = pf(o, function(b) {
            return v.size === f && v.clear(), b;
          }), v = s.cache;
          return s;
        }
        function e6(o, s) {
          var v = o[1], b = s[1], M = v | b, F = M < (x | k | A), D = b == A && v == _ || b == A && v == N && o[7].length <= s[8] || b == (A | N) && s[7].length <= s[8] && v == _;
          if (!(F || D))
            return o;
          b & x && (o[2] = s[2], M |= v & x ? 0 : S);
          var U = s[3];
          if (U) {
            var re = o[3];
            o[3] = re ? gy(re, U, s[4]) : U, o[4] = re ? na(o[3], d) : s[4];
          }
          return U = s[5], U && (re = o[5], o[5] = re ? my(re, U, s[6]) : U, o[6] = re ? na(o[5], d) : s[6]), U = s[7], U && (o[7] = U), b & A && (o[8] = o[8] == null ? s[8] : Qr(o[8], s[8])), o[9] == null && (o[9] = s[9]), o[0] = s[0], o[1] = M, o;
        }
        function t6(o) {
          var s = [];
          if (o != null)
            for (var v in ir(o))
              s.push(v);
          return s;
        }
        function r6(o) {
          return Lc.call(o);
        }
        function Oy(o, s, v) {
          return s = Lr(s === r ? o.length - 1 : s, 0), function() {
            for (var b = arguments, M = -1, F = Lr(b.length - s, 0), D = ae(F); ++M < F; )
              D[M] = b[s + M];
            M = -1;
            for (var U = ae(s + 1); ++M < s; )
              U[M] = b[M];
            return U[s] = v(D), qn(o, this, U);
          };
        }
        function By(o, s) {
          return s.length < 2 ? o : Va(o, so(s, 0, -1));
        }
        function n6(o, s) {
          for (var v = o.length, b = Qr(s.length, v), M = kn(o); b--; ) {
            var F = s[b];
            o[b] = Si(F, v) ? M[F] : r;
          }
          return o;
        }
        function ip(o, s) {
          if (!(s === "constructor" && typeof o[s] == "function") && s != "__proto__")
            return o[s];
        }
        var Dy = Ly(ay), pu = y5 || function(o, s) {
          return Xr.setTimeout(o, s);
        }, ap = Ly(C4);
        function Py(o, s, v) {
          var b = s + "";
          return ap(o, X4(b, o6(H4(b), v)));
        }
        function Ly(o) {
          var s = 0, v = 0;
          return function() {
            var b = k5(), M = q - (b - v);
            if (v = b, M > 0) {
              if (++s >= P)
                return arguments[0];
            } else
              s = 0;
            return o.apply(r, arguments);
          };
        }
        function cf(o, s) {
          var v = -1, b = o.length, M = b - 1;
          for (s = s === r ? b : s; ++v < s; ) {
            var F = jh(v, M), D = o[F];
            o[F] = o[v], o[v] = D;
          }
          return o.length = s, o;
        }
        var qy = J4(function(o) {
          var s = [];
          return o.charCodeAt(0) === 46 && s.push(""), o.replace(Gl, function(v, b, M, F) {
            s.push(M ? F.replace(me, "$1") : b || v);
          }), s;
        });
        function Zo(o) {
          if (typeof o == "string" || Un(o))
            return o;
          var s = o + "";
          return s == "0" && 1 / o == -G ? "-0" : s;
        }
        function Xa(o) {
          if (o != null) {
            try {
              return Pc.call(o);
            } catch {
            }
            try {
              return o + "";
            } catch {
            }
          }
          return "";
        }
        function o6(o, s) {
          return oo(ye, function(v) {
            var b = "_." + v[0];
            s & v[1] && !Nc(o, b) && o.push(b);
          }), o.sort();
        }
        function Iy(o) {
          if (o instanceof Rt)
            return o.clone();
          var s = new ao(o.__wrapped__, o.__chain__);
          return s.__actions__ = kn(o.__actions__), s.__index__ = o.__index__, s.__values__ = o.__values__, s;
        }
        function i6(o, s, v) {
          (v ? fn(o, s, v) : s === r) ? s = 1 : s = Lr(dt(s), 0);
          var b = o == null ? 0 : o.length;
          if (!b || s < 1)
            return [];
          for (var M = 0, F = 0, D = ae(Hc(b / s)); M < b; )
            D[F++] = so(o, M, M += s);
          return D;
        }
        function a6(o) {
          for (var s = -1, v = o == null ? 0 : o.length, b = 0, M = []; ++s < v; ) {
            var F = o[s];
            F && (M[b++] = F);
          }
          return M;
        }
        function l6() {
          var o = arguments.length;
          if (!o)
            return [];
          for (var s = ae(o - 1), v = arguments[0], b = o; b--; )
            s[b - 1] = arguments[b];
          return ra(ut(v) ? kn(v) : [v], Yr(s, 1));
        }
        var s6 = yt(function(o, s) {
          return Ar(o) ? su(o, Yr(s, 1, Ar, !0)) : [];
        }), u6 = yt(function(o, s) {
          var v = uo(s);
          return Ar(v) && (v = r), Ar(o) ? su(o, Yr(s, 1, Ar, !0), Ye(v, 2)) : [];
        }), c6 = yt(function(o, s) {
          var v = uo(s);
          return Ar(v) && (v = r), Ar(o) ? su(o, Yr(s, 1, Ar, !0), r, v) : [];
        });
        function f6(o, s, v) {
          var b = o == null ? 0 : o.length;
          return b ? (s = v || s === r ? 1 : dt(s), so(o, s < 0 ? 0 : s, b)) : [];
        }
        function d6(o, s, v) {
          var b = o == null ? 0 : o.length;
          return b ? (s = v || s === r ? 1 : dt(s), s = b - s, so(o, 0, s < 0 ? 0 : s)) : [];
        }
        function h6(o, s) {
          return o && o.length ? tf(o, Ye(s, 3), !0, !0) : [];
        }
        function p6(o, s) {
          return o && o.length ? tf(o, Ye(s, 3), !0) : [];
        }
        function v6(o, s, v, b) {
          var M = o == null ? 0 : o.length;
          return M ? (v && typeof v != "number" && fn(o, s, v) && (v = 0, b = M), l4(o, s, v, b)) : [];
        }
        function jy(o, s, v) {
          var b = o == null ? 0 : o.length;
          if (!b)
            return -1;
          var M = v == null ? 0 : dt(v);
          return M < 0 && (M = Lr(b + M, 0)), zc(o, Ye(s, 3), M);
        }
        function Uy(o, s, v) {
          var b = o == null ? 0 : o.length;
          if (!b)
            return -1;
          var M = b - 1;
          return v !== r && (M = dt(v), M = v < 0 ? Lr(b + M, 0) : Qr(M, b - 1)), zc(o, Ye(s, 3), M, !0);
        }
        function Wy(o) {
          var s = o == null ? 0 : o.length;
          return s ? Yr(o, 1) : [];
        }
        function g6(o) {
          var s = o == null ? 0 : o.length;
          return s ? Yr(o, G) : [];
        }
        function m6(o, s) {
          var v = o == null ? 0 : o.length;
          return v ? (s = s === r ? 1 : dt(s), Yr(o, s)) : [];
        }
        function y6(o) {
          for (var s = -1, v = o == null ? 0 : o.length, b = {}; ++s < v; ) {
            var M = o[s];
            b[M[0]] = M[1];
          }
          return b;
        }
        function Hy(o) {
          return o && o.length ? o[0] : r;
        }
        function b6(o, s, v) {
          var b = o == null ? 0 : o.length;
          if (!b)
            return -1;
          var M = v == null ? 0 : dt(v);
          return M < 0 && (M = Lr(b + M, 0)), Zl(o, s, M);
        }
        function x6(o) {
          var s = o == null ? 0 : o.length;
          return s ? so(o, 0, -1) : [];
        }
        var w6 = yt(function(o) {
          var s = gr(o, Gh);
          return s.length && s[0] === o[0] ? Dh(s) : [];
        }), k6 = yt(function(o) {
          var s = uo(o), v = gr(o, Gh);
          return s === uo(v) ? s = r : v.pop(), v.length && v[0] === o[0] ? Dh(v, Ye(s, 2)) : [];
        }), _6 = yt(function(o) {
          var s = uo(o), v = gr(o, Gh);
          return s = typeof s == "function" ? s : r, s && v.pop(), v.length && v[0] === o[0] ? Dh(v, r, s) : [];
        });
        function S6(o, s) {
          return o == null ? "" : x5.call(o, s);
        }
        function uo(o) {
          var s = o == null ? 0 : o.length;
          return s ? o[s - 1] : r;
        }
        function M6(o, s, v) {
          var b = o == null ? 0 : o.length;
          if (!b)
            return -1;
          var M = b;
          return v !== r && (M = dt(v), M = M < 0 ? Lr(b + M, 0) : Qr(M, b - 1)), s === s ? o5(o, s, M) : zc(o, Mm, M, !0);
        }
        function C6(o, s) {
          return o && o.length ? ry(o, dt(s)) : r;
        }
        var R6 = yt(Vy);
        function Vy(o, s) {
          return o && o.length && s && s.length ? Ih(o, s) : o;
        }
        function A6(o, s, v) {
          return o && o.length && s && s.length ? Ih(o, s, Ye(v, 2)) : o;
        }
        function E6(o, s, v) {
          return o && o.length && s && s.length ? Ih(o, s, r, v) : o;
        }
        var T6 = _i(function(o, s) {
          var v = o == null ? 0 : o.length, b = Nh(o, s);
          return iy(o, gr(s, function(M) {
            return Si(M, v) ? +M : M;
          }).sort(vy)), b;
        });
        function $6(o, s) {
          var v = [];
          if (!(o && o.length))
            return v;
          var b = -1, M = [], F = o.length;
          for (s = Ye(s, 3); ++b < F; ) {
            var D = o[b];
            s(D, b, o) && (v.push(D), M.push(b));
          }
          return iy(o, M), v;
        }
        function lp(o) {
          return o == null ? o : S5.call(o);
        }
        function F6(o, s, v) {
          var b = o == null ? 0 : o.length;
          return b ? (v && typeof v != "number" && fn(o, s, v) ? (s = 0, v = b) : (s = s == null ? 0 : dt(s), v = v === r ? b : dt(v)), so(o, s, v)) : [];
        }
        function N6(o, s) {
          return ef(o, s);
        }
        function z6(o, s, v) {
          return Wh(o, s, Ye(v, 2));
        }
        function O6(o, s) {
          var v = o == null ? 0 : o.length;
          if (v) {
            var b = ef(o, s);
            if (b < v && To(o[b], s))
              return b;
          }
          return -1;
        }
        function B6(o, s) {
          return ef(o, s, !0);
        }
        function D6(o, s, v) {
          return Wh(o, s, Ye(v, 2), !0);
        }
        function P6(o, s) {
          var v = o == null ? 0 : o.length;
          if (v) {
            var b = ef(o, s, !0) - 1;
            if (To(o[b], s))
              return b;
          }
          return -1;
        }
        function L6(o) {
          return o && o.length ? ly(o) : [];
        }
        function q6(o, s) {
          return o && o.length ? ly(o, Ye(s, 2)) : [];
        }
        function I6(o) {
          var s = o == null ? 0 : o.length;
          return s ? so(o, 1, s) : [];
        }
        function j6(o, s, v) {
          return o && o.length ? (s = v || s === r ? 1 : dt(s), so(o, 0, s < 0 ? 0 : s)) : [];
        }
        function U6(o, s, v) {
          var b = o == null ? 0 : o.length;
          return b ? (s = v || s === r ? 1 : dt(s), s = b - s, so(o, s < 0 ? 0 : s, b)) : [];
        }
        function W6(o, s) {
          return o && o.length ? tf(o, Ye(s, 3), !1, !0) : [];
        }
        function H6(o, s) {
          return o && o.length ? tf(o, Ye(s, 3)) : [];
        }
        var V6 = yt(function(o) {
          return aa(Yr(o, 1, Ar, !0));
        }), G6 = yt(function(o) {
          var s = uo(o);
          return Ar(s) && (s = r), aa(Yr(o, 1, Ar, !0), Ye(s, 2));
        }), X6 = yt(function(o) {
          var s = uo(o);
          return s = typeof s == "function" ? s : r, aa(Yr(o, 1, Ar, !0), r, s);
        });
        function Y6(o) {
          return o && o.length ? aa(o) : [];
        }
        function K6(o, s) {
          return o && o.length ? aa(o, Ye(s, 2)) : [];
        }
        function Z6(o, s) {
          return s = typeof s == "function" ? s : r, o && o.length ? aa(o, r, s) : [];
        }
        function sp(o) {
          if (!(o && o.length))
            return [];
          var s = 0;
          return o = ta(o, function(v) {
            if (Ar(v))
              return s = Lr(v.length, s), !0;
          }), Mh(s, function(v) {
            return gr(o, kh(v));
          });
        }
        function Gy(o, s) {
          if (!(o && o.length))
            return [];
          var v = sp(o);
          return s == null ? v : gr(v, function(b) {
            return qn(s, r, b);
          });
        }
        var Q6 = yt(function(o, s) {
          return Ar(o) ? su(o, s) : [];
        }), J6 = yt(function(o) {
          return Vh(ta(o, Ar));
        }), e7 = yt(function(o) {
          var s = uo(o);
          return Ar(s) && (s = r), Vh(ta(o, Ar), Ye(s, 2));
        }), t7 = yt(function(o) {
          var s = uo(o);
          return s = typeof s == "function" ? s : r, Vh(ta(o, Ar), r, s);
        }), r7 = yt(sp);
        function n7(o, s) {
          return fy(o || [], s || [], lu);
        }
        function o7(o, s) {
          return fy(o || [], s || [], fu);
        }
        var i7 = yt(function(o) {
          var s = o.length, v = s > 1 ? o[s - 1] : r;
          return v = typeof v == "function" ? (o.pop(), v) : r, Gy(o, v);
        });
        function Xy(o) {
          var s = $(o);
          return s.__chain__ = !0, s;
        }
        function a7(o, s) {
          return s(o), o;
        }
        function ff(o, s) {
          return s(o);
        }
        var l7 = _i(function(o) {
          var s = o.length, v = s ? o[0] : 0, b = this.__wrapped__, M = function(F) {
            return Nh(F, o);
          };
          return s > 1 || this.__actions__.length || !(b instanceof Rt) || !Si(v) ? this.thru(M) : (b = b.slice(v, +v + (s ? 1 : 0)), b.__actions__.push({
            func: ff,
            args: [M],
            thisArg: r
          }), new ao(b, this.__chain__).thru(function(F) {
            return s && !F.length && F.push(r), F;
          }));
        });
        function s7() {
          return Xy(this);
        }
        function u7() {
          return new ao(this.value(), this.__chain__);
        }
        function c7() {
          this.__values__ === r && (this.__values__ = s1(this.value()));
          var o = this.__index__ >= this.__values__.length, s = o ? r : this.__values__[this.__index__++];
          return { done: o, value: s };
        }
        function f7() {
          return this;
        }
        function d7(o) {
          for (var s, v = this; v instanceof Yc; ) {
            var b = Iy(v);
            b.__index__ = 0, b.__values__ = r, s ? M.__wrapped__ = b : s = b;
            var M = b;
            v = v.__wrapped__;
          }
          return M.__wrapped__ = o, s;
        }
        function h7() {
          var o = this.__wrapped__;
          if (o instanceof Rt) {
            var s = o;
            return this.__actions__.length && (s = new Rt(this)), s = s.reverse(), s.__actions__.push({
              func: ff,
              args: [lp],
              thisArg: r
            }), new ao(s, this.__chain__);
          }
          return this.thru(lp);
        }
        function p7() {
          return cy(this.__wrapped__, this.__actions__);
        }
        var v7 = rf(function(o, s, v) {
          Qt.call(o, v) ? ++o[v] : wi(o, v, 1);
        });
        function g7(o, s, v) {
          var b = ut(o) ? _m : a4;
          return v && fn(o, s, v) && (s = r), b(o, Ye(s, 3));
        }
        function m7(o, s) {
          var v = ut(o) ? ta : Gm;
          return v(o, Ye(s, 3));
        }
        var y7 = wy(jy), b7 = wy(Uy);
        function x7(o, s) {
          return Yr(df(o, s), 1);
        }
        function w7(o, s) {
          return Yr(df(o, s), G);
        }
        function k7(o, s, v) {
          return v = v === r ? 1 : dt(v), Yr(df(o, s), v);
        }
        function Yy(o, s) {
          var v = ut(o) ? oo : ia;
          return v(o, Ye(s, 3));
        }
        function Ky(o, s) {
          var v = ut(o) ? I_ : Vm;
          return v(o, Ye(s, 3));
        }
        var _7 = rf(function(o, s, v) {
          Qt.call(o, v) ? o[v].push(s) : wi(o, v, [s]);
        });
        function S7(o, s, v, b) {
          o = _n(o) ? o : us(o), v = v && !b ? dt(v) : 0;
          var M = o.length;
          return v < 0 && (v = Lr(M + v, 0)), mf(o) ? v <= M && o.indexOf(s, v) > -1 : !!M && Zl(o, s, v) > -1;
        }
        var M7 = yt(function(o, s, v) {
          var b = -1, M = typeof s == "function", F = _n(o) ? ae(o.length) : [];
          return ia(o, function(D) {
            F[++b] = M ? qn(s, D, v) : uu(D, s, v);
          }), F;
        }), C7 = rf(function(o, s, v) {
          wi(o, v, s);
        });
        function df(o, s) {
          var v = ut(o) ? gr : Jm;
          return v(o, Ye(s, 3));
        }
        function R7(o, s, v, b) {
          return o == null ? [] : (ut(s) || (s = s == null ? [] : [s]), v = b ? r : v, ut(v) || (v = v == null ? [] : [v]), ny(o, s, v));
        }
        var A7 = rf(function(o, s, v) {
          o[v ? 0 : 1].push(s);
        }, function() {
          return [[], []];
        });
        function E7(o, s, v) {
          var b = ut(o) ? xh : Rm, M = arguments.length < 3;
          return b(o, Ye(s, 4), v, M, ia);
        }
        function T7(o, s, v) {
          var b = ut(o) ? j_ : Rm, M = arguments.length < 3;
          return b(o, Ye(s, 4), v, M, Vm);
        }
        function $7(o, s) {
          var v = ut(o) ? ta : Gm;
          return v(o, vf(Ye(s, 3)));
        }
        function F7(o) {
          var s = ut(o) ? jm : S4;
          return s(o);
        }
        function N7(o, s, v) {
          (v ? fn(o, s, v) : s === r) ? s = 1 : s = dt(s);
          var b = ut(o) ? t4 : M4;
          return b(o, s);
        }
        function z7(o) {
          var s = ut(o) ? r4 : R4;
          return s(o);
        }
        function O7(o) {
          if (o == null)
            return 0;
          if (_n(o))
            return mf(o) ? Jl(o) : o.length;
          var s = Jr(o);
          return s == Ie || s == it ? o.size : Lh(o).length;
        }
        function B7(o, s, v) {
          var b = ut(o) ? wh : A4;
          return v && fn(o, s, v) && (s = r), b(o, Ye(s, 3));
        }
        var D7 = yt(function(o, s) {
          if (o == null)
            return [];
          var v = s.length;
          return v > 1 && fn(o, s[0], s[1]) ? s = [] : v > 2 && fn(s[0], s[1], s[2]) && (s = [s[0]]), ny(o, Yr(s, 1), []);
        }), hf = m5 || function() {
          return Xr.Date.now();
        };
        function P7(o, s) {
          if (typeof s != "function")
            throw new io(l);
          return o = dt(o), function() {
            if (--o < 1)
              return s.apply(this, arguments);
          };
        }
        function Zy(o, s, v) {
          return s = v ? r : s, s = o && s == null ? o.length : s, ki(o, A, r, r, r, r, s);
        }
        function Qy(o, s) {
          var v;
          if (typeof s != "function")
            throw new io(l);
          return o = dt(o), function() {
            return --o > 0 && (v = s.apply(this, arguments)), o <= 1 && (s = r), v;
          };
        }
        var up = yt(function(o, s, v) {
          var b = x;
          if (v.length) {
            var M = na(v, ls(up));
            b |= C;
          }
          return ki(o, b, s, v, M);
        }), Jy = yt(function(o, s, v) {
          var b = x | k;
          if (v.length) {
            var M = na(v, ls(Jy));
            b |= C;
          }
          return ki(s, b, o, v, M);
        });
        function e1(o, s, v) {
          s = v ? r : s;
          var b = ki(o, _, r, r, r, r, r, s);
          return b.placeholder = e1.placeholder, b;
        }
        function t1(o, s, v) {
          s = v ? r : s;
          var b = ki(o, E, r, r, r, r, r, s);
          return b.placeholder = t1.placeholder, b;
        }
        function r1(o, s, v) {
          var b, M, F, D, U, re, de = 0, he = !1, we = !1, $e = !0;
          if (typeof o != "function")
            throw new io(l);
          s = co(s) || 0, br(v) && (he = !!v.leading, we = "maxWait" in v, F = we ? Lr(co(v.maxWait) || 0, s) : F, $e = "trailing" in v ? !!v.trailing : $e);
          function Ue(Er) {
            var $o = b, Ri = M;
            return b = M = r, de = Er, D = o.apply(Ri, $o), D;
          }
          function Ke(Er) {
            return de = Er, U = pu(_t, s), he ? Ue(Er) : D;
          }
          function pt(Er) {
            var $o = Er - re, Ri = Er - de, w1 = s - $o;
            return we ? Qr(w1, F - Ri) : w1;
          }
          function Ze(Er) {
            var $o = Er - re, Ri = Er - de;
            return re === r || $o >= s || $o < 0 || we && Ri >= F;
          }
          function _t() {
            var Er = hf();
            if (Ze(Er))
              return $t(Er);
            U = pu(_t, pt(Er));
          }
          function $t(Er) {
            return U = r, $e && b ? Ue(Er) : (b = M = r, D);
          }
          function Wn() {
            U !== r && dy(U), de = 0, b = re = M = U = r;
          }
          function dn() {
            return U === r ? D : $t(hf());
          }
          function Hn() {
            var Er = hf(), $o = Ze(Er);
            if (b = arguments, M = this, re = Er, $o) {
              if (U === r)
                return Ke(re);
              if (we)
                return dy(U), U = pu(_t, s), Ue(re);
            }
            return U === r && (U = pu(_t, s)), D;
          }
          return Hn.cancel = Wn, Hn.flush = dn, Hn;
        }
        var L7 = yt(function(o, s) {
          return Hm(o, 1, s);
        }), q7 = yt(function(o, s, v) {
          return Hm(o, co(s) || 0, v);
        });
        function I7(o) {
          return ki(o, L);
        }
        function pf(o, s) {
          if (typeof o != "function" || s != null && typeof s != "function")
            throw new io(l);
          var v = function() {
            var b = arguments, M = s ? s.apply(this, b) : b[0], F = v.cache;
            if (F.has(M))
              return F.get(M);
            var D = o.apply(this, b);
            return v.cache = F.set(M, D) || F, D;
          };
          return v.cache = new (pf.Cache || xi)(), v;
        }
        pf.Cache = xi;
        function vf(o) {
          if (typeof o != "function")
            throw new io(l);
          return function() {
            var s = arguments;
            switch (s.length) {
              case 0:
                return !o.call(this);
              case 1:
                return !o.call(this, s[0]);
              case 2:
                return !o.call(this, s[0], s[1]);
              case 3:
                return !o.call(this, s[0], s[1], s[2]);
            }
            return !o.apply(this, s);
          };
        }
        function j7(o) {
          return Qy(2, o);
        }
        var U7 = E4(function(o, s) {
          s = s.length == 1 && ut(s[0]) ? gr(s[0], In(Ye())) : gr(Yr(s, 1), In(Ye()));
          var v = s.length;
          return yt(function(b) {
            for (var M = -1, F = Qr(b.length, v); ++M < F; )
              b[M] = s[M].call(this, b[M]);
            return qn(o, this, b);
          });
        }), cp = yt(function(o, s) {
          var v = na(s, ls(cp));
          return ki(o, C, r, s, v);
        }), n1 = yt(function(o, s) {
          var v = na(s, ls(n1));
          return ki(o, R, r, s, v);
        }), W7 = _i(function(o, s) {
          return ki(o, N, r, r, r, s);
        });
        function H7(o, s) {
          if (typeof o != "function")
            throw new io(l);
          return s = s === r ? s : dt(s), yt(o, s);
        }
        function V7(o, s) {
          if (typeof o != "function")
            throw new io(l);
          return s = s == null ? 0 : Lr(dt(s), 0), yt(function(v) {
            var b = v[s], M = sa(v, 0, s);
            return b && ra(M, b), qn(o, this, M);
          });
        }
        function G7(o, s, v) {
          var b = !0, M = !0;
          if (typeof o != "function")
            throw new io(l);
          return br(v) && (b = "leading" in v ? !!v.leading : b, M = "trailing" in v ? !!v.trailing : M), r1(o, s, {
            leading: b,
            maxWait: s,
            trailing: M
          });
        }
        function X7(o) {
          return Zy(o, 1);
        }
        function Y7(o, s) {
          return cp(Xh(s), o);
        }
        function K7() {
          if (!arguments.length)
            return [];
          var o = arguments[0];
          return ut(o) ? o : [o];
        }
        function Z7(o) {
          return lo(o, m);
        }
        function Q7(o, s) {
          return s = typeof s == "function" ? s : r, lo(o, m, s);
        }
        function J7(o) {
          return lo(o, p | m);
        }
        function e8(o, s) {
          return s = typeof s == "function" ? s : r, lo(o, p | m, s);
        }
        function t8(o, s) {
          return s == null || Wm(o, s, Ur(s));
        }
        function To(o, s) {
          return o === s || o !== o && s !== s;
        }
        var r8 = lf(Bh), n8 = lf(function(o, s) {
          return o >= s;
        }), Ya = Km(/* @__PURE__ */ function() {
          return arguments;
        }()) ? Km : function(o) {
          return wr(o) && Qt.call(o, "callee") && !Bm.call(o, "callee");
        }, ut = ae.isArray, o8 = mm ? In(mm) : d4;
        function _n(o) {
          return o != null && gf(o.length) && !Mi(o);
        }
        function Ar(o) {
          return wr(o) && _n(o);
        }
        function i8(o) {
          return o === !0 || o === !1 || wr(o) && cn(o) == Ae;
        }
        var ua = b5 || wp, a8 = ym ? In(ym) : h4;
        function l8(o) {
          return wr(o) && o.nodeType === 1 && !vu(o);
        }
        function s8(o) {
          if (o == null)
            return !0;
          if (_n(o) && (ut(o) || typeof o == "string" || typeof o.splice == "function" || ua(o) || ss(o) || Ya(o)))
            return !o.length;
          var s = Jr(o);
          if (s == Ie || s == it)
            return !o.size;
          if (hu(o))
            return !Lh(o).length;
          for (var v in o)
            if (Qt.call(o, v))
              return !1;
          return !0;
        }
        function u8(o, s) {
          return cu(o, s);
        }
        function c8(o, s, v) {
          v = typeof v == "function" ? v : r;
          var b = v ? v(o, s) : r;
          return b === r ? cu(o, s, r, v) : !!b;
        }
        function fp(o) {
          if (!wr(o))
            return !1;
          var s = cn(o);
          return s == xe || s == Me || typeof o.message == "string" && typeof o.name == "string" && !vu(o);
        }
        function f8(o) {
          return typeof o == "number" && Pm(o);
        }
        function Mi(o) {
          if (!br(o))
            return !1;
          var s = cn(o);
          return s == ke || s == Le || s == ue || s == wt;
        }
        function o1(o) {
          return typeof o == "number" && o == dt(o);
        }
        function gf(o) {
          return typeof o == "number" && o > -1 && o % 1 == 0 && o <= Z;
        }
        function br(o) {
          var s = typeof o;
          return o != null && (s == "object" || s == "function");
        }
        function wr(o) {
          return o != null && typeof o == "object";
        }
        var i1 = bm ? In(bm) : v4;
        function d8(o, s) {
          return o === s || Ph(o, s, tp(s));
        }
        function h8(o, s, v) {
          return v = typeof v == "function" ? v : r, Ph(o, s, tp(s), v);
        }
        function p8(o) {
          return a1(o) && o != +o;
        }
        function v8(o) {
          if (Q4(o))
            throw new at(a);
          return Zm(o);
        }
        function g8(o) {
          return o === null;
        }
        function m8(o) {
          return o == null;
        }
        function a1(o) {
          return typeof o == "number" || wr(o) && cn(o) == je;
        }
        function vu(o) {
          if (!wr(o) || cn(o) != ht)
            return !1;
          var s = jc(o);
          if (s === null)
            return !0;
          var v = Qt.call(s, "constructor") && s.constructor;
          return typeof v == "function" && v instanceof v && Pc.call(v) == h5;
        }
        var dp = xm ? In(xm) : g4;
        function y8(o) {
          return o1(o) && o >= -Z && o <= Z;
        }
        var l1 = wm ? In(wm) : m4;
        function mf(o) {
          return typeof o == "string" || !ut(o) && wr(o) && cn(o) == Ht;
        }
        function Un(o) {
          return typeof o == "symbol" || wr(o) && cn(o) == nt;
        }
        var ss = km ? In(km) : y4;
        function b8(o) {
          return o === r;
        }
        function x8(o) {
          return wr(o) && Jr(o) == qt;
        }
        function w8(o) {
          return wr(o) && cn(o) == Cr;
        }
        var k8 = lf(qh), _8 = lf(function(o, s) {
          return o <= s;
        });
        function s1(o) {
          if (!o)
            return [];
          if (_n(o))
            return mf(o) ? Ao(o) : kn(o);
          if (ru && o[ru])
            return t5(o[ru]());
          var s = Jr(o), v = s == Ie ? Rh : s == it ? Oc : us;
          return v(o);
        }
        function Ci(o) {
          if (!o)
            return o === 0 ? o : 0;
          if (o = co(o), o === G || o === -G) {
            var s = o < 0 ? -1 : 1;
            return s * Y;
          }
          return o === o ? o : 0;
        }
        function dt(o) {
          var s = Ci(o), v = s % 1;
          return s === s ? v ? s - v : s : 0;
        }
        function u1(o) {
          return o ? Ha(dt(o), 0, K) : 0;
        }
        function co(o) {
          if (typeof o == "number")
            return o;
          if (Un(o))
            return I;
          if (br(o)) {
            var s = typeof o.valueOf == "function" ? o.valueOf() : o;
            o = br(s) ? s + "" : s;
          }
          if (typeof o != "string")
            return o === 0 ? o : +o;
          o = Am(o);
          var v = Bt.test(o);
          return v || Ve.test(o) ? P_(o.slice(2), v ? 2 : 8) : ft.test(o) ? I : +o;
        }
        function c1(o) {
          return Ko(o, Sn(o));
        }
        function S8(o) {
          return o ? Ha(dt(o), -Z, Z) : o === 0 ? o : 0;
        }
        function Vt(o) {
          return o == null ? "" : jn(o);
        }
        var M8 = is(function(o, s) {
          if (hu(s) || _n(s)) {
            Ko(s, Ur(s), o);
            return;
          }
          for (var v in s)
            Qt.call(s, v) && lu(o, v, s[v]);
        }), f1 = is(function(o, s) {
          Ko(s, Sn(s), o);
        }), yf = is(function(o, s, v, b) {
          Ko(s, Sn(s), o, b);
        }), C8 = is(function(o, s, v, b) {
          Ko(s, Ur(s), o, b);
        }), R8 = _i(Nh);
        function A8(o, s) {
          var v = os(o);
          return s == null ? v : Um(v, s);
        }
        var E8 = yt(function(o, s) {
          o = ir(o);
          var v = -1, b = s.length, M = b > 2 ? s[2] : r;
          for (M && fn(s[0], s[1], M) && (b = 1); ++v < b; )
            for (var F = s[v], D = Sn(F), U = -1, re = D.length; ++U < re; ) {
              var de = D[U], he = o[de];
              (he === r || To(he, ts[de]) && !Qt.call(o, de)) && (o[de] = F[de]);
            }
          return o;
        }), T8 = yt(function(o) {
          return o.push(r, Ay), qn(d1, r, o);
        });
        function $8(o, s) {
          return Sm(o, Ye(s, 3), Yo);
        }
        function F8(o, s) {
          return Sm(o, Ye(s, 3), Oh);
        }
        function N8(o, s) {
          return o == null ? o : zh(o, Ye(s, 3), Sn);
        }
        function z8(o, s) {
          return o == null ? o : Xm(o, Ye(s, 3), Sn);
        }
        function O8(o, s) {
          return o && Yo(o, Ye(s, 3));
        }
        function B8(o, s) {
          return o && Oh(o, Ye(s, 3));
        }
        function D8(o) {
          return o == null ? [] : Qc(o, Ur(o));
        }
        function P8(o) {
          return o == null ? [] : Qc(o, Sn(o));
        }
        function hp(o, s, v) {
          var b = o == null ? r : Va(o, s);
          return b === r ? v : b;
        }
        function L8(o, s) {
          return o != null && $y(o, s, s4);
        }
        function pp(o, s) {
          return o != null && $y(o, s, u4);
        }
        var q8 = _y(function(o, s, v) {
          s != null && typeof s.toString != "function" && (s = Lc.call(s)), o[s] = v;
        }, gp(Mn)), I8 = _y(function(o, s, v) {
          s != null && typeof s.toString != "function" && (s = Lc.call(s)), Qt.call(o, s) ? o[s].push(v) : o[s] = [v];
        }, Ye), j8 = yt(uu);
        function Ur(o) {
          return _n(o) ? Im(o) : Lh(o);
        }
        function Sn(o) {
          return _n(o) ? Im(o, !0) : b4(o);
        }
        function U8(o, s) {
          var v = {};
          return s = Ye(s, 3), Yo(o, function(b, M, F) {
            wi(v, s(b, M, F), b);
          }), v;
        }
        function W8(o, s) {
          var v = {};
          return s = Ye(s, 3), Yo(o, function(b, M, F) {
            wi(v, M, s(b, M, F));
          }), v;
        }
        var H8 = is(function(o, s, v) {
          Jc(o, s, v);
        }), d1 = is(function(o, s, v, b) {
          Jc(o, s, v, b);
        }), V8 = _i(function(o, s) {
          var v = {};
          if (o == null)
            return v;
          var b = !1;
          s = gr(s, function(F) {
            return F = la(F, o), b || (b = F.length > 1), F;
          }), Ko(o, Jh(o), v), b && (v = lo(v, p | g | m, q4));
          for (var M = s.length; M--; )
            Hh(v, s[M]);
          return v;
        });
        function G8(o, s) {
          return h1(o, vf(Ye(s)));
        }
        var X8 = _i(function(o, s) {
          return o == null ? {} : w4(o, s);
        });
        function h1(o, s) {
          if (o == null)
            return {};
          var v = gr(Jh(o), function(b) {
            return [b];
          });
          return s = Ye(s), oy(o, v, function(b, M) {
            return s(b, M[0]);
          });
        }
        function Y8(o, s, v) {
          s = la(s, o);
          var b = -1, M = s.length;
          for (M || (M = 1, o = r); ++b < M; ) {
            var F = o == null ? r : o[Zo(s[b])];
            F === r && (b = M, F = v), o = Mi(F) ? F.call(o) : F;
          }
          return o;
        }
        function K8(o, s, v) {
          return o == null ? o : fu(o, s, v);
        }
        function Z8(o, s, v, b) {
          return b = typeof b == "function" ? b : r, o == null ? o : fu(o, s, v, b);
        }
        var p1 = Cy(Ur), v1 = Cy(Sn);
        function Q8(o, s, v) {
          var b = ut(o), M = b || ua(o) || ss(o);
          if (s = Ye(s, 4), v == null) {
            var F = o && o.constructor;
            M ? v = b ? new F() : [] : br(o) ? v = Mi(F) ? os(jc(o)) : {} : v = {};
          }
          return (M ? oo : Yo)(o, function(D, U, re) {
            return s(v, D, U, re);
          }), v;
        }
        function J8(o, s) {
          return o == null ? !0 : Hh(o, s);
        }
        function eS(o, s, v) {
          return o == null ? o : uy(o, s, Xh(v));
        }
        function tS(o, s, v, b) {
          return b = typeof b == "function" ? b : r, o == null ? o : uy(o, s, Xh(v), b);
        }
        function us(o) {
          return o == null ? [] : Ch(o, Ur(o));
        }
        function rS(o) {
          return o == null ? [] : Ch(o, Sn(o));
        }
        function nS(o, s, v) {
          return v === r && (v = s, s = r), v !== r && (v = co(v), v = v === v ? v : 0), s !== r && (s = co(s), s = s === s ? s : 0), Ha(co(o), s, v);
        }
        function oS(o, s, v) {
          return s = Ci(s), v === r ? (v = s, s = 0) : v = Ci(v), o = co(o), c4(o, s, v);
        }
        function iS(o, s, v) {
          if (v && typeof v != "boolean" && fn(o, s, v) && (s = v = r), v === r && (typeof s == "boolean" ? (v = s, s = r) : typeof o == "boolean" && (v = o, o = r)), o === r && s === r ? (o = 0, s = 1) : (o = Ci(o), s === r ? (s = o, o = 0) : s = Ci(s)), o > s) {
            var b = o;
            o = s, s = b;
          }
          if (v || o % 1 || s % 1) {
            var M = Lm();
            return Qr(o + M * (s - o + D_("1e-" + ((M + "").length - 1))), s);
          }
          return jh(o, s);
        }
        var aS = as(function(o, s, v) {
          return s = s.toLowerCase(), o + (v ? g1(s) : s);
        });
        function g1(o) {
          return vp(Vt(o).toLowerCase());
        }
        function m1(o) {
          return o = Vt(o), o && o.replace(ur, K_).replace(R_, "");
        }
        function lS(o, s, v) {
          o = Vt(o), s = jn(s);
          var b = o.length;
          v = v === r ? b : Ha(dt(v), 0, b);
          var M = v;
          return v -= s.length, v >= 0 && o.slice(v, M) == s;
        }
        function sS(o) {
          return o = Vt(o), o && Da.test(o) ? o.replace(ea, Z_) : o;
        }
        function uS(o) {
          return o = Vt(o), o && pe.test(o) ? o.replace(qa, "\\$&") : o;
        }
        var cS = as(function(o, s, v) {
          return o + (v ? "-" : "") + s.toLowerCase();
        }), fS = as(function(o, s, v) {
          return o + (v ? " " : "") + s.toLowerCase();
        }), dS = xy("toLowerCase");
        function hS(o, s, v) {
          o = Vt(o), s = dt(s);
          var b = s ? Jl(o) : 0;
          if (!s || b >= s)
            return o;
          var M = (s - b) / 2;
          return af(Vc(M), v) + o + af(Hc(M), v);
        }
        function pS(o, s, v) {
          o = Vt(o), s = dt(s);
          var b = s ? Jl(o) : 0;
          return s && b < s ? o + af(s - b, v) : o;
        }
        function vS(o, s, v) {
          o = Vt(o), s = dt(s);
          var b = s ? Jl(o) : 0;
          return s && b < s ? af(s - b, v) + o : o;
        }
        function gS(o, s, v) {
          return v || s == null ? s = 0 : s && (s = +s), _5(Vt(o).replace(Fe, ""), s || 0);
        }
        function mS(o, s, v) {
          return (v ? fn(o, s, v) : s === r) ? s = 1 : s = dt(s), Uh(Vt(o), s);
        }
        function yS() {
          var o = arguments, s = Vt(o[0]);
          return o.length < 3 ? s : s.replace(o[1], o[2]);
        }
        var bS = as(function(o, s, v) {
          return o + (v ? "_" : "") + s.toLowerCase();
        });
        function xS(o, s, v) {
          return v && typeof v != "number" && fn(o, s, v) && (s = v = r), v = v === r ? K : v >>> 0, v ? (o = Vt(o), o && (typeof s == "string" || s != null && !dp(s)) && (s = jn(s), !s && Ql(o)) ? sa(Ao(o), 0, v) : o.split(s, v)) : [];
        }
        var wS = as(function(o, s, v) {
          return o + (v ? " " : "") + vp(s);
        });
        function kS(o, s, v) {
          return o = Vt(o), v = v == null ? 0 : Ha(dt(v), 0, o.length), s = jn(s), o.slice(v, v + s.length) == s;
        }
        function _S(o, s, v) {
          var b = $.templateSettings;
          v && fn(o, s, v) && (s = r), o = Vt(o), s = yf({}, s, b, Ry);
          var M = yf({}, s.imports, b.imports, Ry), F = Ur(M), D = Ch(M, F), U, re, de = 0, he = s.interpolate || Nr, we = "__p += '", $e = Ah(
            (s.escape || Nr).source + "|" + he.source + "|" + (he === Pa ? Re : Nr).source + "|" + (s.evaluate || Nr).source + "|$",
            "g"
          ), Ue = "//# sourceURL=" + (Qt.call(s, "sourceURL") ? (s.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++F_ + "]") + `
`;
          o.replace($e, function(Ze, _t, $t, Wn, dn, Hn) {
            return $t || ($t = Wn), we += o.slice(de, Hn).replace(Rr, Q_), _t && (U = !0, we += `' +
__e(` + _t + `) +
'`), dn && (re = !0, we += `';
` + dn + `;
__p += '`), $t && (we += `' +
((__t = (` + $t + `)) == null ? '' : __t) +
'`), de = Hn + Ze.length, Ze;
          }), we += `';
`;
          var Ke = Qt.call(s, "variable") && s.variable;
          if (!Ke)
            we = `with (obj) {
` + we + `
}
`;
          else if (fe.test(Ke))
            throw new at(u);
          we = (re ? we.replace(Qi, "") : we).replace(un, "$1").replace(Ji, "$1;"), we = "function(" + (Ke || "obj") + `) {
` + (Ke ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (U ? ", __e = _.escape" : "") + (re ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + we + `return __p
}`;
          var pt = b1(function() {
            return It(F, Ue + "return " + we).apply(r, D);
          });
          if (pt.source = we, fp(pt))
            throw pt;
          return pt;
        }
        function SS(o) {
          return Vt(o).toLowerCase();
        }
        function MS(o) {
          return Vt(o).toUpperCase();
        }
        function CS(o, s, v) {
          if (o = Vt(o), o && (v || s === r))
            return Am(o);
          if (!o || !(s = jn(s)))
            return o;
          var b = Ao(o), M = Ao(s), F = Em(b, M), D = Tm(b, M) + 1;
          return sa(b, F, D).join("");
        }
        function RS(o, s, v) {
          if (o = Vt(o), o && (v || s === r))
            return o.slice(0, Fm(o) + 1);
          if (!o || !(s = jn(s)))
            return o;
          var b = Ao(o), M = Tm(b, Ao(s)) + 1;
          return sa(b, 0, M).join("");
        }
        function AS(o, s, v) {
          if (o = Vt(o), o && (v || s === r))
            return o.replace(Fe, "");
          if (!o || !(s = jn(s)))
            return o;
          var b = Ao(o), M = Em(b, Ao(s));
          return sa(b, M).join("");
        }
        function ES(o, s) {
          var v = j, b = B;
          if (br(s)) {
            var M = "separator" in s ? s.separator : M;
            v = "length" in s ? dt(s.length) : v, b = "omission" in s ? jn(s.omission) : b;
          }
          o = Vt(o);
          var F = o.length;
          if (Ql(o)) {
            var D = Ao(o);
            F = D.length;
          }
          if (v >= F)
            return o;
          var U = v - Jl(b);
          if (U < 1)
            return b;
          var re = D ? sa(D, 0, U).join("") : o.slice(0, U);
          if (M === r)
            return re + b;
          if (D && (U += re.length - U), dp(M)) {
            if (o.slice(U).search(M)) {
              var de, he = re;
              for (M.global || (M = Ah(M.source, Vt(ct.exec(M)) + "g")), M.lastIndex = 0; de = M.exec(he); )
                var we = de.index;
              re = re.slice(0, we === r ? U : we);
            }
          } else if (o.indexOf(jn(M), U) != U) {
            var $e = re.lastIndexOf(M);
            $e > -1 && (re = re.slice(0, $e));
          }
          return re + b;
        }
        function TS(o) {
          return o = Vt(o), o && Hl.test(o) ? o.replace(Ba, i5) : o;
        }
        var $S = as(function(o, s, v) {
          return o + (v ? " " : "") + s.toUpperCase();
        }), vp = xy("toUpperCase");
        function y1(o, s, v) {
          return o = Vt(o), s = v ? r : s, s === r ? e5(o) ? s5(o) : H_(o) : o.match(s) || [];
        }
        var b1 = yt(function(o, s) {
          try {
            return qn(o, r, s);
          } catch (v) {
            return fp(v) ? v : new at(v);
          }
        }), FS = _i(function(o, s) {
          return oo(s, function(v) {
            v = Zo(v), wi(o, v, up(o[v], o));
          }), o;
        });
        function NS(o) {
          var s = o == null ? 0 : o.length, v = Ye();
          return o = s ? gr(o, function(b) {
            if (typeof b[1] != "function")
              throw new io(l);
            return [v(b[0]), b[1]];
          }) : [], yt(function(b) {
            for (var M = -1; ++M < s; ) {
              var F = o[M];
              if (qn(F[0], this, b))
                return qn(F[1], this, b);
            }
          });
        }
        function zS(o) {
          return i4(lo(o, p));
        }
        function gp(o) {
          return function() {
            return o;
          };
        }
        function OS(o, s) {
          return o == null || o !== o ? s : o;
        }
        var BS = ky(), DS = ky(!0);
        function Mn(o) {
          return o;
        }
        function mp(o) {
          return Qm(typeof o == "function" ? o : lo(o, p));
        }
        function PS(o) {
          return ey(lo(o, p));
        }
        function LS(o, s) {
          return ty(o, lo(s, p));
        }
        var qS = yt(function(o, s) {
          return function(v) {
            return uu(v, o, s);
          };
        }), IS = yt(function(o, s) {
          return function(v) {
            return uu(o, v, s);
          };
        });
        function yp(o, s, v) {
          var b = Ur(s), M = Qc(s, b);
          v == null && !(br(s) && (M.length || !b.length)) && (v = s, s = o, o = this, M = Qc(s, Ur(s)));
          var F = !(br(v) && "chain" in v) || !!v.chain, D = Mi(o);
          return oo(M, function(U) {
            var re = s[U];
            o[U] = re, D && (o.prototype[U] = function() {
              var de = this.__chain__;
              if (F || de) {
                var he = o(this.__wrapped__), we = he.__actions__ = kn(this.__actions__);
                return we.push({ func: re, args: arguments, thisArg: o }), he.__chain__ = de, he;
              }
              return re.apply(o, ra([this.value()], arguments));
            });
          }), o;
        }
        function jS() {
          return Xr._ === this && (Xr._ = p5), this;
        }
        function bp() {
        }
        function US(o) {
          return o = dt(o), yt(function(s) {
            return ry(s, o);
          });
        }
        var WS = Kh(gr), HS = Kh(_m), VS = Kh(wh);
        function x1(o) {
          return np(o) ? kh(Zo(o)) : k4(o);
        }
        function GS(o) {
          return function(s) {
            return o == null ? r : Va(o, s);
          };
        }
        var XS = Sy(), YS = Sy(!0);
        function xp() {
          return [];
        }
        function wp() {
          return !1;
        }
        function KS() {
          return {};
        }
        function ZS() {
          return "";
        }
        function QS() {
          return !0;
        }
        function JS(o, s) {
          if (o = dt(o), o < 1 || o > Z)
            return [];
          var v = K, b = Qr(o, K);
          s = Ye(s), o -= K;
          for (var M = Mh(b, s); ++v < o; )
            s(v);
          return M;
        }
        function e9(o) {
          return ut(o) ? gr(o, Zo) : Un(o) ? [o] : kn(qy(Vt(o)));
        }
        function t9(o) {
          var s = ++d5;
          return Vt(o) + s;
        }
        var r9 = of(function(o, s) {
          return o + s;
        }, 0), n9 = Zh("ceil"), o9 = of(function(o, s) {
          return o / s;
        }, 1), i9 = Zh("floor");
        function a9(o) {
          return o && o.length ? Zc(o, Mn, Bh) : r;
        }
        function l9(o, s) {
          return o && o.length ? Zc(o, Ye(s, 2), Bh) : r;
        }
        function s9(o) {
          return Cm(o, Mn);
        }
        function u9(o, s) {
          return Cm(o, Ye(s, 2));
        }
        function c9(o) {
          return o && o.length ? Zc(o, Mn, qh) : r;
        }
        function f9(o, s) {
          return o && o.length ? Zc(o, Ye(s, 2), qh) : r;
        }
        var d9 = of(function(o, s) {
          return o * s;
        }, 1), h9 = Zh("round"), p9 = of(function(o, s) {
          return o - s;
        }, 0);
        function v9(o) {
          return o && o.length ? Sh(o, Mn) : 0;
        }
        function g9(o, s) {
          return o && o.length ? Sh(o, Ye(s, 2)) : 0;
        }
        return $.after = P7, $.ary = Zy, $.assign = M8, $.assignIn = f1, $.assignInWith = yf, $.assignWith = C8, $.at = R8, $.before = Qy, $.bind = up, $.bindAll = FS, $.bindKey = Jy, $.castArray = K7, $.chain = Xy, $.chunk = i6, $.compact = a6, $.concat = l6, $.cond = NS, $.conforms = zS, $.constant = gp, $.countBy = v7, $.create = A8, $.curry = e1, $.curryRight = t1, $.debounce = r1, $.defaults = E8, $.defaultsDeep = T8, $.defer = L7, $.delay = q7, $.difference = s6, $.differenceBy = u6, $.differenceWith = c6, $.drop = f6, $.dropRight = d6, $.dropRightWhile = h6, $.dropWhile = p6, $.fill = v6, $.filter = m7, $.flatMap = x7, $.flatMapDeep = w7, $.flatMapDepth = k7, $.flatten = Wy, $.flattenDeep = g6, $.flattenDepth = m6, $.flip = I7, $.flow = BS, $.flowRight = DS, $.fromPairs = y6, $.functions = D8, $.functionsIn = P8, $.groupBy = _7, $.initial = x6, $.intersection = w6, $.intersectionBy = k6, $.intersectionWith = _6, $.invert = q8, $.invertBy = I8, $.invokeMap = M7, $.iteratee = mp, $.keyBy = C7, $.keys = Ur, $.keysIn = Sn, $.map = df, $.mapKeys = U8, $.mapValues = W8, $.matches = PS, $.matchesProperty = LS, $.memoize = pf, $.merge = H8, $.mergeWith = d1, $.method = qS, $.methodOf = IS, $.mixin = yp, $.negate = vf, $.nthArg = US, $.omit = V8, $.omitBy = G8, $.once = j7, $.orderBy = R7, $.over = WS, $.overArgs = U7, $.overEvery = HS, $.overSome = VS, $.partial = cp, $.partialRight = n1, $.partition = A7, $.pick = X8, $.pickBy = h1, $.property = x1, $.propertyOf = GS, $.pull = R6, $.pullAll = Vy, $.pullAllBy = A6, $.pullAllWith = E6, $.pullAt = T6, $.range = XS, $.rangeRight = YS, $.rearg = W7, $.reject = $7, $.remove = $6, $.rest = H7, $.reverse = lp, $.sampleSize = N7, $.set = K8, $.setWith = Z8, $.shuffle = z7, $.slice = F6, $.sortBy = D7, $.sortedUniq = L6, $.sortedUniqBy = q6, $.split = xS, $.spread = V7, $.tail = I6, $.take = j6, $.takeRight = U6, $.takeRightWhile = W6, $.takeWhile = H6, $.tap = a7, $.throttle = G7, $.thru = ff, $.toArray = s1, $.toPairs = p1, $.toPairsIn = v1, $.toPath = e9, $.toPlainObject = c1, $.transform = Q8, $.unary = X7, $.union = V6, $.unionBy = G6, $.unionWith = X6, $.uniq = Y6, $.uniqBy = K6, $.uniqWith = Z6, $.unset = J8, $.unzip = sp, $.unzipWith = Gy, $.update = eS, $.updateWith = tS, $.values = us, $.valuesIn = rS, $.without = Q6, $.words = y1, $.wrap = Y7, $.xor = J6, $.xorBy = e7, $.xorWith = t7, $.zip = r7, $.zipObject = n7, $.zipObjectDeep = o7, $.zipWith = i7, $.entries = p1, $.entriesIn = v1, $.extend = f1, $.extendWith = yf, yp($, $), $.add = r9, $.attempt = b1, $.camelCase = aS, $.capitalize = g1, $.ceil = n9, $.clamp = nS, $.clone = Z7, $.cloneDeep = J7, $.cloneDeepWith = e8, $.cloneWith = Q7, $.conformsTo = t8, $.deburr = m1, $.defaultTo = OS, $.divide = o9, $.endsWith = lS, $.eq = To, $.escape = sS, $.escapeRegExp = uS, $.every = g7, $.find = y7, $.findIndex = jy, $.findKey = $8, $.findLast = b7, $.findLastIndex = Uy, $.findLastKey = F8, $.floor = i9, $.forEach = Yy, $.forEachRight = Ky, $.forIn = N8, $.forInRight = z8, $.forOwn = O8, $.forOwnRight = B8, $.get = hp, $.gt = r8, $.gte = n8, $.has = L8, $.hasIn = pp, $.head = Hy, $.identity = Mn, $.includes = S7, $.indexOf = b6, $.inRange = oS, $.invoke = j8, $.isArguments = Ya, $.isArray = ut, $.isArrayBuffer = o8, $.isArrayLike = _n, $.isArrayLikeObject = Ar, $.isBoolean = i8, $.isBuffer = ua, $.isDate = a8, $.isElement = l8, $.isEmpty = s8, $.isEqual = u8, $.isEqualWith = c8, $.isError = fp, $.isFinite = f8, $.isFunction = Mi, $.isInteger = o1, $.isLength = gf, $.isMap = i1, $.isMatch = d8, $.isMatchWith = h8, $.isNaN = p8, $.isNative = v8, $.isNil = m8, $.isNull = g8, $.isNumber = a1, $.isObject = br, $.isObjectLike = wr, $.isPlainObject = vu, $.isRegExp = dp, $.isSafeInteger = y8, $.isSet = l1, $.isString = mf, $.isSymbol = Un, $.isTypedArray = ss, $.isUndefined = b8, $.isWeakMap = x8, $.isWeakSet = w8, $.join = S6, $.kebabCase = cS, $.last = uo, $.lastIndexOf = M6, $.lowerCase = fS, $.lowerFirst = dS, $.lt = k8, $.lte = _8, $.max = a9, $.maxBy = l9, $.mean = s9, $.meanBy = u9, $.min = c9, $.minBy = f9, $.stubArray = xp, $.stubFalse = wp, $.stubObject = KS, $.stubString = ZS, $.stubTrue = QS, $.multiply = d9, $.nth = C6, $.noConflict = jS, $.noop = bp, $.now = hf, $.pad = hS, $.padEnd = pS, $.padStart = vS, $.parseInt = gS, $.random = iS, $.reduce = E7, $.reduceRight = T7, $.repeat = mS, $.replace = yS, $.result = Y8, $.round = h9, $.runInContext = Q, $.sample = F7, $.size = O7, $.snakeCase = bS, $.some = B7, $.sortedIndex = N6, $.sortedIndexBy = z6, $.sortedIndexOf = O6, $.sortedLastIndex = B6, $.sortedLastIndexBy = D6, $.sortedLastIndexOf = P6, $.startCase = wS, $.startsWith = kS, $.subtract = p9, $.sum = v9, $.sumBy = g9, $.template = _S, $.times = JS, $.toFinite = Ci, $.toInteger = dt, $.toLength = u1, $.toLower = SS, $.toNumber = co, $.toSafeInteger = S8, $.toString = Vt, $.toUpper = MS, $.trim = CS, $.trimEnd = RS, $.trimStart = AS, $.truncate = ES, $.unescape = TS, $.uniqueId = t9, $.upperCase = $S, $.upperFirst = vp, $.each = Yy, $.eachRight = Ky, $.first = Hy, yp($, function() {
          var o = {};
          return Yo($, function(s, v) {
            Qt.call($.prototype, v) || (o[v] = s);
          }), o;
        }(), { chain: !1 }), $.VERSION = n, oo(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(o) {
          $[o].placeholder = $;
        }), oo(["drop", "take"], function(o, s) {
          Rt.prototype[o] = function(v) {
            v = v === r ? 1 : Lr(dt(v), 0);
            var b = this.__filtered__ && !s ? new Rt(this) : this.clone();
            return b.__filtered__ ? b.__takeCount__ = Qr(v, b.__takeCount__) : b.__views__.push({
              size: Qr(v, K),
              type: o + (b.__dir__ < 0 ? "Right" : "")
            }), b;
          }, Rt.prototype[o + "Right"] = function(v) {
            return this.reverse()[o](v).reverse();
          };
        }), oo(["filter", "map", "takeWhile"], function(o, s) {
          var v = s + 1, b = v == H || v == V;
          Rt.prototype[o] = function(M) {
            var F = this.clone();
            return F.__iteratees__.push({
              iteratee: Ye(M, 3),
              type: v
            }), F.__filtered__ = F.__filtered__ || b, F;
          };
        }), oo(["head", "last"], function(o, s) {
          var v = "take" + (s ? "Right" : "");
          Rt.prototype[o] = function() {
            return this[v](1).value()[0];
          };
        }), oo(["initial", "tail"], function(o, s) {
          var v = "drop" + (s ? "" : "Right");
          Rt.prototype[o] = function() {
            return this.__filtered__ ? new Rt(this) : this[v](1);
          };
        }), Rt.prototype.compact = function() {
          return this.filter(Mn);
        }, Rt.prototype.find = function(o) {
          return this.filter(o).head();
        }, Rt.prototype.findLast = function(o) {
          return this.reverse().find(o);
        }, Rt.prototype.invokeMap = yt(function(o, s) {
          return typeof o == "function" ? new Rt(this) : this.map(function(v) {
            return uu(v, o, s);
          });
        }), Rt.prototype.reject = function(o) {
          return this.filter(vf(Ye(o)));
        }, Rt.prototype.slice = function(o, s) {
          o = dt(o);
          var v = this;
          return v.__filtered__ && (o > 0 || s < 0) ? new Rt(v) : (o < 0 ? v = v.takeRight(-o) : o && (v = v.drop(o)), s !== r && (s = dt(s), v = s < 0 ? v.dropRight(-s) : v.take(s - o)), v);
        }, Rt.prototype.takeRightWhile = function(o) {
          return this.reverse().takeWhile(o).reverse();
        }, Rt.prototype.toArray = function() {
          return this.take(K);
        }, Yo(Rt.prototype, function(o, s) {
          var v = /^(?:filter|find|map|reject)|While$/.test(s), b = /^(?:head|last)$/.test(s), M = $[b ? "take" + (s == "last" ? "Right" : "") : s], F = b || /^find/.test(s);
          M && ($.prototype[s] = function() {
            var D = this.__wrapped__, U = b ? [1] : arguments, re = D instanceof Rt, de = U[0], he = re || ut(D), we = function(_t) {
              var $t = M.apply($, ra([_t], U));
              return b && $e ? $t[0] : $t;
            };
            he && v && typeof de == "function" && de.length != 1 && (re = he = !1);
            var $e = this.__chain__, Ue = !!this.__actions__.length, Ke = F && !$e, pt = re && !Ue;
            if (!F && he) {
              D = pt ? D : new Rt(this);
              var Ze = o.apply(D, U);
              return Ze.__actions__.push({ func: ff, args: [we], thisArg: r }), new ao(Ze, $e);
            }
            return Ke && pt ? o.apply(this, U) : (Ze = this.thru(we), Ke ? b ? Ze.value()[0] : Ze.value() : Ze);
          });
        }), oo(["pop", "push", "shift", "sort", "splice", "unshift"], function(o) {
          var s = Bc[o], v = /^(?:push|sort|unshift)$/.test(o) ? "tap" : "thru", b = /^(?:pop|shift)$/.test(o);
          $.prototype[o] = function() {
            var M = arguments;
            if (b && !this.__chain__) {
              var F = this.value();
              return s.apply(ut(F) ? F : [], M);
            }
            return this[v](function(D) {
              return s.apply(ut(D) ? D : [], M);
            });
          };
        }), Yo(Rt.prototype, function(o, s) {
          var v = $[s];
          if (v) {
            var b = v.name + "";
            Qt.call(ns, b) || (ns[b] = []), ns[b].push({ name: s, func: v });
          }
        }), ns[nf(r, k).name] = [{
          name: "wrapper",
          func: r
        }], Rt.prototype.clone = T5, Rt.prototype.reverse = $5, Rt.prototype.value = F5, $.prototype.at = l7, $.prototype.chain = s7, $.prototype.commit = u7, $.prototype.next = c7, $.prototype.plant = d7, $.prototype.reverse = h7, $.prototype.toJSON = $.prototype.valueOf = $.prototype.value = p7, $.prototype.first = $.prototype.head, ru && ($.prototype[ru] = f7), $;
      }, es = u5();
      Ia ? ((Ia.exports = es)._ = es, mh._ = es) : Xr._ = es;
    }).call(k$);
  }(Uf, Uf.exports)), Uf.exports;
}
var Y0 = _$();
const s3 = /* @__PURE__ */ zg(Y0), S$ = {
  headerHeight: null,
  columnConfigs: {},
  onColumnConfigsChange: () => {
  },
  minColumnWidths: {},
  rowRenderBatchSize: 4,
  minFetchSize: 1,
  renderWindowOffset: 400,
  verticalScrollbarPillHeight: 4,
  verticalScrollbarWidth: 24,
  horizontalScrollbarHeight: 16,
  lineHeight: 20,
  textMaxLines: 3,
  betweenRowPadding: 8,
  betweenColPadding: 24,
  scrollOverflowValue: 1e6,
  // keep this below chrome's maximum translate value
  onRowClick: null,
  highlightedRows: null,
  firstColLeftPadding: 8,
  showRowNumber: !0,
  onShowRowNumberChange: () => {
  },
  highlightHoveredRow: !1,
  get rowHeight() {
    return this.textMaxLines * this.lineHeight + this.betweenRowPadding;
  },
  DEFAULT_TEXT_MAX_LINES: 3,
  DEFAULT_LINE_HEIGHT: 20,
  DEFAULT_ROW_NUMBER_COL_WIDTH: 60
};
class M$ {
  #e = /* @__PURE__ */ qe(on(S$));
  get config() {
    return z(this.#e);
  }
  set config(e) {
    ve(this.#e, e, !0);
  }
}
const zb = Symbol("config");
let nr = class {
  static initialize() {
    go(zb, new M$());
  }
  static get config() {
    const t = Tn(zb);
    if (t == null)
      throw new Error("config context not yet set");
    return t.config;
  }
};
class C$ {
  tableModel;
  tableController;
  margin = 2;
  isDragging = !1;
  lastDragX = 0;
  #e = /* @__PURE__ */ qe(0);
  get elementWidth() {
    return z(this.#e);
  }
  set elementWidth(e) {
    ve(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ Ce(() => this.elementWidth - this.margin * 2);
  get scrollbarWidth() {
    return z(this.#t);
  }
  set scrollbarWidth(e) {
    ve(this.#t, e);
  }
  #r = /* @__PURE__ */ Ce(() => this.tableController.viewWidth / this.tableModel.colsRightmostPosition * this.scrollbarWidth);
  get pillWidth() {
    return z(this.#r);
  }
  set pillWidth(e) {
    ve(this.#r, e);
  }
  #n = /* @__PURE__ */ Ce(() => -this.tableController.xScroll / this.tableModel.colsRightmostPosition * this.scrollbarWidth);
  get pillLeft() {
    return z(this.#n);
  }
  set pillLeft(e) {
    ve(this.#n, e);
  }
  constructor({ tableModel: e, tableController: r }) {
    this.tableModel = e, this.tableController = r;
  }
  handlePointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0, this.lastDragX = e.offsetX;
  };
  handlePointerMove = (e) => {
    this.isDragging && this.lastDragX !== null && this.tableController.scroll({ deltaX: e.offsetX - this.lastDragX, deltaY: 0 });
  };
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.lastDragX = null;
  };
}
const Ob = "mosaic-coordinator";
class K0 {
  static get coordinator() {
    return Tn(Ob) ?? Ed();
  }
  static set coordinator(e) {
    go(Ob, e);
  }
}
const An = "__oid", R$ = 120;
class A$ {
  schema;
  #e = /* @__PURE__ */ qe(on({}));
  get data() {
    return z(this.#e);
  }
  set data(e) {
    ve(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ qe(on({}));
  get defaultColWidths() {
    return z(this.#t);
  }
  set defaultColWidths(e) {
    ve(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ qe(on([]));
  get columns() {
    return z(this.#r);
  }
  set columns(e) {
    ve(this.#r, e, !0);
  }
  #n = /* @__PURE__ */ qe(0);
  get numRows() {
    return z(this.#n);
  }
  set numRows(e) {
    ve(this.#n, e, !0);
  }
  #u = /* @__PURE__ */ qe(0);
  get renderOffset() {
    return z(this.#u);
  }
  set renderOffset(e) {
    ve(this.#u, e, !0);
  }
  #o = /* @__PURE__ */ qe(on({}));
  get rowHeightAddition() {
    return z(this.#o);
  }
  set rowHeightAddition(e) {
    ve(this.#o, e, !0);
  }
  #i = /* @__PURE__ */ Ce(() => this.columns.reduce(
    (e, r) => (nr.config.columnConfigs[r]?.hidden && e.add(r), r === An && nr.config.showRowNumber === !1 && e.add(An), e),
    /* @__PURE__ */ new Set()
  ));
  get hiddenColumns() {
    return z(this.#i);
  }
  set hiddenColumns(e) {
    ve(this.#i, e);
  }
  rowKeyColumn = null;
  constructor(e) {
    this.schema = e;
  }
  #l = /* @__PURE__ */ Ce(() => Object.keys(this.data).sort((e, r) => this.data[e][An] - this.data[r][An]));
  get renderableRows() {
    return z(this.#l);
  }
  set renderableRows(e) {
    ve(this.#l, e);
  }
  #a = /* @__PURE__ */ Ce(() => this.columns.filter((e) => !this.hiddenColumns.has(e)));
  get renderableCols() {
    return z(this.#a);
  }
  set renderableCols(e) {
    ve(this.#a, e);
  }
  #s = /* @__PURE__ */ Ce(() => this.renderableRows.length === 0 ? this.zeroRowPosition : Math.min(...this.renderableRows.map((e) => this.rowPositions[e])));
  get minRowPosition() {
    return z(this.#s);
  }
  set minRowPosition(e) {
    ve(this.#s, e);
  }
  #f = /* @__PURE__ */ Ce(() => this.renderableRows.length === 0 ? this.finalRowPosition : Math.max(...this.renderableRows.map((e) => this.rowPositions[e])));
  get maxRowPosition() {
    return z(this.#f);
  }
  set maxRowPosition(e) {
    ve(this.#f, e);
  }
  #c = /* @__PURE__ */ Ce(() => {
    const e = Math.min(...this.renderableRows.map((r) => this.data[r][An]));
    return Number.isSafeInteger(e) ? e : 0;
  });
  get minRowOID() {
    return z(this.#c);
  }
  set minRowOID(e) {
    ve(this.#c, e);
  }
  #p = /* @__PURE__ */ Ce(() => {
    const e = Math.max(...this.renderableRows.map((r) => this.data[r][An]));
    return Number.isSafeInteger(e) ? e : 0;
  });
  get maxRowOID() {
    return z(this.#p);
  }
  set maxRowOID(e) {
    ve(this.#p, e);
  }
  #d = /* @__PURE__ */ Ce(() => 0);
  get zeroRowPosition() {
    return z(this.#d);
  }
  set zeroRowPosition(e) {
    ve(this.#d, e);
  }
  #h = /* @__PURE__ */ Ce(() => (this.numRows - 1) * nr.config.rowHeight + this.rowPositionOffsets.cumulative);
  get finalRowPosition() {
    return z(this.#h);
  }
  set finalRowPosition(e) {
    ve(this.#h, e);
  }
  colsLeftmostPosition = 0;
  #v = /* @__PURE__ */ Ce(() => {
    const e = this.renderableCols[this.renderableCols.length - 1];
    return this.colPositions[e] + this.colWidths[e];
  });
  get colsRightmostPosition() {
    return z(this.#v);
  }
  set colsRightmostPosition(e) {
    ve(this.#v, e);
  }
  #g = /* @__PURE__ */ Ce(() => this.renderableRows.reduce(
    ({ offsets: e, cumulative: r }, n) => {
      e[n] = r;
      const i = this.rowHeightAddition[n] ?? 0;
      return { offsets: e, cumulative: r + i };
    },
    { offsets: {}, cumulative: 0 }
  ));
  get rowPositionOffsets() {
    return z(this.#g);
  }
  set rowPositionOffsets(e) {
    ve(this.#g, e);
  }
  #m = /* @__PURE__ */ Ce(() => this.renderableRows.reduce(
    (e, r) => {
      const n = (this.data[r][An] - 1) * nr.config.rowHeight + this.rowPositionOffsets.offsets[r];
      return e[r] = n, e;
    },
    {}
  ));
  get rowPositions() {
    return z(this.#m);
  }
  set rowPositions(e) {
    ve(this.#m, e);
  }
  #y = /* @__PURE__ */ Ce(() => {
    let e = 0;
    return this.columns.reduce(
      (r, n, i) => (this.hiddenColumns.has(n) || (r[n] = e, e += this.colWidths[n]), r),
      {}
    );
  });
  get colPositions() {
    return z(this.#y);
  }
  set colPositions(e) {
    ve(this.#y, e);
  }
  #b = /* @__PURE__ */ Ce(() => this.renderableRows.reduce(
    (e, r) => (e[r] = nr.config.rowHeight + (this.rowHeightAddition[r] ?? 0), e),
    {}
  ));
  get rowHeights() {
    return z(this.#b);
  }
  set rowHeights(e) {
    ve(this.#b, e);
  }
  #x = /* @__PURE__ */ Ce(() => this.columns.reduce(
    (e, r, n) => (e[r] = Math.max(nr.config.columnConfigs[r]?.width ?? this.defaultColWidths[r] ?? R$, nr.config.minColumnWidths[r] ?? 0), this.isFirstCol(r) && (e[r] += nr.config.firstColLeftPadding), this.isLastCol(r) && (e[r] += nr.config.verticalScrollbarWidth), e),
    {}
  ));
  get colWidths() {
    return z(this.#x);
  }
  set colWidths(e) {
    ve(this.#x, e);
  }
  getContent({ row: e, col: r }) {
    return this.data[e] ? this.data[e][r] : null;
  }
  getRowData(e) {
    return this.data[e] ? this.data[e] : null;
  }
  getPosition({ row: e, col: r }) {
    const n = this.colPositions[r], i = this.rowPositions[e];
    return { x: n, y: i };
  }
  getDimensions({ row: e, col: r }) {
    const n = this.colWidths[r], i = this.rowHeights[e];
    return { width: n, height: i };
  }
  getRowParity(e) {
    return this.data[e] && this.data[e][An] % 2 === 0 ? "even" : "odd";
  }
  isFirstCol(e) {
    return this.renderableCols.indexOf(e) === 0;
  }
  isLastCol(e) {
    return this.renderableCols.indexOf(e) === this.renderableCols.length - 1;
  }
  // Deletes the given row and returns the offset necessary to remove from scroll position.
  deleteRow(e) {
    delete this.data[e];
    const r = this.rowHeightAddition[e] ?? 0;
    return delete this.rowHeightAddition[e], r;
  }
  collapseRow(e) {
    const r = this.rowHeightAddition[e] ?? 0;
    return delete this.rowHeightAddition[e], r;
  }
  reset() {
    this.data = {}, this.rowHeightAddition = {};
  }
  teardown() {
    this.reset();
  }
}
class E$ extends Td {
  tableName;
  onResult;
  constructor(e, r, n) {
    super(r ?? void 0), this.tableName = e, this.onResult = n;
  }
  queryResult(e) {
    const r = e.toArray()[0].count;
    return this.onResult(r), this;
  }
  query(e = []) {
    return Fs.from(this.tableName).select({ count: k9() }).where(e);
  }
}
const En = "__oid";
class T$ extends Td {
  tableName;
  columns;
  onResult;
  onColumnInfo;
  limit = 20;
  offset = 0;
  sort = null;
  info = null;
  columnInfo = null;
  isReady = !1;
  constructor(e, r, n, i, a) {
    super(n ?? void 0), this.tableName = e, this.columns = r, this.onResult = i, this.onColumnInfo = a;
  }
  async prepare() {
    if (this.coordinator == null)
      return;
    const e = (await y9(this.coordinator, [{ table: this.tableName, column: "*" }])).reduce((r, n) => (r[n.column] = n, r), {});
    this.columnInfo = e, this.onColumnInfo(e), this.isReady = !0;
  }
  getSelect({ includeRowNumber: e } = { includeRowNumber: !0 }) {
    const r = this.columns.reduce((n, i) => (this.columnInfo?.[i]?.sqlType === "BIGINT" ? n[i] = k1(fa(i), "TEXT") : n[i] = fa(i), n), {});
    return e || delete r[En], r;
  }
  queryResult(e) {
    return this.onResult(e), this;
  }
  query(e = []) {
    if (!this.isReady)
      return null;
    const r = this.columns.reduce((n, i) => (this.columnInfo?.[i]?.sqlType === "BIGINT" ? n[i] = k1(fa(i), "TEXT") : n[i] = fa(i), n), {});
    if (r[En] = x9(), this.sort) {
      const n = this.sort.direction === "ascending" ? this.sort.column : w9(this.sort.column);
      r[En] = r[En].orderby(n);
    }
    return Fs.from(this.tableName).select(r).where(e).limit(this.limit).offset(this.offset);
  }
  fetchRows(e, r) {
    this.offset = e, this.limit = r, this.requestUpdate();
  }
}
class $$ {
  model;
  schema;
  config;
  #e = /* @__PURE__ */ Ce(() => K0.coordinator);
  get coordinator() {
    return z(this.#e);
  }
  set coordinator(e) {
    ve(this.#e, e);
  }
  filterBy = null;
  rowsClient = null;
  numRowsClient = null;
  rowKeyColumn = null;
  #t = /* @__PURE__ */ qe(null);
  get element() {
    return z(this.#t);
  }
  set element(e) {
    ve(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ qe(0);
  get viewHeight() {
    return z(this.#r);
  }
  set viewHeight(e) {
    ve(this.#r, e, !0);
  }
  #n = /* @__PURE__ */ qe(0);
  get viewWidth() {
    return z(this.#n);
  }
  set viewWidth(e) {
    ve(this.#n, e, !0);
  }
  #u = /* @__PURE__ */ qe(0);
  get yScroll() {
    return z(this.#u);
  }
  set yScroll(e) {
    ve(this.#u, e, !0);
  }
  #o = /* @__PURE__ */ qe(0);
  get xScroll() {
    return z(this.#o);
  }
  set xScroll(e) {
    ve(this.#o, e, !0);
  }
  #i = /* @__PURE__ */ qe(!1);
  get isFetching() {
    return z(this.#i);
  }
  set isFetching(e) {
    ve(this.#i, e, !0);
  }
  #l = /* @__PURE__ */ qe(!1);
  get isJumping() {
    return z(this.#l);
  }
  set isJumping(e) {
    ve(this.#l, e, !0);
  }
  #a = /* @__PURE__ */ qe(null);
  get sort() {
    return z(this.#a);
  }
  set sort(e) {
    ve(this.#a, e, !0);
  }
  #s = /* @__PURE__ */ qe(!1);
  get isReady() {
    return z(this.#s);
  }
  set isReady(e) {
    ve(this.#s, e, !0);
  }
  #f = /* @__PURE__ */ qe(0);
  get updateKey() {
    return z(this.#f);
  }
  set updateKey(e) {
    ve(this.#f, e, !0);
  }
  #c = /* @__PURE__ */ qe(!1);
  get isStale() {
    return z(this.#c);
  }
  set isStale(e) {
    ve(this.#c, e, !0);
  }
  #p = /* @__PURE__ */ qe(null);
  get flashedRowId() {
    return z(this.#p);
  }
  set flashedRowId(e) {
    ve(this.#p, e, !0);
  }
  #d = /* @__PURE__ */ qe(null);
  get hoveredRowId() {
    return z(this.#d);
  }
  set hoveredRowId(e) {
    ve(this.#d, e, !0);
  }
  #h = /* @__PURE__ */ Ce(() => Math.ceil(this.viewHeight / nr.config.rowHeight));
  get rowsOnScreen() {
    return z(this.#h);
  }
  set rowsOnScreen(e) {
    ve(this.#h, e);
  }
  #v = /* @__PURE__ */ Ce(() => this.isJumping ? 0 : nr.config.renderWindowOffset);
  get renderWindowOffset() {
    return z(this.#v);
  }
  set renderWindowOffset(e) {
    ve(this.#v, e);
  }
  #g = /* @__PURE__ */ Ce(() => {
    if (this.model.renderableRows.length === 0)
      return null;
    const e = this.model.renderableRows.filter((n) => {
      const i = this.model.rowPositions[n] + this.yScroll;
      return i + this.model.rowHeights[n] > 0 && i < this.viewHeight;
    });
    if (e.length === 0)
      return null;
    const r = e[0];
    return this.model.data[r][En];
  });
  get firstVisibleRowOID() {
    return z(this.#g);
  }
  set firstVisibleRowOID(e) {
    ve(this.#g, e);
  }
  #m = /* @__PURE__ */ Ce(() => Math.max(0, Math.floor(-this.yScroll / nr.config.rowHeight)));
  get offset() {
    return z(this.#m);
  }
  set offset(e) {
    ve(this.#m, e);
  }
  onFetchResolveBegin = null;
  onFetchResolveEnd = null;
  constructor(e, r) {
    this.model = e, this.schema = r, this.config = nr.config;
  }
  handleFilterBy = () => {
    this.rowsClient && (this.rowsClient.offset = 0, this.rowsClient.limit = this.rowsOnScreen, this.isJumping = !0, this.markStale());
  };
  updateData = (e) => {
    if (!this.model || !this.rowKeyColumn)
      return;
    this.onFetchResolveBegin && (this.onFetchResolveBegin(), this.onFetchResolveBegin = null);
    const r = e.toArray(), n = {};
    for (const i of r) {
      const a = i[this.rowKeyColumn];
      n[a] = i;
    }
    this.model.data = { ...this.model.data, ...n }, this.onFetchResolveEnd && (this.onFetchResolveEnd(), this.onFetchResolveEnd = null), this.isFetching = !1;
  };
  initialize({ tableName: e, rowKey: r, columns: n, filterBy: i }) {
    if (this.model.columns = n, this.model.rowKeyColumn = r, this.rowKeyColumn = r, i && (this.filterBy = i, this.filterBy.addEventListener("value", this.handleFilterBy)), !this.rowKeyColumn)
      throw new Error("rowkey cannot be null");
    let a = n.includes(this.rowKeyColumn) ? n : [...n, this.rowKeyColumn];
    this.rowsClient = new T$(
      e,
      a,
      i,
      (l) => {
        this.updateData(l);
      },
      (l) => {
        this.schema.columnInfo = l, this.computeColWidths(e, n), this.isReady = !0;
      }
    ), this.coordinator.connect(this.rowsClient), this.numRowsClient = new E$(e, i, (l) => {
      this.model && (this.model.numRows = l);
    }), this.coordinator.connect(this.numRowsClient), xr(() => {
      if (!this.rowsClient || this.isFetching || !this.isReady)
        return;
      const l = -this.renderWindowOffset, u = this.viewHeight + this.renderWindowOffset, c = this.model.maxRowPosition + this.yScroll + this.config.rowHeight, f = this.model.minRowPosition + this.yScroll;
      if (f < 0 && c < 0 || f > this.viewHeight && c > this.viewHeight) {
        const w = this.rowsOnScreen;
        this.isFetching = !0, this.rowsClient.fetchRows(this.offset, w);
      } else {
        if (c < u) {
          const x = Y0.clamp(Math.ceil((u - c) / this.config.rowHeight), this.config.minFetchSize, this.rowsOnScreen);
          x > 0 && this.model.maxRowOID !== this.model.numRows && (this.isFetching = !0, this.rowsClient.fetchRows(this.model.maxRowOID, x));
        }
        const w = this.model.minRowPosition + this.yScroll;
        if (w > l && this.model.minRowOID !== 1) {
          const x = Y0.clamp(Math.ceil((w - l) / this.config.rowHeight), this.config.minFetchSize, this.rowsOnScreen);
          x > 0 && (this.isFetching = !0, this.rowsClient.fetchRows(Math.max(0, this.model.minRowOID - 1 - x), x));
        }
      }
      const d = Ck(this.model.renderableRows);
      let p = 0;
      for (; this.model.rowPositions[d[p]] + this.yScroll + this.model.rowHeights[d[p]] < 0; )
        this.yScroll += this.model.collapseRow(d[p]), p += 1;
      let g = d.length - 1;
      for (; this.model.rowPositions[d[g]] + this.yScroll > this.viewHeight; )
        this.model.collapseRow(d[g]), g -= 1;
      let m = 0;
      for (; this.model.rowPositions[d[m]] + this.yScroll + this.model.rowHeights[d[m]] < l; )
        this.model.deleteRow(d[m]), m += 1;
      let y = d.length - 1;
      for (; this.model.rowPositions[d[y]] + this.yScroll > u; )
        this.model.deleteRow(d[y]), y -= 1;
    });
  }
  teardown() {
    this.filterBy && this.filterBy.removeEventListener("value", this.handleFilterBy);
  }
  cellIsVisible(e) {
    const { x: r, y: n } = this.model.getPosition(e), { width: i, height: a } = this.model.getDimensions(e), l = r + this.xScroll, u = n + this.yScroll;
    return l + i >= 0 && l <= this.viewWidth && u + a >= 0 && u <= this.viewHeight;
  }
  rowIsVisible(e) {
    const r = this.model.rowPositions[e], n = this.model.rowHeights[e], i = r + this.yScroll;
    return i + n >= 0 && i <= this.viewHeight;
  }
  rowStillExists(e) {
    return this.model.data[e] != null;
  }
  colIsVisible(e) {
    const r = this.model.colPositions[e], n = this.model.colWidths[e], i = r + this.xScroll;
    return i + n >= 0 && i <= this.viewWidth;
  }
  scroll({ deltaX: e, deltaY: r }) {
    if (Math.abs(r) > Math.abs(e)) {
      const n = this.yScroll - r;
      this.model.zeroRowPosition + n > 0 ? this.yScroll = -this.model.zeroRowPosition : this.model.finalRowPosition + n < 0 ? this.yScroll = -this.model.finalRowPosition : this.yScroll = n;
    } else {
      const n = this.xScroll - e;
      -n < 0 ? this.xScroll = 0 : -n > Math.max(this.model.colsRightmostPosition, this.viewWidth) - this.viewWidth ? this.xScroll = -Math.max(this.model.colsRightmostPosition, this.viewWidth) + this.viewWidth : this.xScroll = n;
    }
  }
  handleWheel = (e) => {
    e.preventDefault(), this.isJumping = !1, this.scroll({ deltaX: e.deltaX, deltaY: e.deltaY });
  };
  jumpToOffset(e) {
    if (!this.rowsClient)
      return;
    this.isFetching = !0;
    const r = this.rowsOnScreen, n = this.onFetchResolveEnd;
    this.onFetchResolveEnd = () => {
      n && n(), this.yScroll = -(e * this.config.rowHeight);
    }, this.markStale(), this.rowsClient.fetchRows(e, r);
  }
  handleSort = (e) => {
    this.rowsClient && (this.sort = e, this.rowsClient.sort = e, this.resetRows());
  };
  resetRows() {
    this.model.reset(), this.yScroll = 0;
  }
  flashRow(e) {
    this.flashedRowId = e, setTimeout(
      () => {
        this.flashedRowId = null;
      },
      400
    );
  }
  async scrollToRow(e, r = !0) {
    if (!this.rowsClient)
      return;
    this.isFetching = !0;
    const n = Fs.with({
      original: this.rowsClient.query(this.rowsClient.filterBy?.predicate(this.rowsClient)).offset(0).limit(this.model.numRows)
    }).select([En]).from("original").where(b9(fa(this.rowKeyColumn), Jx(e))), i = (await this.coordinator.query(n)).toArray();
    if (i.length > 0) {
      const a = i[0][En] - 1;
      this.onFetchResolveEnd = () => {
        r && this.flashRow(e);
      }, this.jumpToOffset(a);
    } else
      this.isFetching = !1, console.error("no row", e, "found");
  }
  addHeightToRow(e, r) {
    this.model.rowHeightAddition[e] = (this.model.rowHeightAddition[e] ?? 0) + r;
  }
  hideColumn(e) {
    e === En ? this.config.onShowRowNumberChange ? this.config.onShowRowNumberChange(!1) : this.config.showRowNumber = !1 : (this.config.columnConfigs[e] || (this.config.columnConfigs[e] = {}), this.config.columnConfigs[e].hidden = !0);
  }
  showColumn(e) {
    e === En ? this.config.onShowRowNumberChange ? this.config.onShowRowNumberChange(!0) : this.config.showRowNumber = !0 : (this.config.columnConfigs[e] || (this.config.columnConfigs[e] = {}), this.config.columnConfigs[e].hidden = !1);
  }
  // Marks the current state stale, telling the view to destroy any existing cells on next render.
  markStale() {
    this.isStale = !0;
    const e = this.onFetchResolveBegin;
    this.onFetchResolveBegin = () => {
      e && e(), this.resetRows();
    };
    const r = this.onFetchResolveEnd;
    this.onFetchResolveEnd = () => {
      r && r(), this.updateKey += 1, this.isStale = !1;
    };
  }
  async computeColWidths(e, r) {
    const n = r.filter((c) => c !== En), i = this.rowsClient?.getSelect({ includeRowNumber: !1 }), a = n.reduce(
      (c, f) => (c[f] = 0, c),
      {}
    ), l = Fs.from(e).select(i).offset(0).limit(10), u = (await this.coordinator.query(l)).toArray();
    for (const c of u)
      for (const f of n)
        a[f] = Math.max(a[f], F$(c[f]));
    r.includes(En) && (a[En] = this.config.DEFAULT_ROW_NUMBER_COL_WIDTH), this.model.defaultColWidths = a;
  }
}
function F$(t) {
  const e = String(t).length;
  return e > 200 ? 600 : e > 100 ? 300 : e > 20 ? 200 : e > 10 ? 150 : 120;
}
class N$ {
  tableController;
  #e = /* @__PURE__ */ Ce(() => this.tableController.element);
  get tableElement() {
    return z(this.#e);
  }
  set tableElement(e) {
    ve(this.#e, e);
  }
  constructor(e) {
    this.tableController = e;
  }
  mount(e, r, n, i, a) {
    if (!this.tableElement)
      return;
    const l = r.getBoundingClientRect(), u = this.tableElement.getBoundingClientRect(), c = u.top, f = u.left;
    switch (n) {
      case "inside":
        switch (a) {
          case "top":
            e.style.top = l.top - c + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + n + a);
        }
        switch (i) {
          case "left":
            e.style.left = l.left - f + "px";
          case "center":
          case "right":
            throw new Error("not yet implemented" + n + i);
        }
        break;
      case "outside":
        switch (a) {
          case "top":
            e.style.top = l.bottom - c + "px";
            break;
          case "middle":
          case "bottom":
            throw new Error("not yet implemented" + n + a);
        }
        switch (i) {
          case "left":
            e.style.left = l.left - f + "px";
            break;
          case "center":
          case "right":
            throw new Error("not yet implemented" + n + i);
        }
        break;
    }
    this.tableElement.appendChild(e);
  }
  destroy(e) {
    this.tableElement && this.tableElement.contains(e) && this.tableElement.removeChild(e);
  }
}
var jp, Bb;
function z$() {
  if (Bb) return jp;
  Bb = 1;
  function t(e, r, n) {
    return e === e && (n !== void 0 && (e = e <= n ? e : n), r !== void 0 && (e = e >= r ? e : r)), e;
  }
  return jp = t, jp;
}
var Up, Db;
function O$() {
  if (Db) return Up;
  Db = 1;
  var t = /\s/;
  function e(r) {
    for (var n = r.length; n-- && t.test(r.charAt(n)); )
      ;
    return n;
  }
  return Up = e, Up;
}
var Wp, Pb;
function B$() {
  if (Pb) return Wp;
  Pb = 1;
  var t = O$(), e = /^\s+/;
  function r(n) {
    return n && n.slice(0, t(n) + 1).replace(e, "");
  }
  return Wp = r, Wp;
}
var Hp, Lb;
function Og() {
  if (Lb) return Hp;
  Lb = 1;
  function t(e) {
    var r = typeof e;
    return e != null && (r == "object" || r == "function");
  }
  return Hp = t, Hp;
}
var Vp, qb;
function D$() {
  if (qb) return Vp;
  qb = 1;
  var t = typeof ma == "object" && ma && ma.Object === Object && ma;
  return Vp = t, Vp;
}
var Gp, Ib;
function u3() {
  if (Ib) return Gp;
  Ib = 1;
  var t = D$(), e = typeof self == "object" && self && self.Object === Object && self, r = t || e || Function("return this")();
  return Gp = r, Gp;
}
var Xp, jb;
function c3() {
  if (jb) return Xp;
  jb = 1;
  var t = u3(), e = t.Symbol;
  return Xp = e, Xp;
}
var Yp, Ub;
function P$() {
  if (Ub) return Yp;
  Ub = 1;
  var t = c3(), e = Object.prototype, r = e.hasOwnProperty, n = e.toString, i = t ? t.toStringTag : void 0;
  function a(l) {
    var u = r.call(l, i), c = l[i];
    try {
      l[i] = void 0;
      var f = !0;
    } catch {
    }
    var d = n.call(l);
    return f && (u ? l[i] = c : delete l[i]), d;
  }
  return Yp = a, Yp;
}
var Kp, Wb;
function L$() {
  if (Wb) return Kp;
  Wb = 1;
  var t = Object.prototype, e = t.toString;
  function r(n) {
    return e.call(n);
  }
  return Kp = r, Kp;
}
var Zp, Hb;
function q$() {
  if (Hb) return Zp;
  Hb = 1;
  var t = c3(), e = P$(), r = L$(), n = "[object Null]", i = "[object Undefined]", a = t ? t.toStringTag : void 0;
  function l(u) {
    return u == null ? u === void 0 ? i : n : a && a in Object(u) ? e(u) : r(u);
  }
  return Zp = l, Zp;
}
var Qp, Vb;
function I$() {
  if (Vb) return Qp;
  Vb = 1;
  function t(e) {
    return e != null && typeof e == "object";
  }
  return Qp = t, Qp;
}
var Jp, Gb;
function j$() {
  if (Gb) return Jp;
  Gb = 1;
  var t = q$(), e = I$(), r = "[object Symbol]";
  function n(i) {
    return typeof i == "symbol" || e(i) && t(i) == r;
  }
  return Jp = n, Jp;
}
var e0, Xb;
function f3() {
  if (Xb) return e0;
  Xb = 1;
  var t = B$(), e = Og(), r = j$(), n = NaN, i = /^[-+]0x[0-9a-f]+$/i, a = /^0b[01]+$/i, l = /^0o[0-7]+$/i, u = parseInt;
  function c(f) {
    if (typeof f == "number")
      return f;
    if (r(f))
      return n;
    if (e(f)) {
      var d = typeof f.valueOf == "function" ? f.valueOf() : f;
      f = e(d) ? d + "" : d;
    }
    if (typeof f != "string")
      return f === 0 ? f : +f;
    f = t(f);
    var p = a.test(f);
    return p || l.test(f) ? u(f.slice(2), p ? 2 : 8) : i.test(f) ? n : +f;
  }
  return e0 = c, e0;
}
var t0, Yb;
function U$() {
  if (Yb) return t0;
  Yb = 1;
  var t = z$(), e = f3();
  function r(n, i, a) {
    return a === void 0 && (a = i, i = void 0), a !== void 0 && (a = e(a), a = a === a ? a : 0), i !== void 0 && (i = e(i), i = i === i ? i : 0), t(e(n), i, a);
  }
  return t0 = r, t0;
}
var W$ = U$();
const H$ = /* @__PURE__ */ zg(W$);
var r0, Kb;
function V$() {
  if (Kb) return r0;
  Kb = 1;
  var t = u3(), e = function() {
    return t.Date.now();
  };
  return r0 = e, r0;
}
var n0, Zb;
function G$() {
  if (Zb) return n0;
  Zb = 1;
  var t = Og(), e = V$(), r = f3(), n = "Expected a function", i = Math.max, a = Math.min;
  function l(u, c, f) {
    var d, p, g, m, y, w, x = 0, k = !1, S = !1, _ = !0;
    if (typeof u != "function")
      throw new TypeError(n);
    c = r(c) || 0, t(f) && (k = !!f.leading, S = "maxWait" in f, g = S ? i(r(f.maxWait) || 0, c) : g, _ = "trailing" in f ? !!f.trailing : _);
    function E(q) {
      var H = d, X = p;
      return d = p = void 0, x = q, m = u.apply(X, H), m;
    }
    function C(q) {
      return x = q, y = setTimeout(N, c), k ? E(q) : m;
    }
    function R(q) {
      var H = q - w, X = q - x, V = c - H;
      return S ? a(V, g - X) : V;
    }
    function A(q) {
      var H = q - w, X = q - x;
      return w === void 0 || H >= c || H < 0 || S && X >= g;
    }
    function N() {
      var q = e();
      if (A(q))
        return L(q);
      y = setTimeout(N, R(q));
    }
    function L(q) {
      return y = void 0, _ && d ? E(q) : (d = p = void 0, m);
    }
    function j() {
      y !== void 0 && clearTimeout(y), x = 0, d = w = p = y = void 0;
    }
    function B() {
      return y === void 0 ? m : L(e());
    }
    function P() {
      var q = e(), H = A(q);
      if (d = arguments, p = this, w = q, H) {
        if (y === void 0)
          return C(w);
        if (S)
          return clearTimeout(y), y = setTimeout(N, c), E(w);
      }
      return y === void 0 && (y = setTimeout(N, c)), m;
    }
    return P.cancel = j, P.flush = B, P;
  }
  return n0 = l, n0;
}
var o0, Qb;
function X$() {
  if (Qb) return o0;
  Qb = 1;
  var t = G$(), e = Og(), r = "Expected a function";
  function n(i, a, l) {
    var u = !0, c = !0;
    if (typeof i != "function")
      throw new TypeError(r);
    return e(l) && (u = "leading" in l ? !!l.leading : u, c = "trailing" in l ? !!l.trailing : c), t(i, a, {
      leading: u,
      maxWait: a,
      trailing: c
    });
  }
  return o0 = n, o0;
}
var Y$ = X$();
const Jb = /* @__PURE__ */ zg(Y$);
class K$ {
  tableModel;
  tableController;
  isDragging = !1;
  #e = /* @__PURE__ */ qe(0);
  get elementHeight() {
    return z(this.#e);
  }
  set elementHeight(e) {
    ve(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ qe(0);
  get labelHeight() {
    return z(this.#t);
  }
  set labelHeight(e) {
    ve(this.#t, e, !0);
  }
  #r = /* @__PURE__ */ Ce(() => nr.config.verticalScrollbarPillHeight);
  get pillHeight() {
    return z(this.#r);
  }
  set pillHeight(e) {
    ve(this.#r, e);
  }
  #n = /* @__PURE__ */ Ce(() => this.elementHeight - this.pillHeight);
  get scrollbarHeight() {
    return z(this.#n);
  }
  set scrollbarHeight(e) {
    ve(this.#n, e);
  }
  #u = /* @__PURE__ */ Ce(() => this.tableController.firstVisibleRowOID ? this.tableController.firstVisibleRowOID : this.tableController.offset + 1);
  get displayRow() {
    return z(this.#u);
  }
  set displayRow(e) {
    ve(this.#u, e);
  }
  #o = /* @__PURE__ */ Ce(() => (this.displayRow - 1) / (this.tableModel.numRows - 1) * this.scrollbarHeight);
  get pillPosition() {
    return z(this.#o);
  }
  set pillPosition(e) {
    ve(this.#o, e);
  }
  #i = /* @__PURE__ */ Ce(() => {
    if (this.pillPosition === null)
      return 0;
    const e = this.pillPosition + this.pillHeight / 2 - this.labelHeight / 2;
    if (e < 0)
      return e;
    const r = this.pillPosition + this.pillHeight / 2 + this.labelHeight / 2;
    return r > this.elementHeight ? r - this.elementHeight : 0;
  });
  get labelOffset() {
    return z(this.#i);
  }
  set labelOffset(e) {
    ve(this.#i, e);
  }
  constructor({ tableModel: e, tableController: r }) {
    this.tableModel = e, this.tableController = r;
  }
  computeOffsetFromPointer = (e) => {
    this.isDragging = !0;
    let r = Math.round(e.offsetY / this.scrollbarHeight * (this.tableModel.numRows - 1));
    return H$(r, 0, this.tableModel.numRows - 1);
  };
  pointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0;
    const r = this.computeOffsetFromPointer(e);
    this.tableController.isJumping = !0, this.tableController.jumpToOffset(r);
  };
  handlePointerDown = Jb(this.pointerDown, 50);
  pointerMove = (e) => {
    if (this.isDragging) {
      const r = this.computeOffsetFromPointer(e);
      this.tableController.jumpToOffset(r);
    }
  };
  handlePointerMove = Jb(this.pointerMove, 50);
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.tableController.isJumping = !1;
  };
}
class Z$ {
  #e = /* @__PURE__ */ qe(null);
  get columnInfo() {
    return z(this.#e);
  }
  set columnInfo(e) {
    ve(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ Ce(() => this.columnInfo ? Object.keys(this.columnInfo).reduce(
    (e, r) => (e[r] = this.columnInfo[r].type, e),
    {}
  ) : {});
  get dataType() {
    return z(this.#t);
  }
  set dataType(e) {
    ve(this.#t, e);
  }
  #r = /* @__PURE__ */ Ce(() => this.columnInfo ? Object.keys(this.columnInfo).reduce(
    (e, r) => (e[r] = this.columnInfo[r].sqlType, e),
    {}
  ) : {});
  get sqlType() {
    return z(this.#r);
  }
  set sqlType(e) {
    ve(this.#r, e);
  }
}
class Q$ {
  tableController;
  #e = /* @__PURE__ */ Ce(() => Math.floor(-this.tableController.yScroll / nr.config.scrollOverflowValue) * nr.config.scrollOverflowValue);
  get offset() {
    return z(this.#e);
  }
  set offset(e) {
    ve(this.#e, e);
  }
  constructor(e) {
    this.tableController = e;
  }
  y(e) {
    return e - this.offset;
  }
  yScroll(e) {
    return e + this.offset;
  }
}
const ex = Symbol("schema"), tx = Symbol("model"), rx = Symbol("controller"), nx = Symbol("vertical-scrollbar-controller"), ox = Symbol("horizontal-scrollbar-controller"), ix = Symbol("table-portal-controller"), ax = Symbol("overscroll-modifier");
let tr = class {
  static initialize() {
    const t = new Z$(), e = new A$(t), r = new $$(e, t), n = new K$({ tableModel: e, tableController: r }), i = new C$({ tableModel: e, tableController: r }), a = new N$(r), l = new Q$(r);
    go(ex, t), go(tx, e), go(rx, r), go(nx, n), go(ox, i), go(ix, a), go(ax, l);
  }
  static get schema() {
    return Tn(ex);
  }
  static get model() {
    return Tn(tx);
  }
  static get controller() {
    return Tn(rx);
  }
  static get verticalScrollbarController() {
    return Tn(nx);
  }
  static get horizontalScrollbarController() {
    return Tn(ox);
  }
  static get tablePortalController() {
    return Tn(ix);
  }
  static get overscrollModifier() {
    return Tn(ax);
  }
};
var J$ = /* @__PURE__ */ Wt('<div class="horizontal-scrollbar svelte-1poinb5"><div class="pill svelte-1poinb5"></div></div>');
const eF = {
  hash: "svelte-1poinb5",
  code: ".horizontal-scrollbar.svelte-1poinb5 {position:absolute;bottom:0;left:0;width:100%;height:var(--height);transition:opacity 200ms linear;background-color:var(--scrollbar-bg);}.horizontal-scrollbar.svelte-1poinb5:hover {opacity:1 !important;}.pill.svelte-1poinb5 {width:var(--width);height:calc(var(--height) - var(--margin) * 2);margin:var(--margin);border-radius:2px;background-color:var(--scrollbar-pill-bg);}"
};
function tF(t, e) {
  $r(e, !0), Mr(t, eF);
  const r = tr.horizontalScrollbarController, n = tr.controller, i = nr.config;
  let a = /* @__PURE__ */ qe(0), l = /* @__PURE__ */ qe(null), u = /* @__PURE__ */ qe(null), c = 0;
  Ks(() => (c = requestAnimationFrame(p), () => {
    cancelAnimationFrame(c);
  }));
  function f() {
    z(l) && (z(l).style.opacity = "0");
  }
  const d = s3.debounce(f, 1e3);
  xr(() => {
    z(l) && (n.xScroll, z(l).style.opacity = "1", d());
  });
  function p() {
    ve(a, r.pillWidth, !0), z(u) && (z(u).style.transform = `translate(${r.pillLeft}px, 0)`), c = requestAnimationFrame(p);
  }
  var g = J$();
  let m;
  var y = Xt(g);
  y.__pointerdown = function(...x) {
    r.handlePointerDown?.apply(this, x);
  }, y.__pointermove = function(...x) {
    r.handlePointerMove?.apply(this, x);
  }, y.__pointerup = function(...x) {
    r.handlePointerUp?.apply(this, x);
  };
  let w;
  Pn(y, (x) => ve(u, x), () => z(u)), jt(g), Pn(g, (x) => ve(l, x), () => z(l)), Dr(
    (x, k) => {
      m = Ln(g, "", m, x), w = Ln(y, "", w, k);
    },
    [
      () => ({ "--height": i.horizontalScrollbarHeight + "px" }),
      () => ({
        "--width": z(a) + "px",
        "--margin": r.margin + "px"
      })
    ]
  ), Ho(g, "clientWidth", (x) => r.elementWidth = x), St(t, g), Fr();
}
Xi(["pointerdown", "pointermove", "pointerup"]);
var rF = /* @__PURE__ */ Wt('<div class="vertical-scrollbar svelte-15rl9bf"><div class="pill svelte-15rl9bf"><div class="label svelte-15rl9bf"> </div></div></div>');
const nF = {
  hash: "svelte-15rl9bf",
  code: ".vertical-scrollbar.svelte-15rl9bf {position:absolute;right:0;top:0;width:var(--width);height:calc(100% - var(--offset-bottom));contain:layout;cursor:row-resize;transition:opacity 200ms linear;user-select:none;background-color:var(--scrollbar-bg);}.vertical-scrollbar.svelte-15rl9bf:hover {opacity:1 !important;}.pill.svelte-15rl9bf {--pill-height: 4px;position:relative;pointer-events:none; /* let the container respond to pointer events */top:0;left:0;width:calc(var(--width) - 2px);margin-left:1px;margin-right:1px;height:var(--pill-height);border-radius:2px;will-change:transform;background-color:var(--scrollbar-pill-bg);}.label.svelte-15rl9bf {--offset: 0;position:absolute;pointer-events:none;top:0;left:-4px;font-family:var(--font-family);font-size:14px;white-space:nowrap;padding:2px 4px;box-shadow:var(--shadow);transform:translate(-100%, calc(-50% + var(--pill-height) / 2 - var(--offset)));border-radius:2px;color:var(--secondary-text-color);background-color:var(--scrollbar-label-bg);border:var(--outline);}"
};
function oF(t, e) {
  $r(e, !0), Mr(t, nF);
  const r = tr.verticalScrollbarController, n = tr.controller, i = nr.config;
  let a = /* @__PURE__ */ qe(0), l = /* @__PURE__ */ qe(0), u = /* @__PURE__ */ qe(null), c = /* @__PURE__ */ qe(null), f = /* @__PURE__ */ qe(null), d = /* @__PURE__ */ Ce(() => new Intl.NumberFormat().format(z(l))), p = 0;
  Ks(() => (p = requestAnimationFrame(y), () => {
    cancelAnimationFrame(p);
  }));
  function g() {
    z(u) && (z(u).style.opacity = "0");
  }
  const m = s3.debounce(g, 1e3);
  xr(() => {
    z(u) && (n.yScroll, z(u).style.opacity = "1", m());
  });
  function y() {
    ve(a, r.pillPosition ?? z(a), !0), ve(l, r.displayRow ?? z(l), !0), z(c) && (z(c).style.transform = `translate3d(0, ${z(a)}px, 0)`), z(f) && z(f).style.setProperty("--offset", r.labelOffset - 1 + "px"), p = requestAnimationFrame(y);
  }
  var w = rF();
  w.__pointerdown = function(...C) {
    r.handlePointerDown?.apply(this, C);
  }, w.__pointermove = function(...C) {
    r.handlePointerMove?.apply(this, C);
  }, w.__pointerup = function(...C) {
    r.handlePointerUp?.apply(this, C);
  };
  let x;
  var k = Xt(w);
  let S;
  var _ = Xt(k), E = Xt(_, !0);
  jt(_), Pn(_, (C) => ve(f, C), () => z(f)), jt(k), Pn(k, (C) => ve(c, C), () => z(c)), jt(w), Pn(w, (C) => ve(u, C), () => z(u)), Dr(
    (C, R) => {
      x = Ln(w, "", x, C), S = Ln(k, "", S, R), mi(E, z(d));
    },
    [
      () => ({
        "--offset-bottom": i.horizontalScrollbarHeight + "px",
        "--width": i.verticalScrollbarWidth + "px"
      }),
      () => ({
        "--pill-height": r.pillHeight + "px"
      })
    ]
  ), Ho(_, "clientHeight", (C) => r.labelHeight = C), Ho(w, "clientHeight", (C) => r.elementHeight = C), St(t, w), Fr();
}
Xi(["pointerdown", "pointermove", "pointerup"]);
var iF = /* @__PURE__ */ Wt('<a target="_blank"> </a>'), aF = /* @__PURE__ */ Wt('<div class="link-content"><!></div>');
const lF = { hash: "svelte-3kpd", code: "" };
function sF(t, e) {
  $r(e, !0), Mr(t, lF);
  let r = Rc(e, "height");
  var n = aF(), i = Xt(n);
  {
    var a = (l) => {
      var u = iF(), c = Xt(u, !0);
      jt(u), Dr(() => {
        md(u, "href", e.url), mi(c, e.url);
      }), St(l, u);
    };
    Yn(i, (l) => {
      e.url && l(a);
    });
  }
  jt(n), Ho(n, "clientHeight", r), St(t, n), Fr();
}
var uF = /* @__PURE__ */ Wt('<div class="number-content svelte-rqpfez"> </div>');
const cF = {
  hash: "svelte-rqpfez",
  code: ".number-content.svelte-rqpfez {text-align:right;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function fF(t, e) {
  $r(e, !0), Mr(t, cF);
  let r = Rc(e, "height");
  function n(l) {
    return l === null ? null : Number.isInteger(l) ? l.toString() : l.toPrecision(4).toString();
  }
  var i = uF(), a = Xt(i, !0);
  jt(i), Dr((l) => mi(a, l), [() => n(e.number)]), Ho(i, "clientHeight", r), St(t, i), Fr();
}
var dF = /* @__PURE__ */ Wt("<div> </div>");
const hF = {
  hash: "svelte-122k9kr",
  code: ".clamped.svelte-122k9kr {display:-webkit-box;-webkit-box-orient:vertical;line-clamp:var(--lines, var(--num-lines)); /* fallback to numlines from parent */-webkit-line-clamp:var(--lines, var(--num-lines));overflow:hidden;text-overflow:ellipsis;}"
};
function lx(t, e) {
  $r(e, !0), Mr(t, hF);
  let r = Rc(e, "height");
  const n = nr.config;
  let i = /* @__PURE__ */ qe(null), a = /* @__PURE__ */ qe(null);
  xr(() => {
    z(i) && (r(z(i).scrollHeight), ve(a, Math.floor(e.parentHeight / n.lineHeight), !0));
  });
  var l = dF();
  let u;
  var c = Xt(l, !0);
  jt(l), Pn(l, (f) => ve(i, f), () => z(i)), Dr(
    (f) => {
      Ra(l, 1, `text-content ${(e.clamped ? "clamped" : null) ?? ""}`, "svelte-122k9kr"), u = Ln(l, "", u, f), mi(c, e.text);
    },
    [() => ({ "--lines": z(a) })]
  ), St(t, l), Fr();
}
class pF {
  #e = /* @__PURE__ */ qe(on({}));
  get config() {
    return z(this.#e);
  }
  set config(e) {
    ve(this.#e, e, !0);
  }
}
const i0 = "custom-cells";
class Wf {
  static initialize() {
    go(i0, new pF());
  }
  static set config(e) {
    const r = Tn(i0);
    r.config = e;
  }
  static get config() {
    return Tn(i0).config;
  }
}
var vF = /* @__PURE__ */ Wt('<div class="bigint-content svelte-35i9ld"> </div>');
const gF = {
  hash: "svelte-35i9ld",
  code: ".bigint-content.svelte-35i9ld {text-align:right;text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function mF(t, e) {
  $r(e, !0), Mr(t, gF);
  let r = Rc(e, "height");
  function n(l) {
    return l === null ? null : l.toLocaleString();
  }
  var i = vF(), a = Xt(i, !0);
  jt(i), Dr((l) => mi(a, l), [() => n(e.bigint)]), Ho(i, "clientHeight", r), St(t, i), Fr();
}
var yF = /* @__PURE__ */ Wt("<div></div>");
const bF = { hash: "svelte-3kpd", code: "" };
function xF(t, e) {
  $r(e, !0), Mr(t, bF);
  let r = Rc(e, "height");
  const n = tr.model, i = (f) => typeof f == "function" ? (d, p) => {
    let g = new f(d, p);
    return {
      ...g.update ? { update: g.update.bind(g) } : {},
      ...g.destroy ? { destroy: g.destroy.bind(g) } : {}
    };
  } : (d, p) => {
    let g = new f.class(d, p);
    return {
      ...g.update ? { update: g.update.bind(g) } : {},
      ...g.destroy ? { destroy: g.destroy.bind(g) } : {}
    };
  };
  let a = /* @__PURE__ */ Ce(() => i(e.customCell)), l = /* @__PURE__ */ Ce(() => n.getContent({ row: e.row, col: e.col })), u = /* @__PURE__ */ Ce(() => n.getRowData(e.row));
  var c = yF();
  Fg(c, (f, d) => z(a)?.(f, d), () => ({ value: z(l), rowData: z(u) })), Cc(() => Ho(c, "clientHeight", r)), St(t, c), Fr();
}
var wF = (t, e, r, n, i) => {
  e.addHeightToRow(r.row, z(n) - z(i));
}, kF = /* @__PURE__ */ Wt("<button>↘</button>"), _F = /* @__PURE__ */ Wt('<div class="cell-content clamp svelte-ix87lc"><!> <!></div>');
const SF = {
  hash: "svelte-ix87lc",
  code: ".cell-content.svelte-ix87lc {position:relative;flex-grow:1;line-height:var(--lineHeight);overflow-wrap:anywhere;overflow:hidden;}.expand-button.svelte-ix87lc {all:unset;visibility:hidden;position:absolute;bottom:0;right:0;cursor:pointer;font-size:12px;line-height:18px;padding-left:4px;padding-right:4px;border-radius:2px;color:var(--secondary-text-color);background-color:var(--background-color);border:var(--outline);}.expand-button.show.svelte-ix87lc {visibility:visible;}"
};
function MF(t, e) {
  $r(e, !0), Mr(t, SF);
  const r = tr.model, n = tr.controller, i = tr.schema, a = nr.config, l = Wf.config;
  let u = /* @__PURE__ */ qe(0), c = /* @__PURE__ */ qe(0), f = /* @__PURE__ */ Ce(() => z(c) > z(u));
  const d = r.getContent({ row: e.row, col: e.col }), p = i.dataType[e.col] ?? "string", g = i.sqlType[e.col] ?? "TEXT";
  var m = _F();
  let y;
  var w = Xt(m);
  {
    var x = (E) => {
      xF(E, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        },
        get customCell() {
          return l[e.col];
        },
        get height() {
          return z(c);
        },
        set height(C) {
          ve(c, C, !0);
        }
      });
    }, k = (E) => {
      var C = ys(), R = yo(C);
      {
        var A = (L) => {
          var j = ys(), B = yo(j);
          {
            var P = (H) => {
              sF(H, {
                get url() {
                  return d;
                },
                get height() {
                  return z(c);
                },
                set height(X) {
                  ve(c, X, !0);
                }
              });
            }, q = (H) => {
              lx(H, {
                get text() {
                  return d;
                },
                get clamped() {
                  return z(f);
                },
                get parentHeight() {
                  return z(u);
                },
                get height() {
                  return z(c);
                },
                set height(X) {
                  ve(c, X, !0);
                }
              });
            };
            Yn(B, (H) => {
              d && d.startsWith("http") ? H(P) : H(q, !1);
            });
          }
          St(L, j);
        }, N = (L) => {
          var j = ys(), B = yo(j);
          {
            var P = (H) => {
              var X = ys(), V = yo(X);
              {
                var G = (Y) => {
                  {
                    let I = /* @__PURE__ */ Ce(() => BigInt(d ?? ""));
                    mF(Y, {
                      get bigint() {
                        return z(I);
                      },
                      get height() {
                        return z(c);
                      },
                      set height(K) {
                        ve(c, K, !0);
                      }
                    });
                  }
                }, Z = (Y) => {
                  fF(Y, {
                    get number() {
                      return d;
                    },
                    get height() {
                      return z(c);
                    },
                    set height(I) {
                      ve(c, I, !0);
                    }
                  });
                };
                Yn(V, (Y) => {
                  g === "BIGINT" ? Y(G) : Y(Z, !1);
                });
              }
              St(H, X);
            }, q = (H) => {
              lx(H, {
                get text() {
                  return d;
                },
                get clamped() {
                  return z(f);
                },
                get parentHeight() {
                  return z(u);
                },
                get height() {
                  return z(c);
                },
                set height(X) {
                  ve(c, X, !0);
                }
              });
            };
            Yn(
              B,
              (H) => {
                p === "number" ? H(P) : H(q, !1);
              },
              !0
            );
          }
          St(L, j);
        };
        Yn(
          R,
          (L) => {
            p === "string" ? L(A) : L(N, !1);
          },
          !0
        );
      }
      St(E, C);
    };
    Yn(w, (E) => {
      l[e.col] ? E(x) : E(k, !1);
    });
  }
  var S = bo(w, 2);
  {
    var _ = (E) => {
      var C = kF();
      C.__click = [wF, n, e, c, u], Dr(() => Ra(C, 1, `expand-button ${e.hovered ? "show" : "hide"}`, "svelte-ix87lc")), St(E, C);
    };
    Yn(S, (E) => {
      z(f) && E(_);
    });
  }
  jt(m), Dr((E) => y = Ln(m, "", y, E), [
    () => ({
      "--lineHeight": a.lineHeight + "px",
      "--num-lines": a.textMaxLines
    })
  ]), Ho(m, "clientHeight", (E) => ve(u, E)), St(t, m), Fr();
}
Xi(["click"]);
var CF = /* @__PURE__ */ Wt('<div class="row-number svelte-er2yqb"> </div>');
const RF = {
  hash: "svelte-er2yqb",
  code: ".row-number.svelte-er2yqb {flex-grow:1;text-align:right;color:var(--secondary-text-color);text-overflow:ellipsis;white-space:nowrap;overflow:hidden;}"
};
function AF(t, e) {
  $r(e, !0), Mr(t, RF);
  const r = tr.model.getContent({ row: e.row, col: e.col }), n = /* @__PURE__ */ Ce(() => new Intl.NumberFormat().format(r ?? 0));
  var i = CF(), a = Xt(i, !0);
  jt(i), Dr(() => mi(a, z(n))), St(t, i), Fr();
}
var EF = (t, e) => {
  t.key === "Enter" && e();
}, TF = /* @__PURE__ */ Wt('<div class="cell svelte-1e1vbvn"><!></div>');
const $F = {
  hash: "svelte-1e1vbvn",
  code: ".cell.svelte-1e1vbvn {--x: 0px;--y: 0px;--width: 0px;--height: 0px;display:flex;box-sizing:border-box;padding-top:calc(var(--padding-y) / 2);padding-bottom:calc(var(--padding-y) / 2);padding-right:calc(calc(var(--padding-x) / 2) + var(--extra-right-padding));padding-left:calc(calc(var(--padding-x) / 2) + var(--extra-left-padding));position:absolute;left:0;top:0;width:var(--width);height:var(--height);transform:translate(var(--x), var(--y));contain:layout paint;color:var(--primary-text-color);font-family:var(--cell-font-family);font-size:var(--cell-font-size);}"
};
function FF(t, e) {
  $r(e, !0), Mr(t, $F);
  const r = tr.model, n = tr.controller, i = tr.overscrollModifier, a = nr.config;
  let l = /* @__PURE__ */ Ce(() => r.getPosition({ row: e.row, col: e.col })), u = /* @__PURE__ */ Ce(() => z(l).x), c = /* @__PURE__ */ Ce(() => z(l).y), f = /* @__PURE__ */ Ce(() => i.y(z(c))), d = /* @__PURE__ */ Ce(() => r.getDimensions({ row: e.row, col: e.col })), p = /* @__PURE__ */ Ce(() => z(d).width), g = /* @__PURE__ */ Ce(() => z(d).height), m = /* @__PURE__ */ Ce(() => r.isFirstCol(e.col)), y = /* @__PURE__ */ Ce(() => r.isLastCol(e.col)), w = /* @__PURE__ */ Ce(() => r.getRowParity(e.row) === "even" ? "var(--primary-bg)" : "var(--secondary-bg)"), x = () => {
    a.onRowClick && a.onRowClick(e.row);
  }, k = /* @__PURE__ */ qe(!1);
  var S = TF();
  S.__click = x, S.__keydown = [EF, x];
  let _;
  var E = Xt(S);
  {
    var C = (A) => {
      MF(A, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        },
        get hovered() {
          return z(k);
        }
      });
    }, R = (A) => {
      AF(A, {
        get row() {
          return e.row;
        },
        get col() {
          return e.col;
        }
      });
    };
    Yn(E, (A) => {
      e.col !== An ? A(C) : A(R, !1);
    });
  }
  jt(S), Dr((A) => _ = Ln(S, "", _, A), [
    () => ({
      "--x": z(u) + "px",
      "--y": z(f) + "px",
      "--width": z(p) + "px",
      "--height": z(g) + "px",
      "--padding-x": a.betweenColPadding + "px",
      "--padding-y": a.betweenRowPadding + "px",
      "--extra-right-padding": (z(y) ? a.verticalScrollbarWidth : 0) + "px",
      "--extra-left-padding": (z(m) ? a.firstColLeftPadding : 0) + "px",
      "--background-color": z(w)
    })
  ]), sc("pointerenter", S, () => {
    ve(k, !0), n.hoveredRowId = e.row;
  }), sc("pointerleave", S, () => {
    ve(k, !1), n.hoveredRowId = null;
  }), St(t, S), Fr();
}
Xi(["click", "keydown"]);
var NF = /* @__PURE__ */ Wt('<div class="header-title svelte-1wng68q"> </div>');
const zF = {
  hash: "svelte-1wng68q",
  code: ".header-title.svelte-1wng68q {flex-shrink:1;margin-right:2px;}"
};
function OF(t, e) {
  $r(e, !0), Mr(t, zF);
  const r = nr.config;
  var n = NF(), i = Xt(n, !0);
  jt(n), Dr(() => mi(i, r.columnConfigs[e.col]?.title ?? e.col)), St(t, n), Fr();
}
yT();
var BF = /* @__PURE__ */ Wt('<div class="row-number-header svelte-1cjtpqh">#</div>');
const DF = {
  hash: "svelte-1cjtpqh",
  code: ".row-number-header.svelte-1cjtpqh {flex-grow:1;text-align:right;margin-right:4px;box-sizing:border-box;color:var(--secondary-text-color);}"
};
function PF(t) {
  Mr(t, DF);
  var e = BF();
  St(t, e);
}
var LF = (t, e, r, n, i) => {
  const a = z(e) ? z(r) === "ascending" ? "descending" : null : "ascending";
  a ? n.handleSort({ column: i.col, direction: a }) : n.handleSort(null);
}, qF = /* @__PURE__ */ Wt('<button class="sort-buttons svelte-3f09kb"><div> </div></button>');
const IF = {
  hash: "svelte-3f09kb",
  code: ".sort-buttons.svelte-3f09kb {all:unset;flex-shrink:0;width:16px;cursor:pointer;display:flex;justify-content:center;flex-direction:row;margin-left:4px;border-radius:2px;padding-left:4px;padding-right:4px;color:var(--tertiary-text-color);}.sort-buttons.svelte-3f09kb:hover {--placeholder: 0;background-color:var(--hover-bg);}.sort-glyph.svelte-3f09kb {color:var(--tertiary-text-color);}.sort-buttons.svelte-3f09kb:hover .sort-glyph:where(.svelte-3f09kb) {color:var(--tertiary-text-color);}.selected.svelte-3f09kb {color:var(--primary-text-color) !important;}"
};
function jF(t, e) {
  $r(e, !0), Mr(t, IF);
  const r = tr.controller;
  let n = /* @__PURE__ */ Ce(() => r.sort ? r.sort.column === e.col : !1), i = /* @__PURE__ */ Ce(() => r.sort ? r.sort.direction : null), a = /* @__PURE__ */ Ce(() => z(n) ? z(i) === "ascending" ? "↑" : "↓" : "⇅");
  var l = qF();
  l.__click = [LF, n, i, r, e];
  var u = Xt(l), c = Xt(u, !0);
  jt(u), jt(l), Dr(() => {
    Ra(u, 1, `sort-button ${(z(n) ? "selected" : null) ?? ""} sort-glyph`, "svelte-3f09kb"), mi(c, z(a));
  }), St(t, l), Fr();
}
Xi(["click"]);
class UF {
  #e = /* @__PURE__ */ qe(on({}));
  get config() {
    return z(this.#e);
  }
  set config(e) {
    ve(this.#e, e, !0);
  }
}
const a0 = "custom-cells";
class Z0 {
  static initialize() {
    go(a0, new UF());
  }
  static set config(e) {
    const r = Tn(a0);
    r.config = e;
  }
  static get config() {
    return Tn(a0).config;
  }
}
var WF = /* @__PURE__ */ Wt("<div></div>");
const HF = { hash: "svelte-3kpd", code: "" };
function VF(t, e) {
  $r(e, !0), Mr(t, HF), tr.model;
  const r = (a) => typeof a == "function" ? (l, u) => {
    let c = new a(l, u);
    return {
      ...c.update ? { update: c.update.bind(c) } : {},
      ...c.destroy ? { destroy: c.destroy.bind(c) } : {}
    };
  } : (l, u) => {
    let c = new a.class(l, u);
    return {
      ...c.update ? { update: c.update.bind(c) } : {},
      ...c.destroy ? { destroy: c.destroy.bind(c) } : {}
    };
  };
  let n = /* @__PURE__ */ Ce(() => r(e.customHeader));
  var i = WF();
  Fg(i, (a, l) => z(n)?.(a, l), () => ({ column: e.col })), St(t, i), Fr();
}
var GF = /* @__PURE__ */ Wt("<!> <!>", 1), XF = /* @__PURE__ */ Wt('<div><div class="header-content svelte-12avjxu"><!> <div class="header-title svelte-12avjxu"><!></div></div></div>');
const YF = {
  hash: "svelte-12avjxu",
  code: ".header-cell.svelte-12avjxu {position:relative;display:flex;flex-direction:row;align-items:end;width:var(--width);min-height:var(--height);flex-shrink:0;box-sizing:border-box;padding:0.25em;padding-right:calc(calc(var(--padding-x) / 2) + var(--extra-padding-right));padding-left:calc(calc(var(--padding-x) / 2) + var(--extra-padding-left));color:var(--secondary-text-color);font-family:var(--header-font-family);font-size:var(--header-font-size);}.header-cell.number.svelte-12avjxu {justify-content:end;}.header-content.svelte-12avjxu {display:flex;flex-direction:column;flex-shrink:0;}.header-title.svelte-12avjxu {height:1.5em;align-items:center;display:flex;flex-direction:row;flex-shrink:0;}"
};
function KF(t, e) {
  $r(e, !0), Mr(t, YF);
  const r = tr.model, n = tr.schema, i = nr.config, a = Z0.config;
  let l = /* @__PURE__ */ qe(null), u = /* @__PURE__ */ qe(0);
  xr(() => {
    i.minColumnWidths[e.col] = z(u) + i.betweenColPadding;
  });
  const c = /* @__PURE__ */ Ce(() => r.colWidths[e.col]), f = /* @__PURE__ */ Ce(() => (n.dataType[e.col] ?? "string") === "number"), d = /* @__PURE__ */ Ce(() => z(f) || e.col === An ? "number" : ""), p = /* @__PURE__ */ Ce(() => r.isFirstCol(e.col)), g = /* @__PURE__ */ Ce(() => r.isLastCol(e.col));
  let m = /* @__PURE__ */ Ce(() => i.headerHeight ? i.headerHeight + "px" : "auto");
  var y = XF();
  let w;
  var x = Xt(y), k = Xt(x);
  {
    var S = (A) => {
      VF(A, {
        get col() {
          return e.col;
        },
        get customHeader() {
          return a[e.col];
        }
      });
    };
    Yn(k, (A) => {
      a[e.col] && A(S);
    });
  }
  var _ = bo(k, 2), E = Xt(_);
  {
    var C = (A) => {
      var N = GF(), L = yo(N);
      OF(L, {
        get col() {
          return e.col;
        }
      });
      var j = bo(L, 2);
      jF(j, {
        get col() {
          return e.col;
        }
      }), St(A, N);
    }, R = (A) => {
      PF(A);
    };
    Yn(E, (A) => {
      e.col !== An ? A(C) : A(R, !1);
    });
  }
  jt(_), jt(x), jt(y), Pn(y, (A) => ve(l, A), () => z(l)), Dr(
    (A) => {
      Ra(y, 1, `header-cell ${z(d) ?? ""}`, "svelte-12avjxu"), w = Ln(y, "", w, A);
    },
    [
      () => ({
        "--width": z(c) + "px",
        "--height": z(m),
        "--padding-x": i.betweenColPadding + "px",
        "--extra-padding-right": (z(g) ? i.verticalScrollbarWidth : 0) + "px",
        "--extra-padding-left": (z(p) ? i.firstColLeftPadding : 0) + "px"
      })
    ]
  ), Ho(x, "clientWidth", (A) => ve(u, A)), St(t, y), Fr();
}
class ZF {
  tableModel;
  tableController;
  col;
  config;
  isDragging = !1;
  startDragX = 0;
  constructor({ tableModel: e, tableController: r, col: n }) {
    this.tableModel = e, this.tableController = r, this.col = n, this.config = nr.config;
  }
  handlePointerDown = (e) => {
    e.preventDefault(), e.target.setPointerCapture(e.pointerId), this.isDragging = !0, this.startDragX = e.offsetX;
  };
  handlePointerMove = (e) => {
    if (this.isDragging && this.startDragX !== null) {
      const r = e.offsetX - this.startDragX, n = this.tableModel.colWidths[this.col], i = Math.max(0, Math.round(n + r));
      this.config.columnConfigs[this.col] || (this.config.columnConfigs[this.col] = {}), this.config.columnConfigs[this.col].width = i, this.config.onColumnConfigsChange(this.col, Ck(this.config.columnConfigs));
    }
  };
  handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId), this.isDragging = !1, this.startDragX = null;
  };
}
var QF = /* @__PURE__ */ Wt('<div class="header-resize-indicator svelte-1v734te"><div class="pill svelte-1v734te"></div></div>');
const JF = {
  hash: "svelte-1v734te",
  code: ".header-resize-indicator.svelte-1v734te {position:absolute;z-index:2;box-sizing:border-box;width:12px;height:calc(100% - 0.25rem);margin:2px;cursor:col-resize;justify-content:center;display:flex;align-items:center;justify-content:center;transform:translateX(calc(var(--x) - 4px - 50%));}.pill.svelte-1v734te {width:2px;height:calc(100% - 4px);margin-top:2px;margin-bottom:2px;background-color:var(--secondary-text-color);opacity:0.2;border-radius:2px;}"
};
function eN(t, e) {
  $r(e, !0), Mr(t, JF);
  const r = tr.model;
  let n = new ZF({
    tableModel: r,
    tableController: tr.controller,
    col: e.col
  });
  const i = /* @__PURE__ */ Ce(() => r.colPositions[e.col] + r.colWidths[e.col]);
  var a = QF();
  a.__pointerdown = function(...u) {
    n.handlePointerDown?.apply(this, u);
  }, a.__pointermove = function(...u) {
    n.handlePointerMove?.apply(this, u);
  }, a.__pointerup = function(...u) {
    n.handlePointerUp?.apply(this, u);
  };
  let l;
  Dr((u) => l = Ln(a, "", l, u), [() => ({ "--x": z(i) + "px" })]), St(t, a), Fr();
}
Xi(["pointerdown", "pointermove", "pointerup"]);
var tN = (t) => {
  t.stopPropagation();
}, rN = /* @__PURE__ */ Wt('<div class="table-portal svelte-1qnjihj" tabindex="-1"><!></div>');
const nN = {
  hash: "svelte-1qnjihj",
  code: ".table-portal.svelte-1qnjihj {position:absolute;}"
};
function oN(t, e) {
  $r(e, !0), Mr(t, nN);
  const r = tr.controller, n = tr.tablePortalController;
  let i = /* @__PURE__ */ qe(null);
  const a = (d) => {
    xr(() => (n.mount(d, e.relativeTo, e.anchor, e.horizontalAlign, e.verticalAlign), d.focus(), () => {
      n.destroy(d);
    }));
  };
  let l = 0;
  Ks(() => {
    l = r.xScroll, requestAnimationFrame(u);
  });
  function u() {
    z(i) && e.stickyX && (z(i).style.transform = `translateX(${r.xScroll - l}px)`), requestAnimationFrame(u);
  }
  var c = rN();
  c.__click = [tN];
  var f = Xt(c);
  $g(f, () => e.children), jt(c), Pn(c, (d) => ve(i, d), () => z(i)), Fg(c, (d) => a?.(d)), sc(
    "wheel",
    c,
    // dont let clicks bubble up
    (d) => {
      d.stopPropagation();
    }
  ), St(t, c), Fr();
}
Xi(["click"]);
var iN = (t, e) => {
  ve(e, !0);
}, aN = /* @__PURE__ */ Wt("<button> </button> <!>", 1);
const lN = {
  hash: "svelte-8ns8fr",
  code: '.dropdown.svelte-8ns8fr {all:unset;padding-left:8px;padding-right:8px;border-radius:2px;cursor:pointer;color:var(--secondary-text-color);position:relative;user-select:none;}.dropdown.svelte-8ns8fr::before {content:"";position:absolute;top:0;left:0;height:100%;width:100%;background-color:var(--primary-bg);z-index:-1;}.dropdown.svelte-8ns8fr:hover {background-color:var(--hover-bg);}.unclickable.svelte-8ns8fr {pointer-events:none;}'
};
function sN(t, e) {
  Mr(t, lN);
  let r = /* @__PURE__ */ qe(!1), n = /* @__PURE__ */ qe(null), i = /* @__PURE__ */ qe(null);
  var a = aN();
  sc("click", U0, (d) => {
    z(r) && d.target !== z(n) && ve(r, !1);
  });
  var l = yo(a);
  l.__click = [iN, r];
  var u = Xt(l, !0);
  jt(l), Pn(l, (d) => ve(n, d), () => z(n));
  var c = bo(l, 2);
  {
    var f = (d) => {
      oN(d, {
        get relativeTo() {
          return e.relativeTo;
        },
        anchor: "outside",
        horizontalAlign: "left",
        verticalAlign: "top",
        stickyX: !1,
        get element() {
          return z(i);
        },
        set element(p) {
          ve(i, p, !0);
        },
        children: (p, g) => {
          var m = ys(), y = yo(m);
          $g(y, () => e.children), St(p, m);
        },
        $$slots: { default: !0 }
      });
    };
    Yn(c, (d) => {
      z(r) && d(f);
    });
  }
  Dr(() => {
    Ra(l, 1, `dropdown ${z(r) ? "unclickable" : "clickable"}`, "svelte-8ns8fr"), mi(u, e.label);
  }), St(t, a);
}
Xi(["click"]);
var uN = (t, e, r) => {
  t.target.checked ? e.showColumn(z(r)) : e.hideColumn(z(r));
}, cN = /* @__PURE__ */ Wt('<li class="column-entry svelte-def7zm"><label class="column-label svelte-def7zm"> <input type="checkbox"/></label></li>'), fN = /* @__PURE__ */ Wt('<ul class="column-toggle svelte-def7zm"></ul>'), dN = /* @__PURE__ */ Wt("<!> <!>", 1), hN = /* @__PURE__ */ Wt('<div class="header-row svelte-def7zm"><div class="scroll-container svelte-def7zm"><div class="dropdown-label-container svelte-def7zm"><div class="dropdown-label svelte-def7zm"><!></div></div> <!></div></div>');
const pN = {
  hash: "svelte-def7zm",
  code: ".header-row.svelte-def7zm {flex-shrink:0;border-bottom:1px solid var(--secondary-bg);background-color:var(--primary-bg);}.scroll-container.svelte-def7zm {display:flex;flex-direction:row;}.dropdown-label-container.svelte-def7zm {position:absolute;z-index:20;left:0px;box-sizing:border-box;height:100%;padding:0.25em;display:flex;flex-direction:row;align-items:end;}.dropdown-label.svelte-def7zm {height:1.5em;align-items:center;display:flex;}.column-toggle.svelte-def7zm {margin:0;margin-top:4px;margin-left:8px;padding:12px;background-color:var(--primary-bg);border-radius:4px;box-shadow:var(--shadow);border:var(--outline);max-height:var(--max-height);max-width:var(--max-width);overflow:scroll;}.column-entry.svelte-def7zm {list-style-type:none;padding:4px;user-select:none;}.column-label.svelte-def7zm {display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--secondary-text-color);}"
};
function vN(t, e) {
  $r(e, !0), Mr(t, pN);
  const r = tr.model, n = tr.controller, i = nr.config;
  let a = /* @__PURE__ */ qe(null), l = /* @__PURE__ */ qe(null), u = /* @__PURE__ */ qe(null), c = /* @__PURE__ */ Ce(() => r.renderableCols), f = 0;
  Ks(() => (f = requestAnimationFrame(d), () => {
    cancelAnimationFrame(f);
  }));
  function d() {
    z(l) && (z(l).style.transform = `translate3d(${n.xScroll}px, 0, 0)`), z(u) && (z(u).style.transform = `translate3d(${-n.xScroll}px, 0, 0)`), f = requestAnimationFrame(d);
  }
  var p = hN(), g = Xt(p), m = Xt(g), y = Xt(m), w = Xt(y);
  sN(w, {
    label: "⋮",
    get relativeTo() {
      return z(a);
    },
    children: (k, S) => {
      var _ = fN();
      let E;
      qu(_, 21, () => r.columns, u$, (C, R) => {
        var A = cN(), N = Xt(A), L = Xt(N), j = bo(L);
        m$(j), j.__change = [uN, n, R], Ln(j, "", {}, { float: "right" }), jt(N), jt(A), Dr(() => {
          mi(L, `${(z(R) === An ? "row #" : i.columnConfigs[z(R)]?.title ?? z(R)) ?? ""} `), md(j, "id", `${z(R) ?? ""}-checkbox`), y$(j, z(R) === An ? i.showRowNumber !== !1 : !i.columnConfigs[z(R)]?.hidden);
        }), St(C, A);
      }), jt(_), Dr((C) => E = Ln(_, "", E, C), [
        () => ({
          "--max-height": n.viewHeight - 48 + "px",
          "--max-width": n.viewWidth - 48 + "px"
        })
      ]), St(k, _);
    }
  }), jt(y), Pn(y, (k) => ve(u, k), () => z(u)), jt(m);
  var x = bo(m, 2);
  qu(x, 16, () => z(c), (k) => k, (k, S) => {
    var _ = dN(), E = yo(_);
    KF(E, {
      get col() {
        return S;
      }
    });
    var C = bo(E, 2);
    eN(C, {
      get col() {
        return S;
      }
    }), St(k, _);
  }), jt(g), Pn(g, (k) => ve(l, k), () => z(l)), jt(p), Pn(p, (k) => ve(a, k), () => z(a)), St(t, p), Fr();
}
Xi(["change"]);
function gN(t, e) {
  return { ...t, ...t[e] != null ? t[e] : {} };
}
class mN {
  #e = /* @__PURE__ */ qe(null);
  get colorScheme() {
    return z(this.#e);
  }
  set colorScheme(e) {
    ve(this.#e, e, !0);
  }
  #t = /* @__PURE__ */ qe(on({}));
  get theme() {
    return z(this.#t);
  }
  set theme(e) {
    ve(this.#t, e, !0);
  }
}
const sx = Symbol("style");
class Q0 {
  static initialize() {
    go(sx, new mN());
  }
  static get style() {
    return Tn(sx);
  }
}
var yN = /* @__PURE__ */ Wt("<div><!></div>");
const bN = {
  hash: "svelte-vahitw",
  code: ".table-defaults.light.svelte-vahitw {--default-primary-text-color: black;--default-secondary-text-color: gray;--default-tertiary-text-color: lightgray;--default-font-family: sans-serif;--default-font-size: 1rem;--default-primary-bg: white;--default-secondary-bg: rgb(246, 246, 247);--default-tertiary-bg: rgb(234, 234, 235);--default-hover-bg: rgba(0, 0, 0, 0.05);--default-scrollbar-bg: rgba(0, 0, 0, 0.05);--default-scrollbar-pill-bg: rgba(0, 0, 0, 0.5);--default-scrollbar-label-bg: rgba(255, 255, 255, 0.9);--default-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);--default-outline-color: rgb(0 0 0 / 0.2);--default-dimmed-row-color: rgb(0 0 0 / 0.2);--default-row-scroll-to-color: rgb(202 225 255);--default-row-hover-color: rgb(220, 235, 255);}.table-defaults.dark.svelte-vahitw {--default-primary-text-color: lightgray;--default-secondary-text-color: gray;--default-tertiary-text-color: dimgray;--default-font-family: sans-serif;--default-font-size: 1rem;--default-primary-bg: #060607;--default-secondary-bg: #161617;--default-hover-bg: rgba(255, 255, 255, 0.05);--default-scrollbar-bg: rgba(255, 255, 255, 0.05);--default-scrollbar-pill-bg: rgba(255, 255, 255, 0.5);--default-scrollbar-label-bg: rgba(0, 0, 0, 0.9);--default-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);--default-outline-color: rgb(255 255 255 / 0.2);--default-dimmed-row-color: rgb(0 0 0 / 0.6);--default-row-scroll-to-color: rgb(1, 24, 106);--default-row-hover-color: rgb(0, 6, 35);}.style-wrapper.svelte-vahitw {width:100%;height:100%;--primary-text-color: var(--user-primary-text-color, var(--default-primary-text-color));--secondary-text-color: var(--user-secondary-text-color, var(--default-secondary-text-color));--tertiary-text-color: var(--user-tertiary-text-color, var(--default-tertiary-text-color));--font-family: var(--user-font-family, var(--default-font-family));--font-size: var(--user-font-size, var(--default-font-size));--primary-bg: var(--user-primary-bg, var(--default-primary-bg));--secondary-bg: var(--user-secondary-bg, var(--default-secondary-bg));--tertiary-bg: var(--user-tertiarty-bg, var(--default-tertiary-bg));--hover-bg: var(--user-hover-bg, var(--default-hover-bg));--header-font-family: var(--user-header-font-family, var(--font-family));--header-font-size: var(--user-header-font-size, var(--font-size));--cell-font-family: var(--user-cell-font-family, var(--font-family));--cell-font-size: var(--user-cell-font-size, var(--font-size));--scrollbar-bg: var(--user-scrollbar-bg, var(--default-scrollbar-bg));--scrollbar-pill-bg: var(--user-scrollbar-pill-bg, var(--default-scrollbar-pill-bg));--scrollbar-label-bg: var(--user-scrollbar-label-bg, var(--default-scrollbar-label-bg));--shadow: var(--user-shadow, var(--default-shadow));--outline-color: var(--user-outline-color, var(--default-outline-color));--outline: 0.5px solid var(--outline-color);--dimmed-row-color: var(--user-dimmed-row-color, var(--default-dimmed-row-color));--row-scroll-to-color: var(--user-row-scroll-to-color, var(--default-row-scroll-to-color));--row-hover-color: var(--user-row-hover-color, var(--default-row-hover-color));}"
};
function xN(t, e) {
  $r(e, !0), Mr(t, bN);
  const r = Q0.style;
  let n = /* @__PURE__ */ Ce(() => r.colorScheme), i = /* @__PURE__ */ Ce(() => r.theme), a = /* @__PURE__ */ qe(null), l = /* @__PURE__ */ Ce(() => z(n) ?? z(a) ?? "light");
  const u = (G) => {
    G.matches ? ve(a, "dark") : ve(a, "light");
  }, c = "(prefers-color-scheme: dark";
  Ks(() => (ve(a, window.matchMedia(c).matches ? "dark" : "light", !0), window.matchMedia(c).addEventListener("change", u), () => {
    window.matchMedia(c).removeEventListener("change", u);
  }));
  let f = /* @__PURE__ */ Ce(() => gN(z(i), z(l))), d = /* @__PURE__ */ Ce(() => z(f).primaryTextColor), p = /* @__PURE__ */ Ce(() => z(f).secondaryTextColor), g = /* @__PURE__ */ Ce(() => z(f).tertiaryTextColor), m = /* @__PURE__ */ Ce(() => z(f).fontFamily), y = /* @__PURE__ */ Ce(() => z(f).fontSize), w = /* @__PURE__ */ Ce(() => z(f).primaryBackgroundColor), x = /* @__PURE__ */ Ce(() => z(f).secondaryBackgroundColor), k = /* @__PURE__ */ Ce(() => z(f).hoverBackgroundColor), S = /* @__PURE__ */ Ce(() => z(f).headerFontFamily), _ = /* @__PURE__ */ Ce(() => z(f).headerFontSize), E = /* @__PURE__ */ Ce(() => z(f).cellFontFamily), C = /* @__PURE__ */ Ce(() => z(f).cellFontSize), R = /* @__PURE__ */ Ce(() => z(f).scrollbarBackgroundColor), A = /* @__PURE__ */ Ce(() => z(f).scrollbarPillColor), N = /* @__PURE__ */ Ce(() => z(f).scrollbarLabelBackgroundColor), L = /* @__PURE__ */ Ce(() => z(f).shadow), j = /* @__PURE__ */ Ce(() => z(f).outlineColor), B = /* @__PURE__ */ Ce(() => z(f).dimmedRowColor), P = /* @__PURE__ */ Ce(() => z(f).rowScrollToColor), q = /* @__PURE__ */ Ce(() => z(f).rowHoverColor);
  xr(() => {
  });
  var H = yN();
  let X;
  var V = Xt(H);
  $g(V, () => e.children), jt(H), Dr(
    (G) => {
      Ra(H, 1, `style-wrapper table-defaults ${z(l) ?? ""}`, "svelte-vahitw"), X = Ln(H, "", X, G);
    },
    [
      () => ({
        "--user-primary-text-color": z(d),
        "--user-secondary-text-color": z(p),
        "--user-tertiary-text-color": z(g),
        "--user-font-family": z(m),
        "--user-font-size": z(y),
        "--user-primary-bg": z(w),
        "--user-secondary-bg": z(x),
        "--user-hover-bg": z(k),
        "--user-header-font-family": z(S),
        "--user-header-font-size": z(_),
        "--user-cell-font-family": z(E),
        "--user-cell-font-size": z(C),
        "--user-scrollbar-bg": z(R),
        "--user-scrollbar-pill-bg": z(A),
        "--user-scrollbar-label-bg": z(N),
        "--user-shadow": z(L),
        "--user-outline-color": z(j),
        "--user-dimmed-row-color": z(B),
        "--user-row-scroll-to-color": z(P),
        "--user-row-hover-color": z(q)
      })
    ]
  ), St(t, H), Fr();
}
function wN() {
  return An;
}
function kN(t, e) {
  const r = new Set(t), n = new Set(e);
  return {
    left: t.filter((i) => !n.has(i)),
    right: e.filter((i) => !r.has(i))
  };
}
function _N(t, e) {
  const r = new Set(e);
  return t.filter((n) => !r.has(n));
}
function SN(t, e) {
  return t.concat(e);
}
var MN = /* @__PURE__ */ Wt("<div></div>"), CN = /* @__PURE__ */ Wt("<div></div> <!>", 1);
const RN = {
  hash: "svelte-h8fig9",
  code: ".row-background.svelte-h8fig9 {position:absolute;width:var(--width);height:var(--height);box-sizing:border-box;z-index:-1;transform:translate3d(0, var(--y), 0);transition:background-color 100ms linear;}.odd.svelte-h8fig9 {background-color:var(--secondary-bg);}.even.svelte-h8fig9 {background-color:var(--primary-bg);}.dimmer.svelte-h8fig9 {background-color:var(--dimmed-row-color);z-index:10;pointer-events:none;}.flashed.svelte-h8fig9 {background-color:var(--row-scroll-to-color);}.hovered.svelte-h8fig9 {background-color:var(--row-hover-color);}"
};
function AN(t, e) {
  $r(e, !0), Mr(t, RN);
  const r = tr.controller, n = tr.model, i = tr.overscrollModifier, a = nr.config;
  let l = /* @__PURE__ */ Ce(() => n.rowHeights[e.row]), u = /* @__PURE__ */ Ce(() => Math.max(n.colsRightmostPosition, r.viewWidth)), c = /* @__PURE__ */ Ce(() => i.y(n.rowPositions[e.row])), f = /* @__PURE__ */ Ce(() => n.getRowParity(e.row)), d = /* @__PURE__ */ Ce(() => r.flashedRowId === e.row), p = /* @__PURE__ */ Ce(() => r.hoveredRowId === e.row), g = /* @__PURE__ */ Ce(() => a.highlightedRows ? a.highlightedRows?.has(e.row) : null);
  var m = CN(), y = yo(m);
  let w;
  var x = bo(y, 2);
  {
    var k = (S) => {
      var _ = MN();
      let E;
      Dr(
        (C) => {
          Ra(_, 1, `row-background ${z(f) ?? ""} dimmer`, "svelte-h8fig9"), E = Ln(_, "", E, C);
        },
        [
          () => ({
            "--width": z(u) + "px",
            "--height": z(l) + "px",
            "--y": z(c) + "px"
          })
        ]
      ), St(S, _);
    };
    Yn(x, (S) => {
      z(g) !== null && !z(g) && S(k);
    });
  }
  Dr(
    (S) => {
      Ra(y, 1, `row-background ${z(f) ?? ""} ${(z(d) ? "flashed" : null) ?? ""} ${(z(p) && a.highlightHoveredRow ? "hovered" : null) ?? ""}`, "svelte-h8fig9"), w = Ln(y, "", w, S);
    },
    [
      () => ({
        "--width": z(u) + "px",
        "--height": z(l) + "px",
        "--y": z(c) + "px"
      })
    ]
  ), St(t, m), Fr();
}
var EN = /* @__PURE__ */ Wt("<!> <!>", 1), TN = /* @__PURE__ */ Wt('<div class="scroll-container svelte-1q3xqdh"><!></div> <!> <!>', 1), $N = /* @__PURE__ */ Wt('<div class="table svelte-1q3xqdh"><!> <div class="table-contents svelte-1q3xqdh"><!></div></div>');
const FN = {
  hash: "svelte-1q3xqdh",
  code: ".table.svelte-1q3xqdh {width:100%;max-width:var(--max-width);height:100%;display:flex;flex-direction:column;position:relative;}.table-contents.svelte-1q3xqdh {position:relative;overflow:hidden;flex-grow:1;}.scroll-container.svelte-1q3xqdh {position:absolute;width:0;height:0;will-change:transform;contain:layout size;}"
};
function NN(t, e) {
  $r(e, !0), Mr(t, FN), nr.initialize(), Wf.initialize(), Q0.initialize(), tr.initialize();
  const r = tr.controller, n = tr.model, i = tr.overscrollModifier, a = nr.config, l = Q0.style;
  xr(() => {
    e.scrollTo != null && r.scrollToRow(String(e.scrollTo));
  }), xr(() => {
    e.highlightedRows && e.highlightedRows.length > 0 ? a.highlightedRows = new Set(e.highlightedRows.map((S) => String(S))) : a.highlightedRows = null;
  }), xr(() => {
    e.onRowClick != null ? a.onRowClick = e.onRowClick : a.onRowClick = null;
  }), xr(() => {
    e.coordinator ? K0.coordinator = e.coordinator : K0.coordinator = null;
  }), xr(() => {
    e.numLines != null ? a.textMaxLines = e.numLines : a.textMaxLines = a.DEFAULT_TEXT_MAX_LINES, e.lineHeight != null ? a.lineHeight = e.lineHeight : a.lineHeight = a.DEFAULT_LINE_HEIGHT;
  }), xr(() => {
    e.colorScheme != null ? l.colorScheme = e.colorScheme : l.colorScheme = null;
  }), xr(() => {
    e.theme != null ? l.theme = e.theme : l.theme = {}, e.colorScheme != null ? l.colorScheme = e.colorScheme : l.colorScheme = null;
  }), xr(() => {
    e.columnConfigs != null ? a.columnConfigs = e.columnConfigs : a.columnConfigs = {}, e.onColumnConfigsChange != null ? a.onColumnConfigsChange = e.onColumnConfigsChange : a.onColumnConfigsChange = () => {
    };
  }), xr(() => {
    a.showRowNumber = e.showRowNumber ?? null;
  }), xr(() => {
    a.onShowRowNumberChange = e.onShowRowNumberChange ?? null;
  }), xr(() => {
    r.initialize({
      tableName: e.table,
      rowKey: e.rowKey,
      columns: [wN(), ...e.columns],
      filterBy: e.filter ?? null
    });
  }), xr(() => {
    e.customCells != null ? Wf.config = e.customCells : Wf.config = {};
  }), xr(() => {
    e.additionalHeaderContents != null ? Z0.config = e.additionalHeaderContents : Z0.config = {};
  }), xr(() => {
    e.headerHeight != null ? a.headerHeight = e.headerHeight : a.headerHeight = null;
  }), xr(() => {
    e.highlightHoveredRow != null ? a.highlightHoveredRow = e.highlightHoveredRow : a.highlightHoveredRow = !1;
  });
  let u = /* @__PURE__ */ qe([]), c = /* @__PURE__ */ qe(0), f = /* @__PURE__ */ qe(null), d = /* @__PURE__ */ qe(on([])), p = /* @__PURE__ */ qe(on([])), g = /* @__PURE__ */ Ce(() => z(d).filter((S) => r.rowStillExists(S))), m = /* @__PURE__ */ Ce(() => z(p)), y = 0;
  Ks(() => (y = requestAnimationFrame(k), () => {
    r.teardown(), n.teardown(), cancelAnimationFrame(y);
  }));
  function w(S, _) {
    if (_.length > 0) {
      const E = _[_.length - 1];
      return Math.abs(n.data[S][En] - n.data[E][En]);
    }
    return 0;
  }
  function x() {
    const { left: S, right: _ } = kN(z(u), n.renderableRows);
    S.length === 0 && _.length === 0 || (ve(u, _N(z(
      u
      // remove the rows that have been deleted from the model
    ), S)), ve(u, SN(z(
      u
      // add the rows that have been added by the model
    ), _.sort((E, C) => w(E, z(u)) - w(C, z(u))).slice(0, r.isJumping ? r.rowsOnScreen : a.rowRenderBatchSize))));
  }
  function k() {
    x(), ve(d, z(u).filter((E) => r.rowIsVisible(E)), !0), ve(p, n.renderableCols.filter((E) => r.colIsVisible(E)), !0);
    const S = r.xScroll, _ = i.yScroll(r.yScroll);
    z(f) && (z(f).style.transform = `translate3d(${S}px, ${_}px, 0)`), ve(c, r.updateKey, !0), y = requestAnimationFrame(k);
  }
  xN(t, {
    children: (S, _) => {
      var E = $N(), C = Xt(E);
      vN(C, {});
      var R = bo(C, 2), A = Xt(R);
      {
        var N = (L) => {
          var j = TN(), B = yo(j), P = Xt(B);
          s$(P, () => z(c), (X) => {
            var V = EN(), G = yo(V);
            qu(G, 16, () => z(g), (Y) => Y, (Y, I) => {
              var K = ys(), ie = yo(K);
              qu(ie, 16, () => z(m), (se) => se, (se, ye) => {
                FF(se, {
                  get row() {
                    return I;
                  },
                  get col() {
                    return ye;
                  }
                });
              }), St(Y, K);
            });
            var Z = bo(G, 2);
            qu(Z, 16, () => n.renderableRows, (Y) => Y, (Y, I) => {
              AN(Y, {
                get row() {
                  return I;
                }
              });
            }), St(X, V);
          }), jt(B), Pn(B, (X) => ve(f, X), () => z(f));
          var q = bo(B, 2);
          oF(q, {});
          var H = bo(q, 2);
          tF(H, {}), St(L, j);
        };
        Yn(A, (L) => {
          r.isReady && L(N);
        });
      }
      jt(R), jt(E), Pn(E, (L) => r.element = L, () => r?.element), sc("wheel", E, function(...L) {
        r.handleWheel?.apply(this, L);
      }), Ho(R, "clientHeight", (L) => r.viewHeight = L), Ho(R, "clientWidth", (L) => r.viewWidth = L), St(S, E);
    },
    $$slots: { default: !0 }
  }), Fr();
}
class zN {
  component;
  currentProps;
  constructor(e, r) {
    this.currentProps = { ...r }, this.component = o$({ component: NN, target: e, props: r });
  }
  update(e) {
    let r = {};
    for (let n in e)
      e[n] !== this.currentProps[n] && (r[n] = e[n], this.currentProps[n] = e[n]);
    this.component.$set(r);
  }
  destroy() {
    this.component.$destroy();
  }
}
var ON = /* @__PURE__ */ Se("<div></div>");
function BN(t, e) {
  gt(e, !0);
  let r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]), n;
  bc(() => {
    let a = new zN(n, r);
    yn(() => {
      a.update(r);
    }), Hw(() => {
      a.destroy();
    });
  });
  var i = ON();
  tt(i, "", {}, { width: "100%", height: "100%" }), Wo(i, (a) => n = a, () => n), te(t, i), mt();
}
var DN = /* @__PURE__ */ Se("<div></div>");
function PN(t, e) {
  gt(e, !0);
  let r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]), n;
  bc(() => {
    let a = new XE(n, r);
    yn(() => {
      a.update(r);
    }), Hw(() => {
      a.destroy();
    });
  });
  var i = DN();
  tt(i, "", {}, { display: "flex" }), Wo(i, (a) => n = a, () => n), te(t, i), mt();
}
var LN = (t, e, r) => {
  e(h(r), t);
}, qN = /* @__PURE__ */ Se('<tr><td class="first:rounded-tl-md first:rounded-bl-md"><div class="block w-4 h-4 mx-2 rounded-full"></div></td><td><div class="whitespace-nowrap nowrap max-w-72 text-ellipsis overflow-hidden"> </div></td><td class="text-slate-400 px-2 text-xs text-right last:rounded-tr-md last:rounded-br-md" title="Count"> </td></tr>'), IN = /* @__PURE__ */ Se('<div class="absolute right-0 top-0 p-2 m-2 rounded-md bg-opacity-90 bg-slate-100 dark:bg-slate-800"><table><tbody></tbody></table></div>');
function jN(t, e) {
  gt(e, !0);
  let r = Je(e, "selection", 3, null), n = /* @__PURE__ */ ge(/* @__PURE__ */ new Set());
  const i = {
    reset: () => {
      W(n, /* @__PURE__ */ new Set());
    }
  };
  function a(f, d) {
    if (d.shiftKey || d.metaKey) {
      let p = new Set(h(n));
      p.has(f) ? p.delete(f) : p.add(f), W(n, p);
    } else
      h(n).has(f) && h(n).size == 1 ? W(n, /* @__PURE__ */ new Set()) : W(n, /* @__PURE__ */ new Set([f]));
  }
  Qe(() => {
    let f = r();
    if (f != null)
      return Qe(() => {
        let d = h(n), p = d.size != 0 ? Array.from(d).map((m) => m.predicate.toString()).join(" OR ") : null, g = {
          source: i,
          clients: (/* @__PURE__ */ new Set()).add(i),
          value: d.size == 0 ? null : d,
          predicate: p
        };
        f.activate(g), f.update(g);
      }), () => {
        f.update({
          source: i,
          clients: (/* @__PURE__ */ new Set()).add(i),
          value: null,
          predicate: null
        });
      };
  }), Qe(() => {
    let f = e.stateStore;
    if (!f)
      return;
    let d = f.subscribe((p) => {
      p != null && W(n, new Set(e.items.filter((g) => p.selectedItems.indexOf(g.label) >= 0)));
    });
    return Qe(() => {
      f.set({
        selectedItems: Array.from(h(n)).map((p) => p.label)
      });
    }), d;
  });
  var l = IN(), u = ne(l), c = ne(u);
  Gt(c, 21, () => e.items, or, (f, d) => {
    var p = qN();
    const g = /* @__PURE__ */ oe(() => h(n).has(h(d)) || h(n).size == 0);
    let m;
    p.__click = [LN, a, d];
    var y = ne(p), w = ne(y);
    let x;
    ee(y);
    var k = le(y), S = ne(k), _ = ne(S, !0);
    ee(S), ee(k);
    var E = le(k), C = ne(E, !0);
    ee(E), ee(p), Ee(
      (R, A, N) => {
        m = _r(p, 1, "hover:bg-slate-200 dark:hover:bg-slate-700 select-none leading-7", null, m, R), x = tt(w, "", x, A), J(S, "title", h(d).label), rt(_, h(d).label), rt(C, N);
      },
      [
        () => ({ "opacity-20": !h(g) }),
        () => ({ "background-color": h(d).color }),
        () => h(d).count.toLocaleString()
      ]
    ), te(f, p);
  }), ee(c), ee(u), ee(l), te(t, l), mt();
}
Tr(["click"]);
const ux = Symbol("coordinator"), cx = Symbol("darkMode");
class yr {
  static get coordinator() {
    return C1(ux) ?? Ed();
  }
  static set coordinator(e) {
    R1(ux, e);
  }
  static get darkMode() {
    return C1(cx);
  }
  static set darkMode(e) {
    R1(cx, e);
  }
}
function Cf(t, e, r) {
  return t + (e - t) * r;
}
function UN(t, e, r) {
  let n = Math.log(t.scale), i = Math.log(e.scale);
  if (Math.abs(i - n) < 1e-5)
    return {
      x: Cf(t.x, e.x, r),
      y: Cf(t.y, e.y, r),
      scale: Cf(t.scale, e.scale, r)
    };
  let a = Math.exp(Cf(n, i, r));
  return {
    x: (e.x * e.scale - t.x * t.scale + (t.x - e.x) * (t.scale * e.scale / a)) / (e.scale - t.scale),
    y: (e.y * e.scale - t.y * t.scale + (t.y - e.y) * (t.scale * e.scale / a)) / (e.scale - t.scale),
    scale: a
  };
}
var WN = /* @__PURE__ */ Se('<div class="absolute left-0 right-0 top-0 bottom-0"><!> <!></div>');
function HN(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(c, "$darkMode", r), a = 800;
  let l = Je(e, "onClickPoint", 3, null);
  const u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ ge(null), d = /* @__PURE__ */ ge(null), p = /* @__PURE__ */ ge(null), g = /* @__PURE__ */ ge([]), m = /* @__PURE__ */ ge(750), y = /* @__PURE__ */ ge(750), w = /* @__PURE__ */ oe(() => e.stateStore?.child("legend")), x;
  function k(j) {
    W(p, null);
    let B = h(f);
    if (B == null) {
      W(f, j);
      return;
    }
    let P = a, q = (/* @__PURE__ */ new Date()).getTime(), H = () => {
      let X = ((/* @__PURE__ */ new Date()).getTime() - q) / P;
      X > 1 ? X = 1 : x = requestAnimationFrame(H), W(f, UN(B, j, qv(X)));
    };
    x && cancelAnimationFrame(x), x = requestAnimationFrame(H);
  }
  function S(j) {
    W(g, [j]), W(p, j);
  }
  function _() {
    x && cancelAnimationFrame(x);
  }
  function E(j) {
    l()?.(j);
  }
  yn(() => {
    h(g)?.[0] != null && E(h(g)?.[0]);
  }), Qe(() => {
    let j = e.stateStore;
    if (!j)
      return;
    let B = j.subscribe((P) => {
      P != null && (W(f, P.viewportState), W(d, P.rangeSelection));
    });
    return yn(() => {
      j.set({
        viewportState: h(f),
        rangeSelection: h(d)
      });
    }), B;
  });
  var C = WN(), R = ne(C);
  {
    let j = /* @__PURE__ */ oe(() => i() ? "dark" : "light"), B = /* @__PURE__ */ oe(() => e.categoryLegend?.indexColumn), P = /* @__PURE__ */ oe(() => e.categoryLegend?.legend.map((H) => H.color)), q = /* @__PURE__ */ oe(() => 1 / 16 * Math.exp(-(e.minimumDensityExpFactor ?? 0)));
    PN(R, {
      get coordinator() {
        return u;
      },
      get table() {
        return e.table;
      },
      get identifier() {
        return e.id;
      },
      get x() {
        return e.x;
      },
      get y() {
        return e.y;
      },
      get colorScheme() {
        return h(j);
      },
      get text() {
        return e.text;
      },
      get category() {
        return h(B);
      },
      get categoryColors() {
        return h(P);
      },
      get minimumDensity() {
        return h(q);
      },
      get additionalFields() {
        return e.additionalFields;
      },
      get viewportState() {
        return h(f);
      },
      onViewportState: (H) => {
        W(f, H), _();
      },
      get tooltip() {
        return h(p);
      },
      onTooltip: (H) => W(p, H),
      get selection() {
        return h(g);
      },
      onSelection: (H) => {
        W(g, H);
      },
      get filter() {
        return e.filter;
      },
      get rangeSelection() {
        return e.filter;
      },
      get rangeSelectionValue() {
        return h(d);
      },
      onRangeSelection: (H) => {
        W(d, H);
      },
      get automaticLabels() {
        return e.automaticLabels;
      },
      get width() {
        return h(m);
      },
      get height() {
        return h(y);
      },
      get mode() {
        return e.mode;
      },
      get customTooltip() {
        return e.customTooltip;
      },
      get customOverlay() {
        return e.customOverlay;
      }
    });
  }
  var A = le(R, 2);
  {
    var N = (j) => {
      var B = fr(), P = We(B);
      Ld(P, () => e.categoryLegend, (q) => {
        jN(q, {
          get items() {
            return e.categoryLegend.legend;
          },
          get selection() {
            return e.filter;
          },
          get stateStore() {
            return h(w);
          }
        });
      }), te(j, B);
    };
    Te(A, (j) => {
      e.categoryLegend != null && j(N);
    });
  }
  ee(C), bl(C, "clientWidth", (j) => W(m, j)), bl(C, "clientHeight", (j) => W(y, j)), te(t, C);
  var L = mt({ startViewportAnimation: k, showTooltip: S });
  return n(), L;
}
function VN(t, { from: e, to: r }, n = {}) {
  var { delay: i = 0, duration: a = (R) => Math.sqrt(R) * 120, easing: l = qv } = n, u = getComputedStyle(t), c = u.transform === "none" ? "" : u.transform, [f, d] = u.transformOrigin.split(" ").map(parseFloat);
  f /= t.clientWidth, d /= t.clientHeight;
  var p = GN(t), g = t.clientWidth / r.width / p, m = t.clientHeight / r.height / p, y = e.left + e.width * f, w = e.top + e.height * d, x = r.left + r.width * f, k = r.top + r.height * d, S = (y - x) * g, _ = (w - k) * m, E = e.width / r.width, C = e.height / r.height;
  return {
    delay: i,
    duration: typeof a == "function" ? a(Math.sqrt(S * S + _ * _)) : a,
    easing: l,
    css: (R, A) => {
      var N = A * S, L = A * _, j = R + A * E, B = R + A * C;
      return `transform: ${c} translate(${N}px, ${L}px) scale(${j}, ${B});`;
    }
  };
}
function GN(t) {
  if ("currentCSSZoom" in t)
    return (
      /** @type {number} */
      t.currentCSSZoom
    );
  for (var e = t, r = 1; e !== null; )
    r *= +getComputedStyle(e).zoom, e = /** @type {Element | null} */
    e.parentElement;
  return r;
}
var XN = (t, e) => {
  e.onClick?.();
}, YN = /* @__PURE__ */ Se("<span> </span>"), KN = /* @__PURE__ */ Se("<button><!> <!></button>");
function Oo(t, e) {
  gt(e, !0);
  let r = Je(e, "label", 3, null), n = Je(e, "icon", 3, null), i = Je(e, "title", 3, ""), a = Je(e, "order", 3, null), l = Je(e, "style", 3, "default");
  const u = {
    default: "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 dark:text-slate-400 focus-visible:outline-2 outline-blue-600 -outline-offset-1",
    plotCell: "bg-white text-slate-400 border-slate-300 hover:text-slate-500 hover:border-slate-500 dark:text-slate-500 dark:border-slate-500 dark:bg-slate-800 dark:hover:border-slate-300 dark:hover:text-slate-300",
    plotCellClose: "bg-white text-red-500 border-red-500 hover:text-white hover:bg-red-500 dark:bg-slate-800"
  };
  var c = KN();
  c.__click = [XN, e];
  let f;
  var d = ne(c);
  {
    var p = (y) => {
      var w = fr();
      const x = /* @__PURE__ */ oe(n);
      var k = We(w);
      Dv(k, () => h(x), (S, _) => {
        _(S, { class: "w-5 h-5" });
      }), te(y, w);
    };
    Te(d, (y) => {
      n() != null && y(p);
    });
  }
  var g = le(d, 2);
  {
    var m = (y) => {
      var w = YN();
      let x;
      var k = ne(w, !0);
      ee(w), Ee(
        (S) => {
          x = _r(w, 1, "", null, x, S), rt(k, r());
        },
        [() => ({ "ml-1": n() != null })]
      ), te(y, w);
    };
    Te(g, (y) => {
      r() != null && r() != "" && y(m);
    });
  }
  ee(c), Ee(
    (y) => {
      _r(c, 1, `rounded-md px-1.5 py-1.5 h-[28px] flex select-none items-center border ${u[l()] ?? ""} ${e.class ?? "" ?? ""}`), J(c, "title", i()), f = tt(c, "", f, y);
    },
    [() => ({ order: a() })]
  ), te(t, c), mt();
}
Tr(["click"]);
var Rf = {}, fx = Symbol(), ZN = Symbol(), d3 = (t) => typeof t == "string" ? uc[t] : t, uc = {
  plain: Rf,
  plaintext: Rf,
  text: Rf,
  txt: Rf
}, h3 = (t, e) => (e[ZN] || QN)(t, e), QN = (t, e) => {
  for (var r = [t], n, i = [], a = 0; n = d3(e[fx]); )
    delete e[fx], Object.assign(e, n);
  for (m3(t, e, r, 0); i[a++] = r[0], r = r[1]; ) ;
  return i;
}, p3 = (t, e, r) => t.replace(/&/g, "&amp;").replace(e, r), dx = "</span>", Af = "", Mu = "", v3 = (t) => {
  for (var e = "", r = t.length, n = 0; n < r; ) e += g3(t[n++]);
  return e;
}, g3 = (t) => {
  if (t instanceof zu) {
    var { type: e, alias: r, content: n } = t, i = Af, a = Mu, l = `<span class="token ${e + (r ? " " + r : "") + (e == "keyword" && typeof n == "string" ? " keyword-" + n : "")}">`;
    Mu += dx, Af += l;
    var u = g3(n);
    return Af = i, Mu = a, l + u + dx;
  }
  return typeof t != "string" ? v3(t) : (t = p3(t, /</g, "&lt;"), Mu && t.includes(`
`) ? t.replace(/\n/g, Mu + `
` + Af) : t);
}, m3 = (t, e, r, n, i) => {
  for (var a in e)
    if (e[a]) for (var l = 0, u = e[a], c = Array.isArray(u) ? u : [u]; l < c.length; ++l) {
      if (i && i[0] == a && i[1] == l)
        return;
      for (var f = c[l], d = f.pattern || f, p = d3(f.inside), g = f.lookbehind, m = f.greedy && d.global, y = f.alias, w = r, x = n; w && (!i || x < i[2]); x += w[0].length, w = w[1]) {
        var k = w[0], S = 0, _, E;
        if (!(k instanceof zu)) {
          if (d.lastIndex = m ? x : 0, _ = d.exec(m ? t : k), !_ && m)
            break;
          if (_ && _[0]) {
            if (g && _[1] && (E = _[1].length, _.index += E, _[0] = _[0].slice(E)), m) {
              for (var C = _.index, R = C + _[0].length, A; C >= x + (A = w[0].length); w = w[1], x += A) ;
              if (w[0] instanceof zu)
                continue;
              for (var N = w, u = x; (u += N[0].length) < R; N = N[1], S++) ;
              k = t.slice(x, u), _.index -= x;
            }
            for (var C = _.index, L = _[0], j = k.slice(C + L.length), B = x + k.length, P = new zu(a, p ? h3(L, p) : L, L, y), q = w, H = 0, X; q = q[1], H++ < S; ) ;
            j && (!q || q[0] instanceof zu ? q = [j, q] : q[0] = j + q[0]), x += C, w[0] = C ? k.slice(0, C) : P, C ? w = w[1] = [P, q] : w[1] = q, S && (m3(t, e, w, x, X = [a, l, B]), B = X[2]), i && B > i[2] && (i[2] = B);
          }
        }
      }
    }
};
function zu(t, e, r, n) {
  this.type = t, this.content = e, this.alias = n, this.length = r.length;
}
const JN = (t, e, ...r) => {
  let n, i = [], a, l = "", u, c = !1, f = !0, d = [], p, g = 0;
  const m = rz(), y = m.firstChild, w = y.children, x = w[0], k = x.firstChild, S = { language: "text", value: l }, _ = new Set(r), E = {}, C = (X) => {
    Object.assign(S, X);
    let V = l != (l = X.value ?? l), G = n != (n = S.language);
    p = !!S.readOnly, m.style.tabSize = S.tabSize || 2, k.inputMode = p ? "none" : "", k.setAttribute("aria-readonly", p), N(), A(), V && (c || k.remove(), k.value = l, k.selectionEnd = 0, c || x.prepend(k)), (V || G) && R();
  }, R = () => {
    d = h3(l = k.value, uc[n] || {}), P("tokenize", d, n, l);
    let X = v3(d).split(`
`), V = 0, G = g, Z = g = X.length;
    for (; X[V] == i[V] && V < Z; ) ++V;
    for (; Z && X[--Z] == i[--G]; ) ;
    if (V == Z && V == G) w[V + 1].innerHTML = X[V] + `
`;
    else {
      let Y = G < V ? G : V - 1, I = Y, K = "";
      for (; I < Z; ) K += `<div class=pce-line aria-hidden=true>${X[++I]}
</div>`;
      for (I = Z < V ? Z : V - 1; I < G; I++) w[V + 1].remove();
      for (K && w[Y + 1].insertAdjacentHTML("afterend", K), I = Y + 1; I < g; ) w[++I].setAttribute("data-line", I);
      m.style.setProperty(
        "--number-width",
        (0 | Math.log10(g)) + 1 + ".001ch"
      );
    }
    P("update", l), q(!0), f && setTimeout(setTimeout, 0, () => f = !0), i = X, f = !1;
  }, A = (X) => {
    (X || _).forEach((V) => {
      typeof V == "object" ? (V.update(H, S), X && _.add(V)) : (V(H, S), X || _.delete(V));
    });
  }, N = ([X, V] = L()) => {
    m.className = `prism-code-editor language-${n}${S.lineNumbers == !1 ? "" : " show-line-numbers"} pce-${S.wordWrap ? "" : "no"}wrap${S.rtl ? " pce-rtl" : ""} pce-${X < V ? "has" : "no"}-selection${c ? " pce-focus" : ""}${p ? " pce-readonly" : ""}${S.class ? " " + S.class : ""}`;
  }, L = () => [
    k.selectionStart,
    k.selectionEnd,
    k.selectionDirection
  ], j = {
    Escape() {
      k.blur();
    }
  }, B = {}, P = (X, ...V) => {
    E[X]?.forEach((G) => G.apply(H, V)), S["on" + X[0].toUpperCase() + X.slice(1)]?.apply(H, V);
  }, q = (X) => {
    if (X || f) {
      const V = L(), G = w[u = y3(l, 0, V[V[2] < "f" ? 0 : 1])];
      G != a && (a?.classList.remove("active-line"), G.classList.add("active-line"), a = G), N(V), P("selectionChange", V, l);
    }
  }, H = {
    container: m,
    wrapper: y,
    lines: w,
    textarea: k,
    get activeLine() {
      return u;
    },
    get value() {
      return l;
    },
    options: S,
    get focused() {
      return c;
    },
    get tokens() {
      return d;
    },
    inputCommandMap: B,
    keyCommandMap: j,
    extensions: {},
    setOptions: C,
    update: R,
    getSelection: L,
    addExtensions(...X) {
      A(X);
    },
    on: (X, V) => ((E[X] ||= /* @__PURE__ */ new Set()).add(V), () => E[X].delete(V)),
    remove() {
      m.remove();
    }
  };
  return Ei(k, "keydown", (X) => {
    j[X.key]?.(X, L(), l) && vo(X);
  }), Ei(k, "beforeinput", (X) => {
    (p || X.inputType == "insertText" && B[X.data]?.(X, L(), l)) && vo(X);
  }), Ei(k, "input", R), Ei(k, "blur", () => {
    yd = null, c = !1, N();
  }), Ei(k, "focus", () => {
    yd = q, c = !0, N();
  }), Ei(k, "selectionchange", (X) => {
    q(), vo(X);
  }), tz(t)?.append(m), e && C(e), H;
}, Ii = "u" > typeof window ? document : null, l0 = /* @__PURE__ */ Ii?.createElement("div"), ez = (t, e) => (l0 && (l0.innerHTML = t, e = l0.firstChild), () => e.cloneNode(!0)), Ei = (t, e, r, n) => t.addEventListener(e, r, n), tz = (t) => typeof t == "string" ? Ii.querySelector(t) : t, y3 = (t, e = 0, r = 1 / 0) => {
  let n = 1;
  for (; (e = t.indexOf(`
`, e) + 1) && e <= r; n++) ;
  return n;
}, s0 = {}, rz = /* @__PURE__ */ ez(
  "<div><div class=pce-wrapper><div class=pce-overlays><textarea class=pce-textarea spellcheck=false autocapitalize=off autocomplete=off>"
), vo = (t) => {
  t.preventDefault(), t.stopImmediatePropagation();
};
let yd;
Ii && Ei(Ii, "selectionchange", () => yd?.());
const bd = (t, e) => e ? t.lastIndexOf(`
`, e - 1) + 1 : 0, Bg = (t, e) => (e = t.indexOf(`
`, e)) + 1 ? e : t.length, hx = (t, e, r, n) => Ei(t.textarea, e, r, n), nz = (t, e) => parseFloat(getComputedStyle(t)[e]);
new Set("xml,rss,atom,jsx,tsx,xquery,xeora,xeoracube,actionscript".split(","));
let Ef;
const Cu = (t) => t.replace(/[$+?|.^*()[\]{}\\]/g, "\\$&"), px = (t, e) => t.slice(bd(t, e), e), ca = (t, e, r = e) => [
  t.slice(e = bd(t, e), r = Bg(t, r)).split(`
`),
  e,
  r
], oz = (t, e, r = 0, n = r, i = t.getSelection()[0]) => {
  const a = t.value, l = t.lines[y3(a, 0, i)], u = Ii.createTreeWalker(l, 5);
  let c = u.lastChild(), f = Bg(a, i) + 1 - i - c.length;
  for (; -f <= n && (c = u.previousNode()); )
    if (!c.lastChild && (f -= c.length || 0, f <= r)) {
      for (; c != l; c = c.parentNode)
        if (c.matches?.(e)) return c;
    }
}, u0 = (t, e) => oz(t, "[class*=language-]", 0, 0, e)?.className.match(
  /language-(\S*)/
)[1] || t.options.language, Cn = (t, e, r, n, i, a) => {
  if (t.options.readOnly) return;
  Ef = t.getSelection(), n ??= r;
  let l = t.textarea, u = t.value, c = ev && !u[n ?? Ef[1]] && /\n$/.test(e) && /^$|\n$/.test(u), f;
  t.focused || l.focus(), r != null && l.setSelectionRange(r, n), i != null && (f = t.on("update", () => {
    l.setSelectionRange(
      i,
      a ?? i,
      Ef[2]
    ), f();
  })), c0 || l.dispatchEvent(new InputEvent("beforeinput", { data: e })), ev || c0 ? (c && (l.selectionEnd--, e = e.slice(0, -1)), c0 && (e += `
`), Ii.execCommand(e ? "insertHTML" : "delete", !1, p3(e, /</g, "&lt;")), c && l.selectionStart++) : Ii.execCommand(e ? "insertText" : "delete", !1, e), Ef = 0;
}, iz = (t, e, r = e, n) => {
  let i = t.focused, a = t.textarea, l;
  i || (Ei(
    a,
    "focus",
    (u) => {
      l = u.relatedTarget;
    },
    { once: !0 }
  ), a.focus()), a.setSelectionRange(e, r, n), yd(!(!i && (l ? l.focus() : a.blur())));
}, b3 = Ii ? navigator.userAgent : "", J0 = Ii ? /Mac|iPhone|iPod|iPad/i.test(navigator.platform) : !1, ev = /Chrome\//.test(b3), c0 = !ev && /AppleWebKit\//.test(b3), Tf = (t) => t.altKey + t.ctrlKey * 2 + t.metaKey * 4 + t.shiftKey * 8;
let tv = !1;
const $f = J0 ? 4 : 2, az = (t) => tv = t, Ka = (t) => t.search(/\S|$/), lz = (t = ['""', "''", "``", "()", "[]", "{}"], e = /([^$\w'"`]["'`]|.[[({])[.,:;\])}>\s]|.[[({]`/s) => (r, n) => {
  let i;
  const { keyCommandMap: a, inputCommandMap: l, getSelection: u, container: c } = r, f = navigator.clipboard, d = ({ insertSpaces: x = !0, tabSize: k } = n) => [x ? " " : "	", x ? k || 2 : 1], p = () => !n.readOnly && !r.extensions.cursor?.scrollIntoView(), g = ([x, k], [S, _], E, C) => (x < k || !C && e.test((E[k - 1] || " ") + S + (E[k] || " "))) && !Cn(r, S + E.slice(x, k) + _, null, null, x + 1, k + 1), m = ([x, k], S, _) => x == k && _[k] == S && !iz(r, x + 1), y = (x, k, S, _, E, C) => {
    let R = k.join(`
`);
    if (R != x.join(`
`)) {
      const A = x.length - 1, N = k[A], L = x[A], j = L.length - N.length, B = k[0].length - x[0].length, P = S + Ka((B < 0 ? k : x)[0]), q = _ - L.length + Ka(j > 0 ? N : L), H = S - _ + R.length + j, X = P > E ? E : Math.max(P, E + B), V = C + S - _ + R.length;
      Cn(
        r,
        R,
        S,
        _,
        X,
        C < q ? V + j : Math.max(q + H, V)
      );
    }
  }, w = (x, k, S, _, E, C, R, A) => {
    y(
      k,
      k.map(
        x ? (N) => N.slice(Ka(N) ? A - Ka(N) % A : 0) : (N) => N && R.repeat(A - Ka(N) % A) + N
      ),
      S,
      _,
      E,
      C
    );
  };
  l["<"] = (x, k, S) => g(k, "<>", S, !0), t.forEach(([x, k]) => {
    const S = x == k;
    l[x] = (_, E, C) => (S && m(E, k, C) || g(E, x + k, C)) && p(), S || (l[k] = (_, E, C) => m(E, k, C) && p());
  }), l[">"] = (x, k, S) => {
    const _ = s0[u0(r)]?.autoCloseTags?.(k, S, r);
    _ && (Cn(r, ">" + _, null, null, k[0] + 1), vo(x));
  }, a.Tab = (x, [k, S], _) => {
    if (tv || n.readOnly || Tf(x) & 6) return;
    const [E, C] = d(n), R = x.shiftKey, [A, N, L] = ca(_, k, S);
    return k < S || R ? w(R, A, N, L, k, S, E, C) : Cn(r, E.repeat(C - (k - N) % C)), p();
  }, a.Enter = (x, k, S) => {
    const _ = Tf(x) & 7;
    if (!_ || _ == $f) {
      _ && (k[0] = k[1] = ca(S, k[1])[2]);
      const [E, C] = d(), [R, A] = k, N = s0[u0(r)]?.autoIndent, L = Math.floor(Ka(px(S, R)) / C) * C, j = N?.[0]?.(k, S, r) ? C : 0, B = N?.[1]?.(k, S, r), P = `
` + E.repeat(L + j) + (B ? `
` + E.repeat(L) : "");
      if (P[1] || S[A])
        return Cn(r, P, R, A, R + L + j + 1), p();
    }
  }, a.Backspace = (x, [k, S], _) => {
    if (k == S) {
      const E = px(_, k), C = n.tabSize || 2, R = t.includes(_.slice(k - 1, k + 1)), A = /[^ ]/.test(E) ? 0 : (E.length - 1) % C + 1;
      if (R || A > 1)
        return Cn(r, "", k - (R ? 1 : A), k + R), p();
    }
  };
  for (let x = 0; x < 2; x++)
    a[x ? "ArrowDown" : "ArrowUp"] = (k, [S, _], E) => {
      const C = Tf(k);
      if (C == 1) {
        const R = x ? S : bd(E, S) - 1, A = x ? E.indexOf(`
`, _) + 1 : _;
        if (R > -1 && A > 0) {
          const [N, L, j] = ca(E, R, A), B = N[x ? "pop" : "shift"](), P = (B.length + 1) * (x ? 1 : -1);
          N[x ? "unshift" : "push"](B), Cn(r, N.join(`
`), L, j, S + P, _ + P);
        }
        return p();
      } else if (C == 9) {
        const [R, A, N] = ca(E, S, _), L = R.join(`
`), j = x ? L.length + 1 : 0;
        return Cn(r, L + `
` + L, A, N, S + j, _ + j), p();
      } else if (C == 2 && !J0)
        return c.scrollBy(0, nz(c, "lineHeight") * (x ? 1 : -1)), !0;
    };
  hx(r, "keydown", (x) => {
    const k = Tf(x), S = x.keyCode, [_, E, C] = u();
    if (k == $f && (S == 221 || S == 219))
      w(S == 219, ...ca(r.value, _, E), _, E, ...d()), p(), vo(x);
    else if (k == (J0 ? 10 : 2) && S == 77)
      az(!tv), vo(x);
    else if (S == 191 && k == $f || S == 65 && k == 9) {
      const R = r.value, A = k == 9, N = A ? _ : bd(R, _), L = s0[u0(r, N)] || {}, { line: j, block: B } = L.getComments?.(r, N, R) || L.comments || {}, [P, q, H] = ca(R, _, E), X = P.length - 1;
      if (A) {
        if (B) {
          const [V, G] = B, Z = R.slice(_, E), Y = R.slice(0, _).search(Cu(V) + " ?$"), I = RegExp("^ ?" + Cu(G)).test(R.slice(E));
          Y + 1 && I ? Cn(
            r,
            Z,
            Y,
            E + +(R[E] == " ") + G.length,
            Y,
            Y + E - _
          ) : Cn(
            r,
            `${V} ${Z} ${G}`,
            _,
            E,
            _ + V.length + 1,
            E + V.length + 1
          ), p(), vo(x);
        }
      } else if (j) {
        const V = Cu(j), G = RegExp(`^\\s*(${V} ?|$)`), Z = RegExp(V + " ?"), Y = !/\S/.test(R.slice(q, H)), I = P.map(
          P.every((K) => G.test(K)) && !Y ? (K) => K.replace(Z, "") : (K) => Y || /\S/.test(K) ? K.replace(/^\s*/, `$&${j} `) : K
        );
        y(P, I, q, H, _, E), p(), vo(x);
      } else if (B) {
        const [V, G] = B, Z = Ka(P[0]), Y = P[0].startsWith(V, Z) && P[X].endsWith(G), I = P.slice();
        I[0] = P[0].replace(
          Y ? RegExp(Cu(V) + " ?") : /(?=\S)|$/,
          Y ? "" : V + " "
        );
        let K = I[0].length - P[0].length;
        I[X] = Y ? I[X].replace(RegExp(`( ?${Cu(G)})?$`), "") : I[X] + " " + G;
        let ie = I.join(`
`), se = Z + q, ye = se > _ ? _ : Math.max(_ + K, se), _e = se > E - (_ != E) ? E : Math.min(Math.max(se, E + K), q + ie.length);
        Cn(r, ie, q, H, ye, Math.max(ye, _e)), p(), vo(x);
      }
    } else if (k == 8 + $f && S == 75) {
      const R = r.value, [A, N, L] = ca(R, _, E), j = C > "f" ? E - L + A.pop().length : _ - N, B = Bg(R, L + 1) - L - 1;
      Cn(
        r,
        "",
        N - !!N,
        L + !N,
        N + Math.min(j, B)
      ), p(), vo(x);
    }
  }), ["copy", "cut", "paste"].forEach(
    (x) => hx(r, x, (k) => {
      const [S, _] = u();
      if (S == _ && f) {
        const [[E], C, R] = ca(r.value, S, _);
        x == "paste" ? k.clipboardData.getData("text/plain") == i && (Cn(r, i + `
`, C, C, S + i.length + 1), p(), vo(k)) : (f.writeText(i = E), x == "cut" && (Cn(r, "", C, R + 1), p()), vo(k));
      }
    })
  );
};
var sz = () => ({
  pattern: /\/\/.*|\/\*[^]*?(?:\*\/|$)/g,
  greedy: !0
}), uz = /\b(?:false|true)\b/;
uc.webmanifest = uc.json = {
  property: {
    pattern: /"(?:\\.|[^\\\n"])*"(?=\s*:)/g,
    greedy: !0
  },
  string: {
    pattern: /"(?:\\.|[^\\\n"])*"/g,
    greedy: !0
  },
  comment: sz(),
  number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  operator: /:/,
  punctuation: /[[\]{},]/,
  boolean: uz,
  null: {
    pattern: /\bnull\b/,
    alias: "keyword"
  }
};
uc.sql = {
  comment: /\/\*[^]*?\*\/|(?:--|\/\/|#).*/,
  variable: [
    {
      pattern: /@(["'`])(?:\\[^]|(?!\1)[^\\])+\1/g,
      greedy: !0
    },
    /@[\w.$]+/
  ],
  string: {
    pattern: /(^|[^@\\])(["'])(?:\\[^]|(?!\2)[^\\]|\2\2)*\2/g,
    lookbehind: !0,
    greedy: !0
  },
  identifier: {
    pattern: /(^|[^@\\])`(?:\\[^]|[^\\`]|``)*`/g,
    lookbehind: !0,
    greedy: !0,
    inside: {
      punctuation: /^`|`$/
    }
  },
  function: /\b(?:avg|count|first|format|last|[lu]case|len|max|mi[dn]|mod|now|round|sum)(?=\s*\()/i,
  // Should we highlight user defined functions too?
  keyword: /\b(?:action|add|after|algorithm|alter|analyze|any|apply|asc?|authorization|auto_increment|backup|bdb|begin|berkeleydb|bigint|binary|bit|blob|bool|boolean|break|browse|[br]tree|bulk|by|c?all|cascaded?|case|chain|character|charset|check(?:point)?|close|clustered|coalesce|collate|columns?|comment|commit(?:ted)?|compute|connect|consistent|constraint|contains(?:table)?|continue|convert|create|cross|current(?:_date|_time|_timestamp|_user)?|cursor|cycle|data(?:bases?)?|date(?:time)?|day|dbcc|deallocate|dec|decimal|declare|default|definer|delayed|delete|delimiters?|deny|desc|describe|deterministic|disable|discard|disk|distinct|distinctrow|distributed|do|double|drop|dummy|dump(?:file)?|duplicate|else(?:if)?|enable|enclosed|end|engine|enum|errlvl|errors|escaped?|except|exec(?:ute)?|exists|exit|explain|extended|fetch|fields|file|fillfactor|first|fixed|float|following|for each row|for|force|foreign|freetexttable|freetext|from|full|function|geometry(?:collection)?|global|goto|grant|group|handler|hash|having|holdlock|hour|identity(?:col|_insert)?|if|ignore|import|index|infile|inner|innodb|inout|insert|integer|intersect|interval|into?|invoker|isolation|iterate|join|keys?|kill|language|last|leave|left|level|limit|lineno|lines|linestring|load|local|lock|long(?:blob|text)|loop|matched|match|(?:medium|tiny)(?:blob|int|text)|merge|middleint|minute|mode|modifies|modify|month|multi(?:linestring|point|polygon)|national|natural|n?char|next|no|nonclustered|nullif|numeric|off?|offsets?|on|open(?:datasource|query|rowset)?|optimize|option(?:ally)?|order|out(?:er|file)?|over|partial|partition|percent|pivot|plan|point|polygon|preceding|precision|prepare|prev|primary|print|privileges|proc(?:edure)?|public|purge|quick|raiserror|reads?|real|reconfigure|references|release|rename|repeat(?:able)?|replace|replication|require|resignal|restore|restrict|returning|returns?|revoke|right|rollback|routine|row(?:count|guidcol|s)?|rule|savepoint|save|schema|second|select|serializable|serial|session_user|session|setuser|set|share|show|shutdown|simple|smallint|snapshot|some|soname|sql|start(?:ing)?|statistics|status|striped|system_user|tables?|tablespace|temp(?:orary|table)?|terminated|textsize|text|[tw]hen|timestamp|time|top?|transactions?|tran|trigger|truncate|tsequal|types?|unbounded|uncommitted|undefined|union|unique|unlock|unpivot|unsigned|updatetext|update|usage|user?|using|values?|var(?:binary|char|character|ying)|view|waitfor|warnings|where|while|with(?: rollup|in)?|work|writetext|write|year)\b/i,
  boolean: /\b(?:false|true|null)\b/i,
  number: /\b0x[a-f\d]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
  operator: /[=%~^/*+-]|&&?|\|\|?|!=?|<<|<=?>?|>[>=]?|\b(?:and|between|div|[ir]?like|in|is|not|x?or|regexp|sounds like)\b/i,
  punctuation: /[()[\].,;`]/
};
var cz = /* @__PURE__ */ Se('<div><div class="w-full h-full grid"></div></div>');
function Dg(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(a, "$darkMode", r);
  let a = yr.darkMode, l;
  yn(() => {
    if (l == null)
      return;
    let f = JN(
      l,
      {
        language: e.language ?? "json",
        value: Go(() => e.value ?? ""),
        lineNumbers: !1,
        onUpdate(d) {
          e.onChange?.(d);
        }
      },
      lz()
    );
    return yn(() => {
      e.value !== f.value && f.setOptions({ value: e.value ?? "" });
    }), () => {
      f.remove();
    };
  });
  var u = cz(), c = ne(u);
  Wo(c, (f) => l = f, () => l), ee(u), Ee(() => _r(u, 1, `h-64 rounded-md border border-slate-200 dark:border-slate-600 overflow-hidden ${i() ? "code-editor-dark" : "code-editor-light"} ${e.className ?? "" ?? ""}`)), te(t, u), mt(), n();
}
const fz = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let Pg = (t = 21) => {
  let e = "", r = crypto.getRandomValues(new Uint8Array(t |= 0));
  for (; t--; )
    e += fz[r[t] & 63];
  return e;
};
function vx(t, e, r, n) {
  !e() || !h(r) || e()(n(h(r).value));
}
var dz = /* @__PURE__ */ Se("<option disabled selected> </option>"), hz = /* @__PURE__ */ Se("<hr/>"), pz = /* @__PURE__ */ Se("<option> </option>"), vz = /* @__PURE__ */ Se('<label class="select-none flex items-center gap-2"><span class="text-slate-500 dark:text-slate-400 whitespace-nowrap"> </span> <select><!><!></select></label>'), gz = /* @__PURE__ */ Se("<option disabled selected> </option>"), mz = /* @__PURE__ */ Se("<hr/>"), yz = /* @__PURE__ */ Se("<option> </option>"), bz = /* @__PURE__ */ Se("<select><!><!></select>");
function Za(t, e) {
  gt(e, !0);
  let r = Je(e, "label", 3, void 0), n = Je(e, "disabled", 3, !1), i = Je(e, "placeholder", 3, null), a = Je(e, "options", 19, () => []), l = Je(e, "onChange", 3, void 0), u = /* @__PURE__ */ ge(void 0);
  const c = Pg(), f = c + "_null", d = c + "_undefined", p = (k) => k === null ? f : k === void 0 ? d : k.toString(), g = (k) => k === f ? null : k === d ? void 0 : k;
  var m = fr(), y = We(m);
  {
    var w = (k) => {
      var S = vz(), _ = ne(S), E = ne(_, !0);
      ee(_);
      var C = le(_, 2);
      C.__change = [vx, l, u, g];
      var R = ne(C);
      {
        var A = (j) => {
          var B = dz(), P = ne(B, !0);
          ee(B), B.value = (B.__value = null) ?? "", Ee(() => rt(P, i())), te(j, B);
        };
        Te(R, (j) => {
          i() != null && j(A);
        });
      }
      var N = le(R);
      Gt(N, 17, a, or, (j, B) => {
        var P = fr(), q = We(P);
        {
          var H = (V) => {
            var G = hz();
            te(V, G);
          }, X = (V) => {
            var G = pz(), Z = ne(G, !0);
            ee(G);
            var Y = {};
            Ee(
              (I) => {
                rt(Z, h(B).label), Y !== (Y = I) && (G.value = (G.__value = I) ?? "");
              },
              [() => p(h(B).value)]
            ), te(V, G);
          };
          Te(q, (V) => {
            h(B) === "---" ? V(H) : V(X, !1);
          });
        }
        te(j, P);
      }), ee(C), Wo(C, (j) => W(u, j), () => h(u));
      var L;
      Jf(C), ee(S), Ee(
        (j) => {
          rt(E, r()), _r(C, 1, `form-select rounded-md py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-slate-400 text-ellipsis ${e.class ?? "" ?? ""}`), C.disabled = n(), L !== (L = j) && (C.value = (C.__value = j) ?? "", Ds(C, j));
        },
        [() => p(e.value)]
      ), te(k, S);
    }, x = (k) => {
      var S = bz();
      S.__change = [vx, l, u, g];
      var _ = ne(S);
      {
        var E = (A) => {
          var N = gz(), L = ne(N, !0);
          ee(N), N.value = (N.__value = null) ?? "", Ee(() => rt(L, i())), te(A, N);
        };
        Te(_, (A) => {
          i() != null && A(E);
        });
      }
      var C = le(_);
      Gt(C, 17, a, or, (A, N) => {
        var L = fr(), j = We(L);
        {
          var B = (q) => {
            var H = mz();
            te(q, H);
          }, P = (q) => {
            var H = yz(), X = ne(H, !0);
            ee(H);
            var V = {};
            Ee(
              (G) => {
                rt(X, h(N).label), V !== (V = G) && (H.value = (H.__value = G) ?? "");
              },
              [() => p(h(N).value)]
            ), te(q, H);
          };
          Te(j, (q) => {
            h(N) === "---" ? q(B) : q(P, !1);
          });
        }
        te(A, L);
      }), ee(S), Wo(S, (A) => W(u, A), () => h(u));
      var R;
      Jf(S), Ee(
        (A) => {
          _r(S, 1, `form-select rounded-md py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 dark:text-slate-400 select-none text-ellipsis ${e.class ?? "" ?? ""}`), S.disabled = n(), R !== (R = A) && (S.value = (S.__value = A) ?? "", Ds(S, A));
        },
        [() => p(e.value)]
      ), te(k, S);
    };
    Te(y, (k) => {
      r() != null ? k(w) : k(x, !1);
    });
  }
  te(t, m), mt();
}
Tr(["change"]);
var Fo = { slate: { 300: "oklch(86.9% 0.022 252.894)", 400: "oklch(70.4% 0.04 256.788)", 500: "oklch(55.4% 0.046 257.417)", 600: "oklch(44.6% 0.043 257.281)" }, gray: { 500: "oklch(55.1% 0.027 264.364)" } };
const xz = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<line x1="15" y1="54" x2="15" y2="12" stroke="black" stroke-width="2"/>
<line x1="32" y1="53" x2="32" y2="10" stroke="black" stroke-width="2"/>
<line x1="49" y1="45" x2="49" y2="19" stroke="black" stroke-width="2"/>
<rect x="8" y="27" width="14" height="18" rx="3" fill="#007AFF"/>
<rect x="25" y="22" width="14" height="14" rx="3" fill="#007AFF"/>
<rect x="42" y="27" width="14" height="12" rx="3" fill="#007AFF"/>
</svg>
`, wz = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="8" y="8" width="48" height="14" rx="3" fill="#007AFF"/>
<rect x="8" y="25" width="36" height="14" rx="3" fill="#007AFF"/>
<rect x="8" y="42" width="24" height="14" rx="3" fill="#007AFF"/>
</svg>
`, kz = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="48" y="48" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="48" y="38" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.78"/>
<rect x="48" y="28" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="48" y="18" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.5"/>
<rect x="48" y="8" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="38" y="48" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.96"/>
<rect x="38" y="38" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="38" y="28" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.63"/>
<rect x="38" y="18" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.36"/>
<rect x="38" y="8" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.64"/>
<rect x="28" y="48" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="28" y="38" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.45"/>
<rect x="28" y="28" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.28"/>
<rect x="28" y="18" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.8"/>
<rect x="28" y="8" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.7"/>
<rect x="18" y="48" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.27"/>
<rect x="18" y="38" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.46"/>
<rect x="18" y="28" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.74"/>
<rect x="18" y="18" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.96"/>
<rect x="18" y="8" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.82"/>
<rect x="8" y="48" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="8" y="38" width="8" height="8" rx="2" fill="#007AFF"/>
<rect x="8" y="28" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.33"/>
<rect x="8" y="18" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.12"/>
<rect x="8" y="8" width="8" height="8" rx="2" fill="#007AFF" fill-opacity="0.4"/>
</svg>
`, _z = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.1666 45.7042C28.9268 45.8901 29.611 45.5001 29.8329 44.7506L36.9814 20.6115C37.1728 19.9366 36.8385 19.2589 36.0783 19.0547C35.3333 18.8689 34.6979 19.1477 34.4425 20.0235L27.3365 44.0276C27.1175 44.7804 27.3579 45.5001 28.1666 45.7042Z" fill="black"/>
<path d="M12 32.3568C12 32.7499 12.1764 33.1396 12.5046 33.4216L22.0655 41.9466C22.6825 42.4776 23.4794 42.4744 23.9719 41.9287C24.4765 41.3647 24.3975 40.5639 23.829 40.0662L15.214 32.3568L23.829 24.6476C24.3975 24.1496 24.4765 23.3488 23.9719 22.7851C23.4794 22.2391 22.6825 22.2362 22.0655 22.7669L12.5046 31.2922C12.1764 31.5742 12 31.9639 12 32.3568ZM52.1638 32.3568C52.1638 31.9639 52.0027 31.5742 51.6742 31.2922L42.1015 22.7669C41.481 22.2362 40.6997 22.2391 40.1948 22.7851C39.6871 23.3488 39.7663 24.1496 40.3378 24.6476L48.968 32.3568L40.3378 40.0662C39.7663 40.5639 39.6871 41.3647 40.1948 41.9287C40.6997 42.4744 41.481 42.4776 42.1015 41.9466L51.6742 33.4216C52.0027 33.1396 52.1638 32.7499 52.1638 32.3568Z" fill="black"/>
</svg>
`, Sz = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 33H22V53C22 54.6569 20.6569 56 19 56H11C9.34315 56 8 54.6569 8 53V33Z" fill="#34C759"/>
<path d="M8 19C8 17.3431 9.34315 16 11 16H19C20.6569 16 22 17.3431 22 19V34H8V19Z" fill="#007AFF"/>
<path d="M25 39H39V53C39 54.6569 37.6569 56 36 56H28C26.3431 56 25 54.6569 25 53V39Z" fill="#34C759"/>
<path d="M42 32H56V53C56 54.6569 54.6569 56 53 56H45C43.3431 56 42 54.6569 42 53V32Z" fill="#34C759"/>
<path d="M25 29C25 27.3431 26.3431 26 28 26H36C37.6569 26 39 27.3431 39 29V40H25V29Z" fill="#3C82F6"/>
<path d="M42 16C42 14.3431 43.3431 13 45 13H53C54.6569 13 56 14.3431 56 16V33H42V16Z" fill="#007AFF"/>
</svg>
`, Mz = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="8" y="32" width="14" height="24" rx="3" fill="#007AFF"/>
<rect x="25" y="12" width="14" height="44" rx="3" fill="#007AFF"/>
<rect x="42" y="24" width="14" height="32" rx="3" fill="#007AFF"/>
</svg>
`;
var Cz = /* @__PURE__ */ Se('<div class="w-12 h-12"><!></div>');
function Rz(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(a, "$darkMode", r), a = yr.darkMode, l = {
    "chart-boxplot": xz,
    "chart-h-bar": wz,
    "chart-heatmap": kz,
    "chart-stacked": Sz,
    "chart-v-histogram": Mz,
    "chart-spec": _z
  };
  function u(d, p) {
    d = d.replace("xmlns", 'style="width:100%;height:100%" xmlns');
    let g = p ? { black: Fo.slate[400] } : { black: Fo.slate[500] };
    for (let m in g)
      d = d.replaceAll(m, g[m]);
    return d;
  }
  var c = Cz(), f = ne(c);
  ZM(f, () => u(l[e.type] ?? "", i())), ee(c), te(t, c), mt(), n();
}
var Az = /* @__PURE__ */ Se("<div><!></div>");
function rh(t, e) {
  let r = /* @__PURE__ */ ge(300), n = /* @__PURE__ */ ge(200);
  var i = Az();
  tt(i, "", {}, {
    "user-select": "none",
    position: "relative",
    width: "100%",
    height: "100%"
  });
  var a = ne(i);
  Gu(a, () => e.children ?? Ft, () => h(r), () => h(n)), ee(i), bl(i, "clientWidth", (l) => W(r, l)), bl(i, "clientHeight", (l) => W(n, l)), te(t, i);
}
function Ez(t) {
  return Math.abs(t = Math.round(t)) >= 1e21 ? t.toLocaleString("en").replace(/,/g, "") : t.toString(10);
}
function xd(t, e) {
  if ((r = (t = e ? t.toExponential(e - 1) : t.toExponential()).indexOf("e")) < 0) return null;
  var r, n = t.slice(0, r);
  return [
    n.length > 1 ? n[0] + n.slice(2) : n,
    +t.slice(r + 1)
  ];
}
function js(t) {
  return t = xd(Math.abs(t)), t ? t[1] : NaN;
}
function Tz(t, e) {
  return function(r, n) {
    for (var i = r.length, a = [], l = 0, u = t[0], c = 0; i > 0 && u > 0 && (c + u + 1 > n && (u = Math.max(1, n - c)), a.push(r.substring(i -= u, i + u)), !((c += u + 1) > n)); )
      u = t[l = (l + 1) % t.length];
    return a.reverse().join(e);
  };
}
function $z(t) {
  return function(e) {
    return e.replace(/[0-9]/g, function(r) {
      return t[+r];
    });
  };
}
var Fz = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
function cc(t) {
  if (!(e = Fz.exec(t))) throw new Error("invalid format: " + t);
  var e;
  return new Lg({
    fill: e[1],
    align: e[2],
    sign: e[3],
    symbol: e[4],
    zero: e[5],
    width: e[6],
    comma: e[7],
    precision: e[8] && e[8].slice(1),
    trim: e[9],
    type: e[10]
  });
}
cc.prototype = Lg.prototype;
function Lg(t) {
  this.fill = t.fill === void 0 ? " " : t.fill + "", this.align = t.align === void 0 ? ">" : t.align + "", this.sign = t.sign === void 0 ? "-" : t.sign + "", this.symbol = t.symbol === void 0 ? "" : t.symbol + "", this.zero = !!t.zero, this.width = t.width === void 0 ? void 0 : +t.width, this.comma = !!t.comma, this.precision = t.precision === void 0 ? void 0 : +t.precision, this.trim = !!t.trim, this.type = t.type === void 0 ? "" : t.type + "";
}
Lg.prototype.toString = function() {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
};
function Nz(t) {
  e: for (var e = t.length, r = 1, n = -1, i; r < e; ++r)
    switch (t[r]) {
      case ".":
        n = i = r;
        break;
      case "0":
        n === 0 && (n = r), i = r;
        break;
      default:
        if (!+t[r]) break e;
        n > 0 && (n = 0);
        break;
    }
  return n > 0 ? t.slice(0, n) + t.slice(i + 1) : t;
}
var x3;
function zz(t, e) {
  var r = xd(t, e);
  if (!r) return t + "";
  var n = r[0], i = r[1], a = i - (x3 = Math.max(-8, Math.min(8, Math.floor(i / 3))) * 3) + 1, l = n.length;
  return a === l ? n : a > l ? n + new Array(a - l + 1).join("0") : a > 0 ? n.slice(0, a) + "." + n.slice(a) : "0." + new Array(1 - a).join("0") + xd(t, Math.max(0, e + a - 1))[0];
}
function gx(t, e) {
  var r = xd(t, e);
  if (!r) return t + "";
  var n = r[0], i = r[1];
  return i < 0 ? "0." + new Array(-i).join("0") + n : n.length > i + 1 ? n.slice(0, i + 1) + "." + n.slice(i + 1) : n + new Array(i - n.length + 2).join("0");
}
const mx = {
  "%": (t, e) => (t * 100).toFixed(e),
  b: (t) => Math.round(t).toString(2),
  c: (t) => t + "",
  d: Ez,
  e: (t, e) => t.toExponential(e),
  f: (t, e) => t.toFixed(e),
  g: (t, e) => t.toPrecision(e),
  o: (t) => Math.round(t).toString(8),
  p: (t, e) => gx(t * 100, e),
  r: gx,
  s: zz,
  X: (t) => Math.round(t).toString(16).toUpperCase(),
  x: (t) => Math.round(t).toString(16)
};
function yx(t) {
  return t;
}
var bx = Array.prototype.map, xx = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
function Oz(t) {
  var e = t.grouping === void 0 || t.thousands === void 0 ? yx : Tz(bx.call(t.grouping, Number), t.thousands + ""), r = t.currency === void 0 ? "" : t.currency[0] + "", n = t.currency === void 0 ? "" : t.currency[1] + "", i = t.decimal === void 0 ? "." : t.decimal + "", a = t.numerals === void 0 ? yx : $z(bx.call(t.numerals, String)), l = t.percent === void 0 ? "%" : t.percent + "", u = t.minus === void 0 ? "−" : t.minus + "", c = t.nan === void 0 ? "NaN" : t.nan + "";
  function f(p) {
    p = cc(p);
    var g = p.fill, m = p.align, y = p.sign, w = p.symbol, x = p.zero, k = p.width, S = p.comma, _ = p.precision, E = p.trim, C = p.type;
    C === "n" ? (S = !0, C = "g") : mx[C] || (_ === void 0 && (_ = 12), E = !0, C = "g"), (x || g === "0" && m === "=") && (x = !0, g = "0", m = "=");
    var R = w === "$" ? r : w === "#" && /[boxX]/.test(C) ? "0" + C.toLowerCase() : "", A = w === "$" ? n : /[%p]/.test(C) ? l : "", N = mx[C], L = /[defgprs%]/.test(C);
    _ = _ === void 0 ? 6 : /[gprs]/.test(C) ? Math.max(1, Math.min(21, _)) : Math.max(0, Math.min(20, _));
    function j(B) {
      var P = R, q = A, H, X, V;
      if (C === "c")
        q = N(B) + q, B = "";
      else {
        B = +B;
        var G = B < 0 || 1 / B < 0;
        if (B = isNaN(B) ? c : N(Math.abs(B), _), E && (B = Nz(B)), G && +B == 0 && y !== "+" && (G = !1), P = (G ? y === "(" ? y : u : y === "-" || y === "(" ? "" : y) + P, q = (C === "s" ? xx[8 + x3 / 3] : "") + q + (G && y === "(" ? ")" : ""), L) {
          for (H = -1, X = B.length; ++H < X; )
            if (V = B.charCodeAt(H), 48 > V || V > 57) {
              q = (V === 46 ? i + B.slice(H + 1) : B.slice(H)) + q, B = B.slice(0, H);
              break;
            }
        }
      }
      S && !x && (B = e(B, 1 / 0));
      var Z = P.length + B.length + q.length, Y = Z < k ? new Array(k - Z + 1).join(g) : "";
      switch (S && x && (B = e(Y + B, Y.length ? k - q.length : 1 / 0), Y = ""), m) {
        case "<":
          B = P + B + q + Y;
          break;
        case "=":
          B = P + Y + B + q;
          break;
        case "^":
          B = Y.slice(0, Z = Y.length >> 1) + P + B + q + Y.slice(Z);
          break;
        default:
          B = Y + P + B + q;
          break;
      }
      return a(B);
    }
    return j.toString = function() {
      return p + "";
    }, j;
  }
  function d(p, g) {
    var m = f((p = cc(p), p.type = "f", p)), y = Math.max(-8, Math.min(8, Math.floor(js(g) / 3))) * 3, w = Math.pow(10, -y), x = xx[8 + y / 3];
    return function(k) {
      return m(w * k) + x;
    };
  }
  return {
    format: f,
    formatPrefix: d
  };
}
var Ff, Yi, w3;
Bz({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});
function Bz(t) {
  return Ff = Oz(t), Yi = Ff.format, w3 = Ff.formatPrefix, Ff;
}
function Dz(t) {
  return Math.max(0, -js(Math.abs(t)));
}
function Pz(t, e) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(js(e) / 3))) * 3 - js(Math.abs(t)));
}
function Lz(t, e) {
  return t = Math.abs(t), e = Math.abs(e) - t, Math.max(0, js(e) - js(t)) + 1;
}
function Hf(t, e) {
  return t == null || e == null ? NaN : t < e ? -1 : t > e ? 1 : t >= e ? 0 : NaN;
}
function qz(t, e) {
  return t == null || e == null ? NaN : e < t ? -1 : e > t ? 1 : e >= t ? 0 : NaN;
}
function k3(t) {
  let e, r, n;
  t.length !== 2 ? (e = Hf, r = (u, c) => Hf(t(u), c), n = (u, c) => t(u) - c) : (e = t === Hf || t === qz ? t : Iz, r = t, n = t);
  function i(u, c, f = 0, d = u.length) {
    if (f < d) {
      if (e(c, c) !== 0) return d;
      do {
        const p = f + d >>> 1;
        r(u[p], c) < 0 ? f = p + 1 : d = p;
      } while (f < d);
    }
    return f;
  }
  function a(u, c, f = 0, d = u.length) {
    if (f < d) {
      if (e(c, c) !== 0) return d;
      do {
        const p = f + d >>> 1;
        r(u[p], c) <= 0 ? f = p + 1 : d = p;
      } while (f < d);
    }
    return f;
  }
  function l(u, c, f = 0, d = u.length) {
    const p = i(u, c, f, d - 1);
    return p > f && n(u[p - 1], c) > -n(u[p], c) ? p - 1 : p;
  }
  return { left: i, center: l, right: a };
}
function Iz() {
  return 0;
}
function jz(t) {
  return t === null ? NaN : +t;
}
const Uz = k3(Hf), Wz = Uz.right;
k3(jz).center;
class wx extends Map {
  constructor(e, r = Gz) {
    if (super(), Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: r } }), e != null) for (const [n, i] of e) this.set(n, i);
  }
  get(e) {
    return super.get(kx(this, e));
  }
  has(e) {
    return super.has(kx(this, e));
  }
  set(e, r) {
    return super.set(Hz(this, e), r);
  }
  delete(e) {
    return super.delete(Vz(this, e));
  }
}
function kx({ _intern: t, _key: e }, r) {
  const n = e(r);
  return t.has(n) ? t.get(n) : r;
}
function Hz({ _intern: t, _key: e }, r) {
  const n = e(r);
  return t.has(n) ? t.get(n) : (t.set(n, r), r);
}
function Vz({ _intern: t, _key: e }, r) {
  const n = e(r);
  return t.has(n) && (r = t.get(n), t.delete(n)), r;
}
function Gz(t) {
  return t !== null && typeof t == "object" ? t.valueOf() : t;
}
const Xz = Math.sqrt(50), Yz = Math.sqrt(10), Kz = Math.sqrt(2);
function wd(t, e, r) {
  const n = (e - t) / Math.max(0, r), i = Math.floor(Math.log10(n)), a = n / Math.pow(10, i), l = a >= Xz ? 10 : a >= Yz ? 5 : a >= Kz ? 2 : 1;
  let u, c, f;
  return i < 0 ? (f = Math.pow(10, -i) / l, u = Math.round(t * f), c = Math.round(e * f), u / f < t && ++u, c / f > e && --c, f = -f) : (f = Math.pow(10, i) * l, u = Math.round(t / f), c = Math.round(e / f), u * f < t && ++u, c * f > e && --c), c < u && 0.5 <= r && r < 2 ? wd(t, e, r * 2) : [u, c, f];
}
function rv(t, e, r) {
  if (e = +e, t = +t, r = +r, !(r > 0)) return [];
  if (t === e) return [t];
  const n = e < t, [i, a, l] = n ? wd(e, t, r) : wd(t, e, r);
  if (!(a >= i)) return [];
  const u = a - i + 1, c = new Array(u);
  if (n)
    if (l < 0) for (let f = 0; f < u; ++f) c[f] = (a - f) / -l;
    else for (let f = 0; f < u; ++f) c[f] = (a - f) * l;
  else if (l < 0) for (let f = 0; f < u; ++f) c[f] = (i + f) / -l;
  else for (let f = 0; f < u; ++f) c[f] = (i + f) * l;
  return c;
}
function nv(t, e, r) {
  return e = +e, t = +t, r = +r, wd(t, e, r)[2];
}
function Zz(t, e, r) {
  e = +e, t = +t, r = +r;
  const n = e < t, i = n ? nv(e, t, r) : nv(t, e, r);
  return (n ? -1 : 1) * (i < 0 ? 1 / -i : i);
}
function Qz(t, e, r) {
  t = +t, e = +e, r = (i = arguments.length) < 2 ? (e = t, t = 0, 1) : i < 3 ? 1 : +r;
  for (var n = -1, i = Math.max(0, Math.ceil((e - t) / r)) | 0, a = new Array(i); ++n < i; )
    a[n] = t + n * r;
  return a;
}
function Ac(t, e) {
  switch (arguments.length) {
    case 0:
      break;
    case 1:
      this.range(t);
      break;
    default:
      this.range(e).domain(t);
      break;
  }
  return this;
}
const _x = Symbol("implicit");
function _3() {
  var t = new wx(), e = [], r = [], n = _x;
  function i(a) {
    let l = t.get(a);
    if (l === void 0) {
      if (n !== _x) return n;
      t.set(a, l = e.push(a) - 1);
    }
    return r[l % r.length];
  }
  return i.domain = function(a) {
    if (!arguments.length) return e.slice();
    e = [], t = new wx();
    for (const l of a)
      t.has(l) || t.set(l, e.push(l) - 1);
    return i;
  }, i.range = function(a) {
    return arguments.length ? (r = Array.from(a), i) : r.slice();
  }, i.unknown = function(a) {
    return arguments.length ? (n = a, i) : n;
  }, i.copy = function() {
    return _3(e, r).unknown(n);
  }, Ac.apply(i, arguments), i;
}
function S3() {
  var t = _3().unknown(void 0), e = t.domain, r = t.range, n = 0, i = 1, a, l, u = !1, c = 0, f = 0, d = 0.5;
  delete t.unknown;
  function p() {
    var g = e().length, m = i < n, y = m ? i : n, w = m ? n : i;
    a = (w - y) / Math.max(1, g - c + f * 2), u && (a = Math.floor(a)), y += (w - y - a * (g - c)) * d, l = a * (1 - c), u && (y = Math.round(y), l = Math.round(l));
    var x = Qz(g).map(function(k) {
      return y + a * k;
    });
    return r(m ? x.reverse() : x);
  }
  return t.domain = function(g) {
    return arguments.length ? (e(g), p()) : e();
  }, t.range = function(g) {
    return arguments.length ? ([n, i] = g, n = +n, i = +i, p()) : [n, i];
  }, t.rangeRound = function(g) {
    return [n, i] = g, n = +n, i = +i, u = !0, p();
  }, t.bandwidth = function() {
    return l;
  }, t.step = function() {
    return a;
  }, t.round = function(g) {
    return arguments.length ? (u = !!g, p()) : u;
  }, t.padding = function(g) {
    return arguments.length ? (c = Math.min(1, f = +g), p()) : c;
  }, t.paddingInner = function(g) {
    return arguments.length ? (c = Math.min(1, g), p()) : c;
  }, t.paddingOuter = function(g) {
    return arguments.length ? (f = +g, p()) : f;
  }, t.align = function(g) {
    return arguments.length ? (d = Math.max(0, Math.min(1, g)), p()) : d;
  }, t.copy = function() {
    return S3(e(), [n, i]).round(u).paddingInner(c).paddingOuter(f).align(d);
  }, Ac.apply(p(), arguments);
}
function Ec(t, e, r) {
  t.prototype = e.prototype = r, r.constructor = t;
}
function nh(t, e) {
  var r = Object.create(t.prototype);
  for (var n in e) r[n] = e[n];
  return r;
}
function Il() {
}
var fc = 0.7, kd = 1 / fc, Ts = "\\s*([+-]?\\d+)\\s*", dc = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*", si = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*", Jz = /^#([0-9a-f]{3,8})$/, eO = new RegExp(`^rgb\\(${Ts},${Ts},${Ts}\\)$`), tO = new RegExp(`^rgb\\(${si},${si},${si}\\)$`), rO = new RegExp(`^rgba\\(${Ts},${Ts},${Ts},${dc}\\)$`), nO = new RegExp(`^rgba\\(${si},${si},${si},${dc}\\)$`), oO = new RegExp(`^hsl\\(${dc},${si},${si}\\)$`), iO = new RegExp(`^hsla\\(${dc},${si},${si},${dc}\\)$`), Sx = {
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
Ec(Il, hc, {
  copy(t) {
    return Object.assign(new this.constructor(), this, t);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: Mx,
  // Deprecated! Use color.formatHex.
  formatHex: Mx,
  formatHex8: aO,
  formatHsl: lO,
  formatRgb: Cx,
  toString: Cx
});
function Mx() {
  return this.rgb().formatHex();
}
function aO() {
  return this.rgb().formatHex8();
}
function lO() {
  return C3(this).formatHsl();
}
function Cx() {
  return this.rgb().formatRgb();
}
function hc(t) {
  var e, r;
  return t = (t + "").trim().toLowerCase(), (e = Jz.exec(t)) ? (r = e[1].length, e = parseInt(e[1], 16), r === 6 ? Rx(e) : r === 3 ? new an(e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, (e & 15) << 4 | e & 15, 1) : r === 8 ? Nf(e >> 24 & 255, e >> 16 & 255, e >> 8 & 255, (e & 255) / 255) : r === 4 ? Nf(e >> 12 & 15 | e >> 8 & 240, e >> 8 & 15 | e >> 4 & 240, e >> 4 & 15 | e & 240, ((e & 15) << 4 | e & 15) / 255) : null) : (e = eO.exec(t)) ? new an(e[1], e[2], e[3], 1) : (e = tO.exec(t)) ? new an(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, 1) : (e = rO.exec(t)) ? Nf(e[1], e[2], e[3], e[4]) : (e = nO.exec(t)) ? Nf(e[1] * 255 / 100, e[2] * 255 / 100, e[3] * 255 / 100, e[4]) : (e = oO.exec(t)) ? Tx(e[1], e[2] / 100, e[3] / 100, 1) : (e = iO.exec(t)) ? Tx(e[1], e[2] / 100, e[3] / 100, e[4]) : Sx.hasOwnProperty(t) ? Rx(Sx[t]) : t === "transparent" ? new an(NaN, NaN, NaN, 0) : null;
}
function Rx(t) {
  return new an(t >> 16 & 255, t >> 8 & 255, t & 255, 1);
}
function Nf(t, e, r, n) {
  return n <= 0 && (t = e = r = NaN), new an(t, e, r, n);
}
function M3(t) {
  return t instanceof Il || (t = hc(t)), t ? (t = t.rgb(), new an(t.r, t.g, t.b, t.opacity)) : new an();
}
function pc(t, e, r, n) {
  return arguments.length === 1 ? M3(t) : new an(t, e, r, n ?? 1);
}
function an(t, e, r, n) {
  this.r = +t, this.g = +e, this.b = +r, this.opacity = +n;
}
Ec(an, pc, nh(Il, {
  brighter(t) {
    return t = t == null ? kd : Math.pow(kd, t), new an(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? fc : Math.pow(fc, t), new an(this.r * t, this.g * t, this.b * t, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new an(vl(this.r), vl(this.g), vl(this.b), _d(this.opacity));
  },
  displayable() {
    return -0.5 <= this.r && this.r < 255.5 && -0.5 <= this.g && this.g < 255.5 && -0.5 <= this.b && this.b < 255.5 && 0 <= this.opacity && this.opacity <= 1;
  },
  hex: Ax,
  // Deprecated! Use color.formatHex.
  formatHex: Ax,
  formatHex8: sO,
  formatRgb: Ex,
  toString: Ex
}));
function Ax() {
  return `#${tl(this.r)}${tl(this.g)}${tl(this.b)}`;
}
function sO() {
  return `#${tl(this.r)}${tl(this.g)}${tl(this.b)}${tl((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}
function Ex() {
  const t = _d(this.opacity);
  return `${t === 1 ? "rgb(" : "rgba("}${vl(this.r)}, ${vl(this.g)}, ${vl(this.b)}${t === 1 ? ")" : `, ${t})`}`;
}
function _d(t) {
  return isNaN(t) ? 1 : Math.max(0, Math.min(1, t));
}
function vl(t) {
  return Math.max(0, Math.min(255, Math.round(t) || 0));
}
function tl(t) {
  return t = vl(t), (t < 16 ? "0" : "") + t.toString(16);
}
function Tx(t, e, r, n) {
  return n <= 0 ? t = e = r = NaN : r <= 0 || r >= 1 ? t = e = NaN : e <= 0 && (t = NaN), new Bo(t, e, r, n);
}
function C3(t) {
  if (t instanceof Bo) return new Bo(t.h, t.s, t.l, t.opacity);
  if (t instanceof Il || (t = hc(t)), !t) return new Bo();
  if (t instanceof Bo) return t;
  t = t.rgb();
  var e = t.r / 255, r = t.g / 255, n = t.b / 255, i = Math.min(e, r, n), a = Math.max(e, r, n), l = NaN, u = a - i, c = (a + i) / 2;
  return u ? (e === a ? l = (r - n) / u + (r < n) * 6 : r === a ? l = (n - e) / u + 2 : l = (e - r) / u + 4, u /= c < 0.5 ? a + i : 2 - a - i, l *= 60) : u = c > 0 && c < 1 ? 0 : l, new Bo(l, u, c, t.opacity);
}
function uO(t, e, r, n) {
  return arguments.length === 1 ? C3(t) : new Bo(t, e, r, n ?? 1);
}
function Bo(t, e, r, n) {
  this.h = +t, this.s = +e, this.l = +r, this.opacity = +n;
}
Ec(Bo, uO, nh(Il, {
  brighter(t) {
    return t = t == null ? kd : Math.pow(kd, t), new Bo(this.h, this.s, this.l * t, this.opacity);
  },
  darker(t) {
    return t = t == null ? fc : Math.pow(fc, t), new Bo(this.h, this.s, this.l * t, this.opacity);
  },
  rgb() {
    var t = this.h % 360 + (this.h < 0) * 360, e = isNaN(t) || isNaN(this.s) ? 0 : this.s, r = this.l, n = r + (r < 0.5 ? r : 1 - r) * e, i = 2 * r - n;
    return new an(
      f0(t >= 240 ? t - 240 : t + 120, i, n),
      f0(t, i, n),
      f0(t < 120 ? t + 240 : t - 120, i, n),
      this.opacity
    );
  },
  clamp() {
    return new Bo($x(this.h), zf(this.s), zf(this.l), _d(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  },
  formatHsl() {
    const t = _d(this.opacity);
    return `${t === 1 ? "hsl(" : "hsla("}${$x(this.h)}, ${zf(this.s) * 100}%, ${zf(this.l) * 100}%${t === 1 ? ")" : `, ${t})`}`;
  }
}));
function $x(t) {
  return t = (t || 0) % 360, t < 0 ? t + 360 : t;
}
function zf(t) {
  return Math.max(0, Math.min(1, t || 0));
}
function f0(t, e, r) {
  return (t < 60 ? e + (r - e) * t / 60 : t < 180 ? r : t < 240 ? e + (r - e) * (240 - t) / 60 : e) * 255;
}
const cO = Math.PI / 180, fO = 180 / Math.PI, Sd = 18, R3 = 0.96422, A3 = 1, E3 = 0.82521, T3 = 4 / 29, $s = 6 / 29, $3 = 3 * $s * $s, dO = $s * $s * $s;
function F3(t) {
  if (t instanceof ui) return new ui(t.l, t.a, t.b, t.opacity);
  if (t instanceof Fi) return z3(t);
  t instanceof an || (t = M3(t));
  var e = v0(t.r), r = v0(t.g), n = v0(t.b), i = d0((0.2225045 * e + 0.7168786 * r + 0.0606169 * n) / A3), a, l;
  return e === r && r === n ? a = l = i : (a = d0((0.4360747 * e + 0.3850649 * r + 0.1430804 * n) / R3), l = d0((0.0139322 * e + 0.0971045 * r + 0.7141733 * n) / E3)), new ui(116 * i - 16, 500 * (a - i), 200 * (i - l), t.opacity);
}
function N3(t, e, r, n) {
  return arguments.length === 1 ? F3(t) : new ui(t, e, r, n ?? 1);
}
function ui(t, e, r, n) {
  this.l = +t, this.a = +e, this.b = +r, this.opacity = +n;
}
Ec(ui, N3, nh(Il, {
  brighter(t) {
    return new ui(this.l + Sd * (t ?? 1), this.a, this.b, this.opacity);
  },
  darker(t) {
    return new ui(this.l - Sd * (t ?? 1), this.a, this.b, this.opacity);
  },
  rgb() {
    var t = (this.l + 16) / 116, e = isNaN(this.a) ? t : t + this.a / 500, r = isNaN(this.b) ? t : t - this.b / 200;
    return e = R3 * h0(e), t = A3 * h0(t), r = E3 * h0(r), new an(
      p0(3.1338561 * e - 1.6168667 * t - 0.4906146 * r),
      p0(-0.9787684 * e + 1.9161415 * t + 0.033454 * r),
      p0(0.0719453 * e - 0.2289914 * t + 1.4052427 * r),
      this.opacity
    );
  }
}));
function d0(t) {
  return t > dO ? Math.pow(t, 1 / 3) : t / $3 + T3;
}
function h0(t) {
  return t > $s ? t * t * t : $3 * (t - T3);
}
function p0(t) {
  return 255 * (t <= 31308e-7 ? 12.92 * t : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
}
function v0(t) {
  return (t /= 255) <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
}
function hO(t) {
  if (t instanceof Fi) return new Fi(t.h, t.c, t.l, t.opacity);
  if (t instanceof ui || (t = F3(t)), t.a === 0 && t.b === 0) return new Fi(NaN, 0 < t.l && t.l < 100 ? 0 : NaN, t.l, t.opacity);
  var e = Math.atan2(t.b, t.a) * fO;
  return new Fi(e < 0 ? e + 360 : e, Math.sqrt(t.a * t.a + t.b * t.b), t.l, t.opacity);
}
function pO(t, e, r, n) {
  return arguments.length === 1 ? hO(t) : new Fi(t, e, r, n ?? 1);
}
function Fi(t, e, r, n) {
  this.h = +t, this.c = +e, this.l = +r, this.opacity = +n;
}
function z3(t) {
  if (isNaN(t.h)) return new ui(t.l, 0, 0, t.opacity);
  var e = t.h * cO;
  return new ui(t.l, Math.cos(e) * t.c, Math.sin(e) * t.c, t.opacity);
}
Ec(Fi, pO, nh(Il, {
  brighter(t) {
    return new Fi(this.h, this.c, this.l + Sd * (t ?? 1), this.opacity);
  },
  darker(t) {
    return new Fi(this.h, this.c, this.l - Sd * (t ?? 1), this.opacity);
  },
  rgb() {
    return z3(this).rgb();
  }
}));
function vO(t, e, r, n, i) {
  var a = t * t, l = a * t;
  return ((1 - 3 * t + 3 * a - l) * e + (4 - 6 * a + 3 * l) * r + (1 + 3 * t + 3 * a - 3 * l) * n + l * i) / 6;
}
function gO(t) {
  var e = t.length - 1;
  return function(r) {
    var n = r <= 0 ? r = 0 : r >= 1 ? (r = 1, e - 1) : Math.floor(r * e), i = t[n], a = t[n + 1], l = n > 0 ? t[n - 1] : 2 * i - a, u = n < e - 1 ? t[n + 2] : 2 * a - i;
    return vO((r - n / e) * e, l, i, a, u);
  };
}
const qg = (t) => () => t;
function mO(t, e) {
  return function(r) {
    return t + r * e;
  };
}
function yO(t, e, r) {
  return t = Math.pow(t, r), e = Math.pow(e, r) - t, r = 1 / r, function(n) {
    return Math.pow(t + n * e, r);
  };
}
function bO(t) {
  return (t = +t) == 1 ? O3 : function(e, r) {
    return r - e ? yO(e, r, t) : qg(isNaN(e) ? r : e);
  };
}
function O3(t, e) {
  var r = e - t;
  return r ? mO(t, r) : qg(isNaN(t) ? e : t);
}
const Fx = function t(e) {
  var r = bO(e);
  function n(i, a) {
    var l = r((i = pc(i)).r, (a = pc(a)).r), u = r(i.g, a.g), c = r(i.b, a.b), f = O3(i.opacity, a.opacity);
    return function(d) {
      return i.r = l(d), i.g = u(d), i.b = c(d), i.opacity = f(d), i + "";
    };
  }
  return n.gamma = t, n;
}(1);
function xO(t) {
  return function(e) {
    var r = e.length, n = new Array(r), i = new Array(r), a = new Array(r), l, u;
    for (l = 0; l < r; ++l)
      u = pc(e[l]), n[l] = u.r || 0, i[l] = u.g || 0, a[l] = u.b || 0;
    return n = t(n), i = t(i), a = t(a), u.opacity = 1, function(c) {
      return u.r = n(c), u.g = i(c), u.b = a(c), u + "";
    };
  };
}
var wO = xO(gO);
function kO(t, e) {
  e || (e = []);
  var r = t ? Math.min(e.length, t.length) : 0, n = e.slice(), i;
  return function(a) {
    for (i = 0; i < r; ++i) n[i] = t[i] * (1 - a) + e[i] * a;
    return n;
  };
}
function _O(t) {
  return ArrayBuffer.isView(t) && !(t instanceof DataView);
}
function SO(t, e) {
  var r = e ? e.length : 0, n = t ? Math.min(r, t.length) : 0, i = new Array(n), a = new Array(r), l;
  for (l = 0; l < n; ++l) i[l] = Ig(t[l], e[l]);
  for (; l < r; ++l) a[l] = e[l];
  return function(u) {
    for (l = 0; l < n; ++l) a[l] = i[l](u);
    return a;
  };
}
function MO(t, e) {
  var r = /* @__PURE__ */ new Date();
  return t = +t, e = +e, function(n) {
    return r.setTime(t * (1 - n) + e * n), r;
  };
}
function Md(t, e) {
  return t = +t, e = +e, function(r) {
    return t * (1 - r) + e * r;
  };
}
function CO(t, e) {
  var r = {}, n = {}, i;
  (t === null || typeof t != "object") && (t = {}), (e === null || typeof e != "object") && (e = {});
  for (i in e)
    i in t ? r[i] = Ig(t[i], e[i]) : n[i] = e[i];
  return function(a) {
    for (i in r) n[i] = r[i](a);
    return n;
  };
}
var ov = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, g0 = new RegExp(ov.source, "g");
function RO(t) {
  return function() {
    return t;
  };
}
function AO(t) {
  return function(e) {
    return t(e) + "";
  };
}
function EO(t, e) {
  var r = ov.lastIndex = g0.lastIndex = 0, n, i, a, l = -1, u = [], c = [];
  for (t = t + "", e = e + ""; (n = ov.exec(t)) && (i = g0.exec(e)); )
    (a = i.index) > r && (a = e.slice(r, a), u[l] ? u[l] += a : u[++l] = a), (n = n[0]) === (i = i[0]) ? u[l] ? u[l] += i : u[++l] = i : (u[++l] = null, c.push({ i: l, x: Md(n, i) })), r = g0.lastIndex;
  return r < e.length && (a = e.slice(r), u[l] ? u[l] += a : u[++l] = a), u.length < 2 ? c[0] ? AO(c[0].x) : RO(e) : (e = c.length, function(f) {
    for (var d = 0, p; d < e; ++d) u[(p = c[d]).i] = p.x(f);
    return u.join("");
  });
}
function Ig(t, e) {
  var r = typeof e, n;
  return e == null || r === "boolean" ? qg(e) : (r === "number" ? Md : r === "string" ? (n = hc(e)) ? (e = n, Fx) : EO : e instanceof hc ? Fx : e instanceof Date ? MO : _O(e) ? kO : Array.isArray(e) ? SO : typeof e.valueOf != "function" && typeof e.toString != "function" || isNaN(e) ? CO : Md)(t, e);
}
function TO(t, e) {
  return t = +t, e = +e, function(r) {
    return Math.round(t * (1 - r) + e * r);
  };
}
function $O(t) {
  return function() {
    return t;
  };
}
function FO(t) {
  return +t;
}
var Nx = [0, 1];
function bs(t) {
  return t;
}
function iv(t, e) {
  return (e -= t = +t) ? function(r) {
    return (r - t) / e;
  } : $O(isNaN(e) ? NaN : 0.5);
}
function NO(t, e) {
  var r;
  return t > e && (r = t, t = e, e = r), function(n) {
    return Math.max(t, Math.min(e, n));
  };
}
function zO(t, e, r) {
  var n = t[0], i = t[1], a = e[0], l = e[1];
  return i < n ? (n = iv(i, n), a = r(l, a)) : (n = iv(n, i), a = r(a, l)), function(u) {
    return a(n(u));
  };
}
function OO(t, e, r) {
  var n = Math.min(t.length, e.length) - 1, i = new Array(n), a = new Array(n), l = -1;
  for (t[n] < t[0] && (t = t.slice().reverse(), e = e.slice().reverse()); ++l < n; )
    i[l] = iv(t[l], t[l + 1]), a[l] = r(e[l], e[l + 1]);
  return function(u) {
    var c = Wz(t, u, 1, n) - 1;
    return a[c](i[c](u));
  };
}
function jg(t, e) {
  return e.domain(t.domain()).range(t.range()).interpolate(t.interpolate()).clamp(t.clamp()).unknown(t.unknown());
}
function Ug() {
  var t = Nx, e = Nx, r = Ig, n, i, a, l = bs, u, c, f;
  function d() {
    var g = Math.min(t.length, e.length);
    return l !== bs && (l = NO(t[0], t[g - 1])), u = g > 2 ? OO : zO, c = f = null, p;
  }
  function p(g) {
    return g == null || isNaN(g = +g) ? a : (c || (c = u(t.map(n), e, r)))(n(l(g)));
  }
  return p.invert = function(g) {
    return l(i((f || (f = u(e, t.map(n), Md)))(g)));
  }, p.domain = function(g) {
    return arguments.length ? (t = Array.from(g, FO), d()) : t.slice();
  }, p.range = function(g) {
    return arguments.length ? (e = Array.from(g), d()) : e.slice();
  }, p.rangeRound = function(g) {
    return e = Array.from(g), r = TO, d();
  }, p.clamp = function(g) {
    return arguments.length ? (l = g ? !0 : bs, d()) : l !== bs;
  }, p.interpolate = function(g) {
    return arguments.length ? (r = g, d()) : r;
  }, p.unknown = function(g) {
    return arguments.length ? (a = g, p) : a;
  }, function(g, m) {
    return n = g, i = m, d();
  };
}
function BO() {
  return Ug()(bs, bs);
}
function DO(t, e, r, n) {
  var i = Zz(t, e, r), a;
  switch (n = cc(n ?? ",f"), n.type) {
    case "s": {
      var l = Math.max(Math.abs(t), Math.abs(e));
      return n.precision == null && !isNaN(a = Pz(i, l)) && (n.precision = a), w3(n, l);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      n.precision == null && !isNaN(a = Lz(i, Math.max(Math.abs(t), Math.abs(e)))) && (n.precision = a - (n.type === "e"));
      break;
    }
    case "f":
    case "%": {
      n.precision == null && !isNaN(a = Dz(i)) && (n.precision = a - (n.type === "%") * 2);
      break;
    }
  }
  return Yi(n);
}
function B3(t) {
  var e = t.domain;
  return t.ticks = function(r) {
    var n = e();
    return rv(n[0], n[n.length - 1], r ?? 10);
  }, t.tickFormat = function(r, n) {
    var i = e();
    return DO(i[0], i[i.length - 1], r ?? 10, n);
  }, t.nice = function(r) {
    r == null && (r = 10);
    var n = e(), i = 0, a = n.length - 1, l = n[i], u = n[a], c, f, d = 10;
    for (u < l && (f = l, l = u, u = f, f = i, i = a, a = f); d-- > 0; ) {
      if (f = nv(l, u, r), f === c)
        return n[i] = l, n[a] = u, e(n);
      if (f > 0)
        l = Math.floor(l / f) * f, u = Math.ceil(u / f) * f;
      else if (f < 0)
        l = Math.ceil(l * f) / f, u = Math.floor(u * f) / f;
      else
        break;
      c = f;
    }
    return t;
  }, t;
}
function Zs() {
  var t = BO();
  return t.copy = function() {
    return jg(t, Zs());
  }, Ac.apply(t, arguments), B3(t);
}
function PO(t, e) {
  t = t.slice();
  var r = 0, n = t.length - 1, i = t[r], a = t[n], l;
  return a < i && (l = r, r = n, n = l, l = i, i = a, a = l), t[r] = e.floor(i), t[n] = e.ceil(a), t;
}
function zx(t) {
  return Math.log(t);
}
function Ox(t) {
  return Math.exp(t);
}
function LO(t) {
  return -Math.log(-t);
}
function qO(t) {
  return -Math.exp(-t);
}
function IO(t) {
  return isFinite(t) ? +("1e" + t) : t < 0 ? 0 : t;
}
function jO(t) {
  return t === 10 ? IO : t === Math.E ? Math.exp : (e) => Math.pow(t, e);
}
function UO(t) {
  return t === Math.E ? Math.log : t === 10 && Math.log10 || t === 2 && Math.log2 || (t = Math.log(t), (e) => Math.log(e) / t);
}
function Bx(t) {
  return (e, r) => -t(-e, r);
}
function WO(t) {
  const e = t(zx, Ox), r = e.domain;
  let n = 10, i, a;
  function l() {
    return i = UO(n), a = jO(n), r()[0] < 0 ? (i = Bx(i), a = Bx(a), t(LO, qO)) : t(zx, Ox), e;
  }
  return e.base = function(u) {
    return arguments.length ? (n = +u, l()) : n;
  }, e.domain = function(u) {
    return arguments.length ? (r(u), l()) : r();
  }, e.ticks = (u) => {
    const c = r();
    let f = c[0], d = c[c.length - 1];
    const p = d < f;
    p && ([f, d] = [d, f]);
    let g = i(f), m = i(d), y, w;
    const x = u == null ? 10 : +u;
    let k = [];
    if (!(n % 1) && m - g < x) {
      if (g = Math.floor(g), m = Math.ceil(m), f > 0) {
        for (; g <= m; ++g)
          for (y = 1; y < n; ++y)
            if (w = g < 0 ? y / a(-g) : y * a(g), !(w < f)) {
              if (w > d) break;
              k.push(w);
            }
      } else for (; g <= m; ++g)
        for (y = n - 1; y >= 1; --y)
          if (w = g > 0 ? y / a(-g) : y * a(g), !(w < f)) {
            if (w > d) break;
            k.push(w);
          }
      k.length * 2 < x && (k = rv(f, d, x));
    } else
      k = rv(g, m, Math.min(m - g, x)).map(a);
    return p ? k.reverse() : k;
  }, e.tickFormat = (u, c) => {
    if (u == null && (u = 10), c == null && (c = n === 10 ? "s" : ","), typeof c != "function" && (!(n % 1) && (c = cc(c)).precision == null && (c.trim = !0), c = Yi(c)), u === 1 / 0) return c;
    const f = Math.max(1, n * u / e.ticks().length);
    return (d) => {
      let p = d / a(Math.round(i(d)));
      return p * n < n - 0.5 && (p *= n), p <= f ? c(d) : "";
    };
  }, e.nice = () => r(PO(r(), {
    floor: (u) => a(Math.floor(i(u))),
    ceil: (u) => a(Math.ceil(i(u)))
  })), e;
}
function vc() {
  const t = WO(Ug()).domain([1, 10]);
  return t.copy = () => jg(t, vc()).base(t.base()), Ac.apply(t, arguments), t;
}
function Dx(t) {
  return function(e) {
    return Math.sign(e) * Math.log1p(Math.abs(e / t));
  };
}
function Px(t) {
  return function(e) {
    return Math.sign(e) * Math.expm1(Math.abs(e)) * t;
  };
}
function HO(t) {
  var e = 1, r = t(Dx(e), Px(e));
  return r.constant = function(n) {
    return arguments.length ? t(Dx(e = +n), Px(e)) : e;
  }, B3(r);
}
function D3() {
  var t = HO(Ug());
  return t.copy = function() {
    return jg(t, D3()).constant(t.constant());
  }, Ac.apply(t, arguments);
}
function Qs(t) {
  for (var e = t.length / 6 | 0, r = new Array(e), n = 0; n < e; ) r[n] = "#" + t.slice(n * 6, ++n * 6);
  return r;
}
const P3 = (t) => wO(t[t.length - 1]);
var VO = new Array(3).concat(
  "ece2f0a6bddb1c9099",
  "f6eff7bdc9e167a9cf02818a",
  "f6eff7bdc9e167a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf1c9099016c59",
  "f6eff7d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016450",
  "fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636"
).map(Qs);
const GO = P3(VO);
var XO = new Array(3).concat(
  "edf8b17fcdbb2c7fb8",
  "ffffcca1dab441b6c4225ea8",
  "ffffcca1dab441b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
  "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
  "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
).map(Qs);
const YO = P3(XO);
function KO(t) {
  return t = Math.max(0, Math.min(1, t)), "rgb(" + Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05))))))) + ", " + Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56))))))) + ", " + Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66))))))) + ")";
}
function oh(t) {
  var e = t.length;
  return function(r) {
    return t[Math.max(0, Math.min(e - 1, Math.floor(r * e)))];
  };
}
oh(Qs("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
oh(Qs("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
var L3 = oh(Qs("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
oh(Qs("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));
function q3(t) {
  let e = [];
  for (let r = 0; r < t; r++)
    e.push(KO((r + 0.5) / t));
  return e;
}
const I3 = "system-ui", av = 11, ZO = 80;
let Ru;
function QO() {
  return Ru == null && (Ru = document.createElement("canvas"), Ru.width = 1, Ru.height = 1), Ru.getContext("2d");
}
function lv(t) {
  let e = QO();
  e.font = `${av}px ${I3}`;
  let r = e.measureText(t);
  return {
    width: Math.min(ZO, r.width),
    height: av
  };
}
function j3(t, e, r = 0) {
  let n = 0, i = 0;
  for (let a of t) {
    let { width: l, height: u } = a.size;
    n = Math.max(n, l), i = Math.max(i, u);
  }
  switch (e) {
    case "x":
      return { left: n / 2, right: n / 2, top: 0, bottom: i + r };
    case "y":
      return { left: n + r, right: 0, top: i / 2, bottom: i / 2 };
  }
}
function Lx(t, e, r) {
  switch (t.type) {
    case "band":
      return JO(t, e, r);
    default:
      return eB(t, e, r);
  }
}
function JO(t, e, r) {
  let n = [...t.domain, ...t.specialValues ?? []];
  n = Array.from(new Set(n)), r == "y" && (n = n.reverse());
  let i = S3().domain(n).padding(0.1), a = [], l = [], u = { left: 0, right: 0, top: 0, bottom: 0 };
  if (e) {
    let c = e.values ?? i.domain(), f = e.labelPadding ?? 6;
    a = c.map((d) => {
      let { width: p, height: g } = lv(d);
      return r == "y" ? {
        text: d,
        value: d,
        padding: f,
        level: 0,
        size: { width: p, height: g },
        orientation: "horizontal"
      } : {
        text: d,
        value: d,
        padding: f,
        level: 0,
        size: { width: g, height: p },
        orientation: "vertical"
      };
    }), l = c.map((d) => ({ value: d, level: 0 })), u = Wg([u, j3(a, r, f)]);
  }
  return {
    extents: u,
    labels: a,
    gridLines: [],
    ticks: l,
    concrete: (c) => rB(i, t.domain, t.specialValues ?? [], c)
  };
}
function eB(t, e, r) {
  let n;
  switch (t.type) {
    case "linear": {
      n = Zs().domain(t.domain);
      break;
    }
    case "log": {
      n = vc().domain(t.domain);
      break;
    }
    case "symlog": {
      let u = t.constant ?? 1;
      n = D3().constant(u).domain(t.domain), n.nice = () => n, n.ticks = (c) => nB(n.domain(), u, c), n.tickFormat = () => Yi("~s");
      break;
    }
    default:
      throw new Error("invalid scale type");
  }
  let i = [], a = [], l = { left: 0, right: 0, top: 0, bottom: 0 };
  if (e) {
    let u = [];
    if (e.extendScaleToTicks ?? !0)
      if (e.values) {
        u = e.values;
        let p = n.domain().concat(u);
        n = n.domain([
          p.reduce((g, m) => Math.min(g, m), p[0]),
          p.reduce((g, m) => Math.max(g, m), p[0])
        ]);
      } else {
        let p = e.desiredTickCount ?? 5;
        n.nice && (n = n.nice(p)), u = n.ticks(p);
      }
    else {
      if (e.values)
        u = e.values;
      else {
        let m = e.desiredTickCount ?? 5;
        u = n.ticks(m);
      }
      let [p, g] = n.domain();
      u = u.filter((m) => m >= p && m <= g);
    }
    let c = e.labelPadding ?? 6, f = n.tickFormat(e.values ? e.values.length : e.desiredTickCount ?? 5), d = (p) => t.type == "log" || t.type == "symlog" ? Math.round(Math.log10(Math.abs(p))) == Math.log10(Math.abs(p)) ? 0 : 1 : 0;
    i = u.map((p) => {
      let g = f(p);
      return {
        text: g,
        value: p,
        padding: c,
        level: d(p),
        size: lv(g),
        orientation: "horizontal"
      };
    });
    for (let p of t.specialValues ?? [])
      i.push({
        text: p,
        value: p,
        padding: c,
        level: 0,
        size: lv(p),
        orientation: "horizontal"
      });
    a = u.map((p) => ({ value: p, level: d(p) })), l = Wg([l, j3(i, r, c)]);
  }
  return {
    extents: l,
    labels: i,
    gridLines: a,
    ticks: a,
    concrete: (u) => tB(n, t.specialValues ?? [], u)
  };
}
function Wg(t) {
  let e = { left: 0, right: 0, top: 0, bottom: 0 };
  for (let r of t)
    e.left = Math.max(e.left, r.left), e.right = Math.max(e.right, r.right), e.top = Math.max(e.top, r.top), e.bottom = Math.max(e.bottom, r.bottom);
  return e;
}
function qx(t, e, r = {}) {
  let n = r.gap ?? 0, i = t.map((u, c) => ({ ...e(u), index: c })).sort((u, c) => u.priority - c.priority), a = t.map((u) => !1), l = (u, c) => Math.abs(u.center - c.center) < n + u.length / 2 + c.length / 2;
  for (let u = 0; u < i.length; u++) {
    let c = !1;
    for (let f = 0; f < u; f++)
      if (a[i[f].index] && l(i[u], i[f])) {
        c = !0;
        break;
      }
    a[i[u].index] = !c;
  }
  return t.filter((u, c) => a[c]);
}
function tB(t, e, r) {
  e = Array.from(new Set(e));
  let n = r[0], i = r[1], a = /* @__PURE__ */ new Map(), l;
  if (e.length > 0) {
    let c = 22, f = 8, d = 20, p = e.length * d, g = 2, m = n;
    n < i ? (n = n + p + c, l = [m, m + p + c - f]) : (n = n - p - c, m = n + c, l = [m - c + f, m + p]);
    for (let y = 0; y < e.length; y++)
      a.set(e[y], [m + y * d + g, m + y * d + d - g]);
  }
  let u = t.copy().range([n, i]);
  return {
    domain: t.domain(),
    specialValues: e ?? [],
    range: [n, i],
    rangeBands: [[n, i], ...l ? [l] : []],
    apply: (c) => {
      let f = a.get(c);
      return f != null ? (f[0] + f[1]) / 2 : u(c);
    },
    applyBand: (c) => {
      let f = a.get(c);
      if (f != null)
        return f;
      if (typeof c != "number")
        return [u(c[0]), u(c[1])];
      {
        let d = u(c);
        return [d, d];
      }
    },
    invert: (c, f) => {
      if (f != "number") {
        for (let [d, p] of a.entries())
          if (c >= Math.min(...p) && c <= Math.max(...p))
            return d;
      }
      return u.invert(c);
    }
  };
}
function rB(t, e, r, n) {
  let i = n[0], a = n[1], l = t.copy().range(n), u = l.bandwidth(), c = l.step();
  return {
    domain: e,
    specialValues: r,
    range: [i, a],
    rangeBands: [[i, a]],
    apply: (f) => (l(f) ?? 0) + u / 2,
    applyBand: (f) => {
      let d = l(f) ?? 0;
      return [d, d + u];
    },
    invert: (f) => {
      let d = (f - i) / (a - i), p = Math.floor(d * Math.abs(a - i) / c);
      return t.domain()[p];
    }
  };
}
function nB(t, e, r) {
  r = r ?? 5;
  let n = t[0], i = t[1];
  if (n > 0 && i > 0 && n / i > 0.5 || n < 0 && i < 0 && i / n > 0.5)
    return Zs().domain([n, i]).ticks(r);
  let a = e * 2, l = e * 5;
  return n < -l && i > l && (r = Math.ceil(r / 2)), [
    ...n < -l ? vc().domain([a, -n]).ticks(r).map((u) => -u) : [],
    0,
    ...i > l ? vc().domain([a, i]).ticks(r) : []
  ].filter((u) => u >= n && u <= i);
}
function oB(t, e) {
  let { min: r, max: n, median: i, count: a, minPositive: l } = t, u = {
    type: "linear",
    domain: [r, n]
  };
  return e == null ? a >= 100 && r >= 0 && i < n * 0.05 && (u.type = r > 0 ? "log" : "symlog") : u.type = e, u.type == "log" && (u.domain[0] = l), u;
}
function iB(t, e = {}) {
  let r = e.fade ?? [], n = e.ordinal ?? !1, i = [], a = (c) => JSON.stringify(c);
  for (let c of t) {
    let f = a(c);
    typeof c == "string" && r.indexOf(c) >= 0 || i.push(f);
  }
  let l = n ? q3(i.length) : Gs(i.length), u = new Map(i.map((c, f) => [c, l[f]]));
  return {
    domain: t,
    apply: (c) => {
      let f = a(c);
      return u.get(f) ?? "#888888";
    }
  };
}
var aB = /* @__PURE__ */ bt("<g><foreignObject><div> </div></foreignObject></g>");
function Ix(t, e) {
  gt(e, !0);
  let r = /* @__PURE__ */ oe(() => e.dimension == "x" ? {
    px: e.proxy.xScale?.apply(e.label.value) ?? 0,
    py: e.proxy.plotHeight + e.label.padding,
    anchorX: 0.5,
    anchorY: 0
  } : {
    px: -e.label.padding,
    py: e.proxy.yScale?.apply(e.label.value) ?? 0,
    anchorX: 1,
    anchorY: 0.5
  }), n = /* @__PURE__ */ oe(() => h(r).px), i = /* @__PURE__ */ oe(() => h(r).py), a = /* @__PURE__ */ oe(() => h(r).anchorX), l = /* @__PURE__ */ oe(() => h(r).anchorY), u = /* @__PURE__ */ oe(() => e.label.orientation == "vertical" ? {
    rotation: 90,
    shiftX: h(a) * e.label.size.width,
    shiftY: -h(l) * e.label.size.height,
    width: e.label.size.height,
    height: e.label.size.width
  } : {
    rotation: 0,
    shiftX: -h(a) * e.label.size.width,
    shiftY: -h(l) * e.label.size.height,
    width: e.label.size.width,
    height: e.label.size.height
  }), c = /* @__PURE__ */ oe(() => h(u).rotation), f = /* @__PURE__ */ oe(() => h(u).shiftX), d = /* @__PURE__ */ oe(() => h(u).shiftY), p = /* @__PURE__ */ oe(() => h(u).width), g = /* @__PURE__ */ oe(() => h(u).height), m = 4, y = 4;
  var w = aB(), x = ne(w);
  J(x, "x", -m), J(x, "y", -y);
  var k = ne(x);
  let S;
  var _ = ne(k, !0);
  ee(k), ee(x), ee(w), Ee(
    (E) => {
      J(w, "transform", `translate(${h(n) + h(f)}, ${h(i) + h(d)}) rotate(${h(c) ?? ""})`), J(x, "width", h(p) + m * 2), J(x, "height", h(g) + y * 2), J(k, "title", e.label.text), S = tt(k, "", S, E), rt(_, e.label.text);
    },
    [
      () => ({
        width: `${h(p) + 2}px`,
        height: `${h(g) + y * 2}px`,
        "line-height": `${h(g) + y * 2}px`,
        "font-family": I3,
        "font-size": `${av}px`,
        "margin-left": "4px",
        color: e.color,
        overflow: "hidden",
        "white-space": "nowrap",
        "text-overflow": "ellipsis"
      })
    ]
  ), te(t, w), mt();
}
function Of(t, e = 0) {
  let r = N3(t);
  return r.l += e, r.a = 0, r.b = 0, r.rgb().formatHex8();
}
const sn = {
  light: {
    scheme: "light",
    continuousColorScheme: "YlGnBu",
    continuousColorSchemeAtZero: YO(0),
    markColor: "#3b82f6",
    markColorFade: "#dbeafe",
    markColorGray: Of("#3b82f6", 20),
    markColorGrayFade: Of("#dbeafe"),
    gridColor: Fo.slate[300],
    labelColor: Fo.slate[400],
    titleColor: Fo.slate[400],
    brushBorder: Fo.slate[500],
    brushBorderBack: "#fff",
    brushFill: "rgba(0,0,0,0.1)"
  },
  dark: {
    scheme: "dark",
    continuousColorScheme: "Inferno",
    continuousColorSchemeAtZero: L3(0),
    markColor: "#3b82f6",
    markColorFade: "#3b4d7f",
    markColorGray: Of("#3b82f6", -20),
    markColorGrayFade: Of("#1f398a"),
    gridColor: Fo.slate[600],
    labelColor: Fo.slate[500],
    titleColor: Fo.slate[500],
    brushBorder: Fo.slate[400],
    brushBorderBack: "#000",
    brushFill: "rgba(255,255,255,0.1)"
  }
};
var lB = /* @__PURE__ */ bt('<line stroke-linecap="butt"></line>'), sB = /* @__PURE__ */ bt('<line stroke-dasharray="1,3" stroke-linecap="square"></line>'), uB = /* @__PURE__ */ bt("<g><!><!><!></g>"), cB = /* @__PURE__ */ bt('<line stroke-linecap="butt"></line>'), fB = /* @__PURE__ */ bt('<line stroke-linecap="square"></line>'), dB = /* @__PURE__ */ bt("<g><!><!><!></g>"), hB = /* @__PURE__ */ Se("<div><svg><g><!><!><!><!></g></svg></div>");
function gc(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(l, "$darkMode", r), a = 4, l = yr.darkMode;
  let u = Je(e, "xAxis", 19, () => ({})), c = Je(e, "yAxis", 19, () => ({})), f = /* @__PURE__ */ oe(() => e.xScale ? Lx(e.xScale, u(), "x") : null), d = /* @__PURE__ */ oe(() => e.yScale ? Lx(e.yScale, c(), "y") : null), p = /* @__PURE__ */ oe(() => Wg([
    h(f)?.extents,
    h(d)?.extents,
    e.extents
  ].filter((q) => q != null))), g = /* @__PURE__ */ oe(() => ({
    x: h(p).left,
    y: h(p).top,
    width: e.width - h(p).left - h(p).right,
    height: e.height - h(p).top - h(p).bottom
  })), m = /* @__PURE__ */ oe(() => h(f)?.concrete([0, h(g).width])), y = /* @__PURE__ */ oe(() => h(d)?.concrete([h(g).height, 0])), w = /* @__PURE__ */ oe(() => h(f) && h(m) ? qx(
    h(f).labels,
    (q) => ({
      center: h(m).apply(q.value),
      length: q.size.width,
      priority: q.level
    }),
    { gap: 4 }
  ) : []), x = /* @__PURE__ */ oe(() => h(d) && h(y) ? qx(
    h(d).labels,
    (q) => ({
      center: h(y).apply(q.value),
      length: q.size.height,
      priority: q.level
    }),
    { gap: 2 }
  ) : []), k = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light), S = /* @__PURE__ */ oe(() => ({
    xScale: h(m),
    yScale: h(y),
    plotWidth: h(g).width,
    plotHeight: h(g).height
  }));
  var _ = hB();
  let E;
  var C = ne(_);
  tt(C, "", {}, { position: "absolute", left: "-4px", top: "-4px" });
  var R = ne(C), A = ne(R);
  Gu(A, () => e.childrenBelow ?? Ft, () => h(S));
  var N = le(A);
  {
    var L = (q) => {
      var H = uB(), X = ne(H);
      Gt(X, 17, () => h(f).ticks, or, (Z, Y) => {
        var I = lB();
        const K = /* @__PURE__ */ oe(() => h(m).apply(h(Y).value));
        Ee(() => {
          J(I, "x1", h(K)), J(I, "y1", h(g).height), J(I, "x2", h(K)), J(I, "y2", h(g).height + (h(Y).level == 0 ? 3 : 0)), J(I, "stroke", h(k).gridColor), J(I, "stroke-opacity", h(Y).level == 0 ? 1 : 0.4);
        }), te(Z, I);
      });
      var V = le(X);
      Gt(V, 17, () => h(f).gridLines, or, (Z, Y) => {
        var I = fr();
        const K = /* @__PURE__ */ oe(() => h(m).apply(h(Y).value));
        var ie = We(I);
        Gt(ie, 17, () => h(y)?.rangeBands ?? [], or, (se, ye) => {
          var _e = /* @__PURE__ */ oe(() => M1(h(ye), 2));
          let be = () => h(_e)[0], ue = () => h(_e)[1];
          var Ae = sB();
          Ee(
            (ze, Me) => {
              J(Ae, "x1", h(K)), J(Ae, "y1", ze), J(Ae, "x2", h(K)), J(Ae, "y2", Me), J(Ae, "stroke", h(k).gridColor), J(Ae, "stroke-opacity", h(Y).level == 0 ? 1 : 0.4);
            },
            [() => Math.min(be(), ue()), () => Math.max(be(), ue())]
          ), te(se, Ae);
        }), te(Z, I);
      });
      var G = le(V);
      Gt(G, 17, () => h(w), or, (Z, Y) => {
        Ix(Z, {
          get label() {
            return h(Y);
          },
          dimension: "x",
          get proxy() {
            return h(S);
          },
          get color() {
            return h(k).labelColor;
          }
        });
      }), ee(H), te(q, H);
    };
    Te(N, (q) => {
      h(f) && h(m) && u() && q(L);
    });
  }
  var j = le(N);
  {
    var B = (q) => {
      var H = dB(), X = ne(H);
      Gt(X, 17, () => h(d).ticks, or, (Z, Y) => {
        var I = cB();
        const K = /* @__PURE__ */ oe(() => h(y).apply(h(Y).value));
        J(I, "x2", 0), Ee(() => {
          J(I, "x1", -(h(Y).level == 0 ? 3 : 0)), J(I, "y1", h(K)), J(I, "y2", h(K)), J(I, "stroke", h(k).gridColor), J(I, "stroke-opacity", h(Y).level == 0 ? 1 : 0.4);
        }), te(Z, I);
      });
      var V = le(X);
      Gt(V, 17, () => h(d).gridLines, or, (Z, Y) => {
        var I = fr();
        const K = /* @__PURE__ */ oe(() => h(y).apply(h(Y).value));
        var ie = We(I);
        Gt(ie, 17, () => h(m)?.rangeBands ?? [], or, (se, ye) => {
          var _e = /* @__PURE__ */ oe(() => M1(h(ye), 2));
          let be = () => h(_e)[0], ue = () => h(_e)[1];
          var Ae = fB();
          Ee(() => {
            J(Ae, "x1", be()), J(Ae, "y1", h(K)), J(Ae, "x2", ue()), J(Ae, "y2", h(K)), J(Ae, "stroke", h(k).gridColor), J(Ae, "stroke-opacity", h(Y).level == 0 ? 1 : 0.4);
          }), te(se, Ae);
        }), te(Z, I);
      });
      var G = le(V);
      Gt(G, 17, () => h(x), or, (Z, Y) => {
        Ix(Z, {
          get label() {
            return h(Y);
          },
          dimension: "y",
          get proxy() {
            return h(S);
          },
          get color() {
            return h(k).labelColor;
          }
        });
      }), ee(H), te(q, H);
    };
    Te(j, (q) => {
      h(d) && h(y) && c() && q(B);
    });
  }
  var P = le(j);
  Gu(P, () => e.children ?? Ft, () => h(S)), ee(R), ee(C), ee(_), Ee(
    (q) => {
      E = tt(_, "", E, q), J(C, "width", e.width + a * 2), J(C, "height", e.height + a * 2), J(R, "transform", `translate(${a + h(g).x},${a + h(g).y})`);
    },
    [
      () => ({
        width: `${e.width ?? ""}py`,
        height: `${e.height ?? ""}px`,
        position: "relative",
        "user-select": "none",
        "-webkit-user-select": "none",
        cursor: "default"
      })
    ]
  ), te(t, _), mt(), n();
}
var pB = /* @__PURE__ */ bt('<rect role="none"></rect><rect role="none"></rect>', 1), vB = /* @__PURE__ */ bt('<rect role="none"></rect><rect role="none"></rect>', 1), gB = /* @__PURE__ */ bt('<rect role="none"></rect><rect role="none"></rect><rect role="none"></rect><rect role="none"></rect>', 1), mB = /* @__PURE__ */ bt('<rect></rect><rect role="none"></rect><!><!><!>', 1), yB = /* @__PURE__ */ bt('<g><rect stroke="none" fill="none" pointer-events="fill" role="none"></rect><!></g>');
function ih(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(l, "$darkMode", r), a = 8, l = yr.darkMode;
  let u = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light), c, f = /* @__PURE__ */ oe(() => e.proxy.xScale != null && e.value?.x != null ? e.proxy.xScale.applyBand(e.value.x) : [0, e.proxy.plotWidth]), d = /* @__PURE__ */ oe(() => e.proxy.yScale != null && e.value?.y != null ? e.proxy.yScale.applyBand(e.value.y) : [0, e.proxy.plotHeight]);
  function p(C) {
    return C instanceof Array && C.length == 2 && typeof C[0] == "number" && typeof C[1] == "number";
  }
  function g(C, R, A) {
    let N = C.invert(R, A);
    if (C.domain.length == 2 && typeof C.domain[0] == "number" && typeof N == "number") {
      let [L, j] = C.domain;
      return Math.max(Math.min(L, j), Math.min(Math.max(L, j), N));
    }
    return N;
  }
  function m(C, R) {
    return (R == "x" || R == "xy") && C.x == null ? !1 : !((R == "y" || R == "xy") && C.y == null);
  }
  function y() {
    return (C) => {
      C.preventDefault();
      let R = c.getBoundingClientRect().left, A = c.getBoundingClientRect().top, N = C.clientX - R, L = C.clientY - A, j = e.proxy.xScale ? g(e.proxy.xScale, N) : null, B = e.proxy.yScale ? g(e.proxy.yScale, L) : null;
      if (j == null && (e.mode == "x" || e.mode == "xy") || B == null && (e.mode == "y" || e.mode == "xy"))
        return;
      let P = (V, G) => typeof V == "number" && typeof G == "number" ? V != G ? [Math.min(V, G), Math.max(V, G)] : null : G, q = (V) => {
        let G = V.clientX - R, Z = V.clientY - A, Y = e.proxy.xScale ? g(e.proxy.xScale, G, typeof j == "number" ? "number" : void 0) : null, I = e.proxy.yScale ? g(e.proxy.yScale, Z, typeof B == "number" ? "number" : void 0) : null, K = {};
        return (e.mode == "x" || e.mode == "xy") && (K.x = P(j, Y)), (e.mode == "y" || e.mode == "xy") && (K.y = P(B, I)), m(K, e.mode) ? K : null;
      }, H = (V) => {
        V.preventDefault(), e.onChange(q(V));
      }, X = (V) => {
        e.onChange(q(V)), window.removeEventListener("mousemove", H), window.removeEventListener("mouseup", X);
      };
      window.addEventListener("mousemove", H), window.addEventListener("mouseup", X);
    };
  }
  function w(C) {
    return (R) => {
      if (e.value == null)
        return;
      let A = { ...e.value };
      R.preventDefault();
      let { xScale: N, yScale: L } = e.proxy, j = p(A.x), B = p(A.y), P = [
        ...N && A.x ? N.applyBand(A.x) : [0, 0],
        ...L && A.y ? L.applyBand(A.y) : [0, 0]
      ];
      if (!j) {
        let V = Math.max(C[0], C[1]);
        C = [V, V, C[2], C[3]];
      }
      if (!B) {
        let V = Math.max(C[2], C[3]);
        C = [C[0], C[1], V, V];
      }
      let q = (V) => {
        let G = V.pageX - R.pageX, Z = V.pageY - R.pageY, Y = [G, G, Z, Z].map((K, ie) => P[ie] + K * C[ie]), I = { ...A };
        if (N && (e.mode == "x" || e.mode == "xy"))
          if (j) {
            let K = g(N, Y[0], "number"), ie = g(N, Y[1], "number");
            I.x = K == ie ? null : K < ie ? [K, ie] : [ie, K];
          } else
            I.x = g(N, (Y[0] + Y[1]) / 2), typeof I.x != "string" && (I.x = null);
        if (L != null && (e.mode == "y" || e.mode == "xy"))
          if (B) {
            let K = g(L, Y[2], "number"), ie = g(L, Y[3], "number");
            I.y = K == ie ? null : K < ie ? [K, ie] : [ie, K];
          } else
            I.y = g(L, (Y[2] + Y[3]) / 2), typeof I.y != "string" && (I.y = null);
        return m(I, e.mode) || (I = null), I;
      }, H = (V) => {
        V.preventDefault(), e.onChange(q(V));
      }, X = (V) => {
        let G = q(V);
        G && !j && !B && G.x == A.x && G.y == A.y && (G = null), e.onChange(G), window.removeEventListener("mousemove", H), window.removeEventListener("mouseup", X);
      };
      window.addEventListener("mousemove", H), window.addEventListener("mouseup", X);
    };
  }
  var x = yB(), k = ne(x);
  J(k, "x", 0), J(k, "y", 0);
  var S = /* @__PURE__ */ oe(y);
  k.__mousedown = function(...C) {
    h(S)?.apply(this, C);
  }, tt(k, "", {}, { cursor: "crosshair" }), Wo(k, (C) => c = C, () => c);
  var _ = le(k);
  {
    var E = (C) => {
      var R = mB(), A = We(R);
      let N;
      var L = le(A), j = /* @__PURE__ */ oe(() => w([1, 1, 1, 1]));
      L.__mousedown = function(...Z) {
        h(j)?.apply(this, Z);
      };
      let B;
      var P = le(L);
      {
        var q = (Z) => {
          var Y = pB(), I = We(Y);
          J(I, "width", a);
          var K = /* @__PURE__ */ oe(() => w([1, 0, 0, 0]));
          I.__mousedown = function(...ye) {
            h(K)?.apply(this, ye);
          }, tt(I, "", {}, {
            cursor: "ew-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var ie = le(I);
          J(ie, "width", a);
          var se = /* @__PURE__ */ oe(() => w([0, 1, 0, 0]));
          ie.__mousedown = function(...ye) {
            h(se)?.apply(this, ye);
          }, tt(ie, "", {}, {
            cursor: "ew-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          }), Ee(
            (ye, _e, be, ue) => {
              J(I, "x", h(f)[0] - a / 2), J(I, "y", ye), J(I, "height", _e), J(ie, "x", h(f)[1] - a / 2), J(ie, "y", be), J(ie, "height", ue);
            },
            [
              () => Math.min(h(d)[0], h(d)[1]),
              () => Math.abs(h(d)[0] - h(d)[1]),
              () => Math.min(h(d)[0], h(d)[1]),
              () => Math.abs(h(d)[0] - h(d)[1])
            ]
          ), te(Z, Y);
        };
        Te(P, (Z) => {
          (e.mode == "x" || e.mode == "xy") && p(e.value.x) && Z(q);
        });
      }
      var H = le(P);
      {
        var X = (Z) => {
          var Y = vB(), I = We(Y);
          J(I, "height", a);
          var K = /* @__PURE__ */ oe(() => w([0, 0, 1, 0]));
          I.__mousedown = function(...ye) {
            h(K)?.apply(this, ye);
          }, tt(I, "", {}, {
            cursor: "ns-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var ie = le(I);
          J(ie, "height", a);
          var se = /* @__PURE__ */ oe(() => w([0, 0, 0, 1]));
          ie.__mousedown = function(...ye) {
            h(se)?.apply(this, ye);
          }, tt(ie, "", {}, {
            cursor: "ns-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          }), Ee(
            (ye, _e, be, ue) => {
              J(I, "x", ye), J(I, "width", _e), J(I, "y", h(d)[0] - a / 2), J(ie, "x", be), J(ie, "width", ue), J(ie, "y", h(d)[1] - a / 2);
            },
            [
              () => Math.min(h(f)[0], h(f)[1]),
              () => Math.abs(h(f)[0] - h(f)[1]),
              () => Math.min(h(f)[0], h(f)[1]),
              () => Math.abs(h(f)[0] - h(f)[1])
            ]
          ), te(Z, Y);
        };
        Te(H, (Z) => {
          (e.mode == "y" || e.mode == "xy") && p(e.value.y) && Z(X);
        });
      }
      var V = le(H);
      {
        var G = (Z) => {
          var Y = gB(), I = We(Y);
          J(I, "width", a), J(I, "height", a);
          var K = /* @__PURE__ */ oe(() => w([1, 0, 1, 0]));
          I.__mousedown = function(...Ae) {
            h(K)?.apply(this, Ae);
          }, tt(I, "", {}, {
            cursor: "nesw-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var ie = le(I);
          J(ie, "width", a), J(ie, "height", a);
          var se = /* @__PURE__ */ oe(() => w([1, 0, 0, 1]));
          ie.__mousedown = function(...Ae) {
            h(se)?.apply(this, Ae);
          }, tt(ie, "", {}, {
            cursor: "nwse-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var ye = le(ie);
          J(ye, "width", a), J(ye, "height", a);
          var _e = /* @__PURE__ */ oe(() => w([0, 1, 1, 0]));
          ye.__mousedown = function(...Ae) {
            h(_e)?.apply(this, Ae);
          }, tt(ye, "", {}, {
            cursor: "nwse-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          });
          var be = le(ye);
          J(be, "width", a), J(be, "height", a);
          var ue = /* @__PURE__ */ oe(() => w([0, 1, 0, 1]));
          be.__mousedown = function(...Ae) {
            h(ue)?.apply(this, Ae);
          }, tt(be, "", {}, {
            cursor: "nesw-resize",
            stroke: "none",
            fill: "none",
            "pointer-events": "all"
          }), Ee(() => {
            J(I, "x", h(f)[0] - a / 2), J(I, "y", h(d)[0] - a / 2), J(ie, "x", h(f)[0] - a / 2), J(ie, "y", h(d)[1] - a / 2), J(ye, "x", h(f)[1] - a / 2), J(ye, "y", h(d)[0] - a / 2), J(be, "x", h(f)[1] - a / 2), J(be, "y", h(d)[1] - a / 2);
          }), te(Z, Y);
        };
        Te(V, (Z) => {
          e.mode == "xy" && p(e.value.x) && p(e.value.y) && Z(G);
        });
      }
      Ee(
        (Z, Y, I, K, ie, se, ye, _e, be, ue) => {
          J(A, "x", Z), J(A, "width", Y), J(A, "y", I), J(A, "height", K), N = tt(A, "", N, ie), J(L, "x", se), J(L, "width", ye), J(L, "y", _e), J(L, "height", be), B = tt(L, "", B, ue);
        },
        [
          () => Math.min(h(f)[0], h(f)[1]),
          () => Math.abs(h(f)[0] - h(f)[1]),
          () => Math.min(h(d)[0], h(d)[1]),
          () => Math.abs(h(d)[0] - h(d)[1]),
          () => ({
            stroke: h(u).brushBorderBack,
            fill: "none",
            "stroke-width": 2
          }),
          () => Math.min(h(f)[0], h(f)[1]),
          () => Math.abs(h(f)[0] - h(f)[1]),
          () => Math.min(h(d)[0], h(d)[1]),
          () => Math.abs(h(d)[0] - h(d)[1]),
          () => ({
            stroke: h(u).brushBorder,
            fill: h(u).brushFill,
            cursor: "move"
          })
        ]
      ), te(C, R);
    };
    Te(_, (C) => {
      h(f) && h(d) && e.value && C(E);
    });
  }
  ee(x), Ee(() => {
    J(k, "width", e.proxy.plotWidth), J(k, "height", e.proxy.plotHeight);
  }), te(t, x), mt(), n();
}
Tr(["mousedown"]);
var bB = /* @__PURE__ */ Se("<option> </option>"), xB = /* @__PURE__ */ Se('<select class="form-select text-center pl-[4px] pr-[16px] py-0 my-0 border-0 rounded text-sm! text-slate-500 bg-white/90 dark:text-slate-400 dark:bg-black/25"></select>');
function ah(t, e) {
  gt(e, !0);
  let r;
  const n = Pg(), i = n + "_null", a = n + "_undefined", l = (g) => g === null ? i : g === void 0 ? a : g.toString(), u = (g) => g === i ? null : g === a ? void 0 : g, c = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 20">
    <path d="M 2,8 L 5,12 L 8,8" style="stroke:${Fo.gray[500]};stroke-opacity:0.7;stroke-width:1.5;fill:none;stroke-linecap:round;stroke-linejoin:round" />
  </svg>`;
  var f = xB();
  f.__change = () => {
    e.onChange(u(r.value));
  };
  let d;
  Gt(f, 21, () => e.options, or, (g, m) => {
    var y = bB(), w = ne(y, !0);
    ee(y);
    var x = {};
    Ee(
      (k) => {
        rt(w, h(m).label), x !== (x = k) && (y.value = (y.__value = k) ?? "");
      },
      [() => l(h(m).value)]
    ), te(g, y);
  }), ee(f), Wo(f, (g) => r = g, () => r);
  var p;
  Jf(f), Ee(
    (g, m) => {
      d = tt(f, "", d, g), p !== (p = m) && (f.value = (f.__value = m) ?? "", Ds(f, m));
    },
    [
      () => ({
        "background-image": `url(data:image/svg+xml;base64,${btoa(c) ?? ""})`,
        "background-position": "right center"
      }),
      () => l(e.value)
    ]
  ), te(t, f), mt();
}
Tr(["change"]);
var wB = /* @__PURE__ */ Se('<span class="flex gap-1 select-none"><span class="text-slate-400 dark:text-slate-500 text-sm"> </span> <!></span>');
function Us(t, e) {
  gt(e, !0);
  let r = Je(e, "value", 15);
  const n = ["linear", "log", "symlog"];
  var i = fr(), a = We(i);
  {
    var l = (u) => {
      var c = wB(), f = ne(c), d = ne(f);
      ee(f);
      var p = le(f, 2);
      {
        let g = /* @__PURE__ */ oe(() => n.map((m) => ({ value: m, label: m })));
        ah(p, {
          get options() {
            return h(g);
          },
          get value() {
            return r();
          },
          onChange: (m) => r(m)
        });
      }
      ee(c), Ee(() => rt(d, `${e.label ?? ""}:`)), te(u, c);
    };
    Te(a, (u) => {
      r() != null && r() != "band" && u(l);
    });
  }
  te(t, i), mt();
}
const Au = {
  linear: { type: "linear", expr: (t) => t, forward: (t) => t, reverse: (t) => t },
  log: {
    type: "log",
    expr: (t) => T.cond(T.gt(t, 0), T.log(t), T.literal("nan")),
    forward: (t) => Math.log10(t),
    reverse: (t) => Math.pow(10, t)
  },
  symlog: {
    type: "symlog",
    expr: (t, e) => T.mul(T.sign(t), T.ln(T.add(1, T.abs(T.div(t, e))))),
    forward: (t, e) => Math.sign(t) * Math.log1p(Math.abs(t) / e),
    reverse: (t, e) => Math.sign(t) * Math.expm1(Math.abs(t)) * e
  }
};
function kB(t, e) {
  let r = t, n = 1 / 0;
  for (let i of e) {
    let a = Math.abs(t - i);
    a < n && (n = a, r = i);
  }
  return r;
}
function U3(t, e = {}) {
  let { min: r, max: n, median: i, count: a } = t, l = e.scale;
  l == "band" && (l = null), l == null && (l = "linear", a >= 100 && r >= 0 && i < n * 0.05 && (l = r > 0 ? "log" : "symlog")), r <= 0 && l == "log" && (n <= 0 ? (r = 1, n = 10) : r = Math.min(t.minPositive, n / 10));
  let u = e.desiredCount ?? 5;
  switch (l) {
    case "linear": {
      let c = Zs().domain([r, n]).nice(u), f = c.ticks(u);
      return {
        scale: { ...Au.linear, domain: c.domain() },
        binStart: c.domain()[0],
        binSize: f[1] - f[0]
      };
    }
    case "log": {
      let c = vc().domain([r, n]).nice(), f = Math.log10(c.domain()[0]), d = (Math.log10(c.domain()[1]) - f) / u;
      return d = kB(d, [0.05, 0.1, 0.2, 0.5, 1, 1.5, 2]), {
        scale: { ...Au.log, domain: c.domain() },
        binStart: f,
        binSize: d
      };
    }
    case "symlog": {
      let c = Math.max(Math.abs(r), Math.abs(n)), f = c >= 100 ? 1 : c > 0 ? c / 1e5 : 1, d = Au.symlog.forward(r, f), p = Au.symlog.forward(n, f);
      return {
        scale: { ...Au.symlog, domain: [r, n], constant: f },
        binStart: d,
        binSize: (p - d) / u
      };
    }
    default:
      throw new Error("invalid scale type");
  }
}
function Qa() {
  return Pg(14);
}
function W3(t) {
  return {
    component: "Histogram",
    props: { field: t.name, binCount: 20 }
  };
}
function Vf(t) {
  return t.type == "discrete[]" ? {
    component: "ListCountPlot",
    props: { field: t.name }
  } : {
    component: "CountPlot",
    props: { field: t.name }
  };
}
function _B(t, e) {
  return {
    component: "HistogramStack",
    props: { xField: t.name, groupField: e.name, xBinCount: 20, groupBinCount: 5 }
  };
}
function SB(t, e) {
  return {
    component: "Histogram2D",
    props: { xField: t.name, yField: e.name, xBinCount: 20, yBinCount: 20 }
  };
}
function MB(t, e) {
  return {
    component: "BoxPlot",
    props: { xField: t.name, yField: e.name, xBinCount: 20 }
  };
}
class H3 {
  table;
  coordinator;
  constructor(e, r) {
    this.table = r, this.coordinator = e;
  }
  async exec(e) {
    await this.coordinator.exec(e);
  }
  async query(e) {
    return (await this.coordinator.query(e)).toArray().map((r) => ({ ...r }));
  }
  async queryOne(e) {
    return { ...(await this.coordinator.query(e)).get(0) };
  }
  async describe() {
    return await this.query(T.sql`DESCRIBE ${this.table}`);
  }
  async distinctCount(e) {
    return (await this.queryOne(T.sql`SELECT COUNT(DISTINCT ${T.column(e)}) AS count FROM ${this.table}`)).count;
  }
  async columnDescriptions() {
    let e = await this.describe(), r = [];
    for (let n of e)
      r.push({
        name: n.column_name,
        type: n.column_type,
        jsType: V3(n.column_type),
        distinctCount: await this.distinctCount(n.column_name)
      });
    return r;
  }
  async defaultViewportScale(e, r) {
    let { stdX: n, stdY: i } = await this.queryOne(
      T.Query.from(this.table).select({
        stdX: T.sql`STDDEV(${T.column(e)})::FLOAT`,
        stdY: T.sql`STDDEV(${T.column(r)})::FLOAT`
      })
    );
    return 1 / (Math.max(n, i, 1e-3) * 3);
  }
  defaultPlots(e) {
    let r = [
      { id: Qa(), title: "Named Selections", spec: { component: "SelectionList", props: {} } }
    ];
    for (let n of e)
      if (n.jsType != null && !(n.distinctCount <= 1))
        switch (n.jsType) {
          case "string":
            n.distinctCount <= 1e3 && r.push({
              id: Qa(),
              title: n.name,
              spec: Vf({ name: n.name, type: "discrete" })
            });
            break;
          case "string[]":
            r.push({
              id: Qa(),
              title: n.name,
              spec: Vf({ name: n.name, type: "discrete[]" })
            });
            break;
          case "number":
            n.distinctCount <= 10 ? r.push({
              id: Qa(),
              title: n.name,
              spec: Vf({ name: n.name, type: "discrete" })
            }) : r.push({
              id: Qa(),
              title: n.name,
              spec: W3({ name: n.name })
            });
            break;
        }
    return r;
  }
  async makeCategoryColumn(e, r) {
    let n = `_ev_${e}_id`, i = Array.from(
      await this.query(
        T.Query.from(this.table).select({ value: T.cast(T.column(e), "TEXT"), count: T.count() }).where(T.not(T.isNull(T.cast(T.column(e), "TEXT")))).groupby(T.cast(T.column(e), "TEXT")).orderby(T.desc(T.count())).limit(r)
      )
    ), a = i.length, l = i.length + 1;
    await this.exec(T.sql`
      ALTER TABLE ${this.table} ADD COLUMN IF NOT EXISTS ${T.column(n)} INTEGER DEFAULT 0;
      UPDATE ${this.table}
      SET ${T.column(n)} = CASE ${T.column(e)}::TEXT
        ${i.map(({ value: m }, y) => T.sql`WHEN ${T.literal(m)} THEN ${T.literal(y)}`).join(" ")}
      ELSE (CASE WHEN ${T.column(e)} IS NULL THEN ${T.literal(l)} ELSE ${T.literal(a)} END) END
    `);
    let u = await this.query(T.sql`
      SELECT ${T.column(n)} AS index, COUNT(*)::INT AS count
      FROM ${this.table}
      GROUP BY ${T.column(n)}
    `), c = /* @__PURE__ */ new Map();
    for (let m of u)
      c.set(m.index, m.count);
    let f = c.get(a) ?? 0, d = c.get(l) ?? 0, p = Gs(i.length), g = i.map(({ value: m }, y) => ({
      label: m,
      color: p[y],
      predicate: T.eq(T.cast(T.column(e), "TEXT"), T.literal(m)),
      count: c.get(y) ?? 0
    }));
    if (f > 0) {
      let { otherCategoryCount: m } = await this.queryOne(T.sql`
        SELECT COUNT(DISTINCT(${T.column(e)}::TEXT)) AS otherCategoryCount
        FROM ${this.table}
        WHERE ${T.column(n)} = ${T.literal(a)} AND ${T.column(e)} IS NOT NULL
      `);
      g.push({
        label: `(other ${m.toLocaleString()})`,
        color: "#9eabc2",
        predicate: i.length > 0 ? T.sql`${T.column(e)} IS NOT NULL AND ${T.column(e)}::TEXT NOT IN (${i.map((y) => T.literal(y.value)).join(",")})` : T.sql`${T.column(e)} IS NOT NULL`,
        count: f
      });
    }
    return d > 0 && (f <= 0 && (await this.exec(`
          UPDATE ${this.table}
          SET ${T.column(n)} = ${T.column(n)} - 1 WHERE ${T.column(n)} = ${T.literal(l)}
        `), l -= 1), g.push({
      label: "(null)",
      color: "#aaaaaa",
      predicate: T.isNull(T.column(e)),
      count: d
    })), {
      indexColumn: n,
      legend: g
    };
  }
  async makeBinnedNumericColumn(e) {
    let r = await this.queryOne(
      T.Query.from(this.table).select({
        count: T.count(),
        min: T.min(T.column(e)),
        max: T.max(T.column(e)),
        mean: T.avg(T.column(e)),
        median: T.median(T.column(e))
      }).where(T.isFinite(T.column(e)))
    ), n = U3(r), i = `_ev_${e}_id`, a = T.cast(T.column(e), "DOUBLE");
    a = n.scale.expr(a, n.scale.constant ?? 0);
    let l = T.cond(
      T.isFinite(T.cast(T.column(e), "DOUBLE")),
      T.floor(T.mul(T.sub(a, n.binStart), 1 / n.binSize)),
      T.literal(null)
    );
    await this.exec(T.sql`
      ALTER TABLE ${this.table} ADD COLUMN IF NOT EXISTS ${T.column(i)} INTEGER DEFAULT 0;
      UPDATE ${this.table}
      SET ${T.column(i)} = ${l}
    `);
    let u = await this.query(T.sql`
      SELECT ${T.column(i)} AS index, COUNT(*)::INT AS count
      FROM ${this.table}
      GROUP BY ${T.column(i)}
      ORDER BY ${T.column(i)} ASC
    `), c = null, f = null, d = /* @__PURE__ */ new Map(), p = (y) => n.scale.reverse(y, n.scale.constant ?? 0);
    for (let { index: y, count: w } of Array.from(u))
      y != null && ((c == null || y < c) && (c = y), (f == null || y > f) && (f = y)), d.set(y, w);
    let g = [], m = Yi(".6");
    if (c != null && f != null) {
      let y = q3(f - c + 1);
      for (let w = c; w <= f; w++) {
        let x = p(w * n.binSize + n.binStart), k = p((w + 1) * n.binSize + n.binStart);
        g.push({
          label: `[${m(x)}, ${m(k)})`,
          color: y[w - c],
          predicate: T.eq(l, T.literal(w)),
          count: d.get(w) ?? 0
        });
      }
    }
    if (d.has(null)) {
      let y = g.length;
      await this.exec(`
        UPDATE ${this.table}
        SET ${T.column(i)} = ${T.literal(y)}
        WHERE ${T.column(i)} IS NULL
      `), g.push({
        label: "(null / nan / inf)",
        color: "#aaaaaa",
        predicate: T.isNull(l),
        count: d.get(null) ?? 0
      });
    }
    return {
      indexColumn: i,
      legend: g
    };
  }
}
function V3(t) {
  return CB.has(t) ? "number" : RB.has(t) ? "string" : t.match(/^(VARCHAR|TEXT)\[\d*\]$/) ? "string[]" : null;
}
const CB = /* @__PURE__ */ new Set([
  "REAL",
  "FLOAT4",
  "FLOAT8",
  "FLOAT",
  "DOUBLE",
  "INT",
  "TINYINT",
  "INT1",
  "SMALLINT",
  "INT2",
  "SHORT",
  "INTEGER",
  "INT4",
  "INT",
  "SIGNED",
  "INT8",
  "LONG",
  "BIGINT",
  "UTINYINT",
  "USMALLINT",
  "UINTEGER",
  "UBIGINT",
  "UHUGEINT"
]), RB = /* @__PURE__ */ new Set(["BOOLEAN", "DATE", "VARCHAR", "CHAR", "BPCHAR", "TEXT", "STRING"]);
async function Aa(t, e, r) {
  let n = (await t.query(
    T.Query.describe(T.Query.from(e).select({ field: T.column(r, e) }))
  )).get(0)?.column_type;
  if (n == null)
    return null;
  let i = V3(n);
  if (i == "number") {
    let a = T.cast(T.column(r, e), "DOUBLE"), l = await t.query(
      T.Query.from(e).select({
        count: T.count(),
        min: T.min(a),
        minPositive: T.min(T.cond(T.gt(a, 0), a, T.literal(null))),
        max: T.max(a),
        mean: T.avg(a),
        median: T.median(a)
      }).where(T.isFinite(a))
    ), u = await t.query(
      T.Query.from(e).select({
        countNonFinite: T.count()
      }).where(T.or(T.not(T.isFinite(a)), T.isNull(a)))
    );
    return {
      table: e,
      field: r,
      quantitative: { ...l.get(0), ...u.get(0) }
    };
  } else if (i == "string") {
    let a = T.cast(T.column(r, e), "TEXT"), l = Array.from(
      await t.query(
        T.Query.from(e).select({ value: a, count: T.count() }).where(T.isNotNull(a)).groupby(a).orderby(T.desc(T.count())).limit(1e3)
      )
    ), u = (await t.query(T.Query.from(e).select({ count: T.count() }).where(T.isNull(a)))).get(0).count, { otherCount: c, numOtherLevels: f } = (await t.query(
      T.Query.from(e).select({ otherCount: T.count(), numOtherLevels: T.sql`COUNT(DISTINCT(${a}))` }).where(
        T.isNotNull(a),
        T.not(
          T.isIn(
            a,
            l.map((d) => T.literal(d.value))
          )
        )
      )
    )).get(0);
    return {
      table: e,
      field: r,
      nominal: {
        levels: l,
        numOtherLevels: f,
        otherCount: c,
        nullCount: u
      }
    };
  }
  return null;
}
function Tc(...t) {
  let e = {}, r = {}, n = {}, i = {}, a = {};
  for (let c of t) {
    if (c.stats.quantitative) {
      let f = U3(c.stats.quantitative, {
        scale: c.scaleType,
        desiredCount: c.binCount ?? 20
      }), d = T.cast(T.column(c.stats.field), "DOUBLE"), p = f.scale.expr(d, f.scale.constant ?? 0);
      e[c.key] = f.scale.type == "log" ? T.cond(
        T.and(T.isFinite(d), T.gt(d, T.literal(0))),
        T.floor(T.mul(T.sub(p, f.binStart), 1 / f.binSize)),
        T.literal(null)
      ) : T.cond(
        T.isFinite(d),
        T.floor(T.mul(T.sub(p, f.binStart), 1 / f.binSize)),
        T.literal(null)
      );
      let g = (_) => Math.floor((f.scale.forward(_, f.scale.constant ?? 0) - f.binStart) / f.binSize), m = (_) => f.scale.reverse(_ * f.binSize + f.binStart, f.scale.constant ?? 0);
      n[c.key] = (_) => _ == null ? "n/a" : [m(_), m(_ + 1)];
      let y = g(
        f.scale.type == "log" ? c.stats.quantitative.minPositive : c.stats.quantitative.min
      ), w = g(c.stats.quantitative.max), x = [m(y), m(w + 1)], k = c.stats.quantitative.countNonFinite > 0;
      f.scale.type == "log" && c.stats.quantitative.min < 0 && (k = !0), r[c.key] = {
        type: f.scale.type,
        constant: f.scale.constant,
        domain: x,
        specialValues: k ? ["n/a"] : []
      };
      let S = (_) => {
        if (typeof _ == "string") {
          if (_ == "n/a")
            return T.or(T.not(T.isFinite(d)), T.isNull(d));
        } else if (_ instanceof Array)
          if (_.length == 2 && typeof _[0] == "number") {
            let [E, C] = _;
            if (typeof E == "number" && typeof C == "number")
              return T.isBetween(d, [Math.min(E, C), Math.max(E, C)]);
          } else
            return T.or(..._.map(S));
        return T.literal(!1);
      };
      i[c.key] = S, a[c.key] = (_, E) => {
        let C = typeof _ == "string" ? [1, 0] : [0, _[0]], R = typeof E == "string" ? [1, 0] : [0, E[0]];
        return C[0] != R[0] ? C[0] - R[0] : C[1] - R[1];
      };
    }
    if (c.stats.nominal) {
      let f = c.binCount ?? 15, { levels: d, nullCount: p, otherCount: g, numOtherLevels: m } = c.stats.nominal;
      d.length > f && (m += d.length - f, g = d.slice(f).reduce((E, C) => E + C.count, 0), d = d.slice(0, f));
      let y = `(${m.toLocaleString()} others)`, w = "(null)", x = T.cast(T.column(c.stats.field), "TEXT");
      e[c.key] = T.cond(
        T.isIn(
          x,
          d.map((E) => T.literal(E.value))
        ),
        x,
        T.cond(T.isNull(x), T.literal(w), T.literal(y))
      );
      let k = [...g > 0 ? [y] : [], ...p > 0 ? [w] : []];
      r[c.key] = {
        type: "band",
        domain: d.map((E) => E.value),
        specialValues: k
      }, n[c.key] = (E) => E;
      let S = (E) => E == w ? T.isNull(x) : E == y ? T.and(
        T.not(
          T.isIn(
            x,
            d.map((C) => T.literal(C.value))
          )
        ),
        T.isNotNull(x)
      ) : T.isNotDistinct(x, T.literal(E));
      i[c.key] = (E) => E instanceof Array ? T.or(...E.map((C) => S(C))) : typeof E == "string" ? S(E) : null;
      let _ = d.map((E) => E.value);
      a[c.key] = (E, C) => {
        if (typeof E == "string" && typeof C == "string") {
          let R = _.indexOf(E);
          R < 0 && (R = _.length + k.indexOf(E));
          let A = _.indexOf(C);
          return A < 0 && (A = _.length + k.indexOf(C)), R - A;
        }
        return 0;
      };
    }
  }
  function l(c) {
    let f = { ...c };
    for (let d of t)
      f[d.key] = n[d.key](f[d.key]);
    return f;
  }
  function u(c) {
    let f = [];
    for (let d of t) {
      let p = c[d.key], g = p != null ? i[d.key](p) : null;
      g && f.push(g);
    }
    return {
      value: { ...c },
      predicate: f.length > 0 ? T.and(...f) : null
    };
  }
  return { select: e, collect: l, scales: r, clause: u, order: a };
}
function jl(t) {
  let e = t.coordinator, r = new AB({ ...t, coordinator: e });
  return e.connect(r), r.destroy = () => {
    e.disconnect(r);
  }, r;
}
class AB extends Td {
  _spec;
  constructor(e) {
    super(e.selection ?? void 0), this._spec = { ...e };
  }
  query(e) {
    return this._spec.query(e);
  }
  queryResult(e) {
    return this._spec.queryResult?.(e), this;
  }
  queryPending() {
    return this._spec.queryPending?.(), this;
  }
  queryError(e) {
    return this._spec.queryError?.(e), this;
  }
}
function Ul(t, e, r) {
  let n = t;
  if (n == null)
    return;
  let i = n.subscribe((a) => {
    a != null && r(a);
  });
  return Qe(() => {
    n.set(e());
  }), i;
}
var EB = /* @__PURE__ */ bt('<line></line><line></line><line></line><rect></rect><line stroke-linecap="butt"></line>', 1), TB = /* @__PURE__ */ bt("<!><!>", 1), $B = /* @__PURE__ */ Se('<div class="text-slate-400 mb-1 select-none"> </div> <div><!></div> <div class="text-slate-400 mb-1 select-none text-right"> </div> <div class="flex flex-col items-end gap-1"><div class="flex flex gap-2 mt-2"><!> <!></div></div>', 1);
function FB(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(u, "$darkMode", r);
  let a = Je(e, "xBinCount", 3, 20);
  const l = yr.coordinator, u = yr.darkMode;
  let c = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light), f = /* @__PURE__ */ ge(null), d = /* @__PURE__ */ ge(null), p = /* @__PURE__ */ ge(null), g = /* @__PURE__ */ ge(null);
  function m(L, j, B, P, q) {
    let H = /* @__PURE__ */ ge(null);
    Promise.all([
      Aa(L, j, B),
      Aa(L, j, P)
    ]).then(([Z, Y]) => {
      W(H, Z != null && Y != null ? { x: Z, y: Y } : null);
    });
    let X = /* @__PURE__ */ oe(() => h(H) ? Tc({
      key: "x",
      stats: h(H).x,
      scaleType: h(f),
      binCount: a()
    }) : null), V = /* @__PURE__ */ oe(() => h(H)?.y.quantitative ? oB(h(H).y.quantitative, h(d)) : null);
    Qe(() => {
      h(f) == null && W(f, h(X)?.scales.x?.type ?? null), h(d) == null && W(d, h(V)?.type ?? null);
    });
    function G(Z, Y, I) {
      return jl({
        coordinator: L,
        selection: Y,
        query: (K) => {
          let ie = T.column(P, j);
          return T.Query.from(j).select({
            ...Z.select,
            min: T.min(ie),
            max: T.max(ie),
            p50: T.median(ie),
            p25: T.quantile(ie, 0.25),
            p75: T.quantile(ie, 0.75)
          }).where(K, T.isFinite(ie)).groupby(Z.select.x);
        },
        queryResult: (K) => {
          I(Array.from(K).map(Z.collect));
        }
      });
    }
    Qe(() => {
      if (h(X) == null || h(V) == null)
        return;
      let Z = h(X), Y = /* @__PURE__ */ ge(mo([])), I = G(Z, q, (K) => {
        W(Y, K, !0);
      });
      return I.reset = () => {
        W(p, null);
      }, Qe(() => {
        W(g, {
          xScale: Z.scales.x,
          yScale: h(V),
          items: h(Y)
        });
      }), Qe(() => {
        let K = {
          source: I,
          clients: /* @__PURE__ */ new Set([I]),
          ...h(p) != null ? Z.clause(h(p)) : { value: null, predicate: null }
        };
        q.update(K), q.activate(K);
      }), () => {
        I.destroy(), q.update({
          source: I,
          clients: /* @__PURE__ */ new Set([I]),
          value: null,
          predicate: null
        });
      };
    });
  }
  Qe(() => {
    m(l, e.table, e.xField, e.yField, e.filter);
  }), Qe(() => Ul(
    e.stateStore,
    () => ({
      brush: h(p),
      xScaleType: h(f),
      yScaleType: h(d)
    }),
    (L) => {
      W(p, L.brush), W(f, L.xScaleType), W(d, L.yScaleType);
    }
  ));
  var y = $B(), w = We(y), x = ne(w);
  ee(w);
  var k = le(w, 2);
  tt(k, "", {}, { height: "250px" });
  var S = ne(k);
  rh(S, { children: (L, j = Ft, B = Ft) => {
    var P = fr(), q = We(P);
    {
      var H = (X) => {
        gc(X, {
          get width() {
            return j();
          },
          get height() {
            return B();
          },
          get xScale() {
            return h(g).xScale;
          },
          get yScale() {
            return h(g).yScale;
          },
          children: (V, G = Ft) => {
            var Z = TB();
            const Y = /* @__PURE__ */ oe(() => G().xScale), I = /* @__PURE__ */ oe(() => G().yScale), K = /* @__PURE__ */ oe(() => i() ? "#bbbbbb" : "black");
            var ie = We(Z);
            Gt(ie, 17, () => h(g)?.items ?? [], or, (ye, _e) => {
              var be = EB();
              const ue = /* @__PURE__ */ oe(() => {
                const [xt, wt] = h(Y).applyBand(h(_e).x);
                return { x0: xt, x1: wt };
              }), Ae = /* @__PURE__ */ oe(() => h(I).apply(h(_e).p50)), ze = /* @__PURE__ */ oe(() => {
                const [xt, wt] = h(I).applyBand([h(_e).min, h(_e).max]);
                return { ey0: xt, ey1: wt };
              }), Me = /* @__PURE__ */ oe(() => {
                const [xt, wt] = h(I).applyBand([h(_e).p25, h(_e).p75]);
                return { by0: xt, by1: wt };
              }), xe = /* @__PURE__ */ oe(() => Math.min(Math.abs(h(ue).x1 - h(ue).x0) * 0.1, 1)), ke = /* @__PURE__ */ oe(() => Math.abs(h(ue).x1 - h(ue).x0) / 3);
              var Le = We(be), Ie = le(Le), je = le(Ie), et = le(je), ht = le(et);
              Ee(
                (xt, wt, Xe, it, Ht, nt) => {
                  J(Le, "y1", h(ze).ey0), J(Le, "y2", h(ze).ey1), J(Le, "x1", (h(ue).x0 + h(ue).x1) / 2), J(Le, "x2", (h(ue).x0 + h(ue).x1) / 2), J(Le, "stroke", h(K)), J(Ie, "y1", h(ze).ey0), J(Ie, "y2", h(ze).ey0), J(Ie, "x1", (h(ue).x0 + h(ue).x1) / 2 - h(ke) / 2), J(Ie, "x2", (h(ue).x0 + h(ue).x1) / 2 + h(ke) / 2), J(Ie, "stroke", h(K)), J(je, "y1", h(ze).ey1), J(je, "y2", h(ze).ey1), J(je, "x1", (h(ue).x0 + h(ue).x1) / 2 - h(ke) / 2), J(je, "x2", (h(ue).x0 + h(ue).x1) / 2 + h(ke) / 2), J(je, "stroke", h(K)), J(et, "x", xt), J(et, "height", wt), J(et, "y", Xe), J(et, "width", it), J(et, "fill", h(c).markColor), J(ht, "y1", h(Ae)), J(ht, "y2", h(Ae)), J(ht, "x1", Ht), J(ht, "x2", nt), J(ht, "stroke", h(K));
                },
                [
                  () => Math.min(h(ue).x0, h(ue).x1) + h(xe) / 2,
                  () => Math.abs(h(Me).by0 - h(Me).by1),
                  () => Math.min(h(Me).by0, h(Me).by1),
                  () => Math.abs(h(ue).x0 - h(ue).x1) - h(xe),
                  () => Math.min(h(ue).x0, h(ue).x1) + h(xe) / 2,
                  () => Math.max(h(ue).x0, h(ue).x1) - h(xe) / 2
                ]
              ), te(ye, be);
            });
            var se = le(ie);
            ih(se, {
              get proxy() {
                return G();
              },
              mode: "x",
              get value() {
                return h(p);
              },
              onChange: (ye) => W(p, ye != null && ye.x != null ? { x: ye.x } : null)
            }), te(V, Z);
          },
          $$slots: { default: !0 }
        });
      };
      Te(q, (X) => {
        h(g) != null && X(H);
      });
    }
    te(L, P);
  } }), ee(k);
  var _ = le(k, 2), E = ne(_);
  ee(_);
  var C = le(_, 2), R = ne(C), A = ne(R);
  Us(A, {
    label: "X",
    get value() {
      return h(f);
    },
    set value(L) {
      W(f, L);
    }
  });
  var N = le(A, 2);
  Us(N, {
    label: "Y",
    get value() {
      return h(d);
    },
    set value(L) {
      W(d, L);
    }
  }), ee(R), ee(C), Ee(() => {
    rt(x, `↑ ${e.yField ?? ""}`), rt(E, `${e.xField ?? ""} →`);
  }), te(t, y), mt(), n();
}
var NB = /* @__PURE__ */ Se('<hr class="mt-1 mb-1 border-slate-300 dark:border-slate-500 border-dashed"/>'), zB = (t, e, r) => e(h(r).x, t.shiftKey), OB = /* @__PURE__ */ Se('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>'), BB = /* @__PURE__ */ Se('<!> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), DB = /* @__PURE__ */ Se('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>'), PB = /* @__PURE__ */ Se('<!> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), LB = /* @__PURE__ */ Se('<!> <button class="text-left items-center flex py-0.5"><div class="w-40 flex-none overflow-hidden whitespace-nowrap text-ellipsis pr-1"><span> </span></div> <div class="flex-1 h-4 relative"><!></div> <div class="flex-none"><span><!></span></div></button>', 1), qB = (t, e, r) => {
  W(e, !h(e)), h(e) == !1 && W(r, null);
}, IB = /* @__PURE__ */ Se('<button class="py-0.5 text-left text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap text-ellipsis w-full overflow-hidden"><!></button>'), jB = /* @__PURE__ */ Se('<!> <div class="flex"><div class="flex-1 pl-40 mr-2 overflow-hidden"><!></div> <div class="flex"><!></div></div>', 1), UB = /* @__PURE__ */ Se('<div class="flex flex-col text-sm w-full select-none"><!></div>');
function WB(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(c, "$darkMode", r), a = 10, l = 100, u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ ge(null), d = /* @__PURE__ */ ge(!1), p = /* @__PURE__ */ ge(!1), g = /* @__PURE__ */ ge(null), m = /* @__PURE__ */ ge(400), y = /* @__PURE__ */ oe(() => h(g)?.items.reduce((B, P) => Math.max(B, h(p) ? P.selected : P.total), 0) ?? 0), w = /* @__PURE__ */ oe(() => Zs([0, Math.max(1, h(y))], [0, h(m) - 250])), x = /* @__PURE__ */ oe(() => (B) => B != 0 ? Math.max(1, h(w)(B)) : 0), k = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light);
  function S(B, P, q, H) {
    let X = /* @__PURE__ */ ge(null);
    Aa(B, P, q).then((Z) => {
      W(X, Z);
    });
    let V = /* @__PURE__ */ oe(() => h(X) ? Tc({
      key: "x",
      stats: h(X),
      binCount: h(d) ? l : a
    }) : null);
    function G(Z, Y, I) {
      return jl({
        coordinator: B,
        selection: Y,
        query: (K) => T.Query.from(P).select({ ...Z.select, count: T.count() }).where(K).groupby(Z.select.x),
        queryResult: (K) => {
          I(Array.from(K).map(Z.collect));
        }
      });
    }
    Qe(() => {
      if (h(V) == null)
        return;
      let Z = h(V), Y = /* @__PURE__ */ ge([]), I = /* @__PURE__ */ ge([]), K = G(Z, null, (se) => {
        W(Y, se);
      }), ie = G(Z, H, (se) => {
        W(I, se);
      });
      return ie.reset = () => {
        W(f, null);
      }, Qe(() => {
        if (h(Y).length > 0) {
          let se = (be) => JSON.stringify(be), ye = new Map(h(Y).map(({ x: be, count: ue }) => [se(be), ue])), _e = new Map(h(I).map(({ x: be, count: ue }) => [se(be), ue]));
          if (h(Y).every((be) => typeof be.x == "string")) {
            let be = Z.scales.x.specialValues ?? [], ue = be.filter((xe) => xe != "(null)").length > 0, Ae = [...Z.scales.x.domain, ...be].map((xe) => ({
              x: xe,
              total: ye.get(se(xe)) ?? 0,
              selected: _e.get(se(xe)) ?? 0
            })), ze = Ae.reduce((xe, ke) => xe + ke.total, 0), Me = Ae.reduce((xe, ke) => xe + ke.selected, 0);
            W(g, {
              items: Ae,
              sumTotal: ze,
              sumSelected: Me,
              firstSpecialIndex: Z.scales.x.domain.length,
              hasOther: ue
            });
          } else {
            let be = Array.from(ye.keys()).map((Me) => JSON.parse(Me));
            be = be.sort((Me, xe) => {
              let ke = typeof Me == "string" ? 1 / 0 : Me[0], Le = typeof xe == "string" ? 1 / 0 : xe[0];
              return ke - Le;
            });
            let ue = be.map((Me) => ({
              x: Me,
              total: ye.get(se(Me)) ?? 0,
              selected: _e.get(se(Me)) ?? 0
            })), Ae = ue.reduce((Me, xe) => Me + xe.total, 0), ze = ue.reduce((Me, xe) => Me + xe.selected, 0);
            W(g, {
              items: ue,
              sumTotal: Ae,
              sumSelected: ze,
              firstSpecialIndex: be.findIndex((Me) => typeof Me == "string"),
              hasOther: !1
            });
          }
        }
      }), Qe(() => {
        let se = {
          source: ie,
          clients: /* @__PURE__ */ new Set([ie]),
          ...h(f) != null ? Z.clause({ x: h(f) }) : { value: null, predicate: null }
        };
        H.update(se), H.activate(se);
      }), () => {
        K.destroy(), ie.destroy(), H.update({
          source: ie,
          clients: /* @__PURE__ */ new Set([ie]),
          value: null,
          predicate: null
        });
      };
    });
  }
  Qe(() => {
    S(u, e.table, e.field, e.filter);
  });
  const _ = (B, P) => JSON.stringify(B) == JSON.stringify(P);
  function E(B, P) {
    if (h(f) == null || h(f).length == 0)
      W(f, [B]);
    else {
      let q = h(f).findIndex((H) => _(H, B)) >= 0;
      P ? q ? W(f, h(f).filter((H) => !_(H, B))) : W(f, [...h(f), B]) : q ? W(f, null) : W(f, [B]);
    }
  }
  Qe(() => Ul(
    e.stateStore,
    () => ({
      selection: h(f),
      expanded: h(d),
      percentage: h(p)
    }),
    (B) => {
      W(f, B.selection), W(d, B.expanded), W(p, B.percentage);
    }
  ));
  const C = Yi(".6");
  function R(B) {
    return typeof B == "string" ? B : "[" + C(B[0]) + ", " + C(B[1]) + ")";
  }
  function A(B, P) {
    return P == 0 ? "-%" : (B / P * 100).toFixed(1) + "%";
  }
  var N = UB(), L = ne(N);
  {
    var j = (B) => {
      var P = jB(), q = We(P);
      Gt(q, 17, () => h(g).items, or, (I, K, ie) => {
        var se = LB();
        const ye = /* @__PURE__ */ oe(() => h(f) == null || h(f).length == 0 || h(f).findIndex((nt) => _(nt, h(K).x)) >= 0), _e = /* @__PURE__ */ oe(() => !h(g).items.every((nt) => nt.total == nt.selected));
        var be = We(se);
        {
          var ue = (nt) => {
            var dr = NB();
            te(nt, dr);
          };
          Te(be, (nt) => {
            ie == h(g).firstSpecialIndex && nt(ue);
          });
        }
        var Ae = le(be, 2);
        Ae.__click = [zB, E, K];
        var ze = ne(Ae), Me = ne(ze);
        let xe;
        var ke = ne(Me, !0);
        ee(Me), ee(ze);
        var Le = le(ze, 2), Ie = ne(Le);
        {
          var je = (nt) => {
            var dr = BB(), qt = We(dr);
            {
              var Cr = (Ot) => {
                var vr = OB();
                let xn;
                Ee((wn) => xn = tt(vr, "", xn, wn), [
                  () => ({
                    background: h(k).markColorFade,
                    width: `${h(x)(h(K).total) ?? ""}px`
                  })
                ]), te(Ot, vr);
              };
              Te(qt, (Ot) => {
                h(p) || Ot(Cr);
              });
            }
            var sr = le(qt, 2);
            let zt;
            Ee((Ot) => zt = tt(sr, "", zt, Ot), [
              () => ({
                background: h(k).markColor,
                width: `${h(x)(h(K).selected) ?? ""}px`
              })
            ]), te(nt, dr);
          }, et = (nt) => {
            var dr = PB(), qt = We(dr);
            {
              var Cr = (Ot) => {
                var vr = DB();
                let xn;
                Ee((wn) => xn = tt(vr, "", xn, wn), [
                  () => ({
                    background: h(k).markColorGrayFade,
                    width: `${h(x)(h(K).total) ?? ""}px`
                  })
                ]), te(Ot, vr);
              };
              Te(qt, (Ot) => {
                h(p) || Ot(Cr);
              });
            }
            var sr = le(qt, 2);
            let zt;
            Ee((Ot) => zt = tt(sr, "", zt, Ot), [
              () => ({
                background: h(k).markColorGray,
                width: `${h(x)(h(K).selected) ?? ""}px`
              })
            ]), te(nt, dr);
          };
          Te(Ie, (nt) => {
            h(ye) ? nt(je) : nt(et, !1);
          });
        }
        ee(Le);
        var ht = le(Le, 2), xt = ne(ht);
        let wt;
        var Xe = ne(xt);
        {
          var it = (nt) => {
            var dr = fr(), qt = We(dr);
            {
              var Cr = (zt) => {
                var Ot = $n();
                Ee((vr) => rt(Ot, vr), [
                  () => A(h(K).selected, h(g).sumSelected)
                ]), te(zt, Ot);
              }, sr = (zt) => {
                var Ot = $n();
                Ee((vr) => rt(Ot, vr), [
                  () => h(K).selected.toLocaleString() + " / " + h(K).total.toLocaleString()
                ]), te(zt, Ot);
              };
              Te(qt, (zt) => {
                h(p) ? zt(Cr) : zt(sr, !1);
              });
            }
            te(nt, dr);
          }, Ht = (nt) => {
            var dr = fr(), qt = We(dr);
            {
              var Cr = (zt) => {
                var Ot = $n();
                Ee((vr) => rt(Ot, vr), [
                  () => A(h(K).total, h(g).sumTotal)
                ]), te(zt, Ot);
              }, sr = (zt) => {
                var Ot = $n();
                Ee((vr) => rt(Ot, vr), [() => h(K).total.toLocaleString()]), te(zt, Ot);
              };
              Te(
                qt,
                (zt) => {
                  h(p) ? zt(Cr) : zt(sr, !1);
                },
                !0
              );
            }
            te(nt, dr);
          };
          Te(Xe, (nt) => {
            h(_e) ? nt(it) : nt(Ht, !1);
          });
        }
        ee(xt), ee(ht), ee(Ae), Ee(
          (nt, dr, qt, Cr) => {
            J(Ae, "title", h(K).x), xe = _r(Me, 1, "", null, xe, nt), rt(ke, dr), wt = _r(xt, 1, "text-slate-400 dark:text-slate-500", null, wt, qt), J(xt, "title", Cr);
          },
          [
            () => ({
              "text-gray-400": !h(ye),
              "dark:text-gray-400": !h(ye)
            }),
            () => R(h(K).x),
            () => ({
              "!text-gray-200": !h(ye),
              "dark:!text-gray-600": !h(ye)
            }),
            () => h(_e) ? `${h(K).selected.toLocaleString()} / ${h(K).total.toLocaleString()} (${A(h(K).selected, h(K).total)})
${A(h(K).selected, h(g).sumSelected)} of selection` : `${h(K).total.toLocaleString()}
${A(h(K).total, h(g).sumTotal)} of all rows`
          ]
        ), te(I, se);
      });
      var H = le(q, 2), X = ne(H), V = ne(X);
      {
        var G = (I) => {
          var K = IB();
          K.__click = [qB, d, f];
          var ie = ne(K);
          {
            var se = (_e) => {
              var be = $n();
              be.nodeValue = "↑ Show up to 10 values", te(_e, be);
            }, ye = (_e) => {
              var be = $n();
              be.nodeValue = "↓ Show up to 100 values", te(_e, be);
            };
            Te(ie, (_e) => {
              h(d) ? _e(se) : _e(ye, !1);
            });
          }
          ee(K), te(I, K);
        };
        Te(V, (I) => {
          (h(d) || h(g).hasOther) && I(G);
        });
      }
      ee(X);
      var Z = le(X, 2), Y = ne(Z);
      ah(Y, {
        options: [
          { value: "true", label: "%" },
          { value: "false", label: "#/#" }
        ],
        get value() {
          return h(p);
        },
        onChange: (I) => W(p, I == "true")
      }), ee(Z), ee(H), te(B, P);
    };
    Te(L, (B) => {
      h(g) && B(j);
    });
  }
  ee(N), bl(N, "clientWidth", (B) => W(m, B)), te(t, N), mt(), n();
}
Tr(["click"]);
var HB = /* @__PURE__ */ bt("<rect></rect>"), VB = /* @__PURE__ */ bt("<rect></rect>"), GB = /* @__PURE__ */ bt("<!><!><!>", 1), XB = /* @__PURE__ */ Se('<div class="mt-2 flex gap items-center text-sm"><span class="flex-1 text-slate-400 dark:text-slate-500"><!></span> <!></div>'), YB = /* @__PURE__ */ Se("<div><!></div> <!>", 1);
function KB(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(u, "$darkMode", r);
  let a = Je(e, "binCount", 3, 20);
  const l = yr.coordinator, u = yr.darkMode;
  let c = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light), f = /* @__PURE__ */ ge(null), d = /* @__PURE__ */ ge(null), p = /* @__PURE__ */ ge(null);
  function g(S, _, E, C) {
    let R = /* @__PURE__ */ ge(null);
    Aa(S, _, E).then((L) => {
      W(R, L);
    });
    let A = /* @__PURE__ */ oe(() => h(R) ? Tc({
      key: "x",
      stats: h(R),
      scaleType: h(f),
      binCount: a()
    }) : null);
    Qe(() => {
      h(f) == null && W(f, h(A)?.scales.x?.type ?? null);
    });
    function N(L, j, B) {
      return jl({
        coordinator: S,
        selection: j,
        query: (P) => T.Query.from(_).select({ ...L.select, count: T.count() }).where(P).groupby(L.select.x),
        queryResult: (P) => {
          B(Array.from(P).map(L.collect));
        }
      });
    }
    Qe(() => {
      if (h(A) == null)
        return;
      let L = h(A), j = /* @__PURE__ */ ge(mo([])), B = /* @__PURE__ */ ge(mo([])), P = N(L, null, (H) => {
        W(j, H, !0);
      }), q = N(L, C, (H) => {
        W(B, H, !0);
      });
      return q.reset = () => {
        W(d, null);
      }, Qe(() => {
        h(j).length > 0 && W(p, {
          xScale: L.scales.x,
          allItems: h(j),
          filteredItems: h(B)
        });
      }), Qe(() => {
        let H = {
          source: q,
          clients: /* @__PURE__ */ new Set([q]),
          ...h(d) != null ? L.clause(h(d)) : { value: null, predicate: null }
        };
        C.update(H), C.activate(H);
      }), () => {
        P.destroy(), q.destroy(), C.update({
          source: q,
          clients: /* @__PURE__ */ new Set([q]),
          value: null,
          predicate: null
        });
      };
    });
  }
  Qe(() => {
    g(l, e.table, e.field, e.filter);
  }), Qe(() => Ul(e.stateStore, () => ({ brush: h(d), xScaleType: h(f) }), (S) => {
    W(d, S.brush), W(f, S.xScaleType);
  }));
  var m = YB(), y = We(m);
  tt(y, "", {}, { height: "200px" });
  var w = ne(y);
  rh(w, { children: (S, _ = Ft, E = Ft) => {
    var C = fr(), R = We(C);
    {
      var A = (N) => {
        const L = /* @__PURE__ */ oe(() => h(p).allItems.reduce((j, B) => Math.max(j, B.count), 1));
        {
          const j = (P, q = Ft) => {
            var H = GB();
            const X = /* @__PURE__ */ oe(() => q().xScale), V = /* @__PURE__ */ oe(() => q().yScale);
            var G = We(H);
            Gt(G, 17, () => h(p)?.allItems ?? [], or, (I, K) => {
              var ie = HB();
              const se = /* @__PURE__ */ oe(() => {
                const [be, ue] = h(X).applyBand(h(K).x);
                return { x0: be, x1: ue };
              }), ye = /* @__PURE__ */ oe(() => {
                const [be, ue] = h(V).applyBand([0, h(K).count]);
                return { y0: be, y1: ue };
              }), _e = /* @__PURE__ */ oe(() => Math.min(Math.abs(h(se).x1 - h(se).x0) * 0.1, 1));
              Ee(
                (be, ue, Ae, ze) => {
                  J(ie, "x", be), J(ie, "y", ue), J(ie, "width", Ae), J(ie, "height", ze), J(ie, "fill", h(c).markColorFade);
                },
                [
                  () => Math.min(h(se).x0, h(se).x1) + h(_e) / 2,
                  () => Math.min(h(ye).y0, h(ye).y1),
                  () => Math.abs(h(se).x0 - h(se).x1) - h(_e),
                  () => Math.abs(h(ye).y0 - h(ye).y1)
                ]
              ), te(I, ie);
            });
            var Z = le(G);
            Gt(Z, 17, () => h(p)?.filteredItems ?? [], or, (I, K) => {
              var ie = VB();
              const se = /* @__PURE__ */ oe(() => {
                const [be, ue] = h(X).applyBand(h(K).x);
                return { x0: be, x1: ue };
              }), ye = /* @__PURE__ */ oe(() => {
                const [be, ue] = h(V).applyBand([0, h(K).count]);
                return { y0: be, y1: ue };
              }), _e = /* @__PURE__ */ oe(() => Math.min(Math.abs(h(se).x1 - h(se).x0) * 0.1, 1));
              Ee(
                (be, ue, Ae, ze) => {
                  J(ie, "x", be), J(ie, "height", ue), J(ie, "y", Ae), J(ie, "width", ze), J(ie, "fill", h(c).markColor);
                },
                [
                  () => Math.min(h(se).x0, h(se).x1) + h(_e) / 2,
                  () => Math.abs(h(ye).y0 - h(ye).y1),
                  () => Math.min(h(ye).y0, h(ye).y1),
                  () => Math.abs(h(se).x0 - h(se).x1) - h(_e)
                ]
              ), te(I, ie);
            });
            var Y = le(Z);
            ih(Y, {
              get proxy() {
                return q();
              },
              mode: "x",
              get value() {
                return h(d);
              },
              onChange: (I) => W(d, I != null && I.x != null ? { x: I.x } : null)
            }), te(P, H);
          };
          let B = /* @__PURE__ */ oe(() => ({ type: "linear", domain: [0, h(L)] }));
          gc(N, {
            get width() {
              return _();
            },
            get height() {
              return E();
            },
            get xScale() {
              return h(p).xScale;
            },
            get yScale() {
              return h(B);
            },
            children: j,
            $$slots: { default: !0 }
          });
        }
      };
      Te(R, (N) => {
        h(p) != null && N(A);
      });
    }
    te(S, C);
  } }), ee(y);
  var x = le(y, 2);
  {
    var k = (S) => {
      var _ = XB(), E = ne(_), C = ne(E);
      {
        var R = (N) => {
          var L = fr(), j = We(L);
          {
            var B = (q) => {
              var H = $n();
              Ee(() => rt(H, `[${h(d).x ?? ""}]`)), te(q, H);
            }, P = (q) => {
              var H = $n();
              const X = /* @__PURE__ */ oe(() => Yi(".4"));
              Ee((V, G) => rt(H, `[${V ?? ""}, ${G ?? ""}]`), [
                () => h(X)(h(d).x[0]),
                () => h(X)(h(d).x[1])
              ]), te(q, H);
            };
            Te(j, (q) => {
              typeof h(d).x == "string" ? q(B) : q(P, !1);
            });
          }
          te(N, L);
        };
        Te(C, (N) => {
          h(d) && N(R);
        });
      }
      ee(E);
      var A = le(E, 2);
      Us(A, {
        label: "X",
        get value() {
          return h(f);
        },
        set value(N) {
          W(f, N);
        }
      }), ee(_), te(S, _);
    };
    Te(x, (S) => {
      h(p)?.xScale.type != "band" && S(k);
    });
  }
  te(t, m), mt(), n();
}
var ZB = /* @__PURE__ */ bt('<image preserveAspectRatio="none"></image>');
function QB(t, e) {
  gt(e, !0);
  let r = /* @__PURE__ */ oe(() => e.proxy.xScale && e.xDomain ? e.proxy.xScale.apply(e.xDomain[0]) : 0), n = /* @__PURE__ */ oe(() => e.proxy.xScale && e.xDomain ? e.proxy.xScale.apply(e.xDomain[1]) : e.proxy.plotWidth), i = /* @__PURE__ */ oe(() => e.proxy.yScale && e.yDomain ? e.proxy.yScale.apply(e.yDomain[0]) : 0), a = /* @__PURE__ */ oe(() => e.proxy.yScale && e.yDomain ? e.proxy.yScale.apply(e.yDomain[1]) : e.proxy.plotHeight), l = /* @__PURE__ */ ge(null), u = document.createElement("canvas");
  Qe(() => {
    u.width = e.rasterWidth, u.height = e.rasterHeight;
    let f = u.getContext("2d", { colorSpace: "srgb", willReadFrequently: !0 });
    f.clearRect(0, 0, u.width, u.height);
    let d = f.getImageData(0, 0, u.width, u.height), p = 0;
    for (let g = 0; g < u.height; g++)
      for (let m = 0; m < u.width; m++) {
        let y = (m + 0.5) / u.width * (h(n) - h(r)) + h(r), w = (g + 0.5) / u.height * (h(a) - h(i)) + h(i), x = e.proxy.xScale?.invert(y) ?? 0, k = e.proxy.yScale?.invert(w) ?? 0, { r: S, g: _, b: E, opacity: C } = pc(e.color(x, k));
        d.data[p++] = S, d.data[p++] = _, d.data[p++] = E, d.data[p++] = C * 255;
      }
    f.putImageData(d, 0, 0), W(l, u.toDataURL("image/png"), !0);
  });
  var c = ZB();
  Ee(
    (f, d, p, g) => {
      J(c, "x", f), J(c, "y", d), J(c, "width", p), J(c, "height", g), J(c, "href", h(l));
    },
    [
      () => Math.min(h(r), h(n)),
      () => Math.min(h(i), h(a)),
      () => Math.abs(h(r) - h(n)),
      () => Math.abs(h(i) - h(a))
    ]
  ), te(t, c), mt();
}
var JB = /* @__PURE__ */ bt("<rect></rect>"), eD = /* @__PURE__ */ bt("<rect></rect><!>", 1), tD = /* @__PURE__ */ Se('<div class="text-slate-400 mb-1 select-none"> </div> <div><!></div> <div class="text-slate-400 mb-1 select-none text-right"> </div> <div class="flex gap items-center text-sm"><span class="flex-1 text-slate-400 dark:text-slate-500"><!></span> <span class="flex flex-col items-end gap-1"><span class="flex gap-2"><!> <!></span> <span class="flex gap-1 select-none"><span class="text-slate-400 dark:text-slate-500 text-sm">Normalize:</span> <!></span></span></div>', 1);
function rD(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(c, "$darkMode", r);
  let a = Je(e, "xBinCount", 3, 20), l = Je(e, "yBinCount", 3, 20);
  const u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ ge(null), d = /* @__PURE__ */ ge(null), p = /* @__PURE__ */ ge(null), g = /* @__PURE__ */ ge(null), m = /* @__PURE__ */ ge(null), y = /* @__PURE__ */ oe(() => h(m)?.items.reduce((Y, I) => Math.max(Y, I.value), 1) ?? 1);
  const w = 0.07, x = (Y) => Y > 0 ? w + (1 - w) * Y : 0;
  let k = /* @__PURE__ */ oe(() => i() ? (Y) => L3(x(Y / h(y))) : (Y) => GO(x(Y / h(y))));
  function S(Y, I, K, ie, se) {
    let ye = /* @__PURE__ */ ge(null);
    Promise.all([
      Aa(Y, I, K),
      Aa(Y, I, ie)
    ]).then(([ue, Ae]) => {
      W(ye, ue != null && Ae != null ? { x: ue, y: Ae } : null);
    });
    let _e = /* @__PURE__ */ oe(() => h(ye) ? Tc(
      {
        key: "x",
        stats: h(ye).x,
        scaleType: h(f),
        binCount: a()
      },
      {
        key: "y",
        stats: h(ye).y,
        scaleType: h(d),
        binCount: l()
      }
    ) : null);
    Qe(() => {
      h(f) == null && W(f, h(_e)?.scales.x?.type ?? null), h(d) == null && W(d, h(_e)?.scales.y?.type ?? null);
    });
    function be(ue, Ae, ze) {
      return jl({
        coordinator: Y,
        selection: Ae,
        query: (Me) => T.Query.from(T.Query.from(I).select({ ...ue.select, count: T.count() }).where(Me).groupby(ue.select.x, ue.select.y)).select({
          x: "x",
          y: "y",
          count: "count",
          normalizeByX: T.sql`count / (SUM(count) OVER (PARTITION BY x))`,
          normalizeByY: T.sql`count / (SUM(count) OVER (PARTITION BY y))`
        }),
        queryResult: (Me) => {
          ze(Array.from(Me).map(ue.collect));
        }
      });
    }
    Qe(() => {
      if (h(_e) == null)
        return;
      let ue = h(_e), Ae = /* @__PURE__ */ ge(null), ze = be(ue, se, (Me) => {
        W(Ae, Me);
      });
      return ze.reset = () => {
        W(g, null);
      }, Qe(() => {
        h(Ae) != null && W(m, {
          xScale: ue.scales.x,
          yScale: ue.scales.y,
          items: h(Ae).map((Me) => ({
            x: Me.x,
            y: Me.y,
            value: h(p) == "x" ? Me.normalizeByX : h(p) == "y" ? Me.normalizeByY : Me.count
          }))
        });
      }), Qe(() => {
        let Me = {
          source: ze,
          clients: /* @__PURE__ */ new Set([ze]),
          ...h(g) != null ? ue.clause(h(g)) : { value: null, predicate: null }
        };
        se.update(Me), se.activate(Me);
      }), () => {
        ze.destroy(), se.update({
          source: ze,
          clients: /* @__PURE__ */ new Set([ze]),
          value: null,
          predicate: null
        });
      };
    });
  }
  Qe(() => {
    S(u, e.table, e.xField, e.yField, e.filter);
  }), Qe(() => Ul(
    e.stateStore,
    () => ({
      brush: h(g),
      xScaleType: h(f),
      yScaleType: h(d),
      normalization: h(p)
    }),
    (Y) => {
      W(g, Y.brush), W(f, Y.xScaleType), W(d, Y.yScaleType), W(p, Y.normalization);
    }
  ));
  var _ = tD(), E = We(_), C = ne(E);
  ee(E);
  var R = le(E, 2);
  tt(R, "", {}, { height: "320px" });
  var A = ne(R);
  rh(A, { children: (Y, I = Ft, K = Ft) => {
    var ie = fr(), se = We(ie);
    {
      var ye = (_e) => {
        gc(_e, {
          get width() {
            return I();
          },
          get height() {
            return K();
          },
          get xScale() {
            return h(m).xScale;
          },
          get yScale() {
            return h(m).yScale;
          },
          childrenBelow: (be, ue = Ft) => {
            var Ae = eD();
            const ze = /* @__PURE__ */ oe(() => ue().xScale), Me = /* @__PURE__ */ oe(() => ue().yScale);
            var xe = We(Ae);
            J(xe, "x", 0), J(xe, "y", 0);
            var ke = le(xe);
            Gt(ke, 17, () => h(m)?.items ?? [], or, (Le, Ie) => {
              var je = JB();
              const et = /* @__PURE__ */ oe(() => {
                const [wt, Xe] = h(ze).applyBand(h(Ie).x);
                return { x0: wt, x1: Xe };
              }), ht = /* @__PURE__ */ oe(() => {
                const [wt, Xe] = h(Me).applyBand(h(Ie).y);
                return { y0: wt, y1: Xe };
              }), xt = /* @__PURE__ */ oe(() => 0);
              Ee(
                (wt, Xe, it, Ht, nt) => {
                  J(je, "x", wt), J(je, "y", Xe), J(je, "width", it), J(je, "height", Ht), J(je, "fill", nt);
                },
                [
                  () => Math.min(h(et).x0, h(et).x1) + h(xt) / 2,
                  () => Math.min(h(ht).y0, h(ht).y1) + h(xt) / 2,
                  () => Math.abs(h(et).x0 - h(et).x1) - h(xt),
                  () => Math.abs(h(ht).y0 - h(ht).y1) - h(xt),
                  () => h(k)(h(Ie).value)
                ]
              ), te(Le, je);
            }), Ee(
              (Le) => {
                J(xe, "width", ue().plotWidth), J(xe, "height", ue().plotHeight), J(xe, "fill", Le);
              },
              [() => h(k)(0)]
            ), te(be, Ae);
          },
          children: (be, ue = Ft) => {
            ih(be, {
              get proxy() {
                return ue();
              },
              mode: "xy",
              get value() {
                return h(g);
              },
              onChange: (Ae) => W(g, Ae != null && Ae.x != null && Ae.y != null ? { x: Ae.x, y: Ae.y } : null)
            });
          },
          $$slots: { childrenBelow: !0, default: !0 }
        });
      };
      Te(se, (_e) => {
        h(m) != null && _e(ye);
      });
    }
    te(Y, ie);
  } }), ee(R);
  var N = le(R, 2), L = ne(N);
  ee(N);
  var j = le(N, 2), B = ne(j), P = ne(B);
  {
    const Y = (K, ie = Ft) => {
      {
        let se = /* @__PURE__ */ oe(() => ie().xScale?.domain);
        QB(K, {
          get color() {
            return h(k);
          },
          rasterWidth: 100,
          rasterHeight: 1,
          get proxy() {
            return ie();
          },
          get xDomain() {
            return h(se);
          }
        });
      }
    };
    let I = /* @__PURE__ */ oe(() => ({ type: "linear", domain: [0, h(y)] }));
    gc(P, {
      get xScale() {
        return h(I);
      },
      xAxis: { extendScaleToTicks: !1 },
      width: 230,
      height: 24,
      extents: { left: 30, right: 30, top: 0, bottom: 0 },
      children: Y,
      $$slots: { default: !0 }
    });
  }
  ee(B);
  var q = le(B, 2), H = ne(q), X = ne(H);
  Us(X, {
    label: "X",
    get value() {
      return h(f);
    },
    set value(Y) {
      W(f, Y);
    }
  });
  var V = le(X, 2);
  Us(V, {
    label: "Y",
    get value() {
      return h(d);
    },
    set value(Y) {
      W(d, Y);
    }
  }), ee(H);
  var G = le(H, 2), Z = le(ne(G), 2);
  ah(Z, {
    options: [
      { value: null, label: "off" },
      { value: "x", label: "X" },
      { value: "y", label: "Y" }
    ],
    get value() {
      return h(p);
    },
    onChange: (Y) => W(p, Y)
  }), ee(G), ee(q), ee(j), Ee(() => {
    rt(C, `↑ ${e.yField ?? ""}`), rt(L, `${e.xField ?? ""} →`);
  }), te(t, _), mt(), n();
}
var nD = /* @__PURE__ */ bt("<rect></rect>"), oD = /* @__PURE__ */ bt("<rect></rect>"), iD = /* @__PURE__ */ bt("<!><!><!>", 1), aD = /* @__PURE__ */ Se('<div class="flex gap-1 items-center"><div class="w-3 h-3 block rounded-sm"></div> <div class="whitespace-nowrap max-w-32 overflow-hidden text-ellipsis"> </div></div>'), lD = /* @__PURE__ */ Se('<div class="flex gap-2 flex-wrap items-center select-none"></div>'), sD = /* @__PURE__ */ Se('<div><!></div> <div class="mt-2 flex gap-2 items-start text-sm"><div class="flex-1 text-slate-400 dark:text-slate-500"><!></div> <span class="flex flex-col items-end gap-1"><!> <span class="flex gap-1 select-none"><span class="text-slate-400 dark:text-slate-500 text-sm">Normalize:</span> <!></span></span></div>', 1);
function uD(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(c, "$darkMode", r);
  let a = Je(e, "xBinCount", 3, 20), l = Je(e, "groupBinCount", 3, 20);
  const u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light), d = /* @__PURE__ */ ge(null), p = /* @__PURE__ */ ge(null), g = /* @__PURE__ */ ge(null), m = /* @__PURE__ */ ge(null);
  function y(P, q, H, X, V) {
    let G = /* @__PURE__ */ ge(null);
    Promise.all([
      Aa(P, q, H),
      Aa(P, q, X)
    ]).then(([I, K]) => {
      W(G, I != null && K != null ? { x: I, group: K } : null);
    });
    let Z = /* @__PURE__ */ oe(() => h(G) ? Tc(
      {
        key: "x",
        stats: h(G).x,
        scaleType: h(d),
        binCount: a()
      },
      {
        key: "group",
        stats: h(G).group,
        binCount: l()
      }
    ) : null);
    Qe(() => {
      h(d) == null && W(d, h(Z)?.scales.x?.type ?? null);
    });
    function Y(I, K, ie) {
      return jl({
        coordinator: P,
        selection: K,
        query: (se) => T.Query.from(T.Query.from(q).select({ ...I.select, count: T.count() }).where(se).groupby(I.select.x, I.select.group)).select({
          x: "x",
          group: "group",
          count: "count",
          normalizeByX: T.sql`count / (SUM(count) OVER (PARTITION BY x))`
        }),
        queryResult: (se) => {
          ie(Array.from(se).map(I.collect));
        }
      });
    }
    Qe(() => {
      if (h(Z) == null)
        return;
      let I = h(Z), K = /* @__PURE__ */ ge(null), ie = /* @__PURE__ */ ge(null), se = Y(I, null, (_e) => {
        W(K, _e);
      }), ye = Y(I, V, (_e) => {
        W(ie, _e);
      });
      return ye.reset = () => {
        W(g, null);
      }, Qe(() => {
        if (h(K) != null && h(ie) != null) {
          let _e = (ke) => JSON.stringify(ke), be = h(p) == "x" ? "normalizeByX" : "count", ue = Array.from(w(h(K), (ke) => _e(ke.group), (ke) => ke[0].group).entries()).sort((ke, Le) => I.order.group(ke[1], Le[1])), Ae = w(h(K), (ke) => _e(ke.x), (ke) => ({
            x: ke[0].x,
            total: ke.reduce((Le, Ie) => Le + Ie[be], 0)
          })), ze = w(h(ie), (ke) => _e(ke.x), (ke) => {
            ke = ke.sort((je, et) => I.order.group(je.group, et.group));
            let Le = [], Ie = 0;
            for (let je of ke)
              Le.push({ group: je.group, y1: Ie, y2: Ie + je[be] }), Ie += je[be];
            return { x: ke[0].x, groups: Le };
          }), Me = Ae.values().reduce((ke, Le) => Math.max(ke, Le.total), 1);
          h(p) && (Me = 1);
          let xe = iB(Array.from(ue.map((ke) => ke[1])), {
            fade: ["n/a", "(null)"],
            ordinal: I.scales.group.type != "band"
          });
          W(m, {
            xScale: I.scales.x,
            yScale: { type: "linear", domain: [0, Me] },
            colorScale: xe,
            totals: Array.from(Ae.values()),
            items: Array.from(ze.values())
          });
        }
      }), Qe(() => {
        let _e = {
          source: ye,
          clients: /* @__PURE__ */ new Set([ye]),
          ...h(g) != null ? I.clause(h(g)) : { value: null, predicate: null }
        };
        V.update(_e), V.activate(_e);
      }), () => {
        se.destroy(), ye.destroy(), V.update({
          source: ye,
          clients: /* @__PURE__ */ new Set([ye]),
          value: null,
          predicate: null
        });
      };
    });
  }
  Qe(() => {
    y(u, e.table, e.xField, e.groupField, e.filter);
  }), Qe(() => Ul(
    e.stateStore,
    () => ({
      brush: h(g),
      xScaleType: h(d),
      normalization: h(p)
    }),
    (P) => {
      W(g, P.brush), W(d, P.xScaleType), W(p, P.normalization);
    }
  ));
  function w(P, q, H) {
    let X = /* @__PURE__ */ new Map();
    for (let V of P) {
      let G = q(V), Z = X.get(G);
      Z || (Z = [], X.set(G, Z)), Z.push(V);
    }
    return new Map(X.entries().map(([V, G]) => [V, H(G)]));
  }
  function x(P) {
    if (typeof P == "string")
      return P;
    {
      let q = Yi(".6");
      if (P.length == 2)
        return `[${q(P[0])}, ${q(P[1])})`;
    }
    return "(invalid)";
  }
  var k = sD(), S = We(k);
  tt(S, "", {}, { height: "200px" });
  var _ = ne(S);
  rh(_, { children: (P, q = Ft, H = Ft) => {
    var X = fr(), V = We(X);
    {
      var G = (Z) => {
        gc(Z, {
          get width() {
            return q();
          },
          get height() {
            return H();
          },
          get xScale() {
            return h(m).xScale;
          },
          get yScale() {
            return h(m).yScale;
          },
          children: (Y, I = Ft) => {
            var K = iD();
            const ie = /* @__PURE__ */ oe(() => I().xScale), se = /* @__PURE__ */ oe(() => I().yScale);
            var ye = We(K);
            Gt(ye, 17, () => h(m)?.totals ?? [], or, (ue, Ae) => {
              var ze = nD();
              const Me = /* @__PURE__ */ oe(() => {
                const [Le, Ie] = h(ie).applyBand(h(Ae).x);
                return { x0: Le, x1: Ie };
              }), xe = /* @__PURE__ */ oe(() => {
                const [Le, Ie] = h(se).applyBand([0, h(Ae).total]);
                return { y0: Le, y1: Ie };
              }), ke = /* @__PURE__ */ oe(() => Math.min(Math.abs(h(Me).x1 - h(Me).x0) * 0.2, Math.abs(h(xe).y1 - h(xe).y0) * 0.2, 1));
              Ee(
                (Le, Ie, je, et) => {
                  J(ze, "x", Le), J(ze, "y", Ie), J(ze, "width", je), J(ze, "height", et), J(ze, "fill", h(f).markColorFade);
                },
                [
                  () => Math.min(h(Me).x0, h(Me).x1) + h(ke) / 2,
                  () => Math.min(h(xe).y0, h(xe).y1),
                  () => Math.abs(h(Me).x0 - h(Me).x1) - h(ke),
                  () => Math.abs(h(xe).y0 - h(xe).y1)
                ]
              ), te(ue, ze);
            });
            var _e = le(ye);
            Gt(_e, 17, () => h(m)?.items ?? [], or, (ue, Ae) => {
              let ze = () => h(Ae).x, Me = () => h(Ae).groups;
              var xe = fr();
              const ke = /* @__PURE__ */ oe(() => {
                const [Ie, je] = h(ie).applyBand(ze());
                return { x0: Ie, x1: je };
              });
              var Le = We(xe);
              Gt(Le, 17, Me, or, (Ie, je) => {
                var et = oD();
                const ht = /* @__PURE__ */ oe(() => {
                  const [wt, Xe] = h(se).applyBand([h(je).y1, h(je).y2]);
                  return { y0: wt, y1: Xe };
                }), xt = /* @__PURE__ */ oe(() => Math.min(Math.abs(h(ke).x1 - h(ke).x0) * 0.2, Math.abs(h(ht).y1 - h(ht).y0) * 0.2, 1));
                Ee(
                  (wt, Xe, it, Ht, nt) => {
                    J(et, "x", wt), J(et, "y", Xe), J(et, "width", it), J(et, "height", Ht), J(et, "fill", nt);
                  },
                  [
                    () => Math.min(h(ke).x0, h(ke).x1) + h(xt) / 2,
                    () => Math.min(h(ht).y0, h(ht).y1),
                    () => Math.abs(h(ke).x0 - h(ke).x1) - h(xt),
                    () => Math.abs(h(ht).y0 - h(ht).y1),
                    () => h(m)?.colorScale.apply(h(je).group)
                  ]
                ), te(Ie, et);
              }), te(ue, xe);
            });
            var be = le(_e);
            ih(be, {
              get proxy() {
                return I();
              },
              mode: "x",
              get value() {
                return h(g);
              },
              onChange: (ue) => W(g, ue != null && ue.x != null ? { x: ue.x } : null)
            }), te(Y, K);
          },
          $$slots: { default: !0 }
        });
      };
      Te(V, (Z) => {
        h(m) != null && Z(G);
      });
    }
    te(P, X);
  } }), ee(S);
  var E = le(S, 2), C = ne(E), R = ne(C);
  {
    var A = (P) => {
      var q = lD();
      Gt(q, 21, () => h(m).colorScale.domain, or, (H, X) => {
        var V = aD(), G = ne(V);
        let Z;
        var Y = le(G, 2), I = ne(Y, !0);
        ee(Y), ee(V), Ee(
          (K, ie, se) => {
            J(V, "title", K), Z = tt(G, "", Z, ie), rt(I, se);
          },
          [
            () => JSON.stringify(h(X)),
            () => ({ background: h(m).colorScale.apply(h(X)) }),
            () => x(h(X))
          ]
        ), te(H, V);
      }), ee(q), te(P, q);
    };
    Te(R, (P) => {
      h(m) && P(A);
    });
  }
  ee(C);
  var N = le(C, 2), L = ne(N);
  Us(L, {
    label: "X",
    get value() {
      return h(d);
    },
    set value(P) {
      W(d, P);
    }
  });
  var j = le(L, 2), B = le(ne(j), 2);
  ah(B, {
    options: [{ value: null, label: "off" }, { value: "x", label: "X" }],
    get value() {
      return h(p);
    },
    onChange: (P) => W(p, P)
  }), ee(j), ee(N), ee(E), te(t, k), mt(), n();
}
async function cD(t, e, r, n) {
  let i = T.column(r, e), a = await t.query(T.Query.from(T.Query.from(e).select({ value: T.sql`UNNEST(${i})` })).select({ value: "value", count: T.count() }).groupby("value").orderby(T.desc("count")).limit(n + 1)), l = Array.from(a);
  return {
    values: l.slice(0, n),
    hasOther: l.length > n
  };
}
function fD(t, e) {
  return T.or(...e.map((r) => T.sql`${T.literal(r)} IN ${T.column(t)}`));
}
var dD = /* @__PURE__ */ Se('<hr class="mt-1 mb-1 border-slate-300 dark:border-slate-500 border-dashed"/>'), hD = (
  // Adjust scale so the minimum width for non-zero count is 1px.
  // Query the stats
  // Sync selection with brush
  // Sync with state store
  (t, e, r) => e(h(r).x, t.shiftKey)
), pD = /* @__PURE__ */ Se('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), vD = /* @__PURE__ */ Se('<div class="absolute left-0 top-0 bottom-0 rounded-sm"></div> <div class="absolute left-0 top-0 bottom-0 rounded-sm"></div>', 1), gD = /* @__PURE__ */ Se('<!> <button class="text-left items-center flex py-0.5"><div class="w-40 flex-none overflow-hidden whitespace-nowrap text-ellipsis pr-1"><span> </span></div> <div class="flex-1 h-4 relative"><!></div> <div class="flex-none"><span><!></span></div></button>', 1), mD = (t, e, r) => {
  W(e, !h(e)), h(e) == !1 && W(r, null);
}, yD = /* @__PURE__ */ Se('<button class="py-0.5 text-left text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap text-ellipsis w-full overflow-hidden"><!></button>'), bD = /* @__PURE__ */ Se('<!> <div class="flex"><div class="flex-1 pl-40 mr-2 overflow-hidden"><!></div></div>', 1), xD = /* @__PURE__ */ Se('<div class="flex flex-col text-sm w-full select-none"><!></div>');
function wD(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(c, "$darkMode", r), a = 10, l = 100, u = yr.coordinator, c = yr.darkMode;
  let f = /* @__PURE__ */ ge(null), d = /* @__PURE__ */ ge(!1), p = /* @__PURE__ */ ge(null), g = /* @__PURE__ */ ge(400), m = /* @__PURE__ */ oe(() => h(p)?.items.reduce((j, B) => Math.max(j, B.total), 0) ?? 0), y = /* @__PURE__ */ oe(() => Zs([0, Math.max(1, h(m))], [0, h(g) - 250])), w = /* @__PURE__ */ oe(() => (j) => j != 0 ? Math.max(1, h(y)(j)) : 0), x = /* @__PURE__ */ oe(() => i() ? sn.dark : sn.light);
  function k(j, B, P, q, H) {
    let X = /* @__PURE__ */ ge(null);
    cD(j, B, P, H).then((G) => {
      W(X, G);
    });
    function V(G, Z, Y) {
      return jl({
        coordinator: j,
        selection: G,
        query: (I) => {
          let K = T.column(P, B);
          return T.Query.from(T.Query.from(B).select({ value: T.sql`UNNEST(${K})` }).where(I)).select({ x: "value", count: T.count() }).where(T.isIn("value", Z.map((ie) => T.literal(ie)))).groupby("value").orderby(T.desc("count"));
        },
        queryResult: (I) => {
          Y(Array.from(I));
        }
      });
    }
    Qe(() => {
      if (h(X) == null)
        return;
      let G = h(X).values.map((se) => se.value), Z = h(X).hasOther, Y = /* @__PURE__ */ ge([]), I = /* @__PURE__ */ ge([]), K = V(null, G, (se) => {
        W(Y, se);
      }), ie = V(q, G, (se) => {
        W(I, se);
      });
      return ie.reset = () => {
        W(f, null);
      }, Qe(() => {
        if (h(Y).length > 0) {
          let se = (ue) => JSON.stringify(ue), ye = new Map(h(Y).map(({ x: ue, count: Ae }) => [se(ue), Ae])), _e = new Map(h(I).map(({ x: ue, count: Ae }) => [se(ue), Ae])), be = G.map((ue) => ({
            x: ue,
            total: ye.get(se(ue)) ?? 0,
            selected: _e.get(se(ue)) ?? 0
          }));
          W(p, { items: be, firstSpecialIndex: G.length, hasOther: Z });
        }
      }), Qe(() => {
        let se = {
          source: ie,
          clients: /* @__PURE__ */ new Set([ie]),
          ...h(f) != null ? {
            value: h(f),
            predicate: fD(P, h(f))
          } : { value: null, predicate: null }
        };
        q.update(se), q.activate(se);
      }), () => {
        K.destroy(), ie.destroy(), q.update({
          source: ie,
          clients: /* @__PURE__ */ new Set([ie]),
          value: null,
          predicate: null
        });
      };
    });
  }
  Qe(() => {
    k(u, e.table, e.field, e.filter, h(d) ? l : a);
  });
  const S = (j, B) => JSON.stringify(j) == JSON.stringify(B);
  function _(j, B) {
    if (h(f) == null || h(f).length == 0)
      W(f, [j]);
    else {
      let P = h(f).findIndex((q) => S(q, j)) >= 0;
      B ? P ? W(f, h(f).filter((q) => !S(q, j))) : W(f, [...h(f), j]) : P ? W(f, null) : W(f, [j]);
    }
  }
  Qe(() => Ul(e.stateStore, () => ({ selection: h(f), expanded: h(d) }), (j) => {
    W(f, j.selection), W(d, j.expanded);
  }));
  const E = Yi(".6");
  function C(j) {
    return typeof j == "string" ? j : "[" + E(j[0]) + ", " + E(j[1]) + ")";
  }
  function R(j, B) {
    return B == 0 ? "-%" : (j / B * 100).toFixed(1) + "%";
  }
  var A = xD(), N = ne(A);
  {
    var L = (j) => {
      var B = bD(), P = We(B);
      Gt(P, 17, () => h(p).items, or, (G, Z, Y) => {
        var I = gD();
        const K = /* @__PURE__ */ oe(() => h(f) == null || h(f).length == 0 || h(f).findIndex((Xe) => S(Xe, h(Z).x)) >= 0), ie = /* @__PURE__ */ oe(() => !h(p).items.every((Xe) => Xe.total == Xe.selected));
        var se = We(I);
        {
          var ye = (Xe) => {
            var it = dD();
            te(Xe, it);
          };
          Te(se, (Xe) => {
            Y == h(p).firstSpecialIndex && Xe(ye);
          });
        }
        var _e = le(se, 2);
        _e.__click = [hD, _, Z];
        var be = ne(_e), ue = ne(be);
        let Ae;
        var ze = ne(ue, !0);
        ee(ue), ee(be);
        var Me = le(be, 2), xe = ne(Me);
        {
          var ke = (Xe) => {
            var it = pD(), Ht = We(it);
            let nt;
            var dr = le(Ht, 2);
            let qt;
            Ee(
              (Cr, sr) => {
                nt = tt(Ht, "", nt, Cr), qt = tt(dr, "", qt, sr);
              },
              [
                () => ({
                  background: h(x).markColorFade,
                  width: `${h(w)(h(Z).total) ?? ""}px`
                }),
                () => ({
                  background: h(x).markColor,
                  width: `${h(w)(h(Z).selected) ?? ""}px`
                })
              ]
            ), te(Xe, it);
          }, Le = (Xe) => {
            var it = vD(), Ht = We(it);
            let nt;
            var dr = le(Ht, 2);
            let qt;
            Ee(
              (Cr, sr) => {
                nt = tt(Ht, "", nt, Cr), qt = tt(dr, "", qt, sr);
              },
              [
                () => ({
                  background: h(x).markColorGrayFade,
                  width: `${h(w)(h(Z).total) ?? ""}px`
                }),
                () => ({
                  background: h(x).markColorGray,
                  width: `${h(w)(h(Z).selected) ?? ""}px`
                })
              ]
            ), te(Xe, it);
          };
          Te(xe, (Xe) => {
            h(K) ? Xe(ke) : Xe(Le, !1);
          });
        }
        ee(Me);
        var Ie = le(Me, 2), je = ne(Ie);
        let et;
        var ht = ne(je);
        {
          var xt = (Xe) => {
            var it = $n();
            Ee((Ht) => rt(it, Ht), [
              () => h(Z).selected.toLocaleString() + " / " + h(Z).total.toLocaleString()
            ]), te(Xe, it);
          }, wt = (Xe) => {
            var it = $n();
            Ee((Ht) => rt(it, Ht), [() => h(Z).total.toLocaleString()]), te(Xe, it);
          };
          Te(ht, (Xe) => {
            h(ie) ? Xe(xt) : Xe(wt, !1);
          });
        }
        ee(je), ee(Ie), ee(_e), Ee(
          (Xe, it, Ht, nt) => {
            J(_e, "title", h(Z).x), Ae = _r(ue, 1, "", null, Ae, Xe), rt(ze, it), et = _r(je, 1, "text-slate-400 dark:text-slate-500", null, et, Ht), J(je, "title", nt);
          },
          [
            () => ({
              "text-gray-400": !h(K),
              "dark:text-gray-400": !h(K)
            }),
            () => C(h(Z).x),
            () => ({
              "!text-gray-200": !h(K),
              "dark:!text-gray-600": !h(K)
            }),
            () => h(ie) ? `${h(Z).total.toLocaleString()} rows contain "${h(Z).x}"; ${h(Z).selected.toLocaleString()} (${R(h(Z).selected, h(Z).total)}) in selection` : `${h(Z).total.toLocaleString()} rows contain "${h(Z).x}"`
          ]
        ), te(G, I);
      });
      var q = le(P, 2), H = ne(q), X = ne(H);
      {
        var V = (G) => {
          var Z = yD();
          Z.__click = [mD, d, f];
          var Y = ne(Z);
          {
            var I = (ie) => {
              var se = $n();
              se.nodeValue = "↑ Show up to 10 values", te(ie, se);
            }, K = (ie) => {
              var se = $n();
              se.nodeValue = "↓ Show up to 100 values", te(ie, se);
            };
            Te(Y, (ie) => {
              h(d) ? ie(I) : ie(K, !1);
            });
          }
          ee(Z), te(G, Z);
        };
        Te(X, (G) => {
          (h(d) || h(p).hasOther) && G(V);
        });
      }
      ee(H), ee(q), te(j, B);
    };
    Te(N, (j) => {
      h(p) && j(L);
    });
  }
  ee(A), bl(A, "clientWidth", (j) => W(g, j)), te(t, A), mt(), n();
}
Tr(["click"]);
function kD(t) {
  t.key == "Escape" && t.stopPropagation();
}
var _D = /* @__PURE__ */ Se("<input/>");
function G3(t, e) {
  gt(e, !0);
  let r = Je(e, "value", 15), n = Je(e, "type", 3, "text"), i = Je(e, "placeholder", 3, ""), a = Je(e, "className", 3, "");
  var l = _D();
  nC(l), l.__keydown = [kD], Ee(() => {
    J(l, "type", n()), J(l, "placeholder", i()), _r(l, 1, `form-input rounded-md py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 ${a() ?? "" ?? ""}`);
  }), cC(l, r), te(t, l), mt();
}
Tr(["keydown"]);
var SD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M3.2 5.74a.75.75 0 0 1 1.06-.04L8 9.227L11.74 5.7a.75.75 0 1 1 1.02 1.1l-4.25 4a.75.75 0 0 1-1.02 0l-4.25-4a.75.75 0 0 1-.04-1.06"></path></svg>');
function X3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = SD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var MD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M3.2 10.26a.75.75 0 0 0 1.06.04L8 6.773l3.74 3.527a.75.75 0 1 0 1.02-1.1l-4.25-4a.75.75 0 0 0-1.02 0l-4.25 4a.75.75 0 0 0-.04 1.06"></path></svg>');
function Y3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = MD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var CD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M2.75 2a.75.75 0 0 1 .75.75v12.5c0 .69.56 1.25 1.25 1.25h12.5a.75.75 0 0 1 0 1.5H4.75A2.75 2.75 0 0 1 2 15.25V2.75A.75.75 0 0 1 2.75 2M10 7.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0m4.5.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5m.5 4.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0"></path></svg>');
function RD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = CD();
  ro(n, () => ({ viewBox: "0 0 20 20", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var AD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="m2.397 2.554l.073-.084a.75.75 0 0 1 .976-.073l.084.073L8 6.939l4.47-4.47a.75.75 0 1 1 1.06 1.061L9.061 8l4.47 4.47a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-.976.073l-.084-.073L8 9.061l-4.47 4.47a.75.75 0 0 1-1.06-1.061L6.939 8l-4.47-4.47a.75.75 0 0 1-.072-.976l.073-.084z"></path></svg>');
function lh(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = AD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var ED = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M9 1H6a2 2 0 0 0-2 2v2.205a5.5 5.5 0 0 1 4.666 9.791H12a2 2 0 0 0 2-2V6.001h-3.5A1.5 1.5 0 0 1 9 4.5zm4.997 4h-3.498a.5.5 0 0 1-.5-.5V1h.01zM10 10.5a4.5 4.5 0 1 1-9 0a4.5 4.5 0 0 1 9 0m-4.854 2.353l.003.003a.5.5 0 0 0 .348.144h.006a.5.5 0 0 0 .35-.146l2-2a.5.5 0 0 0-.707-.708L6 11.293V8.5a.5.5 0 0 0-1 0v2.793l-1.146-1.147a.5.5 0 0 0-.708.708z"></path></svg>');
function jx(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = ED();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var TD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M10.529 1.764a2.621 2.621 0 1 1 3.707 3.707l-.779.779L9.75 2.543zM9.043 3.25L2.657 9.636a2.96 2.96 0 0 0-.772 1.354l-.87 3.386a.5.5 0 0 0 .61.608l3.385-.869a2.95 2.95 0 0 0 1.354-.772l6.386-6.386z"></path></svg>');
function K3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = TD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var $D = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M2 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zm3-2a2 2 0 0 0-2 2v5h14V6a2 2 0 0 0-2-2z"></path></svg>');
function FD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = $D();
  ro(n, () => ({ viewBox: "0 0 20 20", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var ND = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M15 3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM5 4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h6.5V4z"></path></svg>');
function zD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = ND();
  ro(n, () => ({ viewBox: "0 0 20 20", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var OD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M9.823 10.883a5.5 5.5 0 1 1 1.06-1.06l2.897 2.897a.75.75 0 1 1-1.06 1.06zM10.5 6.5a4 4 0 1 0-8 0a4 4 0 0 0 8 0"></path></svg>');
function BD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = OD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var DD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M2.267 6.153A6 6 0 0 1 3.53 3.98a.36.36 0 0 1 .382-.095l1.36.484a.71.71 0 0 0 .935-.538l.26-1.416a.35.35 0 0 1 .274-.282a6.1 6.1 0 0 1 2.52 0c.14.03.248.141.274.282l.26 1.416a.708.708 0 0 0 .935.538l1.36-.484a.36.36 0 0 1 .382.095a6 6 0 0 1 1.262 2.173a.35.35 0 0 1-.108.378l-1.102.931a.703.703 0 0 0 0 1.076l1.102.931c.11.093.152.242.108.378a6 6 0 0 1-1.262 2.173a.36.36 0 0 1-.382.095l-1.36-.484a.71.71 0 0 0-.935.538l-.26 1.416a.35.35 0 0 1-.275.282a6.1 6.1 0 0 1-2.519 0a.35.35 0 0 1-.275-.282l-.259-1.416a.708.708 0 0 0-.935-.538l-1.36.484a.36.36 0 0 1-.382-.095a6 6 0 0 1-1.262-2.173a.35.35 0 0 1 .108-.378l1.102-.931a.704.704 0 0 0 0-1.076l-1.102-.931a.35.35 0 0 1-.108-.378M6.25 8a1.75 1.75 0 1 0 3.5 0a1.75 1.75 0 0 0-3.5 0"></path></svg>');
function PD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = DD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var LD = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M7.456 2a6 6 0 1 1-5.406 8.605a.5.5 0 0 1 .36-.71c1.276-.231 3.278-.937 4.078-3.07c.563-1.5.512-3.015.283-4.23a.5.5 0 0 1 .475-.591Q7.35 2 7.456 2"></path></svg>');
function qD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = LD();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var ID = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M8 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 1m0 10a3 3 0 1 0 0-6a3 3 0 0 0 0 6m6.5-2.5a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1zM8 13a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 13M2.5 8.5a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1zm.646-5.354a.5.5 0 0 1 .708 0l1 1a.5.5 0 1 1-.708.708l-1-1a.5.5 0 0 1 0-.708m.708 9.708a.5.5 0 1 1-.708-.707l1-1a.5.5 0 0 1 .708.707zm9-9.708a.5.5 0 0 0-.708 0l-1 1a.5.5 0 0 0 .708.708l1-1a.5.5 0 0 0 0-.708m-.708 9.708a.5.5 0 0 0 .708-.707l-1-1a.5.5 0 0 0-.708.707z"></path></svg>');
function jD(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = ID();
  ro(n, () => ({ viewBox: "0 0 16 16", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var UD = (t, e, r, n) => {
  t.shiftKey ? W(e, h(r) ? h(e).filter((i) => i != h(n).predicate) : [...h(e), h(n).predicate]) : h(r) ? W(e, []) : W(e, [h(n).predicate]);
}, WD = /* @__PURE__ */ Se('<div><button class="flex-1 overflow-hidden text-left"><div class="text-ellipsis overflow-hidden w-full"> </div> <div class="text-ellipsis overflow-hidden w-full"><code class="text-xs whitespace-nowrap"> </code></div></button> <div class="flex-none flex gap-1"><!> <!></div></div>'), HD = (t, e, r) => {
  W(e, !0), W(r, null);
}, VD = (t, e, r) => W(e, r()?.trim() ?? "", !0), GD = /* @__PURE__ */ Se('<div class="mt-4"><!> <div class="text-slate-500 dark:text-slate-400 text-sm mb-1">SQL Predicate</div> <!> <div class="flex gap-2"><!> <!> <div class="flex-1"></div> <button class="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Current Predicate</button></div></div>'), XD = /* @__PURE__ */ Se('<div><div class="flex flex-col gap-1"><!> <button class="text-left text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 whitespace-nowrap text-ellipsis w-full overflow-hidden">+ Add Selection</button></div> <!></div>');
function YD(t, e) {
  gt(e, !0);
  const r = yr.coordinator;
  let n = /* @__PURE__ */ ge([]), i = /* @__PURE__ */ ge([]), a = /* @__PURE__ */ ge(!1), l = /* @__PURE__ */ ge(null), u = /* @__PURE__ */ ge(""), c = /* @__PURE__ */ ge("");
  function f() {
    W(a, !1), W(l, null), W(c, ""), W(u, "");
  }
  function d(_) {
    W(n, _), W(i, h(i).filter((E) => h(n).find((C) => C.predicate == E) != null));
  }
  async function p() {
    let _ = h(c).trim();
    _ == "" && (_ = "Selection");
    let E = h(u).trim();
    if (E == "")
      return null;
    try {
      await r.query(T.Query.from(e.table).select({ count: T.count() }).where(E));
    } catch (C) {
      return alert(C.toString()), null;
    }
    return { name: _, predicate: E };
  }
  function g() {
    let _ = e.filter.predicate(null);
    return _ == null || _.length == 0 ? null : typeof _ == "string" ? _ : _.map((E) => E.toString()).join(`
AND `);
  }
  Qe(() => {
    let _ = m9({
      coordinator: r,
      selection: e.filter,
      query: () => T.sql`SELECT 1`
    });
    return yn(() => {
      if (h(i).length == 0)
        e.filter.update({
          source: _,
          clients: /* @__PURE__ */ new Set([_]),
          predicate: null,
          value: null
        });
      else {
        let E = h(i).map((C) => "(" + C + ")").join(" OR ");
        e.filter.update({
          source: _,
          clients: /* @__PURE__ */ new Set([_]),
          predicate: T.asVerbatim(E),
          value: E
        });
      }
    }), _.reset = () => W(i, []), () => {
      _.destroy();
    };
  }), Qe(() => Ul(
    e.stateStore,
    () => ({
      items: h(n),
      selectedPredicates: h(i)
    }),
    (_) => {
      W(n, _.items ?? []), W(i, _.selectedPredicates ?? []);
    }
  ));
  var m = XD(), y = ne(m), w = ne(y);
  Gt(w, 17, () => h(n), or, (_, E) => {
    var C = WD();
    const R = /* @__PURE__ */ oe(() => h(i).indexOf(h(E).predicate) >= 0);
    let A;
    var N = ne(C);
    N.__click = [UD, i, R, E];
    var L = ne(N), j = ne(L, !0);
    ee(L);
    var B = le(L, 2), P = ne(B), q = ne(P, !0);
    ee(P), ee(B), ee(N);
    var H = le(N, 2), X = ne(H);
    Oo(X, {
      get icon() {
        return K3;
      },
      style: "plotCell",
      onClick: () => {
        W(l, h(E)), W(u, h(E).predicate, !0), W(c, h(E).name, !0), W(a, !0);
      }
    });
    var V = le(X, 2);
    Oo(V, {
      get icon() {
        return lh;
      },
      style: "plotCell",
      onClick: () => {
        d(h(n).filter((G) => G !== h(E)));
      }
    }), ee(H), ee(C), Ee(
      (G) => {
        A = _r(C, 1, "flex gap-4 w-full bg-white dark:bg-slate-800 p-2 rounded-md border border-slate-200 dark:border-slate-600 select-none", null, A, G), rt(j, h(E).name), J(P, "title", h(E).predicate), rt(q, h(E).predicate);
      },
      [
        () => ({
          "!bg-blue-100": h(R),
          "!border-blue-400": h(R),
          "dark:!bg-blue-800": h(R),
          "dark:!border-blue-600": h(R)
        })
      ]
    ), te(_, C);
  });
  var x = le(w, 2);
  x.__click = [HD, a, l], ee(y);
  var k = le(y, 2);
  {
    var S = (_) => {
      var E = GD(), C = ne(E);
      G3(C, {
        placeholder: "name",
        className: "w-full mb-2",
        get value() {
          return h(c);
        },
        set value(q) {
          W(c, q, !0);
        }
      });
      var R = le(C, 4);
      Dg(R, {
        language: "sql",
        className: "!h-24 mb-2",
        get value() {
          return h(u);
        },
        onChange: (q) => W(u, q, !0)
      });
      var A = le(R, 2), N = ne(A);
      {
        var L = (q) => {
          Oo(q, {
            label: "Update",
            onClick: async () => {
              let H = await p();
              H && (d(h(n).map((X) => X === h(l) ? H : X)), f());
            }
          });
        }, j = (q) => {
          Oo(q, {
            label: "Add",
            onClick: async () => {
              let H = await p();
              H && (d([...h(n), H]), f());
            }
          });
        };
        Te(N, (q) => {
          h(l) != null ? q(L) : q(j, !1);
        });
      }
      var B = le(N, 2);
      Oo(B, {
        label: "Cancel",
        onClick: () => {
          W(l, null), W(a, !1);
        }
      });
      var P = le(B, 4);
      P.__click = [VD, u, g], ee(A), ee(E), te(_, E);
    };
    Te(k, (_) => {
      h(a) && _(S);
    });
  }
  ee(m), te(t, m), mt();
}
Tr(["click"]);
function KD(t, e) {
  let r = e.mark?.plot?.element;
  return r == null ? !1 : t?.contains(r) ?? !1;
}
async function ZD(t, e, r, n) {
  if (r == null || e == null)
    return null;
  let i = /* @__PURE__ */ new Map();
  for (let c in n)
    i.set(c, n[c]);
  let a = dv(r), l = S9({ coordinator: t }), u = (await M9(a, { params: i, api: l })).element;
  return e.appendChild(u), () => {
    for (let c in n) {
      let f = n[c];
      if (m0(f))
        for (let d of f.clauses)
          KD(e, d.source) && (d.source?.reset(), f.update({ ...d, value: null, predicate: null }));
    }
    u.remove();
  };
}
var QD = /* @__PURE__ */ Se('<div class="w-full"></div>');
function JD(t, e) {
  gt(e, !0);
  const r = yr.coordinator;
  let n, i = /* @__PURE__ */ ge(100);
  const a = {
    continuousColorScheme: gu.value("YlGnBu"),
    continuousColorSchemeZero: gu.value("black"),
    markColor: gu.value("black"),
    markColorFade: gu.value("black"),
    containerWidth: gu.value(100)
  };
  yn(() => yr.darkMode.subscribe((u) => {
    let c = u ? sn.dark : sn.light;
    a.continuousColorScheme.update(c.continuousColorScheme), a.continuousColorSchemeZero.update(c.continuousColorSchemeAtZero), a.markColor.update(c.markColor), a.markColorFade.update(c.markColorFade);
  })), yn(() => {
    a.containerWidth.update(h(i));
  }), bc(() => {
    Qe(() => {
      let u = null;
      async function c(...f) {
        u = await ZD(...f);
      }
      return c(r, n, e.spec, { ...a, ...e.params }), () => {
        u?.();
      };
    });
  });
  var l = QD();
  Wo(l, (u) => n = u, () => n), bl(l, "clientWidth", (u) => W(i, u)), te(t, l), mt();
}
var eP = /* @__PURE__ */ Se('<div>An error occurred in this chart. Please check and <button class="underline">try again</button>. <div class="text-xs"> </div></div>');
function Z3(t, e) {
  gt(e, !0);
  const r = {
    BoxPlot: FB,
    CountPlot: WB,
    Histogram: KB,
    Histogram2D: rD,
    HistogramStack: uD,
    ListCountPlot: wD,
    SelectionList: YD
  };
  var n = fr(), i = We(n);
  vM(i, { failed: (a, l = Ft, u = Ft) => {
    var c = eP(), f = le(ne(c));
    f.__click = function(...g) {
      u()?.apply(this, g);
    };
    var d = le(f, 2), p = ne(d, !0);
    ee(d), ee(c), Ee((g) => rt(p, g), [() => l()?.toString() ?? "unknown"]), te(a, c);
  } }, (a) => {
    var l = fr(), u = We(l);
    {
      var c = (d) => {
        var p = fr();
        const g = /* @__PURE__ */ oe(() => r[e.spec.component]);
        var m = We(p);
        Dv(m, () => h(g), (y, w) => {
          w(y, yC(() => e.spec.props, {
            get table() {
              return e.table;
            },
            get filter() {
              return e.filter;
            },
            get stateStore() {
              return e.stateStore;
            }
          }));
        }), te(d, p);
      }, f = (d) => {
        {
          let p = /* @__PURE__ */ oe(() => ({ brush: e.filter }));
          JD(d, {
            get spec() {
              return e.spec;
            },
            get params() {
              return h(p);
            }
          });
        }
      };
      Te(u, (d) => {
        "component" in e.spec ? d(c) : d(f, !1);
      });
    }
    te(a, l);
  }), te(t, n), mt();
}
Tr(["click"]);
function tP(t, e, r, n) {
  let i = h(e).create(r());
  i && n.onCreate?.({ id: Qa(), title: i.title, spec: i.spec });
}
var rP = (t, e, r) => {
  W(e, h(r));
}, nP = /* @__PURE__ */ Se("<button><!></button>"), oP = /* @__PURE__ */ Se('<span class="text-slate-500 dark:text-slate-400"> </span> <!>', 1), iP = /* @__PURE__ */ Se("<!> <!>", 1), aP = /* @__PURE__ */ Se('<span class="text-slate-500 dark:text-slate-400">Preview</span> <!>', 1), lP = /* @__PURE__ */ Se("<div> </div>"), sP = /* @__PURE__ */ Se('<div class="flex flex-col gap-2"><div class="flex gap-2"></div> <div> </div> <!> <button>Confirm</button> <!> <!></div>');
function uP(t, e) {
  gt(e, !0);
  let r = Je(e, "columns", 19, () => []), n = [
    {
      icon: "chart-h-bar",
      description: "Create a count plot of a categorical field",
      ui: [
        {
          field: {
            key: "x",
            label: "Field",
            types: ["number", "string", "string[]"]
          }
        }
      ],
      preview: !0,
      create: ({ x: R }) => {
        if (R != null)
          return { title: R.name, spec: Vf(R) };
      }
    },
    {
      icon: "chart-v-histogram",
      description: "Create a histogram of a field",
      ui: [
        {
          field: { key: "x", label: "Field", types: ["number", "string"] }
        }
      ],
      preview: !0,
      create: ({ x: R }) => {
        if (R != null)
          return { title: R.name, spec: W3(R) };
      }
    },
    {
      icon: "chart-heatmap",
      description: "Create a 2D heatmap of two fields",
      ui: [
        {
          field: { key: "x", label: "X Field", types: ["number", "string"] }
        },
        //
        {
          field: { key: "y", label: "Y Field", types: ["number", "string"] }
        }
        //
      ],
      preview: !0,
      create: ({ x: R, y: A }) => {
        if (!(R == null || A == null))
          return {
            title: `${R.name} vs. ${A.name}`,
            spec: SB(R, A)
          };
      }
    },
    {
      icon: "chart-stacked",
      description: "Create a stacked histogram",
      ui: [
        {
          field: { key: "x", label: "X Field", types: ["number", "string"] }
        },
        //
        {
          field: { key: "y", label: "Group Field", types: ["number", "string"] }
        }
        //
      ],
      preview: !0,
      create: ({ x: R, y: A }) => {
        if (!(R == null || A == null))
          return {
            title: `${R.name} by ${A.name}`,
            spec: _B(R, A)
          };
      }
    },
    {
      icon: "chart-boxplot",
      description: "Create a box plot",
      ui: [
        { field: { key: "x", label: "X Field" } },
        //
        { field: { key: "y", label: "Y Field", types: ["number"] } }
        //
      ],
      preview: !0,
      create: ({ x: R, y: A }) => {
        if (!(R == null || A == null))
          return { title: `${R.name} vs. ${A.name}`, spec: MB(R, A) };
      }
    },
    {
      icon: "chart-spec",
      description: "Create a chart with Mosaic specification",
      ui: [
        {
          text: { key: "spec", placeholder: "{ /* Mosaic spec in JSON */ }" }
        }
      ],
      preview: !1,
      create: ({ spec: R }) => {
        if (typeof R != "string" || R.trim() == "")
          return;
        let A = JSON.parse(R);
        return dv(A), { title: "Mosaic Chart", spec: A };
      }
    }
  ], i = /* @__PURE__ */ ge(n[0]), a = /* @__PURE__ */ ge(mo({})), l = /* @__PURE__ */ ge(!1), u = /* @__PURE__ */ ge(null);
  Qe(() => {
    h(i), W(a, {}, !0);
  }), Qe(() => {
    try {
      let R = h(i).create(c());
      W(l, R != null), W(u, h(i).preview ? R?.spec ?? null : null, !0);
    } catch (R) {
      W(l, R.toString(), !0);
    }
  });
  function c() {
    let R = { ...h(a) };
    for (let A of h(i).ui)
      A.field && (R[A.field.key] = f(R[A.field.key]));
    return R;
  }
  function f(R) {
    let A = r().find((N) => N.name == R);
    if (A == null || A.jsType == null)
      return null;
    switch (A.jsType) {
      case "number":
        return { name: A.name, type: "continuous" };
      case "string":
        return { name: A.name, type: "discrete" };
      case "string[]":
        return { name: A.name, type: "discrete[]" };
      default:
        return null;
    }
  }
  function d(R) {
    return R == null ? r().filter((A) => A.jsType != null) : r().filter((A) => A.jsType != null && R.indexOf(A.jsType) >= 0);
  }
  var p = sP(), g = ne(p);
  Gt(g, 21, () => n, or, (R, A) => {
    var N = nP();
    const L = /* @__PURE__ */ oe(() => h(i) == h(A));
    N.__click = [rP, i, A];
    let j;
    var B = ne(N);
    Rz(B, {
      get type() {
        return h(A).icon;
      }
    }), ee(N), Ee(
      (P) => {
        J(N, "title", h(A).description), j = _r(N, 1, "rounded-md border border-slate-300 dark:border-slate-600", null, j, P);
      },
      [
        () => ({
          "!border-slate-500": h(L),
          "dark:!border-slate-400": h(L),
          "!bg-slate-300": h(L),
          "dark:!bg-slate-600": h(L)
        })
      ]
    ), te(R, N);
  }), ee(g);
  var m = le(g, 2), y = ne(m, !0);
  ee(m);
  var w = le(m, 2);
  Gt(w, 17, () => h(i).ui, or, (R, A) => {
    var N = iP(), L = We(N);
    {
      var j = (q) => {
        var H = oP();
        const X = /* @__PURE__ */ oe(() => h(A).field.key);
        var V = We(H), G = ne(V, !0);
        ee(V);
        var Z = le(V, 2);
        {
          let Y = /* @__PURE__ */ oe(() => h(a)[h(X)] ?? null), I = /* @__PURE__ */ oe(() => d(h(A).field.types).map((K) => ({ value: K.name, label: `${K.name} (${K.type})` })));
          Za(Z, {
            get value() {
              return h(Y);
            },
            onChange: (K) => h(a)[h(X)] = K,
            placeholder: "(select field)",
            class: "w-full",
            get options() {
              return h(I);
            }
          });
        }
        Ee(() => rt(G, h(A).field.label)), te(q, H);
      };
      Te(L, (q) => {
        h(A).field && q(j);
      });
    }
    var B = le(L, 2);
    {
      var P = (q) => {
        const H = /* @__PURE__ */ oe(() => h(A).text.key);
        Dg(q, {
          language: "json",
          get value() {
            return h(a)[h(H)];
          },
          onChange: (X) => h(a)[h(H)] = X
        });
      };
      Te(B, (q) => {
        h(A).text && q(P);
      });
    }
    te(R, N);
  });
  var x = le(w, 2);
  let k;
  x.__click = [tP, i, c, e];
  var S = le(x, 2);
  {
    var _ = (R) => {
      var A = aP(), N = le(We(A), 2);
      Ld(N, () => h(u), (L) => {
        Z3(L, {
          get table() {
            return e.table;
          },
          get filter() {
            return e.filter;
          },
          get spec() {
            return h(u);
          }
        });
      }), te(R, A);
    };
    Te(S, (R) => {
      h(u) != null && R(_);
    });
  }
  var E = le(S, 2);
  {
    var C = (R) => {
      var A = lP(), N = ne(A, !0);
      ee(A), Ee(() => rt(N, h(l))), te(R, A);
    };
    Te(E, (R) => {
      typeof h(l) == "string" && h(l).trim() != "" && R(C);
    });
  }
  ee(p), Ee(
    (R) => {
      rt(y, h(i).description), k = _r(x, 1, "px-2 mt-2 h-8 w-24 rounded-md text-white text-sm", null, k, R), x.disabled = h(l) !== !0;
    },
    [
      () => ({
        "bg-blue-500": h(l) === !0,
        "bg-gray-400": h(l) !== !0,
        "dark:bg-gray-600": h(l) !== !0
      })
    ]
  ), te(t, p), mt();
}
Tr(["click"]);
function cP(t, e, r, n, i) {
  let a = e(h(r));
  if (a != null) {
    W(n, a, !0);
    return;
  }
  i.onConfirm(JSON.parse(h(r)));
}
function fP(t, e) {
  e.onCancel();
}
var dP = /* @__PURE__ */ Se('<div class="pt-2"><!> <div class="flex gap-1 items-center"><div class="flex-1"><a class="underline pr-2" href="https://uwdata.github.io/mosaic/api/spec/format.html" target="_blank">Mosaic Spec Reference</a></div> <button class="px-2 h-8 rounded-md bg-blue-500 text-white text-sm">Confirm</button> <button class="px-2 h-8 rounded-md bg-slate-500 text-white text-sm">Cancel</button></div> <div> </div></div>');
function hP(t, e) {
  gt(e, !0);
  let r = /* @__PURE__ */ ge(mo(JSON.stringify(e.spec, null, 2))), n = /* @__PURE__ */ ge("");
  Qe(() => {
    W(n, i(h(r)) ?? "", !0);
  });
  function i(g) {
    try {
      let m = JSON.parse(g);
      "component" in m || dv(m);
    } catch (m) {
      return m.toString();
    }
    return null;
  }
  var a = dP(), l = ne(a);
  Dg(l, {
    language: "json",
    get value() {
      return h(r);
    },
    onChange: (g) => W(r, g, !0),
    className: "mb-2"
  });
  var u = le(l, 2), c = le(ne(u), 2);
  c.__click = [cP, i, r, n, e];
  var f = le(c, 2);
  f.__click = [fP, e], ee(u);
  var d = le(u, 2), p = ne(d, !0);
  ee(d), ee(a), Ee(() => rt(p, h(n))), te(t, a), mt();
}
Tr(["click"]);
var pP = (t, e) => W(e, !h(e)), vP = /* @__PURE__ */ Se('<div class="text-sm pr-0.5"><!></div>'), gP = /* @__PURE__ */ Se('<div class="text-sm pr-0.5"><!></div>'), mP = /* @__PURE__ */ Se("<div><!></div>"), yP = /* @__PURE__ */ Se("<!> <!>", 1), bP = /* @__PURE__ */ Se('<div class="group"><div class="px-2 pt-2 flex items-center"><button class="font-mono font-medium py-1 text-left flex flex-1 mr-2 overflow-hidden items-center"><!> <div class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis"> </div></button> <div class="flex-none flex gap-0.5 opacity-0 group-hover:opacity-100"><!> <!></div></div> <div><div class="overflow-hidden px-2 pb-2"><div class="pt-2"></div> <!></div></div></div>');
function xP(t, e) {
  gt(e, !0);
  let r = /* @__PURE__ */ ge(!1), n = /* @__PURE__ */ ge(!0);
  var i = bP(), a = ne(i), l = ne(a);
  l.__click = [pP, n];
  var u = ne(l);
  {
    var c = (R) => {
      var A = vP(), N = ne(A);
      Y3(N, {}), ee(A), te(R, A);
    }, f = (R) => {
      var A = gP(), N = ne(A);
      X3(N, {}), ee(A), te(R, A);
    };
    Te(u, (R) => {
      h(n) ? R(c) : R(f, !1);
    });
  }
  var d = le(u, 2), p = ne(d, !0);
  ee(d), ee(l);
  var g = le(l, 2), m = ne(g);
  {
    var y = (R) => {
      Oo(R, {
        get icon() {
          return K3;
        },
        order: 1,
        style: "plotCell",
        title: "Edit spec",
        onClick: () => W(r, !0)
      });
    };
    Te(m, (R) => {
      e.plot.spec != null && !h(r) && R(y);
    });
  }
  var w = le(m, 2);
  Gu(w, () => e.buttons ?? Ft), ee(g), ee(a);
  var x = le(a, 2);
  let k;
  var S = ne(x), _ = le(ne(S), 2);
  {
    var E = (R) => {
      var A = yP(), N = We(A);
      Z3(N, {
        get table() {
          return e.table;
        },
        get filter() {
          return e.filter;
        },
        get spec() {
          return e.plot.spec;
        },
        get stateStore() {
          return e.stateStore;
        }
      });
      var L = le(N, 2);
      {
        var j = (B) => {
          var P = mP(), q = ne(P);
          hP(q, {
            get spec() {
              return e.plot.spec;
            },
            onConfirm: (H) => {
              W(r, !1), e.onChange?.({ ...e.plot, spec: H });
            },
            onCancel: () => {
              W(r, !1);
            }
          }), ee(P), ed(3, P, () => rd), te(B, P);
        };
        Te(L, (B) => {
          h(r) && B(j);
        });
      }
      te(R, A);
    }, C = (R) => {
      uP(R, {
        get table() {
          return e.table;
        },
        get filter() {
          return e.filter;
        },
        get columns() {
          return e.columns;
        },
        onCreate: (A) => {
          e.onChange?.(A);
        }
      });
    };
    Te(_, (R) => {
      e.plot.spec != null ? R(E) : R(C, !1);
    });
  }
  ee(S), ee(x), ee(i), Ee(
    (R) => {
      rt(p, e.plot.title), k = tt(x, "", k, R);
    },
    [
      () => ({
        display: "grid",
        "grid-template-rows": h(n) ? "1fr" : "0fr",
        transition: "grid-template-rows 300ms ease-in-out"
      })
    ]
  ), te(t, i), mt();
}
Tr(["click"]);
var wP = (t, e) => e(), kP = /* @__PURE__ */ Se("<!> <!> <!>", 1), _P = /* @__PURE__ */ Se('<div class="flex-none bg-slate-100 dark:bg-slate-700 rounded-md"><!></div>'), SP = /* @__PURE__ */ Se('<div><button class="flex-none bg-slate-100 dark:bg-slate-700 rounded-md p-2 text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-600 dark:hover:text-slate-100 select-none focus-visible:outline-2 outline-blue-600 -outline-offset-2">+ Add Chart</button> <!></div>');
function MP(t, e) {
  gt(e, !0);
  let r = Je(e, "plots", 15), n = Je(e, "layout", 3, "sidebar");
  function i() {
    r([
      { id: Qa(), title: "New Chart", spec: null },
      ...r()
    ]);
  }
  function a(m) {
    r(r().filter((y) => y !== m));
  }
  function l(m, y) {
    r(r().map((w) => w === m ? y : w));
  }
  function u(m, y) {
    let w = r().indexOf(m);
    if (w < 0)
      return;
    let x = r().slice();
    if (y == "up" && w > 0) {
      let k = x[w - 1];
      x[w - 1] = m, x[w] = k;
    }
    if (y == "down" && w < r().length - 1) {
      let k = x[w + 1];
      x[w + 1] = m, x[w] = k;
    }
    r(x);
  }
  var c = SP();
  let f;
  var d = ne(c);
  d.__click = [wP, i];
  let p;
  var g = le(d, 2);
  Gt(g, 26, r, (m) => m, (m, y, w) => {
    var x = _P();
    let k;
    var S = ne(x);
    {
      const _ = (C) => {
        var R = kP(), A = We(R);
        {
          var N = (P) => {
            Oo(P, {
              get icon() {
                return Y3;
              },
              title: "Move up",
              style: "plotCell",
              order: 3,
              onClick: () => u(y, "up")
            });
          };
          Te(A, (P) => {
            h(w) > 0 && P(N);
          });
        }
        var L = le(A, 2);
        {
          var j = (P) => {
            Oo(P, {
              get icon() {
                return X3;
              },
              title: "Move down",
              style: "plotCell",
              order: 4,
              onClick: () => u(y, "down")
            });
          };
          Te(L, (P) => {
            h(w) < r().length - 1 && P(j);
          });
        }
        var B = le(L, 2);
        Oo(B, {
          get icon() {
            return lh;
          },
          style: "plotCellClose",
          title: "Close",
          order: 5,
          onClick: () => a(y)
        }), te(C, R);
      };
      let E = /* @__PURE__ */ oe(() => e.stateStores?.store(y.id));
      xP(S, {
        get table() {
          return e.table;
        },
        get plot() {
          return y;
        },
        get filter() {
          return e.filter;
        },
        get columns() {
          return e.columns;
        },
        onChange: (C) => l(y, C),
        get stateStore() {
          return h(E);
        },
        buttons: _,
        $$slots: { buttons: !0 }
      });
    }
    ee(x), Ee((_) => k = tt(x, "", k, _), [() => ({ width: n() == "full" ? "400px" : null })]), uC(x, () => VN, () => ({ duration: 300 })), ed(2, x, () => rd), te(m, x);
  }), ee(c), Ee(
    (m, y) => {
      f = _r(c, 1, "flex gap-2", null, f, m), p = tt(d, "", p, y);
    },
    [
      () => ({
        "flex-col": n() == "sidebar",
        "flex-row": n() == "full",
        "flex-wrap": n() == "full"
      }),
      () => ({ width: n() == "full" ? "400px" : null })
    ]
  ), te(t, c), mt();
}
Tr(["click"]);
var CP = /* @__PURE__ */ Se('<div> <span class="text-slate-500"> </span></div>');
function RP(t, e) {
  gt(e, !0);
  const r = yr.coordinator;
  let n = /* @__PURE__ */ ge(null), i = /* @__PURE__ */ ge(null);
  yn(() => {
    let f = { coordinator: r, table: e.table, filter: e.filter };
    W(n, null), W(i, null), f.coordinator.query(Fs.from(f.table).select({ count: ms`COUNT(*)::INT` })).then((p) => {
      W(n, p.getChild("count").get(0), !0);
    });
    let d = jl({
      coordinator: f.coordinator,
      selection: f.filter,
      query: (p) => Fs.from(f.table).select({ count: ms`COUNT(*)::INT` }).where(p),
      queryResult: (p) => {
        W(i, p.getChild("count").get(0), !0);
      }
    });
    return () => {
      d.destroy();
    };
  });
  var a = CP(), l = ne(a), u = le(l), c = ne(u);
  ee(u), ee(a), Ee(
    (f, d) => {
      rt(l, `${f ?? ""} `), rt(c, `/ ${d ?? ""} points`);
    },
    [
      () => h(i)?.toLocaleString() ?? "",
      () => h(n)?.toLocaleString() ?? ""
    ]
  ), te(t, a), mt();
}
function AP(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var sv = { exports: {} };
/*!***************************************************
* mark.js v8.11.1
* https://markjs.io/
* Copyright (c) 2014–2018, Julian Kühnel
* Released under the MIT license https://git.io/vwTVl
*****************************************************/
var EP = sv.exports, Ux;
function TP() {
  return Ux || (Ux = 1, function(t, e) {
    (function(r, n) {
      t.exports = n();
    })(EP, function() {
      var r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(f) {
        return typeof f;
      } : function(f) {
        return f && typeof Symbol == "function" && f.constructor === Symbol && f !== Symbol.prototype ? "symbol" : typeof f;
      }, n = function(f, d) {
        if (!(f instanceof d))
          throw new TypeError("Cannot call a class as a function");
      }, i = /* @__PURE__ */ function() {
        function f(d, p) {
          for (var g = 0; g < p.length; g++) {
            var m = p[g];
            m.enumerable = m.enumerable || !1, m.configurable = !0, "value" in m && (m.writable = !0), Object.defineProperty(d, m.key, m);
          }
        }
        return function(d, p, g) {
          return p && f(d.prototype, p), g && f(d, g), d;
        };
      }(), a = Object.assign || function(f) {
        for (var d = 1; d < arguments.length; d++) {
          var p = arguments[d];
          for (var g in p)
            Object.prototype.hasOwnProperty.call(p, g) && (f[g] = p[g]);
        }
        return f;
      }, l = function() {
        function f(d) {
          var p = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : !0, g = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [], m = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 5e3;
          n(this, f), this.ctx = d, this.iframes = p, this.exclude = g, this.iframesTimeout = m;
        }
        return i(f, [{
          key: "getContexts",
          value: function() {
            var d = void 0, p = [];
            return typeof this.ctx > "u" || !this.ctx ? d = [] : NodeList.prototype.isPrototypeOf(this.ctx) ? d = Array.prototype.slice.call(this.ctx) : Array.isArray(this.ctx) ? d = this.ctx : typeof this.ctx == "string" ? d = Array.prototype.slice.call(document.querySelectorAll(this.ctx)) : d = [this.ctx], d.forEach(function(g) {
              var m = p.filter(function(y) {
                return y.contains(g);
              }).length > 0;
              p.indexOf(g) === -1 && !m && p.push(g);
            }), p;
          }
        }, {
          key: "getIframeContents",
          value: function(d, p) {
            var g = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : function() {
            }, m = void 0;
            try {
              var y = d.contentWindow;
              if (m = y.document, !y || !m)
                throw new Error("iframe inaccessible");
            } catch {
              g();
            }
            m && p(m);
          }
        }, {
          key: "isIframeBlank",
          value: function(d) {
            var p = "about:blank", g = d.getAttribute("src").trim(), m = d.contentWindow.location.href;
            return m === p && g !== p && g;
          }
        }, {
          key: "observeIframeLoad",
          value: function(d, p, g) {
            var m = this, y = !1, w = null, x = function k() {
              if (!y) {
                y = !0, clearTimeout(w);
                try {
                  m.isIframeBlank(d) || (d.removeEventListener("load", k), m.getIframeContents(d, p, g));
                } catch {
                  g();
                }
              }
            };
            d.addEventListener("load", x), w = setTimeout(x, this.iframesTimeout);
          }
        }, {
          key: "onIframeReady",
          value: function(d, p, g) {
            try {
              d.contentWindow.document.readyState === "complete" ? this.isIframeBlank(d) ? this.observeIframeLoad(d, p, g) : this.getIframeContents(d, p, g) : this.observeIframeLoad(d, p, g);
            } catch {
              g();
            }
          }
        }, {
          key: "waitForIframes",
          value: function(d, p) {
            var g = this, m = 0;
            this.forEachIframe(d, function() {
              return !0;
            }, function(y) {
              m++, g.waitForIframes(y.querySelector("html"), function() {
                --m || p();
              });
            }, function(y) {
              y || p();
            });
          }
        }, {
          key: "forEachIframe",
          value: function(d, p, g) {
            var m = this, y = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : function() {
            }, w = d.querySelectorAll("iframe"), x = w.length, k = 0;
            w = Array.prototype.slice.call(w);
            var S = function() {
              --x <= 0 && y(k);
            };
            x || S(), w.forEach(function(_) {
              f.matches(_, m.exclude) ? S() : m.onIframeReady(_, function(E) {
                p(_) && (k++, g(E)), S();
              }, S);
            });
          }
        }, {
          key: "createIterator",
          value: function(d, p, g) {
            return document.createNodeIterator(d, p, g, !1);
          }
        }, {
          key: "createInstanceOnIframe",
          value: function(d) {
            return new f(d.querySelector("html"), this.iframes);
          }
        }, {
          key: "compareNodeIframe",
          value: function(d, p, g) {
            var m = d.compareDocumentPosition(g), y = Node.DOCUMENT_POSITION_PRECEDING;
            if (m & y)
              if (p !== null) {
                var w = p.compareDocumentPosition(g), x = Node.DOCUMENT_POSITION_FOLLOWING;
                if (w & x)
                  return !0;
              } else
                return !0;
            return !1;
          }
        }, {
          key: "getIteratorNode",
          value: function(d) {
            var p = d.previousNode(), g = void 0;
            return p === null ? g = d.nextNode() : g = d.nextNode() && d.nextNode(), {
              prevNode: p,
              node: g
            };
          }
        }, {
          key: "checkIframeFilter",
          value: function(d, p, g, m) {
            var y = !1, w = !1;
            return m.forEach(function(x, k) {
              x.val === g && (y = k, w = x.handled);
            }), this.compareNodeIframe(d, p, g) ? (y === !1 && !w ? m.push({
              val: g,
              handled: !0
            }) : y !== !1 && !w && (m[y].handled = !0), !0) : (y === !1 && m.push({
              val: g,
              handled: !1
            }), !1);
          }
        }, {
          key: "handleOpenIframes",
          value: function(d, p, g, m) {
            var y = this;
            d.forEach(function(w) {
              w.handled || y.getIframeContents(w.val, function(x) {
                y.createInstanceOnIframe(x).forEachNode(p, g, m);
              });
            });
          }
        }, {
          key: "iterateThroughNodes",
          value: function(d, p, g, m, y) {
            for (var w = this, x = this.createIterator(p, d, m), k = [], S = [], _ = void 0, E = void 0, C = function() {
              var R = w.getIteratorNode(x);
              return E = R.prevNode, _ = R.node, _;
            }; C(); )
              this.iframes && this.forEachIframe(p, function(R) {
                return w.checkIframeFilter(_, E, R, k);
              }, function(R) {
                w.createInstanceOnIframe(R).forEachNode(d, function(A) {
                  return S.push(A);
                }, m);
              }), S.push(_);
            S.forEach(function(R) {
              g(R);
            }), this.iframes && this.handleOpenIframes(k, d, g, m), y();
          }
        }, {
          key: "forEachNode",
          value: function(d, p, g) {
            var m = this, y = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : function() {
            }, w = this.getContexts(), x = w.length;
            x || y(), w.forEach(function(k) {
              var S = function() {
                m.iterateThroughNodes(d, k, p, g, function() {
                  --x <= 0 && y();
                });
              };
              m.iframes ? m.waitForIframes(k, S) : S();
            });
          }
        }], [{
          key: "matches",
          value: function(d, p) {
            var g = typeof p == "string" ? [p] : p, m = d.matches || d.matchesSelector || d.msMatchesSelector || d.mozMatchesSelector || d.oMatchesSelector || d.webkitMatchesSelector;
            if (m) {
              var y = !1;
              return g.every(function(w) {
                return m.call(d, w) ? (y = !0, !1) : !0;
              }), y;
            } else
              return !1;
          }
        }]), f;
      }(), u = function() {
        function f(d) {
          n(this, f), this.ctx = d, this.ie = !1;
          var p = window.navigator.userAgent;
          (p.indexOf("MSIE") > -1 || p.indexOf("Trident") > -1) && (this.ie = !0);
        }
        return i(f, [{
          key: "log",
          value: function(d) {
            var p = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "debug", g = this.opt.log;
            this.opt.debug && (typeof g > "u" ? "undefined" : r(g)) === "object" && typeof g[p] == "function" && g[p]("mark.js: " + d);
          }
        }, {
          key: "escapeStr",
          value: function(d) {
            return d.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
          }
        }, {
          key: "createRegExp",
          value: function(d) {
            return this.opt.wildcards !== "disabled" && (d = this.setupWildcardsRegExp(d)), d = this.escapeStr(d), Object.keys(this.opt.synonyms).length && (d = this.createSynonymsRegExp(d)), (this.opt.ignoreJoiners || this.opt.ignorePunctuation.length) && (d = this.setupIgnoreJoinersRegExp(d)), this.opt.diacritics && (d = this.createDiacriticsRegExp(d)), d = this.createMergedBlanksRegExp(d), (this.opt.ignoreJoiners || this.opt.ignorePunctuation.length) && (d = this.createJoinersRegExp(d)), this.opt.wildcards !== "disabled" && (d = this.createWildcardsRegExp(d)), d = this.createAccuracyRegExp(d), d;
          }
        }, {
          key: "createSynonymsRegExp",
          value: function(d) {
            var p = this.opt.synonyms, g = this.opt.caseSensitive ? "" : "i", m = this.opt.ignoreJoiners || this.opt.ignorePunctuation.length ? "\0" : "";
            for (var y in p)
              if (p.hasOwnProperty(y)) {
                var w = p[y], x = this.opt.wildcards !== "disabled" ? this.setupWildcardsRegExp(y) : this.escapeStr(y), k = this.opt.wildcards !== "disabled" ? this.setupWildcardsRegExp(w) : this.escapeStr(w);
                x !== "" && k !== "" && (d = d.replace(new RegExp("(" + this.escapeStr(x) + "|" + this.escapeStr(k) + ")", "gm" + g), m + ("(" + this.processSynomyms(x) + "|") + (this.processSynomyms(k) + ")") + m));
              }
            return d;
          }
        }, {
          key: "processSynomyms",
          value: function(d) {
            return (this.opt.ignoreJoiners || this.opt.ignorePunctuation.length) && (d = this.setupIgnoreJoinersRegExp(d)), d;
          }
        }, {
          key: "setupWildcardsRegExp",
          value: function(d) {
            return d = d.replace(/(?:\\)*\?/g, function(p) {
              return p.charAt(0) === "\\" ? "?" : "";
            }), d.replace(/(?:\\)*\*/g, function(p) {
              return p.charAt(0) === "\\" ? "*" : "";
            });
          }
        }, {
          key: "createWildcardsRegExp",
          value: function(d) {
            var p = this.opt.wildcards === "withSpaces";
            return d.replace(/\u0001/g, p ? "[\\S\\s]?" : "\\S?").replace(/\u0002/g, p ? "[\\S\\s]*?" : "\\S*");
          }
        }, {
          key: "setupIgnoreJoinersRegExp",
          value: function(d) {
            return d.replace(/[^(|)\\]/g, function(p, g, m) {
              var y = m.charAt(g + 1);
              return /[(|)\\]/.test(y) || y === "" ? p : p + "\0";
            });
          }
        }, {
          key: "createJoinersRegExp",
          value: function(d) {
            var p = [], g = this.opt.ignorePunctuation;
            return Array.isArray(g) && g.length && p.push(this.escapeStr(g.join(""))), this.opt.ignoreJoiners && p.push("\\u00ad\\u200b\\u200c\\u200d"), p.length ? d.split(/\u0000+/).join("[" + p.join("") + "]*") : d;
          }
        }, {
          key: "createDiacriticsRegExp",
          value: function(d) {
            var p = this.opt.caseSensitive ? "" : "i", g = this.opt.caseSensitive ? ["aàáảãạăằắẳẵặâầấẩẫậäåāą", "AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÄÅĀĄ", "cçćč", "CÇĆČ", "dđď", "DĐĎ", "eèéẻẽẹêềếểễệëěēę", "EÈÉẺẼẸÊỀẾỂỄỆËĚĒĘ", "iìíỉĩịîïī", "IÌÍỈĨỊÎÏĪ", "lł", "LŁ", "nñňń", "NÑŇŃ", "oòóỏõọôồốổỗộơởỡớờợöøō", "OÒÓỎÕỌÔỒỐỔỖỘƠỞỠỚỜỢÖØŌ", "rř", "RŘ", "sšśșş", "SŠŚȘŞ", "tťțţ", "TŤȚŢ", "uùúủũụưừứửữựûüůū", "UÙÚỦŨỤƯỪỨỬỮỰÛÜŮŪ", "yýỳỷỹỵÿ", "YÝỲỶỸỴŸ", "zžżź", "ZŽŻŹ"] : ["aàáảãạăằắẳẵặâầấẩẫậäåāąAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÄÅĀĄ", "cçćčCÇĆČ", "dđďDĐĎ", "eèéẻẽẹêềếểễệëěēęEÈÉẺẼẸÊỀẾỂỄỆËĚĒĘ", "iìíỉĩịîïīIÌÍỈĨỊÎÏĪ", "lłLŁ", "nñňńNÑŇŃ", "oòóỏõọôồốổỗộơởỡớờợöøōOÒÓỎÕỌÔỒỐỔỖỘƠỞỠỚỜỢÖØŌ", "rřRŘ", "sšśșşSŠŚȘŞ", "tťțţTŤȚŢ", "uùúủũụưừứửữựûüůūUÙÚỦŨỤƯỪỨỬỮỰÛÜŮŪ", "yýỳỷỹỵÿYÝỲỶỸỴŸ", "zžżźZŽŻŹ"], m = [];
            return d.split("").forEach(function(y) {
              g.every(function(w) {
                if (w.indexOf(y) !== -1) {
                  if (m.indexOf(w) > -1)
                    return !1;
                  d = d.replace(new RegExp("[" + w + "]", "gm" + p), "[" + w + "]"), m.push(w);
                }
                return !0;
              });
            }), d;
          }
        }, {
          key: "createMergedBlanksRegExp",
          value: function(d) {
            return d.replace(/[\s]+/gmi, "[\\s]+");
          }
        }, {
          key: "createAccuracyRegExp",
          value: function(d) {
            var p = this, g = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~¡¿", m = this.opt.accuracy, y = typeof m == "string" ? m : m.value, w = typeof m == "string" ? [] : m.limiters, x = "";
            switch (w.forEach(function(k) {
              x += "|" + p.escapeStr(k);
            }), y) {
              case "partially":
              default:
                return "()(" + d + ")";
              case "complementary":
                return x = "\\s" + (x || this.escapeStr(g)), "()([^" + x + "]*" + d + "[^" + x + "]*)";
              case "exactly":
                return "(^|\\s" + x + ")(" + d + ")(?=$|\\s" + x + ")";
            }
          }
        }, {
          key: "getSeparatedKeywords",
          value: function(d) {
            var p = this, g = [];
            return d.forEach(function(m) {
              p.opt.separateWordSearch ? m.split(" ").forEach(function(y) {
                y.trim() && g.indexOf(y) === -1 && g.push(y);
              }) : m.trim() && g.indexOf(m) === -1 && g.push(m);
            }), {
              keywords: g.sort(function(m, y) {
                return y.length - m.length;
              }),
              length: g.length
            };
          }
        }, {
          key: "isNumeric",
          value: function(d) {
            return Number(parseFloat(d)) == d;
          }
        }, {
          key: "checkRanges",
          value: function(d) {
            var p = this;
            if (!Array.isArray(d) || Object.prototype.toString.call(d[0]) !== "[object Object]")
              return this.log("markRanges() will only accept an array of objects"), this.opt.noMatch(d), [];
            var g = [], m = 0;
            return d.sort(function(y, w) {
              return y.start - w.start;
            }).forEach(function(y) {
              var w = p.callNoMatchOnInvalidRanges(y, m), x = w.start, k = w.end, S = w.valid;
              S && (y.start = x, y.length = k - x, g.push(y), m = k);
            }), g;
          }
        }, {
          key: "callNoMatchOnInvalidRanges",
          value: function(d, p) {
            var g = void 0, m = void 0, y = !1;
            return d && typeof d.start < "u" ? (g = parseInt(d.start, 10), m = g + parseInt(d.length, 10), this.isNumeric(d.start) && this.isNumeric(d.length) && m - p > 0 && m - g > 0 ? y = !0 : (this.log("Ignoring invalid or overlapping range: " + ("" + JSON.stringify(d))), this.opt.noMatch(d))) : (this.log("Ignoring invalid range: " + JSON.stringify(d)), this.opt.noMatch(d)), {
              start: g,
              end: m,
              valid: y
            };
          }
        }, {
          key: "checkWhitespaceRanges",
          value: function(d, p, g) {
            var m = void 0, y = !0, w = g.length, x = p - w, k = parseInt(d.start, 10) - x;
            return k = k > w ? w : k, m = k + parseInt(d.length, 10), m > w && (m = w, this.log("End range automatically set to the max value of " + w)), k < 0 || m - k < 0 || k > w || m > w ? (y = !1, this.log("Invalid range: " + JSON.stringify(d)), this.opt.noMatch(d)) : g.substring(k, m).replace(/\s+/g, "") === "" && (y = !1, this.log("Skipping whitespace only range: " + JSON.stringify(d)), this.opt.noMatch(d)), {
              start: k,
              end: m,
              valid: y
            };
          }
        }, {
          key: "getTextNodes",
          value: function(d) {
            var p = this, g = "", m = [];
            this.iterator.forEachNode(NodeFilter.SHOW_TEXT, function(y) {
              m.push({
                start: g.length,
                end: (g += y.textContent).length,
                node: y
              });
            }, function(y) {
              return p.matchesExclude(y.parentNode) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }, function() {
              d({
                value: g,
                nodes: m
              });
            });
          }
        }, {
          key: "matchesExclude",
          value: function(d) {
            return l.matches(d, this.opt.exclude.concat(["script", "style", "title", "head", "html"]));
          }
        }, {
          key: "wrapRangeInTextNode",
          value: function(d, p, g) {
            var m = this.opt.element ? this.opt.element : "mark", y = d.splitText(p), w = y.splitText(g - p), x = document.createElement(m);
            return x.setAttribute("data-markjs", "true"), this.opt.className && x.setAttribute("class", this.opt.className), x.textContent = y.textContent, y.parentNode.replaceChild(x, y), w;
          }
        }, {
          key: "wrapRangeInMappedTextNode",
          value: function(d, p, g, m, y) {
            var w = this;
            d.nodes.every(function(x, k) {
              var S = d.nodes[k + 1];
              if (typeof S > "u" || S.start > p) {
                if (!m(x.node))
                  return !1;
                var _ = p - x.start, E = (g > x.end ? x.end : g) - x.start, C = d.value.substr(0, x.start), R = d.value.substr(E + x.start);
                if (x.node = w.wrapRangeInTextNode(x.node, _, E), d.value = C + R, d.nodes.forEach(function(A, N) {
                  N >= k && (d.nodes[N].start > 0 && N !== k && (d.nodes[N].start -= E), d.nodes[N].end -= E);
                }), g -= E, y(x.node.previousSibling, x.start), g > x.end)
                  p = x.end;
                else
                  return !1;
              }
              return !0;
            });
          }
        }, {
          key: "wrapMatches",
          value: function(d, p, g, m, y) {
            var w = this, x = p === 0 ? 0 : p + 1;
            this.getTextNodes(function(k) {
              k.nodes.forEach(function(S) {
                S = S.node;
                for (var _ = void 0; (_ = d.exec(S.textContent)) !== null && _[x] !== ""; )
                  if (g(_[x], S)) {
                    var E = _.index;
                    if (x !== 0)
                      for (var C = 1; C < x; C++)
                        E += _[C].length;
                    S = w.wrapRangeInTextNode(S, E, E + _[x].length), m(S.previousSibling), d.lastIndex = 0;
                  }
              }), y();
            });
          }
        }, {
          key: "wrapMatchesAcrossElements",
          value: function(d, p, g, m, y) {
            var w = this, x = p === 0 ? 0 : p + 1;
            this.getTextNodes(function(k) {
              for (var S = void 0; (S = d.exec(k.value)) !== null && S[x] !== ""; ) {
                var _ = S.index;
                if (x !== 0)
                  for (var E = 1; E < x; E++)
                    _ += S[E].length;
                var C = _ + S[x].length;
                w.wrapRangeInMappedTextNode(k, _, C, function(R) {
                  return g(S[x], R);
                }, function(R, A) {
                  d.lastIndex = A, m(R);
                });
              }
              y();
            });
          }
        }, {
          key: "wrapRangeFromIndex",
          value: function(d, p, g, m) {
            var y = this;
            this.getTextNodes(function(w) {
              var x = w.value.length;
              d.forEach(function(k, S) {
                var _ = y.checkWhitespaceRanges(k, x, w.value), E = _.start, C = _.end, R = _.valid;
                R && y.wrapRangeInMappedTextNode(w, E, C, function(A) {
                  return p(A, k, w.value.substring(E, C), S);
                }, function(A) {
                  g(A, k);
                });
              }), m();
            });
          }
        }, {
          key: "unwrapMatches",
          value: function(d) {
            for (var p = d.parentNode, g = document.createDocumentFragment(); d.firstChild; )
              g.appendChild(d.removeChild(d.firstChild));
            p.replaceChild(g, d), this.ie ? this.normalizeTextNode(p) : p.normalize();
          }
        }, {
          key: "normalizeTextNode",
          value: function(d) {
            if (d) {
              if (d.nodeType === 3)
                for (; d.nextSibling && d.nextSibling.nodeType === 3; )
                  d.nodeValue += d.nextSibling.nodeValue, d.parentNode.removeChild(d.nextSibling);
              else
                this.normalizeTextNode(d.firstChild);
              this.normalizeTextNode(d.nextSibling);
            }
          }
        }, {
          key: "markRegExp",
          value: function(d, p) {
            var g = this;
            this.opt = p, this.log('Searching with expression "' + d + '"');
            var m = 0, y = "wrapMatches", w = function(x) {
              m++, g.opt.each(x);
            };
            this.opt.acrossElements && (y = "wrapMatchesAcrossElements"), this[y](d, this.opt.ignoreGroups, function(x, k) {
              return g.opt.filter(k, x, m);
            }, w, function() {
              m === 0 && g.opt.noMatch(d), g.opt.done(m);
            });
          }
        }, {
          key: "mark",
          value: function(d, p) {
            var g = this;
            this.opt = p;
            var m = 0, y = "wrapMatches", w = this.getSeparatedKeywords(typeof d == "string" ? [d] : d), x = w.keywords, k = w.length, S = this.opt.caseSensitive ? "" : "i", _ = function E(C) {
              var R = new RegExp(g.createRegExp(C), "gm" + S), A = 0;
              g.log('Searching with expression "' + R + '"'), g[y](R, 1, function(N, L) {
                return g.opt.filter(L, C, m, A);
              }, function(N) {
                A++, m++, g.opt.each(N);
              }, function() {
                A === 0 && g.opt.noMatch(C), x[k - 1] === C ? g.opt.done(m) : E(x[x.indexOf(C) + 1]);
              });
            };
            this.opt.acrossElements && (y = "wrapMatchesAcrossElements"), k === 0 ? this.opt.done(m) : _(x[0]);
          }
        }, {
          key: "markRanges",
          value: function(d, p) {
            var g = this;
            this.opt = p;
            var m = 0, y = this.checkRanges(d);
            y && y.length ? (this.log("Starting to mark with the following ranges: " + JSON.stringify(y)), this.wrapRangeFromIndex(y, function(w, x, k, S) {
              return g.opt.filter(w, x, k, S);
            }, function(w, x) {
              m++, g.opt.each(w, x);
            }, function() {
              g.opt.done(m);
            })) : this.opt.done(m);
          }
        }, {
          key: "unmark",
          value: function(d) {
            var p = this;
            this.opt = d;
            var g = this.opt.element ? this.opt.element : "*";
            g += "[data-markjs]", this.opt.className && (g += "." + this.opt.className), this.log('Removal selector "' + g + '"'), this.iterator.forEachNode(NodeFilter.SHOW_ELEMENT, function(m) {
              p.unwrapMatches(m);
            }, function(m) {
              var y = l.matches(m, g), w = p.matchesExclude(m);
              return !y || w ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }, this.opt.done);
          }
        }, {
          key: "opt",
          set: function(d) {
            this._opt = a({}, {
              element: "",
              className: "",
              exclude: [],
              iframes: !1,
              iframesTimeout: 5e3,
              separateWordSearch: !0,
              diacritics: !0,
              synonyms: {},
              accuracy: "partially",
              acrossElements: !1,
              caseSensitive: !1,
              ignoreJoiners: !1,
              ignoreGroups: 0,
              ignorePunctuation: [],
              wildcards: "disabled",
              each: function() {
              },
              noMatch: function() {
              },
              filter: function() {
                return !0;
              },
              done: function() {
              },
              debug: !1,
              log: window.console
            }, d);
          },
          get: function() {
            return this._opt;
          }
        }, {
          key: "iterator",
          get: function() {
            return new l(this.ctx, this.opt.iframes, this.opt.exclude, this.opt.iframesTimeout);
          }
        }]), f;
      }();
      function c(f) {
        var d = this, p = new u(f);
        return this.mark = function(g, m) {
          return p.mark(g, m), d;
        }, this.markRegExp = function(g, m) {
          return p.markRegExp(g, m), d;
        }, this.markRanges = function(g, m) {
          return p.markRanges(g, m), d;
        }, this.unmark = function(g) {
          return p.unmark(g), d;
        }, this;
      }
      return c;
    });
  }(sv)), sv.exports;
}
var $P = TP();
const FP = /* @__PURE__ */ AP($P);
var NP = (t, e) => {
  e.onClose?.();
}, zP = (t, e, r) => {
  e.onClick?.(r);
}, OP = /* @__PURE__ */ Se('<div class="flex pt-1 text-sm"><span class="px-2 flex gap-2 bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300 rounded-md"><div class="text-slate-400 dark:text-slate-400 font-medium">Distance</div> <div class="text-ellipsis whitespace-nowrap overflow-hidden max-w-72"> </div></span></div>'), BP = /* @__PURE__ */ Se('<button class="m-1 p-2 text-left rounded-md hover:bg-slate-300 dark:hover:bg-slate-500"><div class="overflow-hidden text-ellipsis line-clamp-4 leading-5"> </div> <!></button> <hr class="border-slate-300 dark:border-slate-600"/>', 1), DP = /* @__PURE__ */ Se('<div class="flex flex-col w-full h-full"><div class="ml-3 mr-2 my-1 flex items-center text-slate-400 dark:text-slate-500 items-start"><div class="flex-1"><div> </div> <div> </div></div> <div class="flex-none mt-1"><button class="block hover:text-slate-500 dark:hover:text-slate-400"><!></button></div></div> <hr class="border-slate-300 dark:border-slate-600"/> <div class="flex flex-col overflow-x-hidden overflow-y-scroll"></div></div>');
function PP(t, e) {
  gt(e, !0);
  let r = Je(e, "limit", 3, 100);
  function n(x, k) {
    new FP(x).mark(k);
  }
  let i = /* @__PURE__ */ oe(() => e.items.length == 0 ? "No result found." : e.items.length == 1 ? `${e.items.length.toLocaleString()} result.` : e.items.length >= r() ? `More than ${e.items.length.toLocaleString()} results, showing top ${r().toLocaleString()}.` : `${e.items.length.toLocaleString()} results.`);
  var a = DP(), l = ne(a), u = ne(l), c = ne(u), f = ne(c, !0);
  ee(c);
  var d = le(c, 2), p = ne(d, !0);
  ee(d), ee(u);
  var g = le(u, 2), m = ne(g);
  m.__click = [NP, e];
  var y = ne(m);
  lh(y, {}), ee(m), ee(g), ee(l);
  var w = le(l, 4);
  Gt(w, 20, () => e.items, (x) => x, (x, k) => {
    var S = BP(), _ = We(S);
    _.__click = [zP, e, k];
    var E = ne(_), C = ne(E, !0);
    ee(E), Gw(E, (N, L) => n?.(N, L), () => e.highlight);
    var R = le(E, 2);
    {
      var A = (N) => {
        var L = OP(), j = ne(L), B = le(ne(j), 2), P = ne(B, !0);
        ee(B), ee(j), ee(L), Ee((q) => rt(P, q), [() => k.distance.toFixed(5)]), te(N, L);
      };
      Te(R, (N) => {
        k.distance != null && N(A);
      });
    }
    ee(_), Ev(2), Ee(() => {
      J(E, "title", k.text), rt(C, k.text);
    }), te(x, S);
  }), ee(w), ee(a), Ee(() => {
    rt(f, e.label), rt(p, h(i));
  }), te(t, a), mt();
}
Tr(["click"]);
var LP = /* @__PURE__ */ bt('<svg><path fill="currentColor" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25"></path><path fill="currentColor" d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"><animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"></animateTransform></path></svg>');
function Q3(t, e) {
  const r = /* @__PURE__ */ bn(e, ["$$slots", "$$events", "$$legacy"]);
  var n = LP();
  ro(n, () => ({ viewBox: "0 0 24 24", width: "1.2em", height: "1.2em", ...r })), te(t, n);
}
var qP = /* @__PURE__ */ Se('<span class="pl-2 text-slate-500 dark:text-slate-500"> </span>'), IP = /* @__PURE__ */ Se('<div role="status" class="flex flex-row items-center"><!> <!></div>');
function jP(t, e) {
  let r = Je(e, "status", 3, "Loading...");
  var n = IP(), i = ne(n);
  Q3(i, { class: "text-blue-500" });
  var a = le(i, 2);
  {
    var l = (u) => {
      var c = qP(), f = ne(c, !0);
      ee(c), Ee(() => rt(f, r())), te(u, c);
    };
    Te(a, (u) => {
      r() != null && u(l);
    });
  }
  ee(n), te(t, n);
}
function UP(t) {
  let e = "";
  for (let r = 0; r < t.length; r++)
    e += String.fromCharCode(t[r]);
  return btoa(e);
}
function WP(t) {
  const e = atob(t);
  return new Uint8Array([...e].map((r) => r.charCodeAt(0)));
}
function ps(t, e) {
  if (t.length < e.length)
    return !1;
  for (let r = 0; r < e.length; r++)
    if (t[r] != e[r])
      return !1;
  return !0;
}
function Wx(t) {
  return ps(t, [137, 80, 78, 71, 13, 10, 26, 10]) ? "image/png" : ps(t, [255, 216, 255]) ? "image/jpeg" : ps(t, [73, 73, 42, 0]) ? "image/tiff" : ps(t, [66, 77]) ? "image/bmp" : ps(t, [71, 73, 70, 56, 55, 97]) || ps(t, [71, 73, 70, 56, 55, 97]) ? "image/gif" : "application/octet-stream";
}
function HP(t) {
  if (t == null)
    return null;
  if (typeof t == "string")
    return t.startsWith("data:") ? t : `data:${Wx(WP(t))};base64,` + t;
  {
    let e = null;
    if (t.bytes && t.bytes instanceof Uint8Array && (e = t.bytes), t instanceof Uint8Array && (e = t), e != null)
      return `data:${Wx(e)};base64,` + UP(e);
  }
  return null;
}
class VP {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    if (e.value == null) {
      this.element.innerText = "(null)";
      return;
    }
    let r = HP(e.value);
    if (r != null) {
      let n = document.createElement("img");
      n.src = r, n.style.maxHeight = "100px", this.element.replaceChildren(n);
    } else
      this.element.innerText = "(unknown)";
  }
}
function GP(t, e) {
  try {
    return JSON.stringify(
      t,
      (r, n) => n instanceof Object && ArrayBuffer.isView(n) ? Array.from(n) : n,
      e
    );
  } catch {
    return "(invalid)";
  }
}
class XP {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    let r = document.createElement("pre");
    r.innerText = GP(e.value), this.element.replaceChildren(r);
  }
}
function Hg() {
  return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null };
}
var Wl = Hg();
function J3(t) {
  Wl = t;
}
var Iu = { exec: () => null };
function Kt(t, e = "") {
  let r = typeof t == "string" ? t : t.source, n = { replace: (i, a) => {
    let l = typeof a == "string" ? a : a.source;
    return l = l.replace(gn.caret, "$1"), r = r.replace(i, l), n;
  }, getRegex: () => new RegExp(r, e) };
  return n;
}
var gn = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] /, listReplaceTask: /^\[[ xX]\] +/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (t) => new RegExp(`^( {0,3}${t})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}#`), htmlBeginRegex: (t) => new RegExp(`^ {0,${Math.min(3, t - 1)}}<(?:[a-z].*>|!--)`, "i") }, YP = /^(?:[ \t]*(?:\n|$))+/, KP = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, ZP = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, $c = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, QP = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Vg = /(?:[*+-]|\d{1,9}[.)])/, e_ = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/, t_ = Kt(e_).replace(/bull/g, Vg).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex(), JP = Kt(e_).replace(/bull/g, Vg).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(), Gg = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, eL = /^[^\n]+/, Xg = /(?!\s*\])(?:\\.|[^\[\]\\])+/, tL = Kt(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Xg).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), rL = Kt(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Vg).getRegex(), sh = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Yg = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, nL = Kt("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Yg).replace("tag", sh).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), r_ = Kt(Gg).replace("hr", $c).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", sh).getRegex(), oL = Kt(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", r_).getRegex(), Kg = { blockquote: oL, code: KP, def: tL, fences: ZP, heading: QP, hr: $c, html: nL, lheading: t_, list: rL, newline: YP, paragraph: r_, table: Iu, text: eL }, Hx = Kt("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", $c).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", sh).getRegex(), iL = { ...Kg, lheading: JP, table: Hx, paragraph: Kt(Gg).replace("hr", $c).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Hx).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", sh).getRegex() }, aL = { ...Kg, html: Kt(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Yg).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: Iu, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: Kt(Gg).replace("hr", $c).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", t_).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, lL = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, sL = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, n_ = /^( {2,}|\\)\n(?!\s*$)/, uL = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, uh = /[\p{P}\p{S}]/u, Zg = /[\s\p{P}\p{S}]/u, o_ = /[^\s\p{P}\p{S}]/u, cL = Kt(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Zg).getRegex(), i_ = /(?!~)[\p{P}\p{S}]/u, fL = /(?!~)[\s\p{P}\p{S}]/u, dL = /(?:[^\s\p{P}\p{S}]|~)/u, hL = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<(?! )[^<>]*?>/g, a_ = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/, pL = Kt(a_, "u").replace(/punct/g, uh).getRegex(), vL = Kt(a_, "u").replace(/punct/g, i_).getRegex(), l_ = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)", gL = Kt(l_, "gu").replace(/notPunctSpace/g, o_).replace(/punctSpace/g, Zg).replace(/punct/g, uh).getRegex(), mL = Kt(l_, "gu").replace(/notPunctSpace/g, dL).replace(/punctSpace/g, fL).replace(/punct/g, i_).getRegex(), yL = Kt("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, o_).replace(/punctSpace/g, Zg).replace(/punct/g, uh).getRegex(), bL = Kt(/\\(punct)/, "gu").replace(/punct/g, uh).getRegex(), xL = Kt(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), wL = Kt(Yg).replace("(?:-->|$)", "-->").getRegex(), kL = Kt("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", wL).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), Cd = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, _L = Kt(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", Cd).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), s_ = Kt(/^!?\[(label)\]\[(ref)\]/).replace("label", Cd).replace("ref", Xg).getRegex(), u_ = Kt(/^!?\[(ref)\](?:\[\])?/).replace("ref", Xg).getRegex(), SL = Kt("reflink|nolink(?!\\()", "g").replace("reflink", s_).replace("nolink", u_).getRegex(), Qg = { _backpedal: Iu, anyPunctuation: bL, autolink: xL, blockSkip: hL, br: n_, code: sL, del: Iu, emStrongLDelim: pL, emStrongRDelimAst: gL, emStrongRDelimUnd: yL, escape: lL, link: _L, nolink: u_, punctuation: cL, reflink: s_, reflinkSearch: SL, tag: kL, text: uL, url: Iu }, ML = { ...Qg, link: Kt(/^!?\[(label)\]\((.*?)\)/).replace("label", Cd).getRegex(), reflink: Kt(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", Cd).getRegex() }, uv = { ...Qg, emStrongRDelimAst: mL, emStrongLDelim: vL, url: Kt(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/, text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/ }, CL = { ...uv, br: Kt(n_).replace("{2,}", "*").getRegex(), text: Kt(uv.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, Bf = { normal: Kg, gfm: iL, pedantic: aL }, Eu = { normal: Qg, gfm: uv, breaks: CL, pedantic: ML }, RL = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, Vx = (t) => RL[t];
function Qo(t, e) {
  if (e) {
    if (gn.escapeTest.test(t)) return t.replace(gn.escapeReplace, Vx);
  } else if (gn.escapeTestNoEncode.test(t)) return t.replace(gn.escapeReplaceNoEncode, Vx);
  return t;
}
function Gx(t) {
  try {
    t = encodeURI(t).replace(gn.percentDecode, "%");
  } catch {
    return null;
  }
  return t;
}
function Xx(t, e) {
  let r = t.replace(gn.findPipe, (a, l, u) => {
    let c = !1, f = l;
    for (; --f >= 0 && u[f] === "\\"; ) c = !c;
    return c ? "|" : " |";
  }), n = r.split(gn.splitPipe), i = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; i < n.length; i++) n[i] = n[i].trim().replace(gn.slashPipe, "|");
  return n;
}
function Tu(t, e, r) {
  let n = t.length;
  if (n === 0) return "";
  let i = 0;
  for (; i < n && t.charAt(n - i - 1) === e; )
    i++;
  return t.slice(0, n - i);
}
function AL(t, e) {
  if (t.indexOf(e[1]) === -1) return -1;
  let r = 0;
  for (let n = 0; n < t.length; n++) if (t[n] === "\\") n++;
  else if (t[n] === e[0]) r++;
  else if (t[n] === e[1] && (r--, r < 0)) return n;
  return r > 0 ? -2 : -1;
}
function Yx(t, e, r, n, i) {
  let a = e.href, l = e.title || null, u = t[1].replace(i.other.outputLinkReplace, "$1");
  n.state.inLink = !0;
  let c = { type: t[0].charAt(0) === "!" ? "image" : "link", raw: r, href: a, title: l, text: u, tokens: n.inlineTokens(u) };
  return n.state.inLink = !1, c;
}
function EL(t, e, r) {
  let n = t.match(r.other.indentCodeCompensation);
  if (n === null) return e;
  let i = n[1];
  return e.split(`
`).map((a) => {
    let l = a.match(r.other.beginningSpace);
    if (l === null) return a;
    let [u] = l;
    return u.length >= i.length ? a.slice(i.length) : a;
  }).join(`
`);
}
var Rd = class {
  options;
  rules;
  lexer;
  constructor(t) {
    this.options = t || Wl;
  }
  space(t) {
    let e = this.rules.block.newline.exec(t);
    if (e && e[0].length > 0) return { type: "space", raw: e[0] };
  }
  code(t) {
    let e = this.rules.block.code.exec(t);
    if (e) {
      let r = e[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: e[0], codeBlockStyle: "indented", text: this.options.pedantic ? r : Tu(r, `
`) };
    }
  }
  fences(t) {
    let e = this.rules.block.fences.exec(t);
    if (e) {
      let r = e[0], n = EL(r, e[3] || "", this.rules);
      return { type: "code", raw: r, lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2], text: n };
    }
  }
  heading(t) {
    let e = this.rules.block.heading.exec(t);
    if (e) {
      let r = e[2].trim();
      if (this.rules.other.endingHash.test(r)) {
        let n = Tu(r, "#");
        (this.options.pedantic || !n || this.rules.other.endingSpaceChar.test(n)) && (r = n.trim());
      }
      return { type: "heading", raw: e[0], depth: e[1].length, text: r, tokens: this.lexer.inline(r) };
    }
  }
  hr(t) {
    let e = this.rules.block.hr.exec(t);
    if (e) return { type: "hr", raw: Tu(e[0], `
`) };
  }
  blockquote(t) {
    let e = this.rules.block.blockquote.exec(t);
    if (e) {
      let r = Tu(e[0], `
`).split(`
`), n = "", i = "", a = [];
      for (; r.length > 0; ) {
        let l = !1, u = [], c;
        for (c = 0; c < r.length; c++) if (this.rules.other.blockquoteStart.test(r[c])) u.push(r[c]), l = !0;
        else if (!l) u.push(r[c]);
        else break;
        r = r.slice(c);
        let f = u.join(`
`), d = f.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        n = n ? `${n}
${f}` : f, i = i ? `${i}
${d}` : d;
        let p = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(d, a, !0), this.lexer.state.top = p, r.length === 0) break;
        let g = a.at(-1);
        if (g?.type === "code") break;
        if (g?.type === "blockquote") {
          let m = g, y = m.raw + `
` + r.join(`
`), w = this.blockquote(y);
          a[a.length - 1] = w, n = n.substring(0, n.length - m.raw.length) + w.raw, i = i.substring(0, i.length - m.text.length) + w.text;
          break;
        } else if (g?.type === "list") {
          let m = g, y = m.raw + `
` + r.join(`
`), w = this.list(y);
          a[a.length - 1] = w, n = n.substring(0, n.length - g.raw.length) + w.raw, i = i.substring(0, i.length - m.raw.length) + w.raw, r = y.substring(a.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: n, tokens: a, text: i };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let r = e[1].trim(), n = r.length > 1, i = { type: "list", raw: "", ordered: n, start: n ? +r.slice(0, -1) : "", loose: !1, items: [] };
      r = n ? `\\d{1,9}\\${r.slice(-1)}` : `\\${r}`, this.options.pedantic && (r = n ? r : "[*+-]");
      let a = this.rules.other.listItemRegex(r), l = !1;
      for (; t; ) {
        let c = !1, f = "", d = "";
        if (!(e = a.exec(t)) || this.rules.block.hr.test(t)) break;
        f = e[0], t = t.substring(f.length);
        let p = e[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (k) => " ".repeat(3 * k.length)), g = t.split(`
`, 1)[0], m = !p.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, d = p.trimStart()) : m ? y = e[1].length + 1 : (y = e[2].search(this.rules.other.nonSpaceChar), y = y > 4 ? 1 : y, d = p.slice(y), y += e[1].length), m && this.rules.other.blankLine.test(g) && (f += g + `
`, t = t.substring(g.length + 1), c = !0), !c) {
          let k = this.rules.other.nextBulletRegex(y), S = this.rules.other.hrRegex(y), _ = this.rules.other.fencesBeginRegex(y), E = this.rules.other.headingBeginRegex(y), C = this.rules.other.htmlBeginRegex(y);
          for (; t; ) {
            let R = t.split(`
`, 1)[0], A;
            if (g = R, this.options.pedantic ? (g = g.replace(this.rules.other.listReplaceNesting, "  "), A = g) : A = g.replace(this.rules.other.tabCharGlobal, "    "), _.test(g) || E.test(g) || C.test(g) || k.test(g) || S.test(g)) break;
            if (A.search(this.rules.other.nonSpaceChar) >= y || !g.trim()) d += `
` + A.slice(y);
            else {
              if (m || p.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || _.test(p) || E.test(p) || S.test(p)) break;
              d += `
` + g;
            }
            !m && !g.trim() && (m = !0), f += R + `
`, t = t.substring(R.length + 1), p = A.slice(y);
          }
        }
        i.loose || (l ? i.loose = !0 : this.rules.other.doubleBlankLine.test(f) && (l = !0));
        let w = null, x;
        this.options.gfm && (w = this.rules.other.listIsTask.exec(d), w && (x = w[0] !== "[ ] ", d = d.replace(this.rules.other.listReplaceTask, ""))), i.items.push({ type: "list_item", raw: f, task: !!w, checked: x, loose: !1, text: d, tokens: [] }), i.raw += f;
      }
      let u = i.items.at(-1);
      if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
      else return;
      i.raw = i.raw.trimEnd();
      for (let c = 0; c < i.items.length; c++) if (this.lexer.state.top = !1, i.items[c].tokens = this.lexer.blockTokens(i.items[c].text, []), !i.loose) {
        let f = i.items[c].tokens.filter((p) => p.type === "space"), d = f.length > 0 && f.some((p) => this.rules.other.anyLine.test(p.raw));
        i.loose = d;
      }
      if (i.loose) for (let c = 0; c < i.items.length; c++) i.items[c].loose = !0;
      return i;
    }
  }
  html(t) {
    let e = this.rules.block.html.exec(t);
    if (e) return { type: "html", block: !0, raw: e[0], pre: e[1] === "pre" || e[1] === "script" || e[1] === "style", text: e[0] };
  }
  def(t) {
    let e = this.rules.block.def.exec(t);
    if (e) {
      let r = e[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), n = e[2] ? e[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return { type: "def", tag: r, raw: e[0], href: n, title: i };
    }
  }
  table(t) {
    let e = this.rules.block.table.exec(t);
    if (!e || !this.rules.other.tableDelimiter.test(e[2])) return;
    let r = Xx(e[1]), n = e[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = e[3]?.trim() ? e[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], a = { type: "table", raw: e[0], header: [], align: [], rows: [] };
    if (r.length === n.length) {
      for (let l of n) this.rules.other.tableAlignRight.test(l) ? a.align.push("right") : this.rules.other.tableAlignCenter.test(l) ? a.align.push("center") : this.rules.other.tableAlignLeft.test(l) ? a.align.push("left") : a.align.push(null);
      for (let l = 0; l < r.length; l++) a.header.push({ text: r[l], tokens: this.lexer.inline(r[l]), header: !0, align: a.align[l] });
      for (let l of i) a.rows.push(Xx(l, a.header.length).map((u, c) => ({ text: u, tokens: this.lexer.inline(u), header: !1, align: a.align[c] })));
      return a;
    }
  }
  lheading(t) {
    let e = this.rules.block.lheading.exec(t);
    if (e) return { type: "heading", raw: e[0], depth: e[2].charAt(0) === "=" ? 1 : 2, text: e[1], tokens: this.lexer.inline(e[1]) };
  }
  paragraph(t) {
    let e = this.rules.block.paragraph.exec(t);
    if (e) {
      let r = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return { type: "paragraph", raw: e[0], text: r, tokens: this.lexer.inline(r) };
    }
  }
  text(t) {
    let e = this.rules.block.text.exec(t);
    if (e) return { type: "text", raw: e[0], text: e[0], tokens: this.lexer.inline(e[0]) };
  }
  escape(t) {
    let e = this.rules.inline.escape.exec(t);
    if (e) return { type: "escape", raw: e[0], text: e[1] };
  }
  tag(t) {
    let e = this.rules.inline.tag.exec(t);
    if (e) return !this.lexer.state.inLink && this.rules.other.startATag.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && this.rules.other.endATag.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(e[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: e[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: e[0] };
  }
  link(t) {
    let e = this.rules.inline.link.exec(t);
    if (e) {
      let r = e[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(r)) {
        if (!this.rules.other.endAngleBracket.test(r)) return;
        let a = Tu(r.slice(0, -1), "\\");
        if ((r.length - a.length) % 2 === 0) return;
      } else {
        let a = AL(e[2], "()");
        if (a === -2) return;
        if (a > -1) {
          let l = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + a;
          e[2] = e[2].substring(0, a), e[0] = e[0].substring(0, l).trim(), e[3] = "";
        }
      }
      let n = e[2], i = "";
      if (this.options.pedantic) {
        let a = this.rules.other.pedanticHrefTitle.exec(n);
        a && (n = a[1], i = a[3]);
      } else i = e[3] ? e[3].slice(1, -1) : "";
      return n = n.trim(), this.rules.other.startAngleBracket.test(n) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(r) ? n = n.slice(1) : n = n.slice(1, -1)), Yx(e, { href: n && n.replace(this.rules.inline.anyPunctuation, "$1"), title: i && i.replace(this.rules.inline.anyPunctuation, "$1") }, e[0], this.lexer, this.rules);
    }
  }
  reflink(t, e) {
    let r;
    if ((r = this.rules.inline.reflink.exec(t)) || (r = this.rules.inline.nolink.exec(t))) {
      let n = (r[2] || r[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = e[n.toLowerCase()];
      if (!i) {
        let a = r[0].charAt(0);
        return { type: "text", raw: a, text: a };
      }
      return Yx(r, i, r[0], this.lexer, this.rules);
    }
  }
  emStrong(t, e, r = "") {
    let n = this.rules.inline.emStrongLDelim.exec(t);
    if (!(!n || n[3] && r.match(this.rules.other.unicodeAlphaNumeric)) && (!(n[1] || n[2]) || !r || this.rules.inline.punctuation.exec(r))) {
      let i = [...n[0]].length - 1, a, l, u = i, c = 0, f = n[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (f.lastIndex = 0, e = e.slice(-1 * t.length + i); (n = f.exec(e)) != null; ) {
        if (a = n[1] || n[2] || n[3] || n[4] || n[5] || n[6], !a) continue;
        if (l = [...a].length, n[3] || n[4]) {
          u += l;
          continue;
        } else if ((n[5] || n[6]) && i % 3 && !((i + l) % 3)) {
          c += l;
          continue;
        }
        if (u -= l, u > 0) continue;
        l = Math.min(l, l + u + c);
        let d = [...n[0]][0].length, p = t.slice(0, i + n.index + d + l);
        if (Math.min(i, l) % 2) {
          let m = p.slice(1, -1);
          return { type: "em", raw: p, text: m, tokens: this.lexer.inlineTokens(m) };
        }
        let g = p.slice(2, -2);
        return { type: "strong", raw: p, text: g, tokens: this.lexer.inlineTokens(g) };
      }
    }
  }
  codespan(t) {
    let e = this.rules.inline.code.exec(t);
    if (e) {
      let r = e[2].replace(this.rules.other.newLineCharGlobal, " "), n = this.rules.other.nonSpaceChar.test(r), i = this.rules.other.startingSpaceChar.test(r) && this.rules.other.endingSpaceChar.test(r);
      return n && i && (r = r.substring(1, r.length - 1)), { type: "codespan", raw: e[0], text: r };
    }
  }
  br(t) {
    let e = this.rules.inline.br.exec(t);
    if (e) return { type: "br", raw: e[0] };
  }
  del(t) {
    let e = this.rules.inline.del.exec(t);
    if (e) return { type: "del", raw: e[0], text: e[2], tokens: this.lexer.inlineTokens(e[2]) };
  }
  autolink(t) {
    let e = this.rules.inline.autolink.exec(t);
    if (e) {
      let r, n;
      return e[2] === "@" ? (r = e[1], n = "mailto:" + r) : (r = e[1], n = r), { type: "link", raw: e[0], text: r, href: n, tokens: [{ type: "text", raw: r, text: r }] };
    }
  }
  url(t) {
    let e;
    if (e = this.rules.inline.url.exec(t)) {
      let r, n;
      if (e[2] === "@") r = e[0], n = "mailto:" + r;
      else {
        let i;
        do
          i = e[0], e[0] = this.rules.inline._backpedal.exec(e[0])?.[0] ?? "";
        while (i !== e[0]);
        r = e[0], e[1] === "www." ? n = "http://" + e[0] : n = e[0];
      }
      return { type: "link", raw: e[0], text: r, href: n, tokens: [{ type: "text", raw: r, text: r }] };
    }
  }
  inlineText(t) {
    let e = this.rules.inline.text.exec(t);
    if (e) {
      let r = this.lexer.state.inRawBlock;
      return { type: "text", raw: e[0], text: e[0], escaped: r };
    }
  }
}, Ni = class cv {
  tokens;
  options;
  state;
  tokenizer;
  inlineQueue;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || Wl, this.options.tokenizer = this.options.tokenizer || new Rd(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 };
    let r = { other: gn, block: Bf.normal, inline: Eu.normal };
    this.options.pedantic ? (r.block = Bf.pedantic, r.inline = Eu.pedantic) : this.options.gfm && (r.block = Bf.gfm, this.options.breaks ? r.inline = Eu.breaks : r.inline = Eu.gfm), this.tokenizer.rules = r;
  }
  static get rules() {
    return { block: Bf, inline: Eu };
  }
  static lex(e, r) {
    return new cv(r).lex(e);
  }
  static lexInline(e, r) {
    return new cv(r).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(gn.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let r = 0; r < this.inlineQueue.length; r++) {
      let n = this.inlineQueue[r];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, r = [], n = !1) {
    for (this.options.pedantic && (e = e.replace(gn.tabCharGlobal, "    ").replace(gn.spaceLine, "")); e; ) {
      let i;
      if (this.options.extensions?.block?.some((l) => (i = l.call({ lexer: this }, e, r)) ? (e = e.substring(i.raw.length), r.push(i), !0) : !1)) continue;
      if (i = this.tokenizer.space(e)) {
        e = e.substring(i.raw.length);
        let l = r.at(-1);
        i.raw.length === 1 && l !== void 0 ? l.raw += `
` : r.push(i);
        continue;
      }
      if (i = this.tokenizer.code(e)) {
        e = e.substring(i.raw.length);
        let l = r.at(-1);
        l?.type === "paragraph" || l?.type === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + i.raw, l.text += `
` + i.text, this.inlineQueue.at(-1).src = l.text) : r.push(i);
        continue;
      }
      if (i = this.tokenizer.fences(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.heading(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.hr(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.blockquote(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.list(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.html(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.def(e)) {
        e = e.substring(i.raw.length);
        let l = r.at(-1);
        l?.type === "paragraph" || l?.type === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + i.raw, l.text += `
` + i.raw, this.inlineQueue.at(-1).src = l.text) : this.tokens.links[i.tag] || (this.tokens.links[i.tag] = { href: i.href, title: i.title });
        continue;
      }
      if (i = this.tokenizer.table(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      if (i = this.tokenizer.lheading(e)) {
        e = e.substring(i.raw.length), r.push(i);
        continue;
      }
      let a = e;
      if (this.options.extensions?.startBlock) {
        let l = 1 / 0, u = e.slice(1), c;
        this.options.extensions.startBlock.forEach((f) => {
          c = f.call({ lexer: this }, u), typeof c == "number" && c >= 0 && (l = Math.min(l, c));
        }), l < 1 / 0 && l >= 0 && (a = e.substring(0, l + 1));
      }
      if (this.state.top && (i = this.tokenizer.paragraph(a))) {
        let l = r.at(-1);
        n && l?.type === "paragraph" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + i.raw, l.text += `
` + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = l.text) : r.push(i), n = a.length !== e.length, e = e.substring(i.raw.length);
        continue;
      }
      if (i = this.tokenizer.text(e)) {
        e = e.substring(i.raw.length);
        let l = r.at(-1);
        l?.type === "text" ? (l.raw += (l.raw.endsWith(`
`) ? "" : `
`) + i.raw, l.text += `
` + i.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = l.text) : r.push(i);
        continue;
      }
      if (e) {
        let l = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(l);
          break;
        } else throw new Error(l);
      }
    }
    return this.state.top = !0, r;
  }
  inline(e, r = []) {
    return this.inlineQueue.push({ src: e, tokens: r }), r;
  }
  inlineTokens(e, r = []) {
    let n = e, i = null;
    if (this.tokens.links) {
      let u = Object.keys(this.tokens.links);
      if (u.length > 0) for (; (i = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; ) u.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (i = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; ) n = n.slice(0, i.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; (i = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; ) n = n.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    let a = !1, l = "";
    for (; e; ) {
      a || (l = ""), a = !1;
      let u;
      if (this.options.extensions?.inline?.some((f) => (u = f.call({ lexer: this }, e, r)) ? (e = e.substring(u.raw.length), r.push(u), !0) : !1)) continue;
      if (u = this.tokenizer.escape(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.tag(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.link(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(u.raw.length);
        let f = r.at(-1);
        u.type === "text" && f?.type === "text" ? (f.raw += u.raw, f.text += u.text) : r.push(u);
        continue;
      }
      if (u = this.tokenizer.emStrong(e, n, l)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.codespan(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.br(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.del(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (u = this.tokenizer.autolink(e)) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      if (!this.state.inLink && (u = this.tokenizer.url(e))) {
        e = e.substring(u.raw.length), r.push(u);
        continue;
      }
      let c = e;
      if (this.options.extensions?.startInline) {
        let f = 1 / 0, d = e.slice(1), p;
        this.options.extensions.startInline.forEach((g) => {
          p = g.call({ lexer: this }, d), typeof p == "number" && p >= 0 && (f = Math.min(f, p));
        }), f < 1 / 0 && f >= 0 && (c = e.substring(0, f + 1));
      }
      if (u = this.tokenizer.inlineText(c)) {
        e = e.substring(u.raw.length), u.raw.slice(-1) !== "_" && (l = u.raw.slice(-1)), a = !0;
        let f = r.at(-1);
        f?.type === "text" ? (f.raw += u.raw, f.text += u.text) : r.push(u);
        continue;
      }
      if (e) {
        let f = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(f);
          break;
        } else throw new Error(f);
      }
    }
    return r;
  }
}, Ad = class {
  options;
  parser;
  constructor(t) {
    this.options = t || Wl;
  }
  space(t) {
    return "";
  }
  code({ text: t, lang: e, escaped: r }) {
    let n = (e || "").match(gn.notSpaceStart)?.[0], i = t.replace(gn.endingNewline, "") + `
`;
    return n ? '<pre><code class="language-' + Qo(n) + '">' + (r ? i : Qo(i, !0)) + `</code></pre>
` : "<pre><code>" + (r ? i : Qo(i, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: t }) {
    return `<blockquote>
${this.parser.parse(t)}</blockquote>
`;
  }
  html({ text: t }) {
    return t;
  }
  heading({ tokens: t, depth: e }) {
    return `<h${e}>${this.parser.parseInline(t)}</h${e}>
`;
  }
  hr(t) {
    return `<hr>
`;
  }
  list(t) {
    let e = t.ordered, r = t.start, n = "";
    for (let l = 0; l < t.items.length; l++) {
      let u = t.items[l];
      n += this.listitem(u);
    }
    let i = e ? "ol" : "ul", a = e && r !== 1 ? ' start="' + r + '"' : "";
    return "<" + i + a + `>
` + n + "</" + i + `>
`;
  }
  listitem(t) {
    let e = "";
    if (t.task) {
      let r = this.checkbox({ checked: !!t.checked });
      t.loose ? t.tokens[0]?.type === "paragraph" ? (t.tokens[0].text = r + " " + t.tokens[0].text, t.tokens[0].tokens && t.tokens[0].tokens.length > 0 && t.tokens[0].tokens[0].type === "text" && (t.tokens[0].tokens[0].text = r + " " + Qo(t.tokens[0].tokens[0].text), t.tokens[0].tokens[0].escaped = !0)) : t.tokens.unshift({ type: "text", raw: r + " ", text: r + " ", escaped: !0 }) : e += r + " ";
    }
    return e += this.parser.parse(t.tokens, !!t.loose), `<li>${e}</li>
`;
  }
  checkbox({ checked: t }) {
    return "<input " + (t ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: t }) {
    return `<p>${this.parser.parseInline(t)}</p>
`;
  }
  table(t) {
    let e = "", r = "";
    for (let i = 0; i < t.header.length; i++) r += this.tablecell(t.header[i]);
    e += this.tablerow({ text: r });
    let n = "";
    for (let i = 0; i < t.rows.length; i++) {
      let a = t.rows[i];
      r = "";
      for (let l = 0; l < a.length; l++) r += this.tablecell(a[l]);
      n += this.tablerow({ text: r });
    }
    return n && (n = `<tbody>${n}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + n + `</table>
`;
  }
  tablerow({ text: t }) {
    return `<tr>
${t}</tr>
`;
  }
  tablecell(t) {
    let e = this.parser.parseInline(t.tokens), r = t.header ? "th" : "td";
    return (t.align ? `<${r} align="${t.align}">` : `<${r}>`) + e + `</${r}>
`;
  }
  strong({ tokens: t }) {
    return `<strong>${this.parser.parseInline(t)}</strong>`;
  }
  em({ tokens: t }) {
    return `<em>${this.parser.parseInline(t)}</em>`;
  }
  codespan({ text: t }) {
    return `<code>${Qo(t, !0)}</code>`;
  }
  br(t) {
    return "<br>";
  }
  del({ tokens: t }) {
    return `<del>${this.parser.parseInline(t)}</del>`;
  }
  link({ href: t, title: e, tokens: r }) {
    let n = this.parser.parseInline(r), i = Gx(t);
    if (i === null) return n;
    t = i;
    let a = '<a href="' + t + '"';
    return e && (a += ' title="' + Qo(e) + '"'), a += ">" + n + "</a>", a;
  }
  image({ href: t, title: e, text: r, tokens: n }) {
    n && (r = this.parser.parseInline(n, this.parser.textRenderer));
    let i = Gx(t);
    if (i === null) return Qo(r);
    t = i;
    let a = `<img src="${t}" alt="${r}"`;
    return e && (a += ` title="${Qo(e)}"`), a += ">", a;
  }
  text(t) {
    return "tokens" in t && t.tokens ? this.parser.parseInline(t.tokens) : "escaped" in t && t.escaped ? t.text : Qo(t.text);
  }
}, Jg = class {
  strong({ text: t }) {
    return t;
  }
  em({ text: t }) {
    return t;
  }
  codespan({ text: t }) {
    return t;
  }
  del({ text: t }) {
    return t;
  }
  html({ text: t }) {
    return t;
  }
  text({ text: t }) {
    return t;
  }
  link({ text: t }) {
    return "" + t;
  }
  image({ text: t }) {
    return "" + t;
  }
  br() {
    return "";
  }
}, zi = class fv {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || Wl, this.options.renderer = this.options.renderer || new Ad(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Jg();
  }
  static parse(e, r) {
    return new fv(r).parse(e);
  }
  static parseInline(e, r) {
    return new fv(r).parseInline(e);
  }
  parse(e, r = !0) {
    let n = "";
    for (let i = 0; i < e.length; i++) {
      let a = e[i];
      if (this.options.extensions?.renderers?.[a.type]) {
        let u = a, c = this.options.extensions.renderers[u.type].call({ parser: this }, u);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(u.type)) {
          n += c || "";
          continue;
        }
      }
      let l = a;
      switch (l.type) {
        case "space": {
          n += this.renderer.space(l);
          continue;
        }
        case "hr": {
          n += this.renderer.hr(l);
          continue;
        }
        case "heading": {
          n += this.renderer.heading(l);
          continue;
        }
        case "code": {
          n += this.renderer.code(l);
          continue;
        }
        case "table": {
          n += this.renderer.table(l);
          continue;
        }
        case "blockquote": {
          n += this.renderer.blockquote(l);
          continue;
        }
        case "list": {
          n += this.renderer.list(l);
          continue;
        }
        case "html": {
          n += this.renderer.html(l);
          continue;
        }
        case "paragraph": {
          n += this.renderer.paragraph(l);
          continue;
        }
        case "text": {
          let u = l, c = this.renderer.text(u);
          for (; i + 1 < e.length && e[i + 1].type === "text"; ) u = e[++i], c += `
` + this.renderer.text(u);
          r ? n += this.renderer.paragraph({ type: "paragraph", raw: c, text: c, tokens: [{ type: "text", raw: c, text: c, escaped: !0 }] }) : n += c;
          continue;
        }
        default: {
          let u = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent) return console.error(u), "";
          throw new Error(u);
        }
      }
    }
    return n;
  }
  parseInline(e, r = this.renderer) {
    let n = "";
    for (let i = 0; i < e.length; i++) {
      let a = e[i];
      if (this.options.extensions?.renderers?.[a.type]) {
        let u = this.options.extensions.renderers[a.type].call({ parser: this }, a);
        if (u !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(a.type)) {
          n += u || "";
          continue;
        }
      }
      let l = a;
      switch (l.type) {
        case "escape": {
          n += r.text(l);
          break;
        }
        case "html": {
          n += r.html(l);
          break;
        }
        case "link": {
          n += r.link(l);
          break;
        }
        case "image": {
          n += r.image(l);
          break;
        }
        case "strong": {
          n += r.strong(l);
          break;
        }
        case "em": {
          n += r.em(l);
          break;
        }
        case "codespan": {
          n += r.codespan(l);
          break;
        }
        case "br": {
          n += r.br(l);
          break;
        }
        case "del": {
          n += r.del(l);
          break;
        }
        case "text": {
          n += r.text(l);
          break;
        }
        default: {
          let u = 'Token with "' + l.type + '" type was not found.';
          if (this.options.silent) return console.error(u), "";
          throw new Error(u);
        }
      }
    }
    return n;
  }
}, Gf = class {
  options;
  block;
  constructor(t) {
    this.options = t || Wl;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(t) {
    return t;
  }
  postprocess(t) {
    return t;
  }
  processAllTokens(t) {
    return t;
  }
  provideLexer() {
    return this.block ? Ni.lex : Ni.lexInline;
  }
  provideParser() {
    return this.block ? zi.parse : zi.parseInline;
  }
}, TL = class {
  defaults = Hg();
  options = this.setOptions;
  parse = this.parseMarkdown(!0);
  parseInline = this.parseMarkdown(!1);
  Parser = zi;
  Renderer = Ad;
  TextRenderer = Jg;
  Lexer = Ni;
  Tokenizer = Rd;
  Hooks = Gf;
  constructor(...t) {
    this.use(...t);
  }
  walkTokens(t, e) {
    let r = [];
    for (let n of t) switch (r = r.concat(e.call(this, n)), n.type) {
      case "table": {
        let i = n;
        for (let a of i.header) r = r.concat(this.walkTokens(a.tokens, e));
        for (let a of i.rows) for (let l of a) r = r.concat(this.walkTokens(l.tokens, e));
        break;
      }
      case "list": {
        let i = n;
        r = r.concat(this.walkTokens(i.items, e));
        break;
      }
      default: {
        let i = n;
        this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((a) => {
          let l = i[a].flat(1 / 0);
          r = r.concat(this.walkTokens(l, e));
        }) : i.tokens && (r = r.concat(this.walkTokens(i.tokens, e)));
      }
    }
    return r;
  }
  use(...t) {
    let e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return t.forEach((r) => {
      let n = { ...r };
      if (n.async = this.defaults.async || n.async || !1, r.extensions && (r.extensions.forEach((i) => {
        if (!i.name) throw new Error("extension name required");
        if ("renderer" in i) {
          let a = e.renderers[i.name];
          a ? e.renderers[i.name] = function(...l) {
            let u = i.renderer.apply(this, l);
            return u === !1 && (u = a.apply(this, l)), u;
          } : e.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let a = e[i.level];
          a ? a.unshift(i.tokenizer) : e[i.level] = [i.tokenizer], i.start && (i.level === "block" ? e.startBlock ? e.startBlock.push(i.start) : e.startBlock = [i.start] : i.level === "inline" && (e.startInline ? e.startInline.push(i.start) : e.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (e.childTokens[i.name] = i.childTokens);
      }), n.extensions = e), r.renderer) {
        let i = this.defaults.renderer || new Ad(this.defaults);
        for (let a in r.renderer) {
          if (!(a in i)) throw new Error(`renderer '${a}' does not exist`);
          if (["options", "parser"].includes(a)) continue;
          let l = a, u = r.renderer[l], c = i[l];
          i[l] = (...f) => {
            let d = u.apply(i, f);
            return d === !1 && (d = c.apply(i, f)), d || "";
          };
        }
        n.renderer = i;
      }
      if (r.tokenizer) {
        let i = this.defaults.tokenizer || new Rd(this.defaults);
        for (let a in r.tokenizer) {
          if (!(a in i)) throw new Error(`tokenizer '${a}' does not exist`);
          if (["options", "rules", "lexer"].includes(a)) continue;
          let l = a, u = r.tokenizer[l], c = i[l];
          i[l] = (...f) => {
            let d = u.apply(i, f);
            return d === !1 && (d = c.apply(i, f)), d;
          };
        }
        n.tokenizer = i;
      }
      if (r.hooks) {
        let i = this.defaults.hooks || new Gf();
        for (let a in r.hooks) {
          if (!(a in i)) throw new Error(`hook '${a}' does not exist`);
          if (["options", "block"].includes(a)) continue;
          let l = a, u = r.hooks[l], c = i[l];
          Gf.passThroughHooks.has(a) ? i[l] = (f) => {
            if (this.defaults.async) return Promise.resolve(u.call(i, f)).then((p) => c.call(i, p));
            let d = u.call(i, f);
            return c.call(i, d);
          } : i[l] = (...f) => {
            let d = u.apply(i, f);
            return d === !1 && (d = c.apply(i, f)), d;
          };
        }
        n.hooks = i;
      }
      if (r.walkTokens) {
        let i = this.defaults.walkTokens, a = r.walkTokens;
        n.walkTokens = function(l) {
          let u = [];
          return u.push(a.call(this, l)), i && (u = u.concat(i.call(this, l))), u;
        };
      }
      this.defaults = { ...this.defaults, ...n };
    }), this;
  }
  setOptions(t) {
    return this.defaults = { ...this.defaults, ...t }, this;
  }
  lexer(t, e) {
    return Ni.lex(t, e ?? this.defaults);
  }
  parser(t, e) {
    return zi.parse(t, e ?? this.defaults);
  }
  parseMarkdown(t) {
    return (e, r) => {
      let n = { ...r }, i = { ...this.defaults, ...n }, a = this.onError(!!i.silent, !!i.async);
      if (this.defaults.async === !0 && n.async === !1) return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof e > "u" || e === null) return a(new Error("marked(): input parameter is undefined or null"));
      if (typeof e != "string") return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(e) + ", string expected"));
      i.hooks && (i.hooks.options = i, i.hooks.block = t);
      let l = i.hooks ? i.hooks.provideLexer() : t ? Ni.lex : Ni.lexInline, u = i.hooks ? i.hooks.provideParser() : t ? zi.parse : zi.parseInline;
      if (i.async) return Promise.resolve(i.hooks ? i.hooks.preprocess(e) : e).then((c) => l(c, i)).then((c) => i.hooks ? i.hooks.processAllTokens(c) : c).then((c) => i.walkTokens ? Promise.all(this.walkTokens(c, i.walkTokens)).then(() => c) : c).then((c) => u(c, i)).then((c) => i.hooks ? i.hooks.postprocess(c) : c).catch(a);
      try {
        i.hooks && (e = i.hooks.preprocess(e));
        let c = l(e, i);
        i.hooks && (c = i.hooks.processAllTokens(c)), i.walkTokens && this.walkTokens(c, i.walkTokens);
        let f = u(c, i);
        return i.hooks && (f = i.hooks.postprocess(f)), f;
      } catch (c) {
        return a(c);
      }
    };
  }
  onError(t, e) {
    return (r) => {
      if (r.message += `
Please report this to https://github.com/markedjs/marked.`, t) {
        let n = "<p>An error occurred:</p><pre>" + Qo(r.message + "", !0) + "</pre>";
        return e ? Promise.resolve(n) : n;
      }
      if (e) return Promise.reject(r);
      throw r;
    };
  }
}, Cl = new TL();
function er(t, e) {
  return Cl.parse(t, e);
}
er.options = er.setOptions = function(t) {
  return Cl.setOptions(t), er.defaults = Cl.defaults, J3(er.defaults), er;
};
er.getDefaults = Hg;
er.defaults = Wl;
er.use = function(...t) {
  return Cl.use(...t), er.defaults = Cl.defaults, J3(er.defaults), er;
};
er.walkTokens = function(t, e) {
  return Cl.walkTokens(t, e);
};
er.parseInline = Cl.parseInline;
er.Parser = zi;
er.parser = zi.parse;
er.Renderer = Ad;
er.TextRenderer = Jg;
er.Lexer = Ni;
er.lexer = Ni.lex;
er.Tokenizer = Rd;
er.Hooks = Gf;
er.parse = er;
er.options;
er.setOptions;
er.use;
er.walkTokens;
er.parseInline;
zi.parse;
Ni.lex;
class $L {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    this.element.innerHTML = '<div class="markdown-content">' + er(e.value?.toString() ?? "(null)", { async: !1, gfm: !0 }) + "</div>";
  }
}
class FL {
  element;
  constructor(e, r) {
    this.element = e, this.update(r);
  }
  update(e) {
    if (e.value != null) {
      let r = document.createElement("a");
      r.href = e.value, r.innerText = e.value, r.className = "underline", r.target = "_blank", this.element.replaceChildren(r);
    } else
      this.element.innerText = "(null)";
  }
}
let c_ = {
  markdown: $L,
  image: VP,
  url: FL,
  json: XP
}, NL = [
  { renderer: "markdown", label: "Markdown" },
  { renderer: "image", label: "Image" },
  { renderer: "url", label: "Link" },
  { renderer: "json", label: "JSON" }
];
function Kx(t) {
  if (!(t == null || t == "plain"))
    return typeof t == "string" ? c_[t] : t;
}
function zL(t, e) {
  let r = {};
  if (e != null)
    for (let n in e)
      r[n] = Kx(e[n]);
  for (let n in t)
    t[n] != null && (r[n] = Kx(t[n]));
  return r;
}
var OL = /* @__PURE__ */ Se('<tr class="leading-10"><td class="w-full"><div class="max-w-80 whitespace-nowrap text-ellipsis overflow-x-hidden"> </div></td><td><!></td></tr>'), BL = /* @__PURE__ */ Se('<div class="max-h-48 overflow-x-hidden overflow-y-scroll border border-slate-200 dark:border-slate-600 p-2 rounded-md"><table><tbody></tbody></table></div>');
function DL(t, e) {
  gt(e, !0);
  function r(l, u) {
    let c = {};
    for (let f of e.columns)
      f.name == l ? u != null && u != "" && (c[f.name] = u) : e.styles[f.name] && (c[f.name] = e.styles[f.name]);
    e.onStylesChange(c);
  }
  var n = BL(), i = ne(n), a = ne(i);
  Gt(a, 21, () => e.columns, or, (l, u) => {
    var c = OL(), f = ne(c), d = ne(f), p = ne(d, !0);
    ee(d), ee(f);
    var g = le(f), m = ne(g);
    {
      let y = /* @__PURE__ */ oe(() => e.styles[h(u).name] ?? null), w = /* @__PURE__ */ oe(() => [
        { value: null, label: "(default)" },
        ...NL.map((x) => ({ value: x.renderer, label: x.label }))
      ]);
      Za(m, {
        get value() {
          return h(y);
        },
        onChange: (x) => r(h(u).name, x),
        get options() {
          return h(w);
        }
      });
    }
    ee(g), ee(c), Ee(() => rt(p, h(u).name)), te(l, c);
  }), ee(a), ee(i), ee(n), te(t, n), mt();
}
function Zx(t, e) {
  gt(e, !0);
  let r = Je(e, "label", 3, null), n = Je(e, "icon", 3, null), i = Je(e, "title", 3, ""), a = Je(e, "order", 3, null), l = Je(e, "style", 3, "default"), u = /* @__PURE__ */ ge("ready");
  async function c() {
    if (e.onClick) {
      W(u, "running");
      try {
        await e.onClick(), W(u, "ready");
      } catch {
        W(u, "error");
      }
    }
  }
  {
    let f = /* @__PURE__ */ oe(() => h(u) == "ready" ? n() : h(u) == "running" ? Q3 : lh);
    Oo(t, {
      get label() {
        return r();
      },
      get icon() {
        return h(f);
      },
      get title() {
        return i();
      },
      get order() {
        return a();
      },
      get style() {
        return l();
      },
      get class() {
        return e.class;
      },
      onClick: c
    });
  }
  mt();
}
var PL = (t, e) => {
  e(!e());
}, LL = /* @__PURE__ */ Se('<span class="flex h-5 items-center"> </span>'), qL = /* @__PURE__ */ Se("<button><!> <!></button>");
function Xf(t, e) {
  gt(e, !0);
  let r = Je(e, "title", 3, ""), n = Je(e, "checked", 15), i = Je(e, "label", 3, null), a = Je(e, "icon", 3, null);
  var l = qL();
  let u;
  l.__click = [PL, n];
  var c = ne(l);
  {
    var f = (g) => {
      var m = fr();
      const y = /* @__PURE__ */ oe(a);
      var w = We(m);
      Dv(w, () => h(y), (x, k) => {
        k(x, { class: "w-5 h-5" });
      }), te(g, m);
    };
    Te(c, (g) => {
      a() != null && g(f);
    });
  }
  var d = le(c, 2);
  {
    var p = (g) => {
      var m = LL(), y = ne(m, !0);
      ee(m), Ee(() => rt(y, i())), te(g, m);
    };
    Te(d, (g) => {
      i() != null && g(p);
    });
  }
  ee(l), Ee(
    (g) => {
      u = _r(l, 1, "rounded-md px-1.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex select-none items-center focus-visible:outline-2 outline-blue-600 -outline-offset-1", null, u, g), J(l, "title", r());
    },
    [
      () => ({
        "text-slate-400": !n(),
        "dark:text-slate-500": !n()
      })
    ]
  ), te(t, l), mt();
}
Tr(["click"]);
function IL(t, e) {
  h(e) && t.key == "Escape" && (W(e, !1), t.stopPropagation());
}
var jL = /* @__PURE__ */ Se("<div><!></div>"), UL = /* @__PURE__ */ Se('<div class="relative"><!> <!></div>');
function WL(t, e) {
  gt(e, !0);
  let r = Je(e, "title", 3, ""), n = Je(e, "label", 3, null), i = Je(e, "icon", 3, null), a = Je(e, "anchor", 3, "right"), l = /* @__PURE__ */ ge(!1), u = /* @__PURE__ */ ge(void 0);
  yn(() => {
    if (h(u) != null) {
      let g = (y) => {
        !h(l) || !h(u) || y.target && !h(u).contains(y.target) && W(l, !1);
      }, m = h(u).getRootNode();
      return m.addEventListener("mousedown", g), () => {
        m.removeEventListener("mousedown", g);
      };
    }
  });
  var c = UL();
  c.__keydown = [IL, l];
  var f = ne(c);
  Xf(f, {
    get icon() {
      return i();
    },
    get title() {
      return r();
    },
    get label() {
      return n();
    },
    get checked() {
      return h(l);
    },
    set checked(g) {
      W(l, g, !0);
    }
  });
  var d = le(f, 2);
  {
    var p = (g) => {
      var m = jL();
      let y;
      var w = ne(m);
      Gu(w, () => e.children ?? Ft), ee(m), Ee((x) => y = _r(m, 1, "absolute top-[30px] px-3 py-3 rounded-md z-20 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-lg", null, y, x), [
        () => ({ "right-0": a() == "right", "left-0": a() == "left" })
      ]), te(g, m);
    };
    Te(d, (g) => {
      h(l) && g(p);
    });
  }
  ee(c), Wo(c, (g) => W(u, g), () => h(u)), te(t, c), mt();
}
Tr(["keydown"]);
function HL(t, e, r) {
  e(t.clientX - h(r).getBoundingClientRect().left);
  let n = (a) => {
    e(a.clientX - h(r).getBoundingClientRect().left);
  }, i = () => {
    window.removeEventListener("mousemove", n), window.removeEventListener("mouseup", i);
  };
  window.addEventListener("mousemove", n), window.addEventListener("mouseup", i);
}
function VL(t, e, r, n, i) {
  t.key == "ArrowLeft" ? e(Math.max(e() - (r() ?? 1), n())) : t.key == "ArrowRight" && e(Math.min(e() + (r() ?? 1), i()));
}
var GL = /* @__PURE__ */ Se('<div class="group relative" role="slider" tabindex="0"><div class="bg-slate-400 dark:bg-slate-500 rounded-full absolute"></div> <div class="bg-blue-500 rounded-full absolute group-hover:bg-blue-600 dark:group-hover:bg-blue-400"></div></div>');
function XL(t, e) {
  gt(e, !0);
  let r = Je(e, "value", 15, 0), n = Je(e, "min", 3, 0), i = Je(e, "max", 3, 100), a = Je(e, "step", 3, void 0), l = 100, u = 15, c = /* @__PURE__ */ oe(() => (k) => (k - n()) / (i() - n()) * (l - u)), f = /* @__PURE__ */ oe(() => (k) => k / (l - u) * (i() - n()) + n()), d = /* @__PURE__ */ oe(() => h(c)(r())), p = /* @__PURE__ */ ge(void 0);
  function g(k) {
    let S = h(f)(k - u / 2);
    S = Math.max(n(), Math.min(i(), S)), a() != null && (S = Math.round(S / a()) * a()), r(S);
  }
  var m = GL();
  m.__mousedown = [HL, g, p], m.__keydown = [VL, r, a, n, i], tt(m, "", {}, { width: "100px", height: "28px" });
  var y = ne(m);
  tt(y, "", {}, { left: "0px", top: "12px", width: "100px", height: "4px" });
  var w = le(y, 2);
  let x;
  ee(m), Wo(m, (k) => W(p, k), () => h(p)), Ee(
    (k) => {
      J(m, "aria-valuenow", r()), J(m, "aria-valuemin", n()), J(m, "aria-valuemax", i()), x = tt(w, "", x, k);
    },
    [
      () => ({
        left: `${h(d) ?? ""}px`,
        top: "6.5px",
        width: "15px",
        height: "15px"
      })
    ]
  ), te(t, m), mt();
}
Tr(["mousedown", "keydown"]);
const Qx = "0.8.0";
var YL = /* @__PURE__ */ bt('<line class="stroke-orange-500"></line><line class="stroke-orange-500"></line><line class="stroke-orange-500"></line><line class="stroke-orange-500"></line>', 1), KL = /* @__PURE__ */ bt('<!><circle class="fill-orange-500 stroke-orange-700 stroke-2"></circle>', 1), ZL = /* @__PURE__ */ bt("<svg><g></g></svg>");
function QL(t, e) {
  gt(e, !0);
  var r = ZL(), n = ne(r);
  Gt(n, 21, () => e.items, or, (i, a) => {
    var l = fr(), u = We(l);
    {
      var c = (f) => {
        var d = KL();
        const p = /* @__PURE__ */ oe(() => e.proxy.location(h(a).x, h(a).y)), g = /* @__PURE__ */ oe(() => h(a).id == e.highlightItem?.id);
        var m = We(d);
        {
          var y = (x) => {
            var k = YL(), S = We(k), _ = le(S), E = le(_), C = le(E);
            Ee(() => {
              J(S, "x1", h(p).x - 20), J(S, "x2", h(p).x - 10), J(S, "y1", h(p).y), J(S, "y2", h(p).y), J(_, "x1", h(p).x + 20), J(_, "x2", h(p).x + 10), J(_, "y1", h(p).y), J(_, "y2", h(p).y), J(E, "x1", h(p).x), J(E, "x2", h(p).x), J(E, "y1", h(p).y - 20), J(E, "y2", h(p).y - 10), J(C, "x1", h(p).x), J(C, "x2", h(p).x), J(C, "y1", h(p).y + 20), J(C, "y2", h(p).y + 10);
            }), te(x, k);
          };
          Te(m, (x) => {
            h(g) && x(y);
          });
        }
        var w = le(m);
        J(w, "r", 4), Ee(() => {
          J(w, "cx", h(p).x), J(w, "cy", h(p).y);
        }), te(f, d);
      };
      Te(u, (f) => {
        h(a).x != null && h(a).y != null && f(c);
      });
    }
    te(i, l);
  }), ee(n), ee(r), Ee(() => {
    J(r, "width", e.proxy.width), J(r, "height", e.proxy.height);
  }), te(t, r), mt();
}
var JL = /* @__PURE__ */ Se("<div></div>");
function eq(t, e) {
  gt(e, !0);
  let r = Je(e, "text", 3, ""), n = Je(e, "renderer", 3, "plain"), i = /* @__PURE__ */ oe(() => c_[n()] ?? null);
  function a(d, p) {
    let g = new p.class(d, { value: p.value });
    return {
      update(m) {
        g.update?.({ value: m.value });
      },
      destroy() {
        g.destroy?.();
      }
    };
  }
  var l = fr(), u = We(l);
  {
    var c = (d) => {
      var p = $n();
      Ee(() => rt(p, r())), te(d, p);
    }, f = (d) => {
      var p = fr(), g = We(p);
      Ld(g, () => h(i), (m) => {
        var y = JL();
        Gw(y, (w, x) => a?.(w, x), () => ({ class: h(i), value: r() })), te(m, y);
      }), te(d, p);
    };
    Te(u, (d) => {
      h(i) == null ? d(c) : d(f, !1);
    });
  }
  te(t, l), mt();
}
var tq = /* @__PURE__ */ Se('<a class="underline" target="_blank"> </a>'), rq = /* @__PURE__ */ Se('<div class="px-2 flex gap-2 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-md"><div class="text-slate-400 dark:text-slate-400 font-medium"> </div> <div class="text-ellipsis whitespace-nowrap overflow-hidden max-w-72"><!></div></div>'), nq = (t, e) => {
  e.onNearestNeighborSearch?.(e.tooltip.identifier);
}, oq = /* @__PURE__ */ Se('<div><button class="text-sm flex gap-0.5 items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300"><!> Nearest Neighbors</button></div>'), iq = /* @__PURE__ */ Se('<div class="embedding-atlas-root"><div><div class="flex-none"><!></div> <div class="flex-none flex flex-row gap-1 flex-wrap"><!></div> <!></div></div>');
function aq(t, e) {
  gt(e, !0);
  let r = Je(e, "textRenderer", 3, "plain");
  function n(y) {
    return typeof y == "string" && (y.startsWith("http://") || y.startsWith("https://"));
  }
  var i = iq(), a = ne(i);
  let l;
  tt(a, "", {}, { "max-width": "400px", "max-height": "300px" });
  var u = ne(a), c = ne(u);
  {
    let y = /* @__PURE__ */ oe(() => e.textField == null ? e.tooltip.text : e.tooltip.fields?.[e.textField]);
    eq(c, {
      get text() {
        return h(y);
      },
      get renderer() {
        return r();
      }
    });
  }
  ee(u);
  var f = le(u, 2), d = ne(f);
  {
    var p = (y) => {
      var w = fr(), x = We(w);
      Gt(x, 17, () => Object.keys(e.tooltip.fields), or, (k, S) => {
        var _ = rq();
        const E = /* @__PURE__ */ oe(() => e.tooltip.fields[h(S)]?.toString() ?? "(null)");
        var C = ne(_), R = ne(C, !0);
        ee(C);
        var A = le(C, 2), N = ne(A);
        {
          var L = (B) => {
            var P = tq(), q = ne(P, !0);
            ee(P), Ee(() => {
              J(P, "href", h(E)), rt(q, h(E));
            }), te(B, P);
          }, j = (B) => {
            var P = $n();
            Ee(() => rt(P, h(E))), te(B, P);
          };
          Te(N, (B) => {
            n(h(E)) ? B(L) : B(j, !1);
          });
        }
        ee(A), ee(_), Ee(() => {
          rt(R, h(S)), J(A, "title", h(E));
        }), te(k, _);
      }), te(y, w);
    };
    Te(d, (y) => {
      e.tooltip.fields != null && y(p);
    });
  }
  ee(f);
  var g = le(f, 2);
  {
    var m = (y) => {
      var w = oq(), x = ne(w);
      x.__click = [nq, e];
      var k = ne(x);
      BD(k, {}), Ev(), ee(x), ee(w), te(y, w);
    };
    Te(g, (y) => {
      e.onNearestNeighborSearch && y(m);
    });
  }
  ee(a), ee(i), Ee((y) => l = _r(a, 1, "p-2 border flex flex-col gap-2 border-slate-500 shadow-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-md text-ellipsis overflow-x-hidden overflow-y-scroll", null, l, y), [() => ({ dark: e.darkMode })]), te(t, i), mt();
}
Tr(["click"]);
function f_(t) {
  return class {
    component;
    constructor(e, r) {
      this.component = Ww({ component: t, target: e, props: r });
    }
    update(e) {
      this.component.$set(e);
    }
    destroy() {
      this.component.$destroy();
    }
  };
}
const lq = f_(aq), sq = f_(
  QL
);
let d_ = typeof window < "u" ? window.matchMedia?.("(prefers-color-scheme: dark)") : null, h_ = Xu(d_?.matches ?? !1);
d_?.addEventListener("change", (t) => {
  h_.set(t.matches);
});
function uq() {
  let t = Xu(null);
  return { darkMode: hC([h_, t], ([e, r]) => r ?? e), userDarkMode: t };
}
class cq {
  storeMap;
  currentState;
  notifier;
  notifier2;
  constructor() {
    this.storeMap = /* @__PURE__ */ new Map(), this.currentState = {}, this.notifier = Xu(0), this.notifier2 = Xu(0);
  }
  /** Set the state of all plots */
  set(e) {
    for (let r in e)
      this.currentState[r] = e[r];
    this.notifier2.update((r) => r + 1);
  }
  /** Get the state of all plots */
  get() {
    return this.currentState;
  }
  /** Subscribe to any plot's state change */
  subscribe(e) {
    return this.notifier.subscribe(() => {
      e(this.currentState);
    });
  }
  /** Get a store for plot with the given id */
  store(e) {
    let r = this.storeMap.get(e);
    return r != null || (r = {
      set: (n) => {
        this.currentState[e] = n, this.notifier.update((i) => i + 1);
      },
      subscribe: (n) => this.notifier2.subscribe(() => {
        let i = this.currentState[e] ?? null;
        n(i);
      }),
      child: (n) => this.store(e + "/" + n)
    }, this.storeMap.set(e, r)), r;
  }
}
class fq {
  worker;
  callbacks;
  constructor() {
    this.worker = new Worker(new URL("./search.worker.js", import.meta.url), { type: "module" }), this.callbacks = /* @__PURE__ */ new Map(), this.worker.onmessage = (e) => {
      let r = this.callbacks.get(e.data.identifier);
      r != null && (this.callbacks.delete(e.data.identifier), r(e.data));
    };
  }
  rpc(e) {
    return new Promise((r, n) => {
      let i = (/* @__PURE__ */ new Date()).getTime() + "-" + Math.random();
      this.callbacks.set(i, r), this.worker.postMessage({ ...e, identifier: i });
    });
  }
  async clear() {
    await this.rpc({ type: "clear" });
  }
  async addPoints(e) {
    await this.rpc({ type: "points", points: e });
  }
  async query(e, r) {
    return (await this.rpc({ type: "query", query: e, limit: r })).result;
  }
}
class dq {
  coordinator;
  table;
  columns;
  backend;
  currentIndex = null;
  constructor(e, r, n) {
    this.coordinator = e, this.table = r, this.columns = n, this.currentIndex = null, this.backend = new fq();
  }
  predicateString(e) {
    return e != null && e.toString() != "" ? e.toString() : null;
  }
  async buildIndexIfNeeded(e) {
    let r = this.predicateString(e);
    if (this.currentIndex != null && this.currentIndex.predicate == r)
      return;
    let n;
    r != null ? n = await this.coordinator.query(`
        SELECT
          ${T.column(this.columns.id)} AS id,
          ${T.column(this.columns.text)} AS text
        FROM ${this.table}
        WHERE ${r}
      `) : n = await this.coordinator.query(`
        SELECT
          ${T.column(this.columns.id)} AS id,
          ${T.column(this.columns.text)} AS text
        FROM ${this.table}
      `), await this.backend.clear(), await this.backend.addPoints(Array.from(n)), this.currentIndex = { predicate: r };
  }
  async fullTextSearch(e, r = {}) {
    let n = r.limit ?? 100, i = r.predicate;
    return await this.buildIndexIfNeeded(i), (await this.backend.query(e, n)).map((a) => ({ id: a }));
  }
}
async function hq(t, e, r, n, i) {
  let a = i.map((d) => d.id), l = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  for (let d = 0; d < a.length; d++)
    l.set(a[d], d), u.set(a[d], i[d]);
  let c = await t.query(`
    SELECT
      ${T.column(r.id, e)} AS id,
      ${r.x ? `${T.column(r.x, e)} AS x,` : ""}
      ${r.y ? `${T.column(r.y, e)} AS y,` : ""}
      ${r.text ? `${T.column(r.text, e)} AS text,` : ""}
    FROM (
      SELECT ${T.column(r.id, e)} AS __search_result_id__
      FROM ${e}
      WHERE
        ${T.column(r.id, e)} IN [${a.map((d) => T.literal(d)).join(", ")}]
        ${n ? `AND (${n})` : ""}
    )
    LEFT JOIN ${e} ON ${T.column(r.id, e)} = __search_result_id__
  `), f = Array.from(c).map((d) => ({ ...d, distance: u.get(d.id)?.distance }));
  return f = f.sort((d, p) => (l.get(d.id) ?? 0) - (l.get(p.id) ?? 0)), f;
}
function pq(t) {
  let { coordinator: e, table: r, idColumn: n, searcher: i, textColumn: a, neighborsColumn: l } = t, u = {};
  if (i != null && i.fullTextSearch != null)
    u.fullTextSearch = i.fullTextSearch.bind(i);
  else if (a != null) {
    let c = new dq(e, r, { id: n, text: a });
    u.fullTextSearch = c.fullTextSearch.bind(c);
  }
  return i != null && i.nearestNeighbors != null ? u.nearestNeighbors = i.nearestNeighbors.bind(i) : l != null && (u.nearestNeighbors = async (c) => {
    let f = T.Query.from(r).select({ knn: T.column(l) }).where(T.eq(T.column(n), T.literal(c))), d = await e.query(f), p = Array.from(d);
    if (p.length != 1)
      return [];
    let { distances: g, ids: m } = p[0].knn;
    return Array.from(m).map((y, w) => ({ id: y, distance: g[w] })).filter((y) => y.id != c);
  }), u;
}
const vq = {
  fontSize: "13px",
  fontFamily: "system-ui",
  light: {
    primaryBackgroundColor: "white",
    secondaryBackgroundColor: "var(--color-slate-100)",
    // bg-slate-100
    primaryTextColor: "var(--color-slate-500)",
    // text-slate-500
    secondaryTextColor: "var(--color-slate-400)",
    // text-slate-400
    tertiaryTextColor: "var(--color-slate-300)",
    // text-slate-300
    scrollbarPillColor: "var(--color-slate-400)",
    // bg-slate-400
    scrollbarLabelBackgroundColor: "white",
    rowScrollToColor: "var(--color-blue-200)",
    // bg-blue-200
    rowHoverColor: "var(--color-blue-100)"
    // bg-blue-100
  },
  dark: {
    primaryBackgroundColor: "var(--color-slate-900)",
    // bg-slate-900
    secondaryBackgroundColor: "var(--color-slate-800)",
    // bg-slate-800
    primaryTextColor: "var(--color-slate-400)",
    // bg-slate-400
    secondaryTextColor: "var(--color-slate-500)",
    // bg-slate-500
    tertiaryTextColor: "var(--color-slate-600)",
    // bg-slate-600
    scrollbarPillColor: "var(--color-slate-500)",
    // bg-slate-500
    scrollbarLabelBackgroundColor: "var(--color-slate-900)",
    // bg-slate-900
    rowScrollToColor: "var(--color-blue-900)",
    // bg-slate-900
    rowHoverColor: "var(--color-blue-950)"
    // bg-slate-950
  }
};
function gq(t, e = 1e3) {
  let r;
  return (...n) => {
    r && clearTimeout(r), r = setTimeout(() => {
      t(...n);
    }, e);
  };
}
function p_(t, e) {
  t.preventDefault();
  let r = t.pageX, n = t.pageY, i = (l) => {
    l.preventDefault();
    let u = l.pageX - r, c = l.pageY - n;
    e(u, c);
  }, a = () => {
    window.removeEventListener("mousemove", i), window.removeEventListener("mouseup", a);
  };
  window.addEventListener("mousemove", i), window.addEventListener("mouseup", a);
}
function v_() {
  let t = window.localStorage.getItem("embedding-atlas-defaults");
  if (t == null)
    return {};
  try {
    return JSON.parse(t);
  } catch {
    return {};
  }
}
function mq(t, e, r) {
  return v_()[t] ?? e;
}
function yq(t, e) {
  let r = v_();
  r[t] = e, window.localStorage.setItem("embedding-atlas-defaults", JSON.stringify(r));
}
var bq = /* @__PURE__ */ Se('<div class="p-2"><!></div>'), xq = /* @__PURE__ */ Se('<div class="absolute w-96 left-0 top-[32px] rounded-md right-0 z-20 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 overflow-hidden resize shadow-lg"><!></div>'), wq = /* @__PURE__ */ Se('<div class="relative"><!> <!> <!></div>'), kq = /* @__PURE__ */ Se('<div class="text-slate-500 dark:text-slate-400">Embedding Atlas</div>'), _q = /* @__PURE__ */ Se('<div class="select-none flex items-center gap-2"><span class="text-slate-500 dark:text-slate-400">Threshold</span> <!></div>'), Sq = /* @__PURE__ */ Se("<!> <!> <!>", 1), Mq = /* @__PURE__ */ Se('<h4 class="text-slate-500 dark:text-slate-400 my-2 select-none">Text Style</h4> <!>', 1), Cq = /* @__PURE__ */ Se('<div class="flex flex-row gap-2"><!> <!></div>'), Rq = /* @__PURE__ */ Se('<div class="min-w-96"><h4 class="text-slate-500 dark:text-slate-400 mb-2 select-none">Tooltip</h4> <!> <!> <h4 class="text-slate-500 dark:text-slate-400 my-2 select-none">Export</h4> <div class="flex flex-col gap-2"><!> <!></div> <h4 class="text-slate-500 dark:text-slate-400 my-2 select-none">About</h4> <div> </div></div>'), Aq = /* @__PURE__ */ Se('<div class="flex-1 relative bg-white dark:bg-black rounded-md overflow-hidden"><!></div>'), Eq = (t, e) => {
  let r = h(e);
  p_(t, (n, i) => W(e, Math.max(60, r - i), !0));
}, Tq = /* @__PURE__ */ Se('<div class="h-2 cursor-row-resize"></div>'), $q = /* @__PURE__ */ Se("<!> <div><!></div>", 1), Fq = /* @__PURE__ */ Se('<div class="flex-1 flex flex-col mt-0 ml-2 mb-2 mr-2 overflow-hidden"><!> <!></div>'), Nq = (t, e) => {
  let r = h(e);
  p_(t, (n, i) => W(e, Math.max(300, r - n), !0));
}, zq = /* @__PURE__ */ Se('<div class="w-2 -ml-2 cursor-col-resize"></div>'), Oq = /* @__PURE__ */ Se('<!> <div><div class="w-full rounded-md overflow-x-hidden overflow-y-scroll"><!></div></div>', 1), Bq = /* @__PURE__ */ Se('<div class="embedding-atlas-root"><div><div class="m-2 flex flex-row justify-between items-center"><div class="flex flex-row flex-1 justify-between"><div class="flex flex-row items-center"><div class="flex-1"><!></div></div> <div class="flex flex-row items-center gap-3"><!></div></div> <div class="relative h-full"><div class="absolute left-0 right-0 top-0 bottom-0 overflow-hidden transition-opacity"><div class="flex h-full gap-2 items-center justify-end whitespace-nowrap"><!> <div class="flex flex-row gap-1 items-center"><button class="flex px-2.5 mr-1 select-none items-center justify-center text-slate-500 dark:text-slate-300 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 focus-visible:outline-2 outline-blue-600 -outline-offset-1" title="Clear filters">Clear</button></div></div></div></div> <div class="w-3"></div> <div class="flex flex-row gap-0.5"><!> <!> <!> <!> <!></div></div> <div class="flex flex-row overflow-hidden h-full"><!> <!></div></div></div>');
function Dq(t, e) {
  gt(e, !0);
  const [r, n] = Co(), i = () => On(p, "$userDarkMode", r), a = () => On(P, "$plotStateStores", r), l = () => On(d, "$darkMode", r), u = 500, c = Math.min(20, YE()), f = 300, { darkMode: d, userDarkMode: p } = uq();
  yr.coordinator = e.coordinator, yr.darkMode = d, yn(() => {
    switch (e.colorScheme) {
      case "light":
        xu(p, !1);
        break;
      case "dark":
        xu(p, !0);
        break;
      case null:
        xu(p, null);
        break;
    }
  });
  let g = /* @__PURE__ */ ge(!1), m = /* @__PURE__ */ ge(e.projectionColumns != null), y = /* @__PURE__ */ ge(e.projectionColumns == null), w = /* @__PURE__ */ ge(!0), x = /* @__PURE__ */ ge(320), k = /* @__PURE__ */ ge(400);
  const S = new H3(e.coordinator, e.table);
  let _ = /* @__PURE__ */ ge("points"), E = /* @__PURE__ */ ge(0), C = /* @__PURE__ */ oe(() => e.projectionColumns != null ? S.defaultViewportScale(e.projectionColumns.x, e.projectionColumns.y) : null), R = /* @__PURE__ */ oe(() => e.automaticLabels ? e.cache != null ? {
    cache: {
      get: (fe) => e.cache.get("labels-" + fe),
      set: (fe, me) => e.cache.set("labels-" + fe, me)
    }
  } : !0 : !1), A = /* @__PURE__ */ ge("parquet");
  const N = _9.Selection.crossfilter();
  function L() {
    let fe = N.predicate(null);
    return fe == null || fe.length == 0 ? null : typeof fe == "string" ? fe : fe.map((me) => me.toString()).join(" AND ");
  }
  let j = /* @__PURE__ */ ge([]), B = /* @__PURE__ */ ge([]), P = new cq(), q = /* @__PURE__ */ ge(null), H = /* @__PURE__ */ oe(() => Xe(h(j))), X = new Iv(1, { duration: f, easing: qv });
  Qe(() => {
    X.set(h(w) ? 1 : 0);
  });
  let V = /* @__PURE__ */ ge(mo(mq("textRenderers", {}))), G = /* @__PURE__ */ oe(() => zL(h(V), e.tableCellRenderers));
  yn(() => {
    yq("textRenderers", h(V));
  });
  let Z = /* @__PURE__ */ oe(() => pq({
    coordinator: e.coordinator,
    table: e.table,
    idColumn: e.idColumn,
    textColumn: e.textColumn,
    neighborsColumn: e.neighborsColumn,
    searcher: e.searcher
  })), Y = /* @__PURE__ */ oe(() => h(Z).fullTextSearch != null), I = /* @__PURE__ */ oe(() => h(Z).vectorSearch != null), K = /* @__PURE__ */ oe(() => h(Z).nearestNeighbors != null), ie = /* @__PURE__ */ ge("full-text"), se = /* @__PURE__ */ oe(() => [
    ...h(Y) ? [{ label: "Full Text", value: "full-text" }] : [],
    ...h(I) ? [{ label: "Vector", value: "vector" }] : [],
    ...h(K) ? [{ label: "Neighbors", value: "neighbors" }] : []
  ]), ye = /* @__PURE__ */ ge(""), _e = /* @__PURE__ */ ge(""), be = /* @__PURE__ */ ge(!1), ue = /* @__PURE__ */ ge(null), Ae = /* @__PURE__ */ ge(null);
  async function ze(fe, me) {
    if (h(Z) == null || h(se).length == 0) {
      xe();
      return;
    }
    h(se).map((Ve) => Ve.value).indexOf(h(ie)) < 0 && (me = h(se)[0].value), W(be, !0), W(_e, "Searching...");
    let Re = L(), ct = [], ft = "", Bt = fe.toString();
    me == "full-text" && h(Z).fullTextSearch != null ? (fe = fe.trim(), ct = await h(Z).fullTextSearch(fe, {
      limit: u,
      predicate: Re,
      onStatus: (Ve) => {
        W(_e, Ve, !0);
      }
    }), ft = fe) : me == "vector" && h(Z).vectorSearch != null ? (fe = fe.trim(), ct = await h(Z).vectorSearch(fe, {
      limit: u,
      predicate: Re,
      onStatus: (Ve) => {
        W(_e, Ve, !0);
      }
    }), ft = fe) : me == "neighbors" && h(Z).nearestNeighbors != null && (Bt = "Neighbors of #" + fe.toString(), ct = await h(Z).nearestNeighbors(fe, {
      limit: u,
      predicate: Re,
      onStatus: (Ve) => {
        W(_e, Ve, !0);
      }
    }));
    let Tt = await hq(
      e.coordinator,
      e.table,
      {
        id: e.idColumn,
        x: e.projectionColumns?.x,
        y: e.projectionColumns?.y,
        text: e.textColumn
      },
      Re,
      ct
    );
    W(_e, ""), W(ue, { label: Bt, highlight: ft, items: Tt }, !0);
  }
  const Me = gq(ze, 500);
  function xe() {
    W(ue, null), W(be, !1);
  }
  Qe(() => {
    h(ye) == "" ? xe() : Me(h(ye), h(ie));
  });
  let ke = /* @__PURE__ */ ge(null), Le = /* @__PURE__ */ ge(null), Ie = /* @__PURE__ */ oe(() => h(Le) ?? e.textColumn), je = /* @__PURE__ */ oe(() => h(Ie) != null ? h(V)[h(Ie)] ?? "plain" : "plain"), et = /* @__PURE__ */ ge(null);
  async function ht(fe) {
    if (fe == null) {
      W(et, null);
      return;
    }
    let me = h(j).find((ct) => ct.name == fe);
    if (me == null)
      return;
    let Re;
    if (me.jsType == "string")
      Re = await S.makeCategoryColumn(me.name, 10);
    else if (me.jsType == "number")
      me.distinctCount <= 10 ? Re = await S.makeCategoryColumn(me.name, 10) : Re = await S.makeBinnedNumericColumn(me.name);
    else
      return;
    W(et, Re), Re.legend.length > c && W(_, "points");
  }
  Qe(() => {
    ht(h(ke));
  });
  async function xt(fe, me, Re) {
    if (h(C) == null)
      return;
    let ct = await h(C) * 2;
    if (me == null || Re == null) {
      if (e.projectionColumns == null)
        return;
      let ft = (await e.coordinator.query(T.Query.from(e.table).select({
        x: T.column(e.projectionColumns.x),
        y: T.column(e.projectionColumns.y)
      }).where(T.eq(T.column(e.idColumn), T.literal(fe))))).get(0);
      me = ft.x, Re = ft.y;
    }
    h(q)?.startViewportAnimation({ x: me, y: Re, scale: ct });
  }
  function wt() {
    for (let fe of N.clauses)
      fe.source?.reset?.(), N.update({ ...fe, value: null, predicate: null });
  }
  function Xe(fe) {
    let me = {};
    me.id = e.idColumn;
    for (let Re of fe)
      Re.name == e.textColumn || Re.name == e.projectionColumns?.x || Re.name == e.projectionColumns?.y || Re.name == e.idColumn || (me[Re.name] = Re.name);
    return me;
  }
  let it = /* @__PURE__ */ ge(null);
  const Ht = (fe) => {
    W(it, fe, !0);
  };
  function nt(fe) {
    if (typeof fe.version != "string")
      return;
    P.set(fe.plotStates ?? {});
    function me(Re, ct) {
      fe.view && Re in fe.view && ct(fe.view[Re]);
    }
    me("showEmbedding", (Re) => W(m, Re, !0)), me("showTable", (Re) => W(y, Re, !0)), me("showSidebar", (Re) => W(w, Re, !0)), me("textRenderers", (Re) => W(V, Re, !0)), me("selectedCategoryColumn", (Re) => W(ke, Re, !0)), me("embeddingViewMode", (Re) => W(_, Re, !0)), me("minimumDensityExpFactor", (Re) => W(E, Re, !0)), me("userDarkMode", (Re) => xu(p, Re)), fe.plots != null && W(B, fe.plots);
  }
  yn(() => {
    if (!h(g))
      return;
    let fe = {
      version: Qx,
      timestamp: (/* @__PURE__ */ new Date()).getTime() / 1e3,
      view: {
        showEmbedding: h(m),
        showTable: h(y),
        showSidebar: h(w),
        textRenderers: h(V),
        selectedCategoryColumn: h(ke),
        embeddingViewMode: h(_),
        minimumDensityExpFactor: h(E),
        userDarkMode: i()
      },
      plots: h(B),
      plotStates: a(),
      predicate: L()
    };
    e.onStateChange?.(fe);
  }), e.initialState && nt(e.initialState), bc(async () => {
    let fe = [
      e.idColumn,
      e.textColumn,
      e.projectionColumns?.x,
      e.projectionColumns?.y
    ].filter((me) => me != null);
    W(j, (await S.columnDescriptions()).filter((me) => !me.name.startsWith("__"))), h(B).length == 0 && W(B, await S.defaultPlots(h(j).filter((me) => fe.indexOf(me.name) < 0))), W(g, !0);
  });
  function dr(fe) {
    if (fe.key == "Escape") {
      wt(), fe.preventDefault();
      try {
        document.activeElement?.blur?.();
      } catch {
      }
    }
  }
  var qt = Bq();
  OM("keydown", b0, dr), tt(qt, "", {}, { width: "100%", height: "100%" });
  var Cr = ne(qt);
  let sr;
  var zt = ne(Cr), Ot = ne(zt), vr = ne(Ot), xn = ne(vr), wn = ne(xn);
  {
    var Ki = (fe) => {
      var me = wq(), Re = ne(me);
      G3(Re, {
        type: "search",
        placeholder: "Search...",
        className: "w-64",
        get value() {
          return h(ye);
        },
        set value(Ve) {
          W(ye, Ve, !0);
        }
      });
      var ct = le(Re, 2);
      {
        var ft = (Ve) => {
          {
            let Ct = /* @__PURE__ */ oe(() => h(se).filter((ur) => ur.value != "neighbors"));
            Za(Ve, {
              get options() {
                return h(Ct);
              },
              get value() {
                return h(ie);
              },
              onChange: (ur) => W(ie, ur, !0)
            });
          }
        };
        Te(ct, (Ve) => {
          h(se).filter((Ct) => Ct.value != "neighbors").length > 1 && Ve(ft);
        });
      }
      var Bt = le(ct, 2);
      {
        var Tt = (Ve) => {
          var Ct = xq();
          tt(Ct, "", {}, { height: "48em" });
          var ur = ne(Ct);
          {
            var Nr = (Zt) => {
              PP(Zt, {
                get items() {
                  return h(ue).items;
                },
                get label() {
                  return h(ue).label;
                },
                get highlight() {
                  return h(ue).highlight;
                },
                limit: u,
                onClick: async (rr) => {
                  Ht(rr.id), W(Ae, rr, !0), xt(rr.id, rr.x, rr.y);
                },
                onClose: xe
              });
            }, Rr = (Zt) => {
              var rr = fr(), Gr = We(rr);
              {
                var Ir = (jr) => {
                  var Xo = bq(), Xl = ne(Xo);
                  jP(Xl, {
                    get status() {
                      return h(_e);
                    }
                  }), ee(Xo), te(jr, Xo);
                };
                Te(
                  Gr,
                  (jr) => {
                    h(_e) != null && jr(Ir);
                  },
                  !0
                );
              }
              te(Zt, rr);
            };
            Te(ur, (Zt) => {
              h(ue) != null ? Zt(Nr) : Zt(Rr, !1);
            });
          }
          ee(Ct), te(Ve, Ct);
        };
        Te(Bt, (Ve) => {
          h(be) && Ve(Tt);
        });
      }
      ee(me), te(fe, me);
    }, yi = (fe) => {
      var me = kq();
      te(fe, me);
    };
    Te(wn, (fe) => {
      h(Z) ? fe(Ki) : fe(yi, !1);
    });
  }
  ee(xn), ee(vr);
  var Ro = le(vr, 2), Zi = ne(Ro);
  {
    var Oa = (fe) => {
      var me = Sq(), Re = We(me);
      {
        let Tt = /* @__PURE__ */ oe(() => [
          { value: null, label: "(none)" },
          ...h(j).filter((Ve) => Ve.distinctCount > 1 && (Ve.jsType == "string" && Ve.distinctCount <= 1e4 || Ve.jsType == "number")).map((Ve) => ({ value: Ve.name, label: `${Ve.name} (${Ve.type})` }))
        ]);
        Za(Re, {
          label: "Color",
          get value() {
            return h(ke);
          },
          onChange: (Ve) => W(ke, Ve, !0),
          get options() {
            return h(Tt);
          }
        });
      }
      var ct = le(Re, 2);
      {
        let Tt = /* @__PURE__ */ oe(() => h(et) != null && h(et).legend.length > c);
        Za(ct, {
          label: "Display",
          get value() {
            return h(_);
          },
          onChange: (Ve) => W(_, Ve, !0),
          get disabled() {
            return h(Tt);
          },
          options: [
            { value: "points", label: "Points" },
            { value: "density", label: "Density" }
          ]
        });
      }
      var ft = le(ct, 2);
      {
        var Bt = (Tt) => {
          var Ve = _q(), Ct = le(ne(Ve), 2);
          XL(Ct, {
            min: -4,
            max: 4,
            step: 0.1,
            get value() {
              return h(E);
            },
            set value(ur) {
              W(E, ur, !0);
            }
          }), ee(Ve), te(Tt, Ve);
        };
        Te(ft, (Tt) => {
          h(_) == "density" && Tt(Bt);
        });
      }
      te(fe, me);
    };
    Te(Zi, (fe) => {
      h(m) && fe(Oa);
    });
  }
  ee(Ro), ee(Ot);
  var Qi = le(Ot, 2);
  let un;
  var Ji = ne(Qi);
  let Ba;
  var ea = ne(Ji), Hl = ne(ea);
  RP(Hl, {
    get filter() {
      return N;
    },
    get table() {
      return e.table;
    }
  });
  var Da = le(Hl, 2), Js = ne(Da);
  Js.__click = wt, ee(Da), ee(ea), ee(Ji), ee(Qi);
  var Vl = le(Qi, 4), Pa = ne(Vl);
  WL(Pa, {
    get icon() {
      return PD;
    },
    title: "Options",
    children: (fe, me) => {
      var Re = Rq(), ct = le(ne(Re), 2);
      {
        let rr = /* @__PURE__ */ oe(() => [
          { value: null, label: e.textColumn ?? "(none)" },
          "---",
          ...Object.keys(h(H)).map((Gr) => ({ value: Gr, label: Gr }))
        ]);
        Za(ct, {
          class: "w-full",
          get value() {
            return h(Le);
          },
          onChange: (Gr) => W(Le, Gr, !0),
          get options() {
            return h(rr);
          }
        });
      }
      var ft = le(ct, 2);
      {
        var Bt = (rr) => {
          var Gr = Mq(), Ir = le(We(Gr), 2);
          DL(Ir, {
            get columns() {
              return h(j);
            },
            get styles() {
              return h(V);
            },
            onStylesChange: (jr) => {
              W(V, jr, !0);
            }
          }), te(rr, Gr);
        };
        Te(ft, (rr) => {
          h(j).length > 0 && rr(Bt);
        });
      }
      var Tt = le(ft, 4), Ve = ne(Tt);
      {
        var Ct = (rr) => {
          var Gr = Cq(), Ir = ne(Gr);
          Zx(Ir, {
            get icon() {
              return jx;
            },
            label: "Export Selection",
            title: "Export the selected points",
            class: "w-48",
            onClick: () => e.onExportSelection(L(), h(A))
          });
          var jr = le(Ir, 2);
          Za(jr, {
            label: "Format",
            get value() {
              return h(A);
            },
            onChange: (Xo) => W(A, Xo, !0),
            options: [
              { value: "parquet", label: "Parquet" },
              { value: "jsonl", label: "JSONL" },
              { value: "json", label: "JSON" },
              { value: "csv", label: "CSV" }
            ]
          }), ee(Gr), te(rr, Gr);
        };
        Te(Ve, (rr) => {
          e.onExportSelection && rr(Ct);
        });
      }
      var ur = le(Ve, 2);
      {
        var Nr = (rr) => {
          Zx(rr, {
            get icon() {
              return jx;
            },
            label: "Export Application",
            title: "Download a self-contained static web application",
            class: "w-48",
            get onClick() {
              return e.onExportApplication;
            }
          });
        };
        Te(ur, (rr) => {
          e.onExportApplication && rr(Nr);
        });
      }
      ee(Tt);
      var Rr = le(Tt, 4), Zt = ne(Rr);
      ee(Rr), ee(Re), Ee(() => rt(Zt, `Embedding Atlas, ${Qx}`)), te(fe, Re);
    },
    $$slots: { default: !0 }
  });
  var La = le(Pa, 2);
  {
    var eu = (fe) => {
      {
        let me = /* @__PURE__ */ oe(() => l() ? jD : qD);
        Oo(fe, {
          get icon() {
            return h(me);
          },
          title: "Toggle dark mode",
          onClick: () => {
            xu(p, !l());
          }
        });
      }
    };
    Te(La, (fe) => {
      e.colorScheme == null && fe(eu);
    });
  }
  var Gl = le(La, 2);
  {
    var qa = (fe) => {
      Xf(fe, {
        get icon() {
          return RD;
        },
        title: "Show / hide embedding",
        get checked() {
          return h(m);
        },
        set checked(me) {
          W(m, me, !0);
        }
      });
    };
    Te(Gl, (fe) => {
      e.projectionColumns != null && fe(qa);
    });
  }
  var pe = le(Gl, 2);
  Xf(pe, {
    get icon() {
      return FD;
    },
    title: "Show / hide table",
    get checked() {
      return h(y);
    },
    set checked(fe) {
      W(y, fe, !0);
    }
  });
  var Fe = le(pe, 2);
  Xf(Fe, {
    get icon() {
      return zD;
    },
    title: "Show / hide sidebar",
    get checked() {
      return h(w);
    },
    set checked(fe) {
      W(w, fe, !0);
    }
  }), ee(Vl), ee(zt);
  var Ne = le(zt, 2), Oe = ne(Ne);
  {
    var De = (fe) => {
      var me = Fq(), Re = ne(me);
      {
        var ct = (Tt) => {
          var Ve = Aq(), Ct = ne(Ve);
          {
            let ur = /* @__PURE__ */ oe(() => ({
              class: lq,
              props: {
                textRenderer: h(je),
                textField: h(Le),
                darkMode: l(),
                onNearestNeighborSearch: h(K) ? async (Zt) => {
                  ze(Zt, "neighbors");
                } : null
              }
            })), Nr = /* @__PURE__ */ oe(() => h(ue) ? {
              class: sq,
              props: {
                items: h(ue).items,
                highlightItem: h(Ae)
              }
            } : null), Rr = /* @__PURE__ */ oe(() => P.store("embedding-view"));
            Wo(
              HN(Ct, {
                get table() {
                  return e.table;
                },
                get filter() {
                  return N;
                },
                get id() {
                  return e.idColumn;
                },
                get x() {
                  return e.projectionColumns.x;
                },
                get y() {
                  return e.projectionColumns.y;
                },
                get text() {
                  return e.textColumn;
                },
                get additionalFields() {
                  return h(H);
                },
                get categoryLegend() {
                  return h(et);
                },
                get mode() {
                  return h(_);
                },
                get minimumDensityExpFactor() {
                  return h(E);
                },
                get automaticLabels() {
                  return h(R);
                },
                get customTooltip() {
                  return h(ur);
                },
                get customOverlay() {
                  return h(Nr);
                },
                onClickPoint: (Zt) => Ht(Zt.identifier),
                get stateStore() {
                  return h(Rr);
                }
              }),
              (Zt) => W(q, Zt),
              () => h(q)
            );
          }
          ee(Ve), te(Tt, Ve);
        };
        Te(Re, (Tt) => {
          h(m) && e.projectionColumns != null && Tt(ct);
        });
      }
      var ft = le(Re, 2);
      {
        var Bt = (Tt) => {
          var Ve = $q(), Ct = We(Ve);
          {
            var ur = (Ir) => {
              var jr = Tq();
              jr.__mousedown = [Eq, x], te(Ir, jr);
            };
            Te(Ct, (Ir) => {
              h(m) && Ir(ur);
            });
          }
          var Nr = le(Ct, 2);
          let Rr, Zt;
          var rr = ne(Nr);
          {
            var Gr = (Ir) => {
              var jr = fr(), Xo = We(jr);
              Ld(Xo, () => h(j), (Xl) => {
                {
                  let ch = /* @__PURE__ */ oe(() => h(j).map((Yl) => Yl.name)), fh = /* @__PURE__ */ oe(() => l() ? "dark" : "light");
                  BN(Xl, {
                    get coordinator() {
                      return e.coordinator;
                    },
                    get table() {
                      return e.table;
                    },
                    get rowKey() {
                      return e.idColumn;
                    },
                    get columns() {
                      return h(ch);
                    },
                    get filter() {
                      return N;
                    },
                    get scrollTo() {
                      return h(it);
                    },
                    onRowClick: async (Yl) => {
                      await xt(Yl), h(q)?.showTooltip(Yl);
                    },
                    numLines: 3,
                    get colorScheme() {
                      return h(fh);
                    },
                    get theme() {
                      return vq;
                    },
                    get customCells() {
                      return h(G);
                    },
                    highlightHoveredRow: !0
                  });
                }
              }), te(Ir, jr);
            };
            Te(rr, (Ir) => {
              h(j).length > 0 && Ir(Gr);
            });
          }
          ee(Nr), Ee(
            (Ir, jr) => {
              Rr = _r(Nr, 1, "z-10 bg-white dark:bg-slate-900 rounded-md overflow-hidden", null, Rr, Ir), Zt = tt(Nr, "", Zt, jr);
            },
            [
              () => ({ "h-full": !h(m) }),
              () => ({
                height: h(m) ? h(x) + "px" : null,
                "--hover-color": "var(--color-amber-200)"
              })
            ]
          ), ed(3, Nr, () => rd, () => ({ duration: f })), te(Tt, Ve);
        };
        Te(ft, (Tt) => {
          h(y) && Tt(Bt);
        });
      }
      ee(me), te(fe, me);
    };
    Te(Oe, (fe) => {
      (h(y) || h(m)) && fe(De);
    });
  }
  var st = le(Oe, 2);
  {
    var kt = (fe) => {
      var me = Oq();
      const Re = /* @__PURE__ */ oe(() => !(h(y) || h(m)));
      var ct = We(me);
      {
        var ft = (Rr) => {
          var Zt = zq();
          Zt.__mousedown = [Nq, k], te(Rr, Zt);
        };
        Te(ct, (Rr) => {
          h(Re) || Rr(ft);
        });
      }
      var Bt = le(ct, 2);
      let Tt, Ve;
      var Ct = ne(Bt);
      let ur;
      var Nr = ne(Ct);
      {
        let Rr = /* @__PURE__ */ oe(() => h(Re) ? "full" : "sidebar");
        MP(Nr, {
          get table() {
            return e.table;
          },
          get columns() {
            return h(j);
          },
          get filter() {
            return N;
          },
          get layout() {
            return h(Rr);
          },
          get stateStores() {
            return P;
          },
          get plots() {
            return h(B);
          },
          set plots(Zt) {
            W(B, Zt);
          }
        });
      }
      ee(Ct), ee(Bt), Ee(
        (Rr, Zt, rr) => {
          Tt = _r(Bt, 1, "flex flex-col mr-2 mb-2 dark:bg-slate-800", null, Tt, Rr), Ve = tt(Bt, "", Ve, Zt), ur = tt(Ct, "", ur, rr);
        },
        [
          () => ({
            "ml-2": h(Re),
            "flex-none": !h(Re),
            "flex-1": h(Re)
          }),
          () => ({ width: h(Re) ? null : `${h(k)}px` }),
          () => ({ width: h(Re) ? null : `${h(k)}px` })
        ]
      ), ed(3, Bt, () => rd, () => ({ axis: "x", duration: f })), te(fe, me);
    };
    Te(st, (fe) => {
      h(w) && fe(kt);
    });
  }
  ee(Ne), ee(Cr), ee(qt), Ee(
    (fe, me, Re) => {
      sr = _r(Cr, 1, "w-full h-full flex flex-col text-slate-800 bg-slate-200 dark:text-slate-200 dark:bg-slate-800", null, sr, fe), un = tt(Qi, "", un, me), Ba = tt(Ji, "", Ba, Re);
    },
    [
      () => ({ dark: l() }),
      () => ({
        "--sidebar-tween": X.current,
        "--padded-width": `calc(${h(k) ?? ""}px - 149.5px - ${l() ? 0 : 1}px)`,
        "max-width": "var(--padded-width)",
        "flex-basis": "calc(var(--padded-width) * var(--sidebar-tween))"
      }),
      () => ({ opacity: h(w) ? 1 : 0 })
    ]
  ), te(t, qt), mt(), n();
}
Tr(["click", "mousedown"]);
const Pq = `/*! tailwindcss v4.1.11 | MIT License | https://tailwindcss.com */@layer properties{@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and (not (color:rgb(from red r g b)))){*,:before,:after,::backdrop{--tw-rotate-x:initial;--tw-rotate-y:initial;--tw-rotate-z:initial;--tw-skew-x:initial;--tw-skew-y:initial;--tw-space-y-reverse:0;--tw-border-style:solid;--tw-leading:initial;--tw-font-weight:initial;--tw-ordinal:initial;--tw-slashed-zero:initial;--tw-numeric-figure:initial;--tw-numeric-spacing:initial;--tw-numeric-fraction:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-shadow-alpha:100%;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-inset-shadow-alpha:100%;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;--tw-blur:initial;--tw-brightness:initial;--tw-contrast:initial;--tw-grayscale:initial;--tw-hue-rotate:initial;--tw-invert:initial;--tw-opacity:initial;--tw-saturate:initial;--tw-sepia:initial;--tw-drop-shadow:initial;--tw-drop-shadow-color:initial;--tw-drop-shadow-alpha:100%;--tw-drop-shadow-size:initial;--tw-ease:initial;--tw-outline-style:solid}}}@layer theme{:root,:host{--font-sans:ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--color-red-400:oklch(70.4% .191 22.216);--color-red-500:oklch(63.7% .237 25.331);--color-red-600:oklch(57.7% .245 27.325);--color-orange-500:oklch(70.5% .213 47.604);--color-orange-700:oklch(55.3% .195 38.402);--color-amber-200:oklch(92.4% .12 95.746);--color-blue-100:oklch(93.2% .032 255.585);--color-blue-200:oklch(88.2% .059 254.128);--color-blue-400:oklch(70.7% .165 254.624);--color-blue-500:oklch(62.3% .214 259.815);--color-blue-600:oklch(54.6% .245 262.881);--color-blue-800:oklch(42.4% .199 265.638);--color-blue-900:oklch(37.9% .146 265.522);--color-blue-950:oklch(28.2% .091 267.935);--color-slate-50:oklch(98.4% .003 247.858);--color-slate-100:oklch(96.8% .007 247.896);--color-slate-200:oklch(92.9% .013 255.508);--color-slate-300:oklch(86.9% .022 252.894);--color-slate-400:oklch(70.4% .04 256.788);--color-slate-500:oklch(55.4% .046 257.417);--color-slate-600:oklch(44.6% .043 257.281);--color-slate-700:oklch(37.2% .044 257.287);--color-slate-800:oklch(27.9% .041 260.031);--color-slate-900:oklch(20.8% .042 265.755);--color-slate-950:oklch(12.9% .042 264.695);--color-gray-200:oklch(92.8% .006 264.531);--color-gray-400:oklch(70.7% .022 261.325);--color-gray-600:oklch(44.6% .03 256.802);--color-black:#000;--color-white:#fff;--spacing:.25rem;--font-weight-medium:500;--ease-in-out:cubic-bezier(.4,0,.2,1);--default-transition-duration:.15s;--default-transition-timing-function:cubic-bezier(.4,0,.2,1);--default-font-family:var(--font-sans);--default-mono-font-family:var(--font-mono)}}@layer base{*,:after,:before,::backdrop{box-sizing:border-box;border:0 solid;margin:0;padding:0}::file-selector-button{box-sizing:border-box;border:0 solid;margin:0;padding:0}html,:host{-webkit-text-size-adjust:100%;tab-size:4;line-height:1.5;font-family:var(--default-font-family,ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji");font-feature-settings:var(--default-font-feature-settings,normal);font-variation-settings:var(--default-font-variation-settings,normal);-webkit-tap-highlight-color:transparent}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;-webkit-text-decoration:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:var(--default-mono-font-family,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace);font-feature-settings:var(--default-mono-font-feature-settings,normal);font-variation-settings:var(--default-mono-font-variation-settings,normal);font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}:-moz-focusring{outline:auto}progress{vertical-align:baseline}summary{display:list-item}ol,ul,menu{list-style:none}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}button,input,select,optgroup,textarea{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}::file-selector-button{font:inherit;font-feature-settings:inherit;font-variation-settings:inherit;letter-spacing:inherit;color:inherit;opacity:1;background-color:#0000;border-radius:0}:where(select:is([multiple],[size])) optgroup{font-weight:bolder}:where(select:is([multiple],[size])) optgroup option{padding-inline-start:20px}::file-selector-button{margin-inline-end:4px}::placeholder{opacity:1}@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}@supports (color:color-mix(in lab,red,red)){::placeholder{color:color-mix(in oklab,currentcolor 50%,transparent)}}}textarea{resize:vertical}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-date-and-time-value{min-height:1lh;text-align:inherit}::-webkit-datetime-edit{display:inline-flex}::-webkit-datetime-edit-fields-wrapper{padding:0}::-webkit-datetime-edit{padding-block:0}::-webkit-datetime-edit-year-field{padding-block:0}::-webkit-datetime-edit-month-field{padding-block:0}::-webkit-datetime-edit-day-field{padding-block:0}::-webkit-datetime-edit-hour-field{padding-block:0}::-webkit-datetime-edit-minute-field{padding-block:0}::-webkit-datetime-edit-second-field{padding-block:0}::-webkit-datetime-edit-millisecond-field{padding-block:0}::-webkit-datetime-edit-meridiem-field{padding-block:0}:-moz-ui-invalid{box-shadow:none}button,input:where([type=button],[type=reset],[type=submit]){appearance:button}::file-selector-button{appearance:button}::-webkit-inner-spin-button{height:auto}::-webkit-outer-spin-button{height:auto}[hidden]:where(:not([hidden=until-found])){display:none!important}:root,:host{--tw-border-style:solid;--tw-font-weight:initial;--tw-tracking:initial;--tw-shadow:0 0 #0000;--tw-shadow-color:initial;--tw-inset-shadow:0 0 #0000;--tw-inset-shadow-color:initial;--tw-ring-color:initial;--tw-ring-shadow:0 0 #0000;--tw-inset-ring-color:initial;--tw-inset-ring-shadow:0 0 #0000;--tw-ring-inset:initial;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-offset-shadow:0 0 #0000;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Open Sans,Helvetica Neue,sans-serif;font-size:13px}}@layer components;@layer utilities{.visible{visibility:visible}.absolute{position:absolute}.fixed{position:fixed}.relative{position:relative}.static{position:static}.top-0{top:calc(var(--spacing)*0)}.top-\\[30px\\]{top:30px}.top-\\[32px\\]{top:32px}.right-0{right:calc(var(--spacing)*0)}.bottom-0{bottom:calc(var(--spacing)*0)}.left-0{left:calc(var(--spacing)*0)}.z-10{z-index:10}.z-20{z-index:20}.container{width:100%}@media (min-width:520px){.container{max-width:520px}}@media (min-width:624px){.container{max-width:624px}}@media (min-width:832px){.container{max-width:832px}}@media (min-width:1040px){.container{max-width:1040px}}@media (min-width:1248px){.container{max-width:1248px}}.m-1{margin:3.25px}.m-2{margin:6.5px}.mx-2{margin-inline:6.5px}.my-0{margin-block:calc(var(--spacing)*0)}.my-1{margin-block:3.25px}.my-2{margin-block:6.5px}.mt-0{margin-top:calc(var(--spacing)*0)}.mt-1{margin-top:3.25px}.mt-2{margin-top:6.5px}.mt-4{margin-top:13px}.mr-1{margin-right:3.25px}.mr-2{margin-right:6.5px}.mb-1{margin-bottom:3.25px}.mb-2{margin-bottom:6.5px}.-ml-2{margin-left:-6.5px}.ml-1{margin-left:3.25px}.ml-2{margin-left:6.5px}.ml-3{margin-left:9.75px}.form-input{appearance:none;--tw-shadow:0 0 #0000;background-color:#fff;border-width:1px;border-color:#6a7282;border-radius:0;padding:.5rem .75rem;font-size:1rem;line-height:1.5rem}.form-input:focus{outline-offset:2px;--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:oklch(54.6% .245 262.881);--tw-ring-offset-shadow:var(--tw-ring-inset)0 0 0 var(--tw-ring-offset-width)var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset)0 0 0 calc(1px + var(--tw-ring-offset-width))var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);border-color:#155dfc;outline:2px solid #0000}.form-input::placeholder{color:#6a7282;opacity:1}.form-input::-webkit-datetime-edit-fields-wrapper{padding:0}.form-input::-webkit-date-and-time-value{min-height:1.5em}.form-input::-webkit-date-and-time-value{text-align:inherit}.form-input::-webkit-datetime-edit{display:inline-flex}.form-input::-webkit-datetime-edit{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-year-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-month-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-day-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-hour-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-minute-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-second-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-millisecond-field{padding-top:0;padding-bottom:0}.form-input::-webkit-datetime-edit-meridiem-field{padding-top:0;padding-bottom:0}.line-clamp-4{-webkit-line-clamp:4;-webkit-box-orient:vertical;display:-webkit-box;overflow:hidden}.block{display:block}.flex{display:flex}.grid{display:grid}.hidden{display:none}.inline{display:inline}.table{display:table}.size-fit{width:fit-content;height:fit-content}.\\!h-24{height:78px!important}.h-2{height:6.5px}.h-3{height:9.75px}.h-4{height:13px}.h-5{height:16.25px}.h-8{height:26px}.h-12{height:39px}.h-64{height:208px}.h-96{height:312px}.h-\\[28px\\]{height:28px}.h-full{height:100%}.max-h-48{max-height:156px}.w-2{width:6.5px}.w-3{width:9.75px}.w-4{width:13px}.w-5{width:16.25px}.w-7{width:22.75px}.w-12{width:39px}.w-24{width:78px}.w-40{width:130px}.w-48{width:156px}.w-64{width:208px}.w-72{width:234px}.w-96{width:312px}.w-\\[4rem\\]{width:4rem}.w-\\[40rem\\]{width:40rem}.w-\\[420px\\]{width:420px}.w-full{width:100%}.max-w-32{max-width:104px}.max-w-72{max-width:234px}.max-w-80{max-width:260px}.min-w-96{min-width:312px}.flex-1{flex:1}.flex-none{flex:none}.transform{transform:var(--tw-rotate-x,)var(--tw-rotate-y,)var(--tw-rotate-z,)var(--tw-skew-x,)var(--tw-skew-y,)}.cursor-col-resize{cursor:col-resize}.cursor-row-resize{cursor:row-resize}.resize{resize:both}.form-select{appearance:none;--tw-shadow:0 0 #0000;background-color:#fff;border-width:1px;border-color:#6a7282;border-radius:0;padding:.5rem .75rem;font-size:1rem;line-height:1.5rem}.form-select:focus{outline-offset:2px;--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:oklch(54.6% .245 262.881);--tw-ring-offset-shadow:var(--tw-ring-inset)0 0 0 var(--tw-ring-offset-width)var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset)0 0 0 calc(1px + var(--tw-ring-offset-width))var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);border-color:#155dfc;outline:2px solid #0000}.form-select{print-color-adjust:exact;background-image:url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='oklch(55.1%25 0.027 264.364)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");background-position:right .5rem center;background-repeat:no-repeat;background-size:1.5em 1.5em;padding-right:2.5rem}.form-select:where([size]:not([size="1"])){background-image:initial;background-position:initial;background-repeat:unset;background-size:initial;print-color-adjust:unset;padding-right:.75rem}.form-textarea{appearance:none;--tw-shadow:0 0 #0000;background-color:#fff;border-width:1px;border-color:#6a7282;border-radius:0;padding:.5rem .75rem;font-size:1rem;line-height:1.5rem}.form-textarea:focus{outline-offset:2px;--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:oklch(54.6% .245 262.881);--tw-ring-offset-shadow:var(--tw-ring-inset)0 0 0 var(--tw-ring-offset-width)var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset)0 0 0 calc(1px + var(--tw-ring-offset-width))var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow);border-color:#155dfc;outline:2px solid #0000}.form-textarea::placeholder{color:#6a7282;opacity:1}.flex-col{flex-direction:column}.flex-row{flex-direction:row}.flex-wrap{flex-wrap:wrap}.place-content-center{place-content:center}.items-center{align-items:center}.items-end{align-items:flex-end}.items-start{align-items:flex-start}.justify-between{justify-content:space-between}.justify-center{justify-content:center}.justify-end{justify-content:flex-end}.gap-0\\.5{gap:1.625px}.gap-1{gap:3.25px}.gap-2{gap:6.5px}.gap-3{gap:9.75px}.gap-4{gap:13px}.gap-\\[1px\\]{gap:1px}:where(.space-y-2>:not(:last-child)){--tw-space-y-reverse:0;margin-block-start:calc(6.5px*var(--tw-space-y-reverse));margin-block-end:calc(6.5px*calc(1 - var(--tw-space-y-reverse)))}.overflow-hidden{overflow:hidden}.overflow-x-hidden{overflow-x:hidden}.overflow-y-scroll{overflow-y:scroll}.rounded{border-radius:3.25px}.rounded-full{border-radius:3.40282e38px}.rounded-md{border-radius:4.875px}.rounded-sm{border-radius:1.625px}.border{border-style:var(--tw-border-style);border-width:1px}.border-0{border-style:var(--tw-border-style);border-width:0}.border-2{border-style:var(--tw-border-style);border-width:2px}.border-dashed{--tw-border-style:dashed;border-style:dashed}.\\!border-blue-400{border-color:var(--color-blue-400)!important}.\\!border-slate-500{border-color:var(--color-slate-500)!important}.border-red-500{border-color:var(--color-red-500)}.border-slate-200{border-color:var(--color-slate-200)}.border-slate-300{border-color:var(--color-slate-300)}.border-slate-500{border-color:var(--color-slate-500)}.\\!bg-blue-100{background-color:var(--color-blue-100)!important}.\\!bg-slate-300{background-color:var(--color-slate-300)!important}.\\!bg-slate-500{background-color:var(--color-slate-500)!important}.bg-blue-100{background-color:var(--color-blue-100)}.bg-blue-200{background-color:var(--color-blue-200)}.bg-blue-500{background-color:var(--color-blue-500)}.bg-gray-400{background-color:var(--color-gray-400)}.bg-slate-50{background-color:var(--color-slate-50)}.bg-slate-100{background-color:var(--color-slate-100)}.bg-slate-200{background-color:var(--color-slate-200)}.bg-slate-400{background-color:var(--color-slate-400)}.bg-slate-500{background-color:var(--color-slate-500)}.bg-slate-600{background-color:var(--color-slate-600)}.bg-slate-800{background-color:var(--color-slate-800)}.bg-slate-900{background-color:var(--color-slate-900)}.bg-slate-950{background-color:var(--color-slate-950)}.bg-white{background-color:var(--color-white)}.bg-white\\/90{background-color:#ffffffe6}@supports (color:color-mix(in lab,red,red)){.bg-white\\/90{background-color:color-mix(in oklab,var(--color-white)90%,transparent)}}.fill-orange-500{fill:var(--color-orange-500)}.stroke-orange-500{stroke:var(--color-orange-500)}.stroke-orange-700{stroke:var(--color-orange-700)}.stroke-2{stroke-width:2px}.p-1{padding:3.25px}.p-2{padding:6.5px}.p-4{padding:13px}.px-1\\.5{padding-inline:4.875px}.px-2{padding-inline:6.5px}.px-2\\.5{padding-inline:8.125px}.px-3{padding-inline:9.75px}.py-0{padding-block:calc(var(--spacing)*0)}.py-0\\.5{padding-block:1.625px}.py-1{padding-block:3.25px}.py-1\\.5{padding-block:4.875px}.py-3{padding-block:9.75px}.py-20{padding-block:65px}.pt-1{padding-top:3.25px}.pt-2{padding-top:6.5px}.pr-0\\.5{padding-right:1.625px}.pr-1{padding-right:3.25px}.pr-2{padding-right:6.5px}.pr-\\[16px\\]{padding-right:16px}.pb-2{padding-bottom:6.5px}.pb-4{padding-bottom:13px}.pl-2{padding-left:6.5px}.pl-40{padding-left:130px}.pl-\\[4px\\]{padding-left:4px}.text-center{text-align:center}.text-left{text-align:left}.text-right{text-align:right}.font-mono{font-family:var(--font-mono)}.text-sm{font-size:11.375px;line-height:var(--tw-leading,16.25px)}.text-sm\\!{font-size:11.375px!important;line-height:var(--tw-leading,16.25px)!important}.text-xs{font-size:9.75px;line-height:var(--tw-leading,13px)}.leading-5{--tw-leading:16.25px;line-height:16.25px}.leading-7{--tw-leading:22.75px;line-height:22.75px}.leading-10{--tw-leading:32.5px;line-height:32.5px}.font-medium{--tw-font-weight:var(--font-weight-medium);font-weight:var(--font-weight-medium)}.text-ellipsis{text-overflow:ellipsis}.whitespace-nowrap{white-space:nowrap}.\\!text-gray-200{color:var(--color-gray-200)!important}.\\!text-slate-100{color:var(--color-slate-100)!important}.text-blue-500{color:var(--color-blue-500)}.text-gray-400{color:var(--color-gray-400)}.text-red-400{color:var(--color-red-400)}.text-red-500{color:var(--color-red-500)}.text-red-600{color:var(--color-red-600)}.text-slate-300{color:var(--color-slate-300)}.text-slate-400{color:var(--color-slate-400)}.text-slate-500{color:var(--color-slate-500)}.text-slate-600{color:var(--color-slate-600)}.text-slate-700{color:var(--color-slate-700)}.text-slate-800{color:var(--color-slate-800)}.text-white{color:var(--color-white)}.ordinal{--tw-ordinal:ordinal;font-variant-numeric:var(--tw-ordinal,)var(--tw-slashed-zero,)var(--tw-numeric-figure,)var(--tw-numeric-spacing,)var(--tw-numeric-fraction,)}.underline{text-decoration-line:underline}.opacity-0{opacity:0}.opacity-20{opacity:.2}.shadow-lg{--tw-shadow:0 10px 15px -3px var(--tw-shadow-color,#0000001a),0 4px 6px -4px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.shadow-md{--tw-shadow:0 4px 6px -1px var(--tw-shadow-color,#0000001a),0 2px 4px -2px var(--tw-shadow-color,#0000001a);box-shadow:var(--tw-inset-shadow),var(--tw-inset-ring-shadow),var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow)}.-outline-offset-1{outline-offset:-1px}.-outline-offset-2{outline-offset:-2px}.outline-blue-600{outline-color:var(--color-blue-600)}.invert{--tw-invert:invert(100%);filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.filter{filter:var(--tw-blur,)var(--tw-brightness,)var(--tw-contrast,)var(--tw-grayscale,)var(--tw-hue-rotate,)var(--tw-invert,)var(--tw-saturate,)var(--tw-sepia,)var(--tw-drop-shadow,)}.transition-all{transition-property:all;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.transition-opacity{transition-property:opacity;transition-timing-function:var(--tw-ease,var(--default-transition-timing-function));transition-duration:var(--tw-duration,var(--default-transition-duration))}.ease-in-out{--tw-ease:var(--ease-in-out);transition-timing-function:var(--ease-in-out)}.select-none{-webkit-user-select:none;user-select:none}@media (hover:hover){.group-hover\\:bg-blue-600:is(:where(.group):hover *){background-color:var(--color-blue-600)}.group-hover\\:opacity-100:is(:where(.group):hover *){opacity:1}}.first\\:rounded-tl-md:first-child{border-top-left-radius:4.875px}.first\\:rounded-bl-md:first-child{border-bottom-left-radius:4.875px}.last\\:rounded-tr-md:last-child{border-top-right-radius:4.875px}.last\\:rounded-br-md:last-child{border-bottom-right-radius:4.875px}@media (hover:hover){.hover\\:border-slate-500:hover{border-color:var(--color-slate-500)}.hover\\:bg-red-500:hover{background-color:var(--color-red-500)}.hover\\:bg-slate-200:hover{background-color:var(--color-slate-200)}.hover\\:bg-slate-300:hover{background-color:var(--color-slate-300)}.hover\\:bg-white:hover{background-color:var(--color-white)}.hover\\:text-slate-500:hover{color:var(--color-slate-500)}.hover\\:text-slate-800:hover{color:var(--color-slate-800)}.hover\\:text-slate-900:hover{color:var(--color-slate-900)}.hover\\:text-white:hover{color:var(--color-white)}}.focus-visible\\:outline-2:focus-visible{outline-style:var(--tw-outline-style);outline-width:2px}.dark\\:\\!border-blue-600:where(.dark,.dark *){border-color:var(--color-blue-600)!important}.dark\\:\\!border-slate-400:where(.dark,.dark *){border-color:var(--color-slate-400)!important}.dark\\:border-slate-500:where(.dark,.dark *){border-color:var(--color-slate-500)}.dark\\:border-slate-600:where(.dark,.dark *){border-color:var(--color-slate-600)}.dark\\:border-slate-700:where(.dark,.dark *){border-color:var(--color-slate-700)}.dark\\:\\!bg-blue-800:where(.dark,.dark *){background-color:var(--color-blue-800)!important}.dark\\:\\!bg-slate-600:where(.dark,.dark *){background-color:var(--color-slate-600)!important}.dark\\:bg-black:where(.dark,.dark *){background-color:var(--color-black)}.dark\\:bg-black\\/25:where(.dark,.dark *){background-color:#00000040}@supports (color:color-mix(in lab,red,red)){.dark\\:bg-black\\/25:where(.dark,.dark *){background-color:color-mix(in oklab,var(--color-black)25%,transparent)}}.dark\\:bg-gray-600:where(.dark,.dark *){background-color:var(--color-gray-600)}.dark\\:bg-slate-500:where(.dark,.dark *){background-color:var(--color-slate-500)}.dark\\:bg-slate-600:where(.dark,.dark *){background-color:var(--color-slate-600)}.dark\\:bg-slate-700:where(.dark,.dark *){background-color:var(--color-slate-700)}.dark\\:bg-slate-800:where(.dark,.dark *){background-color:var(--color-slate-800)}.dark\\:bg-slate-900:where(.dark,.dark *){background-color:var(--color-slate-900)}.dark\\:\\!text-gray-600:where(.dark,.dark *){color:var(--color-gray-600)!important}.dark\\:text-gray-400:where(.dark,.dark *){color:var(--color-gray-400)}.dark\\:text-slate-200:where(.dark,.dark *){color:var(--color-slate-200)}.dark\\:text-slate-300:where(.dark,.dark *){color:var(--color-slate-300)}.dark\\:text-slate-400:where(.dark,.dark *){color:var(--color-slate-400)}.dark\\:text-slate-500:where(.dark,.dark *){color:var(--color-slate-500)}.dark\\:text-slate-600:where(.dark,.dark *){color:var(--color-slate-600)}@media (hover:hover){.dark\\:group-hover\\:bg-blue-400:where(.dark,.dark *):is(:where(.group):hover *){background-color:var(--color-blue-400)}.dark\\:hover\\:border-slate-300:where(.dark,.dark *):hover{border-color:var(--color-slate-300)}.dark\\:hover\\:bg-slate-500:where(.dark,.dark *):hover{background-color:var(--color-slate-500)}.dark\\:hover\\:bg-slate-600:where(.dark,.dark *):hover{background-color:var(--color-slate-600)}.dark\\:hover\\:bg-slate-700:where(.dark,.dark *):hover{background-color:var(--color-slate-700)}.dark\\:hover\\:text-slate-100:where(.dark,.dark *):hover{color:var(--color-slate-100)}.dark\\:hover\\:text-slate-200:where(.dark,.dark *):hover{color:var(--color-slate-200)}.dark\\:hover\\:text-slate-300:where(.dark,.dark *):hover{color:var(--color-slate-300)}.dark\\:hover\\:text-slate-400:where(.dark,.dark *):hover{color:var(--color-slate-400)}}}.prism-code-editor{background:var(--editor__bg);--_pse:var(--padding-inline,.75em);--_ns:var(--number-spacing,.75em);--padding-left:var(--_pse);--_sp:var(--pce-scroll-padding,2ch);scroll-padding:var(--_sp);-webkit-user-select:none;user-select:none;isolation:isolate;white-space:pre;line-height:1.4;display:grid;overflow:auto}.show-line-numbers{--padding-left:calc(var(--_pse) + var(--number-width) + var(--_ns));scroll-padding-left:calc(var(--padding-left) + var(--_sp));grid:1fr/0 1fr}.pce-wrapper{pointer-events:none;-webkit-text-size-adjust:none;-moz-text-size-adjust:none;text-size-adjust:none;margin:.5em 0;position:relative}.pce-textarea{all:unset;box-sizing:border-box;color:#0000;-webkit-user-select:auto;user-select:auto;pointer-events:auto;width:100%;height:100%;overflow:hidden}.pce-textarea::selection{background:var(--pce-selection);color:#0000}.pce-no-selection textarea:focus{z-index:1}.pce-line,.pce-textarea{padding:0 var(--_pse)0 var(--padding-left);position:relative}.show-line-numbers .pce-line:before{content:attr(data-line);margin:0 0 0 calc(-1*var(--padding-left));padding:0 var(--_ns)0 0;box-sizing:border-box;color:var(--editor__line-number);text-align:end;display:inline-block}.show-line-numbers:before{content:"";background:inherit;pointer-events:none}.show-line-numbers:before,.pce-line:before{z-index:2;height:100%;width:var(--padding-left);position:sticky;left:0}.pce-wrap .pce-line:before{margin:0;position:absolute}.pce-overlays,.pce-overlays>*,pre.pce-guides .pce-line:after,.pce-no-selection .active-line:after,.active-line.match-highlight:after{content:"";position:absolute;inset:0}.show-line-numbers .pce-line:after{left:var(--padding-left)}.active-line:after{border:var(--editor__border-highlight);background:var(--editor__bg-highlight);z-index:-2}.pce-wrap{white-space:pre-wrap;word-break:break-word}.selection-matches span{background:var(--editor__bg-selection-match)}.pce-nowrap .active-bracket{display:inline-block}@media (hover:hover){.prism-code-editor::-webkit-scrollbar-corner{background:0 0}.prism-code-editor::-webkit-scrollbar-track{background:0 0}.prism-code-editor ::-webkit-scrollbar-corner{background:0 0}.prism-code-editor ::-webkit-scrollbar-track{background:0 0}.prism-code-editor::-webkit-scrollbar{width:1em;height:1em}.prism-code-editor ::-webkit-scrollbar{width:1em;height:1em}.prism-code-editor::-webkit-scrollbar-thumb{background:hsla(var(--editor__bg-scrollbar),.36);width:2em;height:2em}.prism-code-editor ::-webkit-scrollbar-thumb{background:hsla(var(--editor__bg-scrollbar),.36);width:2em;height:2em}.prism-code-editor::-webkit-scrollbar-thumb:hover{background:hsla(var(--editor__bg-scrollbar),.5)}.prism-code-editor ::-webkit-scrollbar-thumb:hover{background:hsla(var(--editor__bg-scrollbar),.5)}.prism-code-editor::-webkit-scrollbar-thumb:active{background:hsla(var(--editor__bg-scrollbar),.66)}.prism-code-editor ::-webkit-scrollbar-thumb:active{background:hsla(var(--editor__bg-scrollbar),.66)}}.form-input,.form-textarea,.form-select,.form-multiselect{font-size:13px;line-height:19.5px}mark{background-color:#f9ceaf}.markdown-content{line-height:1.2em}.markdown-content a{text-decoration:underline}.markdown-content pre,.markdown-content code{font-family:Menlo,monospace;font-size:11px}.markdown-content pre{margin-bottom:.5em}.markdown-content h1,.markdown-content h2,.markdown-content h3,.markdown-content h4{margin-bottom:.5em;font-weight:700}.markdown-content p{margin-bottom:.5em;list-style:outside}.markdown-content ul{margin-bottom:.5em;margin-left:2em;list-style:outside}.markdown-content ol{margin-bottom:.5em;margin-left:2em;list-style:decimal}.code-editor-light .prism-code-editor{caret-color:#24292e;--editor__bg:#fff;--widget__border:#bfbfbf;--widget__bg:#f6f8fa;--widget__color:#434d56;--widget__color-active:#000;--widget__color-options:#5a6772;--widget__bg-input:#fafbfc;--widget__bg-hover:#b8b8b84f;--widget__bg-active:#2188ff33;--widget__focus-ring:#007acc;--search__bg-find:#ffdf5d66;--widget__bg-error:#f2dede;--widget__error-ring:#be1100;--editor__bg-highlight:#f6f8fa;--editor__bg-selection-match:#34d05840;--editor__line-number:#1b1f2380;--editor__bg-scrollbar:210,7%,55%;--editor__bg-fold:#656d76;--bg-guide-indent:#1f23281f;--pce-ac-icon-class:#953800;--pce-ac-icon-constant:#116329;--pce-ac-icon-enum:#953800;--pce-ac-icon-event:#57606a;--pce-ac-icon-function:#6639ba;--pce-ac-icon-interface:#953800;--pce-ac-icon-keyword:#a40e26;--pce-ac-icon-namespace:#a40e26;--pce-ac-icon-parameter:#0a3069;--pce-ac-icon-property:#953800;--pce-ac-icon-snippet:#0550ae;--pce-ac-icon-text:#0a3069;--pce-ac-icon-unit:#0550ae;--pce-ac-icon-variable:#953800;--pce-ac-match:#0066bf;--pce-tabstop:#0a326433;--pce-invisibles:#3333;--pce-selection:#add6ff;color-scheme:light;font-family:Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace}.code-editor-light .pce-match{--search__bg-find:#e9e5ba}.code-editor-light .active-line{--editor__line-number:#1f2328}.code-editor-light .active-indent{--bg-guide-indent:#1f23284d}.code-editor-light [class*=language-],.code-editor-light .language-markdown .url>.operator,.code-editor-light .token.attr-equals,.code-editor-light .token.punctuation{color:#24292e}.code-editor-light .token.atrule,.code-editor-light .token.variable,.code-editor-light .language-css .token.url,.code-editor-light .token.parameter,.code-editor-light .token.list.punctuation,.code-editor-light .token.maybe-class-name,.code-editor-light .token.class-name{color:#e36209}.code-editor-light .token.keyword,.code-editor-light .token.atrule .rule,.code-editor-light .token.unit,.code-editor-light .token.deleted,.code-editor-light .token.entity,.code-editor-light .token.selector .combinator,.code-editor-light .token.regex-flags,.code-editor-light .token.token.anchor,.code-editor-light .token.number.quantifier,.code-editor-light .token.operator{color:#d73a49}.code-editor-light .token.tag,.code-editor-light .token.inserted,.code-editor-light .token.selector,.code-editor-light .token.doctype-tag,.code-editor-light .language-regex .escape{color:#22863a}.code-editor-light .token.selector .class,.code-editor-light .token.selector .id,.code-editor-light .token.pseudo-class,.code-editor-light .token.pseudo-element,.code-editor-light .token.function{color:#6f42c1}.code-editor-light .token.attr-value,.code-editor-light .token.string,.code-editor-light .token.char,.code-editor-light .token.regex,.code-editor-light .language-regex,.code-editor-light .token.string-property,.code-editor-light .language-markdown .url .content,.code-editor-light .language-markdown .url .variable{color:#032f62}.code-editor-light .token.code.keyword{color:#24292e}.code-editor-light .token.attr-name,.code-editor-light .language-css .token.property,.code-editor-light .token.number,.code-editor-light .token.constant,.code-editor-light .token.color,.code-editor-light .token.boolean,.code-editor-light .token.title.important,.code-editor-light .title.important .punctuation,.code-editor-light .token.property-access,.code-editor-light .token.char-class,.code-editor-light .token.char-set,.code-editor-light .token.doctype,.code-editor-light .token.builtin,.code-editor-light .token.regex .punctuation,.code-editor-light .language-css .token.function,.code-editor-light .token.code-snippet.code{color:#005cc5}.code-editor-light .token.comment,.code-editor-light .token.prolog,.code-editor-light .token.cdata{color:#6a737d}.code-editor-light .token.important,.code-editor-light .token.bold{font-weight:700}.code-editor-light .token.italic{font-style:italic}.code-editor-light .token.bracket-level-0,.code-editor-light .token.bracket-level-6{color:#0366d6}.code-editor-light .token.bracket-level-1,.code-editor-light .token.bracket-level-7{color:#138934}.code-editor-light .token.bracket-level-2,.code-editor-light .token.bracket-level-8{color:#b37700}.code-editor-light .token.bracket-level-3,.code-editor-light .token.bracket-level-9{color:#cb2431}.code-editor-light .token.bracket-level-4,.code-editor-light .token.bracket-level-10{color:#a43276}.code-editor-light .token.bracket-level-5,.code-editor-light .token.bracket-level-11{color:#8a3ddb}.code-editor-light .token.interpolation-punctuation{color:#032f62}.code-editor-light .token.bracket-error{color:#ff1212cc}.code-editor-light .token.markup-bracket{color:inherit}.code-editor-light .active-bracket{box-shadow:inset 0 0 0 1px #34d05899,inset 0 0 0 9in #35d05940}.code-editor-light .active-tagname,.code-editor-light .word-matches span{box-shadow:inset 0 0 0 1px #afb8c199,inset 0 0 0 9in #eaeef280}.code-editor-dark .prism-code-editor{caret-color:#2f81f7;--editor__bg:#0d1117;--widget__border:#303741;--widget__bg:#161b22;--widget__color:#b8bfc7;--widget__color-active:#fff;--widget__color-options:#7d8590;--widget__bg-input:#0d1117;--widget__bg-hover:#5a5d5e4f;--widget__bg-active:#1f6feb66;--widget__focus-ring:#007acc;--search__bg-find:#f2cc6080;--widget__bg-error:#5a1d1d;--widget__error-ring:#be1100;--editor__bg-highlight:#6e76811a;--editor__bg-selection-match:#3fb95040;--editor__line-number:#6e7681;--editor__bg-scrollbar:210,10%,32%;--editor__bg-fold:#7d8590;--bg-guide-indent:#e6edf31f;--pce-ac-icon-class:#f0883e;--pce-ac-icon-enum:#f0883e;--pce-ac-icon-event:#6e7681;--pce-ac-icon-function:#bc8cff;--pce-ac-icon-interface:#f0883e;--pce-ac-icon-keyword:#ff7b72;--pce-ac-icon-namespace:#ff7b72;--pce-ac-icon-parameter:#79c0ff;--pce-ac-icon-property:#f0883e;--pce-ac-icon-snippet:#58a6ff;--pce-ac-icon-text:#79c0ff;--pce-ac-icon-unit:#58a6ff;--pce-ac-icon-variable:#f0883e;--pce-selection:#264f78;color-scheme:dark;font-family:Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace}.code-editor-dark .pce-match{--search__bg-find:#8c8d6c}.code-editor-dark .active-line{--editor__line-number:#e6edf3}.code-editor-dark .active-indent{--bg-guide-indent:#e6edf33d}.code-editor-dark [class*=language-],.code-editor-dark .language-markdown .url>.operator,.code-editor-dark .token.punctuation,.code-editor-dark .token.attr-equals,.code-editor-dark .token.code.keyword{color:#e6edf3}.code-editor-dark .token.atrule,.code-editor-dark .token.variable,.code-editor-dark .language-css .token.url,.code-editor-dark .token.parameter,.code-editor-dark .token.list.punctuation,.code-editor-dark .token.class-name,.code-editor-dark .token.maybe-class-name{color:#ffa657}.code-editor-dark .token.atrule .rule,.code-editor-dark .token.unit,.code-editor-dark .token.selector .combinator,.code-editor-dark .token.operator,.code-editor-dark .token.deleted,.code-editor-dark .token.entity,.code-editor-dark .token.regex-flags,.code-editor-dark .token.token.anchor,.code-editor-dark .token.number.quantifier,.code-editor-dark .token.keyword{color:#ff7b72}.code-editor-dark .token.tag,.code-editor-dark .token.inserted,.code-editor-dark .token.selector,.code-editor-dark .token.doctype-tag,.code-editor-dark .language-regex .escape{color:#7ee787}.code-editor-dark .token.attr-value,.code-editor-dark .token.string,.code-editor-dark .token.char,.code-editor-dark .token.regex,.code-editor-dark .language-regex,.code-editor-dark .token.string-property,.code-editor-dark .language-markdown .url .content,.code-editor-dark .language-markdown .url .variable{color:#a5d6ff}.code-editor-dark .token.builtin,.code-editor-dark .token.selector .class,.code-editor-dark .token.selector .id,.code-editor-dark .token.pseudo-class,.code-editor-dark .token.pseudo-element,.code-editor-dark .token.attr-name,.code-editor-dark .language-css .token.property,.code-editor-dark .token.number,.code-editor-dark .token.color,.code-editor-dark .token.boolean,.code-editor-dark .token.constant,.code-editor-dark .token.title.important,.code-editor-dark .title.important .punctuation,.code-editor-dark .language-css .token.function,.code-editor-dark .token.code-snippet.code,.code-editor-dark .token.doctype,.code-editor-dark .token.property-access,.code-editor-dark .token.keyword-null,.code-editor-dark .token.keyword-this,.code-editor-dark .token.char-class,.code-editor-dark .token.char-set,.code-editor-dark .token.regex .punctuation{color:#79c0ff}.code-editor-dark .token.function{color:#d2a8ff}.code-editor-dark .token.comment,.code-editor-dark .token.prolog,.code-editor-dark .token.cdata{color:#8b949e}.code-editor-dark .token.important,.code-editor-dark .token.bold{font-weight:700}.code-editor-dark .token.italic{font-style:italic}.code-editor-dark .token.bracket-level-0,.code-editor-dark .token.bracket-level-6{color:#79c0ff}.code-editor-dark .token.bracket-level-1,.code-editor-dark .token.bracket-level-7{color:#56d364}.code-editor-dark .token.bracket-level-2,.code-editor-dark .token.bracket-level-8{color:#e3b341}.code-editor-dark .token.bracket-level-3,.code-editor-dark .token.bracket-level-9{color:#ffa198}.code-editor-dark .token.bracket-level-4,.code-editor-dark .token.bracket-level-10{color:#ff9bce}.code-editor-dark .token.bracket-level-5,.code-editor-dark .token.bracket-level-11{color:#d2a8ff}.code-editor-dark .token.interpolation-punctuation{color:#a5d6ff}.code-editor-dark .token.bracket-error{color:#7d8590}.code-editor-dark .token.markup-bracket{color:inherit}.code-editor-dark .active-bracket{box-shadow:inset 0 0 0 1px #3fb95099,inset 0 0 0 9in #3fb95040}.code-editor-dark .active-tagname,.code-editor-dark .word-matches span{box-shadow:inset 0 0 0 1px #6e768199,inset 0 0 0 9in #6e768180}@property --tw-rotate-x{syntax:"*";inherits:false}@property --tw-rotate-y{syntax:"*";inherits:false}@property --tw-rotate-z{syntax:"*";inherits:false}@property --tw-skew-x{syntax:"*";inherits:false}@property --tw-skew-y{syntax:"*";inherits:false}@property --tw-space-y-reverse{syntax:"*";inherits:false;initial-value:0}@property --tw-border-style{syntax:"*";inherits:false;initial-value:solid}@property --tw-leading{syntax:"*";inherits:false}@property --tw-font-weight{syntax:"*";inherits:false}@property --tw-ordinal{syntax:"*";inherits:false}@property --tw-slashed-zero{syntax:"*";inherits:false}@property --tw-numeric-figure{syntax:"*";inherits:false}@property --tw-numeric-spacing{syntax:"*";inherits:false}@property --tw-numeric-fraction{syntax:"*";inherits:false}@property --tw-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-shadow-color{syntax:"*";inherits:false}@property --tw-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-inset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-shadow-color{syntax:"*";inherits:false}@property --tw-inset-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-ring-color{syntax:"*";inherits:false}@property --tw-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-inset-ring-color{syntax:"*";inherits:false}@property --tw-inset-ring-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-ring-inset{syntax:"*";inherits:false}@property --tw-ring-offset-width{syntax:"<length>";inherits:false;initial-value:0}@property --tw-ring-offset-color{syntax:"*";inherits:false;initial-value:#fff}@property --tw-ring-offset-shadow{syntax:"*";inherits:false;initial-value:0 0 #0000}@property --tw-blur{syntax:"*";inherits:false}@property --tw-brightness{syntax:"*";inherits:false}@property --tw-contrast{syntax:"*";inherits:false}@property --tw-grayscale{syntax:"*";inherits:false}@property --tw-hue-rotate{syntax:"*";inherits:false}@property --tw-invert{syntax:"*";inherits:false}@property --tw-opacity{syntax:"*";inherits:false}@property --tw-saturate{syntax:"*";inherits:false}@property --tw-sepia{syntax:"*";inherits:false}@property --tw-drop-shadow{syntax:"*";inherits:false}@property --tw-drop-shadow-color{syntax:"*";inherits:false}@property --tw-drop-shadow-alpha{syntax:"<percentage>";inherits:false;initial-value:100%}@property --tw-drop-shadow-size{syntax:"*";inherits:false}@property --tw-ease{syntax:"*";inherits:false}@property --tw-outline-style{syntax:"*";inherits:false;initial-value:solid}`;
class Uq {
  component;
  container;
  currentProps;
  constructor(e, r) {
    this.currentProps = { ...r }, this.container = document.createElement("div"), this.container.style.display = "flex", this.container.style.width = "100%", this.container.style.height = "100%", e.appendChild(this.container);
    let n = this.container.attachShadow({ mode: "open" }), i = document.createElement("style");
    i.innerText = Pq, n.appendChild(i);
    let a = document.createElement("div");
    a.style.display = "flex", a.style.width = "100%", a.style.height = "100%", n.appendChild(a), this.component = Ww({ component: Dq, target: a, props: r });
  }
  update(e) {
    let r = {};
    for (let n in e)
      e[n] !== this.currentProps[n] && (r[n] = e[n], this.currentProps[n] = e[n]);
    this.component.$set(r);
  }
  destroy() {
    this.component.$destroy(), this.container.remove();
  }
}
async function Wq(t, e, r = []) {
  let n = new H3(t, e), i = await n.columnDescriptions();
  return n.defaultPlots(i.filter((a) => r.indexOf(a.name) < 0));
}
export {
  Wq as J,
  Uq as K
};
